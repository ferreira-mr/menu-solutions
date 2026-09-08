<?php

namespace Tests\Feature\Api;

use App\Enums\UserRole;
use App\Models\User;
use App\Models\Turma;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Symfony\Component\HttpKernel\Exception\ConflictHttpException;
use App\Services\UserService;
use Tests\TestCase;

class UserManagementAuthorizationTest extends TestCase
{
    use RefreshDatabase;

    private function user(UserRole $role): User
    {
        return User::factory()->create(['nivel_user' => $role->value]);
    }

    public function test_director_can_list_create_update_and_delete_users(): void
    {
        $director = $this->user(UserRole::Diretor);
        $staff = $this->user(UserRole::Staff);

        $this->actingAs($director, 'sanctum')
            ->getJson('/api/users')
            ->assertOk()
            ->assertJsonPath('data.0.id', $director->id);

        $created = $this->actingAs($director, 'sanctum')
            ->postJson('/api/users', [
                'name' => 'Nova Inspetora',
                'email' => 'nova.inspetora@example.test',
                'nif' => '90000000001',
                'nivel_user' => UserRole::Staff->value,
                'password' => 'password123',
                'password_confirmation' => 'password123',
            ])
            ->assertCreated()
            ->json('data.id');

        $this->actingAs($director, 'sanctum')
            ->putJson('/api/users/'.$staff->id, ['name' => 'Staff atualizado'])
            ->assertOk()
            ->assertJsonPath('data.name', 'Staff atualizado');

        $this->actingAs($director, 'sanctum')
            ->deleteJson('/api/users/'.$created)
            ->assertNoContent();

        $this->assertSoftDeleted('users', ['id' => $created]);
    }

    public function test_staff_can_edit_self_but_cannot_manage_another_user(): void
    {
        $staff = $this->user(UserRole::Staff);
        $other = $this->user(UserRole::Staff);

        $this->actingAs($staff, 'sanctum')
            ->putJson('/api/users/'.$staff->id, ['name' => 'Meu nome atualizado'])
            ->assertOk();

        $this->actingAs($staff, 'sanctum')
            ->getJson('/api/users')
            ->assertForbidden();

        $this->actingAs($staff, 'sanctum')
            ->putJson('/api/users/'.$other->id, ['name' => 'Tentativa'])
            ->assertForbidden();
    }

    public function test_every_profile_cannot_change_its_own_access_level(): void
    {
        foreach (UserRole::cases() as $role) {
            $user = $this->user($role);
            $newRole = $role === UserRole::Staff ? UserRole::Nutri : UserRole::Staff;

            $this->actingAs($user, 'sanctum')
                ->putJson('/api/users/'.$user->id, ['nivel_user' => $newRole->value])
                ->assertUnprocessable();

            $this->assertSame($role->value, (int) $user->fresh()->nivel_user);
        }
    }

    public function test_user_service_protects_the_last_manager_from_remove_or_relegate(): void
    {
        $staff = $this->user(UserRole::Staff);
        $nutri = $this->user(UserRole::Nutri);
        $service = app(UserService::class);

        try {
            $service->delete($nutri, $staff);
            $this->fail('A remoção do último gestor deveria ser bloqueada.');
        } catch (ConflictHttpException $exception) {
            $this->assertStringContainsString('último gestor', $exception->getMessage());
        }

        try {
            $service->update($nutri, ['nivel_user' => UserRole::Staff->value], $staff);
            $this->fail('O rebaixamento do último gestor deveria ser bloqueado.');
        } catch (ConflictHttpException $exception) {
            $this->assertStringContainsString('último gestor', $exception->getMessage());
        }

        $this->assertDatabaseHas('users', [
            'id' => $nutri->id,
            'nivel_user' => UserRole::Nutri->value,
            'deleted_at' => null,
        ]);
    }

    public function test_director_cannot_write_common_headcounts(): void
    {
        $director = $this->user(UserRole::Diretor);
        $turma = Turma::factory()->create();

        $this->actingAs($director, 'sanctum')
            ->postJson('/api/contagens', [
                'qtd_contagem' => 10,
                'turmas_id' => $turma->id,
            ])
            ->assertForbidden();

        $this->assertDatabaseCount('contagens', 0);
    }
}
