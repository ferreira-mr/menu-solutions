<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\AlunoRequest;
use App\Http\Resources\AlunoResource;
use App\Models\Aluno;
use App\Services\VinculoService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Http\Response;
use Illuminate\Validation\Rule;

class AlunoController extends Controller
{
    public function __construct(
        protected VinculoService $vinculoService,
    ) {}

    /**
     * Display a listing of the resource.
     */
    public function index(Request $request)
    {
        $validated = $request->validate([
            'page' => ['nullable', 'integer', 'min:1'],
            'limit' => ['nullable', 'integer', 'min:1', 'max:1000'],
        ]);

        $alunos = Aluno::orderBy('id')->paginate($validated['limit'] ?? 15)->withQueryString();

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
        $aluno->update($request->validate(Aluno::updateRule($aluno)));

        return new AlunoResource($aluno);
    }

    /**
     * Delete the specified resource.
     */
    public function destroy(Aluno $aluno): Response|JsonResponse
    {
        if ($aluno->alunosHasNecessidades()->exists()) {
            return response()->json(['message' => 'Remova as necessidades relacionadas antes de excluir o aluno'], 409);
        }

        $aluno->delete();

        return response()->noContent();
    }

    public function relationNecessidades(Request $request, Aluno $aluno)
    {
        $validate = $request->validate([
            'necessidades' => 'required|array|min:1',
            'necessidades.*' => [
                'integer',
                Rule::exists('necessidades', 'id')->whereNull('deleted_at'),
            ],
        ]);

        $aluno = $this->vinculoService->attachNecessidades($aluno, $validate['necessidades']);

        return new AlunoResource($aluno->load('necessidades'));
    }
}
