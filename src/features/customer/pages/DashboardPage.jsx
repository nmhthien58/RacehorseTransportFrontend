import { useState, useEffect, useCallback } from 'react';
import {
  Col,
  DatePicker,
  Flex,
  Form,
  Input,
  Modal,
  Row,
  Select,
  Spin,
  Tag,
  Tooltip,
  Typography,
  message,
} from 'antd';
import {
  ClockCircleOutlined,
  StarOutlined,
  FieldTimeOutlined,
  AppstoreOutlined,
  PlusOutlined,
  EditOutlined,
} from '@ant-design/icons';
import dayjs from 'dayjs';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import PageHeader from '@components/layout/PageHeader';
import { useAuthStore } from '@features/auth/store/authStore';
import { horseService } from '@services/horseService';
import { bookingService } from '@services/bookingService';
import { tripService } from '@services/tripService';
import { ROUTES } from '@routes/routes';
import { useAppStore } from '@/store/appStore';
import { deduplicateHorses } from '@utils/horseStorage';
import {
  calculateHorseRisk,
  HealthStatusTag,
  RiskBadge,
} from '@utils/horseHealth';

const { Text, Title } = Typography;

/**
 * Trang Customer Dashboard tái tạo chính xác theo Frame 65:25 Figma
 * @returns {JSX.Element}
 */
export default function CustomerDashboard() {
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const { formatTempRange } = useAppStore();

  const isEn = (i18n.language || 'vi').toLowerCase().startsWith('en');

  const [loading, setLoading] = useState(true);
  const [horses, setHorses] = useState([]);
  const [bookings, setBookings] = useState([]);
  const [trips, setTrips] = useState([]);
  const [selectedHorse, setSelectedHorse] = useState(null);

  // State chỉnh sửa thông tin ngựa
  const [editingHorse, setEditingHorse] = useState(null);
  const [editModalVisible, setEditModalVisible] = useState(false);
  const [editSubmitting, setEditSubmitting] = useState(false);
  const [editForm] = Form.useForm();

  const handleOpenEditHorse = (horse) => {
    setEditingHorse(horse);
    editForm.setFieldsValue({
      Name: horse.Name,
      Breed: horse.Breed || 'Thoroughbred',
      Gender: horse.Gender || 'Stallion',
      DateOfBirth: horse.DateOfBirth ? dayjs(horse.DateOfBirth) : null,
      Color: horse.Color || '',
      MicrochipNumber: horse.MicrochipNumber || '',
      PassportNumber: horse.PassportNumber || '',
      HealthStatus: horse.HealthStatus || 'Good',
      SpecialCareRequirements: horse.SpecialCareRequirements || '',
    });
    setEditModalVisible(true);
  };

  const handleSaveHorseEdit = async (values) => {
    try {
      setEditSubmitting(true);
      const payload = {
        ...values,
        DateOfBirth: values.DateOfBirth
          ? values.DateOfBirth.format('YYYY-MM-DD')
          : null,
      };
      const updated = await horseService.updateHorse(editingHorse.HorseID, payload);
      message.success(t('horses.updateHorseSuccess'));
      const updatedData = updated?.data || updated || { ...editingHorse, ...payload };
      setEditingHorse(null);
      setEditModalVisible(false);
      setSelectedHorse(updatedData);
      loadData();
    } catch {
      message.error(t('horses.updateHorseError'));
    } finally {
      setEditSubmitting(false);
    }
  };

  const loadData = useCallback(() => {
    Promise.all([
      horseService.getHorses({ ownerId: user?.UserID || undefined }),
      bookingService.getBookings({ customerId: user?.UserID || undefined }),
      tripService.getTrips(),
    ])
      .then(([horseRes, bookingRes, tripRes]) => {
        const rawHorses = horseRes.data?.data || horseRes.data || [];
        setHorses(deduplicateHorses(rawHorses));
        setBookings(bookingRes.data?.data || bookingRes.data || []);
        setTrips(tripRes.data?.data || tripRes.data || []);
      })
      .catch(() => {
        // Giữ state rỗng an toàn
      })
      .finally(() => {
        setLoading(false);
      });
  }, [user]);

  // Tải dữ liệu tổng hợp & lắng nghe thay đổi
  useEffect(() => {
    loadData();

    const handleHorseUpdate = () => {
      loadData();
    };

    window.addEventListener('horses_updated', handleHorseUpdate);
    window.addEventListener('storage', handleHorseUpdate);

    return () => {
      window.removeEventListener('horses_updated', handleHorseUpdate);
      window.removeEventListener('storage', handleHorseUpdate);
    };
  }, [loadData]);

  const activeTripsCount = trips.filter(
    (tr) => tr.Status === 'InTransit' || tr.Status === 'Scheduled',
  ).length;

  const openBookingsCount = bookings.filter(
    (bk) => bk.Status === 'Submitted' || bk.Status === 'Approved',
  ).length;

  // Dữ liệu hiển thị thẻ ngựa lấy động theo danh sách thực tế và thuật toán đánh giá rủi ro chuẩn hóa
  const displayHorses = horses.map((h) => {
    const riskEval = calculateHorseRisk(h);
    return {
      id: h.HorseID,
      name: h.Name,
      breed: h.Breed,
      healthStatus: h.HealthStatus || 'Good',
      risk: riskEval.label,
      riskBg: riskEval.bg,
      riskColor: riskEval.color,
      riskBorder: riskEval.border,
      riskEval,
      raw: h,
    };
  });

  return (
    <div>
      {/* Tiêu đề Dashboard + Nút + Book dạng pill vàng cam nổi bật */}
      <PageHeader
        title={t('dashboard.title')}
        subtitle={t('dashboard.subtitle')}
        actions={
          <button
            type="button"
            onClick={() => navigate(ROUTES.CUSTOMER_BOOKING_NEW)}
            style={{
              backgroundColor: '#FBA919',
              color: '#0f172a',
              fontWeight: 700,
              fontSize: 18,
              border: 'none',
              borderRadius: 9999,
              height: 48,
              padding: '0 32px',
              display: 'flex',
              alignItems: 'center',
              gap: 8,
              cursor: 'pointer',
              boxShadow: '0 2px 8px rgba(251, 169, 25, 0.25)',
              transition: 'all 0.2s',
            }}
          >
            <span>+</span>
            <span>{t('dashboard.bookBtn')}</span>
          </button>
        }
      />

      <Spin spinning={loading}>
        {/* Hàng 4 thẻ Metric bo tròn 24px có icon tròn phía trên - Click chuyển đến mục tương ứng */}
        <Row gutter={[20, 20]} style={{ marginBottom: 36 }}>
          {/* Card 1: Active Trips -> Chuyển đến /customer/trips */}
          <Col xs={12} sm={12} md={6}>
            <div
              onClick={() => navigate(ROUTES.CUSTOMER_TRIPS)}
              style={{
                backgroundColor: '#ffffff',
                borderRadius: 24,
                padding: '24px 28px',
                boxShadow: '0 4px 24px rgba(0, 0, 0, 0.02)',
                border: '1.5px solid #F1F5F9',
                cursor: 'pointer',
                transition: 'all 0.25s cubic-bezier(0.4, 0, 0.2, 1)',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = 'translateY(-3px) scale(1.02)';
                e.currentTarget.style.boxShadow = '0 12px 30px rgba(217, 119, 6, 0.15)';
                e.currentTarget.style.borderColor = '#F59E0B';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = 'translateY(0) scale(1)';
                e.currentTarget.style.boxShadow = '0 4px 24px rgba(0, 0, 0, 0.02)';
                e.currentTarget.style.borderColor = '#F1F5F9';
              }}
            >
              <div
                style={{
                  width: 44,
                  height: 44,
                  borderRadius: '50%',
                  backgroundColor: '#FEF3C7',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: '#D97706',
                  fontSize: 18,
                }}
              >
                <AppstoreOutlined />
              </div>
              <div
                style={{
                  fontSize: 40,
                  fontWeight: 800,
                  color: '#0f172a',
                  lineHeight: 1,
                  margin: '18px 0 6px 0',
                }}
              >
                {activeTripsCount}
              </div>
              <div style={{ fontSize: 15, fontWeight: 500, color: '#475569' }}>
                {t('dashboard.metrics.activeTrips')} →
              </div>
            </div>
          </Col>

          {/* Card 2: Open Requests -> Chuyển đến /customer/bookings */}
          <Col xs={12} sm={12} md={6}>
            <div
              onClick={() => navigate(ROUTES.CUSTOMER_BOOKINGS)}
              style={{
                backgroundColor: '#ffffff',
                borderRadius: 24,
                padding: '24px 28px',
                boxShadow: '0 4px 24px rgba(0, 0, 0, 0.02)',
                border: '1.5px solid #F1F5F9',
                cursor: 'pointer',
                transition: 'all 0.25s cubic-bezier(0.4, 0, 0.2, 1)',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = 'translateY(-3px) scale(1.02)';
                e.currentTarget.style.boxShadow = '0 12px 30px rgba(37, 99, 235, 0.15)';
                e.currentTarget.style.borderColor = '#3B82F6';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = 'translateY(0) scale(1)';
                e.currentTarget.style.boxShadow = '0 4px 24px rgba(0, 0, 0, 0.02)';
                e.currentTarget.style.borderColor = '#F1F5F9';
              }}
            >
              <div
                style={{
                  width: 44,
                  height: 44,
                  borderRadius: '50%',
                  backgroundColor: '#EFF6FF',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: '#2563EB',
                  fontSize: 18,
                }}
              >
                <ClockCircleOutlined />
              </div>
              <div
                style={{
                  fontSize: 40,
                  fontWeight: 800,
                  color: '#0f172a',
                  lineHeight: 1,
                  margin: '18px 0 6px 0',
                }}
              >
                {openBookingsCount}
              </div>
              <div style={{ fontSize: 15, fontWeight: 500, color: '#475569' }}>
                {t('dashboard.metrics.openRequests')} →
              </div>
            </div>
          </Col>

          {/* Card 3: Bids Received -> Chuyển đến /customer/bookings */}
          <Col xs={12} sm={12} md={6}>
            <div
              onClick={() => navigate(ROUTES.CUSTOMER_BOOKINGS)}
              style={{
                backgroundColor: '#ffffff',
                borderRadius: 24,
                padding: '24px 28px',
                boxShadow: '0 4px 24px rgba(0, 0, 0, 0.02)',
                border: '1.5px solid #F1F5F9',
                cursor: 'pointer',
                transition: 'all 0.25s cubic-bezier(0.4, 0, 0.2, 1)',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = 'translateY(-3px) scale(1.02)';
                e.currentTarget.style.boxShadow = '0 12px 30px rgba(202, 138, 4, 0.15)';
                e.currentTarget.style.borderColor = '#EAB308';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = 'translateY(0) scale(1)';
                e.currentTarget.style.boxShadow = '0 4px 24px rgba(0, 0, 0, 0.02)';
                e.currentTarget.style.borderColor = '#F1F5F9';
              }}
            >
              <div
                style={{
                  width: 44,
                  height: 44,
                  borderRadius: '50%',
                  backgroundColor: '#FEF9C3',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: '#CA8A04',
                  fontSize: 18,
                }}
              >
                <StarOutlined />
              </div>
              <div
                style={{
                  fontSize: 40,
                  fontWeight: 800,
                  color: '#0f172a',
                  lineHeight: 1,
                  margin: '18px 0 6px 0',
                }}
              >
                0
              </div>
              <div style={{ fontSize: 15, fontWeight: 500, color: '#475569' }}>
                {t('dashboard.metrics.bidsReceived')} →
              </div>
            </div>
          </Col>

          {/* Card 4: My Horses -> Chuyển đến /customer/horses */}
          <Col xs={12} sm={12} md={6}>
            <div
              onClick={() => navigate(ROUTES.CUSTOMER_HORSES)}
              style={{
                backgroundColor: '#ffffff',
                borderRadius: 24,
                padding: '24px 28px',
                boxShadow: '0 4px 24px rgba(0, 0, 0, 0.02)',
                border: '1.5px solid #F1F5F9',
                cursor: 'pointer',
                transition: 'all 0.25s cubic-bezier(0.4, 0, 0.2, 1)',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = 'translateY(-3px) scale(1.02)';
                e.currentTarget.style.boxShadow = '0 12px 30px rgba(37, 99, 235, 0.15)';
                e.currentTarget.style.borderColor = '#3B82F6';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = 'translateY(0) scale(1)';
                e.currentTarget.style.boxShadow = '0 4px 24px rgba(0, 0, 0, 0.02)';
                e.currentTarget.style.borderColor = '#F1F5F9';
              }}
            >
              <div
                style={{
                  width: 44,
                  height: 44,
                  borderRadius: '50%',
                  backgroundColor: '#EFF6FF',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: '#2563EB',
                  fontSize: 18,
                }}
              >
                <FieldTimeOutlined />
              </div>
              <div
                style={{
                  fontSize: 40,
                  fontWeight: 800,
                  color: '#0f172a',
                  lineHeight: 1,
                  margin: '18px 0 6px 0',
                }}
              >
                {horses.length}
              </div>
              <div style={{ fontSize: 15, fontWeight: 500, color: '#475569' }}>
                {t('dashboard.metrics.myHorses')} →
              </div>
            </div>
          </Col>
        </Row>

        {/* Khối My Horses với header và 3 thẻ nằm ngang */}
        <div>
          <Flex justify="space-between" align="center" style={{ marginBottom: 20 }}>
            <Title
              level={2}
              style={{
                margin: 0,
                fontSize: 28,
                fontWeight: 800,
                color: '#0f172a',
              }}
            >
              {t('dashboard.horsesSection.title')}
            </Title>

            <button
              type="button"
              onClick={() => navigate(ROUTES.CUSTOMER_HORSES)}
              style={{
                background: 'none',
                border: 'none',
                color: '#0f172a',
                fontSize: 16,
                fontWeight: 700,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: 6,
              }}
            >
              <PlusOutlined style={{ fontSize: 14 }} />
              <span>{t('dashboard.horsesSection.addHorse')}</span>
            </button>
          </Flex>

          <Row gutter={[18, 18]}>
            {displayHorses.map((item) => (
              <Col xs={24} sm={12} md={8} key={item.id}>
                <div
                  role="button"
                  tabIndex={0}
                  onClick={() => setSelectedHorse(item.raw)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      setSelectedHorse(item.raw);
                    }
                  }}
                  style={{
                    backgroundColor: '#ffffff',
                    borderRadius: 18,
                    padding: '18px 22px',
                    boxShadow: '0 4px 16px rgba(0, 0, 0, 0.02)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    cursor: 'pointer',
                    transition: 'all 0.2s ease',
                    border: '1px solid #f1f5f9',
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.transform = 'translateY(-3px)';
                    e.currentTarget.style.boxShadow = '0 8px 24px rgba(251, 169, 25, 0.15)';
                    e.currentTarget.style.borderColor = '#FBA919';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.transform = 'translateY(0)';
                    e.currentTarget.style.boxShadow = '0 4px 16px rgba(0, 0, 0, 0.02)';
                    e.currentTarget.style.borderColor = '#f1f5f9';
                  }}
                >
                  <Flex align="center" gap="middle">
                    <div
                      style={{
                        width: 48,
                        height: 48,
                        borderRadius: '50%',
                        backgroundColor: '#EFF6FF',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        color: '#2563EB',
                        fontSize: 22,
                      }}
                    >
                      🐴
                    </div>
                    <div>
                      <div
                        style={{
                          fontWeight: 700,
                          fontSize: 16,
                          color: '#0f172a',
                        }}
                      >
                        {item.name}
                      </div>
                      <Text style={{ fontSize: 13.5, color: '#64748b' }}>
                        {item.breed}
                      </Text>
                    </div>
                  </Flex>

                  {/* Tag rủi ro bo tròn chuẩn màu pastel Figma */}
                  <RiskBadge risk={item.riskEval} />
                </div>
              </Col>
            ))}
          </Row>
        </div>
      </Spin>

      {/* ======================================================== */}
      {/* MODAL CHI TIẾT NGỰA KHI BẤM VÀO THẺ TRÊN DASHBOARD */}
      {/* ======================================================== */}
      <Modal
        open={Boolean(selectedHorse)}
        onCancel={() => setSelectedHorse(null)}
        footer={null}
        width={600}
        styles={{
          content: {
            borderRadius: 20,
            padding: '28px 32px',
          },
        }}
      >
        {selectedHorse && (
          <div>
            {/* Header thông tin con ngựa */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 20 }}>
              <div
                style={{
                  width: 58,
                  height: 58,
                  borderRadius: 16,
                  backgroundColor: '#FEF3C7',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: 30,
                  flexShrink: 0,
                  border: '1px solid #FDE68A',
                }}
              >
                🐴
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
                  <span style={{ fontSize: 20, fontWeight: 800, color: '#0F172A' }}>
                    {selectedHorse.Name}
                  </span>
                  <Tag color="gold" style={{ borderRadius: 6, fontWeight: 700, fontSize: 12 }}>
                    {selectedHorse.Breed}
                  </Tag>
                  <HealthStatusTag status={selectedHorse.HealthStatus} />
                  <RiskBadge risk={calculateHorseRisk(selectedHorse)} />
                </div>
                <div style={{ fontSize: 13, color: '#64748B', marginTop: 4 }}>
                  {t(`horses.genderOptions.${selectedHorse.Gender?.toLowerCase()}`) || selectedHorse.Gender} · {selectedHorse.DateOfBirth ? t('horses.born', { dob: selectedHorse.DateOfBirth }) : t('horses.noDob')}
                </div>
              </div>
            </div>

            {/* Đánh giá rủi ro vận chuyển */}
            {(() => {
              const riskEval = calculateHorseRisk(selectedHorse, i18n.language);
              const isCritical = riskEval.level === 'CRITICAL';
              return (
                <div>
                  <div
                    style={{
                      backgroundColor: riskEval.bg,
                      border: `1px solid ${riskEval.border}`,
                      borderRadius: 12,
                      padding: '12px 16px',
                      marginBottom: 16,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      gap: 12,
                    }}
                  >
                    <div>
                      <div
                        style={{
                          fontSize: 11,
                          fontWeight: 800,
                          color: riskEval.color,
                          textTransform: 'uppercase',
                          letterSpacing: '0.04em',
                        }}
                      >
                        {t('horses.riskEvaluation')}
                      </div>
                      <div
                        style={{
                          fontSize: 12.5,
                          color: riskEval.color,
                          marginTop: 2,
                          fontWeight: 600,
                        }}
                      >
                        {isEn ? riskEval.descriptionEn : riskEval.descriptionVi}
                      </div>
                    </div>
                    <RiskBadge risk={riskEval} />
                  </div>

                  {/* Cảnh báo cấm vận chuyển đối với Critical Risk */}
                  {isCritical && (
                    <div
                      style={{
                        backgroundColor: '#FEF2F2',
                        border: '1.5px solid #FCA5A5',
                        borderRadius: 12,
                        padding: '14px 18px',
                        marginBottom: 16,
                        display: 'flex',
                        alignItems: 'flex-start',
                        gap: 12,
                      }}
                    >
                      <span style={{ fontSize: 24, lineHeight: 1 }}>🚫</span>
                      <div>
                        <div style={{ fontSize: 13, fontWeight: 800, color: '#991B1B', textTransform: 'uppercase' }}>
                          {t('horses.prohibitedTitle')}
                        </div>
                        <div style={{ fontSize: 12.5, color: '#B91C1C', marginTop: 3, lineHeight: 1.45, fontWeight: 500 }}>
                          {t('horses.prohibitedDetail', { status: selectedHorse.HealthStatus })}
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              );
            })()}

            {/* Bảng thuộc tính chi tiết */}
            <div
              style={{
                backgroundColor: '#F8FAFC',
                border: '1px solid #E2E8F0',
                borderRadius: 14,
                padding: '16px 20px',
                marginBottom: 16,
              }}
            >
              <Row gutter={[16, 12]}>
                <Col span={12}>
                  <div style={{ fontSize: 11, color: '#64748B', fontWeight: 700, letterSpacing: '0.04em' }}>
                    {t('horses.fields.microchip').toUpperCase()}
                  </div>
                  <div style={{ fontSize: 13.5, fontWeight: 700, color: '#0F172A', marginTop: 2, fontFamily: 'monospace' }}>
                    {selectedHorse.MicrochipNumber || '---'}
                  </div>
                </Col>
                <Col span={12}>
                  <div style={{ fontSize: 11, color: '#64748B', fontWeight: 700, letterSpacing: '0.04em' }}>
                    {t('horses.fields.passport').toUpperCase()}
                  </div>
                  <div style={{ fontSize: 13.5, fontWeight: 700, color: '#0F172A', marginTop: 2 }}>
                    {selectedHorse.PassportNumber || t('horses.notIssued')}
                  </div>
                </Col>
                <Col span={12}>
                  <div style={{ fontSize: 11, color: '#64748B', fontWeight: 700, letterSpacing: '0.04em' }}>
                    {t('horses.colorMarkings')}
                  </div>
                  <div style={{ fontSize: 13, color: '#334155', marginTop: 2 }}>
                    {selectedHorse.Color || t('horses.noColor')}
                  </div>
                </Col>
                <Col span={12}>
                  <div style={{ fontSize: 11, color: '#64748B', fontWeight: 700, letterSpacing: '0.04em' }}>
                    {t('horses.cabinTemp')}
                  </div>
                  <div style={{ fontSize: 13, fontWeight: 700, color: '#D97706', marginTop: 2 }}>
                    {formatTempRange(16, 19)}
                  </div>
                </Col>
              </Row>
            </div>

            {/* Yêu cầu chăm sóc đặc biệt */}
            {selectedHorse.SpecialCareRequirements && (
              <div
                style={{
                  backgroundColor: '#FFFBEB',
                  border: '1px solid #FDE68A',
                  borderRadius: 12,
                  padding: '12px 16px',
                  marginBottom: 20,
                  display: 'flex',
                  alignItems: 'flex-start',
                  gap: 10,
                }}
              >
                <span style={{ fontSize: 16 }}>⚠️</span>
                <div>
                  <div style={{ fontSize: 12, fontWeight: 700, color: '#B45309' }}>
                    {t('horses.specialCareLabel')}
                  </div>
                  <div style={{ fontSize: 12.5, color: '#92400E', marginTop: 2, lineHeight: 1.45 }}>
                    {selectedHorse.SpecialCareRequirements}
                  </div>
                </div>
              </div>
            )}

            {/* Các nút tương tác */}
            <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end', marginTop: 20, flexWrap: 'wrap' }}>
              <button
                type="button"
                onClick={() => handleOpenEditHorse(selectedHorse)}
                style={{
                  backgroundColor: '#EFF6FF',
                  border: '1px solid #BFDBFE',
                  color: '#1D4ED8',
                  fontWeight: 700,
                  fontSize: 13,
                  borderRadius: 10,
                  padding: '9px 18px',
                  cursor: 'pointer',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 6,
                }}
              >
                <EditOutlined /> {t('horses.editHorse')}
              </button>
              <button
                type="button"
                onClick={() => {
                  const id = selectedHorse.HorseID;
                  setSelectedHorse(null);
                  navigate(`/customer/horses/${id}`);
                }}
                style={{
                  backgroundColor: '#F1F5F9',
                  border: 'none',
                  color: '#334155',
                  fontWeight: 700,
                  fontSize: 13,
                  borderRadius: 10,
                  padding: '9px 18px',
                  cursor: 'pointer',
                }}
              >
                {t('horses.viewFullProfile')}
              </button>
              <button
                type="button"
                onClick={() => {
                  setSelectedHorse(null);
                  navigate(ROUTES.CUSTOMER_VET_RECORDS);
                }}
                style={{
                  backgroundColor: '#F8FAFC',
                  border: '1px solid #E2E8F0',
                  color: '#475569',
                  fontWeight: 700,
                  fontSize: 13,
                  borderRadius: 10,
                  padding: '9px 18px',
                  cursor: 'pointer',
                }}
              >
                {t('horses.vetRecordBook')}
              </button>
              {(() => {
                const isCritical = calculateHorseRisk(selectedHorse, i18n.language).level === 'CRITICAL';
                if (isCritical) {
                  return (
                    <Tooltip title={t('horses.prohibitedTooltip')}>
                      <button
                        type="button"
                        disabled
                        style={{
                          backgroundColor: '#F1F5F9',
                          border: '1px solid #E2E8F0',
                          color: '#94A3B8',
                          fontWeight: 700,
                          fontSize: 13,
                          borderRadius: 10,
                          padding: '9px 20px',
                          cursor: 'not-allowed',
                        }}
                      >
                        {t('horses.prohibitedTransport')}
                      </button>
                    </Tooltip>
                  );
                }
                return (
                  <button
                    type="button"
                    onClick={() => {
                      setSelectedHorse(null);
                      navigate(ROUTES.CUSTOMER_BOOKING_NEW);
                    }}
                    style={{
                      backgroundColor: '#FBA919',
                      border: 'none',
                      color: '#FFFFFF',
                      fontWeight: 700,
                      fontSize: 13,
                      borderRadius: 10,
                      padding: '9px 20px',
                      cursor: 'pointer',
                      boxShadow: '0 2px 8px rgba(251, 169, 25, 0.25)',
                    }}
                  >
                    {t('horses.bookTransport')}
                  </button>
                );
              })()}
            </div>
          </div>
        )}
      </Modal>

      {/* ======================================================== */}
      {/* MODAL CHỈNH SỬA THÔNG TIN NGỰA TRỰC TIẾP TỪ DASHBOARD */}
      {/* ======================================================== */}
      <Modal
        title={
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 17, fontWeight: 700 }}>
            <span>✏️ {t('horses.editModalTitle')}</span>
            {editingHorse && <Tag color="gold">{editingHorse.Name}</Tag>}
          </div>
        }
        open={editModalVisible}
        onCancel={() => {
          setEditModalVisible(false);
          setEditingHorse(null);
        }}
        onOk={() => editForm.submit()}
        confirmLoading={editSubmitting}
        okText={t('horses.saveChanges')}
        cancelText={t('horses.cancel')}
        destroyOnClose
        width={680}
      >
        <Form
          form={editForm}
          layout="vertical"
          onFinish={handleSaveHorseEdit}
          style={{ marginTop: 16 }}
        >
          <Row gutter={16}>
            <Col xs={24} sm={12}>
              <Form.Item
                name="Name"
                label={<span style={{ fontWeight: 600 }}>{t('horses.fields.name')}</span>}
                rules={[{ required: true, message: t('horses.validation.nameRequired') }]}
              >
                <Input placeholder={t('horses.placeholders.name')} size="large" />
              </Form.Item>
            </Col>
            <Col xs={24} sm={12}>
              <Form.Item
                name="Breed"
                label={<span style={{ fontWeight: 600 }}>{t('horses.fields.breed')}</span>}
                rules={[{ required: true, message: t('horses.validation.breedRequired') }]}
              >
                <Select size="large">
                  <Select.Option value="Thoroughbred">
                    {isEn ? 'Thoroughbred' : 'Thoroughbred (Thuần chủng Anh)'}
                  </Select.Option>
                  <Select.Option value="Quarter Horse">Quarter Horse</Select.Option>
                  <Select.Option value="Arabian">
                    {isEn ? 'Arabian' : 'Arabian (Ngựa Ả Rập)'}
                  </Select.Option>
                  <Select.Option value="Warmblood">Warmblood</Select.Option>
                  <Select.Option value="Appaloosa">Appaloosa</Select.Option>
                  <Select.Option value="Standardbred">Standardbred</Select.Option>
                </Select>
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={16}>
            <Col xs={24} sm={8}>
              <Form.Item name="Gender" label={<span style={{ fontWeight: 600 }}>{t('horses.fields.gender')}</span>}>
                <Select size="large">
                  <Select.Option value="Stallion">{t('horses.genderOptions.stallion')}</Select.Option>
                  <Select.Option value="Mare">{t('horses.genderOptions.mare')}</Select.Option>
                  <Select.Option value="Gelding">{t('horses.genderOptions.gelding')}</Select.Option>
                </Select>
              </Form.Item>
            </Col>
            <Col xs={24} sm={8}>
              <Form.Item name="DateOfBirth" label={<span style={{ fontWeight: 600 }}>{t('horses.fields.dob')}</span>}>
                <DatePicker style={{ width: '100%' }} format="DD/MM/YYYY" size="large" />
              </Form.Item>
            </Col>
            <Col xs={24} sm={8}>
              <Form.Item name="Color" label={<span style={{ fontWeight: 600 }}>{t('horses.fields.color')}</span>}>
                <Input placeholder={t('horses.placeholders.color')} size="large" />
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={16}>
            <Col xs={24} sm={12}>
              <Form.Item name="MicrochipNumber" label={<span style={{ fontWeight: 600 }}>{t('horses.fields.microchip')}</span>}>
                <Input placeholder={t('horses.placeholders.microchip')} size="large" />
              </Form.Item>
            </Col>
            <Col xs={24} sm={12}>
              <Form.Item name="PassportNumber" label={<span style={{ fontWeight: 600 }}>{t('horses.fields.passport')}</span>}>
                <Input placeholder={t('horses.placeholders.passport')} size="large" />
              </Form.Item>
            </Col>
          </Row>

          {/* ĐÁNH GIÁ SỨC KHỎE */}
          <Form.Item
            name="HealthStatus"
            label={<span style={{ fontWeight: 600 }}>{t('horses.healthStatusForm')}</span>}
          >
            <Select
              size="large"
              options={[
                {
                  value: 'Excellent',
                  label: (
                    <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8 }}>
                      <HealthStatusTag status="Excellent" size="small" />
                      <span style={{ fontSize: 13 }}>{t('horses.healthOptions.excellent')}</span>
                    </div>
                  ),
                },
                {
                  value: 'Good',
                  label: (
                    <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8 }}>
                      <HealthStatusTag status="Good" size="small" />
                      <span style={{ fontSize: 13 }}>{t('horses.healthOptions.good')}</span>
                    </div>
                  ),
                },
                {
                  value: 'Attention',
                  label: (
                    <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8 }}>
                      <HealthStatusTag status="Attention" size="small" />
                      <span style={{ fontSize: 13 }}>{t('horses.healthOptions.attention')}</span>
                    </div>
                  ),
                },
                {
                  value: 'Critical',
                  label: (
                    <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8 }}>
                      <HealthStatusTag status="Critical" size="small" />
                      <span style={{ fontSize: 13, color: '#991B1B', fontWeight: 600 }}>{t('horses.healthOptions.critical')}</span>
                    </div>
                  ),
                },
              ]}
            />
          </Form.Item>

          <Form.Item
            name="SpecialCareRequirements"
            label={<span style={{ fontWeight: 600 }}>{t('horses.fields.specialCare')}</span>}
          >
            <Input.TextArea
              rows={3}
              placeholder={t('horses.specialCarePlaceholder')}
            />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
}
