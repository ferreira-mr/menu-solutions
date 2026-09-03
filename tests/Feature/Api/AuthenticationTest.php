<?php

namespace Tests\Feature\Api;

use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Hash;
use Tests\TestCase;

class AuthenticationTest extends TestCase
{
    use RefreshDatabase;

    public function test_private_user_endpoint_requires_sanctum_token(): void
    {
        $this->getJson('/api/user')->assertUnauthorized();
    }

    public function test_registration_hashes_password_and_rejects_duplicate_identity(): void
    {
        $payload = [
            'name' => 'Usuário de teste',
            'email' => 'teste@example.test',
            'nif' => '11111111111',
            'password' => 'password123',
            'password_confirmation' => 'password123',
        ];

        $this->postJson('/api/register', $payload)->assertCreated();
        $user = User::where('nif', $payload['nif'])->firstOrFail();
        $this->assertTrue(Hash::check($payload['password'], $user->password));
        $this->assertSame(1, (int) $user->nivel_user);

        $this->postJson('/api/register', $payload)->assertUnprocessable();
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
