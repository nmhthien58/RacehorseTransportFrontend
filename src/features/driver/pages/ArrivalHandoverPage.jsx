import { useEffect, useState, useCallback } from 'react';
import { Card, Row, Col, Typography, Tag, Button, Form, Input, Radio, Spin, Alert, Empty, Image, Space, message } from 'antd';
import { CheckCircleFilled, CloseCircleFilled, FileDoneOutlined } from '@ant-design/icons';
import { useParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import dayjs from 'dayjs';
import { useMissionDetail } from '../hooks/useDriverMissions';
import driverService from '../services/driverService';
import MissionHeaderCard from '../components/MissionHeaderCard';
import DigitalSignaturePad from '../components/DigitalSignaturePad';
import EmergencyReportModal from '../components/EmergencyReportModal';
import { unwrapList, getErrorMessage } from '@utils/apiHelpers';
import { HANDOVER_CONDITIONS, HANDOVER_CONDITION_COLOR } from '@utils/incidents';

const { Title, Text } = Typography;
const { TextArea } = Input;

const formatTime = (value) => (value ? dayjs(value).format('DD/MM/YYYY HH:mm') : '—');
// Bỏ khoảng trắng để so mã vi mạch quét / gõ tay với mã trong hồ sơ
const normalizeChip = (value) => (value || '').replace(/\s+/g, '');

/**
 * Bước 4 của đoàn xe: bàn giao ngựa tại điểm đến và lập biên bản e-POD.
 * Mỗi đơn trên chuyến một biên bản (POST /trips/{id}/handover, multipart): đối chiếu mã vi mạch từng con,
 * ghi người nhận, tình trạng ngựa và chữ ký tay của người nhận.
 */
export default function ArrivalHandoverPage() {
  const { tripId } = useParams();
  const { t } = useTranslation();
  const { mission, loading, error, fetchMission, reportIncident } = useMissionDetail(tripId);
  const [form] = Form.useForm();

  const [handovers, setHandovers] = useState([]);
  const [activeBookingId, setActiveBookingId] = useState(null);
  const [chips, setChips] = useState({});
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
  const canHandover = mission?.overallStatus === 'ArrivedDestination';
  const horsesOf = (bookingId) => horses.filter((h) => h.bookingId === bookingId);
  const handoverOf = (bookingId) => handovers.find((h) => h.bookingId === bookingId);

  const activeBooking = bookings.find((b) => b.bookingId === activeBookingId);
  const activeHorses = activeBooking ? horsesOf(activeBooking.bookingId) : [];
  const chipMatches = (horse) => normalizeChip(chips[horse.tripHorseId]) === normalizeChip(horse.microchipNumber);
  const allChipsMatch = activeHorses.length > 0 && activeHorses.every(chipMatches);

  const openForm = (bookingId) => {
    setActiveBookingId(bookingId);
    setChips({});
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
    if (!allChipsMatch) {
      message.error(t('handover.form.chipsMismatch'));
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
        microchipNumbers: activeHorses.map((h) => normalizeChip(chips[h.tripHorseId])),
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

  return (
    <div style={{ maxWidth: 1200, margin: '0 auto', padding: '24px 16px' }}>
      <MissionHeaderCard
        mission={mission}
        activeTab="arrival"
        onOpenSos={() => setSosModalOpen(true)}
        breadcrumbItems={[{ title: t('handover.title') }]}
      />

      {error && <Alert type="error" showIcon message={error} style={{ marginBottom: 16 }} />}

      {!canHandover && mission?.overallStatus !== 'Completed' && (
        <Alert type="info" showIcon message={t('handover.notArrived')} style={{ marginBottom: 16 }} />
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
                    <div style={{ color: '#6B7280', fontSize: 13, marginTop: 2 }}>{booking.dropoffAddress}</div>
                    <div style={{ fontSize: 13, marginTop: 2 }}>
                      {horsesOf(booking.bookingId)
                        .map((h) => h.horseName)
                        .join(', ')}
                    </div>
                  </Col>
                  <Col xs={24} md={8} style={{ textAlign: 'right' }}>
                    {!done && canHandover && (
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
      {activeBooking && (
        <Card
          title={t('handover.form.title', { code: activeBooking.bookingCode })}
          extra={
            <Button type="text" onClick={() => setActiveBookingId(null)}>
              {t('common.cancel')}
            </Button>
          }
        >
          <Form form={form} layout="vertical" requiredMark={false} initialValues={{ overallCondition: 'Excellent' }}>
            <Title level={5} style={{ marginTop: 0 }}>{t('handover.form.chipsTitle')}</Title>
            <Text type="secondary" style={{ display: 'block', marginBottom: 12 }}>
              {t('handover.form.chipsHint')}
            </Text>
            {activeHorses.map((horse) => {
              const typed = normalizeChip(chips[horse.tripHorseId]);
              const ok = typed && chipMatches(horse);
              return (
                <Row key={horse.tripHorseId} gutter={12} align="middle" style={{ marginBottom: 10 }}>
                  <Col xs={24} sm={9}>
                    <Text strong>{horse.horseName}</Text>
                    <div style={{ fontSize: 12, color: '#6B7280' }}>
                      {t('customerTrips.stall', { number: horse.stallSlotNumber })}
                    </div>
                  </Col>
                  <Col xs={20} sm={13}>
                    <Input
                      inputMode="numeric"
                      placeholder={t('handover.form.chipPlaceholder')}
                      value={chips[horse.tripHorseId] || ''}
                      onChange={(e) => setChips((prev) => ({ ...prev, [horse.tripHorseId]: e.target.value }))}
                      status={typed && !ok ? 'error' : undefined}
                    />
                  </Col>
                  <Col xs={4} sm={2} style={{ fontSize: 18 }}>
                    {typed && (ok ? <CheckCircleFilled style={{ color: '#16A34A' }} /> : <CloseCircleFilled style={{ color: '#DC2626' }} />)}
                  </Col>
                </Row>
              );
            })}

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
              <Button type="primary" loading={submitting} onClick={handleSubmit} disabled={!allChipsMatch || !signature}>
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
