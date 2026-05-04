CREATE TABLE IF NOT EXISTS web_demo_templates (
  template_slug TEXT PRIMARY KEY,
  display_name TEXT NOT NULL,
  template_group TEXT NOT NULL,
  config_json JSONB NOT NULL DEFAULT '{}'::jsonb,
  seo_json JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_by TEXT DEFAULT 'system',
  updated_by TEXT DEFAULT 'system',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT web_demo_templates_slug_check CHECK (template_slug IN ('company', 'shop', 'salon', 'industry', 'landing'))
);

CREATE TABLE IF NOT EXISTS web_demo_leads (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  template_slug TEXT NOT NULL REFERENCES web_demo_templates(template_slug) ON DELETE RESTRICT,
  full_name TEXT NOT NULL,
  phone TEXT NOT NULL,
  email TEXT,
  company_name TEXT,
  message TEXT,
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  status TEXT NOT NULL DEFAULT 'new',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT web_demo_leads_status_check CHECK (status IN ('new', 'contacted', 'qualified', 'closed', 'spam'))
);

CREATE INDEX IF NOT EXISTS idx_web_demo_templates_group ON web_demo_templates(template_group);
CREATE INDEX IF NOT EXISTS idx_web_demo_leads_template_status ON web_demo_leads(template_slug, status, created_at DESC);

INSERT INTO web_demo_templates (template_slug, display_name, template_group, config_json, seo_json, created_by, updated_by)
VALUES
(
  'company',
  'Company / Dịch vụ',
  'company',
  jsonb_build_object(
    'siteSettings', jsonb_build_object('brandName', 'Nova Consulting', 'logoUrl', '/logo_2.png', 'hotline', '0902 96 46 85', 'zalo', 'https://zalo.me/0902964685', 'email', 'ungdungthongminh.info@gmail.com', 'address', 'TP.HCM'),
    'themeSettings', jsonb_build_object('primaryColor', '#0f2742', 'buttonColor', '#1f6feb', 'accentColor', '#8aa1b5'),
    'pageSections', jsonb_build_object(
      'hero', jsonb_build_object('enabled', true, 'title', 'Website tin cậy để lấy lead tư vấn', 'subtitle', 'Dành cho công ty dịch vụ và B2B', 'imageUrl', '/web-demo-company.jpg'),
      'intro', jsonb_build_object('enabled', true, 'title', 'Giới thiệu doanh nghiệp', 'content', 'Nêu năng lực, đội ngũ, giá trị cốt lõi.'),
      'featured', jsonb_build_object('enabled', true, 'title', 'Dịch vụ nổi bật'),
      'whyChoose', jsonb_build_object('enabled', true, 'title', 'Vì sao chọn chúng tôi'),
      'process', jsonb_build_object('enabled', true, 'title', 'Quy trình triển khai'),
      'feedback', jsonb_build_object('enabled', true, 'title', 'Khách hàng nói gì'),
      'cta', jsonb_build_object('enabled', true, 'title', 'Nhận tư vấn miễn phí')
    ),
    'services', jsonb_build_array(),
    'products', jsonb_build_array(),
    'moduleData', jsonb_build_object('capabilities', jsonb_build_array(), 'projects', jsonb_build_array())
  ),
  jsonb_build_object('title', 'Mau web company', 'description', 'Mau website cong ty co admin de chinh noi dung', 'shareImage', '/og/og-web-cong-ty.png'),
  'migration',
  'migration'
),
(
  'shop',
  'Shop bán hàng',
  'shop',
  jsonb_build_object(
    'siteSettings', jsonb_build_object('brandName', 'Urban Goods', 'logoUrl', '/logo_2.png', 'hotline', '0902 96 46 85', 'zalo', 'https://zalo.me/0902964685', 'email', 'ungdungthongminh.info@gmail.com', 'address', 'TP.HCM'),
    'themeSettings', jsonb_build_object('primaryColor', '#f97316', 'buttonColor', '#16a34a', 'accentColor', '#f59e0b'),
    'pageSections', jsonb_build_object(
      'hero', jsonb_build_object('enabled', true, 'title', 'Trang bán hàng năng động để chốt đơn nhanh', 'subtitle', 'Tập trung sản phẩm nổi bật và CTA mua ngay', 'imageUrl', '/web-demo-shop-hero.png'),
      'intro', jsonb_build_object('enabled', true, 'title', 'Giới thiệu thương hiệu'),
      'featured', jsonb_build_object('enabled', true, 'title', 'Sản phẩm nổi bật'),
      'whyChoose', jsonb_build_object('enabled', true, 'title', 'Chính sách bán hàng'),
      'process', jsonb_build_object('enabled', true, 'title', 'Quy trình mua hàng'),
      'feedback', jsonb_build_object('enabled', true, 'title', 'Đánh giá khách hàng'),
      'cta', jsonb_build_object('enabled', true, 'title', 'Mua ngay hôm nay')
    ),
    'services', jsonb_build_array(),
    'products', jsonb_build_array(),
    'moduleData', jsonb_build_object('categories', jsonb_build_array(), 'policies', jsonb_build_array())
  ),
  jsonb_build_object('title', 'Mau web shop', 'description', 'Mau website shop co admin quan ly san pham', 'shareImage', '/og/og-web-shop-ban-hang.png'),
  'migration',
  'migration'
),
(
  'salon',
  'Salon / Làm đẹp',
  'salon',
  jsonb_build_object(
    'siteSettings', jsonb_build_object('brandName', 'Maison Glow', 'logoUrl', '/logo_2.png', 'hotline', '0902 96 46 85', 'zalo', 'https://zalo.me/0902964685', 'email', 'ungdungthongminh.info@gmail.com', 'address', 'TP.HCM'),
    'themeSettings', jsonb_build_object('primaryColor', '#b08968', 'buttonColor', '#c084fc', 'accentColor', '#e9d5ff'),
    'pageSections', jsonb_build_object(
      'hero', jsonb_build_object('enabled', true, 'title', 'Trang salon sang để khách đặt lịch', 'subtitle', 'Tập trung dịch vụ, bảng giá, feedback', 'imageUrl', '/web-demo-photo.jpg'),
      'intro', jsonb_build_object('enabled', true, 'title', 'Giới thiệu salon'),
      'featured', jsonb_build_object('enabled', true, 'title', 'Dịch vụ và bảng giá'),
      'whyChoose', jsonb_build_object('enabled', true, 'title', 'Vì sao chọn salon'),
      'process', jsonb_build_object('enabled', true, 'title', 'Quy trình đặt lịch'),
      'feedback', jsonb_build_object('enabled', true, 'title', 'Feedback khách hàng'),
      'cta', jsonb_build_object('enabled', true, 'title', 'Đặt lịch qua Zalo')
    ),
    'services', jsonb_build_array(),
    'products', jsonb_build_array(),
    'moduleData', jsonb_build_object('priceBoard', jsonb_build_array(), 'albums', jsonb_build_array())
  ),
  jsonb_build_object('title', 'Mau web salon', 'description', 'Mau website salon co admin quan ly noi dung va dat lich', 'shareImage', '/og/og-web-spa.png'),
  'migration',
  'migration'
),
(
  'industry',
  'Industry / Kỹ thuật',
  'industry',
  jsonb_build_object(
    'siteSettings', jsonb_build_object('brandName', 'Tech Industrial', 'logoUrl', '/logo_2.png', 'hotline', '0902 96 46 85', 'zalo', 'https://zalo.me/0902964685', 'email', 'ungdungthongminh.info@gmail.com', 'address', 'TP.HCM'),
    'themeSettings', jsonb_build_object('primaryColor', '#1e293b', 'buttonColor', '#2563eb', 'accentColor', '#38bdf8'),
    'pageSections', jsonb_build_object(
      'hero', jsonb_build_object('enabled', true, 'title', 'Web kỹ thuật cho sản phẩm công nghiệp', 'subtitle', 'Có bộ lọc theo mã, thương hiệu, danh mục, ứng dụng', 'imageUrl', '/web-demo-photo.jpg'),
      'intro', jsonb_build_object('enabled', true, 'title', 'Giới thiệu năng lực kỹ thuật'),
      'featured', jsonb_build_object('enabled', true, 'title', 'Sản phẩm kỹ thuật nổi bật'),
      'whyChoose', jsonb_build_object('enabled', true, 'title', 'Vì sao chọn chúng tôi'),
      'process', jsonb_build_object('enabled', true, 'title', 'Quy trình báo giá'),
      'feedback', jsonb_build_object('enabled', true, 'title', 'Dự án tiêu biểu'),
      'cta', jsonb_build_object('enabled', true, 'title', 'Gửi yêu cầu báo giá')
    ),
    'services', jsonb_build_array(),
    'products', jsonb_build_array(),
    'moduleData', jsonb_build_object('brands', jsonb_build_array(), 'technicalSpecs', jsonb_build_array(), 'applications', jsonb_build_array())
  ),
  jsonb_build_object('title', 'Mau web industry', 'description', 'Mau website cong nghiep co bo loc va form bao gia', 'shareImage', '/og/og-web-nha-hang.png'),
  'migration',
  'migration'
),
(
  'landing',
  'Landing Page',
  'landing',
  jsonb_build_object(
    'siteSettings', jsonb_build_object('brandName', 'Launch Smart', 'logoUrl', '/logo_2.png', 'hotline', '0902 96 46 85', 'zalo', 'https://zalo.me/0902964685', 'email', 'ungdungthongminh.info@gmail.com', 'address', 'TP.HCM'),
    'themeSettings', jsonb_build_object('primaryColor', '#2f80ed', 'buttonColor', '#16a34a', 'accentColor', '#7dd3fc'),
    'pageSections', jsonb_build_object(
      'hero', jsonb_build_object('enabled', true, 'title', 'Landing page tập trung chuyển đổi', 'subtitle', 'Hero rõ lợi ích, bảng giá và form đăng ký', 'imageUrl', '/web-demo-photo.jpg'),
      'intro', jsonb_build_object('enabled', true, 'title', 'Giới thiệu giải pháp'),
      'featured', jsonb_build_object('enabled', true, 'title', 'Lợi ích nổi bật'),
      'whyChoose', jsonb_build_object('enabled', true, 'title', 'Vì sao chọn sản phẩm'),
      'process', jsonb_build_object('enabled', true, 'title', 'Quy trình đăng ký'),
      'feedback', jsonb_build_object('enabled', true, 'title', 'Feedback học viên/khách hàng'),
      'cta', jsonb_build_object('enabled', true, 'title', 'Đăng ký nhận tư vấn')
    ),
    'services', jsonb_build_array(),
    'products', jsonb_build_array(),
    'moduleData', jsonb_build_object('benefits', jsonb_build_array(), 'faq', jsonb_build_array(), 'pricing', jsonb_build_array())
  ),
  jsonb_build_object('title', 'Mau landing page', 'description', 'Mau landing page co admin chinh section va SEO', 'shareImage', '/og/og-web-giao-duc.png'),
  'migration',
  'migration'
)
ON CONFLICT (template_slug) DO NOTHING;
