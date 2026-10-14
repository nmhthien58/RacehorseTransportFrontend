import { useState } from 'react';
import {
  Button,
  Card,
  Descriptions,
  Flex,
  Spin,
  Space,
  Tag,
  Typography,
  Modal,
  Form,
  Input,
  message,
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
import { useAuthStore } from '@features/auth/store/authStore';
import authService from '@services/authService';

const { Title, Text } = Typography;

/**
 * Trang thông tin hồ sơ tài khoản khách hàng (Customer Profile)
 * Đường dẫn: /customer/profile
 * Sử dụng AntD Descriptions [Họ tên, Email, SĐT, CLB, Role] + nút "Chỉnh sửa"
 *
 * @returns {JSX.Element}
 */
export default function ProfilePage() {
  const { t } = useTranslation();
  const { data: profile, loading } = useProfile();
  const { user, setUser } = useAuthStore();
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form] = Form.useForm();

  const handleOpenEdit = () => {
    form.setFieldsValue({
      fullName: profile?.fullName || profile?.FullName || '',
      phoneNumber: profile?.phoneNumber || profile?.PhoneNumber || '',
      clubName: profile?.clubName || profile?.ClubName || '',
      address: profile?.address || profile?.Address || '',
      city: profile?.city || profile?.City || '',
      country: profile?.country || profile?.Country || '',
    });
    setIsEditModalOpen(true);
  };

  const handleSaveProfile = async (values) => {
    try {
      setSaving(true);
      await authService.updateProfile(values);
      const updatedUser = {
        ...user,
        ...values,
        fullName: values.fullName,
        FullName: values.fullName,
        phoneNumber: values.phoneNumber,
        PhoneNumber: values.phoneNumber,
        address: values.address,
        Address: values.address,
        clubName: values.clubName,
        ClubName: values.clubName,
      };
      setUser(updatedUser);
      message.success(t('profile.updateSuccess') || 'Cập nhật hồ sơ thành công!');
      setIsEditModalOpen(false);
    } catch (err) {
      message.error(t('profile.updateError') || 'Không thể cập nhật hồ sơ: ' + (err.message || ''));
    } finally {
      setSaving(false);
    }
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

  const isCustomer = profile?.role === 'Customer';

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
          <Button
            type="primary"
            icon={<EditOutlined />}
            onClick={handleOpenEdit}
            style={{
              borderRadius: 9999,
              fontWeight: 600,
              height: 40,
              padding: '0 22px',
              backgroundColor: '#F59E0B',
              borderColor: '#F59E0B',
              color: '#ffffff',
            }}
          >
            {t('profile.edit') || 'Edit Profile'}
          </Button>
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
            <strong style={{ color: '#0f172a' }}>
              {isCustomer
                ? (profile?.clubName || profile?.ClubName || 'CLB Ngựa Đua Vina Equine')
                : (profile?.department || profile?.Department || 'Phòng Điều hành')}
            </strong>
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
              {isCustomer
                ? (profile?.feiOwnerId || profile?.FEIOwnerID || 'VN-OWN-2024-0089')
                : (profile?.staffId || profile?.StaffID || 'STAFF-001')}
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

      {/* Modal Chỉnh sửa hồ sơ cá nhân */}
      <Modal
        title={
          <span style={{ fontSize: 18, fontWeight: 700, color: '#0f172a' }}>
            {t('profile.editModalTitle') || 'Chỉnh sửa thông tin hồ sơ'}
          </span>
        }
        open={isEditModalOpen}
        onCancel={() => setIsEditModalOpen(false)}
        footer={null}
        destroyOnClose
        width={560}
      >
        <Form
          form={form}
          layout="vertical"
          onFinish={handleSaveProfile}
          style={{ marginTop: 18 }}
        >
          <Form.Item
            label={<strong>{t('profile.fullName') || 'Họ và tên'}</strong>}
            name="fullName"
            rules={[{ required: true, message: 'Vui lòng nhập họ và tên' }]}
          >
            <Input size="large" placeholder="Nhập họ và tên đầy đủ" />
          </Form.Item>

          <Form.Item
            label={<strong>{t('profile.phone') || 'Số điện thoại liên hệ'}</strong>}
            name="phoneNumber"
          >
            <Input size="large" placeholder="Ví dụ: +84 988 123 456" />
          </Form.Item>

          {isCustomer && (
            <Form.Item
              label={<strong>{t('profile.club') || 'Tên Trang trại / Câu lạc bộ ngựa'}</strong>}
              name="clubName"
            >
              <Input size="large" placeholder="Ví dụ: Trang trại Đua ngựa Hoàng Gia" />
            </Form.Item>
          )}

          <Form.Item
            label={<strong>{t('profile.address') || 'Địa chỉ Trang trại / Nơi ở đón ngựa'}</strong>}
            name="address"
            tooltip="Địa chỉ này sẽ được dùng để tự động điền vào Detailed Pickup Address khi bạn tạo yêu cầu vận chuyển Door-to-Door hoặc Ground."
          >
            <Input.TextArea
              rows={3}
              placeholder="Ví dụ: Trang trại Đua ngựa Tân Uyên, Đường ĐT746, Bình Dương"
            />
          </Form.Item>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 12, marginTop: 24 }}>
            <Button onClick={() => setIsEditModalOpen(false)}>
              {t('common.cancel') || 'Hủy bỏ'}
            </Button>
            <Button
              type="primary"
              htmlType="submit"
              loading={saving}
              style={{
                backgroundColor: '#F59E0B',
                borderColor: '#F59E0B',
                fontWeight: 600,
                padding: '0 24px',
              }}
            >
              {t('common.save') || 'Lưu thông tin'}
            </Button>
          </div>
        </Form>
      </Modal>
    </div>
  );
}
