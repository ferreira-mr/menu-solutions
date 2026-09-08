import { test, expect } from '@playwright/test';
import fs from 'node:fs/promises';
import { authState } from './auth-paths.js';

const paginator = (data) => ({
  data,
  meta: {
    current_page: 1,
    last_page: 1,
    per_page: data.length,
    total: data.length,
  },
});

const readPdfDownload = async (download) => {
  const filePath = await download.path();
  expect(filePath).toBeTruthy();
  const bytes = await fs.readFile(filePath);
  const text = bytes.toString('latin1');

  expect(bytes.subarray(0, 5).toString('latin1')).toBe('%PDF-');
  expect(text).toContain('%%EOF');
  expect(bytes.byteLength).toBeGreaterThan(1000);
  expect((text.match(/\/Type \/Page\b/g) || []).length).toBeGreaterThan(0);

  return text;
};

const routeJson = async (route, data) => {
  await route.fulfill({
    status: 200,
    contentType: 'application/json',
    body: JSON.stringify(data),
  });
};

const planningStudents = Array.from({ length: 100 }, (_, index) => ({
  id: index + 1,
  nome: `Aluno ${index + 1}`,
  rm: `RM-${index + 1}`,
  turmas_id: 1,
  alunos_has_necessidades_id: index + 100,
}));

const productionItems = Array.from({ length: 100 }, (_, index) => ({
  id: index + 1,
  nome_alimento: `Alimento ${index + 1}`,
  data_alimento: new Date().toISOString().slice(0, 10),
  quantidade_alimento: '10.50',
  medida_alimento: 'kg',
  pessoas_alimento: 100,
  sobra_limpa_alimento: '1.25',
  desperdicio_alimento: '0.50',
}));

test.describe('exportações PDF dos relatórios', () => {
  test.use({ storageState: authState('nutri') });

  test('exporta planejamento com acentos, última linha e paginação', async ({ page }) => {
    await page.route('**/api/necessidades*', (route) => {
      return routeJson(route, paginator([{ id: 1, necessidade: 'Sem Glúten & Ação' }]));
    });
    await page.route('**/api/necessidades/1', (route) => routeJson(route, {
      data: {
        id: 1,
        necessidade: 'Sem Glúten & Ação',
        alunos: planningStudents,
      },
    }));
    await page.route('**/api/alunos*', (route) => routeJson(route, paginator(planningStudents)));
    await page.route('**/api/turmas*', (route) => routeJson(route, paginator([{ id: 1, nome_turma: '8º Ano A' }])));
    await page.route('**/api/cronogramas*', (route) => routeJson(route, paginator([
      { id: 1, dia: 'Segunda', alunos: [] },
    ])));

    await page.goto('/nutri/planejamento');
    await expect(page.getByText('Sem Glúten & Ação', { exact: true })).toBeVisible();
    await page.getByText('Sem Glúten & Ação', { exact: true }).click();
    await expect(page.locator('.panel-central .aluno-card')).toHaveCount(100);
    await expect(page.locator('.panel-central .aluno-card').last()).toContainText('Aluno 100');

    const [download] = await Promise.all([
      page.waitForEvent('download'),
      page.getByRole('button', { name: 'PDF' }).click(),
    ]);
    const text = await readPdfDownload(download);

    expect(download.suggestedFilename()).toBe('relatorio_planejamento.pdf');
    expect(text).toContain('Aluno 100');
  });

  test('exporta contagem geral com texto adversarial, última linha e paginação', async ({ page }) => {
    const day = new Date().toISOString().slice(0, 10);
    const countRows = Array.from({ length: 100 }, (_, index) => ({
      id: index + 1,
      data_contagem: day,
      qtd_contagem: index + 1,
      turma: {
        nome_turma: `Turma ${index + 1}`,
        categoria: { nome_categoria: index === 99 ? '<script>Ação & Café</script>' : 'Categoria' },
      },
    }));

    await page.route('**/api/contagens*', (route) => routeJson(route, paginator(countRows)));
    await page.route('**/api/contagem-nes*', (route) => routeJson(route, paginator([])));

    await page.goto('/nutri/relatorio-geral');
    await page.getByRole('button', { name: 'Relatórios' }).first().click();
    await page.getByRole('button', { name: 'Gerar Relatório' }).click();
    await expect(page.locator('#report-page tbody tr')).toHaveCount(100);
    await expect(page.getByText('Turma 100', { exact: true })).toBeVisible();
    await expect(page.locator('#report-page')).toContainText('<script>Ação & Café</script>');

    const [download] = await Promise.all([
      page.waitForEvent('download'),
      page.getByRole('button', { name: /Baixar PDF/i }).click(),
    ]);
    await readPdfDownload(download);
    expect(download.suggestedFilename()).toMatch(/^Relatorio_diario_/);
  });

  test('exporta produção com acentos, última linha e paginação', async ({ page }) => {
    await page.route('**/api/controle_de_producao*', (route) => routeJson(route, paginator(productionItems)));

    await page.goto('/nutri/controle-producao');
    await expect(page.getByText('Tabela de Consumo', { exact: false }).first()).toBeVisible();
    await page.getByRole('button', { name: /Relatórios/i }).click();
    await page.getByRole('button', { name: 'Gerar Relatório' }).click();
    await expect(page.locator('.producao-report-preview-area tbody tr')).toHaveCount(100);
    await expect(page.getByText('Alimento 100', { exact: true })).toBeVisible();

    const [download] = await Promise.all([
      page.waitForEvent('download'),
      page.getByRole('button', { name: /Baixar PDF/i }).click(),
    ]);
    const text = await readPdfDownload(download);

    expect(download.suggestedFilename()).toMatch(/^Producao_Consumo_/);
    expect(text).toContain('Alimento 100');
  });
});
