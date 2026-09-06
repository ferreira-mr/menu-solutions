<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\ContagemNeRequest;
use App\Http\Resources\ContagemNeResource;
use App\Models\ContagemNe;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class ContagemNeController extends Controller
{
    /**
     * Display a listing of the resource.
     */
    public function index(Request $request)
    {
        $validated = $request->validate([
            'data' => ['nullable', 'date_format:Y-m-d'],
            'date' => ['nullable', 'date_format:Y-m-d'],
            'limit' => ['nullable', 'integer', 'min:1', 'max:1000'],
        ]);

        $day = $validated['data'] ?? $validated['date'] ?? null;

        $query = ContagemNe::with(['alunosHasNecessidade.aluno', 'alunosHasNecessidade.necessidade']);

        if ($day) {
            $query->whereDate('created_at', $day);
        }

        $perPage = $validated['limit'] ?? 100;
        $contagemNes = $query->paginate($perPage);

        return ContagemNeResource::collection($contagemNes);
    }

    /**
     * Store a newly created resource in storage.
     */
    public function store(ContagemNeRequest $request): JsonResponse
    {
        $contagemNe = ContagemNe::create($request->validated());

        return (new ContagemNeResource($contagemNe))->response()->setStatusCode(201);
    }

    /**
     * Display the specified resource.
     */
    public function show(ContagemNe $contagemNe)
    {
        return new ContagemNeResource($contagemNe);
    }

    /**
     * Update the specified resource in storage.
     */
    public function update(ContagemNeRequest $request, ContagemNe $contagemNe)
    {
        if ($contagemNe->created_at?->toDateString() !== today()->toDateString()) {
            return response()->json(['message' => 'Atualização permitida somente no dia do registro'], 422);
        }

        $contagemNe->update($request->validated());

        return new ContagemNeResource($contagemNe);
    }

    /**
     * Delete the specified resource.
     */
    public function destroy(ContagemNe $contagemNe)
    {
        if ($contagemNe->created_at?->toDateString() !== today()->toDateString()) {
            return response()->json(['message' => 'Ação negada / Fora de horario permitido'], 400);
        }

        $contagemNe->forceDelete();

        return response()->noContent();
    }
}
