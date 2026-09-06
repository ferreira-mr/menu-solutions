import React from 'react';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import CardapiosPage from './CardapiosPage';
import * as api from '../../services/api';
import Swal from 'sweetalert2/dist/sweetalert2.all.min.js';

vi.mock('../../services/api', () => ({
  getCardapios: vi.fn(),
  addCardapio: vi.fn(),
  deleteCardapio: vi.fn(),
}));

vi.mock('sweetalert2/dist/sweetalert2.all.min.js', () => ({
  default: {
    fire: vi.fn().mockResolvedValue({ isConfirmed: true }),
  },
}));

describe('CardapiosPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    Swal.fire.mockResolvedValue({ isConfirmed: true });
    api.getCardapios.mockResolvedValue({
      data: [
        { id: 1, path: 'cardapio_semana_1.pdf', created_at: '2026-09-01T10:00:00Z' },
      ],
      meta: { current_page: 1, last_page: 1 },
    });
  });

  it('lista cardápios semanais enviados formatados por data', async () => {
    render(
      <MemoryRouter>
        <CardapiosPage />
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getByText(/Cardápio Semanal/i)).toBeInTheDocument();
      expect(screen.getByText(/Visualizar/i)).toBeInTheDocument();
    });
  });

  it('permite upload de um arquivo PDF válido', async () => {
    api.addCardapio.mockResolvedValue({ success: true });

    const { container } = render(
      <MemoryRouter>
        <CardapiosPage />
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getByText(/Cardápio Semanal/i)).toBeInTheDocument();
    });

    const fileInput = container.querySelector('input[type="file"]');
    expect(fileInput).toBeInTheDocument();

    const pdfFile = new File(['dummy-pdf'], 'cardapio.pdf', { type: 'application/pdf' });
    fireEvent.change(fileInput, { target: { files: [pdfFile] } });

    await waitFor(() => {
      expect(api.addCardapio).toHaveBeenCalledWith(pdfFile);
    });
  });

  it('rejeita arquivos que não sejam PDF', async () => {
    const { container } = render(
      <MemoryRouter>
        <CardapiosPage />
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getByText(/Cardápio Semanal/i)).toBeInTheDocument();
    });

    const fileInput = container.querySelector('input[type="file"]');
    const txtFile = new File(['dummy-text'], 'cardapio.txt', { type: 'text/plain' });
    fireEvent.change(fileInput, { target: { files: [txtFile] } });

    await waitFor(() => {
      expect(Swal.fire).toHaveBeenCalledWith('Atenção', 'Por favor, selecione um arquivo PDF.', 'warning');
      expect(api.addCardapio).not.toHaveBeenCalled();
    });
  });

  it('permite remover um cardápio após confirmação', async () => {
    api.deleteCardapio.mockResolvedValue({ success: true });

    render(
      <MemoryRouter>
        <CardapiosPage />
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getByText(/Cardápio Semanal/i)).toBeInTheDocument();
    });

    const deleteBtn = screen.getByTitle(/excluir cardápio/i);
    fireEvent.click(deleteBtn);

    await waitFor(() => {
      expect(api.deleteCardapio).toHaveBeenCalledWith(1);
    });
  });

  it('abre o arquivo ao clicar em Visualizar', async () => {
    const openSpy = vi.spyOn(window, 'open').mockImplementation(() => {});

    render(
      <MemoryRouter>
        <CardapiosPage />
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getByText(/Visualizar/i)).toBeInTheDocument();
    });

    const viewBtn = screen.getByText(/Visualizar/i);
    fireEvent.click(viewBtn);

    expect(openSpy).toHaveBeenCalledWith(expect.stringContaining('cardapio_semana_1.pdf'), '_blank');
  });

  it('exibe estado vazio quando não há cardápios cadastrados', async () => {
    api.getCardapios.mockResolvedValue({ data: [] });

    render(
      <MemoryRouter>
        <CardapiosPage />
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getByText(/Nenhum cardápio encontrado/i)).toBeInTheDocument();
    });
  });
});
