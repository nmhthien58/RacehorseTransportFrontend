// R-18: nhãn và định dạng cho trang Quốc gia và trang Bảng giá chung

/** Thứ tự nhóm giá khi hiển thị (giống thứ tự backend cộng vào báo giá) */
export const PRICE_CATEGORY_ORDER = ['Freight', 'StallClass', 'Discount', 'Surcharge', 'Clearance', 'Escort', 'Insurance'];

export const PRICE_CATEGORY_COLORS = {
  Freight: 'gold',
  StallClass: 'purple',
  Discount: 'green',
  Surcharge: 'orange',
  Clearance: 'blue',
  Escort: 'cyan',
  Insurance: 'magenta',
};

export const REQUIREMENT_DIRECTIONS = ['Export', 'Transit', 'Import'];

export const REQUIREMENT_DIRECTION_COLORS = { Export: 'orange', Transit: 'purple', Import: 'green' };

/**
 * Tiền tố / hậu tố cho ô nhập giá theo cách tính
 * @param {string} calcType
 * @param {(key: string, fallback?: string) => string} t
 * @returns {{ prefix?: string, suffix?: string }}
 */
export function priceInputAffix(calcType, t) {
  if (calcType === 'Multiplier') return { prefix: '×' };
  if (calcType === 'Percent') return { suffix: '%' };
  return { prefix: '$', suffix: t(`priceConfig.unit.${calcType}`, '') || undefined };
}

/**
 * Giá trị kèm đơn vị theo cách tính, ví dụ "$1/km/con", "×1.4", "8%"
 * @param {number} value
 * @param {string} calcType
 * @param {(key: string, opts?: Object) => string} t
 * @returns {string}
 */
export function formatPriceValue(value, calcType, t) {
  const n = Number(value) || 0;
  const usd = `$${n.toLocaleString('en-US', { maximumFractionDigits: 4 })}`;
  switch (calcType) {
    case 'Multiplier':
      return `×${n}`;
    case 'Percent':
      return `${n}%`;
    default:
      return `${usd}${t(`priceConfig.unit.${calcType}`, '')}`;
  }
}
