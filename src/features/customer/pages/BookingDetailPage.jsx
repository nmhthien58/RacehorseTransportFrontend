import { useEffect, useMemo, useState } from 'react';
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
  Segmented,
  Space,
  Spin,
  Table,
  Tabs,
  Tag,
  Tooltip,
  Typography,
  message,
} from 'antd';
import {
  ArrowLeftOutlined,
  CarOutlined,
  CheckCircleOutlined,
  ClockCircleOutlined,
  DollarOutlined,
  EditOutlined,
  EnvironmentOutlined,
  FileProtectOutlined,
} from '@ant-design/icons';
import { useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import dayjs from 'dayjs';
import { formatDeliveryDeadline, formatPickupWindow } from '@utils/bookingSchedule';
import { formatCountryRoute } from '@utils/bookingRoute';
import PageHeader from '@components/layout/PageHeader';
import StatusTag from '@components/common/StatusTag';
import CustomerStageTag from '@components/common/CustomerStageTag';
import BookingPaymentPanel from '@components/common/BookingPaymentPanel';
import CustomerDossierPanel from '@features/customer/components/CustomerDossierPanel';
import OrderTimeline from '@features/customer/components/OrderTimeline';
import TripJourney from '@features/customer/components/TripJourney';
import RecipientForm from '@components/common/RecipientForm';
import { useBookingJourney } from '@features/customer/hooks/useBookingJourney';
import bookingService from '@services/bookingService';
import { unwrapData, getErrorMessage } from '@utils/apiHelpers';
import { ROUTES } from '@routes/routes';

const { Text, Title } = Typography;
const INACTIVE_BOOKING_STATUSES = ['Rejected', 'Cancelled', 'Expired'];
// Backend chỉ có dữ liệu hành trình cho đơn đã cọc trở đi
const JOURNEY_STATUSES = ['Approved', 'Assigned', 'AwaitingFinalPayment', 'Completed'];
// Backend giữ kết quả theo dõi 30 giây, làm mới cùng nhịp
const JOURNEY_POLL_MS = 30000;

/**
 * Trang chi tiết yêu cầu vận chuyển, bao gồm theo dõi, người nhận và bổ sung hồ sơ từng ngựa.
 * @returns {JSX.Element}
 */
export default function CustomerBookingDetailPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { id } = useParams();
  const [searchParams, setSearchParams] = useSearchParams();
  const [booking, setBooking] = useState(null);
  const [loading, setLoading] = useState(true);
  const [reloadKey, setReloadKey] = useState(0);

  // State cho khối Người nhận (FE-13 / R-16)
  const [editRecipientOpen, setEditRecipientOpen] = useState(false);
  const [savingRecipient, setSavingRecipient] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);
  const [recipientForm] = Form.useForm();

  useEffect(() => {
    let active = true;
    bookingService
      .getBookingById(id)
      .then((res) => {
        if (active) setBooking(unwrapData(res));
      })
      .catch((err) => {
        if (active) message.error(getErrorMessage(err, t('bookings.detailPage.loadFailed')));
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => {
      active = false;
    };
  }, [id, t, reloadKey]);

  const status = booking?.status || booking?.Status;
  const bookingId = booking?.bookingId || booking?.BookingID || id;
  const bookingCode = booking?.bookingCode || booking?.BookingCode || id;
  const horses = booking?.horses || booking?.Horses || [];
  const quoteLines = booking?.quoteLines || booking?.QuoteLines || [];
  const activeTab = ['journey', 'documents', 'payment'].includes(searchParams.get('tab')) ? searchParams.get('tab') : 'overview';

  // Hành trình (R-07): thay cho màn "Theo dõi chuyến" riêng; chỉ tự làm mới khi đang mở tab này
  const journey = useBookingJourney(booking ? bookingId : null, {
    enabled: JOURNEY_STATUSES.includes(status),
    pollMs: activeTab === 'journey' ? JOURNEY_POLL_MS : 0,
  });
  const [selectedTripId, setSelectedTripId] = useState(null);
  const shownTrip = journey.trips.find((tr) => tr.tripId === selectedTripId) || journey.trips[0];

  // R-16: Khóa nút sửa người nhận khi xe đã tới điểm trả
  const isDropoffArrived = useMemo(() => {
    if (['Completed', 'AwaitingHandover'].includes(status)) return true;
    for (const tr of journey.trips || []) {
      const dropCp = (tr.checkpoints || []).find(
        (c) => c.checkpointId === booking?.dropoffCheckpointId || c.locationType === 'DropOff',
      );
      if (dropCp && ['Arrived', 'Cleared', 'Departed'].includes(dropCp.status)) {
        return true;
      }
    }
    return false;
  }, [status, journey.trips, booking?.dropoffCheckpointId]);

  // R-16: Hiện thẻ xác nhận người nhận sẽ có mặt khi tới hạn hoặc đơn đang vận chuyển
  const showConfirmPresence = useMemo(() => {
    if (!booking) return false;
    if (booking.recipientConfirmedAt || booking.RecipientConfirmedAt) return false;
    if (INACTIVE_BOOKING_STATUSES.includes(status) || status === 'Completed') return false;
    return Boolean(
      booking.recipientNotifiedWindowStart ||
        booking.RecipientNotifiedWindowStart ||
        ['InTransit', 'AwaitingHandover'].includes(status),
    );
  }, [booking, status]);

  // R-16: Hiện thẻ đồng ý cho người khác nhận thay khi tài xế báo trên e-POD
  const showAlternateApproval = useMemo(() => {
    const altName = booking?.alternateRecipientName || booking?.AlternateRecipientName;
    const approvedAt = booking?.alternateRecipientApprovedAt || booking?.AlternateRecipientApprovedAt;
    return Boolean(altName && !approvedAt);
  }, [booking]);

  const handleConfirmPresence = async () => {
    setActionLoading(true);
    try {
      await bookingService.confirmRecipient(bookingId);
      message.success(t('recipient.confirmSuccess'));
      setReloadKey((k) => k + 1);
    } catch (err) {
      message.error(getErrorMessage(err, 'Không thể xác nhận có mặt'));
    } finally {
      setActionLoading(false);
    }
  };

  const handleApproveAlternate = async () => {
    setActionLoading(true);
    try {
      await bookingService.approveAlternateRecipient(bookingId);
      message.success(t('recipient.updateSuccess'));
      setReloadKey((k) => k + 1);
    } catch (err) {
      message.error(getErrorMessage(err, 'Không thể duyệt người nhận thay'));
    } finally {
      setActionLoading(false);
    }
  };

  const handleSaveRecipient = async () => {
    let values;
    try {
      values = await recipientForm.validateFields();
    } catch {
      return;
    }
    setSavingRecipient(true);
    try {
      await bookingService.updateRecipient(bookingId, {
        recipientName: values.recipientName.trim(),
        recipientPhone: values.recipientPhone.trim(),
        recipientEmail: values.recipientEmail?.trim() || null,
        recipientIdNumber: values.recipientIdNumber?.trim() || null,
        recipientIsCustomer: Boolean(values.recipientIsCustomer),
      });
      message.success(t('recipient.updateSuccess'));
      setEditRecipientOpen(false);
      setReloadKey((k) => k + 1);
    } catch (err) {
      message.error(getErrorMessage(err, 'Cập nhật người nhận thất bại'));
    } finally {
      setSavingRecipient(false);
    }
  };

  const horseColumns = useMemo(
    () => [
      {
        title: t('bookings.detailPage.horseName'),
        dataIndex: 'horseName',
        key: 'horseName',
        render: (value, record) => <Text strong>{value || record.HorseName}</Text>,
      },
      {
        title: t('bookings.detailPage.microchip'),
        dataIndex: 'microchipNumber',
        key: 'microchipNumber',
        render: (value, record) => value || record.MicrochipNumber || '—',
      },
      {
        title: t('bookings.stallClass'),
        dataIndex: 'stallClass',
        key: 'stallClass',
        render: (value, record) => <Tag>{value || record.StallClass}</Tag>,
      },
      {
        title: t('bookings.detailPage.dossier'),
        dataIndex: 'dossierStatus',
        key: 'dossierStatus',
        render: (value, record) => {
          const dossierStatus = value || record.DossierStatus;
          return dossierStatus ? (
            <Tag color={dossierStatus === 'Cleared' ? 'green' : 'blue'}>
              {t(`customerDossier.status.${dossierStatus}`, dossierStatus)}
            </Tag>
          ) : (
            <Tag>{t('bookings.detailPage.notCreated')}</Tag>
          );
        },
      },
    ],
    [t],
  );

  const quoteColumns = useMemo(
    () => [
      {
        title: t('bookings.detailPage.quoteItem'),
        dataIndex: 'name',
        key: 'name',
        render: (value, record) => value || record.Name,
      },
      {
        title: t('bookings.detailPage.quantity'),
        dataIndex: 'quantity',
        key: 'quantity',
        align: 'center',
        render: (value, record) => value ?? record.Quantity,
      },
      {
        title: t('bookings.detailPage.amount'),
        dataIndex: 'amount',
        key: 'amount',
        align: 'right',
        render: (value, record) =>
          `${Number(value ?? record.Amount ?? 0).toLocaleString()} ${booking?.currencyCode || booking?.CurrencyCode || 'USD'}`,
      },
    ],
    [booking, t],
  );

  const handleTabChange = (tab) => {
    setSearchParams(tab === 'overview' ? {} : { tab });
  };

  if (loading) {
    return (
      <div style={{ textAlign: 'center', padding: 64 }}>
        <Spin size="large" />
      </div>
    );
  }

  if (!booking) {
    return (
      <Card>
        <Empty
          description={t('bookings.detailPage.notFound')}
          image={Empty.PRESENTED_IMAGE_SIMPLE}
        >
          <Button onClick={() => navigate(ROUTES.CUSTOMER_BOOKINGS)}>
            {t('bookings.detailPage.back')}
          </Button>
        </Empty>
      </Card>
    );
  }

  const arrivalWindowText = (() => {
    const start = booking.recipientNotifiedWindowStart || booking.RecipientNotifiedWindowStart;
    const end = booking.recipientNotifiedWindowEnd || booking.RecipientNotifiedWindowEnd;
    if (start && end) {
      return `${dayjs(start).format('DD/MM/YYYY HH:mm')} — ${dayjs(end).format('HH:mm')}`;
    }
    return formatDeliveryDeadline(booking);
  })();

  const overviewContent = (
    <div>
      {/* Banner duyệt người nhận thay (R-16) */}
      {showAlternateApproval && (
        <Alert
          type="warning"
          showIcon
          style={{ marginBottom: 20 }}
          message={t('recipient.alternateAlertTitle')}
          description={
            <Space direction="vertical" style={{ width: '100%', marginTop: 6 }}>
              <div>
                {t('recipient.alternateAlertDesc', {
                  name: booking.alternateRecipientName || booking.AlternateRecipientName,
                  phone: booking.alternateRecipientPhone || booking.AlternateRecipientPhone || '—',
                })}
              </div>
              <Space>
                <Button
                  type="primary"
                  size="small"
                  loading={actionLoading}
                  onClick={handleApproveAlternate}
                >
                  {t('recipient.approveAlternateButton')}
                </Button>
              </Space>
            </Space>
          }
        />
      )}

      {/* Banner xác nhận người nhận sẽ có mặt (R-16) */}
      {showConfirmPresence && (
        <Alert
          type="info"
          showIcon
          style={{ marginBottom: 20 }}
          message={t('recipient.confirmPresenceCardTitle')}
          description={
            <Space direction="vertical" style={{ width: '100%', marginTop: 6 }}>
              <div>
                {t('recipient.confirmPresenceCardDesc', {
                  window: arrivalWindowText,
                })}
              </div>
              <Space wrap>
                <Button
                  type="primary"
                  size="small"
                  loading={actionLoading}
                  onClick={handleConfirmPresence}
                >
                  {t('recipient.confirmPresenceButton')}
                </Button>
                <Button
                  size="small"
                  disabled={isDropoffArrived}
                  onClick={() => {
                    recipientForm.setFieldsValue({
                      recipientIsCustomer: Boolean(booking.recipientIsCustomer ?? booking.RecipientIsCustomer),
                      recipientName: booking.recipientName || booking.RecipientName || '',
                      recipientPhone: booking.recipientPhone || booking.RecipientPhone || '',
                      recipientEmail: booking.recipientEmail || booking.RecipientEmail || '',
                      recipientIdNumber: booking.recipientIdNumber || booking.RecipientIdNumber || '',
                    });
                    setEditRecipientOpen(true);
                  }}
                >
                  {t('recipient.changeRecipientButton')}
                </Button>
              </Space>
            </Space>
          }
        />
      )}

      <Row gutter={[20, 20]}>
        <Col xs={24} xl={8}>
          <Card title={t('customerOrders.timeline.title')} style={{ height: '100%' }}>
            <OrderTimeline booking={booking} />
          </Card>
        </Col>
        <Col xs={24} xl={16}>
          <Row gutter={[20, 20]}>
            <Col span={24}>
              <Card title={t('bookings.detailPage.routeInfo')} style={{ height: '100%' }}>
                <Descriptions column={{ xs: 1, sm: 2 }} size="small">
                  <Descriptions.Item label={t('bookings.fields.pickupLocation')} span={2}>
                    <EnvironmentOutlined style={{ color: '#d97706', marginRight: 6 }} />
                    {booking.pickupAddress || booking.PickupAddress}
                  </Descriptions.Item>
                  <Descriptions.Item label={t('bookings.fields.deliveryLocation')} span={2}>
                    <EnvironmentOutlined style={{ color: '#10b981', marginRight: 6 }} />
                    {booking.dropoffAddress || booking.DropoffAddress}
                  </Descriptions.Item>
                  <Descriptions.Item label={t('bookings.fields.route')} span={2}>
                    {formatCountryRoute(booking)}
                  </Descriptions.Item>
                  <Descriptions.Item label={t('bookings.fields.pickupWindow')}>
                    {formatPickupWindow(booking)}
                  </Descriptions.Item>
                  <Descriptions.Item label={t('bookings.fields.deliveryDeadline')}>
                    {formatDeliveryDeadline(booking)}
                  </Descriptions.Item>
                </Descriptions>
              </Card>
            </Col>

            {/* Khối Người nhận (FE-13 / R-16) */}
            <Col span={24}>
              <Card
                title={t('recipient.title')}
                style={{ height: '100%' }}
                extra={
                  <Tooltip title={isDropoffArrived ? t('recipient.lockedHint') : ''}>
                    <Button
                      type="link"
                      icon={<EditOutlined />}
                      disabled={isDropoffArrived}
                      onClick={() => {
                        recipientForm.setFieldsValue({
                          recipientIsCustomer: Boolean(
                            booking.recipientIsCustomer ?? booking.RecipientIsCustomer,
                          ),
                          recipientName: booking.recipientName || booking.RecipientName || '',
                          recipientPhone: booking.recipientPhone || booking.RecipientPhone || '',
                          recipientEmail: booking.recipientEmail || booking.RecipientEmail || '',
                          recipientIdNumber:
                            booking.recipientIdNumber || booking.RecipientIdNumber || '',
                        });
                        setEditRecipientOpen(true);
                      }}
                    >
                      {t('recipient.edit')}
                    </Button>
                  </Tooltip>
                }
              >
                <Descriptions column={{ xs: 1, sm: 2 }} size="small">
                  <Descriptions.Item label={t('recipient.name')}>
                    <Space>
                      <Text strong>
                        {booking.recipientName ||
                          booking.RecipientName ||
                          booking.customerName ||
                          '—'}
                      </Text>
                      {Boolean(booking.recipientIsCustomer ?? booking.RecipientIsCustomer) && (
                        <Tag color="blue">{t('recipient.isCustomer')}</Tag>
                      )}
                    </Space>
                  </Descriptions.Item>
                  <Descriptions.Item label={t('recipient.phone')}>
                    {booking.recipientPhone ||
                      booking.RecipientPhone ||
                      booking.customerPhone ||
                      '—'}
                  </Descriptions.Item>
                  <Descriptions.Item label={t('recipient.email')}>
                    {booking.recipientEmail ||
                      booking.RecipientEmail ||
                      booking.customerEmail ||
                      '—'}
                  </Descriptions.Item>
                  <Descriptions.Item label={t('recipient.idNumber')}>
                    {booking.recipientIdNumber || booking.RecipientIdNumber || '—'}
                  </Descriptions.Item>
                  <Descriptions.Item label={t('recipient.statusLabel', 'Trạng thái có mặt')} span={2}>
                    {booking.recipientConfirmedAt || booking.RecipientConfirmedAt ? (
                      <Tag color="green" icon={<CheckCircleOutlined />}>
                        {t('recipient.confirmedAt', {
                          time: dayjs(
                            booking.recipientConfirmedAt || booking.RecipientConfirmedAt,
                          ).format('DD/MM/YYYY HH:mm'),
                        })}
                      </Tag>
                    ) : (
                      <Tag color="orange" icon={<ClockCircleOutlined />}>
                        {t('recipient.presenceNotConfirmed')}
                      </Tag>
                    )}
                  </Descriptions.Item>
                  {(booking.alternateRecipientName || booking.AlternateRecipientName) && (
                    <Descriptions.Item label={t('recipient.alternateSigner', 'Người nhận thay')} span={2}>
                      <Space wrap>
                        <Text strong>
                          {booking.alternateRecipientName || booking.AlternateRecipientName}
                        </Text>
                        {booking.alternateRecipientApprovedAt || booking.AlternateRecipientApprovedAt ? (
                          <Tag color="green">
                            {t('recipient.alternateApproved', {
                              name: booking.alternateRecipientName || booking.AlternateRecipientName,
                              time: dayjs(
                                booking.alternateRecipientApprovedAt ||
                                  booking.AlternateRecipientApprovedAt,
                              ).format('DD/MM/YYYY HH:mm'),
                            })}
                          </Tag>
                        ) : (
                          <Tag color="gold">{t('recipient.awaitingApproval', 'Đang chờ duyệt')}</Tag>
                        )}
                      </Space>
                    </Descriptions.Item>
                  )}
                </Descriptions>
              </Card>
            </Col>

            <Col span={24}>
              <Card title={t('bookings.detailPage.bookingInfo')} style={{ height: '100%' }}>
                <Descriptions column={1} size="small">
                  <Descriptions.Item label={t('bookings.detailPage.mode')}>
                    {t(`bookings.modes.${String(booking.transportMode || booking.TransportMode).toLowerCase()}`)}
                  </Descriptions.Item>
                  <Descriptions.Item label={t('bookings.detailPage.climate')}>
                    {(booking.requiresClimateControl ?? booking.RequiresClimateControl)
                      ? t('bookings.detailPage.yes')
                      : t('bookings.detailPage.no')}
                  </Descriptions.Item>
                  <Descriptions.Item label={t('bookings.detailPage.specialist')}>
                    {booking.assignedSpecialistName || booking.AssignedSpecialistName || t('bookings.detailPage.notAssigned')}
                  </Descriptions.Item>
                </Descriptions>
              </Card>
            </Col>
          </Row>
        </Col>
        <Col span={24}>
          <Card title={t('bookings.detailPage.horses')}>
            <Table
              rowKey={(record) => record.horseId || record.HorseID}
              columns={horseColumns}
              dataSource={horses}
              pagination={false}
              scroll={{ x: 640 }}
            />
          </Card>
        </Col>
        {quoteLines.length > 0 && (
          <Col span={24}>
            <Card title={t('bookings.detailPage.quote')}>
              <Table
                rowKey={(record, index) => record.code || record.Code || `quote-${index}`}
                columns={quoteColumns}
                dataSource={quoteLines}
                pagination={false}
                size="small"
                summary={() => (
                  <Table.Summary.Row>
                    <Table.Summary.Cell index={0} colSpan={2}>
                      <Text strong>{t('bookings.detailPage.total')}</Text>
                    </Table.Summary.Cell>
                    <Table.Summary.Cell index={2} align="right">
                      <Text strong style={{ color: '#d97706' }}>
                        {Number(booking.estimatedCost || booking.EstimatedCost || 0).toLocaleString()}{' '}
                        {booking.currencyCode || booking.CurrencyCode || 'USD'}
                      </Text>
                    </Table.Summary.Cell>
                  </Table.Summary.Row>
                )}
              />
            </Card>
          </Col>
        )}
      </Row>

      {/* Modal sửa người nhận (FE-13 / R-16) */}
      <Modal
        title={t('recipient.editModalTitle')}
        open={editRecipientOpen}
        onCancel={() => setEditRecipientOpen(false)}
        onOk={handleSaveRecipient}
        confirmLoading={savingRecipient}
        okText={t('recipient.save')}
        cancelText={t('common.cancel')}
        destroyOnClose
      >
        <Form form={recipientForm} layout="vertical">
          <RecipientForm form={recipientForm} />
        </Form>
      </Modal>
    </div>
  );

  const journeyContent =
    journey.trips.length === 0 ? (
      <Card>
        <Empty
          image={Empty.PRESENTED_IMAGE_SIMPLE}
          description={
            journey.loading
              ? t('common.loading')
              : journey.awaitingPlanning.length > 0
                ? t('customerOrders.journey.awaitingPlanning', { horses: journey.awaitingPlanning.join(', ') })
                : t('customerOrders.journey.noTrip')
          }
        />
      </Card>
    ) : (
      <Flex vertical gap={12}>
        {journey.trips.length > 1 && (
          <Segmented
            value={shownTrip?.tripId}
            onChange={setSelectedTripId}
            options={journey.trips.map((tr) => ({ value: tr.tripId, label: tr.tripCode }))}
          />
        )}
        {shownTrip && <TripJourney trip={shownTrip} lastLoadedAt={journey.lastLoadedAt} onRefresh={journey.refetch} />}
      </Flex>
    );

  const isInactive = INACTIVE_BOOKING_STATUSES.includes(status);
  const documentsContent = (
    <Flex vertical gap={16}>
      {status === 'Submitted' && (
        <Alert
          type="info"
          showIcon
          message={t('bookings.detailPage.waitingApprovalTitle')}
          description={t('bookings.detailPage.waitingApprovalDescription')}
        />
      )}
      {isInactive && (
        <Alert
          type="warning"
          showIcon
          message={t('bookings.detailPage.inactiveTitle')}
          description={t('bookings.detailPage.inactiveDescription')}
        />
      )}
      {!isInactive && status !== 'Submitted' && (
        <Alert
          type="success"
          showIcon
          message={t('bookings.detailPage.documentsTitle')}
          description={t('bookings.detailPage.documentsDescription')}
        />
      )}
      <CustomerDossierPanel bookingId={bookingId} bookingStatus={status} />
    </Flex>
  );

  return (
    <div>
      <PageHeader
        title={t('bookings.detailPage.title', { code: bookingCode })}
        subtitle={t('bookings.detailPage.subtitle')}
        breadcrumb={[
          { label: t('bookings.title'), path: ROUTES.CUSTOMER_BOOKINGS },
          { label: bookingCode },
        ]}
        actions={
          <Button icon={<ArrowLeftOutlined />} onClick={() => navigate(ROUTES.CUSTOMER_BOOKINGS)}>
            {t('bookings.detailPage.back')}
          </Button>
        }
      />

      <Card style={{ marginBottom: 20 }} styles={{ body: { padding: '16px 20px' } }}>
        <Flex justify="space-between" align="center" wrap="wrap" gap={12}>
          <div>
            <Title level={4} style={{ margin: 0 }}>
              #{bookingCode}
            </Title>
            <Text type="secondary">
              {booking.pickupCountryCode || booking.PickupCountryCode} →{' '}
              {booking.dropoffCountryCode || booking.DropoffCountryCode}
            </Text>
          </div>
          <Flex gap={8} align="center">
            <CustomerStageTag stage={booking.customerStage} />
            <StatusTag status={status} />
          </Flex>
        </Flex>
      </Card>

      <Tabs
        activeKey={activeTab}
        onChange={handleTabChange}
        items={[
          { key: 'overview', label: t('bookings.detailPage.overview'), children: overviewContent },
          {
            key: 'journey',
            label: (
              <span>
                <CarOutlined /> {t('customerOrders.journey.tab')}
              </span>
            ),
            children: journeyContent,
          },
          {
            key: 'documents',
            label: (
              <span>
                <FileProtectOutlined /> {t('bookings.detailPage.documents')}
              </span>
            ),
            children: documentsContent,
          },
          {
            key: 'payment',
            label: (
              <span>
                <DollarOutlined /> {t('payments.title')}
              </span>
            ),
            children: (
              <BookingPaymentPanel
                bookingId={bookingId}
                bookingStatus={status}
                mode="customer"
                onChanged={() => setReloadKey((k) => k + 1)}
              />
            ),
          },
        ]}
      />
    </div>
  );
}
