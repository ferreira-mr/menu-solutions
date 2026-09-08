import React from 'react';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import UsuariosPage from './UsuariosPage';
import * as api from '../../services/api';
import Swal from 'sweetalert2/dist/sweetalert2.all.min.js';

vi.mock('../../services/api', () => ({
  getUsers: vi.fn(),
  addUser: vi.fn(),
  updateUser: vi.fn(),
  deleteUser: vi.fn(),
}));

vi.mock('sweetalert2/dist/sweetalert2.all.min.js', () => ({
  default: {
    fire: vi.fn(),
  },
}));

describe('UsuariosPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    Swal.fire.mockResolvedValue({
      isConfirmed: true,
      value: { name: 'Novo User', nif: '99999999999', nivel_user: 1, email: '99999999999@menusolutions.local' },
    });
    api.getUsers.mockResolvedValue({
      data: [
        { id: 1, name: 'Laís Inspetora', nif: '11111111111', nivel_user: 1, email: 'lais@example.test' },
        { id: 2, name: 'Jaqueline Nutricionista', nif: '22222222222', nivel_user: 2, email: 'jaque@example.test' },
        { id: 3, name: 'Dra. Maria Diretora', nif: '33333333333', nivel_user: 3, email: 'maria@example.test' },
      ],
      meta: { current_page: 1, last_page: 1 },
    });
  });

  it('renderiza os usuários e os rótulos de nível de acesso correspondentes', async () => {
    render(
      <MemoryRouter>
        <UsuariosPage />
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getByText('Laís Inspetora')).toBeInTheDocument();
      expect(screen.getByText('Jaqueline Nutricionista')).toBeInTheDocument();
      expect(screen.getByText('Dra. Maria Diretora')).toBeInTheDocument();
    });

    expect(screen.getByText('Inspetora')).toBeInTheDocument();
    expect(screen.getByText('Nutricionista')).toBeInTheDocument();
    expect(screen.getByText('Diretora')).toBeInTheDocument();
  });

  it('permite cadastrar um novo usuário ao clicar em Novo Usuário', async () => {
    api.addUser.mockResolvedValue({ id: 4, name: 'Novo User' });

    render(
      <MemoryRouter>
        <UsuariosPage />
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getByText('Laís Inspetora')).toBeInTheDocument();
    });

    const addBtn = screen.getByText(/Novo Usuário/i);
    fireEvent.click(addBtn);

    await waitFor(() => {
      expect(api.addUser).toHaveBeenCalledWith({
        name: 'Novo User',
        nif: '99999999999',
        nivel_user: 1,
        email: '99999999999@menusolutions.local',
      });
    });
  });

  it('permite editar um usuário existente', async () => {
    api.updateUser.mockResolvedValue({ id: 1, name: 'Laís Editada' });
    Swal.fire.mockResolvedValueOnce({
      isConfirmed: true,
      value: { name: 'Laís Editada', nif: '11111111111', nivel_user: 1, email: 'lais@example.test' },
    });

    render(
      <MemoryRouter>
        <UsuariosPage />
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getByText('Laís Inspetora')).toBeInTheDocument();
    });

    const editButtons = screen.getAllByTitle('Editar');
    fireEvent.click(editButtons[0]);

    await waitFor(() => {
      expect(api.updateUser).toHaveBeenCalledWith(1, expect.objectContaining({
        name: 'Laís Editada',
      }));
    });
  });

  it('permite resetar a senha de um operador', async () => {
    api.updateUser.mockResolvedValue({ id: 1, success: true });
    Swal.fire.mockResolvedValueOnce({
      isConfirmed: true,
      value: 'novasenha123',
    });

    render(
      <MemoryRouter>
        <UsuariosPage />
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getByText('Laís Inspetora')).toBeInTheDocument();
    });

    const keyButtons = screen.getAllByTitle('Resetar Senha');
    fireEvent.click(keyButtons[0]);

    await waitFor(() => {
      expect(api.updateUser).toHaveBeenCalledWith(1, {
        password: 'novasenha123',
        password_confirmation: 'novasenha123',
        email: 'lais@example.test',
      });
    });
  });

  it('permite excluir um usuário', async () => {
    api.deleteUser.mockResolvedValue({ success: true });

    render(
      <MemoryRouter>
        <UsuariosPage />
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getByText('Laís Inspetora')).toBeInTheDocument();
    });

    const deleteButtons = screen.getAllByTitle('Excluir');
    fireEvent.click(deleteButtons[0]);

    await waitFor(() => {
      expect(api.deleteUser).toHaveBeenCalledWith(1);
    });
  });

  it('trata erro de carregamento graciosamente', async () => {
    api.getUsers.mockRejectedValueOnce(new Error('Falha de rede'));

    render(
      <MemoryRouter>
        <UsuariosPage />
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(Swal.fire).toHaveBeenCalledWith('Erro', 'Não foi possível carregar os usuários', 'error');
    });
  });

  it('mantém nome adversarial literal ao abrir edição, sem montar HTML executável', async () => {
    const nomeAdversarial = '"><img src=x onerror="window.__xssMarker = true"> <Equipe> & "Ação"';
    const modalCalls = [];
    api.getUsers.mockResolvedValueOnce({
      data: [
        { id: 1, name: nomeAdversarial, nif: '11111111111', nivel_user: 1, email: 'lais@example.test' },
      ],
      meta: { current_page: 1, last_page: 1 },
    });
    Swal.fire.mockImplementation((options) => {
      modalCalls.push(options);
      return Promise.resolve({ isConfirmed: false });
    });

    render(
      <MemoryRouter>
        <UsuariosPage />
      </MemoryRouter>
    );

    await waitFor(() => expect(screen.getByText(nomeAdversarial)).toBeInTheDocument());
    fireEvent.click(screen.getByTitle('Editar'));

    await waitFor(() => expect(modalCalls).toHaveLength(1));
    const modal = modalCalls[0];
    expect(modal.titleText).toBe('Editar Usuário');
    expect(modal.html).toBeInstanceOf(HTMLElement);

    const nameInput = modal.html.querySelector('#swal-name');
    expect(nameInput).toHaveValue(nomeAdversarial);
    expect(modal.html.querySelector('[onerror], [onfocus], script')).not.toBeInTheDocument();
    expect(window.__xssMarker).toBeUndefined();
  });
});
