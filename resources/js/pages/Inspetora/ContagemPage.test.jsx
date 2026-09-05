import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import ContagemPage from './ContagemPage';
import * as api from '../../services/api';
import Swal from 'sweetalert2/dist/sweetalert2.all.min.js';

vi.mock('../../services/api', () => ({
  getTurmas: vi.fn(),
  getContagensDeHoje: vi.fn(),
  getNecessidades: vi.fn(),
  getCronograma: vi.fn(),
  getAlunosContagemNes: vi.fn(),
  addContagem: vi.fn(),
  updateContagem: vi.fn(),
  getNecessidadeComAlunos: vi.fn(),
  addAlunoNaContagemNes: vi.fn(),
  removeAlunoDaContagemNes: vi.fn(),
}));

vi.mock('sweetalert2/dist/sweetalert2.all.min.js', () => ({
  default: {
    fire: vi.fn(),
    showLoading: vi.fn(),
  },
}));

describe('ContagemPage (Inspetora)', () => {
  const hoje = new Date().toISOString().slice(0, 10);

  beforeEach(() => {
    vi.clearAllMocks();
    Swal.fire.mockResolvedValue({ isConfirmed: true, value: { quantidadeFinal: 30 } });
    api.getTurmas.mockResolvedValue({
      data: [
        { id: 1, nome_turma: '1º Ano A', categorias_id: 1 },
        { id: 2, nome_turma: '2º Ano B', categorias_id: 1 },
      ],
    });
    api.getContagensDeHoje.mockResolvedValue({
      data: [
        { id: 10, turmas_id: 1, qtd_contagem: 25, data_contagem: hoje },
      ],
    });
    api.getNecessidades.mockResolvedValue({ data: [] });
    api.getCronograma.mockResolvedValue({ data: [] });
    api.getAlunosContagemNes.mockResolvedValue({ data: [] });
  });

  it('carrega turmas e exibe o totalizador geral de alunos', async () => {
    render(
      <MemoryRouter>
        <ContagemPage />
      </MemoryRouter>
    );

    expect(screen.getByText(/carregando/i)).toBeInTheDocument();

    await waitFor(() => {
      expect(screen.getByText('1º Ano A')).toBeInTheDocument();
      expect(screen.getByText('2º Ano B')).toBeInTheDocument();
    });

    // Totalizador soma 25 alunos contados hoje
    expect(screen.getByText('25')).toBeInTheDocument();
  });

  it('identifica turmas com contagem realizada e pendente', async () => {
    render(
      <MemoryRouter>
        <ContagemPage />
      </MemoryRouter>
    );

    await waitFor(() => {
      // 1º Ano A já tem contagem (25 alunos)
      expect(screen.getByText('25 alunos')).toBeInTheDocument();
      // 2º Ano B está pendente ("Fazer Contagem")
      expect(screen.getByText('Fazer Contagem')).toBeInTheDocument();
    });
  });

  it('inicia contagem ao clicar no card e salva a contagem', async () => {
    api.addContagem.mockResolvedValue({ id: 99, qtd_contagem: 32 });
    api.updateContagem.mockResolvedValue({ id: 10, qtd_contagem: 30 });

    render(
      <MemoryRouter>
        <ContagemPage />
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getByText('1º Ano A')).toBeInTheDocument();
    });

    const card = screen.getByText('1º Ano A').closest('.turma-card');
    card.click();

    await waitFor(() => {
      expect(api.updateContagem).toHaveBeenCalledWith(10, { quantidade: 30 });
    });
  });

  it('inicia contagem para turma pendente chamando addContagem', async () => {
    api.addContagem.mockResolvedValue({ id: 99, qtd_contagem: 32 });
    api.updateContagem.mockResolvedValue({ id: 99, qtd_contagem: 30 });

    render(
      <MemoryRouter>
        <ContagemPage />
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getByText('2º Ano B')).toBeInTheDocument();
    });

    const card = screen.getByText('2º Ano B').closest('.turma-card');
    card.click();

    await waitFor(() => {
      expect(api.addContagem).toHaveBeenCalledWith({ quantidade: 32, turmaId: 2 });
    });
  });
});
