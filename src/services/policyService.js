import api from './api';
import { ENDPOINTS } from './endpoints';

/**
 * @file policyService.js
<<<<<<< HEAD
 * @description Tầng Service xử lý chính sách dịch vụ hệ thống (FE-15 / BE-17).
 * Cung cấp cấu hình chính sách động và dữ liệu fallback chuẩn hóa từ doc/CHINH_SACH_DICH_VU.md.
 */

/**
 * Giá trị chính sách dịch vụ mặc định (fallback khi BE-17 chưa có endpoint hoặc gặp lỗi mạng)
 * Mọi giá trị khớp 100% tài liệu doc/CHINH_SACH_DICH_VU.md
 */
export const DEFAULT_POLICY = {
  PolicyVersion: '1.0',
  EffectiveDate: '26/10/2026',
  Payment: {
    UsdVndRate: 26000,
    DepositPercent: 30,
    BalanceDueDaysBeforeDeparture: 2,
    ExtraPaymentDueDays: 7,
    CancelRefundPercent: 50,
  },
  Booking: {
    QuoteAcceptDays: 3,
  },
  Horse: {
    MinAgeMonths: 6,
  },
  Delay: {
    GraceHours: 6,
    PercentPer12Hours: 5,
    MaxPercent: 25,
  },
  Insurance: {
    ProofThresholdUsd: 50000,
    PremiumPercent: 1,
    BaseLiabilityUsd: 5000,
    BaseVetCapUsd: 1000,
    VetCapPercent: 20,
  },
  Delivery: {
    WaitingFeePerHourUsd: 40,
    MaxWaitingHours: 24,
  },
};

export const policyService = {
  /**
   * Lấy cấu hình chính sách dịch vụ công khai từ backend (không cần đăng nhập)
   * @returns {Promise<typeof DEFAULT_POLICY>}
   */
  async getPolicy() {
    try {
      const response = await api.get(ENDPOINTS.POLICY.GET);
      const data = response?.data?.data || response?.data;
      if (data && typeof data === 'object') {
        return {
          ...DEFAULT_POLICY,
          ...data,
          Payment: { ...DEFAULT_POLICY.Payment, ...data.Payment },
          Booking: { ...DEFAULT_POLICY.Booking, ...data.Booking },
          Horse: { ...DEFAULT_POLICY.Horse, ...data.Horse },
          Delay: { ...DEFAULT_POLICY.Delay, ...data.Delay },
          Insurance: { ...DEFAULT_POLICY.Insurance, ...data.Insurance },
          Delivery: { ...DEFAULT_POLICY.Delivery, ...data.Delivery },
        };
      }
      return DEFAULT_POLICY;
    } catch {
      // TODO(BE-17): Trả về dữ liệu mặc định khi backend chưa hoàn tất endpoint /api/policy
      return DEFAULT_POLICY;
    }
=======
 * @description Chính sách dịch vụ công khai (BE-17): phiên bản hiện hành và các giá trị cấu hình.
 */

export const policyService = {
  /**
   * Lấy chính sách hiện hành (không cần đăng nhập)
   * @returns {Promise<{ data: { version: string, payment: Object, booking: Object, delay: Object, insurance: Object, horse: Object, delivery: Object, values: Object<string, number|string> } }>}
   */
  async getPolicy() {
    return api.get(ENDPOINTS.POLICY.PUBLIC);
>>>>>>> main
  },
};

export default policyService;
