import { collectPaginated } from './pagination';

const page = (current, last, data) => ({
    data,
    meta: { current_page: current, last_page: last, total: data.length },
});

describe('coleta paginada', () => {
    it('percorre todas as páginas, aceita página final vazia e deduplica por id', async () => {
        const fetchPage = vi.fn()
            .mockResolvedValueOnce(page(1, 4, Array.from({ length: 500 }, (_, index) => ({ id: index + 1 }))))
            .mockResolvedValueOnce(page(2, 4, Array.from({ length: 500 }, (_, index) => ({ id: index + 501 }))))
            .mockResolvedValueOnce(page(3, 4, [{ id: 1001 }, { id: 500 }]))
            .mockResolvedValueOnce(page(4, 4, []));

        const result = await collectPaginated(fetchPage, { limit: 500 });

        expect(result).toHaveLength(1001);
        expect(result.at(-1)).toEqual({ id: 1001 });
        expect(fetchPage).toHaveBeenCalledTimes(4);
        expect(fetchPage.mock.calls.map(([pageNumber]) => pageNumber)).toEqual([1, 2, 3, 4]);
    });

    it('interrompe quando a resposta repete a página', async () => {
        const fetchPage = vi.fn()
            .mockResolvedValueOnce(page(1, 3, [{ id: 1 }]))
            .mockResolvedValueOnce(page(1, 3, [{ id: 2 }]));

        await expect(collectPaginated(fetchPage)).rejects.toThrow(/página/i);
        expect(fetchPage).toHaveBeenCalledTimes(2);
    });

    it('não apresenta resultado parcial ao atingir o teto operacional', async () => {
        const fetchPage = vi.fn().mockResolvedValue(page(1, 2, [{ id: 1 }]));

        await expect(collectPaginated(fetchPage, { maxPages: 1 })).rejects.toThrow(/limite/i);
        expect(fetchPage).toHaveBeenCalledTimes(1);
    });

    it('propaga falha intermediária sem retornar o que já foi coletado', async () => {
        const fetchPage = vi.fn()
            .mockResolvedValueOnce(page(1, 2, [{ id: 1 }]))
            .mockRejectedValueOnce(new Error('falha da página 2'));

        await expect(collectPaginated(fetchPage)).rejects.toThrow('falha da página 2');
        expect(fetchPage).toHaveBeenCalledTimes(2);
    });

    it('respeita cancelamento antes de iniciar nova página', async () => {
        const controller = new AbortController();
        const fetchPage = vi.fn().mockImplementation(async (pageNumber) => {
            controller.abort();
            return page(pageNumber, 2, [{ id: pageNumber }]);
        });

        await expect(collectPaginated(fetchPage, { signal: controller.signal })).rejects.toMatchObject({ name: 'AbortError' });
        expect(fetchPage).toHaveBeenCalledTimes(1);
    });
});
