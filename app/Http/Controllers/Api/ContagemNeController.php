<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\ContagemNeRequest;
use App\Http\Resources\ContagemNeResource;
use App\Models\ContagemNe;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use App\Services\SchoolCalendarService;
use App\Services\VinculoService;
use Illuminate\Validation\ValidationException;

class ContagemNeController extends Controller
{
    public function __construct(
        protected SchoolCalendarService $schoolCalendar,
        protected VinculoService $vinculoService,
    ) {}

    /**
     * Display a listing of the resource.
     */
    public function index(Request $request)
    {
        $validated = $request->validate([
            'data' => ['nullable', 'date_format:Y-m-d'],
            'date' => ['nullable', 'date_format:Y-m-d'],
            'data_inicio' => ['nullable', 'date_format:Y-m-d'],
            'data_fim' => ['nullable', 'date_format:Y-m-d'],
            'page' => ['nullable', 'integer', 'min:1'],
            'limit' => ['nullable', 'integer', 'min:1', 'max:1000'],
        ]);

        if (($validated['data_inicio'] ?? null) !== null
            && ($validated['data_fim'] ?? null) !== null
            && $validated['data_fim'] < $validated['data_inicio']) {
            throw ValidationException::withMessages([
                'data_fim' => ['A data final deve ser igual ou posterior à data inicial.'],
            ]);
        }

        $day = $validated['data'] ?? $validated['date'] ?? null;
        $dataInicio = $validated['data_inicio'] ?? null;
        $dataFim = $validated['data_fim'] ?? null;

        $query = ContagemNe::with(['alunosHasNecessidade.aluno', 'alunosHasNecessidade.necessidade']);

        if ($day) {
            [$startUtc, $endUtc] = $this->schoolCalendar->utcWindowForDate($day);
            $query->where('created_at', '>=', $startUtc->toDateTimeString())
                ->where('created_at', '<', $endUtc->toDateTimeString());
        } elseif ($dataInicio && $dataFim) {
            [$startUtc] = $this->schoolCalendar->utcWindowForDate($dataInicio);
            [, $endUtc] = $this->schoolCalendar->utcWindowForDate($dataFim);
            $query->where('created_at', '>=', $startUtc->toDateTimeString())
                ->where('created_at', '<', $endUtc->toDateTimeString());
        } elseif ($dataInicio) {
            [$startUtc] = $this->schoolCalendar->utcWindowForDate($dataInicio);
            $query->where('created_at', '>=', $startUtc->toDateTimeString());
        } elseif ($dataFim) {
            [, $endUtc] = $this->schoolCalendar->utcWindowForDate($dataFim);
            $query->where('created_at', '<', $endUtc->toDateTimeString());
        }

        $perPage = $validated['limit'] ?? 100;
        $contagemNes = $query
            ->orderByDesc('created_at')
            ->orderByDesc('id')
            ->paginate($perPage)
            ->withQueryString();

        return ContagemNeResource::collection($contagemNes);
    }

    /**
     * Store a newly created resource in storage.
     */
    public function store(ContagemNeRequest $request): JsonResponse
    {
        $contagemNe = $this->vinculoService->createPresence(
            (int) $request->validated('alunos_has_necessidades_id'),
        );

        return (new ContagemNeResource($contagemNe->load(['alunosHasNecessidade.aluno', 'alunosHasNecessidade.necessidade'])))->response()->setStatusCode(201);
    }

    /**
     * Display the specified resource.
     */
    public function show(ContagemNe $contagemNe)
    {
        return new ContagemNeResource($contagemNe->load(['alunosHasNecessidade.aluno', 'alunosHasNecessidade.necessidade']));
    }

    /**
     * Update the specified resource in storage.
     */
    public function update(ContagemNeRequest $request, ContagemNe $contagemNe)
    {
        if (! $this->schoolCalendar->isCurrentDate($this->schoolCalendar->dateForInstant($contagemNe->created_at))) {
            return response()->json(['message' => 'Atualização permitida somente no dia do registro'], 422);
        }

        $contagemNe = $this->vinculoService->updatePresence(
            $contagemNe,
            (int) $request->validated('alunos_has_necessidades_id'),
        );

        return new ContagemNeResource($contagemNe->load(['alunosHasNecessidade.aluno', 'alunosHasNecessidade.necessidade']));
    }

    /**
     * Delete the specified resource.
     */
    public function destroy(ContagemNe $contagemNe)
    {
        if (! $this->schoolCalendar->isCurrentDate($this->schoolCalendar->dateForInstant($contagemNe->created_at))) {
            return response()->json(['message' => 'Ação negada / Fora de horario permitido'], 400);
        }

        $contagemNe->forceDelete();

        return response()->noContent();
    }
}
