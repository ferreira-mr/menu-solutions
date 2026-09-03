import { setupServer } from 'msw/node';

// Os testes de componentes podem sobrescrever estes handlers com `server.use`.
// Manter o servidor ativo evita chamadas acidentais à rede durante a suíte.
export const server = setupServer();
