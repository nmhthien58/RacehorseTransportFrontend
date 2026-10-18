import { useCallback, useEffect, useState } from 'react';
import { Badge, Button, Drawer, Empty, Flex, Progress, Segmented, Space, Spin, Table, Tag, Typography, message } from 'antd';
import { ReloadOutlined, WarningOutlined } from '@ant-design/icons';
import { useTranslation } from 'react-i18next';
import dayjs from 'dayjs';
import StatusTag from '@components/common/StatusTag';
import trackingService from '@services/trackingService';
import tripService from '@services/tripService';
import TripPlanSummary from '@features/coordinator/components/TripPlanSummary';
import { unwrapData, unwrapList, getErrorMessage } from '@utils/apiHelpers';

const { Text } = Typography;

// Backend giữ kết quả theo dõi 30 giây và làm mới ngay khi đoàn xe cập nhật
const POLL_MS = 30000;
const formatTime = (value) => (value ? dayjs(value).format('DD/MM HH:mm') : '—');

/**
 * Bảng theo dõi các chuyến chưa đóng (Flow 4): GET /tracking/trips, làm mới mỗi 30 giây.
 * Bấm một chuyến để xem chi tiết (GET /trips/{id}) và nhật ký thể trạng (GET /trips/{id}/welfare-logs).
 *
 * @returns {JSX.Element}
 */
export default function TripTrackingBoard() {
  const { t } = useTranslation();
  const [status, setStatus] = useState('All');
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshKey, setRefreshKey] = useState(0);
  const [openTripId, setOpenTripId] = useState(null);
  const [detail, setDetail] = useState(null);
  const [logs, setLogs] = useState([]);

  const refresh = useCallback(() => setRefreshKey((k) => k + 1), []);

  useEffect(() => {
    let active = true;
    const load = () =>
      trackingService
        .getTripsTracking(status === 'All' ? undefined : { status })
        .then((res) => {
          if (active) setRows(unwrapList(res));
        })
        .catch((err) => {
          if (active) message.error(getErrorMessage(err, t('tracking.loadFailed')));
        })
        .finally(() => {
          if (active) setLoading(false);
        });
    load();
    const timer = setInterval(load, POLL_MS);
    return () => {
      active = false;
      clearInterval(timer);
    };
  }, [status, refreshKey, t]);

  useEffect(() => {
    if (!openTripId) return undefined;
    let active = true;
    Promise.all([tripService.getTripById(openTripId), tripService.getWelfareLogs(openTripId)])
      .then(([tripRes, logRes]) => {
        if (!active) return;
        setDetail(unwrapData(tripRes));
        setLogs(unwrapList(logRes));
      })
      .catch((err) => {
        if (active) message.error(getErrorMessage(err, t('tracking.loadFailed')));
      });
    return () => {
      active = false;
    };
  }, [openTripId, t]);
  const shownDetail = detail?.tripId === openTripId ? detail : null;

  const columns = [
    {
      title: t('tracking.columns.trip'),
      dataIndex: 'tripCode',
      render: (code, r) => (
        <div>
          <Text strong>{code}</Text>
          <div style={{ fontSize: 12, color: '#64748b' }}>
            {r.vehicleCode} · {t('tripPlan.fields.horseCount', { count: r.horseCount })}
          </div>
        </div>
      ),
    },
    { title: t('tracking.columns.status'), dataIndex: 'overallStatus', width: 150, render: (s) => <StatusTag status={s} /> },
    {
      title: t('tracking.columns.driver'),
      render: (_, r) => (
        <div style={{ fontSize: 12 }}>
          <div>{r.leadDriverName || '—'}</div>
          <Text type="secondary" style={{ fontSize: 12 }}>
            {r.leadDriverPhone}
          </Text>
        </div>
      ),
    },
    {
      title: t('tracking.columns.progress'),
      width: 180,
      render: (_, r) => (
        <div>
          <Progress
            size="small"
            percent={r.checkpointsTotal ? Math.round((r.checkpointsReached / r.checkpointsTotal) * 100) : 0}
            format={() => `${r.checkpointsReached}/${r.checkpointsTotal}`}
            strokeColor="#F59E0B"
          />
          <div style={{ fontSize: 11, color: '#64748b' }}>
            {r.lastCheckpointName ? `${r.lastCheckpointName} (${r.lastCheckpointStatus})` : t('tracking.notStarted')}
          </div>
        </div>
      ),
    },
    {
      title: t('tracking.columns.next'),
      render: (_, r) => (
        <div style={{ fontSize: 12 }}>
          {r.nextCheckpointName || '—'}
          <div style={{ color: '#64748b' }}>{formatTime(r.nextCheckpointPlannedTime)}</div>
          {/* R-08: giờ dự kiến mới theo check-in thực tế khi chuyến đang trễ */}
          {r.nextCheckpointEstimatedTime && r.isBehindSchedule && (
            <div style={{ color: '#DC2626' }}>{t('tracking.revised', { time: formatTime(r.nextCheckpointEstimatedTime) })}</div>
          )}
          {r.estimatedEndAt && (
            <div style={{ color: '#64748b' }}>{t('tracking.estimatedEnd', { time: formatTime(r.estimatedEndAt) })}</div>
          )}
        </div>
      ),
    },
    {
      title: t('tracking.columns.delay'),
      width: 110,
      render: (_, r) =>
        r.isBehindSchedule ? (
          <Tag color="red">{t('tracking.delay', { minutes: r.delayMinutes })}</Tag>
        ) : (
          <Tag color="green">{t('tracking.onTime')}</Tag>
        ),
    },
    {
      title: t('tracking.columns.alerts'),
      width: 120,
      render: (_, r) => (
        <Space size={10}>
          <Badge count={r.openIncidentCount} title={t('tracking.incidents')} showZero color={r.openIncidentCount ? '#DC2626' : '#CBD5E1'} />
          <Badge count={r.welfareAlertCount} title={t('tracking.welfareAlerts')} showZero color={r.welfareAlertCount ? '#F59E0B' : '#CBD5E1'} />
        </Space>
      ),
    },
  ];

  return (
    <div>
      <Flex justify="space-between" align="center" wrap="wrap" gap={8} style={{ marginBottom: 12 }}>
        <Segmented
          value={status}
          onChange={setStatus}
          options={[
            { value: 'All', label: t('tracking.filters.open') },
            { value: 'Scheduled', label: <StatusTag status="Scheduled" /> },
            { value: 'InTransit', label: <StatusTag status="InTransit" /> },
            { value: 'EmergencyRerouting', label: <StatusTag status="EmergencyRerouting" /> },
            { value: 'ArrivedDestination', label: <StatusTag status="ArrivedDestination" /> },
          ]}
        />
        <Space>
          <Text type="secondary" style={{ fontSize: 12 }}>
            {t('tracking.autoRefresh')}
          </Text>
          <Button size="small" icon={<ReloadOutlined />} onClick={refresh} />
        </Space>
      </Flex>
      <Table
        size="small"
        rowKey="tripId"
        loading={loading}
        dataSource={rows}
        columns={columns}
        pagination={false}
        scroll={{ x: 980 }}
        onRow={(r) => ({ onClick: () => setOpenTripId(r.tripId), style: { cursor: 'pointer' } })}
        locale={{ emptyText: <Empty description={t('tracking.empty')} /> }}
      />

      <Drawer
        width={Math.min(900, typeof window !== 'undefined' ? window.innerWidth - 32 : 900)}
        open={Boolean(openTripId)}
        onClose={() => setOpenTripId(null)}
        title={shownDetail?.tripCode || ''}
        destroyOnHidden
      >
        {!shownDetail ? (
          <div style={{ textAlign: 'center', padding: 40 }}>
            <Spin />
          </div>
        ) : (
          <Space direction="vertical" size={16} style={{ width: '100%' }}>
            <TripPlanSummary trip={shownDetail} />
            <div>
              <Text strong>{t('tracking.welfareTitle', { count: logs.length })}</Text>
              <Table
                size="small"
                rowKey="logId"
                pagination={{ pageSize: 8 }}
                dataSource={logs}
                scroll={{ x: 700 }}
                columns={[
                  { title: t('tracking.log.time'), dataIndex: 'loggedAt', width: 120, render: formatTime },
                  { title: t('tripPlan.fields.horse'), dataIndex: 'horseName' },
                  { title: t('tracking.log.cabin'), dataIndex: 'cabinTemp', width: 80, render: (v) => `${v}°C` },
                  { title: t('tracking.log.water'), dataIndex: 'waterIntakeLiters', width: 80, render: (v) => `${v} L` },
                  { title: t('tracking.log.feed'), dataIndex: 'feedStatus', width: 90 },
                  { title: t('tracking.log.stress'), dataIndex: 'stressLevel', width: 100 },
                  {
                    title: '',
                    dataIndex: 'needsAttention',
                    width: 40,
                    render: (v) => (v ? <WarningOutlined style={{ color: '#DC2626' }} /> : null),
                  },
                  { title: t('tracking.log.by'), dataIndex: 'recordedByName' },
                ]}
              />
            </div>
          </Space>
        )}
      </Drawer>
    </div>
  );
}
