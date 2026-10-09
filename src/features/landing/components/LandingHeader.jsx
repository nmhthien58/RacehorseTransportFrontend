import { useState, useEffect } from 'react';
import {
  Avatar,
  Button,
  Dropdown,
  Flex,
  Space,
  message,
} from 'antd';
import {
  GlobalOutlined,
  UserOutlined,
  LogoutOutlined,
  DashboardOutlined,
  DownOutlined,
  RightOutlined,
  FolderOpenOutlined,
  DollarCircleOutlined,
} from '@ant-design/icons';
import { useNavigate, useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { ROUTES } from '@routes/routes';
import { useAuthStore } from '@features/auth/store/authStore';
import logoWhite from '@assets/logo-white-web.png';

export default function LandingHeader({ activeKey = 'home' }) {
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();
  const location = useLocation();
  const { user, isAuthenticated, logout } = useAuthStore();
  const [isScrolled, setIsScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 30);
    };
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const getInitials = (name) => {
    if (!name) return 'KL';
    const parts = name.trim().split(' ');
    if (parts.length === 1) return parts[0].substring(0, 2).toUpperCase();
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
  };

  const handleLogout = () => {
    logout();
    message.success(t('auth.logoutSuccess', 'Đăng xuất thành công'));
    navigate(ROUTES.HOME);
  };

  const handleAccountClick = () => {
    if (!isAuthenticated) {
      message.warning(t('landing.nav.loginRequired', 'Vui lòng đăng nhập để truy cập tài khoản.'));
      navigate(ROUTES.LOGIN, { state: { returnTo: ROUTES.CUSTOMER_DASHBOARD } });
    } else {
      navigate(ROUTES.CUSTOMER_DASHBOARD);
    }
  };

  const handleHomeClick = () => {
    if (location.pathname === ROUTES.HOME) {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } else {
      navigate(ROUTES.HOME);
    }
  };

  const handleTransportClick = () => {
    navigate(ROUTES.TRANSPORT_TYPES);
  };

  const handlePricingClick = () => {
    navigate(ROUTES.PRICING);
  };

  // Menu thả xuống của mục More
  const moreMenuItems = [
    {
      key: 'how-it-works',
      label: (
        <Flex align="center" justify="space-between" style={{ minWidth: 170, padding: '4px 0' }}>
          <span style={{ fontWeight: 600 }}>{t('landing.nav.howItWorks')}</span>
          <RightOutlined style={{ fontSize: 11, color: '#94a3b8' }} />
        </Flex>
      ),
      onClick: () => navigate(ROUTES.HOW_IT_WORKS),
    },
    {
      type: 'divider',
    },
    {
      key: 'become-a-hauler',
      label: (
        <Flex align="center" justify="space-between" style={{ minWidth: 170, padding: '4px 0' }}>
          <span style={{ fontWeight: 600 }}>{t('landing.nav.becomeHauler')}</span>
          <RightOutlined style={{ fontSize: 11, color: '#94a3b8' }} />
        </Flex>
      ),
      onClick: () => navigate(ROUTES.BECOME_HAULER),
    },
  ];

  // Menu thả xuống cho User Profile (có My Profile, Dashboard, Logout)
  const userProfileMenuItems = [
    {
      key: 'user-header',
      disabled: true,
      label: (
        <div style={{ padding: '6px 4px 4px 4px' }}>
          <div style={{ fontWeight: 700, color: '#0f172a', fontSize: 14 }}>
            {user?.FullName || 'Kaze Lee'}
          </div>
          <div style={{ fontSize: 12, color: '#64748b' }}>
            {user?.Email || 'customer@test.com'}
          </div>
        </div>
      ),
    },
    {
      type: 'divider',
    },
    {
      key: 'profile',
      icon: <UserOutlined />,
      label: <span style={{ fontWeight: 600 }}>{t('landing.nav.profile')}</span>,
      onClick: () => navigate(ROUTES.CUSTOMER_PROFILE),
    },
    {
      key: 'dashboard',
      icon: <DashboardOutlined />,
      label: <span style={{ fontWeight: 600 }}>{t('landing.nav.dashboard')}</span>,
      onClick: () => navigate(ROUTES.CUSTOMER_DASHBOARD),
    },
    {
      key: 'pricing',
      icon: <DollarCircleOutlined />,
      label: <span style={{ fontWeight: 600 }}>{t('nav.pricing', 'Pricing')}</span>,
      onClick: () => navigate(ROUTES.CUSTOMER_PRICING),
    },
    {
      key: 'horses',
      icon: <FolderOpenOutlined />,
      label: <span style={{ fontWeight: 600 }}>{t('landing.nav.myHorses')}</span>,
      onClick: () => navigate(ROUTES.CUSTOMER_HORSES),
    },
    {
      type: 'divider',
    },
    {
      key: 'logout',
      icon: <LogoutOutlined />,
      danger: true,
      label: <span style={{ fontWeight: 600 }}>{t('landing.nav.logout')}</span>,
      onClick: handleLogout,
    },
  ];

  return (
    <header
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        width: '100%',
        zIndex: 100,
        backgroundColor: isScrolled ? 'rgba(15, 23, 42, 0.94)' : 'transparent',
        backdropFilter: isScrolled ? 'blur(16px)' : 'none',
        borderBottom: 'none',
        boxShadow: 'none',
        transition: 'all 0.35s cubic-bezier(0.16, 1, 0.3, 1)',
        padding: isScrolled ? '12px 0' : '20px 0',
      }}
    >
      <div style={{ maxWidth: 1240, margin: '0 auto', padding: '0 24px' }}>
        <Flex justify="space-between" align="center">
          {/* Cụm góc trái: Logo LogoWhite.png */}
          <div
            onClick={handleHomeClick}
            style={{
              display: 'flex',
              alignItems: 'center',
              cursor: 'pointer',
              transition: 'opacity 0.2s',
            }}
            onMouseEnter={(e) => (e.currentTarget.style.opacity = '0.9')}
            onMouseLeave={(e) => (e.currentTarget.style.opacity = '1')}
          >
            <img
              src={logoWhite}
              alt="International Equine Transport"
              style={{
                height: 38,
                width: 'auto',
                objectFit: 'contain',
                filter: 'drop-shadow(0 2px 8px rgba(0,0,0,0.4))',
              }}
            />
          </div>

          {/* Menu chính gồm: Home, Transport, Pricing, Account, More */}
          <nav style={{ display: 'flex', alignItems: 'center', gap: 30 }}>
            {/* 1. Home */}
            <button
              onClick={handleHomeClick}
              style={{
                background: 'none',
                border: 'none',
                color: activeKey === 'home' ? '#FBA919' : '#ffffff',
                fontSize: 15,
                fontWeight: activeKey === 'home' ? 700 : 600,
                cursor: 'pointer',
                padding: '6px 0',
                transition: 'color 0.2s',
                textShadow: '0 1px 4px rgba(0,0,0,0.6)',
              }}
              onMouseEnter={(e) => (e.currentTarget.style.color = '#FBA919')}
              onMouseLeave={(e) => (e.currentTarget.style.color = activeKey === 'home' ? '#FBA919' : '#ffffff')}
            >
              {t('landing.nav.home')}
            </button>

            {/* 2. Transport */}
            <button
              onClick={handleTransportClick}
              style={{
                background: 'none',
                border: 'none',
                color: activeKey === 'transport' ? '#FBA919' : '#ffffff',
                fontSize: 15,
                fontWeight: activeKey === 'transport' ? 700 : 500,
                cursor: 'pointer',
                padding: '6px 0',
                transition: 'color 0.2s',
                textShadow: '0 1px 4px rgba(0,0,0,0.6)',
              }}
              onMouseEnter={(e) => (e.currentTarget.style.color = '#FBA919')}
              onMouseLeave={(e) => (e.currentTarget.style.color = activeKey === 'transport' ? '#FBA919' : '#ffffff')}
            >
              {t('landing.nav.transport')}
            </button>

            {/* 3. Pricing - Bảng chi phí dự tính cho khách hàng tham khảo */}
            <button
              onClick={handlePricingClick}
              style={{
                background: 'none',
                border: 'none',
                color: activeKey === 'pricing' ? '#FBA919' : '#ffffff',
                fontSize: 15,
                fontWeight: activeKey === 'pricing' ? 700 : 500,
                cursor: 'pointer',
                padding: '6px 0',
                transition: 'color 0.2s',
                textShadow: '0 1px 4px rgba(0,0,0,0.6)',
              }}
              onMouseEnter={(e) => (e.currentTarget.style.color = '#FBA919')}
              onMouseLeave={(e) => (e.currentTarget.style.color = activeKey === 'pricing' ? '#FBA919' : '#ffffff')}
            >
              {t('landing.nav.pricing')}
            </button>

            {/* 4. Account */}
            <button
              onClick={handleAccountClick}
              style={{
                background: 'none',
                border: 'none',
                color: activeKey === 'account' ? '#FBA919' : '#ffffff',
                fontSize: 15,
                fontWeight: activeKey === 'account' ? 700 : 500,
                cursor: 'pointer',
                padding: '6px 0',
                transition: 'color 0.2s',
                textShadow: '0 1px 4px rgba(0,0,0,0.6)',
              }}
              onMouseEnter={(e) => (e.currentTarget.style.color = '#FBA919')}
              onMouseLeave={(e) => (e.currentTarget.style.color = activeKey === 'account' ? '#FBA919' : '#ffffff')}
            >
              {t('landing.nav.account')}
            </button>

            {/* 5. More (Dropdown: How it works & Become a hauler) */}
            <Dropdown menu={{ items: moreMenuItems }} placement="bottom">
              <button
                style={{
                  background: 'none',
                  border: 'none',
                  color: activeKey === 'more' ? '#FBA919' : '#ffffff',
                  fontSize: 15,
                  fontWeight: activeKey === 'more' ? 700 : 500,
                  cursor: 'pointer',
                  padding: '6px 0',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 6,
                  transition: 'color 0.2s',
                  textShadow: '0 1px 4px rgba(0,0,0,0.6)',
                }}
                onMouseEnter={(e) => (e.currentTarget.style.color = '#FBA919')}
                onMouseLeave={(e) => (e.currentTarget.style.color = activeKey === 'more' ? '#FBA919' : '#ffffff')}
              >
                <span>{t('landing.nav.more')}</span>
                <DownOutlined style={{ fontSize: 11 }} />
              </button>
            </Dropdown>
          </nav>

          {/* Cụm góc phải: Đổi ngôn ngữ & Login/Sign up hoặc User Profile Widget */}
          <Space size="middle" align="center">
            {/* Nút chuyển đổi ngôn ngữ VI / EN */}
            <Button
              type="text"
              icon={<GlobalOutlined style={{ color: '#FBA919' }} />}
              onClick={() => i18n.changeLanguage(i18n.language === 'vi' ? 'en' : 'vi')}
              style={{
                color: '#ffffff',
                fontWeight: 600,
                borderRadius: 9999,
                border: '1px solid rgba(255, 255, 255, 0.25)',
                background: 'rgba(15, 23, 42, 0.35)',
                backdropFilter: 'blur(8px)',
                padding: '0 14px',
                height: 38,
              }}
            >
              {i18n.language === 'vi' ? 'EN' : 'VI'}
            </Button>

            {!isAuthenticated ? (
              <>
                {/* Khi CHƯA đăng nhập: Hiện nút Đăng nhập và Đăng ký */}
                <Button
                  ghost
                  onClick={() => navigate(ROUTES.LOGIN)}
                  style={{
                    borderRadius: 9999,
                    fontWeight: 600,
                    color: '#ffffff',
                    borderColor: 'rgba(255, 255, 255, 0.45)',
                    background: 'rgba(15, 23, 42, 0.3)',
                    backdropFilter: 'blur(8px)',
                    padding: '0 20px',
                    height: 40,
                  }}
                >
                  {t('landing.nav.login')}
                </Button>

                <Button
                  type="primary"
                  onClick={() => navigate(ROUTES.REGISTER)}
                  className="landing-btn-shine"
                  style={{
                    backgroundColor: '#FBA919',
                    borderColor: '#FBA919',
                    color: '#0f172a',
                    fontWeight: 700,
                    borderRadius: 9999,
                    padding: '0 22px',
                    height: 40,
                    boxShadow: '0 4px 14px rgba(251, 169, 25, 0.35)',
                  }}
                >
                  {t('landing.nav.signUp')}
                </Button>
              </>
            ) : (
              <>
                {/* Khi ĐÃ đăng nhập: Nút truy cập nhanh Dashboard + Menu Profile góc phải */}
                <Dropdown menu={{ items: userProfileMenuItems }} placement="bottomRight">
                  <Flex
                    align="center"
                    gap={10}
                    style={{
                      cursor: 'pointer',
                      padding: '4px 10px',
                      borderRadius: 9999,
                      background: 'rgba(255, 255, 255, 0.12)',
                      border: '1px solid rgba(255, 255, 255, 0.2)',
                    }}
                  >
                    <Avatar
                      size={34}
                      style={{
                        backgroundColor: '#FBA919',
                        color: '#0f172a',
                        fontWeight: 800,
                      }}
                    >
                      {getInitials(user?.FullName)}
                    </Avatar>
                    <span style={{ color: '#ffffff', fontWeight: 600, fontSize: 14 }}>
                      {user?.FullName || 'Kaze Lee'}
                    </span>
                    <DownOutlined style={{ color: '#94a3b8', fontSize: 11 }} />
                  </Flex>
                </Dropdown>

                <Button
                  type="primary"
                  onClick={() => navigate(ROUTES.CUSTOMER_DASHBOARD)}
                  style={{
                    backgroundColor: '#FBA919',
                    borderColor: '#FBA919',
                    color: '#0f172a',
                    fontWeight: 700,
                    borderRadius: 9999,
                    padding: '0 18px',
                    height: 38,
                  }}
                >
                  {t('landing.nav.dashboard')}
                </Button>
              </>
            )}
          </Space>
        </Flex>
      </div>
    </header>
  );
}
