import { useEffect, useMemo, useState } from 'react';
import {
  Alert,
  Button,
  Card,
  Col,
  Empty,
  Flex,
  Input,
  Row,
  Select,
  Spin,
  Table,
  Tag,
  Typography,
  message,
} from 'antd';
import {
  CheckCircleOutlined,
  CreditCardOutlined,
  ReloadOutlined,
  RollbackOutlined,
  SearchOutlined,
  WalletOutlined,
} from '@ant-design/icons';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import dayjs from 'dayjs';
import PageHeader from '@components/layout/PageHeader';
import StatusTag from '@components/common/StatusTag';
import paymentService from '@services/paymentService';
import { unwrapData, getErrorMessage } from '@utils/apiHelpers';
import { ROUTES } from '@routes/routes';

const { Text } = Typography;

const PAYMENT_STATUS_COLORS = {
  Pending: 'processing',
  Succeeded: 'success',
  Failed: 'error',
  Expired: 'default',
};

const PAYMENT_TYPE_COLORS = {
  Deposit: 'gold',
  Balance: 'blue',
  Extra: 'purple',
  Refund: 'green',
};

const PAYMENT_TYPES = ['Deposit', 'Balance', 'Extra', 'Refund'];
const PAYMENT_STATUSES = ['Succeeded', 'Pending', 'Failed', 'Expired'];

/**
 * Định dạng số tiền theo đơn vị tiền tệ của báo giá (USD)
 * @param {number} value
 * @param {string} [currency]
 * @returns {string}
 */
function formatMoney(value, currency = 'USD') {
  return `${Number(value || 0).toLocaleString('en-US', { maximumFractionDigits: 2 })} ${currency}`;
}

/**
 * Định dạng số tiền VND đã quy đổi
 * @param {number} value
 * @returns {string}
 */
function formatVnd(value) {
  return `${Number(value || 0).toLocaleString('vi-VN')} ₫`;
}

/**
 * Đường dẫn tới tab Thanh toán của chi tiết đơn
 * @param {number} bookingId
 * @returns {string}
 */
function bookingPaymentPath(bookingId) {
  return `${ROUTES.CUSTOMER_BOOKING_DETAIL.replace(':id', bookingId)}?tab=payment`;
}

/**
 * Ô thống kê ở đầu trang
 * @param {Object} props
 * @returns {JSX.Element}
 */
function StatCard({ icon, color, label, value, sub }) {
  return (
    <Card style={{ borderRadius: 12, height: '100%' }} styles={{ body: { padding: 20 } }}>
      <Flex gap={14} align="flex-start">
        <div
          style={{
            width: 42,
            height: 42,
            borderRadius: 10,
            background: `${color}1A`,
            color,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: 20,
            flexShrink: 0,
          }}
        >
          {icon}
        </div>
        <div style={{ minWidth: 0 }}>
          <Text type="secondary" style={{ fontSize: 13 }}>
            {label}
          </Text>
          <div style={{ fontSize: 22, fontWeight: 700, lineHeight: 1.3 }}>{value}</div>
          {sub && (
            <Text type="secondary" style={{ fontSize: 12 }}>
              {sub}
            </Text>
          )}
        </div>
      </Flex>
    </Card>
  );
}

/**
 * Trang Thanh toán của khách hàng: tổng quan tiền của mọi đơn, các khoản cần trả ngay
 * và toàn bộ lịch sử giao dịch (đặt cọc, phần còn lại, phát sinh, hoàn tiền).
 * @returns {JSX.Element}
 */
export default function BillingPage() {
  const { t } = useTranslation();
  const [billing, setBilling] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshKey, setRefreshKey] = useState(0);
  const [payingId, setPayingId] = useState(null);
  const [typeFilter, setTypeFilter] = useState();
  const [statusFilter, setStatusFilter] = useState();
  const [keyword, setKeyword] = useState('');

  useEffect(() => {
    let active = true;
    paymentService
      .getMyBilling()
      .then((res) => {
        if (active) setBilling(unwrapData(res));
      })
      .catch((err) => {
        if (active) message.error(getErrorMessage(err, t('payments.loadFailed')));
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, [refreshKey, t]);

  const currency = billing?.currencyCode || 'USD';
  const bookings = useMemo(() => billing?.bookings || [], [billing]);
  const payableBookings = useMemo(
    () => bookings.filter((b) => b.summary?.nextPaymentType),
    [bookings],
  );

  const filteredPayments = useMemo(() => {
    const kw = keyword.trim().toLowerCase();
    return (billing?.payments || []).filter(
      (p) =>
        (!typeFilter || p.paymentType === typeFilter) &&
        (!statusFilter || p.status === statusFilter) &&
        (!kw ||
          p.paymentCode?.toLowerCase().includes(kw) ||
          p.bookingCode?.toLowerCase().includes(kw) ||
          p.providerTxnNo?.toLowerCase().includes(kw)),
    );
  }, [billing, typeFilter, statusFilter, keyword]);

  const handlePay = async (booking) => {
    setPayingId(booking.bookingId);
    try {
      const res = unwrapData(
        await paymentService.createPayment(booking.bookingId, booking.summary.nextPaymentType),
      );
      // Chuyển sang cổng thanh toán; sau khi trả VNPay đưa khách về trang kết quả
      window.location.href = res.paymentUrl;
    } catch (err) {
      message.error(getErrorMessage(err, t('payments.createFailed')));
      setPayingId(null);
    }
  };

  const dueDateOf = (summary) => {
    if (summary.nextPaymentType === 'Balance') return summary.balanceDueAt;
    if (summary.nextPaymentType === 'Extra') return summary.extraDueAt;
    return null;
  };

  const routeOf = (booking) => `${booking.pickupCountryCode} → ${booking.dropoffCountryCode}`;

  const payableColumns = [
    {
      title: t('billing.columns.booking'),
      key: 'booking',
      render: (_, b) => (
        <div>
          <Link to={bookingPaymentPath(b.bookingId)}>
            <Text strong style={{ whiteSpace: 'nowrap' }}>
              {b.bookingCode}
            </Text>
          </Link>
          <br />
          <Text type="secondary" style={{ fontSize: 12 }}>
            {routeOf(b)} · {t('billing.horses', { count: b.totalHorses })}
          </Text>
        </div>
      ),
    },
    {
      title: t('payments.columns.type'),
      key: 'type',
      render: (_, b) => (
        <Tag color={PAYMENT_TYPE_COLORS[b.summary.nextPaymentType]}>
          {t(`payments.types.${b.summary.nextPaymentType}`)}
        </Tag>
      ),
    },
    {
      title: t('payments.columns.amount'),
      key: 'amount',
      align: 'right',
      render: (_, b) => (
        <div style={{ whiteSpace: 'nowrap' }}>
          <Text strong>{formatMoney(b.summary.nextPaymentAmount, currency)}</Text>
          <br />
          <Text type="secondary" style={{ fontSize: 12 }}>
            {formatVnd(b.summary.nextPaymentAmountVnd)}
          </Text>
        </div>
      ),
    },
    {
      title: t('billing.columns.dueAt'),
      key: 'dueAt',
      render: (_, b) => {
        const due = dueDateOf(b.summary);
        if (!due)
          return <Text type="secondary">{t(`billing.dueHint.${b.summary.nextPaymentType}`)}</Text>;
        return (
          <Text type={b.summary.extraOverdue ? 'danger' : undefined}>
            {dayjs(due).format('DD/MM/YYYY')}
            {b.summary.extraOverdue && ` · ${t('billing.overdue')}`}
          </Text>
        );
      },
    },
    {
      title: '',
      key: 'action',
      align: 'right',
      render: (_, b) => (
        <Button
          type="primary"
          icon={<CreditCardOutlined />}
          loading={payingId === b.bookingId}
          disabled={payingId !== null && payingId !== b.bookingId}
          onClick={() => handlePay(b)}
        >
          {t('billing.pay')}
        </Button>
      ),
    },
  ];

  const bookingColumns = [
    {
      title: t('billing.columns.booking'),
      key: 'booking',
      render: (_, b) => (
        <div>
          <Link to={bookingPaymentPath(b.bookingId)}>
            <Text strong style={{ whiteSpace: 'nowrap' }}>
              {b.bookingCode}
            </Text>
          </Link>
          <br />
          <Text type="secondary" style={{ fontSize: 12 }}>
            {routeOf(b)} · {dayjs(b.createdAt).format('DD/MM/YYYY')}
          </Text>
        </div>
      ),
    },
    {
      title: t('payments.columns.status'),
      dataIndex: 'status',
      key: 'status',
      render: (value) => <StatusTag status={value} />,
    },
    {
      title: t('billing.columns.totalDue'),
      key: 'totalDue',
      align: 'right',
      render: (_, b) => formatMoney(b.summary.totalDue, currency),
    },
    {
      title: t('payments.summary.totalPaid'),
      key: 'totalPaid',
      align: 'right',
      render: (_, b) => formatMoney(b.summary.totalPaid, currency),
    },
    {
      title: t('payments.summary.refunded'),
      key: 'refunded',
      align: 'right',
      render: (_, b) =>
        b.summary.refundedAmount > 0 ? (
          <Text style={{ color: '#16a34a' }}>
            {formatMoney(b.summary.refundedAmount, currency)}
          </Text>
        ) : (
          <Text type="secondary">—</Text>
        ),
    },
    {
      title: t('payments.summary.outstanding'),
      key: 'outstanding',
      align: 'right',
      render: (_, b) => (
        <Text strong style={{ color: b.summary.outstanding > 0 ? '#d97706' : undefined }}>
          {formatMoney(b.summary.outstanding, currency)}
        </Text>
      ),
    },
  ];

  const paymentColumns = [
    {
      title: t('payments.columns.code'),
      dataIndex: 'paymentCode',
      key: 'paymentCode',
      render: (value) => <Text strong>{value}</Text>,
    },
    {
      title: t('billing.columns.booking'),
      key: 'bookingCode',
      render: (_, p) => <Link to={bookingPaymentPath(p.bookingId)}>{p.bookingCode}</Link>,
    },
    {
      title: t('payments.columns.type'),
      dataIndex: 'paymentType',
      key: 'paymentType',
      render: (value) => (
        <Tag color={PAYMENT_TYPE_COLORS[value]}>{t(`payments.types.${value}`, value)}</Tag>
      ),
    },
    {
      title: t('payments.columns.amount'),
      dataIndex: 'amount',
      key: 'amount',
      align: 'right',
      render: (value, p) => (
        <div style={{ whiteSpace: 'nowrap' }}>
          <Text strong style={{ color: p.paymentType === 'Refund' ? '#16a34a' : undefined }}>
            {p.paymentType === 'Refund' ? '+ ' : ''}
            {formatMoney(value, p.currencyCode)}
          </Text>
          <br />
          <Text type="secondary" style={{ fontSize: 12 }}>
            {formatVnd(p.amountVnd)}
          </Text>
        </div>
      ),
    },
    {
      title: t('payments.columns.method'),
      dataIndex: 'provider',
      key: 'provider',
      render: (value) => t(`payments.providers.${value}`, value),
    },
    {
      title: t('payments.columns.status'),
      dataIndex: 'status',
      key: 'status',
      render: (value) => (
        <Tag color={PAYMENT_STATUS_COLORS[value]}>{t(`payments.statuses.${value}`, value)}</Tag>
      ),
    },
    {
      title: t('payments.columns.time'),
      key: 'time',
      render: (_, p) => dayjs(p.paidAt || p.createdAt).format('DD/MM/YYYY HH:mm'),
    },
    {
      title: t('payments.columns.reference'),
      key: 'reference',
      render: (_, p) => (
        <Text type="secondary" style={{ fontSize: 12 }}>
          {[p.providerTxnNo, p.note].filter(Boolean).join(' · ') || '—'}
        </Text>
      ),
    },
  ];

  if (loading && !billing) {
    return (
      <div>
        <PageHeader title={t('billing.title')} subtitle={t('billing.subtitle')} />
        <div style={{ textAlign: 'center', padding: 48 }}>
          <Spin size="large" />
        </div>
      </div>
    );
  }

  return (
    <div>
      <PageHeader
        title={t('billing.title')}
        subtitle={t('billing.subtitle')}
        actions={
          <Button
            icon={<ReloadOutlined />}
            loading={loading}
            onClick={() => {
              setLoading(true);
              setRefreshKey((k) => k + 1);
            }}
          >
            {t('billing.refresh')}
          </Button>
        }
      />

      <Flex vertical gap={16}>
        <Row gutter={[16, 16]}>
          <Col xs={24} sm={12} xl={6}>
            <StatCard
              icon={<CreditCardOutlined />}
              color="#d97706"
              label={t('billing.stats.payableNow')}
              value={formatMoney(billing?.totalPayableNow, currency)}
              sub={
                billing?.payableNowCount
                  ? `${formatVnd(billing.totalPayableNowVnd)} · ${t('billing.stats.bookingsCount', { count: billing.payableNowCount })}`
                  : t('billing.stats.nothingDue')
              }
            />
          </Col>
          <Col xs={24} sm={12} xl={6}>
            <StatCard
              icon={<WalletOutlined />}
              color="#2563eb"
              label={t('billing.stats.outstanding')}
              value={formatMoney(billing?.totalOutstanding, currency)}
              sub={t('billing.stats.outstandingHint')}
            />
          </Col>
          <Col xs={24} sm={12} xl={6}>
            <StatCard
              icon={<CheckCircleOutlined />}
              color="#16a34a"
              label={t('billing.stats.paid')}
              value={formatMoney(billing?.totalPaid, currency)}
              sub={t('billing.stats.paidHint')}
            />
          </Col>
          <Col xs={24} sm={12} xl={6}>
            <StatCard
              icon={<RollbackOutlined />}
              color="#7c3aed"
              label={t('billing.stats.refunded')}
              value={formatMoney(billing?.totalRefunded, currency)}
              sub={t('billing.stats.refundedHint')}
            />
          </Col>
        </Row>

        {billing?.overdueCount > 0 && (
          <Alert
            type="error"
            showIcon
            message={t('payments.extraOverdueTitle')}
            description={t('payments.extraOverdueDescription')}
          />
        )}

        <Card title={t('billing.payableTitle')} style={{ borderRadius: 12 }}>
          {payableBookings.length > 0 ? (
            <>
              <Text type="secondary" style={{ display: 'block', marginBottom: 12 }}>
                {t('billing.payableHint', {
                  rate: Number(billing?.usdVndRate || 0).toLocaleString('vi-VN'),
                })}
              </Text>
              <Table
                size="middle"
                rowKey="bookingId"
                columns={payableColumns}
                dataSource={payableBookings}
                pagination={false}
                scroll={{ x: 680 }}
              />
            </>
          ) : (
            <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description={t('billing.noPayable')} />
          )}
        </Card>

        <Card title={t('billing.bookingsTitle')} style={{ borderRadius: 12 }}>
          <Table
            size="middle"
            rowKey="bookingId"
            columns={bookingColumns}
            dataSource={bookings}
            pagination={{ pageSize: 5, hideOnSinglePage: true }}
            scroll={{ x: 760 }}
            locale={{
              emptyText: (
                <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description={t('billing.noBookings')} />
              ),
            }}
          />
        </Card>

        <Card title={t('billing.historyTitle')} style={{ borderRadius: 12 }}>
          <Flex gap={12} wrap="wrap" style={{ marginBottom: 16 }}>
            <Input
              allowClear
              prefix={<SearchOutlined />}
              placeholder={t('billing.searchPlaceholder')}
              value={keyword}
              onChange={(e) => setKeyword(e.target.value)}
              style={{ width: 260, maxWidth: '100%' }}
            />
            <Select
              allowClear
              placeholder={t('billing.filterType')}
              value={typeFilter}
              onChange={setTypeFilter}
              style={{ width: 170 }}
              options={PAYMENT_TYPES.map((value) => ({
                value,
                label: t(`payments.types.${value}`),
              }))}
            />
            <Select
              allowClear
              placeholder={t('billing.filterStatus')}
              value={statusFilter}
              onChange={setStatusFilter}
              style={{ width: 170 }}
              options={PAYMENT_STATUSES.map((value) => ({
                value,
                label: t(`payments.statuses.${value}`),
              }))}
            />
          </Flex>
          <Table
            size="middle"
            rowKey="paymentId"
            columns={paymentColumns}
            dataSource={filteredPayments}
            pagination={{ pageSize: 10, hideOnSinglePage: true }}
            scroll={{ x: 900 }}
            locale={{
              emptyText: (
                <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description={t('billing.noPayments')} />
              ),
            }}
          />
          <Text type="secondary" style={{ display: 'block', marginTop: 12, fontSize: 12 }}>
            {t('billing.refundNote')}
          </Text>
        </Card>
      </Flex>
    </div>
  );
}
