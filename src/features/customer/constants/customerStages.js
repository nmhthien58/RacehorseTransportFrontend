/**
 * Giai đoạn của đơn theo góc nhìn khách (R-07) — backend trả ở trường `customerStage` của GET /bookings và GET /bookings/{id}.
 * Thứ tự dưới đây là thứ tự tab trên màn "Đơn vận chuyển".
 */
export const CUSTOMER_STAGES = [
  'PendingReview',
  'AwaitingDeposit',
  'PreparingDossier',
  'AwaitingTrip',
  'Scheduled',
  'AwaitingPayment',
  'InTransit',
  'AwaitingHandover',
  'Completed',
  'Closed',
];

/** Màu Tag của từng giai đoạn */
export const CUSTOMER_STAGE_COLOR = {
  PendingReview: 'gold',
  AwaitingDeposit: 'orange',
  PreparingDossier: 'blue',
  AwaitingTrip: 'geekblue',
  Scheduled: 'cyan',
  AwaitingPayment: 'volcano',
  InTransit: 'purple',
  AwaitingHandover: 'magenta',
  Completed: 'green',
  Closed: 'default',
};

/** Các giai đoạn khách cần làm gì đó (đặt cọc, trả tiền) */
export const CUSTOMER_ACTION_STAGES = ['AwaitingDeposit', 'AwaitingPayment'];

/**
 * Các bước trên timeline dọc của chi tiết đơn, theo thứ tự đi.
 * Giai đoạn AwaitingPayment trước khi chạy nằm ở bước "balance"; sau khi giao (phí phát sinh) thì ở bước "done".
 */
export const TIMELINE_STEPS = ['review', 'deposit', 'dossier', 'planning', 'balance', 'ready', 'transit', 'handover', 'done'];

/**
 * Bước hiện tại trên timeline từ giai đoạn và trạng thái đơn.
 * @param {string} stage - customerStage
 * @param {string} status - trạng thái đơn
 * @returns {string} một phần tử của TIMELINE_STEPS
 */
export function currentTimelineStep(stage, status) {
  switch (stage) {
    case 'PendingReview':
      return 'review';
    case 'AwaitingDeposit':
      return 'deposit';
    case 'PreparingDossier':
      return 'dossier';
    case 'AwaitingTrip':
      return 'planning';
    case 'AwaitingPayment':
      return status === 'AwaitingFinalPayment' || status === 'Completed' ? 'done' : 'balance';
    case 'Scheduled':
      return 'ready';
    case 'InTransit':
      return 'transit';
    case 'AwaitingHandover':
      return 'handover';
    default:
      return 'done';
  }
}
