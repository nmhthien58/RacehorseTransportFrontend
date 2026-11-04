import { useCallback, useEffect, useState } from 'react';
import {
  Alert,
  Button,
  Checkbox,
  Col,
  Descriptions,
  Drawer,
  Empty,
  Flex,
  Form,
  Input,
  InputNumber,
  Popconfirm,
  Row,
  Select,
  Space,
  Spin,
  Switch,
  Table,
  Tabs,
  Tag,
  Typography,
  message,
} from 'antd';
import { DeleteOutlined, PlusOutlined } from '@ant-design/icons';
import { useTranslation } from 'react-i18next';
import countryService from '@services/countryService';
import documentTypeService from '@services/documentTypeService';
import { invalidateCountryCatalog } from '@hooks/useCountryCatalog';
import { unwrapData, unwrapList, getErrorMessage } from '@utils/apiHelpers';
import PriceValueEditor from './PriceValueEditor';
import { REQUIREMENT_DIRECTIONS, REQUIREMENT_DIRECTION_COLORS, priceInputAffix } from '../constants/pricing';

const { Text, Paragraph } = Typography;

/**
 * Cấu hình một nước (R-18): đường bộ, đường bay + sân bay, giấy tờ theo chiều xuất / quá cảnh / nhập, phí riêng.
 * @param {Object} props
 * @param {string|null} props.countryCode - Nước đang mở; null = đóng
 * @param {Function} props.onClose
 * @param {Function} props.onChanged - Gọi sau mỗi lần lưu để trang danh sách tải lại
 * @returns {JSX.Element}
 */
export default function CountryConfigDrawer({ countryCode, onClose, onChanged }) {
  const { t, i18n } = useTranslation();
  const [country, setCountry] = useState(null);
  const [docTypes, setDocTypes] = useState([]);
  const [busy, setBusy] = useState(false);
  const [airportForm] = Form.useForm();
  const [requirementForm] = Form.useForm();
  const [generalForm] = Form.useForm();

  const name = country ? (i18n.language?.startsWith('en') ? country.nameEn : country.nameVi) : '';

  const applyDetail = useCallback(
    (detail) => {
      setCountry(detail);
      generalForm.setFieldsValue({ nameVi: detail.nameVi, nameEn: detail.nameEn, sortOrder: detail.sortOrder });
    },
    [generalForm],
  );

  // Đang tải khi chi tiết trong state chưa phải của nước đang mở
  const loading = Boolean(countryCode) && country?.countryCode !== countryCode;

  useEffect(() => {
    if (!countryCode) return undefined;
    let active = true;
    Promise.all([countryService.getCountry(countryCode), documentTypeService.getLookup()])
      .then(([detailRes, typesRes]) => {
        if (!active) return;
        applyDetail(unwrapData(detailRes));
        setDocTypes(unwrapList(typesRes));
      })
      .catch((err) => message.error(getErrorMessage(err)));
    return () => {
      active = false;
    };
  }, [countryCode, applyDetail]);

  // Mọi API cấu hình nước trả về chi tiết mới nhất -> dùng luôn
  const run = async (call, successKey) => {
    setBusy(true);
    try {
      const res = await call();
      const detail = unwrapData(res);
      if (detail?.countryCode) applyDetail(detail);
      else applyDetail(unwrapData(await countryService.getCountry(countryCode)));
      invalidateCountryCatalog();
      onChanged?.();
      if (successKey) message.success(t(successKey));
      return true;
    } catch (err) {
      message.error(getErrorMessage(err));
      return false;
    } finally {
      setBusy(false);
    }
  };

  const saveFreight = (mode, patch) => {
    const current = mode === 'Ground' ? country.groundFreight : country.airFreight;
    const value = patch.value ?? current?.value;
    if (!value || value <= 0) {
      message.warning(t('countryConfig.enterRateFirst'));
      return Promise.resolve(false);
    }
    return run(
      () => countryService.setFreight(country.countryCode, mode, { value, isActive: patch.isActive ?? current?.isActive ?? true }),
      'countryConfig.saved',
    );
  };

  const freightBlock = (mode) => {
    const freight = mode === 'Ground' ? country.groundFreight : country.airFreight;
    const unit = mode === 'Ground' ? t('priceConfig.unit.PerKmPerHorse') : t('priceConfig.unit.PerHorse');
    const available = mode === 'Ground' ? country.groundAvailable : country.airAvailable;
    return (
      <div style={{ padding: 16, border: '1px solid #f0f0f0', borderRadius: 10, marginBottom: 16 }}>
        <Flex justify="space-between" align="center" wrap="wrap" gap={12}>
          <Space direction="vertical" size={2}>
            <Text strong>{mode === 'Ground' ? t('countryConfig.groundTitle') : t('countryConfig.airTitle')}</Text>
            <Text type="secondary" style={{ fontSize: 12.5 }}>
              {available ? t('countryConfig.customersCanChoose') : t('countryConfig.customersCannotChoose')}
            </Text>
          </Space>
          <Space>
            <Text>{t('countryConfig.accepting')}</Text>
            <Switch
              checked={Boolean(freight?.isActive)}
              loading={busy}
              onChange={(checked) => saveFreight(mode, { isActive: checked })}
            />
          </Space>
        </Flex>
        <Flex align="center" gap={10} style={{ marginTop: 12 }} wrap="wrap">
          <Text>{t('countryConfig.rate')}:</Text>
          <PriceValueEditor
            value={freight?.value ?? null}
            min={0}
            step={mode === 'Ground' ? 0.1 : 100}
            prefix="$"
            suffix={unit}
            onSave={(v) => saveFreight(mode, { value: v, isActive: freight?.isActive ?? false })}
          />
          {!freight && <Text type="warning">{t('countryConfig.noRateYet')}</Text>}
        </Flex>
      </div>
    );
  };

  const airportColumns = [
    { title: 'IATA', dataIndex: 'iataCode', width: 80, render: (v) => <Text strong>{v}</Text> },
    { title: t('countryConfig.airportName'), dataIndex: 'name' },
    { title: t('countryConfig.city'), dataIndex: 'city', render: (v) => v || '—' },
    {
      title: t('countryConfig.open'),
      dataIndex: 'isActive',
      width: 90,
      render: (v, a) => (
        <Switch
          size="small"
          checked={v}
          loading={busy}
          onChange={(checked) => run(() => countryService.setAirportActive(a.airportId, checked), 'countryConfig.saved')}
        />
      ),
    },
  ];

  const addAirport = async () => {
    const values = await airportForm.validateFields().catch(() => null);
    if (!values) return;
    const ok = await run(() => countryService.addAirport(country.countryCode, values), 'countryConfig.airportAdded');
    if (ok) airportForm.resetFields();
  };

  const docTypeOf = (id) => docTypes.find((d) => d.docTypeId === id);

  const requirementColumns = [
    {
      title: t('countryConfig.direction'),
      dataIndex: 'direction',
      width: 110,
      render: (v) => <Tag color={REQUIREMENT_DIRECTION_COLORS[v]}>{t(`countryConfig.directions.${v}`)}</Tag>,
    },
    {
      title: t('countryConfig.document'),
      dataIndex: 'docTypeName',
      render: (v, r) => (
        <div>
          <Text>{v}</Text>
          {docTypeOf(r.docTypeId)?.providedBy === 'Company' && (
            <Tag color="blue" style={{ marginLeft: 6 }}>
              {t('customerDossier.companyProvides')}
            </Tag>
          )}
          {!r.isMandatory && <Tag style={{ marginLeft: 6 }}>{t('customerDossier.optional')}</Tag>}
          {r.regulationNote && <div style={{ fontSize: 12, color: '#64748b' }}>{r.regulationNote}</div>}
        </div>
      ),
    },
    {
      title: t('countryConfig.validity'),
      dataIndex: 'validityDays',
      width: 100,
      render: (v) => (v ? t('countryConfig.days', { count: v }) : '—'),
    },
    {
      title: t('countryConfig.processing'),
      dataIndex: 'processingDays',
      width: 110,
      render: (v) => (v != null ? t('countryConfig.days', { count: v }) : '—'),
    },
    {
      title: '',
      key: 'del',
      width: 48,
      render: (_, r) => (
        <Popconfirm
          title={t('countryConfig.deleteRequirement')}
          onConfirm={() => run(() => countryService.deleteRequirement(r.requirementId), 'countryConfig.saved')}
        >
          <Button type="text" danger size="small" icon={<DeleteOutlined />} />
        </Popconfirm>
      ),
    },
  ];

  const addRequirement = async () => {
    const values = await requirementForm.validateFields().catch(() => null);
    if (!values) return;
    const ok = await run(
      () =>
        countryService.createRequirement({
          countryCode: country.countryCode,
          direction: values.direction,
          docTypeId: values.docTypeId,
          validityDays: values.validityDays || null,
          processingDays: values.processingDays ?? null,
          isMandatory: values.isMandatory ?? true,
          regulationNote: values.regulationNote?.trim() || null,
        }),
      'countryConfig.requirementAdded',
    );
    if (ok) requirementForm.resetFields();
  };

  const feeColumns = [
    { title: t('priceConfig.name'), dataIndex: 'itemName' },
    {
      title: t('priceConfig.mode'),
      dataIndex: 'transportMode',
      width: 110,
      render: (v) => (v ? t(`priceConfig.modes.${v}`) : t('priceConfig.modes.any')),
    },
    {
      title: t('priceConfig.value'),
      dataIndex: 'value',
      width: 240,
      render: (v, item) => (
        <PriceValueEditor
          value={v}
          step={item.calcType === 'Percent' ? 1 : 10}
          {...priceInputAffix(item.calcType, t)}
          onSave={(next) => run(() => countryService.updatePriceItem(item.priceItemId, { ...item, value: next }), 'countryConfig.saved')}
        />
      ),
    },
    {
      title: t('priceConfig.active'),
      dataIndex: 'isActive',
      width: 80,
      render: (v, item) => (
        <Switch
          size="small"
          checked={v}
          onChange={(checked) => run(() => countryService.setPriceItemActive(item.priceItemId, checked), 'countryConfig.saved')}
        />
      ),
    },
  ];

  const saveGeneral = async () => {
    const values = await generalForm.validateFields().catch(() => null);
    if (!values) return;
    await run(() => countryService.updateCountry(country.countryCode, values), 'countryConfig.saved');
  };

  const tabs = country
    ? [
        {
          key: 'modes',
          label: t('countryConfig.tabs.modes'),
          children: (
            <>
              {freightBlock('Ground')}
              {freightBlock('Air')}
              <Text strong>{t('countryConfig.airports')}</Text>
              <Paragraph type="secondary" style={{ fontSize: 12.5, marginBottom: 8 }}>
                {t('countryConfig.airportsHint')}
              </Paragraph>
              <Table
                rowKey="airportId"
                size="small"
                pagination={false}
                columns={airportColumns}
                dataSource={country.airports}
                locale={{ emptyText: <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description={t('countryConfig.noAirports')} /> }}
              />
              <Form form={airportForm} layout="inline" style={{ marginTop: 12, rowGap: 8 }}>
                <Form.Item name="iataCode" rules={[{ required: true, pattern: /^[A-Za-z]{3}$/, message: t('countryConfig.iataInvalid') }]}>
                  <Input placeholder="IATA" style={{ width: 80 }} maxLength={3} />
                </Form.Item>
                <Form.Item name="name" rules={[{ required: true, message: t('countryConfig.airportNameRequired') }]}>
                  <Input placeholder={t('countryConfig.airportName')} style={{ width: 220 }} />
                </Form.Item>
                <Form.Item name="city">
                  <Input placeholder={t('countryConfig.city')} style={{ width: 140 }} />
                </Form.Item>
                <Button icon={<PlusOutlined />} onClick={addAirport} loading={busy}>
                  {t('countryConfig.addAirport')}
                </Button>
              </Form>
            </>
          ),
        },
        {
          key: 'documents',
          label: t('countryConfig.tabs.documents', { count: country.requirements.length }),
          children: (
            <>
              <Paragraph type="secondary" style={{ fontSize: 12.5 }}>
                {t('countryConfig.documentsHint')}
              </Paragraph>
              <Table
                rowKey="requirementId"
                size="small"
                pagination={false}
                columns={requirementColumns}
                dataSource={country.requirements}
                scroll={{ x: 560 }}
              />
              <Form form={requirementForm} layout="vertical" style={{ marginTop: 16 }} initialValues={{ isMandatory: true }}>
                <Row gutter={12}>
                  <Col xs={24} sm={8}>
                    <Form.Item name="direction" label={t('countryConfig.direction')} rules={[{ required: true }]}>
                      <Select
                        options={REQUIREMENT_DIRECTIONS.map((d) => ({ value: d, label: t(`countryConfig.directions.${d}`) }))}
                      />
                    </Form.Item>
                  </Col>
                  <Col xs={24} sm={16}>
                    <Form.Item name="docTypeId" label={t('countryConfig.document')} rules={[{ required: true }]}>
                      <Select
                        showSearch
                        optionFilterProp="label"
                        options={docTypes.map((d) => ({ value: d.docTypeId, label: d.name }))}
                      />
                    </Form.Item>
                  </Col>
                  <Col xs={12} sm={6}>
                    <Form.Item name="validityDays" label={t('countryConfig.validityDays')}>
                      <InputNumber min={1} style={{ width: '100%' }} />
                    </Form.Item>
                  </Col>
                  <Col xs={12} sm={6}>
                    <Form.Item name="processingDays" label={t('countryConfig.processingDays')}>
                      <InputNumber min={0} max={365} style={{ width: '100%' }} />
                    </Form.Item>
                  </Col>
                  <Col xs={24} sm={12}>
                    <Form.Item name="regulationNote" label={t('countryConfig.note')} rules={[{ max: 255 }]}>
                      <Input />
                    </Form.Item>
                  </Col>
                </Row>
                <Flex justify="space-between" align="center">
                  <Form.Item name="isMandatory" valuePropName="checked" style={{ marginBottom: 0 }}>
                    <Checkbox>{t('countryConfig.mandatory')}</Checkbox>
                  </Form.Item>
                  <Button icon={<PlusOutlined />} onClick={addRequirement} loading={busy}>
                    {t('countryConfig.addRequirement')}
                  </Button>
                </Flex>
              </Form>
            </>
          ),
        },
        {
          key: 'fees',
          label: t('countryConfig.tabs.fees', { count: country.countryFees.length }),
          children: (
            <>
              <Paragraph type="secondary" style={{ fontSize: 12.5 }}>
                {t('countryConfig.feesHint')}
              </Paragraph>
              <Table
                rowKey="priceItemId"
                size="small"
                pagination={false}
                columns={feeColumns}
                dataSource={country.countryFees}
                locale={{ emptyText: <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description={t('countryConfig.noFees')} /> }}
              />
            </>
          ),
        },
        {
          key: 'general',
          label: t('countryConfig.tabs.general'),
          children: (
            <>
              <Flex justify="space-between" align="center" style={{ marginBottom: 16 }}>
                <Space direction="vertical" size={0}>
                  <Text strong>{t('countryConfig.inService')}</Text>
                  <Text type="secondary" style={{ fontSize: 12.5 }}>
                    {t('countryConfig.inServiceHint')}
                  </Text>
                </Space>
                <Switch
                  checked={country.isActive}
                  loading={busy}
                  onChange={(checked) => run(() => countryService.setCountryActive(country.countryCode, checked), 'countryConfig.saved')}
                />
              </Flex>
              <Form form={generalForm} layout="vertical">
                <Row gutter={12}>
                  <Col xs={24} sm={10}>
                    <Form.Item name="nameVi" label={t('countryConfig.nameVi')} rules={[{ required: true, max: 100 }]}>
                      <Input />
                    </Form.Item>
                  </Col>
                  <Col xs={24} sm={10}>
                    <Form.Item name="nameEn" label={t('countryConfig.nameEn')} rules={[{ required: true, max: 100 }]}>
                      <Input />
                    </Form.Item>
                  </Col>
                  <Col xs={24} sm={4}>
                    <Form.Item name="sortOrder" label={t('countryConfig.sortOrder')}>
                      <InputNumber min={0} max={9999} style={{ width: '100%' }} />
                    </Form.Item>
                  </Col>
                </Row>
                <Button type="primary" onClick={saveGeneral} loading={busy}>
                  {t('common.save')}
                </Button>
              </Form>
            </>
          ),
        },
      ]
    : [];

  return (
    <Drawer
      open={Boolean(countryCode)}
      onClose={onClose}
      width={760}
      title={country ? `${name} (${country.countryCode})` : countryCode}
      destroyOnHidden
    >
      {loading || !country ? (
        <div style={{ textAlign: 'center', padding: 48 }}>
          <Spin />
        </div>
      ) : (
        <>
          <Descriptions size="small" column={{ xs: 1, sm: 3 }} style={{ marginBottom: 12 }}>
            <Descriptions.Item label={t('countryConfig.ground')}>
              {country.groundAvailable ? <Tag color="green">{t('countryConfig.on')}</Tag> : <Tag>{t('countryConfig.off')}</Tag>}
            </Descriptions.Item>
            <Descriptions.Item label={t('countryConfig.air')}>
              {country.airAvailable ? <Tag color="green">{t('countryConfig.on')}</Tag> : <Tag>{t('countryConfig.off')}</Tag>}
            </Descriptions.Item>
            <Descriptions.Item label={t('countryConfig.airports')}>
              {country.activeAirportCount}/{country.airportCount}
            </Descriptions.Item>
          </Descriptions>
          {country.warnings.length > 0 && (
            <Alert
              type="warning"
              showIcon
              style={{ marginBottom: 12 }}
              message={country.warnings.map((w) => t(`countryConfig.warnings.${w}`)).join(' ')}
            />
          )}
          <Tabs items={tabs} />
        </>
      )}
    </Drawer>
  );
}
