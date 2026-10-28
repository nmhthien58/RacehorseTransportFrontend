import { useState, useEffect } from 'react';
import {
  Card,
  Table,
  Button,
  Modal,
  Form,
  Select,
  InputNumber,
  Input,
  Upload,
  Alert,
  Space,
  Tag,
  Typography,
  Descriptions,
  message,
} from 'antd';
import {
  SafetyCertificateOutlined,
  PlusOutlined,
  UploadOutlined,
  ClockCircleOutlined,
} from '@ant-design/icons';
import { useTranslation } from 'react-i18next';
import dayjs from 'dayjs';
import claimService from '@services/claimService';
import { unwrapList, unwrapData, getErrorMessage } from '@utils/apiHelpers';
import StatusTag from '@components/common/StatusTag';

const { Text } = Typography;
const { TextArea } = Input;

// Đang sửa CustomerClaimsPanel vì tối ưu useEffect tải danh sách bồi thường bảo hiểm tránh cascading render
export default function CustomerClaimsPanel({ booking }) {
  const { t } = useTranslation();
  const [claims, setClaims] = useState([]);
  const [modalOpen, setModalOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);
  const [form] = Form.useForm();
  const [fileList, setFileList] = useState([]);

  const bookingId = booking?.bookingId || booking?.BookingID;
  const horses = booking?.horses || booking?.Horses || [];

  // Tính 24h sau khi hoàn thành / ký e-POD
  const handoverTime = booking?.deliveredAt || booking?.completedAt || booking?.actualDeliveryDate;
  const deadline24h = handoverTime ? dayjs(handoverTime).add(24, 'hour') : null;
  const isWithin24h = !deadline24h || dayjs().isBefore(deadline24h);
  const canClaim = ['Completed', 'ArrivedDestination', 'Delivered'].includes(booking?.status || booking?.Status) && isWithin24h;

  useEffect(() => {
    if (!bookingId) return;
    let active = true;
    claimService
      .list({ bookingId })
      .then((res) => {
        if (active) setClaims(unwrapList(res));
      })
      .catch(() => {
        if (active) setClaims([]);
      });
    return () => {
      active = false;
    };
  }, [bookingId, refreshKey]);

  const handleSubmitClaim = async () => {
    let values;
    try {
      values = await form.validateFields();
    } catch {
      return;
    }

    setSubmitting(true);
    try {
      const payload = {
        bookingHorseId: values.bookingHorseId,
        claimType: values.claimType,
        requestedAmount: Number(values.requestedAmount),
        description: values.description?.trim(),
      };

      const res = unwrapData(await claimService.createClaim(bookingId, payload));
      const claimId = res?.claimId || res?.id;

      // Nếu có tệp đính kèm, tải lên qua uploadEvidence
      if (claimId && fileList.length > 0) {
        for (const f of fileList) {
          if (f.originFileObj) {
            const formData = new FormData();
            formData.append('file', f.originFileObj);
            await claimService.uploadEvidence(claimId, formData).catch(() => {});
          }
        }
      }

      message.success(t('claims.messages.createSuccess', 'Đã gửi yêu cầu bồi thường bảo hiểm thành công'));
      setModalOpen(false);
      form.resetFields();
      setFileList([]);
      setRefreshKey((k) => k + 1);
    } catch (err) {
      message.error(getErrorMessage(err, t('claims.messages.createFailed', 'Gửi yêu cầu thất bại')));
    } finally {
      setSubmitting(false);
    }
  };

  const columns = [
    {
      title: t('claims.fields.claimCode', 'Mã hồ sơ'),
      dataIndex: 'claimCode',
      render: (code, r) => <Text strong>{code || `#${r.claimId}`}</Text>,
    },
    {
      title: t('claims.fields.horse', 'Ngựa'),
      dataIndex: 'horseName',
      render: (name) => <Text>{name || '—'}</Text>,
    },
    {
      title: t('claims.fields.type', 'Loại bồi thường'),
      dataIndex: 'claimType',
      render: (type) => {
        const map = {
          Injury: { label: t('claims.types.injury', 'Chấn thương'), color: 'volcano' },
          Death: { label: t('claims.types.death', 'Tử vong'), color: 'red' },
          Loss: { label: t('claims.types.loss', 'Thất lạc'), color: 'magenta' },
        };
        const m = map[type] || { label: type, color: 'default' };
        return <Tag color={m.color}>{m.label}</Tag>;
      },
    },
    {
      title: t('claims.fields.requestedAmount', 'Yêu cầu'),
      dataIndex: 'requestedAmount',
      align: 'right',
      render: (amt) => `${Number(amt || 0).toLocaleString()} USD`,
    },
    {
      title: t('claims.fields.approvedAmount', 'Được duyệt'),
      dataIndex: 'approvedAmount',
      align: 'right',
      render: (amt) => (amt !== null && amt !== undefined ? `${Number(amt).toLocaleString()} USD` : '—'),
    },
    {
      title: t('claims.fields.status', 'Trạng thái'),
      dataIndex: 'status',
      render: (s) => <StatusTag status={s} />,
    },
  ];

  return (
    <Card
      title={
        <Space>
          <SafetyCertificateOutlined style={{ color: '#2563EB' }} />
          <span>{t('claims.title', 'Hồ sơ bồi thường bảo hiểm (R-13)')}</span>
        </Space>
      }
      extra={
        <Button
          type="primary"
          icon={<PlusOutlined />}
          disabled={!canClaim}
          onClick={() => setModalOpen(true)}
          style={{ backgroundColor: '#2563EB', borderColor: '#2563EB', fontWeight: 600 }}
        >
          {t('claims.actions.newClaim', 'Yêu cầu bồi thường')}
        </Button>
      }
    >
      {/* Thông báo thời hạn 24 giờ sau khi ký e-POD */}
      {deadline24h && (
        <Alert
          type={isWithin24h ? 'info' : 'warning'}
          showIcon
          icon={<ClockCircleOutlined />}
          style={{ marginBottom: 16 }}
          message={
            isWithin24h
              ? t('claims.timeRemaining', {
                  time: deadline24h.format('DD/MM/YYYY HH:mm'),
                  defaultValue: `Thời hạn gửi yêu cầu bồi thường: đến ${deadline24h.format('DD/MM/YYYY HH:mm')} (trong vòng 24 giờ sau khi bàn giao).`,
                })
              : t('claims.expiredNotice', 'Đã quá thời hạn 24 giờ kể từ khi ký biên bản giao nhận e-POD.')
          }
        />
      )}

      <Table
        size="small"
        dataSource={claims}
        columns={columns}
        rowKey="claimId"
                pagination={false}
        expandable={{
          expandedRowRender: (record) => (
            <div style={{ padding: '8px 16px', background: '#F8FAFC', borderRadius: 6 }}>
              <Descriptions size="small" column={{ xs: 1, sm: 2 }}>
                <Descriptions.Item label={t('claims.fields.description', 'Mô tả sự cố')}>
                  {record.description || '—'}
                </Descriptions.Item>
                <Descriptions.Item label={t('claims.fields.decisionNote', 'Phản hồi / Ghi chú duyệt')}>
                  {record.decisionNote || record.note || '—'}
                </Descriptions.Item>
                {record.paymentReference && (
                  <Descriptions.Item label={t('claims.fields.paymentRef', 'Mã tham chiếu thanh toán')}>
                    <Text code>{record.paymentReference}</Text>
                  </Descriptions.Item>
                )}
              </Descriptions>
            </div>
          ),
        }}
        locale={{
          emptyText: t('claims.empty', 'Chưa có hồ sơ bồi thường bảo hiểm nào cho đơn này.'),
        }}
      />

      {/* Modal nộp yêu cầu bồi thường */}
      <Modal
        title={t('claims.modal.title', 'Nộp yêu cầu bồi thường bảo hiểm')}
        open={modalOpen}
        onCancel={() => setModalOpen(false)}
        onOk={handleSubmitClaim}
        confirmLoading={submitting}
        okText={t('common.submit', 'Gửi yêu cầu')}
        destroyOnClose
      >
        <Form form={form} layout="vertical" style={{ marginTop: 16 }}>
          <Form.Item
            name="bookingHorseId"
            label={t('claims.fields.selectHorse', 'Chọn con ngựa bị tổn thất / thương tích')}
            rules={[{ required: true, message: t('claims.errors.horseRequired', 'Vui lòng chọn ngựa') }]}
          >
            <Select
              placeholder={t('claims.fields.horsePlaceholder', 'Chọn ngựa...')}
              options={horses.map((h) => ({
                value: h.bookingHorseId || h.horseId,
                label: `${h.horseName} (${h.microchipNumber || 'Chưa gắn chip'})`,
              }))}
            />
          </Form.Item>

          <Form.Item
            name="claimType"
            label={t('claims.fields.type', 'Loại bồi thường')}
            rules={[{ required: true, message: t('claims.errors.typeRequired', 'Vui lòng chọn loại') }]}
          >
            <Select
              placeholder={t('claims.fields.typePlaceholder', 'Chọn loại tổn thất...')}
              options={[
                { value: 'Injury', label: t('claims.types.injury', 'Chấn thương (chi phí thú y)') },
                { value: 'Death', label: t('claims.types.death', 'Tử vong') },
                { value: 'Loss', label: t('claims.types.loss', 'Thất lạc') },
              ]}
            />
          </Form.Item>

          <Form.Item
            name="requestedAmount"
            label={t('claims.fields.amountUsd', 'Số tiền yêu cầu bồi thường (USD)')}
            rules={[{ required: true, message: t('claims.errors.amountRequired', 'Vui lòng nhập số tiền') }]}
          >
            <InputNumber
              min={1}
              style={{ width: '100%' }}
              prefix="$"
              placeholder="5000"
            />
          </Form.Item>

          <Form.Item
            name="description"
            label={t('claims.fields.description', 'Mô tả chi tiết nguyên nhân & mức độ tổn thất')}
            rules={[{ required: true, message: t('claims.errors.descRequired', 'Vui lòng mô tả sự cố') }]}
          >
            <TextArea rows={3} placeholder={t('claims.fields.descPlaceholder', 'Mô tả diễn biến, triệu chứng hoặc nguyên nhân thương tích...')} />
          </Form.Item>

          <Form.Item label={t('claims.fields.evidence', 'Chứng từ bổ sung (biên bản thú y, hóa đơn, ảnh hiện trường)')}>
            <Upload
              fileList={fileList}
              beforeUpload={() => false}
              onChange={({ fileList: list }) => setFileList(list)}
              multiple
            >
              <Button icon={<UploadOutlined />}>
                {t('claims.actions.uploadFiles', 'Chọn tệp đính kèm')}
              </Button>
            </Upload>
          </Form.Item>
        </Form>
      </Modal>
    </Card>
  );
}
