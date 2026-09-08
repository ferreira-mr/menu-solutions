<?php

namespace Tests\Feature\BusinessRules;

use App\Models\Categoria;
use App\Models\Contagen;
use App\Models\Turma;
use App\Models\User;
use App\Services\SchoolCalendarService;
use Carbon\CarbonImmutable;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class ContagemBusinessRulesTest extends TestCase
{
    use RefreshDatabase;

    private function user(int $level = 1): User
    {
        return User::factory()->create(['nivel_user' => $level]);
    }

    public function test_inspetora_and_nutri_can_create_counts_for_today(): void
    {
        $turma = Turma::factory()->create();
        $schoolDay = app(SchoolCalendarService::class)->currentDate();

        // Inspetora (nível 1)
        $inspetora = $this->user(1);
        $resInspetora = $this->actingAs($inspetora, 'sanctum')->postJson('/api/contagens', [
            'turmas_id' => $turma->id,
            'qtd_contagem' => 28,
        ]);
        $resInspetora->assertCreated()
            ->assertJsonPath('data.qtd_contagem', 28);
        $this->assertSame($schoolDay, $resInspetora->json('data.data_contagem'));

        // Nutricionista (nível 2)
        $nutri = $this->user(2);
        $resNutri = $this->actingAs($nutri, 'sanctum')->postJson('/api/contagens', [
            'turmas_id' => $turma->id,
            'qtd_contagem' => 30,
        ]);
        $resNutri->assertCreated()
            ->assertJsonPath('data.qtd_contagem', 30);
    }

    public function test_rn14_cannot_edit_past_counts(): void
    {
        $inspetora = $this->user(1);
        $turma = Turma::factory()->create();
        $schoolDay = app(SchoolCalendarService::class)->currentDate();

        // Contagem de ontem
        $pastCount = Contagen::factory()->create([
            'turmas_id' => $turma->id,
            'users_id' => $inspetora->id,
            'qtd_contagem' => 25,
            'data_contagem' => CarbonImmutable::createFromFormat('Y-m-d', $schoolDay)->subDay()->toDateString(),
        ]);

        $response = $this->actingAs($inspetora, 'sanctum')->putJson("/api/contagens/{$pastCount->id}", [
            'qtd_contagem' => 30,
        ]);

        $response->assertStatus(400)
            ->assertJson(['message' => 'Update nao permitido / Fora de horario permitido']);

        $this->assertDatabaseHas('contagens', [
            'id' => $pastCount->id,
            'qtd_contagem' => 25,
        ]);
    }

    public function test_can_edit_today_counts(): void
    {
        $inspetora = $this->user(1);
        $turma = Turma::factory()->create();
        $schoolDay = app(SchoolCalendarService::class)->currentDate();

        $todayCount = Contagen::factory()->create([
            'turmas_id' => $turma->id,
            'users_id' => $inspetora->id,
            'qtd_contagem' => 25,
            'data_contagem' => $schoolDay,
        ]);

        $response = $this->actingAs($inspetora, 'sanctum')->putJson("/api/contagens/{$todayCount->id}", [
            'qtd_contagem' => 32,
        ]);

        $response->assertOk()
            ->assertJsonPath('data.qtd_contagem', 32);

        $this->assertDatabaseHas('contagens', [
            'id' => $todayCount->id,
            'qtd_contagem' => 32,
        ]);
    }

    public function test_filtering_counts_by_date_and_range(): void
    {
        $user = $this->user(1);
        $turma = Turma::factory()->create();

        // Cria contagens em 3 dias diferentes
        Contagen::factory()->create([
            'turmas_id' => $turma->id,
            'users_id' => $user->id,
            'data_contagem' => '2026-09-01',
            'qtd_contagem' => 20,
        ]);
        Contagen::factory()->create([
            'turmas_id' => $turma->id,
            'users_id' => $user->id,
            'data_contagem' => '2026-09-02',
            'qtd_contagem' => 22,
        ]);
        Contagen::factory()->create([
            'turmas_id' => $turma->id,
            'users_id' => $user->id,
            'data_contagem' => '2026-09-03',
            'qtd_contagem' => 25,
        ]);

        // Filtro por dia específico (parâmetro 'data')
        $resDia = $this->actingAs($user, 'sanctum')->getJson('/api/contagens?data=2026-09-02');
        $resDia->assertOk()->assertJsonCount(1, 'data');
        $this->assertEquals(22, $resDia->json('data.0.qtd_contagem'));

        // Filtro por range (data_inicio e data_fim)
        $resRange = $this->actingAs($user, 'sanctum')
            ->getJson('/api/contagens?data_inicio=2026-09-01&data_fim=2026-09-02');
        $resRange->assertOk()->assertJsonCount(2, 'data');

        // Limite de registros
        $resLimit = $this->actingAs($user, 'sanctum')->getJson('/api/contagens?limit=2');
        $resLimit->assertOk()->assertJsonCount(2, 'data');
    }
}
