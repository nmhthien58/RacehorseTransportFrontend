// Đang sửa routes/index.jsx vì đăng ký route quản lý bồi thường bảo hiểm FE-11 (R-13)
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
import ForgotPasswordPage from '@features/auth/pages/ForgotPasswordPage';
import ResetPasswordPage from '@features/auth/pages/ResetPasswordPage';
import ForbiddenPage from '@features/auth/pages/ForbiddenPage';
import NotFoundPage from '@features/auth/pages/NotFoundPage';

// Customer pages
import CustomerDashboard from '@features/customer/pages/DashboardPage';
import CustomerBookings from '@features/customer/pages/BookingsPage';
import CustomerBookingDetailPage from '@features/customer/pages/BookingDetailPage';
import NewBookingPage from '@features/customer/pages/NewBookingPage';
import MyHorsesPage from '@features/customer/pages/MyHorsesPage';
import HorseDetailPage from '@features/customer/pages/HorseDetailPage';
import AddHorsePage from '@features/customer/pages/AddHorsePage';
import VetRecordsPage from '@features/customer/pages/VetRecordsPage';
import TripTrackingDetailPage from '@features/customer/pages/TripTrackingDetailPage';
import MessagesPage from '@features/customer/pages/MessagesPage';
import ProfilePage from '@features/customer/pages/ProfilePage';
import BillingPage from '@features/customer/pages/BillingPage';
import PaymentResultPage from '@features/customer/pages/PaymentResultPage';
import MockPaymentPage from '@features/customer/pages/MockPaymentPage';
import SettingsPage from '@features/customer/pages/SettingsPage';

// Manager pages
import ManagerDashboard from '@features/manager/pages/DashboardPage';
import ManagerBookings from '@features/manager/pages/BookingsPage';
import BookingDetailPage from '@features/manager/pages/BookingDetailPage';
import PendingRequestsPage from '@features/manager/pages/PendingRequestsPage';
import RouteApprovalsPage from '@features/manager/pages/RouteApprovalsPage';
import InsuranceClaimsPage from '@features/manager/pages/InsuranceClaimsPage';
import UserManagementPage from '@features/manager/pages/UserManagementPage';
import IncidentReviewPage from '@features/manager/pages/IncidentReviewPage';
import TripClosurePage from '@features/manager/pages/TripClosurePage';
import ReportsPage from '@features/manager/pages/ReportsPage';
import PaymentSettingsPage from '@features/manager/pages/PaymentSettingsPage';

// Specialist pages
import SpecialistDashboard from '@features/specialist/pages/DashboardPage';
import DossiersPage from '@features/specialist/pages/DossiersPage';
import DossierDetailPage from '@features/specialist/pages/DossierDetailPage';
import QuarantineRulesPage from '@features/specialist/pages/QuarantineRulesPage';
import DocumentsPage from '@features/specialist/pages/DocumentsPage';

// Coordinator pages
import CoordinatorDashboard from '@features/coordinator/pages/DashboardPage';
import RoutePlanningPage from '@features/coordinator/pages/RoutePlanningPage';
import FleetRosterPage from '@features/coordinator/pages/FleetRosterPage';
import CoordinatorIncidentsPage from '@features/coordinator/pages/IncidentsPage';

// Driver pages
import DriverDashboard from '@features/driver/pages/DashboardPage';
import MissionBriefingPage from '@features/driver/pages/MissionBriefingPage';
import PreDepartureChecklistPage from '@features/driver/pages/PreDepartureChecklistPage';
import TripExecutionPage from '@features/driver/pages/TripExecutionPage';
import HorseWelfareLogPage from '@features/driver/pages/HorseWelfareLogPage';
import ArrivalHandoverPage from '@features/driver/pages/ArrivalHandoverPage';
import TripHistoryPage from '@features/driver/pages/TripHistoryPage';
import ActiveTripPage from '@features/driver/pages/ActiveTripPage';
import MissionCompletionReportPage from '@features/driver/pages/MissionCompletionReportPage';

// Landing pages
import MainPage from '@features/landing/pages/MainPage';
import TransportTypesPage from '@features/landing/pages/TransportTypesPage';
import HowItWorksPage from '@features/landing/pages/HowItWorksPage';
import BecomeHaulerPage from '@features/landing/pages/BecomeHaulerPage';
import PublicPricingPage from '@features/landing/pages/PublicPricingPage';
import CustomerPricingPage from '@features/customer/pages/PricingPage';
import PolicyPage from '@features/landing/pages/PolicyPage';

export default function AppRoutes() {
  return (
    <Routes>
      {/* Trang chủ Landing Page giới thiệu dịch vụ */}
      <Route path={ROUTES.HOME} element={<MainPage />} />
      <Route path={ROUTES.TRANSPORT_TYPES} element={<TransportTypesPage />} />
      <Route path={ROUTES.PRICING} element={<PublicPricingPage />} />
      <Route path={ROUTES.HOW_IT_WORKS} element={<HowItWorksPage />} />
      <Route path={ROUTES.BECOME_HAULER} element={<BecomeHaulerPage />} />
      <Route path={ROUTES.POLICY} element={<PolicyPage />} />
      <Route path={ROUTES.POLICY_EN} element={<PolicyPage />} />

      {/* Auth layout chứa carousel ảnh */}
      <Route element={<AuthLayout />}>
        <Route path={ROUTES.LOGIN} element={<LoginPage />} />
        <Route path={ROUTES.REGISTER} element={<RegisterPage />} />
        <Route path={ROUTES.FORGOT_PASSWORD} element={<ForgotPasswordPage />} />
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
          <Route path={ROUTES.CUSTOMER_BOOKING_DETAIL} element={<CustomerBookingDetailPage />} />
          <Route path="/customer/booking" element={<Navigate to={ROUTES.CUSTOMER_BOOKINGS} replace />} />
          <Route path="/customer/booking/new" element={<Navigate to={ROUTES.CUSTOMER_BOOKING_NEW} replace />} />
          <Route path="/customer/request" element={<Navigate to={ROUTES.CUSTOMER_BOOKINGS} replace />} />
          <Route path="/customer/requests" element={<Navigate to={ROUTES.CUSTOMER_BOOKINGS} replace />} />
          <Route path="/customer/transport-request" element={<Navigate to={ROUTES.CUSTOMER_BOOKINGS} replace />} />
          <Route path="/customer/transport-requests" element={<Navigate to={ROUTES.CUSTOMER_BOOKINGS} replace />} />
          <Route path="/customer/request-transport" element={<Navigate to={ROUTES.CUSTOMER_BOOKINGS} replace />} />
          <Route path="/transport-request" element={<Navigate to={ROUTES.CUSTOMER_BOOKINGS} replace />} />
          <Route path="/transport-requests" element={<Navigate to={ROUTES.CUSTOMER_BOOKINGS} replace />} />
          <Route path="/request-transport" element={<Navigate to={ROUTES.CUSTOMER_BOOKINGS} replace />} />
          <Route path="/bookings" element={<Navigate to={ROUTES.CUSTOMER_BOOKINGS} replace />} />
          <Route path="/booking" element={<Navigate to={ROUTES.CUSTOMER_BOOKINGS} replace />} />
          <Route path={ROUTES.CUSTOMER_PRICING} element={<CustomerPricingPage />} />
          <Route path={ROUTES.CUSTOMER_TRIPS} element={<Navigate to={`${ROUTES.CUSTOMER_BOOKINGS}?stage=InTransit`} replace />} />
          <Route path={ROUTES.CUSTOMER_TRIP_DETAIL} element={<TripTrackingDetailPage />} />
          <Route path={ROUTES.CUSTOMER_MESSAGES} element={<MessagesPage />} />
          <Route path={ROUTES.CUSTOMER_PROFILE} element={<ProfilePage />} />
          <Route path={ROUTES.CUSTOMER_BILLING} element={<BillingPage />} />
          <Route path={ROUTES.CUSTOMER_PAYMENT_RESULT} element={<PaymentResultPage />} />
          <Route path={ROUTES.CUSTOMER_PAYMENT_MOCK} element={<MockPaymentPage />} />
          <Route path="/billing" element={<Navigate to={ROUTES.CUSTOMER_BILLING} replace />} />
          <Route path={ROUTES.CUSTOMER_SETTINGS} element={<SettingsPage />} />
        </Route>
      </Route>

      {/* Manager & Admin */}
      <Route element={<PrivateRoute allowedRoles={[ROLES.MANAGER, ROLES.ADMIN]} />}>
        <Route element={<MainLayout />}>
          <Route path={ROUTES.MANAGER_DASHBOARD} element={<ManagerDashboard />} />
          <Route path={ROUTES.MANAGER_BOOKINGS} element={<ManagerBookings />} />
          <Route path={ROUTES.MANAGER_BOOKING_DETAIL} element={<BookingDetailPage />} />
          <Route path={ROUTES.MANAGER_PENDING_REQUESTS} element={<PendingRequestsPage />} />
          <Route path={ROUTES.MANAGER_ROUTE_APPROVALS} element={<RouteApprovalsPage />} />
          <Route path={ROUTES.MANAGER_INSURANCE_CLAIMS} element={<InsuranceClaimsPage />} />
          <Route path="/manager/route-approvals" element={<RouteApprovalsPage />} />
          <Route path={ROUTES.MANAGER_USERS} element={<UserManagementPage />} />
          <Route path="/manager/users" element={<UserManagementPage />} />
          <Route path={ROUTES.MANAGER_INCIDENTS} element={<IncidentReviewPage />} />
          <Route path={ROUTES.MANAGER_TRIPS} element={<TripClosurePage />} />
          <Route path={ROUTES.MANAGER_REPORTS} element={<ReportsPage />} />
          <Route path={ROUTES.MANAGER_PAYMENT_SETTINGS} element={<PaymentSettingsPage />} />
          <Route path={ROUTES.MANAGER_PROFILE} element={<ProfilePage />} />
        </Route>
      </Route>

      {/* Specialist */}
      <Route element={<PrivateRoute allowedRoles={[ROLES.SPECIALIST, 'Specialist', 'TransportSpecialist']} />}>
        <Route element={<MainLayout />}>
          <Route path={ROUTES.SPECIALIST_DASHBOARD} element={<SpecialistDashboard />} />
          <Route path={ROUTES.SPECIALIST_DOSSIERS} element={<DossiersPage />} />
          <Route path="/specialist/dossiers" element={<DossiersPage />} />
          <Route path={ROUTES.SPECIALIST_DOSSIER_DETAIL} element={<DossierDetailPage />} />
          <Route path="/specialist/dossiers/:id" element={<DossierDetailPage />} />
          <Route path={ROUTES.SPECIALIST_QUARANTINE_RULES} element={<QuarantineRulesPage />} />
          <Route path="/specialist/quarantine-rules" element={<QuarantineRulesPage />} />
          <Route path={ROUTES.SPECIALIST_DOCUMENTS} element={<DocumentsPage />} />
          <Route path="/specialist/documents" element={<DocumentsPage />} />
        </Route>
      </Route>

      {/* Coordinator */}
      <Route element={<PrivateRoute allowedRoles={[ROLES.COORDINATOR, 'Coordinator', 'FleetCoordinator']} />}>
        <Route element={<MainLayout />}>
          <Route path={ROUTES.COORDINATOR_DASHBOARD} element={<CoordinatorDashboard />} />
          <Route path={ROUTES.COORDINATOR_OPERATIONS_HUB} element={<CoordinatorDashboard />} />
          <Route path={ROUTES.COORDINATOR_ROUTE_PLANNING} element={<RoutePlanningPage />} />
          <Route path="/coordinator/route-planning" element={<RoutePlanningPage />} />
          <Route path={ROUTES.COORDINATOR_FLEET_ROSTER} element={<FleetRosterPage />} />
          <Route path="/coordinator/fleet-roster" element={<FleetRosterPage />} />
          <Route path={ROUTES.COORDINATOR_DRIVER_SCHEDULES} element={<FleetRosterPage />} />
          <Route path="/coordinator/driver-schedules" element={<FleetRosterPage />} />
          <Route path={ROUTES.COORDINATOR_INCIDENTS} element={<CoordinatorIncidentsPage />} />
          <Route path={ROUTES.COORDINATOR_TRACKING} element={<CoordinatorDashboard />} />
          <Route path="/coordinator/tracking" element={<CoordinatorDashboard />} />
        </Route>
      </Route>

      {/* Driver & Escort */}
      <Route element={<PrivateRoute allowedRoles={[ROLES.DRIVER, ROLES.ESCORT, 'Driver', 'Escort']} />}>
        <Route element={<MainLayout />}>
          <Route path={ROUTES.DRIVER_DASHBOARD} element={<DriverDashboard />} />
          <Route path={ROUTES.DRIVER_MISSIONS} element={<MissionBriefingPage />} />
          <Route path="/driver/missions" element={<MissionBriefingPage />} />
          <Route path={ROUTES.DRIVER_CHECKLIST} element={<PreDepartureChecklistPage />} />
          <Route path="/driver/missions/:tripId/checklist" element={<PreDepartureChecklistPage />} />
          <Route path={ROUTES.DRIVER_EXECUTION} element={<TripExecutionPage />} />
          <Route path="/driver/missions/:tripId/execution" element={<TripExecutionPage />} />
          <Route path={ROUTES.DRIVER_WELFARE} element={<HorseWelfareLogPage />} />
          <Route path="/driver/missions/:tripId/welfare-log" element={<HorseWelfareLogPage />} />
          <Route path={ROUTES.DRIVER_ARRIVAL} element={<ArrivalHandoverPage />} />
          <Route path="/driver/missions/:tripId/arrival" element={<ArrivalHandoverPage />} />
          <Route path={ROUTES.DRIVER_COMPLETION_REPORT} element={<MissionCompletionReportPage />} />
          <Route path="/driver/missions/:tripId/completion-report" element={<MissionCompletionReportPage />} />
          <Route path={ROUTES.DRIVER_TRIPS} element={<ActiveTripPage />} />
          <Route path="/driver/trips" element={<ActiveTripPage />} />
          <Route path={ROUTES.DRIVER_HISTORY} element={<TripHistoryPage />} />
          <Route path="/driver/history" element={<TripHistoryPage />} />
        </Route>
      </Route>

      {/* Shared Authenticated Routes - Profile hợp nhất cho toàn bộ các vai trò */}
      <Route element={<PrivateRoute allowedRoles={[ROLES.CUSTOMER, ROLES.MANAGER, ROLES.ADMIN, ROLES.SPECIALIST, ROLES.COORDINATOR, ROLES.DRIVER, ROLES.ESCORT, 'Driver', 'Escort']} />}>
        <Route element={<MainLayout />}>
          <Route path={ROUTES.PROFILE} element={<ProfilePage />} />
        </Route>
      </Route>

      {/* 404 */}
      <Route path="*" element={<NotFoundPage />} />
    </Routes>
  );
}
