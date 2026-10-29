// Đang sửa ApproveBookingModal vì đổi nhãn thành Duyệt sơ bộ theo FE-04 (R-10)
import { useEffect, useState } from 'react';
import { Modal, Alert, Form, Select, Table, InputNumber, Typography } from 'antd';
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
  horses = [],
  specialists = [],
  confirmLoading = false,
  onConfirm,
  onCancel,
}) {
  const { t } = useTranslation();
  const [form] = Form.useForm();
  // Giá trị thỏa thuận từng con (mặc định = giá trị khách khai báo); con không khai báo thì bỏ qua
  const valuedHorses = horses.filter((h) => Number(h.declaredValue) > 0);
  // Gắn với mã đơn: mở đơn khác thì tự về giá trị mặc định
  const [agreedState, setAgreedState] = useState({ code: null, values: {} });
  const agreed = agreedState.code === bookingCode ? agreedState.values : {};

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
      const horseValues = valuedHorses.map((h) => ({
        bookingHorseId: h.bookingHorseId,
        agreedValue: Number(agreed[h.bookingHorseId] ?? h.agreedValue ?? h.declaredValue),
      }));
      onConfirm?.({ ...values, horseValues });
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
            code: (bookingCode || '').replace(/^#+/, ''),
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

          {valuedHorses.length > 0 && (
            <Form.Item
              label="Chốt giá trị thỏa thuận từng con (USD)"
              extra="Bảo hiểm và bồi thường tính trên giá trị thỏa thuận. Mặc định bằng giá trị khách khai báo; kiểm tra chứng từ trước khi chốt."
            >
              <Table
                size="small"
                pagination={false}
                rowKey="bookingHorseId"
                dataSource={valuedHorses}
                columns={[
                  { title: 'Ngựa', dataIndex: 'horseName' },
                  {
                    title: 'Khai báo',
                    dataIndex: 'declaredValue',
                    align: 'right',
                    render: (v) => `$${Number(v).toLocaleString('en-US')}`,
                  },
                  {
                    title: 'Chứng từ',
                    dataIndex: 'valueProofUrl',
                    render: (url) =>
                      url ? (
                        <a href={url} target="_blank" rel="noreferrer">
                          Xem
                        </a>
                      ) : (
                        <Typography.Text type="secondary">Không có</Typography.Text>
                      ),
                  },
                  {
                    title: 'Thỏa thuận',
                    width: 150,
                    render: (_, h) => (
                      <InputNumber
                        min={0}
                        step={1000}
                        prefix="$"
                        style={{ width: '100%' }}
                        value={agreed[h.bookingHorseId] ?? h.agreedValue ?? h.declaredValue}
                        onChange={(v) =>
                          setAgreedState({ code: bookingCode, values: { ...agreed, [h.bookingHorseId]: v } })
                        }
                      />
                    ),
                  },
                ]}
              />
            </Form.Item>
          )}

          {/* Điều phối làm theo danh sách chung: đơn duyệt sơ bộ hiện cho mọi Coordinator */}
          <Form.Item
            label="Điều phối viên lập tuyến (Coordinator)"
            extra="Đơn được chuyển vào danh sách chung, Coordinator nào cũng có thể lập tuyến."
          >
            <Select disabled placeholder="Tất cả Coordinator" />
          </Form.Item>
        </Form>
      </div>
    </Modal>
  );
}
