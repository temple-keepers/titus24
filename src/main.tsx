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

// Register the service worker so Android/desktop browsers consider the
// site installable as a PWA. The SW file is in /public.
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js').catch((err) => {
      // eslint-disable-next-line no-console
      console.warn('[sw] registration failed:', err);
    });
  });
}
