import { apiFetch } from '../http/client';

export const getUsers = (page = 1) => apiFetch(`/users?page=${page}`);
export const addUser = (data) => apiFetch('/users', { method: 'POST', body: data });
export const updateUser = (id, data) => apiFetch(`/users/${id}`, { method: 'PUT', body: data });
export const deleteUser = (id) => apiFetch(`/users/${id}`, { method: 'DELETE' });
