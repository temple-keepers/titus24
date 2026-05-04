import { useEffect, useState, type FormEvent } from 'react';
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
  const [exchanging, setExchanging] = useState(true);
  const [sessionReady, setSessionReady] = useState(false);

  // PKCE recovery flow: Supabase redirects to ?code=... and supabase-js needs
  // to exchange that code for a session BEFORE updateUser({ password }) will
  // work. detectSessionInUrl handles this on first load, but on a SPA where
  // we render this screen by URL pattern (AuthGate) the code may still be in
  // the bar after the exchange. So: try to read the existing session first;
  // if missing and a code is present, exchange explicitly.
  useEffect(() => {
    let active = true;

    (async () => {
      const { data: existing } = await supabase.auth.getSession();
      if (!active) return;
      if (existing.session) {
        setSessionReady(true);
        setExchanging(false);
        return;
      }

      const url = new URL(window.location.href);
      const code = url.searchParams.get('code');
      if (code) {
        const { error: exErr } = await supabase.auth.exchangeCodeForSession(code);
        if (!active) return;
        if (exErr) {
          setError(
            'This reset link has expired or already been used. Please request a fresh email from "Forgot password".'
          );
          setExchanging(false);
          return;
        }
        // Strip the code from the URL so a refresh doesn't try to re-exchange.
        url.searchParams.delete('code');
        window.history.replaceState({}, '', url.pathname + url.search + url.hash);
        setSessionReady(true);
        setExchanging(false);
        return;
      }

      // No session and no code — this is a stale tab or someone navigated
      // here directly. Tell them to request a fresh link.
      setError(
        'This reset link is no longer valid. Please request a fresh email from "Forgot password".'
      );
      setExchanging(false);
    })();

    return () => {
      active = false;
    };
  }, []);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    if (!sessionReady) {
      setError('Please request a fresh reset link from "Forgot password".');
      return;
    }
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
        <Button type="submit" loading={busy || exchanging} fullWidth disabled={!sessionReady}>
          {exchanging ? 'Verifying link…' : 'Save new password'}
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
