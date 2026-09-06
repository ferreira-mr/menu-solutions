import React from 'react';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import InicioPage from './InicioPage';

describe('InicioPage', () => {
  it('exibe atalhos operacionais para a Inspetora', () => {
    render(
      <MemoryRouter>
        <InicioPage userRole="inspetora" />
      </MemoryRouter>
    );

    expect(screen.getByText('Nova Contagem')).toBeInTheDocument();
    expect(screen.getByText('Chat')).toBeInTheDocument();
    expect(screen.getByText('Cardápio')).toBeInTheDocument();
  });

  it('exibe atalhos analíticos e de gestão para a Nutricionista', () => {
    render(
      <MemoryRouter>
        <InicioPage userRole="nutri" />
      </MemoryRouter>
    );

    expect(screen.getByText('Controle de Produção')).toBeInTheDocument();
    expect(screen.getByText('Contagem Geral')).toBeInTheDocument();
    expect(screen.getByText('Gerenciar Usuários')).toBeInTheDocument();
  });

  it('exibe atalhos gerenciais para a Diretora', () => {
    render(
      <MemoryRouter>
        <InicioPage userRole="diretora" />
      </MemoryRouter>
    );

    expect(screen.getByText('Autorizados Direção')).toBeInTheDocument();
    expect(screen.getByText('Gerenciar Usuários')).toBeInTheDocument();
    expect(screen.getByText('Contagem Geral')).toBeInTheDocument();
  });
});
