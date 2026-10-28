// Đang tạo AirWaybillCard vì chuyến chở ngựa của đơn hàng không cần số vận đơn + bản scan (FE-17, R-17)
import { useEffect, useState } from 'react';
import { Button, Card, Descriptions, Flex, Input, Space, Typography, Upload, message } from 'antd';
import { EditOutlined, FileTextOutlined, PaperClipOutlined, UploadOutlined } from '@ant-design/icons';
import { useTranslation } from 'react-i18next';
import { useAuthStore } from '@features/auth/store/authStore';
import contractService from '@services/contractService';
import fileService from '@services/fileService';
import { unwrapData, getErrorMessage } from '@utils/apiHelpers';

const { Text } = Typography;
const EDITOR_ROLES = ['FleetCoordinator', 'Admin'];
const CLOSED_TRIP_STATUSES = ['Completed', 'Cancelled'];

/**
 * Vận đơn hàng không (air waybill) của chuyến: mọi vai trò xem được chuyến đều thấy số + file;
 * điều phối / admin nhập số và tải bản scan. Chuyến chỉ chở đơn đường bộ (backend trả 400) thì không hiện gì.
 *
 * @param {{ tripId: number, tripStatus?: string }} props
 * @returns {JSX.Element|null}
 */
export default function AirWaybillCard({ tripId, tripStatus }) {
  const { t } = useTranslation();
  const hasRole = useAuthStore((s) => s.hasRole);
  const canEdit = hasRole(EDITOR_ROLES) && !CLOSED_TRIP_STATUSES.includes(tripStatus);
  const [waybill, setWaybill] = useState(null);
  const [editing, setEditing] = useState(false);
  const [number, setNumber] = useState('');
  const [file, setFile] = useState(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    let active = true;
    contractService
      .getAirWaybill(tripId)
      .then((res) => active && setWaybill(unwrapData(res)))
      .catch(() => active && setWaybill(null));
    return () => {
      active = false;
    };
  }, [tripId]);

  if (!waybill) return null;

  const startEdit = () => {
    setNumber(waybill.airWaybillNumber || '');
    setFile(null);
    setEditing(true);
  };

  const handleSave = async () => {
    if (!number.trim()) {
      message.warning(t('airWaybill.numberRequired'));
      return;
    }
    setSaving(true);
    try {
      const uploaded = file ? unwrapData(await fileService.upload(file, 'documents')) : null;
      const res = await contractService.updateAirWaybill(tripId, {
        airWaybillNumber: number.trim(),
        airWaybillFilePath: uploaded?.path || undefined,
      });
      setWaybill(unwrapData(res));
      setEditing(false);
      message.success(t('airWaybill.saved'));
    } catch (err) {
      message.error(getErrorMessage(err, t('airWaybill.saveFailed')));
    } finally {
      setSaving(false);
    }
  };

  return (
    <Card
      size="small"
      style={{ borderRadius: 12 }}
      title={
        <Space>
          <FileTextOutlined />
          {t('airWaybill.title')}
        </Space>
      }
      extra={
        canEdit && !editing ? (
          <Button size="small" icon={<EditOutlined />} onClick={startEdit}>
            {t('airWaybill.edit')}
          </Button>
        ) : null
      }
    >
      {editing ? (
        <Flex vertical gap={10} style={{ maxWidth: 420 }}>
          <Input value={number} maxLength={50} placeholder="880-12345675" onChange={(e) => setNumber(e.target.value)} />
          <Upload
            maxCount={1}
            beforeUpload={(f) => {
              setFile(f);
              return false;
            }}
            onRemove={() => setFile(null)}
            fileList={file ? [{ uid: '-1', name: file.name, status: 'done' }] : []}
            accept=".pdf,image/*"
          >
            <Button icon={<UploadOutlined />}>{t('airWaybill.chooseFile')}</Button>
          </Upload>
          <Space>
            <Button onClick={() => setEditing(false)}>{t('common.cancel')}</Button>
            <Button type="primary" loading={saving} onClick={handleSave}>
              {t('common.save')}
            </Button>
          </Space>
        </Flex>
      ) : (
        <Descriptions size="small" column={{ xs: 1, md: 2 }}>
          <Descriptions.Item label={t('airWaybill.number')}>
            {waybill.airWaybillNumber ? <Text strong>{waybill.airWaybillNumber}</Text> : <Text type="secondary">{t('airWaybill.notEntered')}</Text>}
          </Descriptions.Item>
          <Descriptions.Item label={t('airWaybill.file')}>
            {waybill.airWaybillFileUrl ? (
              <a href={waybill.airWaybillFileUrl} target="_blank" rel="noopener noreferrer">
                <PaperClipOutlined /> {t('airWaybill.openFile')}
              </a>
            ) : (
              '—'
            )}
          </Descriptions.Item>
        </Descriptions>
      )}
    </Card>
  );
}
