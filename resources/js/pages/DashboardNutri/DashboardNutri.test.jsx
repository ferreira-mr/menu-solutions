import React from 'react';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import DashboardNutri from './DashboardNutri';
import * as api from '../../services/api';

vi.mock('../../services/api', () => ({
  getContagensDashboard: vi.fn(),
  getTodosAlunosContagemNes: vi.fn(),
  getTodasNecessidades: vi.fn(),
  getNecessidadeComAlunos: vi.fn(),
  getTodasTurmas: vi.fn(),
  getContextoEscolar: vi.fn(),
}));

vi.mock('sweetalert2/dist/sweetalert2.all.min.js', () => ({
  default: {
    fire: vi.fn().mockResolvedValue({}),
  },
}));

describe('DashboardNutri (Nutricionista)', () => {
  const hoje = new Date().toISOString().slice(0, 10);

  beforeEach(() => {
    vi.clearAllMocks();
    api.getContextoEscolar.mockResolvedValue({
      data: { data_atual: hoje, timezone: 'America/Sao_Paulo', agora: new Date().toISOString() },
    });
    api.getContagensDashboard.mockResolvedValue({
      data: [
        {
          id: 1,
          nome_categoria: 'Ensino Fundamental',
          turmas: [
            { id: 101, nome_turma: '6º Ano A', qtd_contagem: 30, data_contagem: hoje },
            { id: 102, nome_turma: '7º Ano B', qtd_contagem: 28, data_contagem: hoje },
          ],
        },
      ],
    });
    api.getTodosAlunosContagemNes.mockResolvedValue([
        {
          id: 1,
          data_hora_contagem: `${hoje} 08:00:00`,
          relacao_id: 501,
          aluno: { id: 101, nome: 'Lucas', necessidade: 'NAE' },
        },
        {
          id: 2,
          data_hora_contagem: `${hoje} 08:05:00`,
          relacao_id: 502,
          aluno: { id: 101, nome: 'Julia', necessidade: 'Intolerância a Lactose' },
        },
    ]);
    api.getTodasTurmas.mockResolvedValue([]);
    api.getTodasNecessidades.mockResolvedValue([]);
  });

  it('calcula o total geral de contagens do dia corrente (58 alunos)', async () => {
    render(
      <MemoryRouter>
        <DashboardNutri />
      </MemoryRouter>
    );

    await waitFor(() => {
      // Total somado: 30 + 28 = 58 (aparece no card da categoria e no total geral)
      const countElements = screen.getAllByText('58');
      expect(countElements.length).toBeGreaterThanOrEqual(1);
      expect(screen.getByText('Ensino Fundamental')).toBeInTheDocument();
      expect(screen.getByText('Total Geral')).toBeInTheDocument();
    });
  });

  it('permite alternar entre a visão de Contagens e Necessidades Especiais', async () => {
    render(
      <MemoryRouter>
        <DashboardNutri />
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getByText('Ensino Fundamental')).toBeInTheDocument();
    });

    // Clica no toggle de Necessidades
    fireEvent.click(screen.getByRole('button', { name: /necessidades/i }));

    await waitFor(() => {
      expect(screen.getByText('Intolerância a Lactose')).toBeInTheDocument();
    });
  });

  it('exibe os totais Regular, Outros e Combinado fornecidos pelo dashboard', async () => {
    api.getContagensDashboard.mockResolvedValue({
      data: [
        {
          id: 1,
          nome_categoria: 'Regular',
          inclui_total_regular: true,
          turmas: [{ id: 101, nome_turma: '7º Ano A', qtd_contagem: 28, data_contagem: hoje }],
        },
        {
          id: 2,
          nome_categoria: 'Outros',
          inclui_total_regular: false,
          turmas: [{ id: 102, nome_turma: 'Robótica', qtd_contagem: 15, data_contagem: hoje }],
        },
      ],
      totals: { total_regular: 28, total_outros: 15, total_combinado: 43 },
    });

    render(
      <MemoryRouter>
        <DashboardNutri />
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getByText('Total Regular')).toBeInTheDocument();
      expect(screen.getByText('Total Outros')).toBeInTheDocument();
      expect(screen.getByText('(Combinado)')).toBeInTheDocument();
      expect(screen.getAllByText('28').length).toBeGreaterThanOrEqual(2);
      expect(screen.getAllByText('15').length).toBeGreaterThanOrEqual(2);
      expect(screen.getByText('43')).toBeInTheDocument();
    });
  });

  it('usa a relação NES para localizar a turma sem colapsar IDs do aluno', async () => {
    api.getTodasTurmas.mockResolvedValue([{ id: 12, nome_turma: '1º Ano A' }]);
    api.getTodasNecessidades.mockResolvedValue([
        { id: 7, necessidade: 'NAE' },
        { id: 8, necessidade: 'Intolerância a Lactose' },
    ]);
    api.getNecessidadeComAlunos.mockImplementation(async (id) => ({
      id,
      alunos: [{
        id: 101,
        turmas_id: 12,
        alunos_has_necessidades_id: id === 7 ? 501 : 502,
      }],
    }));

    const Swal = (await import('sweetalert2/dist/sweetalert2.all.min.js')).default;
    render(
      <MemoryRouter>
        <DashboardNutri />
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getByText('Ensino Fundamental')).toBeInTheDocument();
    });

    fireEvent.click(screen.getByRole('button', { name: /necessidades/i }));
    await waitFor(() => expect(screen.getByText('Intolerância a Lactose')).toBeInTheDocument());
    fireEvent.click(screen.getByText('Intolerância a Lactose'));

    await waitFor(() => {
      const lastCall = Swal.fire.mock.calls.at(-1)?.[0];
      expect(lastCall?.html?.textContent).toContain('1º Ano A');
    });
  });
});
