import api from './api';
import { ENDPOINTS } from './endpoints';

/**
 * @file authService.js
 * @description Tầng Service dùng chung xử lý xác thực và thông tin tài khoản người dùng
 */

export const authService = {
  /**
   * Đăng nhập người dùng bằng email và mật khẩu
   * @param {{ email: string, password: string }} credentials - Thông tin đăng nhập
   * @returns {Promise<{ accessToken: string, refreshToken: string, user: import('../types/database').User }>}
   */
  async login(credentials) {
    return api.post(ENDPOINTS.AUTH.LOGIN, credentials);
  },

  /**
   * Đăng ký tài khoản khách hàng mới
   * @param {{ fullName: string, email: string, password: string, phoneNumber?: string }} userData
   * @returns {Promise<any>}
   */
  async register(userData) {
    return api.post(ENDPOINTS.AUTH.REGISTER, userData);
  },

  /**
   * Đăng nhập hoặc đăng ký bằng tài khoản Google
   * @param {{ idToken?: string, email?: string, fullName?: string }} data
   * @returns {Promise<any>}
   */
  async googleLogin(data) {
    return api.post(ENDPOINTS.AUTH.GOOGLE_LOGIN, data);
  },

  /**
   * Cấp lại accessToken mới bằng refreshToken
   * @param {{ refreshToken: string }} data
   * @returns {Promise<{ accessToken: string, refreshToken: string }>}
   */
  async refreshToken(data) {
    return api.post(ENDPOINTS.AUTH.REFRESH, data);
  },

  /**
   * Lấy thông tin chi tiết của người dùng hiện tại đang đăng nhập
   * @returns {Promise<import('../types/database').User>}
   */
  async getCurrentUser() {
    return api.get(ENDPOINTS.AUTH.ME);
  },

  /**
   * Cập nhật thông tin tài khoản cá nhân
   * @param {{ fullName?: string, phoneNumber?: string }} data
   * @returns {Promise<import('../types/database').User>}
   */
  async updateProfile(data) {
    return api.put(ENDPOINTS.AUTH.UPDATE_PROFILE, data);
  },

  /**
   * Đổi mật khẩu tài khoản
   * @param {{ currentPassword: string, newPassword: string }} data
   * @returns {Promise<any>}
   */
  async changePassword(data) {
    return api.put(ENDPOINTS.AUTH.CHANGE_PASSWORD, data);
  },

  /**
   * Yêu cầu link/mã đặt lại mật khẩu về email
   * @param {{ email: string }} data
   * @returns {Promise<any>}
   */
  async forgotPassword(data) {
    return api.post(ENDPOINTS.AUTH.FORGOT_PASSWORD, data);
  },

  /**
   * Đặt lại mật khẩu mới
   * @param {{ token: string, newPassword: string }} data
   * @returns {Promise<any>}
   */
  async resetPassword(data) {
    return api.post(ENDPOINTS.AUTH.RESET_PASSWORD, data);
  },

  /**
   * Đăng xuất khỏi hệ thống
   * @param {{ refreshToken?: string }} [data]
   * @returns {Promise<any>}
   */
  async logout(data = {}) {
    return api.post(ENDPOINTS.AUTH.LOGOUT, data);
  },
};

export default authService;
