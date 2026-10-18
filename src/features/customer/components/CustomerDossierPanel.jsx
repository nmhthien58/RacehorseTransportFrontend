import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  Alert,
  Button,
  Card,
  DatePicker,
  Empty,
  Flex,
  Form,
  Input,
  Modal,
  Progress,
  Select,
  Space,
  Spin,
  Table,
  Tag,
  Typography,
  Upload,
  message,
} from 'antd';
import { FileTextOutlined, UploadOutlined, ReloadOutlined } from '@ant-design/icons';
import { useTranslation } from 'react-i18next';
import dayjs from 'dayjs';
import { formatCountryRoute } from '@utils/bookingRoute';
import { formatPickupWindow } from '@utils/bookingSchedule';
import dossierService from '@services/dossierService';
import { unwrapData, unwrapList, getErrorMessage, toFormData } from '@utils/apiHelpers';

const { Text, Title } = Typography;

// Hồ sơ chỉ nhận giấy khi ở các trạng thái này (backend: OpenForDocuments)
const OPEN_FOR_DOCUMENTS = ['Draft', 'AwaitingDocs', 'Reviewing'];
const MAX_REJECTIONS = 3;

const DOSSIER_STATUS_COLORS = {
  Draft: 'default',
  AwaitingDocs: 'orange',
  Reviewing: 'blue',
  SubmittedToAuthorities: 'purple',
  Cleared: 'green',
  Issue: 'red',
};

const CHECKLIST_STATE_COLORS = {
  Missing: 'default',
  Pending: 'blue',
  Approved: 'green',
  Rejected: 'red',
};

/**
 * Khung hồ sơ kiểm dịch của khách hàng (Flow 2): xem checklist giấy tờ và nộp từng giấy.
 * Gọi GET /dossiers, GET /dossiers/{id}, POST /dossiers/{id}/documents (multipart).
 *
 * @param {Object} props
 * @param {number|string} [props.horseId] - Chỉ hiện hồ sơ của con ngựa này (bỏ trống = tất cả)
 * @param {number|string} [props.bookingId] - Chỉ hiện hồ sơ thuộc yêu cầu vận chuyển này
 * @param {string} [props.bookingStatus] - Trạng thái booking để giải thích khi chưa có hồ sơ
 * @returns {JSX.Element}
 */
export default function CustomerDossierPanel({ horseId, bookingId, bookingStatus }) {
  const { t } = useTranslation();
  const [form] = Form.useForm();

  const [dossiers, setDossiers] = useState([]);
  const [listLoading, setListLoading] = useState(true);
  const [selectedId, setSelectedId] = useState(null);
  const [detail, setDetail] = useState(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [uploadTarget, setUploadTarget] = useState(null);
  const [fileList, setFileList] = useState([]);
  const [submitting, setSubmitting] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);

  // Danh sách hồ sơ của khách (backend tự lọc theo chủ ngựa)
  useEffect(() => {
    let active = true;
    dossierService
      .getDossiers({ size: 100, ...(bookingId ? { bookingId } : {}) })
      .then((res) => {
        if (!active) return;
        const list = unwrapList(res);
        setDossiers(list);
      })
      .catch((err) => {
        if (active) message.error(getErrorMessage(err, t('customerDossier.loadFailed')));
      })
      .finally(() => {
        if (active) setListLoading(false);
      });
    return () => {
      active = false;
    };
  }, [bookingId, t, refreshKey]);

  const visibleDossiers = useMemo(
    () =>
      dossiers.filter(
        (d) =>
          (!horseId || String(d.horseId) === String(horseId)) &&
          (!bookingId || String(d.bookingId) === String(bookingId)),
      ),
    [bookingId, dossiers, horseId],
  );

  // Hồ sơ đang chọn: mặc định hồ sơ đầu tiên chưa thông quan
  const activeId = useMemo(() => {
    if (selectedId && visibleDossiers.some((d) => d.dossierId === selectedId)) return selectedId;
    const open = visibleDossiers.find((d) => d.status !== 'Cleared');
    return (open || visibleDossiers[0])?.dossierId || null;
  }, [selectedId, visibleDossiers]);

  const loadDetail = useCallback(
    async (id) => {
      setDetailLoading(true);
      try {
        const res = await dossierService.getDossierById(id);
        setDetail(unwrapData(res));
      } catch (err) {
        message.error(getErrorMessage(err, t('customerDossier.loadFailed')));
      } finally {
        setDetailLoading(false);
      }
    },
    [t],
  );

  // Tải chi tiết khi đổi hồ sơ (spinner hiện khi detail chưa khớp activeId)
  useEffect(() => {
    if (!activeId) return undefined;
    let active = true;
    dossierService
      .getDossierById(activeId)
      .then((res) => {
        if (active) setDetail(unwrapData(res));
      })
      .catch((err) => {
        if (active) message.error(getErrorMessage(err, t('customerDossier.loadFailed')));
      });
    return () => {
      active = false;
    };
  }, [activeId, t]);

  const shownDetail = detail?.dossierId === activeId ? detail : null;
  const canUpload = shownDetail && OPEN_FOR_DOCUMENTS.includes(shownDetail.status);

  const openUpload = (item) => {
    setUploadTarget(item);
    setFileList([]);
    form.resetFields();
    form.setFieldsValue({ documentNumber: item.latestDocument?.documentNumber || '' });
  };

  const handleUpload = async () => {
    try {
      const values = await form.validateFields();
      const file = fileList[0]?.originFileObj || fileList[0];
      if (!file) {
        message.error(t('customerDossier.fileRequired'));
        return;
      }
      setSubmitting(true);
      const formData = toFormData({
        docTypeId: uploadTarget.docTypeId,
        documentNumber: values.documentNumber?.trim(),
        expiryDate: values.expiryDate ? values.expiryDate.format('YYYY-MM-DD') : null,
        file,
      });
      const res = await dossierService.uploadDocument(shownDetail.dossierId, formData);
      setDetail(unwrapData(res));
      setUploadTarget(null);
      setRefreshKey((k) => k + 1);
      message.success(t('customerDossier.uploadSuccess'));
    } catch (err) {
      if (err?.errorFields) return;
      message.error(getErrorMessage(err, t('customerDossier.uploadFailed')));
    } finally {
      setSubmitting(false);
    }
  };

  const columns = [
    {
      title: t('customerDossier.columns.document'),
      dataIndex: 'docTypeName',
      key: 'docTypeName',
      render: (name, item) => (
        <div>
          <Text strong style={{ fontSize: 13 }}>
            {name}
          </Text>
          {!item.isMandatory && (
            <Tag style={{ marginLeft: 6 }}>{t('customerDossier.optional')}</Tag>
          )}
          <div style={{ fontSize: 12, color: '#64748b' }}>
            {(item.requiredBy || []).join(' · ')}
            {item.validityDays ? ` · ${t('customerDossier.validityDays', { days: item.validityDays })}` : ''}
          </div>
          {item.regulationNote && <div style={{ fontSize: 12, color: '#94a3b8' }}>{item.regulationNote}</div>}
        </div>
      ),
    },
    {
      title: t('customerDossier.columns.state'),
      dataIndex: 'state',
      key: 'state',
      width: 120,
      render: (state) => <Tag color={CHECKLIST_STATE_COLORS[state] || 'default'}>{t(`customerDossier.state.${state}`, state)}</Tag>,
    },
    {
      title: t('customerDossier.columns.submitted'),
      key: 'latestDocument',
      render: (_, item) => {
        const doc = item.latestDocument;
        if (!doc) return <Text type="secondary">—</Text>;
        return (
          <div style={{ fontSize: 12 }}>
            {doc.fileUrl ? (
              <a href={doc.fileUrl} target="_blank" rel="noreferrer">
                <FileTextOutlined /> {doc.documentNumber || t('customerDossier.viewFile')}
              </a>
            ) : (
              <Text>{doc.documentNumber || '—'}</Text>
            )}
            <div style={{ color: '#64748b' }}>
              {doc.uploadedAt ? dayjs(doc.uploadedAt).format('DD/MM/YYYY HH:mm') : ''}
              {doc.expiryDate ? ` · ${t('customerDossier.expires')} ${dayjs(doc.expiryDate).format('DD/MM/YYYY')}` : ''}
            </div>
            {doc.correctionNote && (
              <div style={{ color: '#dc2626' }}>
                {t('customerDossier.correctionNote')}: {doc.correctionNote} ({doc.rejectionCount}/{MAX_REJECTIONS})
              </div>
            )}
          </div>
        );
      },
    },
    {
      title: '',
      key: 'action',
      width: 130,
      align: 'right',
      render: (_, item) => {
        const blocked =
          !canUpload ||
          item.state === 'Approved' ||
          (item.latestDocument?.rejectionCount || 0) >= MAX_REJECTIONS;
        return (
          <Button size="small" icon={<UploadOutlined />} disabled={blocked} onClick={() => openUpload(item)}>
            {item.latestDocument ? t('customerDossier.resubmit') : t('customerDossier.submit')}
          </Button>
        );
      },
    },
  ];

  if (listLoading) {
    return (
      <div style={{ textAlign: 'center', padding: 40 }}>
        <Spin />
      </div>
    );
  }

  if (visibleDossiers.length === 0) {
    const isAwaitingApproval = bookingStatus === 'Submitted';
    const isInactive = ['Rejected', 'Cancelled', 'Expired'].includes(bookingStatus);
    const emptyDescription = isAwaitingApproval
      ? t('customerDossier.awaitingApproval')
      : isInactive
        ? t('customerDossier.inactiveBooking')
        : t('customerDossier.empty');

    return (
      <Card style={{ borderRadius: 14 }}>
        <Empty description={emptyDescription} />
      </Card>
    );
  }

  return (
    <Card style={{ borderRadius: 14 }} styles={{ body: { padding: '20px 22px' } }}>
      <Flex justify="space-between" align="center" wrap="wrap" gap={12} style={{ marginBottom: 16 }}>
        <Title level={5} style={{ margin: 0 }}>
          {t('customerDossier.title')}
        </Title>
        <Space wrap>
          <Select
            style={{ minWidth: 280 }}
            value={activeId}
            onChange={setSelectedId}
            options={visibleDossiers.map((d) => ({
              value: d.dossierId,
              label: `${d.horseName} · ${d.dossierCode} · ${t(`customerDossier.status.${d.status}`, d.status)}`,
            }))}
          />
          <Button icon={<ReloadOutlined />} loading={detailLoading} onClick={() => activeId && loadDetail(activeId)} />
        </Space>
      </Flex>

      {!shownDetail ? (
        <div style={{ textAlign: 'center', padding: 30 }}>
          <Spin />
        </div>
      ) : shownDetail ? (
        <Space direction="vertical" size={14} style={{ width: '100%' }}>
          <Flex gap={16} wrap="wrap" align="center">
            <Tag color={DOSSIER_STATUS_COLORS[shownDetail.status] || 'default'} style={{ fontWeight: 700 }}>
              {t(`customerDossier.status.${shownDetail.status}`, shownDetail.status)}
            </Tag>
            <Text type="secondary">
              {formatCountryRoute(shownDetail)} ·{' '}
              {t('customerDossier.departure')}{' '}
              {formatPickupWindow(shownDetail)}
            </Text>
            {shownDetail.specialistName && (
              <Text type="secondary">
                {t('customerDossier.specialist')}: {shownDetail.specialistName}
              </Text>
            )}
          </Flex>

          <div>
            <Text style={{ fontSize: 12 }}>
              {t('customerDossier.progress', {
                approved: shownDetail.approvedCount,
                required: shownDetail.requiredCount,
              })}
            </Text>
            <Progress
              percent={shownDetail.requiredCount ? Math.round((shownDetail.approvedCount / shownDetail.requiredCount) * 100) : 0}
              strokeColor="#F59E0B"
              size="small"
            />
          </div>

          {shownDetail.status === 'Issue' && shownDetail.issueReason && (
            <Alert type="error" showIcon message={t('customerDossier.issue')} description={shownDetail.issueReason} />
          )}
          {shownDetail.status === 'Cleared' && (
            <Alert
              type="success"
              showIcon
              message={t('customerDossier.cleared', { number: shownDetail.clearanceNumber })}
            />
          )}
          {!canUpload && shownDetail.status !== 'Cleared' && shownDetail.status !== 'Issue' && (
            <Alert type="info" showIcon message={t('customerDossier.locked')} />
          )}

          <Table
            rowKey="docTypeId"
            size="small"
            pagination={false}
            columns={columns}
            dataSource={shownDetail.checklist || []}
            scroll={{ x: 640 }}
          />
        </Space>
      ) : null}

      <Modal
        title={uploadTarget ? `${t('customerDossier.uploadTitle')}: ${uploadTarget.docTypeName}` : ''}
        open={Boolean(uploadTarget)}
        onCancel={() => setUploadTarget(null)}
        onOk={handleUpload}
        confirmLoading={submitting}
        okText={t('customerDossier.submit')}
        destroyOnHidden
      >
        <Form form={form} layout="vertical">
          <Form.Item name="documentNumber" label={t('customerDossier.documentNumber')} rules={[{ max: 100 }]}>
            <Input placeholder="COGGINS-LAB-2026-888" />
          </Form.Item>
          <Form.Item name="expiryDate" label={t('customerDossier.expiryDate')}>
            <DatePicker
              style={{ width: '100%' }}
              format="DD/MM/YYYY"
              disabledDate={(d) => d && d.isBefore(dayjs(), 'day')}
            />
          </Form.Item>
          <Form.Item label={t('customerDossier.file')} required>
            <Upload
              accept=".pdf,.jpg,.jpeg,.png"
              maxCount={1}
              fileList={fileList}
              beforeUpload={() => false}
              onChange={({ fileList: next }) => setFileList(next.slice(-1))}
            >
              <Button icon={<UploadOutlined />}>{t('customerDossier.chooseFile')}</Button>
            </Upload>
            <Text type="secondary" style={{ fontSize: 12 }}>
              {t('customerDossier.fileHint')}
            </Text>
          </Form.Item>
        </Form>
      </Modal>
    </Card>
  );
}
