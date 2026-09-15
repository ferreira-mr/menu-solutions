/**
 * SweetAlert2 Theme — Menu Solutions / Contador V2
 *
 * Configuração visual centralizada do SweetAlert2 para garantir
 * consistência com o design system (variables.css).
 *
 * Uso:
 *   import { swalConfirm, swalDanger } from '../../utils/swalTheme';
 *   Swal.fire({ ...swalConfirm, title: 'Sucesso!' });
 */

/** Preset para ações de confirmação (ex: salvar, enviar) */
export const swalConfirm = {
  confirmButtonColor: '#27ae60',
  cancelButtonColor: '#6c757d',
};

/** Preset para ações destrutivas (ex: logout, excluir) */
export const swalDanger = {
  confirmButtonColor: '#8B0000',
  cancelButtonColor: '#6c757d',
};

/** Preset para mensagens de sucesso rápido (timer + sem botão) */
export const swalSuccess = {
  icon: 'success',
  timer: 1500,
  showConfirmButton: false,
  allowOutsideClick: false,
};

/** Preset para erros */
export const swalError = {
  icon: 'error',
  confirmButtonColor: '#8B0000',
  confirmButtonText: 'OK',
};
