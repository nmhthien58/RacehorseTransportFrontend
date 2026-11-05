import { useCallback, useEffect, useState } from 'react';
import {
  Alert,
  Button,
  Card,
  Col,
  Form,
  Input,
  Modal,
  Popconfirm,
  Row,
  Select,
  Space,
  Table,
  Tag,
  Tooltip,
  Typography,
  message,
} from 'antd';
import {
  LockOutlined,
  MailOutlined,
  PhoneOutlined,
  PlusOutlined,
  ReloadOutlined,
  SearchOutlined,
  TeamOutlined,
  UnlockOutlined,
} from '@ant-design/icons';
import { useTranslation } from 'react-i18next';
import { useAuthStore } from '@features/auth/store/authStore';
import { userService } from '@services/userService';
import { getErrorMessage, unwrapData, unwrapList } from '@utils/apiHelpers';

const { Title, Text } = Typography;

const PAGE_SIZE = 10;

// Khớp UserRoles ở backend
const ROLE_META = {
  Admin: { color: 'red', label: 'Admin' },
  LogisticsManager: { color: 'gold', label: 'Logistics Manager' },
  TransportSpecialist: { color: 'purple', label: 'Transport Specialist' },
  FleetCoordinator: { color: 'cyan', label: 'Fleet Coordinator' },
  DriverEscort: { color: 'green', label: 'Driver / Escort' },
  Customer: { color: 'blue', label: 'Customer' },
};

// Backend chặn tạo Customer qua POST /api/users (khách tự đăng ký)
const STAFF_ROLES = [
  'LogisticsManager',
  'TransportSpecialist',
  'FleetCoordinator',
  'DriverEscort',
  'Admin',
];

/**
 * Trang quản lý tài khoản (Admin): GET /api/users, POST /api/users, PATCH /api/users/{id}/active.
 */
export default function UserManagementPage() {
  const { t } = useTranslation();
  const { user: currentUser } = useAuthStore();
  const [users, setUsers] = useState([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState(null);
  const [page, setPage] = useState(1);
  const [searchInput, setSearchInput] = useState('');
  const [search, setSearch] = useState('');
  const [role, setRole] = useState();
  const [isActive, setIsActive] = useState();
  const [togglingId, setTogglingId] = useState(null);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [creating, setCreating] = useState(false);
  const [form] = Form.useForm();

  const roleLabel = (value) => t(`userAdmin.role.${value}`, ROLE_META[value]?.label || value);

  const [reloadKey, setReloadKey] = useState(0);

  // Mọi thay đổi bộ lọc / trang đều đi qua đây để bật loading trước khi effect gọi API
  const load = useCallback(() => {
    setLoading(true);
    setReloadKey((k) => k + 1);
  }, []);

  useEffect(() => {
    let active = true;
    userService
      .getUsers({ page, size: PAGE_SIZE, search: search || undefined, role, isActive })
      .then((res) => {
        if (!active) return;
        const list = unwrapList(res);
        setUsers(list);
        setTotal(res?.pagination?.totalItems ?? list.length);
        setLoadError(null);
      })
      .catch((err) => {
        if (!active) return;
        setUsers([]);
        setTotal(0);
        setLoadError(
          err?.response?.status === 403
            ? t('userAdmin.forbidden', 'Chỉ tài khoản Admin mới xem được danh sách người dùng.')
            : getErrorMessage(
                err,
                t('userAdmin.loadFailed', 'Không tải được danh sách người dùng'),
              ),
        );
      })
      .finally(() => active && setLoading(false));
    return () => {
      active = false;
    };
  }, [page, search, role, isActive, reloadKey, t]);

  const isSelf = (record) => String(currentUser?.userId) === String(record.userId);

  const handleToggleActive = async (record) => {
    setTogglingId(record.userId);
    try {
      await userService.setUserActive(record.userId, !record.isActive);
      message.success(
        record.isActive
          ? t('userAdmin.locked', 'Đã khóa tài khoản {{name}}', { name: record.fullName })
          : t('userAdmin.unlocked', 'Đã mở khóa tài khoản {{name}}', { name: record.fullName }),
      );
      load();
    } catch (err) {
      message.error(
        getErrorMessage(err, t('userAdmin.toggleFailed', 'Không đổi được trạng thái tài khoản')),
      );
    } finally {
      setTogglingId(null);
    }
  };

  const handleCreate = async (values) => {
    setCreating(true);
    try {
      const res = await userService.createUser({
        fullName: values.fullName.trim(),
        email: values.email.trim(),
        password: values.password,
        phoneNumber: values.phoneNumber?.trim() || undefined,
        role: values.role,
      });
      const created = unwrapData(res);
      message.success(
        t('userAdmin.created', 'Đã tạo tài khoản {{email}}', {
          email: created?.email || values.email,
        }),
      );
      setIsAddModalOpen(false);
      form.resetFields();
      load();
    } catch (err) {
      message.error(getErrorMessage(err, t('userAdmin.createFailed', 'Không tạo được tài khoản')));
    } finally {
      setCreating(false);
    }
  };

  const columns = [
    {
      title: t('userAdmin.col.name', 'Họ và tên'),
      key: 'name',
      render: (_, record) => (
        <div>
          <div style={{ fontWeight: 700, color: '#0F172A', fontSize: 13.5 }}>
            {record.fullName}
            {isSelf(record) && (
              <Tag color="processing" style={{ marginLeft: 6, fontSize: 11, borderRadius: 4 }}>
                {t('userAdmin.you', 'Bạn')}
              </Tag>
            )}
          </div>
          <div style={{ fontSize: 11.5, color: '#64748B' }}>ID: #{record.userId}</div>
        </div>
      ),
    },
    {
      title: t('userAdmin.col.contact', 'Email & liên hệ'),
      key: 'contact',
      render: (_, record) => (
        <div>
          <div
            style={{
              fontSize: 12.5,
              color: '#334155',
              display: 'flex',
              alignItems: 'center',
              gap: 6,
            }}
          >
            <MailOutlined style={{ color: '#94A3B8' }} />
            <span>{record.email}</span>
          </div>
          <div
            style={{
              fontSize: 12,
              color: '#64748B',
              display: 'flex',
              alignItems: 'center',
              gap: 6,
              marginTop: 2,
            }}
          >
            <PhoneOutlined style={{ color: '#94A3B8' }} />
            <span>{record.phoneNumber || '—'}</span>
          </div>
        </div>
      ),
    },
    {
      title: t('userAdmin.col.role', 'Vai trò'),
      dataIndex: 'role',
      key: 'role',
      render: (value) => (
        <Tag
          color={ROLE_META[value]?.color || 'default'}
          style={{ fontWeight: 600, borderRadius: 6 }}
        >
          {roleLabel(value)}
        </Tag>
      ),
    },
    {
      title: t('userAdmin.col.createdAt', 'Ngày tạo'),
      dataIndex: 'createdAt',
      key: 'createdAt',
      render: (value) => (
        <span style={{ fontSize: 12.5, color: '#475569' }}>
          {value ? new Date(value).toLocaleDateString('vi-VN') : '—'}
        </span>
      ),
    },
    {
      title: t('userAdmin.col.status', 'Trạng thái'),
      dataIndex: 'isActive',
      key: 'isActive',
      render: (active) => (
        <Tag color={active ? 'success' : 'default'} style={{ borderRadius: 4, fontWeight: 600 }}>
          {active ? t('userAdmin.active', 'Hoạt động') : t('userAdmin.inactive', 'Đã khóa')}
        </Tag>
      ),
    },
    {
      title: t('userAdmin.col.action', 'Thao tác'),
      key: 'action',
      align: 'center',
      width: 130,
      render: (_, record) => {
        if (isSelf(record)) {
          return (
            <Tooltip
              title={t('userAdmin.cannotLockSelf', 'Không thể khóa tài khoản đang đăng nhập')}
            >
              <Button size="small" disabled icon={<LockOutlined />}>
                {t('userAdmin.lock', 'Khóa')}
              </Button>
            </Tooltip>
          );
        }
        return (
          <Popconfirm
            title={
              record.isActive
                ? t('userAdmin.confirmLock', 'Khóa tài khoản này?')
                : t('userAdmin.confirmUnlock', 'Mở khóa tài khoản này?')
            }
            description={`${record.fullName} (${record.email})`}
            onConfirm={() => handleToggleActive(record)}
            okText={t('common.confirm', 'Xác nhận')}
            cancelText={t('common.cancel', 'Hủy')}
            okButtonProps={{ danger: record.isActive }}
          >
            <Button
              size="small"
              danger={record.isActive}
              loading={togglingId === record.userId}
              icon={record.isActive ? <LockOutlined /> : <UnlockOutlined />}
              style={{ borderRadius: 6, fontSize: 12 }}
            >
              {record.isActive ? t('userAdmin.lock', 'Khóa') : t('userAdmin.unlock', 'Mở khóa')}
            </Button>
          </Popconfirm>
        );
      },
    },
  ];

  return (
    <div style={{ padding: '0 0 24px 0' }}>
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
            {t('userAdmin.title', 'Quản lý người dùng & phân quyền')}
          </Title>
          <Text type="secondary" style={{ fontSize: 13, color: '#64748B' }}>
            {t(
              'userAdmin.subtitle',
              'Danh sách tài khoản, tạo tài khoản nhân viên và khóa / mở khóa tài khoản',
            )}
          </Text>
        </div>
        <Space>
          <Button icon={<ReloadOutlined />} onClick={load} loading={loading}>
            {t('userAdmin.reload', 'Tải lại')}
          </Button>
          <Button type="primary" icon={<PlusOutlined />} onClick={() => setIsAddModalOpen(true)}>
            {t('userAdmin.addStaff', 'Thêm nhân viên')}
          </Button>
        </Space>
      </div>

      <Card
        bordered
        style={{ borderRadius: 14, border: '1px solid #E2E8F0' }}
        styles={{ body: { padding: 20 } }}
      >
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            flexWrap: 'wrap',
            gap: 12,
            marginBottom: 16,
          }}
        >
          <Space wrap>
            <Input.Search
              prefix={<SearchOutlined style={{ color: '#94A3B8' }} />}
              placeholder={t('userAdmin.searchPlaceholder', 'Tìm theo tên, email...')}
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              onSearch={(value) => {
                setLoading(true);
                setPage(1);
                setSearch(value.trim());
              }}
              style={{ width: 280 }}
              allowClear
            />
            <Select
              value={role}
              onChange={(value) => {
                setLoading(true);
                setPage(1);
                setRole(value);
              }}
              allowClear
              placeholder={t('userAdmin.allRoles', 'Tất cả vai trò')}
              style={{ width: 200 }}
              options={Object.keys(ROLE_META).map((value) => ({ value, label: roleLabel(value) }))}
            />
            <Select
              value={isActive}
              onChange={(value) => {
                setLoading(true);
                setPage(1);
                setIsActive(value);
              }}
              allowClear
              placeholder={t('userAdmin.allStatuses', 'Tất cả trạng thái')}
              style={{ width: 170 }}
              options={[
                { value: true, label: t('userAdmin.active', 'Hoạt động') },
                { value: false, label: t('userAdmin.inactive', 'Đã khóa') },
              ]}
            />
          </Space>
          <Text type="secondary" style={{ fontSize: 12.5 }}>
            {t('userAdmin.totalCount', 'Tổng {{count}} tài khoản', { count: total })}
          </Text>
        </div>

        {loadError && (
          <Alert type="error" showIcon message={loadError} style={{ marginBottom: 12 }} />
        )}

        <Table
          dataSource={users}
          columns={columns}
          rowKey="userId"
          loading={loading}
          scroll={{ x: 'max-content' }}
          pagination={{
            current: page,
            pageSize: PAGE_SIZE,
            total,
            showSizeChanger: false,
            onChange: (p) => {
              setLoading(true);
              setPage(p);
            },
          }}
        />
      </Card>

      <Modal
        title={t('userAdmin.addTitle', 'Tạo tài khoản nhân viên')}
        open={isAddModalOpen}
        onCancel={() => setIsAddModalOpen(false)}
        footer={null}
        destroyOnClose
      >
        <Form
          form={form}
          layout="vertical"
          onFinish={handleCreate}
          initialValues={{ role: 'DriverEscort' }}
          style={{ marginTop: 16 }}
        >
          <Form.Item
            label={t('userAdmin.col.name', 'Họ và tên')}
            name="fullName"
            rules={[
              {
                required: true,
                whitespace: true,
                message: t('userAdmin.nameRequired', 'Vui lòng nhập họ tên'),
              },
              { max: 100 },
            ]}
          >
            <Input />
          </Form.Item>
          <Row gutter={16}>
            <Col xs={24} sm={12}>
              <Form.Item
                label="Email"
                name="email"
                rules={[
                  { required: true, message: t('userAdmin.emailRequired', 'Vui lòng nhập email') },
                  {
                    type: 'email',
                    message: t('userAdmin.emailInvalid', 'Email không đúng định dạng'),
                  },
                ]}
              >
                <Input />
              </Form.Item>
            </Col>
            <Col xs={24} sm={12}>
              <Form.Item
                label={t('userAdmin.phone', 'Số điện thoại')}
                name="phoneNumber"
                rules={[
                  {
                    pattern: /^\+?[0-9 ().-]{6,30}$/,
                    message: t('userAdmin.phoneInvalid', 'Số điện thoại không hợp lệ'),
                  },
                ]}
              >
                <Input />
              </Form.Item>
            </Col>
          </Row>
          <Form.Item
            label={t('userAdmin.password', 'Mật khẩu ban đầu')}
            name="password"
            rules={[
              {
                required: true,
                message: t('userAdmin.passwordRequired', 'Vui lòng nhập mật khẩu'),
              },
              {
                min: 8,
                max: 64,
                message: t('userAdmin.passwordLength', 'Mật khẩu dài 8–64 ký tự'),
              },
            ]}
          >
            <Input.Password autoComplete="new-password" />
          </Form.Item>
          <Form.Item
            label={t('userAdmin.col.role', 'Vai trò')}
            name="role"
            rules={[{ required: true }]}
            extra={t('userAdmin.customerNote', 'Khách hàng tự đăng ký tài khoản, không tạo ở đây.')}
          >
            <Select options={STAFF_ROLES.map((value) => ({ value, label: roleLabel(value) }))} />
          </Form.Item>
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8, marginTop: 20 }}>
            <Button onClick={() => setIsAddModalOpen(false)}>{t('common.cancel', 'Hủy')}</Button>
            <Button type="primary" htmlType="submit" loading={creating}>
              {t('userAdmin.createSubmit', 'Tạo tài khoản')}
            </Button>
          </div>
        </Form>
      </Modal>
    </div>
  );
}
