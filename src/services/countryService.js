import api from './api';
import { ENDPOINTS } from './endpoints';

/**
 * @file countryService.js
 * @description Phạm vi dịch vụ theo quốc gia (R-18): nước, phương thức (cước), sân bay; kèm bảng giá và quy định giấy tờ cho trang cấu hình.
 */

export const countryService = {
  /**
   * Danh sách nước đang nhận cho form đặt chuyến (không cần đăng nhập)
   * @returns {Promise<{ data: Array<{ countryCode: string, nameVi: string, nameEn: string, groundAvailable: boolean, airAvailable: boolean, airports: Array<Object> }> }>}
   */
  async getCatalog() {
    return api.get(ENDPOINTS.COUNTRIES.CATALOG);
  },

  /**
   * Mọi nước kèm cước, số sân bay, số giấy tờ và cảnh báo (Manager / Admin)
   * @returns {Promise<{ data: Array<Object> }>}
   */
  async getCountries() {
    return api.get(ENDPOINTS.COUNTRIES.LIST);
  },

  /**
   * Chi tiết một nước: cước, sân bay, quy định giấy tờ, phí riêng
   * @param {string} code - Mã nước 2 chữ
   * @returns {Promise<{ data: Object }>}
   */
  async getCountry(code) {
    return api.get(ENDPOINTS.COUNTRIES.DETAIL(code));
  },

  /**
   * Thêm nước
   * @param {{ countryCode: string, nameVi: string, nameEn: string, sortOrder?: number }} payload
   * @returns {Promise<{ data: Object }>}
   */
  async createCountry(payload) {
    return api.post(ENDPOINTS.COUNTRIES.CREATE, payload);
  },

  /**
   * Sửa tên, thứ tự hiển thị
   * @param {string} code
   * @param {{ nameVi: string, nameEn: string, sortOrder?: number }} payload
   * @returns {Promise<{ data: Object }>}
   */
  async updateCountry(code, payload) {
    return api.put(ENDPOINTS.COUNTRIES.UPDATE(code), payload);
  },

  /**
   * Bật / tắt cả nước
   * @param {string} code
   * @param {boolean} isActive
   * @returns {Promise<{ data: Object }>}
   */
  async setCountryActive(code, isActive) {
    return api.patch(ENDPOINTS.COUNTRIES.SET_ACTIVE(code), { isActive });
  },

  /**
   * Đặt cước và bật / tắt một phương thức cho nước đến
   * @param {string} code
   * @param {'Ground'|'Air'} mode
   * @param {{ value: number, isActive: boolean }} payload - Đường bộ: USD/km/con; đường bay: USD/con
   * @returns {Promise<{ data: Object }>}
   */
  async setFreight(code, mode, payload) {
    return api.put(ENDPOINTS.COUNTRIES.SET_FREIGHT(code, mode), payload);
  },

  /**
   * Thêm sân bay
   * @param {string} code
   * @param {{ iataCode: string, name: string, city?: string }} payload
   * @returns {Promise<{ data: Object }>}
   */
  async addAirport(code, payload) {
    return api.post(ENDPOINTS.COUNTRIES.ADD_AIRPORT(code), payload);
  },

  /**
   * Sửa sân bay
   * @param {number} airportId
   * @param {{ iataCode: string, name: string, city?: string }} payload
   * @returns {Promise<{ data: Object }>}
   */
  async updateAirport(airportId, payload) {
    return api.put(ENDPOINTS.COUNTRIES.UPDATE_AIRPORT(airportId), payload);
  },

  /**
   * Mở / đóng sân bay
   * @param {number} airportId
   * @param {boolean} isActive
   * @returns {Promise<{ data: Object }>}
   */
  async setAirportActive(airportId, isActive) {
    return api.patch(ENDPOINTS.COUNTRIES.SET_AIRPORT_ACTIVE(airportId), { isActive });
  },

  /**
   * Danh sách dòng giá; lọc `globalOnly: true` cho bảng giá chung, `destCountryCode` cho phí riêng của nước
   * @param {{ category?: string, transportMode?: string, isActive?: boolean, destCountryCode?: string, globalOnly?: boolean, page?: number, size?: number }} [params]
   * @returns {Promise<{ data: Array<Object>, pagination?: Object }>}
   */
  async getPriceItems(params) {
    return api.get(ENDPOINTS.PRICE_ITEMS.LIST, { params });
  },

  /**
   * Thêm dòng giá
   * @param {Object} payload - category, itemCode, itemName, transportMode, destCountryCode, calcType, value, minHorses
   * @returns {Promise<{ data: Object }>}
   */
  async createPriceItem(payload) {
    return api.post(ENDPOINTS.PRICE_ITEMS.CREATE, payload);
  },

  /**
   * Sửa dòng giá (gửi đủ các trường)
   * @param {number} id
   * @param {Object} payload
   * @returns {Promise<{ data: Object }>}
   */
  async updatePriceItem(id, payload) {
    return api.put(ENDPOINTS.PRICE_ITEMS.UPDATE(id), payload);
  },

  /**
   * Bật / tắt dòng giá
   * @param {number} id
   * @param {boolean} isActive
   * @returns {Promise<{ data: Object }>}
   */
  async setPriceItemActive(id, isActive) {
    return api.patch(ENDPOINTS.PRICE_ITEMS.SET_ACTIVE(id), { isActive });
  },

  /**
   * Thêm quy định giấy tờ cho một nước
   * @param {{ countryCode: string, direction: string, docTypeId: number, validityDays?: number, processingDays?: number, isMandatory: boolean, regulationNote?: string }} payload
   * @returns {Promise<{ data: Object }>}
   */
  async createRequirement(payload) {
    return api.post(ENDPOINTS.COUNTRY_DOC_REQUIREMENTS.CREATE, payload);
  },

  /**
   * Sửa quy định giấy tờ (gửi đủ các trường như khi thêm)
   * @param {number} id
   * @param {Object} payload
   * @returns {Promise<{ data: Object }>}
   */
  async updateRequirement(id, payload) {
    return api.put(ENDPOINTS.COUNTRY_DOC_REQUIREMENTS.UPDATE(id), payload);
  },

  /**
   * Xóa quy định giấy tờ
   * @param {number} id
   * @returns {Promise<any>}
   */
  async deleteRequirement(id) {
    return api.delete(ENDPOINTS.COUNTRY_DOC_REQUIREMENTS.DELETE(id));
  },
};

export default countryService;
