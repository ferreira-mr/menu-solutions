import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, Outlet } from 'react-router-dom';

// Importações de Constantes e Layout
import { ROLE_NAMES, ROLE_HOME_ROUTES } from './constants/roles';
import MainLayout from './layouts/MainLayout/MainLayout';

// Importações de Features (Feature-Driven Architecture)
import { LoginPage } from './features/auth';
import { ContagemPage, ContagemGeralPage } from './features/contagem';
import { ControleProducaoPage } from './features/producao';
import { AutorizadosPage } from './features/autorizados';
import { CardapiosPage, ViewCardapioPage } from './features/cardapios';
import { ChatPage } from './features/chat';
import { CronogramaPage } from './features/cronograma';
import { PlanejamentoPage } from './features/planejamento';
import { CategoriasPage } from './features/escolar';
import { UsuariosPage } from './features/usuarios';
import { DashboardNutri } from './features/dashboard';

// Páginas Compartilhadas
import InicioPage from './pages/Inicio/InicioPage';
import ProfilePage from './pages/ProfilePage/ProfilePage';

const PrivateRoute = ({ children, requiredRole }) => {
  const token = localStorage.getItem('authToken');
  const userLevel = localStorage.getItem('userLevel');
  const userRole = ROLE_NAMES[userLevel];
  
  if (!token || userRole !== requiredRole) {
    return <Navigate to="/" replace />;
  }
  return children;
};

const PublicRoute = ({ children }) => {
  const token = localStorage.getItem('authToken');
  const userLevel = localStorage.getItem('userLevel');
  if (token && userLevel) {
    const redirectTo = ROLE_HOME_ROUTES[userLevel] || '/';
    return <Navigate to={redirectTo} replace />;
  }
  return children;
};

// Shell com Layout aninhado para cada papel operacional
const RoleShell = ({ role }) => (
  <PrivateRoute requiredRole={role}>
    <MainLayout userRole={role}>
      <Outlet />
    </MainLayout>
  </PrivateRoute>
);

function App() {
  return (
    <Router>
      <Routes>
        {/* ROTA PÚBLICA */}
        <Route path="/" element={<PublicRoute><LoginPage /></PublicRoute>} />
        
        {/* ================== ROTAS DA INSPETORA ================== */}
        <Route element={<RoleShell role="inspetora" />}>
          <Route path="/inspetora/inicio" element={<InicioPage userRole="inspetora" />} />
          <Route path="/nova-contagem" element={<ContagemPage />} />
          <Route path="/cardapio" element={<ViewCardapioPage />} />
          <Route path="/inspetora/autorizados" element={<AutorizadosPage />} />
          <Route path="/inspetora/perfil" element={<ProfilePage />} />
          <Route path="/inspetora/chat" element={<ChatPage />} />
        </Route>

        {/* ================== ROTAS DA NUTRICIONISTA ================== */}
        <Route element={<RoleShell role="nutri" />}>
          <Route path="/nutri/dashboard" element={<DashboardNutri />} />
          <Route path="/nutri/relatorio-geral" element={<ContagemGeralPage />} />
          <Route path="/nutri/inicio" element={<InicioPage userRole="nutri" />} />
          <Route path="/nutri/controle-producao" element={<ControleProducaoPage />} />
          <Route path="/nutri/gerenciar/categorias" element={<CategoriasPage />} />
          <Route path="/nutri/gerenciar/usuarios" element={<UsuariosPage />} />
          <Route path="/nutri/cronograma" element={<CronogramaPage />} />
          <Route path="/nutri/planejamento" element={<PlanejamentoPage />} />
          <Route path="/nutri/cardapios" element={<CardapiosPage />} />
          <Route path="/nutri/autorizados" element={<AutorizadosPage />} />
          <Route path="/nutri/perfil" element={<ProfilePage />} />
          <Route path="/nutri/chat" element={<ChatPage />} />
        </Route>

        {/* ================== ROTAS DA DIRETORA ================== */}
        <Route element={<RoleShell role="diretora" />}>
          <Route path="/diretora/inicio" element={<InicioPage userRole="diretora" />} />
          <Route path="/diretora/dashboard" element={<DashboardNutri />} />
          <Route path="/diretora/controle-producao" element={<ControleProducaoPage />} />
          <Route path="/diretora/relatorio-geral" element={<ContagemGeralPage />} />
          <Route path="/diretora/gerenciar/categorias" element={<CategoriasPage />} />
          <Route path="/diretora/gerenciar/usuarios" element={<UsuariosPage />} />
          <Route path="/diretora/cardapios" element={<CardapiosPage />} />
          <Route path="/diretora/chat" element={<ChatPage />} />
          <Route path="/diretora/cronograma" element={<CronogramaPage />} />
          <Route path="/diretora/autorizados" element={<AutorizadosPage />} />
          <Route path="/diretora/planejamento" element={<PlanejamentoPage />} />
          <Route path="/diretora/perfil" element={<ProfilePage />} />
        </Route>

        {/* Redirecionamento de rotas desconhecidas para a raiz */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Router>
  );
}

export default App;
