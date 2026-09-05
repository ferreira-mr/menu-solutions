<?php

use App\Http\Middleware\DiretorRole;
use App\Http\Middleware\ForceJson;
use App\Http\Middleware\NutriRole;
use App\Http\Middleware\StaffOrNutriRole;
use Illuminate\Foundation\Application;
use Illuminate\Foundation\Configuration\Exceptions;
use Illuminate\Foundation\Configuration\Middleware;

return Application::configure(basePath: dirname(__DIR__))
    ->withRouting(
        web: __DIR__.'/../routes/web.php',
        api: __DIR__.'/../routes/api.php',
        commands: __DIR__.'/../routes/console.php',
        health: '/up',
    )
    ->withMiddleware(function (Middleware $middleware): void {
        $middleware->prependToGroup('api', ForceJson::class);
        $middleware->alias([
            'NutriRole' => NutriRole::class,
            'DiretorRole' => DiretorRole::class,
            'StaffOrNutriRole' => StaffOrNutriRole::class,
        ]);
    })
    ->withExceptions(function (Exceptions $exceptions): void {
        //
    })->create();
