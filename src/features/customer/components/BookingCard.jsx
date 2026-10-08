import { Card, Flex, Tag, Typography, Button, Space, Popconfirm } from 'antd';
import {
  EnvironmentOutlined,
  CalendarOutlined,
  CarOutlined,
  RocketOutlined,
  CloseCircleOutlined,
  ArrowRightOutlined,
} from '@ant-design/icons';
import { useTranslation } from 'react-i18next';
import dayjs from 'dayjs';
import StatusTag from '@components/common/StatusTag';

const { Text } = Typography;

/**
 * Component hiển thị thẻ tóm tắt yêu cầu vận chuyển ngựa đua
 * Thiết kế chuẩn theo Figma Frame 75:5337 (Account_Transport Requests)
 *
 * @param {Object} props
 * @param {import('@types/database').Booking} props.booking
 * @param {(bookingId: number) => void} [props.onCancel]
 * @param {(booking: import('@types/database').Booking) => void} [props.onViewDetail]
 * @returns {JSX.Element}
 */
export default function BookingCard({ booking, onCancel, onViewDetail }) {
  const { t } = useTranslation();

  const isAir = booking.transportMode === 'Air';
  const canCancel = booking.status === 'Submitted';

  return (
    <Card
      bordered
      style={{
        borderRadius: 14,
        borderColor: '#e2e8f0',
        boxShadow: '0 1px 4px rgba(0, 0, 0, 0.04)',
        transition: 'all 0.2s ease',
        marginBottom: 16,
      }}
      styles={{
        body: { padding: '20px 24px' },
      }}
    >
      {/* HÀNG TRÊN: MÃ ĐƠN + TRẠNG THÁI + NGÀY TẠO */}
      <Flex justify="space-between" align="center" wrap="wrap" gap="small" style={{ marginBottom: 16 }}>
        <Space size="middle" align="center">
          <Text
            strong
            style={{
              fontSize: 16,
              color: '#0f172a',
              letterSpacing: '0.02em',
              fontFamily: 'monospace',
            }}
          >
            #{booking.bookingCode}
          </Text>
          <StatusTag status={booking.status} />
          <Tag color={isAir ? 'blue' : 'orange'} style={{ borderRadius: 6, fontWeight: 500 }}>
            {isAir ? (
              <span>
                <RocketOutlined style={{ marginRight: 4 }} />
                {t('bookings.modes.air') || 'Đường hàng không'}
              </span>
            ) : (
              <span>
                <CarOutlined style={{ marginRight: 4 }} />
                {t('bookings.modes.ground') || 'Đường bộ'}
              </span>
            )}
          </Tag>
          {booking.requiresClimateControl && (
            <Tag color="cyan" style={{ borderRadius: 6 }}>
              ❄ {t('bookings.climateControlTag') || 'Điều hòa cabin'}
            </Tag>
          )}
        </Space>

        <Text type="secondary" style={{ fontSize: 13 }}>
          {t('bookings.createdAt') || 'Tạo ngày'}:{' '}
          {dayjs(booking.createdAt).format('DD/MM/YYYY HH:mm')}
        </Text>
      </Flex>

      {/* KHỐI GIỮA: LỘ TRÌNH VẬN CHUYỂN (ĐÓN ➔ GIAO) */}
      <div
        style={{
          backgroundColor: '#f8fafc',
          borderRadius: 10,
          padding: '14px 18px',
          marginBottom: 16,
          border: '1px solid #f1f5f9',
        }}
      >
        <Flex justify="space-between" align="center" wrap="wrap" gap="middle">
          {/* Điểm xuất phát */}
          <div style={{ flex: 1, minWidth: 200 }}>
            <Flex orientation="horizontal" align="center" gap="small" style={{ marginBottom: 4 }}>
              <EnvironmentOutlined style={{ color: '#d97706', fontSize: 16 }} />
              <Text type="secondary" style={{ fontSize: 12, textTransform: 'uppercase', fontWeight: 600 }}>
                {t('bookings.fields.pickupLocation') || 'ĐIỂM ĐÓN'} ({booking.pickupCountryCode})
              </Text>
            </Flex>
            <Text strong style={{ fontSize: 14, color: '#1e293b', display: 'block' }}>
              {booking.pickupAddress}
            </Text>
          </div>

          {/* Mũi tên lộ trình */}
          <div style={{ textAlign: 'center', padding: '0 12px' }}>
            <ArrowRightOutlined style={{ color: '#94a3b8', fontSize: 18 }} />
          </div>

          {/* Điểm giao hàng */}
          <div style={{ flex: 1, minWidth: 200 }}>
            <Flex orientation="horizontal" align="center" gap="small" style={{ marginBottom: 4 }}>
              <EnvironmentOutlined style={{ color: '#10b981', fontSize: 16 }} />
              <Text type="secondary" style={{ fontSize: 12, textTransform: 'uppercase', fontWeight: 600 }}>
                {t('bookings.fields.deliveryLocation') || 'ĐIỂM GIAO'} ({booking.dropoffCountryCode})
              </Text>
            </Flex>
            <Text strong style={{ fontSize: 14, color: '#1e293b', display: 'block' }}>
              {booking.dropoffAddress}
            </Text>
          </div>
        </Flex>
      </div>

      {/* HÀNG DƯỚI: THÔNG SỐ (SỐ NGỰA, NGÀY KHỞI HÀNH, DỰ TOÁN CƯỚC, HÀNH ĐỘNG) */}
      <Flex justify="space-between" align="center" wrap="wrap" gap="middle">
        <Space size="large" wrap>
          <div>
            <Text type="secondary" style={{ fontSize: 12, display: 'block' }}>
              {t('bookings.fields.totalHorses') || 'Số lượng ngựa'}:
            </Text>
            <strong style={{ fontSize: 15, color: '#0f172a' }}>
              🐴 {booking.totalHorses || 1} {t('bookings.horseUnit') || 'con'}
            </strong>
          </div>

          <div>
            <Text type="secondary" style={{ fontSize: 12, display: 'block' }}>
              {t('bookings.fields.departureDate') || 'Ngày khởi hành'}:
            </Text>
            <Space size={4}>
              <CalendarOutlined style={{ color: '#64748b' }} />
              <Text strong style={{ fontSize: 14, color: '#0f172a' }}>
                {dayjs(booking.departureDate).format('DD/MM/YYYY')}
              </Text>
            </Space>
          </div>

          <div>
            <Text type="secondary" style={{ fontSize: 12, display: 'block' }}>
              {t('bookings.fields.estimatedCost') || 'Dự toán cước phí'}:
            </Text>
            <span style={{ fontSize: 18, fontWeight: 700, color: '#d97706' }}>
              ${Number(booking.estimatedCost || 0).toLocaleString()} {booking.currencyCode || 'USD'}
            </span>
          </div>
        </Space>

        {/* NÚT THAO TÁC */}
        <Space size="small">
          {canCancel && onCancel && (
            <Popconfirm
              title={t('bookings.cancelConfirmTitle') || 'Hủy yêu cầu đặt chuyến?'}
              description={
                t('bookings.cancelConfirmDesc') ||
                'Bạn có chắc chắn muốn hủy yêu cầu vận chuyển này không?'
              }
              onConfirm={() => onCancel(booking.bookingId)}
              okText={t('common.confirm')}
              cancelText={t('common.cancel')}
              okButtonProps={{ danger: true }}
            >
              <Button danger icon={<CloseCircleOutlined />} size="middle">
                {t('bookings.cancelRequest') || 'Hủy đơn'}
              </Button>
            </Popconfirm>
          )}

          {onViewDetail && (
            <Button
              type="primary"
              ghost
              size="middle"
              onClick={() => onViewDetail(booking)}
              style={{ borderRadius: 6, fontWeight: 500 }}
            >
              {t('common.detail') || 'Chi tiết'}
            </Button>
          )}
        </Space>
      </Flex>
    </Card>
  );
}
