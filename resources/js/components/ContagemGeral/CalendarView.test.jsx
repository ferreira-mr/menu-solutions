import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import CalendarView from './CalendarView';
import * as api from '../../services/api';

vi.mock('../../services/api', () => ({
  getContagensPorRange: vi.fn(),
  getDashboardPorData: vi.fn(),
  getAlunosNesPorData: vi.fn(),
  getNecessidades: vi.fn(),
  getNecessidadeComAlunos: vi.fn(),
  getTurmas: vi.fn(),
}));

describe('CalendarView', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    api.getNecessidades.mockResolvedValue({ data: [] });
    api.getContagensPorRange.mockResolvedValue({
      data: [
        { id: 1, data_contagem: '2026-09-01', qtd_contagem: 40 },
      ],
    });
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
