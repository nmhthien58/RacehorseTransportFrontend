import { useState, useEffect, useCallback } from 'react';
import {
  Button,
  Col,
  Flex,
  Modal,
  Row,
  Spin,
  Tag,
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
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import PageHeader from '@components/layout/PageHeader';
import { horseService } from '@services/horseService';
import { getErrorMessage } from '@utils/apiHelpers';
import { bookingService } from '@services/bookingService';
import { trackingService } from '@services/trackingService';
import { unwrapData, unwrapList } from '@utils/apiHelpers';
import { ROUTES } from '@routes/routes';
import {
  calculateHorseRisk,
  HealthStatusTag,
  RiskBadge,
} from '@utils/horseHealth';
import EditHorseModal from '@features/customer/components/EditHorseModal';

const { Text, Title } = Typography;

const formatTempRange = (min, max) => `${min}°C - ${max}°C`;

/**
 * Trang Customer Dashboard tái tạo chính xác theo Frame 65:25 Figma
 * Đồng bộ chuẩn camelCase với API Contract và loại bỏ enum tự chế
 * @returns {JSX.Element}
 */
export default function CustomerDashboard() {
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();

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

  const handleOpenEditHorse = (horse) => {
    setEditingHorse(horse);
    setEditModalVisible(true);
  };

  const handleSaveHorseEdit = async (values) => {
    try {
      setEditSubmitting(true);
      const horseId = editingHorse.horseId || editingHorse.HorseID;
      const updated = await horseService.updateHorse(horseId, values);
      message.success(t('horses.updateHorseSuccess'));
      const updatedData = updated?.data || updated || { ...editingHorse, ...values };
      setEditingHorse(null);
      setEditModalVisible(false);
      setSelectedHorse(updatedData);
      loadData();
    } catch (err) {
      console.error(err);
      message.error(getErrorMessage(err, t('horses.updateHorseError')));
    } finally {
      setEditSubmitting(false);
    }
  };

  const loadData = useCallback(() => {
    // Customer không được gọi GET /trips (403) -> lấy chuyến qua GET /tracking/bookings/{id} của từng đơn đã duyệt
    Promise.all([
      horseService.getHorses({ size: 100 }),
      bookingService.getBookings({ sort: '-createdAt', size: 100 }),
    ])
      .then(async ([horseRes, bookingRes]) => {
        const bookingList = unwrapList(bookingRes);
        const approved = bookingList.filter((b) => b.status === 'Approved');
        const trackings = await Promise.all(
          approved.map((b) => trackingService.getBookingTracking(b.bookingId).then(unwrapData).catch(() => null)),
        );
        const tripList = trackings
          .filter(Boolean)
          .flatMap((tr) => (tr.trips || []).map((trip) => ({ ...trip, bookingCode: tr.bookingCode })));
        return [horseRes, bookingList, tripList];
      })
      .then(([horseRes, bookingList, tripList]) => {
        const rawHorses = unwrapList(horseRes);
        // Khử trùng lặp ngựa theo ID
        const horseMap = new Map();
        rawHorses.forEach((h) => {
          const id = h.horseId || h.HorseID;
          if (id && !horseMap.has(id)) {
            horseMap.set(id, h);
          }
        });
        setHorses(Array.from(horseMap.values()));
        setBookings(bookingList);
        setTrips(tripList);
      })
      .catch((err) => {
        console.error(err);
      })
      .finally(() => {
        setLoading(false);
      });
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Chuyến đã lấy theo từng đơn của khách nên đều thuộc về khách này
  const customerTrips = trips;

  const activeTripsCount = customerTrips.filter((tr) => {
    const status = tr.overallStatus || tr.status || tr.Status;
    return status === 'InTransit' || status === 'Scheduled';
  }).length;

  const openBookingsCount = bookings.filter((bk) => {
    const status = bk.status || bk.Status;
    return status === 'Submitted' || status === 'Approved';
  }).length;

  const displayHorses = horses.map((h) => {
    return {
      id: h.horseId || h.HorseID,
      name: h.name || h.Name,
      breed: h.breed || h.Breed,
      gender: h.gender || h.Gender,
      dateOfBirth: h.dateOfBirth || h.DateOfBirth,
      microchipNumber: h.microchipNumber || h.MicrochipNumber,
      passportNumber: h.passportNumber || h.PassportNumber,
      color: h.color || h.Color,
      specialCareRequirements: h.specialCareRequirements || h.SpecialCareRequirements,
      isActive: h.isActive ?? h.IsActive ?? true,
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
          <Button
            type="primary"
            size="large"
            icon={<PlusOutlined />}
            onClick={() => navigate(ROUTES.CUSTOMER_BOOKING_NEW)}
            style={{
              backgroundColor: '#FBA919',
              borderColor: '#FBA919',
              color: '#0f172a',
              fontWeight: 700,
              fontSize: 15,
              borderRadius: 9999,
              height: 42,
              padding: '0 24px',
              boxShadow: '0 2px 8px rgba(251, 169, 25, 0.25)',
            }}
          >
            {String(t('dashboard.bookBtn') || 'Đặt chuyến').replace(/^\+\s*/, '')}
          </Button>
        }
      />

      <Spin spinning={loading}>
        {/* Hàng 4 thẻ Metric bo tròn 24px có icon tròn phía trên */}
        <Row gutter={[20, 20]} style={{ marginBottom: 36 }}>
          {[
            {
              key: 'activeTrips',
              route: `${ROUTES.CUSTOMER_BOOKINGS}?stage=InTransit`,
              count: activeTripsCount,
              label: `${t('dashboard.metrics.activeTrips')} →`,
              icon: <AppstoreOutlined />,
              iconBg: '#FEF3C7',
              iconColor: '#D97706',
              hoverBorder: '#F59E0B',
              hoverBg: '#FFFBEB',
              hoverShadow: 'rgba(217, 119, 6, 0.15)',
            },
            {
              key: 'openRequests',
              route: ROUTES.CUSTOMER_BOOKINGS,
              count: openBookingsCount,
              label: `${t('dashboard.metrics.openRequests')} →`,
              icon: <ClockCircleOutlined />,
              iconBg: '#EFF6FF',
              iconColor: '#2563EB',
              hoverBorder: '#3B82F6',
              hoverBg: '#EFF6FF',
              hoverShadow: 'rgba(37, 99, 235, 0.15)',
            },
            {
              key: 'bidsReceived',
              route: ROUTES.CUSTOMER_BOOKINGS,
              count: 0,
              label: `${t('dashboard.metrics.bidsReceived')} →`,
              icon: <StarOutlined />,
              iconBg: '#FEF9C3',
              iconColor: '#CA8A04',
              hoverBorder: '#EAB308',
              hoverBg: '#FEFCE8',
              hoverShadow: 'rgba(202, 138, 4, 0.15)',
            },
            {
              key: 'myHorses',
              route: ROUTES.CUSTOMER_HORSES,
              count: horses.length,
              label: `${t('dashboard.metrics.myHorses')} →`,
              icon: <FieldTimeOutlined />,
              iconBg: '#EFF6FF',
              iconColor: '#2563EB',
              hoverBorder: '#10B981',
              hoverBg: '#ECFDF5',
              hoverShadow: 'rgba(16, 185, 129, 0.15)',
            },
          ].map((item) => (
            <Col xs={12} sm={12} md={6} key={item.key}>
              <div
                role="button"
                tabIndex={0}
                onClick={() => navigate(item.route)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    navigate(item.route);
                  }
                }}
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
                  e.currentTarget.style.boxShadow = `0 12px 30px ${item.hoverShadow}`;
                  e.currentTarget.style.borderColor = item.hoverBorder;
                  e.currentTarget.style.backgroundColor = item.hoverBg;
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = 'translateY(0) scale(1)';
                  e.currentTarget.style.boxShadow = '0 4px 24px rgba(0, 0, 0, 0.02)';
                  e.currentTarget.style.borderColor = '#F1F5F9';
                  e.currentTarget.style.backgroundColor = '#ffffff';
                }}
              >
                <div
                  style={{
                    width: 44,
                    height: 44,
                    borderRadius: '50%',
                    backgroundColor: item.iconBg,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: item.iconColor,
                    fontSize: 18,
                  }}
                >
                  {item.icon}
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
                  {item.count}
                </div>
                <div style={{ fontSize: 15, fontWeight: 500, color: '#475569' }}>
                  {item.label}
                </div>
              </div>
            </Col>
          ))}
        </Row>

        {/* Khối My Horses */}
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

                  <Flex vertical align="end" gap={4}>
                    <RiskBadge risk={calculateHorseRisk(item.raw, i18n.language)} size="small" />
                    <span style={{ fontSize: 12, color: '#64748b' }}>
                      {item.gender}
                    </span>
                  </Flex>
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
        {selectedHorse && (() => {
          const horseRisk = calculateHorseRisk(selectedHorse, i18n.language);
          const isCritical = horseRisk.level === 'CRITICAL';
          return (
            <div>
              {/* Header thông tin con ngựa */}
              <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 16 }}>
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
                      {selectedHorse.name || selectedHorse.Name}
                    </span>
                    <Tag color="gold" style={{ borderRadius: 6, fontWeight: 700, fontSize: 12 }}>
                      {selectedHorse.breed || selectedHorse.Breed}
                    </Tag>
                    <HealthStatusTag
                      status={selectedHorse.healthStatus || selectedHorse.HealthStatus || 'Good'}
                      size="small"
                    />
                    <RiskBadge risk={horseRisk} size="small" />
                  </div>
                  <div style={{ fontSize: 13, color: '#64748B', marginTop: 4 }}>
                    {t('horses.fields.microchip')}: {selectedHorse.microchipNumber || selectedHorse.MicrochipNumber || '---'}
                  </div>
                </div>
              </div>

              {/* Báo động nếu nguy kịch */}
              {isCritical && (
                <div
                  style={{
                    backgroundColor: '#FEF2F2',
                    border: '1.5px solid #FECACA',
                    borderRadius: 12,
                    padding: '12px 16px',
                    marginBottom: 16,
                    display: 'flex',
                    alignItems: 'center',
                    gap: 12,
                  }}
                >
                  <div style={{ fontSize: 22 }}>⛔</div>
                  <div>
                    <div style={{ fontSize: 13, fontWeight: 800, color: '#991B1B' }}>
                      {isEn ? 'TRANSPORT PROHIBITED (NON-FIT-TO-TRAVEL)' : 'CẤM VẬN CHUYỂN (NON-FIT-TO-TRAVEL)'}
                    </div>
                    <div style={{ fontSize: 12, color: '#B91C1C', marginTop: 2 }}>
                      {isEn
                        ? 'This horse is assessed as Critical Risk and cannot be transported until authorized by a veterinarian.'
                        : 'Ngựa thuộc nhóm Rủi ro nguy cấp, không đủ điều kiện an toàn vận chuyển theo quy chuẩn FEI.'}
                    </div>
                  </div>
                </div>
              )}

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
                      {selectedHorse.microchipNumber || selectedHorse.MicrochipNumber || '---'}
                    </div>
                  </Col>
                  <Col span={12}>
                    <div style={{ fontSize: 11, color: '#64748B', fontWeight: 700, letterSpacing: '0.04em' }}>
                      {t('horses.fields.passport').toUpperCase()}
                    </div>
                    <div style={{ fontSize: 13.5, fontWeight: 700, color: '#0F172A', marginTop: 2 }}>
                      {selectedHorse.passportNumber || selectedHorse.PassportNumber || t('horses.notIssued')}
                    </div>
                  </Col>
                  <Col span={12}>
                    <div style={{ fontSize: 11, color: '#64748B', fontWeight: 700, letterSpacing: '0.04em' }}>
                      {t('horses.fields.color')}
                    </div>
                    <div style={{ fontSize: 13, color: '#334155', marginTop: 2 }}>
                      {selectedHorse.color || selectedHorse.Color || t('horses.noColor')}
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
              {(selectedHorse.specialCareRequirements || selectedHorse.SpecialCareRequirements) && (
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
                      {selectedHorse.specialCareRequirements || selectedHorse.SpecialCareRequirements}
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
                    const id = selectedHorse.horseId || selectedHorse.HorseID;
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
                {isCritical ? (
                  <button
                    type="button"
                    disabled
                    style={{
                      backgroundColor: '#F1F5F9',
                      border: '1px solid #CBD5E1',
                      color: '#94A3B8',
                      fontWeight: 700,
                      fontSize: 13,
                      borderRadius: 10,
                      padding: '9px 20px',
                      cursor: 'not-allowed',
                    }}
                  >
                    ⛔ {isEn ? 'Non-Fit-to-Travel' : 'Cấm vận chuyển'}
                  </button>
                ) : (
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
                )}
              </div>
            </div>
          );
        })()}
      </Modal>

      {/* MODAL CHỈNH SỬA THÔNG TIN NGỰA (Dùng chung) */}
      <EditHorseModal
        open={editModalVisible}
        onCancel={() => {
          setEditModalVisible(false);
          setEditingHorse(null);
        }}
        onSave={handleSaveHorseEdit}
        horse={editingHorse}
        confirmLoading={editSubmitting}
      />
    </div>
  );
}
