import {
  addCategoria,
  addCardapio,
  getCategorias,
  getDiasDaRelacao,
  loginUser,
  removeAlunoDaContagemNes,
} from './api';

function jsonResponse(body, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });
}

describe('cliente da API', () => {
  beforeEach(() => {
    localStorage.setItem('authToken', 'token-de-teste');
    vi.stubGlobal('fetch', vi.fn());
  });

  it('adiciona token e serializa payload JSON nas requisições', async () => {
    fetch.mockResolvedValueOnce(jsonResponse({ data: [{ id: 1 }] }));

    await addCategoria('Sem lactose');

    expect(fetch).toHaveBeenCalledWith('/api/categorias', expect.objectContaining({
      method: 'POST',
      headers: expect.objectContaining({
        Accept: 'application/json',
        Authorization: 'Bearer token-de-teste',
        'Content-Type': 'application/json',
      }),
      body: JSON.stringify({ nome_categoria: 'Sem lactose' }),
    }));
  });

  it('mantém query string para paginação e retorna JSON', async () => {
    fetch.mockResolvedValueOnce(jsonResponse({ data: [], meta: { current_page: 2 } }));

    await getCategorias(2);

    expect(fetch).toHaveBeenCalledWith('/api/categorias?page=2', expect.any(Object));
  });

  it('envia FormData sem substituir o content-type do navegador', async () => {
    fetch.mockResolvedValueOnce(jsonResponse({ name: 'arquivo-gerado.pdf' }));
    const file = new File(['pdf'], 'cardapio.pdf', { type: 'application/pdf' });

    await addCardapio(file);

    const [, options] = fetch.mock.calls[0];
    expect(options.method).toBe('POST');
    expect(options.body).toBeInstanceOf(FormData);
    expect(options.body.get('file')).toBe(file);
    expect(options.headers).not.toHaveProperty('Content-Type');
  });

  it('usa a rota de relação de dias compatível com o backend', async () => {
    fetch.mockResolvedValueOnce(jsonResponse({ data: [] }));

    await getDiasDaRelacao(42);

    expect(fetch).toHaveBeenCalledWith('/api/alunos-necessidades/42/dias', expect.any(Object));
  });

  it('retorna sucesso para respostas 204', async () => {
    fetch.mockResolvedValueOnce(new Response(null, { status: 204 }));

    await removeAlunoDaContagemNes(7);

    expect(fetch).toHaveBeenCalledWith('/api/contagem-nes/7', expect.objectContaining({
      method: 'DELETE',
    }));
  });

  it('propaga a mensagem da API quando a autenticação falha', async () => {
    vi.spyOn(console, 'error').mockImplementation(() => {});
    fetch.mockResolvedValueOnce(jsonResponse({ message: 'Credenciais inválidas' }, 401));

    await expect(loginUser('00000000000', 'errada'))
      .rejects.toThrow('Credenciais inválidas');
    expect(localStorage.getItem('authToken')).toBe('token-de-teste');
  });
});
