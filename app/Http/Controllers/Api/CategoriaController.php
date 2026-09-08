<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\CategoriaRequest;
use App\Http\Resources\CategoriaResource;
use App\Models\Categoria;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Http\Response;

class CategoriaController extends Controller
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

        $categorias = Categoria::with(['turmas'])
            ->orderBy('id')
            ->paginate($validated['limit'] ?? 15)
            ->withQueryString();

        return CategoriaResource::collection($categorias);
    }

    /**
     * Store a newly created resource in storage.
     */
    public function store(CategoriaRequest $request): JsonResponse
    {
        $categoria = Categoria::create($request->validated());

        return (new CategoriaResource($categoria))->response()->setStatusCode(201);
    }

    /**
     * Display the specified resource.
     */
    public function show(Categoria $categoria)
    {
        return new CategoriaResource($categoria);
    }

    /**
     * Update the specified resource in storage.
     */
    public function update(CategoriaRequest $request, Categoria $categoria)
    {
        $categoria->update($request->validated());

        return new CategoriaResource($categoria);
    }

    /**
     * Delete the specified resource.
     */
    public function destroy(Categoria $categoria): Response|JsonResponse
    {
        if ($categoria->turmas()->exists()) {
            return response()->json(['message' => 'Remova as turmas antes de excluir a categoria'], 409);
        }

        $categoria->delete();

        return response()->noContent();
    }
}
