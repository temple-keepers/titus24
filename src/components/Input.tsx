import { forwardRef, type InputHTMLAttributes, type TextareaHTMLAttributes } from 'react';
import { cn } from '../lib/cn';

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  hint?: string;
  error?: string;
}

const fieldBase =
  'w-full rounded-2xl border border-app bg-surface px-4 py-3 text-sm text-app placeholder:text-app-muted/70 focus:border-brand-400';

export const Input = forwardRef<HTMLInputElement, InputProps>(function Input(
  { label, hint, error, className, id, ...rest },
  ref
) {
  const inputId = id ?? rest.name;
  return (
    <label className="block">
      {label && <span className="mb-1 block text-xs font-semibold uppercase tracking-wide text-app-muted">{label}</span>}
      <input
        ref={ref}
        id={inputId}
        className={cn(fieldBase, error && 'border-red-400', className)}
        aria-invalid={!!error}
        aria-describedby={error ? `${inputId}-err` : hint ? `${inputId}-hint` : undefined}
        {...rest}
      />
      {hint && !error && (
        <span id={`${inputId}-hint`} className="mt-1 block text-xs text-app-muted">
          {hint}
        </span>
      )}
      {error && (
        <span id={`${inputId}-err`} className="mt-1 block text-xs text-red-600">
          {error}
        </span>
      )}
    </label>
  );
});

interface TextareaProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
  hint?: string;
  error?: string;
}

export const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(function Textarea(
  { label, hint, error, className, id, ...rest },
  ref
) {
  const inputId = id ?? rest.name;
  return (
    <label className="block">
      {label && <span className="mb-1 block text-xs font-semibold uppercase tracking-wide text-app-muted">{label}</span>}
      <textarea
        ref={ref}
        id={inputId}
        rows={4}
        className={cn(fieldBase, 'resize-y', error && 'border-red-400', className)}
        {...rest}
      />
      {hint && !error && <span className="mt-1 block text-xs text-app-muted">{hint}</span>}
      {error && <span className="mt-1 block text-xs text-red-600">{error}</span>}
    </label>
  );
});
