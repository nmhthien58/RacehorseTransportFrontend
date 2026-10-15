import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import {
  Card,
  Row,
  Col,
  Tag,
  Button,
  Typography,
  Space,
  Spin,
  Alert,
  Divider,
  Checkbox,
  message,
  Modal,
  Input,
  Tooltip,
} from 'antd';
import {
  ArrowLeftOutlined,
  CheckCircleOutlined,
  CheckCircleFilled,
  CloseCircleFilled,
  EyeOutlined,
  SendOutlined,
  SafetyCertificateOutlined,
  ExclamationCircleOutlined,
  FileTextOutlined,
  FilePdfOutlined,
  RollbackOutlined,
} from '@ant-design/icons';
import { useDossierDetail } from '../hooks/useDossierDetail';
import DossierStatusBar from '../components/DossierStatusBar';
import RejectDocumentModal from '../components/RejectDocumentModal';
import SubmitAuthorityModal from '../components/SubmitAuthorityModal';
import RequestDocumentsModal from '../components/RequestDocumentsModal';
import ClearDossierModal from '../components/ClearDossierModal';
import StandardFormTemplateModal from '@components/common/StandardFormTemplateModal';
import FilePreview from '@components/common/FilePreview';
import { ROUTES } from '@routes/routes';

const { Title, Text } = Typography;
const { TextArea } = Input;

/**
 * Màn 3: Dossier Inspection Desk (Frame 141:10417 - dossier_detail 1)
 * Bàn làm việc thẩm định hồ sơ kiểm dịch, đối soát 3-Point Audit và phê duyệt thông quan
 * @returns {JSX.Element}
 */
export default function DossierDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { t } = useTranslation();

  const {
    dossier,
    loading,
    actionLoading,
    error,
    approveDocument,
    rejectDocument,
    requestDocuments,
    submitToAuthorities,
    clearDossier,
    returnToAuthority,
    reportIssue,
  } = useDossierDetail(id);

  // Modal states
  const [rejectModalOpen, setRejectModalOpen] = useState(false);
  const [selectedDocForReject, setSelectedDocForReject] = useState(null);
  const [submitModalOpen, setSubmitModalOpen] = useState(false);
  const [requestDocsModalOpen, setRequestDocsModalOpen] = useState(false);
  const [clearModalOpen, setClearModalOpen] = useState(false);
  const [issueModalOpen, setIssueModalOpen] = useState(false);
  const [issueReasonInput, setIssueReasonInput] = useState('');
  const [previewFileModal, setPreviewFileModal] = useState({ open: false, url: '', title: '' });
  const [templateModal, setTemplateModal] = useState({
    open: false,
    docType: 'HEALTH_CERT',
    title: '',
    horse: null,
  });

  const handleOpenTemplateModal = (item, doc) => {
    const docTypeCode = item?.docTypeCode || doc?.docTypeCode || 'HEALTH_CERT';
    setTemplateModal({
      open: true,
      docType: docTypeCode,
      title: item?.docTypeName || 'Mẫu đơn tiêu chuẩn',
      horse: {
        name: dossier?.horseName,
        passportNumber: dossier?.horsePassportNumber || dossier?.passportNumber,
        microchipNumber: dossier?.horseMicrochip || dossier?.microchipNumber,
        breed: dossier?.horseBreed,
        ownerName: dossier?.customerName,
      },
    });
  };

  // Condition checklist states (quản lý tick câu hỏi điều kiện cục bộ)
  const [conditionChecks, setConditionChecks] = useState({
    q1: true,
    q2: true,
    q3: true,
  });

  const handleToggleCondition = (key) => {
    setConditionChecks((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  // Render tag trạng thái tinh gọn, đồng bộ
  const renderStatusTag = (status) => {
    switch (status) {
      case 'Cleared':
        return (
          <Tag style={{ backgroundColor: '#DCFCE7', borderColor: '#86EFAC', color: '#15803D', fontWeight: 600, borderRadius: 4 }}>
            {t('specialist.status.cleared', 'Cleared')}
          </Tag>
        );
      case 'SubmittedToAuthorities':
        return (
          <Tag style={{ backgroundColor: '#F1F5F9', borderColor: '#CBD5E1', color: '#1E293B', fontWeight: 600, borderRadius: 4 }}>
            {t('specialist.status.submitted', 'Submitted to Authority')}
          </Tag>
        );
      case 'Reviewing':
        return (
          <Tag style={{ backgroundColor: '#FEF3C7', borderColor: '#FCD34D', color: '#B45309', fontWeight: 600, borderRadius: 4 }}>
            {t('specialist.status.reviewing', 'Reviewing')}
          </Tag>
        );
      case 'AwaitingDocs':
        return (
          <Tag style={{ backgroundColor: '#F8FAFC', borderColor: '#CBD5E1', color: '#475569', fontWeight: 500, borderRadius: 4 }}>
            {t('specialist.status.awaitingDocs', 'Awaiting Docs')}
          </Tag>
        );
      case 'Issue':
        return (
          <Tag style={{ backgroundColor: '#FEE2E2', borderColor: '#FCA5A5', color: '#B91C1C', fontWeight: 600, borderRadius: 4 }}>
            {t('specialist.status.issue', 'Issue')}
          </Tag>
        );
      case 'Draft':
      default:
        return (
          <Tag style={{ backgroundColor: '#F1F5F9', borderColor: '#CBD5E1', color: '#64748B', fontWeight: 500, borderRadius: 4 }}>
            {t('specialist.status.draft', 'Draft')}
          </Tag>
        );
    }
  };

  // Mở modal từ chối tài liệu
  const handleOpenReject = (doc) => {
    setSelectedDocForReject(doc);
    setRejectModalOpen(true);
  };

  // Xác nhận từ chối tài liệu
  const handleConfirmReject = async (reason) => {
    if (!selectedDocForReject) return;
    const ok = await rejectDocument(selectedDocForReject.documentId, reason);
    if (ok) {
      message.success(t('specialist.detail.rejectSuccess', 'Đã từ chối tài liệu và thông báo cho khách hàng'));
      setRejectModalOpen(false);
    }
  };

  // Phê duyệt tài liệu
  const handleApproveDoc = async (docId) => {
    const ok = await approveDocument(docId);
    if (ok) {
      message.success(t('specialist.detail.approveSuccess', 'Đã phê duyệt tài liệu'));
    }
  };

  // Xác nhận nộp lên cơ quan
  const handleConfirmSubmit = async () => {
    const ok = await submitToAuthorities();
    if (ok) {
      message.success(t('specialist.detail.submitSuccess', 'Hồ sơ đã được gửi tới Cơ quan chức năng'));
      setSubmitModalOpen(false);
    }
  };

  // Xác nhận yêu cầu bổ sung tài liệu
  const handleConfirmRequestDocs = async (payload) => {
    const ok = await requestDocuments(payload);
    if (ok) {
      message.success(t('specialist.requestDocs.requestSuccess', 'Đã gửi yêu cầu bổ sung giấy tờ tới khách hàng'));
      setRequestDocsModalOpen(false);
    }
  };

  // Cấp phép thông quan chính thức
  const handleConfirmClear = async ({ clearanceNumber }) => {
    const ok = await clearDossier(clearanceNumber);
    if (ok) {
      message.success(t('specialist.clear.clearSuccess', 'Hồ sơ đã được phê duyệt thông quan (Cleared)'));
      setClearModalOpen(false);
    }
  };

  // Hồ sơ Issue: mở lại (về AwaitingDocs) để khách nộp bổ sung, sau đó nộp lại cơ quan như bình thường
  const handleReturnToAuthority = async () => {
    const ok = await returnToAuthority();
    if (ok) {
      message.success(t('specialist.detail.returnSuccess', 'Đã mở lại hồ sơ, khách hàng được yêu cầu nộp bổ sung giấy tờ'));
    }
  };

  // Báo sự cố hồ sơ
  const handleConfirmIssue = async () => {
    if (!issueReasonInput.trim()) {
      message.error(t('specialist.detail.issueReasonRequired', 'Vui lòng nhập lý do sự cố'));
      return;
    }
    const ok = await reportIssue(issueReasonInput.trim());
    if (ok) {
      message.success(t('specialist.detail.issueSuccess', 'Đã chuyển hồ sơ sang trạng thái Issue'));
      setIssueModalOpen(false);
      setIssueReasonInput('');
    }
  };

  if (loading && !dossier) {
    return (
      <div style={{ textAlign: 'center', padding: '80px 0' }}>
        <Spin size="large" />
      </div>
    );
  }

  const checklist = dossier?.checklist || [];
  const approvedCount = dossier?.approvedCount || 0;
  const requiredCount = dossier?.requiredCount || checklist.filter((c) => c.isMandatory).length || 3;
  const isReady = dossier?.isReadyToSubmit || approvedCount >= requiredCount;

  return (
    <div style={{ padding: '0 0 24px 0' }}>
      {/* Header bar: Điều hướng quay lại + Tiêu đề hồ sơ */}
      <div style={{ marginBottom: 16 }}>
        <Button
          type="link"
          icon={<ArrowLeftOutlined />}
          style={{ padding: 0, color: '#64748B', fontSize: 13, marginBottom: 8 }}
          onClick={() => navigate(ROUTES.SPECIALIST_DOSSIERS || '/specialist/dossiers')}
        >
          {t('specialist.detail.backToList', 'Quay lại danh sách hồ sơ')}
        </Button>

        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            flexWrap: 'wrap',
            gap: 12,
          }}
        >
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
              <Title level={4} style={{ margin: 0, fontWeight: 700, color: '#0F172A' }}>
                {t('specialist.detail.title', 'Dossier Inspection Desk')} #{dossier?.bookingCode}
              </Title>
              <span style={{ fontSize: 14, color: '#64748B' }}>•</span>
              <Text strong style={{ color: '#0F172A', fontSize: 14 }}>
                {dossier?.dossierCode}
              </Text>
              {renderStatusTag(dossier?.status)}
            </div>

            <Text type="secondary" style={{ fontSize: 13, color: '#64748B' }}>
              {t('specialist.dossiers.colDestination', 'Tuyến vận chuyển')}:{' '}
              <strong style={{ color: '#1E293B' }}>
                {dossier?.pickupAddress} ({dossier?.pickupCountryCode}) ➔ {dossier?.dropoffAddress} ({dossier?.dropoffCountryCode})
              </strong>
            </Text>
          </div>

          <div style={{ textAlign: 'right' }}>
            <div style={{ fontSize: 12, color: '#64748B' }}>
              {t('specialist.dossiers.colSla', 'Thời hạn SLA')}:{' '}
              <strong style={{ color: dossier?.slaStatus === 'Overdue' ? '#DC2626' : '#0F172A' }}>
                {dossier?.slaHoursRemaining || 24}h {t('specialist.sla.left', 'còn lại')}
              </strong>
            </div>
            {dossier?.clearanceNumber && (
              <div style={{ fontSize: 12, color: '#166534', fontWeight: 600 }}>
                Số cấp phép: {dossier.clearanceNumber}
              </div>
            )}
          </div>
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

      {/* Thanh trạng thái tiến trình hồ sơ theo State Machine chuẩn */}
      <DossierStatusBar status={dossier?.status} issueReason={dossier?.issueReason} />

      {/* Banner quy chuẩn kiểm dịch quốc tế (Frame 141:10417) */}
      <div
        style={{
          padding: '10px 14px',
          backgroundColor: '#F8FAFC',
          border: '1px solid #E2E8F0',
          borderRadius: 6,
          marginBottom: 16,
          display: 'flex',
          alignItems: 'center',
          gap: 10,
        }}
      >
        <SafetyCertificateOutlined style={{ color: '#0F172A', fontSize: 16 }} />
        <div style={{ fontSize: 12, color: '#334155' }}>
          <strong>
            {dossier?.dropoffCountryCode === 'CN'
              ? 'Quy chuẩn kiểm dịch GACC Trung Quốc (Nghị định thư Thú y VN-TQ): '
              : dossier?.dropoffCountryCode === 'TH'
              ? 'Quy chuẩn kiểm dịch DLD Thái Lan: '
              : 'Quy chuẩn kiểm dịch thú y quốc tế OIE / WOAH: '}
          </strong>
          <span>
            {t(
              'specialist.detail.mandateDesc',
              'Bắt buộc Hộ chiếu FEI, Xét nghiệm Coggins EIA âm tính, Giấy chứng nhận kiểm dịch xuất khẩu y tế và Giấy phép nhập cảnh.'
            )}
          </span>
        </div>
      </div>

      {/* Bố cục 2 cột (Cột trái 70% | Cột phải 30%) */}
      <Row gutter={[16, 16]}>
        {/* CỘT TRÁI (70%): Thông tin ngựa & 3-Point Audit Checklist */}
        <Col xs={24} lg={16}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            {/* Khối 1: Thông tin cá thể & Chủ sở hữu */}
            <Card
              title={
                <span style={{ fontWeight: 600, fontSize: 14, color: '#0F172A' }}>
                  {t('specialist.detail.horseInfoTitle', 'Thông tin cá thể & Chủ sở hữu')}
                </span>
              }
              style={{
                borderRadius: 6,
                border: '1px solid #E2E8F0',
                boxShadow: 'none',
              }}
              styles={{ body: { padding: '14px 16px' } }}
            >
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '10px 16px', fontSize: 13 }}>
                <div>
                  <span style={{ color: '#64748B' }}>Tên cá thể:</span>{' '}
                  <strong style={{ color: '#0F172A' }}>{dossier?.horseName}</strong>
                </div>
                <div>
                  <span style={{ color: '#64748B' }}>Số Microchip:</span>{' '}
                  <span style={{ fontFamily: 'monospace', fontWeight: 600, color: '#1E293B' }}>{dossier?.microchipNumber}</span>
                </div>
                <div>
                  <span style={{ color: '#64748B' }}>Số hộ chiếu FEI:</span>{' '}
                  <strong style={{ color: '#0F172A' }}>{dossier?.passportNumber || 'Chưa cấp'}</strong>
                </div>
                <div>
                  <span style={{ color: '#64748B' }}>Giống / Giới tính:</span>{' '}
                  <span>{dossier?.breed} • {dossier?.gender}</span>
                </div>
                <div>
                  <span style={{ color: '#64748B' }}>Chủ sở hữu:</span>{' '}
                  <strong style={{ color: '#0F172A' }}>{dossier?.customerName}</strong>
                </div>
                <div>
                  <span style={{ color: '#64748B' }}>Liên hệ:</span>{' '}
                  <span>{dossier?.customerPhone}</span>
                </div>
              </div>
            </Card>

            {/* Khối 2: 3-Point Audit Checklist & Uploaded Documents */}
            <Card
              title={
                <div>
                  <span style={{ fontWeight: 600, fontSize: 14, color: '#0F172A' }}>
                    {t('specialist.detail.auditTitle', '3-Point Audit Checklist (Giấy tờ kiểm dịch)')}
                  </span>
                  <div style={{ fontSize: 12, color: '#64748B', fontWeight: 400, marginTop: 2 }}>
                    {t('specialist.detail.auditSubtitle', 'Kiểm tra định dạng, tính xác thực và thời hạn hiệu lực của từng giấy tờ')}
                  </div>
                </div>
              }
              style={{
                borderRadius: 6,
                border: '1px solid #E2E8F0',
                boxShadow: 'none',
              }}
              styles={{ body: { padding: '16px' } }}
            >
              <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                {checklist.map((item, index) => {
                  const doc = item.latestDocument;
                  const isApproved = item.state === 'Approved' || doc?.status === 'Approved';
                  const isRejected = item.state === 'Rejected' || doc?.status === 'Rejected';
                  const isMissing = !doc;

                  return (
                    <div
                      key={item.docTypeId || index}
                      style={{
                        padding: '14px',
                        borderRadius: 6,
                        border: '1px solid #E2E8F0',
                        borderLeft: isApproved
                          ? '3px solid #166534'
                          : isRejected
                          ? '3px solid #DC2626'
                          : '3px solid #D97706',
                        backgroundColor: '#FFFFFF',
                      }}
                    >
                      {/* Tiêu đề giấy tờ & Trạng thái */}
                      <div
                        style={{
                          display: 'flex',
                          justifyContent: 'space-between',
                          alignItems: 'flex-start',
                          marginBottom: 8,
                          gap: 12,
                        }}
                      >
                        <div>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                            <Text strong style={{ fontSize: 14, color: '#0F172A' }}>
                              {index + 1}. {item.docTypeName}
                            </Text>
                            {item.isMandatory && (
                              <span style={{ fontSize: 11, color: '#991B1B', fontWeight: 500 }}>
                                * {t('specialist.detail.mandatory', 'Bắt buộc')}
                              </span>
                            )}
                          </div>
                          <div style={{ fontSize: 12, color: '#64748B', marginTop: 2 }}>
                            {item.regulationNote} (Hiệu lực: {item.validityDays} ngày)
                          </div>
                        </div>

                        <div>
                          {isApproved ? (
                            <Tag
                              style={{
                                backgroundColor: '#DCFCE7',
                                borderColor: '#86EFAC',
                                color: '#15803D',
                                fontWeight: 600,
                                borderRadius: 4,
                                padding: '2px 8px',
                                fontSize: 12,
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: 4,
                              }}
                            >
                              <CheckCircleFilled style={{ color: '#16A34A', fontSize: 11 }} />
                              {t('specialist.detail.verified', 'Đạt chuẩn')}
                            </Tag>
                          ) : isRejected ? (
                            <Tag
                              style={{
                                backgroundColor: '#FEE2E2',
                                borderColor: '#FCA5A5',
                                color: '#B91C1C',
                                fontWeight: 600,
                                borderRadius: 4,
                                padding: '2px 8px',
                                fontSize: 12,
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: 4,
                              }}
                            >
                              <CloseCircleFilled style={{ color: '#DC2626', fontSize: 11 }} />
                              {t('specialist.detail.rejected', 'Từ chối')}
                            </Tag>
                          ) : isMissing ? (
                            <Tag
                              style={{
                                backgroundColor: '#F1F5F9',
                                borderColor: '#CBD5E1',
                                color: '#64748B',
                                fontWeight: 500,
                                borderRadius: 4,
                                padding: '2px 8px',
                                fontSize: 12,
                              }}
                            >
                              {t('specialist.detail.missing', 'Chưa nộp')}
                            </Tag>
                          ) : (
                            <Tag
                              style={{
                                backgroundColor: '#FEF3C7',
                                borderColor: '#FCD34D',
                                color: '#B45309',
                                fontWeight: 600,
                                borderRadius: 4,
                                padding: '2px 8px',
                                fontSize: 12,
                              }}
                            >
                              {t('specialist.detail.unverified', 'Chờ duyệt')}
                            </Tag>
                          )}
                        </div>
                      </div>

                      {/* Chi tiết file đã upload nếu có */}
                      {doc ? (
                        <div
                          style={{
                            padding: '10px 12px',
                            backgroundColor: '#F8FAFC',
                            borderRadius: 4,
                            border: '1px solid #F1F5F9',
                            marginBottom: 10,
                          }}
                        >
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 8 }}>
                            <div style={{ fontSize: 12, color: '#334155' }}>
                              <FileTextOutlined style={{ marginRight: 6, color: '#64748B' }} />
                              <strong>{doc.documentNumber || 'Tài liệu số hóa'}</strong>
                              <span style={{ margin: '0 8px', color: '#CBD5E1' }}>|</span>
                              <span>Hạn: {doc.expiryDate || 'N/A'}</span>
                              <span style={{ margin: '0 8px', color: '#CBD5E1' }}>|</span>
                              <span style={{ color: '#64748B' }}>Nộp bởi {doc.uploadedByName}</span>
                            </div>

                            <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
                              <Button
                                type="link"
                                size="small"
                                icon={<EyeOutlined />}
                                style={{ padding: 0, fontSize: 12, color: '#2563EB' }}
                                onClick={() =>
                                  setPreviewFileModal({
                                     open: true,
                                     url: doc.fileUrl,
                                     title: item.docTypeName,
                                  })
                                }
                              >
                                {t('specialist.detail.viewDoc', 'Xem tệp')}
                              </Button>

                              <span style={{ color: '#CBD5E1' }}>|</span>

                              <Button
                                type="link"
                                size="small"
                                icon={<FilePdfOutlined />}
                                style={{ padding: 0, fontSize: 12, color: '#059669', fontWeight: 500 }}
                                onClick={() => handleOpenTemplateModal(item, doc)}
                              >
                                Mẫu đơn
                              </Button>
                            </div>
                          </div>

                          {/* 3-Point Checklist indicators */}
                          <div style={{ display: 'flex', gap: 16, marginTop: 8, fontSize: 11, color: '#475569' }}>
                            <span>✓ Định dạng: Hợp lệ</span>
                            <span>✓ Đối tượng: Trùng khớp</span>
                            <span>✓ Thời hạn: Còn hiệu lực</span>
                          </div>

                          {doc.correctionNote && (
                            <div style={{ fontSize: 11, color: '#DC2626', marginTop: 6 }}>
                              Ghi chú từ chối: {doc.correctionNote}
                            </div>
                          )}
                        </div>
                      ) : (
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8, padding: '6px 10px', backgroundColor: '#F8FAFC', borderRadius: 4, border: '1px dashed #CBD5E1' }}>
                          <span style={{ fontSize: 12, color: '#94A3B8', fontStyle: 'italic' }}>
                            Khách hàng chưa tải lên giấy tờ này.
                          </span>
                          <Button
                            type="link"
                            size="small"
                            icon={<FilePdfOutlined />}
                            style={{ padding: 0, fontSize: 12, color: '#059669', fontWeight: 500 }}
                            onClick={() => handleOpenTemplateModal(item, null)}
                          >
                            Xem mẫu đơn chuẩn
                          </Button>
                        </div>
                      )}

                      {/* Nút hành động thẩm định */}
                      {doc && (
                        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8 }}>
                          <Button
                            size="small"
                            danger
                            disabled={actionLoading}
                            onClick={() => handleOpenReject(doc)}
                            style={{ borderRadius: 4, fontSize: 12 }}
                          >
                            {t('specialist.detail.rejectBtn', 'Từ chối')}
                          </Button>
                          {isApproved ? (
                            <Button
                              size="small"
                              style={{
                                backgroundColor: '#DCFCE7',
                                borderColor: '#86EFAC',
                                color: '#15803D',
                                borderRadius: 4,
                                fontSize: 12,
                                fontWeight: 600,
                                cursor: 'default',
                                boxShadow: 'none',
                              }}
                              icon={<CheckCircleFilled style={{ color: '#16A34A' }} />}
                            >
                              {t('specialist.detail.verified', 'Đã duyệt')}
                            </Button>
                          ) : (
                            <Button
                              size="small"
                              type="primary"
                              loading={actionLoading}
                              style={{
                                backgroundColor: '#16A34A',
                                borderColor: '#16A34A',
                                color: '#FFFFFF',
                                borderRadius: 4,
                                fontSize: 12,
                                fontWeight: 500,
                              }}
                              onClick={() => handleApproveDoc(doc.documentId)}
                            >
                              {t('specialist.detail.approveBtn', 'Phê duyệt')}
                            </Button>
                          )}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </Card>
          </div>
        </Col>

        {/* CỘT PHẢI (30%): Condition Question Checklist & Thao tác xử lý */}
        <Col xs={24} lg={8}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            {/* Khối 1: Bộ câu hỏi điều kiện kiểm dịch (Condition Checklist) */}
            <Card
              title={
                <span style={{ fontWeight: 600, fontSize: 14, color: '#0F172A' }}>
                  {t('specialist.detail.conditionTitle', 'Câu hỏi điều kiện kiểm dịch')}
                </span>
              }
              style={{
                borderRadius: 6,
                border: '1px solid #E2E8F0',
                boxShadow: 'none',
              }}
              styles={{ body: { padding: '14px 16px' } }}
            >
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12, fontSize: 12 }}>
                <div style={{ display: 'flex', alignItems: 'flex-start', gap: 8 }}>
                  <Checkbox
                    checked={conditionChecks.q1}
                    onChange={() => handleToggleCondition('q1')}
                    style={{ marginTop: 2 }}
                  />
                  <div>
                    <Text style={{ fontSize: 12, color: '#334155' }}>
                      Ngựa đã hoàn thành thời gian cách ly tối thiểu 14 ngày tại cơ sở xuất phát?
                    </Text>
                  </div>
                </div>

                <div style={{ display: 'flex', alignItems: 'flex-start', gap: 8 }}>
                  <Checkbox
                    checked={conditionChecks.q2}
                    onChange={() => handleToggleCondition('q2')}
                    style={{ marginTop: 2 }}
                  />
                  <div>
                    <Text style={{ fontSize: 12, color: '#334155' }}>
                      Không phát hiện triệu chứng lâm sàng của bệnh viêm động mạch EVA hoặc EIA?
                    </Text>
                  </div>
                </div>

                <div style={{ display: 'flex', alignItems: 'flex-start', gap: 8 }}>
                  <Checkbox
                    checked={conditionChecks.q3}
                    onChange={() => handleToggleCondition('q3')}
                    style={{ marginTop: 2 }}
                  />
                  <div>
                    <Text style={{ fontSize: 12, color: '#334155' }}>
                      Đầy đủ con dấu giáp lai và mộc tròn của Chi cục Thú y kiểm dịch có thẩm quyền?
                    </Text>
                  </div>
                </div>
              </div>
            </Card>

            {/* Khối 2: Quyết định thẩm định (Action Desk) */}
            <Card
              title={
                <span style={{ fontWeight: 600, fontSize: 14, color: '#0F172A' }}>
                  {t('specialist.detail.actionsTitle', 'Quyết định thẩm định')}
                </span>
              }
              style={{
                borderRadius: 6,
                border: '1px solid #E2E8F0',
                boxShadow: 'none',
              }}
              styles={{ body: { padding: '14px 16px' } }}
            >
              {/* Tiến độ duyệt giấy tờ */}
              <div style={{ marginBottom: 14 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4, fontSize: 12 }}>
                  <span style={{ color: '#64748B' }}>Tiến độ giấy tờ bắt buộc:</span>
                  <strong style={{ color: '#0F172A' }}>{approvedCount}/{requiredCount}</strong>
                </div>
                {isReady ? (
                  <div style={{ fontSize: 12, color: '#166534', fontWeight: 500, marginBottom: 8 }}>
                    ✓ {t('specialist.detail.readyToSubmit', 'Đã đủ điều kiện nộp cơ quan chức năng')}
                  </div>
                ) : (
                  <div style={{ fontSize: 12, color: '#D97706', marginBottom: 8 }}>
                    Cần phê duyệt đủ {requiredCount} giấy tờ bắt buộc.
                  </div>
                )}
              </div>

              {/* Các nút hành động */}
              <Space direction="vertical" size={12} style={{ width: '100%' }}>
                {/* KHỐI BƯỚC 1: NỘP THÔNG QUAN (Submit to Authority - Chỉ enable khi status = Reviewing) */}
                <div style={{ padding: '10px 12px', backgroundColor: '#F8FAFC', borderRadius: 6, border: '1px solid #E2E8F0' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
                    <Text strong style={{ fontSize: 12, color: '#0F172A' }}>
                      {t('specialist.workflow.step1Title', 'Bước 1: Nộp cơ quan chức năng')}
                    </Text>
                    <Tag
                      color={dossier?.status === 'SubmittedToAuthorities' || dossier?.status === 'Cleared' ? 'success' : 'default'}
                      style={{ fontSize: 10, margin: 0 }}
                    >
                      {t('specialist.workflow.step1Badge', 'Nộp thông quan')}
                    </Tag>
                  </div>
                  <div style={{ fontSize: 11, color: '#64748B', marginBottom: 8, lineHeight: 1.4 }}>
                    {t('specialist.workflow.step1Desc', 'Đệ trình hồ sơ số hóa lên Cục Thú y / Hải quan sau khi đạt 100% 3-Point Audit.')}
                  </div>

                  {dossier?.status === 'SubmittedToAuthorities' ? (
                    <div style={{ padding: '6px 10px', backgroundColor: '#EFF6FF', border: '1px solid #BFDBFE', borderRadius: 4, color: '#1D4ED8', fontSize: 12, display: 'flex', alignItems: 'center', gap: 6 }}>
                      <CheckCircleFilled />
                      <span>{t('specialist.workflow.submittedWaiting', 'Đã nộp cơ quan chức năng • Đang chờ xét duyệt')}</span>
                    </div>
                  ) : dossier?.status === 'Cleared' ? (
                    <div style={{ padding: '6px 10px', backgroundColor: '#F0FDF4', border: '1px solid #BBF7D0', borderRadius: 4, color: '#15803D', fontSize: 12, display: 'flex', alignItems: 'center', gap: 6 }}>
                      <CheckCircleFilled />
                      <span>{t('specialist.detail.alreadyCleared', 'Đã nộp và hoàn tất kiểm dịch')}</span>
                    </div>
                  ) : (
                    <Tooltip title={dossier?.status !== 'Reviewing' || !isReady ? (
                      dossier?.status === 'Issue'
                        ? t('specialist.tooltip.cannotSubmitIssue', 'Hồ sơ đang có sự cố kiểm dịch, không thể nộp')
                        : dossier?.status !== 'Reviewing'
                        ? t('specialist.tooltip.mustBeReviewing', 'Hồ sơ phải ở trạng thái Đang thẩm định (Reviewing) trước khi nộp')
                        : t('specialist.tooltip.notReadyDocs', 'Cần phê duyệt đủ các giấy tờ bắt buộc trước khi nộp')
                    ) : undefined}>
                      <span style={{ display: 'block', width: '100%' }}>
                        <Button
                          type={dossier?.status === 'Reviewing' && isReady ? 'primary' : 'default'}
                          block
                          icon={<SendOutlined style={{ color: dossier?.status === 'Reviewing' && isReady ? '#FFFFFF' : '#94A3B8' }} />}
                          disabled={dossier?.status !== 'Reviewing' || !isReady}
                          style={
                            dossier?.status === 'Reviewing' && isReady
                              ? {
                                  backgroundColor: '#0F172A',
                                  borderColor: '#0F172A',
                                  color: '#FFFFFF',
                                  borderRadius: 4,
                                  fontWeight: 500,
                                }
                              : {
                                  backgroundColor: '#F1F5F9',
                                  borderColor: '#E2E8F0',
                                  color: '#94A3B8',
                                  borderRadius: 4,
                                  fontWeight: 500,
                                  boxShadow: 'none',
                                }
                          }
                          onClick={() => setSubmitModalOpen(true)}
                        >
                          <span>{t('specialist.detail.submitBtn', 'Nộp cơ quan chức năng')}</span>
                        </Button>
                      </span>
                    </Tooltip>
                  )}
                </div>

                {/* KHỐI BƯỚC 2: DUYỆT THÔNG QUAN (Approve / Cleared - Chỉ enable khi status = SubmittedToAuthorities) */}
                <div style={{ padding: '10px 12px', backgroundColor: '#F8FAFC', borderRadius: 6, border: '1px solid #E2E8F0' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
                    <Text strong style={{ fontSize: 12, color: '#0F172A' }}>
                      {t('specialist.workflow.step2Title', 'Bước 2: Phê duyệt thông quan')}
                    </Text>
                    <Tag
                      color={dossier?.status === 'Cleared' ? 'success' : 'default'}
                      style={{ fontSize: 10, margin: 0 }}
                    >
                      {t('specialist.workflow.step2Badge', 'Duyệt thông quan (Cleared)')}
                    </Tag>
                  </div>
                  <div style={{ fontSize: 11, color: '#64748B', marginBottom: 8, lineHeight: 1.4 }}>
                    {t('specialist.workflow.step2Desc', 'Ghi nhận số hiệu giấy phép kiểm dịch sau khi Cơ quan chức năng phê duyệt chính thức.')}
                  </div>

                  {dossier?.status === 'Cleared' ? (
                    <div style={{ padding: '6px 10px', backgroundColor: '#F0FDF4', border: '1px solid #BBF7D0', borderRadius: 4, color: '#15803D', fontSize: 12, display: 'flex', alignItems: 'center', gap: 6 }}>
                      <CheckCircleFilled />
                      <span>{t('specialist.detail.clearedDone', 'Đã thông quan')}: <strong>{dossier?.clearanceNumber}</strong></span>
                    </div>
                  ) : (
                    <Tooltip title={dossier?.status !== 'SubmittedToAuthorities' ? (
                      dossier?.status === 'Issue'
                        ? t('specialist.tooltip.cannotApproveIssue', 'Hồ sơ đang có sự cố kiểm dịch, không thể duyệt thông quan')
                        : t('specialist.tooltip.mustSubmitFirst', 'Phải nộp lên cơ quan trước khi duyệt')
                    ) : undefined}>
                      <span style={{ display: 'block', width: '100%' }}>
                        <Button
                          type="default"
                          block
                          icon={<CheckCircleOutlined style={{ color: dossier?.status === 'SubmittedToAuthorities' ? '#166534' : '#94A3B8' }} />}
                          disabled={dossier?.status !== 'SubmittedToAuthorities'}
                          style={{
                            backgroundColor: dossier?.status === 'SubmittedToAuthorities' ? '#F0FDF4' : '#F1F5F9',
                            borderColor: dossier?.status === 'SubmittedToAuthorities' ? '#16A34A' : '#E2E8F0',
                            color: dossier?.status === 'SubmittedToAuthorities' ? '#166534' : '#94A3B8',
                            borderRadius: 4,
                            fontWeight: 500,
                          }}
                          onClick={() => setClearModalOpen(true)}
                        >
                          <span>{t('specialist.detail.approveBtn', 'Duyệt thông quan (Cleared)')}</span>
                        </Button>
                      </span>
                    </Tooltip>
                  )}

                </div>

                <Divider style={{ margin: '4px 0' }} />

                {/* KHỐI XỬ LÝ SỰ CỐ / RETURN TO AUTHORITY (Khi status = Issue) */}
                {dossier?.status === 'Issue' && (
                  <div style={{ padding: '10px 12px', backgroundColor: '#FEF2F2', borderRadius: 6, border: '1px solid #FCA5A5' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
                      <Text strong style={{ fontSize: 12, color: '#991B1B' }}>
                        {t('specialist.workflow.resolveIssueTitle', 'Xử lý sự cố kiểm dịch')}
                      </Text>
                      <Tag color="error" style={{ fontSize: 10, margin: 0 }}>
                        {t('specialist.statusBar.hasIssue', 'Có vấn đề')}
                      </Tag>
                    </div>
                    <div style={{ fontSize: 11, color: '#7F1D1D', marginBottom: 8, lineHeight: 1.4 }}>
                      {dossier?.issueReason || t('specialist.workflow.resolveIssueDesc', 'Hồ sơ đang vướng mắc. Sau khi xử lý bổ sung, bấm nộp lại cho cơ quan.')}
                    </div>
                    <Button
                      type="primary"
                      block
                      icon={<RollbackOutlined />}
                      style={{
                        backgroundColor: '#DC2626',
                        borderColor: '#DC2626',
                        color: '#FFFFFF',
                        borderRadius: 4,
                        fontWeight: 500,
                      }}
                      loading={actionLoading}
                      onClick={handleReturnToAuthority}
                    >
                      <span>{t('specialist.detail.returnToAuthorityBtn', 'Nộp lại cho cơ quan (Return to Authority)')}</span>
                    </Button>
                  </div>
                )}

                {/* NÚT RETURN TO AUTHORITY (Disabled khi status != Issue) */}
                {dossier?.status !== 'Issue' && (
                  <Tooltip title={t('specialist.tooltip.onlyForIssue', 'Chỉ khả dụng khi hồ sơ đang có vướng mắc (Issue)')}>
                    <span style={{ display: 'block', width: '100%' }}>
                      <Button
                        type="default"
                        block
                        disabled
                        icon={<RollbackOutlined style={{ color: '#94A3B8' }} />}
                        style={{ borderRadius: 4, color: '#94A3B8', fontSize: 12 }}
                      >
                        <span>{t('specialist.detail.returnToAuthorityBtn', 'Nộp lại cho cơ quan (Return to Authority)')}</span>
                      </Button>
                    </span>
                  </Tooltip>
                )}

                {/* Nút: Yêu cầu bổ sung tài liệu */}
                <Button
                  type="default"
                  block
                  disabled={dossier?.status === 'Cleared'}
                  style={{ borderRadius: 4, color: dossier?.status === 'Cleared' ? '#94A3B8' : '#475569', fontSize: 12 }}
                  onClick={() => setRequestDocsModalOpen(true)}
                >
                  {t('specialist.detail.requestDocsBtn', 'Yêu cầu bổ sung tài liệu')}
                </Button>

                {/* Nút: Báo sự cố / Từ chối (Reject - Enable khi Reviewing hoặc SubmittedToAuthorities) */}
                <Tooltip title={dossier?.status !== 'Reviewing' && dossier?.status !== 'SubmittedToAuthorities' ? (
                  dossier?.status === 'Cleared'
                    ? t('specialist.tooltip.clearedCannotReject', 'Hồ sơ đã thông quan, không thể từ chối')
                    : dossier?.status === 'Issue'
                    ? t('specialist.tooltip.alreadyIssue', 'Hồ sơ đã ở trạng thái Có vấn đề (Issue)')
                    : t('specialist.tooltip.cannotRejectEarly', 'Chỉ có thể từ chối khi hồ sơ đang thẩm định hoặc đã nộp cơ quan')
                ) : undefined}>
                  <span style={{ display: 'block', width: '100%' }}>
                    <Button
                      type="text"
                      danger
                      block
                      disabled={dossier?.status !== 'Reviewing' && dossier?.status !== 'SubmittedToAuthorities'}
                      style={{ borderRadius: 4, fontSize: 12 }}
                      onClick={() => setIssueModalOpen(true)}
                    >
                      {t('specialist.detail.reportIssueBtn', 'Từ chối / Báo vướng mắc kiểm dịch')}
                    </Button>
                  </span>
                </Tooltip>
              </Space>
            </Card>
          </div>
        </Col>
      </Row>

      {/* Modal Util 3: Từ chối tài liệu */}
      <RejectDocumentModal
        open={rejectModalOpen}
        document={selectedDocForReject}
        dossier={dossier}
        loading={actionLoading}
        onCancel={() => setRejectModalOpen(false)}
        onConfirm={handleConfirmReject}
      />

      {/* Modal Util 4: Nộp cơ quan chức năng (Bước 1: Nộp thông quan) */}
      <SubmitAuthorityModal
        open={submitModalOpen}
        dossier={dossier}
        loading={actionLoading}
        onCancel={() => setSubmitModalOpen(false)}
        onConfirm={handleConfirmSubmit}
      />

      {/* Modal Yêu cầu bổ sung tài liệu (có chọn tài liệu và ghi chú) */}
      <RequestDocumentsModal
        open={requestDocsModalOpen}
        dossier={dossier}
        loading={actionLoading}
        onCancel={() => setRequestDocsModalOpen(false)}
        onConfirm={handleConfirmRequestDocs}
      />

      {/* Modal Phê duyệt thông quan (Bước 2: Duyệt thông quan Cleared) */}
      <ClearDossierModal
        open={clearModalOpen}
        dossier={dossier}
        loading={actionLoading}
        onCancel={() => setClearModalOpen(false)}
        onConfirm={handleConfirmClear}
      />

      {/* Modal báo sự cố kiểm dịch */}
      <Modal
        title={
          <div style={{ color: '#DC2626', fontWeight: 600 }}>
            <ExclamationCircleOutlined style={{ marginRight: 6 }} />
            Ghi nhận sự cố kiểm dịch hồ sơ
          </div>
        }
        open={issueModalOpen}
        onCancel={() => setIssueModalOpen(false)}
        onOk={handleConfirmIssue}
        okText="Xác nhận báo sự cố"
        cancelText="Hủy"
        okButtonProps={{ danger: true }}
      >
        <div style={{ marginBottom: 12, fontSize: 13, color: '#475569' }}>
          Hồ sơ sẽ chuyển sang trạng thái <strong>Issue</strong> và hiển thị tại hàng đợi ngoại lệ cần can thiệp.
        </div>
        <TextArea
          rows={3}
          placeholder="Mô tả nguyên nhân vướng mắc hoặc yêu cầu từ chối của cơ quan chức năng..."
          value={issueReasonInput}
          onChange={(e) => setIssueReasonInput(e.target.value)}
        />
      </Modal>

      {/* Modal xem trước file tệp */}
      <Modal
        title={previewFileModal.title}
        open={previewFileModal.open}
        onCancel={() => setPreviewFileModal({ open: false, url: '', title: '' })}
        footer={null}
        width={900}
        destroyOnHidden
      >
        <FilePreview url={previewFileModal.url} title={previewFileModal.title} />
      </Modal>

      {/* Modal Mẫu Đơn Pháp Lý Chuẩn Quốc Tế (Official Standard Form Preview) */}
      <StandardFormTemplateModal
        open={templateModal.open}
        onClose={() => setTemplateModal((prev) => ({ ...prev, open: false }))}
        docType={templateModal.docType}
        title={templateModal.title}
        horse={templateModal.horse}
      />
    </div>
  );
}
