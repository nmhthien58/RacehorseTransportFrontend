import { useState, useEffect, useMemo } from 'react';
import {
  Card,
  Descriptions,
  Table,
  Button,
  Space,
  Tag,
  Typography,
  Input,
  Modal,
  Alert,
  message,
} from 'antd';
import {
  CheckOutlined,
  CloseOutlined,
  CompassOutlined,
  DollarOutlined,
} from '@ant-design/icons';
import { useTranslation } from 'react-i18next';
import RouteMap from '@components/common/map/RouteMap';
import routePlanService from '@services/routePlanService';
import bookingService from '@services/bookingService';
import { unwrapList, unwrapData, getErrorMessage } from '@utils/apiHelpers';

const { Text } = Typography;
const { TextArea } = Input;

// Đang tạo BookingRouteApprovalCard vì phục vụ Manager duyệt lộ trình đơn hàng và chốt giá trị thỏa thuận cho từng ngựa theo FE-04 (R-10, BE-04, BE-09)
export default function BookingRouteApprovalCard({ booking, onRefresh }) {
  const { t } = useTranslation();
  const [plans, setPlans] = useState([]);
  const [approving, setApproving] = useState(false);
  const [rejecting, setRejecting] = useState(false);
  const [rejectModalOpen, setRejectModalOpen] = useState(false);
  const [rejectReason, setRejectReason] = useState('');

  // Kết quả xem trước báo giá, gắn với bản tuyến đã tính
  const [quoteResult, setQuoteResult] = useState({ planId: null, quote: null, error: null });

  const bookingId = booking?.bookingId || booking?.BookingID;
  // Danh sách đơn chỉ có thông tin tóm tắt: tải chi tiết để có danh sách ngựa và giá trị khai báo
  const [detail, setDetail] = useState(null);
  useEffect(() => {
    if (!bookingId) return undefined;
    let active = true;
    bookingService
      .getBookingById(bookingId)
      .then((res) => active && setDetail(unwrapData(res)))
      .catch(() => active && setDetail(null));
    return () => {
      active = false;
    };
  }, [bookingId]);
  const horses = useMemo(() => {
    const source = detail?.bookingId === bookingId ? detail : booking;
    return source?.horses || source?.Horses || [];
  }, [detail, booking, bookingId]);

  // Tải danh sách lộ trình đã lập của đơn
  useEffect(() => {
    if (!bookingId) return;
    let active = true;
    routePlanService
      .getForBooking(bookingId)
      .then((res) => {
        if (!active) return;
        const list = unwrapList(res);
        setPlans(list);
      })
      .catch(() => {
        if (active) setPlans([]);
      });



    return () => {
      active = false;
    };
  }, [bookingId, horses]);

  const latestPlan = useMemo(() => {
    if (plans.length === 0) return null;
    // Ưu tiên bản đang chờ duyệt; không có thì lấy bản mới nhất
    return plans.find((p) => p.status === 'Submitted') || plans[plans.length - 1];
  }, [plans]);

  // Giá hệ thống tính nếu duyệt tuyến này (cùng cách tính lúc phát hành báo giá chốt)
  const planIdForQuote = latestPlan?.status === 'Submitted' ? latestPlan.routePlanId : null;
  useEffect(() => {
    if (!planIdForQuote) return undefined;
    let active = true;
    routePlanService
      .getQuotePreview(planIdForQuote)
      .then((res) => active && setQuoteResult({ planId: planIdForQuote, quote: unwrapData(res), error: null }))
      .catch((err) => {
        if (active) setQuoteResult({ planId: planIdForQuote, quote: null, error: getErrorMessage(err, 'Không tính được báo giá chốt') });
      });
    return () => {
      active = false;
    };
  }, [planIdForQuote]);
  const quoteCurrent = quoteResult.planId === planIdForQuote;
  const quote = quoteCurrent ? quoteResult.quote : null;
  const quoteError = quoteCurrent ? quoteResult.error : null;
  const quoteLoading = Boolean(planIdForQuote) && !quoteCurrent;

  const handleApprove = async () => {
    const planId = latestPlan?.routePlanId || latestPlan?.id;
    if (!planId) {
      message.warning(t('routeApproval.messages.noPlanToApprove', 'Không tìm thấy bản lộ trình cần duyệt'));
      return;
    }

    setApproving(true);
    try {
      await routePlanService.approveRoutePlan(planId);

      message.success(t('routeApproval.messages.approvedAndQuoted', 'Đã duyệt tuyến và gửi báo giá chốt cho khách hàng'));
      onRefresh?.();
    } catch (err) {
      message.error(getErrorMessage(err, t('routeApproval.messages.approveFailed', 'Duyệt tuyến thất bại')));
    } finally {
      setApproving(false);
    }
  };

  const handleReject = async () => {
    const planId = latestPlan?.routePlanId || latestPlan?.id;
    if (!planId) return;

    if (!rejectReason.trim()) {
      message.warning(t('routeApproval.messages.reasonRequired', 'Vui lòng nhập lý do từ chối'));
      return;
    }

    setRejecting(true);
    try {
      await routePlanService.rejectRoutePlan(planId, rejectReason.trim());
      message.success(t('routeApproval.messages.rejectedSuccess', 'Đã trả tuyến về cho Điều phối viên chỉnh sửa'));
      setRejectModalOpen(false);
      setRejectReason('');
      onRefresh?.();
    } catch (err) {
      message.error(getErrorMessage(err, t('routeApproval.messages.rejectFailed', 'Từ chối thất bại')));
    } finally {
      setRejecting(false);
    }
  };

  const horseColumns = [
    {
      title: t('bookings.detailPage.horseName', 'Tên ngựa'),
      dataIndex: 'horseName',
      render: (name, h) => (
        <div>
          <Text strong>{name}</Text>
          <div style={{ fontSize: 12, color: '#64748B' }}>
            {h.breed || '—'} · {h.microchipNumber || 'Chưa gắn chip'}
          </div>
        </div>
      ),
    },
    {
      title: t('bookings.detailPage.declaredValue', 'Giá trị khai báo ($)'),
      dataIndex: 'declaredValue',
      align: 'right',
      render: (val) => (Number(val) > 0 ? `$${Number(val).toLocaleString('en-US')}` : 'Không khai báo'),
    },
    {
      title: 'Giá trị thỏa thuận ($)',
      dataIndex: 'agreedValue',
      align: 'right',
      render: (val) => (Number(val) > 0 ? <Text strong>${Number(val).toLocaleString('en-US')}</Text> : '—'),
    },
    {
      title: 'Bảo hiểm',
      dataIndex: 'insurancePlan',
      render: (plan) => (plan === 'Full' ? <Tag color="gold">Toàn giá trị</Tag> : <Tag>Không mua</Tag>),
    },
  ];

  return (
    <Card
      title={
        <Space>
          <CompassOutlined style={{ color: '#2563EB' }} />
          <span>
            {t('routeApproval.bookingTitle', 'Duyệt tuyến đơn hàng')} #{booking?.bookingCode || booking?.BookingCode || bookingId}
          </span>
        </Space>
      }
      style={{ borderRadius: 14 }}
      extra={
        <Space>
          <Button
            danger
            icon={<CloseOutlined />}
            onClick={() => setRejectModalOpen(true)}
          >
            {t('routeApproval.actions.rejectRoute', 'Từ chối tuyến')}
          </Button>
          <Button
            type="primary"
            icon={<CheckOutlined />}
            loading={approving}
            onClick={handleApprove}
            style={{ backgroundColor: '#10B981', borderColor: '#10B981', fontWeight: 600 }}
          >
            {t('routeApproval.actions.approveAndQuote', 'Duyệt tuyến & gửi báo giá')}
          </Button>
        </Space>
      }
    >
      {/* Thông tin lộ trình */}
      <Descriptions column={{ xs: 1, sm: 3 }} size="small" style={{ marginBottom: 16 }}>
        <Descriptions.Item label={t('bookings.fields.pickupLocation', 'Điểm đón')}>
          {booking?.pickupAddress || booking?.PickupAddress} ({booking?.pickupCountryCode || 'VN'})
        </Descriptions.Item>
        <Descriptions.Item label={t('bookings.fields.deliveryLocation', 'Điểm trả')}>
          {booking?.dropoffAddress || booking?.DropoffAddress} ({booking?.dropoffCountryCode || 'CN'})
        </Descriptions.Item>
        <Descriptions.Item label={t('tripPlan.drawer.totalDistance', 'Tổng quãng đường')}>
          <Text strong>{latestPlan?.totalDistanceKm != null ? `${Number(latestPlan.totalDistanceKm).toLocaleString()} km` : '—'}</Text>
        </Descriptions.Item>
        <Descriptions.Item label={t('tripPlan.drawer.totalHours', 'Thời gian ước tính')}>
          <Text strong>{latestPlan?.estimatedHours != null ? `${latestPlan.estimatedHours} ${t('common.hours', 'giờ')}` : '—'}</Text>
        </Descriptions.Item>
        <Descriptions.Item label={t('tripPlan.drawer.transitCountries', 'Nước quá cảnh')} span={2}>
          {latestPlan?.transitCountryCodes?.length
            ? latestPlan.transitCountryCodes.map((c) => (
                <Tag color="geekblue" key={c}>{c}</Tag>
              ))
            : 'Không có'}
        </Descriptions.Item>
      </Descriptions>

      {/* Bảng các điểm dừng / cửa khẩu dọc đường */}
      {latestPlan?.stops?.length >= 2 && (
        <div style={{ marginBottom: 16 }}>
          <RouteMap
            stops={latestPlan.stops}
            polyline={latestPlan.polyline}
            legs={latestPlan.stops.slice(1).map((st) => ({
              distanceKm: Number(st.distanceKmFromPrevious || 0),
              durationHours: st.durationHoursFromPrevious,
            }))}
            totalDistanceKm={latestPlan.totalDistanceKm}
            totalDurationHours={latestPlan.estimatedHours}
            isEstimate={latestPlan.isEstimate}
            height={340}
          />
        </div>
      )}

      {latestPlan?.stops && latestPlan.stops.length > 0 && (
        <Card size="small" title={t('tripPlan.drawer.stops', 'Mốc dừng chân & Cửa khẩu')} style={{ marginBottom: 16, background: '#F8FAFC' }}>
          <Table
            size="small"
            dataSource={latestPlan.stops}
            rowKey="stopId"
            pagination={false}
            columns={[
              { title: '#', render: (_, __, idx) => idx + 1, width: 50 },
              {
                title: t('tripPlan.fields.stopType', 'Loại'),
                dataIndex: 'stopType',
                width: 120,
                render: (type) => {
                  if (type === 'BorderGate') return <Tag color="purple">{t('tripPlan.stopTypes.borderGate', 'Cửa khẩu')}</Tag>;
                  if (type === 'Origin') return <Tag color="green">Điểm đón</Tag>;
                  if (type === 'Destination') return <Tag color="red">Điểm giao</Tag>;
                  return <Tag color="cyan">{t('tripPlan.stopTypes.restStop', 'Trạm nghỉ')}</Tag>;
                },
              },
              { title: t('tripPlan.fields.stopName', 'Tên trạm / Mốc'), dataIndex: 'name', render: (t) => <Text strong>{t}</Text> },
              { title: t('tripPlan.fields.country', 'Nước'), dataIndex: 'countryCode', width: 80, render: (c) => <Tag>{c}</Tag> },
              { title: t('tripPlan.fields.address', 'Địa chỉ'), dataIndex: 'address', render: (a) => a || '—' },
            ]}
          />
        </Card>
      )}

      {/* Ngựa: giá trị thỏa thuận đã chốt ở bước duyệt sơ bộ (chỉ xem) */}
      <Card size="small" title="Ngựa & giá trị thỏa thuận (đã chốt khi duyệt sơ bộ)" style={{ marginBottom: 16 }}>
        <Table
          size="small"
          dataSource={horses}
          columns={horseColumns}
          rowKey={(h) => h.bookingHorseId || h.horseId}
          pagination={false}
        />
      </Card>

      {/* Báo giá chốt hệ thống tính theo tuyến này */}
      <Card
        size="small"
        title={
          <span>
            <DollarOutlined /> Báo giá chốt sẽ gửi khách nếu duyệt tuyến
          </span>
        }
        style={{ borderRadius: 8, background: '#EFF6FF', borderColor: '#BFDBFE' }}
        loading={quoteLoading}
      >
        {quoteError && <Alert type="error" showIcon title={quoteError} />}
        {!quoteError && quote && (
          <Table
            size="small"
            pagination={false}
            rowKey={(l, i) => `${l.code}-${i}`}
            dataSource={quote.lines || []}
            columns={[
              { title: 'Khoản', dataIndex: 'name' },
              { title: 'SL', dataIndex: 'quantity', width: 70, align: 'right' },
              {
                title: 'Thành tiền',
                dataIndex: 'amount',
                width: 140,
                align: 'right',
                render: (v) => `$${Number(v).toLocaleString('en-US', { maximumFractionDigits: 2 })}`,
              },
            ]}
            summary={() => (
              <Table.Summary.Row>
                <Table.Summary.Cell index={0} colSpan={2}>
                  <Text strong>Tổng</Text>
                </Table.Summary.Cell>
                <Table.Summary.Cell index={1} align="right">
                  <Text strong style={{ color: '#D97706', fontSize: 16 }}>
                    ${Number(quote.total).toLocaleString('en-US', { maximumFractionDigits: 2 })} {quote.currencyCode || 'USD'}
                  </Text>
                </Table.Summary.Cell>
              </Table.Summary.Row>
            )}
          />
        )}
        {!quoteError && !quote && !quoteLoading && <Text type="secondary">Không có tuyến chờ duyệt.</Text>}
      </Card>

      {/* Modal từ chối tuyến */}
      <Modal
        title={t('routeApproval.rejectModal.title', 'Từ chối phương án tuyến')}
        open={rejectModalOpen}
        onCancel={() => setRejectModalOpen(false)}
        onOk={handleReject}
        confirmLoading={rejecting}
        okText={t('routeApproval.actions.confirmReject', 'Xác nhận từ chối')}
        okButtonProps={{ danger: true }}
        destroyOnClose
      >
        <Alert
          type="info"
          showIcon
          style={{ marginBottom: 12 }}
          message={t('routeApproval.rejectModal.hint', 'Lý do từ chối sẽ được gửi lại cho Coordinator để vẽ lại tuyến hoặc thêm bớt điểm dừng phù hợp.')}
        />
        <TextArea
          rows={3}
          placeholder={t('routeApproval.rejectModal.placeholder', 'Nhập lý do từ chối (bắt buộc: vd thiếu trạm nghỉ, quá xa cửa khẩu...)')}
          value={rejectReason}
          onChange={(e) => setRejectReason(e.target.value)}
        />
      </Modal>
    </Card>
  );
}
