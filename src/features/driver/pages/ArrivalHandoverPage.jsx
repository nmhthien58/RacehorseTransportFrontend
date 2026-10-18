import { useEffect, useState, useCallback } from 'react';
import { Card, Row, Col, Typography, Tag, Button, Form, Input, Radio, Spin, Alert, Empty, Image, Space, Checkbox, message } from 'antd';
import { FileDoneOutlined } from '@ant-design/icons';
import { useParams, useSearchParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import dayjs from 'dayjs';
import { useMissionDetail } from '../hooks/useDriverMissions';
import driverService from '../services/driverService';
import MissionHeaderCard from '../components/MissionHeaderCard';
import DigitalSignaturePad from '../components/DigitalSignaturePad';
import EmergencyReportModal from '../components/EmergencyReportModal';
import TripHorseStatusTag from '@components/common/TripHorseStatusTag';
import { unwrapList, getErrorMessage } from '@utils/apiHelpers';
import { HANDOVER_CONDITIONS, HANDOVER_CONDITION_COLOR } from '@utils/incidents';

const { Title, Text } = Typography;
const { TextArea } = Input;

const formatTime = (value) => (value ? dayjs(value).format('DD/MM/YYYY HH:mm') : '—');

/**
 * Bước 4 của đoàn xe: bàn giao ngựa tại điểm đến và lập biên bản e-POD.
 * Mỗi đơn trên chuyến một biên bản (POST /trips/{id}/handover, multipart). Tài xế cùng người nhận đối chiếu
 * từng con ngoài thực tế với ảnh và dữ liệu trên hệ thống rồi tích xác nhận; mã vi mạch gửi lên lấy từ hồ sơ.
 */
export default function ArrivalHandoverPage() {
  const { tripId } = useParams();
  const { t } = useTranslation();
  const { mission, loading, error, fetchMission, reportIncident } = useMissionDetail(tripId);
  const [form] = Form.useForm();
  const [searchParams] = useSearchParams();

  const [handovers, setHandovers] = useState([]);
  // Mở sẵn form của đơn khi đi từ nút "Bàn giao đơn ..." ở mốc DropOff (?booking=<id>)
  const [activeBookingId, setActiveBookingId] = useState(() =>
    searchParams.get('booking') ? Number(searchParams.get('booking')) : null,
  );
  // tripHorseId -> đã đối chiếu con ngựa thật với ảnh / dữ liệu trên hệ thống
  const [verified, setVerified] = useState({});
  const [signature, setSignature] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [sosModalOpen, setSosModalOpen] = useState(false);

  const loadHandovers = useCallback(
    () =>
      driverService
        .getHandovers(tripId)
        .then((res) => setHandovers(unwrapList(res)))
        .catch(() => setHandovers([])),
    [tripId],
  );

  useEffect(() => {
    loadHandovers();
  }, [loadHandovers]);

  if (loading && !mission) {
    return (
      <div style={{ textAlign: 'center', padding: '100px 0' }}>
        <Spin size="large" />
      </div>
    );
  }

  const bookings = mission?.bookings || [];
  const horses = mission?.horses || [];
  const checkpoints = mission?.routeCheckpoints || [];
  const tripUnderWay = ['InTransit', 'EmergencyRerouting', 'ArrivedDestination'].includes(mission?.overallStatus);
  const horsesOf = (bookingId) => horses.filter((h) => h.bookingId === bookingId);
  // Ngựa còn trên xe phải giao (con đã rớt lại giữa đường không giao ở đây)
  const onBoardOf = (bookingId) => horsesOf(bookingId).filter((h) => !h.status || h.status === 'InTransit');
  const handoverOf = (bookingId) => handovers.find((h) => h.bookingId === bookingId);
  // R-04: mốc trả của đơn (DropOff riêng hoặc mốc cuối); chỉ ký được khi xe đang dừng ở đó
  const dropoffOf = (booking) => checkpoints.find((c) => c.checkpointId === booking.dropoffCheckpointId);
  const canHandoverBooking = (booking) => {
    if (!tripUnderWay) return false;
    const dropoff = dropoffOf(booking);
    if (!dropoff) return mission?.overallStatus === 'ArrivedDestination';
    return dropoff.status === 'Arrived' && onBoardOf(booking.bookingId).length > 0;
  };

  const activeBooking = bookings.find((b) => b.bookingId === activeBookingId);
  const activeHorses = activeBooking ? onBoardOf(activeBooking.bookingId) : [];
  const allVerified = activeHorses.length > 0 && activeHorses.every((h) => verified[h.tripHorseId]);

  const openForm = (bookingId) => {
    setActiveBookingId(bookingId);
    setVerified({});
    setSignature(null);
    form.resetFields();
  };

  const handleSubmit = async () => {
    let values;
    try {
      values = await form.validateFields();
    } catch {
      return;
    }
    if (!allVerified) {
      message.error(t('handover.form.horsesNotVerified'));
      return;
    }
    if (!signature) {
      message.error(t('handover.form.signatureRequired'));
      return;
    }
    setSubmitting(true);
    try {
      const blob = await (await fetch(signature)).blob();
      await driverService.submitHandover(tripId, {
        bookingId: activeBooking.bookingId,
        recipientName: values.recipientName.trim(),
        recipientPhone: values.recipientPhone.trim(),
        recipientIdCard: values.recipientIdCard.trim(),
        overallCondition: values.overallCondition,
        remarks: values.remarks?.trim(),
        // Backend vẫn đối chiếu mã vi mạch với đơn: gửi mã trong hồ sơ của các con vừa được xác nhận
        microchipNumbers: activeHorses.map((h) => h.microchipNumber),
        signature: blob,
      });
      message.success(t('handover.form.success', { code: activeBooking.bookingCode }));
      setActiveBookingId(null);
      loadHandovers();
      fetchMission();
    } catch (err) {
      message.error(getErrorMessage(err, t('handover.form.failed')));
    } finally {
      setSubmitting(false);
    }
  };

  const doneCount = bookings.filter((b) => b.handoverCompleted || handoverOf(b.bookingId)).length;
  const anyAvailable = bookings.some((b) => !(b.handoverCompleted || handoverOf(b.bookingId)) && canHandoverBooking(b));

  return (
    <div style={{ maxWidth: 1200, margin: '0 auto', padding: '24px 16px' }}>
      <MissionHeaderCard
        mission={mission}
        activeTab="arrival"
        onOpenSos={() => setSosModalOpen(true)}
        breadcrumbItems={[{ title: t('handover.title') }]}
      />

      {error && <Alert type="error" showIcon message={error} style={{ marginBottom: 16 }} />}

      {!anyAvailable && mission?.overallStatus !== 'Completed' && doneCount < bookings.length && (
        <Alert type="info" showIcon message={t('handover.noneAvailable')} style={{ marginBottom: 16 }} />
      )}
      {mission?.overallStatus === 'Completed' && (
        <Alert type="success" showIcon message={t('handover.tripClosed')} style={{ marginBottom: 16 }} />
      )}

      <Card
        title={t('handover.bookingsTitle')}
        extra={<Text type="secondary">{t('handover.progress', { done: doneCount, total: bookings.length })}</Text>}
        style={{ marginBottom: 20 }}
      >
        {bookings.length === 0 ? (
          <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} />
        ) : (
          bookings.map((booking, index) => {
            const record = handoverOf(booking.bookingId);
            const done = booking.handoverCompleted || Boolean(record);
            const dropoff = dropoffOf(booking);
            const offloaded = horsesOf(booking.bookingId).filter((h) => h.status === 'Offloaded');
            const available = !done && canHandoverBooking(booking);
            return (
              <div
                key={booking.bookingId}
                style={{
                  padding: '14px 0',
                  borderTop: index === 0 ? 'none' : '1px solid #F0F0F0',
                }}
              >
                <Row gutter={[16, 8]} align="middle">
                  <Col xs={24} md={16}>
                    <Space size={8} wrap>
                      <Text strong>{booking.bookingCode}</Text>
                      <Text type="secondary">· {booking.customerName}</Text>
                      {done ? <Tag color="green">{t('handover.done')}</Tag> : <Tag>{t('handover.pending')}</Tag>}
                    </Space>
                    <div style={{ color: '#6B7280', fontSize: 13, marginTop: 2 }}>
                      {dropoff
                        ? t('handover.dropoffAt', { name: dropoff.locationName, time: formatTime(dropoff.plannedTime) })
                        : booking.dropoffAddress}
                    </div>
                    <Space size={4} wrap style={{ marginTop: 4 }}>
                      {horsesOf(booking.bookingId).map((h) => (
                        <span key={h.tripHorseId} style={{ fontSize: 13 }}>
                          {h.horseName} <TripHorseStatusTag status={h.status} />
                        </span>
                      ))}
                    </Space>
                    {offloaded.length > 0 && (
                      <div style={{ fontSize: 12, color: '#B45309', marginTop: 2 }}>
                        {t('handover.offloadedHorses', { names: offloaded.map((h) => h.horseName).join(', ') })}
                      </div>
                    )}
                  </Col>
                  <Col xs={24} md={8} style={{ textAlign: 'right' }}>
                    {!done && !available && tripUnderWay && <Tag>{t('handover.waitingDropoff')}</Tag>}
                    {available && (
                      <Button
                        type={activeBookingId === booking.bookingId ? 'default' : 'primary'}
                        icon={<FileDoneOutlined />}
                        onClick={() => openForm(booking.bookingId)}
                      >
                        {t('handover.create')}
                      </Button>
                    )}
                  </Col>
                </Row>

                {/* Biên bản đã lập */}
                {record && (
                  <div style={{ marginTop: 10, padding: 12, background: '#FAFAF9', borderRadius: 8 }}>
                    <Row gutter={[16, 8]}>
                      <Col xs={24} md={16} style={{ fontSize: 13, lineHeight: 1.7 }}>
                        <div>
                          {t('handover.receivedBy')}: <Text strong>{record.recipientName}</Text> · {record.recipientPhone} ·{' '}
                          {record.recipientIdCard}
                        </div>
                        <div>
                          {t('handover.at')}: {formatTime(record.handoverDateTime)} · {t('handover.by')}: {record.driverName}
                        </div>
                        <div>
                          {t('handover.condition.label')}:{' '}
                          <Tag color={HANDOVER_CONDITION_COLOR[record.overallCondition]}>
                            {t(`handover.condition.${record.overallCondition}`)}
                          </Tag>
                        </div>
                        {record.remarks && <div style={{ color: '#6B7280' }}>{record.remarks}</div>}
                      </Col>
                      <Col xs={24} md={8} style={{ textAlign: 'right' }}>
                        {record.signatureUrl && (
                          <Image src={record.signatureUrl} height={70} style={{ background: '#fff', borderRadius: 4 }} />
                        )}
                      </Col>
                    </Row>
                  </div>
                )}
              </div>
            );
          })
        )}
      </Card>

      {/* Form lập biên bản cho đơn đang chọn */}
      {activeBooking && canHandoverBooking(activeBooking) && !handoverOf(activeBooking.bookingId) && (
        <Card
          title={t('handover.form.title', { code: activeBooking.bookingCode })}
          extra={
            <Button type="text" onClick={() => setActiveBookingId(null)}>
              {t('common.cancel')}
            </Button>
          }
        >
          <Form form={form} layout="vertical" requiredMark={false} initialValues={{ overallCondition: 'Excellent' }}>
            <Title level={5} style={{ marginTop: 0 }}>{t('handover.form.verifyTitle')}</Title>
            <Text type="secondary" style={{ display: 'block', marginBottom: 12 }}>
              {t('handover.form.verifyHint')}
            </Text>
            {activeHorses.map((horse) => (
              <div
                key={horse.tripHorseId}
                style={{
                  display: 'flex',
                  gap: 14,
                  alignItems: 'center',
                  padding: 12,
                  marginBottom: 10,
                  borderRadius: 8,
                  border: `1px solid ${verified[horse.tripHorseId] ? '#86EFAC' : '#E7E5E4'}`,
                  background: verified[horse.tripHorseId] ? '#F0FDF4' : '#FFFFFF',
                }}
              >
                {horse.photoUrl ? (
                  <Image src={horse.photoUrl} width={72} height={72} style={{ objectFit: 'cover', borderRadius: 6 }} />
                ) : (
                  <div
                    style={{
                      width: 72,
                      height: 72,
                      borderRadius: 6,
                      background: '#F5F5F4',
                      color: '#A8A29E',
                      fontSize: 11,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      textAlign: 'center',
                      flexShrink: 0,
                    }}
                  >
                    {t('handover.form.noPhoto')}
                  </div>
                )}
                <div style={{ flex: 1, minWidth: 0, fontSize: 13, lineHeight: 1.6 }}>
                  <Text strong style={{ fontSize: 14 }}>{horse.horseName}</Text>
                  <div>
                    {t('handover.form.microchip')}: <Text code>{horse.microchipNumber || '—'}</Text>
                  </div>
                  <div style={{ color: '#57534E' }}>
                    {[
                      horse.color,
                      horse.gender && t(`horses.genderOptions.${horse.gender.toLowerCase()}`, horse.gender),
                      t('customerTrips.stall', { number: horse.stallSlotNumber })].filter(Boolean).join(' · ')}
                  </div>
                </div>
                <Checkbox
                  checked={Boolean(verified[horse.tripHorseId])}
                  onChange={(e) => setVerified((prev) => ({ ...prev, [horse.tripHorseId]: e.target.checked }))}
                >
                  {t('handover.form.verified')}
                </Checkbox>
              </div>
            ))}

            <Title level={5}>{t('handover.form.recipientTitle')}</Title>
            <Row gutter={16}>
              <Col xs={24} md={8}>
                <Form.Item
                  name="recipientName"
                  label={t('handover.form.recipientName')}
                  rules={[{ required: true, whitespace: true, message: t('handover.form.required') }, { max: 100 }]}
                >
                  <Input />
                </Form.Item>
              </Col>
              <Col xs={24} md={8}>
                <Form.Item
                  name="recipientPhone"
                  label={t('handover.form.recipientPhone')}
                  rules={[{ required: true, whitespace: true, message: t('handover.form.required') }]}
                >
                  <Input inputMode="tel" />
                </Form.Item>
              </Col>
              <Col xs={24} md={8}>
                <Form.Item
                  name="recipientIdCard"
                  label={t('handover.form.recipientIdCard')}
                  rules={[{ required: true, whitespace: true, message: t('handover.form.required') }, { max: 50 }]}
                >
                  <Input />
                </Form.Item>
              </Col>
            </Row>

            <Form.Item name="overallCondition" label={t('handover.condition.label')} rules={[{ required: true }]}>
              <Radio.Group
                optionType="button"
                options={HANDOVER_CONDITIONS.map((value) => ({ value, label: t(`handover.condition.${value}`) }))}
              />
            </Form.Item>

            <Form.Item name="remarks" label={t('handover.form.remarks')} rules={[{ max: 2000 }]}>
              <TextArea rows={3} />
            </Form.Item>

            <DigitalSignaturePad label={t('handover.form.signature')} onChange={setSignature} />

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8, marginTop: 20 }}>
              <Button onClick={() => setActiveBookingId(null)}>{t('common.cancel')}</Button>
              <Button type="primary" loading={submitting} onClick={handleSubmit} disabled={!allVerified || !signature}>
                {t('handover.form.submit')}
              </Button>
            </div>
          </Form>
        </Card>
      )}

      <EmergencyReportModal
        open={sosModalOpen}
        onClose={() => setSosModalOpen(false)}
        tripId={tripId}
        tripCode={mission?.tripCode}
        horses={horses}
        onSubmit={reportIncident}
      />
    </div>
  );
}
