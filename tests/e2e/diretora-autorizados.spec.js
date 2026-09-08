import { test, expect } from '@playwright/test';
import { authState } from './auth-paths.js';

test.describe('Fluxos E2E - Diretoria', () => {
  test.use({ storageState: authState('diretora') });

  test('acessa tela inicial da diretora e exibe navegação gerencial', async ({ page }) => {
    await page.goto('/diretora/inicio');
    await expect(page).toHaveURL(/\/diretora\/inicio$/);
    await expect(page.getByText(/Menu Solutions/i).first()).toBeVisible();
    await expect(page.getByText(/Autorizados/i).first()).toBeVisible();
  });

  test('acessa módulo de autorizações para aprovação de solicitações', async ({ page }) => {
    await page.goto('/diretora/autorizados');
    await expect(page).toHaveURL(/\/diretora\/autorizados$/);
    await expect(page.getByText(/Autorizados/i).first()).toBeVisible();
  });

  test('acessa gerenciamento de usuários', async ({ page }) => {
    await page.goto('/diretora/gerenciar/usuarios');
    await expect(page).toHaveURL(/\/diretora\/gerenciar\/usuarios$/);
    await expect(page.getByText(/Usuários/i).first()).toBeVisible();
  });

  test('cria, edita e confirma a persistência de um usuário', async ({ page }) => {
    const suffix = Date.now();
    const nif = `9${String(suffix).slice(-10)}`;
    const nomeCriado = `Usuário Diretoria ${suffix}`;
    const nomeEditado = `${nomeCriado} Editado`;

    await page.goto('/diretora/gerenciar/usuarios');
    await page.getByRole('button', { name: /Novo Usuário/i }).click();
    await page.locator('#swal-name').fill(nomeCriado);
    await page.locator('#swal-nif').fill(nif);
    await page.locator('#swal-password').fill('password123');
    await page.getByRole('button', { name: 'Salvar' }).click();

    await expect(page.getByText('Criado!')).toBeVisible();
    const createdRow = page.locator('tr').filter({ hasText: nomeCriado });
    await expect(createdRow).toBeVisible();

    await createdRow.getByTitle('Editar').click();
    await page.locator('#swal-name').fill(nomeEditado);
    await page.getByRole('button', { name: 'Salvar' }).click();

    await expect(page.getByText('Atualizado!')).toBeVisible();
    await page.reload();
    await expect(page.locator('tr').filter({ hasText: nomeEditado })).toBeVisible();
  });
});

test.describe('Fluxos E2E - limites de perfil', () => {
  test.use({ storageState: authState('inspetora') });

  test('Staff não abre gestão de usuários e não obtém dados pela API', async ({ page }) => {
    await page.goto('/nutri/gerenciar/usuarios');
    await expect(page).toHaveURL(/\/inspetora\/inicio$/);

    const token = await page.evaluate(() => localStorage.getItem('authToken'));
    const response = await page.request.get('/api/users', {
      headers: { Authorization: `Bearer ${token}` },
    });
    expect(response.status()).toBe(403);
  });
});
