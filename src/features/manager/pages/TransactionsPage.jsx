import { useEffect, useMemo, useState } from 'react';
import { Card, Col, Row, Statistic, Typography, message } from 'antd';
import { useTranslation } from 'react-i18next';
import PageHeader from '@components/layout/PageHeader';
import PaymentLedgerTable, { PaymentLedgerFilters } from '@components/common/PaymentLedger';
import paymentService from '@services/paymentService';
import { unwrapData, unwrapList, getErrorMessage } from '@utils/apiHelpers';
import { formatLedgerMoney } from '@utils/paymentLedger';
import { ROUTES } from '@routes/routes';

const { Text } = Typography;
const PAGE_SIZE = 20;

/**
 * Đường dẫn tới chi tiết đơn (phía Manager)
 * @param {number} bookingId
 * @returns {string}
 */
function managerBookingPath(bookingId) {
  return ROUTES.MANAGER_BOOKING_DETAIL.replace(':id', bookingId);
}

/**
 * Đổi khoảng ngày của bộ lọc thành tham số from/to (YYYY-MM-DD)
 * @param {Array<import('dayjs').Dayjs>|null|undefined} range
 * @returns {{ from?: string, to?: string }}
 */
function rangeParams(range) {
  const [from, to] = range || [];
  return { from: from?.format('YYYY-MM-DD'), to: to?.format('YYYY-MM-DD') };
}

/**
 * Lấy tổng số dòng từ response phân trang
 * @param {any} res
 * @param {number} fallback
 * @returns {number}
 */
function totalOf(res, fallback) {
  const data = unwrapData(res);
  return res?.pagination?.totalItems ?? data?.totalItems ?? data?.totalCount ?? fallback;
}

/**
 * Ô số liệu tổng hợp, bấm được để lọc nhanh
 * @param {Object} props
 * @returns {JSX.Element}
 */
function SummaryTile({ title, value, sub, color, active, onClick }) {
  return (
    <Card
      hoverable={Boolean(onClick)}
      onClick={onClick}
      style={{ borderRadius: 12, height: '100%', borderColor: active ? '#F59E0B' : undefined }}
      styles={{ body: { padding: 16 } }}
    >
      <Statistic title={title} value={value} styles={{ content: { color, fontSize: 20 } }} />
      {sub && (
        <Text type="secondary" style={{ fontSize: 12 }}>
          {sub}
        </Text>
      )}
    </Card>
  );
}

/**
 * Trang Giao dịch của Manager: số liệu tổng hợp và danh sách mọi giao dịch, lọc theo loại,
 * trạng thái, khoảng ngày, từ khóa.
 * @returns {JSX.Element}
 */
export default function TransactionsPage() {
  const { t } = useTranslation();
  const [filters, setFilters] = useState({});
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(PAGE_SIZE);
  const [list, setList] = useState({ key: null, items: [], total: 0 });
  const [summary, setSummary] = useState({ key: null, data: null });

  const { from, to } = rangeParams(filters.range);
  const listParams = useMemo(
    () => ({
      type: filters.type,
      status: filters.status,
      from,
      to,
      search: filters.search?.trim() || undefined,
      page,
      size: pageSize,
      sort: '-createdAt',
    }),
    [filters.type, filters.status, filters.search, from, to, page, pageSize],
  );
  const listKey = JSON.stringify(listParams);
  const summaryKey = JSON.stringify({ from, to });

  useEffect(() => {
    let active = true;
    paymentService
      .getPayments(JSON.parse(listKey))
      .then((res) => {
        if (!active) return;
        const items = unwrapList(res);
        setList({ key: listKey, items, total: totalOf(res, items.length) });
      })
      .catch((err) => {
        if (!active) return;
        message.error(getErrorMessage(err, t('paymentLedger.loadFailed')));
        setList({ key: listKey, items: [], total: 0 });
      });
    return () => {
      active = false;
    };
  }, [listKey, t]);

  useEffect(() => {
    let active = true;
    paymentService
      .getPaymentSummary(JSON.parse(summaryKey))
      .then((res) => {
        if (active) setSummary({ key: summaryKey, data: unwrapData(res) });
      })
      .catch((err) => {
        if (!active) return;
        message.error(getErrorMessage(err, t('paymentLedger.manager.summaryFailed')));
        setSummary({ key: summaryKey, data: null });
      });
    return () => {
      active = false;
    };
  }, [summaryKey, t]);

  const applyFilters = (patch) => {
    setFilters((f) => ({ ...f, ...patch }));
    setPage(1);
  };

  const s = summary.data || {};
  const currency = s.currencyCode || 'USD';
  // Lọc nhanh "Hoàn tiền cần xử lý": các khoản hoàn tiền thất bại cần thử lại / hoàn thủ công
  const refundQuickActive = filters.type === 'Refund' && filters.status === 'Failed';

  const tiles = [
    {
      key: 'succeeded',
      title: t('paymentLedger.manager.tiles.succeeded'),
      value: formatLedgerMoney(s.succeededAmount, currency),
      sub: t('paymentLedger.manager.tiles.count', { count: s.succeededCount || 0 }),
      color: '#16a34a',
      filter: { type: undefined, status: 'Succeeded' },
    },
    {
      key: 'pending',
      title: t('paymentLedger.manager.tiles.pending'),
      value: formatLedgerMoney(s.pendingAmount, currency),
      sub: t('paymentLedger.manager.tiles.count', { count: s.pendingCount || 0 }),
      color: '#2563eb',
      filter: { type: undefined, status: 'Pending' },
    },
    {
      key: 'failed',
      title: t('paymentLedger.manager.tiles.failedExpired'),
      value: `${s.failedCount || 0} / ${s.expiredCount || 0}`,
      sub: t('paymentLedger.manager.tiles.failedExpiredHint'),
      color: '#dc2626',
      filter: { type: undefined, status: 'Failed' },
    },
    {
      key: 'refunded',
      title: t('paymentLedger.manager.tiles.refunded'),
      value: formatLedgerMoney(s.refundedAmount, currency),
      color: '#7c3aed',
      filter: { type: 'Refund', status: 'Succeeded' },
    },
    {
      key: 'refundsNeedingAction',
      title: t('paymentLedger.manager.tiles.refundsNeedingAction'),
      value: s.refundsNeedingActionCount || 0,
      sub: t('paymentLedger.manager.tiles.refundsNeedingActionHint'),
      color: '#d97706',
      filter: { type: 'Refund', status: 'Failed' },
    },
  ];

  return (
    <div>
      <PageHeader
        title={t('paymentLedger.manager.title')}
        subtitle={t('paymentLedger.manager.subtitle')}
      />
      <Row gutter={[16, 16]} style={{ marginBottom: 16 }}>
        {tiles.map((tile) => {
          const active =
            tile.key === 'refundsNeedingAction'
              ? refundQuickActive
              : filters.type === tile.filter.type && filters.status === tile.filter.status;
          return (
            <Col key={tile.key} xs={24} sm={12} lg={8} xl={{ flex: '20%' }}>
              <SummaryTile
                title={tile.title}
                value={tile.value}
                sub={tile.sub}
                color={tile.color}
                active={active}
                onClick={() => applyFilters(active ? { type: undefined, status: undefined } : tile.filter)}
              />
            </Col>
          );
        })}
      </Row>
      <Card style={{ borderRadius: 12 }}>
        <PaymentLedgerFilters
          value={filters}
          onChange={applyFilters}
          searchPlaceholder={t('paymentLedger.manager.searchPlaceholder')}
        />
        <PaymentLedgerTable
          showCustomer
          dataSource={list.items}
          loading={list.key !== listKey}
          bookingPath={managerBookingPath}
          pagination={{
            current: page,
            pageSize,
            total: list.total,
            showSizeChanger: true,
          }}
          onChange={(p) => {
            setPage(p.current);
            setPageSize(p.pageSize);
          }}
        />
      </Card>
    </div>
  );
}
