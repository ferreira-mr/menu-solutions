<?php

namespace Tests\Feature\Api;

use App\Enums\UserRole;
use App\Models\Aluno;
use App\Models\Categoria;
use App\Models\Contagem;
use App\Models\ControleDeProducaoEConsumo;
use App\Models\Turma;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Hash;
use Tests\TestCase;

class ResourceContractsTest extends TestCase
{
    use RefreshDatabase;

    public function test_civil_dates_are_serialized_without_a_time_component(): void
    {
        $nutri = User::factory()->create([
            'nif' => '20000000031',
            'nivel_user' => UserRole::Nutri->value,
            'password' => Hash::make('password123'),
        ]);
        $category = Categoria::create(['nome_categoria' => 'Fundamental 1']);
        $class = Turma::create(['nome_turma' => '1º Ano A', 'categorias_id' => $category->id]);
        $count = Contagem::create([
            'turmas_id' => $class->id,
            'qtd_contagem' => 12,
            'data_contagem' => '2026-09-07',
            'hora_contagem' => '07:15:00',
            'users_id' => $nutri->id,
        ]);
        $student = Aluno::create([
            'nome' => 'Ana Silva',
            'genero' => 'Feminino',
            'turmas_id' => $class->id,
            'data_nascimento' => '2015-03-12',
            'rm' => 'RM10031',
        ]);
        $production = ControleDeProducaoEConsumo::create([
            'nome_alimento' => 'Arroz de teste',
            'data_alimento' => '2026-09-07',
            'quantidade_alimento' => 10,
            'medida_alimento' => 'kg',
            'pessoas_alimento' => 12,
            'sobra_limpa_alimento' => 1,
            'desperdicio_alimento' => 0.5,
        ]);
        $token = $nutri->createToken('resource-contracts')->plainTextToken;

        $this->withToken($token)->getJson("/api/contagens/{$count->id}")
            ->assertOk()
            ->assertJsonPath('data.data_contagem', '2026-09-07')
            ->assertJsonPath('data.qtd_contagem', 12);

        $this->withToken($token)->getJson('/api/contagens/dashboard?data=2026-09-07')
            ->assertOk()
            ->assertJsonPath('data.0.turmas.0.data_contagem', '2026-09-07');

        $this->withToken($token)->getJson("/api/alunos/{$student->id}")
            ->assertOk()
            ->assertJsonPath('data.data_nascimento', '2015-03-12')
            ->assertJsonPath('data.created_at', fn ($value) => is_string($value) && str_contains($value, 'T'));

        $this->withToken($token)->getJson("/api/controle_de_producao/{$production->id}")
            ->assertOk()
            ->assertJsonPath('data.data_alimento', '2026-09-07')
            ->assertJsonPath('data.quantidade_alimento', '10.00');
    }

    public function test_nullable_civil_dates_are_serialized_as_null(): void
    {
        $student = new Aluno([
            'nome' => 'Aluno sem nascimento',
            'data_nascimento' => null,
        ]);

        $this->assertNull((new \App\Http\Resources\AlunoResource($student))->resolve()['data_nascimento']);
    }
}
