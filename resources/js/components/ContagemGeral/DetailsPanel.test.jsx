import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { DetailsPanel } from './DetailsPanel';

describe('DetailsPanel', () => {
  it('exibe estado de carregamento quando loading é true', () => {
    render(<DetailsPanel details={null} loading={true} />);
    expect(screen.getByText(/Processando dados do dia/i)).toBeInTheDocument();
  });

  it('exibe mensagem quando nenhuma data está selecionada', () => {
    render(<DetailsPanel details={null} loading={false} />);
    expect(screen.getByText('Escolha uma data')).toBeInTheDocument();
  });

  it('renderiza contagens e permite alternar para necessidades', () => {
    const necessidadesMap = new Map();
    necessidadesMap.set('Diabético', [
      { nome: 'Pedro Silva', rm: '11223', descricao: 'Dieta sem açúcar' },
    ]);

    const details = {
      date: new Date(2026, 8, 4),
      totalGeralContagens: 120,
      contagens: [
        {
          nome_categoria: 'Ensino Médio',
          turmas: [{ nome_turma: '1º A', qtd_contagem: 40 }],
        },
      ],
      necessidades: necessidadesMap,
    };

    render(<DetailsPanel details={details} loading={false} />);

    // Aba contagens
    expect(screen.getByText('120')).toBeInTheDocument();
    expect(screen.getByText('Ensino Médio')).toBeInTheDocument();
    expect(screen.getByText('1º A')).toBeInTheDocument();

    // Alterna para necessidades
    fireEvent.click(screen.getByRole('button', { name: 'Necessidades' }));
    expect(screen.getByText('Diabético')).toBeInTheDocument();
    expect(screen.getByText('Pedro Silva')).toBeInTheDocument();
  });
});
