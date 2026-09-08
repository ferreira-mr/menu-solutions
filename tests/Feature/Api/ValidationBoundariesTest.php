<?php

namespace Tests\Feature\Api;

use App\Models\Contagen;
use App\Models\ControleDeProducaoEConsumo;
use App\Models\Turma;
use App\Models\User;
use App\Services\SchoolCalendarService;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class ValidationBoundariesTest extends TestCase
{
    use RefreshDatabase;

    private function nutri(): User
    {
        return User::factory()->create(['nivel_user' => 2]);
    }

    public function test_turma_name_and_count_integer_boundaries_apply_to_create_and_update(): void
    {
        $nutri = $this->nutri();
        $turma = Turma::factory()->create();
        $name45 = str_repeat('A', 45);
        $name46 = str_repeat('B', 46);

        $this->actingAs($nutri, 'sanctum')
            ->postJson('/api/turmas', [
                'nome_turma' => $name45,
                'categorias_id' => $turma->categorias_id,
            ])
            ->assertCreated()
            ->assertJsonPath('data.nome_turma', $name45);

        $this->actingAs($nutri, 'sanctum')
            ->postJson('/api/turmas', [
                'nome_turma' => $name46,
                'categorias_id' => $turma->categorias_id,
            ])
            ->assertUnprocessable()
            ->assertJsonValidationErrors('nome_turma');

        $count = Contagen::factory()->create([
            'users_id' => $nutri->id,
            'turmas_id' => $turma->id,
            'data_contagem' => app(SchoolCalendarService::class)->currentDate(),
            'qtd_contagem' => 0,
        ]);

        $this->actingAs($nutri, 'sanctum')
            ->putJson('/api/contagens/'.$count->id, ['qtd_contagem' => 2147483647])
            ->assertOk()
            ->assertJsonPath('data.qtd_contagem', 2147483647);

        foreach ([2147483648, -1, 1.5] as $invalid) {
            $this->actingAs($nutri, 'sanctum')
                ->putJson('/api/contagens/'.$count->id, ['qtd_contagem' => $invalid])
                ->assertUnprocessable()
                ->assertJsonValidationErrors('qtd_contagem');
        }

        $this->assertDatabaseHas('contagens', [
            'id' => $count->id,
            'qtd_contagem' => 2147483647,
        ]);
    }

    public function test_count_operation_and_people_integer_boundaries_are_rejected_before_persistence(): void
    {
        $nutri = $this->nutri();
        $turma = Turma::factory()->create();

        foreach ([2147483648, -1, 1.5] as $invalid) {
            $this->actingAs($nutri, 'sanctum')
                ->withHeader('Idempotency-Key', fake()->uuid())
                ->postJson('/api/contagens/operacao', [
                    'turmas_id' => $turma->id,
                    'qtd_contagem' => $invalid,
                ])
                ->assertUnprocessable()
                ->assertJsonValidationErrors('qtd_contagem');
        }

        $base = [
            'nome_alimento' => 'Arroz',
            'data_alimento' => now()->toDateString(),
            'quantidade_alimento' => 1,
            'medida_alimento' => 'kg',
            'pessoas_alimento' => 2147483647,
            'sobra_limpa_alimento' => 0,
            'desperdicio_alimento' => 0,
        ];

        $this->actingAs($nutri, 'sanctum')
            ->postJson('/api/controle_de_producao', $base)
            ->assertCreated()
            ->assertJsonPath('data.pessoas_alimento', 2147483647);

        foreach ([2147483648, -1, 1.5] as $invalid) {
            $payload = $base;
            $payload['pessoas_alimento'] = $invalid;

            $this->actingAs($nutri, 'sanctum')
                ->postJson('/api/controle_de_producao', $payload)
                ->assertUnprocessable()
                ->assertJsonValidationErrors('pessoas_alimento');
        }

        $this->assertDatabaseCount('controle_de_producao_e_consumo', 1);
    }

    public function test_production_decimal_boundaries_apply_to_create_and_update_without_rounding(): void
    {
        $nutri = $this->nutri();
        $maximum = [
            'nome_alimento' => 'Feijão',
            'data_alimento' => now()->toDateString(),
            'quantidade_alimento' => '999999.99',
            'medida_alimento' => 'kg',
            'pessoas_alimento' => 0,
            'sobra_limpa_alimento' => '999999.99',
            'desperdicio_alimento' => '999999.99',
        ];

        $record = $this->actingAs($nutri, 'sanctum')
            ->postJson('/api/controle_de_producao', $maximum)
            ->assertCreated()
            ->assertJsonPath('data.quantidade_alimento', '999999.99')
            ->assertJsonPath('data.sobra_limpa_alimento', '999999.99')
            ->assertJsonPath('data.desperdicio_alimento', '999999.99')
            ->json('data.id');

        foreach ([
            'quantidade_alimento' => ['1000000', '0.001', '-0.01', 'texto'],
            'sobra_limpa_alimento' => ['1000000', '0.001', '-0.01', 'texto'],
            'desperdicio_alimento' => ['1000000', '0.001', '-0.01', 'texto'],
        ] as $field => $values) {
            foreach ($values as $invalid) {
                $this->actingAs($nutri, 'sanctum')
                    ->putJson('/api/controle_de_producao/'.$record, [$field => $invalid])
                    ->assertUnprocessable()
                    ->assertJsonValidationErrors($field);
            }
        }

        $this->assertDatabaseHas('controle_de_producao_e_consumo', [
            'id' => $record,
            'quantidade_alimento' => '999999.99',
            'sobra_limpa_alimento' => '999999.99',
            'desperdicio_alimento' => '999999.99',
        ]);
    }
}
