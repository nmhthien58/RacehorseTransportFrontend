import { useState } from 'react';
import { Modal, Form, Select, Input, Typography, Button, Checkbox, Upload, message } from 'antd';
import { AimOutlined, UploadOutlined } from '@ant-design/icons';
import { useTranslation } from 'react-i18next';
import { INCIDENT_TYPES, INCIDENT_SEVERITIES, SEVERITY_CONFIG, formatCoordinates, mapLinkOf } from '@utils/incidents';

const { Text } = Typography;
const { TextArea } = Input;

/**
 * Bộ chọn mức độ nghiêm trọng với dải màu trực quan (Xanh lá -> Vàng -> Cam -> Đỏ).
 * Nhận value và onChange trực tiếp từ Form.Item của Ant Design.
 */
function SeveritySelector({ value, onChange }) {
  const { t } = useTranslation();

  return (
    <div
      role="radiogroup"
      aria-label={t('incidents.fields.severity')}
      style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(4, 1fr)',
        gap: 8,
      }}
    >
      {INCIDENT_SEVERITIES.map((key) => {
        const isSelected = value === key;
        const cfg = SEVERITY_CONFIG[key] || {};

        return (
          <button
            key={key}
            type="button"
            role="radio"
            aria-checked={isSelected}
            onClick={() => onChange?.(key)}
            style={{
              cursor: 'pointer',
              borderRadius: 8,
              padding: '10px 6px',
              textAlign: 'center',
              outline: 'none',
              transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
              background: isSelected ? cfg.activeBg : '#FAFAFA',
              border: `2px solid ${isSelected ? cfg.activeBorder : cfg.border || '#E5E7EB'}`,
              boxShadow: isSelected ? `0 2px 8px ${cfg.activeBorder}33` : 'none',
              transform: isSelected ? 'translateY(-1px)' : 'none',
              userSelect: 'none',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 4,
            }}
          >
            <span
              style={{
                width: 8,
                height: 8,
                borderRadius: '50%',
                backgroundColor: cfg.dot,
                boxShadow: isSelected ? `0 0 6px ${cfg.dot}` : 'none',
                display: 'inline-block',
                transition: 'transform 0.2s ease',
                transform: isSelected ? 'scale(1.25)' : 'scale(1)',
              }}
            />
            <span
              style={{
                fontSize: 13,
                fontWeight: isSelected ? 600 : 500,
                color: isSelected ? cfg.text : '#4B5563',
                lineHeight: 1.2,
              }}
            >
              {t(`incidents.severity.${key}`)}
            </span>
          </button>
        );
      })}
    </div>
  );
}

/**
 * Modal báo sự cố trên đường của đoàn xe (POST /trips/{tripId}/incidents).
 * Chỉ báo được khi chuyến đang InTransit hoặc EmergencyRerouting.
 * @param {{
 *   open: boolean,
 *   onClose: () => void,
 *   tripId: number|string,
 *   tripCode: string,
 *   horses?: Array<any>,
 *   presetValues?: { incidentType?: string, affectedTripHorseId?: number, severity?: string, emergencyOffload?: boolean },
 *   onSubmit: (incidentData: { incidentType: string, severity: string, location: string, description: string, affectedTripHorseId?: number, emergencyOffload?: boolean }) => Promise<boolean>
 * }} props
 */
export default function EmergencyReportModal({ open, onClose, tripCode, horses = [], presetValues = null, onSubmit }) {
  const { t } = useTranslation();
  const [form] = Form.useForm();
  const [submitting, setSubmitting] = useState(false);
  const [fileList, setFileList] = useState([]);
  // Vị trí lấy từ GPS của thiết bị: 'idle' | 'locating' | 'ok' | 'error'
  const [geoStatus, setGeoStatus] = useState('idle');
  const [geoError, setGeoError] = useState('');
  const location = Form.useWatch('location', form);
  const incidentType = Form.useWatch('incidentType', form);

  /** Lấy tọa độ hiện tại của thiết bị và điền vào ô Vị trí (không cho gõ tay). */
  const locate = () => {
    if (!navigator.geolocation) {
      setGeoStatus('error');
      setGeoError(t('incidents.report.geoUnsupported'));
      return;
    }
    setGeoStatus('locating');
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        form.setFieldValue('location', formatCoordinates(pos.coords.latitude, pos.coords.longitude, pos.coords.accuracy));
        form.validateFields(['location']).catch(() => {});
        setGeoStatus('ok');
      },
      (err) => {
        setGeoStatus('error');
        setGeoError(err.code === err.PERMISSION_DENIED ? t('incidents.report.geoDenied') : t('incidents.report.geoFailed'));
      },
      { enableHighAccuracy: true, timeout: 15000, maximumAge: 0 },
    );
  };

  const handleSubmit = async () => {
    let values;
    try {
      values = await form.validateFields();
    } catch {
      return;
    }
    setSubmitting(true);
    try {
      const success = await onSubmit({
        incidentType: values.incidentType,
        severity: values.severity,
        location: values.location.trim(),
        description: values.description.trim(),
        affectedTripHorseId: values.affectedTripHorseId || undefined,
        emergencyOffload: Boolean(values.emergencyOffload),
        // Ảnh hiện trường / biên bản thú y: đính kèm vào sự cố ngay sau khi báo (POST /incidents/{id}/documents)
        attachment: fileList.length > 0
          ? { file: fileList[0].originFileObj || fileList[0], documentType: values.attachmentType || 'ScenePhoto' }
          : undefined,
      });
      if (success) {
        message.success(t('incidents.report.success'));
        form.resetFields();
        setFileList([]);
        onClose();
      }
    } finally {
      setSubmitting(false);
    }
  };

  const showEmergencyOffload = incidentType === 'EquineHealthIssue' || Boolean(presetValues?.affectedTripHorseId);

  return (
    <Modal
      title={t('incidents.report.title')}
      open={open}
      onCancel={onClose}
      onOk={handleSubmit}
      okText={t('incidents.report.submit')}
      cancelText={t('common.cancel')}
      okButtonProps={{ danger: true, loading: submitting }}
      destroyOnHidden
      width={560}
      afterOpenChange={(visible) => {
        if (visible) {
          locate();
        } else {
          setGeoStatus('idle');
          setFileList([]);
          form.resetFields();
        }
      }}
    >
      <Text type="secondary" style={{ display: 'block', marginBottom: 16 }}>
        {t('incidents.report.hint', { trip: tripCode || '' })}
      </Text>

      {/* Form tạo lại mỗi lần mở (destroyOnHidden) nên điền sẵn qua initialValues: mở từ nút "Ngựa không thể đi tiếp" */}
      <Form
        form={form}
        layout="vertical"
        requiredMark={false}
        initialValues={
          presetValues
            ? {
                incidentType: presetValues.incidentType || 'EquineHealthIssue',
                severity: presetValues.severity || 'Moderate',
                affectedTripHorseId: presetValues.affectedTripHorseId,
                emergencyOffload: Boolean(presetValues.emergencyOffload),
              }
            : { severity: 'Moderate' }
        }
      >
        <Form.Item
          name="incidentType"
          label={t('incidents.fields.type')}
          rules={[{ required: true, message: t('incidents.report.typeRequired') }]}
        >
          <Select
            placeholder={t('incidents.report.typePlaceholder')}
            options={INCIDENT_TYPES.map((value) => ({ value, label: t(`incidents.type.${value}`) }))}
          />
        </Form.Item>

        <Form.Item name="severity" label={t('incidents.fields.severity')} rules={[{ required: true }]}>
          <SeveritySelector />
        </Form.Item>

        <Form.Item
          name="location"
          label={t('incidents.fields.location')}
          rules={[{ required: true, whitespace: true, message: t('incidents.report.locationRequired') }, { max: 255 }]}
          validateStatus={geoStatus === 'error' && !location ? 'error' : undefined}
          help={geoStatus === 'error' && !location ? geoError : undefined}
          extra={
            location ? (
              <a href={mapLinkOf(location)} target="_blank" rel="noreferrer">
                {t('incidents.report.viewOnMap')}
              </a>
            ) : (
              t('incidents.report.geoHint')
            )
          }
        >
          <Input
            readOnly
            placeholder={geoStatus === 'locating' ? t('incidents.report.locating') : t('incidents.report.geoPlaceholder')}
            addonAfter={
              <Button type="link" size="small" icon={<AimOutlined />} loading={geoStatus === 'locating'} onClick={locate} style={{ padding: 0 }}>
                {t('incidents.report.locate')}
              </Button>
            }
          />
        </Form.Item>

        {horses.length > 0 && (
          <Form.Item name="affectedTripHorseId" label={t('incidents.fields.horse')}>
            <Select
              allowClear
              placeholder={t('incidents.report.horsePlaceholder')}
              options={horses.map((h) => ({ value: h.tripHorseId, label: h.horseName }))}
            />
          </Form.Item>
        )}

        {showEmergencyOffload && (
          <Form.Item name="emergencyOffload" valuePropName="checked" style={{ marginBottom: 16 }}>
            <Checkbox>
              <span style={{ color: '#DC2626', fontWeight: 500 }}>
                {t('incidents.report.emergencyOffload')}
              </span>
            </Checkbox>
          </Form.Item>
        )}

        <Form.Item
          name="description"
          label={t('incidents.fields.description')}
          rules={[
            { required: true, whitespace: true, message: t('incidents.report.descriptionRequired') },
            { max: 2000 },
          ]}
        >
          <TextArea rows={3} placeholder={t('incidents.report.descriptionPlaceholder')} />
        </Form.Item>

        <Form.Item name="attachmentType" label={t('incidentHealth.report.attachmentType')} initialValue="ScenePhoto">
          <Select
            options={['ScenePhoto', 'VetReport'].map((value) => ({ value, label: t(`incidentHealth.documentType.${value}`) }))}
          />
        </Form.Item>
        <Form.Item
          label={t('incidentHealth.report.attachment')}
          extra={t('incidentHealth.report.attachmentHint')}
          style={{ marginBottom: 0 }}
        >
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
            <Button icon={<UploadOutlined />}>
              {t('incidentHealth.report.chooseAttachment')}
            </Button>
          </Upload>
        </Form.Item>
      </Form>
    </Modal>
  );
}
