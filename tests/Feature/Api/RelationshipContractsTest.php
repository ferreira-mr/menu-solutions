<?php

namespace Tests\Feature\Api;

use App\Enums\UserRole;
use App\Models\Aluno;
use App\Models\AlunosHasNecessidade;
use App\Models\Categoria;
use App\Models\ContagemNe;
use App\Models\Cronograma;
use App\Models\Necessidade;
use App\Models\NecessidadesHasCronograma;
use App\Models\Turma;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class RelationshipContractsTest extends TestCase
{
    use RefreshDatabase;

    public function test_need_detail_exposes_the_relationship_id_but_isolated_student_does_not(): void
    {
        $nutri = User::factory()->create(['nivel_user' => UserRole::Nutri->value]);
        $categoria = Categoria::forceCreate([
            'id' => 12,
            'nome_categoria' => 'Fundamental',
        ]);
        $turma = Turma::forceCreate([
            'id' => 12,
            'nome_turma' => '1º Ano A',
            'categorias_id' => $categoria->id,
        ]);
        $aluno = Aluno::forceCreate([
            'id' => 101,
            'nome' => 'Ana de Teste',
            'genero' => 'Feminino',
            'turmas_id' => $turma->id,
            'data_nascimento' => '2015-03-12',
            'rm' => 'RM101',
        ]);
        $necessidade = Necessidade::forceCreate([
            'id' => 7,
            'necessidade' => 'NES',
        ]);
        $relacao = AlunosHasNecessidade::forceCreate([
            'id' => 501,
            'alunos_id' => $aluno->id,
            'necessidades_id' => $necessidade->id,
        ]);

        $this->actingAs($nutri, 'sanctum')
            ->getJson("/api/necessidades/{$necessidade->id}")
            ->assertOk()
            ->assertJsonPath('data.alunos.0.id', $aluno->id)
            ->assertJsonPath('data.alunos.0.alunos_has_necessidades_id', $relacao->id)
            ->assertJsonPath('data.alunos.0.pivot.id', $relacao->id);

        $this->actingAs($nutri, 'sanctum')
            ->getJson("/api/alunos/{$aluno->id}")
            ->assertOk()
            ->assertJsonMissingPath('data.alunos_has_necessidades_id')
            ->assertJsonMissingPath('data.pivot');
    }

    public function test_schedule_detail_keeps_student_relationship_and_appointment_ids_distinct(): void
    {
        $nutri = User::factory()->create(['nivel_user' => UserRole::Nutri->value]);
        $categoria = Categoria::forceCreate([
            'id' => 12,
            'nome_categoria' => 'Fundamental',
        ]);
        $turma = Turma::forceCreate([
            'id' => 12,
            'nome_turma' => '1º Ano A',
            'categorias_id' => $categoria->id,
        ]);
        $aluno = Aluno::forceCreate([
            'id' => 101,
            'nome' => 'Ana de Teste',
            'genero' => 'Feminino',
            'turmas_id' => $turma->id,
            'data_nascimento' => '2015-03-12',
            'rm' => 'RM102',
        ]);
        $necessidade = Necessidade::forceCreate([
            'id' => 7,
            'necessidade' => 'NES',
        ]);
        $relacao = AlunosHasNecessidade::forceCreate([
            'id' => 501,
            'alunos_id' => $aluno->id,
            'necessidades_id' => $necessidade->id,
        ]);
        $cronograma = Cronograma::forceCreate([
            'id' => 3,
            'dia' => 'Segunda',
        ]);
        $agendamento = NecessidadesHasCronograma::forceCreate([
            'id' => 901,
            'alunos_has_necessidades_id' => $relacao->id,
            'cronograma_id' => $cronograma->id,
        ]);

        $this->actingAs($nutri, 'sanctum')
            ->getJson('/api/cronogramas')
            ->assertOk()
            ->assertJsonPath('data.0.id', $cronograma->id)
            ->assertJsonPath('data.0.alunos.0.id', $agendamento->id)
            ->assertJsonPath('data.0.alunos.0.alunos_has_necessidades_id', $relacao->id)
            ->assertJsonPath('data.0.alunos.0.cronograma_id', $cronograma->id)
            ->assertJsonPath('data.0.alunos.0.aluno_has_necessidade.id', $relacao->id)
            ->assertJsonPath('data.0.alunos.0.aluno_has_necessidade.alunos_id', $aluno->id)
            ->assertJsonPath('data.0.alunos.0.aluno_has_necessidade.necessidades_id', $necessidade->id);
    }

    public function test_presence_response_exposes_relation_id_separately_from_student_and_presence_ids(): void
    {
        $nutri = User::factory()->create(['nivel_user' => UserRole::Nutri->value]);
        $categoria = Categoria::forceCreate([
            'id' => 12,
            'nome_categoria' => 'Fundamental',
        ]);
        $turma = Turma::forceCreate([
            'id' => 12,
            'nome_turma' => '1º Ano A',
            'categorias_id' => $categoria->id,
        ]);
        $aluno = Aluno::forceCreate([
            'id' => 101,
            'nome' => 'Ana de Teste',
            'genero' => 'Feminino',
            'turmas_id' => $turma->id,
            'data_nascimento' => '2015-03-12',
            'rm' => 'RM103',
        ]);
        $necessidade = Necessidade::forceCreate([
            'id' => 7,
            'necessidade' => 'NES',
        ]);
        $outraNecessidade = Necessidade::forceCreate([
            'id' => 8,
            'necessidade' => 'Outra NES',
        ]);
        $relacao = AlunosHasNecessidade::forceCreate([
            'id' => 501,
            'alunos_id' => $aluno->id,
            'necessidades_id' => $necessidade->id,
        ]);
        $outraRelacao = AlunosHasNecessidade::forceCreate([
            'id' => 502,
            'alunos_id' => $aluno->id,
            'necessidades_id' => $outraNecessidade->id,
        ]);
        $presenca = ContagemNe::forceCreate([
            'id' => 1201,
            'alunos_has_necessidades_id' => $relacao->id,
        ]);
        $outraPresenca = ContagemNe::forceCreate([
            'id' => 1202,
            'alunos_has_necessidades_id' => $outraRelacao->id,
        ]);

        $data = $this->actingAs($nutri, 'sanctum')
            ->getJson('/api/contagem-nes')
            ->assertOk()
            ->json('data');
        $porId = collect($data)->keyBy('id');

        $this->assertSame($relacao->id, $porId[$presenca->id]['relacao_id']);
        $this->assertSame($aluno->id, $porId[$presenca->id]['aluno_id']);
        $this->assertSame($aluno->id, $porId[$presenca->id]['aluno']['id']);
        $this->assertSame($outraRelacao->id, $porId[$outraPresenca->id]['relacao_id']);
        $this->assertNotSame($porId[$presenca->id]['relacao_id'], $porId[$outraPresenca->id]['relacao_id']);
    }
}
