import { useState } from 'react';
import { Modal, Form, Input, Upload, Button, Alert, message } from 'antd';
import { UploadOutlined } from '@ant-design/icons';
import { useTranslation } from 'react-i18next';
import DocumentDateField from '@components/common/DocumentDateField';
import { toFormData } from '@utils/apiHelpers';
import { isPostClearance } from '@utils/fitExam';

/**
 * Chuyên viên tải lên giấy phép công ty đã xin với cơ quan nhà nước (R-19):
 * kiểm dịch xuất khẩu, giấy phép nhập khẩu, giấy phép quá cảnh. Giấy được tính là đã duyệt ngay.
 * Dùng lại để nộp hộ khách giấy khám lâm sàng (FIT_EXAM): có ô Ngày cấp bắt buộc, vẫn phải duyệt sau.
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
  const isFitExam = isPostClearance(item);

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
        issueDate: values.issueDate ? values.issueDate.format('YYYY-MM-DD') : null,
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
      title={item ? `${t(isFitExam ? 'fitExam.uploadTitle' : 'companyDocs.uploadTitle')}: ${item.docTypeName}` : ''}
      open={Boolean(item)}
      onCancel={onCancel}
      onOk={handleOk}
      confirmLoading={loading}
      okText={t('companyDocs.uploadOk')}
      destroyOnHidden
    >
      <Alert type="info" showIcon style={{ marginBottom: 16 }} message={t(isFitExam ? 'fitExam.uploadHint' : 'companyDocs.uploadHint')} />
      <Form form={form} layout="vertical">
        <Form.Item name="documentNumber" label={t('customerDossier.documentNumber')} rules={[{ max: 100 }]}>
          <Input placeholder="GACC-IMP-2026-0457" />
        </Form.Item>
        <DocumentDateField item={item} />
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
