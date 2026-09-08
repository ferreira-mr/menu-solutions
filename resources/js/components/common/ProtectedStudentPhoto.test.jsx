import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import ProtectedStudentPhoto from './ProtectedStudentPhoto';
import { fetchProtectedAsset } from '../../services/api';

vi.mock('../../services/api', () => ({
  fetchProtectedAsset: vi.fn(),
}));

describe('ProtectedStudentPhoto', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.setItem('authToken', 'token-do-teste');
    vi.stubGlobal('URL', {
      createObjectURL: vi.fn()
        .mockReturnValueOnce('blob:primeira')
        .mockReturnValueOnce('blob:segunda'),
      revokeObjectURL: vi.fn(),
    });
    fetchProtectedAsset.mockResolvedValue(new Blob(['foto'], { type: 'image/png' }));
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('carrega a foto com endpoint autenticado e revoga object URLs na troca e desmontagem', async () => {
    const { rerender, unmount } = render(
      <ProtectedStudentPhoto
        aluno={{ id: 7, foto: 'foto.png' }}
        fallback="/avatar.png"
        alt="Ana"
      />,
    );

    await waitFor(() => expect(screen.getByAltText('Ana')).toHaveAttribute('src', 'blob:primeira'));
    expect(fetchProtectedAsset).toHaveBeenCalledWith('/api/alunos/7/foto', expect.objectContaining({ signal: expect.any(AbortSignal) }));

    rerender(
      <ProtectedStudentPhoto
        aluno={{ id: 8, foto_url: '/api/alunos/8/foto' }}
        fallback="/avatar.png"
        alt="Ana"
      />,
    );

    await waitFor(() => expect(screen.getByAltText('Ana')).toHaveAttribute('src', 'blob:segunda'));
    expect(URL.revokeObjectURL).toHaveBeenCalledWith('blob:primeira');

    unmount();
    expect(URL.revokeObjectURL).toHaveBeenCalledWith('blob:segunda');
  });

  it('mantém o fallback quando o aluno não tem foto', () => {
    render(<ProtectedStudentPhoto aluno={{ id: 7 }} fallback="/avatar.png" alt="Sem foto" />);

    expect(screen.getByAltText('Sem foto')).toHaveAttribute('src', '/avatar.png');
    expect(fetchProtectedAsset).not.toHaveBeenCalled();
  });
});
