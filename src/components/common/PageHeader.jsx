import { Breadcrumb, Button, Flex, Space, Typography } from 'antd';
import { ArrowLeftOutlined } from '@ant-design/icons';
import { useTranslation } from 'react-i18next';

const { Title, Text } = Typography;

/**
 * Component Header chuẩn hóa cho các màn hình/trang trong ứng dụng
 * @param {{
 *   title: React.ReactNode,
 *   subtitle?: React.ReactNode,
 *   breadcrumbs?: Array<{ title: React.ReactNode, href?: string, onClick?: () => void }>,
 *   extra?: React.ReactNode,
 *   onBack?: () => void,
 *   style?: React.CSSProperties,
 *   className?: string
 * }} props
 * @returns {JSX.Element}
 */
export default function PageHeader({
  title,
  subtitle,
  breadcrumbs,
  extra,
  onBack,
  style,
  className,
}) {
  const { t } = useTranslation();

  return (
    <div
      className={className}
      style={{
        marginBottom: 20,
        ...style,
      }}
    >
      {breadcrumbs && breadcrumbs.length > 0 && (
        <Breadcrumb items={breadcrumbs} style={{ marginBottom: 8 }} />
      )}
      <Flex justify="space-between" align="center" wrap="wrap" gap="small">
        <Flex align="center" gap="middle">
          {onBack && (
            <Button
              type="text"
              shape="circle"
              icon={<ArrowLeftOutlined />}
              onClick={onBack}
              aria-label={t('common.back')}
            />
          )}
          <div>
            <Title level={4} style={{ margin: 0, fontWeight: 600 }}>
              {title}
            </Title>
            {subtitle && (
              <Text type="secondary" style={{ fontSize: 13 }}>
                {subtitle}
              </Text>
            )}
          </div>
        </Flex>
        {extra && <Space wrap>{extra}</Space>}
      </Flex>
    </div>
  );
}
