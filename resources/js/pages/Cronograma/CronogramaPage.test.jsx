import React from 'react';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import CronogramaPage from './CronogramaPage';
import * as api from '../../services/api';
import Swal from 'sweetalert2/dist/sweetalert2.all.min.js';

vi.mock('../../services/api', () => ({
  getCronograma: vi.fn(),
  getNecessidades: vi.fn(),
  getNecessidadeComAlunos: vi.fn(),
  agendarRelacaoNosDias: vi.fn(),
  removerAgendamentoDoDia: vi.fn(),
}));

vi.mock('sweetalert2/dist/sweetalert2.all.min.js', () => ({
  default: {
    fire: vi.fn().mockResolvedValue({ isConfirmed: true }),
    showLoading: vi.fn(),
    close: vi.fn(),
  },
}));

describe('CronogramaPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    Swal.fire.mockResolvedValue({ isConfirmed: true });

    api.getNecessidades.mockResolvedValue({
      data: [
        { id: 1, necessidade: 'Cadeirante' },
        { id: 2, necessidade: 'Autismo' },
      ],
    });
    api.getNecessidadeComAlunos.mockImplementation((id) => {
      if (id === 1) {
        return Promise.resolve({
          id: 1,
          necessidade: 'Cadeirante',
          alunos: [{ id: 10, nome: 'Pedro Aluno', pivot: { id: 99 } }],
        });
      }
      return Promise.resolve({
        id: 2,
        necessidade: 'Autismo',
        alunos: [{ id: 20, nome: 'Lucas Aluno', pivot: { id: 100 } }],
      });
    });
    api.getCronograma.mockResolvedValue({
      data: [
        {
          id: 1,
          dia: 'Segunda',
          alunos: [
            { id: 10, necessidade_relacionada: { id: 1 } },
          ],
        },
      ],
    });
    api.removerAgendamentoDoDia.mockResolvedValue({});
  });

  it('renderiza o cronograma semanal e os alunos alocados por dia', async () => {
    render(
      <MemoryRouter>
        <CronogramaPage />
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getByText(/segunda/i)).toBeInTheDocument();
      expect(screen.getAllByText(/Pedro Aluno/).length).toBeGreaterThan(0);
    });
  });

  it('filtra alunos disponíveis pela necessidade selecionada', async () => {
    render(
      <MemoryRouter>
        <CronogramaPage />
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getByText(/Todas as Necessidades/i)).toBeInTheDocument();
    });

    const select = screen.getByRole('combobox');
    fireEvent.change(select, { target: { value: '2' } });

    await waitFor(() => {
      expect(screen.getByText(/Lucas Aluno - Autismo/i)).toBeInTheDocument();
    });
  });

  it('remove aluno do dia ao clicar no botão de remoção', async () => {
    render(
      <MemoryRouter>
        <CronogramaPage />
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getByTitle('Remover')).toBeInTheDocument();
    });

    fireEvent.click(screen.getByTitle('Remover'));

    await waitFor(() => {
      expect(Swal.fire).toHaveBeenCalledWith(
        expect.objectContaining({ title: 'Tem certeza?' })
      );
      expect(api.removerAgendamentoDoDia).toHaveBeenCalledWith(99, 1);
    });
  });
});
