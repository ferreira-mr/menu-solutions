import React from 'react';
import { render, screen } from '@testing-library/react';
import ReportPreview from './ReportPreview';

describe('ReportPreview', () => {
  it('exibe estado de carregamento quando loading é true', () => {
    render(<ReportPreview data={null} loading={true} title="Relatório" dataType="tudo" />);
    expect(screen.getByText(/Gerando visualização/i)).toBeInTheDocument();
  });

  it('exibe estado vazio quando data é nulo ou vazio', () => {
    render(
      <ReportPreview
        data={{ contagens: [], necessidades: [] }}
        loading={false}
        title="Relatório"
        dataType="tudo"
      />
    );
    expect(screen.getByText(/Nenhum dado encontrado/i)).toBeInTheDocument();
  });

  it('renderiza tabelas de contagens e necessidades especiais agrupadas', () => {
    const data = {
      contagens: [
        {
          id: 1,
          data_contagem: '2026-09-04',
          qtd_contagem: 35,
          turmas_id: 1,
          turma: {
            nome_turma: '1º A',
            categoria: { nome_categoria: 'Ensino Médio' },
          },
        },
      ],
      necessidades: [
        {
          id: 10,
          data_hora_contagem: '2026-09-04T08:30:00Z',
          aluno: {
            nome: 'Carlos Especial',
            rm: '12345',
            necessidade: 'Cadeirante',
          },
        },
      ],
    };

    render(
      <ReportPreview
        data={data}
        loading={false}
        title="Relatório Diário Completo"
        dataType="tudo"
      />
    );

    expect(screen.getByText('1º A')).toBeInTheDocument();
    expect(screen.getByText('Ensino Médio')).toBeInTheDocument();
    expect(screen.getByText('Carlos Especial')).toBeInTheDocument();
    expect(screen.getByText('Cadeirante')).toBeInTheDocument();
    expect(screen.getByText('Relatório Diário Completo')).toBeInTheDocument();
  });

  it('exibe totais separados e não soma a revisão antiga no relatório', () => {
    const data = {
      contagens: [
        {
          id: 1,
          data_contagem: '2026-09-04',
          hora_contagem: '07:10:00',
          qtd_contagem: 10,
          turmas_id: 1,
          turma: { nome_turma: '7º A', categoria: { nome_categoria: 'Regular', inclui_total_regular: true } },
        },
        {
          id: 2,
          data_contagem: '2026-09-04',
          hora_contagem: '07:15:00',
          qtd_contagem: 28,
          turmas_id: 1,
          turma: { nome_turma: '7º A', categoria: { nome_categoria: 'Regular', inclui_total_regular: true } },
        },
        {
          id: 3,
          data_contagem: '2026-09-04',
          hora_contagem: '07:20:00',
          qtd_contagem: 15,
          turmas_id: 2,
          turma: { nome_turma: 'Robótica', categoria: { nome_categoria: 'Outros', inclui_total_regular: false } },
        },
      ],
      necessidades: [],
    };

    render(<ReportPreview data={data} loading={false} title="Relatório" dataType="contagens" />);

    const totals = screen.getByLabelText('Totais de contagens');
    expect(totals).toHaveTextContent('Total Regular:28');
    expect(totals).toHaveTextContent('Total Outros:15');
    expect(totals).toHaveTextContent('Total Combinado:43');
    expect(screen.getAllByText('7º A')).toHaveLength(1);
  });
});
