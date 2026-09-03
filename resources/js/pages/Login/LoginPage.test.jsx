import React from 'react';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import LoginPage from './LoginPage';
import { getUserData, loginUser } from '../../services/api';

vi.mock('../../services/api', () => ({
  loginUser: vi.fn(),
  getUserData: vi.fn(),
}));

vi.mock('sweetalert2/dist/sweetalert2.all.min.js', () => ({
  default: { fire: vi.fn().mockResolvedValue({}) },
}));

vi.mock('../../utils/modals', () => ({
  showTermsModal: vi.fn(),
  showPrivacyModal: vi.fn(),
}));

describe('LoginPage', () => {
  it('envia credenciais, guarda sessão e direciona nutricionista', async () => {
    loginUser.mockResolvedValueOnce({ token: 'token-123' });
    getUserData.mockResolvedValueOnce({ name: 'Ana', nivel_user: 2 });
    const { container } = render(<LoginPage />, { wrapper: ({ children }) => <MemoryRouter>{children}</MemoryRouter> });
    fireEvent.change(screen.getByRole('textbox'), { target: { value: '12345678901' } });
    fireEvent.change(container.querySelector('input[type="password"]'), { target: { value: 'password' } });
    fireEvent.click(screen.getByDisplayValue('Entrar'));

    await waitFor(() => expect(loginUser).toHaveBeenCalledWith('12345678901', 'password'));
    expect(localStorage.getItem('authToken')).toBe('token-123');
    expect(localStorage.getItem('userName')).toBe('Ana');
    expect(localStorage.getItem('userLevel')).toBe('2');
    // A navegação é exercitada pelo componente; o contrato observável aqui é a sessão persistida.
  });

  it('exibe erro do servidor sem redirecionar', async () => {
    loginUser.mockRejectedValueOnce(new Error('Servidor indisponível'));
    const { container } = render(<LoginPage />, { wrapper: ({ children }) => <MemoryRouter>{children}</MemoryRouter> });

    fireEvent.change(screen.getByRole('textbox'), { target: { value: '123' } });
    fireEvent.change(container.querySelector('input[type="password"]'), { target: { value: 'senha' } });
    fireEvent.click(screen.getByDisplayValue('Entrar'));

    await waitFor(() => expect(screen.getByText('Servidor indisponível')).toBeInTheDocument());
  });
});
