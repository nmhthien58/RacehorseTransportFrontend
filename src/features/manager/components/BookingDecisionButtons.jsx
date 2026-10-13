import { Button, Space } from 'antd';
import { CheckOutlined, CloseOutlined } from '@ant-design/icons';
import { useTranslation } from 'react-i18next';

/**
 * Cụm nút quyết định Duyệt / Từ chối yêu cầu vận chuyển dành cho Quản lý.
 * Đồng bộ màu sắc thương hiệu (#F59E0B) và style Figma giữa BookingDetailPage và PendingRequestsPage.
 *
 * @param {Object} props
 * @param {Function} props.onApprove - Callback khi bấm nút Phê duyệt
 * @param {Function} props.onReject - Callback khi bấm nút Từ chối
 */
export default function BookingDecisionButtons({ onApprove, onReject }) {
  const { t } = useTranslation();

  return (
    <Space direction="vertical" size={12} style={{ width: '100%' }}>
      <Button
        type="primary"
        block
        size="large"
        icon={<CheckOutlined style={{ fontWeight: 700 }} />}
        style={{
          height: 48,
          backgroundColor: '#F59E0B',
          borderColor: '#F59E0B',
          color: '#0f172a',
          fontWeight: 700,
          fontSize: 15,
          borderRadius: 10,
          boxShadow: '0 2px 4px rgba(245, 158, 11, 0.25)',
        }}
        onClick={onApprove}
      >
        {t('manager.pendingRequests.approveBtn')}
      </Button>

      <Button
        block
        size="large"
        icon={<CloseOutlined style={{ fontWeight: 700 }} />}
        style={{
          height: 48,
          backgroundColor: '#FEF2F2',
          borderColor: '#FECACA',
          color: '#DC2626',
          fontWeight: 700,
          fontSize: 15,
          borderRadius: 10,
        }}
        onClick={onReject}
      >
        {t('manager.pendingRequests.rejectBtn')}
      </Button>
    </Space>
  );
}
