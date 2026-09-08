import { apiFetch } from '../http/client';
import { collectPaginated, paginationQuery } from '../http/pagination';

export const getProducao = () => apiFetch('/controle_de_producao');
export const getPaginaProducao = (page = 1, limit = 15, filters = {}, options = {}) => apiFetch(
    `/controle_de_producao?${paginationQuery(page, limit, filters)}`,
    options,
);
export const getTodosProducao = (options = {}) => {
    const { limit = 15, signal, maxPages, maxItems, ...filters } = options;
    return collectPaginated((page, pageLimit, requestOptions) => getPaginaProducao(page, pageLimit, filters, requestOptions), {
        limit, signal, maxPages, maxItems,
    });
};
export const addProducao = (data) => apiFetch('/controle_de_producao', { method: 'POST', body: data });
export const updateProducao = (id, data) => apiFetch(`/controle_de_producao/${id}`, { method: 'PUT', body: data });
export const deleteProducao = (id) => apiFetch(`/controle_de_producao/${id}`, { method: 'DELETE' });
