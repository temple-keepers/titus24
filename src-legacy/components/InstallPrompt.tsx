import { useState, useEffect } from 'react';
import { Download, X } from 'lucide-react';

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

export default function InstallPrompt() {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [showPrompt, setShowPrompt] = useState(false);

  useEffect(() => {
    // Check if already dismissed
    const dismissed = localStorage.getItem('installPromptDismissed');
    if (dismissed) return;

    // Check if already installed
    if (window.matchMedia('(display-mode: standalone)').matches) return;

    const handler = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
      // Show prompt after 3 seconds
      setTimeout(() => setShowPrompt(true), 3000);
    };

    window.addEventListener('beforeinstallprompt', handler);
    return () => window.removeEventListener('beforeinstallprompt', handler);
  }, []);

  const handleInstall = async () => {
    if (!deferredPrompt) return;

    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;

    if (outcome === 'accepted') {
      console.log('User accepted install');
    }

    setDeferredPrompt(null);
    setShowPrompt(false);
  };

  const handleDismiss = () => {
    localStorage.setItem('installPromptDismissed', 'true');
    setShowPrompt(false);
  };

  if (!showPrompt || !deferredPrompt) return null;

  return (
    <div
      className="fixed bottom-20 left-4 right-4 z-50 max-w-lg mx-auto animate-slideUp"
      style={{ animation: 'slideUp 0.4s ease-out' }}
    >
      <div
        className="card flex items-start gap-3 shadow-2xl"
        style={{
          background: 'var(--gradient-brand)',
          borderColor: 'transparent',
          boxShadow: '0 8px 32px rgba(245, 197, 99, 0.3)',
        }}
      >
        <div
          className="w-12 h-12 rounded-2xl flex items-center justify-center flex-shrink-0"
          style={{ background: 'rgba(255, 255, 255, 0.2)' }}
        >
          <img
            src="/logo.png"
            alt="App Icon"
            className="w-8 h-8 object-contain"
          />
        </div>
        <div className="flex-1 min-w-0">
          <h3 className="font-display text-base font-bold text-white mb-1">
            Install Titus 2:4
          </h3>
          <p className="text-sm text-white/90 mb-3">
            Add to your home screen for quick access and offline support
          </p>
          <div className="flex gap-2">
            <button
              className="btn btn-sm px-4 py-2 bg-white text-[var(--color-brand)] font-bold rounded-xl hover:bg-white/90 transition-colors"
              onClick={handleInstall}
            >
              <Download size={14} />
              Install
            </button>
            <button
              className="btn btn-sm px-3 py-2 bg-white/20 text-white font-semibold rounded-xl hover:bg-white/30 transition-colors"
              onClick={handleDismiss}
            >
              Not now
            </button>
          </div>
        </div>
        <button
          className="p-2 rounded-lg hover:bg-white/10 transition-colors text-white/80"
          onClick={handleDismiss}
        >
          <X size={16} />
        </button>
      </div>
    </div>
  );
}
