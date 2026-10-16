import { test, expect } from '@playwright/test';
import fs from 'node:fs';
import path from 'node:path';
import { authState } from './auth-paths.js';

const projectRoot = process.cwd();
const printsDir = path.join(projectRoot, 'test-results', 'homologacao-prints');
const artifactsDir = 'C:/Users/ferreira-mr/.gemini/antigravity/brain/df77876f-fedd-4aaa-9745-e85d380f29b7/homologacao-prints';

fs.mkdirSync(printsDir, { recursive: true });
try {
  fs.mkdirSync(artifactsDir, { recursive: true });
} catch {
  // Ignora se não acessível
}

async function takePrint(page, filename) {
  const filePath = path.join(printsDir, filename);
  await page.screenshot({ path: filePath, fullPage: true });
  try {
    fs.copyFileSync(filePath, path.join(artifactsDir, filename));
  } catch {
    // Ignora se falhar cópia para artifacts
  }
}

test.describe.serial('E2E Homologação SESI - Todos os Casos de Uso e Fluxos Operacionais', () => {

  // =========================================================================
  // MÓDULO 1: FLUXO PÚBLICO E LOGIN (UC01, UC02, UC03)
  // =========================================================================
  test.describe('1. Autenticação e Acesso Público', () => {
    test.use({ storageState: { cookies: [], origins: [] } });

    test('UC01 & UC02 - Tela de login, campos estruturais e validação de credenciais incorretas', async ({ page }) => {
      await page.goto('/');
      await expect(page.locator('#username')).toBeVisible();
      await expect(page.locator('#password')).toBeVisible();
      await expect(page.locator('.login-submit-btn')).toBeVisible();
      await takePrint(page, '01_login_tela_inicial.png');

      // Tentativa com credenciais inválidas
      await page.locator('#username').fill('usuario_incorreto');
      await page.locator('#password').fill('senha_errada');
      await page.locator('.login-submit-btn').click();

      await expect(page.locator('.swal2-title')).toHaveText(/Acesso Negado/i);
      await takePrint(page, '02_login_erro_credenciais.png');

      await page.locator('.swal2-confirm').click();
      await expect(page.locator('.swal2-modal')).toBeHidden();
    });
  });

  // =========================================================================
  // MÓDULO 2: OPERAÇÃO DA INSPETORA (UC04 - UC12)
  // =========================================================================
  test.describe('2. Perfil Inspetora (Aferição Matinal, Contagem e Comunicação)', () => {
    test.use({ storageState: authState('inspetora') });

    test('UC04 & UC05 - Inspetora acessa tela inicial com atalhos operacionais', async ({ page }) => {
      await page.goto('/inspetora/inicio');
      await expect(page).toHaveURL(/\/inspetora\/inicio$/);
      await expect(page.getByText(/Nova Contagem/i).first()).toBeVisible();
      await expect(page.getByText(/Chat/i).first()).toBeVisible();
      await expect(page.getByText(/Cardápio/i).first()).toBeVisible();
      await expect(page.getByText(/Autorizados Direção/i).first()).toBeVisible();
      await takePrint(page, '03_inspetora_inicio.png');
    });

    test('UC06 & UC07 - Aferição matinal: seleção de turma, ajuste e persistência de contagem', async ({ page }) => {
      await page.goto('/nova-contagem');
      await expect(page).toHaveURL(/\/nova-contagem$/);
      await expect(page.getByText(/Contagem/i).first()).toBeVisible();
      await expect(page.locator('.turma-card').first()).toBeVisible();
      await takePrint(page, '04_inspetora_nova_contagem.png');

      // Abre modal de contagem
      await page.locator('.turma-card').first().click();
      await expect(page.locator('#contadorValor')).toBeVisible();
      await page.locator('#contadorValor').fill('27');
      await takePrint(page, '05_inspetora_modal_contagem.png');

      // Salva contagem
      await page.locator('.swal2-confirm').click();
      await expect(page.locator('#contadorValor')).toBeHidden();
      await expect(page.locator('.turma-card').first()).toContainText('27 alunos');
      await takePrint(page, '06_inspetora_contagem_salva.png');
    });

    test('UC08 - Visualização da seção de dietas especiais e turmas de contraturno', async ({ page }) => {
      await page.goto('/nova-contagem');
      await expect(page.locator('.turma-card').first()).toBeVisible();
      await takePrint(page, '07_inspetora_dietas_especiais_nes.png');
    });

    test('UC09 - Inspetora consulta cardápio semanal', async ({ page }) => {
      await page.goto('/cardapio');
      await expect(page).toHaveURL(/\/cardapio$/);
      await expect(page.getByText(/Cardápio Semanal/i).first()).toBeVisible();
      await takePrint(page, '08_inspetora_cardapio_view.png');
    });

    test('UC10 - Inspetora consulta solicitações de refeições autorizadas (somente leitura)', async ({ page }) => {
      await page.goto('/inspetora/autorizados');
      await expect(page).toHaveURL(/\/inspetora\/autorizados$/);
      await expect(page.getByText(/Autorizados Pela Direção/i).first()).toBeVisible();
      await expect(page.locator('.btn-create')).toHaveCount(0);
      await takePrint(page, '09_inspetora_autorizados.png');
    });

    test('UC11 - Inspetora envia mensagem no chat operacional', async ({ page }) => {
      const userPromise = page.waitForResponse(resp => resp.url().includes('/api/user') && resp.status() === 200);
      await page.goto('/inspetora/chat');
      await userPromise;

      await expect(page.getByText(/Chat Geral da Equipe/i).first()).toBeVisible();

      const mensagem = `Inspetora: Contagem das turmas concluída com sucesso (${Date.now()})`;
      await page.locator('input.chat-input').fill(mensagem);
      await page.locator('button.btn-send').click();

      await expect(page.getByText(mensagem).first()).toBeVisible({ timeout: 10000 });
      await takePrint(page, '10_inspetora_chat.png');
    });

    test('UC12 - Inspetora visualiza seu perfil funcional', async ({ page }) => {
      await page.goto('/inspetora/perfil');
      await expect(page).toHaveURL(/\/inspetora\/perfil$/);
      await expect(page.getByText(/Perfil/i).first()).toBeVisible();
      await expect(page.getByText(/Inspetora \/ Apoio/i).first()).toBeVisible();
      await takePrint(page, '11_inspetora_perfil.png');
    });
  });

  // =========================================================================
  // MÓDULO 3: GESTÃO TÉCNICA DA NUTRICIONISTA (UC13 - UC28)
  // =========================================================================
  test.describe('3. Perfil Nutricionista (Gestão Técnica, Produção e Planejamento)', () => {
    test.use({ storageState: authState('nutri') });

    test('UC13 - Nutricionista acessa menu inicial técnico', async ({ page }) => {
      await page.goto('/nutri/inicio');
      await expect(page).toHaveURL(/\/nutri\/inicio$/);
      await expect(page.getByText(/Controle de Produção/i).first()).toBeVisible();
      await expect(page.getByText(/Contagem Geral/i).first()).toBeVisible();
      await takePrint(page, '12_nutri_inicio.png');
    });

    test('UC14 & UC15 - Dashboard analítico em tempo real, totalizadores e modal NES', async ({ page }) => {
      await page.goto('/nutri/dashboard');
      await expect(page).toHaveURL(/\/nutri\/dashboard$/);
      await expect(page.getByText('Controle de Produção')).toBeVisible();
      await expect(page.getByText('Contagem Geral')).toBeVisible();
      await takePrint(page, '13_nutri_dashboard_tempo_real.png');

      // Alterna para visualização de necessidades
      await page.getByRole('button', { name: /Necessidades/i }).click();
      await takePrint(page, '14_nutri_dashboard_modal_nes.png');
    });

    test('UC16 & UC17 - Relatório Geral de Contagens: visão de calendário e tabela detalhada', async ({ page }) => {
      await page.goto('/nutri/relatorio-geral');
      await expect(page).toHaveURL(/\/nutri\/relatorio-geral$/);
      await expect(page.getByRole('button', { name: /Calendário/i })).toBeVisible();
      await takePrint(page, '15_nutri_relatorio_geral_calendario.png');

      // Alterna para aba de relatórios
      await page.getByRole('button', { name: /Relatórios/i }).click();
      await page.getByRole('button', { name: /Gerar Relatório/i }).click();
      await expect(page.locator('#report-page')).toBeVisible();
      await takePrint(page, '16_nutri_relatorio_geral_tabela.png');
    });

    test('UC18 & UC19 & UC20 - Controle de Produção: listagem e novo lançamento de pesagem', async ({ page }) => {
      await page.goto('/nutri/controle-producao');
      await expect(page).toHaveURL(/\/nutri\/controle-producao$/);
      await expect(page.getByText(/Tabela de Consumo/i).first()).toBeVisible();
      await takePrint(page, '17_nutri_controle_producao_listagem.png');

      // Clica em adicionar item
      await page.locator('button.btn-add-item').click();
      await expect(page.locator('#swal-nome')).toBeVisible();

      await page.locator('#swal-nome').fill('Feijão Carioca Especial');
      await page.locator('#swal-quantidade').fill('25.50');
      await page.locator('#swal-medida').fill('kg');
      await page.locator('#swal-pessoas').fill('280');
      await page.locator('#swal-sobra').fill('1.20');
      await page.locator('#swal-desperdicio').fill('0.75');
      await takePrint(page, '18_nutri_controle_producao_modal_novo.png');

      await page.locator('.swal2-confirm').click();
      await expect(page.getByText('Item adicionado.')).toBeVisible();
      await expect(page.getByText('Feijão Carioca Especial')).toBeVisible();
      await takePrint(page, '19_nutri_controle_producao_item_salvo.png');
    });

    test('UC21 - Gerenciamento de categorias educacionais e salas', async ({ page }) => {
      await page.goto('/nutri/gerenciar/categorias');
      await expect(page).toHaveURL(/\/nutri\/gerenciar\/categorias$/);
      await expect(page.getByText(/Fundamental 1A/i).first()).toBeVisible();
      await takePrint(page, '20_nutri_gerenciar_categorias.png');
    });

    test('UC22 - Gerenciamento de usuários e níveis de permissão', async ({ page }) => {
      await page.goto('/nutri/gerenciar/usuarios');
      await expect(page).toHaveURL(/\/nutri\/gerenciar\/usuarios$/);
      await expect(page.getByText(/Gerenciar Usuários/i).first()).toBeVisible();
      await takePrint(page, '21_nutri_gerenciar_usuarios.png');
    });

    test('UC23 - Cronograma semanal de contraturno', async ({ page }) => {
      await page.goto('/nutri/cronograma');
      await expect(page).toHaveURL(/\/nutri\/cronograma$/);
      await expect(page.getByText(/Segunda/i).first()).toBeVisible();
      await takePrint(page, '22_nutri_cronograma_contraturno.png');
    });

    test('UC24 - Planejamento de alunos e dietas especiais (NES)', async ({ page }) => {
      await page.goto('/nutri/planejamento');
      await expect(page).toHaveURL(/\/nutri\/planejamento$/);
      await expect(page.getByText(/Necessidades Especiais/i).first()).toBeVisible();
      await takePrint(page, '23_nutri_planejamento_dietas.png');
    });

    test('UC25 - Gerenciamento e central de cardápios semanais', async ({ page }) => {
      await page.goto('/nutri/cardapios');
      await expect(page).toHaveURL(/\/nutri\/cardapios$/);
      await expect(page.getByText(/Gerenciar Cardápios/i).first()).toBeVisible();
      await takePrint(page, '24_nutri_gerenciar_cardapios.png');
    });

    test('UC26 - Nutricionista cria nova solicitação de refeição avulsa (Autorizados)', async ({ page }) => {
      await page.goto('/nutri/autorizados');
      await expect(page).toHaveURL(/\/nutri\/autorizados$/);

      await page.locator('button.btn-create').click();
      await expect(page.locator('#swal-titulo')).toBeVisible();

      const titulo = `Almoço Equipe de Apoio - ${Date.now()}`;
      await page.locator('#swal-titulo').fill(titulo);
      await page.locator('#swal-conteudo').fill('3 refeições autorizadas para comissão de avaliação.');
      await takePrint(page, '25_nutri_autorizados_nova_solicitacao.png');

      await page.locator('.swal2-confirm').click();
      await expect(page.getByText(titulo)).toBeVisible();
      await takePrint(page, '26_nutri_autorizados_pendente.png');
    });

    test('UC27 - Chat operacional da Nutricionista', async ({ page }) => {
      const userPromise = page.waitForResponse(resp => resp.url().includes('/api/user') && resp.status() === 200);
      await page.goto('/nutri/chat');
      await userPromise;

      const msgNutri = `Nutricionista: Quantitativo de refeições recebido e calibrado com a cozinha (${Date.now()})`;
      await page.locator('input.chat-input').fill(msgNutri);
      await page.locator('button.btn-send').click();

      await expect(page.getByText(msgNutri).first()).toBeVisible({ timeout: 10000 });
      await takePrint(page, '27_nutri_chat.png');
    });

    test('UC28 - Perfil da Nutricionista', async ({ page }) => {
      await page.goto('/nutri/perfil');
      await expect(page).toHaveURL(/\/nutri\/perfil$/);
      await expect(page.getByText(/Nutricionista/i).first()).toBeVisible();
      await takePrint(page, '28_nutri_perfil.png');
    });
  });

  // =========================================================================
  // MÓDULO 4: GOVERNANÇA E AUDITORIA DA DIRETORIA (UC29 - UC37)
  // =========================================================================
  test.describe('4. Perfil Diretoria (Aprovação de Refeições e Governança)', () => {
    test.use({ storageState: authState('diretora') });

    test('UC29 - Diretora acessa tela inicial institucional', async ({ page }) => {
      await page.goto('/diretora/inicio');
      await expect(page).toHaveURL(/\/diretora\/inicio$/);
      await expect(page.getByText(/Menu Solutions/i).first()).toBeVisible();
      await expect(page.getByText(/Autorizados/i).first()).toBeVisible();
      await takePrint(page, '29_diretora_inicio.png');
    });

    test('UC30 & UC31 & UC32 - Diretora analisa e delibera aprovação de refeição avulsa', async ({ page }) => {
      await page.goto('/diretora/autorizados');
      await expect(page).toHaveURL(/\/diretora\/autorizados$/);
      await expect(page.getByText(/Autorizados Pela Direção/i).first()).toBeVisible();
      await takePrint(page, '30_diretora_autorizados_pendentes.png');

      const cardPendente = page.locator('.auth-card.pendente').first();
      await expect(cardPendente).toBeVisible();

      // Clica em aprovar
      await cardPendente.locator('.btn-approve-auth').click();
      await expect(page.locator('.swal2-title')).toHaveText(/Confirmar Autorização/i);
      await page.locator('.swal2-confirm').click();

      await expect(page.getByText('Autorizado!')).toBeVisible();
      await expect(page.locator('.auth-card.confirmado').first()).toBeVisible();
      await takePrint(page, '31_diretora_autorizados_aprovacao_confirmada.png');
    });

    test('UC33 - Diretora audita relatório geral de contagens', async ({ page }) => {
      await page.goto('/diretora/relatorio-geral');
      await expect(page).toHaveURL(/\/diretora\/relatorio-geral$/);
      await expect(page.getByRole('button', { name: /Calendário/i })).toBeVisible();
      await takePrint(page, '32_diretora_relatorio_geral.png');
    });

    test('UC34 - Diretora gerencia contas e permissões de usuários', async ({ page }) => {
      await page.goto('/diretora/gerenciar/usuarios');
      await expect(page).toHaveURL(/\/diretora\/gerenciar\/usuarios$/);
      await expect(page.getByText(/Gerenciar Usuários/i).first()).toBeVisible();
      await takePrint(page, '33_diretora_gerenciar_usuarios.png');
    });

    test('UC35 - Diretora envia mensagem institucional no chat', async ({ page }) => {
      const userPromise = page.waitForResponse(resp => resp.url().includes('/api/user') && resp.status() === 200);
      await page.goto('/diretora/chat');
      await userPromise;

      const msgDiretora = `Diretoria: Solicitações de almoço validadas e aprovadas (${Date.now()})`;
      await page.locator('input.chat-input').fill(msgDiretora);
      await page.locator('button.btn-send').click();

      await expect(page.getByText(msgDiretora).first()).toBeVisible({ timeout: 10000 });
      await takePrint(page, '34_diretora_chat.png');
    });

    test('UC36 & UC37 - Diretora visualiza perfil institucional', async ({ page }) => {
      await page.goto('/diretora/perfil');
      await expect(page).toHaveURL(/\/diretora\/perfil$/);
      await expect(page.getByText(/Diretora/i).first()).toBeVisible();
      await takePrint(page, '35_diretora_perfil.png');
    });
  });

  // =========================================================================
  // MÓDULO 5: REGRAS DE SEGURANÇA E VALIDAÇÕES (UC38 - UC43)
  // =========================================================================
  test.describe('5. Segurança, RBAC e Regras de Negócio', () => {
    test.use({ storageState: authState('inspetora') });

    test('UC38 - RBAC: bloqueio estrito e redirecionamento de rota não autorizada', async ({ page }) => {
      await page.goto('/nutri/gerenciar/usuarios');
      // Inspetora deve ser redirecionada para seu ponto de entrada
      await expect(page).toHaveURL(/\/inspetora\/inicio$/);
      await takePrint(page, '36_seguranca_bloqueio_rbac_inspetora.png');
    });

    test('UC39 - RN14: imutabilidade de contagem em datas anteriores', async ({ page }) => {
      await page.goto('/inspetora/inicio');
      const token = await page.evaluate(() => localStorage.getItem('authToken'));

      // Tenta submeter contagem em data retroativa via requisição autenticada
      const response = await page.request.post('/api/contagens/operacao', {
        headers: {
          Authorization: `Bearer ${token}`,
          'Idempotency-Key': '11111111-2222-3333-4444-555555555555',
        },
        data: {
          turma_id: 1,
          data_contagem: '2024-01-01',
          qtd_contagem: 20,
        },
      });

      // Valida que o backend rejeita a alteração retroativa conforme RN14
      expect(response.status()).toBe(422);
      await takePrint(page, '37_seguranca_rn14_contagem_passada.png');
    });
  });
});
