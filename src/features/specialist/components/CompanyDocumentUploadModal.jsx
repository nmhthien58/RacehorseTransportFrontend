import { useState } from 'react';
import { Modal, Form, Input, DatePicker, Upload, Button, Alert, message } from 'antd';
import { UploadOutlined } from '@ant-design/icons';
import { useTranslation } from 'react-i18next';
import dayjs from 'dayjs';
import { toFormData } from '@utils/apiHelpers';

/**
 * Chuyên viên tải lên giấy phép công ty đã xin với cơ quan nhà nước (R-19):
 * kiểm dịch xuất khẩu, giấy phép nhập khẩu, giấy phép quá cảnh. Giấy được tính là đã duyệt ngay.
 * @param {Object} props
 * @param {Object|null} props.item - Dòng checklist (docTypeId, docTypeName)
 * @param {boolean} props.loading
 * @param {Function} props.onCancel
 * @param {(formData: FormData) => Promise<boolean>} props.onSubmit - Trả về true khi tải lên thành công
 * @returns {JSX.Element}
 */
export default function CompanyDocumentUploadModal({ item, loading, onCancel, onSubmit }) {
  const { t } = useTranslation();
  const [form] = Form.useForm();
  const [fileList, setFileList] = useState([]);

  const handleOk = async () => {
    const values = await form.validateFields().catch(() => null);
    if (!values) return;
    const file = fileList[0]?.originFileObj || fileList[0];
    if (!file) {
      message.error(t('customerDossier.fileRequired'));
      return;
    }
    const ok = await onSubmit(
      toFormData({
        docTypeId: item.docTypeId,
        documentNumber: values.documentNumber?.trim(),
        expiryDate: values.expiryDate ? values.expiryDate.format('YYYY-MM-DD') : null,
        file,
      }),
    );
    if (ok) {
      form.resetFields();
      setFileList([]);
    }
  };

  return (
    <Modal
      title={item ? `${t('companyDocs.uploadTitle')}: ${item.docTypeName}` : ''}
      open={Boolean(item)}
      onCancel={onCancel}
      onOk={handleOk}
      confirmLoading={loading}
      okText={t('companyDocs.uploadOk')}
      destroyOnHidden
    >
      <Alert type="info" showIcon style={{ marginBottom: 16 }} message={t('companyDocs.uploadHint')} />
      <Form form={form} layout="vertical">
        <Form.Item name="documentNumber" label={t('customerDossier.documentNumber')} rules={[{ max: 100 }]}>
          <Input placeholder="GACC-IMP-2026-0457" />
        </Form.Item>
        <Form.Item name="expiryDate" label={t('customerDossier.expiryDate')}>
          <DatePicker
            style={{ width: '100%' }}
            format="DD/MM/YYYY"
            disabledDate={(d) => d && d.isBefore(dayjs(), 'day')}
          />
        </Form.Item>
        <Form.Item label={t('customerDossier.file')} required>
          <Upload
            accept=".pdf,.jpg,.jpeg,.png"
            maxCount={1}
            fileList={fileList}
            beforeUpload={() => false}
            onChange={({ fileList: next }) => setFileList(next)}
          >
            <Button icon={<UploadOutlined />}>{t('customerDossier.chooseFile')}</Button>
          </Upload>
        </Form.Item>
      </Form>
    </Modal>
  );
}
