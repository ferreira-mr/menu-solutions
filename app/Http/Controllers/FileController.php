<?php

namespace App\Http\Controllers;

use App\Http\Requests\StudentPhotoRequest;
use App\Http\Resources\AlunoResource;
use App\Models\Aluno;
use App\Services\FileService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;
use Illuminate\Validation\ValidationException;
use InvalidArgumentException;
use Symfony\Component\HttpFoundation\Response;
use Throwable;

class FileController extends Controller
{
    public $fileService;

    public function __construct(FileService $fileService)
    {
        $this->fileService = $fileService;
    }

    public function uploadImage(Request $request)
    {
        try {
            $validated = $request->validate([
                'aluno_id' => ['required', 'integer', 'exists:alunos,id'],
                'file' => ['required', 'file', 'max:20000', 'mimes:jpg,jpeg,png,webp'],
            ]);
            $aluno = Aluno::query()->findOrFail($validated['aluno_id']);
            $updatedAluno = $this->fileService->replaceStudentPhoto($aluno, $request->file('file'));

            return new AlunoResource($updatedAluno);
        } catch (ValidationException $e) {
            throw $e;
        } catch (Throwable $e) {
            report($e);

            return response()->json(['message' => 'Não foi possível concluir a operação.'], 500);
        }
    }

    public function uploadStudentPhoto(StudentPhotoRequest $request, Aluno $aluno)
    {
        try {
            $updatedAluno = $this->fileService->replaceStudentPhoto($aluno, $request->file('file'));

            return new AlunoResource($updatedAluno);
        } catch (ValidationException $e) {
            throw $e;
        } catch (Throwable $e) {
            report($e);

            return response()->json(['message' => 'Não foi possível concluir a operação.'], 500);
        }
    }

    public function studentPhoto(Aluno $aluno): Response
    {
        try {
            $path = $this->fileService->studentPhotoPath((string) $aluno->foto);
        } catch (InvalidArgumentException) {
            abort(404);
        }

        $disk = Storage::disk($this->fileService->studentPhotoDiskName());
        abort_unless($disk->exists($path), 404);

        return $disk->response($path, basename($path), [
            'Cache-Control' => 'private, no-store',
            'X-Content-Type-Options' => 'nosniff',
        ]);
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

            return response()->json(['message' => 'Não foi possível concluir a operação.'], 500);
        }
    }
}
