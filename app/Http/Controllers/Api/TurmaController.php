<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\TurmaRequest;
use App\Http\Resources\TurmaResource;
use App\Models\Turma;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Http\Response;

class TurmaController extends Controller
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

        $turmas = Turma::with(['categoria'])
            ->orderBy('id')
            ->paginate($validated['limit'] ?? 15)
            ->withQueryString();

        return TurmaResource::collection($turmas);
    }

    /**
     * Store a newly created resource in storage.
     */
    public function store(TurmaRequest $request): JsonResponse
    {
        $turma = Turma::create($request->validated());

        return (new TurmaResource($turma))->response()->setStatusCode(201);
    }

    /**
     * Display the specified resource.
     */
    public function show(Turma $turma)
    {
        return new TurmaResource($turma);
    }

    /**
     * Update the specified resource in storage.
     */
    public function update(Request $request, Turma $turma)
    {
        $attributes = $request->all();
        $turma->update($request->validate(Turma::updateRule($turma, $attributes)));

        return new TurmaResource($turma);
    }

    /**
     * Delete the specified resource.
     */
    public function destroy(Turma $turma): Response|JsonResponse
    {
        if ($turma->alunos()->exists() || $turma->contagen()->exists()) {
            return response()->json(['message' => 'Remova os alunos e contagens antes de excluir a turma'], 409);
        }

        $turma->delete();

        return response()->noContent();
    }
}
