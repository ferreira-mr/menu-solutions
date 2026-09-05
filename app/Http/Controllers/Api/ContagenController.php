<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\ContagenRequest;
use App\Http\Resources\ContagenResource;
use App\Models\Contagen;
use App\Services\ContagemService;
use Illuminate\Http\Request;

class ContagenController extends Controller
{
    public function __construct(
        protected ContagemService $contagemService
    ) {}

    /**
     * Display a listing of the resource.
     */
    public function index(Request $request)
    {
        $validated = $request->validate([
            'date' => ['nullable', 'date_format:Y-m-d'],
            'data' => ['nullable', 'date_format:Y-m-d'],
            'data_inicio' => ['nullable', 'date_format:Y-m-d'],
            'data_fim' => ['nullable', 'date_format:Y-m-d'],
            'limit' => ['nullable', 'integer', 'min:1', 'max:1000'],
        ]);

        $contagens = $this->contagemService->list($validated);

        return ContagenResource::collection($contagens);
    }

    /**
     * Store a newly created resource in storage.
     */
    public function store(ContagenRequest $request)
    {
        $contagen = $this->contagemService->create($request->validated(), auth()->id());

        return (new ContagenResource($contagen))->response()->setStatusCode(201);
    }

    /**
     * Display the specified resource.
     */
    public function show(Contagen $contagen)
    {
        return new ContagenResource($contagen);
    }

    /**
     * Update the specified resource in storage.
     */
    public function update(Request $request, Contagen $contagen)
    {
        if ($contagen->data_contagem?->toDateString() !== today()->toDateString()) {
            return response()->json(['message' => 'Update nao permitido / Fora de horario permitido'], 400);
        }

        $validated = $request->validate(Contagen::updateRule());
        $contagen = $this->contagemService->update($contagen, $validated);

        return new ContagenResource($contagen);
    }

    /**
     * Delete the specified resource.
     */
    public function destroy(Contagen $contagen)
    {
        return response()->json(['message' => 'Rota Indisponivel'], 404);
    }
}
