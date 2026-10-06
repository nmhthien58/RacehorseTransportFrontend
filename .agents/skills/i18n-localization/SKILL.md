---
name: i18n-localization
description: Hướng dẫn dùng react-i18next trong dự án Racehorse Transport. Invoke khi cần thêm text UI, key i18n, hoặc đổi ngôn ngữ.
triggers:
  - i18n
  - translation
  - locale
  - ngôn ngữ
  - react-i18next
  - useTranslation
  - t()
---

# i18n Localization — Racehorse Transport

## Quy tắc bắt buộc

1. Mọi text UI PHẢI dùng `t('key')` từ `useTranslation()`. CẤM hardcode.
2. Thêm key vào CẢ `src/locales/vi.json` và `src/locales/en.json`.
3. Key theo namespace: `<feature>.<screen>.<element>`.
   - Ví dụ: `auth.login`, `shipment.status.pending`, `nav.dashboard`.

## Cách dùng

```jsx
import { useTranslation } from 'react-i18next';

function MyComponent() {
  const { t, i18n } = useTranslation();
  return <h1>{t('shipment.title')}</h1>;
}
Đổi ngôn ngữ
jsx
i18n.changeLanguage('en');  // hoặc 'vi'
Cấu trúc key đề xuất
common.* — text dùng chung (save, cancel, delete...)

auth.* — login, register, logout...

nav.* — menu items

shipment.* — booking, status...

dossier.* — hồ sơ kiểm dịch

fleet.* — phương tiện

tracking.* — nhật ký hành trình

incident.* — sự cố

handover.* — bàn giao

Khi thêm text mới
Thêm key vào vi.json với bản dịch tiếng Việt.

Thêm key tương ứng vào en.json với bản dịch tiếng Anh.

Dùng t('key') trong component.

KHÔNG để key thiếu ở 1 trong 2 file.

text

→ **Cách này tốt nhất** vì bạn kiểm soát nội dung, khớp chính xác với dự án.

---

## 3. `systematic-debugging` — Kiểm tra lại

Chạy lệnh:

```bash
npx skills search debug
npx skills search debugging
Nếu tìm thấy → cài.
Nếu không → thử:

bash
npx skills add sickn33/antigravity-awesome-skills --skill debug
Nếu vẫn không có → cũng có thể tự viết skill debug đơn giản (giống cách làm i18n ở trên).

Hành động cụ thể
Bước 1: Sửa tên folder react-expert
bash
cd .agents/skills/
mv vuralserhat86-react-expert react_expert
cd ../..
npx skills list
Nếu react_expert hiện → OK. Nếu không → đổi thành react-expert (gạch ngang thay vì gạch dưới).

Bước 2: Tự viết skill i18n-localization
bash
mkdir -p .agents/skills/i18n-localization
Copy nội dung SKILL.md ở Option C vào file .agents/skills/i18n-localization/SKILL.md.

Bước 3: Tìm skill debug
bash
npx skills search debug
Gửi mình output để mình gợi ý skill cụ thể.

Bước 4: Kiểm tra tổng
bash
npx skills list