import { useEffect } from 'react';
import { Modal, Form, Input, Typography, Space, Tag } from 'antd';
import { useTranslation } from 'react-i18next';

const { Text } = Typography;
const { TextArea } = Input;

/**
 * Modal nhập lý do từ chối đơn vận chuyển kèm danh sách lý do gợi ý nhanh
 * Dùng chung cho Logistics Manager (PendingRequestsPage & BookingDetailPage)
 *
 * @param {Object} props
 * @param {boolean} props.open - Trạng thái hiển thị modal
 * @param {() => void} props.onCancel - Callback khi đóng modal
 * @param {(reason: string) => void} props.onConfirm - Callback khi xác nhận từ chối
 * @param {boolean} [props.confirmLoading] - Trạng thái loading
 */
export default function RejectBookingModal({
  open,
  onCancel,
  onConfirm,
  confirmLoading = false,
}) {
  const { t } = useTranslation();
  const [form] = Form.useForm();

  useEffect(() => {
    if (!open) {
      form.resetFields();
    }
  }, [open, form]);

  const handleOk = async () => {
    try {
      const values = await form.validateFields();
      onConfirm?.(values.reason);
    } catch {
      // Validate thất bại đã hiển thị lỗi trên form
    }
  };

  const quickReasons = [
    t('manager.bookings.modals.quickReason1', 'Tuyến đường chưa hỗ trợ'),
    t('manager.bookings.modals.quickReason2', 'Thiếu phương tiện chuyên dụng'),
    t('manager.bookings.modals.quickReason3', 'Không có tài xế/chuyên viên phù hợp'),
    t('manager.bookings.modals.quickReason4', 'Hồ sơ y tế không đạt chuẩn'),
  ];

  return (
    <Modal
      title={t('manager.bookings.modals.rejectTitle', 'Từ chối yêu cầu vận chuyển')}
      open={open}
      onCancel={onCancel}
      onOk={handleOk}
      confirmLoading={confirmLoading}
      okText={t('manager.bookings.actions.reject', 'Xác nhận từ chối')}
      okButtonProps={{ danger: true }}
      destroyOnClose
    >
      <div style={{ marginTop: 12 }}>
        <div style={{ marginBottom: 14 }}>
          <Text type="secondary" style={{ fontSize: 12, display: 'block', marginBottom: 6 }}>
            {t('manager.bookings.modals.quickReasons', 'Gợi ý lý do nhanh')}:
          </Text>
          <Space wrap size={[6, 6]}>
            {quickReasons.map((reasonText) => (
              <Tag
                key={reasonText}
                style={{
                  cursor: 'pointer',
                  borderRadius: 6,
                  fontSize: 11,
                  padding: '2px 8px',
                }}
                onClick={() => form.setFieldsValue({ reason: reasonText })}
              >
                + {reasonText}
              </Tag>
            ))}
          </Space>
        </div>

        <Form form={form} layout="vertical">
          <Form.Item
            name="reason"
            label={t('manager.bookings.modals.rejectReasonLabel', 'Lý do từ chối')}
            rules={[
              {
                required: true,
                message: t('manager.bookings.modals.rejectReasonRequired', 'Vui lòng nhập lý do từ chối'),
              },
              {
                min: 10,
                message: t('manager.bookings.modals.rejectReasonMin', 'Lý do phải có ít nhất 10 ký tự'),
              },
            ]}
          >
            <TextArea
              rows={4}
              maxLength={500}
              showCount
              placeholder={t(
                'manager.bookings.modals.rejectReasonPlaceholder',
                'Nhập chi tiết lý do từ chối đơn này...',
              )}
            />
          </Form.Item>
        </Form>
      </div>
    </Modal>
  );
}
