import { useEffect, useRef, useState } from 'react';
import { Alert, Button, Col, DatePicker, Flex, Input, Modal, Row, Select, Typography, message } from 'antd';
import { CloseOutlined, PaperClipOutlined, PlusOutlined } from '@ant-design/icons';
import { useTranslation } from 'react-i18next';
import dayjs from 'dayjs';
import horseService from '@services/horseService';
import documentTypeService from '@services/documentTypeService';
import { getErrorMessage, unwrapList } from '@utils/apiHelpers';

const { Text } = Typography;

// Khớp quy định của backend cho thư mục 'documents'
const ACCEPTED_EXTENSIONS = ['.pdf', '.jpg', '.jpeg', '.png'];
const MAX_SIZE_MB = 10;

let rowSeq = 0;
const newRow = () => ({
  key: ++rowSeq,
  docTypeId: undefined,
  documentNumber: '',
  issuedBy: '',
  issueDate: null,
  expiryDate: null,
  file: null,
  error: null,
});

/**
 * Kiểm tra một dòng trước khi gửi. Trả về câu báo lỗi, hoặc null nếu hợp lệ.
 * @param {ReturnType<typeof newRow>} row
 * @param {(key: string, opts?: any) => string} t
 */
function validateRow(row, t) {
  if (!row.docTypeId) return t('horseDocs.errors.typeRequired');
  if (!row.file) return t('horseDocs.errors.fileRequired');
  if (row.issueDate && row.issueDate.isAfter(dayjs(), 'day')) return t('horseDocs.errors.issueInFuture');
  if (row.issueDate && row.expiryDate && row.expiryDate.isBefore(row.issueDate, 'day')) {
    return t('horseDocs.errors.expiryBeforeIssue');
  }
  return null;
}

/**
 * Bổ sung một hoặc nhiều hồ sơ thú y cho một con ngựa.
 * Mỗi dòng là một hồ sơ, gửi lần lượt (POST /api/horses/{id}/documents). Dòng lỗi được giữ lại kèm lý do.
 * @param {Object} props
 * @param {boolean} props.open
 * @param {{ horseId: number, name: string } | null} props.horse
 * @param {() => void} props.onClose
 * @param {(savedCount: number) => void} props.onSaved
 */
export default function AddHorseDocumentsModal({ open, horse, onClose, onSaved }) {
  const { t } = useTranslation();
  const [rows, setRows] = useState(() => [newRow()]);
  const [docTypes, setDocTypes] = useState([]);
  const [saving, setSaving] = useState(false);
  const fileInputs = useRef({});

  useEffect(() => {
    if (!open || docTypes.length > 0) return;
    documentTypeService
      .getLookup()
      .then((res) => setDocTypes(unwrapList(res)))
      .catch((err) => message.error(getErrorMessage(err, t('horseDocs.errors.loadTypes'))));
  }, [open, docTypes.length, t]);

  const updateRow = (key, patch) => {
    setRows((prev) => prev.map((r) => (r.key === key ? { ...r, ...patch, error: null } : r)));
  };

  const removeRow = (key) => {
    setRows((prev) => (prev.length > 1 ? prev.filter((r) => r.key !== key) : prev));
  };

  const handlePickFile = (key, e) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;

    const ext = file.name.slice(file.name.lastIndexOf('.')).toLowerCase();
    if (!ACCEPTED_EXTENSIONS.includes(ext)) {
      message.error(t('horseDocs.errors.fileType'));
      return;
    }
    if (file.size > MAX_SIZE_MB * 1024 * 1024) {
      message.error(t('horseDocs.errors.fileSize', { max: MAX_SIZE_MB }));
      return;
    }
    updateRow(key, { file });
  };

  const resetAndClose = () => {
    setRows([newRow()]);
    onClose();
  };

  const handleSave = async () => {
    const checked = rows.map((r) => ({ ...r, error: validateRow(r, t) }));
    if (checked.some((r) => r.error)) {
      setRows(checked);
      return;
    }

    setSaving(true);
    const failed = [];
    let savedCount = 0;
    for (const row of checked) {
      try {
        await horseService.addHorseDocument(horse.horseId, {
          docTypeId: row.docTypeId,
          documentNumber: row.documentNumber,
          issuedBy: row.issuedBy,
          issueDate: row.issueDate?.format('YYYY-MM-DD'),
          expiryDate: row.expiryDate?.format('YYYY-MM-DD'),
          file: row.file,
        });
        savedCount += 1;
      } catch (err) {
        failed.push({ ...row, error: getErrorMessage(err, t('horseDocs.errors.saveFailed')) });
      }
    }
    setSaving(false);

    if (savedCount > 0) onSaved(savedCount);
    if (failed.length === 0) {
      message.success(t('horseDocs.savedCount', { count: savedCount }));
      resetAndClose();
    } else {
      // Giữ lại các dòng chưa lưu được để người dùng sửa và lưu lại
      setRows(failed);
    }
  };

  const typeOptions = docTypes.map((d) => ({
    value: d.docTypeId,
    label: d.name || d.docTypeName,
  }));

  return (
    <Modal
      title={horse ? t('horseDocs.addTitle', { name: horse.name }) : t('horseDocs.addTitleShort')}
      open={open}
      onCancel={saving ? undefined : resetAndClose}
      width={860}
      maskClosable={false}
      footer={
        <Flex justify="space-between" align="center" wrap gap={8}>
          <Text type="secondary" style={{ fontSize: 12 }}>
            {t('horseDocs.fileHint', { max: MAX_SIZE_MB })}
          </Text>
          <Flex gap={8}>
            <Button onClick={resetAndClose} disabled={saving}>
              {t('common.cancel')}
            </Button>
            <Button
              type="primary"
              loading={saving}
              onClick={handleSave}
              style={{ backgroundColor: '#f59e0b', borderColor: '#f59e0b', fontWeight: 600 }}
            >
              {t('horseDocs.saveCount', { count: rows.length })}
            </Button>
          </Flex>
        </Flex>
      }
    >
      <Flex vertical gap={12} style={{ marginTop: 12 }}>
        {rows.map((row, index) => (
          <div
            key={row.key}
            style={{
              border: `1px solid ${row.error ? '#fca5a5' : '#e2e8f0'}`,
              borderRadius: 8,
              padding: '12px 14px',
              background: '#fff',
            }}
          >
            <Flex justify="space-between" align="center" style={{ marginBottom: 10 }}>
              <Text strong style={{ fontSize: 13 }}>
                {t('horseDocs.rowTitle', { index: index + 1 })}
              </Text>
              {rows.length > 1 && (
                <Button
                  type="text"
                  size="small"
                  icon={<CloseOutlined />}
                  onClick={() => removeRow(row.key)}
                  disabled={saving}
                  aria-label={t('horseDocs.removeRow')}
                />
              )}
            </Flex>

            <Row gutter={[12, 10]}>
              <Col xs={24} md={12}>
                <Text style={{ fontSize: 12 }}>{t('horseDocs.fields.type')} *</Text>
                <Select
                  value={row.docTypeId}
                  onChange={(value) => updateRow(row.key, { docTypeId: value })}
                  options={typeOptions}
                  placeholder={t('horseDocs.placeholders.type')}
                  style={{ width: '100%' }}
                  showSearch
                  optionFilterProp="label"
                  disabled={saving}
                />
              </Col>
              <Col xs={24} md={12}>
                <Text style={{ fontSize: 12 }}>{t('horseDocs.fields.file')} *</Text>
                <input
                  ref={(el) => {
                    fileInputs.current[row.key] = el;
                  }}
                  type="file"
                  accept={ACCEPTED_EXTENSIONS.join(',')}
                  style={{ display: 'none' }}
                  onChange={(e) => handlePickFile(row.key, e)}
                />
                <Button
                  block
                  icon={<PaperClipOutlined />}
                  onClick={() => fileInputs.current[row.key]?.click()}
                  disabled={saving}
                  style={{ textAlign: 'left', overflow: 'hidden', textOverflow: 'ellipsis' }}
                >
                  {row.file ? row.file.name : t('horseDocs.chooseFile')}
                </Button>
              </Col>
              <Col xs={24} md={12}>
                <Text style={{ fontSize: 12 }}>{t('horseDocs.fields.number')}</Text>
                <Input
                  value={row.documentNumber}
                  onChange={(e) => updateRow(row.key, { documentNumber: e.target.value })}
                  maxLength={100}
                  disabled={saving}
                />
              </Col>
              <Col xs={24} md={12}>
                <Text style={{ fontSize: 12 }}>{t('horseDocs.fields.issuedBy')}</Text>
                <Input
                  value={row.issuedBy}
                  onChange={(e) => updateRow(row.key, { issuedBy: e.target.value })}
                  placeholder={t('horseDocs.placeholders.issuedBy')}
                  maxLength={200}
                  disabled={saving}
                />
              </Col>
              <Col xs={12}>
                <Text style={{ fontSize: 12 }}>{t('horseDocs.fields.issueDate')}</Text>
                <DatePicker
                  value={row.issueDate}
                  onChange={(value) => updateRow(row.key, { issueDate: value })}
                  format="DD/MM/YYYY"
                  placeholder={t('horseDocs.placeholders.date')}
                  disabledDate={(d) => d.isAfter(dayjs(), 'day')}
                  style={{ width: '100%' }}
                  disabled={saving}
                />
              </Col>
              <Col xs={12}>
                <Text style={{ fontSize: 12 }}>{t('horseDocs.fields.expiryDate')}</Text>
                <DatePicker
                  value={row.expiryDate}
                  onChange={(value) => updateRow(row.key, { expiryDate: value })}
                  format="DD/MM/YYYY"
                  placeholder={t('horseDocs.placeholders.date')}
                  disabledDate={(d) => Boolean(row.issueDate) && d.isBefore(row.issueDate, 'day')}
                  style={{ width: '100%' }}
                  disabled={saving}
                />
              </Col>
            </Row>

            {row.error && <Alert type="error" showIcon message={row.error} style={{ marginTop: 10 }} />}
          </div>
        ))}

        <Button
          type="dashed"
          icon={<PlusOutlined />}
          onClick={() => setRows((prev) => [...prev, newRow()])}
          disabled={saving}
          block
        >
          {t('horseDocs.addRow')}
        </Button>
      </Flex>
    </Modal>
  );
}
