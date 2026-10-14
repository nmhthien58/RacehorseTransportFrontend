/**
 * @file routePlanStorage.js
 * @description Kho lưu trữ và quản lý kế hoạch lộ trình (Route Plans), đội xe và nhân sự
 * Phục vụ luồng làm việc giữa Logistic Manager, Fleet & Route Coordinator, và Driver & Vet Escort
 * Khớp 100% dữ liệu thiết kế từ Figma Frames
 */

import initialBookings from '@mocks/data/bookings.json';
import dayjs from 'dayjs';

const STORAGE_KEY_PLANS = 'racehorse_route_plans_storage';
const STORAGE_KEY_FLEET = 'racehorse_fleet_storage';
const STORAGE_KEY_PERSONNEL = 'racehorse_personnel_storage';

// Dữ liệu mẫu ban đầu lấy đúng từ đơn yêu cầu thực tế của khách hàng (Jane Smith)
const INITIAL_ROUTE_PLANS = [
  {
    planId: 1,
    planCode: 'PLN-2026-0001',
    orderId: 1,
    orderCode: 'BKG-2026-0001',
    customerName: 'Jane Smith',
    customerEmail: 'customer@test.com',
    customerPhone: '+84988111222',
    horses: ['Midnight Gunner', 'Royal Duchess'],
    totalHorses: 2,
    origin: 'Trang trại Yên Bài, Ba Vì, Hà Nội',
    originCode: 'HAN',
    destination: 'Trường đua Tùng Hóa, TP. Quảng Châu',
    destinationCode: 'CAN',
    transportMode: 'Ground',
    carrierName: 'Mercedes Actros #51D-8921',
    vehicleType: 'Equine Van VIP 2-Horse',
    vehicleName: 'Mercedes Actros #51D-8921',
    vehicleId: '51D-8921',
    stalls: 'Van Stall #01 (Comfort Air-Suspension)',
    stallId: 'VAN-01',
    driverName: 'Phạm Văn Đức',
    driverLicense: 'VN-66321',
    driverId: 4,
    driverStatus: 'AVAILABLE',
    vetEscortName: 'Dr. Elena Rostova',
    vetEscortCert: 'EU-8841',
    vetEscortId: 2,
    vetEscortStatus: 'AVAILABLE',
    status: 'PENDING_APPROVAL', // Chờ Manager duyệt
    statusText: 'Pending Approval',
    departureDate: '2026-10-01T06:00:00Z',
    deliveryDate: '2026-10-02T18:00:00Z',
    customerFeeCap: 7500,
    estimatedCost: 6200,
    grossMargin: 1300,
    grossMarginPercent: '17%',
    costBreakdown: {
      airCharter: 0,
      stallRent: 3600,
      vetEscort: 1600,
      quarantine: 1000,
    },
    checkpoints: [
      {
        step: 1,
        name: 'Trang trại Yên Bài, Ba Vì, Hà Nội — Điểm khởi hành',
        location: 'Trang trại Yên Bài, Ba Vì, Hà Nội',
        type: 'ORIGIN',
        coordinates: '21.0560° N, 105.3411° E',
        eta: 'Oct 01, 2026 • 06:00 AM',
        description: 'Tập kết ngựa, kiểm tra vi mạch & cấp phát khẩu phần ăn',
        status: 'Pending',
      },
      {
        step: 2,
        name: 'Cửa khẩu Quốc tế Hữu Nghị, Lạng Sơn — Kiểm dịch & Nghỉ chân',
        location: 'Cửa khẩu Quốc tế Hữu Nghị, Lạng Sơn',
        type: 'REST_STOP',
        coordinates: '21.9833° N, 106.7167° E',
        eta: 'Oct 01, 2026 • 12:30 PM',
        description: 'Thủ tục thông quan, dừng nghỉ bù nước & đo thân nhiệt',
        status: 'Pending',
      },
      {
        step: 3,
        name: 'Trường đua Tùng Hóa, TP. Quảng Châu — Điểm đến giao nhận',
        location: 'Trường đua Tùng Hóa, TP. Quảng Châu',
        type: 'ARRIVAL',
        coordinates: '23.5432° N, 113.5876° E',
        eta: 'Oct 02, 2026 • 18:00 PM',
        description: 'Bàn giao ngựa tại chuồng đích & hoàn tất hồ sơ',
        status: 'Pending',
      },
    ],
    submittedBy: 'Fleet Coordinator IET (Lê Hoàng Nam)',
    submittedAt: '2026-09-29T10:00:00Z',
    submittedAgo: '2 hrs ago',
    reviewedBy: null,
    reviewedAt: null,
    rejectionCount: 0,
    rejectionReason: null,
    rejectionRemarks: null,
    managerNotes: null,
    tripId: null,
  },
  {
    planId: 2,
    planCode: 'PLN-2026-0003',
    orderId: 3,
    orderCode: 'BKG-2026-0003',
    customerName: 'Jane Smith',
    customerEmail: 'customer@test.com',
    customerPhone: '+84988111222',
    horses: ['Bella'],
    totalHorses: 1,
    origin: 'Trang trại Yên Bài, Ba Vì, Hà Nội',
    originCode: 'HAN',
    destination: 'Trung tâm Huấn luyện Ngựa Đua, TP. Hồ Chí Minh',
    destinationCode: 'SGN',
    transportMode: 'Ground',
    carrierName: 'Isuzu Giga #43C-9102',
    vehicleType: 'Equine Climate Van #03',
    vehicleName: 'Isuzu Giga #43C-9102',
    vehicleId: '43C-9102',
    stalls: 'Van Stall #03 (Climate Controlled)',
    stallId: 'VAN-03',
    driverName: 'Phạm Văn Đức',
    driverLicense: 'VN-66321',
    driverId: 4,
    driverStatus: 'ASSIGNED',
    vetEscortName: 'Dr. Elena Rostova',
    vetEscortCert: 'EU-8841',
    vetEscortId: 2,
    vetEscortStatus: 'ASSIGNED',
    status: 'ASSIGNED', // Đã được Manager duyệt và chuyển giao cho Driver/Escort
    statusText: 'Assigned',
    departureDate: '2026-10-05T06:00:00Z',
    deliveryDate: '2026-10-06T18:00:00Z',
    customerFeeCap: 3800,
    estimatedCost: 3100,
    grossMargin: 700,
    grossMarginPercent: '18%',
    costBreakdown: {
      airCharter: 0,
      stallRent: 1700,
      vetEscort: 900,
      quarantine: 500,
    },
    checkpoints: [
      {
        step: 1,
        name: 'Trang trại Yên Bài, Ba Vì, Hà Nội — Điểm khởi hành',
        location: 'Ba Vì, Hà Nội',
        type: 'ORIGIN',
        coordinates: '21.0560° N, 105.3411° E',
        eta: 'Oct 05, 2026 • 06:00 AM',
        description: 'Tập kết ngựa, kiểm tra vi mạch & cấp phát khẩu phần ăn',
        status: 'Pending',
      },
      {
        step: 2,
        name: 'Trạm dừng kiểm dịch Đà Nẵng — Nghỉ chân & Bù nước',
        location: 'Hòa Vang, Đà Nẵng',
        type: 'REST_STOP',
        coordinates: '16.0544° N, 108.2022° E',
        eta: 'Oct 05, 2026 • 18:30 PM',
        description: 'Dừng nghỉ 3 tiếng, tắm mát, đo thân nhiệt & bù nước',
        status: 'Pending',
      },
      {
        step: 3,
        name: 'Trung tâm Huấn luyện Ngựa Sài Gòn — Điểm đến',
        location: 'Quận 9, TP. Hồ Chí Minh',
        type: 'ARRIVAL',
        coordinates: '10.8231° N, 106.6297° E',
        eta: 'Oct 06, 2026 • 18:00 PM',
        description: 'Bàn giao ngựa tại chuồng đích, ký biên bản nghiệm thu',
        status: 'Pending',
      },
    ],
    submittedBy: 'Fleet Coordinator IET (Lê Hoàng Nam)',
    submittedAt: '2026-09-28T14:00:00Z',
    submittedAgo: '1 day ago',
    reviewedBy: 'Trần Quốc Bảo (Logistics Manager)',
    reviewedAt: '2026-09-28T17:00:00Z',
    rejectionCount: 0,
    rejectionReason: null,
    rejectionRemarks: null,
    managerNotes: 'Approved by Log. Manager • Dispatched to Driver App',
    tripId: 101,
  },
  {
    planId: 3,
    planCode: 'PLN-2026-0002',
    orderId: 2,
    orderCode: 'BKG-2026-0002',
    customerName: 'Jane Smith',
    customerEmail: 'customer@test.com',
    customerPhone: '+84988111222',
    horses: ['Lightning'],
    totalHorses: 1,
    origin: 'Trang trại Yên Bài, Ba Vì, Hà Nội',
    originCode: 'HAN',
    destination: 'Sân bay Suvarnabhumi, Bangkok',
    destinationCode: 'BKK',
    transportMode: 'Air',
    carrierName: 'Boeing 777F Air Cargo',
    vehicleType: 'Boeing 777F Cargo Charter',
    vehicleName: 'Boeing 777F Cargo Charter • Thai Cargo',
    vehicleId: 'TG-777F-01',
    stalls: 'AirBox #ST-04 (Twin Bay Partition, Dual HVAC 18°C)',
    stallId: 'ST-04',
    driverName: 'Phạm Văn Đức',
    driverLicense: 'VN-66321',
    driverId: 4,
    driverStatus: 'AVAILABLE',
    vetEscortName: 'Dr. Elena Rostova',
    vetEscortCert: 'EU-8841',
    vetEscortId: 2,
    vetEscortStatus: 'AVAILABLE',
    status: 'WAITING_VEHICLE', // Thiếu slot vận chuyển (Alt Flow A)
    statusText: 'Waiting Vehicle',
    departureDate: '2026-11-15T06:00:00Z',
    deliveryDate: '2026-11-16T18:00:00Z',
    customerFeeCap: 4200,
    estimatedCost: 3600,
    grossMargin: 600,
    grossMarginPercent: '14%',
    costBreakdown: {
      airCharter: 2600,
      stallRent: 500,
      vetEscort: 300,
      quarantine: 200,
    },
    checkpoints: [
      {
        step: 1,
        name: 'Trang trại Yên Bài, Ba Vì — Sân bay Nội Bài (HAN)',
        location: 'Hà Nội',
        type: 'ORIGIN',
        coordinates: '21.2212° N, 105.8072° E',
        eta: 'Nov 15, 2026 • 06:00 AM',
        description: 'Tập kết & kiểm dịch trước chuyến bay',
        status: 'Pending',
      },
      {
        step: 2,
        name: 'Sân bay Suvarnabhumi (BKK) — Điểm đến',
        location: 'Bangkok, Thái Lan',
        type: 'ARRIVAL',
        coordinates: '13.6900° N, 100.7501° E',
        eta: 'Nov 16, 2026 • 18:00 PM',
        description: 'Thông quan thú y & bàn giao',
        status: 'Pending',
      },
    ],
    submittedBy: 'Fleet Coordinator IET (Lê Hoàng Nam)',
    submittedAt: '2026-09-29T11:00:00Z',
    submittedAgo: '3 hrs ago',
    reviewedBy: null,
    reviewedAt: null,
    rejectionCount: 0,
    rejectionReason: null,
    rejectionRemarks: null,
    managerNotes: null,
  },
];

// Danh sách đội xe nội bộ (Figma Image 4)
const INITIAL_FLEET = [
  {
    id: 'VAN-51D-8921',
    name: 'Mercedes Actros #51D-8921',
    type: 'Equine Van (Ground)',
    capacity: '2 Horses (Individual Stalls)',
    specs: 'Dual HVAC (16-19°C), Air-Suspension, 360° CCTV, FEI Standard',
    status: 'AVAILABLE',
    statusColor: 'green',
    location: 'Hà Nội Depot',
    nextFreeDate: 'Now (Available)',
  },
  {
    id: 'VAN-43C-9102',
    name: 'Isuzu Giga #43C-9102',
    type: 'Equine Van (Ground)',
    capacity: '2 Horses',
    specs: 'Standard AC, Water Trough, GPS Live',
    status: 'AVAILABLE',
    statusColor: 'green',
    location: 'Đà Nẵng Hub',
    nextFreeDate: 'Now (Available)',
  },
  {
    id: 'ST-04',
    name: 'AirBox Stall #ST-04 (Twin)',
    type: 'Air Cargo Container (IATA LAR)',
    capacity: '2 Horses (Twin Partition)',
    specs: 'Pressurized & Temp-Controlled, Certified Boeing 777F / Airbus A330F',
    status: 'AVAILABLE',
    statusColor: 'green',
    location: 'Tân Sơn Nhất Airport Cargo',
    nextFreeDate: 'Now (Available)',
  },
  {
    id: 'ST-02',
    name: 'AirBox Stall #ST-02 (Single VIP)',
    type: 'Air Cargo Container (IATA LAR)',
    capacity: '1 Stallion (VIP Padded)',
    specs: 'Extra headroom, Video telematics, Sedation kit safe',
    status: 'AVAILABLE',
    statusColor: 'green',
    location: 'Nội Bài Airport Cargo',
    nextFreeDate: 'Now (Available)',
  },
  {
    id: 'VAN-51D-6677',
    name: 'Scania R500 Equine Trailer #51D-6677',
    type: 'Heavy Equine Trailer (Ground)',
    capacity: '4-6 Horses',
    specs: 'Heavy duty, Living quarters for groom, 8-wheel hydro',
    status: 'MAINTENANCE',
    statusColor: 'orange',
    location: 'Sài Gòn Garage',
    nextFreeDate: 'Sep 25, 2026',
  },
  {
    id: 'VAN-51D-3344',
    name: 'Mercedes Atego #51D-3344',
    type: 'Equine Van VIP 3-Horse',
    capacity: '3 Horses',
    specs: 'FEI Class 1, Climate Controlled',
    status: 'BOOKED',
    statusColor: 'blue',
    location: 'Trip #TRP-401 (En route)',
    nextFreeDate: 'Sep 23, 2026',
  },
];

// Danh sách nhân sự tài xế & bác sĩ thú y (Figma Images 1 & 4)
const INITIAL_PERSONNEL = [
  {
    id: 3,
    name: 'Lê Hoàng Nam',
    role: 'Driver / Handler',
    license: 'VN-99201 (Hạng FC)',
    experience: '8 years equine transport',
    status: 'AVAILABLE',
    dutyToday: 'Rest completed • 0 active trips',
    avatar: '👨‍✈️',
  },
  {
    id: 6,
    name: 'Trần Văn Hùng',
    role: 'Driver / Handler',
    license: 'VN-88102 (Hạng FC)',
    experience: '6 years equine transport',
    status: 'ASSIGNED',
    dutyToday: 'Trip #PLN-8815 (Hanoi -> SGN)',
    avatar: '👨‍✈️',
  },
  {
    id: 7,
    name: 'Nguyễn Văn Bình',
    role: 'Driver / Handler',
    license: 'VN-77192 (Hạng FC)',
    experience: '5 years equine transport',
    status: 'CONFLICT',
    dutyToday: 'Conflict on Sep 24 (Booked for Trip #TRP-401)',
    avatar: '👨‍✈️',
  },
  {
    id: 4,
    name: 'Phạm Văn Đức',
    role: 'Driver / Handler',
    license: 'VN-66321 (Hạng FC)',
    experience: '7 years equine transport',
    status: 'AVAILABLE',
    dutyToday: 'On standby • Available immediately',
    avatar: '👨‍✈️',
  },
  {
    id: 2,
    name: 'Dr. Elena Rostova',
    role: 'Veterinary Escort (In-Flight / Ground)',
    license: 'EU-8841 (FEI Official Vet)',
    experience: '12 years international equine flights',
    status: 'AVAILABLE',
    dutyToday: 'Available for Long-Haul & Air Charter',
    avatar: '👩‍⚕️',
  },
  {
    id: 9,
    name: 'Dr. Sarah Jenkins',
    role: 'Veterinary Escort (Ground / Air)',
    license: 'US-9912 (DVM, Oak Ridge)',
    experience: '9 years equine clinical',
    status: 'AVAILABLE',
    dutyToday: 'Available in Southern Hub',
    avatar: '👩‍⚕️',
  },
  {
    id: 8,
    name: 'BS. Nguyễn Minh Trí',
    role: 'Veterinary Escort (Ground)',
    license: 'VN-VET-042 (Cục Thú y VN)',
    experience: '7 years cross-border health inspections',
    status: 'ASSIGNED',
    dutyToday: 'Assigned to Trip #PLN-8815',
    avatar: '👨‍⚕️',
  },
];

/**
 * Lấy toàn bộ danh sách Route Plans từ localStorage
 * @returns {Array<any>}
 */
export function getStoredRoutePlans() {
  const isCleanMode = typeof window !== 'undefined' && localStorage.getItem('racehorse_clean_data_mode') === 'true';
  if (typeof window === 'undefined') return isCleanMode ? [] : [...INITIAL_ROUTE_PLANS];
  try {
    const raw = localStorage.getItem(STORAGE_KEY_PLANS);
    if (!raw) {
      if (isCleanMode) {
        localStorage.setItem(STORAGE_KEY_PLANS, JSON.stringify([]));
        return [];
      }
      localStorage.setItem(STORAGE_KEY_PLANS, JSON.stringify(INITIAL_ROUTE_PLANS));
      return [...INITIAL_ROUTE_PLANS];
    }
    const parsed = JSON.parse(raw);
    if (isCleanMode) {
      return Array.isArray(parsed) ? parsed : [];
    }
    if (Array.isArray(parsed) && parsed.length > 0) {
      // Nếu dữ liệu cũ trong localStorage chứa tên bịa ra (Sheikh Al-Mansoor) thì cập nhật lại đúng thông tin khách thật
      const hasOldFakeData = parsed.some((p) => p.customerName === 'Sheikh Al-Mansoor');
      if (hasOldFakeData) {
        localStorage.setItem(STORAGE_KEY_PLANS, JSON.stringify(INITIAL_ROUTE_PLANS));
        return [...INITIAL_ROUTE_PLANS];
      }
      return parsed;
    }
    localStorage.setItem(STORAGE_KEY_PLANS, JSON.stringify(INITIAL_ROUTE_PLANS));
    return [...INITIAL_ROUTE_PLANS];
  } catch (err) {
    console.error('Lỗi khi đọc Route Plans từ localStorage:', err);
    return [...INITIAL_ROUTE_PLANS];
  }
}

/**
 * Lấy chi tiết Route Plan theo planId hoặc planCode
 * @param {number|string} idOrCode
 * @returns {any|null}
 */
export function getStoredRoutePlanById(idOrCode) {
  const list = getStoredRoutePlans();
  const searchStr = String(idOrCode).replace('#', '').trim();
  return (
    list.find(
      (p) =>
        String(p.planId) === searchStr ||
        String(p.planCode).replace('#', '').toLowerCase() === searchStr.toLowerCase(),
    ) || null
  );
}

/**
 * Thêm Route Plan mới và lưu vào localStorage
 * @param {Object} planData
 * @returns {Object}
 */
export function addStoredRoutePlan(planData) {
  const currentList = getStoredRoutePlans();
  const maxId = currentList.reduce((m, p) => Math.max(m, Number(p.planId) || 0), 0);
  const newId = maxId + 1;
  const newCode = `PLN-88${String(newId).padStart(2, '0')}`;

  const newPlan = {
    planId: newId,
    planCode: newCode,
    orderId: planData.orderId || Number(planData.orderCode?.replace(/\D/g, '')) || 8822,
    orderCode: planData.orderCode || `ORD-88${String(newId).padStart(2, '0')}`,
    customerName: planData.customerName || 'Khách hàng',
    customerEmail: planData.customerEmail || 'customer@test.com',
    customerPhone: planData.customerPhone || '+84988111222',
    horses: Array.isArray(planData.horses) && planData.horses.length > 0 ? planData.horses : ['Equine Star'],
    totalHorses: Number(planData.totalHorses) || (planData.horses?.length || 1),
    origin: planData.origin || 'Tân Sơn Nhất (SGN), TP.HCM',
    originCode: planData.originCode || 'SGN',
    destination: planData.destination || 'Paris (CDG), Pháp',
    destinationCode: planData.destinationCode || 'CDG',
    transportMode: planData.transportMode || 'Air',
    carrierName: planData.carrierName || (planData.transportMode === 'Air' ? 'Air France Cargo' : 'Internal Van'),
    vehicleType: planData.vehicleType || (planData.transportMode === 'Air' ? 'Boeing 777F Cargo Charter' : 'Mercedes Actros Van'),
    vehicleName: planData.vehicleName || planData.vehicleType || 'Dedicated Equine Fleet',
    vehicleId: planData.vehicleId || 'ST-04',
    stalls: planData.stalls || 'Padded Air Stall (Twin Bay)',
    stallId: planData.stallId || 'ST-04',
    driverName: planData.driverName || 'Lê Hoàng Nam',
    driverLicense: planData.driverLicense || 'VN-99201',
    driverId: planData.driverId || 3,
    driverStatus: 'AVAILABLE',
    vetEscortName: planData.vetEscortName || 'Dr. Elena Rostova',
    vetEscortCert: planData.vetEscortCert || 'EU-8841',
    vetEscortId: planData.vetEscortId || 2,
    vetEscortStatus: 'AVAILABLE',
    status: planData.status || 'PENDING_APPROVAL',
    statusText: planData.status === 'DRAFT' ? 'Draft' : 'Pending Approval',
    departureDate: planData.departureDate || new Date().toISOString(),
    deliveryDate: planData.deliveryDate || new Date().toISOString(),
    customerFeeCap: Number(planData.customerFeeCap) || 22500,
    estimatedCost: Number(planData.estimatedCost) || 18450,
    grossMargin: Number(planData.grossMargin) || 4050,
    grossMarginPercent: planData.grossMarginPercent || '18%',
    costBreakdown: planData.costBreakdown || {
      airCharter: 14200,
      stallRent: 2100,
      vetEscort: 1450,
      quarantine: 700,
    },
    checkpoints: Array.isArray(planData.checkpoints) && planData.checkpoints.length > 0 ? planData.checkpoints : [],
    submittedBy: 'Fleet Coordinator IET (Lê Hoàng Nam)',
    submittedAt: new Date().toISOString(),
    submittedAgo: 'Just now',
    reviewedBy: null,
    reviewedAt: null,
    rejectionCount: 0,
    rejectionReason: null,
    rejectionRemarks: null,
    managerNotes: null,
    tripId: null,
  };

  const updatedList = [newPlan, ...currentList];
  if (typeof window !== 'undefined') {
    try {
      localStorage.setItem(STORAGE_KEY_PLANS, JSON.stringify(updatedList));
      window.dispatchEvent(new CustomEvent('plans_updated', { detail: updatedList }));
    } catch (err) {
      console.error('Lỗi khi thêm plan vào localStorage:', err);
    }
  }

  return newPlan;
}

/**
 * Cập nhật Route Plan trong localStorage
 * @param {number|string} id
 * @param {Object} updateData
 * @returns {Object|null}
 */
export function updateStoredRoutePlan(id, updateData) {
  const currentList = getStoredRoutePlans();
  const searchStr = String(id).replace('#', '').trim();
  const index = currentList.findIndex(
    (p) =>
      String(p.planId) === searchStr ||
      String(p.planCode).replace('#', '').toLowerCase() === searchStr.toLowerCase(),
  );
  if (index === -1) return null;

  const updatedPlan = {
    ...currentList[index],
    ...updateData,
  };

  currentList[index] = updatedPlan;
  if (typeof window !== 'undefined') {
    try {
      localStorage.setItem(STORAGE_KEY_PLANS, JSON.stringify(currentList));
      window.dispatchEvent(new CustomEvent('plans_updated', { detail: currentList }));
    } catch (err) {
      console.error('Lỗi khi cập nhật plan vào localStorage:', err);
    }
  }

  return updatedPlan;
}

/**
 * Logistic Manager phê duyệt Route Plan và chuyển giao chính thức (Officially Assign to Driver & Escort)
 * @param {number|string} id
 * @param {Object} [approvalData]
 * @returns {Object|null}
 */
export function approveRoutePlan(id, approvalData = {}) {
  const plan = getStoredRoutePlanById(id);
  if (!plan) return null;

  const newTripId =
    plan.tripId ||
    (typeof crypto !== 'undefined' && crypto.getRandomValues
      ? 100 + (crypto.getRandomValues(new Uint16Array(1))[0] % 900)
      : Date.now());

  const updated = updateStoredRoutePlan(id, {
    status: 'ASSIGNED',
    statusText: 'Assigned',
    reviewedBy: approvalData.reviewerName || 'Trần Quốc Bảo (Logistics Manager)',
    reviewedAt: new Date().toISOString(),
    managerNotes: approvalData.managerNotes || 'Approved by Log. Manager • Dispatched to Driver App',
    tripId: newTripId,
  });

  // Phát event thông báo kế hoạch đã được giao cho Driver & Escort
  if (typeof window !== 'undefined') {
    window.dispatchEvent(
      new CustomEvent('plan_assigned_to_driver', {
        detail: {
          plan: updated,
          tripId: newTripId,
          driverName: updated.driverName,
          vetEscortName: updated.vetEscortName,
        },
      }),
    );
  }

  return updated;
}

/**
 * Logistic Manager từ chối Route Plan và gửi yêu cầu điều chỉnh lại (Reject Plan & Request Revisions)
 * @param {number|string} id
 * @param {{ reason: string, remarks: string }} rejectionData
 * @returns {Object|null}
 */
export function rejectRoutePlan(id, { reason, remarks } = {}) {
  const plan = getStoredRoutePlanById(id);
  if (!plan) return null;

  const count = (plan.rejectionCount || 0) + 1;

  const updated = updateStoredRoutePlan(id, {
    status: 'REJECTED',
    statusText: 'Rejected',
    rejectionCount: count,
    rejectionReason: reason || 'Route not feasible (checkpoints/timing)',
    rejectionRemarks: remarks || 'Rest stop interval too long (>8 hrs). Add intermediate vet station.',
    managerNotes: remarks || reason || 'Plan rejected by Manager. Please revise route and resubmit.',
    reviewedBy: 'Trần Quốc Bảo (Logistics Manager)',
    reviewedAt: new Date().toISOString(),
  });

  if (typeof window !== 'undefined') {
    window.dispatchEvent(
      new CustomEvent('plan_rejected_by_manager', {
        detail: {
          plan: updated,
          reason,
          remarks,
          count,
        },
      }),
    );
  }

  return updated;
}

/**
 * Lấy danh sách các đơn hàng đã được Admin / Manager duyệt cần lên kế hoạch (Orders to Plan)
 * Đọc trực tiếp từ kho bookings đã lưu với status === 'Approved'
 * @returns {Array<any>}
 */
export function getOrdersToPlan() {
  let allBookings = [];
  if (typeof window !== 'undefined') {
    try {
      const raw = localStorage.getItem('racehorse_bookings_storage');
      if (raw) {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed) && parsed.length > 0) {
          allBookings = parsed;
        }
      }
    } catch (e) {
      console.warn('Lỗi đọc racehorse_bookings_storage:', e);
    }
  }

  if (allBookings.length === 0) {
    allBookings = [...initialBookings];
  }

  // Lấy các đơn từ khách hàng cần lên kế hoạch (status: Approved, Assigned, hoặc Submitted)
  // Đơn đã duyệt (Approved) sẽ được ưu tiên lên hàng đầu
  const filtered = allBookings
    .filter((b) => {
      const s = (b.status || b.Status || '').toLowerCase();
      return s === 'approved' || s === 'assigned' || s === 'submitted';
    })
    .sort((a, b) => {
      const sA = (a.status || a.Status || '').toLowerCase();
      const sB = (b.status || b.Status || '').toLowerCase();
      if (sA === 'approved' && sB !== 'approved') return -1;
      if (sB === 'approved' && sA !== 'approved') return 1;
      return (Number(b.bookingId || b.BookingID) || 0) - (Number(a.bookingId || a.BookingID) || 0);
    });

  return filtered.map((b) => {
    const rawHorses = b.horses || b.bookingHorses || b.BookingHorses || [];
    const horseNames = Array.isArray(rawHorses)
      ? rawHorses.map((h) => {
          if (typeof h === 'string') return h;
          return h.horseName || h.name || h.Name || `Ngựa #${h.horseId || 1}`;
        })
      : ['Ngựa đua'];

    const pickup = b.pickupAddress || b.PickupAddress || 'Trang trại Yên Bài, Ba Vì, Hà Nội';
    const dropoff = b.dropoffAddress || b.DropoffAddress || 'Điểm đến theo đơn';

    return {
      orderId: Number(b.bookingId || b.BookingID),
      orderCode: b.bookingCode || b.BookingCode || `BKG-2026-${String(b.bookingId || b.BookingID).padStart(4, '0')}`,
      customerName: b.customerName || b.CustomerName || 'Jane Smith',
      customerEmail: b.customerEmail || b.CustomerEmail || 'customer@test.com',
      customerPhone: b.customerPhone || b.CustomerPhone || '+84988111222',
      horses: horseNames.length > 0 ? horseNames : ['Ngựa đua'],
      totalHorses: Number(b.totalHorses || b.TotalHorses) || horseNames.length || 1,
      transportMode: b.transportMode || b.TransportMode || 'Ground',
      origin: pickup,
      originCode: (b.pickupCountryCode || b.PickupCountryCode || 'HAN').toUpperCase(),
      destination: dropoff,
      destinationCode: (b.dropoffCountryCode || b.DropoffCountryCode || 'CAN').toUpperCase(),
      departureDate: b.departureDate || b.DepartureDate || new Date().toISOString(),
      deliveryDate: b.deliveryDate || b.DeliveryDate || b.departureDate || b.DepartureDate,
      customerFeeCap: Number(b.estimatedCost || b.EstimatedCost || 5000),
      specialInstructions: b.specialInstructions || b.SpecialInstructions || '',
      status: b.status || b.Status || 'Approved',
    };
  });
}

/**
 * Lấy danh sách đội xe & container chuồng
 * @returns {Array<any>}
 */
export function getStoredFleet() {
  if (typeof window === 'undefined') return [...INITIAL_FLEET];
  try {
    const raw = localStorage.getItem(STORAGE_KEY_FLEET);
    if (!raw) {
      localStorage.setItem(STORAGE_KEY_FLEET, JSON.stringify(INITIAL_FLEET));
      return [...INITIAL_FLEET];
    }
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) && parsed.length > 0 ? parsed : [...INITIAL_FLEET];
  } catch {
    return [...INITIAL_FLEET];
  }
}

/**
 * Lấy danh sách nhân sự (Tài xế & Bác sĩ thú y áp tải)
 * @returns {Array<any>}
 */
export function getStoredPersonnel() {
  if (typeof window === 'undefined') return [...INITIAL_PERSONNEL];
  try {
    const raw = localStorage.getItem(STORAGE_KEY_PERSONNEL);
    if (!raw) {
      localStorage.setItem(STORAGE_KEY_PERSONNEL, JSON.stringify(INITIAL_PERSONNEL));
      return [...INITIAL_PERSONNEL];
    }
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) && parsed.length > 0 ? parsed : [...INITIAL_PERSONNEL];
  } catch {
    return [...INITIAL_PERSONNEL];
  }
}

/**
 * Lấy danh sách chuyến đi đã giao cho Driver/Escort (assigned trips)
 * @param {number|string} [crewId]
 * @returns {Array<any>}
 */
export function getDriverDispatchedTrips(crewId) {
  const plans = getStoredRoutePlans();
  return plans.filter((p) => {
    const isAssigned =
      p.status === 'ASSIGNED' ||
      p.status === 'InTransit' ||
      p.status === 'Scheduled' ||
      p.status === 'Approved' ||
      p.status === 'SPECIALIST_APPROVED';

    // Item 12: Đơn đã được Specialist thông qua hoặc mặc định cleared
    const isQuarantineCleared =
      !p.specialistStatus ||
      p.specialistStatus === 'CLEARED' ||
      p.specialistStatus === 'QUARANTINE_CLEARED' ||
      p.quarantineStatus === 'Passed';

    const matchesCrew =
      !crewId ||
      p.driverId === crewId ||
      p.assignedDriverId === crewId ||
      p.escortId === crewId ||
      p.assignedEscortId === crewId ||
      String(p.driverId) === String(crewId) ||
      String(p.escortId) === String(crewId);

    return isAssigned && isQuarantineCleared && matchesCrew;
  });
}

const STORAGE_KEY_CREW_OFFDAYS = 'racehorse_crew_offdays_storage';

const INITIAL_CREW_OFFDAYS = {
  3: ['2026-10-16'], // Lê Hoàng Nam (Driver) - 1 ngày
  4: ['2026-10-21', '2026-10-28'], // Phạm Văn Đức (Driver) - 2 ngày
  2: ['2026-10-19'], // Dr. Elena Rostova (Escort) - 1 ngày
  9: [], // Dr. Sarah Jenkins (Escort) - 0 ngày
};

/**
 * Lấy lịch ngày nghỉ của toàn bộ Driver và Escort
 * @returns {Record<string|number, string[]>}
 */
export function getStoredCrewOffDays() {
  if (typeof window === 'undefined') return { ...INITIAL_CREW_OFFDAYS };
  try {
    const raw = localStorage.getItem(STORAGE_KEY_CREW_OFFDAYS);
    if (!raw) {
      localStorage.setItem(STORAGE_KEY_CREW_OFFDAYS, JSON.stringify(INITIAL_CREW_OFFDAYS));
      return { ...INITIAL_CREW_OFFDAYS };
    }
    const parsed = JSON.parse(raw);
    return parsed && typeof parsed === 'object' ? parsed : { ...INITIAL_CREW_OFFDAYS };
  } catch {
    return { ...INITIAL_CREW_OFFDAYS };
  }
}

/**
 * Đăng ký / cập nhật ngày nghỉ cho một nhân sự Driver hoặc Escort
 * Quy định Item 5:
 * - Tối đa 2 ngày trong 1 tháng
 * - Không được chọn Thứ Bảy hoặc Chủ Nhật (chỉ chọn Thứ 2 - Thứ 6)
 * @param {number|string} crewId
 * @param {string[]} dates - Mảng các ngày định dạng 'YYYY-MM-DD'
 * @returns {{ success: boolean, message?: string, offDays?: string[] }}
 */
export function setCrewOffDays(crewId, dates) {
  const currentMap = getStoredCrewOffDays();
  const cId = String(crewId);

  // Lọc sạch trùng lặp và sắp xếp
  const uniqueDates = Array.from(new Set(dates || [])).filter(Boolean);

  // Kiểm tra không được chọn Thứ Bảy hoặc Chủ Nhật
  for (const d of uniqueDates) {
    const dayOfWeek = dayjs(d).day();
    if (dayOfWeek === 0 || dayOfWeek === 6) {
      return {
        success: false,
        message: `Ngày ${dayjs(d).format('DD/MM/YYYY')} rơi vào cuối tuần (${dayOfWeek === 6 ? 'Thứ Bảy' : 'Chủ Nhật'}). Quy định chỉ được đăng ký ngày nghỉ từ Thứ Hai đến Thứ Sáu.`,
      };
    }
  }

  // Nhóm theo tháng và kiểm tra tối đa 2 ngày trong cùng 1 tháng
  const monthCounts = {};
  for (const d of uniqueDates) {
    const monthKey = dayjs(d).format('YYYY-MM');
    monthCounts[monthKey] = (monthCounts[monthKey] || 0) + 1;
    if (monthCounts[monthKey] > 2) {
      return {
        success: false,
        message: `Tháng ${dayjs(d).format('MM/YYYY')} đã vượt quá giới hạn: Mỗi nhân sự chỉ được đăng ký tối đa 2 ngày nghỉ trong 1 tháng.`,
      };
    }
  }

  currentMap[cId] = uniqueDates;

  if (typeof window !== 'undefined') {
    try {
      localStorage.setItem(STORAGE_KEY_CREW_OFFDAYS, JSON.stringify(currentMap));
      window.dispatchEvent(new CustomEvent('crew_offdays_updated', { detail: { crewId: cId, offDays: uniqueDates } }));
    } catch (err) {
      console.error('Lỗi khi lưu ngày nghỉ crew:', err);
    }
  }

  return { success: true, offDays: uniqueDates };
}

/**
 * Kiểm tra xem nhân sự có lịch nghỉ vào ngày cụ thể không
 * @param {number|string} crewId
 * @param {string|Date} date
 * @returns {{ available: boolean, reason?: string }}
 */
export function checkCrewAvailability(crewId, date) {
  if (!crewId || !date) return { available: true };
  const cId = String(crewId);
  const targetDateStr = dayjs(date).format('YYYY-MM-DD');

  const offDaysMap = getStoredCrewOffDays();
  const crewOffDays = offDaysMap[cId] || [];

  if (crewOffDays.includes(targetDateStr)) {
    return {
      available: false,
      reason: `Nhân sự đã đăng ký nghỉ phép vào ngày ${dayjs(date).format('DD/MM/YYYY')} (Off-Day).`,
    };
  }

  return { available: true };
}
