<?php

use App\Http\Controllers\Api\AlunoController;
use App\Http\Controllers\Api\AutorizadoController;
use App\Http\Controllers\Api\CardapioController;
use App\Http\Controllers\Api\CategoriaController;
use App\Http\Controllers\Api\ChatController;
use App\Http\Controllers\Api\ContagemNeController;
use App\Http\Controllers\Api\ContagemOperationController;
use App\Http\Controllers\Api\ContagenController;
use App\Http\Controllers\Api\ControleDeProducaoEConsumoController;
use App\Http\Controllers\Api\CronogramaController;
use App\Http\Controllers\Api\NecessidadeController;
use App\Http\Controllers\Api\TurmaController;
use App\Http\Controllers\Api\UserController;
use App\Http\Controllers\Api\SchoolCalendarController;
use App\Http\Controllers\AuthController;
use App\Http\Controllers\DashboardController;
use App\Http\Controllers\FileController;
use App\Http\Resources\UserResource;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;

Route::get('/user', function (Request $request) {
    return new UserResource($request->user());
})->middleware('auth:sanctum');

Route::post('/login', [AuthController::class, 'login'])->middleware('throttle:10,1');
Route::post('/register', [AuthController::class, 'register'])->middleware('throttle:5,1');

Route::middleware('auth:sanctum')->group(function () {
    Route::get('/contexto-escolar', [SchoolCalendarController::class, 'show']);
    Route::get('/contagens/dashboard', [DashboardController::class, 'contagemDashboard']);
    Route::apiResource('categorias', CategoriaController::class)->only(['show', 'index']);
    Route::apiResource('turmas', TurmaController::class)->only(['show', 'index']);
    Route::apiResource('contagens', ContagenController::class)->only(['index', 'show']);
    Route::apiResource('necessidades', NecessidadeController::class)->only(['index', 'show']);
    Route::post('/logout', [AuthController::class, 'logout']);
    Route::apiResource('contagem-nes', ContagemNeController::class)->only(['index', 'show']);
    Route::apiResource('cronogramas', CronogramaController::class)->only(['show', 'index']);
    Route::apiResource('users', UserController::class)->except(['store', 'destroy']);
    Route::apiResource('alunos', AlunoController::class)->only(['index', 'show']);
    Route::get('/alunos/{aluno}/foto', [FileController::class, 'studentPhoto'])->name('alunos.foto');
    Route::post('/reset-password', [UserController::class, 'resetPassword']);
    Route::apiResource('cardapios', CardapioController::class)->only(['index', 'show']);
    Route::apiResource('autorizados', AutorizadoController::class)->only(['index', 'show']);
    Route::apiResource('chats', ChatController::class);
    Route::get('/getMembers', [ChatController::class, 'getChatMembers']);
});

Route::middleware(['auth:sanctum', 'NutriRole'])->group(function () {
    Route::apiResource('categorias', CategoriaController::class)->except(['show', 'index']);
    Route::apiResource('turmas', TurmaController::class)->except(['show', 'index']);
    Route::apiResource('controle_de_producao', ControleDeProducaoEConsumoController::class);
    Route::apiResource('alunos', AlunoController::class)->except(['index', 'show']);
    Route::apiResource('necessidades', NecessidadeController::class)->except(['index', 'show']);
    Route::post('/alunos/{aluno}/necessidades', [AlunoController::class, 'relationNecessidades']);
    Route::apiResource('cronogramas', CronogramaController::class)->except(['show', 'index']);
    Route::post('/alunos-necessidades/{necessidade}/dias', [NecessidadeController::class, 'relationCronograma']);
    Route::delete('/alunos-necessidades/{necessidade}/dias', [NecessidadeController::class, 'deleteCronograma']);
    Route::delete('/necessidades/{necessidade}/alunos', [NecessidadeController::class, 'disableAluno']);
    Route::post('/upload', [FileController::class, 'uploadImage']);
    Route::post('/alunos/{aluno}/foto', [FileController::class, 'uploadStudentPhoto']);
    Route::post('/upload/pdf', [FileController::class, 'uploadPdf']);
    Route::apiResource('cardapios', CardapioController::class)->except(['index', 'show']);
    Route::apiResource('autorizados', AutorizadoController::class)->except(['index', 'show']);
});

Route::middleware(['auth:sanctum', 'UserManagementRole'])->group(function () {
    Route::apiResource('users', UserController::class)->only(['store', 'destroy']);
});

Route::middleware(['auth:sanctum', 'StaffOrNutriRole'])->group(function () {
    Route::apiResource('contagens', ContagenController::class)->only(['store', 'update']);
    Route::post('/contagens/operacao', [ContagemOperationController::class, 'store']);
    Route::apiResource('contagem-nes', ContagemNeController::class)->except(['index', 'show']);
});

Route::middleware(['auth:sanctum', 'DiretorRole'])->group(function () {
    // O diretor possui somente o fluxo específico de revisão das autorizações.
    Route::put('/autorizados/update/{autorizado}', [AutorizadoController::class, 'atualizar']);
});
