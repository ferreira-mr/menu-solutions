<?php

namespace App\Services;

use App\Models\Aluno;
use Illuminate\Http\Request;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;
use InvalidArgumentException;
use RuntimeException;
use Throwable;

class FileService
{
    private string $diskName;

    public function __construct(?Request $request = null)
    {
        $this->diskName = (string) config('filesystems.cardapio_disk', 'uploads');
    }

    public function FileUpload(Request $request): string
    {
        $request->validate([
            'file' => 'required|file|max:20000|mimes:pdf',
        ]);

        return $this->store($request->file('file'), 'uploads/pdf');
    }

    public function FileUploadImage(Request $request): string
    {
        $request->validate([
            'file' => 'required|file|max:20000|mimes:jpg,jpeg,png,webp',
        ]);

        return $this->store($request->file('file'), '', $this->studentPhotoDiskName());
    }

    public function replaceStudentPhoto(Aluno $aluno, UploadedFile $file): Aluno
    {
        $newName = $this->storeStudentPhoto($file);
        $oldName = null;

        try {
            if (filled($aluno->foto)) {
                try {
                    $oldName = $this->studentPhotoFilename((string) $aluno->foto);
                } catch (InvalidArgumentException) {
                    // A malformed legacy reference is replaced without being used as a path.
                    $oldName = null;
                }
            }

            DB::transaction(function () use ($aluno, $newName): void {
                $aluno->forceFill(['foto' => $newName])->saveOrFail();
            });
        } catch (Throwable $exception) {
            try {
                $this->deleteStudentPhoto($newName);
            } catch (Throwable $cleanupException) {
                report($cleanupException);
            }

            throw $exception;
        }

        if ($oldName !== null && $oldName !== $newName) {
            $oldPath = $this->studentPhotoPath($oldName);
            $disk = Storage::disk($this->studentPhotoDiskName());

            if ($disk->exists($oldPath)) {
                try {
                    if (! $this->deleteStudentPhoto($oldName)) {
                        throw new RuntimeException('O disco não confirmou a remoção da foto anterior.');
                    }
                } catch (Throwable $exception) {
                    report($exception);
                }
            }
        }

        return $aluno->fresh();
    }

    public function storeStudentPhoto(UploadedFile $file): string
    {
        return $this->store($file, '', $this->studentPhotoDiskName());
    }

    public function studentPhotoDiskName(): string
    {
        return (string) config('filesystems.student_photo_disk', 'student_photos');
    }

    public function studentPhotoFilename(string $reference): string
    {
        $normalized = str_replace('\\', '/', trim($reference));

        if (str_starts_with($normalized, 'uploads/')) {
            $normalized = substr($normalized, strlen('uploads/'));
        }

        $this->assertSafeFilename($normalized);

        return $normalized;
    }

    public function studentPhotoPath(string $reference): string
    {
        return $this->studentPhotoFilename($reference);
    }

    public function publicStudentPhotoPath(string $reference): string
    {
        return 'uploads/'.$this->studentPhotoFilename($reference);
    }

    public function deleteStudentPhoto(string $reference): bool
    {
        return $this->delete($this->studentPhotoPath($reference), $this->studentPhotoDiskName());
    }

    public function cardapioPath(string $name): string
    {
        $this->assertSafeFilename($name);

        return 'uploads/pdf/'.$name;
    }

    public function delete(string $relativePath, ?string $diskName = null): bool
    {
        $this->assertSafeRelativePath($relativePath);

        return (bool) Storage::disk($diskName ?? $this->diskName)->delete($relativePath);
    }

    public function diskName(): string
    {
        return $this->diskName;
    }

    private function store(UploadedFile $file, string $directory, ?string $diskName = null): string
    {
        $name = Str::uuid()->toString().'.'.$file->extension();
        $stored = Storage::disk($diskName ?? $this->diskName)->putFileAs($directory, $file, $name);

        if ($stored === false) {
            throw new RuntimeException('O disco não confirmou a gravação do arquivo.');
        }

        return $name;
    }

    private function assertSafeFilename(string $name): void
    {
        if ($name === '' || basename($name) !== $name || str_contains($name, '..') || str_contains($name, '/') || str_contains($name, '\\')) {
            throw new InvalidArgumentException('Referência de arquivo inválida.');
        }
    }

    private function assertSafeRelativePath(string $path): void
    {
        $normalized = str_replace('\\', '/', $path);

        if ($normalized === '' || str_starts_with($normalized, '/') || preg_match('/^[A-Za-z]:/', $normalized) === 1 || str_contains($normalized, '..')) {
            throw new InvalidArgumentException('Referência de arquivo inválida.');
        }
    }

}
