import { useCallback, useEffect, useRef, useState } from 'react';
import { AutoComplete, Input, Spin, Typography, message } from 'antd';
import { EnvironmentOutlined } from '@ant-design/icons';
import { useTranslation } from 'react-i18next';
import { MapContainer, Marker, TileLayer, useMap, useMapEvents } from 'react-leaflet';
import { geoService } from '@services/geoService';
import { DEFAULT_CENTER, DEFAULT_ZOOM, TILE_ATTRIBUTION, TILE_URL } from './leafletSetup';
import styles from './Map.module.css';

/**
 * @typedef {Object} PickedPlace
 * @property {string} address
 * @property {number} lat
 * @property {number} lng
 * @property {string} countryCode
 */

const SEARCH_DELAY_MS = 400; // Nominatim chỉ cho 1 request / giây: chờ người dùng ngừng gõ rồi mới gọi

// Bay tới điểm đang chọn mỗi khi tọa độ đổi
function FlyTo({ position }) {
  const map = useMap();
  useEffect(() => {
    if (position) map.flyTo(position, Math.max(map.getZoom(), 13), { duration: 0.6 });
  }, [map, position]);
  return null;
}

function ClickToPick({ onPick, disabled }) {
  useMapEvents({
    click(e) {
      if (!disabled) onPick(e.latlng.lat, e.latlng.lng);
    },
  });
  return null;
}

/**
 * Chọn một điểm: tìm địa chỉ có gợi ý, bấm lên bản đồ hoặc kéo ghim.
 * @param {{ value?: PickedPlace | null, onChange?: (place: PickedPlace) => void, country?: string, placeholder?: string, height?: number, disabled?: boolean }} props
 */
export default function MapPicker({ value, onChange, country, placeholder, height = 320, disabled = false }) {
  const { t } = useTranslation();
  const [text, setText] = useState(value?.address || '');
  const [options, setOptions] = useState([]);
  const [searching, setSearching] = useState(false);
  const [resolving, setResolving] = useState(false);
  const timerRef = useRef(null);
  const placesRef = useRef([]);

  // Địa chỉ đổi từ ngoài (chọn trên bản đồ, form reset) thì ô tìm hiện đúng địa chỉ đó
  const [prevAddress, setPrevAddress] = useState(value?.address);
  if (value?.address !== prevAddress) {
    setPrevAddress(value?.address);
    setText(value?.address || '');
  }

  useEffect(() => () => clearTimeout(timerRef.current), []);

  const handleSearch = (q) => {
    setText(q);
    clearTimeout(timerRef.current);
    if (!q || q.trim().length < 2) {
      setOptions([]);
      return;
    }
    timerRef.current = setTimeout(async () => {
      setSearching(true);
      try {
        const res = await geoService.search(q.trim(), country);
        placesRef.current = res?.data || [];
        setOptions(placesRef.current.map((p, i) => ({ value: String(i), label: p.displayName })));
      } catch {
        setOptions([]);
      } finally {
        setSearching(false);
      }
    }, SEARCH_DELAY_MS);
  };

  const handleSelect = (index) => {
    const place = placesRef.current[Number(index)];
    if (!place) return;
    setText(place.displayName);
    onChange?.({ address: place.displayName, lat: place.lat, lng: place.lng, countryCode: place.countryCode });
  };

  // Bấm bản đồ / kéo ghim: lấy địa chỉ + nước của điểm đó
  const pickAt = useCallback(
    async (lat, lng) => {
      setResolving(true);
      try {
        const res = await geoService.reverse(lat, lng);
        const place = res?.data;
        onChange?.({ address: place?.displayName || '', lat, lng, countryCode: place?.countryCode || '' });
      } catch (err) {
        message.warning(err?.response?.data?.message || t('map.reverseFailed'));
      } finally {
        setResolving(false);
      }
    },
    [onChange, t],
  );

  const position = value?.lat != null && value?.lng != null ? [value.lat, value.lng] : null;

  return (
    <div>
      <div className={styles.searchRow}>
        <AutoComplete
          style={{ flex: 1 }}
          value={text}
          options={options}
          onSearch={handleSearch}
          onSelect={handleSelect}
          disabled={disabled}
          notFoundContent={searching ? <Spin size="small" /> : null}
        >
          <Input
            size="large"
            prefix={<EnvironmentOutlined />}
            placeholder={placeholder || t('map.searchPlaceholder')}
            allowClear
          />
        </AutoComplete>
      </div>
      <div className={styles.mapBox} style={{ height: Math.max(height, 280) }}>
        <MapContainer center={position || DEFAULT_CENTER} zoom={position ? 13 : DEFAULT_ZOOM} style={{ height: '100%', width: '100%' }}>
          <TileLayer url={TILE_URL} attribution={TILE_ATTRIBUTION} />
          <ClickToPick onPick={pickAt} disabled={disabled} />
          <FlyTo position={position} />
          {position && (
            <Marker
              position={position}
              draggable={!disabled}
              eventHandlers={{
                dragend: (e) => {
                  const { lat, lng } = e.target.getLatLng();
                  pickAt(lat, lng);
                },
              }}
            />
          )}
        </MapContainer>
      </div>
      <Typography.Text type="secondary" style={{ fontSize: 12 }}>
        {resolving ? t('map.resolving') : t('map.pickHint')}
        {value?.countryCode ? ` · ${t('map.country')}: ${value.countryCode}` : ''}
      </Typography.Text>
    </div>
  );
}
