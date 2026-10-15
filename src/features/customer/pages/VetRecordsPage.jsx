import { useEffect, useMemo, useState } from 'react';
import { Button, Card, Empty, Flex, Select, Spin, Tabs, Typography, message } from 'antd';
import { PlusOutlined } from '@ant-design/icons';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import PageHeader from '@components/layout/PageHeader';
import horseService from '@services/horseService';
import { getErrorMessage, unwrapList } from '@utils/apiHelpers';
import { ROUTES } from '@routes/routes';
import CustomerDossierPanel from '@features/customer/components/CustomerDossierPanel';
import HorseDocumentTable from '@features/customer/components/HorseDocumentTable';
import AddHorseDocumentsModal from '@features/customer/components/AddHorseDocumentsModal';

const { Text } = Typography;

/**
 * Hồ sơ thú y của khách: chọn ngựa trước, sau đó xem / bổ sung hồ sơ của con ngựa đó.
 * Tab "Hồ sơ thông quan" là giấy tờ nộp cho từng đơn vận chuyển (Flow 2).
 * Đường dẫn: /customer/vet-records?horseId=1 (thêm &add=1 để mở sẵn form bổ sung)
 */
export default function VetRecordsPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();

  const [horses, setHorses] = useState([]);
  const [horsesLoading, setHorsesLoading] = useState(true);
  // Kết quả gắn với khóa (ngựa + lần tải lại), nên đang tải = khóa hiện tại chưa có kết quả
  const [docState, setDocState] = useState({ key: null, items: [] });
  const [reloadCount, setReloadCount] = useState(0);
  const [addOpen, setAddOpen] = useState(searchParams.get('add') === '1');
  const [activeTab, setActiveTab] = useState('documents');

  const selectedHorseId = Number(searchParams.get('horseId')) || horses[0]?.horseId || null;
  const selectedHorse = useMemo(
    () => horses.find((h) => h.horseId === selectedHorseId) || null,
    [horses, selectedHorseId]
  );

  useEffect(() => {
    horseService
      .getHorses({ size: 100 })
      .then((res) => setHorses(unwrapList(res)))
      .catch((err) => message.error(getErrorMessage(err, t('horseDocs.errors.loadHorses'))))
      .finally(() => setHorsesLoading(false));
  }, [t]);

  const docsKey = `${selectedHorseId}:${reloadCount}`;
  const docsLoading = Boolean(selectedHorseId) && docState.key !== docsKey;
  const documents = docState.items;
  const reloadDocuments = () => setReloadCount((c) => c + 1);

  useEffect(() => {
    if (!selectedHorseId) return undefined;
    let active = true;
    horseService
      .getHorseDocuments(selectedHorseId)
      .then((res) => active && setDocState({ key: docsKey, items: unwrapList(res) }))
      .catch((err) => {
        if (!active) return;
        setDocState({ key: docsKey, items: [] });
        message.error(getErrorMessage(err, t('horseDocs.errors.loadDocuments')));
      });
    return () => {
      active = false;
    };
  }, [docsKey, selectedHorseId, t]);

  const selectHorse = (horseId) => {
    setSearchParams({ horseId: String(horseId) }, { replace: true });
  };

  const closeAddModal = () => {
    setAddOpen(false);
    if (searchParams.has('add')) {
      searchParams.delete('add');
      setSearchParams(searchParams, { replace: true });
    }
  };

  const handleDelete = async (doc) => {
    try {
      await horseService.deleteHorseDocument(selectedHorseId, doc.documentId);
      message.success(t('horseDocs.deleted'));
      reloadDocuments();
    } catch (err) {
      message.error(getErrorMessage(err, t('horseDocs.errors.deleteFailed')));
    }
  };

  if (horsesLoading) {
    return (
      <Flex justify="center" style={{ padding: '80px 0' }}>
        <Spin size="large" />
      </Flex>
    );
  }

  if (horses.length === 0) {
    return (
      <div style={{ maxWidth: 1100, margin: '0 auto' }}>
        <PageHeader title={t('horseDocs.pageTitle')} subtitle={t('horseDocs.pageSubtitle')} />
        <Card style={{ borderRadius: 12, borderColor: '#e2e8f0' }}>
          <Empty description={t('horseDocs.noHorses')}>
            <Button type="primary" icon={<PlusOutlined />} onClick={() => navigate(ROUTES.CUSTOMER_HORSE_NEW)}>
              {t('horses.add')}
            </Button>
          </Empty>
        </Card>
      </div>
    );
  }

  const addButton = (
    <Button
      type="primary"
      icon={<PlusOutlined />}
      onClick={() => setAddOpen(true)}
      style={{ backgroundColor: '#f59e0b', borderColor: '#f59e0b', fontWeight: 600 }}
    >
      {t('horseDocs.addButton')}
    </Button>
  );

  return (
    <div style={{ maxWidth: 1100, margin: '0 auto', paddingBottom: 40 }}>
      <PageHeader title={t('horseDocs.pageTitle')} subtitle={t('horseDocs.pageSubtitle')} />

      <Card style={{ borderRadius: 12, borderColor: '#e2e8f0', marginBottom: 16 }} styles={{ body: { padding: 16 } }}>
        <Flex align="center" gap={12} wrap>
          <Text strong>{t('horseDocs.selectHorse')}</Text>
          <Select
            value={selectedHorseId}
            onChange={selectHorse}
            style={{ minWidth: 280, flex: '1 1 280px', maxWidth: 420 }}
            options={horses.map((h) => ({
              value: h.horseId,
              label: `${h.name} · ${h.microchipNumber}`,
            }))}
            showSearch
            optionFilterProp="label"
          />
          {selectedHorse && (
            <Button type="link" onClick={() => navigate(ROUTES.CUSTOMER_HORSE_DETAIL.replace(':id', selectedHorse.horseId))}>
              {t('horseDocs.viewHorse')}
            </Button>
          )}
        </Flex>
      </Card>

      <Card style={{ borderRadius: 12, borderColor: '#e2e8f0' }} styles={{ body: { paddingTop: 8 } }}>
        <Tabs
          activeKey={activeTab}
          onChange={setActiveTab}
          tabBarExtraContent={activeTab === 'documents' ? addButton : null}
          items={[
            {
              key: 'documents',
              label: t('horseDocs.tabs.documents'),
              children: (
                <>
                  <Text type="secondary" style={{ display: 'block', marginBottom: 12, fontSize: 13 }}>
                    {t('horseDocs.documentsHint')}
                  </Text>
                  <HorseDocumentTable
                    documents={documents}
                    loading={docsLoading}
                    onDelete={handleDelete}
                    emptyAction={addButton}
                  />
                </>
              ),
            },
            {
              key: 'clearance',
              label: t('horseDocs.tabs.clearance'),
              children: <CustomerDossierPanel horseId={selectedHorseId} />,
            },
          ]}
        />
      </Card>

      <AddHorseDocumentsModal
        open={addOpen}
        horse={selectedHorse}
        onClose={closeAddModal}
        onSaved={reloadDocuments}
      />
    </div>
  );
}
