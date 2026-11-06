// Đang tạo CustomerDetourConsentCard vì khách phải đồng ý / từ chối đi đường vòng có phí trên trang đơn (FE-10, R-14)
import { useEffect, useMemo, useState } from 'react';
import { Alert, Button, Card, Flex, Popconfirm, Space, Tag, Typography, message } from 'antd';
import { CheckOutlined, CloseOutlined, MedicineBoxOutlined, NodeIndexOutlined } from '@ant-design/icons';
import { useTranslation } from 'react-i18next';
import dayjs from 'dayjs';
import IncidentRouteChange from '@components/common/IncidentRouteChange';
import incidentService from '@services/incidentService';
import { unwrapList, getErrorMessage } from '@utils/apiHelpers';
import { formatUsd } from '@utils/incidents';
// Khuyến nghị an tử: khách xem biên bản thú y trước khi trả lời
import IncidentDocuments from '@components/common/IncidentDocuments';

const { Text, Paragraph } = Typography;
const ACTIVE_TRIP_STATUSES = ['Scheduled', 'InTransit', 'EmergencyRerouting'];

/**
 * Sự cố đang chờ khách đồng ý đi đường vòng có phí (AwaitingConsent) trên các chuyến chở ngựa của đơn.
 * Mọi khách có ngựa trên xe đồng ý thì đổi tuyến và thu thêm; một khách từ chối thì cả đoàn quay về nơi đi (Chính sách 9.4).
 * Trả lời lại được cho tới khi có kết quả. Không có sự cố nào chờ thì không hiện gì.
 *
 * @param {{ booking: Object, onChanged?: () => void }} props
 * @returns {JSX.Element|null}
 */
export default function CustomerDetourConsentCard({ booking, onChanged }) {
  const { t } = useTranslation();
  const [incidents, setIncidents] = useState([]);
  const [refreshKey, setRefreshKey] = useState(0);
  const [answeringId, setAnsweringId] = useState(null);

  // Các chuyến đang chạy có ngựa của đơn
  const tripIds = useMemo(() => {
    const ids = (booking?.horses || [])
      .flatMap((h) => h.trips || [])
      .filter((tr) => ACTIVE_TRIP_STATUSES.includes(tr.tripStatus))
      .map((tr) => tr.tripId);
    return [...new Set(ids)];
  }, [booking]);
  const tripKey = tripIds.join(',');
  // Tên các con ngựa của đơn: khuyến nghị an tử chỉ hỏi chủ của con ngựa đó
  const horseKey = (booking?.horses || []).map((h) => h.horseName).join('|');

  useEffect(() => {
    if (!tripKey) return undefined;
    let active = true;
    Promise.all(
      tripKey.split(',').map((id) => incidentService.getIncidents({ tripId: id, size: 50 }).then(unwrapList).catch(() => [])),
    )
      .then((lists) => {
        const horseNames = horseKey.split('|');
        if (active)
          setIncidents(
            lists
              .flat()
              .filter((i) => i.status === 'AwaitingConsent')
              .filter((i) => i.pendingConsentType !== 'Euthanasia' || horseNames.includes(i.affectedHorseName)),
          );
      })
      .catch(() => active && setIncidents([]));
    return () => {
      active = false;
    };
  }, [tripKey, horseKey, refreshKey]);

  if (!tripKey || incidents.length === 0) return null;

  const answer = async (incident, accept) => {
    setAnsweringId(incident.incidentId);
    try {
      await incidentService.customerConsent(incident.incidentId, { accept });
      const euthanasia = incident.pendingConsentType === 'Euthanasia';
      message.success(
        euthanasia
          ? t(accept ? 'incidentHealth.customer.agreedMsg' : 'incidentHealth.customer.declinedMsg')
          : t(accept ? 'detourConsent.acceptedMsg' : 'detourConsent.declinedMsg'),
      );
      setRefreshKey((k) => k + 1);
      onChanged?.();
    } catch (err) {
      message.error(getErrorMessage(err, t('detourConsent.failed')));
    } finally {
      setAnsweringId(null);
    }
  };

  return (
    <Flex vertical gap={12}>
      {incidents.map((inc) => {
        const mine = (inc.consents || []).find((c) => c.bookingId === booking.bookingId && c.consentType !== 'Euthanasia');
        if (inc.pendingConsentType === 'Euthanasia') {
          return (
            <Card
              key={inc.incidentId}
              style={{ borderColor: '#dc2626' }}
              title={
                <Space>
                  <MedicineBoxOutlined style={{ color: '#dc2626' }} />
                  {t('incidentHealth.customer.euthanasiaTitle', { horse: inc.affectedHorseName || '' })}
                </Space>
              }
            >
              <Paragraph style={{ marginBottom: 8 }}>{t('incidentHealth.customer.euthanasiaIntro', { trip: inc.tripCode })}</Paragraph>
              <Paragraph style={{ marginBottom: 8 }}>
                <Text strong>{t('incidents.fields.description')}: </Text>
                {inc.description}
              </Paragraph>
              <IncidentDocuments incident={inc} />
              <Alert
                type="error"
                showIcon
                style={{ margin: '12px 0' }}
                title={t('incidentHealth.customer.deadline', { time: inc.consentDeadline ? dayjs(inc.consentDeadline).format('HH:mm DD/MM/YYYY') : '—' })}
                description={t('incidentHealth.customer.emergencyClause')}
              />
              <Space wrap>
                <Popconfirm
                  title={t('incidentHealth.customer.agreeConfirm')}
                  okButtonProps={{ danger: true }}
                  onConfirm={() => answer(inc, true)}
                >
                  <Button danger type="primary" icon={<CheckOutlined />} loading={answeringId === inc.incidentId}>
                    {t('incidentHealth.customer.agree')}
                  </Button>
                </Popconfirm>
                <Popconfirm
                  title={t('incidentHealth.customer.declineConfirm')}
                  description={t('incidentHealth.customer.declineConfirmDesc')}
                  onConfirm={() => answer(inc, false)}
                >
                  <Button icon={<CloseOutlined />} loading={answeringId === inc.incidentId}>
                    {t('incidentHealth.customer.decline')}
                  </Button>
                </Popconfirm>
              </Space>
            </Card>
          );
        }
        return (
          <Card
            key={inc.incidentId}
            style={{ borderColor: '#a855f7' }}
            title={
              <Space>
                <NodeIndexOutlined style={{ color: '#7c3aed' }} />
                {t('detourConsent.title', { trip: inc.tripCode })}
              </Space>
            }
          >
            <Paragraph style={{ marginBottom: 8 }}>{t('detourConsent.intro')}</Paragraph>
            <Paragraph style={{ marginBottom: 8 }}>
              <Text strong>{t('incidents.fields.plan')}: </Text>
              {inc.proposedAction}
            </Paragraph>
            {inc.routeChange && <IncidentRouteChange routeChange={inc.routeChange} />}
            <Alert
              type="warning"
              showIcon
              style={{ margin: '12px 0' }}
              title={
                inc.myExtraCostShare != null
                  ? t('detourConsent.myShare', {
                      share: formatUsd(inc.myExtraCostShare),
                      mine: inc.myHorsesOnBoard,
                      total: inc.horsesOnBoard,
                      amount: formatUsd(inc.extraCostForCustomer),
                    })
                  : t('detourConsent.cost', { amount: formatUsd(inc.extraCostForCustomer) })
              }
              description={t('detourConsent.costNote')}
            />
            {mine && (
              <Text type="secondary" style={{ display: 'block', marginBottom: 8 }}>
                {t('detourConsent.yourAnswer')}{' '}
                <Tag color={mine.accepted ? 'green' : 'red'}>{mine.accepted ? t('incidentOutcome.accepted') : t('incidentOutcome.declined')}</Tag>
                {dayjs(mine.decidedAt).format('DD/MM/YYYY HH:mm')} · {t('detourConsent.canChange')}
              </Text>
            )}
            <Space wrap>
              <Popconfirm
                title={t('detourConsent.acceptConfirm')}
                description={t('detourConsent.acceptConfirmDesc')}
                onConfirm={() => answer(inc, true)}
              >
                <Button type="primary" icon={<CheckOutlined />} loading={answeringId === inc.incidentId}>
                  {t('detourConsent.accept')}
                </Button>
              </Popconfirm>
              <Popconfirm
                title={t('detourConsent.declineConfirm')}
                description={t('detourConsent.declineConfirmDesc')}
                okButtonProps={{ danger: true }}
                onConfirm={() => answer(inc, false)}
              >
                <Button danger icon={<CloseOutlined />} loading={answeringId === inc.incidentId}>
                  {t('detourConsent.decline')}
                </Button>
              </Popconfirm>
            </Space>
          </Card>
        );
      })}
    </Flex>
  );
}
