<?php

namespace Tests\Feature\Api;

use App\Models\Autorizado;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class AuthorizationMatrixTest extends TestCase
{
    use RefreshDatabase;

    private function actingAsLevel(int $level)
    {
        return $this->actingAs(User::factory()->create(['nivel_user' => $level]), 'sanctum');
    }

    public function test_inspector_can_read_catalogs_but_cannot_mutate_administrator_resources(): void
    {
        $this->actingAsLevel(1)->getJson('/api/categorias')->assertOk();
        $this->actingAsLevel(1)->postJson('/api/categorias', [
            'nome_categoria' => 'Não autorizado',
        ])->assertForbidden();
        $this->actingAsLevel(1)->postJson('/api/users', [])->assertForbidden();
    }

    public function test_nutritionist_can_manage_catalogs_and_director_cannot_use_nutri_routes(): void
    {
        $this->actingAsLevel(2)->postJson('/api/categorias', [
            'nome_categoria' => 'Nova categoria',
        ])->assertCreated();

        $this->actingAsLevel(3)->postJson('/api/categorias', [
            'nome_categoria' => 'Bloqueada',
        ])->assertForbidden();
    }

    public function test_user_profile_scope_only_allows_self_for_non_administrator(): void
    {
        $staff = User::factory()->create(['nivel_user' => 1]);
        $other = User::factory()->create(['nivel_user' => 1]);

        $this->actingAs($staff, 'sanctum')->getJson('/api/users/'.$staff->id)->assertOk();
        $this->actingAs($staff, 'sanctum')->getJson('/api/users/'.$other->id)->assertForbidden();
        $this->actingAs(User::factory()->create(['nivel_user' => 2]), 'sanctum')
            ->getJson('/api/users/'.$other->id)->assertOk();
    }

    public function test_director_only_has_the_authorization_review_action(): void
    {
        $admin = User::factory()->create(['nivel_user' => 2]);
        $director = User::factory()->create(['nivel_user' => 3]);
        $card = Autorizado::factory()->create();

        $this->actingAs($director, 'sanctum')
            ->putJson('/api/autorizados/update/'.$card->id, ['status' => 'confirmado'])
            ->assertOk()
            ->assertJsonPath('data.status', 'confirmado');

        $this->actingAs($director, 'sanctum')
            ->postJson('/api/autorizados', ['titulo' => 'x', 'conteudo' => 'y'])
            ->assertForbidden();

        $this->actingAs($admin, 'sanctum')
            ->putJson('/api/autorizados/'.$card->id, ['titulo' => 'Editado'])
            ->assertStatus(409);
    }

    public function test_administrator_delete_guard_does_not_allow_self_deletion(): void
    {
        $admin = User::factory()->create(['nivel_user' => 2]);
        $other = User::factory()->create(['nivel_user' => 3]);

        $this->actingAs($admin, 'sanctum')->deleteJson('/api/users/'.$admin->id)
            ->assertUnprocessable();
        $this->actingAs($admin, 'sanctum')->deleteJson('/api/users/'.$other->id)
            ->assertNoContent();
        $this->assertSoftDeleted('users', ['id' => $other->id]);
    }
}
