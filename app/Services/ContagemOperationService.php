<?php

namespace App\Services;

use App\Http\Resources\ContagemNeResource;
use App\Http\Resources\ContagenResource;
use App\Models\AlunosHasNecessidade;
use App\Models\Contagen;
use App\Models\ContagemNe;
use App\Models\ContagemOperacao;
use Illuminate\Database\QueryException;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\ValidationException;

class ContagemOperationService
{
    private const OPERATION = 'contagem.salvar';

    public function __construct(
        protected SchoolCalendarService $schoolCalendar,
    ) {}

    /**
     * Executes one count and its intended special-needs presence changes atomically.
     *
     * @return array{status: int, body: array<string, mixed>}
     */
    public function execute(array $data, int $userId): array
    {
        $key = (string) $data['idempotency_key'];
        $payloadHash = $this->payloadHash($data);
        $schoolDay = $this->schoolCalendar->currentDate();
        $schoolTime = $this->schoolCalendar->currentTime();

        try {
            return DB::transaction(function () use ($data, $userId, $key, $payloadHash, $schoolDay, $schoolTime): array {
                $existing = ContagemOperacao::query()
                    ->where('users_id', $userId)
                    ->where('operacao', self::OPERATION)
                    ->where('chave', $key)
                    ->lockForUpdate()
                    ->first();

                if ($existing) {
                    return $this->replayOrConflict($existing, $payloadHash);
                }

                [$contagem, $status] = $this->saveContagem($data, $userId, $schoolDay, $schoolTime);
                $relationIds = $this->savePresencas($data['presencas'] ?? [], (int) $data['turmas_id'], $schoolDay);
                $body = $this->responseBody($contagem, $relationIds, $schoolDay);

                ContagemOperacao::create([
                    'users_id' => $userId,
                    'operacao' => self::OPERATION,
                    'chave' => $key,
                    'payload_hash' => $payloadHash,
                    'status_http' => $status,
                    'resposta' => $body,
                ]);

                return ['status' => $status, 'body' => $body];
            });
        } catch (QueryException $exception) {
            if (! $this->isIdempotencyUniqueViolation($exception)) {
                throw $exception;
            }

            $existing = ContagemOperacao::query()
                ->where('users_id', $userId)
                ->where('operacao', self::OPERATION)
                ->where('chave', $key)
                ->first();

            if (! $existing) {
                throw $exception;
            }

            return $this->replayOrConflict($existing, $payloadHash);
        }
    }

    private function payloadHash(array $data): string
    {
        $presencas = collect($data['presencas'] ?? [])
            ->map(fn (array $presence): array => [
                'relacao_id' => (int) $presence['relacao_id'],
                'presenca_id' => isset($presence['presenca_id']) ? (int) $presence['presenca_id'] : null,
                'presente' => (bool) $presence['presente'],
            ])
            ->sortBy('relacao_id')
            ->values()
            ->all();

        $canonical = [
            'contagem_id' => isset($data['contagem_id']) ? (int) $data['contagem_id'] : null,
            'turmas_id' => (int) $data['turmas_id'],
            'qtd_contagem' => (int) $data['qtd_contagem'],
            'presencas' => $presencas,
        ];

        return hash('sha256', json_encode($canonical, JSON_UNESCAPED_UNICODE | JSON_THROW_ON_ERROR));
    }

    /**
     * @return array{0: Contagen, 1: int}
     */
    private function saveContagem(array $data, int $userId, string $schoolDay, string $schoolTime): array
    {
        if (! empty($data['contagem_id'])) {
            $contagem = Contagen::query()->lockForUpdate()->findOrFail($data['contagem_id']);
            $registeredDay = $contagem->data_contagem?->toDateString();

            if ((int) $contagem->turmas_id !== (int) $data['turmas_id'] || $registeredDay !== $schoolDay) {
                abort(409, 'A contagem informada não pertence à turma ou ao dia escolar atual.');
            }

            $contagem->update(['qtd_contagem' => (int) $data['qtd_contagem']]);

            return [$contagem->refresh(), 200];
        }

        return [Contagen::create([
            'data_contagem' => $schoolDay,
            'hora_contagem' => $schoolTime,
            'qtd_contagem' => (int) $data['qtd_contagem'],
            'turmas_id' => (int) $data['turmas_id'],
            'users_id' => $userId,
        ]), 201];
    }

    /**
     * @param array<int, array{relacao_id: int, presenca_id?: int|null, presente: bool}> $presencas
     * @return array<int, int>
     */
    private function savePresencas(array $presencas, int $turmaId, string $schoolDay): array
    {
        $relationIds = [];
        [$startUtc, $endUtc] = $this->schoolCalendar->utcWindowForDate($schoolDay);

        foreach ($presencas as $presenceData) {
            $relationId = (int) $presenceData['relacao_id'];
            $relation = AlunosHasNecessidade::query()
                ->with(['aluno', 'necessidade'])
                ->findOrFail($relationId);

            if (! $relation->aluno || ! $relation->necessidade) {
                throw ValidationException::withMessages([
                    'presencas' => ['O aluno e a necessidade da relação devem estar ativos.'],
                ]);
            }

            if ((int) $relation->aluno->turmas_id !== $turmaId) {
                throw ValidationException::withMessages([
                    'presencas' => ['A relação informada não pertence à turma selecionada.'],
                ]);
            }

            $relationIds[] = $relationId;
            $presenceId = $presenceData['presenca_id'] ?? null;
            $presence = null;

            if ($presenceId !== null) {
                $presence = ContagemNe::query()->lockForUpdate()->find($presenceId);

                if (! $presence
                    || (int) $presence->alunos_has_necessidades_id !== $relationId
                    || ! $this->isWithinWindow($presence->created_at, $startUtc, $endUtc)) {
                    abort(409, 'A presença informada não pertence à relação ou ao dia escolar atual.');
                }
            }

            if ((bool) $presenceData['presente']) {
                if ($presence === null) {
                    $existing = ContagemNe::query()
                        ->where('alunos_has_necessidades_id', $relationId)
                        ->where('created_at', '>=', $startUtc->toDateTimeString())
                        ->where('created_at', '<', $endUtc->toDateTimeString())
                        ->orderByDesc('created_at')
                        ->orderByDesc('id')
                        ->lockForUpdate()
                        ->get();

                    if ($existing->count() > 1) {
                        abort(409, 'Há múltiplas presenças históricas para a relação no dia escolar.');
                    }

                    $presence = $existing->first() ?? ContagemNe::create([
                        'alunos_has_necessidades_id' => $relationId,
                    ]);
                }
            } elseif ($presence !== null) {
                $presence->forceDelete();
            }
        }

        return array_values(array_unique($relationIds));
    }

    private function isWithinWindow($instant, $startUtc, $endUtc): bool
    {
        if ($instant === null) {
            return false;
        }

        return $instant >= $startUtc && $instant < $endUtc;
    }

    /**
     * @param array<int, int> $relationIds
     * @return array{contagem: array<string, mixed>, presencas: array<int, array<string, mixed>>}
     */
    private function responseBody(Contagen $contagem, array $relationIds, string $schoolDay): array
    {
        $contagem->load(['turma.categoria', 'user']);
        [$startUtc, $endUtc] = $this->schoolCalendar->utcWindowForDate($schoolDay);

        $presencas = ContagemNe::query()
            ->with(['alunosHasNecessidade.aluno', 'alunosHasNecessidade.necessidade'])
            ->whereIn('alunos_has_necessidades_id', $relationIds)
            ->where('created_at', '>=', $startUtc->toDateTimeString())
            ->where('created_at', '<', $endUtc->toDateTimeString())
            ->orderBy('id')
            ->get();

        return [
            'contagem' => ContagenResource::make($contagem)->resolve(),
            'presencas' => ContagemNeResource::collection($presencas)->resolve(),
        ];
    }

    /**
     * @return array{status: int, body: array<string, mixed>}
     */
    private function replayOrConflict(ContagemOperacao $operation, string $payloadHash): array
    {
        if (! hash_equals((string) $operation->payload_hash, $payloadHash)) {
            abort(409, 'A chave de idempotência já foi usada com outro payload.');
        }

        return [
            'status' => (int) $operation->status_http,
            'body' => $operation->resposta,
        ];
    }

    private function isIdempotencyUniqueViolation(QueryException $exception): bool
    {
        $message = strtolower($exception->getMessage());

        return str_contains($message, 'contagem_operacoes')
            && (str_contains($message, 'unique') || str_contains($message, 'duplicate'));
    }
}
