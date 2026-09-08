import React from 'react';
import { act, render, screen, waitFor, fireEvent } from '@testing-library/react';
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
  const createMessage = (id, text, overrides = {}) => ({
    id,
    users_id: id % 2 === 0 ? 2 : 1,
    mensagem_chat: text,
    created_at: `2026-09-04T07:${String(id).padStart(2, '0')}:00Z`,
    updated_at: `2026-09-04T07:${String(id).padStart(2, '0')}:00Z`,
    user: { name: id % 2 === 0 ? 'Jaqueline Nutri' : 'Laís Inspetora' },
    ...overrides,
  });

  const pageResponse = (messages, page = 1, lastPage = 1) => ({
    data: messages,
    meta: {
      current_page: page,
      last_page: lastPage,
      per_page: 20,
      total: messages.length,
    },
  });

  const renderPage = () => render(
    <MemoryRouter>
      <ChatPage />
    </MemoryRouter>
  );

  const flushChat = async () => act(async () => {
    await Promise.resolve();
    await Promise.resolve();
    await Promise.resolve();
  });

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

  afterEach(() => {
    vi.useRealTimers();
  });

  it('carrega mensagens e lista de participantes da equipe', async () => {
    renderPage();

    await waitFor(() => {
      expect(screen.getByText('Bom dia! Contagem liberada?')).toBeInTheDocument();
      expect(screen.getAllByText(/Jaqueline Nutri/i).length).toBeGreaterThan(0);
    });
  });

  it('permite digitar e enviar uma nova mensagem', async () => {
    api.sendMessage.mockResolvedValue({ success: true });

    renderPage();

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

  it('mostra mensagem nova mesmo quando a resposta do polling tem o mesmo tamanho', async () => {
    vi.useFakeTimers();
    const initialMessages = Array.from({ length: 20 }, (_, index) => createMessage(index + 1, `Mensagem ${index + 1}`));
    const polledMessages = [
      ...initialMessages.slice(1),
      createMessage(21, 'Mensagem nova'),
    ];
    api.getChatMessages.mockReset();
    api.getChatMessages
      .mockResolvedValueOnce(pageResponse(initialMessages))
      .mockResolvedValue(pageResponse(polledMessages));

    renderPage();

    await flushChat();
    expect(screen.getByText('Mensagem 1')).toBeInTheDocument();
    await act(async () => {
      await vi.advanceTimersByTimeAsync(3000);
    });

    expect(screen.getByText('Mensagem nova')).toBeInTheDocument();
    expect(screen.getAllByText('Mensagem nova')).toHaveLength(1);
  });

  it('aplica edição com a mesma quantidade, ignora resposta atrasada e preserva o rascunho', async () => {
    vi.useFakeTimers();
    const initialMessages = Array.from({ length: 20 }, (_, index) => createMessage(index + 1, `Mensagem ${index + 1}`));
    let resolveFresh;
    let resolveStale;
    const freshResponse = new Promise((resolve) => { resolveFresh = resolve; });
    const staleResponse = new Promise((resolve) => { resolveStale = resolve; });
    api.getChatMessages.mockReset();
    api.getChatMessages
      .mockResolvedValueOnce(pageResponse(initialMessages))
      .mockImplementationOnce(() => freshResponse)
      .mockImplementationOnce(() => staleResponse);

    renderPage();
    await flushChat();
    expect(screen.getByText('Mensagem 1')).toBeInTheDocument();

    const input = screen.getByPlaceholderText(/escreva uma mensagem/i);
    fireEvent.change(input, { target: { value: 'Rascunho preservado' } });

    await act(async () => {
      await vi.advanceTimersByTimeAsync(6000);
    });

    resolveFresh(pageResponse([
      createMessage(1, 'Mensagem 1 editada', { updated_at: '2026-09-04T08:15:00Z' }),
      ...initialMessages.slice(1),
    ]));
    await act(async () => {
      await Promise.resolve();
    });

    expect(screen.getByText('Mensagem 1 editada')).toBeInTheDocument();

    resolveStale(pageResponse(initialMessages));
    await act(async () => {
      await Promise.resolve();
    });

    expect(screen.getByText('Mensagem 1 editada')).toBeInTheDocument();
    expect(screen.queryByText('Mensagem 1', { exact: true })).not.toBeInTheDocument();
    expect(input).toHaveValue('Rascunho preservado');
  });

  it('carrega histórico anterior, incorpora nova mensagem e evita duplicatas', async () => {
    vi.useFakeTimers();
    const initialMessages = Array.from({ length: 20 }, (_, index) => createMessage(index + 1, `Mensagem ${index + 1}`));
    const olderMessage = createMessage(0, 'Mensagem histórica', {
      created_at: '2026-09-03T18:00:00Z',
      updated_at: '2026-09-03T18:00:00Z',
    });
    let currentPage1 = pageResponse(initialMessages, 1, 2);
    api.getChatMessages.mockReset();
    api.getChatMessages.mockImplementation((page = 1) => (
      page === 2
        ? Promise.resolve(pageResponse([olderMessage], 2, 2))
        : Promise.resolve(currentPage1)
    ));

    renderPage();
    await flushChat();
    expect(screen.getByText('Mensagem 1')).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: /mensagens anteriores/i }));
    await flushChat();
    expect(screen.getByText('Mensagem histórica')).toBeInTheDocument();

    currentPage1 = pageResponse([
      ...initialMessages.slice(1),
      createMessage(21, 'Mensagem recebida depois'),
    ], 1, 2);
    await act(async () => {
      await vi.advanceTimersByTimeAsync(3000);
    });

    expect(screen.getByText('Mensagem recebida depois')).toBeInTheDocument();
    expect(screen.getAllByText('Mensagem histórica')).toHaveLength(1);
    expect(screen.getAllByText('Mensagem 2')).toHaveLength(1);
    expect(screen.queryAllByRole('button', { name: /mensagens anteriores/i })).toHaveLength(0);
  });

  it('cancela a requisição de mensagens ao desmontar', async () => {
    let requestSignal;
    api.getChatMessages.mockReset();
    api.getChatMessages.mockImplementation((page, limit, options) => {
      requestSignal = options?.signal;
      return new Promise(() => {});
    });

    const { unmount } = renderPage();
    await waitFor(() => expect(api.getChatMessages).toHaveBeenCalled());

    unmount();

    expect(requestSignal).toBeDefined();
    expect(requestSignal.aborted).toBe(true);
  });
});
