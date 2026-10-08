import { useState } from 'react';
import {
  Button,
  Card,
  Col,
  DatePicker,
  Flex,
  Form,
  Image,
  Input,
  Row,
  Select,
  Space,
  Typography,
} from 'antd';
import {
  SaveOutlined,
  CloseOutlined,
  InfoCircleOutlined,
  MedicineBoxOutlined,
  PictureOutlined,
} from '@ant-design/icons';
import { useForm, Controller, useWatch } from 'react-hook-form';
import { useTranslation } from 'react-i18next';
import dayjs from 'dayjs';
import { HealthStatusTag } from '@utils/horseHealth';

const { Title, Text } = Typography;
const { TextArea } = Input;

/**
 * Danh sách các giống ngựa phổ biến trong vận chuyển thi đấu quốc tế
 */
const BREED_KEYS = [
  'Thoroughbred',
  'Quarter Horse',
  'Arabian',
  'Warmblood',
  'Appaloosa',
  'Standardbred',
  'Andalusian',
];

/**
 * Component Form nhập liệu hồ sơ ngựa đua
 * Sử dụng react-hook-form quản lý state và validation kết hợp Ant Design UI components
 *
 * @param {Object} props
 * @param {(data: import('@types/database').Horse) => Promise<void> | void} props.onSubmit - Callback xử lý submit form
 * @param {() => void} props.onCancel - Callback khi bấm nút hủy
 * @param {Partial<import('@types/database').Horse>} [props.initialValues] - Giá trị khởi tạo khi chỉnh sửa
 * @param {boolean} [props.loading] - Trạng thái đang gửi dữ liệu
 * @returns {JSX.Element}
 */
export default function AddHorseForm({
  onSubmit,
  onCancel,
  initialValues,
  loading = false,
}) {
  const { t } = useTranslation();
  const [previewError, setPreviewError] = useState(false);

  const {
    control,
    handleSubmit,
    formState: { isSubmitting },
  } = useForm({
    defaultValues: {
      Name: initialValues?.Name || '',
      Breed: initialValues?.Breed || 'Thoroughbred',
      Gender: initialValues?.Gender || 'Stallion',
      DateOfBirth: initialValues?.DateOfBirth || null,
      MicrochipNumber: initialValues?.MicrochipNumber || '',
      PassportNumber: initialValues?.PassportNumber || '',
      Color: initialValues?.Color || '',
      PhotoUrl: initialValues?.PhotoUrl || '',
      HealthStatus: initialValues?.HealthStatus || 'Good',
      SpecialCareRequirements: initialValues?.SpecialCareRequirements || '',
    },
    mode: 'onTouched',
  });

  const photoUrlValue = useWatch({ control, name: 'PhotoUrl' });

  /**
   * Xử lý chuyển đổi dữ liệu trước khi gửi lên cha
   * @param {Object} data
   */
  const handleFormSubmit = async (data) => {
    const payload = {
      ...data,
      Name: data.Name?.trim(),
      MicrochipNumber: data.MicrochipNumber?.trim(),
      PassportNumber: data.PassportNumber?.trim(),
      Color: data.Color?.trim() || '',
      PhotoUrl: data.PhotoUrl?.trim() || null,
      HealthStatus: data.HealthStatus || 'Good',
      SpecialCareRequirements: data.SpecialCareRequirements?.trim() || null,
    };
    await onSubmit(payload);
  };

  const isFormLoading = loading || isSubmitting;

  return (
    <form onSubmit={handleSubmit(handleFormSubmit)} noValidate>
      <Space orientation="vertical" size="large" style={{ width: '100%' }}>
        {/* KHỐI 1: THÔNG TIN ĐỊNH DANH CƠ BẢN */}
        <Card
          bordered
          style={{
            borderRadius: 12,
            boxShadow: '0 1px 3px rgba(0, 0, 0, 0.05)',
            borderColor: '#e2e8f0',
          }}
          styles={{ body: { padding: '28px 24px' } }}
        >
          <Flex align="center" gap="small" style={{ marginBottom: 6 }}>
            <InfoCircleOutlined style={{ fontSize: 18, color: '#f59e0b' }} />
            <Title level={4} style={{ margin: 0, fontWeight: 700, color: '#0f172a' }}>
              {t('horses.sections.basicInfo')}
            </Title>
          </Flex>
          <Text type="secondary" style={{ display: 'block', marginBottom: 24, fontSize: 14 }}>
            {t('horses.sections.basicInfoDesc')}
          </Text>

          <Row gutter={[24, 8]}>
            {/* Tên ngựa */}
            <Col xs={24} md={12}>
              <Controller
                name="Name"
                control={control}
                rules={{
                  required: t('horses.validation.nameRequired'),
                  maxLength: {
                    value: 100,
                    message: t('horses.validation.nameMaxLength'),
                  },
                }}
                render={({ field, fieldState: { error } }) => (
                  <Form.Item
                    label={<span style={{ fontWeight: 600 }}>{t('horses.fields.name')}</span>}
                    required
                    validateStatus={error ? 'error' : ''}
                    help={error?.message}
                    style={{ marginBottom: 20 }}
                  >
                    <Input
                      {...field}
                      placeholder={t('horses.placeholders.name')}
                      size="large"
                      disabled={isFormLoading}
                    />
                  </Form.Item>
                )}
              />
            </Col>

            {/* Giống ngựa */}
            <Col xs={24} md={12}>
              <Controller
                name="Breed"
                control={control}
                rules={{
                  required: t('horses.validation.breedRequired'),
                }}
                render={({ field, fieldState: { error } }) => (
                  <Form.Item
                    label={<span style={{ fontWeight: 600 }}>{t('horses.fields.breed')}</span>}
                    required
                    validateStatus={error ? 'error' : ''}
                    help={error?.message}
                    style={{ marginBottom: 20 }}
                  >
                    <Select
                      {...field}
                      size="large"
                      showSearch
                      placeholder={t('horses.placeholders.breed')}
                      options={BREED_KEYS.map((k) => ({
                        value: k,
                        label: t(`horses.breedOptions.${k}`) || k,
                      }))}
                      disabled={isFormLoading}
                    />
                  </Form.Item>
                )}
              />
            </Col>

            {/* Giới tính */}
            <Col xs={24} sm={12} md={8}>
              <Controller
                name="Gender"
                control={control}
                rules={{
                  required: t('horses.validation.genderRequired'),
                }}
                render={({ field, fieldState: { error } }) => (
                  <Form.Item
                    label={<span style={{ fontWeight: 600 }}>{t('horses.fields.gender')}</span>}
                    required
                    validateStatus={error ? 'error' : ''}
                    help={error?.message}
                    style={{ marginBottom: 20 }}
                  >
                    <Select
                      {...field}
                      size="large"
                      options={[
                        {
                          value: 'Stallion',
                          label: t('horses.genderOptions.stallion'),
                        },
                        {
                          value: 'Mare',
                          label: t('horses.genderOptions.mare'),
                        },
                        {
                          value: 'Gelding',
                          label: t('horses.genderOptions.gelding'),
                        },
                      ]}
                      disabled={isFormLoading}
                    />
                  </Form.Item>
                )}
              />
            </Col>

            {/* Ngày sinh */}
            <Col xs={24} sm={12} md={8}>
              <Controller
                name="DateOfBirth"
                control={control}
                rules={{
                  required: t('horses.validation.dobRequired'),
                }}
                render={({ field, fieldState: { error } }) => (
                  <Form.Item
                    label={<span style={{ fontWeight: 600 }}>{t('horses.fields.dob')}</span>}
                    required
                    validateStatus={error ? 'error' : ''}
                    help={error?.message}
                    style={{ marginBottom: 20 }}
                  >
                    <DatePicker
                      value={field.value ? dayjs(field.value) : null}
                      onChange={(date) => {
                        field.onChange(date ? date.format('YYYY-MM-DD') : null);
                      }}
                      disabledDate={(current) =>
                        current && current > dayjs().endOf('day')
                      }
                      format="DD/MM/YYYY"
                      placeholder={t('horses.placeholders.dob')}
                      style={{ width: '100%' }}
                      size="large"
                      disabled={isFormLoading}
                    />
                  </Form.Item>
                )}
              />
            </Col>

            {/* Màu lông */}
            <Col xs={24} md={8}>
              <Controller
                name="Color"
                control={control}
                render={({ field, fieldState: { error } }) => (
                  <Form.Item
                    label={<span style={{ fontWeight: 600 }}>{t('horses.fields.color')}</span>}
                    validateStatus={error ? 'error' : ''}
                    help={error?.message}
                    style={{ marginBottom: 20 }}
                  >
                    <Input
                      {...field}
                      placeholder={t('horses.placeholders.color')}
                      size="large"
                      disabled={isFormLoading}
                    />
                  </Form.Item>
                )}
              />
            </Col>

            {/* Số vi mạch sinh trắc học */}
            <Col xs={24} md={12}>
              <Controller
                name="MicrochipNumber"
                control={control}
                rules={{
                  required: t('horses.validation.microchipRequired'),
                  pattern: {
                    value: /^[0-9A-Za-z-]{9,30}$/,
                    message: t('horses.validation.microchipFormat'),
                  },
                }}
                render={({ field, fieldState: { error } }) => (
                  <Form.Item
                    label={<span style={{ fontWeight: 600 }}>{t('horses.fields.microchip')}</span>}
                    required
                    validateStatus={error ? 'error' : ''}
                    help={error?.message}
                    style={{ marginBottom: 20 }}
                  >
                    <Input
                      {...field}
                      placeholder={t('horses.placeholders.microchip')}
                      size="large"
                      disabled={isFormLoading}
                    />
                  </Form.Item>
                )}
              />
            </Col>

            {/* Số hộ chiếu FEI */}
            <Col xs={24} md={12}>
              <Controller
                name="PassportNumber"
                control={control}
                rules={{
                  required: t('horses.validation.passportRequired'),
                  maxLength: {
                    value: 50,
                    message: t('horses.validation.passportMaxLength'),
                  },
                }}
                render={({ field, fieldState: { error } }) => (
                  <Form.Item
                    label={<span style={{ fontWeight: 600 }}>{t('horses.fields.passport')}</span>}
                    required
                    validateStatus={error ? 'error' : ''}
                    help={error?.message}
                    style={{ marginBottom: 20 }}
                  >
                    <Input
                      {...field}
                      placeholder={t('horses.placeholders.passport')}
                      size="large"
                      disabled={isFormLoading}
                    />
                  </Form.Item>
                )}
              />
            </Col>

            {/* Ảnh đại diện / nhận diện */}
            <Col xs={24}>
              <Controller
                name="PhotoUrl"
                control={control}
                render={({ field, fieldState: { error } }) => (
                  <Form.Item
                    label={<span style={{ fontWeight: 600 }}>{t('horses.fields.photoUrl')}</span>}
                    validateStatus={error ? 'error' : ''}
                    help={error?.message}
                    style={{ marginBottom: 20 }}
                  >
                    <Input
                      {...field}
                      placeholder={t('horses.placeholders.photoUrl')}
                      size="large"
                      prefix={<PictureOutlined style={{ color: '#94a3b8' }} />}
                      disabled={isFormLoading}
                      onChange={(e) => {
                        setPreviewError(false);
                        field.onChange(e);
                      }}
                    />
                  </Form.Item>
                )}
              />

              {/* Box xem trước ảnh nếu người dùng dán URL hợp lệ */}
              {photoUrlValue && !previewError && (
                <div
                  style={{
                    marginTop: -8,
                    marginBottom: 20,
                    padding: 12,
                    background: '#f8fafc',
                    borderRadius: 8,
                    border: '1px dashed #cbd5e1',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: 16,
                  }}
                >
                  <Image
                    src={photoUrlValue}
                    alt="Preview"
                    width={80}
                    height={80}
                    style={{ objectFit: 'cover', borderRadius: 8 }}
                    onError={() => setPreviewError(true)}
                  />
                  <div>
                    <Text strong style={{ fontSize: 13, color: '#0f172a' }}>
                      {t('horses.photoPreviewTitle')}
                    </Text>
                    <br />
                    <Text type="secondary" style={{ fontSize: 12 }}>
                      {t('horses.photoPreviewHint')}
                    </Text>
                  </div>
                </div>
              )}
            </Col>
          </Row>
        </Card>

        {/* KHỐI 2: CHĂM SÓC ĐẶC BIỆT & THÚ Y */}
        <Card
          bordered
          style={{
            borderRadius: 12,
            boxShadow: '0 1px 3px rgba(0, 0, 0, 0.05)',
            borderColor: '#e2e8f0',
          }}
          styles={{ body: { padding: '28px 24px' } }}
        >
          <Flex align="center" gap="small" style={{ marginBottom: 6 }}>
            <MedicineBoxOutlined style={{ fontSize: 18, color: '#f59e0b' }} />
            <Title level={4} style={{ margin: 0, fontWeight: 700, color: '#0f172a' }}>
              {t('horses.sections.specialCare')}
            </Title>
          </Flex>
          <Text type="secondary" style={{ display: 'block', marginBottom: 24, fontSize: 14 }}>
            {t('horses.sections.specialCareDesc')}
          </Text>

          {/* Đánh giá tình trạng sức khỏe ban đầu */}
          <Controller
            name="HealthStatus"
            control={control}
            render={({ field }) => (
              <Form.Item
                label={
                  <span style={{ fontWeight: 600 }}>
                    {t('horses.columns.health') || 'Đánh giá sức khỏe (Health Status)'}
                  </span>
                }
                style={{ marginBottom: 20 }}
              >
                <Select
                  {...field}
                  size="large"
                  disabled={isFormLoading}
                  options={[
                    {
                      value: 'Excellent',
                      label: (
                        <div style={{ display: 'inline-flex', alignItems: 'center', gap: 10 }}>
                          <HealthStatusTag status="Excellent" size="small" />
                          <span style={{ fontSize: 13, color: '#334155' }}>
                            {t('horses.healthDescriptions.excellent')}
                          </span>
                        </div>
                      ),
                    },
                    {
                      value: 'Good',
                      label: (
                        <div style={{ display: 'inline-flex', alignItems: 'center', gap: 10 }}>
                          <HealthStatusTag status="Good" size="small" />
                          <span style={{ fontSize: 13, color: '#334155' }}>
                            {t('horses.healthDescriptions.good')}
                          </span>
                        </div>
                      ),
                    },
                    {
                      value: 'Attention',
                      label: (
                        <div style={{ display: 'inline-flex', alignItems: 'center', gap: 10 }}>
                          <HealthStatusTag status="Attention" size="small" />
                          <span style={{ fontSize: 13, color: '#334155' }}>
                            {t('horses.healthDescriptions.attention')}
                          </span>
                        </div>
                      ),
                    },
                  ]}
                />
              </Form.Item>
            )}
          />

          <Controller
            name="SpecialCareRequirements"
            control={control}
            render={({ field, fieldState: { error } }) => (
              <Form.Item
                label={<span style={{ fontWeight: 600 }}>{t('horses.fields.specialCare')}</span>}
                validateStatus={error ? 'error' : ''}
                help={error?.message}
                style={{ marginBottom: 8 }}
              >
                <TextArea
                  {...field}
                  rows={4}
                  placeholder={t('horses.placeholders.specialCare')}
                  disabled={isFormLoading}
                  showCount
                  maxLength={1000}
                />
              </Form.Item>
            )}
          />
        </Card>

        {/* THANH HÀNH ĐỘNG NÚT BẤM (Cancel bên trái, Save bên phải) */}
        <Card
          bordered
          style={{
            borderRadius: 12,
            borderColor: '#e2e8f0',
            backgroundColor: '#ffffff',
          }}
          styles={{ body: { padding: '16px 24px' } }}
        >
          <Flex justify="space-between" align="center" wrap="wrap" gap="middle">
            <Button
              size="large"
              icon={<CloseOutlined />}
              onClick={onCancel}
              disabled={isFormLoading}
              style={{ minWidth: 120, borderRadius: 8 }}
            >
              {t('common.cancel')}
            </Button>

            <Button
              type="primary"
              htmlType="submit"
              size="large"
              icon={<SaveOutlined />}
              loading={isFormLoading}
              style={{
                minWidth: 160,
                borderRadius: 8,
                fontWeight: 600,
                backgroundColor: '#f59e0b',
                borderColor: '#f59e0b',
              }}
            >
              {t('horses.saveHorse')}
            </Button>
          </Flex>
        </Card>
      </Space>
    </form>
  );
}
