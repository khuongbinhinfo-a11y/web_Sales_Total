const COLLECTIONS = {
  company: {
    label: "Mẫu lấy lead",
    title: "Kho mẫu công ty / dịch vụ",
    desc: "Mỗi card là một hướng trình bày khác nhau để bạn chọn nhanh trước khi đi vào gói chi tiết.",
    samples: [
      { title: "Hero trust + dịch vụ", note: "Ưu tiên độ tin cậy, năng lực và CTA nhận tư vấn.", image: "https://pub-90b335e287f24c92bbd5856cb9f116d9.r2.dev/web-demo-company.jpg", planSlug: "co-ban" },
      { title: "Nhiều trang dịch vụ", note: "Phù hợp công ty cần tách dịch vụ và quy trình rõ.", image: "https://pub-90b335e287f24c92bbd5856cb9f116d9.r2.dev/web-demo-company.jpg", planSlug: "chuyen-nghiep" },
      { title: "Bản thương hiệu", note: "Đẩy mạnh brand, case study và cấu trúc nội dung sâu.", image: "https://pub-90b335e287f24c92bbd5856cb9f116d9.r2.dev/web-demo-company.jpg", planSlug: "thuong-hieu" }
    ]
  },
  shop: {
    label: "Mẫu chốt đơn",
    title: "Kho mẫu shop bán hàng",
    desc: "Chọn nhanh các layout tập trung danh mục, sản phẩm và chuyển đổi đặt mua.",
    samples: [
      { title: "Shop giới thiệu", note: "Landing gọn để test thị trường và giới thiệu sản phẩm.", image: "https://pub-90b335e287f24c92bbd5856cb9f116d9.r2.dev/web-demo-shop-hero.png", planSlug: "shop-gioi-thieu" },
      { title: "Shop bán hàng", note: "Có danh mục rõ, CTA mua nhanh và cấu trúc đơn giản.", image: "https://pub-90b335e287f24c92bbd5856cb9f116d9.r2.dev/web-demo-shop-item-fashion.png", planSlug: "shop-ban-hang" },
      { title: "Shop nâng cao", note: "Bản nhiều danh mục với khối tối ưu chuyển đổi.", image: "https://pub-90b335e287f24c92bbd5856cb9f116d9.r2.dev/web-demo-shop-bundle.png", planSlug: "shop-nang-cao" }
    ]
  },
  salon: {
    label: "Mẫu đặt lịch",
    title: "Kho mẫu salon / beauty",
    desc: "Nhiều mẫu mini tập trung booking, bảng giá và cảm giác thương hiệu mềm mại.",
    samples: [
      { title: "Salon mini", note: "Trang dịch vụ gọn, CTA đặt lịch nhanh trên mobile.", image: "https://pub-90b335e287f24c92bbd5856cb9f116d9.r2.dev/web-demo-photo.jpg", planSlug: "spa-mini" },
      { title: "Salon chuyên nghiệp", note: "Thêm gallery, feedback và nhóm combo dịch vụ.", image: "https://pub-90b335e287f24c92bbd5856cb9f116d9.r2.dev/web-demo-photo.jpg", planSlug: "spa-chuyen-nghiep" },
      { title: "Salon bán hàng + booking", note: "Kết hợp dịch vụ với sản phẩm bán kèm và tracking.", image: "https://pub-90b335e287f24c92bbd5856cb9f116d9.r2.dev/web-demo-photo.jpg", planSlug: "spa-ban-hang-dat-lich" }
    ]
  },
  industry: {
    label: "Mẫu kỹ thuật",
    title: "Kho mẫu industry / kỹ thuật",
    desc: "Các mẫu mini phục vụ catalog kỹ thuật, lọc mã hàng và form báo giá B2B.",
    samples: [
      { title: "Industry cơ bản", note: "Giới thiệu năng lực và danh mục sản phẩm chính.", image: "https://pub-90b335e287f24c92bbd5856cb9f116d9.r2.dev/web-demo-photo.jpg", planSlug: "local-co-ban" },
      { title: "Industry chuyên nghiệp", note: "Có nhóm catalog sâu và trang thông số rõ ràng.", image: "https://pub-90b335e287f24c92bbd5856cb9f116d9.r2.dev/web-demo-photo.jpg", planSlug: "menu-chuyen-nghiep" },
      { title: "Industry nâng cao", note: "Luồng nhận báo giá chi tiết cho nhiều mã hàng.", image: "https://pub-90b335e287f24c92bbd5856cb9f116d9.r2.dev/web-demo-photo.jpg", planSlug: "dat-ban-dat-mon" }
    ]
  },
  landing: {
    label: "Mẫu chuyển đổi",
    title: "Kho mẫu landing page",
    desc: "So nhanh các biến thể hero, khối lợi ích và form để chọn mẫu phù hợp chiến dịch.",
    samples: [
      { title: "Landing cơ bản", note: "1 mục tiêu chuyển đổi rõ, khối nội dung ngắn gọn.", image: "https://pub-90b335e287f24c92bbd5856cb9f116d9.r2.dev/web-demo-photo.jpg", planSlug: "tuyen-sinh-co-ban" },
      { title: "Landing chuyên nghiệp", note: "Thêm trust block, FAQ và nhiều CTA theo hành vi.", image: "https://pub-90b335e287f24c92bbd5856cb9f116d9.r2.dev/web-demo-photo.jpg", planSlug: "trung-tam-dao-tao" },
      { title: "Landing hệ thống", note: "Dành cho cụm chiến dịch cần nhiều phiên bản landing.", image: "https://pub-90b335e287f24c92bbd5856cb9f116d9.r2.dev/web-demo-photo.jpg", planSlug: "he-thong-khoa-hoc" }
    ]
  }
};

const escapeHtml = (value) => String(value || "").replace(/[&<>\"']/g, (char) => ({
  "&": "&amp;",
  "<": "&lt;",
  ">": "&gt;",
  '"': "&quot;",
  "'": "&#39;"
}[char]));

const parseMoney = (value, fallback = 2990000) => {
  const n = Number(String(value || "").replace(/[^\d]/g, ""));
  return Number.isFinite(n) && n > 0 ? n : fallback;
};

const formatVnd = (n) => `${Number(n || 0).toLocaleString("vi-VN")}đ`;

const parseSlug = () => {
  const parts = location.pathname.split("/").filter(Boolean);
  const idx = parts.findIndex((part) => part === "mau-demo");
  const raw = idx >= 0 ? decodeURIComponent(parts[idx + 1] || "") : "";
  const slug = raw.startsWith("khomau-") ? raw.slice("khomau-".length) : raw;
  return COLLECTIONS[slug] ? slug : "company";
};

const getWebsitePriceForSlug = (slug) => {
  try {
    const cfg = JSON.parse(localStorage.getItem(`preview_config_${slug}`) || "{}");
    return formatVnd(parseMoney(cfg.saleWebsitePrice));
  } catch {
    return formatVnd(2990000);
  }
};

const buildSampleCard = (slug, sample, index, websitePriceText) => {
  const sampleHref = `/catalog/web-demo/${encodeURIComponent(slug)}/goi/${encodeURIComponent(sample.planSlug || `goi-${index + 1}`)}`;
  return `
    <article class="demo-mini-card">
      <div class="demo-mini-media">
        <img src="${escapeHtml(sample.image)}" alt="${escapeHtml(sample.title)}" loading="lazy" />
        <span>Mẫu ${index + 1}</span>
      </div>
      <div class="demo-mini-body">
        <h3>${escapeHtml(sample.title)}</h3>
        <div class="demo-mini-price">Giá web: <strong>${escapeHtml(websitePriceText)}</strong></div>
        <p>${escapeHtml(sample.note)}</p>
        <div class="demo-mini-actions">
          <a class="is-buy" href="${sampleHref}">Xem gói triển khai →</a>
        </div>
      </div>
    </article>
  `;
};

const renderCollectionPage = () => {
  const root = document.getElementById("demoCollectionRoot");
  if (!root) return;

  const slug = parseSlug();
  const data = COLLECTIONS[slug];
  const websitePriceText = getWebsitePriceForSlug(slug);
  document.title = `${data.title} | Kho mẫu web`;

  root.innerHTML = `
    <section class="demo-collection-wrap">
      <div class="demo-collection-topbar">
        <a class="demo-collection-back" href="/mau-demo">\u2190 Quay lại kho mẫu</a>
        <div class="demo-collection-actions">
          <a class="demo-collection-btn" href="/thiet-ke-web">Nhánh web</a>
          <a class="demo-collection-btn is-primary" href="https://zalo.me/0902964685" target="_blank" rel="noopener">Nhắn Zalo</a>
        </div>
      </div>

      <div class="demo-collection-hero">
        <span class="demo-collection-kicker">${escapeHtml(data.label)}</span>
        <h1>${escapeHtml(data.title)}</h1>
        <p>${escapeHtml(data.desc)}</p>
      </div>

      <div class="demo-collection-grid">
        ${data.samples.map((sample, index) => buildSampleCard(slug, sample, index, websitePriceText)).join("")}
      </div>
    </section>
  `;
};

renderCollectionPage();
