import { Card, Result } from 'antd';
import { CreditCardOutlined } from '@ant-design/icons';
import { useTranslation } from 'react-i18next';
import PageHeader from '@components/layout/PageHeader';

/**
 * Trang Thanh toán & Hóa đơn (Billing & Payments)
 * @returns {JSX.Element}
 */
export default function BillingPage() {
  const { t } = useTranslation();

  return (
    <div>
      <PageHeader
        title={t('nav.billing')}
        subtitle={t('nav.searchPlaceholder')}
      />
      <Card style={{ borderRadius: 12, marginTop: 16 }}>
        <Result
          icon={<CreditCardOutlined style={{ color: '#F59E0B' }} />}
          title={t('nav.billing')}
          subTitle="Tính năng quản lý giao dịch thanh toán và hóa đơn đang được phát triển."
        />
      </Card>
    </div>
  );
}
