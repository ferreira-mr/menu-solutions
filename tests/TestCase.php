<?php

namespace Tests;

use Illuminate\Contracts\Console\Kernel;
use Illuminate\Foundation\Application;
use Illuminate\Foundation\Testing\TestCase as BaseTestCase;
use RuntimeException;

abstract class TestCase extends BaseTestCase
{
    private static ?string $phpunitRuntimePath = null;

    public function createApplication(): Application
    {
        $basePath = dirname(__DIR__);
        $configCachePath = $basePath.DIRECTORY_SEPARATOR.'bootstrap/cache/config.php';

        if (is_file($configCachePath)) {
            throw new RuntimeException('Os testes não podem iniciar com cache de configuração ativo.');
        }

        $runtimePath = $this->preparePhpunitRuntime($basePath);
        $this->copyDirectory(
            $basePath.DIRECTORY_SEPARATOR.'public'.DIRECTORY_SEPARATOR.'build',
            $runtimePath.DIRECTORY_SEPARATOR.'public'.DIRECTORY_SEPARATOR.'build',
        );
        $this->setProcessEnvironment([
            'APP_ENV' => 'testing',
            'APP_DEBUG' => 'true',
            'DB_CONNECTION' => 'sqlite',
            'DB_DATABASE' => ':memory:',
            'CACHE_STORE' => 'array',
            'SESSION_DRIVER' => 'array',
            'QUEUE_CONNECTION' => 'sync',
            'MAIL_MAILER' => 'array',
            'FILESYSTEM_DISK' => 'local',
            'TEST_RUN_TOKEN' => 'phpunit-'.getmypid(),
            'TEST_PUBLIC_PATH' => $runtimePath.DIRECTORY_SEPARATOR.'public',
            'LARAVEL_STORAGE_PATH' => $runtimePath.DIRECTORY_SEPARATOR.'storage',
            'VIEW_COMPILED_PATH' => $runtimePath.DIRECTORY_SEPARATOR.'views',
        ]);

        $app = require $basePath.DIRECTORY_SEPARATOR.'bootstrap/app.php';
        $app->make(Kernel::class)->bootstrap();

        $this->assertEffectiveTestingConfiguration($app, $runtimePath);

        return $app;
    }

    private function preparePhpunitRuntime(string $basePath): string
    {
        if (self::$phpunitRuntimePath === null) {
            self::$phpunitRuntimePath = $basePath.DIRECTORY_SEPARATOR.'test-results'.DIRECTORY_SEPARATOR
                .'phpunit-runtime'.DIRECTORY_SEPARATOR.getmypid().'-'.bin2hex(random_bytes(8));

            register_shutdown_function(function (): void {
                if (self::$phpunitRuntimePath !== null) {
                    $this->removeOwnedDirectory(self::$phpunitRuntimePath, dirname(__DIR__).DIRECTORY_SEPARATOR.'test-results'.DIRECTORY_SEPARATOR.'phpunit-runtime');
                }
            });
        }

        foreach ([
            self::$phpunitRuntimePath,
            self::$phpunitRuntimePath.DIRECTORY_SEPARATOR.'public',
            self::$phpunitRuntimePath.DIRECTORY_SEPARATOR.'storage',
            self::$phpunitRuntimePath.DIRECTORY_SEPARATOR.'storage'.DIRECTORY_SEPARATOR.'framework',
            self::$phpunitRuntimePath.DIRECTORY_SEPARATOR.'storage'.DIRECTORY_SEPARATOR.'framework'.DIRECTORY_SEPARATOR.'views',
            self::$phpunitRuntimePath.DIRECTORY_SEPARATOR.'storage'.DIRECTORY_SEPARATOR.'app',
            self::$phpunitRuntimePath.DIRECTORY_SEPARATOR.'storage'.DIRECTORY_SEPARATOR.'app'.DIRECTORY_SEPARATOR.'private',
            self::$phpunitRuntimePath.DIRECTORY_SEPARATOR.'storage'.DIRECTORY_SEPARATOR.'app'.DIRECTORY_SEPARATOR.'public',
            self::$phpunitRuntimePath.DIRECTORY_SEPARATOR.'views',
        ] as $directory) {
            if (! is_dir($directory) && ! mkdir($directory, 0777, true) && ! is_dir($directory)) {
                throw new RuntimeException('Não foi possível criar o diretório isolado de testes.');
            }
        }

        return self::$phpunitRuntimePath;
    }

    private function copyDirectory(string $source, string $destination): void
    {
        if (! is_dir($source)) {
            throw new RuntimeException('O build do frontend é necessário para os testes PHP.');
        }

        foreach (new \RecursiveIteratorIterator(
            new \RecursiveDirectoryIterator($source, \FilesystemIterator::SKIP_DOTS),
            \RecursiveIteratorIterator::SELF_FIRST,
        ) as $item) {
            $relativePath = substr($item->getPathname(), strlen($source) + 1);
            $targetPath = $destination.DIRECTORY_SEPARATOR.$relativePath;

            if ($item->isDir()) {
                if (! is_dir($targetPath) && ! mkdir($targetPath, 0777, true) && ! is_dir($targetPath)) {
                    throw new RuntimeException('Não foi possível copiar os assets para o runtime de testes.');
                }

                continue;
            }

            $targetDirectory = dirname($targetPath);
            if (! is_dir($targetDirectory) && ! mkdir($targetDirectory, 0777, true) && ! is_dir($targetDirectory)) {
                throw new RuntimeException('Não foi possível preparar os assets do runtime de testes.');
            }

            if (! copy($item->getPathname(), $targetPath)) {
                throw new RuntimeException('Não foi possível copiar os assets para o runtime de testes.');
            }
        }
    }

    private function setProcessEnvironment(array $variables): void
    {
        foreach ($variables as $name => $value) {
            putenv($name.'='.$value);
            $_ENV[$name] = $value;
            $_SERVER[$name] = $value;
        }
    }

    private function assertEffectiveTestingConfiguration(Application $app, string $runtimePath): void
    {
        if ($app->environment() !== 'testing') {
            throw new RuntimeException('A aplicação de teste não iniciou em APP_ENV=testing.');
        }

        $effectivePublicPath = realpath($app->publicPath());
        $expectedPublicPath = realpath($runtimePath.DIRECTORY_SEPARATOR.'public');

        if ($effectivePublicPath === false || $expectedPublicPath === false || $effectivePublicPath !== $expectedPublicPath) {
            throw new RuntimeException('A aplicação de teste capturou um public path fora do runtime isolado.');
        }

        if ($app['config']->get('database.default') !== 'sqlite'
            || $app['config']->get('database.connections.sqlite.database') !== ':memory:') {
            throw new RuntimeException('A conexão efetiva do PHPUnit não é SQLite em memória.');
        }

        if ($app->make('db')->connection()->getDriverName() !== 'sqlite') {
            throw new RuntimeException('O driver efetivo do PHPUnit não é SQLite.');
        }
    }

    private function removeOwnedDirectory(string $directory, string $ownerDirectory): void
    {
        $normalizedDirectory = strtolower(rtrim(str_replace(['/', '\\'], DIRECTORY_SEPARATOR, $directory), DIRECTORY_SEPARATOR));
        $normalizedOwner = strtolower(rtrim(str_replace(['/', '\\'], DIRECTORY_SEPARATOR, $ownerDirectory), DIRECTORY_SEPARATOR).DIRECTORY_SEPARATOR);

        if (!str_starts_with($normalizedDirectory, $normalizedOwner) || !is_dir($directory)) {
            return;
        }

        $items = new \RecursiveIteratorIterator(
            new \RecursiveDirectoryIterator($directory, \FilesystemIterator::SKIP_DOTS),
            \RecursiveIteratorIterator::CHILD_FIRST,
        );

        foreach ($items as $item) {
            $item->isDir() ? rmdir($item->getPathname()) : unlink($item->getPathname());
        }

        rmdir($directory);
    }
}
