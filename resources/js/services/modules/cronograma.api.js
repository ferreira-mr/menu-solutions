import { apiFetch } from '../http/client';
import { collectPaginated, paginationQuery } from '../http/pagination';

export const removerAgendamentoDoDia = (relacaoId, diaId) => apiFetch(`/alunos-necessidades/${relacaoId}/dias`, { method: 'DELETE', body: { dias: [diaId] } });
export const agendarRelacaoNosDias = (relacaoId, dias) => apiFetch(`/alunos-necessidades/${relacaoId}/dias`, { method: 'POST', body: { dias } });

const positiveInteger = (value) => {
    const number = Number(value);
    return Number.isSafeInteger(number) && number > 0 ? number : null;
};

const normalizeAppointment = (appointment, dayId) => {
    const relation = appointment?.aluno_has_necessidade;
    const agendamentoId = positiveInteger(appointment?.id);
    const relacaoId = positiveInteger(appointment?.alunos_has_necessidades_id ?? relation?.id);
    const cronogramaId = positiveInteger(appointment?.cronograma_id ?? dayId);
    const alunoId = positiveInteger(relation?.alunos_id);
    const necessidadeId = positiveInteger(relation?.necessidades_id);

    if (!relation || !agendamentoId || !relacaoId || !cronogramaId || !alunoId || !necessidadeId) {
        console.error('Agendamento de cronograma ignorado: relação aluno+necessidade incompleta.', appointment);
        return null;
    }

    return {
        agendamento_id: agendamentoId,
        relacao_id: relacaoId,
        cronograma_id: cronogramaId,
        aluno_id: alunoId,
        necessidade_id: necessidadeId,
        aluno: relation.aluno ?? null,
        necessidade: relation.necessidade ?? null,
    };
};

const normalizeDay = (day) => ({
    ...day,
    alunos: Array.isArray(day?.alunos)
        ? day.alunos.map((appointment) => normalizeAppointment(appointment, day?.id)).filter(Boolean)
        : [],
});

const normalizeCronogramaResponse = (response) => {

    if (!Array.isArray(response?.data)) return response;

    return {
        ...response,
        data: response.data.map(normalizeDay),
    };
};

export const getPaginaCronograma = async (page = 1, limit = 15, options = {}) => normalizeCronogramaResponse(
    await apiFetch(`/cronogramas?${paginationQuery(page, limit)}`, options),
);

export const getCronograma = async () => normalizeCronogramaResponse(await apiFetch('/cronogramas'));

export const getTodosCronograma = (options = {}) => {
    const { limit = 15, signal, maxPages, maxItems } = options;
    return collectPaginated((page, pageLimit, requestOptions) => getPaginaCronograma(page, pageLimit, requestOptions), {
        limit, signal, maxPages, maxItems,
    });
};
