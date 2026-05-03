import { cn } from '../lib/cn';

interface Props {
  url?: string | null;
  name?: string | null;
  size?: number;
  className?: string;
}

function initials(name?: string | null): string {
  if (!name) return '✧';
  const parts = name.trim().split(/\s+/);
  return parts.slice(0, 2).map((p) => p[0]?.toUpperCase()).join('');
}

export function Avatar({ url, name, size = 40, className }: Props) {
  const dim = { width: size, height: size, fontSize: Math.round(size * 0.4) };
  if (url) {
    return (
      <img
        src={url}
        alt={name ?? 'sister'}
        style={dim}
        className={cn('rounded-full object-cover ring-2 ring-white shadow-soft', className)}
      />
    );
  }
  return (
    <div
      aria-label={name ?? 'sister'}
      style={{ ...dim, background: 'linear-gradient(135deg, var(--soft-pink), var(--rose))' }}
      className={cn(
        'flex items-center justify-center rounded-full font-display font-semibold text-white shadow-soft select-none',
        className
      )}
    >
      {initials(name)}
    </div>
  );
}
