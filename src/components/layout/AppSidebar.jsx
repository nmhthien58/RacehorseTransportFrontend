import { Layout, Menu } from 'antd';
import {
  AppstoreOutlined,
  ClockCircleOutlined,
  MedicineBoxOutlined,
  CarOutlined,
  CompassOutlined,
  MessageOutlined,
  UserOutlined,
  DollarCircleOutlined,
  SendOutlined,
  AuditOutlined,
  FileTextOutlined,
  HistoryOutlined,
  TeamOutlined,
  WarningOutlined,
  FileDoneOutlined,
  BarChartOutlined,
  DollarOutlined,
  CreditCardOutlined,
} from '@ant-design/icons';
import { useNavigate, useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { ROUTES } from '@routes/routes';
import { ROLES } from '@utils/constants';
import logoSvg from '@assets/logo.svg';

const { Sider } = Layout;

/**
 * Component thanh điều hướng bên trái (Sidebar) của hệ thống khớp thiết kế Figma
 * @param {Object} props
 * @param {boolean} props.collapsed - Trạng thái thu gọn của Sider
 * @param {Object} [props.user] - Thông tin tài khoản người dùng đăng nhập
 * @returns {JSX.Element}
 */
export default function AppSidebar({ collapsed, user }) {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const location = useLocation();

  const userRole = user?.role || user?.Role;

  // Danh sách menu tương ứng theo vai trò người dùng
  const getMenuItems = () => {
    if (userRole === ROLES.CUSTOMER) {
      return [
        {
          key: ROUTES.CUSTOMER_DASHBOARD,
          icon: <AppstoreOutlined style={{ fontSize: 18 }} />,
          label: t('nav.dashboard', 'Bảng điều khiển'),
        },
        {
          key: ROUTES.CUSTOMER_HORSES,
          icon: <ClockCircleOutlined style={{ fontSize: 18 }} />,
          label: t('nav.horses', 'Ngựa của tôi'),
        },
        {
          key: ROUTES.CUSTOMER_VET_RECORDS,
          icon: <MedicineBoxOutlined style={{ fontSize: 18 }} />,
          label: t('nav.vetRecords', 'Hồ sơ thú y'),
        },
        {
          key: ROUTES.CUSTOMER_BOOKINGS,
          icon: <CarOutlined style={{ fontSize: 18 }} />,
          label: t('nav.transportOrders', 'Đơn vận chuyển'),
        },
        {
          key: ROUTES.CUSTOMER_BILLING,
          icon: <CreditCardOutlined style={{ fontSize: 18 }} />,
          label: t('nav.billing', 'Thanh toán'),
        },
        {
          key: ROUTES.CUSTOMER_PRICING,
          icon: <DollarCircleOutlined style={{ fontSize: 18 }} />,
          label: t('nav.pricing', 'Bảng giá cước'),
        },
        {
          key: ROUTES.CUSTOMER_MESSAGES,
          icon: <MessageOutlined style={{ fontSize: 18 }} />,
          label: t('nav.messages', 'Tin nhắn'),
        },
      ];
    }

    if (userRole === ROLES.MANAGER || userRole === ROLES.ADMIN || userRole === 'Admin' || userRole === 'LogisticsManager') {
      return [
        {
          key: ROUTES.MANAGER_DASHBOARD,
          icon: <AppstoreOutlined style={{ fontSize: 18 }} />,
          label: t('nav.dashboard', 'Bảng điều khiển'),
        },
        {
          key: ROUTES.MANAGER_BOOKINGS,
          icon: <CarOutlined style={{ fontSize: 18 }} />,
          label: t('nav.transportRequests', 'Đơn đặt chuyến'),
        },
        {
          key: ROUTES.MANAGER_PENDING_REQUESTS,
          icon: <ClockCircleOutlined style={{ fontSize: 18 }} />,
          label: t('nav.pendingRequests', 'Yêu cầu chờ duyệt'),
        },
        {
          key: ROUTES.MANAGER_ROUTE_APPROVALS,
          icon: <AuditOutlined style={{ fontSize: 18 }} />,
          label: t('nav.routeApprovals', 'Phê duyệt lộ trình'),
        },
        {
          key: ROUTES.MANAGER_INCIDENTS,
          icon: <WarningOutlined style={{ fontSize: 18 }} />,
          label: t('nav.incidentReview', 'Duyệt xử lý sự cố'),
        },
        {
          key: ROUTES.MANAGER_TRIPS,
          icon: <FileDoneOutlined style={{ fontSize: 18 }} />,
          label: t('nav.tripClosure', 'Đóng chuyến & KPI'),
        },
        {
          key: ROUTES.MANAGER_REPORTS,
          icon: <BarChartOutlined style={{ fontSize: 18 }} />,
          label: t('nav.reports', 'Báo cáo'),
        },
        {
          key: ROUTES.MANAGER_PAYMENT_SETTINGS,
          icon: <DollarOutlined style={{ fontSize: 18 }} />,
          label: t('nav.paymentSettings', 'Cấu hình thanh toán'),
        },
        {
          key: ROUTES.ADMIN_USERS,
          icon: <TeamOutlined style={{ fontSize: 18 }} />,
          label: t('nav.userManagement', 'Quản lý người dùng'),
        },
        {
          key: ROUTES.PROFILE,
          icon: <UserOutlined style={{ fontSize: 18 }} />,
          label: t('nav.profile', 'Hồ sơ cá nhân'),
        },
      ];
    }

    if (userRole === ROLES.COORDINATOR || userRole === 'FleetCoordinator') {
      return [
        {
          key: ROUTES.COORDINATOR_DASHBOARD,
          icon: <AppstoreOutlined style={{ fontSize: 18 }} />,
          label: t('nav.coordinatorOperations', 'Điều phối & Vận hành'),
        },
        {
          key: ROUTES.COORDINATOR_ROUTE_PLANNING,
          icon: <CompassOutlined style={{ fontSize: 18 }} />,
          label: t('nav.routePlanning', 'Lập kế hoạch lộ trình'),
        },
        {
          key: ROUTES.COORDINATOR_FLEET_ROSTER,
          icon: <CarOutlined style={{ fontSize: 18 }} />,
          label: t('nav.fleetRoster', 'Đội xe & Nhân sự'),
        },
        {
          key: ROUTES.COORDINATOR_INCIDENTS,
          icon: <WarningOutlined style={{ fontSize: 18 }} />,
          label: t('nav.incidents', 'Sự cố & nắn tuyến'),
        },
        {
          key: ROUTES.PROFILE,
          icon: <UserOutlined style={{ fontSize: 18 }} />,
          label: t('nav.profile', 'Hồ sơ cá nhân'),
        },
      ];
    }

    if (userRole === ROLES.DRIVER || userRole === 'Driver' || userRole === 'DriverEscort') {
      return [
        {
          key: ROUTES.DRIVER_DASHBOARD,
          icon: <AppstoreOutlined style={{ fontSize: 18 }} />,
          label: t('nav.driverDashboard', 'Bảng điều khiển & Ca trực'),
        },
        {
          key: ROUTES.DRIVER_MISSIONS,
          icon: <SendOutlined style={{ fontSize: 18 }} />,
          label: t('nav.driverMissions', 'Nhiệm vụ vận chuyển'),
        },
        {
          key: ROUTES.DRIVER_TRIPS,
          icon: <CompassOutlined style={{ fontSize: 18 }} />,
          label: t('nav.activeTrips', 'Hành trình đang chạy'),
        },
        {
          key: ROUTES.DRIVER_HISTORY,
          icon: <HistoryOutlined style={{ fontSize: 18 }} />,
          label: t('nav.tripHistory', 'Lịch sử chuyến đi'),
        },
        {
          key: ROUTES.PROFILE,
          icon: <UserOutlined style={{ fontSize: 18 }} />,
          label: t('nav.profile', 'Hồ sơ cá nhân'),
        },
      ];
    }

    if (userRole === ROLES.ESCORT || userRole === 'Escort') {
      return [
        {
          key: ROUTES.DRIVER_DASHBOARD,
          icon: <AppstoreOutlined style={{ fontSize: 18 }} />,
          label: t('nav.escortDashboard', 'Bảng điều khiển & Ca trực'),
        },
        {
          key: ROUTES.DRIVER_MISSIONS,
          icon: <MedicineBoxOutlined style={{ fontSize: 18 }} />,
          label: t('nav.escortMissions', 'Nhiệm vụ áp tải thú y'),
        },
        {
          key: ROUTES.DRIVER_TRIPS,
          icon: <CompassOutlined style={{ fontSize: 18 }} />,
          label: t('nav.activeTrips', 'Hành trình đang chạy'),
        },
        {
          key: ROUTES.DRIVER_HISTORY,
          icon: <HistoryOutlined style={{ fontSize: 18 }} />,
          label: t('nav.tripHistory', 'Lịch sử chuyến đi'),
        },
        {
          key: ROUTES.PROFILE,
          icon: <UserOutlined style={{ fontSize: 18 }} />,
          label: t('nav.profile', 'Hồ sơ cá nhân'),
        },
      ];
    }

    if (userRole === ROLES.SPECIALIST || userRole === 'TransportSpecialist') {
      return [
        {
          key: ROUTES.SPECIALIST_DASHBOARD,
          icon: <AppstoreOutlined style={{ fontSize: 18 }} />,
          label: t('nav.specialistDashboard', 'Bảng điều khiển'),
        },
        {
          key: ROUTES.SPECIALIST_DOSSIERS,
          icon: <AuditOutlined style={{ fontSize: 18 }} />,
          label: t('nav.specialistDossiers', 'Hồ sơ pháp lý'),
        },
        {
          key: ROUTES.SPECIALIST_DOCUMENTS,
          icon: <FileTextOutlined style={{ fontSize: 18 }} />,
          label: t('nav.specialistDocuments', 'Biểu mẫu hồ sơ'),
        },
        {
          key: ROUTES.SPECIALIST_QUARANTINE_RULES,
          icon: <MedicineBoxOutlined style={{ fontSize: 18 }} />,
          label: t('nav.specialistQuarantineRules', 'Quy định kiểm dịch'),
        },
        {
          key: ROUTES.PROFILE,
          icon: <UserOutlined style={{ fontSize: 18 }} />,
          label: t('nav.profile', 'Hồ sơ cá nhân'),
        },
      ];
    }

    return [
      {
        key: getDashboardRoute(userRole),
        icon: <AppstoreOutlined style={{ fontSize: 18 }} />,
        label: t('nav.dashboard', 'Bảng điều khiển'),
      },
      {
        key: ROUTES.PROFILE,
        icon: <UserOutlined style={{ fontSize: 18 }} />,
        label: t('nav.profile', 'Hồ sơ cá nhân'),
      },
    ];
  };

  const menuItems = getMenuItems();

  const getSelectedKey = () => {
    const current = location.pathname;
    if (current.startsWith('/customer/horses')) return ROUTES.CUSTOMER_HORSES;
    if (current.startsWith('/customer/vet-record') || current.startsWith('/customer/vetrecord') || current.startsWith('/vet-record')) return ROUTES.CUSTOMER_VET_RECORDS;
    if (current.startsWith('/customer/bookings') || current.startsWith('/customer/booking')) return ROUTES.CUSTOMER_BOOKINGS;
    if (current.startsWith('/customer/pricing')) return ROUTES.CUSTOMER_PRICING;
    // R-07: hành trình của khách nằm trong chi tiết đơn
    if (current.startsWith('/customer/trips')) return ROUTES.CUSTOMER_BOOKINGS;
    if (current.startsWith('/customer/messages')) return ROUTES.CUSTOMER_MESSAGES;
    if (current.startsWith('/customer/profile')) return ROUTES.CUSTOMER_PROFILE;
    if (current.startsWith('/customer/billing') || current.startsWith('/billing')) return ROUTES.CUSTOMER_BILLING;
    if (current.startsWith('/manager/route-approvals')) return ROUTES.MANAGER_ROUTE_APPROVALS;
    if (current.startsWith('/manager/incidents')) return ROUTES.MANAGER_INCIDENTS;
    if (current.startsWith('/manager/trips')) return ROUTES.MANAGER_TRIPS;
    if (current.startsWith('/manager/reports')) return ROUTES.MANAGER_REPORTS;
    if (current.startsWith('/manager/pending-requests')) return ROUTES.MANAGER_PENDING_REQUESTS;
    if (current.startsWith('/manager/bookings')) return ROUTES.MANAGER_BOOKINGS;
    if (current.startsWith('/manager/dashboard')) return ROUTES.MANAGER_DASHBOARD;
    if (current.startsWith('/manager/profile')) return ROUTES.PROFILE;
    if (current.startsWith('/coordinator/route-planning')) return ROUTES.COORDINATOR_ROUTE_PLANNING;
    if (current.startsWith('/coordinator/incidents')) return ROUTES.COORDINATOR_INCIDENTS;
    if (current.startsWith('/coordinator/fleet-roster') || current.startsWith('/coordinator/driver-schedules')) return ROUTES.COORDINATOR_FLEET_ROSTER;
    if (current.startsWith('/coordinator/dashboard') || current.startsWith('/coordinator')) return ROUTES.COORDINATOR_DASHBOARD;
    if (current.startsWith('/driver/history') || current.includes('/completion-report')) return ROUTES.DRIVER_HISTORY;
    if (current.startsWith('/driver/trips')) return ROUTES.DRIVER_TRIPS;
    if (current.startsWith('/driver/missions')) return ROUTES.DRIVER_MISSIONS;
    if (current.startsWith('/driver/dashboard') || current === '/driver') return ROUTES.DRIVER_DASHBOARD;
    if (current.startsWith('/specialist/documents')) return ROUTES.SPECIALIST_DOCUMENTS;
    if (current.startsWith('/specialist/quarantine-rules')) return ROUTES.SPECIALIST_QUARANTINE_RULES;
    if (current.startsWith('/specialist/dossiers')) return ROUTES.SPECIALIST_DOSSIERS;
    if (current.startsWith('/specialist/dashboard') || current.startsWith('/specialist')) return ROUTES.SPECIALIST_DASHBOARD;
    if (current === '/profile') return ROUTES.PROFILE;
    return current;
  };

  return (
    <Sider
      trigger={null}
      collapsible
      collapsed={collapsed}
      width={250}
      theme="light"
      style={{
        borderRight: '1px solid #f1f5f9',
        height: '100vh',
        position: 'sticky',
        top: 0,
        left: 0,
        zIndex: 10,
        background: '#ffffff',
      }}
    >
      {/* Khối Logo chuẩn theo Figma - Click để về Dashboard */}
      <div
        role="button"
        tabIndex={0}
        onClick={() => navigate(getDashboardRoute(userRole))}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            navigate(getDashboardRoute(userRole));
          }
        }}
        style={{
          height: 84,
          display: 'flex',
          alignItems: 'center',
          justifyContent: collapsed ? 'center' : 'flex-start',
          padding: collapsed ? '0 10px' : '0 20px',
          borderBottom: '1px solid #f8fafc',
          cursor: 'pointer',
          transition: 'opacity 0.2s ease',
        }}
        title="Dashboard"
        onMouseEnter={(e) => (e.currentTarget.style.opacity = '0.85')}
        onMouseLeave={(e) => (e.currentTarget.style.opacity = '1')}
      >
        <img
          src={logoSvg}
          alt="International Equine Transport"
          style={{
            maxHeight: collapsed ? 36 : 48,
            maxWidth: '100%',
            objectFit: 'contain',
          }}
        />
      </div>

      {/* Menu điều hướng với style pill vàng cam của Figma */}
      <div
        style={{
          height: 'calc(100vh - 84px)',
          overflowY: 'auto',
          padding: '12px 14px',
        }}
      >
        <Menu
          theme="light"
          mode="inline"
          selectedKeys={[getSelectedKey()]}
          items={menuItems}
          onClick={({ key }) => navigate(key)}
          style={{
            borderRight: 0,
            fontSize: 15,
            fontWeight: 500,
          }}
        />
      </div>
    </Sider>
  );
}

/**
 * Trả về route dashboard tương ứng với từng role
 * @param {string} [role]
 * @returns {string}
 */
function getDashboardRoute(role) {
  if (role === ROLES.CUSTOMER || role === 'Customer') return ROUTES.CUSTOMER_DASHBOARD;
  if (role === ROLES.MANAGER || role === ROLES.ADMIN || role === 'LogisticsManager' || role === 'Admin') return ROUTES.MANAGER_DASHBOARD;
  if (role === ROLES.COORDINATOR || role === 'FleetCoordinator') return ROUTES.COORDINATOR_DASHBOARD;
  if (role === ROLES.DRIVER || role === 'Driver' || role === ROLES.ESCORT || role === 'Escort' || role === 'DriverEscort') return ROUTES.DRIVER_DASHBOARD;
  if (role === ROLES.SPECIALIST || role === 'TransportSpecialist') return ROUTES.SPECIALIST_DASHBOARD;
  return '/';
}
