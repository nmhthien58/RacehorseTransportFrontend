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
        customerId: user?.userId || 5,
      })
      .then((res) => {
        if (isSubscribed) {
          const list = res?.data?.data || res?.data || [];
          setBookings(list);
        }
      })
      .catch(() => {
        if (isSubscribed) {
          message.error(t('common.loading'));
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
  const totalCount = bookings.length;
  const pendingCount = bookings.filter((b) => b.status === 'Submitted').length;
  const activeCount = bookings.filter(
    (b) => b.status === 'Approved' || b.status === 'Assigned' || b.status === 'InTransit',
  ).length;

  // Lọc danh sách theo Tab, Search và Mode
  const filteredBookings = useMemo(() => {
    return bookings.filter((item) => {
      // Lọc trạng thái
      if (statusFilter !== 'All') {
        if (statusFilter === 'Active') {
          const isActive =
            item.status === 'Approved' ||
            item.status === 'Assigned' ||
            item.status === 'InTransit';
          if (!isActive) return false;
        } else if (item.status !== statusFilter) {
          return false;
        }
      }

      // Lọc phương thức vận chuyển
      if (modeFilter !== 'All' && item.transportMode !== modeFilter) {
        return false;
      }

      // Lọc từ khóa tìm kiếm (Mã đơn, Địa chỉ đón, Địa chỉ giao)
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const code = (item.bookingCode || '').toLowerCase();
        const pickup = (item.pickupAddress || '').toLowerCase();
        const dropoff = (item.dropoffAddress || '').toLowerCase();
        if (!code.includes(q) && !pickup.includes(q) && !dropoff.includes(q)) {
          return false;
        }
      }

      return true;
    });
  }, [bookings, statusFilter, modeFilter, searchQuery]);

  // Parse bảng kê chi phí dự kiến nếu có
  const parsedQuote = useMemo(() => {
    if (!selectedBooking?.quoteBreakdown) return [];
    try {
      return typeof selectedBooking.quoteBreakdown === 'string'
        ? JSON.parse(selectedBooking.quoteBreakdown)
        : selectedBooking.quoteBreakdown;
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
            {t('bookings.addNew') || '+ Tạo yêu cầu mới'}
          </Button>
        }
      />

      {/* 3 THẺ THỐNG KÊ TỔNG QUAN THEO FIGMA FRAME 75:5337 */}
      <Row gutter={[20, 20]} style={{ marginBottom: 28 }}>
        {/* Tổng số yêu cầu */}
        <Col xs={24} sm={8}>
          <Card
            bordered
            style={{
              borderRadius: 14,
              borderColor: '#e2e8f0',
              boxShadow: '0 1px 3px rgba(0, 0, 0, 0.04)',
            }}
            styles={{ body: { padding: '20px 24px' } }}
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
          </Card>
        </Col>

        {/* Chờ xét duyệt */}
        <Col xs={24} sm={8}>
          <Card
            bordered
            style={{
              borderRadius: 14,
              borderColor: '#e2e8f0',
              boxShadow: '0 1px 3px rgba(0, 0, 0, 0.04)',
            }}
            styles={{ body: { padding: '20px 24px' } }}
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
          </Card>
        </Col>

        {/* Đã duyệt & Đang triển khai */}
        <Col xs={24} sm={8}>
          <Card
            bordered
            style={{
              borderRadius: 14,
              borderColor: '#e2e8f0',
              boxShadow: '0 1px 3px rgba(0, 0, 0, 0.04)',
            }}
            styles={{ body: { padding: '20px 24px' } }}
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
          </Card>
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
              style={{ width: 160 }}
              options={[
                { value: 'All', label: t('bookings.filterAllModes') || 'Mọi phương thức' },
                { value: 'Ground', label: '🚛 ' + (t('bookings.modes.ground') || 'Đường bộ') },
                { value: 'Air', label: '✈ ' + (t('bookings.modes.air') || 'Hàng không') },
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
                {t('bookings.addNew') || '+ Tạo yêu cầu mới'}
              </Button>
            )}
          </Empty>
        </Card>
      ) : (
        <div>
          {filteredBookings.map((b) => (
            <BookingCard
              key={b.bookingId}
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
              {t('bookings.detailTitle') || 'Chi tiết đơn vận chuyển'} #{selectedBooking?.bookingCode}
            </span>
          </Flex>
        }
        width={680}
        styles={{ body: { padding: '20px 24px' } }}
      >
        {selectedBooking && (
          <div>
            <Flex justify="space-between" align="center" style={{ marginBottom: 16 }}>
              <StatusTag status={selectedBooking.status} />
              <Text type="secondary" style={{ fontSize: 13 }}>
                Ngày tạo: {dayjs(selectedBooking.createdAt).format('DD/MM/YYYY HH:mm')}
              </Text>
            </Flex>

            {/* Lộ trình */}
            <Card bordered style={{ backgroundColor: '#f8fafc', marginBottom: 16, borderRadius: 10 }}>
              <div style={{ marginBottom: 10 }}>
                <Text type="secondary" style={{ fontSize: 12 }}>
                  <EnvironmentOutlined style={{ color: '#d97706', marginRight: 4 }} />
                  ĐIỂM ĐÓN ({selectedBooking.pickupCountryCode}):
                </Text>
                <div style={{ fontWeight: 600, color: '#0f172a', marginTop: 2 }}>
                  {selectedBooking.pickupAddress}
                </div>
              </div>

              <div>
                <Text type="secondary" style={{ fontSize: 12 }}>
                  <EnvironmentOutlined style={{ color: '#10b981', marginRight: 4 }} />
                  ĐIỂM GIAO ({selectedBooking.dropoffCountryCode}):
                </Text>
                <div style={{ fontWeight: 600, color: '#0f172a', marginTop: 2 }}>
                  {selectedBooking.dropoffAddress}
                </div>
              </div>
            </Card>

            {/* Thông số kỹ thuật */}
            <Row gutter={[16, 12]} style={{ marginBottom: 16 }}>
              <Col span={12}>
                <Text type="secondary">Phương thức vận chuyển: </Text>
                <Tag color={selectedBooking.transportMode === 'Air' ? 'blue' : 'orange'}>
                  {selectedBooking.transportMode === 'Air' ? '✈ Hàng không' : '🚛 Đường bộ'}
                </Tag>
              </Col>
              <Col span={12}>
                <Text type="secondary">Số lượng ngựa: </Text>
                <strong>🐴 {selectedBooking.totalHorses} con</strong>
              </Col>
              <Col span={12}>
                <Text type="secondary">Khởi hành dự kiến: </Text>
                <strong>
                  <CalendarOutlined style={{ marginRight: 4 }} />
                  {dayjs(selectedBooking.departureDate).format('DD/MM/YYYY')}
                </strong>
              </Col>
              <Col span={12}>
                <Text type="secondary">Điều hòa nhiệt độ: </Text>
                <strong>{selectedBooking.requiresClimateControl ? 'Có (16-19°C)' : 'Không'}</strong>
              </Col>
              {selectedBooking.specialInstructions && (
                <Col span={24}>
                  <Text type="secondary">Ghi chú đặc biệt: </Text>
                  <div style={{ fontStyle: 'italic', marginTop: 2 }}>
                    &ldquo;{selectedBooking.specialInstructions}&rdquo;
                  </div>
                </Col>
              )}
            </Row>

            {/* Bảng kê chi phí */}
            {parsedQuote.length > 0 && (
              <div style={{ marginTop: 16 }}>
                <Divider style={{ margin: '12px 0' }} />
                <Title level={5} style={{ margin: '0 0 10px', color: '#0f172a' }}>
                  Bảng phân tích chi phí dự kiến
                </Title>
                <Table
                  dataSource={parsedQuote}
                  rowKey="code"
                  pagination={false}
                  size="small"
                  columns={[
                    { title: 'Khoản mục', dataIndex: 'name', key: 'name' },
                    { title: 'SL', dataIndex: 'qty', key: 'qty', align: 'center' },
                    {
                      title: 'Đơn giá',
                      dataIndex: 'unitPrice',
                      key: 'unitPrice',
                      align: 'right',
                      render: (v) => `$${Number(v).toLocaleString()}`,
                    },
                    {
                      title: 'Thành tiền',
                      dataIndex: 'amount',
                      key: 'amount',
                      align: 'right',
                      render: (v) => <strong>${Number(v).toLocaleString()}</strong>,
                    },
                  ]}
                />
              </div>
            )}

            <Divider style={{ margin: '16px 0' }} />

            <Flex justify="space-between" align="center">
              <Text strong style={{ fontSize: 15 }}>
                Tổng dự toán cước phí:
              </Text>
              <span style={{ fontSize: 24, fontWeight: 800, color: '#d97706' }}>
                ${Number(selectedBooking.estimatedCost || 0).toLocaleString()} USD
              </span>
            </Flex>
          </div>
        )}
      </Modal>
    </div>
  );
}
