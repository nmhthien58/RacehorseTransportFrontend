import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import markerIcon2x from 'leaflet/dist/images/marker-icon-2x.png';
import markerIcon from 'leaflet/dist/images/marker-icon.png';
import markerShadow from 'leaflet/dist/images/marker-shadow.png';

// Vite đổi tên file ảnh khi build nên Leaflet không tự tìm được icon marker mặc định: chỉ đường dẫn thủ công
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: markerIcon2x,
  iconUrl: markerIcon,
  shadowUrl: markerShadow,
});

// Bản đồ nền OpenStreetMap (không dùng Google Maps: VN và CN nằm trong danh sách cấm của Google Maps Platform)
export const TILE_URL = 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png';
export const TILE_ATTRIBUTION = '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors';

// Giữa Việt Nam, nhìn được cả khu vực Đông Nam Á lân cận
export const DEFAULT_CENTER = [16.0, 106.0];
export const DEFAULT_ZOOM = 5;

export default L;
