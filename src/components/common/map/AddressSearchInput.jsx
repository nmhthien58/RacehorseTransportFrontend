import { useEffect, useRef, useState } from 'react';
import { AutoComplete, Button, Input, Space, Spin } from 'antd';
import { EnvironmentOutlined } from '@ant-design/icons';
import geoService from '@services/geoService';
import { unwrapList } from '@utils/apiHelpers';

/**
 * Ô nhập địa chỉ mốc với AutoComplete tìm kiếm địa chỉ qua geoService.search,
 * tự động cập nhật tọa độ lat/lng và có nút chọn trên bản đồ.
 */
export default function AddressSearchInput({ value, onChange, hasCoords, placing, onPlacingToggle, onSelectPlace, size = 'small', placeholder }) {
  const onChangeText = onChange;
  const [text, setText] = useState(value || '');
  const [prevValue, setPrevValue] = useState(value);
  if (value !== prevValue) {
    setPrevValue(value);
    setText(value || '');
  }

  const [options, setOptions] = useState([]);
  const [searching, setSearching] = useState(false);
  const timerRef = useRef(null);
  const placesRef = useRef([]);

  useEffect(() => () => clearTimeout(timerRef.current), []);

  const handleSearch = (q) => {
    setText(q);
    onChangeText?.(q);
    clearTimeout(timerRef.current);
    if (!q || q.trim().length < 2) {
      setOptions([]);
      return;
    }
    timerRef.current = setTimeout(async () => {
      setSearching(true);
      try {
        const res = await geoService.search(q.trim());
        const list = unwrapList(res);
        placesRef.current = list;
        setOptions(
          list.map((p, i) => ({
            value: p.displayName,
            key: `place-${i}-${p.lat}-${p.lng}`,
            place: p,
            label: (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                <span style={{ fontWeight: 500, fontSize: 12 }}>{p.displayName}</span>
                {p.countryCode && (
                  <span style={{ fontSize: 10, color: '#94a3b8' }}>Quốc gia: {p.countryCode}</span>
                )}
              </div>
            ),
          })),
        );
      } catch {
        setOptions([]);
      } finally {
        setSearching(false);
      }
    }, 400);
  };

  const handleSelect = (val, option) => {
    const place = option?.place || placesRef.current.find((p) => p.displayName === val);
    if (!place) return;
    setText(place.displayName);
    onSelectPlace?.(place);
  };

  return (
    <Space.Compact style={{ width: '100%' }}>
      <AutoComplete
        style={{ flex: 1 }}
        value={text}
        options={options}
        onSearch={handleSearch}
        onSelect={handleSelect}
        onChange={(val) => {
          setText(val);
          onChangeText?.(val);
        }}
        notFoundContent={searching ? <Spin size="small" style={{ padding: 8 }} /> : null}
      >
        <Input
          size={size}
          maxLength={255}
          placeholder={placeholder || 'Nhập địa chỉ (gợi ý vị trí)...'}
          allowClear
        />
      </AutoComplete>
      <Button
        size={size}
        type={placing ? 'primary' : 'default'}
        icon={<EnvironmentOutlined />}
        title="Chọn vị trí mốc trên bản đồ"
        onClick={onPlacingToggle}
        danger={!hasCoords && !placing}
      />
    </Space.Compact>
  );
}
