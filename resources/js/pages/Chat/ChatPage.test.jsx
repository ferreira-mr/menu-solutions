import React from 'react';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import ChatPage from './ChatPage';
import * as api from '../../services/api';

vi.mock('../../services/api', () => ({
  getUserData: vi.fn(),
  getChatMembers: vi.fn(),
  getChatMessages: vi.fn(),
  sendMessage: vi.fn(),
}));

describe('ChatPage (Comunicação da Equipe)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    api.getUserData.mockResolvedValue({
      data: { id: 1, name: 'Laís Inspetora', nivel_user: 1 },
    });
    api.getChatMembers.mockResolvedValue({
      data: [
        { id: 1, name: 'Laís Inspetora', nivel_user: 1 },
        { id: 2, name: 'Jaqueline Nutri', nivel_user: 2 },
      ],
    });
    api.getChatMessages.mockResolvedValue({
      data: [
        { id: 10, users_id: 2, mensagem_chat: 'Bom dia! Contagem liberada?', created_at: '2026-09-04T07:15:00Z', user: { name: 'Jaqueline Nutri' } },
      ],
    });
  });

  it('carrega mensagens e lista de participantes da equipe', async () => {
    render(
      <MemoryRouter>
        <ChatPage />
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getByText('Bom dia! Contagem liberada?')).toBeInTheDocument();
      expect(screen.getAllByText(/Jaqueline Nutri/i).length).toBeGreaterThan(0);
    });
  });

  it('permite digitar e enviar uma nova mensagem', async () => {
    api.sendMessage.mockResolvedValue({ success: true });

    render(
      <MemoryRouter>
        <ChatPage />
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getByText('Bom dia! Contagem liberada?')).toBeInTheDocument();
    });

    const input = screen.getByPlaceholderText(/escreva uma mensagem/i);
    fireEvent.change(input, { target: { value: 'Turmas do 1º ano já lançadas!' } });

    const sendBtn = screen.getByRole('button', { name: '' });
    fireEvent.click(sendBtn);

    await waitFor(() => {
      expect(api.sendMessage).toHaveBeenCalledWith(
        expect.objectContaining({
          mensagem_chat: 'Turmas do 1º ano já lançadas!',
        })
      );
    });
  });
});
