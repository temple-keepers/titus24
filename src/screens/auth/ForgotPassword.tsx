import { useState, type FormEvent } from 'react';
import { Link } from 'react-router-dom';
import { AuthLayout } from './AuthLayout';
import { Input } from '../../components/Input';
import { Button } from '../../components/Button';
import { supabase } from '../../lib/supabase';
import { mapAuthError } from '../../lib/errors';

export default function ForgotPassword() {
  const [email, setEmail] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [sent, setSent] = useState(false);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setBusy(true);
    const { error } = await supabase.auth.resetPasswordForEmail(email.trim(), {
      // Land on a dedicated route that ALWAYS forces the SetNewPassword
      // screen on arrival, regardless of whether supabase-js fires the
      // PASSWORD_RECOVERY event. The event has been unreliable with PKCE
      // because Supabase's verify endpoint can strip the type=recovery
      // marker during its redirect — relying on the URL is more robust.
      redirectTo: `${window.location.origin}/reset-password`,
    });
    setBusy(false);
    if (error) {
      setError(mapAuthError(error));
      return;
    }
    setSent(true);
  }

  if (sent) {
    return (
      <AuthLayout title="Check your email" subtitle="A reset link is on its way.">
        <p className="text-sm leading-6">
          If <strong>{email}</strong> is registered, you'll get an email shortly with a link to set a new password.
        </p>
        <div className="mt-6">
          <Link to="/sign-in" className="text-sm font-semibold text-brand-600 hover:text-brand-700">
            ← Back to sign in
          </Link>
        </div>
      </AuthLayout>
    );
  }

  return (
    <AuthLayout
      title="Forgot your password?"
      subtitle="No worries, sister. We'll email you a reset link."
      footer={
        <Link to="/sign-in" className="text-brand-600 hover:text-brand-700">
          ← Back to sign in
        </Link>
      }
    >
      <form className="space-y-4" onSubmit={onSubmit}>
        <Input
          label="Email"
          name="email"
          type="email"
          autoComplete="email"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />
        {error && <p className="text-sm text-red-600">{error}</p>}
        <Button type="submit" loading={busy} fullWidth>
          Send reset link
        </Button>
      </form>
    </AuthLayout>
  );
}
