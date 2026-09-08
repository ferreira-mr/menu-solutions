<?php

namespace App\Services;

use App\Models\Aluno;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;
use InvalidArgumentException;
use RuntimeException;

class StudentPhotoMigrationService
{
    public function __construct(private readonly FileService $fileService)
    {
    }

    /**
     * @return array{inventory:int,would_migrate:int,migrated:int,already_private:int,removed_public:int,errors:array<int,string>}
     */
    public function migrate(bool $dryRun = false, bool $removePublic = false): array
    {
        $result = [
            'inventory' => 0,
            'would_migrate' => 0,
            'migrated' => 0,
            'already_private' => 0,
            'removed_public' => 0,
            'errors' => [],
        ];
        $sourceDisk = Storage::disk((string) config('filesystems.cardapio_disk', 'uploads'));
        $privateDisk = Storage::disk($this->fileService->studentPhotoDiskName());

        Aluno::withTrashed()
            ->whereNotNull('foto')
            ->where('foto', '<>', '')
            ->orderBy('id')
            ->get()
            ->each(function (Aluno $aluno) use (&$result, $dryRun, $removePublic, $sourceDisk, $privateDisk): void {
                $result['inventory']++;

                try {
                    $filename = $this->fileService->studentPhotoFilename((string) $aluno->foto);
                    $sourcePath = $this->fileService->publicStudentPhotoPath($filename);
                    $privatePath = $this->fileService->studentPhotoPath($filename);
                } catch (InvalidArgumentException $exception) {
                    $result['errors'][] = "Aluno #{$aluno->id}: referência inválida ({$exception->getMessage()}).";

                    return;
                }

                $sourceExists = $sourceDisk->exists($sourcePath);
                $privateExists = $privateDisk->exists($privatePath);

                try {
                    if ($privateExists) {
                        if ($sourceExists && $this->hash($sourceDisk, $sourcePath) !== $this->hash($privateDisk, $privatePath)) {
                            throw new RuntimeException('a cópia privada existe, mas o hash diverge da origem pública');
                        }

                        $result['already_private']++;
                        if ($removePublic && $sourceExists && ! $dryRun) {
                            if (! $sourceDisk->delete($sourcePath)) {
                                throw new RuntimeException('o disco não confirmou a remoção da origem pública');
                            }
                            $result['removed_public']++;
                        }

                        return;
                    }

                    if (! $sourceExists) {
                        throw new RuntimeException('referência sem arquivo público correspondente');
                    }

                    if ($dryRun) {
                        $result['would_migrate']++;

                        return;
                    }

                    $this->copyVerified($sourceDisk, $sourcePath, $privateDisk, $privatePath);
                    $result['migrated']++;

                    if ($removePublic) {
                        if (! $sourceDisk->delete($sourcePath)) {
                            throw new RuntimeException('cópia verificada, mas o disco não confirmou a remoção da origem pública');
                        }
                        $result['removed_public']++;
                    }
                } catch (\Throwable $exception) {
                    $result['errors'][] = "Aluno #{$aluno->id} / {$filename}: {$exception->getMessage()}.";
                }
            });

        return $result;
    }

    private function copyVerified($sourceDisk, string $sourcePath, $privateDisk, string $privatePath): void
    {
        $sourceStream = $sourceDisk->readStream($sourcePath);
        if ($sourceStream === false) {
            throw new RuntimeException('não foi possível abrir a origem para leitura');
        }

        $temporaryPath = '.migration-'.Str::uuid()->toString();
        try {
            $written = $privateDisk->writeStream($temporaryPath, $sourceStream);
        } finally {
            fclose($sourceStream);
        }

        if ($written === false) {
            $privateDisk->delete($temporaryPath);
            throw new RuntimeException('o disco privado não confirmou a cópia');
        }

        try {
            if ($this->hash($sourceDisk, $sourcePath) !== $this->hash($privateDisk, $temporaryPath)) {
                throw new RuntimeException('a verificação de hash da cópia falhou');
            }
            if (! $privateDisk->move($temporaryPath, $privatePath)) {
                throw new RuntimeException('o disco privado não confirmou a publicação da cópia');
            }
        } catch (\Throwable $exception) {
            $privateDisk->delete($temporaryPath);
            throw $exception;
        }
    }

    private function hash($disk, string $path): string
    {
        $stream = $disk->readStream($path);
        if ($stream === false) {
            throw new RuntimeException('não foi possível ler o arquivo para calcular o hash');
        }

        $context = hash_init('sha256');
        try {
            hash_update_stream($context, $stream);
        } finally {
            fclose($stream);
        }

        return hash_final($context);
    }
}
