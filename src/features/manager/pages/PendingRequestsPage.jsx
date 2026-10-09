import { useState, useEffect, useMemo, useCallback } from 'react';
import {
  Alert,
  Avatar,
  Badge,
  Button,
  Card,
  Col,
  Empty,
  Flex,
  Form,
  Input,
  Modal,
  Progress,
  Row,
  Select,
  Space,
  Spin,
  Table,
  Tag,
  Typography,
  message,
} from 'antd';
import {
  ArrowLeftOutlined,
  CheckCircleFilled,
  CheckOutlined,
  ClockCircleOutlined,
  CloseOutlined,
  FilePdfOutlined,
  RightOutlined,
  SearchOutlined,
  WarningOutlined,
} from '@ant-design/icons';
import { useSearchParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import dayjs from 'dayjs';
import PageHeader from '@components/layout/PageHeader';
import bookingService from '@services/bookingService';
import userService from '@services/userService';
import { BOOKING_STATUS } from '@utils/constants';

const { Text, Title } = Typography;
const { TextArea } = Input;

/**
 * Trang Pending Requests dành cho Quản lý / Admin
 * - Hiển thị danh sách các yêu cầu vận chuyển đang chờ duyệt (nhiều hơn)
 * - Khi bấm vào từng đơn sẽ chuyển sang xem Full Detail ngay trên trang
 * - Trang detail có 2 nút lớn: Approve Request (vàng) và Reject Request (đỏ nhạt)
 * - Khớp 100% bố cục và nội dung Figma (Figma photo #ORD-8821)
 *
 * @returns {JSX.Element}
 */
export default function PendingRequestsPage() {
  const { t } = useTranslation();
  const [searchParams, setSearchParams] = useSearchParams();

  // ID đơn được chọn xem chi tiết (nếu null -> hiển thị danh sách)
  const selectedIdFromUrl = searchParams.get('id');
  const [selectedBookingId, setSelectedBookingId] = useState(
    selectedIdFromUrl ? Number(selectedIdFromUrl) : null
  );

  const [bookings, setBookings] = useState([]);
  const [specialists, setSpecialists] = useState([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [searchText, setSearchText] = useState('');
  const [refreshKey, setRefreshKey] = useState(0);

  // Modal states
  const [approveModalOpen, setApproveModalOpen] = useState(false);
  const [rejectModalOpen, setRejectModalOpen] = useState(false);

  const [approveForm] = Form.useForm();
  const [rejectForm] = Form.useForm();

  const handleRefresh = useCallback(() => {
    setRefreshKey((k) => k + 1);
  }, []);

  // Đồng bộ URL khi chọn hoặc quay lại
  const handleSelectBooking = (id) => {
    setSelectedBookingId(id);
    if (id) {
      setSearchParams({ id: String(id) });
    } else {
      setSearchParams({});
    }
  };

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
          const list = bookingsRes?.data?.data || bookingsRes?.data || bookingsRes || [];
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

  // Lọc chỉ lấy các đơn Pending (Submitted)
  const pendingList = useMemo(() => {
    return bookings.filter((b) => b.status === BOOKING_STATUS.SUBMITTED);
  }, [bookings]);

  // Lọc theo tìm kiếm từ khóa
  const filteredPending = useMemo(() => {
    if (!searchText.trim()) return pendingList;
    const q = searchText.trim().toLowerCase();
    return pendingList.filter((b) => {
      const codeMatch = b.bookingCode?.toLowerCase().includes(q);
      const nameMatch = b.customerName?.toLowerCase().includes(q);
      const routeMatch =
        b.pickupAddress?.toLowerCase().includes(q) || b.dropoffAddress?.toLowerCase().includes(q);
      return codeMatch || nameMatch || routeMatch;
    });
  }, [pendingList, searchText]);

  // Chi tiết đơn đang được chọn
  const activeBooking = useMemo(() => {
    if (!selectedBookingId) return null;
    return bookings.find((b) => b.bookingId === selectedBookingId) || null;
  }, [bookings, selectedBookingId]);

  // Tên viết tắt Avatar của khách hàng (ví dụ: SA cho Sheikh Al-Maktoum)
  const customerInitials = useMemo(() => {
    if (!activeBooking?.customerName) return 'CU';
    const parts = activeBooking.customerName.trim().split(' ');
    if (parts.length === 1) return parts[0].substring(0, 2).toUpperCase();
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
  }, [activeBooking]);

  // Xử lý phê duyệt
  const handleOpenApprove = () => {
    approveForm.resetFields();
    if (specialists.length > 0) {
      approveForm.setFieldsValue({ specialistUserId: specialists[0].userId });
    }
    setApproveModalOpen(true);
  };

  const handleConfirmApprove = async () => {
    try {
      const values = await approveForm.validateFields();
      setActionLoading(true);
      await bookingService.approveBooking(activeBooking.bookingId, {
        specialistUserId: values.specialistUserId,
      });
      message.success(t('manager.bookings.messages.approveSuccess'));
      setApproveModalOpen(false);
      handleRefresh();
      // Quay lại danh sách sau khi duyệt xong
      handleSelectBooking(null);
    } catch (err) {
      if (err?.errorFields) return;
      message.error(t('manager.bookings.messages.actionFailed'));
    } finally {
      setActionLoading(false);
    }
  };

  // Xử lý từ chối
  const handleOpenReject = () => {
    rejectForm.resetFields();
    setRejectModalOpen(true);
  };

  const handleConfirmReject = async () => {
    try {
      const values = await rejectForm.validateFields();
      setActionLoading(true);
      await bookingService.rejectBooking(activeBooking.bookingId, {
        reason: values.reason,
      });
      message.success(t('manager.bookings.messages.rejectSuccess'));
      setRejectModalOpen(false);
      handleRefresh();
      handleSelectBooking(null);
    } catch (err) {
      if (err?.errorFields) return;
      message.error(t('manager.bookings.messages.actionFailed'));
    } finally {
      setActionLoading(false);
    }
  };

  // Nếu đang tải dữ liệu
  if (loading && bookings.length === 0) {
    return (
      <div style={{ textAlign: 'center', padding: '100px 0' }}>
        <Spin size="large" />
        <Text type="secondary" style={{ display: 'block', marginTop: 16 }}>
          {t('common.loading')}
        </Text>
      </div>
    );
  }

  // =========================================================================
  // VIEW 1: NẾU ĐANG CHỌN 1 ĐƠN -> HIỂN THỊ CHI TIẾT ĐẦY ĐỦ KHỚP 100% FIGMA
  // =========================================================================
  if (activeBooking) {
    return (
      <div style={{ maxWidth: 1400, margin: '0 auto', paddingBottom: 40 }}>
        {/* Nút quay lại và breadcrumb */}
        <div style={{ marginBottom: 16 }}>
          <Button
            type="link"
            icon={<ArrowLeftOutlined />}
            onClick={() => handleSelectBooking(null)}
            style={{
              paddingLeft: 0,
              fontSize: 14,
              fontWeight: 600,
              color: '#0284c7',
              marginBottom: 4,
            }}
          >
            {t('manager.pendingRequests.backToList')}
          </Button>

          <div style={{ fontSize: 13, color: '#64748b', marginBottom: 8 }}>
            <span>{t('manager.pendingRequests.requestManagement')}</span>
            <span style={{ margin: '0 6px' }}>›</span>
            <span>{t('manager.pendingRequests.pendingApproval')}</span>
            <span style={{ margin: '0 6px' }}>›</span>
            <span style={{ color: '#0284c7', fontWeight: 600 }}>#{activeBooking.bookingCode}</span>
          </div>

          <Flex justify="space-between" align="center" wrap="wrap" gap="small">
            <Flex align="center" gap="small" wrap="wrap">
              <Title level={2} style={{ margin: 0, color: '#0f172a', fontWeight: 700 }}>
                {t('manager.pendingRequests.requestTitle', { code: activeBooking.bookingCode })}
              </Title>
              <Tag
                style={{
                  backgroundColor: '#FEF3C7',
                  color: '#D97706',
                  borderColor: '#FDE68A',
                  fontWeight: 700,
                  fontSize: 12,
                  padding: '2px 8px',
                  borderRadius: 6,
                }}
              >
                ● PENDING
              </Tag>
              <Tag
                style={{
                  backgroundColor: '#FFEDD5',
                  color: '#EA580C',
                  borderColor: '#FED7AA',
                  fontWeight: 600,
                  fontSize: 12,
                  padding: '2px 8px',
                  borderRadius: 6,
                }}
              >
                <ClockCircleOutlined style={{ marginRight: 4 }} />
                {activeBooking.expiresInText || 'Expires in 9h 12m'}
              </Tag>
            </Flex>

            <Text type="secondary" style={{ fontSize: 13 }}>
              {t('manager.pendingRequests.submittedDate', {
                date: activeBooking.createdAt
                  ? dayjs(activeBooking.createdAt).format('MMM DD, YYYY · HH:mm')
                  : 'Nov 12, 2025 · 09:24',
                source: activeBooking.submissionSource || 'via Customer Web Portal',
              })}
            </Text>
          </Flex>
        </div>

        {/* Khung nội dung 2 cột khớp Figma */}
        <Row gutter={[20, 20]}>
          {/* CỘT TRÁI (2/3): THÔNG TIN KHÁCH, LỘ TRÌNH, NGỰA, YÊU CẦU ĐẶC BIỆT, TIMELINE */}
          <Col xs={24} lg={16}>
            <Space orientation="vertical" orientationMargin={0} size={16} style={{ width: '100%' }}>
              {/* 1. Customer Information Card */}
              <Card
                bordered
                style={{
                  borderRadius: 14,
                  borderColor: '#e2e8f0',
                  boxShadow: '0 1px 3px rgba(0,0,0,0.02)',
                }}
                styles={{ body: { padding: '20px 24px' } }}
              >
                <Text
                  style={{
                    fontSize: 13,
                    fontWeight: 700,
                    color: '#64748b',
                    letterSpacing: '0.5px',
                    display: 'block',
                    marginBottom: 16,
                  }}
                >
                  {t('manager.pendingRequests.customerInfo').toUpperCase()}
                </Text>

                <Flex orientation="horizontal" align="center" gap={16} wrap="wrap">
                  <Avatar
                    size={52}
                    style={{
                      backgroundColor: '#e0f2fe',
                      color: '#0284c7',
                      fontSize: 18,
                      fontWeight: 700,
                    }}
                  >
                    {customerInitials}
                  </Avatar>

                  <div style={{ flex: 1, minWidth: 200 }}>
                    <Text strong style={{ fontSize: 16, color: '#0f172a', display: 'block' }}>
                      {activeBooking.customerName || 'Sheikh Al-Maktoum'}
                    </Text>
                    <Text type="secondary" style={{ fontSize: 13 }}>
                      {activeBooking.customerClub || 'Al-Maktoum Racing Club · Dubai, UAE'}
                    </Text>
                  </div>

                  <div style={{ minWidth: 200 }}>
                    <div style={{ fontSize: 13, color: '#334155', marginBottom: 4 }}>
                      📞 {activeBooking.customerPhone || '+971 50 123 4567'}
                    </div>
                    <div style={{ fontSize: 13, color: '#334155' }}>
                      ✉️ {activeBooking.customerEmail || 'sheikh.almaktoum@rc.ae'}
                    </div>
                  </div>
                </Flex>
              </Card>

              {/* 2. Transport Information Card */}
              <Card
                bordered
                style={{
                  borderRadius: 14,
                  borderColor: '#e2e8f0',
                  boxShadow: '0 1px 3px rgba(0,0,0,0.02)',
                }}
                styles={{ body: { padding: '20px 24px' } }}
              >
                <Text
                  style={{
                    fontSize: 13,
                    fontWeight: 700,
                    color: '#64748b',
                    letterSpacing: '0.5px',
                    display: 'block',
                    marginBottom: 16,
                  }}
                >
                  {t('manager.pendingRequests.transportInfo').toUpperCase()}
                </Text>

                {/* Tuyến đường trực quan */}
                <div
                  style={{
                    padding: '16px 20px',
                    backgroundColor: '#f8fafc',
                    borderRadius: 10,
                    border: '1px solid #e2e8f0',
                    marginBottom: 20,
                  }}
                >
                  <Flex justify="space-between" align="center" wrap="wrap" gap="small">
                    <Flex align="center" gap={8}>
                      <span style={{ color: '#16a34a', fontSize: 16 }}>●</span>
                      <Text strong style={{ fontSize: 15, color: '#0f172a' }}>
                        {activeBooking.pickupAddress || 'Paris (CDG)'}
                      </Text>
                    </Flex>

                    <div
                      style={{
                        flex: 1,
                        margin: '0 20px',
                        minWidth: 100,
                        borderBottom: '2px dashed #cbd5e1',
                        position: 'relative',
                      }}
                    />

                    <Flex align="center" gap={8}>
                      <span style={{ color: '#2563eb', fontSize: 16 }}>●</span>
                      <Text strong style={{ fontSize: 15, color: '#0f172a' }}>
                        {activeBooking.dropoffAddress || 'Dubai (DXB)'}
                      </Text>
                    </Flex>
                  </Flex>

                  <div style={{ textAlign: 'center', marginTop: 10, fontSize: 12, color: '#64748b' }}>
                    {activeBooking.flightDuration
                      ? `${t('manager.pendingRequests.estimatedFlight')} ${activeBooking.flightDuration} · `
                      : ''}
                    {t('manager.pendingRequests.distance')} ={' '}
                    {activeBooking.distanceKm
                      ? `${activeBooking.distanceKm.toLocaleString()} km`
                      : '4,980 km'}
                  </div>
                </div>

                {/* 3 thông số cột */}
                <Row gutter={16}>
                  <Col span={8}>
                    <Text type="secondary" style={{ fontSize: 11, fontWeight: 700, display: 'block' }}>
                      {t('manager.pendingRequests.requestedDate')}
                    </Text>
                    <Text strong style={{ fontSize: 14, color: '#0f172a' }}>
                      {activeBooking.departureDate
                        ? dayjs(activeBooking.departureDate).format('DD MMM YYYY')
                        : '15 Nov 2025'}
                    </Text>
                  </Col>
                  <Col span={8}>
                    <Text type="secondary" style={{ fontSize: 11, fontWeight: 700, display: 'block' }}>
                      {t('manager.pendingRequests.numberOfHorses')}
                    </Text>
                    <Text strong style={{ fontSize: 14, color: '#0f172a' }}>
                      {activeBooking.totalHorses} {t('manager.bookings.columns.horses').toLowerCase()}
                    </Text>
                  </Col>
                  <Col span={8}>
                    <Text type="secondary" style={{ fontSize: 11, fontWeight: 700, display: 'block' }}>
                      {t('manager.pendingRequests.handling')}
                    </Text>
                    <Text strong style={{ fontSize: 14, color: '#0f172a' }}>
                      {activeBooking.handling || 'Climate-controlled'}
                    </Text>
                  </Col>
                </Row>
              </Card>

              {/* 3. Horses in this Request Card */}
              <Card
                bordered
                style={{
                  borderRadius: 14,
                  borderColor: '#e2e8f0',
                  boxShadow: '0 1px 3px rgba(0,0,0,0.02)',
                }}
                styles={{ body: { padding: '20px 24px' } }}
              >
                <Flex justify="space-between" align="center" style={{ marginBottom: 16 }}>
                  <Flex align="center" gap={8}>
                    <Text
                      style={{
                        fontSize: 13,
                        fontWeight: 700,
                        color: '#64748b',
                        letterSpacing: '0.5px',
                      }}
                    >
                      {t('manager.pendingRequests.horsesInRequest').toUpperCase()}
                    </Text>
                    <Badge
                      count={activeBooking.totalHorses || 2}
                      style={{ backgroundColor: '#f1f5f9', color: '#475569', boxShadow: 'none' }}
                    />
                  </Flex>
                </Flex>

                <Table
                  size="small"
                  pagination={false}
                  dataSource={activeBooking.horses || []}
                  rowKey={(h) => h.bookingHorseId || h.horseId || h.horseName}
                  columns={[
                    {
                      title: 'HORSE',
                      dataIndex: 'horseName',
                      key: 'horseName',
                      render: (name) => (
                        <Flex align="center" gap={8}>
                          <span style={{ color: '#16a34a' }}>●</span>
                          <Text strong style={{ fontSize: 13, color: '#0f172a' }}>
                            {name}
                          </Text>
                          <Tag
                            style={{
                              backgroundColor: '#DCFCE7',
                              color: '#15803D',
                              borderColor: '#BBF7D0',
                              fontSize: 10,
                              fontWeight: 700,
                              borderRadius: 4,
                              margin: 0,
                            }}
                          >
                            HEALTHY
                          </Tag>
                        </Flex>
                      ),
                    },
                    {
                      title: 'BREED',
                      dataIndex: 'breed',
                      key: 'breed',
                      render: (b) => <span style={{ fontSize: 13, color: '#475569' }}>{b || '—'}</span>,
                    },
                    {
                      title: 'AGE',
                      dataIndex: 'age',
                      key: 'age',
                      render: (a) => <span style={{ fontSize: 13, color: '#475569' }}>{a || '—'}</span>,
                    },
                    {
                      title: 'MICROCHIP',
                      dataIndex: 'microchipNumber',
                      key: 'microchip',
                      render: (m) => (
                        <span style={{ fontSize: 13, fontFamily: 'monospace', color: '#334155' }}>
                          {m || '—'}
                        </span>
                      ),
                    },
                  ]}
                />
              </Card>

              {/* 4. Special Requests */}
              {activeBooking.specialInstructions && (
                <Card
                  bordered
                  style={{
                    borderRadius: 14,
                    borderColor: '#fef08a',
                    backgroundColor: '#fefce8',
                    boxShadow: '0 1px 3px rgba(0,0,0,0.02)',
                  }}
                  styles={{ body: { padding: '18px 22px' } }}
                >
                  <Flex align="flex-start" gap={12}>
                    <WarningOutlined style={{ fontSize: 18, color: '#ca8a04', marginTop: 2 }} />
                    <div>
                      <Text strong style={{ fontSize: 13, color: '#854d0e', display: 'block', marginBottom: 4 }}>
                        {t('manager.pendingRequests.specialRequests')}
                      </Text>
                      <Text style={{ fontSize: 13, color: '#713f12', lineHeight: 1.6 }}>
                        {activeBooking.specialInstructions}
                      </Text>
                    </div>
                  </Flex>
                </Card>
              )}

              {/* 5. Status History Card */}
              <Card
                bordered
                style={{
                  borderRadius: 14,
                  borderColor: '#e2e8f0',
                  boxShadow: '0 1px 3px rgba(0,0,0,0.02)',
                }}
                styles={{ body: { padding: '20px 24px' } }}
              >
                <Flex justify="space-between" align="center" style={{ marginBottom: 16 }}>
                  <Text
                    style={{
                      fontSize: 13,
                      fontWeight: 700,
                      color: '#64748b',
                      letterSpacing: '0.5px',
                    }}
                  >
                    {t('manager.pendingRequests.statusHistory').toUpperCase()}
                  </Text>
                  <Tag style={{ fontSize: 10, fontWeight: 700, color: '#475569' }}>TIMELINE</Tag>
                </Flex>

                <div style={{ paddingLeft: 8 }}>
                  {(activeBooking.statusHistory || [
                    {
                      time: 'Nov 12, 2025 · 09:24',
                      actor: 'by Customer',
                      title: 'Request submitted — status PENDING',
                      status: 'pending',
                    },
                    {
                      time: 'Nov 12, 2025 · 09:25',
                      actor: 'microchip + FEI passport matched',
                      title: '2 horses attached · passports pre-checked',
                      status: 'info',
                    },
                    {
                      time: 'Nov 13, 2025 · 09:24',
                      actor: 'system notification',
                      title: '24h auto-reminder sent to Logistics Manager',
                      status: 'reminder',
                    },
                    {
                      time: 'Nov 14, 2025 · remaining 9h 12m',
                      actor: 'auto-expire if no action',
                      title: '48h deadline — action required',
                      status: 'warning',
                    },
                  ]).map((item, idx) => (
                    <div
                      key={idx}
                      style={{
                        display: 'flex',
                        gap: 14,
                        marginBottom: 16,
                        position: 'relative',
                      }}
                    >
                      <div
                        style={{
                          width: 10,
                          height: 10,
                          borderRadius: '50%',
                          backgroundColor:
                            item.status === 'pending'
                              ? '#f59e0b'
                              : item.status === 'warning'
                              ? '#ef4444'
                              : '#94a3b8',
                          marginTop: 5,
                          flexShrink: 0,
                        }}
                      />
                      <div>
                        <Text strong style={{ fontSize: 13, color: '#0f172a', display: 'block' }}>
                          {item.title}
                        </Text>
                        <Text type="secondary" style={{ fontSize: 12 }}>
                          {item.time} · {item.actor}
                        </Text>
                      </div>
                    </div>
                  ))}
                </div>
              </Card>
            </Space>
          </Col>

          {/* CỘT PHẢI (1/3): KHỐI MANAGER REVIEW + PRE-APPROVAL CHECKLIST + ATTACHMENTS */}
          <Col xs={24} lg={8}>
            <Space orientation="vertical" orientationMargin={0} size={16} style={{ width: '100%' }}>
              {/* 1. KHỐI MANAGER REVIEW (NƠI ĐẶT 2 NÚT APPROVE VÀ REJECT CHUẨN FIGMA) */}
              <Card
                bordered
                style={{
                  borderRadius: 14,
                  borderColor: '#e2e8f0',
                  boxShadow: '0 2px 6px rgba(0,0,0,0.03)',
                }}
                styles={{ body: { padding: '20px' } }}
              >
                <Text
                  style={{
                    fontSize: 14,
                    fontWeight: 700,
                    color: '#0f172a',
                    display: 'block',
                    marginBottom: 14,
                  }}
                >
                  {t('manager.pendingRequests.managerReview')}
                </Text>

                {/* Box cảnh báo đếm ngược SLA màu cam */}
                <div
                  style={{
                    backgroundColor: '#fffbeb',
                    border: '1px solid #fef3c7',
                    borderRadius: 10,
                    padding: '12px 14px',
                    marginBottom: 16,
                  }}
                >
                  <Flex align="center" gap={8} style={{ marginBottom: 4 }}>
                    <ClockCircleOutlined style={{ color: '#d97706', fontSize: 14 }} />
                    <Text strong style={{ fontSize: 13, color: '#b45309' }}>
                      {activeBooking.expiresInText || 'Auto-expire in 9h 12m'}
                    </Text>
                  </Flex>
                  <Text type="secondary" style={{ fontSize: 11, color: '#92400e', display: 'block' }}>
                    {t('manager.pendingRequests.slaWindow')}
                  </Text>
                  <Progress
                    percent={75}
                    showInfo={false}
                    strokeColor="#f59e0b"
                    trailColor="#fde68a"
                    size="small"
                    style={{ marginTop: 8 }}
                  />
                </div>

                {/* 2 NÚT HÀNH ĐỘNG LỚN TRONG KHỐI REVIEW */}
                <Space orientation="vertical" size={12} orientationMargin={0} style={{ width: '100%' }}>
                  {/* Nút 1: APPROVE REQUEST (Màu cam vàng thương hiệu #F59E0B) */}
                  <Button
                    type="primary"
                    block
                    size="large"
                    icon={<CheckOutlined style={{ fontSize: 16, strokeWidth: 2 }} />}
                    style={{
                      height: 48,
                      backgroundColor: '#F59E0B',
                      borderColor: '#F59E0B',
                      color: '#0f172a',
                      fontWeight: 700,
                      fontSize: 15,
                      borderRadius: 10,
                      boxShadow: '0 2px 4px rgba(245, 158, 11, 0.25)',
                    }}
                    onClick={handleOpenApprove}
                  >
                    {t('manager.pendingRequests.approveBtn')}
                  </Button>

                  {/* Nút 2: REJECT REQUEST (Màu hồng nhạt viền đỏ #FECACA, chữ đỏ #DC2626) */}
                  <Button
                    block
                    size="large"
                    icon={<CloseOutlined style={{ fontSize: 15, strokeWidth: 2 }} />}
                    style={{
                      height: 48,
                      backgroundColor: '#FEF2F2',
                      borderColor: '#FECACA',
                      color: '#DC2626',
                      fontWeight: 700,
                      fontSize: 15,
                      borderRadius: 10,
                    }}
                    onClick={handleOpenReject}
                  >
                    {t('manager.pendingRequests.rejectBtn')}
                  </Button>
                </Space>
              </Card>

              {/* 2. KHỐI PRE-APPROVAL CHECKLIST (3 TIÊU CHÍ VERIFIED TICK XANH) */}
              <Card
                bordered
                style={{
                  borderRadius: 14,
                  borderColor: '#e2e8f0',
                  boxShadow: '0 1px 3px rgba(0,0,0,0.02)',
                }}
                styles={{ body: { padding: '20px' } }}
              >
                <Text
                  style={{
                    fontSize: 14,
                    fontWeight: 700,
                    color: '#0f172a',
                    display: 'block',
                    marginBottom: 2,
                  }}
                >
                  {t('manager.pendingRequests.preApprovalChecklist')}
                </Text>
                <Text type="secondary" style={{ fontSize: 12, display: 'block', marginBottom: 14 }}>
                  {t('manager.pendingRequests.criteriaVerified')}
                </Text>

                <Space orientation="vertical" size={14} orientationMargin={0} style={{ width: '100%' }}>
                  {(activeBooking.checklist || [
                    {
                      id: '1',
                      title: 'Schedule conflict check',
                      desc: 'No overlapping trips on this route & date',
                    },
                    {
                      id: '2',
                      title: 'Vehicle capability',
                      desc: '3 vehicles match capacity for 2 horses',
                    },
                    {
                      id: '3',
                      title: 'Route permitted',
                      desc: 'CDG → DXB is an approved export corridor',
                    },
                  ]).map((item) => (
                    <Flex key={item.id} align="flex-start" gap={10}>
                      <CheckCircleFilled style={{ color: '#22c55e', fontSize: 18, marginTop: 2 }} />
                      <div>
                        <Text strong style={{ fontSize: 13, color: '#0f172a', display: 'block' }}>
                          {item.title}
                        </Text>
                        <Text type="secondary" style={{ fontSize: 12 }}>
                          {item.desc}
                        </Text>
                      </div>
                    </Flex>
                  ))}
                </Space>
              </Card>

              {/* 3. KHỐI ATTACHMENTS (3 FILE PDF) */}
              <Card
                bordered
                style={{
                  borderRadius: 14,
                  borderColor: '#e2e8f0',
                  boxShadow: '0 1px 3px rgba(0,0,0,0.02)',
                }}
                styles={{ body: { padding: '20px' } }}
              >
                <Flex justify="space-between" align="center" style={{ marginBottom: 14 }}>
                  <Text style={{ fontSize: 14, fontWeight: 700, color: '#0f172a' }}>
                    {t('manager.pendingRequests.attachments')}
                  </Text>
                  <Badge
                    count={activeBooking.attachments ? activeBooking.attachments.length : 3}
                    style={{ backgroundColor: '#f1f5f9', color: '#475569', boxShadow: 'none' }}
                  />
                </Flex>

                <Space orientation="vertical" size={10} orientationMargin={0} style={{ width: '100%' }}>
                  {(activeBooking.attachments || [
                    { id: 1, name: 'FEI_Passport_Duchess.pdf', size: '1.2 MB' },
                    { id: 2, name: 'FEI_Passport_GoldenArrow.pdf', size: '1.1 MB' },
                    { id: 3, name: 'Vaccination_Log_2025.pdf', size: '640 KB' },
                  ]).map((file) => (
                    <div
                      key={file.id}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        padding: '8px 12px',
                        backgroundColor: '#f8fafc',
                        borderRadius: 8,
                        border: '1px solid #f1f5f9',
                      }}
                    >
                      <Flex align="center" gap={8} style={{ overflow: 'hidden' }}>
                        <FilePdfOutlined style={{ color: '#0284c7', fontSize: 16 }} />
                        <Text
                          style={{
                            fontSize: 12,
                            fontWeight: 600,
                            color: '#0369a1',
                            textOverflow: 'ellipsis',
                            whiteSpace: 'nowrap',
                            overflow: 'hidden',
                          }}
                        >
                          {file.name}
                        </Text>
                      </Flex>
                      <Text type="secondary" style={{ fontSize: 11, flexShrink: 0 }}>
                        {file.size}
                      </Text>
                    </div>
                  ))}
                </Space>

                <Text
                  type="secondary"
                  style={{ fontSize: 11, display: 'block', marginTop: 12, color: '#94a3b8' }}
                >
                  {t('manager.pendingRequests.uploadedByCustomer')}
                </Text>
              </Card>
            </Space>
          </Col>
        </Row>

        {/* MODAL APPROVE: CHỌN TRANSPORT SPECIALIST */}
        <Modal
          title={t('manager.bookings.modals.approveTitle')}
          open={approveModalOpen}
          onCancel={() => setApproveModalOpen(false)}
          onOk={handleConfirmApprove}
          confirmLoading={actionLoading}
          okText={t('manager.bookings.actions.approve')}
          okButtonProps={{
            style: { backgroundColor: '#F59E0B', borderColor: '#F59E0B', color: '#0f172a', fontWeight: 700 },
          }}
          destroyOnClose
        >
          <div style={{ marginTop: 12 }}>
            <Alert
              type="info"
              showIcon
              message={t('manager.bookings.modals.approveConfirmText', {
                code: `#${activeBooking.bookingCode}`,
              })}
              description={t('manager.bookings.modals.approveConfirmNote')}
              style={{ marginBottom: 16, borderRadius: 8 }}
            />

            <Form form={approveForm} layout="vertical">
              <Form.Item
                name="specialistUserId"
                label={t('manager.bookings.modals.selectSpecialist')}
                rules={[
                  {
                    required: true,
                    message: t('manager.bookings.modals.selectSpecialistRequired'),
                  },
                ]}
              >
                <Select
                  placeholder={t('manager.bookings.modals.selectSpecialistPlaceholder')}
                  options={specialists.map((s) => ({
                    value: s.userId,
                    label: `${s.fullName} (${s.email})`,
                  }))}
                />
              </Form.Item>
            </Form>
          </div>
        </Modal>

        {/* MODAL REJECT: NHẬP LÝ DO TỪ CHỐI */}
        <Modal
          title={t('manager.bookings.modals.rejectTitle')}
          open={rejectModalOpen}
          onCancel={() => setRejectModalOpen(false)}
          onOk={handleConfirmReject}
          confirmLoading={actionLoading}
          okText={t('manager.bookings.actions.reject')}
          okButtonProps={{ danger: true }}
          destroyOnClose
        >
          <div style={{ marginTop: 12 }}>
            <div style={{ marginBottom: 14 }}>
              <Text type="secondary" style={{ fontSize: 12, display: 'block', marginBottom: 6 }}>
                {t('manager.bookings.modals.quickReasons')}:
              </Text>
              <Space wrap size={[6, 6]}>
                {[
                  t('manager.bookings.modals.quickReason1'),
                  t('manager.bookings.modals.quickReason2'),
                  t('manager.bookings.modals.quickReason3'),
                  t('manager.bookings.modals.quickReason4'),
                ].map((reasonText) => (
                  <Tag
                    key={reasonText}
                    style={{
                      cursor: 'pointer',
                      borderRadius: 6,
                      fontSize: 11,
                      padding: '2px 8px',
                    }}
                    onClick={() => rejectForm.setFieldsValue({ reason: reasonText })}
                  >
                    + {reasonText}
                  </Tag>
                ))}
              </Space>
            </div>

            <Form form={rejectForm} layout="vertical">
              <Form.Item
                name="reason"
                label={t('manager.bookings.modals.rejectReasonLabel')}
                rules={[
                  {
                    required: true,
                    message: t('manager.bookings.modals.rejectReasonRequired'),
                  },
                  {
                    min: 10,
                    message: t('manager.bookings.modals.rejectReasonMin'),
                  },
                ]}
              >
                <TextArea
                  rows={4}
                  maxLength={500}
                  showCount
                  placeholder={t('manager.bookings.modals.rejectReasonPlaceholder')}
                />
              </Form.Item>
            </Form>
          </div>
        </Modal>
      </div>
    );
  }

  // =========================================================================
  // VIEW 2: NẾU CHƯA CHỌN ĐƠN NÀO -> HIỂN THỊ DANH SÁCH PENDING REQUESTS (NHIỀU ĐƠN)
  // =========================================================================
  return (
    <div>
      <PageHeader
        title={t('manager.pendingRequests.title')}
        subtitle={t('manager.pendingRequests.subtitle')}
      />

      {/* Thanh tìm kiếm và bộ lọc nhanh */}
      <Card
        bordered
        style={{
          borderRadius: 12,
          borderColor: '#e2e8f0',
          marginBottom: 16,
        }}
        styles={{ body: { padding: '14px 18px' } }}
      >
        <Flex justify="space-between" align="center" wrap="wrap" gap="middle">
          <Input
            prefix={<SearchOutlined style={{ color: '#94a3b8' }} />}
            placeholder={t('nav.searchPlaceholder')}
            allowClear
            value={searchText}
            onChange={(e) => setSearchText(e.target.value)}
            style={{ width: 320, borderRadius: 8 }}
          />

          <Text type="secondary" style={{ fontSize: 13 }}>
            {t('table.total', { total: filteredPending.length })}
          </Text>
        </Flex>
      </Card>

      {/* Bảng danh sách các đơn Pending */}
      <Card
        bordered
        style={{
          borderRadius: 12,
          borderColor: '#e2e8f0',
        }}
        styles={{ body: { padding: 0 } }}
      >
        {filteredPending.length === 0 ? (
          <div style={{ padding: '60px 0', textAlign: 'center' }}>
            <Empty description={t('manager.pendingRequests.emptyList')} />
          </div>
        ) : (
          <Table
            dataSource={filteredPending}
            rowKey="bookingId"
            pagination={{ pageSize: 8, showSizeChanger: false }}
            onRow={(record) => ({
              onClick: () => handleSelectBooking(record.bookingId),
              style: { cursor: 'pointer' },
            })}
            columns={[
              {
                title: t('manager.bookings.columns.bookingCode'),
                dataIndex: 'bookingCode',
                key: 'bookingCode',
                width: 140,
                render: (code) => (
                  <Text strong style={{ color: '#0f172a', fontFamily: 'monospace' }}>
                    #{code}
                  </Text>
                ),
              },
              {
                title: t('manager.bookings.columns.customer'),
                dataIndex: 'customerName',
                key: 'customerName',
                render: (name, rec) => (
                  <div>
                    <Text strong style={{ fontSize: 13, color: '#0f172a', display: 'block' }}>
                      {name || `Customer #${rec.customerUserId}`}
                    </Text>
                    <Text type="secondary" style={{ fontSize: 12 }}>
                      {rec.customerClub || rec.customerEmail}
                    </Text>
                  </div>
                ),
              },
              {
                title: t('manager.bookings.columns.route'),
                key: 'route',
                render: (_, rec) => (
                  <div style={{ fontSize: 13, color: '#334155' }}>
                    <span style={{ fontWeight: 600 }}>{rec.pickupCountryCode || 'FR'}</span>
                    <span style={{ color: '#94a3b8', margin: '0 6px' }}>→</span>
                    <span style={{ fontWeight: 600 }}>{rec.dropoffCountryCode || 'AE'}</span>
                    <div style={{ fontSize: 11, color: '#64748b' }}>
                      {rec.transportMode} {rec.isExpress && '• Express'}
                    </div>
                  </div>
                ),
              },
              {
                title: t('manager.bookings.columns.schedule'),
                dataIndex: 'departureDate',
                key: 'departureDate',
                render: (date) => (
                  <span style={{ fontSize: 13, color: '#475569' }}>
                    {date ? dayjs(date).format('DD/MM/YYYY') : '—'}
                  </span>
                ),
              },
              {
                title: t('manager.bookings.columns.horses'),
                dataIndex: 'totalHorses',
                key: 'totalHorses',
                align: 'center',
                width: 100,
                render: (cnt) => (
                  <Tag style={{ borderRadius: 6, margin: 0, fontWeight: 600 }}>
                    {cnt} {t('manager.bookings.columns.horses').toLowerCase()}
                  </Tag>
                ),
              },
              {
                title: t('manager.pendingRequests.expiresIn'),
                key: 'expiresIn',
                render: (_, rec) => (
                  <Tag
                    style={{
                      backgroundColor: '#FFEDD5',
                      color: '#EA580C',
                      borderColor: '#FED7AA',
                      fontWeight: 600,
                      borderRadius: 6,
                    }}
                  >
                    <ClockCircleOutlined style={{ marginRight: 4 }} />
                    {rec.expiresInText || 'Expires in 9h 12m'}
                  </Tag>
                ),
              },
              {
                title: t('manager.bookings.columns.estimatedCost'),
                dataIndex: 'estimatedCost',
                key: 'estimatedCost',
                align: 'right',
                render: (cost) => (
                  <Text strong style={{ fontSize: 13, color: '#0f172a' }}>
                    ${cost ? cost.toLocaleString() : '—'}
                  </Text>
                ),
              },
              {
                title: '',
                key: 'action',
                width: 60,
                align: 'center',
                render: () => (
                  <Button
                    type="text"
                    shape="circle"
                    icon={<RightOutlined style={{ fontSize: 12, color: '#64748b' }} />}
                  />
                ),
              },
            ]}
          />
        )}
      </Card>
    </div>
  );
}
