<?php

namespace Tests\Feature\Api;

use App\Models\Aluno;
use App\Models\AlunosHasNecessidade;
use App\Models\Contagen;
use App\Models\ContagemNe;
use App\Models\Necessidade;
use App\Models\Turma;
use App\Models\User;
use App\Services\SchoolCalendarService;
use Carbon\Carbon;
use Carbon\CarbonImmutable;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class ContagemOperationTest extends TestCase
{
    use RefreshDatabase;

    protected function tearDown(): void
    {
        Carbon::setTestNow();
        parent::tearDown();
    }

    private function user(int $level = 1): User
    {
        return User::factory()->create(['nivel_user' => $level]);
    }

    private function relation(?Turma $turma = null): AlunosHasNecessidade
    {
        $turma ??= Turma::factory()->create();

        return AlunosHasNecessidade::create([
            'alunos_id' => Aluno::factory()->create(['turmas_id' => $turma->id])->id,
            'necessidades_id' => Necessidade::factory()->create()->id,
        ]);
    }

    private function payload(int $turmaId, int $relationId, int $quantity = 28): array
    {
        return [
            'contagem_id' => null,
            'turmas_id' => $turmaId,
            'qtd_contagem' => $quantity,
            'presencas' => [[
                'relacao_id' => $relationId,
                'presenca_id' => null,
                'presente' => true,
            ]],
        ];
    }

    private function operation(User $user, array $payload, string $key)
    {
        return $this->actingAs($user, 'sanctum')
            ->withHeader('Idempotency-Key', $key)
            ->postJson('/api/contagens/operacao', $payload);
    }

    public function test_repeating_the_same_key_and_payload_replays_one_operation(): void
    {
        $user = $this->user();
        $turma = Turma::factory()->create();
        $relation = $this->relation($turma);
        $payload = $this->payload($turma->id, $relation->id);

        $first = $this->operation($user, $payload, '2f4f4383-8ff0-4d91-a1c9-b3b9a6a1c901');
        $second = $this->operation($user, $payload, '2f4f4383-8ff0-4d91-a1c9-b3b9a6a1c901');

        $first->assertCreated()->assertJsonStructure(['data' => ['contagem', 'presencas']]);
        $second->assertCreated()->assertExactJson($first->json());
        $this->assertDatabaseCount('contagens', 1);
        $this->assertDatabaseCount('contagem_nes', 1);
        $this->assertDatabaseCount('contagem_operacoes', 1);
    }

    public function test_reusing_a_key_with_a_different_payload_returns_conflict(): void
    {
        $user = $this->user();
        $turma = Turma::factory()->create();
        $relation = $this->relation($turma);
        $key = 'a3b8b2b4-5d50-4bb7-9b31-5f4f7db4d302';

        $this->operation($user, $this->payload($turma->id, $relation->id, 28), $key)->assertCreated();
        $this->operation($user, $this->payload($turma->id, $relation->id, 29), $key)
            ->assertStatus(409);

        $this->assertDatabaseCount('contagens', 1);
        $this->assertDatabaseHas('contagens', ['qtd_contagem' => 28]);
    }

    public function test_missing_or_invalid_idempotency_key_is_rejected_before_writing(): void
    {
        $user = $this->user();
        $turma = Turma::factory()->create();
        $relation = $this->relation($turma);
        $payload = $this->payload($turma->id, $relation->id);

        $this->actingAs($user, 'sanctum')
            ->postJson('/api/contagens/operacao', $payload)
            ->assertUnprocessable();
        $this->operation($user, $payload, 'invalida')->assertUnprocessable();

        $this->assertDatabaseCount('contagens', 0);
        $this->assertDatabaseCount('contagem_operacoes', 0);
    }

    public function test_existing_count_is_updated_with_status_ok_and_without_creating_a_revision(): void
    {
        $user = $this->user();
        $turma = Turma::factory()->create();
        $schoolDay = app(SchoolCalendarService::class)->currentDate();
        $contagem = Contagen::factory()->create([
            'turmas_id' => $turma->id,
            'users_id' => $user->id,
            'data_contagem' => $schoolDay,
            'qtd_contagem' => 28,
        ]);
        $payload = [
            'contagem_id' => $contagem->id,
            'turmas_id' => $turma->id,
            'qtd_contagem' => 29,
            'presencas' => [],
        ];

        $this->operation($user, $payload, '5a2b2fcb-51cd-49cf-b8af-a0a52f777405')
            ->assertOk()
            ->assertJsonPath('data.contagem.id', $contagem->id)
            ->assertJsonPath('data.contagem.qtd_contagem', 29);

        $this->assertDatabaseCount('contagens', 1);
        $this->assertDatabaseHas('contagens', ['id' => $contagem->id, 'qtd_contagem' => 29]);
        $this->assertDatabaseHas('contagem_operacoes', ['status_http' => 200]);
    }

    public function test_the_same_key_is_scoped_to_the_authenticated_user(): void
    {
        $firstUser = $this->user();
        $secondUser = $this->user();
        $turma = Turma::factory()->create();
        $relation = $this->relation($turma);
        $payload = $this->payload($turma->id, $relation->id);
        $key = '52f2a4fc-948c-4cca-b7d0-6d6249d6a404';

        $this->operation($firstUser, $payload, $key)->assertCreated();
        $this->operation($secondUser, $payload, $key)->assertCreated();

        $this->assertDatabaseCount('contagem_operacoes', 2);
        $this->assertDatabaseCount('contagens', 2);
    }

    public function test_invalid_relation_rolls_back_the_count_and_presence(): void
    {
        $user = $this->user();
        $turma = Turma::factory()->create();
        $otherRelation = $this->relation(Turma::factory()->create());

        $this->operation($user, $this->payload($turma->id, $otherRelation->id), 'db9e6a5a-96e4-4b63-8f4f-5bf5d1a1e403')
            ->assertUnprocessable();

        $this->assertDatabaseCount('contagens', 0);
        $this->assertDatabaseCount('contagem_nes', 0);
        $this->assertDatabaseCount('contagem_operacoes', 0);
    }

    public function test_dashboard_uses_the_latest_id_when_revisions_share_date_and_time(): void
    {
        Carbon::setTestNow('2026-09-08 01:00:00');
        $user = $this->user();
        $turma = Turma::factory()->create();
        $schoolDay = app(SchoolCalendarService::class)->currentDate();

        $first = Contagen::factory()->create([
            'turmas_id' => $turma->id,
            'users_id' => $user->id,
            'data_contagem' => $schoolDay,
            'hora_contagem' => '08:00:00',
            'qtd_contagem' => 10,
        ]);
        $second = Contagen::factory()->create([
            'turmas_id' => $turma->id,
            'users_id' => $user->id,
            'data_contagem' => $schoolDay,
            'hora_contagem' => $first->hora_contagem,
            'qtd_contagem' => 20,
        ]);

        $this->actingAs($user, 'sanctum')
            ->getJson('/api/contagens/dashboard?data='.$schoolDay)
            ->assertOk()
            ->assertJsonPath('data.0.turmas.0.qtd_contagem', 20);

        $this->assertDatabaseHas('contagens', ['id' => $second->id, 'qtd_contagem' => 20]);
    }
}
