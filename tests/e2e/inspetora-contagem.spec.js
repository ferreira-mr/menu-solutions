import { test, expect } from '@playwright/test';
import { authState } from './auth-paths.js';

test.describe('Fluxos E2E - Inspetora', () => {
  test.use({ storageState: authState('inspetora') });

  test('acessa tela inicial da inspetora e exibe atalhos principais', async ({ page }) => {
    await page.goto('/inspetora/inicio');
    await expect(page).toHaveURL(/\/inspetora\/inicio$/);
    await expect(page.getByText(/Menu Solutions/i).first()).toBeVisible();
    await expect(page.getByText(/Nova Contagem/i).first()).toBeVisible();
  });

  test('navega para nova contagem e carrega a tela de registro', async ({ page }) => {
    await page.goto('/nova-contagem');
    await expect(page).toHaveURL(/\/nova-contagem$/);
    await expect(page.getByText(/Contagem/i).first()).toBeVisible();
  });

  test('cancela uma nova contagem sem enviar mutações', async ({ page }) => {
    const mutatingRequests = [];
    page.on('request', request => {
      if (['POST', 'PUT', 'PATCH', 'DELETE'].includes(request.method())) {
        mutatingRequests.push(request);
      }
    });

    await page.goto('/nova-contagem');
    await page.locator('.turma-card').first().click();
    await expect(page.locator('#contadorValor')).toBeVisible();
    await page.locator('#contadorValor').fill('28');
    await page.locator('.swal2-cancel').click();

    await expect(page.locator('#contadorValor')).toBeHidden();
    expect(mutatingRequests).toHaveLength(0);
  });

  test('salva uma operação única e mantém a quantidade após recarregar', async ({ page }) => {
    let operationRequest;
    const operationPromise = new Promise(resolve => {
      page.on('request', request => {
        if (request.url().includes('/api/contagens/operacao') && request.method() === 'POST') {
          operationRequest = request;
          resolve(request);
        }
      });
    });

    await page.goto('/nova-contagem');
    await page.locator('.turma-card').first().click();
    await expect(page.locator('#contadorValor')).toBeVisible();
    await page.locator('#contadorValor').fill('28');
    await page.locator('.swal2-confirm').click();
    await operationPromise;
    await expect(page.locator('#contadorValor')).toBeHidden();

    expect(operationRequest.headers()['idempotency-key']).toMatch(/^[0-9a-f-]{36}$/i);
    await page.reload();
    await expect(page.locator('.turma-card').first()).toContainText('28 alunos');
  });

  test('acessa a lista de autorizados da inspetora', async ({ page }) => {
    await page.goto('/inspetora/autorizados');
    await expect(page).toHaveURL(/\/inspetora\/autorizados$/);
    await expect(page.getByText(/Autorizados/i).first()).toBeVisible();
  });
});
