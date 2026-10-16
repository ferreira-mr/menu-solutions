import Swal from 'sweetalert2/dist/sweetalert2.all.min.js';
import { API_BASE_URL, APP_BASE } from '../../config/apiConfig';

/**
 * Função Central de Fetch: Lida com token, erros, JSON e FormData.
 */
export const apiFetch = async (endpoint, options = {}) => {
    const token = localStorage.getItem('authToken');
    const headers = { 'Accept': 'application/json', ...options.headers };
    
    if (token) {
        headers['Authorization'] = `Bearer ${token}`;
    }

    // Se tiver corpo e não for FormData, converte para JSON
    if (options.body && !(options.body instanceof FormData)) {
        headers['Content-Type'] = 'application/json';
        options.body = JSON.stringify(options.body);
    }

    try {
        const response = await fetch(`${API_BASE_URL}${endpoint}`, { ...options, headers });

        if (response.status === 401) {
            // Se for a rota de login, não limpa o storage (deixa o componente de login lidar com o erro de credencial)
            if (!endpoint.includes('/login')) {
                localStorage.clear();
                await Swal.fire({ 
                    title: 'Sessão Expirada', 
                    text: 'Por favor, faça o login novamente.', 
                    icon: 'warning', 
                    confirmButtonColor: '#8B0000' 
                });
                window.location.href = APP_BASE ? `${APP_BASE}/` : '/';
                throw new Error('Sessão expirada.');
            }
        }

        if (!response.ok) {
            const errorData = await response.json().catch(() => ({ message: `Erro ${response.status} - ${response.statusText}` }));
            const error = new Error(errorData.message || 'Ocorreu um erro na requisição.');
            error.status = response.status;
            throw error;
        }

        if (response.status === 204) return { success: true };
        
        const contentType = response.headers.get("content-type");
        if (contentType && contentType.indexOf("application/json") !== -1) {
            return response.json();
        }
        return { success: true };
    } catch (error) {
        console.error('API Fetch Error:', error);
        throw error;
    }
};

export default apiFetch;
