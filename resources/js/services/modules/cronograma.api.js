import { apiFetch } from '../http/client';

export const getCronograma = () => apiFetch('/cronogramas');
export const removerAgendamentoDoDia = (relacaoId, diaId) => apiFetch(`/alunos-necessidades/${relacaoId}/dias`, { method: 'DELETE', body: { dias: [diaId] } });
export const agendarRelacaoNosDias = (relacaoId, dias) => apiFetch(`/alunos-necessidades/${relacaoId}/dias`, { method: 'POST', body: { dias } });
export const getDiasDaRelacao = (relacaoId) => apiFetch(`/alunos-necessidades/${relacaoId}/dias`);
