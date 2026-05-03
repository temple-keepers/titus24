import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import './styles/tokens.css';

// Apply persisted theme preference before React renders to avoid flash.
const stored = window.localStorage.getItem('titus_theme');
if (stored === 'dark' || stored === 'light') {
  document.documentElement.dataset.theme = stored;
} else if (window.matchMedia?.('(prefers-color-scheme: dark)').matches) {
  document.documentElement.dataset.theme = 'dark';
}

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
