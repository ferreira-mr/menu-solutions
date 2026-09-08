<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\DisableAlunoRequest;
use App\Http\Requests\NecessidadeRequest;
use App\Http\Resources\NecessidadeResource;
use App\Models\AlunosHasNecessidade;
use App\Models\Necessidade;
use App\Services\VinculoService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Http\Response;
use Illuminate\Validation\Rule;

class NecessidadeController extends Controller
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

        $necessidades = Necessidade::orderBy('id')->paginate($validated['limit'] ?? 15)->withQueryString();

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
            'dias.*' => [
                'integer',
                Rule::exists('cronogramas', 'id')->whereNull('deleted_at'),
            ],
        ]);

        $necessidade = $this->vinculoService->attachCronogramas($necessidade, $validate['dias']);

        return response()->json(['message' => 'success', 'data' => $necessidade->load('necessidadesHasCronogramas')]);
    }

    public function disableAluno(DisableAlunoRequest $request, Necessidade $necessidade)
    {
        $this->vinculoService->removeStudentFromNeed($necessidade, $request->alunoId());

        return response()->noContent();
    }

    public function deleteCronograma(Request $request, AlunosHasNecessidade $necessidade)
    {
        $validate = $request->validate([
            'dias' => 'required|array|min:1',
            'dias.*' => [
                'integer',
                Rule::exists('cronogramas', 'id')->whereNull('deleted_at'),
            ],
        ]);

        $necessidade = $this->vinculoService->detachCronogramas($necessidade, $validate['dias']);

        return response()->json(['message' => 'success', 'data' => $necessidade->load('necessidadesHasCronogramas')]);
    }
}
