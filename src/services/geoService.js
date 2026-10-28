import api from './api';
import { ENDPOINTS } from './endpoints';

/**
 * @file geoService.js
 * @description Gọi API bản đồ của backend (BE-01). Không gọi thẳng Goong / Nominatim / OSRM.
 */

/**
 * @typedef {Object} GeoPlace
 * @property {string} displayName
 * @property {number} lat
 * @property {number} lng
 * @property {string} countryCode
 * @property {string} [provider]
 */

export const geoService = {
  /**
   * Gợi ý địa chỉ theo chữ người dùng gõ (tối đa 5 kết quả)
   * @param {string} q - Chữ tìm, 2–200 ký tự
   * @param {string} [country] - Mã nước 2 chữ để thu hẹp tìm kiếm
   * @returns {Promise<{ data: GeoPlace[] }>}
   */
  async search(q, country) {
    return api.get(ENDPOINTS.GEO.SEARCH, { params: { q, country: country || undefined } });
  },

  /**
   * Tọa độ -> địa chỉ + nước (khi bấm lên bản đồ hoặc kéo ghim)
   * @param {number} lat
   * @param {number} lng
   * @returns {Promise<{ data: GeoPlace }>}
   */
  async reverse(lat, lng) {
    return api.get(ENDPOINTS.GEO.REVERSE, { params: { lat, lng } });
  },

  /**
   * Chỉ đường bộ qua các điểm theo đúng thứ tự
   * @param {Array<{ lat: number, lng: number, countryCode?: string }>} points - 2–25 điểm
   * @param {boolean} [includeCountries] - Trả thêm các nước tuyến đi qua
   * @returns {Promise<{ data: { legs: Array<{ fromIndex: number, toIndex: number, distanceKm: number, durationHours: number, isEstimate: boolean, polyline: number[][] }>, totalDistanceKm: number, totalDurationHours: number, isEstimate: boolean, polyline: number[][], countryCodes: string[] | null } }>}
   */
  async route(points, includeCountries = false) {
    return api.post(ENDPOINTS.GEO.ROUTE, { points, includeCountries });
  },
};

export default geoService;
