import React from 'react';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import DashboardNutri from './DashboardNutri';
import * as api from '../../services/api';

vi.mock('../../services/api', () => ({
  getContagensDashboard: vi.fn(),
  getAlunosContagemNes: vi.fn(),
  getNecessidades: vi.fn(),
  getNecessidadeComAlunos: vi.fn(),
  getTurmas: vi.fn(),
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
    api.getAlunosContagemNes.mockResolvedValue({
      data: [
        {
          id: 1,
          data_hora_contagem: `${hoje} 08:00:00`,
          aluno: { id: 10, nome: 'Lucas', necessidade: 'NAE' },
        },
        {
          id: 2,
          data_hora_contagem: `${hoje} 08:05:00`,
          aluno: { id: 11, nome: 'Julia', necessidade: 'Intolerância a Lactose' },
        },
      ],
    });
    api.getTurmas.mockResolvedValue({ data: [] });
    api.getNecessidades.mockResolvedValue({ data: [] });
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
});
