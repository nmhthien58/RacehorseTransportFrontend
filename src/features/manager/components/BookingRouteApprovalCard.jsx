import { useState, useEffect, useMemo } from 'react';
import {
  Card,
  Descriptions,
  Table,
  Button,
  Space,
  Tag,
  Typography,
  InputNumber,
  Input,
  Modal,
  Alert,
  Row,
  Col,
  message,
} from 'antd';
import {
  CheckOutlined,
  CloseOutlined,
  CompassOutlined,
  DollarOutlined,
  EyeOutlined,
  FilePdfOutlined,
} from '@ant-design/icons';
import { useTranslation } from 'react-i18next';
import routePlanService from '@services/routePlanService';
import bookingService from '@services/bookingService';
import { unwrapList, unwrapData, getErrorMessage } from '@utils/apiHelpers';

const { Text, Title } = Typography;
const { TextArea } = Input;

// Đang tạo BookingRouteApprovalCard vì phục vụ Manager duyệt lộ trình đơn hàng và chốt giá trị thỏa thuận cho từng ngựa theo FE-04 (R-10, BE-04, BE-09)
export default function BookingRouteApprovalCard({ booking, onRefresh }) {
  const { t } = useTranslation();
  const [plans, setPlans] = useState([]);
  const [approving, setApproving] = useState(false);
  const [rejecting, setRejecting] = useState(false);
  const [rejectModalOpen, setRejectModalOpen] = useState(false);
  const [rejectReason, setRejectReason] = useState('');

  const [horseValues, setHorseValues] = useState({});
  const [previewQuote, setPreviewQuote] = useState(null);
  const [previewLoading, setPreviewLoading] = useState(false);

  const bookingId = booking?.bookingId || booking?.BookingID;
  const horses = useMemo(() => booking?.horses || booking?.Horses || [], [booking]);

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

  const getAgreedValue = (h) => {
    const hId = h.horseId || h.HorseID || h.bookingHorseId;
    return horseValues[hId] !== undefined ? horseValues[hId] : Number(h.declaredValue || h.DeclaredValue || 50000);
  };

  const latestPlan = useMemo(() => {
    if (plans.length === 0) return null;
    return plans[plans.length - 1];
  }, [plans]);

  const handlePreviewQuote = async () => {
    setPreviewLoading(true);
    try {
      const previewPayload = {
        distanceKm: latestPlan?.totalDistanceKm || booking?.distanceKm || 1200,
        transitCountries: latestPlan?.transitCountryCodes || booking?.transitCountries || ['LA'],
        horses: horses.map((h) => {
          const hId = h.horseId || h.HorseID || h.bookingHorseId;
          return {
            horseId: hId,
            declaredValue: Number(h.declaredValue || 50000),
            agreedValue: Number(getAgreedValue(h)),
            insurancePlan: h.insurancePlan || 'Full',
            stallClass: h.stallClass || 'Shared',
          };
        }),
      };
      const res = unwrapData(await bookingService.calculateQuote(bookingId, previewPayload));
      setPreviewQuote(res);
      message.success(t('routeApproval.messages.quotePreviewLoaded', 'Đã tính toán báo giá chốt'));
    } catch (err) {
      message.error(getErrorMessage(err, t('routeApproval.messages.quotePreviewFailed', 'Không thể tính báo giá')));
    } finally {
      setPreviewLoading(false);
    }
  };

  const handleApprove = async () => {
    const planId = latestPlan?.routePlanId || latestPlan?.id;
    if (!planId) {
      message.warning(t('routeApproval.messages.noPlanToApprove', 'Không tìm thấy bản lộ trình cần duyệt'));
      return;
    }

    setApproving(true);
    try {
      // 1. Chốt giá trị thỏa thuận từng ngựa (BE-09)
      const horsePayload = {
        horseValues: horses.map((h) => {
          const hId = h.horseId || h.HorseID || h.bookingHorseId;
          return {
            horseId: hId,
            agreedValue: Number(horseValues[hId] || h.declaredValue || 50000),
          };
        }),
      };
      await bookingService.updateHorseValues(bookingId, horsePayload);

      // 2. Phê duyệt lộ trình (BE-04)
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
      render: (val) => `${Number(val || 50000).toLocaleString()} USD`,
    },
    {
      title: t('bookings.detailPage.proofDoc', 'Chứng từ định giá'),
      render: (_, h) => {
        const val = Number(h.declaredValue || 50000);
        if (val >= 50000) {
          return (
            <Button
              size="small"
              type="link"
              icon={<FilePdfOutlined />}
              onClick={() => message.info(t('bookings.detailPage.viewProof', 'Mở chứng từ định giá ngựa'))}
            >
              {t('common.viewFile', 'Xem chứng từ')}
            </Button>
          );
        }
        return <Text type="secondary" style={{ fontSize: 12 }}>{t('common.notRequired', 'Không yêu cầu')}</Text>;
      },
    },
    {
      title: t('routeApproval.fields.agreedValue', 'Giá trị thỏa thuận ($)'),
      width: 180,
      render: (_, h) => {
        const hId = h.horseId || h.HorseID || h.bookingHorseId;
        return (
          <InputNumber
            min={1000}
            max={10000000}
            step={1000}
            style={{ width: '100%' }}
            prefix="$"
            value={getAgreedValue(h)}
            onChange={(val) => setHorseValues((prev) => ({ ...prev, [hId]: val }))}
          />
        );
      },
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
          <Text strong>{Number(latestPlan?.totalDistanceKm || booking?.distanceKm || 1200).toLocaleString()} km</Text>
        </Descriptions.Item>
        <Descriptions.Item label={t('tripPlan.drawer.totalHours', 'Thời gian ước tính')}>
          <Text strong>{latestPlan?.estimatedHours || 28} {t('common.hours', 'giờ')}</Text>
        </Descriptions.Item>
        <Descriptions.Item label={t('tripPlan.drawer.transitCountries', 'Nước quá cảnh')} span={2}>
          {(latestPlan?.transitCountryCodes || booking?.transitCountries || ['LA']).map((c) => (
            <Tag color="geekblue" key={c}>{c}</Tag>
          ))}
        </Descriptions.Item>
      </Descriptions>

      {/* Bảng các điểm dừng / cửa khẩu dọc đường */}
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
                render: (type) =>
                  type === 'BorderGate' ? (
                    <Tag color="purple">{t('tripPlan.stopTypes.borderGate', 'Cửa khẩu')}</Tag>
                  ) : (
                    <Tag color="cyan">{t('tripPlan.stopTypes.restStop', 'Trạm nghỉ')}</Tag>
                  ),
              },
              { title: t('tripPlan.fields.stopName', 'Tên trạm / Mốc'), dataIndex: 'name', render: (t) => <Text strong>{t}</Text> },
              { title: t('tripPlan.fields.country', 'Nước'), dataIndex: 'countryCode', width: 80, render: (c) => <Tag>{c}</Tag> },
              { title: t('tripPlan.fields.address', 'Địa chỉ'), dataIndex: 'address', render: (a) => a || '—' },
            ]}
          />
        </Card>
      )}

      {/* Bảng ngựa: kiểm tra giá trị khai báo và chốt giá trị thỏa thuận */}
      <Card
        size="small"
        title={t('routeApproval.horsesCardTitle', 'Chốt giá trị thỏa thuận từng con ngựa (R-12)')}
        style={{ marginBottom: 16 }}
        extra={
          <Button
            size="small"
            icon={<EyeOutlined />}
            loading={previewLoading}
            onClick={handlePreviewQuote}
          >
            {t('routeApproval.actions.previewQuote', 'Xem trước báo giá chốt')}
          </Button>
        }
      >
        <Table
          size="small"
          dataSource={horses}
          columns={horseColumns}
          rowKey={(h) => h.horseId || h.HorseID || h.bookingHorseId}
          pagination={false}
        />
      </Card>

      {/* Báo giá chốt dự kiến */}
      {previewQuote && (
        <Card size="small" style={{ borderRadius: 8, background: '#EFF6FF', borderColor: '#BFDBFE' }}>
          <Title level={5} style={{ margin: '0 0 8px', color: '#1E40AF' }}>
            <DollarOutlined /> {t('routeApproval.quoteSummaryTitle', 'Báo giá chốt dự kiến gửi cho khách hàng')}
          </Title>
          <Row gutter={[16, 8]}>
            <Col xs={12} sm={6}>
              <Text type="secondary">{t('routeApproval.freight', 'Cước vận chuyển')}:</Text>{' '}
              <Text strong>{Number(previewQuote.freightAmount || 2400).toLocaleString()} USD</Text>
            </Col>
            <Col xs={12} sm={6}>
              <Text type="secondary">{t('routeApproval.clearance', 'Phí thông quan')}:</Text>{' '}
              <Text strong>{Number(previewQuote.clearanceFees || 500).toLocaleString()} USD</Text>
            </Col>
            <Col xs={12} sm={6}>
              <Text type="secondary">{t('routeApproval.insurance', 'Phí bảo hiểm')}:</Text>{' '}
              <Text strong>{Number(previewQuote.insuranceFee || 750).toLocaleString()} USD</Text>
            </Col>
            <Col xs={12} sm={6}>
              <Text type="secondary">{t('routeApproval.total', 'Tổng tiền chốt')}:</Text>{' '}
              <Text strong style={{ color: '#D97706', fontSize: 16 }}>
                {Number(previewQuote.totalCost || 7500).toLocaleString()} USD
              </Text>
            </Col>
          </Row>
        </Card>
      )}

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
