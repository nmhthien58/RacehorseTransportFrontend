/**
 * Chi phí hiển thị của đơn: có giá chốt thì dùng giá chốt,
 * chưa có thì dùng khoảng giá ước tính lúc khách gửi đơn (R-10).
 * @param {{ estimatedCost?: number, quoteMin?: number, quoteMax?: number, currencyCode?: string }} booking
 * @returns {string}
 */
export const formatBookingCost = (booking) => {
  const currency = booking?.currencyCode || 'USD';
  const fmt = (v) =>
    new Intl.NumberFormat('en-US', { style: 'currency', currency, maximumFractionDigits: 0 }).format(v);
  const finalCost = Number(booking?.estimatedCost) || 0;
  if (finalCost > 0) return fmt(finalCost);
  const min = Number(booking?.quoteMin) || 0;
  const max = Number(booking?.quoteMax) || 0;
  if (min <= 0 && max <= 0) return '—';
  if (min === max || max <= 0) return `≈ ${fmt(min || max)}`;
  return `≈ ${fmt(min)} – ${fmt(max)}`;
};
