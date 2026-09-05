import { apiFetch } from '../http/client';

export const getChatMessages = () => apiFetch('/chats'); 
export const sendMessage = (data) => apiFetch('/chats', { method: 'POST', body: data });
export const getChatMembers = () => apiFetch('/getMembers');
export const getChatContacts = () => apiFetch('/users?limit=100');
