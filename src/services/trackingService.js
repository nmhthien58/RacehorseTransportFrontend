import api from './api';
import { ENDPOINTS } from './endpoints';

/**
 * @file trackingService.js
 * @description Tầng Service xử lý màn hình theo dõi hành trình thời gian thực (Tracking)
 */

export const trackingService = {
  /**
   * Lấy danh sách các chuyến đang vận hành phục vụ bảng theo dõi trực quan (FleetCoordinator)
   * @param {{ status?: string, search?: string, page?: number, size?: number }} [params]
   * @returns {Promise<{ data: Array<any>, pagination?: any }>}
   */
  async getTripsTracking(params) {
    return api.get(ENDPOINTS.TRACKING.TRIPS, { params });
  },

  /**
   * Khách hàng theo dõi chi tiết hành trình đơn vận chuyển của mình (Customer Tracking)
   * @param {number|string} bookingId
   * @returns {Promise<any>}
   */
  async getBookingTracking(bookingId) {
    return api.get(ENDPOINTS.TRACKING.BOOKING(bookingId));
  },
};

export default trackingService;
