import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  Alert,
  Button,
  Card,
  Col,
  Flex,
  Form,
  Input,
  InputNumber,
  Modal,
  Row,
  Segmented,
  Switch,
  Table,
  Tag,
  Typography,
  message,
} from 'antd';
import { GlobalOutlined, PlusOutlined, SettingOutlined, WarningOutlined } from '@ant-design/icons';
import { useTranslation } from 'react-i18next';
import PageHeader from '@components/layout/PageHeader';
import countryService from '@services/countryService';
import { invalidateCountryCatalog } from '@hooks/useCountryCatalog';
import { unwrapData, unwrapList, getErrorMessage } from '@utils/apiHelpers';
import CountryConfigDrawer from '../components/CountryConfigDrawer';
import { formatPriceValue } from '../constants/pricing';

const { Text } = Typography;

/**
 * Trang "Quốc gia & tuyến" của Manager (R-18): nước nào nhận làm nước đi / nước đến,
 * đường bộ / đường bay (= cước đang bật), sân bay, giấy tờ, phí riêng.
 * @returns {JSX.Element}
 */
export default function CountriesPage() {
  const { t, i18n } = useTranslation();
  const [countries, setCountries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [reloadKey, setReloadKey] = useState(0);
  const [openCode, setOpenCode] = useState(null);
  const [filter, setFilter] = useState('all');
  const [search, setSearch] = useState('');
  const [toggling, setToggling] = useState(null);
  const [createOpen, setCreateOpen] = useState(false);
  const [creating, setCreating] = useState(false);
  const [createForm] = Form.useForm();

  const reload = useCallback(() => setReloadKey((k) => k + 1), []);

  useEffect(() => {
    let active = true;
    countryService
      .getCountries()
      .then((res) => active && setCountries(unwrapList(res)))
      .catch((err) => message.error(getErrorMessage(err)))
      .finally(() => active && setLoading(false));
    return () => {
      active = false;
    };
  }, [reloadKey]);

  const nameOf = useCallback((c) => (i18n.language?.startsWith('en') ? c.nameEn : c.nameVi), [i18n.language]);

  const shown = useMemo(() => {
    const q = search.trim().toLowerCase();
    return countries.filter((c) => {
      if (q && !`${c.nameVi} ${c.nameEn} ${c.countryCode}`.toLowerCase().includes(q)) return false;
      if (filter === 'ground') return c.groundAvailable;
      if (filter === 'air') return c.airAvailable;
      if (filter === 'warnings') return c.warnings.length > 0;
      if (filter === 'off') return !c.isActive;
      return true;
    });
  }, [countries, filter, search]);

  const stats = useMemo(
    () => ({
      active: countries.filter((c) => c.isActive).length,
      ground: countries.filter((c) => c.groundAvailable).length,
      air: countries.filter((c) => c.airAvailable).length,
      warnings: countries.filter((c) => c.warnings.length > 0).length,
    }),
    [countries],
  );

  // Bật / tắt nhanh một phương thức ngay trên bảng (giữ nguyên giá)
  const toggleMode = async (country, mode, checked) => {
    const freight = mode === 'Ground' ? country.groundFreight : country.airFreight;
    if (!freight) {
      setOpenCode(country.countryCode);
      message.info(t('countryConfig.enterRateFirst'));
      return;
    }
    setToggling(`${country.countryCode}-${mode}`);
    try {
      await countryService.setFreight(country.countryCode, mode, { value: freight.value, isActive: checked });
      invalidateCountryCatalog();
      reload();
    } catch (err) {
      message.error(getErrorMessage(err));
    } finally {
      setToggling(null);
    }
  };

  const modeCell = (country, mode) => {
    const freight = mode === 'Ground' ? country.groundFreight : country.airFreight;
    const available = mode === 'Ground' ? country.groundAvailable : country.airAvailable;
    return (
      <Flex vertical gap={2}>
        <Switch
          size="small"
          checked={Boolean(freight?.isActive)}
          disabled={!country.isActive}
          loading={toggling === `${country.countryCode}-${mode}`}
          onChange={(checked) => toggleMode(country, mode, checked)}
          style={{ width: 36 }}
        />
        <Text type="secondary" style={{ fontSize: 12 }}>
          {freight ? formatPriceValue(freight.value, freight.calcType, t) : t('countryConfig.noRateYet')}
        </Text>
        {freight?.isActive && !available && mode === 'Air' && (
          <Text type="warning" style={{ fontSize: 11.5 }}>
            {t('countryConfig.noOpenAirport')}
          </Text>
        )}
      </Flex>
    );
  };

  const columns = [
    {
      title: t('countryConfig.country'),
      key: 'name',
      render: (_, c) => (
        <Flex vertical>
          <Text strong>
            {nameOf(c)} <Text type="secondary">({c.countryCode})</Text>
          </Text>
          <Flex gap={4} wrap="wrap">
            {!c.isActive && <Tag>{t('countryConfig.inactive')}</Tag>}
            {c.isActive && !c.groundAvailable && !c.airAvailable && (
              <Tag color="purple">{t('countryConfig.transitOnly')}</Tag>
            )}
          </Flex>
        </Flex>
      ),
    },
    { title: t('countryConfig.ground'), key: 'ground', width: 140, render: (_, c) => modeCell(c, 'Ground') },
    {
      title: t('countryConfig.air'),
      key: 'air',
      width: 160,
      render: (_, c) => (
        <Flex vertical gap={2}>
          {modeCell(c, 'Air')}
          <Text type="secondary" style={{ fontSize: 12 }}>
            {t('countryConfig.airportCount', { active: c.activeAirportCount, total: c.airportCount })}
          </Text>
        </Flex>
      ),
    },
    {
      title: t('countryConfig.documentsCol'),
      key: 'docs',
      width: 170,
      render: (_, c) => (
        <Flex gap={4} wrap="wrap">
          <Tag color="orange">{t('countryConfig.directionsShort.Export', { count: c.exportDocumentCount })}</Tag>
          <Tag color="purple">{t('countryConfig.directionsShort.Transit', { count: c.transitDocumentCount })}</Tag>
          <Tag color="green">{t('countryConfig.directionsShort.Import', { count: c.importDocumentCount })}</Tag>
        </Flex>
      ),
    },
    {
      title: t('countryConfig.warningsCol'),
      key: 'warnings',
      render: (_, c) =>
        c.warnings.length === 0 ? (
          <Text type="secondary">—</Text>
        ) : (
          <Flex vertical gap={2}>
            {c.warnings.map((w) => (
              <Text key={w} type="warning" style={{ fontSize: 12 }}>
                <WarningOutlined /> {t(`countryConfig.warningsShort.${w}`)}
              </Text>
            ))}
          </Flex>
        ),
    },
    {
      title: '',
      key: 'action',
      width: 110,
      align: 'right',
      render: (_, c) => (
        <Button size="small" icon={<SettingOutlined />} onClick={() => setOpenCode(c.countryCode)}>
          {t('countryConfig.configure')}
        </Button>
      ),
    },
  ];

  const createCountry = async () => {
    const values = await createForm.validateFields().catch(() => null);
    if (!values) return;
    setCreating(true);
    try {
      const res = await countryService.createCountry({ ...values, countryCode: values.countryCode.toUpperCase() });
      const created = unwrapData(res);
      message.success(t('countryConfig.created'));
      setCreateOpen(false);
      createForm.resetFields();
      invalidateCountryCatalog();
      reload();
      setOpenCode(created?.countryCode || values.countryCode.toUpperCase());
    } catch (err) {
      message.error(getErrorMessage(err));
    } finally {
      setCreating(false);
    }
  };

  const statTile = (label, value, color) => (
    <Card size="small" style={{ borderRadius: 10 }}>
      <Text type="secondary" style={{ fontSize: 12.5 }}>
        {label}
      </Text>
      <div style={{ fontSize: 22, fontWeight: 700, color }}>{value}</div>
    </Card>
  );

  return (
    <div style={{ paddingBottom: 40 }}>
      <PageHeader
        title={t('countryConfig.title')}
        subtitle={t('countryConfig.subtitle')}
        actions={
          <Button type="primary" icon={<PlusOutlined />} onClick={() => setCreateOpen(true)}>
            {t('countryConfig.addCountry')}
          </Button>
        }
      />

      <Alert
        type="info"
        showIcon
        icon={<GlobalOutlined />}
        style={{ marginBottom: 16 }}
        message={t('countryConfig.rulesTitle')}
        description={
          <ul style={{ margin: 0, paddingLeft: 18 }}>
            <li>{t('countryConfig.rule1')}</li>
            <li>{t('countryConfig.rule2')}</li>
            <li>{t('countryConfig.rule3')}</li>
          </ul>
        }
      />

      <Row gutter={[12, 12]} style={{ marginBottom: 16 }}>
        <Col xs={12} md={6}>{statTile(t('countryConfig.statActive'), stats.active, '#1C1917')}</Col>
        <Col xs={12} md={6}>{statTile(t('countryConfig.statGround'), stats.ground, '#b45309')}</Col>
        <Col xs={12} md={6}>{statTile(t('countryConfig.statAir'), stats.air, '#2563eb')}</Col>
        <Col xs={12} md={6}>{statTile(t('countryConfig.statWarnings'), stats.warnings, stats.warnings ? '#d97706' : '#16a34a')}</Col>
      </Row>

      <Card style={{ borderRadius: 12 }} styles={{ body: { padding: 0 } }}>
        <Flex justify="space-between" align="center" wrap="wrap" gap={12} style={{ padding: '12px 16px' }}>
          <Segmented
            value={filter}
            onChange={setFilter}
            options={[
              { value: 'all', label: t('countryConfig.filters.all') },
              { value: 'ground', label: t('countryConfig.filters.ground') },
              { value: 'air', label: t('countryConfig.filters.air') },
              { value: 'warnings', label: t('countryConfig.filters.warnings') },
              { value: 'off', label: t('countryConfig.filters.off') },
            ]}
          />
          <Input.Search
            allowClear
            placeholder={t('countryConfig.search')}
            onChange={(e) => setSearch(e.target.value)}
            style={{ width: 240 }}
          />
        </Flex>
        <Table
          rowKey="countryCode"
          loading={loading}
          columns={columns}
          dataSource={shown}
          pagination={false}
          scroll={{ x: 900 }}
          onRow={(c) => ({ style: c.isActive ? undefined : { opacity: 0.6 } })}
        />
      </Card>

      <CountryConfigDrawer countryCode={openCode} onClose={() => setOpenCode(null)} onChanged={reload} />

      <Modal
        title={t('countryConfig.addCountry')}
        open={createOpen}
        onCancel={() => setCreateOpen(false)}
        onOk={createCountry}
        confirmLoading={creating}
        okText={t('countryConfig.addCountry')}
        destroyOnHidden
      >
        <Alert type="info" showIcon style={{ marginBottom: 16 }} message={t('countryConfig.addCountryHint')} />
        <Form form={createForm} layout="vertical" initialValues={{ sortOrder: 50 }}>
          <Form.Item
            name="countryCode"
            label={t('countryConfig.countryCode')}
            rules={[{ required: true, pattern: /^[A-Za-z]{2}$/, message: t('countryConfig.countryCodeInvalid') }]}
          >
            <Input maxLength={2} placeholder="NZ" style={{ width: 100, textTransform: 'uppercase' }} />
          </Form.Item>
          <Form.Item name="nameVi" label={t('countryConfig.nameVi')} rules={[{ required: true, max: 100 }]}>
            <Input placeholder="New Zealand" />
          </Form.Item>
          <Form.Item name="nameEn" label={t('countryConfig.nameEn')} rules={[{ required: true, max: 100 }]}>
            <Input placeholder="New Zealand" />
          </Form.Item>
          <Form.Item name="sortOrder" label={t('countryConfig.sortOrder')}>
            <InputNumber min={0} max={9999} />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
}
