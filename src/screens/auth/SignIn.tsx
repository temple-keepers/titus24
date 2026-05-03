import { useState, type FormEvent } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { AuthLayout } from './AuthLayout';
import { Input } from '../../components/Input';
import { Button } from '../../components/Button';
import { supabase } from '../../lib/supabase';
import { mapAuthError } from '../../lib/errors';

export default function SignIn() {
  const nav = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setBusy(true);
    const { error } = await supabase.auth.signInWithPassword({ email: email.trim(), password });
    setBusy(false);
    if (error) {
      setError(mapAuthError(error));
      return;
    }
    nav('/', { replace: true });
  }

  return (
    <AuthLayout
      title="Welcome back, sister"
      subtitle="Sign in to your Titus 2:4 sisterhood."
      footer={
        <span>
          New here?{' '}
          <Link to="/sign-up" className="font-semibold text-brand-600 hover:text-brand-700">
            Create an account
          </Link>
        </span>
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
        <Input
          label="Password"
          name="password"
          type="password"
          autoComplete="current-password"
          required
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />
        {error && <p className="text-sm text-red-600">{error}</p>}
        <Button type="submit" loading={busy} fullWidth>
          Sign in
        </Button>
        <div className="text-center text-sm">
          <Link to="/forgot-password" className="text-brand-600 hover:text-brand-700">
            Forgot password?
          </Link>
        </div>
      </form>
    </AuthLayout>
  );
}
