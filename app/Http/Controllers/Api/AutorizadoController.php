<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\AutorizadoRequest;
use App\Http\Requests\AutorizarUpdateRequest;
use App\Http\Resources\AutorizadoResource;
use App\Models\Autorizado;
use App\Services\AutorizadoService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Http\Response;

class AutorizadoController extends Controller
{
    public function __construct(
        protected AutorizadoService $autorizadoService
    ) {}

    /**
     * Display a listing of the resource.
     */
    public function index(Request $request)
    {
        $autorizados = $this->autorizadoService->list();

        return AutorizadoResource::collection($autorizados);
    }

    /**
     * Store a newly created resource in storage.
     */
    public function store(AutorizadoRequest $request): JsonResponse
    {
        $autorizado = $this->autorizadoService->create($request->validated());

        return (new AutorizadoResource($autorizado))->response()->setStatusCode(201);
    }

    /**
     * Display the specified resource.
     */
    public function show(Autorizado $autorizado)
    {
        return new AutorizadoResource($autorizado);
    }

    /**
     * Update the specified resource in storage.
     */
    public function update(Request $request, Autorizado $autorizado)
    {
        $validated = $request->validate(Autorizado::updateRule());
        $autorizado = $this->autorizadoService->update($autorizado, $validated);

        return new AutorizadoResource($autorizado);
    }

    /**
     * Delete the specified resource.
     */
    public function destroy(Autorizado $autorizado): Response
    {
        $this->autorizadoService->delete($autorizado);

        return response()->noContent();
    }

    public function atualizar(AutorizarUpdateRequest $request, Autorizado $autorizado)
    {
        $autorizado = $this->autorizadoService->approve($autorizado, $request->validated());

        return new AutorizadoResource($autorizado);
    }
}
