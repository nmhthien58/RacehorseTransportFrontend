import { Button, Empty, Popconfirm, Space, Table, Tag, Typography } from 'antd';
import { DeleteOutlined, FileTextOutlined } from '@ant-design/icons';
import { useTranslation } from 'react-i18next';
import dayjs from 'dayjs';

const { Text } = Typography;

// Màu theo trường `validity` backend tính từ ngày hết hạn
const VALIDITY_COLORS = {
  Valid: 'green',
  ExpiringSoon: 'gold',
  Expired: 'red',
  NoExpiry: 'default',
};

const formatDate = (value) => (value ? dayjs(value).format('DD/MM/YYYY') : '-');

/**
 * Bảng hồ sơ thú y đã lưu của một con ngựa (GET /api/horses/{id}/documents).
 * @param {Object} props
 * @param {Array<any>} props.documents
 * @param {boolean} [props.loading]
 * @param {(doc: any) => Promise<void>} [props.onDelete] - Bỏ trống thì không hiện nút xóa
 * @param {import('react').ReactNode} [props.emptyAction] - Nút hiện trong trạng thái chưa có hồ sơ
 */
export default function HorseDocumentTable({ documents, loading = false, onDelete, emptyAction }) {
  const { t } = useTranslation();

  const columns = [
    {
      title: t('horseDocs.columns.type'),
      dataIndex: 'docTypeName',
      key: 'type',
      render: (name, doc) => (
        <div>
          <Text strong style={{ color: '#0f172a' }}>{name}</Text>
          {doc.documentNumber && (
            <Text type="secondary" style={{ display: 'block', fontSize: 12 }}>
              {t('horseDocs.numberPrefix')} {doc.documentNumber}
            </Text>
          )}
        </div>
      ),
    },
    {
      title: t('horseDocs.columns.issuedBy'),
      dataIndex: 'issuedBy',
      key: 'issuedBy',
      responsive: ['md'],
      render: (value) => value || '-',
    },
    {
      title: t('horseDocs.columns.issueDate'),
      dataIndex: 'issueDate',
      key: 'issueDate',
      width: 120,
      responsive: ['sm'],
      render: formatDate,
    },
    {
      title: t('horseDocs.columns.expiryDate'),
      dataIndex: 'expiryDate',
      key: 'expiryDate',
      width: 120,
      render: formatDate,
    },
    {
      title: t('horseDocs.columns.validity'),
      dataIndex: 'validity',
      key: 'validity',
      width: 130,
      render: (value) => (
        <Tag color={VALIDITY_COLORS[value] || 'default'}>{t(`horseDocs.validity.${value}`, value)}</Tag>
      ),
    },
    {
      title: '',
      key: 'actions',
      width: onDelete ? 150 : 90,
      render: (_, doc) => (
        <Space size={4}>
          <Button
            type="link"
            size="small"
            icon={<FileTextOutlined />}
            href={doc.fileUrl || undefined}
            target="_blank"
            rel="noopener noreferrer"
            disabled={!doc.fileUrl}
          >
            {t('horseDocs.viewFile')}
          </Button>
          {onDelete && (
            <Popconfirm
              title={t('horseDocs.deleteConfirmTitle')}
              description={t('horseDocs.deleteConfirmDesc')}
              okText={t('common.delete')}
              cancelText={t('common.cancel')}
              okButtonProps={{ danger: true }}
              onConfirm={() => onDelete(doc)}
            >
              <Button type="text" size="small" danger icon={<DeleteOutlined />} aria-label={t('common.delete')} />
            </Popconfirm>
          )}
        </Space>
      ),
    },
  ];

  return (
    <Table
      columns={columns}
      dataSource={documents}
      rowKey="documentId"
      loading={loading}
      pagination={false}
      size="middle"
      locale={{
        emptyText: (
          <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description={t('horseDocs.empty')}>
            {emptyAction}
          </Empty>
        ),
      }}
    />
  );
}
