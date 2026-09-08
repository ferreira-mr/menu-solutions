<?php

namespace Tests\Feature\Api;

use App\Models\Aluno;
use App\Models\Categoria;
use App\Models\Cronograma;
use App\Models\Turma;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class UniquenessContractsTest extends TestCase
{
    use RefreshDatabase;

    private function api(): \Illuminate\Foundation\Testing\TestCase
    {
        return $this->actingAs(
            User::factory()->create(['nivel_user' => 2]),
            'sanctum',
        );
    }

    public function test_aluno_update_rejects_duplicate_rm_and_allows_own_rm(): void
    {
        $turma = Turma::factory()->create();
        $first = Aluno::factory()->create([
            'turmas_id' => $turma->id,
            'rm' => 'RM-UNICO-1',
        ]);
        $second = Aluno::factory()->create([
            'turmas_id' => $turma->id,
            'rm' => 'RM-UNICO-2',
        ]);

        $this->api()
            ->putJson('/api/alunos/'.$second->id, ['rm' => $first->rm])
            ->assertUnprocessable()
            ->assertJsonValidationErrors('rm');

        $this->assertDatabaseHas('alunos', [
            'id' => $second->id,
            'rm' => 'RM-UNICO-2',
        ]);

        $this->api()
            ->putJson('/api/alunos/'.$first->id, ['rm' => $first->rm])
            ->assertOk()
            ->assertJsonPath('data.rm', 'RM-UNICO-1');
    }

    public function test_turma_validates_final_name_and_category_identity(): void
    {
        $categoryA = Categoria::factory()->create();
        $categoryB = Categoria::factory()->create();
        $sameName = Turma::factory()->create([
            'nome_turma' => 'Turma Repetida',
            'categorias_id' => $categoryA->id,
        ]);
        $nameConflict = Turma::factory()->create([
            'nome_turma' => 'Outro Nome',
            'categorias_id' => $categoryA->id,
        ]);
        $destinationConflict = Turma::factory()->create([
            'nome_turma' => 'Outro Nome',
            'categorias_id' => $categoryB->id,
        ]);
        $movable = Turma::factory()->create([
            'nome_turma' => 'Nome Livre',
            'categorias_id' => $categoryA->id,
        ]);

        $this->api()
            ->postJson('/api/turmas', [
                'nome_turma' => 'Turma Repetida',
                'categorias_id' => $categoryA->id,
            ])
            ->assertUnprocessable()
            ->assertJsonValidationErrors('nome_turma');

        $this->api()
            ->putJson('/api/turmas/'.$nameConflict->id, ['nome_turma' => 'Turma Repetida'])
            ->assertUnprocessable()
            ->assertJsonValidationErrors('nome_turma');

        $this->api()
            ->putJson('/api/turmas/'.$sameName->id, ['nome_turma' => 'Turma Repetida'])
            ->assertOk()
            ->assertJsonPath('data.nome_turma', 'Turma Repetida');

        $this->api()
            ->putJson('/api/turmas/'.$movable->id, ['categorias_id' => $categoryB->id])
            ->assertOk();

        $this->api()
            ->putJson('/api/turmas/'.$destinationConflict->id, ['categorias_id' => $categoryA->id])
            ->assertUnprocessable()
            ->assertJsonValidationErrors('categorias_id');

        $this->assertDatabaseHas('turmas', [
            'id' => $destinationConflict->id,
            'categorias_id' => $categoryB->id,
            'nome_turma' => 'Outro Nome',
        ]);
    }

    public function test_cronograma_validates_unique_day_on_create_and_update(): void
    {
        $first = Cronograma::create(['dia' => 'Segunda']);
        $second = Cronograma::create(['dia' => 'Terca']);

        $this->api()
            ->postJson('/api/cronogramas', ['dia' => 'Segunda'])
            ->assertUnprocessable()
            ->assertJsonValidationErrors('dia');

        $this->api()
            ->putJson('/api/cronogramas/'.$second->id, ['dia' => 'Segunda'])
            ->assertUnprocessable()
            ->assertJsonValidationErrors('dia');

        $this->api()
            ->putJson('/api/cronogramas/'.$first->id, ['dia' => 'Segunda'])
            ->assertOk()
            ->assertJsonPath('data.dia', 'Segunda');

        $this->assertDatabaseHas('cronogramas', [
            'id' => $second->id,
            'dia' => 'Terca',
        ]);
    }
}
