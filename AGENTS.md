# QUY TẮC DỰ ÁN — AGENT BẮT BUỘC TUÂN THỦ

> File này là hợp đồng giữa bạn (agent) và người dùng. Mọi hành động phải tuân thủ. Nếu mâu thuẫn giữa file này và yêu cầu người dùng → HỎI trước khi làm.

---

## 0. QUY TRÌNH LÀM VIỆC & GIT (đọc đầu tiên)

Phần này áp dụng cho **mọi người trong nhóm (Thiên, Vũ, Thắng) và mọi AI agent**. Các mục 1–7 bên dưới là quy tắc code, vẫn bắt buộc.

### 0.1 Dự án trong 30 giây
- Frontend của hệ thống vận chuyển ngựa đua quốc tế (SWP391, Group 5). Vai trò: Customer, LogisticsManager, TransportSpecialist, FleetCoordinator, DriverEscort, Admin.
- Backend: repo `RacehorseTransportBackend` (.NET 8), bản đang chạy https://racehorsetransportbackend-production.up.railway.app/swagger. Tài liệu API: `docs/API.md` của repo backend (bản Word `API_Huong_dan_Frontend.docx` gửi qua nhóm).
- Tài khoản test (mật khẩu `Racehorse@123`): `customer@`, `manager@`, `specialist@`, `coordinator@`, `driver@`, `admin@racehorsetransport.com`.

### 0.2 Tài liệu phải đọc trước khi nhận task
| File | Để làm gì |
|---|---|
| `doc/TASKS_R09_R16.md` | **Danh sách task đợt hiện tại**: ai làm gì, thứ tự, mô tả chi tiết, tiêu chí xong |
| `doc/PLAN_NGHIEP_VU_R09.md` | Lý do và quyết định nghiệp vụ |
| `doc/CHINH_SACH_DICH_VU.md` | Chính sách gửi khách. Chữ hiển thị và con số phải khớp file này |
| `docs/API.md` (repo backend) | Endpoint, body, response, lỗi |

`doc/PLAN_NGHIEP_VU_R09.md` và `doc/CHINH_SACH_DICH_VU.md` là bản chép từ repo backend. **Không sửa ở đây**; cần đổi thì báo Thiên sửa bản gốc.

### 0.3 Chuẩn bị máy (một lần)
```bash
git clone https://github.com/nmhthien58/RacehorseTransportFrontend.git
cd RacehorseTransportFrontend
npm install
```
Tạo file `.env` (đã nằm trong `.gitignore`, không commit):
```
VITE_USE_MOCK=false
VITE_API_BASE_URL=https://racehorsetransportbackend-production.up.railway.app
VITE_GOOGLE_CLIENT_ID=<xin Thiên>
```
Chạy với backend ở máy thì đổi `VITE_API_BASE_URL=http://localhost:5080`. Chạy: `npm run dev` → http://localhost:3000.

### 0.4 Quy trình làm MỘT task
1. **Nhận task:** mở `doc/TASKS_R09_R16.md`, tìm mã của mình (ví dụ `FE-13`), xem cột **Phụ thuộc**. Endpoint backend chưa có thì vẫn làm giao diện trước với dữ liệu giả **trong service** (ghi `// TODO(BE-xx)`), không chờ. Đổi Trạng thái trong `doc/SWP391_Frontend_Tasks_R09_R16.xlsx` thành `Đang làm`.
2. **Tạo nhánh từ `main` mới nhất:**
   ```bash
   git checkout main
   git pull origin main
   git checkout -b feature/fe-13-recipient
   ```
   Tên nhánh: `feature/<mã-task-viết-thường>-<mô-tả-ngắn-tiếng-anh>`; sửa lỗi: `fix/<mô-tả>`.
3. **Code:** đúng phạm vi task, theo mục 1–7. Trước khi sửa mỗi file ghi một dòng "Đang sửa X vì…" (mục 5).
4. **Tự kiểm tra:**
   ```bash
   npm run lint      # phải 0 errors 0 warnings
   npm run build     # phải build được
   npm run dev       # đi hết luồng của task trên trình duyệt, F12 Console không có lỗi mới
   ```
   Thử ở bề rộng điện thoại (375px), nhất là màn tài xế. Thử cả tiếng Việt và tiếng Anh.
5. **Commit** (Conventional Commits, tiếng Anh, scope theo feature):
   ```
   feat(booking): pick pickup and drop-off on the map (FE-02)
   fix(incidents): guard route preview when no incident is selected
   ```
   Không thêm dòng `Co-Authored-By` hay chữ ký AI. Kiểm tra `git status` không có `.env`, `dist/`, `node_modules/`.
6. **Push và mở Pull Request vào `main`:**
   ```bash
   git push -u origin feature/fe-13-recipient
   gh pr create --base main --title "feat(recipient): recipient form and confirmation (FE-13)" --body-file pr.md
   ```
   (Không có `gh` thì mở PR trên GitHub.) Mô tả PR gồm: mã task; đã làm gì; kết quả `npm run lint` (dán thật); 2–3 bước tự kiểm tra (URL nào, tài khoản nào, bấm gì, thấy gì); ảnh chụp màn hình; bảng **File | Thay đổi | Tại sao | Ảnh hưởng nếu không làm** (mục 5).
7. **Review và merge:** Thiên review. Sửa bằng commit mới trên cùng nhánh rồi `git push`. Nhánh cũ so với `main`: `git fetch origin && git merge origin/main`, giải quyết conflict, lint + build lại, push. Merge kiểu **Squash and merge**. Xong thì đánh dấu `[x]` trong `doc/TASKS_R09_R16.md` và đổi Trạng thái Excel thành `Xong`.

### 0.5 Điều cấm
- **Không push thẳng lên `main`**, không `git push --force` lên `main` (chỉ Thiên khi cần sửa gấp).
- Không commit `.env`, khóa, token.
- Không thêm / nâng cấp dependency ngoài những gì task ghi rõ (đợt này chỉ được thêm `leaflet`, `react-leaflet` ở FE-01).
- Không sửa `public/mockServiceWorker.js`.
- Hai người sửa chung `src/locales/vi.json`, `en.json`, `src/services/endpoints.js`, `src/routes/*` rất dễ conflict: **chỉ thêm key / dòng mới vào cuối nhóm của mình**, không sắp xếp lại, không định dạng lại cả file. File locale dùng xuống dòng CRLF, giữ nguyên.

### 0.6 Hướng dẫn riêng cho AI agent
1. Đọc mục task trong `doc/TASKS_R09_R16.md`, mục R-xx trong `doc/PLAN_NGHIEP_VU_R09.md`, các file được nhắc tên, và một màn tương tự đã có trước khi viết.
2. Bám đúng phạm vi. Không refactor "tiện thể", không đổi tên / định dạng file không liên quan.
3. Không chắc nghiệp vụ hoặc endpoint backend chưa rõ → dừng và hỏi, trích đoạn chính sách / API liên quan.
4. Trước khi báo xong: chạy `npm run lint` và `npm run build`, **dán kết quả thật**. Không khẳng định đã chạy khi chưa chạy.
5. Không đọc / in nội dung `.env`. Không tự push lên `main`, không tự merge PR; được tạo nhánh, commit, push nhánh, mở PR nếu người giao việc yêu cầu.
6. Kết thúc bằng bảng ở mục 5 và 2–3 bước để người dùng tự kiểm tra.

---

## 1. NGỮ CẢNH DỰ ÁN

- **Frontend:** Vite 8 + React 19 + Ant Design 6 + Zustand 5 + React Router 7.
- **Module system:** ES modules (`"type": "module"` trong package.json).
- **Lint:** ESLint 10 flat config (`eslint.config.js`). Mọi code phải pass `npm run lint`.
- **i18n:** react-i18next. Locale files ở `src/locales/vi.json` và `src/locales/en.json`.
- **Mock API:** MSW 2. File `public/mockServiceWorker.js` tự sinh, CẤM sửa tay.
- **Người dùng đang HỌC quy trình FE.** Mỗi thay đổi phải kèm giải thích ngắn (3-5 câu): làm gì, tại sao, ảnh hưởng gì.

---

## 2. KIẾN TRÚC (KHÔNG ĐƯỢC VI PHẠM)

### 2.1. API Layer

- Mọi call API CHỈ nằm trong `src/services/*` hoặc `src/features/<role>/services/*`.
- Service dùng axios instance export từ `src/services/api.js`. **CẤM tạo axios instance mới. CẤM gọi axios trực tiếp trong component.**
- URL endpoint CHỈ lấy từ `src/services/endpoints.js`. **CẤM hardcode string URL trong service.**

### 2.2. Auth & Token

- `src/features/auth/store/authStore.js` là nguồn chuẩn duy nhất cho user + token.
- **CẤM đọc `localStorage` trực tiếp** ở bất kỳ file nào khác ngoài `api.js` (nơi interceptor đọc).

### 2.3. Data Shape

- Shape dữ liệu (User, Horse, BookingRequest, BookingHorse, DigitalDossier, DossierDocument, TransportAsset, Trip, TripHorse, RouteCheckpoint, HorseWelfareLog, TripIncident, HandoverAcceptance, SystemNotification) định nghĩa tại `src/types/database.js` dưới dạng JSDoc typedef.
- **Field name PHẢI khớp DB schema** (PascalCase): `UserID`, `FullName`, `BookingCode`, `HorseID`, ...
- **Status value PHẢI khớp DB** (PascalCase, KHÔNG camelCase):
  - Booking: `Submitted` | `Approved` | `Rejected` | `Cancelled`
  - Trip: `Scheduled` | `InTransit` | `EmergencyRerouting` | `ArrivedDestination` | `Completed` | `Cancelled`
  - Dossier: `Draft` | `AwaitingDocs` | `Reviewing` | `SubmittedToAuthorities` | `Cleared` | `Issue`
  - Incident: `Reported` | `PlanProposed` | `Approved` | `Resolved`
  - Asset: `Available` | `InTransit` | `Maintenance`
- **Role value PHẢI khớp DB:** `Customer` | `LogisticsManager` | `TransportSpecialist` | `FleetCoordinator` | `DriverEscort` | `Admin`.
- **CẤM bịa thêm trường.** Không chắc → HỎI người dùng.

### 2.4. Mock API

- Mock data: `src/mocks/data/*.json`.
- Handlers: `src/mocks/handlers/*Handlers.js` (đặt tên đúng: `horseHandlers.js` không phải `horseHandler.js`).
- Đăng ký handler mới phải import vào `src/mocks/browser.js`.

### 2.5. Cấu trúc Folder

- **Page** (route target): `src/features/<role>/pages/<Name>Page.jsx`
- **Component riêng của role:** `src/features/<role>/components/<Name>.jsx`
- **Service riêng:** `src/features/<role>/services/<name>Service.js`
- **Store riêng:** `src/features/<role>/store/<name>Store.js`
- **Hook riêng:** `src/features/<role>/hooks/use<Name>.js`
- **Component dùng chung:** `src/components/common/`, `layout/`, `feedback/`
- **Layout theo role:** `src/layouts/`

### 2.6. Path Alias (BẮT BUỘC dùng)

Đã config trong `vite.config.js`:

- `@` → `src`
- `@components`, `@features`, `@layouts`, `@services`, `@utils`, `@hooks`, `@routes`, `@mocks`, `@types`
- **CẤM import relative kiểu `../../../components/...`** khi có thể dùng alias.

### 2.7. UI Library

- Chỉ dùng **Ant Design** components (`antd`). **CẤM tự viết lại** Button/Input/Modal/Table từ đầu.
- Theme đã config ở `main.jsx` (colorPrimary `#F59E0B`, borderRadius 8). CẤM override lung tung.
- Icon dùng `@ant-design/icons` hoặc `lucide-react`.

### 2.8. i18n (BẮT BUỘC)

- Mọi text UI PHẢI dùng `t('key')` từ `useTranslation()`.
- **CẤM hardcode tiếng Việt/Anh trong JSX.**
- Thêm key vào CẢ `src/locales/vi.json` và `en.json`.
- Key theo cấu trúc namespace: `auth.login`, `shipment.status.pending`, `nav.dashboard`, ...

### 2.9. Styling

- **Ưu tiên:** AntD props (`style`, `className`) + CSS module (`*.module.css`).
- **CẤM:** styled-components, emotion, Tailwind (không có trong dependency).
- Inline style chỉ cho layout đơn giản (padding, margin, flex).

### 2.10. State Management

- **Global state:** Zustand (`src/features/*/store/`).
- **Local state:** `useState` / `useReducer`.
- **Server state:** Dùng hooks tự viết + `useEffect`. **CẤM cài thêm React Query/SWR** trừ khi người dùng yêu cầu.

---

## 3. CODE STYLE

- **Functional components + hooks.** CẤM class component.
- **Comment trong code:** Tiếng Việt cho comment giải thích logic nghiệp vụ. Tiếng Anh cho JSDoc typedef. Identifier (biến, hàm) dùng tiếng Anh.
- **Hàm export có JSDoc ngắn:**
  ```javascript
  /**
   * Lấy danh sách booking theo status.
   * @param {string} [status] - Filter theo status
   * @returns {Promise<BookingRequest[]>}
   */
   Tên file:
  ```

Component: PascalCase.jsx (flat, không dùng index.jsx).

Hook: useXxx.js.

Service: xxxService.js.

Store: xxxStore.js.

Util: xxx.js (camelCase).

Minimal diff: Chỉ sửa đúng phần được giao. CẤM refactor "tiện thể". CẤM sửa file ngoài phạm vi. CẤM nâng cấp dependency.

Không dùng any — dùng JSDoc typedef.

4. XÁC MINH BẮT BUỘC TRƯỚC KHI BÁO HOÀN THÀNH
   npm run lint → 0 errors 0 warnings. Dán output thật, không tự khẳng định.

Dev server chạy không lỗi console (mở browser → F12 → Console sạch).

Thay đổi UI: Mô tả 2-3 bước để người dùng tự kiểm tra (mở URL nào, bấm gì, thấy gì).

5. PHONG CÁCH LÀM VIỆC
   Trước khi sửa file, ghi 1 dòng: "Đang sửa X vì...".

Không chắc → ĐẶT CÂU HỎI. CẤM đoán rồi im lặng làm theo phỏng đoán.

Kết thúc nhiệm vụ bằng bảng:

File Thay đổi Tại sao Ảnh hưởng nếu không làm
... ... ... ...
Khi tạo file mới: Nêu rõ path đầy đủ, mục đích, và ai sẽ import nó.

Khi xóa file: Kiểm tra Ctrl+Shift+F tìm import còn sót → sửa hết mới xóa.

6. GIT WORKFLOW
   Commit message: Conventional Commits.

feat(scope): mô tả ngắn

fix(scope): mô tả ngắn

chore(scope): mô tả ngắn

docs(scope): mô tả ngắn

refactor(scope): mô tả ngắn

Scope theo feature: auth, booking, dossier, fleet, tracking, ...

CẤM commit trực tiếp vào main (nếu có remote).

7. ĐỌC THÊM
   Các file tham khảo quan trọng (agent PHẢI đọc trước khi code):

docs/db-schema.md — Schema DB đầy đủ (14 bảng).

docs/api-contract.md — API contract giữa FE và BE.

docs/figma-notes.md — Ghi chú thiết kế từ Figma.

docs/glossary.md — Thuật ngữ nghiệp vụ (Booking, Dossier, Trip, ...).

docs/workflow.md — Quy trình làm việc chi tiết theo phase.

### Về cải tiến UI khi Figma chưa hoàn hảo

**ĐƯỢC PHÉP:**
- Điều chỉnh `padding`, `margin`, `gap` nếu Figma không ghi số cụ thể.
- Căn chỉnh lại vị trí element trong layout (align left/right/center).
- Sắp xếp thứ tự nút Primary/Cancel theo convention (Primary phải, Cancel trái).
- Thêm `size="large"` cho button chính nếu Figma không ghi size.

**CẤM:**
- Thêm element mới không có trong Figma (badge, tag, icon, tooltip...).
- Bớt element có trong Figma.
- Đổi màu ngoài theme `#F59E0B`.
- Đổi font chữ.
- Đổi vị trí các section trong layout.
- Thêm animation, transition không có trong Figma.
- Đổi component type (Button → Link, Table → Card...).

**NẾU AGENT THẤY FIGMA THIẾU ELEMENT:**
- PHẢI HỎI user trước khi thêm.
- Format: "Figma không có [element X]. Tôi có nên thêm không? Lý do: [Y]."

### Field name — QUAN TRỌNG
- **Field name trong types, mock data, component PHẢI dùng PascalCase** khớp DB schema.
- Ví dụ: `user.FullName`, `user.Role`, `booking.BookingCode`.
- Khi BE chốt API:
  - Nếu BE trả PascalCase → giữ nguyên.
  - Nếu BE trả camelCase → viết transform layer ở `services/api.js` interceptor. **KHÔNG sửa types/mock/components.**

### Về field name case (cập nhật)
- Giữ PascalCase cho types, mock, components — khớp DB schema.
- Khi BE chốt API:
  - Nếu BE trả PascalCase → giữ nguyên.
  - Nếu BE trả camelCase → dùng helper `toPascalCase` ở `src/utils/transform.js` (dùng lodash, recursive) áp dụng trong `api.js` interceptor. KHÔNG viết mapping thủ công.

### Về data fetching
- Dùng custom hook `useFetch` ở `src/hooks/useFetch.js` làm nền tảng.
- Các hook riêng chỉ wrap `useFetch` 3-5 dòng, KHÔNG tự viết `useState` + `useEffect` lặp lại.
- CẤM cài React Query/SWR.