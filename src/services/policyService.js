import api from './api';
import { ENDPOINTS } from './endpoints';

/**
 * @file policyService.js
 * @description Chính sách dịch vụ công khai (BE-17): phiên bản hiện hành và các giá trị cấu hình.
 */

export const policyService = {
  /**
   * Lấy chính sách hiện hành (không cần đăng nhập)
   * @returns {Promise<{ data: { version: string, payment: Object, booking: Object, delay: Object, insurance: Object, horse: Object, delivery: Object, values: Object<string, number|string> } }>}
   */
  async getPolicy() {
    return api.get(ENDPOINTS.POLICY.PUBLIC);
  },

  /**
   * Cấu hình chính sách cho màn quản trị (nhân sự): 21 trường phẳng, ví dụ `deliveryWaitingFeePerHourUsd`
   * @returns {Promise<any>}
   */
  async getPolicySettings() {
    return api.get(ENDPOINTS.POLICY.SETTINGS);
  },

  /**
   * Manager / Admin sửa cấu hình chính sách; phải gửi đủ 21 trường (lấy từ getPolicySettings rồi sửa)
   * @param {Object} payload
   * @returns {Promise<any>}
   */
  async updatePolicySettings(payload) {
    return api.put(ENDPOINTS.POLICY.SETTINGS, payload);
  },
};

export default policyService;
