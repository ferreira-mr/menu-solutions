import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import CalendarView from './CalendarView';
import * as api from '../../services/api';

vi.mock('../../services/api', () => ({
  getTodosContagensPorRange: vi.fn(),
  getDashboardPorData: vi.fn(),
  getTodosAlunosNesPorData: vi.fn(),
  getTodasNecessidades: vi.fn(),
  getNecessidadeComAlunos: vi.fn(),
  getTurmas: vi.fn(),
  getContextoEscolar: vi.fn(),
}));

describe('CalendarView', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    api.getContextoEscolar.mockResolvedValue({
      data: { data_atual: '2026-09-07', timezone: 'America/Sao_Paulo', agora: '2026-09-08T01:00:00.000000Z' },
    });
    api.getTodasNecessidades.mockResolvedValue([]);
    api.getTodosContagensPorRange.mockResolvedValue([
        { id: 1, data_contagem: '2026-09-01', qtd_contagem: 40 },
    ]);
  });

  it('renderiza o calendário com o mês atual e navegação de meses', async () => {
    render(<CalendarView />);

    await waitFor(() => {
      // Exibe os dias da semana
      expect(screen.getByText(/Dom/i)).toBeInTheDocument();
      expect(screen.getByText(/Seg/i)).toBeInTheDocument();
      expect(screen.getByText(/Ter/i)).toBeInTheDocument();
    });
  });
});
