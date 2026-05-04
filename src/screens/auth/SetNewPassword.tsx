import { useState, type FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { AuthLayout } from './AuthLayout';
import { Input } from '../../components/Input';
import { Button } from '../../components/Button';
import { ScripturePill } from '../../components/Card';
import { supabase } from '../../lib/supabase';
import { mapAuthError } from '../../lib/errors';
import { useAuth } from '../../auth/AuthProvider';

export default function SetNewPassword() {
  const nav = useNavigate();
  const { clearRecoveryMode, signOut } = useAuth();
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    if (password.length < 8) {
      setError('Password must be at least 8 characters.');
      return;
    }
    if (password !== confirm) {
      setError('Passwords do not match.');
      return;
    }
    setBusy(true);
    const { error } = await supabase.auth.updateUser({ password });
    setBusy(false);
    if (error) {
      setError(mapAuthError(error));
      return;
    }
    clearRecoveryMode();
    // Navigate away from /reset-password so AuthGate's URL-based
    // recovery check stops re-rendering this screen.
    nav('/', { replace: true });
  }

  return (
    <AuthLayout title="Set a new password" subtitle="Almost there, sister.">
      <ScripturePill reference="Proverbs 31:25">
        She is clothed with strength and dignity, and she laughs without fear of the future.
      </ScripturePill>
      <form className="mt-5 space-y-4" onSubmit={onSubmit}>
        <Input
          label="New password"
          name="password"
          type="password"
          autoComplete="new-password"
          required
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          hint="At least 8 characters."
        />
        <Input
          label="Confirm new password"
          name="confirm"
          type="password"
          autoComplete="new-password"
          required
          value={confirm}
          onChange={(e) => setConfirm(e.target.value)}
        />
        {error && <p className="text-sm text-red-600">{error}</p>}
        <Button type="submit" loading={busy} fullWidth>
          Save new password
        </Button>
        <button
          type="button"
          onClick={async () => {
            clearRecoveryMode();
            await signOut();
            // Move off /reset-password so AuthGate doesn't bounce us
            // straight back into the SetNewPassword screen.
            nav('/sign-in', { replace: true });
          }}
          className="block w-full text-center text-xs text-app-muted hover:text-app"
        >
          Cancel and sign out
        </button>
      </form>
    </AuthLayout>
  );
}
