import { useState } from 'react';
import { Button, Checkbox, Form, Input, message } from 'antd';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAuthStore } from '@features/auth/store/authStore';
import { loginApi } from '@features/auth/services/authService';
import { useGoogleAuth } from '@features/auth/hooks/useGoogleAuth';
import GoogleIcon from '@features/auth/components/GoogleIcon';
import { ROUTES } from '@routes/routes';
import { ROLES } from '@utils/constants';
import logoImg from '@/assets/logo.svg';
import styles from './AuthPages.module.css';


/**
 * Trang Đăng nhập (Sign In) khớp thiết kế Figma node 94:1089.
 */
export default function LoginPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { login } = useAuthStore();
  const { loginWithGoogle, isGoogleLoading } = useGoogleAuth();
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);

  const handleLogin = async (values) => {
    try {
      setLoading(true);
      let user = null;
      let token = null;
      let refreshToken = null;

      const res = await loginApi({
        email: values.email,
        password: values.password,
      });
      user = res.user || res.data?.user;
      token = res.accessToken || res.token || res.data?.accessToken;
      refreshToken = res.refreshToken || res.data?.refreshToken || null;

      if (!user) {
        throw new Error('User not found');
      }

      login(user, token, refreshToken);
      message.success(t('auth.loginSuccess', 'Đăng nhập thành công!'));

      // Chuyển hướng theo role của người dùng (tách biệt rõ ràng quyền hạn)
      const dashboardMap = {
        [ROLES.CUSTOMER]: ROUTES.CUSTOMER_DASHBOARD,
        'Customer': ROUTES.CUSTOMER_DASHBOARD,
        [ROLES.MANAGER]: ROUTES.MANAGER_DASHBOARD,
        'LogisticsManager': ROUTES.MANAGER_DASHBOARD,
        [ROLES.ADMIN]: ROUTES.MANAGER_DASHBOARD,
        'Admin': ROUTES.MANAGER_DASHBOARD,
        [ROLES.SPECIALIST]: ROUTES.SPECIALIST_DASHBOARD,
        'Specialist': ROUTES.SPECIALIST_DASHBOARD,
        'TransportSpecialist': ROUTES.SPECIALIST_DASHBOARD,
        [ROLES.COORDINATOR]: ROUTES.COORDINATOR_DASHBOARD,
        'FleetCoordinator': ROUTES.COORDINATOR_DASHBOARD,
        'Coordinator': ROUTES.COORDINATOR_DASHBOARD,
        [ROLES.DRIVER]: ROUTES.DRIVER_DASHBOARD,
        'Driver': ROUTES.DRIVER_DASHBOARD,
        [ROLES.ESCORT]: ROUTES.DRIVER_DASHBOARD,
        'Escort': ROUTES.DRIVER_DASHBOARD,
        // Vai trò thật của backend cho tài xế / áp tải
        'DriverEscort': ROUTES.DRIVER_DASHBOARD,
      };

      const userRole = user?.role || user?.Role;
      const targetRoute = dashboardMap[userRole] || ROUTES.CUSTOMER_DASHBOARD;
      navigate(targetRoute, { replace: true });
    } catch {
      message.error(t('auth.loginFailed', 'Đăng nhập thất bại. Vui lòng kiểm tra lại thông tin.'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      {/* Header & Logo */}
      <div className={styles.headerSection}>
        <div className={styles.logoContainer}>
          <img src={logoImg} alt="International Equine Transport" className={styles.logoImage} />
        </div>
        <h1 className={styles.pageTitle}>{t('auth.signInTitle')}</h1>
        <p className={styles.pageSubtitle}>{t('auth.signInSubtitle')}</p>
      </div>

      {/* Sign in with Google button */}
      <button
        type="button"
        className={styles.googleBtn}
        onClick={loginWithGoogle}
        disabled={isGoogleLoading}
        aria-label="Sign in with Google"
      >
        <GoogleIcon size={18} />
        <span>{t('auth.signInWithGoogle')}</span>
      </button>

      {/* Divider "or" */}
      <div className={styles.divider}>
        <span className={styles.dividerText}>{t('auth.or')}</span>
      </div>

      {/* Form đăng nhập */}
      <Form
        form={form}
        layout="vertical"
        onFinish={handleLogin}
        initialValues={{
          keepLoggedIn: true,
        }}
        requiredMark={false}
      >
        <Form.Item
          name="email"
          label={t('auth.email')}
          className={styles.formItem}
          rules={[
            { required: true, message: t('auth.enterEmail') },
            { type: 'email', message: t('auth.enterEmail') },
          ]}
        >
          <Input
            placeholder="jonas_kahnwald@gmail.com"
            className={styles.inputField}
            autoComplete="email"
          />
        </Form.Item>

        <Form.Item
          name="password"
          label={t('auth.password')}
          className={styles.formItem}
          rules={[{ required: true, message: t('auth.enterPassword') }]}
        >
          <Input.Password
            placeholder="••••••••••••"
            className={styles.inputField}
            autoComplete="current-password"
          />
        </Form.Item>

        <Form.Item name="keepLoggedIn" valuePropName="checked" style={{ marginBottom: 16 }}>
          <Checkbox>{t('auth.keepMeLoggedIn')}</Checkbox>
        </Form.Item>

        <Button
          type="primary"
          htmlType="submit"
          className={styles.submitBtn}
          loading={loading}
          block
        >
          {t('auth.signInButton')}
        </Button>

        <span
          className={styles.forgotLink}
          onClick={() => navigate(ROUTES.FORGOT_PASSWORD)}
          role="button"
          tabIndex={0}
        >
          {t('auth.forgotPassword')}
        </span>
      </Form>

      {/* Footer link to register */}
      <div className={styles.footerSection}>
        <span>{t('auth.needAccount')}</span>
        <span
          className={styles.footerLink}
          onClick={() => navigate(ROUTES.REGISTER)}
          role="button"
          tabIndex={0}
        >
          {t('auth.createOne')}
        </span>
      </div>

    </div>
  );
}
