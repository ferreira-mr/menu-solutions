<?php

namespace Tests\Feature\BusinessRules;

use App\Models\Aluno;
use App\Models\AlunosHasNecessidade;
use App\Models\ContagemNe;
use App\Models\Necessidade;
use App\Models\User;
use App\Services\SchoolCalendarService;
use Carbon\CarbonImmutable;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class ContagemNesBusinessRulesTest extends TestCase
{
    use RefreshDatabase;

    private function user(int $level = 1): User
    {
        return User::factory()->create(['nivel_user' => $level]);
    }

    private function createPivot(): AlunosHasNecessidade
    {
        $aluno = Aluno::factory()->create();
        $necessidade = Necessidade::factory()->create();

        return AlunosHasNecessidade::create([
            'alunos_id' => $aluno->id,
            'necessidades_id' => $necessidade->id,
        ]);
    }

    public function test_inspetora_and_nutri_can_register_special_needs_attendance(): void
    {
        $pivot1 = $this->createPivot();
        $pivot2 = $this->createPivot();

        // Inspetora (nível 1) pode registrar presença
        $inspetora = $this->user(1);
        $res1 = $this->actingAs($inspetora, 'sanctum')->postJson('/api/contagem-nes', [
            'alunos_has_necessidades_id' => $pivot1->id,
        ]);
        $res1->assertCreated();

        // Nutricionista (nível 2) pode registrar presença
        $nutri = $this->user(2);
        $res2 = $this->actingAs($nutri, 'sanctum')->postJson('/api/contagem-nes', [
            'alunos_has_necessidades_id' => $pivot2->id,
        ]);
        $res2->assertCreated();

        // Diretora (nível 3) não pode registrar
        $diretora = $this->user(3);
        $res3 = $this->actingAs($diretora, 'sanctum')->postJson('/api/contagem-nes', [
            'alunos_has_necessidades_id' => $pivot1->id,
        ]);
        $res3->assertForbidden();
    }

    public function test_can_delete_today_attendance_but_cannot_delete_past_attendance(): void
    {
        $inspetora = $this->user(1);
        $pivot = $this->createPivot();
        $schoolDay = app(SchoolCalendarService::class)->currentDate();

        // Presença de hoje
        $todayAttendance = ContagemNe::create([
            'alunos_has_necessidades_id' => $pivot->id,
        ]);

        $resDelete = $this->actingAs($inspetora, 'sanctum')
            ->deleteJson("/api/contagem-nes/{$todayAttendance->id}");
        $resDelete->assertNoContent();
        $this->assertDatabaseMissing('contagem_nes', ['id' => $todayAttendance->id]);

        // Presença do passado (simulando created_at no passado)
        $pastAttendance = ContagemNe::create([
            'alunos_has_necessidades_id' => $pivot->id,
        ]);
        $pastAttendance->created_at = CarbonImmutable::createFromFormat('Y-m-d', $schoolDay)->subDay()->startOfDay();
        $pastAttendance->saveQuietly();

        $resPastDelete = $this->actingAs($inspetora, 'sanctum')
            ->deleteJson("/api/contagem-nes/{$pastAttendance->id}");
        $resPastDelete->assertStatus(400);
        $this->assertDatabaseHas('contagem_nes', ['id' => $pastAttendance->id]);
    }

    public function test_filtering_special_needs_attendance_by_date(): void
    {
        $user = $this->user(1);
        $pivot = $this->createPivot();
        $schoolDay = app(SchoolCalendarService::class)->currentDate();

        $today = ContagemNe::create(['alunos_has_necessidades_id' => $pivot->id]);

        $past = ContagemNe::create(['alunos_has_necessidades_id' => $pivot->id]);
        $past->created_at = '2026-08-15 10:00:00';
        $past->saveQuietly();

        // Busca por data de hoje
        $resToday = $this->actingAs($user, 'sanctum')
            ->getJson('/api/contagem-nes?data=' . $schoolDay);
        $resToday->assertOk();
        $ids = collect($resToday->json('data'))->pluck('id');
        $this->assertTrue($ids->contains($today->id));
        $this->assertFalse($ids->contains($past->id));
    }
}
