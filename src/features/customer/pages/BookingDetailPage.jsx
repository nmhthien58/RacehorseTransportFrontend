import { useEffect, useMemo, useState } from 'react';
import {
  Alert,
  Button,
  Card,
  Col,
  Descriptions,
  Empty,
  Flex,
  Row,
  Segmented,
  Spin,
  Table,
  Tabs,
  Tag,
  Typography,
  message,
} from 'antd';
import { ArrowLeftOutlined, CarOutlined, DollarOutlined, EnvironmentOutlined, FileProtectOutlined } from '@ant-design/icons';
import { useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { formatDeliveryDeadline, formatPickupWindow } from '@utils/bookingSchedule';
import { formatCountryRoute } from '@utils/bookingRoute';
import PageHeader from '@components/layout/PageHeader';
import StatusTag from '@components/common/StatusTag';
import CustomerStageTag from '@components/common/CustomerStageTag';
import BookingPaymentPanel from '@components/common/BookingPaymentPanel';
import CustomerDossierPanel from '@features/customer/components/CustomerDossierPanel';
import OrderTimeline from '@features/customer/components/OrderTimeline';
import TripJourney from '@features/customer/components/TripJourney';
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
 * Trang chi tiết yêu cầu vận chuyển, bao gồm theo dõi và bổ sung hồ sơ từng ngựa.
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

  const overviewContent = (
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
