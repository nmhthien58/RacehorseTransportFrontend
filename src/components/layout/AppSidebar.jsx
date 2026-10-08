import { Layout, Menu } from 'antd';
import {
  AppstoreOutlined,
  ClockCircleOutlined,
  MedicineBoxOutlined,
  CarOutlined,
  CompassOutlined,
  MessageOutlined,
  UserOutlined,
  CreditCardOutlined,
  SettingOutlined,
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
 * @param {Object} [props.user] - Thông tin tài khoản người dùng đăng nhập (PascalCase)
 * @returns {JSX.Element}
 */
export default function AppSidebar({ collapsed, user }) {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const location = useLocation();

  // Danh sách menu tương ứng theo vai trò người dùng
  const getMenuItems = () => {
    if (user?.Role === ROLES.CUSTOMER) {
      return [
        {
          key: ROUTES.CUSTOMER_DASHBOARD,
          icon: <AppstoreOutlined style={{ fontSize: 18 }} />,
          label: t('nav.dashboard'),
        },
        {
          key: ROUTES.CUSTOMER_HORSES,
          icon: <ClockCircleOutlined style={{ fontSize: 18 }} />,
          label: t('nav.horses'),
        },
        {
          key: ROUTES.CUSTOMER_VET_RECORDS,
          icon: <MedicineBoxOutlined style={{ fontSize: 18 }} />,
          label: t('nav.vetRecords'),
        },
        {
          key: ROUTES.CUSTOMER_BOOKINGS,
          icon: <CarOutlined style={{ fontSize: 18 }} />,
          label: t('nav.transportRequests'),
        },
        {
          key: ROUTES.CUSTOMER_TRIPS,
          icon: <CompassOutlined style={{ fontSize: 18 }} />,
          label: t('nav.activeTrips'),
        },
        {
          key: ROUTES.CUSTOMER_MESSAGES,
          icon: <MessageOutlined style={{ fontSize: 18 }} />,
          label: t('nav.messages'),
        },
        {
          type: 'group',
          label: (
            <span
              style={{
                fontSize: 14,
                fontWeight: 700,
                color: '#1e293b',
                marginTop: 12,
                display: 'block',
              }}
            >
              {t('nav.accountGroup')}
            </span>
          ),
          children: [
            {
              key: ROUTES.CUSTOMER_PROFILE,
              icon: <UserOutlined style={{ fontSize: 18 }} />,
              label: t('nav.profile'),
            },
            {
              key: '/customer/billing',
              icon: <CreditCardOutlined style={{ fontSize: 18 }} />,
              label: t('nav.billing'),
            },
            {
              key: ROUTES.CUSTOMER_SETTINGS,
              icon: <SettingOutlined style={{ fontSize: 18 }} />,
              label: t('nav.settings'),
            },
          ],
        },
      ];
    }

    if (user?.Role === ROLES.MANAGER) {
      return [
        {
          key: ROUTES.MANAGER_DASHBOARD,
          icon: <AppstoreOutlined style={{ fontSize: 18 }} />,
          label: t('nav.dashboard'),
        },
        {
          key: ROUTES.MANAGER_BOOKINGS,
          icon: <CarOutlined style={{ fontSize: 18 }} />,
          label: t('nav.transportRequests'),
        },
        {
          key: ROUTES.MANAGER_TRIPS,
          icon: <CompassOutlined style={{ fontSize: 18 }} />,
          label: t('nav.activeTrips'),
        },
      ];
    }

    return [
      {
        key: getDashboardRoute(user?.Role),
        icon: <AppstoreOutlined style={{ fontSize: 18 }} />,
        label: t('nav.dashboard'),
      },
    ];
  };

  const menuItems = getMenuItems();

  const getSelectedKey = () => {
    const current = location.pathname;
    if (current.startsWith('/customer/horses')) return ROUTES.CUSTOMER_HORSES;
    if (current.startsWith('/customer/vet-record') || current.startsWith('/customer/vetrecord') || current.startsWith('/vet-record')) return ROUTES.CUSTOMER_VET_RECORDS;
    if (current.startsWith('/customer/bookings')) return ROUTES.CUSTOMER_BOOKINGS;
    if (current.startsWith('/customer/trips')) return ROUTES.CUSTOMER_TRIPS;
    if (current.startsWith('/customer/messages')) return ROUTES.CUSTOMER_MESSAGES;
    if (current.startsWith('/customer/profile')) return ROUTES.CUSTOMER_PROFILE;
    if (current.startsWith('/customer/billing') || current.startsWith('/billing')) return ROUTES.CUSTOMER_BILLING;
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
      {/* Khối Logo chuẩn theo Figma */}
      <div
        style={{
          height: 84,
          display: 'flex',
          alignItems: 'center',
          justifyContent: collapsed ? 'center' : 'flex-start',
          padding: collapsed ? '0 10px' : '0 20px',
          borderBottom: '1px solid #f8fafc',
        }}
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
  const map = {
    [ROLES.CUSTOMER]: ROUTES.CUSTOMER_DASHBOARD,
    [ROLES.MANAGER]: ROUTES.MANAGER_DASHBOARD,
    [ROLES.SPECIALIST]: ROUTES.SPECIALIST_DASHBOARD,
    [ROLES.COORDINATOR]: ROUTES.COORDINATOR_DASHBOARD,
    [ROLES.DRIVER]: ROUTES.DRIVER_DASHBOARD,
  };
  return map[role] || '/';
}
