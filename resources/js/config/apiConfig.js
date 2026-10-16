// Detecta se a aplicação está rodando sob um subdiretório (ex.: /sgc) ou na raiz.
const getAppBase = () => {
    if (typeof document !== 'undefined') {
        const meta = document.querySelector('meta[name="app-base"]');
        if (meta && meta.content) {
            return meta.content.replace(/\/+$/, '');
        }
    }
    if (typeof window !== 'undefined' && window.location.pathname.startsWith('/sgc')) {
        return '/sgc';
    }
    return '';
};

export const APP_BASE = getAppBase();

// URLs relativas funcionam em desenvolvimento, homologação e produção com suporte a subdiretório.
export const API_BASE_URL = `${APP_BASE}/api`;

export const PUBLIC_STORAGE_URL = `${APP_BASE}/uploads/pdf`;

export const PUBLIC_STORAGE_URL2 = `${APP_BASE}/uploads`;

