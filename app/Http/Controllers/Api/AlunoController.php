<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\AlunoRequest;
use App\Http\Resources\AlunoResource;
use App\Models\Aluno;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Http\Response;

class AlunoController extends Controller
{
    /**
     * Display a listing of the resource.
     */
    public function index(Request $request)
    {
        $alunos = Aluno::paginate();

        return AlunoResource::collection($alunos);
    }

    /**
     * Store a newly created resource in storage.
     */
    public function store(AlunoRequest $request): JsonResponse
    {
        $aluno = Aluno::create($request->validated());

        return (new AlunoResource($aluno))->response()->setStatusCode(201);
    }

    /**
     * Display the specified resource.
     */
    public function show(Aluno $aluno)
    {
        return new AlunoResource($aluno);
    }

    /**
     * Update the specified resource in storage.
     */
    public function update(Request $request, Aluno $aluno)
    {
        $aluno->update($request->validate(Aluno::updateRule()));

        return new AlunoResource($aluno);
    }

    /**
     * Delete the specified resource.
     */
    public function destroy(Aluno $aluno): Response|JsonResponse
    {
        if ($aluno->necessidades()->exists()) {
            return response()->json(['message' => 'Remova as necessidades relacionadas antes de excluir o aluno'], 409);
        }

        $aluno->delete();

        return response()->noContent();
    }

    public function relationNecessidades(Request $request, Aluno $aluno)
    {
        $validate = $request->validate([
            'necessidades' => 'required|array|min:1',
            'necessidades.*' => 'integer|exists:necessidades,id',
        ]);

        $aluno->necessidades()->syncWithoutDetaching($validate['necessidades']);

        return new AlunoResource($aluno->load('necessidades'));
    }
}
