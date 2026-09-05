import { apiFetch } from '../http/client';

// Necessidades
export const getNecessidades = (page = 1, limit = 100) => apiFetch(`/necessidades?page=${page}&limit=${limit}`);
export const getNecessidadeComAlunos = (id) => apiFetch(`/necessidades/${id}`);
export const addNecessidade = (nome) => apiFetch('/necessidades', { method: 'POST', body: { necessidade: nome } });
export const updateNecessidade = (id, necessidade) => apiFetch(`/necessidades/${id}`, { method: 'PUT', body: { necessidade } });
export const deleteNecessidade = (id) => apiFetch(`/necessidades/${id}`, { method: 'DELETE' });

// Alunos
export const getAlunos = (page = 1, limit = 1000) => apiFetch(`/alunos?page=${page}&limit=${limit}`);
export const addAluno = (data) => apiFetch('/alunos', { method: 'POST', body: data });
export const updateAluno = (id, data) => apiFetch(`/alunos/${id}`, { method: 'PUT', body: data });
export const deleteAluno = (id) => apiFetch(`/alunos/${id}`, { method: 'DELETE' });
export const associarNecessidadesAoAluno = (alunoId, necessidadesIds) => {
    return apiFetch(`/alunos/${alunoId}/necessidades`, { method: 'POST', body: { necessidades: necessidadesIds } });
};
export const desassociarAlunoDaNecessidade = (necessidadeId, alunoId) => {
    return apiFetch(`/necessidades/${necessidadeId}/alunos`, { method: 'DELETE', body: { alunos: [alunoId] } });
};

// Categorias
export const getCategorias = (page = 1) => apiFetch(`/categorias?page=${page}`);
export const addCategoria = (nome_categoria) => apiFetch('/categorias', { method: 'POST', body: { nome_categoria } });
export const updateCategoria = (id, nome_categoria) => apiFetch(`/categorias/${id}`, { method: 'PUT', body: { nome_categoria } });
export const deleteCategoria = (id) => apiFetch(`/categorias/${id}`, { method: 'DELETE' });

// Turmas
export const getTurmas = (page = 1, limit = 100) => apiFetch(`/turmas?page=${page}&limit=${limit}`);
export const addTurma = (data) => apiFetch('/turmas', { method: 'POST', body: data });
export const updateTurma = (id, data) => apiFetch(`/turmas/${id}`, { method: 'PUT', body: data });
export const deleteTurma = (id) => apiFetch(`/turmas/${id}`, { method: 'DELETE' });
