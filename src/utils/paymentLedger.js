/**
 * @file paymentLedger.js
 * @description Hằng số và hàm định dạng dùng chung cho các trang danh sách giao dịch
 * (Giao dịch của Manager, Lịch sử thanh toán của Khách).
 */

export const LEDGER_PAYMENT_TYPES = ['Deposit', 'Balance', 'Extra', 'Refund', 'Compensation'];
export const LEDGER_PAYMENT_STATUSES = ['Succeeded', 'Pending', 'Failed', 'Expired'];

export const LEDGER_TYPE_COLORS = {
  Deposit: 'gold',
  Balance: 'blue',
  Extra: 'purple',
  Refund: 'green',
  Compensation: 'magenta',
};

export const LEDGER_STATUS_COLORS = {
  Pending: 'processing',
  Succeeded: 'success',
  Failed: 'error',
  Expired: 'default',
};

// Khoản chi ra cho khách (hoàn tiền, bồi thường) hiển thị dấu "+" ở phía khách
export const OUTGOING_TYPES = ['Refund', 'Compensation'];

/**
 * Định dạng số tiền theo đơn vị tiền tệ của báo giá (USD)
 * @param {number} value
 * @param {string} [currency]
 * @returns {string}
 */
export function formatLedgerMoney(value, currency = 'USD') {
  return `${Number(value || 0).toLocaleString('en-US', { maximumFractionDigits: 2 })} ${currency}`;
}

/**
 * Định dạng số tiền VND đã quy đổi
 * @param {number} value
 * @returns {string}
 */
export function formatLedgerVnd(value) {
  return `${Number(value || 0).toLocaleString('vi-VN')} ₫`;
}

/**
 * Loại giao dịch (backend có thể trả `paymentType` hoặc `type`)
 * @param {any} payment
 * @returns {string}
 */
export function paymentTypeOf(payment) {
  return payment?.paymentType ?? payment?.type;
}

/**
 * Lọc giao dịch phía client theo bộ lọc chung (dùng khi API không hỗ trợ lọc)
 * @param {Array<any>} payments
 * @param {{ type?: string, status?: string, range?: Array<import('dayjs').Dayjs>|null, search?: string }} filters
 * @returns {Array<any>}
 */
export function filterPayments(payments, filters) {
  const kw = (filters.search || '').trim().toLowerCase();
  const [from, to] = filters.range || [];
  return payments.filter((p) => {
    const time = new Date(p.paidAt || p.createdAt).getTime();
    return (
      (!filters.type || paymentTypeOf(p) === filters.type) &&
      (!filters.status || p.status === filters.status) &&
      (!from || time >= from.startOf('day').valueOf()) &&
      (!to || time <= to.endOf('day').valueOf()) &&
      (!kw ||
        [p.paymentCode, p.bookingCode, p.providerTxnNo, p.customerName].some((v) =>
          v?.toLowerCase().includes(kw),
        ))
    );
  });
}
