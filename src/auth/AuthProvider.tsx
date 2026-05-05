import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import type { Session, User } from '@supabase/supabase-js';
import { supabase } from '../lib/supabase';
import type { Profile } from '../lib/database.types';

const RECOVERY_KEY = 'titus_recovery';

interface AuthCtx {
  session: Session | null;
  user: User | null;
  profile: Profile | null;
  loading: boolean;
  /** True while the user is in the password-reset flow. UI must short-circuit. */
  recoveryMode: boolean;
  clearRecoveryMode: () => void;
  refreshProfile: () => Promise<void>;
  signOut: () => Promise<void>;
}

const Ctx = createContext<AuthCtx | null>(null);

export function useAuth() {
  const v = useContext(Ctx);
  if (!v) throw new Error('useAuth must be used inside <AuthProvider>');
  return v;
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const [recoveryMode, setRecoveryMode] = useState<boolean>(() => {
    if (typeof window === 'undefined') return false;
    return window.sessionStorage.getItem(RECOVERY_KEY) === '1';
  });

  // Keep a stable ref so we can call from listener without re-subscribing.
  const profileFor = useRef<string | null>(null);

  const fetchProfile = useCallback(async (userId: string) => {
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .maybeSingle();
    if (error) {
      // eslint-disable-next-line no-console
      console.error('[auth] failed to load profile:', error);
      setProfile(null);
      return;
    }
    const p = (data as Profile | null) ?? null;
    setProfile(p);

    // First-load timezone capture. We need this server-side for quiet
    // hours; auto-detect from the browser and stash on the profile if
    // we don't already have one. Fire-and-forget — don't block render.
    if (p && !p.timezone && typeof Intl !== 'undefined') {
      try {
        const tz = Intl.DateTimeFormat().resolvedOptions().timeZone;
        if (tz) {
          void supabase.from('profiles').update({ timezone: tz }).eq('id', userId);
        }
      } catch {
        /* ignore */
      }
    }
  }, []);

  const refreshProfile = useCallback(async () => {
    if (!session?.user) return;
    await fetchProfile(session.user.id);
  }, [session, fetchProfile]);

  const clearRecoveryMode = useCallback(() => {
    if (typeof window !== 'undefined') {
      window.sessionStorage.removeItem(RECOVERY_KEY);
    }
    setRecoveryMode(false);
  }, []);

  const signOut = useCallback(async () => {
    clearRecoveryMode();
    // Clear local state synchronously first so the UI can't briefly re-render
    // as the previous user before supabase-js has finished tearing down.
    profileFor.current = null;
    setProfile(null);
    setSession(null);
    await supabase.auth.signOut({ scope: 'global' });
    // Defensive: belt-and-braces purge of any lingering sb-* tokens. If a
    // refresh token is left behind the next page load can silently revive
    // the session (F-028).
    if (typeof window !== 'undefined') {
      try {
        for (const key of Object.keys(window.localStorage)) {
          if (key.startsWith('sb-') || key.startsWith('supabase.auth.')) {
            window.localStorage.removeItem(key);
          }
        }
      } catch {
        /* localStorage may be blocked in private mode — ignore */
      }
    }
  }, [clearRecoveryMode]);

  useEffect(() => {
    let active = true;

    supabase.auth.getSession().then(({ data }) => {
      if (!active) return;
      setSession(data.session);
      if (data.session?.user) {
        profileFor.current = data.session.user.id;
        void fetchProfile(data.session.user.id);
      }
      setLoading(false);
    });

    const { data: sub } = supabase.auth.onAuthStateChange((event, nextSession) => {
      if (!active) return;

      // REBUILD-BRIEF §7.3 + §7.4: PASSWORD_RECOVERY only fires once on hash
      // detection. Persist the flag so a refresh on the SetNewPassword screen
      // doesn't drop the user into the app.
      if (event === 'PASSWORD_RECOVERY') {
        if (typeof window !== 'undefined') {
          window.sessionStorage.setItem(RECOVERY_KEY, '1');
        }
        setRecoveryMode(true);
      }

      setSession(nextSession);

      const nextUserId = nextSession?.user?.id ?? null;
      if (nextUserId && nextUserId !== profileFor.current) {
        profileFor.current = nextUserId;
        void fetchProfile(nextUserId);
      } else if (!nextUserId) {
        profileFor.current = null;
        setProfile(null);
      }
    });

    return () => {
      active = false;
      sub.subscription.unsubscribe();
    };
  }, [fetchProfile]);

  const value = useMemo<AuthCtx>(
    () => ({
      session,
      user: session?.user ?? null,
      profile,
      loading,
      recoveryMode,
      clearRecoveryMode,
      refreshProfile,
      signOut,
    }),
    [session, profile, loading, recoveryMode, clearRecoveryMode, refreshProfile, signOut]
  );

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}
