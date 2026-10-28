import { useCallback, useEffect, useState } from 'react';
import {
  Alert,
  Button,
  Card,
  Col,
  Empty,
  Flex,
  Input,
  List,
  Modal,
  Row,
  Segmented,
  Space,
  Spin,
  Typography,
  message,
} from 'antd';
import { CheckOutlined, CloseOutlined, ReloadOutlined } from '@ant-design/icons';
import { useSearchParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import dayjs from 'dayjs';
import PageHeader from '@components/layout/PageHeader';
import StatusTag from '@components/common/StatusTag';
import tripService from '@services/tripService';
// Đang sửa RouteApprovalsPage vì bổ sung tab Duyệt tuyến đơn hàng và chốt giá trị ngựa theo FE-04 (R-10, BE-04, BE-09)
import TripPlanSummary from '@features/coordinator/components/TripPlanSummary';
import BookingRouteApprovalCard from '@features/manager/components/BookingRouteApprovalCard';
import bookingService from '@services/bookingService';
import { Tabs } from 'antd';
import { unwrapData, unwrapList, getErrorMessage } from '@utils/apiHelpers';

const { Text } = Typography;
const { TextArea } = Input;

// Lần trả về thứ 3 thì backend hủy chuyến và trả ngựa về hàng chờ
const MAX_PLAN_REJECTIONS = 3;

/**
 * Trang duyệt kế hoạch chuyến của Logistics Manager (Flow 3).
 * GET /trips?status=PendingApproval, GET /trips/{id}, POST /trips/{id}/approve | /reject.
 *
 * @returns {JSX.Element}
 */
export default function RouteApprovalsPage() {
  const { t } = useTranslation();
  const [searchParams, setSearchParams] = useSearchParams();
  const selectedId = searchParams.get('id') ? Number(searchParams.get('id')) : null;

  const [statusFilter, setStatusFilter] = useState('PendingApproval');
  const [trips, setTrips] = useState([]);
  const [routeBookings, setRouteBookings] = useState([]);
  const [selectedBookingId, setSelectedBookingId] = useState(null);
  const [approvalTab, setApprovalTab] = useState('bookingRoutes');
  const [loading, setLoading] = useState(true);
  const [detail, setDetail] = useState(null);
  const [refreshKey, setRefreshKey] = useState(0);
  const [actionLoading, setActionLoading] = useState(false);
  const [rejectOpen, setRejectOpen] = useState(false);
  const [rejectReason, setRejectReason] = useState('');

  const refresh = useCallback(() => setRefreshKey((k) => k + 1), []);

  useEffect(() => {
    let active = true;
    Promise.all([
      tripService.getTrips({ status: statusFilter, size: 100 }),
      bookingService.getBookings(),
    ])
      .then(([tRes, bRes]) => {
        if (!active) return;
        setTrips(unwrapList(tRes));
        const allB = unwrapList(bRes);
        const planned = allB.filter((b) => (b.status || b.Status) === 'RoutePlanned');
        setRouteBookings(planned);
        if (planned.length > 0) {
          setSelectedBookingId((prev) => prev || planned[0].bookingId || planned[0].BookingID);
        }
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
  }, [statusFilter, refreshKey, t]);

  // Mặc định mở chuyến đầu danh sách
  const activeId = selectedId || trips[0]?.tripId || null;

  useEffect(() => {
    if (!activeId) return undefined;
    let active = true;
    tripService
      .getTripById(activeId)
      .then((res) => {
        if (active) setDetail(unwrapData(res));
      })
      .catch((err) => {
        if (active) message.error(getErrorMessage(err, t('tripPlan.messages.loadFailed')));
      });
    return () => {
      active = false;
    };
  }, [activeId, refreshKey, t]);
  const shownDetail = detail?.tripId === activeId ? detail : null;

  const handleApprove = async () => {
    setActionLoading(true);
    try {
      const res = unwrapData(await tripService.approvePlan(shownDetail.tripId));
      message.success(t('routeApproval.messages.approved', { code: res.tripCode }));
      setSearchParams({});
      refresh();
    } catch (err) {
      message.error(getErrorMessage(err, t('routeApproval.messages.failed')));
    } finally {
      setActionLoading(false);
    }
  };

  const handleReject = async () => {
    if (!rejectReason.trim()) {
      message.warning(t('routeApproval.messages.reasonRequired'));
      return;
    }
    setActionLoading(true);
    try {
      const res = unwrapData(await tripService.rejectPlan(shownDetail.tripId, { reason: rejectReason.trim() }));
      message.success(
        res.overallStatus === 'Cancelled'
          ? t('routeApproval.messages.rejectedCancelled', { code: res.tripCode })
          : t('routeApproval.messages.rejected', { code: res.tripCode }),
      );
      setRejectOpen(false);
      setRejectReason('');
      setSearchParams({});
      refresh();
    } catch (err) {
      message.error(getErrorMessage(err, t('routeApproval.messages.failed')));
    } finally {
      setActionLoading(false);
    }
  };

const selectedBooking = routeBookings.find((b) => (b.bookingId || b.BookingID) === selectedBookingId) || routeBookings[0] || null;
  const isPending = shownDetail?.overallStatus === 'PendingApproval';
  const lastChance = (shownDetail?.planRejectionCount || 0) >= MAX_PLAN_REJECTIONS - 1;

  return (
    <div style={{ paddingBottom: 40 }}>
      <PageHeader
        title={t('routeApproval.title')}
        subtitle={t('routeApproval.subtitle')}
        actions={
          <Button icon={<ReloadOutlined />} onClick={refresh}>
            {t('tripPlan.actions.refresh')}
          </Button>
        }
      />


        <Tabs
          activeKey={approvalTab}
          onChange={setApprovalTab}
          style={{ marginBottom: 16 }}
          items={[
            {
              key: 'bookingRoutes',
              label: `${t('routeApproval.tabs.bookingRoutes', 'Tuyến đơn hàng (R-10)')} (${routeBookings.length})`,
              children: (
                <Row gutter={[16, 16]}>
                  <Col xs={24} lg={8}>
                    <Card style={{ borderRadius: 14 }} styles={{ body: { padding: 12 } }}>
                      <div style={{ marginBottom: 8, fontWeight: 600, color: '#0F172A' }}>
                        {t('routeApproval.pendingListTitle', 'Đơn đã lập tuyến chờ duyệt')}
                      </div>
                      <List
                        loading={loading}
                        dataSource={routeBookings}
                        locale={{ emptyText: <Empty description={t('routeApproval.emptyBookingRoutes', 'Không có đơn nào chờ duyệt tuyến')} /> }}
                        renderItem={(b) => {
                          const bId = b.bookingId || b.BookingID;
                          const isSel = bId === (selectedBooking?.bookingId || selectedBooking?.BookingID);
                          return (
                            <List.Item
                              onClick={() => setSelectedBookingId(bId)}
                              style={{
                                cursor: 'pointer',
                                padding: '10px 12px',
                                borderRadius: 10,
                                backgroundColor: isSel ? '#EFF6FF' : undefined,
                                border: isSel ? '1px solid #BFDBFE' : '1px solid transparent',
                              }}
                            >
                              <div style={{ width: '100%' }}>
                                <Flex justify="space-between" align="center">
                                  <Text strong>{b.bookingCode || b.BookingCode || '#' + bId}</Text>
                                  <StatusTag status={b.status || b.Status} />
                                </Flex>
                                <div style={{ fontSize: 12, color: '#64748B' }}>
                                  {b.customerName || b.CustomerName} · {b.totalHorses || b.TotalHorses || (b.horses ? b.horses.length : 1)} ngựa
                                </div>
                                <div style={{ fontSize: 12, color: '#64748B' }}>
                                  {b.pickupCountryCode || 'VN'} → {b.dropoffCountryCode || 'CN'}
                                </div>
                              </div>
                            </List.Item>
                          );
                        }}
                      />
                    </Card>
                  </Col>
                  <Col xs={24} lg={16}>
                    {selectedBooking ? (
                      <BookingRouteApprovalCard booking={selectedBooking} onRefresh={refresh} />
                    ) : (
                      <Card style={{ borderRadius: 14 }}>
                        <Empty description={t('routeApproval.noBookingSelected', 'Chọn một đơn hàng để xem tuyến và chốt giá trị ngựa')} />
                      </Card>
                    )}
                  </Col>
                </Row>
              ),
            },
            {
              key: 'tripPlans',
              label: `${t('routeApproval.tabs.tripPlans', 'Kế hoạch chuyến xe')} (${trips.length})`,
              children: (
      <Row gutter={[16, 16]}>
        <Col xs={24} lg={8}>
          <Card style={{ borderRadius: 14 }} styles={{ body: { padding: 12 } }}>
            <Segmented
              block
              value={statusFilter}
              onChange={(v) => {
                setStatusFilter(v);
                setSearchParams({});
              }}
              options={[
                { value: 'PendingApproval', label: t('routeApproval.filters.pending') },
                { value: 'Scheduled', label: t('routeApproval.filters.scheduled') },
                { value: 'Draft', label: t('routeApproval.filters.returned') },
              ]}
              style={{ marginBottom: 12 }}
            />
            <List
              loading={loading}
              dataSource={trips}
              locale={{ emptyText: <Empty description={t('routeApproval.empty')} /> }}
              renderItem={(tr) => (
                <List.Item
                  onClick={() => setSearchParams({ id: String(tr.tripId) })}
                  style={{
                    cursor: 'pointer',
                    padding: '10px 12px',
                    borderRadius: 10,
                    backgroundColor: tr.tripId === activeId ? '#FFFBEB' : undefined,
                    border: tr.tripId === activeId ? '1px solid #FDE68A' : '1px solid transparent',
                  }}
                >
                  <div style={{ width: '100%' }}>
                    <Flex justify="space-between" align="center">
                      <Text strong>{tr.tripCode}</Text>
                      <StatusTag status={tr.overallStatus} />
                    </Flex>
                    <div style={{ fontSize: 12, color: '#64748b' }}>
                      {tr.vehicleCode} · {t('tripPlan.fields.horseCount', { count: tr.horseCount })}
                    </div>
                    <div style={{ fontSize: 12, color: '#64748b' }}>
                      {dayjs(tr.plannedStartDate).format('DD/MM/YYYY HH:mm')} → {dayjs(tr.plannedEndDate).format('DD/MM/YYYY HH:mm')}
                    </div>
                  </div>
                </List.Item>
              )}
            />
          </Card>
        </Col>

        <Col xs={24} lg={16}>
          {!activeId ? (
            <Card style={{ borderRadius: 14 }}>
              <Empty description={t('routeApproval.empty')} />
            </Card>
          ) : !shownDetail ? (
            <div style={{ textAlign: 'center', padding: 60 }}>
              <Spin />
            </div>
          ) : (
            <Space direction="vertical" size={16} style={{ width: '100%' }}>
              <Card style={{ borderRadius: 14 }} styles={{ body: { padding: '14px 18px' } }}>
                <Flex justify="space-between" align="center" wrap="wrap" gap={12}>
                  <div>
                    <Text strong style={{ fontSize: 18 }}>
                      {shownDetail.tripCode}
                    </Text>
                    <div style={{ fontSize: 12, color: '#64748b' }}>
                      {t('tripPlan.fields.plannedBy')}: {shownDetail.plannedByName || '—'}
                    </div>
                  </div>
                  {isPending && (
                    <Space>
                      <Button danger icon={<CloseOutlined />} onClick={() => setRejectOpen(true)} disabled={actionLoading}>
                        {t('routeApproval.actions.reject')}
                      </Button>
                      <Button
                        type="primary"
                        icon={<CheckOutlined />}
                        loading={actionLoading}
                        onClick={handleApprove}
                        style={{ backgroundColor: '#F59E0B', borderColor: '#F59E0B', color: '#0f172a', fontWeight: 700 }}
                      >
                        {t('routeApproval.actions.approve')}
                      </Button>
                    </Space>
                  )}
                </Flex>
              </Card>
              <TripPlanSummary trip={shownDetail} />
            </Space>
          )}
        </Col>
      </Row>
              ),
            },
          ]}
        />

<Modal
        title={t('routeApproval.rejectTitle', { code: shownDetail?.tripCode || '' })}
        open={rejectOpen}
        onCancel={() => setRejectOpen(false)}
        onOk={handleReject}
        okText={t('routeApproval.actions.reject')}
        okButtonProps={{ danger: true }}
        confirmLoading={actionLoading}
        destroyOnHidden
      >
        {lastChance && (
          <Alert type="error" showIcon style={{ marginBottom: 12 }} message={t('routeApproval.lastChance')} />
        )}
        <TextArea
          rows={4}
          maxLength={500}
          showCount
          value={rejectReason}
          onChange={(e) => setRejectReason(e.target.value)}
          placeholder={t('routeApproval.reasonPlaceholder')}
        />
      </Modal>
    </div>
  );
}
