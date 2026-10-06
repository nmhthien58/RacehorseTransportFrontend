import { useState } from 'react';
import { Button, Form, Input, message } from 'antd';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { resetPasswordApi } from '@features/auth/services/authService';
import { ROUTES } from '@routes/routes';
import logoImg from '@/assets/logo.svg';
import styles from './AuthPages.module.css';

/**
 * Trang Đặt Lại Mật Khẩu Mới (Reset Password)
 */
export default function ResetPasswordPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const email = sessionStorage.getItem('reset_email') || 'customer@test.com';

  const handleResetPassword = async (values) => {
    if (values.newPassword !== values.confirmPassword) {
      message.error(t('auth.passwordMismatch'));
      return;
    }

    try {
      setLoading(true);
      await resetPasswordApi({
        email,
        newPassword: values.newPassword,
      });

      message.success(t('auth.resetSuccess', 'Đặt lại mật khẩu thành công! Vui lòng đăng nhập.'));
      sessionStorage.removeItem('reset_email');
      sessionStorage.removeItem('verify_code');
      navigate(ROUTES.LOGIN);
    } catch {
      message.error(t('auth.actionFailed', 'Không thể đặt lại mật khẩu. Vui lòng thử lại.'));
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
        <h1 className={styles.pageTitle}>{t('auth.resetPasswordTitle')}</h1>
        <p className={styles.pageSubtitle}>{t('auth.resetPasswordSubtitle')}</p>
      </div>

      {/* Form */}
      <Form
        form={form}
        layout="vertical"
        onFinish={handleResetPassword}
        requiredMark={false}
      >
        <Form.Item
          name="newPassword"
          label={t('auth.newPassword')}
          className={styles.formItem}
          rules={[{ required: true, message: t('auth.enterPassword') }]}
        >
          <Input.Password
            placeholder="••••••••••••"
            className={styles.inputField}
            autoComplete="new-password"
          />
        </Form.Item>

        <Form.Item
          name="confirmPassword"
          label={t('auth.confirmPassword')}
          className={styles.formItem}
          rules={[
            { required: true, message: t('auth.confirmPassword') },
            ({ getFieldValue }) => ({
              validator(_, value) {
                if (!value || getFieldValue('newPassword') === value) {
                  return Promise.resolve();
                }
                return Promise.reject(new Error(t('auth.passwordMismatch')));
              },
            }),
          ]}
        >
          <Input.Password
            placeholder="••••••••••••"
            className={styles.inputField}
            autoComplete="new-password"
          />
        </Form.Item>

        <Button
          type="primary"
          htmlType="submit"
          className={styles.submitBtn}
          loading={loading}
          block
        >
          {t('auth.resetPasswordTitle')}
        </Button>
      </Form>

      {/* Footer link to login */}
      <div className={styles.footerSection}>
        <span
          className={styles.footerLink}
          onClick={() => navigate(ROUTES.LOGIN)}
          role="button"
          tabIndex={0}
        >
          ← {t('auth.backToSignIn')}
        </span>
      </div>
    </div>
  );
}
