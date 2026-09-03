<?php

use Illuminate\Support\Facades\Route;

// O React Router controla as páginas da SPA. As rotas da API, Sanctum,
// storage e health check permanecem sob responsabilidade do Laravel.
Route::view('/{path?}', 'app')
    ->where('path', '^(?!api(?:/|$)|sanctum(?:/|$)|storage(?:/|$)|up$).*$');
