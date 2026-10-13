import { Card, Result } from 'antd';
import { CompassOutlined } from '@ant-design/icons';
import { useTranslation } from 'react-i18next';
import PageHeader from '@components/layout/PageHeader';

/**
 * Trang Chuyến đi đang hoạt động (Active Trips) cho chủ ngựa
 * @returns {JSX.Element}
 */
export default function ActiveTripsPage() {
  const { t } = useTranslation();

  return (
    <div>
      <PageHeader
        title={t('nav.activeTrips')}
        subtitle={t('nav.searchPlaceholder')}
      />
      <Card style={{ borderRadius: 12, marginTop: 16 }}>
        <Result
          icon={<CompassOutlined style={{ color: '#F59E0B' }} />}
          title={t('nav.activeTrips')}
          subTitle="Tính năng theo dõi GPS thời gian thực và hành trình chuyến đi đang được phát triển."
        />
      </Card>
    </div>
  );
}
