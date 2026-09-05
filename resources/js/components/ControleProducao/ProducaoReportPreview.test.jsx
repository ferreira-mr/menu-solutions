import React from 'react';
import { render, screen } from '@testing-library/react';
import ProducaoReportPreview from './ProducaoReportPreview';

describe('ProducaoReportPreview', () => {
  it('exibe estado de carregamento quando loading é true', () => {
    render(<ProducaoReportPreview data={null} loading={true} title="Relatório Teste" />);
    expect(screen.getByText(/Gerando visualização/i)).toBeInTheDocument();
  });

  it('exibe estado vazio quando não há dados', () => {
    render(<ProducaoReportPreview data={[]} loading={false} title="Relatório Teste" />);
    expect(screen.getByText(/Nenhum dado encontrado/i)).toBeInTheDocument();
  });

  it('renderiza os dados de produção agrupados por dia', () => {
    const data = [
      {
        id: 1,
        data_alimento: '2026-09-04',
        nome_alimento: 'Arroz com Frango',
        quantidade_alimento: '50.00',
        medida_alimento: 'kg',
        pessoas_alimento: 300,
        sobra_limpa_alimento: '2.50',
        desperdicio_alimento: '1.20',
      },
      {
        id: 2,
        data_alimento: '2026-09-04',
        nome_alimento: 'Salada de Alface',
        quantidade_alimento: '15.00',
        medida_alimento: 'kg',
        pessoas_alimento: 300,
        sobra_limpa_alimento: '0.50',
        desperdicio_alimento: '0.80',
      },
    ];

    render(<ProducaoReportPreview data={data} loading={false} title="Relatório Diário" />);
    expect(screen.getByText('Arroz com Frango')).toBeInTheDocument();
    expect(screen.getByText('Salada de Alface')).toBeInTheDocument();
    expect(screen.getByText('Relatório Diário')).toBeInTheDocument();
  });
});
