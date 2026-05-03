import { type ReactNode } from 'react';
import { cn } from '../lib/cn';

export function Card({
  children,
  className,
  as: As = 'div',
}: {
  children: ReactNode;
  className?: string;
  as?: 'div' | 'section' | 'article';
}) {
  return (
    <As className={cn('rounded-3xl bg-surface border border-app p-5 shadow-soft', className)}>
      {children}
    </As>
  );
}

export function ScripturePill({ reference, children }: { reference?: string; children: ReactNode }) {
  return (
    <blockquote
      className="rounded-2xl border-l-4 px-4 py-3 italic font-display text-base"
      style={{
        borderColor: 'var(--rose)',
        background: 'var(--pink-wash)',
        color: 'var(--wine)',
      }}
    >
      <span>{children}</span>
      {reference && <footer className="mt-1 not-italic text-xs uppercase tracking-wide text-app-muted">{reference}</footer>}
    </blockquote>
  );
}

export function TipCard({ children, title }: { children: ReactNode; title?: string }) {
  return (
    <div
      className="rounded-2xl border px-4 py-3 text-sm"
      style={{ background: 'var(--sage-wash)', borderColor: 'rgba(170,196,170,0.5)', color: 'var(--wine)' }}
    >
      {title && <p className="mb-1 font-semibold">{title}</p>}
      <div>{children}</div>
    </div>
  );
}

export function SectionTitle({ children, action }: { children: ReactNode; action?: ReactNode }) {
  return (
    <div className="mb-3 flex items-end justify-between gap-3">
      <h2 className="font-display text-2xl text-app">{children}</h2>
      {action}
    </div>
  );
}

export function EmptyState({
  title,
  body,
  icon,
  action,
}: {
  title: string;
  body?: string;
  icon?: ReactNode;
  action?: ReactNode;
}) {
  return (
    <div className="flex flex-col items-center gap-3 rounded-3xl bg-surface border border-app px-6 py-10 text-center">
      {icon && <div className="text-brand-400">{icon}</div>}
      <h3 className="font-display text-xl">{title}</h3>
      {body && <p className="text-sm text-app-muted max-w-sm">{body}</p>}
      {action}
    </div>
  );
}
