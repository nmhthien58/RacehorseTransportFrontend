import { useMemo } from 'react';
import {
  Modal,
  Form,
  Input,
  Button,
  Checkbox,
  Space,
  Typography,
  Alert,
  Tag,
  Divider,
} from 'antd';
import { FileExclamationOutlined, SendOutlined } from '@ant-design/icons';
import { useTranslation } from 'react-i18next';

const { Text } = Typography;
const { TextArea } = Input;

/**
 * Modal Yêu cầu bổ sung tài liệu kiểm dịch
 * Cho phép Chuyên viên kiểm dịch (Specialist) chọn danh mục giấy tờ cần nộp bổ sung và ghi chú chỉ dẫn cho khách hàng
 * @param {Object} props
 * @param {boolean} props.open - Trạng thái hiển thị modal
 * @param {Object} props.dossier - Thông tin hồ sơ kiểm dịch đang xử lý
 * @param {boolean} props.loading - Trạng thái đang gửi yêu cầu
 * @param {Function} props.onCancel - Đóng modal
 * @param {Function} props.onConfirm - Xác nhận gửi yêu cầu ({ documentTypes: string[], notes: string })
 * @returns {JSX.Element}
 */
export default function RequestDocumentsModal({
  open,
  dossier,
  loading,
  onCancel,
  onConfirm,
}) {
  const { t } = useTranslation();
  const [form] = Form.useForm();

  // Tạo danh sách các loại giấy tờ từ checklist của hồ sơ
  const docOptions = useMemo(() => {
    return (dossier?.checklist || []).map((item) => ({
      label: item.docTypeName,
      value: item.docTypeName,
      state: item.state,
      isMandatory: item.isMandatory,
    }));
  }, [dossier]);

  // Gợi ý tự động chọn các giấy tờ chưa đạt (Rejected hoặc Missing)
  const defaultSelectedDocs = useMemo(() => {
    if (!dossier?.checklist) return [];
    const deficientDocs = dossier.checklist
      .filter((item) => item.state === 'Rejected' || item.state === 'Missing')
      .map((item) => item.docTypeName);

    return deficientDocs.length > 0
      ? deficientDocs
      : (dossier.checklist[0] ? [dossier.checklist[0].docTypeName] : []);
  }, [dossier]);

  // Theo dõi giá trị đang chọn trong form
  const watchedSelectedDocs = Form.useWatch('documentTypes', form);
  const selectedDocs = watchedSelectedDocs || defaultSelectedDocs;

  const quickReasons = [
    t('specialist.requestDocs.quickBlurry', 'Ảnh chụp/scan mờ, thiếu con dấu đỏ hoặc chữ ký kiểm dịch viên'),
    t('specialist.requestDocs.quickExpired', 'Giấy chứng nhận thú y hoặc kết quả xét nghiệm đã hết thời hạn hiệu lực'),
    t('specialist.requestDocs.quickMismatch', 'Mã số vi mạch RFID hoặc tên cá thể ngựa không khớp với đơn đặt chuyến'),
    t('specialist.requestDocs.quickFormat', 'Tài liệu không đúng biểu mẫu quy định của nước sở tại'),
  ];

  const handleQuickSelect = (text) => {
    const currentNotes = form.getFieldValue('notes') || '';
    const newNotes = currentNotes ? `${currentNotes}\n• ${text}` : `• ${text}`;
    form.setFieldsValue({ notes: newNotes });
  };

  const handleFinish = (values) => {
    onConfirm({
      documentTypes: values.documentTypes || selectedDocs,
      notes: (values.notes || '').trim(),
    });
  };

  const handleClose = () => {
    form.resetFields();
    onCancel();
  };

  return (
    <Modal
      title={
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <FileExclamationOutlined style={{ color: '#D97706', fontSize: 18 }} />
          <div>
            <div style={{ color: '#0F172A', fontWeight: 700, fontSize: 16 }}>
              {t('specialist.requestDocs.modalTitle', 'Yêu cầu bổ sung tài liệu kiểm dịch')}
            </div>
            <Text type="secondary" style={{ fontSize: 12 }}>
              {t('specialist.dossiers.colCode', 'Mã hồ sơ')}: {dossier?.dossierCode} • {dossier?.horseName}
            </Text>
          </div>
        </div>
      }
      open={open}
      onCancel={handleClose}
      footer={null}
      destroyOnClose
      width={580}
      styles={{
        header: {
          borderBottom: '1px solid #F1F5F9',
          paddingBottom: 12,
          marginBottom: 16,
        },
      }}
    >
      <Form
        form={form}
        layout="vertical"
        onFinish={handleFinish}
        initialValues={{
          documentTypes: selectedDocs,
          notes: '',
        }}
      >
        {/* Thông báo hướng dẫn nghiệp vụ */}
        <Alert
          message={t(
            'specialist.requestDocs.infoAlert',
            'Sau khi gửi yêu cầu, hồ sơ sẽ chuyển sang trạng thái "Awaiting Docs" (Chờ bổ sung giấy tờ) và hệ thống sẽ gửi thông báo tới khách hàng.'
          )}
          type="info"
          showIcon
          style={{ marginBottom: 16, fontSize: 12, borderRadius: 6 }}
        />

        {/* 1. Chọn loại tài liệu cần bổ sung */}
        <Form.Item
          name="documentTypes"
          label={
            <span style={{ fontWeight: 600, color: '#0F172A' }}>
              {t('specialist.requestDocs.selectDocsLabel', 'Chọn tài liệu cần bổ sung / chỉnh sửa:')}
            </span>
          }
          rules={[
            {
              required: true,
              message: t('specialist.requestDocs.selectDocsRequired', 'Vui lòng chọn ít nhất 1 loại tài liệu cần bổ sung'),
            },
          ]}
        >
          <Checkbox.Group style={{ width: '100%' }}>
            <Space orientation="vertical" orientationMargin="dense" style={{ width: '100%', gap: 8 }}>
              {docOptions.map((opt) => (
                <div
                  key={opt.value}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '8px 12px',
                    backgroundColor: selectedDocs.includes(opt.value) ? '#FFFBEB' : '#F8FAFC',
                    border: `1px solid ${selectedDocs.includes(opt.value) ? '#FDE68A' : '#E2E8F0'}`,
                    borderRadius: 6,
                    transition: 'all 0.2s',
                  }}
                >
                  <Checkbox value={opt.value} style={{ fontSize: 13, color: '#1E293B' }}>
                    <strong>{opt.label}</strong>
                  </Checkbox>
                  <Space size={4}>
                    {opt.isMandatory && (
                      <Tag color="error" style={{ borderRadius: 4, fontSize: 11, margin: 0 }}>
                        {t('specialist.quarantineRules.mandatory', 'Bắt buộc')}
                      </Tag>
                    )}
                    {opt.state === 'Rejected' && (
                      <Tag color="red" style={{ borderRadius: 4, fontSize: 11, margin: 0 }}>
                        {t('specialist.detail.rejected', 'Đã từ chối')}
                      </Tag>
                    )}
                    {opt.state === 'Missing' && (
                      <Tag color="orange" style={{ borderRadius: 4, fontSize: 11, margin: 0 }}>
                        {t('specialist.detail.missing', 'Chưa nộp')}
                      </Tag>
                    )}
                    {opt.state === 'Approved' && (
                      <Tag color="success" style={{ borderRadius: 4, fontSize: 11, margin: 0 }}>
                        {t('specialist.detail.verified', 'Đạt chuẩn')}
                      </Tag>
                    )}
                  </Space>
                </div>
              ))}
            </Space>
          </Checkbox.Group>
        </Form.Item>

        {/* 2. Gợi ý lý do nhanh */}
        <div style={{ marginBottom: 12 }}>
          <Text type="secondary" style={{ fontSize: 12, display: 'block', marginBottom: 6 }}>
            {t('specialist.requestDocs.quickReasonsTitle', 'Lý do & yêu cầu thường gặp (bấm để thêm vào ghi chú):')}
          </Text>
          <Space wrap size={[6, 6]}>
            {quickReasons.map((text, idx) => (
              <Button
                key={idx}
                size="small"
                style={{
                  fontSize: 11,
                  borderRadius: 4,
                  backgroundColor: '#FFFFFF',
                  borderColor: '#CBD5E1',
                  color: '#475569',
                }}
                onClick={() => handleQuickSelect(text)}
              >
                + {text.length > 40 ? `${text.substring(0, 40)}...` : text}
              </Button>
            ))}
          </Space>
        </div>

        {/* 3. Ô nhập ghi chú chỉ dẫn chi tiết */}
        <Form.Item
          name="notes"
          label={
            <span style={{ fontWeight: 600, color: '#0F172A' }}>
              {t('specialist.requestDocs.notesLabel', 'Ghi chú & Hướng dẫn cụ thể cho khách hàng:')}
            </span>
          }
          rules={[
            {
              required: true,
              message: t('specialist.requestDocs.notesRequired', 'Vui lòng nhập ghi chú hướng dẫn bổ sung'),
            },
          ]}
        >
          <TextArea
            rows={4}
            placeholder={t(
              'specialist.requestDocs.notesPlaceholder',
              'Ví dụ: Vui lòng cung cấp bản scan màu có dấu mộc tròn của Chi cục Thú y Vùng, thời hạn cấp trong vòng 10 ngày trước chuyến bay...'
            )}
            maxLength={500}
            showCount
            style={{ borderRadius: 6, fontSize: 13 }}
          />
        </Form.Item>

        <Divider style={{ margin: '16px 0 12px 0' }} />

        {/* 4. Nút bấm hành động */}
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8 }}>
          <Button onClick={handleClose} disabled={loading} style={{ borderRadius: 4 }}>
            {t('specialist.quarantineRules.close', 'Hủy')}
          </Button>
          <Button
            type="primary"
            htmlType="submit"
            loading={loading}
            icon={<SendOutlined />}
            style={{
              borderRadius: 4,
              backgroundColor: '#0F172A',
              borderColor: '#0F172A',
              fontWeight: 500,
            }}
          >
            {t('specialist.requestDocs.submitRequestBtn', 'Gửi yêu cầu bổ sung')}
          </Button>
        </div>
      </Form>
    </Modal>
  );
}
