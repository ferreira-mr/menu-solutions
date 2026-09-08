import { renderHook, waitFor } from '@testing-library/react';
import * as api from '../../services/api';
import { useSchoolCalendar } from './useSchoolCalendar';

vi.mock('../../services/api', () => ({
    getContextoEscolar: vi.fn(),
}));

describe('useSchoolCalendar', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('revalida o contexto quando a aba volta a ficar visível', async () => {
        api.getContextoEscolar
            .mockResolvedValueOnce({ data: { data_atual: '2026-09-07', timezone: 'America/Sao_Paulo', agora: '2026-09-08T02:59:59Z' } })
            .mockResolvedValueOnce({ data: { data_atual: '2026-09-08', timezone: 'America/Sao_Paulo', agora: '2026-09-08T03:00:00Z' } });

        const { result } = renderHook(() => useSchoolCalendar());

        await waitFor(() => expect(result.current.schoolDay).toBe('2026-09-07'));
        Object.defineProperty(document, 'visibilityState', { configurable: true, value: 'visible' });
        document.dispatchEvent(new Event('visibilitychange'));

        await waitFor(() => expect(result.current.schoolDay).toBe('2026-09-08'));
        expect(api.getContextoEscolar).toHaveBeenCalledTimes(2);
    });
});
