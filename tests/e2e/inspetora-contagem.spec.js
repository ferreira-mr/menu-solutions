import { test, expect } from '@playwright/test';

test.describe('Fluxos E2E - Inspetora', () => {
  test.use({ storageState: 'tests/e2e/.auth/inspetora.json' });

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

  test('acessa a lista de autorizados da inspetora', async ({ page }) => {
    await page.goto('/inspetora/autorizados');
    await expect(page).toHaveURL(/\/inspetora\/autorizados$/);
    await expect(page.getByText(/Autorizados/i).first()).toBeVisible();
  });
});
