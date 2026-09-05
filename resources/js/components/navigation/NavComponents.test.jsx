import React from 'react';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import NutriNav from './NutriNav/NutriNav';
import InspetoraNav from './InspetoraNav/InspetoraNav';
import DiretoraNav from './DiretoraNav/DiretoraNav';

describe('Componentes de Navegação por Perfil', () => {
  it('NutriNav exibe links operacionais e analíticos', () => {
    render(
      <MemoryRouter>
        <NutriNav />
      </MemoryRouter>
    );

    expect(screen.getByText(/início/i)).toBeInTheDocument();
    expect(screen.getByText(/controle de produção/i)).toBeInTheDocument();
    expect(screen.getByText(/contagem geral/i)).toBeInTheDocument();
  });

  it('InspetoraNav exibe links para Início, Contagem e Chat', () => {
    render(
      <MemoryRouter>
        <InspetoraNav />
      </MemoryRouter>
    );

    expect(screen.getByText(/início/i)).toBeInTheDocument();
    expect(screen.getByText(/contagem/i)).toBeInTheDocument();
    expect(screen.getByText(/chat/i)).toBeInTheDocument();
  });

  it('DiretoraNav exibe links de acompanhamento da Direção', () => {
    render(
      <MemoryRouter>
        <DiretoraNav />
      </MemoryRouter>
    );

    expect(screen.getByText(/início/i)).toBeInTheDocument();
    expect(screen.getByText(/controle de produção/i)).toBeInTheDocument();
    expect(screen.getByText(/autorizados direção/i)).toBeInTheDocument();
  });
});
