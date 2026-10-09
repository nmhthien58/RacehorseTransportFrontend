import api from './api';
import { ENDPOINTS } from './endpoints';

/**
 * @file userService.js
 * @description Tầng Service xử lý danh mục tài khoản người dùng và dropdown nhân sự (Admin & Manager)
 */

export const userService = {
  /**
   * Lấy danh sách tài khoản trong hệ thống
   * @param {{ role?: string, isActive?: boolean, search?: string, sort?: string, page?: number, size?: number }} [params]
   * @returns {Promise<{ data: import('../types/database').User[], pagination?: any }>}
   */
  async getUsers(params) {
    return api.get(ENDPOINTS.USERS.LIST, { params });
  },

  /**
   * Xem chi tiết một tài khoản
   * @param {number|string} id - UserID
   * @returns {Promise<import('../types/database').User>}
   */
  async getUserById(id) {
    return api.get(ENDPOINTS.USERS.DETAIL(id));
  },

  /**
   * Tạo tài khoản nhân sự mới (Admin)
   * @param {{ fullName: string, email: string, password: string, role: string, phoneNumber?: string }} userData
   * @returns {Promise<import('../types/database').User>}
   */
  async createUser(userData) {
    return api.post(ENDPOINTS.USERS.CREATE, userData);
  },

  /**
   * Cập nhật thông tin tài khoản nhân sự
   * @param {number|string} id - UserID
   * @param {{ fullName?: string, email?: string, role?: string, phoneNumber?: string }} userData
   * @returns {Promise<import('../types/database').User>}
   */
  async updateUser(id, userData) {
    return api.put(ENDPOINTS.USERS.UPDATE(id), userData);
  },

  /**
   * Khóa hoặc kích hoạt lại tài khoản
   * @param {number|string} id - UserID
   * @param {boolean} isActive
   * @returns {Promise<any>}
   */
  async setUserActive(id, isActive) {
    return api.patch(ENDPOINTS.USERS.SET_ACTIVE(id), { isActive });
  },

  /**
   * Đặt lại mật khẩu cho tài khoản nhân sự (Admin)
   * @param {number|string} id - UserID
   * @param {string} newPassword
   * @returns {Promise<any>}
   */
  async resetUserPassword(id, newPassword) {
    return api.put(ENDPOINTS.USERS.RESET_PASSWORD(id), { newPassword });
  },

  /**
   * Lấy danh sách nhân sự rút gọn phục vụ chọn trong dropdown
   * @param {string} [role] - Lọc theo role (TransportSpecialist, FleetCoordinator, DriverEscort, ...)
   * @returns {Promise<Array<{ userId: number, fullName: string, email: string, role: string }>>}
   */
  async getStaff(role) {
    const params = role ? { role } : undefined;
    return api.get(ENDPOINTS.USERS.STAFF, { params });
  },
};

export default userService;
