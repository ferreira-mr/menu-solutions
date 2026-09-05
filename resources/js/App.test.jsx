import React from 'react';
import { render, screen } from '@testing-library/react';
import App from './App';

vi.mock('./pages/Login/LoginPage', () => ({
  default: () => <div data-testid="login-page">Tela de Login</div>,
}));
vi.mock('./pages/Inicio/InicioPage', () => ({
  default: ({ userRole }) => <div data-testid="inicio-page">Inicio {userRole}</div>,
}));
vi.mock('./pages/DashboardNutri/DashboardNutri', () => ({
  default: () => <div data-testid="dashboard-page">Dashboard Nutri</div>,
}));
vi.mock('./layouts/MainLayout/MainLayout', () => ({
  default: ({ children }) => <div data-testid="main-layout">{children}</div>,
}));

describe('App - Roteamento e Proteção de Rotas', () => {
  beforeEach(() => {
    localStorage.clear();
    window.history.pushState({}, '', '/');
  });

  it('renderiza LoginPage quando não há token na rota raiz', () => {
    render(<App />);
    expect(screen.getByTestId('login-page')).toBeInTheDocument();
  });

  it('redireciona para /inspetora/inicio quando usuária nível 1 acessa / com sessão ativa', () => {
    localStorage.setItem('authToken', 'token-123');
    localStorage.setItem('userLevel', '1');

    render(<App />);
    expect(screen.getByTestId('inicio-page')).toHaveTextContent('inspetora');
  });

  it('redireciona para /nutri/dashboard quando nutricionista nível 2 acessa / com sessão ativa', () => {
    localStorage.setItem('authToken', 'token-123');
    localStorage.setItem('userLevel', '2');

    render(<App />);
    expect(screen.getByTestId('dashboard-page')).toBeInTheDocument();
  });

  it('redireciona rota não autenticada para o login quando sem token', () => {
    window.history.pushState({}, '', '/nutri/dashboard');
    render(<App />);
    expect(screen.getByTestId('login-page')).toBeInTheDocument();
  });

  it('bloqueia rota de nutricionista para inspetora e redireciona para login', () => {
    localStorage.setItem('authToken', 'token-123');
    localStorage.setItem('userLevel', '1'); // Inspetora
    window.history.pushState({}, '', '/nutri/dashboard');

    render(<App />);
    // requiredRole="nutri", userRole="inspetora" -> PrivateRoute redireciona para / -> PublicRoute redireciona para /inspetora/inicio
    expect(screen.getByTestId('inicio-page')).toHaveTextContent('inspetora');
  });
});
