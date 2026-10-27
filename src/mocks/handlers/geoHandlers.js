import { http, HttpResponse } from 'msw';

// Dữ liệu giả cho chế độ mock: vài địa điểm mẫu, chỉ đường = đường thẳng × 1,3
const PLACES = [
  { displayName: 'Ba Vì, Hà Nội, Việt Nam', lat: 21.1415, lng: 105.4183, countryCode: 'VN' },
  { displayName: 'Quận 1, Thành phố Hồ Chí Minh, Việt Nam', lat: 10.7769, lng: 106.7009, countryCode: 'VN' },
  { displayName: 'Cửa khẩu Hữu Nghị, Lạng Sơn, Việt Nam', lat: 21.9749, lng: 106.7064, countryCode: 'VN' },
  { displayName: 'Nam Ninh, Quảng Tây, Trung Quốc', lat: 22.8158, lng: 108.318, countryCode: 'CN' },
  { displayName: 'Phnom Penh, Campuchia', lat: 11.5564, lng: 104.9282, countryCode: 'KH' },
  { displayName: 'Bangkok, Thái Lan', lat: 13.7563, lng: 100.5018, countryCode: 'TH' },
];

const ok = (data) => HttpResponse.json({ success: true, message: 'Request processed successfully', data, errors: null });

const km = (a, b) => {
  const r = (x) => (x * Math.PI) / 180;
  const d = Math.sin(r(b.lat - a.lat) / 2) ** 2 + Math.cos(r(a.lat)) * Math.cos(r(b.lat)) * Math.sin(r(b.lng - a.lng) / 2) ** 2;
  return 6371 * 2 * Math.asin(Math.sqrt(d));
};

export const geoHandlers = [
  http.get('/api/geo/search', ({ request }) => {
    const q = (new URL(request.url).searchParams.get('q') || '').toLowerCase();
    return ok(PLACES.filter((p) => p.displayName.toLowerCase().includes(q)).slice(0, 5).map((p) => ({ ...p, provider: 'Mock' })));
  }),

  http.get('/api/geo/reverse', ({ request }) => {
    const url = new URL(request.url);
    const lat = Number(url.searchParams.get('lat'));
    const lng = Number(url.searchParams.get('lng'));
    const nearest = [...PLACES].sort((a, b) => km(a, { lat, lng }) - km(b, { lat, lng }))[0];
    return ok({ ...nearest, lat, lng, provider: 'Mock' });
  }),

  http.post('/api/geo/route', async ({ request }) => {
    const { points = [], includeCountries } = await request.json();
    const legs = points.slice(1).map((p, i) => {
      const distanceKm = Math.round(km(points[i], p) * 1.3 * 100) / 100;
      return {
        fromIndex: i,
        toIndex: i + 1,
        distanceKm,
        durationHours: Math.round((distanceKm / 60) * 100) / 100,
        provider: 'Estimate',
        isEstimate: true,
        polyline: [[points[i].lat, points[i].lng], [p.lat, p.lng]],
      };
    });
    const sum = (f) => Math.round(legs.reduce((t, l) => t + l[f], 0) * 100) / 100;
    return ok({
      legs,
      totalDistanceKm: sum('distanceKm'),
      totalDurationHours: sum('durationHours'),
      isEstimate: true,
      polyline: points.map((p) => [p.lat, p.lng]),
      countryCodes: includeCountries ? [...new Set(points.map((p) => p.countryCode).filter(Boolean))] : null,
    });
  }),
];
