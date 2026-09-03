<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\NecessidadeRequest;
use App\Http\Resources\NecessidadeResource;
use App\Models\AlunosHasNecessidade;
use App\Models\ContagemNe;
use App\Models\Necessidade;
use App\Models\NecessidadesHasCronograma;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Http\Response;
use Illuminate\Support\Facades\DB;

class NecessidadeController extends Controller
{
    /**
     * Display a listing of the resource.
     */
    public function index(Request $request)
    {
        $necessidades = Necessidade::paginate();

        return NecessidadeResource::collection($necessidades);
    }

    /**
     * Store a newly created resource in storage.
     */
    public function store(NecessidadeRequest $request): JsonResponse
    {
        $necessidade = Necessidade::create($request->validated());

        return (new NecessidadeResource($necessidade))->response()->setStatusCode(201);
    }

    /**
     * Display the specified resource.
     */
    public function show(Necessidade $necessidade)
    {
        return new NecessidadeResource($necessidade->load('alunos'));
    }

    /**
     * Update the specified resource in storage.
     */
    public function update(NecessidadeRequest $request, Necessidade $necessidade)
    {
        $necessidade->update($request->validated());

        return new NecessidadeResource($necessidade);
    }

    /**
     * Delete the specified resource.
     */
    public function destroy(Necessidade $necessidade): Response|JsonResponse
    {
        if ($necessidade->alunosHasNecessidades()->exists()) {
            return response()->json(['message' => 'Remova as relações dos alunos antes de excluir a necessidade'], 409);
        }

        $necessidade->delete();

        return response()->noContent();
    }

    public function relationCronograma(Request $request, AlunosHasNecessidade $necessidade)
    {
        $validate = $request->validate([
            'dias' => 'required|array|min:1',
            'dias.*' => 'integer|exists:cronogramas,id',
        ]);

        $necessidade->necessidadesHasCronogramas()->syncWithoutDetaching($validate['dias']);

        return response()->json(['message' => 'success', 'data' => $necessidade->load('necessidadesHasCronogramas')]);
    }

    public function disableAluno(Request $request, Necessidade $necessidade)
    {
        $validate = $request->validate([
            'alunos' => 'required',
        ]);

        $alunoId = is_array($validate['alunos'])
            ? ($validate['alunos'][0] ?? null)
            : $validate['alunos'];

        if (! is_numeric($alunoId) || (int) $alunoId < 1) {
            return response()->json(['message' => 'Aluno inválido'], 422);
        }

        $id = AlunosHasNecessidade::where('alunos_id', (int) $alunoId)
            ->where('necessidades_id', $necessidade->id)
            ->first() ?? null;

        if (! $id) {
            return response()->json(['message' => 'Relação de necessidade e aluno não encontrada'], 404);
        }

        if (ContagemNe::where('alunos_has_necessidades_id', $id->id)->exists()) {
            return response()->json(['message' => 'Não é possível remover uma relação que já possui contagens registradas'], 409);
        }

        DB::transaction(function () use ($id) {
            NecessidadesHasCronograma::where('alunos_has_necessidades_id', $id->id)->delete();
            $id->delete();
        });

        return response()->noContent();
    }

    public function deleteCronograma(Request $request, AlunosHasNecessidade $necessidade)
    {
        $validate = $request->validate([
            'dias' => 'required|array|min:1',
            'dias.*' => 'integer|exists:cronogramas,id',
        ]);

        $necessidade->necessidadesHasCronogramas()->detach($validate['dias']);

        return response()->json(['message' => 'success', 'data' => $necessidade->load('necessidadesHasCronogramas')]);
    }
}
