<?php

namespace Tests\Feature\BusinessRules;

use App\Enums\UserRole;
use App\Models\Aluno;
use App\Models\AlunosHasNecessidade;
use App\Models\Categoria;
use App\Models\Contagem;
use App\Models\ContagemNe;
use App\Models\Necessidade;
use App\Models\Turma;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Hash;
use Tests\TestCase;

class BackendHomologationBusinessRulesTest extends TestCase
{
    use RefreshDatabase;

    private function user(UserRole|int $role, string $nif = '12345678900'): User
    {
        $roleValue = $role instanceof UserRole ? $role->value : $role;

        return User::factory()->create([
            'nif' => $nif,
            'nivel_user' => $roleValue,
            'password' => Hash::make('password123'),
        ]);
    }

    private function api(User $user)
    {
        $token = $user->createToken('test-token')->plainTextToken;

        return $this->withHeader('Authorization', 'Bearer '.$token);
    }

    public function test_nutritionist_can_update_user_role_and_password(): void
    {
        $nutri = $this->user(UserRole::Nutri, '20000000001');
        $staff = $this->user(UserRole::Staff, '10000000001');

        $response = $this->api($nutri)->putJson("/api/users/{$staff->id}", [
            'name' => 'Inspetora Promovida',
            'nivel_user' => UserRole::Diretor->value,
            'password' => 'nova-senha123',
            'password_confirmation' => 'nova-senha123',
        ]);

        $response->assertOk()
            ->assertJsonPath('data.name', 'Inspetora Promovida')
            ->assertJsonPath('data.nivel_user', UserRole::Diretor->value);

        $staff->refresh();
        $this->assertSame(UserRole::Diretor->value, (int) $staff->nivel_user);
        $this->assertTrue(Hash::check('nova-senha123', $staff->password));

        // Novo login com a senha atualizada funciona
        $this->postJson('/api/login', [
            'nif' => '10000000001',
            'password' => 'nova-senha123',
        ])->assertOk();

        // Senha antiga falha
        $this->postJson('/api/login', [
            'nif' => '10000000001',
            'password' => 'password123',
        ])->assertUnauthorized();
    }

    public function test_non_administrator_cannot_update_other_users(): void
    {
        $staff = $this->user(UserRole::Staff, '10000000002');
        $otherStaff = $this->user(UserRole::Staff, '10000000003');

        $this->api($staff)->putJson("/api/users/{$otherStaff->id}", [
            'name' => 'Tentativa Hacker',
        ])->assertForbidden();
    }

    public function test_user_creation_enforces_unique_nif_and_unique_email(): void
    {
        $nutri = $this->user(UserRole::Nutri, '20000000002');

        $payload = [
            'name' => 'Novo Operador',
            'email' => 'operador1@menusolutions.local',
            'nif' => '55555555555',
            'nivel_user' => UserRole::Staff->value,
            'password' => 'segredo123',
            'password_confirmation' => 'segredo123',
        ];

        $this->api($nutri)->postJson('/api/users', $payload)->assertCreated();

        // Tentativa com mesmo NIF deve falhar com 422
        $this->api($nutri)->postJson('/api/users', array_merge($payload, [
            'email' => 'outro-email@menusolutions.local',
        ]))->assertUnprocessable();

        // Tentativa com mesmo e-mail deve falhar com 422
        $this->api($nutri)->postJson('/api/users', array_merge($payload, [
            'nif' => '66666666666',
        ]))->assertUnprocessable();
    }

    public function test_turma_deletion_is_blocked_when_having_students_or_counts(): void
    {
        $nutri = $this->user(UserRole::Nutri, '20000000003');
        $categoria = Categoria::create(['nome_categoria' => 'Fundamental 1']);
        $turma = Turma::create(['nome_turma' => '3º Ano B', 'categorias_id' => $categoria->id]);

        Aluno::create([
            'nome' => 'Lucas Silva',
            'genero' => 'Masculino',
            'turmas_id' => $turma->id,
            'data_nascimento' => '2016-05-10',
            'rm' => 'RM998877',
        ]);

        $this->api($nutri)->deleteJson("/api/turmas/{$turma->id}")->assertStatus(409);
    }

    public function test_contagem_nes_deletion_allows_today_and_blocks_past(): void
    {
        $nutri = $this->user(UserRole::Nutri, '20000000004');
        $categoria = Categoria::create(['nome_categoria' => 'Ensino Médio']);
        $turma = Turma::create(['nome_turma' => '2º Ano Regular', 'categorias_id' => $categoria->id]);
        $aluno = Aluno::create([
            'nome' => 'Marina Costa',
            'genero' => 'Feminino',
            'turmas_id' => $turma->id,
            'data_nascimento' => '2009-02-15',
            'rm' => 'RM554433',
        ]);
        $necessidade = Necessidade::create(['necessidade' => 'Intolerância a Lactose']);
        $rel = AlunosHasNecessidade::create([
            'alunos_id' => $aluno->id,
            'necessidades_id' => $necessidade->id,
        ]);

        // Registro de hoje
        $contagemHoje = ContagemNe::create([
            'alunos_has_necessidades_id' => $rel->id,
        ]);

        // Pode remover registro de hoje
        $this->api($nutri)->deleteJson("/api/contagem-nes/{$contagemHoje->id}")->assertNoContent();
        $this->assertDatabaseMissing('contagem_nes', ['id' => $contagemHoje->id]);

        // Registro do passado
        $contagemPassada = ContagemNe::create([
            'alunos_has_necessidades_id' => $rel->id,
        ]);
        $contagemPassada->created_at = now()->subDays(2);
        $contagemPassada->saveQuietly();

        // Não pode remover registro passado (RN14)
        $this->api($nutri)->deleteJson("/api/contagem-nes/{$contagemPassada->id}")->assertStatus(400);
    }

    public function test_rn15_dashboard_aggregates_categories_correctly_including_segregated_outros(): void
    {
        $nutri = $this->user(UserRole::Nutri, '20000000005');
        $catRegular = Categoria::create(['nome_categoria' => 'Fundamental 2']);
        $catOutros = Categoria::create(['nome_categoria' => 'Outros']);

        $turmaRegular = Turma::create(['nome_turma' => '7º Ano A', 'categorias_id' => $catRegular->id]);
        $turmaOutros = Turma::create(['nome_turma' => 'Robótica Contraturno', 'categorias_id' => $catOutros->id]);

        $hoje = today()->toDateString();
        Contagem::create([
            'turmas_id' => $turmaRegular->id,
            'qtd_contagem' => 28,
            'data_contagem' => $hoje,
            'hora_contagem' => '07:15:00',
            'users_id' => $nutri->id,
        ]);
        Contagem::create([
            'turmas_id' => $turmaOutros->id,
            'qtd_contagem' => 15,
            'data_contagem' => $hoje,
            'hora_contagem' => '07:20:00',
            'users_id' => $nutri->id,
        ]);

        $response = $this->api($nutri)->getJson("/api/contagens/dashboard?data={$hoje}")->assertOk();

        $dados = collect($response->json('data'));
        $regularItem = $dados->firstWhere('nome_categoria', 'Fundamental 2');
        $outrosItem = $dados->firstWhere('nome_categoria', 'Outros');

        $this->assertNotNull($regularItem);
        $this->assertNotNull($outrosItem);
        $this->assertSame(28, (int) $regularItem['turmas'][0]['qtd_contagem']);
        $this->assertSame(15, (int) $outrosItem['turmas'][0]['qtd_contagem']);
    }
}
