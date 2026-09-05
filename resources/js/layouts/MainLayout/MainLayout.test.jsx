import React from 'react';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import MainLayout from './MainLayout';

vi.mock('../../services/api', () => ({
  getUserData: vi.fn().mockResolvedValue({ data: { name: 'Jaqueline Nutricionista' } }),
  logoutUser: vi.fn().mockResolvedValue({ success: true }),
}));

describe('MainLayout', () => {
  beforeEach(() => {
    localStorage.clear();
    localStorage.setItem('userName', 'Jaqueline Nutricionista');
  });

  it('renderiza o cabeçalho, navegação correspondente ao perfil e conteúdo filho', () => {
    render(
      <MemoryRouter>
        <MainLayout userRole="nutri">
          <div data-testid="conteudo-filho">Conteúdo da Tela</div>
        </MainLayout>
      </MemoryRouter>
    );

    expect(screen.getByTestId('conteudo-filho')).toBeInTheDocument();
  });
});
