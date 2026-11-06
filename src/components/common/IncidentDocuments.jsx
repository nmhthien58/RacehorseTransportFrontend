import { useState } from 'react';
import { Button, Form, Input, Modal, Popconfirm, Select, Space, Tag, Typography, Upload, message } from 'antd';
import { DeleteOutlined, FileTextOutlined, PaperClipOutlined, UploadOutlined } from '@ant-design/icons';
import { useTranslation } from 'react-i18next';
import dayjs from 'dayjs';
import incidentService from '@services/incidentService';
import { getErrorMessage } from '@utils/apiHelpers';
import { INCIDENT_DOCUMENT_TYPES, DOCUMENT_TYPE_COLOR } from '@utils/incidents';

const { Text } = Typography;


/**
 * Tài liệu của một sự cố (ảnh hiện trường, biên bản thú y, giấy chứng tử, giấy đủ sức đi tiếp).
 * Tài xế bổ sung biên bản thú y sau lúc báo SOS; điều phối đính kèm trước khi lập phương án ngựa chết / đơn nối tiếp.
 * @param {{
 *   incident: Object,
 *   canUpload?: boolean,
 *   types?: string[],
 *   defaultType?: string,
 *   currentUserId?: number,
 *   canDeleteAny?: boolean,
 *   onChanged?: () => void,
 * }} props - types: loại cho phép chọn khi tải lên; canDeleteAny: quản lý xóa được của người khác
 */
export default function IncidentDocuments({ incident, canUpload = false, types = INCIDENT_DOCUMENT_TYPES, defaultType, currentUserId, canDeleteAny = false, onChanged }) {
  const { t } = useTranslation();
  const [open, setOpen] = useState(false);
  const [fileList, setFileList] = useState([]);
  const [saving, setSaving] = useState(false);
  const [form] = Form.useForm();
  const documents = incident?.documents || [];
  // Phương án đã duyệt / đã đóng thì tài liệu giữ làm bằng chứng (backend chặn xóa)
  const locked = incident?.status === 'Approved' || incident?.status === 'Resolved';

  const handleUpload = async () => {
    let values;
    try {
      values = await form.validateFields();
    } catch {
      return;
    }
    if (fileList.length === 0) {
      message.warning(t('incidentHealth.documents.fileRequired'));
      return;
    }
    setSaving(true);
    try {
      await incidentService.uploadDocument(incident.incidentId, {
        documentType: values.documentType,
        note: values.note?.trim(),
        file: fileList[0].originFileObj || fileList[0],
      });
      message.success(t('incidentHealth.documents.uploaded'));
      setOpen(false);
      setFileList([]);
      form.resetFields();
      onChanged?.();
    } catch (err) {
      message.error(getErrorMessage(err));
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (doc) => {
    try {
      await incidentService.deleteDocument(incident.incidentId, doc.incidentDocumentId);
      message.success(t('incidentHealth.documents.deleted'));
      onChanged?.();
    } catch (err) {
      message.error(getErrorMessage(err));
    }
  };

  if (!canUpload && documents.length === 0) return null;

  return (
    <div>
      <Space size={6} wrap align="center">
        <Text type="secondary">
          <PaperClipOutlined /> {t('incidentHealth.documents.title')}:
        </Text>
        {documents.length === 0 && <Text type="secondary">{t('incidentHealth.documents.none')}</Text>}
        {canUpload && (
          <Button size="small" icon={<UploadOutlined />} onClick={() => setOpen(true)}>
            {t('incidentHealth.documents.add')}
          </Button>
        )}
      </Space>
      {documents.map((doc) => (
        <div key={doc.incidentDocumentId} style={{ fontSize: 13, marginTop: 4 }}>
          <Tag color={DOCUMENT_TYPE_COLOR[doc.documentType]}>{t(`incidentHealth.documentType.${doc.documentType}`)}</Tag>
          {doc.fileUrl ? (
            <a href={doc.fileUrl} target="_blank" rel="noopener noreferrer">
              <FileTextOutlined /> {t('incidentHealth.documents.view')}
            </a>
          ) : (
            <Text type="secondary">{t('incidentHealth.documents.noLink')}</Text>
          )}
          <Text type="secondary">
            {' '}
            · {doc.uploadedByName || '—'} · {dayjs(doc.uploadedAt).format('DD/MM HH:mm')}
          </Text>
          {doc.note && <div style={{ color: '#57534E', marginLeft: 4 }}>{doc.note}</div>}
          {!locked && (canDeleteAny || doc.uploadedByUserId === currentUserId) && (
            <Popconfirm title={t('incidentHealth.documents.deleteConfirm')} onConfirm={() => handleDelete(doc)}>
              <Button type="link" size="small" danger icon={<DeleteOutlined />} />
            </Popconfirm>
          )}
        </div>
      ))}

      <Modal
        title={t('incidentHealth.documents.modalTitle', { code: incident?.incidentCode })}
        open={open}
        onCancel={() => setOpen(false)}
        onOk={handleUpload}
        confirmLoading={saving}
        okText={t('incidentHealth.documents.upload')}
        destroyOnHidden
      >
        <Form form={form} layout="vertical" initialValues={{ documentType: defaultType || types[0] }} preserve={false}>
          <Form.Item name="documentType" label={t('incidentHealth.documents.type')} rules={[{ required: true }]}>
            <Select options={types.map((type) => ({ value: type, label: t(`incidentHealth.documentType.${type}`) }))} />
          </Form.Item>
          <Form.Item name="note" label={t('incidentHealth.documents.note')} rules={[{ max: 500 }]}>
            <Input.TextArea rows={2} placeholder={t('incidentHealth.documents.notePlaceholder')} />
          </Form.Item>
          <Form.Item label={t('incidentHealth.documents.file')} extra={t('incidentHealth.documents.fileHint')} required>
            <Upload
              maxCount={1}
              accept="image/*,.pdf"
              fileList={fileList}
              beforeUpload={(file) => {
                setFileList([file]);
                return false;
              }}
              onRemove={() => setFileList([])}
            >
              <Button icon={<UploadOutlined />}>{t('incidentHealth.documents.choose')}</Button>
            </Upload>
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
}
