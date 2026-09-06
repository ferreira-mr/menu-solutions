import { test, expect } from '@playwright/test';

test.describe('E2E Homologação SESI - Fluxos Operacionais e Gerenciais', () => {
  test.describe('Perfil Inspetora (Aferição Matinal e Segurança Alimentar)', () => {
    test.use({ storageState: 'tests/e2e/.auth/inspetora.json' });

    test('inspetora acessa a tela de contagem, visualiza turmas e métricas diárias', async ({ page }) => {
      await page.goto('/nova-contagem');
      await expect(page).toHaveURL(/\/nova-contagem$/);

      // Valida cabeçalho e elementos da tela de contagem
      await expect(page.getByText(/Contagem/i).first()).toBeVisible();
      await expect(page.getByText(/1º Ano A/i).first()).toBeVisible();
    });

    test('inspetora acessa seu perfil e verifica integridade dos dados', async ({ page }) => {
      await page.goto('/inspetora/perfil');
      await expect(page).toHaveURL(/\/inspetora\/perfil$/);
      await expect(page.getByText(/Perfil/i).first()).toBeVisible();
    });
  });

  test.describe('Perfil Nutricionista (Gestão Técnica e Controle de Produção)', () => {
    test.use({ storageState: 'tests/e2e/.auth/nutri.json' });

    test('nutricionista acessa o módulo de gerenciamento de usuários', async ({ page }) => {
      await page.goto('/nutri/gerenciar/usuarios');
      await expect(page).toHaveURL(/\/nutri\/gerenciar\/usuarios$/);
      await expect(page.getByText(/Gerenciar Usuários/i).first()).toBeVisible();
      await expect(page.getByText(/Novo Usuário/i)).toBeVisible();
    });

    test('nutricionista acessa a central de cardápios semanais', async ({ page }) => {
      await page.goto('/nutri/cardapios');
      await expect(page).toHaveURL(/\/nutri\/cardapios$/);
      await expect(page.getByText(/Gerenciar Cardápios/i)).toBeVisible();
      await expect(page.getByText(/Adicionar Novo Cardápio/i)).toBeVisible();
    });

    test('nutricionista acessa o controle de produção e verifica lançamento', async ({ page }) => {
      await page.goto('/nutri/controle-producao');
      await expect(page).toHaveURL(/\/nutri\/controle-producao$/);
      await expect(page.getByText(/Tabela de Consumo/i).first()).toBeVisible();
    });
  });

  test.describe('Perfil Diretoria (Aprovação de Refeições e Auditoria)', () => {
    test.use({ storageState: 'tests/e2e/.auth/diretora.json' });

    test('diretora acessa a lista de solicitações autorizadas', async ({ page }) => {
      await page.goto('/diretora/autorizados');
      await expect(page).toHaveURL(/\/diretora\/autorizados$/);
      await expect(page.getByText(/Autorizados Pela Direção/i)).toBeVisible();
    });
  });
});
