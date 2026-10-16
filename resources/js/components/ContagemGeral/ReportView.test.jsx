import React from 'react';
import { render, screen, waitFor, act, fireEvent } from '@testing-library/react';
import ReportView from './ReportView';
import * as api from '../../services/api';

vi.mock('../../services/api', () => ({
  getTodosContagensPorRange: vi.fn(),
  getTodosAlunosNesPorData: vi.fn(),
  getTodosAlunosNesPorRange: vi.fn(),
  getNecessidades: vi.fn(),
  getNecessidadeComAlunos: vi.fn(),
  getCategorias: vi.fn(),
  getTurmas: vi.fn(),
  getContextoEscolar: vi.fn().mockResolvedValue({ data: { data_atual: '2026-09-07', timezone: 'America/Sao_Paulo' } }),
}));

describe('ReportView', () => {
  it('renderiza os tipos de relatório na barra lateral', async () => {
    await act(async () => {
      render(<ReportView />);
    });

    expect(screen.getByText('Diário')).toBeInTheDocument();
    expect(screen.getByText('Semanal')).toBeInTheDocument();
    expect(screen.getByText('Mensal')).toBeInTheDocument();
    expect(screen.getByText('Personalizado')).toBeInTheDocument();
  });

  it('gera relatório buscando contagens e alunos NES por range de datas', async () => {
    api.getTodosContagensPorRange.mockResolvedValue([
      { id: 1, turmas_id: 1, qtd_contagem: 20, data_contagem: '2026-09-07' }
    ]);
    api.getTodosAlunosNesPorRange.mockResolvedValue([
      { id: 10, data_hora_contagem: '2026-09-07T10:00:00Z', aluno: { nome: 'Aluno NES' } }
    ]);

    await act(async () => {
      render(<ReportView />);
    });
    const btnGerar = screen.getByRole('button', { name: /gerar relatório/i });
    await act(async () => {
      fireEvent.click(btnGerar);
    });

    await waitFor(() => {
      expect(api.getTodosContagensPorRange).toHaveBeenCalled();
      expect(api.getTodosAlunosNesPorRange).toHaveBeenCalled();
    });
  });

  it('gera relatório semanal com título formatado corretamente', async () => {
    api.getTodosContagensPorRange.mockResolvedValue([]);
    api.getTodosAlunosNesPorRange.mockResolvedValue([]);

    await act(async () => {
      render(<ReportView />);
    });

    const btnSemanal = screen.getByText('Semanal');
    await act(async () => {
      fireEvent.click(btnSemanal);
    });

    const btnGerar = screen.getByRole('button', { name: /gerar relatório/i });
    await act(async () => {
      fireEvent.click(btnGerar);
    });

    await waitFor(() => {
      expect(screen.getByText(/Relatório Semanal:/i)).toBeInTheDocument();
    });
  });
});
