import { http, HttpResponse } from 'msw';
import {
  getStoredDossiers,
  saveStoredDossiers,
} from '../../utils/dossierStorage';

export const dossierHandlers = [
  // GET /api/dossiers
  http.get('/api/dossiers', () => {
    const dossiers = getStoredDossiers();
    return HttpResponse.json({
      success: true,
      data: dossiers,
      total: dossiers.length,
      pagination: {
        page: 1,
        pageSize: 10,
        totalItems: dossiers.length,
        totalPages: Math.ceil(dossiers.length / 10) || 1,
      },
    });
  }),

  // GET /api/dossiers/:id
  http.get('/api/dossiers/:id', ({ params }) => {
    const dossiers = getStoredDossiers();
    const dossier = dossiers.find((d) => d.dossierId === Number(params.id));
    if (!dossier) {
      return HttpResponse.json({ success: false, message: 'Dossier not found' }, { status: 404 });
    }
    return HttpResponse.json({
      success: true,
      data: dossier,
      ...dossier,
    });
  }),

  // POST /api/dossiers/:id/request-documents
  http.post('/api/dossiers/:id/request-documents', ({ params }) => {
    return HttpResponse.json({
      success: true,
      message: `Đã gửi thông báo yêu cầu bổ sung giấy tờ cho hồ sơ ${params.id}`,
    });
  }),

  // POST /api/dossiers/:id/documents
  http.post('/api/dossiers/:id/documents', ({ params }) => {
    return HttpResponse.json({
      success: true,
      message: `Tải lên giấy tờ cho hồ sơ ${params.id} thành công`,
      data: { documentId: Date.now(), status: 'Pending' },
    }, { status: 201 });
  }),

  // POST /api/documents/:id/approve
  http.post('/api/documents/:id/approve', ({ params }) => {
    return HttpResponse.json({
      success: true,
      message: `Đã duyệt giấy tờ ${params.id}`,
    });
  }),

  // POST /api/documents/:id/reject
  http.post('/api/documents/:id/reject', ({ params }) => {
    return HttpResponse.json({
      success: true,
      message: `Đã từ chối giấy tờ ${params.id}`,
    });
  }),

  // POST /api/dossiers/:id/submit -> Đổi status Reviewing -> SubmittedToAuthorities
  http.post('/api/dossiers/:id/submit', ({ params }) => {
    const dossiers = getStoredDossiers();
    const dossier = dossiers.find((d) => d.dossierId === Number(params.id));
    if (!dossier) {
      return HttpResponse.json({ success: false, message: 'Dossier not found' }, { status: 404 });
    }
    if (dossier.status !== 'Reviewing') {
      return HttpResponse.json(
        {
          success: false,
          message: `Chỉ có thể nộp lên cơ quan chức năng khi hồ sơ ở trạng thái Reviewing (trạng thái hiện tại: ${dossier.status})`,
        },
        { status: 400 }
      );
    }
    dossier.status = 'SubmittedToAuthorities';
    saveStoredDossiers(dossiers);
    return HttpResponse.json({
      success: true,
      message: 'Hồ sơ đã được nộp cho cơ quan chức năng',
      data: dossier,
      ...dossier,
    });
  }),

  // POST /api/dossiers/:id/submit-to-authorities (Bí danh tương thích ngược)
  http.post('/api/dossiers/:id/submit-to-authorities', ({ params }) => {
    const dossiers = getStoredDossiers();
    const dossier = dossiers.find((d) => d.dossierId === Number(params.id));
    if (!dossier) {
      return HttpResponse.json({ success: false, message: 'Dossier not found' }, { status: 404 });
    }
    if (dossier.status !== 'Reviewing') {
      return HttpResponse.json(
        {
          success: false,
          message: `Chỉ có thể nộp lên cơ quan chức năng khi hồ sơ ở trạng thái Reviewing (trạng thái hiện tại: ${dossier.status})`,
        },
        { status: 400 }
      );
    }
    dossier.status = 'SubmittedToAuthorities';
    saveStoredDossiers(dossiers);
    return HttpResponse.json({
      success: true,
      message: 'Hồ sơ đã được nộp cho cơ quan chức năng',
      data: dossier,
      ...dossier,
    });
  }),

  // POST /api/dossiers/:id/approve -> Chỉ thành công nếu status = SubmittedToAuthorities, đổi thành Cleared
  http.post('/api/dossiers/:id/approve', async ({ params, request }) => {
    const dossiers = getStoredDossiers();
    const dossier = dossiers.find((d) => d.dossierId === Number(params.id));
    if (!dossier) {
      return HttpResponse.json({ success: false, message: 'Dossier not found' }, { status: 404 });
    }
    if (dossier.status !== 'SubmittedToAuthorities') {
      return HttpResponse.json(
        {
          success: false,
          message: `Only a dossier submitted to the authorities can be cleared (current status: ${dossier.status}).`,
        },
        { status: 400 }
      );
    }
    const body = await request.json().catch(() => ({}));
    dossier.status = 'Cleared';
    dossier.clearanceNumber = body.clearanceNumber || `VET-CERT-${new Date().getFullYear()}-${String(dossier.dossierId).padStart(4, '0')}`;
    dossier.clearedAt = new Date().toISOString();
    saveStoredDossiers(dossiers);

    return HttpResponse.json({
      success: true,
      message: 'Bộ hồ sơ đã được thông quan thành công',
      data: dossier,
      ...dossier,
    });
  }),

  // POST /api/dossiers/:id/clear (Bí danh tương thích ngược)
  http.post('/api/dossiers/:id/clear', async ({ params, request }) => {
    const dossiers = getStoredDossiers();
    const dossier = dossiers.find((d) => d.dossierId === Number(params.id));
    if (!dossier) {
      return HttpResponse.json({ success: false, message: 'Dossier not found' }, { status: 404 });
    }
    if (dossier.status !== 'SubmittedToAuthorities') {
      return HttpResponse.json(
        {
          success: false,
          message: `Only a dossier submitted to the authorities can be cleared (current status: ${dossier.status}).`,
        },
        { status: 400 }
      );
    }
    const body = await request.json().catch(() => ({}));
    dossier.status = 'Cleared';
    dossier.clearanceNumber = body.clearanceNumber || `VET-CERT-${new Date().getFullYear()}-${String(dossier.dossierId).padStart(4, '0')}`;
    dossier.clearedAt = new Date().toISOString();
    saveStoredDossiers(dossiers);

    return HttpResponse.json({
      success: true,
      message: 'Bộ hồ sơ đã được thông quan thành công',
      data: dossier,
      ...dossier,
    });
  }),

  // POST /api/dossiers/:id/issue
  http.post('/api/dossiers/:id/issue', ({ params }) => {
    const dossiers = getStoredDossiers();
    const dossier = dossiers.find((d) => d.dossierId === Number(params.id));
    if (dossier) {
      dossier.status = 'Issue';
      saveStoredDossiers(dossiers);
    }
    return HttpResponse.json({
      success: true,
      message: 'Đã báo sự cố cho hồ sơ kiểm dịch',
      data: dossier,
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
