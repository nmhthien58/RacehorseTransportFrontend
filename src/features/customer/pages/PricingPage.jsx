import { useState, useMemo } from 'react';
import {
  Button,
  Card,
  Checkbox,
  Col,
  Flex,
  InputNumber,
  Row,
  Select,
  Table,
  Tag,
  Typography,
} from 'antd';
import {
  CalculatorOutlined,
  ReloadOutlined,
} from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { ROUTES } from '@routes/routes';
import { useMyHorses } from '@features/customer/hooks/useMyHorses';

const { Title, Text } = Typography;

// Destination rates database
const airRatesByCountry = {
  France: { zone: 'Europe', baseShared: 8000, customs: 950, quarantine: 1400 },
  'Hong Kong': { zone: 'East Asia', baseShared: 5500, customs: 850, quarantine: 1100 },
  Japan: { zone: 'East Asia', baseShared: 5500, customs: 850, quarantine: 1200 },
  Australia: { zone: 'Oceania', baseShared: 6500, customs: 950, quarantine: 1600 },
  'United Kingdom': { zone: 'Europe', baseShared: 8000, customs: 950, quarantine: 1500 },
  'United States': { zone: 'Americas', baseShared: 10000, customs: 950, quarantine: 2000 },
  Thailand: { zone: 'Southeast Asia', baseShared: 3000, customs: 650, quarantine: 750 },
  China: { zone: 'East Asia', baseShared: 4500, customs: 800, quarantine: 1100 },
};

const groundRatesByCountry = {
  Cambodia: { distanceKm: 250, basePerKm: 1.0, border: 250, quarantine: 0 },
  Laos: { distanceKm: 650, basePerKm: 1.0, border: 250, quarantine: 0 },
  Thailand: { distanceKm: 900, basePerKm: 1.0, border: 300, quarantine: 400 },
  China: { distanceKm: 1400, basePerKm: 1.5, border: 350, quarantine: 800 },
};

// Multipliers
const stallMultipliers = {
  shared: 1.0,
  comfort: 1.4,
  private: 2.2,
};

export default function CustomerPricingPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { data: horses } = useMyHorses();

  const [activeTab, setActiveTab] = useState('rate-card'); // 'rate-card' | 'calculator'
  const [selectedStallCard, setSelectedStallCard] = useState('comfort'); // 'shared' | 'comfort' | 'private'

  // Calculator Form State
  const [transportMode, setTransportMode] = useState('air'); // 'air' | 'ground'
  const [destinationCountry, setDestinationCountry] = useState('France');
  
  // Horses in calculator
  const initialSelectedHorses = useMemo(() => {
    if (horses && horses.length > 0) {
      return horses.slice(0, 3).map((h, i) => ({
        id: h.horseId || h.HorseID || i + 1,
        name: h.name || h.Name || `Ngựa ${i + 1}`,
        stallClass: i === 0 ? 'comfort' : 'shared',
      }));
    }
    return [
      { id: 1, name: 'Midnight Thunder', stallClass: 'shared' },
      { id: 2, name: 'Royal Duchess', stallClass: 'comfort' },
      { id: 3, name: 'Lightning', stallClass: 'shared' },
    ];
  }, [horses]);

  const [customHorses, setCustomHorses] = useState(null);
  const calcHorses = customHorses ?? initialSelectedHorses;
  const setCalcHorses = (val) => setCustomHorses(typeof val === 'function' ? val(calcHorses) : val);

  // Options State
  const [optClimateControl, setOptClimateControl] = useState(true);
  const [optExpress, setOptExpress] = useState(false);
  const [optInsurance, setOptInsurance] = useState(true);
  const [optOffPeak, setOptOffPeak] = useState(false);
  const [declaredValue, setDeclaredValue] = useState(50000);

  // Tính toán bảng giá theo dữ liệu thực
  const quoteCalculation = useMemo(() => {
    let transportBase = 0;
    const numHorses = calcHorses.length;

    if (transportMode === 'air') {
      const countryData = airRatesByCountry[destinationCountry] || airRatesByCountry['France'];
      calcHorses.forEach((h) => {
        const mult = stallMultipliers[h.stallClass] || 1.0;
        transportBase += countryData.baseShared * mult;
      });
    } else {
      const countryData = groundRatesByCountry[destinationCountry] || groundRatesByCountry['Cambodia'];
      calcHorses.forEach((h) => {
        const mult = stallMultipliers[h.stallClass] || 1.0;
        transportBase += countryData.distanceKm * countryData.basePerKm * mult;
      });
    }

    // Volume discount
    let volumeDiscount = 0;
    if (numHorses >= 3 && numHorses <= 6) {
      volumeDiscount = transportBase * 0.05;
    } else if (numHorses >= 7) {
      volumeDiscount = transportBase * 0.1;
    }

    // Off-peak
    if (optOffPeak) {
      volumeDiscount += 500;
    }

    // Fuel surcharge: 3%
    const fuelSurcharge = transportBase * 0.03;

    // Climate control: 10%
    const climateControlFee = optClimateControl ? transportBase * 0.1 : 0;

    // Express: 15%
    const expressFee = optExpress ? transportBase * 0.15 : 0;

    // Groom fees
    const groomFee = transportMode === 'air' ? 700 : 360;

    // Customs & Quarantine
    const countryData = transportMode === 'air'
      ? (airRatesByCountry[destinationCountry] || airRatesByCountry['France'])
      : (groundRatesByCountry[destinationCountry] || groundRatesByCountry['Cambodia']);

    const customsFee = transportMode === 'air'
      ? countryData.customs * (numHorses > 1 ? 1.25 : 1.0)
      : countryData.border;

    const quarantineFee = countryData.quarantine;

    // Insurance: 1% of declared value
    const insuranceFee = optInsurance ? (declaredValue * 0.01) : 0;

    // Transit registration
    const transitRegFee = 250;

    const totalEstimated =
      transportBase -
      volumeDiscount +
      fuelSurcharge +
      climateControlFee +
      expressFee +
      groomFee +
      customsFee +
      quarantineFee +
      insuranceFee +
      transitRegFee;

    return {
      transportBase,
      volumeDiscount,
      fuelSurcharge,
      climateControlFee,
      expressFee,
      groomFee,
      customsFee,
      quarantineFee,
      insuranceFee,
      transitRegFee,
      totalEstimated,
      perHorse: numHorses > 0 ? totalEstimated / numHorses : 0,
    };
  }, [
    transportMode,
    destinationCountry,
    calcHorses,
    optClimateControl,
    optExpress,
    optInsurance,
    optOffPeak,
    declaredValue,
  ]);

  const handleContinueBooking = () => {
    navigate(ROUTES.CUSTOMER_BOOKING_NEW, {
      state: {
        destination: destinationCountry,
        transportMode: transportMode === 'air' ? 'Air' : 'Ground',
        totalHorses: calcHorses.length,
        calcHorses,
        optClimateControl,
        optExpress,
        optInsurance,
        declaredValue,
        estimatedCost: quoteCalculation.totalEstimated,
      },
    });
  };

  const handleResetCalculator = () => {
    setTransportMode('air');
    setDestinationCountry('France');
    setCustomHorses(null);
    setOptClimateControl(true);
    setOptExpress(false);
    setOptInsurance(true);
    setOptOffPeak(false);
    setDeclaredValue(50000);
  };

  return (
    <div style={{ maxWidth: 1200, margin: '0 auto', padding: '12px 0 60px 0' }}>
      {/* Header & Tabs */}
      <div style={{ marginBottom: 28 }}>
        <Flex justify="space-between" align="center" wrap="wrap" gap={16} style={{ marginBottom: 12 }}>
          <div>
            <Title level={2} style={{ margin: 0, fontWeight: 900, color: '#0f172a' }}>
              {activeTab === 'rate-card' ? t('pricing.transportPricing', 'Transport Pricing') : t('pricing.quoteCalculator', 'Quote Calculator')}
            </Title>
            <Text style={{ color: '#64748b', fontSize: 14 }}>
              {activeTab === 'rate-card'
                ? t('pricing.rateCardDesc', 'Published rates for cross-border racehorse transport departing Vietnam • All prices in USD, per horse, one way')
                : t('pricing.calculatorDesc', 'Estimate the cost of a horse transport request before you submit it • Uses the published rate card')}
            </Text>
          </div>

          <Tag color="success" style={{ fontWeight: 700, padding: '4px 12px', borderRadius: 9999 }}>
            • {t('pricing.effectiveDate', 'EFFECTIVE FROM 01 OCT 2026')}
          </Tag>
        </Flex>

        {/* Tab Buttons */}
        <Flex gap={10}>
          <Button
            type={activeTab === 'rate-card' ? 'primary' : 'default'}
            onClick={() => setActiveTab('rate-card')}
            style={{
              backgroundColor: activeTab === 'rate-card' ? '#0f172a' : undefined,
              borderRadius: 8,
              fontWeight: 700,
              height: 38,
            }}
          >
            {t('pricing.rateCard', 'Rate Card')}
          </Button>
          <Button
            type={activeTab === 'calculator' ? 'primary' : 'default'}
            icon={<CalculatorOutlined />}
            onClick={() => setActiveTab('calculator')}
            style={{
              backgroundColor: activeTab === 'calculator' ? '#0f172a' : undefined,
              borderRadius: 8,
              fontWeight: 700,
              height: 38,
            }}
          >
            {t('pricing.quoteCalculator', 'Quote Calculator')}
          </Button>
        </Flex>
      </div>

      {/* NỘI DUNG TAB 1: RATE CARD (Pricing_1 trong Figma) */}
      {activeTab === 'rate-card' && (
        <div>
          {/* How your price is calculated (5 bước) */}
          <div style={{ marginBottom: 32 }}>
            <Title level={5} style={{ color: '#334155', marginBottom: 14, fontWeight: 700 }}>
              How your price is calculated
            </Title>
            <Row gutter={[16, 16]}>
              <Col xs={12} md={6} lg={4.8}>
                <div style={{ backgroundColor: '#ffffff', borderRadius: 12, padding: 16, border: '1px solid #e2e8f0', height: '100%' }}>
                  <Text strong style={{ fontSize: 12, color: '#64748b', display: 'block', marginBottom: 4 }}>1 • BASE RATE</Text>
                  <div style={{ fontWeight: 800, color: '#0f172a', fontSize: 14 }}>Route rate & stall class</div>
                  <Text style={{ fontSize: 12, color: '#64748b', marginTop: 4, display: 'block' }}>
                    Shared, Comfort, Private. Pallet split applies on flights.
                  </Text>
                </div>
              </Col>
              <Col xs={12} md={6} lg={4.8}>
                <div style={{ backgroundColor: '#ffffff', borderRadius: 12, padding: 16, border: '1px solid #e2e8f0', height: '100%' }}>
                  <Text strong style={{ fontSize: 12, color: '#64748b', display: 'block', marginBottom: 4 }}>2 • COMPLIANCE</Text>
                  <div style={{ fontWeight: 800, color: '#0f172a', fontSize: 14 }}>Documents, customs, quarantine</div>
                  <Text style={{ fontSize: 12, color: '#64748b', marginTop: 4, display: 'block' }}>
                    Varies by departure and destination protocol.
                  </Text>
                </div>
              </Col>
              <Col xs={12} md={6} lg={4.8}>
                <div style={{ backgroundColor: '#ffffff', borderRadius: 12, padding: 16, border: '1px solid #e2e8f0', height: '100%' }}>
                  <Text strong style={{ fontSize: 12, color: '#64748b', display: 'block', marginBottom: 4 }}>3 • CARE</Text>
                  <div style={{ fontWeight: 800, color: '#0f172a', fontSize: 14 }}>Travelling groom</div>
                  <Text style={{ fontSize: 12, color: '#64748b', marginTop: 4, display: 'block' }}>
                    One groom per pallet on flights, per 3 horses on truck.
                  </Text>
                </div>
              </Col>
              <Col xs={12} md={6} lg={4.8}>
                <div style={{ backgroundColor: '#ffffff', borderRadius: 12, padding: 16, border: '1px solid #e2e8f0', height: '100%' }}>
                  <Text strong style={{ fontSize: 12, color: '#64748b', display: 'block', marginBottom: 4 }}>4 • PROTECTION</Text>
                  <div style={{ fontWeight: 800, color: '#0f172a', fontSize: 14 }}>1% of declared value</div>
                  <Text style={{ fontSize: 12, color: '#64748b', marginTop: 4, display: 'block' }}>
                    Optional transit insurance for racehorses.
                  </Text>
                </div>
              </Col>
              <Col xs={12} md={6} lg={4.8}>
                <div style={{ backgroundColor: '#0f172a', borderRadius: 12, padding: 16, border: 'none', height: '100%', color: '#ffffff' }}>
                  <Text strong style={{ fontSize: 12, color: '#FBA919', display: 'block', marginBottom: 4 }}>FINAL ESTIMATE</Text>
                  <div style={{ fontWeight: 800, color: '#ffffff', fontSize: 14 }}>Your quote</div>
                  <Text style={{ fontSize: 12, color: '#cbd5e1', marginTop: 4, display: 'block' }}>
                    Transparent itemized breakdown before checkout.
                  </Text>
                </div>
              </Col>
            </Row>
          </div>

          {/* Stall Class Multipliers (3 thẻ lớn) */}
          <div style={{ marginBottom: 36 }}>
            <Title level={5} style={{ color: '#334155', marginBottom: 14, fontWeight: 700 }}>
              Stall class
            </Title>
            <Row gutter={[20, 20]}>
              <Col xs={24} md={8}>
                <div
                  onClick={() => setSelectedStallCard('shared')}
                  style={{
                    borderRadius: 16,
                    border: selectedStallCard === 'shared' ? '2.5px solid #F59E0B' : '1.5px solid #e2e8f0',
                    backgroundColor: selectedStallCard === 'shared' ? '#FFFBEB' : '#ffffff',
                    padding: 20,
                    cursor: 'pointer',
                    transform: selectedStallCard === 'shared' ? 'scale(1.025)' : 'scale(1)',
                    boxShadow: selectedStallCard === 'shared'
                      ? '0 8px 24px rgba(245, 158, 11, 0.22)'
                      : '0 2px 6px rgba(0,0,0,0.02)',
                    transition: 'all 0.25s cubic-bezier(0.4, 0, 0.2, 1)',
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                    <span style={{ fontWeight: 800, fontSize: 16, color: selectedStallCard === 'shared' ? '#92400E' : '#0f172a' }}>
                      Shared
                    </span>
                    <span style={{ fontWeight: 900, fontSize: 24, color: selectedStallCard === 'shared' ? '#F59E0B' : '#0f172a' }}>
                      × 1.0
                    </span>
                  </div>
                  <Text style={{ color: selectedStallCard === 'shared' ? '#B45309' : '#64748b', fontSize: 13, display: 'block' }}>
                    Three horses per pallet. Standard partition width.
                  </Text>
                  {selectedStallCard === 'shared' && (
                    <Tag color="gold" style={{ marginTop: 10, fontWeight: 800, borderRadius: 9999 }}>
                      ✓ Active
                    </Tag>
                  )}
                </div>
              </Col>
              <Col xs={24} md={8}>
                <div
                  onClick={() => setSelectedStallCard('comfort')}
                  style={{
                    borderRadius: 16,
                    border: selectedStallCard === 'comfort' ? '2.5px solid #F59E0B' : '1.5px solid #e2e8f0',
                    backgroundColor: selectedStallCard === 'comfort' ? '#FFFBEB' : '#ffffff',
                    padding: 20,
                    cursor: 'pointer',
                    transform: selectedStallCard === 'comfort' ? 'scale(1.025)' : 'scale(1)',
                    boxShadow: selectedStallCard === 'comfort'
                      ? '0 8px 24px rgba(245, 158, 11, 0.22)'
                      : '0 2px 6px rgba(0,0,0,0.02)',
                    transition: 'all 0.25s cubic-bezier(0.4, 0, 0.2, 1)',
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                    <Flex align="center" gap={8}>
                      <span style={{ fontWeight: 800, fontSize: 16, color: selectedStallCard === 'comfort' ? '#92400E' : '#0f172a' }}>
                        Comfort
                      </span>
                      <Tag color="gold" style={{ fontSize: 11, fontWeight: 700 }}>MOST POPULAR</Tag>
                    </Flex>
                    <span style={{ fontWeight: 900, fontSize: 24, color: '#F59E0B' }}>× 1.4</span>
                  </div>
                  <Text style={{ color: selectedStallCard === 'comfort' ? '#B45309' : '#64748b', fontSize: 13, display: 'block' }}>
                    Two horses per pallet. 1.5× stall width for extra room.
                  </Text>
                  {selectedStallCard === 'comfort' && (
                    <Tag color="gold" style={{ marginTop: 10, fontWeight: 800, borderRadius: 9999 }}>
                      ✓ Active
                    </Tag>
                  )}
                </div>
              </Col>
              <Col xs={24} md={8}>
                <div
                  onClick={() => setSelectedStallCard('private')}
                  style={{
                    borderRadius: 16,
                    border: selectedStallCard === 'private' ? '2.5px solid #F59E0B' : '1.5px solid #e2e8f0',
                    backgroundColor: selectedStallCard === 'private' ? '#FFFBEB' : '#ffffff',
                    padding: 20,
                    cursor: 'pointer',
                    transform: selectedStallCard === 'private' ? 'scale(1.025)' : 'scale(1)',
                    boxShadow: selectedStallCard === 'private'
                      ? '0 8px 24px rgba(245, 158, 11, 0.22)'
                      : '0 2px 6px rgba(0,0,0,0.02)',
                    transition: 'all 0.25s cubic-bezier(0.4, 0, 0.2, 1)',
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                    <span style={{ fontWeight: 800, fontSize: 16, color: selectedStallCard === 'private' ? '#92400E' : '#0f172a' }}>
                      Private
                    </span>
                    <span style={{ fontWeight: 900, fontSize: 24, color: selectedStallCard === 'private' ? '#F59E0B' : '#0f172a' }}>
                      × 2.2
                    </span>
                  </div>
                  <Text style={{ color: selectedStallCard === 'private' ? '#B45309' : '#64748b', fontSize: 13, display: 'block' }}>
                    One horse per pallet. Full box stall, luxury aprons.
                  </Text>
                  {selectedStallCard === 'private' && (
                    <Tag color="gold" style={{ marginTop: 10, fontWeight: 800, borderRadius: 9999 }}>
                      ✓ Active
                    </Tag>
                  )}
                </div>
              </Col>
            </Row>
          </div>

          {/* Bảng Air Freight Rates */}
          <Card
            style={{ borderRadius: 16, marginBottom: 32, border: '1px solid #e2e8f0', overflow: 'hidden' }}
            bodyStyle={{ padding: 0 }}
          >
            <div style={{ padding: '20px 24px', borderBottom: '1px solid #f1f5f9' }}>
              <Title level={4} style={{ margin: 0, fontWeight: 800, color: '#0f172a' }}>
                Air freight rates
              </Title>
              <Text style={{ color: '#64748b', fontSize: 13 }}>
                Rates per horse for fixed airport routes. Includes export pallet administration.
              </Text>
            </div>
            <Table
              pagination={false}
              scroll={{ x: 800 }}
              dataSource={[
                { key: '1', zone: 'Southeast Asia', dest: 'Thailand, Singapore, Malaysia', shared: '$3,000', comfort: '$4,200', private: '$6,600', customs: '$650', quarantine: '7-14 d' },
                { key: '2', zone: 'East Asia', dest: 'Hong Kong, South Korea, Japan', shared: '$5,500', comfort: '$7,700', private: '$12,100', customs: '$850', quarantine: '7-10 d' },
                { key: '3', zone: 'Middle East & Oceania', dest: 'UAE, Australia', shared: '$6,500', comfort: '$9,100', private: '$14,300', customs: '$950', quarantine: '14-21 d' },
                { key: '4', zone: 'Europe', dest: 'France, United Kingdom, Germany', shared: '$8,000', comfort: '$11,200', private: '$17,600', customs: '$950', quarantine: '21 d' },
                { key: '5', zone: 'Americas', dest: 'United States', shared: '$10,000', comfort: '$14,000', private: '$22,000', customs: '$950', quarantine: '30 d' },
              ]}
              columns={[
                { title: 'ZONE', dataIndex: 'zone', key: 'zone', render: (z) => <span style={{ fontWeight: 700 }}>{z}</span> },
                { title: 'DESTINATIONS', dataIndex: 'dest', key: 'dest' },
                { title: 'SHARED (×1.0)', dataIndex: 'shared', key: 'shared', render: (s) => <span style={{ fontWeight: 700, color: '#0f172a' }}>{s}</span> },
                { title: 'COMFORT (×1.4)', dataIndex: 'comfort', key: 'comfort', render: (c) => <span style={{ fontWeight: 800, color: '#FBA919' }}>{c}</span> },
                { title: 'PRIVATE (×2.2)', dataIndex: 'private', key: 'private', render: (p) => <span style={{ fontWeight: 700, color: '#2563eb' }}>{p}</span> },
                { title: 'AIRPORT & CUSTOMS', dataIndex: 'customs', key: 'customs' },
                { title: 'QUARANTINE', dataIndex: 'quarantine', key: 'quarantine', render: (q) => <Tag color="orange">{q}</Tag> },
                {
                  title: 'ACTION',
                  key: 'action',
                  render: (_, r) => (
                    <Button
                      type="primary"
                      size="small"
                      onClick={() => {
                        const dest =
                          r.zone === 'East Asia'
                            ? 'Hong Kong'
                            : r.zone === 'Europe'
                            ? 'France'
                            : r.zone === 'Americas'
                            ? 'United States'
                            : r.zone === 'Middle East & Oceania'
                            ? 'Australia'
                            : 'Thailand';
                        navigate(ROUTES.CUSTOMER_BOOKING_NEW, {
                          state: {
                            destination: dest,
                            transportMode: 'Air',
                            totalHorses: 1,
                            stallClass: 'Comfort',
                            estimatedCost: Number(r.comfort.replace(/[^0-9]/g, '')) || 5500,
                          },
                        });
                      }}
                      style={{
                        backgroundColor: '#FBA919',
                        borderColor: '#FBA919',
                        color: '#0f172a',
                        fontWeight: 700,
                        borderRadius: 9999,
                      }}
                    >
                      Book Route →
                    </Button>
                  ),
                },
              ]}
            />
          </Card>

          {/* Surcharges & Fixed Fees */}
          <Row gutter={[24, 24]} style={{ marginBottom: 36 }}>
            <Col xs={24} md={12}>
              <Card style={{ borderRadius: 16, height: '100%', border: '1px solid #e2e8f0' }}>
                <Title level={4} style={{ fontWeight: 800, marginBottom: 16, color: '#0f172a' }}>
                  Surcharges and discounts on freight
                </Title>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                  <Flex justify="space-between" align="center">
                    <span>Fuel surcharge</span>
                    <Tag color="gold" style={{ fontWeight: 700 }}>+ 3%</Tag>
                  </Flex>
                  <Flex justify="space-between" align="center">
                    <span>Climate-controlled stall and special care</span>
                    <Tag color="blue" style={{ fontWeight: 700 }}>+ 10%</Tag>
                  </Flex>
                  <Flex justify="space-between" align="center">
                    <span>Express, departure in under 7 days</span>
                    <Tag color="volcano" style={{ fontWeight: 700 }}>+ 15%</Tag>
                  </Flex>
                  <Flex justify="space-between" align="center">
                    <span>Volume discount, 4 to 6 horses</span>
                    <Tag color="green" style={{ fontWeight: 700 }}>- 5%</Tag>
                  </Flex>
                  <Flex justify="space-between" align="center">
                    <span>Volume discount, 7 to 10 horses</span>
                    <Tag color="green" style={{ fontWeight: 700 }}>- 10%</Tag>
                  </Flex>
                </div>
              </Card>
            </Col>

            <Col xs={24} md={12}>
              <Card style={{ borderRadius: 16, height: '100%', border: '1px solid #e2e8f0' }}>
                <Title level={4} style={{ fontWeight: 800, marginBottom: 16, color: '#0f172a' }}>
                  Fixed fees
                </Title>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                  <Flex justify="space-between" align="center">
                    <span>Export and import health certificate</span>
                    <span style={{ fontWeight: 700 }}>$250 / horse</span>
                  </Flex>
                  <Flex justify="space-between" align="center">
                    <span>Flying groom, air</span>
                    <span style={{ fontWeight: 700 }}>$850 / groom</span>
                  </Flex>
                  <Flex justify="space-between" align="center">
                    <span>Travelling groom, ground</span>
                    <span style={{ fontWeight: 700 }}>$120 / groom / day</span>
                  </Flex>
                  <Flex justify="space-between" align="center">
                    <span>Transit insurance, optional</span>
                    <span style={{ fontWeight: 700 }}>1% of declared value</span>
                  </Flex>
                  <Flex justify="space-between" align="center">
                    <span>Escrow transaction deposit</span>
                    <span style={{ fontWeight: 700 }}>1 per invoice</span>
                  </Flex>
                </div>
              </Card>
            </Col>
          </Row>

          {/* Banner dẫn tới Calculator */}
          <div
            style={{
              backgroundColor: '#FFF9EE',
              border: '1px solid #FBA919',
              borderRadius: 20,
              padding: '24px 32px',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              flexWrap: 'wrap',
              gap: 16,
            }}
          >
            <div>
              <div style={{ fontWeight: 800, fontSize: 17, color: '#0f172a', marginBottom: 4 }}>
                Have custom specs?
              </div>
              <Text style={{ color: '#64748b', fontSize: 14 }}>
                Enter your route, horses and options to see your personalized interactive quote.
              </Text>
            </div>
            <Button
              type="primary"
              size="large"
              icon={<CalculatorOutlined />}
              onClick={() => setActiveTab('calculator')}
              style={{
                backgroundColor: '#0f172a',
                borderColor: '#0f172a',
                fontWeight: 700,
                borderRadius: 9999,
                padding: '0 28px',
                height: 44,
              }}
            >
              Open Quote Calculator →
            </Button>
          </div>
        </div>
      )}

      {/* NỘI DUNG TAB 2: QUOTE CALCULATOR (Pricing_2 trong Figma) */}
      {activeTab === 'calculator' && (
        <Row gutter={[32, 32]}>
          {/* Cột trái: Bộ tính phí (Inputs) */}
          <Col xs={24} lg={15}>
            {/* 1. Route */}
            <Card style={{ borderRadius: 18, marginBottom: 24, border: '1px solid #e2e8f0' }}>
              <Title level={4} style={{ fontWeight: 800, marginBottom: 16, color: '#0f172a' }}>
                1. Route
              </Title>
              <div style={{ marginBottom: 16 }}>
                <Text strong style={{ fontSize: 13, color: '#475569', display: 'block', marginBottom: 8 }}>
                  Transport mode
                </Text>
                <Row gutter={[12, 12]}>
                  <Col xs={12}>
                    <div
                      onClick={() => setTransportMode('air')}
                      style={{
                        backgroundColor: transportMode === 'air' ? '#FFFBEB' : '#FFFFFF',
                        border: transportMode === 'air' ? '2.5px solid #F59E0B' : '1.5px solid #E2E8F0',
                        borderRadius: 14,
                        padding: '14px 18px',
                        cursor: 'pointer',
                        transform: transportMode === 'air' ? 'scale(1.025)' : 'scale(1)',
                        boxShadow: transportMode === 'air'
                          ? '0 8px 20px rgba(245, 158, 11, 0.2)'
                          : '0 2px 6px rgba(0,0,0,0.02)',
                        transition: 'all 0.25s cubic-bezier(0.4, 0, 0.2, 1)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                      }}
                    >
                      <span style={{ fontWeight: 800, color: transportMode === 'air' ? '#92400E' : '#0F172A', fontSize: 14.5 }}>
                        ✈️ Air freight
                      </span>
                      {transportMode === 'air' && <Tag color="gold" style={{ fontWeight: 800, borderRadius: 9999 }}>✓ Active</Tag>}
                    </div>
                  </Col>
                  <Col xs={12}>
                    <div
                      onClick={() => setTransportMode('ground')}
                      style={{
                        backgroundColor: transportMode === 'ground' ? '#FFFBEB' : '#FFFFFF',
                        border: transportMode === 'ground' ? '2.5px solid #F59E0B' : '1.5px solid #E2E8F0',
                        borderRadius: 14,
                        padding: '14px 18px',
                        cursor: 'pointer',
                        transform: transportMode === 'ground' ? 'scale(1.025)' : 'scale(1)',
                        boxShadow: transportMode === 'ground'
                          ? '0 8px 20px rgba(245, 158, 11, 0.2)'
                          : '0 2px 6px rgba(0,0,0,0.02)',
                        transition: 'all 0.25s cubic-bezier(0.4, 0, 0.2, 1)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                      }}
                    >
                      <span style={{ fontWeight: 800, color: transportMode === 'ground' ? '#92400E' : '#0F172A', fontSize: 14.5 }}>
                        🚛 Ground truck
                      </span>
                      {transportMode === 'ground' && <Tag color="gold" style={{ fontWeight: 800, borderRadius: 9999 }}>✓ Active</Tag>}
                    </div>
                  </Col>
                </Row>
              </div>

              <div>
                <Text strong style={{ fontSize: 13, color: '#475569', display: 'block', marginBottom: 8 }}>
                  Destination country / region
                </Text>
                <Select
                  value={destinationCountry}
                  onChange={setDestinationCountry}
                  size="large"
                  style={{ width: '100%', maxWidth: 360 }}
                >
                  {transportMode === 'air' ? (
                    <>
                      <Select.Option value="France">France (CDG Paris)</Select.Option>
                      <Select.Option value="Hong Kong">Hong Kong (HKG)</Select.Option>
                      <Select.Option value="Japan">Japan (NRT Tokyo)</Select.Option>
                      <Select.Option value="Australia">Australia (SYD Sydney)</Select.Option>
                      <Select.Option value="United Kingdom">United Kingdom (LHR London)</Select.Option>
                      <Select.Option value="United States">United States (LAX / JFK)</Select.Option>
                      <Select.Option value="Thailand">Thailand (BKK Bangkok)</Select.Option>
                    </>
                  ) : (
                    <>
                      <Select.Option value="Cambodia">Cambodia (Phnom Penh)</Select.Option>
                      <Select.Option value="Laos">Laos (Vientiane)</Select.Option>
                      <Select.Option value="Thailand">Thailand (Bangkok)</Select.Option>
                      <Select.Option value="China">China (Guangzhou / Kunming)</Select.Option>
                    </>
                  )}
                </Select>
              </div>
            </Card>

            {/* 2. Horses and stall class */}
            <Card style={{ borderRadius: 18, marginBottom: 24, border: '1px solid #e2e8f0' }}>
              <Flex justify="space-between" align="center" style={{ marginBottom: 16 }}>
                <div>
                  <Title level={4} style={{ fontWeight: 800, margin: 0, color: '#0f172a' }}>
                    2. Horses and stall class
                  </Title>
                  <Text style={{ color: '#64748b', fontSize: 13 }}>
                    Select the stall class each of the horses will use.
                  </Text>
                </div>
                <Button
                  size="small"
                  onClick={() =>
                    setCalcHorses([
                      ...calcHorses,
                      { id: Date.now(), name: `Ngựa ${calcHorses.length + 1}`, stallClass: 'shared' },
                    ])
                  }
                  style={{ fontWeight: 700 }}
                >
                  + Add Horse
                </Button>
              </Flex>

              <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                {calcHorses.map((horse, idx) => (
                  <div
                    key={horse.id}
                    style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      padding: '12px 16px',
                      backgroundColor: '#f8fafc',
                      borderRadius: 12,
                      border: '1px solid #e2e8f0',
                      flexWrap: 'wrap',
                      gap: 12,
                    }}
                  >
                    <div>
                      <div style={{ fontWeight: 800, color: '#0f172a' }}>{horse.name}</div>
                      <div style={{ fontSize: 12, color: '#64748b' }}>Racehorse #{idx + 1}</div>
                    </div>

                    <Select
                      value={horse.stallClass}
                      onChange={(val) => {
                        const updated = [...calcHorses];
                        updated[idx].stallClass = val;
                        setCalcHorses(updated);
                      }}
                      style={{ width: 170 }}
                    >
                      <Select.Option value="shared">Shared (× 1.0)</Select.Option>
                      <Select.Option value="comfort">Comfort (× 1.4)</Select.Option>
                      <Select.Option value="private">Private (× 2.2)</Select.Option>
                    </Select>
                  </div>
                ))}
              </div>
            </Card>

            {/* 3. Options */}
            <Card style={{ borderRadius: 18, border: '1px solid #e2e8f0' }}>
              <Title level={4} style={{ fontWeight: 800, marginBottom: 16, color: '#0f172a' }}>
                3. Options
              </Title>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                <div
                  onClick={() => setOptClimateControl(!optClimateControl)}
                  style={{
                    padding: '14px 18px',
                    borderRadius: 14,
                    border: optClimateControl ? '2px solid #F59E0B' : '1.5px solid #e2e8f0',
                    backgroundColor: optClimateControl ? '#FFFBEB' : '#ffffff',
                    boxShadow: optClimateControl ? '0 6px 18px rgba(245, 158, 11, 0.16)' : '0 1px 3px rgba(0,0,0,0.02)',
                    transform: optClimateControl ? 'scale(1.015)' : 'scale(1)',
                    transition: 'all 0.25s cubic-bezier(0.4, 0, 0.2, 1)',
                    cursor: 'pointer',
                  }}
                >
                  <Checkbox
                    checked={optClimateControl}
                    onChange={(e) => setOptClimateControl(e.target.checked)}
                    onClick={(e) => e.stopPropagation()}
                  >
                    <span style={{ fontWeight: 700, color: optClimateControl ? '#92400E' : '#0f172a', fontSize: 14.5 }}>
                      ❄️ Climate-controlled stall and special care
                    </span>
                  </Checkbox>
                  <Text style={{ display: 'block', fontSize: 12.5, color: optClimateControl ? '#B45309' : '#64748b', marginLeft: 24, marginTop: 4 }}>
                    Extra care in cabin 16-19°C, hay bags and electrolytes provided. Surcharges +10% to freight.
                  </Text>
                </div>

                <div
                  onClick={() => setOptExpress(!optExpress)}
                  style={{
                    padding: '14px 18px',
                    borderRadius: 14,
                    border: optExpress ? '2px solid #F59E0B' : '1.5px solid #e2e8f0',
                    backgroundColor: optExpress ? '#FFFBEB' : '#ffffff',
                    boxShadow: optExpress ? '0 6px 18px rgba(245, 158, 11, 0.16)' : '0 1px 3px rgba(0,0,0,0.02)',
                    transform: optExpress ? 'scale(1.015)' : 'scale(1)',
                    transition: 'all 0.25s cubic-bezier(0.4, 0, 0.2, 1)',
                    cursor: 'pointer',
                  }}
                >
                  <Checkbox
                    checked={optExpress}
                    onChange={(e) => setOptExpress(e.target.checked)}
                    onClick={(e) => e.stopPropagation()}
                  >
                    <span style={{ fontWeight: 700, color: optExpress ? '#92400E' : '#0f172a', fontSize: 14.5 }}>
                      ⚡ Express departure
                    </span>
                  </Checkbox>
                  <Text style={{ display: 'block', fontSize: 12.5, color: optExpress ? '#B45309' : '#64748b', marginLeft: 24, marginTop: 4 }}>
                    Departure in under 7 days, adds +15% to freight.
                  </Text>
                </div>

                <div
                  onClick={() => setOptInsurance(!optInsurance)}
                  style={{
                    padding: '14px 18px',
                    borderRadius: 14,
                    border: optInsurance ? '2px solid #F59E0B' : '1.5px solid #e2e8f0',
                    backgroundColor: optInsurance ? '#FFFBEB' : '#ffffff',
                    boxShadow: optInsurance ? '0 6px 18px rgba(245, 158, 11, 0.16)' : '0 1px 3px rgba(0,0,0,0.02)',
                    transform: optInsurance ? 'scale(1.015)' : 'scale(1)',
                    transition: 'all 0.25s cubic-bezier(0.4, 0, 0.2, 1)',
                    cursor: 'pointer',
                  }}
                >
                  <Checkbox
                    checked={optInsurance}
                    onChange={(e) => setOptInsurance(e.target.checked)}
                    onClick={(e) => e.stopPropagation()}
                  >
                    <span style={{ fontWeight: 700, color: optInsurance ? '#92400E' : '#0f172a', fontSize: 14.5 }}>
                      🛡️ Transit insurance
                    </span>
                  </Checkbox>
                  <Text style={{ display: 'block', fontSize: 12.5, color: optInsurance ? '#B45309' : '#64748b', marginLeft: 24, marginTop: 4 }}>
                    Covers illness/injury, transit up to full sum, 1% of the declared value.
                  </Text>
                  {optInsurance && (
                    <div style={{ marginLeft: 24, marginTop: 10 }} onClick={(e) => e.stopPropagation()}>
                      <Text style={{ fontSize: 12.5, color: '#475569', marginRight: 8, fontWeight: 600 }}>
                        Declared value (USD):
                      </Text>
                      <InputNumber
                        value={declaredValue}
                        onChange={setDeclaredValue}
                        min={5000}
                        max={1000000}
                        step={5000}
                        formatter={(value) => `$ ${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')}
                        parser={(value) => value.replace(/\$\s?|(,*)/g, '')}
                        style={{ width: 170, borderRadius: 8 }}
                      />
                    </div>
                  )}
                </div>

                <div
                  onClick={() => setOptOffPeak(!optOffPeak)}
                  style={{
                    padding: '14px 18px',
                    borderRadius: 14,
                    border: optOffPeak ? '2px solid #F59E0B' : '1.5px solid #e2e8f0',
                    backgroundColor: optOffPeak ? '#FFFBEB' : '#ffffff',
                    boxShadow: optOffPeak ? '0 6px 18px rgba(245, 158, 11, 0.16)' : '0 1px 3px rgba(0,0,0,0.02)',
                    transform: optOffPeak ? 'scale(1.015)' : 'scale(1)',
                    transition: 'all 0.25s cubic-bezier(0.4, 0, 0.2, 1)',
                    cursor: 'pointer',
                  }}
                >
                  <Checkbox
                    checked={optOffPeak}
                    onChange={(e) => setOptOffPeak(e.target.checked)}
                    onClick={(e) => e.stopPropagation()}
                  >
                    <span style={{ fontWeight: 700, color: optOffPeak ? '#92400E' : '#0f172a', fontSize: 14.5 }}>
                      🏷️ Performance off-peak flight
                    </span>
                  </Checkbox>
                  <Text style={{ display: 'block', fontSize: 12.5, color: optOffPeak ? '#B45309' : '#64748b', marginLeft: 24, marginTop: 4 }}>
                    Save $500 off freight by choosing flexible mid-week slots.
                  </Text>
                </div>
              </div>
            </Card>
          </Col>

          {/* Cột phải: Bảng Báo Giá Chi Tiết (Sticky Breakdown Card) */}
          <Col xs={24} lg={9}>
            <div
              style={{
                position: 'sticky',
                top: 90,
                background: '#ffffff',
                borderRadius: 20,
                border: '1px solid #e2e8f0',
                boxShadow: '0 8px 30px rgba(0, 0, 0, 0.06)',
                padding: 24,
              }}
            >
              <div style={{ borderBottom: '1px solid #f1f5f9', paddingBottom: 16, marginBottom: 18 }}>
                <Flex justify="space-between" align="center">
                  <Title level={4} style={{ margin: 0, fontWeight: 900, color: '#0f172a' }}>
                    Quote Breakdown
                  </Title>
                  <Tag color="gold" style={{ fontWeight: 800 }}>ESTIMATE</Tag>
                </Flex>
                <Text style={{ color: '#64748b', fontSize: 13, marginTop: 4, display: 'block' }}>
                  {transportMode === 'air' ? 'Air Freight' : 'Ground Truck'} to {destinationCountry} • {calcHorses.length} horses
                </Text>
              </div>

              {/* Chi tiết từng mục */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10, fontSize: 13 }}>
                <Flex justify="space-between">
                  <span style={{ color: '#64748b' }}>Transport base</span>
                  <span style={{ fontWeight: 700, color: '#0f172a' }}>
                    ${quoteCalculation.transportBase.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                  </span>
                </Flex>

                {quoteCalculation.volumeDiscount > 0 && (
                  <Flex justify="space-between">
                    <span style={{ color: '#059669' }}>Volume / Off-peak discount</span>
                    <span style={{ fontWeight: 700, color: '#059669' }}>
                      -${quoteCalculation.volumeDiscount.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                    </span>
                  </Flex>
                )}

                <Flex justify="space-between">
                  <span style={{ color: '#64748b' }}>Fuel surcharge (3%)</span>
                  <span style={{ fontWeight: 700 }}>
                    +${quoteCalculation.fuelSurcharge.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                  </span>
                </Flex>

                {optClimateControl && (
                  <Flex justify="space-between">
                    <span style={{ color: '#64748b' }}>Climate-control & care (+10%)</span>
                    <span style={{ fontWeight: 700 }}>
                      +${quoteCalculation.climateControlFee.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                    </span>
                  </Flex>
                )}

                {optExpress && (
                  <Flex justify="space-between">
                    <span style={{ color: '#64748b' }}>Express departure (+15%)</span>
                    <span style={{ fontWeight: 700 }}>
                      +${quoteCalculation.expressFee.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                    </span>
                  </Flex>
                )}

                <Flex justify="space-between">
                  <span style={{ color: '#64748b' }}>Groom & handling services</span>
                  <span style={{ fontWeight: 700 }}>
                    +${quoteCalculation.groomFee.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                  </span>
                </Flex>

                <Flex justify="space-between">
                  <span style={{ color: '#64748b' }}>Airport / Border & customs</span>
                  <span style={{ fontWeight: 700 }}>
                    +${quoteCalculation.customsFee.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                  </span>
                </Flex>

                {quoteCalculation.quarantineFee > 0 && (
                  <Flex justify="space-between">
                    <span style={{ color: '#64748b' }}>Destination quarantine</span>
                    <span style={{ fontWeight: 700 }}>
                      +${quoteCalculation.quarantineFee.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                    </span>
                  </Flex>
                )}

                {optInsurance && (
                  <Flex justify="space-between">
                    <span style={{ color: '#64748b' }}>Transit insurance (1%)</span>
                    <span style={{ fontWeight: 700 }}>
                      +${quoteCalculation.insuranceFee.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                    </span>
                  </Flex>
                )}

                <Flex justify="space-between">
                  <span style={{ color: '#64748b' }}>Transit registration</span>
                  <span style={{ fontWeight: 700 }}>
                    +${quoteCalculation.transitRegFee.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                  </span>
                </Flex>
              </div>

              {/* Hộp Tổng Tiền Ước Tính Lớn Khớp Figma */}
              <div
                style={{
                  marginTop: 20,
                  backgroundColor: '#0f172a',
                  color: '#ffffff',
                  borderRadius: 14,
                  padding: '16px 20px',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                }}
              >
                <div>
                  <div style={{ fontSize: 12, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                    Estimated Total
                  </div>
                  <div style={{ fontSize: 11, color: '#cbd5e1' }}>
                    ~${quoteCalculation.perHorse.toLocaleString('en-US', { maximumFractionDigits: 0 })} / horse
                  </div>
                </div>
                <div style={{ fontWeight: 900, fontSize: 26, color: '#FBA919' }}>
                  ${quoteCalculation.totalEstimated.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </div>
              </div>

              <Text style={{ fontSize: 11, color: '#94a3b8', display: 'block', marginTop: 10, lineHeight: 1.4 }}>
                * Báo giá mang tính chất tham khảo. Giá cuối cùng sẽ được xác nhận sau khi Chuyên viên Điều phối Quốc tế phê duyệt hồ sơ vận chuyển.
              </Text>

              {/* Nút Hành Động */}
              <div style={{ marginTop: 20, display: 'flex', flexDirection: 'column', gap: 10 }}>
                <Button
                  type="primary"
                  block
                  size="large"
                  onClick={handleContinueBooking}
                  style={{
                    backgroundColor: '#FBA919',
                    borderColor: '#FBA919',
                    color: '#0f172a',
                    fontWeight: 800,
                    height: 46,
                    borderRadius: 12,
                    boxShadow: '0 4px 14px rgba(251, 169, 25, 0.35)',
                  }}
                >
                  Continue to book Transport →
                </Button>

                <Button
                  block
                  icon={<ReloadOutlined />}
                  onClick={handleResetCalculator}
                  style={{
                    borderRadius: 12,
                    fontWeight: 600,
                    color: '#64748b',
                  }}
                >
                  Reset calculator
                </Button>
              </div>
            </div>
          </Col>
        </Row>
      )}
    </div>
  );
}
