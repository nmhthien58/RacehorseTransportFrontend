import { useCallback, useEffect, useMemo, useState } from 'react';
import { Alert, Card, Col, Empty, Flex, Row, Spin, Switch, Table, Tag, Typography, message } from 'antd';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import PageHeader from '@components/layout/PageHeader';
import countryService from '@services/countryService';
import { unwrapList, getErrorMessage } from '@utils/apiHelpers';
import { ROUTES } from '@routes/routes';
import PriceValueEditor from '../components/PriceValueEditor';
import { PRICE_CATEGORY_COLORS, PRICE_CATEGORY_ORDER, priceInputAffix } from '../constants/pricing';

const { Text, Paragraph, Link } = Typography;

/**
 * Trang "Bảng giá chung" của Manager (R-18): các dòng giá áp cho mọi nước đến
 * (hệ số hạng chuồng, chiết khấu, phụ phí, phí thủ tục chung, người chăm ngựa, bảo hiểm).
 * Cước và phí riêng của từng nước chỉnh ở trang Quốc gia.
 * @returns {JSX.Element}
 */
export default function PricingPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [reloadKey, setReloadKey] = useState(0);

  const reload = useCallback(() => setReloadKey((k) => k + 1), []);

  useEffect(() => {
    let active = true;
    countryService
      .getPriceItems({ globalOnly: true, size: 100 })
      .then((res) => active && setItems(unwrapList(res)))
      .catch((err) => message.error(getErrorMessage(err)))
      .finally(() => active && setLoading(false));
    return () => {
      active = false;
    };
  }, [reloadKey]);

  const groups = useMemo(
    () =>
      PRICE_CATEGORY_ORDER.map((category) => ({
        category,
        rows: items.filter((i) => i.category === category).sort((a, b) => a.itemCode.localeCompare(b.itemCode)),
      })).filter((g) => g.rows.length > 0),
    [items],
  );

  const save = async (item, patch) => {
    try {
      if (patch.isActive !== undefined) {
        await countryService.setPriceItemActive(item.priceItemId, patch.isActive);
      } else {
        await countryService.updatePriceItem(item.priceItemId, { ...item, ...patch });
      }
      message.success(t('countryConfig.saved'));
      reload();
      return true;
    } catch (err) {
      message.error(getErrorMessage(err));
      return false;
    }
  };

  const columns = [
    {
      title: t('priceConfig.name'),
      dataIndex: 'itemName',
      render: (v, item) => (
        <Flex vertical>
          <Text>{v}</Text>
          <Text type="secondary" style={{ fontSize: 12 }}>
            {item.itemCode}
            {item.minHorses ? ` · ${t('priceConfig.fromHorses', { count: item.minHorses })}` : ''}
          </Text>
        </Flex>
      ),
    },
    {
      title: t('priceConfig.mode'),
      dataIndex: 'transportMode',
      width: 120,
      render: (v) => (v ? <Tag color={v === 'Air' ? 'blue' : 'gold'}>{t(`priceConfig.modes.${v}`)}</Tag> : <Text type="secondary">{t('priceConfig.modes.any')}</Text>),
    },
    {
      title: t('priceConfig.value'),
      dataIndex: 'value',
      width: 260,
      render: (v, item) => (
        <PriceValueEditor
          value={v}
          step={item.calcType === 'Multiplier' ? 0.1 : item.calcType === 'Percent' ? 1 : 10}
          {...priceInputAffix(item.calcType, t)}
          onSave={(next) => save(item, { value: next })}
        />
      ),
    },
    {
      title: t('priceConfig.active'),
      dataIndex: 'isActive',
      width: 80,
      render: (v, item) => <Switch size="small" checked={v} onChange={(checked) => save(item, { isActive: checked })} />,
    },
  ];

  return (
    <div style={{ paddingBottom: 40 }}>
      <PageHeader title={t('priceConfig.title')} subtitle={t('priceConfig.subtitle')} />
      <Alert
        type="info"
        showIcon
        style={{ marginBottom: 16 }}
        message={t('priceConfig.howItWorks')}
        description={
          <span>
            {t('priceConfig.countrySpecific')}{' '}
            <Link onClick={() => navigate(ROUTES.MANAGER_COUNTRIES)}>{t('priceConfig.goToCountries')}</Link>
          </span>
        }
      />
      {loading ? (
        <div style={{ textAlign: 'center', padding: 60 }}>
          <Spin />
        </div>
      ) : groups.length === 0 ? (
        <Empty />
      ) : (
        <Row gutter={[16, 16]}>
          {groups.map((g) => (
            <Col xs={24} xl={12} key={g.category}>
              <Card
                style={{ borderRadius: 12, height: '100%' }}
                title={
                  <Flex align="center" gap={8}>
                    <Tag color={PRICE_CATEGORY_COLORS[g.category]} style={{ margin: 0 }}>
                      {t(`priceConfig.categories.${g.category}.name`)}
                    </Tag>
                  </Flex>
                }
              >
                <Paragraph type="secondary" style={{ fontSize: 12.5 }}>
                  {t(`priceConfig.categories.${g.category}.hint`)}
                </Paragraph>
                <Table rowKey="priceItemId" size="small" pagination={false} columns={columns} dataSource={g.rows} scroll={{ x: 560 }} />
              </Card>
            </Col>
          ))}
        </Row>
      )}
    </div>
  );
}
