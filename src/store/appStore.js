import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export const TIMEZONES = [
  { value: 'Asia/Ho_Chi_Minh', label: 'Việt Nam (Hà Nội, TP.HCM)', offset: 'UTC+7' },
  { value: 'Asia/Tokyo', label: 'Nhật Bản (Tokyo)', offset: 'UTC+9' },
  { value: 'Asia/Singapore', label: 'Singapore', offset: 'UTC+8' },
  { value: 'Asia/Hong_Kong', label: 'Hồng Kông (Hong Kong)', offset: 'UTC+8' },
  { value: 'Asia/Bangkok', label: 'Thái Lan (Bangkok)', offset: 'UTC+7' },
  { value: 'Asia/Seoul', label: 'Hàn Quốc (Seoul)', offset: 'UTC+9' },
  { value: 'Asia/Dubai', label: 'UAE (Dubai)', offset: 'UTC+4' },
  { value: 'Europe/London', label: 'Vương quốc Anh (London)', offset: 'UTC+0' },
  { value: 'Europe/Paris', label: 'Pháp (Paris)', offset: 'UTC+1' },
  { value: 'Europe/Berlin', label: 'Đức (Berlin)', offset: 'UTC+1' },
  { value: 'Europe/Rome', label: 'Ý (Rome)', offset: 'UTC+1' },
  { value: 'America/New_York', label: 'Mỹ (New York, EDT)', offset: 'UTC-5' },
  { value: 'America/Chicago', label: 'Mỹ (Chicago, CDT)', offset: 'UTC-6' },
  { value: 'America/Los_Angeles', label: 'Mỹ (Los Angeles, PDT)', offset: 'UTC-8' },
  { value: 'Australia/Sydney', label: 'Úc (Sydney, AEST)', offset: 'UTC+10' },
  { value: 'Pacific/Auckland', label: 'New Zealand (Auckland)', offset: 'UTC+12' },
];

export const useAppStore = create(
  persist(
    (set, get) => ({
      tempUnit: 'celsius', // 'celsius' | 'fahrenheit'
      timeZone: 'Asia/Ho_Chi_Minh',

      setTempUnit: (tempUnit) => set({ tempUnit }),
      toggleTempUnit: () =>
        set((state) => ({
          tempUnit: state.tempUnit === 'celsius' ? 'fahrenheit' : 'celsius',
        })),

      setTimeZone: (timeZone) => set({ timeZone }),

      /**
       * Quy chuẩn đổi nhiệt độ chính xác: F = C * 1.8 + 32
       * @param {number} celsiusVal
       * @returns {string}
       */
      formatTemp: (celsiusVal) => {
        if (typeof celsiusVal !== 'number' || isNaN(celsiusVal)) return '-';
        const { tempUnit } = get();
        if (tempUnit === 'fahrenheit') {
          const f = celsiusVal * 1.8 + 32;
          return `${f.toFixed(1)}°F`;
        }
        return `${celsiusVal.toFixed(1)}°C`;
      },

      /**
       * Đổi dải nhiệt độ an toàn min - max
       * @param {number} minC
       * @param {number} maxC
       * @returns {string}
       */
      formatTempRange: (minC, maxC) => {
        const { tempUnit } = get();
        if (tempUnit === 'fahrenheit') {
          const minF = minC * 1.8 + 32;
          const maxF = maxC * 1.8 + 32;
          return `${minF.toFixed(1)}°F - ${maxF.toFixed(1)}°F`;
        }
        return `${minC}°C - ${maxC}°C`;
      },
    }),
    {
      name: 'racehorse-app-settings',
    },
  ),
);
