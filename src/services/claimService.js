// Đang tạo claimService vì kết nối API bồi thường bảo hiểm FE-11 (R-13, BE-12)
import api from './api';
import { ENDPOINTS } from './endpoints';

/**
 * @file claimService.js
 * @description Tầng Service quản lý hồ sơ bồi thường bảo hiểm ngựa đua (R-13, BE-12)
 */

export const claimService = {
  /**
   * Lấy danh sách hồ sơ bồi thường bảo hiểm
   * @param {{ status?: string, bookingId?: number }} [params]
   * @returns {Promise<Array<any>>}
   */
  async list(params) {
    return api.get(ENDPOINTS.CLAIMS.LIST, { params });
  },

  /**
   * Lấy chi tiết một hồ sơ bồi thường
   * @param {number|string} id
   * @returns {Promise<any>}
   */
  async getById(id) {
    return api.get(ENDPOINTS.CLAIMS.DETAIL(id));
  },

  /**
   * Khách hàng nộp hồ sơ yêu cầu bồi thường bảo hiểm cho ngựa trong 24 giờ sau e-POD
   * @param {number|string} bookingId
   * @param {{ bookingHorseId: number, claimType: 'Death'|'Injury'|'Loss', requestedAmount: number, description?: string, evidenceUrls?: string[] }} payload
   * @returns {Promise<any>}
   */
  async createClaim(bookingId, payload) {
    return api.post(ENDPOINTS.CLAIMS.CREATE(bookingId), payload);
  },

  /**
   * Tải chứng từ bổ sung (biên bản thú y, hóa đơn điều trị, ảnh...) cho hồ sơ
   * @param {number|string} id
   * @param {FormData} formData
   * @returns {Promise<any>}
   */
  async uploadEvidence(id, formData) {
    return api.post(ENDPOINTS.CLAIMS.EVIDENCE(id), formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
  },

  /**
   * Manager chuyển hồ sơ sang trạng thái đang thẩm định
   * @param {number|string} id
   * @returns {Promise<any>}
   */
  async reviewClaim(id) {
    return api.post(ENDPOINTS.CLAIMS.REVIEW(id));
  },

  /**
   * Manager phê duyệt bồi thường (số tiền <= trần theo gói bảo hiểm)
   * @param {number|string} id
   * @param {{ approvedAmount: number, note?: string }} payload
   * @returns {Promise<any>}
   */
  async approveClaim(id, payload) {
    return api.post(ENDPOINTS.CLAIMS.APPROVE(id), payload);
  },

  /**
   * Manager từ chối bồi thường theo điều khoản loại trừ
   * @param {number|string} id
   * @param {{ reason: string }} payload
   * @returns {Promise<any>}
   */
  async rejectClaim(id, payload) {
    return api.post(ENDPOINTS.CLAIMS.REJECT(id), payload);
  },

  /**
   * Manager ghi nhận đã chi trả tiền bồi thường (chuyển khoản ngoài hoặc cổng)
   * @param {number|string} id
   * @param {{ reference: string, note?: string }} payload
   * @returns {Promise<any>}
   */
  async markPaid(id, payload) {
    return api.post(ENDPOINTS.CLAIMS.PAY(id), payload);
  },
};

export default claimService;
