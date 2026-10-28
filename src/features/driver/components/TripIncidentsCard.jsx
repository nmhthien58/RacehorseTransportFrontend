import { Alert, Card, Space, Tag, Typography } from 'antd';
import { WarningOutlined } from '@ant-design/icons';
import { useTranslation } from 'react-i18next';
import { INCIDENT_STATUS_COLOR, SEVERITY_COLOR, RESPONSE_ACTION_COLOR } from '@utils/incidents';
import IncidentRouteChange from '@components/common/IncidentRouteChange';
// Đang sửa TripIncidentsCard vì đoàn xe cần thấy hướng xử lý ngựa, quay về, phí đi vòng, nguyên nhân (FE-10)
import IncidentOutcome from '@components/common/IncidentOutcome';

const { Text, Paragraph } = Typography;

/**
 * Định dạng giờ + ngày ngắn gọn cho đoàn xe.
 * @param {string|null|undefined} value
 * @returns {string}
 */
function formatTime(value) {
  if (!value) return '—';
  return new Date(value).toLocaleString('vi-VN', { hour: '2-digit', minute: '2-digit', day: '2-digit', month: '2-digit' });
}

/**
 * Sự cố của chuyến và phương án xử lý, để đoàn xe đọc lại chỉ đạo thay vì chỉ thấy qua thông báo.
 * @param {{ incidents: Array<Object> }} props - GET /trips/{id}/incidents (mới nhất trước)
 */
export default function TripIncidentsCard({ incidents }) {
  const { t } = useTranslation();

  if (!incidents?.length) return null;

  return (
    <Card
      id="incidents"
      title={
        <Space>
          <WarningOutlined style={{ color: '#DC2626' }} />
          {t('driver.incidents.title')}
        </Space>
      }
      style={{ borderRadius: 12, marginBottom: 24, border: '1px solid #E5E7EB' }}
      bodyStyle={{ padding: '8px 24px' }}
    >
      {incidents.map((inc, idx) => {
        const planApproved = inc.status === 'Approved' || inc.status === 'Resolved';
        return (
          <div key={inc.incidentId} style={{ padding: '14px 0', borderTop: idx === 0 ? 'none' : '1px solid #F3F4F6' }}>
            <Space size={8} wrap>
              <Text strong>{inc.incidentCode}</Text>
              <Text>{t(`incidents.type.${inc.incidentType}`)}</Text>
              <Tag color={SEVERITY_COLOR[inc.severity]}>{t(`incidents.severity.${inc.severity}`)}</Tag>
              <Tag color={INCIDENT_STATUS_COLOR[inc.status]}>{t(`incidents.status.${inc.status}`)}</Tag>
            </Space>
            <div style={{ fontSize: 12, color: '#6B7280', marginTop: 4 }}>
              {t('driver.incidents.reportedBy', { name: inc.reportedByName || '—', time: formatTime(inc.reportedAt) })}
              {inc.location ? ` · ${inc.location}` : ''}
              {inc.affectedHorseName ? ` · ${t('incidents.fields.horse')}: ${inc.affectedHorseName}` : ''}
            </div>
            <Paragraph style={{ margin: '6px 0 10px' }}>{inc.description}</Paragraph>

            {planApproved ? (
              <Alert
                type={inc.status === 'Resolved' ? 'success' : 'info'}
                showIcon
                style={{ borderRadius: 8 }}
                message={t('driver.incidents.planApproved')}
                description={
                  <>
                    {inc.responseAction && (
                      <Tag color={RESPONSE_ACTION_COLOR[inc.responseAction]} style={{ marginBottom: 6 }}>
                        {t(`incidents.action.${inc.responseAction}`)}
                      </Tag>
                    )}
                    <div>
                      <Text strong>{t('incidents.fields.plan')}: </Text>
                      {inc.proposedAction}
                    </div>
                    <div style={{ marginTop: 6 }}>
                      <IncidentOutcome incident={inc} />
                    </div>
                    {inc.routeChange && (
                      <div style={{ marginTop: 8, background: '#FFFFFF', borderRadius: 8 }}>
                        <IncidentRouteChange routeChange={inc.routeChange} />
                        <div style={{ fontSize: 12, color: '#B45309', marginTop: 4 }}>{t('driver.incidents.routeChanged')}</div>
                      </div>
                    )}
                    {inc.revisedRouteNotes && (
                      <div style={{ marginTop: 4 }}>
                        <Text strong>{t('incidents.fields.routeNotes')}: </Text>
                        {inc.revisedRouteNotes}
                      </div>
                    )}
                    <div style={{ fontSize: 12, color: '#6B7280', marginTop: 4 }}>
                      {t('driver.incidents.approvedBy', { name: inc.approvedByName || '—', time: formatTime(inc.approvedAt) })}
                      {inc.resolvedAt ? ` · ${t('driver.incidents.resolvedAt', { time: formatTime(inc.resolvedAt) })}` : ''}
                    </div>
                  </>
                }
              />
            ) : (
              <Alert
                type="warning"
                showIcon
                style={{ borderRadius: 8 }}
                message={
                  inc.status === 'AwaitingConsent'
                    ? t('incidentPlan.awaitingConsent')
                    : inc.status === 'PlanProposed'
                      ? t('driver.incidents.planPending')
                      : t('driver.incidents.planDrafting')
                }
              />
            )}
          </div>
        );
      })}
    </Card>
  );
}
