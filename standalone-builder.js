/**
 * standalone-builder.js
 * Tạo 5 folder standalone tại F:\1_A_Disk_D\Khương Bình\web-demo\{slug}\
 * Chạy: node standalone-builder.js
 */
const fs = require("fs");
const path = require("path");

const SRC = path.join(__dirname, "src", "web");
const OUT_BASE = "F:\\1_A_Disk_D\\Khương Bình\\web-demo";
const SLUGS = ["company", "shop", "salon", "industry", "landing"];

/* Slug names for display in admin */
const SLUG_NAMES = {
  company: "Công ty / Dịch vụ",
  shop: "Shop bán hàng",
  salon: "Salon / Beauty",
  industry: "Industry / Kỹ thuật",
  landing: "Landing Page"
};

/* Default passwords per slug — khách đổi sau */
const DEFAULT_PWD = "admin1234";

/* Read source file */
const read = (f) => fs.readFileSync(path.join(SRC, f), "utf8");

/* index.html for standalone — paths local, data-template hardcoded */
const makeIndexHtml = (slug) => `<!DOCTYPE html>
<html lang="vi">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Website</title>
  <link rel="stylesheet" href="style.css" />
</head>
<body data-template="${slug}">
  <div id="previewRoot">
    <div class="pv-loading">Đang tải...</div>
  </div>
  <script src="main.js"></script>
</body>
</html>
`;

/* admin.html for standalone */
const makeAdminHtml = (slug) => `<!DOCTYPE html>
<html lang="vi">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <meta name="robots" content="noindex,nofollow" />
  <title>Admin — Cấu hình website</title>
  <link rel="stylesheet" href="admin.css" />
</head>
<body>
  <div id="adminRoot">
    <div class="adm-login" id="admLogin">
      <div class="adm-login-card">
        <div class="adm-login-logo">🛠</div>
        <h1>Đăng nhập Admin</h1>
        <p>Nhập mật khẩu để chỉnh nội dung website</p>
        <div class="adm-form-group">
          <input type="password" id="loginPwd" placeholder="Mật khẩu" autocomplete="current-password" />
        </div>
        <button class="adm-btn-primary" id="loginBtn">Đăng nhập</button>
        <p class="adm-login-hint">Mật khẩu: <strong>${DEFAULT_PWD}</strong> &nbsp;(đổi trong admin.js)</p>
      </div>
    </div>

    <div class="adm-panel hidden" id="admPanel">
      <aside class="adm-sidebar">
        <div class="adm-sidebar-logo" id="admSidebarLogo">Admin</div>
        <nav class="adm-sidebar-nav">
          <a class="adm-nav-item active" data-tab="general">🏠 Thông tin site</a>
          <a class="adm-nav-item" data-tab="colors">🎨 Màu sắc</a>
          <a class="adm-nav-item" data-tab="posts">📝 Bài viết / Blog</a>
          <a class="adm-nav-item" data-tab="pricing">💰 Bảng giá</a>
          <a class="adm-nav-item" data-tab="contact">📞 Liên hệ</a>
        </nav>
        <div class="adm-sidebar-footer">
          <a class="adm-btn-view" id="admViewSite" href="index.html" target="_blank">👁 Xem website</a>
          <button class="adm-btn-logout" id="admLogout">Đăng xuất</button>
        </div>
      </aside>

      <main class="adm-main">
        <div class="adm-topbar">
          <h2 id="admTabTitle">Thông tin site</h2>
          <button class="adm-btn-save" id="admSaveBtn">💾 Lưu thay đổi</button>
        </div>
        <div class="adm-tab active" id="tab-general">
          <div class="adm-section-title">Thông tin cơ bản</div>
          <div class="adm-form-grid">
            <div class="adm-form-group"><label>Tên website / công ty</label><input type="text" id="siteName" placeholder="VD: Công ty ABC, Shop Hoa, Salon Minh..." /></div>
            <div class="adm-form-group"><label>Tagline / Slogan</label><input type="text" id="tagline" placeholder="VD: Giải pháp tin cậy cho doanh nghiệp" /></div>
            <div class="adm-form-group"><label>Logo (URL ảnh hoặc để trống dùng tên)</label><input type="url" id="logoUrl" placeholder="https://domain.vn/logo.png" /></div>
          </div>
        </div>
        <div class="adm-tab hidden" id="tab-colors">
          <div class="adm-section-title">Bộ màu website</div>
          <p class="adm-help">Thay đổi màu sẽ áp dụng cho toàn bộ website sau khi lưu.</p>
          <div class="adm-color-grid">
            <div class="adm-form-group"><label>Màu chủ đạo (primary)</label><div class="adm-color-row"><input type="color" id="colorPrimary" /><input type="text" id="colorPrimaryText" placeholder="#1a3c6e" /></div></div>
            <div class="adm-form-group"><label>Màu nhấn (accent)</label><div class="adm-color-row"><input type="color" id="colorAccent" /><input type="text" id="colorAccentText" placeholder="#1e88e5" /></div></div>
          </div>
          <div class="adm-color-presets"><div class="adm-section-title" style="margin-top:28px">Bộ màu gợi ý</div><div class="adm-preset-list" id="colorPresets"></div></div>
        </div>
        <div class="adm-tab hidden" id="tab-posts">
          <div class="adm-tab-header"><div class="adm-section-title">Bài viết / Tin tức</div><button class="adm-btn-add" id="addPostBtn">+ Thêm bài viết</button></div>
          <div id="postsList" class="adm-items-list"></div>
        </div>
        <div class="adm-tab hidden" id="tab-pricing">
          <div class="adm-tab-header"><div class="adm-section-title">Bảng giá dịch vụ</div><button class="adm-btn-add" id="addPriceBtn">+ Thêm gói giá</button></div>
          <div id="pricingList" class="adm-items-list"></div>
        </div>
        <div class="adm-tab hidden" id="tab-contact">
          <div class="adm-section-title">Thông tin liên hệ</div>
          <div class="adm-form-grid">
            <div class="adm-form-group"><label>Số điện thoại</label><input type="tel" id="phone" /></div>
            <div class="adm-form-group"><label>Zalo</label><input type="tel" id="zalo" /></div>
            <div class="adm-form-group"><label>Email</label><input type="email" id="email" /></div>
            <div class="adm-form-group" style="grid-column:1/-1"><label>Địa chỉ</label><input type="text" id="address" /></div>
          </div>
        </div>
        <div class="adm-toast hidden" id="admToast">✅ Đã lưu thành công!</div>
      </main>
    </div>
  </div>
  <script src="admin.js"></script>
</body>
</html>
`;

/* Transform web-preview.js for standalone:
   - Remove demo topbar (return "")
   - Remove back links to web-tong
   - Change config key to "site_config"
   - Change /catalog/ CTAs to "#contact"
   - Change admin link to "admin.html"
   - parseSlug reads data-template from body instead of URL
*/
const makeMainJs = (slug, sourceJs) => {
  let js = sourceJs;

  /* 1. parseSlug — read from body dataset (set in index.html) */
  js = js.replace(
    /const parseSlug = \(\) => \{[\s\S]*?^};/m,
    `const parseSlug = () => document.body.dataset.template || "${slug}";`
  );

  /* 2. loadConfig — use "site_config" key */
  js = js.replace(
    /localStorage\.getItem\(`preview_config_\${slug}`/g,
    'localStorage.getItem("site_config"'
  );

  /* 3. renderTopbar — return empty string */
  js = js.replace(
    /const renderTopbar = \([\s\S]*?^};/m,
    `const renderTopbar = () => "";`
  );

  /* 4. /catalog/web-demo/... links → #contact */
  js = js.replace(
    /href="\/catalog\/web-demo\/[^"]*"/g,
    'href="#contact"'
  );
  js = js.replace(
    /href=`\/catalog\/web-demo\/[^`]*`/g,
    'href="#contact"'
  );

  /* 5. Admin link → admin.html */
  js = js.replace(
    /href="\/preview\/[^"]*\/admin"/g,
    'href="admin.html"'
  );
  js = js.replace(
    /href=`\/preview\/[^`]*\/admin`/g,
    'href="admin.html"'
  );

  /* 6. Back link to /mau-demo → # */
  js = js.replace(
    /href="\/mau-demo\/[^"]*"/g,
    'href="#"'
  );
  js = js.replace(
    /href=`\/mau-demo\/[^`]*`/g,
    'href="#"'
  );

  /* 7. Remove footer back-link line */
  js = js.replace(
    /^\s*<div class="pv-footer-back">[\s\S]*?<\/div>\s*$/m,
    ''
  );

  /* 8. document.title — simplified */
  js = js.replace(
    /document\.title = .+;/,
    `document.title = config.siteName || "${SLUG_NAMES[slug]}";`
  );

  return js;
};

/* Transform web-preview-admin.js for standalone:
   - CONFIG_KEY = "site_config"
   - Remove parseSlug()
   - admSidebarLogo shows template name
   - admViewSite → index.html
*/
const makeAdminJs = (slug, sourceJs) => {
  let js = sourceJs;

  /* 1. CONFIG_KEY */
  js = js.replace(
    /const CONFIG_KEY = `preview_config_\${slug}`;/,
    'const CONFIG_KEY = "site_config";'
  );

  /* 2. Remove parseSlug & slug variable */
  js = js.replace(/^const parseSlug[\s\S]*?^};/m, '');
  js = js.replace(/^const slug = parseSlug\(\);/m, `const slug = "${slug}";`);

  /* 3. admViewSite link */
  js = js.replace(
    /if \(viewLink\) viewLink\.href = `\/preview\/\${slug}`;/,
    'if (viewLink) viewLink.href = "index.html";'
  );

  /* 4. Sidebar label */
  js = js.replace(
    /\$\("admSidebarLogo"\)\.textContent = `Admin: \${slug}`;/,
    `$("admSidebarLogo").textContent = "Admin: ${SLUG_NAMES[slug]}";`
  );

  /* 5. Password */
  js = js.replace(
    /const ADMIN_PASSWORD = "admin1234";/,
    `// ↓ Đổi mật khẩu tại đây sau khi nhận bàn giao\nconst ADMIN_PASSWORD = "${DEFAULT_PWD}";`
  );

  return js;
};

/* ---- BUILD ---- */
const previewJs = read("web-preview.js");
const previewCss = read("web-preview.css");
const adminJs = read("web-preview-admin.js");
const adminCss = read("web-preview-admin.css");

let built = 0;

for (const slug of SLUGS) {
  const outDir = path.join(OUT_BASE, slug);
  fs.mkdirSync(outDir, { recursive: true });

  fs.writeFileSync(path.join(outDir, "index.html"), makeIndexHtml(slug), "utf8");
  fs.writeFileSync(path.join(outDir, "style.css"), previewCss, "utf8");
  fs.writeFileSync(path.join(outDir, "main.js"), makeMainJs(slug, previewJs), "utf8");
  fs.writeFileSync(path.join(outDir, "admin.html"), makeAdminHtml(slug), "utf8");
  fs.writeFileSync(path.join(outDir, "admin.css"), adminCss, "utf8");
  fs.writeFileSync(path.join(outDir, "admin.js"), makeAdminJs(slug, adminJs), "utf8");

  built++;
  console.log(`✅ [${slug}] → ${outDir}`);
}

console.log(`\n🎉 Done! Built ${built} standalone folders at: ${OUT_BASE}`);
console.log(`\nMỗi folder có:`);
console.log(`  index.html  — website chính (mở file:// hoặc hosting)`);
console.log(`  admin.html  — panel cấu hình nội dung`);
console.log(`  style.css   — toàn bộ CSS`);
console.log(`  main.js     — logic render website`);
console.log(`  admin.css   — CSS admin panel`);
console.log(`  admin.js    — logic admin (đổi mật khẩu tại đây)`);
