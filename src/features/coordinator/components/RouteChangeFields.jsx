import { useEffect, useMemo, useState } from 'react';
import { Checkbox, Select, Form, Input, InputNumber, DatePicker, Button, Typography, Tag, Row, Col } from 'antd';
import { PlusOutlined, DeleteOutlined } from '@ant-design/icons';
import { useTranslation } from 'react-i18next';
import dayjs from 'dayjs';
import RouteMap from '@components/common/map/RouteMap';
import geoService from '@services/geoService';
import { unwrapData } from '@utils/apiHelpers';

// Loại mốc của chuyến -> loại mốc của bản đồ (màu marker)
const MAP_STOP_TYPES = { PickUp: 'Pickup', DropOff: 'Dropoff' };

const { Text } = Typography;

/**
 * Các ô sửa tuyến (bỏ mốc chưa tới, chọn vị trí chèn, thêm mốc mới) đặt trong một Form có sẵn.
 * Dùng cho form đề xuất phương án (prefix ['routeChange']) và modal điều chỉnh tuyến (prefix []).
 * @param {{ checkpoints: Array<Object>, prefix?: Array<string> }} props - checkpoints: các mốc đang hiệu lực, đã sắp theo thứ tự
 */
export default function RouteChangeFields({ checkpoints, prefix = [] }) {
  const { t } = useTranslation();
  // Chỉ bỏ được mốc chưa tới, không phải điểm đi / điểm giao / điểm đón trả của đơn
  const removable = (c) => c.status === 'Pending' && !['Origin', 'Destination', 'PickUp', 'DropOff'].includes(c.checkpointType);

  // Bản đồ tuyến sau khi sửa: mốc còn giữ + mốc mới chèn sau "Chèn sau mốc" (mặc định trước điểm cuối)
  const form = Form.useFormInstance();
  const deactivated = Form.useWatch([...prefix, 'deactivateCheckpointIds'], form);
  const insertAfter = Form.useWatch([...prefix, 'insertAfterCheckpointId'], form);
  const added = Form.useWatch([...prefix, 'newCheckpoints'], form);
  const mapStops = useMemo(() => {
    const removed = deactivated || [];
    const kept = checkpoints.filter((c) => !removed.includes(c.checkpointId));
    let at = kept.findIndex((c) => c.checkpointId === insertAfter) + 1;
    if (at <= 0) at = Math.max(kept.length - 1, 0);
    const toStop = (c, newIndex) =>
      c?.latitude != null && c?.longitude != null
        ? {
            lat: Number(c.latitude),
            lng: Number(c.longitude),
            stopType: MAP_STOP_TYPES[c.checkpointType] || c.checkpointType,
            name: c.checkpointName,
            newIndex,
          }
        : null;
    const fresh = (added || []).map((c, i) => toStop(c, i));
    return [...kept.slice(0, at).map((c) => toStop(c)), ...fresh, ...kept.slice(at).map((c) => toStop(c))].filter(Boolean);
  }, [checkpoints, deactivated, insertAfter, added]);

  // Đường bộ qua các mốc (gọi lại khi danh sách mốc đổi)
  const routeKey = mapStops.map((p) => `${p.lat},${p.lng}`).join('|');
  const [route, setRoute] = useState({ key: null, data: null });
  useEffect(() => {
    if (mapStops.length < 2) return undefined;
    let active = true;
    const timer = setTimeout(() => {
      geoService
        .route(mapStops.map((p) => ({ lat: p.lat, lng: p.lng })))
        .then((res) => active && setRoute({ key: routeKey, data: unwrapData(res) }))
        .catch(() => active && setRoute({ key: routeKey, data: null }));
    }, 500);
    return () => {
      active = false;
      clearTimeout(timer);
    };
    // routeKey đại diện cho tọa độ các mốc
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [routeKey]);
  const routeData = route.key === routeKey ? route.data : null;

  const listPath = [...prefix, 'newCheckpoints'];
  const fillAddress = async (index, lat, lng) => {
    try {
      const place = unwrapData(await geoService.reverse(lat, lng));
      if (place?.displayName) form.setFieldValue([...listPath, index, 'address'], place.displayName.slice(0, 255));
    } catch {
      // Không lấy được địa chỉ: coordinator tự nhập
    }
  };
  // Bấm bản đồ: thêm trạm nghỉ mới, giờ dự kiến sau mốc chèn 1 giờ
  const addStopOnMap = (point) => {
    const list = form.getFieldValue(listPath) || [];
    // Mốc chèn sau: mốc đã chọn, không chọn thì mốc cuối cùng xe đã tới; giờ mới không sớm hơn hiện tại
    const anchor =
      checkpoints.find((c) => c.checkpointId === insertAfter) ||
      [...checkpoints].reverse().find((c) => c.status !== 'Pending');
    const stop = {
      checkpointName: `${t('incidents.reroute.type.RestStop')} ${list.length + 1}`,
      checkpointType: 'RestStop',
      address: '',
      plannedTime: [dayjs(anchor?.plannedTime || undefined).add(1, 'hour'), dayjs().add(1, 'hour')].reduce((x, y) => (x.isAfter(y) ? x : y)),
      mandatoryRestMinutes: 0,
      latitude: point.lat,
      longitude: point.lng,
    };
    form.setFieldValue(listPath, [...list, stop]);
    void fillAddress(list.length, point.lat, point.lng);
  };
  // Kéo ghim: chỉ dời được mốc mới thêm
  const moveStopOnMap = (index, point) => {
    const target = mapStops[index];
    if (target?.newIndex == null) return;
    form.setFieldValue([...listPath, target.newIndex, 'latitude'], point.lat);
    form.setFieldValue([...listPath, target.newIndex, 'longitude'], point.lng);
    void fillAddress(target.newIndex, point.lat, point.lng);
  };

  return (
    <>
      <Text strong>{t('incidents.reroute.currentRoute')}</Text>
      <Form.Item name={[...prefix, 'deactivateCheckpointIds']} style={{ marginTop: 8 }} extra={t('incidents.reroute.removeHint')}>
        <Checkbox.Group style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
          {checkpoints.map((c) => (
            <Checkbox key={c.checkpointId} value={c.checkpointId} disabled={!removable(c)}>
              {c.sequenceOrder}. {c.checkpointName}{' '}
              <Text type="secondary" style={{ fontSize: 12 }}>
                · {dayjs(c.plannedTime).format('DD/MM HH:mm')}
              </Text>{' '}
              <Tag style={{ marginLeft: 4 }}>{t(`status.${c.status.charAt(0).toLowerCase()}${c.status.slice(1)}`, c.status)}</Tag>
            </Checkbox>
          ))}
        </Checkbox.Group>
      </Form.Item>

      <Form.Item name={[...prefix, 'insertAfterCheckpointId']} label={t('incidents.reroute.insertAfter')} extra={t('incidents.reroute.insertAfterHint')}>
        <Select
          allowClear
          options={checkpoints
            .filter((c) => c.checkpointType !== 'Destination')
            .map((c) => ({ value: c.checkpointId, label: `${c.sequenceOrder}. ${c.checkpointName}` }))}
        />
      </Form.Item>

      {mapStops.length >= 1 && (
        <div style={{ marginBottom: 12 }}>
          <RouteMap
            stops={mapStops}
            polyline={routeData?.polyline}
            legs={(routeData?.legs || []).map((l) => ({ distanceKm: l.distanceKm, durationHours: l.durationHours }))}
            totalDistanceKm={routeData?.totalDistanceKm}
            totalDurationHours={routeData?.totalDurationHours}
            isEstimate={!routeData || routeData.isEstimate}
            height={300}
            editable
            showList={false}
            onAddStop={addStopOnMap}
            onMoveStop={moveStopOnMap}
          />
          <Text type="secondary" style={{ fontSize: 12, display: 'block', marginTop: 6 }}>
            Bản đồ là tuyến sau khi sửa. Bấm lên bản đồ để thêm mốc mới (đổi loại thành Cửa khẩu nếu cần), kéo ghim của mốc mới để dời.
          </Text>
        </div>
      )}

      <Text strong>{t('incidents.reroute.newStops')}</Text>
      <Form.List name={[...prefix, 'newCheckpoints']}>
        {(fields, { add, remove }) => (
          <div style={{ marginTop: 8, marginBottom: 16 }}>
            {fields.map((field) => (
              <div key={field.key} style={{ border: '1px solid #F0F0F0', borderRadius: 8, padding: '12px 12px 0', marginBottom: 10 }}>
                <Row gutter={12}>
                  <Col xs={24} md={10}>
                    <Form.Item
                      name={[field.name, 'checkpointName']}
                      label={t('incidents.reroute.stopName')}
                      rules={[{ required: true, whitespace: true, message: t('handover.form.required') }, { max: 100 }]}
                    >
                      <Input />
                    </Form.Item>
                  </Col>
                  <Col xs={12} md={6}>
                    <Form.Item name={[field.name, 'checkpointType']} label={t('incidents.reroute.stopType')} initialValue="RestStop">
                      <Select options={['RestStop', 'BorderGate'].map((value) => ({ value, label: t(`incidents.reroute.type.${value}`) }))} />
                    </Form.Item>
                  </Col>
                  <Col xs={12} md={8}>
                    <Form.Item
                      name={[field.name, 'plannedTime']}
                      label={t('incidents.reroute.plannedTime')}
                      rules={[{ required: true, message: t('handover.form.required') }]}
                    >
                      <DatePicker showTime={{ format: 'HH:mm' }} format="DD/MM/YYYY HH:mm" style={{ width: '100%' }} />
                    </Form.Item>
                  </Col>
                  <Col xs={24} md={14}>
                    {/* Backend bắt buộc địa chỉ cho mọi mốc */}
                    <Form.Item
                      name={[field.name, 'address']}
                      label={t('incidents.reroute.address')}
                      rules={[{ required: true, whitespace: true, message: t('handover.form.required') }, { max: 255 }]}
                    >
                      <Input />
                    </Form.Item>
                  </Col>
                  <Col xs={18} md={8}>
                    <Form.Item name={[field.name, 'mandatoryRestMinutes']} label={t('incidents.reroute.rest')} initialValue={0}>
                      <InputNumber min={0} max={2880} style={{ width: '100%' }} />
                    </Form.Item>
                  </Col>
                  <Form.Item name={[field.name, 'latitude']} hidden>
                    <InputNumber />
                  </Form.Item>
                  <Form.Item name={[field.name, 'longitude']} hidden>
                    <InputNumber />
                  </Form.Item>
                  <Col xs={6} md={2} style={{ display: 'flex', alignItems: 'center', paddingTop: 6 }}>
                    <Button type="text" danger icon={<DeleteOutlined />} onClick={() => remove(field.name)} />
                  </Col>
                </Row>
              </div>
            ))}
            <Button type="dashed" block icon={<PlusOutlined />} onClick={() => add()}>
              {t('incidents.reroute.addStop')}
            </Button>
          </div>
        )}
      </Form.List>
    </>
  );
}
