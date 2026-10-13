import { Card, Result } from 'antd';
import { MedicineBoxOutlined } from '@ant-design/icons';
import { useTranslation } from 'react-i18next';
import PageHeader from '@components/layout/PageHeader';

/**
 * Trang Hồ sơ thú y (Vet Records) cho chủ ngựa
 * @returns {JSX.Element}
 */
export default function VetRecordsPage() {
  const { t } = useTranslation();

  return (
    <div>
      <PageHeader
        title={t('nav.vetRecords')}
        subtitle={t('nav.searchPlaceholder')}
      />
      <Card style={{ borderRadius: 12, marginTop: 16 }}>
        <Result
          icon={<MedicineBoxOutlined style={{ color: '#F59E0B' }} />}
          title={t('nav.vetRecords')}
          subTitle="Tính năng quản lý hồ sơ thú y và chứng nhận kiểm dịch đang được phát triển."
        />
      </Card>
    </div>
  );
}
