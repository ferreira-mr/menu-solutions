<?php

namespace Tests\Feature\Api;

use App\Models\Aluno;
use App\Models\Contagen;
use App\Models\ControleDeProducaoEConsumo;
use App\Models\Turma;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class PaginationContractsTest extends TestCase
{
    use RefreshDatabase;

    public function test_student_pagination_validates_input_and_keeps_a_stable_last_page(): void
    {
        $staff = User::factory()->create(['nivel_user' => 1]);
        $turma = Turma::factory()->create();
        Aluno::factory()->count(23)->create(['turmas_id' => $turma->id]);

        $response = $this->actingAs($staff, 'sanctum')
            ->getJson('/api/alunos?limit=10&page=3');

        $response->assertOk()
            ->assertJsonCount(3, 'data')
            ->assertJsonPath('meta.total', 23)
            ->assertJsonPath('meta.current_page', 3)
            ->assertJsonPath('data.0.id', 21)
            ->assertJsonPath('data.2.id', 23);

        foreach (['limit=0', 'limit=-1', 'limit=1.5', 'limit=texto', 'limit=1001', 'page=0', 'page=-1', 'page=1.5', 'page=texto'] as $query) {
            $this->actingAs($staff, 'sanctum')
                ->getJson('/api/alunos?'.$query)
                ->assertUnprocessable();
        }
    }

    public function test_production_and_count_filters_are_applied_before_pagination(): void
    {
        $nutri = User::factory()->nutricionista()->create();
        $turma = Turma::factory()->create();

        ControleDeProducaoEConsumo::factory()->count(25)->create(['data_alimento' => '2026-09-02']);
        ControleDeProducaoEConsumo::factory()->count(10)->create(['data_alimento' => '2026-09-04']);

        $production = $this->actingAs($nutri, 'sanctum')
            ->getJson('/api/controle_de_producao?data_inicio=2026-09-02&data_fim=2026-09-02&limit=10&page=3');

        $production->assertOk()
            ->assertJsonCount(5, 'data')
            ->assertJsonPath('meta.total', 25)
            ->assertJsonPath('meta.current_page', 3);
        $this->assertSame(['2026-09-02'], collect($production->json('data'))->pluck('data_alimento')->unique()->values()->all());

        Contagen::factory()->count(25)->create([
            'turmas_id' => $turma->id,
            'users_id' => $nutri->id,
            'data_contagem' => '2026-09-02',
            'hora_contagem' => '08:00:00',
        ]);
        Contagen::factory()->count(10)->create([
            'turmas_id' => $turma->id,
            'users_id' => $nutri->id,
            'data_contagem' => '2026-09-04',
        ]);

        $counts = $this->actingAs($nutri, 'sanctum')
            ->getJson('/api/contagens?date=2026-09-02&limit=10&page=3');

        $counts->assertOk()
            ->assertJsonCount(5, 'data')
            ->assertJsonPath('meta.total', 25)
            ->assertJsonPath('meta.current_page', 3);
        $this->assertSame(['2026-09-02'], collect($counts->json('data'))->pluck('data_contagem')->unique()->values()->all());

        $this->actingAs($nutri, 'sanctum')
            ->getJson('/api/contagens?data_inicio=2026-09-03&data_fim=2026-09-02')
            ->assertUnprocessable();
    }
}
