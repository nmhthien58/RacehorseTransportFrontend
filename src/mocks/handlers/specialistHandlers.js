import { http, HttpResponse } from 'msw';
import specialistDossiersData from '../data/specialistDossiersData.json';
import quarantineRulesData from '../data/quarantineRulesData.json';

// Trạng thái bộ nhớ của dossiers phục vụ tương tác trên giao diện
let dossiers = JSON.parse(JSON.stringify(specialistDossiersData));
let rules = JSON.parse(JSON.stringify(quarantineRulesData));

/**
 * Cập nhật lại số lượng giấy tờ đã duyệt và kiểm tra xem hồ sơ đã sẵn sàng nộp cơ quan chức năng hay chưa
 * @param {Object} dossier
 */
function recalculateDossierState(dossier) {
  if (!dossier || !dossier.checklist) return;
  const mandatoryDocs = dossier.checklist.filter((item) => item.isMandatory);
  const approvedMandatory = mandatoryDocs.filter((item) => item.state === 'Approved');
  dossier.requiredCount = mandatoryDocs.length;
  dossier.approvedCount = approvedMandatory.length;
  dossier.isReadyToSubmit = approvedMandatory.length === mandatoryDocs.length;
}

/**
 * Lọc danh sách quy định kiểm dịch theo tham số query
 * @param {Request} request
 * @returns {HttpResponse}
 */
function filterQuarantineRules(request) {
  const url = new URL(request.url);
  const countryCode = url.searchParams.get('countryCode');
  const direction = url.searchParams.get('direction');
  const search = url.searchParams.get('search')?.toLowerCase() || '';

  let result = [...rules];

  if (countryCode && countryCode !== 'all') {
    result = result.filter((r) => r.countryCode.toLowerCase() === countryCode.toLowerCase());
  }

  if (direction && direction !== 'all') {
    result = result.filter((r) => r.direction.toLowerCase() === direction.toLowerCase());
  }

  if (search) {
    result = result.filter(
      (r) =>
        r.docTypeName.toLowerCase().includes(search) ||
        r.countryName.toLowerCase().includes(search) ||
        r.regulationNote.toLowerCase().includes(search) ||
        r.issuingAuthority.toLowerCase().includes(search)
    );
  }

  return HttpResponse.json({
    success: true,
    data: result,
    total: result.length,
  });
}

export const specialistHandlers = [
  // 1. Thống kê tổng quan cho màn Compliance Overview (/specialist/dashboard)
  http.get('/api/specialist/overview', () => {
    const overdueCount = dossiers.filter((d) => d.slaStatus === 'Overdue').length;
    const pendingCount = dossiers.filter((d) => d.status === 'Reviewing' || d.status === 'AwaitingDocs').length;
    const activeQuarantineCount = dossiers.filter((d) => ['Reviewing', 'SubmittedToAuthorities', 'Draft'].includes(d.status)).length;
    const exceptionsCount = dossiers.filter((d) => d.status === 'Issue').length;

    // Danh sách ưu tiên cần xử lý ngay (Hết SLA hoặc vướng mắc hoặc đang thẩm định)
    const priorityActionQueue = dossiers
      .filter((d) => d.status === 'Issue' || d.slaStatus === 'Overdue' || d.status === 'Reviewing')
      .slice(0, 5);

    // Danh sách hồ sơ khách hàng vừa nộp tài liệu
    const customerUploadedDossiers = dossiers
      .filter((d) => d.documents && d.documents.length > 0)
      .slice(0, 5);

    return HttpResponse.json({
      success: true,
      data: {
        stats: {
          overdueDossiers: overdueCount,
          pendingApproval: pendingCount,
          activeQuarantine: activeQuarantineCount,
          exceptions: exceptionsCount,
        },
        priorityActionQueue,
        customerUploadedDossiers,
        authorityComplianceStatus: {
          total: dossiers.length,
          cleared: dossiers.filter((d) => d.status === 'Cleared').length,
          submittedToAuthorities: dossiers.filter((d) => d.status === 'SubmittedToAuthorities').length,
          reviewing: dossiers.filter((d) => d.status === 'Reviewing').length,
          awaitingDocs: dossiers.filter((d) => d.status === 'AwaitingDocs').length,
          issue: dossiers.filter((d) => d.status === 'Issue').length,
          complianceRate: 94.2,
        },
      },
    });
  }),

  // 2. Lấy danh sách hồ sơ kiểm dịch (hỗ trợ filter, search, sort, pagination)
  http.get('/api/dossiers', ({ request }) => {
    const url = new URL(request.url);
    const status = url.searchParams.get('status');
    const search = url.searchParams.get('search')?.toLowerCase() || '';
    const page = Number.parseInt(url.searchParams.get('page') || '1', 10);
    const pageSize = Number.parseInt(url.searchParams.get('pageSize') || url.searchParams.get('size') || '10', 10);

    let filtered = [...dossiers];

    if (status && status !== 'all' && status !== 'All') {
      filtered = filtered.filter((d) => d.status.toLowerCase() === status.toLowerCase());
    }

    if (search) {
      filtered = filtered.filter(
        (d) =>
          d.dossierCode.toLowerCase().includes(search) ||
          d.horseName.toLowerCase().includes(search) ||
          d.customerName.toLowerCase().includes(search) ||
          d.microchipNumber.toLowerCase().includes(search) ||
          d.bookingCode.toLowerCase().includes(search)
      );
    }

    const startIndex = (page - 1) * pageSize;
    const paginated = filtered.slice(startIndex, startIndex + pageSize);

    return HttpResponse.json({
      success: true,
      data: paginated,
      total: filtered.length,
      pagination: {
        page,
        pageSize,
        totalItems: filtered.length,
        totalPages: Math.ceil(filtered.length / pageSize) || 1,
      },
    });
  }),

  // 3. Chi tiết một bộ hồ sơ kiểm dịch kèm checklist
  http.get('/api/dossiers/:id', ({ params }) => {
    const dossierId = Number(params.id);
    const dossier = dossiers.find((d) => d.dossierId === dossierId);

    if (!dossier) {
      return HttpResponse.json({ success: false, message: 'Không tìm thấy hồ sơ kiểm dịch' }, { status: 404 });
    }

    recalculateDossierState(dossier);

    return HttpResponse.json({
      success: true,
      data: dossier,
      ...dossier,
    });
  }),

  // 4. Phê duyệt một tài liệu trong checklist
  http.post('/api/documents/:id/approve', ({ params }) => {
    const docId = Number(params.id);
    let targetDoc = null;
    let targetDossier = null;

    for (const d of dossiers) {
      const foundChecklist = d.checklist?.find((c) => c.latestDocument?.documentId === docId);
      if (foundChecklist && foundChecklist.latestDocument) {
        foundChecklist.state = 'Approved';
        foundChecklist.latestDocument.status = 'Approved';
        foundChecklist.latestDocument.reviewedByName = 'Nguyễn Thị Mai';
        foundChecklist.latestDocument.reviewedAt = new Date().toISOString();
        targetDoc = foundChecklist.latestDocument;
        targetDossier = d;
        break;
      }
    }

    if (targetDossier) {
      recalculateDossierState(targetDossier);
    }

    return HttpResponse.json({
      success: true,
      message: 'Đã phê duyệt tài liệu thành công',
      data: targetDoc,
    });
  }),

  // 5. Từ chối một tài liệu trong checklist kèm lý do
  http.post('/api/documents/:id/reject', async ({ params, request }) => {
    const docId = Number(params.id);
    const body = await request.json().catch(() => ({}));
    const reason = body.reason || body.correctionNote || 'Tài liệu không đạt yêu cầu theo quy chuẩn';

    let targetDoc = null;
    let targetDossier = null;

    for (const d of dossiers) {
      const foundChecklist = d.checklist?.find((c) => c.latestDocument?.documentId === docId);
      if (foundChecklist && foundChecklist.latestDocument) {
        foundChecklist.state = 'Rejected';
        foundChecklist.latestDocument.status = 'Rejected';
        foundChecklist.latestDocument.correctionNote = reason;
        foundChecklist.latestDocument.rejectionCount = (foundChecklist.latestDocument.rejectionCount || 0) + 1;
        foundChecklist.latestDocument.reviewedByName = 'Nguyễn Thị Mai';
        foundChecklist.latestDocument.reviewedAt = new Date().toISOString();

        if (foundChecklist.latestDocument.rejectionCount >= 3) {
          d.status = 'Issue';
          d.issueReason = `Tài liệu ${foundChecklist.docTypeName} đã bị từ chối 3 lần. Cần liên hệ trực tiếp khách hàng.`;
        }

        targetDoc = foundChecklist.latestDocument;
        targetDossier = d;
        break;
      }
    }

    if (targetDossier) {
      recalculateDossierState(targetDossier);
    }

    return HttpResponse.json({
      success: true,
      message: 'Đã từ chối tài liệu và ghi nhận lý do bổ sung',
      data: targetDoc,
    });
  }),

  // 6. Yêu cầu khách hàng nộp / bổ sung giấy tờ
  http.post('/api/dossiers/:id/request-documents', async ({ params, request }) => {
    const dossierId = Number(params.id);
    const body = await request.json().catch(() => ({}));
    const dossier = dossiers.find((d) => d.dossierId === dossierId);

    if (dossier) {
      dossier.status = 'AwaitingDocs';
      const docListText = body.documentTypes?.length ? ` [Cần bổ sung: ${body.documentTypes.join(', ')}]` : '';
      if (body.notes || docListText) {
        dossier.issueReason = `${body.notes || 'Yêu cầu kiểm tra và bổ sung tài liệu'}${docListText}`;
      }
    }

    return HttpResponse.json({
      success: true,
      message: `Đã gửi thông báo yêu cầu nộp giấy tờ cho hồ sơ ${dossier?.dossierCode || dossierId}`,
      data: dossier,
    });
  }),

  // 7. Nộp bộ hồ sơ đã hoàn chỉnh lên Cơ quan chức năng (Cục Thú y / Hải quan)
  http.post('/api/dossiers/:id/submit-to-authorities', ({ params }) => {
    const dossierId = Number(params.id);
    const dossier = dossiers.find((d) => d.dossierId === dossierId);

    if (!dossier) {
      return HttpResponse.json({ success: false, message: 'Không tìm thấy hồ sơ' }, { status: 404 });
    }

    dossier.status = 'SubmittedToAuthorities';

    return HttpResponse.json({
      success: true,
      message: 'Bộ hồ sơ đã được nộp thành công lên Cơ quan Chức năng',
      data: dossier,
    });
  }),

  // Bí danh nộp hồ sơ kiểm dịch (/submit tương đương /submit-to-authorities)
  http.post('/api/dossiers/:id/submit', ({ params }) => {
    const dossierId = Number(params.id);
    const dossier = dossiers.find((d) => d.dossierId === dossierId);

    if (!dossier) {
      return HttpResponse.json({ success: false, message: 'Không tìm thấy hồ sơ' }, { status: 404 });
    }

    dossier.status = 'SubmittedToAuthorities';

    return HttpResponse.json({
      success: true,
      message: 'Hồ sơ đã được nộp cho cơ quan chức năng',
      data: dossier,
      ...dossier,
    });
  }),

  // Tải lên giấy tờ cho hồ sơ
  http.post('/api/dossiers/:id/documents', ({ params }) => {
    return HttpResponse.json(
      {
        success: true,
        message: `Tải lên giấy tờ cho hồ sơ ${params.id} thành công`,
        data: { documentId: Date.now(), status: 'Pending' },
      },
      { status: 201 }
    );
  }),

  // 8. Cấp phép thông quan thành công (Cleared)
  http.post('/api/dossiers/:id/clear', async ({ params, request }) => {
    const dossierId = Number(params.id);
    const body = await request.json().catch(() => ({}));
    const dossier = dossiers.find((d) => d.dossierId === dossierId);

    if (!dossier) {
      return HttpResponse.json({ success: false, message: 'Không tìm thấy hồ sơ' }, { status: 404 });
    }

    dossier.status = 'Cleared';
    dossier.clearanceNumber = body.clearanceNumber || `VET-CERT-${new Date().getFullYear()}-${String(dossierId).padStart(4, '0')}`;
    dossier.clearedAt = new Date().toISOString();
    dossier.issueReason = null;

    return HttpResponse.json({
      success: true,
      message: 'Hồ sơ đã được phê duyệt thông quan thành công (Cleared)',
      data: dossier,
      ...dossier,
    });
  }),

  // 9. Báo vướng mắc / sự cố kiểm dịch (Issue)
  http.post('/api/dossiers/:id/issue', async ({ params, request }) => {
    const dossierId = Number(params.id);
    const body = await request.json().catch(() => ({}));
    const dossier = dossiers.find((d) => d.dossierId === dossierId);

    if (!dossier) {
      return HttpResponse.json({ success: false, message: 'Không tìm thấy hồ sơ' }, { status: 404 });
    }

    dossier.status = 'Issue';
    dossier.issueReason = body.reason || body.issueDescription || 'Cơ quan chức năng yêu cầu làm rõ hồ sơ kiểm dịch';

    return HttpResponse.json({
      success: true,
      message: 'Đã ghi nhận sự cố kiểm dịch cho hồ sơ',
      data: dossier,
    });
  }),

  // 10. Tra cứu cơ sở dữ liệu quy định kiểm dịch thú y quốc tế (Quarantine Rules DB)
  http.get('/api/clearance/requirements', ({ request }) => filterQuarantineRules(request)),

  // Alias cho quarantine rules
  http.get('/api/quarantine-rules', ({ request }) => filterQuarantineRules(request)),

  // Bí danh phê duyệt hồ sơ thông quan (/approve tương đương /clear)
  http.post('/api/dossiers/:id/approve', async ({ params, request }) => {
    const dossierId = Number(params.id);
    const body = await request.json().catch(() => ({}));
    const dossier = dossiers.find((d) => d.dossierId === dossierId);

    if (!dossier) {
      return HttpResponse.json({ success: false, message: 'Không tìm thấy hồ sơ' }, { status: 404 });
    }

    dossier.status = 'Cleared';
    dossier.clearanceNumber = body.clearanceNumber || `VET-CERT-${new Date().getFullYear()}-${String(dossierId).padStart(4, '0')}`;
    dossier.clearedAt = new Date().toISOString();
    dossier.issueReason = null;

    return HttpResponse.json({
      success: true,
      message: 'Bộ hồ sơ đã được thông quan thành công',
      data: dossier,
      ...dossier,
    });
  }),

  // Document types lookup
  http.get('/api/document-types/lookup', () => {
    return HttpResponse.json({
      success: true,
      data: [
        { docTypeId: 1, docTypeCode: 'HORSE_PASSPORT', docTypeName: 'Hộ chiếu ngựa FEI' },
        { docTypeId: 2, docTypeCode: 'COGGINS_EIA', docTypeName: 'Chứng nhận xét nghiệm Coggins âm tính' },
        { docTypeId: 3, docTypeCode: 'HEALTH_CERT', docTypeName: 'Giấy chứng nhận kiểm dịch xuất nhập khẩu' },
      ],
    });
  }),
];
