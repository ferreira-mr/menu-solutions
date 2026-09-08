import { test, expect } from '@playwright/test';
import { URL } from 'node:url';
import { authState } from './auth-paths.js';

const createMessage = (id, text, overrides = {}) => ({
  id,
  mensagem_chat: text,
  visto: 'n',
  data: `2026-09-04T07:${String(Math.max(id, 1)).padStart(2, '0')}:00.000000Z`,
  users_id: 999,
  user: { id: 999, name: 'Usuário de teste' },
  created_at: `2026-09-04T07:${String(Math.max(id, 1)).padStart(2, '0')}:00.000000Z`,
  updated_at: `2026-09-04T07:${String(Math.max(id, 1)).padStart(2, '0')}:00.000000Z`,
  ...overrides,
});

const responseFor = (messages, currentPage = 1, lastPage = 1) => ({
  data: messages,
  links: { first: '/api/chats?page=1', last: `/api/chats?page=${lastPage}`, prev: null, next: null },
  meta: { current_page: currentPage, last_page: lastPage, per_page: 20, total: messages.length },
});

test.describe.serial('Fluxos E2E - Chat e Comunicação', () => {
  test.use({ storageState: authState('inspetora') });

  test('acessa chat da equipe e visualiza interface de mensagens', async ({ page }) => {
    await page.goto('/inspetora/chat');
    await expect(page).toHaveURL(/\/inspetora\/chat$/);
    await expect(page.getByText(/Chat Geral da Equipe/i).first()).toBeVisible();
    await expect(page.locator('input.chat-input')).toBeVisible();
    await expect(page.locator('button.btn-send')).toBeVisible();
  });

  test('permite digitar e enviar uma nova mensagem no chat', async ({ page }) => {
    const userPromise = page.waitForResponse(resp => resp.url().includes('/api/user') && resp.status() === 200);
    await page.goto('/inspetora/chat');
    await userPromise;
    await expect(page.getByText(/Chat Geral da Equipe/i).first()).toBeVisible();
    
    const input = page.locator('input.chat-input');
    const sendButton = page.locator('button.btn-send');

    const testMessage = `Mensagem Teste E2E ${Date.now()}`;
    await input.fill(testMessage);
    await sendButton.click();

    await expect(page.getByText(testMessage).first()).toBeVisible({ timeout: 10000 });
  });

  test('atualiza conteúdo novo em polling com o mesmo tamanho no navegador', async ({ page }) => {
    const initialMessages = Array.from({ length: 20 }, (_, index) => createMessage(index + 1, `Mensagem E2E ${index + 1}`));
    const polledMessages = [...initialMessages.slice(1), createMessage(21, 'Mensagem E2E recebida no polling')];
    let reads = 0;

    await page.route('**/api/chats*', async (route) => {
      if (route.request().method() !== 'GET') return route.continue();
      reads += 1;
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(responseFor(reads === 1 ? initialMessages : polledMessages)),
      });
    });

    await page.goto('/inspetora/chat');
    await expect(page.getByText('Mensagem E2E 1', { exact: true })).toBeVisible();
    await expect(page.getByText('Mensagem E2E recebida no polling')).toBeVisible({ timeout: 8000 });
    await expect(page.getByText('Mensagem E2E recebida no polling')).toHaveCount(1);
  });

  test('carrega histórico paginado e mantém as mensagens sem duplicação', async ({ page }) => {
    const initialMessages = Array.from({ length: 20 }, (_, index) => createMessage(index + 1, `Histórico E2E ${index + 1}`));
    const olderMessage = createMessage(0, 'Histórico E2E anterior', {
      data: '2026-09-03T18:00:00.000000Z',
      created_at: '2026-09-03T18:00:00.000000Z',
      updated_at: '2026-09-03T18:00:00.000000Z',
    });
    const polledMessages = [...initialMessages.slice(1), createMessage(21, 'Histórico E2E novo')];
    let recentReads = 0;

    await page.route('**/api/chats*', async (route) => {
      if (route.request().method() !== 'GET') return route.continue();
      const url = new URL(route.request().url());
      const pageNumber = Number(url.searchParams.get('page') || 1);
      const body = pageNumber === 2
        ? responseFor([olderMessage], 2, 2)
        : responseFor(recentReads++ === 0 ? initialMessages : polledMessages, 1, 2);
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(body),
      });
    });

    await page.goto('/inspetora/chat');
    await expect(page.getByText('Histórico E2E 1', { exact: true })).toBeVisible();
    await page.getByRole('button', { name: /mensagens anteriores/i }).click();
    await expect(page.getByText('Histórico E2E anterior')).toBeVisible();
    await expect(page.getByText('Histórico E2E novo')).toBeVisible({ timeout: 8000 });
    await expect(page.getByText('Histórico E2E anterior')).toHaveCount(1);
    await expect(page.getByText('Histórico E2E 2', { exact: true })).toHaveCount(1);
    await expect(page.getByRole('button', { name: /mensagens anteriores/i })).toHaveCount(0);
  });
});
