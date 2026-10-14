import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import {
  Card,
  Row,
  Col,
  Button,
  Input,
  Space,
  Typography,
  Progress,
  Spin,
  Alert,
} from 'antd';
import {
  SearchOutlined,
  ArrowRightOutlined,
  FileTextOutlined,
  MedicineBoxOutlined,
} from '@ant-design/icons';
import { useSpecialistDossiers } from '../hooks/useSpecialistDossiers';
import { ROUTES } from '@routes/routes';
import DossierStatusTag from '../components/DossierStatusTag';

const { Title, Text } = Typography;

/**
 * Màn 1: Compliance Overview (Frame 141:9167)
 * Trang tổng quan dành cho Transport Specialist - phong cách doanh nghiệp tối giản, trang nhã
 * @returns {JSX.Element}
 */
export default function DashboardPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { overview, loading, error, fetchOverview } = useSpecialistDossiers();

  useEffect(() => {
    fetchOverview();
  }, [fetchOverview]);

  // Điều hướng đến danh sách hồ sơ với bộ lọc
  const handleNavigateToList = (statusFilter) => {
    navigate(ROUTES.SPECIALIST_DOSSIERS || '/specialist/dossiers', {
      state: { filterStatus: statusFilter },
    });
  };

  // Điều hướng đến chi tiết hồ sơ
  const handleInspectDossier = (dossierId) => {
    navigate(`/specialist/dossiers/${dossierId}`);
  };

  const stats = overview?.stats || {
    overdueDossiers: 1,
    pendingApproval: 2,
    activeQuarantine: 3,
    exceptions: 1,
  };

  const priorityQueue = overview?.priorityActionQueue || [];
  const customerUploaded = overview?.customerUploadedDossiers || [];
  const compliance = overview?.authorityComplianceStatus || {
    total: 6,
    cleared: 1,
    submittedToAuthorities: 1,
    reviewing: 1,
    awaitingDocs: 1,
    issue: 1,
    complianceRate: 94.2,
  };

  // Render tag trạng thái thông qua component tái sử dụng
  const renderStatusTag = (status) => <DossierStatusTag status={status} />;

  return (
    <div style={{ padding: '0 0 24px 0' }}>
      {/* Header bar & Toolbar tìm kiếm nhanh */}
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
            {t('specialist.dashboard.title', 'Compliance Overview')}
          </Title>
          <Text type="secondary" style={{ fontSize: 13, color: '#64748B' }}>
            {t(
              'specialist.dashboard.subtitle',
              'Quản lý hồ sơ pháp lý, thẩm định giấy tờ và giám sát thông quan'
            )}
          </Text>
        </div>

        <Space wrap size="small">
          <Input
            placeholder={t('specialist.dashboard.searchPlaceholder', 'Tìm mã hồ sơ, ngựa, chủ sở hữu...')}
            prefix={<SearchOutlined style={{ color: '#94A3B8' }} />}
            style={{ width: 220, borderRadius: 6 }}
            onPressEnter={(e) => {
              const val = e.target.value.trim();
              if (val) {
                navigate(ROUTES.SPECIALIST_DOSSIERS || '/specialist/dossiers', {
                  state: { search: val },
                });
              }
            }}
          />
          <Button
            type="default"
            icon={<FileTextOutlined />}
            style={{ borderRadius: 6, fontWeight: 500 }}
            onClick={() => navigate(ROUTES.SPECIALIST_DOCUMENTS || '/specialist/documents')}
          >
            {t('nav.specialistDocuments', 'Biểu mẫu hồ sơ')}
          </Button>
          <Button
            type="default"
            icon={<MedicineBoxOutlined />}
            style={{ borderRadius: 6, fontWeight: 500 }}
            onClick={() => navigate(ROUTES.SPECIALIST_QUARANTINE_RULES || '/specialist/quarantine-rules')}
          >
            {t('nav.specialistQuarantineRules', 'Quy định kiểm dịch')}
          </Button>
          <Button
            type="primary"
            style={{
              backgroundColor: '#F59E0B',
              borderColor: '#F59E0B',
              fontWeight: 500,
              borderRadius: 6,
            }}
            onClick={() => navigate(ROUTES.SPECIALIST_DOSSIERS || '/specialist/dossiers')}
          >
            {t('specialist.dashboard.viewAllDossiers', 'Xem tất cả hồ sơ')}
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

      {loading && !overview ? (
        <div style={{ textAlign: 'center', padding: 60 }}>
          <Spin size="large" />
        </div>
      ) : (
        <>
          {/* 1. Hàng 4 thẻ số liệu thống kê - Tinh gọn, tối giản, màu sắc trung tính nhẹ nhàng */}
          <Row gutter={[12, 12]} style={{ marginBottom: 16 }}>
            {[
              { key: 'overdue', label: t('specialist.stats.overdue', 'Overdue Dossiers'), value: stats.overdueDossiers, filter: 'all' },
              { key: 'pending', label: t('specialist.stats.pending', 'Pending Approval'), value: stats.pendingApproval, filter: 'Reviewing' },
              { key: 'quarantine', label: t('specialist.stats.activeQuarantine', 'Active Quarantine'), value: stats.activeQuarantine, filter: 'all' },
              { key: 'exceptions', label: t('specialist.stats.exceptions', 'Exceptions'), value: stats.exceptions, filter: 'Issue' },
            ].map((statItem) => (
              <Col xs={12} sm={6} key={statItem.key}>
                <Card
                  hoverable
                  style={{
                    borderRadius: 6,
                    border: '1px solid #E2E8F0',
                    boxShadow: 'none',
                    cursor: 'pointer',
                    backgroundColor: '#FFFFFF',
                  }}
                  styles={{ body: { padding: '14px 16px' } }}
                  onClick={() => handleNavigateToList(statItem.filter)}
                >
                  <div style={{ fontSize: 12, color: '#64748B', marginBottom: 4, fontWeight: 500 }}>
                    {statItem.label}
                  </div>
                  <div style={{ fontSize: 24, fontWeight: 700, color: '#0F172A', lineHeight: 1.2 }}>
                    {statItem.value}
                  </div>
                </Card>
              </Col>
            ))}
          </Row>

          {/* 2. Bố cục 2 cột chính */}
          <Row gutter={[16, 16]}>
            {/* Cột trái: Priority Action Queue */}
            <Col xs={24} lg={15}>
              <Card
                title={
                  <span style={{ fontWeight: 600, fontSize: 14, color: '#0F172A' }}>
                    {t('specialist.dashboard.priorityQueueTitle', 'Priority Action Queue')}
                  </span>
                }
                extra={
                  <Button
                    type="link"
                    size="small"
                    style={{ color: '#64748B', padding: 0, fontSize: 12 }}
                    onClick={() => navigate(ROUTES.SPECIALIST_DOSSIERS || '/specialist/dossiers')}
                  >
                    {t('specialist.dashboard.viewAll', 'Xem tất cả')} →
                  </Button>
                }
                style={{
                  borderRadius: 6,
                  border: '1px solid #E2E8F0',
                  boxShadow: 'none',
                }}
                styles={{ body: { padding: '12px 16px' } }}
              >
                <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                  {priorityQueue.map((item) => (
                    <div
                      key={item.dossierId}
                      style={{
                        padding: '10px 14px',
                        borderRadius: 6,
                        border: '1px solid #F1F5F9',
                        borderLeft: item.status === 'Issue' ? '3px solid #EF4444' : '1px solid #F1F5F9',
                        backgroundColor: '#FFFFFF',
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        gap: 12,
                      }}
                    >
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 2 }}>
                          <Text strong style={{ fontSize: 13, color: '#1E293B' }}>
                            {item.dossierCode}
                          </Text>
                          {renderStatusTag(item.status)}
                          {item.slaStatus === 'Overdue' && (
                            <span style={{ fontSize: 11, color: '#EF4444', fontWeight: 500 }}>
                              {t('specialist.sla.overdue', 'Quá hạn')}
                            </span>
                          )}
                          {item.slaStatus === 'Warning' && (
                            <span style={{ fontSize: 11, color: '#B45309' }}>
                              {item.slaHoursRemaining}h SLA
                            </span>
                          )}
                        </div>

                        <div style={{ fontSize: 12, color: '#64748B' }}>
                          <span style={{ fontWeight: 500, color: '#334155' }}>{item.horseName}</span>
                          <span style={{ margin: '0 6px' }}>•</span>
                          <span>{item.customerName}</span>
                          <span style={{ margin: '0 6px' }}>•</span>
                          <span>{item.pickupCountryCode} ➔ {item.dropoffCountryCode}</span>
                        </div>

                        {item.issueReason && (
                          <div style={{ fontSize: 11, color: '#B91C1C', marginTop: 2 }}>
                            {item.issueReason}
                          </div>
                        )}
                      </div>

                      <Button
                        type="default"
                        size="small"
                        icon={<ArrowRightOutlined />}
                        style={{
                          borderRadius: 4,
                          borderColor: '#CBD5E1',
                          fontSize: 12,
                          color: '#334155',
                        }}
                        onClick={() => handleInspectDossier(item.dossierId)}
                      >
                        {t('specialist.dashboard.inspect', 'Thẩm định')}
                      </Button>
                    </div>
                  ))}
                </div>
              </Card>
            </Col>

            {/* Cột phải: Customer Uploaded Dossiers + Authority Compliance Status */}
            <Col xs={24} lg={9}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                {/* Phần trên cột phải: Customer Uploaded Dossiers */}
                <Card
                  title={
                    <span style={{ fontWeight: 600, fontSize: 14, color: '#0F172A' }}>
                      {t('specialist.dashboard.customerUploadedTitle', 'Customer Uploaded Dossiers')}
                    </span>
                  }
                  style={{
                    borderRadius: 6,
                    border: '1px solid #E2E8F0',
                    boxShadow: 'none',
                  }}
                  styles={{ body: { padding: '12px 16px' } }}
                >
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                    {customerUploaded.map((doc) => (
                      <div
                        key={doc.dossierId}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          padding: '8px 12px',
                          borderRadius: 4,
                          backgroundColor: '#F8FAFC',
                          border: '1px solid #F1F5F9',
                        }}
                      >
                        <div style={{ minWidth: 0 }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                            <Text strong style={{ fontSize: 13, color: '#1E293B' }}>
                              {doc.dossierCode}
                            </Text>
                            <span style={{ fontSize: 12, color: '#64748B' }}>({doc.horseName})</span>
                          </div>
                          <div style={{ fontSize: 11, color: '#94A3B8' }}>
                            {t('specialist.dashboard.uploadedDocsCount', 'Đã tải {{count}} giấy tờ', {
                              count: doc.documents?.length || 0,
                            })}
                          </div>
                        </div>

                        <Button
                          type="text"
                          size="small"
                          style={{ color: '#475569', fontSize: 12 }}
                          onClick={() => handleInspectDossier(doc.dossierId)}
                        >
                          {t('specialist.dashboard.reviewDoc', 'Xem')} →
                        </Button>
                      </div>
                    ))}
                  </div>
                </Card>

                {/* Phần dưới cột phải: Authority Compliance Status */}
                <Card
                  title={
                    <span style={{ fontWeight: 600, fontSize: 14, color: '#0F172A' }}>
                      {t('specialist.dashboard.complianceTitle', 'Authority Compliance Status')}
                    </span>
                  }
                  style={{
                    borderRadius: 6,
                    border: '1px solid #E2E8F0',
                    boxShadow: 'none',
                  }}
                  styles={{ body: { padding: '14px 16px' } }}
                >
                  <div style={{ marginBottom: 12 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                      <Text style={{ fontSize: 12, color: '#64748B' }}>
                        {t('specialist.dashboard.overallComplianceRate', 'Tỷ lệ đạt chuẩn')}
                      </Text>
                      <Text strong style={{ color: '#0F172A', fontSize: 13 }}>
                        {compliance.complianceRate}%
                      </Text>
                    </div>
                    <Progress
                      percent={compliance.complianceRate}
                      strokeColor="#0F172A"
                      showInfo={false}
                      size="small"
                    />
                  </div>

                  <Row gutter={[8, 8]} style={{ textAlign: 'center' }}>
                    <Col span={8}>
                      <div style={{ padding: '8px 4px', backgroundColor: '#F8FAFC', borderRadius: 4, border: '1px solid #F1F5F9' }}>
                        <div style={{ fontSize: 15, fontWeight: 700, color: '#0F172A' }}>
                          {compliance.cleared}
                        </div>
                        <div style={{ fontSize: 11, color: '#64748B' }}>
                          {t('specialist.dashboard.statusCleared', 'Cleared')}
                        </div>
                      </div>
                    </Col>
                    <Col span={8}>
                      <div style={{ padding: '8px 4px', backgroundColor: '#F8FAFC', borderRadius: 4, border: '1px solid #F1F5F9' }}>
                        <div style={{ fontSize: 15, fontWeight: 700, color: '#0F172A' }}>
                          {compliance.submittedToAuthorities}
                        </div>
                        <div style={{ fontSize: 11, color: '#64748B' }}>
                          {t('specialist.dashboard.statusSubmitted', 'Submitted')}
                        </div>
                      </div>
                    </Col>
                    <Col span={8}>
                      <div style={{ padding: '8px 4px', backgroundColor: '#F8FAFC', borderRadius: 4, border: '1px solid #F1F5F9' }}>
                        <div style={{ fontSize: 15, fontWeight: 700, color: '#0F172A' }}>
                          {compliance.issue}
                        </div>
                        <div style={{ fontSize: 11, color: '#64748B' }}>
                          {t('specialist.dashboard.statusIssue', 'Issue')}
                        </div>
                      </div>
                    </Col>
                  </Row>
                </Card>
              </div>
            </Col>
          </Row>
        </>
      )}
    </div>
  );
}
