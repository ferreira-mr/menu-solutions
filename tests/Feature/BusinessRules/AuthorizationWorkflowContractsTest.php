<?php

namespace Tests\Feature\BusinessRules;

use App\Enums\UserRole;
use App\Models\Autorizado;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class AuthorizationWorkflowContractsTest extends TestCase
{
    use RefreshDatabase;

    private function user(UserRole $role): User
    {
        return User::factory()->create(['nivel_user' => $role->value]);
    }

    public function test_nutri_cannot_choose_status_when_creating_authorization(): void
    {
        $nutri = $this->user(UserRole::Nutri);

        $this->actingAs($nutri, 'sanctum')
            ->postJson('/api/autorizados', [
                'titulo' => 'Visita',
                'conteudo' => 'Duas refeições',
                'status' => 'confirmado',
            ])
            ->assertUnprocessable();

        $this->assertDatabaseCount('autorizados', 0);
    }

    public function test_nutri_can_edit_pending_content_but_cannot_send_status(): void
    {
        $nutri = $this->user(UserRole::Nutri);
        $autorizado = Autorizado::factory()->create();

        $this->actingAs($nutri, 'sanctum')
            ->putJson('/api/autorizados/'.$autorizado->id, ['status' => 'confirmado'])
            ->assertUnprocessable();

        $this->assertDatabaseHas('autorizados', [
            'id' => $autorizado->id,
            'status' => 'pendente',
        ]);

        $this->actingAs($nutri, 'sanctum')
            ->putJson('/api/autorizados/'.$autorizado->id, ['titulo' => 'Título revisado'])
            ->assertOk()
            ->assertJsonPath('data.status', 'pendente');
    }

    public function test_nutri_cannot_edit_content_after_a_decision(): void
    {
        $nutri = $this->user(UserRole::Nutri);
        $autorizado = Autorizado::factory()->create(['status' => 'confirmado']);

        $this->actingAs($nutri, 'sanctum')
            ->putJson('/api/autorizados/'.$autorizado->id, ['titulo' => 'Alteração indevida'])
            ->assertStatus(409);

        $this->assertDatabaseHas('autorizados', [
            'id' => $autorizado->id,
            'titulo' => $autorizado->titulo,
            'status' => 'confirmado',
        ]);
    }

    public function test_director_can_confirm_or_refuse_pending_authorizations_with_audit(): void
    {
        $director = $this->user(UserRole::Diretor);
        $toConfirm = Autorizado::factory()->create();
        $toRefuse = Autorizado::factory()->create();

        $this->actingAs($director, 'sanctum')
            ->putJson('/api/autorizados/update/'.$toConfirm->id, ['status' => 'confirmado'])
            ->assertOk()
            ->assertJsonPath('data.status', 'confirmado')
            ->assertJsonPath('data.decidido_por', $director->id)
            ->assertJsonPath('data.decidido_em', fn ($value) => is_string($value));

        $this->actingAs($director, 'sanctum')
            ->putJson('/api/autorizados/update/'.$toRefuse->id, ['status' => 'recusado'])
            ->assertOk()
            ->assertJsonPath('data.status', 'recusado')
            ->assertJsonPath('data.decidido_por', $director->id)
            ->assertJsonPath('data.decidido_em', fn ($value) => is_string($value));

        $this->assertDatabaseHas('autorizados', [
            'id' => $toRefuse->id,
            'status' => 'recusado',
            'decidido_por' => $director->id,
        ]);
    }

    public function test_repeating_same_director_decision_is_idempotent(): void
    {
        $director = $this->user(UserRole::Diretor);
        $autorizado = Autorizado::factory()->create();

        $this->actingAs($director, 'sanctum')
            ->putJson('/api/autorizados/update/'.$autorizado->id, ['status' => 'confirmado'])
            ->assertOk();

        $autorizado->refresh();
        $decidedAt = $autorizado->decidido_em?->toISOString();
        $updatedAt = $autorizado->updated_at?->toISOString();

        $this->actingAs($director, 'sanctum')
            ->putJson('/api/autorizados/update/'.$autorizado->id, ['status' => 'confirmado'])
            ->assertOk()
            ->assertJsonPath('data.decidido_por', $director->id)
            ->assertJsonPath('data.decidido_em', $autorizado->decidido_em?->toISOString());

        $autorizado->refresh();
        $this->assertSame($decidedAt, $autorizado->decidido_em?->toISOString());
        $this->assertSame($updatedAt, $autorizado->updated_at?->toISOString());
    }

    public function test_director_cannot_change_a_final_decision(): void
    {
        $director = $this->user(UserRole::Diretor);
        $autorizado = Autorizado::factory()->create(['status' => 'confirmado']);

        $this->actingAs($director, 'sanctum')
            ->putJson('/api/autorizados/update/'.$autorizado->id, ['status' => 'recusado'])
            ->assertStatus(409);

        $this->assertDatabaseHas('autorizados', [
            'id' => $autorizado->id,
            'status' => 'confirmado',
        ]);
    }

    public function test_only_director_can_review_authorizations(): void
    {
        $autorizado = Autorizado::factory()->create();

        foreach ([UserRole::Staff, UserRole::Nutri] as $role) {
            $this->actingAs($this->user($role), 'sanctum')
                ->putJson('/api/autorizados/update/'.$autorizado->id, ['status' => 'recusado'])
                ->assertForbidden();
        }

        $this->assertDatabaseHas('autorizados', [
            'id' => $autorizado->id,
            'status' => 'pendente',
        ]);
    }
}
