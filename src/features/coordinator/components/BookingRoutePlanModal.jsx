import { useState, useEffect } from 'react';
import {
  Modal,
  Form,
  Input,
  Select,
  Button,
  Table,
  Space,
  Tag,
  Typography,
  Alert,
  Card,
  Row,
  Col,
  Flex,
  message,
} from 'antd';
import {
  CompassOutlined,
  DeleteOutlined,
  EyeOutlined,
  PlusOutlined,
  SendOutlined,
} from '@ant-design/icons';
import { useTranslation } from 'react-i18next';
import routePlanService from '@services/routePlanService';
import { unwrapData, unwrapList, getErrorMessage } from '@utils/apiHelpers';

const { Text, Title } = Typography;

// Đang tạo BookingRoutePlanModal vì phục vụ Coordinator lập và trình duyệt tuyến cho đơn hàng PreApproved (R-10, BE-04)
export default function BookingRoutePlanModal({
  open,
  booking,
  onClose,
  onSuccess,
}) {
  const { t } = useTranslation();
  const [form] = Form.useForm();
  const [submitting, setSubmitting] = useState(false);
  const [previewing, setPreviewing] = useState(false);

  const [existingPlan, setExistingPlan] = useState(null);
  const [stops, setStops] = useState([]);
  const [previewData, setPreviewData] = useState(null);

  // Điểm dừng mới đang nhập
  const [newStop, setNewStop] = useState({
    name: '',
    stopType: 'RestStop',
    address: '',
    countryCode: 'VN',
    lat: 21.0,
    lng: 105.8,
  });

  useEffect(() => {
    if (!open || !booking) return;

    let active = true;
    const bookingId = booking.bookingId || booking.BookingID;
    routePlanService
      .getForBooking(bookingId)
      .then((res) => {
        if (!active) return;
        const list = unwrapList(res);
        if (list.length > 0) {
          const latest = list[list.length - 1];
          setExistingPlan(latest);
          if (Array.isArray(latest.stops)) {
            setStops(latest.stops);
          }
          form.setFieldValue('notes', latest.notes || '');
        }
      })
      .catch(() => {});

    return () => {
      active = false;
    };
  }, [open, booking, form]);

  const handleAddStop = () => {
    if (!newStop.name.trim()) {
      message.warning(t('tripPlan.messages.stopNameRequired', 'Vui lòng nhập tên điểm dừng / cửa khẩu'));
      return;
    }
    setStops((prev) => [
      ...prev,
      {
        ...newStop,
        stopId: Date.now(),
        sequence: prev.length + 1,
      },
    ]);
    setNewStop({
      name: '',
      stopType: 'RestStop',
      address: '',
      countryCode: booking?.pickupCountryCode || 'VN',
      lat: 21.0,
      lng: 105.8,
    });
  };

  const handleRemoveStop = (index) => {
    setStops((prev) => prev.filter((_, idx) => idx !== index));
  };

  const handlePreview = async () => {
    const bookingId = booking?.bookingId || booking?.BookingID;
    if (!bookingId) return;

    setPreviewing(true);
    try {
      const notes = form.getFieldValue('notes');
      const payload = {
        stops: stops.map((s) => ({
          name: s.name,
          stopType: s.stopType,
          address: s.address,
          countryCode: s.countryCode,
          lat: Number(s.lat || 0),
          lng: Number(s.lng || 0),
        })),
        notes,
      };
      const res = unwrapData(await routePlanService.previewRoutePlan(bookingId, payload));
      setPreviewData(res);
      message.success(t('tripPlan.messages.previewLoaded', 'Đã tính toán lộ trình dự kiến'));
    } catch (err) {
      message.error(getErrorMessage(err, t('tripPlan.messages.previewFailed', 'Không thể tính lộ trình')));
    } finally {
      setPreviewing(false);
    }
  };

  const handleSubmit = async () => {
    const bookingId = booking?.bookingId || booking?.BookingID;
    if (!bookingId) return;

    setSubmitting(true);
    try {
      const notes = form.getFieldValue('notes');
      const payload = {
        stops: stops.map((s) => ({
          name: s.name,
          stopType: s.stopType,
          address: s.address,
          countryCode: s.countryCode,
          lat: Number(s.lat || 0),
          lng: Number(s.lng || 0),
        })),
        notes,
        totalDistanceKm: previewData?.totalDistanceKm,
        estimatedHours: previewData?.estimatedHours,
        transitCountryCodes: previewData?.transitCountryCodes,
      };

      const planRes = unwrapData(await routePlanService.createRoutePlan(bookingId, payload));
      const planId = planRes?.routePlanId || planRes?.id || existingPlan?.routePlanId;

      if (planId) {
        await routePlanService.submitRoutePlan(planId);
      }

      message.success(t('tripPlan.messages.submittedSuccess', 'Đã trình duyệt tuyến thành công cho Manager'));
      onSuccess?.();
      onClose();
    } catch (err) {
      message.error(getErrorMessage(err, t('tripPlan.messages.submitFailed', 'Trình duyệt tuyến thất bại')));
    } finally {
      setSubmitting(false);
    }
  };

  const columns = [
    {
      title: '#',
      dataIndex: 'sequence',
      width: 50,
      render: (_, __, idx) => idx + 1,
    },
    {
      title: t('tripPlan.fields.stopType', 'Loại điểm'),
      dataIndex: 'stopType',
      width: 120,
      render: (type) =>
        type === 'BorderGate' ? (
          <Tag color="purple">{t('tripPlan.stopTypes.borderGate', 'Cửa khẩu')}</Tag>
        ) : (
          <Tag color="cyan">{t('tripPlan.stopTypes.restStop', 'Trạm nghỉ')}</Tag>
        ),
    },
    {
      title: t('tripPlan.fields.stopName', 'Tên trạm / Mốc'),
      dataIndex: 'name',
      render: (text) => <Text strong>{text}</Text>,
    },
    {
      title: t('tripPlan.fields.country', 'Nước'),
      dataIndex: 'countryCode',
      width: 80,
      render: (c) => <Tag>{c}</Tag>,
    },
    {
      title: t('tripPlan.fields.address', 'Địa chỉ / Tọa độ'),
      render: (_, r) => (
        <span style={{ fontSize: 12 }}>
          {r.address || `${r.lat}, ${r.lng}`}
        </span>
      ),
    },
    {
      title: '',
      width: 60,
      render: (_, __, idx) => (
        <Button
          type="text"
          danger
          icon={<DeleteOutlined />}
          onClick={() => handleRemoveStop(idx)}
        />
      ),
    },
  ];

  const bookingCode = booking?.bookingCode || booking?.BookingCode || `#${booking?.bookingId}`;

  return (
    <Modal
      title={
        <Space>
          <CompassOutlined style={{ color: '#2563EB' }} />
          <span>{t('tripPlan.drawer.title', 'Lập tuyến vận chuyển cho đơn')} {bookingCode}</span>
        </Space>
      }
      open={open}
      onCancel={onClose}
      width={840}
      destroyOnClose
      footer={
        <Flex justify="space-between" align="center">
          <Button onClick={onClose}>{t('common.cancel', 'Đóng')}</Button>
          <Space>
            <Button
              icon={<EyeOutlined />}
              onClick={handlePreview}
              loading={previewing}
            >
              {t('tripPlan.actions.previewRoute', 'Xem trước tuyến')}
            </Button>
            <Button
              type="primary"
              icon={<SendOutlined />}
              onClick={handleSubmit}
              loading={submitting}
              style={{ backgroundColor: '#F59E0B', borderColor: '#F59E0B', color: '#0f172a', fontWeight: 700 }}
            >
              {t('tripPlan.actions.submitRoute', 'Lưu & Trình duyệt')}
            </Button>
          </Space>
        </Flex>
      }
    >
      <Space orientation="vertical" size={16} style={{ width: '100%', marginTop: 8 }}>
        {existingPlan?.rejectionReason && (
          <Alert
            type="error"
            showIcon
            message={t('tripPlan.drawer.rejectionAlert', 'Tuyến trước đó đã bị Manager từ chối')}
            description={existingPlan.rejectionReason}
          />
        )}

        {/* Thông tin điểm xuất phát & đích đến (khóa từ đơn) */}
        <Row gutter={[16, 16]}>
          <Col xs={24} sm={12}>
            <Card size="small" style={{ borderRadius: 8, background: '#F8FAFC' }}>
              <Text type="secondary" style={{ fontSize: 12 }}>
                {t('tripPlan.drawer.origin', 'Điểm đón (Khóa từ đơn)')}
              </Text>
              <div style={{ fontWeight: 600, color: '#0F172A', marginTop: 4 }}>
                {booking?.pickupAddress || booking?.PickupAddress}
              </div>
              <Tag color="orange" style={{ marginTop: 6 }}>
                {booking?.pickupCountryCode || 'VN'}
              </Tag>
            </Card>
          </Col>
          <Col xs={24} sm={12}>
            <Card size="small" style={{ borderRadius: 8, background: '#F8FAFC' }}>
              <Text type="secondary" style={{ fontSize: 12 }}>
                {t('tripPlan.drawer.destination', 'Điểm trả (Khóa từ đơn)')}
              </Text>
              <div style={{ fontWeight: 600, color: '#0F172A', marginTop: 4 }}>
                {booking?.dropoffAddress || booking?.DropoffAddress}
              </div>
              <Tag color="green" style={{ marginTop: 6 }}>
                {booking?.dropoffCountryCode || 'CN'}
              </Tag>
            </Card>
          </Col>
        </Row>

        {/* Danh sách mốc dừng / cửa khẩu dọc đường */}
        <Card
          size="small"
          title={t('tripPlan.drawer.stops', 'Các mốc dừng chân & Cửa khẩu quốc tế')}
          style={{ borderRadius: 8 }}
        >
          <Table
            size="small"
            dataSource={stops}
            columns={columns}
            rowKey="stopId"
            pagination={false}
            locale={{ emptyText: t('tripPlan.drawer.noStops', 'Chưa thêm điểm dừng trung gian nào') }}
            style={{ marginBottom: 12 }}
          />

          <Row gutter={[8, 8]}>
            <Col xs={24} sm={5}>
              <Select
                value={newStop.stopType}
                onChange={(v) => setNewStop((s) => ({ ...s, stopType: v }))}
                style={{ width: '100%' }}
                options={[
                  { value: 'RestStop', label: t('tripPlan.stopTypes.restStop', 'Trạm nghỉ') },
                  { value: 'BorderGate', label: t('tripPlan.stopTypes.borderGate', 'Cửa khẩu') },
                ]}
              />
            </Col>
            <Col xs={24} sm={7}>
              <Input
                placeholder={t('tripPlan.fields.stopNamePlaceholder', 'Tên điểm dừng / cửa khẩu')}
                value={newStop.name}
                onChange={(e) => setNewStop((s) => ({ ...s, name: e.target.value }))}
              />
            </Col>
            <Col xs={24} sm={4}>
              <Select
                value={newStop.countryCode}
                onChange={(v) => setNewStop((s) => ({ ...s, countryCode: v }))}
                style={{ width: '100%' }}
                options={[
                  { value: 'VN', label: 'VN' },
                  { value: 'LA', label: 'LA' },
                  { value: 'KH', label: 'KH' },
                  { value: 'TH', label: 'TH' },
                  { value: 'CN', label: 'CN' },
                ]}
              />
            </Col>
            <Col xs={24} sm={5}>
              <Input
                placeholder={t('tripPlan.fields.addressPlaceholder', 'Địa chỉ')}
                value={newStop.address}
                onChange={(e) => setNewStop((s) => ({ ...s, address: e.target.value }))}
              />
            </Col>
            <Col xs={24} sm={3}>
              <Button
                type="dashed"
                icon={<PlusOutlined />}
                onClick={handleAddStop}
                style={{ width: '100%' }}
              >
                {t('common.add', 'Thêm')}
              </Button>
            </Col>
          </Row>
        </Card>

        {/* Kết quả preview */}
        {previewData && (
          <Card
            size="small"
            style={{ borderRadius: 8, background: '#EFF6FF', borderColor: '#BFDBFE' }}
          >
            <Title level={5} style={{ margin: '0 0 8px 0', color: '#1E40AF' }}>
              {t('tripPlan.drawer.previewInfo', 'Thông số lộ trình dự kiến')}
            </Title>
            <Row gutter={[16, 8]}>
              <Col xs={12} sm={8}>
                <Text type="secondary">{t('tripPlan.drawer.totalDistance', 'Tổng quãng đường')}:</Text>{' '}
                <Text strong>{Number(previewData.totalDistanceKm || 0).toLocaleString()} km</Text>
              </Col>
              <Col xs={12} sm={8}>
                <Text type="secondary">{t('tripPlan.drawer.totalHours', 'Thời gian ước tính')}:</Text>{' '}
                <Text strong>{previewData.estimatedHours || '—'} {t('common.hours', 'giờ')}</Text>
              </Col>
              <Col xs={24} sm={8}>
                <Text type="secondary">{t('tripPlan.drawer.transitCountries', 'Nước quá cảnh')}:</Text>{' '}
                {(previewData.transitCountryCodes || []).length > 0 ? (
                  previewData.transitCountryCodes.map((c) => (
                    <Tag color="geekblue" key={c}>{c}</Tag>
                  ))
                ) : (
                  <Text type="secondary">{t('common.none', 'Không có')}</Text>
                )}
              </Col>
            </Row>
            {Array.isArray(previewData.warnings) && previewData.warnings.length > 0 && (
              <Alert
                type="warning"
                showIcon
                style={{ marginTop: 8 }}
                message={previewData.warnings.join('; ')}
              />
            )}
          </Card>
        )}

        <Form form={form} layout="vertical">
          <Form.Item name="notes" label={t('tripPlan.fields.notes', 'Ghi chú tuyến')}>
            <Input.TextArea rows={2} placeholder={t('tripPlan.fields.notesPlaceholder', 'Ghi chú cho bộ phận kiểm dịch hoặc quản lý...')} />
          </Form.Item>
        </Form>
      </Space>
    </Modal>
  );
}
