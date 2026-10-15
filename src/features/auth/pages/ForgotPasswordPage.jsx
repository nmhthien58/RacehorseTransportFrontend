import { useEffect, useState } from 'react';
import { Button, Form, Input, message } from 'antd';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { forgotPasswordApi } from '@features/auth/services/authService';
import { ROUTES } from '@routes/routes';
import logoImg from '@/assets/logo.svg';
import styles from './AuthPages.module.css';

// Thời gian chờ trước khi cho phép gửi lại link (giây)
const RESEND_COOLDOWN = 60;

/**
 * Trang Quên Mật Khẩu (Forgot Password).
 * Backend gửi email chứa link `/reset-password?token=...`, nên trang này chỉ cần
 * gửi yêu cầu rồi báo người dùng kiểm tra hộp thư (không có bước nhập mã OTP).
 */
export default function ForgotPasswordPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [sentEmail, setSentEmail] = useState('');
  const [countdown, setCountdown] = useState(0);

  useEffect(() => {
    if (countdown <= 0) return undefined;
    const timer = setTimeout(() => setCountdown((prev) => prev - 1), 1000);
    return () => clearTimeout(timer);
  }, [countdown]);

  const handleSubmit = async (values) => {
    try {
      setLoading(true);
      await forgotPasswordApi({ email: values.email });
      // Backend luôn trả 200 dù email có tồn tại hay không (tránh dò tài khoản)
      message.success(t('auth.resetLinkSent'));
      setSentEmail(values.email);
      setCountdown(RESEND_COOLDOWN);
    } catch (err) {
      message.error(err?.userMessage || t('auth.sendResetFailed'));
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
        <h1 className={styles.pageTitle}>{t('auth.forgotPasswordTitle')}</h1>
        <p className={styles.pageSubtitle}>
          {sentEmail
            ? t('auth.resetLinkSentSubtitle', { email: sentEmail })
            : t('auth.forgotPasswordSubtitle')}
        </p>
      </div>

      {/* Form */}
      <Form form={form} layout="vertical" onFinish={handleSubmit} requiredMark={false}>
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

        <Button
          type="primary"
          htmlType="submit"
          className={styles.submitBtn}
          loading={loading}
          disabled={countdown > 0}
          block
        >
          {/* Đã gửi thì nút chuyển thành "Gửi lại link", khóa trong lúc đếm ngược */}
          {!sentEmail && t('auth.sendResetLink')}
          {sentEmail && countdown > 0 && t('auth.resendIn', { seconds: countdown })}
          {sentEmail && countdown <= 0 && t('auth.resendResetLink')}
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
