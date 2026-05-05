// Web Design Custom Collection - Hiển thị các gói custom design theo ngành

const CUSTOM_DESIGN_COLLECTIONS = {
  company: {
    label: "Thiết kế web công ty chuyên nghiệp",
    title: "Thiết kế web công ty / dịch vụ tùy chỉnh",
    desc: "Các gói thiết kế custom với bố cục, màu sắc, chức năng theo yêu cầu cụ thể của doanh nghiệp.",
    samples: [
      {
        title: "Gói Chuyên nghiệp",
        note: "Thiết kế riêng, chức năng SEO nâng cao, tích hợp hệ thống.",
        image: "https://pub-90b335e287f24c92bbd5856cb9f116d9.r2.dev/web-demo-company.jpg",
        planSlug: "company-chuyen-nghiep",
        best: "Công ty muốn web khác biệt, có tính năng đặc thù",
        features: ["Thiết kế 100% custom", "Code từ 0 không dùng template", "Tích hợp CRM cơ bản", "SEO chiến lược ngành"]
      },
      {
        title: "Gói Thương hiệu Premium",
        note: "Thiết kế cao cấp, UX nâng cao, tích hợp automation marketing.",
        image: "https://pub-90b335e287f24c92bbd5856cb9f116d9.r2.dev/web-demo-company.jpg",
        planSlug: "company-thuong-hieu",
        best: "Doanh nghiệp lớn cần web chuẩn agency, automation",
        features: ["UX/UI design chuẩn agency", "CRM + Email automation", "Chatbot AI", "Advanced tracking & CRM"]
      }
    ]
  },
  shop: {
    label: "Thiết kế web shop bán hàng",
    title: "Shop bán hàng với hệ thống quản lý chuyên nghiệp",
    desc: "Gói shop tùy chỉnh từ shop nhỏ đến marketplace với quản lý sản phẩm, thanh toán, logistics tích hợp.",
    samples: [
      {
        title: "Gói Shop bán hàng",
        note: "Quản lý sản phẩm đầy đủ, giỏ hàng, thanh toán online, email notification.",
        image: "https://pub-90b335e287f24c92bbd5856cb9f116d9.r2.dev/web-demo-shop-item-fashion.png",
        planSlug: "shop-ban-hang",
        best: "Shop muốn tự quản lý 100+ sản phẩm, đơn hàng online",
        features: ["Quản lý sản phẩm CMS", "Thanh toán VNPay/MOMO/Stripe", "Quản lý đơn hàng", "Email notification"]
      },
      {
        title: "Gói Marketplace Pro",
        note: "Marketplace cho nhiều vendors, automation, AI recommendation.",
        image: "https://pub-90b335e287f24c92bbd5856cb9f116d9.r2.dev/web-demo-shop-bundle.png",
        planSlug: "shop-nang-cao",
        best: "Platform lớn muốn mở rộng thành marketplace, vendor management",
        features: ["Multi-vendor system", "Email/SMS automation", "AI recommendation", "BI analytics"]
      }
    ]
  },
  salon: {
    label: "Thiết kế web salon / beauty",
    title: "Salon / Beauty với booking system & loyalty program",
    desc: "Gói salon chuyên nghiệp với online booking, staff schedule, khách hàng loyalty tích hợp.",
    samples: [
      {
        title: "Gói Salon chuyên nghiệp",
        note: "Online booking 24/7, quản lý staff, loyalty points, gallery chuyên sâu.",
        image: "https://pub-90b335e287f24c92bbd5856cb9f116d9.r2.dev/web-demo-photo.jpg",
        planSlug: "spa-chuyen-nghiep",
        best: "Salon lớn muốn giảm gọi điện, quản lý thời gian staff",
        features: ["Online booking calendar", "Staff schedule management", "Loyalty program", "SMS reminder"]
      }
    ]
  },
  industry: {
    label: "Thiết kế web công ty kỹ thuật",
    title: "Catalog kỹ thuật với filter nâng cao & CRM báo giá",
    desc: "Gói B2B chuyên sâu với catalog chi tiết, filter kỹ thuật, request quotation, CRM tracking.",
    samples: [
      {
        title: "Gói Catalog chuyên nghiệp",
        note: "Database sản phẩm unlimited, filter nâng cao, request quotation, CRM tracking.",
        image: "https://pub-90b335e287f24c92bbd5856cb9f116d9.r2.dev/web-demo-photo.jpg",
        planSlug: "menu-chuyen-nghiep",
        best: "Công ty kỹ thuật có 5000+ SKU cần B2B buyers tìm dễ",
        features: ["Catalog 5000+ products", "Advanced filter (kích thước, vật liệu, spec)", "PDF spec sheet download", "CRM quotation"]
      }
    ]
  },
  landing: {
    label: "Landing pages cao cấp",
    title: "Custom landing pages tối ưu conversion",
    desc: "Gói landing page chuyên sâu với conversion-focused design, A/B testing, heat map analytics.",
    samples: [
      {
        title: "Gói Landing cao cấp",
        note: "Conversion-focused design, A/B testing, heat map, form optimization, advanced tracking.",
        image: "https://pub-90b335e287f24c92bbd5856cb9f116d9.r2.dev/web-demo-photo.jpg",
        planSlug: "trung-tam-dao-tao",
        best: "Campaign quảng cáo cần landing page riêng tối ưu chuyển đổi",
        features: ["Conversion-focused design", "A/B testing framework", "Heat map analytics", "Form optimization tracking"]
      }
    ]
  }
};

function parseCustomDesignSlug() {
  const pathname = window.location.pathname || "/";
  const parts = pathname.split("/").filter(Boolean);
  const thietKeIndex = parts.findIndex((p) => p === "thiet-ke-web");
  const theoNganhIndex = parts.findIndex((p) => p === "theo-nganh");
  const targetIndex = Math.max(thietKeIndex, theoNganhIndex) + 1;
  return decodeURIComponent(parts[targetIndex] || "company");
}

let webPricingConfigPromise = null;

function getDefaultWebPricingConfig() {
  return {
    customPlanPrices: {
      "company-chuyen-nghiep": "Báo giá tùy nhu cầu",
      "company-thuong-hieu": "Báo giá tùy nhu cầu",
      "shop-ban-hang": "Báo giá tùy nhu cầu",
      "shop-nang-cao": "Báo giá tùy nhu cầu",
      "spa-chuyen-nghiep": "Báo giá tùy nhu cầu",
      "menu-chuyen-nghiep": "Báo giá tùy nhu cầu",
      "trung-tam-dao-tao": "Báo giá tùy nhu cầu"
    }
  };
}

async function getWebPricingConfig() {
  if (!webPricingConfigPromise) {
    webPricingConfigPromise = fetch("/api/web-pricing-config")
      .then((response) => response.ok ? response.json() : { config: getDefaultWebPricingConfig() })
      .then((payload) => payload?.config || getDefaultWebPricingConfig())
      .catch(() => getDefaultWebPricingConfig());
  }
  return webPricingConfigPromise;
}

async function renderCustomDesignCollection() {
  const root = document.getElementById("demoCollectionRoot");
  if (!root) return;

  const slug = parseCustomDesignSlug();
  const data = CUSTOM_DESIGN_COLLECTIONS[slug];
  if (!data) {
    root.innerHTML = `<p style="padding:40px;text-align:center">Không tìm thấy loại thiết kế này.</p>`;
    return;
  }

  const webPricingConfig = await getWebPricingConfig();
  const customPlanPrices = webPricingConfig?.customPlanPrices || {};

  document.title = `${data.title} | Thiết kế web tùy chỉnh`;

  root.innerHTML = `
    <section class="demo-collection-wrap">
      <div class="demo-collection-topbar">
        <a class="demo-collection-back" href="/thiet-ke-web/theo-nganh">← Quay lại danh sách thiết kế</a>
        <div class="demo-collection-actions">
          <a class="demo-collection-btn" href="/kho-mau/${encodeURIComponent(slug)}">Xem mẫu triển khai nhanh</a>
          <a class="demo-collection-btn is-primary" href="https://zalo.me/0902964685" target="_blank" rel="noopener">Nhắn Zalo tư vấn</a>
        </div>
      </div>

      <div class="demo-collection-hero">
        <div class="demo-collection-content">
          <div class="demo-collection-label">${escapeHtml(data.label)}</div>
          <h1 class="demo-collection-title">${escapeHtml(data.title)}</h1>
          <p class="demo-collection-desc">${escapeHtml(data.desc)}</p>
        </div>
      </div>

      <section class="demo-collection-section">
        <div class="demo-container">
          <div class="demo-collection-grid">
            ${data.samples.map((sample, idx) => {
              const packageHref = `/thiet-ke-web/theo-nganh/${encodeURIComponent(slug)}/goi/${encodeURIComponent(sample.planSlug)}`;
              return `
                <article class="demo-collection-card">
                  <figure class="demo-collection-card-image">
                    <img src="${escapeHtml(sample.image)}" alt="${escapeHtml(sample.title)}" />
                  </figure>
                  <div class="demo-collection-card-content">
                    <h3>${escapeHtml(sample.title)}</h3>
                    <p class="demo-collection-card-note">${escapeHtml(sample.note)}</p>
                    <div class="demo-collection-card-meta">
                      <strong>Giá tham khảo:</strong> ${escapeHtml(customPlanPrices[sample.planSlug] || "Báo giá tùy nhu cầu")}
                    </div>
                    <div class="demo-collection-card-meta">
                      <strong>Phù hợp:</strong> ${escapeHtml(sample.best)}
                    </div>
                    <ul class="demo-collection-card-features">
                      ${sample.features.map((feat) => `<li>${escapeHtml(feat)}</li>`).join("")}
                    </ul>
                    <div class="demo-collection-card-actions">
                      <a href="${escapeHtml(packageHref)}" class="btn btn-primary">Xem chi tiết gói</a>
                      <a href="https://zalo.me/0902964685" target="_blank" rel="noopener" class="btn btn-outline">Tư vấn ngay</a>
                    </div>
                  </div>
                </article>
              `;
            }).join("")}
          </div>
        </div>
      </section>

      <section class="demo-next-steps">
        <div class="demo-container">
          <h2>Bước tiếp theo</h2>
          <div class="steps-grid">
            <article>
              <b>1</b>
              <h3>Xem chi tiết gói</h3>
              <p>Chọn gói phù hợp với nhu cầu và xem scope công việc cụ thể từng gói.</p>
            </article>
            <article>
              <b>2</b>
              <h3>Tư vấn & báo giá</h3>
              <p>Liên hệ Zalo để trao đổi yêu cầu chi tiết, nhân sự, timeline và báo giá chính xác.</p>
            </article>
            <article>
              <b>3</b>
              <h3>Triển khai</h3>
              <p>Ký hợp đồng, khảo sát yêu cầu, thiết kế mockup, phát triển code, test, bàn giao.</p>
            </article>
          </div>
        </div>
      </section>
    </section>
  `;
}

// Escape HTML
const escapeHtml = (value) => String(value || "").replace(/[&<>"']/g, (char) => ({
  "&": "&amp;",
  "<": "&lt;",
  ">": "&gt;",
  '"': "&quot;",
  "'": "&#39;"
}[char]));

// Auto-render on pageload
if (window.location.pathname.includes("/thiet-ke-web/theo-nganh")) {
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", renderCustomDesignCollection);
  } else {
    renderCustomDesignCollection();
  }
}
