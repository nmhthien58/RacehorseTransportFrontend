// Đang tạo ContractViewer vì khách / nhân sự cần xem PDF hợp đồng vận chuyển ngay trên ứng dụng (FE-17, R-17)
import { useCallback, useState } from 'react';
import { Button, Grid, Modal } from 'antd';
import { DownloadOutlined } from '@ant-design/icons';
import { useTranslation } from 'react-i18next';

/**
 * Xem PDF hợp đồng: màn rộng mở modal toàn màn hình (iframe), điện thoại mở tab mới (trình duyệt điện thoại hiện PDF trong iframe kém).
 * Dùng: `const { view, viewer } = useContractViewer();` → gọi `view(contract)` với hợp đồng có `fileUrl`, render `{viewer}`.
 * @returns {{ view: (contract: { fileUrl?: string, contractCode?: string, version?: number }) => boolean, viewer: JSX.Element }}
 */
export function useContractViewer() {
  const { t } = useTranslation();
  const screens = Grid.useBreakpoint();
  const [shown, setShown] = useState(null);

  // Trả về true nếu đã mở được (có link)
  const view = useCallback(
    (contract) => {
      if (!contract?.fileUrl) return false;
      if (screens.md === false) {
        window.open(contract.fileUrl, '_blank', 'noopener,noreferrer');
      } else {
        setShown(contract);
      }
      return true;
    },
    [screens.md],
  );

  const viewer = (
    <Modal
      open={Boolean(shown)}
      onCancel={() => setShown(null)}
      title={t('contract.viewerTitle', { code: shown?.contractCode || '', version: shown?.version ?? '' })}
      width="100vw"
      style={{ top: 0, paddingBottom: 0, maxWidth: '100vw' }}
      styles={{ body: { height: 'calc(100vh - 140px)', padding: 0 } }}
      footer={[
        <Button key="download" icon={<DownloadOutlined />} href={shown?.fileUrl} target="_blank" rel="noopener noreferrer">
          {t('contract.openNewTab')}
        </Button>,
        <Button key="close" type="primary" onClick={() => setShown(null)}>
          {t('common.close')}
        </Button>,
      ]}
      destroyOnHidden
    >
      {shown?.fileUrl && (
        <iframe
          title={shown.contractCode || 'contract'}
          src={shown.fileUrl}
          style={{ width: '100%', height: '100%', border: 'none' }}
        />
      )}
    </Modal>
  );

  return { view, viewer };
}

/**
 * Tải PDF từ Blob về máy với tên file cho trước.
 * @param {Blob} blob
 * @param {string} fileName
 */
export function saveBlob(blob, fileName) {
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = fileName;
  document.body.appendChild(link);
  link.click();
  link.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

/**
 * Nhận ra lỗi "hợp đồng đã đổi kể từ lúc mở" của backend (công ty vừa tạo bản nháp mới / mã băm không khớp).
 * @param {any} err
 * @returns {boolean}
 */
export function isContractChangedError(err) {
  const msg = String(err?.response?.data?.message || err?.userMessage || err?.message || '');
  return msg.toLowerCase().includes('contract has changed');
}
