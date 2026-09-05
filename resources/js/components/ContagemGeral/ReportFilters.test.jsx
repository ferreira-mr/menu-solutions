import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import ReportFilters from './ReportFilters';

describe('ReportFilters', () => {
  const defaultFilters = {
    date: '2026-09-04',
    month: 8,
    year: 2026,
    startDate: '2026-09-01',
    endDate: '2026-09-04',
    dataType: 'tudo',
  };

  it('renderiza filtros do tipo diario', () => {
    render(
      <ReportFilters
        reportType="diario"
        onReportTypeChange={() => {}}
        filters={defaultFilters}
        onFilterChange={() => {}}
        onGenerate={() => {}}
        onDownload={() => {}}
        loading={false}
      />
    );

    expect(screen.getByText('Selecione o Dia')).toBeInTheDocument();
    expect(screen.getByText('Tipo de Dado')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Gerar Relatório' })).toBeInTheDocument();
  });

  it('renderiza filtros do tipo mensal e anual', () => {
    const { rerender } = render(
      <ReportFilters
        reportType="mensal"
        onReportTypeChange={() => {}}
        filters={defaultFilters}
        onFilterChange={() => {}}
        onGenerate={() => {}}
        onDownload={() => {}}
        loading={false}
      />
    );

    expect(screen.getByText('Selecione o Mês')).toBeInTheDocument();

    rerender(
      <ReportFilters
        reportType="anual"
        onReportTypeChange={() => {}}
        filters={defaultFilters}
        onFilterChange={() => {}}
        onGenerate={() => {}}
        onDownload={() => {}}
        loading={false}
      />
    );

    expect(screen.getByText('Selecione o Ano')).toBeInTheDocument();
  });

  it('renderiza filtros do tipo personalizado e dispara geracao', () => {
    const handleGenerate = vi.fn();
    const handleDownload = vi.fn();
    const handleFilterChange = vi.fn();

    render(
      <ReportFilters
        reportType="personalizado"
        onReportTypeChange={() => {}}
        filters={defaultFilters}
        onFilterChange={handleFilterChange}
        onGenerate={handleGenerate}
        onDownload={handleDownload}
        loading={false}
      />
    );

    expect(screen.getByText('Data Início')).toBeInTheDocument();
    expect(screen.getByText('Data Fim')).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: 'Gerar Relatório' }));
    expect(handleGenerate).toHaveBeenCalledTimes(1);

    fireEvent.click(screen.getByRole('button', { name: /Baixar Relatório/i }));
    expect(handleDownload).toHaveBeenCalledTimes(1);
  });
});
