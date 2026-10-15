import { useEffect, useState } from 'react';
import { Card, Row, Col, Typography, Tag, Button, Spin, Empty, Descriptions, Alert } from 'antd';
import { ArrowLeftOutlined } from '@ant-design/icons';
import { useParams, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import dayjs from 'dayjs';
import { useMissionDetail } from '../hooks/useDriverMissions';
import driverService from '../services/driverService';
import { unwrapList } from '@utils/apiHelpers';
import {
  SEVERITY_COLOR,
  INCIDENT_STATUS_COLOR,
  HANDOVER_CONDITION_COLOR,
  ON_TIME_COLOR,
} from '@utils/incidents';
import { TRIP_STATUS_COLOR, tripStatusKey } from '@features/customer/constants/tripTracking';

const { Title, Text } = Typography;

const formatTime = (value) => (value ? dayjs(value).format('DD/MM/YYYY HH:mm') : '—');

/**
 * Tổng kết một chuyến cho đoàn xe: mốc đã đi, nhật ký sức khỏe, sự cố, biên bản bàn giao và kết quả KPI khi quản lý đã đóng chuyến.
 * Chỉ đọc; số liệu lấy từ GET /trips/{id}, /welfare-logs, /incidents, /handovers.
 */
export default function MissionCompletionReportPage() {
  const { tripId } = useParams();
  const navigate = useNavigate();
  const { t } = useTranslation();
  const { mission, loading } = useMissionDetail(tripId);
  const [incidents, setIncidents] = useState([]);
  const [handovers, setHandovers] = useState([]);

  useEffect(() => {
    let active = true;
    Promise.all([
      driverService.getIncidents(tripId).then(unwrapList).catch(() => []),
      driverService.getHandovers(tripId).then(unwrapList).catch(() => []),
    ]).then(([incidentList, handoverList]) => {
      if (!active) return;
      setIncidents(incidentList);
      setHandovers(handoverList);
    });
    return () => {
      active = false;
    };
  }, [tripId]);

  if (loading && !mission) {
    return (
      <div style={{ textAlign: 'center', padding: '100px 0' }}>
        <Spin size="large" />
      </div>
    );
  }
  if (!mission) return <Empty style={{ marginTop: 80 }} />;

  const checkpoints = mission.routeCheckpoints || [];
  const logs = mission.welfareLogs || [];
  const isClosed = mission.overallStatus === 'Completed';

  return (
    <div style={{ maxWidth: 1100, margin: '0 auto', padding: '24px 16px' }}>
      <Button type="link" icon={<ArrowLeftOutlined />} onClick={() => navigate(-1)} style={{ paddingLeft: 0 }}>
        {t('common.back')}
      </Button>

      <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap', marginBottom: 4 }}>
        <Title level={3} style={{ margin: 0 }}>
          {t('tripReport.title', { code: mission.tripCode })}
        </Title>
        <Tag color={TRIP_STATUS_COLOR[mission.overallStatus] || 'default'}>{t(`status.${tripStatusKey(mission.overallStatus)}`)}</Tag>
      </div>
      <Text type="secondary">
        {mission.origin} → {mission.destination}
      </Text>

      {!isClosed && <Alert type="info" showIcon message={t('tripReport.notClosed')} style={{ margin: '16px 0' }} />}

      <Card style={{ marginTop: 16 }}>
        <Descriptions column={{ xs: 1, sm: 2, md: 3 }} size="small">
          <Descriptions.Item label={t('customerTrips.info.vehicle')}>{mission.vehicleCode}</Descriptions.Item>
          <Descriptions.Item label={t('tripReport.bookings')}>{mission.bookingCode || '—'}</Descriptions.Item>
          <Descriptions.Item label={t('tripReport.horses')}>{(mission.horses || []).length}</Descriptions.Item>
          <Descriptions.Item label={t('tripReport.started')}>{formatTime(mission.actualStartDate)}</Descriptions.Item>
          <Descriptions.Item label={t('tripReport.ended')}>{formatTime(mission.actualEndDate)}</Descriptions.Item>
          <Descriptions.Item label={t('tripReport.checkpoints')}>
            {checkpoints.filter((c) => c.status === 'Departed' || c.actualArrivalTime).length}/{checkpoints.length}
          </Descriptions.Item>
          <Descriptions.Item label={t('tripReport.logs')}>
            {logs.length}
            {logs.some((l) => l.needsAttention) && (
              <Tag color="red" style={{ marginLeft: 8 }}>
                {t('customerTrips.alerts', { count: logs.filter((l) => l.needsAttention).length })}
              </Tag>
            )}
          </Descriptions.Item>
          {isClosed && (
            <>
              <Descriptions.Item label={t('tripClose.kpi')}>
                <Text strong>{mission.kpiScore}</Text>
              </Descriptions.Item>
              <Descriptions.Item label={t('tripClose.onTime')}>
                <Tag color={ON_TIME_COLOR[mission.onTimeStatus]}>{t(`tripClose.onTimeStatus.${mission.onTimeStatus}`)}</Tag>
                {mission.delayMinutes > 0 && <Text type="secondary">{t('tracking.delay', { minutes: mission.delayMinutes })}</Text>}
              </Descriptions.Item>
              <Descriptions.Item label={t('tripClose.closedBy')}>
                {mission.closedByName} · {formatTime(mission.closedAt)}
              </Descriptions.Item>
            </>
          )}
        </Descriptions>
        {isClosed && mission.executiveRemarks && (
          <div style={{ marginTop: 8, color: '#57534E' }}>
            {t('tripClose.remarks')}: {mission.executiveRemarks}
          </div>
        )}
      </Card>

      <Row gutter={[16, 16]} style={{ marginTop: 16 }}>
        <Col xs={24} lg={12}>
          <Card title={t('incidents.title')} size="small">
            {incidents.length === 0 ? (
              <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description={t('incidents.none')} />
            ) : (
              incidents.map((inc) => (
                <div key={inc.incidentId} style={{ padding: '10px 0', borderBottom: '1px solid #F5F5F4' }}>
                  <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', alignItems: 'center' }}>
                    <Text strong>{t(`incidents.type.${inc.incidentType}`)}</Text>
                    <Tag color={SEVERITY_COLOR[inc.severity]}>{t(`incidents.severity.${inc.severity}`)}</Tag>
                    <Tag color={INCIDENT_STATUS_COLOR[inc.status]}>{t(`incidents.status.${inc.status}`)}</Tag>
                  </div>
                  <div style={{ fontSize: 13, color: '#57534E' }}>
                    {formatTime(inc.reportedAt)} · {inc.location}
                  </div>
                  {inc.proposedAction && (
                    <div style={{ fontSize: 13 }}>
                      {t('incidents.fields.plan')}: {inc.proposedAction}
                    </div>
                  )}
                </div>
              ))
            )}
          </Card>
        </Col>
        <Col xs={24} lg={12}>
          <Card title={t('handover.listTitle')} size="small">
            {handovers.length === 0 ? (
              <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description={t('handover.none')} />
            ) : (
              handovers.map((h) => (
                <div key={h.handoverId} style={{ padding: '10px 0', borderBottom: '1px solid #F5F5F4' }}>
                  <Text strong>{h.bookingCode}</Text>
                  <Tag color={HANDOVER_CONDITION_COLOR[h.overallCondition]} style={{ marginLeft: 8 }}>
                    {t(`handover.condition.${h.overallCondition}`)}
                  </Tag>
                  <div style={{ fontSize: 13, color: '#57534E' }}>
                    {h.recipientName} · {formatTime(h.handoverDateTime)}
                  </div>
                </div>
              ))
            )}
          </Card>
        </Col>
      </Row>
    </div>
  );
}
