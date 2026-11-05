import { useState, useMemo, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Alert, Card, Row, Col, Table, Tag, Input, Select, Button, Typography, Space } from 'antd';
import {
  FileTextOutlined,
  SearchOutlined,
  AuditOutlined,
  MedicineBoxOutlined,
  FilterOutlined,
} from '@ant-design/icons';
import { useTranslation } from 'react-i18next';
import { ROUTES } from '@routes/routes';
import documentTypeService from '@services/documentTypeService';
import { unwrapList, getErrorMessage } from '@utils/apiHelpers';

const { Title, Text, Paragraph } = Typography;

/**
 * Danh mục loại giấy tờ kiểm dịch (GET /api/document-types): tên, mã, mô tả,
 * bắt buộc hay không, ai lo (khách tải lên / công ty xin)
 * @returns {JSX.Element}
 */
export default function DocumentsPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [docTypes, setDocTypes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [providerFilter, setProviderFilter] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    documentTypeService
      .getDocumentTypes({ page: 1, size: 100 })
      .then((res) => setDocTypes(unwrapList(res)))
      .catch((err) => setError(getErrorMessage(err, 'Không tải được danh mục giấy tờ')))
      .finally(() => setLoading(false));
  }, []);

  const filtered = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return docTypes.filter((item) => {
      const matchProvider = providerFilter === 'all' || item.providedBy === providerFilter;
      const matchSearch =
        !q ||
        item.name?.toLowerCase().includes(q) ||
        item.code?.toLowerCase().includes(q) ||
        item.description?.toLowerCase().includes(q);
      return matchProvider && matchSearch;
    });
  }, [docTypes, providerFilter, searchQuery]);

  const columns = [
    {
      title: t('specialist.documents.colName', 'Loại giấy tờ'),
      key: 'name',
      render: (_, record) => (
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <FileTextOutlined style={{ color: '#0F172A', fontSize: 14 }} />
            <strong style={{ fontSize: 13, color: '#0F172A' }}>{record.name}</strong>
          </div>
          <div style={{ fontSize: 11, color: '#64748B', marginTop: 2, fontFamily: 'monospace' }}>
            Mã: {record.code}
          </div>
          {record.description && (
            <Paragraph
              ellipsis={{ rows: 2, tooltip: record.description }}
              style={{ fontSize: 12, color: '#475569', marginTop: 4, marginBottom: 0 }}
            >
              {record.description}
            </Paragraph>
          )}
        </div>
      ),
    },
    {
      title: 'Người lo giấy',
      key: 'providedBy',
      width: 200,
      render: (_, record) =>
        record.providedBy === 'Company' ? (
          <Tag color="purple" style={{ borderRadius: 4 }}>Công ty xin (chuyên viên tải lên)</Tag>
        ) : (
          <Tag color="blue" style={{ borderRadius: 4 }}>Khách tải lên</Tag>
        ),
    },
    {
      title: 'Bắt buộc',
      key: 'isMandatory',
      width: 120,
      render: (_, record) =>
        record.isMandatory ? (
          <Tag color="error" style={{ borderRadius: 4 }}>Bắt buộc</Tag>
        ) : (
          <Tag style={{ borderRadius: 4 }}>Theo nước</Tag>
        ),
    },
  ];

  return (
    <div style={{ maxWidth: 1400, margin: '0 auto', padding: '20px 24px' }}>
      <div style={{ marginBottom: 20 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 12 }}>
          <div>
            <Title level={4} style={{ margin: 0, fontWeight: 700, color: '#0F172A' }}>
              {t('specialist.documents.title', 'Danh mục giấy tờ kiểm dịch')}
            </Title>
            <Text type="secondary" style={{ fontSize: 13, color: '#64748B' }}>
              Các loại giấy tờ hệ thống đang dùng; nước nào cần giấy nào xem ở trang Quy định kiểm dịch
            </Text>
          </div>
          <Space wrap size="small">
            <Button
              icon={<AuditOutlined />}
              onClick={() => navigate(ROUTES.SPECIALIST_DOSSIERS || '/specialist/dossiers')}
              style={{ borderRadius: 4 }}
            >
              {t('specialist.detail.backToList', 'Hồ sơ pháp lý')}
            </Button>
            <Button
              icon={<MedicineBoxOutlined />}
              onClick={() => navigate(ROUTES.SPECIALIST_QUARANTINE_RULES || '/specialist/quarantine-rules')}
              style={{ borderRadius: 4 }}
            >
              {t('nav.specialistQuarantineRules', 'Quy định kiểm dịch')}
            </Button>
          </Space>
        </div>
      </div>

      {error && <Alert type="error" showIcon message={error} style={{ marginBottom: 16 }} />}

      <Card
        style={{ borderRadius: 6, border: '1px solid #E2E8F0', boxShadow: 'none', marginBottom: 16 }}
        styles={{ body: { padding: '14px 16px' } }}
      >
        <Row gutter={[12, 12]} align="middle">
          <Col xs={24} sm={8} md={6}>
            <div style={{ fontSize: 12, color: '#64748B', marginBottom: 4 }}>Người lo giấy:</div>
            <Select
              style={{ width: '100%' }}
              value={providerFilter}
              onChange={setProviderFilter}
              options={[
                { value: 'all', label: 'Tất cả' },
                { value: 'Customer', label: 'Khách tải lên' },
                { value: 'Company', label: 'Công ty xin' },
              ]}
            />
          </Col>
          <Col xs={24} sm={16} md={12}>
            <div style={{ fontSize: 12, color: '#64748B', marginBottom: 4 }}>Tìm kiếm:</div>
            <Input
              prefix={<SearchOutlined style={{ color: '#94A3B8' }} />}
              placeholder="Tìm theo tên, mã, mô tả..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              allowClear
            />
          </Col>
          <Col xs={24} md={6} style={{ display: 'flex', alignItems: 'flex-end', marginTop: 'auto' }}>
            <Button
              icon={<FilterOutlined />}
              onClick={() => {
                setProviderFilter('all');
                setSearchQuery('');
              }}
              style={{ width: '100%', borderRadius: 4 }}
            >
              {t('specialist.quarantineRules.resetFilter', 'Đặt lại bộ lọc')}
            </Button>
          </Col>
        </Row>
      </Card>

      <Card style={{ borderRadius: 6, border: '1px solid #E2E8F0', boxShadow: 'none' }} styles={{ body: { padding: 0 } }}>
        <Table
          columns={columns}
          dataSource={filtered}
          rowKey="docTypeId"
          loading={loading}
          pagination={false}
          scroll={{ x: 760 }}
        />
      </Card>
    </div>
  );
}
