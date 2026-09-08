<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\CronogramaRequest;
use App\Http\Resources\CronogramaResource;
use App\Models\Cronograma;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Http\Response;

class CronogramaController extends Controller
{
    /**
     * Display a listing of the resource.
     */
    public function index(Request $request)
    {
        $validated = $request->validate([
            'page' => ['nullable', 'integer', 'min:1'],
            'limit' => ['nullable', 'integer', 'min:1', 'max:1000'],
        ]);

        $cronogramas = Cronograma::with(['necessidadesHasCronogramas.aluno_has_necessidade.aluno', 'necessidadesHasCronogramas.aluno_has_necessidade.necessidade'])
            ->orderBy('id')
            ->paginate($validated['limit'] ?? 15)
            ->withQueryString();

        return CronogramaResource::collection($cronogramas);
    }

    /**
     * Store a newly created resource in storage.
     */
    public function store(CronogramaRequest $request): JsonResponse
    {
        $cronograma = Cronograma::create($request->validated());

        return (new CronogramaResource($cronograma))->response()->setStatusCode(201);
    }

    /**
     * Display the specified resource.
     */
    public function show(Cronograma $cronograma)
    {
        return new CronogramaResource($cronograma->load('necessidadesHasCronogramas.aluno_has_necessidade.aluno', 'necessidadesHasCronogramas.aluno_has_necessidade.necessidade'));
    }

    /**
     * Update the specified resource in storage.
     */
    public function update(CronogramaRequest $request, Cronograma $cronograma)
    {
        $cronograma->update($request->validated());

        return new CronogramaResource($cronograma);
    }

    /**
     * Delete the specified resource.
     */
    public function destroy(Cronograma $cronograma): Response|JsonResponse
    {
        if ($cronograma->necessidadesHasCronogramas()->exists()) {
            return response()->json(['message' => 'Remova os vínculos antes de excluir o cronograma'], 409);
        }

        $cronograma->delete();

        return response()->noContent();
    }
}
