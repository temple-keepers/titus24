import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './auth/AuthProvider';
import { AuthGate } from './routes/AuthGate';
import { ToastProvider } from './components/ToastProvider';
import { ErrorBoundary } from './components/ErrorBoundary';
import { AppShell } from './layout/AppShell';

import SignIn from './screens/auth/SignIn';
import SignUp from './screens/auth/SignUp';
import ForgotPassword from './screens/auth/ForgotPassword';

import Home from './screens/member/Home';
import Devotional from './screens/member/Devotional';
import Community from './screens/member/Community';
import PrayerWall from './screens/member/PrayerWall';
import Events from './screens/member/Events';
import Groups from './screens/member/Groups';
import { MessagesIndex, ConversationView } from './screens/member/Messages';
import BibleStudy from './screens/member/BibleStudy';
import Gallery from './screens/member/Gallery';
import Resources from './screens/member/Resources';
import Directory from './screens/member/Directory';
import SearchPage from './screens/member/SearchPage';
import Notifications from './screens/member/Notifications';
import Profile from './screens/member/Profile';
import Leaderboard from './screens/member/Leaderboard';
import AskElders from './screens/member/AskElders';
import PrayerPartners from './screens/member/PrayerPartners';
import Guide from './screens/member/Guide';
import More from './screens/member/More';

import AdminLayout from './screens/admin/AdminLayout';
import AdminOverview from './screens/admin/AdminOverview';
import AdminMembers from './screens/admin/AdminMembers';
import AdminPosts from './screens/admin/AdminPosts';
import AdminEvents from './screens/admin/AdminEvents';
import AdminDevotionals from './screens/admin/AdminDevotionals';
import AdminCelebrations from './screens/admin/AdminCelebrations';
import {
  AdminPrayers,
  AdminResources,
  AdminStudies,
  AdminPods,
  AdminGuide,
  AdminElderQuestions,
} from './screens/admin/AdminSimplePages';

export default function App() {
  return (
    <BrowserRouter>
      <ErrorBoundary>
        <ToastProvider>
          <AuthProvider>
            <AuthGate>
              <Routes>
                {/* Auth routes */}
                <Route path="/sign-in" element={<SignIn />} />
                <Route path="/sign-up" element={<SignUp />} />
                <Route path="/forgot-password" element={<ForgotPassword />} />

                {/* Member shell */}
                <Route element={<AppShell />}>
                  <Route index element={<Home />} />
                  <Route path="devotional" element={<Devotional />} />
                  <Route path="community" element={<Community />} />
                  <Route path="prayer" element={<PrayerWall />} />
                  <Route path="events" element={<Events />} />
                  <Route path="groups" element={<Groups />} />
                  <Route path="messages" element={<MessagesIndex />} />
                  <Route path="messages/:partnerId" element={<ConversationView />} />
                  <Route path="study" element={<BibleStudy />} />
                  <Route path="gallery" element={<Gallery />} />
                  <Route path="resources" element={<Resources />} />
                  <Route path="directory" element={<Directory />} />
                  <Route path="search" element={<SearchPage />} />
                  <Route path="notifications" element={<Notifications />} />
                  <Route path="profile" element={<Profile />} />
                  <Route path="profile/:id" element={<Profile />} />
                  <Route path="leaderboard" element={<Leaderboard />} />
                  <Route path="elders" element={<AskElders />} />
                  <Route path="partners" element={<PrayerPartners />} />
                  <Route path="guide" element={<Guide />} />
                  <Route path="settings" element={<Profile />} />
                  <Route path="more" element={<More />} />

                  {/* Admin */}
                  <Route path="admin" element={<AdminLayout />}>
                    <Route index element={<AdminOverview />} />
                    <Route path="members" element={<AdminMembers />} />
                    <Route path="posts" element={<AdminPosts />} />
                    <Route path="prayers" element={<AdminPrayers />} />
                    <Route path="events" element={<AdminEvents />} />
                    <Route path="devotionals" element={<AdminDevotionals />} />
                    <Route path="studies" element={<AdminStudies />} />
                    <Route path="resources" element={<AdminResources />} />
                    <Route path="pods" element={<AdminPods />} />
                    <Route path="elder-qa" element={<AdminElderQuestions />} />
                    <Route path="celebrations" element={<AdminCelebrations />} />
                    <Route path="guide" element={<AdminGuide />} />
                  </Route>

                  <Route path="*" element={<Navigate to="/" replace />} />
                </Route>
              </Routes>
            </AuthGate>
          </AuthProvider>
        </ToastProvider>
      </ErrorBoundary>
    </BrowserRouter>
  );
}
