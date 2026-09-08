import { getNecessidadeComAlunos } from './modules/escolar.api';
import { getCronograma } from './modules/cronograma.api';

function jsonResponse(body, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });
}

describe('adaptadores de contratos de vínculos', () => {
  beforeEach(() => {
    localStorage.setItem('authToken', 'token-de-teste');
    vi.stubGlobal('fetch', vi.fn());
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('desembrulha o detalhe de necessidade sem perder os alunos relacionados', async () => {
    fetch.mockResolvedValueOnce(jsonResponse({
      data: {
        id: 7,
        necessidade: 'NES',
        alunos: [{ id: 101, alunos_has_necessidades_id: 501, pivot: { id: 501 } }],
      },
    }));

    const necessidade = await getNecessidadeComAlunos(7);

    expect(necessidade.alunos).toEqual([
      { id: 101, alunos_has_necessidades_id: 501, pivot: { id: 501 } },
    ]);
  });

  it('normaliza cronograma com IDs explícitos e preserva meta e links', async () => {
    fetch.mockResolvedValueOnce(jsonResponse({
      data: [{
        id: 3,
        dia: 'Segunda',
        alunos: [{
          id: 901,
          alunos_has_necessidades_id: 501,
          cronograma_id: 3,
          aluno_has_necessidade: {
            id: 501,
            alunos_id: 101,
            necessidades_id: 7,
            aluno: { id: 101, nome: 'Ana de Teste', turmas_id: 12 },
            necessidade: { id: 7, necessidade: 'NES' },
          },
        }],
      }],
      meta: { current_page: 1, total: 1 },
      links: { first: '/api/cronogramas?page=1' },
    }));

    const cronograma = await getCronograma();

    expect(cronograma).toMatchObject({
      meta: { current_page: 1, total: 1 },
      links: { first: '/api/cronogramas?page=1' },
      data: [{
        id: 3,
        alunos: [{
          agendamento_id: 901,
          relacao_id: 501,
          cronograma_id: 3,
          aluno_id: 101,
          necessidade_id: 7,
          aluno: { id: 101, nome: 'Ana de Teste', turmas_id: 12 },
          necessidade: { id: 7, necessidade: 'NES' },
        }],
      }],
    });
  });

  it('não disponibiliza mutação para agendamento sem relação obrigatória', async () => {
    const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    fetch.mockResolvedValueOnce(jsonResponse({
      data: [{ id: 3, dia: 'Segunda', alunos: [{ id: 901 }] }],
    }));

    const cronograma = await getCronograma();

    expect(cronograma.data[0].alunos).toEqual([]);
    expect(errorSpy).toHaveBeenCalled();
  });
});
