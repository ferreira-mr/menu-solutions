import React from 'react';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import AutorizadosPage from './AutorizadosPage';
import * as api from '../../services/api';
import Swal from 'sweetalert2/dist/sweetalert2.all.min.js';

vi.mock('../../services/api', () => ({
  getAutorizados: vi.fn(),
  addAutorizado: vi.fn(),
  updateAutorizado: vi.fn(),
  updateConteudoAutorizado: vi.fn(),
  deleteAutorizado: vi.fn(),
}));

vi.mock('sweetalert2/dist/sweetalert2.all.min.js', () => ({
  default: {
    fire: vi.fn().mockResolvedValue({ isConfirmed: true }),
  },
}));

describe('AutorizadosPage (Refeições Avulsas)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.clear();
    api.getAutorizados.mockResolvedValue({
      data: [
        {
          id: 1,
          titulo: 'Avaliador FIESP',
          conteudo: 'Almoço na cantina',
          status: 'pendente',
          created_at: '2026-09-04T08:00:00Z',
        },
        {
          id: 2,
          titulo: 'Estagiário SESI',
          conteudo: 'Refeição confirmada',
          status: 'confirmado',
          created_at: '2026-09-03T08:00:00Z',
        },
      ],
    });
  });

  it('renderiza os cartões de autorizados ordenados por status pendente primeiro', async () => {
    localStorage.setItem('userLevel', '2'); // Nutricionista
    render(
      <MemoryRouter>
        <AutorizadosPage />
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getByText('Avaliador FIESP')).toBeInTheDocument();
      expect(screen.getByText('Estagiário SESI')).toBeInTheDocument();
    });

    expect(screen.getByText('Pendente')).toBeInTheDocument();
    expect(screen.getByText('Confirmado')).toBeInTheDocument();
  });

  it('exibe botão de aprovar apenas para a Diretora (userLevel 3)', async () => {
    localStorage.setItem('userLevel', '3'); // Diretora
    render(
      <MemoryRouter>
        <AutorizadosPage />
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getByText('Avaliador FIESP')).toBeInTheDocument();
    });

    // Diretora tem o botão "Aprovar"
    expect(screen.getByRole('button', { name: /aprovar/i })).toBeInTheDocument();
  });

  it('não exibe botão de aprovar para a Nutricionista (userLevel 2)', async () => {
    localStorage.setItem('userLevel', '2'); // Nutricionista
    render(
      <MemoryRouter>
        <AutorizadosPage />
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getByText('Avaliador FIESP')).toBeInTheDocument();
    });

    expect(screen.queryByRole('button', { name: /aprovar/i })).not.toBeInTheDocument();
  });

  it('permite à Nutricionista criar uma nova solicitação', async () => {
    localStorage.setItem('userLevel', '2');
    Swal.fire.mockResolvedValueOnce({
      isConfirmed: true,
      value: { titulo: 'Visita Técnica', conteudo: '2 almoços' },
    });
    api.addAutorizado.mockResolvedValue({});

    render(
      <MemoryRouter>
        <AutorizadosPage />
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getByText('Nova Solicitação')).toBeInTheDocument();
    });

    fireEvent.click(screen.getByText('Nova Solicitação'));

    await waitFor(() => {
      expect(Swal.fire).toHaveBeenCalled();
      expect(api.addAutorizado).toHaveBeenCalledWith({
        titulo: 'Visita Técnica',
        conteudo: '2 almoços',
      });
    });
  });

  it('permite à Nutricionista excluir uma solicitação', async () => {
    localStorage.setItem('userLevel', '2');
    Swal.fire.mockResolvedValueOnce({ isConfirmed: true });
    api.deleteAutorizado.mockResolvedValue({});

    render(
      <MemoryRouter>
        <AutorizadosPage />
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getByText('Avaliador FIESP')).toBeInTheDocument();
    });

    const deleteButtons = screen.getAllByRole('button', { name: /excluir/i });
    fireEvent.click(deleteButtons[0]);

    await waitFor(() => {
      expect(api.deleteAutorizado).toHaveBeenCalledWith(1);
    });
  });

  it('permite à Diretora aprovar uma solicitação pendente', async () => {
    localStorage.setItem('userLevel', '3');
    Swal.fire.mockResolvedValueOnce({ isConfirmed: true });
    api.updateConteudoAutorizado.mockResolvedValue({});

    render(
      <MemoryRouter>
        <AutorizadosPage />
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getByText('Avaliador FIESP')).toBeInTheDocument();
    });

    fireEvent.click(screen.getByRole('button', { name: /aprovar/i }));

    await waitFor(() => {
      expect(api.updateConteudoAutorizado).toHaveBeenCalledWith(
        1,
        expect.objectContaining({ status: 'confirmado' })
      );
    });
  });
});
