import React from 'react';
import { render, fireEvent } from '@testing-library/react';
import ProducaoFilterPanel from './ProducaoFilterPanel';

const pdfMocks = vi.hoisted(() => ({
  JsPDF: vi.fn(),
  autoTable: vi.fn(),
}));

vi.mock('jspdf', () => ({ jsPDF: pdfMocks.JsPDF }));
vi.mock('jspdf-autotable', () => ({ default: pdfMocks.autoTable }));

describe('ProducaoFilterPanel', () => {
  it('preserva texto adversarial como dado de tabela na exportação', () => {
    const pdf = {
      internal: {
        pageSize: { getWidth: () => 210, getHeight: () => 297 },
        getNumberOfPages: () => 1,
      },
      setFontSize: vi.fn(),
      setTextColor: vi.fn(),
      setFont: vi.fn(),
      text: vi.fn(),
      addImage: vi.fn(),
      setDrawColor: vi.fn(),
      setLineWidth: vi.fn(),
      line: vi.fn(),
      save: vi.fn(),
    };
    pdfMocks.JsPDF.mockReturnValue(pdf);

    const filters = { startDate: '2026-09-07', endDate: '2026-09-07', searchTerm: '' };
    const nomeAdversarial = '<img src=x onerror="window.__xssMarker = true"> Arroz & Ação';
    const { getByRole } = render(
      <ProducaoFilterPanel
        filters={filters}
        onFilterChange={vi.fn()}
        onGenerate={vi.fn()}
        loading={false}
        reportData={[{
          nome_alimento: nomeAdversarial,
          data_alimento: '2026-09-07',
          quantidade_alimento: '10.00',
          medida_alimento: 'kg',
          pessoas_alimento: 20,
          sobra_limpa_alimento: '1.00',
          desperdicio_alimento: '0.20',
        }]}
        logo="logo"
        isReportMode
      />
    );

    fireEvent.click(getByRole('button', { name: /Baixar PDF/i }));

    expect(pdfMocks.autoTable).toHaveBeenCalledWith(pdf, expect.objectContaining({
      body: [[nomeAdversarial, '07/09/2026', '10.00', 'kg', 20, '1.00', '0.20']],
    }));
    expect(pdfMocks.JsPDF).toHaveBeenCalledTimes(1);
    expect(window.__xssMarker).toBeUndefined();
  });
});
