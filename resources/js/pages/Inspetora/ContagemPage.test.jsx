import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import ContagemPage from './ContagemPage';
import * as api from '../../services/api';
import Swal from 'sweetalert2/dist/sweetalert2.all.min.js';

vi.mock('../../services/api', () => ({
  getTodasTurmas: vi.fn(),
  getTodasContagensDeHoje: vi.fn(),
  getTodasNecessidades: vi.fn(),
  getTodosCronograma: vi.fn(),
  getTodosAlunosContagemNes: vi.fn(),
  getContextoEscolar: vi.fn(),
  saveContagemOperation: vi.fn(),
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
    hideLoading: vi.fn(),
    showValidationMessage: vi.fn(),
    close: vi.fn(),
    isLoading: vi.fn(() => false),
  },
}));

function openModalAndConfirm(options) {
  const modal = document.createElement('div');
  if (options.html instanceof HTMLElement) modal.append(options.html);
  document.body.appendChild(modal);
  options.didOpen?.();

  return Promise.resolve(options.preConfirm?.()).finally(() => modal.remove());
}

describe('ContagemPage (Inspetora)', () => {
  const hoje = '2026-09-07';

  beforeEach(() => {
    vi.clearAllMocks();
    api.getContextoEscolar.mockResolvedValue({
      data: { data_atual: hoje, timezone: 'America/Sao_Paulo', agora: '2026-09-07T12:00:00.000000Z' },
    });
    api.saveContagemOperation.mockResolvedValue({
      data: { contagem: { id: 99, qtd_contagem: 0 }, presencas: [] },
    });
    Swal.fire.mockImplementation(async options => {
      if (!options?.preConfirm) return { isDismissed: true };
      const value = await openModalAndConfirm(options);
      return value === false ? { isDismissed: true } : { isConfirmed: true, value };
    });
    api.getTodasTurmas.mockResolvedValue([
        { id: 1, nome_turma: '1º Ano A', categorias_id: 1 },
        { id: 2, nome_turma: '2º Ano B', categorias_id: 1 },
    ]);
    api.getTodasContagensDeHoje.mockResolvedValue([
        { id: 10, turmas_id: 1, qtd_contagem: 25, data_contagem: hoje },
    ]);
    api.getTodasNecessidades.mockResolvedValue([]);
    api.getTodosCronograma.mockResolvedValue([]);
    api.getTodosAlunosContagemNes.mockResolvedValue([]);
  });

  it('carrega turmas e exibe o totalizador geral de alunos', async () => {
    render(<MemoryRouter><ContagemPage /></MemoryRouter>);

    expect(screen.getByText(/carregando/i)).toBeInTheDocument();

    await waitFor(() => {
      expect(screen.getByText('1º Ano A')).toBeInTheDocument();
      expect(screen.getByText('2º Ano B')).toBeInTheDocument();
    });

    expect(screen.getAllByText('25')).toHaveLength(2);
  });

  it('identifica turmas com contagem realizada e pendente', async () => {
    render(<MemoryRouter><ContagemPage /></MemoryRouter>);

    await waitFor(() => {
      expect(screen.getByText('25 alunos')).toBeInTheDocument();
      expect(screen.getByText('Fazer Contagem')).toBeInTheDocument();
    });
  });

  it('soma somente a revisão efetiva de cada turma', async () => {
    api.getTodasContagensDeHoje.mockResolvedValue([
        { id: 10, turmas_id: 1, qtd_contagem: 10, data_contagem: hoje, hora_contagem: '08:00:00' },
        { id: 11, turmas_id: 1, qtd_contagem: 20, data_contagem: hoje, hora_contagem: '08:00:00' },
        { id: 12, turmas_id: 2, qtd_contagem: 5, data_contagem: hoje, hora_contagem: '07:00:00' },
    ]);

    render(<MemoryRouter><ContagemPage /></MemoryRouter>);

    await waitFor(() => {
      expect(screen.getAllByText('25')).toHaveLength(2);
      expect(screen.getByText('20 alunos')).toBeInTheDocument();
      expect(screen.getByText('5 alunos')).toBeInTheDocument();
    });
  });

  it('edita uma contagem existente somente após confirmar a operação', async () => {
    render(<MemoryRouter><ContagemPage /></MemoryRouter>);

    await waitFor(() => expect(screen.getByText('1º Ano A')).toBeInTheDocument());
    screen.getByText('1º Ano A').closest('.turma-card').click();

    await waitFor(() => expect(api.saveContagemOperation).toHaveBeenCalled());
    expect(api.saveContagemOperation).toHaveBeenCalledWith(
      {
        contagem_id: 10,
        turmas_id: 1,
        qtd_contagem: 25,
        presencas: [],
      },
      expect.stringMatching(/^[0-9a-f-]{36}$/i),
    );
    expect(api.addContagem).not.toHaveBeenCalled();
    expect(api.updateContagem).not.toHaveBeenCalled();
  });

  it('abre uma turma pendente sem lançar valor fictício e salva zero se confirmado', async () => {
    render(<MemoryRouter><ContagemPage /></MemoryRouter>);

    await waitFor(() => expect(screen.getByText('2º Ano B')).toBeInTheDocument());
    screen.getByText('2º Ano B').closest('.turma-card').click();

    await waitFor(() => expect(api.saveContagemOperation).toHaveBeenCalled());
    expect(api.saveContagemOperation.mock.calls[0][0]).toEqual({
      contagem_id: null,
      turmas_id: 2,
      qtd_contagem: 0,
      presencas: [],
    });
    expect(api.addContagem).not.toHaveBeenCalled();
  });

  it('descarta o rascunho ao cancelar sem chamar qualquer mutação', async () => {
    api.getTodasNecessidades.mockResolvedValue([{ id: 5, necessidade: 'NAE' }]);
    api.getNecessidadeComAlunos.mockResolvedValue({
      id: 5,
      necessidade: 'NAE',
      alunos: [{ id: 20, nome: 'Pedro', turmas_id: 2, alunos_has_necessidades_id: 77 }],
    });
    Swal.fire.mockImplementation(async options => {
      if (!options?.preConfirm) return { isDismissed: true };
      const modal = document.createElement('div');
      modal.append(options.html);
      document.body.appendChild(modal);
      options.didOpen?.();
      const input = modal.querySelector('#contadorValor');
      input.value = '28';
      const checkbox = modal.querySelector('.check-nes');
      checkbox.checked = true;
      checkbox.onchange?.({ target: checkbox });
      modal.remove();
      return { isDismissed: true };
    });

    render(<MemoryRouter><ContagemPage /></MemoryRouter>);
    await waitFor(() => expect(screen.getByText('2º Ano B')).toBeInTheDocument());
    screen.getByText('2º Ano B').closest('.turma-card').click();

    await waitFor(() => expect(api.getNecessidadeComAlunos).toHaveBeenCalled());
    expect(api.saveContagemOperation).not.toHaveBeenCalled();
    expect(api.addContagem).not.toHaveBeenCalled();
    expect(api.updateContagem).not.toHaveBeenCalled();
    expect(api.addAlunoNaContagemNes).not.toHaveBeenCalled();
    expect(api.removeAlunoDaContagemNes).not.toHaveBeenCalled();
  });

  it('envia presenças NES alteradas junto da confirmação única', async () => {
    api.getTodasNecessidades.mockResolvedValue([{ id: 5, necessidade: 'NAE' }]);
    api.getNecessidadeComAlunos.mockResolvedValue({
      id: 5,
      necessidade: 'NAE',
      alunos: [{ id: 20, nome: 'Pedro', turmas_id: 1, alunos_has_necessidades_id: 77 }],
    });
    Swal.fire.mockImplementation(async options => {
      if (!options?.preConfirm) return { isDismissed: true };
      const modal = document.createElement('div');
      modal.append(options.html);
      document.body.appendChild(modal);
      options.didOpen?.();
      const checkbox = modal.querySelector('.check-nes');
      checkbox.checked = true;
      checkbox.onchange?.({ target: checkbox });
      const value = await options.preConfirm();
      modal.remove();
      return { isConfirmed: true, value };
    });

    render(<MemoryRouter><ContagemPage /></MemoryRouter>);
    await waitFor(() => expect(screen.getByText('1º Ano A')).toBeInTheDocument());
    screen.getByText('1º Ano A').closest('.turma-card').click();

    await waitFor(() => expect(api.saveContagemOperation).toHaveBeenCalled());
    expect(api.saveContagemOperation.mock.calls[0][0].presencas).toEqual([
      { relacao_id: 77, presenca_id: null, presente: true },
    ]);
  });

  it('mantém o rascunho e a mesma chave ao falhar, permitindo retry seguro', async () => {
    api.saveContagemOperation
      .mockRejectedValueOnce(new Error('Falha de rede'))
      .mockResolvedValueOnce({ data: { contagem: { id: 10, qtd_contagem: 30 }, presencas: [] } });
    let attempts = 0;
    Swal.fire.mockImplementation(async options => {
      if (!options?.preConfirm) return { isDismissed: true };
      const modal = document.createElement('div');
      modal.append(options.html);
      document.body.appendChild(modal);
      options.didOpen?.();
      attempts += 1;
      const firstResult = await options.preConfirm();
      expect(firstResult).toBe(false);
      const secondResult = await options.preConfirm();
      modal.remove();
      return { isConfirmed: true, value: secondResult };
    });

    render(<MemoryRouter><ContagemPage /></MemoryRouter>);
    await waitFor(() => expect(screen.getByText('1º Ano A')).toBeInTheDocument());
    screen.getByText('1º Ano A').closest('.turma-card').click();

    await waitFor(() => expect(api.saveContagemOperation).toHaveBeenCalledTimes(2));
    expect(attempts).toBe(1);
    expect(api.saveContagemOperation.mock.calls[0][0]).toEqual(api.saveContagemOperation.mock.calls[1][0]);
    expect(api.saveContagemOperation.mock.calls[0][1]).toBe(api.saveContagemOperation.mock.calls[1][1]);
    expect(Swal.showValidationMessage).toHaveBeenCalledWith('Falha de rede');
  });

  it('exibe alunos com necessidade NAI diariamente sem exigir agendamento no cronograma', async () => {
    api.getTodasNecessidades.mockResolvedValue([{ id: 6, necessidade: 'NAI' }]);
    api.getNecessidadeComAlunos.mockResolvedValue({
      id: 6,
      necessidade: 'NAI',
      alunos: [{ id: 25, nome: 'Lucas NAI', turmas_id: 1, alunos_has_necessidades_id: 88 }],
    });
    let capturedHtml = null;
    Swal.fire.mockImplementation(async options => {
      capturedHtml = options?.html;
      return { isDismissed: true };
    });

    render(<MemoryRouter><ContagemPage /></MemoryRouter>);
    await waitFor(() => expect(screen.getByText('1º Ano A')).toBeInTheDocument());
    screen.getByText('1º Ano A').closest('.turma-card').click();

    await waitFor(() => expect(api.getNecessidadeComAlunos).toHaveBeenCalledWith(6));
    expect(capturedHtml?.textContent).toContain('Lucas NAI');
  });
});
