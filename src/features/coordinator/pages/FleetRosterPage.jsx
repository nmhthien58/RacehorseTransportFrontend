import { useState, useEffect } from 'react';
import {
  Button,
  Card,
  Col,
  Flex,
  Modal,
  Row,
  Space,
  Table,
  Tag,
  Typography,
  message,
  Select,
} from 'antd';
import {
  CarOutlined,
  RocketOutlined,
  UserOutlined,
  CheckCircleOutlined,
  ClockCircleOutlined,
  WarningOutlined,
  ArrowLeftOutlined,
} from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import { ROUTES } from '@routes/routes';
import {
  getStoredFleet,
  getStoredPersonnel,
  getStoredRoutePlans,
  updateStoredRoutePlan,
} from '@utils/routePlanStorage';

const { Title, Text } = Typography;

/**
 * Trang Fleet Inventory & Personnel Roster khớp 100% Figma Image 4
 */
export default function FleetRosterPage() {
  const navigate = useNavigate();
  const [fleet, setFleet] = useState([]);
  const [personnel, setPersonnel] = useState([]);
  const [assignModalOpen, setAssignModalOpen] = useState(false);
  const [selectedPlanForAssign, setSelectedPlanForAssign] = useState('PLN-8821');
  const [selectedVehicleForAssign, setSelectedVehicleForAssign] = useState('ST-04');

  useEffect(() => {
    setFleet(getStoredFleet());
    setPersonnel(getStoredPersonnel());
  }, []);

  const handleConfirmAssignVehicle = () => {
    updateStoredRoutePlan(selectedPlanForAssign, {
      vehicleId: selectedVehicleForAssign,
      status: 'PENDING_APPROVAL',
      managerNotes: 'Updated vehicle assignment. Waiting for review.',
    });
    message.success(`Đã phân bổ phương tiện cho ${selectedPlanForAssign}!`);
    setAssignModalOpen(false);
  };

  const fleetColumns = [
    {
      title: 'EQUIPMENT / UNIT',
      key: 'name',
      render: (_, record) => (
        <div>
          <strong style={{ fontSize: 14, color: '#0F172A' }}>
            {record.type.includes('Air') ? '✈️ ' : '🚛 '}
            {record.name}
          </strong>
          <div style={{ fontSize: 12, color: '#64748B' }}>{record.type}</div>
        </div>
      ),
    },
    {
      title: 'CAPACITY',
      dataIndex: 'capacity',
      key: 'capacity',
      render: (cap) => <Tag color="blue">{cap}</Tag>,
    },
    {
      title: 'CLIMATE CONTROL & SPECS',
      dataIndex: 'specs',
      key: 'specs',
      render: (specs) => <span style={{ fontSize: 12.5, color: '#475569' }}>{specs}</span>,
    },
    {
      title: 'LOCATION / HUB',
      dataIndex: 'location',
      key: 'location',
      render: (loc) => <span style={{ fontSize: 12.5, fontWeight: 600 }}>{loc}</span>,
    },
    {
      title: 'STATUS',
      dataIndex: 'status',
      key: 'status',
      render: (status, record) => (
        <Tag
          color={
            status === 'AVAILABLE'
              ? 'green'
              : status === 'BOOKED'
              ? 'blue'
              : 'orange'
          }
          style={{ fontWeight: 700, borderRadius: 6 }}
        >
          {status}
        </Tag>
      ),
    },
    {
      title: 'ACTION',
      key: 'action',
      render: (_, record) => (
        <Button
          type="primary"
          size="small"
          onClick={() => {
            setSelectedVehicleForAssign(record.id);
            setAssignModalOpen(true);
          }}
          disabled={record.status !== 'AVAILABLE'}
          style={{
            backgroundColor: record.status === 'AVAILABLE' ? '#F59E0B' : undefined,
            borderColor: record.status === 'AVAILABLE' ? '#F59E0B' : undefined,
            color: record.status === 'AVAILABLE' ? '#0F172A' : undefined,
            fontWeight: 700,
            borderRadius: 6,
          }}
        >
          Assign to Plan
        </Button>
      ),
    },
  ];

  const personnelColumns = [
    {
      title: 'STAFF MEMBER',
      key: 'name',
      render: (_, record) => (
        <Flex align="center" gap={10}>
          <div style={{ fontSize: 24 }}>{record.avatar}</div>
          <div>
            <strong style={{ fontSize: 14, color: '#0F172A' }}>{record.name}</strong>
            <div style={{ fontSize: 12, color: '#64748B' }}>{record.license}</div>
          </div>
        </Flex>
      ),
    },
    {
      title: 'ROLE',
      dataIndex: 'role',
      key: 'role',
      render: (role) => (
        <Tag color={role.includes('Vet') ? 'cyan' : 'purple'} style={{ fontWeight: 600 }}>
          {role}
        </Tag>
      ),
    },
    {
      title: 'EXPERIENCE',
      dataIndex: 'experience',
      key: 'experience',
      render: (exp) => <span style={{ fontSize: 12.5, color: '#475569' }}>{exp}</span>,
    },
    {
      title: 'DUTY STATUS',
      dataIndex: 'dutyToday',
      key: 'dutyToday',
      render: (duty, record) => (
        <span
          style={{
            fontSize: 12.5,
            fontWeight: 600,
            color: record.status === 'CONFLICT' ? '#DC2626' : record.status === 'AVAILABLE' ? '#16A34A' : '#2563EB',
          }}
        >
          {duty}
        </span>
      ),
    },
    {
      title: 'STATUS',
      dataIndex: 'status',
      key: 'status',
      render: (status) => (
        <Tag
          color={status === 'AVAILABLE' ? 'green' : status === 'ASSIGNED' ? 'blue' : 'red'}
          style={{ fontWeight: 800, borderRadius: 6 }}
        >
          {status}
        </Tag>
      ),
    },
  ];

  return (
    <div style={{ maxWidth: 1280, margin: '0 auto', paddingBottom: 40 }}>
      <Flex align="center" gap={12} style={{ marginBottom: 20 }}>
        <Button
          icon={<ArrowLeftOutlined />}
          onClick={() => navigate(ROUTES.COORDINATOR_DASHBOARD)}
          style={{ borderRadius: 8 }}
        >
          Operations Hub
        </Button>
        <div>
          <Title level={2} style={{ margin: 0, fontWeight: 800, color: '#0F172A', fontSize: 26 }}>
            Fleet Inventory & Personnel Roster
          </Title>
          <Text style={{ color: '#64748B', fontSize: 13 }}>
            Check vehicle specs & availability, slot heavy equipment, track driver schedules & resting compliance
          </Text>
        </div>
      </Flex>

      {/* SECTION 1: SPECIALIZED EQUINE VANS & STALL CONTAINERS */}
      <Card
        bordered
        style={{ borderRadius: 18, border: '1px solid #E2E8F0', marginBottom: 24 }}
        styles={{ body: { padding: '22px' } }}
      >
        <Flex justify="space-between" align="center" style={{ marginBottom: 16 }}>
          <div>
            <Title level={4} style={{ margin: 0, fontWeight: 800, color: '#0F172A' }}>
              Specialized Equine Fleet & Stall Containers
            </Title>
            <Text style={{ fontSize: 12.5, color: '#64748B' }}>
              Dedicated equine trailers, climate-controlled vans and IATA certified air boxes
            </Text>
          </div>
          <Space>
            <Tag color="green" style={{ fontWeight: 700 }}>4 Available</Tag>
            <Tag color="blue" style={{ fontWeight: 700 }}>1 Booked</Tag>
            <Tag color="orange" style={{ fontWeight: 700 }}>1 Maintenance</Tag>
          </Space>
        </Flex>

        <Table
          columns={fleetColumns}
          dataSource={fleet}
          rowKey="id"
          pagination={false}
          size="middle"
        />
      </Card>

      {/* SECTION 2: PERSONNEL ROSTER & 7-DAY DUTY TIMELINE */}
      <Card
        bordered
        style={{ borderRadius: 18, border: '1px solid #E2E8F0' }}
        styles={{ body: { padding: '22px' } }}
      >
        <Flex justify="space-between" align="center" style={{ marginBottom: 16 }}>
          <div>
            <Title level={4} style={{ margin: 0, fontWeight: 800, color: '#0F172A' }}>
              Personnel Roster & Duty Compliance
            </Title>
            <Text style={{ fontSize: 12.5, color: '#64748B' }}>
              Drivers, handlers and veterinary flight escorts with 24-hr rest verification
            </Text>
          </div>
        </Flex>

        <Table
          columns={personnelColumns}
          dataSource={personnel}
          rowKey="id"
          pagination={false}
          size="middle"
        />
      </Card>

      {/* MODAL ASSIGN VEHICLE TO PLAN */}
      <Modal
        open={assignModalOpen}
        onCancel={() => setAssignModalOpen(false)}
        onOk={handleConfirmAssignVehicle}
        title="Assign Vehicle to Route Plan"
        okText="Confirm Assign"
        cancelText="Cancel"
        okButtonProps={{ style: { backgroundColor: '#F59E0B', borderColor: '#F59E0B', color: '#0F172A', fontWeight: 700 } }}
      >
        <div style={{ padding: '12px 0' }}>
          <div style={{ marginBottom: 14 }}>
            <label style={{ fontWeight: 700, display: 'block', marginBottom: 6 }}>
              Select Target Plan:
            </label>
            <Select
              value={selectedPlanForAssign}
              onChange={setSelectedPlanForAssign}
              style={{ width: '100%' }}
              options={[
                { value: 'PLN-8821', label: '#PLN-8821 • SGN → CDG (Sheikh Al-Mansoor)' },
                { value: 'PLN-8834', label: '#PLN-8834 • Cu Chi → Bangkok (Saigon Polo)' },
                { value: 'PLN-8809', label: '#PLN-8809 • Da Nang → Lam Dong' },
              ]}
            />
          </div>
          <div style={{ backgroundColor: '#F8FAFC', padding: '10px 14px', borderRadius: 8, fontSize: 12 }}>
            Phân bổ phương tiện này sẽ cập nhật lộ trình và tự động kích hoạt thông báo tới đội ngũ điều phối.
          </div>
        </div>
      </Modal>
    </div>
  );
}
