import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import ViewCardapioPage from './ViewCardapioPage';
import * as api from '../../services/api';

vi.mock('../../services/api', () => ({
  getLatestCardapio: vi.fn(),
}));

describe('ViewCardapioPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('exibe o cardápio mais recente quando disponível', async () => {
    api.getLatestCardapio.mockResolvedValue({
      id: 1,
      path: 'cardapio_hoje.pdf',
    });

    render(
      <MemoryRouter>
        <ViewCardapioPage />
      </MemoryRouter>
    );

    await waitFor(() => {
      const iframe = document.querySelector('iframe');
      expect(iframe).toBeInTheDocument();
      expect(iframe.src).toContain('cardapio_hoje.pdf');
    });
  });

  it('exibe mensagem quando não há cardápio disponível', async () => {
    api.getLatestCardapio.mockResolvedValue(null);

    render(
      <MemoryRouter>
        <ViewCardapioPage />
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getByText(/nenhum cardápio disponível/i)).toBeInTheDocument();
    });
  });
});
