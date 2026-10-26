import { Anchor, Card, Col, Divider, Row, Space, Table, Tag, Typography } from 'antd';
import {
  FileProtectOutlined,
  SafetyCertificateOutlined,
} from '@ant-design/icons';
import { useTranslation } from 'react-i18next';
import { usePolicy } from '@hooks/usePolicy';
import LandingHeader from '../components/LandingHeader';
import LandingFooter from '../components/LandingFooter';

const { Title, Paragraph, Text } = Typography;

/**
 * @file PolicyPage.jsx
 * @description Trang công khai Chính sách dịch vụ vận chuyển ngựa (FE-15).
 * Nội dung hiển thị đúng 13 mục theo doc/CHINH_SACH_DICH_VU.md, tự động điền các giá trị
 * cấu hình động từ hook usePolicy() và hỗ trợ mục lục điều hướng nhanh.
 */
export default function PolicyPage() {
  const { t } = useTranslation();
  const { policy, policyVersion, effectiveDate } = usePolicy();

  // Định dạng số tiền
  const formatUsd = (num) => (num != null ? Number(num).toLocaleString('en-US') : '0');
  const formatVnd = (num) => (num != null ? Number(num).toLocaleString('vi-VN') : '0');

  // Mục lục 13 phần
  const anchorItems = [
    { key: 'sec-1', href: '#sec-1', title: `1. ${t('policy.sections.sec1', 'Phạm vi áp dụng')}` },
    { key: 'sec-2', href: '#sec-2', title: `2. ${t('policy.sections.sec2', 'Quy trình đặt chuyến & báo giá')}` },
    { key: 'sec-3', href: '#sec-3', title: `3. ${t('policy.sections.sec3', 'Thanh toán')}` },
    { key: 'sec-4', href: '#sec-4', title: `4. ${t('policy.sections.sec4', 'Hủy đơn & hoàn tiền')}` },
    { key: 'sec-5', href: '#sec-5', title: `5. ${t('policy.sections.sec5', 'Điều kiện ngựa được vận chuyển')}` },
    { key: 'sec-6', href: '#sec-6', title: `6. ${t('policy.sections.sec6', 'Giấy tờ & thủ tục')}` },
    { key: 'sec-7', href: '#sec-7', title: `7. ${t('policy.sections.sec7', 'Cam kết thời gian & bồi thường giao trễ')}` },
    { key: 'sec-8', href: '#sec-8', title: `8. ${t('policy.sections.sec8', 'Bảo hiểm & giới hạn trách nhiệm')}` },
    { key: 'sec-9', href: '#sec-9', title: `9. ${t('policy.sections.sec9', 'Sự cố trong hành trình')}` },
    { key: 'sec-10', href: '#sec-10', title: `10. ${t('policy.sections.sec10', 'Giao nhận')}` },
    { key: 'sec-11', href: '#sec-11', title: `11. ${t('policy.sections.sec11', 'Khiếu nại')}` },
    { key: 'sec-12', href: '#sec-12', title: `12. ${t('policy.sections.sec12', 'Hợp đồng vận chuyển')}` },
    { key: 'sec-13', href: '#sec-13', title: `13. ${t('policy.sections.sec13', 'Thay đổi chính sách')}` },
  ];

  // Bảng mục 3: Thanh toán
  const paymentColumns = [
    { title: t('policy.table.item', 'Khoản'), dataIndex: 'item', key: 'item', width: '25%' },
    { title: t('policy.table.amount', 'Số tiền'), dataIndex: 'amount', key: 'amount', width: '35%' },
    { title: t('policy.table.deadline', 'Thời hạn'), dataIndex: 'deadline', key: 'deadline', width: '40%' },
  ];

  const paymentData = [
    {
      key: '1',
      item: <Text strong>{t('policy.payment.deposit', 'Tiền cọc')}</Text>,
      amount: <Text strong style={{ color: '#d97706' }}>{policy.Payment.DepositPercent}% {t('policy.payment.quoteBase', 'báo giá chốt')}</Text>,
      deadline: `${t('policy.payment.quoteAcceptHint', 'Khi chấp nhận báo giá, trong')} ${policy.Booking.QuoteAcceptDays} ${t('policy.units.days', 'ngày')}`,
    },
    {
      key: '2',
      item: <Text strong>{t('policy.payment.balance', 'Phần còn lại')}</Text>,
      amount: t('policy.payment.balanceCalc', 'Báo giá chốt − tiền cọc'),
      deadline: `${t('policy.payment.balanceDueHint', 'Trước ngày xuất phát')} ${policy.Payment.BalanceDueDaysBeforeDeparture} ${t('policy.units.days', 'ngày')}`,
    },
    {
      key: '3',
      item: <Text strong>{t('policy.payment.extra', 'Chi phí phát sinh')}</Text>,
      amount: t('policy.payment.extraDesc', 'Theo mục 9, 10 (nếu có)'),
      deadline: `${t('policy.payment.extraDueHint', 'Trong')} ${policy.Payment.ExtraPaymentDueDays} ${t('policy.payment.extraAfterTrip', 'ngày kể từ khi kết thúc chuyến')}`,
    },
  ];

  // Bảng mục 4: Hủy đơn & hoàn tiền
  const cancelColumns = [
    { title: t('policy.table.cancelTime', 'Thời điểm Khách hủy'), dataIndex: 'time', key: 'time', width: '40%' },
    { title: t('policy.table.refund', 'Hoàn tiền'), dataIndex: 'refund', key: 'refund', width: '60%' },
  ];

  const cancelData = [
    {
      key: '1',
      time: t('policy.cancel.beforeDeposit', 'Trước khi đặt cọc'),
      refund: <Tag color="default">{t('policy.cancel.noRefundNeeded', 'Không có khoản nào phải hoàn')}</Tag>,
    },
    {
      key: '2',
      time: t('policy.cancel.afterDepositBeforeDeparture', 'Sau khi cọc, trước khi xuất phát'),
      refund: (
        <span>
          {t('policy.cancel.refundDepositPrefix', 'Hoàn')}{' '}
          <Text strong style={{ color: '#059669' }}>{policy.Payment.CancelRefundPercent}%</Text>{' '}
          {t('policy.cancel.refundDepositSuffix', 'tiền cọc + 100% phần còn lại đã trả')}
        </span>
      ),
    },
    {
      key: '3',
      time: t('policy.cancel.afterDeparture', 'Sau khi xuất phát'),
      refund: <Tag color="error">{t('policy.cancel.cannotCancelSelf', 'Khách không tự hủy được. Mọi thay đổi xử lý theo mục 9')}</Tag>,
    },
  ];

  // Bảng mục 8.2: So sánh bảo hiểm
  const insuranceColumns = [
    { title: t('policy.table.criteria', 'Tiêu chí'), dataIndex: 'criteria', key: 'criteria', width: '26%' },
    { title: t('policy.table.optDefault', 'Không mua bảo hiểm (mặc định)'), dataIndex: 'optDefault', key: 'optDefault', width: '37%' },
    { title: t('policy.table.optFull', 'Bảo hiểm toàn giá trị (tùy chọn)'), dataIndex: 'optFull', key: 'optFull', width: '37%' },
  ];

  const insuranceData = [
    {
      key: '1',
      criteria: <Text strong>{t('policy.insurance.premium', 'Phí bảo hiểm')}</Text>,
      optDefault: <Text type="secondary">{t('policy.insurance.free', 'Không')}</Text>,
      optFull: <Text strong style={{ color: '#d97706' }}>{policy.Insurance.PremiumPercent}% {t('policy.insurance.agreedValue', 'giá trị thỏa thuận')}</Text>,
    },
    {
      key: '2',
      criteria: <Text strong>{t('policy.insurance.whenCovered', 'Khi nào được bồi thường')}</Text>,
      optDefault: <Text strong style={{ color: '#dc2626' }}>{t('policy.insurance.companyFaultOnly', 'Chỉ khi do lỗi công ty')}</Text>,
      optFull: <Text strong style={{ color: '#059669' }}>{t('policy.insurance.allCausesCovered', 'Mọi nguyên nhân trong phạm vi, kể cả bất khả kháng')}</Text>,
    },
    {
      key: '3',
      criteria: <Text strong>{t('policy.insurance.lossEuthanasia', 'Ngựa chết / an tử / mất')}</Text>,
      optDefault: `${t('policy.insurance.capUpTo', 'Tối đa')} ${formatUsd(policy.Insurance.BaseLiabilityUsd)} USD / ${t('policy.units.horse', 'con')}`,
      optFull: <Text strong style={{ color: '#059669' }}>100% {t('policy.insurance.agreedValue', 'giá trị thỏa thuận')}</Text>,
    },
    {
      key: '4',
      criteria: <Text strong>{t('policy.insurance.injuredHorse', 'Ngựa bị thương')}</Text>,
      optDefault: `${t('policy.insurance.actualVetCost', 'Chi phí thú y thực tế, tối đa')} ${formatUsd(policy.Insurance.BaseVetCapUsd)} USD / ${t('policy.units.horse', 'con')}`,
      optFull: `${t('policy.insurance.actualVetCost', 'Chi phí thú y thực tế, tối đa')} ${policy.Insurance.VetCapPercent}% ${t('policy.insurance.agreedValue', 'giá trị thỏa thuận')}`,
    },
  ];

  // Bảng mục 9.1: Nguyên tắc xử lý sự cố
  const incidentColumns = [
    { title: t('policy.table.incidentCause', 'Nguyên nhân'), dataIndex: 'cause', key: 'cause', width: '20%' },
    { title: t('policy.table.incidentExample', 'Ví dụ'), dataIndex: 'example', key: 'example', width: '25%' },
    { title: t('policy.table.unusedFare', 'Tiền cước phần chưa đi'), dataIndex: 'fare', key: 'fare', width: '20%' },
    { title: t('policy.table.extraCosts', 'Chi phí phát sinh (chờ, quay đầu, chuồng, thú y)'), dataIndex: 'extra', key: 'extra', width: '20%' },
    { title: t('policy.table.delayCompensation', 'Bồi thường trễ'), dataIndex: 'delayComp', key: 'delayComp', width: '15%' },
  ];

  const incidentData = [
    {
      key: '1',
      cause: <Tag color="error">{t('policy.incident.companyFault', 'Lỗi công ty')}</Tag>,
      example: t('policy.incident.companyFaultEx', 'Xe hỏng do bảo dưỡng, thiếu giấy do chuyên viên, đi sai tuyến'),
      fare: <Text strong style={{ color: '#059669' }}>{t('policy.incident.refund100', 'Hoàn 100%')}</Text>,
      extra: t('policy.incident.companyBears', 'Công ty chịu'),
      delayComp: <Tag color="success">{t('policy.incident.delayYes', 'Có (mục 7)')}</Tag>,
    },
    {
      key: '2',
      cause: <Tag color="warning">{t('policy.incident.customerFault', 'Lỗi Khách')}</Tag>,
      example: t('policy.incident.customerFaultEx', 'Giấy sai / giả, khai sai tình trạng ngựa, người nhận vắng mặt / từ chối'),
      fare: <Text type="secondary">{t('policy.incident.noRefund', 'Không hoàn')}</Text>,
      extra: t('policy.incident.customerBears', 'Khách chịu'),
      delayComp: <Tag color="default">{t('policy.incident.delayNo', 'Không')}</Tag>,
    },
    {
      key: '3',
      cause: <Tag color="blue">{t('policy.incident.forceMajeure', 'Bất khả kháng')}</Tag>,
      example: t('policy.incident.forceMajeureEx', 'Đóng biên giới, đổi chính sách nhập khẩu, thiên tai, dịch bệnh, tai nạn bên thứ 3'),
      fare: t('policy.incident.proRataRefund', 'Hoàn theo tỉ lệ quãng đường chưa đi, trừ phí thủ tục không lấy lại được'),
      extra: t('policy.incident.forceMajeureExtra', 'Công ty chịu chi phí xe & nhân sự; Khách chịu chuồng tạm & thú y'),
      delayComp: <Tag color="default">{t('policy.incident.delayNo', 'Không')}</Tag>,
    },
  ];

  return (
    <div style={{ backgroundColor: '#0f172a', minHeight: '100vh', color: '#f8fafc' }}>
      <LandingHeader activeKey="more" />

      {/* Hero Header */}
      <div
        style={{
          background: 'linear-gradient(180deg, #1e293b 0%, #0f172a 100%)',
          padding: '130px 24px 48px',
          borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
          textAlign: 'center',
        }}
      >
        <div style={{ maxWidth: 960, margin: '0 auto' }}>
          <Space orientation="horizontal" size={8} style={{ marginBottom: 12 }}>
            <Tag color="#FBA919" style={{ color: '#0f172a', fontWeight: 700, borderRadius: 9999 }}>
              <FileProtectOutlined /> {t('policy.header.tag', 'CHÍNH THỨC')}
            </Tag>
            <Tag style={{ borderRadius: 9999, background: 'rgba(255,255,255,0.1)', color: '#94a3b8', borderColor: 'transparent' }}>
              {t('policy.header.version', 'Phiên bản')}: {policyVersion}
            </Tag>
            <Tag style={{ borderRadius: 9999, background: 'rgba(255,255,255,0.1)', color: '#94a3b8', borderColor: 'transparent' }}>
              {t('policy.header.effectiveDate', 'Ngày ban hành')}: {effectiveDate}
            </Tag>
          </Space>

          <Title
            level={1}
            style={{
              color: '#ffffff',
              fontSize: 'clamp(28px, 4vw, 42px)',
              fontWeight: 800,
              marginBottom: 16,
              letterSpacing: '-0.02em',
            }}
          >
            {t('policy.header.title', 'Chính Sách Dịch Vụ Vận Chuyển Ngựa')}
          </Title>

          <Paragraph
            style={{
              color: '#94a3b8',
              fontSize: 'clamp(14px, 2vw, 17px)',
              maxWidth: 760,
              margin: '0 auto',
              lineHeight: 1.7,
            }}
          >
            {t(
              'policy.header.subtitle',
              'Quy định chi tiết về phạm vi trách nhiệm, quy trình đặt chuyến, cước phí, bồi thường và quyền lợi của khách hàng khi sử dụng dịch vụ của International Equine Transport.'
            )}
          </Paragraph>
        </div>
      </div>

      {/* Main Content Layout */}
      <div style={{ maxWidth: 1240, margin: '0 auto', padding: '48px 24px 96px' }}>
        <Row gutter={[40, 40]}>
          {/* Cột trái: Mục lục Anchor cố định */}
          <Col xs={24} lg={7}>
            <div
              style={{
                position: 'sticky',
                top: 100,
                background: '#1e293b',
                padding: '24px 20px',
                borderRadius: 16,
                border: '1px solid rgba(255, 255, 255, 0.08)',
                boxShadow: '0 10px 25px rgba(0,0,0,0.3)',
              }}
            >
              <Title level={5} style={{ color: '#FBA919', marginBottom: 16, fontSize: 15, fontWeight: 700 }}>
                {t('policy.nav.contentsTitle', 'MỤC LỤC CHÍNH SÁCH')}
              </Title>
              <Anchor
                items={anchorItems}
                offsetTop={110}
                style={{ background: 'transparent' }}
              />
            </div>
          </Col>

          {/* Cột phải: 13 mục nội dung chính */}
          <Col xs={24} lg={17}>
            <Space orientation="vertical" size={32} style={{ width: '100%' }}>

              {/* Mục 1 */}
              <Card id="sec-1" style={cardStyle} styles={{ body: cardBodyStyle }}>
                <Title level={3} style={sectionTitleStyle}>
                  1. {t('policy.sections.sec1', 'Phạm vi áp dụng')}
                </Title>
                <Paragraph style={paragraphStyle}>
                  {t(
                    'policy.content.sec1_p1',
                    'Chính sách này áp dụng cho mọi yêu cầu vận chuyển ngựa đặt qua hệ thống Racehorse Transport, bằng đường bộ hoặc đường hàng không, trong nước và quốc tế. Khi đặt đơn, khách hàng ("Khách") đồng ý với toàn bộ chính sách dưới đây.'
                  )}
                </Paragraph>
                <Paragraph style={paragraphStyle}>
                  {t(
                    'policy.content.sec1_p2_prefix',
                    'Mọi số tiền được báo bằng USD. Khi thanh toán qua VNPay, số tiền được quy đổi sang VND theo tỉ giá hệ thống tại thời điểm thanh toán:'
                  )}{' '}
                  <Tag color="gold" style={{ fontSize: 14, fontWeight: 700, padding: '2px 8px' }}>
                    1 USD = {formatVnd(policy.Payment.UsdVndRate)} đ
                  </Tag>
                  . {t('policy.content.sec1_p2_suffix', 'Tỉ giá và số tiền VND được ghi nhận minh bạch trên từng giao dịch.')}
                </Paragraph>
              </Card>

              {/* Mục 2 */}
              <Card id="sec-2" style={cardStyle} styles={{ body: cardBodyStyle }}>
                <Title level={3} style={sectionTitleStyle}>
                  2. {t('policy.sections.sec2', 'Quy trình đặt chuyến và báo giá')}
                </Title>
                <ol style={{ paddingLeft: 20, margin: 0, color: '#cbd5e1', lineHeight: 1.8 }}>
                  <li style={{ marginBottom: 12 }}>
                    <Text strong style={{ color: '#f8fafc' }}>{t('policy.sec2.step1_title', 'Gửi yêu cầu:')}</Text>{' '}
                    {t('policy.sec2.step1_desc', 'Khách chọn điểm đón, điểm giao trên bản đồ, chọn ngựa, khoảng ngày ngựa sẵn sàng được đón và hạn giao trễ nhất. Hệ thống hiển thị khoảng giá ước tính (thấp nhất – cao nhất) để tham khảo, không phải giá cuối cùng. Ở bước này Khách chưa phải trả tiền.')}
                  </li>
                  <li style={{ marginBottom: 12 }}>
                    <Text strong style={{ color: '#f8fafc' }}>{t('policy.sec2.step2_title', 'Duyệt sơ bộ:')}</Text>{' '}
                    {t('policy.sec2.step2_desc', 'Quản lý kiểm tra tính khả thi của yêu cầu (ngựa đủ điều kiện, tuyến phục vụ, lịch xe). Yêu cầu có thể bị từ chối kèm lý do cụ thể.')}
                  </li>
                  <li style={{ marginBottom: 12 }}>
                    <Text strong style={{ color: '#f8fafc' }}>{t('policy.sec2.step3_title', 'Lập tuyến và báo giá chốt:')}</Text>{' '}
                    {t('policy.sec2.step3_desc', 'Công ty lập lộ trình cụ thể (các điểm dừng nghỉ, cửa khẩu, nước quá cảnh) và gửi báo giá chốt qua ứng dụng và email. Báo giá chốt bao gồm: cước theo quãng đường thực tế, hạng chuồng, phí thủ tục từng nước, bảo hiểm và phụ phí gấp (nếu có).')}
                  </li>
                  <li style={{ marginBottom: 12 }}>
                    <Text strong style={{ color: '#f8fafc' }}>{t('policy.sec2.step4_title', 'Xem hợp đồng, chấp nhận báo giá và đặt cọc:')}</Text>{' '}
                    {t('policy.sec2.step4_desc_pre', 'Hệ thống tự động phát hành Hợp đồng vận chuyển điện tử. Khách có')}{' '}
                    <Text strong style={{ color: '#FBA919' }}>{policy.Booking.QuoteAcceptDays} {t('policy.units.days', 'ngày')}</Text>{' '}
                    {t('policy.sec2.step4_desc_post', 'để xem hợp đồng, chấp nhận báo giá và đặt cọc. Quá hạn, đơn tự động hủy và Khách không mất phí.')}
                  </li>
                  <li style={{ marginBottom: 12 }}>
                    <Text strong style={{ color: '#f8fafc' }}>{t('policy.sec2.step5_title', 'Làm hồ sơ:')}</Text>{' '}
                    {t('policy.sec2.step5_desc', 'Sau khi cọc, chuyên viên thông báo danh mục giấy tờ kiểm dịch cần thiết theo nước đi, quá cảnh và nước đến. Khách nộp chứng từ trực tiếp trên ứng dụng theo thời hạn quy định.')}
                  </li>
                  <li style={{ marginBottom: 12 }}>
                    <Text strong style={{ color: '#f8fafc' }}>{t('policy.sec2.step6_title', 'Xếp chuyến:')}</Text>{' '}
                    {t('policy.sec2.step6_desc', 'Công ty xếp ngựa vào chuyến phù hợp (phương tiện, đoàn xe, bác sĩ thú y theo xe).')}
                  </li>
                  <li style={{ marginBottom: 12 }}>
                    <Text strong style={{ color: '#f8fafc' }}>{t('policy.sec2.step7_title', 'Thanh toán phần còn lại:')}</Text>{' '}
                    {t('policy.sec2.step7_desc', 'Hoàn tất thanh toán số dư trước ngày xuất phát theo quy định tại mục 3.')}
                  </li>
                  <li>
                    <Text strong style={{ color: '#f8fafc' }}>{t('policy.sec2.step8_title', 'Vận chuyển và giao nhận:')}</Text>{' '}
                    {t('policy.sec2.step8_desc', 'Khách theo dõi hành trình GPS và nhật ký phúc lợi ngựa trên ứng dụng. Người nhận kiểm tra ngựa và ký e-POD khi nhận bàn giao.')}
                  </li>
                </ol>

                <Divider style={{ borderColor: 'rgba(255,255,255,0.08)' }} />
                <Title level={4} style={{ color: '#FBA919', fontSize: 16, marginBottom: 8 }}>
                  {t('policy.sec2.routeChangeTitle', 'Đổi tuyến sau khi đã chốt giá:')}
                </Title>
                <ul style={{ paddingLeft: 20, margin: 0, color: '#cbd5e1', lineHeight: 1.8 }}>
                  <li>
                    <Text strong style={{ color: '#f8fafc' }}>{t('policy.sec2.changeByCompany', 'Công ty đổi tuyến vì lý do vận hành:')}</Text>{' '}
                    {t('policy.sec2.changeByCompanyDesc', 'Giá đã chốt được giữ nguyên, công ty chịu toàn bộ chi phí chênh lệch. Nếu tuyến mới qua nước mới cần giấy tờ mà Khách không thể cung cấp, Khách được hủy đơn và nhận lại 100% số tiền đã trả.')}
                  </li>
                  <li>
                    <Text strong style={{ color: '#f8fafc' }}>{t('policy.sec2.changeByCustomer', 'Khách đổi điểm đón / điểm giao / lịch:')}</Text>{' '}
                    {t('policy.sec2.changeByCustomerDesc', 'Công ty phát hành báo giá mới. Khách chấp nhận báo giá mới thì đơn mới tiếp tục.')}
                  </li>
                </ul>
              </Card>

              {/* Mục 3 */}
              <Card id="sec-3" style={cardStyle} styles={{ body: cardBodyStyle }}>
                <Title level={3} style={sectionTitleStyle}>
                  3. {t('policy.sections.sec3', 'Thanh toán')}
                </Title>
                <Table
                  columns={paymentColumns}
                  dataSource={paymentData}
                  pagination={false}
                  bordered
                  style={{ marginBottom: 20 }}
                />
                <ul style={{ paddingLeft: 20, margin: 0, color: '#cbd5e1', lineHeight: 1.8 }}>
                  <li>{t('policy.sec3.rule1', 'Ngựa tuyệt đối không được đưa lên xe nếu đơn chưa thanh toán đủ phần còn lại.')}</li>
                  <li>{t('policy.sec3.rule2', 'Trường hợp có chi phí phát sinh chưa trả quá hạn: hệ thống sẽ nhắc nợ và Khách không tạo được đơn mới cho tới khi hoàn tất.')}</li>
                  <li>{t('policy.sec3.rule3', 'Tài xế và nhân viên áp tải tuyệt đối không thu tiền mặt. Mọi khoản thanh toán phải thực hiện qua ứng dụng.')}</li>
                </ul>
              </Card>

              {/* Mục 4 */}
              <Card id="sec-4" style={cardStyle} styles={{ body: cardBodyStyle }}>
                <Title level={3} style={sectionTitleStyle}>
                  4. {t('policy.sections.sec4', 'Hủy đơn và hoàn tiền')}
                </Title>
                <Table
                  columns={cancelColumns}
                  dataSource={cancelData}
                  pagination={false}
                  bordered
                  style={{ marginBottom: 20 }}
                />
                <Paragraph style={paragraphStyle}>
                  <Text strong style={{ color: '#f8fafc' }}>{t('policy.sec4.missingDocsTitle', 'Khách không nộp đủ giấy tờ đúng hạn:')}</Text>{' '}
                  {t('policy.sec4.missingDocsDesc_pre', 'Hệ thống gửi thông báo nhắc 2 lần. Hết hạn mà vẫn thiếu chứng từ bắt buộc, đơn sẽ bị hủy và xử lý như Khách hủy sau khi cọc (hoàn')}{' '}
                  <Text strong style={{ color: '#059669' }}>{policy.Payment.CancelRefundPercent}%</Text>{' '}
                  {t('policy.sec4.missingDocsDesc_post', 'tiền cọc).')}
                </Paragraph>
                <Paragraph style={paragraphStyle}>
                  <Text strong style={{ color: '#f8fafc' }}>{t('policy.sec4.companyCancelTitle', 'Công ty hủy đơn vì lý do nội bộ:')}</Text>{' '}
                  {t('policy.sec4.companyCancelDesc', 'Khách được hoàn lại 100% toàn bộ số tiền đã trả.')}
                </Paragraph>
              </Card>

              {/* Mục 5 */}
              <Card id="sec-5" style={cardStyle} styles={{ body: cardBodyStyle }}>
                <Title level={3} style={sectionTitleStyle}>
                  5. {t('policy.sections.sec5', 'Điều kiện ngựa được vận chuyển')}
                </Title>
                <Paragraph style={paragraphStyle}>
                  {t('policy.sec5.intro', 'Công ty từ chối vận chuyển ngựa thuộc một trong các trường hợp sau:')}
                </Paragraph>
                <ul style={{ paddingLeft: 20, margin: '0 0 16px 0', color: '#cbd5e1', lineHeight: 1.8 }}>
                  <li>
                    {t('policy.sec5.ruleAge_pre', 'Ngựa dưới')}{' '}
                    <Text strong style={{ color: '#ef4444' }}>{policy.Horse.MinAgeMonths} {t('policy.units.months', 'tháng tuổi')}</Text>{' '}
                    {t('policy.sec5.ruleAge_post', '(tính đến ngày cuối của khoảng ngày đón).')}
                  </li>
                  <li>
                    {t('policy.sec5.rulePregnancy', 'Ngựa cái mang thai đã quá 90% thai kỳ tại ngày khởi hành, hoặc vừa đẻ trong vòng 7 ngày.')}
                  </li>
                  <li>
                    {t('policy.sec5.ruleIllness', 'Ngựa ốm, bị chấn thương, suy yếu hoặc có dấu hiệu bệnh truyền nhiễm tại thời điểm nhận ngựa.')}
                  </li>
                </ul>
                <div
                  style={{
                    background: 'rgba(251, 169, 25, 0.08)',
                    border: '1px solid rgba(251, 169, 25, 0.25)',
                    padding: 16,
                    borderRadius: 12,
                    display: 'flex',
                    gap: 12,
                  }}
                >
                  <SafetyCertificateOutlined style={{ color: '#FBA919', fontSize: 20, marginTop: 2 }} />
                  <div>
                    <Text strong style={{ color: '#FBA919', display: 'block', marginBottom: 4 }}>
                      {t('policy.sec5.noMaxAgeTitle', 'Không giới hạn tuổi tối đa — Bắt buộc khám 48h')}
                    </Text>
                    <Text style={{ color: '#cbd5e1', fontSize: 13, lineHeight: 1.6 }}>
                      {t('policy.sec5.noMaxAgeDesc', 'Công ty không giới hạn độ tuổi tối đa của ngựa. Mọi con ngựa vận chuyển đều bắt buộc phải có Giấy chứng nhận khám lâm sàng thú y xác nhận đủ điều kiện di chuyển đường dài, được cấp trong vòng 48 giờ trước giờ xuất phát.')}
                    </Text>
                  </div>
                </div>
              </Card>

              {/* Mục 6 */}
              <Card id="sec-6" style={cardStyle} styles={{ body: cardBodyStyle }}>
                <Title level={3} style={sectionTitleStyle}>
                  6. {t('policy.sections.sec6', 'Giấy tờ và thủ tục')}
                </Title>
                <ul style={{ paddingLeft: 20, margin: 0, color: '#cbd5e1', lineHeight: 1.8 }}>
                  <li>{t('policy.sec6.item1', 'Khách cung cấp hồ sơ ngựa (hộ chiếu ngựa, chip vi mạch, chứng nhận tiêm phòng, kết quả xét nghiệm máu/dịch tễ) theo danh mục chuyên viên yêu cầu đối với từng quốc gia đi qua.')}</li>
                  <li>{t('policy.sec6.item2', 'Công ty đại diện Khách hàng thực hiện các thủ tục xin giấy phép nhập khẩu, quá cảnh và giấy chứng nhận kiểm dịch thú y quốc tế với cơ quan có thẩm quyền.')}</li>
                  <li>{t('policy.sec6.item3', 'Giấy phép trước khi đi không bảo đảm 100% qua được cửa khẩu. Tại cửa khẩu biên giới, cơ quan thú y và hải quan nước sở tại vẫn kiểm tra thực tế và có toàn quyền ra quyết định.')}</li>
                  <li>
                    {t('policy.sec6.item4', 'Giấy tờ phải còn hiệu lực tại giờ xuất phát thực tế. Nếu chuyến bị lùi làm giấy hết hạn: lùi do công ty thì công ty chịu phí làm lại; lùi do Khách thì Khách chịu phí.')}
                  </li>
                </ul>
              </Card>

              {/* Mục 7 */}
              <Card id="sec-7" style={cardStyle} styles={{ body: cardBodyStyle }}>
                <Title level={3} style={sectionTitleStyle}>
                  7. {t('policy.sections.sec7', 'Cam kết thời gian giao và bồi thường giao trễ')}
                </Title>
                <Paragraph style={paragraphStyle}>
                  {t('policy.sec7.commitment', 'Công ty cam kết giao ngựa trước hạn giao trễ nhất Khách đã chọn khi đặt đơn. Hạn giao được tính toán đảm bảo đủ thời gian trong trường hợp ngựa đón vào ngày cuối của khoảng đón.')}
                </Paragraph>
                <div
                  style={{
                    background: 'rgba(30, 41, 59, 0.7)',
                    border: '1px solid rgba(255, 255, 255, 0.08)',
                    borderRadius: 12,
                    padding: 20,
                    marginBottom: 16,
                  }}
                >
                  <Title level={4} style={{ color: '#FBA919', fontSize: 16, marginBottom: 12 }}>
                    {t('policy.sec7.formulaTitle', 'Mức bồi thường giao trễ (chỉ áp dụng khi trễ do lỗi của công ty):')}
                  </Title>
                  <ul style={{ paddingLeft: 20, margin: 0, color: '#cbd5e1', lineHeight: 1.8 }}>
                    <li>
                      {t('policy.sec7.grace_pre', 'Trễ không quá')}{' '}
                      <Text strong style={{ color: '#38bdf8' }}>{policy.Delay.GraceHours} {t('policy.units.hours', 'giờ')}</Text>: {t('policy.sec7.grace_post', 'miễn trừ bồi thường.')}
                    </li>
                    <li>
                      {t('policy.sec7.calc_pre', 'Sau 6 giờ, hoàn')}{' '}
                      <Text strong style={{ color: '#059669' }}>{policy.Delay.PercentPer12Hours}%</Text>{' '}
                      {t('policy.sec7.calc_mid', 'tiền cước vận chuyển cho mỗi 12 giờ trễ (chưa đủ 12 giờ tính tròn lên 12 giờ), tối đa không quá')}{' '}
                      <Text strong style={{ color: '#059669' }}>{policy.Delay.MaxPercent}%</Text>{' '}
                      {t('policy.sec7.calc_post', 'tiền cước.')}
                    </li>
                    <li>{t('policy.sec7.excludeFee', '"Tiền cước vận chuyển" không bao gồm phí bảo hiểm và phí thủ tục hồ sơ giấy tờ.')}</li>
                    <li>{t('policy.sec7.noIndirect', 'Không bồi thường đối với các thiệt hại gián tiếp: lỡ giải đua, mất tiền thưởng, lỡ hợp đồng thương mại.')}</li>
                  </ul>
                </div>
              </Card>

              {/* Mục 8 */}
              <Card id="sec-8" style={cardStyle} styles={{ body: cardBodyStyle }}>
                <Title level={3} style={sectionTitleStyle}>
                  8. {t('policy.sections.sec8', 'Bảo hiểm và giới hạn trách nhiệm')}
                </Title>
                <Title level={4} style={{ color: '#f8fafc', fontSize: 16, marginBottom: 8 }}>
                  8.1 {t('policy.sec8.sec81Title', 'Khai báo giá trị ngựa')}
                </Title>
                <Paragraph style={paragraphStyle}>
                  {t('policy.sec8.sec81Desc_pre', 'Khách khai báo giá trị cho từng con ngựa. Ngựa có giá trị từ')}{' '}
                  <Text strong style={{ color: '#FBA919' }}>{formatUsd(policy.Insurance.ProofThresholdUsd)} USD</Text>{' '}
                  {t('policy.sec8.sec81Desc_post', 'trở lên bắt buộc phải đính kèm chứng từ chứng minh: hóa đơn mua bán, chứng thư giám định định giá độc lập hoặc kết quả đấu giá chính thức.')}
                </Paragraph>

                <Title level={4} style={{ color: '#f8fafc', fontSize: 16, marginBottom: 12 }}>
                  8.2 {t('policy.sec8.sec82Title', 'Hai lựa chọn bảo hiểm')}
                </Title>
                <Table
                  columns={insuranceColumns}
                  dataSource={insuranceData}
                  pagination={false}
                  bordered
                  style={{ marginBottom: 20 }}
                />

                <Title level={4} style={{ color: '#f8fafc', fontSize: 16, marginBottom: 8 }}>
                  8.3 {t('policy.sec8.sec83Title', 'Thời hạn bảo hiểm & Quy trình khiếu nại bồi thường')}
                </Title>
                <Paragraph style={paragraphStyle}>
                  {t('policy.sec8.sec83Desc', 'Bảo hiểm có hiệu lực từ lúc ngựa được bốc lên xe tại điểm đón cho đến khi người nhận ký biên bản bàn giao e-POD. Khách hàng có quyền mở hồ sơ bồi thường trong vòng 24 giờ kể từ khi nhận ngựa nếu phát hiện chấn thương. Công ty phản hồi kết quả giải quyết trong vòng 7 ngày làm việc.')}
                </Paragraph>
              </Card>

              {/* Mục 9 */}
              <Card id="sec-9" style={cardStyle} styles={{ body: cardBodyStyle }}>
                <Title level={3} style={sectionTitleStyle}>
                  9. {t('policy.sections.sec9', 'Sự cố trong hành trình')}
                </Title>
                <Title level={4} style={{ color: '#f8fafc', fontSize: 16, marginBottom: 8 }}>
                  9.1 {t('policy.sec9.sec91Title', 'Nguyên tắc chung: Ai chịu lỗi thì người đó chịu chi phí')}
                </Title>
                <Table
                  columns={incidentColumns}
                  dataSource={incidentData}
                  pagination={false}
                  bordered
                  style={{ marginBottom: 20 }}
                />
                <Paragraph style={paragraphStyle}>
                  <Text strong style={{ color: '#f8fafc' }}>{t('policy.sec9.crewRuleTitle', 'Quy tắc an toàn nhân sự đoàn xe:')}</Text>{' '}
                  {t('policy.sec9.crewRuleDesc', 'Chuyến đi có thời gian lái thực tế dự kiến trên 9 giờ luôn được bố trí tối thiểu 2 tài xế luân phiên. Khi một tài xế gặp vấn đề sức khỏe, đoàn tạm dừng chờ nhân sự thay thế theo đúng quy chuẩn an toàn.')}
                </Paragraph>
                <Paragraph style={paragraphStyle}>
                  <Text strong style={{ color: '#f8fafc' }}>{t('policy.sec9.horseHealthTitle', 'Sức khỏe ngựa giữa đường:')}</Text>{' '}
                  {t('policy.sec9.horseHealthDesc', 'Ngựa có thể được chỉ định dỡ khẩn cấp tại phòng khám thú y hoặc chuồng lưu trú gần nhất theo quyết định của bác sĩ thú y áp tải để đảm bảo an toàn tính mạng.')}
                </Paragraph>
              </Card>

              {/* Mục 10 */}
              <Card id="sec-10" style={cardStyle} styles={{ body: cardBodyStyle }}>
                <Title level={3} style={sectionTitleStyle}>
                  10. {t('policy.sections.sec10', 'Giao nhận')}
                </Title>
                <ul style={{ paddingLeft: 20, margin: '0 0 16px 0', color: '#cbd5e1', lineHeight: 1.8 }}>
                  <li>
                    <Text strong style={{ color: '#f8fafc' }}>{t('policy.sec10.recipientTitle', 'Người nhận ngựa:')}</Text>{' '}
                    {t('policy.sec10.recipientDesc', 'Khách khai báo thông tin người nhận khi tạo đơn (họ tên, số điện thoại bắt buộc). Khách được quyền cập nhật người nhận cho tới trước khi xe đến điểm giao.')}
                  </li>
                  <li>
                    <Text strong style={{ color: '#f8fafc' }}>{t('policy.sec10.notificationTitle', 'Thông báo trước:')}</Text>{' '}
                    {t('policy.sec10.notificationDesc', 'Trước 24 giờ dự kiến tới, hệ thống gửi thông báo nhắc khách hàng xác nhận người nhận sẽ có mặt.')}
                  </li>
                </ul>

                <div
                  style={{
                    background: 'rgba(30, 41, 59, 0.7)',
                    border: '1px solid rgba(255, 255, 255, 0.08)',
                    borderRadius: 12,
                    padding: 20,
                  }}
                >
                  <Title level={4} style={{ color: '#FBA919', fontSize: 16, marginBottom: 8 }}>
                    {t('policy.sec10.waitingFeeTitle', 'Quy định phí chờ tại điểm giao:')}
                  </Title>
                  <Paragraph style={paragraphStyle}>
                    {t('policy.sec10.waitingFeeP1', 'Phương tiện được chờ miễn phí tối đa 2 giờ đầu tiên tại điểm giao. Sau thời gian này, áp dụng phí chờ:')}{' '}
                    <Tag color="volcano" style={{ fontSize: 14, fontWeight: 700 }}>
                      {policy.Delivery.WaitingFeePerHourUsd} USD / {t('policy.units.hour', 'giờ')}
                    </Tag>
                    , {t('policy.sec10.waitingFeeP2_pre', 'thời gian chờ tối đa không quá')}{' '}
                    <Text strong style={{ color: '#f8fafc' }}>{policy.Delivery.MaxWaitingHours} {t('policy.units.hours', 'giờ')}</Text>.{' '}
                    {t('policy.sec10.waitingFeeP2_post', 'Phí chờ do người đặt đơn thanh toán qua ứng dụng.')}
                  </Paragraph>
                </div>
              </Card>

              {/* Mục 11 */}
              <Card id="sec-11" style={cardStyle} styles={{ body: cardBodyStyle }}>
                <Title level={3} style={sectionTitleStyle}>
                  11. {t('policy.sections.sec11', 'Khiếu nại')}
                </Title>
                <Paragraph style={paragraphStyle}>
                  {t('policy.sec11.desc', 'Mọi khiếu nại về chất lượng dịch vụ, cước phí phát sinh hoặc bồi thường giao trễ phải được gửi qua ứng dụng trong vòng 7 ngày kể từ khi chuyến kết thúc (riêng khiếu nại thương tật của ngựa: trong vòng 24 giờ sau khi ký biên bản giao nhận). Công ty xem xét và phản hồi chính thức trong vòng 7 ngày làm việc.')}
                </Paragraph>
              </Card>

              {/* Mục 12 */}
              <Card id="sec-12" style={cardStyle} styles={{ body: cardBodyStyle }}>
                <Title level={3} style={sectionTitleStyle}>
                  12. {t('policy.sections.sec12', 'Hợp đồng vận chuyển')}
                </Title>
                <Paragraph style={paragraphStyle}>
                  {t('policy.sec12.p1', 'Khi có báo giá chốt, hệ thống tự động khởi tạo Hợp đồng vận chuyển điện tử. Chính sách dịch vụ này là phụ lục pháp lý không tách rời của hợp đồng.')}
                </Paragraph>
                <Paragraph style={paragraphStyle}>
                  {t('policy.sec12.p2', 'Khách hàng có trách nhiệm đọc kỹ toàn bộ hợp đồng trước khi xác nhận. Khi khách hàng bấm "Chấp nhận & đặt cọc", hợp đồng được xác lập dưới hình thức điện tử. Hệ thống tự động lưu trữ bằng chứng giao kết gồm tài khoản, thời điểm, địa chỉ IP và mã nhận dạng nội dung SHA-256.')}
                </Paragraph>
              </Card>

              {/* Mục 13 */}
              <Card id="sec-13" style={cardStyle} styles={{ body: cardBodyStyle }}>
                <Title level={3} style={sectionTitleStyle}>
                  13. {t('policy.sections.sec13', 'Thay đổi chính sách')}
                </Title>
                <Paragraph style={paragraphStyle}>
                  {t('policy.sec13.desc_pre', 'Công ty có quyền điều chỉnh chính sách này theo từng thời kỳ. Mỗi đơn hàng vận chuyển được áp dụng đúng phiên bản chính sách mà Khách hàng đã tích đồng ý tại thời điểm chấp nhận báo giá (phiên bản hiện hành:')}{' '}
                  <Tag color="gold" style={{ fontWeight: 700 }}>v{policyVersion}</Tag>
                  {t('policy.sec13.desc_post', ').')}
                </Paragraph>
              </Card>

            </Space>
          </Col>
        </Row>
      </div>

      <LandingFooter />
    </div>
  );
}

// Inline styling tokens
const cardStyle = {
  background: '#1e293b',
  borderRadius: 16,
  border: '1px solid rgba(255, 255, 255, 0.08)',
  boxShadow: '0 4px 20px rgba(0, 0, 0, 0.2)',
};

const cardBodyStyle = {
  padding: '32px 36px',
};

const sectionTitleStyle = {
  color: '#ffffff',
  fontSize: 22,
  fontWeight: 700,
  marginBottom: 20,
  borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
  paddingBottom: 12,
};

const paragraphStyle = {
  color: '#cbd5e1',
  fontSize: 15,
  lineHeight: 1.8,
  marginBottom: 16,
};
