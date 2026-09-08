import { apiFetch } from '../http/client';
import { paginationQuery } from '../http/pagination';

export const getChatMessagesPage = (page = 1, limit = 20, options = {}) => (
    apiFetch(`/chats?${paginationQuery(page, limit)}`, options)
);

// A chamada sem parâmetros mantém o envelope e a URL legados usados pelos consumidores antigos.
export const getChatMessages = (page = null, limit = 20, options = {}) => (
    page === null
        ? apiFetch('/chats')
        : getChatMessagesPage(page, limit, options)
);
export const sendMessage = (data) => apiFetch('/chats', { method: 'POST', body: data });
export const getChatMembers = () => apiFetch('/getMembers');
export const getChatContacts = () => apiFetch('/users?limit=100');
