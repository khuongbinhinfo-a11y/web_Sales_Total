const COLLECTIONS = {
  company: {
    label: "Mẫu lấy lead",
    title: "Kho mẫu công ty / dịch vụ",
    desc: "Mỗi card là một hướng trình bày khác nhau để bạn chọn nhanh trước khi đi vào gói chi tiết.",
    samples: [
      {
        title: "Hero trust + dịch vụ",
        note: "Ưu tiên độ tin cậy, năng lực và CTA nhận tư vấn.",
        image: "https://pub-90b335e287f24c92bbd5856cb9f116d9.r2.dev/web-demo-company.jpg",
        planSlug: "co-ban",
        tone: "trust",
        focus: "Định hướng: tạo niềm tin nhanh",
        bestFor: "Phù hợp: doanh nghiệp mới cần lead",
        highlights: ["Hero + CTA tư vấn", "Khối năng lực nổi bật", "Thông tin liên hệ rõ"]
      },
      {
        title: "Nhiều trang dịch vụ",
        note: "Phù hợp công ty cần tách dịch vụ và quy trình rõ.",
        image: "https://pub-90b335e287f24c92bbd5856cb9f116d9.r2.dev/web-demo-company.jpg",
        planSlug: "chuyen-nghiep",
        tone: "process",
        focus: "Định hướng: trình bày quy trình",
        bestFor: "Phù hợp: đơn vị có nhiều nhóm dịch vụ",
        highlights: ["Cấu trúc đa trang", "Trang quy trình triển khai", "Khối FAQ xử lý phản đối"]
      },
      {
        title: "Bản thương hiệu",
        note: "Đẩy mạnh brand, case study và cấu trúc nội dung sâu.",
        image: "https://pub-90b335e287f24c92bbd5856cb9f116d9.r2.dev/web-demo-company.jpg",
        planSlug: "thuong-hieu",
        tone: "brand",
        focus: "Định hướng: nâng chuẩn hình ảnh",
        bestFor: "Phù hợp: công ty đã có portfolio",
        highlights: ["Case study chi tiết", "Trang thương hiệu riêng", "Bố cục kể chuyện thương hiệu"]
      }
    ]
  },
  shop: {
    label: "Mẫu chốt đơn",
    title: "Kho mẫu shop bán hàng",
    desc: "Chọn nhanh các layout tập trung danh mục, sản phẩm và chuyển đổi đặt mua.",
    samples: [
      {
        title: "Shop giới thiệu",
        note: "Landing gọn để test thị trường và giới thiệu sản phẩm.",
        image: "https://pub-90b335e287f24c92bbd5856cb9f116d9.r2.dev/web-demo-shop-hero.png",
        planSlug: "shop-gioi-thieu",
        tone: "intro",
        focus: "Định hướng: ra mắt nhanh",
        bestFor: "Phù hợp: shop mới bắt đầu",
        highlights: ["Hero sản phẩm nổi bật", "CTA chốt inbox", "Nội dung ngắn gọn 1 trang"]
      },
      {
        title: "Shop bán hàng",
        note: "Có danh mục rõ, CTA mua nhanh và cấu trúc đơn giản.",
        image: "https://pub-90b335e287f24c92bbd5856cb9f116d9.r2.dev/web-demo-shop-item-fashion.png",
        planSlug: "shop-ban-hang",
        tone: "sales",
        focus: "Định hướng: tăng tỷ lệ đặt đơn",
        bestFor: "Phù hợp: shop có hàng chạy ổn định",
        highlights: ["Danh mục + lọc nhanh", "Nút mua hàng rõ ràng", "Khối đánh giá khách hàng"]
      },
      {
        title: "Shop nâng cao",
        note: "Bản nhiều danh mục với khối tối ưu chuyển đổi.",
        image: "https://pub-90b335e287f24c92bbd5856cb9f116d9.r2.dev/web-demo-shop-bundle.png",
        planSlug: "shop-nang-cao",
        tone: "pro",
        focus: "Định hướng: mở rộng hệ sản phẩm",
        bestFor: "Phù hợp: shop nhiều ngành hàng",
        highlights: ["Combo/bundle sản phẩm", "Khối upsell theo hành vi", "Bố cục đa danh mục"]
      }
    ]
  },
  salon: {
    label: "Mẫu đặt lịch",
    title: "Kho mẫu salon / beauty",
    desc: "Nhiều mẫu mini tập trung booking, bảng giá và cảm giác thương hiệu mềm mại.",
    samples: [
      {
        title: "Salon mini",
        note: "Trang dịch vụ gọn, CTA đặt lịch nhanh trên mobile.",
        image: "https://pub-90b335e287f24c92bbd5856cb9f116d9.r2.dev/web-demo-photo.jpg",
        planSlug: "spa-mini",
        tone: "soft",
        focus: "Định hướng: booking nhanh",
        bestFor: "Phù hợp: salon quy mô nhỏ",
        highlights: ["Nút đặt lịch nổi bật", "Bảng giá gọn", "Tối ưu màn hình điện thoại"]
      },
      {
        title: "Salon chuyên nghiệp",
        note: "Thêm gallery, feedback và nhóm combo dịch vụ.",
        image: "https://pub-90b335e287f24c92bbd5856cb9f116d9.r2.dev/web-demo-photo.jpg",
        planSlug: "spa-chuyen-nghiep",
        tone: "luxury",
        focus: "Định hướng: nâng trải nghiệm thương hiệu",
        bestFor: "Phù hợp: salon có đội ngũ chuyên môn",
        highlights: ["Gallery trước - sau", "Combo dịch vụ nổi bật", "Khối feedback chuyên sâu"]
      },
      {
        title: "Salon bán hàng + booking",
        note: "Kết hợp dịch vụ với sản phẩm bán kèm và tracking.",
        image: "https://pub-90b335e287f24c92bbd5856cb9f116d9.r2.dev/web-demo-photo.jpg",
        planSlug: "spa-ban-hang-dat-lich",
        tone: "hybrid",
        focus: "Định hướng: dịch vụ + sản phẩm",
        bestFor: "Phù hợp: salon muốn tăng doanh thu phụ trợ",
        highlights: ["Booking và bán hàng chung", "Khối sản phẩm bán kèm", "Theo dõi chuyển đổi đa mục tiêu"]
      }
    ]
  },
  industry: {
    label: "Mẫu kỹ thuật",
    title: "Kho mẫu industry / kỹ thuật",
    desc: "Các mẫu mini phục vụ catalog kỹ thuật, lọc mã hàng và form báo giá B2B.",
    samples: [
      {
        title: "Industry cơ bản",
        note: "Giới thiệu năng lực và danh mục sản phẩm chính.",
        image: "https://pub-90b335e287f24c92bbd5856cb9f116d9.r2.dev/web-demo-photo.jpg",
        planSlug: "local-co-ban",
        tone: "engineer",
        focus: "Định hướng: hồ sơ năng lực",
        bestFor: "Phù hợp: xưởng/công ty kỹ thuật vừa",
        highlights: ["Trang năng lực cốt lõi", "Danh mục sản phẩm chính", "Form liên hệ B2B"]
      },
      {
        title: "Industry chuyên nghiệp",
        note: "Có nhóm catalog sâu và trang thông số rõ ràng.",
        image: "https://pub-90b335e287f24c92bbd5856cb9f116d9.r2.dev/web-demo-photo.jpg",
        planSlug: "menu-chuyen-nghiep",
        tone: "catalog",
        focus: "Định hướng: catalog chuyên sâu",
        bestFor: "Phù hợp: đơn vị nhiều mã hàng",
        highlights: ["Bộ lọc mã sản phẩm", "Trang thông số kỹ thuật", "Tài liệu tải về theo sản phẩm"]
      },
      {
        title: "Industry nâng cao",
        note: "Luồng nhận báo giá chi tiết cho nhiều mã hàng.",
        image: "https://pub-90b335e287f24c92bbd5856cb9f116d9.r2.dev/web-demo-photo.jpg",
        planSlug: "dat-ban-dat-mon",
        tone: "quote",
        focus: "Định hướng: tối ưu báo giá",
        bestFor: "Phù hợp: B2B cần xử lý lead kỹ thuật",
        highlights: ["Giỏ yêu cầu báo giá", "Form nhiều thông số đầu vào", "Luồng xử lý inquiry rõ ràng"]
      }
    ]
  },
  landing: {
    label: "Mẫu chuyển đổi",
    title: "Kho mẫu landing page",
    desc: "So nhanh các biến thể hero, khối lợi ích và form để chọn mẫu phù hợp chiến dịch.",
    samples: [
      {
        title: "Landing cơ bản",
        note: "1 mục tiêu chuyển đổi rõ, khối nội dung ngắn gọn.",
        image: "https://pub-90b335e287f24c92bbd5856cb9f116d9.r2.dev/web-demo-photo.jpg",
        planSlug: "tuyen-sinh-co-ban",
        tone: "single",
        focus: "Định hướng: một mục tiêu duy nhất",
        bestFor: "Phù hợp: chiến dịch test nhanh",
        highlights: ["Hero tập trung 1 lời hứa", "Form chuyển đổi ngắn", "Bố cục đọc nhanh 1 màn hình"]
      },
      {
        title: "Landing chuyên nghiệp",
        note: "Thêm trust block, FAQ và nhiều CTA theo hành vi.",
        image: "https://pub-90b335e287f24c92bbd5856cb9f116d9.r2.dev/web-demo-photo.jpg",
        planSlug: "trung-tam-dao-tao",
        tone: "evidence",
        focus: "Định hướng: tăng niềm tin chuyển đổi",
        bestFor: "Phù hợp: quảng cáo ngân sách trung bình",
        highlights: ["Khối bằng chứng xã hội", "FAQ theo phản đối", "CTA lặp theo hành trình đọc"]
      },
      {
        title: "Landing hệ thống",
        note: "Dành cho cụm chiến dịch cần nhiều phiên bản landing.",
        image: "https://pub-90b335e287f24c92bbd5856cb9f116d9.r2.dev/web-demo-photo.jpg",
        planSlug: "he-thong-khoa-hoc",
        tone: "funnel",
        focus: "Định hướng: vận hành đa chiến dịch",
        bestFor: "Phù hợp: đội marketing chạy nhiều adset",
        highlights: ["Mẫu section dễ nhân bản", "Điểm đo chuyển đổi rõ", "Khả năng tách biến thể theo ngành"]
      }
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
  const khoMauIdx = parts.findIndex((part) => part === "kho-mau");
  if (khoMauIdx >= 0) {
    const slug = decodeURIComponent(parts[khoMauIdx + 1] || "");
    return COLLECTIONS[slug] ? slug : "company";
  }

  const mauDemoIdx = parts.findIndex((part) => part === "mau-demo");
  const raw = mauDemoIdx >= 0 ? decodeURIComponent(parts[mauDemoIdx + 1] || "") : "";
  const slug = raw.startsWith("khomau-") ? raw.slice("khomau-".length) : raw;
  return COLLECTIONS[slug] ? slug : "company";
};

const getWebsitePriceForSlug = (slug) => {
  const plans = window.webDemoPricingData?.[slug]?.plans;
  if (Array.isArray(plans) && plans.length) {
    const minPrice = plans.reduce((min, plan) => {
      const value = parseMoney(plan?.price, 0);
      if (value <= 0) return min;
      return min === 0 ? value : Math.min(min, value);
    }, 0);
    if (minPrice > 0) {
      return formatVnd(minPrice);
    }
  }

  try {
    const cfg = JSON.parse(localStorage.getItem(`preview_config_${slug}`) || "{}");
    const localPrice = parseMoney(cfg.saleWebsitePrice, 0);
    if (localPrice > 0) {
      return formatVnd(localPrice);
    }
  } catch {
    // fall through to fixed fallback
  }

  return formatVnd(2990000);
};

const buildSampleCard = (slug, sample, index, websitePriceText) => {
  const demoVariant = Number(sample.demoVariant || (index + 1));
  const previewHref = `/preview/${encodeURIComponent(slug)}?demo=${encodeURIComponent(demoVariant)}`;
  const toneClass = `tone-${String(sample.tone || `demo-${demoVariant}`).trim().toLowerCase()}`;
  const highlights = Array.isArray(sample.highlights) ? sample.highlights.slice(0, 3) : [];

  return `
    <article class="demo-mini-card ${escapeHtml(toneClass)}">
      <div class="demo-mini-media">
        <img src="${escapeHtml(sample.image)}" alt="${escapeHtml(sample.title)}" loading="lazy" />
        <span>Mẫu ${index + 1}</span>
      </div>
      <div class="demo-mini-body">
        <h3>${escapeHtml(sample.title)}</h3>
        <div class="demo-mini-badge-row">
          <span class="demo-mini-chip is-focus">${escapeHtml(sample.focus || "Định hướng: tổng quát")}</span>
          <span class="demo-mini-chip">${escapeHtml(sample.bestFor || "Phù hợp: đa ngành")}</span>
        </div>
        <div class="demo-mini-price">Giá web: <strong>${escapeHtml(websitePriceText)}</strong></div>
        <p>${escapeHtml(sample.note)}</p>
        ${highlights.length ? `
        <ul class="demo-mini-highlights">
          ${highlights.map((item) => `<li>${escapeHtml(item)}</li>`).join("")}
        </ul>
        ` : ""}
        <div class="demo-mini-actions">
          <a class="is-buy" href="${previewHref}">Xem mẫu con →</a>
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
  const defaultKhoMauRoute = "/kho-mau/company";
  const websitePriceText = getWebsitePriceForSlug(slug);
  document.title = `${data.title} | Kho mẫu web`;

  root.innerHTML = `
    <section class="demo-collection-wrap">
      <div class="demo-collection-topbar">
        <a class="demo-collection-back" href="${defaultKhoMauRoute}">\u2190 Kho mẫu triển khai nhanh</a>
        <div class="demo-collection-actions">
          <a class="demo-collection-btn" href="/mau-demo/${encodeURIComponent(slug)}">Xem nhánh tư vấn</a>
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
