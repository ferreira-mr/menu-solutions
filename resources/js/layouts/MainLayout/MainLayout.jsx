import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useLocation, Outlet } from 'react-router-dom';
import Swal from '../../utils/sweetAlert';
import { logoutUser, getUserData } from '../../services/api';
import { useSchoolCalendar } from '../../features/contagem/useSchoolCalendar';

import Header from '../../components/common/Header/Header';
import Footer from '../../components/common/Footer/Footer';

// --- IMPORTS DOS NAVS ---
import InspetoraNav from '../../components/navigation/InspetoraNav/InspetoraNav';
import NutriNav from '../../components/navigation/NutriNav/NutriNav';
import DiretoraNav from '../../components/navigation/DiretoraNav/DiretoraNav';
import { ROLE_HOME_ROUTES } from '../../constants/roles';

import './MainLayout.css';
import background from '../../assets/img/main.jpg';

const MainLayout = ({ userRole, children }) => {
    const [isMenuOpen, setIsMenuOpen] = useState(false);
    const [usuario, setUsuario] = useState('Carregando...');
    const [dataAtual, setDataAtual] = useState('');
    const { schoolDay } = useSchoolCalendar();

    const location = useLocation();   
    const isChatPage = location.pathname.includes('chat'); 

    const navigate = useNavigate();
    const navRef = useRef(null);

    // Função que REALMENTE faz o logout
    const handleFinalLogout = async (showSuccess = true) => {
        try {
            await logoutUser();
            if (showSuccess) {
                // Opcional: alerta de sucesso
            }
        } catch (error) {
            console.error("Erro na API de logout, mas deslogando localmente.", error);
        } finally {
            localStorage.clear();
            navigate('/');
        }
    };

    // Efeito para fechar o menu na navegação de rota
    useEffect(() => {
        setIsMenuOpen(false);
    }, [location.pathname]);

    // Efeito para buscar dados do usuário na montagem e ouvir atualizações de perfil
    useEffect(() => {
        const fetchUserData = async () => {
            try {
                const data = await getUserData();
                const userName = data?.data?.name || data?.name || localStorage.getItem('userName') || 'Usuário';
                setUsuario(userName);
            } catch (error) {
                console.error("Não foi possível buscar os dados do usuário. Forçando logout.", error);
                handleFinalLogout(false); 
            }
        };

        fetchUserData();

        const handleUserUpdated = () => {
            const storedName = localStorage.getItem('userName');
            if (storedName) {
                setUsuario(storedName);
            } else {
                fetchUserData();
            }
        };

        window.addEventListener('user:updated', handleUserUpdated);
        return () => window.removeEventListener('user:updated', handleUserUpdated);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    // Efeito para formatar a data escolar corrente
    useEffect(() => {
        if (schoolDay) {
            const dataFormatada = schoolDay.split('-').reverse().join('/');
            setDataAtual(dataFormatada);
        }
    }, [schoolDay]);

    // Efeito para fechar o menu ao clicar fora
    useEffect(() => {
        const handleClickOutside = (event) => {
            if (isMenuOpen && navRef.current && !navRef.current.contains(event.target)) {
                setIsMenuOpen(false);
            }
        };
        if (isMenuOpen) {
            document.addEventListener('mousedown', handleClickOutside);
        }
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, [isMenuOpen]);

    const toggleMenu = () => setIsMenuOpen(!isMenuOpen);
    const closeMenu = () => setIsMenuOpen(false);

    const confirmLogout = () => {
        setIsMenuOpen(false);
        Swal.fire({
            title: 'Você tem certeza?',
            text: "Você será desconectado do sistema.",
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: '#8B0000',
            cancelButtonColor: '#6c757d',
            confirmButtonText: 'Sim, quero sair!',
            cancelButtonText: 'Cancelar'
        }).then((result) => {
            if (result.isConfirmed) {
                handleFinalLogout();
            }
        });
    };

    return (
        <div className="app-container">
            <Header 
                onMenuClick={toggleMenu} 
                onLogoClick={() => {
                    const userLevel = localStorage.getItem('userLevel');
                    const homeRoute = ROLE_HOME_ROUTES[userLevel] || '/';
                    navigate(homeRoute);
                }}
                userRole={userRole}
                isMenuOpen={isMenuOpen}
            />
            
            {/* --- 2. ÁREA DOS MENUS ATUALIZADA --- */}
            <div ref={navRef}>
                {userRole === 'inspetora' && (
                    <InspetoraNav
                        isOpen={isMenuOpen}
                        usuario={usuario}
                        dataSelecionada={dataAtual}
                        onLogout={confirmLogout}
                        onCloseMenu={closeMenu}
                    />
                )}

                {userRole === 'nutri' && (
                    <NutriNav
                        isOpen={isMenuOpen}
                        usuario={usuario}
                        dataSelecionada={dataAtual}
                        onLogout={confirmLogout}
                        onCloseMenu={closeMenu}
                    />
                )}

                {userRole === 'diretora' && (
                    <DiretoraNav
                        isOpen={isMenuOpen}
                        usuario={usuario}
                        dataSelecionada={dataAtual}
                        onLogout={confirmLogout}
                        onCloseMenu={closeMenu}
                    />
                )}
            </div>

            <main 
                className="main-content" 
                style={{ backgroundImage: `url(${background})` }}
                key={location.pathname} 
            >
                {children || <Outlet />}
            </main>

            {!isChatPage && <Footer />}
        </div>
        
    );
};

export default MainLayout;
