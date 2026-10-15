/**
 * @file apiHelpers.js
 * @description Tiện ích đọc response chuẩn của backend ({ success, message, data, errors, pagination })
 */

/**
 * Lấy phần `data` từ response đã qua interceptor (interceptor trả về body).
 * @param {any} res
 * @returns {any}
 */
export function unwrapData(res) {
  if (res && typeof res === 'object' && 'data' in res && 'success' in res) {
    return res.data;
  }
  return res;
}

/**
 * Lấy mảng từ response danh sách (có hoặc không phân trang).
 * @param {any} res
 * @returns {Array<any>}
 */
export function unwrapList(res) {
  const data = unwrapData(res);
  return Array.isArray(data) ? data : [];
}

/**
 * Lấy thông báo lỗi để hiển thị cho người dùng.
 * @param {any} err - Lỗi axios đã qua interceptor
 * @param {string} [fallback]
 * @returns {string}
 */
export function getErrorMessage(err, fallback = 'Có lỗi xảy ra') {
  return err?.userMessage || err?.response?.data?.message || err?.message || fallback;
}

/**
 * Tạo FormData cho các API nhận multipart/form-data (backend trả 415 nếu gửi JSON).
 * Bỏ qua giá trị null/undefined/chuỗi rỗng; mảng được append nhiều lần cùng tên trường.
 * @param {Record<string, any>} fields
 * @returns {FormData}
 */
export function toFormData(fields) {
  const form = new FormData();
  Object.entries(fields).forEach(([key, value]) => {
    if (value === null || value === undefined || value === '') return;
    if (Array.isArray(value)) {
      value.forEach((item) => form.append(key, item));
    } else if (value instanceof Blob) {
      form.append(key, value);
    } else {
      form.append(key, String(value));
    }
  });
  return form;
}

/**
 * Đổi ngày giờ sang chuỗi ISO có múi giờ để gửi lên backend.
 * @param {any} value - dayjs | Date | string
 * @returns {string | null}
 */
export function toIsoString(value) {
  if (!value) return null;
  if (typeof value?.toISOString === 'function') return value.toISOString();
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date.toISOString();
}
