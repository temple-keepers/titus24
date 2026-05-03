import { type ReactNode } from 'react';

export function AuthLayout({
  title,
  subtitle,
  children,
  footer,
}: {
  title: string;
  subtitle?: string;
  children: ReactNode;
  footer?: ReactNode;
}) {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-4 py-8" style={{ background: 'var(--bg)' }}>
      <div className="w-full max-w-md">
        <div className="mb-6 text-center">
          <div
            className="mx-auto mb-3 inline-flex h-14 w-14 items-center justify-center rounded-full text-white shadow-soft"
            style={{ background: 'linear-gradient(135deg, var(--soft-pink), var(--rose))' }}
          >
            <span className="font-display text-2xl">T</span>
          </div>
          <h1 className="font-display text-3xl">{title}</h1>
          {subtitle && <p className="mt-1 text-sm text-app-muted">{subtitle}</p>}
        </div>
        <div className="rounded-3xl bg-surface border border-app p-6 shadow-soft">{children}</div>
        {footer && <div className="mt-4 text-center text-sm text-app-muted">{footer}</div>}
      </div>
      <p className="mt-6 max-w-sm text-center text-xs italic text-app-muted">
        Titus 2:4 — a digital sisterhood.
      </p>
    </div>
  );
}
