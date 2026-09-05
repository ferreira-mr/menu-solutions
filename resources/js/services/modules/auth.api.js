import { apiFetch } from '../http/client';

export const loginUser = (nif, password) => apiFetch('/login', { method: 'POST', body: { nif, password } });
export const logoutUser = () => apiFetch('/logout', { method: 'POST' });
export const getUserData = () => apiFetch('/user');
export const updateUserData = (userId, data) => apiFetch(`/users/${userId}`, { method: 'PUT', body: data });
export const changePassword = (data) => apiFetch('/reset-password', { method: 'POST', body: data });
