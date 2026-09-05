import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import ContagemGeralPage from './ContagemGeralPage';

vi.mock('../../components/ContagemGeral/CalendarView', () => ({
  default: () => <div data-testid="calendar-view">Visão de Calendário</div>,
}));

vi.mock('../../components/ContagemGeral/ReportView', () => ({
  default: () => <div data-testid="report-view">Visão de Relatórios</div>,
}));

describe('ContagemGeralPage', () => {
  it('inicia na visão de calendário e permite alternar para relatórios', () => {
    render(
      <MemoryRouter>
        <ContagemGeralPage />
      </MemoryRouter>
    );

    expect(screen.getByTestId('calendar-view')).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: /relatórios/i }));

    expect(screen.getByTestId('report-view')).toBeInTheDocument();
  });
});
