import { Card } from 'antd';
import { useTranslation } from 'react-i18next';
import PageHeader from '@components/layout/PageHeader';
import IncidentBoard from '@features/coordinator/components/IncidentBoard';

/**
 * Duyệt phương án xử lý sự cố của quản lý (Flow 5): duyệt hoặc từ chối kèm lý do.
 * @returns {JSX.Element}
 */
export default function IncidentReviewPage() {
  const { t } = useTranslation();
  return (
    <div style={{ paddingBottom: 40 }}>
      <PageHeader title={t('incidents.pageTitle.manager')} subtitle={t('incidents.pageSubtitle.manager')} />
      <Card>
        <IncidentBoard role="manager" />
      </Card>
    </div>
  );
}
