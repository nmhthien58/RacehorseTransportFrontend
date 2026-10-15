import { useEffect, useState } from 'react';
import { Button, Card, Col, Row, Typography, message } from 'antd';
import { CarOutlined, ClockCircleOutlined, InboxOutlined, NodeIndexOutlined, PlusOutlined } from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import PageHeader from '@components/layout/PageHeader';
import tripService from '@services/tripService';
import TripTrackingBoard from '@features/coordinator/components/TripTrackingBoard';
import { ROUTES } from '@routes/routes';
import { unwrapList, getErrorMessage } from '@utils/apiHelpers';

const { Text } = Typography;

/**
 * Trung tâm điều phối của Fleet & Route Coordinator.
 * - Thẻ số liệu: hàng chờ xếp chuyến (GET /trips/unplanned-horses) và số chuyến theo trạng thái (GET /trips)
 * - Bảng theo dõi chuyến đang chạy (Flow 4): TripTrackingBoard -> GET /tracking/trips
 *
 * @returns {JSX.Element}
 */
export default function CoordinatorDashboard() {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const [queueCount, setQueueCount] = useState(0);
  const [trips, setTrips] = useState([]);

  useEffect(() => {
    let active = true;
    Promise.all([tripService.getUnplannedHorses(), tripService.getTrips({ size: 100 })])
      .then(([qRes, tRes]) => {
        if (!active) return;
        setQueueCount(unwrapList(qRes).length);
        setTrips(unwrapList(tRes));
      })
      .catch((err) => {
        if (active) message.error(getErrorMessage(err, t('tracking.loadFailed')));
      });
    return () => {
      active = false;
    };
  }, [t]);

  const count = (...statuses) => trips.filter((tr) => statuses.includes(tr.overallStatus)).length;

  const cards = [
    {
      key: 'queue',
      icon: <InboxOutlined />,
      color: '#F59E0B',
      value: queueCount,
      label: t('coordinatorHub.cards.queue'),
      onClick: () => navigate(`${ROUTES.COORDINATOR_ROUTE_PLANNING}?tab=queue`),
    },
    {
      key: 'planning',
      icon: <ClockCircleOutlined />,
      color: '#2563EB',
      value: count('Draft', 'PendingApproval'),
      label: t('coordinatorHub.cards.planning'),
      onClick: () => navigate(`${ROUTES.COORDINATOR_ROUTE_PLANNING}?tab=trips`),
    },
    {
      key: 'scheduled',
      icon: <CarOutlined />,
      color: '#7C3AED',
      value: count('Scheduled'),
      label: t('coordinatorHub.cards.scheduled'),
      onClick: () => navigate(`${ROUTES.COORDINATOR_ROUTE_PLANNING}?tab=trips`),
    },
    {
      key: 'transit',
      icon: <NodeIndexOutlined />,
      color: '#059669',
      value: count('InTransit', 'EmergencyRerouting', 'ArrivedDestination'),
      label: t('coordinatorHub.cards.onTheRoad'),
    },
  ];

  return (
    <div style={{ paddingBottom: 40 }}>
      <PageHeader
        title={t('coordinatorHub.title')}
        subtitle={t('coordinatorHub.subtitle')}
        actions={
          <Button
            type="primary"
            icon={<PlusOutlined />}
            onClick={() => navigate(`${ROUTES.COORDINATOR_ROUTE_PLANNING}?tab=queue`)}
            style={{ backgroundColor: '#F59E0B', borderColor: '#F59E0B', color: '#0f172a', fontWeight: 700 }}
          >
            {t('coordinatorHub.planTrip')}
          </Button>
        }
      />

      <Row gutter={[16, 16]} style={{ marginBottom: 16 }}>
        {cards.map((c) => (
          <Col xs={12} md={6} key={c.key}>
            <Card
              hoverable={Boolean(c.onClick)}
              onClick={c.onClick}
              style={{ borderRadius: 14, height: '100%' }}
              styles={{ body: { padding: '16px 18px' } }}
            >
              <div style={{ fontSize: 22, color: c.color }}>{c.icon}</div>
              <div style={{ fontSize: 30, fontWeight: 800, color: '#0F172A', lineHeight: 1.1, marginTop: 6 }}>{c.value}</div>
              <Text type="secondary" style={{ fontSize: 12, fontWeight: 600 }}>
                {c.label}
              </Text>
            </Card>
          </Col>
        ))}
      </Row>

      <Card title={t('coordinatorHub.trackingTitle')} style={{ borderRadius: 14 }}>
        <TripTrackingBoard />
      </Card>
    </div>
  );
}
