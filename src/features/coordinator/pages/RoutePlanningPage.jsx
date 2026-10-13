import { useState, useMemo, useEffect } from 'react';
import {
  Button,
  Card,
  Checkbox,
  Col,
  Divider,
  Flex,
  Form,
  Input,
  Modal,
  Row,
  Select,
  Space,
  Tag,
  Typography,
  Table,
  message,
} from 'antd';
import {
  ArrowLeftOutlined,
  DeleteOutlined,
  SearchOutlined,
} from '@ant-design/icons';
import { useNavigate, useSearchParams } from 'react-router-dom';
import dayjs from 'dayjs';
import { ROUTES } from '@routes/routes';
import {
  getOrdersToPlan,
  getStoredFleet,
  getStoredPersonnel,
  addStoredRoutePlan,
  updateStoredRoutePlan,
  getStoredRoutePlanById,
  getStoredRoutePlans,
  checkCrewAvailability,
} from '@utils/routePlanStorage';

const { Title, Text } = Typography;

const INTERMEDIATE_STOPS_CATALOG = [
  {
    id: 'DXB-01',
    name: 'Dubai World Central (DWC / DXB) — Layover & Vet Station',
    location: 'Dubai South Aviation District, UAE',
    type: 'REST_STOP',
    mode: 'Air',
    fee: 1400,
    activeMonths: [1, 2, 3, 4, 5, 10, 11, 12],
    seasonNote: 'Tạm dừng tiếp nhận ngựa tháng 6 - 9 do nhiệt độ mặt sân bay vượt 42°C (Chuẩn an toàn FEI)',
    description: 'Nghỉ chân buồng điều hòa 18°C, bù nước điện giải & kiểm tra thân nhiệt',
  },
  {
    id: 'LGG-01',
    name: 'Liège Airport (LGG) — European Equine Hub',
    location: 'Liège Cargo City, Bỉ',
    type: 'REST_STOP',
    mode: 'Air',
    fee: 950,
    activeMonths: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12],
    seasonNote: 'Hoạt động quanh năm',
    description: 'Trạm trung chuyển ngựa FEI lớn nhất châu Âu, kiểm tra hải quan EU & thú y 24/7',
  },
  {
    id: 'FRA-01',
    name: 'Frankfurt Animal Lounge (FRA) — Lufthansa Live Animals Cargo',
    location: 'Frankfurt Airport CargoCity North, Đức',
    type: 'REST_STOP',
    mode: 'Air',
    fee: 1100,
    activeMonths: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12],
    seasonNote: 'Hoạt động quanh năm',
    description: 'Trung tâm thú y Lufthansa 4,000m², 42 chuồng cách ly tiêu chuẩn Olympic',
  },
  {
    id: 'ANC-01',
    name: 'Anchorage Ted Stevens (ANC) — Polar Cross Layover',
    location: 'Anchorage International Airport, Alaska, Hoa Kỳ',
    type: 'REST_STOP',
    mode: 'Air',
    fee: 1600,
    activeMonths: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12],
    seasonNote: 'Hoạt động quanh năm',
    description: 'Trạm tiếp dầu & nghỉ chân xuyên Thái Bình Dương, sưởi ấm khoang hàng & cấp cỏ tươi',
  },
  {
    id: 'DOH-01',
    name: 'Doha Hamad Live Animal Terminal (DOH) — Qatar Airways Cargo',
    location: 'Hamad International Airport, Doha, Qatar',
    type: 'REST_STOP',
    mode: 'Air',
    fee: 1350,
    activeMonths: [1, 2, 3, 4, 5, 10, 11, 12],
    seasonNote: 'Tạm dừng tiếp nhận ngựa tháng 6 - 9 do nhiệt độ vùng Vịnh vượt 43°C (Chuẩn FEI)',
    description: 'Chuồng điều hòa nhiệt độ sâu, bác sĩ thú y Qatar Airways túc trực 24/7',
  },
  {
    id: 'DAD-01',
    name: 'Trạm kiểm tra động vật & Nghỉ chân Đà Nẵng (DAD Intermodal Station)',
    location: 'Quận Liên Chiểu, TP. Đà Nẵng, Việt Nam',
    type: 'REST_STOP',
    mode: 'Ground',
    fee: 450,
    activeMonths: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12],
    seasonNote: 'Hoạt động quanh năm',
    description: 'Điểm nghỉ chân trung chuyển Bắc - Nam, kiểm tra móng, cho ăn và tắm rửa hạ nhiệt',
  },
  {
    id: 'SGN-01',
    name: 'Trung tâm hàng hóa Tân Sơn Nhất (SGN Live Cargo Terminal)',
    location: 'Cảng hàng không quốc tế Tân Sơn Nhất, TP. Hồ Chí Minh',
    type: 'REST_STOP',
    mode: 'Air',
    fee: 600,
    activeMonths: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12],
    seasonNote: 'Hoạt động quanh năm',
    description: 'Khu cách ly thú y xuất nhập cảnh, kiểm tra chip nhận diện và đo thân nhiệt',
  },
];

function buildCheckpointsForOrder(order) {
  if (!order) {
    return [
      {
        step: 1,
        name: 'Trang trại Yên Bài — Điểm xuất phát',
        location: 'Ba Vì, Hà Nội, Việt Nam',
        type: 'ORIGIN',
        eta: 'Oct 01, 2026 • 06:00 AM',
        description: 'Bốc dỡ & kiểm tra sức khỏe ban đầu',
      },
      {
        step: 2,
        name: 'Sân bay Changi (SIN) — Điểm đến',
        location: 'Changi, Singapore',
        type: 'ARRIVAL',
        eta: 'Oct 02, 2026 • 18:00 PM',
        description: 'Bàn giao cho đối tác & hoàn tất thủ tục hải quan',
      },
    ];
  }

  const pickupName = order.origin ? order.origin.split(',')[0].trim() : 'Điểm bốc dỡ';
  const dropoffName = order.destination ? order.destination.split(',')[0].trim() : 'Điểm giao ngựa';

  const depTime = order.departureDate
    ? dayjs(order.departureDate).format('MMM DD, YYYY • 06:00 AM')
    : 'Oct 01, 2026 • 06:00 AM';
  const arrTime = order.deliveryDate
    ? dayjs(order.deliveryDate).format('MMM DD, YYYY • 18:00 PM')
    : 'Oct 02, 2026 • 18:00 PM';

  return [
    {
      step: 1,
      name: `${pickupName} — Điểm xuất phát (ORIGIN)`,
      location: order.origin || 'Trang trại Yên Bài, Ba Vì, Hà Nội',
      type: 'ORIGIN',
      eta: depTime,
      description: 'Bốc dỡ ngựa lên phương tiện, kiểm tra vòng thở & chip nhận diện',
    },
    {
      step: 2,
      name: `${dropoffName} — Điểm đến (DESTINATION)`,
      location: order.destination || 'Điểm giao ngựa đích',
      type: 'ARRIVAL',
      eta: arrTime,
      description: 'Thông quan thú y sở tại & bàn giao ngựa cho đại diện chủ nuôi',
    },
  ];
}

function calculateInitialCosts(order) {
  if (!order) {
    return { charter: 12000, stall: 1200, vet: 800, quarantine: 500, overseasRental: 0 };
  }
  const mode = order.transportMode || 'Ground';
  const horses = order.totalHorses || 1;

  if (mode === 'Air') {
    return {
      charter: horses * 4200,
      stall: horses * 600,
      vet: 1400,
      quarantine: 750,
      overseasRental: 0,
    };
  }
  if (mode === 'DoorToDoor' || mode === 'Door-to-Door') {
    return {
      charter: horses * 3800,
      stall: horses * 500,
      vet: 1600,
      quarantine: 900,
      overseasRental: 1850,
    };
  }
  return {
    charter: 0,
    stall: horses * 1800,
    vet: 600,
    quarantine: 350,
    overseasRental: 0,
  };
}

export default function RoutePlanningPage() {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const editingPlanId = searchParams.get('planId');
  const paramOrderCode = searchParams.get('orderCode');

  const [orders, setOrders] = useState(() => getOrdersToPlan());
  const [fleetList] = useState(() => getStoredFleet());
  const [personnelList] = useState(() => getStoredPersonnel());
  const [plans, setPlans] = useState(() => getStoredRoutePlans());

  // Chế độ xem: 'orders_list' (danh sách yêu cầu cần lên kế hoạch) hoặc 'studio' (lên kế hoạch cho 1 đơn cụ thể)
  const [viewMode, setViewMode] = useState(() => {
    return editingPlanId || paramOrderCode ? 'studio' : 'orders_list';
  });

  // Bộ lọc danh sách yêu cầu
  const [searchText, setSearchText] = useState('');
  const [modeFilter, setModeFilter] = useState('All');

  const existingPlan = useMemo(() => {
    if (editingPlanId) return getStoredRoutePlanById(editingPlanId);
    if (paramOrderCode) {
      return plans.find((p) => p.orderCode === paramOrderCode) || null;
    }
    return null;
  }, [editingPlanId, paramOrderCode, plans]);

  const [selectedOrderCode, setSelectedOrderCode] = useState(() => {
    if (existingPlan) return existingPlan.orderCode;
    if (paramOrderCode) return paramOrderCode;
    const initialOrders = getOrdersToPlan();
    return initialOrders[0]?.orderCode || '';
  });

  const [selectedFleetId, setSelectedFleetId] = useState(() => {
    if (existingPlan) return existingPlan.vehicleId || existingPlan.stallId || '51D-8921';
    return '51D-8921';
  });

  const [selectedAirFleetId, setSelectedAirFleetId] = useState(() => {
    if (existingPlan?.airFleetId) return existingPlan.airFleetId;
    return 'TG-777F-01';
  });

  const [selectedDriverId, setSelectedDriverId] = useState(() => existingPlan?.driverId || 4);
  const [selectedVetId, setSelectedVetId] = useState(() => existingPlan?.vetEscortId || 2);

  const [checkpoints, setCheckpoints] = useState(() => {
    if (existingPlan?.checkpoints?.length) return existingPlan.checkpoints;
    const initialOrders = getOrdersToPlan();
    const matched = initialOrders.find((o) => o.orderCode === selectedOrderCode) || initialOrders[0];
    return buildCheckpointsForOrder(matched);
  });

  const [charterCost, setCharterCost] = useState(() => {
    if (existingPlan?.costBreakdown?.airCharter !== undefined) return existingPlan.costBreakdown.airCharter;
    const initialOrders = getOrdersToPlan();
    const matched = initialOrders.find((o) => o.orderCode === selectedOrderCode) || initialOrders[0];
    return calculateInitialCosts(matched).charter;
  });
  const [stallRent, setStallRent] = useState(() => {
    if (existingPlan?.costBreakdown?.stallRent !== undefined) return existingPlan.costBreakdown.stallRent;
    const initialOrders = getOrdersToPlan();
    const matched = initialOrders.find((o) => o.orderCode === selectedOrderCode) || initialOrders[0];
    return calculateInitialCosts(matched).stall;
  });
  const [vetEscortFees, setVetEscortFees] = useState(() => {
    if (existingPlan?.costBreakdown?.vetEscort !== undefined) return existingPlan.costBreakdown.vetEscort;
    const initialOrders = getOrdersToPlan();
    const matched = initialOrders.find((o) => o.orderCode === selectedOrderCode) || initialOrders[0];
    return calculateInitialCosts(matched).vet;
  });
  const [quarantineFees, setQuarantineFees] = useState(() => {
    if (existingPlan?.costBreakdown?.quarantine !== undefined) return existingPlan.costBreakdown.quarantine;
    const initialOrders = getOrdersToPlan();
    const matched = initialOrders.find((o) => o.orderCode === selectedOrderCode) || initialOrders[0];
    return calculateInitialCosts(matched).quarantine;
  });
  const [overseasRentalFee, setOverseasRentalFee] = useState(() => {
    if (existingPlan?.costBreakdown?.overseasRental !== undefined) return existingPlan.costBreakdown.overseasRental;
    const initialOrders = getOrdersToPlan();
    const matched = initialOrders.find((o) => o.orderCode === selectedOrderCode) || initialOrders[0];
    return calculateInitialCosts(matched).overseasRental;
  });

  const [addStopModalOpen, setAddStopModalOpen] = useState(false);
  const [newStopForm] = Form.useForm();
  const [confirmModalOpen, setConfirmModalOpen] = useState(false);
  const [confirmedChecklist, setConfirmedChecklist] = useState(true);

  useEffect(() => {
    const handleUpdate = () => {
      setOrders(getOrdersToPlan());
      setPlans(getStoredRoutePlans());
    };
    window.addEventListener('plans_updated', handleUpdate);
    window.addEventListener('bookings_updated', handleUpdate);
    return () => {
      window.removeEventListener('plans_updated', handleUpdate);
      window.removeEventListener('bookings_updated', handleUpdate);
    };
  }, []);

  const handleSelectOrder = (newCode) => {
    setSelectedOrderCode(newCode);
    const ord = orders.find((o) => o.orderCode === newCode);
    if (ord) {
      setCheckpoints(buildCheckpointsForOrder(ord));
      const costs = calculateInitialCosts(ord);
      setCharterCost(costs.charter);
      setStallRent(costs.stall);
      setVetEscortFees(costs.vet);
      setQuarantineFees(costs.quarantine);
      setOverseasRentalFee(costs.overseasRental);
    }
  };

  const handleOpenPlanForOrder = (orderCode) => {
    handleSelectOrder(orderCode);
    setSearchParams({ orderCode });
    setViewMode('studio');
  };

  const currentOrder = useMemo(() => {
    return orders.find((o) => o.orderCode === selectedOrderCode) || orders[0] || {};
  }, [orders, selectedOrderCode]);

  const isDoorToDoor = currentOrder.transportMode === 'DoorToDoor' || currentOrder.transportMode === 'Door-to-Door';
  const isAirOnly = currentOrder.transportMode === 'Air';

  const currentFleet = useMemo(() => {
    return fleetList.find((f) => f.id === selectedFleetId) || fleetList[0] || {};
  }, [fleetList, selectedFleetId]);

  const currentAirFleet = useMemo(() => {
    return fleetList.find((f) => f.id === selectedAirFleetId) || fleetList[2] || {};
  }, [fleetList, selectedAirFleetId]);

  const currentDriver = useMemo(() => {
    return personnelList.find((p) => p.id === Number(selectedDriverId)) || personnelList[0] || {};
  }, [personnelList, selectedDriverId]);

  const currentVet = useMemo(() => {
    return personnelList.find((p) => p.id === Number(selectedVetId)) || personnelList[4] || {};
  }, [personnelList, selectedVetId]);

  const totalEstimatedBudget = charterCost + stallRent + vetEscortFees + quarantineFees + overseasRentalFee;
  const customerFeeCap = currentOrder.customerFeeCap || 22500;

  // Thêm trạm dừng trung gian 1-click từ danh mục (Item 4)
  const handleAddStopFromCatalog = (stop) => {
    const stopFee = Number(stop.fee) || 0;
    const newStep = {
      step: checkpoints.length + 1,
      name: stop.name,
      location: stop.location,
      fee: stopFee,
      eta: dayjs(currentOrder.departureDate || new Date()).add(1, 'day').format('MMM DD, YYYY • 14:00 PM'),
      type: 'REST_STOP',
      description: stop.description || 'Dừng nghỉ, kiểm tra sức khỏe ngựa & bù nước',
    };
    if (stopFee > 0) {
      setQuarantineFees((prev) => prev + stopFee);
    }
    const updated = [...checkpoints];
    const arrivalIdx = updated.findIndex((c) => c.type === 'ARRIVAL');
    if (arrivalIdx !== -1) {
      updated.splice(arrivalIdx, 0, newStep);
    } else {
      updated.push(newStep);
    }
    const reindexed = updated.map((item, idx) => ({ ...item, step: idx + 1 }));
    setCheckpoints(reindexed);
    message.success(`Đã thêm trạm trung chuyển "${stop.name}" vào lộ trình! (+$${stopFee.toLocaleString()})`);
  };

  const handleAddIntermediateStop = (values) => {
    const stopFee = Number(values.fee) || 0;
    const newStep = {
      step: checkpoints.length + 1,
      name: values.name,
      location: values.location,
      fee: stopFee,
      eta: values.eta,
      type: values.type || 'REST_STOP',
      description: values.description || 'Dừng nghỉ, kiểm tra sức khỏe ngựa & bù nước',
    };
    if (stopFee > 0) {
      setQuarantineFees((prev) => prev + stopFee);
    }
    const updated = [...checkpoints];
    const arrivalIdx = updated.findIndex((c) => c.type === 'ARRIVAL');
    if (arrivalIdx !== -1) {
      updated.splice(arrivalIdx, 0, newStep);
    } else {
      updated.push(newStep);
    }
    const reindexed = updated.map((item, idx) => ({ ...item, step: idx + 1 }));
    setCheckpoints(reindexed);
    setAddStopModalOpen(false);
    newStopForm.resetFields();
    message.success(`Đã thêm trạm dừng ${values.name} vào lộ trình! (+$${stopFee > 0 ? `$${stopFee.toLocaleString()}` : '$0'})`);
  };

  const handleRemoveCheckpoint = (index) => {
    if (checkpoints.length <= 2) {
      message.warning('Lộ trình cần ít nhất 1 điểm xuất phát và 1 điểm đến!');
      return;
    }
    const removedItem = checkpoints[index];
    if (removedItem?.fee) {
      setQuarantineFees((prev) => Math.max(0, prev - Number(removedItem.fee)));
    }
    const filtered = checkpoints.filter((_, idx) => idx !== index);
    const reindexed = filtered.map((item, idx) => ({ ...item, step: idx + 1 }));
    setCheckpoints(reindexed);
    message.info('Đã xóa điểm dừng khỏi lộ trình.');
  };

  const handleSaveDraft = () => {
    const payload = {
      orderId: currentOrder.orderId,
      orderCode: currentOrder.orderCode,
      customerName: currentOrder.customerName,
      customerEmail: currentOrder.customerEmail,
      horses: currentOrder.horses,
      totalHorses: currentOrder.totalHorses,
      transportMode: currentOrder.transportMode,
      origin: currentOrder.origin,
      originCode: currentOrder.originCode,
      destination: currentOrder.destination,
      destinationCode: currentOrder.destinationCode,
      departureDate: currentOrder.departureDate,
      deliveryDate: currentOrder.deliveryDate,
      vehicleId: selectedFleetId,
      vehicleName: currentFleet.name,
      airFleetId: isDoorToDoor ? selectedAirFleetId : null,
      driverId: isAirOnly ? null : Number(selectedDriverId),
      driverName: isAirOnly ? null : currentDriver.name,
      vetEscortId: Number(selectedVetId),
      vetEscortName: currentVet.name,
      checkpoints,
      costBreakdown: {
        airCharter: charterCost,
        stallRent,
        vetEscort: vetEscortFees,
        quarantine: quarantineFees,
        overseasRental: overseasRentalFee,
        total: totalEstimatedBudget,
      },
      status: 'WAITING_VEHICLE',
      statusText: 'Draft Saved',
    };

    if (existingPlan) {
      updateStoredRoutePlan(existingPlan.planId, payload);
    } else {
      addStoredRoutePlan(payload);
    }
    message.success('Đã lưu bản nháp Route Plan thành công!');
  };

  const handleOpenConfirmModal = () => {
    if (existingPlan && existingPlan.status === 'REJECTED') {
      const originalStops = existingPlan.checkpoints?.length || 2;
      const originalCost = existingPlan.costBreakdown?.total || 0;
      const isUnchanged =
        checkpoints.length === originalStops &&
        totalEstimatedBudget === originalCost &&
        existingPlan.driverId === Number(selectedDriverId) &&
        existingPlan.vehicleId === selectedFleetId;

      if (isUnchanged) {
        message.error(
          'Không thể nộp lại bản cũ! Bạn bắt buộc phải điều chỉnh trạm dừng, phương tiện, nhân sự hoặc dự toán chi phí trước khi nộp lại cho Manager.',
        );
        return;
      }
    }
    setConfirmModalOpen(true);
  };

  const handleFinalSubmitToManager = () => {
    const payload = {
      orderId: currentOrder.orderId,
      orderCode: currentOrder.orderCode,
      customerName: currentOrder.customerName,
      customerEmail: currentOrder.customerEmail,
      customerPhone: currentOrder.customerPhone,
      horses: currentOrder.horses,
      totalHorses: currentOrder.totalHorses,
      transportMode: currentOrder.transportMode,
      origin: currentOrder.origin,
      originCode: currentOrder.originCode,
      destination: currentOrder.destination,
      destinationCode: currentOrder.destinationCode,
      departureDate: currentOrder.departureDate,
      deliveryDate: currentOrder.deliveryDate,
      vehicleId: selectedFleetId,
      vehicleName: currentFleet.name,
      airFleetId: isDoorToDoor ? selectedAirFleetId : null,
      airFleetName: isDoorToDoor ? currentAirFleet.name : null,
      driverId: isAirOnly ? null : Number(selectedDriverId),
      driverName: isAirOnly ? null : currentDriver.name,
      driverAvatar: isAirOnly ? null : currentDriver.avatar,
      vetEscortId: Number(selectedVetId),
      vetEscortName: currentVet.name,
      vetEscortAvatar: currentVet.avatar,
      checkpoints,
      costBreakdown: {
        airCharter: charterCost,
        stallRent,
        vetEscort: vetEscortFees,
        quarantine: quarantineFees,
        overseasRental: overseasRentalFee,
        total: totalEstimatedBudget,
      },
      status: 'PENDING_APPROVAL',
      statusText: 'Submitted for Manager Review',
      specialistStatus: 'PENDING_REVIEW',
      submittedAt: new Date().toISOString(),
      submittedAgo: 'Just now',
    };

    if (existingPlan) {
      updateStoredRoutePlan(existingPlan.planId, {
        ...payload,
        rejectionReason: null,
        rejectionRemarks: null,
      });
    } else {
      addStoredRoutePlan(payload);
    }

    setConfirmModalOpen(false);
    message.success('Đã gửi kế hoạch lộ trình cho Logistics Manager phê duyệt!');
    navigate(ROUTES.COORDINATOR_DASHBOARD);
  };

  // Lọc danh sách yêu cầu cần lên kế hoạch
  const filteredOrders = useMemo(() => {
    return orders.filter((o) => {
      const matchSearch =
        !searchText ||
        o.orderCode?.toLowerCase().includes(searchText.toLowerCase()) ||
        o.customerName?.toLowerCase().includes(searchText.toLowerCase());

      const matchMode =
        modeFilter === 'All' ||
        o.transportMode === modeFilter;

      return matchSearch && matchMode;
    });
  }, [orders, searchText, modeFilter]);

  const orderColumns = [
    {
      title: 'Mã đơn & Phương thức',
      dataIndex: 'orderCode',
      key: 'orderCode',
      render: (code, record) => (
        <Space direction="vertical" size={2}>
          <strong style={{ fontSize: 14.5, color: '#0F172A', fontFamily: 'monospace' }}>
            #{code}
          </strong>
          <Tag color={record.transportMode === 'Air' ? 'blue' : record.transportMode === 'DoorToDoor' ? 'purple' : 'orange'} style={{ borderRadius: 6, fontWeight: 700 }}>
            {record.transportMode === 'Air' ? '✈️ Air Flight' : record.transportMode === 'DoorToDoor' ? '🌐 Door-to-Door' : '🚛 Ground'}
          </Tag>
        </Space>
      ),
    },
    {
      title: 'Khách hàng',
      dataIndex: 'customerName',
      key: 'customerName',
      render: (name, record) => (
        <div>
          <strong style={{ color: '#0F172A' }}>{name}</strong>
          <div style={{ fontSize: 12, color: '#64748B' }}>{record.customerPhone || '---'}</div>
        </div>
      ),
    },
    {
      title: 'Ngựa đua',
      dataIndex: 'totalHorses',
      key: 'totalHorses',
      render: (cnt, record) => (
        <div>
          <Tag color="gold" style={{ fontWeight: 800 }}>🐴 {cnt} cá thể</Tag>
          <div style={{ fontSize: 12, color: '#475569', marginTop: 2 }}>
            {record.horses?.join(', ')}
          </div>
        </div>
      ),
    },
    {
      title: 'Tuyến vận chuyển',
      key: 'route',
      render: (_, record) => (
        <div>
          <strong>{record.originCode} ➔ {record.destinationCode}</strong>
          <div style={{ fontSize: 12, color: '#64748B' }}>
            {record.origin?.split(',')[0]} ➔ {record.destination?.split(',')[0]}
          </div>
        </div>
      ),
    },
    {
      title: 'Khởi hành',
      dataIndex: 'departureDate',
      key: 'departureDate',
      render: (d) => (
        <span>{dayjs(d).format('DD/MM/YYYY')}</span>
      ),
    },
    {
      title: 'Ngân sách duyệt',
      dataIndex: 'customerFeeCap',
      key: 'customerFeeCap',
      render: (cap) => (
        <strong style={{ color: '#16A34A', fontSize: 14 }}>
          $${Number(cap || 5000).toLocaleString()}
        </strong>
      ),
    },
    {
      title: 'Trạng thái lộ trình',
      key: 'planStatus',
      render: (_, record) => {
        const plan = plans.find((p) => p.orderCode === record.orderCode || p.orderId === record.orderId);
        if (!plan) {
          return <Tag color="default">CHƯA LẬP KẾ HOẠCH</Tag>;
        }
        if (plan.status === 'REJECTED') {
          return <Tag color="red" style={{ fontWeight: 700 }}>CẦN CHỈNH SỬA (Lần {plan.rejectionCount || 1})</Tag>;
        }
        if (plan.status === 'PENDING_APPROVAL') {
          return <Tag color="gold" style={{ fontWeight: 700 }}>CHỜ MANAGER DUYỆT</Tag>;
        }
        if (plan.status === 'ASSIGNED') {
          return <Tag color="green" style={{ fontWeight: 700 }}>ĐÃ DUYỆT & GIAO VIỆC</Tag>;
        }
        return <Tag color="blue">{plan.statusText || plan.status}</Tag>;
      },
    },
    {
      title: 'Thao tác',
      key: 'action',
      render: (_, record) => {
        const plan = plans.find((p) => p.orderCode === record.orderCode || p.orderId === record.orderId);
        const isPlanRejected = plan?.status === 'REJECTED';
        return (
          <Button
            type="primary"
            size="middle"
            onClick={() => handleOpenPlanForOrder(record.orderCode)}
            style={{
              borderRadius: 8,
              fontWeight: 700,
              backgroundColor: isPlanRejected ? '#DC2626' : '#D97706',
              borderColor: isPlanRejected ? '#DC2626' : '#D97706',
            }}
          >
            {isPlanRejected ? 'Sửa kế hoạch bị từ chối' : plan ? 'Chỉnh sửa kế hoạch' : 'Lập kế hoạch lộ trình'}
          </Button>
        );
      },
    },
  ];

  return (
    <div style={{ maxWidth: 1320, margin: '0 auto', paddingBottom: 40 }}>
      {/* HEADER QUAY LẠI VÀ TIÊU ĐỀ */}
      <Flex align="center" justify="space-between" wrap="wrap" gap="middle" style={{ marginBottom: 20 }}>
        <Flex align="center" gap={12}>
          <Button
            icon={<ArrowLeftOutlined />}
            onClick={() => navigate(ROUTES.COORDINATOR_DASHBOARD)}
            style={{ borderRadius: 8 }}
          >
            Operations Hub
          </Button>
          <div>
            <Title level={2} style={{ margin: 0, fontWeight: 800, color: '#0F172A', fontSize: 26 }}>
              Route Planning & Resource Allocation Studio
            </Title>
            <Text style={{ color: '#64748B', fontSize: 13 }}>
              {viewMode === 'orders_list'
                ? 'Danh sách các yêu cầu vận chuyển cần lập kế hoạch lộ trình và phân bổ nguồn lực'
                : `Thiết lập lộ trình cho đơn hàng #${currentOrder.orderCode} • ${currentOrder.customerName}`}
            </Text>
          </div>
        </Flex>

        {viewMode === 'studio' && (
          <Button
            type="default"
            onClick={() => setViewMode('orders_list')}
            style={{ borderRadius: 8, fontWeight: 700 }}
          >
            📋 Xem danh sách yêu cầu cần lên kế hoạch ({orders.length})
          </Button>
        )}
      </Flex>

      {/* VIEW 1: MASTER LIST CÁC YÊU CẦU CẦN LÊN KẾ HOẠCH (ITEM 4) */}
      {viewMode === 'orders_list' ? (
        <Card
          bordered
          style={{ borderRadius: 20, border: '1px solid #E2E8F0', boxShadow: '0 2px 10px rgba(0,0,0,0.02)' }}
          styles={{ body: { padding: '24px 28px' } }}
        >
          <Flex justify="space-between" align="center" wrap="wrap" gap="middle" style={{ marginBottom: 20 }}>
            <div>
              <Title level={4} style={{ margin: 0, fontWeight: 800, color: '#0F172A' }}>
                Danh sách các yêu cầu vận chuyển cần lên kế hoạch
              </Title>
              <Text style={{ color: '#64748B', fontSize: 13 }}>
                Chọn một yêu cầu để thiết lập điểm dừng trung chuyển, phân bổ phương tiện & chỉ định nhân sự
              </Text>
            </div>

            <Space wrap>
              <Input
                placeholder="Tìm mã đơn, khách hàng..."
                prefix={<SearchOutlined style={{ color: '#94A3B8' }} />}
                value={searchText}
                onChange={(e) => setSearchText(e.target.value)}
                style={{ width: 240, borderRadius: 8 }}
                allowClear
              />
              <Select
                value={modeFilter}
                onChange={setModeFilter}
                style={{ width: 170 }}
                options={[
                  { label: 'Tất cả phương thức', value: 'All' },
                  { label: '✈️ Air Flight', value: 'Air' },
                  { label: '🌐 Door-to-Door', value: 'DoorToDoor' },
                  { label: '🚛 Ground', value: 'Ground' },
                ]}
              />
            </Space>
          </Flex>

          <Table
            columns={orderColumns}
            dataSource={filteredOrders}
            rowKey="orderCode"
            pagination={{ pageSize: 6 }}
            style={{ borderRadius: 12, overflow: 'hidden' }}
          />
        </Card>
      ) : (
        /* VIEW 2: PLANNING STUDIO CHO ĐƠN HÀNG ĐƯỢC CHỌN */
        <div>
          {/* BANNER CẢNH BÁO KẾ HOẠCH BỊ REJECT THEO YÊU CẦU ITEM 11 */}
          {existingPlan?.status === 'REJECTED' && (
            <div
              style={{
                backgroundColor: '#FEF2F2',
                border: '1.5px solid #FCA5A5',
                borderRadius: 14,
                padding: '16px 20px',
                marginBottom: 20,
              }}
            >
              <Flex align="flex-start" gap={12}>
                <span style={{ fontSize: 24 }}>⚠️</span>
                <div>
                  <strong style={{ fontSize: 15, color: '#991B1B', display: 'block', marginBottom: 4 }}>
                    Kế hoạch lộ trình đã bị Logistics Manager từ chối (Lần {existingPlan.rejectionCount || 1})
                  </strong>
                  <div style={{ fontSize: 13, color: '#7F1D1D', marginBottom: 4 }}>
                    <strong>Lý do từ chối:</strong> {existingPlan.rejectionReason}
                  </div>
                  {existingPlan.rejectionRemarks && (
                    <div style={{ fontSize: 13, color: '#991B1B', marginBottom: 6 }}>
                      <strong>Ghi chú điều chỉnh:</strong> {existingPlan.rejectionRemarks}
                    </div>
                  )}
                  <div style={{ fontSize: 12, color: '#DC2626', fontWeight: 600 }}>
                    * Bắt buộc: Bạn phải điều chỉnh lại trạm dừng, phương tiện, nhân sự hoặc ngân sách dự toán trước khi nộp lại.
                  </div>
                </div>
              </Flex>
            </div>
          )}

          <Row gutter={[24, 24]}>
            {/* CỘT TRÁI: 1. TARGET ORDER & 2. ROUTE CHECKPOINTS */}
            <Col xs={24} lg={15}>
              <Space direction="vertical" size={24} style={{ width: '100%' }}>
                {/* PHẦN 1: TARGET ORDER & VEHICLE ALLOCATION */}
                <Card
                  bordered
                  style={{ borderRadius: 18, border: '1px solid #E2E8F0' }}
                  styles={{ body: { padding: '22px 24px' } }}
                >
                  <Title level={4} style={{ margin: '0 0 4px', fontWeight: 800, color: '#0F172A' }}>
                    1. Target Order & Vehicle Allocation
                  </Title>
                  <Text style={{ fontSize: 13, color: '#64748B', display: 'block', marginBottom: 18 }}>
                    Phương thức vận chuyển: <strong>{currentOrder.transportMode || 'Air'}</strong> • Chỉ định phương tiện & máy bay phù hợp
                  </Text>

                  <Row gutter={16}>
                    <Col xs={24} md={isDoorToDoor ? 24 : 12} style={{ marginBottom: isDoorToDoor ? 16 : 0 }}>
                      <label htmlFor="order-plan-select" style={{ fontSize: 12, fontWeight: 700, color: '#334155', display: 'block', marginBottom: 6 }}>
                        APPROVED ORDER TO PLAN *
                      </label>
                      <Select
                        id="order-plan-select"
                        value={selectedOrderCode}
                        onChange={handleSelectOrder}
                        size="large"
                        style={{ width: '100%' }}
                        options={orders.map((o) => ({
                          value: o.orderCode,
                          label: `#${o.orderCode} • ${o.customerName} (${o.totalHorses} Ngựa) [${o.transportMode}]`,
                        }))}
                      />
                      <div style={{ fontSize: 12, color: '#16A34A', marginTop: 6, fontWeight: 600 }}>
                        ✓ Order Status: Approved by Logistics Manager
                      </div>
                    </Col>

                    {isDoorToDoor ? (
                      <>
                        <Col xs={24} md={12}>
                          <label htmlFor="ground-fleet-select" style={{ fontSize: 12, fontWeight: 700, color: '#334155', display: 'block', marginBottom: 6 }}>
                            🚛 XE VẬN CHUYỂN NỘI ĐỊA (GROUND FLEET) *
                          </label>
                          <Select
                            id="ground-fleet-select"
                            value={selectedFleetId}
                            onChange={setSelectedFleetId}
                            size="large"
                            style={{ width: '100%' }}
                            options={fleetList
                              .filter((f) => !f.type.includes('Air'))
                              .map((f) => ({
                                value: f.id,
                                label: `🚛 ${f.name} (${f.capacity})`,
                              }))}
                          />
                          <div style={{ fontSize: 12, color: '#16A34A', marginTop: 4 }}>
                            ✓ Đón/trả trực tiếp tại trang trại khách hàng
                          </div>
                        </Col>
                        <Col xs={24} md={12}>
                          <label htmlFor="air-fleet-select" style={{ fontSize: 12, fontWeight: 700, color: '#334155', display: 'block', marginBottom: 6 }}>
                            ✈️ MÁY BAY CHUYÊN DỤNG (AIR CARGO CHARTER) *
                          </label>
                          <Select
                            id="air-fleet-select"
                            value={selectedAirFleetId}
                            onChange={setSelectedAirFleetId}
                            size="large"
                            style={{ width: '100%' }}
                            options={fleetList
                              .filter((f) => f.type.includes('Air'))
                              .map((f) => ({
                                value: f.id,
                                label: `✈️ ${f.name}`,
                              }))}
                          />
                          <div style={{ fontSize: 12, color: '#2563EB', marginTop: 4 }}>
                            Specs: Buồng điều hòa chuyên dụng, chuẩn an toàn FEI
                          </div>
                        </Col>
                      </>
                    ) : (
                      <Col xs={24} md={12}>
                        <label htmlFor="fleet-allocate-select" style={{ fontSize: 12, fontWeight: 700, color: '#334155', display: 'block', marginBottom: 6 }}>
                          {isAirOnly ? '✈️ ALLOCATE AIR CARGO / FLIGHT STALL *' : '🚛 ALLOCATE GROUND FLEET VEHICLE *'}
                        </label>
                        <Select
                          id="fleet-allocate-select"
                          value={selectedFleetId}
                          onChange={setSelectedFleetId}
                          size="large"
                          style={{ width: '100%' }}
                          options={fleetList
                            .filter((f) => (isAirOnly ? f.type.includes('Air') : !f.type.includes('Air')))
                            .map((f) => ({
                              value: f.id,
                              label: `${f.type.includes('Air') ? '✈️' : '🚛'} ${f.name}`,
                            }))}
                        />
                        <div style={{ fontSize: 12, color: '#2563EB', marginTop: 6 }}>
                          Specs: {currentFleet.specs || 'Dual HVAC, Padded stalls'}
                        </div>
                      </Col>
                    )}
                  </Row>
                </Card>

                {/* PHẦN 2: ROUTE CHECKPOINTS & WAYPOINTS SETUP */}
                <Card
                  bordered
                  style={{ borderRadius: 18, border: '1px solid #E2E8F0' }}
                  styles={{ body: { padding: '22px 24px' } }}
                >
                  <Flex justify="space-between" align="center" style={{ marginBottom: 4 }}>
                    <Title level={4} style={{ margin: 0, fontWeight: 800, color: '#0F172A' }}>
                      2. Route Checkpoints & Waypoints Setup
                    </Title>
                    <Tag color="blue" style={{ fontWeight: 700, borderRadius: 6 }}>
                      {checkpoints.length} Checkpoints
                    </Tag>
                  </Flex>
                  <Text style={{ fontSize: 13, color: '#64748B', display: 'block', marginBottom: 20 }}>
                    Điểm đầu, điểm cuối và các điểm dừng trung chuyển ở giữa theo yêu cầu
                  </Text>

                  {/* TIMELINE DANH SÁCH CHECKPOINTS */}
                  <Space direction="vertical" size={14} style={{ width: '100%' }}>
                    {checkpoints.map((cp, idx) => {
                      const isOrigin = cp.type === 'ORIGIN';
                      const isArrival = cp.type === 'ARRIVAL';
                      const isRestStop = cp.type === 'REST_STOP';

                      return (
                        <div
                          key={idx}
                          style={{
                            border: isOrigin
                              ? '1.5px solid #BBF7D0'
                              : isArrival
                              ? '1.5px solid #86EFAC'
                              : '1.5px solid #FED7AA',
                            backgroundColor: isOrigin
                              ? '#F0FDF4'
                              : isArrival
                              ? '#F0FDF4'
                              : '#FFFBF5',
                            borderRadius: 14,
                            padding: '16px 18px',
                            display: 'flex',
                            alignItems: 'flex-start',
                            gap: 14,
                          }}
                        >
                          <div
                            style={{
                              width: 32,
                              height: 32,
                              borderRadius: '50%',
                              backgroundColor: isOrigin || isArrival ? '#16A34A' : '#D97706',
                              color: '#FFFFFF',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              fontWeight: 800,
                              fontSize: 14,
                              flexShrink: 0,
                            }}
                          >
                            {cp.step}
                          </div>

                          <div style={{ flex: 1 }}>
                            <Flex justify="space-between" align="center" style={{ marginBottom: 4 }}>
                              <strong style={{ fontSize: 14.5, color: '#0F172A' }}>
                                {cp.name}
                              </strong>
                              <Space size={6}>
                                {isOrigin && (
                                  <Tag color="green" style={{ fontWeight: 800, borderRadius: 6 }}>
                                    ORIGIN (ĐIỂM ĐẦU)
                                  </Tag>
                                )}
                                {isRestStop && (
                                  <Tag color="gold" style={{ fontWeight: 800, borderRadius: 6 }}>
                                    TRUNG CHUYỂN
                                  </Tag>
                                )}
                                {isArrival && (
                                  <Tag color="cyan" style={{ fontWeight: 800, borderRadius: 6 }}>
                                    ARRIVAL (ĐIỂM CUỐI)
                                  </Tag>
                                )}
                                {!isOrigin && !isArrival && (
                                  <Button
                                    type="text"
                                    danger
                                    icon={<DeleteOutlined />}
                                    size="small"
                                    onClick={() => handleRemoveCheckpoint(idx)}
                                  />
                                )}
                              </Space>
                            </Flex>

                            <div style={{ fontSize: 12.5, color: '#475569', marginBottom: 2 }}>
                              📍 Địa chỉ cơ sở: <strong>{cp.location}</strong> {cp.fee ? `• Phí dịch vụ: $${Number(cp.fee).toLocaleString()}` : ''} • ETA: <strong>{cp.eta}</strong>
                            </div>
                            <div style={{ fontSize: 12, color: '#64748B' }}>
                              {cp.description}
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </Space>

                  {/* DANH MỤC CÁC ĐIỂM CÓ THỂ TRUNG CHUYỂN KHẢ DỤNG THEO YÊU CẦU ITEM 4 */}
                  <div style={{ marginTop: 24, paddingTop: 18, borderTop: '1.5px dashed #E2E8F0' }}>
                    <Flex justify="space-between" align="center" style={{ marginBottom: 14 }}>
                      <div>
                        <strong style={{ fontSize: 14.5, color: '#0F172A', display: 'block' }}>
                          🏢 Danh mục các điểm có thể trung chuyển khả dụng (Transit Hubs Catalog):
                        </strong>
                        <Text style={{ fontSize: 12, color: '#64748B' }}>
                          Bấm &quot;+ Chọn trạm này&quot; để chèn trực tiếp vào giữa lộ trình và tự động cập nhật biểu phí
                        </Text>
                      </div>
                      <Tag color="cyan" style={{ fontWeight: 700 }}>
                        {INTERMEDIATE_STOPS_CATALOG.length} Trạm khả dụng
                      </Tag>
                    </Flex>

                    <Row gutter={[12, 12]}>
                      {INTERMEDIATE_STOPS_CATALOG.map((stop) => {
                        const departureMonth = dayjs(currentOrder.departureDate || new Date()).month() + 1;
                        const isStopActive = stop.activeMonths.includes(departureMonth);
                        const isAlreadyAdded = checkpoints.some((cp) => cp.name === stop.name);

                        return (
                          <Col xs={24} sm={12} key={stop.id}>
                            <div
                              style={{
                                padding: '12px 14px',
                                borderRadius: 12,
                                border: isAlreadyAdded
                                  ? '1.5px solid #F59E0B'
                                  : isStopActive
                                  ? '1px solid #E2E8F0'
                                  : '1px dashed #CBD5E1',
                                backgroundColor: isAlreadyAdded
                                  ? '#FFFBEB'
                                  : isStopActive
                                  ? '#FFFFFF'
                                  : '#F8FAFC',
                                display: 'flex',
                                flexDirection: 'column',
                                justifyContent: 'space-between',
                                height: '100%',
                                boxShadow: '0 1px 3px rgba(0,0,0,0.02)',
                              }}
                            >
                              <div>
                                <Flex justify="space-between" align="flex-start" style={{ marginBottom: 4 }}>
                                  <strong style={{ fontSize: 13, color: '#0F172A', lineHeight: 1.3 }}>
                                    {stop.name}
                                  </strong>
                                  <Tag color={isStopActive ? 'green' : 'red'} style={{ fontSize: 11, margin: 0, fontWeight: 700 }}>
                                    {isStopActive ? 'Hoạt động' : 'Tạm dừng (FEI)'}
                                  </Tag>
                                </Flex>
                                <div style={{ fontSize: 11.5, color: '#475569', marginBottom: 4 }}>
                                  📍 {stop.location}
                                </div>
                                <div style={{ fontSize: 12, color: '#B45309', fontWeight: 700 }}>
                                  Phí trạm: +$${stop.fee.toLocaleString()} USD
                                </div>
                                {!isStopActive && (
                                  <div style={{ fontSize: 11, color: '#DC2626', marginTop: 4, fontStyle: 'italic' }}>
                                    * {stop.seasonNote}
                                  </div>
                                )}
                              </div>

                              <div style={{ marginTop: 10, paddingTop: 8, borderTop: '1px solid #F1F5F9' }}>
                                {isAlreadyAdded ? (
                                  <Tag color="gold" style={{ width: '100%', textAlign: 'center', fontWeight: 700, padding: '4px 0' }}>
                                    ✓ Đã có trong lộ trình
                                  </Tag>
                                ) : (
                                  <Button
                                    size="small"
                                    type={isStopActive ? 'primary' : 'default'}
                                    disabled={!isStopActive}
                                    onClick={() => handleAddStopFromCatalog(stop)}
                                    style={{
                                      width: '100%',
                                      borderRadius: 6,
                                      fontSize: 12,
                                      fontWeight: 700,
                                      backgroundColor: isStopActive ? '#D97706' : undefined,
                                      borderColor: isStopActive ? '#D97706' : undefined,
                                    }}
                                  >
                                    {isStopActive ? '+ Chọn trạm này' : 'Tạm dừng theo mùa'}
                                  </Button>
                                )}
                              </div>
                            </div>
                          </Col>
                        );
                      })}
                    </Row>
                  </div>
                </Card>
              </Space>
            </Col>

            {/* CỘT PHẢI: 3. PERSONNEL ASSIGNMENT & 4. EXPENSE ESTIMATION & SUBMIT BUTTON */}
            <Col xs={24} lg={9}>
              <Space direction="vertical" size={24} style={{ width: '100%' }}>
                {/* PHẦN 3: PERSONNEL ASSIGNMENT */}
                <Card
                  bordered
                  style={{ borderRadius: 18, border: '1px solid #E2E8F0' }}
                  styles={{ body: { padding: '22px' } }}
                >
                  <Title level={4} style={{ margin: '0 0 4px', fontWeight: 800, color: '#0F172A' }}>
                    3. Personnel Assignment
                  </Title>
                  <Text style={{ fontSize: 13, color: '#64748B', display: 'block', marginBottom: 16 }}>
                    Phân bổ nhân sự áp tải theo phương thức: <strong>{currentOrder.transportMode || 'Air'}</strong>
                  </Text>

                  {isAirOnly ? (
                    <div style={{ marginBottom: 16, backgroundColor: '#F0F9FF', border: '1px solid #BAE6FD', padding: '12px 14px', borderRadius: 10 }}>
                      <span style={{ fontSize: 12, fontWeight: 700, color: '#0369A1', display: 'block', marginBottom: 4 }}>
                        ✈️ TỔNG QUAN PHI ĐỘI HÀNG KHÔNG
                      </span>
                      <Text style={{ fontSize: 12, color: '#0284C7' }}>
                        Vận chuyển Air Flight chỉ điều động Bác sĩ thú y Escort đi cùng khoang bay. Không bố trí tài xế đường bộ trên máy bay.
                      </Text>
                    </div>
                  ) : (
                    <div style={{ marginBottom: 16 }}>
                      <label htmlFor="driver-select" style={{ fontSize: 12, fontWeight: 700, color: '#334155', display: 'block', marginBottom: 6 }}>
                        🚛 PRIMARY DRIVER (GROUND VEHICLE) *
                      </label>
                      <Select
                        id="driver-select"
                        value={selectedDriverId}
                        onChange={setSelectedDriverId}
                        size="large"
                        style={{ width: '100%' }}
                        options={personnelList
                          .filter((p) => p.role.includes('Driver'))
                          .map((p) => {
                            const avail = checkCrewAvailability(p.id, currentOrder.departureDate);
                            return {
                              value: p.id,
                              label: (
                                <Flex justify="space-between" align="center">
                                  <span>{p.avatar} {p.name} ({p.license?.split(' ')[0]})</span>
                                  {!avail.available ? (
                                    <Tag color="red" style={{ fontSize: 11, margin: 0, fontWeight: 700 }}>
                                      Nghỉ phép ({dayjs(currentOrder.departureDate).format('DD/MM')})
                                    </Tag>
                                  ) : (
                                    <Tag color="green" style={{ fontSize: 11, margin: 0 }}>Sẵn sàng</Tag>
                                  )}
                                </Flex>
                              ),
                            };
                          })}
                      />
                      <div style={{ fontSize: 12, color: '#475569', marginTop: 4 }}>
                        License: {currentDriver.license || 'VN-FC-8812'} • Exp: {currentDriver.experience || '8 years'}
                      </div>
                    </div>
                  )}

                  <div style={{ marginBottom: 16 }}>
                    <label htmlFor="vet-escort-select" style={{ fontSize: 12, fontWeight: 700, color: '#334155', display: 'block', marginBottom: 6 }}>
                      👩‍⚕️ VETERINARY ESCORT (IN-FLIGHT / IN-TRANSIT) *
                    </label>
                    <Select
                      id="vet-escort-select"
                      value={selectedVetId}
                      onChange={setSelectedVetId}
                      size="large"
                      style={{ width: '100%' }}
                      options={personnelList
                        .filter((p) => p.role.includes('Vet') || p.role.includes('Escort'))
                        .map((p) => {
                          const avail = checkCrewAvailability(p.id, currentOrder.departureDate);
                          return {
                            value: p.id,
                            label: (
                              <Flex justify="space-between" align="center">
                                <span>{p.avatar} {p.name}</span>
                                {!avail.available ? (
                                  <Tag color="red" style={{ fontSize: 11, margin: 0, fontWeight: 700 }}>
                                    Nghỉ phép ({dayjs(currentOrder.departureDate).format('DD/MM')})
                                  </Tag>
                                ) : (
                                  <Tag color="green" style={{ fontSize: 11, margin: 0 }}>Sẵn sàng</Tag>
                                )}
                              </Flex>
                            ),
                          };
                        })}
                    />
                    <div style={{ fontSize: 12, color: '#475569', marginTop: 4 }}>
                      License: {currentVet.license || 'FEI Vet Official'} • Exp: {currentVet.experience || '12 years'}
                    </div>
                  </div>
                </Card>

                {/* PHẦN 4: EXPENSE ESTIMATION & BUDGET ANALYSIS */}
                <Card
                  bordered
                  style={{ borderRadius: 18, border: '1px solid #E2E8F0' }}
                  styles={{ body: { padding: '22px' } }}
                >
                  <Title level={4} style={{ margin: '0 0 4px', fontWeight: 800, color: '#0F172A' }}>
                    4. Cost Breakdown & Budget Cap
                  </Title>
                  <Text style={{ fontSize: 13, color: '#64748B', display: 'block', marginBottom: 18 }}>
                    Dự toán chi phí thực thi so với hạn mức khách hàng duyệt
                  </Text>

                  <Space direction="vertical" size={10} style={{ width: '100%', marginBottom: 16 }}>
                    {isAirOnly || isDoorToDoor ? (
                      <Flex justify="space-between" align="center">
                        <span style={{ fontSize: 13, color: '#475569' }}>Air Charter Flight</span>
                        <strong style={{ fontSize: 14 }}>$${charterCost.toLocaleString()}</strong>
                      </Flex>
                    ) : null}

                    <Flex justify="space-between" align="center">
                      <span style={{ fontSize: 13, color: '#475569' }}>Stall Rent / Ground Fleet</span>
                      <strong style={{ fontSize: 14 }}>$${stallRent.toLocaleString()}</strong>
                    </Flex>

                    <Flex justify="space-between" align="center">
                      <span style={{ fontSize: 13, color: '#475569' }}>Vet Escort Fee</span>
                      <strong style={{ fontSize: 14 }}>$${vetEscortFees.toLocaleString()}</strong>
                    </Flex>

                    <Flex justify="space-between" align="center">
                      <span style={{ fontSize: 13, color: '#475569' }}>Quarantine & Transit Hubs Fee</span>
                      <strong style={{ fontSize: 14 }}>$${quarantineFees.toLocaleString()}</strong>
                    </Flex>

                    {isDoorToDoor && (
                      <Flex justify="space-between" align="center">
                        <span style={{ fontSize: 13, color: '#7C3AED' }}>Overseas Vehicle Rental</span>
                        <strong style={{ fontSize: 14, color: '#7C3AED' }}>+$${overseasRentalFee.toLocaleString()}</strong>
                      </Flex>
                    )}

                    <Divider style={{ margin: '8px 0' }} />

                    <Flex justify="space-between" align="center">
                      <strong style={{ fontSize: 15, color: '#0F172A' }}>Tổng dự toán (Total Estimated):</strong>
                      <strong style={{ fontSize: 18, color: totalEstimatedBudget > customerFeeCap ? '#DC2626' : '#16A34A' }}>
                        $${totalEstimatedBudget.toLocaleString()}
                      </strong>
                    </Flex>
                    <Flex justify="space-between" align="center">
                      <span style={{ fontSize: 12, color: '#64748B' }}>Hạn mức khách duyệt (Customer Cap):</span>
                      <span style={{ fontSize: 13, fontWeight: 600 }}>$${customerFeeCap.toLocaleString()}</span>
                    </Flex>
                  </Space>

                  <Space style={{ width: '100%' }}>
                    <Button
                      block
                      onClick={handleSaveDraft}
                      style={{ height: 42, borderRadius: 10, fontWeight: 700 }}
                    >
                      Save Draft
                    </Button>
                    <Button
                      type="primary"
                      block
                      onClick={handleOpenConfirmModal}
                      style={{
                        height: 42,
                        borderRadius: 10,
                        fontWeight: 800,
                        backgroundColor: '#16A34A',
                        borderColor: '#16A34A',
                      }}
                    >
                      {existingPlan?.status === 'REJECTED' ? 'Nộp lại kế hoạch đã sửa' : 'Submit for Manager Review'}
                    </Button>
                  </Space>
                </Card>
              </Space>
            </Col>
          </Row>
        </div>
      )}

      {/* MODAL THÊM TRẠM DỪNG TÙY CHỈNH */}
      <Modal
        open={addStopModalOpen}
        onCancel={() => setAddStopModalOpen(false)}
        title="Thêm trạm dừng kiểm soát / trạm trung chuyển (Intermediate Stop)"
        onOk={() => newStopForm.submit()}
        okText="Thêm vào lộ trình"
        cancelText="Hủy"
        width={580}
      >
        <Form form={newStopForm} layout="vertical" onFinish={handleAddIntermediateStop} style={{ marginTop: 12 }}>
          <Form.Item name="name" label="Tên trạm dừng *" rules={[{ required: true, message: 'Vui lòng nhập tên trạm' }]}>
            <Input placeholder="Ví dụ: Dubai World Central (DWC) — Layover & Vet Station" />
          </Form.Item>
          <Form.Item name="location" label="Địa chỉ cơ sở (Không ghi tọa độ) *" rules={[{ required: true, message: 'Vui lòng nhập địa chỉ' }]}>
            <Input placeholder="Ví dụ: Dubai South Aviation District, UAE" />
          </Form.Item>
          <Form.Item name="fee" label="Phí trạm & dịch vụ thú y phụ trội ($ USD)">
            <Input type="number" placeholder="1200" prefix="$" />
          </Form.Item>
          <Form.Item name="eta" label="Thời gian dự kiến (ETA) *" rules={[{ required: true, message: 'Vui lòng nhập ETA' }]}>
            <Input placeholder="Ví dụ: Oct 02, 2026 • 14:00 PM" />
          </Form.Item>
          <Form.Item name="description" label="Nhiệm vụ tại trạm">
            <Input.TextArea rows={2} placeholder="Nghỉ ngơi buồng mát, bù nước, kiểm tra thân nhiệt & ghi log thú y" />
          </Form.Item>
        </Form>
      </Modal>

      {/* MODAL XÁC NHẬN CONFIRM PLAN SUBMISSION */}
      <Modal
        open={confirmModalOpen}
        onCancel={() => setConfirmModalOpen(false)}
        footer={null}
        closable={false}
        width={560}
        styles={{ content: { borderRadius: 20, padding: '28px' } }}
      >
        <Flex justify="space-between" align="center" style={{ marginBottom: 16 }}>
          <div>
            <Title level={3} style={{ margin: 0, fontWeight: 800, color: '#16A34A', fontSize: 22 }}>
              Confirm Plan Submission
            </Title>
            <Text type="secondary" style={{ fontSize: 13 }}>
              Order #{currentOrder.orderCode} • {currentOrder.customerName}
            </Text>
          </div>
          <Button
            type="text"
            shape="circle"
            onClick={() => setConfirmModalOpen(false)}
            style={{ backgroundColor: '#F1F5F9' }}
          >
            ✕
          </Button>
        </Flex>

        <div
          style={{
            backgroundColor: '#F8FAFC',
            border: '1px solid #E2E8F0',
            borderRadius: 14,
            padding: '16px 20px',
            marginBottom: 20,
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
            <Text type="secondary">Tuyến lộ trình:</Text>
            <strong>{currentOrder.originCode} ➔ {currentOrder.destinationCode} ({currentOrder.transportMode})</strong>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
            <Text type="secondary">Số lượng trạm dừng:</Text>
            <strong>{checkpoints.length} Checkpoints ({checkpoints.length - 2} trạm trung chuyển)</strong>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
            <Text type="secondary">Phương tiện chỉ định:</Text>
            <strong>{currentFleet.name}</strong>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
            <Text type="secondary">Nhân sự thực thi:</Text>
            <strong>{isAirOnly ? currentVet.name : `${currentDriver.name} & ${currentVet.name}`}</strong>
          </div>
          <Divider style={{ margin: '8px 0' }} />
          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
            <Text type="secondary">Tổng dự toán ngân sách:</Text>
            <strong style={{ color: '#16A34A', fontSize: 16 }}>$${totalEstimatedBudget.toLocaleString()} USD</strong>
          </div>
        </div>

        <Checkbox
          checked={confirmedChecklist}
          onChange={(e) => setConfirmedChecklist(e.target.checked)}
          style={{ marginBottom: 24, fontSize: 13 }}
        >
          Tôi xác nhận phương án lộ trình, phương tiện và nhân sự đã được kiểm tra tính khả thi và tuân thủ tuyệt đối quy định an toàn động vật sống FEI.
        </Checkbox>

        <Flex gap={12}>
          <Button
            block
            size="large"
            onClick={() => setConfirmModalOpen(false)}
            style={{ borderRadius: 10, fontWeight: 700 }}
          >
            Cancel
          </Button>
          <Button
            type="primary"
            block
            size="large"
            disabled={!confirmedChecklist}
            onClick={handleFinalSubmitToManager}
            style={{
              borderRadius: 10,
              fontWeight: 800,
              backgroundColor: '#16A34A',
              borderColor: '#16A34A',
            }}
          >
            Submit for Review
          </Button>
        </Flex>
      </Modal>
    </div>
  );
}
