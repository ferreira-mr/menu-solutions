<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\AutorizadoRequest;
use App\Http\Requests\AutorizarUpdateRequest;
use App\Http\Resources\AutorizadoResource;
use App\Models\Autorizado;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Http\Response;

class AutorizadoController extends Controller
{
    /**
     * Display a listing of the resource.
     */
    public function index(Request $request)
    {
        $autorizados = Autorizado::paginate();

        return AutorizadoResource::collection($autorizados);
    }

    /**
     * Store a newly created resource in storage.
     */
    public function store(AutorizadoRequest $request): JsonResponse
    {
        $autorizado = Autorizado::create($request->validated());

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
        $autorizado->update($request->validate(Autorizado::updateRule()));

        return new AutorizadoResource($autorizado);
    }

    /**
     * Delete the specified resource.
     */
    public function destroy(Autorizado $autorizado): Response
    {
        $autorizado->delete();

        return response()->noContent();
    }

    public function atualizar(AutorizarUpdateRequest $request, Autorizado $autorizado)
    {
        $dados = $request->validated();
        $autorizado->update($dados);

        return new AutorizadoResource($autorizado);
    }
}
