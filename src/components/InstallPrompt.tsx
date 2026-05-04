import { useEffect, useState } from 'react';
import { Download, Share, X } from 'lucide-react';

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

const DISMISS_KEY = 'titus_install_dismissed_at';
const DISMISS_DAYS = 14;

function recentlyDismissed(): boolean {
  if (typeof window === 'undefined') return false;
  const v = window.localStorage.getItem(DISMISS_KEY);
  if (!v) return false;
  const ms = Number(v);
  if (!Number.isFinite(ms)) return false;
  return Date.now() - ms < DISMISS_DAYS * 86400_000;
}

function markDismissed() {
  window.localStorage.setItem(DISMISS_KEY, String(Date.now()));
}

function isStandalone(): boolean {
  if (typeof window === 'undefined') return false;
  if (window.matchMedia('(display-mode: standalone)').matches) return true;
  // iOS Safari uses navigator.standalone
  return Boolean((window.navigator as { standalone?: boolean }).standalone);
}

function isIOS(): boolean {
  if (typeof window === 'undefined') return false;
  const ua = window.navigator.userAgent;
  return /iPad|iPhone|iPod/.test(ua) && !(window as { MSStream?: unknown }).MSStream;
}

export function InstallPrompt() {
  const [deferred, setDeferred] = useState<BeforeInstallPromptEvent | null>(null);
  const [show, setShow] = useState(false);
  const [iosHint, setIosHint] = useState(false);

  useEffect(() => {
    if (recentlyDismissed() || isStandalone()) return;

    // Android / desktop Chrome path — they fire beforeinstallprompt.
    const handler = (e: Event) => {
      e.preventDefault();
      setDeferred(e as BeforeInstallPromptEvent);
      // Wait a few seconds before nagging.
      window.setTimeout(() => setShow(true), 4000);
    };
    window.addEventListener('beforeinstallprompt', handler);

    // iOS path — no event fires, so we detect and show a hint after a delay.
    if (isIOS()) {
      window.setTimeout(() => {
        setIosHint(true);
        setShow(true);
      }, 6000);
    }

    return () => window.removeEventListener('beforeinstallprompt', handler);
  }, []);

  async function install() {
    if (!deferred) return;
    await deferred.prompt();
    const { outcome } = await deferred.userChoice;
    if (outcome === 'accepted') markDismissed();
    setDeferred(null);
    setShow(false);
  }

  function dismiss() {
    markDismissed();
    setShow(false);
  }

  if (!show) return null;
  if (!deferred && !iosHint) return null;

  return (
    <div className="fixed inset-x-3 bottom-20 z-40 mx-auto max-w-md animate-slide-up sm:bottom-6 lg:left-auto lg:right-6 lg:bottom-6">
      <div
        className="rounded-3xl p-4 shadow-soft-lg"
        style={{
          background: 'linear-gradient(135deg, var(--soft-pink), var(--rose))',
          color: 'white',
        }}
      >
        <div className="flex items-start gap-3">
          <div
            className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl"
            style={{ background: 'rgba(255,255,255,0.2)' }}
          >
            <img src="/logo.png" alt="" className="h-8 w-8 object-contain" />
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="font-display text-lg font-semibold">Install Titus 2:4</h3>
            {iosHint ? (
              <p className="mt-1 text-sm opacity-95">
                Tap <Share size={14} className="inline -mt-0.5" /> <span className="font-semibold">Share</span>{' '}
                in Safari, then <span className="font-semibold">Add to Home Screen</span>.
              </p>
            ) : (
              <p className="mt-1 text-sm opacity-95">
                Add it to your home screen for quick access, sister.
              </p>
            )}
            {!iosHint && deferred && (
              <button
                onClick={install}
                className="mt-3 inline-flex items-center gap-2 rounded-2xl bg-white px-4 py-2 text-sm font-semibold text-brand-700 shadow-soft hover:bg-brand-50"
              >
                <Download size={14} />
                Install
              </button>
            )}
          </div>
          <button
            onClick={dismiss}
            aria-label="Dismiss"
            className="shrink-0 rounded-full p-1 text-white/80 hover:bg-white/10 hover:text-white"
          >
            <X size={18} />
          </button>
        </div>
      </div>
    </div>
  );
}
