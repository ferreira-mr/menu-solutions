import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import './Header.css';

import setas from '../../../assets/img/setas.png';
import setas2 from '../../../assets/img/setas2.png'; // Nova imagem
import logo from '../../../assets/img/menu.png';

const Header = ({ onMenuClick, onLogoClick, userRole, isMenuOpen }) => {
    const navigate = useNavigate();
    const location = useLocation();

    // Rotas de entrada/início onde o botão voltar não deve ser exibido
    const HOME_ROUTES = [
        '/dashboard',
        '/inspetora/inicio',
        '/nutri/dashboard',
        '/nutri/inicio',
        '/diretora/inicio',
    ];
    const showBackButton = !HOME_ROUTES.includes(location.pathname);
    const iconeClasses = `bi bi-list ${isMenuOpen ? 'girar' : ''}`;

    const handleLogoClick = () => {
        if (onLogoClick) {
            onLogoClick();
        } else {
            navigate(-1);
        }
    };

    return (
        <header className="header">
            {/* Seção Esquerda (Vermelha) */}
            <div className="header-section header-left">
                {showBackButton && (
                    <button className="header-back-button" onClick={() => navigate(-1)} title="Voltar" aria-label="Voltar à página anterior">
                        <i className="bi bi-arrow-left" aria-hidden="true"></i>
                    </button>
                )}
            </div>

            {/* Seção Central (Branca com Logos) */}
            <div className="header-section header-center">
                <img src={setas} alt="" className="setas-flanco" aria-hidden="true" />
                <img 
                    src={logo} 
                    alt="Logo" 
                    className="logo-principal" 
                    style={{ cursor: 'pointer' }} 
                    onClick={handleLogoClick} 
                />
                <img src={setas2} alt="" className="setas-flanco" aria-hidden="true" />
            </div>

            {/* Seção Direita (Vermelha) */}
            <div className="header-section header-right">
                {userRole === 'inspetora' && (
                    <div className="notificacao">
                        <span id="notificacao-badge" style={{ display: 'none' }}></span>
                    </div>
                )}
                <button 
                    className="menu-hamburguer" 
                    onClick={onMenuClick}
                    aria-expanded={isMenuOpen}
                >
                    <i id="iconeMenu" className={iconeClasses} aria-hidden="true"></i>
                </button>
            </div>
        </header>
    );
};

export default Header;