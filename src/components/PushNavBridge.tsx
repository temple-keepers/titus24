import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

/**
 * Listens for `{ type: 'navigate', link: '…' }` postMessages from the
 * service worker. When a sister taps a push notification while the PWA
 * is already running in another tab/window, the SW posts the deep
 * link to every open client; this bridge turns that into a soft React
 * Router navigation so we don't lose auth state, scroll position, or
 * the open realtime channels.
 */
export function PushNavBridge() {
  const navigate = useNavigate();

  useEffect(() => {
    if (typeof navigator === 'undefined' || !navigator.serviceWorker) return;
    function onMessage(e: MessageEvent) {
      const data = e.data;
      if (!data || typeof data !== 'object') return;
      if (data.type === 'navigate' && typeof data.link === 'string' && data.link.startsWith('/')) {
        navigate(data.link);
      }
    }
    navigator.serviceWorker.addEventListener('message', onMessage);
    return () => {
      navigator.serviceWorker.removeEventListener('message', onMessage);
    };
  }, [navigate]);

  return null;
}
