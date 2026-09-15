import React from 'react';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import Header from './Header/Header';
import Footer from './Footer/Footer';
import BackButton from './BackButton/BackButton';
import LoadingSpinner from './LoadingSpinner/LoadingSpinner';
import EmptyState from './EmptyState/EmptyState';
import ErrorState from './ErrorState/ErrorState';

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

describe('LoadingSpinner', () => {
  it('renders with default message', () => {
    render(<LoadingSpinner />);
    expect(screen.getByText('Carregando...')).toBeInTheDocument();
  });

  it('renders with custom message', () => {
    render(<LoadingSpinner message="Carregando turmas..." />);
    expect(screen.getByText('Carregando turmas...')).toBeInTheDocument();
  });

  it('has role status for accessibility', () => {
    render(<LoadingSpinner />);
    expect(screen.getByRole('status')).toBeInTheDocument();
  });
});

describe('EmptyState', () => {
  it('renders with default title', () => {
    render(<EmptyState />);
    expect(screen.getByText('Nenhum item encontrado')).toBeInTheDocument();
  });

  it('renders with custom props', () => {
    render(<EmptyState title="Sem dados" description="Nenhum registro encontrado." />);
    expect(screen.getByText('Sem dados')).toBeInTheDocument();
    expect(screen.getByText('Nenhum registro encontrado.')).toBeInTheDocument();
  });
});

describe('ErrorState', () => {
  it('renders error message', () => {
    render(<ErrorState />);
    expect(screen.getByText('Não foi possível carregar os dados.')).toBeInTheDocument();
  });

  it('shows retry button when onRetry provided', () => {
    const onRetry = vi.fn();
    render(<ErrorState onRetry={onRetry} />);
    const btn = screen.getByText(/Tentar novamente/i);
    expect(btn).toBeInTheDocument();
  });

  it('has role alert for accessibility', () => {
    render(<ErrorState />);
    expect(screen.getByRole('alert')).toBeInTheDocument();
  });
});
