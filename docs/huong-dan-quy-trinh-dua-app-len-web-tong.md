# Hướng Dẫn Quy Trình Đưa App Lên Web Tổng (Bản Dễ Hiểu)

## 1) Mục đích tài liệu
- Giúp team vận hành hiểu cách app đang lên quầy bán trên Web Tổng.
- Có quy trình rõ ràng để đưa 1 app mới lên web, hạn chế sai sót.
- Dùng ngôn ngữ đơn giản, không cần kiến thức lập trình chuyên sâu.

## 2) Cơ chế hiện tại: app trên quầy bán đang liên kết với Web Tổng như thế nào?

Hiểu ngắn gọn: hệ thống chạy theo chuỗi **App -> Gói bán (Sản phẩm) -> Quầy bán -> Đơn hàng -> Key/License**.

### 2.1 App là "nhóm sản phẩm"
- Mỗi app có mã riêng (ví dụ: `app-bds-website-manager`, `app-study-12`).
- Mỗi app có thể có nhiều gói bán (theo tháng, năm, trọn đời...).

### 2.2 Gói bán quyết định cái gì hiển thị và cái gì được mua
- Gói có giá, chu kỳ, trạng thái bật/tắt.
- Gói chỉ lên quầy bán công khai khi thỏa điều kiện hiển thị hiện tại:
1. Gói đang bật.
2. Gói ở chế độ hiển thị công khai.
3. Trạng thái card cho phép bán.

### 2.3 Cơ chế kiểm soát bán hiện tại (trong Admin)
- Team có thể điều khiển theo từng gói ở mục **Card sản phẩm**:
1. `Đang bán` (mua bình thường).
2. `Tạm khóa` (vẫn thấy card, nhưng không tạo đơn).
3. `Coming soon` (cho xem trước, chưa mua).
- Có ô ghi chú để hiện lý do ngoài web.

### 2.4 Cơ chế giá hiện tại
- Có thể set giảm trực tiếp theo gói:
1. Hiển thị **giá gốc**.
2. Hiển thị **giá giảm** bên cạnh để thu hút mua.
- Có tùy chọn: cho phép cộng thêm mã giảm giá hoặc không.

### 2.5 Cơ chế mã giảm giá
- Mã giảm giá tạo trong Admin.
- Mã có thời gian hiệu lực, bật/tắt chủ động.
- Tùy cờ của gói, mã có thể được cộng thêm hoặc bị chặn.

### 2.6 Sau khi khách mua
- Hệ thống tạo đơn.
- Khi thanh toán thành công, hệ thống cấp key/license theo gói đã mua.

---

## 3) Quy trình đưa 1 app mới lên Web Tổng

## 3.1 Chuẩn bị thông tin trước
Chuẩn bị đủ các mục sau (để không bị thiếu giữa chừng):
1. Tên app hiển thị ngoài web.
2. Mã app nội bộ (viết liền, không dấu, thống nhất).
3. Danh sách gói sẽ bán (tháng/năm/trọn đời...).
4. Giá gốc từng gói.
5. Nếu chạy sale: giá giảm từng gói.
6. Ảnh đại diện app/gói.
7. Kịch bản test mua thử 1 đơn.

## 3.2 Tạo app và gói bán trong dữ liệu hệ thống
Mục tiêu: để Web Tổng đọc được app và các gói thuộc app đó.

Kết quả mong muốn sau bước này:
1. App đã tồn tại trong danh mục.
2. Mỗi gói có mã gói riêng, giá rõ ràng, chu kỳ rõ ràng.

## 3.3 Mở kiểm soát hiển thị trong Admin
Vào **Admin -> Card sản phẩm** và kiểm tra từng gói:
1. Trạng thái card = `Đang bán` nếu muốn cho mua ngay.
2. Nếu chưa mở bán: dùng `Coming soon`.
3. Nếu đang bảo trì: dùng `Tạm khóa`.
4. Ghi chú rõ lý do để đội CSKH dễ trả lời khách.

## 3.4 Set giá (nếu có chương trình sale)
Cho từng gói:
1. Nhập giá gốc.
2. Bật giảm trực tiếp và nhập giá giảm.
3. Chọn có cho cộng thêm mã giảm giá hay không.

## 3.5 Tạo mã giảm giá (nếu cần)
Vào **Admin -> Mã giảm giá**:
1. Tạo mã.
2. Chọn phần trăm giảm.
3. Chọn thời gian chạy.
4. Bật mã.

## 3.6 Test mua thử trước khi công bố
Checklist test nhanh:
1. Mở trang chủ, thấy card và giá hiển thị đúng.
2. Bấm vào trang chi tiết, thấy giá đúng (gốc + giảm nếu có).
3. Tạo đơn thành công.
4. Test mã giảm giá (nếu có).
5. Thanh toán test thành công và nhận key/license đúng.

## 3.7 Công bố chính thức
Sau khi test pass:
1. Chuyển trạng thái card các gói cần bán về `Đang bán`.
2. Theo dõi 3-5 đơn đầu để chắc luồng ổn định.

---

## 4) Ví dụ thực tế

## 4.1 Ví dụ A: đưa app mới `App-BDS(new)` lên Web Tổng

Mục tiêu: app mới lên quầy bán, có giá gốc và giá giảm hiển thị rõ.

Quy trình ngắn:
1. Tạo app `app-bds-new` (tên hiển thị: App-BDS(new)).
2. Tạo các gói, ví dụ:
   - `prod-bds-new-month` (tháng)
   - `prod-bds-new-year` (năm)
   - `prod-bds-new-lifetime` (trọn đời)
3. Vào Admin -> Card sản phẩm:
   - Đặt trạng thái `Đang bán` cho gói muốn mở ngay.
   - Nếu pre-launch: để `Coming soon`.
4. Set giá:
   - Giá gốc: ví dụ 990.000
   - Giá giảm: ví dụ 690.000
   - Bật giảm trực tiếp.
5. Chọn chính sách mã:
   - Nếu muốn khách nhập thêm mã: bật cho cộng mã.
   - Nếu không muốn chồng giảm: tắt cho cộng mã.
6. Test mua 1 đơn thật/đơn test.
7. Pass thì công bố.

## 4.2 Ví dụ B: thêm gói mới cho app `Phần mềm ôn tập cho khối cấp 01 và Tiền Tiểu học`

Mục tiêu: mở thêm gói mới nhưng không ảnh hưởng gói cũ.

Quy trình ngắn:
1. Giữ nguyên app hiện có (`app-study-12`).
2. Chỉ thêm gói mới, ví dụ `prod-study-premium-year-plus`.
3. Đặt trạng thái card cho gói mới:
   - ban đầu `Coming soon` để kiểm tra giao diện.
4. Set giá và chương trình sale (nếu có).
5. Test mua riêng gói mới.
6. Khi ổn thì chuyển `Đang bán`.

---

## 5) Checklist bàn giao nội bộ (copy dùng ngay)

## 5.1 Trước khi mở bán
- [ ] App đã có trong danh mục.
- [ ] Gói bán đã tạo đủ (mã gói không trùng).
- [ ] Giá gốc và giá giảm đã nhập đúng.
- [ ] Trạng thái card từng gói đúng mục tiêu.
- [ ] Có/không cho cộng mã giảm giá đã chọn rõ.
- [ ] Test tạo đơn + thanh toán + nhận key pass.

## 5.2 Sau khi mở bán
- [ ] Theo dõi 3-5 đơn đầu tiên.
- [ ] Kiểm tra phản hồi CSKH về giá hiển thị.
- [ ] Nếu có lỗi: tạm khóa card ngay, xử lý sau.

---

## 6) Nguyên tắc vận hành an toàn
1. Không mở tất cả gói cùng lúc nếu app mới hoàn toàn.
2. Luôn test 1 đơn trước khi chạy truyền thông.
3. Nếu có bất thường thanh toán/key: chuyển gói sang `Tạm khóa` ngay.
4. Mọi thay đổi giá nên có ghi chú nội bộ để truy lại nhanh.
