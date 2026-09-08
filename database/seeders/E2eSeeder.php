<?php

namespace Database\Seeders;

use App\Models\Autorizado;
use App\Models\ControleDeProducaoEConsumo;
use App\Models\User;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;
use RuntimeException;

class E2eSeeder extends Seeder
{
    public function run(): void
    {
        $this->assertDisposableTestingRuntime();
        $this->call(CatalogSeeder::class);

        foreach ([
            [
                'nif' => '22222222222',
                'name' => 'Nutricionista E2E',
                'email' => 'e2e-nutri@example.test',
                'password' => 'password',
                'nivel_user' => 2,
            ],
            [
                'nif' => '33333333333',
                'name' => 'Diretora E2E',
                'email' => 'e2e-diretora@example.test',
                'password' => 'password',
                'nivel_user' => 3,
            ],
            [
                'nif' => '11111111111',
                'name' => 'Inspetora E2E',
                'email' => 'e2e-inspetora@example.test',
                'password' => 'password',
                'nivel_user' => 1,
            ],
        ] as $account) {
            $password = $account['password'];
            unset($account['password']);
            User::firstOrCreate(
                ['nif' => $account['nif']],
                [...$account, 'password' => Hash::make($password)],
            );
        }

        // These rows are disposable fixtures for browser scenarios only.
        Autorizado::firstOrCreate(
            ['titulo' => 'Autorização Lanche Especial'],
            [
                'conteudo' => 'Autorização para lanche especial dos alunos da feira de ciências.',
                'status' => 'pendente',
            ],
        );

        ControleDeProducaoEConsumo::withTrashed()->firstOrCreate(
            ['nome_alimento' => 'Arroz Integral'],
            [
                'data_alimento' => now()->toDateString(),
                'quantidade_alimento' => 45.5,
                'medida_alimento' => 'kg',
                'pessoas_alimento' => 280,
                'sobra_limpa_alimento' => 2.5,
                'desperdicio_alimento' => 1.0,
            ],
        );
    }

    private function assertDisposableTestingRuntime(): void
    {
        if (! app()->environment('testing')) {
            throw new RuntimeException('E2eSeeder só pode ser executado em APP_ENV=testing.');
        }

        $runToken = (string) env('E2E_RUN_TOKEN', '');
        $runtimePath = realpath((string) env('E2E_RUNTIME_DIR', ''));
        $databasePath = realpath((string) config('database.connections.sqlite.database', ''));
        $testResultsPath = realpath(base_path('test-results')) ?: base_path('test-results');

        if (! preg_match('/^[A-Za-z0-9._-]{8,128}$/', $runToken)
            || $runtimePath === false
            || $databasePath === false
            || config('database.default') !== 'sqlite'
            || ! $this->isPathWithin($runtimePath, $testResultsPath)
            || ! $this->isPathWithin($databasePath, $runtimePath)) {
            throw new RuntimeException('E2eSeeder exige um banco SQLite descartável identificado pelo runner E2E.');
        }
    }

    private function isPathWithin(string $path, string $parent): bool
    {
        $normalize = static fn (string $value): string => strtolower(rtrim(
            str_replace(['/', '\\'], DIRECTORY_SEPARATOR, $value),
            DIRECTORY_SEPARATOR,
        ));
        $normalizedPath = $normalize($path);
        $normalizedParent = $normalize(realpath($parent) ?: $parent);

        return $normalizedPath === $normalizedParent
            || str_starts_with($normalizedPath, $normalizedParent.DIRECTORY_SEPARATOR);
    }
}
