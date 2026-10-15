import { useMemo, useState } from 'react';
import { Card, Table, Tag, Typography, Segmented, Alert, Space } from 'antd';
import { RightOutlined } from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import dayjs from 'dayjs';
import { ROUTES } from '@routes/routes';
import { useCustomerTrips } from '@features/customer/hooks/useCustomerTrips';
import { TRIP_STATUS_COLOR, tripStatusKey } from '@features/customer/constants/tripTracking';

const { Title, Text } = Typography;

// Nhóm trạng thái cho bộ lọc
const FILTER_GROUPS = {
  running: ['InTransit', 'EmergencyRerouting', 'ArrivedDestination'],
  upcoming: ['Scheduled'],
  finished: ['Completed', 'Cancelled'],
};

const formatTime = (value) => (value ? dayjs(value).format('DD/MM/YYYY HH:mm') : '—');

/**
 * Lấy phần đầu của địa chỉ (trước dấu phẩy) cho gọn cột lộ trình.
 * @param {string} address
 * @returns {string}
 */
const shortPlace = (address) => (address || '').split(',')[0] || '—';

/**
 * Màn hình "Theo dõi chuyến đi" của khách: danh sách mọi chuyến đang / đã chở ngựa của khách.
 * Bấm một dòng để mở màn hình theo dõi chi tiết chuyến đó.
 */
export default function TripTrackingPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { trips, awaitingPlanning, loading } = useCustomerTrips();
  const [filter, setFilter] = useState('all');

  const filteredTrips = useMemo(
    () => (filter === 'all' ? trips : trips.filter((trip) => FILTER_GROUPS[filter].includes(trip.overallStatus))),
    [trips, filter],
  );

  const countOf = (key) => (key === 'all' ? trips.length : trips.filter((trip) => FILTER_GROUPS[key].includes(trip.overallStatus)).length);

  const columns = [
    {
      title: t('customerTrips.columns.trip'),
      key: 'trip',
      render: (_, r) => (
        <div>
          <Text strong>{r.tripCode}</Text>
          <div>
            <Text type="secondary" style={{ fontSize: 12 }}>{r.bookingCode}</Text>
          </div>
        </div>
      ),
    },
    {
      title: t('customerTrips.columns.route'),
      key: 'route',
      render: (_, r) => (
        <Text>
          {shortPlace(r.pickupAddress)} → {shortPlace(r.dropoffAddress)}
        </Text>
      ),
    },
    {
      title: t('customerTrips.columns.horses'),
      key: 'horses',
      render: (_, r) => r.horses.map((h) => h.horseName).join(', ') || '—',
    },
    {
      title: t('customerTrips.columns.departure'),
      key: 'departure',
      render: (_, r) => (
        <div>
          <div>{formatTime(r.actualStartDate || r.plannedStartDate)}</div>
          {!r.actualStartDate && (
            <Text type="secondary" style={{ fontSize: 12 }}>{t('customerTrips.planned')}</Text>
          )}
        </div>
      ),
    },
    {
      title: t('customerTrips.columns.progress'),
      key: 'progress',
      render: (_, r) => t('customerTrips.checkpointProgress', { reached: r.checkpointsReached, total: r.checkpointsTotal }),
    },
    {
      title: t('customerTrips.columns.logs'),
      key: 'logs',
      render: (_, r) => (
        <Space size={6}>
          <span>{r.logCount}</span>
          {r.alertCount > 0 && <Tag color="red">{t('customerTrips.alerts', { count: r.alertCount })}</Tag>}
        </Space>
      ),
    },
    {
      title: t('customerTrips.columns.status'),
      key: 'status',
      render: (_, r) => (
        <Tag color={TRIP_STATUS_COLOR[r.overallStatus] || 'default'}>{t(`status.${tripStatusKey(r.overallStatus)}`)}</Tag>
      ),
    },
    {
      key: 'open',
      width: 40,
      render: () => <RightOutlined style={{ color: '#94A3B8' }} />,
    },
  ];

  return (
    <div style={{ maxWidth: 1280, margin: '0 auto', padding: '20px 16px' }}>
      <Title level={3} style={{ marginBottom: 4 }}>{t('customerTrips.title')}</Title>
      <Text type="secondary">{t('customerTrips.subtitle')}</Text>

      {awaitingPlanning.length > 0 && (
        <Alert
          type="info"
          showIcon
          style={{ marginTop: 16 }}
          message={t('customerTrips.awaitingPlanning', { horses: awaitingPlanning.join(', ') })}
        />
      )}

      <Card style={{ marginTop: 16 }} styles={{ body: { padding: 16 } }}>
        <Segmented
          value={filter}
          onChange={setFilter}
          style={{ marginBottom: 16 }}
          options={['all', 'running', 'upcoming', 'finished'].map((key) => ({
            value: key,
            label: `${t(`customerTrips.filters.${key}`)} (${countOf(key)})`,
          }))}
        />
        <Table
          rowKey="tripId"
          loading={loading}
          dataSource={filteredTrips}
          columns={columns}
          pagination={{ pageSize: 10, hideOnSinglePage: true }}
          scroll={{ x: 900 }}
          locale={{ emptyText: t('customerTrips.empty') }}
          onRow={(record) => ({
            onClick: () => navigate(ROUTES.CUSTOMER_TRIP_DETAIL.replace(':tripId', record.tripId)),
            style: { cursor: 'pointer' },
          })}
        />
      </Card>
    </div>
  );
}
