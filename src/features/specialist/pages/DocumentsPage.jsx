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
  Modal,
} from 'antd';
import {
  FileTextOutlined,
  SearchOutlined,
  DownloadOutlined,
  EyeOutlined,
  SafetyCertificateOutlined,
  AuditOutlined,
  MedicineBoxOutlined,
  FilterOutlined,
} from '@ant-design/icons';
import { useTranslation } from 'react-i18next';
import { ROUTES } from '@routes/routes';

const { Title, Text, Paragraph } = Typography;

/**
 * Danh sách mẫu biểu kiểm dịch chuẩn hóa phục vụ tra cứu và thẩm định (Frame 128:4886 - Custom Docs)
 */
const STANDARD_TEMPLATES = [
  {
    templateId: 1,
    name: 'FEI Recognition Card & Equine Passport',
    code: 'HORSE_PASSPORT',
    category: 'Passport',
    authority: 'Fédération Equestre Internationale (FEI)',
    validityMonths: 12,
    fileSize: '2.4 MB',
    fileType: 'PDF',
    description: 'Hộ chiếu chuẩn FEI quốc tế bao gồm sơ đồ nhận dạng xoáy lông, biểu đồ đặc điểm dị tật và xác nhận gắn chip RFID ISO 11784/11785.',
    auditRules: [
      'Có tem nhận dạng FEI còn hạn sử dụng',
      'Xác nhận vi mạch 15 chữ số trùng khớp',
      'Đầy đủ xác nhận tiêm vắc-xin trong vòng 6 tháng',
    ],
    sampleUrl: 'https://images.unsplash.com/photo-1553284965-83fd3e82fa5a?auto=format&fit=crop&w=800&q=80',
  },
  {
    templateId: 2,
    name: 'Mẫu Giấy chứng nhận kiểm dịch động vật xuất khẩu (Mẫu 12A)',
    code: 'HEALTH_CERT',
    category: 'Health',
    authority: 'Cục Thú y - Bộ Nông nghiệp & PTNT Việt Nam',
    validityMonths: 0.33, // 10 ngày
    fileSize: '1.8 MB',
    fileType: 'PDF',
    description: 'Giấy chứng nhận thú y quốc tế xác nhận cá thể ngựa không mang mầm bệnh truyền nhiễm thuộc Danh mục OIE và đủ điều kiện xuất cảnh.',
    auditRules: [
      'Dấu mộc tròn đỏ giáp lai của Chi cục Thú y vùng',
      'Thời hạn cấp không quá 10 ngày trước ngày bay/di chuyển',
      'Chữ ký tươi của Trưởng kiểm dịch viên thú y',
    ],
    sampleUrl: 'https://images.unsplash.com/photo-1568605117036-5fe5e7bab0b7?auto=format&fit=crop&w=800&q=80',
  },
  {
    templateId: 3,
    name: 'Phiếu kết quả xét nghiệm Coggins EIA (Equine Infectious Anemia)',
    code: 'COGGINS_EIA',
    category: 'Health',
    authority: 'Trung tâm Chẩn đoán Thú y Trung ương / Phòng Lab ISO 17025',
    validityMonths: 1, // 30 ngày
    fileSize: '950 KB',
    fileType: 'PDF',
    description: 'Kết quả xét nghiệm huyết thanh học âm tính đối với virus gây bệnh Thiếu máu truyền nhiễm ngựa theo phương pháp Agar Gel Immunodiffusion (AGID).',
    auditRules: [
      'Kết quả xét nghiệm ghi rõ: Negative (Âm tính)',
      'Thời hạn lấy mẫu không quá 30 ngày',
      'Đầy đủ mã số mẫu và dấu xác nhận của phòng kiểm nghiệm',
    ],
    sampleUrl: 'https://images.unsplash.com/photo-1579154204601-01588f351e67?auto=format&fit=crop&w=800&q=80',
  },
  {
    templateId: 4,
    name: 'Giấy phép kiểm dịch nhập khẩu động vật thi đấu (GACC Import Permit)',
    code: 'IMPORT_PERMIT',
    category: 'Permit',
    authority: 'Tổng cục Hải quan Trung Quốc (GACC)',
    validityMonths: 3, // 90 ngày
    fileSize: '3.1 MB',
    fileType: 'PDF',
    description: 'Văn bản chấp thuận nhập khẩu đặc thù dành cho ngựa thể thao tham dự các giải đấu quốc tế theo Nghị định thư kiểm dịch song phương.',
    auditRules: [
      'Mã số cấp phép trực tuyến trên cổng GACC một cửa',
      'Thời gian lưu trú cho phép trùng khớp lịch trình chuyến',
      'Cửa khẩu nhập cảnh được chỉ định rõ (Sân bay quốc tế / Cửa khẩu bộ)',
    ],
    sampleUrl: 'https://images.unsplash.com/photo-1589829545856-d10d557cf95f?auto=format&fit=crop&w=800&q=80',
  },
  {
    templateId: 5,
    name: 'Giấy phép kiểm dịch động vật sống DLD Thái Lan',
    code: 'IMPORT_PERMIT_TH',
    category: 'Permit',
    authority: 'Department of Livestock Development (DLD), Thái Lan',
    validityMonths: 2, // 60 ngày
    fileSize: '1.2 MB',
    fileType: 'PDF',
    description: 'Phê duyệt điều kiện cách ly kiểm dịch tại trại đến và lộ trình vận chuyển nội địa tại Vương quốc Thái Lan.',
    auditRules: [
      'Đăng ký địa chỉ cơ sở cách ly hợp chuẩn tại Thái Lan',
      'Phê duyệt thời gian vận chuyển từ trạm kiểm dịch cửa khẩu',
      'Có chữ ký của Giám đốc bộ phận Kiểm dịch Động vật DLD',
    ],
    sampleUrl: 'https://images.unsplash.com/photo-1589829545856-d10d557cf95f?auto=format&fit=crop&w=800&q=80',
  },
  {
    templateId: 6,
    name: 'Biên bản giám sát cách ly kiểm dịch 14 ngày trước xuất phát',
    code: 'QUARANTINE_ISOLATION_CERT',
    category: 'Health',
    authority: 'Trạm Thú y & Bác sĩ Thú y phụ trách cơ sở',
    validityMonths: 0.5, // 14 ngày
    fileSize: '820 KB',
    fileType: 'PDF',
    description: 'Nhật ký đo thân nhiệt 2 lần/ngày, giám sát triệu chứng hô hấp và tình trạng sức khỏe cá thể ngựa liên tục 14 ngày trước khi xuất phát.',
    auditRules: [
      'Bảng ghi chép nhiệt độ không sốt (>38.5°C)',
      'Không có ghi nhận ho, chảy nước mũi hoặc triệu chứng thần kinh',
      'Xác nhận cách ly tại khu chuồng riêng biệt',
    ],
    sampleUrl: 'https://images.unsplash.com/photo-1553284965-83fd3e82fa5a?auto=format&fit=crop&w=800&q=80',
  },
];

/**
 * Util 2: Standard Clearance Document Templates (Frame 128:4886 - Custom Docs)
 * Quản lý và tra cứu kho biểu mẫu hồ sơ pháp lý kiểm dịch chuẩn hóa
 * @returns {JSX.Element}
 */
export default function DocumentsPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [previewModal, setPreviewModal] = useState({ open: false, template: null });

  const filteredTemplates = useMemo(() => {
    return STANDARD_TEMPLATES.filter((item) => {
      const matchCategory = categoryFilter === 'all' || item.category === categoryFilter;
      const matchSearch =
        !searchQuery ||
        item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.code.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.authority.toLowerCase().includes(searchQuery.toLowerCase());
      return matchCategory && matchSearch;
    });
  }, [categoryFilter, searchQuery]);

  const columns = [
    {
      title: t('specialist.documents.colName', 'Tên biểu mẫu chuẩn'),
      key: 'name',
      render: (_, record) => (
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <FileTextOutlined style={{ color: '#0F172A', fontSize: 14 }} />
            <strong style={{ fontSize: 13, color: '#0F172A' }}>{record.name}</strong>
          </div>
          <div style={{ fontSize: 11, color: '#64748B', marginTop: 2, fontFamily: 'monospace' }}>
            Mã định danh: {record.code} • Định dạng: {record.fileType} ({record.fileSize})
          </div>
          <Paragraph
            ellipsis={{ rows: 2 }}
            style={{ fontSize: 12, color: '#475569', marginTop: 4, marginBottom: 0 }}
          >
            {record.description}
          </Paragraph>
        </div>
      ),
    },
    {
      title: t('specialist.documents.colCategory', 'Phân loại'),
      key: 'category',
      width: 150,
      render: (_, record) => {
        if (record.category === 'Passport') {
          return (
            <Tag style={{ backgroundColor: '#EFF6FF', borderColor: '#BFDBFE', color: '#1D4ED8', borderRadius: 4 }}>
              Hộ chiếu & Chip
            </Tag>
          );
        }
        if (record.category === 'Health') {
          return (
            <Tag style={{ backgroundColor: '#F0FDF4', borderColor: '#BBF7D0', color: '#15803D', borderRadius: 4 }}>
              Thú y & Kiểm dịch
            </Tag>
          );
        }
        return (
          <Tag style={{ backgroundColor: '#F5F3FF', borderColor: '#DDD6FE', color: '#6D28D9', borderRadius: 4 }}>
            Giấy phép Nhập cảnh
          </Tag>
        );
      },
    },
    {
      title: t('specialist.documents.colAuthority', 'Cơ quan quy định'),
      dataIndex: 'authority',
      key: 'authority',
      width: 220,
      render: (text) => (
        <div style={{ fontSize: 12, color: '#334155', display: 'flex', alignItems: 'flex-start', gap: 6 }}>
          <SafetyCertificateOutlined style={{ color: '#0F172A', marginTop: 2, flexShrink: 0 }} />
          <span>{text}</span>
        </div>
      ),
    },
    {
      title: t('specialist.documents.colAuditCriteria', 'Tiêu chí thẩm định (3-Point)'),
      key: 'auditRules',
      width: 280,
      render: (_, record) => (
        <ul style={{ margin: 0, paddingLeft: 16, fontSize: 11, color: '#475569', lineHeight: 1.5 }}>
          {record.auditRules.map((rule, idx) => (
            <li key={idx}>{rule}</li>
          ))}
        </ul>
      ),
    },
    {
      title: 'Thao tác',
      key: 'action',
      width: 190,
      align: 'right',
      render: (_, record) => (
        <Space size={6}>
          <Button
            size="small"
            icon={<EyeOutlined />}
            style={{
              borderRadius: 4,
              borderColor: '#CBD5E1',
              color: '#0F172A',
              fontWeight: 500,
              fontSize: 12,
            }}
            onClick={() => setPreviewModal({ open: true, template: record })}
          >
            {t('specialist.documents.btnPreview', 'Xem mẫu')}
          </Button>
          <Button
            size="small"
            type="primary"
            icon={<DownloadOutlined />}
            style={{
              backgroundColor: '#0F172A',
              borderColor: '#0F172A',
              color: '#FFFFFF',
              borderRadius: 4,
              fontWeight: 500,
              fontSize: 12,
            }}
            onClick={() => {
              window.open(record.sampleUrl, '_blank');
            }}
          >
            {t('specialist.documents.btnDownload', 'Tải PDF')}
          </Button>
        </Space>
      ),
    },
  ];

  return (
    <div style={{ maxWidth: 1400, margin: '0 auto', padding: '20px 24px' }}>
      {/* Header */}
      <div style={{ marginBottom: 20 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 12 }}>
          <div>
            <Title level={4} style={{ margin: 0, fontWeight: 700, color: '#0F172A' }}>
              {t('specialist.documents.title', 'Kho biểu mẫu & Hồ sơ kiểm dịch')}
            </Title>
            <Text type="secondary" style={{ fontSize: 13, color: '#64748B' }}>
              {t(
                'specialist.documents.subtitle',
                'Danh mục biểu mẫu chuẩn hóa và hướng dẫn thẩm định pháp lý cho từng loại giấy tờ'
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
              icon={<MedicineBoxOutlined />}
              onClick={() => navigate(ROUTES.SPECIALIST_QUARANTINE_RULES || '/specialist/quarantine-rules')}
              style={{ borderRadius: 4 }}
            >
              {t('nav.specialistQuarantineRules', 'Quy định kiểm dịch')}
            </Button>
          </Space>
        </div>
      </div>

      {/* Filter toolbar */}
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
          <Col xs={24} sm={8} md={6}>
            <div style={{ fontSize: 12, color: '#64748B', marginBottom: 4 }}>
              Phân loại tài liệu:
            </div>
            <Select
              style={{ width: '100%' }}
              value={categoryFilter}
              onChange={setCategoryFilter}
              options={[
                { value: 'all', label: t('specialist.documents.categoryAll', 'Tất cả loại') },
                { value: 'Passport', label: t('specialist.documents.categoryPassport', 'Hộ chiếu & Nhận dạng') },
                { value: 'Health', label: t('specialist.documents.categoryHealth', 'Kiểm dịch & Xét nghiệm') },
                { value: 'Permit', label: t('specialist.documents.categoryPermit', 'Giấy phép Nhập cảnh') },
              ]}
            />
          </Col>

          <Col xs={24} sm={16} md={12}>
            <div style={{ fontSize: 12, color: '#64748B', marginBottom: 4 }}>
              Tìm kiếm biểu mẫu:
            </div>
            <Input
              prefix={<SearchOutlined style={{ color: '#94A3B8' }} />}
              placeholder={t('specialist.documents.searchPlaceholder', 'Tìm kiếm mẫu tài liệu theo tên, mã, cơ quan...')}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              allowClear
            />
          </Col>

          <Col xs={24} md={6} style={{ textAlign: 'right', display: 'flex', alignItems: 'flex-end', height: '100%', marginTop: 'auto' }}>
            <Button
              icon={<FilterOutlined />}
              onClick={() => {
                setCategoryFilter('all');
                setSearchQuery('');
              }}
              style={{ width: '100%', borderRadius: 4 }}
            >
              {t('specialist.quarantineRules.resetFilter', 'Đặt lại bộ lọc')}
            </Button>
          </Col>
        </Row>
      </Card>

      {/* Table */}
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
          dataSource={filteredTemplates}
          rowKey="templateId"
          pagination={false}
          scroll={{ x: 950 }}
        />
      </Card>

      {/* Modal xem trước mẫu giấy tờ */}
      <Modal
        title={
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <FileTextOutlined style={{ color: '#0F172A' }} />
            <span>{previewModal.template?.name || 'Mẫu giấy tờ kiểm dịch'}</span>
          </div>
        }
        open={previewModal.open}
        onCancel={() => setPreviewModal({ open: false, template: null })}
        footer={
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8 }}>
            <Button onClick={() => setPreviewModal({ open: false, template: null })}>
              {t('specialist.quarantineRules.close', 'Đóng')}
            </Button>
            <Button
              type="primary"
              icon={<DownloadOutlined />}
              style={{ backgroundColor: '#0F172A', borderColor: '#0F172A' }}
              onClick={() => {
                if (previewModal.template?.sampleUrl) {
                  window.open(previewModal.template.sampleUrl, '_blank');
                }
              }}
            >
              {t('specialist.documents.btnDownloadSample', 'Tải bản chuẩn PDF')}
            </Button>
          </div>
        }
        width={720}
      >
        {previewModal.template && (
          <div>
            <div style={{ marginBottom: 12, padding: '10px 14px', backgroundColor: '#F8FAFC', borderRadius: 4, border: '1px solid #E2E8F0' }}>
              <div style={{ fontSize: 12, color: '#334155' }}>
                <strong>Cơ quan ban hành:</strong> {previewModal.template.authority}
              </div>
              <div style={{ fontSize: 12, color: '#64748B', marginTop: 4 }}>
                {previewModal.template.description}
              </div>
            </div>

            <div style={{ textAlign: 'center', padding: '10px 0', backgroundColor: '#F1F5F9', borderRadius: 4 }}>
              <img
                src={previewModal.template.sampleUrl}
                alt={previewModal.template.name}
                style={{ maxWidth: '100%', maxHeight: '420px', objectFit: 'contain', borderRadius: 4 }}
              />
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
