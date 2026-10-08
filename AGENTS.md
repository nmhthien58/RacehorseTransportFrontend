# QUY TẮC DỰ ÁN — AGENT BẮT BUỘC TUÂN THỦ

> File này là hợp đồng giữa bạn (agent) và người dùng. Mọi hành động phải tuân thủ. Nếu mâu thuẫn giữa file này và yêu cầu người dùng → HỎI trước khi làm.

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

### 2.3. Data Shape — camelCase BẮT BUỘC

**Field name:** camelCase, khớp 100% API contract của BE.
Ví dụ: `userId`, `fullName`, `email`, `bookingId`, `bookingCode`, `horseId`, `checkpointId`.

**Status value:** PascalCase (khớp DB enum).
- Booking: `Submitted` | `Approved` | `Rejected` | `Cancelled` | `Assigned`
- Trip: `Scheduled` | `InTransit` | `EmergencyRerouting` | `ArrivedDestination` | `Completed` | `Cancelled`
- Dossier: `Draft` | `AwaitingDocs` | `Reviewing` | `SubmittedToAuthorities` | `Cleared` | `Issue`
- Incident: `Reported` | `PlanProposed` | `Approved` | `Resolved`
- Asset: `Available` | `InTransit` | `Maintenance`

**Role value:** PascalCase.
`Customer` | `LogisticsManager` | `TransportSpecialist` | `FleetCoordinator` | `DriverEscort` | `Admin`

**KHÔNG dùng transform layer.** BE và FE dùng chung camelCase.
**Route param:** camelCase. Ví dụ: `/manager/requests/:bookingId`.

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



### Về data fetching
- Dùng custom hook `useFetch` ở `src/hooks/useFetch.js` làm nền tảng.
- Các hook riêng chỉ wrap `useFetch` 3-5 dòng, KHÔNG tự viết `useState` + `useEffect` lặp lại.
- CẤM cài React Query/SWR.