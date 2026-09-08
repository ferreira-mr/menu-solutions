import assert from 'node:assert/strict';
import crypto from 'node:crypto';
import fs from 'node:fs';
import net from 'node:net';
import path from 'node:path';
import test from 'node:test';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const scriptPath = fileURLToPath(import.meta.url);
const projectRoot = path.resolve(path.dirname(scriptPath), '../..');
const runnerPath = path.join(projectRoot, 'scripts', 'testing', 'run-e2e.mjs');
const normalDatabasePath = path.join(projectRoot, 'database', 'database.sqlite');
const configCachePath = path.join(projectRoot, 'bootstrap', 'cache', 'config.php');

function runRunner(args = [], environment = {}) {
  return spawnSync(process.execPath, [runnerPath, ...args], {
    cwd: projectRoot,
    env: { ...process.env, ...environment },
    encoding: 'utf8',
    windowsHide: true,
  });
}

test('Q02: a preparação E2E rejeita configuração herdada antes de criar runtime', () => {
  const before = fs.existsSync(normalDatabasePath)
    ? crypto.createHash('sha256').update(fs.readFileSync(normalDatabasePath)).digest('hex')
    : null;
  const runtimeEntriesBefore = fs.existsSync(path.join(projectRoot, 'test-results'))
    ? fs.readdirSync(path.join(projectRoot, 'test-results')).filter((entry) => entry.startsWith('e2e-runtime-'))
    : [];

  const result = runRunner(['--check-only'], {
    DB_DATABASE: normalDatabasePath,
    E2E_RUNTIME_DIR: path.join(projectRoot, 'outside-test-results'),
  });

  assert.notEqual(result.status, 0);
  assert.match(`${result.stdout}${result.stderr}`, /não pode controlar|não pode controlar/i);
  assert.deepEqual(runtimeEntriesBefore, fs.existsSync(path.join(projectRoot, 'test-results'))
    ? fs.readdirSync(path.join(projectRoot, 'test-results')).filter((entry) => entry.startsWith('e2e-runtime-'))
    : []);

  if (before !== null) {
    const after = crypto.createHash('sha256').update(fs.readFileSync(normalDatabasePath)).digest('hex');
    assert.equal(after, before);
  }
});

test('Q02: um cache de configuração impede a preparação antes de qualquer migração', () => {
  const cacheAlreadyExisted = fs.existsSync(configCachePath);

  if (!cacheAlreadyExisted) {
    fs.mkdirSync(path.dirname(configCachePath), { recursive: true });
    fs.writeFileSync(configCachePath, '<?php return [];');
  }

  try {
    const result = runRunner(['--check-only']);

    assert.notEqual(result.status, 0);
    assert.match(`${result.stdout}${result.stderr}`, /cache de configuração/i);
  } finally {
    if (!cacheAlreadyExisted) {
      fs.unlinkSync(configCachePath);
    }
  }
});

test('Q03: porta ocupada não é reutilizada e impede o runner público', async () => {
  const server = net.createServer();
  await new Promise((resolve) => server.listen({ host: '127.0.0.1', port: 0 }, resolve));
  const occupiedPort = server.address().port;

  try {
    const result = runRunner(['--check-only', `--port=${occupiedPort}`]);

    assert.notEqual(result.status, 0);
    assert.match(`${result.stdout}${result.stderr}`, /ocupada|indisponível/i);
  } finally {
    await new Promise((resolve) => server.close(resolve));
  }
});

test('Q03: a entrada pública consegue escolher uma porta exclusiva sem migrar', () => {
  const result = runRunner(['--check-only']);

  assert.equal(result.status, 0, `${result.stdout}${result.stderr}`);
  assert.match(result.stdout, /porta .* disponível/i);
  assert.match(result.stdout, /nenhuma migração foi executada/i);
});
