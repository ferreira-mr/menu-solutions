<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use Illuminate\Support\Facades\DB;

class AssertTestingIsolation extends Command
{
    protected $signature = 'testing:assert-isolated';

    protected $description = 'Verifica o banco e o armazenamento efetivos do runtime de testes';

    public function handle(): int
    {
        if (app()->environment() !== 'testing') {
            $this->error('O runtime isolado só pode ser usado em APP_ENV=testing.');

            return self::FAILURE;
        }

        $runToken = (string) env('TEST_RUN_TOKEN', '');
        $runtimePath = (string) env('E2E_RUNTIME_DIR', '');
        $publicPath = realpath(public_path());
        $expectedPublicPath = realpath((string) env('TEST_PUBLIC_PATH', ''));

        if (!preg_match('/^[A-Za-z0-9._-]{8,128}$/', $runToken)
            || $runtimePath === ''
            || $publicPath === false
            || $expectedPublicPath === false
            || $publicPath !== $expectedPublicPath
            || !$this->isPathWithin($publicPath, $runtimePath)) {
            $this->error('O public path não pertence ao runtime E2E identificado.');

            return self::FAILURE;
        }

        if (config('database.default') !== 'sqlite'
            || config('database.connections.sqlite.database') !== env('DB_DATABASE')) {
            $this->error('A conexão efetiva não corresponde ao banco fornecido pelo runner.');

            return self::FAILURE;
        }

        if (!is_file((string) env('DB_DATABASE')) || DB::connection()->getDriverName() !== 'sqlite') {
            $this->error('O banco SQLite isolado não está disponível.');

            return self::FAILURE;
        }

        $storagePath = realpath(storage_path());
        $expectedStoragePath = realpath((string) env('LARAVEL_STORAGE_PATH', ''));

        if ($storagePath === false || $expectedStoragePath === false || $storagePath !== $expectedStoragePath || !$this->isPathWithin($storagePath, $runtimePath)) {
            $this->error('O storage não pertence ao runtime E2E identificado.');

            return self::FAILURE;
        }

        $this->info('Runtime de testes isolado confirmado.');

        return self::SUCCESS;
    }

    private function isPathWithin(string $path, string $parent): bool
    {
        $normalize = static fn (string $value): string => strtolower(rtrim(
            str_replace(['/', '\\'], DIRECTORY_SEPARATOR, $value),
            DIRECTORY_SEPARATOR,
        ));
        $normalizedPath = $normalize(realpath($path) ?: $path);
        $normalizedParent = $normalize(realpath($parent) ?: $parent);

        return $normalizedPath === $normalizedParent
            || str_starts_with($normalizedPath, $normalizedParent.DIRECTORY_SEPARATOR);
    }
}
