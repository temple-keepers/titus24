import { createContext, useCallback, useContext, useEffect, useState, type ReactNode } from 'react';
import { CheckCircle2, AlertCircle, Info, X } from 'lucide-react';
import type { Toast } from '../lib/toast-types';
import { cn } from '../lib/cn';

interface ToastCtx {
  addToast: (t: Toast) => void;
}

const Ctx = createContext<ToastCtx | null>(null);

export function useToast() {
  const v = useContext(Ctx);
  if (!v) throw new Error('useToast must be used inside <ToastProvider>');
  return v;
}

interface Active extends Toast {
  id: string;
}

let counter = 0;
function nextId() {
  counter += 1;
  return `t${Date.now()}_${counter}`;
}

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Active[]>([]);

  const addToast = useCallback((t: Toast) => {
    const id = t.id ?? nextId();
    setToasts((prev) => [...prev, { ...t, id }]);
  }, []);

  const dismiss = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  return (
    <Ctx.Provider value={{ addToast }}>
      {children}
      <div className="pointer-events-none fixed inset-x-0 top-3 z-[100] flex flex-col items-center gap-2 px-3 sm:top-4">
        {toasts.map((t) => (
          <ToastItem key={t.id} toast={t} onDismiss={() => dismiss(t.id)} />
        ))}
      </div>
    </Ctx.Provider>
  );
}

function ToastItem({ toast, onDismiss }: { toast: Active; onDismiss: () => void }) {
  useEffect(() => {
    const t = setTimeout(onDismiss, toast.duration ?? 4500);
    return () => clearTimeout(t);
  }, [toast, onDismiss]);

  const Icon = toast.kind === 'success' ? CheckCircle2 : toast.kind === 'error' ? AlertCircle : Info;
  const tone =
    toast.kind === 'success'
      ? 'bg-sage-50 border-sage-200 text-sage-900'
      : toast.kind === 'error'
        ? 'bg-brand-50 border-brand-200 text-brand-900'
        : 'bg-blush-50 border-blush-200 text-brand-900';

  return (
    <div
      role="status"
      className={cn(
        'pointer-events-auto w-full max-w-sm rounded-2xl border px-4 py-3 shadow-soft animate-slide-up',
        tone
      )}
    >
      <div className="flex items-start gap-3">
        <Icon size={20} className="mt-0.5 shrink-0" />
        <div className="flex-1 text-sm">
          <div className="font-semibold leading-5">{toast.title}</div>
          {toast.body && <div className="mt-0.5 text-xs opacity-80">{toast.body}</div>}
        </div>
        <button
          aria-label="Dismiss"
          onClick={onDismiss}
          className="shrink-0 rounded-full p-1 opacity-60 hover:opacity-100"
        >
          <X size={16} />
        </button>
      </div>
    </div>
  );
}
