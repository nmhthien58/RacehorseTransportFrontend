import { useState } from 'react';
import {
  Button,
  Card,
  Col,
  DatePicker,
  Flex,
  Form,
  Input,
  Row,
  Select,
  Space,
  Typography,
} from 'antd';
import {
  InfoCircleOutlined,
  MedicineBoxOutlined,
} from '@ant-design/icons';
import { useForm, Controller } from 'react-hook-form';
import { useTranslation } from 'react-i18next';
import dayjs from 'dayjs';
import { MICROCHIP_PATTERN, UELN_PATTERN } from '@utils/constants';
import HorsePhotoPicker from './HorsePhotoPicker';

const { Title, Text } = Typography;
const { TextArea } = Input;

/**
 * Danh sách các giống ngựa phổ biến trong vận chuyển thi đấu quốc tế
 */
const BREED_OPTIONS = [
  { value: 'Thoroughbred', label: 'Thoroughbred (Thuần chủng Anh)' },
  { value: 'Quarter Horse', label: 'Quarter Horse' },
  { value: 'Arabian', label: 'Arabian (Ngựa Ả Rập)' },
  { value: 'Warmblood', label: 'Warmblood' },
  { value: 'Appaloosa', label: 'Appaloosa' },
  { value: 'Standardbred', label: 'Standardbred' },
  { value: 'Andalusian', label: 'Andalusian' },
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
  // undefined: giữ ảnh cũ (nếu có); File: ảnh mới; null: người dùng đã xóa ảnh
  const [photoFile, setPhotoFile] = useState(undefined);

  const {
    control,
    handleSubmit,
    formState: { isSubmitting },
  } = useForm({
    defaultValues: {
      name: initialValues?.name || '',
      breed: initialValues?.breed || 'Thoroughbred',
      gender: initialValues?.gender || 'Stallion',
      dateOfBirth: initialValues?.dateOfBirth || null,
      microchipNumber: initialValues?.microchipNumber || '',
      passportNumber: initialValues?.passportNumber || '',
      color: initialValues?.color || '',
      specialCareRequirements: initialValues?.specialCareRequirements || '',
    },
    mode: 'onTouched',
  });

  /**
   * Xử lý chuyển đổi dữ liệu trước khi gửi lên cha
   * @param {Object} data
   */
  const handleFormSubmit = async (data) => {
    // Trùng số Microchip / số hộ chiếu do backend kiểm tra và trả lỗi 400 kèm lý do
    await onSubmit({
      name: data.name?.trim(),
      breed: data.breed,
      gender: data.gender,
      dateOfBirth: data.dateOfBirth,
      microchipNumber: data.microchipNumber?.trim(),
      passportNumber: data.passportNumber?.trim(),
      color: data.color?.trim() || '',
      specialCareRequirements: data.specialCareRequirements?.trim() || null,
      photo: photoFile || null,
      removePhoto: photoFile === null,
    });
  };

  const isFormLoading = loading || isSubmitting;

  return (
    <form onSubmit={handleSubmit(handleFormSubmit)} noValidate>
      <Space direction="vertical" size="large" style={{ width: '100%' }}>
        {/* Thông tin định danh */}
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
                name="name"
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
                name="breed"
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
                      options={BREED_OPTIONS}
                      disabled={isFormLoading}
                    />
                  </Form.Item>
                )}
              />
            </Col>

            {/* Giới tính */}
            <Col xs={24} sm={12} md={8}>
              <Controller
                name="gender"
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
                name="dateOfBirth"
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
                name="color"
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

            {/* Số Microchip (15 chữ số) */}
            <Col xs={24} md={12}>
              <Controller
                name="microchipNumber"
                control={control}
                rules={{
                  required: t('horses.validation.microchipRequired'),
                  pattern: {
                    value: MICROCHIP_PATTERN,
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

            {/* Số hộ chiếu UELN */}
            <Col xs={24} md={12}>
              <Controller
                name="passportNumber"
                control={control}
                rules={{
                  required: t('horses.validation.passportRequired'),
                  pattern: {
                    value: UELN_PATTERN,
                    message: t('horses.validation.passportFormat'),
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

            {/* Ảnh nhận diện: chọn file từ máy, gửi lên backend ở trường `photo` */}
            <Col xs={24}>
              <Form.Item
                label={<span style={{ fontWeight: 600 }}>{t('horses.fields.photo')}</span>}
                style={{ marginBottom: 20 }}
              >
                <HorsePhotoPicker
                  file={photoFile}
                  currentUrl={photoFile === undefined ? initialValues?.photoUrl : null}
                  onChange={setPhotoFile}
                  disabled={isFormLoading}
                />
              </Form.Item>
            </Col>
          </Row>
        </Card>

        {/* Chăm sóc đặc biệt */}
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

          <Controller
            name="specialCareRequirements"
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

        <Text type="secondary" style={{ fontSize: 13 }}>
          {t('horses.vetRecordsLaterHint')}
        </Text>

        <Flex justify="flex-end" align="center" wrap="wrap" gap="middle">
          <Button size="large" onClick={onCancel} disabled={isFormLoading} style={{ minWidth: 120 }}>
            {t('common.cancel')}
          </Button>
          <Button
            type="primary"
            htmlType="submit"
            size="large"
            loading={isFormLoading}
            style={{ minWidth: 160, fontWeight: 600, backgroundColor: '#f59e0b', borderColor: '#f59e0b' }}
          >
            {t('horses.saveHorse')}
          </Button>
        </Flex>
      </Space>
    </form>
  );
}
