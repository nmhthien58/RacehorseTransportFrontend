// Đang tạo DeliveryFailedModal vì đoàn xe cần ghi nhận "Không giao được" tại điểm giao thay cho e-POD (FE-14, R-16)
import { useEffect, useState } from 'react';
import { Alert, Descriptions, Flex, Form, Input, Modal, Radio, Typography, Upload, message } from 'antd';
import { CameraOutlined } from '@ant-design/icons';
import { useTranslation } from 'react-i18next';
import dayjs from 'dayjs';
import usePolicy from '@hooks/usePolicy';
import deliveryFailureService from '@services/deliveryFailureService';
import fileService from '@services/fileService';
import { unwrapData, getErrorMessage } from '@utils/apiHelpers';

const { Text } = Typography;
const REASONS = ['RecipientAbsent', 'RecipientRefused', 'RefusedInjured', 'RefusedWrongHorse'];
// Lỗi công ty: bắt buộc ảnh làm bằng chứng (Chính sách 10.5)
const PHOTO_REQUIRED_REASONS = ['RefusedInjured', 'RefusedWrongHorse'];
const CUSTOMER_FAULT_REASONS = ['RecipientAbsent', 'RecipientRefused'];
const MAX_PHOTOS = 10;
const formatTime = (value) => (value ? dayjs(value).format('DD/MM/YYYY HH:mm') : '—');

/**
 * Ước tính phí chờ giống backend (Chính sách 10.4): miễn phí `freeHours` đầu, phần giờ chưa đủ làm tròn lên,
 * tối đa `maxHours`; chỉ tính khi xe tới đúng hoặc sau đầu khung giờ đã báo người nhận.
 * @returns {{ waitedMinutes: number, feeApplies: boolean, feeStartAt: dayjs.Dayjs|null, chargeableHours: number }}
 */
function estimateWaiting(arrivedAt, windowStart, now, freeHours, maxHours) {
  if (!arrivedAt) return { waitedMinutes: 0, feeApplies: false, feeStartAt: null, chargeableHours: 0 };
  const arrived = dayjs(arrivedAt);
  const waitedMinutes = Math.max(0, dayjs(now).diff(arrived, 'minute'));
  const feeApplies = Boolean(windowStart) && !arrived.isBefore(dayjs(windowStart));
  const overMinutes = waitedMinutes - freeHours * 60;
  const chargeableHours = feeApplies && overMinutes > 0 ? Math.min(Math.ceil(overMinutes / 60), maxHours) : 0;
  return { waitedMinutes, feeApplies, feeStartAt: arrived.add(freeHours, 'hour'), chargeableHours };
}

/**
 * Hộp "Không giao được" của đoàn xe ở điểm giao: lý do, ghi chú, ảnh (bắt buộc khi từ chối vì ngựa bị thương / nhầm ngựa),
 * số giờ đã chờ từ lúc check-in điểm giao và mốc bắt đầu tính phí chờ.
 *
 * @param {{
 *   open: boolean, onClose: () => void, onRecorded?: (failure: Object) => void,
 *   tripId: number|string, booking?: Object, arrivedAt?: string, notifiedWindowStart?: string
 * }} props
 * @returns {JSX.Element}
 */
export default function DeliveryFailedModal({ open, onClose, onRecorded, tripId, booking, arrivedAt, notifiedWindowStart }) {
  const { t } = useTranslation();
  const { policy } = usePolicy();
  const [form] = Form.useForm();
  const reason = Form.useWatch('reason', form);
  const [photos, setPhotos] = useState([]);
  const [submitting, setSubmitting] = useState(false);
  const [now, setNow] = useState(() => new Date());

  // Đồng hồ chờ chạy theo phút khi hộp đang mở
  useEffect(() => {
    if (!open) return undefined;
    const tick = () => setNow(new Date());
    tick();
    const timer = setInterval(tick, 30000);
    return () => clearInterval(timer);
  }, [open]);

  const freeHours = Number(policy?.delivery?.freeWaitingHours ?? 2);
  const maxHours = Number(policy?.delivery?.maxWaitingHours ?? 24);
  const feePerHour = Number(policy?.delivery?.waitingFeePerHourUsd ?? 40);
  const waiting = estimateWaiting(arrivedAt, notifiedWindowStart, now, freeHours, maxHours);
  const photoRequired = PHOTO_REQUIRED_REASONS.includes(reason);
  const customerFault = CUSTOMER_FAULT_REASONS.includes(reason);

  const handleClose = () => {
    form.resetFields();
    setPhotos([]);
    onClose?.();
  };

  const handleSubmit = async () => {
    let values;
    try {
      values = await form.validateFields();
    } catch {
      return;
    }
    if (photoRequired && photos.length === 0) {
      message.error(t('deliveryFailed.photoRequired'));
      return;
    }
    setSubmitting(true);
    try {
      const uploaded = await Promise.all(photos.map((p) => fileService.upload(p.originFileObj || p, 'welfare').then(unwrapData)));
      const failure = unwrapData(
        await deliveryFailureService.record(tripId, booking.bookingId, {
          reason: values.reason,
          note: values.note?.trim() || undefined,
          photoPaths: uploaded.map((u) => u.path),
        }),
      );
      message.success(t('deliveryFailed.recorded', { code: booking.bookingCode }));
      form.resetFields();
      setPhotos([]);
      onRecorded?.(failure);
    } catch (err) {
      message.error(getErrorMessage(err, t('deliveryFailed.recordFailed')));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Modal
      open={open}
      title={t('deliveryFailed.title', { code: booking?.bookingCode || '' })}
      okText={t('deliveryFailed.submit')}
      okButtonProps={{ danger: true, loading: submitting }}
      cancelText={t('common.cancel')}
      onOk={handleSubmit}
      onCancel={handleClose}
      destroyOnHidden
    >
      <Descriptions size="small" column={1} style={{ marginBottom: 12 }}>
        <Descriptions.Item label={t('deliveryFailed.arrivedAt')}>{formatTime(arrivedAt)}</Descriptions.Item>
        <Descriptions.Item label={t('deliveryFailed.waited')}>
          {t('deliveryFailed.duration', { hours: Math.floor(waiting.waitedMinutes / 60), minutes: waiting.waitedMinutes % 60 })}
        </Descriptions.Item>
        <Descriptions.Item label={t('deliveryFailed.feeStart')}>
          {waiting.feeApplies ? formatTime(waiting.feeStartAt) : <Text type="secondary">{t('deliveryFailed.noFeeEarly')}</Text>}
        </Descriptions.Item>
      </Descriptions>
      {customerFault && waiting.chargeableHours > 0 && (
        <Alert
          type="warning"
          showIcon
          style={{ marginBottom: 12 }}
          title={t('deliveryFailed.feeEstimate', {
            hours: waiting.chargeableHours,
            fee: feePerHour,
            total: waiting.chargeableHours * feePerHour,
          })}
        />
      )}

      <Form form={form} layout="vertical" requiredMark={false}>
        <Form.Item name="reason" label={t('deliveryFailed.reasonLabel')} rules={[{ required: true, message: t('deliveryFailed.reasonRequired') }]}>
          <Radio.Group style={{ width: '100%' }}>
            <Flex vertical gap={8}>
              {REASONS.map((r) => (
                <Radio key={r} value={r}>
                  {t(`deliveryFailed.reason.${r}`)}
                  <div style={{ fontSize: 12, color: '#6B7280' }}>{t(`deliveryFailed.reasonHint.${r}`)}</div>
                </Radio>
              ))}
            </Flex>
          </Radio.Group>
        </Form.Item>
        <Form.Item name="note" label={t('deliveryFailed.note')} rules={[{ max: 1000 }]}>
          <Input.TextArea rows={3} placeholder={t('deliveryFailed.notePlaceholder')} />
        </Form.Item>
        <Form.Item label={photoRequired ? t('deliveryFailed.photosRequired') : t('deliveryFailed.photos')} required={photoRequired}>
          <Upload
            listType="picture-card"
            accept="image/*"
            capture="environment"
            multiple
            maxCount={MAX_PHOTOS}
            fileList={photos}
            beforeUpload={() => false}
            onChange={({ fileList }) => setPhotos(fileList.slice(0, MAX_PHOTOS))}
          >
            {photos.length < MAX_PHOTOS && (
              <div>
                <CameraOutlined />
                <div style={{ marginTop: 4, fontSize: 12 }}>{t('deliveryFailed.addPhoto')}</div>
              </div>
            )}
          </Upload>
        </Form.Item>
      </Form>
    </Modal>
  );
}
