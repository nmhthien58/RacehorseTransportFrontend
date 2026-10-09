import { useState, useEffect, useMemo } from 'react';
import {
  Button,
  Card,
  Col,
  Empty,
  Flex,
  Input,
  Row,
  Segmented,
  Select,
  Spin,
  Typography,
  message,
  Modal,
  Table,
  Tag,
  Divider,
} from 'antd';
import {
  PlusOutlined,
  SearchOutlined,
  InboxOutlined,
  ClockCircleOutlined,
  CheckCircleOutlined,
  CarOutlined,
  EnvironmentOutlined,
  CalendarOutlined,
} from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import dayjs from 'dayjs';
import PageHeader from '@components/layout/PageHeader';
import StatusTag from '@components/common/StatusTag';
import BookingCard from '@features/customer/components/BookingCard';
import bookingService from '@services/bookingService';
import { useAuthStore } from '@features/auth/store/authStore';
import { ROUTES } from '@routes/routes';

const { Title, Text } = Typography;

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

  // Bộ lọc
  const [statusFilter, setStatusFilter] = useState('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [modeFilter, setModeFilter] = useState('All');

  // Modal xem chi tiết đơn
  const [detailModalVisible, setDetailModalVisible] = useState(false);
  const [selectedBooking, setSelectedBooking] = useState(null);

  // Tải danh sách đơn từ API
  useEffect(() => {
    let isSubscribed = true;

    bookingService
      .getBookings({
        customerId: user?.UserID || 5,
      })
      .then((res) => {
        if (isSubscribed) {
          const list = Array.isArray(res?.data)
            ? res.data
            : Array.isArray(res?.data?.data)
            ? res.data.data
            : Array.isArray(res)
            ? res
            : [];
          setBookings(list);
        }
      })
      .catch(() => {
        if (isSubscribed) {
          message.error(t('common.loading') || 'Không thể tải danh sách yêu cầu');
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
   * Xử lý hủy đơn đặt chuyến khi còn ở trạng thái Submitted
   * @param {number} bookingId
   */
  const handleCancelBooking = async (bookingId) => {
    try {
      await bookingService.cancelBooking(bookingId);
      message.success(t('bookings.cancelSuccess') || 'Đã hủy yêu cầu vận chuyển thành công');
      setRefreshKey((k) => k + 1);
    } catch (error) {
      const err = error?.response?.data?.message || t('bookings.cancelFailed') || 'Không thể hủy đơn';
      message.error(err);
    }
  };

  /**
   * Mở modal xem chi tiết đơn đặt chuyến
   * @param {import('@types/database').Booking} record
   */
  const handleOpenDetail = (record) => {
    setSelectedBooking(record);
    setDetailModalVisible(true);
  };

  // Thống kê số lượng theo 3 chỉ số chính (Figma Frame 75:5337)
  const totalCount = Array.isArray(bookings) ? bookings.length : 0;
  const pendingCount = Array.isArray(bookings)
    ? bookings.filter((b) => (b.status || b.Status) === 'Submitted').length
    : 0;
  const activeCount = Array.isArray(bookings)
    ? bookings.filter((b) => {
        const st = b.status || b.Status;
        return st === 'Approved' || st === 'Assigned' || st === 'InTransit';
      }).length
    : 0;

  // Lọc danh sách theo Tab, Search và Mode
  const filteredBookings = useMemo(() => {
    if (!Array.isArray(bookings)) return [];
    return bookings.filter((item) => {
      if (!item) return false;
      const itemStatus = item.status || item.Status;
      const itemMode = item.transportMode || item.TransportMode;

      // Lọc trạng thái
      if (statusFilter !== 'All') {
        if (statusFilter === 'Active') {
          const isActive =
            itemStatus === 'Approved' ||
            itemStatus === 'Assigned' ||
            itemStatus === 'InTransit';
          if (!isActive) return false;
        } else if (itemStatus !== statusFilter) {
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

  // Parse bảng kê chi phí dự kiến nếu có
  const parsedQuote = useMemo(() => {
    if (!selectedBooking) return [];
    const rawLines = selectedBooking.quoteLines || selectedBooking.quoteBreakdown || selectedBooking.QuoteBreakdown;
    if (!rawLines) return [];
    try {
      return typeof rawLines === 'string' ? JSON.parse(rawLines) : rawLines;
    } catch {
      return [];
    }
  }, [selectedBooking]);

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
            onClick={() => setStatusFilter('All')}
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
            onClick={() => setStatusFilter('Submitted')}
            style={{
              borderRadius: 14,
              border: statusFilter === 'Submitted' ? '1.5px solid #f59e0b' : '1.5px solid #e2e8f0',
              backgroundColor: statusFilter === 'Submitted' ? '#fffbeb' : '#ffffff',
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
              e.currentTarget.style.borderColor = statusFilter === 'Submitted' ? '#f59e0b' : '#e2e8f0';
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
            onClick={() => setStatusFilter('Active')}
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
          {/* Segmented lọc theo trạng thái */}
          <Segmented
            value={statusFilter}
            onChange={setStatusFilter}
            size="large"
            options={[
              { label: t('bookings.tabs.all') || 'Tất cả', value: 'All' },
              { label: t('bookings.tabs.submitted') || 'Chờ duyệt', value: 'Submitted' },
              { label: t('bookings.tabs.active') || 'Đang xử lý', value: 'Active' },
              { label: t('bookings.tabs.completed') || 'Hoàn tất', value: 'Completed' },
            ]}
            style={{
              padding: 4,
              borderRadius: 10,
              backgroundColor: '#f1f5f9',
            }}
          />

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
              onViewDetail={handleOpenDetail}
            />
          ))}
        </div>
      )}

      {/* MODAL XEM CHI TIẾT ĐƠN ĐẶT CHUYẾN */}
      <Modal
        open={detailModalVisible}
        onCancel={() => setDetailModalVisible(false)}
        footer={[
          <Button key="close" onClick={() => setDetailModalVisible(false)}>
            {t('common.close') || 'Đóng'}
          </Button>,
        ]}
        title={
          <Flex align="center" gap="small">
            <CarOutlined style={{ color: '#f59e0b', fontSize: 20 }} />
            <span>
              {t('bookings.detailTitle') || 'Chi tiết đơn vận chuyển'} #{selectedBooking?.bookingCode || selectedBooking?.BookingCode}
            </span>
          </Flex>
        }
        width={680}
        styles={{ body: { padding: '20px 24px' } }}
      >
        {selectedBooking && (
          <div>
            <Flex justify="space-between" align="center" style={{ marginBottom: 16 }}>
              <StatusTag status={selectedBooking.status || selectedBooking.Status} />
              <Text type="secondary" style={{ fontSize: 13 }}>
                {t('bookings.createdAt')}: {dayjs(selectedBooking.createdAt || selectedBooking.CreatedAt).format('DD/MM/YYYY HH:mm')}
              </Text>
            </Flex>

            {/* Lộ trình */}
            <Card bordered style={{ backgroundColor: '#f8fafc', marginBottom: 16, borderRadius: 10 }}>
              <div style={{ marginBottom: 10 }}>
                <Text type="secondary" style={{ fontSize: 12 }}>
                  <EnvironmentOutlined style={{ color: '#d97706', marginRight: 4 }} />
                  {t('bookings.pickupLocation')} ({selectedBooking.pickupCountryCode || selectedBooking.PickupCountryCode}):
                </Text>
                <div style={{ fontWeight: 600, color: '#0f172a', marginTop: 2 }}>
                  {selectedBooking.pickupAddress || selectedBooking.PickupAddress}
                </div>
              </div>

              <div>
                <Text type="secondary" style={{ fontSize: 12 }}>
                  <EnvironmentOutlined style={{ color: '#10b981', marginRight: 4 }} />
                  {t('bookings.dropoffLocation')} ({selectedBooking.dropoffCountryCode || selectedBooking.DropoffCountryCode}):
                </Text>
                <div style={{ fontWeight: 600, color: '#0f172a', marginTop: 2 }}>
                  {selectedBooking.dropoffAddress || selectedBooking.DropoffAddress}
                </div>
              </div>
            </Card>

            {/* Thông số kỹ thuật */}
            <Row gutter={[16, 12]} style={{ marginBottom: 16 }}>
              <Col span={12}>
                <Text type="secondary">{t('bookings.transportMode')}: </Text>
                <Tag color={(selectedBooking.transportMode || selectedBooking.TransportMode) === 'Air' ? 'blue' : 'orange'}>
                  {(selectedBooking.transportMode || selectedBooking.TransportMode) === 'Air'
                    ? `✈ ${t('bookings.modes.air')}`
                    : `🚛 ${t('bookings.modes.ground')}`}
                </Tag>
              </Col>
              <Col span={12}>
                <Text type="secondary">{t('bookings.fields.totalHorses')}: </Text>
                <strong>🐴 {t('bookings.totalHorsesCount', { count: selectedBooking.totalHorses || selectedBooking.TotalHorses || 1 })}</strong>
              </Col>
              <Col span={12}>
                <Text type="secondary">{t('bookings.fields.departureDate')}: </Text>
                <strong>
                  <CalendarOutlined style={{ marginRight: 4 }} />
                  {dayjs(selectedBooking.departureDate || selectedBooking.DepartureDate).format('DD/MM/YYYY')}
                </strong>
              </Col>
              <Col span={12}>
                <Text type="secondary">{t('bookings.climateControl')}: </Text>
                <strong>
                  {(selectedBooking.requiresClimateControl ?? selectedBooking.RequiresClimateControl)
                    ? t('bookings.climateControlYes')
                    : t('bookings.climateControlNo')}
                </strong>
              </Col>
              {(selectedBooking.specialInstructions || selectedBooking.SpecialInstructions) && (
                <Col span={24}>
                  <Text type="secondary">{t('bookings.specialNotes')}: </Text>
                  <div style={{ fontStyle: 'italic', marginTop: 2 }}>
                    &ldquo;{selectedBooking.specialInstructions || selectedBooking.SpecialInstructions}&rdquo;
                  </div>
                </Col>
              )}
            </Row>

            {/* Bảng kê chi phí */}
            {parsedQuote.length > 0 && (
              <div style={{ marginTop: 16 }}>
                <Divider style={{ margin: '12px 0' }} />
                <Title level={5} style={{ margin: '0 0 10px', color: '#0f172a' }}>
                  {t('bookings.quoteBreakdownTitle')}
                </Title>
                <Table
                  dataSource={parsedQuote}
                  rowKey={(r) => r.code || r.name || Math.random()}
                  pagination={false}
                  size="small"
                  columns={[
                    { title: t('bookings.quoteItem'), dataIndex: 'name', key: 'name' },
                    { title: t('bookings.quoteQty'), dataIndex: 'quantity', key: 'quantity', align: 'center', render: (q, r) => q ?? r.qty ?? 1 },
                    {
                      title: t('bookings.quoteUnitPrice'),
                      dataIndex: 'unitPrice',
                      key: 'unitPrice',
                      align: 'right',
                      render: (v) => `$${Number(v || 0).toLocaleString()}`,
                    },
                    {
                      title: t('bookings.quoteAmount'),
                      dataIndex: 'amount',
                      key: 'amount',
                      align: 'right',
                      render: (v) => <strong>${Number(v || 0).toLocaleString()}</strong>,
                    },
                  ]}
                />
              </div>
            )}

            <Divider style={{ margin: '16px 0' }} />

            <Flex justify="space-between" align="center">
              <Text strong style={{ fontSize: 15 }}>
                {t('bookings.totalEstimatedCost')}:
              </Text>
              <span style={{ fontSize: 24, fontWeight: 800, color: '#d97706' }}>
                ${Number(selectedBooking.estimatedCost || selectedBooking.EstimatedCost || 0).toLocaleString()} USD
              </span>
            </Flex>
          </div>
        )}
      </Modal>
    </div>
  );
}
