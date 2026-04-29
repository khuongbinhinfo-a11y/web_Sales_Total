# KẾ HOẠCH V2 – SẮP XẾP LẠI TRANG CHỦ & KHUNG TRANG CON
## Website: Ứng Dụng Thông Minh

---

## 1) Mục tiêu chính

Sắp xếp lại website theo hướng rõ ràng hơn, nhưng **không đập đi làm lại UI và không đổi cấu trúc chức năng bên trong**.

Trọng tâm giai đoạn này là:

1. **Bố cục lại trang Home**
2. **Xác định 2 nhánh chính trên Home**
3. **Chỉ ra các khối hiện có trên Home sẽ chuyển đi đâu**
4. **Tạo khung bố cục chung cho các trang con**
5. Phần chi tiết từng trang con sẽ làm ở bước sau

---

## 2) Nguyên tắc bắt buộc cho dev

### Không làm
- Không đổi toàn bộ UI.
- Không đổi kiến trúc app.
- Không đổi route nếu không cần thiết.
- Không xóa dữ liệu/sản phẩm hiện có.
- Không làm lại hệ thống đăng nhập, admin, sản phẩm.
- Không nhồi tất cả nội dung lên Home.

### Chỉ làm
- Sắp xếp lại thứ tự hiển thị.
- Chuyển một số khối hiện có từ Home sang trang con phù hợp.
- Tinh chỉnh độ cao, khoảng cách, độ sáng, vị trí text.
- Làm Home rõ vai trò hơn: **trang mẹ điều hướng**.

---

## 3) Định hướng mới của website

Website không nên thể hiện như một “shop sản phẩm/key” ở trang chủ.

Định hướng mới:

> **Ứng Dụng Thông Minh là trang mẹ giới thiệu 2 nhóm giải pháp số chính: Thiết kế Web và Phần mềm.**

Trong đó:

```text
Ứng Dụng Thông Minh
├── Thiết kế Web
└── Phần mềm
    ├── Học tập
    └── Làm việc
```

---

## 4) Hai nhánh chính trên Home

### Nhánh 1: Thiết kế Web

Dùng để giới thiệu:
- Dịch vụ thiết kế website
- Mẫu demo web theo ngành
- Web bán hàng
- Web dịch vụ
- Web catalogue
- Web có admin
- Web cho doanh nghiệp nhỏ

CTA chính:
- Xem mẫu web
- Tư vấn làm web
- Xem bảng giá web

---

### Nhánh 2: Phần mềm

Dùng để gom:
- Phần mềm mini
- Tool hỗ trợ công việc
- Key/phần mềm số nếu còn bán
- Công cụ AI
- Ứng dụng học tập
- Ứng dụng làm việc

Bên trong phần mềm mới chia tiếp:

```text
Phần mềm
├── Học tập
└── Làm việc
```

CTA chính:
- Xem phần mềm
- Xem công cụ học tập
- Xem công cụ làm việc

---

## 5) Bố cục Home mới

Home chỉ cần gọn, rõ, có định vị và điều hướng tốt.

### Thứ tự section Home đề xuất

```text
1. Hero video
2. Thanh chạy sản phẩm/dịch vụ
3. Khối bẻ nhánh chính: Thiết kế Web / Phần mềm
4. Nội dung nhẹ giải thích website làm gì
5. CTA cuối trang / Footer
```

---

# 6) Chi tiết từng section Home

---

## SECTION 1 – HERO VIDEO

### Giữ lại
- Giữ hero video nền hiện tại.
- Giữ phong cách hiện đại.

### Chỉnh lại
Text không đặt giữa video như hiện tại.

Text đặt ở **phần chân video**, khoảng 70–85% chiều cao video.

### Nội dung text hero

Dòng 1 – chữ lớn, có chạy màu:

> **Giải Pháp Số**

Dòng 2 – chữ nhỏ hơn:

> **Tiện Dụng Cho Người Kinh Doanh Nhỏ**

### Gợi ý UI
- Text nằm trong vùng video.
- Có overlay tối nhẹ ở chân video để chữ dễ đọc.
- “Giải Pháp Số” dùng gradient chạy màu nhẹ.
- Không làm hiệu ứng quá gắt.
- Trên mobile, text vẫn nằm thấp nhưng không bị sát mép dưới.

### Mục tiêu
Hero tạo cảm giác:
- Đây là trang thương hiệu chính.
- Web có định vị rõ.
- Không giống trang bán hàng lộn xộn.

---

## SECTION 2 – THANH CHẠY SẢN PHẨM / DỊCH VỤ

### Giữ lại
- Vẫn giữ thanh chạy sản phẩm/dịch vụ hiện tại.

### Chỉnh lại
- Làm thanh chạy **lùn hơn**.
- Làm màu nền **sáng hơn**.
- Item gọn hơn.
- Không chiếm quá nhiều chiều cao.
- Không để nặng và tối hơn hero.

### Vai trò mới của thanh chạy
Thanh này chỉ đóng vai trò gợi nhanh hệ sinh thái:

Ví dụ:
- Website
- Phần mềm
- Học tập
- Làm việc
- Công cụ AI
- Tự động hóa
- Quản lý
- Bán hàng

### Lưu ý
Thanh này không phải nơi bán sản phẩm chính.  
Không nên kéo toàn bộ sản phẩm chi tiết lên đây.

---

## SECTION 3 – KHỐI BẺ NHÁNH CHÍNH

Phần này sửa lại theo hướng chỉ còn **2 nhánh lớn**:

1. **Thiết kế Web**
2. **Phần mềm**

Không để 4 nút ngang hàng: Phần mềm / Học tập / Làm việc / Thiết kế web nữa.

Vì **Học tập** và **Làm việc** là nhánh con nằm trong **Phần mềm**.

---

### Card 1 – Thiết kế Web

Tiêu đề:

> **Thiết kế Web**

Mô tả ngắn:

> Website giới thiệu, bán hàng, dịch vụ và catalogue theo ngành, dễ dùng và dễ triển khai.

CTA:

> Xem mẫu web

Gợi ý phụ:
- Có thể hiện 3 tag nhỏ:
  - Web bán hàng
  - Web dịch vụ
  - Web catalogue

---

### Card 2 – Phần mềm

Tiêu đề:

> **Phần mềm**

Mô tả ngắn:

> Phần mềm mini, công cụ học tập, làm việc và AI hỗ trợ người kinh doanh nhỏ xử lý công việc nhanh hơn.

CTA:

> Xem phần mềm

Gợi ý phụ:
- Có thể hiện 3 tag nhỏ:
  - Học tập
  - Làm việc
  - Công cụ AI

---

### Gợi ý UI cho khối bẻ nhánh
- Dùng 2 card lớn, nổi bật, cân đối.
- Card phải đẹp hơn nút thường.
- Mỗi card có icon/ảnh minh họa nhẹ.
- Có hover effect.
- Có gradient hoặc border sáng nhẹ.
- Bố cục desktop: 2 card ngang.
- Bố cục mobile: 2 card xếp dọc.
- Không làm card quá nhỏ.

### Mục tiêu
Khách vào Home chỉ cần chọn:

> Tôi cần làm web  
hoặc  
> Tôi cần phần mềm/công cụ

Như vậy Home sạch hơn và dễ hiểu hơn.

---

## SECTION 4 – NỘI DUNG NHẸ BỔ SUNG

Cần thêm một khối nhẹ để tránh Home chỉ có video + nút.

Khuyến nghị dùng khối 3 lợi ích.

### Tiêu đề

> Giải pháp gọn, dễ dùng, phù hợp người kinh doanh nhỏ

### 3 lợi ích

#### 1. Dễ bắt đầu
Không cần rành kỹ thuật, có thể chọn mẫu hoặc công cụ phù hợp nhu cầu.

#### 2. Triển khai nhanh
Ưu tiên giải pháp gọn, thực tế, không làm phức tạp quá mức cần thiết.

#### 3. Có thể mở rộng
Khi cần có thể bổ sung thêm tính năng, nội dung, sản phẩm hoặc công cụ hỗ trợ.

### Gợi ý UI
- Dạng 3 icon-card nhỏ.
- Nền sáng hơn Home hiện tại.
- Text ngắn, thoáng.
- Không làm thành section quá dài.

---

## SECTION 5 – CTA CUỐI TRANG / FOOTER

Footer cần có vai trò chốt thương hiệu và dẫn khách hành động.

### CTA cuối trang

Tiêu đề:

> Bạn đang cần web hoặc phần mềm cho công việc kinh doanh?

Mô tả:

> Ứng Dụng Thông Minh cung cấp giải pháp số gọn, dễ dùng cho người kinh doanh nhỏ: từ website theo ngành đến phần mềm mini và công cụ hỗ trợ làm việc.

Nút:
- Xem mẫu web
- Xem phần mềm
- Nhắn Zalo tư vấn

---

## 7) Những khối hiện có trên Home sẽ chuyển đi đâu?

Đây là phần quan trọng để dev không bị rối.

---

### 7.1. Khối Web Demo / Mẫu web theo ngành

#### Hiện trạng
Đang xuất hiện trên Home.

#### Cách xử lý
Không để toàn bộ khối demo dài trên Home.

#### Chuyển sang
Trang con:

```text
/thiet-ke-web
/mau-demo
```

#### Trên Home chỉ giữ
- 1 card nhánh lớn “Thiết kế Web”
- Có thể hiện 3–4 tag ngành tiêu biểu nếu cần:
  - Bán hàng
  - Dịch vụ
  - Công nghiệp
  - Làm đẹp

#### Lý do
Home chỉ điều hướng.  
Chi tiết mẫu web để trong trang Thiết kế Web hoặc Mẫu Demo.

---

### 7.2. Khối danh mục sản phẩm

#### Hiện trạng
Đang nằm ở Home, dễ làm trang chủ giống shop.

#### Cách xử lý
Chuyển sang trang:

```text
/phan-mem
```

hoặc nếu hệ thống đang dùng route sản phẩm:

```text
/san-pham
```

#### Lưu ý
Nếu route `/san-pham` đã tồn tại thì giữ route đó, nhưng trên giao diện nên gọi thân thiện là:

> **Phần mềm**

#### Trên Home chỉ giữ
- Card nhánh “Phần mềm”
- Một vài tag nhỏ:
  - Học tập
  - Làm việc
  - AI
  - Tiện ích

---

### 7.3. Khối sản phẩm bán chạy / sản phẩm nổi bật

#### Hiện trạng
Đang xuất hiện trên Home.

#### Cách xử lý
Không nên để nhiều sản phẩm trên Home.

#### Chuyển sang
Trang:

```text
/phan-mem
```

hoặc:

```text
/san-pham
```

#### Trên Home nếu vẫn muốn giữ
Chỉ giữ rất nhẹ:
- 3 sản phẩm tiêu biểu tối đa
- hoặc chỉ chạy trong thanh marquee
- không để thành một section lớn

#### Khuyến nghị
Giai đoạn này nên bỏ section sản phẩm khỏi Home để Home sạch.

---

### 7.4. Khối hướng dẫn mua hàng / nhận key

#### Hiện trạng
Đang nằm ở Home.

#### Cách xử lý
Chuyển sang trang:

```text
/huong-dan
```

hoặc đặt trong trang:

```text
/phan-mem
```

#### Lý do
Hướng dẫn mua key chỉ liên quan đến phần mềm/key, không nên đặt trên Home vì làm hẹp định vị thương hiệu.

#### Trên Home
Không cần hiển thị hướng dẫn nhận key.

---

### 7.5. Khối tài khoản / đăng nhập / đăng ký

#### Hiện trạng
Đang có trên menu.

#### Cách xử lý
Giữ chức năng, không sửa logic.

#### Trên menu
Có thể giữ:
- Đăng nhập
- Đăng ký
- Tài khoản

Nhưng nên đặt ở góc phải hoặc khu vực tài khoản, không để ngang hàng quá nổi bật với nhánh chính.

#### Lưu ý
Tài khoản phục vụ khách đã mua hoặc đang dùng phần mềm.  
Không nên làm nó lấn át 2 nhánh chính.

---

### 7.6. Mục Admin

#### Hiện trạng
Admin có thể đang hiện ở menu public.

#### Cách xử lý
Không xóa chức năng admin.

Nhưng nên:
- Ẩn khỏi menu khách thường.
- Chỉ hiện khi tài khoản quản trị đăng nhập.
- Hoặc vào bằng link riêng.

#### Lý do
Admin xuất hiện công khai làm web kém chuyên nghiệp và tạo cảm giác chưa hoàn thiện.

---

### 7.7. Khối đánh giá khách hàng / feedback

#### Nếu hiện có
Không cần đặt ở Home giai đoạn này nếu nội dung chưa đủ mạnh.

#### Chuyển sang
Có thể đặt ở:
```text
/thiet-ke-web
```
hoặc:
```text
/phan-mem
```

tùy feedback liên quan đến dịch vụ nào.

#### Trên Home
Chỉ dùng lại sau khi có feedback thật, ngắn và đáng tin.

---

### 7.8. Khối hỗ trợ nhanh / Zalo / gọi điện

#### Hiện trạng
Đây là khối tốt.

#### Cách xử lý
Giữ lại toàn site.

#### Tinh chỉnh
CTA thay đổi theo ngữ cảnh:

- Home: Nhắn Zalo tư vấn
- Thiết kế Web: Tư vấn làm web
- Phần mềm: Hỗ trợ phần mềm
- Hướng dẫn: Hỗ trợ mua hàng

---

## 8) Menu đề xuất sau khi bố cục lại

### Menu chính gọn

```text
Trang chủ
Thiết kế Web
Phần mềm
Hướng dẫn
Liên hệ
```

### Nhánh phụ trong Phần mềm

```text
Phần mềm
├── Học tập
├── Làm việc
└── Công cụ AI / Tiện ích
```

### Tài khoản
Đặt riêng góc phải:

```text
Đăng nhập / Đăng ký / Tài khoản
```

### Admin
Không nằm trong menu public.

---

## 9) Khung bố cục chung cho các trang con

Phần này chỉ là khung chung.  
Chi tiết từng trang con sẽ làm sau.

---

# 9.1. Trang con: Thiết kế Web

Route đề xuất:

```text
/thiet-ke-web
```

### Mục tiêu
Đây là trang bán dịch vụ làm website.

### Bố cục chung

```text
1. Hero trang con
2. Giới thiệu ngắn dịch vụ thiết kế web
3. Các loại web có thể làm
4. Mẫu demo theo ngành
5. Quy trình triển khai
6. Gói giá tham khảo
7. Câu hỏi thường gặp
8. CTA liên hệ
```

### Nội dung chính
- Web giới thiệu
- Web bán hàng
- Web dịch vụ
- Web catalogue
- Web có admin
- Web theo ngành

### CTA
- Xem mẫu demo
- Nhắn Zalo tư vấn
- Chọn mẫu web

---

# 9.2. Trang con: Mẫu Demo

Route đề xuất:

```text
/mau-demo
```

hoặc nằm trong:

```text
/thiet-ke-web/mau-demo
```

### Mục tiêu
Trưng bày các mẫu web theo ngành.

### Bố cục chung

```text
1. Hero ngắn
2. Bộ lọc ngành
3. Grid mẫu demo
4. Mỗi demo có ảnh, tên ngành, mô tả, nút xem
5. CTA tư vấn chỉnh mẫu
```

### Nhóm demo gợi ý
- Công ty / Dịch vụ
- Shop bán hàng
- Salon tóc
- Spa / Làm đẹp
- Bất động sản
- Giáo dục
- Nhà hàng / Local
- Vật tư công nghiệp

---

# 9.3. Trang con: Phần mềm

Route đề xuất:

```text
/phan-mem
```

Nếu hiện route đang là `/san-pham`, có thể giữ route đó nhưng đổi label giao diện thành **Phần mềm**.

### Mục tiêu
Đây là nơi gom tất cả sản phẩm số, phần mềm, key, tool, công cụ AI.

### Bố cục chung

```text
1. Hero trang phần mềm
2. Bộ lọc nhóm: Học tập / Làm việc / AI / Tiện ích
3. Sản phẩm nổi bật
4. Danh sách phần mềm
5. Hướng dẫn mua / nhận key
6. Chính sách hỗ trợ
7. CTA hỗ trợ
```

### Nhóm bên trong
```text
Phần mềm
├── Học tập
├── Làm việc
├── Công cụ AI
└── Tiện ích khác
```

---

# 9.4. Trang con: Học tập

Route đề xuất:

```text
/phan-mem/hoc-tap
```

### Mục tiêu
Gom phần mềm/công cụ liên quan học tập, ôn thi, đào tạo.

### Bố cục chung

```text
1. Hero nhóm Học tập
2. Giới thiệu ngắn
3. Danh sách công cụ học tập
4. Lợi ích
5. Hướng dẫn sử dụng/mua
6. CTA hỗ trợ
```

---

# 9.5. Trang con: Làm việc

Route đề xuất:

```text
/phan-mem/lam-viec
```

### Mục tiêu
Gom phần mềm/công cụ hỗ trợ công việc hằng ngày.

### Bố cục chung

```text
1. Hero nhóm Làm việc
2. Giới thiệu ngắn
3. Danh sách công cụ làm việc
4. Lợi ích
5. Hướng dẫn sử dụng/mua
6. CTA hỗ trợ
```

---

# 9.6. Trang con: Hướng dẫn

Route đề xuất:

```text
/huong-dan
```

### Mục tiêu
Chứa hướng dẫn mua hàng, nhận key, sử dụng phần mềm, liên hệ hỗ trợ.

### Bố cục chung

```text
1. Hero ngắn
2. Hướng dẫn mua phần mềm/key
3. Hướng dẫn nhận key
4. Hướng dẫn liên hệ hỗ trợ
5. Câu hỏi thường gặp
6. CTA Zalo
```

---

# 9.7. Trang con: Liên hệ

Route đề xuất:

```text
/lien-he
```

### Mục tiêu
Tập trung thông tin liên hệ.

### Bố cục chung

```text
1. Hero liên hệ
2. Thông tin Zalo / số điện thoại / email
3. Form gửi yêu cầu
4. Gợi ý chọn nhu cầu:
   - Tôi cần làm web
   - Tôi cần phần mềm
   - Tôi cần hỗ trợ sản phẩm
5. Bản đồ hoặc social nếu có
```

---

## 10) Sitemap đề xuất

```text
/
├── thiet-ke-web
│   └── mau-demo
├── phan-mem
│   ├── hoc-tap
│   ├── lam-viec
│   └── cong-cu-ai
├── huong-dan
├── lien-he
├── tai-khoan
└── admin
```

Nếu không muốn đổi route hiện có, chỉ cần đổi cách đặt tên và điều hướng giao diện:

```text
/san-pham => hiển thị là Phần mềm
/web-demo => hiển thị là Mẫu Demo
```

---

## 11) Mapping nhanh: Home hiện tại xử lý thế nào?

| Khối hiện tại trên Home | Xử lý mới |
|---|---|
| Hero video | Giữ, chuyển text xuống chân video |
| Text “Giải Pháp Số...” | Giữ, chỉnh cấp chữ và hiệu ứng |
| Thanh chạy sản phẩm | Giữ, làm lùn hơn và sáng hơn |
| Web demo theo ngành | Chuyển sang Thiết kế Web / Mẫu Demo |
| Danh mục sản phẩm | Chuyển sang Phần mềm |
| Sản phẩm bán chạy | Chuyển sang Phần mềm, Home chỉ giữ rất nhẹ nếu cần |
| Hướng dẫn mua/nhận key | Chuyển sang Hướng dẫn hoặc Phần mềm |
| Đăng nhập/Đăng ký/Tài khoản | Giữ, đặt khu vực tài khoản |
| Admin | Ẩn khỏi menu public |
| Hỗ trợ nhanh/Zalo | Giữ toàn site |
| Footer cũ | Làm lại thành CTA/footer rõ hơn |

---

## 12) Yêu cầu nghiệm thu sau khi dev làm

Trang Home sau khi chỉnh phải đạt:

1. Home không còn cảm giác là shop sản phẩm lộn xộn.
2. Người xem hiểu ngay web có 2 hướng chính:
   - Thiết kế Web
   - Phần mềm
3. Học tập và Làm việc nằm trong Phần mềm, không đứng ngang hàng ở Home.
4. Hero đẹp hơn, text nằm ở chân video.
5. Thanh chạy gọn hơn, sáng hơn.
6. Khối bẻ nhánh đẹp, rõ, dễ bấm.
7. Các khối sản phẩm/demo/hướng dẫn đã được đưa về đúng trang con.
8. Footer có CTA rõ.
9. Không phá logic hiện có.
10. Mobile vẫn rõ và dễ thao tác.

---

## 13) Prompt ngắn giao dev

Sắp xếp lại trang Home của Ứng Dụng Thông Minh theo hướng trang mẹ điều hướng, không đổi cấu trúc chức năng bên trong và không đập UI làm lại.

Home chỉ giữ 5 khối chính:
1. Hero video
2. Thanh chạy sản phẩm/dịch vụ
3. Khối bẻ nhánh chính gồm 2 hướng: Thiết kế Web và Phần mềm
4. Một khối nội dung nhẹ 3 lợi ích
5. CTA/footer cuối trang

Yêu cầu:
- Hero giữ video nền, text đặt ở chân video, không đặt giữa.
- Text hero:
  - “Giải Pháp Số” chữ lớn, có chạy màu nhẹ
  - “Tiện Dụng Cho Người Kinh Doanh Nhỏ” chữ nhỏ hơn
- Thanh chạy sản phẩm giữ lại nhưng làm lùn hơn, sáng hơn.
- Khối bẻ nhánh chỉ còn 2 card lớn:
  - Thiết kế Web
  - Phần mềm
- Học tập và Làm việc không đứng ngang hàng ở Home, mà nằm trong Phần mềm.
- Chuyển Web Demo sang trang Thiết kế Web/Mẫu Demo.
- Chuyển danh mục sản phẩm và sản phẩm nổi bật sang trang Phần mềm.
- Chuyển hướng dẫn mua/nhận key sang trang Hướng dẫn hoặc Phần mềm.
- Ẩn Admin khỏi menu public.
- Giữ hỗ trợ nhanh/Zalo toàn site.
- Footer đổi thành CTA rõ: web hoặc phần mềm cho người kinh doanh nhỏ.

Không xóa dữ liệu, không sửa logic admin, không đổi hệ thống tài khoản. Chỉ sắp xếp lại bố cục và điều hướng.
## Bổ sung tone màu tổng thể

Giữ phong cách công nghệ hiện tại nhưng điều chỉnh cách phối màu theo hướng sạch, sáng và dễ tin cậy hơn. Không đổi toàn bộ UI, chỉ tinh chỉnh màu nền, card, CTA, hero và footer.

Tone chính đề xuất: Tech Blue Clean

Bảng màu:
- Navy đậm cho hero/footer: #071827
- Xanh dương chính: #2563EB
- Cyan phụ: #06B6D4
- Tím nhấn nhẹ: #8B5CF6
- Nền sáng: #F6F9FC
- Card trắng: #FFFFFF
- Chữ chính: #0F172A
- Chữ phụ: #64748B
- Viền/card: #E2E8F0

Cách dùng:
- Hero và footer dùng nền tối/navy để tạo điểm nhấn thương hiệu.
- Thân trang dùng nền sáng/trắng để sạch, dễ đọc, dễ tin cậy.
- Chữ “Giải Pháp Số” dùng gradient nhẹ: #06B6D4 → #2563EB → #8B5CF6.
- Thanh chạy sản phẩm làm sáng hơn, lùn hơn, nền #F6F9FC hoặc #EFF6FF.
- Card bẻ nhánh dùng nền trắng, viền sáng, hover nhẹ.
- CTA chính dùng xanh #2563EB hoặc gradient cyan → blue.
- Không dùng neon quá gắt, không dùng quá nhiều màu cho từng nhánh.
- Tỷ lệ màu đề xuất: 60% nền sáng/trắng, 25% navy, 10% xanh chính, 5% cyan/tím nhấn.

Mục tiêu:
Trang vẫn giữ cảm giác công nghệ nhưng thân thiện hơn với người kinh doanh nhỏ, không bị giống web bán key/tool rời rạc.