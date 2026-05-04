import { useState, type FormEvent } from 'react';
import { Link } from 'react-router-dom';
import { AuthLayout } from './AuthLayout';
import { Input } from '../../components/Input';
import { Button } from '../../components/Button';
import { supabase } from '../../lib/supabase';
import { mapAuthError } from '../../lib/errors';

export default function SignUp() {
  const [firstName, setFirstName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [agree, setAgree] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [sent, setSent] = useState(false);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    if (password.length < 8) {
      setError('Password must be at least 8 characters.');
      return;
    }
    if (password !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }
    if (!agree) {
      setError('Please confirm you are 18+ and accept the terms to continue.');
      return;
    }
    setBusy(true);
    const { error } = await supabase.auth.signUp({
      email: email.trim(),
      password,
      options: {
        emailRedirectTo: `${window.location.origin}/`,
        data: { first_name: firstName.trim() },
      },
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
      <AuthLayout title="Check your email" subtitle="Just one more step.">
        <p className="text-sm leading-6 text-app">
          We sent a verification link to <strong>{email}</strong>. Tap it to confirm your email — then come back here to sign in.
        </p>
        <p className="mt-4 text-xs text-app-muted">
          Can't find it? Check your spam folder, or wait a minute and try again.
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
      title="Join the sisterhood"
      subtitle="A digital home for women who love the Lord."
      footer={
        <span>
          Already a sister?{' '}
          <Link to="/sign-in" className="font-semibold text-brand-600 hover:text-brand-700">
            Sign in
          </Link>
        </span>
      }
    >
      <form className="space-y-4" onSubmit={onSubmit}>
        <Input
          label="First name"
          name="first_name"
          autoComplete="given-name"
          required
          value={firstName}
          onChange={(e) => setFirstName(e.target.value)}
        />
        <Input
          label="Email"
          name="email"
          type="email"
          autoComplete="email"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />
        <Input
          label="Password"
          name="password"
          type="password"
          autoComplete="new-password"
          required
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          hint="At least 8 characters."
        />
        <Input
          label="Confirm password"
          name="confirm_password"
          type="password"
          autoComplete="new-password"
          required
          value={confirmPassword}
          onChange={(e) => setConfirmPassword(e.target.value)}
        />
        <label className="flex items-start gap-2 text-xs leading-5 text-app-muted">
          <input
            type="checkbox"
            checked={agree}
            onChange={(e) => setAgree(e.target.checked)}
            className="mt-0.5 h-4 w-4"
          />
          <span>
            I'm 18 or older and I accept the{' '}
            <Link to="/guide" className="font-semibold text-brand-600 hover:text-brand-700">
              community guidelines
            </Link>
            .
          </span>
        </label>
        {error && <p className="text-sm text-red-600">{error}</p>}
        <Button type="submit" loading={busy} fullWidth>
          Create my account
        </Button>
      </form>
    </AuthLayout>
  );
}
