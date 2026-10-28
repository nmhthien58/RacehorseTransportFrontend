// Đang tạo utils/recipient.js vì các hàm tiện ích kiểm tra thông tin người nhận theo FE-13
export const PHONE_REGEX = /^\+?[0-9 .()-]{6,20}$/;

/**
 * Kiểm tra tính hợp lệ của người nhận ngựa
 * @param {{ isCustomer?: boolean, name?: string, phone?: string }} recipient
 * @returns {boolean}
 */
export function isRecipientValid(recipient) {
  if (!recipient) return false;
  if (recipient.isCustomer) return true;
  return Boolean(
    recipient.name &&
    recipient.name.trim() &&
    recipient.phone &&
    PHONE_REGEX.test(recipient.phone.trim())
  );
}
