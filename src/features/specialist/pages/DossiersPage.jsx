import { useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import {
  Card,
  Table,
  Button,
  Input,
  Select,
  Space,
  Typography,
  Alert,
} from 'antd';
import {
  SearchOutlined,
  EyeOutlined,
  BookOutlined,
  FileTextOutlined,
} from '@ant-design/icons';
import { useSpecialistDossiers } from '../hooks/useSpecialistDossiers';
import { ROUTES } from '@routes/routes';
import DossierStatusTag from '../components/DossierStatusTag';

const { Title, Text } = Typography;

/**
 * Màn 2: Dossier & Quarantine Management (Frame 141:9644 - Trans_Dossier list)
 * Trang quản lý danh sách hồ sơ kiểm dịch, thẩm định giấy tờ và giám sát thông quan
 * @returns {JSX.Element}
 */
export default function DossiersPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const location = useLocation();

  // Nhận filter từ navigation state nếu có (từ Dashboard click sang)
  const initialFilter = location.state?.filterStatus || 'All';
  const initialSearch = location.state?.search || '';

  const {
    dossiers,
    loading,
    error,
    pagination,
    filterStatus,
    setFilterStatus,
    searchQuery,
    setSearchQuery,
    setPagination,
    fetchDossiers,
  } = useSpecialistDossiers({
    status: initialFilter,
    search: initialSearch,
  });

  useEffect(() => {
    fetchDossiers();
  }, [fetchDossiers]);

  // Điều hướng sang màn hình thẩm định chi tiết Màn 3
  const handleInspect = (dossierId) => {
    navigate(`/specialist/dossiers/${dossierId}`);
  };

  // Điều hướng sang tra cứu cơ sở dữ liệu quy định kiểm dịch (Util 1)
  const handleOpenQuarantineRules = () => {
    navigate(ROUTES.SPECIALIST_QUARANTINE_RULES || '/specialist/quarantine-rules');
  };

  // Render tag trạng thái thông qua component tái sử dụng
  const renderStatusTag = (status) => <DossierStatusTag status={status} />;

  // Cấu hình các cột bảng danh sách
  const columns = [
    {
      title: t('specialist.dossiers.colCode', 'Mã hồ sơ'),
      dataIndex: 'dossierCode',
      key: 'dossierCode',
      width: 140,
      render: (code, record) => (
        <div>
          <Text
            strong
            style={{ color: '#0F172A', cursor: 'pointer' }}
            onClick={(e) => {
              e.stopPropagation();
              handleInspect(record.dossierId);
            }}
          >
            {code}
          </Text>
          <div style={{ fontSize: 11, color: '#94A3B8' }}>{record.bookingCode}</div>
        </div>
      ),
    },
    {
      title: t('specialist.dossiers.colHorse', 'Tên cá thể'),
      dataIndex: 'horseName',
      key: 'horseName',
      width: 200,
      render: (horseName, record) => (
        <div>
          <Text strong style={{ color: '#1E293B', fontSize: 13 }}>
            {horseName}
          </Text>
          <div style={{ fontSize: 11, color: '#64748B' }}>
            RFID: <span style={{ fontFamily: 'monospace' }}>{record.microchipNumber}</span>
          </div>
          <div style={{ fontSize: 11, color: '#94A3B8' }}>
            {record.breed} • {record.gender}
          </div>
        </div>
      ),
    },
    {
      title: t('specialist.dossiers.colCustomer', 'Chủ sở hữu'),
      dataIndex: 'customerName',
      key: 'customerName',
      width: 170,
      render: (customerName, record) => (
        <div>
          <div style={{ fontWeight: 500, color: '#334155', fontSize: 13 }}>{customerName}</div>
          <div style={{ fontSize: 11, color: '#64748B' }}>{record.customerPhone}</div>
        </div>
      ),
    },
    {
      title: t('specialist.dossiers.colDestination', 'Tuyến vận chuyển'),
      key: 'destination',
      width: 160,
      render: (_, record) => (
        <div>
          <div style={{ fontWeight: 600, color: '#0F172A', fontSize: 12 }}>
            {record.pickupCountryCode} ➔ {record.dropoffCountryCode}
          </div>
          <div style={{ fontSize: 11, color: '#64748B' }}>
            {record.dropoffAddress?.length > 22
              ? `${record.dropoffAddress.substring(0, 22)}...`
              : record.dropoffAddress}
          </div>
        </div>
      ),
    },
    {
      title: t('specialist.dossiers.colStatus', 'Trạng thái'),
      dataIndex: 'status',
      key: 'status',
      width: 150,
      render: (status) => renderStatusTag(status),
    },
    {
      title: t('specialist.dossiers.colSla', 'Thời hạn SLA'),
      key: 'sla',
      width: 130,
      render: (_, record) => {
        if (record.slaStatus === 'Overdue') {
          return (
            <span style={{ color: '#DC2626', fontWeight: 600, fontSize: 12 }}>
              {t('specialist.sla.overdue', 'Quá hạn')}
            </span>
          );
        }
        if (record.slaStatus === 'Warning') {
          return (
            <span style={{ color: '#B45309', fontWeight: 500, fontSize: 12 }}>
              {record.slaHoursRemaining}h {t('specialist.sla.left', 'còn')}
            </span>
          );
        }
        return (
          <span style={{ color: '#475569', fontSize: 12 }}>
            {record.slaHoursRemaining || 48}h
          </span>
        );
      },
    },
    {
      title: t('specialist.dossiers.colActions', 'Thao tác'),
      key: 'actions',
      width: 110,
      align: 'center',
      render: (_, record) => (
        <Button
          type="default"
          size="small"
          icon={<EyeOutlined />}
          style={{
            borderColor: '#CBD5E1',
            borderRadius: 4,
            fontSize: 12,
            color: '#0F172A',
          }}
          onClick={(e) => {
            e.stopPropagation();
            handleInspect(record.dossierId);
          }}
        >
          {t('specialist.dossiers.inspectBtn', 'Thẩm định')}
        </Button>
      ),
    },
  ];

  return (
    <div style={{ padding: '0 0 24px 0' }}>
      {/* Header bar */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: 16,
          marginBottom: 16,
        }}
      >
        <div>
          <Title level={4} style={{ margin: 0, fontWeight: 700, color: '#0F172A' }}>
            {t('specialist.dossiers.title', 'Dossier & Quarantine Management')}
          </Title>
          <Text type="secondary" style={{ fontSize: 13, color: '#64748B' }}>
            {t(
              'specialist.dossiers.subtitle',
              'Quản lý hồ sơ kiểm dịch, thẩm định 3-Point Audit và nộp cơ quan chức năng'
            )}
          </Text>
        </div>

        <Space wrap size="small">
          <Button
            type="default"
            icon={<FileTextOutlined />}
            style={{
              borderColor: '#CBD5E1',
              borderRadius: 6,
              fontWeight: 500,
              color: '#334155',
            }}
            onClick={() => navigate(ROUTES.SPECIALIST_DOCUMENTS || '/specialist/documents')}
          >
            {t('nav.specialistDocuments', 'Biểu mẫu hồ sơ')}
          </Button>
          <Button
            type="default"
            icon={<BookOutlined />}
            style={{
              borderColor: '#CBD5E1',
              borderRadius: 6,
              fontWeight: 500,
              color: '#334155',
            }}
            onClick={handleOpenQuarantineRules}
          >
            {t('specialist.dossiers.quarantineRulesBtn', 'Quarantine Rules DB')}
          </Button>
        </Space>
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

      {/* Main Table Card */}
      <Card
        style={{
          borderRadius: 6,
          border: '1px solid #E2E8F0',
          boxShadow: 'none',
        }}
        styles={{ body: { padding: '14px 16px' } }}
      >
        {/* Toolbar: Bộ lọc trạng thái + Tìm kiếm */}
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            flexWrap: 'wrap',
            gap: 12,
            marginBottom: 14,
          }}
        >
          <Space size="middle" wrap>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <Text style={{ fontSize: 13, color: '#475569' }}>
                {t('specialist.dossiers.filterStatus', 'Trạng thái:')}
              </Text>
              <Select
                value={filterStatus}
                onChange={(val) => {
                  setFilterStatus(val);
                  setPagination((prev) => ({ ...prev, page: 1 }));
                }}
                style={{ width: 170 }}
                options={[
                  { value: 'All', label: t('specialist.filter.all', 'Tất cả trạng thái') },
                  { value: 'Reviewing', label: t('specialist.filter.reviewing', 'Chờ thẩm định') },
                  { value: 'AwaitingDocs', label: t('specialist.filter.awaiting', 'Chờ nộp giấy') },
                  { value: 'SubmittedToAuthorities', label: t('specialist.filter.submitted', 'Đã nộp cơ quan') },
                  { value: 'Cleared', label: t('specialist.filter.cleared', 'Đã thông quan') },
                  { value: 'Issue', label: t('specialist.filter.issue', 'Vướng mắc') },
                  { value: 'Draft', label: t('specialist.filter.draft', 'Bản nháp') },
                ]}
              />
            </div>
          </Space>

          <Input
            placeholder={t('specialist.dossiers.searchPlaceholder', 'Tìm theo mã hồ sơ, tên ngựa, mã đơn...')}
            prefix={<SearchOutlined style={{ color: '#94A3B8' }} />}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            style={{ width: 280, borderRadius: 6 }}
            allowClear
          />
        </div>

        {/* Table list */}
        <Table
          rowKey="dossierId"
          columns={columns}
          dataSource={dossiers}
          loading={loading}
          onRow={(record) => ({
            onClick: () => handleInspect(record.dossierId),
            style: { cursor: 'pointer' },
          })}
          pagination={{
            current: pagination.page,
            pageSize: pagination.pageSize,
            total: pagination.total,
            showSizeChanger: true,
            pageSizeOptions: ['5', '10', '20'],
            onChange: (page, pageSize) => {
              setPagination({ page, pageSize, total: pagination.total });
            },
          }}
          locale={{
            emptyText: t('specialist.dossiers.empty', 'Không có hồ sơ kiểm dịch nào phù hợp'),
          }}
        />
      </Card>
    </div>
  );
}
