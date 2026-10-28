// Đang tạo CustomerDeliveryFailureCard vì khách cần biết ngựa chưa giao được và chọn cách xử lý trong 24 giờ (FE-14, R-16)
import { useEffect, useState } from 'react';
import { Alert, Button, Card, Descriptions, Flex, Form, Input, Radio, Space, Statistic, Tag, Typography, message } from 'antd';
import { SafetyCertificateOutlined, WarningOutlined } from '@ant-design/icons';
import { useTranslation } from 'react-i18next';
import dayjs from 'dayjs';
import MapPicker from '@components/common/map/MapPicker';
import usePolicy from '@hooks/usePolicy';
import deliveryFailureService from '@services/deliveryFailureService';
import { unwrapData, unwrapList, getErrorMessage } from '@utils/apiHelpers';
import { PHONE_REGEX } from '@utils/recipient';

const { Text } = Typography;
const DECISIONS = ['AlternateRecipient', 'HoldAtStable', 'ReturnToOrigin'];
// Từ chối vì ngựa bị thương / giao nhầm ngựa: backend tự mở hồ sơ bồi thường (FE-11)
const CLAIM_REASONS = ['RefusedInjured', 'RefusedWrongHorse'];
const formatTime = (value) => (value ? dayjs(value).format('DD/MM/YYYY HH:mm') : '—');
const formatUsd = (value) => `${Number(value || 0).toLocaleString('en-US', { maximumFractionDigits: 2 })} USD`;

/**
 * Thẻ "Chưa giao được ngựa" trên trang chi tiết đơn của khách (lần không giao được gần nhất).
 * - Lỗi khách, chưa chọn, còn hạn: đếm ngược + 3 cách xử lý (người nhận / địa chỉ khác, gửi chuồng tạm, chở về), mỗi cách ghi ai trả phí.
 * - Quá hạn chưa chọn / hệ thống đã chọn: "Đã áp dụng gửi chuồng tạm".
 * - Đã chọn: tóm tắt lựa chọn và chi phí.
 * - Lỗi công ty (ngựa bị thương / nhầm ngựa): công ty chịu phí chuồng, hồ sơ bồi thường đã được mở.
 * Phí chờ (nếu có) hiện kèm; phí được cộng vào khoản phát sinh của đơn khi đóng chuyến (tab Thanh toán).
 *
 * @param {{ bookingId: number|string, reloadKey?: number, onChanged?: () => void, onOpenClaims?: () => void }} props
 * @returns {JSX.Element|null}
 */
export default function CustomerDeliveryFailureCard({ bookingId, reloadKey = 0, onChanged, onOpenClaims }) {
  const { t } = useTranslation();
  const { policy } = usePolicy();
  const [form] = Form.useForm();
  const [failure, setFailure] = useState(null);
  const [refreshKey, setRefreshKey] = useState(0);
  const [decision, setDecision] = useState(null);
  const [place, setPlace] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [expired, setExpired] = useState(false);

  useEffect(() => {
    let active = true;
    deliveryFailureService
      .getForBooking(bookingId)
      .then((res) => {
        if (!active) return;
        const latest = unwrapList(res)[0] || null;
        setFailure(latest);
        setExpired(Boolean(latest?.decisionDueAt) && dayjs(latest.decisionDueAt).isBefore(dayjs()));
      })
      .catch(() => active && setFailure(null));
    return () => {
      active = false;
    };
  }, [bookingId, reloadKey, refreshKey]);

  if (!failure) return null;

  const delivery = policy?.delivery || {};
  const stableFee = Number(policy?.stable?.feePerHorsePerDayUsd ?? delivery.stableFeePerHorsePerDayUsd ?? 50);
  const extraKmFee = Number(delivery.extraKmFeeUsd ?? 2);
  const reasonText = t(`deliveryFailed.reason.${failure.reason}`, failure.reason);

  const waitingLine = failure.customerPays && failure.waitingFee > 0 && (
    <Descriptions.Item label={t('deliveryDecision.waitingFee')}>
      {t('deliveryDecision.waitingFeeValue', { hours: failure.waitingHours, total: formatUsd(failure.waitingFee) })}
    </Descriptions.Item>
  );
  const basics = (
    <Descriptions size="small" column={{ xs: 1, sm: 2 }} style={{ marginTop: 8 }}>
      <Descriptions.Item label={t('deliveryDecision.reason')}>{reasonText}</Descriptions.Item>
      <Descriptions.Item label={t('deliveryDecision.recordedAt')}>{formatTime(failure.recordedAt)}</Descriptions.Item>
      {failure.note && <Descriptions.Item label={t('deliveryFailed.note')} span={2}>{failure.note}</Descriptions.Item>}
      {waitingLine}
    </Descriptions>
  );

  // ===== Lỗi công ty =====
  if (!failure.customerPays) {
    return (
      <Alert
        type="info"
        showIcon
        title={t('deliveryDecision.companyTitle')}
        description={
          <Flex vertical gap={8}>
            {basics}
            <Text>{t('deliveryDecision.companyCovers')}</Text>
            {CLAIM_REASONS.includes(failure.reason) && (
              <Space wrap>
                <Text strong>{t('deliveryDecision.claimOpened')}</Text>
                {onOpenClaims && (
                  <Button size="small" icon={<SafetyCertificateOutlined />} onClick={onOpenClaims}>
                    {t('deliveryDecision.viewClaims')}
                  </Button>
                )}
              </Space>
            )}
          </Flex>
        }
      />
    );
  }

  // ===== Đã chọn (khách hoặc hệ thống) / quá hạn =====
  if (failure.decision || expired) {
    const byStable = failure.decidedBySystem || (!failure.decision && expired);
    return (
      <Alert
        type={byStable ? 'warning' : 'success'}
        showIcon
        title={byStable ? t('deliveryDecision.systemStable') : t('deliveryDecision.decidedTitle')}
        description={
          <Flex vertical gap={4}>
            {basics}
            {failure.decision && (
              <Descriptions size="small" column={{ xs: 1, sm: 2 }}>
                <Descriptions.Item label={t('deliveryDecision.choice')}>
                  <Tag color="orange">{t(`deliveryDecision.option.${failure.decision}.title`)}</Tag>
                </Descriptions.Item>
                <Descriptions.Item label={t('deliveryDecision.decidedAt')}>{formatTime(failure.decidedAt)}</Descriptions.Item>
                {failure.decision === 'AlternateRecipient' && (
                  <Descriptions.Item label={t('deliveryDecision.newRecipient')} span={2}>
                    {failure.alternateRecipientName} · {failure.alternateRecipientPhone} · {failure.alternateAddress}
                    {failure.extraDistanceKm != null && ` (${t('deliveryDecision.extraKm', { km: failure.extraDistanceKm })})`}
                  </Descriptions.Item>
                )}
                <Descriptions.Item label={t('deliveryDecision.cost')} span={2}>
                  {failure.decisionCost > 0
                    ? formatUsd(failure.decisionCost)
                    : failure.decision === 'HoldAtStable'
                      ? t('deliveryDecision.stableCostLater', { fee: stableFee })
                      : formatUsd(0)}
                </Descriptions.Item>
              </Descriptions>
            )}
            <Text type="secondary">{t('deliveryDecision.paidAsExtra')}</Text>
          </Flex>
        }
      />
    );
  }

  // ===== Chờ khách chọn =====
  const handleSubmit = async () => {
    if (!decision) {
      message.warning(t('deliveryDecision.chooseOne'));
      return;
    }
    let payload = { decision };
    if (decision === 'AlternateRecipient') {
      let values;
      try {
        values = await form.validateFields();
      } catch {
        return;
      }
      if (!place) {
        message.warning(t('deliveryDecision.addressRequired'));
        return;
      }
      payload = {
        ...payload,
        recipientName: values.recipientName.trim(),
        recipientPhone: values.recipientPhone.trim(),
        address: place.address,
        lat: place.lat,
        lng: place.lng,
      };
    }
    setSubmitting(true);
    try {
      unwrapData(await deliveryFailureService.decide(bookingId, payload));
      message.success(t('deliveryDecision.saved'));
      setRefreshKey((k) => k + 1);
      onChanged?.();
    } catch (err) {
      message.error(getErrorMessage(err, t('deliveryDecision.saveFailed')));
      setRefreshKey((k) => k + 1);
    } finally {
      setSubmitting(false);
    }
  };

  const optionCost = {
    AlternateRecipient: t('deliveryDecision.option.AlternateRecipient.cost', { fee: extraKmFee }),
    HoldAtStable: t('deliveryDecision.option.HoldAtStable.cost', { fee: stableFee }),
    ReturnToOrigin: t('deliveryDecision.option.ReturnToOrigin.cost'),
  };

  return (
    <Card
      style={{ borderColor: '#f97316' }}
      title={
        <Space>
          <WarningOutlined style={{ color: '#ea580c' }} />
          {t('deliveryDecision.title')}
        </Space>
      }
    >
      <Flex justify="space-between" wrap="wrap" gap={12}>
        <div style={{ flex: '1 1 320px' }}>
          <Text>{t('deliveryDecision.intro')}</Text>
          {basics}
        </div>
        <div>
          <Text type="secondary">{t('deliveryDecision.dueAt', { time: formatTime(failure.decisionDueAt) })}</Text>
          <Statistic.Timer
            type="countdown"
            value={dayjs(failure.decisionDueAt).valueOf()}
            format="HH:mm:ss"
            onFinish={() => setExpired(true)}
            styles={{ content: { fontSize: 22, color: '#dc2626', fontWeight: 600 } }}
          />
        </div>
      </Flex>

      <Radio.Group value={decision} onChange={(e) => setDecision(e.target.value)} style={{ width: '100%', marginTop: 16 }}>
        <Flex vertical gap={10}>
          {DECISIONS.map((d) => (
            <Card key={d} size="small" style={{ borderColor: decision === d ? '#f59e0b' : undefined }}>
              <Radio value={d}>
                <Text strong>{t(`deliveryDecision.option.${d}.title`)}</Text>
              </Radio>
              <div style={{ marginLeft: 24, fontSize: 13 }}>
                <div>{t(`deliveryDecision.option.${d}.description`)}</div>
                <Text type="warning">{optionCost[d]}</Text>
              </div>
              {d === 'AlternateRecipient' && decision === d && (
                <Form form={form} layout="vertical" requiredMark={false} style={{ marginTop: 12 }}>
                  <Flex gap={12} wrap="wrap">
                    <Form.Item
                      name="recipientName"
                      label={t('deliveryDecision.recipientName')}
                      style={{ flex: '1 1 200px' }}
                      rules={[{ required: true, whitespace: true, message: t('deliveryDecision.required') }, { max: 100 }]}
                    >
                      <Input />
                    </Form.Item>
                    <Form.Item
                      name="recipientPhone"
                      label={t('deliveryDecision.recipientPhone')}
                      style={{ flex: '1 1 200px' }}
                      rules={[
                        { required: true, whitespace: true, message: t('deliveryDecision.required') },
                        { pattern: PHONE_REGEX, message: t('deliveryDecision.phoneInvalid') },
                      ]}
                    >
                      <Input inputMode="tel" />
                    </Form.Item>
                  </Flex>
                  <Form.Item label={t('deliveryDecision.newAddress')} required>
                    <MapPicker value={place} onChange={setPlace} height={280} />
                  </Form.Item>
                </Form>
              )}
            </Card>
          ))}
        </Flex>
      </Radio.Group>

      <Flex justify="space-between" align="center" wrap="wrap" gap={12} style={{ marginTop: 16 }}>
        <Text type="secondary" style={{ fontSize: 12, flex: '1 1 300px' }}>
          {t('deliveryDecision.defaultNote', { fee: stableFee })}
        </Text>
        <Button type="primary" size="large" loading={submitting} disabled={!decision} onClick={handleSubmit}>
          {t('deliveryDecision.submit')}
        </Button>
      </Flex>
    </Card>
  );
}
