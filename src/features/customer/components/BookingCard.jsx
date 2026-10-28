import { Card, Flex, Tag, Typography, Button, Space, Popconfirm } from 'antd';
import {
  EnvironmentOutlined,
  CalendarOutlined,
  CarOutlined,
  RocketOutlined,
  CloseCircleOutlined,
  ArrowRightOutlined,
  FileProtectOutlined,
  DollarOutlined,
  NodeIndexOutlined,
  FileDoneOutlined,
} from '@ant-design/icons';
import { useTranslation } from 'react-i18next';
import dayjs from 'dayjs';
import { formatPickupWindow } from '@utils/bookingSchedule';
import StatusTag from '@components/common/StatusTag';
import CustomerStageTag from '@components/common/CustomerStageTag';
import { CUSTOMER_ACTION_STAGES } from '@features/customer/constants/customerStages';

const { Text } = Typography;

/**
 * Component hiển thị thẻ tóm tắt yêu cầu vận chuyển ngựa đua
 * Thiết kế chuẩn theo Figma Frame 75:5337 (Account_Transport Requests)
 *
 * @param {Object} props
 * @param {import('@types/database').Booking} props.booking
 * @param {(bookingId: number) => void} [props.onCancel]
 * @param {(booking: import('@types/database').Booking) => void} [props.onViewDetail]
 * @param {(booking: import('@types/database').Booking) => void} [props.onManageDocuments]
 * @param {(booking: import('@types/database').Booking, tab: 'journey'|'payment') => void} [props.onOpenTab] - Mở thẳng một tab của chi tiết đơn
 * @returns {JSX.Element}
 */
export default function BookingCard({ booking, onCancel, onViewDetail, onManageDocuments, onOpenTab, cancelRefundPercent }) {
  const { t } = useTranslation();

  if (!booking) return null;

  const mode = booking.transportMode || booking.TransportMode || 'Ground';
  const isAir = mode === 'Air';
  const isDoorToDoor = mode === 'DoorToDoor' || mode === 'Door-to-Door';
  const status = booking.status || booking.Status || 'Submitted';
  // Hủy được trước khi ngựa lên chuyến; đã cọc thì hoàn theo % cấu hình (backend kiểm tra lại)
  const canCancel = ['Submitted', 'AwaitingDeposit', 'Approved'].includes(status);
  const canOpenDocuments = !['Rejected', 'Cancelled', 'Expired'].includes(status);
  const bookingCode = booking.bookingCode || booking.BookingCode || `${booking.bookingId || booking.BookingID || ''}`;
  const createdAt = booking.createdAt || booking.CreatedAt;
  const pickupAddress = booking.pickupAddress || booking.PickupAddress || 'Việt Nam';
  const pickupCountryCode = booking.pickupCountryCode || booking.PickupCountryCode || 'VN';
  const dropoffAddress = booking.dropoffAddress || booking.DropoffAddress || 'Điểm đến';
  const dropoffCountryCode = booking.dropoffCountryCode || booking.DropoffCountryCode || 'CN';
  const totalHorses = Number(booking.totalHorses || booking.TotalHorses) || 1;
  const estimatedCost = Number(booking.estimatedCost || booking.EstimatedCost) || 0;
  const currencyCode = booking.currencyCode || booking.CurrencyCode || 'USD';
  const requiresClimateControl = Boolean(booking.requiresClimateControl || booking.RequiresClimateControl);
  const bookingId = booking.bookingId || booking.BookingID;
  // R-07: giai đoạn theo góc nhìn khách; có chuyến thì xem được hành trình, đến lượt trả tiền thì có nút thanh toán
  const stage = booking.customerStage;
  const hasJourney = ['Scheduled', 'AwaitingPayment', 'InTransit', 'AwaitingHandover', 'Completed'].includes(stage) && status !== 'AwaitingDeposit';
  const needsPayment = CUSTOMER_ACTION_STAGES.includes(stage);
  // Ngựa đã được xếp lên chuyến đã duyệt / đã lên xe thì không tự hủy được nữa (backend cũng chặn)
  const showCancel = canCancel && !['Scheduled', 'AwaitingPayment', 'InTransit', 'AwaitingHandover'].includes(stage);

  return (
    <Card
      bordered
      style={{
        borderRadius: 14,
        borderColor: '#e2e8f0',
        boxShadow: '0 1px 4px rgba(0, 0, 0, 0.04)',
        transition: 'all 0.25s cubic-bezier(0.4, 0, 0.2, 1)',
        marginBottom: 16,
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.borderColor = '#cbd5e1';
        e.currentTarget.style.boxShadow = '0 6px 20px rgba(0, 0, 0, 0.06)';
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.borderColor = '#e2e8f0';
        e.currentTarget.style.boxShadow = '0 1px 4px rgba(0, 0, 0, 0.04)';
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
            #{bookingCode}
          </Text>
          {stage ? <CustomerStageTag stage={stage} /> : <StatusTag status={status} />}
          {isAir && (
            <Tag color="blue" style={{ borderRadius: 6, fontWeight: 500 }}>
              <RocketOutlined style={{ marginRight: 4 }} />
              {t('bookings.modes.air') || 'Đường hàng không'}
            </Tag>
          )}
          {isDoorToDoor && (
            <Tag color="purple" style={{ borderRadius: 6, fontWeight: 500 }}>
              <span style={{ marginRight: 4 }}>🚛✈</span>
              {t('bookings.modes.doorToDoor') || 'Door-to-Door'}
            </Tag>
          )}
          {!isAir && !isDoorToDoor && (
            <Tag color="orange" style={{ borderRadius: 6, fontWeight: 500 }}>
              <CarOutlined style={{ marginRight: 4 }} />
              {t('bookings.modes.ground') || 'Đường bộ'}
            </Tag>
          )}
          {requiresClimateControl && (
            <Tag color="cyan" style={{ borderRadius: 6 }}>
              ❄ {t('bookings.climateControlTag') || 'Điều hòa cabin'}
            </Tag>
          )}
        </Space>

        <Text type="secondary" style={{ fontSize: 13 }}>
          {t('bookings.createdAt') || 'Tạo ngày'}:{' '}
          {createdAt ? dayjs(createdAt).format('DD/MM/YYYY HH:mm') : 'Hôm nay'}
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
                {t('bookings.fields.pickupLocation') || 'ĐIỂM ĐÓN'} ({pickupCountryCode})
              </Text>
            </Flex>
            <Text strong style={{ fontSize: 14, color: '#1e293b', display: 'block' }}>
              {pickupAddress}
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
                {t('bookings.fields.deliveryLocation') || 'ĐIỂM GIAO'} ({dropoffCountryCode})
              </Text>
            </Flex>
            <Text strong style={{ fontSize: 14, color: '#1e293b', display: 'block' }}>
              {dropoffAddress}
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
              🐴 {totalHorses} {t('bookings.horseUnit') || 'con'}
            </strong>
          </div>

          <div>
            <Text type="secondary" style={{ fontSize: 12, display: 'block' }}>
              {t('bookings.fields.pickupWindow')}:
            </Text>
            <Space size={4}>
              <CalendarOutlined style={{ color: '#64748b' }} />
              <Text strong style={{ fontSize: 14, color: '#0f172a' }}>
                {formatPickupWindow(booking)}
              </Text>
            </Space>
          </div>

          <div>
            <Text type="secondary" style={{ fontSize: 12, display: 'block' }}>
              {t('bookings.fields.estimatedCost') || 'Dự toán cước phí'}:
            </Text>
            <span style={{ fontSize: 18, fontWeight: 700, color: '#d97706' }}>
              ${estimatedCost.toLocaleString()} {currencyCode}
            </span>
          </div>
        </Space>

        {/* NÚT THAO TÁC */}
        <Space size="small" wrap>
          {/* Đang sửa BookingCard vì đơn có báo giá chốt cần nút mở trang báo giá (FE-05) */}
          {stage === 'QuoteReady' && onViewDetail && (
            <Button
              type="primary"
              icon={<FileDoneOutlined />}
              size="middle"
              onClick={() => onViewDetail(booking)}
              style={{ borderRadius: 6, fontWeight: 600 }}
            >
              {t('quote.viewQuote')}
            </Button>
          )}

          {needsPayment && onOpenTab && (
            <Button
              type="primary"
              icon={<DollarOutlined />}
              size="middle"
              onClick={() => onOpenTab(booking, 'payment')}
              style={{ borderRadius: 6, fontWeight: 600, backgroundColor: '#f59e0b', borderColor: '#f59e0b' }}
            >
              {t('customerOrders.actions.pay')}
            </Button>
          )}

          {hasJourney && onOpenTab && (
            <Button
              icon={<NodeIndexOutlined />}
              size="middle"
              onClick={() => onOpenTab(booking, 'journey')}
              style={{ borderRadius: 6, fontWeight: 500 }}
            >
              {t('customerOrders.actions.journey')}
            </Button>
          )}

          {canOpenDocuments && onManageDocuments && (
            <Button
              icon={<FileProtectOutlined />}
              size="middle"
              onClick={() => onManageDocuments(booking)}
              style={{ borderRadius: 6, fontWeight: 500 }}
            >
              {t('bookings.manageDocuments')}
            </Button>
          )}

          {showCancel && onCancel && (
            <Popconfirm
              title={t('bookings.cancelConfirmTitle') || 'Hủy yêu cầu đặt chuyến?'}
              description={
                status === 'Approved'
                  ? t('bookings.cancelRefundDesc', { percent: cancelRefundPercent ?? 50 })
                  : t('bookings.cancelConfirmDesc') ||
                    'Bạn có chắc chắn muốn hủy yêu cầu vận chuyển này không?'
              }
              onConfirm={() => onCancel(bookingId)}
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
