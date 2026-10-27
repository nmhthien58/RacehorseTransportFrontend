import { useState } from 'react';
import {
  Card,
  Descriptions,
  Button,
  Modal,
  Alert,
  Space,
  Tag,
  Typography,
  message,
} from 'antd';
import {
  UserOutlined,
  EditOutlined,
  CheckCircleOutlined,
  ExclamationCircleOutlined,
  PhoneOutlined,
} from '@ant-design/icons';
import { useTranslation } from 'react-i18next';
import dayjs from 'dayjs';
import RecipientForm from '@components/common/RecipientForm';
import { isRecipientValid } from '@utils/recipient';
import recipientService from '@services/recipientService';
import { getErrorMessage } from '@utils/apiHelpers';

const { Text } = Typography;

// Đang tạo CustomerRecipientSection vì quản lý thông tin người nhận, xác nhận có mặt và duyệt người nhận thay theo FE-13 (R-16, BE-15)
export default function CustomerRecipientSection({ booking, onChanged }) {
  const { t } = useTranslation();
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [confirmingPresence, setConfirmingPresence] = useState(false);
  const [approvingAlternate, setApprovingAlternate] = useState(false);

  const bookingId = booking?.bookingId || booking?.BookingID;
  const isSelf = Boolean(booking?.recipientIsCustomer);
  const recipientName = booking?.recipientName || (isSelf ? booking?.customerName : '—');
  const recipientPhone = booking?.recipientPhone || (isSelf ? booking?.customerPhone : '—');
  const recipientEmail = booking?.recipientEmail || (isSelf ? booking?.customerEmail : '—');
  const recipientIdNumber = booking?.recipientIdNumber || '—';
  const confirmedAt = booking?.recipientConfirmedAt;

  // Khóa sửa khi chuyến đã tới mốc trả
  const dropoffArrived = ['ArrivedDestination', 'Completed'].includes(booking?.tripStatus) ||
    Boolean(booking?.dropoffArrived);

  const [formState, setFormState] = useState({
    isCustomer: isSelf,
    name: booking?.recipientName || '',
    phone: booking?.recipientPhone || '',
    email: booking?.recipientEmail || '',
    idNumber: booking?.recipientIdNumber || '',
  });

  const handleOpenEdit = () => {
    setFormState({
      isCustomer: Boolean(booking?.recipientIsCustomer),
      name: booking?.recipientName || '',
      phone: booking?.recipientPhone || '',
      email: booking?.recipientEmail || '',
      idNumber: booking?.recipientIdNumber || '',
    });
    setEditModalOpen(true);
  };

  const handleSaveRecipient = async () => {
    if (!isRecipientValid(formState)) {
      message.error(t('bookingForm.recipient.invalid', 'Vui lòng điền đầy đủ họ tên và số điện thoại người nhận'));
      return;
    }
    setSaving(true);
    try {
      await recipientService.updateRecipient(bookingId, formState);
      message.success(t('bookingForm.recipient.updateSuccess', 'Cập nhật người nhận thành công'));
      setEditModalOpen(false);
      onChanged?.();
    } catch (err) {
      message.error(getErrorMessage(err, t('bookingForm.recipient.updateFailed', 'Không thể cập nhật người nhận')));
    } finally {
      setSaving(false);
    }
  };

  const handleConfirmPresence = async () => {
    setConfirmingPresence(true);
    try {
      await recipientService.confirmPresence(bookingId);
      message.success(t('bookingForm.recipient.presenceSuccess', 'Đã xác nhận người nhận sẽ có mặt tại điểm giao'));
      onChanged?.();
    } catch (err) {
      message.error(getErrorMessage(err, t('bookingForm.recipient.presenceFailed', 'Xác nhận có mặt thất bại')));
    } finally {
      setConfirmingPresence(false);
    }
  };

  const handleApproveAlternate = async (approved) => {
    setApprovingAlternate(true);
    try {
      await recipientService.approveAlternateRecipient(bookingId, {
        approved,
        name: booking?.alternateRecipientName,
      });
      message.success(
        approved
          ? t('bookingForm.recipient.alternateApproved', 'Đã đồng ý cho người nhận thay')
          : t('bookingForm.recipient.alternateRejected', 'Đã từ chối người nhận thay')
      );
      onChanged?.();
    } catch (err) {
      message.error(getErrorMessage(err, t('common.error', 'Thao tác thất bại')));
    } finally {
      setApprovingAlternate(false);
    }
  };

  return (
    <Card
      title={
        <Space>
          <UserOutlined style={{ color: '#2563EB' }} />
          <span>{t('bookingForm.recipient.sectionTitle', 'Thông tin người nhận ngựa')}</span>
        </Space>
      }
      extra={
        !dropoffArrived && (
          <Button
            size="small"
            icon={<EditOutlined />}
            onClick={handleOpenEdit}
          >
            {t('common.edit', 'Sửa thông tin')}
          </Button>
        )
      }
      style={{ marginBottom: 20 }}
    >
      {/* Banner cảnh báo nếu tài xế báo người nhận thay tại điểm giao */}
      {booking?.alternateRecipientName && !booking?.alternateRecipientApproved && (
        <Alert
          type="warning"
          showIcon
          icon={<ExclamationCircleOutlined />}
          style={{ marginBottom: 16 }}
          message={t('bookingForm.recipient.alternateTitle', 'Yêu cầu xác nhận người nhận thay')}
          description={
            <div>
              <p style={{ margin: '4px 0 8px' }}>
                {t('bookingForm.recipient.alternateDesc', {
                  name: booking.alternateRecipientName,
                  defaultValue: `Tài xế báo người nhận thực tế tại điểm giao là: ${booking.alternateRecipientName}. Bạn có đồng ý cho người này ký nhận thay không?`,
                })}
              </p>
              <Space>
                <Button
                  type="primary"
                  size="small"
                  loading={approvingAlternate}
                  onClick={() => handleApproveAlternate(true)}
                  style={{ backgroundColor: '#10B981', borderColor: '#10B981' }}
                >
                  {t('bookingForm.recipient.agree', 'Đồng ý nhận thay')}
                </Button>
                <Button
                  size="small"
                  danger
                  loading={approvingAlternate}
                  onClick={() => handleApproveAlternate(false)}
                >
                  {t('bookingForm.recipient.refuse', 'Từ chối')}
                </Button>
              </Space>
            </div>
          }
        />
      )}

      {/* Thẻ xác nhận có mặt khi sắp đến giờ giao */}
      <div
        style={{
          padding: 12,
          borderRadius: 8,
          background: confirmedAt ? '#F0FDF4' : '#FFFBEB',
          border: `1px solid ${confirmedAt ? '#BBF7D0' : '#FDE68A'}`,
          marginBottom: 16,
        }}
      >
        <Space style={{ width: '100%', justifyContent: 'space-between' }} wrap>
          <div>
            <Text strong style={{ color: confirmedAt ? '#166534' : '#92400E' }}>
              {confirmedAt
                ? t('bookingForm.recipient.presenceConfirmed', 'Đã xác nhận người nhận sẽ có mặt')
                : t('bookingForm.recipient.presencePrompt', 'Xác nhận người nhận sẽ có mặt tại điểm giao')}
            </Text>
            <div style={{ fontSize: 12, color: '#64748B', marginTop: 2 }}>
              {confirmedAt
                ? `${t('bookingForm.recipient.confirmedAt', 'Xác nhận lúc')}: ${dayjs(confirmedAt).format('DD/MM/YYYY HH:mm')}`
                : t('bookingForm.recipient.confirmHint', 'Vui lòng bấm xác nhận để tài xế và điều phối viên chuẩn bị bàn giao.')}
            </div>
          </div>
          <Space>
            {!confirmedAt && (
              <Button
                type="primary"
                size="small"
                icon={<CheckCircleOutlined />}
                loading={confirmingPresence}
                onClick={handleConfirmPresence}
                style={{ backgroundColor: '#F59E0B', borderColor: '#F59E0B', color: '#0F172A', fontWeight: 600 }}
              >
                {t('bookingForm.recipient.confirmButton', 'Xác nhận có mặt')}
              </Button>
            )}
            {!dropoffArrived && (
              <Button size="small" onClick={handleOpenEdit}>
                {t('bookingForm.recipient.changeRecipient', 'Đổi người nhận')}
              </Button>
            )}
          </Space>
        </Space>
      </div>

      <Descriptions column={{ xs: 1, sm: 2 }} size="small">
        <Descriptions.Item label={t('bookingForm.recipient.typeLabel', 'Hình thức nhận')}>
          {isSelf ? (
            <Tag color="blue">{t('bookingForm.recipient.selfTag', 'Khách hàng tự nhận')}</Tag>
          ) : (
            <Tag color="purple">{t('bookingForm.recipient.delegateTag', 'Người nhận được ủy quyền')}</Tag>
          )}
        </Descriptions.Item>
        <Descriptions.Item label={t('bookingForm.recipient.fullName', 'Họ và tên')}>
          <Text strong>{recipientName}</Text>
        </Descriptions.Item>
        <Descriptions.Item label={t('bookingForm.recipient.phone', 'Số điện thoại')}>
          <Space>
            <PhoneOutlined style={{ color: '#2563EB' }} />
            <Text>{recipientPhone}</Text>
          </Space>
        </Descriptions.Item>
        <Descriptions.Item label={t('bookingForm.recipient.email', 'Email')}>
          {recipientEmail}
        </Descriptions.Item>
        <Descriptions.Item label={t('bookingForm.recipient.idNumber', 'Số CMND / CCCD / Hộ chiếu')} span={2}>
          {recipientIdNumber}
        </Descriptions.Item>
      </Descriptions>

      {/* Modal sửa người nhận */}
      <Modal
        title={t('bookingForm.recipient.editModalTitle', 'Chỉnh sửa thông tin người nhận')}
        open={editModalOpen}
        onCancel={() => setEditModalOpen(false)}
        onOk={handleSaveRecipient}
        confirmLoading={saving}
        okText={t('common.save', 'Lưu thay đổi')}
        destroyOnClose
      >
        <div style={{ padding: '12px 0' }}>
          <RecipientForm
            value={formState}
            onChange={setFormState}
          />
        </div>
      </Modal>
    </Card>
  );
}
