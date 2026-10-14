import { Tag } from 'antd';
import { useTranslation } from 'react-i18next';

const STATUS_CONFIGS = {
  Cleared: {
    bg: '#F0FDF4',
    border: '#DCFCE7',
    color: '#166534',
    key: 'specialist.status.cleared',
    defaultText: 'Cleared',
  },
  SubmittedToAuthorities: {
    bg: '#F8FAFC',
    border: '#E2E8F0',
    color: '#334155',
    key: 'specialist.status.submitted',
    defaultText: 'Submitted',
  },
  Reviewing: {
    bg: '#FFFBEB',
    border: '#FEF3C7',
    color: '#92400E',
    key: 'specialist.status.reviewing',
    defaultText: 'Reviewing',
  },
  AwaitingDocs: {
    bg: '#F8FAFC',
    border: '#E2E8F0',
    color: '#475569',
    key: 'specialist.status.awaitingDocs',
    defaultText: 'Awaiting Docs',
  },
  Issue: {
    bg: '#FEF2F2',
    border: '#FEE2E2',
    color: '#991B1B',
    key: 'specialist.status.issue',
    defaultText: 'Issue',
  },
  Draft: {
    bg: '#F8FAFC',
    border: '#E2E8F0',
    color: '#64748B',
    key: 'specialist.status.draft',
    defaultText: 'Draft',
  },
};

/**
 * Component hiển thị Tag trạng thái của Hồ sơ kiểm dịch
 * @param {Object} props
 * @param {string} props.status - Trạng thái của dossier
 * @param {Object} [props.style] - Style bổ sung
 * @returns {JSX.Element}
 */
export default function DossierStatusTag({ status, style }) {
  const { t } = useTranslation();
  const config = STATUS_CONFIGS[status] || STATUS_CONFIGS.Draft;

  return (
    <Tag
      style={{
        backgroundColor: config.bg,
        borderColor: config.border,
        color: config.color,
        borderRadius: 4,
        fontSize: 12,
        ...style,
      }}
    >
      {t(config.key, config.defaultText)}
    </Tag>
  );
}
