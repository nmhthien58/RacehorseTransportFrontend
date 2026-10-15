import { Card } from 'antd';
import { useTranslation } from 'react-i18next';
import PageHeader from '@components/layout/PageHeader';
import IncidentBoard from '@features/coordinator/components/IncidentBoard';

/**
 * Sự cố & nắn tuyến của điều phối viên (Flow 5): đề xuất phương án, nắn tuyến, đóng sự cố.
 * @returns {JSX.Element}
 */
export default function IncidentsPage() {
  const { t } = useTranslation();
  return (
    <div style={{ paddingBottom: 40 }}>
      <PageHeader title={t('incidents.pageTitle.coordinator')} subtitle={t('incidents.pageSubtitle.coordinator')} />
      <Card>
        <IncidentBoard role="coordinator" />
      </Card>
    </div>
  );
}
