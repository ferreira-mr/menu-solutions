import React from 'react';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import Header from './Header/Header';
import Footer from './Footer/Footer';
import BackButton from './BackButton/BackButton';

describe('Componentes Comuns (Header, Footer, BackButton)', () => {
  it('Header renderiza logo principal e botões de cabeçalho', () => {
    render(
      <MemoryRouter>
        <Header userRole="inspetora" />
      </MemoryRouter>
    );

    expect(screen.getByAltText('Logo')).toBeInTheDocument();
    expect(screen.getByTitle('Voltar')).toBeInTheDocument();
  });

  it('Footer exibe termos de uso e privacidade', () => {
    render(
      <MemoryRouter>
        <Footer />
      </MemoryRouter>
    );

    expect(screen.getByText(/termos de uso/i)).toBeInTheDocument();
  });

  it('BackButton exibe botão com ícone de voltar', () => {
    render(
      <MemoryRouter>
        <BackButton />
      </MemoryRouter>
    );

    expect(screen.getByRole('button')).toBeInTheDocument();
  });
});
