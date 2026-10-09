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

  const isCustomer = profile?.role === 'Customer';
  const isStaff = !isCustomer;

  return (
    <div style={{ maxWidth: 1040, margin: '0 auto', paddingBottom: 40 }}>
      {/* Header trang */}
      <PageHeader
        title={t('profile.title') || 'Account Profile'}
        subtitle={
          isCustomer
            ? t('profile.subtitle') || 'Owner contact details, farm registration, and club memberships'
            : t('profile.staffSubtitle') || 'Thông tin tài khoản vận hành, phân quyền quản lý và điều phối chuyên môn'
        }
        actions={
          <Tooltip title={t('profile.editDisabledHint') || 'Tính năng chỉnh sửa hồ sơ đang được cập nhật'}>
            <Button
              type="default"
              icon={<EditOutlined />}
              disabled
              style={{
                borderRadius: 9999,
                fontWeight: 600,
                height: 40,
                padding: '0 22px',
                borderColor: '#e2e8f0',
                color: '#94a3b8',
              }}
            >
              {t('profile.edit') || 'Edit Profile'}
            </Button>
          </Tooltip>
        }
      />

      {/* THẺ TỔNG QUAN TÀI KHOẢN GỌN GÀNG, CHUẨN FIGMA */}
      <Card
        bordered
        style={{
          borderRadius: 20,
          borderColor: '#e2e8f0',
          boxShadow: '0 4px 20px rgba(0, 0, 0, 0.03)',
          background: '#ffffff',
        }}
        styles={{ body: { padding: '32px 36px' } }}
      >
        <Flex align="center" gap={20} wrap="wrap" style={{ marginBottom: 28 }}>
          <div
            style={{
              width: 76,
              height: 76,
              borderRadius: '50%',
              backgroundColor: '#FEF3C7',
              color: '#D97706',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: 34,
              flexShrink: 0,
              boxShadow: '0 2px 10px rgba(245, 158, 11, 0.15)',
            }}
          >
            <UserOutlined />
          </div>

          <div>
            <Title level={3} style={{ margin: 0, fontWeight: 800, color: '#0f172a' }}>
              {profile?.fullName || profile?.FullName}
            </Title>
            <Flex gap={8} align="center" style={{ marginTop: 8 }} wrap="wrap">
              <Tag
                color="orange"
                style={{
                  fontWeight: 700,
                  borderRadius: 9999,
                  padding: '2px 12px',
                  margin: 0,
                }}
              >
                {profile?.role || profile?.Role}
              </Tag>
              <Tag
                color="purple"
                style={{
                  fontWeight: 700,
                  borderRadius: 9999,
                  padding: '2px 12px',
                  margin: 0,
                }}
              >
                {profile?.membershipTier || profile?.MembershipTier}
              </Tag>
              <Tag
                color="success"
                icon={<CheckCircleOutlined />}
                style={{
                  fontWeight: 600,
                  borderRadius: 9999,
                  padding: '2px 12px',
                  margin: 0,
                }}
              >
                {t('profile.verified')}
              </Tag>
            </Flex>
          </div>
        </Flex>

        {/* BẢNG THÔNG TIN AntD Descriptions GỌN GÀNG, KHÔNG BỊ TRÀN CHỮ */}
        <Descriptions
          bordered
          column={{ xs: 1, sm: 2 }}
          size="middle"
          styles={{
            label: {
              fontWeight: 700,
              width: '20%',
              color: '#475569',
              backgroundColor: '#f8fafc',
              fontSize: 13,
            },
            content: {
              width: '30%',
              fontSize: 13.5,
              color: '#0f172a',
            },
          }}
        >
          <Descriptions.Item label={t('profile.fullName')}>
            <strong style={{ color: '#0f172a', fontWeight: 700 }}>{profile?.fullName || profile?.FullName}</strong>
          </Descriptions.Item>

          <Descriptions.Item label={t('profile.role')}>
            <Tag color="blue" style={{ borderRadius: 6, fontWeight: 600 }}>
              {profile?.role || profile?.Role}
            </Tag>
          </Descriptions.Item>

          <Descriptions.Item label={t('profile.email')}>
            <Space size="small">
              <MailOutlined style={{ color: '#64748b' }} />
              <span style={{ wordBreak: 'break-all' }}>{profile?.email || profile?.Email}</span>
            </Space>
          </Descriptions.Item>

          <Descriptions.Item label={t('profile.phone')}>
            <Space size="small">
              <PhoneOutlined style={{ color: '#64748b' }} />
              <span style={{ whiteSpace: 'nowrap', fontWeight: 600 }}>{profile?.phoneNumber || profile?.PhoneNumber}</span>
            </Space>
          </Descriptions.Item>

          <Descriptions.Item label={isCustomer ? (t('profile.club') || 'Câu lạc bộ / Tổ chức') : (t('profile.department') || 'Bộ phận / Phòng ban')}>
            <strong style={{ color: '#0f172a' }}>{profile?.department || profile?.clubName || profile?.ClubName}</strong>
          </Descriptions.Item>

          <Descriptions.Item label={isCustomer ? (t('profile.feiOwnerId') || 'FEI Owner ID') : (t('profile.staffId') || 'Mã định danh cán bộ (Staff ID)')}>
            <code
              style={{
                backgroundColor: '#f1f5f9',
                padding: '3px 10px',
                borderRadius: 6,
                fontSize: 12.5,
                fontFamily: 'monospace',
                fontWeight: 700,
                color: '#334155',
                whiteSpace: 'nowrap',
              }}
            >
              {profile?.feiOwnerId || profile?.FEIOwnerID || 'VN-OWN-2024-0089'}
            </code>
          </Descriptions.Item>

          <Descriptions.Item label={t('profile.address')} span={2}>
            <span>{profile?.address || profile?.Address}</span>
          </Descriptions.Item>

          <Descriptions.Item label={t('profile.createdAt')}>
            <Space size="small">
              <CalendarOutlined style={{ color: '#64748b' }} />
              <span style={{ whiteSpace: 'nowrap' }}>
                {dayjs(profile?.createdAt || profile?.CreatedAt).format('DD/MM/YYYY')}
              </span>
            </Space>
          </Descriptions.Item>

          <Descriptions.Item label={t('profile.status')}>
            <Tag color="success" style={{ borderRadius: 6, fontWeight: 700 }}>
              {t('profile.activeStatus')}
            </Tag>
          </Descriptions.Item>
        </Descriptions>
      </Card>
    </div>
  );
}
