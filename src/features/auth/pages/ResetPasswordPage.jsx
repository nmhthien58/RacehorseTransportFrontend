import { useState } from 'react';
import { Button, Form, Input, message } from 'antd';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { resetPasswordApi } from '@features/auth/services/authService';
import { ROUTES } from '@routes/routes';
import logoImg from '@/assets/logo.svg';
import styles from './AuthPages.module.css';

/**
 * Trang Đặt Lại Mật Khẩu Mới (Reset Password).
 * Người dùng mở trang này từ link trong email: `/reset-password?token=...`.
 */
export default function ResetPasswordPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  // Token dùng một lần, hạn 60 phút, do backend sinh và gắn vào link email
  const token = searchParams.get('token') || '';

  const handleResetPassword = async (values) => {
    if (values.newPassword !== values.confirmPassword) {
      message.error(t('auth.passwordMismatch'));
      return;
    }

    try {
      setLoading(true);
      await resetPasswordApi({
        token,
        newPassword: values.newPassword,
      });

      // Backend đăng xuất mọi phiên cũ, nên đưa người dùng về trang đăng nhập
      message.success(t('auth.resetSuccess'));
      navigate(ROUTES.LOGIN, { replace: true });
    } catch (err) {
      message.error(err?.userMessage || t('auth.resetFailed'));
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
        <p className={styles.pageSubtitle}>
          {token ? t('auth.resetPasswordSubtitle') : t('auth.resetLinkInvalid')}
        </p>
      </div>

      {/* Không có token trên URL thì không thể đặt lại: cho người dùng yêu cầu link mới */}
      {!token && (
        <Button
          type="primary"
          className={styles.submitBtn}
          onClick={() => navigate(ROUTES.FORGOT_PASSWORD)}
          block
        >
          {t('auth.requestNewLink')}
        </Button>
      )}

      {/* Form */}
      {token && (
        <Form form={form} layout="vertical" onFinish={handleResetPassword} requiredMark={false}>
          <Form.Item
            name="newPassword"
            label={t('auth.newPassword')}
            className={styles.formItem}
            rules={[
              { required: true, message: t('auth.enterPassword') },
              // Khớp ràng buộc backend: mật khẩu 8-64 ký tự
              { min: 8, max: 64, message: t('auth.passwordLength') },
            ]}
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
      )}

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
