/**
 * Unified API Entry Point (Menu Solutions / Contador V2)
 *
 * Re-exports all domain-specific API clients for seamless modularity
 * and 100% backward compatibility with existing components and test mocks.
 */

export { apiFetch, default as client } from './http/client';
export * from './modules/auth.api';
export * from './modules/users.api';
export * from './modules/cardapios.api';
export * from './modules/autorizados.api';
export * from './modules/producao.api';
export * from './modules/cronograma.api';
export * from './modules/escolar.api';
export * from './modules/contagens.api';
export * from './modules/contextoEscolar.api';
export * from './modules/chat.api';
export * from './modules/files.api';
