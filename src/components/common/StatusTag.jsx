import { Tag } from 'antd';
import { useTranslation } from 'react-i18next';

/**
 * Bảng màu chuẩn hóa cho từng nhóm trạng thái
 */
const STATUS_COLORS = {
  // Thành công / Hoàn thành (Green)
  Approved: 'success',
  Cleared: 'success',
  Completed: 'success',
  Resolved: 'success',
  Available: 'success',
  Departed: 'success',

  // Đang xử lý / Thông tin (Blue / Cyan)
  Submitted: 'processing',
  Assigned: 'cyan',
  Reviewing: 'processing',
  Scheduled: 'blue',
  SubmittedToAuthorities: 'geekblue',

  // Cảnh báo / Trung gian cần chú ý (Orange / Volcano / Gold)
  InTransit: 'orange',
  EmergencyRerouting: 'volcano',
  AwaitingDocs: 'gold',
  PendingApproval: 'gold',
  PlanProposed: 'orange',
  Arrived: 'gold',
  ArrivedDestination: 'green',

  // Thất bại / Hủy / Từ chối (Red / Error)
  Rejected: 'error',
  Cancelled: 'error',
  Expired: 'error',
  Issue: 'error',

  // Khởi tạo / Mặc định (Default)
  Draft: 'default',
  Pending: 'default',
  Maintenance: 'warning',
};

/**
 * Ánh xạ trạng thái sang key i18n
 */
const STATUS_I18N_KEYS = {
  Submitted: 'status.submitted',
  Approved: 'status.approved',
  Assigned: 'status.assigned',
  Completed: 'status.completed',
  Rejected: 'status.rejected',
  Expired: 'status.expired',
  Cancelled: 'status.cancelled',
  Draft: 'status.draft',
  Pending: 'status.pending',
  PendingApproval: 'status.pendingApproval',
  Scheduled: 'status.scheduled',
  InTransit: 'status.inTransit',
  EmergencyRerouting: 'status.emergencyRerouting',
  ArrivedDestination: 'status.arrivedDestination',
  AwaitingDocs: 'status.awaitingDocs',
  Reviewing: 'status.reviewing',
  SubmittedToAuthorities: 'status.submittedToAuthorities',
  Cleared: 'status.cleared',
  Issue: 'status.issue',
  Reported: 'status.reported',
  PlanProposed: 'status.planProposed',
  Resolved: 'status.resolved',
  Available: 'status.available',
  Maintenance: 'status.maintenance',
  Arrived: 'status.arrived',
  Departed: 'status.departed',
};

/**
 * Component hiển thị nhãn trạng thái chuẩn hóa với Ant Design Tag và đa ngôn ngữ
 * @param {{ status: string, style?: React.CSSProperties }} props
 * @returns {JSX.Element}
 */
export default function StatusTag({ status, style }) {
  const { t } = useTranslation();

  if (!status) return null;

  const color = STATUS_COLORS[status] || 'default';
  const i18nKey = STATUS_I18N_KEYS[status];
  const label = i18nKey ? t(i18nKey) : status;

  return (
    <Tag color={color} style={{ fontWeight: 500, ...style }}>
      {label}
    </Tag>
  );
}
