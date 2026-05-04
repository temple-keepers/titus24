import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './auth/AuthProvider';
import { AuthGate } from './routes/AuthGate';
import { ToastProvider } from './components/ToastProvider';
import { ErrorBoundary } from './components/ErrorBoundary';
import { InstallPrompt } from './components/InstallPrompt';
import { AppShell } from './layout/AppShell';

import SignIn from './screens/auth/SignIn';
import SignUp from './screens/auth/SignUp';
import ForgotPassword from './screens/auth/ForgotPassword';
import SetNewPassword from './screens/auth/SetNewPassword';
import Welcome from './screens/welcome/Welcome';
import NotFound from './screens/NotFound';

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
import MyMentor from './screens/member/MyMentor';
import Guide from './screens/member/Guide';
import More from './screens/member/More';

import AdminLayout from './screens/admin/AdminLayout';
import AdminOverview from './screens/admin/AdminOverview';
import AdminMembers from './screens/admin/AdminMembers';
import AdminPosts from './screens/admin/AdminPosts';
import AdminEvents from './screens/admin/AdminEvents';
import AdminDevotionals from './screens/admin/AdminDevotionals';
import AdminCelebrations from './screens/admin/AdminCelebrations';
import AdminMentors from './screens/admin/AdminMentors';
import AdminFollowUp from './screens/admin/AdminFollowUp';
import AdminAttendance from './screens/admin/AdminAttendance';
import AdminEmail from './screens/admin/AdminEmail';
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
            <InstallPrompt />
            <AuthGate>
              <Routes>
                {/* Public + auth routes */}
                <Route path="/welcome" element={<Welcome />} />
                <Route path="/sign-in" element={<SignIn />} />
                <Route path="/sign-up" element={<SignUp />} />
                <Route path="/forgot-password" element={<ForgotPassword />} />
                {/* /reset-password is gated by AuthGate which short-circuits to
                    SetNewPassword when the path matches; this route entry is a
                    fallback in case AuthGate's children render. */}
                <Route path="/reset-password" element={<SetNewPassword />} />

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
                  <Route path="mentor" element={<MyMentor />} />
                  <Route path="guide" element={<Guide />} />
                  <Route path="settings" element={<Profile />} />
                  <Route path="more" element={<More />} />

                  {/* Admin */}
                  <Route path="admin" element={<AdminLayout />}>
                    <Route index element={<AdminOverview />} />
                    <Route path="members" element={<AdminMembers />} />
                    <Route path="follow-up" element={<AdminFollowUp />} />
                    <Route path="posts" element={<AdminPosts />} />
                    <Route path="prayers" element={<AdminPrayers />} />
                    <Route path="events" element={<AdminEvents />} />
                    <Route path="attendance" element={<AdminAttendance />} />
                    <Route path="devotionals" element={<AdminDevotionals />} />
                    <Route path="email" element={<AdminEmail />} />
                    <Route path="studies" element={<AdminStudies />} />
                    <Route path="resources" element={<AdminResources />} />
                    <Route path="pods" element={<AdminPods />} />
                    <Route path="mentors" element={<AdminMentors />} />
                    <Route path="elder-qa" element={<AdminElderQuestions />} />
                    <Route path="celebrations" element={<AdminCelebrations />} />
                    <Route path="guide" element={<AdminGuide />} />
                  </Route>

                  <Route path="*" element={<NotFound />} />
                </Route>
              </Routes>
            </AuthGate>
          </AuthProvider>
        </ToastProvider>
      </ErrorBoundary>
    </BrowserRouter>
  );
}
