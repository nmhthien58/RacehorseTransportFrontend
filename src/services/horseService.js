import api from './api';
import { ENDPOINTS } from './endpoints';

/**
 * @file horseService.js
 * @description Tầng Service xử lý nghiệp vụ hồ sơ ngựa đua
 */

export const horseService = {
  /**
   * Lấy danh sách hồ sơ ngựa đua (hỗ trợ lọc theo query params)
   * @param {Object} [params] - Tham số lọc (ví dụ: ownerId)
   * @returns {Promise<{ data: import('../types/database').Horse[], total: number }>}
   */
  async getHorses(params) {
    return api.get(ENDPOINTS.HORSES.LIST, { params });
  },

  /**
   * Lấy chi tiết hồ sơ ngựa đua theo ID
   * @param {number|string} id - Mã định danh HorseID
   * @returns {Promise<import('../types/database').Horse>}
   */
  async getHorseById(id) {
    return api.get(ENDPOINTS.HORSES.DETAIL(id));
  },

  /**
   * Tạo mới một hồ sơ ngựa đua
   * @param {Partial<import('../types/database').Horse>} horseData - Dữ liệu hồ sơ ngựa
   * @returns {Promise<import('../types/database').Horse>}
   */
  async createHorse(horseData) {
    return api.post(ENDPOINTS.HORSES.CREATE, horseData);
  },

  /**
   * Cập nhật thông tin hồ sơ ngựa đua
   * @param {number|string} id - Mã định danh HorseID
   * @param {Partial<import('../types/database').Horse>} horseData - Dữ liệu cập nhật
   * @returns {Promise<import('../types/database').Horse>}
   */
  async updateHorse(id, horseData) {
    return api.put(ENDPOINTS.HORSES.UPDATE(id), horseData);
  },

  /**
   * Xóa hồ sơ ngựa đua
   * @param {number|string} id - Mã định danh HorseID
   * @returns {Promise<any>}
   */
  async deleteHorse(id) {
    return api.delete(ENDPOINTS.HORSES.DELETE(id));
  },
};

export default horseService;
