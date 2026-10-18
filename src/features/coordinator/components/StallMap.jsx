import { useState } from 'react';
import { Button, Flex, Select, Space, Tag, Typography } from 'antd';
import { TeamOutlined } from '@ant-design/icons';
import { useTranslation } from 'react-i18next';

const { Text } = Typography;

// Mỗi escort một màu khung ô chuồng (lặp lại nếu nhiều hơn số màu)
const ESCORT_COLORS = ['#2563eb', '#16a34a', '#db2777', '#7c3aed', '#0891b2', '#ea580c'];
// Backend: một escort phụ trách tối đa 3 con
const HORSES_PER_ESCORT = 3;
// Xe 6 chỗ = 2 hàng x 3 ô
const COLUMNS = 3;

/**
 * Màu của một escort theo vị trí trong danh sách escort của chuyến.
 * @param {Array<{userId: number}>} escorts
 * @param {number|null|undefined} userId
 * @returns {string|undefined}
 */
const escortColor = (escorts, userId) => {
  const idx = escorts.findIndex((e) => e.userId === userId);
  return idx >= 0 ? ESCORT_COLORS[idx % ESCORT_COLORS.length] : undefined;
};

/**
 * Sơ đồ chuồng của xe (R-06): lưới ô theo sức chứa, mỗi ô một con ngựa, khung tô màu theo escort phụ trách.
 * Chế độ sửa: bấm một ô rồi bấm ô khác để đổi chỗ / chuyển ngựa sang ô trống; chọn escort cho từng ô;
 * nút "Tự phân công" chia ô 1-3 cho escort đầu tiên, 4-6 cho escort thứ hai...
 *
 * @param {Object} props
 * @param {number} props.capacity - Số ô chuồng của xe (0 = chưa chọn xe)
 * @param {Array<{key: number, slot: number, horseName: string, bookingCode?: string, escortUserId?: number|null}>} props.horses
 * @param {Array<{userId: number, fullName: string, isLead?: boolean}>} props.escorts - Escort của chuyến (trưởng nhóm trước)
 * @param {boolean} [props.readOnly]
 * @param {(fromSlot: number, toSlot: number) => void} [props.onMove] - Đổi chỗ hai ô
 * @param {(key: number, userId: number|null) => void} [props.onAssign] - Chọn escort cho một con
 * @param {() => void} [props.onAutoAssign]
 * @returns {JSX.Element}
 */
export default function StallMap({ capacity, horses, escorts, readOnly = false, onMove, onAssign, onAutoAssign }) {
  const { t } = useTranslation();
  const [picked, setPicked] = useState(null);

  // Chưa chọn xe: vẫn vẽ đủ ô cho số ngựa đang có
  const slotCount = Math.max(capacity || 0, ...horses.map((h) => h.slot), 0);
  const bySlot = Object.fromEntries(horses.map((h) => [h.slot, h]));
  const loadOf = (userId) => horses.filter((h) => h.escortUserId === userId).length;

  const clickCell = (slot) => {
    if (readOnly) return;
    if (picked === null) {
      if (bySlot[slot]) setPicked(slot);
      return;
    }
    if (picked !== slot) onMove?.(picked, slot);
    setPicked(null);
  };

  return (
    <Space direction="vertical" size={10} style={{ width: '100%' }}>
      <Flex gap={8} wrap="wrap" align="center" justify="space-between">
        <Flex gap={6} wrap="wrap">
          {escorts.map((e) => {
            const load = loadOf(e.userId);
            return (
              <Tag key={e.userId} color={escortColor(escorts, e.userId)} style={{ marginInlineEnd: 0 }}>
                {e.fullName}
                {e.isLead ? ` · ${t('tripPlan.fields.lead')}` : ''} · {t('tripPlan.stallMap.load', { count: load, max: HORSES_PER_ESCORT })}
              </Tag>
            );
          })}
          {escorts.length === 0 && (
            <Text type="secondary" style={{ fontSize: 12 }}>
              {t('tripPlan.stallMap.noEscort')}
            </Text>
          )}
        </Flex>
        {!readOnly && (
          <Button size="small" icon={<TeamOutlined />} disabled={escorts.length === 0 || horses.length === 0} onClick={onAutoAssign}>
            {t('tripPlan.stallMap.autoAssign')}
          </Button>
        )}
      </Flex>

      {slotCount === 0 ? (
        <Text type="secondary">{t('tripPlan.stallMap.empty')}</Text>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: `repeat(${Math.min(COLUMNS, slotCount)}, minmax(0, 1fr))`, gap: 8 }}>
          {Array.from({ length: slotCount }, (_, i) => i + 1).map((slot) => {
            const horse = bySlot[slot];
            const color = horse ? escortColor(escorts, horse.escortUserId) : undefined;
            const overCapacity = capacity > 0 && slot > capacity;
            return (
              <div
                key={slot}
                role={readOnly ? undefined : 'button'}
                tabIndex={readOnly ? undefined : 0}
                onClick={() => clickCell(slot)}
                onKeyDown={(e) => (e.key === 'Enter' || e.key === ' ') && clickCell(slot)}
                style={{
                  minHeight: 88,
                  padding: 8,
                  borderRadius: 10,
                  border: `2px ${horse ? 'solid' : 'dashed'} ${overCapacity ? '#dc2626' : color || '#cbd5e1'}`,
                  background: picked === slot ? '#fef3c7' : horse ? '#fff' : '#f8fafc',
                  cursor: readOnly ? 'default' : 'pointer',
                }}
              >
                <Text type="secondary" style={{ fontSize: 11 }}>
                  {t('customerTrips.stall', { number: slot })}
                </Text>
                {horse ? (
                  <div>
                    <Text strong style={{ display: 'block' }}>
                      {horse.horseName}
                    </Text>
                    {horse.bookingCode && <Text style={{ fontSize: 11, color: '#64748b' }}>{horse.bookingCode}</Text>}
                    {readOnly ? (
                      <div style={{ fontSize: 12, color: color || '#64748b', marginTop: 2 }}>
                        {escorts.find((e) => e.userId === horse.escortUserId)?.fullName || t('tripPlan.stallMap.unassigned')}
                      </div>
                    ) : (
                      <Select
                        size="small"
                        allowClear
                        style={{ width: '100%', marginTop: 4 }}
                        placeholder={t('tripPlan.stallMap.autoPlaceholder')}
                        value={horse.escortUserId ?? undefined}
                        onClick={(e) => e.stopPropagation()}
                        onChange={(v) => onAssign?.(horse.key, v ?? null)}
                        options={escorts.map((e) => ({
                          value: e.userId,
                          label: e.fullName,
                          disabled: e.userId !== horse.escortUserId && loadOf(e.userId) >= HORSES_PER_ESCORT,
                        }))}
                      />
                    )}
                  </div>
                ) : (
                  <Text type="secondary" style={{ display: 'block', fontSize: 12, marginTop: 6 }}>
                    {t('tripPlan.stallMap.emptySlot')}
                  </Text>
                )}
              </div>
            );
          })}
        </div>
      )}

      {!readOnly && (
        <Text type="secondary" style={{ fontSize: 12 }}>
          {t('tripPlan.stallMap.hint')}
        </Text>
      )}
    </Space>
  );
}
