import { useEffect, useMemo, useState } from 'react';
import { Card, message } from 'antd';
import { useTranslation } from 'react-i18next';
import PageHeader from '@components/layout/PageHeader';
import PaymentLedgerTable, { PaymentLedgerFilters } from '@components/common/PaymentLedger';
import paymentService from '@services/paymentService';
import { unwrapData, getErrorMessage } from '@utils/apiHelpers';
import { filterPayments } from '@utils/paymentLedger';
import { ROUTES } from '@routes/routes';

/**
 * Đường dẫn tới tab Thanh toán của chi tiết đơn (phía khách)
 * @param {number} bookingId
 * @returns {string}
 */
function customerBookingPath(bookingId) {
  return `${ROUTES.CUSTOMER_BOOKING_DETAIL.replace(':id', bookingId)}?tab=payment`;
}

/**
 * Trang Lịch sử thanh toán của khách: mọi giao dịch trên mọi đơn (từ GET /api/payments/my)
 * @returns {JSX.Element}
 */
export default function PaymentHistoryPage() {
  const { t } = useTranslation();
  const [payments, setPayments] = useState(null);
  const [filters, setFilters] = useState({});

  useEffect(() => {
    let active = true;
    paymentService
      .getMyBilling()
      .then((res) => {
        if (active) setPayments(unwrapData(res)?.payments || []);
      })
      .catch((err) => {
        if (!active) return;
        message.error(getErrorMessage(err, t('paymentLedger.loadFailed')));
        setPayments([]);
      });
    return () => {
      active = false;
    };
  }, [t]);

  const filtered = useMemo(() => filterPayments(payments || [], filters), [payments, filters]);

  return (
    <div>
      <PageHeader
        title={t('paymentLedger.customer.title')}
        subtitle={t('paymentLedger.customer.subtitle')}
      />
      <Card style={{ borderRadius: 12 }}>
        <PaymentLedgerFilters
          value={filters}
          onChange={(patch) => setFilters((f) => ({ ...f, ...patch }))}
        />
        <PaymentLedgerTable
          dataSource={filtered}
          loading={payments === null}
          pagination={{ pageSize: 10, hideOnSinglePage: true }}
          bookingPath={customerBookingPath}
        />
      </Card>
    </div>
  );
}
