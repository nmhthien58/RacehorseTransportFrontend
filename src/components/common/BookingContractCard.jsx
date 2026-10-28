// Đang tạo BookingContractCard vì trang chi tiết đơn cần khối Hợp đồng: bản hiện hành, phiên bản cũ, chấp nhận bản sửa đổi (FE-17, R-17)
import { useCallback, useEffect, useState } from 'react';
import { Alert, Button, Card, Descriptions, Flex, Space, Table, Tag, Typography, message } from 'antd';
import { DownloadOutlined, EyeOutlined, FileTextOutlined } from '@ant-design/icons';
import { useTranslation } from 'react-i18next';
import dayjs from 'dayjs';
import PolicyAgreement from '@components/common/PolicyAgreement';
import { useContractViewer, saveBlob, isContractChangedError } from '@components/common/ContractViewer';
import contractService from '@services/contractService';
import { unwrapData, unwrapList, getErrorMessage } from '@utils/apiHelpers';

const { Text } = Typography;
const CONTRACT_STATUS_COLORS = { Draft: 'gold', Accepted: 'green', Superseded: 'default' };
const formatTime = (value) => (value ? dayjs(value).format('DD/MM/YYYY HH:mm') : '—');

/**
 * Khối Hợp đồng vận chuyển trên trang chi tiết đơn.
 * - Mọi vai trò xem được: số hợp đồng, phiên bản, trạng thái, thời điểm chấp nhận, xem / tải PDF, các phiên bản cũ.
 * - Khách: có bản nháp mới sau khi hợp đồng đầu đã giao kết (đổi điểm đón / trả, đường vòng, đổi người nhận)
 *   → thẻ "Hợp đồng cần xác nhận lại": xem PDF, tích đã đọc, Chấp nhận.
 * Bản nháp đầu tiên (đơn Quoted) được chấp nhận cùng báo giá ở CustomerQuoteCard, không ở đây.
 * Đơn chưa có báo giá chốt (backend trả 404) thì không hiện gì.
 *
 * @param {{ bookingId: number|string, bookingStatus?: string, mode?: 'customer'|'staff', reloadKey?: number, onChanged?: () => void }} props
 * @returns {JSX.Element|null}
 */
export default function BookingContractCard({ bookingId, bookingStatus, mode = 'staff', reloadKey = 0, onChanged }) {
  const { t } = useTranslation();
  const { view, viewer } = useContractViewer();
  const [current, setCurrent] = useState(null);
  const [history, setHistory] = useState([]);
  const [loaded, setLoaded] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);
  const [downloadingId, setDownloadingId] = useState(null);
  // Bản khách đã mở (phải mở mới được chấp nhận) + ô đã đọc
  const [openedContract, setOpenedContract] = useState(null);
  const [agreement, setAgreement] = useState({ accepted: false, policyVersion: null });
  const [accepting, setAccepting] = useState(false);

  useEffect(() => {
    let active = true;
    // Đơn chưa có báo giá chốt thì lịch sử rỗng: không gọi bản hiện hành (backend trả 404)
    contractService
      .getHistory(bookingId)
      .then(unwrapList)
      .catch(() => [])
      .then(async (list) => {
        const cur = list.length ? await contractService.getCurrent(bookingId).then(unwrapData).catch(() => null) : null;
        if (!active) return;
        setCurrent(cur);
        setHistory(list);
        setLoaded(true);
      });
    return () => {
      active = false;
    };
  }, [bookingId, bookingStatus, reloadKey, refreshKey]);

  const reload = useCallback(() => {
    setOpenedContract(null);
    setAgreement({ accepted: false, policyVersion: null });
    setRefreshKey((k) => k + 1);
  }, []);

  const handleView = () => {
    if (view(current)) {
      setOpenedContract({ contractId: current.contractId, fileSha256: current.fileSha256 });
    } else {
      message.error(t('contract.noFile'));
    }
  };

  const handleDownload = async (contract) => {
    setDownloadingId(contract.contractId);
    try {
      const blob = await contractService.downloadFile(contract.contractId);
      saveBlob(blob, `${contract.contractCode || 'contract'}-v${contract.version}.pdf`);
    } catch (err) {
      message.error(getErrorMessage(err, t('contract.downloadFailed')));
    } finally {
      setDownloadingId(null);
    }
  };

  const handleAcceptAmendment = async () => {
    setAccepting(true);
    try {
      await contractService.accept(current.contractId, {
        contractSha256: openedContract.fileSha256,
        acceptPolicy: true,
        policyVersion: agreement.policyVersion,
      });
      message.success(t('contract.amendment.accepted'));
      reload();
      onChanged?.();
    } catch (err) {
      if (isContractChangedError(err)) {
        message.warning(t('contract.changedReload'));
        reload();
      } else {
        message.error(getErrorMessage(err, t('contract.amendment.acceptFailed')));
      }
    } finally {
      setAccepting(false);
    }
  };

  if (!loaded || !current) return null;

  const isDraft = current.status === 'Draft';
  // Đã từng giao kết (có bản Accepted / bản cũ đã được chấp nhận) mà giờ có bản nháp → là bản sửa đổi chờ khách xác nhận lại
  const hasAcceptedBefore = history.some((c) => c.acceptedAt);
  const needsReaccept = isDraft && hasAcceptedBefore && mode === 'customer';
  const openedCurrent = openedContract?.contractId === current.contractId;
  const olderVersions = history.filter((c) => c.contractId !== current.contractId);

  const statusTag = (status) => <Tag color={CONTRACT_STATUS_COLORS[status] || 'default'}>{t(`contract.status.${status}`, status)}</Tag>;

  const historyColumns = [
    { title: t('contract.fields.code'), dataIndex: 'contractCode', render: (v, r) => `${v} · v${r.version}` },
    { title: t('contract.fields.status'), dataIndex: 'status', render: statusTag },
    { title: t('contract.fields.reason'), dataIndex: 'reason', render: (v) => t(`contract.reason.${v}`, v) },
    { title: t('contract.fields.createdAt'), dataIndex: 'createdAt', render: formatTime },
    { title: t('contract.fields.acceptedAt'), dataIndex: 'acceptedAt', render: formatTime },
    {
      title: '',
      key: 'download',
      align: 'right',
      render: (_, r) => (
        <Button size="small" icon={<DownloadOutlined />} loading={downloadingId === r.contractId} onClick={() => handleDownload(r)}>
          {t('contract.download')}
        </Button>
      ),
    },
  ];

  return (
    <Card
      title={
        <Space>
          <FileTextOutlined />
          {t('contract.title')}
        </Space>
      }
      style={needsReaccept ? { borderColor: '#f59e0b' } : undefined}
    >
      {viewer}
      {needsReaccept && (
        <Alert
          type="warning"
          showIcon
          style={{ marginBottom: 16 }}
          title={t('contract.amendment.title')}
          description={
            <Flex vertical gap={10} style={{ marginTop: 4 }}>
              <Text>{t('contract.amendment.description', { reason: t(`contract.reason.${current.reason}`, current.reason) })}</Text>
              <Space wrap>
                <Button icon={<EyeOutlined />} onClick={handleView}>
                  {t('contract.view')}
                </Button>
                {!openedCurrent && <Text type="secondary">{t('contract.openFirst')}</Text>}
              </Space>
              <PolicyAgreement
                accepted={agreement.accepted}
                disabled={!openedCurrent}
                labelKey="contract.agreementLabel"
                onChange={setAgreement}
              />
              <div>
                <Button
                  type="primary"
                  loading={accepting}
                  disabled={!openedCurrent || !agreement.accepted || !agreement.policyVersion}
                  onClick={handleAcceptAmendment}
                >
                  {t('contract.amendment.accept')}
                </Button>
              </div>
            </Flex>
          }
        />
      )}
      {isDraft && !hasAcceptedBefore && bookingStatus === 'Quoted' && (
        <Alert type="info" showIcon style={{ marginBottom: 16 }} title={t('contract.pendingWithQuote')} />
      )}

      <Descriptions column={{ xs: 1, sm: 2 }} size="small">
        <Descriptions.Item label={t('contract.fields.code')}>
          <Text strong>{current.contractCode}</Text> · v{current.version}
        </Descriptions.Item>
        <Descriptions.Item label={t('contract.fields.status')}>{statusTag(current.status)}</Descriptions.Item>
        <Descriptions.Item label={t('contract.fields.reason')}>{t(`contract.reason.${current.reason}`, current.reason)}</Descriptions.Item>
        <Descriptions.Item label={t('contract.fields.policyVersion')}>{current.policyVersion || '—'}</Descriptions.Item>
        <Descriptions.Item label={t('contract.fields.acceptedAt')}>{formatTime(current.acceptedAt)}</Descriptions.Item>
        <Descriptions.Item label={t('contract.fields.acceptedBy')}>{current.acceptedByName || '—'}</Descriptions.Item>
      </Descriptions>

      <Space wrap style={{ marginTop: 12 }}>
        {!needsReaccept && (
          <Button icon={<EyeOutlined />} onClick={handleView}>
            {t('contract.view')}
          </Button>
        )}
        <Button icon={<DownloadOutlined />} loading={downloadingId === current.contractId} onClick={() => handleDownload(current)}>
          {t('contract.downloadPdf')}
        </Button>
      </Space>

      {olderVersions.length > 0 && (
        <div style={{ marginTop: 20 }}>
          <Text strong>{t('contract.history')}</Text>
          <Table
            style={{ marginTop: 8 }}
            size="small"
            rowKey="contractId"
            columns={historyColumns}
            dataSource={olderVersions}
            pagination={false}
            scroll={{ x: 640 }}
          />
        </div>
      )}
    </Card>
  );
}
