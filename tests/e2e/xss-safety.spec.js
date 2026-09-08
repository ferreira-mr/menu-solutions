import { test, expect } from '@playwright/test';
import { authState } from './auth-paths.js';

test.describe('Segurança de conteúdo dinâmico', () => {
  test.use({ storageState: authState('nutri') });

  test('preserva nome adversarial no modal real de edição sem executar marcação', async ({ page }) => {
    const nomeAdversarial = '"><img src=x onerror="window.__xssMarker = true"> <Equipe> & "Ação"';
    await page.goto('/nutri/gerenciar/usuarios');
    const token = await page.evaluate(() => localStorage.getItem('authToken'));
    const headers = { Authorization: `Bearer ${token}` };

    const updateResponse = await page.request.put('/api/users/3', {
      headers,
      data: { name: nomeAdversarial },
    });
    expect(updateResponse.ok()).toBeTruthy();

    await page.reload();
    const row = page.locator('tr').filter({ hasText: nomeAdversarial });
    await expect(row).toBeVisible();
    await row.getByTitle('Editar').click();

    await expect(page.locator('#swal-name')).toHaveValue(nomeAdversarial);
    await expect(page.locator('.swal2-popup [onerror], .swal2-popup [onfocus], .swal2-popup script')).toHaveCount(0);
    await expect.poll(() => page.evaluate(() => window.__xssMarker ?? null)).toBeNull();

    await page.locator('#swal-name').fill('Inspetora E2E Atualizada');
    await page.getByRole('button', { name: 'Salvar' }).click();
    await expect(page.getByText('Atualizado!')).toBeVisible();
  });
});
