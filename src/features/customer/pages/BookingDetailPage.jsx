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
  Spin,
  Table,
  Tabs,
  Tag,
  Typography,
  message,
} from 'antd';
import { ArrowLeftOutlined, EnvironmentOutlined, FileProtectOutlined } from '@ant-design/icons';
import { useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { formatDeliveryDeadline, formatPickupWindow } from '@utils/bookingSchedule';
import PageHeader from '@components/layout/PageHeader';
import StatusTag from '@components/common/StatusTag';
import CustomerDossierPanel from '@features/customer/components/CustomerDossierPanel';
import bookingService from '@services/bookingService';
import { unwrapData, getErrorMessage } from '@utils/apiHelpers';
import { ROUTES } from '@routes/routes';

const { Text, Title } = Typography;
const INACTIVE_BOOKING_STATUSES = ['Rejected', 'Cancelled', 'Expired'];

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
  }, [id, t]);

  const status = booking?.status || booking?.Status;
  const bookingId = booking?.bookingId || booking?.BookingID || id;
  const bookingCode = booking?.bookingCode || booking?.BookingCode || id;
  const horses = booking?.horses || booking?.Horses || [];
  const quoteLines = booking?.quoteLines || booking?.QuoteLines || [];
  const activeTab = searchParams.get('tab') === 'documents' ? 'documents' : 'overview';

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
    setSearchParams(tab === 'documents' ? { tab: 'documents' } : {});
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
      <Col xs={24} xl={14}>
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
            <Descriptions.Item label={t('bookings.fields.pickupWindow')}>
              {formatPickupWindow(booking)}
            </Descriptions.Item>
            <Descriptions.Item label={t('bookings.fields.deliveryDeadline')}>
              {formatDeliveryDeadline(booking)}
            </Descriptions.Item>
          </Descriptions>
        </Card>
      </Col>
      <Col xs={24} xl={10}>
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
          <StatusTag status={status} />
        </Flex>
      </Card>

      <Tabs
        activeKey={activeTab}
        onChange={handleTabChange}
        items={[
          { key: 'overview', label: t('bookings.detailPage.overview'), children: overviewContent },
          {
            key: 'documents',
            label: (
              <span>
                <FileProtectOutlined /> {t('bookings.detailPage.documents')}
              </span>
            ),
            children: documentsContent,
          },
        ]}
      />
    </div>
  );
}
