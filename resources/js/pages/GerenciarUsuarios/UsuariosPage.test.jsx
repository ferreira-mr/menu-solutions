import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
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
      value: { name: 'Novo User', nif: '99999999999', nivel_user: '1', email: 'example@gmail.com' },
    });
    api.getUsers.mockResolvedValue({
      data: [
        { id: 1, name: 'Laís Inspetora', nif: '11111111111', nivel_user: 1 },
        { id: 2, name: 'Jaqueline Nutricionista', nif: '22222222222', nivel_user: 2 },
        { id: 3, name: 'Dra. Maria Diretora', nif: '33333333333', nivel_user: 3 },
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
    addBtn.click();

    await waitFor(() => {
      expect(api.addUser).toHaveBeenCalledWith({
        name: 'Novo User',
        nif: '99999999999',
        nivel_user: '1',
        email: 'example@gmail.com',
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
    deleteButtons[0].click();

    await waitFor(() => {
      expect(api.deleteUser).toHaveBeenCalledWith(1);
    });
  });
});
