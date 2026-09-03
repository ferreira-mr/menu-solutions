import { test, expect } from '@playwright/test';

test.describe('fluxos públicos', () => {
  test.use({ storageState: { cookies: [], origins: [] } });

  test('renderiza a tela de login e mantém a identidade visual principal', async ({ page }) => {
    await page.goto('/');
    await expect(page.getByRole('heading', { name: 'Login' })).toBeVisible();
    await expect(page.getByAltText('Logo Menu Solutions')).toBeVisible();
    await expect(page.locator('input[type="submit"]')).toHaveValue('Entrar');
    await expect(page.getByText('Termos de Uso')).toBeVisible();
  });

  test('fallback do Laravel entrega o shell React em uma rota desconhecida', async ({ page }) => {
    await page.goto('/rota-inexistente');
    await expect(page.getByRole('heading', { name: 'Login' })).toBeVisible();
  });
});
