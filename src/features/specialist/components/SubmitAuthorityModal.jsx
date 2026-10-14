import { Modal, Button, Typography, Space, Divider } from 'antd';
import { CheckCircleOutlined, InfoCircleOutlined } from '@ant-design/icons';
import { useTranslation } from 'react-i18next';

const { Text } = Typography;

/**
 * Util 4: Submit to Authority Modal (Frame 144:14598 - Reject_Request_2)
 * Modal xác nhận nộp hồ sơ kiểm dịch đã thẩm định hoàn chỉnh lên Cơ quan chức năng
 * @param {Object} props
 * @param {boolean} props.open - Trạng thái hiển thị modal
 * @param {Object} props.dossier - Thông tin hồ sơ đang xử lý
 * @param {boolean} props.loading - Trạng thái đang gửi yêu cầu
 * @param {Function} props.onCancel - Đóng modal
 * @param {Function} props.onConfirm - Xác nhận nộp hồ sơ
 * @returns {JSX.Element}
 */
export default function SubmitAuthorityModal({
  open,
  dossier,
  loading,
  onCancel,
  onConfirm,
}) {
  const { t } = useTranslation();

  const checklistItems = [
    t('specialist.submit.checkAudit', 'Tất cả tài liệu đã thẩm định đạt 3-Point Audit'),
    t('specialist.submit.checkIdentity', 'Mã vi mạch RFID và Hộ chiếu FEI đã đối chiếu trùng khớp'),
    t('specialist.submit.checkValidity', 'Chứng nhận kiểm dịch y tế và xét nghiệm còn hạn hiệu lực'),
    t('specialist.submit.checkNoPending', 'Không có tài liệu nào đang bị yêu cầu bổ sung hoặc từ chối'),
  ];

  return (
    <Modal
      title={
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <CheckCircleOutlined style={{ color: '#166534', fontSize: 18 }} />
          <div style={{ color: '#166534', fontWeight: 700, fontSize: 16 }}>
            {t('specialist.submit.modalTitle', 'Nộp hồ sơ lên Cơ quan chức năng')}
          </div>
        </div>
      }
      open={open}
      onCancel={onCancel}
      footer={null}
      destroyOnClose
      width={540}
      styles={{
        header: {
          borderBottom: '1px solid #DCFCE7',
          paddingBottom: 12,
          marginBottom: 16,
        },
      }}
    >
      <div style={{ marginBottom: 14 }}>
        <Text style={{ fontSize: 13, color: '#475569' }}>
          {t('specialist.submit.readyDesc', 'Toàn bộ giấy tờ đã được thẩm định đạt chuẩn và sẵn sàng nộp lên Cục Thú y / Chi cục Hải quan cửa khẩu.')}
        </Text>
      </div>

      {/* Bảng tóm tắt thông tin hồ sơ */}
      <div
        style={{
          backgroundColor: '#F8FAFC',
          border: '1px solid #E2E8F0',
          borderRadius: 6,
          padding: '12px 14px',
          marginBottom: 16,
        }}
      >
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px 12px', fontSize: 13 }}>
          <div>
            <span style={{ color: '#64748B' }}>{t('specialist.dossiers.colCode', 'Mã hồ sơ')}:</span>{' '}
            <strong style={{ color: '#0F172A' }}>{dossier?.dossierCode}</strong>
          </div>
          <div>
            <span style={{ color: '#64748B' }}>{t('specialist.submit.orderCode', 'Mã đơn đặt')}:</span>{' '}
            <strong style={{ color: '#0F172A' }}>{dossier?.bookingCode}</strong>
          </div>
          <div>
            <span style={{ color: '#64748B' }}>{t('specialist.dossiers.colHorse', 'Cá thể')}:</span>{' '}
            <strong style={{ color: '#0F172A' }}>{dossier?.horseName}</strong>
          </div>
          <div>
            <span style={{ color: '#64748B' }}>{t('specialist.submit.verifiedRate', 'Thẩm định')}:</span>{' '}
            <strong style={{ color: '#166534' }}>{dossier?.approvedCount || 3}/{dossier?.requiredCount || 3} (100%)</strong>
          </div>
          <div style={{ gridColumn: 'span 2' }}>
            <span style={{ color: '#64748B' }}>{t('specialist.submit.authorityTarget', 'Cơ quan thẩm quyền')}:</span>{' '}
            <strong style={{ color: '#0F172A' }}>
              {dossier?.dropoffCountryCode === 'CN'
                ? 'Tổng cục Hải quan Trung Quốc (GACC)'
                : dossier?.dropoffCountryCode === 'TH'
                ? 'Cục Phát triển Chăn nuôi Thái Lan (DLD)'
                : 'Cục Thú y & Chi cục Kiểm dịch Cửa khẩu'}
            </strong>
          </div>
        </div>
      </div>

      {/* Pre-submission Checklist */}
      <div style={{ marginBottom: 16 }}>
        <Text strong style={{ fontSize: 13, color: '#1E293B', display: 'block', marginBottom: 8 }}>
          {t('specialist.submit.checklistTitle', 'Danh mục kiểm tra tiền nộp hồ sơ (Pre-submission):')}
        </Text>
        <Space direction="vertical" size={6} style={{ width: '100%' }}>
          {checklistItems.map((item, idx) => (
            <div
              key={idx}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 8,
                fontSize: 12,
                color: '#334155',
              }}
            >
              <CheckCircleOutlined style={{ color: '#166534', fontSize: 14 }} />
              <span>{item}</span>
            </div>
          ))}
        </Space>
      </div>

      {/* Ghi chú chuyển trạng thái */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 6,
          fontSize: 12,
          color: '#64748B',
          marginBottom: 20,
        }}
      >
        <InfoCircleOutlined style={{ color: '#2563EB' }} />
        <span>
          {t('specialist.submit.statusNotice', 'Trạng thái hồ sơ sẽ chuyển sang Submitted to Authority sau khi xác nhận.')}
        </span>
      </div>

      <Divider style={{ margin: '12px 0 16px 0' }} />

      {/* Footer buttons */}
      <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10 }}>
        <Button onClick={onCancel} style={{ borderRadius: 4 }}>
          {t('specialist.submit.reviewBtn', 'Xem lại')}
        </Button>
        <Button
          type="primary"
          loading={loading}
          style={{
            backgroundColor: '#0F172A',
            borderColor: '#0F172A',
            borderRadius: 4,
            fontWeight: 500,
          }}
          onClick={onConfirm}
        >
          {t('specialist.submit.confirmBtn', 'Xác nhận nộp hồ sơ')}
        </Button>
      </div>
    </Modal>
  );
}
