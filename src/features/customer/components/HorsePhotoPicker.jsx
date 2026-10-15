import { useEffect, useMemo, useRef } from 'react';
import { Button, Flex, Image, Space, Typography, message } from 'antd';
import { DeleteOutlined, PictureOutlined, UploadOutlined } from '@ant-design/icons';
import { useTranslation } from 'react-i18next';

const { Text } = Typography;

// Khớp quy định của backend cho thư mục 'horses': chỉ ảnh jpg/jpeg/png, tối đa 10 MB
const ACCEPTED_TYPES = ['image/jpeg', 'image/png'];
const MAX_SIZE_MB = 10;

/**
 * Chọn ảnh nhận diện ngựa từ máy, có xem trước.
 * @param {Object} props
 * @param {File|null} [props.file] - Ảnh mới người dùng vừa chọn
 * @param {string|null} [props.currentUrl] - Link ảnh đang có trên hệ thống (khi sửa)
 * @param {(file: File|null) => void} props.onChange - Trả về file mới, hoặc null khi bấm xóa ảnh
 * @param {boolean} [props.disabled]
 */
export default function HorsePhotoPicker({ file, currentUrl, onChange, disabled = false }) {
  const { t } = useTranslation();
  const inputRef = useRef(null);

  const localUrl = useMemo(() => (file ? URL.createObjectURL(file) : null), [file]);
  useEffect(() => () => localUrl && URL.revokeObjectURL(localUrl), [localUrl]);

  const previewSrc = localUrl || currentUrl;

  const handleSelect = (e) => {
    const picked = e.target.files?.[0];
    e.target.value = ''; // cho phép chọn lại đúng file vừa chọn
    if (!picked) return;

    if (!ACCEPTED_TYPES.includes(picked.type)) {
      message.error(t('horses.photo.invalidType'));
      return;
    }
    if (picked.size > MAX_SIZE_MB * 1024 * 1024) {
      message.error(t('horses.photo.tooLarge', { max: MAX_SIZE_MB }));
      return;
    }
    onChange(picked);
  };

  return (
    <Flex
      align="center"
      gap={16}
      wrap
      style={{
        padding: 12,
        background: '#f8fafc',
        borderRadius: 8,
        border: '1px dashed #cbd5e1',
      }}
    >
      {previewSrc ? (
        <Image
          src={previewSrc}
          alt={t('horses.photo.previewAlt')}
          width={80}
          height={80}
          style={{ objectFit: 'cover', borderRadius: 8 }}
        />
      ) : (
        <Flex
          align="center"
          justify="center"
          style={{ width: 80, height: 80, borderRadius: 8, background: '#e2e8f0' }}
        >
          <PictureOutlined style={{ fontSize: 28, color: '#94a3b8' }} />
        </Flex>
      )}

      <div style={{ flex: 1, minWidth: 180 }}>
        <Text strong style={{ fontSize: 13, color: '#0f172a' }}>
          {file ? file.name : previewSrc ? t('horses.photoPreviewTitle') : t('horses.photo.empty')}
        </Text>
        <br />
        <Text type="secondary" style={{ fontSize: 12 }}>
          {t('horses.photo.hint', { max: MAX_SIZE_MB })}
        </Text>
        <div style={{ marginTop: 8 }}>
          <input
            ref={inputRef}
            type="file"
            accept=".jpg,.jpeg,.png"
            style={{ display: 'none' }}
            onChange={handleSelect}
          />
          <Space wrap>
            <Button
              icon={<UploadOutlined />}
              disabled={disabled}
              onClick={() => inputRef.current?.click()}
            >
              {previewSrc ? t('horses.photo.change') : t('horses.photo.choose')}
            </Button>
            {previewSrc && (
              <Button danger icon={<DeleteOutlined />} disabled={disabled} onClick={() => onChange(null)}>
                {t('horses.photo.remove')}
              </Button>
            )}
          </Space>
        </div>
      </div>
    </Flex>
  );
}
