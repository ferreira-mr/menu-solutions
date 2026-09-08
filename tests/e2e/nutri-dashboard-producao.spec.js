import { test, expect } from '@playwright/test';
import { authState } from './auth-paths.js';

test.describe('Fluxos E2E - Nutricionista', () => {
  test.use({ storageState: authState('nutri') });

  test('acessa dashboard da nutricionista com painéis e métricas', async ({ page }) => {
    await page.goto('/nutri/dashboard');
    await expect(page).toHaveURL(/\/nutri\/dashboard$/);
    await expect(page.getByText('Controle de Produção')).toBeVisible();
    await expect(page.getByText('Contagem Geral')).toBeVisible();
  });

  test('acessa controle de produção e verifica tela operacional', async ({ page }) => {
    await page.goto('/nutri/controle-producao');
    await expect(page).toHaveURL(/\/nutri\/controle-producao$/);
    await expect(page.getByText(/Tabela de Consumo/i).first()).toBeVisible();
  });

  test('acessa relatório geral com visão de calendário', async ({ page }) => {
    await page.goto('/nutri/relatorio-geral');
    await expect(page).toHaveURL(/\/nutri\/relatorio-geral$/);
    await expect(page.getByRole('button', { name: /Calendário/i })).toBeVisible();
    await expect(page.getByRole('button', { name: /Relatórios/i })).toBeVisible();
  });
});
