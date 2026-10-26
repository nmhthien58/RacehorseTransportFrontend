import { useEffect, useState } from 'react';
import { Modal, Form, Spin, message } from 'antd';
import { useTranslation } from 'react-i18next';
import tripService from '@services/tripService';
import incidentService from '@services/incidentService';
import { unwrapData, getErrorMessage } from '@utils/apiHelpers';
import { toRouteChangePayload } from '@utils/incidents';
import RouteChangeFields from './RouteChangeFields';

/**
 * Điều chỉnh tuyến thêm cho chuyến có sự cố đã được duyệt (POST /incidents/{id}/apply-reroute):
 * bỏ các mốc chưa tới và/hoặc chèn mốc mới (RestStop, BorderGate) theo đúng thứ tự đi.
 * Thay đổi tuyến chính nằm trong phương án và được áp khi Manager duyệt; modal này dùng khi cần sửa thêm.
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

  const handleSubmit = async () => {
    let values;
    try {
      values = await form.validateFields();
    } catch {
      return;
    }
    const payload = toRouteChangePayload(values);
    if (!payload) {
      message.warning(t('incidents.reroute.nothing'));
      return;
    }
    setSubmitting(true);
    try {
      await incidentService.applyReroute(incident.incidentId, payload);
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
          <RouteChangeFields checkpoints={checkpoints} />
        </Form>
      )}
    </Modal>
  );
}
