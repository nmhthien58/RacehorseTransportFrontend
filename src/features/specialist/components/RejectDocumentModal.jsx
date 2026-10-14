import { useState } from 'react';
import { Modal, Form, Input, Button, Space, Typography, Alert } from 'antd';
import { useTranslation } from 'react-i18next';

const { Text } = Typography;
const { TextArea } = Input;

/**
 * Util 3: Reject Document Modal (Frame 144:14578 - Reject_Request_1)
 * Modal từ chối tài liệu thẩm định không đạt chuẩn kèm ghi chú cho khách hàng
 * @param {Object} props
 * @param {boolean} props.open - Trạng thái hiển thị modal
 * @param {Object} props.document - Thông tin tài liệu đang xử lý
 * @param {Object} props.dossier - Thông tin hồ sơ liên kết
 * @param {boolean} props.loading - Trạng thái đang gửi yêu cầu
 * @param {Function} props.onCancel - Đóng modal
 * @param {Function} props.onConfirm - Xác nhận từ chối kèm lý do
 * @returns {JSX.Element}
 */
export default function RejectDocumentModal({
  open,
  document,
  dossier,
  loading,
  onCancel,
  onConfirm,
}) {
  const { t } = useTranslation();
  const [form] = Form.useForm();
  const [reasonText, setReasonText] = useState('');

  const quickReasons = [
    t('specialist.reject.quickFormat', 'Sai định dạng file hoặc hình ảnh bị mờ'),
    t('specialist.reject.quickMismatch', 'Mã số vi mạch hoặc tên ngựa không khớp hồ sơ'),
    t('specialist.reject.quickExpired', 'Giấy tờ đã quá thời hạn quy định (hết hiệu lực)'),
    t('specialist.reject.quickStamp', 'Thiếu dấu mộc tròn hoặc chữ ký của bác sĩ thú y'),
  ];

  const handleQuickSelect = (text) => {
    form.setFieldsValue({ reason: text });
    setReasonText(text);
  };

  const handleFinish = (values) => {
    onConfirm(values.reason.trim());
    form.resetFields();
    setReasonText('');
  };

  const currentRejectionCount = (document?.rejectionCount || 0) + 1;

  return (
    <Modal
      title={
        <div>
          <div style={{ color: '#991B1B', fontWeight: 700, fontSize: 16 }}>
            {t('specialist.reject.modalTitle', 'Từ chối tài liệu thẩm định')}
          </div>
          <Text type="secondary" style={{ fontSize: 12 }}>
            {document?.docTypeName || 'Giấy tờ kiểm dịch'} • {dossier?.dossierCode}
          </Text>
        </div>
      }
      open={open}
      onCancel={() => {
        form.resetFields();
        setReasonText('');
        onCancel();
      }}
      footer={null}
      destroyOnClose
      width={560}
      styles={{
        header: {
          borderBottom: '1px solid #FEE2E2',
          paddingBottom: 12,
          marginBottom: 16,
        },
      }}
    >
      <Form form={form} layout="vertical" onFinish={handleFinish}>
        {/* Cảnh báo số lần từ chối theo quy định 3 lần */}
        <Alert
          type="warning"
          showIcon
          message={
            <span style={{ fontSize: 12, fontWeight: 500 }}>
              {t('specialist.reject.counterNote', 'Lần từ chối: {{count}}/3. Khách hàng được nộp lại tối đa 3 lần trước khi hồ sơ chuyển sang diện vướng mắc đặc biệt.', {
                count: currentRejectionCount,
              })}
            </span>
          }
          style={{ marginBottom: 16, borderRadius: 4 }}
        />

        {/* Nút chọn lý do nhanh */}
        <div style={{ marginBottom: 12 }}>
          <Text style={{ fontSize: 12, color: '#64748B', display: 'block', marginBottom: 6 }}>
            {t('specialist.reject.quickSelectLabel', 'Chọn nhanh lý do chuẩn nghiệp vụ:')}
          </Text>
          <Space wrap size={[6, 6]}>
            {quickReasons.map((reason, idx) => (
              <Button
                key={idx}
                size="small"
                style={{
                  fontSize: 11,
                  borderRadius: 4,
                  borderColor: '#E2E8F0',
                  color: '#475569',
                }}
                onClick={() => handleQuickSelect(reason)}
              >
                {reason}
              </Button>
            ))}
          </Space>
        </div>

        {/* Nhập lý do chi tiết */}
        <Form.Item
          name="reason"
          label={
            <span style={{ fontSize: 13, fontWeight: 500, color: '#1E293B' }}>
              {t('specialist.reject.reasonLabel', 'Lý do từ chối cụ thể')} <span style={{ color: '#DC2626' }}>*</span>
            </span>
          }
          rules={[
            {
              required: true,
              message: t('specialist.reject.reasonRequired', 'Vui lòng cung cấp lý do từ chối để thông báo cho khách hàng'),
            },
            {
              min: 10,
              message: t('specialist.reject.reasonMin', 'Lý do cần tối thiểu 10 ký tự'),
            },
          ]}
        >
          <TextArea
            rows={4}
            maxLength={500}
            showCount
            placeholder={t('specialist.reject.placeholder', 'Nêu rõ sai sót hoặc thông tin cần bổ sung chỉnh sửa...')}
            value={reasonText}
            onChange={(e) => setReasonText(e.target.value)}
            style={{ borderRadius: 4 }}
          />
        </Form.Item>

        <div style={{ fontSize: 12, color: '#94A3B8', marginBottom: 20 }}>
          {t('specialist.reject.notifyNote', 'Khách hàng sẽ nhận được thông báo qua hệ thống để cập nhật lại tệp tài liệu mới.')}
        </div>

        {/* Footer buttons */}
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10 }}>
          <Button
            onClick={() => {
              form.resetFields();
              setReasonText('');
              onCancel();
            }}
            style={{ borderRadius: 4 }}
          >
            {t('specialist.reject.cancelBtn', 'Hủy')}
          </Button>
          <Button
            type="primary"
            danger
            htmlType="submit"
            loading={loading}
            style={{ borderRadius: 4, fontWeight: 500 }}
          >
            {t('specialist.reject.confirmBtn', 'Xác nhận từ chối')}
          </Button>
        </div>
      </Form>
    </Modal>
  );
}
