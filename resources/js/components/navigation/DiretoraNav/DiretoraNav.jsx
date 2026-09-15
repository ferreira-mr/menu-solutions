import React from 'react';
import { Link } from 'react-router-dom';
import '../InspetoraNav/InspetoraNav.css'; // Reaproveitando o CSS padrão

const DiretoraNav = ({ isOpen, usuario, dataSelecionada, onLogout, onCloseMenu }) => {
  const menuClasses = isOpen ? 'menu-lateral aberto' : 'menu-lateral';

  const menuItems = [
    // Botão Início (Adicionado para garantir o retorno à Home)
    { texto: 'Início', icone: 'bi bi-house-door-fill', rota: '/diretora/inicio' },
    
    // Itens específicos da Diretora
    { texto: 'Contagem Geral', icone: 'bi bi-calendar-check', rota: '/diretora/relatorio-geral' },
    { texto: 'Cardápio', icone: 'bi bi-journal-richtext', rota: '/diretora/cardapio' },
    { texto: 'Chat', icone: 'bi bi-chat-dots-fill', rota: '/diretora/chat' },
    { texto: 'Gerenciar Usuários', icone: 'bi bi-person-video2', rota: '/diretora/gerenciar/usuarios' },
    { texto: 'Autorizados Direção', icone: 'bi bi-file-earmark-check-fill', rota: '/diretora/autorizados' },
    { texto: 'Meu Perfil', icone: 'bi bi-person-circle', rota: '/diretora/perfil' },
  ];

  return (
    <nav className={menuClasses} aria-label="Menu principal da diretora">
      <div className="nome-usuario-container">
        <span>{usuario}</span>
      </div>
      <hr />
      <div className="nome-usuario-container">
        <small style={{ fontSize: '0.8rem', opacity: 0.8 }}>Data de Hoje:</small><br/>
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

      <button type="button" className="sair" onClick={onLogout} aria-label="Sair do sistema">
        <i className="bi bi-box-arrow-right" aria-hidden="true"></i>&nbsp;&nbsp;Sair
      </button>
    </nav>
  );
};

export default DiretoraNav;
