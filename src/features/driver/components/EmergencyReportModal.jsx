import { useState } from 'react';
import { Modal, Form, Select, Radio, Input, Typography, message } from 'antd';
import { useTranslation } from 'react-i18next';
import { INCIDENT_TYPES, INCIDENT_SEVERITIES } from '@utils/incidents';

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
 *   onSubmit: (incidentData: { incidentType: string, severity: string, location: string, description: string, affectedTripHorseId?: number }) => Promise<boolean>
 * }} props
 */
export default function EmergencyReportModal({ open, onClose, tripCode, horses = [], onSubmit }) {
  const { t } = useTranslation();
  const [form] = Form.useForm();
  const [submitting, setSubmitting] = useState(false);

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
    >
      <Text type="secondary" style={{ display: 'block', marginBottom: 16 }}>
        {t('incidents.report.hint', { trip: tripCode || '' })}
      </Text>

      <Form form={form} layout="vertical" requiredMark={false} initialValues={{ severity: 'Moderate' }}>
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
          rules={[
            { required: true, whitespace: true, message: t('incidents.report.locationRequired') },
            { max: 255 },
          ]}
        >
          <Input placeholder={t('incidents.report.locationPlaceholder')} />
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
