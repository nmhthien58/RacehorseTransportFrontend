import { useEffect, useMemo } from 'react';
import { Button, Tag, Tooltip as AntTooltip, Typography } from 'antd';
import { ArrowDownOutlined, ArrowUpOutlined, DeleteOutlined } from '@ant-design/icons';
import { useTranslation } from 'react-i18next';
import { MapContainer, Marker, Polyline, TileLayer, Tooltip, useMap, useMapEvents } from 'react-leaflet';
import L, { DEFAULT_CENTER, DEFAULT_ZOOM, TILE_ATTRIBUTION, TILE_URL } from './leafletSetup';
import styles from './Map.module.css';

/**
 * @typedef {Object} RouteStop
 * @property {number} lat
 * @property {number} lng
 * @property {string} stopType - Origin | RestStop | BorderGate | Destination | Pickup | Dropoff
 * @property {string} [name]
 * @property {string} [countryCode]
 */

// Màu marker theo loại mốc (đi / nghỉ / cửa khẩu / đón / trả / đích)
const STOP_COLORS = {
  Origin: '#16a34a',
  Pickup: '#0ea5e9',
  RestStop: '#f59e0b',
  BorderGate: '#7c3aed',
  Dropoff: '#db2777',
  Destination: '#dc2626',
};
// Mốc đầu / cuối lấy từ đơn: không kéo, không xóa, không đổi thứ tự
const FIXED_TYPES = ['Origin', 'Destination'];

const numberedIcon = (index, stopType) =>
  L.divIcon({
    className: '',
    html: `<div class="${styles.numberedIcon}" style="background:${STOP_COLORS[stopType] || '#64748b'}">${index + 1}</div>`,
    iconSize: [28, 28],
    iconAnchor: [14, 14],
  });

// Canh khung bản đồ vừa toàn bộ mốc + đường đi
function FitBounds({ points }) {
  const map = useMap();
  const key = points.map((p) => p.join(',')).join('|');
  useEffect(() => {
    const fit = () => {
      // Bản đồ có thể được tạo lúc khung chứa chưa có kích thước (bước wizard vừa hiện): đo lại trước khi canh khung
      map.invalidateSize();
      if (points.length === 1) map.setView(points[0], 12);
      if (points.length > 1) map.fitBounds(points, { padding: [32, 32] });
    };
    fit();
    const observer = new ResizeObserver(() => fit());
    observer.observe(map.getContainer());
    return () => observer.disconnect();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [map, key]);
  return null;
}

function ClickToAdd({ onAdd }) {
  useMapEvents({
    click(e) {
      onAdd?.({ lat: e.latlng.lat, lng: e.latlng.lng });
    },
  });
  return null;
}

const midpoint = (line) => (line?.length ? line[Math.floor(line.length / 2)] : null);

/**
 * Vẽ tuyến: marker đánh số theo loại mốc, đường đi, nhãn km từng chặng, tổng km.
 * Chế độ sửa (editable): bấm bản đồ để thêm mốc, kéo marker để dời, nút lên / xuống / xóa trong danh sách.
 * @param {{
 *   stops: RouteStop[],
 *   polyline?: number[][],
 *   legs?: Array<{ distanceKm: number, durationHours?: number, isEstimate?: boolean, polyline?: number[][] }>,
 *   totalDistanceKm?: number,
 *   totalDurationHours?: number,
 *   isEstimate?: boolean,
 *   editable?: boolean,
 *   onAddStop?: (point: { lat: number, lng: number }) => void,
 *   onMoveStop?: (index: number, point: { lat: number, lng: number }) => void,
 *   onReorder?: (stops: RouteStop[]) => void,
 *   onRemoveStop?: (index: number) => void,
 *   height?: number,
 *   showList?: boolean,
 * }} props
 */
export default function RouteMap({
  stops = [],
  polyline,
  legs = [],
  totalDistanceKm,
  totalDurationHours,
  isEstimate = false,
  editable = false,
  onAddStop,
  onMoveStop,
  onReorder,
  onRemoveStop,
  height = 360,
  showList = editable,
}) {
  const { t } = useTranslation();
  const positions = useMemo(() => stops.map((s) => [s.lat, s.lng]), [stops]);
  const line = polyline?.length ? polyline : positions;
  const boundsPoints = line.length ? line : positions;

  const move = (index, delta) => {
    const target = index + delta;
    if (target < 0 || target >= stops.length) return;
    if (FIXED_TYPES.includes(stops[index].stopType) || FIXED_TYPES.includes(stops[target].stopType)) return;
    const next = [...stops];
    [next[index], next[target]] = [next[target], next[index]];
    onReorder?.(next);
  };

  return (
    <div>
      <div className={styles.mapBox} style={{ height: Math.max(height, 280) }}>
        <MapContainer center={DEFAULT_CENTER} zoom={DEFAULT_ZOOM} style={{ height: '100%', width: '100%' }}>
          <TileLayer url={TILE_URL} attribution={TILE_ATTRIBUTION} />
          <FitBounds points={boundsPoints} />
          {editable && <ClickToAdd onAdd={onAddStop} />}
          {line.length > 1 && <Polyline positions={line} pathOptions={{ color: '#2563eb', weight: 4, dashArray: isEstimate ? '8 8' : undefined }} />}
          {legs.map((leg, i) => {
            const mid = midpoint(leg.polyline) || (positions[i] && positions[i + 1]
              ? [(positions[i][0] + positions[i + 1][0]) / 2, (positions[i][1] + positions[i + 1][1]) / 2]
              : null);
            if (!mid) return null;
            return (
              <Marker key={`leg-${i}`} position={mid} opacity={0} interactive={false}>
                <Tooltip permanent direction="center" className={styles.legLabel}>
                  {t('map.km', { value: Number(leg.distanceKm || 0).toLocaleString(undefined, { maximumFractionDigits: 1 }) })}
                  {leg.isEstimate ? '*' : ''}
                </Tooltip>
              </Marker>
            );
          })}
          {stops.map((stop, i) => (
            <Marker
              key={`stop-${i}-${stop.lat}-${stop.lng}`}
              position={[stop.lat, stop.lng]}
              icon={numberedIcon(i, stop.stopType)}
              draggable={editable && !FIXED_TYPES.includes(stop.stopType)}
              eventHandlers={{
                dragend: (e) => {
                  const { lat, lng } = e.target.getLatLng();
                  onMoveStop?.(i, { lat, lng });
                },
              }}
            >
              <Tooltip direction="top" offset={[0, -14]}>
                {stop.name || t(`map.stopType.${stop.stopType}`, { defaultValue: stop.stopType })}
              </Tooltip>
            </Marker>
          ))}
        </MapContainer>
      </div>

      <div className={styles.summary}>
        {totalDistanceKm != null && (
          <Typography.Text strong>
            {t('map.total')}: {t('map.km', { value: Number(totalDistanceKm).toLocaleString(undefined, { maximumFractionDigits: 1 }) })}
            {totalDurationHours != null ? ` · ${t('map.hours', { value: Number(totalDurationHours).toFixed(1) })}` : ''}
          </Typography.Text>
        )}
        {isEstimate && <Typography.Text type="warning">{t('map.estimateNote')}</Typography.Text>}
        {editable && <Typography.Text type="secondary">{t('map.addHint')}</Typography.Text>}
      </div>

      {showList && stops.length > 0 && (
        <div className={styles.stopList}>
          {stops.map((stop, i) => {
            const fixed = FIXED_TYPES.includes(stop.stopType);
            return (
              <div key={`row-${i}`} className={styles.stopItem}>
                <Tag color={STOP_COLORS[stop.stopType]}>{i + 1}</Tag>
                <span className={styles.stopName}>
                  {stop.name || t(`map.stopType.${stop.stopType}`, { defaultValue: stop.stopType })}
                  {stop.countryCode ? ` (${stop.countryCode})` : ''}
                </span>
                {editable && !fixed && (
                  <>
                    <AntTooltip title={t('map.moveUp')}>
                      <Button size="middle" icon={<ArrowUpOutlined />} onClick={() => move(i, -1)} />
                    </AntTooltip>
                    <AntTooltip title={t('map.moveDown')}>
                      <Button size="middle" icon={<ArrowDownOutlined />} onClick={() => move(i, 1)} />
                    </AntTooltip>
                    <AntTooltip title={t('map.remove')}>
                      <Button size="middle" danger icon={<DeleteOutlined />} onClick={() => onRemoveStop?.(i)} />
                    </AntTooltip>
                  </>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
