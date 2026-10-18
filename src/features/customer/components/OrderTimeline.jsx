import { Alert, Steps } from 'antd';
import { useTranslation } from 'react-i18next';
import dayjs from 'dayjs';
import { TIMELINE_STEPS, currentTimelineStep } from '@features/customer/constants/customerStages';

const formatTime = (value) => (value ? dayjs(value).format('DD/MM/YYYY HH:mm') : null);

/**
 * Mốc thời gian / thông tin phụ của từng bước, lấy từ chi tiết đơn (GET /bookings/{id}).
 * @param {Object} booking
 * @param {(key: string, opts?: Object) => string} t
 * @returns {Record<string, string|null>}
 */
function stepDetails(booking, t) {
  const payments = booking.payment?.payments || [];
  const paidAt = (type) =>
    payments
      .filter((p) => p.paymentType === type && p.status === 'Succeeded' && p.paidAt)
      .map((p) => p.paidAt)
      .sort()[0];
  const horses = (booking.horses || []).filter((h) => h.status !== 'Cancelled');
  const cleared = horses.filter((h) => h.dossierStatus === 'Cleared').length;
  const trips = horses.flatMap((h) => h.trips || []).filter((tr) => tr.tripStatus !== 'Cancelled');
  const tripCodes = [...new Set(trips.map((tr) => tr.tripCode))];
  const firstStart = trips.map((tr) => tr.plannedStartDate).sort()[0];
  const pickedUp = trips.map((tr) => tr.pickedUpAt).filter(Boolean).sort()[0];
  const delivered = trips.map((tr) => tr.deliveredAt).filter(Boolean).sort().reverse()[0];

  return {
    review: booking.reviewedAt
      ? t('customerOrders.timeline.reviewedAt', { time: formatTime(booking.reviewedAt) })
      : t('customerOrders.timeline.createdAt', { time: formatTime(booking.createdAt) }),
    deposit: paidAt('Deposit') ? t('customerOrders.timeline.paidAt', { time: formatTime(paidAt('Deposit')) }) : null,
    dossier: horses.length ? t('customerOrders.timeline.dossierProgress', { cleared, total: horses.length }) : null,
    planning: tripCodes.length ? tripCodes.join(', ') : null,
    balance: paidAt('Balance')
      ? t('customerOrders.timeline.paidAt', { time: formatTime(paidAt('Balance')) })
      : booking.payment?.paymentRequired && booking.payment?.balanceDueAt
        ? t('customerOrders.timeline.dueAt', { time: formatTime(booking.payment.balanceDueAt) })
        : null,
    ready: firstStart ? t('customerOrders.timeline.departureAt', { time: formatTime(firstStart) }) : null,
    transit: pickedUp ? t('customerOrders.timeline.pickedUpAt', { time: formatTime(pickedUp) }) : null,
    handover: delivered ? t('customerOrders.timeline.deliveredAt', { time: formatTime(delivered) }) : null,
    done: null,
  };
}

/**
 * Timeline dọc tiến trình một đơn (R-07): chờ duyệt → đặt cọc → hồ sơ → xếp chuyến → trả phần còn lại →
 * chờ khởi hành → vận chuyển → ký nhận → hoàn thành. Đơn bị từ chối / hủy / quá hạn hiện thông báo thay cho timeline.
 *
 * @param {Object} props
 * @param {Object} props.booking - Chi tiết đơn từ GET /bookings/{id} (có customerStage)
 * @returns {JSX.Element}
 */
export default function OrderTimeline({ booking }) {
  const { t } = useTranslation();
  const stage = booking.customerStage;

  if (stage === 'Closed') {
    return (
      <Alert
        type="warning"
        showIcon
        message={t(`customerOrders.timeline.closedTitle.${booking.status}`, booking.status)}
        description={booking.rejectionReason || t('customerOrders.timeline.closed')}
      />
    );
  }

  const current = TIMELINE_STEPS.indexOf(currentTimelineStep(stage, booking.status));
  const details = stepDetails(booking, t);
  const isFinished = stage === 'Completed';

  return (
    <Steps
      direction="vertical"
      size="small"
      current={current}
      status={isFinished ? 'finish' : 'process'}
      items={TIMELINE_STEPS.map((step, idx) => ({
        title: t(`customerOrders.timeline.steps.${step}`),
        description:
          idx === current && !isFinished
            ? [t(`customerOrders.timeline.now.${stage}`, ''), details[step]].filter(Boolean).join(' · ')
            : idx <= current
              ? details[step]
              : null,
      }))}
    />
  );
}
