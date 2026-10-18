import { useCallback, useEffect, useState } from 'react';
import {
  Alert,
  Button,
  Card,
  Descriptions,
  Flex,
  Form,
  Input,
  InputNumber,
  Modal,
  Select,
  Space,
  Spin,
  Table,
  Tag,
  Typography,
  message,
} from 'antd';
import { CreditCardOutlined, DollarOutlined, ReloadOutlined } from '@ant-design/icons';
import { useTranslation } from 'react-i18next';
import dayjs from 'dayjs';
import paymentService from '@services/paymentService';
import { unwrapData, getErrorMessage } from '@utils/apiHelpers';

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

const OPEN_REFUND_STATUSES = ['Pending', 'Failed'];

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
 * Định dạng số tiền VND đã quy đổi (số tiền thực trả qua VNPay)
 * @param {number} value
 * @returns {string}
 */
function formatVnd(value) {
  return `${Number(value || 0).toLocaleString('vi-VN')} ₫`;
}

/**
 * Khối thanh toán của một đơn vận chuyển (R-02), dùng chung cho Khách hàng và Manager.
 * - Khách: xem khoản cần trả tiếp theo, bấm thanh toán (chuyển sang VNPay), xem lịch sử gồm cả hoàn tiền.
 * - Manager: ghi nhận khoản khách trả ngoài hệ thống, thử lại / đánh dấu hoàn tiền thủ công.
 * @param {Object} props
 * @param {number|string} props.bookingId
 * @param {string} [props.bookingStatus]
 * @param {'customer'|'manager'} props.mode
 * @param {() => void} [props.onChanged] - Gọi lại khi trạng thái thanh toán đổi (để tải lại đơn)
 * @returns {JSX.Element}
 */
export default function BookingPaymentPanel({ bookingId, bookingStatus, mode, onChanged }) {
  const { t } = useTranslation();
  const [summary, setSummary] = useState(null);
  const [settings, setSettings] = useState(null);
  const [loading, setLoading] = useState(true);
  const [paying, setPaying] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);
  const [manualOpen, setManualOpen] = useState(false);
  const [refundTarget, setRefundTarget] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [manualForm] = Form.useForm();
  const [refundForm] = Form.useForm();

  const isManager = mode === 'manager';

  useEffect(() => {
    let active = true;
    Promise.all([paymentService.getBookingPayments(bookingId), paymentService.getSettings()])
      .then(([paymentRes, settingsRes]) => {
        if (!active) return;
        setSummary(unwrapData(paymentRes));
        setSettings(unwrapData(settingsRes));
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
  }, [bookingId, bookingStatus, refreshKey, t]);

  const reload = useCallback(() => {
    setRefreshKey((k) => k + 1);
    onChanged?.();
  }, [onChanged]);

  const handlePay = async () => {
    setPaying(true);
    try {
      const res = unwrapData(await paymentService.createPayment(bookingId, summary.nextPaymentType));
      // Chuyển sang cổng thanh toán; VNPay sẽ đưa khách về trang kết quả sau khi trả
      window.location.href = res.paymentUrl;
    } catch (err) {
      message.error(getErrorMessage(err, t('payments.createFailed')));
      setPaying(false);
    }
  };

  const openManualModal = () => {
    manualForm.setFieldsValue({
      paymentType: summary?.nextPaymentType || 'Deposit',
      amount: summary?.nextPaymentAmount || undefined,
      reference: '',
      note: '',
    });
    setManualOpen(true);
  };

  const handleManualSubmit = async () => {
    const values = await manualForm.validateFields();
    setSubmitting(true);
    try {
      await paymentService.recordManualPayment(bookingId, values);
      message.success(t('payments.manual.success'));
      setManualOpen(false);
      reload();
    } catch (err) {
      message.error(getErrorMessage(err, t('payments.manual.failed')));
    } finally {
      setSubmitting(false);
    }
  };

  const handleRetryRefund = async (paymentId) => {
    try {
      const res = unwrapData(await paymentService.retryRefund(paymentId));
      if (res?.status === 'Succeeded') message.success(t('payments.refund.retrySuccess'));
      else message.warning(t('payments.refund.retryFailed'));
      reload();
    } catch (err) {
      message.error(getErrorMessage(err, t('payments.refund.retryFailed')));
    }
  };

  const handleMarkRefunded = async () => {
    const values = await refundForm.validateFields();
    setSubmitting(true);
    try {
      await paymentService.markRefunded(refundTarget.paymentId, values);
      message.success(t('payments.refund.markSuccess'));
      setRefundTarget(null);
      reload();
    } catch (err) {
      message.error(getErrorMessage(err, t('payments.refund.markFailed')));
    } finally {
      setSubmitting(false);
    }
  };

  if (loading && !summary) {
    return (
      <Card>
        <div style={{ textAlign: 'center', padding: 32 }}>
          <Spin />
        </div>
      </Card>
    );
  }

  if (!summary) return null;

  const currency = summary.currencyCode || 'USD';
  const payments = summary.payments || [];
  const nextType = summary.nextPaymentType;

  const dueDateOf = (type) => {
    if (type === 'Balance') return summary.balanceDueAt;
    if (type === 'Extra') return summary.extraDueAt;
    return null;
  };

  const columns = [
    {
      title: t('payments.columns.code'),
      dataIndex: 'paymentCode',
      key: 'paymentCode',
      render: (value) => <Text strong>{value}</Text>,
    },
    {
      title: t('payments.columns.type'),
      dataIndex: 'paymentType',
      key: 'paymentType',
      render: (value) => <Tag color={PAYMENT_TYPE_COLORS[value]}>{t(`payments.types.${value}`, value)}</Tag>,
    },
    {
      title: t('payments.columns.amount'),
      dataIndex: 'amount',
      key: 'amount',
      align: 'right',
      render: (value, record) => (
        <div style={{ whiteSpace: 'nowrap' }}>
          <Text strong>{formatMoney(value, record.currencyCode)}</Text>
          <br />
          <Text type="secondary" style={{ fontSize: 12 }}>
            {formatVnd(record.amountVnd)}
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
      render: (_, record) => dayjs(record.paidAt || record.createdAt).format('DD/MM/YYYY HH:mm'),
    },
    {
      title: t('payments.columns.reference'),
      key: 'reference',
      render: (_, record) => (
        <Text type="secondary" style={{ fontSize: 12 }}>
          {[record.providerTxnNo, record.note].filter(Boolean).join(' · ') || '—'}
        </Text>
      ),
    },
  ];

  if (isManager) {
    columns.push({
      title: '',
      key: 'actions',
      render: (_, record) =>
        record.paymentType === 'Refund' && OPEN_REFUND_STATUSES.includes(record.status) ? (
          <Space size="small">
            {record.provider !== 'Manual' && (
              <Button size="small" icon={<ReloadOutlined />} onClick={() => handleRetryRefund(record.paymentId)}>
                {t('payments.refund.retry')}
              </Button>
            )}
            <Button
              size="small"
              onClick={() => {
                refundForm.resetFields();
                setRefundTarget(record);
              }}
            >
              {t('payments.refund.markRefunded')}
            </Button>
          </Space>
        ) : null,
    });
  }

  return (
    <Card
      title={
        <span>
          <DollarOutlined /> {t('payments.title')}
        </span>
      }
      extra={
        isManager && summary.paymentRequired && summary.outstanding > 0 ? (
          <Button onClick={openManualModal}>{t('payments.manual.open')}</Button>
        ) : null
      }
    >
      <Flex vertical gap={16}>
        {!summary.paymentRequired && payments.length === 0 && (
          <Alert
            type="info"
            showIcon
            message={
              bookingStatus === 'Submitted'
                ? t('payments.notRequiredYet', { percent: settings?.depositPercent ?? 0 })
                : t('payments.legacyBooking')
            }
          />
        )}

        {summary.extraOverdue && (
          <Alert
            type="error"
            showIcon
            message={t('payments.extraOverdueTitle')}
            description={t('payments.extraOverdueDescription')}
          />
        )}

        {nextType && (
          <Alert
            type="warning"
            showIcon
            icon={<CreditCardOutlined />}
            message={t(`payments.next.${nextType}`)}
            description={
              <Flex vertical gap={4}>
                <span>
                  <Text strong>{formatMoney(summary.nextPaymentAmount, currency)}</Text>
                  {' ≈ '}
                  <Text strong>{formatVnd(summary.nextPaymentAmountVnd)}</Text>{' '}
                  <Text type="secondary">
                    ({t('payments.rate', { rate: Number(summary.usdVndRate).toLocaleString('vi-VN') })})
                  </Text>
                </span>
                {dueDateOf(nextType) && (
                  <span>{t('payments.dueAt', { date: dayjs(dueDateOf(nextType)).format('DD/MM/YYYY') })}</span>
                )}
                <Text type="secondary">{t(`payments.nextHint.${nextType}`)}</Text>
              </Flex>
            }
            action={
              !isManager && (
                <Button type="primary" loading={paying} onClick={handlePay}>
                  {t('payments.payNow')}
                </Button>
              )
            }
          />
        )}

        {(summary.paymentRequired || payments.length > 0) && (
          <Descriptions bordered size="small" column={{ xs: 1, md: 2 }}>
            <Descriptions.Item label={t('payments.summary.quote')}>
              {formatMoney(summary.estimatedCost, currency)}
            </Descriptions.Item>
            <Descriptions.Item label={t('payments.summary.deposit', { percent: summary.depositPercent ?? 0 })}>
              {formatMoney(summary.depositPaid, currency)} / {formatMoney(summary.depositAmount, currency)}
            </Descriptions.Item>
            <Descriptions.Item label={t('payments.summary.balance')}>
              {formatMoney(summary.balancePaid, currency)} / {formatMoney(summary.balanceAmount, currency)}
              {summary.balanceDueAt && (
                <Text type="secondary"> ({t('payments.dueAt', { date: dayjs(summary.balanceDueAt).format('DD/MM/YYYY') })})</Text>
              )}
            </Descriptions.Item>
            <Descriptions.Item label={t('payments.summary.extra')}>
              {formatMoney(summary.extraPaid, currency)} / {formatMoney(summary.extraAmount, currency)}
            </Descriptions.Item>
            <Descriptions.Item label={t('payments.summary.totalPaid')}>
              <Text strong>{formatMoney(summary.totalPaid, currency)}</Text>
            </Descriptions.Item>
            <Descriptions.Item label={t('payments.summary.outstanding')}>
              <Text strong style={{ color: summary.outstanding > 0 ? '#d97706' : undefined }}>
                {formatMoney(summary.outstanding, currency)}
              </Text>
            </Descriptions.Item>
            {summary.refundedAmount > 0 && (
              <Descriptions.Item label={t('payments.summary.refunded')} span={2}>
                <Text strong style={{ color: '#16a34a' }}>
                  {formatMoney(summary.refundedAmount, currency)}
                </Text>
              </Descriptions.Item>
            )}
          </Descriptions>
        )}

        {payments.length > 0 && (
          <Table
            size="small"
            rowKey="paymentId"
            columns={columns}
            dataSource={payments}
            pagination={false}
            scroll={{ x: 760 }}
          />
        )}
      </Flex>

      <Modal
        title={t('payments.manual.title')}
        open={manualOpen}
        onCancel={() => setManualOpen(false)}
        onOk={handleManualSubmit}
        confirmLoading={submitting}
        okText={t('common.confirm')}
        cancelText={t('common.cancel')}
        destroyOnHidden
      >
        <Alert type="info" showIcon message={t('payments.manual.hint')} style={{ marginBottom: 16 }} />
        <Form form={manualForm} layout="vertical">
          <Form.Item name="paymentType" label={t('payments.columns.type')} rules={[{ required: true }]}>
            <Select
              options={['Deposit', 'Balance', 'Extra'].map((value) => ({
                value,
                label: t(`payments.types.${value}`),
              }))}
            />
          </Form.Item>
          <Form.Item
            name="amount"
            label={t('payments.manual.amount', { currency })}
            rules={[{ required: true, message: t('payments.manual.amountRequired') }]}
          >
            <InputNumber min={0.01} step={10} style={{ width: '100%' }} />
          </Form.Item>
          <Form.Item
            name="reference"
            label={t('payments.manual.reference')}
            rules={[{ required: true, whitespace: true, message: t('payments.manual.referenceRequired') }, { max: 100 }]}
          >
            <Input placeholder={t('payments.manual.referencePlaceholder')} />
          </Form.Item>
          <Form.Item name="note" label={t('payments.manual.note')} rules={[{ max: 300 }]}>
            <Input.TextArea rows={2} />
          </Form.Item>
        </Form>
      </Modal>

      <Modal
        title={t('payments.refund.markTitle', { code: refundTarget?.paymentCode })}
        open={!!refundTarget}
        onCancel={() => setRefundTarget(null)}
        onOk={handleMarkRefunded}
        confirmLoading={submitting}
        okText={t('common.confirm')}
        cancelText={t('common.cancel')}
        destroyOnHidden
      >
        {refundTarget && (
          <Text style={{ display: 'block', marginBottom: 12 }}>
            {t('payments.refund.markHint', {
              amount: formatMoney(refundTarget.amount, refundTarget.currencyCode),
              vnd: formatVnd(refundTarget.amountVnd),
            })}
          </Text>
        )}
        <Form form={refundForm} layout="vertical">
          <Form.Item
            name="reference"
            label={t('payments.manual.reference')}
            rules={[{ required: true, whitespace: true, message: t('payments.manual.referenceRequired') }, { max: 50 }]}
          >
            <Input />
          </Form.Item>
          <Form.Item name="note" label={t('payments.manual.note')} rules={[{ max: 300 }]}>
            <Input.TextArea rows={2} />
          </Form.Item>
        </Form>
      </Modal>
    </Card>
  );
}
