<<<<<<< HEAD
import { Checkbox, Space, Typography } from 'antd';
import { ExportOutlined } from '@ant-design/icons';
import { useTranslation } from 'react-i18next';
import { usePolicy } from '@hooks/usePolicy';
import { ROUTES } from '@routes/routes';

const { Text } = Typography;

/**
 * @file PolicyAgreement.jsx
 * @description Thành phần dùng chung (FE-15): Checkbox đồng ý Chính sách dịch vụ, hiển thị phiên bản động.
 * Dùng ở form đặt đơn (FE-02) và màn duyệt báo giá / cọc (FE-05).
 *
 * @param {object} props
 * @param {boolean} [props.checked] - Trạng thái đã tích chọn (controlled)
 * @param {boolean} [props.value] - Bí danh tương thích Form.Item của Ant Design
 * @param {(result: { accepted: boolean, policyVersion: string }) => void} [props.onChange] - Callback khi thay đổi
 * @param {boolean} [props.disabled=false] - Khóa ô chọn
 * @param {string} [props.error] - Thông báo lỗi nếu chưa tích
 * @param {React.CSSProperties} [props.style] - Style tùy biến
 * @param {string} [props.className] - Class tùy biến
 */
export function PolicyAgreement({
  checked,
  value,
  onChange,
  disabled = false,
  error = null,
  style = {},
  className = '',
}) {
  const { t } = useTranslation();
  const { policyVersion } = usePolicy();

  const isChecked = typeof checked === 'boolean' ? checked : Boolean(value);

  const handleChange = (e) => {
    const accepted = e.target.checked;
    if (onChange) {
      onChange({
        accepted,
        policyVersion,
      });
    }
  };

  const policyUrl = ROUTES.POLICY || '/chinh-sach';

  return (
    <div className={`policy-agreement-wrapper ${className}`} style={{ marginTop: 8, marginBottom: 8, ...style }}>
      <Checkbox
        checked={isChecked}
        onChange={handleChange}
        disabled={disabled}
        aria-label={t('policy.agreement.checkboxAria', 'Đồng ý với chính sách dịch vụ')}
      >
        <Space orientation="horizontal" size={4} wrap>
          <span>{t('policy.agreement.prefix', 'Tôi đã đọc và đồng ý với')}</span>
          <a
            href={policyUrl}
            target="_blank"
            rel="noopener noreferrer"
            style={{
              color: '#d97706',
              fontWeight: 600,
              textDecoration: 'underline',
              display: 'inline-flex',
              alignItems: 'center',
              gap: 2,
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <span>{t('policy.agreement.policyLinkText', 'Chính sách dịch vụ')}</span>
            <ExportOutlined style={{ fontSize: 11 }} />
          </a>
          <span style={{ color: '#64748b', fontSize: 12 }}>
            ({t('policy.agreement.versionLabel', 'phiên bản')} {policyVersion})
          </span>
        </Space>
      </Checkbox>

      {error && (
        <div style={{ marginTop: 4, marginLeft: 24 }}>
          <Text type="danger" style={{ fontSize: 13 }}>
            {error}
          </Text>
        </div>
      )}
    </div>
  );
}

export default PolicyAgreement;
=======
import { Checkbox, Spin, Typography } from 'antd';
import { Trans, useTranslation } from 'react-i18next';
import usePolicy from '@hooks/usePolicy';

// Trang Chính sách công khai (FE-15). TODO(FE-15): thêm route này
export const POLICY_PAGE_PATH = '/chinh-sach';

/**
 * Ô "Tôi đã đọc và đồng ý với Chính sách dịch vụ (phiên bản X)" + link mở trang chính sách ở tab mới.
 * Gửi kèm { acceptPolicy: accepted, policyVersion } khi tạo đơn / chấp nhận báo giá.
 * @param {{ accepted: boolean, onChange: (value: { accepted: boolean, policyVersion: string | null }) => void, disabled?: boolean, labelKey?: string }} props
 */
export default function PolicyAgreement({ accepted, onChange, disabled = false, labelKey = 'policyAgreement.label' }) {
  const { t } = useTranslation();
  const { policy, loading } = usePolicy();
  const version = policy?.version || null;

  if (loading) return <Spin size="small" />;
  if (!version) return <Typography.Text type="danger">{t('policyAgreement.unavailable')}</Typography.Text>;

  return (
    <Checkbox
      checked={accepted}
      disabled={disabled}
      onChange={(e) => onChange?.({ accepted: e.target.checked, policyVersion: version })}
    >
      <Trans
        i18nKey={labelKey}
        values={{ version }}
        components={{ policyLink: <a href={POLICY_PAGE_PATH} target="_blank" rel="noopener noreferrer" /> }}
      />
    </Checkbox>
  );
}
>>>>>>> main
