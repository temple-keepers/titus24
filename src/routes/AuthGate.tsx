import { type ReactNode } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../auth/AuthProvider';
import SetNewPassword from '../screens/auth/SetNewPassword';
import Suspended from '../screens/auth/Suspended';
import Onboarding from '../screens/auth/Onboarding';
import { LoadingPage } from '../components/LoadingPage';

/**
 * Top-level routing gate. Order matters — recovery mode must short-circuit
 * BEFORE we route by session, otherwise a user with a recovery-token
 * session would land in the app per REBUILD-BRIEF §7.3.
 */
export function AuthGate({ children }: { children: ReactNode }) {
  const { session, profile, loading, recoveryMode } = useAuth();
  const location = useLocation();

  // Reset password flow: force the SetNewPassword screen if we're on the
  // dedicated reset-password route, OR if the URL still carries a
  // type=recovery query/hash marker. This is the robust fallback for
  // the case where supabase-js never fires PASSWORD_RECOVERY.
  const looksLikeRecovery =
    location.pathname.startsWith('/reset-password') ||
    location.search.includes('type=recovery') ||
    location.hash.includes('type=recovery');

  if (recoveryMode || looksLikeRecovery) return <SetNewPassword />;

  if (loading) return <LoadingPage />;

  if (!session) {
    const onPublicRoute =
      location.pathname.startsWith('/sign-in') ||
      location.pathname.startsWith('/sign-up') ||
      location.pathname.startsWith('/forgot-password') ||
      location.pathname.startsWith('/reset-password') ||
      location.pathname.startsWith('/welcome');
    if (!onPublicRoute) return <Navigate to="/welcome" replace state={{ from: location }} />;
    return <>{children}</>;
  }

  // Logged in. Check status + onboarding completeness.
  if (profile?.status === 'banned' || profile?.status === 'removed') return <Suspended />;

  const onboardingNeeded = profile && !profile.city && !profile.country;
  if (onboardingNeeded && location.pathname !== '/onboarding') {
    return <Onboarding />;
  }

  // If logged in and trying to visit auth pages, send home.
  if (
    location.pathname.startsWith('/sign-in') ||
    location.pathname.startsWith('/sign-up') ||
    location.pathname.startsWith('/forgot-password')
  ) {
    return <Navigate to="/" replace />;
  }

  return <>{children}</>;
}
