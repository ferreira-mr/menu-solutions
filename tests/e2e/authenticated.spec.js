import { test, expect } from '@playwright/test';

test.describe('fluxos autenticados da nutricionista', () => {
  test('abre o dashboard e exibe a navegação de operações', async ({ page }) => {
    await page.goto('/nutri/dashboard');
    await expect(page).toHaveURL(/\/nutri\/dashboard$/);
    await expect(page.getByText('Controle de Produção')).toBeVisible();
    await expect(page.getByText('Contagem Geral')).toBeVisible();
    await expect(page.locator('a[href="/nutri/planejamento"]')).toBeVisible();
    await expect(page.getByRole('button', { name: /Acessar Menu de Ações/i })).toBeVisible();
  });

  test('navega entre módulos preservando o shell da aplicação', async ({ page }) => {
    await page.goto('/nutri/dashboard');
    await page.getByText('Controle de Produção').click();
    await expect(page).toHaveURL(/\/nutri\/controle-producao$/);
    await expect(page.getByText(/Controle de Produção/i).first()).toBeVisible();

    await page.getByText('Cardápio').click();
    await expect(page).toHaveURL(/\/nutri\/cardapios$/);
    await expect(page.getByText(/Cardápio/i).first()).toBeVisible();
  });

  test('rota protegida redireciona quando a sessão é removida', async ({ page }) => {
    await page.goto('/nutri/dashboard');
    await page.evaluate(() => localStorage.clear());
    await page.goto('/nutri/dashboard');
    await expect(page).toHaveURL(/\/$/);
    await expect(page.getByRole('heading', { name: 'Login' })).toBeVisible();
  });
});
