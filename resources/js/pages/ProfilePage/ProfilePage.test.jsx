import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import ProfilePage from './ProfilePage';
import * as api from '../../services/api';

vi.mock('../../services/api', () => ({
  getUserData: vi.fn(),
  updateUserData: vi.fn(),
  changePassword: vi.fn(),
  uploadFile: vi.fn(),
}));

describe('ProfilePage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    api.getUserData.mockResolvedValue({
      data: {
        id: 1,
        name: 'Jaqueline Nutricionista',
        nif: '22222222222',
        nivel_user: 2,
      },
    });
  });

  it('carrega dados do usuário autenticado no formulário de perfil', async () => {
    render(
      <MemoryRouter>
        <ProfilePage />
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getByDisplayValue('Jaqueline Nutricionista')).toBeInTheDocument();
      expect(screen.getByDisplayValue('22222222222')).toBeInTheDocument();
    });
  });
});
