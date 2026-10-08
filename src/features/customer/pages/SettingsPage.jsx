import {
  Button,
  Card,
  Divider,
  Flex,
  Form,
  Input,
  Space,
  Spin,
  Switch,
  Tabs,
  Typography,
  message,
} from 'antd';
import {
  BellOutlined,
  SafetyCertificateOutlined,
  MailOutlined,
  MobileOutlined,
  LockOutlined,
  CheckOutlined,
} from '@ant-design/icons';
import { useTranslation } from 'react-i18next';
import PageHeader from '@components/layout/PageHeader';
import useSettings from '@features/customer/hooks/useSettings';

const { Title, Text } = Typography;

/**
 * Trang cài đặt hệ thống dành cho khách hàng (Settings Page)
 * Đường dẫn: /customer/settings
 * Giao diện AntD Tabs [Thông báo, Bảo mật], mỗi tab có Switch/Input
 *
 * @returns {JSX.Element}
 */
export default function SettingsPage() {
  const { t } = useTranslation();
  const { data: settings, loading, updateSettings } = useSettings();

  const emailUpdates = settings?.notifications?.emailTripUpdates ?? true;
  const smsAlerts = settings?.notifications?.smsEmergencyAlerts ?? true;
  const quoteNotification = settings?.notifications?.quoteApprovalNotification ?? true;
  const marketingNews = settings?.notifications?.marketingNewsletter ?? false;
  const twoFactor = settings?.security?.twoFactorAuth ?? false;
  const loginAlerts = settings?.security?.loginAlerts ?? true;

  const handleToggleNotification = (key, val) => {
    updateSettings({
      notifications: {
        ...settings?.notifications,
        [key]: val,
      },
    });
  };

  const handleToggleSecurity = (key, val) => {
    updateSettings({
      security: {
        ...settings?.security,
        [key]: val,
      },
    });
  };

  const handleSaveNotifications = () => {
    message.success(t('settings.saveNotificationsSuccess'));
  };

  const handleSaveSecurity = () => {
    message.success(t('settings.saveSecuritySuccess'));
  };

  if (loading) {
    return (
      <div style={{ textAlign: 'center', padding: '100px 0' }}>
        <Spin size="large" />
        <Text type="secondary" style={{ display: 'block', marginTop: 16 }}>
          {t('common.loading')}
        </Text>
      </div>
    );
  }

  // Danh sách các Tabs
  const tabItems = [
    {
      key: 'notifications',
      label: (
        <span>
          <BellOutlined /> {t('settings.tabs.notifications')}
        </span>
      ),
      children: (
        <Card
          bordered
          style={{
            borderRadius: 14,
            borderColor: '#e2e8f0',
            marginTop: 12,
            boxShadow: '0 1px 3px rgba(0, 0, 0, 0.02)',
          }}
          styles={{ body: { padding: '24px 28px' } }}
        >
          <Title level={5} style={{ margin: '0 0 4px', color: '#0f172a' }}>
            {t('settings.notificationsTitle')}
          </Title>
          <Text type="secondary" style={{ display: 'block', marginBottom: 24 }}>
            {t('settings.notificationsDesc')}
          </Text>

          {/* Item 1: Email updates */}
          <Flex justify="space-between" align="center" style={{ marginBottom: 20 }}>
            <div>
              <Space size="small">
                <MailOutlined style={{ color: '#d97706', fontSize: 16 }} />
                <strong style={{ fontSize: 15, color: '#0f172a' }}>
                  {t('settings.notifications.emailTrips') || 'Thông báo tiến độ chuyến đi qua Email'}
                </strong>
              </Space>
              <Text type="secondary" style={{ display: 'block', fontSize: 13, marginTop: 4 }}>
                {t('settings.notifications.emailTripsDesc') ||
                  'Nhận email thông báo tự động khi xe xuất phát, qua trạm kiểm soát hoặc đến đích an toàn.'}
              </Text>
            </div>
            <Switch
              checked={emailUpdates}
              onChange={(checked) => handleToggleNotification('emailTripUpdates', checked)}
              style={{ backgroundColor: emailUpdates ? '#f59e0b' : undefined }}
            />
          </Flex>

          <Divider style={{ margin: '16px 0' }} />

          {/* Item 2: SMS alerts */}
          <Flex justify="space-between" align="center" style={{ marginBottom: 20 }}>
            <div>
              <Space size="small">
                <MobileOutlined style={{ color: '#dc2626', fontSize: 16 }} />
                <strong style={{ fontSize: 15, color: '#0f172a' }}>
                  {t('settings.notifications.smsAlerts') || 'Cảnh báo khẩn cấp & phúc lợi ngựa qua SMS'}
                </strong>
              </Space>
              <Text type="secondary" style={{ display: 'block', fontSize: 13, marginTop: 4 }}>
                {t('settings.notifications.smsAlertsDesc') ||
                  'Nhận tin nhắn SMS khẩn cấp khi có sự cố giao thông hoặc cảnh báo chỉ số sinh trắc học lạ.'}
              </Text>
            </div>
            <Switch
              checked={smsAlerts}
              onChange={(checked) => handleToggleNotification('smsEmergencyAlerts', checked)}
              style={{ backgroundColor: smsAlerts ? '#f59e0b' : undefined }}
            />
          </Flex>

          <Divider style={{ margin: '16px 0' }} />

          {/* Item 3: Quote approval */}
          <Flex justify="space-between" align="center" style={{ marginBottom: 20 }}>
            <div>
              <Space size="small">
                <CheckOutlined style={{ color: '#16a34a', fontSize: 16 }} />
                <strong style={{ fontSize: 15, color: '#0f172a' }}>
                  {t('settings.notifications.quoteApproval') || 'Thông báo phê duyệt báo giá vận chuyển'}
                </strong>
              </Space>
              <Text type="secondary" style={{ display: 'block', fontSize: 13, marginTop: 4 }}>
                {t('settings.notifications.quoteApprovalDesc') ||
                  'Nhận thông báo ngay khi Ban Logistics hoàn tất kiểm tra lộ trình và duyệt báo giá cước.'}
              </Text>
            </div>
            <Switch
              checked={quoteNotification}
              onChange={(checked) => handleToggleNotification('quoteApprovalNotification', checked)}
              style={{ backgroundColor: quoteNotification ? '#f59e0b' : undefined }}
            />
          </Flex>

          <Divider style={{ margin: '16px 0' }} />

          {/* Item 4: Marketing newsletter */}
          <Flex justify="space-between" align="center" style={{ marginBottom: 24 }}>
            <div>
              <strong style={{ fontSize: 15, color: '#0f172a' }}>
                {t('settings.notifications.marketing') || 'Bản tin cập nhật dịch vụ & ưu đãi định kỳ'}
              </strong>
              <Text type="secondary" style={{ display: 'block', fontSize: 13, marginTop: 4 }}>
                {t('settings.notifications.marketingDesc') ||
                  'Nhận thông tin về các tuyến bay chở ngựa mới, cải tiến chuồng xe và chính sách ưu đãi thành viên.'}
              </Text>
            </div>
            <Switch
              checked={marketingNews}
              onChange={(checked) => handleToggleNotification('marketingNewsletter', checked)}
              style={{ backgroundColor: marketingNews ? '#f59e0b' : undefined }}
            />
          </Flex>

          <Button
            type="primary"
            size="large"
            onClick={handleSaveNotifications}
            style={{
              borderRadius: 8,
              fontWeight: 600,
              backgroundColor: '#f59e0b',
              borderColor: '#f59e0b',
            }}
          >
            {t('settings.saveNotifications')}
          </Button>
        </Card>
      ),
    },
    {
      key: 'security',
      label: (
        <span>
          <SafetyCertificateOutlined /> {t('settings.tabs.security')}
        </span>
      ),
      children: (
        <Card
          bordered
          style={{
            borderRadius: 14,
            borderColor: '#e2e8f0',
            marginTop: 12,
            boxShadow: '0 1px 3px rgba(0, 0, 0, 0.02)',
          }}
          styles={{ body: { padding: '24px 28px' } }}
        >
          <Title level={5} style={{ margin: '0 0 4px', color: '#0f172a' }}>
            {t('settings.passwordTitle')}
          </Title>
          <Text type="secondary" style={{ display: 'block', marginBottom: 20 }}>
            {t('settings.passwordDesc')}
          </Text>

          <Form layout="vertical" style={{ maxWidth: 440 }}>
            <Form.Item label={t('settings.security.currentPassword')}>
              <Input.Password
                prefix={<LockOutlined style={{ color: '#94a3b8' }} />}
                placeholder={t('settings.currentPasswordPlaceholder')}
                size="large"
              />
            </Form.Item>

            <Form.Item label={t('settings.security.newPassword')}>
              <Input.Password
                prefix={<LockOutlined style={{ color: '#94a3b8' }} />}
                placeholder={t('settings.newPasswordPlaceholder')}
                size="large"
              />
            </Form.Item>

            <Form.Item label={t('settings.security.confirmPassword')}>
              <Input.Password
                prefix={<LockOutlined style={{ color: '#94a3b8' }} />}
                placeholder={t('settings.confirmPasswordPlaceholder')}
                size="large"
              />
            </Form.Item>
          </Form>

          <Divider style={{ margin: '20px 0' }} />

          {/* Switch 2FA */}
          <Flex justify="space-between" align="center" style={{ marginBottom: 20 }}>
            <div>
              <strong style={{ fontSize: 15, color: '#0f172a' }}>
                {t('settings.security.twoFactor')}
              </strong>
              <Text type="secondary" style={{ display: 'block', fontSize: 13, marginTop: 4 }}>
                {t('settings.security.twoFactorDesc')}
              </Text>
            </div>
            <Switch
              checked={twoFactor}
              onChange={(checked) => handleToggleSecurity('twoFactorAuth', checked)}
              style={{ backgroundColor: twoFactor ? '#f59e0b' : undefined }}
            />
          </Flex>

          <Divider style={{ margin: '16px 0' }} />

          {/* Switch Login alerts */}
          <Flex justify="space-between" align="center" style={{ marginBottom: 24 }}>
            <div>
              <strong style={{ fontSize: 15, color: '#0f172a' }}>
                {t('settings.loginAlerts')}
              </strong>
              <Text type="secondary" style={{ display: 'block', fontSize: 13, marginTop: 4 }}>
                {t('settings.loginAlertsDesc')}
              </Text>
            </div>
            <Switch
              checked={loginAlerts}
              onChange={(checked) => handleToggleSecurity('loginAlerts', checked)}
              style={{ backgroundColor: loginAlerts ? '#f59e0b' : undefined }}
            />
          </Flex>

          <Button
            type="primary"
            size="large"
            onClick={handleSaveSecurity}
            style={{
              borderRadius: 8,
              fontWeight: 600,
              backgroundColor: '#f59e0b',
              borderColor: '#f59e0b',
            }}
          >
            {t('settings.security.saveSettings')}
          </Button>
        </Card>
      ),
    },
  ];

  return (
    <div style={{ maxWidth: 960, margin: '0 auto', paddingBottom: 40 }}>
      {/* Header trang */}
      <PageHeader
        title={t('settings.title') || 'Cài đặt hệ thống'}
        subtitle={
          t('settings.subtitle') ||
          'Quản lý tùy chọn thông báo tự động và cấu hình an toàn bảo mật tài khoản'
        }
      />

      {/* KHỐI AntD Tabs [Thông báo, Bảo mật] */}
      <Tabs defaultActiveKey="notifications" items={tabItems} size="large" />
    </div>
  );
}
