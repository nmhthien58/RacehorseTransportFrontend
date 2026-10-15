import { Modal, Button, Tag, Row, Col, message } from 'antd';
import {
  DownloadOutlined,
  PrinterOutlined,
  CheckCircleOutlined,
} from '@ant-design/icons';

/**
 * Modal hiển thị Mẫu Đơn Pháp Lý & Hồ Sơ Kiểm Dịch Chuẩn Quốc Tế (Official Standard Form Preview)
 * Dùng chung cho Customer (VetRecordsPage) và Transport Specialist (DossierDetailPage)
 */
export default function StandardFormTemplateModal({
  open,
  onClose,
  docType = 'HEALTH_CERT',
  title = '',
  horse = {},
  onApply,
}) {
  const horseName = horse?.Name || horse?.name || 'Red Flash (Tia Chớp Đỏ)';
  const microchip = horse?.MicrochipNumber || horse?.microchipNumber || '982000412345671';
  const passport = horse?.PassportNumber || horse?.passportNumber || 'FEI-VN-2024-001';
  const breed = horse?.Breed || horse?.breed || 'Thoroughbred';
  const gender = horse?.Gender || horse?.gender || 'Stallion (Ngựa đực giống)';
  const owner = horse?.OwnerName || horse?.ownerName || 'Jane Smith (Trang trại Ba Vì)';

  // Cấu hình nội dung form theo từng loại giấy tờ
  const getFormConfig = () => {
    switch (docType) {
      case 'HORSE_PASSPORT':
      case 'Passport':
        return {
          emblem: '🐎',
          headerOrg: 'FÉDÉRATION EQUESTRE INTERNATIONALE (FEI)',
          subOrg: 'Official International Equine Identification & Microchip Registration Dossier',
          formCode: 'FEI FORM PASSPORT-ANNEX-IX (Rev. 2026)',
          formName: 'HỘ CHIẾU NGỰA QUỐC TẾ FEI & ĐỐI SOÁT VI MẠCH ISO',
          authority: 'Fédération Equestre Internationale (Lausanne, Switzerland)',
          color: '#1E3A8A',
          badgeColor: 'blue',
          certText: 'Xác nhận cá thể ngựa trên đã được đối soát sơ đồ nhận dạng xoáy lông (Whorls), màu sắc lông bờm, chân và cấy vi mạch ISO 11784/11785 tiêu chuẩn quốc tế.',
        };
      case 'VACCINE_RECORD':
      case 'Vaccination':
        return {
          emblem: '💉',
          headerOrg: 'FEI VETERINARY REGULATIONS & WOAH PROTOCOL',
          subOrg: 'Annex VI — Equine Influenza, Tetanus & Herpesvirus Vaccination Log',
          formCode: 'FEI VAX-CERT-2026/ANNEX-VI',
          formName: 'SỔ TIÊM CHỦNG VACCINE CÚM NGỰA & DỊCH TỄ HỌC QUỐC TẾ',
          authority: 'Phòng khám Thú y Hoàng Gia & Bác sĩ Thú y FEI cấp phép',
          color: '#065F46',
          badgeColor: 'green',
          certText: 'Chứng nhận cá thể ngựa đã được tiêm phòng đầy đủ 2 mũi vaccine Cúm ngựa cơ bản và mũi nhắc lại (Booster) trong vòng 6 tháng gần nhất, cách ngày bay tối thiểu 14 ngày.',
        };
      case 'COGGINS_EIA':
      case 'LabTest':
        return {
          emblem: '🩸',
          headerOrg: 'NATIONAL EQUINE REFERENCE LABORATORY',
          subOrg: 'Diagnostic Virology & Serology Division — WOAH Accredited Laboratory',
          formCode: 'AGID-EIA-TEST FORM 10-11',
          formName: 'PHIẾU XÉT NGHIỆM HUYẾT THANH COGGINS (EIA) & DỊCH TỄ ÂM TÍNH',
          authority: 'Viện Thú y Quốc gia / Trung tâm Chẩn đoán Thú y Trung ương',
          color: '#991B1B',
          badgeColor: 'volcano',
          certText: 'Mẫu huyết thanh được xét nghiệm bằng phương pháp Agar Gel Immunodiffusion (AGID) & PCR. Kết quả: ÂM TÍNH (NEGATIVE) với Thiếu máu truyền nhiễm Equine Infectious Anemia, EVA và Bệnh Loét mũi (Glanders).',
        };
      case 'IMPORT_PERMIT':
      case 'Permit':
        return {
          emblem: '🏛️',
          headerOrg: 'MINISTRY OF AGRICULTURE & BORDER CUSTOMS PROTECTION',
          subOrg: 'Department of Animal Quarantine & Customs Clearance Division',
          formCode: 'DAFF-AFCD CUSTOMS PERMIT 2026/EXP-88',
          formName: 'GIẤY PHÉP XUẤT NHẬP CẢNH & QUÁ CẢNH NGỰA ĐUA QUỐC TẾ',
          authority: 'Cơ quan Thú y & Hải quan Cửa khẩu Quốc tế',
          color: '#6B21A8',
          badgeColor: 'purple',
          certText: '🛡️ Nghiệp vụ do Chuyên viên Kiểm dịch (Transport Specialist) đại diện khách hàng xin cấp phép. Đã phê duyệt luồng xanh kiểm dịch tại cảng hàng không đích và bố trí chuồng cách ly.',
        };
      case 'DEWORMING':
      case 'Deworming':
        return {
          emblem: '💊',
          headerOrg: 'INTERNATIONAL EQUINE PARASITOLOGY CONSORTIUM',
          subOrg: 'Parasite Control & Anthelmintic Treatment Verification Protocol',
          formCode: 'FEI DEWORM-PROTOCOL-2026/SEC-4',
          formName: 'SỔ THEO DÕI TẨY GIUN & PHÒNG KÝ SINH TRÙNG ĐƯỜNG RUỘT',
          authority: 'Hội đồng Bác sĩ Thú y Ngựa đua & Phòng khám Thú y Hoàng Gia',
          color: '#0D9488',
          badgeColor: 'cyan',
          certText: 'Chứng nhận cá thể ngựa đã được xét nghiệm định lượng trứng giun (FEC) và dùng thuốc tẩy giun phổ rộng (Ivermectin/Praziquantel) trong vòng 30 ngày trước ngày xuất phát.',
        };
      case 'DENTAL':
      case 'Dental':
        return {
          emblem: '🦷',
          headerOrg: 'EQUINE DENTAL SPECIALISTS ASSOCIATION',
          subOrg: 'Annual Occlusal & Oral Health Examination Protocol',
          formCode: 'EDSA DENTAL-EXAM-2026/08',
          formName: 'PHIẾU KHÁM NHA KHOA & MÀI RĂNG NGỰA ĐUA CHUYÊN SÂU',
          authority: 'Chuyên gia Nha khoa Thú y FEI & Bệnh viện Thú y Quốc tế',
          color: '#4F46E5',
          badgeColor: 'geekblue',
          certText: 'Chứng nhận khớp cắn, răng hàm và khoang miệng của cá thể ngựa đã qua kiểm tra, mài cạnh sắc (floating) và loại bỏ điểm tỳ đau, đảm bảo ăn nhai và hô hấp ổn định trong suốt chuyến bay.',
        };
      case 'FARRIER':
      case 'Farrier':
        return {
          emblem: '🔨',
          headerOrg: 'MASTER FARRIERS ASSOCIATION & FEI EQUINE WELFARE',
          subOrg: 'Hoof Balance & Competition Shoeing Certification',
          formCode: 'MFA HOOF-CERT-2026/FEI-BAL',
          formName: 'PHIẾU CHĂM SÓC MÓNG GUỐC & ĐÓNG MÓNG THỂ THAO ĐẠT CHUẨN',
          authority: 'Hiệp hội Thợ đóng móng guốc Quốc tế & Bác sĩ Thú y FEI',
          color: '#78350F',
          badgeColor: 'volcano',
          certText: 'Cá thể ngựa đã được cân bằng góc móng guốc (Palmar Angle), kiểm tra độ dày thành móng và đóng móng nhôm thể thao/cao su chống trượt trong vòng 14 ngày trước ngày di chuyển.',
        };
      case 'WELLNESS':
      case 'Wellness':
        return {
          emblem: '🩺',
          headerOrg: 'FEI VETERINARY CLINICAL EXAMINATION BOARD',
          subOrg: 'Pre-flight Fit-to-Fly Comprehensive Veterinary Health Check',
          formCode: 'FEI FORM CLINICAL-FIT-TO-FLY 2026',
          formName: 'BIÊN BẢN KHÁM LÂM SÀNG SỨC KHỎE TỔNG QUÁT (FIT-TO-FLY)',
          authority: 'Bác sĩ Thú y Trưởng ban Kiểm tra FEI & Cục Thú y',
          color: '#0284C7',
          badgeColor: 'blue',
          certText: 'Cá thể ngựa đã qua kiểm tra thể lực toàn diện: Nhiệt độ 37.5°C, nhịp tim 36 bpm, niêm mạc hồng hào, nhu động ruột tốt, không có dấu hiệu đau bụng co thắt (Colic) hay khập khiễng, hoàn toàn đủ điều kiện xuất cảnh bằng đường hàng không.',
        };
      case 'OTHER':
      case 'Other':
        return {
          emblem: '📁',
          headerOrg: 'INTERNATIONAL VETERINARY TREATMENT REGISTRY',
          subOrg: 'Specialized Medical & Equine Treatment Summary Record',
          formCode: 'IVTR GENERAL-TREATMENT-LOG 2026',
          formName: 'HỒ SƠ BỆNH ÁN & THEO DÕI Y KHOA CHUYÊN BIỆT',
          authority: 'Hội đồng Y khoa & Bệnh viện Thú y Chuyên sâu',
          color: '#334155',
          badgeColor: 'default',
          certText: 'Ghi nhận chi tiết phác đồ chăm sóc, thuốc điều trị đặc thù hoặc nhật ký theo dõi y tế đặc biệt của cá thể ngựa trong quá trình huấn luyện và chuẩn bị xuất cảnh.',
        };
      case 'HEALTH_CERT':
      case 'HealthCert':
      default:
        return {
          emblem: '🩺',
          headerOrg: 'BỘ NÔNG NGHIỆP VÀ PHÁT TRIỂN NÔNG THÔN — CỤC THÚ Y',
          subOrg: 'Department of Animal Health Vietnam — WOAH / OIE Veterinary Certificate',
          formCode: 'FORM CVI-VN-77/043 (MẪU CHUẨN XUẤT KHẨU)',
          formName: 'GIẤY CHỨNG NHẬN KIỂM DỊCH ĐỘNG VẬT QUỐC TẾ (CVI HEALTH CERTIFICATE)',
          authority: 'Chi cục Thú y Vùng I / Cục Thú y Việt Nam',
          color: '#B45309',
          badgeColor: 'gold',
          certText: 'Chứng nhận kiểm dịch thú y: Cá thể ngựa đã qua kiểm tra lâm sàng trong vòng 48 giờ trước xuất hành, hoàn toàn khỏe mạnh, không có dấu hiệu bệnh truyền nhiễm, đủ điều kiện vận chuyển đường không.',
        };
    }
  };

  const config = getFormConfig();

  const handleDownload = () => {
    try {
      const htmlContent = `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <title>${title || config.formName}</title>
          <style>
            body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; padding: 40px; color: #1e293b; line-height: 1.5; }
            .header { text-align: center; border-bottom: 2px solid #0f172a; padding-bottom: 16px; margin-bottom: 20px; }
            .org { font-size: 18px; font-weight: 800; color: ${config.color}; text-transform: uppercase; }
            .sub { font-size: 13px; color: #475569; margin-top: 4px; }
            .code { display: inline-block; padding: 4px 10px; background: #f1f5f9; border-radius: 4px; font-weight: 700; margin-top: 8px; font-size: 12px; }
            .title { text-align: center; font-size: 20px; font-weight: 800; margin: 20px 0; text-transform: uppercase; }
            .box { background: #f8fafc; border: 1px solid #cbd5e1; border-radius: 8px; padding: 16px; margin-bottom: 16px; }
            .box-title { font-weight: 800; font-size: 13px; margin-bottom: 10px; color: #0f172a; }
            table { width: 100%; border-collapse: collapse; font-size: 13px; }
            td { padding: 6px 10px; border-bottom: 1px solid #e2e8f0; }
            .td-label { color: #64748b; width: 30%; }
            .cert-box { background: #f0fdf4; border: 1px solid #bbf7d0; padding: 16px; border-radius: 8px; font-size: 13px; color: #166534; line-height: 1.6; margin-bottom: 24px; }
            .signatures { display: flex; justify-content: space-between; margin-top: 40px; }
            .sig-col { width: 45%; text-align: center; font-size: 13px; }
            .sig-title { font-weight: 700; margin-bottom: 50px; color: #475569; }
            .seal { width: 90px; height: 90px; border: 2.5px dashed #dc2626; color: #dc2626; border-radius: 50%; margin: 0 auto; display: flex; flex-direction: column; align-items: center; justify-content: center; font-weight: 900; font-size: 9px; text-align: center; transform: rotate(-8deg); }
          </style>
        </head>
        <body>
          <div class="header">
            <div style="font-size: 32px; margin-bottom: 4px;">${config.emblem}</div>
            <div class="org">${config.headerOrg}</div>
            <div class="sub">${config.subOrg}</div>
            <div class="code">${config.formCode} • STANDARD OFFICIAL TEMPLATE</div>
          </div>
          <div class="title">${title || config.formName}</div>
          <div class="box">
            <div class="box-title">I. ĐẶC ĐIỂM NHẬN DẠNG CÁ THỂ NGỰA (EQUINE IDENTIFICATION)</div>
            <table>
              <tr><td class="td-label">1. Tên cá thể ngựa:</td><td><strong>${horseName}</strong></td></tr>
              <tr><td class="td-label">2. Số Microchip:</td><td><code>${microchip}</code></td></tr>
              <tr><td class="td-label">3. Số Hộ chiếu (Passport No):</td><td><strong>${passport}</strong></td></tr>
              <tr><td class="td-label">4. Giống ngựa (Breed):</td><td>${breed}</td></tr>
              <tr><td class="td-label">5. Giới tính (Sex):</td><td>${gender}</td></tr>
              <tr><td class="td-label">6. Chủ sở hữu (Owner):</td><td>${owner}</td></tr>
            </table>
          </div>
          <div class="cert-box">
            <div style="font-weight: 800; margin-bottom: 8px;">II. CHỨNG NHẬN DỊCH TỄ & KIỂM TRA LÂM SÀNG (OFFICIAL ATTESTATION)</div>
            ${config.certText}
          </div>
          <div class="signatures">
            <div class="sig-col">
              <div class="sig-title">BÁC SĨ THÚ Y CHUYÊN TRÁCH FEI<br><em>(Signature & License Stamp)</em></div>
              <div style="font-weight: 800; font-size: 14px;">Dr. Sarah Jenkins, DVM</div>
              <div style="color: #64748b; font-size: 11px;">FEI Official License #VN-8841</div>
            </div>
            <div class="sig-col">
              <div class="sig-title">CƠ QUAN THÚ Y & HẢI QUAN CỬA KHẨU<br><em>(Official Customs Stamp & Seal)</em></div>
              <div class="seal"><span>CỤC THÚ Y</span><span style="font-size: 11px;">★ ĐÃ KIỂM ★</span><span>CUSTOMS OK</span></div>
              <div style="font-size: 11px; color: #64748b; margin-top: 6px;">Số lưu trữ: ${config.formCode}</div>
            </div>
          </div>
        </body>
        </html>
      `;
      const blob = new Blob([htmlContent], { type: 'application/pdf' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${config.formCode.replace(/[/\\?%*:|"<>]/g, '_')}_${horseName.replace(/\s+/g, '_')}.pdf`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      message.success(`Đã tải xuống tệp PDF mẫu đơn chuẩn: ${config.formCode}.pdf`);
    } catch {
      message.info(`Đang tạo tệp mẫu đơn chuẩn: ${config.formCode}.pdf`);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  const handleApply = () => {
    onApply?.();
    message.success('Đã chọn mẫu đơn chuẩn đính kèm vào bộ hồ sơ kiểm dịch!');
    onClose?.();
  };

  return (
    <Modal
      open={open}
      onCancel={onClose}
      width={760}
      footer={[
        <Button key="close" onClick={onClose}>
          Đóng
        </Button>,
        <Button key="print" icon={<PrinterOutlined />} onClick={handlePrint}>
          In mẫu đơn
        </Button>,
        <Button key="download" type="default" icon={<DownloadOutlined />} onClick={handleDownload} style={{ borderColor: '#F59E0B', color: '#B45309', fontWeight: 600 }}>
          Tải file PDF mẫu
        </Button>,
        <Button key="apply" type="primary" icon={<CheckCircleOutlined />} onClick={handleApply} style={{ backgroundColor: '#16A34A', borderColor: '#16A34A', fontWeight: 700 }}>
          Sử dụng mẫu này
        </Button>,
      ]}
      styles={{ body: { padding: '20px 24px' } }}
    >
      <div
        id="standard-form-print-area"
        style={{
          border: '2px solid #CBD5E1',
          borderRadius: 12,
          padding: '24px 28px',
          backgroundColor: '#FFFFFF',
          boxShadow: '0 4px 16px rgba(0,0,0,0.04)',
          position: 'relative',
        }}
      >
        {/* HEADER CƠ QUAN BAN HÀNH */}
        <div style={{ textAlign: 'center', borderBottom: '2px solid #0F172A', paddingBottom: 16, marginBottom: 16 }}>
          <div style={{ fontSize: 32, marginBottom: 4 }}>{config.emblem}</div>
          <h3 style={{ margin: 0, fontSize: 15, fontWeight: 900, color: config.color, letterSpacing: 0.5, textTransform: 'uppercase' }}>
            {config.headerOrg}
          </h3>
          <div style={{ fontSize: 12, color: '#475569', fontWeight: 600, marginTop: 2 }}>
            {config.subOrg}
          </div>
          <div style={{ marginTop: 8, display: 'flex', justifyContent: 'center', gap: 8 }}>
            <Tag color={config.badgeColor} style={{ fontWeight: 800, fontSize: 11 }}>
              {config.formCode}
            </Tag>
            <Tag color="default" style={{ fontSize: 11 }}>
              Standard ISO/FEI Compliant
            </Tag>
          </div>
        </div>

        {/* TIÊU ĐỀ BIỂU MẪU */}
        <div style={{ textAlign: 'center', marginBottom: 20 }}>
          <h2 style={{ margin: 0, fontSize: 17, fontWeight: 800, color: '#0F172A', textTransform: 'uppercase' }}>
            {title || config.formName}
          </h2>
          <span style={{ fontSize: 12, color: '#64748B', fontStyle: 'italic' }}>
            Ban hành kèm theo Quy chuẩn Kiểm dịch Động vật sống phục vụ Thi đấu Thể thao Quốc tế
          </span>
        </div>

        {/* KHỐI 1: THÔNG TIN CÁ THỂ NGỰA */}
        <div style={{ backgroundColor: '#F8FAFC', borderRadius: 8, border: '1px solid #E2E8F0', padding: '12px 16px', marginBottom: 16 }}>
          <div style={{ fontSize: 13, fontWeight: 800, color: '#1E293B', marginBottom: 8, display: 'flex', justifyContent: 'space-between' }}>
            <span>I. ĐẶC ĐIỂM NHẬN DẠNG CÁ THỂ NGỰA (EQUINE IDENTIFICATION)</span>
            <span style={{ fontSize: 11, color: '#64748B' }}>Microchip Checked ✓</span>
          </div>

          <Row gutter={[16, 8]} style={{ fontSize: 12.5 }}>
            <Col xs={24} sm={12}>
              <span style={{ color: '#64748B' }}>1. Tên cá thể ngựa:</span> <strong>{horseName}</strong>
            </Col>
            <Col xs={24} sm={12}>
              <span style={{ color: '#64748B' }}>2. Số Microchip:</span>{' '}
              <code style={{ fontWeight: 700, color: '#1D4ED8' }}>{microchip}</code>
            </Col>
            <Col xs={24} sm={12}>
              <span style={{ color: '#64748B' }}>3. Số Hộ chiếu (Passport No):</span> <strong>{passport}</strong>
            </Col>
            <Col xs={24} sm={12}>
              <span style={{ color: '#64748B' }}>4. Giống ngựa (Breed):</span> <strong>{breed}</strong>
            </Col>
            <Col xs={24} sm={12}>
              <span style={{ color: '#64748B' }}>5. Giới tính (Sex):</span> <strong>{gender}</strong>
            </Col>
            <Col xs={24} sm={12}>
              <span style={{ color: '#64748B' }}>6. Chủ sở hữu (Owner):</span> <strong>{owner}</strong>
            </Col>
          </Row>
        </div>

        {/* KHỐI 2: CHỨNG NHẬN Y TẾ & KẾT QUẢ XÉT NGHIỆM */}
        <div style={{ backgroundColor: '#F0FDF4', borderRadius: 8, border: '1px solid #BBF7D0', padding: '12px 16px', marginBottom: 16 }}>
          <div style={{ fontSize: 13, fontWeight: 800, color: '#166534', marginBottom: 6 }}>
            II. CHỨNG NHẬN DỊCH TỄ & KIỂM TRA LÂM SÀNG (OFFICIAL ATTESTATION)
          </div>
          <p style={{ margin: 0, fontSize: 12.5, color: '#14532D', lineHeight: 1.5 }}>
            {config.certText}
          </p>

          <div style={{ marginTop: 10, display: 'flex', gap: 12, flexWrap: 'wrap', fontSize: 11.5, color: '#15803D' }}>
            <span>✓ Coggins EIA: Âm tính</span>
            <span>✓ Equine Influenza: Đã tiêm nhắc lại</span>
            <span>✓ EVA / Glanders: Âm tính</span>
            <span>✓ Lâm sàng: Fit-to-Fly</span>
          </div>
        </div>

        {/* KHỐI 3: MỘC VÀ CHỮ KÝ CƠ QUAN THẨM QUYỀN */}
        <div style={{ marginTop: 20 }}>
          <Row gutter={16}>
            <Col xs={12} style={{ textAlign: 'center' }}>
              <div style={{ fontSize: 12, color: '#64748B', marginBottom: 30 }}>
                BÁC SĨ THÚ Y CHUYÊN TRÁCH FEI<br />
                <em>(Ký, ghi rõ họ tên và số chứng chỉ)</em>
              </div>
              <div style={{ fontWeight: 800, fontSize: 13, color: '#0F172A' }}>
                Dr. Sarah Jenkins, DVM
              </div>
              <div style={{ fontSize: 11, color: '#64748B' }}>FEI Vet License #VN-8841</div>
            </Col>
            <Col xs={12} style={{ textAlign: 'center' }}>
              <div style={{ fontSize: 12, color: '#64748B', marginBottom: 8 }}>
                CƠ QUAN THÚ Y & HẢI QUAN CỬA KHẨU<br />
                <em>(Ký duyệt & Đóng dấu mộc tròn)</em>
              </div>
              {/* Dấu mộc tròn đỏ mô phỏng */}
              <div
                style={{
                  width: 90,
                  height: 90,
                  borderRadius: '50%',
                  border: '2.5px dashed #DC2626',
                  color: '#DC2626',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center',
                  margin: '0 auto',
                  fontSize: 9,
                  fontWeight: 900,
                  textTransform: 'uppercase',
                  transform: 'rotate(-8deg)',
                  boxShadow: '0 0 10px rgba(220, 38, 38, 0.15)',
                }}
              >
                <span>CỤC THÚ Y</span>
                <span style={{ fontSize: 11 }}>★ ĐÃ KIỂM ★</span>
                <span>CUSTOMS OK</span>
              </div>
              <div style={{ fontSize: 11, color: '#64748B', marginTop: 4 }}>
                Số công văn: <code>CVI-DAH-2026/884</code>
              </div>
            </Col>
          </Row>
        </div>
      </div>
    </Modal>
  );
}
