<?php

namespace Tests\Feature\Api;

use App\Enums\UserRole;
use App\Models\User;
use App\Services\UserService;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Database\Events\QueryExecuted;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;
use Tests\TestCase;

class UserSessionSecurityTest extends TestCase
{
    use RefreshDatabase;

    public function test_administrative_password_change_revokes_the_target_token(): void
    {
        $nutri = $this->user(UserRole::Nutri, '20000000021');
        $staff = $this->user(UserRole::Staff, '10000000021');
        $adminToken = $nutri->createToken('admin-change')->plainTextToken;
        $targetToken = $staff->createToken('target-session')->plainTextToken;

        $this->withToken($targetToken)->getJson('/api/user')->assertOk();
        Auth::forgetGuards();

        $this->withToken($adminToken)->putJson("/api/users/{$staff->id}", [
            'password' => 'nova-senha123',
            'password_confirmation' => 'nova-senha123',
        ])->assertOk();

        Auth::forgetGuards();
        $this->withToken($targetToken)->getJson('/api/user')->assertUnauthorized();
        $this->postJson('/api/login', [
            'nif' => $staff->nif,
            'password' => 'nova-senha123',
        ])->assertOk();
        $this->postJson('/api/login', [
            'nif' => $staff->nif,
            'password' => 'password123',
        ])->assertUnauthorized();
    }

    public function test_administrative_profile_change_revokes_the_target_token(): void
    {
        $nutri = $this->user(UserRole::Nutri, '20000000022');
        $staff = $this->user(UserRole::Staff, '10000000022');
        $adminToken = $nutri->createToken('admin-role-change')->plainTextToken;
        $targetToken = $staff->createToken('target-role-session')->plainTextToken;

        $this->withToken($adminToken)->putJson("/api/users/{$staff->id}", [
            'nivel_user' => UserRole::Diretor->value,
        ])->assertOk();

        Auth::forgetGuards();
        $this->withToken($targetToken)->getJson('/api/user')->assertUnauthorized();
        $this->assertDatabaseMissing('personal_access_tokens', [
            'token' => hash('sha256', explode('|', $targetToken, 2)[1]),
        ]);
    }

    public function test_deleting_a_user_revokes_all_of_their_tokens(): void
    {
        $nutri = $this->user(UserRole::Nutri, '20000000023');
        $staff = $this->user(UserRole::Staff, '10000000023');
        $adminToken = $nutri->createToken('admin-delete')->plainTextToken;
        $targetToken = $staff->createToken('target-delete-session')->plainTextToken;

        $this->withToken($adminToken)->deleteJson("/api/users/{$staff->id}")->assertNoContent();

        $this->assertDatabaseMissing('personal_access_tokens', [
            'token' => hash('sha256', explode('|', $targetToken, 2)[1]),
        ]);
    }

    public function test_simple_name_edit_keeps_the_current_token_valid(): void
    {
        $staff = $this->user(UserRole::Staff, '10000000024');
        $token = $staff->createToken('name-edit-session')->plainTextToken;

        $this->withToken($token)->putJson("/api/users/{$staff->id}", [
            'name' => 'Nome atualizado',
        ])->assertOk();

        Auth::forgetGuards();
        $this->withToken($token)->getJson('/api/user')->assertOk();
        $this->assertDatabaseHas('personal_access_tokens', [
            'token' => hash('sha256', explode('|', $token, 2)[1]),
        ]);
    }

    public function test_failed_own_password_reset_preserves_hash_and_token(): void
    {
        $staff = $this->user(UserRole::Staff, '10000000025');
        $token = $staff->createToken('failed-reset')->plainTextToken;
        $originalHash = $staff->password;

        $this->withToken($token)->postJson('/api/reset-password', [
            'senha_atual' => 'senha-incorreta',
            'new_password' => 'nova-senha123',
            'new_password_confirmation' => 'nova-senha123',
        ])->assertStatus(400);

        $this->assertSame($originalHash, $staff->fresh()->password);
        $this->assertDatabaseHas('personal_access_tokens', [
            'token' => hash('sha256', explode('|', $token, 2)[1]),
        ]);
    }

    public function test_sensitive_update_rolls_back_when_token_revocation_fails(): void
    {
        $staff = $this->user(UserRole::Staff, '10000000026');
        $token = $staff->createToken('transaction-test')->plainTextToken;
        $originalHash = $staff->password;
        $failure = new \RuntimeException('falha de revogação simulada');

        DB::listen(function (QueryExecuted $query) use ($failure): void {
            if (str_contains(strtolower($query->sql), 'delete from "personal_access_tokens"')) {
                throw $failure;
            }
        });

        try {
            app(UserService::class)->update($staff, [
                'password' => Hash::make('nova-senha123'),
            ]);
            $this->fail('A falha de revogação deveria interromper a transação.');
        } catch (\RuntimeException $exception) {
            $this->assertSame($failure, $exception);
        }

        $this->assertSame($originalHash, $staff->fresh()->password);
        $this->assertDatabaseHas('personal_access_tokens', [
            'token' => hash('sha256', explode('|', $token, 2)[1]),
        ]);
    }

    private function user(UserRole $role, string $nif): User
    {
        return User::factory()->create([
            'nif' => $nif,
            'nivel_user' => $role->value,
            'password' => Hash::make('password123'),
        ]);
    }
}
