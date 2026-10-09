import { useState, useEffect, useMemo, useCallback } from 'react';
import {
  Alert,
  Button,
  Card,
  Col,
  Descriptions,
  Empty,
  Flex,
  Form,
  Input,
  Modal,
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
  CheckOutlined,
  CloseOutlined,
  UserSwitchOutlined,
} from '@ant-design/icons';
import { useParams, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import dayjs from 'dayjs';
import StatusTag from '@components/common/StatusTag';
import bookingService from '@services/bookingService';
import userService from '@services/userService';
import { ROUTES } from '@routes/routes';
import { BOOKING_STATUS } from '@utils/constants';

const { Text, Title } = Typography;
const { TextArea } = Input;

/**
 * Trang chi tiết yêu cầu vận chuyển (Manager & Admin)
 * Tuyến đường dẫn: /manager/bookings/:id
 * Phục vụ rà soát thông số, kiểm tra báo giá, duyệt đơn và phân công Transport Specialist
 *
 * @returns {JSX.Element}
 */
export default function BookingDetailPage() {
  const { t } = useTranslation();
  const { id } = useParams();
  const navigate = useNavigate();

  const [booking, setBooking] = useState(null);
  const [specialists, setSpecialists] = useState([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);

  // Trạng thái các Modal
  const [approveModalOpen, setApproveModalOpen] = useState(false);
  const [rejectModalOpen, setRejectModalOpen] = useState(false);
  const [reassignModalOpen, setReassignModalOpen] = useState(false);

  const [approveForm] = Form.useForm();
  const [rejectForm] = Form.useForm();
  const [reassignForm] = Form.useForm();

  const handleRefresh = useCallback(() => {
    setRefreshKey((k) => k + 1);
  }, []);

  useEffect(() => {
    let active = true;

    const fetchData = async () => {
      setLoading(true);
      try {
        const [bookingRes, staffRes] = await Promise.all([
          bookingService.getBookingById(id),
          userService.getStaff('TransportSpecialist').catch(() => null),
        ]);
        if (active) {
          const bookingData = bookingRes?.data || bookingRes;
          setBooking(bookingData);

          const staffList = staffRes?.data?.data || staffRes?.data || [];
          setSpecialists(Array.isArray(staffList) ? staffList : []);
        }
      } catch {
        if (active) {
          message.error(t('manager.bookings.actions.notFound'));
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
  }, [id, t, refreshKey]);

  // Tìm tên chuyên viên từ specialist ID
  const specialistName = useMemo(() => {
    if (!booking?.assignedSpecialistId) return null;
    const found = specialists.find((s) => s.userId === Number(booking.assignedSpecialistId));
    return found ? found.fullName : `Specialist #${booking.assignedSpecialistId}`;
  }, [booking, specialists]);

  // Parse bảng chiết tính chi phí
  const quoteLines = useMemo(() => {
    if (!booking?.quoteBreakdown) return [];
    if (Array.isArray(booking.quoteBreakdown)) return booking.quoteBreakdown;
    try {
      const parsed = JSON.parse(booking.quoteBreakdown);
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      return [];
    }
  }, [booking]);

  // Định dạng tiền tệ
  const formatCost = (val, currency = 'USD') => {
    if (val == null) return '—';
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency || 'USD',
      maximumFractionDigits: 0,
    }).format(val);
  };

  // Mở modal Phê duyệt
  const handleOpenApprove = () => {
    approveForm.resetFields();
    if (specialists.length > 0) {
      approveForm.setFieldsValue({ specialistUserId: specialists[0].userId });
    }
    setApproveModalOpen(true);
  };

  // Xác nhận Phê duyệt
  const handleConfirmApprove = async () => {
    try {
      const values = await approveForm.validateFields();
      setActionLoading(true);
      await bookingService.approveBooking(booking.bookingId, {
        specialistUserId: values.specialistUserId,
      });
      message.success(t('manager.bookings.messages.approveSuccess'));
      setApproveModalOpen(false);
      handleRefresh();
    } catch (err) {
      if (err?.errorFields) return;
      message.error(t('manager.bookings.messages.actionFailed'));
    } finally {
      setActionLoading(false);
    }
  };

  // Mở modal Từ chối
  const handleOpenReject = () => {
    rejectForm.resetFields();
    setRejectModalOpen(true);
  };

  // Xác nhận Từ chối
  const handleConfirmReject = async () => {
    try {
      const values = await rejectForm.validateFields();
      setActionLoading(true);
      await bookingService.rejectBooking(booking.bookingId, {
        reason: values.reason,
      });
      message.success(t('manager.bookings.messages.rejectSuccess'));
      setRejectModalOpen(false);
      handleRefresh();
    } catch (err) {
      if (err?.errorFields) return;
      message.error(t('manager.bookings.messages.actionFailed'));
    } finally {
      setActionLoading(false);
    }
  };

  // Mở modal Phân công lại
  const handleOpenReassign = () => {
    reassignForm.resetFields();
    reassignForm.setFieldsValue({
      specialistUserId: booking.assignedSpecialistId || (specialists[0] && specialists[0].userId),
    });
    setReassignModalOpen(true);
  };

  // Xác nhận Phân công lại
  const handleConfirmReassign = async () => {
    try {
      const values = await reassignForm.validateFields();
      setActionLoading(true);
      await bookingService.reassignSpecialist(booking.bookingId, {
        specialistUserId: values.specialistUserId,
      });
      message.success(t('manager.bookings.messages.reassignSuccess'));
      setReassignModalOpen(false);
      handleRefresh();
    } catch (err) {
      if (err?.errorFields) return;
      message.error(t('manager.bookings.messages.actionFailed'));
    } finally {
      setActionLoading(false);
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

  if (!booking) {
    return (
      <Card style={{ borderRadius: 12, borderColor: '#e2e8f0', textAlign: 'center', padding: '60px 0' }}>
        <Empty description={t('manager.bookings.actions.notFound')} />
        <Button
          type="primary"
          style={{ marginTop: 16, backgroundColor: '#F59E0B', borderColor: '#F59E0B' }}
          onClick={() => navigate(ROUTES.MANAGER_BOOKINGS)}
        >
          {t('manager.bookings.actions.backToList')}
        </Button>
      </Card>
    );
  }

  const isSubmitted = booking.status === BOOKING_STATUS.SUBMITTED;
  const isApprovedOrAssigned =
    booking.status === BOOKING_STATUS.APPROVED || booking.status === BOOKING_STATUS.ASSIGNED;

  return (
    <div>
      {/* 1. THANH ĐIỀU HƯỚNG TRÊN CÙNG & TIÊU ĐỀ */}
      <div style={{ marginBottom: 20 }}>
        <Button
          type="text"
          icon={<ArrowLeftOutlined />}
          onClick={() => navigate(ROUTES.MANAGER_BOOKINGS)}
          style={{ paddingLeft: 0, color: '#64748b', marginBottom: 12 }}
        >
          {t('manager.bookings.actions.backToList')}
        </Button>

        <Flex justify="space-between" align="center" wrap="wrap" gap="middle">
          <div>
            <Flex align="center" gap="small">
              <Title level={3} style={{ margin: 0, color: '#0f172a', fontFamily: 'monospace' }}>
                #{booking.bookingCode}
              </Title>
              <StatusTag status={booking.status} />
            </Flex>
            <Text type="secondary" style={{ fontSize: 13, marginTop: 4, display: 'block' }}>
              {t('manager.bookings.filters.dateTypeCreated')}:{' '}
              {booking.createdAt ? dayjs(booking.createdAt).format('DD/MM/YYYY HH:mm') : '—'}
            </Text>
          </div>

          {/* Cụm nút hành động chính */}
          <Space size="middle">
            {isSubmitted && (
              <>
                <Button
                  icon={<CloseOutlined />}
                  style={{
                    backgroundColor: '#FEF2F2',
                    borderColor: '#FECACA',
                    color: '#DC2626',
                    fontWeight: 600,
                    borderRadius: 8,
                  }}
                  onClick={handleOpenReject}
                >
                  {t('manager.pendingRequests.rejectBtn')}
                </Button>
                <Button
                  type="primary"
                  icon={<CheckOutlined />}
                  style={{
                    backgroundColor: '#F59E0B',
                    borderColor: '#F59E0B',
                    color: '#0f172a',
                    fontWeight: 700,
                    borderRadius: 8,
                  }}
                  onClick={handleOpenApprove}
                >
                  {t('manager.pendingRequests.approveBtn')}
                </Button>
              </>
            )}

            {isApprovedOrAssigned && (
              <Button icon={<UserSwitchOutlined />} onClick={handleOpenReassign}>
                {t('manager.bookings.actions.reassign')}
              </Button>
            )}
          </Space>
        </Flex>
      </div>

      {/* Cảnh báo lý do từ chối nếu có */}
      {booking.status === BOOKING_STATUS.REJECTED && booking.rejectionReason && (
        <Alert
          type="error"
          showIcon
          message={t('manager.bookings.modals.rejectionReason')}
          description={booking.rejectionReason}
          style={{ marginBottom: 20, borderRadius: 10 }}
        />
      )}

      {/* 2. NỘI DUNG CHI TIẾT BỐ CỤC 2 CỘT GỌN GÀNG */}
      <Row gutter={[20, 20]}>
        {/* CỘT TRÁI (2/3): THÔNG TIN KHÁCH HÀNG, LỘ TRÌNH, DANH SÁCH NGỰA */}
        <Col xs={24} lg={16}>
          <Space orientation="vertical" size="middle" style={{ width: '100%' }}>
            {/* Khối Thông tin khách hàng & Lộ trình */}
            <Card
              title={
                <span style={{ fontSize: 15, fontWeight: 700, color: '#0f172a' }}>
                  {t('manager.bookings.modals.generalInfo')}
                </span>
              }
              bordered
              style={{ borderRadius: 12, borderColor: '#e2e8f0' }}
              styles={{ body: { padding: '16px 20px' } }}
            >
              <Descriptions size="small" column={{ xs: 1, sm: 2 }} bordered>
                <Descriptions.Item label={t('manager.bookings.modals.customerName')}>
                  <Text strong>{booking.customerName || `Customer #${booking.customerUserId}`}</Text>
                </Descriptions.Item>
                <Descriptions.Item label={t('manager.bookings.modals.customerPhone')}>
                  {booking.customerPhone || '—'}
                </Descriptions.Item>
                <Descriptions.Item label={t('manager.bookings.modals.customerEmail')} span={2}>
                  {booking.customerEmail || '—'}
                </Descriptions.Item>

                <Descriptions.Item label={t('manager.bookings.modals.pickup')} span={2}>
                  {booking.pickupAddress}{' '}
                  {booking.pickupCountryCode && <Tag style={{ margin: 0 }}>{booking.pickupCountryCode}</Tag>}
                </Descriptions.Item>
                <Descriptions.Item label={t('manager.bookings.modals.dropoff')} span={2}>
                  {booking.dropoffAddress}{' '}
                  {booking.dropoffCountryCode && <Tag style={{ margin: 0 }}>{booking.dropoffCountryCode}</Tag>}
                </Descriptions.Item>

                <Descriptions.Item label={t('manager.bookings.modals.departureDate')}>
                  {booking.departureDate ? dayjs(booking.departureDate).format('DD/MM/YYYY HH:mm') : '—'}
                </Descriptions.Item>
                <Descriptions.Item label={t('manager.bookings.modals.deliveryDate')}>
                  {booking.deliveryDate ? dayjs(booking.deliveryDate).format('DD/MM/YYYY HH:mm') : '—'}
                </Descriptions.Item>

                <Descriptions.Item label={t('manager.bookings.modals.transportMode')}>
                  {booking.transportMode}
                  {booking.isExpress && ` • ${t('manager.bookings.modals.express')}`}
                </Descriptions.Item>
                <Descriptions.Item label={t('manager.bookings.modals.distance')}>
                  {booking.distanceKm ? `${booking.distanceKm} km` : '—'}
                </Descriptions.Item>

                <Descriptions.Item label={t('manager.bookings.modals.climateControl')}>
                  {booking.requiresClimateControl
                    ? `${t('manager.bookings.modals.yes')} (18-22°C)`
                    : t('manager.bookings.modals.no')}
                </Descriptions.Item>
                <Descriptions.Item label={t('manager.bookings.modals.declaredValue')}>
                  {booking.declaredValue ? formatCost(booking.declaredValue, booking.currencyCode) : '—'}
                </Descriptions.Item>
              </Descriptions>

              {booking.specialInstructions && (
                <div style={{ marginTop: 14 }}>
                  <Text type="secondary" style={{ fontSize: 12, display: 'block', marginBottom: 4 }}>
                    {t('manager.bookings.modals.specialInstructions')}:
                  </Text>
                  <div
                    style={{
                      padding: '10px 14px',
                      backgroundColor: '#f8fafc',
                      borderRadius: 8,
                      border: '1px solid #e2e8f0',
                      fontSize: 13,
                      color: '#334155',
                    }}
                  >
                    {booking.specialInstructions}
                  </div>
                </div>
              )}
            </Card>

            {/* Khối Danh sách cá thể ngựa */}
            <Card
              title={
                <Flex justify="space-between" align="center">
                  <span style={{ fontSize: 15, fontWeight: 700, color: '#0f172a' }}>
                    {t('manager.bookings.modals.equineInfo')}
                  </span>
                  <Text type="secondary" style={{ fontSize: 13 }}>
                    {booking.totalHorses} {t('manager.bookings.columns.horses').toLowerCase()}
                  </Text>
                </Flex>
              }
              bordered
              style={{ borderRadius: 12, borderColor: '#e2e8f0' }}
              styles={{ body: { padding: '12px 16px' } }}
            >
              {Array.isArray(booking.horses) && booking.horses.length > 0 ? (
                <Table
                  size="small"
                  pagination={false}
                  dataSource={booking.horses}
                  rowKey={(h) => h.bookingHorseId || h.horseId || h.horseName}
                  columns={[
                    {
                      title: t('manager.bookings.modals.horseName'),
                      dataIndex: 'horseName',
                      key: 'horseName',
                      render: (name) => <Text strong>{name}</Text>,
                    },
                    {
                      title: t('manager.bookings.modals.microchip'),
                      dataIndex: 'microchipNumber',
                      key: 'microchip',
                      render: (chip) => <Text style={{ fontFamily: 'monospace' }}>{chip || '—'}</Text>,
                    },
                    {
                      title: t('manager.bookings.modals.breed'),
                      dataIndex: 'breed',
                      key: 'breed',
                      render: (b) => b || '—',
                    },
                    {
                      title: t('manager.bookings.modals.gender'),
                      dataIndex: 'gender',
                      key: 'gender',
                      render: (g) => g || '—',
                    },
                    {
                      title: t('manager.bookings.modals.stallClass'),
                      dataIndex: 'stallClass',
                      key: 'stallClass',
                      render: (sc) => <Tag style={{ margin: 0 }}>{sc || 'Shared'}</Tag>,
                    },
                    {
                      title: t('manager.bookings.modals.horseNotes'),
                      dataIndex: 'notes',
                      key: 'notes',
                      render: (notes) => notes || '—',
                    },
                  ]}
                />
              ) : (
                <div style={{ textAlign: 'center', padding: '24px 0' }}>
                  <Text type="secondary">
                    {t('manager.bookings.columns.horses')}: {booking.totalHorses}
                  </Text>
                </div>
              )}
            </Card>
          </Space>
        </Col>

        {/* CỘT PHẢI (1/3): CHIẾT TÍNH GIÁ & NHÂN SỰ PHỤ TRÁCH */}
        <Col xs={24} lg={8}>
          <Space orientation="vertical" size="middle" style={{ width: '100%' }}>
            {/* Khối Manager Review nếu là đơn đang chờ duyệt (Submitted) */}
            {isSubmitted && (
              <Card
                bordered
                style={{
                  borderRadius: 14,
                  borderColor: '#e2e8f0',
                  boxShadow: '0 2px 6px rgba(0,0,0,0.03)',
                }}
                styles={{ body: { padding: '18px 20px' } }}
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

                <Space orientation="vertical" size={12} style={{ width: '100%' }}>
                  <Button
                    type="primary"
                    block
                    size="large"
                    icon={<CheckOutlined style={{ fontWeight: 700 }} />}
                    style={{
                      height: 46,
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

                  <Button
                    block
                    size="large"
                    icon={<CloseOutlined style={{ fontWeight: 700 }} />}
                    style={{
                      height: 46,
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
            )}

            {/* Khối Báo giá dự toán */}
            <Card
              title={
                <span style={{ fontSize: 15, fontWeight: 700, color: '#0f172a' }}>
                  {t('manager.bookings.modals.quoteBreakdown')}
                </span>
              }
              bordered
              style={{ borderRadius: 12, borderColor: '#e2e8f0' }}
              styles={{ body: { padding: '16px' } }}
            >
              {quoteLines.length > 0 ? (
                <Table
                  size="small"
                  pagination={false}
                  dataSource={quoteLines}
                  rowKey={(row) => row.code || row.name}
                  columns={[
                    {
                      title: t('manager.bookings.modals.quoteItem'),
                      dataIndex: 'name',
                      key: 'name',
                      render: (name) => <span style={{ fontSize: 12 }}>{name}</span>,
                    },
                    {
                      title: t('manager.bookings.modals.quoteQty'),
                      dataIndex: 'qty',
                      key: 'qty',
                      align: 'center',
                      width: 50,
                      render: (q) => <span style={{ fontSize: 12 }}>{q}</span>,
                    },
                    {
                      title: t('manager.bookings.modals.quoteAmount'),
                      dataIndex: 'amount',
                      key: 'amount',
                      align: 'right',
                      width: 90,
                      render: (a) => (
                        <Text strong style={{ fontSize: 12 }}>
                          {formatCost(a, booking.currencyCode)}
                        </Text>
                      ),
                    },
                  ]}
                />
              ) : null}

              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  marginTop: 14,
                  padding: '12px 14px',
                  backgroundColor: '#f8fafc',
                  borderRadius: 8,
                  border: '1px solid #e2e8f0',
                }}
              >
                <span style={{ fontSize: 13, fontWeight: 600, color: '#475569' }}>
                  {t('manager.bookings.modals.totalEstimated')}
                </span>
                <span style={{ fontSize: 18, fontWeight: 800, color: '#0f172a' }}>
                  {formatCost(booking.estimatedCost, booking.currencyCode)}
                </span>
              </div>
            </Card>

            {/* Khối Nhân sự phụ trách */}
            <Card
              title={
                <span style={{ fontSize: 15, fontWeight: 700, color: '#0f172a' }}>
                  {t('manager.bookings.columns.specialist')}
                </span>
              }
              bordered
              style={{ borderRadius: 12, borderColor: '#e2e8f0' }}
              styles={{ body: { padding: '16px 20px' } }}
            >
              <div style={{ marginBottom: 12 }}>
                <Text type="secondary" style={{ fontSize: 12, display: 'block' }}>
                  Transport Specialist:
                </Text>
                <Text strong style={{ fontSize: 14, color: '#0f172a' }}>
                  {specialistName || t('manager.bookings.unassigned')}
                </Text>
              </div>

              {booking.reviewedAt && (
                <div>
                  <Text type="secondary" style={{ fontSize: 12, display: 'block' }}>
                    {t('manager.bookings.columns.status')}:
                  </Text>
                  <Text style={{ fontSize: 13, color: '#475569' }}>
                    {dayjs(booking.reviewedAt).format('DD/MM/YYYY HH:mm')}
                  </Text>
                </div>
              )}
            </Card>
          </Space>
        </Col>
      </Row>

      {/* KHỐI HÀNH ĐỘNG DƯỚI CÙNG DÀNH CHO ĐƠN CHỜ DUYỆT (PENDING) */}
      {isSubmitted && (
        <Card
          bordered
          style={{
            marginTop: 20,
            borderRadius: 12,
            borderColor: '#e2e8f0',
            backgroundColor: '#ffffff',
          }}
          styles={{ body: { padding: '16px 20px' } }}
        >
          <Flex justify="space-between" align="center" wrap="wrap" gap="middle">
            <div>
              <Text strong style={{ fontSize: 14, color: '#0f172a', display: 'block' }}>
                {t('manager.bookings.modals.pendingRequestBadge')}
              </Text>
              <Text type="secondary" style={{ fontSize: 13 }}>
                {t('manager.bookings.modals.approveConfirmNote')}
              </Text>
            </div>
            <Space size="middle">
              <Button
                icon={<CloseOutlined />}
                style={{
                  backgroundColor: '#FEF2F2',
                  borderColor: '#FECACA',
                  color: '#DC2626',
                  fontWeight: 600,
                  borderRadius: 8,
                }}
                onClick={handleOpenReject}
              >
                {t('manager.pendingRequests.rejectBtn')}
              </Button>
              <Button
                type="primary"
                icon={<CheckOutlined />}
                style={{
                  backgroundColor: '#F59E0B',
                  borderColor: '#F59E0B',
                  color: '#0f172a',
                  fontWeight: 700,
                  borderRadius: 8,
                }}
                onClick={handleOpenApprove}
              >
                {t('manager.pendingRequests.approveBtn')}
              </Button>
            </Space>
          </Flex>
        </Card>
      )}

      {/* MODAL 1: PHÊ DUYỆT ĐƠN & GÁN CHUYÊN VIÊN */}
      <Modal
        title={t('manager.bookings.modals.approveTitle')}
        open={approveModalOpen}
        onCancel={() => setApproveModalOpen(false)}
        onOk={handleConfirmApprove}
        confirmLoading={actionLoading}
        okText={t('manager.bookings.actions.approve')}
        okButtonProps={{ style: { backgroundColor: '#F59E0B', borderColor: '#F59E0B' } }}
        destroyOnClose
      >
        <div style={{ marginTop: 12 }}>
          <Alert
            type="info"
            showIcon
            message={t('manager.bookings.modals.approveConfirmText', {
              code: `#${booking.bookingCode}`,
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

      {/* MODAL 2: TỪ CHỐI ĐƠN KÈM GỢI Ý LÝ DO NHANH */}
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

      {/* MODAL 3: PHÂN CÔNG LẠI CHUYÊN VIÊN PHỤ TRÁCH */}
      <Modal
        title={t('manager.bookings.modals.reassignTitle')}
        open={reassignModalOpen}
        onCancel={() => setReassignModalOpen(false)}
        onOk={handleConfirmReassign}
        confirmLoading={actionLoading}
        okText={t('common.confirm')}
        destroyOnClose
      >
        <div style={{ marginTop: 12 }}>
          <div
            style={{
              marginBottom: 16,
              padding: '10px 14px',
              backgroundColor: '#f8fafc',
              borderRadius: 8,
              border: '1px solid #e2e8f0',
            }}
          >
            <Text type="secondary" style={{ fontSize: 13 }}>
              {t('manager.bookings.modals.currentSpecialist')}:{' '}
            </Text>
            <Text strong style={{ fontSize: 13, color: '#0f172a' }}>
              {specialistName || t('manager.bookings.unassigned')}
            </Text>
          </div>

          <Form form={reassignForm} layout="vertical">
            <Form.Item
              name="specialistUserId"
              label={t('manager.bookings.modals.newSpecialist')}
              rules={[
                {
                  required: true,
                  message: t('manager.bookings.modals.selectSpecialistRequired'),
                },
              ]}
            >
              <Select
                placeholder={t('manager.bookings.modals.selectSpecialistPlaceholder')}
                options={specialists
                  .filter((s) => s.userId !== Number(booking.assignedSpecialistId))
                  .map((s) => ({
                    value: s.userId,
                    label: `${s.fullName} (${s.email})`,
                  }))}
              />
            </Form.Item>
          </Form>
        </div>
      </Modal>
    </div>
  );
}
