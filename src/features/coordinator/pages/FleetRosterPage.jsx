import { useCallback, useEffect, useMemo, useState } from 'react';
import { Alert, Button, Card, Flex, Space, Table, Tag, Typography } from 'antd';
import { ArrowLeftOutlined, ReloadOutlined } from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import dayjs from 'dayjs';
import { ROUTES } from '@routes/routes';
import { assetService } from '@services/assetService';
import { userService } from '@services/userService';
import { getErrorMessage, unwrapList } from '@utils/apiHelpers';

const { Title, Text } = Typography;

// Backend giới hạn size tối đa 100 mỗi trang
const ASSET_PAGE_SIZE = 100;

const STATUS_COLORS = { Available: 'green', InTransit: 'blue', Maintenance: 'orange' };

/**
 * Trang danh mục phương tiện và nhân sự chuyến (Fleet Coordinator), đọc từ
 * GET /api/transport-assets và GET /api/users/staff?role=DriverEscort.
 */
export default function FleetRosterPage() {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const [assets, setAssets] = useState([]);
  const [crew, setCrew] = useState([]);
  const [loading, setLoading] = useState(true);
  const [assetError, setAssetError] = useState(null);
  const [crewError, setCrewError] = useState(null);
  const [reloadKey, setReloadKey] = useState(0);

  const reload = useCallback(() => {
    setLoading(true);
    setReloadKey((k) => k + 1);
  }, []);

  useEffect(() => {
    let active = true;
    Promise.allSettled([
      assetService.getAssets({ page: 1, size: ASSET_PAGE_SIZE }),
      userService.getStaff('DriverEscort'),
    ]).then(([assetRes, crewRes]) => {
      if (!active) return;
      if (assetRes.status === 'fulfilled') {
        setAssets(unwrapList(assetRes.value));
        setAssetError(null);
      } else {
        setAssetError(
          getErrorMessage(
            assetRes.reason,
            t('fleetRoster.loadAssetsFailed', 'Không tải được danh sách phương tiện'),
          ),
        );
      }
      if (crewRes.status === 'fulfilled') {
        setCrew(unwrapList(crewRes.value));
        setCrewError(null);
      } else {
        setCrewError(
          getErrorMessage(
            crewRes.reason,
            t('fleetRoster.loadCrewFailed', 'Không tải được danh sách nhân sự'),
          ),
        );
      }
      setLoading(false);
    });
    return () => {
      active = false;
    };
  }, [reloadKey, t]);

  const counts = useMemo(() => {
    const result = { Available: 0, InTransit: 0, Maintenance: 0 };
    assets.forEach((a) => {
      if (a.status in result) result[a.status] += 1;
    });
    return result;
  }, [assets]);

  const statusLabel = (status) => t(`fleetRoster.status.${status}`, status);
  const typeLabel = (type) => t(`fleetRoster.assetType.${type}`, type);

  const fleetColumns = [
    {
      title: t('fleetRoster.col.unit', 'Phương tiện'),
      key: 'assetCode',
      render: (_, record) => (
        <div>
          <strong style={{ fontSize: 14, color: '#0F172A' }}>
            {record.assetType === 'AirStall' ? '✈️ ' : '🚛 '}
            {record.assetCode}
          </strong>
          <div style={{ fontSize: 12, color: '#64748B' }}>{typeLabel(record.assetType)}</div>
        </div>
      ),
    },
    {
      title: t('fleetRoster.col.capacity', 'Sức chứa'),
      dataIndex: 'capacityHorses',
      key: 'capacityHorses',
      render: (cap) => (
        <Tag color="blue">{t('fleetRoster.horses', '{{count}} ngựa', { count: cap })}</Tag>
      ),
    },
    {
      title: t('fleetRoster.col.equipment', 'Trang bị'),
      key: 'equipment',
      render: (_, record) => (
        <Space size={4} wrap>
          <Tag color={record.hasClimateControl ? 'cyan' : 'default'}>
            {record.hasClimateControl
              ? t('fleetRoster.climateOn', 'Có điều hòa')
              : t('fleetRoster.climateOff', 'Không điều hòa')}
          </Tag>
          <Tag color={record.hasGpsTracker ? 'geekblue' : 'default'}>
            {record.hasGpsTracker
              ? t('fleetRoster.gpsOn', 'Có GPS')
              : t('fleetRoster.gpsOff', 'Không GPS')}
          </Tag>
        </Space>
      ),
    },
    {
      title: t('fleetRoster.col.lastSanitization', 'Khử trùng gần nhất'),
      dataIndex: 'lastSanitizationDate',
      key: 'lastSanitizationDate',
      render: (date) => (
        <span style={{ fontSize: 12.5, color: '#475569' }}>
          {date ? dayjs(date).format('DD/MM/YYYY') : '—'}
        </span>
      ),
    },
    {
      title: t('fleetRoster.col.status', 'Trạng thái'),
      dataIndex: 'status',
      key: 'status',
      render: (status) => (
        <Tag
          color={STATUS_COLORS[status] || 'default'}
          style={{ fontWeight: 700, borderRadius: 6 }}
        >
          {statusLabel(status)}
        </Tag>
      ),
    },
  ];

  const crewColumns = [
    {
      title: t('fleetRoster.col.staff', 'Nhân sự'),
      key: 'fullName',
      render: (_, record) => (
        <div>
          <strong style={{ fontSize: 14, color: '#0F172A' }}>{record.fullName}</strong>
          <div style={{ fontSize: 12, color: '#64748B' }}>{record.email}</div>
        </div>
      ),
    },
    {
      title: t('fleetRoster.col.phone', 'Số điện thoại'),
      dataIndex: 'phoneNumber',
      key: 'phoneNumber',
      render: (phone) => <span style={{ fontSize: 12.5, color: '#475569' }}>{phone || '—'}</span>,
    },
    {
      title: t('fleetRoster.col.role', 'Vai trò'),
      key: 'role',
      render: () => (
        <Tag color="purple" style={{ fontWeight: 600 }}>
          {t('fleetRoster.driverEscort', 'Tài xế / Áp tải')}
        </Tag>
      ),
    },
  ];

  return (
    <div style={{ maxWidth: 1280, margin: '0 auto', paddingBottom: 40 }}>
      <Flex
        align="center"
        justify="space-between"
        gap={12}
        wrap="wrap"
        style={{ marginBottom: 20 }}
      >
        <Flex align="center" gap={12}>
          <Button
            icon={<ArrowLeftOutlined />}
            onClick={() => navigate(ROUTES.COORDINATOR_DASHBOARD)}
            style={{ borderRadius: 8 }}
          >
            {t('fleetRoster.back', 'Operations Hub')}
          </Button>
          <div>
            <Title level={2} style={{ margin: 0, fontWeight: 800, color: '#0F172A', fontSize: 26 }}>
              {t('fleetRoster.title', 'Phương tiện & nhân sự')}
            </Title>
            <Text style={{ color: '#64748B', fontSize: 13 }}>
              {t(
                'fleetRoster.subtitle',
                'Thông số, trạng thái phương tiện và danh sách tài xế / áp tải đang hoạt động',
              )}
            </Text>
          </div>
        </Flex>
        <Button icon={<ReloadOutlined />} onClick={reload} loading={loading}>
          {t('fleetRoster.reload', 'Tải lại')}
        </Button>
      </Flex>

      <Card
        bordered
        style={{ borderRadius: 18, border: '1px solid #E2E8F0', marginBottom: 24 }}
        styles={{ body: { padding: '22px' } }}
      >
        <Flex
          justify="space-between"
          align="center"
          wrap="wrap"
          gap={12}
          style={{ marginBottom: 16 }}
        >
          <div>
            <Title level={4} style={{ margin: 0, fontWeight: 800, color: '#0F172A' }}>
              {t('fleetRoster.fleetTitle', 'Đội xe chuyên dụng & chuồng hàng không')}
            </Title>
            <Text style={{ fontSize: 12.5, color: '#64748B' }}>
              {t(
                'fleetRoster.fleetSubtitle',
                'Xe tải giảm xóc khí, xe van chở ngựa và chuồng bay IATA',
              )}
            </Text>
          </div>
          <Space wrap>
            {Object.keys(counts).map((status) => (
              <Tag key={status} color={STATUS_COLORS[status]} style={{ fontWeight: 700 }}>
                {counts[status]} {statusLabel(status)}
              </Tag>
            ))}
          </Space>
        </Flex>

        {assetError && (
          <Alert type="error" showIcon message={assetError} style={{ marginBottom: 12 }} />
        )}
        <Table
          columns={fleetColumns}
          dataSource={assets}
          rowKey="assetId"
          loading={loading}
          pagination={assets.length > 10 ? { pageSize: 10, showSizeChanger: false } : false}
          size="middle"
          scroll={{ x: 'max-content' }}
        />
      </Card>

      <Card
        bordered
        style={{ borderRadius: 18, border: '1px solid #E2E8F0' }}
        styles={{ body: { padding: '22px' } }}
      >
        <div style={{ marginBottom: 16 }}>
          <Title level={4} style={{ margin: 0, fontWeight: 800, color: '#0F172A' }}>
            {t('fleetRoster.crewTitle', 'Tài xế & người áp tải')}
          </Title>
          <Text style={{ fontSize: 12.5, color: '#64748B' }}>
            {t(
              'fleetRoster.crewSubtitle',
              'Tài khoản DriverEscort đang hoạt động, dùng khi lập kế hoạch chuyến',
            )}
          </Text>
        </div>

        {crewError && (
          <Alert type="error" showIcon message={crewError} style={{ marginBottom: 12 }} />
        )}
        <Table
          columns={crewColumns}
          dataSource={crew}
          rowKey="userId"
          loading={loading}
          pagination={crew.length > 10 ? { pageSize: 10, showSizeChanger: false } : false}
          size="middle"
          scroll={{ x: 'max-content' }}
        />
      </Card>
    </div>
  );
}
