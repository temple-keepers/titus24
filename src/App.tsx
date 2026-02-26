import { HashRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AppProvider, useApp } from '@/context/AppContext';
import Layout from '@/components/Layout';
import LoadingScreen from '@/components/LoadingScreen';
import ErrorBoundary from '@/components/ErrorBoundary';
import RouteErrorBoundary from '@/components/RouteErrorBoundary';
import Auth from '@/views/Auth';
import Onboarding from '@/views/Onboarding';
import Home from '@/views/Home';
import Community from '@/views/Community';
import PrayerWall from '@/views/PrayerWall';
import Events from '@/views/Events';
import BibleStudy from '@/views/BibleStudy';
import Gallery from '@/views/Gallery';
import Messages from '@/views/Messages';
import Directory from '@/views/Directory';
import Resources from '@/views/Resources';
import Profile from '@/views/Profile';
import Notifications from '@/views/Notifications';
import SearchView from '@/views/SearchView';
import AdminDashboard from '@/views/AdminDashboard';
import DailyDevotional from '@/views/DailyDevotional';
import CheckIn from '@/views/CheckIn';
// Testimonies merged into PrayerWall
import AskElders from '@/views/AskElders';
import PrayerPartners from '@/views/PrayerPartners';
import Leaderboard from '@/views/Leaderboard';
import Pods from '@/views/Pods';
import MemberProfile from '@/views/MemberProfile';
import Guide from '@/views/Guide';

function withEB(el: React.ReactNode) {
  return <RouteErrorBoundary>{el}</RouteErrorBoundary>;
}

function BannedScreen({ reason, onSignOut }: { reason: string | null; onSignOut: () => void }) {
  return (
    <div className="min-h-screen flex items-center justify-center p-6" style={{ background: 'var(--color-bg)' }}>
      <div className="card max-w-sm w-full text-center space-y-5 py-10">
        <div className="text-5xl">🚫</div>
        <div>
          <h1 className="font-display text-2xl font-bold mb-2" style={{ color: 'var(--color-text)' }}>
            Account Suspended
          </h1>
          <p className="text-sm" style={{ color: 'var(--color-text-muted)' }}>
            Your account has been suspended by an administrator.
          </p>
          {reason && (
            <p className="text-sm mt-3 px-4 py-3 rounded-xl" style={{ background: 'var(--color-bg-raised)', color: 'var(--color-text-secondary)' }}>
              <strong>Reason:</strong> {reason}
            </p>
          )}
        </div>
        <p className="text-xs" style={{ color: 'var(--color-text-faint)' }}>
          If you believe this is a mistake, please contact your church leadership.
        </p>
        <button className="btn btn-primary" onClick={onSignOut}>
          Sign Out
        </button>
      </div>
    </div>
  );
}

function AppRoutes() {
  const { user, profile, authLoading, loading, signOut } = useApp();

  if (authLoading) return <LoadingScreen />;
  if (!user) return <Auth />;

  // Show loading while initial data fetches (no profile yet)
  if (!profile && loading) return <LoadingScreen />;

  // Enforce ban — show banned screen
  if (profile?.status === 'banned') {
    return <BannedScreen reason={profile.banned_reason} onSignOut={signOut} />;
  }

  // Removed users — sign out immediately
  if (profile?.status === 'removed') {
    signOut();
    return <LoadingScreen />;
  }

  // Show onboarding if profile incomplete — require city/country (photo is optional)
  if (profile && !profile.area && !profile.city) {
    return <Onboarding />;
  }

  return (
    <Routes>
      <Route element={<Layout />}>
        <Route path="/" element={withEB(<Home />)} />
        <Route path="/community" element={withEB(<Community />)} />
        <Route path="/prayer" element={withEB(<PrayerWall />)} />
        <Route path="/events" element={withEB(<Events />)} />
        <Route path="/study" element={withEB(<BibleStudy />)} />
        <Route path="/gallery" element={withEB(<Gallery />)} />
        <Route path="/messages" element={withEB(<Messages />)} />
        <Route path="/directory" element={withEB(<Directory />)} />
        <Route path="/resources" element={withEB(<Resources />)} />
        <Route path="/profile" element={withEB(<Profile />)} />
        <Route path="/notifications" element={withEB(<Notifications />)} />
        <Route path="/search" element={withEB(<SearchView />)} />
        <Route path="/admin" element={withEB(<AdminDashboard />)} />
        <Route path="/check-in" element={withEB(<CheckIn />)} />
        <Route path="/devotional" element={withEB(<DailyDevotional />)} />
        <Route path="/testimonies" element={<Navigate to="/prayer" replace />} />
        <Route path="/ask-elders" element={withEB(<AskElders />)} />
        <Route path="/prayer-partners" element={withEB(<PrayerPartners />)} />
        <Route path="/leaderboard" element={withEB(<Leaderboard />)} />
        <Route path="/pods" element={withEB(<Pods />)} />
        <Route path="/member/:userId" element={withEB(<MemberProfile />)} />
        <Route path="/guide" element={withEB(<Guide />)} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Route>
    </Routes>
  );
}

export default function App() {
  return (
    <ErrorBoundary>
      <HashRouter>
        <AppProvider>
          <AppRoutes />
        </AppProvider>
      </HashRouter>
    </ErrorBoundary>
  );
}
