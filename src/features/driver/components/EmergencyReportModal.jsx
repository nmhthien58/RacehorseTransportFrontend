import { useState } from 'react';
import { Modal, Form, Select, Radio, Input, Typography, Button, Checkbox, message } from 'antd';
import { AimOutlined } from '@ant-design/icons';
import { useTranslation } from 'react-i18next';
import { INCIDENT_TYPES, INCIDENT_SEVERITIES, formatCoordinates, mapLinkOf } from '@utils/incidents';

const { Text } = Typography;
const { TextArea } = Input;

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
      });
      if (success) {
        message.success(t('incidents.report.success'));
        form.resetFields();
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
          <Radio.Group
            optionType="button"
            options={INCIDENT_SEVERITIES.map((value) => ({ value, label: t(`incidents.severity.${value}`) }))}
          />
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
          style={{ marginBottom: 0 }}
        >
          <TextArea rows={4} placeholder={t('incidents.report.descriptionPlaceholder')} />
        </Form.Item>
      </Form>
    </Modal>
  );
}
