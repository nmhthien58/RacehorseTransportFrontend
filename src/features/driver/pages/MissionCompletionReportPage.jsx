import { useState, useEffect } from 'react';
import {
  Card,
  Row,
  Col,
  Typography,
  Tag,
  Button,
  Space,
  Spin,
  Alert,
  Modal,
  notification,
  Statistic,
  List,
} from 'antd';
import {
  ArrowLeftOutlined,
  CheckCircleOutlined,
  ClockCircleOutlined,
  FilePdfOutlined,
  SafetyCertificateOutlined,
  SendOutlined,
  PrinterOutlined,
  EyeOutlined,
  TrophyOutlined,
  AuditOutlined,
  CarOutlined,
} from '@ant-design/icons';
import { useParams, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { driverService } from '../services/driverService';

const { Title, Text, Paragraph } = Typography;

/**
 * Màn hình: Báo cáo hoàn tất nhiệm vụ vận chuyển (Driver Shift Closeout Report)
 * Khớp 100% bố cục Figma Frame 193:1599 ("🏆 Trip Mission Final Completion Submission")
 */
export default function MissionCompletionReportPage() {
  const { tripId } = useParams();
  const navigate = useNavigate();
  const { t } = useTranslation();

  const [loading, setLoading] = useState(true);
  const [trip, setTrip] = useState(null);
  const [reportData, setReportData] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  useEffect(() => {
    async function fetchData() {
      setLoading(true);
      try {
        const tripRes = await driverService.getMissionById(tripId);
        if (tripRes?.data?.data) {
          setTrip(tripRes.data.data);
        }

        const reportRes = await driverService.getCompletionReport(tripId);
        if (reportRes?.data?.data) {
          setReportData(reportRes.data.data);
          if (reportRes.data.data.status === 'DeliveredPendingAudit') {
            setSubmitted(true);
          }
        }
      } catch (err) {
        console.error('Lỗi nạp báo cáo hoàn tất:', err);
      } finally {
        setLoading(false);
      }
    }

    if (tripId) {
      fetchData();
    }
  }, [tripId]);

  // Xử lý nộp báo cáo lên Giám đốc / Quản lý vận hành
  const handleSubmitPacket = () => {
    Modal.confirm({
      title: t('driver.report.confirmTitle', 'Nộp hồ sơ hoàn tất chuyến đi lên Quản lý vận hành?'),
      icon: <SendOutlined style={{ color: '#F59E0B' }} />,
      content: (
        <div>
          <Paragraph>
            Hồ sơ bao gồm biên bản <strong>e-POD đã ký</strong>, báo cáo sinh trắc học ngựa, chứng từ kiểm dịch và kiểm tra khử trùng phương tiện sẽ được chuyển giao chính thức tới{' '}
            <strong>{reportData?.transmittedTo || 'Lê Nguyên Vũ (Operations Manager)'}</strong> để đối soát thanh toán.
          </Paragraph>
          <Text type="secondary" style={{ fontSize: 12 }}>
            Hành động này sẽ đóng ca trực của kíp lái đối với chuyến {trip?.tripCode || tripId}.
          </Text>
        </div>
      ),
      okText: t('driver.report.confirmBtn', 'Xác nhận nộp báo cáo'),
      cancelText: t('common.cancel', 'Hủy bỏ'),
      okButtonProps: { style: { backgroundColor: '#F59E0B', borderColor: '#F59E0B' } },
      onOk: async () => {
        try {
          setSubmitting(true);
          await driverService.submitCompletionReport(tripId, {
            status: 'DeliveredPendingAudit',
            submittedAt: new Date().toISOString(),
          });
          setSubmitted(true);
          notification.success({
            message: t('driver.report.submitSuccessTitle', 'Đã nộp báo cáo thành công!'),
            description: t(
              'driver.report.submitSuccessDesc',
              'Hồ sơ chuyến đi đã được chuyển đến Quản lý vận hành để nghiệm thu và lưu trữ.'
            ),
          });
        } catch {
          notification.error({
            message: t('common.error', 'Có lỗi xảy ra'),
            description: t('driver.report.submitError', 'Không thể nộp báo cáo. Vui lòng thử lại.'),
          });
        } finally {
          setSubmitting(false);
        }
      },
    });
  };

  if (loading) {
    return (
      <div style={{ textAlign: 'center', padding: '100px 0' }}>
        <Spin size="large" tip={t('driver.report.loading', 'Đang nạp hồ sơ hoàn tất ca trực...')} />
      </div>
    );
  }

  const code = trip?.tripCode || `TRP-${tripId}`;
  const driverName = trip?.crew?.find((c) => c.crewRole === 'Driver')?.fullName || 'Trần Hoàng Nam';
  const managerName = reportData?.transmittedTo || trip?.coordinatorName || 'Lê Nguyên Vũ (Operations Management)';

  return (
    <div style={{ maxWidth: 1100, margin: '0 auto', padding: '24px 16px' }}>
      {/* Nút quay lại */}
      <div style={{ marginBottom: 16 }}>
        <Button
          icon={<ArrowLeftOutlined />}
          onClick={() => navigate('/driver/history')}
          style={{ borderRadius: 8 }}
        >
          {t('driver.report.backToHistory', 'Quay lại Lịch sử chuyến đi')}
        </Button>
      </div>

      {/* Header Banner - Khớp Frame 193:1599 */}
      <Card
        style={{
          borderRadius: 16,
          background: 'linear-gradient(135deg, #0F172A 0%, #1E293B 100%)',
          border: 'none',
          color: '#FFFFFF',
          marginBottom: 24,
          boxShadow: '0 10px 25px -5px rgba(15, 23, 42, 0.3)',
        }}
        bodyStyle={{ padding: '28px 32px' }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 16 }}>
          <div>
            <Space align="center" size={10}>
              <TrophyOutlined style={{ fontSize: 24, color: '#F59E0B' }} />
              <Title level={2} style={{ color: '#FFFFFF', margin: 0, fontWeight: 700 }}>
                {t('driver.report.headerTitle', 'Báo Cáo Hoàn Tất Nhiệm Vụ Vận Chuyển')}
              </Title>
            </Space>

            <Paragraph style={{ color: '#94A3B8', margin: '8px 0 0 0', fontSize: 14 }}>
              Trip #{code} • {t('driver.report.transmittedBy', 'Bàn giao bởi Tài xế')} <strong style={{ color: '#F1F5F9' }}>{driverName}</strong> {t('driver.report.toOperations', 'gửi tới Ban Quản lý vận hành')} (<strong style={{ color: '#F1F5F9' }}>{managerName}</strong>)
            </Paragraph>
          </div>

          <div>
            <Tag
              color={submitted ? '#10B981' : '#F59E0B'}
              style={{
                borderRadius: 20,
                padding: '6px 16px',
                fontSize: 13,
                fontWeight: 600,
                border: 'none',
              }}
            >
              {submitted
                ? t('driver.report.statusDelivered', 'DELIVERED • PENDING AUDIT')
                : t('driver.report.statusReady', 'READY FOR SUBMISSION')}
            </Tag>
          </div>
        </div>
      </Card>

      {/* Thông báo trạng thái đã nộp */}
      {submitted && (
        <Alert
          type="success"
          showIcon
          icon={<CheckCircleOutlined style={{ fontSize: 20, color: '#10B981' }} />}
          message={<Text strong style={{ color: '#065F46', fontSize: 15 }}>{t('driver.report.alertSubmittedTitle', 'Hồ sơ chuyến đi đã được chuyển giao thành công')}</Text>}
          description={
            <div style={{ color: '#047857', fontSize: 13, marginTop: 4 }}>
              Biên bản e-POD và toàn bộ nhật ký sinh trắc học ngựa đã gửi tới Trung tâm điều phối vào lúc {reportData?.transmittedAt ? new Date(reportData.transmittedAt).toLocaleString('vi-VN') : 'vừa xong'}. Ca trực đã hoàn thành an toàn.
            </div>
          }
          style={{ borderRadius: 12, marginBottom: 24, border: '1px solid #A7F3D0', background: '#ECFDF5' }}
        />
      )}

      {/* Section 1: Trip Operational Execution Summary */}
      <Card
        title={
          <Space>
            <TrophyOutlined style={{ color: '#F59E0B' }} />
            <Text strong style={{ fontSize: 16 }}>
              {t('driver.report.section1Title', 'Tổng Kết Vận Hành Lộ Trình (Trip Operational Execution Summary)')}
            </Text>
          </Space>
        }
        style={{ borderRadius: 14, marginBottom: 24, boxShadow: '0 2px 8px rgba(0,0,0,0.04)' }}
      >
        <Row gutter={[16, 16]}>
          <Col xs={12} sm={6}>
            <Card bordered={false} style={{ background: '#F8FAFC', borderRadius: 10, textAlign: 'center' }}>
              <Statistic
                title={<Text type="secondary" style={{ fontSize: 12 }}>{t('driver.report.totalKm', 'Tổng cự ly hành trình')}</Text>}
                value={reportData?.totalKm || '10,480 KM'}
                valueStyle={{ color: '#1E293B', fontWeight: 700, fontSize: 22 }}
              />
              <Text type="secondary" style={{ fontSize: 11 }}>100% lộ trình phê duyệt</Text>
            </Card>
          </Col>

          <Col xs={12} sm={6}>
            <Card bordered={false} style={{ background: '#F8FAFC', borderRadius: 10, textAlign: 'center' }}>
              <Statistic
                title={<Text type="secondary" style={{ fontSize: 12 }}>{t('driver.report.transitDuration', 'Thời gian vận chuyển')}</Text>}
                value={reportData?.transitDuration || '54h 15m'}
                valueStyle={{ color: '#1E293B', fontWeight: 700, fontSize: 22 }}
              />
              <Text style={{ fontSize: 11, color: '#10B981', fontWeight: 500 }}>Đúng khung giờ (On-time)</Text>
            </Card>
          </Col>

          <Col xs={12} sm={6}>
            <Card bordered={false} style={{ background: '#F0FDF4', borderRadius: 10, textAlign: 'center', border: '1px solid #DCFCE7' }}>
              <Statistic
                title={<Text style={{ fontSize: 12, color: '#15803D' }}>{t('driver.report.careLogs', 'Nhật ký sinh trắc ngựa')}</Text>}
                value={reportData?.careLogsCount || '4 / 4'}
                valueStyle={{ color: '#16A34A', fontWeight: 700, fontSize: 22 }}
              />
              <Text style={{ fontSize: 11, color: '#166534' }}>100% Equine Safety</Text>
            </Card>
          </Col>

          <Col xs={12} sm={6}>
            <Card bordered={false} style={{ background: '#FFFBEB', borderRadius: 10, textAlign: 'center', border: '1px solid #FEF3C7' }}>
              <Statistic
                title={<Text style={{ fontSize: 12, color: '#B45309' }}>{t('driver.report.incidentStatus', 'Sự cố phát sinh')}</Text>}
                value="0 Major"
                valueStyle={{ color: '#D97706', fontWeight: 700, fontSize: 22 }}
              />
              <Text style={{ fontSize: 11, color: '#92400E' }}>An toàn tuyệt đối</Text>
            </Card>
          </Col>
        </Row>
      </Card>

      {/* Section 2: Delivery Dossier Packet (3 Documents Attached) */}
      <Card
        title={
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <Space>
              <AuditOutlined style={{ color: '#F59E0B' }} />
              <Text strong style={{ fontSize: 16 }}>
                {t('driver.report.section2Title', 'Bộ Hồ Sơ Nghiệm Thu & Chứng Từ Đính Kèm (Delivery Dossier Packet)')}
              </Text>
            </Space>
            <Tag color="blue" style={{ borderRadius: 12 }}>3 Documents Attached</Tag>
          </div>
        }
        style={{ borderRadius: 14, marginBottom: 24, boxShadow: '0 2px 8px rgba(0,0,0,0.04)' }}
      >
        <List
          itemLayout="horizontal"
          dataSource={reportData?.attachedDocuments || [
            {
              id: 'doc-1',
              name: 'Signed e-POD Handover Certificate',
              fileCode: `ePOD-${code}-FINAL.pdf`,
              size: '2.4 MB',
              signedBy: 'Dr. Michael Evans & Tran Hoang Nam',
            },
            {
              id: 'doc-2',
              name: 'Equine Hospital / Quarantine Discharge Report',
              fileCode: `QUARANTINE-CLEARANCE-${code}.pdf`,
              size: '1.8 MB',
              signedBy: 'Customs Animal Quarantine Bureau',
            },
            {
              id: 'doc-3',
              name: 'Layover Fuel & Special Handling Receipts',
              fileCode: `EXPENSE-PACKET-${code}.pdf`,
              size: '3.1 MB',
              signedBy: 'Highway Rest Station & Toll Services',
            },
          ]}
          renderItem={(item) => (
            <List.Item
              actions={[
                <Button
                  key="view"
                  type="text"
                  icon={<EyeOutlined />}
                  onClick={() => navigate(`/driver/missions/${tripId}/arrival`)}
                  style={{ color: '#2563EB', fontWeight: 500 }}
                >
                  {t('common.view', 'Xem')}
                </Button>,
                <Button
                  key="print"
                  type="text"
                  icon={<PrinterOutlined />}
                  onClick={() => window.print()}
                >
                  {t('common.print', 'In')}
                </Button>,
              ]}
              style={{
                padding: '16px 20px',
                borderRadius: 10,
                border: '1px solid #F1F5F9',
                marginBottom: 12,
                background: '#FFFFFF',
              }}
            >
              <List.Item.Meta
                avatar={
                  <div
                    style={{
                      width: 44,
                      height: 44,
                      borderRadius: 10,
                      background: '#EFF6FF',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      color: '#2563EB',
                      fontSize: 22,
                    }}
                  >
                    <FilePdfOutlined />
                  </div>
                }
                title={
                  <Space align="center">
                    <Text strong style={{ fontSize: 15, color: '#1E293B' }}>{item.name}</Text>
                    <Tag color="cyan" style={{ fontSize: 11, borderRadius: 4 }}>{item.fileCode}</Tag>
                  </Space>
                }
                description={
                  <div style={{ marginTop: 4, fontSize: 12, color: '#64748B' }}>
                    <span>Dung lượng: <strong>{item.size}</strong></span>
                    <span style={{ margin: '0 8px' }}>•</span>
                    <span>Ký duyệt bởi: <strong>{item.signedBy}</strong></span>
                  </div>
                }
              />
            </List.Item>
          )}
        />
      </Card>

      {/* Section 3: Driver Shift & Stall Return (Figma Closeout Section) */}
      <Card
        title={
          <Space>
            <CarOutlined style={{ color: '#F59E0B' }} />
            <Text strong style={{ fontSize: 16 }}>
              {t('driver.report.section3Title', 'Nghiệm Thu Phương Tiện & Kết Thúc Ca Trực (Driver Shift & Stall Return)')}
            </Text>
          </Space>
        }
        style={{ borderRadius: 14, marginBottom: 32, boxShadow: '0 2px 8px rgba(0,0,0,0.04)' }}
      >
        <Row gutter={[20, 20]}>
          <Col xs={24} md={8}>
            <div
              style={{
                padding: 16,
                borderRadius: 10,
                background: '#F8FAFC',
                border: '1px solid #E2E8F0',
                height: '100%',
              }}
            >
              <Space align="center" style={{ marginBottom: 8 }}>
                <SafetyCertificateOutlined style={{ color: '#10B981', fontSize: 18 }} />
                <Text strong style={{ color: '#1E293B' }}>Khử Trùng Chuồng Xe (Ozone)</Text>
              </Space>
              <Paragraph type="secondary" style={{ fontSize: 12, margin: '4px 0 10px 0' }}>
                Thùng xe chuyên dụng đã được xịt rửa áp lực cao và xông khí Ozone khử trùng đạt chuẩn FEI.
              </Paragraph>
              <Tag color="success" style={{ fontWeight: 600 }}>COMPLIANT • ĐẠT TIÊU CHUẨN</Tag>
            </div>
          </Col>

          <Col xs={24} md={8}>
            <div
              style={{
                padding: 16,
                borderRadius: 10,
                background: '#F8FAFC',
                border: '1px solid #E2E8F0',
                height: '100%',
              }}
            >
              <Space align="center" style={{ marginBottom: 8 }}>
                <CheckCircleOutlined style={{ color: '#10B981', fontSize: 18 }} />
                <Text strong style={{ color: '#1E293B' }}>Bàn Giao Thiết Bị IoT / GPS</Text>
              </Space>
              <Paragraph type="secondary" style={{ fontSize: 12, margin: '4px 0 10px 0' }}>
                Bộ cảm biến vòng cổ nhịp tim ngựa, camera cabin và bộ đàm đã bàn giao lại cho kho vật tư.
              </Paragraph>
              <Tag color="success" style={{ fontWeight: 600 }}>RETURNED • ĐÃ HOÀN TRẢ</Tag>
            </div>
          </Col>

          <Col xs={24} md={8}>
            <div
              style={{
                padding: 16,
                borderRadius: 10,
                background: '#F8FAFC',
                border: '1px solid #E2E8F0',
                height: '100%',
              }}
            >
              <Space align="center" style={{ marginBottom: 8 }}>
                <ClockCircleOutlined style={{ color: '#3B82F6', fontSize: 18 }} />
                <Text strong style={{ color: '#1E293B' }}>Tổng Thời Gian Lái Xe Ca Trực</Text>
              </Space>
              <Paragraph type="secondary" style={{ fontSize: 12, margin: '4px 0 10px 0' }}>
                {reportData?.driverDutyHours || '28.5 Hours'} (Nghỉ ngơi đúng định mức an toàn giao thông đường bộ).
              </Paragraph>
              <Tag color="blue" style={{ fontWeight: 600 }}>28.5 HOURS • COMPLIANT</Tag>
            </div>
          </Col>
        </Row>
      </Card>

      {/* Thanh hành động cuối trang */}
      <Card
        style={{
          borderRadius: 14,
          background: '#F8FAFC',
          border: '1px solid #E2E8F0',
        }}
        bodyStyle={{ padding: 20 }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 16 }}>
          <div>
            <Text strong style={{ color: '#1E293B', fontSize: 15 }}>
              {t('driver.report.footerPrompt', 'Sẵn sàng gửi toàn bộ tập hồ sơ hoàn tất?')}
            </Text>
            <div style={{ fontSize: 12, color: '#64748B', marginTop: 2 }}>
              {t('driver.report.footerSub', 'Báo cáo sẽ được chuyển tự động tới phòng Điều phối & Ban Giám đốc.')}
            </div>
          </div>

          <Space size={12} wrap>
            <Button
              icon={<PrinterOutlined />}
              onClick={() => window.print()}
              style={{ borderRadius: 8 }}
            >
              {t('driver.report.printPacket', 'In Báo cáo (Print Packet)')}
            </Button>

            <Button
              icon={<FilePdfOutlined />}
              onClick={() => navigate(`/driver/missions/${tripId}/arrival`)}
              style={{ borderRadius: 8 }}
            >
              {t('driver.report.viewEPod', 'Xem Biên bản e-POD')}
            </Button>

            <Button
              type="primary"
              size="large"
              icon={<SendOutlined />}
              loading={submitting}
              onClick={handleSubmitPacket}
              style={{
                borderRadius: 8,
                backgroundColor: '#F59E0B',
                borderColor: '#F59E0B',
                fontWeight: 600,
                boxShadow: '0 4px 12px rgba(245, 158, 11, 0.25)',
              }}
            >
              {submitted
                ? t('driver.report.resubmitBtn', 'Cập nhật lại hồ sơ gửi QLVH')
                : t('driver.report.submitBtn', 'Gửi hồ sơ lên Quản lý vận hành')}
            </Button>
          </Space>
        </div>
      </Card>
    </div>
  );
}
