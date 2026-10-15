import { useEffect, useState } from 'react';
import { Modal, Checkbox, Select, Form, Input, InputNumber, DatePicker, Button, Typography, Spin, Tag, Row, Col, message } from 'antd';
import { PlusOutlined, DeleteOutlined } from '@ant-design/icons';
import { useTranslation } from 'react-i18next';
import dayjs from 'dayjs';
import tripService from '@services/tripService';
import incidentService from '@services/incidentService';
import { unwrapData, getErrorMessage, toIsoString } from '@utils/apiHelpers';

const { Text } = Typography;

/**
 * Nắn tuyến cho chuyến có sự cố đã được duyệt (POST /incidents/{id}/apply-reroute):
 * bỏ các mốc chưa tới và/hoặc chèn mốc mới (RestStop, BorderGate) theo đúng thứ tự đi.
 * @param {{ open: boolean, incident: Object|null, onClose: () => void, onDone: () => void }} props
 */
export default function RerouteModal({ open, incident, onClose, onDone }) {
  const { t } = useTranslation();
  const [form] = Form.useForm();
  const [trip, setTrip] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!open || !incident) return undefined;
    let active = true;
    tripService
      .getTripById(incident.tripId)
      .then((res) => active && setTrip(unwrapData(res)))
      .catch((err) => message.error(getErrorMessage(err)));
    return () => {
      active = false;
    };
  }, [open, incident]);

  // Đang tải khi chưa có chi tiết đúng chuyến của sự cố đang mở
  const loading = Boolean(incident) && trip?.tripId !== incident.tripId;
  const checkpoints = (trip?.checkpoints || []).filter((c) => c.isActive !== false).sort((a, b) => a.sequenceOrder - b.sequenceOrder);
  // Chỉ bỏ được mốc chưa tới, không phải điểm đi / điểm giao
  const removable = (c) => c.status === 'Pending' && c.checkpointType !== 'Origin' && c.checkpointType !== 'Destination';

  const handleSubmit = async () => {
    let values;
    try {
      values = await form.validateFields();
    } catch {
      return;
    }
    const deactivateCheckpointIds = values.deactivateCheckpointIds || [];
    const newCheckpoints = (values.newCheckpoints || []).map((c) => ({
      checkpointName: c.checkpointName.trim(),
      checkpointType: c.checkpointType,
      address: c.address?.trim() || '',
      plannedTime: toIsoString(c.plannedTime),
      mandatoryRestMinutes: c.mandatoryRestMinutes || 0,
    }));
    if (deactivateCheckpointIds.length === 0 && newCheckpoints.length === 0) {
      message.warning(t('incidents.reroute.nothing'));
      return;
    }
    setSubmitting(true);
    try {
      await incidentService.applyReroute(incident.incidentId, {
        deactivateCheckpointIds,
        newCheckpoints,
        insertAfterCheckpointId: values.insertAfterCheckpointId || undefined,
      });
      message.success(t('incidents.reroute.success'));
      form.resetFields();
      onDone();
    } catch (err) {
      message.error(getErrorMessage(err));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Modal
      title={t('incidents.reroute.title', { trip: incident?.tripCode || '' })}
      open={open}
      onCancel={onClose}
      onOk={handleSubmit}
      okText={t('incidents.reroute.submit')}
      cancelText={t('common.cancel')}
      confirmLoading={submitting}
      width={760}
      destroyOnHidden
    >
      {loading ? (
        <div style={{ textAlign: 'center', padding: 40 }}>
          <Spin />
        </div>
      ) : (
        <Form form={form} layout="vertical" requiredMark={false}>
          <Text strong>{t('incidents.reroute.currentRoute')}</Text>
          <Form.Item name="deactivateCheckpointIds" style={{ marginTop: 8 }} extra={t('incidents.reroute.removeHint')}>
            <Checkbox.Group style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              {checkpoints.map((c) => (
                <Checkbox key={c.checkpointId} value={c.checkpointId} disabled={!removable(c)}>
                  {c.sequenceOrder}. {c.checkpointName}{' '}
                  <Text type="secondary" style={{ fontSize: 12 }}>
                    · {dayjs(c.plannedTime).format('DD/MM HH:mm')}
                  </Text>{' '}
                  <Tag style={{ marginLeft: 4 }}>{t(`status.${c.status.charAt(0).toLowerCase()}${c.status.slice(1)}`, c.status)}</Tag>
                </Checkbox>
              ))}
            </Checkbox.Group>
          </Form.Item>

          <Form.Item name="insertAfterCheckpointId" label={t('incidents.reroute.insertAfter')} extra={t('incidents.reroute.insertAfterHint')}>
            <Select
              allowClear
              options={checkpoints
                .filter((c) => c.checkpointType !== 'Destination')
                .map((c) => ({ value: c.checkpointId, label: `${c.sequenceOrder}. ${c.checkpointName}` }))}
            />
          </Form.Item>

          <Text strong>{t('incidents.reroute.newStops')}</Text>
          <Form.List name="newCheckpoints">
            {(fields, { add, remove }) => (
              <div style={{ marginTop: 8 }}>
                {fields.map((field) => (
                  <div key={field.key} style={{ border: '1px solid #F0F0F0', borderRadius: 8, padding: '12px 12px 0', marginBottom: 10 }}>
                    <Row gutter={12}>
                      <Col xs={24} md={10}>
                        <Form.Item
                          name={[field.name, 'checkpointName']}
                          label={t('incidents.reroute.stopName')}
                          rules={[{ required: true, whitespace: true, message: t('handover.form.required') }]}
                        >
                          <Input />
                        </Form.Item>
                      </Col>
                      <Col xs={12} md={6}>
                        <Form.Item name={[field.name, 'checkpointType']} label={t('incidents.reroute.stopType')} initialValue="RestStop">
                          <Select
                            options={['RestStop', 'BorderGate'].map((value) => ({ value, label: t(`incidents.reroute.type.${value}`) }))}
                          />
                        </Form.Item>
                      </Col>
                      <Col xs={12} md={8}>
                        <Form.Item
                          name={[field.name, 'plannedTime']}
                          label={t('incidents.reroute.plannedTime')}
                          rules={[{ required: true, message: t('handover.form.required') }]}
                        >
                          <DatePicker showTime={{ format: 'HH:mm' }} format="DD/MM/YYYY HH:mm" style={{ width: '100%' }} />
                        </Form.Item>
                      </Col>
                      <Col xs={24} md={14}>
                        <Form.Item name={[field.name, 'address']} label={t('incidents.reroute.address')}>
                          <Input />
                        </Form.Item>
                      </Col>
                      <Col xs={18} md={8}>
                        <Form.Item name={[field.name, 'mandatoryRestMinutes']} label={t('incidents.reroute.rest')} initialValue={0}>
                          <InputNumber min={0} style={{ width: '100%' }} />
                        </Form.Item>
                      </Col>
                      <Col xs={6} md={2} style={{ display: 'flex', alignItems: 'center', paddingTop: 6 }}>
                        <Button type="text" danger icon={<DeleteOutlined />} onClick={() => remove(field.name)} />
                      </Col>
                    </Row>
                  </div>
                ))}
                <Button type="dashed" block icon={<PlusOutlined />} onClick={() => add()}>
                  {t('incidents.reroute.addStop')}
                </Button>
              </div>
            )}
          </Form.List>
        </Form>
      )}
    </Modal>
  );
}
