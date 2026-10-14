import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Card,
  Row,
  Col,
  Table,
  Tag,
  Input,
  Select,
  Button,
  Typography,
  Space,
  Drawer,
  Alert,
} from 'antd';
import {
  MedicineBoxOutlined,
  SafetyCertificateOutlined,
  SearchOutlined,
  ReloadOutlined,
  FilterOutlined,
  GlobalOutlined,
  ClockCircleOutlined,
  ArrowRightOutlined,
  AuditOutlined,
  FileTextOutlined,
} from '@ant-design/icons';
import { useTranslation } from 'react-i18next';
import { ROUTES } from '@routes/routes';
import { useQuarantineRules } from '../hooks/useQuarantineRules';

const { Title, Text, Paragraph } = Typography;

/**
 * Util 1: Quarantine Rules DB (Frame 144:14094 - Transport Special_Quarantine rules DB)
 * Tra cứu cơ sở dữ liệu quy chuẩn kiểm dịch thú y quốc tế, danh mục giấy tờ bắt buộc và thời hạn hiệu lực
 * @returns {JSX.Element}
 */
export default function QuarantineRulesPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const {
    rules,
    loading,
    error,
    countryFilter,
    setCountryFilter,
    directionFilter,
    setDirectionFilter,
    searchQuery,
    setSearchQuery,
    fetchRules,
  } = useQuarantineRules();

  // State cho Drawer xem chi tiết quy chuẩn
  const [selectedRule, setSelectedRule] = useState(null);
  const [drawerOpen, setDrawerOpen] = useState(false);

  const handleOpenDetail = (rule) => {
    setSelectedRule(rule);
    setDrawerOpen(true);
  };

  const handleCloseDetail = () => {
    setSelectedRule(null);
    setDrawerOpen(false);
  };

  // Thống kê nhanh từ dữ liệu rules an toàn tuyệt đối với fallback array
  const stats = useMemo(() => {
    const list = Array.isArray(rules) ? rules : [];
    const total = list.length;
    const mandatoryCount = list.filter((r) => r.isMandatory).length;
    const uniqueCountries = new Set(list.map((r) => r.countryCode).filter(Boolean)).size;
    const avgValidity = total > 0 ? Math.round(list.reduce((acc, cur) => acc + (cur.validityDays || 0), 0) / total) : 0;

    return {
      total,
      mandatoryCount,
      uniqueCountries,
      avgValidity,
    };
  }, [rules]);

  // Định nghĩa các cột cho bảng dữ liệu quy định
  const columns = [
    {
      title: t('specialist.quarantineRules.colCountry', 'Quốc gia & Tuyến'),
      key: 'country',
      width: 170,
      render: (_, record) => (
        <Space direction="vertical" size={2}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <GlobalOutlined style={{ color: '#0F172A', fontSize: 13 }} />
            <strong style={{ fontSize: 13, color: '#0F172A' }}>
              {record.countryName} ({record.countryCode})
            </strong>
          </div>
          <div>
            {record.direction === 'Export' ? (
              <Tag style={{ backgroundColor: '#EFF6FF', borderColor: '#BFDBFE', color: '#1D4ED8', borderRadius: 4, fontSize: 11, margin: 0 }}>
                {t('specialist.quarantineRules.export', 'Xuất khẩu')}
              </Tag>
            ) : record.direction === 'Import' ? (
              <Tag style={{ backgroundColor: '#F5F3FF', borderColor: '#DDD6FE', color: '#6D28D9', borderRadius: 4, fontSize: 11, margin: 0 }}>
                {t('specialist.quarantineRules.import', 'Nhập khẩu')}
              </Tag>
            ) : (
              <Tag style={{ backgroundColor: '#FFFBEB', borderColor: '#FDE68A', color: '#B45309', borderRadius: 4, fontSize: 11, margin: 0 }}>
                {t('specialist.quarantineRules.transit', 'Quá cảnh')}
              </Tag>
            )}
          </div>
        </Space>
      ),
    },
    {
      title: t('specialist.quarantineRules.colDoc', 'Loại giấy tờ kiểm dịch'),
      key: 'docTypeName',
      render: (_, record) => (
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
            <Text strong style={{ fontSize: 13, color: '#0F172A' }}>
              {record.docTypeName}
            </Text>
            {record.isMandatory ? (
              <Tag color="error" style={{ borderRadius: 4, fontSize: 11, margin: 0, fontWeight: 500 }}>
                {t('specialist.quarantineRules.mandatory', 'Bắt buộc')}
              </Tag>
            ) : (
              <Tag style={{ borderRadius: 4, fontSize: 11, margin: 0, color: '#64748B' }}>
                {t('specialist.quarantineRules.optional', 'Tùy chọn')}
              </Tag>
            )}
          </div>
          <div style={{ fontSize: 11, color: '#64748B', marginTop: 2, fontFamily: 'monospace' }}>
            Mã chuẩn: {record.docTypeCode}
          </div>
        </div>
      ),
    },
    {
      title: t('specialist.quarantineRules.colValidity', 'Thời hạn hiệu lực'),
      key: 'validityDays',
      width: 150,
      render: (_, record) => {
        const isShort = record.validityDays <= 14;
        return (
          <Space direction="vertical" size={2}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
              <ClockCircleOutlined style={{ color: isShort ? '#D97706' : '#64748B', fontSize: 12 }} />
              <strong style={{ fontSize: 13, color: '#0F172A' }}>
                {record.validityDays} {t('specialist.quarantineRules.days', 'ngày')}
              </strong>
            </div>
            {isShort && (
              <Tag style={{ backgroundColor: '#FFFBEB', borderColor: '#FDE68A', color: '#B45309', fontSize: 10, margin: 0 }}>
                Thời hạn ngắn
              </Tag>
            )}
          </Space>
        );
      },
    },
    {
      title: t('specialist.quarantineRules.colAuthority', 'Cơ quan cấp phép'),
      dataIndex: 'issuingAuthority',
      key: 'issuingAuthority',
      width: 220,
      render: (text, record) => (
        <div style={{ fontSize: 12, color: '#334155', display: 'flex', alignItems: 'flex-start', gap: 6 }}>
          <SafetyCertificateOutlined style={{ color: '#0F172A', marginTop: 3, flexShrink: 0 }} />
          <span>{typeof text === 'string' ? text : (record?.issuingAuthority || '---')}</span>
        </div>
      ),
    },
    {
      title: t('specialist.quarantineRules.colNotes', 'Quy chuẩn & Căn cứ pháp lý'),
      dataIndex: 'regulationNote',
      key: 'regulationNote',
      render: (text) => (
        <Paragraph
          ellipsis={{ rows: 2, tooltip: typeof text === 'string' ? text : '' }}
          style={{ fontSize: 12, color: '#64748B', margin: 0, lineHeight: 1.4 }}
        >
          {text}
        </Paragraph>
      ),
    },
    {
      title: t('specialist.quarantineRules.colAction', 'Thao tác'),
      key: 'action',
      width: 120,
      align: 'right',
      render: (_, record) => (
        <Button
          size="small"
          type="link"
          icon={<ArrowRightOutlined />}
          style={{ fontSize: 12, padding: 0, color: '#2563EB', fontWeight: 500 }}
          onClick={() => handleOpenDetail(record)}
        >
          {t('specialist.quarantineRules.viewDetail', 'Xem chi tiết')}
        </Button>
      ),
    },
  ];

  return (
    <div style={{ maxWidth: 1400, margin: '0 auto', padding: '20px 24px' }}>
      {/* Tiêu đề trang & Thanh công cụ phía trên */}
      <div style={{ marginBottom: 20 }}>
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            flexWrap: 'wrap',
            gap: 12,
            marginBottom: 6,
          }}
        >
          <div>
            <Title level={4} style={{ margin: 0, fontWeight: 700, color: '#0F172A' }}>
              {t('specialist.quarantineRules.title', 'Cơ sở dữ liệu Quy định kiểm dịch')}
            </Title>
            <Text type="secondary" style={{ fontSize: 13, color: '#64748B' }}>
              {t(
                'specialist.quarantineRules.subtitle',
                'Tra cứu quy chuẩn thú y, danh mục giấy tờ bắt buộc và thời hạn hiệu lực theo quốc gia & tuyến vận chuyển'
              )}
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
              icon={<FileTextOutlined />}
              onClick={() => navigate(ROUTES.SPECIALIST_DOCUMENTS || '/specialist/documents')}
              style={{ borderRadius: 4 }}
            >
              {t('nav.specialistDocuments', 'Biểu mẫu hồ sơ')}
            </Button>
            <Button
              icon={<ReloadOutlined />}
              onClick={fetchRules}
              loading={loading}
              style={{ borderRadius: 4 }}
            >
              {t('specialist.quarantineRules.refresh', 'Làm mới')}
            </Button>
          </Space>
        </div>
      </div>

      {error && (
        <Alert
          message={error}
          type="error"
          showIcon
          style={{ marginBottom: 16 }}
          closable
        />
      )}

      {/* 4 Thẻ thống kê số liệu tổng quan (Stats Row) */}
      <Row gutter={[16, 16]} style={{ marginBottom: 20 }}>
        <Col xs={12} sm={6}>
          <Card
            style={{ borderRadius: 6, border: '1px solid #E2E8F0', boxShadow: 'none' }}
            styles={{ body: { padding: '14px 16px' } }}
          >
            <Text type="secondary" style={{ fontSize: 12, color: '#64748B' }}>
              {t('specialist.quarantineRules.statTotalRules', 'Tổng số quy định')}
            </Text>
            <div style={{ fontSize: 24, fontWeight: 700, color: '#0F172A', marginTop: 4 }}>
              {stats.total}
            </div>
          </Card>
        </Col>

        <Col xs={12} sm={6}>
          <Card
            style={{ borderRadius: 6, border: '1px solid #E2E8F0', boxShadow: 'none' }}
            styles={{ body: { padding: '14px 16px' } }}
          >
            <Text type="secondary" style={{ fontSize: 12, color: '#64748B' }}>
              {t('specialist.quarantineRules.statMandatoryDocs', 'Giấy tờ bắt buộc')}
            </Text>
            <div style={{ fontSize: 24, fontWeight: 700, color: '#B91C1C', marginTop: 4 }}>
              {stats.mandatoryCount}
            </div>
          </Card>
        </Col>

        <Col xs={12} sm={6}>
          <Card
            style={{ borderRadius: 6, border: '1px solid #E2E8F0', boxShadow: 'none' }}
            styles={{ body: { padding: '14px 16px' } }}
          >
            <Text type="secondary" style={{ fontSize: 12, color: '#64748B' }}>
              {t('specialist.quarantineRules.statKeyMarkets', 'Thị trường trọng điểm')}
            </Text>
            <div style={{ fontSize: 24, fontWeight: 700, color: '#15803D', marginTop: 4 }}>
              {stats.uniqueCountries} quốc gia
            </div>
          </Card>
        </Col>

        <Col xs={12} sm={6}>
          <Card
            style={{ borderRadius: 6, border: '1px solid #E2E8F0', boxShadow: 'none' }}
            styles={{ body: { padding: '14px 16px' } }}
          >
            <Text type="secondary" style={{ fontSize: 12, color: '#64748B' }}>
              {t('specialist.quarantineRules.statAvgValidity', 'Hiệu lực trung bình')}
            </Text>
            <div style={{ fontSize: 24, fontWeight: 700, color: '#0F172A', marginTop: 4 }}>
              {stats.avgValidity} ngày
            </div>
          </Card>
        </Col>
      </Row>

      {/* Thanh lọc dữ liệu (Filter Toolbar) */}
      <Card
        style={{
          borderRadius: 6,
          border: '1px solid #E2E8F0',
          boxShadow: 'none',
          marginBottom: 16,
        }}
        styles={{ body: { padding: '14px 16px' } }}
      >
        <Row gutter={[12, 12]} align="middle">
          {/* Lọc theo quốc gia */}
          <Col xs={24} sm={8} md={6}>
            <div style={{ fontSize: 12, color: '#64748B', marginBottom: 4 }}>
              {t('specialist.quarantineRules.countryFilter', 'Quốc gia')}:
            </div>
            <Select
              style={{ width: '100%' }}
              value={countryFilter}
              onChange={setCountryFilter}
              options={[
                { value: 'all', label: t('specialist.quarantineRules.allCountries', 'Tất cả quốc gia') },
                { value: 'VN', label: 'Việt Nam (VN)' },
                { value: 'CN', label: 'Trung Quốc (CN)' },
                { value: 'TH', label: 'Thái Lan (TH)' },
                { value: 'SG', label: 'Singapore (SG)' },
                { value: 'US', label: 'Hoa Kỳ (US)' },
                { value: 'EU', label: 'Liên minh Châu Âu (EU)' },
              ]}
            />
          </Col>

          {/* Lọc theo chiều vận chuyển */}
          <Col xs={24} sm={8} md={6}>
            <div style={{ fontSize: 12, color: '#64748B', marginBottom: 4 }}>
              {t('specialist.quarantineRules.directionFilter', 'Chiều vận chuyển')}:
            </div>
            <Select
              style={{ width: '100%' }}
              value={directionFilter}
              onChange={setDirectionFilter}
              options={[
                { value: 'all', label: t('specialist.quarantineRules.allDirections', 'Tất cả chiều') },
                { value: 'Export', label: t('specialist.quarantineRules.export', 'Xuất khẩu (Export)') },
                { value: 'Import', label: t('specialist.quarantineRules.import', 'Nhập khẩu (Import)') },
                { value: 'Transit', label: t('specialist.quarantineRules.transit', 'Quá cảnh (Transit)') },
              ]}
            />
          </Col>

          {/* Ô tìm kiếm từ khóa */}
          <Col xs={24} sm={8} md={8}>
            <div style={{ fontSize: 12, color: '#64748B', marginBottom: 4 }}>
              Tìm kiếm quy định:
            </div>
            <Input
              prefix={<SearchOutlined style={{ color: '#94A3B8' }} />}
              placeholder={t('specialist.quarantineRules.searchPlaceholder', 'Tìm tên giấy tờ, cơ quan, ghi chú...')}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              allowClear
            />
          </Col>

          {/* Nút đặt lại bộ lọc */}
          <Col xs={24} md={4} style={{ textAlign: 'right', display: 'flex', alignItems: 'flex-end', height: '100%', marginTop: 'auto' }}>
            <Button
              icon={<FilterOutlined />}
              onClick={() => {
                setCountryFilter('all');
                setDirectionFilter('all');
                setSearchQuery('');
              }}
              style={{ width: '100%', borderRadius: 4 }}
            >
              {t('specialist.quarantineRules.resetFilter', 'Đặt lại')}
            </Button>
          </Col>
        </Row>
      </Card>

      {/* Bảng dữ liệu tra cứu quy định kiểm dịch */}
      <Card
        style={{
          borderRadius: 6,
          border: '1px solid #E2E8F0',
          boxShadow: 'none',
        }}
        styles={{ body: { padding: 0 } }}
      >
        <Table
          columns={columns}
          dataSource={Array.isArray(rules) ? rules : []}
          rowKey={(r) => r.requirementId || `${r.countryCode}-${r.docTypeCode}-${r.direction}`}
          loading={loading}
          pagination={{
            pageSize: 10,
            showSizeChanger: true,
            showTotal: (total) => `Tổng cộng ${total} quy chuẩn kiểm dịch`,
          }}
          scroll={{ x: 900 }}
        />
      </Card>

      {/* Drawer xem chi tiết quy chuẩn kiểm dịch */}
      <Drawer
        title={
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <MedicineBoxOutlined style={{ color: '#0F172A' }} />
            <span style={{ fontWeight: 600, color: '#0F172A', fontSize: 15 }}>
              {t('specialist.quarantineRules.detailTitle', 'Chi tiết quy chuẩn kiểm dịch thú y')}
            </span>
          </div>
        }
        placement="right"
        width={560}
        onClose={handleCloseDetail}
        open={drawerOpen}
      >
        {selectedRule && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            {/* Thẻ thông tin loại giấy tờ */}
            <div style={{ padding: '14px', backgroundColor: '#F8FAFC', borderRadius: 6, border: '1px solid #E2E8F0' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 10 }}>
                <Title level={5} style={{ margin: 0, color: '#0F172A' }}>
                  {selectedRule.docTypeName}
                </Title>
                {selectedRule.isMandatory ? (
                  <Tag color="error" style={{ borderRadius: 4, margin: 0 }}>Bắt buộc</Tag>
                ) : (
                  <Tag style={{ borderRadius: 4, margin: 0 }}>Tùy chọn</Tag>
                )}
              </div>
              <div style={{ fontSize: 12, color: '#64748B', marginTop: 4 }}>
                Mã loại: <strong>{selectedRule.docTypeCode}</strong> • Tuyến:{' '}
                <strong>
                  {selectedRule.countryName} ({selectedRule.direction})
                </strong>
              </div>
            </div>

            {/* Khối điều kiện & Thời hạn */}
            <div>
              <Text strong style={{ fontSize: 13, color: '#0F172A', display: 'block', marginBottom: 8 }}>
                Thời hạn & Cơ quan ban hành
              </Text>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                <div style={{ padding: '10px 12px', backgroundColor: '#FFFFFF', border: '1px solid #E2E8F0', borderRadius: 4 }}>
                  <Text type="secondary" style={{ fontSize: 11, display: 'block' }}>Thời hạn tối đa:</Text>
                  <strong style={{ fontSize: 14, color: '#0F172A' }}>{selectedRule.validityDays} ngày</strong>
                </div>
                <div style={{ padding: '10px 12px', backgroundColor: '#FFFFFF', border: '1px solid #E2E8F0', borderRadius: 4 }}>
                  <Text type="secondary" style={{ fontSize: 11, display: 'block' }}>Hiệu lực áp dụng:</Text>
                  <strong style={{ fontSize: 13, color: '#0F172A' }}>{selectedRule.effectiveDate || '2024-01-01'}</strong>
                </div>
              </div>
            </div>

            {/* Cơ quan thẩm quyền */}
            <div>
              <Text strong style={{ fontSize: 13, color: '#0F172A', display: 'block', marginBottom: 6 }}>
                Cơ quan cấp phép có thẩm quyền:
              </Text>
              <div style={{ padding: '10px 12px', backgroundColor: '#F8FAFC', border: '1px solid #E2E8F0', borderRadius: 4, fontSize: 12, color: '#334155' }}>
                <SafetyCertificateOutlined style={{ marginRight: 6, color: '#0F172A' }} />
                {selectedRule.issuingAuthority}
              </div>
            </div>

            {/* Toàn văn ghi chú & Căn cứ pháp lý */}
            <div>
              <Text strong style={{ fontSize: 13, color: '#0F172A', display: 'block', marginBottom: 6 }}>
                Quy chuẩn & Yêu cầu kỹ thuật:
              </Text>
              <div
                style={{
                  padding: '12px',
                  backgroundColor: '#FFFFFF',
                  border: '1px solid #E2E8F0',
                  borderRadius: 4,
                  fontSize: 13,
                  lineHeight: 1.6,
                  color: '#334155',
                }}
              >
                {selectedRule.regulationNote}
              </div>
            </div>

            {/* Tiêu chí 3-Point Checklist bắt buộc khi thẩm định */}
            <div style={{ padding: '12px', backgroundColor: '#F0FDF4', border: '1px solid #DCFCE7', borderRadius: 6 }}>
              <div style={{ fontWeight: 600, color: '#166534', fontSize: 13, marginBottom: 6 }}>
                ✓ Tiêu chí thẩm định 3-Point Checklist:
              </div>
              <ul style={{ margin: 0, paddingLeft: 18, fontSize: 12, color: '#166534', lineHeight: 1.7 }}>
                <li><strong>Định dạng:</strong> File ảnh chụp hoặc scan rõ nét, đầy đủ con dấu và chữ ký thú y.</li>
                <li><strong>Đối tượng:</strong> Tên ngựa và mã số vi mạch RFID trùng khớp 100% với đơn đặt chuyến.</li>
                <li><strong>Thời hạn:</strong> Ngày cấp và hạn sử dụng nằm trong khoảng {selectedRule.validityDays} ngày trước giờ khởi hành.</li>
              </ul>
            </div>
          </div>
        )}
      </Drawer>
    </div>
  );
}
