import { Card, Flex, Space, Tag, Typography, Button, Popconfirm, Image } from 'antd';
import {
  EditOutlined,
  DeleteOutlined,
  FileTextOutlined,
  MedicineBoxOutlined,
  EyeOutlined,
} from '@ant-design/icons';
import { useTranslation } from 'react-i18next';
import dayjs from 'dayjs';

const { Title, Text } = Typography;

/**
 * Tính toán mức độ rủi ro sức khỏe / vận chuyển minh họa theo tuổi và yêu cầu chăm sóc
 * @param {import('@types/database').Horse} horse
 * @returns {{ label: string, bg: string, color: string, border: string }}
 */
const getRiskTag = (horse, t) => {
  const birthYear = horse.DateOfBirth ? dayjs(horse.DateOfBirth).year() : null;
  const currentYear = dayjs().year();
  const age = birthYear ? currentYear - birthYear : 4;

  if (age >= 6 || (horse.SpecialCareRequirements && horse.SpecialCareRequirements.toLowerCase().includes('say xe'))) {
    return {
      label: t('dashboard.riskLevels.critical') || 'Critical Risk',
      bg: '#fee2e2',
      color: '#991b1b',
      border: '#fca5a5',
    };
  }
  if (horse.Gender === 'Stallion' || (horse.SpecialCareRequirements && horse.SpecialCareRequirements.length > 30)) {
    return {
      label: t('dashboard.riskLevels.high') || 'High Risk',
      bg: '#fef3c7',
      color: '#92400e',
      border: '#fcd34d',
    };
  }
  return {
    label: t('dashboard.riskLevels.low') || 'Low Risk',
    bg: '#dcfce7',
    color: '#166534',
    border: '#86efac',
  };
};

/**
 * Component hiển thị Thẻ hồ sơ ngựa đua (Horse Card)
 * Tái hiện phong cách thiết kế Frame 70:706 của Figma
 *
 * @param {Object} props
 * @param {import('@types/database').Horse} props.horse - Dữ liệu hồ sơ ngựa
 * @param {(horse: import('@types/database').Horse) => void} [props.onEdit] - Callback sửa thông tin
 * @param {(horseId: number) => void} [props.onDelete] - Callback xóa hồ sơ
 * @param {(horse: import('@types/database').Horse) => void} [props.onView] - Callback xem chi tiết
 * @returns {JSX.Element}
 */
export default function HorseCard({ horse, onEdit, onDelete, onView }) {
  const { t } = useTranslation();
  const risk = getRiskTag(horse, t);
  const birthYear = horse.DateOfBirth ? dayjs(horse.DateOfBirth).year() : null;

  return (
    <Card
      hoverable
      bordered
      style={{
        borderRadius: 16,
        borderColor: '#e2e8f0',
        boxShadow: '0 2px 8px rgba(0, 0, 0, 0.04)',
        display: 'flex',
        flexDirection: 'column',
        height: '100%',
        overflow: 'hidden',
        transition: 'all 0.25s ease',
      }}
      styles={{
        body: {
          padding: '20px 24px',
          display: 'flex',
          flexDirection: 'column',
          flex: 1,
        },
      }}
    >
      {/* Hàng tiêu đề: Tên ngựa + Tag Rủi ro pastel */}
      <Flex justify="space-between" align="flex-start" gap="small" style={{ marginBottom: 12 }}>
        <Flex align="center" gap="middle">
          {horse.PhotoUrl ? (
            <Image
              src={horse.PhotoUrl}
              alt={horse.Name}
              width={52}
              height={52}
              style={{ objectFit: 'cover', borderRadius: 10 }}
              preview={{ mask: <EyeOutlined /> }}
            />
          ) : (
            <div
              style={{
                width: 52,
                height: 52,
                borderRadius: 10,
                backgroundColor: '#fffbeb',
                border: '1px solid #fef3c7',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: 26,
              }}
            >
              🐴
            </div>
          )}

          <div>
            <Title
              level={4}
              style={{
                margin: 0,
                fontWeight: 700,
                color: '#0f172a',
                fontSize: 18,
                lineHeight: 1.2,
              }}
            >
              {horse.Name}
            </Title>
            <Text type="secondary" style={{ fontSize: 13, display: 'block', marginTop: 2 }}>
              {horse.Breed || 'Thoroughbred'} ·{' '}
              <span style={{ textTransform: 'uppercase', fontWeight: 600 }}>
                {t(`horses.genderOptions.${horse.Gender?.toLowerCase()}`) || horse.Gender}
              </span>
              {birthYear ? ` · Born ${birthYear}` : ''}
            </Text>
          </div>
        </Flex>

        <Tag
          style={{
            margin: 0,
            padding: '3px 10px',
            borderRadius: 9999,
            fontSize: 12,
            fontWeight: 700,
            backgroundColor: risk.bg,
            color: risk.color,
            border: `1px solid ${risk.border}`,
          }}
        >
          {risk.label}
        </Tag>
      </Flex>

      {/* Màu sắc & dấu hiệu nhận dạng */}
      <div style={{ marginBottom: 14 }}>
        <Text style={{ fontSize: 13, color: '#475569', lineHeight: 1.5 }}>
          {horse.Color || t('horses.noColorDesc')}
        </Text>
      </div>

      {/* Mã vi mạch & Hộ chiếu */}
      <div
        style={{
          background: '#f8fafc',
          padding: '10px 12px',
          borderRadius: 8,
          marginBottom: 16,
          fontSize: 12,
          color: '#334155',
        }}
      >
        <Flex justify="space-between" style={{ marginBottom: 4 }}>
          <Text type="secondary">{t('horses.fields.microchip')}:</Text>
          <Text code style={{ fontSize: 11, background: '#ffffff', padding: '1px 6px' }}>
            {horse.MicrochipNumber || '-'}
          </Text>
        </Flex>
        <Flex justify="space-between">
          <Text type="secondary">{t('horses.fields.passport')}:</Text>
          <Text strong style={{ fontSize: 12 }}>
            {horse.PassportNumber || '-'}
          </Text>
        </Flex>
      </div>

      {/* Yêu cầu chăm sóc đặc biệt (nếu có) */}
      {horse.SpecialCareRequirements && (
        <div style={{ marginBottom: 16 }}>
          <Text type="secondary" style={{ fontSize: 11, display: 'block', marginBottom: 2 }}>
            {t('horses.fields.specialCare')}:
          </Text>
          <Text
            style={{
              fontSize: 12,
              color: '#64748b',
              background: '#fffbeb',
              padding: '6px 10px',
              borderRadius: 6,
              display: 'block',
              border: '1px solid #fef3c7',
            }}
            ellipsis={{ tooltip: horse.SpecialCareRequirements }}
          >
            {horse.SpecialCareRequirements}
          </Text>
        </div>
      )}

      {/* Spacer đẩy các nút hành động xuống đáy thẻ */}
      <div style={{ marginTop: 'auto' }} />

      {/* Footer các nút tương tác khớp Figma: View Profile, Vet Records, Edit, Delete */}
      <Flex
        justify="space-between"
        align="center"
        style={{
          paddingTop: 12,
          borderTop: '1px solid #f1f5f9',
          marginTop: 8,
        }}
      >
        <Space size="small">
          <Button
            type="link"
            size="small"
            icon={<FileTextOutlined />}
            onClick={() => onView && onView(horse)}
            style={{ padding: 0, fontWeight: 600, color: '#d97706' }}
          >
            {t('horses.viewProfile')}
          </Button>
          <span style={{ color: '#cbd5e1' }}>|</span>
          <Button
            type="link"
            size="small"
            icon={<MedicineBoxOutlined />}
            onClick={() => onView && onView(horse)}
            style={{ padding: 0, color: '#64748b' }}
          >
            {t('horses.vetRecords')}
          </Button>
        </Space>

        <Space size={4}>
          {onEdit && (
            <Button
              type="text"
              size="small"
              icon={<EditOutlined style={{ color: '#475569' }} />}
              onClick={() => onEdit(horse)}
              aria-label={t('common.edit')}
            />
          )}

          {onDelete && (
            <Popconfirm
              title={t('horses.deleteConfirm')}
              onConfirm={() => onDelete(horse.HorseID)}
              okText={t('common.confirm')}
              cancelText={t('common.cancel')}
            >
              <Button
                type="text"
                size="small"
                danger
                icon={<DeleteOutlined />}
                aria-label={t('common.delete')}
              />
            </Popconfirm>
          )}
        </Space>
      </Flex>
    </Card>
  );
}
