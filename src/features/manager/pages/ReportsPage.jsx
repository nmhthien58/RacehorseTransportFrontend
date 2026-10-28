// Đang sửa ReportsPage vì quản lý cần biểu đồ: doanh thu / chi phí / lợi nhuận theo tháng, chuyến, đúng giờ, KPI, sự cố
import { useEffect, useMemo, useState } from 'react';
import { Card, Row, Col, DatePicker, Typography, Spin, Empty, Progress, Flex, message } from 'antd';
import { useTranslation } from 'react-i18next';
import dayjs from 'dayjs';
import PageHeader from '@components/layout/PageHeader';
import reportService from '@services/reportService';
import { unwrapData, getErrorMessage, toIsoString } from '@utils/apiHelpers';
import { formatUsd } from '@utils/incidents';
import { CHART_COLORS, compactNumber } from '@features/manager/constants/reportCharts';
import {
  ChartLegend,
  DonutChart,
  GroupedBarLineChart,
  HorizontalBarList,
  SimpleBarChart,
} from '@features/manager/components/ReportCharts';

const { Text } = Typography;
const { RangePicker } = DatePicker;
const TREND_MONTHS = 6;

/**
 * Ô số liệu chính: nhãn, giá trị lớn, dòng phụ.
 * @param {{ label: string, value: React.ReactNode, hint?: React.ReactNode, accent: string }} props
 */
function StatTile({ label, value, hint, accent }) {
  return (
    <Card style={{ height: '100%', borderRadius: 12 }} styles={{ body: { padding: '16px 18px' } }}>
      <Flex align="center" gap={8}>
        <span style={{ width: 8, height: 8, borderRadius: 2, background: accent }} />
        <Text type="secondary" style={{ fontSize: 13 }}>
          {label}
        </Text>
      </Flex>
      <div style={{ fontSize: 26, fontWeight: 700, color: '#1C1917', lineHeight: 1.35, marginTop: 4 }}>{value}</div>
      {hint && (
        <Text type="secondary" style={{ fontSize: 12.5 }}>
          {hint}
        </Text>
      )}
    </Card>
  );
}

/**
 * Báo cáo tổng hợp cho quản lý (GET /reports/summary): chỉ tính các chuyến đã đóng.
 * - Số liệu chính, đúng giờ, sự cố: theo khoảng thời gian chọn (bỏ trống = toàn bộ).
 * - Xu hướng theo tháng: 6 tháng gần nhất (gọi cùng API cho từng tháng, backend chưa có API theo tháng).
 * @returns {JSX.Element}
 */
export default function ReportsPage() {
  const { t } = useTranslation();
  const [range, setRange] = useState(null);
  const [report, setReport] = useState(null);
  const [loading, setLoading] = useState(true);
  const [monthly, setMonthly] = useState([]);
  const [monthlyLoading, setMonthlyLoading] = useState(true);

  useEffect(() => {
    let active = true;
    const params = range
      ? { from: toIsoString(range[0].startOf('day')), to: toIsoString(range[1].endOf('day')) }
      : undefined;
    reportService
      .getSummary(params)
      .then((res) => active && setReport(unwrapData(res)))
      .catch((err) => message.error(getErrorMessage(err)))
      .finally(() => active && setLoading(false));
    return () => {
      active = false;
    };
  }, [range]);

  // Xu hướng 6 tháng gần nhất, tháng hiện tại ở cuối
  useEffect(() => {
    let active = true;
    const months = Array.from({ length: TREND_MONTHS }, (_, i) => dayjs().subtract(TREND_MONTHS - 1 - i, 'month').startOf('month'));
    Promise.all(
      months.map((m) =>
        reportService
          .getSummary({ from: toIsoString(m), to: toIsoString(m.endOf('month')) })
          .then((res) => ({ month: m, data: unwrapData(res) }))
          .catch(() => ({ month: m, data: null })),
      ),
    )
      .then((rows) => active && setMonthly(rows))
      .finally(() => active && setMonthlyLoading(false));
    return () => {
      active = false;
    };
  }, []);

  const financeSeries = useMemo(
    () =>
      monthly.map(({ month, data }) => ({
        label: month.format('MM/YY'),
        values: {
          revenue: Number(data?.revenue || 0),
          cost: Number(data?.operatingCost || 0),
          profit: Number(data?.grossProfit || 0),
        },
      })),
    [monthly],
  );
  const tripSeries = useMemo(
    () =>
      monthly.map(({ month, data }) => ({
        label: month.format('MM/YY'),
        value: Number(data?.completedTrips || 0),
        extra: [
          { label: t('reports.onTimeRate'), value: data?.completedTrips ? `${Math.round(Number(data.onTimeRate))}%` : '—' },
          { label: t('reports.horsesDelivered'), value: String(data?.horsesDelivered || 0) },
        ],
      })),
    [monthly, t],
  );

  const margin = report && Number(report.revenue) > 0 ? Math.round((Number(report.grossProfit) / Number(report.revenue)) * 100) : null;

  return (
    <div style={{ paddingBottom: 40 }}>
      <PageHeader
        title={t('reports.title')}
        subtitle={t('reports.subtitle')}
        actions={
          <RangePicker
            value={range}
            onChange={(value) => {
              setLoading(true);
              setRange(value);
            }}
            format="DD/MM/YYYY"
            allowClear
            placeholder={[t('reports.from'), t('reports.to')]}
          />
        }
      />

      {loading && !report ? (
        <div style={{ textAlign: 'center', padding: 60 }}>
          <Spin />
        </div>
      ) : !report ? (
        <Empty />
      ) : (
        <Spin spinning={loading}>
          <Row gutter={[16, 16]}>
            {/* Số liệu chính theo khoảng thời gian chọn */}
            <Col xs={24} sm={12} xl={6}>
              <StatTile
                label={t('reports.revenue')}
                value={formatUsd(report.revenue)}
                hint={t('reports.operatingCostHint', { cost: formatUsd(report.operatingCost) })}
                accent={CHART_COLORS.revenue}
              />
            </Col>
            <Col xs={24} sm={12} xl={6}>
              <StatTile
                label={t('reports.grossProfit')}
                value={<span style={{ color: report.grossProfit < 0 ? '#DC2626' : undefined }}>{formatUsd(report.grossProfit)}</span>}
                hint={margin !== null ? t('reports.marginHint', { percent: margin }) : '—'}
                accent={CHART_COLORS.profit}
              />
            </Col>
            <Col xs={24} sm={12} xl={6}>
              <StatTile
                label={t('reports.completedTrips')}
                value={report.completedTrips}
                hint={t('reports.tripsHint', { bookings: report.completedBookings, horses: report.horsesDelivered })}
                accent={CHART_COLORS.primary}
              />
            </Col>
            <Col xs={24} sm={12} xl={6}>
              <StatTile
                label={t('reports.totalIncidents')}
                value={report.totalIncidents}
                hint={t('reports.incidentCostHint', { cost: formatUsd(report.incidentAdditionalCost) })}
                accent={CHART_COLORS.critical}
              />
            </Col>

            {/* Doanh thu / chi phí / lợi nhuận theo tháng (cùng đơn vị USD, một trục) */}
            <Col xs={24} xl={16}>
              <Card
                title={t('reports.financeTrend')}
                extra={<Text type="secondary">{t('reports.lastMonths', { count: TREND_MONTHS })}</Text>}
                style={{ height: '100%', borderRadius: 12 }}
              >
                <ChartLegend
                  items={[
                    { label: t('reports.revenue'), color: CHART_COLORS.revenue },
                    { label: t('reports.operatingCost'), color: CHART_COLORS.cost },
                    { label: t('reports.grossProfit'), color: CHART_COLORS.profit, line: true },
                  ]}
                />
                <Spin spinning={monthlyLoading}>
                  <GroupedBarLineChart
                    data={financeSeries}
                    bars={[
                      { key: 'revenue', label: t('reports.revenue'), color: CHART_COLORS.revenue },
                      { key: 'cost', label: t('reports.operatingCost'), color: CHART_COLORS.cost },
                    ]}
                    line={{ key: 'profit', label: t('reports.grossProfit'), color: CHART_COLORS.profit }}
                    formatValue={formatUsd}
                    formatAxis={(v) => `$${compactNumber(v)}`}
                    height={290}
                  />
                </Spin>
              </Card>
            </Col>

            {/* Hiệu suất: tỉ lệ đúng giờ, KPI trung bình, trễ trung bình */}
            <Col xs={24} xl={8}>
              <Card title={t('reports.performance')} style={{ height: '100%', borderRadius: 12 }}>
                <Flex justify="space-around" wrap="wrap" gap={16}>
                  <Flex vertical align="center" gap={6}>
                    <Progress
                      type="dashboard"
                      percent={Math.round(Number(report.onTimeRate) || 0)}
                      strokeColor={CHART_COLORS.good}
                      size={130}
                    />
                    <Text type="secondary">{t('reports.onTimeRate')}</Text>
                  </Flex>
                  <Flex vertical align="center" gap={6}>
                    <Progress
                      type="dashboard"
                      percent={Math.round(Number(report.averageKpiScore) || 0)}
                      format={(p) => p}
                      strokeColor={CHART_COLORS.primary}
                      size={130}
                    />
                    <Text type="secondary">{t('reports.averageKpi')}</Text>
                  </Flex>
                </Flex>
                <div style={{ textAlign: 'center', marginTop: 18, paddingTop: 14, borderTop: '1px solid #f0efec' }}>
                  <Text type="secondary">{t('reports.averageDelay')}: </Text>
                  <Text strong>{t('reports.minutes', { count: Math.round(report.averageDelayMinutes) })}</Text>
                </div>
              </Card>
            </Col>

            {/* Chuyến hoàn thành theo tháng */}
            <Col xs={24} lg={8}>
              <Card
                title={t('reports.tripsTrend')}
                extra={<Text type="secondary">{t('reports.lastMonths', { count: TREND_MONTHS })}</Text>}
                style={{ height: '100%', borderRadius: 12 }}
              >
                <Spin spinning={monthlyLoading}>
                  <SimpleBarChart
                    data={tripSeries}
                    color={CHART_COLORS.primary}
                    seriesLabel={t('reports.completedTrips')}
                    formatValue={(v) => String(v)}
                    height={230}
                  />
                </Spin>
              </Card>
            </Col>

            {/* Đúng giờ / trễ theo nguyên nhân (màu trạng thái, luôn kèm nhãn + số) */}
            <Col xs={24} lg={8}>
              <Card title={t('reports.punctuality')} style={{ height: '100%', borderRadius: 12 }}>
                <DonutChart
                  centerValue={`${Math.round(Number(report.onTimeRate) || 0)}%`}
                  centerLabel={t('reports.onTimeShort')}
                  segments={[
                    { key: 'OnTime', label: t('tripClose.onTimeStatus.OnTime'), value: report.onTimeTrips, color: CHART_COLORS.good },
                    {
                      key: 'Delayed_AcceptableForceMajeure',
                      label: t('tripClose.onTimeStatus.Delayed_AcceptableForceMajeure'),
                      value: report.delayedForceMajeureTrips,
                      color: CHART_COLORS.warning,
                    },
                    {
                      key: 'Delayed_OperationalFault',
                      label: t('tripClose.onTimeStatus.Delayed_OperationalFault'),
                      value: report.delayedOperationalFaultTrips,
                      color: CHART_COLORS.critical,
                    },
                  ]}
                />
              </Card>
            </Col>

            {/* Sự cố theo loại, nhiều nhất trước */}
            <Col xs={24} lg={8}>
              <Card title={t('reports.incidentsByType')} style={{ height: '100%', borderRadius: 12 }}>
                <HorizontalBarList
                  color={CHART_COLORS.cost}
                  emptyText={t('incidents.none')}
                  items={(report.incidentsByType || []).map((i) => ({
                    key: i.incidentType,
                    label: t(`incidents.type.${i.incidentType}`, i.incidentType),
                    value: i.count,
                  }))}
                />
              </Card>
            </Col>
          </Row>
        </Spin>
      )}
    </div>
  );
}
