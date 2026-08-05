import { lazy, Suspense } from 'react';
import { BrowserRouter, Routes, Route, Link, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { AuthProvider } from '../context/AuthProvider';
import { SocketProvider } from '../context/SocketProvider';
import { useAuth } from '../hooks/useAuth';
import Navbar from '../components/layout/Navbar';
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
import SkillSuggestionsPage from '../pages/private/SkillSuggestionsPage';
import BundlesPage from '../pages/private/BundlesPage';
import LearnerBoardPage from '../pages/private/LearnerBoardPage';
import NeighborhoodPageView from '../pages/private/NeighborhoodPageView';

const MapDiscoveryPage = lazy(() => import('../pages/private/MapDiscoveryPage'));
const InboxPage = lazy(() => import('../pages/private/InboxPage'));
const OutboxPage = lazy(() => import('../pages/private/OutboxPage'));
const ConnectionDetailPage = lazy(() => import('../pages/private/ConnectionDetailPage'));
const MessagesPage = lazy(() => import('../pages/private/MessagesPage'));
const ChatRoomPage = lazy(() => import('../pages/private/ChatRoomPage'));
const NotificationsPage = lazy(() => import('../pages/private/NotificationsPage'));

function NotFound() {
  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center px-4 text-center">
      <h1 className="text-3xl font-bold text-gray-900">Page not found</h1>
      <p className="mt-2 text-gray-600">The page you're looking for doesn't exist.</p>
      <Link to="/" className="mt-6 text-sm font-medium text-indigo-600 hover:text-indigo-500">
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

  return (
    <>
      <Navbar />
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
                <div className="flex h-[calc(100vh-57px)] items-center justify-center bg-gray-50">
                  <span className="text-sm text-gray-500">Loading map…</span>
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
          path="/learner-board"
          element={
            <ProtectedRoute>
              <LearnerBoardPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/neighborhood/:city/:neighborhood?"
          element={<NeighborhoodPageView />}
        />
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
              <Suspense fallback={<div className="flex min-h-[60vh] items-center justify-center"><span className="text-sm text-gray-500">Loading…</span></div>}>
                <InboxPage />
              </Suspense>
            </ProtectedRoute>
          }
        />
        <Route
          path="/outbox"
          element={
            <ProtectedRoute>
              <Suspense fallback={<div className="flex min-h-[60vh] items-center justify-center"><span className="text-sm text-gray-500">Loading…</span></div>}>
                <OutboxPage />
              </Suspense>
            </ProtectedRoute>
          }
        />
        <Route
          path="/connection/:id"
          element={
            <ProtectedRoute>
              <Suspense fallback={<div className="flex min-h-[60vh] items-center justify-center"><span className="text-sm text-gray-500">Loading…</span></div>}>
                <ConnectionDetailPage />
              </Suspense>
            </ProtectedRoute>
          }
        />
        <Route
          path="/messages"
          element={
            <ProtectedRoute>
              <Suspense fallback={<div className="flex min-h-[60vh] items-center justify-center"><span className="text-sm text-gray-500">Loading…</span></div>}>
                <MessagesPage />
              </Suspense>
            </ProtectedRoute>
          }
        />
        <Route
          path="/chat/:id"
          element={
            <ProtectedRoute>
              <Suspense fallback={<div className="flex min-h-[60vh] items-center justify-center"><span className="text-sm text-gray-500">Loading…</span></div>}>
                <ChatRoomPage />
              </Suspense>
            </ProtectedRoute>
          }
        />
        <Route
          path="/notifications"
          element={
            <ProtectedRoute>
              <Suspense fallback={<div className="flex min-h-[60vh] items-center justify-center"><span className="text-sm text-gray-500">Loading…</span></div>}>
                <NotificationsPage />
              </Suspense>
            </ProtectedRoute>
          }
        />
        <Route path="*" element={<NotFound />} />
      </Routes>
    </>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <SocketProvider>
          <AppContent />
          <Toaster position="top-right" />
        </SocketProvider>
      </AuthProvider>
    </BrowserRouter>
  );
}
