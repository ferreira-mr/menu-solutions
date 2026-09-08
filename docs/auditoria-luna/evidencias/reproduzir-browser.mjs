// Diagnóstico manual automatizado, fora da suíte de regressão.
// Só aceita o servidor descartável da auditoria na porta 8017.
import { chromium } from '@playwright/test';
import fs from 'node:fs/promises';

const baseURL = 'http://127.0.0.1:8017';
const output = new URL('./browser.json', import.meta.url);
const results = {};
async function api(path, token, method = 'GET', body) {
  const response = await fetch(baseURL + '/api' + path, {
    method,
    headers: { Accept: 'application/json', 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}) },
    body: body === undefined ? undefined : JSON.stringify(body),
  });
  const json = response.status === 204 ? null : await response.json();
  if (!response.ok) throw new Error(`${method} ${path}: ${response.status} ${JSON.stringify(json)}`);
  return json;
}
const nutri = await api('/login', null, 'POST', { nif: '22222222222', password: 'password' });
const staff = await api('/login', null, 'POST', { nif: '11111111111', password: 'password' });
const browser = await chromium.launch();
const context = await browser.newContext({ locale: 'pt-BR', timezoneId: 'America/Sao_Paulo' });
async function pageFor(auth) {
  const page = await context.newPage();
  await page.addInitScript(({ token, user }) => {
    localStorage.setItem('authToken', token);
    localStorage.setItem('userName', user.name);
    localStorage.setItem('userLevel', String(user.nivel_user));
  }, auth);
  return page;
}
try {
  const classes = await api('/turmas', staff.token);
  const classroom = classes.data[0];
  const saved = await api('/contagens', staff.token, 'POST', { turmas_id: classroom.id, qtd_contagem: 12 });
  const before = await api('/contagens?limit=1000', staff.token);
  const counting = await pageFor(staff);
  await counting.goto(baseURL + '/nova-contagem');
  await counting.locator('button.turma-card').first().waitFor();
  const totalBefore = await counting.locator('.total-geral strong').textContent();
  await counting.locator('button.turma-card').first().click();
  await counting.locator('#contadorValor').waitFor();
  const initial = await counting.locator('#contadorValor').inputValue();
  await counting.getByRole('button', { name: 'Fechar', exact: true }).click();
  const after = await api('/contagens?limit=1000', staff.token);
  results.contagem = { data_recebida: saved.data.data_contagem, total_visualizado: totalBefore, valor_ao_reabrir: initial, linhas_antes_abrir: before.meta.total, linhas_apos_fechar_sem_salvar: after.meta.total };
  await counting.close();

  for (let i = 0; i < 21; i++) {
    await api('/chats', staff.token, 'POST', { mensagem_chat: `Auditoria mensagem ${i}` });
  }
  const chat = await pageFor(staff);
  await chat.goto(baseURL + '/inspetora/chat');
  await chat.getByText('Auditoria mensagem 20', { exact: true }).waitFor().catch(() => {});
  const polling = chat.waitForResponse(r => r.url().includes('/api/chats') && r.request().method() === 'GET');
  const marker = `AUDITORIA-NOVA-${Date.now()}`;
  await api('/chats', staff.token, 'POST', { mensagem_chat: marker });
  const polled = await (await polling).json();
  results.chat = { tamanho_pagina: polled.data.length, nova_mensagem_na_resposta: polled.data.some(m => m.mensagem_chat === marker), nova_mensagem_visivel: await chat.getByText(marker, { exact: true }).count() > 0 };
  await chat.close();

  // Marcador local inofensivo: não lê nem transmite tokens/dados.
  const payload = '\"><img src=x onerror="window.__auditXss=1">';
  await api(`/users/${staff.user.id}`, staff.token, 'PUT', { name: payload });
  const usersPage = await pageFor(nutri);
  await usersPage.goto(baseURL + '/nutri/gerenciar/usuarios');
  const row = usersPage.locator('tr').filter({ hasText: '11111111111' });
  await row.getByTitle('Editar', { exact: true }).click();
  await usersPage.waitForFunction(() => window.__auditXss === 1);
  results.xss = { origem: 'nome do próprio usuário Staff', destino: 'modal de edição aberto pela Nutricionista', javascript_executado: await usersPage.evaluate(() => window.__auditXss === 1) };
  await usersPage.close();
  await api(`/users/${staff.user.id}`, staff.token, 'PUT', { name: 'Inspetora E2E' });
} finally {
  await fs.writeFile(output, JSON.stringify(results, null, 2));
  await browser.close();
}
console.log(JSON.stringify(results, null, 2));
