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
} from 'antd';
import {
  MenuFoldOutlined,
  MenuUnfoldOutlined,
  SearchOutlined,
  GlobalOutlined,
  UserOutlined,
  LogoutOutlined,
  BellOutlined,
  HomeOutlined,
  AppstoreOutlined,
  ClockCircleOutlined,
  MailOutlined,
  CreditCardOutlined,
  SettingOutlined,
} from '@ant-design/icons';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { ROUTES } from '@routes/routes';
import { ROLES } from '@utils/constants';
import {
  getStoredRequestLetters,
  markLetterAsRead,
  markAllLettersAsRead,
} from '@utils/requestLetterStorage';

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
        message.info({
          content: `📬 Nhận được thư yêu cầu vận chuyển mới: ${letter.bookingCode} từ ${letter.customerName}`,
          duration: 5,
        });
      }
    };
    window.addEventListener('letters_updated', handleUpdate);
    window.addEventListener('request_letter_received', handleNewLetter);
    return () => {
      window.removeEventListener('letters_updated', handleUpdate);
      window.removeEventListener('request_letter_received', handleNewLetter);
    };
  }, [isAdminOrManager]);

  const getProfileRoute = () => {
    if (isAdminOrManager) return ROUTES.MANAGER_PROFILE;
    if (isCustomer) return ROUTES.CUSTOMER_PROFILE;
    return ROUTES.PROFILE;
  };

  const userMenuItems = [
    {
      key: 'home',
      icon: <HomeOutlined />,
      label: t('landing.nav.home', 'Trang chủ (Home)'),
      onClick: () => navigate(ROUTES.HOME),
    },
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
              onClick={() => {
                markLetterAsRead(item.id);
                if (isAdminOrManager) {
                  navigate(`/manager/pending-requests?id=${item.bookingId}`);
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

      {/* Cụm bên phải: Về Trang chủ, Ngôn ngữ, Chuông thông báo & Thông tin người dùng */}
      <Space size="middle" align="center">
        {/* Nút về Trang chủ Home cho khách hàng dễ truy cập */}
        <Button
          type="default"
          icon={<HomeOutlined style={{ color: '#F59E0B' }} />}
          onClick={() => navigate(ROUTES.HOME)}
          style={{
            fontWeight: 700,
            borderRadius: 9999,
            borderColor: '#e2e8f0',
            color: '#0f172a',
            backgroundColor: '#ffffff',
            boxShadow: '0 1px 3px rgba(0, 0, 0, 0.04)',
            height: 38,
            padding: '0 18px',
          }}
        >
          {t('landing.nav.home', 'Trang chủ')}
        </Button>

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
                {isCustomer ? t('nav.ownerPortal') : userRole || ''}
              </div>
            </div>
          </Flex>
        </Dropdown>
      </Space>
    </Header>
  );
}
