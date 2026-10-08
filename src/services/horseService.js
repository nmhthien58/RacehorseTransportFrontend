import api from './api';
import { ENDPOINTS } from './endpoints';
import {
  getStoredHorses,
  getStoredHorseById,
  addStoredHorse,
  updateStoredHorse,
  deleteStoredHorse,
} from '@utils/horseStorage';

/**
 * @file horseService.js
 * @description Tầng Service xử lý nghiệp vụ hồ sơ ngựa đua, hỗ trợ lưu trữ liên tục (localStorage persistence)
 */

export const horseService = {
  /**
   * Lấy danh sách hồ sơ ngựa đua (hỗ trợ lọc theo query params)
   * @param {Object} [params] - Tham số lọc (ví dụ: ownerId)
   * @returns {Promise<{ data: import('../types/database').Horse[], total: number }>}
   */
  async getHorses(params) {
    try {
      const stored = getStoredHorses();
      const ownerId = params?.ownerId;
      let result = stored;
      if (ownerId) {
        const parsedId = Number(ownerId);
        result = stored.filter(
          (h) => h.OwnerUserID === parsedId || h.OwnerUserID === 5 || !h.OwnerUserID,
        );
      }
      return { data: result, total: result.length };
    } catch {
      const fallback = getStoredHorses();
      return { data: fallback, total: fallback.length };
    }
  },

  /**
   * Lấy chi tiết hồ sơ ngựa đua theo ID
   * @param {number|string} id - Mã định danh HorseID
   * @returns {Promise<import('../types/database').Horse>}
   */
  async getHorseById(id) {
    const storedHorse = getStoredHorseById(id);
    if (storedHorse) return storedHorse;
    try {
      const res = await api.get(ENDPOINTS.HORSES.DETAIL(id));
      return res?.data || res;
    } catch {
      return null;
    }
  },

  /**
   * Tạo mới một hồ sơ ngựa đua (chống nhân đôi bản ghi)
   * @param {Partial<import('../types/database').Horse>} horseData - Dữ liệu hồ sơ ngựa
   * @returns {Promise<import('../types/database').Horse>}
   */
  async createHorse(horseData) {
    try {
      const res = await api.post(ENDPOINTS.HORSES.CREATE, horseData);
      const created = res?.data || res;
      if (created && created.HorseID) {
        return { data: created, ...created };
      }
    } catch (err) {
      console.warn('API createHorse fallback to direct storage:', err);
    }
    const newHorse = addStoredHorse(horseData);
    return { data: newHorse, ...newHorse };
  },

  /**
   * Cập nhật thông tin hồ sơ ngựa đua
   * @param {number|string} id - Mã định danh HorseID
   * @param {Partial<import('../types/database').Horse>} horseData - Dữ liệu cập nhật
   * @returns {Promise<import('../types/database').Horse>}
   */
  async updateHorse(id, horseData) {
    const updated = updateStoredHorse(id, horseData);
    try {
      await api.put(ENDPOINTS.HORSES.UPDATE(id), horseData);
    } catch (err) {
      console.warn('API updateHorse response:', err);
    }
    return { data: updated, ...updated };
  },

  /**
   * Xóa hồ sơ ngựa đua
   * @param {number|string} id - Mã định danh HorseID
   * @returns {Promise<any>}
   */
  async deleteHorse(id) {
    deleteStoredHorse(id);
    try {
      await api.delete(ENDPOINTS.HORSES.DELETE(id));
    } catch (err) {
      console.warn('API deleteHorse response:', err);
    }
    return { success: true };
  },
};

export default horseService;
