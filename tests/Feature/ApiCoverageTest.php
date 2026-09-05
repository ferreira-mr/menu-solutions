<?php

namespace Tests\Feature;

use App\Models\Aluno;
use App\Models\AlunosHasNecessidade;
use App\Models\Cardapio;
use App\Models\Categoria;
use App\Models\Chat;
use App\Models\Cronograma;
use App\Models\Necessidade;
use App\Models\Turma;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\File;
use Illuminate\Support\Facades\Hash;
use Tests\TestCase;

class ApiCoverageTest extends TestCase
{
    use RefreshDatabase;

    private function user(int $level = 1): User
    {
        return User::factory()->create(['nivel_user' => $level]);
    }

    private function token(User $user): string
    {
        return $user->createToken('test')->plainTextToken;
    }

    private function api(User $user)
    {
        return $this->actingAs($user, 'sanctum');
    }

    public function test_registration_login_current_user_and_logout(): void
    {
        $payload = [
            'name' => 'Usuário novo',
            'email' => 'novo@example.test',
            'nif' => '12345678901',
            'password' => 'password123',
            'password_confirmation' => 'password123',
        ];

        $this->postJson('/api/register', $payload)->assertCreated();
        $user = User::where('nif', $payload['nif'])->firstOrFail();
        $this->assertSame(1, $user->nivel_user);

        $login = $this->postJson('/api/login', [
            'nif' => $payload['nif'],
            'password' => $payload['password'],
        ])->assertOk()->json('token');

        $this->withHeader('Authorization', 'Bearer '.$login)
            ->getJson('/api/user')
            ->assertOk()
            ->assertJsonMissingPath('password');

        $this->withHeader('Authorization', 'Bearer '.$login)
            ->postJson('/api/logout')
            ->assertOk();
        $this->assertDatabaseMissing('personal_access_tokens', [
            'token' => hash('sha256', explode('|', $login, 2)[1]),
        ]);
    }

    public function test_registration_requires_password_confirmation(): void
    {
        $this->postJson('/api/register', [
            'name' => 'Usuário',
            'email' => 'sem-confirmacao@example.test',
            'nif' => '12345678902',
            'password' => 'password123',
        ])->assertUnprocessable();
    }

    public function test_nutritionist_is_the_administrator_and_can_create_director(): void
    {
        $admin = $this->user(2);
        $directorResponse = $this->api($admin)->postJson('/api/users', [
            'name' => 'Diretor',
            'email' => 'diretor@example.test',
            'nif' => '98765432109',
            'nivel_user' => 3,
            'password' => 'password123',
            'password_confirmation' => 'password123',
        ])->assertCreated();

        $directorResponse->assertJsonPath('data.nivel_user', 3);
        $director = User::where('nif', '98765432109')->firstOrFail();

        $this->api($director)->postJson('/api/categorias', ['nome_categoria' => 'Não permitido'])
            ->assertForbidden();
        $this->api($admin)->postJson('/api/categorias', ['nome_categoria' => 'Permitido'])
            ->assertCreated();
        $this->api($director)->getJson('/api/users')->assertForbidden();
    }

    public function test_staff_can_read_but_cannot_use_administrator_routes(): void
    {
        $staff = $this->user(1);
        $this->api($staff)->getJson('/api/categorias')->assertOk();
        $this->api($staff)->postJson('/api/categorias', ['nome_categoria' => 'X'])->assertForbidden();
        $this->api($staff)->postJson('/api/users', [])->assertForbidden();
    }

    public function test_category_class_student_and_need_relationship_flow(): void
    {
        $admin = $this->user(2);
        $api = $this->api($admin);

        $categoria = Categoria::factory()->create();
        $turma = Turma::factory()->create(['categorias_id' => $categoria->id]);
        $aluno = $api->postJson('/api/alunos', [
            'nome' => 'Aluno',
            'genero' => 'Não informado',
            'turmas_id' => $turma->id,
            'data_nascimento' => '2018-01-02',
            'rm' => 'RM000001',
        ])->assertCreated()->json('data.id');
        $necessidade = $api->postJson('/api/necessidades', ['necessidade' => 'Alergia'])
            ->assertCreated()->json('data.id');

        $api->postJson("/api/alunos/$aluno/necessidades", ['necessidades' => [$necessidade]])
            ->assertOk()
            ->assertJsonPath('data.necessidades.0.id', $necessidade);

        $pivot = AlunosHasNecessidade::where('alunos_id', $aluno)
            ->where('necessidades_id', $necessidade)->firstOrFail();
        $cronograma = $api->postJson('/api/cronogramas', ['dia' => 'Segunda'])
            ->assertCreated()->json('data.id');
        $api->postJson("/api/alunos-necessidades/$pivot->id/dias", ['dias' => [$cronograma]])
            ->assertOk();

        $this->api($admin)->deleteJson("/api/categorias/$categoria->id")->assertStatus(409);
        $this->api($admin)->deleteJson("/api/alunos/$aluno")->assertStatus(409);
        $this->api($admin)->deleteJson("/api/necessidades/$necessidade/alunos", ['alunos' => $aluno])
            ->assertNoContent();
        $this->api($admin)->deleteJson("/api/alunos/$aluno")->assertNoContent();
    }

    public function test_counting_and_dashboard_use_server_audit_fields(): void
    {
        $admin = $this->user(2);
        $turma = Turma::factory()->create();
        $response = $this->api($admin)->postJson('/api/contagens', [
            'turmas_id' => $turma->id,
            'qtd_contagem' => 12,
            'data_contagem' => '2000-01-01',
            'users_id' => $this->user(1)->id,
        ])->assertCreated();

        $response->assertJsonPath('data.turmas_id', $turma->id);
        $this->assertDatabaseHas('contagens', [
            'turmas_id' => $turma->id,
            'users_id' => $admin->id,
            'data_contagem' => now()->toDateString(),
        ]);
        $this->api($admin)->getJson('/api/contagens/dashboard?data=not-a-date')
            ->assertUnprocessable();
        $this->api($admin)->getJson('/api/contagens/dashboard')->assertOk();
    }

    public function test_special_needs_counts_are_restricted_and_cannot_remove_history(): void
    {
        $admin = $this->user(2);
        $aluno = Aluno::factory()->create();
        $necessidade = Necessidade::factory()->create();
        $pivot = AlunosHasNecessidade::create([
            'alunos_id' => $aluno->id,
            'necessidades_id' => $necessidade->id,
        ]);
        $count = $this->api($admin)->postJson('/api/contagem-nes', [
            'alunos_has_necessidades_id' => $pivot->id,
        ])->assertCreated()->json('data.id');

        $this->api($this->user(1))->postJson('/api/contagem-nes', [
            'alunos_has_necessidades_id' => $pivot->id,
        ])->assertCreated();

        $this->api($this->user(3))->postJson('/api/contagem-nes', [
            'alunos_has_necessidades_id' => $pivot->id,
        ])->assertForbidden();
        $this->api($admin)->deleteJson("/api/necessidades/$necessidade->id/alunos", ['alunos' => $aluno->id])
            ->assertStatus(409);
        $this->assertDatabaseHas('contagem_nes', ['id' => $count]);
    }

    public function test_chat_owns_authoring_and_server_sets_metadata(): void
    {
        $author = $this->user(1);
        $other = $this->user(1);
        $chatId = $this->api($author)->postJson('/api/chats', [
            'mensagem_chat' => 'Mensagem',
            'visto' => 's',
            'data' => '2000-01-01',
        ])->assertCreated()->json('data.id');

        $this->assertDatabaseHas('chat', ['id' => $chatId, 'users_id' => $author->id, 'visto' => 'n']);
        $this->api($other)->putJson("/api/chats/$chatId", ['mensagem_chat' => 'Não permitido'])
            ->assertForbidden();
        $this->api($author)->putJson("/api/chats/$chatId", ['mensagem_chat' => 'Editada'])
            ->assertOk();
        $this->api($author)->deleteJson("/api/chats/$chatId")->assertNoContent();
    }

    public function test_director_is_limited_to_authorized_cards(): void
    {
        $director = $this->user(3);
        $admin = $this->user(2);
        $this->api($director)->postJson('/api/autorizados', [
            'titulo' => 'Card',
            'conteudo' => 'Conteúdo',
        ])->assertForbidden();

        $id = $this->api($admin)->postJson('/api/autorizados', [
            'titulo' => 'Card',
            'conteudo' => 'Conteúdo',
        ])->assertCreated()->json('data.id');

        $this->api($director)->putJson("/api/autorizados/update/$id", ['status' => 'confirmado'])
            ->assertOk()->assertJsonPath('data.status', 'confirmado');
        $this->api($director)->putJson("/api/autorizados/$id", ['status' => 'pendente'])
            ->assertForbidden();
        $this->api($admin)->putJson("/api/autorizados/$id", ['status' => 'pendente'])
            ->assertOk();
        $this->api($director)->deleteJson("/api/autorizados/$id")->assertForbidden();
    }

    public function test_cardapio_and_uploads_use_safe_generated_names_and_id_binding(): void
    {
        $admin = $this->user(2);
        $pdf = UploadedFile::fake()->create('menu.pdf', 10, 'application/pdf');
        $path = $this->api($admin)->post('/api/upload/pdf', ['file' => $pdf])
            ->assertOk()->json('path');
        $this->assertNotSame('menu.pdf', $path);
        $this->assertTrue(File::exists(public_path('uploads/pdf/'.$path)));

        $cardapio = $this->api($admin)->post('/api/cardapios', [
            'file' => UploadedFile::fake()->create('cardapio.pdf', 10, 'application/pdf'),
        ])->assertCreated()->json('name');
        $model = Cardapio::where('path', $cardapio)->firstOrFail();
        $this->api($this->user(1))->getJson('/api/cardapios/'.$model->id)->assertOk();
        $this->api($admin)->deleteJson('/api/cardapios/'.$model->id)->assertNoContent();
        File::delete(public_path('uploads/pdf/'.$path));
    }

    public function test_production_consumption_validation_matches_database_limits(): void
    {
        $admin = $this->user(2);
        $payload = [
            'nome_alimento' => 'Arroz',
            'data_alimento' => now()->toDateString(),
            'quantidade_alimento' => 10,
            'medida_alimento' => 'kg',
            'pessoas_alimento' => 20,
            'sobra_limpa_alimento' => 1,
            'desperdicio_alimento' => 0,
        ];
        $this->api($admin)->postJson('/api/controle_de_producao', $payload)->assertCreated();
        $this->api($this->user(3))->postJson('/api/controle_de_producao', $payload)->assertForbidden();
        $payload['medida_alimento'] = str_repeat('x', 11);
        $this->api($admin)->postJson('/api/controle_de_producao', $payload)->assertUnprocessable();
    }

    public function test_password_change_revokes_previous_tokens(): void
    {
        $user = $this->user(1);
        $token = $this->token($user);
        $this->withHeader('Authorization', 'Bearer '.$token)->postJson('/api/reset-password', [
            'senha_atual' => 'password',
            'new_password' => 'new-password123',
            'new_password_confirmation' => 'new-password123',
        ])->assertOk();

        $this->assertDatabaseMissing('personal_access_tokens', [
            'token' => hash('sha256', explode('|', $token, 2)[1]),
        ]);
        $this->postJson('/api/login', ['nif' => $user->nif, 'password' => 'new-password123'])
            ->assertOk();
        $this->assertTrue(Hash::check('new-password123', $user->fresh()->password));
    }

    public function test_administrator_can_remove_director_without_removing_self(): void
    {
        $admin = $this->user(2);
        $director = $this->user(3);
        $this->api($admin)->deleteJson('/api/users/'.$director->id)->assertNoContent();
        $this->assertSoftDeleted('users', ['id' => $director->id]);
        $this->api($admin)->deleteJson('/api/users/'.$admin->id)->assertStatus(422);
    }

    public function test_updates_and_dependency_guards_cover_remaining_crud_actions(): void
    {
        $admin = $this->user(2);
        $categoria = Categoria::factory()->create();
        $this->api($admin)->putJson('/api/categorias/'.$categoria->id, [
            'nome_categoria' => 'Categoria atualizada',
        ])->assertOk()->assertJsonPath('data.nome_categoria', 'Categoria atualizada');

        $turma = Turma::factory()->create(['categorias_id' => $categoria->id]);
        $this->api($admin)->putJson('/api/turmas/'.$turma->id, [
            'nome_turma' => 'Turma atualizada',
        ])->assertOk()->assertJsonPath('data.nome_turma', 'Turma atualizada');

        $aluno = Aluno::factory()->create(['turmas_id' => $turma->id]);
        $this->api($admin)->putJson('/api/alunos/'.$aluno->id, [
            'nome' => 'Aluno atualizado',
            'rm' => $aluno->rm,
        ])->assertOk()->assertJsonPath('data.nome', 'Aluno atualizado');

        $necessidade = Necessidade::factory()->create();
        $pivot = AlunosHasNecessidade::create([
            'alunos_id' => $aluno->id,
            'necessidades_id' => $necessidade->id,
        ]);
        $cronograma = Cronograma::factory()->create();
        $this->api($admin)->postJson('/api/alunos-necessidades/'.$pivot->id.'/dias', [
            'dias' => [$cronograma->id],
        ])->assertOk();
        $this->api($admin)->deleteJson('/api/alunos-necessidades/'.$pivot->id.'/dias', [
            'dias' => [$cronograma->id],
        ])->assertOk();

        $this->api($admin)->deleteJson('/api/cronogramas/'.$cronograma->id)->assertNoContent();
        $this->api($admin)->deleteJson('/api/necessidades/'.$necessidade->id)->assertStatus(409);

        $controle = $this->api($admin)->postJson('/api/controle_de_producao', [
            'nome_alimento' => 'Arroz',
            'data_alimento' => now()->toDateString(),
            'quantidade_alimento' => 10,
            'medida_alimento' => 'kg',
            'pessoas_alimento' => 20,
            'sobra_limpa_alimento' => 1,
            'desperdicio_alimento' => 0,
        ])->assertCreated()->json('data.id');
        $this->api($admin)->putJson('/api/controle_de_producao/'.$controle, [
            'pessoas_alimento' => 30,
        ])->assertOk()->assertJsonPath('data.pessoas_alimento', 30);
        $this->api($admin)->deleteJson('/api/controle_de_producao/'.$controle)->assertNoContent();
    }

    public function test_counting_update_window_and_read_pagination(): void
    {
        $admin = $this->user(2);
        $turma = Turma::factory()->create();
        $id = $this->api($admin)->postJson('/api/contagens', [
            'turmas_id' => $turma->id,
            'qtd_contagem' => 5,
        ])->assertCreated()->json('data.id');
        $this->api($admin)->putJson('/api/contagens/'.$id, ['qtd_contagem' => 6])
            ->assertOk()->assertJsonPath('data.qtd_contagem', 6);
        $this->assertSame(405, $this->api($admin)->deleteJson('/api/contagens/'.$id)->status());
        $this->api($admin)->getJson('/api/contagens?date=invalid')->assertUnprocessable();
    }

    public function test_image_upload_validation_and_chat_pagination_contract(): void
    {
        $admin = $this->user(2);
        $this->api($admin)->post('/api/upload', [
            'file' => UploadedFile::fake()->create('document.txt', 10, 'text/plain'),
        ])->assertUnprocessable();

        Chat::factory()->count(3)->create(['users_id' => $admin->id]);
        $this->api($admin)->getJson('/api/chats')
            ->assertOk()
            ->assertJsonStructure(['data', 'links', 'meta']);
        $this->api($admin)->getJson('/api/getMembers')
            ->assertOk()->assertJsonStructure(['data']);
    }
}
