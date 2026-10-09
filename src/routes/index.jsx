import { Routes, Route, Navigate } from 'react-router-dom';
import PrivateRoute from './PrivateRoute';
import { ROUTES } from './routes';
import { ROLES } from '@utils/constants';

// Layouts
import MainLayout from '@layouts/MainLayout';
import AuthLayout from '@layouts/AuthLayout';

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
import VetRecordsPage from '@features/customer/pages/VetRecordsPage';
import ActiveTripsPage from '@features/customer/pages/ActiveTripsPage';
import MessagesPage from '@features/customer/pages/MessagesPage';
import ProfilePage from '@features/customer/pages/ProfilePage';
import BillingPage from '@features/customer/pages/BillingPage';
import SettingsPage from '@features/customer/pages/SettingsPage';

// Manager pages
import ManagerDashboard from '@features/manager/pages/DashboardPage';
import ManagerBookings from '@features/manager/pages/BookingsPage';

// Specialist pages
import SpecialistDashboard from '@features/specialist/pages/DashboardPage';

// Coordinator pages
import CoordinatorDashboard from '@features/coordinator/pages/DashboardPage';

// Driver pages
import DriverDashboard from '@features/driver/pages/DashboardPage';

// Landing pages
import MainPage from '@features/landing/pages/MainPage';
import TransportTypesPage from '@features/landing/pages/TransportTypesPage';
import HowItWorksPage from '@features/landing/pages/HowItWorksPage';
import BecomeHaulerPage from '@features/landing/pages/BecomeHaulerPage';
import PublicPricingPage from '@features/landing/pages/PublicPricingPage';
import CustomerPricingPage from '@features/customer/pages/PricingPage';

export default function AppRoutes() {
  return (
    <Routes>
      {/* Trang chủ Landing Page giới thiệu dịch vụ */}
      <Route path={ROUTES.HOME} element={<MainPage />} />
      <Route path={ROUTES.TRANSPORT_TYPES} element={<TransportTypesPage />} />
      <Route path={ROUTES.PRICING} element={<PublicPricingPage />} />
      <Route path={ROUTES.HOW_IT_WORKS} element={<HowItWorksPage />} />
      <Route path={ROUTES.BECOME_HAULER} element={<BecomeHaulerPage />} />

      {/* Auth layout chứa carousel ảnh */}
      <Route element={<AuthLayout />}>
        <Route path={ROUTES.LOGIN} element={<LoginPage />} />
        <Route path={ROUTES.REGISTER} element={<RegisterPage />} />
        <Route path={ROUTES.VERIFY_EMAIL} element={<VerifyEmailPage />} />
        <Route path={ROUTES.FORGOT_PASSWORD} element={<ForgotPasswordPage />} />
        <Route path={ROUTES.VERIFY_CODE} element={<VerifyCodePage />} />
        <Route path={ROUTES.RESET_PASSWORD} element={<ResetPasswordPage />} />
      </Route>

      <Route path={ROUTES.FORBIDDEN} element={<ForbiddenPage />} />

      {/* Customer - Truy cập thẳng không cần đăng nhập */}
      <Route element={<PrivateRoute allowedRoles={[ROLES.CUSTOMER]} />}>
        <Route element={<MainLayout />}>
          <Route path={ROUTES.CUSTOMER_DASHBOARD} element={<CustomerDashboard />} />
          <Route path={ROUTES.CUSTOMER_HORSES} element={<MyHorsesPage />} />
          <Route path={ROUTES.CUSTOMER_HORSE_DETAIL} element={<HorseDetailPage />} />
          <Route path={ROUTES.CUSTOMER_HORSE_NEW} element={<AddHorsePage />} />
          <Route path={ROUTES.CUSTOMER_VET_RECORDS} element={<VetRecordsPage />} />
          <Route path="/customer/vet-record" element={<Navigate to={ROUTES.CUSTOMER_VET_RECORDS} replace />} />
          <Route path="/customer/vetrecords" element={<Navigate to={ROUTES.CUSTOMER_VET_RECORDS} replace />} />
          <Route path="/customer/vetrecord" element={<Navigate to={ROUTES.CUSTOMER_VET_RECORDS} replace />} />
          <Route path="/vet-records" element={<Navigate to={ROUTES.CUSTOMER_VET_RECORDS} replace />} />
          <Route path="/vet-record" element={<Navigate to={ROUTES.CUSTOMER_VET_RECORDS} replace />} />
          <Route path={ROUTES.CUSTOMER_BOOKINGS} element={<CustomerBookings />} />
          <Route path={ROUTES.CUSTOMER_BOOKING_NEW} element={<NewBookingPage />} />
          <Route path={ROUTES.CUSTOMER_PRICING} element={<CustomerPricingPage />} />
          <Route path={ROUTES.CUSTOMER_TRIPS} element={<ActiveTripsPage />} />
          <Route path={ROUTES.CUSTOMER_MESSAGES} element={<MessagesPage />} />
          <Route path={ROUTES.CUSTOMER_PROFILE} element={<ProfilePage />} />
          <Route path={ROUTES.CUSTOMER_BILLING} element={<BillingPage />} />
          <Route path="/billing" element={<Navigate to={ROUTES.CUSTOMER_BILLING} replace />} />
          <Route path={ROUTES.CUSTOMER_SETTINGS} element={<SettingsPage />} />
        </Route>
      </Route>

      {/* Manager */}
      <Route element={<PrivateRoute allowedRoles={[ROLES.MANAGER]} />}>
        <Route element={<MainLayout />}>
          <Route path={ROUTES.MANAGER_DASHBOARD} element={<ManagerDashboard />} />
          <Route path={ROUTES.MANAGER_BOOKINGS} element={<ManagerBookings />} />
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
