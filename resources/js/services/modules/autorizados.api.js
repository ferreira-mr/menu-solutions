import { apiFetch } from '../http/client';

export const getAutorizados = () => apiFetch('/autorizados');
export const addAutorizado = (data) => apiFetch('/autorizados', { method: 'POST', body: { ...data, status: 'pendente' } });
export const updateAutorizado = (id, data) => apiFetch(`/autorizados/${id}`, { method: 'PUT', body: data });
export const deleteAutorizado = (id) => apiFetch(`/autorizados/${id}`, { method: 'DELETE' });
export const updateConteudoAutorizado = (id, data) => apiFetch(`/autorizados/update/${id}`, { method: 'PUT', body: data });
