import React from 'react';
import './Footer.css';
// 1. Importe as funções dos modais que já criamos
import { showTermsModal, showPrivacyModal } from '../../../utils/modals';

// Importando todas as imagens necessárias
import msLogo from '../../../assets/img/ms.png';
import sesiSenaiLogo from '../../../assets/img/sesisenai.png';

const Footer = () => {
  return (
    <footer className="app-footer">
      <div className="footer-container">
        <div className="footer-main-row">
          <div className="footer-brand">
            <img src={msLogo} alt="Menu Solutions Logo" className="footer-ms-logo" />
            <div className="footer-brand-text">
              <h3>Menu Solutions</h3>
              <p>Sistema Integrado de Gestão da Alimentação Escolar</p>
            </div>
          </div>

          <div className="footer-partner">
            <img src={sesiSenaiLogo} alt="Logo Sesi Senai" className="sesi-senai-logo" />
          </div>
        </div>

        <div className="footer-bottom-row">
          <div className="terms-links">
            <button type="button" className="footer-link" onClick={showTermsModal}>
              Termos de Uso
            </button>
            <span className="footer-separator">|</span>
            <button type="button" className="footer-link" onClick={showPrivacyModal}>
              Política de Privacidade
            </button>
          </div>
          <div className="copyright">
            <p>© {new Date().getFullYear()} Menu Solutions • SESI/SENAI. Todos os direitos reservados.</p>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;