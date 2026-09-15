import React from 'react';
import './EmptyState.css';

const EmptyState = ({ 
  icon = 'bi bi-inbox', 
  title = 'Nenhum item encontrado', 
  description = '',
  className = '' 
}) => {
  return (
    <div className={`empty-state-container ${className}`}>
      <i className={`${icon} empty-state-icon`} aria-hidden="true" />
      <h3 className="empty-state-title">{title}</h3>
      {description && <p className="empty-state-description">{description}</p>}
    </div>
  );
};

export default EmptyState;
