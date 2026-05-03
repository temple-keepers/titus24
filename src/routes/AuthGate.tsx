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

  if (recoveryMode) return <SetNewPassword />;

  if (loading) return <LoadingPage />;

  if (!session) {
    const onAuthRoute =
      location.pathname.startsWith('/sign-in') ||
      location.pathname.startsWith('/sign-up') ||
      location.pathname.startsWith('/forgot-password');
    if (!onAuthRoute) return <Navigate to="/sign-in" replace state={{ from: location }} />;
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
