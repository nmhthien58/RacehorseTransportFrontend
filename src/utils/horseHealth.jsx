import React from 'react';
import { Tooltip } from 'antd';
import {
  CheckCircleFilled,
  ExclamationCircleFilled,
  AlertFilled,
  SafetyCertificateFilled,
} from '@ant-design/icons';
import { useTranslation } from 'react-i18next';

/**
 * Cấu hình hệ thống đánh giá sức khỏe ngựa đua (Health Status Evaluation System)
 * Phân biệt màu sắc trực quan, độ tương phản cao, chuẩn UI hiện đại:
 * - Excellent: Xanh lục bảo (Emerald Green) -> Trạng thái tối ưu nhất
 * - Good: Xanh dương đại dương (Ocean Blue) -> Khỏe mạnh bình thường
 * - Attention: Vàng cam hổ phách (Amber Orange) -> Cảnh báo cần theo dõi
 * - Critical: Đỏ thắm (Crimson Red) -> Báo động nguy kịch
 */
export const HEALTH_STATUS_CONFIG = {
  Excellent: {
    key: 'Excellent',
    labelVi: 'Xuất sắc',
    labelEn: 'Excellent',
    subLabelVi: 'Đạt chuẩn bay',
    subLabelEn: 'Fit-to-Travel',
    bg: '#ECFDF5',       // Emerald 50
    text: '#065F46',     // Emerald 800
    border: '#A7F3D0',   // Emerald 200
    dot: '#10B981',      // Emerald 500
    icon: <SafetyCertificateFilled style={{ color: '#10B981' }} />,
    tooltipVi: 'Thể trạng đỉnh cao, đạt kiểm định quốc tế Fit-to-Travel.',
    tooltipEn: 'Peak condition, cleared under international Fit-to-Travel standards.',
  },
  Good: {
    key: 'Good',
    labelVi: 'Khỏe mạnh',
    labelEn: 'Good',
    subLabelVi: 'Ổn định',
    subLabelEn: 'Stable',
    bg: '#EFF6FF',       // Blue 50
    text: '#1D4ED8',     // Blue 700
    border: '#BFDBFE',   // Blue 200
    dot: '#3B82F6',      // Blue 500
    icon: <CheckCircleFilled style={{ color: '#3B82F6' }} />,
    tooltipVi: 'Thể trạng ổn định, sức khỏe tốt, sẵn sàng vận chuyển an toàn.',
    tooltipEn: 'Stable condition, healthy, ready for safe transit.',
  },
  Attention: {
    key: 'Attention',
    labelVi: 'Cần theo dõi',
    labelEn: 'Attention',
    subLabelVi: 'Cần chú ý',
    subLabelEn: 'Observation',
    bg: '#FFFBEB',       // Amber 50
    text: '#B45309',     // Amber 700
    border: '#FDE68A',   // Amber 200
    dot: '#F59E0B',      // Amber 500
    icon: <ExclamationCircleFilled style={{ color: '#F59E0B' }} />,
    tooltipVi: 'Có lưu ý sức khỏe hoặc đang hồi phục, cần theo dõi định kỳ trong lộ trình.',
    tooltipEn: 'Health notes or recovering; periodic monitoring required during journey.',
  },
  Critical: {
    key: 'Critical',
    labelVi: 'Nguy kịch',
    labelEn: 'Critical',
    subLabelVi: 'Cấm vận chuyển',
    subLabelEn: 'Non-Fit-to-Travel',
    bg: '#FEF2F2',       // Red 50
    text: '#991B1B',     // Red 800
    border: '#FECACA',   // Red 200
    dot: '#EF4444',      // Red 500
    icon: <AlertFilled style={{ color: '#EF4444' }} />,
    tooltipVi: 'Ngựa đang điều trị chấn thương hoặc bệnh cấp tính, CẤM VẬN CHUYỂN.',
    tooltipEn: 'Critical health status / acute injury, TRANSPORT PROHIBITED.',
  },
};

/**
 * Lấy cấu hình sức khỏe theo mã trạng thái
 * @param {string} status
 * @returns {typeof HEALTH_STATUS_CONFIG.Good}
 */
export function getHealthStatusConfig(status) {
  if (!status) return HEALTH_STATUS_CONFIG.Good;
  const key = Object.keys(HEALTH_STATUS_CONFIG).find(
    (k) => k.toLowerCase() === String(status).trim().toLowerCase(),
  );
  return HEALTH_STATUS_CONFIG[key] || HEALTH_STATUS_CONFIG.Good;
}

/**
 * Tính toán mức độ rủi ro vận chuyển (Transport Risk Assessment)
 * Dựa trên tình trạng sức khỏe thực tế (HealthStatus) và ghi chú chăm sóc đặc biệt (SpecialCareRequirements)
 * 
 * Quy tắc tính toán:
 * 1. CRITICAL risk: Ngựa có HealthStatus là Critical/Poor hoặc ghi chú chấn thương nặng, nguy kịch, cấp cứu.
 * 2. HIGH risk: Ngựa có HealthStatus là Attention, hoặc ghi chú phục hồi, chấn thương, say xe nặng.
 * 3. LOW risk: Ngựa có HealthStatus là Excellent hoặc Good, không có lưu ý cảnh báo cao.
 *
 * @param {Object} horse
 * @param {string} [lang='vi']
 * @returns {{ level: 'LOW'|'HIGH'|'CRITICAL', label: string, labelVi: string, labelEn: string, bg: string, color: string, border: string, description: string, descriptionVi: string, descriptionEn: string }}
 */
export function calculateHorseRisk(horse, lang = 'vi') {
  const isEn = String(lang).toLowerCase().startsWith('en');

  if (!horse) {
    const descVi = 'Thể trạng tốt, mức độ an toàn vận chuyển tối ưu.';
    const descEn = 'Optimal physical condition, highest transit safety.';
    return {
      level: 'LOW',
      label: isEn ? 'LOW RISK' : 'RỦI RO THẤP',
      labelVi: 'RỦI RO THẤP',
      labelEn: 'LOW RISK',
      bg: '#DCFCE7',
      color: '#15803D',
      border: '#86EFAC',
      description: isEn ? descEn : descVi,
      descriptionVi: descVi,
      descriptionEn: descEn,
    };
  }

  const status = (horse.HealthStatus || horse.healthStatus || '').trim().toLowerCase();
  const care = (horse.SpecialCareRequirements || horse.specialCareRequirements || '').toLowerCase();

  // 1. CRITICAL risk: Tình trạng nguy kịch hoặc chấn thương nghiêm trọng
  const isCritical =
    status === 'critical' ||
    status === 'poor' ||
    care.includes('nguy kịch') ||
    care.includes('cấp cứu') ||
    care.includes('chấn thương nặng') ||
    care.includes('nhiễm trùng cấp') ||
    care.includes('gãy xương') ||
    care.includes('fracture') ||
    care.includes('critical');

  if (isCritical) {
    const descVi = 'Cảnh báo nguy cơ cao! Yêu cầu bác sĩ thú y theo dõi liên tục 24/7.';
    const descEn = 'Critical alert! Requires continuous 24/7 veterinary supervision.';
    return {
      level: 'CRITICAL',
      label: isEn ? 'CRITICAL RISK' : 'RỦI RO NGUY CẤP',
      labelVi: 'RỦI RO NGUY CẤP',
      labelEn: 'CRITICAL RISK',
      bg: '#FEE2E2',      // Red 100
      color: '#991B1B',   // Red 800
      border: '#FCA5A5',  // Red 300
      description: isEn ? descEn : descVi,
      descriptionVi: descVi,
      descriptionEn: descEn,
    };
  }

  // 2. HIGH risk: Cần theo dõi y tế đặc biệt (Attention) hoặc đang hồi phục
  const isHigh =
    status === 'attention' ||
    care.includes('theo dõi đặc biệt') ||
    care.includes('hồi phục') ||
    care.includes('say xe nặng') ||
    care.includes('cách ly dịch') ||
    care.includes('motion sickness');

  if (isHigh) {
    const descVi = 'Cần chú ý chăm sóc, bổ sung khoáng/điện giải và theo dõi nhịp tim/nhiệt độ.';
    const descEn = 'Special care required: electrolyte supplements and vital sign monitoring.';
    return {
      level: 'HIGH',
      label: isEn ? 'HIGH RISK' : 'RỦI RO CAO',
      labelVi: 'RỦI RO CAO',
      labelEn: 'HIGH RISK',
      bg: '#FEF3C7',      // Amber 100
      color: '#B45309',   // Amber 800
      border: '#FDE68A',  // Amber 300
      description: isEn ? descEn : descVi,
      descriptionVi: descVi,
      descriptionEn: descEn,
    };
  }

  // 3. LOW risk: Thể trạng Khỏe mạnh (Good) hoặc Xuất sắc (Excellent)
  const descVi = 'Thể trạng ổn định, đạt chứng chỉ Fit-to-Travel an toàn tuyệt đối.';
  const descEn = 'Stable condition, certified Fit-to-Travel with maximum safety.';
  return {
    level: 'LOW',
    label: isEn ? 'LOW RISK' : 'RỦI RO THẤP',
    labelVi: 'RỦI RO THẤP',
    labelEn: 'LOW RISK',
    bg: '#DCFCE7',      // Emerald 100
    color: '#15803D',   // Emerald 800
    border: '#86EFAC',  // Emerald 300
    description: isEn ? descEn : descVi,
    descriptionVi: descVi,
    descriptionEn: descEn,
  };
}

/**
 * Tag hiển thị Đánh giá Sức Khỏe của ngựa với màu sắc phân biệt trực quan và tự động song ngữ
 * @param {Object} props
 * @param {string} props.status - 'Excellent' | 'Good' | 'Attention' | 'Critical'
 * @param {'small'|'middle'|'large'} [props.size='middle']
 * @param {boolean} [props.showIcon=true]
 * @param {string} [props.locale]
 */
export function HealthStatusTag({
  status,
  size = 'middle',
  showIcon = true,
  locale,
  style = {},
}) {
  const { i18n } = useTranslation();
  const activeLang = locale || i18n.language || 'vi';
  const isEn = activeLang.toLowerCase().startsWith('en');

  const config = getHealthStatusConfig(status);
  const label = isEn ? config.labelEn : config.labelVi;
  const tooltip = isEn ? (config.tooltipEn || config.tooltipVi) : (config.tooltipVi || config.tooltipEn);

  const paddingBySize = {
    small: '2px 8px',
    middle: '4px 12px',
    large: '6px 16px',
  };

  const fontSizeBySize = {
    small: 11.5,
    middle: 12.5,
    large: 14,
  };

  return (
    <Tooltip title={tooltip}>
      <span
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: 6,
          backgroundColor: config.bg,
          color: config.text,
          border: `1px solid ${config.border}`,
          borderRadius: 8,
          padding: paddingBySize[size] || paddingBySize.middle,
          fontSize: fontSizeBySize[size] || fontSizeBySize.middle,
          fontWeight: 700,
          lineHeight: 1.3,
          letterSpacing: '0.01em',
          cursor: 'default',
          userSelect: 'none',
          boxShadow: '0 1px 2px rgba(0, 0, 0, 0.02)',
          transition: 'all 0.2s ease',
          ...style,
        }}
      >
        {showIcon && config.icon}
        <span>{label}</span>
      </span>
    </Tooltip>
  );
}

/**
 * Badge hiển thị Mức độ rủi ro vận chuyển chuẩn song ngữ 100%
 * VI: RỦI RO THẤP / RỦI RO CAO / RỦI RO NGUY CẤP
 * EN: LOW RISK / HIGH RISK / CRITICAL RISK
 * @param {Object} props
 * @param {Object|string} props.risk - Object từ calculateHorseRisk hoặc chuỗi nhãn
 * @param {'small'|'middle'} [props.size='middle']
 */
export function RiskBadge({ risk, size = 'middle', style = {} }) {
  const { i18n } = useTranslation();
  const isEn = (i18n.language || 'vi').toLowerCase().startsWith('en');

  let level = 'LOW';
  if (typeof risk === 'string') {
    const rUpper = risk.toUpperCase();
    if (rUpper.includes('CRITICAL') || rUpper.includes('NGUY CẤP')) level = 'CRITICAL';
    else if (rUpper.includes('HIGH') || rUpper.includes('CAO')) level = 'HIGH';
    else level = 'LOW';
  } else if (risk?.level) {
    level = risk.level;
  }

  const riskStyles = {
    CRITICAL: {
      labelVi: 'RỦI RO NGUY CẤP',
      labelEn: 'CRITICAL RISK',
      bg: '#FEE2E2',
      color: '#991B1B',
      border: '#FCA5A5',
    },
    HIGH: {
      labelVi: 'RỦI RO CAO',
      labelEn: 'HIGH RISK',
      bg: '#FEF3C7',
      color: '#B45309',
      border: '#FDE68A',
    },
    LOW: {
      labelVi: 'RỦI RO THẤP',
      labelEn: 'LOW RISK',
      bg: '#DCFCE7',
      color: '#15803D',
      border: '#86EFAC',
    },
  };

  const styleConfig = riskStyles[level] || riskStyles.LOW;
  const label = isEn ? styleConfig.labelEn : styleConfig.labelVi;

  const padding = size === 'small' ? '2px 10px' : '4px 14px';
  const fontSize = size === 'small' ? 10.5 : 11.5;

  return (
    <span
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        backgroundColor: styleConfig.bg,
        color: styleConfig.color,
        border: `1px solid ${styleConfig.border}`,
        borderRadius: 9999,
        padding,
        fontSize,
        fontWeight: 800,
        letterSpacing: 0.5,
        textTransform: 'uppercase',
        whiteSpace: 'nowrap',
        boxShadow: '0 1px 2px rgba(0, 0, 0, 0.02)',
        ...style,
      }}
    >
      {label}
    </span>
  );
}

/**
 * Danh sách lựa chọn HealthStatus dùng trong Select form thêm/sửa ngựa
 */
export const HEALTH_STATUS_OPTIONS = [
  {
    value: 'Excellent',
    labelVi: 'Xuất sắc (Tối ưu thi đấu & bay quốc tế)',
    labelEn: 'Excellent (Optimal racing & air transit)',
    color: '#065F46',
    bg: '#ECFDF5',
  },
  {
    value: 'Good',
    labelVi: 'Khỏe mạnh (Thể trạng ổn định)',
    labelEn: 'Good (Stable condition, ready for transit)',
    color: '#1D4ED8',
    bg: '#EFF6FF',
  },
  {
    value: 'Attention',
    labelVi: 'Cần theo dõi (Có lưu ý y tế / đang phục hồi)',
    labelEn: 'Attention (Medical observation required)',
    color: '#B45309',
    bg: '#FFFBEB',
  },
  {
    value: 'Critical',
    labelVi: 'Nguy kịch (CẤM VẬN CHUYỂN)',
    labelEn: 'Critical (NON-FIT-TO-TRAVEL)',
    color: '#991B1B',
    bg: '#FEF2F2',
  },
];
