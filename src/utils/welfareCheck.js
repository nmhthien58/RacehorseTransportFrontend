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
  MAX_CONTINUOUS_TRANSIT_HOURS: 4.5,
  MIN_REST_MINUTES: 30,
};

/**
 * Phát hiện bất thường sinh trắc học cơ bản từ nhịp tim và nhiệt độ thân nhiệt.
 * @param {{ heartRate?: number, bodyTemp?: number }} vitals
 * @returns {{ hasAnomaly: boolean, severity: 'Normal'|'Warning'|'Critical', reasons: string[] }}
 */
export function detectBiometricAnomaly(vitals = {}) {
  const { heartRate, bodyTemp } = vitals;
  const reasons = [];
  let severity = 'Normal';

  if (typeof heartRate === 'number') {
    if (heartRate >= WELFARE_THRESHOLDS.HEART_RATE_BPM.CRITICAL) {
      severity = 'Critical';
      reasons.push(`Nhịp tim rất cao (${heartRate} BPM >= ${WELFARE_THRESHOLDS.HEART_RATE_BPM.CRITICAL})`);
    } else if (heartRate > WELFARE_THRESHOLDS.HEART_RATE_BPM.NORMAL_MAX) {
      if (severity !== 'Critical') severity = 'Warning';
      reasons.push(`Nhịp tim tăng cao (${heartRate} BPM)`);
    }
  }

  if (typeof bodyTemp === 'number') {
    if (bodyTemp >= WELFARE_THRESHOLDS.BODY_TEMP_CELSIUS.CRITICAL) {
      severity = 'Critical';
      reasons.push(`Thân nhiệt nguy hiểm (${bodyTemp} °C)`);
    } else if (bodyTemp > WELFARE_THRESHOLDS.BODY_TEMP_CELSIUS.NORMAL_MAX) {
      if (severity !== 'Critical') severity = 'Warning';
      reasons.push(`Sốt nhẹ hoặc thân nhiệt tăng (${bodyTemp} °C)`);
    }
  }

  return {
    hasAnomaly: reasons.length > 0,
    severity,
    reasons,
  };
}

/**
 * Đánh giá mức độ tiếp nhận nước và dấu hiệu mất nước (Hydration Status).
 * @param {number} [skinTentSeconds=1] - Thời gian da trở lại bình thường (giây)
 * @param {number} [capillaryRefillSeconds=2] - Thời gian hồi máu mao mạch nướu răng (giây)
 * @returns {'Optimal'|'MildDehydration'|'SevereDehydration'}
 */
export function evaluateHydrationStatus(skinTentSeconds = 1, capillaryRefillSeconds = 2) {
  if (skinTentSeconds > 4 || capillaryRefillSeconds > 3) {
    return 'SevereDehydration';
  }
  if (skinTentSeconds > 2 || capillaryRefillSeconds > 2) {
    return 'MildDehydration';
  }
  return 'Optimal';
}

/**
 * Tính điểm phúc lợi tổng hợp (Welfare Index: 0 - 100, 100 là tối ưu).
 * @param {{ heartRate?: number, bodyTemp?: number, cabinTemp?: number, stressLevel?: string }} log
 * @returns {number}
 */
export function calculateWelfareScore(log = {}) {
  let score = 100;

  if (log.heartRate && log.heartRate > WELFARE_THRESHOLDS.HEART_RATE_BPM.NORMAL_MAX) {
    score -= Math.min(25, (log.heartRate - WELFARE_THRESHOLDS.HEART_RATE_BPM.NORMAL_MAX) * 1.5);
  }

  if (log.bodyTemp && log.bodyTemp > WELFARE_THRESHOLDS.BODY_TEMP_CELSIUS.NORMAL_MAX) {
    score -= Math.min(25, (log.bodyTemp - WELFARE_THRESHOLDS.BODY_TEMP_CELSIUS.NORMAL_MAX) * 20);
  }

  if (log.cabinTemp && log.cabinTemp > WELFARE_THRESHOLDS.CABIN_TEMP_CELSIUS.HOT_WARNING) {
    score -= Math.min(20, (log.cabinTemp - WELFARE_THRESHOLDS.CABIN_TEMP_CELSIUS.HOT_WARNING) * 5);
  }

  if (log.stressLevel === 'High') {
    score -= 20;
  } else if (log.stressLevel === 'Moderate') {
    score -= 10;
  }

  return Math.max(0, Math.round(score));
}

/**
 * Kiểm tra xem xe có đang vi phạm thời gian chạy liên tục mà chưa cho ngựa nghỉ (R-14).
 * @param {Date|string|number} lastRestTime
 * @param {Date|string|number} [currentTime=new Date()]
 * @returns {{ mustRestNow: boolean, hoursElapsed: number, remainingAllowedMinutes: number }}
 */
export function validateRestWindow(lastRestTime, currentTime = new Date()) {
  const start = new Date(lastRestTime).getTime();
  const now = new Date(currentTime).getTime();
  const diffHours = Math.max(0, (now - start) / (1000 * 60 * 60));
  const remainingMinutes = Math.max(
    0,
    Math.round((WELFARE_THRESHOLDS.MAX_CONTINUOUS_TRANSIT_HOURS - diffHours) * 60)
  );

  return {
    mustRestNow: diffHours >= WELFARE_THRESHOLDS.MAX_CONTINUOUS_TRANSIT_HOURS,
    hoursElapsed: Number(diffHours.toFixed(2)),
    remainingAllowedMinutes: remainingMinutes,
  };
}
