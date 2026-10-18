import { Alert, Card, Space, Table, Tag, Typography } from 'antd';
import { useTranslation } from 'react-i18next';
import dayjs from 'dayjs';

const { Text, Title } = Typography;

const formatTime = (value) => (value ? dayjs(value).format('DD/MM/YYYY HH:mm') : '—');

// Tham số dạng ngày giờ ISO trong cảnh báo -> hiển thị theo giờ máy người dùng
const DATE_PARAMS = ['eta', 'deadline', 'pickupAt'];

const SEVERITY_TYPE = { Error: 'error', Warning: 'warning', Info: 'info' };

/**
 * Kết quả POST /trips/suggest-route: tổng quãng đường / thời gian, giờ đón - giờ giao từng đơn so với hạn giao,
 * và các cảnh báo khi ghép đơn (lỗi sẽ chặn trình duyệt, cảnh báo nên xem lại, gợi ý).
 * @param {Object} props
 * @param {Object} props.suggestion - data của POST /trips/suggest-route
 * @returns {JSX.Element|null}
 */
export default function RouteSuggestionPanel({ suggestion }) {
  const { t } = useTranslation();
  if (!suggestion) return null;

  const warningText = (w) => {
    const params = { ...w.params };
    DATE_PARAMS.forEach((key) => {
      if (params[key]) params[key] = formatTime(params[key]);
    });
    return t(`tripPlan.warnings.${w.code}`, { ...params, defaultValue: w.message });
  };

  return (
    <Card size="small" style={{ borderRadius: 12, background: '#FFFBEB', borderColor: '#FDE68A' }}>
      <Space direction="vertical" size={10} style={{ width: '100%' }}>
        <div>
          <Title level={5} style={{ margin: 0 }}>
            {t('tripPlan.suggestion.title')}
          </Title>
          <Text type="secondary" style={{ fontSize: 12 }}>
            {t('tripPlan.suggestion.summary', {
              km: Number(suggestion.totalDistanceKm || 0).toLocaleString('vi-VN'),
              hours: suggestion.totalHours,
              end: formatTime(suggestion.suggestedEndDate),
            })}
          </Text>
        </div>

        <Table
          size="small"
          rowKey="bookingId"
          pagination={false}
          dataSource={suggestion.bookings || []}
          scroll={{ x: 640 }}
          columns={[
            { title: t('tripPlan.fields.stopBooking'), dataIndex: 'bookingCode', render: (v) => <Text strong>{v}</Text> },
            { title: t('tripPlan.fields.pickupAt'), dataIndex: 'pickupAt', render: formatTime },
            { title: t('tripPlan.fields.eta'), dataIndex: 'estimatedDeliveryAt', render: formatTime },
            { title: t('tripPlan.fields.deadline'), dataIndex: 'deliveryDeadline', render: formatTime },
            {
              title: '',
              dataIndex: 'onTime',
              render: (onTime) => (
                <Tag color={onTime ? 'success' : 'error'}>{onTime ? t('tripPlan.suggestion.onTime') : t('tripPlan.suggestion.late')}</Tag>
              ),
            },
            {
              title: t('tripPlan.fields.routeKm'),
              render: (_, b) => (
                <span style={{ whiteSpace: 'nowrap' }}>
                  {b.routeDistanceKm} km
                  {b.detourRatio ? (
                    <Text type="secondary" style={{ marginLeft: 6 }}>
                      {t('tripPlan.suggestion.detour', { ratio: b.detourRatio })}
                    </Text>
                  ) : null}
                </span>
              ),
            },
          ]}
        />

        {(suggestion.warnings || []).map((w, idx) => (
          <Alert key={`${w.code}-${idx}`} type={SEVERITY_TYPE[w.severity] || 'info'} showIcon message={warningText(w)} />
        ))}

        <Text type="secondary" style={{ fontSize: 12 }}>
          {t('tripPlan.suggestion.hint')}
        </Text>
      </Space>
    </Card>
  );
}
