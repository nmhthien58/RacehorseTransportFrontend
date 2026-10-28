import { useState } from 'react';
import { Button, InputNumber, Space } from 'antd';
import { CheckOutlined } from '@ant-design/icons';
import { useTranslation } from 'react-i18next';

/**
 * Ô sửa nhanh một con số (giá, hệ số, %) kèm nút lưu; nút chỉ bật khi giá trị đã đổi.
 * @param {Object} props
 * @param {number} props.value - Giá trị đang lưu
 * @param {(next: number) => Promise<boolean>} props.onSave - Trả false khi lưu không được (giữ giá trị đang sửa)
 * @param {number} [props.min]
 * @param {number} [props.step]
 * @param {string} [props.prefix]
 * @param {string} [props.suffix]
 * @param {boolean} [props.disabled]
 * @returns {JSX.Element}
 */
export default function PriceValueEditor({ value, onSave, min = 0, step = 1, prefix, suffix, disabled }) {
  const { t } = useTranslation();
  const [draft, setDraft] = useState(null);
  const [saving, setSaving] = useState(false);
  const shown = draft ?? value;
  const changed = draft !== null && Number(draft) !== Number(value);

  const save = async () => {
    setSaving(true);
    try {
      // onSave trả false (hoặc lỗi) thì giữ giá trị đang sửa để người dùng thử lại
      const saved = await onSave(Number(draft));
      if (saved) setDraft(null);
    } catch {
      // Lỗi đã được báo ở nơi gọi
    } finally {
      setSaving(false);
    }
  };

  return (
    <Space.Compact>
      <InputNumber
        value={shown}
        min={min}
        step={step}
        prefix={prefix}
        suffix={suffix}
        disabled={disabled}
        onChange={(v) => setDraft(v)}
        onPressEnter={() => changed && save()}
        style={{ width: 150 }}
      />
      <Button
        icon={<CheckOutlined />}
        type={changed ? 'primary' : 'default'}
        disabled={!changed || disabled}
        loading={saving}
        onClick={save}
        aria-label={t('common.save', 'Lưu')}
      />
    </Space.Compact>
  );
}
