import { useState, useEffect, useMemo } from 'react';
import {
  Card,
  Table,
  Tag,
  Button,
  Input,
  Select,
  Space,
  Typography,
  Popconfirm,
  message,
  Modal,
  Form,
  Row,
  Col,
  Tooltip,
} from 'antd';
import {
  UserOutlined,
  SearchOutlined,
  DeleteOutlined,
  PlusOutlined,
  TeamOutlined,
  SafetyCertificateOutlined,
  CarOutlined,
  MailOutlined,
  PhoneOutlined,
} from '@ant-design/icons';
import { useAuthStore } from '@features/auth/store/authStore';
import { getStoredUsers, deleteStoredUser, addStoredUser } from '@utils/userStorage';
import { ROLES } from '@utils/constants';

const { Title, Text } = Typography;

export default function UserManagementPage() {
  const { user: currentUser } = useAuthStore();
  const [users, setUsers] = useState(() => getStoredUsers());
  const [searchKeyword, setSearchKeyword] = useState('');
  const [filterRole, setFilterRole] = useState('ALL');
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [form] = Form.useForm();

  useEffect(() => {
    const handleUsersUpdate = () => {
      setUsers(getStoredUsers());
    };
    window.addEventListener('users_updated', handleUsersUpdate);
    return () => window.removeEventListener('users_updated', handleUsersUpdate);
  }, []);

  const handleDelete = (targetUser) => {
    if (
      String(currentUser?.userId) === String(targetUser.userId) ||
      currentUser?.email === targetUser.email
    ) {
      message.error('Không thể tự xóa tài khoản đang đăng nhập!');
      return;
    }

    const res = deleteStoredUser(targetUser.userId);
    if (res.success) {
      setUsers(getStoredUsers());
      message.success(`Đã xóa tài khoản "${targetUser.fullName}" thành công!`);
    } else {
      message.error(res.message || 'Không thể xóa người dùng');
    }
  };

  const handleAddUser = (values) => {
    const created = addStoredUser(values);
    setUsers(getStoredUsers());
    setIsAddModalOpen(false);
    form.resetFields();
    message.success(`Đã tạo tài khoản "${created.fullName}" (${created.email}) thành công!`);
  };

  const roleMeta = (role) => {
    switch (role) {
      case ROLES.ADMIN:
      case ROLES.MANAGER:
      case 'LogisticsManager':
        return { color: 'gold', text: 'Logistics Manager (Admin)', icon: <SafetyCertificateOutlined /> };
      case ROLES.SPECIALIST:
      case 'TransportSpecialist':
        return { color: 'purple', text: 'Transport Specialist', icon: <SafetyCertificateOutlined /> };
      case ROLES.COORDINATOR:
      case 'FleetCoordinator':
        return { color: 'cyan', text: 'Fleet & Route Coordinator', icon: <CarOutlined /> };
      case ROLES.DRIVER:
      case 'Driver':
        return { color: 'green', text: 'Driver (Tài xế)', icon: <CarOutlined /> };
      case ROLES.ESCORT:
      case 'Escort':
        return { color: 'magenta', text: 'Veterinary Escort (Áp tải)', icon: <UserOutlined /> };
      case ROLES.CUSTOMER:
      case 'Customer':
      default:
        return { color: 'blue', text: 'Customer (Khách hàng)', icon: <UserOutlined /> };
    }
  };

  const filteredUsers = useMemo(() => {
    return users.filter((u) => {
      if (filterRole !== 'ALL' && u.role !== filterRole) return false;
      if (!searchKeyword.trim()) return true;
      const kw = searchKeyword.toLowerCase();
      const name = String(u.fullName || '').toLowerCase();
      const email = String(u.email || '').toLowerCase();
      const phone = String(u.phoneNumber || '').toLowerCase();
      const dept = String(u.department || '').toLowerCase();
      return name.includes(kw) || email.includes(kw) || phone.includes(kw) || dept.includes(kw);
    });
  }, [users, filterRole, searchKeyword]);

  const stats = useMemo(() => {
    return {
      total: users.length,
      managers: users.filter((u) => u.role === 'LogisticsManager' || u.role === 'Admin').length,
      specialists: users.filter((u) => u.role === 'TransportSpecialist').length,
      coordinators: users.filter((u) => u.role === 'FleetCoordinator').length,
      crew: users.filter((u) => u.role === 'Driver' || u.role === 'Escort').length,
      customers: users.filter((u) => u.role === 'Customer').length,
    };
  }, [users]);

  const columns = [
    {
      title: 'Họ và tên',
      key: 'name',
      render: (_, record) => {
        const isSelf =
          String(currentUser?.userId) === String(record.userId) || currentUser?.email === record.email;
        return (
          <Space>
            <div
              style={{
                width: 36,
                height: 36,
                borderRadius: '50%',
                backgroundColor: '#EFF6FF',
                color: '#2563EB',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontWeight: 700,
                fontSize: 14,
              }}
            >
              {record.fullName?.charAt(0) || 'U'}
            </div>
            <div>
              <div style={{ fontWeight: 700, color: '#0F172A', fontSize: 13.5 }}>
                {record.fullName}
                {isSelf && (
                  <Tag color="processing" style={{ marginLeft: 6, fontSize: 11, borderRadius: 4 }}>
                    Bạn
                  </Tag>
                )}
              </div>
              <div style={{ fontSize: 11.5, color: '#64748B' }}>
                ID: #{record.userId} {record.staffId ? `• ${record.staffId}` : ''}
              </div>
            </div>
          </Space>
        );
      },
    },
    {
      title: 'Email & Liên hệ',
      key: 'contact',
      render: (_, record) => (
        <div>
          <div style={{ fontSize: 12.5, color: '#334155', display: 'flex', alignItems: 'center', gap: 6 }}>
            <MailOutlined style={{ color: '#94A3B8' }} />
            <span>{record.email}</span>
          </div>
          <div style={{ fontSize: 12, color: '#64748B', display: 'flex', alignItems: 'center', gap: 6, marginTop: 2 }}>
            <PhoneOutlined style={{ color: '#94A3B8' }} />
            <span>{record.phoneNumber || '---'}</span>
          </div>
        </div>
      ),
    },
    {
      title: 'Vai trò (Role)',
      dataIndex: 'role',
      key: 'role',
      render: (role) => {
        const meta = roleMeta(role);
        return (
          <Tag color={meta.color} icon={meta.icon} style={{ fontWeight: 600, borderRadius: 6, padding: '3px 8px' }}>
            {meta.text}
          </Tag>
        );
      },
    },
    {
      title: 'Phòng ban / Đơn vị',
      dataIndex: 'department',
      key: 'department',
      render: (dept) => (
        <span style={{ fontSize: 12.5, color: '#475569' }}>
          {dept || 'Thành viên hệ thống'}
        </span>
      ),
    },
    {
      title: 'Trạng thái',
      key: 'status',
      render: (_, record) => (
        <Tag color={record.isActive !== false ? 'success' : 'default'} style={{ borderRadius: 4, fontWeight: 600 }}>
          {record.isActive !== false ? 'Hoạt động' : 'Tạm khóa'}
        </Tag>
      ),
    },
    {
      title: 'Thao tác',
      key: 'action',
      align: 'center',
      width: 110,
      render: (_, record) => {
        const isSelf =
          String(currentUser?.userId) === String(record.userId) || currentUser?.email === record.email;

        if (isSelf) {
          return (
            <Tooltip title="Không thể tự xóa tài khoản của bạn">
              <Button type="text" disabled danger icon={<DeleteOutlined />} size="small" />
            </Tooltip>
          );
        }

        return (
          <Popconfirm
            title="Xác nhận xóa người dùng?"
            description={`Bạn có chắc chắn muốn xóa tài khoản "${record.fullName}" (${record.email}) không?`}
            onConfirm={() => handleDelete(record)}
            okText="Xóa tài khoản"
            cancelText="Hủy"
            okButtonProps={{ danger: true }}
          >
            <Button
              type="primary"
              danger
              size="small"
              icon={<DeleteOutlined />}
              style={{ borderRadius: 6, fontSize: 12 }}
            >
              Xóa
            </Button>
          </Popconfirm>
        );
      },
    },
  ];

  return (
    <div style={{ padding: '0 0 24px 0' }}>
      {/* HEADER SECTION */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: 16,
          marginBottom: 20,
        }}
      >
        <div>
          <Title level={4} style={{ margin: 0, fontWeight: 800, color: '#0F172A' }}>
            <TeamOutlined style={{ marginRight: 8, color: '#2563EB' }} />
            Quản lý người dùng & Phân quyền hệ thống
          </Title>
          <Text type="secondary" style={{ fontSize: 13, color: '#64748B' }}>
            Quản trị danh sách tài khoản toàn diện, phân quyền vai trò và xóa người dùng
          </Text>
        </div>

        <Button
          type="primary"
          icon={<PlusOutlined />}
          style={{
            backgroundColor: '#2563EB',
            borderColor: '#2563EB',
            fontWeight: 600,
            borderRadius: 8,
          }}
          onClick={() => setIsAddModalOpen(true)}
        >
          Thêm người dùng mới
        </Button>
      </div>

      {/* QUICK STATS CARDS */}
      <Row gutter={[16, 16]} style={{ marginBottom: 20 }}>
        <Col xs={12} sm={8} md={4}>
          <Card bordered style={{ borderRadius: 12, border: '1px solid #E2E8F0', textAlign: 'center' }} styles={{ body: { padding: '14px 10px' } }}>
            <Text type="secondary" style={{ fontSize: 11.5, display: 'block' }}>Tổng người dùng</Text>
            <div style={{ fontSize: 22, fontWeight: 800, color: '#0F172A' }}>{stats.total}</div>
          </Card>
        </Col>
        <Col xs={12} sm={8} md={4}>
          <Card bordered style={{ borderRadius: 12, border: '1px solid #FDE68A', backgroundColor: '#FFFDF5', textAlign: 'center' }} styles={{ body: { padding: '14px 10px' } }}>
            <Text style={{ fontSize: 11.5, color: '#B45309', display: 'block' }}>Logistics Manager</Text>
            <div style={{ fontSize: 22, fontWeight: 800, color: '#D97706' }}>{stats.managers}</div>
          </Card>
        </Col>
        <Col xs={12} sm={8} md={4}>
          <Card bordered style={{ borderRadius: 12, border: '1px solid #E9D5FF', backgroundColor: '#FAF5FF', textAlign: 'center' }} styles={{ body: { padding: '14px 10px' } }}>
            <Text style={{ fontSize: 11.5, color: '#7E22CE', display: 'block' }}>Transport Specialist</Text>
            <div style={{ fontSize: 22, fontWeight: 800, color: '#9333EA' }}>{stats.specialists}</div>
          </Card>
        </Col>
        <Col xs={12} sm={8} md={4}>
          <Card bordered style={{ borderRadius: 12, border: '1px solid #A5F3FC', backgroundColor: '#ECFEFF', textAlign: 'center' }} styles={{ body: { padding: '14px 10px' } }}>
            <Text style={{ fontSize: 11.5, color: '#0E7490', display: 'block' }}>Route Coordinator</Text>
            <div style={{ fontSize: 22, fontWeight: 800, color: '#0891B2' }}>{stats.coordinators}</div>
          </Card>
        </Col>
        <Col xs={12} sm={8} md={4}>
          <Card bordered style={{ borderRadius: 12, border: '1px solid #BBF7D0', backgroundColor: '#F0FDF4', textAlign: 'center' }} styles={{ body: { padding: '14px 10px' } }}>
            <Text style={{ fontSize: 11.5, color: '#15803D', display: 'block' }}>Driver & Escort</Text>
            <div style={{ fontSize: 22, fontWeight: 800, color: '#16A34A' }}>{stats.crew}</div>
          </Card>
        </Col>
        <Col xs={12} sm={8} md={4}>
          <Card bordered style={{ borderRadius: 12, border: '1px solid #BFDBFE', backgroundColor: '#EFF6FF', textAlign: 'center' }} styles={{ body: { padding: '14px 10px' } }}>
            <Text style={{ fontSize: 11.5, color: '#1D4ED8', display: 'block' }}>Khách hàng</Text>
            <div style={{ fontSize: 22, fontWeight: 800, color: '#2563EB' }}>{stats.customers}</div>
          </Card>
        </Col>
      </Row>

      {/* FILTER & TABLE */}
      <Card
        bordered
        style={{ borderRadius: 14, border: '1px solid #E2E8F0', boxShadow: '0 1px 3px rgba(0,0,0,0.02)' }}
        styles={{ body: { padding: 20 } }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 12, marginBottom: 16 }}>
          <Space wrap>
            <Input
              prefix={<SearchOutlined style={{ color: '#94A3B8' }} />}
              placeholder="Tìm theo tên, email, số điện thoại..."
              value={searchKeyword}
              onChange={(e) => setSearchKeyword(e.target.value)}
              style={{ width: 280, borderRadius: 8 }}
              allowClear
            />
            <Select
              value={filterRole}
              onChange={setFilterRole}
              style={{ width: 210, borderRadius: 8 }}
              options={[
                { value: 'ALL', label: 'Tất cả vai trò' },
                { value: 'Customer', label: 'Khách hàng (Customer)' },
                { value: 'LogisticsManager', label: 'Logistics Manager' },
                { value: 'TransportSpecialist', label: 'Transport Specialist' },
                { value: 'FleetCoordinator', label: 'Fleet Coordinator' },
                { value: 'Driver', label: 'Driver (Tài xế)' },
                { value: 'Escort', label: 'Veterinary Escort' },
              ]}
            />
          </Space>

          <Text type="secondary" style={{ fontSize: 12.5 }}>
            Hiển thị <strong>{filteredUsers.length}</strong> / {users.length} người dùng
          </Text>
        </div>

        <Table
          dataSource={filteredUsers}
          columns={columns}
          rowKey="userId"
          pagination={{ pageSize: 8, showSizeChanger: false }}
        />
      </Card>

      {/* MODAL THÊM NGƯỜI DÙNG */}
      <Modal
        title={
          <div style={{ fontWeight: 700, color: '#0F172A', fontSize: 16 }}>
            <PlusOutlined style={{ marginRight: 6, color: '#2563EB' }} />
            Thêm tài khoản người dùng mới
          </div>
        }
        open={isAddModalOpen}
        onCancel={() => setIsAddModalOpen(false)}
        footer={null}
        destroyOnClose
      >
        <Form
          form={form}
          layout="vertical"
          onFinish={handleAddUser}
          initialValues={{ role: 'Customer' }}
          style={{ marginTop: 16 }}
        >
          <Form.Item
            label="Họ và tên"
            name="fullName"
            rules={[{ required: true, message: 'Vui lòng nhập họ tên' }]}
          >
            <Input placeholder="e.g. Nguyễn Văn An" />
          </Form.Item>

          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                label="Email đăng nhập"
                name="email"
                rules={[
                  { required: true, message: 'Vui lòng nhập email' },
                  { type: 'email', message: 'Email không đúng định dạng' },
                ]}
              >
                <Input placeholder="e.g. an.nguyen@test.com" />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item label="Số điện thoại" name="phoneNumber">
                <Input placeholder="e.g. +84988111222" />
              </Form.Item>
            </Col>
          </Row>

          <Form.Item
            label="Vai trò (Role)"
            name="role"
            rules={[{ required: true, message: 'Vui lòng chọn vai trò' }]}
          >
            <Select
              options={[
                { value: 'Customer', label: 'Khách hàng (Customer)' },
                { value: 'LogisticsManager', label: 'Logistics Manager (Quản lý)' },
                { value: 'TransportSpecialist', label: 'Transport Specialist (Kiểm dịch)' },
                { value: 'FleetCoordinator', label: 'Fleet & Route Coordinator (Điều phối)' },
                { value: 'Driver', label: 'Driver (Tài xế vận tải)' },
                { value: 'Escort', label: 'Veterinary Escort (Áp tải thú y)' },
              ]}
            />
          </Form.Item>

          <Form.Item label="Phòng ban / Chức vụ" name="department">
            <Input placeholder="e.g. Đội ngũ Tài xế Vận tải Chuyên trách" />
          </Form.Item>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8, marginTop: 20 }}>
            <Button onClick={() => setIsAddModalOpen(false)}>Hủy</Button>
            <Button type="primary" htmlType="submit" style={{ backgroundColor: '#2563EB', borderColor: '#2563EB' }}>
              Tạo tài khoản
            </Button>
          </div>
        </Form>
      </Modal>
    </div>
  );
}
