import { useEffect, useState } from 'react';
import { Alert } from 'antd';
import { useTranslation } from 'react-i18next';
import dayjs from 'dayjs';

/**
 * Số mili giây còn phải nghỉ tại mốc (0 = đã nghỉ đủ). Tính từ lúc xe tới mốc, giống backend.
 * @param {string|null|undefined} arrivedAt
 * @param {number|null|undefined} restMinutes
 * @returns {number}
 */
// eslint-disable-next-line react-refresh/only-export-components
export function restRemainingMs(arrivedAt, restMinutes) {
  if (!arrivedAt || !restMinutes) return 0;
  return Math.max(0, dayjs(arrivedAt).add(restMinutes, 'minute').valueOf() - Date.now());
}

const pad = (n) => String(n).padStart(2, '0');

/**
 * Đồng hồ đếm ngược thời gian nghỉ bắt buộc của ngựa tại mốc; tự cập nhật mỗi giây.
 * @param {{ arrivedAt?: string, restMinutes?: number }} props
 */
export default function RestCountdown({ arrivedAt, restMinutes }) {
  const { t } = useTranslation();
  const [left, setLeft] = useState(() => restRemainingMs(arrivedAt, restMinutes));

  useEffect(() => {
    if (!arrivedAt || !restMinutes) return undefined;
    const timer = setInterval(() => setLeft(restRemainingMs(arrivedAt, restMinutes)), 1000);
    return () => clearInterval(timer);
  }, [arrivedAt, restMinutes]);

  if (!arrivedAt || !restMinutes) return null;
  if (left <= 0) {
    return <Alert type="success" showIcon style={{ width: '100%' }} title={t('restCountdown.rested', { minutes: restMinutes })} />;
  }
  const total = Math.ceil(left / 1000);
  const time = `${Math.floor(total / 3600) > 0 ? `${Math.floor(total / 3600)}:` : ''}${pad(Math.floor((total % 3600) / 60))}:${pad(total % 60)}`;
  return (
    <Alert
      type="warning"
      showIcon
      style={{ width: '100%' }}
      title={t('restCountdown.resting', {
        time,
        minutes: restMinutes,
        until: dayjs(arrivedAt).add(restMinutes, 'minute').format('HH:mm'),
      })}
    />
  );
}
