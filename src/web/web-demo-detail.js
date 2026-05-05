const DEMO_DATA = {
  company: {
    name: "Công ty / Dịch vụ chuyên nghiệp",
    brand: "Nova Consulting",
    template: "company",
    eyebrow: "Mẫu web công ty / dịch vụ",
    title: "Website tin cậy để lấy lead tư vấn",
    desc: "Hướng này hợp với công ty dịch vụ, agency, tư vấn, luật, kế toán hoặc B2B. Trọng tâm là uy tín, quy trình rõ và form nhận tư vấn.",
    image: "/web-demo-company.jpg",
    fullPreview: {
      title: "Ảnh mẫu đầy đủ cho web Công ty / Dịch vụ",
      desc: "Xem tổng thể bố cục demo từ hero, dịch vụ, quy trình đến khu nhận tư vấn trước khi chọn gói triển khai.",
      image: "/web-demo-company.jpg",
      cta: "Mở ảnh lớn"
    },
    primary: "Tư vấn mẫu công ty",
    caption: "Tone xanh đậm / trắng / xám",
    liveTitle: "Hero doanh nghiệp, dịch vụ, quy trình và form lead",
    stats: [["Tin cậy", "tone sạch, chuyên nghiệp"], ["Lead", "CTA nhận tư vấn nổi bật"], ["Quy trình", "giảm băn khoăn trước khi liên hệ"]],
    cards: [
      ["Hero lớn", "Nêu lời hứa chính, ngành phục vụ, bằng chứng tin cậy và CTA đặt lịch tư vấn."],
      ["Dịch vụ cốt lõi", "3-6 dịch vụ chính, mỗi dịch vụ có lợi ích cụ thể và nút xem chi tiết."],
      ["Quy trình làm việc", "Các bước khảo sát, tư vấn, triển khai, bàn giao để khách thấy rõ cách hợp tác."],
      ["Khách hàng / case", "Logo khách hàng, số liệu hoặc case study ngắn để tăng độ tin cậy."],
      ["FAQ trước khi liên hệ", "Giải đáp thời gian, chi phí, cách làm, bảo hành và phạm vi triển khai."],
      ["Form lấy lead", "Form ngắn gồm nhu cầu, ngân sách, số điện thoại và thời gian muốn được gọi."]
    ],
    flowTitle: "Từ niềm tin đến form tư vấn",
    flowDesc: "Mẫu công ty không cần quá màu mè. Cần làm khách thấy yên tâm, hiểu dịch vụ và để lại thông tin.",
    flow: [
      ["Tạo tin cậy", "Hero, số liệu và khách hàng tiêu biểu trả lời câu hỏi 'có đáng tin không?'."],
      ["Làm rõ năng lực", "Dịch vụ và quy trình giúp khách hiểu công ty giải quyết vấn đề gì."],
      ["Chốt lead", "CTA và form được đặt sau các bằng chứng để tỷ lệ gửi yêu cầu cao hơn."]
    ],
    contactTitle: "Muốn làm mẫu web công ty theo ngành của bạn?",
    contactText: "Có thể đổi thành web luật, kế toán, agency, tư vấn doanh nghiệp hoặc dịch vụ kỹ thuật với màu xanh đậm / trắng / xám."
  },
  shop: {
    name: "Shop bán hàng",
    brand: "Urban Goods",
    template: "shop",
    eyebrow: "Mẫu web shop bán hàng",
    title: "Trang bán hàng năng động để chốt đơn nhanh",
    desc: "Hướng này dành cho shop online, cửa hàng mỹ phẩm, thời trang, phụ kiện hoặc hàng tiêu dùng. Trọng tâm là khuyến mãi, danh mục, sản phẩm và mua ngay.",
    image: "/web-demo-shop-hero.png",
    primary: "Tư vấn mẫu shop",
    caption: "Tone năng động, màu theo ngành hàng",
    liveTitle: "Banner sale, danh mục, sản phẩm nổi bật và CTA mua ngay",
    stats: [["Sale", "banner khuyến mãi đầu trang"], ["Sản phẩm", "grid dễ quét và dễ mua"], ["Đơn hàng", "CTA mua ngay lặp lại đúng chỗ"]],
    cards: [
      ["Banner khuyến mãi", "Hiển thị ưu đãi, mã giảm giá, bộ sưu tập mới và thời hạn khuyến mãi."],
      ["Danh mục nhanh", "Cho khách đi thẳng tới nhóm sản phẩm họ quan tâm."],
      ["Sản phẩm nổi bật", "Card sản phẩm có ảnh, giá, tag bán chạy và nút mua ngay."],
      ["Combo / bundle", "Gợi ý mua kèm để tăng giá trị đơn hàng."],
      ["Feedback khách mua", "Review, ảnh thật, số đơn đã bán và cam kết đổi trả."],
      ["CTA chốt đơn", "Nút mua ngay, chat tư vấn và giỏ hàng dễ thấy trên mobile."]
    ],
    flowTitle: "Từ thấy ưu đãi đến bấm mua",
    flowDesc: "Mẫu shop nên giảm số bước ra quyết định: thấy deal, lọc danh mục, xem sản phẩm, mua ngay.",
    flow: [
      ["Kích hoạt nhu cầu", "Banner sale và sản phẩm nổi bật tạo lý do xem tiếp."],
      ["Giảm ma sát", "Danh mục, giá và lợi ích sản phẩm phải đọc được trong vài giây."],
      ["Chốt đơn", "CTA mua ngay, chat và giỏ hàng luôn ở vị trí dễ thao tác."]
    ],
    contactTitle: "Muốn có shop bán hàng dễ chốt đơn?",
    contactText: "Có thể đổi màu theo ngành hàng, thêm sản phẩm, combo, giỏ hàng, thanh toán và luồng chat tư vấn."
  },
  landing: {
    name: "Landing Page",
    brand: "Bright Edu",
    template: "landing",
    eyebrow: "Mẫu landing chuyển đổi",
    title: "Landing page tập trung chuyển đổi đăng ký",
    desc: "Hướng này phù hợp các chiến dịch cần chuyển đổi nhanh với lợi ích rõ, bảng giá, feedback và form đăng ký.",
    image: "/web-demo-photo.jpg",
    fullPreview: {
      title: "Ảnh mẫu đầy đủ cho web Landing Page",
      desc: "Xem tổng thể bố cục demo từ hero lợi ích, trust block, bảng giá đến form đăng ký tư vấn.",
      image: "/web-demo-photo.jpg",
      cta: "Mở ảnh lớn"
    },
    primary: "Tư vấn mẫu landing",
    caption: "Tone rõ lợi ích, tập trung CTA",
    liveTitle: "Hero lợi ích, gói giá, FAQ và form nhận lead",
    stats: [["Thông điệp", "nêu lợi ích trong 5 giây"], ["Ưu đãi", "bảng giá gọn, dễ quyết"], ["Đăng ký", "form ngắn để chốt lead"]],
    cards: [
      ["Hero chuyển đổi", "Nêu rõ vấn đề, lợi ích chính và lời kêu gọi hành động ngay trên màn đầu."],
      ["Lợi ích nổi bật", "Chuyển tính năng thành kết quả đo được để tăng sức thuyết phục."],
      ["Gói giá", "Trình bày 2-3 lựa chọn đơn giản để khách quyết nhanh."],
      ["Bằng chứng tin cậy", "Feedback, chỉ số, logo đối tác hoặc case ngắn để giảm nghi ngại."],
      ["FAQ chốt đơn", "Giải đáp câu hỏi thường gặp trước khi khách để lại thông tin."],
      ["Form nhận lead", "Thu tên, số điện thoại, nhu cầu và thời gian liên hệ mong muốn."]
    ],
    flowTitle: "Từ thấy lợi ích đến gửi form",
    flowDesc: "Mẫu landing cần cô đọng, ít phân tán và dẫn người xem vào một hành động chuyển đổi duy nhất.",
    flow: [
      ["Thu hút", "Hero và lợi ích chính giúp khách hiểu ngay trang này dành cho ai."],
      ["Thuyết phục", "Giá, bằng chứng và FAQ làm rõ vì sao nên chọn ngay."],
      ["Chuyển đổi", "Form ngắn và CTA lặp lại giúp tăng tỉ lệ để lại thông tin."]
    ],
    contactTitle: "Muốn làm landing theo chiến dịch riêng?",
    contactText: "Có thể tùy biến theo từng chiến dịch quảng cáo, thêm biến thể A/B, ưu đãi theo thời điểm và tracking chuyển đổi."
  },
  salon: {
    name: "Salon / Beauty",
    brand: "Maison Glow",
    template: "salon",
    eyebrow: "Mẫu web salon / beauty",
    title: "Trang salon cao cấp để khách đặt lịch",
    desc: "Hướng này dành cho salon tóc, nail và dịch vụ làm đẹp. Trọng tâm là dịch vụ, bảng giá, feedback và đặt lịch.",
    image: "/web-demo-photo.jpg",
    fullPreview: {
      title: "Ảnh mẫu đầy đủ cho web Salon / Beauty",
      desc: "Xem tổng thể bố cục demo từ hero, dịch vụ nổi bật, bảng giá, feedback đến form đặt lịch trước khi chọn gói triển khai.",
      image: "/web-demo-photo.jpg",
      cta: "Mở ảnh lớn"
    },
    primary: "Tư vấn mẫu salon",
    caption: "Tone nude / beige / champagne",
    liveTitle: "Dịch vụ nổi bật, before-after, bảng giá và booking",
    stats: [["Sang", "không gian mềm và cao cấp"], ["Chứng thực", "before-after / feedback"], ["Booking", "đặt lịch nhanh sau khi xem giá"]],
    cards: [
      ["Dịch vụ nổi bật", "Nêu liệu trình chủ lực, lợi ích và thời lượng."],
      ["Before-after", "Khu bằng chứng trực quan giúp khách tin tưởng hơn."],
      ["Bảng giá", "Gói dịch vụ rõ, có ưu đãi và combo chăm sóc."],
      ["Đội ngũ chuyên viên", "Tăng độ an tâm bằng kinh nghiệm và tiêu chuẩn an toàn."],
      ["Feedback khách", "Review nhẹ nhàng, sang, tập trung trải nghiệm và kết quả."],
      ["Đặt lịch", "Form ngày giờ, dịch vụ quan tâm, số điện thoại và kênh xác nhận."]
    ],
    flowTitle: "Từ xem kết quả đến đặt lịch",
    flowDesc: "Mẫu salon cần mềm và sang, nhưng CTA đặt lịch vẫn phải đủ rõ để không bị chỉ đẹp mà không chuyển đổi.",
    flow: [
      ["Gợi mong muốn", "Dịch vụ và hình ảnh tạo cảm giác được chăm sóc."],
      ["Tạo niềm tin", "Before-after, feedback và chuyên viên giảm rủi ro cảm nhận."],
      ["Đặt lịch", "Bảng giá và form booking đặt ngay cạnh nhau để khách hành động."]
    ],
    contactTitle: "Muốn có mẫu web salon sang hơn?",
    contactText: "Có thể thêm ảnh dịch vụ, bảng giá, feedback, booking online và nội dung theo màu thương hiệu của salon."
  },
  industry: {
    name: "Industry / Kỹ thuật",
    brand: "Tech Industrial",
    template: "industry",
    eyebrow: "Mẫu web industry / kỹ thuật",
    title: "Trang sản phẩm kỹ thuật để nhận yêu cầu báo giá",
    desc: "Hướng này dành cho doanh nghiệp kỹ thuật B2B với danh mục sản phẩm, mã sản phẩm, thương hiệu và form yêu cầu báo giá.",
    image: "/web-demo-photo.jpg",
    fullPreview: {
      title: "Ảnh mẫu đầy đủ cho web Industry / Kỹ thuật",
      desc: "Xem tổng thể bố cục demo từ hero kỹ thuật, danh mục sản phẩm, bộ lọc mã hàng đến form yêu cầu báo giá.",
      image: "/web-demo-photo.jpg",
      cta: "Mở ảnh lớn"
    },
    primary: "Tư vấn mẫu industry",
    caption: "Tone xanh thép / xám công nghiệp",
    liveTitle: "Danh mục kỹ thuật, bộ lọc mã hàng và form nhận báo giá",
    stats: [["Danh mục", "nhóm sản phẩm rõ theo ứng dụng"], ["Bộ lọc", "lọc nhanh theo mã/thương hiệu"], ["Báo giá", "form yêu cầu ngắn gọn"]],
    cards: [
      ["Hero kỹ thuật", "Nêu năng lực, phân khúc sản phẩm và CTA yêu cầu báo giá."],
      ["Danh mục sản phẩm", "Nhóm theo ngành, công suất hoặc ứng dụng thực tế."],
      ["Bộ lọc mã hàng", "Cho phép lọc theo mã, thương hiệu, chuẩn kỹ thuật và mức giá."],
      ["Thông số chi tiết", "Hiển thị thông số chính, tài liệu và ứng dụng phù hợp."],
      ["Case triển khai", "Đưa ví dụ dự án đã làm để tăng độ tin cậy B2B."],
      ["Form nhận báo giá", "Thu yêu cầu kỹ thuật, số lượng và thông tin liên hệ người phụ trách."]
    ],
    flowTitle: "Từ tìm mã hàng đến gửi yêu cầu",
    flowDesc: "Mẫu industry cần rõ thông số, dễ lọc và chốt hành động bằng form báo giá thay vì nội dung cảm tính.",
    flow: [
      ["Định vị nhu cầu", "Hero giúp khách nhận diện đúng nhóm sản phẩm kỹ thuật đang cần."],
      ["So sánh nhanh", "Danh mục và bộ lọc rút ngắn thời gian chọn phương án phù hợp."],
      ["Chốt lead B2B", "Form báo giá thu đủ dữ liệu để đội sale xử lý nhanh và chính xác."]
    ],
    contactTitle: "Muốn có mẫu web industry theo danh mục của bạn?",
    contactText: "Có thể tùy biến theo nhóm sản phẩm, bảng thông số, tài liệu kỹ thuật và quy trình báo giá của doanh nghiệp."
  }
};

const ids = ["company", "shop", "salon", "industry", "landing"];
const slug = decodeURIComponent(location.pathname.split("/").filter(Boolean).pop() || "company");
const activeId = DEMO_DATA[slug] ? slug : "company";
const active = DEMO_DATA[activeId];

document.body.dataset.demo = activeId;
document.body.dataset.template = active.template;
document.title = `${active.name} | Mẫu web demo`;

const setText = (id, text) => {
  const el = document.getElementById(id);
  if (el) el.textContent = text;
};

const escapeHtml = (value) => String(value || "").replace(/[&<>"']/g, (char) => ({
  "&": "&amp;",
  "<": "&lt;",
  ">": "&gt;",
  '"': "&quot;",
  "'": "&#39;"
}[char]));

const renderList = (items, className) => items.map((item) => `<span class="${className || ""}">${escapeHtml(item)}</span>`).join("");

const WEB_DEMO_PLAN_PRODUCT_IDS = (window.WebDemoCatalogMap && window.WebDemoCatalogMap.planProductIds) || {};
const CONSULTING_PACKAGE_LABELS = ["Gói cơ bản", "Gói chuyên nghiệp", "Gói nâng cao"];
const CONSULTING_PACKAGE_FALLBACK = [
  {
    name: CONSULTING_PACKAGE_LABELS[0],
    slug: "co-ban",
    price: "Từ 3.900.000đ",
    fit: "Cá nhân, dịch vụ nhỏ, công ty mới cần web giới thiệu nhanh",
    note: "Phù hợp khi cần lên hiện diện online gọn, tập trung giới thiệu dịch vụ và nhận liên hệ.",
    features: [
      "Hero giới thiệu dịch vụ",
      "Giới thiệu và dịch vụ chính",
      "Form tư vấn/CTA",
      "SEO cơ bản",
      "Responsive mobile",
      "Bàn giao và chỉnh sửa trong phạm vi gói"
    ]
  },
  {
    name: CONSULTING_PACKAGE_LABELS[1],
    slug: "chuyen-nghiep",
    price: "Từ 6.900.000đ",
    badge: "Khuyên dùng",
    featured: true,
    fit: "Công ty nhỏ, agency, dịch vụ tư vấn, B2B",
    note: "Có đủ trang và nội dung để khách hiểu năng lực, xem dịch vụ chi tiết và gửi yêu cầu tư vấn.",
    features: [
      "Hero lớn và điểm mạnh thương hiệu",
      "Giới thiệu/dịch vụ + trang chi tiết",
      "Sản phẩm hoặc dịch vụ chính",
      "Form tư vấn/CTA tối ưu chuyển đổi",
      "SEO cơ bản + tracking cơ bản",
      "Responsive mobile + bàn giao/chỉnh sửa"
    ]
  },
  {
    name: CONSULTING_PACKAGE_LABELS[2],
    slug: "nang-cao",
    price: "Từ 12.900.000đ",
    badge: "Mở rộng",
    fit: "Doanh nghiệp cần nội dung đầy đủ và cấu trúc triển khai sâu",
    note: "Dành cho doanh nghiệp muốn đầu tư hình ảnh thương hiệu, nội dung sâu và cấu trúc SEO tốt hơn.",
    features: [
      "Hero theo nhận diện thương hiệu",
      "Giới thiệu/dịch vụ chuyên sâu",
      "Sản phẩm hoặc dịch vụ chính theo nhóm",
      "Form tư vấn/CTA nhiều điểm chạm",
      "SEO cơ bản theo ngành",
      "Responsive mobile, bàn giao và chỉnh sửa phạm vi gói"
    ]
  }
];
const IMPLEMENTATION_DETAIL_ITEMS = [
  "Hero",
  "Giới thiệu/dịch vụ",
  "Sản phẩm hoặc dịch vụ chính",
  "Form tư vấn/CTA",
  "SEO cơ bản",
  "Responsive mobile",
  "Bàn giao/chỉnh sửa"
];

function formatFromCatalogPrice(amount) {
  const n = Number(amount || 0);
  if (!Number.isFinite(n) || n <= 0) return "";
  return `Từ ${n.toLocaleString("vi-VN")}đ`;
}

async function syncWebDemoPricingFromCatalog(industryId) {
  const plans = window.webDemoPricingData?.[industryId]?.plans;
  const planMap = WEB_DEMO_PLAN_PRODUCT_IDS?.[industryId] || {};
  if (!Array.isArray(plans) || !plans.length || !Object.keys(planMap).length) {
    return;
  }

  try {
    const response = await fetch("/api/catalog");
    if (!response.ok) return;
    const payload = await response.json().catch(() => ({}));
    const products = Array.isArray(payload?.products) ? payload.products : [];
    const productById = new Map(products.map((item) => [String(item.id || ""), item]));

    plans.forEach((plan) => {
      const productId = planMap[String(plan?.slug || "")];
      if (!productId) return;
      const product = productById.get(productId);
      if (!product) return;
      const effectivePrice = Number(product.effectivePrice ?? product.price ?? 0);
      const nextPriceText = formatFromCatalogPrice(effectivePrice);
      if (nextPriceText) {
        plan.price = nextPriceText;
      }
    });
  } catch (error) {
    console.warn("[web-demo] sync pricing from catalog failed", error?.message || error);
  }
}

function MaintenanceNote(shared) {
  const items = Array.isArray(shared?.maintenance) ? shared.maintenance : [];
  if (!items.length) return "";

  return `
    <div class="demo-maintenance-note">
      <div>
        <span class="demo-note-icon">DT</span>
        <strong>${escapeHtml(shared.maintenanceTitle || "Phí duy trì tham khảo")}</strong>
      </div>
      <dl>
        ${items.map(([label, value]) => `
          <div>
            <dt>${escapeHtml(label)}</dt>
            <dd>${escapeHtml(value)}</dd>
          </div>
        `).join("")}
      </dl>
    </div>
  `;
}

function getPricingPlansForDemo(industryId, plans) {
  const fromData = Array.isArray(plans) ? plans.filter(Boolean) : [];
  if (industryId !== "company") {
    return fromData;
  }

  const source = fromData.length ? fromData.slice(0, 3) : CONSULTING_PACKAGE_FALLBACK;
  return source.map((plan, index) => {
    const fallback = CONSULTING_PACKAGE_FALLBACK[index] || CONSULTING_PACKAGE_FALLBACK[CONSULTING_PACKAGE_FALLBACK.length - 1];
    return {
      ...fallback,
      ...plan,
      name: CONSULTING_PACKAGE_LABELS[index] || plan?.name || fallback.name,
      slug: plan?.slug || fallback.slug,
      features: Array.isArray(plan?.features) && plan.features.length ? plan.features : fallback.features
    };
  });
}

function ImplementationDetailSection() {
  return `
    <div class="demo-implementation-detail">
      <div class="demo-implementation-head">
        <span>Nội dung triển khai chi tiết</span>
        <h3>Phạm vi nội dung chuẩn trên trang con mẫu demo</h3>
      </div>
      <div class="demo-implementation-grid">
        ${IMPLEMENTATION_DETAIL_ITEMS.map((item) => `<article><b>${escapeHtml(item)}</b></article>`).join("")}
      </div>
    </div>
  `;
}

function ContentIncludedNote(shared) {
  if (!shared?.contentNote) return "";

  return `
    <div class="demo-content-note">
      <span class="demo-note-icon">ND</span>
      <p>${escapeHtml(shared.contentNote)}</p>
    </div>
  `;
}

function PricingCard(plan, index, shared, industryId) {
  const features = Array.isArray(plan?.features) ? plan.features : [];
  const badge = plan?.badge || (index === 1 ? "Khuyên dùng" : index === 2 ? "Mở rộng" : "");
  const isFeatured = Boolean(plan?.featured) || index === 1;
  const isExpanded = badge === "Mở rộng" || index === 2;
  const detailUrl = `/kho-mau/${encodeURIComponent(industryId)}/goi/${encodeURIComponent(plan?.slug || `goi-${index + 1}`)}`;
  const consultUrl = shared?.consultUrl || "https://zalo.me/0902964685";
  const cardClass = [
    "demo-pricing-card",
    isFeatured ? "is-featured" : "",
    isExpanded ? "is-expanded" : ""
  ].filter(Boolean).join(" ");

  return `
    <article class="${cardClass}">
      <div class="demo-pricing-card-top">
        <span class="demo-pricing-index">${String(index + 1).padStart(2, "0")}</span>
        ${badge ? `<span class="demo-pricing-badge">${escapeHtml(badge)}</span>` : ""}
      </div>
      <h3>${escapeHtml(plan?.name)}</h3>
      <p class="demo-pricing-price">${escapeHtml(plan?.price)}</p>
      <div class="demo-pricing-fit">
        <strong>Phù hợp</strong>
        <p>${escapeHtml(plan?.fit)}</p>
      </div>
      <ul class="demo-pricing-features">
        ${features.map((feature) => `<li>${escapeHtml(feature)}</li>`).join("")}
      </ul>
      <div class="demo-pricing-plan-note">
        <strong>Ghi chú nội dung</strong>
        <p>${escapeHtml(plan?.note)}</p>
      </div>
      <div class="demo-pricing-actions">
        <a class="demo-pricing-cta" href="${escapeHtml(detailUrl)}">${escapeHtml(shared?.detailCta || "Xem chi tiết gói")}</a>
        <a class="demo-pricing-cta is-secondary" href="${escapeHtml(consultUrl)}" target="_blank" rel="noopener">${escapeHtml(shared?.cta || "Tư vấn gói này")}</a>
      </div>
    </article>
  `;
}

function ChildVariantsSection(industryId) {
  const pathname = window.location.pathname || "";
  const isOnMauDemoPage = pathname.includes("/mau-demo/");
  if (isOnMauDemoPage) {
    return "";
  }
  
  const data = window.webDemoPricingData?.[industryId];
  const plans = Array.isArray(data?.plans) ? data.plans.slice(0, 3) : [];
  if (!plans.length) {
    return "";
  }

  return `
    <div class="demo-child-variants" aria-label="Mẫu con triển khai nhanh">
      <div class="demo-child-variants-head">
        <span>Mẫu con triển khai nhanh</span>
        <h3>3 mẫu con đã tách riêng theo từng demo</h3>
      </div>
      <div class="demo-child-variants-grid">
        ${plans.map((plan, index) => {
          const demoVariant = index + 1;
          const previewHref = `/preview/${encodeURIComponent(industryId)}?demo=${demoVariant}`;
          const adminHref = `/preview/${encodeURIComponent(industryId)}/admin?demo=${demoVariant}`;
          const packageHref = `/kho-mau/${encodeURIComponent(industryId)}/goi/${encodeURIComponent(plan.slug || `goi-${demoVariant}`)}?demo=${demoVariant}`;
          return `
            <article class="demo-child-variant-card">
              <b>Mẫu ${demoVariant}</b>
              <h4>${escapeHtml(plan.name || `Mẫu ${demoVariant}`)}</h4>
              <p>${escapeHtml(plan.note || "Bản mẫu con để triển khai nhanh theo gói.")}</p>
              <div class="demo-child-variant-actions">
                <a href="${previewHref}">Xem live</a>
                <a href="${adminHref}">Admin local</a>
                <a class="is-primary" href="${packageHref}">Vào gói triển khai</a>
              </div>
            </article>
          `;
        }).join("")}
      </div>
    </div>
  `;
}

function PricingSection(id) {
  const section = document.getElementById("demoPricing");
  const data = window.webDemoPricingData?.[id];
  const shared = window.webDemoPricingShared || {};
  const plans = getPricingPlansForDemo(id, data?.plans);

  if (!section || !plans.length) return;

  section.innerHTML = `
    <div class="demo-container">
      <div class="demo-section-head demo-pricing-head">
        <span>Báo giá theo mẫu</span>
        <h2 id="demoPricingTitle">${escapeHtml(shared.title || "Gói triển khai phù hợp")}</h2>
        <p>${escapeHtml(shared.description || "")}</p>
      </div>
      ${ChildVariantsSection(id)}
      <div class="demo-pricing-grid">
        ${plans.map((plan, index) => PricingCard(plan, index, shared, id)).join("")}
      </div>
      ${ImplementationDetailSection()}
      <div class="demo-pricing-notes">
        ${ContentIncludedNote(shared)}
        ${MaintenanceNote(shared)}
      </div>
    </div>
  `;
}

function renderShopPreview() {
  const shopItems = [
    { badge: "Ban chay", title: "Tui xach premium", price: "650K", image: "/web-demo-shop-item-bag.png" },
    { badge: "Moi ve", title: "Bo skincare", price: "320K", image: "/web-demo-shop-item-skincare.png" },
    { badge: "Combo", title: "Set thoi trang", price: "790K", image: "/web-demo-shop-item-fashion.png" },
    { badge: "Uu dai", title: "Gift box", price: "480K", image: "/web-demo-shop-bundle.png" }
  ];

  return `
    <div class="live-shop">
      <article class="live-shop-banner">
        <img src="/web-demo-shop-hero.png" alt="Giao dien shop voi banner sale va san pham noi bat" loading="lazy">
        <div class="live-shop-banner-overlay"></div>
        <div class="live-shop-banner-copy">
          <span>Mid-season sale</span>
          <h3>Bo suu tap moi dang len ke</h3>
          <p>Uu dai thoi trang va my pham den 50%, bo cuc de quet de mua.</p>
          <a href="#demoContact">Mua ngay</a>
        </div>
      </article>
      <div class="live-shop-cats">
        ${[
          ["Thoi trang nu", "/web-demo-shop-item-fashion.png"],
          ["Tui xach", "/web-demo-shop-item-bag.png"],
          ["My pham", "/web-demo-shop-item-skincare.png"],
          ["Combo qua", "/web-demo-shop-bundle.png"]
        ].map(([label, image]) => `
          <span>
            <img src="${image}" alt="${label}" loading="lazy">
            <em>${label}</em>
          </span>
        `).join("")}
      </div>
      <div class="live-shop-grid">
        ${shopItems.map((card) => `
          <article>
            <figure>
              <img src="${card.image}" alt="${card.title}" loading="lazy">
            </figure>
            <b>${card.badge}</b>
            <h4>${card.title}</h4>
            <small>${card.price}</small>
            <button>Them gio</button>
          </article>
        `).join("")}
      </div>
      <div class="live-shop-proof">
        <article class="live-shop-proof-bundle">
          <img src="/web-demo-shop-bundle.png" alt="Combo san pham de tang gia tri don hang" loading="lazy">
          <div>
            <strong>Combo de chot don</strong>
            <p>Goi y mua kem giup tang gia tri moi don va day nhanh quyet dinh mua.</p>
          </div>
        </article>
        <article class="live-shop-proof-feedback">
          <img src="/web-demo-shop-feedback.png" alt="Anh khach mua thuc te sau khi nhan hang" loading="lazy">
          <div>
            <strong>Feedback khach mua that</strong>
            <p>Review kem anh that tao niem tin va giup trang shop chuyen doi tot hon.</p>
          </div>
        </article>
      </div>
    </div>
  `;
}

function renderLivePreview(item) {
  const el = document.getElementById("demoLivePreview");
  if (!el) return;

  if (item.template === "shop") {
    el.innerHTML = renderShopPreview();
    return;
  }

  if (item.template === "company") {
    el.innerHTML = `
      <div class="live-company">
        <figure class="live-company-showcase">
          <img src="/web-demo-company.jpg" alt="Demo website công ty dịch vụ chuyên nghiệp" loading="lazy">
          <figcaption>Ảnh demo landing page công ty dịch vụ</figcaption>
        </figure>
        <div class="live-company-hero">
          <span>Trusted Advisory</span>
          <h3>Giải pháp vận hành cho doanh nghiệp tăng trưởng</h3>
          <p>Đội ngũ chuyên gia, quy trình minh bạch, báo cáo rõ ràng.</p>
          <a href="#demoContact">Nhận tư vấn</a>
        </div>
        <div class="live-company-form">
          <strong>Form lấy lead</strong>
          <label>Nhu cầu tư vấn</label>
          <label>Ngân sách dự kiến</label>
          <label>Số điện thoại</label>
          <button>Gửi yêu cầu</button>
        </div>
        <div class="live-company-row">
          ${["Dịch vụ", "Quy trình", "Khách hàng", "Case study"].map((text) => `<span>${text}</span>`).join("")}
        </div>
      </div>
    `;
    return;
  }

  if (item.template === "landing") {
    el.innerHTML = `
      <div class="live-education">
        <div class="live-edu-intro">
          <span>Chiến dịch tháng này</span>
          <h3>Landing page tập trung chốt lead nhanh</h3>
          <p>Nêu lợi ích rõ, có bảng giá gọn và CTA bấm gửi form ngay.</p>
        </div>
        <div class="live-edu-roadmap">
          ${["Hero lợi ích", "Bằng chứng", "Bảng giá", "Form đăng ký"].map((text, index) => `
            <article><b>${index + 1}</b><span>${text}</span></article>
          `).join("")}
        </div>
        <div class="live-edu-signup">
          <strong>Nhận tư vấn ngay</strong>
          <button>Để lại thông tin</button>
        </div>
      </div>
    `;
    return;
  }

  if (item.template === "salon") {
    el.innerHTML = `
      <div class="live-spa">
        <div class="live-spa-hero">
          <span>Maison Glow</span>
          <h3>Liệu trình phục hồi da chuyên sâu</h3>
        </div>
        <div class="live-spa-before">
          <div>Before</div>
          <div>After</div>
        </div>
        <div class="live-spa-pricing">
          ${["Glow Basic", "Premium Lift", "Bridal Care"].map((text) => `<article><b>${text}</b><span>Đặt lịch</span></article>`).join("")}
        </div>
      </div>
    `;
    return;
  }

  el.innerHTML = `
    <div class="live-restaurant">
      <div class="live-restaurant-hero">
        <span>Industry catalog</span>
        <h3>Thiết bị lọc công nghiệp cho nhà máy</h3>
        <a href="#demoContact">Yêu cầu báo giá</a>
      </div>
      <div class="live-restaurant-menu">
        ${["Lọc theo mã", "Theo thương hiệu", "Theo công suất", "Theo ứng dụng"].map((text) => `<article><b>${text}</b><span>xem nhanh</span></article>`).join("")}
      </div>
      <div class="live-restaurant-map">
        <strong>Thông số & tài liệu kỹ thuật</strong>
        <p>Datasheet, tiêu chuẩn, thời gian giao hàng và hỗ trợ kỹ thuật</p>
      </div>
    </div>
  `;
}

function renderFullPreview(item) {
  const section = document.getElementById("demoFullPreview");
  if (!section) return;

  if (!item?.fullPreview?.image) {
    section.innerHTML = "";
    section.hidden = true;
    return;
  }

  section.hidden = false;
  section.innerHTML = `
    <div class="demo-container">
      <div class="demo-section-head demo-full-preview-head">
        <span>Ảnh demo đầy đủ</span>
        <h2>${escapeHtml(item.fullPreview.title)}</h2>
        <p>${escapeHtml(item.fullPreview.desc || "")}</p>
      </div>
      <figure class="demo-full-preview-frame">
        <img src="${escapeHtml(item.fullPreview.image)}" alt="${escapeHtml(item.fullPreview.title)}" loading="lazy">
        <figcaption>
          <span>Preview nguyên ảnh</span>
          <a href="${escapeHtml(item.fullPreview.image)}" target="_blank" rel="noopener">${escapeHtml(item.fullPreview.cta || "Mở ảnh lớn")}</a>
        </figcaption>
      </figure>
    </div>
  `;
}

setText("demoEyebrow", active.eyebrow);
setText("demoTitle", active.title);
setText("demoDesc", active.desc);
setText("demoPrimary", active.primary);
setText("demoVisualCaption", active.caption);
setText("demoMockBrand", active.brand);
setText("demoMockLine", active.desc);
setText("demoLiveTitle", active.liveTitle);
setText("demoSectionTitle", `Bố cục riêng cho ${active.name}`);
setText("demoFlowTitle", active.flowTitle);
setText("demoFlowDesc", active.flowDesc);
setText("demoContactTitle", active.contactTitle);
setText("demoContactText", active.contactText);

const contactCta = document.getElementById("demoContactCta");
if (contactCta) {
  contactCta.href = "https://zalo.me/0902964685";
  contactCta.target = "_blank";
  contactCta.rel = "noopener";
  contactCta.textContent = "Liên Hệ Tư Vấn";
}

const heroImage = document.getElementById("demoHeroImage");
if (heroImage) {
  heroImage.src = active.image || "/web-demo-photo.jpg";
  heroImage.alt = `Ảnh demo ${active.name}`;
}

const switchEl = document.getElementById("demoSwitch");
if (switchEl) {
  const mauDemoBase = location.pathname.includes("/thiet-ke-web/theo-nganh/")
    ? "/thiet-ke-web/theo-nganh/mau-demo"
    : "/mau-demo";
  switchEl.innerHTML = ids.map((id) => {
    const item = DEMO_DATA[id];
    const current = id === activeId ? " active" : "";
    const aria = id === activeId ? ' aria-current="page"' : "";
    return `<a class="${current.trim()}" href="${mauDemoBase}/${id}"${aria}>${escapeHtml(item.name)}</a>`;
  }).join("");
}

const statsEl = document.getElementById("demoStats");
if (statsEl) {
  statsEl.innerHTML = active.stats.map(([value, label]) => `
    <div class="demo-stat">
      <strong>${escapeHtml(value)}</strong>
      <span>${escapeHtml(label)}</span>
    </div>
  `).join("");
}

const mockItemsEl = document.getElementById("demoMockItems");
if (mockItemsEl) {
  mockItemsEl.innerHTML = active.cards.slice(0, 6).map(() => "<span></span>").join("");
}

const cardsEl = document.getElementById("demoCards");
if (cardsEl) {
  cardsEl.innerHTML = active.cards.map(([title, text], index) => `
    <article class="demo-card">
      <b>${String(index + 1).padStart(2, "0")}</b>
      <h3>${escapeHtml(title)}</h3>
      <p>${escapeHtml(text)}</p>
    </article>
  `).join("");
}

const flowEl = document.getElementById("demoFlowList");
if (flowEl) {
  flowEl.innerHTML = active.flow.map(([title, text], index) => `
    <article class="demo-flow-item">
      <span>${index + 1}</span>
      <div>
        <h3>${escapeHtml(title)}</h3>
        <p>${escapeHtml(text)}</p>
      </div>
    </article>
  `).join("");
}

renderLivePreview(active);
renderFullPreview(active);
syncWebDemoPricingFromCatalog(activeId).finally(() => {
  PricingSection(activeId);
});

function toggleSectionBySelector(selector, enabled) {
  const el = document.querySelector(selector);
  if (!el) return;
  el.style.display = enabled ? "" : "none";
}

function applyTemplateConfig(item) {
  const config = item?.config || {};
  const seo = item?.seo || {};
  const siteSettings = config.siteSettings || {};
  const themeSettings = config.themeSettings || {};
  const sections = config.pageSections || {};

  const root = document.documentElement;
  if (themeSettings.primaryColor) root.style.setProperty("--demo-primary", String(themeSettings.primaryColor));
  if (themeSettings.buttonColor) root.style.setProperty("--demo-button", String(themeSettings.buttonColor));

  if (siteSettings.brandName) {
    setText("demoMockBrand", String(siteSettings.brandName));
  }
  if (siteSettings.logoUrl) {
    const logo = document.querySelector(".logo-img");
    if (logo) logo.setAttribute("src", String(siteSettings.logoUrl));
  }

  if (seo.title) document.title = String(seo.title);
  if (seo.description) {
    const metaDesc = document.querySelector('meta[name="description"]');
    if (metaDesc) metaDesc.setAttribute("content", String(seo.description));
  }

  const hero = sections.hero || {};
  if (hero.title) setText("demoTitle", String(hero.title));
  if (hero.subtitle) setText("demoDesc", String(hero.subtitle));
  if (hero.imageUrl) {
    const heroImage = document.getElementById("demoHeroImage");
    if (heroImage) heroImage.setAttribute("src", String(hero.imageUrl));
  }

  const cta = sections.cta || {};
  if (cta.title) setText("demoContactTitle", String(cta.title));

  toggleSectionBySelector(".demo-hero", hero.enabled !== false);
  toggleSectionBySelector(".demo-live-section", sections.featured?.enabled !== false);
  toggleSectionBySelector("#demoSections", sections.feedback?.enabled !== false);
  toggleSectionBySelector(".demo-flow-section", sections.process?.enabled !== false);
  toggleSectionBySelector("#demoContact", sections.cta?.enabled !== false);

  const contactCta = document.getElementById("demoContactCta");
  if (contactCta) {
    if (siteSettings.zalo) {
      contactCta.href = String(siteSettings.zalo);
      contactCta.target = "_blank";
      contactCta.rel = "noopener";
    }
    if (siteSettings.hotline) {
      contactCta.textContent = `Gọi ${siteSettings.hotline}`;
    }
  }
}

async function loadTemplateConfigFromAdmin() {
  try {
    const res = await fetch(`/api/web-demo/templates/${encodeURIComponent(activeId)}`);
    if (!res.ok) return;
    const data = await res.json().catch(() => ({}));
    if (!data?.item) return;
    applyTemplateConfig(data.item);
  } catch (error) {
    console.warn("[web-demo] load template config failed", error?.message || error);
  }
}

loadTemplateConfigFromAdmin();
