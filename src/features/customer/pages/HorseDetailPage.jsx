import { useEffect, useState } from 'react';
import {
  Button,
  Card,
  Descriptions,
  Empty,
  Flex,
  Spin,
  Space,
  Table,
  Tabs,
  Tag,
  Typography,
  message,
} from 'antd';
import {
  ArrowLeftOutlined,
  MedicineBoxOutlined,
  CarOutlined,
  InfoCircleOutlined,
  EditOutlined,
  PlusOutlined,
} from '@ant-design/icons';
import { useNavigate, useParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import dayjs from 'dayjs';
import { formatDeliveryDeadline, formatPickupWindow } from '@utils/bookingSchedule';
import horseService from '@services/horseService';
import { getErrorMessage, unwrapList } from '@utils/apiHelpers';
import PageHeader from '@components/layout/PageHeader';
import useHorseDetail from '@features/customer/hooks/useHorseDetail';
import HorseDocumentTable from '@features/customer/components/HorseDocumentTable';
import { ROUTES } from '@routes/routes';
import EditHorseModal from '@features/customer/components/EditHorseModal';

const { Title, Text } = Typography;

/**
 * Trang chi tiết cá thể ngựa đua dành cho khách hàng (Horse Detail)
 * Đường dẫn: /customer/horses/:id
 * Giao diện AntD Descriptions + Tabs [Thông tin chung, Hồ sơ thú y, Lịch sử vận chuyển]
 *
 * @returns {JSX.Element}
 */
export default function HorseDetailPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { id } = useParams();
  const { data: horse, loading, error, refetch } = useHorseDetail(id);

  const [editModalVisible, setEditModalVisible] = useState(false);
  const [editSubmitting, setEditSubmitting] = useState(false);

  const [documents, setDocuments] = useState([]);
  const [docsLoading, setDocsLoading] = useState(true);

  useEffect(() => {
    let active = true;
    horseService
      .getHorseDocuments(id)
      .then((res) => active && setDocuments(unwrapList(res)))
      .catch(() => active && setDocuments([]))
      .finally(() => active && setDocsLoading(false));
    return () => {
      active = false;
    };
  }, [id]);

  const goToAddDocuments = () => {
    navigate(`${ROUTES.CUSTOMER_VET_RECORDS}?horseId=${id}&add=1`);
  };

  const handleOpenEdit = () => {
    setEditModalVisible(true);
  };

  const handleSaveEdit = async (values) => {
    try {
      setEditSubmitting(true);
      const horseId = horse.horseId || horse.HorseID;
      await horseService.updateHorse(horseId, values);
      message.success(t('horses.updateHorseSuccess'));
      setEditModalVisible(false);
      refetch?.();
    } catch (err) {
      console.error(err);
      message.error(getErrorMessage(err, t('horses.updateHorseError')));
    } finally {
      setEditSubmitting(false);
    }
  };

  const handleBackToList = () => {
    navigate(ROUTES.CUSTOMER_HORSES);
  };

  if (loading) {
    return (
      <div style={{ textAlign: 'center', padding: '100px 0' }}>
        <Spin size="large" />
        <Text type="secondary" style={{ display: 'block', marginTop: 16 }}>
          {t('common.loading')}
        </Text>
      </div>
    );
  }

  if (error || !horse) {
    return (
      <div style={{ maxWidth: 800, margin: '40px auto', textAlign: 'center' }}>
        <Empty
          description={
            <div>
              <Text strong style={{ fontSize: 16, color: '#0f172a' }}>
                {t('horses.notFound')}
              </Text>
              <Text type="secondary" style={{ display: 'block', marginTop: 8 }}>
                #{id}
              </Text>
            </div>
          }
        >
          <Button type="primary" onClick={handleBackToList} style={{ marginTop: 16 }}>
            {t('common.back')}
          </Button>
        </Empty>
      </div>
    );
  }

  const horseDob = horse.dateOfBirth || horse.DateOfBirth;
  const age = horseDob ? dayjs().diff(dayjs(horseDob), 'year') : null;

  const tripColumns = [
    {
      title: t('horses.tripCode'),
      dataIndex: 'bookingCode',
      key: 'bookingCode',
      render: (code, record) => {
        const bCode = code || record.BookingCode;
        const vCode = record.vehicleCode || record.VehicleCode;
        return (
          <div>
            <strong style={{ color: '#0f172a', fontFamily: 'monospace' }}>#{bCode}</strong>
            <div style={{ fontSize: 12, color: '#64748b' }}>{vCode}</div>
          </div>
        );
      },
    },
    {
      title: t('horses.tripRoute'),
      dataIndex: 'route',
      key: 'route',
      render: (route, record) => {
        const rName = route || record.Route;
        const mode = record.transportMode || record.TransportMode;
        return (
          <div>
            <span>{rName}</span>
            <div>
              <Tag color={mode === 'Air' ? 'blue' : 'orange'} style={{ fontSize: 11 }}>
                {mode === 'Air' ? t('horses.modeAir') : t('horses.modeGround')}
              </Tag>
            </div>
          </div>
        );
      },
    },
    {
      title: t('horses.tripTime'),
      dataIndex: 'pickupWindowStart',
      key: 'pickupWindowStart',
      // Khoảng ngày sẵn sàng đón ➔ hạn giao trễ nhất của đơn
      render: (_, record) => {
        return (
          <span style={{ fontSize: 13 }}>
            {formatPickupWindow(record, '-')} ➔ {formatDeliveryDeadline(record, '-')}
          </span>
        );
      },
    },
    {
      title: t('horses.welfareScore'),
      dataIndex: 'welfareScore',
      key: 'welfareScore',
      render: (score, record) => {
        const val = score ?? record.WelfareScore;
        return val ? <Tag color="green">{val}</Tag> : '-';
      },
    },
    {
      title: t('horses.recordStatus'),
      dataIndex: 'status',
      key: 'status',
      render: (st, record) => {
        const status = st || record.Status;
        return (
          <Tag color={status === 'InTransit' ? 'processing' : 'success'}>
            {status === 'InTransit' ? t('horses.statusInTransit') : t('horses.statusCompleted')}
          </Tag>
        );
      },
    },
  ];

  const horseName = horse.name || horse.Name;
  const horseBreed = horse.breed || horse.Breed;
  const horseGender = horse.gender || horse.Gender;
  const horseMicrochip = horse.microchipNumber || horse.MicrochipNumber;
  const horsePassport = horse.passportNumber || horse.PassportNumber;
  const horseColor = horse.color || horse.Color;
  const horseCare = horse.specialCareRequirements || horse.SpecialCareRequirements;
  const horseActive = horse.isActive ?? horse.IsActive ?? true;
  const horsePhoto = horse.photoUrl || horse.PhotoUrl;
  const horseCreated = horse.createdAt || horse.CreatedAt;

  // Danh sách các Tabs
  const tabItems = [
    {
      key: 'general',
      label: (
        <span>
          <InfoCircleOutlined /> {t('horses.tabs.general')}
        </span>
      ),
      children: (
        <Card bordered style={{ borderRadius: 12, borderColor: '#e2e8f0', marginTop: 12 }}>
          <Title level={5} style={{ margin: '0 0 16px', color: '#0f172a' }}>
            {t('horses.biometricCare')}
          </Title>
          <div style={{ backgroundColor: '#f8fafc', padding: '12px 16px', borderRadius: 8, marginBottom: 16, border: '1px solid #f1f5f9' }}>
            <Text type="secondary" style={{ display: 'block', fontSize: 12, marginBottom: 4, fontWeight: 600 }}>
              {t('horses.fields.specialCare')}:
            </Text>
            <Text strong style={{ color: '#0f172a' }}>
              {horseCare || t('horses.specialCareNone')}
            </Text>
          </div>

          <Descriptions bordered size="small" column={{ xs: 1, sm: 2, md: 3 }} styles={{ label: { fontWeight: 600, color: '#475569' } }}>
            <Descriptions.Item label={t('horses.fields.color')}>{horseColor || '-'}</Descriptions.Item>
            <Descriptions.Item label={t('horses.registrationDate')}>
              {horseCreated ? dayjs(horseCreated).format('DD/MM/YYYY') : '-'}
            </Descriptions.Item>
            <Descriptions.Item label={t('horses.recordStatus')}>
              <Tag color={horseActive ? 'success' : 'default'}>
                {horseActive ? t('horses.activeStatus') : t('horses.inactiveStatus')}
              </Tag>
            </Descriptions.Item>
          </Descriptions>
        </Card>
      ),
    },
    {
      key: 'vet',
      label: (
        <span>
          <MedicineBoxOutlined /> {t('horses.tabs.vetRecords')}
        </span>
      ),
      children: (
        <Card bordered style={{ borderRadius: 12, borderColor: '#e2e8f0', marginTop: 12 }}>
          <Flex justify="space-between" align="center" wrap gap={8} style={{ marginBottom: 16 }}>
            <Title level={5} style={{ margin: 0, color: '#0f172a' }}>
              {t('horseDocs.tabs.documents')}
            </Title>
            <Button type="primary" ghost icon={<PlusOutlined />} onClick={goToAddDocuments}>
              {t('horseDocs.addButton')}
            </Button>
          </Flex>
          <HorseDocumentTable documents={documents} loading={docsLoading} />
        </Card>
      ),
    },
    {
      key: 'trips',
      label: (
        <span>
          <CarOutlined /> {t('horses.tabs.tripHistory')}
        </span>
      ),
      children: (
        <Card bordered style={{ borderRadius: 12, borderColor: '#e2e8f0', marginTop: 12 }}>
          <Flex justify="space-between" align="center" style={{ marginBottom: 16 }}>
            <div>
              <Title level={5} style={{ margin: 0, color: '#0f172a' }}>
                {t('horses.tripHistory')}
              </Title>
              <Text type="secondary" style={{ fontSize: 12 }}>
                {t('horses.tripHistoryDesc')}
              </Text>
            </div>
            <Tag color="orange">{t('horses.totalTrips', { count: (horse.transportHistory || horse.TransportHistory || []).length })}</Tag>
          </Flex>

          <Table
            columns={tripColumns}
            dataSource={horse.transportHistory || horse.TransportHistory || []}
            rowKey={(r, idx) => r.tripId || r.TripID || r.bookingCode || r.BookingCode || `trip-${idx}`}
            pagination={false}
          />
        </Card>
      ),
    },
  ];

  return (
    <div style={{ maxWidth: 1100, margin: '0 auto', paddingBottom: 40 }}>
      {/* Header trang & nút quay lại */}
      <PageHeader
        title={t('horses.detailTitle')}
        breadcrumb={[
          { label: t('nav.horses'), path: ROUTES.CUSTOMER_HORSES },
          { label: horseName },
        ]}
        actions={
          <Space>
            <Button
              type="primary"
              ghost
              icon={<EditOutlined />}
              onClick={handleOpenEdit}
            >
              {t('horses.editHorse')}
            </Button>
            <Button icon={<ArrowLeftOutlined />} onClick={handleBackToList}>
              {t('common.back')}
            </Button>
          </Space>
        }
      />

      {/* KHỐI TỔNG QUAN HỒ SƠ (AntD Descriptions) */}
      <Card
        bordered
        style={{
          borderRadius: 14,
          borderColor: '#e2e8f0',
          marginBottom: 24,
          boxShadow: '0 1px 4px rgba(0, 0, 0, 0.03)',
        }}
        styles={{ body: { padding: '24px 28px' } }}
      >
        <Flex justify="space-between" align="center" wrap="wrap" gap="middle" style={{ marginBottom: 20 }}>
          <Space size="middle" align="center">
            <div
              style={{
                width: 56,
                height: 56,
                borderRadius: '50%',
                backgroundColor: '#fef3c7',
                color: '#d97706',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: 24,
                fontWeight: 700,
                overflow: 'hidden',
              }}
            >
              {horsePhoto ? (
                <img src={horsePhoto} alt={horseName} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
              ) : (
                horseName?.charAt(0)?.toUpperCase()
              )}
            </div>
            <div>
              <Title level={3} style={{ margin: 0, fontWeight: 700, color: '#0f172a' }}>
                {horseName}
              </Title>
              <Space size="small" style={{ marginTop: 4 }}>
                <Tag color="blue">{horseBreed}</Tag>
                <Tag color="gold">
                  {t(`horses.genderOptions.${horseGender?.toLowerCase()}`) || horseGender}
                </Tag>
                <Tag color={horseActive ? 'success' : 'default'}>
                  {horseActive ? t('horses.activeRacing') : t('horses.resting')}
                </Tag>
              </Space>
            </div>
          </Space>
        </Flex>

        {/* AntD Descriptions hiển thị 3 cột x 2 hàng cân xứng tuyệt đối */}
        <Descriptions
          bordered
          size="small"
          column={{ xs: 1, sm: 2, md: 3 }}
          styles={{ label: { fontWeight: 600, color: '#475569' } }}
        >
          <Descriptions.Item label={t('horses.fields.microchip')}>
            <code
              style={{
                backgroundColor: '#f1f5f9',
                padding: '2px 8px',
                borderRadius: 6,
                fontSize: 12,
                fontFamily: 'monospace',
                color: '#0f172a',
                whiteSpace: 'nowrap',
              }}
            >
              {horseMicrochip || '-'}
            </code>
          </Descriptions.Item>

          <Descriptions.Item label={t('horses.fields.passport')}>
            <span style={{ fontWeight: 600, whiteSpace: 'nowrap', color: '#0f172a' }}>
              {horsePassport || t('horses.noPassport')}
            </span>
          </Descriptions.Item>

          <Descriptions.Item label={t('horses.dobAge')}>
            <span style={{ whiteSpace: 'nowrap' }}>
              {horseDob ? `${dayjs(horseDob).format('DD/MM/YYYY')} (${age} ${t('horses.yearsOld')})` : '-'}
            </span>
          </Descriptions.Item>

          <Descriptions.Item label={t('horses.fields.color')}>
            <span>{horseColor || '-'}</span>
          </Descriptions.Item>

          <Descriptions.Item label={t('horses.fields.gender')}>
            <span>{t(`horses.genderOptions.${horseGender?.toLowerCase()}`) || horseGender}</span>
          </Descriptions.Item>

          <Descriptions.Item label={t('horses.fields.status')}>
            <Tag color={horseActive ? 'success' : 'default'} style={{ margin: 0 }}>
              {horseActive ? t('horses.activeRacing') : t('horses.resting')}
            </Tag>
          </Descriptions.Item>
        </Descriptions>

      </Card>

      {/* KHỐI TABS: THÔNG TIN CHUNG / HỒ SƠ THÚ Y / LỊCH SỬ VẬN CHUYỂN */}
      <Tabs defaultActiveKey="general" items={tabItems} size="large" />

      {/* MODAL CHỈNH SỬA THÔNG TIN NGỰA (Dùng chung) */}
      <EditHorseModal
        open={editModalVisible}
        onCancel={() => setEditModalVisible(false)}
        onSave={handleSaveEdit}
        horse={horse}
        confirmLoading={editSubmitting}
      />

    </div>
  );
}
