import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import CardapiosPage from './CardapiosPage';
import * as api from '../../services/api';

vi.mock('../../services/api', () => ({
  getCardapios: vi.fn(),
  addCardapio: vi.fn(),
  deleteCardapio: vi.fn(),
}));

describe('CardapiosPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
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
});
