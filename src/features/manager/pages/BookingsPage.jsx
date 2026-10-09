import { useState, useEffect, useMemo, useCallback } from 'react';
import {
  Button,
  Card,
  Col,
  DatePicker,
  Empty,
  Flex,
  Input,
  Row,
  Segmented,
  Select,
  Table,
  Tooltip,
  Typography,
  message,
} from 'antd';
import {
  SearchOutlined,
  ReloadOutlined,
  RightOutlined,
  RedoOutlined,
} from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import dayjs from 'dayjs';
import PageHeader from '@components/layout/PageHeader';
import StatusTag from '@components/common/StatusTag';
import bookingService from '@services/bookingService';
import userService from '@services/userService';
import { BOOKING_STATUS, TRANSPORT_MODE } from '@utils/constants';

const { Text, Title } = Typography;
const { RangePicker } = DatePicker;

/**
 * Trang danh sách quản lý yêu cầu vận chuyển (Manager & Admin)
 * Tối ưu bảng màu đồng nhất, loại bỏ icon rườm rà, điều hướng chi tiết qua dấu mũi tên
 * Phục vụ Flow 1: Booking Review & Assignment
 *
 * @returns {JSX.Element}
 */
export default function ManagerBookings({ isDashboardView = false }) {
  const { t } = useTranslation();
  const navigate = useNavigate();

  // Dữ liệu danh sách đơn và chuyên viên
  const [bookings, setBookings] = useState([]);
  const [specialists, setSpecialists] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshKey, setRefreshKey] = useState(0);

  // Bộ lọc trạng thái, từ khóa, phương thức, chuyên viên
  const [statusFilter, setStatusFilter] = useState('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [modeFilter, setModeFilter] = useState('All');
  const [specialistFilter, setSpecialistFilter] = useState('All');

  // Bộ lọc theo ngày tháng & thời gian tạo
  const [dateTypeFilter, setDateTypeFilter] = useState('departureDate');
  const [dateRange, setDateRange] = useState(null);

  // Kích hoạt làm mới danh sách dữ liệu
  const handleRefresh = useCallback(() => {
    setRefreshKey((k) => k + 1);
  }, []);

  // Đặt lại toàn bộ các bộ lọc về mặc định
  const handleResetFilters = useCallback(() => {
    setStatusFilter('All');
    setSearchQuery('');
    setModeFilter('All');
    setSpecialistFilter('All');
    setDateTypeFilter('departureDate');
    setDateRange(null);
  }, []);

  // Kiểm tra có đang áp dụng bộ lọc nào không
  const hasActiveFilters = useMemo(() => {
    return (
      statusFilter !== 'All' ||
      searchQuery.trim() !== '' ||
      modeFilter !== 'All' ||
      specialistFilter !== 'All' ||
      dateRange !== null
    );
  }, [statusFilter, searchQuery, modeFilter, specialistFilter, dateRange]);

  // Tải dữ liệu danh sách đơn và chuyên viên
  useEffect(() => {
    let active = true;

    const fetchData = async () => {
      setLoading(true);
      try {
        const [bookingsRes, staffRes] = await Promise.all([
          bookingService.getBookings(),
          userService.getStaff('TransportSpecialist').catch(() => null),
        ]);
        if (active) {
          const list = bookingsRes?.data?.data || bookingsRes?.data || [];
          setBookings(Array.isArray(list) ? list : []);
          const staffList = staffRes?.data?.data || staffRes?.data || [];
          setSpecialists(Array.isArray(staffList) ? staffList : []);
        }
      } catch {
        if (active) {
          message.error(t('manager.bookings.messages.loadFailed'));
        }
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    };

    fetchData();

    return () => {
      active = false;
    };
  }, [t, refreshKey]);

  // Thống kê 4 chỉ số tổng quan tối giản
  const stats = useMemo(() => {
    const total = bookings.length;
    const pending = bookings.filter((b) => b.status === BOOKING_STATUS.SUBMITTED).length;
    const approved = bookings.filter(
      (b) => b.status === BOOKING_STATUS.APPROVED || b.status === BOOKING_STATUS.ASSIGNED,
    ).length;
    const rejected = bookings.filter(
      (b) => b.status === BOOKING_STATUS.REJECTED || b.status === BOOKING_STATUS.CANCELLED,
    ).length;
    return { total, pending, approved, rejected };
  }, [bookings]);

  // Áp dụng các bộ lọc tìm kiếm & ngày tháng
  const filteredBookings = useMemo(() => {
    return bookings.filter((item) => {
      // 1. Lọc theo trạng thái
      if (statusFilter !== 'All' && item.status !== statusFilter) {
        return false;
      }

      // 2. Lọc theo phương thức vận chuyển
      if (modeFilter !== 'All' && item.transportMode !== modeFilter) {
        return false;
      }

      // 3. Lọc theo chuyên viên phụ trách
      if (specialistFilter === 'Unassigned') {
        if (item.assignedSpecialistId) return false;
      } else if (specialistFilter !== 'All') {
        if (Number(item.assignedSpecialistId) !== Number(specialistFilter)) {
          return false;
        }
      }

      // 4. Lọc theo từ khóa tìm kiếm
      if (searchQuery.trim()) {
        const q = searchQuery.trim().toLowerCase();
        const codeMatch = (item.bookingCode || '').toLowerCase().includes(q);
        const pickupMatch = (item.pickupAddress || '').toLowerCase().includes(q);
        const dropoffMatch = (item.dropoffAddress || '').toLowerCase().includes(q);
        const customerMatch = (item.customerName || '').toLowerCase().includes(q);
        if (!codeMatch && !pickupMatch && !dropoffMatch && !customerMatch) {
          return false;
        }
      }

      // 5. Lọc theo khoảng ngày (Ngày khởi hành hoặc Ngày tạo đơn)
      if (dateRange && dateRange[0] && dateRange[1]) {
        const targetDateStr =
          dateTypeFilter === 'departureDate' ? item.departureDate : item.createdAt;
        if (!targetDateStr) return false;

        const targetMoment = dayjs(targetDateStr);
        const startDay = dateRange[0].startOf('day');
        const endDay = dateRange[1].endOf('day');

        if (targetMoment.isBefore(startDay) || targetMoment.isAfter(endDay)) {
          return false;
        }
      }

      return true;
    });
  }, [
    bookings,
    statusFilter,
    modeFilter,
    specialistFilter,
    searchQuery,
    dateRange,
    dateTypeFilter,
  ]);

  // Tìm tên chuyên viên từ specialist ID
  const getSpecialistName = useCallback(
    (id) => {
      if (!id) return null;
      const found = specialists.find((s) => s.userId === Number(id));
      return found ? found.fullName : `Specialist #${id}`;
    },
    [specialists],
  );

  // Định dạng số tiền USD
  const formatCost = (cost, currency = 'USD') => {
    if (cost == null) return '—';
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency || 'USD',
      maximumFractionDigits: 0,
    }).format(cost);
  };

  // Điều hướng sang trang chi tiết đơn riêng
  const handleNavigateDetail = (record) => {
    if (record.status === BOOKING_STATUS.SUBMITTED) {
      navigate(`/manager/pending-requests?id=${record.bookingId}`);
    } else {
      navigate(`/manager/bookings/${record.bookingId}`);
    }
  };

  // Cột bảng tinh gọn, tối giản màu sắc và icon theo đúng thiết kế chuẩn
  const columns = [
    {
      title: t('manager.bookings.columns.bookingCode'),
      dataIndex: 'bookingCode',
      key: 'bookingCode',
      width: 130,
      render: (code) => (
        <Text strong style={{ color: '#0f172a', fontFamily: 'monospace', fontSize: 13 }}>
          #{code}
        </Text>
      ),
    },
    {
      title: t('manager.bookings.columns.customer'),
      key: 'customer',
      width: 140,
      render: (_, record) => (
        <Text strong style={{ fontSize: 13, color: '#334155' }}>
          {record.customerName || `Customer #${record.customerUserId}`}
        </Text>
      ),
    },
    {
      title: t('manager.bookings.columns.route'),
      key: 'route',
      ellipsis: true,
      render: (_, record) => {
        const pickupCity = record.pickupAddress ? record.pickupAddress.split(',')[0].trim() : '—';
        const dropoffCity = record.dropoffAddress ? record.dropoffAddress.split(',')[0].trim() : '—';

        return (
          <Tooltip title={`${record.pickupAddress} → ${record.dropoffAddress}`}>
            <span style={{ fontSize: 13, color: '#1e293b' }}>
              {pickupCity} ({record.pickupCountryCode || 'VN'}) → {dropoffCity} ({record.dropoffCountryCode || 'VN'})
            </span>
          </Tooltip>
        );
      },
    },
    {
      title: t('manager.bookings.columns.schedule'),
      key: 'schedule',
      width: 120,
      render: (_, record) => (
        <span style={{ fontSize: 13, color: '#475569' }}>
          {record.departureDate ? dayjs(record.departureDate).format('DD/MM/YYYY') : '—'}
        </span>
      ),
    },
    {
      title: t('manager.bookings.columns.horses'),
      dataIndex: 'totalHorses',
      key: 'totalHorses',
      width: 90,
      align: 'center',
      render: (count) => (
        <span style={{ fontSize: 13, color: '#334155', fontWeight: 500 }}>
          {count} {t('manager.bookings.columns.horses').toLowerCase()}
        </span>
      ),
    },
    {
      title: t('manager.bookings.filters.mode'),
      dataIndex: 'transportMode',
      key: 'transportMode',
      width: 100,
      render: (mode) => (
        <span style={{ fontSize: 13, color: '#475569' }}>
          {mode}
        </span>
      ),
    },
    {
      title: t('manager.bookings.columns.estimatedCost'),
      dataIndex: 'estimatedCost',
      key: 'estimatedCost',
      width: 120,
      align: 'right',
      render: (cost, record) => (
        <Text strong style={{ color: '#0f172a', fontSize: 13 }}>
          {formatCost(cost, record.currencyCode)}
        </Text>
      ),
    },
    {
      title: t('manager.bookings.columns.status'),
      dataIndex: 'status',
      key: 'status',
      width: 120,
      align: 'center',
      render: (status) => <StatusTag status={status} />,
    },
    {
      title: t('manager.bookings.columns.specialist'),
      dataIndex: 'assignedSpecialistId',
      key: 'specialist',
      width: 150,
      render: (specId) => {
        const name = getSpecialistName(specId);
        return name ? (
          <span style={{ fontSize: 13, color: '#334155', fontWeight: 500 }}>
            {name}
          </span>
        ) : (
          <Text type="secondary" style={{ fontSize: 12 }}>
            {t('manager.bookings.unassigned')}
          </Text>
        );
      },
    },
    {
      title: '',
      key: 'action',
      width: 50,
      align: 'center',
      render: (_, record) => (
        <Tooltip title={t('manager.bookings.actions.viewDetail')}>
          <Button
            type="text"
            size="small"
            icon={<RightOutlined style={{ fontSize: 13, color: '#64748b' }} />}
            onClick={() => handleNavigateDetail(record)}
          />
        </Tooltip>
      ),
    },
  ];

  return (
    <div>
      {/* 1. TIÊU ĐỀ TRANG CHUẨN PAGEHEADER */}
      <PageHeader
        title={isDashboardView ? t('nav.dashboard') : t('manager.bookings.title')}
        subtitle={t('manager.bookings.subtitle')}
        action={
          <Button icon={<ReloadOutlined />} onClick={handleRefresh} loading={loading}>
            {t('manager.bookings.filters.refresh')}
          </Button>
        }
      />

      {/* 2. BỐN THẺ THỐNG KÊ ĐỒNG NHẤT, SẠCH SẼ THEO FIGMA */}
      <Row gutter={[16, 16]} style={{ marginBottom: 20 }}>
        <Col xs={12} sm={6}>
          <Card
            bordered
            style={{ borderRadius: 12, borderColor: '#e2e8f0' }}
            styles={{ body: { padding: '16px 20px' } }}
          >
            <Text type="secondary" style={{ fontSize: 13, fontWeight: 500 }}>
              {t('manager.bookings.stats.total')}
            </Text>
            <Title level={3} style={{ margin: '6px 0 0', fontWeight: 700, color: '#0f172a' }}>
              {stats.total}
            </Title>
          </Card>
        </Col>

        <Col xs={12} sm={6}>
          <Card
            bordered
            style={{ borderRadius: 12, borderColor: '#e2e8f0' }}
            styles={{ body: { padding: '16px 20px' } }}
          >
            <Text type="secondary" style={{ fontSize: 13, fontWeight: 500 }}>
              {t('manager.bookings.stats.pending')}
            </Text>
            <Title level={3} style={{ margin: '6px 0 0', fontWeight: 700, color: '#d97706' }}>
              {stats.pending}
            </Title>
          </Card>
        </Col>

        <Col xs={12} sm={6}>
          <Card
            bordered
            style={{ borderRadius: 12, borderColor: '#e2e8f0' }}
            styles={{ body: { padding: '16px 20px' } }}
          >
            <Text type="secondary" style={{ fontSize: 13, fontWeight: 500 }}>
              {t('manager.bookings.stats.approved')}
            </Text>
            <Title level={3} style={{ margin: '6px 0 0', fontWeight: 700, color: '#0f172a' }}>
              {stats.approved}
            </Title>
          </Card>
        </Col>

        <Col xs={12} sm={6}>
          <Card
            bordered
            style={{ borderRadius: 12, borderColor: '#e2e8f0' }}
            styles={{ body: { padding: '16px 20px' } }}
          >
            <Text type="secondary" style={{ fontSize: 13, fontWeight: 500 }}>
              {t('manager.bookings.stats.rejected')}
            </Text>
            <Title level={3} style={{ margin: '6px 0 0', fontWeight: 700, color: '#0f172a' }}>
              {stats.rejected}
            </Title>
          </Card>
        </Col>
      </Row>

      {/* 3. KHỐI BỘ LỌC TỔNG HỢP GỌN GÀNG, KHÔNG ICON THỪA */}
      <Card
        bordered
        style={{
          borderRadius: 12,
          borderColor: '#e2e8f0',
          marginBottom: 16,
        }}
        styles={{ body: { padding: '16px 20px' } }}
      >
        {/* Hàng 1: Tabs trạng thái + Ô tìm kiếm */}
        <Flex justify="space-between" align="center" wrap="wrap" gap="middle" style={{ marginBottom: 14 }}>
          <Segmented
            value={statusFilter}
            onChange={setStatusFilter}
            options={[
              { label: `${t('manager.bookings.tabs.all')} (${bookings.length})`, value: 'All' },
              {
                label: `${t('manager.bookings.tabs.submitted')} (${stats.pending})`,
                value: BOOKING_STATUS.SUBMITTED,
              },
              { label: t('manager.bookings.tabs.approved'), value: BOOKING_STATUS.APPROVED },
              { label: t('manager.bookings.tabs.assigned'), value: BOOKING_STATUS.ASSIGNED },
              { label: t('manager.bookings.tabs.completed'), value: BOOKING_STATUS.COMPLETED },
              { label: t('manager.bookings.tabs.rejected'), value: BOOKING_STATUS.REJECTED },
            ]}
            style={{
              padding: 3,
              borderRadius: 8,
              backgroundColor: '#f1f5f9',
            }}
          />

          <Input
            prefix={<SearchOutlined style={{ color: '#94a3b8' }} />}
            placeholder={t('manager.bookings.filters.searchPlaceholder')}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            allowClear
            style={{ maxWidth: 300, borderRadius: 8 }}
          />
        </Flex>

        {/* Hàng 2: Bộ lọc ngày tháng, phương thức, chuyên viên & Nút Reset */}
        <Flex wrap="wrap" align="center" gap="middle" justify="space-between">
          <Flex wrap="wrap" align="center" gap="small" style={{ flex: 1 }}>
            {/* Lọc phương thức vận chuyển */}
            <Select
              value={modeFilter}
              onChange={setModeFilter}
              style={{ width: 140 }}
              options={[
                { value: 'All', label: t('manager.bookings.filters.modeAll') },
                { value: TRANSPORT_MODE.GROUND, label: t('manager.bookings.filters.modeGround') },
                { value: TRANSPORT_MODE.AIR, label: t('manager.bookings.filters.modeAir') },
              ]}
            />

            {/* Lọc chuyên viên phụ trách */}
            <Select
              value={specialistFilter}
              onChange={setSpecialistFilter}
              style={{ width: 180 }}
              options={[
                { value: 'All', label: t('manager.bookings.filters.specialistAll') },
                { value: 'Unassigned', label: t('manager.bookings.filters.specialistUnassigned') },
                ...specialists.map((s) => ({
                  value: String(s.userId),
                  label: s.fullName,
                })),
              ]}
            />

            {/* Chọn loại ngày cần lọc */}
            <Select
              value={dateTypeFilter}
              onChange={setDateTypeFilter}
              style={{ width: 145 }}
              options={[
                { value: 'departureDate', label: t('manager.bookings.filters.dateTypeDeparture') },
                { value: 'createdAt', label: t('manager.bookings.filters.dateTypeCreated') },
              ]}
            />

            {/* Bộ chọn khoảng ngày RangePicker */}
            <RangePicker
              value={dateRange}
              onChange={setDateRange}
              format="DD/MM/YYYY"
              placeholder={[
                t('manager.bookings.filters.dateRangeStart'),
                t('manager.bookings.filters.dateRangeEnd'),
              ]}
              style={{ width: 230, borderRadius: 8 }}
            />
          </Flex>

          {/* Nút đặt lại bộ lọc nếu đang có filter */}
          {hasActiveFilters && (
            <Button
              type="link"
              size="small"
              icon={<RedoOutlined />}
              onClick={handleResetFilters}
              style={{ color: '#d97706', padding: 0 }}
            >
              {t('manager.bookings.filters.reset')}
            </Button>
          )}
        </Flex>
      </Card>

      {/* 4. BẢNG HIỂN THỊ DANH SÁCH ĐƠN */}
      <Card
        bordered
        style={{ borderRadius: 12, borderColor: '#e2e8f0' }}
        styles={{ body: { padding: '8px 12px' } }}
      >
        <Table
          rowKey="bookingId"
          columns={columns}
          dataSource={filteredBookings}
          loading={loading}
          pagination={{ pageSize: 8, showSizeChanger: true }}
          scroll={{ x: 950 }}
          onRow={(record) => ({
            onClick: () => handleNavigateDetail(record),
            style: { cursor: 'pointer' },
          })}
          locale={{
            emptyText: (
              <Empty
                image={Empty.PRESENTED_IMAGE_SIMPLE}
                description={t('common.noData')}
              />
            ),
          }}
        />
      </Card>
    </div>
  );
}
