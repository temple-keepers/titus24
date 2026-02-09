import { useState } from 'react';
import { useApp } from '@/context/AppContext';
import { supabase } from '@/lib/supabase';

export default function Auth() {
  const { signIn, signUp, addToast } = useApp();
  const [mode, setMode] = useState<'login' | 'signup' | 'forgot'>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [firstName, setFirstName] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setErrorMsg('');
    setSuccessMsg('');
    try {
      if (mode === 'login') {
        await signIn(email, password);
      } else if (mode === 'signup') {
        if (!firstName.trim()) { setErrorMsg('Please enter your first name'); setLoading(false); return; }
        await signUp(email, password, firstName.trim());
        setSuccessMsg('Account created! Check your email to verify.');
      } else {
        const { error } = await supabase.auth.resetPasswordForEmail(email, { redirectTo: window.location.origin });
        if (error) throw error;
        setSuccessMsg('Reset link sent! Check your inbox (and spam folder).');
      }
    } catch (err: any) {
      const msg = err?.message || 'Something went wrong';
      console.error('Auth error:', err);
      setErrorMsg(msg);
    } finally {
      setLoading(false);
    }
  };

  const switchMode = (m: 'login' | 'signup' | 'forgot') => {
    setMode(m); setErrorMsg(''); setSuccessMsg('');
  };

  const tagline = mode === 'forgot'
    ? "Enter your email and we'll send a reset link."
    : "A sisterhood rooted in faith, growing towards God's design for love and marriage.";

  return (
    <div
      className="min-h-[100dvh] flex flex-col items-center justify-center px-6"
      style={{ background: 'var(--gradient-body)' }}
    >
      <div className="fixed top-0 left-1/2 -translate-x-1/2 w-[600px] h-[500px] pointer-events-none"
        style={{ background: 'radial-gradient(ellipse at 50% 20%, rgba(247,141,167,0.07) 0%, transparent 65%)' }}
      />
      <div className="fixed bottom-0 right-0 w-[300px] h-[300px] pointer-events-none"
        style={{ background: 'radial-gradient(ellipse at 80% 80%, rgba(170,196,170,0.06) 0%, transparent 60%)' }}
      />

      <div className="relative w-full max-w-sm">
        <div className="flex flex-col items-center mb-10">
          <img
            src="/logo.png"
            alt="Titus 2:4 Logo"
            className="w-[100px] h-[100px] object-contain mb-5"
            style={{ filter: 'drop-shadow(0 8px 28px rgba(232,102,138,0.25))' }}
          />
          <h1 className="font-display text-3xl font-bold tracking-tight mb-2" style={{ color: 'var(--color-text)' }}>
            Titus 2:4
          </h1>
          <p className="text-sm text-center max-w-[260px] leading-relaxed" style={{ color: 'var(--color-text-muted)' }}>
            {tagline}
          </p>
        </div>

        {errorMsg && (
          <div className="mb-4 px-4 py-3 rounded-2xl border text-sm font-semibold"
            style={{ background: 'rgba(244,63,94,0.08)', borderColor: 'rgba(244,63,94,0.2)', color: '#fb7185' }}>
            {errorMsg}
          </div>
        )}
        {successMsg && (
          <div className="mb-4 px-4 py-3 rounded-2xl border text-sm font-semibold"
            style={{ background: 'rgba(16,185,129,0.08)', borderColor: 'rgba(16,185,129,0.2)', color: '#34d399' }}>
            {successMsg}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          {mode === 'signup' && (
            <div>
              <label className="label">First Name</label>
              <input type="text" className="input" placeholder="Your first name" value={firstName}
                onChange={(e) => setFirstName(e.target.value)} required />
            </div>
          )}
          <div>
            <label className="label">Email</label>
            <input type="email" className="input" placeholder="you@example.com" value={email}
              onChange={(e) => setEmail(e.target.value)} required />
          </div>
          {mode !== 'forgot' && (
            <div>
              <label className="label">Password</label>
              <input type="password" className="input" placeholder="••••••••" value={password}
                onChange={(e) => setPassword(e.target.value)} required minLength={6} />
            </div>
          )}
          <button type="submit" className="btn btn-primary btn-lg w-full" disabled={loading}>
            {loading ? 'Please wait...' : mode === 'login' ? 'Sign In' : mode === 'signup' ? 'Create Account' : 'Send Reset Link'}
          </button>
        </form>

        {mode === 'login' && (
          <p className="text-center mt-4">
            <button onClick={() => switchMode('forgot')} className="text-sm font-semibold" style={{ color: 'var(--color-text-muted)' }}>
              Forgot your password?
            </button>
          </p>
        )}
        <p className="text-center mt-5 text-sm" style={{ color: 'var(--color-text-muted)' }}>
          {mode === 'login' && (
            <span>{"Don't have an account? "}<button onClick={() => switchMode('signup')} className="font-bold underline underline-offset-2" style={{ color: 'var(--color-brand)' }}>Sign Up</button></span>
          )}
          {mode === 'signup' && (
            <span>Already have an account?{' '}<button onClick={() => switchMode('login')} className="font-bold underline underline-offset-2" style={{ color: 'var(--color-brand)' }}>Sign In</button></span>
          )}
          {mode === 'forgot' && (
            <span>Remember your password?{' '}<button onClick={() => switchMode('login')} className="font-bold underline underline-offset-2" style={{ color: 'var(--color-brand)' }}>Back to Sign In</button></span>
          )}
        </p>
      </div>
    </div>
  );
}
