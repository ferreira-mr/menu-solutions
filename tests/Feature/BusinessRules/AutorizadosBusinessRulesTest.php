<?php

namespace Tests\Feature\BusinessRules;

use App\Models\Autorizado;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class AutorizadosBusinessRulesTest extends TestCase
{
    use RefreshDatabase;

    private function user(int $level = 1): User
    {
        return User::factory()->create(['nivel_user' => $level]);
    }

    public function test_nutricionista_creates_autorizado_with_default_pending_status(): void
    {
        $nutri = $this->user(2);

        $response = $this->actingAs($nutri, 'sanctum')->postJson('/api/autorizados', [
            'titulo' => 'Refeição Visitante FIESP',
            'conteudo' => 'Almoço para avaliador da FIESP às 11:30',
        ]);

        $response->assertCreated()
            ->assertJsonPath('data.status', 'pendente')
            ->assertJsonPath('data.titulo', 'Refeição Visitante FIESP');
    }

    public function test_inspetora_and_diretora_cannot_create_autorizados(): void
    {
        $payload = [
            'titulo' => 'Visitante',
            'conteudo' => 'Descrição',
        ];

        // Inspetora (1)
        $this->actingAs($this->user(1), 'sanctum')->postJson('/api/autorizados', $payload)
            ->assertForbidden();

        // Diretora (3)
        $this->actingAs($this->user(3), 'sanctum')->postJson('/api/autorizados', $payload)
            ->assertForbidden();
    }

    public function test_diretora_approves_autorizado_via_update_route(): void
    {
        $nutri = $this->user(2);
        $diretora = $this->user(3);

        $autorizado = Autorizado::create([
            'titulo' => 'Estagiário SENAI',
            'conteudo' => 'Refeição autorizada',
            'status' => 'pendente',
        ]);

        // Diretora altera status para confirmado na rota /api/autorizados/update/{id}
        $response = $this->actingAs($diretora, 'sanctum')
            ->putJson("/api/autorizados/update/{$autorizado->id}", [
                'status' => 'confirmado',
            ]);

        $response->assertOk()
            ->assertJsonPath('data.status', 'confirmado');

        $this->assertDatabaseHas('autorizados', [
            'id' => $autorizado->id,
            'status' => 'confirmado',
        ]);
    }

    public function test_nutri_edits_autorizado_and_inspetora_cannot_edit(): void
    {
        $nutri = $this->user(2);
        $inspetora = $this->user(1);

        $autorizado = Autorizado::create([
            'titulo' => 'Original',
            'conteudo' => 'Texto',
            'status' => 'pendente',
        ]);

        // Nutri edita na rota padrão /api/autorizados/{id}
        $this->actingAs($nutri, 'sanctum')
            ->putJson("/api/autorizados/{$autorizado->id}", [
                'titulo' => 'Título Atualizado',
            ])->assertOk()->assertJsonPath('data.titulo', 'Título Atualizado');

        // Inspetora não pode editar
        $this->actingAs($inspetora, 'sanctum')
            ->putJson("/api/autorizados/{$autorizado->id}", [
                'titulo' => 'Tentativa Inspetora',
            ])->assertForbidden();
    }

    public function test_only_nutri_can_delete_autorizado(): void
    {
        $nutri = $this->user(2);
        $inspetora = $this->user(1);
        $diretora = $this->user(3);

        $autorizado = Autorizado::create([
            'titulo' => 'Para deletar',
            'conteudo' => 'Texto',
            'status' => 'pendente',
        ]);

        // Inspetora e Diretora recebem 403
        $this->actingAs($inspetora, 'sanctum')
            ->deleteJson("/api/autorizados/{$autorizado->id}")
            ->assertForbidden();

        $this->actingAs($diretora, 'sanctum')
            ->deleteJson("/api/autorizados/{$autorizado->id}")
            ->assertForbidden();

        // Nutri deleta com sucesso
        $this->actingAs($nutri, 'sanctum')
            ->deleteJson("/api/autorizados/{$autorizado->id}")
            ->assertNoContent();

        $this->assertDatabaseMissing('autorizados', ['id' => $autorizado->id]);
    }
}
