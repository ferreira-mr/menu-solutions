import React from 'react';
import './ErrorState.css';

const ErrorState = ({ 
  message = 'Não foi possível carregar os dados.', 
  onRetry = null,
  className = '' 
}) => {
  return (
    <div className={`error-state-container ${className}`} role="alert">
      <i className="bi bi-exclamation-triangle-fill error-state-icon" aria-hidden="true" />
      <p className="error-state-message">{message}</p>
      {onRetry && (
        <button className="error-state-retry-btn" onClick={onRetry} type="button">
          <i className="bi bi-arrow-clockwise" aria-hidden="true" /> Tentar novamente
        </button>
      )}
    </div>
  );
};

export default ErrorState;
