<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Resources\CardapioResource;
use App\Models\Cardapio;
use App\Services\CardapioService;
use Illuminate\Http\Request;
use Illuminate\Validation\ValidationException;
use Throwable;

class CardapioController extends Controller
{
    public function __construct(private readonly CardapioService $cardapioService)
    {
    }

    /**
     * Display a listing of the resource.
     */
    public function index(Request $request)
    {
        $validated = $request->validate([
            'page' => ['nullable', 'integer', 'min:1'],
            'limit' => ['nullable', 'integer', 'min:1', 'max:1000'],
        ]);

        $cardapios = Cardapio::orderByDesc('created_at')
            ->orderByDesc('id')
            ->paginate($validated['limit'] ?? 15)
            ->withQueryString();

        return CardapioResource::collection($cardapios);
    }

    /**
     * Store a newly created resource in storage.
     */
    public function store(Request $request)
    {
        try {
            [, $name] = $this->cardapioService->create($request);

            return response()->json(['message' => 'success', 'name' => $name], 201);
        } catch (ValidationException $e) {
            throw $e;
        } catch (Throwable $e) {
            report($e);

            return response()->json(['message' => 'Não foi possível concluir a operação.'], 500);
        }
    }

    /**
     * Display the specified resource.
     */
    public function show(Cardapio $cardapio)
    {
        return new CardapioResource($cardapio);
    }

    public function update(Request $request, Cardapio $cardapio)
    {
        try {
            $cardapio = $this->cardapioService->update($request, $cardapio);

            return new CardapioResource($cardapio);
        } catch (ValidationException $e) {
            throw $e;
        } catch (Throwable $e) {
            report($e);

            return response()->json(['message' => 'Não foi possível concluir a operação.'], 500);
        }
    }

    /**
     * Remove the specified resource from storage.
     */
    public function destroy(Cardapio $cardapio)
    {
        try {
            $this->cardapioService->delete($cardapio);
        } catch (Throwable $e) {
            report($e);

            return response()->json(['message' => 'Não foi possível concluir a operação.'], 500);
        }

        return response()->noContent();
    }
}
