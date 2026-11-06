import { useMemo, useState } from 'react';
import { Button, Flex, Select, Space, Tag, Tooltip, Typography, message } from 'antd';
import { AppstoreOutlined, InfoCircleOutlined, TeamOutlined } from '@ant-design/icons';
import { useTranslation } from 'react-i18next';
import {
  DndContext,
  DragOverlay,
  KeyboardSensor,
  MouseSensor,
  TouchSensor,
  closestCenter,
  pointerWithin,
  useDraggable,
  useDroppable,
  useSensor,
  useSensors,
} from '@dnd-kit/core';
import {
  POSITIONS_PER_COMPARTMENT,
  STALL_CLASS_COLORS,
  STALL_CLASS_ORDER,
  compartmentLimit,
  compartmentsNeeded,
  findPlacementProblem,
} from '@utils/compartments';

const { Text } = Typography;

// Mỗi escort một màu viền thẻ ngựa (lặp lại nếu nhiều hơn số màu)
const ESCORT_COLORS = ['#2563eb', '#16a34a', '#db2777', '#0891b2', '#ca8a04', '#4f46e5'];
// Backend: một escort phụ trách tối đa 3 con
const HORSES_PER_ESCORT = 3;
const TRAY_ID = 'tray';
const VALID_COLOR = '#16a34a';
const INVALID_COLOR = '#dc2626';

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

const positionId = (compartmentNo, positionNo) => `p-${compartmentNo}-${positionNo}`;

// Chuột / phím: điểm thả theo con trỏ; bàn phím không có con trỏ thì lấy ô gần nhất
const collisionDetection = (args) => (args.pointerCoordinates ? pointerWithin(args) : closestCenter(args));

/**
 * Nhãn hạng chuồng có màu (Ghép teal / Rưỡi tím / Riêng cam), rê chuột để xem số con mỗi khoang.
 * @param {{stallClass?: string}} props
 * @returns {JSX.Element}
 */
function StallClassTag({ stallClass }) {
  const { t } = useTranslation();
  const cls = stallClass || 'Shared';
  return (
    <Tooltip title={t(`tripPlan.compartments.classHint.${cls}`)}>
      <Tag color={STALL_CLASS_COLORS[cls]} style={{ marginInlineEnd: 0, fontSize: 11, lineHeight: '18px' }}>
        {t(`tripPlan.compartments.class.${cls}`)}
      </Tag>
    </Tooltip>
  );
}

/**
 * Thẻ một con ngựa: tên, hạng chuồng, mã đơn; viền theo màu áp tải phụ trách.
 * @param {Object} props
 * @param {Object} props.horse
 * @param {string} [props.color] - Màu áp tải
 * @param {boolean} [props.overlay] - Bản đang bay theo con trỏ khi kéo
 * @returns {JSX.Element}
 */
function HorseCardBody({ horse, color, overlay = false }) {
  return (
    <div
      style={{
        padding: '6px 8px',
        borderRadius: 8,
        background: '#fff',
        border: `2px solid ${color || '#e2e8f0'}`,
        boxShadow: overlay ? '0 10px 24px rgba(15, 23, 42, 0.22)' : '0 1px 2px rgba(15, 23, 42, 0.06)',
        width: '100%',
        minWidth: 0,
      }}
    >
      <Flex justify="space-between" align="center" gap={4}>
        <Text strong ellipsis style={{ fontSize: 13 }}>
          {horse.horseName}
        </Text>
        <StallClassTag stallClass={horse.stallClass} />
      </Flex>
      {horse.bookingCode && <div style={{ fontSize: 11, color: '#64748b' }}>{horse.bookingCode}</div>}
    </div>
  );
}

/**
 * Thẻ ngựa kéo được (dnd-kit). Khi đang kéo, thẻ gốc mờ đi và bản sao đi theo con trỏ (DragOverlay).
 * @param {{horse: Object, color?: string, disabled: boolean}} props
 * @returns {JSX.Element}
 */
function DraggableHorse({ horse, color, disabled }) {
  const { attributes, listeners, setNodeRef, isDragging } = useDraggable({ id: `h-${horse.key}`, data: { key: horse.key }, disabled });
  return (
    <div
      ref={setNodeRef}
      {...(disabled ? {} : listeners)}
      {...(disabled ? {} : attributes)}
      style={{
        width: '100%',
        opacity: isDragging ? 0.35 : 1,
        cursor: disabled ? 'default' : 'grab',
        touchAction: 'manipulation',
      }}
    >
      <HorseCardBody horse={horse} color={color} />
    </div>
  );
}

/**
 * Một vị trí trong khoang (nhận thả). Trống thì vẽ nét đứt; khoang đã đủ số con của hạng thì vị trí còn lại mờ đi.
 * @param {Object} props
 * @returns {JSX.Element}
 */
function PositionCell({ compartmentNo, positionNo, horse, blocked, readOnly, escorts, isOver }) {
  const { t } = useTranslation();
  const { setNodeRef } = useDroppable({ id: positionId(compartmentNo, positionNo), data: { compartmentNo, positionNo }, disabled: readOnly });
  return (
    <div
      ref={setNodeRef}
      style={{
        minHeight: 58,
        borderRadius: 8,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        border: horse ? 'none' : `1.5px ${blocked ? 'solid' : 'dashed'} ${isOver ? '#94a3b8' : '#cbd5e1'}`,
        background: horse ? 'transparent' : blocked ? '#f1f5f9' : isOver ? '#fef3c7' : '#f8fafc',
      }}
    >
      {horse ? (
        <DraggableHorse horse={horse} color={escortColor(escorts, horse.escortUserId)} disabled={readOnly} />
      ) : (
        <Text type="secondary" style={{ fontSize: 11 }}>
          {blocked ? t('tripPlan.compartments.positionBlocked') : t('tripPlan.compartments.positionEmpty', { number: positionNo })}
        </Text>
      )}
    </div>
  );
}

/**
 * Khay "Ngựa chờ xếp": nhận thả để bỏ xếp một con khỏi khoang.
 * @param {Object} props
 * @returns {JSX.Element}
 */
function Tray({ horses, escorts, readOnly, dragging, isOver }) {
  const { t } = useTranslation();
  const { setNodeRef } = useDroppable({ id: TRAY_ID, disabled: readOnly });
  return (
    <div
      ref={setNodeRef}
      style={{
        padding: 10,
        borderRadius: 10,
        border: `1.5px dashed ${dragging ? (isOver ? VALID_COLOR : '#94a3b8') : '#cbd5e1'}`,
        background: isOver ? '#f0fdf4' : '#f8fafc',
      }}
    >
      <Flex justify="space-between" align="center" wrap="wrap" gap={6} style={{ marginBottom: horses.length ? 8 : 0 }}>
        <Text strong style={{ fontSize: 13 }}>
          {t('tripPlan.compartments.tray', { count: horses.length })}
        </Text>
        {!readOnly && (
          <Text type="secondary" style={{ fontSize: 12 }}>
            {horses.length ? t('tripPlan.compartments.trayHint') : t('tripPlan.compartments.trayEmpty')}
          </Text>
        )}
      </Flex>
      {horses.length > 0 && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(150px, 1fr))', gap: 8 }}>
          {horses.map((h) => (
            <DraggableHorse key={h.key} horse={h} color={escortColor(escorts, h.escortUserId)} disabled={readOnly} />
          ))}
        </div>
      )}
    </div>
  );
}

/**
 * Sơ đồ thùng xe chia khoang (R-06), nhìn từ trên: cabin bên trái, các khoang theo chiều dài xe.
 * Mỗi khoang 3 vị trí và chỉ chở một hạng chuồng (Ghép 3 con, Rưỡi 2, Riêng 1).
 * Chế độ sửa: kéo thẻ ngựa từ khay vào khoang, kéo giữa hai khoang / lên ngựa khác để đổi chỗ, kéo về khay để bỏ xếp;
 * khi đang kéo, khoang nhận được viền xanh, không nhận được viền đỏ. Chọn áp tải theo khoang.
 *
 * @param {Object} props
 * @param {number} props.compartmentCount - Số khoang của xe (0 = chưa chọn xe)
 * @param {Array<{key: number, horseName: string, bookingCode?: string, bookingId?: number, stallClass?: string,
 *   placement: {compartmentNo: number, positionNo: number}|null, escortUserId?: number|null}>} props.horses
 * @param {Array<{userId: number, fullName: string, isLead?: boolean}>} props.escorts - Escort của chuyến (trưởng nhóm trước)
 * @param {boolean} [props.readOnly]
 * @param {(changes: Record<number, {compartmentNo: number, positionNo: number}|null>) => void} [props.onPlace] - Đổi vị trí một / hai con
 * @param {(keys: number[], userId: number|null) => void} [props.onAssign] - Chọn escort cho các con trong một khoang
 * @param {() => void} [props.onAutoArrange]
 * @param {() => void} [props.onAutoAssign]
 * @returns {JSX.Element}
 */
export default function StallMap({
  compartmentCount,
  horses,
  escorts,
  readOnly = false,
  onPlace,
  onAssign,
  onAutoArrange,
  onAutoAssign,
}) {
  const { t } = useTranslation();
  const [activeKey, setActiveKey] = useState(null);
  const [overId, setOverId] = useState(null);

  const sensors = useSensors(
    useSensor(MouseSensor, { activationConstraint: { distance: 5 } }),
    useSensor(TouchSensor, { activationConstraint: { delay: 150, tolerance: 6 } }),
    useSensor(KeyboardSensor),
  );

  // Chế độ xem: vẽ đủ khoang cho ngựa đã xếp kể cả khi chưa biết số khoang của xe
  const placedMax = Math.max(0, ...horses.map((h) => h.placement?.compartmentNo || 0));
  const count = readOnly ? Math.max(compartmentCount || 0, placedMax) : compartmentCount || 0;
  const needed = compartmentsNeeded(horses);
  const placements = useMemo(() => Object.fromEntries(horses.map((h) => [h.key, h.placement])), [horses]);
  const unplaced = horses.filter((h) => !h.placement);
  const activeHorse = horses.find((h) => h.key === activeKey) || null;
  const loadOf = (userId) => horses.filter((h) => h.escortUserId === userId).length;

  const horseAt = (compartmentNo, positionNo) =>
    horses.find((h) => h.placement?.compartmentNo === compartmentNo && h.placement?.positionNo === positionNo);

  /**
   * Kết quả nếu thả con đang kéo vào một vị trí / khay: vị trí mới của các con bị ảnh hưởng và lỗi (nếu có).
   * Thả lên một con khác = đổi chỗ (con kia về chỗ cũ của con đang kéo, hoặc về khay).
   */
  const evaluate = (key, target) => {
    const horse = horses.find((h) => h.key === key);
    if (!horse || !target) return null;
    const from = horse.placement;
    if (target === TRAY_ID) return from ? { changes: { [key]: null }, problem: null } : null;
    const { compartmentNo, positionNo } = target;
    const occupant = horseAt(compartmentNo, positionNo);
    if (occupant?.key === key) return null;
    const changes = { [key]: { compartmentNo, positionNo } };
    if (occupant) changes[occupant.key] = from;
    const touched = [...new Set([compartmentNo, from?.compartmentNo].filter(Boolean))];
    return { changes, problem: findPlacementProblem(horses, { ...placements, ...changes }, touched, Object.keys(changes).map(Number)) };
  };

  // Khoang nhận được con đang kéo nếu còn vị trí trống hợp lệ; con đã nằm trong khoang thì tính cả đổi chỗ
  // (ngựa từ khay thả lên con khác vẫn đổi được, nhưng không tô xanh để khỏi hiểu nhầm là còn chỗ)
  const acceptsActive = (compartmentNo) => {
    if (activeKey === null) return null;
    const fromTray = !horses.find((h) => h.key === activeKey)?.placement;
    return Array.from({ length: POSITIONS_PER_COMPARTMENT }, (_, i) => i + 1).some((p) => {
      if (fromTray && horseAt(compartmentNo, p)) return false;
      const result = evaluate(activeKey, { compartmentNo, positionNo: p });
      return result && !result.problem;
    });
  };

  const targetOf = (over) => (over?.id === TRAY_ID ? TRAY_ID : over?.data?.current || null);
  const describeProblem = (problem) =>
    t(`tripPlan.compartments.reasons.${problem.reason}`, {
      number: problem.compartmentNo,
      current: t(`tripPlan.compartments.class.${problem.stallClass}`),
      other: t(`tripPlan.compartments.class.${problem.otherClass || problem.stallClass}`),
      limit: problem.limit,
    });
  const overResult = activeKey !== null && overId !== null && overId !== TRAY_ID
    ? evaluate(activeKey, { compartmentNo: Number(overId.split('-')[1]), positionNo: Number(overId.split('-')[2]) })
    : null;

  const handleDragEnd = ({ active, over }) => {
    const key = active.data.current?.key;
    setActiveKey(null);
    setOverId(null);
    const result = evaluate(key, targetOf(over));
    if (!result) return;
    if (result.problem) {
      message.warning(describeProblem(result.problem));
      return;
    }
    onPlace?.(result.changes);
  };

  // Đọc cho trình đọc màn hình khi kéo bằng bàn phím
  const nameOf = (id) => horses.find((h) => `h-${h.key}` === id)?.horseName || '';
  const targetName = (id) => {
    if (!id) return '';
    if (id === TRAY_ID) return t('tripPlan.compartments.a11y.tray');
    const [, c, p] = String(id).split('-');
    return t('tripPlan.compartments.a11y.position', { compartment: c, position: p });
  };
  const accessibility = {
    screenReaderInstructions: { draggable: t('tripPlan.compartments.a11y.instructions') },
    announcements: {
      onDragStart: ({ active }) => t('tripPlan.compartments.a11y.pickUp', { name: nameOf(active.id) }),
      onDragOver: ({ active, over }) =>
        over ? t('tripPlan.compartments.a11y.over', { name: nameOf(active.id), target: targetName(over.id) }) : undefined,
      onDragEnd: ({ active, over }) =>
        over ? t('tripPlan.compartments.a11y.drop', { name: nameOf(active.id), target: targetName(over.id) }) : undefined,
      onDragCancel: ({ active }) => t('tripPlan.compartments.a11y.cancel', { name: nameOf(active.id) }),
    },
  };

  const compartments = Array.from({ length: count }, (_, i) => i + 1).map((no) => {
    const inside = horses.filter((h) => h.placement?.compartmentNo === no);
    const cls = inside[0]?.stallClass || (inside.length ? 'Shared' : null);
    return { no, inside, cls, limit: cls ? compartmentLimit(cls) : POSITIONS_PER_COMPARTMENT };
  });

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={collisionDetection}
      accessibility={accessibility}
      onDragStart={({ active }) => setActiveKey(active.data.current?.key ?? null)}
      onDragOver={({ over }) => setOverId(over?.id ?? null)}
      onDragEnd={handleDragEnd}
      onDragCancel={() => {
        setActiveKey(null);
        setOverId(null);
      }}
    >
      <Space direction="vertical" size={12} style={{ width: '100%' }}>
        {/* Áp tải + tải từng người, và các nút tự động */}
        <Flex gap={8} wrap="wrap" align="center" justify="space-between">
          <Flex gap={6} wrap="wrap">
            {escorts.map((e) => (
              <Tag key={e.userId} color={escortColor(escorts, e.userId)} style={{ marginInlineEnd: 0 }}>
                {e.fullName}
                {e.isLead ? ` · ${t('tripPlan.fields.lead')}` : ''} · {t('tripPlan.stallMap.load', { count: loadOf(e.userId), max: HORSES_PER_ESCORT })}
              </Tag>
            ))}
            {escorts.length === 0 && (
              <Text type="secondary" style={{ fontSize: 12 }}>
                {t('tripPlan.stallMap.noEscort')}
              </Text>
            )}
          </Flex>
          {!readOnly && (
            <Space wrap size={6}>
              <Button size="small" icon={<AppstoreOutlined />} disabled={count === 0 || horses.length === 0} onClick={onAutoArrange}>
                {t('tripPlan.compartments.autoArrange')}
              </Button>
              <Button size="small" icon={<TeamOutlined />} disabled={escorts.length === 0 || horses.length === 0} onClick={onAutoAssign}>
                {t('tripPlan.stallMap.autoAssign')}
              </Button>
            </Space>
          )}
        </Flex>

        {/* Chú thích hạng chuồng + số khoang cần / có */}
        <Flex gap={8} wrap="wrap" align="center" justify="space-between">
          <Flex gap={10} wrap="wrap" align="center">
            {STALL_CLASS_ORDER.map((cls) => (
              <Space key={cls} size={4}>
                <StallClassTag stallClass={cls} />
                <Text type="secondary" style={{ fontSize: 12 }}>
                  {t('tripPlan.compartments.perCompartment', { count: compartmentLimit(cls) })}
                </Text>
              </Space>
            ))}
          </Flex>
          {horses.length > 0 && count > 0 && (
            <Text type={needed > count ? 'danger' : 'secondary'} style={{ fontSize: 12 }}>
              {t('tripPlan.compartments.needVsHave', { needed, have: count })}
            </Text>
          )}
        </Flex>

        {(!readOnly || unplaced.length > 0) && (
          <Tray horses={unplaced} escorts={escorts} readOnly={readOnly} dragging={activeKey !== null} isOver={overId === TRAY_ID} />
        )}

        {count === 0 ? (
          <Text type="secondary">{readOnly ? t('tripPlan.stallMap.empty') : t('tripPlan.compartments.noVehicle')}</Text>
        ) : (
          // Thùng xe nhìn từ trên: cabin bên trái, khoang nối tiếp theo chiều dài; màn hẹp thì cuộn ngang
          <div style={{ overflowX: 'auto', paddingBottom: 4 }}>
            <Flex align="stretch" style={{ minWidth: 'min-content' }}>
              <div
                style={{
                  width: 44,
                  flexShrink: 0,
                  borderRadius: '18px 4px 4px 18px',
                  background: '#334155',
                  color: '#e2e8f0',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  marginRight: 6,
                }}
              >
                <span style={{ writingMode: 'vertical-rl', transform: 'rotate(180deg)', fontSize: 11, letterSpacing: 1 }}>
                  {t('tripPlan.compartments.cabin')}
                </span>
              </div>
              <Flex gap={6} style={{ padding: 6, borderRadius: 8, border: '2px solid #94a3b8', background: '#e2e8f0' }}>
                {compartments.map(({ no, inside, cls, limit }) => {
                  const accepts = acceptsActive(no);
                  const overHere = overId && overId.startsWith(`p-${no}-`);
                  const borderColor = accepts === null ? '#cbd5e1' : accepts ? VALID_COLOR : INVALID_COLOR;
                  const escortIds = [...new Set(inside.map((h) => h.escortUserId ?? null))];
                  const sharedEscort = escortIds.length === 1 ? escortIds[0] : undefined;
                  const otherLoad = (userId) => loadOf(userId) - inside.filter((h) => h.escortUserId === userId).length;
                  return (
                    <div
                      key={no}
                      style={{
                        width: 180,
                        flexShrink: 0,
                        padding: 8,
                        borderRadius: 8,
                        background: '#fff',
                        border: `2px solid ${borderColor}`,
                        boxShadow: overHere ? `0 0 0 3px ${accepts ? '#bbf7d0' : '#fecaca'}` : undefined,
                      }}
                    >
                      <Flex justify="space-between" align="center" gap={4} style={{ marginBottom: 6 }}>
                        <Text strong style={{ fontSize: 12, whiteSpace: 'nowrap' }}>
                          {t('tripPlan.compartments.title', { number: no })}
                        </Text>
                        <Space size={4}>
                          {cls && <StallClassTag stallClass={cls} />}
                          <Text type="secondary" style={{ fontSize: 11 }}>
                            {t('tripPlan.compartments.count', { count: inside.length, max: limit })}
                          </Text>
                        </Space>
                      </Flex>
                      <Space direction="vertical" size={6} style={{ width: '100%' }}>
                        {Array.from({ length: POSITIONS_PER_COMPARTMENT }, (_, i) => i + 1).map((p) => {
                          const horse = horseAt(no, p);
                          return (
                            <PositionCell
                              key={p}
                              compartmentNo={no}
                              positionNo={p}
                              horse={horse}
                              blocked={!horse && inside.length >= limit}
                              readOnly={readOnly}
                              escorts={escorts}
                              isOver={overId === positionId(no, p)}
                            />
                          );
                        })}
                      </Space>
                      {overHere && overResult?.problem && (
                        <Text type="danger" style={{ display: 'block', fontSize: 11, marginTop: 6 }}>
                          {describeProblem(overResult.problem)}
                        </Text>
                      )}
                      {inside.length > 0 &&
                        (readOnly ? (
                          <div style={{ fontSize: 12, marginTop: 6, color: escortColor(escorts, sharedEscort) || '#64748b' }}>
                            {escortIds
                              .map((id) => escorts.find((e) => e.userId === id)?.fullName || t('tripPlan.stallMap.unassigned'))
                              .join(', ')}
                          </div>
                        ) : (
                          <Select
                            size="small"
                            allowClear
                            style={{ width: '100%', marginTop: 6 }}
                            placeholder={t('tripPlan.stallMap.autoPlaceholder')}
                            value={sharedEscort ?? undefined}
                            onChange={(v) => onAssign?.(inside.map((h) => h.key), v ?? null)}
                            options={escorts.map((e) => ({
                              value: e.userId,
                              label: e.fullName,
                              disabled: otherLoad(e.userId) + inside.length > HORSES_PER_ESCORT,
                            }))}
                          />
                        ))}
                    </div>
                  );
                })}
              </Flex>
            </Flex>
          </div>
        )}

        {!readOnly && (
          <Text type="secondary" style={{ fontSize: 12 }}>
            <InfoCircleOutlined /> {t('tripPlan.stallMap.hint')}
          </Text>
        )}
      </Space>

      <DragOverlay dropAnimation={null}>
        {activeHorse && (
          <div style={{ width: 150, cursor: 'grabbing' }}>
            <HorseCardBody horse={activeHorse} color={escortColor(escorts, activeHorse.escortUserId)} overlay />
          </div>
        )}
      </DragOverlay>
    </DndContext>
  );
}
