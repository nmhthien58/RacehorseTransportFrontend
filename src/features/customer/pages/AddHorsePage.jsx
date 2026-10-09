import { useState } from 'react';
import { Button, Modal, Space, Typography, message } from 'antd';
import {
  CheckCircleFilled,
  ArrowLeftOutlined,
  PlusOutlined,
} from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import PageHeader from '@components/layout/PageHeader';
import AddHorseForm from '@features/customer/components/AddHorseForm';
import horseService from '@services/horseService';
import { useAuthStore } from '@features/auth/store/authStore';
import { ROUTES } from '@routes/routes';

const { Title, Text } = Typography;

/**
 * Trang Thêm mới hồ sơ ngựa đua dành cho khách hàng (Customer)
 * Đường dẫn: /customer/horses/new
 *
 * @returns {JSX.Element}
 */
export default function AddHorsePage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { user } = useAuthStore();

  const [submitting, setSubmitting] = useState(false);
  const [createdHorse, setCreatedHorse] = useState(null);
  const [successModalVisible, setSuccessModalVisible] = useState(false);
  const [formKey, setFormKey] = useState(0);

  /**
   * Xử lý gọi API tạo mới hồ sơ ngựa
   * @param {Partial<import('@types/database').Horse>} formData
   */
  const handleCreateHorse = async (formData) => {
    try {
      setSubmitting(true);
      const payload = {
        ...formData,
        ownerUserId: user?.userId || 5,
      };

      const res = await horseService.createHorse(payload);
      const newHorseData = res?.data || res || payload;

      setCreatedHorse(newHorseData);
      setSuccessModalVisible(true);
      message.success(t('horses.createSuccess'));
    } catch (error) {
      const errorMsg =
        error?.response?.data?.message || t('horses.createFailed') || t('common.save');
      message.error(errorMsg);
    } finally {
      setSubmitting(false);
    }
  };

  /**
   * Điều hướng quay về danh sách ngựa
   */
  const handleBackToList = () => {
    navigate(ROUTES.CUSTOMER_HORSES);
  };

  /**
   * Reset form để tiếp tục tạo cá thể ngựa khác
   */
  const handleAddAnother = () => {
    setSuccessModalVisible(false);
    setCreatedHorse(null);
    setFormKey((k) => k + 1);
  };

  return (
    <div style={{ maxWidth: 1000, margin: '0 auto', paddingBottom: 40 }}>
      <PageHeader
        title={t('horses.addNewTitle')}
        subtitle={t('horses.addNewSubtitle')}
        breadcrumb={[
          { label: t('horses.title'), path: ROUTES.CUSTOMER_HORSES },
          { label: t('horses.add') },
        ]}
      />

      <AddHorseForm
        key={formKey}
        onSubmit={handleCreateHorse}
        onCancel={handleBackToList}
        loading={submitting}
      />

      {/* POPUP THÀNH CÔNG VỚI TÙY CHỌN QUAY LẠI HOẶC THÊM TIẾP */}
      <Modal
        open={successModalVisible}
        footer={null}
        closable={false}
        centered
        width={480}
        styles={{
          content: {
            borderRadius: 16,
            padding: '36px 28px',
            textAlign: 'center',
          },
        }}
      >
        <div
          style={{
            width: 68,
            height: 68,
            borderRadius: '50%',
            backgroundColor: '#ecfdf5',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            margin: '0 auto 18px',
            color: '#10b981',
            fontSize: 36,
          }}
        >
          <CheckCircleFilled />
        </div>

        <Title level={3} style={{ margin: 0, fontWeight: 700, color: '#0f172a' }}>
          {t('horses.modalSuccessTitle')}
        </Title>
        <Text type="secondary" style={{ display: 'block', marginTop: 8, fontSize: 14 }}>
          {t('horses.modalSuccessSubtitle', { name: createdHorse?.name })}
        </Text>

        {createdHorse && (
          <div
            style={{
              backgroundColor: '#f8fafc',
              border: '1px solid #e2e8f0',
              borderRadius: 12,
              padding: '16px 20px',
              margin: '22px 0 26px',
              textAlign: 'left',
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
              <Text type="secondary">{t('horses.fields.name')}:</Text>
              <Text strong style={{ color: '#0f172a' }}>
                {createdHorse.name}
              </Text>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
              <Text type="secondary">{t('horses.fields.breed')}:</Text>
              <Text strong>{createdHorse.breed}</Text>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
              <Text type="secondary">{t('horses.fields.microchip')}:</Text>
              <Text code style={{ background: '#ffffff', padding: '1px 6px' }}>
                {createdHorse.microchipNumber}
              </Text>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <Text type="secondary">{t('horses.fields.passport')}:</Text>
              <Text strong>{createdHorse.passportNumber || '-'}</Text>
            </div>
          </div>
        )}

        <Space style={{ width: '100%' }} direction="vertical" size="middle">
          <Button
            type="primary"
            size="large"
            block
            icon={<ArrowLeftOutlined />}
            onClick={handleBackToList}
            style={{
              height: 46,
              borderRadius: 10,
              fontWeight: 700,
              backgroundColor: '#f59e0b',
              borderColor: '#f59e0b',
            }}
          >
            {t('horses.backToList')}
          </Button>

          <Button
            size="large"
            block
            icon={<PlusOutlined />}
            onClick={handleAddAnother}
            style={{
              height: 46,
              borderRadius: 10,
              fontWeight: 600,
            }}
          >
            {t('horses.addAnother')}
          </Button>
        </Space>
      </Modal>
    </div>
  );
}
