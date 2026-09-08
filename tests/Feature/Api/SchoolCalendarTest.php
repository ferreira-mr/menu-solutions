<?php

namespace Tests\Feature\Api;

use App\Models\Aluno;
use App\Models\AlunosHasNecessidade;
use App\Models\ContagemNe;
use App\Models\Necessidade;
use App\Models\Turma;
use App\Models\User;
use Carbon\Carbon;
use App\Services\SchoolCalendarService;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class SchoolCalendarTest extends TestCase
{
    use RefreshDatabase;

    protected function tearDown(): void
    {
        Carbon::setTestNow();
        parent::tearDown();
    }

    private function user(): User
    {
        return User::factory()->create(['nivel_user' => 1]);
    }

    private function relation(): AlunosHasNecessidade
    {
        return AlunosHasNecessidade::create([
            'alunos_id' => Aluno::factory()->create()->id,
            'necessidades_id' => Necessidade::factory()->create()->id,
        ]);
    }

    public function test_authenticated_context_returns_the_school_day_and_timezone(): void
    {
        Carbon::setTestNow('2026-09-08 01:00:00');

        $response = $this->actingAs($this->user(), 'sanctum')
            ->getJson('/api/contexto-escolar');

        $response->assertOk()
            ->assertJsonPath('data.data_atual', '2026-09-07')
            ->assertJsonPath('data.timezone', 'America/Sao_Paulo')
            ->assertJsonPath('data.agora', '2026-09-08T01:00:00.000000Z');
    }

    public function test_count_creation_uses_the_school_day_before_utc_midnight(): void
    {
        Carbon::setTestNow('2026-09-08 01:00:00');
        $user = $this->user();
        $turma = Turma::factory()->create();

        $response = $this->actingAs($user, 'sanctum')
            ->postJson('/api/contagens', [
                'turmas_id' => $turma->id,
                'qtd_contagem' => 28,
            ]);

        $response->assertCreated()
            ->assertJsonPath('data.data_contagem', '2026-09-07');

        $this->assertDatabaseHas('contagens', [
            'turmas_id' => $turma->id,
            'data_contagem' => '2026-09-07',
            'hora_contagem' => '22:00:00',
        ]);
    }

    public function test_nes_date_filter_includes_window_start_and_excludes_window_end(): void
    {
        $user = $this->user();
        $relation = $this->relation();

        $before = ContagemNe::create(['alunos_has_necessidades_id' => $relation->id]);
        $before->forceFill(['created_at' => '2026-09-07 02:59:59'])->saveQuietly();

        $start = ContagemNe::create(['alunos_has_necessidades_id' => $relation->id]);
        $start->forceFill(['created_at' => '2026-09-07 03:00:00'])->saveQuietly();

        $end = ContagemNe::create(['alunos_has_necessidades_id' => $relation->id]);
        $end->forceFill(['created_at' => '2026-09-08 03:00:00'])->saveQuietly();

        $response = $this->actingAs($user, 'sanctum')
            ->getJson('/api/contagem-nes?data=2026-09-07');

        $response->assertOk();
        $ids = collect($response->json('data'))->pluck('id');

        $this->assertTrue($ids->contains($start->id));
        $this->assertFalse($ids->contains($before->id));
        $this->assertFalse($ids->contains($end->id));
    }

    public function test_dashboard_without_a_date_uses_the_school_day(): void
    {
        Carbon::setTestNow('2026-09-08 01:00:00');
        $user = $this->user();
        $turma = Turma::factory()->create();
        \App\Models\Contagen::factory()->create([
            'turmas_id' => $turma->id,
            'users_id' => $user->id,
            'data_contagem' => '2026-09-07',
            'qtd_contagem' => 28,
        ]);

        $response = $this->actingAs($user, 'sanctum')
            ->getJson('/api/contagens/dashboard');

        $response->assertOk()->assertJsonPath('data.0.turmas.0.data_contagem', '2026-09-07');
    }

    public function test_next_school_day_window_is_calculated_in_the_configured_timezone(): void
    {
        config(['app.school_timezone' => 'Pacific/Auckland']);
        $service = app(SchoolCalendarService::class);

        [$startUtc, $endUtc] = $service->utcWindowForDate('2026-09-08');

        $this->assertSame('2026-09-07 12:00:00', $startUtc->toDateTimeString());
        $this->assertSame('2026-09-08 12:00:00', $endUtc->toDateTimeString());
    }
}
