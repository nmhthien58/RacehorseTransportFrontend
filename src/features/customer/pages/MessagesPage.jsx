import { Card, Result } from 'antd';
import { MessageOutlined } from '@ant-design/icons';
import { useTranslation } from 'react-i18next';
import PageHeader from '@components/layout/PageHeader';

/**
 * Trang Tin nhắn (Messages) giữa chủ ngựa và điều phối viên / tài xế
 * @returns {JSX.Element}
 */
export default function MessagesPage() {
  const { t } = useTranslation();

  return (
    <div>
      <PageHeader
        title={t('nav.messages')}
        subtitle={t('nav.searchPlaceholder')}
      />
      <Card style={{ borderRadius: 12, marginTop: 16 }}>
        <Result
          icon={<MessageOutlined style={{ color: '#F59E0B' }} />}
          title={t('nav.messages')}
          subTitle="Kênh trao đổi trực tiếp với tài xế và bác sĩ thú y đang được phát triển."
        />
      </Card>
    </div>
  );
}
