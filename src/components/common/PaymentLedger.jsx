import { DatePicker, Flex, Input, Select, Table, Tag, Typography } from 'antd';
import { SearchOutlined } from '@ant-design/icons';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import dayjs from 'dayjs';
import {
  LEDGER_PAYMENT_STATUSES,
  LEDGER_PAYMENT_TYPES,
  LEDGER_STATUS_COLORS,
  LEDGER_TYPE_COLORS,
  OUTGOING_TYPES,
  formatLedgerMoney,
  formatLedgerVnd,
  paymentTypeOf,
} from '@utils/paymentLedger';

const { Text } = Typography;
const { RangePicker } = DatePicker;

/**
 * Hàng bộ lọc giao dịch: loại, trạng thái, khoảng ngày, ô tìm kiếm
 * @param {Object} props
 * @param {{ type?: string, status?: string, range?: Array<any>|null, search?: string }} props.value
 * @param {(patch: Object) => void} props.onChange - Nhận phần bộ lọc thay đổi
 * @param {string} [props.searchPlaceholder]
 * @returns {JSX.Element}
 */
export function PaymentLedgerFilters({ value, onChange, searchPlaceholder }) {
  const { t } = useTranslation();
  return (
    <Flex gap={12} wrap="wrap" style={{ marginBottom: 16 }}>
      <Select
        allowClear
        placeholder={t('paymentLedger.filters.type')}
        value={value.type}
        onChange={(type) => onChange({ type })}
        style={{ width: 190 }}
        options={LEDGER_PAYMENT_TYPES.map((v) => ({ value: v, label: t(`paymentLedger.types.${v}`) }))}
      />
      <Select
        allowClear
        placeholder={t('paymentLedger.filters.status')}
        value={value.status}
        onChange={(status) => onChange({ status })}
        style={{ width: 170 }}
        options={LEDGER_PAYMENT_STATUSES.map((v) => ({
          value: v,
          label: t(`paymentLedger.statuses.${v}`),
        }))}
      />
      <RangePicker
        value={value.range}
        onChange={(range) => onChange({ range })}
        format="DD/MM/YYYY"
        style={{ maxWidth: '100%' }}
      />
      <Input.Search
        allowClear
        prefix={<SearchOutlined />}
        placeholder={searchPlaceholder || t('paymentLedger.filters.search')}
        defaultValue={value.search}
        onSearch={(search) => onChange({ search })}
        style={{ width: 280, maxWidth: '100%' }}
      />
    </Flex>
  );
}

/**
 * Bảng giao dịch dùng chung cho trang Giao dịch (Manager) và Lịch sử thanh toán (Khách)
 * @param {Object} props
 * @param {Array<any>} props.dataSource
 * @param {boolean} [props.loading]
 * @param {Object|false} [props.pagination]
 * @param {(pagination: any) => void} [props.onChange]
 * @param {(bookingId: number) => string} props.bookingPath - Đường dẫn chi tiết đơn theo vai trò
 * @param {boolean} [props.showCustomer] - Hiện cột khách hàng (chỉ Manager)
 * @returns {JSX.Element}
 */
export default function PaymentLedgerTable({
  dataSource,
  loading,
  pagination,
  onChange,
  bookingPath,
  showCustomer = false,
}) {
  const { t } = useTranslation();

  const columns = [
    {
      title: t('paymentLedger.columns.time'),
      key: 'time',
      render: (_, p) => dayjs(p.paidAt || p.createdAt).format('DD/MM/YYYY HH:mm'),
    },
    {
      title: t('paymentLedger.columns.booking'),
      key: 'booking',
      render: (_, p) => (
        <Link to={bookingPath(p.bookingId)}>
          <Text strong style={{ whiteSpace: 'nowrap' }}>
            {p.bookingCode}
          </Text>
        </Link>
      ),
    },
    showCustomer && {
      title: t('paymentLedger.columns.customer'),
      dataIndex: 'customerName',
      key: 'customer',
    },
    {
      title: t('paymentLedger.columns.type'),
      key: 'type',
      render: (_, p) => {
        const type = paymentTypeOf(p);
        return <Tag color={LEDGER_TYPE_COLORS[type]}>{t(`paymentLedger.types.${type}`, type)}</Tag>;
      },
    },
    {
      title: t('paymentLedger.columns.amount'),
      key: 'amount',
      align: 'right',
      render: (_, p) => {
        const outgoing = OUTGOING_TYPES.includes(paymentTypeOf(p));
        return (
          <div style={{ whiteSpace: 'nowrap' }}>
            <Text strong style={{ color: outgoing ? '#16a34a' : undefined }}>
              {formatLedgerMoney(p.amount, p.currencyCode)}
            </Text>
            <br />
            <Text type="secondary" style={{ fontSize: 12 }}>
              {formatLedgerVnd(p.amountVnd)}
            </Text>
          </div>
        );
      },
    },
    {
      title: t('paymentLedger.columns.status'),
      dataIndex: 'status',
      key: 'status',
      render: (value) => (
        <Tag color={LEDGER_STATUS_COLORS[value]}>{t(`paymentLedger.statuses.${value}`, value)}</Tag>
      ),
    },
    {
      title: t('paymentLedger.columns.txnRef'),
      key: 'txnRef',
      render: (_, p) => (
        <div>
          <Text>{p.paymentCode}</Text>
          {p.providerTxnNo && (
            <>
              <br />
              <Text type="secondary" style={{ fontSize: 12 }}>
                {p.providerTxnNo}
              </Text>
            </>
          )}
        </div>
      ),
    },
  ].filter(Boolean);

  return (
    <Table
      size="middle"
      rowKey="paymentId"
      columns={columns}
      dataSource={dataSource}
      loading={loading}
      pagination={pagination}
      onChange={onChange}
      scroll={{ x: showCustomer ? 1000 : 860 }}
      locale={{ emptyText: t('paymentLedger.empty') }}
    />
  );
}
