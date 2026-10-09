import api from './api';
import { ENDPOINTS } from './endpoints';

/**
 * @file horseService.js
 * @description Tầng Service xử lý nghiệp vụ hồ sơ ngựa đua (Horses)
 */

export const horseService = {
  /**
   * Lấy danh sách hồ sơ ngựa đua (hỗ trợ phân trang, tìm kiếm và lọc theo chủ ngựa)
   * @param {{ ownerUserId?: number, includeInactive?: boolean, search?: string, sort?: string, page?: number, size?: number }} [params]
   * @returns {Promise<{ data: import('../types/database').Horse[], pagination?: any }>}
   */
  async getHorses(params) {
    return api.get(ENDPOINTS.HORSES.LIST, { params });
  },

  /**
   * Lấy chi tiết hồ sơ một con ngựa theo ID
   * @param {number|string} id - Mã định danh HorseID
   * @returns {Promise<import('../types/database').Horse>}
   */
  async getHorseById(id) {
    return api.get(ENDPOINTS.HORSES.DETAIL(id));
  },

  /**
   * Khai báo hồ sơ ngựa đua mới (hỗ trợ FormData kèm file ảnh hoặc JSON)
   * @param {FormData|Partial<import('../types/database').Horse>} horseData - Dữ liệu hồ sơ ngựa
   * @returns {Promise<import('../types/database').Horse>}
   */
  async createHorse(horseData) {
    const isFormData = typeof FormData !== 'undefined' && horseData instanceof FormData;
    return api.post(ENDPOINTS.HORSES.CREATE, horseData, {
      headers: isFormData ? { 'Content-Type': 'multipart/form-data' } : undefined,
    });
  },

  /**
   * Cập nhật thông tin hồ sơ ngựa đua
   * @param {number|string} id - Mã định danh HorseID
   * @param {FormData|Partial<import('../types/database').Horse>} horseData - Dữ liệu cập nhật
   * @returns {Promise<import('../types/database').Horse>}
   */
  async updateHorse(id, horseData) {
    const isFormData = typeof FormData !== 'undefined' && horseData instanceof FormData;
    return api.put(ENDPOINTS.HORSES.UPDATE(id), horseData, {
      headers: isFormData ? { 'Content-Type': 'multipart/form-data' } : undefined,
    });
  },

  /**
   * Xóa hồ sơ ngựa đua khỏi hệ thống
   * @param {number|string} id - Mã định danh HorseID
   * @returns {Promise<any>}
   */
  async deleteHorse(id) {
    return api.delete(ENDPOINTS.HORSES.DELETE(id));
  },
};

export default horseService;
