import { useEffect, useState } from 'react';
import { countryService } from '@services/countryService';
import { AIRPORTS_BY_COUNTRY, SUPPORTED_COUNTRIES } from '@features/customer/constants/bookingOptions';

// Danh sách nước ít khi đổi: tải một lần trong phiên, các màn dùng chung kết quả
let cachedPromise = null;

const loadCatalog = () => {
  if (!cachedPromise) {
    cachedPromise = countryService
      .getCatalog()
      .then((res) => (Array.isArray(res?.data) ? res.data : []))
      .catch((err) => {
        cachedPromise = null; // lỗi mạng thì lần sau thử lại
        throw err;
      });
  }
  return cachedPromise;
};

/** Gọi sau khi Manager đổi cấu hình để form đặt chuyến lấy bản mới */
export const invalidateCountryCatalog = () => {
  cachedPromise = null;
};

// Dự phòng khi API lỗi: danh sách viết cứng cũ, cùng dạng với API
const FALLBACK = SUPPORTED_COUNTRIES.map((c) => ({
  countryCode: c.code,
  nameVi: c.name,
  nameEn: c.name,
  groundAvailable: c.ground,
  airAvailable: c.air,
  airports: (AIRPORTS_BY_COUNTRY[c.code] || []).map((a) => ({ iataCode: a.code, name: a.name, city: null })),
}));

/**
 * Nước khách chọn được khi đặt chuyến (R-18): phương thức đặt được tới mỗi nước và sân bay đang mở.
 * @returns {{ countries: Array<{ countryCode: string, nameVi: string, nameEn: string, groundAvailable: boolean, airAvailable: boolean, airports: Array<{ iataCode: string, name: string, city: string|null }> }>, loading: boolean, fromFallback: boolean }}
 */
export default function useCountryCatalog() {
  const [state, setState] = useState({ countries: [], loading: true, fromFallback: false });

  useEffect(() => {
    let active = true;
    loadCatalog()
      .then((countries) => active && setState({ countries, loading: false, fromFallback: false }))
      .catch(() => active && setState({ countries: FALLBACK, loading: false, fromFallback: true }));
    return () => {
      active = false;
    };
  }, []);

  return state;
}

/**
 * Tên hiển thị của sân bay: "Sân bay Quốc tế Changi (SIN) - Singapore"
 * @param {{ iataCode: string, name: string, city?: string|null }} airport
 * @returns {string}
 */
export function airportLabel(airport) {
  if (!airport) return '';
  // Dữ liệu dự phòng đã có mã trong tên
  if (airport.name.includes(`(${airport.iataCode})`)) return airport.name;
  return `${airport.name} (${airport.iataCode})${airport.city ? ` - ${airport.city}` : ''}`;
}
