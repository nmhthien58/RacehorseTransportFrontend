import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  Alert,
  Button,
  Card,
  Empty,
  Flex,
  Popconfirm,
  Select,
  Space,
  Spin,
  Table,
  Tabs,
  Tag,
  Typography,
  message,
} from 'antd';
import { ArrowLeftOutlined, EditOutlined, EyeOutlined, PlusOutlined, ReloadOutlined, SendOutlined, StopOutlined } from '@ant-design/icons';
import { useSearchParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import dayjs from 'dayjs';
import { formatCountryRoute } from '@utils/bookingRoute';
import { formatDeliveryDeadline, formatPickupWindow } from '@utils/bookingSchedule';
import PageHeader from '@components/layout/PageHeader';
import StatusTag from '@components/common/StatusTag';
import tripService from '@services/tripService';
import bookingService from '@services/bookingService';
import BookingRoutePlanModal from '@features/coordinator/components/BookingRoutePlanModal';
import { CompassOutlined } from '@ant-design/icons';
import TripPlanEditor from '@features/coordinator/components/TripPlanEditor';
import TripPlanSummary from '@features/coordinator/components/TripPlanSummary';
import { useAuthStore } from '@features/auth/store/authStore';
import { unwrapData, unwrapList, getErrorMessage } from '@utils/apiHelpers';

const { Text } = Typography;

// Trạng thái còn trong giai đoạn lập kế hoạch / chờ chạy
const PLANNING_STATUSES = ['Draft', 'PendingApproval', 'Scheduled'];

/**
 * Trang lập kế hoạch chuyến của Fleet & Route Coordinator (Flow 3).
 * - Tab "Hàng chờ": GET /trips/unplanned-horses, chọn ngựa để lập chuyến mới
 * - Tab "Kế hoạch chuyến": GET /trips, sửa bản nháp, trình duyệt, hủy
 * - Chế độ soạn (?trip=<id> hoặc ?new=1): TripPlanEditor gọi POST/PUT /trips và POST /trips/{id}/submit
 *
 * @returns {JSX.Element}
 */
export default function RoutePlanningPage() {
  const { t } = useTranslation();
  const { user } = useAuthStore();
  const [searchParams, setSearchParams] = useSearchParams();

  const editingTripId = searchParams.get('trip') ? Number(searchParams.get('trip')) : null;
  const viewTripId = searchParams.get('view') ? Number(searchParams.get('view')) : null;
  const isNew = searchParams.get('new') === '1';
  const activeTab = searchParams.get('tab') || 'queue';

  const [queue, setQueue] = useState([]);
  const [trips, setTrips] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshKey, setRefreshKey] = useState(0);
  const [selectedQueueIds, setSelectedQueueIds] = useState([]);
  const [modeFilter, setModeFilter] = useState('All');
  const [statusFilter, setStatusFilter] = useState('Planning');
  const [tripDetail, setTripDetail] = useState(null);
  const [actionLoading, setActionLoading] = useState(false);
  const [editorKey, setEditorKey] = useState(0);
  // Đang sửa RoutePlanningPage vì bổ sung danh sách đơn chờ lập tuyến (PreApproved/RoutePlanned) cho Coordinator
  const [routeBookings, setRouteBookings] = useState([]);
  const [selectedBookingForPlan, setSelectedBookingForPlan] = useState(null);
  const [routePlanModalOpen, setRoutePlanModalOpen] = useState(false);

  const refresh = useCallback(() => setRefreshKey((k) => k + 1), []);

  useEffect(() => {
    let active = true;
    Promise.all([
      tripService.getUnplannedHorses(),
      tripService.getTrips({ size: 100 }),
      bookingService.getBookings(),
    ])
      .then(([qRes, tRes, bRes]) => {
        if (!active) return;
        setQueue(unwrapList(qRes));
        setTrips(unwrapList(tRes));
        const allB = unwrapList(bRes);
        setRouteBookings(allB.filter((b) => ['PreApproved', 'RoutePlanned'].includes(b.status || b.Status)));
      })
      .catch((err) => {
        if (active) message.error(getErrorMessage(err, t('tripPlan.messages.loadFailed')));
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, [refreshKey, t]);

  // Chi tiết chuyến đang sửa / đang xem
  const detailId = editingTripId || viewTripId;
  useEffect(() => {
    if (!detailId) return undefined;
    let active = true;
    tripService
      .getTripById(detailId)
      .then((res) => {
        if (active) setTripDetail(unwrapData(res));
      })
      .catch((err) => {
        if (active) message.error(getErrorMessage(err, t('tripPlan.messages.loadFailed')));
      });
    return () => {
      active = false;
    };
  }, [detailId, refreshKey, t]);
  const shownDetail = tripDetail?.tripId === detailId ? tripDetail : null;

  const goList = (tab = activeTab) => {
    setSearchParams({ tab });
    refresh();
  };

  const filteredQueue = useMemo(
    () => (modeFilter === 'All' ? queue : queue.filter((h) => h.transportMode === modeFilter)),
    [queue, modeFilter],
  );
  const filteredTrips = useMemo(() => {
    if (statusFilter === 'All') return trips;
    if (statusFilter === 'Planning') return trips.filter((tr) => PLANNING_STATUSES.includes(tr.overallStatus));
    return trips.filter((tr) => tr.overallStatus === statusFilter);
  }, [trips, statusFilter]);

  const runTripAction = async (call, successKey) => {
    setActionLoading(true);
    try {
      const res = unwrapData(await call());
      message.success(t(successKey, { code: res?.tripCode || '' }));
      refresh();
    } catch (err) {
      message.error(getErrorMessage(err, t('tripPlan.messages.saveFailed')));
    } finally {
      setActionLoading(false);
    }
  };

  const handleSaved = (saved, options = {}) => {
    if (options.keepEditing) {
      // Bản nháp đã tạo: chuyển sang chế độ sửa bản nháp đó
      setTripDetail(saved);
      setEditorKey((k) => k + 1);
      setSearchParams({ trip: String(saved.tripId), tab: 'trips' });
      return;
    }
    goList('trips');
  };

  // ======================= CHẾ ĐỘ SOẠN =======================
  if (isNew || editingTripId) {
    const ready = isNew || shownDetail;
    return (
      <div style={{ paddingBottom: 40 }}>
        <PageHeader
          title={isNew ? t('tripPlan.newTitle') : t('tripPlan.editTitle', { code: shownDetail?.tripCode || '' })}
          subtitle={t('tripPlan.editorSubtitle')}
          breadcrumb={[{ label: t('tripPlan.title') }, { label: isNew ? t('tripPlan.newTitle') : shownDetail?.tripCode || '' }]}
          actions={
            <Button icon={<ArrowLeftOutlined />} onClick={() => goList(isNew ? 'queue' : 'trips')}>
              {t('tripPlan.actions.back')}
            </Button>
          }
        />
        {!ready ? (
          <div style={{ textAlign: 'center', padding: 60 }}>
            <Spin />
          </div>
        ) : loading ? (
          <div style={{ textAlign: 'center', padding: 60 }}>
            <Spin />
          </div>
        ) : (
          <TripPlanEditor
            key={`${editingTripId || 'new'}-${editorKey}`}
            trip={isNew ? null : shownDetail}
            queue={queue}
            preselected={isNew ? selectedQueueIds : []}
            onSaved={handleSaved}
            onCancel={() => goList(isNew ? 'queue' : 'trips')}
          />
        )}
      </div>
    );
  }

  // ======================= CHẾ ĐỘ XEM =======================
  if (viewTripId) {
    return (
      <div style={{ paddingBottom: 40 }}>
        <PageHeader
          title={shownDetail?.tripCode || t('tripPlan.title')}
          breadcrumb={[{ label: t('tripPlan.title') }, { label: shownDetail?.tripCode || '' }]}
          actions={
            <Button icon={<ArrowLeftOutlined />} onClick={() => goList('trips')}>
              {t('tripPlan.actions.back')}
            </Button>
          }
        />
        {shownDetail ? (
          <TripPlanSummary trip={shownDetail} />
        ) : (
          <div style={{ textAlign: 'center', padding: 60 }}>
            <Spin />
          </div>
        )}
      </div>
    );
  }

  // ======================= DANH SÁCH =======================
  const queueColumns = [
    {
      title: t('tripPlan.fields.horse'),
      dataIndex: 'horseName',
      render: (name, h) => (
        <div>
          <Text strong>{name}</Text>
          <div style={{ fontSize: 12, color: '#64748b' }}>{h.microchipNumber}</div>
        </div>
      ),
    },
    {
      title: t('tripPlan.fields.booking'),
      dataIndex: 'bookingCode',
      render: (code, h) => (
        <div>
          <Text>{code}</Text>
          <div style={{ fontSize: 12, color: '#64748b' }}>{h.customerName}</div>
        </div>
      ),
    },
    {
      title: t('tripPlan.fields.mode'),
      dataIndex: 'transportMode',
      width: 90,
      render: (m) => <Tag color={m === 'Air' ? 'blue' : 'orange'}>{m}</Tag>,
    },
    {
      title: t('tripPlan.fields.route'),
      render: (_, h) => (
        <span style={{ fontSize: 12 }}>
          {formatCountryRoute(h)}
          <div style={{ color: '#64748b' }}>
            {h.pickupAddress} → {h.dropoffAddress}
          </div>
        </span>
      ),
    },
    {
      title: t('tripPlan.fields.window'),
      width: 150,
      render: (_, h) => (
        <span style={{ fontSize: 12 }}>
          {formatPickupWindow(h)} · {t('bookings.fields.deliveryDeadline')}: {formatDeliveryDeadline(h)}
        </span>
      ),
    },
    { title: t('tripPlan.fields.stallClass'), dataIndex: 'stallClass', width: 90, render: (s) => <Tag>{s}</Tag> },
    { title: t('tripPlan.fields.dossier'), dataIndex: 'dossierStatus', width: 130, render: (s) => <StatusTag status={s} /> },
  ];


  const routeBookingColumns = [
    {
      title: t('bookings.fields.bookingCode', 'Mã đơn'),
      dataIndex: 'bookingCode',
      width: 140,
      render: (code, b) => (
        <div>
          <Text strong>{code || b.BookingCode || '#' + b.bookingId}</Text>
          <div style={{ fontSize: 12, color: '#64748b' }}>
            {b.customerName || b.CustomerName} · {b.customerPhone || b.CustomerPhone}
          </div>
        </div>
      ),
    },
    {
      title: t('tripPlan.fields.mode', 'Phương thức'),
      dataIndex: 'transportMode',
      width: 100,
      render: (m) => <Tag color={m === 'Air' ? 'blue' : 'orange'}>{m || 'Ground'}</Tag>,
    },
    {
      title: t('tripPlan.fields.route', 'Lộ trình'),
      render: (_, b) => (
        <span style={{ fontSize: 12 }}>
          {formatCountryRoute(b)}
          <div style={{ color: '#64748b' }}>
            {b.pickupAddress || b.PickupAddress} → {b.dropoffAddress || b.DropoffAddress}
          </div>
        </span>
      ),
    },
    {
      title: t('tripPlan.fields.window', 'Thời gian'),
      width: 160,
      render: (_, b) => (
        <span style={{ fontSize: 12 }}>
          {formatPickupWindow(b)}
          <div style={{ color: '#64748b' }}>
            {t('bookings.fields.deliveryDeadline', 'Hạn giao')}: {formatDeliveryDeadline(b)}
          </div>
        </span>
      ),
    },
    {
      title: t('tripPlan.fields.horses', 'Số ngựa'),
      width: 80,
      align: 'center',
      render: (_, b) => b.totalHorses || b.TotalHorses || (b.horses ? b.horses.length : 1),
    },
    {
      title: t('tripPlan.fields.status', 'Trạng thái'),
      width: 130,
      render: (_, b) => <StatusTag status={b.status || b.Status} />,
    },
    {
      title: '',
      width: 140,
      align: 'right',
      render: (_, b) => {
        const s = b.status || b.Status;
        return (
          <Button
            type="primary"
            size="small"
            icon={<CompassOutlined />}
            onClick={() => {
              setSelectedBookingForPlan(b);
              setRoutePlanModalOpen(true);
            }}
            style={{
              backgroundColor: s === 'PreApproved' ? '#EA580C' : '#2563EB',
              borderColor: s === 'PreApproved' ? '#EA580C' : '#2563EB',
              fontWeight: 600,
            }}
          >
            {s === 'PreApproved'
              ? t('tripPlan.actions.planRoute', 'Lập tuyến')
              : t('tripPlan.actions.viewEditRoute', 'Xem / Sửa tuyến')}
          </Button>
        );
      },
    },
  ];

  const selectedModes = new Set(queue.filter((h) => selectedQueueIds.includes(h.bookingHorseId)).map((h) => h.transportMode));

  const tripColumns = [
    {
      title: t('tripPlan.fields.trip'),
      dataIndex: 'tripCode',
      render: (code, tr) => (
        <div>
          <Text strong>{code}</Text>
          <div style={{ fontSize: 12, color: '#64748b' }}>
            {tr.vehicleCode} · {tr.vehicleType}
          </div>
        </div>
      ),
    },
    { title: t('tripPlan.fields.status'), dataIndex: 'overallStatus', width: 140, render: (s) => <StatusTag status={s} /> },
    {
      title: t('tripPlan.fields.period'),
      render: (_, tr) => (
        <span style={{ fontSize: 12 }}>
          {dayjs(tr.plannedStartDate).format('DD/MM/YYYY HH:mm')} → {dayjs(tr.plannedEndDate).format('DD/MM/YYYY HH:mm')}
        </span>
      ),
    },
    { title: t('tripPlan.fields.horses'), dataIndex: 'horseCount', width: 80, align: 'center' },
    {
      title: t('tripPlan.sections.crew'),
      render: (_, tr) => (
        <span style={{ fontSize: 12 }}>
          {(tr.crew || []).map((c) => `${c.fullName} (${t(`tripPlan.crewRole.${c.crewRole}`)})`).join(', ')}
        </span>
      ),
    },
    {
      title: '',
      width: 220,
      align: 'right',
      render: (_, tr) => (
        <Space size={4} wrap>
          <Button size="small" icon={<EyeOutlined />} onClick={() => setSearchParams({ view: String(tr.tripId), tab: 'trips' })} />
          {tr.overallStatus === 'Draft' && (
            <>
              <Button size="small" icon={<EditOutlined />} onClick={() => setSearchParams({ trip: String(tr.tripId), tab: 'trips' })}>
                {t('tripPlan.actions.edit')}
              </Button>
              <Button
                size="small"
                icon={<SendOutlined />}
                loading={actionLoading}
                onClick={() => runTripAction(() => tripService.submitPlan(tr.tripId), 'tripPlan.messages.submitted')}
              >
                {t('tripPlan.actions.submit')}
              </Button>
            </>
          )}
          {PLANNING_STATUSES.includes(tr.overallStatus) && (
            <Popconfirm
              title={t('tripPlan.confirm.cancel', { code: tr.tripCode })}
              onConfirm={() => runTripAction(() => tripService.cancelTrip(tr.tripId), 'tripPlan.messages.cancelled')}
            >
              <Button size="small" danger icon={<StopOutlined />} />
            </Popconfirm>
          )}
        </Space>
      ),
    },
  ];

  return (
    <div style={{ paddingBottom: 40 }}>
      <PageHeader
        title={t('tripPlan.title')}
        subtitle={t('tripPlan.subtitle', { name: user?.fullName || '' })}
        actions={
          <Button icon={<ReloadOutlined />} onClick={refresh}>
            {t('tripPlan.actions.refresh')}
          </Button>
        }
      />

      <Card style={{ borderRadius: 14 }}>
        <Tabs
          activeKey={activeTab}
          onChange={(key) => setSearchParams({ tab: key })}
          items={[
            {
              key: 'routes',
              label: `${t('tripPlan.tabs.routePlanning', 'Đơn chờ lập tuyến')} (${routeBookings.length})`,
              children: (
                <Space direction="vertical" size={12} style={{ width: '100%' }}>
                  <Alert
                    type="info"
                    showIcon
                    message={t('tripPlan.tabs.routePlanningHint', 'Danh sách các đơn vận chuyển đã được Manager duyệt sơ bộ và chuyển đến Coordinator để vẽ / lập lộ trình chi tiết trước khi gửi báo giá chốt.')}
                  />
                  <Table
                    size="small"
                    loading={loading}
                    rowKey={(r) => r.bookingId || r.BookingID}
                    dataSource={routeBookings}
                    columns={routeBookingColumns}
                    pagination={{ pageSize: 10 }}
                    scroll={{ x: 900 }}
                    locale={{ emptyText: <Empty description={t('tripPlan.routePlanningEmpty', 'Hiện không có đơn nào chờ lập tuyến')} /> }}
                  />
                </Space>
              ),
            },
            {
              key: 'queue',
              label: `${t('tripPlan.tabs.queue')} (${queue.length})`,
              children: (
                <Space direction="vertical" size={12} style={{ width: '100%' }}>
                  <Flex justify="space-between" wrap="wrap" gap={8}>
                    <Select
                      style={{ width: 180 }}
                      value={modeFilter}
                      onChange={setModeFilter}
                      options={[
                        { value: 'All', label: t('tripPlan.filters.allModes') },
                        { value: 'Ground', label: 'Ground' },
                        { value: 'Air', label: 'Air' },
                      ]}
                    />
                    <Button
                      type="primary"
                      icon={<PlusOutlined />}
                      disabled={selectedQueueIds.length === 0 || selectedModes.size > 1}
                      onClick={() => setSearchParams({ new: '1', tab: 'queue' })}
                      style={{ backgroundColor: '#F59E0B', borderColor: '#F59E0B', color: '#0f172a', fontWeight: 700 }}
                    >
                      {t('tripPlan.actions.planSelected', { count: selectedQueueIds.length })}
                    </Button>
                  </Flex>
                  {selectedModes.size > 1 && <Text type="warning">{t('tripPlan.messages.mixedMode')}</Text>}
                  <Table
                    size="small"
                    loading={loading}
                    rowKey="bookingHorseId"
                    dataSource={filteredQueue}
                    columns={queueColumns}
                    pagination={{ pageSize: 10 }}
                    scroll={{ x: 900 }}
                    rowSelection={{
                      selectedRowKeys: selectedQueueIds,
                      onChange: (keys) => setSelectedQueueIds(keys),
                    }}
                    locale={{ emptyText: <Empty description={t('tripPlan.queueEmpty')} /> }}
                  />
                </Space>
              ),
            },
            {
              key: 'trips',
              label: `${t('tripPlan.tabs.trips')} (${trips.filter((tr) => PLANNING_STATUSES.includes(tr.overallStatus)).length})`,
              children: (
                <Space direction="vertical" size={12} style={{ width: '100%' }}>
                  <Select
                    style={{ width: 220 }}
                    value={statusFilter}
                    onChange={setStatusFilter}
                    options={[
                      { value: 'Planning', label: t('tripPlan.filters.planning') },
                      { value: 'All', label: t('tripPlan.filters.all') },
                      ...['Draft', 'PendingApproval', 'Scheduled', 'InTransit', 'ArrivedDestination', 'Completed', 'Cancelled'].map((s) => ({
                        value: s,
                        label: <StatusTag status={s} />,
                      })),
                    ]}
                  />
                  <Table
                    size="small"
                    loading={loading}
                    rowKey="tripId"
                    dataSource={filteredTrips}
                    columns={tripColumns}
                    pagination={{ pageSize: 10 }}
                    scroll={{ x: 900 }}
                  />
                </Space>
              ),
            },
          ]}
        />
      </Card>
      <BookingRoutePlanModal
        open={routePlanModalOpen}
        booking={selectedBookingForPlan}
        onClose={() => {
          setRoutePlanModalOpen(false);
          setSelectedBookingForPlan(null);
        }}
        onSuccess={refresh}
      />
    </div>
  );
}
