import { apiFetch } from '../http/client';
import { collectPaginated, paginationQuery } from '../http/pagination';

export const getAutorizados = () => apiFetch('/autorizados');
export const getPaginaAutorizados = (page = 1, limit = 20, options = {}) => apiFetch(`/autorizados?${paginationQuery(page, limit)}`, options);
export const getTodosAutorizados = (options = {}) => {
    const { limit = 20, signal, maxPages, maxItems } = options;
    return collectPaginated((page, pageLimit, requestOptions) => getPaginaAutorizados(page, pageLimit, requestOptions), {
        limit, signal, maxPages, maxItems,
    });
};
export const addAutorizado = (data) => apiFetch('/autorizados', { method: 'POST', body: data });
export const updateAutorizado = (id, data) => apiFetch(`/autorizados/${id}`, { method: 'PUT', body: data });
export const deleteAutorizado = (id) => apiFetch(`/autorizados/${id}`, { method: 'DELETE' });
export const updateConteudoAutorizado = (id, data) => apiFetch(`/autorizados/update/${id}`, { method: 'PUT', body: data });
