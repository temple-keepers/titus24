import { cn } from '@/lib/utils';
import type { Toast as ToastType } from '@/types';
import { X, CheckCircle, AlertCircle, Info } from 'lucide-react';

interface Props {
  toasts: ToastType[];
  onRemove: (id: string) => void;
}

const icons = { success: CheckCircle, error: AlertCircle, info: Info };

const colors = {
  success: 'border-emerald-400/30 bg-emerald-500/10',
  error: 'border-rose-400/30 bg-rose-500/10',
  info: 'border-brand-400/30 bg-brand-400/10',
};

const iconColors = {
  success: 'text-emerald-400',
  error: 'text-rose-400',
  info: 'text-brand-400',
};

export default function ToastContainer({ toasts, onRemove }: Props) {
  if (toasts.length === 0) return null;

  return (
    <div className="fixed top-4 right-4 left-4 z-[100] flex flex-col items-center gap-2 pointer-events-none sm:left-auto sm:w-[380px]">
      {toasts.map((t) => {
        const Icon = icons[t.type];
        return (
          <div
            key={t.id}
            className={cn(
              'pointer-events-auto w-full flex items-center gap-3 px-5 py-4 rounded-2xl border backdrop-blur-md animate-slide-up',
              colors[t.type]
            )}
          >
            <Icon size={20} className={iconColors[t.type]} />
            <span className="flex-1 text-sm font-semibold" style={{ color: 'var(--color-text)' }}>
              {t.message}
            </span>
            <button
              onClick={() => onRemove(t.id)}
              className="p-1.5 rounded-lg hover:bg-white/10 transition-colors"
              style={{ color: 'var(--color-text-muted)' }}
            >
              <X size={14} />
            </button>
          </div>
        );
      })}
    </div>
  );
}
