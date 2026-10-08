import { useState, useEffect, useMemo } from 'react';
import {
  Alert,
  Button,
  Card,
  Checkbox,
  Col,
  DatePicker,
  Divider,
  Flex,
  Form,
  Input,
  InputNumber,
  Radio,
  Row,
  Select,
  Space,
  Steps,
  Table,
  Tag,
  Typography,
} from 'antd';
import {
  EnvironmentOutlined,
  CheckOutlined,
  ArrowLeftOutlined,
  ArrowRightOutlined,
  SendOutlined,
  CalendarOutlined,
  DollarOutlined,
  CarOutlined,
  RocketOutlined,
} from '@ant-design/icons';
import { useForm, Controller, useWatch } from 'react-hook-form';
import { useTranslation } from 'react-i18next';
import dayjs from 'dayjs';
import horseService from '@services/horseService';
import { useAuthStore } from '@features/auth/store/authStore';

const { Title, Text } = Typography;
const { TextArea } = Input;

const COUNTRY_OPTIONS = [
  { value: 'VN', label: '🇻🇳 Việt Nam (VN)' },
  { value: 'CN', label: '🇨🇳 Trung Quốc (CN)' },
  { value: 'TH', label: '🇹🇭 Thái Lan (TH)' },
  { value: 'SG', label: '🇸🇬 Singapore (SG)' },
  { value: 'MY', label: '🇲🇾 Malaysia (MY)' },
  { value: 'FR', label: '🇫🇷 Pháp (FR)' },
  { value: 'AE', label: '🇦🇪 UAE / Dubai (AE)' },
];

/**
 * Component Wizard 4 bước đặt chuyến vận chuyển ngựa đua
 *
 * @param {Object} props
 * @param {(payload: Partial<import('@types/database').Booking>) => Promise<void> | void} props.onSubmit
 * @param {() => void} props.onCancel
 * @param {boolean} [props.loading]
 * @returns {JSX.Element}
 */
export default function BookingWizard({ onSubmit, onCancel, loading = false }) {
  const { t } = useTranslation();
  const { user } = useAuthStore();
  const [currentStep, setCurrentStep] = useState(0);

  // Danh sách ngựa của khách hàng
  const [availableHorses, setAvailableHorses] = useState([]);
  const [loadingHorses, setLoadingHorses] = useState(true);

  // State các ngựa được chọn và cấu hình chuồng
  const [selectedHorseIds, setSelectedHorseIds] = useState([]);
  const [stallClasses, setStallClasses] = useState({});
  const [horseNotes, setHorseNotes] = useState({});

  const {
    control,
    trigger,
    getValues,
  } = useForm({
    defaultValues: {
      PickupAddress: 'Trang trại Yên Bài, Ba Vì, Hà Nội',
      PickupCountryCode: 'VN',
      DropoffAddress: 'Trường đua Tùng Hóa, TP. Quảng Châu',
      DropoffCountryCode: 'CN',
      DepartureDate: dayjs().add(7, 'day').format('YYYY-MM-DDTHH:mm:ssZ'),
      DeliveryDate: dayjs().add(9, 'day').format('YYYY-MM-DDTHH:mm:ssZ'),
      TransportMode: 'Ground',
      RequiresClimateControl: true,
      IsExpress: false,
      DeclaredValue: 100000,
      SpecialInstructions: '',
    },
    mode: 'onTouched',
  });

  const transportMode = useWatch({ control, name: 'TransportMode' });
  const requiresClimate = useWatch({ control, name: 'RequiresClimateControl' });

  // Tải danh sách ngựa của user khi mở wizard
  useEffect(() => {
    let isSubscribed = true;
    horseService
      .getHorses({ ownerId: user?.UserID || undefined })
      .then((res) => {
        if (isSubscribed) {
          const horsesList = res.data?.data || res.data || [];
          setAvailableHorses(horsesList);
          // Mặc định chọn con đầu tiên nếu có
          if (horsesList.length > 0) {
            setSelectedHorseIds([horsesList[0].HorseID]);
            setStallClasses({ [horsesList[0].HorseID]: 'Comfort' });
          }
        }
      })
      .finally(() => {
        if (isSubscribed) setLoadingHorses(false);
      });

    return () => {
      isSubscribed = false;
    };
  }, [user]);

  // Toggle chọn cá thể ngựa
  const handleToggleHorse = (horseId) => {
    setSelectedHorseIds((prev) => {
      if (prev.includes(horseId)) {
        return prev.filter((id) => id !== horseId);
      }
      // Nếu chọn thêm, gán mặc định hạng chuồng Comfort
      setStallClasses((s) => ({ ...s, [horseId]: s[horseId] || 'Comfort' }));
      return [...prev, horseId];
    });
  };

  // Tính toán bảng phân tích chi phí dự kiến
  const { quoteItems, totalCost } = useMemo(() => {
    const horseCount = selectedHorseIds.length || 1;
    const isAir = transportMode === 'Air';

    const items = [];

    // 1. Cước vận chuyển chính
    const baseFreightRate = isAir ? 3500 : 1200;
    items.push({
      key: 'freight',
      code: isAir ? 'FREIGHT_AIR' : 'FREIGHT_GROUND',
      name: isAir
        ? 'Cước bay quốc tế chuyên dụng (Air Stall)'
        : 'Cước vận chuyển xe thùng chuyên dụng',
      qty: horseCount,
      unitPrice: baseFreightRate,
      amount: horseCount * baseFreightRate,
    });

    // 2. Phụ phí hạng chuồng
    let stallSurcharge = 0;
    selectedHorseIds.forEach((id) => {
      const cls = stallClasses[id] || 'Shared';
      if (cls === 'Comfort') stallSurcharge += 200;
      if (cls === 'Private') stallSurcharge += 500;
    });
    if (stallSurcharge > 0) {
      items.push({
        key: 'stall',
        code: 'SUR_STALL_CLASS',
        name: 'Phụ phí nâng cấp hạng chuồng (Comfort/Private)',
        qty: 1,
        unitPrice: stallSurcharge,
        amount: stallSurcharge,
      });
    }

    // 3. Phụ phí điều hòa nhiệt độ
    if (requiresClimate) {
      const climateFee = isAir ? 200 : 350;
      items.push({
        key: 'climate',
        code: 'SUR_CLIMATE',
        name: 'Phụ phí duy trì điều hòa cabin (16-19°C)',
        qty: 1,
        unitPrice: climateFee,
        amount: climateFee,
      });
    }

    // 4. Phí thủ tục kiểm dịch và thông quan
    const clearanceFeePerHorse = isAir ? 350 : 250;
    items.push({
      key: 'clearance',
      code: 'FEE_CLEARANCE',
      name: 'Phí thủ tục hải quan & chứng nhận kiểm dịch biên giới',
      qty: horseCount,
      unitPrice: clearanceFeePerHorse,
      amount: horseCount * clearanceFeePerHorse,
    });

    const total = items.reduce((sum, item) => sum + item.amount, 0);
    return { quoteItems: items, totalCost: total };
  }, [selectedHorseIds, stallClasses, transportMode, requiresClimate]);

  // Chuyển sang bước kế tiếp sau khi kiểm tra hợp lệ
  const handleNext = async () => {
    if (currentStep === 0) {
      const isValid = await trigger([
        'PickupAddress',
        'PickupCountryCode',
        'DropoffAddress',
        'DropoffCountryCode',
      ]);
      if (!isValid) return;
    }

    if (currentStep === 1) {
      if (selectedHorseIds.length === 0) {
        return;
      }
    }

    if (currentStep === 2) {
      const isValid = await trigger(['DepartureDate', 'DeliveryDate']);
      if (!isValid) return;
    }

    setCurrentStep((prev) => Math.min(prev + 1, 3));
  };

  const handlePrev = () => {
    setCurrentStep((prev) => Math.max(prev - 1, 0));
  };

  // Submit toàn bộ đơn đặt chuyến
  const handleFinalSubmit = async () => {
    const values = getValues();
    const payload = {
      PickupAddress: values.PickupAddress?.trim(),
      PickupCountryCode: values.PickupCountryCode,
      DropoffAddress: values.DropoffAddress?.trim(),
      DropoffCountryCode: values.DropoffCountryCode,
      DepartureDate: values.DepartureDate,
      DeliveryDate: values.DeliveryDate || values.DepartureDate,
      TransportMode: values.TransportMode,
      RequiresClimateControl: Boolean(values.RequiresClimateControl),
      IsExpress: Boolean(values.IsExpress),
      DeclaredValue: Number(values.DeclaredValue) || null,
      SpecialInstructions: values.SpecialInstructions?.trim() || null,
      TotalHorses: selectedHorseIds.length,
      EstimatedCost: totalCost,
      CurrencyCode: 'USD',
      QuoteBreakdown: JSON.stringify(quoteItems),
      BookingHorses: selectedHorseIds.map((hId) => ({
        HorseID: hId,
        StallClass: stallClasses[hId] || 'Shared',
        Notes: horseNotes[hId]?.trim() || null,
      })),
    };

    await onSubmit(payload);
  };

  // Cấu hình các bước Stepper
  const stepItems = [
    { title: t('bookings.steps.where') || 'Lộ trình', icon: <EnvironmentOutlined /> },
    { title: t('bookings.steps.what') || 'Chọn ngựa', icon: <CheckOutlined /> },
    { title: t('bookings.steps.when') || 'Phương thức & Ngày', icon: <CalendarOutlined /> },
    { title: t('bookings.steps.review') || 'Báo giá & Xác nhận', icon: <DollarOutlined /> },
  ];

  return (
    <Card
      bordered
      style={{
        borderRadius: 16,
        boxShadow: '0 2px 10px rgba(0, 0, 0, 0.04)',
        borderColor: '#e2e8f0',
      }}
      styles={{ body: { padding: '32px 28px' } }}
    >
      {/* THANH TIẾN TRÌNH 4 BƯỚC */}
      <Steps
        current={currentStep}
        items={stepItems}
        style={{ marginBottom: 36 }}
      />

      {/* ======================================================== */}
      {/* BƯỚC 1: WHERE (LỘ TRÌNH ĐÓN & GIAO) */}
      {/* ======================================================== */}
      {currentStep === 0 && (
        <div>
          <Title level={4} style={{ margin: '0 0 20px', fontWeight: 700, color: '#0f172a' }}>
            {t('bookings.stepWhereTitle') || 'Thông tin lộ trình vận chuyển'}
          </Title>

          <Row gutter={24}>
            {/* Điểm đón */}
            <Col xs={24} md={12}>
              <Card
                bordered
                style={{
                  borderRadius: 12,
                  backgroundColor: '#f8fafc',
                  borderColor: '#e2e8f0',
                  marginBottom: 16,
                }}
              >
                <Tag color="orange" style={{ marginBottom: 12, fontWeight: 600 }}>
                  📍 {t('bookings.fields.pickupLocation') || 'ĐIỂM ĐÓN'}
                </Tag>

                <Controller
                  name="PickupCountryCode"
                  control={control}
                  rules={{ required: true }}
                  render={({ field }) => (
                    <Form.Item label={t('bookings.fields.pickupCountry') || 'Quốc gia xuất phát'} required>
                      <Select {...field} size="large" options={COUNTRY_OPTIONS} />
                    </Form.Item>
                  )}
                />

                <Controller
                  name="PickupAddress"
                  control={control}
                  rules={{ required: t('bookings.validation.pickupRequired') || 'Vui lòng nhập địa chỉ đón' }}
                  render={({ field, fieldState: { error } }) => (
                    <Form.Item
                      label={t('bookings.fields.pickupAddress') || 'Địa chỉ đón chi tiết'}
                      required
                      validateStatus={error ? 'error' : ''}
                      help={error?.message}
                    >
                      <Input
                        {...field}
                        size="large"
                        placeholder="Ví dụ: Trang trại Yên Bài, Ba Vì, Hà Nội"
                      />
                    </Form.Item>
                  )}
                />
              </Card>
            </Col>

            {/* Điểm giao */}
            <Col xs={24} md={12}>
              <Card
                bordered
                style={{
                  borderRadius: 12,
                  backgroundColor: '#f8fafc',
                  borderColor: '#e2e8f0',
                  marginBottom: 16,
                }}
              >
                <Tag color="green" style={{ marginBottom: 12, fontWeight: 600 }}>
                  🏁 {t('bookings.fields.deliveryLocation') || 'ĐIỂM GIAO'}
                </Tag>

                <Controller
                  name="DropoffCountryCode"
                  control={control}
                  rules={{ required: true }}
                  render={({ field }) => (
                    <Form.Item label={t('bookings.fields.dropoffCountry') || 'Quốc gia đến'} required>
                      <Select {...field} size="large" options={COUNTRY_OPTIONS} />
                    </Form.Item>
                  )}
                />

                <Controller
                  name="DropoffAddress"
                  control={control}
                  rules={{ required: t('bookings.validation.dropoffRequired') || 'Vui lòng nhập địa chỉ giao' }}
                  render={({ field, fieldState: { error } }) => (
                    <Form.Item
                      label={t('bookings.fields.dropoffAddress') || 'Địa chỉ giao chi tiết'}
                      required
                      validateStatus={error ? 'error' : ''}
                      help={error?.message}
                    >
                      <Input
                        {...field}
                        size="large"
                        placeholder="Ví dụ: Trường đua Tùng Hóa, TP. Quảng Châu"
                      />
                    </Form.Item>
                  )}
                />
              </Card>
            </Col>
          </Row>
        </div>
      )}

      {/* ======================================================== */}
      {/* BƯỚC 2: WHAT (CHỌN NGỰA & HẠNG CHUỒNG) */}
      {/* ======================================================== */}
      {currentStep === 1 && (
        <div>
          <Title level={4} style={{ margin: '0 0 20px', fontWeight: 700, color: '#0f172a' }}>
            {t('bookings.stepWhatTitle') || 'Chọn các cá thể ngựa tham gia chuyến đi'}
          </Title>

          {selectedHorseIds.length === 0 && (
            <Alert
              type="warning"
              showIcon
              message={t('bookings.validation.selectHorseRequired') || 'Vui lòng chọn ít nhất 1 cá thể ngựa để tiếp tục'}
              style={{ marginBottom: 20, borderRadius: 8 }}
            />
          )}

          {loadingHorses ? (
            <Text type="secondary">{t('common.loading')}</Text>
          ) : availableHorses.length === 0 ? (
            <Alert
              type="info"
              message={t('horses.emptyText') || 'Chưa có hồ sơ ngựa nào'}
              description={t('bookings.noHorsesHint') || 'Vui lòng thêm ngựa vào hồ sơ trước khi tạo đơn đặt chuyến.'}
              style={{ borderRadius: 8 }}
            />
          ) : (
            <Row gutter={[16, 16]}>
              {availableHorses.map((horse) => {
                const isSelected = selectedHorseIds.includes(horse.HorseID);
                return (
                  <Col key={horse.HorseID} xs={24} md={12}>
                    <div
                      style={{
                        padding: 16,
                        borderRadius: 12,
                        border: isSelected ? '2px solid #f59e0b' : '1px solid #e2e8f0',
                        backgroundColor: isSelected ? '#fffdf5' : '#ffffff',
                        cursor: 'pointer',
                        transition: 'all 0.2s ease',
                      }}
                      onClick={() => handleToggleHorse(horse.HorseID)}
                    >
                      <Flex justify="space-between" align="center" style={{ marginBottom: 8 }}>
                        <Checkbox
                          checked={isSelected}
                          onChange={() => handleToggleHorse(horse.HorseID)}
                          onClick={(e) => e.stopPropagation()}
                        >
                          <strong style={{ fontSize: 16, color: '#0f172a', marginLeft: 4 }}>
                            🐴 {horse.Name}
                          </strong>
                        </Checkbox>
                        <Tag color="blue">{horse.Breed}</Tag>
                      </Flex>

                      <div style={{ fontSize: 13, color: '#64748b', marginLeft: 28, marginBottom: 12 }}>
                        {t(`horses.genderOptions.${horse.Gender?.toLowerCase()}`) || horse.Gender} · Vi mạch:{' '}
                        <code>{horse.MicrochipNumber}</code>
                      </div>

                      {/* Tùy chọn hạng chuồng khi được tick chọn */}
                      {isSelected && (
                        <div
                          style={{
                            marginTop: 12,
                            paddingTop: 12,
                            borderTop: '1px dashed #e2e8f0',
                          }}
                          onClick={(e) => e.stopPropagation()}
                        >
                          <Row gutter={12}>
                            <Col span={12}>
                              <Form.Item
                                label={<span style={{ fontSize: 12 }}>Hạng chuồng</span>}
                                style={{ margin: 0 }}
                              >
                                <Select
                                  value={stallClasses[horse.HorseID] || 'Comfort'}
                                  onChange={(val) =>
                                    setStallClasses((prev) => ({ ...prev, [horse.HorseID]: val }))
                                  }
                                  options={[
                                    { value: 'Shared', label: 'Shared (Chuồng chung)' },
                                    { value: 'Comfort', label: 'Comfort (Tiện nghi)' },
                                    { value: 'Private', label: 'Private (VIP riêng)' },
                                  ]}
                                />
                              </Form.Item>
                            </Col>
                            <Col span={12}>
                              <Form.Item
                                label={<span style={{ fontSize: 12 }}>Ghi chú vị trí/thể trạng</span>}
                                style={{ margin: 0 }}
                              >
                                <Input
                                  value={horseNotes[horse.HorseID] || ''}
                                  onChange={(e) =>
                                    setHorseNotes((prev) => ({
                                      ...prev,
                                      [horse.HorseID]: e.target.value,
                                    }))
                                  }
                                  placeholder="Ví dụ: Khoang trái"
                                />
                              </Form.Item>
                            </Col>
                          </Row>
                        </div>
                      )}
                    </div>
                  </Col>
                );
              })}
            </Row>
          )}
        </div>
      )}

      {/* ======================================================== */}
      {/* BƯỚC 3: WHEN (PHƯƠNG THỨC & THỜI GIAN) */}
      {/* ======================================================== */}
      {currentStep === 2 && (
        <div>
          <Title level={4} style={{ margin: '0 0 20px', fontWeight: 700, color: '#0f172a' }}>
            {t('bookings.stepWhenTitle') || 'Phương thức vận chuyển & Thời gian'}
          </Title>

          {/* Chọn Phương thức vận chuyển */}
          <Controller
            name="TransportMode"
            control={control}
            render={({ field }) => (
              <Form.Item label={<strong style={{ fontSize: 15 }}>Phương thức vận chuyển</strong>}>
                <Radio.Group
                  {...field}
                  style={{ width: '100%', display: 'flex', gap: 16 }}
                >
                  <Radio.Button
                    value="Ground"
                    style={{
                      flex: 1,
                      height: 'auto',
                      padding: '16px 20px',
                      borderRadius: 12,
                      display: 'flex',
                      alignItems: 'center',
                      gap: 12,
                    }}
                  >
                    <CarOutlined style={{ fontSize: 24, color: '#f59e0b' }} />
                    <div>
                      <strong style={{ fontSize: 15, display: 'block' }}>
                        Đường bộ (Xe tải chuyên dụng)
                      </strong>
                      <Text type="secondary" style={{ fontSize: 12 }}>
                        {t('bookings.modes.groundDesc') || 'Xe thùng đệm khí, tuyến Việt - Trung - Thái'}
                      </Text>
                    </div>
                  </Radio.Button>

                  <Radio.Button
                    value="Air"
                    style={{
                      flex: 1,
                      height: 'auto',
                      padding: '16px 20px',
                      borderRadius: 12,
                      display: 'flex',
                      alignItems: 'center',
                      gap: 12,
                    }}
                  >
                    <RocketOutlined style={{ fontSize: 24, color: '#2563eb' }} />
                    <div>
                      <strong style={{ fontSize: 15, display: 'block' }}>
                        Đường hàng không (Air Stall Charter)
                      </strong>
                      <Text type="secondary" style={{ fontSize: 12 }}>
                        {t('bookings.modes.airDesc') || 'Khoang IATA LAR, bay thẳng quốc tế'}
                      </Text>
                    </div>
                  </Radio.Button>
                </Radio.Group>
              </Form.Item>
            )}
          />

          <Row gutter={24} style={{ marginTop: 20 }}>
            {/* Ngày khởi hành */}
            <Col xs={24} md={12}>
              <Controller
                name="DepartureDate"
                control={control}
                rules={{ required: 'Vui lòng chọn ngày khởi hành' }}
                render={({ field }) => (
                  <Form.Item label="Ngày xuất phát dự kiến" required>
                    <DatePicker
                      value={field.value ? dayjs(field.value) : null}
                      onChange={(date) =>
                        field.onChange(date ? date.format('YYYY-MM-DDTHH:mm:ssZ') : null)
                      }
                      disabledDate={(current) => current && current < dayjs().startOf('day')}
                      format="DD/MM/YYYY"
                      size="large"
                      style={{ width: '100%' }}
                    />
                  </Form.Item>
                )}
              />
            </Col>

            {/* Ngày giao đến */}
            <Col xs={24} md={12}>
              <Controller
                name="DeliveryDate"
                control={control}
                render={({ field }) => (
                  <Form.Item label="Ngày giao dự kiến tại đích">
                    <DatePicker
                      value={field.value ? dayjs(field.value) : null}
                      onChange={(date) =>
                        field.onChange(date ? date.format('YYYY-MM-DDTHH:mm:ssZ') : null)
                      }
                      disabledDate={(current) => current && current < dayjs().startOf('day')}
                      format="DD/MM/YYYY"
                      size="large"
                      style={{ width: '100%' }}
                    />
                  </Form.Item>
                )}
              />
            </Col>
          </Row>

          {/* Tùy chọn kỹ thuật & Bảo hiểm */}
          <Card
            bordered
            style={{
              backgroundColor: '#f8fafc',
              borderRadius: 12,
              marginTop: 12,
              marginBottom: 20,
            }}
          >
            <Row gutter={[24, 16]}>
              <Col xs={24} md={12}>
                <Controller
                  name="RequiresClimateControl"
                  control={control}
                  render={({ field }) => (
                    <Checkbox checked={field.value} onChange={(e) => field.onChange(e.target.checked)}>
                      <strong>{t('bookings.options.climateTitle') || 'Điều hòa nhiệt độ cabin (16-19°C)'}</strong>
                      <Text type="secondary" style={{ display: 'block', fontSize: 12, marginLeft: 24 }}>
                        {t('bookings.options.climateDesc') || 'Kiểm soát nhiệt độ cabin'}
                      </Text>
                    </Checkbox>
                  )}
                />
              </Col>

              <Col xs={24} md={12}>
                <Controller
                  name="IsExpress"
                  control={control}
                  render={({ field }) => (
                    <Checkbox checked={field.value} onChange={(e) => field.onChange(e.target.checked)}>
                      <strong>{t('bookings.options.expressTitle') || 'Vận chuyển hỏa tốc (Express Dispatch)'}</strong>
                      <Text type="secondary" style={{ display: 'block', fontSize: 12, marginLeft: 24 }}>
                        {t('bookings.options.expressDesc') || 'Thông quan ưu tiên, không ghép chuyến'}
                      </Text>
                    </Checkbox>
                  )}
                />
              </Col>

              <Col xs={24} md={12}>
                <Controller
                  name="DeclaredValue"
                  control={control}
                  render={({ field }) => (
                    <Form.Item label="Khai báo giá trị bảo hiểm (USD)" style={{ margin: 0 }}>
                      <InputNumber
                        {...field}
                        size="large"
                        style={{ width: '100%' }}
                        formatter={(val) => `$ ${val}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')}
                        parser={(val) => val.replace(/\$\s?|(,*)/g, '')}
                      />
                    </Form.Item>
                  )}
                />
              </Col>

              <Col xs={24} md={12}>
                <Controller
                  name="SpecialInstructions"
                  control={control}
                  render={({ field }) => (
                    <Form.Item label="Hướng dẫn thêm cho tài xế & tổ áp tải" style={{ margin: 0 }}>
                      <TextArea
                        {...field}
                        rows={2}
                        placeholder="Ví dụ: Cần dừng nghỉ mỗi 4 tiếng để kiểm tra nước uống..."
                      />
                    </Form.Item>
                  )}
                />
              </Col>
            </Row>
          </Card>
        </div>
      )}

      {/* ======================================================== */}
      {/* BƯỚC 4: REVIEW & SUBMIT (XEM LẠI & BÁO GIÁ) */}
      {/* ======================================================== */}
      {currentStep === 3 && (
        <div>
          <Title level={4} style={{ margin: '0 0 20px', fontWeight: 700, color: '#0f172a' }}>
            {t('bookings.stepReviewTitle') || 'Kiểm tra thông tin & Dự toán cước phí'}
          </Title>

          <Row gutter={24}>
            {/* Cột trái: Tóm tắt lộ trình & danh sách ngựa */}
            <Col xs={24} lg={13}>
              <Card
                bordered
                style={{
                  borderRadius: 12,
                  backgroundColor: '#f8fafc',
                  borderColor: '#e2e8f0',
                  marginBottom: 20,
                }}
              >
                <Title level={5} style={{ margin: '0 0 12px', color: '#0f172a' }}>
                  🗺️ Lộ trình & Phương tiện
                </Title>
                <div style={{ fontSize: 14, marginBottom: 8 }}>
                  <Text type="secondary">Điểm đón: </Text>
                  <strong>{getValues('PickupAddress')} ({getValues('PickupCountryCode')})</strong>
                </div>
                <div style={{ fontSize: 14, marginBottom: 8 }}>
                  <Text type="secondary">Điểm giao: </Text>
                  <strong>{getValues('DropoffAddress')} ({getValues('DropoffCountryCode')})</strong>
                </div>
                <div style={{ fontSize: 14, marginBottom: 8 }}>
                  <Text type="secondary">Phương thức: </Text>
                  <Tag color={transportMode === 'Air' ? 'blue' : 'orange'}>
                    {transportMode === 'Air' ? '✈ Hàng không (Air Stall)' : '🚛 Đường bộ (Xe thùng)'}
                  </Tag>
                  {requiresClimate && <Tag color="cyan">❄ Điều hòa cabin</Tag>}
                </div>
                <div style={{ fontSize: 14 }}>
                  <Text type="secondary">Khởi hành: </Text>
                  <strong>{dayjs(getValues('DepartureDate')).format('DD/MM/YYYY')}</strong>
                </div>

                <Divider style={{ margin: '14px 0' }} />

                <Title level={5} style={{ margin: '0 0 10px', color: '#0f172a' }}>
                  🐴 Danh sách cá thể ngựa ({selectedHorseIds.length})
                </Title>
                <Space direction="vertical" size="small" style={{ width: '100%' }}>
                  {availableHorses
                    .filter((h) => selectedHorseIds.includes(h.HorseID))
                    .map((h) => (
                      <Flex
                        key={h.HorseID}
                        justify="space-between"
                        align="center"
                        style={{
                          background: '#ffffff',
                          padding: '8px 12px',
                          borderRadius: 8,
                          border: '1px solid #e2e8f0',
                        }}
                      >
                        <div>
                          <strong>{h.Name}</strong> ({h.Breed})
                        </div>
                        <Tag color="gold">{stallClasses[h.HorseID] || 'Shared'}</Tag>
                      </Flex>
                    ))}
                </Space>
              </Card>
            </Col>

            {/* Cột phải: Bảng dự toán chi phí minh bạch */}
            <Col xs={24} lg={11}>
              <Card
                bordered
                style={{
                  borderRadius: 12,
                  borderColor: '#fde68a',
                  backgroundColor: '#fffdf5',
                }}
              >
                <Flex align="center" gap="small" style={{ marginBottom: 16 }}>
                  <DollarOutlined style={{ fontSize: 20, color: '#d97706' }} />
                  <Title level={5} style={{ margin: 0, color: '#92400e' }}>
                    Bảng phân tích chi phí dự kiến
                  </Title>
                </Flex>

                <Table
                  dataSource={quoteItems}
                  pagination={false}
                  size="small"
                  columns={[
                    {
                      title: 'Khoản mục',
                      dataIndex: 'name',
                      key: 'name',
                      render: (name) => <span style={{ fontSize: 12 }}>{name}</span>,
                    },
                    {
                      title: 'Số lượng',
                      dataIndex: 'qty',
                      key: 'qty',
                      align: 'center',
                      render: (q) => <span style={{ fontSize: 12 }}>{q}</span>,
                    },
                    {
                      title: 'Thành tiền',
                      dataIndex: 'amount',
                      key: 'amount',
                      align: 'right',
                      render: (val) => (
                        <strong style={{ fontSize: 12 }}>${val.toLocaleString()}</strong>
                      ),
                    },
                  ]}
                />

                <Divider style={{ margin: '16px 0' }} />

                <Flex justify="space-between" align="center">
                  <div>
                    <Text type="secondary" style={{ fontSize: 13, display: 'block' }}>
                      Tổng dự toán chi phí (USD):
                    </Text>
                    <Text style={{ fontSize: 11, color: '#94a3b8' }}>
                      Báo giá chính thức sẽ do Quản lý phê duyệt
                    </Text>
                  </div>
                  <div style={{ fontSize: 28, fontWeight: 800, color: '#d97706' }}>
                    ${totalCost.toLocaleString()}
                  </div>
                </Flex>
              </Card>
            </Col>
          </Row>
        </div>
      )}

      {/* THANH ĐIỀU HƯỚNG VÀ NÚT BẤM CỦA STEPPER */}
      <Divider style={{ margin: '28px 0 20px' }} />

      <Flex justify="space-between" align="center" wrap="wrap" gap="middle">
        <Button
          size="large"
          icon={<ArrowLeftOutlined />}
          onClick={currentStep === 0 ? onCancel : handlePrev}
          disabled={loading}
          style={{ minWidth: 120, borderRadius: 8 }}
        >
          {currentStep === 0 ? t('common.cancel') : t('common.back') || 'Quay lại'}
        </Button>

        {currentStep < 3 ? (
          <Button
            type="primary"
            size="large"
            icon={<ArrowRightOutlined />}
            onClick={handleNext}
            style={{
              minWidth: 140,
              borderRadius: 8,
              fontWeight: 600,
              backgroundColor: '#f59e0b',
              borderColor: '#f59e0b',
            }}
          >
            {t('common.next') || 'Tiếp tục'}
          </Button>
        ) : (
          <Button
            type="primary"
            size="large"
            icon={<SendOutlined />}
            loading={loading}
            onClick={handleFinalSubmit}
            style={{
              minWidth: 180,
              borderRadius: 8,
              fontWeight: 700,
              backgroundColor: '#f59e0b',
              borderColor: '#f59e0b',
            }}
          >
            {t('bookings.submitRequest') || 'Gửi yêu cầu đặt chuyến'}
          </Button>
        )}
      </Flex>
    </Card>
  );
}
