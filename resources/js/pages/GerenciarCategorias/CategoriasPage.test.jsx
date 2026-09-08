import React from 'react';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import CategoriasPage from './CategoriasPage';
import * as api from '../../services/api';

import Swal from 'sweetalert2/dist/sweetalert2.all.min.js';

vi.mock('../../services/api', () => ({
  getTodasCategorias: vi.fn(),
  getTodasTurmas: vi.fn(),
  addCategoria: vi.fn(),
  updateCategoria: vi.fn(),
  deleteCategoria: vi.fn(),
  addTurma: vi.fn(),
  updateTurma: vi.fn(),
  deleteTurma: vi.fn(),
}));

vi.mock('sweetalert2/dist/sweetalert2.all.min.js', () => ({
  default: {
    fire: vi.fn(),
    showLoading: vi.fn(),
  },
}));

describe('CategoriasPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    Swal.fire.mockResolvedValue({ isConfirmed: true, value: 'Nova Categoria Teste' });
    api.getTodasCategorias.mockResolvedValue([
        { id: 1, nome_categoria: 'Fundamental 1' },
        { id: 2, nome_categoria: 'Ensino Médio' },
    ]);
    api.getTodasTurmas.mockResolvedValue([
        { id: 10, nome_turma: '5º Ano A', categorias_id: 1 },
        { id: 20, nome_turma: '3º EM B', categorias_id: 2 },
    ]);
  });

  it('carrega e lista categorias e turmas cadastradas', async () => {
    render(
      <MemoryRouter>
        <CategoriasPage />
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getByText('Fundamental 1')).toBeInTheDocument();
      expect(screen.getByText('Ensino Médio')).toBeInTheDocument();
      expect(screen.getByText('5º Ano A')).toBeInTheDocument();
      expect(screen.getByText('3º EM B')).toBeInTheDocument();
    });
  });

  it('filtra turmas ao selecionar uma categoria específica', async () => {
    render(
      <MemoryRouter>
        <CategoriasPage />
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getByText('5º Ano A')).toBeInTheDocument();
      expect(screen.getByText('3º EM B')).toBeInTheDocument();
    });

    // Clica na categoria Fundamental 1
    fireEvent.click(screen.getByText('Fundamental 1'));

    await waitFor(() => {
      expect(screen.getByText('5º Ano A')).toBeInTheDocument();
      expect(screen.queryByText('3º EM B')).not.toBeInTheDocument();
    });
  });

  it('permite adicionar nova categoria', async () => {
    api.addCategoria.mockResolvedValue({ id: 3, nome_categoria: 'Infantil' });

    render(
      <MemoryRouter>
        <CategoriasPage />
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getByText('Fundamental 1')).toBeInTheDocument();
    });

    const addBtn = screen.getByTitle('Criar Nova Categoria');
    fireEvent.click(addBtn);

    await waitFor(() => {
      expect(api.addCategoria).toHaveBeenCalledWith('Nova Categoria Teste');
    });
  });

  it('permite adicionar nova turma', async () => {
    Swal.fire.mockResolvedValue({
      value: { nome_turma: '6º Ano C', categorias_id: '1' },
      isConfirmed: true,
    });
    api.addTurma.mockResolvedValue({ id: 30, nome_turma: '6º Ano C', categorias_id: 1 });

    render(
      <MemoryRouter>
        <CategoriasPage />
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getByText('5º Ano A')).toBeInTheDocument();
    });

    const addTurmaBtn = screen.getByTitle('Criar Nova Turma');
    fireEvent.click(addTurmaBtn);

    await waitFor(() => {
      expect(api.addTurma).toHaveBeenCalledWith({ nome_turma: '6º Ano C', categorias_id: '1' });
    });
  });

  it('permite editar turma existente', async () => {
    Swal.fire.mockResolvedValue({
      value: { nome_turma: '5º Ano A Alterado', categorias_id: '1' },
      isConfirmed: true,
    });
    api.updateTurma.mockResolvedValue({});

    const { container } = render(
      <MemoryRouter>
        <CategoriasPage />
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getByText('5º Ano A')).toBeInTheDocument();
    });

    const editBtn = container.querySelector('.turmas-table .edit-button');
    fireEvent.click(editBtn);

    await waitFor(() => {
      expect(api.updateTurma).toHaveBeenCalledWith(10, {
        nome_turma: '5º Ano A Alterado',
        categorias_id: '1',
      });
    });
  });

  it('permite excluir uma turma', async () => {
    Swal.fire.mockResolvedValue({ isConfirmed: true });
    api.deleteTurma.mockResolvedValue({});

    render(
      <MemoryRouter>
        <CategoriasPage />
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getByText('5º Ano A')).toBeInTheDocument();
    });

    const deleteBtns = screen.getAllByTitle('Deletar');
    fireEvent.click(deleteBtns[0]);

    await waitFor(() => {
      expect(api.deleteTurma).toHaveBeenCalledWith(10);
    });
  });
});
