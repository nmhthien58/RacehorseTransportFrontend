import { Layout } from 'antd';
import horseWatermark from '@assets/horse-watermark.svg';

const { Content } = Layout;

/**
 * Component bọc vùng hiển thị nội dung chính với nền kem và watermark ngựa chìm theo Figma
 * @param {Object} props
 * @param {React.ReactNode} props.children - Nội dung trang con hoặc Outlet
 * @param {Object} [props.style] - Style tùy biến thêm nếu cần
 * @param {string} [props.className] - Class name tùy biến
 * @returns {JSX.Element}
 */
export default function ContentWrapper({ children, style, className }) {
  return (
    <Content
      className={className}
      style={{
        padding: '16px 36px 48px 36px',
        background: '#FFF9EE',
        minHeight: 'calc(100vh - 76px)',
        position: 'relative',
        overflowX: 'hidden',
        overflowY: 'auto',
        ...style,
      }}
    >
      {/* Hình vector đầu ngựa vàng kim chìm dưới góc phải theo đúng Figma */}
      <img
        src={horseWatermark}
        alt=""
        aria-hidden="true"
        style={{
          position: 'absolute',
          right: 0,
          bottom: 0,
          width: '60%',
          maxWidth: 900,
          pointerEvents: 'none',
          zIndex: 0,
          userSelect: 'none',
        }}
      />

      {/* Nội dung trang con nằm ở layer trên */}
      <div style={{ position: 'relative', zIndex: 1 }}>{children}</div>
    </Content>
  );
}
