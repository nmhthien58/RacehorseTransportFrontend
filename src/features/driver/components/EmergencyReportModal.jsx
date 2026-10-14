import { useState } from 'react';
import {
  Modal,
  Form,
  Select,
  Radio,
  Input,
  Button,
  Space,
  Typography,
  Alert,
  message,
} from 'antd';
import { AlertOutlined, SendOutlined } from '@ant-design/icons';

const { Text } = Typography;
const { TextArea } = Input;

const INCIDENT_TYPES = [
  { value: 'VehicleBreakdown', label: 'Hỏng hóc phương tiện / Lỗi động cơ hoặc điều hòa' },
  { value: 'TrafficAccident', label: 'Va chạm giao thông trên đường' },
  { value: 'HorseHealthCritical', label: 'Ngựa gặp vấn đề sức khỏe khẩn cấp (Colic, sốt, chấn thương)' },
  { value: 'WeatherDelay', label: 'Thời tiết xấu / Bão lũ tắc đường' },
  { value: 'CheckpointDelay', label: 'Trục trặc kiểm dịch / Giữ xe tại trạm kiểm soát' },
  { value: 'RerouteRequired', label: 'Yêu cầu đổi lộ trình khẩn cấp' },
  { value: 'Other', label: 'Sự cố phát sinh khác' },
];

/**
 * Modal báo cáo sự cố phát sinh khẩn cấp (SOS) của Tài xế / Áp tải
 * @param {{
 *   open: boolean,
 *   onClose: () => void,
 *   tripId: number|string,
 *   tripCode: string,
 *   horses?: Array<any>,
 *   onSubmit: (incidentData: Object) => Promise<boolean>
 * }} props
 */
export default function EmergencyReportModal({
  open,
  onClose,
  tripId,
  tripCode,
  horses = [],
  onSubmit,
}) {
  const [form] = Form.useForm();
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async () => {
    try {
      const values = await form.validateFields();
      setSubmitting(true);

      const incidentData = {
        tripId,
        tripCode,
        incidentType: values.incidentType,
        severity: values.severity,
        horseIds: values.horseIds || [],
        description: values.description,
        immediateActionTaken: values.immediateActionTaken || '',
        reportedAt: new Date().toISOString(),
      };

      const success = await onSubmit(incidentData);
      if (success) {
        message.success('Đã gửi báo cáo khẩn cấp về Trung tâm điều hành thành công!');
        form.resetFields();
        onClose();
      }
    } catch {
      // Validate error
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Modal
      title={
        <Space size={8} style={{ color: '#DC2626' }}>
          <AlertOutlined style={{ fontSize: 20 }} />
          <span>Báo cáo sự cố khẩn cấp trên lộ trình (SOS)</span>
        </Space>
      }
      open={open}
      onCancel={onClose}
      footer={null}
      destroyOnClose
      width={600}
    >
      <Alert
        message="Cảnh báo an toàn ưu tiên cao"
        description="Báo cáo này sẽ được chuyển ngay lập tức đến Điều phối viên và Bác sĩ thú y trực ban để kích hoạt quy trình ứng cứu khẩn cấp."
        type="error"
        showIcon
        style={{ marginBottom: 20, borderRadius: 8 }}
      />

      <div style={{ marginBottom: 16 }}>
        <Text type="secondary">Chuyến xe liên quan: </Text>
        <Text strong>{tripCode}</Text>
      </div>

      <Form
        form={form}
        layout="vertical"
        initialValues={{
          severity: 'Moderate',
          incidentType: 'VehicleBreakdown',
        }}
      >
        <Form.Item
          name="incidentType"
          label="Loại sự cố phát sinh"
          rules={[{ required: true, message: 'Vui lòng chọn loại sự cố' }]}
        >
          <Select options={INCIDENT_TYPES} placeholder="Chọn loại sự cố" size="large" />
        </Form.Item>

        <Form.Item
          name="severity"
          label="Mức độ nghiêm trọng"
          rules={[{ required: true, message: 'Vui lòng chọn mức độ' }]}
        >
          <Radio.Group buttonStyle="solid" size="middle">
            <Radio.Button value="Minor">Nhẹ</Radio.Button>
            <Radio.Button value="Moderate">Trung bình</Radio.Button>
            <Radio.Button value="Major">Nghiêm trọng</Radio.Button>
            <Radio.Button value="Critical">Tối khẩn (SOS)</Radio.Button>
          </Radio.Group>
        </Form.Item>

        {horses.length > 0 && (
          <Form.Item
            name="horseIds"
            label="Ngựa đua bị ảnh hưởng (nếu có)"
          >
            <Select
              mode="multiple"
              placeholder="Chọn ngựa đua bị ảnh hưởng"
              options={horses.map((h) => ({
                value: h.horseId,
                label: `${h.horseName} (Chip: ${h.microchipNumber || 'N/A'})`,
              }))}
            />
          </Form.Item>
        )}

        <Form.Item
          name="description"
          label="Mô tả chi tiết hiện trường và diễn biến"
          rules={[{ required: true, message: 'Vui lòng nhập mô tả hiện trường' }]}
        >
          <TextArea
            rows={4}
            placeholder="Mô tả vị trí cây số, hiện tượng máy xe hoặc biểu hiện sức khỏe của ngựa..."
          />
        </Form.Item>

        <Form.Item
          name="immediateActionTaken"
          label="Biện pháp kíp lái đã xử lý ban đầu"
        >
          <Input placeholder="Ví dụ: Đã tấp xe vào làn khẩn cấp, bật điều hòa phụ, cho ngựa uống điện giải..." />
        </Form.Item>

        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 12, marginTop: 24 }}>
          <Button onClick={onClose} disabled={submitting} style={{ borderRadius: 8 }}>
            Hủy bỏ
          </Button>
          <Button
            danger
            type="primary"
            icon={<SendOutlined />}
            loading={submitting}
            onClick={handleSubmit}
            style={{
              backgroundColor: '#DC2626',
              borderColor: '#DC2626',
              fontWeight: 600,
              borderRadius: 8,
              boxShadow: '0 2px 8px rgba(220,38,38,0.4)',
            }}
          >
            Gửi cảnh báo khẩn cấp
          </Button>
        </div>
      </Form>
    </Modal>
  );
}
