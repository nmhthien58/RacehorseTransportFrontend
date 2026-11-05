import { Alert, Space, Tag, Typography } from 'antd';
import dayjs from 'dayjs';

const { Text } = Typography;

/**
 * Hạn giao khách đã đặt cho từng đơn trên chuyến, kèm cảnh báo khi đã quá hạn mà chưa giao
 * @param {{ bookings: Array<{ bookingId: number, bookingCode: string, deliveryDeadline: string, handoverCompleted?: boolean }>, compact?: boolean }} props
 * @returns {JSX.Element|null}
 */
export default function DeliveryDeadlineList({ bookings = [], compact = false }) {
  const list = bookings.filter((b) => b.deliveryDeadline);
  if (list.length === 0) return null;

  const now = dayjs();
  const overdue = list.filter((b) => !b.handoverCompleted && now.isAfter(dayjs(b.deliveryDeadline)));

  return (
    <div>
      {overdue.length > 0 && !compact && (
        <Alert
          type="error"
          showIcon
          style={{ marginBottom: 8 }}
          message={`Đã quá hạn giao: ${overdue.map((b) => b.bookingCode).join(', ')}`}
          description="Giao trễ do lỗi công ty quá 6 giờ sẽ phát sinh bồi thường giao trễ khi đóng chuyến."
        />
      )}
      <Space direction="vertical" size={4} style={{ width: '100%' }}>
        {list.map((b) => {
          const deadline = dayjs(b.deliveryDeadline);
          const lateHours = Math.floor(now.diff(deadline, 'minute') / 60);
          let tag;
          if (b.handoverCompleted) {
            tag = <Tag color="default">Đã giao</Tag>;
          } else if (now.isAfter(deadline)) {
            tag = <Tag color="error">Quá hạn {lateHours} giờ</Tag>;
          } else if (deadline.diff(now, 'hour') < 24) {
            tag = <Tag color="warning">Còn {Math.max(deadline.diff(now, 'hour'), 0)} giờ</Tag>;
          } else {
            tag = <Tag color="success">Trong hạn</Tag>;
          }
          return (
            <div key={b.bookingId} style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
              <Text strong>{b.bookingCode}</Text>
              <Text type="secondary">Hạn giao trễ nhất: {deadline.format('DD/MM/YYYY HH:mm')}</Text>
              {tag}
            </div>
          );
        })}
      </Space>
    </div>
  );
}
