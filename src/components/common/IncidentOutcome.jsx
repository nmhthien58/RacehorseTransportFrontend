// Đang tạo IncidentOutcome vì điều phối, quản lý, tài xế và khách cùng cần thấy kết quả mở rộng của sự cố (FE-10; R-12, R-14, R-09)
import { Flex, Space, Tag, Typography } from 'antd';
import { FileTextOutlined } from '@ant-design/icons';
import { useTranslation } from 'react-i18next';
import dayjs from 'dayjs';
import { FAULT_PARTY_COLOR, RESPONSE_ACTION_COLOR, REPLACEMENT_ACTIONS, formatUsd } from '@utils/incidents';

const { Text } = Typography;

/**
 * Các thông tin thêm của một sự cố, chỉ hiện dòng nào có dữ liệu:
 * hướng xử lý ngựa rời chuyến + biên bản thú y, dỡ khẩn cấp, phí đi vòng khách trả thêm + ý kiến từng đơn,
 * xe thay thế / người thay thế (actionPayload), nguyên nhân khi đóng.
 * @param {{ incident: Object, lookup?: { vehicles: Record<number, { assetCode: string, assetType?: string }>, users: Record<number, string> } }} props
 *   lookup: bảng tra từ buildIncidentLookup (@utils/incidents); không truyền (màn khách) thì chỉ hiện tên hành động
 * @returns {JSX.Element|null}
 */
export default function IncidentOutcome({ incident, lookup }) {
  const { t } = useTranslation();
  if (!incident) return null;
  const rows = [];
  const payload = incident.actionPayload;
  const userName = (id) => lookup?.users?.[id] || `#${id}`;

  // Đổi xe (BE-14a): biển số xe mới; khi duyệt chuyến chuyển sang xe này
  if (incident.responseAction === 'ReplaceVehicle' && payload?.replacementVehicleId && lookup) {
    const vehicle = lookup.vehicles?.[payload.replacementVehicleId];
    rows.push(
      <div key="vehicle">
        <Text type="secondary">{t('incidentOutcome.replacementVehicle')}: </Text>
        <Text strong>{vehicle?.assetCode || `#${payload.replacementVehicleId}`}</Text>
        {vehicle?.assetType && <Text type="secondary"> · {vehicle.assetType}</Text>}
      </div>,
    );
  }
  // Đổi người (BE-14a): người cũ → người mới, giữ vai trò của người cũ
  if (incident.responseAction === 'ReplaceCrew' && payload?.addUserId && lookup) {
    rows.push(
      <div key="crew">
        <Text type="secondary">{t('incidentOutcome.crewReplacement')}: </Text>
        {payload.crewRole && <Tag color={payload.crewRole === 'Driver' ? 'orange' : 'cyan'}>{t(`tripPlan.crewRole.${payload.crewRole}`)}</Tag>}
        <Text delete>{userName(payload.removeUserId)}</Text> → <Text strong>{userName(payload.addUserId)}</Text>
      </div>,
    );
  }

  if (incident.emergencyOffload) {
    rows.push(
      <div key="emergency">
        <Tag color="red">{t('incidentOutcome.emergencyOffload')}</Tag>
        {incident.affectedHorseName}
      </div>,
    );
  }
  if (incident.offloadOutcome) {
    rows.push(
      <div key="offload">
        <Text type="secondary">{t('incidentOutcome.offloadOutcome')}: </Text>
        <Tag color={incident.offloadOutcome === 'Deceased' ? 'red' : 'orange'}>{t(`incidentOutcome.outcome.${incident.offloadOutcome}`)}</Tag>
        {incident.affectedHorseName}
        {incident.vetReportUrl && (
          <a href={incident.vetReportUrl} target="_blank" rel="noopener noreferrer" style={{ marginLeft: 8 }}>
            <FileTextOutlined /> {t('incidentOutcome.vetReport')}
          </a>
        )}
      </div>,
    );
  }
  // Ở lại phòng khám (WaitRecover): phòng khám nơi con ngựa điều trị
  const clinic = payload?.vetClinic;
  if (incident.offloadOutcome === 'WaitRecover' && clinic) {
    rows.push(
      <div key="clinic">
        <Text type="secondary">{t('incidentHealth.clinic.label')}: </Text>
        <Text strong>{clinic.name}</Text>
        <Text type="secondary"> · {clinic.address}</Text>
        {clinic.phone && <Text type="secondary"> · {clinic.phone}</Text>}
        {clinic.attendingVetName && <Text type="secondary"> · {clinic.attendingVetName}</Text>}
      </div>,
    );
  }
  // Khuyến nghị an tử: chờ chủ ngựa / đã trả lời / ủy quyền khẩn cấp (Chính sách 9.6)
  const euthanasiaAnswer = (incident.consents || []).find((c) => c.consentType === 'Euthanasia');
  if (incident.requiresEuthanasiaConsent || euthanasiaAnswer || incident.emergencyAuthorizedAt) {
    let state;
    if (incident.emergencyAuthorizedAt) {
      state = (
        <Tag color="volcano">
          {t('incidentHealth.euthanasia.emergencyApplied', {
            name: incident.emergencyAuthorizedByName || '—',
            time: dayjs(incident.emergencyAuthorizedAt).format('DD/MM HH:mm'),
          })}
        </Tag>
      );
    } else if (euthanasiaAnswer) {
      state = (
        <Tag color={euthanasiaAnswer.accepted ? 'green' : 'red'}>
          {euthanasiaAnswer.accepted ? t('incidentHealth.euthanasia.ownerAgreed') : t('incidentHealth.euthanasia.ownerDeclined')} ·{' '}
          {dayjs(euthanasiaAnswer.decidedAt).format('DD/MM HH:mm')}
        </Tag>
      );
    } else if (incident.pendingConsentType === 'Euthanasia') {
      state = (
        <Tag color="gold">
          {t('incidentHealth.euthanasia.waiting', { time: incident.consentDeadline ? dayjs(incident.consentDeadline).format('DD/MM HH:mm') : '—' })}
        </Tag>
      );
    } else {
      state = <Tag>{t('incidentHealth.euthanasia.afterApproval')}</Tag>;
    }
    rows.push(
      <div key="euthanasia">
        <Text type="secondary">{t('incidentHealth.euthanasia.label')}: </Text>
        {state}
        {incident.emergencyAuthorizationNote && <Text type="secondary">{incident.emergencyAuthorizationNote}</Text>}
      </div>,
    );
  }
  if (Number(incident.extraCostForCustomer) > 0) {
    rows.push(
      <div key="detour">
        <Text type="secondary">{t('incidentOutcome.detourCost')}: </Text>
        <Text strong>{formatUsd(incident.extraCostForCustomer)}</Text>
        {(incident.consents || []).some((c) => c.consentType !== 'Euthanasia') && (
          <Space size={4} wrap style={{ marginLeft: 8 }}>
            {incident.consents.filter((c) => c.consentType !== 'Euthanasia').map((c) => (
              <Tag key={`${c.consentType}-${c.bookingId}`} color={c.accepted ? 'green' : 'red'}>
                {c.bookingCode}: {c.accepted ? t('incidentOutcome.accepted') : t('incidentOutcome.declined')} · {dayjs(c.decidedAt).format('DD/MM HH:mm')}
              </Tag>
            ))}
          </Space>
        )}
      </div>,
    );
  }
  // Màn khách không tra được biển số / tên nhân sự: chỉ báo đoàn xe đã đổi xe / đổi người
  if (REPLACEMENT_ACTIONS.includes(incident.responseAction) && payload && !lookup) {
    rows.push(
      <div key="replacement">
        <Tag color={RESPONSE_ACTION_COLOR[incident.responseAction]}>{t(`incidents.action.${incident.responseAction}`)}</Tag>
      </div>,
    );
  }
  // Mức độ bị nâng lên khi duyệt ngựa chết: giữ mức tài xế báo lúc đầu
  if (incident.initialSeverity && incident.initialSeverity !== incident.severity) {
    rows.push(
      <div key="severity">
        <Text type="secondary">{t('incidentHealth.initialSeverity')}: </Text>
        <Tag>{t(`incidents.severity.${incident.initialSeverity}`)}</Tag>
      </div>,
    );
  }
  if (incident.faultParty) {
    rows.push(
      <div key="fault">
        <Text type="secondary">{t('incidentOutcome.faultParty')}: </Text>
        <Tag color={FAULT_PARTY_COLOR[incident.faultParty]}>{t(`incidentOutcome.fault.${incident.faultParty}.title`)}</Tag>
        {incident.faultNote}
      </div>,
    );
  }
  if (rows.length === 0) return null;
  return <Flex vertical gap={4}>{rows}</Flex>;
}
