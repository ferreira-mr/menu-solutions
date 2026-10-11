import React from 'react';
import { Link } from 'react-router-dom';
import '../InspetoraNav/InspetoraNav.css'; // Usando o mesmo CSS para manter padrão

const NutriNav = ({ isOpen, usuario, dataSelecionada, onLogout, onCloseMenu }) => {
  const menuClasses = isOpen ? 'menu-lateral aberto' : 'menu-lateral';

  // Lista de itens atualizada conforme sua solicitação
  const menuItems = [
    // Botão Início (Dashboard principal da nutri)
    { texto: 'Início', icone: 'bi bi-house-door-fill', rota: '/nutri/dashboard' },
    
    // Itens da lista fornecida
    { texto: 'Controle de Produção', icone: 'bi bi-graph-up', rota: '/nutri/controle-producao' },
    { texto: 'Contagem Geral', icone: 'bi bi-calendar-check', rota: '/nutri/relatorio-geral' },
    { texto: 'Turmas e Categorias', icone: 'bi bi-people-fill', rota: '/nutri/gerenciar/categorias' },
    { texto: 'Cardápio', icone: 'bi bi-journal-richtext', rota: '/nutri/cardapios' },
    { texto: 'Chat', icone: 'bi bi-chat-dots-fill', rota: '/nutri/chat' },
    { texto: 'Gerenciar Usuários', icone: 'bi bi-person-video2', rota: '/nutri/gerenciar/usuarios' },
    { texto: 'Cronograma', icone: 'bi bi-calendar-week-fill', rota: '/nutri/cronograma' },
    { texto: 'Autorizados Direção', icone: 'bi bi-file-earmark-check-fill', rota: '/nutri/autorizados' },
    { texto: 'Dietas Especiais (NES)', icone: 'bi bi-card-checklist', rota: '/nutri/planejamento' },
    { texto: 'Meu Perfil', icone: 'bi bi-person-circle', rota: '/nutri/perfil' },
  ];

  return (
    <nav className={menuClasses} aria-label="Menu principal da nutricionista">
      <div className="nome-usuario-container">
        <span>{usuario}</span>
      </div>
      <hr />
      <div className="nome-usuario-container">
        <small style={{ fontSize: '0.8rem', opacity: 0.8 }}></small><br/>
        <span>{dataSelecionada}</span>
      </div>
      <hr />
      
      <ul className="opcoes">
        {menuItems.map((item, index) => (
          <li key={index} onClick={onCloseMenu}>
            <Link to={item.rota}>
              <i className={item.icone} aria-hidden="true"></i>
              &nbsp;&nbsp;{item.texto}
            </Link>
          </li>
        ))}
      </ul>

      {/* Botão de Sair */}
      <button type="button" className="sair" onClick={onLogout} aria-label="Sair do sistema">
        <i className="bi bi-box-arrow-right" aria-hidden="true"></i>&nbsp;&nbsp;Sair
      </button>
    </nav>
  );
};

export default NutriNav;