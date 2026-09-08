import { apiFetch } from '../http/client';
import { getSchoolDate } from '../../features/contagem/schoolCalendar';
import { collectPaginated, paginationQuery } from '../http/pagination';

export const getPaginaContagensDeHoje = (schoolDay = getSchoolDate(), page = 1, limit = 15, options = {}) => apiFetch(
    `/contagens?${paginationQuery(page, limit, { data: schoolDay })}`,
    options,
);

export const getContagensDeHoje = (schoolDay = getSchoolDate()) => {
    const hoje = schoolDay;
    return apiFetch(`/contagens?data=${hoje}`);
};

export const getTodasContagensDeHoje = (schoolDay = getSchoolDate(), options = {}) => {
    const { limit = 15, signal, maxPages, maxItems } = options;
    return collectPaginated((page, pageLimit, requestOptions) => getPaginaContagensDeHoje(schoolDay, page, pageLimit, requestOptions), {
        limit, signal, maxPages, maxItems,
    });
};

export const addContagem = (data) => {
    const body = { qtd_contagem: data.quantidade, turmas_id: data.turmaId };
    return apiFetch('/contagens', { method: 'POST', body });
};

export const updateContagem = (id, data) => {
    const body = { qtd_contagem: data.quantidade };
    return apiFetch(`/contagens/${id}`, { method: 'PUT', body });
};

export const saveContagemOperation = (payload, idempotencyKey) => apiFetch('/contagens/operacao', {
    method: 'POST',
    headers: { 'Idempotency-Key': idempotencyKey },
    body: payload,
});

export const getAlunosContagemNes = (schoolDay = null) => apiFetch(schoolDay ? `/contagem-nes?data=${schoolDay}` : '/contagem-nes');

export const getPaginaAlunosContagemNes = (schoolDay = null, page = 1, limit = 100, options = {}) => apiFetch(
    `/contagem-nes?${paginationQuery(page, limit, schoolDay ? { data: schoolDay } : {})}`,
    options,
);

export const getTodosAlunosContagemNes = (schoolDay = null, options = {}) => {
    const { limit = 100, signal, maxPages, maxItems } = options;
    return collectPaginated((page, pageLimit, requestOptions) => getPaginaAlunosContagemNes(schoolDay, page, pageLimit, requestOptions), {
        limit, signal, maxPages, maxItems,
    });
};

export const addAlunoNaContagemNes = (contagemId, alunoHasNecessidadeId) => {
    return apiFetch('/contagem-nes', {
        method: 'POST',
        body: {
            contagem_id: contagemId,
            alunos_has_necessidades_id: alunoHasNecessidadeId,
        },
    });
};

export const removeAlunoDaContagemNes = (contagemNesId) => {
    return apiFetch(`/contagem-nes/${contagemNesId}`, { 
        method: 'DELETE',
        body: {}, 
    });
};

export const getContagensDashboard = (schoolDay = null) => apiFetch(schoolDay ? `/contagens/dashboard?data=${schoolDay}` : '/contagens/dashboard');

export const getContagensPorRange = (dataInicio, dataFim) => {
    return apiFetch(`/contagens?data_inicio=${dataInicio}&data_fim=${dataFim}`);
};

export const getPaginaContagensPorRange = (dataInicio, dataFim, page = 1, limit = 15, options = {}) => apiFetch(
    `/contagens?${paginationQuery(page, limit, { data_inicio: dataInicio, data_fim: dataFim })}`,
    options,
);

export const getTodosContagensPorRange = (dataInicio, dataFim, options = {}) => {
    const { limit = 15, signal, maxPages, maxItems } = options;
    return collectPaginated((page, pageLimit, requestOptions) => getPaginaContagensPorRange(dataInicio, dataFim, page, pageLimit, requestOptions), {
        limit, signal, maxPages, maxItems,
    });
};
export const getTodasContagensPorRange = getTodosContagensPorRange;

export const getDashboardPorData = (data) => {
    return apiFetch(`/contagens/dashboard?data=${data}`); 
};

export const getAlunosNesPorData = (data) => {
    return apiFetch(`/contagem-nes?data=${data}`); 
};

export const getPaginaAlunosNesPorData = (data, page = 1, limit = 100, options = {}) => apiFetch(
    `/contagem-nes?${paginationQuery(page, limit, { data })}`,
    options,
);

export const getTodosAlunosNesPorData = (data, options = {}) => {
    const { limit = 100, signal, maxPages, maxItems } = options;
    return collectPaginated((page, pageLimit, requestOptions) => getPaginaAlunosNesPorData(data, page, pageLimit, requestOptions), {
        limit, signal, maxPages, maxItems,
    });
};
