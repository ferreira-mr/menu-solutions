import { buildPlanningPdf } from './pages/Planejamento/PlanejamentoPage';
import { buildProductionPdf } from './components/ControleProducao/ProducaoFilterPanel';

const pdfText = (document) => Buffer.from(document.output('arraybuffer')).toString('latin1');

const planningStudents = Array.from({ length: 100 }, (_, index) => ({
  id: index + 1,
  nome: `Aluno ${index + 1}`,
  turmas_id: 1,
  alunos_has_necessidades_id: index + 100,
}));

const productionItems = Array.from({ length: 100 }, (_, index) => ({
  id: index + 1,
  nome_alimento: `Alimento ${index + 1}`,
  data_alimento: '2026-09-08',
  quantidade_alimento: '10.50',
  medida_alimento: 'kg',
  pessoas_alimento: 100,
  sobra_limpa_alimento: '1.25',
  desperdicio_alimento: '0.50',
}));

describe('exportações PDF com dados extensos', () => {
  it('gera o planejamento com a última linha e mais de uma página', () => {
    const document = buildPlanningPdf({
      completeData: [{
        id: 1,
        necessidade: 'Sem Glúten',
        alunos: planningStudents,
      }],
      scheduleDays: [{ id: 1, dia: 'Segunda', alunos: [] }],
      classNames: { 1: '8º Ano A' },
    });
    const text = pdfText(document);

    expect(text.startsWith('%PDF-')).toBe(true);
    expect(text).toContain('Aluno 100');
    expect((text.match(/\/Type \/Page\b/g) || []).length).toBeGreaterThan(1);
  });

  it('gera a produção com a última linha e mais de uma página', () => {
    vi.spyOn(console, 'error').mockImplementation(() => {});
    const { doc } = buildProductionPdf(productionItems, 'Relatório de Produção', null);
    const text = pdfText(doc);

    expect(text.startsWith('%PDF-')).toBe(true);
    expect(text).toContain('Alimento 100');
    expect((text.match(/\/Type \/Page\b/g) || []).length).toBeGreaterThan(1);
  });
});
