import React from 'react';
import { render, screen } from '@testing-library/react';
import ReportView from './ReportView';
import * as api from '../../services/api';

vi.mock('../../services/api', () => ({
  getContagensPorRange: vi.fn(),
  getAlunosNesPorData: vi.fn(),
  getNecessidades: vi.fn(),
  getNecessidadeComAlunos: vi.fn(),
  getCategorias: vi.fn(),
  getTurmas: vi.fn(),
}));

describe('ReportView', () => {
  it('renderiza os tipos de relatório na barra lateral', () => {
    render(<ReportView />);

    expect(screen.getByText('Diário')).toBeInTheDocument();
    expect(screen.getByText('Semanal')).toBeInTheDocument();
    expect(screen.getByText('Mensal')).toBeInTheDocument();
    expect(screen.getByText('Personalizado')).toBeInTheDocument();
  });
});
