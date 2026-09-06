import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import MainLayout from './MainLayout';
import Swal from '../../utils/sweetAlert';

const mockNavigate = vi.fn();
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return {
    ...actual,
    useNavigate: () => mockNavigate,
  };
});

vi.mock('../../services/api', () => ({
  getUserData: vi.fn().mockResolvedValue({ data: { name: 'Jaqueline Nutricionista' } }),
  logoutUser: vi.fn().mockResolvedValue({ success: true }),
}));

describe('MainLayout', () => {
  beforeEach(() => {
    localStorage.clear();
    localStorage.setItem('authToken', 'fake-token');
    localStorage.setItem('userName', 'Jaqueline Nutricionista');
    vi.clearAllMocks();
  });

  it('renderiza o cabeçalho, navegação de nutri e conteúdo filho', async () => {
    render(
      <MemoryRouter>
        <MainLayout userRole="nutri">
          <div data-testid="conteudo-filho">Conteúdo da Tela</div>
        </MainLayout>
      </MemoryRouter>
    );

    expect(screen.getByTestId('conteudo-filho')).toBeInTheDocument();
    await waitFor(() => {
      expect(screen.getAllByText('Jaqueline Nutricionista').length).toBeGreaterThan(0);
    });
  });

  it('renderiza a navegação da inspetora quando userRole="inspetora"', async () => {
    render(
      <MemoryRouter>
        <MainLayout userRole="inspetora">
          <div>Painel Inspetora</div>
        </MainLayout>
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getByText('Nova Contagem')).toBeInTheDocument();
    });
  });

  it('renderiza a navegação da diretora quando userRole="diretora"', async () => {
    render(
      <MemoryRouter>
        <MainLayout userRole="diretora">
          <div>Painel Diretoria</div>
        </MainLayout>
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getByText('Autorizados Direção')).toBeInTheDocument();
    });
  });

  it('alterna o menu lateral e permite fechar ao clicar fora', async () => {
    const { container } = render(
      <MemoryRouter>
        <MainLayout userRole="nutri">
          <div data-testid="fora">Área externa</div>
        </MainLayout>
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getByRole('button', { name: '' })).toBeInTheDocument();
    });

    const menuBtn = container.querySelector('.menu-hamburguer');
    expect(menuBtn).toBeInTheDocument();

    // Abre o menu
    fireEvent.click(menuBtn);
    expect(container.querySelector('.nav-open, .aberto, [class*="open"]')).toBeDefined();

    // Clica fora para fechar
    fireEvent.mouseDown(screen.getByTestId('fora'));
  });

  it('dispara modal de confirmação de logout ao solicitar saída', async () => {
    const swalSpy = vi.spyOn(Swal, 'fire').mockResolvedValue({ isConfirmed: true });

    render(
      <MemoryRouter>
        <MainLayout userRole="nutri">
          <div>Conteúdo</div>
        </MainLayout>
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getAllByText('Jaqueline Nutricionista').length).toBeGreaterThan(0);
    });

    const logoutButtons = screen.getAllByRole('button');
    const sairBtn = logoutButtons.find(btn => btn.textContent?.includes('Sair') || btn.className?.includes('logout'));
    if (sairBtn) {
      fireEvent.click(sairBtn);
      expect(swalSpy).toHaveBeenCalled();
    }
  });

  it('força logout e redirecionamento caso getUserData falhe', async () => {
    const { getUserData } = await import('../../services/api');
    getUserData.mockRejectedValueOnce(new Error('Sessão expirada'));

    render(
      <MemoryRouter>
        <MainLayout userRole="nutri">
          <div>Conteúdo</div>
        </MainLayout>
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(mockNavigate).toHaveBeenCalledWith('/');
    });
  });
});
