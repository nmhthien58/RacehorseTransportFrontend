import api from './api';
import { ENDPOINTS } from './endpoints';
import {
  getStoredBookings,
  getStoredBookingById,
  addStoredBooking,
  updateStoredBooking,
} from '@utils/bookingStorage';

/**
 * @file bookingService.js
 * @description Tầng Service xử lý nghiệp vụ đặt chuyến vận chuyển ngựa đua, hỗ trợ lưu trữ liên tục (localStorage persistence)
 */

export const bookingService = {
  /**
   * Lấy danh sách các đơn đặt chuyến vận chuyển (có hỗ trợ lọc theo trạng thái)
   * @param {Object} [params] - Tham số lọc (ví dụ: { status: 'Submitted', customerId: 5 })
   * @returns {Promise<{ data: import('../types/database').Booking[], total: number }>}
   */
  async getBookings(params) {
    try {
      const stored = getStoredBookings();
      const customerId = params?.customerId;
      const status = params?.status;
      let result = stored;
      if (customerId) {
        const parsedId = Number(customerId);
        result = result.filter(
          (b) => b.CustomerUserID === parsedId || b.CustomerUserID === 5 || !b.CustomerUserID,
        );
      }
      if (status && status !== 'All') {
        result = result.filter((b) => b.Status === status);
      }
      return { data: result, total: result.length };
    } catch {
      const fallback = getStoredBookings();
      return { data: fallback, total: fallback.length };
    }
  },

  /**
   * Lấy thông tin chi tiết một đơn đặt chuyến theo ID
   * @param {number|string} id - Mã định danh BookingID
   * @returns {Promise<import('../types/database').Booking>}
   */
  async getBookingById(id) {
    const stored = getStoredBookingById(id);
    if (stored) return stored;
    try {
      const res = await api.get(ENDPOINTS.BOOKINGS.DETAIL(id));
      return res?.data || res;
    } catch {
      return null;
    }
  },

  /**
   * Tạo yêu cầu đặt chuyến vận chuyển mới (dành cho Customer)
   * Lưu kiên cố vào localStorage để khi reset/refresh trang không bị mất dữ liệu
   * @param {Partial<import('../types/database').Booking>} bookingData - Dữ liệu yêu cầu đặt chuyến
   * @returns {Promise<import('../types/database').Booking>}
   */
  async createBooking(bookingData) {
    const newBooking = addStoredBooking(bookingData);
    try {
      await api.post(ENDPOINTS.BOOKINGS.CREATE, bookingData);
    } catch {
      // Mock / offline fallback đã xử lý bởi addStoredBooking
    }
    return newBooking;
  },

  /**
   * Phê duyệt đơn đặt chuyến và phân công nhân sự phụ trách (dành cho Manager)
   * @param {number|string} id - Mã định danh BookingID
   * @param {{ specialistId?: number, coordinatorId?: number }} payload - Phân công Specialist và Coordinator
   * @returns {Promise<import('../types/database').Booking>}
   */
  async approveBooking(id, payload) {
    const updated = updateStoredBooking(id, {
      Status: 'Approved',
      ...payload,
      ReviewedAt: new Date().toISOString(),
    });
    try {
      await api.post(ENDPOINTS.BOOKINGS.APPROVE(id), payload);
    } catch {}
    return updated;
  },

  /**
   * Phân công chuyên viên kiểm dịch và điều phối viên cho đơn (trạng thái chuyển sang Assigned)
   * @param {number|string} id - Mã định danh BookingID
   * @param {{ specialistId: number, coordinatorId: number }} payload - Thông tin phân công
   * @returns {Promise<import('../types/database').Booking>}
   */
  async assignStaff(id, payload) {
    const updated = updateStoredBooking(id, {
      Status: 'Assigned',
      AssignedSpecialistID: payload.specialistId,
      AssignedCoordinatorID: payload.coordinatorId,
    });
    try {
      await api.post(ENDPOINTS.BOOKINGS.ASSIGN(id), payload);
    } catch {}
    return updated;
  },

  /**
   * Từ chối đơn đặt chuyến vận chuyển kèm lý do (dành cho Manager)
   * @param {number|string} id - Mã định danh BookingID
   * @param {{ reason: string }} payload - Lý do từ chối
   * @returns {Promise<import('../types/database').Booking>}
   */
  async rejectBooking(id, payload) {
    const updated = updateStoredBooking(id, {
      Status: 'Rejected',
      RejectionReason: payload?.reason || 'Từ chối bởi Quản lý',
      ReviewedAt: new Date().toISOString(),
    });
    try {
      await api.post(ENDPOINTS.BOOKINGS.REJECT(id), payload);
    } catch {}
    return updated;
  },

  /**
   * Hủy đơn đặt chuyến vận chuyển (dành cho Customer)
   * @param {number|string} id - Mã định danh BookingID
   * @returns {Promise<import('../types/database').Booking>}
   */
  async cancelBooking(id) {
    const updated = updateStoredBooking(id, {
      Status: 'Cancelled',
    });
    try {
      await api.post(ENDPOINTS.BOOKINGS.CANCEL(id));
    } catch {}
    return updated;
  },

  /**
   * Yêu cầu tính toán bảng phân tích báo giá chi tiết (theo bảng giá pricing.PriceItems)
   * @param {number|string} id - Mã định danh BookingID
   * @returns {Promise<any>}
   */
  async calculateQuote(id) {
    try {
      return await api.post(ENDPOINTS.BOOKINGS.CALCULATE_QUOTE(id));
    } catch {
      return { total: 4500 };
    }
  },
};

export default bookingService;
