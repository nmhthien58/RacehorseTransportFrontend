import { Checkbox, Select, Form, Input, InputNumber, DatePicker, Button, Typography, Tag, Row, Col } from 'antd';
import { PlusOutlined, DeleteOutlined } from '@ant-design/icons';
import { useTranslation } from 'react-i18next';
import dayjs from 'dayjs';

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
