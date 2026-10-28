// Đang tạo IncidentOutcome vì điều phối, quản lý, tài xế và khách cùng cần thấy kết quả mở rộng của sự cố (FE-10; R-12, R-14, R-09)
import { Flex, Space, Tag, Typography } from 'antd';
import { FileTextOutlined } from '@ant-design/icons';
import { useTranslation } from 'react-i18next';
import dayjs from 'dayjs';
import { FAULT_PARTY_COLOR, formatUsd } from '@utils/incidents';

const { Text } = Typography;

/**
 * Các thông tin thêm của một sự cố, chỉ hiện dòng nào có dữ liệu:
 * hướng xử lý ngựa rời chuyến + biên bản thú y, dỡ khẩn cấp, phí đi vòng khách trả thêm + ý kiến từng đơn, nguyên nhân khi đóng.
 * @param {{ incident: Object }} props
 * @returns {JSX.Element|null}
 */
export default function IncidentOutcome({ incident }) {
  const { t } = useTranslation();
  if (!incident) return null;
  const rows = [];

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
  if (Number(incident.extraCostForCustomer) > 0) {
    rows.push(
      <div key="detour">
        <Text type="secondary">{t('incidentOutcome.detourCost')}: </Text>
        <Text strong>{formatUsd(incident.extraCostForCustomer)}</Text>
        {(incident.consents || []).length > 0 && (
          <Space size={4} wrap style={{ marginLeft: 8 }}>
            {incident.consents.map((c) => (
              <Tag key={c.bookingId} color={c.accepted ? 'green' : 'red'}>
                {c.bookingCode}: {c.accepted ? t('incidentOutcome.accepted') : t('incidentOutcome.declined')} · {dayjs(c.decidedAt).format('DD/MM HH:mm')}
              </Tag>
            ))}
          </Space>
        )}
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
