import { useState, useEffect, useMemo } from 'react';
import {
  Button,
  Card,
  Col,
  Empty,
  Flex,
  Input,
  Row,
  Select,
  Spin,
  Typography,
  message,
  Tabs,
} from 'antd';
import {
  PlusOutlined,
  SearchOutlined,
  InboxOutlined,
  ClockCircleOutlined,
  CheckCircleOutlined,
} from '@ant-design/icons';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import PageHeader from '@components/layout/PageHeader';
import BookingCard from '@features/customer/components/BookingCard';
import { CUSTOMER_STAGES } from '@features/customer/constants/customerStages';
import bookingService from '@services/bookingService';
import paymentService from '@services/paymentService';
import { useAuthStore } from '@features/auth/store/authStore';
import { unwrapData, unwrapList, getErrorMessage } from '@utils/apiHelpers';
import { ROUTES } from '@routes/routes';

const { Title, Text } = Typography;
// Các trạng thái tính là "đang xử lý" (đã duyệt, chờ thanh toán hoặc đang vận chuyển)
// Giai đoạn "đang xử lý" theo góc nhìn khách (R-07): đã duyệt, chưa xong, chưa bị hủy
const ACTIVE_STAGES = CUSTOMER_STAGES.filter((st) => !['PendingReview', 'Completed', 'Closed'].includes(st));

/**
 * Trang danh sách các yêu cầu vận chuyển của khách hàng (Customer)
 * Tái hiện giao diện theo Figma Frame 75:5337 (Account_Transport Requests)
 *
 * @returns {JSX.Element}
 */
export default function CustomerBookings() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { user } = useAuthStore();

  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshKey, setRefreshKey] = useState(0);

  // Bộ lọc: tab giai đoạn mở sẵn theo ?stage= (vd từ dashboard)
  const [searchParams] = useSearchParams();
  const [statusFilter, setStatusFilter] = useState(() => {
    const stage = searchParams.get('stage');
    return CUSTOMER_STAGES.includes(stage) ? stage : 'All';
  });
  const [searchQuery, setSearchQuery] = useState('');
  const [modeFilter, setModeFilter] = useState('All');

  // % hoàn cọc khi hủy, hiển thị trong hộp xác nhận hủy đơn đã đặt cọc
  const [cancelRefundPercent, setCancelRefundPercent] = useState(null);

  useEffect(() => {
    paymentService
      .getSettings()
      .then((res) => setCancelRefundPercent(unwrapData(res)?.cancelRefundPercent ?? null))
      .catch(() => {});
  }, []);

  // Tải danh sách đơn từ API
  useEffect(() => {
    let isSubscribed = true;

    // Backend tự lọc đơn của khách đang đăng nhập; size 100 vì mặc định chỉ trả 10 đơn
    bookingService
      .getBookings({ sort: '-createdAt', size: 100 })
      .then((res) => {
        if (isSubscribed) setBookings(unwrapList(res));
      })
      .catch((err) => {
        if (isSubscribed) {
          message.error(getErrorMessage(err, 'Không thể tải danh sách yêu cầu'));
          setBookings([]);
        }
      })
      .finally(() => {
        if (isSubscribed) {
          setLoading(false);
        }
      });

    return () => {
      isSubscribed = false;
    };
  }, [user, refreshKey, t]);

  /**
   * Điều hướng sang trang tạo mới yêu cầu vận chuyển
   */
  const handleNavigateToNewBooking = () => {
    navigate(ROUTES.CUSTOMER_BOOKING_NEW);
  };

  /**
   * Xử lý hủy đơn đặt chuyến (trước khi ngựa lên chuyến; đã cọc thì backend tự hoàn tiền)
   * @param {number} bookingId
   */
  const handleCancelBooking = async (bookingId) => {
    try {
      await bookingService.cancelBooking(bookingId);
      message.success(t('bookings.cancelSuccess') || 'Đã hủy yêu cầu vận chuyển thành công');
      setRefreshKey((k) => k + 1);
    } catch (err) {
      message.error(getErrorMessage(err, 'Không hủy được yêu cầu vận chuyển'));
    }
  };

  /**
   * Mở trang chi tiết đơn (R-07: timeline, hành trình, hồ sơ, thanh toán của đơn đều ở đây).
   * @param {import('@types/database').Booking} record
   * @param {string} [tab] - journey | documents | payment
   */
  const openDetail = (record, tab) => {
    const id = record?.bookingId || record?.BookingID;
    if (!id) return;
    navigate(`${ROUTES.CUSTOMER_BOOKING_DETAIL.replace(':id', id)}${tab ? `?tab=${tab}` : ''}`);
  };

  /**
   * Mở tab hồ sơ của đúng yêu cầu vận chuyển.
   * @param {import('@types/database').Booking} record
   */
  const handleOpenDocuments = (record) => openDetail(record, 'documents');

  // Thống kê số lượng theo 3 chỉ số chính (Figma Frame 75:5337)
  const totalCount = Array.isArray(bookings) ? bookings.length : 0;
  const countOf = (stage) => (Array.isArray(bookings) ? bookings.filter((b) => b.customerStage === stage).length : 0);
  const pendingCount = countOf('PendingReview');
  const activeCount = Array.isArray(bookings) ? bookings.filter((b) => ACTIVE_STAGES.includes(b.customerStage)).length : 0;

  // Lọc danh sách theo Tab, Search và Mode
  const filteredBookings = useMemo(() => {
    if (!Array.isArray(bookings)) return [];
    return bookings.filter((item) => {
      if (!item) return false;
      const itemStage = item.customerStage;
      const itemMode = item.transportMode || item.TransportMode;

      // Lọc theo giai đoạn (R-07)
      if (statusFilter !== 'All') {
        if (statusFilter === 'Active') {
          if (!ACTIVE_STAGES.includes(itemStage)) return false;
        } else if (itemStage !== statusFilter) {
          return false;
        }
      }

      // Lọc phương thức vận chuyển
      if (modeFilter !== 'All' && itemMode !== modeFilter) {
        return false;
      }

      // Lọc từ khóa tìm kiếm (Mã đơn, Địa chỉ đón, Địa chỉ giao)
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const code = (item.bookingCode || item.BookingCode || '').toLowerCase();
        const pickup = (item.pickupAddress || item.PickupAddress || '').toLowerCase();
        const dropoff = (item.dropoffAddress || item.DropoffAddress || '').toLowerCase();
        if (!code.includes(q) && !pickup.includes(q) && !dropoff.includes(q)) {
          return false;
        }
      }

      return true;
    });
  }, [bookings, statusFilter, modeFilter, searchQuery]);

  return (
    <div>
      {/* TIÊU ĐỀ TRANG VÀ NÚT TẠO YÊU CẦU MỚI */}
      <PageHeader
        title={t('bookings.title') || 'Yêu cầu vận chuyển'}
        subtitle={
          t('bookings.subtitle') ||
          'Theo dõi tiến độ báo giá, phê duyệt và điều phối lộ trình vận chuyển ngựa của bạn'
        }
        actions={
          <Button
            type="primary"
            size="large"
            icon={<PlusOutlined />}
            onClick={handleNavigateToNewBooking}
            style={{
              fontWeight: 700,
              borderRadius: 9999,
              height: 44,
              padding: '0 24px',
              backgroundColor: '#f59e0b',
              borderColor: '#f59e0b',
            }}
          >
            {String(t('bookings.addNew') || 'Tạo yêu cầu mới').replace(/^\+\s*/, '')}
          </Button>
        }
      />

      {/* 3 THẺ THỐNG KÊ TỔNG QUAN THEO FIGMA FRAME 75:5337 */}
      <Row gutter={[20, 20]} style={{ marginBottom: 28 }}>
        {/* Tổng số yêu cầu */}
        <Col xs={24} sm={8}>
          <div
            role="button"
            tabIndex={0}
            onClick={() => setStatusFilter('All')}
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                setStatusFilter('All');
              }
            }}
            style={{
              borderRadius: 14,
              border: statusFilter === 'All' ? '1.5px solid #F59E0B' : '1.5px solid #e2e8f0',
              backgroundColor: statusFilter === 'All' ? '#FFFBEB' : '#ffffff',
              boxShadow: '0 1px 3px rgba(0, 0, 0, 0.04)',
              padding: '20px 24px',
              cursor: 'pointer',
              transition: 'all 0.25s cubic-bezier(0.4, 0, 0.2, 1)',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.transform = 'translateY(-2px)';
              e.currentTarget.style.boxShadow = '0 8px 24px rgba(217, 119, 6, 0.12)';
              e.currentTarget.style.borderColor = '#F59E0B';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = 'translateY(0)';
              e.currentTarget.style.boxShadow = '0 1px 3px rgba(0, 0, 0, 0.04)';
              e.currentTarget.style.borderColor = statusFilter === 'All' ? '#F59E0B' : '#e2e8f0';
            }}
          >
            <Flex justify="space-between" align="center">
              <div>
                <Text type="secondary" style={{ fontSize: 13, fontWeight: 500 }}>
                  {t('bookings.stats.totalRequests') || 'Tổng số yêu cầu'}
                </Text>
                <Title level={2} style={{ margin: '4px 0 0', fontWeight: 800, color: '#0f172a' }}>
                  {totalCount}
                </Title>
              </div>
              <div
                style={{
                  width: 48,
                  height: 48,
                  borderRadius: 12,
                  backgroundColor: '#fef3c7',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: '#d97706',
                  fontSize: 22,
                }}
              >
                <InboxOutlined />
              </div>
            </Flex>
          </div>
        </Col>

        {/* Chờ xét duyệt */}
        <Col xs={24} sm={8}>
          <div
            role="button"
            tabIndex={0}
            onClick={() => setStatusFilter('PendingReview')}
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                setStatusFilter('PendingReview');
              }
            }}
            style={{
              borderRadius: 14,
              border: statusFilter === 'PendingReview' ? '1.5px solid #f59e0b' : '1.5px solid #e2e8f0',
              backgroundColor: statusFilter === 'PendingReview' ? '#fffbeb' : '#ffffff',
              boxShadow: '0 1px 3px rgba(0, 0, 0, 0.04)',
              padding: '20px 24px',
              cursor: 'pointer',
              transition: 'all 0.25s cubic-bezier(0.4, 0, 0.2, 1)',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.transform = 'translateY(-2px)';
              e.currentTarget.style.boxShadow = '0 8px 24px rgba(245, 158, 11, 0.15)';
              e.currentTarget.style.borderColor = '#f59e0b';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = 'translateY(0)';
              e.currentTarget.style.boxShadow = '0 1px 3px rgba(0, 0, 0, 0.04)';
              e.currentTarget.style.borderColor = statusFilter === 'PendingReview' ? '#f59e0b' : '#e2e8f0';
            }}
          >
            <Flex justify="space-between" align="center">
              <div>
                <Text type="secondary" style={{ fontSize: 13, fontWeight: 500 }}>
                  {t('bookings.stats.pendingApproval') || 'Chờ phê duyệt'}
                </Text>
                <Title level={2} style={{ margin: '4px 0 0', fontWeight: 800, color: '#f59e0b' }}>
                  {pendingCount}
                </Title>
              </div>
              <div
                style={{
                  width: 48,
                  height: 48,
                  borderRadius: 12,
                  backgroundColor: '#fffbeb',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: '#b45309',
                  fontSize: 22,
                }}
              >
                <ClockCircleOutlined />
              </div>
            </Flex>
          </div>
        </Col>

        {/* Đã duyệt & Đang triển khai */}
        <Col xs={24} sm={8}>
          <div
            role="button"
            tabIndex={0}
            onClick={() => setStatusFilter('Active')}
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                setStatusFilter('Active');
              }
            }}
            style={{
              borderRadius: 14,
              border: statusFilter === 'Active' ? '1.5px solid #10b981' : '1.5px solid #e2e8f0',
              backgroundColor: statusFilter === 'Active' ? '#ecfdf5' : '#ffffff',
              boxShadow: '0 1px 3px rgba(0, 0, 0, 0.04)',
              padding: '20px 24px',
              cursor: 'pointer',
              transition: 'all 0.25s cubic-bezier(0.4, 0, 0.2, 1)',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.transform = 'translateY(-2px)';
              e.currentTarget.style.boxShadow = '0 8px 24px rgba(16, 185, 129, 0.15)';
              e.currentTarget.style.borderColor = '#10b981';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = 'translateY(0)';
              e.currentTarget.style.boxShadow = '0 1px 3px rgba(0, 0, 0, 0.04)';
              e.currentTarget.style.borderColor = statusFilter === 'Active' ? '#10b981' : '#e2e8f0';
            }}
          >
            <Flex justify="space-between" align="center">
              <div>
                <Text type="secondary" style={{ fontSize: 13, fontWeight: 500 }}>
                  {t('bookings.stats.activeTrips') || 'Đang triển khai / Đã duyệt'}
                </Text>
                <Title level={2} style={{ margin: '4px 0 0', fontWeight: 800, color: '#10b981' }}>
                  {activeCount}
                </Title>
              </div>
              <div
                style={{
                  width: 48,
                  height: 48,
                  borderRadius: 12,
                  backgroundColor: '#ecfdf5',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: '#10b981',
                  fontSize: 22,
                }}
              >
                <CheckCircleOutlined />
              </div>
            </Flex>
          </div>
        </Col>
      </Row>

      {/* THANH BỘ LỌC VÀ TÌM KIẾM THEO FIGMA FRAME 75:5337 */}
      <Card
        bordered
        style={{
          borderRadius: 14,
          borderColor: '#e2e8f0',
          marginBottom: 24,
          boxShadow: '0 1px 3px rgba(0, 0, 0, 0.02)',
        }}
        styles={{ body: { padding: '16px 20px' } }}
      >
        <Flex justify="space-between" align="center" wrap="wrap" gap="middle">
          <Flex gap="small" wrap="wrap" align="center" style={{ flex: 1, justifyContent: 'flex-end' }}>
            {/* Bộ lọc phương thức vận chuyển */}
            <Select
              value={modeFilter}
              onChange={setModeFilter}
              size="middle"
              style={{ width: 175 }}
              options={[
                { value: 'All', label: t('bookings.filterAllModes') || 'Mọi phương thức' },
                { value: 'Ground', label: '🚛 ' + (t('bookings.modes.ground') || 'Đường bộ') },
                { value: 'Air', label: '✈ ' + (t('bookings.modes.air') || 'Hàng không') },
                { value: 'DoorToDoor', label: '🚛✈ ' + (t('bookings.modes.doorToDoor') || 'Door-to-Door') },
              ]}
            />

            {/* Ô tìm kiếm từ khóa */}
            <Input
              prefix={<SearchOutlined style={{ color: '#94a3b8' }} />}
              placeholder={t('bookings.searchPlaceholder') || 'Tìm kiếm mã đơn, địa chỉ đón/giao...'}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              allowClear
              style={{ maxWidth: 300, borderRadius: 8 }}
            />
          </Flex>
        </Flex>
        {/* Tab theo giai đoạn của đơn (R-07), kiểu "đơn mua" của sàn thương mại điện tử */}
        <Tabs
          activeKey={statusFilter}
          onChange={setStatusFilter}
          style={{ marginTop: 8, marginBottom: -16 }}
          items={[
            { key: 'All', label: `${t('bookings.tabs.all')} (${totalCount})` },
            ...(statusFilter === 'Active' ? [{ key: 'Active', label: `${t('bookings.tabs.active')} (${activeCount})` }] : []),
            ...CUSTOMER_STAGES.map((stage) => ({
              key: stage,
              label: `${t(`customerOrders.stage.${stage}`)} (${countOf(stage)})`,
            })),
          ]}
        />
      </Card>

      {/* KHỐI HIỂN THỊ DANH SÁCH CÁC THẺ YÊU CẦU VẬN CHUYỂN */}
      {loading ? (
        <div style={{ textAlign: 'center', padding: '60px 0' }}>
          <Spin size="large" />
          <Text type="secondary" style={{ display: 'block', marginTop: 12 }}>
            {t('common.loading')}
          </Text>
        </div>
      ) : filteredBookings.length === 0 ? (
        <Card
          bordered
          style={{
            borderRadius: 14,
            borderColor: '#e2e8f0',
            textAlign: 'center',
            padding: '48px 24px',
          }}
        >
          <Empty
            image={Empty.PRESENTED_IMAGE_SIMPLE}
            description={
              <div>
                <Text strong style={{ fontSize: 16, color: '#0f172a', display: 'block' }}>
                  {t('bookings.emptyTitle') || 'Chưa có yêu cầu vận chuyển nào'}
                </Text>
                <Text type="secondary" style={{ fontSize: 13, marginTop: 4, display: 'block' }}>
                  {searchQuery || statusFilter !== 'All'
                    ? t('bookings.emptyFilterHint') || 'Không tìm thấy yêu cầu phù hợp với bộ lọc'
                    : t('bookings.emptyCreateHint') ||
                      'Hãy tạo yêu cầu vận chuyển đầu tiên để kết nối với mạng lưới chuồng xe chuyên dụng.'}
                </Text>
              </div>
            }
          >
            {(!searchQuery && statusFilter === 'All') && (
              <Button
                type="primary"
                icon={<PlusOutlined />}
                onClick={handleNavigateToNewBooking}
                style={{
                  marginTop: 16,
                  borderRadius: 8,
                  backgroundColor: '#f59e0b',
                  borderColor: '#f59e0b',
                }}
              >
                {String(t('bookings.addNew') || 'Tạo yêu cầu mới').replace(/^\+\s*/, '')}
              </Button>
            )}
          </Empty>
        </Card>
      ) : (
        <div>
          {filteredBookings.map((b) => (
            <BookingCard
              key={b.bookingId || b.BookingID}
              booking={b}
              onCancel={handleCancelBooking}
              cancelRefundPercent={cancelRefundPercent}
              onViewDetail={(record) => openDetail(record)}
              onOpenTab={openDetail}
              onManageDocuments={handleOpenDocuments}
            />
          ))}
        </div>
      )}

    </div>
  );
}
