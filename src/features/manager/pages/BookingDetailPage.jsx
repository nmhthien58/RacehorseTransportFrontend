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
import { formatDeliveryDeadline, formatPickupWindow } from '@utils/bookingSchedule';
import { formatCountryRoute, getTransitCountryCodes } from '@utils/bookingRoute';
import { TRANSIT_COUNTRY_OPTIONS } from '@features/customer/constants/bookingOptions';
import StatusTag from '@components/common/StatusTag';
import BookingPaymentPanel from '@components/common/BookingPaymentPanel';
// Đang sửa BookingDetailPage (manager) vì nhân sự cần xem / tải hợp đồng hiện hành của đơn (FE-17)
import BookingContractCard from '@components/common/BookingContractCard';
import bookingService from '@services/bookingService';
import userService from '@services/userService';
import { ROUTES } from '@routes/routes';
import { BOOKING_STATUS } from '@utils/constants';
import { unwrapData, unwrapList, getErrorMessage } from '@utils/apiHelpers';
import RejectBookingModal from '@features/manager/components/RejectBookingModal';
import ApproveBookingModal from '@features/manager/components/ApproveBookingModal';
import BookingDecisionButtons from '@features/manager/components/BookingDecisionButtons';

const { Text, Title } = Typography;

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
  // Bản nháp danh sách nước quá cảnh Manager đang sửa (null = chưa sửa, dùng giá trị của đơn)
  const [transitDraft, setTransitDraft] = useState(null);

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
          setBooking(unwrapData(bookingRes));
          setSpecialists(unwrapList(staffRes));
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

    void fetchData().catch(console.error);

    return () => {
      active = false;
    };
  }, [id, t, refreshKey]);

  // Tên chuyên viên: backend trả sẵn assignedSpecialistName
  const specialistName = useMemo(() => {
    if (booking?.assignedSpecialistName) return booking.assignedSpecialistName;
    if (!booking?.assignedSpecialistId) return null;
    const found = specialists.find((s) => s.userId === Number(booking.assignedSpecialistId));
    return found ? found.fullName : `Specialist #${booking.assignedSpecialistId}`;
  }, [booking, specialists]);

  // Parse bảng chiết tính chi phí
  const quoteLines = useMemo(() => {
    // GET /bookings/{id} trả quoteLines[] (code, name, quantity, unitPrice, amount)
    if (Array.isArray(booking?.quoteLines)) return booking.quoteLines;
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
    setApproveModalOpen(true);
  };

  // Xác nhận Phê duyệt
  const handleConfirmApprove = async (values) => {
    try {
      setActionLoading(true);
      await bookingService.approveBooking(booking.bookingId, {
        specialistUserId: values.specialistUserId,
      });
      message.success(t('manager.bookings.messages.approveSuccess'));
      setApproveModalOpen(false);
      handleRefresh();
    } catch (err) {
      message.error(getErrorMessage(err, t('manager.bookings.messages.actionFailed')));
    } finally {
      setActionLoading(false);
    }
  };

  // Lưu nước quá cảnh: backend tính lại báo giá rồi báo cho khách
  const handleSaveTransit = async () => {
    try {
      setActionLoading(true);
      await bookingService.updateTransitCountries(booking.bookingId, transitDraft || []);
      message.success(t('bookings.transit.saved'));
      setTransitDraft(null);
      handleRefresh();
    } catch (err) {
      message.error(getErrorMessage(err, t('manager.bookings.messages.actionFailed')));
    } finally {
      setActionLoading(false);
    }
  };

  // Mở modal Từ chối
  const handleOpenReject = () => {
    setRejectModalOpen(true);
  };

  // Xác nhận Từ chối
  const handleConfirmReject = async (reason) => {
    try {
      setActionLoading(true);
      await bookingService.rejectBooking(booking.bookingId, {
        reason,
      });
      message.success(t('manager.bookings.messages.rejectSuccess'));
      setRejectModalOpen(false);
      handleRefresh();
    } catch (err) {
      message.error(getErrorMessage(err, t('manager.bookings.messages.actionFailed')));
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
      message.error(getErrorMessage(err, t('manager.bookings.messages.actionFailed')));
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
  // Đổi Specialist được cả khi đơn đang chờ khách đặt cọc
  const isApprovedOrAssigned = [
    BOOKING_STATUS.AWAITING_DEPOSIT,
    BOOKING_STATUS.APPROVED,
    BOOKING_STATUS.ASSIGNED,
  ].includes(booking.status);

  return (
    <div>
      {/* 1. THANH ĐIỀU HƯỚNG TRÊN CÙNG & TIÊU ĐỀ */}
      <div style={{ marginBottom: 20 }}>
        <Button
          type="text"
          icon={<ArrowLeftOutlined />}
          onClick={() => {
            if (window.history.length > 1) {
              navigate(-1);
            } else {
              navigate(ROUTES.MANAGER_DASHBOARD);
            }
          }}
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

                <Descriptions.Item label={t('bookings.fields.route')} span={2}>
                  {formatCountryRoute(booking)}
                </Descriptions.Item>

                <Descriptions.Item label={t('manager.bookings.modals.departureDate')}>
                  {formatPickupWindow(booking)}
                </Descriptions.Item>
                <Descriptions.Item label={t('manager.bookings.modals.deliveryDate')}>
                  {formatDeliveryDeadline(booking)}
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
                      title: t('manager.bookings.modals.dossier'),
                      dataIndex: 'dossierCode',
                      key: 'dossier',
                      render: (code, h) =>
                        code ? (
                          <Space size={4}>
                            <Text style={{ fontFamily: 'monospace', fontSize: 12 }}>{code}</Text>
                            <Tag style={{ margin: 0 }}>{h.dossierStatus}</Tag>
                          </Space>
                        ) : (
                          '—'
                        ),
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

                <BookingDecisionButtons
                  onApprove={handleOpenApprove}
                  onReject={handleOpenReject}
                />
              </Card>
            )}

            {/* Xác nhận / sửa nước quá cảnh trước khi duyệt (R-03) */}
            {isSubmitted && (
              <Card
                title={
                  <span style={{ fontSize: 15, fontWeight: 700, color: '#0f172a' }}>
                    {t('bookings.transit.editTitle')}
                  </span>
                }
                style={{ borderRadius: 14 }}
              >
                <Text type="secondary" style={{ fontSize: 12.5, display: 'block', marginBottom: 10 }}>
                  {t('bookings.transit.editHint')}
                </Text>
                <Select
                  mode="multiple"
                  allowClear
                  optionFilterProp="label"
                  style={{ width: '100%', marginBottom: 12 }}
                  value={transitDraft ?? getTransitCountryCodes(booking)}
                  onChange={(codes) => setTransitDraft(codes)}
                  placeholder={t('bookings.transit.placeholder')}
                  options={TRANSIT_COUNTRY_OPTIONS.filter(
                    (c) => c.code !== booking.pickupCountryCode && c.code !== booking.dropoffCountryCode,
                  ).map((c) => ({ value: c.code, label: `${c.name} (${c.code})` }))}
                />
                <Button
                  type="primary"
                  block
                  loading={actionLoading}
                  disabled={transitDraft === null}
                  onClick={handleSaveTransit}
                >
                  {t('bookings.transit.save')}
                </Button>
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
                      dataIndex: 'quantity',
                      key: 'quantity',
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
                  Nhân sự phụ trách chuyến
                </span>
              }
              bordered
              style={{ borderRadius: 12, borderColor: '#e2e8f0' }}
              styles={{ body: { padding: '16px 20px' } }}
            >
              <div style={{ marginBottom: 12 }}>
                <Text type="secondary" style={{ fontSize: 12, display: 'block' }}>
                  🩺 Transport Specialist (Kiểm dịch & hồ sơ):
                </Text>
                <Text strong style={{ fontSize: 14, color: '#0f172a' }}>
                  {specialistName || t('manager.bookings.unassigned')}
                </Text>
              </div>

              {booking.reviewedAt && (
                <div>
                  <Text type="secondary" style={{ fontSize: 12, display: 'block' }}>
                    Thời gian duyệt:
                  </Text>
                  <Text style={{ fontSize: 13, color: '#475569' }}>
                    {dayjs(booking.reviewedAt).format('DD/MM/YYYY HH:mm')}
                  </Text>
                </div>
              )}
            </Card>
          </Space>
        </Col>
        <Col span={24}>
          <BookingPaymentPanel
            bookingId={booking.bookingId}
            bookingStatus={booking.status}
            mode="manager"
            onChanged={handleRefresh}
          />
        </Col>
        <Col span={24}>
          <BookingContractCard bookingId={booking.bookingId} bookingStatus={booking.status} mode="staff" />
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

      {/* MODAL 1: PHÊ DUYỆT ĐƠN & GÁN CHUYÊN VIÊN (Dùng chung) */}
      <ApproveBookingModal
        open={approveModalOpen}
        bookingCode={booking.bookingCode}
        specialists={specialists}
        confirmLoading={actionLoading}
        onConfirm={handleConfirmApprove}
        onCancel={() => setApproveModalOpen(false)}
      />

      {/* MODAL 2: TỪ CHỐI ĐƠN (Dùng chung) */}
      <RejectBookingModal
        open={rejectModalOpen}
        onCancel={() => setRejectModalOpen(false)}
        onConfirm={handleConfirmReject}
        confirmLoading={actionLoading}
      />

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
