// Đang tạo ReportCharts vì trang Báo cáo của quản lý cần biểu đồ (doanh thu / chi phí theo tháng, chuyến, đúng giờ, sự cố).
// Vẽ bằng SVG thuần: dự án không có thư viện biểu đồ và quy tắc AGENTS.md không cho thêm dependency.
import { useEffect, useRef, useState } from 'react';
import { Empty, Flex, Typography } from 'antd';
import { CHART_COLORS } from '@features/manager/constants/reportCharts';
import styles from './ReportCharts.module.css';

const { Text } = Typography;

/** Chiều rộng thật của khung (đo bằng ResizeObserver) để SVG vẽ đúng tỉ lệ, chữ không bị kéo giãn */
function useContainerWidth() {
  const ref = useRef(null);
  const [width, setWidth] = useState(0);
  useEffect(() => {
    if (!ref.current) return undefined;
    const observer = new ResizeObserver(([entry]) => setWidth(Math.floor(entry.contentRect.width)));
    observer.observe(ref.current);
    return () => observer.disconnect();
  }, []);
  return [ref, width];
}

/** Mốc trục y "đẹp" (0, 2k, 4k…) phủ được giá trị lớn nhất */
function niceTicks(max, count = 4) {
  // Chưa có số liệu: chỉ vẽ đường gốc 0
  if (!(max > 0)) return [0];
  const raw = max / count;
  const pow = 10 ** Math.floor(Math.log10(raw));
  const step = [1, 2, 2.5, 5, 10].map((m) => m * pow).find((s) => s >= raw) || raw;
  const top = Math.ceil(max / step) * step;
  const ticks = [];
  for (let v = 0; v <= top + step / 2; v += step) ticks.push(Math.round(v * 100) / 100);
  return ticks;
}

/** Chú thích (legend) một hàng phía trên biểu đồ */
export function ChartLegend({ items }) {
  return (
    <Flex gap={16} wrap="wrap" className={styles.legend}>
      {items.map((item) => (
        <span key={item.label} className={styles.legendItem}>
          {item.line ? (
            <span className={styles.legendLine} style={{ background: item.color }} />
          ) : (
            <span className={styles.legendSwatch} style={{ background: item.color }} />
          )}
          {item.label}
        </span>
      ))}
    </Flex>
  );
}

/** Hộp tooltip dùng chung, đặt theo vị trí chuột trong khung biểu đồ */
function Tooltip({ x, y, width, title, rows }) {
  const left = Math.min(Math.max(x + 12, 0), Math.max(width - 190, 0));
  return (
    <div className={styles.tooltip} style={{ left, top: Math.max(y - 10, 0) }}>
      <div className={styles.tooltipTitle}>{title}</div>
      {rows.map((r) => (
        <div key={r.label} className={styles.tooltipRow}>
          <span className={styles.legendSwatch} style={{ background: r.color }} />
          <span className={styles.tooltipLabel}>{r.label}</span>
          <strong>{r.value}</strong>
        </div>
      ))}
    </div>
  );
}

/**
 * Cột nhóm theo tháng (vd. doanh thu + chi phí) và một đường (vd. lợi nhuận) trên CÙNG một trục (cùng đơn vị).
 * @param {{
 *   data: Array<{ label: string, values: Record<string, number> }>,
 *   bars: Array<{ key: string, label: string, color: string }>,
 *   line?: { key: string, label: string, color: string },
 *   formatValue: (v: number) => string,
 *   formatAxis: (v: number) => string,
 *   height?: number,
 * }} props
 */
export function GroupedBarLineChart({ data, bars, line, formatValue, formatAxis, height = 280 }) {
  const [ref, width] = useContainerWidth();
  const [hover, setHover] = useState(null);
  const pad = { top: 12, right: 12, bottom: 28, left: 48 };
  const innerW = Math.max(width - pad.left - pad.right, 0);
  const innerH = height - pad.top - pad.bottom;
  const allValues = data.flatMap((d) => [...bars.map((b) => d.values[b.key] || 0), line ? d.values[line.key] || 0 : 0]);
  const maxV = Math.max(...allValues, 0);
  const minV = Math.min(...allValues, 0);
  const ticks = niceTicks(maxV);
  const top = ticks[ticks.length - 1];
  const bottom = minV < 0 ? -niceTicks(-minV)[niceTicks(-minV).length - 1] : 0;
  const y = (v) => pad.top + innerH - ((v - bottom) / (top - bottom || 1)) * innerH;
  const groupW = data.length ? innerW / data.length : 0;
  const barW = Math.min(28, Math.max((groupW * 0.62 - 2 * (bars.length - 1)) / bars.length, 4));
  const groupX = (i) => pad.left + groupW * i + groupW / 2;
  const allZero = allValues.every((v) => !v);

  return (
    <div ref={ref} className={styles.frame} style={{ height }} onMouseLeave={() => setHover(null)}>
      {width > 0 && (
        <svg width={width} height={height} role="img">
          {[...ticks, ...(bottom < 0 ? [bottom] : [])].map((tk) => (
            <g key={tk}>
              <line x1={pad.left} x2={width - pad.right} y1={y(tk)} y2={y(tk)} stroke={tk === 0 ? CHART_COLORS.axis : CHART_COLORS.grid} />
              <text x={pad.left - 8} y={y(tk)} dy="0.32em" textAnchor="end" className={styles.axisText}>
                {formatAxis(tk)}
              </text>
            </g>
          ))}
          {data.map((d, i) => {
            const cx = groupX(i);
            const totalW = bars.length * barW + (bars.length - 1) * 2;
            return (
              <g key={d.label}>
                {hover === i && <rect x={cx - groupW / 2} y={pad.top} width={groupW} height={innerH} fill="rgba(11,11,11,0.04)" />}
                {bars.map((b, j) => {
                  const v = d.values[b.key] || 0;
                  const x = cx - totalW / 2 + j * (barW + 2);
                  const y0 = y(0);
                  const y1 = y(v);
                  const h = Math.abs(y0 - y1);
                  // Đầu cột bo 4px, chân cột vuông bám trục
                  const r = Math.min(4, h, barW / 2);
                  const topY = Math.min(y0, y1);
                  const path =
                    v >= 0
                      ? `M${x},${y0} V${topY + r} Q${x},${topY} ${x + r},${topY} H${x + barW - r} Q${x + barW},${topY} ${x + barW},${topY + r} V${y0} Z`
                      : `M${x},${y0} V${y1 - r} Q${x},${y1} ${x + r},${y1} H${x + barW - r} Q${x + barW},${y1} ${x + barW},${y1 - r} V${y0} Z`;
                  return h > 0 ? <path key={b.key} d={path} fill={b.color} /> : null;
                })}
                <text x={cx} y={height - 8} textAnchor="middle" className={styles.axisText}>
                  {d.label}
                </text>
                {/* Vùng bắt chuột rộng hơn cột */}
                <rect
                  x={cx - groupW / 2}
                  y={pad.top}
                  width={groupW}
                  height={innerH}
                  fill="transparent"
                  onMouseEnter={() => setHover(i)}
                  onMouseMove={() => setHover(i)}
                />
              </g>
            );
          })}
          {line && data.length > 1 && (
            <>
              <polyline
                points={data.map((d, i) => `${groupX(i)},${y(d.values[line.key] || 0)}`).join(' ')}
                fill="none"
                stroke={line.color}
                strokeWidth={2}
                strokeLinejoin="round"
                pointerEvents="none"
              />
              {data.map((d, i) => (
                <circle
                  key={d.label}
                  cx={groupX(i)}
                  cy={y(d.values[line.key] || 0)}
                  r={hover === i ? 5 : 4}
                  fill={line.color}
                  stroke="#ffffff"
                  strokeWidth={2}
                  pointerEvents="none"
                />
              ))}
            </>
          )}
        </svg>
      )}
      {allZero && <div className={styles.emptyOverlay}><Empty image={Empty.PRESENTED_IMAGE_SIMPLE} /></div>}
      {hover !== null && data[hover] && (
        <Tooltip
          x={groupX(hover)}
          y={pad.top}
          width={width}
          title={data[hover].label}
          rows={[...bars, ...(line ? [line] : [])].map((s) => ({ label: s.label, color: s.color, value: formatValue(data[hover].values[s.key] || 0) }))}
        />
      )}
    </div>
  );
}

/**
 * Cột đơn theo tháng (một series), có tooltip với dòng phụ.
 * @param {{ data: Array<{ label: string, value: number, extra?: Array<{ label: string, value: string }> }>, color: string, seriesLabel: string, formatValue: (v:number)=>string, height?: number }} props
 */
export function SimpleBarChart({ data, color, seriesLabel, formatValue, height = 220 }) {
  const [ref, width] = useContainerWidth();
  const [hover, setHover] = useState(null);
  const pad = { top: 18, right: 12, bottom: 28, left: 36 };
  const innerW = Math.max(width - pad.left - pad.right, 0);
  const innerH = height - pad.top - pad.bottom;
  const ticks = niceTicks(Math.max(...data.map((d) => d.value), 0), 3);
  const top = ticks[ticks.length - 1];
  const y = (v) => pad.top + innerH - (v / (top || 1)) * innerH;
  const slot = data.length ? innerW / data.length : 0;
  const barW = Math.min(32, slot * 0.55);
  const cx = (i) => pad.left + slot * i + slot / 2;
  const allZero = data.every((d) => !d.value);

  return (
    <div ref={ref} className={styles.frame} style={{ height }} onMouseLeave={() => setHover(null)}>
      {width > 0 && (
        <svg width={width} height={height} role="img">
          {ticks.map((tk) => (
            <g key={tk}>
              <line x1={pad.left} x2={width - pad.right} y1={y(tk)} y2={y(tk)} stroke={tk === 0 ? CHART_COLORS.axis : CHART_COLORS.grid} />
              <text x={pad.left - 8} y={y(tk)} dy="0.32em" textAnchor="end" className={styles.axisText}>
                {tk}
              </text>
            </g>
          ))}
          {data.map((d, i) => {
            const h = y(0) - y(d.value);
            const x = cx(i) - barW / 2;
            const r = Math.min(4, h, barW / 2);
            const t = y(d.value);
            return (
              <g key={d.label}>
                {h > 0 && (
                  <path
                    d={`M${x},${y(0)} V${t + r} Q${x},${t} ${x + r},${t} H${x + barW - r} Q${x + barW},${t} ${x + barW},${t + r} V${y(0)} Z`}
                    fill={color}
                    opacity={hover === null || hover === i ? 1 : 0.55}
                  />
                )}
                {/* Nhãn số trên cột cao nhất và cột đang trỏ (không ghi số lên mọi cột) */}
                {d.value > 0 && (hover === i || d.value === Math.max(...data.map((z) => z.value))) && (
                  <text x={cx(i)} y={t - 6} textAnchor="middle" className={styles.valueText}>
                    {formatValue(d.value)}
                  </text>
                )}
                <text x={cx(i)} y={height - 8} textAnchor="middle" className={styles.axisText}>
                  {d.label}
                </text>
                <rect x={cx(i) - slot / 2} y={pad.top} width={slot} height={innerH} fill="transparent" onMouseEnter={() => setHover(i)} />
              </g>
            );
          })}
        </svg>
      )}
      {allZero && <div className={styles.emptyOverlay}><Empty image={Empty.PRESENTED_IMAGE_SIMPLE} /></div>}
      {hover !== null && data[hover] && (
        <Tooltip
          x={cx(hover)}
          y={pad.top}
          width={width}
          title={data[hover].label}
          rows={[{ label: seriesLabel, color, value: formatValue(data[hover].value) }, ...(data[hover].extra || []).map((e) => ({ ...e, color: 'transparent' }))]}
        />
      )}
    </div>
  );
}

/**
 * Biểu đồ vành khuyên (donut): mỗi phần có nhãn + số + %, con số chính ở giữa.
 * @param {{ segments: Array<{ key: string, label: string, value: number, color: string }>, centerValue: string, centerLabel: string, size?: number }} props
 */
export function DonutChart({ segments, centerValue, centerLabel, size = 180 }) {
  const [hover, setHover] = useState(null);
  const total = segments.reduce((s, x) => s + (x.value || 0), 0);
  const r = size / 2 - 6;
  const thickness = 22;
  const c = size / 2;
  // Khe 2px giữa các phần (đổi ra góc theo bán kính)
  const gap = segments.filter((s) => s.value > 0).length > 1 ? 2 / r : 0;
  // Góc bắt đầu của từng phần = tổng các phần trước (tính sẵn, không cộng dồn trong lúc vẽ)
  const sweeps = segments.map((s) => (total ? (s.value / total) * Math.PI * 2 : 0));
  const starts = sweeps.map((_, i) => -Math.PI / 2 + sweeps.slice(0, i).reduce((a, b) => a + b, 0));
  const arcs = segments.map((s, i) => {
    const sweep = sweeps[i];
    const start = starts[i] + gap / 2;
    const end = starts[i] + sweep - gap / 2;
    if (!(s.value > 0) || end <= start) return { ...s, d: null };
    const ri = r - thickness;
    const large = end - start > Math.PI ? 1 : 0;
    const p = (rad, a) => `${c + rad * Math.cos(a)},${c + rad * Math.sin(a)}`;
    // Một phần chiếm trọn vòng thì vẽ thành 2 nửa để path hợp lệ
    if (sweep >= Math.PI * 2 - 1e-6) {
      return {
        ...s,
        d: `M${p(r, -Math.PI / 2)} A${r},${r} 0 1 1 ${p(r, Math.PI / 2)} A${r},${r} 0 1 1 ${p(r, -Math.PI / 2)} M${p(ri, -Math.PI / 2)} A${ri},${ri} 0 1 0 ${p(ri, Math.PI / 2)} A${ri},${ri} 0 1 0 ${p(ri, -Math.PI / 2)} Z`,
      };
    }
    return { ...s, d: `M${p(r, start)} A${r},${r} 0 ${large} 1 ${p(r, end)} L${p(ri, end)} A${ri},${ri} 0 ${large} 0 ${p(ri, start)} Z` };
  });

  return (
    <Flex gap={24} align="center" wrap="wrap" justify="center">
      <svg width={size} height={size} role="img" style={{ flexShrink: 0 }}>
        {total === 0 && <circle cx={c} cy={c} r={r - thickness / 2} fill="none" stroke={CHART_COLORS.grid} strokeWidth={thickness} />}
        {arcs.map((a) =>
          a.d ? (
            <path
              key={a.key}
              d={a.d}
              fill={a.color}
              fillRule="evenodd"
              opacity={hover === null || hover === a.key ? 1 : 0.45}
              onMouseEnter={() => setHover(a.key)}
              onMouseLeave={() => setHover(null)}
            />
          ) : null,
        )}
        <text x={c} y={c - 4} textAnchor="middle" className={styles.donutValue}>
          {centerValue}
        </text>
        <text x={c} y={c + 16} textAnchor="middle" className={styles.axisText}>
          {centerLabel}
        </text>
      </svg>
      <Flex vertical gap={10} style={{ minWidth: 180 }}>
        {segments.map((s) => (
          <div
            key={s.key}
            className={styles.donutRow}
            style={{ opacity: hover === null || hover === s.key ? 1 : 0.55 }}
            onMouseEnter={() => setHover(s.key)}
            onMouseLeave={() => setHover(null)}
          >
            <span className={styles.legendSwatch} style={{ background: s.color }} />
            <Text style={{ flex: 1 }}>{s.label}</Text>
            <Text strong>{s.value}</Text>
            <Text type="secondary" style={{ width: 44, textAlign: 'right' }}>
              {total ? `${Math.round((s.value / total) * 100)}%` : '—'}
            </Text>
          </div>
        ))}
      </Flex>
    </Flex>
  );
}

/**
 * Cột ngang xếp hạng (vd. sự cố theo loại): nhãn bên trái, số ở cuối cột.
 * @param {{ items: Array<{ key: string, label: string, value: number }>, color: string, emptyText: string }} props
 */
export function HorizontalBarList({ items, color, emptyText }) {
  const max = Math.max(...items.map((i) => i.value), 0);
  if (!items.length) {
    return <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description={emptyText} />;
  }
  return (
    <Flex vertical gap={12}>
      {items.map((item) => (
        <div key={item.key} className={styles.hbarRow} title={`${item.label}: ${item.value}`}>
          <Text className={styles.hbarLabel} ellipsis>
            {item.label}
          </Text>
          <div className={styles.hbarTrack}>
            <div className={styles.hbarFill} style={{ width: `${max ? (item.value / max) * 100 : 0}%`, background: color }} />
          </div>
          <Text strong className={styles.hbarValue}>
            {item.value}
          </Text>
        </div>
      ))}
    </Flex>
  );
}
