# Web Demo Platform Plan v1

## Muc tieu
Chuyen tu demo tinh roi rac sang nen tang web-mau co admin don gian, de nhan ban cho nhieu khach, de doi mau thuong hieu va de cap nhat noi dung nhanh.

## Pham vi phase hien tai
- 5 template uu tien: company, shop, salon, industry, landing.
- Co admin tai /admin de quan ly config template va leads.
- Moi template dung config tu DB (khong map cheo branch khac).

## Module can co
1. Site Settings
2. Theme Settings
3. Page Sections
4. Services
5. Products
6. Leads
7. SEO Settings

## Da khoi tao trong branch nay
- Migration tao bang web_demo_templates, web_demo_leads.
- API admin:
  - GET /api/admin/web-demo/templates
  - GET /api/admin/web-demo/templates/:templateSlug
  - PUT /api/admin/web-demo/templates/:templateSlug
  - GET /api/admin/web-demo/leads
  - PATCH /api/admin/web-demo/leads/:leadId
- API public:
  - GET /api/web-demo/templates/:templateSlug
  - POST /api/web-demo/leads/:templateSlug
- UI admin MVP trong /admin:
  - Chon template
  - Sua config JSON + SEO JSON
  - Luu DB
  - Xem danh sach leads + doi trang thai
- Trang /web-demo/:id da co load config dong tu API de override noi dung/mau/toggle section.

## Mapping theo template
### company
- services, capabilities, projects/case, contact.

### shop
- products, categories, price, gallery, featured products, policies.

### salon
- services, price board, albums, feedback, booking/Zalo.

### industry
- technical products, product code, brand, category, application, specs, quotation form.
- bo loc: ma, thuong hieu, danh muc, ung dung.

### landing
- hero, benefits, pricing, feedback, FAQ, register form.

## Khong lam trong phase nay
- Builder keo tha phuc tap.
- Gio hang phuc tap.
- Thanh toan online.
- Da ngon ngu.

## Checklist trien khai tiep theo
- Chuan hoa schema con cho tung module (services/products theo template).
- Tao endpoint upload anh banner/section.
- Render tung section theo config chi tiet hon (khong chi override text).
- Them valid JSON schema cho admin de tranh save sai cau truc.
- Bo sung trang admin rieng /admin/web-demo neu can tach khoi admin van hanh chung.
