import { Card, Col, Row, Statistic } from 'antd';

export default function ManagerDashboard() {
  return (
    <div>
      <h1>👔 Manager Dashboard</h1>
      <Row gutter={16} style={{ marginTop: 20 }}>
        <Col span={6}>
          <Card>
            <Statistic title="Pending" value={8} />
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <Statistic title="Approved Today" value={3} />
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <Statistic title="Assigned" value={12} />
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <Statistic title="Rejected" value={5} />
          </Card>
        </Col>
      </Row>
    </div>
  );
}
