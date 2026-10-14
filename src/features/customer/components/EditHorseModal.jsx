import { useEffect } from 'react';
import {
  Modal,
  Form,
  Input,
  Select,
  DatePicker,
  Row,
  Col,
  message,
} from 'antd';
import { useTranslation } from 'react-i18next';
import dayjs from 'dayjs';
import { getStoredHorses } from '@utils/horseStorage';

const HEALTH_STATUS_OPTIONS = [
  { value: 'Excellent', labelVi: 'Xuất sắc', labelEn: 'Excellent', color: '#16a34a' },
  { value: 'Good', labelVi: 'Tốt', labelEn: 'Good', color: '#2563eb' },
  { value: 'Fair', labelVi: 'Trung bình', labelEn: 'Fair', color: '#d97706' },
  { value: 'Monitor', labelVi: 'Cần theo dõi', labelEn: 'Monitor', color: '#dc2626' },
];

const BREED_OPTIONS = [
  { value: 'Thoroughbred', labelVi: 'Thoroughbred (Thuần chủng Anh)', labelEn: 'Thoroughbred' },
  { value: 'Quarter Horse', labelVi: 'Quarter Horse', labelEn: 'Quarter Horse' },
  { value: 'Arabian', labelVi: 'Arabian (Ngựa Ả Rập)', labelEn: 'Arabian' },
  { value: 'Warmblood', labelVi: 'Warmblood', labelEn: 'Warmblood' },
  { value: 'Appaloosa', labelVi: 'Appaloosa', labelEn: 'Appaloosa' },
  { value: 'Standardbred', labelVi: 'Standardbred', labelEn: 'Standardbred' },
  { value: 'Andalusian', labelVi: 'Andalusian', labelEn: 'Andalusian' },
];

/**
 * Modal chỉnh sửa thông tin hồ sơ ngựa dùng chung cho Customer pages
 * @param {Object} props
 * @param {boolean} props.open - Trạng thái hiển thị modal
 * @param {() => void} props.onCancel - Callback khi đóng modal
 * @param {(values: Object) => void} props.onSave - Callback xử lý lưu dữ liệu
 * @param {Object} [props.horse] - Dữ liệu ngựa cần chỉnh sửa
 * @param {boolean} [props.confirmLoading] - Trạng thái loading khi submit
 * @param {string} [props.title] - Tiêu đề Modal tùy chỉnh
 */
export default function EditHorseModal({
  open,
  onCancel,
  onSave,
  horse,
  confirmLoading = false,
  title,
}) {
  const { t, i18n } = useTranslation();
  const [form] = Form.useForm();
  const isEn = i18n.language?.startsWith('en');

  useEffect(() => {
    if (open && horse) {
      form.setFieldsValue({
        name: horse.name || horse.Name || '',
        breed: horse.breed || horse.Breed || 'Thoroughbred',
        gender: horse.gender || horse.Gender || 'Stallion',
        dateOfBirth: horse.dateOfBirth || horse.DateOfBirth ? dayjs(horse.dateOfBirth || horse.DateOfBirth) : null,
        color: horse.color || horse.Color || '',
        microchipNumber: horse.microchipNumber || horse.MicrochipNumber || '',
        passportNumber: horse.passportNumber || horse.PassportNumber || '',
        healthStatus: horse.healthStatus || horse.HealthStatus || 'Good',
        specialCareRequirements: horse.specialCareRequirements || horse.SpecialCareRequirements || '',
      });
    } else if (open) {
      form.resetFields();
    }
  }, [open, horse, form]);

  const handleFinish = (values) => {
    const existingHorses = getStoredHorses();
    const curId = horse?.HorseID || horse?.horseId;
    const trimmedChip = values.microchipNumber?.trim();
    const trimmedPassport = values.passportNumber?.trim();

    if (trimmedChip) {
      const chipDup = existingHorses.find(
        (h) => String(h.HorseID || h.horseId) !== String(curId) &&
               (h.MicrochipNumber || h.microchipNumber || '').trim().toLowerCase() === trimmedChip.toLowerCase()
      );
      if (chipDup) {
        message.error(`Mã vi mạch (Microchip Number) "${trimmedChip}" đã tồn tại cho cá thể ngựa "${chipDup.Name || chipDup.name}". Không được phép trùng!`);
        return;
      }
    }

    if (trimmedPassport) {
      const passDup = existingHorses.find(
        (h) => String(h.HorseID || h.horseId) !== String(curId) &&
               (h.PassportNumber || h.passportNumber || '').trim().toLowerCase() === trimmedPassport.toLowerCase()
      );
      if (passDup) {
        message.error(`Số hộ chiếu (Passport Number) "${trimmedPassport}" đã tồn tại cho cá thể ngựa "${passDup.Name || passDup.name}". Không được phép trùng!`);
        return;
      }
    }

    const formattedValues = {
      ...values,
      dateOfBirth: values.dateOfBirth ? values.dateOfBirth.format('YYYY-MM-DD') : null,
    };
    onSave?.(formattedValues);
  };

  const modalTitle = title || (
    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
      <span>{t('horses.editTitle', 'Chỉnh sửa hồ sơ')}</span>
      {horse?.name && <span style={{ color: '#F59E0B' }}>• {horse.name}</span>}
    </div>
  );

  return (
    <Modal
      title={modalTitle}
      open={open}
      onCancel={onCancel}
      onOk={() => form.submit()}
      confirmLoading={confirmLoading}
      okText={t('horses.saveChanges', 'Lưu thay đổi')}
      cancelText={t('horses.cancel', 'Hủy')}
      destroyOnClose
      width={680}
    >
      <Form
        form={form}
        layout="vertical"
        onFinish={handleFinish}
        style={{ marginTop: 16 }}
      >
        <Row gutter={16}>
          <Col xs={24} sm={12}>
            <Form.Item
              name="name"
              label={<span style={{ fontWeight: 600 }}>{t('horses.fields.name', 'Tên ngựa')}</span>}
              rules={[{ required: true, message: t('horses.validation.nameRequired', 'Vui lòng nhập tên ngựa') }]}
            >
              <Input placeholder={t('horses.placeholders.name', 'Nhập tên ngựa')} size="large" />
            </Form.Item>
          </Col>
          <Col xs={24} sm={12}>
            <Form.Item
              name="breed"
              label={<span style={{ fontWeight: 600 }}>{t('horses.fields.breed', 'Giống ngựa')}</span>}
              rules={[{ required: true, message: t('horses.validation.breedRequired', 'Vui lòng chọn giống') }]}
            >
              <Select size="large">
                {BREED_OPTIONS.map((opt) => (
                  <Select.Option key={opt.value} value={opt.value}>
                    {isEn ? opt.labelEn : opt.labelVi}
                  </Select.Option>
                ))}
              </Select>
            </Form.Item>
          </Col>
        </Row>

        <Row gutter={16}>
          <Col xs={24} sm={8}>
            <Form.Item name="gender" label={<span style={{ fontWeight: 600 }}>{t('horses.fields.gender', 'Giới tính')}</span>}>
              <Select size="large">
                <Select.Option value="Stallion">{t('horses.genderOptions.stallion', 'Ngựa đực')}</Select.Option>
                <Select.Option value="Mare">{t('horses.genderOptions.mare', 'Ngựa cái')}</Select.Option>
                <Select.Option value="Gelding">{t('horses.genderOptions.gelding', 'Ngựa thiến')}</Select.Option>
              </Select>
            </Form.Item>
          </Col>
          <Col xs={24} sm={8}>
            <Form.Item name="dateOfBirth" label={<span style={{ fontWeight: 600 }}>{t('horses.fields.dob', 'Ngày sinh')}</span>}>
              <DatePicker style={{ width: '100%' }} format="DD/MM/YYYY" size="large" />
            </Form.Item>
          </Col>
          <Col xs={24} sm={8}>
            <Form.Item name="color" label={<span style={{ fontWeight: 600 }}>{t('horses.fields.color', 'Màu lông')}</span>}>
              <Input placeholder={t('horses.placeholders.color', 'Màu sắc')} size="large" />
            </Form.Item>
          </Col>
        </Row>

        <Row gutter={16}>
          <Col xs={24} sm={12}>
            <Form.Item name="microchipNumber" label={<span style={{ fontWeight: 600 }}>{t('horses.fields.microchip', 'Số Microchip')}</span>}>
              <Input placeholder={t('horses.placeholders.microchip', '15 chữ số')} size="large" />
            </Form.Item>
          </Col>
          <Col xs={24} sm={12}>
            <Form.Item name="passportNumber" label={<span style={{ fontWeight: 600 }}>{t('horses.fields.passport', 'Số Hộ chiếu')}</span>}>
              <Input placeholder={t('horses.placeholders.passport', 'Số hộ chiếu FEI')} size="large" />
            </Form.Item>
          </Col>
        </Row>

        <Row gutter={16}>
          <Col xs={24}>
            <Form.Item
              name="healthStatus"
              label={<span style={{ fontWeight: 600 }}>{t('horses.fields.healthStatus', 'Tình trạng sức khỏe')}</span>}
            >
              <Select size="large">
                {HEALTH_STATUS_OPTIONS.map((opt) => (
                  <Select.Option key={opt.value} value={opt.value}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <span
                        style={{
                          display: 'inline-block',
                          width: 10,
                          height: 10,
                          borderRadius: '50%',
                          backgroundColor: opt.color,
                        }}
                      />
                      <span style={{ color: opt.color, fontWeight: 600 }}>
                        {isEn ? opt.labelEn : opt.labelVi}
                      </span>
                    </div>
                  </Select.Option>
                ))}
              </Select>
            </Form.Item>
          </Col>
        </Row>

        <Form.Item
          name="specialCareRequirements"
          label={<span style={{ fontWeight: 600 }}>{t('horses.fields.specialCare', 'Yêu cầu chăm sóc đặc biệt')}</span>}
        >
          <Input.TextArea
            rows={3}
            placeholder={t('horses.specialCarePlaceholder', 'Ví dụ: Cần bổ sung nước điện giải mỗi 3 tiếng...')}
          />
        </Form.Item>
      </Form>
    </Modal>
  );
}
