import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  Table,
  Tag,
  Segmented,
  Drawer,
  Descriptions,
  Form,
  Input,
  InputNumber,
  Button,
  Popconfirm,
  Modal,
  Alert,
  Typography,
  Space,
  message,
} from 'antd';
import { ReloadOutlined } from '@ant-design/icons';
import { useTranslation } from 'react-i18next';
import dayjs from 'dayjs';
import incidentService from '@services/incidentService';
import { unwrapList, getErrorMessage } from '@utils/apiHelpers';
import { SEVERITY_COLOR, INCIDENT_STATUS_COLOR, formatUsd } from '@utils/incidents';
import RerouteModal from './RerouteModal';

const { Text } = Typography;
const { TextArea } = Input;

const formatTime = (value) => (value ? dayjs(value).format('DD/MM/YYYY HH:mm') : '—');

// Nhóm lọc theo việc của từng vai trò
const FILTERS = {
  coordinator: {
    todo: ['Reported', 'Rejected', 'Approved'],
    waiting: ['PlanProposed'],
    resolved: ['Resolved'],
  },
  manager: {
    todo: ['PlanProposed'],
    open: ['Reported', 'Rejected', 'Approved'],
    resolved: ['Resolved'],
  },
};

/**
 * Bảng sự cố Flow 5 dùng chung cho điều phối viên và quản lý.
 * - coordinator: đề xuất phương án (Reported/Rejected), nắn tuyến và đóng sự cố (Approved)
 * - manager: duyệt / từ chối phương án (PlanProposed)
 * @param {{ role: 'coordinator' | 'manager' }} props
 */
export default function IncidentBoard({ role }) {
  const { t } = useTranslation();
  const [incidents, setIncidents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('todo');
  const [selectedId, setSelectedId] = useState(null);
  const [acting, setActing] = useState(false);
  const [rejectOpen, setRejectOpen] = useState(false);
  const [rerouteOpen, setRerouteOpen] = useState(false);
  const [proposeForm] = Form.useForm();
  const [rejectForm] = Form.useForm();

  // Chỉ cập nhật state trong callback của promise (không setState đồng bộ trong effect)
  const load = useCallback(
    () =>
      incidentService
        .getIncidents({ size: 100, sort: '-reportedAt' })
        .then((res) => setIncidents(unwrapList(res)))
        .catch((err) => message.error(getErrorMessage(err)))
        .finally(() => setLoading(false)),
    [],
  );

  const reload = () => {
    setLoading(true);
    load();
  };

  useEffect(() => {
    load();
  }, [load]);

  const groups = FILTERS[role];
  const filtered = useMemo(
    () => (filter === 'all' ? incidents : incidents.filter((i) => groups[filter].includes(i.status))),
    [incidents, filter, groups],
  );
  const selected = incidents.find((i) => i.incidentId === selectedId) || null;

  /**
   * Chạy một thao tác trên sự cố đang chọn rồi cập nhật lại dòng đó trong bảng.
   * @param {() => Promise<any>} call
   * @param {string} successText
   */
  const run = async (call, successText) => {
    setActing(true);
    try {
      await call();
      message.success(successText);
      await load();
      return true;
    } catch (err) {
      message.error(getErrorMessage(err));
      return false;
    } finally {
      setActing(false);
    }
  };

  const openDetail = (incident) => setSelectedId(incident.incidentId);

  const handlePropose = async () => {
    let values;
    try {
      values = await proposeForm.validateFields();
    } catch {
      return;
    }
    await run(
      () =>
        incidentService.proposePlan(selected.incidentId, {
          proposedAction: values.proposedAction.trim(),
          revisedRouteNotes: values.revisedRouteNotes?.trim() || null,
          additionalCost: values.additionalCost || 0,
        }),
      t('incidents.actions.proposed'),
    );
  };

  const handleReject = async () => {
    let values;
    try {
      values = await rejectForm.validateFields();
    } catch {
      return;
    }
    const ok = await run(() => incidentService.rejectPlan(selected.incidentId, { reason: values.reason.trim() }), t('incidents.actions.rejected'));
    if (ok) setRejectOpen(false);
  };

  const columns = [
    {
      title: t('incidents.columns.code'),
      key: 'code',
      render: (_, r) => (
        <div>
          <Text strong>{r.incidentCode}</Text>
          <div style={{ fontSize: 12, color: '#78716C' }}>{r.tripCode}</div>
        </div>
      ),
    },
    {
      title: t('incidents.fields.type'),
      dataIndex: 'incidentType',
      render: (v) => t(`incidents.type.${v}`, v),
    },
    {
      title: t('incidents.fields.severity'),
      dataIndex: 'severity',
      render: (v) => <Tag color={SEVERITY_COLOR[v]}>{t(`incidents.severity.${v}`, v)}</Tag>,
    },
    { title: t('incidents.fields.location'), dataIndex: 'location', ellipsis: true },
    { title: t('incidents.columns.reportedAt'), dataIndex: 'reportedAt', render: formatTime },
    {
      title: t('incidents.columns.cost'),
      dataIndex: 'additionalCost',
      render: (v, r) => (r.proposedAction ? formatUsd(v) : '—'),
    },
    {
      title: t('incidents.columns.status'),
      dataIndex: 'status',
      render: (v) => <Tag color={INCIDENT_STATUS_COLOR[v]}>{t(`incidents.status.${v}`, v)}</Tag>,
    },
  ];

  const canPropose = role === 'coordinator' && selected && ['Reported', 'Rejected'].includes(selected.status);
  const canReview = role === 'manager' && selected?.status === 'PlanProposed';
  const canFinish = role === 'coordinator' && selected?.status === 'Approved';
  const count = (key) => incidents.filter((i) => groups[key].includes(i.status)).length;

  return (
    <>
      <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap', marginBottom: 16 }}>
        <Segmented
          value={filter}
          onChange={setFilter}
          options={[
            ...Object.keys(groups).map((key) => ({ value: key, label: `${t(`incidents.filters.${role}.${key}`)} (${count(key)})` })),
            { value: 'all', label: `${t('customerTrips.filters.all')} (${incidents.length})` },
          ]}
        />
        <Button icon={<ReloadOutlined />} onClick={reload}>
          {t('customerTrips.refresh')}
        </Button>
      </div>

      <Table
        rowKey="incidentId"
        loading={loading}
        dataSource={filtered}
        columns={columns}
        scroll={{ x: 900 }}
        pagination={{ pageSize: 10, hideOnSinglePage: true }}
        locale={{ emptyText: t('incidents.empty') }}
        onRow={(record) => ({ onClick: () => openDetail(record), style: { cursor: 'pointer' } })}
      />

      <Drawer
        open={Boolean(selected)}
        onClose={() => setSelectedId(null)}
        width={560}
        title={
          selected && (
            <Space size={8}>
              <span>{selected.incidentCode}</span>
              <Tag color={INCIDENT_STATUS_COLOR[selected.status]}>{t(`incidents.status.${selected.status}`)}</Tag>
            </Space>
          )
        }
      >
        {selected && (
          <>
            <Descriptions column={1} size="small" styles={{ label: { width: 150 } }}>
              <Descriptions.Item label={t('incidents.columns.trip')}>
                {selected.tripCode} · {t(`status.${selected.tripStatus.charAt(0).toLowerCase()}${selected.tripStatus.slice(1)}`, selected.tripStatus)}
              </Descriptions.Item>
              <Descriptions.Item label={t('incidents.fields.type')}>{t(`incidents.type.${selected.incidentType}`)}</Descriptions.Item>
              <Descriptions.Item label={t('incidents.fields.severity')}>
                <Tag color={SEVERITY_COLOR[selected.severity]}>{t(`incidents.severity.${selected.severity}`)}</Tag>
              </Descriptions.Item>
              <Descriptions.Item label={t('incidents.fields.location')}>{selected.location}</Descriptions.Item>
              <Descriptions.Item label={t('incidents.fields.horse')}>{selected.affectedHorseName || '—'}</Descriptions.Item>
              <Descriptions.Item label={t('incidents.columns.reportedBy')}>
                {selected.reportedByName} · {formatTime(selected.reportedAt)}
              </Descriptions.Item>
              <Descriptions.Item label={t('incidents.fields.description')}>{selected.description}</Descriptions.Item>
            </Descriptions>

            <h4 style={{ margin: '20px 0 8px' }}>{t('incidents.planTitle')}</h4>
            {selected.status === 'Rejected' && selected.rejectionReason && (
              <Alert
                type="warning"
                showIcon
                style={{ marginBottom: 12 }}
                message={t('incidents.rejectedBecause')}
                description={selected.rejectionReason}
              />
            )}

            {canPropose ? (
              <Form
                form={proposeForm}
                key={selected.incidentId}
                layout="vertical"
                requiredMark={false}
                initialValues={{
                  proposedAction: selected.proposedAction || '',
                  revisedRouteNotes: selected.revisedRouteNotes || '',
                  additionalCost: selected.additionalCost || 0,
                }}
              >
                <Form.Item
                  name="proposedAction"
                  label={t('incidents.fields.plan')}
                  rules={[{ required: true, whitespace: true, message: t('handover.form.required') }, { max: 255 }]}
                >
                  <Input placeholder={t('incidents.planPlaceholder')} />
                </Form.Item>
                <Form.Item name="revisedRouteNotes" label={t('incidents.fields.routeNotes')} rules={[{ max: 2000 }]}>
                  <TextArea rows={3} />
                </Form.Item>
                <Form.Item name="additionalCost" label={t('incidents.fields.cost')}>
                  <InputNumber min={0} prefix="$" style={{ width: 200 }} />
                </Form.Item>
                <Button type="primary" loading={acting} onClick={handlePropose}>
                  {selected.status === 'Rejected' ? t('incidents.actions.repropose') : t('incidents.actions.propose')}
                </Button>
              </Form>
            ) : selected.proposedAction ? (
              <Descriptions column={1} size="small" styles={{ label: { width: 150 } }}>
                <Descriptions.Item label={t('incidents.fields.plan')}>{selected.proposedAction}</Descriptions.Item>
                <Descriptions.Item label={t('incidents.fields.routeNotes')}>{selected.revisedRouteNotes || '—'}</Descriptions.Item>
                <Descriptions.Item label={t('incidents.fields.cost')}>{formatUsd(selected.additionalCost)}</Descriptions.Item>
                {selected.approvedByName && (
                  <Descriptions.Item label={t('incidents.columns.approvedBy')}>
                    {selected.approvedByName} · {formatTime(selected.approvedAt)}
                  </Descriptions.Item>
                )}
                {selected.resolvedAt && (
                  <Descriptions.Item label={t('incidents.columns.resolvedAt')}>{formatTime(selected.resolvedAt)}</Descriptions.Item>
                )}
              </Descriptions>
            ) : (
              <Text type="secondary">{t('incidents.noPlan')}</Text>
            )}

            {canReview && (
              <Space style={{ marginTop: 20 }}>
                <Popconfirm
                  title={t('incidents.actions.approveConfirm')}
                  onConfirm={() => run(() => incidentService.approvePlan(selected.incidentId), t('incidents.actions.approved'))}
                >
                  <Button type="primary" loading={acting}>
                    {t('incidents.actions.approve')}
                  </Button>
                </Popconfirm>
                <Button danger onClick={() => setRejectOpen(true)}>
                  {t('incidents.actions.reject')}
                </Button>
              </Space>
            )}

            {canFinish && (
              <div style={{ marginTop: 20 }}>
                <Text type="secondary" style={{ display: 'block', marginBottom: 8 }}>
                  {t('incidents.finishHint')}
                </Text>
                <Space>
                  <Button onClick={() => setRerouteOpen(true)}>{t('incidents.actions.reroute')}</Button>
                  <Popconfirm
                    title={t('incidents.actions.resolveConfirm')}
                    onConfirm={() => run(() => incidentService.resolveIncident(selected.incidentId), t('incidents.actions.resolved'))}
                  >
                    <Button type="primary" loading={acting}>
                      {t('incidents.actions.resolve')}
                    </Button>
                  </Popconfirm>
                </Space>
              </div>
            )}
          </>
        )}
      </Drawer>

      <Modal
        title={t('incidents.actions.rejectTitle')}
        open={rejectOpen}
        onCancel={() => setRejectOpen(false)}
        onOk={handleReject}
        okText={t('incidents.actions.reject')}
        okButtonProps={{ danger: true, loading: acting }}
        cancelText={t('common.cancel')}
        destroyOnHidden
      >
        <Form form={rejectForm} layout="vertical" requiredMark={false}>
          <Form.Item
            name="reason"
            label={t('incidents.fields.rejectReason')}
            rules={[{ required: true, whitespace: true, message: t('handover.form.required') }, { max: 500 }]}
          >
            <TextArea rows={3} />
          </Form.Item>
        </Form>
      </Modal>

      <RerouteModal
        open={rerouteOpen}
        incident={selected}
        onClose={() => setRerouteOpen(false)}
        onDone={() => {
          setRerouteOpen(false);
          load();
        }}
      />
    </>
  );
}
