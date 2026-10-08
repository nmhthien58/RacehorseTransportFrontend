import {
  Button,
  Card,
  Descriptions,
  Flex,
  Spin,
  Space,
  Tag,
  Tooltip,
  Typography,
} from 'antd';
import {
  UserOutlined,
  EditOutlined,
  MailOutlined,
  PhoneOutlined,
  CheckCircleOutlined,
  CalendarOutlined,
} from '@ant-design/icons';
import { useTranslation } from 'react-i18next';
import dayjs from 'dayjs';
import PageHeader from '@components/layout/PageHeader';
import useProfile from '@features/customer/hooks/useProfile';

const { Title, Text } = Typography;

/**
 * Trang thông tin hồ sơ tài khoản khách hàng (Customer Profile)
 * Đường dẫn: /customer/profile
 * Sử dụng AntD Descriptions [Họ tên, Email, SĐT, CLB, Role] + nút "Chỉnh sửa" (disabled)
 *
 * @returns {JSX.Element}
 */
export default function ProfilePage() {
  const { t } = useTranslation();
  const { data: profile, loading } = useProfile();

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

  return (
    <div style={{ maxWidth: 960, margin: '0 auto', paddingBottom: 40 }}>
      {/* Header trang */}
      <PageHeader
        title={t('profile.title') || 'Hồ sơ tài khoản'}
        subtitle={
          t('profile.subtitle') ||
          'Thông tin chủ sở hữu, thông tin liên lạc và tư cách thành viên câu lạc bộ đua ngựa'
        }
        actions={
          <Tooltip title={t('profile.editDisabledHint') || 'Tính năng chỉnh sửa hồ sơ đang được cập nhật'}>
            <Button
              type="primary"
              icon={<EditOutlined />}
              disabled
              style={{
                borderRadius: 8,
                fontWeight: 600,
              }}
            >
              {t('profile.edit') || 'Chỉnh sửa'}
            </Button>
          </Tooltip>
        }
      />

      {/* THẺ TỔNG QUAN TÀI KHOẢN */}
      <Card
        bordered
        style={{
          borderRadius: 14,
          borderColor: '#e2e8f0',
          boxShadow: '0 1px 4px rgba(0, 0, 0, 0.03)',
        }}
        styles={{ body: { padding: '28px 32px' } }}
      >
        <Flex align="center" gap="large" wrap="wrap" style={{ marginBottom: 28 }}>
          <div
            style={{
              width: 72,
              height: 72,
              borderRadius: '50%',
              backgroundColor: '#fef3c7',
              color: '#d97706',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: 32,
            }}
          >
            <UserOutlined />
          </div>

          <div>
            <Title level={3} style={{ margin: 0, fontWeight: 700, color: '#0f172a' }}>
              {profile?.FullName}
            </Title>
            <Flex gap="small" align="center" style={{ marginTop: 6 }} wrap="wrap">
              <Tag color="orange" style={{ fontWeight: 600 }}>
                {profile?.Role}
              </Tag>
              <Tag color="purple">{profile?.MembershipTier}</Tag>
              <Tag color="success" icon={<CheckCircleOutlined />}>
                {t('profile.verified')}
              </Tag>
            </Flex>
          </div>
        </Flex>

        {/* BẢNG THÔNG TIN AntD Descriptions THEO ĐÚNG YÊU CẦU */}
        <Descriptions
          bordered
          column={{ xs: 1, sm: 2 }}
          size="middle"
          styles={{ label: { fontWeight: 600, width: '28%', color: '#475569' } }}
        >
          <Descriptions.Item label={t('profile.fullName')}>
            <strong style={{ color: '#0f172a' }}>{profile?.FullName}</strong>
          </Descriptions.Item>

          <Descriptions.Item label={t('profile.role')}>
            <Tag color="blue">{profile?.Role}</Tag>
          </Descriptions.Item>

          <Descriptions.Item label={t('profile.email')}>
            <Space size="small">
              <MailOutlined style={{ color: '#64748b' }} />
              <span>{profile?.Email}</span>
            </Space>
          </Descriptions.Item>

          <Descriptions.Item label={t('profile.phone')}>
            <Space size="small">
              <PhoneOutlined style={{ color: '#64748b' }} />
              <span>{profile?.PhoneNumber}</span>
            </Space>
          </Descriptions.Item>

          <Descriptions.Item label={t('profile.club')}>
            <strong>{profile?.ClubName}</strong>
          </Descriptions.Item>

          <Descriptions.Item label={t('profile.feiOwnerId')}>
            <code
              style={{
                backgroundColor: '#f1f5f9',
                padding: '2px 8px',
                borderRadius: 6,
                fontSize: 12,
                fontFamily: 'monospace',
              }}
            >
              {profile?.FEIOwnerID || 'VN-OWN-2024-0089'}
            </code>
          </Descriptions.Item>

          <Descriptions.Item label={t('profile.address')} span={2}>
            {profile?.Address}
          </Descriptions.Item>

          <Descriptions.Item label={t('profile.createdAt')}>
            <Space size="small">
              <CalendarOutlined style={{ color: '#64748b' }} />
              <span>{dayjs(profile?.CreatedAt).format('DD/MM/YYYY')}</span>
            </Space>
          </Descriptions.Item>

          <Descriptions.Item label={t('profile.status')}>
            <Tag color="success">{t('profile.activeStatus')}</Tag>
          </Descriptions.Item>
        </Descriptions>
      </Card>
    </div>
  );
}
