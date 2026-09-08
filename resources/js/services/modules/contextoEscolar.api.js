import { apiFetch } from '../http/client';

export const getContextoEscolar = () => apiFetch('/contexto-escolar');
