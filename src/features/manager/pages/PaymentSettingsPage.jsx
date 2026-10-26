import { useEffect, useState } from 'react';
import {
  Alert,
  Button,
  Card,
  Col,
  Form,
  Input,
  InputNumber,
  Row,
  Spin,
  Tabs,
  Typography,
  message,
} from 'antd';
import {
  SaveOutlined,
  DollarCircleOutlined,
  FieldTimeOutlined,
  SafetyCertificateOutlined,
  CarOutlined,
} from '@ant-design/icons';
import { useTranslation } from 'react-i18next';
import dayjs from 'dayjs';
import PageHeader from '@components/layout/PageHeader';
import paymentService, { DEFAULT_SYSTEM_SETTINGS } from '@services/paymentService';
import { unwrapData, getErrorMessage } from '@utils/apiHelpers';

const { Text } = Typography;

/**
 * @file PaymentSettingsPage.jsx
 * @description Màn hình Cấu hình hệ thống & Chính sách dịch vụ dành cho Quản lý & Admin (FE-16).
 * Quản lý toàn bộ các khóa cấu hình nghiệp vụ: Thanh toán, Báo giá, Giao trễ, Bảo hiểm, Ngựa, Giao nhận, Chính sách.
 */
export default function PaymentSettingsPage() {
  const { t } = useTranslation();
  const [form] = Form.useForm();
  const [settings, setSettings] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    paymentService
      .getSettings()
      .then((res) => {
        const data = unwrapData(res) || DEFAULT_SYSTEM_SETTINGS;
        setSettings(data);
        form.setFieldsValue(data);
      })
      .catch((err) => {
        message.error(getErrorMessage(err, t('payments.loadFailed', 'Không thể tải cấu hình hệ thống')));
        form.setFieldsValue(DEFAULT_SYSTEM_SETTINGS);
      })
      .finally(() => setLoading(false));
  }, [form, t]);

  const handleSave = async () => {
    try {
      const values = await form.validateFields();
      setSaving(true);
      const res = await paymentService.updateSettings(values);
      const data = unwrapData(res) || values;
      const updatedData = { ...data, updatedAt: new Date().toISOString() };
      setSettings(updatedData);
      form.setFieldsValue(updatedData);

      // Cập nhật sessionStorage để usePolicy() nhận giá trị mới ngay lập tức
      try {
        const cachedPolicy = sessionStorage.getItem('rht_system_policy_config');
        if (cachedPolicy) {
          const parsed = JSON.parse(cachedPolicy);
          const newPolicy = {
            ...parsed,
            PolicyVersion: values.policyVersion || parsed.PolicyVersion,
            EffectiveDate: values.effectiveDate || parsed.EffectiveDate,
            Payment: {
              ...parsed.Payment,
              DepositPercent: values.depositPercent ?? parsed.Payment?.DepositPercent,
              CancelRefundPercent: values.cancelRefundPercent ?? parsed.Payment?.CancelRefundPercent,
              UsdVndRate: values.usdVndRate ?? parsed.Payment?.UsdVndRate,
              BalanceDueDaysBeforeDeparture: values.balanceDueDaysBeforeDeparture ?? parsed.Payment?.BalanceDueDaysBeforeDeparture,
              ExtraPaymentDueDays: values.extraPaymentDueDays ?? parsed.Payment?.ExtraPaymentDueDays,
            },
            Booking: {
              ...parsed.Booking,
              QuoteAcceptDays: values.bookingQuoteAcceptDays ?? parsed.Booking?.QuoteAcceptDays,
            },
            Delay: {
              ...parsed.Delay,
              GraceHours: values.delayGraceHours ?? parsed.Delay?.GraceHours,
              PercentPer12Hours: values.delayPercentPer12Hours ?? parsed.Delay?.PercentPer12Hours,
              MaxPercent: values.delayMaxPercent ?? parsed.Delay?.MaxPercent,
            },
            Insurance: {
              ...parsed.Insurance,
              ProofThresholdUsd: values.insuranceProofThresholdUsd ?? parsed.Insurance?.ProofThresholdUsd,
              PremiumPercent: values.insurancePremiumPercent ?? parsed.Insurance?.PremiumPercent,
              BaseLiabilityUsd: values.insuranceBaseLiabilityUsd ?? parsed.Insurance?.BaseLiabilityUsd,
              BaseVetCapUsd: values.insuranceBaseVetCapUsd ?? parsed.Insurance?.BaseVetCapUsd,
              VetCapPercent: values.insuranceVetCapPercent ?? parsed.Insurance?.VetCapPercent,
            },
            Horse: {
              ...parsed.Horse,
              MinAgeMonths: values.horseMinAgeMonths ?? parsed.Horse?.MinAgeMonths,
            },
            Delivery: {
              ...parsed.Delivery,
              WaitingFeePerHourUsd: values.deliveryWaitingFeePerHourUsd ?? parsed.Delivery?.WaitingFeePerHourUsd,
              MaxWaitingHours: values.deliveryMaxWaitingHours ?? parsed.Delivery?.MaxWaitingHours,
            },
          };
          sessionStorage.setItem('rht_system_policy_config', JSON.stringify(newPolicy));
        }
      } catch {
        // Bỏ qua lỗi cập nhật cache
      }

      message.success(t('payments.settings.saved', 'Đã lưu cấu hình hệ thống thành công'));
    } catch (err) {
      if (err?.errorFields) {
        message.warning(t('payments.settings.validationWarning', 'Vui lòng kiểm tra lại các ô nhập liệu bị lỗi'));
      } else {
        message.error(getErrorMessage(err, t('payments.settings.saveFailed', 'Lưu cấu hình thất bại')));
      }
    } finally {
      setSaving(false);
    }
  };

  // 1. Nhóm Thanh toán
  const paymentTab = (
    <Row gutter={[24, 0]}>
      <Col xs={24} md={12}>
        <Form.Item
          name="depositPercent"
          label={t('payments.settings.fields.depositPercent', 'Tỷ lệ tiền cọc')}
          extra={t('payments.settings.help.depositPercent', 'Tỷ lệ tiền cọc khách phải thanh toán khi chấp nhận báo giá chốt (0 – 100%)')}
          rules={[
            { required: true, message: t('payments.settings.required', 'Bắt buộc nhập') },
            { type: 'number', min: 0, max: 100, message: 'Giá trị phải từ 0 đến 100%' },
          ]}
        >
          <InputNumber min={0} max={100} precision={1} suffix="%" style={{ width: '100%' }} />
        </Form.Item>
      </Col>

      <Col xs={24} md={12}>
        <Form.Item
          name="cancelRefundPercent"
          label={t('payments.settings.fields.cancelRefundPercent', 'Tỷ lệ hoàn tiền cọc khi hủy')}
          extra={t('payments.settings.help.cancelRefundPercent', 'Tỷ lệ tiền cọc được hoàn lại nếu khách tự hủy trước ngày khởi hành (0 – 100%)')}
          rules={[
            { required: true, message: t('payments.settings.required', 'Bắt buộc nhập') },
            { type: 'number', min: 0, max: 100, message: 'Giá trị phải từ 0 đến 100%' },
          ]}
        >
          <InputNumber min={0} max={100} precision={1} suffix="%" style={{ width: '100%' }} />
        </Form.Item>
      </Col>

      <Col xs={24} md={12}>
        <Form.Item
          name="usdVndRate"
          label={t('payments.settings.fields.usdVndRate', 'Tỉ giá USD → VND')}
          extra={t('payments.settings.help.usdVndRate', 'Tỉ giá quy đổi hiển thị và thanh toán qua cổng VNPay')}
          rules={[
            { required: true, message: t('payments.settings.required', 'Bắt buộc nhập') },
            { type: 'number', min: 1, message: 'Tỉ giá phải lớn hơn 0' },
          ]}
        >
          <InputNumber min={1} max={1000000} precision={0} suffix="₫ / USD" style={{ width: '100%' }} />
        </Form.Item>
      </Col>

      <Col xs={24} md={12}>
        <Form.Item
          name="balanceDueDaysBeforeDeparture"
          label={t('payments.settings.fields.balanceDueDaysBeforeDeparture', 'Hạn thanh toán số dư trước xuất phát')}
          extra={t('payments.settings.help.balanceDueDaysBeforeDeparture', 'Khách phải trả đủ số tiền còn lại trước ngày xe khởi hành (ngày)')}
          rules={[
            { required: true, message: t('payments.settings.required', 'Bắt buộc nhập') },
            { type: 'number', min: 0, max: 30, message: 'Số ngày phải từ 0 đến 30 ngày' },
          ]}
        >
          <InputNumber min={0} max={30} precision={0} suffix={t('payments.settings.days', 'ngày')} style={{ width: '100%' }} />
        </Form.Item>
      </Col>

      <Col xs={24} md={12}>
        <Form.Item
          name="extraPaymentDueDays"
          label={t('payments.settings.fields.extraPaymentDueDays', 'Hạn thanh toán chi phí phát sinh')}
          extra={t('payments.settings.help.extraPaymentDueDays', 'Số ngày khách phải thanh toán chi phí phát sinh sau khi chuyến hoàn thành')}
          rules={[
            { required: true, message: t('payments.settings.required', 'Bắt buộc nhập') },
            { type: 'number', min: 1, max: 90, message: 'Hạn thanh toán từ 1 đến 90 ngày' },
          ]}
        >
          <InputNumber min={1} max={90} precision={0} suffix={t('payments.settings.days', 'ngày')} style={{ width: '100%' }} />
        </Form.Item>
      </Col>
    </Row>
  );

  // 2. Nhóm Báo giá & Điều kiện Ngựa
  const bookingHorseTab = (
    <Row gutter={[24, 0]}>
      <Col xs={24} md={12}>
        <Form.Item
          name="bookingQuoteAcceptDays"
          label={t('payments.settings.fields.bookingQuoteAcceptDays', 'Hạn chấp nhận báo giá (Booking.QuoteAcceptDays)')}
          extra={t('payments.settings.help.bookingQuoteAcceptDays', 'Số ngày khách có để xem hợp đồng và thanh toán tiền cọc trước khi báo giá hết hạn')}
          rules={[
            { required: true, message: t('payments.settings.required', 'Bắt buộc nhập') },
            { type: 'number', min: 1, max: 30, message: 'Thời hạn phải từ 1 đến 30 ngày' },
          ]}
        >
          <InputNumber min={1} max={30} precision={0} suffix={t('payments.settings.days', 'ngày')} style={{ width: '100%' }} />
        </Form.Item>
      </Col>

      <Col xs={24} md={12}>
        <Form.Item
          name="horseMinAgeMonths"
          label={t('payments.settings.fields.horseMinAgeMonths', 'Độ tuổi tối thiểu của ngựa (Horse.MinAgeMonths)')}
          extra={t('payments.settings.help.horseMinAgeMonths', 'Ngựa dưới số tháng tuổi này sẽ bị hệ thống từ chối vận chuyển theo quy chuẩn IATA/EU')}
          rules={[
            { required: true, message: t('payments.settings.required', 'Bắt buộc nhập') },
            { type: 'number', min: 1, max: 120, message: 'Tuổi tối thiểu phải từ 1 đến 120 tháng' },
          ]}
        >
          <InputNumber min={1} max={120} precision={0} suffix={t('payments.settings.months', 'tháng tuổi')} style={{ width: '100%' }} />
        </Form.Item>
      </Col>
    </Row>
  );

  // 3. Nhóm Giao trễ & Giao nhận
  const delayDeliveryTab = (
    <Row gutter={[24, 0]}>
      <Col xs={24} md={12}>
        <Form.Item
          name="delayGraceHours"
          label={t('payments.settings.fields.delayGraceHours', 'Số giờ ân hạn giao trễ (Delay.GraceHours)')}
          extra={t('payments.settings.help.delayGraceHours', 'Giao trễ dưới số giờ này do vận hành được miễn trừ bồi thường')}
          rules={[
            { required: true, message: t('payments.settings.required', 'Bắt buộc nhập') },
            { type: 'number', min: 0, max: 48, message: 'Thời gian ân hạn từ 0 đến 48 giờ' },
          ]}
        >
          <InputNumber min={0} max={48} precision={1} suffix={t('payments.settings.hours', 'giờ')} style={{ width: '100%' }} />
        </Form.Item>
      </Col>

      <Col xs={24} md={12}>
        <Form.Item
          name="delayPercentPer12Hours"
          label={t('payments.settings.fields.delayPercentPer12Hours', 'Tỷ lệ hoàn tiền mỗi 12h trễ (Delay.PercentPer12Hours)')}
          extra={t('payments.settings.help.delayPercentPer12Hours', 'Tỷ lệ % tiền cước vận chuyển hoàn cho khách mỗi 12 giờ trễ sau ân hạn')}
          rules={[
            { required: true, message: t('payments.settings.required', 'Bắt buộc nhập') },
            { type: 'number', min: 0, max: 100, message: 'Tỷ lệ phải từ 0 đến 100%' },
          ]}
        >
          <InputNumber min={0} max={100} precision={1} suffix="%" style={{ width: '100%' }} />
        </Form.Item>
      </Col>

      <Col xs={24} md={12}>
        <Form.Item
          name="delayMaxPercent"
          label={t('payments.settings.fields.delayMaxPercent', 'Trần hoàn cước do trễ (Delay.MaxPercent)')}
          extra={t('payments.settings.help.delayMaxPercent', 'Mức bồi thường tối đa không quá % này của tổng tiền cước vận chuyển')}
          rules={[
            { required: true, message: t('payments.settings.required', 'Bắt buộc nhập') },
            { type: 'number', min: 0, max: 100, message: 'Trần hoàn cước phải từ 0 đến 100%' },
          ]}
        >
          <InputNumber min={0} max={100} precision={1} suffix="%" style={{ width: '100%' }} />
        </Form.Item>
      </Col>

      <Col xs={24} md={12}>
        <Form.Item
          name="deliveryWaitingFeePerHourUsd"
          label={t('payments.settings.fields.deliveryWaitingFeePerHourUsd', 'Phí chờ mỗi giờ (Delivery.WaitingFeePerHourUsd)')}
          extra={t('payments.settings.help.deliveryWaitingFeePerHourUsd', 'Phí chờ áp dụng cho mỗi giờ xe phải đợi tại điểm giao (sau 2 giờ miễn phí)')}
          rules={[
            { required: true, message: t('payments.settings.required', 'Bắt buộc nhập') },
            { type: 'number', min: 0, message: 'Phí chờ không được là số âm' },
          ]}
        >
          <InputNumber min={0} max={1000} precision={2} suffix="USD / giờ" style={{ width: '100%' }} />
        </Form.Item>
      </Col>

      <Col xs={24} md={12}>
        <Form.Item
          name="deliveryMaxWaitingHours"
          label={t('payments.settings.fields.deliveryMaxWaitingHours', 'Số giờ chờ tối đa (Delivery.MaxWaitingHours)')}
          extra={t('payments.settings.help.deliveryMaxWaitingHours', 'Sau số giờ này người nhận không có mặt, ngựa sẽ được đưa vào chuồng tạm lưu trú')}
          rules={[
            { required: true, message: t('payments.settings.required', 'Bắt buộc nhập') },
            { type: 'number', min: 1, max: 72, message: 'Thời gian chờ từ 1 đến 72 giờ' },
          ]}
        >
          <InputNumber min={1} max={72} precision={0} suffix={t('payments.settings.hours', 'giờ')} style={{ width: '100%' }} />
        </Form.Item>
      </Col>
    </Row>
  );

  // 4. Nhóm Bảo hiểm & Chính sách
  const insurancePolicyTab = (
    <Row gutter={[24, 0]}>
      <Col xs={24} md={12}>
        <Form.Item
          name="insuranceProofThresholdUsd"
          label={t('payments.settings.fields.insuranceProofThresholdUsd', 'Ngưỡng bắt buộc chứng từ (Insurance.ProofThresholdUsd)')}
          extra={t('payments.settings.help.insuranceProofThresholdUsd', 'Ngựa khai báo giá trị từ mức này trở lên bắt buộc phải tải chứng từ định giá / hóa đơn')}
          rules={[
            { required: true, message: t('payments.settings.required', 'Bắt buộc nhập') },
            { type: 'number', min: 0, message: 'Ngưỡng giá trị không được là số âm' },
          ]}
        >
          <InputNumber min={0} max={10000000} precision={0} suffix="USD" style={{ width: '100%' }} />
        </Form.Item>
      </Col>

      <Col xs={24} md={12}>
        <Form.Item
          name="insurancePremiumPercent"
          label={t('payments.settings.fields.insurancePremiumPercent', 'Tỷ lệ phí bảo hiểm toàn giá (Insurance.PremiumPercent)')}
          extra={t('payments.settings.help.insurancePremiumPercent', 'Mức phí khách phải trả tính trên giá trị thỏa thuận của ngựa')}
          rules={[
            { required: true, message: t('payments.settings.required', 'Bắt buộc nhập') },
            { type: 'number', min: 0, max: 100, message: 'Tỷ lệ phí phải từ 0 đến 100%' },
          ]}
        >
          <InputNumber min={0} max={100} precision={2} suffix="%" style={{ width: '100%' }} />
        </Form.Item>
      </Col>

      <Col xs={24} md={12}>
        <Form.Item
          name="insuranceBaseLiabilityUsd"
          label={t('payments.settings.fields.insuranceBaseLiabilityUsd', 'Trần trách nhiệm cơ bản khi ngựa chết (Insurance.BaseLiabilityUsd)')}
          extra={t('payments.settings.help.insuranceBaseLiabilityUsd', 'Mức đền bù tối đa cho một con ngựa khi không mua bảo hiểm và xảy ra lỗi công ty')}
          rules={[
            { required: true, message: t('payments.settings.required', 'Bắt buộc nhập') },
            { type: 'number', min: 0, message: 'Mức trách nhiệm không được là số âm' },
          ]}
        >
          <InputNumber min={0} max={1000000} precision={0} suffix="USD" style={{ width: '100%' }} />
        </Form.Item>
      </Col>

      <Col xs={24} md={12}>
        <Form.Item
          name="insuranceBaseVetCapUsd"
          label={t('payments.settings.fields.insuranceBaseVetCapUsd', 'Trần chi phí thú y cơ bản (Insurance.BaseVetCapUsd)')}
          extra={t('payments.settings.help.insuranceBaseVetCapUsd', 'Chi phí chữa trị tối đa cho mỗi con ngựa bị thương khi không mua bảo hiểm')}
          rules={[
            { required: true, message: t('payments.settings.required', 'Bắt buộc nhập') },
            { type: 'number', min: 0, message: 'Chi phí không được là số âm' },
          ]}
        >
          <InputNumber min={0} max={100000} precision={0} suffix="USD" style={{ width: '100%' }} />
        </Form.Item>
      </Col>

      <Col xs={24} md={12}>
        <Form.Item
          name="insuranceVetCapPercent"
          label={t('payments.settings.fields.insuranceVetCapPercent', 'Trần chi phí thú y bảo hiểm toàn giá (Insurance.VetCapPercent)')}
          extra={t('payments.settings.help.insuranceVetCapPercent', 'Mức bồi thường tối đa chi phí thú y tính theo % giá trị thỏa thuận')}
          rules={[
            { required: true, message: t('payments.settings.required', 'Bắt buộc nhập') },
            { type: 'number', min: 0, max: 100, message: 'Tỷ lệ phải từ 0 đến 100%' },
          ]}
        >
          <InputNumber min={0} max={100} precision={1} suffix="%" style={{ width: '100%' }} />
        </Form.Item>
      </Col>

      <Col xs={24} md={12}>
        <Form.Item
          name="policyVersion"
          label={t('payments.settings.fields.policyVersion', 'Phiên bản chính sách hiện hành')}
          extra={t('payments.settings.help.policyVersion', 'Số hiệu phiên bản hiển thị trên trang Chính sách và ghi nhận khi khách đồng ý')}
          rules={[{ required: true, message: t('payments.settings.required', 'Bắt buộc nhập') }]}
        >
          <Input placeholder="ví dụ 1.0" />
        </Form.Item>
      </Col>

      <Col xs={24} md={12}>
        <Form.Item
          name="effectiveDate"
          label={t('payments.settings.fields.effectiveDate', 'Ngày ban hành chính sách')}
          extra={t('payments.settings.help.effectiveDate', 'Ngày áp dụng phiên bản chính sách này')}
          rules={[{ required: true, message: t('payments.settings.required', 'Bắt buộc nhập') }]}
        >
          <Input placeholder="ví dụ 26/10/2026" />
        </Form.Item>
      </Col>
    </Row>
  );

  const tabItems = [
    {
      key: 'payment',
      label: (
        <span>
          <DollarCircleOutlined /> {t('payments.settings.tabs.payment', 'Thanh toán & Tỉ giá')}
        </span>
      ),
      children: paymentTab,
    },
    {
      key: 'bookingHorse',
      label: (
        <span>
          <FieldTimeOutlined /> {t('payments.settings.tabs.bookingHorse', 'Báo giá & Ngựa')}
        </span>
      ),
      children: bookingHorseTab,
    },
    {
      key: 'delayDelivery',
      label: (
        <span>
          <CarOutlined /> {t('payments.settings.tabs.delayDelivery', 'Giao trễ & Giao nhận')}
        </span>
      ),
      children: delayDeliveryTab,
    },
    {
      key: 'insurancePolicy',
      label: (
        <span>
          <SafetyCertificateOutlined /> {t('payments.settings.tabs.insurancePolicy', 'Bảo hiểm & Chính sách')}
        </span>
      ),
      children: insurancePolicyTab,
    },
  ];

  return (
    <div>
      <PageHeader
        title={t('payments.settings.title', 'Cấu hình hệ thống & Chính sách')}
        subtitle={t('payments.settings.subtitle', 'Quản lý tham số thanh toán, báo giá, bồi thường trễ, hạn mức bảo hiểm và phiên bản chính sách dịch vụ')}
      />
      <Card style={{ borderRadius: 12, maxWidth: 960 }}>
        {loading ? (
          <div style={{ textAlign: 'center', padding: 48 }}>
            <Spin size="large" />
          </div>
        ) : (
          <>
            <Alert
              type="info"
              showIcon
              message={t('payments.settings.hint', 'Giá trị mới được áp dụng cho các đơn hàng và hành trình phát sinh sau thời điểm lưu.')}
              style={{ marginBottom: 24 }}
            />

            <Form form={form} layout="vertical">
              <Tabs items={tabItems} defaultActiveKey="payment" style={{ marginBottom: 24 }} />
            </Form>

            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 16 }}>
              <Button type="primary" size="large" icon={<SaveOutlined />} loading={saving} onClick={handleSave}>
                {t('common.save', 'Lưu toàn bộ cấu hình')}
              </Button>

              {settings?.updatedAt && (
                <Text type="secondary" style={{ fontSize: 13 }}>
                  {t('payments.settings.updated', 'Cập nhật lần cuối: {{date}} bởi {{name}}', {
                    date: dayjs(settings.updatedAt).format('DD/MM/YYYY HH:mm'),
                    name: settings.updatedByName || 'Quản lý',
                  })}
                </Text>
              )}
            </div>
          </>
        )}
      </Card>
    </div>
  );
}
