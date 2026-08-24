import { lazy, Suspense } from 'react';
import { BrowserRouter, Routes, Route, Link, Navigate, useLocation } from 'react-router-dom';
import { AuthProvider } from '../context/AuthProvider';
import { SocketProvider } from '../context/SocketProvider';
import { ThemeProvider } from '../context/ThemeProvider';
import { MessengerProvider } from '../components/messenger/MessengerProvider';
import { useAuth } from '../hooks/useAuth';
import { useInboxNotifications } from '../hooks/useInboxNotifications';
import Navbar from '../components/layout/Navbar';
import Footer from '../components/layout/Footer';
import ThemeToaster from '../components/ui/ThemeToaster';
import InboxNotificationBadge from '../components/inbox/InboxNotificationBadge';
import ProtectedRoute from '../components/shared/ProtectedRoute';
import RouteTitle from '../components/shared/RouteTitle';
import LandingPage from '../pages/public/LandingPage';
import LoginPage from '../pages/public/LoginPage';
import RegisterPage from '../pages/public/RegisterPage';
import VerifyEmailPage from '../pages/public/VerifyEmailPage';
import ForgotPasswordPage from '../pages/public/ForgotPasswordPage';
import ResetPasswordPage from '../pages/public/ResetPasswordPage';
import OAuthCallbackPage from '../pages/public/OAuthCallbackPage';
import DashboardPage from '../pages/private/DashboardPage';
import EditProfilePage from '../pages/private/EditProfilePage';
import ProfilePage from '../pages/private/ProfilePage';
import OnboardingPage from '../pages/private/OnboardingPage';
import AdminUsersPage from '../pages/private/AdminUsersPage';
import AdminDashboardPage from '../pages/private/AdminDashboardPage';
import AdminReportsPage from '../pages/private/AdminReportsPage';
import MySkillsPage from '../pages/private/MySkillsPage';
import NearbySkillsPage from '../pages/private/NearbySkillsPage';
import SkillDetailPage from '../pages/private/SkillDetailPage';
import AccountSettingsPage from '../pages/private/AccountSettingsPage';
import SwapSuggestionsPage from '../pages/private/SwapSuggestionsPage';
import SwapsPage from '../pages/private/SwapsPage';
import ReviewsPage from '../pages/private/ReviewsPage';
import SavedSearchesPage from '../pages/private/SavedSearchesPage';
import SkillRadarPage from '../components/SkillRadar/SkillRadarPage';
import SwapReadyMatchesPage from '../pages/private/SwapReadyMatchesPage';
import DemandHeatmapPage from '../pages/private/DemandHeatmapPage';
import AskTheHearthPage from '../pages/private/AskTheHearthPage';
import SkillSuggestionsPage from '../pages/private/SkillSuggestionsPage';
import BundlesPage from '../pages/private/BundlesPage';
import BundleDetailPage from '../pages/private/BundleDetailPage';
import LearnerBoardPage from '../pages/private/LearnerBoardPage';
import NeighborhoodPageView from '../pages/private/NeighborhoodPageView';
import CommunityBoardPage from '../pages/private/CommunityBoardPage';
import GroupSessionsPage from '../pages/private/GroupSessionsPage';
import CoursesPage from '../pages/private/CoursesPage';
import CourseDetailPage from '../pages/private/CourseDetailPage';
import ChallengesPage from '../pages/private/ChallengesPage';
import ChallengeDetailPage from '../pages/private/ChallengeDetailPage';
import MentorshipsPage from '../pages/private/MentorshipsPage';
import LearnerRequestDetailPage from '../pages/private/LearnerRequestDetailPage';
import ShowcasePage from '../pages/private/ShowcasePage';
import ShowcaseNewPage from '../pages/private/ShowcaseNewPage';
import ShowcaseDetailPage from '../pages/private/ShowcaseDetailPage';
import IntegrationsPage from '../pages/private/IntegrationsPage';
import FeedPage from '../pages/private/FeedPage';
import FriendsPage from '../pages/private/FriendsPage';
import GamificationPage from '../pages/private/GamificationPage';

const MapDiscoveryPage = lazy(() => import('../pages/private/MapDiscoveryPage'));
const ConnectionDetailPage = lazy(() => import('../pages/private/ConnectionDetailPage'));
const MessagesPage = lazy(() => import('../pages/private/MessagesPage'));
const SkillInboxPage = lazy(() => import('../pages/private/SkillInboxPage'));
const NotificationsPage = lazy(() => import('../pages/private/NotificationsPage'));
const JournalPage = lazy(() => import('../pages/private/JournalPage'));
const JournalEntryPage = lazy(() => import('../pages/private/JournalEntryPage'));
const ImpactPage = lazy(() => import('../pages/private/ImpactPage'));

function NotFound() {
  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center px-4 text-center">
      <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">Page not found</h1>
      <p className="mt-2 text-gray-600 dark:text-gray-400">The page you're looking for doesn't exist.</p>
      <Link to="/" className="mt-6 text-sm font-medium text-indigo-600 dark:text-indigo-400 hover:text-indigo-500">
        Back to home
      </Link>
    </div>
  );
}

function NavigateToDashboard() {
  return <Navigate to="/dashboard" replace />;
}

function AppContent() {
  const { isAuthenticated } = useAuth();
  const { pathname } = useLocation();

  // Listen for real-time inbox notifications
  useInboxNotifications({ showToast: true });

  const showFooter = !(
    /^\/map(\/|$)/.test(pathname) ||
    /^\/chat\//.test(pathname) ||
    /^\/dm\//.test(pathname) ||
    /^\/messages(\/|$)/.test(pathname)
  );

  return (
    <div className="flex min-h-screen flex-col">
      <Navbar />
      <main id="main-content" className="flex-1">
        <RouteTitle />
        <Routes>
        <Route path="/" element={<LandingPage />} />
        <Route path="/login" element={isAuthenticated ? <NavigateToDashboard /> : <LoginPage />} />
        <Route path="/register" element={isAuthenticated ? <NavigateToDashboard /> : <RegisterPage />} />
        <Route path="/verify-email/:token" element={<VerifyEmailPage />} />
        <Route path="/forgot-password" element={<ForgotPasswordPage />} />
        <Route path="/reset-password/:token" element={<ResetPasswordPage />} />
        <Route path="/auth/callback" element={<OAuthCallbackPage />} />
        <Route path="/profile/:id" element={<ProfilePage />} />
        <Route path="/skills" element={<NearbySkillsPage />} />
        <Route path="/skills/:id" element={<SkillDetailPage />} />
        <Route
          path="/map"
          element={
            <Suspense
              fallback={
                <div className="flex h-[calc(100dvh-64px)] items-center justify-center bg-gray-50 dark:bg-gray-900">
                  <span className="text-sm text-gray-500 dark:text-gray-400">Loading map…</span>
                </div>
              }
            >
              <MapDiscoveryPage />
            </Suspense>
          }
        />
        <Route
          path="/my-skills"
          element={
            <ProtectedRoute>
              <MySkillsPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/dashboard"
          element={
            <ProtectedRoute>
              <DashboardPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/onboarding"
          element={
            <ProtectedRoute>
              <OnboardingPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/profile"
          element={
            <ProtectedRoute>
              <ProfilePage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/edit-profile"
          element={
            <ProtectedRoute>
              <EditProfilePage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/account-settings"
          element={
            <ProtectedRoute>
              <AccountSettingsPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/swap-suggestions"
          element={
            <ProtectedRoute>
              <SwapSuggestionsPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/swaps"
          element={
            <ProtectedRoute>
              <SwapsPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/reviews"
          element={
            <ProtectedRoute>
              <ReviewsPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/saved-searches"
          element={
            <ProtectedRoute>
              <SavedSearchesPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/radar"
          element={
            <ProtectedRoute>
              <SkillRadarPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/swap-ready-matches"
          element={
            <ProtectedRoute>
              <SwapReadyMatchesPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/demand"
          element={
            <ProtectedRoute>
              <DemandHeatmapPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/ask"
          element={
            <ProtectedRoute>
              <AskTheHearthPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/skill-suggestions"
          element={
            <ProtectedRoute>
              <SkillSuggestionsPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/bundles"
          element={
            <ProtectedRoute>
              <BundlesPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/bundles/:id"
          element={
            <ProtectedRoute>
              <BundleDetailPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/learner-board"
          element={
            <ProtectedRoute>
              <LearnerBoardPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/learner-board/:id"
          element={
            <ProtectedRoute>
              <LearnerRequestDetailPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/neighborhood/:city/:neighborhood?"
          element={<NeighborhoodPageView />}
        />
        <Route
          path="/community/:city/:neighborhood?"
          element={
            <ProtectedRoute>
              <CommunityBoardPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/community"
          element={
            <ProtectedRoute>
              <CommunityBoardPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/group-sessions"
          element={
            <ProtectedRoute>
              <GroupSessionsPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/courses"
          element={
            <ProtectedRoute>
              <CoursesPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/courses/:id"
          element={
            <ProtectedRoute>
              <CourseDetailPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/challenges"
          element={
            <ProtectedRoute>
              <ChallengesPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/challenges/:id"
          element={
            <ProtectedRoute>
              <ChallengeDetailPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/mentorships"
          element={
            <ProtectedRoute>
              <MentorshipsPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/showcase"
          element={
            <ProtectedRoute>
              <ShowcasePage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/showcase/new"
          element={
            <ProtectedRoute>
              <ShowcaseNewPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/showcase/:id"
          element={
            <ProtectedRoute>
              <ShowcaseDetailPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/integrations"
          element={
            <ProtectedRoute>
              <IntegrationsPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/feed"
          element={
            <ProtectedRoute>
              <FeedPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/friends"
          element={
            <ProtectedRoute>
              <FriendsPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/gamification"
          element={
            <ProtectedRoute>
              <GamificationPage />
            </ProtectedRoute>
          }
        />
        <Route path="/dm" element={<Navigate to="/messages" replace />} />
        <Route path="/dm/:userId" element={<Navigate to="/messages" replace />} />
        <Route
          path="/admin/users"
          element={
            <ProtectedRoute>
              <AdminUsersPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/dashboard"
          element={
            <ProtectedRoute>
              <AdminDashboardPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/reports"
          element={
            <ProtectedRoute>
              <AdminReportsPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/inbox"
          element={
            <ProtectedRoute>
              <Suspense fallback={<div className="flex min-h-[60vh] items-center justify-center"><span className="text-sm text-gray-500 dark:text-gray-400">Loading…</span></div>}>
                <SkillInboxPage />
              </Suspense>
            </ProtectedRoute>
          }
        />
        <Route path="/outbox" element={<Navigate to="/messages" replace />} />
        <Route
          path="/connection/:id"
          element={
            <ProtectedRoute>
              <Suspense fallback={<div className="flex min-h-[60vh] items-center justify-center"><span className="text-sm text-gray-500 dark:text-gray-400">Loading…</span></div>}>
                <ConnectionDetailPage />
              </Suspense>
            </ProtectedRoute>
          }
        />
        <Route
          path="/messages"
          element={
            <ProtectedRoute>
              <Suspense fallback={<div className="flex min-h-[60vh] items-center justify-center"><span className="text-sm text-gray-500 dark:text-gray-400">Loading…</span></div>}>
                <MessagesPage />
              </Suspense>
            </ProtectedRoute>
          }
        />
        <Route
          path="/chat/:id"
          element={
            <ProtectedRoute>
              <Navigate to="/messages" replace />
            </ProtectedRoute>
          }
        />
        <Route
          path="/notifications"
          element={
            <ProtectedRoute>
              <Suspense fallback={<div className="flex min-h-[60vh] items-center justify-center"><span className="text-sm text-gray-500 dark:text-gray-400">Loading…</span></div>}>
                <NotificationsPage />
              </Suspense>
            </ProtectedRoute>
          }
        />
        <Route
          path="/journal"
          element={
            <ProtectedRoute>
              <Suspense fallback={<div className="flex min-h-[60vh] items-center justify-center"><span className="text-sm text-gray-500 dark:text-gray-400">Loading…</span></div>}>
                <JournalPage />
              </Suspense>
            </ProtectedRoute>
          }
        />
        <Route
          path="/journal/:id"
          element={
            <ProtectedRoute>
              <Suspense fallback={<div className="flex min-h-[60vh] items-center justify-center"><span className="text-sm text-gray-500 dark:text-gray-400">Loading…</span></div>}>
                <JournalEntryPage />
              </Suspense>
            </ProtectedRoute>
          }
        />
        <Route
          path="/impact"
          element={
            <ProtectedRoute>
              <Suspense fallback={<div className="flex min-h-[60vh] items-center justify-center"><span className="text-sm text-gray-500 dark:text-gray-400">Loading…</span></div>}>
                <ImpactPage />
              </Suspense>
            </ProtectedRoute>
          }
        />
        <Route path="*" element={<NotFound />} />
        </Routes>
      </main>
      {showFooter && <Footer />}
    </div>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <ThemeProvider>
        <AuthProvider>
          <SocketProvider>
              <MessengerProvider>
              <AppContent />
              <ThemeToaster />
              <InboxNotificationBadge />
              </MessengerProvider>
          </SocketProvider>
        </AuthProvider>
      </ThemeProvider>
    </BrowserRouter>
  );
}
