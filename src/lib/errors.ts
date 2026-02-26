/**
 * Maps Supabase auth error codes/messages to user-friendly messages.
 */
export function mapAuthError(error: { message?: string; code?: string }): string {
  const code = error.code || '';
  const msg = (error.message || '').toLowerCase();

  const codeMap: Record<string, string> = {
    invalid_credentials: 'Incorrect email or password.',
    user_already_registered: 'An account with this email already exists.',
    email_not_confirmed: 'Please check your email to verify your account.',
    over_email_send_rate_limit: 'Too many attempts. Please try again later.',
    weak_password: 'Password must be at least 6 characters.',
    user_not_found: 'No account found with this email.',
    email_address_invalid: 'Please enter a valid email address.',
  };

  if (codeMap[code]) return codeMap[code];

  // Fallback: search message content
  if (msg.includes('invalid login credentials') || msg.includes('invalid credentials')) {
    return 'Incorrect email or password.';
  }
  if (msg.includes('already registered') || msg.includes('already been registered')) {
    return 'An account with this email already exists.';
  }
  if (msg.includes('email not confirmed')) {
    return 'Please check your email to verify your account.';
  }
  if (msg.includes('rate limit') || msg.includes('too many requests')) {
    return 'Too many attempts. Please try again later.';
  }
  if (msg.includes('password') && (msg.includes('weak') || msg.includes('short') || msg.includes('least'))) {
    return 'Password must be at least 6 characters.';
  }
  if (msg.includes('network') || msg.includes('fetch')) {
    return 'Network error. Please check your connection.';
  }

  return 'Something went wrong. Please try again.';
}
