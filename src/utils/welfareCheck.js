/**
 * @file welfareCheck.js
 * Tiện ích đánh giá thể trạng sinh trắc học và phúc lợi ngựa đua trên hành trình.
 * Tuân thủ quy chuẩn FEI Equine Transport Standards và chính sách an toàn R-12/R-14.
 *
 * @example
 * import welfareHelper, { detectBiometricAnomaly, calculateWelfareScore } from '@utils/welfareCheck';
 * const anomaly = detectBiometricAnomaly({ heartRate: 58, bodyTemp: 38.8 });
 * const score = calculateWelfareScore({ heartRate: 38, bodyTemp: 37.9, stressLevel: 'Low' });
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
 * @param {{ heartRate?: number, bodyTemp?: number }} [vitals={}] - Chỉ số sinh trắc học của ngựa
 * @returns {{ hasAnomaly: boolean, severity: 'Normal'|'Warning'|'Critical', reasons: string[] }} Kết quả đánh giá
 */
export function detectBiometricAnomaly(vitals = {}) {
  if (!vitals || typeof vitals !== 'object') {
    return { hasAnomaly: false, severity: 'Normal', reasons: [] };
  }

  const { heartRate, bodyTemp } = vitals;
  const reasons = [];
  let severity = 'Normal';

  if (typeof heartRate === 'number' && !Number.isNaN(heartRate) && heartRate > 0) {
    if (heartRate >= WELFARE_THRESHOLDS.HEART_RATE_BPM.CRITICAL) {
      severity = 'Critical';
      reasons.push(`Nhịp tim rất cao (${heartRate} BPM >= ${WELFARE_THRESHOLDS.HEART_RATE_BPM.CRITICAL})`);
    } else if (heartRate > WELFARE_THRESHOLDS.HEART_RATE_BPM.NORMAL_MAX) {
      if (severity !== 'Critical') severity = 'Warning';
      reasons.push(`Nhịp tim tăng cao (${heartRate} BPM)`);
    }
  }

  if (typeof bodyTemp === 'number' && !Number.isNaN(bodyTemp) && bodyTemp > 0) {
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
 * @param {number} [skinTentSeconds=1] - Thời gian da trở lại bình thường khi véo da cổ (giây)
 * @param {number} [capillaryRefillSeconds=2] - Thời gian hồi máu mao mạch nướu răng (giây)
 * @returns {'Optimal'|'MildDehydration'|'SevereDehydration'} Mức độ ngậm nước
 */
export function evaluateHydrationStatus(skinTentSeconds = 1, capillaryRefillSeconds = 2) {
  const safeSkinTent = Number(skinTentSeconds) || 1;
  const safeRefill = Number(capillaryRefillSeconds) || 2;

  if (safeSkinTent > 4 || safeRefill > 3) {
    return 'SevereDehydration';
  }
  if (safeSkinTent > 2 || safeRefill > 2) {
    return 'MildDehydration';
  }
  return 'Optimal';
}

/**
 * Tính điểm phúc lợi tổng hợp (Welfare Index: 0 - 100, 100 là tối ưu).
 * @param {{ heartRate?: number, bodyTemp?: number, cabinTemp?: number, stressLevel?: string }} [log={}] - Nhật ký thể trạng
 * @returns {number} Điểm phúc lợi tổng hợp từ 0 đến 100
 */
export function calculateWelfareScore(log = {}) {
  if (!log || typeof log !== 'object') return 100;

  let score = 100;

  if (typeof log.heartRate === 'number' && log.heartRate > WELFARE_THRESHOLDS.HEART_RATE_BPM.NORMAL_MAX) {
    score -= Math.min(25, (log.heartRate - WELFARE_THRESHOLDS.HEART_RATE_BPM.NORMAL_MAX) * 1.5);
  }

  if (typeof log.bodyTemp === 'number' && log.bodyTemp > WELFARE_THRESHOLDS.BODY_TEMP_CELSIUS.NORMAL_MAX) {
    score -= Math.min(25, (log.bodyTemp - WELFARE_THRESHOLDS.BODY_TEMP_CELSIUS.NORMAL_MAX) * 20);
  }

  if (typeof log.cabinTemp === 'number' && log.cabinTemp > WELFARE_THRESHOLDS.CABIN_TEMP_CELSIUS.HOT_WARNING) {
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
 * @param {Date|string|number} lastRestTime - Thời điểm bắt đầu chặng chạy liên tục
 * @param {Date|string|number} [currentTime=new Date()] - Thời điểm hiện tại
 * @returns {{ mustRestNow: boolean, hoursElapsed: number, remainingAllowedMinutes: number }} Trạng thái yêu cầu nghỉ
 */
export function validateRestWindow(lastRestTime, currentTime = new Date()) {
  if (!lastRestTime) {
    return { mustRestNow: false, hoursElapsed: 0, remainingAllowedMinutes: 270 };
  }

  const start = new Date(lastRestTime).getTime();
  const now = new Date(currentTime).getTime();

  if (Number.isNaN(start) || Number.isNaN(now)) {
    return { mustRestNow: false, hoursElapsed: 0, remainingAllowedMinutes: 270 };
  }

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

/**
 * Tổng hợp thống kê phúc lợi của ngựa qua toàn bộ các mốc nhật ký của chuyến.
 * @param {Array<Object>} [logs=[]]
 * @returns {{ logCount: number, averageHeartRate: number|null, maxBodyTemp: number|null, alertCount: number, overallScore: number }}
 */
export function evaluateTripWelfareSummary(logs = []) {
  if (!Array.isArray(logs) || logs.length === 0) {
    return {
      logCount: 0,
      averageHeartRate: null,
      maxBodyTemp: null,
      alertCount: 0,
      overallScore: 100,
    };
  }

  let totalHr = 0;
  let hrCount = 0;
  let maxTemp = 0;
  let alerts = 0;
  let totalScore = 0;

  logs.forEach((log) => {
    if (typeof log.heartRate === 'number' && log.heartRate > 0) {
      totalHr += log.heartRate;
      hrCount += 1;
    }
    if (typeof log.bodyTemp === 'number' && log.bodyTemp > maxTemp) {
      maxTemp = log.bodyTemp;
    }
    const anomaly = detectBiometricAnomaly(log);
    if (anomaly.hasAnomaly) {
      alerts += 1;
    }
    totalScore += calculateWelfareScore(log);
  });

  return {
    logCount: logs.length,
    averageHeartRate: hrCount > 0 ? Math.round(totalHr / hrCount) : null,
    maxBodyTemp: maxTemp > 0 ? Number(maxTemp.toFixed(1)) : null,
    alertCount: alerts,
    overallScore: Math.round(totalScore / logs.length),
  };
}

const welfareHelper = {
  WELFARE_THRESHOLDS,
  detectBiometricAnomaly,
  evaluateHydrationStatus,
  calculateWelfareScore,
  validateRestWindow,
  evaluateTripWelfareSummary,
};

export default welfareHelper;
