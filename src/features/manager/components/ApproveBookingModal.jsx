import { useEffect } from 'react';
import { Modal, Alert, Form, Select } from 'antd';
import { useTranslation } from 'react-i18next';

/**
 * Modal phê duyệt yêu cầu vận chuyển và chỉ định Chuyên viên kiểm dịch + Điều phối viên.
 * Dùng chung cho BookingDetailPage và PendingRequestsPage.
 *
 * @param {Object} props
 * @param {boolean} props.open - Trạng thái hiển thị modal
 * @param {string} props.bookingCode - Mã booking hiển thị trên Alert
 * @param {Array} [props.specialists=[]] - Danh sách chuyên viên kiểm dịch
 * @param {Array} [props.coordinators=[]] - Danh sách điều phối viên đội xe
 * @param {boolean} [props.confirmLoading=false] - Trạng thái loading khi submit
 * @param {Function} props.onConfirm - Callback khi submit form hợp lệ (values: { specialistUserId, coordinatorUserId })
 * @param {Function} props.onCancel - Callback đóng modal
 */
export default function ApproveBookingModal({
  open,
  bookingCode,
  specialists = [],
  coordinators = [],
  confirmLoading = false,
  onConfirm,
  onCancel,
}) {
  const { t } = useTranslation();
  const [form] = Form.useForm();

  useEffect(() => {
    if (open) {
      form.resetFields();
      if (specialists.length > 0) {
        form.setFieldValue('specialistUserId', specialists[0].userId);
      }
      if (coordinators.length > 0) {
        form.setFieldValue('coordinatorUserId', coordinators[0].userId);
      }
    }
  }, [open, specialists, coordinators, form]);

  const handleOk = async () => {
    try {
      const values = await form.validateFields();
      onConfirm?.(values);
    } catch {
      // Validate form thất bại, Ant Design tự highlight lỗi
    }
  };

  return (
    <Modal
      title={t('manager.bookings.modals.approveTitle')}
      open={open}
      onCancel={onCancel}
      onOk={handleOk}
      confirmLoading={confirmLoading}
      okText={t('manager.bookings.actions.approve')}
      okButtonProps={{
        style: { backgroundColor: '#F59E0B', borderColor: '#F59E0B', color: '#0f172a', fontWeight: 700 },
      }}
      destroyOnClose
    >
      <div style={{ marginTop: 12 }}>
        <Alert
          type="info"
          showIcon
          message={t('manager.bookings.modals.approveConfirmText', {
            code: `#${bookingCode || ''}`,
          })}
          description={t('manager.bookings.modals.approveConfirmNote')}
          style={{ marginBottom: 16, borderRadius: 8 }}
        />

        <Form form={form} layout="vertical">
          <Form.Item
            name="specialistUserId"
            label="Chuyên viên kiểm dịch & hồ sơ thú y (Transport Specialist)"
            rules={[
              {
                required: true,
                message: 'Vui lòng chỉ định Chuyên viên kiểm dịch phụ trách đơn!',
              },
            ]}
          >
            <Select
              placeholder="Chọn Chuyên viên kiểm dịch..."
              options={specialists.map((s) => ({
                value: s.userId,
                label: `🩺 ${s.fullName} (${s.email})`,
              }))}
            />
          </Form.Item>

          <Form.Item
            name="coordinatorUserId"
            label="Điều phối viên đội xe & lộ trình (Fleet & Route Coordinator)"
            rules={[
              {
                required: true,
                message: 'Vui lòng chỉ định Điều phối viên đội xe & lộ trình!',
              },
            ]}
          >
            <Select
              placeholder="Chọn Điều phối viên lộ trình..."
              options={coordinators.map((c) => ({
                value: c.userId,
                label: `🚚 ${c.fullName} (${c.email})`,
              }))}
            />
          </Form.Item>
        </Form>
      </div>
    </Modal>
  );
}
