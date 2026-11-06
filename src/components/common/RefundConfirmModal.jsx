import { useEffect, useState } from 'react';
import { Alert, Modal, Spin, Table, Tag, Typography } from 'antd';
import { useTranslation } from 'react-i18next';
import dayjs from 'dayjs';
import paymentService from '@services/paymentService';
import { unwrapData } from '@utils/apiHelpers';

const { Text } = Typography;

// Khoản khách đã trả có thể hoàn (PaymentTypes.Charges ở backend)
const CHARGE_TYPES = ['Deposit', 'Balance', 'Extra'];

/**
 * Chia số tiền hoàn vào các giao dịch gốc giống backend (PaymentService.RefundAmountAsync):
 * chỉ giao dịch đã thành công, trừ phần đã hoàn; giao dịch trả sau cùng hoàn trước.
 * @param {Array<Object>} payments - lịch sử giao dịch của đơn
 * @param {number} amount
 * @returns {{ rows: Array<Object>, viaGateway: number, overflow: number }}
 */
// eslint-disable-next-line react-refresh/only-export-components
export function planRefund(payments, amount) {
  const charges = (payments || [])
    .filter((p) => p.status === 'Succeeded' && CHARGE_TYPES.includes(p.paymentType))
    .map((charge) => {
      const refunded = (payments || [])
        .filter((r) => r.refundOfPaymentId === charge.paymentId && !['Failed', 'Expired'].includes(r.status))
        .reduce((sum, r) => sum + Number(r.amount), 0);
      return { ...charge, remaining: Number(charge.amount) - refunded };
    })
    .filter((c) => c.remaining > 0)
    .sort((a, b) => dayjs(b.paidAt || b.createdAt).valueOf() - dayjs(a.paidAt || a.createdAt).valueOf());

  let left = Number(amount) || 0;
  const rows = [];
  for (const c of charges) {
    if (left <= 0) break;
    const part = Math.min(left, c.remaining);
    left -= part;
    rows.push({ ...c, refundPart: Math.round(part * 100) / 100 });
  }
  const viaGateway = rows.reduce((s, r) => s + r.refundPart, 0);
  return { rows, viaGateway, overflow: Math.max(0, Math.round(left * 100) / 100) };
}

/**
 * Xác nhận trước khi duyệt một khoản bồi thường được hoàn qua cổng thanh toán: hiện các mã giao dịch VNPay gốc
 * sẽ được hoàn (khách không cần cung cấp số tài khoản, tiền về đúng thẻ / tài khoản đã thanh toán).
 * @param {{ open: boolean, bookingId?: number, bookingCode?: string, amount: number, currencyCode?: string,
 *   confirmLoading?: boolean, onConfirm: () => void, onCancel: () => void }} props
 */
export default function RefundConfirmModal({ open, bookingId, bookingCode, amount, currencyCode = 'USD', confirmLoading, onConfirm, onCancel }) {
  const { t } = useTranslation();
  const [payments, setPayments] = useState(null);

  useEffect(() => {
    if (!open || !bookingId) return undefined;
    let active = true;
    paymentService
      .getBookingPayments(bookingId)
      .then((res) => active && setPayments(unwrapData(res)?.payments || []))
      .catch(() => active && setPayments([]));
    return () => {
      active = false;
    };
  }, [open, bookingId]);

  const loading = open && payments === null;
  const plan = planRefund(payments || [], amount);
  const money = (v) => `${Number(v).toLocaleString('en-US', { maximumFractionDigits: 2 })} ${currencyCode}`;

  return (
    <Modal
      title={t('refundConfirm.title', { code: bookingCode || '' })}
      open={open}
      onCancel={() => {
        setPayments(null);
        onCancel();
      }}
      onOk={onConfirm}
      okText={t('refundConfirm.ok')}
      cancelText={t('common.cancel')}
      confirmLoading={confirmLoading}
      okButtonProps={{ disabled: loading || plan.overflow > 0 }}
      width={640}
      destroyOnHidden
    >
      {loading ? (
        <Spin />
      ) : (
        <>
          <Alert
            type="info"
            showIcon
            style={{ marginBottom: 12 }}
            title={t('refundConfirm.intro', { amount: money(amount) })}
            description={plan.rows.some((r) => r.provider === 'Manual') ? `${t('refundConfirm.how')} ${t('refundConfirm.manualHow')}` : t('refundConfirm.how')}
          />
          {plan.rows.length > 0 && (
            <Table
              size="small"
              pagination={false}
              rowKey="paymentId"
              dataSource={plan.rows}
              columns={[
                {
                  title: t('refundConfirm.txn'),
                  key: 'txn',
                  render: (_, r) => (
                    <div>
                      <Text code>{r.txnRef || r.paymentCode}</Text>
                      {r.providerTxnNo && (
                        <div style={{ fontSize: 12, color: '#64748B' }}>{t('refundConfirm.vnpayNo', { no: r.providerTxnNo })}</div>
                      )}
                      <div>
                        {r.provider === 'Manual' ? (
                          <Tag color="orange">{t('refundConfirm.manualTag')}</Tag>
                        ) : (
                          <Tag color="blue">{t('refundConfirm.vnpayTag')}</Tag>
                        )}
                      </div>
                    </div>
                  ),
                },
                {
                  title: t('refundConfirm.original'),
                  key: 'original',
                  render: (_, r) => (
                    <div>
                      <Tag>{t(`refundConfirm.type.${r.paymentType}`, r.paymentType)}</Tag> {money(r.amount)}
                      <div style={{ fontSize: 12, color: '#64748B' }}>
                        {r.provider} · {dayjs(r.paidAt || r.createdAt).format('DD/MM/YYYY HH:mm')}
                      </div>
                    </div>
                  ),
                },
                { title: t('refundConfirm.refund'), dataIndex: 'refundPart', align: 'right', render: (v) => <Text strong>{money(v)}</Text> },
              ]}
            />
          )}
          {plan.overflow > 0 && (
            <Alert type="error" showIcon style={{ marginTop: 12 }} title={t('refundConfirm.overflow', { amount: money(plan.overflow) })} />
          )}
        </>
      )}
    </Modal>
  );
}
