import { Empty, Button } from 'antd';
import { ExportOutlined } from '@ant-design/icons';
import { useTranslation } from 'react-i18next';

const IMAGE_EXTENSIONS = ['jpg', 'jpeg', 'png', 'gif', 'webp', 'bmp'];

/**
 * Lấy đuôi file từ URL; link ký của Supabase có dạng ".../file.pdf?token=..." nên phải bỏ phần query.
 * @param {string} url
 * @returns {string}
 */
function getExtension(url) {
  try {
    const path = new URL(url, window.location.origin).pathname;
    return path.split('.').pop().toLowerCase();
  } catch {
    return '';
  }
}

/**
 * Xem trước một tệp theo loại: ảnh dùng <img>, PDF nhúng bằng <iframe>, loại khác chỉ có nút mở tab mới.
 * @param {Object} props
 * @param {string} [props.url] - Link xem tệp (fileUrl / photoUrl backend trả về)
 * @param {string} [props.title]
 * @param {number} [props.height] - Chiều cao khung xem PDF
 * @returns {JSX.Element}
 */
export default function FilePreview({ url, title, height = 600 }) {
  const { t } = useTranslation();

  if (!url) {
    return <Empty description={t('filePreview.noFile')} />;
  }

  const ext = getExtension(url);
  let content;
  if (IMAGE_EXTENSIONS.includes(ext)) {
    content = <img src={url} alt={title || ''} style={{ maxWidth: '100%', maxHeight: height, objectFit: 'contain' }} />;
  } else if (ext === 'pdf') {
    content = <iframe src={url} title={title || 'PDF'} style={{ width: '100%', height, border: '1px solid #E5E7EB', borderRadius: 4 }} />;
  } else {
    content = <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description={t('filePreview.unsupported')} />;
  }

  return (
    <div style={{ textAlign: 'center' }}>
      {content}
      <div style={{ marginTop: 12 }}>
        <Button icon={<ExportOutlined />} href={url} target="_blank" rel="noopener noreferrer">
          {t('filePreview.openNewTab')}
        </Button>
      </div>
    </div>
  );
}
