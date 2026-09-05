import { test, expect } from '@playwright/test';

test.describe('Fluxos E2E - Diretoria', () => {
  test.use({ storageState: 'tests/e2e/.auth/diretora.json' });

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
});
