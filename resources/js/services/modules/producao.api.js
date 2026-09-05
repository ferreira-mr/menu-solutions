import { apiFetch } from '../http/client';

export const getProducao = () => apiFetch('/controle_de_producao');
export const addProducao = (data) => apiFetch('/controle_de_producao', { method: 'POST', body: data });
export const updateProducao = (id, data) => apiFetch(`/controle_de_producao/${id}`, { method: 'PUT', body: data });
export const deleteProducao = (id) => apiFetch(`/controle_de_producao/${id}`, { method: 'DELETE' });
