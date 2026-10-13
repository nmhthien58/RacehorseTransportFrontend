import { useState, useMemo } from 'react';
import {
  Card,
  Row,
  Col,
  Typography,
  Checkbox,
  Tag,
  Button,
  Space,
  Progress,
  Alert,
  Spin,
  Modal,
  message,
} from 'antd';
import {
  CheckCircleOutlined,
  PlayCircleOutlined,
  SafetyCertificateOutlined,
  ExclamationCircleOutlined,
  ToolOutlined,
  FileProtectOutlined,
  MedicineBoxOutlined,
  AlertOutlined,
} from '@ant-design/icons';
import { useParams, useNavigate } from 'react-router-dom';
import { useMissionDetail } from '../hooks/useDriverMissions';
import MissionHeaderCard from '../components/MissionHeaderCard';
import EmergencyReportModal from '../components/EmergencyReportModal';

const { Title, Text, Paragraph } = Typography;

// Định nghĩa thông tin hiển thị các nhóm kiểm tra
const CATEGORY_META = {
  Vehicle: {
    title: 'Kiểm tra Phương tiện & Cabin chở ngựa',
    icon: <ToolOutlined style={{ color: '#0284C7' }} />,
    color: '#E0F2FE',
  },
  Equipment: {
    title: 'Trang thiết bị an toàn & Sơ cứu thú y',
    icon: <MedicineBoxOutlined style={{ color: '#D97706' }} />,
    color: '#FEF3C7',
  },
  Documentation: {
    title: 'Hồ sơ pháp lý & Giấy tờ thông hành',
    icon: <FileProtectOutlined style={{ color: '#7C3AED' }} />,
    color: '#EDE9FE',
  },
  HorseInspection: {
    title: 'Khảo sát thể trạng ngựa trước khi lên xe',
    icon: <SafetyCertificateOutlined style={{ color: '#16A34A' }} />,
    color: '#DCFCE7',
  },
};

/**
 * Màn hình 2: Danh mục kiểm tra an toàn tiền khởi hành (Pre-departure Checklist)
 */
export default function PreDepartureChecklistPage() {
  const { tripId } = useParams();
  const navigate = useNavigate();
  const {
    mission,
    loading,
    actionLoading,
    error,
    toggleChecklistItem,
    startTrip,
    reportIncident,
  } = useMissionDetail(tripId);

  const [sosModalOpen, setSosModalOpen] = useState(false);
  const [startConfirmOpen, setStartConfirmOpen] = useState(false);

  const checklist = useMemo(() => mission?.preDepartureChecklist || [], [mission?.preDepartureChecklist]);

  // Phân nhóm danh mục theo Category
  const groupedChecklist = useMemo(() => {
    const groups = {
      Vehicle: [],
      Equipment: [],
      Documentation: [],
      HorseInspection: [],
    };
    checklist.forEach((item) => {
      const cat = item.category || 'Vehicle';
      if (!groups[cat]) groups[cat] = [];
      groups[cat].push(item);
    });
    return groups;
  }, [checklist]);

  // Tính toán tỷ lệ hoàn thành
  const stats = useMemo(() => {
    const total = checklist.length;
    const completed = checklist.filter((i) => i.checked).length;
    const mandatory = checklist.filter((i) => i.isMandatory);
    const completedMandatory = mandatory.filter((i) => i.checked);
    const isAllMandatoryDone = mandatory.length > 0 && completedMandatory.length === mandatory.length;
    const percent = total > 0 ? Math.round((completed / total) * 100) : 0;

    return {
      total,
      completed,
      mandatoryCount: mandatory.length,
      completedMandatoryCount: completedMandatory.length,
      isAllMandatoryDone,
      percent,
    };
  }, [checklist]);

  // Xử lý toggle một mục checklist
  const handleToggle = async (item) => {
    const newChecked = !item.checked;
    await toggleChecklistItem(item.id, newChecked);
  };

  // Xử lý kiểm tra nhanh tất cả các mục
  const handleCheckAll = async () => {
    const unChecked = checklist.filter((i) => !i.checked);
    for (const item of unChecked) {
      await toggleChecklistItem(item.id, true);
    }
    message.success('Đã đánh dấu hoàn tất toàn bộ danh mục kiểm tra an toàn');
  };

  // Bắt đầu chuyến đi sau khi kiểm tra xong
  const handleStartMission = async () => {
    setStartConfirmOpen(false);
    const success = await startTrip();
    if (success) {
      message.success('Chuyến xe đã chính thức xuất bến! Chuyển sang màn hình theo dõi lộ trình.');
      navigate(`/driver/missions/${tripId}/execution`);
    }
  };

  if (loading && !mission) {
    return (
      <div style={{ textAlign: 'center', padding: '100px 0' }}>
        <Spin size="large" tip="Đang tải dữ liệu kiểm tra an toàn..." />
      </div>
    );
  }

  const isAlreadyInTransit = ['InTransit', 'EmergencyRerouting', 'ArrivedDestination', 'Completed'].includes(
    mission?.overallStatus
  );

  return (
    <div style={{ maxWidth: 1200, margin: '0 auto', padding: '24px 16px' }}>
      {/* Header tóm tắt chuyến xe */}
      <MissionHeaderCard
        mission={mission}
        activeTab="checklist"
        onOpenSos={() => setSosModalOpen(true)}
        breadcrumbItems={[{ title: 'Kiểm tra tiền khởi hành' }]}
      />

      {error && (
        <Alert
          message="Lỗi hệ thống"
          description={error}
          type="error"
          showIcon
          style={{ marginBottom: 20, borderRadius: 8 }}
        />
      )}

      {/* Thông báo trạng thái chuyến nếu đã xuất bến */}
      {isAlreadyInTransit && (
        <Alert
          message="Chuyến đi đã xuất bến"
          description={`Chuyến xe hiện đang ở trạng thái "${mission.overallStatus}". Bạn có thể xem lại biên bản kiểm tra hoặc chuyển sang màn hình theo dõi lộ trình.`}
          type="info"
          showIcon
          style={{ marginBottom: 20, borderRadius: 8 }}
          action={
            <Button
              type="primary"
              size="small"
              onClick={() => navigate(`/driver/missions/${tripId}/execution`)}
              style={{ backgroundColor: '#F59E0B', borderColor: '#F59E0B' }}
            >
              Xem lộ trình
            </Button>
          }
        />
      )}

      {/* Khối tóm tắt tiến độ kiểm tra */}
      <Card
        style={{
          borderRadius: 12,
          marginBottom: 24,
          boxShadow: '0 2px 8px rgba(0,0,0,0.06)',
          border: '1px solid #E5E7EB',
        }}
        bodyStyle={{ padding: 24 }}
      >
        <Row gutter={[24, 16]} align="middle">
          <Col xs={24} md={16}>
            <Title level={4} style={{ margin: 0, color: '#111827' }}>
              Tiến độ kiểm tra an toàn trước khi nổ máy
            </Title>
            <Paragraph type="secondary" style={{ margin: '4px 0 12px 0' }}>
              Quy chuẩn an toàn vận chuyển ngựa đua cao cấp. Yêu cầu kiểm tra kỹ lưỡng cabin, hệ thống treo khí nén, nhiệt độ và thể trạng từng cá thể ngựa trước khi xuất phát.
            </Paragraph>

            <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
              <div style={{ flex: 1 }}>
                <Progress
                  percent={stats.percent}
                  strokeColor={stats.isAllMandatoryDone ? '#10B981' : '#F59E0B'}
                  size={['100%', 14]}
                  style={{ margin: 0 }}
                />
              </div>
              <Text strong style={{ fontSize: 16, color: stats.isAllMandatoryDone ? '#10B981' : '#D97706' }}>
                {stats.completed}/{stats.total} mục ({stats.percent}%)
              </Text>
            </div>
          </Col>

          <Col xs={24} md={8} style={{ textAlign: 'right' }}>
            {stats.isAllMandatoryDone ? (
              <div
                style={{
                  background: '#F0FDF4',
                  border: '1px solid #BBF7D0',
                  padding: '12px 16px',
                  borderRadius: 8,
                  textAlign: 'left',
                }}
              >
                <Space align="center" size={8}>
                  <CheckCircleOutlined style={{ color: '#16A34A', fontSize: 20 }} />
                  <div>
                    <Text strong style={{ color: '#15803D' }}>
                      Đủ điều kiện xuất bến
                    </Text>
                    <div style={{ fontSize: 12, color: '#166534' }}>
                      Đã hoàn thành 100% danh mục an toàn bắt buộc
                    </div>
                  </div>
                </Space>
              </div>
            ) : (
              <div
                style={{
                  background: '#FFFBEB',
                  border: '1px solid #FDE68A',
                  padding: '12px 16px',
                  borderRadius: 8,
                  textAlign: 'left',
                }}
              >
                <Space align="center" size={8}>
                  <ExclamationCircleOutlined style={{ color: '#D97706', fontSize: 20 }} />
                  <div>
                    <Text strong style={{ color: '#B45309' }}>
                      Còn {stats.mandatoryCount - stats.completedMandatoryCount} mục bắt buộc
                    </Text>
                    <div style={{ fontSize: 12, color: '#92400E' }}>
                      Cần hoàn thành trước khi được phép xuất bến
                    </div>
                  </div>
                </Space>
              </div>
            )}
          </Col>
        </Row>
      </Card>

      {/* Danh sách 4 Nhóm Danh mục kiểm tra */}
      <Space direction="vertical" size={20} style={{ width: '100%', marginBottom: 32 }}>
        {Object.entries(CATEGORY_META).map(([catKey, meta]) => {
          const items = groupedChecklist[catKey] || [];
          if (items.length === 0) return null;

          const catCompleted = items.filter((i) => i.checked).length;
          const isCatAllDone = catCompleted === items.length;

          return (
            <Card
              key={catKey}
              style={{
                borderRadius: 12,
                boxShadow: '0 2px 6px rgba(0,0,0,0.04)',
                border: '1px solid #E5E7EB',
              }}
              bodyStyle={{ padding: 20 }}
            >
              {/* Tiêu đề nhóm */}
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  marginBottom: 16,
                  paddingBottom: 12,
                  borderBottom: '1px solid #F3F4F6',
                }}
              >
                <Space size={10} align="center">
                  <div
                    style={{
                      background: meta.color,
                      width: 36,
                      height: 36,
                      borderRadius: 8,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: 18,
                    }}
                  >
                    {meta.icon}
                  </div>
                  <Title level={5} style={{ margin: 0, color: '#1F2937' }}>
                    {meta.title}
                  </Title>
                </Space>

                <Tag color={isCatAllDone ? 'green' : 'gold'} style={{ borderRadius: 6, fontSize: 13 }}>
                  {catCompleted}/{items.length} mục
                </Tag>
              </div>

              {/* Danh sách các mục trong nhóm */}
              <Space direction="vertical" size={12} style={{ width: '100%' }}>
                {items.map((item) => (
                  <div
                    key={item.id}
                    onClick={() => handleToggle(item)}
                    style={{
                      display: 'flex',
                      alignItems: 'flex-start',
                      justifyContent: 'space-between',
                      padding: '12px 16px',
                      background: item.checked ? '#F0FDF4' : '#F9FAFB',
                      borderRadius: 8,
                      border: item.checked ? '1px solid #BBF7D0' : '1px solid #E5E7EB',
                      cursor: 'pointer',
                      transition: 'all 0.2s',
                    }}
                  >
                    <Space align="start" size={12} style={{ flex: 1 }}>
                      <Checkbox
                        checked={item.checked}
                        onChange={() => handleToggle(item)}
                        style={{ marginTop: 2 }}
                      />
                      <div>
                        <Space size={8} align="center">
                          <Text strong style={{ color: item.checked ? '#15803D' : '#111827', fontSize: 14 }}>
                            {item.title}
                          </Text>
                          {item.isMandatory ? (
                            <Tag color="error" style={{ borderRadius: 4, fontSize: 11 }}>
                              Bắt buộc
                            </Tag>
                          ) : (
                            <Tag color="default" style={{ borderRadius: 4, fontSize: 11 }}>
                              Khuyến nghị
                            </Tag>
                          )}
                        </Space>
                        <Paragraph
                          type="secondary"
                          style={{ margin: '4px 0 0 0', fontSize: 13, color: '#4B5563' }}
                        >
                          {item.description}
                        </Paragraph>
                      </div>
                    </Space>

                    <div style={{ textAlign: 'right', minWidth: 140 }}>
                      {item.checked ? (
                        <div>
                          <Tag color="success" icon={<CheckCircleOutlined />} style={{ borderRadius: 6 }}>
                            Đã đạt
                          </Tag>
                          <div style={{ fontSize: 11, color: '#6B7280', marginTop: 4 }}>
                            {item.checkedAt ? new Date(item.checkedAt).toLocaleTimeString('vi-VN') : 'Đã kiểm tra'}
                          </div>
                        </div>
                      ) : (
                        <Tag color="default" style={{ borderRadius: 6 }}>
                          Chưa kiểm tra
                        </Tag>
                      )}
                    </div>
                  </div>
                ))}
              </Space>
            </Card>
          );
        })}
      </Space>

      {/* Action Bar dưới cùng */}
      <Card
        style={{
          borderRadius: 12,
          position: 'sticky',
          bottom: 16,
          boxShadow: '0 4px 16px rgba(0,0,0,0.12)',
          border: '1px solid #E5E7EB',
          zIndex: 10,
        }}
        bodyStyle={{ padding: '16px 24px' }}
      >
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            flexWrap: 'wrap',
            gap: 16,
          }}
        >
          <Space size={12}>
            <Button
              onClick={handleCheckAll}
              disabled={stats.percent === 100}
              style={{ borderRadius: 8 }}
            >
              Chọn nhanh tất cả
            </Button>
            <Button
              danger
              icon={<AlertOutlined />}
              onClick={() => setSosModalOpen(true)}
              style={{ borderRadius: 8 }}
            >
              Báo cáo bất thường
            </Button>
          </Space>

          <Space size={12}>
            <Button
              size="large"
              onClick={() => navigate('/driver/missions')}
              style={{ borderRadius: 8 }}
            >
              Quay lại danh sách
            </Button>

            {mission?.overallStatus === 'Scheduled' && (
              <Button
                type="primary"
                size="large"
                icon={<PlayCircleOutlined />}
                disabled={!stats.isAllMandatoryDone}
                loading={actionLoading}
                onClick={() => setStartConfirmOpen(true)}
                style={{
                  backgroundColor: stats.isAllMandatoryDone ? '#F59E0B' : undefined,
                  borderColor: stats.isAllMandatoryDone ? '#F59E0B' : undefined,
                  fontWeight: 600,
                  borderRadius: 8,
                  padding: '0 28px',
                  boxShadow: stats.isAllMandatoryDone ? '0 2px 8px rgba(245,158,11,0.4)' : undefined,
                }}
              >
                Xác nhận & Bắt đầu xuất bến
              </Button>
            )}

            {isAlreadyInTransit && (
              <Button
                type="primary"
                size="large"
                onClick={() => navigate(`/driver/missions/${tripId}/execution`)}
                style={{
                  backgroundColor: '#F59E0B',
                  borderColor: '#F59E0B',
                  fontWeight: 600,
                  borderRadius: 8,
                }}
              >
                Tiếp tục lộ trình
              </Button>
            )}
          </Space>
        </div>
      </Card>

      {/* Modal xác nhận bắt đầu xuất bến */}
      <Modal
        title="Xác nhận khởi hành chuyến xe"
        open={startConfirmOpen}
        onOk={handleStartMission}
        onCancel={() => setStartConfirmOpen(false)}
        okText="Xác nhận xuất bến"
        cancelText="Kiểm tra lại"
        okButtonProps={{
          style: { backgroundColor: '#F59E0B', borderColor: '#F59E0B' },
          loading: actionLoading,
        }}
      >
        <Paragraph>
          Bạn đã hoàn thành toàn bộ danh mục kiểm tra an toàn tiền khởi hành cho chuyến xe{' '}
          <Text strong>{mission?.tripCode}</Text>.
        </Paragraph>
        <Paragraph>
          Khi xác nhận, chuyến xe sẽ chính thức chuyển sang trạng thái <Tag color="orange">Đang di chuyển</Tag>{' '}
          và hệ thống sẽ bắt đầu ghi nhận nhật ký GPS cùng các mốc kiểm soát trên lộ trình.
        </Paragraph>
      </Modal>

      {/* Modal Báo cáo khẩn cấp SOS */}
      <EmergencyReportModal
        open={sosModalOpen}
        onClose={() => setSosModalOpen(false)}
        tripId={tripId}
        tripCode={mission?.tripCode}
        horses={mission?.horses || []}
        onSubmit={reportIncident}
      />
    </div>
  );
}
