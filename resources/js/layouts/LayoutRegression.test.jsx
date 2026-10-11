import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import Header from '../components/common/Header/Header';
import Footer from '../components/common/Footer/Footer';
import InicioPage from '../pages/Inicio/InicioPage';
import ProfilePage from '../pages/ProfilePage/ProfilePage';
import { safePaginatorLabel } from '../utils/safeDom';

import * as api from '../services/api';

const mockNavigate = vi.fn();
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return {
    ...actual,
    useNavigate: () => mockNavigate,
  };
});

vi.mock('../services/api', () => ({
  getUserData: vi.fn(),
  updateUserData: vi.fn(),
  changePassword: vi.fn(),
}));

beforeEach(() => {
  vi.clearAllMocks();
  api.getUserData.mockResolvedValue({
    data: {
      id: 1,
      name: 'Diretora Teste',
      nif: 'diretora',
      nivel_user: 3,
    },
  });
  api.updateUserData.mockResolvedValue({ success: true });
  api.changePassword.mockResolvedValue({ success: true });
});

describe('Regressão de UI - Header e Botão Voltar', () => {

  it('NÃO exibe o botão voltar na rota inicial da inspetora (/inspetora/inicio)', () => {
    render(
      <MemoryRouter initialEntries={['/inspetora/inicio']}>
        <Header userRole="inspetora" />
      </MemoryRouter>
    );
    expect(screen.queryByTitle('Voltar')).not.toBeInTheDocument();
  });

  it('NÃO exibe o botão voltar no dashboard da nutri (/nutri/dashboard) nem em /nutri/inicio', () => {
    const { unmount } = render(
      <MemoryRouter initialEntries={['/nutri/dashboard']}>
        <Header userRole="nutri" />
      </MemoryRouter>
    );
    expect(screen.queryByTitle('Voltar')).not.toBeInTheDocument();
    unmount();

    render(
      <MemoryRouter initialEntries={['/nutri/inicio']}>
        <Header userRole="nutri" />
      </MemoryRouter>
    );
    expect(screen.queryByTitle('Voltar')).not.toBeInTheDocument();
  });

  it('NÃO exibe o botão voltar na rota inicial da diretora (/diretora/inicio)', () => {
    render(
      <MemoryRouter initialEntries={['/diretora/inicio']}>
        <Header userRole="diretora" />
      </MemoryRouter>
    );
    expect(screen.queryByTitle('Voltar')).not.toBeInTheDocument();
  });

  it('EXIBE o botão voltar em rotas internas secundárias (/nova-contagem, /nutri/controle-producao)', () => {
    const { unmount } = render(
      <MemoryRouter initialEntries={['/nova-contagem']}>
        <Header userRole="inspetora" />
      </MemoryRouter>
    );
    expect(screen.getByTitle('Voltar')).toBeInTheDocument();
    unmount();

    render(
      <MemoryRouter initialEntries={['/nutri/controle-producao']}>
        <Header userRole="nutri" />
      </MemoryRouter>
    );
    expect(screen.getByTitle('Voltar')).toBeInTheDocument();
  });

  it('dispara onLogoClick ao clicar na logo do cabeçalho', () => {
    const onLogoClick = vi.fn();
    render(
      <MemoryRouter initialEntries={['/nutri/controle-producao']}>
        <Header userRole="nutri" onLogoClick={onLogoClick} />
      </MemoryRouter>
    );
    const logoImg = screen.getByAltText('Logo');
    fireEvent.click(logoImg);
    expect(onLogoClick).toHaveBeenCalledTimes(1);
  });
});

describe('Regressão de UI - Footer Institucional', () => {
  it('não deve conter links de redes pessoais (whatsapp, github pessoal, gmails pessoais)', () => {
    const { container } = render(
      <MemoryRouter>
        <Footer />
      </MemoryRouter>
    );
    expect(container.querySelector('a[href*="wa.me"]')).toBeNull();
    expect(container.querySelector('a[href*="github.com/AndreSantanas"]')).toBeNull();
    expect(container.querySelector('a[href*="codesolutionsteam@gmail.com"]')).toBeNull();
    expect(container.querySelector('a[href*="Portif-lio"]')).toBeNull();
  });

  it('mantém termos de uso, política de privacidade e identidade Menu Solutions / SESI', () => {
    render(
      <MemoryRouter>
        <Footer />
      </MemoryRouter>
    );
    expect(screen.getByText(/Termos de Uso/i)).toBeInTheDocument();
    expect(screen.getByText(/Política de Privacidade/i)).toBeInTheDocument();
    expect(screen.getAllByText(/Menu Solutions/i).length).toBeGreaterThan(0);
  });
});

describe('Regressão de UI - Nomenclatura e Domínio', () => {
  it('InicioPage de nutri diferencia turmas de dietas especiais (NES)', () => {
    render(
      <MemoryRouter>
        <InicioPage userRole="nutri" />
      </MemoryRouter>
    );
    expect(screen.getByText(/Turmas e Categorias/i)).toBeInTheDocument();
    // Não pode ter dois botões com texto duplicado "Categorias"; deve indicar Dietas/NES
    const botoes = screen.getAllByRole('button');
    const textosBotoes = botoes.map(b => b.textContent.trim());
    const contagemCategoriasExatas = textosBotoes.filter(t => t === 'Categorias').length;
    expect(contagemCategoriasExatas).toBe(0);
    expect(textosBotoes.some(t => t.includes('Dietas') || t.includes('NES') || t.includes('Necessidades'))).toBe(true);
  });

  it('safePaginatorLabel traduz paginação para português', () => {
    expect(safePaginatorLabel('&laquo; Previous')).toBe('« Anterior');
    expect(safePaginatorLabel('Next &raquo;')).toBe('Próximo »');
    expect(safePaginatorLabel('1')).toBe('1');
  });
});

describe('Regressão de UI - ProfilePage', () => {
  it('não carrega imagem de serviço externo ui-avatars.com', async () => {
    const { container } = render(
      <MemoryRouter>
        <ProfilePage />
      </MemoryRouter>
    );
    // Aguarda carregar
    const avatarImg = await screen.findByAltText('Avatar');
    expect(avatarImg.getAttribute('src')).not.toContain('ui-avatars.com');
  });

  it('exibe o rótulo Diretoria ou Diretora para nivel_user 3', async () => {
    render(
      <MemoryRouter>
        <ProfilePage />
      </MemoryRouter>
    );
    const roleBadge = await screen.findByText(/^Diretora$/i);
    expect(roleBadge).toBeInTheDocument();
  });
});
