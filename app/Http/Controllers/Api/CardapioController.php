<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Resources\CardapioResource;
use App\Models\Cardapio;
use App\Services\FileService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\File;
use Illuminate\Validation\ValidationException;
use Throwable;

class CardapioController extends Controller
{
    public $fileService;

    public function __construct(Request $request)
    {
        $this->fileService = new FileService($request);
    }

    /**
     * Display a listing of the resource.
     */
    public function index()
    {
        $cardapios = Cardapio::orderBy('created_at', 'DESC')->paginate();

        return CardapioResource::collection($cardapios);
    }

    /**
     * Store a newly created resource in storage.
     */
    public function store(Request $request)
    {
        try {
            $name = $this->fileService->FileUpload($request);

            Cardapio::create([
                'path' => $name,
            ]);

            return response()->json(['message' => 'success', 'name' => $name], 201);
        } catch (ValidationException $e) {
            throw $e;
        } catch (Throwable $e) {
            report($e);

            return response()->json(['message' => 'Não foi possível armazenar o cardápio'], 422);
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
            $name = $this->fileService->FileUpload($request);
            $oldPath = public_path('uploads/pdf/'.$cardapio->path);
            $cardapio->update(['path' => $name]);

            if (File::exists($oldPath)) {
                File::delete($oldPath);
            }

            return new CardapioResource($cardapio);
        } catch (ValidationException $e) {
            throw $e;
        } catch (Throwable $e) {
            report($e);

            return response()->json(['message' => 'Não foi possível atualizar o cardápio'], 422);
        }
    }

    /**
     * Remove the specified resource from storage.
     */
    public function destroy(Cardapio $cardapio)
    {
        $path = public_path('uploads/pdf/'.$cardapio->path);
        $cardapio->delete();

        if (File::exists($path)) {
            File::delete($path);
        }

        return response()->noContent();
    }
}
