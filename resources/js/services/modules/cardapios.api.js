import { apiFetch } from '../http/client';
import { collectPaginated, paginationQuery } from '../http/pagination';

export const getCardapios = (page = 1) => apiFetch(`/cardapios?page=${page}`);
export const getPaginaCardapios = (page = 1, limit = 15, options = {}) => apiFetch(`/cardapios?${paginationQuery(page, limit)}`, options);
export const getTodosCardapios = (options = {}) => {
    const { limit = 15, signal, maxPages, maxItems } = options;
    return collectPaginated((page, pageLimit, requestOptions) => getPaginaCardapios(page, pageLimit, requestOptions), {
        limit, signal, maxPages, maxItems,
    });
};
export const getLatestCardapio = async () => {
    const response = await apiFetch('/cardapios?page=1');
    const data = response.data?.data || response.data || [];
    return data.length > 0 ? data[0] : null;
};
export const addCardapio = (file) => {
    const formData = new FormData();
    formData.append('file', file);
    return apiFetch('/cardapios', { method: 'POST', body: formData });
};
export const deleteCardapio = (id) => apiFetch(`/cardapios/${id}`, { method: 'DELETE' });
