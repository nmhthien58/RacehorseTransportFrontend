import { Checkbox, Space, Typography } from 'antd';
import { ExportOutlined } from '@ant-design/icons';
import { useTranslation } from 'react-i18next';
import { usePolicy } from '@hooks/usePolicy';
import { ROUTES } from '@routes/routes';

const { Text } = Typography;

const POLICY_PAGE_PATH = ROUTES.POLICY || '/chinh-sach';

/**
 * @file PolicyAgreement.jsx
 * @description Thành phần dùng chung (FE-15): Checkbox đồng ý Chính sách dịch vụ, hiển thị phiên bản động.
 * Dùng ở form đặt đơn (FE-02) và màn duyệt báo giá / cọc (FE-05).
 *
 * @param {object} props
 * @param {boolean} [props.checked] - Trạng thái đã tích chọn (controlled)
 * @param {boolean} [props.accepted] - Bí danh từ FE-02/FE-05
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
  accepted,
  onChange,
  disabled = false,
  error = null,
  style = {},
  className = '',
}) {
  const { t } = useTranslation();
  const { policy, policyVersion } = usePolicy();
  const version = policyVersion || policy?.version || policy?.PolicyVersion || '1.0';

  const isChecked = typeof accepted === 'boolean'
    ? accepted
    : typeof checked === 'boolean'
      ? checked
      : Boolean(value);

  const handleChange = (e) => {
    const isVal = e.target.checked;
    if (onChange) {
      onChange({
        accepted: isVal,
        policyVersion: version,
      });
    }
  };

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
            href={POLICY_PAGE_PATH}
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
            ({t('policy.agreement.versionLabel', 'phiên bản')} {version})
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
