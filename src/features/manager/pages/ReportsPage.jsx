import { useEffect, useState } from 'react';
import { Card, Row, Col, DatePicker, Table, Typography, Spin, Empty, message } from 'antd';
import { useTranslation } from 'react-i18next';
import PageHeader from '@components/layout/PageHeader';
import reportService from '@services/reportService';
import { unwrapData, getErrorMessage, toIsoString } from '@utils/apiHelpers';
import { formatUsd } from '@utils/incidents';

const { Text } = Typography;
const { RangePicker } = DatePicker;

/**
 * Một ô số liệu: nhãn nhỏ ở trên, giá trị lớn ở dưới.
 * @param {{ label: string, value: React.ReactNode, hint?: string }} props
 */
function Stat({ label, value, hint }) {
  return (
    <div>
      <Text type="secondary" style={{ fontSize: 13 }}>{label}</Text>
      <div style={{ fontSize: 24, fontWeight: 600, color: '#1C1917', lineHeight: 1.3 }}>{value}</div>
      {hint && <Text type="secondary" style={{ fontSize: 12 }}>{hint}</Text>}
    </div>
  );
}

/**
 * Báo cáo tổng hợp cho quản lý (GET /reports/summary): chỉ tính các chuyến đã đóng trong khoảng thời gian chọn.
 * @returns {JSX.Element}
 */
export default function ReportsPage() {
  const { t } = useTranslation();
  const [range, setRange] = useState(null);
  const [report, setReport] = useState(null);
  const [loading, setLoading] = useState(true);

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

  return (
    <div style={{ paddingBottom: 40 }}>
      <PageHeader
        title={t('reports.title')}
        subtitle={t('reports.subtitle')}
        actions={<RangePicker
            value={range}
            onChange={(value) => {
              setLoading(true);
              setRange(value);
            }} format="DD/MM/YYYY" allowClear placeholder={[t('reports.from'), t('reports.to')]} />}
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
            <Col xs={24} lg={12}>
              <Card title={t('reports.operations')} style={{ height: '100%' }}>
                <Row gutter={[16, 20]}>
                  <Col span={8}><Stat label={t('reports.completedTrips')} value={report.completedTrips} /></Col>
                  <Col span={8}><Stat label={t('reports.completedBookings')} value={report.completedBookings} /></Col>
                  <Col span={8}><Stat label={t('reports.horsesDelivered')} value={report.horsesDelivered} /></Col>
                  <Col span={8}><Stat label={t('reports.onTimeRate')} value={`${Number(report.onTimeRate).toFixed(0)}%`} /></Col>
                  <Col span={8}><Stat label={t('reports.averageKpi')} value={Number(report.averageKpiScore).toFixed(1)} /></Col>
                  <Col span={8}>
                    <Stat label={t('reports.averageDelay')} value={t('reports.minutes', { count: Math.round(report.averageDelayMinutes) })} />
                  </Col>
                </Row>
              </Card>
            </Col>
            <Col xs={24} lg={12}>
              <Card title={t('reports.finance', { currency: report.currencyCode })} style={{ height: '100%' }}>
                <Row gutter={[16, 20]}>
                  <Col span={8}><Stat label={t('reports.revenue')} value={formatUsd(report.revenue)} /></Col>
                  <Col span={8}><Stat label={t('reports.operatingCost')} value={formatUsd(report.operatingCost)} /></Col>
                  <Col span={8}>
                    <Stat
                      label={t('reports.grossProfit')}
                      value={<span style={{ color: report.grossProfit < 0 ? '#DC2626' : undefined }}>{formatUsd(report.grossProfit)}</span>}
                    />
                  </Col>
                  <Col span={8}><Stat label={t('reports.totalIncidents')} value={report.totalIncidents} /></Col>
                  <Col span={16}><Stat label={t('reports.incidentCost')} value={formatUsd(report.incidentAdditionalCost)} /></Col>
                </Row>
              </Card>
            </Col>

            <Col xs={24} lg={12}>
              <Card title={t('reports.punctuality')}>
                <Table
                  size="small"
                  pagination={false}
                  rowKey="key"
                  dataSource={[
                    { key: 'OnTime', count: report.onTimeTrips },
                    { key: 'Delayed_AcceptableForceMajeure', count: report.delayedForceMajeureTrips },
                    { key: 'Delayed_OperationalFault', count: report.delayedOperationalFaultTrips },
                  ]}
                  columns={[
                    { title: t('tripClose.onTime'), dataIndex: 'key', render: (v) => t(`tripClose.onTimeStatus.${v}`) },
                    { title: t('reports.trips'), dataIndex: 'count', align: 'right' },
                  ]}
                />
              </Card>
            </Col>
            <Col xs={24} lg={12}>
              <Card title={t('reports.incidentsByType')}>
                <Table
                  size="small"
                  pagination={false}
                  rowKey="incidentType"
                  dataSource={report.incidentsByType || []}
                  locale={{ emptyText: t('incidents.none') }}
                  columns={[
                    { title: t('incidents.fields.type'), dataIndex: 'incidentType', render: (v) => t(`incidents.type.${v}`, v) },
                    { title: t('reports.count'), dataIndex: 'count', align: 'right' },
                  ]}
                />
              </Card>
            </Col>
          </Row>
        </Spin>
      )}
    </div>
  );
}
