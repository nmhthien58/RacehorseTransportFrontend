import { Tag, Typography } from 'antd';
import { PlusCircleOutlined, MinusCircleOutlined } from '@ant-design/icons';
import { useTranslation } from 'react-i18next';
import dayjs from 'dayjs';

const { Text } = Typography;

const formatTime = (value) => (value ? dayjs(value).format('DD/MM HH:mm') : '—');

/**
 * Dựng tuyến sau khi áp thay đổi (chưa áp vào DB) để người duyệt so tuyến cũ và tuyến mới.
 * Vị trí chèn giống backend: sau mốc được chọn, mặc định sau mốc gần nhất đoàn xe đã tới.
 * @param {Array<Object>} checkpoints - Mốc đang hiệu lực, đã sắp thứ tự
 * @param {Object} routeChange
 * @returns {Array<{ key: string, name: string, plannedTime: string, kind: 'kept' | 'removed' | 'added', address?: string }>}
 */
function buildPreview(checkpoints, routeChange) {
  const removedIds = new Set(routeChange.removedCheckpoints.map((c) => c.checkpointId));
  const reached = checkpoints.filter((c) => c.status !== 'Pending');
  const anchorId =
    routeChange.insertAfterCheckpointId ?? (reached.length ? reached[reached.length - 1].checkpointId : checkpoints[0]?.checkpointId);

  const rows = [];
  checkpoints.forEach((c) => {
    rows.push({
      key: `cp-${c.checkpointId}`,
      name: c.checkpointName,
      plannedTime: c.plannedTime,
      kind: removedIds.has(c.checkpointId) ? 'removed' : 'kept',
    });
    if (c.checkpointId === anchorId) {
      routeChange.newCheckpoints.forEach((n, idx) =>
        rows.push({ key: `new-${idx}`, name: n.checkpointName, plannedTime: n.plannedTime, address: n.address, kind: 'added' }),
      );
    }
  });
  return rows;
}

/**
 * Thay đổi tuyến kèm phương án xử lý sự cố.
 * - Có `checkpoints` và tuyến chưa áp: hiện toàn bộ tuyến mới (mốc bị bỏ gạch ngang, mốc mới tô xanh) để Manager duyệt.
 * - Còn lại: liệt kê các mốc bỏ / thêm.
 * @param {{ routeChange: Object|null, checkpoints?: Array<Object> }} props
 */
export default function IncidentRouteChange({ routeChange, checkpoints }) {
  const { t } = useTranslation();
  if (!routeChange) return null;

  const applied = Boolean(routeChange.appliedAt);
  const removedStyle = { textDecoration: 'line-through', color: '#9CA3AF' };

  const header = (
    <div style={{ marginBottom: 8 }}>
      <Text strong>{t('incidents.route.title')}</Text>{' '}
      {applied ? (
        <Tag color="green">{t('incidents.route.applied', { time: formatTime(routeChange.appliedAt) })}</Tag>
      ) : (
        <Tag color="gold">{t('incidents.route.pending')}</Tag>
      )}
    </div>
  );

  if (!applied && checkpoints?.length) {
    return (
      <div style={{ border: '1px solid #F0F0F0', borderRadius: 8, padding: 12 }}>
        {header}
        {buildPreview(checkpoints, routeChange).map((row, idx) => (
          <div key={row.key} style={{ display: 'flex', gap: 8, alignItems: 'baseline', padding: '3px 0' }}>
            <span style={{ width: 20, color: '#9CA3AF', fontSize: 12 }}>{idx + 1}.</span>
            {row.kind === 'added' && <PlusCircleOutlined style={{ color: '#16A34A' }} />}
            {row.kind === 'removed' && <MinusCircleOutlined style={{ color: '#DC2626' }} />}
            <span style={row.kind === 'removed' ? removedStyle : row.kind === 'added' ? { color: '#15803D', fontWeight: 600 } : undefined}>
              {row.name}
            </span>
            <Text type="secondary" style={{ fontSize: 12 }}>
              · {formatTime(row.plannedTime)}
              {row.address ? ` · ${row.address}` : ''}
            </Text>
          </div>
        ))}
      </div>
    );
  }

  return (
    <div style={{ border: '1px solid #F0F0F0', borderRadius: 8, padding: 12 }}>
      {header}
      {routeChange.removedCheckpoints.length > 0 && (
        <div style={{ marginBottom: 6 }}>
          <Text type="secondary">{t('incidents.route.removed')}: </Text>
          {routeChange.removedCheckpoints.map((c) => (
            <Tag key={c.checkpointId} icon={<MinusCircleOutlined />} color="red" style={{ marginBottom: 4 }}>
              <span style={{ textDecoration: 'line-through' }}>{c.checkpointName}</span>
            </Tag>
          ))}
        </div>
      )}
      {routeChange.newCheckpoints.length > 0 && (
        <div>
          <Text type="secondary">
            {routeChange.insertAfterName
              ? t('incidents.route.addedAfter', { name: routeChange.insertAfterName })
              : t('incidents.route.added')}
            :
          </Text>
          {routeChange.newCheckpoints.map((c, idx) => (
            <div key={c.checkpointId ?? `new-${idx}`} style={{ display: 'flex', gap: 8, alignItems: 'baseline', padding: '3px 0 0 4px' }}>
              <PlusCircleOutlined style={{ color: '#16A34A' }} />
              <span style={{ color: '#15803D', fontWeight: 600 }}>{c.checkpointName}</span>
              <Text type="secondary" style={{ fontSize: 12 }}>
                · {t(`incidents.reroute.type.${c.checkpointType}`, c.checkpointType)} · {formatTime(c.plannedTime)}
                {c.address ? ` · ${c.address}` : ''}
                {c.mandatoryRestMinutes ? ` · ${t('incidents.route.rest', { minutes: c.mandatoryRestMinutes })}` : ''}
              </Text>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
