import React from 'react';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import PlanejamentoPage from './PlanejamentoPage';
import * as api from '../../services/api';
import Swal from 'sweetalert2/dist/sweetalert2.all.min.js';

vi.mock('../../services/api', () => ({
  getTodasNecessidades: vi.fn(),
  getTodosAlunos: vi.fn(),
  getTodasTurmas: vi.fn(),
  getTodosCronograma: vi.fn(),
  getNecessidadeComAlunos: vi.fn(),
  addNecessidade: vi.fn(),
  updateNecessidade: vi.fn(),
  deleteNecessidade: vi.fn(),
  addAluno: vi.fn(),
  updateAluno: vi.fn(),
  deleteAluno: vi.fn(),
  associarNecessidadesAoAluno: vi.fn(),
  desassociarAlunoDaNecessidade: vi.fn(),
  agendarRelacaoNosDias: vi.fn(),
  removerAgendamentoDoDia: vi.fn(),
  uploadAlunoFoto: vi.fn(),
}));

vi.mock('sweetalert2/dist/sweetalert2.all.min.js', () => ({
  default: {
    fire: vi.fn(),
    showValidationMessage: vi.fn(),
  },
}));

describe('PlanejamentoPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    Swal.fire.mockResolvedValue({ isConfirmed: true, value: 'Nova Categoria' });

    api.getTodasNecessidades.mockResolvedValue([{ id: 1, necessidade: 'Celiaquismo' }]);
    api.getTodosAlunos.mockResolvedValue([{ id: 10, nome: 'Matheus', rm: 'RM123', turmas_id: 1 }]);
    api.getTodasTurmas.mockResolvedValue([{ id: 1, nome_turma: '8º Ano' }]);
    api.getTodosCronograma.mockResolvedValue([{ id: 1, dia: 'Segunda', alunos: [] }]);
    api.getNecessidadeComAlunos.mockResolvedValue({
      id: 1,
      necessidade: 'Celiaquismo',
      alunos: [
        { id: 10, nome: 'Matheus', rm: 'RM123', turmas_id: 1, alunos_has_necessidades_id: 99 },
      ],
    });
    api.addNecessidade.mockResolvedValue({});
    api.associarNecessidadesAoAluno.mockResolvedValue({});
    api.desassociarAlunoDaNecessidade.mockResolvedValue({});
    api.deleteAluno.mockResolvedValue({});
    api.agendarRelacaoNosDias.mockResolvedValue({});
  });

  it('carrega alunos, turmas e necessidades especiais cadastradas', async () => {
    render(
      <MemoryRouter>
        <PlanejamentoPage />
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getByText('Celiaquismo')).toBeInTheDocument();
      expect(screen.getByText('Matheus')).toBeInTheDocument();
    });
  });

  it('permite criar uma nova categoria via modal Swal', async () => {
    Swal.fire.mockResolvedValueOnce({ value: 'Intolerância a Lactose' });

    render(
      <MemoryRouter>
        <PlanejamentoPage />
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getByText('Celiaquismo')).toBeInTheDocument();
    });

    const addButtons = screen.getAllByRole('button', { name: '+' });
    fireEvent.click(addButtons[0]);

    await waitFor(() => {
      expect(Swal.fire).toHaveBeenCalledWith(
        expect.objectContaining({ title: 'Criar Categoria' })
      );
      expect(api.addNecessidade).toHaveBeenCalledWith('Intolerância a Lactose');
    });
  });

  it('seleciona categoria e permite associar aluno da base', async () => {
    render(
      <MemoryRouter>
        <PlanejamentoPage />
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getByText('Celiaquismo')).toBeInTheDocument();
    });

    // Clica na categoria para selecioná-la
    fireEvent.click(screen.getByText('Celiaquismo'));

    expect(screen.getByText('Alunos em Celiaquismo')).toBeInTheDocument();

    // Botão de adicionar à necessidade
    const addButton = screen.getByTitle('Adicionar à necessidade');
    expect(addButton).not.toBeDisabled();
    fireEvent.click(addButton);

    await waitFor(() => {
      expect(api.associarNecessidadesAoAluno).toHaveBeenCalledWith(10, [1]);
    });
  });

  it('permite desassociar aluno da categoria selecionada', async () => {
    Swal.fire.mockResolvedValue({ isConfirmed: true });

    render(
      <MemoryRouter>
        <PlanejamentoPage />
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getByText('Celiaquismo')).toBeInTheDocument();
    });

    fireEvent.click(screen.getByText('Celiaquismo'));

    await waitFor(() => {
      expect(screen.getByTitle('Remover da Categoria')).toBeInTheDocument();
    });

    fireEvent.click(screen.getByTitle('Remover da Categoria'));

    await waitFor(() => {
      expect(api.desassociarAlunoDaNecessidade).toHaveBeenCalledWith(1, 10);
    });
  });

  it('agenda o vínculo explícito do aluno no dia selecionado', async () => {
    Swal.fire.mockResolvedValueOnce({ value: ['1'] });

    render(
      <MemoryRouter>
        <PlanejamentoPage />
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getByText('Celiaquismo')).toBeInTheDocument();
    });

    fireEvent.click(screen.getByText('Celiaquismo'));
    fireEvent.click(screen.getByTitle('Agendar Dia'));

    await waitFor(() => {
      expect(api.agendarRelacaoNosDias).toHaveBeenCalledWith(99, ['1']);
    });
  });

  it('permite editar uma categoria existente', async () => {
    api.updateNecessidade.mockResolvedValue({});
    Swal.fire.mockResolvedValueOnce({ value: 'Celiaquismo Severo' });

    render(
      <MemoryRouter>
        <PlanejamentoPage />
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getByText('Celiaquismo')).toBeInTheDocument();
    });

    const editCatBtn = screen.getByTitle('Editar Categoria');
    fireEvent.click(editCatBtn);

    await waitFor(() => {
      expect(api.updateNecessidade).toHaveBeenCalledWith(1, 'Celiaquismo Severo');
    });
  });

  it('permite excluir uma categoria de necessidade sem alunos', async () => {
    api.deleteNecessidade.mockResolvedValue({});
    Swal.fire.mockResolvedValueOnce({ isConfirmed: true });

    render(
      <MemoryRouter>
        <PlanejamentoPage />
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getByText('Celiaquismo')).toBeInTheDocument();
    });

    const deleteCatBtn = screen.getByTitle('Excluir Categoria');
    fireEvent.click(deleteCatBtn);

    await waitFor(() => {
      expect(api.deleteNecessidade).toHaveBeenCalledWith(1);
    });
  });
});
