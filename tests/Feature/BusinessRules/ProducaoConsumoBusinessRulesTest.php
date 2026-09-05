<?php

namespace Tests\Feature\BusinessRules;

use App\Models\ControleDeProducaoEConsumo;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class ProducaoConsumoBusinessRulesTest extends TestCase
{
    use RefreshDatabase;

    private function user(int $level = 1): User
    {
        return User::factory()->create(['nivel_user' => $level]);
    }

    public function test_nutricionista_creates_daily_production_and_waste_record(): void
    {
        $nutri = $this->user(2);

        $payload = [
            'nome_alimento' => 'Arroz Integral com Legumes',
            'data_alimento' => today()->toDateString(),
            'quantidade_alimento' => 45.50,
            'medida_alimento' => 'kg',
            'pessoas_alimento' => 320,
            'sobra_limpa_alimento' => 2.30,
            'desperdicio_alimento' => 1.10,
        ];

        $response = $this->actingAs($nutri, 'sanctum')->postJson('/api/controle_de_producao', $payload);

        $response->assertCreated()
            ->assertJsonPath('data.nome_alimento', 'Arroz Integral com Legumes')
            ->assertJsonPath('data.pessoas_alimento', 320);

        $this->assertDatabaseHas('controle_de_producao_e_consumo', [
            'nome_alimento' => 'Arroz Integral com Legumes',
            'pessoas_alimento' => 320,
        ]);
    }

    public function test_non_nutri_users_cannot_create_production_record(): void
    {
        $payload = [
            'nome_alimento' => 'Feijão Carioca',
            'data_alimento' => today()->toDateString(),
            'quantidade_alimento' => 20.0,
            'medida_alimento' => 'kg',
            'pessoas_alimento' => 300,
            'sobra_limpa_alimento' => 1.0,
            'desperdicio_alimento' => 0.5,
        ];

        // Inspetora (1)
        $this->actingAs($this->user(1), 'sanctum')->postJson('/api/controle_de_producao', $payload)
            ->assertForbidden();

        // Diretora (3)
        $this->actingAs($this->user(3), 'sanctum')->postJson('/api/controle_de_producao', $payload)
            ->assertForbidden();
    }

    public function test_production_validations_reject_negative_values(): void
    {
        $nutri = $this->user(2);

        $payload = [
            'nome_alimento' => 'Salada',
            'data_alimento' => today()->toDateString(),
            'quantidade_alimento' => -5,
            'medida_alimento' => 'kg',
            'pessoas_alimento' => -10,
            'sobra_limpa_alimento' => -1,
            'desperdicio_alimento' => -2,
        ];

        $this->actingAs($nutri, 'sanctum')->postJson('/api/controle_de_producao', $payload)
            ->assertUnprocessable()
            ->assertJsonValidationErrors([
                'quantidade_alimento',
                'pessoas_alimento',
                'sobra_limpa_alimento',
                'desperdicio_alimento',
            ]);
    }

    public function test_soft_delete_and_restoration_audit(): void
    {
        $nutri = $this->user(2);

        $record = ControleDeProducaoEConsumo::create([
            'nome_alimento' => 'Macarronada',
            'data_alimento' => today()->toDateString(),
            'quantidade_alimento' => 30.0,
            'medida_alimento' => 'kg',
            'pessoas_alimento' => 280,
            'sobra_limpa_alimento' => 1.5,
            'desperdicio_alimento' => 0.8,
        ]);

        $this->actingAs($nutri, 'sanctum')
            ->deleteJson("/api/controle_de_producao/{$record->id}")
            ->assertNoContent();

        $this->assertSoftDeleted('controle_de_producao_e_consumo', ['id' => $record->id]);
    }
}
