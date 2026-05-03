import type { PostgrestError } from '@supabase/supabase-js';
import type { Toast } from './toast-types';

export type SupabaseLikeError = PostgrestError | { message?: string; code?: string } | null;

/**
 * The single failure-handling pattern from REBUILD-BRIEF §7.5.
 * Returns true if `error` was a real failure and a toast was raised.
 *
 *   const { error } = await supabase.from('posts').insert(...);
 *   if (failIfError(error, 'share your post', addToast)) return;
 */
export function failIfError(
  error: SupabaseLikeError,
  action: string,
  addToast: (t: Toast) => void
): boolean {
  if (!error) return false;
  const msg = (error as { message?: string }).message;
  addToast({
    kind: 'error',
    title: `Couldn't ${action}.`,
    body: msg && !msg.toLowerCase().startsWith('failed') ? msg : 'Please try again.',
  });
  // eslint-disable-next-line no-console
  console.error(`[failIfError] ${action}:`, error);
  return true;
}

/** Friendlier copy for Supabase Auth error codes. */
export function mapAuthError(error: { message?: string; code?: string }): string {
  const code = error.code || '';
  const msg = (error.message || '').toLowerCase();

  const codeMap: Record<string, string> = {
    invalid_credentials: 'Incorrect email or password.',
    user_already_registered: 'An account with this email already exists.',
    email_not_confirmed: 'Please check your email to verify your account, sister.',
    over_email_send_rate_limit: 'Too many attempts. Please try again in a few minutes.',
    weak_password: 'Password must be at least 8 characters.',
    user_not_found: 'No account found with this email.',
    email_address_invalid: 'Please enter a valid email address.',
    same_password: 'Please choose a password different from your current one.',
  };
  if (codeMap[code]) return codeMap[code];

  if (msg.includes('invalid login credentials')) return 'Incorrect email or password.';
  if (msg.includes('already registered')) return 'An account with this email already exists.';
  if (msg.includes('email not confirmed')) return 'Please check your email to verify your account, sister.';
  if (msg.includes('rate limit')) return 'Too many attempts. Please try again in a few minutes.';
  if (msg.includes('network') || msg.includes('fetch')) return 'Network error. Please check your connection.';
  return error.message || 'Something went wrong. Please try again.';
}
