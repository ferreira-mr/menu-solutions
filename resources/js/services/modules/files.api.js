import { apiFetch } from '../http/client';
import { API_BASE_URL } from '../../config/apiConfig';

export const uploadAlunoFoto = (alunoId, file) => {
    const formData = new FormData();
    formData.append('file', file);
    return apiFetch(`/alunos/${alunoId}/foto`, { method: 'POST', body: formData });
};

// Mantém o nome legado, mas agora exige o vínculo explícito ao aluno.
export const uploadFile = (file, alunoId) => {
    if (!alunoId) throw new Error('O upload precisa estar vinculado a um aluno.');

    const formData = new FormData();
    formData.append('file', file);
    formData.append('aluno_id', String(alunoId));
    return apiFetch('/upload', { method: 'POST', body: formData });
};

export const fetchProtectedAsset = async (assetUrl, options = {}) => {
    const token = localStorage.getItem('authToken');
    const headers = { Accept: '*/*', ...options.headers };
    if (token) headers.Authorization = `Bearer ${token}`;

    const requestUrl = assetUrl.startsWith('http')
        ? assetUrl
        : assetUrl.startsWith('/api/') ? assetUrl : `${API_BASE_URL}${assetUrl}`;
    const response = await fetch(requestUrl, { ...options, headers });

    if (!response.ok) {
        throw new Error(`Não foi possível carregar o arquivo (${response.status}).`);
    }

    return response.blob();
};
