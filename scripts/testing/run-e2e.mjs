import crypto from 'node:crypto';
import fs from 'node:fs';
import http from 'node:http';
import net from 'node:net';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { spawn, spawnSync } from 'node:child_process';

const scriptPath = fileURLToPath(import.meta.url);
const projectRoot = path.resolve(path.dirname(scriptPath), '../..');
const testResultsRoot = path.join(projectRoot, 'test-results');
const configCachePath = path.join(projectRoot, 'bootstrap', 'cache', 'config.php');

const unsafeInheritedVariables = [
  'APP_ENV',
  'DB_CONNECTION',
  'DB_DATABASE',
  'DB_URL',
  'E2E_BASE_URL',
  'E2E_AUTH_DIR',
  'E2E_RUNTIME_DIR',
  'E2E_RUN_TOKEN',
  'E2E_PORT',
  'TEST_PUBLIC_PATH',
  'LARAVEL_STORAGE_PATH',
  'VIEW_COMPILED_PATH',
];

function fail(message) {
  throw new Error(`[e2e-isolado] ${message}`);
}

function assertProjectRoot() {
  const current = fs.realpathSync(process.cwd());
  const expected = fs.realpathSync(projectRoot);

  if (current !== expected) {
    fail(`execute o runner a partir de ${expected}`);
  }
}

function assertSafeEntryPoint() {
  for (const name of unsafeInheritedVariables) {
    if (process.env[name] !== undefined) {
      fail(`a variável ${name} não pode controlar o ambiente E2E; o runner gera uma configuração própria`);
    }
  }

  if (fs.existsSync(configCachePath)) {
    fail('cache de configuração detectado; remova-o ou use um processo de testes sem cache antes de preparar o E2E');
  }
}

function parseArguments(argv) {
  const options = { checkOnly: false, prepareOnly: false, port: null };

  for (const argument of argv) {
    if (argument === '--check-only') {
      options.checkOnly = true;
      continue;
    }

    if (argument === '--prepare-only') {
      options.prepareOnly = true;
      continue;
    }

    const portMatch = argument.match(/^--port=(\d+)$/);
    if (portMatch) {
      options.port = Number(portMatch[1]);
      continue;
    }

    fail(`argumento não suportado: ${argument}`);
  }

  if (options.port !== null && (options.port < 1024 || options.port > 65535)) {
    fail('a porta deve estar entre 1024 e 65535');
  }

  if (options.checkOnly && options.prepareOnly) {
    fail('--check-only e --prepare-only não podem ser combinados');
  }

  return options;
}

function canListen(port) {
  return new Promise((resolve, reject) => {
    const server = net.createServer();
    server.once('error', (error) => {
      server.close();
      reject(error);
    });
    server.listen({ host: '127.0.0.1', port }, () => {
      const selectedPort = server.address().port;
      server.close(() => resolve(selectedPort));
    });
  });
}

async function choosePort(requestedPort) {
  try {
    return await canListen(requestedPort ?? 0);
  } catch {
    fail(`a porta ${requestedPort} já está ocupada ou indisponível`);
  }
}

function createRuntime() {
  fs.mkdirSync(testResultsRoot, { recursive: true });
  const runtimePath = fs.mkdtempSync(path.join(testResultsRoot, 'e2e-runtime-'));
  const publicPath = path.join(runtimePath, 'public');
  const storagePath = path.join(runtimePath, 'storage');
  const viewsPath = path.join(runtimePath, 'views');
  const authPath = path.join(runtimePath, 'auth');

  for (const directory of [publicPath, storagePath, viewsPath, authPath, path.join(publicPath, 'uploads', 'pdf')]) {
    fs.mkdirSync(directory, { recursive: true });
  }

  const dbPath = path.join(runtimePath, 'database.sqlite');
  fs.writeFileSync(dbPath, '');
  const serverPath = path.join(runtimePath, 'server.php');
  fs.writeFileSync(serverPath, runtimeRouter(publicPath));

  return { runtimePath, publicPath, storagePath, viewsPath, authPath, dbPath, serverPath };
}

function runtimeRouter(publicPath) {
  return `<?php

$publicPath = ${phpStringLiteral(publicPath)};
$uri = urldecode(parse_url($_SERVER['REQUEST_URI'], PHP_URL_PATH) ?? '');

if ($uri !== '/' && file_exists($publicPath.$uri)) {
    return false;
}

require $publicPath.'/index.php';
`;
}

function assertRuntimeOwned(runtimePath) {
  const normalizedRuntime = path.resolve(runtimePath);
  const normalizedRoot = path.resolve(testResultsRoot) + path.sep;

  if (!normalizedRuntime.startsWith(normalizedRoot)) {
    fail('o runtime gerado está fora de test-results');
  }
}

function copyPublicAssets(publicPath) {
  const sourcePublicPath = path.join(projectRoot, 'public');
  const sourceBuildPath = path.join(sourcePublicPath, 'build');

  if (!fs.existsSync(sourceBuildPath)) {
    fail('o build do frontend não gerou public/build');
  }

  fs.cpSync(sourcePublicPath, publicPath, {
    recursive: true,
    filter(source) {
      const relative = path.relative(sourcePublicPath, source);
      if (relative === '') {
        return true;
      }

      const firstSegment = relative.split(path.sep)[0];
      return !['build', 'uploads', 'hot', 'storage'].includes(firstSegment) && relative !== 'index.php';
    },
  });
  fs.cpSync(sourceBuildPath, path.join(publicPath, 'build'), { recursive: true });
  fs.mkdirSync(path.join(publicPath, 'uploads', 'pdf'), { recursive: true });
  fs.writeFileSync(path.join(publicPath, 'index.php'), runtimeFrontController(publicPath));
}

function phpStringLiteral(value) {
  return `'${value.replaceAll('\\', '\\\\').replaceAll("'", "\\'")}'`;
}

function runtimeFrontController(publicPath) {
  const maintenancePath = path.join(publicPath, '..', 'storage', 'framework', 'maintenance.php');
  const autoloadPath = path.join(projectRoot, 'vendor', 'autoload.php');
  const bootstrapPath = path.join(projectRoot, 'bootstrap', 'app.php');

  return `<?php

use Illuminate\\Foundation\\Application;
use Illuminate\\Http\\Request;

define('LARAVEL_START', microtime(true));

if (file_exists(${phpStringLiteral(maintenancePath)})) {
    require ${phpStringLiteral(maintenancePath)};
}

require ${phpStringLiteral(autoloadPath)};

/** @var Application $app */
$app = require_once ${phpStringLiteral(bootstrapPath)};

$app->handleRequest(Request::capture());
`;
}

function testingEnvironment(runtime, port) {
  const token = `e2e-${crypto.randomUUID()}`;
  const baseURL = `http://127.0.0.1:${port}`;
  const authFiles = {
    default: path.join(runtime.authPath, 'user.json'),
    nutri: path.join(runtime.authPath, 'nutri.json'),
    inspetora: path.join(runtime.authPath, 'inspetora.json'),
    diretora: path.join(runtime.authPath, 'diretora.json'),
  };

  return {
    ...process.env,
    APP_ENV: 'testing',
    APP_DEBUG: 'true',
    APP_KEY: `base64:${crypto.randomBytes(32).toString('base64')}`,
    APP_URL: baseURL,
    FRONTEND_URL: baseURL,
    DB_CONNECTION: 'sqlite',
    DB_DATABASE: runtime.dbPath,
    CACHE_STORE: 'array',
    SESSION_DRIVER: 'array',
    QUEUE_CONNECTION: 'sync',
    MAIL_MAILER: 'array',
    FILESYSTEM_DISK: 'local',
    LARAVEL_STORAGE_PATH: runtime.storagePath,
    TEST_PUBLIC_PATH: runtime.publicPath,
    VIEW_COMPILED_PATH: runtime.viewsPath,
    TEST_RUN_TOKEN: token,
    E2E_RUN_TOKEN: token,
    E2E_RUNTIME_DIR: runtime.runtimePath,
    E2E_BASE_URL: baseURL,
    E2E_PORT: String(port),
    E2E_AUTH_DIR: runtime.authPath,
    E2E_DEFAULT_AUTH_STATE: authFiles.default,
    E2E_OUTPUT_DIR: path.join(runtime.runtimePath, 'playwright'),
    E2E_REPORT_DIR: path.join(runtime.runtimePath, 'playwright-report'),
    PHP_CLI_SERVER_WORKERS: '1',
  };
}

function runCommand(executable, args, environment, label) {
  const result = spawnSync(executable, args, {
    cwd: projectRoot,
    env: environment,
    stdio: 'inherit',
    windowsHide: true,
  });

  if (result.error) {
    fail(`${label} não pôde ser iniciado: ${result.error.message}`);
  }

  if (result.status !== 0) {
    fail(`${label} terminou com código ${result.status ?? 'desconhecido'}`);
  }
}

async function waitForServer(serverProcess, url) {
  const deadline = Date.now() + 120_000;

  while (Date.now() < deadline) {
    if (serverProcess.exitCode !== null) {
      fail(`servidor E2E terminou antes de responder (código ${serverProcess.exitCode ?? 'desconhecido'})`);
    }

    try {
      const responseStatus = await checkServer(url);

      if (responseStatus >= 200 && responseStatus < 300) {
        return;
      }
    } catch {
      // O servidor ainda pode estar iniciando.
    }

    await new Promise((resolve) => setTimeout(resolve, 250));
  }

  fail(`servidor E2E não respondeu em ${url}`);
}

function checkServer(url) {
  return new Promise((resolve, reject) => {
    const request = http.get(url, { headers: { Connection: 'close' } }, (response) => {
      response.resume();
      response.once('end', () => resolve(response.statusCode ?? 0));
    });

    request.setTimeout(2_000, () => request.destroy(new Error('timeout')));
    request.once('error', reject);
  });
}

function startServer(environment, runtime, port) {
  const php = executable('php');
  const serverProcess = spawn(
    php,
    ['-S', `127.0.0.1:${port}`, '-t', runtime.publicPath, runtime.serverPath],
    {
      cwd: projectRoot,
      env: environment,
      stdio: 'inherit',
      windowsHide: true,
    },
  );

  return serverProcess;
}

async function stopServer(serverProcess) {
  if (!serverProcess || serverProcess.exitCode !== null) {
    return;
  }

  const closed = new Promise((resolve) => {
    serverProcess.once('close', resolve);
  });

  if (process.platform === 'win32') {
    spawnSync('taskkill.exe', ['/PID', String(serverProcess.pid), '/T', '/F'], {
      stdio: 'ignore',
      windowsHide: true,
    });
  } else {
    serverProcess.kill('SIGTERM');
  }

  await Promise.race([
    closed,
    new Promise((resolve) => setTimeout(resolve, 5_000)),
  ]);
}

async function runPlaywright(playwrightCli, environment, runtime, port) {
  let serverProcess;

  try {
    serverProcess = startServer(environment, runtime, port);
    await waitForServer(serverProcess, `${environment.E2E_BASE_URL}/up`);

    const playwrightProcess = spawn(process.execPath, [playwrightCli, 'test'], {
      cwd: projectRoot,
      env: environment,
      stdio: 'inherit',
      windowsHide: true,
    });

    const result = await new Promise((resolve, reject) => {
      playwrightProcess.once('error', reject);
      playwrightProcess.once('close', (code, signal) => resolve({ code, signal }));
    });

    if (result.code !== 0) {
      fail(`Playwright terminou com código ${result.code ?? `sinal ${result.signal ?? 'desconhecido'}`}`);
    }
  } finally {
    await stopServer(serverProcess);
  }
}

function executable(name) {
  if (process.platform !== 'win32') {
    return name;
  }

  return name === 'npm' ? 'npm.cmd' : `${name}.exe`;
}

async function main() {
  assertProjectRoot();
  assertSafeEntryPoint();
  const options = parseArguments(process.argv.slice(2));
  const port = await choosePort(options.port);

  if (options.checkOnly) {
    console.log(`[e2e-isolado] porta ${port} disponível; nenhuma migração foi executada`);
    return;
  }

  const npmExecutable = process.platform === 'win32' ? process.execPath : executable('npm');
  const npmArguments = process.platform === 'win32'
    ? [path.join(path.dirname(process.execPath), 'node_modules', 'npm', 'bin', 'npm-cli.js'), 'run', 'build']
    : ['run', 'build'];
  runCommand(npmExecutable, npmArguments, process.env, 'build do frontend');

  const runtime = createRuntime();
  assertRuntimeOwned(runtime.runtimePath);
  copyPublicAssets(runtime.publicPath);
  const environment = testingEnvironment(runtime, port);
  const php = executable('php');

  runCommand(php, ['artisan', 'testing:assert-isolated', '--no-interaction'], environment, 'validação do runtime');
  runCommand(php, ['artisan', 'migrate:fresh', '--seed', '--seeder=E2eSeeder', '--env=testing', '--no-interaction'], environment, 'preparação do banco E2E');

  if (options.prepareOnly) {
    console.log(`[e2e-isolado] preparação concluída em ${runtime.runtimePath}`);
    return;
  }

  const playwrightCli = path.join(projectRoot, 'node_modules', '@playwright', 'test', 'cli.js');
  await runPlaywright(playwrightCli, environment, runtime, port);
}

if (process.argv[1] && path.resolve(process.argv[1]) === path.resolve(scriptPath)) {
  main()
    .then(() => process.exit(0))
    .catch((error) => {
      console.error(error.message);
      process.exit(1);
    });
}

export { assertSafeEntryPoint, choosePort, createRuntime, main, parseArguments, testingEnvironment };
