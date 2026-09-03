<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\NecessidadesHasCronogramaRequest;
use App\Http\Resources\NecessidadesHasCronogramaResource;
use App\Models\NecessidadesHasCronograma;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Http\Response;

class NecessidadesHasCronogramaController extends Controller
{
    /**
     * Display a listing of the resource.
     */
    public function index(Request $request)
    {
        $necessidadesHasCronogramas = NecessidadesHasCronograma::paginate();

        return NecessidadesHasCronogramaResource::collection($necessidadesHasCronogramas);
    }

    /**
     * Store a newly created resource in storage.
     */
    public function store(NecessidadesHasCronogramaRequest $request): JsonResponse
    {
        $necessidadesHasCronograma = NecessidadesHasCronograma::create($request->validated());

        return (new NecessidadesHasCronogramaResource($necessidadesHasCronograma))->response()->setStatusCode(201);
    }

    /**
     * Display the specified resource.
     */
    public function show(NecessidadesHasCronograma $necessidadesHasCronograma)
    {
        return new NecessidadesHasCronogramaResource($necessidadesHasCronograma);
    }

    /**
     * Update the specified resource in storage.
     */
    public function update(NecessidadesHasCronogramaRequest $request, NecessidadesHasCronograma $necessidadesHasCronograma)
    {
        $necessidadesHasCronograma->update($request->validated());

        return new NecessidadesHasCronogramaResource($necessidadesHasCronograma);
    }

    /**
     * Delete the specified resource.
     */
    public function destroy(NecessidadesHasCronograma $necessidadesHasCronograma): Response
    {
        $necessidadesHasCronograma->delete();

        return response()->noContent();
    }
}
