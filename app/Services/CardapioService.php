<?php

namespace App\Services;

use App\Models\Cardapio;
use App\Models\FileCleanupFailure;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use Throwable;

class CardapioService
{
    public function __construct(private readonly FileService $fileService)
    {
    }

    public function create(Request $request): array
    {
        $name = $this->fileService->FileUpload($request);
        $path = $this->fileService->cardapioPath($name);

        try {
            $cardapio = DB::transaction(fn (): Cardapio => Cardapio::create(['path' => $name]));
        } catch (Throwable $exception) {
            $this->cleanupOrTrack(null, $path, 'compensate-create', $exception);

            throw $exception;
        }

        return [$cardapio, $name];
    }

    public function update(Request $request, Cardapio $cardapio): Cardapio
    {
        $name = $this->fileService->FileUpload($request);
        $newPath = $this->fileService->cardapioPath($name);
        $oldPath = null;

        try {
            $oldPath = $this->fileService->cardapioPath($cardapio->path);
            DB::transaction(function () use ($cardapio, $name): void {
                $cardapio->fill(['path' => $name]);
                $cardapio->saveOrFail();
            });
        } catch (Throwable $exception) {
            $this->cleanupOrTrack($cardapio->id, $newPath, 'compensate-update', $exception);

            throw $exception;
        }

        if ($oldPath !== null && $oldPath !== $newPath) {
            $this->cleanupOrTrack($cardapio->id, $oldPath, 'replace-old');
        }

        return $cardapio->fresh();
    }

    public function delete(Cardapio $cardapio): void
    {
        $path = $this->fileService->cardapioPath($cardapio->path);

        DB::transaction(function () use ($cardapio): void {
            $cardapio->deleteOrFail();
        });

        $this->cleanupOrTrack($cardapio->id, $path, 'delete');
    }

    public function retryCleanupFailure(FileCleanupFailure $failure): bool
    {
        if ($failure->resolved_at !== null) {
            return true;
        }

        try {
            $deleted = $this->fileService->delete($failure->path, $failure->disk);

            if (! $deleted) {
                throw new \RuntimeException('O disco não confirmou a remoção do arquivo.');
            }

            $failure->forceFill([
                'attempts' => $failure->attempts + 1,
                'last_error' => null,
                'next_attempt_at' => null,
                'resolved_at' => now(),
            ])->saveOrFail();

            return true;
        } catch (Throwable $exception) {
            $this->updateFailedAttempt($failure, $exception);

            return false;
        }
    }

    private function cleanupOrTrack(?int $cardapioId, string $path, string $operation, ?Throwable $cause = null): void
    {
        try {
            if (! $this->fileService->delete($path)) {
                throw new \RuntimeException('O disco não confirmou a remoção do arquivo.');
            }
        } catch (Throwable $exception) {
            $this->recordFailure($cardapioId, $path, $operation, $exception, $cause);
        }
    }

    private function recordFailure(?int $cardapioId, string $path, string $operation, Throwable $exception, ?Throwable $cause = null): void
    {
        try {
            $failure = FileCleanupFailure::query()
                ->whereNull('resolved_at')
                ->where('disk', $this->fileService->diskName())
                ->where('path', $path)
                ->where('operation', $operation)
                ->first();

            if ($failure === null) {
                $failure = new FileCleanupFailure([
                    'cardapio_id' => $cardapioId,
                    'disk' => $this->fileService->diskName(),
                    'path' => $path,
                    'operation' => $operation,
                    'attempts' => 1,
                ]);
            } else {
                $failure->attempts++;
            }

            $failure->last_error = $exception->getMessage();
            $failure->next_attempt_at = now()->addMinutes(5);
            $failure->saveOrFail();

            Log::error('Falha de limpeza de arquivo registrada para retentativa.', [
                'cleanup_failure_id' => $failure->id,
                'cardapio_id' => $cardapioId,
                'disk' => $this->fileService->diskName(),
                'path' => $path,
                'operation' => $operation,
                'cause' => $cause?->getMessage(),
            ]);
        } catch (Throwable $recordingException) {
            Log::critical('Não foi possível registrar falha de limpeza de arquivo.', [
                'cardapio_id' => $cardapioId,
                'disk' => $this->fileService->diskName(),
                'path' => $path,
                'operation' => $operation,
                'error' => $recordingException->getMessage(),
            ]);
        }
    }

    private function updateFailedAttempt(FileCleanupFailure $failure, Throwable $exception): void
    {
        try {
            $failure->forceFill([
                'attempts' => $failure->attempts + 1,
                'last_error' => $exception->getMessage(),
                'next_attempt_at' => now()->addMinutes(5),
            ])->saveOrFail();

            Log::error('Retentativa de limpeza de arquivo falhou.', [
                'cleanup_failure_id' => $failure->id,
                'disk' => $failure->disk,
                'path' => $failure->path,
                'operation' => $failure->operation,
            ]);
        } catch (Throwable $recordingException) {
            Log::critical('Não foi possível atualizar falha de limpeza de arquivo.', [
                'cleanup_failure_id' => $failure->id,
                'error' => $recordingException->getMessage(),
            ]);
        }
    }
}
