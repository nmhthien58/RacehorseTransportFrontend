import api from './api';
import { ENDPOINTS } from './endpoints';

/**
 * @file authService.js
 * @description Tầng Service xử lý xác thực và thông tin tài khoản người dùng
 */

export const authService = {
  /**
   * Đăng nhập người dùng bằng email và mật khẩu
   * @param {{ email: string, password: string }} credentials - Thông tin đăng nhập
   * @returns {Promise<{ token: string, user: import('../types/database').User }>} Dữ liệu phiên đăng nhập
   */
  async login(credentials) {
    return api.post(ENDPOINTS.AUTH.LOGIN, credentials);
  },

  /**
   * Lấy thông tin chi tiết của người dùng hiện tại đang đăng nhập
   * @returns {Promise<import('../types/database').User>} Thông tin người dùng
   */
  async getCurrentUser() {
    return api.get(ENDPOINTS.AUTH.ME);
  },

  /**
   * Đăng ký tài khoản mới cho khách hàng
   * @param {Object} userData - Dữ liệu đăng ký
   * @returns {Promise<any>}
   */
  async register(userData) {
    return api.post(ENDPOINTS.AUTH.REGISTER, userData);
  },

  /**
   * Đăng xuất khỏi hệ thống
   * @returns {Promise<any>}
   */
  async logout() {
    return api.post(ENDPOINTS.AUTH.LOGOUT);
  },
};

export default authService;
