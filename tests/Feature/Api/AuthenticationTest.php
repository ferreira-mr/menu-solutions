<?php

namespace Tests\Feature\Api;

use App\Enums\UserRole;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Hash;
use Tests\TestCase;

class AuthenticationTest extends TestCase
{
    use RefreshDatabase;

    public function test_private_user_endpoint_requires_sanctum_token(): void
    {
        $this->getJson('/api/user')->assertUnauthorized();
    }

    public function test_public_registration_is_disabled_without_creating_account_or_token(): void
    {
        $payload = [
            'name' => 'Cadastro público',
            'email' => 'cadastro-publico@example.test',
            'nif' => '99999999999',
            'nivel_user' => 3,
            'password' => 'password123',
            'password_confirmation' => 'password123',
        ];

        $this->postJson('/api/register', $payload)
            ->assertForbidden()
            ->assertJsonPath('message', 'Cadastro público desativado');

        $this->assertDatabaseMissing('users', ['nif' => $payload['nif']]);
        $this->assertDatabaseCount('personal_access_tokens', 0);
    }

    public function test_login_rejects_legacy_fixed_passwords_in_all_environments(): void
    {
        $user = User::factory()->create(['password' => Hash::make('senha-segura-123')]);

        foreach (['local', 'testing', 'production'] as $environment) {
            $this->app->detectEnvironment(static fn () => $environment);

            foreach (['password', 'password123'] as $legacyPassword) {
                $this->postJson('/api/login', [
                    'nif' => $user->nif,
                    'password' => $legacyPassword,
                ])->assertUnauthorized();
            }
        }

        $this->assertDatabaseCount('personal_access_tokens', 0);
    }

    public function test_login_returns_personal_access_token_and_invalid_credentials_are_rejected(): void
    {
        $user = User::factory()->create(['password' => Hash::make('segredo123')]);

        $response = $this->postJson('/api/login', [
            'nif' => $user->nif,
            'password' => 'segredo123',
        ])->assertOk();

        $token = $response->json('token');
        $this->assertNotEmpty($token);
        $this->assertDatabaseCount('personal_access_tokens', 1);
        $this->withToken($token)->getJson('/api/user')
            ->assertOk()
            ->assertJsonPath('data.id', $user->id)
            ->assertJsonMissingPath('data.password');

        $this->postJson('/api/login', [
            'nif' => $user->nif,
            'password' => 'incorreta',
        ])->assertUnauthorized();
    }

    public function test_login_works_for_each_profile_and_unknown_nif_uses_the_same_error(): void
    {
        foreach (UserRole::cases() as $role) {
            $user = User::factory()->create([
                'nivel_user' => $role->value,
                'password' => Hash::make('senha-do-perfil-123'),
            ]);

            Auth::forgetGuards();
            $token = $this->postJson('/api/login', [
                'nif' => $user->nif,
                'password' => 'senha-do-perfil-123',
            ])->assertOk()->json('token');

            Auth::forgetGuards();
            $this->withToken($token)->getJson('/api/user')
                ->assertOk()
                ->assertJsonPath('data.nivel_user', $role->value);
        }

        Auth::forgetGuards();
        $this->postJson('/api/login', [
            'nif' => '00000000000',
            'password' => 'senha-do-perfil-123',
        ])->assertUnauthorized()->assertJsonPath('message', 'Credenciais invalidas');
    }

    public function test_logout_revokes_the_bearer_token(): void
    {
        $user = User::factory()->create();
        $token = $user->createToken('logout-test')->plainTextToken;

        $this->withToken($token)->postJson('/api/logout')->assertOk();
        $this->assertDatabaseMissing('personal_access_tokens', [
            'token' => hash('sha256', explode('|', $token, 2)[1]),
        ]);
    }

    public function test_reset_password_requires_current_password_and_invalidates_sessions(): void
    {
        $user = User::factory()->create(['password' => Hash::make('atual1234')]);
        $token = $user->createToken('password-test')->plainTextToken;

        $this->withToken($token)->postJson('/api/reset-password', [
            'senha_atual' => 'errada',
            'new_password' => 'nova-senha123',
            'new_password_confirmation' => 'nova-senha123',
        ])->assertStatus(400);

        $this->withToken($token)->postJson('/api/reset-password', [
            'senha_atual' => 'atual1234',
            'new_password' => 'nova-senha123',
            'new_password_confirmation' => 'nova-senha123',
        ])->assertOk();

        $this->assertDatabaseMissing('personal_access_tokens', [
            'token' => hash('sha256', explode('|', $token, 2)[1]),
        ]);
        $this->postJson('/api/login', [
            'nif' => $user->nif,
            'password' => 'nova-senha123',
        ])->assertOk();
    }
}
