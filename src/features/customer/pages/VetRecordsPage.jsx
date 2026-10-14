import { useState, useEffect, useMemo } from 'react';
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
} from 'antd';
import {
  MedicineBoxOutlined,
  AlertOutlined,
  CheckCircleOutlined,
  CloseCircleOutlined,
  PlusOutlined,
  PrinterOutlined,
  UploadOutlined,
  DeleteOutlined,
  FileTextOutlined,
  SafetyCertificateOutlined,
  ClockCircleOutlined,
  CalendarOutlined,
} from '@ant-design/icons';
import {
  getStoredHorses,
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
  'All',
  'Vaccinations',
  'Deworming',
  'Dental',
  'Farrier',
  'Coggins',
  'Health Cert',
  'Other',
];

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
  const [horses, setHorses] = useState(() => getStoredHorses());
  const [selectedHorseId, setSelectedHorseId] = useState(() => {
    const list = getStoredHorses();
    const thunder = list.find((h) => h.Name?.toLowerCase() === 'thunder');
    return thunder ? thunder.HorseID : list[0]?.HorseID || 1;
  });

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

  // Selected horse object
  const currentHorse = useMemo(() => {
    return horses.find((h) => String(h.HorseID) === String(selectedHorseId)) || horses[0] || {};
  }, [horses, selectedHorseId]);

  // Sync horses and records listeners
  useEffect(() => {
    const handleHorsesUpdate = (e) => {
      if (e.detail) setHorses(e.detail);
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
  }, []);

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

  // Add Vet Record handler
  const handleAddRecord = (values) => {
    const recordPayload = {
      horseId: currentHorse.HorseID,
      horseName: currentHorse.Name,
      recordType: values.recordType || 'Wellness Exam',
      title: values.title,
      date: values.date || new Date().toISOString().split('T')[0],
      expirationDate: values.expirationDate || '',
      nextDueDate: values.nextDueDate || '',
      providerName: values.providerName || '',
      providerContact: values.providerContact || '',
      lotNumber: values.lotNumber || '',
      resultFinding: values.resultFinding || 'Passed',
      accessionNumber: values.accessionNumber || '',
      issuingState: values.issuingState || '',
      notes: values.notes || '',
      attachments: attachmentList.map((f) => f.name),
      status: 'Valid',
    };

    addStoredVetRecord(recordPayload);
    setIsRecordModalOpen(false);
    recordForm.resetFields();
    setAttachmentList([]);
    message.success('Hồ sơ thú y đã được thêm thành công!');
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

      {/* 3. Horse Selector Bar */}
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
                const isSelected = recordCategory === cat;
                return (
                  <button
                    key={cat}
                    onClick={() => setRecordCategory(cat)}
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
                    {cat}
                  </button>
                );
              })}
            </div>
            <Button
              type="primary"
              icon={<PlusOutlined />}
              onClick={() => setIsRecordModalOpen(true)}
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
                    <div>
                      <Space size={8} style={{ marginBottom: 6 }}>
                        <Tag color="blue" style={{ borderRadius: 6, fontWeight: 600 }}>
                          {r.recordType || 'General'}
                        </Tag>
                        {r.status && (
                          <Tag
                            color={r.status === 'Valid' || r.status === 'Passed' ? 'success' : 'warning'}
                            style={{ borderRadius: 6 }}
                          >
                            {r.status}
                          </Tag>
                        )}
                        <span style={{ fontSize: 12, color: '#64748B' }}>
                          <CalendarOutlined style={{ marginRight: 4 }} />
                          {r.date}
                        </span>
                      </Space>
                      <h4 style={{ margin: '4px 0', fontSize: 15, fontWeight: 700, color: '#1E293B' }}>
                        {r.title}
                      </h4>
                      <p style={{ margin: '2px 0 8px 0', fontSize: 13, color: '#475569' }}>
                        <strong>Provider:</strong> {r.providerName || 'Dr. Sarah Jenkins'}{' '}
                        {r.providerContact && `· ${r.providerContact}`}
                      </p>
                      {r.resultFinding && (
                        <p style={{ margin: '2px 0', fontSize: 12.5, color: '#059669' }}>
                          <strong>Finding:</strong> {r.resultFinding}
                        </p>
                      )}
                      {r.notes && (
                        <p style={{ margin: '4px 0 0 0', fontSize: 12.5, color: '#64748B' }}>
                          {r.notes}
                        </p>
                      )}
                    </div>
                    <Space>
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

      {/* === TAB 3: DIGITAL DOSSIER === */}
      {activeTab === 'dossier' && (
        <Space direction="vertical" size={20} style={{ width: '100%' }}>
          <Card
            title={
              <Space>
                <SafetyCertificateOutlined style={{ color: '#2563EB' }} />
                <span style={{ fontWeight: 700, color: '#1E293B' }}>
                  Transport Specialist Dossier & Quarantine Legal Review (Flow 2)
                </span>
              </Space>
            }
            style={{ borderRadius: 12, border: '1px solid #E2E8F0' }}
            styles={{ body: { padding: 24 } }}
          >
            <p style={{ color: '#475569', fontSize: 13.5, lineHeight: 1.5, margin: 0 }}>
              The Digital Dossier consolidates all government veterinary health certificates, microchip cross-checks, and import/export clearance permits verified by the IET Quarantine Specialist before route dispatch.
            </p>

            <div
              style={{
                marginTop: 20,
                backgroundColor: '#F8FAFC',
                borderRadius: 10,
                border: '1px solid #E2E8F0',
                padding: '16px 20px',
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                <span style={{ fontWeight: 600, color: '#1E293B' }}>Dossier Verification Status:</span>
                <Tag color={currentHorse.HealthStatus === 'Critical' ? 'error' : 'success'} style={{ borderRadius: 6, fontWeight: 700 }}>
                  {currentHorse.HealthStatus === 'Critical' ? 'NON-FIT-TO-TRAVEL' : 'SPECIALIST REVIEW COMPLIANT'}
                </Tag>
              </div>
              <div style={{ fontSize: 13, color: '#64748B', display: 'flex', flexDirection: 'column', gap: 8 }}>
                <div>• FEI Equine Passport & Microchip: <strong>{currentHorse.MicrochipNumber || '123456789000000'} (Verified)</strong></div>
                <div>• CVI Health Inspection: <strong>{hasCVI ? 'Completed & Valid' : 'In Review / Pending'}</strong></div>
                <div>• Coggins EIA Lab Test: <strong>{hasCoggins ? 'Negative (Cleared)' : 'Pending'}</strong></div>
                <div>• Supervising Quarantine Officer: <strong>Dr. Sarah Jenkins (FEI Senior Vet #VN-884)</strong></div>
              </div>
            </div>
          </Card>
        </Space>
      )}

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

      {/* 6. MODAL: ADD VET RECORD (Matching media_1791474295407_bbfa77ed.png) */}
      <Modal
        title={
          <span style={{ fontSize: 18, fontWeight: 700, color: '#1E293B' }}>
            Add Vet Record
          </span>
        }
        open={isRecordModalOpen}
        onCancel={() => setIsRecordModalOpen(false)}
        footer={null}
        width={650}
        destroyOnClose
      >
        <Form
          form={recordForm}
          layout="vertical"
          onFinish={handleAddRecord}
          initialValues={{
            recordType: 'Wellness Exam',
            resultFinding: 'Negative (Passed)',
          }}
          style={{ marginTop: 16 }}
        >
          <Form.Item
            label="Record Type"
            name="recordType"
            rules={[{ required: true, message: 'Please select record type' }]}
          >
            <Select
              options={[
                { value: 'Wellness Exam', label: 'Wellness Exam' },
                { value: 'Vaccinations', label: 'Vaccinations' },
                { value: 'Deworming', label: 'Deworming' },
                { value: 'Dental', label: 'Dental' },
                { value: 'Farrier', label: 'Farrier' },
                { value: 'Coggins', label: 'Coggins / EIA Test' },
                { value: 'Health Cert', label: 'Health Certificate (CVI)' },
                { value: 'Other', label: 'Other' },
              ]}
            />
          </Form.Item>

          <Row gutter={16}>
            <Col xs={24} sm={12}>
              <Form.Item
                label="Title / Product Name"
                name="title"
                rules={[{ required: true, message: 'Please enter title' }]}
              >
                <Input placeholder="e.g. Equine Influenza Vaccine" />
              </Form.Item>
            </Col>
            <Col xs={24} sm={12}>
              <Form.Item
                label="Date"
                name="date"
                rules={[{ required: true, message: 'Please enter date' }]}
              >
                <Input placeholder="mm/dd/yyyy" />
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={16}>
            <Col xs={24} sm={12}>
              <Form.Item label="Expiration Date" name="expirationDate">
                <Input placeholder="mm/dd/yyyy" />
              </Form.Item>
            </Col>
            <Col xs={24} sm={12}>
              <Form.Item label="Next Due Date" name="nextDueDate">
                <Input placeholder="mm/dd/yyyy" />
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={16}>
            <Col xs={24} sm={12}>
              <Form.Item label="Provider / Vet Name" name="providerName">
                <Input placeholder="e.g. Dr. Sarah Jenkins" />
              </Form.Item>
            </Col>
            <Col xs={24} sm={12}>
              <Form.Item label="Provider Phone / Email" name="providerContact">
                <Input placeholder="e.g. (555) 234-5678" />
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={16}>
            <Col xs={24} sm={12}>
              <Form.Item label="Lot / Batch Number" name="lotNumber">
                <Input placeholder="e.g. LOT-2026-99" />
              </Form.Item>
            </Col>
            <Col xs={24} sm={12}>
              <Form.Item label="Result / Finding" name="resultFinding">
                <Input placeholder="e.g. Passed, Normal, Negative" />
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

          {/* User Request #13: Tệp đính kèm cho vet record */}
          <Form.Item label="Attachment (PDF / Image / Scan)">
            <Upload
              beforeUpload={(file) => {
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
          </Form.Item>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, marginTop: 20 }}>
            <Button onClick={() => setIsRecordModalOpen(false)}>Cancel</Button>
            <Button
              type="primary"
              htmlType="submit"
              style={{
                backgroundColor: '#F59E0B',
                borderColor: '#F59E0B',
                fontWeight: 600,
              }}
            >
              Add Record
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

          <Form.Item label="Category" name="category">
            <Select
              options={[
                { value: 'Vaccination', label: 'Vaccination' },
                { value: 'Coggins', label: 'Coggins Test' },
                { value: 'Dental', label: 'Dental Exam' },
                { value: 'Farrier', label: 'Farrier Shoe Reset' },
                { value: 'General', label: 'General Checkup' },
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
    </div>
  );
}
