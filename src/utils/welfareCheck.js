/**
 * @file welfareCheck.js
 * Tiện ích đánh giá thể trạng sinh trắc học và phúc lợi ngựa đua trên hành trình (FEI Equine Transport Standards).
 */

/**
 * Ngưỡng sinh trắc học tiêu chuẩn của ngựa trưởng thành trong quá trình vận chuyển.
 */
export const WELFARE_THRESHOLDS = {
  HEART_RATE_BPM: {
    NORMAL_MIN: 28,
    NORMAL_MAX: 44,
    ELEVATED_MAX: 60,
    CRITICAL: 65,
  },
  BODY_TEMP_CELSIUS: {
    NORMAL_MIN: 37.2,
    NORMAL_MAX: 38.3,
    ELEVATED_MAX: 39.0,
    CRITICAL: 39.5,
  },
  CABIN_TEMP_CELSIUS: {
    OPTIMAL_MIN: 15.0,
    OPTIMAL_MAX: 24.0,
    HOT_WARNING: 28.0,
    EXTREME_DANGER: 32.0,
  },
};
