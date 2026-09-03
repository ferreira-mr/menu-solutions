import React from 'react';
import ReactDOM from 'react-dom/client';

import './index.css';
import 'bootstrap-icons/font/bootstrap-icons.css';
import 'sweetalert2/dist/sweetalert2.min.css';

import App from './App.jsx';

const rootElement = document.getElementById('root');

if (!rootElement) {
    throw new Error('Elemento #root não encontrado para inicializar o React.');
}

ReactDOM.createRoot(rootElement).render(
    <React.StrictMode>
        <App />
    </React.StrictMode>
);
