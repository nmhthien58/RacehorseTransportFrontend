import { Empty, Table } from 'antd';
import { useTranslation } from 'react-i18next';

/**
 * Hàm xác định rowKey mặc định dựa trên các khóa chính thường dùng của DB
 * @param {Record<string, unknown>} record
 * @returns {string}
 */
const getDefaultRowKey = (record) => {
  return (
    record?.horseId ||
    record?.bookingId ||
    record?.tripId ||
    record?.userId ||
    record?.dossierId ||
    record?.incidentId ||
    record?.assetId ||
    record?.id ||
    record?.key ||
    JSON.stringify(record)
  );
};

/**
 * Component DataTable bọc Ant Design Table với phân trang i18n và responsive scroll
 * @param {{
 *   columns: import('antd/es/table').TableColumnsType<any>,
 *   dataSource: any[],
 *   rowKey?: string | ((record: any) => string),
 *   loading?: boolean,
 *   pagination?: false | import('antd/es/table').TablePaginationConfig,
 *   scroll?: { x?: string | number | true, y?: string | number },
 *   emptyText?: React.ReactNode,
 *   [key: string]: any
 * }} props
 * @returns {JSX.Element}
 */
export default function DataTable({
  columns,
  dataSource,
  rowKey = getDefaultRowKey,
  loading = false,
  pagination,
  scroll,
  emptyText,
  ...restProps
}) {
  const { t } = useTranslation();

  // Cấu hình phân trang mặc định
  const defaultPagination =
    pagination === false
      ? false
      : {
          defaultPageSize: 10,
          showSizeChanger: true,
          pageSizeOptions: ['10', '20', '50'],
          showTotal: (total) => t('table.total', { total }),
          ...(typeof pagination === 'object' ? pagination : {}),
        };

  return (
    <Table
      columns={columns}
      dataSource={dataSource}
      rowKey={rowKey}
      loading={loading}
      pagination={defaultPagination}
      scroll={{ x: 'max-content', ...scroll }}
      locale={{
        emptyText: (
          <Empty
            image={Empty.PRESENTED_IMAGE_SIMPLE}
            description={emptyText || t('table.empty')}
          />
        ),
      }}
      {...restProps}
    />
  );
}
