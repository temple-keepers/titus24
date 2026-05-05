import { lazy, Suspense } from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './auth/AuthProvider';
import { AuthGate } from './routes/AuthGate';
import { ToastProvider } from './components/ToastProvider';
import { ErrorBoundary } from './components/ErrorBoundary';
import { InstallPrompt } from './components/InstallPrompt';
import { PushNavBridge } from './components/PushNavBridge';
import { OnboardingTour } from './components/OnboardingTour';
import { LoadingPage } from './components/LoadingPage';
import { AppShell } from './layout/AppShell';

// Eager: first paint for both auth and member states.
import Welcome from './screens/welcome/Welcome';
import Home from './screens/member/Home';
import NotFound from './screens/NotFound';

// Lazy: auth flow (rare clicks after first paint)
const SignIn = lazy(() => import('./screens/auth/SignIn'));
const SignUp = lazy(() => import('./screens/auth/SignUp'));
const ForgotPassword = lazy(() => import('./screens/auth/ForgotPassword'));
const SetNewPassword = lazy(() => import('./screens/auth/SetNewPassword'));

// Lazy: member screens that aren't the first thing a sister sees.
const Devotional = lazy(() => import('./screens/member/Devotional'));
const Community = lazy(() => import('./screens/member/Community'));
const PrayerWall = lazy(() => import('./screens/member/PrayerWall'));
const Events = lazy(() => import('./screens/member/Events'));
const Groups = lazy(() => import('./screens/member/Groups'));
const Messages = lazy(() =>
  import('./screens/member/Messages').then((m) => ({ default: m.MessagesIndex }))
);
const ConversationView = lazy(() =>
  import('./screens/member/Messages').then((m) => ({ default: m.ConversationView }))
);
const BibleStudy = lazy(() => import('./screens/member/BibleStudy'));
const Gallery = lazy(() => import('./screens/member/Gallery'));
const Resources = lazy(() => import('./screens/member/Resources'));
const Directory = lazy(() => import('./screens/member/Directory'));
const SearchPage = lazy(() => import('./screens/member/SearchPage'));
const Notifications = lazy(() => import('./screens/member/Notifications'));
const Profile = lazy(() => import('./screens/member/Profile'));
const Leaderboard = lazy(() => import('./screens/member/Leaderboard'));
const AskElders = lazy(() => import('./screens/member/AskElders'));
const PrayerPartners = lazy(() => import('./screens/member/PrayerPartners'));
const MyMentor = lazy(() => import('./screens/member/MyMentor'));
const Guide = lazy(() => import('./screens/member/Guide'));
const More = lazy(() => import('./screens/member/More'));
const Testimonies = lazy(() => import('./screens/member/Testimonies'));

// Lazy: admin tree as its own chunk — small audience, no need to ship to
// members on first paint. Loading the layout pulls the admin sub-nav with it.
const AdminLayout = lazy(() => import('./screens/admin/AdminLayout'));
const AdminOverview = lazy(() => import('./screens/admin/AdminOverview'));
const AdminMembers = lazy(() => import('./screens/admin/AdminMembers'));
const AdminPosts = lazy(() => import('./screens/admin/AdminPosts'));
const AdminEvents = lazy(() => import('./screens/admin/AdminEvents'));
const AdminDevotionals = lazy(() => import('./screens/admin/AdminDevotionals'));
const AdminCelebrations = lazy(() => import('./screens/admin/AdminCelebrations'));
const AdminGallery = lazy(() => import('./screens/admin/AdminGallery'));
const AdminSisterOfWeek = lazy(() => import('./screens/admin/AdminSisterOfWeek'));
const AdminTestimonies = lazy(() => import('./screens/admin/AdminTestimonies'));
const AdminPodMembers = lazy(() => import('./screens/admin/AdminPodMembers'));
const AdminActivity = lazy(() => import('./screens/admin/AdminActivity'));
const AdminMentors = lazy(() => import('./screens/admin/AdminMentors'));
const AdminFollowUp = lazy(() => import('./screens/admin/AdminFollowUp'));
const AdminAttendance = lazy(() => import('./screens/admin/AdminAttendance'));
const AdminEmail = lazy(() => import('./screens/admin/AdminEmail'));
const AdminPrayers = lazy(() =>
  import('./screens/admin/AdminSimplePages').then((m) => ({ default: m.AdminPrayers }))
);
const AdminResources = lazy(() => import('./screens/admin/AdminResources'));
const AdminStudies = lazy(() =>
  import('./screens/admin/AdminSimplePages').then((m) => ({ default: m.AdminStudies }))
);
const AdminPods = lazy(() =>
  import('./screens/admin/AdminSimplePages').then((m) => ({ default: m.AdminPods }))
);
const AdminGuide = lazy(() =>
  import('./screens/admin/AdminSimplePages').then((m) => ({ default: m.AdminGuide }))
);
const AdminElderQuestions = lazy(() => import('./screens/admin/AdminElderQuestions'));

export default function App() {
  return (
    <BrowserRouter>
      <ErrorBoundary>
        <ToastProvider>
          <AuthProvider>
            <InstallPrompt />
            <PushNavBridge />
            <OnboardingTour />
            <AuthGate>
              <Suspense fallback={<LoadingPage />}>
                <Routes>
                  {/* Public + auth routes */}
                  <Route path="/welcome" element={<Welcome />} />
                  <Route path="/sign-in" element={<SignIn />} />
                  <Route path="/sign-up" element={<SignUp />} />
                  <Route path="/forgot-password" element={<ForgotPassword />} />
                  {/* /reset-password is gated by AuthGate which short-circuits
                      to SetNewPassword when the path matches; this route entry
                      is a fallback in case AuthGate's children render. */}
                  <Route path="/reset-password" element={<SetNewPassword />} />

                  {/* Member shell */}
                  <Route element={<AppShell />}>
                    <Route index element={<Home />} />
                    <Route path="devotional" element={<Devotional />} />
                    <Route path="community" element={<Community />} />
                    <Route path="prayer" element={<PrayerWall />} />
                    <Route path="events" element={<Events />} />
                    <Route path="groups" element={<Groups />} />
                    <Route path="messages" element={<Messages />} />
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
                    <Route path="testimonies" element={<Testimonies />} />

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
                      <Route path="gallery" element={<AdminGallery />} />
                      <Route path="sister-of-week" element={<AdminSisterOfWeek />} />
                      <Route path="testimonies" element={<AdminTestimonies />} />
                      <Route path="pods/:podId" element={<AdminPodMembers />} />
                      <Route path="activity" element={<AdminActivity />} />
                      <Route path="guide" element={<AdminGuide />} />
                    </Route>

                    <Route path="*" element={<NotFound />} />
                  </Route>
                </Routes>
              </Suspense>
            </AuthGate>
          </AuthProvider>
        </ToastProvider>
      </ErrorBoundary>
    </BrowserRouter>
  );
}
