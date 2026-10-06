import { Breadcrumb, Flex, Space, Typography } from 'antd';
import { Link } from 'react-router-dom';

const { Title, Text } = Typography;

/**
 * Component PageHeader cho phần đầu của trang khớp thiết kế Figma
 * @param {Object} props
 * @param {string} props.title - Tiêu đề trang
 * @param {string} [props.subtitle] - Mô tả phụ của trang
 * @param {Array<{ label: string, path?: string }>} [props.breadcrumb] - Danh sách breadcrumb
 * @param {React.ReactNode} [props.actions] - Các nút hành động bên phải
 * @param {Object} [props.style] - Style tùy biến thêm
 * @returns {JSX.Element}
 */
export default function PageHeader({
  title,
  subtitle,
  breadcrumb,
  actions,
  style,
}) {
  const breadcrumbItems = breadcrumb
    ? breadcrumb.map((item) => ({
        title: item.path ? (
          <Link to={item.path}>{item.label}</Link>
        ) : (
          item.label
        ),
      }))
    : null;

  return (
    <div style={{ marginBottom: 28, ...style }}>
      {breadcrumbItems && breadcrumbItems.length > 0 && (
        <Breadcrumb items={breadcrumbItems} style={{ marginBottom: 8 }} />
      )}
      <Flex justify="space-between" align="center" wrap="wrap" gap="middle">
        <div>
          <Title
            level={1}
            style={{
              margin: 0,
              fontSize: 38,
              fontWeight: 800,
              color: '#0f172a',
              letterSpacing: -0.5,
              lineHeight: 1.1,
            }}
          >
            {title}
          </Title>
          {subtitle && (
            <Text
              style={{
                display: 'block',
                marginTop: 6,
                fontSize: 16,
                color: '#475569',
                fontWeight: 400,
              }}
            >
              {subtitle}
            </Text>
          )}
        </div>
        {actions && <Space wrap>{actions}</Space>}
      </Flex>
    </div>
  );
}
