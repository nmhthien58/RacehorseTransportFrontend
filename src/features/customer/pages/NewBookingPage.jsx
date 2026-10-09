import { useState } from 'react';
import { Button, Modal, Space, Typography, Tag, Divider, message } from 'antd';
import {
  CheckCircleFilled,
  ArrowLeftOutlined,
  PlusOutlined,
  EnvironmentOutlined,
  CalendarOutlined,
} from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import dayjs from 'dayjs';
import PageHeader from '@components/layout/PageHeader';
import BookingWizard from '@features/customer/components/BookingWizard';
import bookingService from '@services/bookingService';
import { useAuthStore } from '@features/auth/store/authStore';
import { ROUTES } from '@routes/routes';

const { Title, Text } = Typography;

/**
 * Trang tạo yêu cầu đặt chuyến vận chuyển mới dành cho khách hàng (Customer)
 * Đường dẫn: /customer/bookings/new
 * Tái hiện quy trình đặt chuyến 4 bước và Popup xác nhận theo Figma Frame 77:8195
 *
 * @returns {JSX.Element}
 */
export default function NewBookingPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { user } = useAuthStore();

  const [submitting, setSubmitting] = useState(false);
  const [createdBooking, setCreatedBooking] = useState(null);
  const [successModalVisible, setSuccessModalVisible] = useState(false);
  const [wizardKey, setWizardKey] = useState(0);

  /**
   * Xử lý gọi API tạo mới đơn đặt chuyến
   * @param {Partial<import('@types/database').BookingRequest>} payload
   */
  const handleCreateBooking = async (payload) => {
    try {
      setSubmitting(true);
      const fullPayload = {
        ...payload,
        customerUserId: user?.userId || 5,
      };

      const res = await bookingService.createBooking(fullPayload);
      const newBookingData = res?.data || res || fullPayload;

      setCreatedBooking(newBookingData);
      setSuccessModalVisible(true);
      message.success(t('bookings.createSuccess') || 'Tạo yêu cầu vận chuyển thành công!');
    } catch (error) {
      const errorMsg =
        error?.response?.data?.message ||
        t('bookings.createFailed') ||
        'Có lỗi xảy ra khi gửi yêu cầu vận chuyển';
      message.error(errorMsg);
    } finally {
      setSubmitting(false);
    }
  };

  /**
   * Quay lại màn hình danh sách đơn đặt chuyến
   */
  const handleBackToList = () => {
    navigate(ROUTES.CUSTOMER_BOOKINGS);
  };

  /**
   * Đặt lại form để tạo thêm đơn mới khác
   */
  const handleCreateAnother = () => {
    setSuccessModalVisible(false);
    setCreatedBooking(null);
    setWizardKey((k) => k + 1);
  };

  return (
    <div style={{ maxWidth: 1040, margin: '0 auto', paddingBottom: 40 }}>
      {/* Header trang và thanh điều hướng Breadcrumb */}
      <PageHeader
        title={t('bookings.addNewTitle') || 'Tạo yêu cầu vận chuyển ngựa'}
        style={{ marginBottom: 16 }}
        breadcrumb={[
          {
            label: t('nav.transportRequests') || 'Yêu cầu vận chuyển',
            path: ROUTES.CUSTOMER_BOOKINGS,
          },
          { label: t('bookings.add') || 'Tạo mới' },
        ]}
      />

      {/* COMPONENT WIZARD 4 BƯỚC */}
      <BookingWizard
        key={wizardKey}
        onSubmit={handleCreateBooking}
        onCancel={handleBackToList}
        loading={submitting}
      />

      {/* POPUP XÁC NHẬN "REQUEST POSTED!" THEO FIGMA FRAME 77:8195 */}
      <Modal
        open={successModalVisible}
        footer={null}
        closable={false}
        centered
        width={520}
        styles={{
          content: {
            borderRadius: 18,
            padding: '36px 32px',
            textAlign: 'center',
          },
        }}
      >
        <div
          style={{
            width: 72,
            height: 72,
            borderRadius: '50%',
            backgroundColor: '#ecfdf5',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            margin: '0 auto 16px',
            color: '#10b981',
            fontSize: 40,
          }}
        >
          <CheckCircleFilled />
        </div>

        <Title level={3} style={{ margin: 0, fontWeight: 700, color: '#0f172a' }}>
          {t('bookings.modalSuccessTitle') || 'Yêu cầu đã được gửi thành công!'}
        </Title>
        <Text type="secondary" style={{ display: 'block', marginTop: 8, fontSize: 14 }}>
          {t('bookings.modalSuccessSubtitle', { code: createdBooking?.bookingCode }) ||
            `Đơn vận chuyển #${createdBooking?.bookingCode} đã được gửi tới Ban quản lý Logistics để kiểm tra tuyến và phê duyệt báo giá.`}
        </Text>

        {createdBooking && (
          <div
            style={{
              backgroundColor: '#f8fafc',
              border: '1px solid #e2e8f0',
              borderRadius: 14,
              padding: '18px 20px',
              margin: '22px 0 26px',
              textAlign: 'left',
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 10 }}>
              <Text type="secondary">{t('bookings.fields.bookingCode') || 'Mã đơn'}:</Text>
              <Text strong code style={{ fontSize: 13, background: '#ffffff' }}>
                #{createdBooking.bookingCode || createdBooking.BookingCode}
              </Text>
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 10 }}>
              <Text type="secondary">{t('bookings.fields.pickupAddress') || 'Điểm đón'}:</Text>
              <Text strong style={{ textAlign: 'right', maxWidth: 260 }}>
                <EnvironmentOutlined style={{ color: '#d97706', marginRight: 4 }} />
                {createdBooking.pickupAddress || createdBooking.PickupAddress} ({createdBooking.pickupCountryCode || createdBooking.PickupCountryCode || 'VN'})
              </Text>
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 10 }}>
              <Text type="secondary">{t('bookings.fields.dropoffAddress') || 'Điểm giao'}:</Text>
              <Text strong style={{ textAlign: 'right', maxWidth: 260 }}>
                <EnvironmentOutlined style={{ color: '#10b981', marginRight: 4 }} />
                {createdBooking.dropoffAddress || createdBooking.DropoffAddress} ({createdBooking.dropoffCountryCode || createdBooking.DropoffCountryCode || 'CN'})
              </Text>
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 10 }}>
              <Text type="secondary">{t('bookings.fields.departureDate') || 'Khởi hành'}:</Text>
              <Text strong>
                <CalendarOutlined style={{ marginRight: 4 }} />
                {dayjs(createdBooking.departureDate || createdBooking.DepartureDate).format('DD/MM/YYYY')}
              </Text>
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 10 }}>
              <Text type="secondary">{t('bookings.fields.totalHorses') || 'Số lượng ngựa'}:</Text>
              <Tag color="orange" style={{ margin: 0, fontWeight: 600 }}>
                🐴 {createdBooking.totalHorses || createdBooking.TotalHorses || 1} {t('bookings.horseUnit') || 'con'}
              </Tag>
            </div>

            <Divider style={{ margin: '12px 0' }} />

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <Text type="secondary">{t('bookings.fields.estimatedCost') || 'Dự toán cước phí'}:</Text>
              <span style={{ fontSize: 20, fontWeight: 800, color: '#d97706' }}>
                ${Number(createdBooking.estimatedCost || createdBooking.EstimatedCost || 0).toLocaleString()} USD
              </span>
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
              height: 48,
              borderRadius: 10,
              fontWeight: 700,
              backgroundColor: '#f59e0b',
              borderColor: '#f59e0b',
            }}
          >
            {t('bookings.backToList') || 'Xem danh sách yêu cầu'}
          </Button>

          <Button
            size="large"
            block
            icon={<PlusOutlined />}
            onClick={handleCreateAnother}
            style={{ height: 48, borderRadius: 10 }}
          >
            {t('bookings.createAnother') || 'Tạo thêm yêu cầu mới'}
          </Button>
        </Space>
      </Modal>
    </div>
  );
}
