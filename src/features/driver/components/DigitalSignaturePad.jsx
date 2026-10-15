import { useRef, useState, useEffect } from 'react';
import { Button, Typography } from 'antd';
import { ClearOutlined } from '@ant-design/icons';
import { useTranslation } from 'react-i18next';

const { Text } = Typography;

/**
 * Ô ký tay trên canvas (chuột hoặc cảm ứng). Mỗi lần nhấc bút trả về ảnh PNG dạng data URL.
 * @param {{
 *   label?: string,
 *   onChange?: (dataUrl: string | null) => void,
 *   height?: number
 * }} props
 */
export default function DigitalSignaturePad({ label, onChange, height = 180 }) {
  const { t } = useTranslation();
  const canvasRef = useRef(null);
  const drawingRef = useRef(false);
  const [isEmpty, setIsEmpty] = useState(true);

  // Khởi tạo canvas một lần theo kích thước thật (nét mịn trên màn hình mật độ cao)
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ratio = Math.ceil(window.devicePixelRatio || 1);
    const rect = canvas.getBoundingClientRect();
    canvas.width = rect.width * ratio;
    canvas.height = height * ratio;
    const ctx = canvas.getContext('2d');
    ctx.scale(ratio, ratio);
    ctx.lineWidth = 2.2;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.strokeStyle = '#1F2937';
  }, [height]);

  const pointOf = (e) => {
    const rect = canvasRef.current.getBoundingClientRect();
    const source = e.touches?.[0] || e;
    return { x: source.clientX - rect.left, y: source.clientY - rect.top };
  };

  const start = (e) => {
    const ctx = canvasRef.current.getContext('2d');
    const { x, y } = pointOf(e);
    ctx.beginPath();
    ctx.moveTo(x, y);
    drawingRef.current = true;
  };

  const move = (e) => {
    if (!drawingRef.current) return;
    const ctx = canvasRef.current.getContext('2d');
    const { x, y } = pointOf(e);
    ctx.lineTo(x, y);
    ctx.stroke();
    if (isEmpty) setIsEmpty(false);
  };

  const stop = () => {
    if (!drawingRef.current) return;
    drawingRef.current = false;
    onChange?.(canvasRef.current.toDataURL('image/png'));
  };

  const clear = () => {
    const canvas = canvasRef.current;
    canvas.getContext('2d').clearRect(0, 0, canvas.width, canvas.height);
    setIsEmpty(true);
    onChange?.(null);
  };

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
        <Text>{label}</Text>
        <Button size="small" type="text" icon={<ClearOutlined />} onClick={clear} disabled={isEmpty}>
          {t('handover.sign.clear')}
        </Button>
      </div>
      <div
        style={{
          position: 'relative',
          border: '1px dashed #D6D3D1',
          borderRadius: 8,
          background: '#FAFAF9',
          touchAction: 'none',
        }}
      >
        <canvas
          ref={canvasRef}
          onMouseDown={start}
          onMouseMove={move}
          onMouseUp={stop}
          onMouseLeave={stop}
          onTouchStart={start}
          onTouchMove={move}
          onTouchEnd={stop}
          style={{ width: '100%', height, display: 'block', cursor: 'crosshair' }}
        />
        {isEmpty && (
          <span
            style={{
              position: 'absolute',
              inset: 0,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#A8A29E',
              fontSize: 13,
              pointerEvents: 'none',
            }}
          >
            {t('handover.sign.placeholder')}
          </span>
        )}
      </div>
    </div>
  );
}
