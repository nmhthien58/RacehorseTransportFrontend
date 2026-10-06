import { http, HttpResponse } from 'msw';
import dossiersData from '../data/dossiers.json';

export const dossierHandlers = [
  // GET /api/dossiers
  http.get('/api/dossiers', () => {
    return HttpResponse.json({
      data: dossiersData,
      total: dossiersData.length,
    });
  }),

  // GET /api/dossiers/:id
  http.get('/api/dossiers/:id', ({ params }) => {
    const dossier = dossiersData.find((d) => d.DossierID === Number(params.id));
    if (!dossier) {
      return HttpResponse.json({ message: 'Dossier not found' }, { status: 404 });
    }
    return HttpResponse.json(dossier);
  }),

  // POST /api/dossiers/:id/approve
  http.post('/api/dossiers/:id/approve', ({ params }) => {
    const dossier = dossiersData.find((d) => d.DossierID === Number(params.id));
    if (!dossier) {
      return HttpResponse.json({ message: 'Dossier not found' }, { status: 404 });
    }
    return HttpResponse.json({
      ...dossier,
      Status: 'Cleared',
      ClearanceNumber: `VET-CERT-${Date.now()}`,
      ClearedAt: new Date().toISOString(),
    });
  }),
];
