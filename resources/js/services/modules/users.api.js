import { apiFetch } from '../http/client';
import { collectPaginated, paginationQuery } from '../http/pagination';

export const getUsers = (page = 1) => apiFetch(`/users?page=${page}`);
export const getPaginaUsers = (page = 1, limit = 15, options = {}) => apiFetch(`/users?${paginationQuery(page, limit)}`, options);
export const getTodosUsers = (options = {}) => {
    const { limit = 15, signal, maxPages, maxItems } = options;
    return collectPaginated((page, pageLimit, requestOptions) => getPaginaUsers(page, pageLimit, requestOptions), {
        limit, signal, maxPages, maxItems,
    });
};
export const addUser = (data) => apiFetch('/users', { method: 'POST', body: data });
export const updateUser = (id, data) => apiFetch(`/users/${id}`, { method: 'PUT', body: data });
export const deleteUser = (id) => apiFetch(`/users/${id}`, { method: 'DELETE' });
