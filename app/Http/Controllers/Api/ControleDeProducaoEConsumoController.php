<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\ControleDeProducaoEConsumoRequest;
use App\Http\Resources\ControleDeProducaoEConsumoResource;
use App\Models\ControleDeProducaoEConsumo;
use App\Services\ProducaoConsumoService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Http\Response;

class ControleDeProducaoEConsumoController extends Controller
{
    public function __construct(
        protected ProducaoConsumoService $producaoService
    ) {}

    /**
     * Display a listing of the resource.
     */
    public function index(Request $request)
    {
        $controleDeProducaoEConsumos = $this->producaoService->list();

        return ControleDeProducaoEConsumoResource::collection($controleDeProducaoEConsumos);
    }

    /**
     * Store a newly created resource in storage.
     */
    public function store(ControleDeProducaoEConsumoRequest $request): JsonResponse
    {
        $controleDeProducaoEConsumo = $this->producaoService->create($request->validated());

        return (new ControleDeProducaoEConsumoResource($controleDeProducaoEConsumo))->response()->setStatusCode(201);
    }

    /**
     * Display the specified resource.
     */
    public function show(ControleDeProducaoEConsumo $controle_de_producao)
    {
        return new ControleDeProducaoEConsumoResource($controle_de_producao);
    }

    /**
     * Update the specified resource in storage.
     */
    public function update(Request $request, ControleDeProducaoEConsumo $controle_de_producao)
    {
        $validated = $request->validate(ControleDeProducaoEConsumo::updateRule());
        $controle_de_producao = $this->producaoService->update($controle_de_producao, $validated);

        return new ControleDeProducaoEConsumoResource($controle_de_producao);
    }

    /**
     * Delete the specified resource.
     */
    public function destroy(ControleDeProducaoEConsumo $controle_de_producao): Response
    {
        $this->producaoService->delete($controle_de_producao);

        return response()->noContent();
    }
}
