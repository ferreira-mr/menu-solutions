<?php

namespace App\Http\Controllers;

use App\Services\FileService;
use Illuminate\Http\Request;
use Illuminate\Validation\ValidationException;
use Throwable;

class FileController extends Controller
{
    public $fileService;

    public function __construct(Request $request)
    {
        $this->fileService = new FileService($request);
    }

    public function uploadImage(Request $request)
    {
        try {
            $name = $this->fileService->FileUploadImage($request);

            return response()->json(['message' => 'success', 'path' => $name]);
        } catch (ValidationException $e) {
            throw $e;
        } catch (Throwable $e) {
            report($e);

            return response()->json(['message' => 'Não foi possível enviar a imagem'], 422);
        }
    }

    public function uploadPdf(Request $request)
    {
        try {
            $name = $this->fileService->FileUpload($request);

            return response()->json(['message' => 'success', 'path' => $name]);
        } catch (ValidationException $e) {
            throw $e;
        } catch (Throwable $e) {
            report($e);

            return response()->json(['message' => 'Não foi possível enviar o arquivo'], 422);
        }
    }
}
