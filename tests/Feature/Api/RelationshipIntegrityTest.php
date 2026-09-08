<?php

namespace Tests\Feature\Api;

use App\Models\Aluno;
use App\Models\AlunosHasNecessidade;
use App\Models\Categoria;
use App\Models\ContagemNe;
use App\Models\Contagen;
use App\Models\Cronograma;
use App\Models\Necessidade;
use App\Models\NecessidadesHasCronograma;
use App\Models\Turma;
use App\Models\User;
use App\Services\SchoolCalendarService;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class RelationshipIntegrityTest extends TestCase
{
    use RefreshDatabase;

    private function nutri(): User
    {
        return User::factory()->create(['nivel_user' => 2]);
    }

    private function student(Turma $turma, int $id = 0): Aluno
    {
        $attributes = [
            'nome' => 'Aluno de Teste',
            'genero' => 'Feminino',
            'turmas_id' => $turma->id,
            'data_nascimento' => '2015-03-12',
            'rm' => 'RM-'.$turma->id.'-'.$id,
        ];

        if ($id > 0) {
            $attributes['id'] = $id;
        }

        return Aluno::forceCreate($attributes);
    }

    public function test_new_links_reject_soft_deleted_parents_on_create_and_update(): void
    {
        $nutri = $this->nutri();
        $activeCategory = Categoria::factory()->create();
        $deletedCategory = Categoria::factory()->create();
        $deletedCategory->delete();

        $this->actingAs($nutri, 'sanctum')
            ->postJson('/api/turmas', [
                'nome_turma' => 'Turma Categoria Excluída',
                'categorias_id' => $deletedCategory->id,
            ])
            ->assertUnprocessable()
            ->assertJsonValidationErrors('categorias_id');

        $deletedTurma = Turma::factory()->create(['categorias_id' => $activeCategory->id]);
        $deletedTurma->delete();
        $activeTurma = Turma::factory()->create(['categorias_id' => $activeCategory->id]);
        $student = $this->student($activeTurma, 101);

        $this->actingAs($nutri, 'sanctum')
            ->postJson('/api/alunos', [
                'nome' => 'Novo aluno',
                'genero' => 'Masculino',
                'turmas_id' => $deletedTurma->id,
                'data_nascimento' => '2016-05-10',
                'rm' => 'RM-DELETED-TURMA',
            ])
            ->assertUnprocessable()
            ->assertJsonValidationErrors('turmas_id');

        $this->actingAs($nutri, 'sanctum')
            ->putJson('/api/alunos/'.$student->id, ['turmas_id' => $deletedTurma->id])
            ->assertUnprocessable()
            ->assertJsonValidationErrors('turmas_id');

        $count = Contagen::factory()->create([
            'turmas_id' => $activeTurma->id,
            'users_id' => $nutri->id,
            'data_contagem' => app(SchoolCalendarService::class)->currentDate(),
        ]);
        $this->actingAs($nutri, 'sanctum')
            ->putJson('/api/contagens/'.$count->id, ['turmas_id' => $deletedTurma->id])
            ->assertUnprocessable()
            ->assertJsonValidationErrors('turmas_id');

        $turmaWithDeletedCategory = Turma::factory()->create(['categorias_id' => $activeCategory->id]);
        $activeCategory->delete();
        $this->actingAs($nutri, 'sanctum')
            ->putJson('/api/turmas/'.$turmaWithDeletedCategory->id, [
                'categorias_id' => $activeCategory->id,
            ])
            ->assertUnprocessable()
            ->assertJsonValidationErrors('categorias_id');

        $deletedNecessidade = Necessidade::factory()->create();
        $deletedNecessidade->delete();
        $this->actingAs($nutri, 'sanctum')
            ->postJson('/api/alunos/'.$student->id.'/necessidades', [
                'necessidades' => [$deletedNecessidade->id],
            ])
            ->assertUnprocessable()
            ->assertJsonValidationErrors('necessidades.0');

        $necessidade = Necessidade::factory()->create();
        $relation = AlunosHasNecessidade::create([
            'alunos_id' => $student->id,
            'necessidades_id' => $necessidade->id,
        ]);
        $deletedSchedule = Cronograma::factory()->create();
        $deletedSchedule->delete();

        $this->actingAs($nutri, 'sanctum')
            ->postJson('/api/alunos-necessidades/'.$relation->id.'/dias', [
                'dias' => [$deletedSchedule->id],
            ])
            ->assertUnprocessable()
            ->assertJsonValidationErrors('dias.0');

        $this->actingAs($nutri, 'sanctum')
            ->deleteJson('/api/alunos-necessidades/'.$relation->id.'/dias', [
                'dias' => [$deletedSchedule->id],
            ])
            ->assertUnprocessable()
            ->assertJsonValidationErrors('dias.0');

        $this->assertDatabaseMissing('necessidades_has_cronograma', [
            'alunos_has_necessidades_id' => $relation->id,
            'cronograma_id' => $deletedSchedule->id,
        ]);
    }

    public function test_presence_rejects_a_relation_with_either_soft_deleted_parent(): void
    {
        $nutri = $this->nutri();
        $turma = Turma::factory()->create();
        $student = $this->student($turma, 102);
        $necessidade = Necessidade::factory()->create();
        $relation = AlunosHasNecessidade::create([
            'alunos_id' => $student->id,
            'necessidades_id' => $necessidade->id,
        ]);

        $student->delete();
        $this->actingAs($nutri, 'sanctum')
            ->postJson('/api/contagem-nes', [
                'alunos_has_necessidades_id' => $relation->id,
            ])
            ->assertUnprocessable()
            ->assertJsonValidationErrors('alunos_has_necessidades_id');

        $student->restore();
        $necessidade->delete();
        $this->actingAs($nutri, 'sanctum')
            ->postJson('/api/contagem-nes', [
                'alunos_has_necessidades_id' => $relation->id,
            ])
            ->assertUnprocessable()
            ->assertJsonValidationErrors('alunos_has_necessidades_id');

        $this->assertDatabaseCount('contagem_nes', 0);
    }

    public function test_disable_student_rejects_non_integer_payloads_before_removing_any_relation(): void
    {
        $nutri = $this->nutri();
        $turma = Turma::factory()->create();
        $student = $this->student($turma, 103);
        $otherStudent = $this->student($turma, 104);
        $necessidade = Necessidade::factory()->create();
        $relation = AlunosHasNecessidade::create([
            'alunos_id' => $student->id,
            'necessidades_id' => $necessidade->id,
        ]);

        $invalidPayloads = [
            (string) $student->id.'.9',
            (string) $student->id.'e2',
            [$student->id, $otherStudent->id],
            true,
            ['id' => $student->id],
            'texto',
            0,
            -1,
        ];

        foreach ($invalidPayloads as $payload) {
            $this->actingAs($nutri, 'sanctum')
                ->deleteJson('/api/necessidades/'.$necessidade->id.'/alunos', ['alunos' => $payload])
                ->assertUnprocessable();
        }

        $this->assertDatabaseHas('alunos_has_necessidades', ['id' => $relation->id]);
    }

    public function test_valid_disable_removes_dependents_and_history_keeps_relation(): void
    {
        $nutri = $this->nutri();
        $turma = Turma::factory()->create();
        $cronograma = Cronograma::factory()->create();
        $student = $this->student($turma, 105);
        $necessidade = Necessidade::factory()->create();
        $relation = AlunosHasNecessidade::create([
            'alunos_id' => $student->id,
            'necessidades_id' => $necessidade->id,
        ]);
        $schedule = NecessidadesHasCronograma::create([
            'alunos_has_necessidades_id' => $relation->id,
            'cronograma_id' => $cronograma->id,
        ]);

        $this->actingAs($nutri, 'sanctum')
            ->deleteJson('/api/necessidades/'.$necessidade->id.'/alunos', ['alunos' => [$student->id]])
            ->assertNoContent();

        $this->assertDatabaseMissing('alunos_has_necessidades', ['id' => $relation->id]);
        $this->assertDatabaseMissing('necessidades_has_cronograma', ['id' => $schedule->id]);

        $historicalRelation = AlunosHasNecessidade::create([
            'alunos_id' => $student->id,
            'necessidades_id' => $necessidade->id,
        ]);
        $historicalSchedule = NecessidadesHasCronograma::create([
            'alunos_has_necessidades_id' => $historicalRelation->id,
            'cronograma_id' => $cronograma->id,
        ]);
        $presence = ContagemNe::create([
            'alunos_has_necessidades_id' => $historicalRelation->id,
        ]);

        $this->actingAs($nutri, 'sanctum')
            ->deleteJson('/api/necessidades/'.$necessidade->id.'/alunos', ['alunos' => [$student->id]])
            ->assertConflict();

        $this->assertDatabaseHas('alunos_has_necessidades', ['id' => $historicalRelation->id]);
        $this->assertDatabaseHas('necessidades_has_cronograma', ['id' => $historicalSchedule->id]);
        $this->assertDatabaseHas('contagem_nes', ['id' => $presence->id]);

        $this->actingAs($nutri, 'sanctum')
            ->deleteJson('/api/necessidades/'.$necessidade->id.'/alunos', ['alunos' => [$student->id + 9999]])
            ->assertNotFound();
    }
}
