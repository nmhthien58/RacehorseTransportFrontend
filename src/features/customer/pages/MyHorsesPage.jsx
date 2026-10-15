import { useState } from 'react';
import {
  Button,
  Card,
  Popconfirm,
  Space,
  Table,
  Tag,
  Typography,
  message,
} from 'antd';
import {
  EyeOutlined,
  PlusOutlined,
  DeleteOutlined,
  EditOutlined,
} from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import dayjs from 'dayjs';
import PageHeader from '@components/layout/PageHeader';
import useMyHorses from '@features/customer/hooks/useMyHorses';
import horseService from '@services/horseService';
import { getErrorMessage } from '@utils/apiHelpers';
import { ROUTES } from '@routes/routes';
import {
  calculateHorseRisk,
  HealthStatusTag,
  RiskBadge,
} from '@utils/horseHealth';
import EditHorseModal from '@features/customer/components/EditHorseModal';

const { Text } = Typography;

/**
 * Trang danh sách hồ sơ ngựa đua của khách hàng (My Horses List)
 * Đường dẫn: /customer/horses
 * Sử dụng AntD Table với các cột: [Tên, Giống, Tuổi, Microchip, Sức khỏe, Mức rủi ro, Thao tác]
 *
 * @returns {JSX.Element}
 */
export default function MyHorsesPage() {
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();
  const { data: horses, loading, refetch } = useMyHorses();

  const [editingHorse, setEditingHorse] = useState(null);
  const [editModalVisible, setEditModalVisible] = useState(false);
  const [editSubmitting, setEditSubmitting] = useState(false);

  const handleOpenEdit = (record) => {
    setEditingHorse(record);
    setEditModalVisible(true);
  };

  const handleSaveEdit = async (values) => {
    try {
      setEditSubmitting(true);
      const horseId = editingHorse.horseId || editingHorse.HorseID;
      await horseService.updateHorse(horseId, values);
      message.success(t('horses.updateHorseSuccess'));
      setEditModalVisible(false);
      refetch?.();
    } catch (err) {
      message.error(getErrorMessage(err, t('horses.updateHorseError')));
    } finally {
      setEditSubmitting(false);
    }
  };

  const handleViewDetail = (horseId) => {
    navigate(`/customer/horses/${horseId}`);
  };

  const handleAddNewHorse = () => {
    navigate(ROUTES.CUSTOMER_HORSE_NEW);
  };

  const columns = [
    {
      title: t('horses.columns.name'),
      dataIndex: 'name',
      key: 'name',
      render: (name, record) => {
        const horseId = record.horseId || record.HorseID;
        const horseName = name || record.Name;
        const gender = record.gender || record.Gender;
        const passport = record.passportNumber || record.PassportNumber;
        return (
          <Space size="middle">
            <div
              style={{
                width: 38,
                height: 38,
                borderRadius: '50%',
                backgroundColor: '#fef3c7',
                color: '#d97706',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: 19,
                flexShrink: 0,
              }}
            >
              🐴
            </div>
            <div>
              <Text
                strong
                style={{
                  fontSize: 15,
                  color: '#0f172a',
                  cursor: 'pointer',
                }}
                onClick={() => handleViewDetail(horseId)}
              >
                {horseName}
              </Text>
              <div style={{ fontSize: 12, color: '#64748b' }}>
                {t(`horses.genderOptions.${gender?.toLowerCase()}`) || gender} · {passport || t('horses.noPassport')}
              </div>
            </div>
          </Space>
        );
      },
    },
    {
      title: t('horses.columns.breed'),
      dataIndex: 'breed',
      key: 'breed',
      render: (breed, record) => {
        const b = breed || record.Breed;
        return <Tag color="blue">{t(`horses.breedOptions.${b}`) || b}</Tag>;
      },
    },
    {
      title: t('horses.columns.age'),
      dataIndex: 'dateOfBirth',
      key: 'dateOfBirth',
      render: (dob, record) => {
        const d = dob || record.DateOfBirth;
        if (!d) return '-';
        const age = dayjs().diff(dayjs(d), 'year');
        return (
          <Text strong style={{ color: '#334155' }}>
            {age} {t('horses.yearsOld')}
          </Text>
        );
      },
    },
    {
      title: t('horses.columns.microchip'),
      dataIndex: 'microchipNumber',
      key: 'microchipNumber',
      render: (code, record) => (
        <code
          style={{
            fontSize: 12,
            backgroundColor: '#f1f5f9',
            padding: '3px 8px',
            borderRadius: 6,
            color: '#0f172a',
            fontFamily: 'monospace',
          }}
        >
          {code || record.MicrochipNumber || '-'}
        </code>
      ),
    },
    {
      title: t('horses.healthStatus', 'Sức khỏe'),
      dataIndex: 'healthStatus',
      key: 'healthStatus',
      render: (_, record) => {
        const hs = record.healthStatus || record.HealthStatus || 'Good';
        return <HealthStatusTag status={hs} size="small" />;
      },
    },
    {
      title: t('horses.riskLevel', 'Mức rủi ro'),
      key: 'riskLevel',
      render: (_, record) => {
        const risk = calculateHorseRisk(record, i18n.language);
        return <RiskBadge risk={risk} size="small" />;
      },
    },
    {
      title: t('horses.columns.action'),
      key: 'action',
      align: 'right',
      render: (_, record) => {
        const horseId = record.horseId || record.HorseID;
        const horseName = record.name || record.Name;
        return (
          <Space size="small">
            <Button
              type="primary"
              ghost
              icon={<EyeOutlined />}
              size="middle"
              onClick={() => handleViewDetail(horseId)}
              style={{ borderRadius: 6, fontWeight: 500 }}
            >
              {t('horses.viewAction')}
            </Button>
            <Button
              icon={<EditOutlined />}
              size="middle"
              onClick={() => handleOpenEdit(record)}
              style={{ borderRadius: 6, fontWeight: 500 }}
            >
              {t('common.edit')}
            </Button>
            <Popconfirm
              title={t('horses.deleteHorse')}
              description={t('horses.deleteConfirmText', { name: horseName })}
              okText={t('common.delete')}
              cancelText={t('common.cancel')}
              okButtonProps={{ danger: true }}
              onConfirm={async () => {
                await horseService.deleteHorse(horseId);
                message.success(t('horses.deleteHorseSuccess', { name: horseName }));
                refetch();
              }}
            >
              <Button
                danger
                type="text"
                icon={<DeleteOutlined />}
                size="middle"
                style={{ borderRadius: 6 }}
              />
            </Popconfirm>
          </Space>
        );
      },
    },
  ];

  return (
    <div>
      {/* Tiêu đề trang & Nút Thêm ngựa mới */}
      <PageHeader
        title={t('horses.myHorsesTitle')}
        subtitle={t('horses.myHorsesSubtitle')}
        actions={
          <Button
            type="primary"
            size="large"
            icon={<PlusOutlined />}
            onClick={handleAddNewHorse}
            style={{
              fontWeight: 700,
              borderRadius: 9999,
              height: 44,
              padding: '0 24px',
              backgroundColor: '#f59e0b',
              borderColor: '#f59e0b',
            }}
          >
            {t('horses.add')}
          </Button>
        }
      />

      {/* Bảng danh sách AntD Table */}
      <Card
        bordered
        style={{
          borderRadius: 14,
          borderColor: '#e2e8f0',
          boxShadow: '0 1px 4px rgba(0, 0, 0, 0.03)',
        }}
        styles={{ body: { padding: '8px 12px' } }}
      >
        <Table
          columns={columns}
          dataSource={Array.isArray(horses) ? horses : []}
          rowKey="HorseID"
          loading={loading}
          pagination={{
            pageSize: 8,
            showTotal: (total) => t('horses.totalCount', { count: total }),
          }}
        />
      </Card>

      {/* MODAL CHỈNH SỬA THÔNG TIN NGỰA (Dùng chung) */}
      <EditHorseModal
        open={editModalVisible}
        onCancel={() => {
          setEditModalVisible(false);
          setEditingHorse(null);
        }}
        onSave={handleSaveEdit}
        horse={editingHorse}
        confirmLoading={editSubmitting}
      />
    </div>
  );
}
