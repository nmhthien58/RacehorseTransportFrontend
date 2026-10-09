import { useState } from 'react';
import {
  Button,
  Card,
  Col,
  Flex,
  Form,
  Input,
  Row,
  Select,
  Tag,
  Typography,
  message,
} from 'antd';
import {
  CheckCircleFilled,
  SafetyCertificateOutlined,
  DollarCircleOutlined,
  CompassOutlined,
  ToolOutlined,
} from '@ant-design/icons';
import { useTranslation } from 'react-i18next';
import LandingHeader from '../components/LandingHeader';
import LandingFooter from '../components/LandingFooter';

// Assets
import haulerHero from '@assets/landing/hauler-hero.jpg';
import hauler1 from '@assets/landing/hauler-1.jpg';
import hauler2 from '@assets/landing/hauler-2.jpg';
import hauler3 from '@assets/landing/hauler-3.jpg';
import typeCommercial from '@assets/landing/ride-commercial.jpg';

const { Title, Text, Paragraph } = Typography;

export default function BecomeHaulerPage() {
  const { t } = useTranslation();
  const [form] = Form.useForm();
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = (values) => {
    setSubmitting(true);
    setTimeout(() => {
      setSubmitting(false);
      message.success('Đăng ký hồ sơ đối tác vận chuyển thành công! Đội ngũ IET sẽ thẩm định và liên hệ với bạn trong vòng 24 giờ làm việc.');
      form.resetFields();
    }, 1000);
  };

  return (
    <div style={{ backgroundColor: '#ffffff', minHeight: '100vh' }}>
      {/* 1. Header dùng chung */}
      <LandingHeader activeKey="more" />

      {/* 2. Hero Section có Form Đăng Ký Đối Tác Khớp Figma More_Become a hauler */}
      <section
        style={{
          position: 'relative',
          padding: '140px 0 100px 0',
          backgroundImage: `linear-gradient(to right, rgba(15, 23, 42, 0.95) 0%, rgba(15, 23, 42, 0.85) 50%, rgba(15, 23, 42, 0.45) 100%), url(${haulerHero})`,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          color: '#ffffff',
        }}
      >
        <div style={{ maxWidth: 1240, margin: '0 auto', padding: '0 24px' }}>
          <Row gutter={[48, 40]} align="middle">
            <Col xs={24} lg={13}>
              <Tag
                color="gold"
                style={{
                  fontSize: 12,
                  fontWeight: 800,
                  padding: '4px 14px',
                  borderRadius: 9999,
                  marginBottom: 20,
                  letterSpacing: '0.08em',
                }}
              >
                MẠNG LƯỚI ĐỐI TÁC VẬN CHUYỂN IET
              </Tag>

              <Title
                level={1}
                style={{
                  color: '#ffffff',
                  fontSize: 'clamp(32px, 5vw, 54px)',
                  fontWeight: 900,
                  lineHeight: 1.15,
                  marginBottom: 20,
                  letterSpacing: '-0.02em',
                }}
              >
                Launch your account <span style={{ color: '#FBA919' }}>in minutes.</span>
              </Title>

              <Paragraph
                style={{
                  color: '#cbd5e1',
                  fontSize: 18,
                  lineHeight: 1.7,
                  maxWidth: 580,
                  marginBottom: 32,
                }}
              >
                Gia nhập nền tảng điều phối vận tải ngựa đua hàng đầu. Lấp đầy các chuyến xe chiều về, tối ưu hóa công suất rơ-moóc và nhận thanh toán bảo đảm định kỳ mỗi tuần.
              </Paragraph>

              <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                  <CheckCircleFilled style={{ color: '#FBA919', fontSize: 18 }} />
                  <span style={{ fontSize: 16, color: '#e2e8f0' }}>Không phí tham gia ban đầu, hoa hồng minh bạch</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                  <CheckCircleFilled style={{ color: '#FBA919', fontSize: 18 }} />
                  <span style={{ fontSize: 16, color: '#e2e8f0' }}>Bảo hiểm hàng hóa ký quỹ Escrow bảo vệ mọi đơn hàng</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                  <CheckCircleFilled style={{ color: '#FBA919', fontSize: 18 }} />
                  <span style={{ fontSize: 16, color: '#e2e8f0' }}>Hỗ trợ pháp lý, chứng từ kiểm dịch số hóa tự động</span>
                </div>
              </div>
            </Col>

            {/* Form đăng ký trực tuyến bên phải */}
            <Col xs={24} lg={11}>
              <Card
                style={{
                  borderRadius: 24,
                  boxShadow: '0 20px 50px rgba(0, 0, 0, 0.45)',
                  border: '1px solid rgba(255, 255, 255, 0.2)',
                  background: '#ffffff',
                  padding: 8,
                }}
              >
                <div style={{ marginBottom: 20 }}>
                  <Title level={3} style={{ margin: 0, fontWeight: 900, color: '#0f172a' }}>
                    Đăng Ký Trở Thành Hauler
                  </Title>
                  <Text style={{ color: '#64748b', fontSize: 14 }}>
                    Điền thông tin đội xe để bắt đầu nhận chuyến ngay
                  </Text>
                </div>

                <Form form={form} layout="vertical" onFinish={handleSubmit}>
                  <Row gutter={12}>
                    <Col span={12}>
                      <Form.Item
                        name="firstName"
                        label="Họ"
                        rules={[{ required: true, message: 'Vui lòng nhập họ' }]}
                      >
                        <Input placeholder="Nguyễn" size="large" />
                      </Form.Item>
                    </Col>
                    <Col span={12}>
                      <Form.Item
                        name="lastName"
                        label="Tên"
                        rules={[{ required: true, message: 'Vui lòng nhập tên' }]}
                      >
                        <Input placeholder="Văn A" size="large" />
                      </Form.Item>
                    </Col>
                  </Row>

                  <Row gutter={12}>
                    <Col span={12}>
                      <Form.Item
                        name="email"
                        label="Email liên hệ"
                        rules={[{ required: true, type: 'email', message: 'Vui lòng nhập email hợp lệ' }]}
                      >
                        <Input placeholder="hauler@company.com" size="large" />
                      </Form.Item>
                    </Col>
                    <Col span={12}>
                      <Form.Item
                        name="phone"
                        label="Số điện thoại"
                        rules={[{ required: true, message: 'Vui lòng nhập SĐT' }]}
                      >
                        <Input placeholder="0901 234 567" size="large" />
                      </Form.Item>
                    </Col>
                  </Row>

                  <Form.Item
                    name="companyName"
                    label="Tên nhà xe / Doanh nghiệp vận tải"
                    rules={[{ required: true, message: 'Vui lòng nhập tên nhà xe' }]}
                  >
                    <Input placeholder="Equine Logistics Express" size="large" />
                  </Form.Item>

                  <Form.Item
                    name="equipmentType"
                    label="Loại phương tiện & Sức chứa rơ-moóc"
                    rules={[{ required: true, message: 'Vui lòng chọn loại xe' }]}
                  >
                    <Select placeholder="Chọn quy mô đội xe" size="large">
                      <Select.Option value="van_2_3">Xe van cá nhân (2 - 3 ngựa)</Select.Option>
                      <Select.Option value="gooseneck_4_6">Xe Gooseneck chuyên dụng (4 - 6 ngựa)</Select.Option>
                      <Select.Option value="semi_commercial_9">Xe đầu kéo rơ-moóc lớn (9 - 15 ngựa)</Select.Option>
                      <Select.Option value="icu_medical">Xe chuyên dụng thú y ICU</Select.Option>
                    </Select>
                  </Form.Item>

                  <Button
                    type="primary"
                    htmlType="submit"
                    block
                    size="large"
                    loading={submitting}
                    style={{
                      backgroundColor: '#FBA919',
                      borderColor: '#FBA919',
                      color: '#0f172a',
                      fontWeight: 800,
                      height: 48,
                      borderRadius: 12,
                      fontSize: 16,
                      boxShadow: '0 4px 14px rgba(251, 169, 25, 0.4)',
                    }}
                  >
                    GỬI ĐĂNG KÝ HỒ SƠ →
                  </Button>
                </Form>
              </Card>
            </Col>
          </Row>
        </div>
      </section>

      {/* 3. Section Vàng Cam Khớp Figma: Tools that run your hauling business */}
      <section style={{ backgroundColor: '#FBA919', padding: '80px 0', color: '#0f172a' }}>
        <div style={{ maxWidth: 1240, margin: '0 auto', padding: '0 24px' }}>
          <div style={{ textAlign: 'center', marginBottom: 50 }}>
            <Title level={2} style={{ fontSize: 36, fontWeight: 900, color: '#0f172a', marginBottom: 12 }}>
              Tools that run your hauling business
            </Title>
            <Paragraph style={{ color: '#334155', fontSize: 17, maxWidth: 650, margin: '0 auto' }}>
              Nền tảng IET cung cấp toàn bộ công cụ số giúp bạn vận hành đội xe chuyên nghiệp và gia tăng doanh số.
            </Paragraph>
          </div>

          <Row gutter={[28, 28]}>
            <Col xs={24} md={8}>
              <Card
                style={{
                  borderRadius: 20,
                  border: 'none',
                  padding: 12,
                  height: '100%',
                  boxShadow: '0 8px 24px rgba(0, 0, 0, 0.08)',
                }}
              >
                <div style={{ color: '#FBA919', fontSize: 32, marginBottom: 12 }}>
                  <CompassOutlined />
                </div>
                <Title level={4} style={{ fontWeight: 800, color: '#0f172a', marginBottom: 8 }}>
                  Lấp Đầy Chiều Về Rỗng
                </Title>
                <Paragraph style={{ color: '#64748b', fontSize: 14, lineHeight: 1.6 }}>
                  Hệ thống AI tự động gợi ý các yêu cầu gửi ngựa trên đúng lộ trình xe quay về, nâng cao 40% doanh thu mỗi tháng.
                </Paragraph>
              </Card>
            </Col>

            <Col xs={24} md={8}>
              <Card
                style={{
                  borderRadius: 20,
                  border: 'none',
                  padding: 12,
                  height: '100%',
                  boxShadow: '0 8px 24px rgba(0, 0, 0, 0.08)',
                }}
              >
                <div style={{ color: '#FBA919', fontSize: 32, marginBottom: 12 }}>
                  <DollarCircleOutlined />
                </div>
                <Title level={4} style={{ fontWeight: 800, color: '#0f172a', marginBottom: 8 }}>
                  Thanh Toán Đảm Bảo Định Kỳ
                </Title>
                <Paragraph style={{ color: '#64748b', fontSize: 14, lineHeight: 1.6 }}>
                  Khách hàng thanh toán qua quỹ bảo đảm Escrow. Tiền cước được giải ngân trực tiếp vào tài khoản ngay khi giao ngựa.
                </Paragraph>
              </Card>
            </Col>

            <Col xs={24} md={8}>
              <Card
                style={{
                  borderRadius: 20,
                  border: 'none',
                  padding: 12,
                  height: '100%',
                  boxShadow: '0 8px 24px rgba(0, 0, 0, 0.08)',
                }}
              >
                <div style={{ color: '#FBA919', fontSize: 32, marginBottom: 12 }}>
                  <ToolOutlined />
                </div>
                <Title level={4} style={{ fontWeight: 800, color: '#0f172a', marginBottom: 8 }}>
                  Số Hóa Hồ Sơ Kiểm Dịch
                </Title>
                <Paragraph style={{ color: '#64748b', fontSize: 14, lineHeight: 1.6 }}>
                  Chứng chỉ Coggins điện tử, giấy tiêm chủng thú y và ký nhận e-POD được đồng bộ ngay trên ứng dụng di động.
                </Paragraph>
              </Card>
            </Col>
          </Row>
        </div>
      </section>

      {/* 4. Danh Sách 4 Khối Tính Năng Xen Kẽ Khớp Figma */}
      <section style={{ padding: '90px 0', backgroundColor: '#f8fafc' }}>
        <div style={{ maxWidth: 1240, margin: '0 auto', padding: '0 24px' }}>
          <Flex vertical gap={64}>
            {/* Hàng 1 */}
            <Row gutter={[48, 32]} align="middle">
              <Col xs={24} md={12}>
                <img
                  src={hauler1}
                  alt="Mobile booking tools"
                  style={{ width: '100%', borderRadius: 20, height: 320, objectFit: 'cover' }}
                />
              </Col>
              <Col xs={24} md={12}>
                <div style={{ color: '#FBA919', fontWeight: 900, fontSize: 32 }}>01</div>
                <Title level={3} style={{ fontWeight: 800, color: '#0f172a', margin: '8px 0 16px 0' }}>
                  Tiếp nhận chuyến và báo giá trực tiếp
                </Title>
                <Paragraph style={{ color: '#64748b', fontSize: 16, lineHeight: 1.7 }}>
                  Xem thông tin chi tiết lộ trình, giống ngựa, cân nặng và yêu cầu chuồng trại trước khi chấp nhận đơn. Linh hoạt đề xuất mức cước cạnh tranh theo năng lực của bạn.
                </Paragraph>
              </Col>
            </Row>

            {/* Hàng 2 */}
            <Row gutter={[48, 32]} align="middle" style={{ flexDirection: 'row-reverse' }}>
              <Col xs={24} md={12}>
                <img
                  src={hauler2}
                  alt="Driver welfare inspection"
                  style={{ width: '100%', borderRadius: 20, height: 320, objectFit: 'cover' }}
                />
              </Col>
              <Col xs={24} md={12}>
                <div style={{ color: '#FBA919', fontWeight: 900, fontSize: 32 }}>02</div>
                <Title level={3} style={{ fontWeight: 800, color: '#0f172a', margin: '8px 0 16px 0' }}>
                  Ứng dụng di động cập nhật nhật ký phúc lợi
                </Title>
                <Paragraph style={{ color: '#64748b', fontSize: 16, lineHeight: 1.7 }}>
                  Chụp ảnh check-in nước uống, rơm ăn và nhiệt độ buồng chở tại các trạm dừng. Tự động thông báo trạng thái cho chủ ngựa mà không cần nghe điện thoại khi đang cầm lái.
                </Paragraph>
              </Col>
            </Row>

            {/* Hàng 3 */}
            <Row gutter={[48, 32]} align="middle">
              <Col xs={24} md={12}>
                <img
                  src={hauler3}
                  alt="Safe loading and unloading"
                  style={{ width: '100%', borderRadius: 20, height: 320, objectFit: 'cover' }}
                />
              </Col>
              <Col xs={24} md={12}>
                <div style={{ color: '#FBA919', fontWeight: 900, fontSize: 32 }}>03</div>
                <Title level={3} style={{ fontWeight: 800, color: '#0f172a', margin: '8px 0 16px 0' }}>
                  Mạng lưới trạm nghỉ và cứu hộ 24/7
                </Title>
                <Paragraph style={{ color: '#64748b', fontSize: 16, lineHeight: 1.7 }}>
                  Được quyền tiếp cận hệ thống chuồng trại trung chuyển đối tác của IET dọc các tuyến liên tỉnh để cho ngựa nghỉ ngơi qua đêm an toàn tuyệt đối.
                </Paragraph>
              </Col>
            </Row>
          </Flex>
        </div>
      </section>

      {/* 5. Footer dùng chung */}
      <LandingFooter />
    </div>
  );
}
