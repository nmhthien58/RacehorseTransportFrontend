import { useState, useEffect, useMemo } from 'react';
import dayjs from 'dayjs';
import {
  Card,
  Row,
  Col,
  Select,
  Button,
  Modal,
  Form,
  Input,
  Tag,
  Space,
  Popconfirm,
  message,
  Upload,
  Empty,
  DatePicker,
  Dropdown,
  Alert,
} from 'antd';
import { useNavigate } from 'react-router-dom';
import { ROUTES } from '@routes/routes';
import { useAuthStore } from '@features/auth/store/authStore';
import horseService from '@services/horseService';
import { unwrapList } from '@utils/apiHelpers';
import CustomerDossierPanel from '@features/customer/components/CustomerDossierPanel';
import {
  MedicineBoxOutlined,
  AlertOutlined,
  CheckCircleOutlined,
  CloseCircleOutlined,
  PlusOutlined,
  PrinterOutlined,
  UploadOutlined,
  DeleteOutlined,
  EditOutlined,
  FileTextOutlined,
  SafetyCertificateOutlined,
  ClockCircleOutlined,
  CalendarOutlined,
  FilePdfOutlined,
  BellOutlined,
  EyeOutlined,
} from '@ant-design/icons';
import StandardFormTemplateModal from '@components/common/StandardFormTemplateModal';
import {
  calculateHorseRisk,
  RiskBadge,
  saveHorseMarkings,
  getHorseMarkings,
  saveHorsePhotos,
  getHorsePhotos,
} from '@utils/horseStorage';
import {
  getStoredVetRecords,
  addStoredVetRecord,
  updateStoredVetRecord,
  deleteStoredVetRecord,
  getStoredReminders,
  addStoredReminder,
  deleteStoredReminder,
  saveStoredMarkings,
  saveStoredAnglePhotos,
} from '@utils/vetStorage';

const { TextArea } = Input;

// 7 Tabs matching Figma design
const TABS = [
  { key: 'overview', label: 'Overview' },
  { key: 'records', label: 'Records' },
  { key: 'dossier', label: 'Digital Dossier' },
  { key: 'travelReady', label: 'Travel Ready' },
  { key: 'identification', label: 'Identification' },
  { key: 'reminders', label: 'Reminders' },
  { key: 'emergency', label: 'Emergency' },
];

// Record sub-filter categories matching Figma
const RECORD_CATEGORIES = [
  { key: 'All', label: 'Tất cả (All)' },
  { key: 'Vaccinations', label: '💉 Tiêm phòng Vaccine' },
  { key: 'Health Cert', label: '📋 Kiểm dịch CVI' },
  { key: 'Coggins', label: '🔬 Xét nghiệm Coggins EIA' },
  { key: 'Deworming', label: '💊 Tẩy giun sán' },
  { key: 'Dental', label: '🦷 Khám nha khoa' },
  { key: 'Farrier', label: '🔨 Chăm sóc móng' },
  { key: 'Other', label: '📁 Hồ sơ khác' },
];

const RECORD_TYPE_OPTIONS = [
  {
    value: 'Tiêm phòng Vaccine (Vaccinations / Equine Influenza)',
    label: '💉 Tiêm phòng Vaccine (Vaccinations / Equine Influenza)',
  },
  {
    value: 'Chứng nhận kiểm dịch thú y xuất khẩu (Health Certificate / CVI)',
    label: '📋 Chứng nhận kiểm dịch thú y xuất khẩu (Health Certificate / CVI)',
  },
  {
    value: 'Xét nghiệm máu Coggins EIA (Coggins / Equine Infectious Anemia PCR)',
    label: '🔬 Xét nghiệm máu Coggins EIA (Coggins / Equine Infectious Anemia PCR)',
  },
  {
    value: 'Tẩy giun & Phòng ký sinh trùng (Deworming & Parasite Control)',
    label: '💊 Tẩy giun & Phòng ký sinh trùng (Deworming & Parasite Control)',
  },
  {
    value: 'Khám nha khoa & Chăm sóc răng miệng (Dental Examination & Floating)',
    label: '🦷 Khám nha khoa & Chăm sóc răng miệng (Dental Examination & Floating)',
  },
  {
    value: 'Chăm sóc móng guốc & Đóng móng (Farrier & Hoof Balance)',
    label: '🔨 Chăm sóc móng guốc & Đóng móng (Farrier & Hoof Balance)',
  },
  {
    value: 'Khám lâm sàng & Sức khỏe tổng quát (Wellness & Clinical Exam)',
    label: '🩺 Khám lâm sàng & Sức khỏe tổng quát (Wellness & Clinical Exam)',
  },
  {
    value: 'Hồ sơ điều trị thú y / Khác (General Medical Treatment / Other)',
    label: '📁 Hồ sơ điều trị thú y / Khác (General Medical Treatment / Other)',
  },
];

const TEMPLATE_MENU_ITEMS = [
  {
    key: 'VACCINE_RECORD',
    label: '💉 Mẫu Sổ tiêm chủng Vaccine (FEI Annex VI)',
    docType: 'VACCINE_RECORD',
    title: 'Mẫu Sổ Tiêm Chủng Vaccine Cúm Ngựa Chuẩn Quốc Tế',
  },
  {
    key: 'HEALTH_CERT',
    label: '📋 Mẫu Chứng nhận kiểm dịch CVI (Health Certificate)',
    docType: 'HEALTH_CERT',
    title: 'Mẫu Giấy Chứng Nhận Kiểm Dịch Động Vật CVI Xuất Khẩu',
  },
  {
    key: 'COGGINS_EIA',
    label: '🔬 Mẫu Phiếu xét nghiệm Coggins EIA (PCR Âm tính)',
    docType: 'COGGINS_EIA',
    title: 'Mẫu Phiếu Xét Nghiệm Huyết Thanh Coggins (EIA)',
  },
  {
    key: 'DEWORMING',
    label: '💊 Mẫu Sổ theo dõi tẩy giun & Ký sinh trùng',
    docType: 'DEWORMING',
    title: 'Mẫu Sổ Theo Dõi Tẩy Giun & Phòng Ký Sinh Trùng',
  },
  {
    key: 'DENTAL',
    label: '🦷 Mẫu Phiếu khám nha khoa & Mài răng',
    docType: 'DENTAL',
    title: 'Mẫu Phiếu Khám Nha Khoa & Chăm Sóc Răng Miệng',
  },
  {
    key: 'FARRIER',
    label: '🔨 Mẫu Phiếu chăm sóc móng & Đóng móng thi đấu',
    docType: 'FARRIER',
    title: 'Mẫu Phiếu Chăm Sóc Móng Guốc & Đóng Móng Thể Thao',
  },
  {
    key: 'WELLNESS',
    label: '🩺 Mẫu Biên bản khám lâm sàng Fit-to-Fly',
    docType: 'WELLNESS',
    title: 'Mẫu Biên Bản Khám Lâm Sàng Thể Lực (Fit-to-Fly)',
  },
  {
    key: 'HORSE_PASSPORT',
    label: '🐎 Mẫu Hộ chiếu ngựa FEI & Đối soát vi mạch',
    docType: 'HORSE_PASSPORT',
    title: 'Mẫu Hộ Chiếu Ngựa Quốc Tế FEI & Đối Soát Vi Mạch',
  },
  {
    key: 'IMPORT_PERMIT',
    label: '🏛️ Mẫu Giấy phép xuất nhập cảnh & Quá cảnh',
    docType: 'IMPORT_PERMIT',
    title: 'Mẫu Giấy Phép Xuất Nhập Cảnh & Quá Cảnh',
  },
];

// Thời hạn hiệu lực chuẩn của từng loại kiểm tra y tế / thú y (Requirement 4)
const RECORD_TYPE_VALIDITY_DAYS = {
  'Tiêm phòng Vaccine (Vaccinations / Equine Influenza)': 180, // 6 tháng theo chuẩn FEI
  'Chứng nhận kiểm dịch thú y xuất khẩu (Health Certificate / CVI)': 30, // 30 ngày
  'Xét nghiệm máu Coggins EIA (Coggins / Equine Infectious Anemia PCR)': 180, // 6 tháng
  'Tẩy giun & Phòng ký sinh trùng (Deworming & Parasite Control)': 90, // 3 tháng
  'Khám nha khoa & Chăm sóc răng miệng (Dental Examination & Floating)': 365, // 1 năm
  'Chăm sóc móng guốc & Đóng móng (Farrier & Hoof Balance)': 45, // 45 ngày
  'Khám lâm sàng & Sức khỏe tổng quát (Wellness & Clinical Exam)': 30, // 30 ngày
  'Hồ sơ điều trị thú y / Khác (General Medical Treatment / Other)': 90,
};

// Các mục kiểm tra y tế bắt buộc cho xuất hành quốc tế
const MANDATORY_TRANSPORT_CHECKS = [
  {
    key: 'CVI',
    name: 'Chứng nhận kiểm dịch thú y xuất khẩu (CVI)',
    recordType: 'Chứng nhận kiểm dịch thú y xuất khẩu (Health Certificate / CVI)',
    validityDays: 30,
    required: true,
  },
  {
    key: 'COGGINS',
    name: 'Xét nghiệm máu Coggins EIA (PCR Âm tính)',
    recordType: 'Xét nghiệm máu Coggins EIA (Coggins / Equine Infectious Anemia PCR)',
    validityDays: 180,
    required: true,
  },
  {
    key: 'VACCINE',
    name: 'Tiêm phòng Vaccine Cúm Ngựa (Equine Influenza)',
    recordType: 'Tiêm phòng Vaccine (Vaccinations / Equine Influenza)',
    validityDays: 180,
    required: true,
  },
  {
    key: 'DEWORMING',
    name: 'Sổ theo dõi tẩy giun & Ký sinh trùng',
    recordType: 'Tẩy giun & Phòng ký sinh trùng (Deworming & Parasite Control)',
    validityDays: 90,
    required: false,
  },
  {
    key: 'WELLNESS',
    name: 'Biên bản khám lâm sàng thể lực (Fit-to-Fly)',
    recordType: 'Khám lâm sàng & Sức khỏe tổng quát (Wellness & Clinical Exam)',
    validityDays: 30,
    required: true,
  },
];



/**
 * Ánh xạ loại hồ sơ thú y sang mã biểu mẫu chuẩn PDF quốc tế
 * @param {string} recordTypeStr
 * @returns {string}
 */
const mapRecordTypeToDocType = (recordTypeStr = '') => {
  const str = String(recordTypeStr || '').toLowerCase();
  if (str.includes('vaccin') || str.includes('tiêm')) return 'VACCINE_RECORD';
  if (str.includes('cvi') || str.includes('kiểm dịch') || str.includes('health cert')) return 'HEALTH_CERT';
  if (str.includes('coggins') || str.includes('eia') || str.includes('máu')) return 'COGGINS_EIA';
  if (str.includes('deworm') || str.includes('tẩy giun')) return 'DEWORMING';
  if (str.includes('dent') || str.includes('nha khoa') || str.includes('răng')) return 'DENTAL';
  if (str.includes('farrier') || str.includes('móng')) return 'FARRIER';
  if (str.includes('well') || str.includes('lâm sàng') || str.includes('khám')) return 'WELLNESS';
  if (str.includes('permit') || str.includes('xuất nhập') || str.includes('hải quan')) return 'IMPORT_PERMIT';
  if (str.includes('passport') || str.includes('hộ chiếu') || str.includes('vi mạch')) return 'HORSE_PASSPORT';
  return 'OTHER';
};

// 6 Required Angles for Equine Identification Photo Gallery
const PHOTO_ANGLES = [
  { key: 'frontFace', label: 'Front Face' },
  { key: 'leftSide', label: 'Left Side' },
  { key: 'rightSide', label: 'Right Side' },
  { key: 'rear', label: 'Rear' },
  { key: 'foreheadWhorl', label: 'Forehead Whorl' },
  { key: 'markingsScars', label: 'Markings / Scars' },
];

/**
 * Trang Quản lý Hồ sơ Thú y (Vet Records) cho chủ ngựa - Chuẩn 100% Figma & Flow 2
 */
export default function VetRecordsPage() {
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const currentUserId = user?.userId || user?.UserID;

  const [horses, setHorses] = useState([]);
  const [selectedHorseId, setSelectedHorseId] = useState(null);

  useEffect(() => {
    let active = true;
    horseService
      .getHorses({ size: 100 })
      .then((res) => {
        if (!active) return;
        const list = unwrapList(res).map((h) => ({
          ...h,
          HorseID: h.horseId,
          OwnerUserID: h.ownerUserId,
          Name: h.name,
          Breed: h.breed,
          Gender: h.gender,
          DateOfBirth: h.dateOfBirth,
          Color: h.color,
          MicrochipNumber: h.microchipNumber,
          PassportNumber: h.passportNumber,
          PhotoUrl: h.photoUrl,
          SpecialCareRequirements: h.specialCareRequirements,
        }));
        setHorses(list);
        setSelectedHorseId((prev) => prev ?? list[0]?.HorseID ?? null);
      })
      .catch((err) => console.error(err));
    return () => {
      active = false;
    };
  }, []);

  const [activeTab, setActiveTab] = useState('overview');
  const [records, setRecords] = useState(() => getStoredVetRecords());
  const [recordCategory, setRecordCategory] = useState('All');
  const [reminders, setReminders] = useState(() => getStoredReminders());
  const [storageVersion, setStorageVersion] = useState(0);

  // Modal states
  const [isRecordModalOpen, setIsRecordModalOpen] = useState(false);
  const [isReminderModalOpen, setIsReminderModalOpen] = useState(false);
  const [recordForm] = Form.useForm();
  const [reminderForm] = Form.useForm();
  const [attachmentList, setAttachmentList] = useState([]);
  const [selectedRecordType, setSelectedRecordType] = useState(RECORD_TYPE_OPTIONS[0].value);
  const [editingRecord, setEditingRecord] = useState(null);
  const [templateModal, setTemplateModal] = useState({
    open: false,
    docType: 'HEALTH_CERT',
    title: '',
  });

  // Selected horse object
  const currentHorse = useMemo(() => {
    if (horses.length === 0) return {};
    return horses.find((h) => String(h.HorseID) === String(selectedHorseId)) || horses[0] || {};
  }, [horses, selectedHorseId]);

  // Sync horses and records listeners
  useEffect(() => {
    const handleHorsesUpdate = (e) => {
      if (e.detail && Array.isArray(e.detail)) {
        const filtered = currentUserId
          ? e.detail.filter((h) => Number(h.OwnerUserID || h.ownerUserId) === Number(currentUserId))
          : e.detail;
        setHorses(filtered);
        if (filtered.length > 0 && (!selectedHorseId || !filtered.some((h) => String(h.HorseID) === String(selectedHorseId)))) {
          setSelectedHorseId(filtered[0].HorseID);
        }
      }
    };
    const handleVetUpdate = (e) => {
      if (e.detail) setRecords(e.detail);
    };
    const handleRemindersUpdate = (e) => {
      if (e.detail) setReminders(e.detail);
    };

    window.addEventListener('horses_updated', handleHorsesUpdate);
    window.addEventListener('vet_records_updated', handleVetUpdate);
    window.addEventListener('reminders_updated', handleRemindersUpdate);

    return () => {
      window.removeEventListener('horses_updated', handleHorsesUpdate);
      window.removeEventListener('vet_records_updated', handleVetUpdate);
      window.removeEventListener('reminders_updated', handleRemindersUpdate);
    };
  }, [currentUserId, selectedHorseId]);

  // Filter records for current horse
  const horseRecords = useMemo(() => {
    if (!currentHorse?.HorseID) return [];
    return records.filter((r) => {
      const matchId =
        String(r.horseId) === String(currentHorse.HorseID) ||
        String(r.horseId) === `H-0${currentHorse.HorseID}` ||
        String(r.horseId) === `H-${currentHorse.HorseID}`;
      const matchName =
        r.horseName && r.horseName.toLowerCase() === (currentHorse.Name || '').toLowerCase();
      return matchId || matchName;
    });
  }, [records, currentHorse]);

  // Filtered by category
  const filteredRecords = useMemo(() => {
    if (recordCategory === 'All') return horseRecords;
    return horseRecords.filter((r) => {
      const type = (r.recordType || '').toLowerCase();
      const cat = recordCategory.toLowerCase();
      if (cat === 'vaccinations') return type.includes('vaccin') || type.includes('tiêm');
      if (cat === 'deworming') return type.includes('deworm') || type.includes('tẩy');
      if (cat === 'dental') return type.includes('dent') || type.includes('răng');
      if (cat === 'farrier') return type.includes('farrier') || type.includes('móng');
      if (cat === 'coggins') return type.includes('coggins') || type.includes('eia');
      if (cat === 'health cert') return type.includes('cert') || type.includes('cvi') || type.includes('kiểm dịch');
      return type.includes(cat);
    });
  }, [horseRecords, recordCategory]);

  // Status counts for Overview
  const { currentCount, attentionCount, overdueCount } = useMemo(() => {
    let current = 0;
    let attention = 0;
    let overdue = 0;

    const now = new Date().getTime();
    for (const r of horseRecords) {
      if (r.expirationDate) {
        const expTime = new Date(r.expirationDate).getTime();
        const diffDays = Math.ceil((expTime - now) / (1000 * 60 * 60 * 24));
        if (diffDays < 0) {
          overdue += 1;
        } else if (diffDays <= 30) {
          attention += 1;
        } else {
          current += 1;
        }
      } else if (r.status === 'Valid' || r.status === 'Passed') {
        current += 1;
      } else if (r.status === 'Attention' || r.status === 'Pending') {
        attention += 1;
      } else if (r.status === 'Unfit' || r.status === 'Quarantine') {
        overdue += 1;
      } else {
        current += 1;
      }
    }
    return { currentCount: current, attentionCount: attention, overdueCount: overdue };
  }, [horseRecords]);

  // Reminders for current horse
  const horseReminders = useMemo(() => {
    if (!currentHorse?.HorseID) return [];
    return reminders.filter((rem) => {
      return (
        String(rem.horseId) === String(currentHorse.HorseID) ||
        String(rem.horseId) === `H-0${currentHorse.HorseID}` ||
        String(rem.horseId) === `H-${currentHorse.HorseID}`
      );
    });
  }, [reminders, currentHorse]);

  // Đánh giá thời hạn kiểm tra y tế của ngựa hiện tại (Requirement 4)
  const horseCheckStatus = useMemo(() => {
    const today = dayjs();
    return MANDATORY_TRANSPORT_CHECKS.map((check) => {
      const matchedRecords = horseRecords.filter((r) => {
        const typeStr = (r.recordType || '').toLowerCase();
        const checkTypeStr = check.recordType.toLowerCase();
        return (
          typeStr.includes(check.key.toLowerCase()) ||
          typeStr.includes(checkTypeStr) ||
          (check.key === 'CVI' && (typeStr.includes('cvi') || typeStr.includes('kiểm dịch'))) ||
          (check.key === 'COGGINS' && (typeStr.includes('coggins') || typeStr.includes('eia') || typeStr.includes('máu'))) ||
          (check.key === 'VACCINE' && (typeStr.includes('vaccin') || typeStr.includes('tiêm'))) ||
          (check.key === 'DEWORMING' && (typeStr.includes('deworm') || typeStr.includes('tẩy giun'))) ||
          (check.key === 'WELLNESS' && (typeStr.includes('well') || typeStr.includes('lâm sàng') || typeStr.includes('fit')))
        );
      });

      matchedRecords.sort((a, b) => new Date(b.date || b.createdAt || 0) - new Date(a.date || a.createdAt || 0));
      const latest = matchedRecords[0];

      if (!latest) {
        return {
          ...check,
          status: 'MISSING',
          message: 'Chưa có hồ sơ kiểm tra này. Bắt buộc nộp bổ sung!',
          record: null,
          expirationDate: null,
        };
      }

      let isExpired = false;
      let expDateStr = latest.expirationDate;
      if (expDateStr) {
        isExpired = dayjs(expDateStr).isBefore(today, 'day');
      } else if (latest.date) {
        const autoExp = dayjs(latest.date).add(check.validityDays, 'day');
        expDateStr = autoExp.format('YYYY-MM-DD');
        isExpired = autoExp.isBefore(today, 'day');
      }

      if (isExpired) {
        return {
          ...check,
          status: 'EXPIRED',
          message: `Đã hết hạn vào ngày ${dayjs(expDateStr).format('DD/MM/YYYY')}. Bắt buộc nộp hồ sơ mới!`,
          record: latest,
          expirationDate: expDateStr,
        };
      }

      return {
        ...check,
        status: 'VALID',
        message: `Còn hiệu lực đến ngày ${dayjs(expDateStr).format('DD/MM/YYYY')} (Miễn nộp lại)`,
        record: latest,
        expirationDate: expDateStr,
      };
    });
  }, [horseRecords]);

  const expiredOrMissingChecks = useMemo(() => {
    return horseCheckStatus.filter((c) => c.status === 'EXPIRED' || c.status === 'MISSING');
  }, [horseCheckStatus]);

  const validChecks = useMemo(() => {
    return horseCheckStatus.filter((c) => c.status === 'VALID');
  }, [horseCheckStatus]);


  // Markings derived per selected horse
  const markings = useMemo(() => {
    // Reference storageVersion to trigger re-computation when saved
    if (storageVersion < 0) return null;
    return (
      getHorseMarkings(selectedHorseId) || {
        coatColor: currentHorse?.Color || 'Dark Bay',
        blaze: currentHorse?.Name === 'Thunder' ? 'Star on forehead' : 'Blaze along muzzle',
        legMarkings: currentHorse?.Name === 'Thunder' ? 'White sock left hind' : '2 front socks',
        whorl: 'Centered between eyes',
        brands: 'None',
        scars: 'None observed',
        additionalDescription: currentHorse?.SpecialCareRequirements || '',
      }
    );
  }, [selectedHorseId, currentHorse, storageVersion]);

  // Angle photos derived per selected horse
  const anglePhotos = useMemo(() => {
    if (storageVersion < 0) return {};
    return getHorsePhotos(selectedHorseId) || {};
  }, [selectedHorseId, storageVersion]);

  // Save Markings handler
  const handleSaveMarkings = (values) => {
    saveHorseMarkings(selectedHorseId, values);
    saveStoredMarkings(selectedHorseId, values);
    setStorageVersion((v) => v + 1);
    message.success('Physical markings & description updated successfully!');
  };

  // Upload Photo Angle handler
  const handlePhotoUpload = (angleKey) => {
    const mockImages = {
      frontFace: 'https://images.unsplash.com/photo-1534447677768-be436bb09401?w=600&auto=format&fit=crop',
      leftSide: 'https://images.unsplash.com/photo-1553284965-83fd3e82fa5a?w=600&auto=format&fit=crop',
      rightSide: 'https://images.unsplash.com/photo-1598974357801-cbca100e6571?w=600&auto=format&fit=crop',
      rear: 'https://images.unsplash.com/photo-1566251037378-5e04e3bec343?w=600&auto=format&fit=crop',
      foreheadWhorl: 'https://images.unsplash.com/photo-1578328819058-b69f3a3b0f6b?w=600&auto=format&fit=crop',
      markingsScars: 'https://images.unsplash.com/photo-1535083783855-76ae62b2914e?w=600&auto=format&fit=crop',
    };

    const updated = {
      ...anglePhotos,
      [angleKey]: mockImages[angleKey] || 'https://images.unsplash.com/photo-1534447677768-be436bb09401?w=600&auto=format&fit=crop',
    };
    saveHorsePhotos(selectedHorseId, updated);
    saveStoredAnglePhotos(selectedHorseId, updated);
    setStorageVersion((v) => v + 1);
    message.success(`Photo for ${angleKey} uploaded successfully!`);
  };

  const handleRemovePhoto = (angleKey) => {
    const updated = { ...anglePhotos };
    delete updated[angleKey];
    saveHorsePhotos(selectedHorseId, updated);
    saveStoredAnglePhotos(selectedHorseId, updated);
    setStorageVersion((v) => v + 1);
    message.info('Photo removed.');
  };

  // Open Add Vet Record Modal cleanly
  const handleOpenAddRecordModal = (preselectedType) => {
    setEditingRecord(null);
    recordForm.resetFields();
    setAttachmentList([]);
    let defaultType = preselectedType || RECORD_TYPE_OPTIONS[0].value;
    if (!preselectedType && recordCategory && recordCategory !== 'All') {
      const matched = RECORD_TYPE_OPTIONS.find((opt) => {
        const optStr = opt.value.toLowerCase();
        const catStr = recordCategory.toLowerCase();
        if (catStr === 'vaccinations') return optStr.includes('vaccin') || optStr.includes('tiêm');
        if (catStr === 'health cert') return optStr.includes('cvi') || optStr.includes('kiểm dịch');
        if (catStr === 'coggins') return optStr.includes('coggins') || optStr.includes('eia');
        if (catStr === 'deworming') return optStr.includes('deworm') || optStr.includes('tẩy');
        if (catStr === 'dental') return optStr.includes('dent') || optStr.includes('răng');
        if (catStr === 'farrier') return optStr.includes('farrier') || optStr.includes('móng');
        return optStr.includes(catStr);
      });
      if (matched) defaultType = matched.value;
    }
    const cleanSuggestedTitle = defaultType.replace(/\(.*?\)/g, '').trim();
    const validityDays = RECORD_TYPE_VALIDITY_DAYS[defaultType] || 90;
    const today = dayjs();
    const suggestedExp = today.add(validityDays, 'day');

    recordForm.setFieldsValue({
      recordType: defaultType,
      title: cleanSuggestedTitle,
      date: today,
      expirationDate: suggestedExp,
      nextDueDate: suggestedExp,
      providerName: '',
      providerContact: '',
      lotNumber: '',
      resultFinding: '',
      accessionNumber: '',
      issuingState: '',
      notes: '',
    });
    setSelectedRecordType(defaultType);
    setIsRecordModalOpen(true);
  };

  // Open Edit Vet Record Modal (Requirement 2)
  const handleOpenEditRecordModal = (rec) => {
    setEditingRecord(rec);
    const mappedAttachments = (rec.attachments || []).map((att, idx) => ({
      uid: `att-${idx}`,
      name: typeof att === 'string' ? att : att.name,
      status: 'done',
    }));
    setAttachmentList(mappedAttachments);
    setSelectedRecordType(rec.recordType || RECORD_TYPE_OPTIONS[0].value);
    recordForm.setFieldsValue({
      recordType: rec.recordType || RECORD_TYPE_OPTIONS[0].value,
      title: rec.title,
      date: rec.date ? dayjs(rec.date) : dayjs(),
      expirationDate: rec.expirationDate ? dayjs(rec.expirationDate) : null,
      nextDueDate: rec.nextDueDate ? dayjs(rec.nextDueDate) : null,
      providerName: rec.providerName || '',
      providerContact: rec.providerContact || '',
      lotNumber: rec.lotNumber || '',
      resultFinding: rec.resultFinding || '',
      accessionNumber: rec.accessionNumber || '',
      issuingState: rec.issuingState || '',
      notes: rec.notes || '',
    });
    setIsRecordModalOpen(true);
  };

  // Add or Edit Vet Record handler
  const handleAddRecord = (values) => {
    const rawTitle = (values.title || '').trim();
    if (!rawTitle) {
      message.error('Vui lòng nhập tên/tiêu đề hồ sơ thú y!');
      return;
    }
    const trimmedTitle = rawTitle.toLowerCase();
    const isDuplicateTitle = horseRecords.some(
      (r) => (!editingRecord || r.id !== editingRecord.id) && (r.title || '').trim().toLowerCase() === trimmedTitle,
    );
    if (isDuplicateTitle) {
      message.error(
        `Ngựa "${currentHorse.Name}" đã có hồ sơ mang tên "${rawTitle}". Vui lòng đặt tên phân biệt cho hồ sơ này!`,
      );
      return;
    }

    // Check duplicate attachment file names for this horse
    const existingFileNames = horseRecords
      .filter((r) => !editingRecord || r.id !== editingRecord.id)
      .flatMap((r) => r.attachments || []);
    const duplicateAttachment = attachmentList.find((f) => existingFileNames.includes(f.name));
    if (duplicateAttachment) {
      message.error(
        `Tệp "${duplicateAttachment.name}" đã tồn tại trong hồ sơ của ngựa "${currentHorse.Name}". Vui lòng đổi tên tệp trước khi lưu!`,
      );
      return;
    }

    const formattedDate = values.date
      ? (typeof values.date === 'string' ? values.date : dayjs(values.date).format('YYYY-MM-DD'))
      : dayjs().format('YYYY-MM-DD');
    const formattedExp = values.expirationDate
      ? (typeof values.expirationDate === 'string' ? values.expirationDate : dayjs(values.expirationDate).format('YYYY-MM-DD'))
      : '';
    const formattedDue = values.nextDueDate
      ? (typeof values.nextDueDate === 'string' ? values.nextDueDate : dayjs(values.nextDueDate).format('YYYY-MM-DD'))
      : '';

    // Calculate status dynamically based on expiration date
    let calcStatus = 'Valid';
    if (formattedExp) {
      const now = new Date().getTime();
      const expTime = new Date(formattedExp).getTime();
      const diffDays = Math.ceil((expTime - now) / (1000 * 60 * 60 * 24));
      if (diffDays < 0) {
        calcStatus = 'Expired';
      } else if (diffDays <= 30) {
        calcStatus = 'Attention';
      } else {
        calcStatus = 'Valid';
      }
    }

    // Ensure there is always a PDF attachment (Requirement 2)
    let finalAttachments = attachmentList.map((f) => f.name || f);
    if (finalAttachments.length === 0) {
      const recType = values.recordType || selectedRecordType || 'Wellness Exam';
      const mappedDoc = mapRecordTypeToDocType(recType);
      finalAttachments = [`Mẫu_Chuẩn_${mappedDoc}.pdf`];
    }

    const recordPayload = {
      horseId: currentHorse.HorseID,
      horseName: currentHorse.Name,
      recordType: values.recordType || selectedRecordType || 'Wellness Exam',
      title: rawTitle,
      date: formattedDate,
      expirationDate: formattedExp,
      nextDueDate: formattedDue,
      providerName: (values.providerName || '').trim(),
      providerContact: (values.providerContact || '').trim(),
      lotNumber: (values.lotNumber || '').trim(),
      resultFinding: (values.resultFinding || '').trim(),
      accessionNumber: (values.accessionNumber || '').trim(),
      issuingState: (values.issuingState || '').trim(),
      notes: (values.notes || '').trim(),
      attachments: finalAttachments,
      status: calcStatus,
    };

    if (editingRecord) {
      updateStoredVetRecord(editingRecord.id, recordPayload);
      message.success('Hồ sơ thú y đã được cập nhật thành công!');
    } else {
      addStoredVetRecord(recordPayload);
      message.success('Hồ sơ thú y đã được thêm thành công!');
    }

    setIsRecordModalOpen(false);
    setEditingRecord(null);
    recordForm.resetFields();
    setAttachmentList([]);
  };

  // Delete Record handler
  const handleDeleteRecord = (id) => {
    deleteStoredVetRecord(id);
    message.success('Đã xóa hồ sơ thú y.');
  };

  // Add Reminder handler
  const handleAddReminder = (values) => {
    const reminderPayload = {
      horseId: currentHorse.HorseID,
      title: values.title,
      type: values.category || 'Vaccination',
      dueDate: values.dueDate || 'In 14 days',
      repeat: values.repeat || 'None',
      notes: values.notes || '',
    };
    addStoredReminder(reminderPayload);
    setIsReminderModalOpen(false);
    reminderForm.resetFields();
    message.success('Lời nhắc mới đã được tạo thành công!');
  };

  const handleDeleteReminder = (id) => {
    deleteStoredReminder(id);
    message.success('Đã xóa lời nhắc.');
  };

  // Print Emergency Card
  const handlePrintCard = () => {
    window.print();
  };

  // Travel Ready Checklist status calculation
  const hasCoggins = horseRecords.some((r) =>
    (r.recordType || '').toLowerCase().includes('coggins') || (r.title || '').toLowerCase().includes('coggins')
  );
  const hasCVI = horseRecords.some((r) =>
    (r.recordType || '').toLowerCase().includes('health') || (r.title || '').toLowerCase().includes('cvi') || (r.title || '').toLowerCase().includes('kiểm dịch')
  );
  const hasVaccines = horseRecords.some((r) =>
    (r.recordType || '').toLowerCase().includes('vaccin') || (r.title || '').toLowerCase().includes('influenza')
  );
  const isTravelReady = hasCoggins && hasCVI && hasVaccines && currentHorse.HealthStatus !== 'Critical';

  // Photo angle completion count
  const uploadedPhotosCount = Object.keys(anglePhotos).length;

  return (
    <div style={{ maxWidth: 1200, margin: '0 auto', padding: '16px 24px' }}>
      {/* 1. Header with Stethoscope Badge */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 16 }}>
        <div
          style={{
            width: 44,
            height: 44,
            borderRadius: 12,
            backgroundColor: '#EFF6FF',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#2563EB',
            fontSize: 22,
          }}
        >
          <MedicineBoxOutlined />
        </div>
        <div>
          <h1 style={{ margin: 0, fontSize: 24, fontWeight: 700, color: '#1E293B', lineHeight: 1.2 }}>
            Vet Records
          </h1>
          <p style={{ margin: '4px 0 0 0', fontSize: 13, color: '#64748B' }}>
            Health records, travel readiness, and care contacts for your horses
          </p>
        </div>
      </div>

      {/* 2. Disclaimer Banner */}
      <div
        style={{
          backgroundColor: '#1E293B',
          borderRadius: 10,
          padding: '12px 18px',
          display: 'flex',
          alignItems: 'center',
          gap: 12,
          marginBottom: 20,
        }}
      >
        <AlertOutlined style={{ color: '#F59E0B', fontSize: 16, flexShrink: 0 }} />
        <span style={{ color: '#CBD5E1', fontSize: 13, lineHeight: 1.4 }}>
          <strong>Disclaimer:</strong> IET does not provide veterinary diagnosis or treatment. Records and reminders are informational only. Contact a licensed veterinarian for medical advice.
        </span>
      </div>

      {/* 3. Horse Selector Bar / Empty State */}
      {horses.length === 0 ? (
        <Card
          style={{
            borderRadius: 16,
            textAlign: 'center',
            padding: '50px 20px',
            marginBottom: 30,
            border: '1px solid #e2e8f0',
          }}
        >
          <Empty
            description={
              <span style={{ color: '#64748b', fontSize: 15 }}>
                Chưa có hồ sơ cá thể ngựa nào thuộc tài khoản của bạn. Vui lòng thêm ngựa để theo dõi và quản lý hồ sơ thú y.
              </span>
            }
          >
            <Button
              type="primary"
              size="large"
              icon={<PlusOutlined />}
              onClick={() => navigate(ROUTES.CUSTOMER_HORSE_NEW)}
              style={{
                backgroundColor: '#F59E0B',
                borderColor: '#F59E0B',
                fontWeight: 600,
                borderRadius: 8,
                marginTop: 12,
              }}
            >
              Thêm hồ sơ ngựa mới
            </Button>
          </Empty>
        </Card>
      ) : (
        <>
          <Card
            styles={{ body: { padding: '14px 20px' } }}
            style={{
              borderRadius: 12,
              border: '1px solid #F1F5F9',
              boxShadow: '0 1px 3px rgba(0,0,0,0.03)',
              marginBottom: 20,
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 14, flexWrap: 'wrap' }}>
              <span style={{ fontWeight: 600, color: '#334155', fontSize: 14 }}>Select Horse:</span>
          <Select
            value={Number(selectedHorseId)}
            onChange={(val) => setSelectedHorseId(val)}
            style={{ minWidth: 260 }}
            size="large"
            options={horses.map((h) => ({
              value: Number(h.HorseID),
              label: `${h.Name} · ${h.Breed || 'Racehorse'}`,
            }))}
          />
        </div>
      </Card>

      {/* 4. Tab Navigation Pills */}
      <div
        style={{
          display: 'flex',
          gap: 8,
          overflowX: 'auto',
          paddingBottom: 4,
          marginBottom: 20,
        }}
      >
        {TABS.map((tab) => {
          const isActive = activeTab === tab.key;
          return (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              style={{
                backgroundColor: isActive ? '#334155' : 'transparent',
                color: isActive ? '#FFFFFF' : '#475569',
                border: 'none',
                borderRadius: 8,
                padding: '8px 18px',
                fontSize: 13.5,
                fontWeight: isActive ? 600 : 500,
                cursor: 'pointer',
                transition: 'all 0.2s ease',
                whiteSpace: 'nowrap',
              }}
            >
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* 5. TAB CONTENTS */}

      {/* === TAB 1: OVERVIEW === */}
      {activeTab === 'overview' && (
        <Space direction="vertical" size={20} style={{ width: '100%' }}>
          {/* Status Metric Cards */}
          <Row gutter={16}>
            <Col xs={24} sm={8}>
              <Card
                styles={{ body: { padding: '24px 20px', textAlign: 'center' } }}
                style={{ borderRadius: 12, border: '1px solid #E2E8F0' }}
              >
                <div style={{ fontSize: 36, fontWeight: 700, color: '#10B981', lineHeight: 1 }}>
                  {currentCount}
                </div>
                <div style={{ fontSize: 13, color: '#64748B', marginTop: 8, fontWeight: 500 }}>
                  Current
                </div>
              </Card>
            </Col>
            <Col xs={24} sm={8}>
              <Card
                styles={{ body: { padding: '24px 20px', textAlign: 'center' } }}
                style={{ borderRadius: 12, border: '1px solid #E2E8F0' }}
              >
                <div style={{ fontSize: 36, fontWeight: 700, color: '#F59E0B', lineHeight: 1 }}>
                  {attentionCount}
                </div>
                <div style={{ fontSize: 13, color: '#64748B', marginTop: 8, fontWeight: 500 }}>
                  Attention Needed
                </div>
              </Card>
            </Col>
            <Col xs={24} sm={8}>
              <Card
                styles={{ body: { padding: '24px 20px', textAlign: 'center' } }}
                style={{ borderRadius: 12, border: '1px solid #E2E8F0' }}
              >
                <div style={{ fontSize: 36, fontWeight: 700, color: '#EF4444', lineHeight: 1 }}>
                  {overdueCount}
                </div>
                <div style={{ fontSize: 13, color: '#64748B', marginTop: 8, fontWeight: 500 }}>
                  Overdue
                </div>
              </Card>
            </Col>
          </Row>

          {/* Horse Identity Card */}
          <Card
            title={
              <span style={{ fontSize: 16, fontWeight: 700, color: '#1E293B' }}>
                Horse Identity
              </span>
            }
            style={{ borderRadius: 12, border: '1px solid #E2E8F0' }}
            styles={{ body: { padding: 24 } }}
          >
            <div style={{ display: 'flex', gap: 24, alignItems: 'flex-start' }}>
              <div
                style={{
                  width: 64,
                  height: 64,
                  borderRadius: 16,
                  backgroundColor: '#F1F5F9',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: 28,
                  color: '#94A3B8',
                  flexShrink: 0,
                }}
              >
                <MedicineBoxOutlined />
              </div>
              <div style={{ flex: 1 }}>
                <Row gutter={[24, 16]}>
                  <Col xs={24} sm={8}>
                    <div style={{ fontSize: 12, color: '#64748B' }}>Name</div>
                    <div style={{ fontSize: 14.5, fontWeight: 600, color: '#1E293B' }}>
                      {currentHorse.Name}
                    </div>
                  </Col>
                  <Col xs={24} sm={8}>
                    <div style={{ fontSize: 12, color: '#64748B' }}>Breed</div>
                    <div style={{ fontSize: 14.5, fontWeight: 600, color: '#1E293B' }}>
                      {currentHorse.Breed || 'Akhal-Teke'}
                    </div>
                  </Col>
                  <Col xs={24} sm={8}>
                    <div style={{ fontSize: 12, color: '#64748B' }}>Gender</div>
                    <div style={{ fontSize: 14.5, fontWeight: 600, color: '#1E293B', textTransform: 'uppercase' }}>
                      {currentHorse.Gender || 'GELDING'}
                    </div>
                  </Col>

                  <Col xs={24} sm={8}>
                    <div style={{ fontSize: 12, color: '#64748B' }}>Color</div>
                    <div style={{ fontSize: 14.5, fontWeight: 600, color: '#1E293B' }}>
                      {currentHorse.Color || 'Brown'}
                    </div>
                  </Col>
                  <Col xs={24} sm={8}>
                    <div style={{ fontSize: 12, color: '#64748B' }}>Age</div>
                    <div style={{ fontSize: 14.5, fontWeight: 600, color: '#1E293B' }}>
                      {currentHorse.Age || '5yr'}
                    </div>
                  </Col>
                  <Col xs={24} sm={8}>
                    <div style={{ fontSize: 12, color: '#64748B' }}>Weight</div>
                    <div style={{ fontSize: 14.5, fontWeight: 600, color: '#1E293B' }}>
                      {currentHorse.Weight || '1100 lbs'}
                    </div>
                  </Col>

                  <Col xs={24} sm={8}>
                    <div style={{ fontSize: 12, color: '#64748B' }}>Microchip</div>
                    <div style={{ fontSize: 14, fontWeight: 500, color: '#334155' }}>
                      {currentHorse.MicrochipNumber || '123456789000000'}
                    </div>
                  </Col>
                  <Col xs={24} sm={8}>
                    <div style={{ fontSize: 12, color: '#64748B' }}>Registration</div>
                    <div style={{ fontSize: 14, fontWeight: 500, color: '#334155' }}>
                      {currentHorse.PassportNumber || '122123'}
                    </div>
                  </Col>
                  <Col xs={24} sm={8}>
                    <div style={{ fontSize: 12, color: '#64748B' }}>Transport Risk</div>
                    <div style={{ marginTop: 2 }}>
                      <RiskBadge risk={calculateHorseRisk(currentHorse)} />
                    </div>
                  </Col>
                </Row>
              </div>
            </div>
          </Card>
        </Space>
      )}

      {/* === TAB 2: RECORDS === */}
      {activeTab === 'records' && (
        <Space direction="vertical" size={20} style={{ width: '100%' }}>
          {/* Sub-filter row with + Add Record button */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              flexWrap: 'wrap',
              gap: 12,
            }}
          >
            <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
              {RECORD_CATEGORIES.map((cat) => {
                const isSelected = recordCategory === cat.key;
                return (
                  <button
                    key={cat.key}
                    onClick={() => setRecordCategory(cat.key)}
                    style={{
                      backgroundColor: isSelected ? '#334155' : '#FFFFFF',
                      color: isSelected ? '#FFFFFF' : '#475569',
                      border: `1px solid ${isSelected ? '#334155' : '#E2E8F0'}`,
                      borderRadius: 20,
                      padding: '5px 14px',
                      fontSize: 12.5,
                      fontWeight: isSelected ? 600 : 500,
                      cursor: 'pointer',
                      transition: 'all 0.15s ease',
                    }}
                  >
                    {cat.label}
                  </button>
                );
              })}
            </div>
            <Space wrap>
              <Button
                type="primary"
                icon={<PlusOutlined />}
                onClick={() => handleOpenAddRecordModal()}
                style={{
                  backgroundColor: '#F59E0B',
                  borderColor: '#F59E0B',
                  borderRadius: 20,
                  fontWeight: 600,
                  boxShadow: 'none',
                }}
              >
                Add Record
              </Button>
            </Space>
          </div>

          {/* Validity & Expiration Warning Banner (Requirement 4) */}
          <div style={{ marginBottom: 16 }}>
            {expiredOrMissingChecks.length > 0 && (
              <Alert
                type="warning"
                showIcon
                style={{
                  borderRadius: 10,
                  border: '1px solid #FCD34D',
                  backgroundColor: '#FFFBEB',
                  marginBottom: 12,
                }}
                message={
                  <span style={{ fontWeight: 700, color: '#92400E', fontSize: 14 }}>
                    ⚠️ Cảnh báo kiểm tra y tế & kiểm dịch vận chuyển: Ngựa &ldquo;{currentHorse.Name || 'Ngựa đua'}&rdquo; có {expiredOrMissingChecks.length} mục kiểm tra cần nộp hoặc đã hết hạn hiệu lực
                  </span>
                }
                description={
                  <div style={{ marginTop: 8 }}>
                    <div style={{ fontSize: 13, color: '#78350F', marginBottom: 8 }}>
                      Theo quy định IATA / FEI, các mục y tế sau bắt buộc phải còn hạn hiệu lực trước ngày khởi hành. Vui lòng nộp hoặc gia hạn các mục dưới đây:
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                      {expiredOrMissingChecks.map((check) => (
                        <div
                          key={check.key}
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'space-between',
                            backgroundColor: '#FFFFFF',
                            border: '1px solid #FED7AA',
                            padding: '8px 14px',
                            borderRadius: 8,
                            flexWrap: 'wrap',
                            gap: 8,
                          }}
                        >
                          <Space size={8}>
                            <Tag color={check.status === 'EXPIRED' ? 'error' : 'orange'} style={{ fontWeight: 700, borderRadius: 6 }}>
                              {check.status === 'EXPIRED' ? '⚠️ Đã hết hạn' : '❗ Chưa có hồ sơ'}
                            </Tag>
                            <span style={{ fontWeight: 600, color: '#1E293B', fontSize: 13.5 }}>
                              {check.name}
                            </span>
                            <span style={{ fontSize: 12, color: '#64748B' }}>
                              ({check.message})
                            </span>
                          </Space>
                          <Button
                            type="primary"
                            size="small"
                            icon={<PlusOutlined />}
                            onClick={() => handleOpenAddRecordModal(check.recordType)}
                            style={{
                              backgroundColor: '#F59E0B',
                              borderColor: '#F59E0B',
                              fontWeight: 600,
                              borderRadius: 6,
                            }}
                          >
                            + Nộp / Cập nhật ngay
                          </Button>
                        </div>
                      ))}
                    </div>
                  </div>
                }
              />
            )}

            {validChecks.length > 0 && (
              <div
                style={{
                  backgroundColor: '#F0FDF4',
                  border: '1px solid #BBF7D0',
                  borderRadius: 10,
                  padding: '10px 16px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  flexWrap: 'wrap',
                  gap: 10,
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <CheckCircleOutlined style={{ color: '#16A34A', fontSize: 16 }} />
                  <span style={{ fontSize: 13, color: '#166534', fontWeight: 600 }}>
                    Các mục kiểm tra còn thời hạn hiệu lực (Được miễn nộp lại):
                  </span>
                </div>
                <Space wrap size={6}>
                  {validChecks.map((v) => (
                    <Tag
                      key={v.key}
                      color="success"
                      style={{ borderRadius: 6, fontSize: 12, fontWeight: 600, padding: '2px 8px' }}
                    >
                      ✓ {v.name}: Hạn đến {v.expirationDate ? dayjs(v.expirationDate).format('DD/MM/YYYY') : 'Hợp lệ'}
                    </Tag>
                  ))}
                </Space>
              </div>
            )}
          </div>

          {/* Records List or Empty State */}
          {filteredRecords.length === 0 ? (
            <Card
              styles={{ body: { padding: '60px 20px', textAlign: 'center' } }}
              style={{ borderRadius: 12, border: '1px solid #E2E8F0' }}
            >
              <div
                style={{
                  width: 52,
                  height: 52,
                  borderRadius: 14,
                  backgroundColor: '#F1F5F9',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  margin: '0 auto 16px auto',
                  color: '#475569',
                  fontSize: 24,
                }}
              >
                <FileTextOutlined />
              </div>
              <h3 style={{ margin: 0, fontSize: 16, fontWeight: 700, color: '#1E293B' }}>
                No records found!
              </h3>
              <p style={{ margin: '6px 0 0 0', fontSize: 13, color: '#64748B' }}>
                Add vet records to track vaccinations, wellness exams, Coggins tests, and more.
              </p>
            </Card>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              {filteredRecords.map((r) => (
                <Card
                  key={r.id}
                  style={{ borderRadius: 12, border: '1px solid #E2E8F0' }}
                  styles={{ body: { padding: '18px 22px' } }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 12 }}>
                    <div style={{ flex: 1, minWidth: 260 }}>
                      <Space size={8} style={{ marginBottom: 6 }} wrap>
                        <Tag color="blue" style={{ borderRadius: 6, fontWeight: 700 }}>
                          {r.recordType || 'General'}
                        </Tag>
                        {r.status && (
                          <Tag
                            color={
                              r.status === 'Valid' || r.status === 'Passed'
                                ? 'success'
                                : r.status === 'Expired' || r.status === 'Unfit'
                                ? 'error'
                                : 'warning'
                            }
                            style={{ borderRadius: 6, fontWeight: 600 }}
                          >
                            {r.status === 'Valid' ? '✓ Hợp lệ' : r.status === 'Expired' ? '⚠️ Hết hạn' : r.status}
                          </Tag>
                        )}
                        <span style={{ fontSize: 12.5, color: '#64748B', fontWeight: 500 }}>
                          <CalendarOutlined style={{ marginRight: 4, color: '#3B82F6' }} />
                          Ngày thực hiện: <strong>{r.date}</strong>
                        </span>
                        {r.expirationDate && (
                          <span style={{ fontSize: 12.5, color: '#D97706', fontWeight: 500 }}>
                            <ClockCircleOutlined style={{ marginRight: 4 }} />
                            Hết hạn: <strong>{r.expirationDate}</strong>
                          </span>
                        )}
                        {r.nextDueDate && (
                          <span style={{ fontSize: 12.5, color: '#2563EB', fontWeight: 500 }}>
                            <BellOutlined style={{ marginRight: 4 }} />
                            Tái khám: <strong>{r.nextDueDate}</strong>
                          </span>
                        )}
                      </Space>

                      <h4 style={{ margin: '4px 0 8px 0', fontSize: 16, fontWeight: 800, color: '#0F172A' }}>
                        {r.title}
                      </h4>

                      {/* Thông tin bác sĩ / cơ sở thú y */}
                      {r.providerName && (
                        <p style={{ margin: '3px 0', fontSize: 13, color: '#334155' }}>
                          <strong style={{ color: '#475569' }}>Bác sĩ / Cơ sở thú y:</strong> {r.providerName}
                          {r.providerContact ? ` · Liên hệ: ${r.providerContact}` : ''}
                        </p>
                      )}

                      {/* User Request 3: Bỏ Kết quả / Đánh giá khỏi card */}

                      {/* Số lô / Mã lưu trữ / Cơ quan cấp */}
                      {(r.lotNumber || r.accessionNumber || r.issuingState) && (
                        <p style={{ margin: '3px 0', fontSize: 12.5, color: '#64748B' }}>
                          {r.lotNumber ? <span><strong>Số lô (Lot):</strong> {r.lotNumber} </span> : null}
                          {r.accessionNumber ? <span>{r.lotNumber ? '· ' : ''}<strong>Mã lưu trữ:</strong> {r.accessionNumber} </span> : null}
                          {r.issuingState ? <span>{(r.lotNumber || r.accessionNumber) ? '· ' : ''}<strong>Cơ quan cấp:</strong> {r.issuingState}</span> : null}
                        </p>
                      )}

                      {/* Ghi chú */}
                      {r.notes && (
                        <p style={{ margin: '5px 0 0 0', fontSize: 12.5, color: '#64748B', fontStyle: 'italic' }}>
                          <strong>Ghi chú:</strong> {r.notes}
                        </p>
                      )}

                      {/* Tệp đính kèm PDF (User Request 2) */}
                      {(() => {
                        const atts = (r.attachments && r.attachments.length > 0)
                          ? r.attachments
                          : [`Hồ_sơ_${mapRecordTypeToDocType(r.recordType || r.title)}.pdf`];
                        return (
                          <div style={{ marginTop: 8, display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                            {atts.map((att, idx) => (
                              <Tag
                                key={idx}
                                icon={<FilePdfOutlined />}
                                color="processing"
                                style={{
                                  borderRadius: 6,
                                  fontSize: 12,
                                  cursor: 'pointer',
                                  padding: '2px 8px',
                                  fontWeight: 500,
                                }}
                                onClick={() => {
                                  const mappedDocType = mapRecordTypeToDocType(r.recordType || r.title);
                                  setTemplateModal({
                                    open: true,
                                    docType: mappedDocType,
                                    title: typeof att === 'string' ? att : `Hồ sơ PDF: ${r.title}`,
                                  });
                                }}
                              >
                                {typeof att === 'string' ? att : att.name} <EyeOutlined style={{ marginLeft: 4 }} />
                              </Tag>
                            ))}
                          </div>
                        );
                      })()}
                    </div>
                    <Space>
                      <Button
                        size="small"
                        icon={<EditOutlined />}
                        onClick={() => handleOpenEditRecordModal(r)}
                        style={{
                          borderRadius: 6,
                          fontSize: 12,
                          borderColor: '#3B82F6',
                          color: '#2563EB',
                          fontWeight: 600,
                        }}
                      >
                        Sửa
                      </Button>
                      <Button
                        size="small"
                        icon={<FilePdfOutlined />}
                        onClick={() => {
                          const mappedDocType = mapRecordTypeToDocType(r.recordType || r.title);
                          setTemplateModal({
                            open: true,
                            docType: mappedDocType,
                            title: `Hồ sơ PDF: ${r.title || r.recordType}`,
                          });
                        }}
                        style={{
                          borderRadius: 6,
                          fontSize: 12,
                          borderColor: '#F59E0B',
                          color: '#B45309',
                          fontWeight: 600,
                        }}
                      >
                        Xem PDF
                      </Button>
                      <Popconfirm
                        title="Delete Vet Record?"
                        description="Are you sure you want to remove this record?"
                        onConfirm={() => handleDeleteRecord(r.id)}
                        okText="Yes"
                        cancelText="No"
                      >
                        <Button type="text" danger icon={<DeleteOutlined />} size="small" />
                      </Popconfirm>
                    </Space>
                  </div>
                </Card>
              ))}
            </div>
          )}
        </Space>
      )}

      {/* === TAB 3: DIGITAL DOSSIER (FIGMA FLOW 2) === */}
      {activeTab === 'dossier' && <CustomerDossierPanel horseId={selectedHorseId} />}

      {/* === TAB 4: TRAVEL READY === */}
      {activeTab === 'travelReady' && (
        <Space direction="vertical" size={20} style={{ width: '100%' }}>
          {/* Action Required Alert Banner */}
          <div
            style={{
              backgroundColor: isTravelReady ? '#ECFDF5' : '#FEF3C7',
              border: `1px solid ${isTravelReady ? '#A7F3D0' : '#FDE68A'}`,
              borderRadius: 12,
              padding: '18px 24px',
              display: 'flex',
              alignItems: 'center',
              gap: 16,
            }}
          >
            <div style={{ color: isTravelReady ? '#059669' : '#B45309', fontSize: 26, flexShrink: 0 }}>
              {isTravelReady ? <CheckCircleOutlined /> : <AlertOutlined />}
            </div>
            <div>
              <div style={{ fontSize: 16, fontWeight: 700, color: isTravelReady ? '#065F46' : '#92400E' }}>
                {isTravelReady ? 'Travel Ready Compliant' : 'Action Required'}
              </div>
              <div style={{ fontSize: 13, color: isTravelReady ? '#047857' : '#B45309', marginTop: 2 }}>
                {isTravelReady
                  ? 'All required veterinary documentation and compliance checks are active and verified.'
                  : 'One or more required documents are missing, expired, or expiring soon.'}
              </div>
            </div>
          </div>

          {/* Document Checklist Card */}
          <Card
            title={<span style={{ fontWeight: 700, color: '#1E293B' }}>Document Checklist</span>}
            style={{ borderRadius: 12, border: '1px solid #E2E8F0' }}
            styles={{ body: { padding: '12px 24px' } }}
          >
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {/* Row 1: Coggins */}
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  backgroundColor: '#F8FAFC',
                  padding: '14px 18px',
                  borderRadius: 8,
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                  {hasCoggins ? (
                    <CheckCircleOutlined style={{ color: '#10B981', fontSize: 18 }} />
                  ) : (
                    <CloseCircleOutlined style={{ color: '#64748B', fontSize: 18 }} />
                  )}
                  <span style={{ fontSize: 13.5, fontWeight: 500, color: '#1E293B' }}>
                    Coggins / EIA Test
                  </span>
                </div>
                <Tag
                  style={{
                    borderRadius: 20,
                    padding: '2px 14px',
                    borderColor: hasCoggins ? '#86EFAC' : '#E2E8F0',
                    color: hasCoggins ? '#15803D' : '#64748B',
                    backgroundColor: hasCoggins ? '#DCFCE7' : '#FFFFFF',
                    fontWeight: 600,
                  }}
                >
                  {hasCoggins ? 'Valid' : 'Missing'}
                </Tag>
              </div>

              {/* Row 2: CVI */}
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  backgroundColor: '#F8FAFC',
                  padding: '14px 18px',
                  borderRadius: 8,
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                  {hasCVI ? (
                    <CheckCircleOutlined style={{ color: '#10B981', fontSize: 18 }} />
                  ) : (
                    <CloseCircleOutlined style={{ color: '#64748B', fontSize: 18 }} />
                  )}
                  <span style={{ fontSize: 13.5, fontWeight: 500, color: '#1E293B' }}>
                    Certificate of Veterinary Inspection
                  </span>
                </div>
                <Tag
                  style={{
                    borderRadius: 20,
                    padding: '2px 14px',
                    borderColor: hasCVI ? '#86EFAC' : '#E2E8F0',
                    color: hasCVI ? '#15803D' : '#64748B',
                    backgroundColor: hasCVI ? '#DCFCE7' : '#FFFFFF',
                    fontWeight: 600,
                  }}
                >
                  {hasCVI ? 'Valid' : 'Missing'}
                </Tag>
              </div>

              {/* Row 3: Core Vaccinations */}
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  backgroundColor: '#F8FAFC',
                  padding: '14px 18px',
                  borderRadius: 8,
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                  {hasVaccines ? (
                    <CheckCircleOutlined style={{ color: '#10B981', fontSize: 18 }} />
                  ) : (
                    <CloseCircleOutlined style={{ color: '#64748B', fontSize: 18 }} />
                  )}
                  <span style={{ fontSize: 13.5, fontWeight: 500, color: '#1E293B' }}>
                    Core Vaccinations
                  </span>
                </div>
                <Tag
                  style={{
                    borderRadius: 20,
                    padding: '2px 14px',
                    borderColor: hasVaccines ? '#86EFAC' : '#E2E8F0',
                    color: hasVaccines ? '#15803D' : '#64748B',
                    backgroundColor: hasVaccines ? '#DCFCE7' : '#FFFFFF',
                    fontWeight: 600,
                  }}
                >
                  {hasVaccines ? 'Valid' : 'Missing'}
                </Tag>
              </div>
            </div>
          </Card>

          {/* Compliance Note */}
          <Card
            style={{ borderRadius: 12, border: '1px solid #E2E8F0' }}
            styles={{ body: { padding: '18px 24px' } }}
          >
            <div style={{ display: 'flex', gap: 14 }}>
              <SafetyCertificateOutlined style={{ fontSize: 20, color: '#2563EB', marginTop: 2 }} />
              <div>
                <div style={{ fontWeight: 700, color: '#1E293B', fontSize: 14 }}>
                  AAEP / USDA Compliance Note
                </div>
                <div style={{ fontSize: 13, color: '#475569', marginTop: 4, lineHeight: 1.5 }}>
                  Interstate transport typically requires a current Coggins (EIA) test and a Certificate of Veterinary Inspection (CVI/Health Certificate). Requirements vary by state. Always verify with your veterinarian and the destination state&apos;s Department of Agriculture before travel.
                </div>
                <div style={{ fontSize: 12, color: '#94A3B8', marginTop: 6 }}>
                  Source: AAEP guidelines and USDA APHIS regulations. This checklist is informational only.
                </div>
              </div>
            </div>
          </Card>
        </Space>
      )}

      {/* === TAB 5: IDENTIFICATION === */}
      {activeTab === 'identification' && (
        <Space direction="vertical" size={20} style={{ width: '100%' }}>
          {/* Card: Physical Markings & Description */}
          <Card
            title={
              <span style={{ fontWeight: 700, color: '#1E293B' }}>
                Physical Markings & Description
              </span>
            }
            style={{ borderRadius: 12, border: '1px solid #E2E8F0' }}
            styles={{ body: { padding: 24 } }}
          >
            <Form
              key={`markings-${selectedHorseId}-${storageVersion}`}
              layout="vertical"
              initialValues={markings}
              onFinish={handleSaveMarkings}
            >
              <Row gutter={16}>
                <Col xs={24} sm={12}>
                  <Form.Item label="Coat Color" name="coatColor">
                    <Input placeholder="e.g. Dark Bay, Chestnut" />
                  </Form.Item>
                </Col>
                <Col xs={24} sm={12}>
                  <Form.Item label="Blaze / Facial Marking" name="blaze">
                    <Input placeholder="e.g. Star, Strip, Snip" />
                  </Form.Item>
                </Col>
              </Row>

              <Row gutter={16}>
                <Col xs={24} sm={12}>
                  <Form.Item label="Leg Markings" name="legMarkings">
                    <Input placeholder="e.g. Left hind sock, Coronet" />
                  </Form.Item>
                </Col>
                <Col xs={24} sm={12}>
                  <Form.Item label="Forehead Whorl" name="whorl">
                    <Input placeholder="e.g. Centered above eye level" />
                  </Form.Item>
                </Col>
              </Row>

              <Row gutter={16}>
                <Col xs={24} sm={12}>
                  <Form.Item label="Brands" name="brands">
                    <Input placeholder="e.g. Left shoulder brand, None" />
                  </Form.Item>
                </Col>
                <Col xs={24} sm={12}>
                  <Form.Item label="Scars" name="scars">
                    <Input placeholder="e.g. Small scar right stifle" />
                  </Form.Item>
                </Col>
              </Row>

              <Form.Item label="Additional Markings Description" name="additionalDescription">
                <TextArea
                  rows={3}
                  placeholder="Detailed description of any additional distinctive markings..."
                />
              </Form.Item>

              <Button
                type="primary"
                htmlType="submit"
                style={{
                  backgroundColor: '#F59E0B',
                  borderColor: '#F59E0B',
                  borderRadius: 8,
                  fontWeight: 600,
                  boxShadow: 'none',
                }}
              >
                Save Markings
              </Button>
            </Form>
          </Card>

          {/* Card: Identity Photo Gallery */}
          <Card
            title={
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontWeight: 700, color: '#1E293B' }}>Identity Photo Gallery</span>
                <Tag color="default" style={{ borderRadius: 12, fontWeight: 600 }}>
                  {uploadedPhotosCount} / 6 angles
                </Tag>
              </div>
            }
            style={{ borderRadius: 12, border: '1px solid #E2E8F0' }}
            styles={{ body: { padding: 24 } }}
          >
            <p style={{ margin: '0 0 20px 0', fontSize: 13, color: '#64748B' }}>
              Capture all 6 standard angles for the highest AI confidence score.
            </p>

            <Row gutter={[16, 20]}>
              {PHOTO_ANGLES.map((angle) => {
                const photoUrl = anglePhotos[angle.key];
                return (
                  <Col xs={24} sm={12} md={8} key={angle.key}>
                    <div style={{ fontSize: 12.5, fontWeight: 600, color: '#334155', marginBottom: 8 }}>
                      {angle.label}
                    </div>
                    <div
                      style={{
                        height: 180,
                        border: '1.5px dashed #CBD5E1',
                        borderRadius: 12,
                        backgroundColor: '#F8FAFC',
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        justifyContent: 'center',
                        overflow: 'hidden',
                        position: 'relative',
                      }}
                    >
                      {photoUrl ? (
                        <>
                          <img
                            src={photoUrl}
                            alt={angle.label}
                            style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                          />
                          <div
                            style={{
                              position: 'absolute',
                              top: 8,
                              right: 8,
                              display: 'flex',
                              gap: 6,
                            }}
                          >
                            <Button
                              size="small"
                              shape="circle"
                              danger
                              icon={<DeleteOutlined />}
                              onClick={() => handleRemovePhoto(angle.key)}
                            />
                          </div>
                        </>
                      ) : (
                        <div style={{ textAlign: 'center', color: '#94A3B8' }}>
                          <UploadOutlined style={{ fontSize: 24, marginBottom: 6 }} />
                          <div style={{ fontSize: 12, fontWeight: 500 }}>Add Photo</div>
                        </div>
                      )}
                    </div>
                    <div style={{ marginTop: 8, textAlign: 'center' }}>
                      <Button
                        size="small"
                        icon={<UploadOutlined />}
                        onClick={() => handlePhotoUpload(angle.key)}
                        style={{
                          borderRadius: 20,
                          fontSize: 12,
                          color: '#475569',
                          borderColor: '#E2E8F0',
                        }}
                      >
                        Upload
                      </Button>
                    </div>
                  </Col>
                );
              })}
            </Row>
          </Card>
        </Space>
      )}

      {/* === TAB 6: REMINDERS === */}
      {activeTab === 'reminders' && (
        <Space direction="vertical" size={20} style={{ width: '100%' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <h3 style={{ margin: 0, fontSize: 18, fontWeight: 700, color: '#1E293B' }}>
              Upcoming Reminders
            </h3>
            <Button
              type="primary"
              icon={<PlusOutlined />}
              onClick={() => setIsReminderModalOpen(true)}
              style={{
                backgroundColor: '#F59E0B',
                borderColor: '#F59E0B',
                borderRadius: 20,
                fontWeight: 600,
                boxShadow: 'none',
              }}
            >
              Add Reminder
            </Button>
          </div>

          {horseReminders.length === 0 ? (
            <Card
              styles={{ body: { padding: '60px 20px', textAlign: 'center' } }}
              style={{ borderRadius: 12, border: '1px solid #E2E8F0' }}
            >
              <div
                style={{
                  width: 52,
                  height: 52,
                  borderRadius: 26,
                  border: '2px solid #CBD5E1',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  margin: '0 auto 16px auto',
                  color: '#64748B',
                  fontSize: 24,
                }}
              >
                <ClockCircleOutlined />
              </div>
              <h3 style={{ margin: 0, fontSize: 16, fontWeight: 700, color: '#1E293B' }}>
                No pending reminders
              </h3>
              <p style={{ margin: '6px 0 0 0', fontSize: 13, color: '#64748B' }}>
                Set reminders for vaccinations, coggins renewal, dental check, and more.
              </p>
            </Card>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {horseReminders.map((rem) => (
                <Card
                  key={rem.id}
                  style={{ borderRadius: 12, border: '1px solid #E2E8F0' }}
                  styles={{ body: { padding: '16px 20px' } }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div>
                      <Space size={8}>
                        <Tag color="orange" style={{ borderRadius: 6, fontWeight: 600 }}>
                          {rem.type || rem.category}
                        </Tag>
                        <Tag color="blue" style={{ borderRadius: 6 }}>
                          {rem.dueDate}
                        </Tag>
                      </Space>
                      <h4 style={{ margin: '8px 0 4px 0', fontSize: 15, fontWeight: 700, color: '#1E293B' }}>
                        {rem.title}
                      </h4>
                      {rem.notes && (
                        <p style={{ margin: 0, fontSize: 12.5, color: '#64748B' }}>{rem.notes}</p>
                      )}
                    </div>
                    <Popconfirm
                      title="Delete Reminder?"
                      onConfirm={() => handleDeleteReminder(rem.id)}
                      okText="Yes"
                      cancelText="No"
                    >
                      <Button type="text" danger icon={<DeleteOutlined />} />
                    </Popconfirm>
                  </div>
                </Card>
              ))}
            </div>
          )}
        </Space>
      )}

      {/* === TAB 7: EMERGENCY === */}
      {activeTab === 'emergency' && (
        <Space direction="vertical" size={20} style={{ width: '100%' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <h3 style={{ margin: 0, fontSize: 18, fontWeight: 700, color: '#1E293B' }}>
              Emergency Information Card
            </h3>
            <Button
              type="primary"
              icon={<PrinterOutlined />}
              onClick={handlePrintCard}
              style={{
                backgroundColor: '#F59E0B',
                borderColor: '#F59E0B',
                borderRadius: 20,
                fontWeight: 600,
                boxShadow: 'none',
              }}
            >
              Print Card
            </Button>
          </div>

          {/* Salmon Alert Notice */}
          <div
            style={{
              backgroundColor: '#FEF2F2',
              border: '1px solid #FECACA',
              borderRadius: 10,
              padding: '12px 18px',
              display: 'flex',
              alignItems: 'center',
              gap: 12,
            }}
          >
            <AlertOutlined style={{ color: '#EF4444', fontSize: 16, flexShrink: 0 }} />
            <span style={{ color: '#991B1B', fontSize: 13, lineHeight: 1.4 }}>
              This card is for informational purposes only. For life-threatening emergencies, contact your veterinarian or emergency hotline immediately. Call local emergency services if immediate transport is required.
            </span>
          </div>

          {/* Inner Emergency Card Container */}
          <Card
            style={{
              borderRadius: 12,
              border: '1px solid #E2E8F0',
              boxShadow: '0 2px 4px rgba(0,0,0,0.02)',
            }}
            styles={{ body: { padding: 24 } }}
          >
            {/* Horse Header */}
            <div style={{ display: 'flex', gap: 16, alignItems: 'center', marginBottom: 20 }}>
              <div
                style={{
                  width: 50,
                  height: 50,
                  borderRadius: 14,
                  backgroundColor: '#FEE2E2',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: '#EF4444',
                  fontSize: 24,
                }}
              >
                <MedicineBoxOutlined />
              </div>
              <div>
                <h3 style={{ margin: 0, fontSize: 18, fontWeight: 700, color: '#1E293B' }}>
                  {currentHorse.Name}
                </h3>
                <div style={{ fontSize: 13, color: '#64748B', marginTop: 2 }}>
                  {currentHorse.Breed || 'Quarter Horse'} · {currentHorse.DateOfBirth || '2021'} · {currentHorse.Color || 'Bay'}
                </div>
              </div>
            </div>

            <div style={{ borderTop: '1px solid #F1F5F9', paddingTop: 16 }}>
              {/* Primary Vet and Emergency Clinic */}
              <Row gutter={24}>
                <Col xs={24} sm={12}>
                  <div style={{ fontSize: 11, fontWeight: 700, color: '#EF4444', letterSpacing: 0.5 }}>
                    PRIMARY VET / CLINIC
                  </div>
                  <div style={{ fontSize: 14, fontWeight: 600, color: '#1E293B', marginTop: 4 }}>
                    Dr. Sarah Jenkins, DVM
                  </div>
                  <div style={{ fontSize: 13, color: '#475569' }}>
                    Oak Ridge Equine Hospital · Ba Vì International Center
                  </div>
                  <div style={{ fontSize: 13, color: '#64748B' }}>
                    Phone: +84 (0) 912-345-678 / (555) 234-5678
                  </div>
                </Col>

                <Col xs={24} sm={12}>
                  <div style={{ fontSize: 11, fontWeight: 700, color: '#EF4444', letterSpacing: 0.5 }}>
                    EMERGENCY CLINIC
                  </div>
                  <div style={{ fontSize: 14, fontWeight: 600, color: '#1E293B', marginTop: 4 }}>
                    24/7 International Equine Emergency Trauma Center
                  </div>
                  <div style={{ fontSize: 13, color: '#475569' }}>
                    Route 101 Equine Medical Hub · Rapid Dispatch
                  </div>
                  <div style={{ fontSize: 13, color: '#64748B' }}>
                    Hotline: +1 (800) 444-VET-911
                  </div>
                </Col>
              </Row>

              {/* Normal Vitals Table */}
              <div style={{ marginTop: 24 }}>
                <div style={{ fontSize: 11, fontWeight: 700, color: '#475569', letterSpacing: 0.5, marginBottom: 8 }}>
                  NORMAL VITALS
                </div>
                <Row gutter={12}>
                  <Col xs={8}>
                    <div
                      style={{
                        backgroundColor: '#F8FAFC',
                        borderRadius: 8,
                        padding: '10px 14px',
                        textAlign: 'center',
                        border: '1px solid #E2E8F0',
                      }}
                    >
                      <div style={{ fontSize: 11, color: '#64748B', fontWeight: 600 }}>TEMP</div>
                      <div style={{ fontSize: 13.5, fontWeight: 700, color: '#1E293B', marginTop: 2 }}>
                        99 - 101°F
                      </div>
                    </div>
                  </Col>
                  <Col xs={8}>
                    <div
                      style={{
                        backgroundColor: '#F8FAFC',
                        borderRadius: 8,
                        padding: '10px 14px',
                        textAlign: 'center',
                        border: '1px solid #E2E8F0',
                      }}
                    >
                      <div style={{ fontSize: 11, color: '#64748B', fontWeight: 600 }}>HEART</div>
                      <div style={{ fontSize: 13.5, fontWeight: 700, color: '#1E293B', marginTop: 2 }}>
                        28 - 44 bpm
                      </div>
                    </div>
                  </Col>
                  <Col xs={8}>
                    <div
                      style={{
                        backgroundColor: '#F8FAFC',
                        borderRadius: 8,
                        padding: '10px 14px',
                        textAlign: 'center',
                        border: '1px solid #E2E8F0',
                      }}
                    >
                      <div style={{ fontSize: 11, color: '#64748B', fontWeight: 600 }}>RESP</div>
                      <div style={{ fontSize: 13.5, fontWeight: 700, color: '#1E293B', marginTop: 2 }}>
                        8 - 16 bpm
                      </div>
                    </div>
                  </Col>
                </Row>
              </div>

              {/* Known Allergies */}
              <div style={{ marginTop: 20 }}>
                <div style={{ fontSize: 11, fontWeight: 700, color: '#D97706', letterSpacing: 0.5 }}>
                  KNOWN ALLERGIES
                </div>
                <div style={{ fontSize: 13, color: '#1E293B', marginTop: 4 }}>
                  No known allergies reported
                </div>
              </div>

              {/* Medical Notes */}
              <div style={{ marginTop: 16 }}>
                <div style={{ fontSize: 11, fontWeight: 700, color: '#475569', letterSpacing: 0.5 }}>
                  MEDICAL NOTES
                </div>
                <div style={{ fontSize: 13, color: '#475569', marginTop: 4, lineHeight: 1.5 }}>
                  {currentHorse.SpecialCareRequirements ||
                    'Fully vaccinated, Coggins negative. Thick straw bedding recommended during air and ground transport. Monitor hydration every 3 hours.'}
                </div>
              </div>

              {/* Footer Hotline */}
              <div
                style={{
                  marginTop: 20,
                  borderTop: '1px dashed #E2E8F0',
                  paddingTop: 12,
                  textAlign: 'center',
                  fontSize: 12,
                  color: '#94A3B8',
                }}
              >
                Tele-vet Hotline: 1800-HORSE-EMERGENCY · National Equine Response Service
              </div>
            </div>
          </Card>
        </Space>
      )}
        </>
      )}

      {/* 6. MODAL: ADD / EDIT VET RECORD */}
      <Modal
        title={
          <span style={{ fontSize: 18, fontWeight: 700, color: '#1E293B' }}>
            {editingRecord ? 'Chỉnh sửa hồ sơ thú y (Edit Vet Record)' : 'Thêm hồ sơ thú y (Add Vet Record)'}
          </span>
        }
        open={isRecordModalOpen}
        onCancel={() => {
          setIsRecordModalOpen(false);
          setEditingRecord(null);
        }}
        footer={null}
        width={680}
        destroyOnClose
      >
        <Form
          form={recordForm}
          layout="vertical"
          onFinish={handleAddRecord}
          style={{ marginTop: 8 }}
        >
          <Form.Item
            label="Danh mục kiểm tra / Loại hồ sơ thú y (Record Type)"
            name="recordType"
            rules={[{ required: true, message: 'Vui lòng chọn loại hồ sơ thú y' }]}
          >
            <Select
              options={RECORD_TYPE_OPTIONS}
              showSearch
              placeholder="Chọn loại hồ sơ y tế / kiểm tra..."
              onChange={(val) => {
                setSelectedRecordType(val);
                const curTitle = recordForm.getFieldValue('title');
                if (!curTitle || RECORD_TYPE_OPTIONS.some((opt) => opt.value === curTitle || opt.label.includes(curTitle))) {
                  recordForm.setFieldsValue({ title: val.replace(/\(.*?\)/g, '').trim() });
                }
                const curDate = recordForm.getFieldValue('date') || dayjs();
                const validityDays = RECORD_TYPE_VALIDITY_DAYS[val] || 90;
                recordForm.setFieldsValue({
                  expirationDate: dayjs(curDate).add(validityDays, 'day'),
                  nextDueDate: dayjs(curDate).add(validityDays, 'day'),
                });
              }}
              filterOption={(input, option) =>
                (option?.label ?? '').toLowerCase().includes(input.toLowerCase())
              }
            />
          </Form.Item>

          <Row gutter={16}>
            <Col xs={24} sm={12}>
              <Form.Item
                label="Tiêu đề / Tên hồ sơ thú y (Record Title)"
                name="title"
                rules={[
                  { required: true, message: 'Vui lòng nhập tên hồ sơ thú y' },
                  {
                    validator: (_, value) => {
                      if (!value) return Promise.resolve();
                      const trimmed = value.trim().toLowerCase();
                      const exists = horseRecords.some(
                        (r) => (!editingRecord || r.id !== editingRecord.id) && (r.title || '').trim().toLowerCase() === trimmed,
                      );
                      if (exists) {
                        return Promise.reject(
                          new Error(`Ngựa "${currentHorse.Name}" đã có hồ sơ mang tên "${value}". Vui lòng đặt tên phân biệt cho hồ sơ này!`),
                        );
                      }
                      return Promise.resolve();
                    },
                  },
                ]}
              >
                <Input placeholder="Ví dụ: Equine Influenza Vaccine Booster, Xét nghiệm Coggins EIA..." />
              </Form.Item>
            </Col>
            <Col xs={24} sm={12}>
              <Form.Item
                label="Date (Ngày thực hiện)"
                name="date"
                rules={[{ required: true, message: 'Vui lòng chọn ngày trên lịch' }]}
              >
                <DatePicker
                  format="DD/MM/YYYY"
                  placeholder="Chọn ngày trên lịch"
                  style={{ width: '100%', borderRadius: 8 }}
                  onChange={(dateVal) => {
                    if (dateVal) {
                      const curType = recordForm.getFieldValue('recordType') || selectedRecordType;
                      const validityDays = RECORD_TYPE_VALIDITY_DAYS[curType] || 90;
                      recordForm.setFieldsValue({
                        expirationDate: dayjs(dateVal).add(validityDays, 'day'),
                        nextDueDate: dayjs(dateVal).add(validityDays, 'day'),
                      });
                    }
                  }}
                />
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={16}>
            <Col xs={24} sm={12}>
              <Form.Item label="Expiration Date (Ngày hết hạn)" name="expirationDate">
                <DatePicker
                  format="DD/MM/YYYY"
                  placeholder="Chọn ngày hết hạn trên lịch"
                  style={{ width: '100%', borderRadius: 8 }}
                />
              </Form.Item>
            </Col>
            <Col xs={24} sm={12}>
              <Form.Item label="Next Due Date (Lịch tái khám kế tiếp)" name="nextDueDate">
                <DatePicker
                  format="DD/MM/YYYY"
                  placeholder="Chọn ngày tái khám trên lịch"
                  style={{ width: '100%', borderRadius: 8 }}
                />
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={16}>
            <Col xs={24} sm={12}>
              <Form.Item label="Bác sĩ / Phòng khám thực hiện (Provider / Vet Name)" name="providerName">
                <Input placeholder="Ví dụ: Dr. Sarah Jenkins, BV Thú y Hoàng Gia..." />
              </Form.Item>
            </Col>
            <Col xs={24} sm={12}>
              <Form.Item label="SĐT / Email liên hệ bác sĩ (Provider Contact)" name="providerContact">
                <Input placeholder="Ví dụ: (555) 234-5678 / vet@hospital.com" />
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={16}>
            <Col xs={24} sm={12}>
              <Form.Item label="Số lô thuốc / Vaccine (Lot / Batch Number)" name="lotNumber">
                <Input placeholder="Ví dụ: LOT-2026-99" />
              </Form.Item>
            </Col>
            <Col xs={24} sm={12}>
              <Form.Item label="Kết quả / Đánh giá lâm sàng (Result / Finding)" name="resultFinding">
                <Input placeholder="Ví dụ: Passed, Negative, Normal, Đạt chuẩn..." />
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={16}>
            <Col xs={24} sm={12}>
              <Form.Item label="Accession Number" name="accessionNumber">
                <Input placeholder="e.g. ACC-2026-001" />
              </Form.Item>
            </Col>
            <Col xs={24} sm={12}>
              <Form.Item label="Issuing State" name="issuingState">
                <Input placeholder="e.g. FEI Certified / Vietnam" />
              </Form.Item>
            </Col>
          </Row>

          <Form.Item label="Notes" name="notes">
            <TextArea rows={3} placeholder="Enter any specific clinical or transport notes..." />
          </Form.Item>

          {/* User Request 1: Bỏ cam, để file pdf mẫu kế bên Select Attachment */}
          <Form.Item label="Attachment (Đính kèm tệp PDF / Ảnh kết quả)">
            <Space wrap align="center">
              <Upload
                beforeUpload={(file) => {
                  const existingFileNames = horseRecords
                    .filter((r) => !editingRecord || r.id !== editingRecord.id)
                    .flatMap((r) => r.attachments || []);
                  if (existingFileNames.includes(file.name) || attachmentList.some((f) => f.name === file.name)) {
                    message.error(
                      `Tệp "${file.name}" đã tồn tại trong danh mục hồ sơ của ngựa "${currentHorse.Name}". Vui lòng đổi tên tệp để không trùng lặp!`,
                    );
                    return Upload.LIST_IGNORE;
                  }
                  setAttachmentList((prev) => [...prev, file]);
                  return false;
                }}
                onRemove={(file) => {
                  setAttachmentList((prev) => prev.filter((item) => item.uid !== file.uid));
                }}
                fileList={attachmentList}
              >
                <Button icon={<UploadOutlined />}>Select Attachment</Button>
              </Upload>

              <Button
                icon={<FilePdfOutlined />}
                onClick={() => {
                  const curType = recordForm.getFieldValue('recordType') || selectedRecordType;
                  const mappedDocType = mapRecordTypeToDocType(curType);
                  setTemplateModal({
                    open: true,
                    docType: mappedDocType,
                    title: `Mẫu đơn chuẩn: ${curType}`,
                  });
                }}
                style={{
                  borderColor: '#D97706',
                  color: '#92400E',
                  backgroundColor: '#FFFBEB',
                  fontWeight: 600,
                  borderRadius: 6,
                }}
              >
                Xem/Tải file PDF mẫu
              </Button>

              <Dropdown
                menu={{
                  items: TEMPLATE_MENU_ITEMS.map((item) => ({
                    key: item.key,
                    label: item.label,
                    onClick: () =>
                      setTemplateModal({
                        open: true,
                        docType: item.docType,
                        title: item.title,
                      }),
                  })),
                }}
              >
                <Button
                  style={{
                    borderColor: '#D97706',
                    color: '#92400E',
                    fontWeight: 600,
                    borderRadius: 6,
                  }}
                >
                  Tất cả biểu mẫu ▼
                </Button>
              </Dropdown>
            </Space>
          </Form.Item>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, marginTop: 20 }}>
            <Button
              onClick={() => {
                setIsRecordModalOpen(false);
                setEditingRecord(null);
              }}
            >
              Cancel
            </Button>
            <Button
              type="primary"
              htmlType="submit"
              style={{
                backgroundColor: '#F59E0B',
                borderColor: '#F59E0B',
                fontWeight: 600,
              }}
            >
              {editingRecord ? 'Lưu thay đổi' : 'Add Record'}
            </Button>
          </div>
        </Form>
      </Modal>

      {/* 7. MODAL: ADD REMINDER */}
      <Modal
        title={
          <span style={{ fontSize: 18, fontWeight: 700, color: '#1E293B' }}>
            Add Reminder
          </span>
        }
        open={isReminderModalOpen}
        onCancel={() => setIsReminderModalOpen(false)}
        footer={null}
        destroyOnClose
      >
        <Form
          form={reminderForm}
          layout="vertical"
          onFinish={handleAddReminder}
          initialValues={{ category: 'Vaccination', dueDate: 'In 14 days' }}
          style={{ marginTop: 16 }}
        >
          <Form.Item
            label="Reminder Title"
            name="title"
            rules={[{ required: true, message: 'Please enter reminder title' }]}
          >
            <Input placeholder="e.g. Coggins 6-Month Renewal" />
          </Form.Item>

          <Form.Item label="Danh mục nhắc lịch (Category)" name="category">
            <Select
              options={[
                { value: 'Vaccination', label: '💉 Tiêm phòng Vaccine cúm & bệnh truyền nhiễm' },
                { value: 'Health Cert', label: '📋 Tái cấp Chứng nhận kiểm dịch xuất khẩu CVI' },
                { value: 'Coggins', label: '🔬 Xét nghiệm định kỳ Coggins EIA' },
                { value: 'Deworming', label: '💊 Tẩy giun sán & Ký sinh trùng định kỳ' },
                { value: 'Dental', label: '🦷 Khám nha khoa & Chăm sóc răng miệng' },
                { value: 'Farrier', label: '🔨 Thay móng guốc & Cân bằng chân chạy' },
                { value: 'General', label: '🩺 Khám sức khỏe tổng quát định kỳ' },
              ]}
            />
          </Form.Item>

          <Form.Item
            label="Due Date / Horizon"
            name="dueDate"
            rules={[{ required: true, message: 'Please enter due date' }]}
          >
            <Input placeholder="e.g. In 14 days, or 2026-11-01" />
          </Form.Item>

          <Form.Item label="Repeat" name="repeat">
            <Select
              options={[
                { value: 'None', label: 'Do not repeat' },
                { value: 'Monthly', label: 'Every Month' },
                { value: '6 Months', label: 'Every 6 Months' },
                { value: 'Yearly', label: 'Every Year' },
              ]}
            />
          </Form.Item>

          <Form.Item label="Notes" name="notes">
            <TextArea rows={2} placeholder="Optional instructions or notes..." />
          </Form.Item>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, marginTop: 20 }}>
            <Button onClick={() => setIsReminderModalOpen(false)}>Cancel</Button>
            <Button
              type="primary"
              htmlType="submit"
              style={{
                backgroundColor: '#F59E0B',
                borderColor: '#F59E0B',
                fontWeight: 600,
              }}
            >
              Save Reminder
            </Button>
          </div>
        </Form>
      </Modal>

      {/* 8. MODAL: BIỂU MẪU HỒ SƠ KIỂM DỊCH & THÚ Y CHUẨN QUỐC TẾ */}
      <StandardFormTemplateModal
        open={templateModal.open}
        onClose={() => setTemplateModal((prev) => ({ ...prev, open: false }))}
        docType={templateModal.docType}
        title={templateModal.title}
        horse={currentHorse}
        onApply={() => {
          message.success(`Đã chọn đính kèm biểu mẫu "${templateModal.title}" vào hồ sơ!`);
        }}
      />
    </div>
  );
}
