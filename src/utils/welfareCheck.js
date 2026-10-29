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
