import React from 'react';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import ControleProducaoPage from './ControleProducaoPage';
import * as api from '../../services/api';
import Swal from 'sweetalert2/dist/sweetalert2.all.min.js';

vi.mock('../../services/api', () => ({
  getProducao: vi.fn(),
  addProducao: vi.fn(),
  updateProducao: vi.fn(),
  deleteProducao: vi.fn(),
}));

vi.mock('sweetalert2/dist/sweetalert2.all.min.js', () => ({
  default: {
    fire: vi.fn(),
    showValidationMessage: vi.fn(),
  },
}));

vi.mock('../../components/ControleProducao/ProducaoManagementView', () => ({
  default: ({ initialData = [] }) => (
    <div data-testid="management-view">
      <span>Itens: {initialData.length}</span>
    </div>
  ),
}));

vi.mock('../../components/ControleProducao/ProducaoReportPreview', () => ({
  default: ({ title }) => <div data-testid="report-preview">Relatório Preview: {title}</div>,
}));

vi.mock('../../components/ControleProducao/ProducaoFilterPanel', () => ({
  default: ({ onGenerate }) => (
    <div data-testid="filter-panel">
      Painel de Filtros
      <button onClick={onGenerate}>Gerar Relatório</button>
    </div>
  ),
}));

describe('ControleProducaoPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    Swal.fire.mockResolvedValue({
      isConfirmed: true,
      value: {
        nome_alimento: 'Feijão',
        data_alimento: '2026-09-04',
        quantidade_alimento: '15',
        medida_alimento: 'kg',
        pessoas_alimento: '150',
        sobra_limpa_alimento: '1',
        desperdicio_alimento: '0.5',
      },
    });

    api.getProducao.mockResolvedValue({
      data: [
        { id: 1, nome_alimento: 'Arroz', quantidade_alimento: 20, pessoas_alimento: 150, data_alimento: '2026-09-04' },
      ],
    });
    api.addProducao.mockResolvedValue({ id: 2 });
  });

  it('carrega registros de produção na visão de gerenciamento', async () => {
    render(
      <MemoryRouter>
        <ControleProducaoPage />
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getByTestId('management-view')).toBeInTheDocument();
      expect(screen.getByText('Itens: 1')).toBeInTheDocument();
    });
  });

  it('filtra registros na barra de pesquisa por nome do alimento', async () => {
    render(
      <MemoryRouter>
        <ControleProducaoPage />
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getByText('Itens: 1')).toBeInTheDocument();
    });

    const searchInput = screen.getByPlaceholderText('Buscar por nome...');
    fireEvent.change(searchInput, { target: { value: 'Inexistente' } });

    expect(screen.getByText('Itens: 0')).toBeInTheDocument();

    fireEvent.change(searchInput, { target: { value: 'Arroz' } });
    expect(screen.getByText('Itens: 1')).toBeInTheDocument();
  });

  it('permite adicionar novo item de produção via modal Swal', async () => {
    render(
      <MemoryRouter>
        <ControleProducaoPage />
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getByText('Adicionar Item')).toBeInTheDocument();
    });

    fireEvent.click(screen.getByText('Adicionar Item'));

    await waitFor(() => {
      expect(Swal.fire).toHaveBeenCalledWith(
        expect.objectContaining({ title: 'Adicionar Novo Item' })
      );
      expect(api.addProducao).toHaveBeenCalled();
    });
  });

  it('alterna para a visão de relatórios e gera relatório com sucesso', async () => {
    render(
      <MemoryRouter>
        <ControleProducaoPage />
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getByTestId('management-view')).toBeInTheDocument();
    });

    fireEvent.click(screen.getByRole('button', { name: /relatório/i }));

    await waitFor(() => {
      expect(screen.getByTestId('report-preview')).toBeInTheDocument();
      expect(screen.getByTestId('filter-panel')).toBeInTheDocument();
    });

    fireEvent.click(screen.getByRole('button', { name: /gerar relatório/i }));

    await waitFor(() => {
      expect(screen.getByTestId('report-preview')).toHaveTextContent(/Relatório do Dia/i);
    });
  });
});
