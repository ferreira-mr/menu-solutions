import { showTermsModal, showPrivacyModal } from './modals';
import Swal from 'sweetalert2/dist/sweetalert2.all.min.js';

vi.mock('sweetalert2/dist/sweetalert2.all.min.js', () => ({
  default: {
    fire: vi.fn(),
  },
}));

describe('Modals de Termos e Privacidade', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('showTermsModal dispara SweetAlert com termos de uso', () => {
    showTermsModal();
    expect(Swal.fire).toHaveBeenCalledWith(
      expect.objectContaining({
        title: '<strong>Termos de Uso</strong>',
      })
    );
  });

  it('showPrivacyModal dispara SweetAlert com politica de privacidade', () => {
    showPrivacyModal();
    expect(Swal.fire).toHaveBeenCalledWith(
      expect.objectContaining({
        title: '<strong>Política de Privacidade</strong>',
      })
    );
  });
});
