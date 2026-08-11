import { lazy, Suspense } from "react";
import { Toaster } from "@/components/ui/toaster"
import { QueryClientProvider } from '@tanstack/react-query'
import { queryClientInstance } from '@/lib/query-client'
import { BrowserRouter as Router, Route, Routes, Navigate } from 'react-router-dom';
import PageNotFound from './lib/PageNotFound';
import { AuthProvider, useAuth } from '@/lib/AuthContext';
import UserNotRegisteredError from '@/components/UserNotRegisteredError';
import ScrollToTop from './components/ScrollToTop';
import ProtectedRoute from '@/components/ProtectedRoute';

// Auth pages (eager — needed before the auth gate resolves)
import Login from '@/pages/Login';
import Register from '@/pages/Register';
import ForgotPassword from '@/pages/ForgotPassword';
import ResetPassword from '@/pages/ResetPassword';

// Public pages
import Landing from '@/pages/Landing';

// Dashboard layout (eager — wraps every protected route)
import DashboardLayout from '@/components/dashboard/DashboardLayout';

// Dashboard pages — lazy-loaded for faster initial paint
const Dashboard = lazy(() => import('@/pages/Dashboard'));
const NewProject = lazy(() => import('@/pages/NewProject'));
const MyApps = lazy(() => import('@/pages/MyApps'));
const DownloadsPage = lazy(() => import('@/pages/DownloadsPage'));
const Notifications = lazy(() => import('@/pages/Notifications'));
const BillingPage = lazy(() => import('@/pages/BillingPage'));
const SupportPage = lazy(() => import('@/pages/SupportPage'));
const ProfilePage = lazy(() => import('@/pages/ProfilePage'));
const SettingsPage = lazy(() => import('@/pages/SettingsPage'));
const UpgradePlan = lazy(() => import('@/pages/UpgradePlan'));
const BuildProgress = lazy(() => import('@/pages/BuildProgress'));
const AuthSuccess = lazy(() => import('@/pages/AuthSuccess'));
const PaymentSuccess = lazy(() => import('@/pages/PaymentSuccess'));
const PaymentFailed = lazy(() => import('@/pages/PaymentFailed'));
const PaymentPending = lazy(() => import('@/pages/PaymentPending'));
const Payment = lazy(() => import('@/pages/Payment'));
const PublicAppPage = lazy(() => import('@/pages/PublicAppPage'));
const SuperAdminRoute = lazy(() => import('@/components/superadmin/SuperAdminRoute'));
const SuperAdminDashboard = lazy(() => import('@/pages/superadmin/SuperAdminDashboard'));

const RouteLoader = () => (
  <div className="fixed inset-0 flex items-center justify-center bg-background">
    <div className="w-8 h-8 border-2 border-primary/20 border-t-primary rounded-full animate-spin" />
  </div>
);

const AuthenticatedApp = () => {
  const { isLoadingAuth, isLoadingPublicSettings, authError, navigateToLogin } = useAuth();

  if (isLoadingPublicSettings || isLoadingAuth) {
    return (
      <div className="fixed inset-0 flex items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 border-3 border-[#4F7CFF]/20 border-t-[#4F7CFF] rounded-full animate-spin" />
          <p className="text-sm text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  if (authError) {
    if (authError.type === 'user_not_registered') {
      return <UserNotRegisteredError />;
    } else if (authError.type === 'auth_required') {
      navigateToLogin();
      return null;
    }
  }

  return (
    <Suspense fallback={<RouteLoader />}>
      <Routes>
        {/* Public routes */}
        <Route path="/" element={<Landing />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/forgot-password" element={<ForgotPassword />} />
        <Route path="/reset-password" element={<ResetPassword />} />
        <Route path="/app/:id" element={<PublicAppPage />} />

        {/* Protected dashboard routes */}
        <Route element={<ProtectedRoute unauthenticatedElement={<Navigate to="/login" replace />} />}>
          <Route path="/auth-success" element={<AuthSuccess />} />
          <Route element={<DashboardLayout />}>
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/new-project" element={<NewProject />} />
            <Route path="/my-apps" element={<MyApps />} />
            <Route path="/downloads" element={<DownloadsPage />} />
            <Route path="/notifications" element={<Notifications />} />
            <Route path="/billing" element={<BillingPage />} />
            <Route path="/support" element={<SupportPage />} />
            <Route path="/profile" element={<ProfilePage />} />
            <Route path="/settings" element={<SettingsPage />} />
            <Route path="/upgrade-plan" element={<UpgradePlan />} />
            <Route path="/payment" element={<Payment />} />
            <Route path="/build/:id" element={<BuildProgress />} />
          </Route>
        </Route>

        {/* Payment result routes */}
        <Route path="/payment/success" element={<PaymentSuccess />} />
        <Route path="/payment/failed" element={<PaymentFailed />} />
        <Route path="/payment/pending" element={<PaymentPending />} />

        {/* Super Admin (hidden, single designated account) */}
        <Route path="/super-admin" element={<SuperAdminRoute><SuperAdminDashboard /></SuperAdminRoute>} />

        <Route path="*" element={<PageNotFound />} />
      </Routes>
    </Suspense>
  );
};

function App() {
  return (
    <AuthProvider>
      <QueryClientProvider client={queryClientInstance}>
        <Router>
          <ScrollToTop />
          <AuthenticatedApp />
        </Router>
        <Toaster />
      </QueryClientProvider>
    </AuthProvider>
  )
}

export default App