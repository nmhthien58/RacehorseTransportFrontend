import { useRef, useState, useEffect, useCallback } from 'react';
import { Card, Button, Space, Typography } from 'antd';
import { ClearOutlined, CheckCircleOutlined } from '@ant-design/icons';

const { Text } = Typography;

/**
 * Component bảng ký chữ ký điện tử Digital Signature Pad sử dụng HTML5 Canvas thuần
 * @param {{
 *   title: string,
 *   signatoryName?: string,
 *   value?: string,
 *   onChange?: (dataUrl: string | null) => void,
 *   disabled?: boolean,
 *   height?: number
 * }} props
 */
export default function DigitalSignaturePad({
  title,
  signatoryName,
  value,
  onChange,
  disabled = false,
  height = 160,
}) {
  const canvasRef = useRef(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [isEmpty, setIsEmpty] = useState(!value);

  // Khởi tạo Canvas context
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');

    // Thiết lập độ phân giải cao cho màn hình Retina
    const ratio = Math.ceil(window.devicePixelRatio || 1);
    const rect = canvas.getBoundingClientRect();
    canvas.width = rect.width * ratio;
    canvas.height = height * ratio;
    ctx.scale(ratio, ratio);

    ctx.lineWidth = 2.5;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.strokeStyle = '#1E3A8A'; // Màu mực xanh navy truyền thống

    // Nếu đã có giá trị chữ ký (ảnh base64), vẽ lên canvas
    if (value) {
      const img = new Image();
      img.onload = () => {
        ctx.clearRect(0, 0, rect.width, height);
        ctx.drawImage(img, 0, 0, rect.width, height);
        setIsEmpty(false);
      };
      img.src = value;
    }
  }, [value, height]);

  // Lấy tọa độ tương đối trên canvas
  const getCoordinates = (e) => {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0 };
    const rect = canvas.getBoundingClientRect();

    if (e.touches && e.touches.length > 0) {
      return {
        x: e.touches[0].clientX - rect.left,
        y: e.touches[0].clientY - rect.top,
      };
    }
    return {
      x: e.clientX - rect.left,
      y: e.clientY - rect.top,
    };
  };

  // Bắt đầu vẽ
  const startDrawing = (e) => {
    if (disabled) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    const { x, y } = getCoordinates(e);

    ctx.beginPath();
    ctx.moveTo(x, y);
    setIsDrawing(true);
  };

  // Di chuyển nét vẽ
  const draw = (e) => {
    if (!isDrawing || disabled) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    const { x, y } = getCoordinates(e);

    ctx.lineTo(x, y);
    ctx.stroke();
    setIsEmpty(false);
  };

  // Kết thúc nét vẽ
  const stopDrawing = useCallback(() => {
    if (!isDrawing) return;
    setIsDrawing(false);
    const canvas = canvasRef.current;
    if (!canvas) return;

    if (onChange) {
      const dataUrl = canvas.toDataURL('image/png');
      onChange(dataUrl);
    }
  }, [isDrawing, onChange]);

  // Xóa chữ ký làm lại
  const handleClear = () => {
    if (disabled) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    const rect = canvas.getBoundingClientRect();

    ctx.clearRect(0, 0, rect.width, height);
    setIsEmpty(true);
    if (onChange) {
      onChange(null);
    }
  };

  return (
    <Card
      size="small"
      style={{
        borderRadius: 10,
        border: '1px solid #D1D5DB',
        background: '#FFFFFF',
      }}
      bodyStyle={{ padding: 16 }}
    >
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: 10,
        }}
      >
        <div>
          <Text strong style={{ color: '#1F2937', fontSize: 14 }}>
            {title}
          </Text>
          {signatoryName && (
            <div style={{ fontSize: 12, color: '#6B7280' }}>
              Họ tên: <Text strong>{signatoryName}</Text>
            </div>
          )}
        </div>

        {!disabled && (
          <Button
            size="small"
            icon={<ClearOutlined />}
            onClick={handleClear}
            disabled={isEmpty}
            style={{ borderRadius: 6 }}
          >
            Ký lại
          </Button>
        )}
      </div>

      {/* Vùng Canvas ký tên */}
      <div
        style={{
          position: 'relative',
          border: '1px dashed #9CA3AF',
          borderRadius: 8,
          background: disabled ? '#F3F4F6' : '#FAFAFA',
          touchAction: 'none',
          overflow: 'hidden',
        }}
      >
        <canvas
          ref={canvasRef}
          onMouseDown={startDrawing}
          onMouseMove={draw}
          onMouseUp={stopDrawing}
          onMouseLeave={stopDrawing}
          onTouchStart={startDrawing}
          onTouchMove={draw}
          onTouchEnd={stopDrawing}
          style={{
            width: '100%',
            height: height,
            display: 'block',
            cursor: disabled ? 'not-allowed' : 'crosshair',
          }}
        />

        {/* Gợi ý ký tên khi canvas trống */}
        {isEmpty && (
          <div
            style={{
              position: 'absolute',
              top: '50%',
              left: '50%',
              transform: 'translate(-50%, -50%)',
              pointerEvents: 'none',
              textAlign: 'center',
              color: '#9CA3AF',
              fontSize: 13,
            }}
          >
            ✍️ Ký xác nhận tại đây (dùng chuột hoặc chạm cảm ứng)
          </div>
        )}
      </div>

      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginTop: 8,
          fontSize: 11,
          color: '#6B7280',
        }}
      >
        <span>Giá trị pháp lý theo chuẩn e-POD</span>
        {!isEmpty && (
          <Space size={4} style={{ color: '#10B981' }}>
            <CheckCircleOutlined />
            <span>Đã ghi nhận chữ ký</span>
          </Space>
        )}
      </div>
    </Card>
  );
}
