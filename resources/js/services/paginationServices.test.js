import { getTodosAlunos } from './modules/escolar.api';
import { getTodosContagensPorRange } from './modules/contagens.api';

const jsonResponse = (body) => new Response(JSON.stringify(body), {
    status: 200,
    headers: { 'Content-Type': 'application/json' },
});

describe('serviços de listas completas', () => {
    beforeEach(() => {
        localStorage.setItem('authToken', 'token-de-teste');
        vi.stubGlobal('fetch', vi.fn());
    });

    afterEach(() => {
        vi.restoreAllMocks();
    });

    it('busca a página seguinte pelo número e expõe o item depois da primeira página', async () => {
        fetch.mockImplementation((url) => {
            if (url === '/api/alunos?page=1&limit=20') {
                return Promise.resolve(jsonResponse({
                    data: Array.from({ length: 20 }, (_, index) => ({ id: index + 1 })),
                    links: { next: 'https://host-nao-confiavel.example/page/2' },
                    meta: { current_page: 1, last_page: 2, total: 21 },
                }));
            }

            if (url === '/api/alunos?page=2&limit=20') {
                return Promise.resolve(jsonResponse({
                    data: [{ id: 21 }],
                    meta: { current_page: 2, last_page: 2, total: 21 },
                }));
            }

            throw new Error(`URL inesperada: ${url}`);
        });

        const result = await getTodosAlunos({ limit: 20 });

        expect(result).toHaveLength(21);
        expect(result.at(-1)).toEqual({ id: 21 });
        expect(fetch.mock.calls.map(([url]) => url)).toEqual([
            '/api/alunos?page=1&limit=20',
            '/api/alunos?page=2&limit=20',
        ]);
    });

    it('preserva o intervalo de datas ao buscar todas as páginas de contagem', async () => {
        fetch.mockImplementation((url) => {
            const page = new URL(url, 'http://localhost').searchParams.get('page');
            return Promise.resolve(jsonResponse({
                data: page === '1' ? [{ id: 10, data_contagem: '2026-09-01' }] : [{ id: 11, data_contagem: '2026-09-02' }],
                meta: { current_page: Number(page), last_page: 2, total: 2 },
            }));
        });

        const result = await getTodosContagensPorRange('2026-09-01', '2026-09-02', { limit: 1 });

        expect(result.map(item => item.id)).toEqual([10, 11]);
        expect(fetch.mock.calls.map(([url]) => url)).toEqual([
            '/api/contagens?page=1&limit=1&data_inicio=2026-09-01&data_fim=2026-09-02',
            '/api/contagens?page=2&limit=1&data_inicio=2026-09-01&data_fim=2026-09-02',
        ]);
    });
});
