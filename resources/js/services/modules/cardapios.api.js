import { apiFetch } from '../http/client';

export const getCardapios = (page = 1) => apiFetch(`/cardapios?page=${page}`);
export const getLatestCardapio = async () => {
    const response = await apiFetch('/cardapios?page=1');
    const data = response.data?.data || response.data || [];
    return data.length > 0 ? data[0] : null;
};
export const addCardapio = (file) => {
    const formData = new FormData();
    formData.append('file', file);
    return apiFetch('/cardapios', { method: 'POST', body: formData });
};
export const deleteCardapio = (id) => apiFetch(`/cardapios/${id}`, { method: 'DELETE' });
