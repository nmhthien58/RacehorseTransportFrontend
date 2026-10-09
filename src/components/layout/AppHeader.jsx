import { Avatar, Button, Dropdown, Flex, Input, Layout, Space } from 'antd';
import {
  MenuFoldOutlined,
  MenuUnfoldOutlined,
  SearchOutlined,
  GlobalOutlined,
  UserOutlined,
  LogoutOutlined,
  BellOutlined,
} from '@ant-design/icons';
import { useTranslation } from 'react-i18next';
import { ROLES } from '@utils/constants';

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

  const userMenuItems = [
    {
      key: 'profile',
      icon: <UserOutlined />,
      label: t('nav.profile'),
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

  const getInitials = (name) => {
    if (!name) return 'KL';
    const parts = name.trim().split(' ');
    if (parts.length === 1) return parts[0].substring(0, 2).toUpperCase();
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
  };

  const isCustomer = user?.role === ROLES.CUSTOMER;

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
      <Space size="large" align="center">
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

        {/* Chuông thông báo theo Figma */}
        <Button
          type="text"
          shape="circle"
          icon={<BellOutlined style={{ fontSize: 20, color: '#1e293b' }} />}
          aria-label="Notifications"
        />

        {/* Cụm thông tin người dùng với Avatar tròn KL */}
        <Dropdown menu={{ items: userMenuItems }} placement="bottomRight">
          <Flex
            align="center"
            gap="middle"
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
              {getInitials(user?.fullName)}
            </Avatar>
            <div style={{ lineHeight: 1.3, textAlign: 'left' }}>
              <div style={{ fontWeight: 700, fontSize: 15, color: '#0f172a' }}>
                {user?.fullName || 'Kaze Lee'}
              </div>
              <div style={{ fontSize: 12, color: '#64748b' }}>
                {isCustomer ? 'Owner Portal' : user?.role || ''}
              </div>
            </div>
          </Flex>
        </Dropdown>
      </Space>
    </Header>
  );
}
