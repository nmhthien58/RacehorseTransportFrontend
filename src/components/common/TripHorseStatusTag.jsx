import { Tag } from 'antd';
import { useTranslation } from 'react-i18next';

// Màu cho trạng thái của một con ngựa trên chuyến (R-05)
const COLORS = {
  Planned: 'default',
  InTransit: 'orange',
  Delivered: 'success',
  Offloaded: 'volcano',
  Cancelled: 'error',
};

/**
 * Nhãn trạng thái của một con ngựa trên chuyến: Planned / InTransit / Delivered / Offloaded / Cancelled.
 * Tách khỏi StatusTag vì "InTransit" ở đây là trạng thái của ngựa, không phải của chuyến.
 * @param {Object} props
 * @param {string} props.status
 * @returns {JSX.Element|null}
 */
export default function TripHorseStatusTag({ status }) {
  const { t } = useTranslation();
  if (!status) return null;
  return <Tag color={COLORS[status] || 'default'}>{t(`tripHorseStatus.${status}`, status)}</Tag>;
}
