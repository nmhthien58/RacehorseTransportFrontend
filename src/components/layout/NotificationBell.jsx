import { useCallback, useEffect, useRef, useState } from 'react';
import { Badge, Button, Empty, Flex, Popover, Spin, notification } from 'antd';
import { BellOutlined } from '@ant-design/icons';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import dayjs from 'dayjs';
import { ROUTES } from '@routes/routes';
import { useNotifications } from '@hooks/useNotifications';
import incidentService from '@services/incidentService';
import { unwrapData } from '@utils/apiHelpers';

/**
 * Trang mở ra khi bấm một thông báo, theo role người dùng và loại đối tượng thông báo nhắc tới.
 * @param {string} role - Role của người dùng (giá trị từ backend)
 * @param {import('@services/notificationService').NotificationItem} item
 * @returns {string|null}
 */
function getNotificationTarget(role, item) {
  const { referenceType: type, referenceId: id } = item;
  switch (role) {
    case 'Customer':
      if (type === 'Booking' && id) return ROUTES.CUSTOMER_BOOKING_DETAIL.replace(':id', id);
      if (type === 'Trip' && id) return ROUTES.CUSTOMER_TRIP_DETAIL.replace(':tripId', id);
      if (type === 'Incident') return ROUTES.CUSTOMER_TRIPS;
      return ROUTES.CUSTOMER_BOOKINGS;
    case 'LogisticsManager':
    case 'Admin':
      if (type === 'Booking' && id) return ROUTES.MANAGER_BOOKING_DETAIL.replace(':id', id);
      if (type === 'Trip') return ROUTES.MANAGER_ROUTE_APPROVALS;
      if (type === 'Incident') return ROUTES.MANAGER_INCIDENTS;
      return ROUTES.MANAGER_BOOKINGS;
    case 'TransportSpecialist':
      if (type === 'Dossier' && id) return ROUTES.SPECIALIST_DOSSIER_DETAIL.replace(':id', id);
      return ROUTES.SPECIALIST_DOSSIERS;
    case 'FleetCoordinator':
      if (type === 'Trip') return ROUTES.COORDINATOR_TRACKING;
      if (type === 'Incident') return ROUTES.COORDINATOR_INCIDENTS;
      if (type === 'Booking') return ROUTES.COORDINATOR_ROUTE_PLANNING;
      return ROUTES.COORDINATOR_DASHBOARD;
    case 'DriverEscort':
    case 'Driver':
    case 'Escort':
      if (type === 'Trip' && id) return ROUTES.DRIVER_EXECUTION.replace(':tripId', id);
      return ROUTES.DRIVER_MISSIONS;
    default:
      return null;
  }
}

/**
 * Chuông thông báo trên header: số chưa đọc, danh sách 10 thông báo mới nhất,
 * toast khi có thông báo realtime (SignalR) đẩy về.
 * @param {{ role?: string }} props
 * @returns {JSX.Element}
 */
export default function NotificationBell({ role }) {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  // Toast được tạo trước khi hook trả về markAsRead, nên giữ hàm mới nhất trong ref
  const markAsReadRef = useRef(null);

  const openItem = useCallback(
    async (item) => {
      // Đoàn xe: thông báo sự cố chỉ có mã sự cố, tra ra chuyến để mở thẳng khung "Sự cố & phương án xử lý"
      if (role === 'DriverEscort' && item.referenceType === 'Incident' && item.referenceId) {
        try {
          const incident = unwrapData(await incidentService.getIncidentById(item.referenceId));
          if (incident?.tripId) {
            navigate(`${ROUTES.DRIVER_EXECUTION.replace(':tripId', incident.tripId)}#incidents`);
            return;
          }
        } catch {
          // Không tra được thì về danh sách nhiệm vụ như trước
        }
      }
      const target = getNotificationTarget(role, item);
      if (target) navigate(target);
    },
    [role, navigate],
  );

  const handleReceived = useCallback(
    (item) => {
      const key = `notification-${item.notificationId}`;
      notification.open({
        key,
        title: <strong>{item.title}</strong>,
        description: item.message,
        icon: <BellOutlined style={{ color: '#F59E0B' }} />,
        placement: 'topRight',
        duration: 8,
        style: { cursor: 'pointer' },
        onClick: () => {
          notification.destroy(key);
          markAsReadRef.current?.(item.notificationId);
          openItem(item);
        },
      });
    },
    [openItem],
  );

  const { items, unreadCount, loading, markAsRead, markAllAsRead } = useNotifications({
    onReceived: handleReceived,
  });
  useEffect(() => {
    markAsReadRef.current = markAsRead;
  }, [markAsRead]);

  const handleItemClick = (item) => {
    setOpen(false);
    markAsRead(item.notificationId);
    openItem(item);
  };

  const content = (
    <div style={{ width: 360, maxWidth: '90vw' }}>
      <Flex
        justify="space-between"
        align="center"
        style={{ marginBottom: 12, paddingBottom: 8, borderBottom: '1px solid #f1f5f9' }}
      >
        <strong style={{ fontSize: 14.5, color: '#0f172a' }}>{t('notifications.title')}</strong>
        {unreadCount > 0 && (
          <Button type="link" size="small" onClick={markAllAsRead} style={{ padding: 0, fontSize: 12 }}>
            {t('notifications.markAllRead')}
          </Button>
        )}
      </Flex>

      <Spin spinning={loading && items.length === 0}>
        {items.length === 0 ? (
          <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description={t('notifications.empty')} />
        ) : (
          <div style={{ maxHeight: 360, overflowY: 'auto' }}>
            {items.map((item) => (
              <div
                key={item.notificationId}
                role="button"
                tabIndex={0}
                onClick={() => handleItemClick(item)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    handleItemClick(item);
                  }
                }}
                style={{
                  padding: '10px 12px',
                  borderRadius: 10,
                  backgroundColor: item.isRead ? '#ffffff' : '#fffbeb',
                  border: item.isRead ? '1px solid #f1f5f9' : '1px solid #fde68a',
                  marginBottom: 8,
                  cursor: 'pointer',
                }}
              >
                <strong style={{ fontSize: 13, color: item.isRead ? '#334155' : '#92400e' }}>{item.title}</strong>
                <div style={{ fontSize: 12, color: '#64748b', marginTop: 4, lineHeight: 1.35 }}>{item.message}</div>
                <div style={{ fontSize: 11, color: '#94a3b8', marginTop: 4 }}>
                  {dayjs(item.createdAt).format('DD/MM/YYYY HH:mm')}
                </div>
              </div>
            ))}
          </div>
        )}
      </Spin>
    </div>
  );

  return (
    <Popover content={content} trigger="click" placement="bottomRight" open={open} onOpenChange={setOpen}>
      <Badge count={unreadCount} overflowCount={9} offset={[-4, 4]}>
        <Button
          type="text"
          shape="circle"
          icon={<BellOutlined style={{ fontSize: 20, color: '#1e293b' }} />}
          aria-label={t('notifications.ariaLabel')}
        />
      </Badge>
    </Popover>
  );
}
