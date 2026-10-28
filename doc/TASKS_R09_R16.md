# Frontend — Task đợt nghiệp vụ R-09 → R-16

Cập nhật: 26/10/2026 · Người làm: **Thiên**, **Vũ**, **Thắng** · File Excel theo dõi: `doc/SWP391_Frontend_Tasks_R09_R16.xlsx` (cùng mã task).

> **Đọc trước khi làm (bắt buộc với cả người và AI agent):**
> 1. `AGENTS.md` ở thư mục gốc frontend: quy tắc dự án (service / endpoint, i18n, alias import, Ant Design, lint). **Mọi quy tắc trong đó vẫn áp dụng.**
> 2. `doc/PLAN_NGHIEP_VU_R09.md`: lý do và quyết định nghiệp vụ của từng mục R-xx.
> 3. `doc/CHINH_SACH_DICH_VU.md`: chính sách gửi khách. Chữ hiển thị cho khách phải khớp với file này.
> 4. Repo backend (`RacehorseTransportBackend`), file `docs/TASKS_R09_R16.md`: task backend tương ứng (mã `BE-xx`), có đường dẫn endpoint. Tài liệu API chính thức: `docs/API.md` của repo backend (bản Word gửi nhóm: `API_Huong_dan_Frontend.docx`).

## Quy ước chung (áp dụng cho mọi task)

- Gọi API chỉ trong `src/services/*` hoặc `src/features/<role>/services/*`; URL chỉ lấy từ `src/services/endpoints.js`.
- Mọi chữ hiển thị qua `t('...')`, thêm key vào **cả** `src/locales/vi.json` và `en.json`. Các file locale dùng xuống dòng CRLF: sửa bằng công cụ giữ nguyên CRLF.
- Giá trị chính sách (%, số giờ, mức tiền) **không viết cứng**: lấy từ `GET /api/policy` (BE-17) qua một hook dùng chung `usePolicy()` (làm trong FE-15).
- Ngày giờ hiển thị theo `DD/MM/YYYY HH:mm`; tiền hiển thị USD kèm VND khi là khoản phải trả (theo tỉ giá trong policy).
- Thư viện bản đồ: **`leaflet` + `react-leaflet`** với nền OpenStreetMap (đã được duyệt thêm vào dependency). Không dùng Google Maps (bị cấm ở Việt Nam).
- Backend chưa xong endpoint thì làm trước giao diện với dữ liệu giả trong service (đánh dấu `// TODO(BE-xx)`), không chặn tiến độ.

**Hoàn thành task khi**
1. `npm run lint` → 0 lỗi 0 cảnh báo (dán kết quả vào PR).
2. Mở trình duyệt, console không có lỗi mới; đi hết luồng của task với tài khoản seed (mật khẩu `Racehorse@123`: `customer@`, `manager@`, `specialist@`, `coordinator@`, `driver@`, `admin@racehorsetransport.com`).
3. Giao diện dùng được ở bề rộng điện thoại (≥ 375px), nhất là màn tài xế.
4. PR mô tả 2–3 bước để người khác tự kiểm tra (mở URL nào, bấm gì, thấy gì) + bảng file thay đổi theo mẫu cuối `AGENTS.md`.
5. Mỗi task một nhánh `feature/<mã-task>-<tên-ngắn>` (vd `feature/fe-01-map-picker`), Pull Request vào `main`, không commit thẳng `main`.
6. Đánh dấu `[x]` trong file này và đổi Trạng thái trong Excel khi đã merge.

## Bảng phân công

Điểm = độ lớn tương đối (Cao 5, Trung bình 3, Thấp 2). Thiên giữ các màn cốt lõi (bản đồ, form tạo đơn, lập tuyến, báo giá, sự cố, không giao được), khoảng một nửa khối lượng; Vũ và Thắng làm các màn duyệt, hồ sơ, bồi thường, người nhận, cấu hình, tài xế.

| Mã | Mục | Task | Người | Mức | Phụ thuộc |
|---|---|---|---|---|---|
| FE-01 | R-11 | Component bản đồ dùng chung: chọn điểm, tìm địa chỉ, vẽ tuyến | Thiên | Cao | BE-01 |
| FE-02 | R-10/12/13/16 | Làm lại form tạo đơn của khách | Thiên | Cao | FE-01, BE-03, BE-08, BE-09, BE-15 |
| FE-03 | R-10 | Coordinator lập tuyến dự kiến cho đơn trên bản đồ | Thiên | Cao | FE-01, BE-04 |
| FE-04 | R-10 | Manager duyệt sơ bộ, duyệt tuyến, chốt giá trị ngựa | Vũ | TB | FE-03, BE-04, BE-09 |
| FE-05 | R-10 | Khách xem báo giá chốt, chấp nhận + đồng ý chính sách + cọc | Thiên | TB | BE-05 |
| FE-06 | R-10 | Khách: danh sách giấy cần nộp theo tuyến, hạn nộp, đổi tuyến do công ty | Vũ | TB | BE-06 |
| FE-07 | R-10/14 | Coordinator xếp chuyến từ tuyến đã duyệt + cảnh báo số tài xế | Thắng | TB | BE-07, FE-01 |
| FE-08 | R-12 | Form ngựa: giới tính, mang thai, ngày dự sinh; hiện lỗi điều kiện | Thắng | Thấp | BE-08 |
| FE-09 | R-12/15 | Tài xế: bỏ nút "Rời chuyến", kiểm tra trước khi xuất phát | Thắng | TB | BE-10, BE-11 |
| FE-10 | R-12/14 | Sự cố: hướng xử lý rời chuyến, đổi xe / người, cửa khẩu, quay đầu, nguyên nhân | Thiên | Cao | BE-11, BE-13, BE-14a, BE-14b |
| FE-11 | R-13 | Hồ sơ bồi thường bảo hiểm (khách + manager) | Vũ | TB | BE-12 |
| FE-12 | R-09 | Bồi thường giao trễ: manager duyệt, khách xem | Vũ | Thấp | BE-13 |
| FE-13 | R-16 | Người nhận: sửa trên đơn, xác nhận có mặt, app tài xế gọi điện, e-POD điền sẵn | Vũ | TB | BE-15 |
| FE-14 | R-16 | Không giao được: tài xế ghi nhận, khách chọn cách xử lý, phí chờ | Thiên | Cao | BE-16, FE-13 |
| FE-15 | Chung | Trang Chính sách + hook `usePolicy()` + ô đồng ý dùng chung | Thắng | TB | BE-17 |
| FE-16 | Chung | Admin / Manager: màn cấu hình các khóa mới | Thắng | Thấp | BE-17 |
| FE-17 | R-17 | Hợp đồng vận chuyển: xem trước, chấp nhận, tải PDF, lịch sử phiên bản, chấp nhận bản mới | Thiên | TB | FE-05, BE-20 |

Thứ tự gợi ý: **Thắng** làm FE-15 → FE-16 → FE-08 → FE-07 → FE-09. **Vũ** làm FE-13 → FE-06 → FE-04 → FE-12 → FE-11. **Thiên** làm FE-01 → FE-02 → FE-03 → FE-05 → FE-10 → FE-14. FE-17 làm cùng FE-05.

---

## Việc của Thắng

### [x] FE-15 · Trang Chính sách + `usePolicy()` + ô đồng ý (Chung) — làm đầu tiên vì người khác dùng
- `policyService.getPolicy()` gọi `GET /api/policy` (không cần đăng nhập). Hook `src/hooks/usePolicy.js` (bọc `useFetch`, nhớ kết quả trong phiên).
- Trang công khai `/chinh-sach` (thêm route, link ở footer và header trang chủ): dựng từ nội dung `CHINH_SACH_DICH_VU.md` (13 mục, giữ nguyên tiêu đề và bảng), **thay mọi giá trị `[...]` bằng số từ `usePolicy()`**, hiển thị số phiên bản. Nội dung chữ để trong locale (`policy.*`), có mục lục nhảy tới từng mục.
- Component `src/components/common/PolicyAgreement.jsx`: checkbox "Tôi đã đọc và đồng ý với Chính sách dịch vụ (phiên bản X)" + link mở trang chính sách ở tab mới; trả về `{ accepted, policyVersion }`. FE-02 và FE-05 dùng component này.

### [x] FE-16 · Màn cấu hình các khóa mới
- Mở rộng màn cấu hình thanh toán hiện có (Admin / Manager) thành các nhóm: Báo giá (`Booking.QuoteAcceptDays`), Giao trễ (`Delay.*`), Bảo hiểm (`Insurance.*`), Ngựa (`Horse.MinAgeMonths`), Giao nhận (`Delivery.*`), Phiên bản chính sách.
- Mỗi ô có chú thích ngắn nghĩa là gì; kiểm tra số không âm, % ≤ 100 trước khi gửi.

### [x] FE-08 · Form ngựa: mang thai, hiện lỗi điều kiện (R-12)
- Form thêm / sửa ngựa của khách: thêm giới tính (nếu chưa có), "Đang mang thai" (chỉ hiện với ngựa cái) + ngày dự sinh; "Ngày đẻ gần nhất" (tùy chọn).
- Trong form tạo đơn, khi backend trả lỗi điều kiện (dưới tuổi tối thiểu, mang thai quá 90%, vừa đẻ) → hiện cạnh đúng con ngựa, không chỉ toast. Hiện gợi ý tuổi tối thiểu lấy từ `usePolicy()`.

### [x] FE-07 · Xếp chuyến từ tuyến đã duyệt + cảnh báo tài xế (R-10, R-14)
- Màn lập chuyến của Coordinator: khi chọn ngựa của một đơn, hiện tuyến đã duyệt của đơn (bản đồ `RouteMap` của FE-01) và nút "Dùng tuyến này" để chép mốc vào chuyến.
- Hiện cảnh báo trước khi trình duyệt: "Thời gian lái dự kiến X giờ, cần ít nhất 2 tài xế" khi vi phạm; hiện lỗi "đi qua nước ngoài tuyến đã duyệt" từ backend rõ ràng.

### [x] FE-09 · Tài xế: bỏ "Rời chuyến", kiểm tra trước khi xuất phát (R-12, R-15)
- Màn `TripExecutionPage`: bỏ nút "Rời chuyến" và modal lý do. Thay bằng nút "Ngựa không thể đi tiếp" mở form báo sự cố (`EmergencyReportModal`) đã chọn sẵn loại "Sức khỏe ngựa" + con ngựa, có ô "Đã phải dỡ ngựa khẩn cấp theo chỉ định thú y" (`emergencyOffload`).
- Màn chuẩn bị xuất phát (checklist): gọi `GET /api/trips/{id}/departure-check`, hiện danh sách vấn đề còn lại (giấy hết hạn, thiếu khám 48h, chưa thanh toán, thiếu tài xế) theo từng ngựa / đơn; nút "Xuất phát" chỉ bật khi danh sách trống.
- Hiện trạng thái ngựa mới `Deceased` trong danh sách ngựa và trong `TripHorseStatusTag`.

---

## Việc của Vũ

### [ ] FE-13 · Người nhận ngựa (R-16)
- Component `RecipientForm` (họ tên, SĐT bắt buộc; email; số giấy tờ; ô "Tôi tự nhận ngựa" điền từ hồ sơ tài khoản). FE-02 dùng component này trong form tạo đơn.
- Trang chi tiết đơn của khách: khối "Người nhận" + nút sửa (khóa khi xe đã tới điểm trả); khi tới hạn (backend gửi thông báo) hiện thẻ "Xác nhận người nhận sẽ có mặt" + khung giờ dự kiến, nút **Xác nhận** / **Đổi người nhận**; khi tài xế báo người ký khác tên, hiện yêu cầu "Đồng ý cho [tên] nhận thay".
- App tài xế: ở mốc DropOff hiện tên, SĐT người nhận + nút **Gọi** (`<a href="tel:...">`), trạng thái "khách đã xác nhận có mặt" hoặc chưa.
- e-POD (`ArrivalHandoverPage`): điền sẵn thông tin người nhận từ đơn; tài xế sửa tên người ký nếu khác → hiện cảnh báo cần khách xác nhận, nút ký bị khóa cho tới khi khách xác nhận (tự tải lại mỗi 15 giây hoặc khi có thông báo realtime).

### [ ] FE-06 · Giấy cần nộp theo tuyến, hạn nộp (R-10)
- Màn hồ sơ của khách: hiện danh sách giấy theo **từng nước** (nước đi / quá cảnh / nước đến) của tuyến đã duyệt, **hạn nộp** đếm ngược, số lần đã nhắc; giấy nào còn thiếu nổi bật.
- Khi công ty đổi tuyến làm phát sinh giấy mới: thẻ thông báo "Tuyến đã thay đổi, cần thêm các giấy sau…" + hạn mới + nút **Hủy đơn (hoàn 100%)** có hộp xác nhận.
- Đơn bị hủy vì quá hạn nộp giấy: hiện lý do và số tiền được hoàn.

### [ ] FE-04 · Manager duyệt sơ bộ, duyệt tuyến, chốt giá trị ngựa (R-10)
- Màn duyệt đơn hiện tại đổi nhãn thành **duyệt sơ bộ** (kiểm tra khả thi), giữ từ chối kèm lý do.
- Màn duyệt tuyến: `RouteMap` chỉ xem + bảng chặng (km, giờ), nước quá cảnh, mốc cửa khẩu; bảng ngựa với giá trị khai báo, chứng từ (mở xem), ô **giá trị thỏa thuận** (mặc định = khai báo); **xem trước báo giá chốt** (gọi backend) trước khi bấm **Duyệt tuyến & gửi báo giá** / **Từ chối** (bắt buộc lý do).

### [ ] FE-12 · Bồi thường giao trễ (R-09)
- Manager, màn đóng chuyến (`TripClosurePage`): danh sách đơn trễ do lỗi công ty, số giờ trễ, số tiền bù hệ thống tính; Manager **duyệt** hoặc **sửa số tiền** (bắt buộc lý do).
- Khách: trang thanh toán / chi tiết đơn hiện dòng "Bồi thường giao trễ" với số giờ trễ, số tiền, trạng thái hoàn.


### [ ] FE-11 · Hồ sơ bồi thường bảo hiểm (R-13)
- Khách: mục "Bồi thường" trong trang đơn: danh sách hồ sơ (tự mở hoặc tự tạo), nút **Yêu cầu bồi thường** (chỉ trong 24 giờ sau khi ký e-POD; hiện đếm ngược), tải chứng từ (biên bản thú y, hóa đơn, ảnh), xem quyết định + số tiền.
- Manager: màn danh sách hồ sơ (lọc trạng thái), chi tiết: thông tin ngựa, gói bảo hiểm, giá trị thỏa thuận, **trần chi trả** theo gói, sự cố liên quan, chứng từ; **Duyệt** (nhập số tiền ≤ trần) / **Từ chối** (chọn lý do theo điều khoản loại trừ) / **Đánh dấu đã trả** (mã tham chiếu khi chuyển khoản thủ công).
---

## Việc của Thiên

### [ ] FE-01 · Component bản đồ dùng chung (R-11) — làm đầu tiên
- Cài `leaflet`, `react-leaflet`. Sửa icon marker mặc định của Leaflet khi build bằng Vite.
- `src/components/common/map/MapPicker.jsx`: ô tìm địa chỉ có gợi ý (gọi `GET /api/geo/search`, chờ 400ms sau khi gõ), chọn gợi ý → ghim lên bản đồ; click lên bản đồ → ghim + gọi `/api/geo/reverse` để điền địa chỉ; kéo ghim để chỉnh. Trả về `{ address, lat, lng, countryCode }`.
- `src/components/common/map/RouteMap.jsx`: nhận danh sách mốc (có tọa độ, loại, tên) + polyline; vẽ marker đánh số theo loại (đi / nghỉ / cửa khẩu / đón / trả / đích), đường đi, nhãn quãng đường từng chặng, tổng km; chế độ chỉ xem hoặc cho kéo đổi thứ tự / thêm mốc bằng click (dùng ở FE-03).
- `geoService` gọi các endpoint `/api/geo/*` (BE-01). Thêm endpoint vào `endpoints.js`.
- Dùng được trên điện thoại (bản đồ cao tối thiểu 280px, nút đủ lớn).

### [ ] FE-02 · Làm lại form tạo đơn của khách (R-10, R-12, R-13, R-16)
File chính: `src/features/customer/components/BookingWizard.jsx`.
- Bước lộ trình: điểm đón, điểm trả chọn bằng `MapPicker` (FE-01); **bỏ** ô "Nước quá cảnh"; hiện quãng đường A→B từ bản đồ.
- Thay "giá" bằng **khoảng giá ước tính** (`min – max`, USD + VND) + dòng giải thích "Giá chốt gửi sau khi công ty lập tuyến; chưa phải thanh toán".
- Bước ngựa: **giá trị khai báo từng con**; ≥ ngưỡng `Insurance.ProofThresholdUsd` thì bắt buộc tải chứng từ; chọn gói bảo hiểm từng con (Không mua / Toàn giá trị) với bảng so sánh ngắn lấy số từ `usePolicy()` + link chính sách mục 8.
- Bước người nhận: `RecipientForm` (FE-13).
- Bước xem lại: tóm tắt + `PolicyAgreement` (FE-15) bắt buộc tích mới gửi được; gửi kèm `acceptPolicy`, `policyVersion`.
- Giữ phần lịch đón / hạn giao đã sửa (hạn giao tính từ cuối khoảng đón).

### [ ] FE-03 · Coordinator lập tuyến dự kiến cho đơn (R-10)
- Danh sách đơn `PreApproved` cần lập tuyến (thêm mục vào menu Coordinator).
- Màn lập tuyến: `RouteMap` ở chế độ sửa; điểm đầu / cuối lấy từ đơn (không sửa được); thêm mốc nghỉ / cửa khẩu bằng tìm địa chỉ hoặc click; kéo đổi thứ tự; mỗi lần đổi gọi backend tính lại từng chặng, tổng km, giờ dự kiến, **nước quá cảnh** (hiện dạng cờ / chip theo thứ tự).
- Hiện cảnh báo backend trả về (đổi nước mà thiếu mốc cửa khẩu) ngay tại đoạn đường liên quan; nút **Trình duyệt** khóa khi còn cảnh báo.
- Tuyến bị Manager từ chối: hiện lý do, cho sửa và trình lại; xem được các phiên bản trước.

### [ ] FE-05 · Khách xem báo giá chốt, chấp nhận, cọc (R-10)
- Trang chi tiết đơn ở trạng thái `Quoted`: bảng báo giá chi tiết (cước theo quãng đường, hạng chuồng, phí thủ tục từng nước, bảo hiểm từng con, Express), bản đồ tuyến chỉ xem, **đếm ngược hạn chấp nhận**.
- `PolicyAgreement` + nút **Chấp nhận & đặt cọc** (gọi accept-quote rồi chuyển sang luồng thanh toán VNPay hiện có) và **Từ chối báo giá** (xác nhận, không mất phí).
- Trạng thái `QuoteExpired`: thông báo hết hạn, nút "Gửi lại yêu cầu" (tạo đơn mới điền sẵn thông tin cũ).
- Cập nhật nhãn trạng thái mới (`PreApproved`, `RoutePlanned`, `Quoted`, `QuoteExpired`) ở mọi nơi hiển thị trạng thái đơn và bộ lọc.

### [ ] FE-10 · Sự cố mở rộng (R-12, R-14)
Sửa `IncidentBoard`, `RouteChangeFields`, `TripIncidentsCard`, `EmergencyReportModal`.
- Phương án `OffloadHorse`: chọn ngựa + **hướng xử lý tiếp** (chờ hồi phục / trả về nơi đi / khách nhận tại chỗ / chết). Chọn "chết" thì bắt buộc tải biên bản thú y.
- `ReplaceVehicle`: chọn xe rảnh (lọc đủ chuồng, có điều hòa nếu cần), hiện sức chứa. `ReplaceCrew`: chọn người rời đoàn, người thay, vai trò.
- Loại sự cố mới (`BorderRejected`, `BorderClosed`, `CrewUnavailable`, `RecipientUnavailable`) trong form báo sự cố + nhãn i18n. Hành động `ReturnToOrigin`, `HoldAtStable`.
- Đi đường vòng có phí thêm: ô "Chi phí khách phải trả thêm"; khách thấy thẻ **Đồng ý / Không đồng ý** trên trang đơn (không đồng ý → quay về).
- Đóng sự cố: bắt buộc chọn **nguyên nhân** (Lỗi công ty / Lỗi khách / Bất khả kháng) kèm giải thích ngắn hệ quả tiền theo bảng 9.1 của chính sách; hiện số tiền hoàn / phát sinh backend tính trước khi xác nhận.
- Tài xế và khách thấy kết quả (đổi xe, đổi người, quay đầu) trong khung sự cố.

### [ ] FE-14 · Không giao được, phí chờ (R-16)
- e-POD (`ArrivalHandoverPage`): nút **Không giao được** → chọn lý do (vắng mặt / từ chối / từ chối vì ngựa bị thương / giao nhầm ngựa), ghi chú, chụp ảnh (bắt buộc với 2 lý do cuối); hiện số giờ đã chờ (tính từ lúc check-in điểm trả) và mốc bắt đầu tính phí.
- Khách: thẻ **"Chưa giao được ngựa — chọn cách xử lý"** với đếm ngược 24 giờ, 3 lựa chọn (người nhận / địa chỉ khác dùng `RecipientForm` + `MapPicker`; gửi chuồng tạm; chở về), mỗi lựa chọn ghi rõ ai trả phí; quá hạn thì hiện "Đã áp dụng gửi chuồng tạm".
- Phí chờ hiện trong khoản phát sinh của đơn (số giờ × đơn giá), thanh toán qua luồng Extra hiện có.
- Từ chối vì ngựa bị thương / nhầm ngựa: hiện cho khách rằng hồ sơ bồi thường đã được mở (link FE-11) và phí chuồng do công ty chịu.

### [ ] FE-17 · Hợp đồng vận chuyển (R-17)
Đọc `doc/PLAN_NGHIEP_VU_R09.md` mục R-17 và `doc/CHINH_SACH_DICH_VU.md` mục 12. **Không có màn ký, không OTP.**
- Trang báo giá (FE-05): nút **Xem hợp đồng** mở PDF (modal toàn màn hình dùng `<iframe>` / `<object>`; trên điện thoại mở tab mới) từ `GET /api/bookings/{id}/contract`. Nút **Chấp nhận & đặt cọc** chỉ bật khi khách đã mở hợp đồng ít nhất một lần **và** tích "Tôi đã đọc hợp đồng và Chính sách dịch vụ" (thay checkbox của `PolicyAgreement` ở bước này). Gửi kèm `contractId`, `contractSha256` nhận được lúc mở. Backend báo hợp đồng đã đổi → thông báo và tải lại bản mới.
- Trang chi tiết đơn: khối **Hợp đồng**: số hợp đồng, phiên bản, trạng thái, thời điểm chấp nhận, nút **Tải PDF**; danh sách các phiên bản cũ (đã thay thế) để tải lại.
- Có bản hợp đồng mới chờ chấp nhận (đổi điểm đón / trả, đồng ý đi đường vòng, đổi người nhận): thẻ nổi bật "Hợp đồng cần xác nhận lại" kèm lý do, xem PDF, tích đã đọc, **Chấp nhận** (`POST /api/contracts/{id}/accept`). Thay đổi chỉ hiển thị là đã áp dụng sau khi chấp nhận.
- Nhân sự (Manager, Specialist, Coordinator): xem / tải hợp đồng hiện hành trong màn chi tiết đơn.
- Coordinator, chuyến đường hàng không: ô nhập số Air Waybill + tải tệp; hiện trong chi tiết chuyến cho mọi vai trò được xem chuyến.
