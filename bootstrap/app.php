<?php

use App\Http\Middleware\DiretorRole;
use App\Http\Middleware\ForceJson;
use App\Http\Middleware\NutriRole;
use App\Http\Middleware\StaffOrNutriRole;
use App\Http\Middleware\UserManagementRole;
use Illuminate\Foundation\Application;
use Illuminate\Foundation\Configuration\Exceptions;
use Illuminate\Foundation\Configuration\Middleware;

$basePath = dirname(__DIR__);
$processEnv = static function (string $name): ?string {
    $value = $_SERVER[$name] ?? $_ENV[$name] ?? getenv($name);

    return $value === false ? null : ($value === null ? null : (string) $value);
};

$application = Application::configure(basePath: $basePath);
$testPublicPath = $processEnv('TEST_PUBLIC_PATH');

if ($testPublicPath !== null) {
    $testRunToken = $processEnv('TEST_RUN_TOKEN');
    $appEnvironment = $processEnv('APP_ENV');
    $testResultsPath = realpath($basePath.DIRECTORY_SEPARATOR.'test-results')
        ?: $basePath.DIRECTORY_SEPARATOR.'test-results';
    $resolvedTestPublicPath = realpath($testPublicPath) ?: $testPublicPath;
    $normalizer = static fn (string $path): string => rtrim(
        str_replace(['/', '\\'], DIRECTORY_SEPARATOR, $path),
        DIRECTORY_SEPARATOR,
    );
    $testResultsPrefix = strtolower($normalizer($testResultsPath).DIRECTORY_SEPARATOR);
    $normalizedTestPublicPath = strtolower($normalizer($resolvedTestPublicPath));

    if ($appEnvironment !== 'testing' || $testRunToken === null || !preg_match('/^[A-Za-z0-9._-]{8,128}$/', $testRunToken)) {
        throw new RuntimeException('TEST_PUBLIC_PATH só pode ser usado com um TEST_RUN_TOKEN válido em APP_ENV=testing.');
    }

    if (is_file($basePath.DIRECTORY_SEPARATOR.'bootstrap/cache/config.php')) {
        throw new RuntimeException('Cache de configuração incompatível com o ambiente de testes.');
    }

    if (!str_starts_with($normalizedTestPublicPath, $testResultsPrefix)) {
        throw new RuntimeException('TEST_PUBLIC_PATH precisa estar dentro de test-results.');
    }

}

$application = $application
    ->withRouting(
        web: __DIR__.'/../routes/web.php',
        api: __DIR__.'/../routes/api.php',
        commands: __DIR__.'/../routes/console.php',
        health: '/up',
    )
    ->withCommands()
    ->withMiddleware(function (Middleware $middleware): void {
        $middleware->prependToGroup('api', ForceJson::class);
        $middleware->alias([
            'NutriRole' => NutriRole::class,
            'DiretorRole' => DiretorRole::class,
            'StaffOrNutriRole' => StaffOrNutriRole::class,
            'UserManagementRole' => UserManagementRole::class,
        ]);
    })
    ->withExceptions(function (Exceptions $exceptions): void {
        //
    });

$app = $application->create();

if ($testPublicPath !== null) {
    $app->usePublicPath($testPublicPath);
}

return $app;
