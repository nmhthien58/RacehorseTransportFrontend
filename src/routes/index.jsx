import { Routes, Route } from 'react-router-dom';
import PrivateRoute from './PrivateRoute';
import { ROUTES } from './routes';
import { ROLES } from '@utils/constants';

// Layouts
import MainLayout from '@layouts/MainLayout';
import AuthLayout from '@layouts/AuthLayout';

// Public pages
import HomePage from '@features/public/pages/HomePage';

// Auth pages
import LoginPage from '@features/auth/pages/LoginPage';
import RegisterPage from '@features/auth/pages/RegisterPage';
import VerifyEmailPage from '@features/auth/pages/VerifyEmailPage';
import ForgotPasswordPage from '@features/auth/pages/ForgotPasswordPage';
import VerifyCodePage from '@features/auth/pages/VerifyCodePage';
import ResetPasswordPage from '@features/auth/pages/ResetPasswordPage';
import ForbiddenPage from '@features/auth/pages/ForbiddenPage';
import NotFoundPage from '@features/auth/pages/NotFoundPage';

// Customer pages
import CustomerDashboard from '@features/customer/pages/DashboardPage';
import CustomerBookings from '@features/customer/pages/BookingsPage';
import NewBookingPage from '@features/customer/pages/NewBookingPage';
import MyHorsesPage from '@features/customer/pages/MyHorsesPage';
import HorseDetailPage from '@features/customer/pages/HorseDetailPage';
import AddHorsePage from '@features/customer/pages/AddHorsePage';
import ProfilePage from '@features/customer/pages/ProfilePage';
import SettingsPage from '@features/customer/pages/SettingsPage';

// Manager pages
import ManagerDashboard from '@features/manager/pages/DashboardPage';
import ManagerBookings from '@features/manager/pages/BookingsPage';
import PendingRequestsPage from '@features/manager/pages/PendingRequestsPage';
import BookingDetailPage from '@features/manager/pages/BookingDetailPage';

// Specialist pages
import SpecialistDashboard from '@features/specialist/pages/DashboardPage';

// Coordinator pages
import CoordinatorDashboard from '@features/coordinator/pages/DashboardPage';

// Driver pages
import DriverDashboard from '@features/driver/pages/DashboardPage';

export default function AppRoutes() {
  return (
    <Routes>
      {/* Public / Landing */}
      <Route path={ROUTES.HOME} element={<HomePage />} />

      {/* Auth layout chứa carousel ảnh 30s không reload */}
      <Route element={<AuthLayout />}>
        <Route path={ROUTES.LOGIN} element={<LoginPage />} />
        <Route path={ROUTES.REGISTER} element={<RegisterPage />} />
        <Route path={ROUTES.VERIFY_EMAIL} element={<VerifyEmailPage />} />
        <Route path={ROUTES.FORGOT_PASSWORD} element={<ForgotPasswordPage />} />
        <Route path={ROUTES.VERIFY_CODE} element={<VerifyCodePage />} />
        <Route path={ROUTES.RESET_PASSWORD} element={<ResetPasswordPage />} />
      </Route>

      <Route path={ROUTES.FORBIDDEN} element={<ForbiddenPage />} />

      {/* Customer */}
      <Route element={<PrivateRoute allowedRoles={[ROLES.CUSTOMER]} />}>
        <Route element={<MainLayout />}>
          <Route path={ROUTES.CUSTOMER_DASHBOARD} element={<CustomerDashboard />} />
          <Route path={ROUTES.CUSTOMER_BOOKINGS} element={<CustomerBookings />} />
          <Route path={ROUTES.CUSTOMER_BOOKING_NEW} element={<NewBookingPage />} />
          <Route path={ROUTES.CUSTOMER_HORSES} element={<MyHorsesPage />} />
          <Route path={ROUTES.CUSTOMER_HORSE_DETAIL} element={<HorseDetailPage />} />
          <Route path={ROUTES.CUSTOMER_HORSE_NEW} element={<AddHorsePage />} />
          <Route path={ROUTES.CUSTOMER_PROFILE} element={<ProfilePage />} />
          <Route path={ROUTES.CUSTOMER_SETTINGS} element={<SettingsPage />} />
        </Route>
      </Route>

      {/* Manager & Admin */}
      <Route element={<PrivateRoute allowedRoles={[ROLES.MANAGER, ROLES.ADMIN]} />}>
        <Route element={<MainLayout />}>
          <Route path={ROUTES.MANAGER_DASHBOARD} element={<ManagerDashboard />} />
          <Route path={ROUTES.MANAGER_PENDING_REQUESTS} element={<PendingRequestsPage />} />
          <Route path={ROUTES.MANAGER_BOOKINGS} element={<ManagerBookings />} />
          <Route path={ROUTES.MANAGER_BOOKING_DETAIL} element={<BookingDetailPage />} />
        </Route>
      </Route>

      {/* Specialist */}
      <Route element={<PrivateRoute allowedRoles={[ROLES.SPECIALIST]} />}>
        <Route element={<MainLayout />}>
          <Route path={ROUTES.SPECIALIST_DASHBOARD} element={<SpecialistDashboard />} />
        </Route>
      </Route>

      {/* Coordinator */}
      <Route element={<PrivateRoute allowedRoles={[ROLES.COORDINATOR]} />}>
        <Route element={<MainLayout />}>
          <Route path={ROUTES.COORDINATOR_DASHBOARD} element={<CoordinatorDashboard />} />
        </Route>
      </Route>

      {/* Driver */}
      <Route element={<PrivateRoute allowedRoles={[ROLES.DRIVER]} />}>
        <Route element={<MainLayout />}>
          <Route path={ROUTES.DRIVER_DASHBOARD} element={<DriverDashboard />} />
        </Route>
      </Route>

      {/* 404 */}
      <Route path="*" element={<NotFoundPage />} />
    </Routes>
  );
}
