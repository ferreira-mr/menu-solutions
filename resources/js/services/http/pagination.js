const DEFAULT_MAX_PAGES = 100;
const DEFAULT_MAX_ITEMS = 100000;

const abortError = () => {
    const error = new Error('A coleta paginada foi cancelada.');
    error.name = 'AbortError';
    return error;
};

const assertNotAborted = (signal) => {
    if (signal?.aborted) throw abortError();
};

const positiveInteger = (value) => {
    const number = Number(value);
    return Number.isSafeInteger(number) && number > 0 ? number : null;
};

const paginationError = (message) => new Error(`Resposta paginada inválida: ${message}`);

/**
 * Coleta uma coleção paginada usando somente page/meta da mesma rota.
 * A função rejeita a operação inteira se houver falha, ciclo ou estouro do teto.
 */
export const collectPaginated = async (
    fetchPage,
    {
        limit = 1000,
        maxPages = DEFAULT_MAX_PAGES,
        maxItems = DEFAULT_MAX_ITEMS,
        signal,
    } = {},
) => {
    if (!positiveInteger(limit) || limit > 1000) {
        throw paginationError('limit deve ser um inteiro entre 1 e 1000.');
    }

    if (!positiveInteger(maxPages) || !positiveInteger(maxItems)) {
        throw paginationError('os limites operacionais devem ser inteiros positivos.');
    }

    const items = [];
    const seenIds = new Set();
    const seenPages = new Set();
    let page = 1;

    while (true) {
        assertNotAborted(signal);

        if (page > maxPages) {
            throw paginationError(`limite de ${maxPages} páginas excedido.`);
        }

        const response = await fetchPage(page, limit, { signal });
        assertNotAborted(signal);

        const pageItems = response?.data;
        if (!Array.isArray(pageItems)) {
            throw paginationError(`a página ${page} não contém um array data.`);
        }

        const meta = response?.meta ?? {};
        const currentPage = positiveInteger(meta.current_page ?? page);
        const lastPage = positiveInteger(meta.last_page ?? currentPage);

        if (!currentPage || !lastPage || currentPage !== page || currentPage > lastPage) {
            throw paginationError(`a página ${page} não corresponde a meta.current_page/last_page.`);
        }

        if (seenPages.has(currentPage)) {
            throw paginationError(`a página ${currentPage} foi repetida.`);
        }
        seenPages.add(currentPage);

        pageItems.forEach((item) => {
            const id = item?.id;
            if (id !== undefined && id !== null) {
                const key = String(id);
                if (seenIds.has(key)) return;
                seenIds.add(key);
            }

            items.push(item);
        });

        if (items.length > maxItems) {
            throw paginationError(`limite de ${maxItems} itens excedido.`);
        }

        if (page >= lastPage) return items;

        if (pageItems.length === 0) {
            throw paginationError(`a página ${page} está vazia antes da última página.`);
        }

        page += 1;
    }
};

export const paginationQuery = (page, limit, filters = {}) => {
    const params = new URLSearchParams({ page: String(page), limit: String(limit) });

    Object.entries(filters).forEach(([key, value]) => {
        if (value !== undefined && value !== null && value !== '') params.set(key, String(value));
    });

    return params.toString();
};
