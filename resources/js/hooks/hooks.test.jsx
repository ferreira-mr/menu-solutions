import { renderHook, act, waitFor } from '@testing-library/react';
import { usePermissions } from './usePermissions';
import { useAuth } from './useAuth';
import * as api from '../services/api';

vi.mock('../services/api', () => ({
  getUserData: vi.fn(),
  logoutUser: vi.fn(),
}));

describe('Custom Hooks (usePermissions & useAuth)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.clear();
    api.getUserData.mockResolvedValue({ id: 1, name: 'Usuário Teste' });
    api.logoutUser.mockResolvedValue({});
  });

  describe('usePermissions', () => {
    it('retorna permissões corretas para Inspetora (nível 1)', () => {
      localStorage.setItem('userLevel', '1');
      const { result } = renderHook(() => usePermissions());

      expect(result.current.isStaff).toBe(true);
      expect(result.current.isNutri).toBe(false);
      expect(result.current.isDiretora).toBe(false);
      expect(result.current.canCount).toBe(true);
      expect(result.current.canCreateAutorizado).toBe(false);
    });

    it('retorna permissões corretas para Nutricionista (nível 2)', () => {
      localStorage.setItem('userLevel', '2');
      const { result } = renderHook(() => usePermissions());

      expect(result.current.isStaff).toBe(false);
      expect(result.current.isNutri).toBe(true);
      expect(result.current.canCreateAutorizado).toBe(true);
      expect(result.current.canApproveAutorizado).toBe(false);
      expect(result.current.canManageCatalog).toBe(true);
    });

    it('retorna permissões corretas para Diretora (nível 3)', () => {
      localStorage.setItem('userLevel', '3');
      const { result } = renderHook(() => usePermissions());

      expect(result.current.isDiretora).toBe(true);
      expect(result.current.canApproveAutorizado).toBe(true);
      expect(result.current.canCreateAutorizado).toBe(false);
    });
  });

  describe('useAuth', () => {
    it('carrega dados do usuário quando há token armazenado', async () => {
      localStorage.setItem('authToken', 'token-abc');
      localStorage.setItem('userLevel', '2');
      api.getUserData.mockResolvedValue({ id: 1, name: 'Jaqueline Nutri' });

      const { result } = renderHook(() => useAuth());

      expect(result.current.role).toBe('nutri');
      expect(result.current.isNutri).toBe(true);

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });
      expect(result.current.user).toEqual({ id: 1, name: 'Jaqueline Nutri' });
    });

    it('executa logout com limpeza do storage', async () => {
      localStorage.setItem('authToken', 'token-abc');
      api.logoutUser.mockResolvedValue({});

      const { result } = renderHook(() => useAuth());

      await act(async () => {
        await result.current.logout();
      });

      expect(localStorage.getItem('authToken')).toBeNull();
    });
  });
});
