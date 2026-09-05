import React from 'react';
import { render, screen } from '@testing-library/react';
import ProducaoManagementView from './ProducaoManagementView';
import ProducaoFilterPanel from './ProducaoFilterPanel';

describe('Componentes de Controle de Produção', () => {
  it('ProducaoManagementView renderiza tabela de itens', () => {
    const data = [
      {
        id: 1,
        nome_alimento: 'Feijoada',
        data_alimento: '2026-09-04',
        quantidade_alimento: '35.00',
        medida_alimento: 'kg',
        pessoas_alimento: 250,
        sobra_limpa_alimento: '2.00',
        desperdicio_alimento: '1.20',
      },
    ];

    render(
      <ProducaoManagementView
        initialData={data}
        isLoading={false}
        onDataChange={() => {}}
      />
    );

    expect(screen.getByText('Feijoada')).toBeInTheDocument();
  });

  it('ProducaoFilterPanel renderiza campos de filtro de relatório', () => {
    const filters = {
      startDate: '2026-09-01',
      endDate: '2026-09-04',
      searchTerm: '',
    };

    render(
      <ProducaoFilterPanel
        filters={filters}
        onFilterChange={() => {}}
        onGenerateReport={() => {}}
        onResetFilters={() => {}}
      />
    );

    expect(screen.getByText(/filtros de relatório/i)).toBeInTheDocument();
    expect(screen.getByText('Data Início')).toBeInTheDocument();
  });
});

