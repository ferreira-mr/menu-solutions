import React from 'react';
import './LoadingSpinner.css';

const LoadingSpinner = ({ message = 'Carregando...', size = 'md', className = '' }) => {
  const sizeClass = `spinner-${size}`;
  return (
    <div className={`loading-spinner-container ${className}`} role="status" aria-live="polite">
      <div className={`loading-spinner ${sizeClass}`} aria-hidden="true" />
      {message && <p className="loading-spinner-text">{message}</p>}
    </div>
  );
};

export default LoadingSpinner;
