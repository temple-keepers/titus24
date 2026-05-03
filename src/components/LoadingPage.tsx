import { Loader2 } from 'lucide-react';

export function LoadingPage({ label = 'A moment, sister…' }: { label?: string }) {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-3 bg-app text-app-muted">
      <Loader2 size={28} className="animate-spin" style={{ color: 'var(--rose)' }} />
      <p className="font-display text-lg italic">{label}</p>
    </div>
  );
}

export function InlineSpinner({ size = 16 }: { size?: number }) {
  return <Loader2 size={size} className="animate-spin" />;
}
