<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\ContagenRequest;
use App\Http\Resources\ContagenResource;
use App\Models\Contagen;
use Illuminate\Http\Request;

class ContagenController extends Controller
{
    /**
     * Display a listing of the resource.
     */
    public function index(Request $request)
    {
        $day = $request->validate([
            'date' => ['nullable', 'date_format:Y-m-d'],
        ])['date'] ?? null;

        if ($day) {
            $contagens = Contagen::with(['turma.categoria'])->orderBy('data_contagem', 'DESC')->orderBy('hora_contagem', 'DESC')->where('data_contagem', $day)->paginate();

            return ContagenResource::collection($contagens);
        }

        $contagens = Contagen::with(['turma.categoria'])->orderBy('data_contagem', 'DESC')->orderBy('hora_contagem', 'DESC')->paginate();

        return ContagenResource::collection($contagens);
    }

    /**
     * Store a newly created resource in storage.
     */
    public function store(ContagenRequest $request)
    {
        $agora = now();
        $contagen = Contagen::create(array_merge($request->validated(), [
            'data_contagem' => $agora->toDateString(),
            'hora_contagem' => $agora->toTimeString(),
            'users_id' => auth()->id(),
        ]));

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

        $contagen->update($request->validate(Contagen::updateRule()));

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
