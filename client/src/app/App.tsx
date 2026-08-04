import { BrowserRouter, Routes, Route, Link, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { AuthProvider } from '../context/AuthProvider';
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
import DashboardPage from '../pages/private/DashboardPage';
import EditProfilePage from '../pages/private/EditProfilePage';
import ProfilePage from '../pages/private/ProfilePage';
import AdminUsersPage from '../pages/private/AdminUsersPage';
import MySkillsPage from '../pages/private/MySkillsPage';
import NearbySkillsPage from '../pages/private/NearbySkillsPage';
import SkillDetailPage from '../pages/private/SkillDetailPage';

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
        <Route path="/profile/:id" element={<ProfilePage />} />
        <Route path="/skills" element={<NearbySkillsPage />} />
        <Route path="/skills/:id" element={<SkillDetailPage />} />
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
          path="/admin/users"
          element={
            <ProtectedRoute>
              <AdminUsersPage />
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
        <AppContent />
        <Toaster position="top-right" />
      </AuthProvider>
    </BrowserRouter>
  );
}
