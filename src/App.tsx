import { HashRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AppProvider, useApp } from '@/context/AppContext';
import Layout from '@/components/Layout';
import LoadingScreen from '@/components/LoadingScreen';
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

function AppRoutes() {
  const { user, profile, authLoading, loading } = useApp();

  if (authLoading) return <LoadingScreen />;
  if (!user) return <Auth />;

  // Show loading while initial data fetches (no profile yet)
  if (!profile && loading) return <LoadingScreen />;

  // Show onboarding if profile incomplete — only require area (photo is optional)
  if (profile && !profile.area) {
    return <Onboarding />;
  }

  return (
    <Routes>
      <Route element={<Layout />}>
        <Route path="/" element={<Home />} />
        <Route path="/community" element={<Community />} />
        <Route path="/prayer" element={<PrayerWall />} />
        <Route path="/events" element={<Events />} />
        <Route path="/study" element={<BibleStudy />} />
        <Route path="/gallery" element={<Gallery />} />
        <Route path="/messages" element={<Messages />} />
        <Route path="/directory" element={<Directory />} />
        <Route path="/resources" element={<Resources />} />
        <Route path="/profile" element={<Profile />} />
        <Route path="/notifications" element={<Notifications />} />
        <Route path="/search" element={<SearchView />} />
        <Route path="/admin" element={<AdminDashboard />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Route>
    </Routes>
  );
}

export default function App() {
  return (
    <HashRouter>
      <AppProvider>
        <AppRoutes />
      </AppProvider>
    </HashRouter>
  );
}
