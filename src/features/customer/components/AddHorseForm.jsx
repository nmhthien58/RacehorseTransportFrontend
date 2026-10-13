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
  Tag,
  Typography,
  message,
} from 'antd';
import {
  SaveOutlined,
  CloseOutlined,
  InfoCircleOutlined,
  MedicineBoxOutlined,
  PictureOutlined,
  SafetyCertificateOutlined,
  FilePdfOutlined,
  UploadOutlined,
} from '@ant-design/icons';
import { useForm, Controller, useWatch } from 'react-hook-form';
import { useTranslation } from 'react-i18next';
import dayjs from 'dayjs';

const getUniqueRecordId = () => Date.now();

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
  const [previewError, setPreviewError] = useState(false);

  const [attachedFile, setAttachedFile] = useState(
    initialValues?.vetRecordFileName
      ? { name: initialValues.vetRecordFileName, size: '2.1 MB' }
      : { name: 'FEI_Equine_Passport_2026.pdf', size: '2.4 MB' }
  );

  const {
    control,
    handleSubmit,
    setValue,
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
      photoUrl: initialValues?.photoUrl || '',
      specialCareRequirements: initialValues?.specialCareRequirements || '',
      healthStatus: initialValues?.healthStatus || 'Excellent',
      vetRecordTitle: initialValues?.vetRecordTitle || 'Hộ chiếu Thú y FEI & Chứng nhận tiêm phòng 2026',
      vetRecordType: initialValues?.vetRecordType || 'Passport',
      vetRecordFileName: initialValues?.vetRecordFileName || 'FEI_Equine_Passport_2026.pdf',
      veterinarian: initialValues?.veterinarian || 'Dr. Sarah Jenkins (FEI Senior Vet #VN-884)',
      clinic: initialValues?.clinic || 'Trung tâm Giám định Thú y Hoàng Gia Ba Vì',
      issueDate: initialValues?.issueDate || dayjs().format('YYYY-MM-DD'),
      validUntil: initialValues?.validUntil || dayjs().add(6, 'month').format('YYYY-MM-DD'),
      vetNotes: initialValues?.vetNotes || 'Thể trạng đỉnh cao, tim phổi khỏe mạnh, nhịp tim đều 36 bpm, không có dấu hiệu bệnh truyền nhiễm. Đạt chuẩn Fit to Travel.',
      hasVetFile: true,
    },
    mode: 'onTouched',
  });

  const photoUrlValue = useWatch({ control, name: 'photoUrl' });
  const healthStatusValue = useWatch({ control, name: 'healthStatus' });
  const hasVetFile = Boolean(attachedFile);
  const isCriticalAssessment = healthStatusValue === 'Critical';
  const isAttentionAssessment = healthStatusValue === 'Attention';

  /**
   * Xử lý chuyển đổi dữ liệu trước khi gửi lên cha
   * @param {Object} data
   */
  const handleFormSubmit = async (data) => {
    if (!attachedFile && !data.vetRecordFileName) {
      message.error(
        'Bắt buộc phải bổ sung file hồ sơ thú y hợp lệ! Nếu không có hồ sơ thú y, ngựa sẽ không được phép vận chuyển.'
      );
      return;
    }

    const payload = {
      ...data,
      name: data.name?.trim(),
      microchipNumber: data.microchipNumber?.trim(),
      passportNumber: data.passportNumber?.trim(),
      color: data.color?.trim() || '',
      photoUrl: data.photoUrl?.trim() || null,
      specialCareRequirements: data.specialCareRequirements?.trim() || null,
      healthStatus: data.healthStatus || 'Excellent',
      hasVetRecord: true,
      isEligibleForTransport: data.healthStatus !== 'Critical',
      vetRecordTitle: data.vetRecordTitle,
      vetRecordType: data.vetRecordType,
      vetRecordFileName: attachedFile?.name || data.vetRecordFileName,
      veterinarian: data.veterinarian,
      clinic: data.clinic,
      issueDate: data.issueDate,
      validUntil: data.validUntil,
      vetNotes: data.vetNotes,
      vetRecord: {
        recordId: getUniqueRecordId(),
        recordType: data.vetRecordType,
        title: data.vetRecordTitle,
        veterinarian: data.veterinarian,
        clinic: data.clinic,
        date: data.issueDate,
        validUntil: data.validUntil,
        status: data.healthStatus === 'Critical' ? 'Unfit' : 'Valid',
        notes: data.vetNotes,
        fileName: attachedFile?.name || data.vetRecordFileName,
      },
    };
    await onSubmit(payload);
  };

  const isFormLoading = loading || isSubmitting;

  return (
    <form onSubmit={handleSubmit(handleFormSubmit)} noValidate>
      <Space direction="vertical" size="large" style={{ width: '100%' }}>
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

            {/* Số vi mạch sinh trắc học */}
            <Col xs={24} md={12}>
              <Controller
                name="microchipNumber"
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
                name="passportNumber"
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
                name="photoUrl"
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

        {/* KHỐI 2: HỒ SƠ THÚ Y BẮT BUỘC & ĐÁNH GIÁ ĐỦ ĐIỀU KIỆN VẬN CHUYỂN */}
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
            <SafetyCertificateOutlined style={{ fontSize: 20, color: '#16a34a' }} />
            <Title level={4} style={{ margin: 0, fontWeight: 700, color: '#0f172a' }}>
              Hồ Sơ Thú Y & Đánh Giá Đủ Điều Kiện Vận Chuyển (Bắt Buộc)
            </Title>
          </Flex>
          <Text type="secondary" style={{ display: 'block', marginBottom: 20, fontSize: 13 }}>
            Theo quy định kiểm dịch quốc tế (FEI & WOAH), mọi cá thể ngựa bắt buộc phải bổ sung hồ sơ thú y hợp lệ.
            Tình trạng sức khỏe và đánh giá điều kiện vận chuyển được xác lập trực tiếp dựa trên hồ sơ chứng nhận này.
          </Text>

          <Row gutter={[24, 12]}>
            {/* Tên hồ sơ thú y */}
            <Col xs={24} md={14}>
              <Controller
                name="vetRecordTitle"
                control={control}
                rules={{ required: 'Vui lòng nhập tên tài liệu / hồ sơ thú y' }}
                render={({ field, fieldState: { error } }) => (
                  <Form.Item
                    label={<span style={{ fontWeight: 600 }}>Tên hồ sơ / Chứng chỉ thú y *</span>}
                    validateStatus={error ? 'error' : ''}
                    help={error?.message}
                    style={{ marginBottom: 16 }}
                  >
                    <Input
                      {...field}
                      placeholder="Ví dụ: Hộ chiếu Thú y FEI & Chứng nhận tiêm phòng 2026"
                      size="large"
                      disabled={isFormLoading}
                    />
                  </Form.Item>
                )}
              />
            </Col>

            {/* Loại hồ sơ */}
            <Col xs={24} md={10}>
              <Controller
                name="vetRecordType"
                control={control}
                render={({ field }) => (
                  <Form.Item
                    label={<span style={{ fontWeight: 600 }}>Loại giấy tờ kiểm dịch *</span>}
                    style={{ marginBottom: 16 }}
                  >
                    <Select
                      {...field}
                      size="large"
                      options={[
                        { value: 'Passport', label: '📘 Hộ chiếu Thú y Quốc tế (FEI Passport)' },
                        { value: 'CVI', label: '📜 Chứng nhận kiểm dịch CVI / Xuất khẩu' },
                        { value: 'Vaccination', label: '💉 Sổ tiêm phòng dịch cúm & uốn ván' },
                        { value: 'BloodTest', label: '🔬 Phiếu xét nghiệm máu Coggins / Glanders' },
                        { value: 'GeneralCheckup', label: '🩺 Giấy giám định lâm sàng trước chuyến đi' },
                      ]}
                      disabled={isFormLoading}
                    />
                  </Form.Item>
                )}
              />
            </Col>

            {/* Tải lên / Đính kèm tệp hồ sơ thú y (BẮT BUỘC) */}
            <Col xs={24}>
              <div
                style={{
                  padding: 16,
                  borderRadius: 10,
                  backgroundColor: attachedFile ? '#f0fdf4' : '#fef2f2',
                  border: attachedFile ? '1.5px dashed #86efac' : '1.5px dashed #fca5a5',
                  marginBottom: 20,
                }}
              >
                <Flex justify="space-between" align="center" wrap="wrap" gap="middle">
                  <Flex align="center" gap={12}>
                    <div
                      style={{
                        width: 44,
                        height: 44,
                        borderRadius: 10,
                        backgroundColor: attachedFile ? '#dcfce7' : '#fee2e2',
                        color: attachedFile ? '#15803d' : '#dc2626',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: 22,
                      }}
                    >
                      <FilePdfOutlined />
                    </div>
                    <div>
                      <Text strong style={{ fontSize: 14, color: '#0f172a', display: 'block' }}>
                        {attachedFile ? attachedFile.name : 'Chưa có file hồ sơ thú y đính kèm (Bắt buộc)'}
                      </Text>
                      <Text type="secondary" style={{ fontSize: 12 }}>
                        {attachedFile
                          ? `Đã đính kèm • Dung lượng: ${attachedFile.size} • Trạng thái: Hợp lệ`
                          : 'Định dạng hỗ trợ: PDF, JPG, PNG (Tối đa 25MB). Nếu không có file, ngựa không được phép vận chuyển.'}
                      </Text>
                    </div>
                  </Flex>

                  <Space wrap>
                    {attachedFile ? (
                      <Button
                        danger
                        size="middle"
                        icon={<CloseOutlined />}
                        onClick={() => {
                          setAttachedFile(null);
                          setValue('vetRecordFileName', '');
                          setValue('hasVetFile', false);
                        }}
                      >
                        Gỡ bỏ file
                      </Button>
                    ) : (
                      <>
                        <Button
                          type="primary"
                          icon={<UploadOutlined />}
                          style={{ backgroundColor: '#16a34a', borderColor: '#16a34a' }}
                          onClick={() => {
                            const file = {
                              name: 'FEI_Equine_Passport_Dossier_2026.pdf',
                              size: '2.4 MB',
                            };
                            setAttachedFile(file);
                            setValue('vetRecordFileName', file.name);
                            setValue('hasVetFile', true);
                            message.success('Đã đính kèm tệp hồ sơ thú y thành công!');
                          }}
                        >
                          Đính kèm file PDF mẫu
                        </Button>
                        <Button
                          icon={<UploadOutlined />}
                          onClick={() => {
                            const file = {
                              name: 'CVI_Health_Certificate_Quarantine.pdf',
                              size: '1.1 MB',
                            };
                            setAttachedFile(file);
                            setValue('vetRecordFileName', file.name);
                            setValue('hasVetFile', true);
                            message.success('Đã đính kèm chứng nhận kiểm dịch!');
                          }}
                        >
                          Đính kèm chứng chỉ CVI
                        </Button>
                      </>
                    )}
                  </Space>
                </Flex>
              </div>
            </Col>

            {/* Bác sĩ thú y ký duyệt */}
            <Col xs={24} md={12}>
              <Controller
                name="veterinarian"
                control={control}
                rules={{ required: 'Vui lòng nhập tên bác sĩ thú y / cơ quan cấp' }}
                render={({ field, fieldState: { error } }) => (
                  <Form.Item
                    label={<span style={{ fontWeight: 600 }}>Bác sĩ thú y / Chuyên viên ký duyệt *</span>}
                    validateStatus={error ? 'error' : ''}
                    help={error?.message}
                    style={{ marginBottom: 16 }}
                  >
                    <Input
                      {...field}
                      placeholder="Ví dụ: Dr. Sarah Jenkins (FEI Senior Vet #VN-884)"
                      size="large"
                      disabled={isFormLoading}
                    />
                  </Form.Item>
                )}
              />
            </Col>

            {/* Phòng khám / Cơ sở thú y */}
            <Col xs={24} md={12}>
              <Controller
                name="clinic"
                control={control}
                rules={{ required: 'Vui lòng nhập phòng khám / cơ sở thú y' }}
                render={({ field, fieldState: { error } }) => (
                  <Form.Item
                    label={<span style={{ fontWeight: 600 }}>Cơ sở kiểm định / Bệnh viện thú y *</span>}
                    validateStatus={error ? 'error' : ''}
                    help={error?.message}
                    style={{ marginBottom: 16 }}
                  >
                    <Input
                      {...field}
                      placeholder="Ví dụ: Trung tâm Giám định Thú y Hoàng Gia Ba Vì"
                      size="large"
                      disabled={isFormLoading}
                    />
                  </Form.Item>
                )}
              />
            </Col>

            {/* Ngày cấp & Ngày hết hạn */}
            <Col xs={24} md={12}>
              <Controller
                name="issueDate"
                control={control}
                rules={{ required: 'Vui lòng chọn ngày cấp' }}
                render={({ field, fieldState: { error } }) => (
                  <Form.Item
                    label={<span style={{ fontWeight: 600 }}>Ngày cấp chứng nhận *</span>}
                    validateStatus={error ? 'error' : ''}
                    help={error?.message}
                    style={{ marginBottom: 16 }}
                  >
                    <DatePicker
                      value={field.value ? dayjs(field.value) : null}
                      onChange={(date) => field.onChange(date ? date.format('YYYY-MM-DD') : null)}
                      format="DD/MM/YYYY"
                      size="large"
                      style={{ width: '100%' }}
                      disabled={isFormLoading}
                    />
                  </Form.Item>
                )}
              />
            </Col>

            <Col xs={24} md={12}>
              <Controller
                name="validUntil"
                control={control}
                rules={{ required: 'Vui lòng chọn ngày hết hạn' }}
                render={({ field, fieldState: { error } }) => (
                  <Form.Item
                    label={<span style={{ fontWeight: 600 }}>Hạn hiệu lực kiểm dịch *</span>}
                    validateStatus={error ? 'error' : ''}
                    help={error?.message}
                    style={{ marginBottom: 16 }}
                  >
                    <DatePicker
                      value={field.value ? dayjs(field.value) : null}
                      onChange={(date) => field.onChange(date ? date.format('YYYY-MM-DD') : null)}
                      format="DD/MM/YYYY"
                      size="large"
                      style={{ width: '100%' }}
                      disabled={isFormLoading}
                    />
                  </Form.Item>
                )}
              />
            </Col>

            {/* Tình trạng sức khỏe đánh giá từ hồ sơ */}
            <Col xs={24} md={24}>
              <Controller
                name="healthStatus"
                control={control}
                render={({ field }) => (
                  <Form.Item
                    label={
                      <span style={{ fontWeight: 700, fontSize: 14 }}>
                        Tình trạng sức khỏe kết luận từ hồ sơ (Điều chỉnh mức độ đánh giá) *
                      </span>
                    }
                    style={{ marginBottom: 14 }}
                  >
                    <Select
                      {...field}
                      size="large"
                      options={[
                        {
                          value: 'Excellent',
                          label: '🟢 Xuất sắc (Fit to Travel) — Thể trạng đỉnh cao, đủ chuẩn thi đấu quốc tế',
                        },
                        {
                          value: 'Good',
                          label: '🔵 Khỏe mạnh (Fit to Travel) — Ổn định, đạt đầy đủ kiểm định bay',
                        },
                        {
                          value: 'Attention',
                          label: '🟡 Cần theo dõi (Under Observation) — Vận chuyển có điều kiện kèm giám sát',
                        },
                        {
                          value: 'Critical',
                          label: '🔴 Nguy kịch / Chấn thương (Non-Fit to Travel) — CẤM VẬN CHUYỂN',
                        },
                      ]}
                      disabled={isFormLoading}
                    />
                  </Form.Item>
                )}
              />
            </Col>

            {/* LIVE ASSESSMENT CARD */}
            <Col xs={24}>
              <div
                style={{
                  padding: '16px 20px',
                  borderRadius: 12,
                  marginBottom: 16,
                  border: isCriticalAssessment
                    ? '1.5px solid #fecaca'
                    : isAttentionAssessment
                    ? '1.5px solid #fde68a'
                    : hasVetFile
                    ? '1.5px solid #a7f3d0'
                    : '1.5px solid #fed7aa',
                  backgroundColor: isCriticalAssessment
                    ? '#fef2f2'
                    : isAttentionAssessment
                    ? '#fffbeb'
                    : hasVetFile
                    ? '#ecfdf5'
                    : '#fff7ed',
                }}
              >
                <Flex justify="space-between" align="center" wrap="wrap" gap="small" style={{ marginBottom: 6 }}>
                  <Text strong style={{ fontSize: 13, textTransform: 'uppercase', letterSpacing: '0.5px', color: '#475569' }}>
                    KẾT QUẢ ĐÁNH GIÁ ĐỦ ĐIỀU KIỆN VẬN CHUYỂN:
                  </Text>
                  {isCriticalAssessment ? (
                    <Tag color="error" style={{ fontSize: 12, fontWeight: 800, padding: '4px 10px', borderRadius: 6 }}>
                      ⛔ CẤM VẬN CHUYỂN (NON-FIT-TO-TRAVEL)
                    </Tag>
                  ) : !hasVetFile ? (
                    <Tag color="warning" style={{ fontSize: 12, fontWeight: 800, padding: '4px 10px', borderRadius: 6 }}>
                      ⚠️ CHƯA ĐỦ ĐIỀU KIỆN (THIẾU HỒ SƠ)
                    </Tag>
                  ) : isAttentionAssessment ? (
                    <Tag color="gold" style={{ fontSize: 12, fontWeight: 800, padding: '4px 10px', borderRadius: 6 }}>
                      ⚠️ VẬN CHUYỂN KÈM THEO DÕI Y TẾ
                    </Tag>
                  ) : (
                    <Tag color="success" style={{ fontSize: 12, fontWeight: 800, padding: '4px 10px', borderRadius: 6 }}>
                      ✓ ĐỦ ĐIỀU KIỆN VẬN CHUYỂN QUỐC TẾ (FIT TO TRAVEL)
                    </Tag>
                  )}
                </Flex>

                <Text style={{ fontSize: 13, color: '#334155', display: 'block' }}>
                  {isCriticalAssessment
                    ? 'Hồ sơ y tế ghi nhận cá thể ngựa đang điều trị chấn thương nặng hoặc nguy kịch. Hệ thống sẽ KHÔNG cho phép con ngựa này tham gia vận chuyển.'
                    : !hasVetFile
                    ? 'Cá thể ngựa chưa có tệp hồ sơ thú y đính kèm. Khách hàng bắt buộc phải bổ sung file hồ sơ thú y để được phép đặt chuyến.'
                    : isAttentionAssessment
                    ? 'Cá thể ngựa được phép vận chuyển nhưng có chỉ định y tế đặc biệt. Quá trình vận chuyển sẽ tự động kích hoạt chế độ giám sát thân nhiệt & nhịp tim.'
                    : 'Cá thể ngựa đạt chuẩn kiểm định y tế cao nhất của FEI/WOAH. Đủ điều kiện đăng ký toàn bộ các lộ trình bay và đường bộ quốc tế.'}
                </Text>
              </div>
            </Col>

            {/* Ghi chú kết luận của bác sĩ thú y */}
            <Col xs={24}>
              <Controller
                name="vetNotes"
                control={control}
                render={({ field }) => (
                  <Form.Item
                    label={<span style={{ fontWeight: 600 }}>Ghi chú & kết luận của bác sĩ thú y</span>}
                    style={{ marginBottom: 0 }}
                  >
                    <TextArea
                      {...field}
                      rows={3}
                      placeholder="Ghi chú lâm sàng, kết quả xét nghiệm huyết thanh học..."
                      disabled={isFormLoading}
                    />
                  </Form.Item>
                )}
              />
            </Col>
          </Row>
        </Card>

        {/* KHỐI 3: CHĂM SÓC ĐẶC BIỆT & THÚ Y */}
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
