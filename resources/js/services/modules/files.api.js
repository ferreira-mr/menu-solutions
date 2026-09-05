import { apiFetch } from '../http/client';

export const uploadFile = (file) => {
    const formData = new FormData();
    formData.append('file', file);
    return apiFetch('/upload', { method: 'POST', body: formData });
};
