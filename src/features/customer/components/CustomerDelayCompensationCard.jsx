import { useEffect, useState } from 'react';
import { Card, Space, Typography, Descriptions } from 'antd';
import { ClockCircleOutlined } from '@ant-design/icons';
import { useTranslation } from 'react-i18next';
import delayCompensationService from '@services/delayCompensationService';
import { unwrapList } from '@utils/apiHelpers';
import StatusTag from '@components/common/StatusTag';

const { Text } = Typography;

// Đang sửa CustomerDelayCompensationCard vì bỏ import thừa Tag
export default function CustomerDelayCompensationCard({ bookingId }) {
  const { t } = useTranslation();
  const [compensations, setCompensations] = useState([]);

  useEffect(() => {
    if (!bookingId) return;
    let active = true;
    delayCompensationService
      .getByBooking(bookingId)
      .then((res) => {
        if (active) setCompensations(unwrapList(res));
      })
      .catch(() => {});
    return () => {
      active = false;
    };
  }, [bookingId]);

  if (compensations.length === 0) return null;

  return (
    <Card
      title={
        <Space>
          <ClockCircleOutlined style={{ color: '#EA580C' }} />
          <span>{t('delayCompensation.title', 'Bồi thường giao trễ (R-09)')}</span>
        </Space>
      }
      style={{ marginBottom: 20, borderColor: '#FED7AA', background: '#FFF7ED' }}
    >
      {compensations.map((item, idx) => (
        <div key={item.compensationId || idx} style={{ marginBottom: idx < compensations.length - 1 ? 12 : 0 }}>
          <Descriptions column={{ xs: 1, sm: 3 }} size="small">
            <Descriptions.Item label={t('delayCompensation.delayHours', 'Thời gian trễ')}>
              <Text strong style={{ color: '#C2410C' }}>{item.delayHours} {t('common.hours', 'giờ')}</Text>
            </Descriptions.Item>
            <Descriptions.Item label={t('delayCompensation.amount', 'Số tiền bồi thường')}>
              <Text strong style={{ color: '#047857', fontSize: 15 }}>
                {Number(item.amountUsd || item.amount || 0).toLocaleString()} USD
              </Text>
            </Descriptions.Item>
            <Descriptions.Item label={t('delayCompensation.status', 'Trạng thái')}>
              <StatusTag status={item.status} />
            </Descriptions.Item>
          </Descriptions>
          {item.reason && (
            <div style={{ marginTop: 6, fontSize: 12, color: '#78350F' }}>
              <Text type="secondary">{t('delayCompensation.reason', 'Nguyên nhân')}:</Text> {item.reason}
            </div>
          )}
        </div>
      ))}
    </Card>
  );
}
