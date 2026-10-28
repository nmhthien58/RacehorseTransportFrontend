// Đang tạo CustomerQuoteCard vì khách cần xem báo giá chốt, hợp đồng, chấp nhận & đặt cọc hoặc từ chối (FE-05, FE-17; R-10, R-17)
import { useEffect, useMemo, useState } from 'react';
import { Alert, Button, Card, Col, Divider, Flex, Input, Modal, Row, Space, Statistic, Table, Tag, Typography, message } from 'antd';
import { CloseCircleOutlined, EyeOutlined, FileDoneOutlined, ReloadOutlined, SafetyCertificateOutlined } from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import dayjs from 'dayjs';
import RouteMap from '@components/common/map/RouteMap';
import PolicyAgreement from '@components/common/PolicyAgreement';
import { useContractViewer, isContractChangedError } from '@components/common/ContractViewer';
import usePolicy from '@hooks/usePolicy';
import bookingService from '@services/bookingService';
import contractService from '@services/contractService';
import paymentService from '@services/paymentService';
import routePlanService from '@services/routePlanService';
import { unwrapData, unwrapList, getErrorMessage } from '@utils/apiHelpers';
import { ROUTES } from '@routes/routes';

const { Text, Title } = Typography;

const formatUsd = (value) => `${Number(value || 0).toLocaleString('en-US', { maximumFractionDigits: 2 })} USD`;
const formatVnd = (value) => `${Math.round(Number(value || 0)).toLocaleString('vi-VN')} ₫`;
const formatTime = (value) => (value ? dayjs(value).format('DD/MM/YYYY HH:mm') : '—');

/**
 * Thông tin điền sẵn cho form tạo đơn khi khách gửi lại yêu cầu từ đơn có báo giá đã hết hạn.
 * Chi tiết đơn không trả tọa độ: lấy từ mốc đầu / cuối của tuyến đã duyệt (nếu có) để ghim sẵn trên bản đồ.
 * @param {Object} booking - Chi tiết đơn
 * @param {Object|null} routePlan - Tuyến Approved của đơn
 * @returns {Object} initialValues cho BookingWizard (qua location.state)
 */
function buildResubmitState(booking, routePlan) {
  const stops = routePlan?.stops || [];
  const origin = stops[0];
  const destination = stops[stops.length - 1];
  return {
    transportMode: booking.transportMode,
    pickupAddress: booking.pickupAddress,
    pickupCountryCode: booking.pickupCountryCode,
    pickupLat: origin?.lat,
    pickupLng: origin?.lng,
    dropoffAddress: booking.dropoffAddress,
    dropoffCountryCode: booking.dropoffCountryCode,
    dropoffLat: destination?.lat,
    dropoffLng: destination?.lng,
    requiresClimateControl: booking.requiresClimateControl,
    specialInstructions: booking.specialInstructions,
    horses: (booking.horses || []).map((h) => ({ horseId: h.horseId, stallClass: h.stallClass })),
  };
}

/**
 * Thẻ báo giá chốt trên trang chi tiết đơn của khách.
 * - `Quoted`: bảng giá chốt (USD + VND), tiền cọc, bản đồ tuyến đã duyệt, đếm ngược hạn chấp nhận, xem hợp đồng,
 *   tích "đã đọc hợp đồng và Chính sách" (chỉ bật sau khi mở hợp đồng), Chấp nhận & đặt cọc (→ VNPay), Từ chối báo giá.
 * - `AwaitingDeposit` (đã chấp nhận, chưa cọc): nhắc đặt cọc trước hạn báo giá + nút đặt cọc.
 * - `QuoteExpired`: báo hết hạn + nút gửi lại yêu cầu (form tạo đơn điền sẵn).
 * Trạng thái khác: không hiện.
 *
 * @param {{ booking: Object, onChanged?: () => void }} props
 * @returns {JSX.Element|null}
 */
export default function CustomerQuoteCard({ booking, onChanged }) {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { policy } = usePolicy();
  const { view, viewer } = useContractViewer();

  const status = booking.status;
  const bookingId = booking.bookingId;
  const isQuoted = status === 'Quoted';
  const usdVndRate = Number(booking.payment?.usdVndRate || policy?.payment?.usdVndRate || 0);
  const depositPercent = Number(booking.payment?.depositPercent ?? policy?.payment?.depositPercent ?? 0);
  const total = Number(booking.estimatedCost || 0);
  const deposit = Math.round(total * depositPercent) / 100;

  const [routePlan, setRoutePlan] = useState(null);
  const [contract, setContract] = useState(null);
  const [contractError, setContractError] = useState(null);
  const [contractKey, setContractKey] = useState(0);
  const [openedContract, setOpenedContract] = useState(null);
  const [agreement, setAgreement] = useState({ accepted: false, policyVersion: null });
  const [accepting, setAccepting] = useState(false);
  const [paying, setPaying] = useState(false);
  const [declineOpen, setDeclineOpen] = useState(false);
  const [declineReason, setDeclineReason] = useState('');
  const [declining, setDeclining] = useState(false);

  // Tuyến đã duyệt: vẽ bản đồ khi Quoted, lấy tọa độ điền sẵn khi gửi lại yêu cầu (khách chỉ xem được tuyến Approved)
  useEffect(() => {
    if (!isQuoted && status !== 'QuoteExpired') return undefined;
    let active = true;
    routePlanService
      .getForBooking(bookingId)
      .then((res) => {
        if (active) setRoutePlan(unwrapList(res).find((p) => p.status === 'Approved') || null);
      })
      .catch(() => active && setRoutePlan(null));
    return () => {
      active = false;
    };
  }, [bookingId, isQuoted, status, booking.quotedAt]);

  // Bản hợp đồng nháp đang chờ chấp nhận (link PDF có hạn, mã băm gửi lại khi chấp nhận)
  useEffect(() => {
    if (!isQuoted) return undefined;
    let active = true;
    contractService
      .getCurrent(bookingId)
      .then((res) => {
        if (!active) return;
        setContract(unwrapData(res));
        setContractError(null);
      })
      .catch((err) => active && setContractError(getErrorMessage(err, t('contract.loadFailed'))));
    return () => {
      active = false;
    };
  }, [bookingId, isQuoted, contractKey, t]);

  const legs = useMemo(
    () =>
      (routePlan?.stops || []).slice(1).map((s) => ({
        distanceKm: Number(s.distanceKmFromPrevious || 0),
        durationHours: s.durationHoursFromPrevious,
      })),
    [routePlan],
  );

  if (!['Quoted', 'AwaitingDeposit', 'QuoteExpired'].includes(status)) return null;

  const reloadContract = () => {
    setOpenedContract(null);
    setAgreement({ accepted: false, policyVersion: null });
    setContractKey((k) => k + 1);
  };

  const handleViewContract = () => {
    if (view(contract)) {
      setOpenedContract({ contractId: contract.contractId, fileSha256: contract.fileSha256 });
    } else {
      message.error(t('contract.noFile'));
    }
  };

  // Tạo giao dịch cọc rồi chuyển sang VNPay (cùng luồng với tab Thanh toán)
  const startDeposit = async () => {
    setPaying(true);
    try {
      const res = unwrapData(await paymentService.createPayment(bookingId, 'Deposit'));
      window.location.href = res.paymentUrl;
    } catch (err) {
      message.error(getErrorMessage(err, t('payments.createFailed')));
      setPaying(false);
      onChanged?.();
    }
  };

  const handleAccept = async () => {
    setAccepting(true);
    try {
      const updated = unwrapData(
        await bookingService.acceptQuote(bookingId, {
          contractId: openedContract.contractId,
          contractSha256: openedContract.fileSha256,
          acceptPolicy: true,
          policyVersion: agreement.policyVersion,
        }),
      );
      message.success(t('quote.accepted'));
      if (updated?.payment?.nextPaymentType === 'Deposit') {
        await startDeposit();
      } else {
        // Cấu hình cọc 0%: đơn chuyển thẳng Approved
        onChanged?.();
      }
    } catch (err) {
      if (isContractChangedError(err)) {
        // Công ty vừa lập lại tuyến: báo giá + hạn cũng đổi, tải lại cả đơn lẫn hợp đồng
        message.warning(t('contract.changedReload'));
        reloadContract();
        onChanged?.();
      } else {
        message.error(getErrorMessage(err, t('quote.acceptFailed')));
      }
    } finally {
      setAccepting(false);
    }
  };

  const handleDecline = async () => {
    setDeclining(true);
    try {
      await bookingService.declineQuote(bookingId, { reason: declineReason.trim() || undefined });
      message.success(t('quote.declined'));
      setDeclineOpen(false);
      onChanged?.();
    } catch (err) {
      message.error(getErrorMessage(err, t('quote.declineFailed')));
    } finally {
      setDeclining(false);
    }
  };

  const resubmit = () => navigate(ROUTES.CUSTOMER_BOOKING_NEW, { state: buildResubmitState(booking, routePlan) });

  if (status === 'QuoteExpired') {
    return (
      <Alert
        type="error"
        showIcon
        title={t('quote.expired.title')}
        description={
          <Flex vertical gap={8} align="flex-start" style={{ marginTop: 4 }}>
            <Text>{t('quote.expired.description', { time: formatTime(booking.quoteExpiresAt) })}</Text>
            <Button type="primary" icon={<ReloadOutlined />} onClick={resubmit}>
              {t('quote.expired.resubmit')}
            </Button>
          </Flex>
        }
      />
    );
  }

  const deadline = booking.quoteExpiresAt ? dayjs(booking.quoteExpiresAt).valueOf() : null;
  const countdown = deadline && (
    <Statistic.Timer
      type="countdown"
      value={deadline}
      format={t('quote.countdownFormat')}
      styles={{ content: { fontSize: 20, color: '#dc2626', fontWeight: 600 } }}
    />
  );

  if (status === 'AwaitingDeposit') {
    // Đơn cũ (trước R-10) không có hạn báo giá: tab Thanh toán đã đủ
    if (!booking.quoteExpiresAt) return null;
    return (
      <Alert
        type="warning"
        showIcon
        title={t('quote.awaitingDeposit.title')}
        description={
          <Flex justify="space-between" align="center" wrap="wrap" gap={12} style={{ marginTop: 4 }}>
            <div>
              <Text>
                {t('quote.awaitingDeposit.description', {
                  amount: formatUsd(booking.payment?.depositAmount ?? deposit),
                  time: formatTime(booking.quoteExpiresAt),
                })}
              </Text>
              {countdown}
            </div>
            <Button type="primary" size="large" loading={paying} onClick={startDeposit}>
              {t('quote.awaitingDeposit.pay')}
            </Button>
          </Flex>
        }
      />
    );
  }

  // ===== Quoted =====
  const lineColumns = [
    { title: t('bookings.detailPage.quoteItem'), dataIndex: 'name' },
    { title: t('bookings.detailPage.quantity'), dataIndex: 'quantity', align: 'center', width: 90 },
    { title: t('quote.unitPrice'), dataIndex: 'unitPrice', align: 'right', render: (v) => formatUsd(v) },
    { title: t('bookings.detailPage.amount'), dataIndex: 'amount', align: 'right', render: (v) => formatUsd(v) },
  ];
  const horseColumns = [
    { title: t('bookings.detailPage.horseName'), dataIndex: 'horseName' },
    { title: t('bookings.stallClass'), dataIndex: 'stallClass', render: (v) => <Tag>{v}</Tag> },
    { title: t('quote.agreedValue'), dataIndex: 'agreedValue', align: 'right', render: (v, h) => (v ?? h.declaredValue) != null ? formatUsd(v ?? h.declaredValue) : '—' },
    {
      title: t('quote.insurance'),
      dataIndex: 'insurancePlan',
      render: (v) => <Tag color={v === 'Full' ? 'green' : 'default'}>{t(`quote.insurancePlan.${v || 'None'}`)}</Tag>,
    },
  ];
  const openedCurrent = contract && openedContract?.contractId === contract.contractId;
  const canAccept = openedCurrent && agreement.accepted && agreement.policyVersion;

  return (
    <Card
      style={{ borderColor: '#f59e0b' }}
      title={
        <Space>
          <FileDoneOutlined style={{ color: '#d97706' }} />
          {t('quote.title')}
        </Space>
      }
    >
      {viewer}
      <Row gutter={[20, 20]}>
        <Col xs={24} lg={14}>
          <Flex vertical gap={16}>
            <Text type="secondary">{t('quote.intro')}</Text>
            <Table
              rowKey={(r) => `${r.code}-${r.name}`}
              columns={lineColumns}
              dataSource={booking.quoteLines || []}
              pagination={false}
              size="small"
              scroll={{ x: 520 }}
            />
            <Table
              rowKey="bookingHorseId"
              columns={horseColumns}
              dataSource={booking.horses || []}
              pagination={false}
              size="small"
              scroll={{ x: 520 }}
            />
            {routePlan?.stops?.length > 1 && (
              <div>
                <Flex justify="space-between" wrap="wrap" gap={8} style={{ marginBottom: 8 }}>
                  <Text strong>{t('quote.route')}</Text>
                  <Space size={4} wrap>
                    <Text type="secondary">{t('quote.transitCountries')}:</Text>
                    {(routePlan.transitCountryCodes || []).length
                      ? routePlan.transitCountryCodes.map((c) => <Tag key={c}>{c}</Tag>)
                      : <Text type="secondary">{t('quote.noTransit')}</Text>}
                  </Space>
                </Flex>
                <RouteMap
                  stops={routePlan.stops}
                  polyline={routePlan.polyline}
                  legs={legs}
                  totalDistanceKm={routePlan.totalDistanceKm}
                  totalDurationHours={routePlan.estimatedHours}
                  isEstimate={routePlan.isEstimate}
                  height={320}
                />
              </div>
            )}
          </Flex>
        </Col>

        <Col xs={24} lg={10}>
          <Card size="small" style={{ background: '#fffbeb', borderColor: '#fde68a' }}>
            <Flex vertical gap={6}>
              <Text type="secondary">{t('quote.total')}</Text>
              <Title level={3} style={{ margin: 0, color: '#d97706' }}>
                {formatUsd(total)}
              </Title>
              {usdVndRate > 0 && <Text type="secondary">≈ {formatVnd(total * usdVndRate)}</Text>}
              <Divider style={{ margin: '8px 0' }} />
              <Flex justify="space-between" wrap="wrap">
                <Text>{t('quote.deposit', { percent: depositPercent })}</Text>
                <Text strong>{formatUsd(deposit)}</Text>
              </Flex>
              {usdVndRate > 0 && (
                <Text type="secondary" style={{ textAlign: 'right' }}>
                  ≈ {formatVnd(deposit * usdVndRate)}
                </Text>
              )}
              <Flex justify="space-between" wrap="wrap">
                <Text>{t('quote.balance')}</Text>
                <Text>{formatUsd(total - deposit)}</Text>
              </Flex>
              <Divider style={{ margin: '8px 0' }} />
              <Text type="secondary">{t('quote.expiresAt', { time: formatTime(booking.quoteExpiresAt) })}</Text>
              {countdown}
            </Flex>
          </Card>

          <Flex vertical gap={12} style={{ marginTop: 16 }}>
            {contractError ? (
              <Alert type="error" showIcon title={contractError} />
            ) : (
              <Space wrap>
                <Button icon={<EyeOutlined />} onClick={handleViewContract} disabled={!contract}>
                  {t('contract.view')}
                </Button>
                {contract && (
                  <Text type="secondary">
                    {contract.contractCode} · v{contract.version}
                  </Text>
                )}
              </Space>
            )}
            {!openedCurrent && <Text type="secondary">{t('contract.openFirst')}</Text>}
            <PolicyAgreement
              accepted={agreement.accepted}
              disabled={!openedCurrent}
              labelKey="contract.agreementLabel"
              onChange={setAgreement}
            />
            <Button
              type="primary"
              size="large"
              block
              icon={<SafetyCertificateOutlined />}
              loading={accepting || paying}
              disabled={!canAccept}
              onClick={handleAccept}
            >
              {t('quote.acceptAndPay')}
            </Button>
            <Text type="secondary" style={{ fontSize: 12 }}>
              {t('quote.acceptNote')}
            </Text>
            <Button danger block icon={<CloseCircleOutlined />} onClick={() => setDeclineOpen(true)}>
              {t('quote.decline')}
            </Button>
          </Flex>
        </Col>
      </Row>

      <Modal
        open={declineOpen}
        title={t('quote.declineTitle')}
        okText={t('quote.decline')}
        okButtonProps={{ danger: true, loading: declining }}
        cancelText={t('common.cancel')}
        onOk={handleDecline}
        onCancel={() => setDeclineOpen(false)}
      >
        <Flex vertical gap={10}>
          <Text>{t('quote.declineDescription')}</Text>
          <Input.TextArea
            rows={3}
            maxLength={500}
            showCount
            value={declineReason}
            placeholder={t('quote.declineReasonPlaceholder')}
            onChange={(e) => setDeclineReason(e.target.value)}
          />
        </Flex>
      </Modal>
    </Card>
  );
}
