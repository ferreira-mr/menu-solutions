<?php

// Diagnóstico da auditoria. Não integra a suíte e não corrige a aplicação.
// Banco exclusivamente em memória; uploads ficam nesta pasta de evidências.
declare(strict_types=1);

$root = dirname(__DIR__, 3);
if (is_file($root.'/bootstrap/cache/config.php')) {
    throw new RuntimeException('Remova o cache de configuração apenas em uma cópia de testes antes deste diagnóstico.');
}
foreach (['APP_ENV' => 'testing', 'APP_DEBUG' => 'false', 'DB_CONNECTION' => 'sqlite', 'DB_DATABASE' => ':memory:', 'CACHE_STORE' => 'array', 'SESSION_DRIVER' => 'array', 'QUEUE_CONNECTION' => 'sync', 'LOG_CHANNEL' => 'null', 'BCRYPT_ROUNDS' => '4'] as $key => $value) {
    putenv($key.'='.$value);
    $_ENV[$key] = $_SERVER[$key] = $value;
}
require $root.'/vendor/autoload.php';
$app = require $root.'/bootstrap/app.php';
$app->make(Illuminate\Contracts\Console\Kernel::class)->bootstrap();
if (config('database.default') !== 'sqlite' || config('database.connections.sqlite.database') !== ':memory:') {
    throw new RuntimeException('Conexão de diagnóstico não está isolada.');
}
$app->usePublicPath(__DIR__.'/arquivos-diagnostico');
Illuminate\Support\Facades\Artisan::call('migrate', ['--force' => true]);

use App\Models\{Aluno, AlunosHasNecessidade, Autorizado, Cardapio, Categoria, Chat, Contagen, ContagemNe, Cronograma, Necessidade, Turma, User};
use Illuminate\Support\Facades\{Artisan, Auth, DB, Hash};

function requestApi(string $method, string $uri, array $payload = [], ?User $user = null, ?string $rawToken = null): array
{
    Auth::forgetGuards(); // Evita reaproveitar a identidade da requisição anterior.
    $server = ['HTTP_ACCEPT' => 'application/json', 'CONTENT_TYPE' => 'application/json'];
    if ($user) {
        $server['HTTP_AUTHORIZATION'] = 'Bearer '.$user->createToken('audit')->plainTextToken;
    }
    if ($rawToken) { $server['HTTP_AUTHORIZATION'] = 'Bearer '.$rawToken; }
    $request = Illuminate\Http\Request::create($uri, $method, [], [], [], $server, json_encode($payload));
    $kernel = app(Illuminate\Contracts\Http\Kernel::class);
    $response = $kernel->handle($request);
    $result = ['status' => $response->getStatusCode(), 'body' => json_decode($response->getContent(), true)];
    $kernel->terminate($request, $response);
    return $result;
}
function statusOnly(array $result): int { return $result['status']; }

$results = [];
$admin = User::factory()->nutricionista()->create();
$staff = User::factory()->create();
$director = User::factory()->diretor()->create();
$category = Categoria::factory()->create();
$class = Turma::factory()->create(['categorias_id' => $category->id]);
$a = Aluno::factory()->create(['turmas_id' => $class->id, 'rm' => 'AUDIT-A']);
$b = Aluno::factory()->create(['turmas_id' => $class->id, 'rm' => 'AUDIT-B']);
$need = Necessidade::factory()->create();
$link = AlunosHasNecessidade::create(['alunos_id' => $a->id, 'necessidades_id' => $need->id]);
$day = Cronograma::create(['dia' => 'Segunda']);
$link->necessidadesHasCronogramas()->attach($day->id);

$results['duplicidades'] = [
    'alterar_rm_para_existente' => requestApi('PUT', '/api/alunos/'.$b->id, ['rm' => $a->rm], $admin),
    'criar_turma_duplicada' => requestApi('POST', '/api/turmas', ['nome_turma' => $class->nome_turma, 'categorias_id' => $category->id], $admin),
    'criar_dia_duplicado' => requestApi('POST', '/api/cronogramas', ['dia' => 'Segunda'], $admin),
];
$results['limites'] = [
    'nome_turma_46_caracteres' => statusOnly(requestApi('PUT', '/api/turmas/'.$class->id, ['nome_turma' => str_repeat('x', 46)], $admin)),
    'qtd_maior_que_int32' => statusOnly(requestApi('POST', '/api/contagens', ['turmas_id' => $class->id, 'qtd_contagem' => 2147483648], $admin)),
    'decimal_maior_que_8_2' => statusOnly(requestApi('POST', '/api/controle_de_producao', ['nome_alimento' => 'Audit', 'data_alimento' => '2026-09-07', 'quantidade_alimento' => 1000000, 'medida_alimento' => 'kg', 'pessoas_alimento' => 1, 'sobra_limpa_alimento' => 0, 'desperdicio_alimento' => 0], $admin)),
];
$deadCategory = Categoria::factory()->create();
$deadCategory->delete();
$deadClass = Turma::factory()->create();
$deadClass->delete();
$deadNeed = Necessidade::factory()->create();
$deadNeed->delete();
$deadDay = Cronograma::create(['dia' => 'Quarta - excluido auditoria']);
$deadDay->delete();
$results['vinculos_excluidos'] = [
    'turma_em_categoria_excluida' => statusOnly(requestApi('POST', '/api/turmas', ['nome_turma' => 'Fantasma', 'categorias_id' => $deadCategory->id], $admin)),
    'contagem_em_turma_excluida' => statusOnly(requestApi('POST', '/api/contagens', ['turmas_id' => $deadClass->id, 'qtd_contagem' => 5], $admin)),
    'vincular_necessidade_excluida' => statusOnly(requestApi('POST', '/api/alunos/'.$a->id.'/necessidades', ['necessidades' => [$deadNeed->id]], $admin)),
    'vincular_dia_excluido' => statusOnly(requestApi('POST', '/api/alunos-necessidades/'.$link->id.'/dias', ['dias' => [$deadDay->id]], $admin)),
];

$results['contrato_necessidade'] = requestApi('GET', '/api/necessidades/'.$need->id, [], $admin);
$results['contrato_cronograma'] = requestApi('GET', '/api/cronogramas/'.$day->id, [], $admin);
$results['rotas_relacoes_integrado'] = ['agendar' => statusOnly(requestApi('POST', '/api/alunos-necessidades/'.$link->id.'/dias', ['dias' => [$day->id]], $admin))];
$authorization = Autorizado::factory()->create();
$results['permissoes'] = [
    'diretor_listar_usuarios' => statusOnly(requestApi('GET', '/api/users', [], $director)),
    'diretor_aprovar' => statusOnly(requestApi('PUT', '/api/autorizados/update/'.$authorization->id, ['status' => 'confirmado'], $director)),
    'nutri_aprovar_sem_direcao' => statusOnly(requestApi('PUT', '/api/autorizados/'.$authorization->id, ['status' => 'confirmado'], $admin)),
    'diretor_recusar' => statusOnly(requestApi('PUT', '/api/autorizados/update/'.$authorization->id, ['status' => 'recusado'], $director)),
    'diretor_trocar_senha' => statusOnly(requestApi('POST', '/api/reset-password', ['senha_atual' => 'password', 'new_password' => 'changed123', 'new_password_confirmation' => 'changed123'], $director)),
    'inspetora_criar_ne' => statusOnly(requestApi('POST', '/api/contagem-nes', ['alunos_has_necessidades_id' => $link->id], $staff)),
];

$registration = requestApi('POST', '/api/register', ['name' => 'Cadastro sem convite', 'email' => 'audit-public@example.test', 'nif' => 'AUDIT-PUBLIC', 'password' => 'password123', 'password_confirmation' => 'password123', 'nivel_user' => 2]);
$newUser = User::where('nif', 'AUDIT-PUBLIC')->firstOrFail();
$results['cadastro_publico'] = ['cadastro' => $registration['status'], 'nivel_atribuido' => $newUser->nivel_user, 'leitura_alunos' => statusOnly(requestApi('GET', '/api/alunos', [], $newUser)), 'escrita_contagem' => statusOnly(requestApi('POST', '/api/contagens', ['turmas_id' => $class->id, 'qtd_contagem' => 1], $newUser))];

Chat::factory()->create(['users_id' => $admin->id]);
$chatResponse = requestApi('GET', '/api/chats', [], $staff);
$results['campos_chat'] = ['consultar_perfil_alheio' => statusOnly(requestApi('GET', '/api/users/'.$admin->id, [], $staff)), 'campos_autor_chat' => array_keys($chatResponse['body']['data'][0]['user'])];

Contagen::query()->delete();
Contagen::factory()->create(['turmas_id' => $class->id, 'users_id' => $admin->id, 'data_contagem' => '2026-09-06']);
Contagen::factory()->create(['turmas_id' => $class->id, 'users_id' => $admin->id, 'data_contagem' => '2026-09-07']);
ContagemNe::factory()->create(['alunos_has_necessidades_id' => $link->id, 'created_at' => '2026-09-06 10:00:00']);
ContagemNe::factory()->create(['alunos_has_necessidades_id' => $link->id, 'created_at' => '2026-09-07 10:00:00']);
$results['filtros'] = [
    'contagens_data' => requestApi('GET', '/api/contagens?data=2026-09-07', [], $admin)['body']['meta']['total'],
    'contagens_date' => requestApi('GET', '/api/contagens?date=2026-09-07', [], $admin)['body']['meta']['total'],
    'contagens_range' => requestApi('GET', '/api/contagens?data_inicio=2026-09-07&data_fim=2026-09-07', [], $admin)['body']['meta']['total'],
    'nes_data' => requestApi('GET', '/api/contagem-nes?data=2026-09-07', [], $admin)['body']['meta']['total'],
    'nes_data_invalida_status' => statusOnly(requestApi('GET', '/api/contagem-nes?data=invalida', [], $admin)),
];
Aluno::factory()->count(21)->create(['turmas_id' => $class->id]);
$page = requestApi('GET', '/api/alunos?limit=1000', [], $admin)['body'];
$results['paginacao'] = ['total' => $page['meta']['total'], 'por_pagina' => $page['meta']['per_page'], 'recebidos' => count($page['data'])];

Illuminate\Support\Carbon::setTestNow('2026-09-07 12:00:00');
$tieClass = Turma::factory()->create();
$c1 = requestApi('POST', '/api/contagens', ['turmas_id' => $tieClass->id, 'qtd_contagem' => 10], $admin);
$c2 = requestApi('POST', '/api/contagens', ['turmas_id' => $tieClass->id, 'qtd_contagem' => 20], $admin);
$dashboard = requestApi('GET', '/api/contagens/dashboard?data=2026-09-07', [], $admin);
foreach ($dashboard['body']['data'] as $group) {
    foreach ($group['turmas'] as $row) {
        if ($row['id'] === $tieClass->id) {
            $results['empate_dashboard'] = ['primeiro' => $c1['body']['data']['qtd_contagem'], 'segundo' => $c2['body']['data']['qtd_contagem'], 'exibido' => $row['qtd_contagem']];
        }
    }
}
Illuminate\Support\Carbon::setTestNow('2026-09-08 01:00:00');
$late = requestApi('POST', '/api/contagens', ['turmas_id' => $tieClass->id, 'qtd_contagem' => 30], $admin);
$results['fuso'] = ['timezone_config' => config('app.timezone'), 'instante_utc' => now()->toIso8601String(), 'data_sao_paulo' => now()->timezone('America/Sao_Paulo')->toDateString(), 'data_gravada' => $late['body']['data']['data_contagem'], 'editar_contagem_mesmo_dia_local' => statusOnly(requestApi('PUT', '/api/contagens/'.$c1['body']['data']['id'], ['qtd_contagem' => 11], $admin))];
Illuminate\Support\Carbon::setTestNow();

$removeA = Aluno::factory()->create();
$removeB = Aluno::factory()->create();
$removeNeed = Necessidade::factory()->create();
$removeA->necessidades()->attach($removeNeed->id);
$removeB->necessidades()->attach($removeNeed->id);
$decimal = requestApi('DELETE', '/api/necessidades/'.$removeNeed->id.'/alunos', ['alunos' => $removeA->id.'.9'], $admin);
$results['remocao_decimal'] = ['status' => $decimal['status'], 'relacao_removida' => !AlunosHasNecessidade::where('alunos_id', $removeA->id)->where('necessidades_id', $removeNeed->id)->exists()];
$removeA->necessidades()->attach($removeNeed->id);
$multiple = requestApi('DELETE', '/api/necessidades/'.$removeNeed->id.'/alunos', ['alunos' => [$removeA->id, $removeB->id]], $admin);
$results['remocao_array'] = ['status' => $multiple['status'], 'relacoes_restantes' => AlunosHasNecessidade::where('necessidades_id', $removeNeed->id)->count()];

// Simula falha do banco depois que o arquivo já foi gravado, só nesta pasta.
$file = Illuminate\Http\UploadedFile::fake()->create('audit.pdf', 1, 'application/pdf');
Cardapio::creating(static function () { throw new RuntimeException('Falha simulada do banco'); });
Auth::forgetGuards();
$uploadRequest = Illuminate\Http\Request::create('/api/cardapios', 'POST', [], [], ['file' => $file], ['HTTP_ACCEPT' => 'application/json', 'HTTP_AUTHORIZATION' => 'Bearer '.$admin->createToken('audit')->plainTextToken]);
$kernel = app(Illuminate\Contracts\Http\Kernel::class);
$uploadResponse = $kernel->handle($uploadRequest);
$kernel->terminate($uploadRequest, $uploadResponse);
$leftovers = glob(__DIR__.'/arquivos-diagnostico/uploads/pdf/*') ?: [];
$results['upload_falha_banco'] = ['status' => $uploadResponse->getStatusCode(), 'linhas_cardapio' => Cardapio::count(), 'arquivos_orfaos' => count($leftovers)];
foreach ($leftovers as $path) { unlink($path); }
// No Windows, o arquivo enviado pode permanecer com exclusão pendente até o
// término do processo. As pastas vazias podem ser removidas depois, sem recursão.

config(['app.env' => 'production']); // Apenas a variável do app; conexão continua :memory:.
Artisan::call('db:seed', ['--force' => true]);
$seedAdmin = User::where('nif', '22222222222')->firstOrFail();
$seedAdmin->update(['password' => Hash::make('senha-alterada-auditoria')]);
Artisan::call('db:seed', ['--force' => true]);
$results['seeder_producao_simulada'] = ['nivel_criado' => $seedAdmin->nivel_user, 'senha_publica_reposta' => Hash::check('password', $seedAdmin->fresh()->password)];
config(['app.env' => 'testing']);

$app['env'] = 'local';
config(['app.env' => 'local']);
$results['atalho_senha_local'] = ['senha_fixa_nao_confere_hash' => !Hash::check('password123', $admin->password), 'login_com_senha_fixa' => statusOnly(requestApi('POST', '/api/login', ['nif' => $admin->nif, 'password' => 'password123']))];
$app['env'] = 'testing';
config(['app.env' => 'testing']);
$oldToken = $staff->createToken('antes-reset-admin')->plainTextToken;
$reset = requestApi('PUT', '/api/users/'.$staff->id, ['password' => 'senha-nova-auditoria', 'password_confirmation' => 'senha-nova-auditoria'], $admin);
$results['reset_admin_token_antigo'] = ['reset_status' => $reset['status'], 'token_antigo_apos_reset' => statusOnly(requestApi('GET', '/api/user', [], null, $oldToken))];
$results['contagem_duplicada_ne'] = [statusOnly(requestApi('POST', '/api/contagem-nes', ['alunos_has_necessidades_id' => $link->id], $staff)), statusOnly(requestApi('POST', '/api/contagem-nes', ['alunos_has_necessidades_id' => $link->id], $staff))];

echo json_encode($results, JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES).PHP_EOL;
