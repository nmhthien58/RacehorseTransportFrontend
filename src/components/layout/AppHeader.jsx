import { useState, useEffect } from 'react';
import {
  Avatar,
  Badge,
  Button,
  Dropdown,
  Empty,
  Flex,
  Input,
  Layout,
  Popover,
  Space,
  Tag,
  message,
  notification,
  Modal,
} from 'antd';
import {
  MenuFoldOutlined,
  MenuUnfoldOutlined,
  SearchOutlined,
  GlobalOutlined,
  UserOutlined,
  LogoutOutlined,
  BellOutlined,
  AppstoreOutlined,
  ClockCircleOutlined,
  CreditCardOutlined,
  SettingOutlined,
  AuditOutlined,
  SwapOutlined,
  DownOutlined,
  SendOutlined,
  CompassOutlined,
  TeamOutlined,
  ClearOutlined,
} from '@ant-design/icons';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { ROUTES } from '@routes/routes';
import { ROLES } from '@utils/constants';
import { useAuthStore } from '@features/auth/store/authStore';
import usersData from '@mocks/data/users.json';
import {
  getStoredRequestLetters,
  markLetterAsRead,
  markAllLettersAsRead,
} from '@utils/requestLetterStorage';
import { getStoredUsers } from '@utils/userStorage';
import { resetToCleanData } from '@utils/dataReset';

const { Header } = Layout;

/**
 * Component thanh Header trên cùng của hệ thống khớp thiết kế Figma
 * @param {Object} props
 * @param {boolean} props.collapsed - Trạng thái thu gọn của Sidebar
 * @param {() => void} props.onToggleCollapse - Hàm toggle đóng/mở Sidebar
 * @param {Object} [props.user] - Dữ liệu người dùng đăng nhập hiện tại
 * @param {() => void} props.onLogout - Hàm xử lý đăng xuất
 * @returns {JSX.Element}
 */
export default function AppHeader({
  collapsed,
  onToggleCollapse,
  user,
  onLogout,
}) {
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();
  const { login } = useAuthStore();

  const userFullName = user?.fullName || user?.FullName || 'Jane Smith';
  const userRole = user?.role || user?.Role;
  const isCustomer = userRole === ROLES.CUSTOMER;
  const isAdminOrManager = userRole === ROLES.ADMIN || userRole === ROLES.MANAGER;

  // Hộp thư yêu cầu vận chuyển từ khách hàng dành cho Admin / Manager
  const [letters, setLetters] = useState(getStoredRequestLetters());
  const unreadCount = letters.filter((l) => !l.isRead).length;

  useEffect(() => {
    const handleUpdate = () => {
      setLetters(getStoredRequestLetters());
    };
    const handleNewLetter = (e) => {
      setLetters(getStoredRequestLetters());
      if (isAdminOrManager) {
        const letter = e.detail;
        const key = `notif-${letter.bookingId || letter.bookingCode || Date.now()}`;
        notification.open({
          key,
          message: (
            <span style={{ fontWeight: 800, fontSize: 14.5, color: '#0f172a' }}>
              📬 Yêu cầu vận chuyển mới: {letter.bookingCode}
            </span>
          ),
          description: (
            <div style={{ marginTop: 6 }}>
              <div style={{ fontSize: 13, color: '#334155' }}>
                Khách hàng: <strong>{letter.customerName || 'Jane Smith'}</strong>
              </div>
              <div style={{ fontSize: 12.5, color: '#64748b', marginTop: 4 }}>
                📍 {letter.pickupAddress} ➔ {letter.dropoffAddress}
              </div>
              <div style={{ fontSize: 12, color: '#64748b', marginTop: 2 }}>
                🐎 {letter.totalHorses || 1} ngựa ({letter.transportMode || 'Ground'})
              </div>
              <div style={{ marginTop: 10, display: 'flex', gap: 8 }}>
                <Button
                  type="primary"
                  size="small"
                  style={{
                    backgroundColor: '#d97706',
                    borderColor: '#d97706',
                    fontWeight: 700,
                    borderRadius: 6,
                  }}
                  onClick={(ev) => {
                    ev?.stopPropagation?.();
                    notification.destroy(key);
                    navigate(`/manager/pending-requests?id=${letter.bookingId}`);
                  }}
                >
                  Xem và Duyệt ngay →
                </Button>
              </div>
            </div>
          ),
          duration: 10,
          placement: 'topRight',
          style: {
            cursor: 'pointer',
            borderRadius: 14,
            border: '2px solid #fde68a',
            backgroundColor: '#fffbeb',
            boxShadow: '0 10px 25px -5px rgba(245, 158, 11, 0.25)',
          },
          onClick: () => {
            notification.destroy(key);
            navigate(`/manager/pending-requests?id=${letter.bookingId}`);
          },
        });
      }
    };

    const handlePlanAssigned = (e) => {
      const rawDetail = e?.detail || {};
      const plan = rawDetail.plan || rawDetail;
      if (!plan) return;
      const isDriverOrEscort =
        userRole === ROLES.DRIVER ||
        userRole === 'Driver' ||
        userRole === ROLES.ESCORT ||
        userRole === 'Escort';

      if (isDriverOrEscort) {
        const key = `assign-${plan?.planId || plan?.tripId || rawDetail?.tripId || Date.now()}`;
        notification.open({
          key,
          message: (
            <span style={{ fontWeight: 800, fontSize: 14.5, color: '#065f46' }}>
              🚀 Bạn có nhiệm vụ vận chuyển mới: {plan?.planCode || plan?.orderCode || plan?.bookingCode || 'Chuyến đi'}
            </span>
          ),
          description: (
            <div style={{ marginTop: 6 }}>
              <div style={{ fontSize: 13, color: '#1e293b' }}>
                Lộ trình: <strong>{plan?.origin || plan?.pickup || 'Điểm xuất phát'} ➔ {plan?.destination || plan?.dropoff || 'Điểm đến'}</strong>
              </div>
              <div style={{ fontSize: 12.5, color: '#475569', marginTop: 4 }}>
                Phương thức: <strong>{plan?.transportMode || 'Ground / Air'}</strong> • Phân công: {plan?.driverName ? `Tài xế ${plan.driverName} & ` : ''}Bác sĩ {plan?.vetEscortName || 'Escort'}
              </div>
              <div style={{ marginTop: 10, display: 'flex', gap: 8 }}>
                <Button
                  type="primary"
                  size="small"
                  style={{
                    backgroundColor: '#059669',
                    borderColor: '#059669',
                    fontWeight: 700,
                    borderRadius: 6,
                  }}
                  onClick={(ev) => {
                    ev?.stopPropagation?.();
                    notification.destroy(key);
                    navigate(ROUTES.DRIVER_DASHBOARD);
                  }}
                >
                  Xem nhiệm vụ ngay →
                </Button>
              </div>
            </div>
          ),
          duration: 12,
          placement: 'topRight',
          style: {
            cursor: 'pointer',
            borderRadius: 14,
            border: '2px solid #a7f3d0',
            backgroundColor: '#ecfdf5',
            boxShadow: '0 10px 25px -5px rgba(16, 185, 129, 0.25)',
          },
          onClick: () => {
            notification.destroy(key);
            navigate(ROUTES.DRIVER_DASHBOARD);
          },
        });
      }
    };

    window.addEventListener('letters_updated', handleUpdate);
    window.addEventListener('request_letter_received', handleNewLetter);
    window.addEventListener('plan_assigned_to_driver', handlePlanAssigned);
    return () => {
      window.removeEventListener('letters_updated', handleUpdate);
      window.removeEventListener('request_letter_received', handleNewLetter);
      window.removeEventListener('plan_assigned_to_driver', handlePlanAssigned);
    };
  }, [isAdminOrManager, navigate, userRole]);

  const getProfileRoute = () => {
    if (isAdminOrManager) return ROUTES.MANAGER_PROFILE;
    if (isCustomer) return ROUTES.CUSTOMER_PROFILE;
    return ROUTES.PROFILE;
  };

  // Danh sách các vai trò chuẩn hệ thống (Logistic Manager & Admin là 1)
  const storedUsers = getStoredUsers();
  const roleOptions = [
    {
      key: 'Customer',
      title: 'Customer (Khách hàng)',
      subtitle: `${userFullName} • Tạo yêu cầu vận chuyển ngựa`,
      role: ROLES.CUSTOMER,
      route: ROUTES.CUSTOMER_DASHBOARD,
      user: storedUsers.find((u) => u.role === ROLES.CUSTOMER) || usersData.find((u) => u.role === ROLES.CUSTOMER),
    },
    {
      key: 'LogisticsManager',
      title: 'Logistics Manager (Quản lý & Admin)',
      subtitle: 'Trần Quốc Bảo • Duyệt đơn khách & Duyệt kế hoạch lộ trình',
      role: ROLES.MANAGER,
      route: ROUTES.MANAGER_DASHBOARD,
      user: storedUsers.find((u) => u.role === ROLES.MANAGER) || usersData.find((u) => u.role === ROLES.MANAGER),
    },
    {
      key: 'FleetCoordinator',
      title: 'Fleet & Route Coordinator (Điều phối)',
      subtitle: 'Lê Hoàng Nam • Lập kế hoạch lộ trình, chọn xe, driver & escort',
      role: ROLES.COORDINATOR,
      route: ROUTES.COORDINATOR_DASHBOARD,
      user: storedUsers.find((u) => u.role === ROLES.COORDINATOR) || usersData.find((u) => u.role === ROLES.COORDINATOR),
    },
    {
      key: 'Driver',
      title: 'Driver (Tài xế)',
      subtitle: 'Phạm Văn Đức • Bắt đầu chuyến & Chạy lộ trình',
      role: ROLES.DRIVER,
      route: ROUTES.DRIVER_DASHBOARD,
      user: storedUsers.find((u) => u.role === ROLES.DRIVER) || usersData.find((u) => u.role === ROLES.DRIVER),
    },
    {
      key: 'Escort',
      title: 'Escort (Bác sĩ áp tải)',
      subtitle: 'Dr. Elena Rostova • Giám sát & Ghi log phúc lợi thú y',
      role: ROLES.ESCORT,
      route: ROUTES.DRIVER_DASHBOARD,
      user: storedUsers.find((u) => u.role === ROLES.ESCORT) || usersData.find((u) => u.role === ROLES.ESCORT),
    },
    {
      key: 'Specialist',
      title: 'Transport Specialist (Kiểm dịch)',
      subtitle: 'Nguyễn Thị Mai • Kiểm dịch & Hồ sơ xuất nhập cảnh',
      role: ROLES.SPECIALIST,
      route: ROUTES.SPECIALIST_DASHBOARD,
      user: storedUsers.find((u) => u.role === ROLES.SPECIALIST) || usersData.find((u) => u.role === ROLES.SPECIALIST),
    },
  ];

  const handleRoleSwitch = (opt) => {
    if (!opt.user) return;
    login(opt.user, `mock-token-${opt.user.userId}`);
    message.success({
      content: `Đã chuyển sang vai trò: ${opt.user.fullName} (${opt.title})`,
      duration: 3,
    });
    navigate(opt.route);
  };

  const getRoleDisplayName = (role) => {
    if (role === ROLES.MANAGER || role === 'Admin' || role === 'LogisticsManager') return 'Logistics Manager / Admin';
    if (role === ROLES.COORDINATOR || role === 'FleetCoordinator') return 'Fleet & Route';
    if (role === ROLES.DRIVER || role === 'Driver') return 'Driver';
    if (role === ROLES.ESCORT || role === 'Escort') return 'Escort';
    if (role === ROLES.CUSTOMER || role === 'Customer') return 'Customer';
    if (role === ROLES.SPECIALIST || role === 'TransportSpecialist') return 'Specialist';
    return role || 'Người dùng';
  };

  const userMenuItems = [
    ...(isAdminOrManager
      ? [
          {
            key: 'manager',
            icon: <AppstoreOutlined />,
            label: t('nav.managerDashboard', 'Bảng quản lý (Manager)'),
            onClick: () => navigate(ROUTES.MANAGER_DASHBOARD),
          },
          {
            key: 'pending',
            icon: <ClockCircleOutlined />,
            label: t('nav.pendingRequests', 'Yêu cầu chờ duyệt'),
            onClick: () => navigate(ROUTES.MANAGER_PENDING_REQUESTS),
          },
          {
            key: 'route-approvals',
            icon: <AuditOutlined />,
            label: t('nav.routeApprovals', 'Phê duyệt kế hoạch lộ trình'),
            onClick: () => navigate(ROUTES.MANAGER_ROUTE_APPROVALS),
          },
          {
            key: 'user-management',
            icon: <TeamOutlined />,
            label: 'Quản lý người dùng',
            onClick: () => navigate(ROUTES.ADMIN_USERS),
          },
        ]
      : []),
    ...(userRole === ROLES.COORDINATOR
      ? [
          {
            key: 'coord-dash',
            icon: <AppstoreOutlined />,
            label: t('nav.coordinatorOperations', 'Điều phối & Vận hành'),
            onClick: () => navigate(ROUTES.COORDINATOR_DASHBOARD),
          },
          {
            key: 'coord-plan',
            icon: <CompassOutlined />,
            label: t('nav.routePlanning', 'Lập kế hoạch lộ trình (Studio)'),
            onClick: () => navigate(ROUTES.COORDINATOR_ROUTE_PLANNING),
          },
        ]
      : []),
    ...(userRole === ROLES.DRIVER || userRole === 'Driver' || userRole === ROLES.ESCORT || userRole === 'Escort'
      ? [
          {
            key: 'driver-mission',
            icon: <SendOutlined />,
            label: userRole === ROLES.ESCORT || userRole === 'Escort' ? 'Giám sát thú y & Áp tải (Mission Control)' : t('nav.driverMission', 'Nhiệm vụ vận chuyển (Mission Control)'),
            onClick: () => navigate(ROUTES.DRIVER_DASHBOARD),
          },
        ]
      : []),
    {
      key: 'profile',
      icon: <UserOutlined />,
      label: t('nav.profile', 'Hồ sơ cá nhân'),
      onClick: () => navigate(getProfileRoute()),
    },
    ...(isCustomer
      ? [
          {
            key: 'billing',
            icon: <CreditCardOutlined />,
            label: t('nav.billing', 'Hóa đơn & Thanh toán'),
            onClick: () => navigate(ROUTES.CUSTOMER_BILLING || '/customer/billing'),
          },
          {
            key: 'settings',
            icon: <SettingOutlined />,
            label: t('nav.settings', 'Cài đặt tài khoản'),
            onClick: () => navigate(ROUTES.CUSTOMER_SETTINGS || '/customer/settings'),
          },
        ]
      : []),
    {
      key: 'clean-data',
      icon: <ClearOutlined style={{ color: '#ef4444' }} />,
      label: <span style={{ color: '#ef4444', fontWeight: 600 }}>Dọn sạch dữ liệu mẫu (Reset Data)</span>,
      onClick: () => {
        Modal.confirm({
          title: 'Xác nhận dọn dẹp dữ liệu mẫu?',
          content: 'Toàn bộ đơn đặt chuyến, kế hoạch lộ trình, hồ sơ kiểm dịch và nhật ký vận chuyển sẽ được xóa sạch để bắt đầu từ đầu. MỌI TÀI KHOẢN NGƯỜI DÙNG ĐƯỢC GIỮ NGUYÊN 100%.',
          okText: 'Dọn sạch ngay',
          okType: 'danger',
          cancelText: 'Hủy',
          onOk: () => {
            resetToCleanData();
            message.success('Đã dọn dẹp dữ liệu mẫu thành công! Tất cả tài khoản người dùng vẫn được giữ nguyên.');
          },
        });
      },
    },
    {
      type: 'divider',
    },
    {
      key: 'logout',
      icon: <LogoutOutlined />,
      label: t('auth.logout'),
      danger: true,
      onClick: onLogout,
    },
  ];

  const notificationContent = (
    <div style={{ width: 360, maxWidth: '90vw' }}>
      <Flex justify="space-between" align="center" style={{ marginBottom: 12, paddingBottom: 8, borderBottom: '1px solid #f1f5f9' }}>
        <strong style={{ fontSize: 14.5, color: '#0f172a' }}>
          📬 {isAdminOrManager ? 'Hộp thư yêu cầu vận chuyển' : 'Thông báo hệ thống'}
        </strong>
        {unreadCount > 0 && (
          <Button
            type="link"
            size="small"
            onClick={markAllLettersAsRead}
            style={{ padding: 0, fontSize: 12 }}
          >
            Đọc tất cả
          </Button>
        )}
      </Flex>

      {letters.length === 0 ? (
        <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description="Chưa có thư yêu cầu nào" />
      ) : (
        <div style={{ maxHeight: 320, overflowY: 'auto' }}>
          {letters.slice(0, 5).map((item) => (
            <div
              key={item.id}
              role="button"
              tabIndex={0}
              onClick={() => {
                markLetterAsRead(item.id);
                if (isAdminOrManager) {
                  navigate(`/manager/pending-requests?id=${item.bookingId}`);
                }
              }}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault();
                  markLetterAsRead(item.id);
                  if (isAdminOrManager) {
                    navigate(`/manager/pending-requests?id=${item.bookingId}`);
                  }
                }
              }}
              style={{
                padding: '10px 12px',
                borderRadius: 10,
                backgroundColor: item.isRead ? '#ffffff' : '#fffbeb',
                border: item.isRead ? '1px solid #f1f5f9' : '1px solid #fde68a',
                marginBottom: 8,
                cursor: 'pointer',
                transition: 'all 0.2s',
              }}
            >
              <Flex justify="space-between" align="flex-start">
                <strong style={{ fontSize: 13, color: item.isRead ? '#334155' : '#92400e' }}>
                  {item.customerName}
                </strong>
                <Tag color={item.isRead ? 'default' : 'gold'} style={{ fontSize: 11, margin: 0 }}>
                  {item.bookingCode}
                </Tag>
              </Flex>
              <div style={{ fontSize: 12, color: '#64748b', marginTop: 4, lineHeight: 1.3 }}>
                📍 {item.pickupAddress?.split(',')[0]} → {item.dropoffAddress?.split(',')[0]} ({item.transportMode})
              </div>
              <div style={{ fontSize: 11, color: '#94a3b8', marginTop: 4, display: 'flex', justifyContent: 'space-between' }}>
                <span>${Number(item.estimatedCost)?.toLocaleString()} USD</span>
                <span style={{ color: '#f59e0b', fontWeight: 600 }}>Xem thư & duyệt →</span>
              </div>
            </div>
          ))}
        </div>
      )}

      {isAdminOrManager && (
        <Button
          type="primary"
          block
          onClick={() => navigate(ROUTES.MANAGER_PENDING_REQUESTS)}
          style={{
            marginTop: 8,
            borderRadius: 8,
            backgroundColor: '#f59e0b',
            borderColor: '#f59e0b',
            fontWeight: 700,
          }}
        >
          Xem tất cả yêu cầu chờ duyệt ({letters.length})
        </Button>
      )}
    </div>
  );

  const getInitials = (name) => {
    if (!name) return 'KL';
    const parts = name.trim().split(' ');
    if (parts.length === 1) return parts[0].substring(0, 2).toUpperCase();
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
  };

  return (
    <Header
      style={{
        padding: '0 32px',
        background: '#FFF9EE',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        position: 'sticky',
        top: 0,
        zIndex: 9,
        height: 76,
        borderBottom: 'none',
      }}
    >
      {/* Cụm bên trái: Toggle Sidebar & Ô tìm kiếm viên thuốc (Pill) */}
      <Flex align="center" gap="middle">
        <Button
          type="text"
          icon={collapsed ? <MenuUnfoldOutlined /> : <MenuFoldOutlined />}
          onClick={onToggleCollapse}
          aria-label="Toggle Sidebar"
          style={{ fontSize: 18, color: '#1e293b' }}
        />

        <Input
          prefix={<SearchOutlined style={{ color: '#94a3b8', fontSize: 16 }} />}
          placeholder={t('nav.searchPlaceholder')}
          style={{
            width: 380,
            height: 42,
            borderRadius: 9999,
            background: '#ffffff',
            border: '1px solid #e2e8f0',
            boxShadow: '0 1px 3px rgba(0, 0, 0, 0.02)',
            padding: '0 16px',
            fontSize: 14,
          }}
          allowClear
        />
      </Flex>

      {/* Cụm bên phải: Ngôn ngữ, Chuông thông báo & Thông tin người dùng */}
      <Space size="middle" align="center">
        {/* Nút chuyển đổi nhanh vai trò hệ thống (Role Switcher) để test liền mạch */}
        <Dropdown
          menu={{
            items: roleOptions.map((opt) => ({
              key: opt.key,
              label: (
                <div style={{ padding: '4px 0' }}>
                  <div style={{ fontWeight: 600, color: '#0f172a', fontSize: 13 }}>
                    {opt.title}
                  </div>
                  <div style={{ fontSize: 11, color: '#64748b' }}>
                    {opt.subtitle}
                  </div>
                </div>
              ),
              onClick: () => handleRoleSwitch(opt),
            })),
          }}
          placement="bottomRight"
          trigger={['click']}
        >
          <Button
            style={{
              height: 38,
              borderRadius: 20,
              background: '#ffffff',
              border: '1.5px solid #FBA919',
              color: '#92400e',
              fontWeight: 600,
              fontSize: 13,
              display: 'inline-flex',
              alignItems: 'center',
              gap: 6,
              boxShadow: '0 2px 4px rgba(251, 169, 25, 0.12)',
            }}
          >
            <SwapOutlined style={{ color: '#d97706' }} />
            <span>
              Vai trò:{' '}
              <strong style={{ color: '#0f172a' }}>
                {getRoleDisplayName(userRole)}
              </strong>
            </span>
            <DownOutlined style={{ fontSize: 10, color: '#94a3b8' }} />
          </Button>
        </Dropdown>

        {/* Nút chuyển đổi ngôn ngữ */}
        <Button
          type="text"
          icon={<GlobalOutlined />}
          onClick={() =>
            i18n.changeLanguage(i18n.language === 'vi' ? 'en' : 'vi')
          }
          style={{ fontWeight: 600, color: '#475569' }}
        >
          {i18n.language === 'vi' ? 'EN' : 'VI'}
        </Button>

        {/* Chuông thông báo & Hộp thư yêu cầu */}
        <Popover
          content={notificationContent}
          trigger="click"
          placement="bottomRight"
        >
          <Badge count={unreadCount} overflowCount={9} offset={[-4, 4]}>
            <Button
              type="text"
              shape="circle"
              icon={<BellOutlined style={{ fontSize: 20, color: '#1e293b' }} />}
              aria-label="Notifications"
            />
          </Badge>
        </Popover>

        {/* Cụm thông tin người dùng với Avatar tròn KL */}
        <Dropdown menu={{ items: userMenuItems }} placement="bottomRight">
          <Flex
            align="center"
            gap="middle"
            onClick={() => navigate(getProfileRoute())}
            style={{
              cursor: 'pointer',
              padding: '4px 6px',
              borderRadius: 8,
            }}
          >
            <Avatar
              size={42}
              style={{
                backgroundColor: '#FBA919',
                color: '#ffffff',
                fontWeight: 700,
                fontSize: 16,
              }}
            >
              {getInitials(userFullName)}
            </Avatar>
            <div style={{ lineHeight: 1.3, textAlign: 'left' }}>
              <div style={{ fontWeight: 700, fontSize: 15, color: '#0f172a' }}>
                {userFullName}
              </div>
              <div style={{ fontSize: 12, color: '#64748b' }}>
                {isCustomer ? t('nav.ownerPortal', 'Owner Portal') : userRole || ''}
              </div>
            </div>
          </Flex>
        </Dropdown>
      </Space>
    </Header>
  );
}
