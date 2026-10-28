// Đang sửa ApproveBookingModal vì đổi nhãn thành Duyệt sơ bộ theo FE-04 (R-10)
import { useEffect } from 'react';
import { Modal, Alert, Form, Select } from 'antd';
import { useTranslation } from 'react-i18next';

/**
 * Modal phê duyệt yêu cầu vận chuyển và chỉ định Chuyên viên kiểm dịch.
 * Backend (POST /bookings/{id}/approve) chỉ nhận specialistUserId — đơn không gán điều phối viên,
 * điều phối viên nhận ngựa từ hàng chờ xếp chuyến (GET /trips/unplanned-horses).
 * Dùng chung cho BookingDetailPage và PendingRequestsPage.
 *
 * @param {Object} props
 * @param {boolean} props.open - Trạng thái hiển thị modal
 * @param {string} props.bookingCode - Mã booking hiển thị trên Alert
 * @param {Array} [props.specialists=[]] - Danh sách chuyên viên kiểm dịch
 * @param {boolean} [props.confirmLoading=false] - Trạng thái loading khi submit
 * @param {Function} props.onConfirm - Callback khi submit form hợp lệ (values: { specialistUserId })
 * @param {Function} props.onCancel - Callback đóng modal
 */
export default function ApproveBookingModal({
  open,
  bookingCode,
  specialists = [],
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
    }
  }, [open, specialists, form]);

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
      title={t('manager.bookings.modals.preApproveTitle', 'Duyệt sơ bộ yêu cầu vận chuyển')}
      open={open}
      onCancel={onCancel}
      onOk={handleOk}
      confirmLoading={confirmLoading}
      okText={t('manager.bookings.actions.preApprove', 'Duyệt sơ bộ')}
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
          description={t('manager.bookings.modals.preApproveConfirmNote', 'Đơn sẽ được duyệt sơ bộ tính khả thi và chuyển đến Điều phối viên để lập tuyến chi tiết trên bản đồ. Báo giá chốt và giá trị ngựa sẽ được duyệt ở bước sau.')}
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

        </Form>
      </div>
    </Modal>
  );
}
