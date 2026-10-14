import { useEffect } from 'react';
import {
  Modal,
  Form,
  Input,
  Button,
  Typography,
  Alert,
  Divider,
} from 'antd';
import { CheckCircleOutlined, SafetyCertificateOutlined } from '@ant-design/icons';
import { useTranslation } from 'react-i18next';

const { Text } = Typography;

/**
 * Modal Phê duyệt thông quan chính thức (Clear Dossier Modal)
 * Thực hiện sau khi Cơ quan chức năng (Cục Thú y / Hải quan) đã chấp thuận và cấp mã số thông quan chính thức
 * @param {Object} props
 * @param {boolean} props.open - Trạng thái hiển thị modal
 * @param {Object} props.dossier - Thông tin hồ sơ kiểm dịch
 * @param {boolean} props.loading - Trạng thái đang gửi yêu cầu
 * @param {Function} props.onCancel - Đóng modal
 * @param {Function} props.onConfirm - Xác nhận thông quan ({ clearanceNumber: string })
 * @returns {JSX.Element}
 */
export default function ClearDossierModal({
  open,
  dossier,
  loading,
  onCancel,
  onConfirm,
}) {
  const { t } = useTranslation();
  const [form] = Form.useForm();

  useEffect(() => {
    if (open && dossier) {
      const generatedCode = `VET-CLR-${new Date().getFullYear()}-${String(dossier.dossierId || Math.floor(Math.random() * 1000)).padStart(4, '0')}`;
      form.setFieldsValue({
        clearanceNumber: dossier.clearanceNumber || generatedCode,
        authorityNote: 'Đã hoàn tất kiểm tra lâm sàng và đối chiếu vi mạch RFID đạt chuẩn.',
      });
    }
  }, [open, dossier, form]);

  const handleFinish = (values) => {
    onConfirm({
      clearanceNumber: values.clearanceNumber?.trim(),
      authorityNote: values.authorityNote?.trim(),
    });
  };

  return (
    <Modal
      title={
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <CheckCircleOutlined style={{ color: '#16A34A', fontSize: 18 }} />
          <div>
            <div style={{ color: '#0F172A', fontWeight: 700, fontSize: 16 }}>
              {t('specialist.clear.modalTitle', 'Xác nhận Phê duyệt thông quan (Cleared)')}
            </div>
            <Text type="secondary" style={{ fontSize: 12 }}>
              {t('specialist.dossiers.colCode', 'Mã hồ sơ')}: {dossier?.dossierCode} • {dossier?.horseName}
            </Text>
          </div>
        </div>
      }
      open={open}
      onCancel={onCancel}
      footer={null}
      destroyOnClose
      width={540}
      styles={{
        header: {
          borderBottom: '1px solid #F1F5F9',
          paddingBottom: 12,
          marginBottom: 16,
        },
      }}
    >
      <Form form={form} layout="vertical" onFinish={handleFinish}>
        {/* Banner phân biệt rõ ràng nghiệp vụ */}
        <Alert
          message={
            <div>
              <strong>Bước 2 trong quy trình kiểm dịch:</strong>
              <div style={{ fontSize: 12, color: '#334155', marginTop: 4 }}>
                Chỉ thực hiện sau khi Cơ quan kiểm dịch / Hải quan cửa khẩu đã kiểm tra thực tế và chính thức cấp phép thông quan cho cá thể ngựa.
              </div>
            </div>
          }
          type="success"
          showIcon
          icon={<SafetyCertificateOutlined style={{ color: '#16A34A' }} />}
          style={{ marginBottom: 16, borderRadius: 6, backgroundColor: '#F0FDF4', border: '1px solid #BBF7D0' }}
        />

        {/* 1. Nhập số hiệu giấy phép thông quan */}
        <Form.Item
          name="clearanceNumber"
          label={
            <span style={{ fontWeight: 600, color: '#0F172A' }}>
              {t('specialist.clear.clearanceNumberLabel', 'Số hiệu giấy phép thông quan / Kiểm dịch thú y:')}
            </span>
          }
          rules={[
            {
              required: true,
              message: t('specialist.clear.clearanceNumberRequired', 'Vui lòng nhập số hiệu giấy phép thông quan'),
            },
          ]}
        >
          <Input
            placeholder="Ví dụ: VET-CLR-2026-0042"
            style={{ borderRadius: 6, fontFamily: 'monospace', fontWeight: 600 }}
          />
        </Form.Item>

        {/* 2. Ghi chú xác nhận */}
        <Form.Item
          name="authorityNote"
          label={
            <span style={{ fontWeight: 600, color: '#0F172A' }}>
              {t('specialist.clear.authorityNoteLabel', 'Ghi chú phê duyệt của cơ quan chức năng:')}
            </span>
          }
        >
          <Input.TextArea
            rows={2}
            placeholder="Ghi chú thêm về điều kiện vận chuyển hoặc chứng chỉ kèm theo..."
            style={{ borderRadius: 6 }}
          />
        </Form.Item>

        <Divider style={{ margin: '16px 0 12px 0' }} />

        {/* Nút hành động */}
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8 }}>
          <Button onClick={onCancel} disabled={loading} style={{ borderRadius: 4 }}>
            {t('specialist.quarantineRules.close', 'Hủy')}
          </Button>
          <Button
            type="primary"
            htmlType="submit"
            loading={loading}
            icon={<CheckCircleOutlined />}
            style={{
              borderRadius: 4,
              backgroundColor: '#16A34A',
              borderColor: '#16A34A',
              fontWeight: 500,
            }}
          >
            {t('specialist.clear.confirmClearBtn', 'Xác nhận thông quan (Cleared)')}
          </Button>
        </div>
      </Form>
    </Modal>
  );
}
