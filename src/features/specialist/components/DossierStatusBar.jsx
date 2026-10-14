import { Steps, Badge, Alert, Card } from 'antd';
import { CheckCircleFilled, CloseCircleFilled } from '@ant-design/icons';
import { useTranslation } from 'react-i18next';

/**
 * Danh sách 5 bước theo vòng đời DigitalDossier:
 * Draft → AwaitingDocs → Reviewing → SubmittedToAuthorities → Cleared
 */
const STATUS_STEPS = [
  { key: 'Draft', titleKey: 'specialist.statusBar.steps.draft', defaultTitle: 'Bản nháp' },
  { key: 'AwaitingDocs', titleKey: 'specialist.statusBar.steps.awaitingDocs', defaultTitle: 'Chờ bổ sung giấy tờ' },
  { key: 'Reviewing', titleKey: 'specialist.statusBar.steps.reviewing', defaultTitle: 'Đang thẩm định' },
  { key: 'SubmittedToAuthorities', titleKey: 'specialist.statusBar.steps.submitted', defaultTitle: 'Đã nộp cơ quan chức năng' },
  { key: 'Cleared', titleKey: 'specialist.statusBar.steps.cleared', defaultTitle: 'Đã thông quan' },
];

/**
 * Component thanh trạng thái hiển thị tiến trình của bộ hồ sơ kiểm dịch
 * @param {{ status: string, issueReason?: string }} props
 * @returns {JSX.Element}
 */
export default function DossierStatusBar({ status = 'Draft', issueReason = null }) {
  const { t } = useTranslation();

  const isIssue = status === 'Issue';
  const isCleared = status === 'Cleared';

  // Xác định vị trí bước hiện tại (0..4)
  let currentIndex = STATUS_STEPS.findIndex((s) => s.key === status);
  if (isIssue) {
    // Khi bị Issue, giữ vị trí ở bước Reviewing hoặc SubmittedToAuthorities nếu có context, mặc định Reviewing (2)
    currentIndex = 2;
  } else if (currentIndex === -1) {
    currentIndex = 0;
  }

  const stepItems = STATUS_STEPS.map((step, idx) => {
    const isPast = isCleared || (!isIssue && idx < currentIndex);
    const isCurrent = !isCleared && idx === currentIndex;

    let stepStatus;
    let stepIcon;

    if (isPast) {
      stepStatus = 'finish';
      stepIcon = <CheckCircleFilled style={{ color: '#16A34A', fontSize: 18 }} />;
    } else if (isCurrent) {
      if (isIssue) {
        stepStatus = 'error';
        stepIcon = <CloseCircleFilled style={{ color: '#DC2626', fontSize: 18 }} />;
      } else {
        stepStatus = 'process';
      }
    } else {
      stepStatus = 'wait';
    }

    return {
      title: (
        <span
          style={{
            fontWeight: isCurrent ? 600 : 500,
            color: isCurrent
              ? (isIssue ? '#DC2626' : '#0F172A')
              : isPast
              ? '#166534'
              : '#94A3B8',
            fontSize: 13,
          }}
        >
          {t(step.titleKey, step.defaultTitle)}
        </span>
      ),
      status: stepStatus,
      icon: stepIcon,
    };
  });

  return (
    <Card
      style={{
        borderRadius: 8,
        border: isIssue ? '1px solid #FCA5A5' : '1px solid #E2E8F0',
        backgroundColor: isIssue ? '#FEF2F2' : '#FFFFFF',
        boxShadow: '0 1px 3px rgba(0, 0, 0, 0.04)',
        marginBottom: 16,
      }}
      styles={{ body: { padding: '16px 20px' } }}
    >
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: 14,
          flexWrap: 'wrap',
          gap: 8,
        }}
      >
        <span style={{ fontSize: 12, fontWeight: 700, color: '#475569', textTransform: 'uppercase', letterSpacing: 0.5 }}>
          {t('specialist.statusBar.title', 'Tiến trình thẩm định & thông quan')}
        </span>

        {isIssue && (
          <Badge
            count={
              <span
                style={{
                  backgroundColor: '#EF4444',
                  color: '#FFFFFF',
                  padding: '3px 10px',
                  borderRadius: 12,
                  fontSize: 12,
                  fontWeight: 600,
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 4,
                  boxShadow: '0 1px 2px rgba(239, 68, 68, 0.25)',
                }}
              >
                ● {t('specialist.statusBar.hasIssue', 'Có vấn đề')}
              </span>
            }
          />
        )}
      </div>

      {isIssue && (
        <Alert
          type="error"
          showIcon
          message={t('specialist.statusBar.issueAlert', 'Hồ sơ đang có sự cố kiểm dịch / vướng mắc thủ tục')}
          description={issueReason || t('specialist.statusBar.issueDesc', 'Hồ sơ tạm dừng tiến trình do chưa đạt tiêu chuẩn hoặc bị cơ quan chức năng yêu cầu giải trình.')}
          style={{ marginBottom: 16, borderRadius: 6 }}
        />
      )}

      <Steps
        size="small"
        current={isCleared ? 5 : currentIndex}
        status={isIssue ? 'error' : undefined}
        items={stepItems}
        responsive
      />
    </Card>
  );
}

