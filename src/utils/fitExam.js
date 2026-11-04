import dayjs from 'dayjs';

// Mã loại giấy khám lâm sàng đủ sức khỏe (nộp sau khi hồ sơ đã thông quan)
export const FIT_EXAM_CODE = 'FIT_EXAM';

// Trạng thái hồ sơ vẫn nhận giấy khám: mở nhận giấy + đã nộp cơ quan + đã thông quan
const FIT_EXAM_OPEN_STATUSES = ['Draft', 'AwaitingDocs', 'Reviewing', 'SubmittedToAuthorities', 'Cleared'];

/**
 * Dòng checklist có phải giấy nộp sau thông quan không.
 * Backend cũ chưa trả postClearance thì suy ra từ docTypeCode.
 * @param {Object} item - Dòng checklist của hồ sơ
 * @returns {boolean}
 */
export function isPostClearance(item) {
  if (!item) return false;
  if (typeof item.postClearance === 'boolean') return item.postClearance;
  return item.docTypeCode === FIT_EXAM_CODE;
}

/**
 * Backend có trả khoảng khám 48 giờ không (trường có mặt trong response, kể cả null).
 * @param {Object} item
 * @returns {boolean}
 */
export function hasExamWindowField(item) {
  return Boolean(item) && 'examWindowStart' in item;
}

/**
 * Định dạng khoảng khám "DD/MM HH:mm – DD/MM HH:mm"; null khi chưa có chuyến.
 * @param {Object} item
 * @returns {string|null}
 */
export function formatExamWindow(item) {
  if (!item?.examWindowStart || !item?.examWindowEnd) return null;
  return `${dayjs(item.examWindowStart).format('DD/MM HH:mm')} – ${dayjs(item.examWindowEnd).format('DD/MM HH:mm')}`;
}

/**
 * Hồ sơ ở trạng thái còn nhận giấy khám không.
 * @param {string} [status]
 * @returns {boolean}
 */
export function isOpenForFitExam(status) {
  return FIT_EXAM_OPEN_STATUSES.includes(status);
}

/**
 * Ngày cấp nằm ngoài khoảng khám (để chặn chọn trong DatePicker).
 * Không có khoảng khám thì chỉ chặn ngày tương lai.
 * @param {import('dayjs').Dayjs} d
 * @param {Object} item
 * @returns {boolean}
 */
export function isIssueDateDisabled(d, item) {
  if (!d) return false;
  if (item?.examWindowStart && item?.examWindowEnd) {
    return d.isBefore(dayjs(item.examWindowStart), 'day') || d.isAfter(dayjs(item.examWindowEnd), 'day');
  }
  return d.isAfter(dayjs(), 'day');
}
