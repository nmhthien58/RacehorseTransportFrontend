import { useState, useEffect, useCallback, useMemo } from 'react';
import {
  Card,
  Table,
  Tag,
  Segmented,
  Button,
  Modal,
  Form,
  Input,
  InputNumber,
  Select,
  Descriptions,
Space,
  Typography,
  Flex,
  message,
} from 'antd';
import {
  SafetyCertificateOutlined,
  CheckOutlined,
  CloseOutlined,
  EyeOutlined,
  ReloadOutlined,
  DollarOutlined,
} from '@ant-design/icons';
import { useTranslation } from 'react-i18next';
import PageHeader from '@components/layout/PageHeader';
import StatusTag from '@components/common/StatusTag';
import claimService from '@services/claimService';
import { unwrapList, getErrorMessage } from '@utils/apiHelpers';

const { Text, Title } = Typography;
const { TextArea } = Input;

// Đang tạo InsuranceClaimsPage vì quản lý danh sách và thẩm định hồ sơ bồi thường bảo hiểm ngựa đua theo FE-11 (R-13, BE-12)
export default function InsuranceClaimsPage() {
  const { t } = useTranslation();
  const [claims, setClaims] = useState([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('All');
  const [refreshKey, setRefreshKey] = useState(0);

  // Modal xem chi tiết & thẩm định
  const [selectedClaim, setSelectedClaim] = useState(null);
  const [detailModalOpen, setDetailModalOpen] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);

  // Form duyệt / từ chối / chi trả
  const [approveForm] = Form.useForm();
  const [rejectForm] = Form.useForm();
  const [payForm] = Form.useForm();
  const [actionType, setActionType] = useState(null); // 'approve' | 'reject' | 'pay'

  const refresh = useCallback(() => setRefreshKey((k) => k + 1), []);

  useEffect(() => {
    let active = true;
    claimService
      .list(statusFilter === 'All' ? {} : { status: statusFilter })
      .then((res) => {
        if (!active) return;
        setClaims(unwrapList(res));
      })
      .catch((err) => {
        if (active) message.error(getErrorMessage(err, t('claims.loadFailed', 'Không thể tải danh sách hồ sơ bồi thường')));
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, [statusFilter, refreshKey, t]);

  const handleOpenDetail = (claim) => {
    setSelectedClaim(claim);
    setActionType(null);
    approveForm.setFieldsValue({
      approvedAmount: claim.requestedAmount || 0,
      note: '',
    });
    setDetailModalOpen(true);
  };

  // Tính trần bồi thường tối đa theo chính sách R-13
  const maxCap = useMemo(() => {
    if (!selectedClaim) return 0;
    const agreed = Number(selectedClaim.agreedValue || 50000);
    const plan = selectedClaim.insurancePlan || 'Full';
    const type = selectedClaim.claimType;

    if (plan === 'Full') {
      if (type === 'Death' || type === 'Loss') return agreed;
      // Injury: chi phí thú y tối đa 15% giá trị thỏa thuận (theo chính sách)
      return Math.round(agreed * 0.15);
    }
    // Plan === 'None': trách nhiệm cơ bản
    if (type === 'Death' || type === 'Loss') return 10000;
    return 3000;
  }, [selectedClaim]);

  const handleReviewClaim = async () => {
    if (!selectedClaim) return;
    setActionLoading(true);
    try {
      await claimService.reviewClaim(selectedClaim.claimId);
      message.success(t('claims.messages.reviewed', 'Đã chuyển hồ sơ sang trạng thái thẩm định'));
      refresh();
      setDetailModalOpen(false);
    } catch (err) {
      message.error(getErrorMessage(err, t('common.error', 'Thao tác thất bại')));
    } finally {
      setActionLoading(false);
    }
  };

  const handleApprove = async () => {
    let values;
    try {
      values = await approveForm.validateFields();
    } catch {
      return;
    }
    setActionLoading(true);
    try {
      await claimService.approveClaim(selectedClaim.claimId, {
        approvedAmount: Number(values.approvedAmount),
        note: values.note?.trim(),
      });
      message.success(t('claims.messages.approvedSuccess', 'Đã phê duyệt số tiền bồi thường'));
      refresh();
      setDetailModalOpen(false);
    } catch (err) {
      message.error(getErrorMessage(err, t('common.error', 'Phê duyệt thất bại')));
    } finally {
      setActionLoading(false);
    }
  };

  const handleReject = async () => {
    let values;
    try {
      values = await rejectForm.validateFields();
    } catch {
      return;
    }
    setActionLoading(true);
    try {
      await claimService.rejectClaim(selectedClaim.claimId, {
        reason: values.reason?.trim(),
      });
      message.success(t('claims.messages.rejectedSuccess', 'Đã từ chối bồi thường theo điều khoản'));
      refresh();
      setDetailModalOpen(false);
    } catch (err) {
      message.error(getErrorMessage(err, t('common.error', 'Từ chối thất bại')));
    } finally {
      setActionLoading(false);
    }
  };

  const handleMarkPaid = async () => {
    let values;
    try {
      values = await payForm.validateFields();
    } catch {
      return;
    }
    setActionLoading(true);
    try {
      await claimService.markPaid(selectedClaim.claimId, {
        reference: values.reference?.trim(),
        note: values.note?.trim(),
      });
      message.success(t('claims.messages.paidSuccess', 'Đã ghi nhận chi trả tiền bồi thường'));
      refresh();
      setDetailModalOpen(false);
    } catch (err) {
      message.error(getErrorMessage(err, t('common.error', 'Chi trả thất bại')));
    } finally {
      setActionLoading(false);
    }
  };

  const columns = [
    {
      title: t('claims.fields.claimCode', 'Mã hồ sơ'),
      dataIndex: 'claimCode',
      render: (code, r) => <Text strong>{code || `#${r.claimId}`}</Text>,
    },
    {
      title: t('claims.fields.booking', 'Đơn hàng'),
      dataIndex: 'bookingCode',
      render: (code, r) => code || `#${r.bookingId}`,
    },
    {
      title: t('claims.fields.horse', 'Ngựa'),
      dataIndex: 'horseName',
      render: (name, r) => (
        <div>
          <Text strong>{name}</Text>
          <div style={{ fontSize: 12, color: '#64748B' }}>{r.microchipNumber || 'Chưa gắn chip'}</div>
        </div>
      ),
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
      title: t('claims.fields.insurancePlan', 'Gói bảo hiểm'),
      dataIndex: 'insurancePlan',
      render: (p) => <Tag color={p === 'Full' ? 'gold' : 'default'}>{p === 'Full' ? 'Toàn giá trị' : 'Cơ bản'}</Tag>,
    },
    {
      title: t('claims.fields.requestedAmount', 'Yêu cầu'),
      dataIndex: 'requestedAmount',
      align: 'right',
      render: (amt) => `${Number(amt || 0).toLocaleString()} USD`,
    },
    {
      title: t('claims.fields.approvedAmount', 'Đã duyệt'),
      dataIndex: 'approvedAmount',
      align: 'right',
      render: (amt) => (amt !== null && amt !== undefined ? `${Number(amt).toLocaleString()} USD` : '—'),
    },
    {
      title: t('claims.fields.status', 'Trạng thái'),
      dataIndex: 'status',
      render: (s) => <StatusTag status={s} />,
    },
    {
      title: '',
      render: (_, r) => (
        <Button
          size="small"
          icon={<EyeOutlined />}
          onClick={() => handleOpenDetail(r)}
        >
          {t('common.review', 'Thẩm định')}
        </Button>
      ),
    },
  ];

  return (
    <div style={{ paddingBottom: 40 }}>
      <PageHeader
        title={t('claims.managerTitle', 'Hồ sơ bồi thường bảo hiểm (R-13)')}
        subtitle={t('claims.managerSubtitle', 'Tiếp nhận, thẩm định và chi trả các yêu cầu bồi thường tổn thất theo điều khoản chính sách dịch vụ.')}
        actions={
          <Button icon={<ReloadOutlined />} onClick={refresh}>
            {t('common.refresh', 'Làm mới')}
          </Button>
        }
      />

      <Card style={{ borderRadius: 14 }}>
        <Space direction="vertical" size={16} style={{ width: '100%' }}>
          <Segmented
            value={statusFilter}
            onChange={setStatusFilter}
            options={[
              { value: 'All', label: `${t('common.all', 'Tất cả')} (${claims.length})` },
              { value: 'Open', label: t('status.open', 'Chờ xử lý') },
              { value: 'UnderReview', label: t('status.underReview', 'Đang thẩm định') },
              { value: 'Approved', label: t('status.approved', 'Đã duyệt') },
              { value: 'Rejected', label: t('status.rejected', 'Từ chối') },
              { value: 'Paid', label: t('status.paid', 'Đã chi trả') },
            ]}
          />

          <Table
            size="small"
            dataSource={claims}
            columns={columns}
            rowKey="claimId"
            loading={loading}
            pagination={{ pageSize: 10 }}
          />
        </Space>
      </Card>

      {/* Modal thẩm định chi tiết */}
      <Modal
        title={
          <Space>
            <SafetyCertificateOutlined style={{ color: '#2563EB' }} />
            <span>{t('claims.detailTitle', 'Thẩm định hồ sơ bồi thường')} #{selectedClaim?.claimCode || selectedClaim?.claimId}</span>
          </Space>
        }
        open={detailModalOpen}
        onCancel={() => setDetailModalOpen(false)}
        width={720}
        destroyOnClose
        footer={null}
      >
        {selectedClaim && (
          <Space direction="vertical" size={16} style={{ width: '100%', marginTop: 8 }}>
            <Descriptions column={{ xs: 1, sm: 2 }} size="small" bordered>
              <Descriptions.Item label={t('claims.fields.horse', 'Ngựa')}>
                <Text strong>{selectedClaim.horseName}</Text> ({selectedClaim.microchipNumber || 'Chưa gắn chip'})
              </Descriptions.Item>
              <Descriptions.Item label={t('claims.fields.type', 'Loại tổn thất')}>
                <Tag color="volcano">{selectedClaim.claimType}</Tag>
              </Descriptions.Item>
              <Descriptions.Item label={t('claims.fields.insurancePlan', 'Gói bảo hiểm')}>
                <Tag color={selectedClaim.insurancePlan === 'Full' ? 'gold' : 'default'}>
                  {selectedClaim.insurancePlan === 'Full' ? 'Toàn giá trị' : 'Không mua (Cơ bản)'}
                </Tag>
              </Descriptions.Item>
              <Descriptions.Item label={t('claims.fields.agreedValue', 'Giá trị thỏa thuận')}>
                <Text strong>{Number(selectedClaim.agreedValue || 50000).toLocaleString()} USD</Text>
              </Descriptions.Item>
              <Descriptions.Item label={t('claims.fields.requestedAmount', 'Khách hàng yêu cầu')}>
                <Text strong style={{ color: '#DC2626', fontSize: 15 }}>
                  {Number(selectedClaim.requestedAmount || 0).toLocaleString()} USD
                </Text>
              </Descriptions.Item>
              <Descriptions.Item label={t('claims.fields.maxCap', 'Trần chi trả theo chính sách')}>
                <Text strong style={{ color: '#047857', fontSize: 15 }}>
                  {Number(maxCap).toLocaleString()} USD
                </Text>
              </Descriptions.Item>
            </Descriptions>

            <Card size="small" title={t('claims.fields.description', 'Mô tả diễn biến & nguyên nhân')}>
              <Text>{selectedClaim.description || '—'}</Text>
            </Card>

            {/* Trạng thái và nút xử lý */}
            <Flex justify="space-between" align="center" style={{ paddingTop: 8, borderTop: '1px solid #E2E8F0' }}>
              <Space>
                <Text type="secondary">{t('common.status', 'Trạng thái')}:</Text>
                <StatusTag status={selectedClaim.status} />
              </Space>

              <Space>
                {selectedClaim.status === 'Open' && (
                  <Button
                    loading={actionLoading}
                    onClick={handleReviewClaim}
                  >
                    {t('claims.actions.startReview', 'Bắt đầu thẩm định')}
                  </Button>
                )}

                {['Open', 'UnderReview'].includes(selectedClaim.status) && (
                  <>
                    <Button
                      danger
                      icon={<CloseOutlined />}
                      onClick={() => setActionType('reject')}
                    >
                      {t('claims.actions.reject', 'Từ chối')}
                    </Button>
                    <Button
                      type="primary"
                      icon={<CheckOutlined />}
                      onClick={() => setActionType('approve')}
                      style={{ backgroundColor: '#10B981', borderColor: '#10B981' }}
                    >
                      {t('claims.actions.approve', 'Duyệt bồi thường')}
                    </Button>
                  </>
                )}

                {selectedClaim.status === 'Approved' && (
                  <Button
                    type="primary"
                    icon={<DollarOutlined />}
                    onClick={() => setActionType('pay')}
                    style={{ backgroundColor: '#F59E0B', borderColor: '#F59E0B', color: '#0F172A', fontWeight: 600 }}
                  >
                    {t('claims.actions.markPaid', 'Đánh dấu đã chi trả')}
                  </Button>
                )}
              </Space>
            </Flex>

            {/* Form Phê duyệt */}
            {actionType === 'approve' && (
              <Card size="small" style={{ background: '#F0FDF4', borderColor: '#BBF7D0' }}>
                <Title level={5} style={{ margin: '0 0 12px 0', color: '#166534' }}>
                  {t('claims.approveForm.title', 'Phê duyệt số tiền bồi thường')}
                </Title>
                <Form form={approveForm} layout="vertical">
                  <Form.Item
                    name="approvedAmount"
                    label={`${t('claims.fields.approvedAmount', 'Số tiền duyệt (USD)')} (≤ ${Number(maxCap).toLocaleString()} USD)`}
                    rules={[
                      { required: true, message: 'Vui lòng nhập số tiền duyệt' },
                      {
                        validator: (_, value) =>
                          value > maxCap
                            ? Promise.reject(new Error(`Số tiền không được vượt quá trần ${Number(maxCap).toLocaleString()} USD`))
                            : Promise.resolve(),
                      },
                    ]}
                  >
                    <InputNumber min={1} max={maxCap} style={{ width: '100%' }} prefix="$" />
                  </Form.Item>
                  <Form.Item name="note" label={t('claims.fields.note', 'Căn cứ phê duyệt')}>
                    <TextArea rows={2} placeholder="Ghi rõ cơ sở kết luận thú y hoặc quyết định..." />
                  </Form.Item>
                  <Space>
                    <Button type="primary" loading={actionLoading} onClick={handleApprove} style={{ backgroundColor: '#10B981', borderColor: '#10B981' }}>
                      {t('common.confirm', 'Xác nhận duyệt')}
                    </Button>
                    <Button onClick={() => setActionType(null)}>{t('common.cancel', 'Hủy')}</Button>
                  </Space>
                </Form>
              </Card>
            )}

            {/* Form Từ chối */}
            {actionType === 'reject' && (
              <Card size="small" style={{ background: '#FEF2F2', borderColor: '#FECACA' }}>
                <Title level={5} style={{ margin: '0 0 12px 0', color: '#991B1B' }}>
                  {t('claims.rejectForm.title', 'Từ chối yêu cầu bồi thường')}
                </Title>
                <Form form={rejectForm} layout="vertical">
                  <Form.Item
                    name="reason"
                    label={t('claims.fields.rejectReason', 'Lý do từ chối theo điều khoản loại trừ')}
                    rules={[{ required: true, message: 'Vui lòng chọn hoặc nhập lý do từ chối' }]}
                  >
                    <Select
                      placeholder="Chọn lý do loại trừ..."
                      style={{ marginBottom: 8 }}
                      onChange={(val) => rejectForm.setFieldValue('reason', val)}
                      options={[
                        { value: 'Bệnh lý bẩm sinh hoặc có trước chuyến đi', label: 'Bệnh lý bẩm sinh hoặc có trước chuyến đi' },
                        { value: 'Quá thời hạn 24 giờ kể từ khi ký biên bản giao nhận e-POD', label: 'Quá thời hạn 24 giờ kể từ khi ký e-POD' },
                        { value: 'Thiếu biên bản xác nhận của bác sĩ thú y chỉ định', label: 'Thiếu biên bản xác nhận của bác sĩ thú y' },
                        { value: 'Tổn thất phát sinh do lỗi bất cẩn của người nhận', label: 'Lỗi bất cẩn của người nhận' },
                      ]}
                    />
                  </Form.Item>
                  <Form.Item name="reason" rules={[{ required: true }]}>
                    <TextArea rows={2} placeholder="Chi tiết lý do từ chối..." />
                  </Form.Item>
                  <Space>
                    <Button danger type="primary" loading={actionLoading} onClick={handleReject}>
                      {t('common.confirm', 'Xác nhận từ chối')}
                    </Button>
                    <Button onClick={() => setActionType(null)}>{t('common.cancel', 'Hủy')}</Button>
                  </Space>
                </Form>
              </Card>
            )}

            {/* Form Chi trả */}
            {actionType === 'pay' && (
              <Card size="small" style={{ background: '#FFFBEB', borderColor: '#FDE68A' }}>
                <Title level={5} style={{ margin: '0 0 12px 0', color: '#92400E' }}>
                  {t('claims.payForm.title', 'Ghi nhận chi trả bồi thường')}
                </Title>
                <Form form={payForm} layout="vertical">
                  <Form.Item
                    name="reference"
                    label={t('claims.fields.paymentRef', 'Mã tham chiếu thanh toán (Mã giao dịch ngân hàng)')}
                    rules={[{ required: true, message: 'Vui lòng nhập mã tham chiếu giao dịch' }]}
                  >
                    <Input placeholder="Vd: FT26010088921 hoặc VNPay-9981" />
                  </Form.Item>
                  <Form.Item name="note" label={t('claims.fields.note', 'Ghi chú')}>
                    <TextArea rows={2} placeholder="Ghi chú thêm về phương thức chi trả..." />
                  </Form.Item>
                  <Space>
                    <Button type="primary" loading={actionLoading} onClick={handleMarkPaid} style={{ backgroundColor: '#F59E0B', borderColor: '#F59E0B', color: '#0F172A', fontWeight: 600 }}>
                      {t('common.confirm', 'Xác nhận đã chi trả')}
                    </Button>
                    <Button onClick={() => setActionType(null)}>{t('common.cancel', 'Hủy')}</Button>
                  </Space>
                </Form>
              </Card>
            )}
          </Space>
        )}
      </Modal>
    </div>
  );
}
