import { apiFetch } from '../http/client';
import { collectPaginated, paginationQuery } from '../http/pagination';

// Necessidades
export const getPaginaNecessidades = (page = 1, limit = 100, options = {}) => apiFetch(`/necessidades?${paginationQuery(page, limit)}`, options);
export const getNecessidades = getPaginaNecessidades;
export const getTodasNecessidades = (options = {}) => {
    const { limit = 100, signal, maxPages, maxItems } = options;
    return collectPaginated((page, pageLimit, requestOptions) => getPaginaNecessidades(page, pageLimit, requestOptions), {
        limit, signal, maxPages, maxItems,
    });
};
export const getNecessidadeComAlunos = async (id) => {
    const response = await apiFetch(`/necessidades/${id}`);
    return response?.data ?? response;
};
export const addNecessidade = (nome) => apiFetch('/necessidades', { method: 'POST', body: { necessidade: nome } });
export const updateNecessidade = (id, necessidade) => apiFetch(`/necessidades/${id}`, { method: 'PUT', body: { necessidade } });
export const deleteNecessidade = (id) => apiFetch(`/necessidades/${id}`, { method: 'DELETE' });

// Alunos
export const getPaginaAlunos = (page = 1, limit = 1000, options = {}) => apiFetch(`/alunos?${paginationQuery(page, limit)}`, options);
export const getAlunos = getPaginaAlunos;
export const getTodosAlunos = (options = {}) => {
    const { limit = 1000, signal, maxPages, maxItems } = options;
    return collectPaginated((page, pageLimit, requestOptions) => getPaginaAlunos(page, pageLimit, requestOptions), {
        limit, signal, maxPages, maxItems,
    });
};
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
export const getPaginaCategorias = (page = 1, limit = 100, options = {}) => apiFetch(`/categorias?${paginationQuery(page, limit)}`, options);
export const getTodasCategorias = (options = {}) => {
    const { limit = 100, signal, maxPages, maxItems } = options;
    return collectPaginated((page, pageLimit, requestOptions) => getPaginaCategorias(page, pageLimit, requestOptions), {
        limit, signal, maxPages, maxItems,
    });
};
export const addCategoria = (nome_categoria) => apiFetch('/categorias', { method: 'POST', body: { nome_categoria } });
export const updateCategoria = (id, nome_categoria) => apiFetch(`/categorias/${id}`, { method: 'PUT', body: { nome_categoria } });
export const deleteCategoria = (id) => apiFetch(`/categorias/${id}`, { method: 'DELETE' });

// Turmas
export const getPaginaTurmas = (page = 1, limit = 100, options = {}) => apiFetch(`/turmas?${paginationQuery(page, limit)}`, options);
export const getTurmas = getPaginaTurmas;
export const getTodasTurmas = (options = {}) => {
    const { limit = 100, signal, maxPages, maxItems } = options;
    return collectPaginated((page, pageLimit, requestOptions) => getPaginaTurmas(page, pageLimit, requestOptions), {
        limit, signal, maxPages, maxItems,
    });
};
export const addTurma = (data) => apiFetch('/turmas', { method: 'POST', body: data });
export const updateTurma = (id, data) => apiFetch(`/turmas/${id}`, { method: 'PUT', body: data });
export const deleteTurma = (id) => apiFetch(`/turmas/${id}`, { method: 'DELETE' });
