import React from 'react';
import { render } from '@testing-library/react';
import DashboardWelcomeModal from './DashboardWelcomeModal';
import Swal from 'sweetalert2/dist/sweetalert2.all.min.js';

vi.mock('sweetalert2/dist/sweetalert2.all.min.js', () => ({
  default: {
    fire: vi.fn(),
  },
}));

describe('DashboardWelcomeModal', () => {
  beforeEach(() => {
    localStorage.clear();
    vi.clearAllMocks();
  });

  it('exibe modal de boas vindas na primeira visita', () => {
    localStorage.setItem('userName', 'Jaqueline');
    render(<DashboardWelcomeModal />);

    expect(Swal.fire).toHaveBeenCalledWith(
      expect.objectContaining({
        titleText: 'Olá, Jaqueline!',
      })
    );
  });

  it('não reexibe modal se já foi visualizado anteriormente', () => {
    localStorage.setItem('welcomeNutriShown', 'true');
    render(<DashboardWelcomeModal />);

    expect(Swal.fire).not.toHaveBeenCalled();
  });
});
