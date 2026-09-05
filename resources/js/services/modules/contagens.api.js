import { apiFetch } from '../http/client';

export const getContagensDeHoje = () => {
    const hoje = new Date().toISOString().slice(0, 10);
    return apiFetch(`/contagens?data=${hoje}`);
};

export const addContagem = (data) => {
    const body = { qtd_contagem: data.quantidade, turmas_id: data.turmaId };
    return apiFetch('/contagens', { method: 'POST', body });
};

export const updateContagem = (id, data) => {
    const body = { qtd_contagem: data.quantidade };
    return apiFetch(`/contagens/${id}`, { method: 'PUT', body });
};

export const getAlunosContagemNes = () => apiFetch('/contagem-nes');

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

export const getContagensDashboard = () => apiFetch('/contagens/dashboard');

export const getContagensPorRange = (dataInicio, dataFim) => {
    return apiFetch(`/contagens?data_inicio=${dataInicio}&data_fim=${dataFim}`);
};

export const getDashboardPorData = (data) => {
    return apiFetch(`/contagens/dashboard?data=${data}`); 
};

export const getAlunosNesPorData = (data) => {
    return apiFetch(`/contagem-nes?data=${data}`); 
};
