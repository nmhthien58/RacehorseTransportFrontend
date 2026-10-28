import { Checkbox, Spin, Typography } from 'antd';
import { Trans, useTranslation } from 'react-i18next';
import usePolicy from '@hooks/usePolicy';
import { ROUTES } from '@routes/routes';

// Trang Chính sách công khai (FE-15)
export const POLICY_PAGE_PATH = ROUTES.POLICY;

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
