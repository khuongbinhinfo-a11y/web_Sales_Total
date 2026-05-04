/* web-preview.js — Renders 5 industry templates with localStorage config overrides */

const PREVIEW_DATA = {
  company: {
    name: "Công ty / Dịch vụ",
    brand: "Nova Consulting",
    eyebrow: "Mẫu web công ty / dịch vụ",
    title: "Website <em>tin cậy</em> để lấy lead tư vấn",
    desc: "Hướng này phù hợp công ty dịch vụ, agency, tư vấn, luật, kế toán hoặc B2B. Trọng tâm là uy tín, quy trình rõ và form nhận tư vấn.",
    navLinks: ["Giới thiệu", "Dịch vụ", "Quy trình", "Khách hàng", "Liên hệ"],
    cards: [
      ["🏅", "Dịch vụ cốt lõi", "Tư vấn chiến lược, kiểm toán quy trình, triển khai hệ thống CRM/ERP cho doanh nghiệp vừa và lớn."],
      ["⚡", "Triển khai nhanh", "Cam kết bàn giao đúng tiến độ với quy trình 4 bước rõ ràng và báo cáo tuần."],
      ["🔒", "Bảo mật dữ liệu", "Hệ thống mã hoá đầu cuối, audit trail và chính sách bảo mật ISO 27001."],
      ["📊", "Báo cáo thời gian thực", "Dashboard theo dõi KPI, chỉ số hiệu quả và cảnh báo tự động 24/7."],
      ["🤝", "Hỗ trợ sau dự án", "12 tháng hỗ trợ kỹ thuật, cập nhật tính năng và đào tạo nhân sự."],
      ["🌐", "Đa chi nhánh", "Hệ thống tập trung cho phép quản lý nhiều văn phòng / chi nhánh từ một nơi."]
    ],
    flow: [
      ["Tạo tin cậy", "Hero, số liệu và khách hàng tiêu biểu trả lời câu hỏi 'có đáng tin không?'."],
      ["Làm rõ năng lực", "Dịch vụ và quy trình giúp khách hiểu công ty giải quyết vấn đề gì và bằng cách nào."],
      ["Chốt lead", "CTA và form được đặt sau các bằng chứng để tỷ lệ gửi yêu cầu tư vấn cao hơn."]
    ],
    stats: [["500+", "Dự án hoàn thành"], ["98%", "Khách hàng hài lòng"], ["12+", "Năm kinh nghiệm"], ["50+", "Chuyên gia"]],
    faq: [
      ["Thời gian triển khai trung bình là bao lâu?", "Tuỳ quy mô, thông thường từ 2–8 tuần. Giai đoạn khảo sát và thiết kế chiếm 30–40% tiến độ tổng."],
      ["Chi phí có cố định không?", "Báo giá cố định sau khi xác nhận yêu cầu. Không phát sinh ngoài phạm vi đã ký kết."],
      ["Có hỗ trợ sau khi bàn giao không?", "Có. Gói bảo hành 12 tháng và hỗ trợ kỹ thuật ưu tiên cho khách hàng dài hạn."],
      ["Doanh nghiệp nhỏ có phù hợp không?", "Có gói phù hợp từ 5 đến 500+ nhân sự. Liên hệ để được tư vấn gói đúng quy mô."]
    ],
    planSlug: "co-ban",
    contactTitle: "Muốn làm web công ty theo ngành của bạn?",
    contactText: "Đổi màu, ngành nghề, nội dung và cấu trúc theo yêu cầu. Liên hệ để nhận báo giá ngay."
  },
  shop: {
    name: "Shop bán hàng",
    brand: "Urban Goods",
    eyebrow: "Mẫu web shop bán hàng",
    title: "Trang bán hàng <em>năng động</em> để chốt đơn nhanh",
    desc: "Hướng này dành cho shop online, cửa hàng mỹ phẩm, thời trang, phụ kiện hoặc hàng tiêu dùng. Trọng tâm là khuyến mãi, danh mục, sản phẩm và mua ngay.",
    navLinks: ["Trang chủ", "Danh mục", "Sale", "Tin tức", "Liên hệ"],
    categories: ["Tất cả", "Mới nhất", "Bán chạy", "Khuyến mãi", "Nam", "Nữ"],
    products: [
      { icon: "👕", name: "Áo thun basic unisex", price: "199.000đ", old: "280.000đ", badge: "-29%" },
      { icon: "👟", name: "Giày thể thao nhẹ", price: "450.000đ", old: "600.000đ", badge: "-25%" },
      { icon: "👜", name: "Túi xách mini da PU", price: "320.000đ", old: null, badge: "Mới" },
      { icon: "🧴", name: "Sữa rửa mặt tạo bọt", price: "180.000đ", old: "220.000đ", badge: "-18%" },
      { icon: "⌚", name: "Đồng hồ dây silicon", price: "890.000đ", old: "1.200.000đ", badge: "-26%" },
      { icon: "🎒", name: "Balo laptop chống nước", price: "560.000đ", old: null, badge: "Hot" },
      { icon: "💄", name: "Son dưỡng màu căng bóng", price: "95.000đ", old: "130.000đ", badge: "-27%" },
      { icon: "🕶️", name: "Kính mát gọng kim loại", price: "240.000đ", old: null, badge: "Mới" }
    ],
    reviews: [
      { name: "Ngọc Linh", sub: "Mua tháng 4/2026", text: "Giao hàng nhanh, sản phẩm y hình, đóng gói cẩn thận. Rất hài lòng, sẽ mua lại!" },
      { name: "Minh Tuấn", sub: "Mua tháng 3/2026", text: "Chất vải tốt, mặc thoáng mát. Nhân viên tư vấn nhiệt tình, giao đúng size." },
      { name: "Thu Hà", sub: "Mua tháng 4/2026", text: "Mua combo 3 món được giảm thêm, giá hợp lý so với chất lượng. Đã giới thiệu cho bạn bè." }
    ],
    planSlug: "shop-ban-hang",
    contactTitle: "Muốn có shop bán hàng dễ chốt đơn?",
    contactText: "Thêm sản phẩm, danh mục, combo, tích điểm và luồng chat tư vấn theo yêu cầu."
  },
  salon: {
    name: "Salon / Beauty",
    brand: "Maison Glow",
    eyebrow: "Mẫu web salon / beauty",
    title: "Trang salon <em>cao cấp</em> để khách đặt lịch",
    desc: "Hướng này dành cho salon tóc, nail và dịch vụ làm đẹp. Trọng tâm là dịch vụ, bảng giá, feedback và đặt lịch.",
    navLinks: ["Trang chủ", "Dịch vụ", "Bảng giá", "Gallery", "Đặt lịch"],
    services: [
      { icon: "✂️", name: "Cắt & Tạo kiểu", desc: "Phong cách Hàn Quốc, Pháp, Nhật. Kỹ thuật viên học ở nước ngoài về.", price: "150.000đ" },
      { icon: "🌈", name: "Nhuộm màu cao cấp", desc: "Màu thuốc không amoniac, giữ màu 3–4 tháng, kèm phục hồi tóc.", price: "800.000đ" },
      { icon: "💅", name: "Nail nghệ thuật", desc: "Gel, ombre, đắp bột, thiết kế riêng theo yêu cầu. Bảo hành 2 tuần.", price: "250.000đ" },
      { icon: "🧖", name: "Chăm sóc da mặt", desc: "Công nghệ RF, điện di vitamin C, mặt nạ hyaluronic acid.", price: "450.000đ" },
      { icon: "💆", name: "Gội đầu thư giãn", desc: "Massage đầu cổ vai gáy 30 phút, dầu gội thảo mộc nhập khẩu.", price: "120.000đ" },
      { icon: "👄", name: "Phun xăm thẩm mỹ", desc: "Kỹ thuật ombre powder mày, môi thảo mộc. Bảo hành lên màu.", price: "1.500.000đ" }
    ],
    gallery: [
      { icon: "✂️", label: "Cắt bob Hàn" },
      { icon: "🌈", label: "Balayage nâu ombre" },
      { icon: "💅", label: "Nail hoa 3D" },
      { icon: "💆", label: "Chăm sóc da" },
      { icon: "✨", label: "Lash extension" },
      { icon: "💇", label: "Uốn xoăn lơi" }
    ],
    pricing: [
      { name: "Gói Cơ Bản", price: "350.000đ", features: ["Cắt + gội sấy", "1 dịch vụ nail", "Massage đầu 15 phút"], featured: false },
      { name: "Gói Chăm Sóc", price: "750.000đ", features: ["Cắt + nhuộm 1 màu", "Nail + gel", "Chăm sóc da cơ bản", "Thức uống miễn phí"], featured: true },
      { name: "Gói VIP", price: "1.500.000đ", features: ["Full service trọn gói", "Nhuộm cao cấp", "Nail phức tạp + đắp bột", "Dưỡng da chuyên sâu", "Phun xăm combo"], featured: false }
    ],
    reviews: [
      { name: "Hồng Nhung", sub: "Khách thường xuyên", text: "Làm tóc ở đây hơn 2 năm rồi. Kỹ thuật viên giỏi, không gian sang và sạch, giá hợp lý." },
      { name: "Bảo Ngọc", sub: "Khách mới", text: "Đặt lịch online rất tiện, vào là được phục vụ ngay. Nail ra đẹp như hình mẫu." },
      { name: "Mai Anh", sub: "Khách tháng 4", text: "Tóc hỏng nặng sau nhuộm nhiều lần, đến đây phục hồi 3 lần là mềm mượt lại hẳn." }
    ],
    planSlug: "spa-chuyen-nghiep",
    contactTitle: "Muốn có mẫu web salon sang hơn?",
    contactText: "Thêm ảnh dịch vụ, bảng giá, booking online và nội dung theo màu thương hiệu của salon."
  },
  industry: {
    name: "Industry / Kỹ thuật",
    brand: "TechIndustrial VN",
    eyebrow: "Mẫu web industry / kỹ thuật",
    title: "Trang <em>kỹ thuật B2B</em> để nhận yêu cầu báo giá",
    desc: "Hướng này dành cho doanh nghiệp kỹ thuật B2B với danh mục sản phẩm, mã sản phẩm, thương hiệu và form yêu cầu báo giá.",
    navLinks: ["Trang chủ", "Sản phẩm", "Thông số", "Dự án", "Liên hệ"],
    cards: [
      ["⚙️", "Máy bơm công nghiệp", "Lưu lượng 20–500 m³/h. Chuẩn API 610. Phù hợp hoá chất, dầu khí, xử lý nước."],
      ["🔧", "Motor điện 3 pha", "Dải công suất 0.75–250 kW. IE3 premium efficiency. Bảo vệ IP55/IP65."],
      ["🌡️", "Thiết bị đo lường", "Đo lưu lượng, áp suất, nhiệt độ. Tích hợp Modbus/4–20mA/HART."],
      ["🔌", "Biến tần & Contactor", "Điều khiển tốc độ motor. Dải 0.4–315 kW. Thương hiệu ABB, Schneider."],
      ["🏗️", "Cấu kiện thép kỹ thuật", "Khung chịu lực, hộp số công nghiệp, ổ lăn chính xác cao."],
      ["📋", "Tư vấn lựa chọn thiết bị", "Đội kỹ sư hỗ trợ chọn đúng thiết bị theo điều kiện vận hành thực tế."]
    ],
    specs: [
      ["Loại thiết bị", "Máy bơm ly tâm", "Motor 3 pha", "Biến tần"],
      ["Thương hiệu", "Grundfos, KSB", "ABB, WEG", "Danfoss, Yaskawa"],
      ["Chuẩn kiểm định", "API 610 / ISO 9001", "IEC 60034 / IE3", "IEC 61800"],
      ["Xuất xứ", "Đan Mạch / Đức", "Thuỵ Điển / Brazil", "Đan Mạch / Nhật"],
      ["Bảo hành", "18 tháng", "24 tháng", "24 tháng"],
      ["Hỗ trợ kỹ thuật", "24/7 hotline", "Tại chỗ trong 48h", "Remote / on-site"]
    ],
    partners: ["Grundfos", "ABB", "Schneider", "Danfoss", "WEG", "SKF"],
    flow: [
      ["Định vị nhu cầu", "Hero giúp khách nhận diện đúng nhóm thiết bị kỹ thuật đang cần."],
      ["So sánh nhanh", "Danh mục và thông số rút ngắn thời gian chọn phương án phù hợp."],
      ["Chốt lead B2B", "Form báo giá thu đủ dữ liệu để đội kỹ sư xử lý nhanh và chính xác."]
    ],
    stats: [["1.200+", "Dự án lắp đặt"], ["200+", "Thương hiệu phân phối"], ["15+", "Năm kinh nghiệm"], ["24/7", "Hỗ trợ kỹ thuật"]],
    planSlug: "menu-chuyen-nghiep",
    contactTitle: "Muốn có mẫu web industry theo danh mục của bạn?",
    contactText: "Tùy biến theo nhóm sản phẩm, bảng thông số, tài liệu kỹ thuật và quy trình báo giá."
  },
  landing: {
    name: "Landing Page",
    brand: "Bright Studio",
    eyebrow: "Mẫu landing chuyển đổi",
    title: "Landing page <em>tập trung</em> để chuyển đổi đăng ký",
    desc: "Hướng này phù hợp chiến dịch cần chuyển đổi nhanh với lợi ích rõ, bảng giá, feedback và form đăng ký.",
    navLinks: ["Trang chủ", "Lợi ích", "Gói giá", "Học viên", "Đăng ký"],
    benefits: [
      ["🎯", "Mục tiêu rõ ràng", "Khoá học được thiết kế theo outcome cụ thể. Bạn biết mình đạt được gì sau khi hoàn thành."],
      ["⏱️", "Học theo tốc độ riêng", "Nội dung online, học bất cứ lúc nào. Truy cập vĩnh viễn sau khi đăng ký."],
      ["🏆", "Chứng chỉ được công nhận", "Chứng nhận hoàn thành được đối tác doanh nghiệp chấp nhận để đánh giá năng lực."],
      ["👨‍🏫", "Mentor 1-1 theo yêu cầu", "Đặt lịch tư vấn trực tiếp với chuyên gia khi gặp khó khăn trong quá trình học."],
      ["📱", "Học trên mọi thiết bị", "App mobile, tablet và desktop. Đồng bộ tiến trình học xuyên suốt."],
      ["💬", "Cộng đồng học viên", "Group riêng để trao đổi, hỏi đáp và networking với hơn 4.000 học viên đang học."]
    ],
    pricing: [
      { name: "Gói Cơ Bản", price: "990.000đ", period: "trọn đời", features: ["Toàn bộ bài học cơ bản", "Tài liệu PDF", "Hỗ trợ qua email", "Chứng chỉ hoàn thành"], featured: false },
      { name: "Gói Pro", price: "1.990.000đ", period: "trọn đời", features: ["Tất cả gói Cơ Bản", "Dự án thực tế", "Mentor 3 buổi", "Group học viên VIP", "Voucher khoá học mới"], featured: true },
      { name: "Gói Team", price: "4.500.000đ", period: "5 người", features: ["5 tài khoản trọn đời", "Kho tài liệu doanh nghiệp", "Quản lý tiến trình team", "Training nội bộ", "API tích hợp LMS"], featured: false }
    ],
    reviews: [
      { name: "Quang Khải", sub: "Học viên khoá 12", text: "Đăng ký xong thấy ngay nội dung rất thực tế, không lý thuyết suông. Làm được việc ngay sau 3 tuần học." },
      { name: "Diệu Linh", sub: "Học viên khoá 10", text: "Mentor rất nhiệt tình. Tôi hỏi sáng, buổi chiều đã có giải đáp chi tiết kèm ví dụ thực tế." },
      { name: "Thanh Bình", sub: "Team 5 người", text: "Mua gói Team cho cả phòng, tiết kiệm được 60% so với mua lẻ. Theo dõi tiến trình từng người rất tiện." }
    ],
    faq: [
      ["Có thể học ngay sau khi đăng ký không?", "Có. Sau khi thanh toán, bạn nhận email và truy cập nội dung trong vòng 5 phút."],
      ["Có hạn truy cập không?", "Không. Gói Cơ Bản và Pro là truy cập vĩnh viễn, bao gồm cả bản cập nhật nội dung."],
      ["Nếu không phù hợp có hoàn tiền không?", "Có. Chính sách hoàn tiền 7 ngày nếu hoàn thành dưới 20% khoá học."],
      ["Chứng chỉ có giá trị pháp lý không?", "Chứng chỉ do đơn vị đào tạo cấp, được 200+ doanh nghiệp đối tác công nhận để đánh giá năng lực ứng viên."]
    ],
    stats: [["4.500+", "Học viên"], ["96%", "Hoàn thành khoá"], ["4.8★", "Đánh giá TB"], ["200+", "Doanh nghiệp đối tác"]],
    planSlug: "trung-tam-dao-tao",
    contactTitle: "Muốn làm landing theo chiến dịch riêng?",
    contactText: "Tùy biến theo từng chiến dịch quảng cáo, thêm biến thể A/B, ưu đãi theo thời điểm và tracking chuyển đổi."
  }
};

/* ============================================================ */

const e = (v) =>
  String(v || "").replace(/[&<>"']/g, (c) =>
    ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c])
  );

const parseSlug = () => {
  const parts = location.pathname.split("/").filter(Boolean);
  const idx = parts.indexOf("preview");
  const raw = idx >= 0 ? decodeURIComponent(parts[idx + 1] || "") : "";
  return PREVIEW_DATA[raw] ? raw : "company";
};

const parseCompanyDemoVariant = () => {
  const params = new URLSearchParams(location.search || "");
  const n = parseInt(params.get("demo") || "1", 10);
  if (Number.isFinite(n) && n >= 1 && n <= 3) {
    return n;
  }
  return 1;
};

const loadConfig = (slug) => {
  try { return JSON.parse(localStorage.getItem(`preview_config_${slug}`) || "{}"); }
  catch { return {}; }
};

const parseMoney = (v, fallback = 0) => {
  const n = Number(String(v || "").replace(/[^\d]/g, ""));
  return Number.isFinite(n) && n > 0 ? n : fallback;
};

const formatVnd = (n) => `${Number(n || 0).toLocaleString("vi-VN")}đ`;

const NAV_SECTION_IDS = {
  company: ["home", "services", "process", "proof", "contact"],
  shop: ["home", "products", "benefits", "proof", "contact"],
  salon: ["home", "services", "pricing", "gallery", "contact"],
  industry: ["home", "products", "specs", "process", "contact"],
  landing: ["home", "benefits", "pricing", "proof", "contact"]
};

const getSalesConfig = (config, fallbackPhone) => ({
  websitePrice: parseMoney(config.saleWebsitePrice, 2990000),
  hostingPrice: parseMoney(config.saleHostingPrice, 1200000),
  domainPrice: parseMoney(config.saleDomainPrice, 350000),
  hostingYears: String(config.saleHostingYears || "1,2,3").split(",").map((s) => parseInt(s.trim(), 10)).filter((n) => Number.isFinite(n) && n > 0),
  domainYears: String(config.saleDomainYears || "1,2,3").split(",").map((s) => parseInt(s.trim(), 10)).filter((n) => Number.isFinite(n) && n > 0),
  domainSuffixes: String(config.saleDomainSuffixes || ".com,.vn,.com.vn,.shop,.info")
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean),
  buttonText: config.saleButtonText || "Mua ngay",
  salePhone: config.salePhone || fallbackPhone || "0901 234 567",
  saleZalo: config.saleZalo || fallbackPhone || "0901 234 567",
  saleNote: config.saleNote || "Bàn giao trong 24 giờ sau khi xác nhận thanh toán.",
  showHosting: config.saleEnableHosting !== false,
  showDomain: config.saleEnableDomain !== false
});

const renderBrand = (brand, config) => {
  if (config.logoUrl) {
    return `<img src="${e(config.logoUrl)}" alt="${e(brand)}" style="height:34px;width:auto;display:block" />`;
  }
  return e(brand);
};

const applyTheme = (config) => {
  const r = document.documentElement;
  if (config.colorPrimary) r.style.setProperty("--c-primary", config.colorPrimary);
  if (config.colorAccent) r.style.setProperty("--c-accent", config.colorAccent);
};

const renderTopbar = (slug, data, planSlug) => {
  const params = new URLSearchParams(location.search || "");
  const demo = params.get("demo");
  const adminHref = slug === "company" && demo
    ? `/preview/${e(slug)}/admin?demo=${e(demo)}`
    : `/preview/${e(slug)}/admin`;
  return `
  <div class="preview-topbar">
    <span>👁 <strong>Đây là bản demo</strong> — mẫu web &ldquo;${e(data.name)}&rdquo;</span>
    <div class="preview-topbar-actions">
      <a class="preview-topbar-btn is-back" href="/mau-demo/khomau-${e(slug)}">← Xem kho mẫu</a>
      <a class="preview-topbar-btn is-admin" href="${adminHref}">⚙ Thử admin</a>
      <a class="preview-topbar-btn is-buy" href="#buy">Mua ngay →</a>
    </div>
  </div>
`;
};

const renderNav = (brand, links, slug, planSlug, config) => {
  const ids = NAV_SECTION_IDS[slug] || [];
  return `
  <nav class="pv-nav">
    <div class="pv-nav-logo">${renderBrand(brand, config || {})}</div>
    <ul class="pv-nav-links">
      ${links.map((l, i) => `<li><a href="#${e(ids[i] || "home")}">${e(l)}</a></li>`).join("")}
    </ul>
    <a class="pv-nav-cta" href="#buy">Mua ngay</a>
  </nav>
`;
};

const renderPurchaseSection = (config, slug, data) => {
  const sales = getSalesConfig(config, config.phone || config.zalo);
  const hostYears = sales.hostingYears.length ? sales.hostingYears : [1];
  const domainYears = sales.domainYears.length ? sales.domainYears : [1];
  const suffixes = sales.domainSuffixes.length ? sales.domainSuffixes : [".com"];
  return `
  <section class="pv-section alt" id="buy">
    <div class="pv-container">
      <div class="pv-section-head">
        <span class="eyebrow">Mua ngay mẫu này</span>
        <h2>Giá mẫu web này: ${formatVnd(sales.websitePrice)}</h2>
        <p>${e(sales.saleNote)}</p>
      </div>
      <div class="pv-form-wrap js-order-box" style="margin-top:22px"
        data-template-slug="${e(slug)}"
        data-base="${sales.websitePrice}"
        data-host-price="${sales.hostingPrice}"
        data-domain-price="${sales.domainPrice}">
        <div class="pv-form-row">
          ${sales.showDomain ? `
          <div class="pv-form-group">
            <label><input type="checkbox" class="js-domain-enable" checked /> Thêm domain</label>
            <div class="pv-form-row">
              <select class="js-domain-suffix">${suffixes.map((tld) => `<option>${e(tld)}</option>`).join("")}</select>
              <select class="js-domain-years">${domainYears.map((y) => `<option value="${y}">${y} năm</option>`).join("")}</select>
            </div>
            <small>+ ${formatVnd(sales.domainPrice)} / năm</small>
          </div>
          ` : ""}
          ${sales.showHosting ? `
          <div class="pv-form-group">
            <label><input type="checkbox" class="js-host-enable" checked /> Thêm hosting</label>
            <select class="js-host-years">${hostYears.map((y) => `<option value="${y}">${y} năm</option>`).join("")}</select>
            <small>+ ${formatVnd(sales.hostingPrice)} / năm</small>
          </div>
          ` : ""}
        </div>
        <div class="pv-form-group"><label>Tên domain mong muốn</label><input type="text" class="js-domain-name" placeholder="ten-thuong-hieu" /></div>
        <div class="pv-form-group"><label>Tổng giá tạm tính</label><div class="pv-pricing-price js-order-total">${formatVnd(sales.websitePrice)}</div></div>
        <button type="button" class="pv-form-submit js-order-checkout">Thanh toán tự động</button>
        <div class="pv-form-group"><small class="js-order-note">Hệ thống sẽ lấy thông tin tài khoản đã đăng nhập để tạo đơn và chuyển qua trang thanh toán.</small></div>
      </div>
    </div>
  </section>
`;
};

const renderSupportPopup = (config) => {
  const supportZalo = String(config.saleZalo || config.zalo || "0902964685").trim();
  const supportPhone = String(config.salePhone || config.phone || "0902964685").trim();
  return `
  <aside class="pv-support-dock" id="pvSupportDock" aria-label="Ho tro nhanh">
    <button class="pv-support-toggle" id="pvSupportToggle" type="button" aria-expanded="true" aria-controls="pvSupportBody">
      <span class="pv-support-toggle-icon">-</span>
      <span class="pv-support-toggle-text">Ho tro</span>
    </button>
    <div class="pv-support-body" id="pvSupportBody">
      <p class="pv-support-title">Can ho tro nhanh?</p>
      <p class="pv-support-copy">Popup nay luon hien tren tat ca trang de khach lien he ngay khi can.</p>
      <div class="pv-support-actions">
        <a class="pv-support-chip" href="https://zalo.me/${e(supportZalo)}" target="_blank" rel="noopener">Nhan Zalo</a>
        <a class="pv-support-chip" href="tel:${e(supportPhone)}">Goi ${e(supportPhone)}</a>
      </div>
    </div>
  </aside>
`;
};

const renderPostsSection = (config) => {
  const posts = Array.isArray(config?.posts) ? config.posts.filter((p) => p && (p.title || p.content)) : [];
  return `
  <section class="pv-section" id="posts">
    <div class="pv-container">
      <div class="pv-section-head">
        <span class="eyebrow">Tin tuc</span>
        <h2>Bai viet moi</h2>
      </div>
      ${posts.length ? `<div class="pv-posts-grid">
        ${posts.map((p) => `
          <article class="pv-post-card">
            <div class="pv-post-cover">📰</div>
            <div class="pv-post-body">
              <div class="pv-post-meta">${e(p.tag || "Tin tuc")} · ${e(p.date || "")}</div>
              <h3>${e(p.title || "Bai viet")}</h3>
              <p>${e(p.content || "")}</p>
            </div>
          </article>
        `).join("")}
      </div>` : `<div class="pv-form-wrap" style="max-width:760px;text-align:center"><p style="margin:0;color:var(--c-muted)">Chưa có bài viết. Vào Admin → tab Bài viết để thêm nội dung và bấm Lưu thay đổi.</p></div>`}
    </div>
  </section>
`;
};

const parseCompanyTripleLines = (raw, expectedParts) => String(raw || "")
  .split("\n")
  .map((line) => line.trim())
  .filter(Boolean)
  .map((line) => line.split("|").map((part) => part.trim()))
  .filter((parts) => parts.length >= expectedParts);

const getCompanyContent = (data, config) => {
  const cardsFromArray = Array.isArray(config.companyCards)
    ? config.companyCards
      .map((item) => ({
        icon: String(item?.icon || "").trim() || "🏅",
        imageUrl: String(item?.imageUrl || "").trim(),
        title: String(item?.title || "").trim(),
        desc: String(item?.desc || "").trim()
      }))
      .filter((item) => item.title || item.desc)
    : [];
  const flowFromArray = Array.isArray(config.companyFlow)
    ? config.companyFlow
      .map((item) => [String(item?.title || "").trim(), String(item?.desc || "").trim()])
      .filter((item) => item[0] || item[1])
    : [];
  const cardsParsed = parseCompanyTripleLines(config.companyCardsRaw, 3)
    .map((parts) => ({ icon: parts[0] || "🏅", imageUrl: "", title: parts[1] || "", desc: parts[2] || "" }));
  const cardsDefault = Array.isArray(data.cards)
    ? data.cards.map((parts) => ({ icon: parts[0] || "🏅", imageUrl: "", title: parts[1] || "", desc: parts[2] || "" }))
    : [];
  const flowParsed = parseCompanyTripleLines(config.companyFlowRaw, 2);
  const faqParsed = parseCompanyTripleLines(config.companyFaqRaw, 2);

  return {
    heroEyebrow: config.companyHeroEyebrow || data.eyebrow,
    heroTitle: config.companyHeroTitle || data.title,
    heroDesc: config.companyHeroDesc || data.desc,
    heroImage: String(config.companyHeroImage || "").trim(),
    servicesTitle: config.companyServicesTitle || "Giải pháp toàn diện cho doanh nghiệp",
    servicesDesc: config.companyServicesDesc || "Từ tư vấn chiến lược đến triển khai và vận hành, chúng tôi đồng hành từng bước.",
    processTitle: config.companyProcessTitle || "Từ yêu cầu đến kết quả chỉ 3 bước",
    processDesc: config.companyProcessDesc || "Minh bạch từng giai đoạn để bạn biết dự án đang ở đâu.",
    proofTitle: config.companyProofTitle || "Giải đáp trước khi liên hệ",
    contactTitle: config.companyContactTitle || data.contactTitle,
    contactDesc: config.companyContactDesc || data.contactText,
    cards: cardsFromArray.length ? cardsFromArray : (cardsParsed.length ? cardsParsed : cardsDefault),
    flow: flowFromArray.length ? flowFromArray : (flowParsed.length ? flowParsed : data.flow),
    faq: faqParsed.length ? faqParsed : data.faq
  };
};

const renderCompanyCardMedia = (card) => {
  if (card?.imageUrl) {
    return `<img class="pv-card-media" src="${e(card.imageUrl)}" alt="${e(card.title || "Dịch vụ")}" loading="lazy" />`;
  }
  return `<div class="pv-card-icon">${e(card?.icon || "🏅")}</div>`;
};

const renderFooter = (slug, brand, config) => {
  const phone = config.phone || "0901 234 567";
  const email = config.email || "info@domain.vn";
  const zalo = config.zalo || phone;
  const address = config.address || "123 Đường ABC, Quận 1, TP. Hồ Chí Minh";
  return `
  <footer class="pv-footer">
    <div class="pv-footer-grid">
      <div class="pv-footer-brand">
        <div class="pv-footer-logo">${e(config.siteName || brand)}</div>
        <p>${e(config.tagline || "Giải pháp chuyên nghiệp, đáng tin cậy cho doanh nghiệp của bạn.")}</p>
      </div>
      <div class="pv-footer-col">
        <h4>Dịch vụ</h4>
        <ul>
          <li><a href="#">Trang chủ</a></li>
          <li><a href="#">Giới thiệu</a></li>
          <li><a href="#">Dịch vụ</a></li>
          <li><a href="#">Liên hệ</a></li>
        </ul>
      </div>
      <div class="pv-footer-col">
        <h4>Hỗ trợ</h4>
        <ul>
          <li><a href="#">FAQ</a></li>
          <li><a href="#">Chính sách</a></li>
          <li><a href="#">Điều khoản</a></li>
        </ul>
      </div>
      <div class="pv-footer-col pv-footer-contact">
        <h4>Liên hệ</h4>
        <p>📞 <a href="tel:${e(phone)}">${e(phone)}</a></p>
        <p>💬 <a href="https://zalo.me/${e(zalo)}" target="_blank" rel="noopener">Zalo: ${e(zalo)}</a></p>
        <p>✉️ <a href="mailto:${e(email)}">${e(email)}</a></p>
        <p>📍 ${e(address)}</p>
      </div>
    </div>
    <div class="pv-footer-bottom">
      <span>© 2026 ${e(config.siteName || brand)}. All rights reserved.</span>
      <div class="pv-footer-back">
        <a href="/mau-demo/khomau-${e(slug)}">← Xem thêm mẫu ${e(PREVIEW_DATA[slug].name)}</a>
      </div>
    </div>
  </footer>
  <div class="pv-sticky-cta" id="pvStickyCta">
    <span class="pv-sticky-total-label">Tổng tạm tính:</span>
    <span class="pv-sticky-total-amount" id="pvStickyTotal">—</span>
    <a href="#buy">🛒 Thanh toán ngay</a>
  </div>
`;
};

/* ============================================================
   TEMPLATE: COMPANY
   ============================================================ */
const renderCompany = (data, config) => `
  ${renderTopbar("company", data, data.planSlug)}
  ${renderNav(config.siteName || data.brand, data.navLinks, "company", data.planSlug, config)}

  ${(() => {
    const c = getCompanyContent(data, config);
    return `

  <section class="pv-hero hero-split" id="home">
    <div class="pv-hero-content">
      <span class="pv-hero-eyebrow">${e(c.heroEyebrow)}</span>
      <h1>${c.heroTitle}</h1>
      <p class="pv-hero-desc">${e(c.heroDesc)}</p>
      <div class="pv-hero-actions">
        <a class="pv-btn pv-btn-primary" href="#buy">Mua ngay mẫu này</a>
        <a class="pv-btn pv-btn-secondary" href="#services">Xem dịch vụ</a>
      </div>
      <div class="pv-hero-stats">
        ${data.stats.map(([n, l]) => `<div class="pv-hero-stat"><strong>${e(n)}</strong><span>${e(l)}</span></div>`).join("")}
      </div>
    </div>
    <div class="pv-hero-img">${c.heroImage ? `<img src="${e(c.heroImage)}" alt="${e(config.siteName || data.brand)}" loading="lazy" />` : `<span class="img-placeholder">🏢</span>`}</div>
  </section>

  <section class="pv-section alt" id="services">
    <div class="pv-container">
      <div class="pv-section-head">
        <span class="eyebrow">Dịch vụ cốt lõi</span>
        <h2>${e(c.servicesTitle)}</h2>
        <p>${e(c.servicesDesc)}</p>
      </div>
      <div class="pv-card-grid">
        ${c.cards.map((card) => `
          <div class="pv-card">
            ${renderCompanyCardMedia(card)}
            <h3>${e(card.title)}</h3>
            <p>${e(card.desc)}</p>
          </div>
        `).join("")}
      </div>
    </div>
  </section>

  <section class="pv-section dark" id="process">
    <div class="pv-container">
      <div class="pv-section-head">
        <span class="eyebrow">Quy trình làm việc</span>
        <h2>${e(c.processTitle)}</h2>
        <p>${e(c.processDesc)}</p>
      </div>
      <div class="pv-steps">
        ${c.flow.map(([title, desc], i) => `
          <div class="pv-step">
            <div class="pv-step-num">${String(i + 1).padStart(2, "0")}</div>
            <h3>${e(title)}</h3>
            <p>${e(desc)}</p>
          </div>
        `).join("")}
      </div>
    </div>
  </section>

  <section class="pv-section" id="proof">
    <div class="pv-container">
      <div class="pv-section-head">
        <span class="eyebrow">Câu hỏi thường gặp</span>
        <h2>${e(c.proofTitle)}</h2>
      </div>
      <div class="pv-faq">
        ${c.faq.map(([q, a]) => `
          <details class="pv-faq-item">
            <summary>${e(q)}</summary>
            <p>${e(a)}</p>
          </details>
        `).join("")}
      </div>
    </div>
  </section>

  ${renderPostsSection(config)}

  <section class="pv-section alt" id="contact">
    <div class="pv-container">
      <div class="pv-section-head">
        <span class="eyebrow">Liên hệ tư vấn</span>
        <h2>${e(c.contactTitle)}</h2>
        <p>${e(c.contactDesc)}</p>
      </div>
      <div class="pv-form-wrap">
        <div class="pv-form-row">
          <div class="pv-form-group"><label>Họ và tên</label><input type="text" placeholder="Nguyễn Văn A" /></div>
          <div class="pv-form-group"><label>Số điện thoại</label><input type="tel" placeholder="0901 234 567" /></div>
        </div>
        <div class="pv-form-group"><label>Email</label><input type="email" placeholder="email@domain.vn" /></div>
        <div class="pv-form-group"><label>Nhu cầu cụ thể</label><textarea placeholder="Mô tả ngắn về yêu cầu của bạn..."></textarea></div>
        <button class="pv-form-submit">Gửi yêu cầu tư vấn →</button>
      </div>
    </div>
  </section>

  ${renderPurchaseSection(config, "company", data)}
  ${renderFooter("company", data.brand, config)}
`;
  })()}
`;

const renderCompanyV2 = (data, config) => {
  const c = getCompanyContent(data, config);
  return `
  ${renderTopbar("company", data, data.planSlug)}
  ${renderNav(config.siteName || data.brand, data.navLinks, "company", data.planSlug, config)}

  <section class="pv-hero" id="home">
    <span class="pv-hero-eyebrow">Mau 2 · Service-first</span>
    <h1>Bo cuc <em>tap trung dich vu</em> de khach hieu nhanh nang luc</h1>
    <p class="pv-hero-desc">Mau nay dua nhom dich vu len som, de khach B2B nhin thay ngay pham vi va cach lam.</p>
    <div class="pv-hero-actions">
      <a class="pv-btn pv-btn-primary" href="#services">Xem dịch vụ trước</a>
      <a class="pv-btn pv-btn-secondary" href="#buy">Mua mẫu này</a>
    </div>
  </section>

  <section class="pv-section alt" id="services">
    <div class="pv-container">
      <div class="pv-section-head">
        <span class="eyebrow">Dich vu theo nhom</span>
        <h2>Khach xem la biet ban lam duoc gi</h2>
      </div>
      <div class="pv-card-grid">
        ${c.cards.slice(0, 4).map((card) => `
          <div class="pv-card">
            ${renderCompanyCardMedia(card)}
            <h3>${e(card.title)}</h3>
            <p>${e(card.desc)}</p>
          </div>
        `).join("")}
      </div>
    </div>
  </section>

  <section class="pv-section" id="proof">
    <div class="pv-container">
      <div class="pv-section-head">
        <span class="eyebrow">So lieu & bang chung</span>
        <h2>Day nhanh niem tin truoc khi de lai lead</h2>
      </div>
      <div class="pv-stats-row">
        ${data.stats.map(([n, l]) => `<div class="pv-stat-item"><strong>${e(n)}</strong><span>${e(l)}</span></div>`).join("")}
      </div>
    </div>
  </section>

  <section class="pv-section dark" id="process">
    <div class="pv-container">
      <div class="pv-section-head">
        <span class="eyebrow">Quy trinh</span>
        <h2>Minh bach tung buoc trien khai</h2>
      </div>
      <div class="pv-steps">
        ${c.flow.map(([title, desc], i) => `
          <div class="pv-step">
            <div class="pv-step-num">${String(i + 1).padStart(2, "0")}</div>
            <h3>${e(title)}</h3>
            <p>${e(desc)}</p>
          </div>
        `).join("")}
      </div>
    </div>
  </section>

  <section class="pv-section alt" id="contact">
    <div class="pv-container">
      <div class="pv-section-head">
        <span class="eyebrow">Lien he</span>
        <h2>${e(c.contactTitle)}</h2>
        <p>${e(c.contactDesc)}</p>
      </div>
      <div class="pv-faq">
        ${c.faq.slice(0, 2).map(([q, a]) => `
          <details class="pv-faq-item" open>
            <summary>${e(q)}</summary>
            <p>${e(a)}</p>
          </details>
        `).join("")}
      </div>
    </div>
  </section>

  ${renderPurchaseSection(config, "company", data)}
  ${renderFooter("company", data.brand, config)}
`;
};

const renderCompanyV3 = (data, config) => {
  const c = getCompanyContent(data, config);
  return `
  ${renderTopbar("company", data, data.planSlug)}
  ${renderNav(config.siteName || data.brand, data.navLinks, "company", data.planSlug, config)}

  <section class="pv-hero hero-split" id="home">
    <div class="pv-hero-img">${c.heroImage ? `<img src="${e(c.heroImage)}" alt="${e(config.siteName || data.brand)}" loading="lazy" />` : `<span class="img-placeholder">📈</span>`}</div>
    <div class="pv-hero-content">
      <span class="pv-hero-eyebrow">Mau 3 · Brand + case style</span>
      <h1>Bo cuc <em>thuong hieu</em> cho doanh nghiep can profile ro</h1>
      <p class="pv-hero-desc">Sap xep theo kieu profile: mo dau bang ket qua, sau do moi den dich vu va quy trinh.</p>
      <div class="pv-hero-actions">
        <a class="pv-btn pv-btn-primary" href="#proof">Xem kết quả</a>
        <a class="pv-btn pv-btn-secondary" href="#buy">Mua mẫu này</a>
      </div>
    </div>
  </section>

  <section class="pv-section dark" id="proof">
    <div class="pv-container">
      <div class="pv-section-head">
        <span class="eyebrow">Nang luc noi bat</span>
        <h2>Ket qua duoc dat len truoc</h2>
      </div>
      <div class="pv-stats-row">
        ${data.stats.map(([n, l]) => `<div class="pv-stat-item"><strong>${e(n)}</strong><span>${e(l)}</span></div>`).join("")}
      </div>
    </div>
  </section>

  <section class="pv-section" id="services">
    <div class="pv-container">
      <div class="pv-section-head">
        <span class="eyebrow">He sinh thai dich vu</span>
        <h2>Dinh vi theo nhom dich vu chuyen sau</h2>
      </div>
      <div class="pv-card-grid">
        ${c.cards.map((card) => `
          <div class="pv-card">
            ${renderCompanyCardMedia(card)}
            <h3>${e(card.title)}</h3>
            <p>${e(card.desc)}</p>
          </div>
        `).join("")}
      </div>
    </div>
  </section>

  <section class="pv-section alt" id="process">
    <div class="pv-container">
      <div class="pv-section-head">
        <span class="eyebrow">Cach lam viec</span>
        <h2>Quy trinh 3 lop cho du an doanh nghiep</h2>
      </div>
      <div class="pv-steps">
        ${c.flow.map(([title, desc], i) => `
          <div class="pv-step">
            <div class="pv-step-num">${String(i + 1).padStart(2, "0")}</div>
            <h3>${e(title)}</h3>
            <p>${e(desc)}</p>
          </div>
        `).join("")}
      </div>
    </div>
  </section>

  <section class="pv-section" id="contact">
    <div class="pv-container">
      <div class="pv-section-head">
        <span class="eyebrow">FAQ ngan gon</span>
        <h2>Tra loi nhanh truoc khi chot lich tu van</h2>
      </div>
      <div class="pv-faq">
        ${c.faq.map(([q, a]) => `
          <details class="pv-faq-item">
            <summary>${e(q)}</summary>
            <p>${e(a)}</p>
          </details>
        `).join("")}
      </div>
    </div>
  </section>

  ${renderPurchaseSection(config, "company", data)}
  ${renderFooter("company", data.brand, config)}
`;
};

/* ============================================================
   TEMPLATE: SHOP
   ============================================================ */
/* helper: split textarea raw text into non-empty lines */
const parseLines = (raw) => String(raw || "").split("\n").map((s) => s.trim()).filter(Boolean);

/* helper: get features array from item (raw textarea or pre-parsed features[]) */
const parseFeaturesRaw = (item) =>
  Array.isArray(item.features) && item.features.length ? item.features : parseLines(item.featuresRaw);

const getShopContent = (data, config) => ({
  heroTag: e((config.shopHeroTag || "").trim() || "🔥 MEGA SALE THÁNG 5"),
  heroHeadline: config.shopHeroHeadline ? e(config.shopHeroHeadline) : "Giảm đến 40%<br>toàn bộ sản phẩm",
  heroDesc: e((config.shopHeroDesc || "").trim() || "Miễn phí giao hàng từ 299.000đ. Hoàn tiền 7 ngày không điều kiện."),
  heroOff: e((config.shopHeroOff || "").trim() || "-40%"),
  heroOffEnds: e((config.shopHeroOffEnds || "").trim() || "Kết thúc sau 2 ngày"),
  categories: parseLines(config.shopCategoriesRaw).length ? parseLines(config.shopCategoriesRaw) : data.categories,
  products: Array.isArray(config.shopProducts) && config.shopProducts.length ? config.shopProducts : data.products,
  reviews: Array.isArray(config.shopReviews) && config.shopReviews.length ? config.shopReviews : data.reviews,
  contactTitle: e((config.shopContactTitle || "").trim() || data.contactTitle),
  contactDesc: e((config.shopContactDesc || "").trim() || data.contactText),
});

const getSalonContent = (data, config) => ({
  heroEyebrow: e((config.salonHeroEyebrow || "").trim() || data.eyebrow),
  heroTitle: e((config.salonHeroTitle || "").trim() || data.title),
  heroDesc: e((config.salonHeroDesc || "").trim() || data.desc),
  heroImage: (config.salonHeroImage || "").trim(),
  services: Array.isArray(config.salonServices) && config.salonServices.length
    ? config.salonServices.map((s) => ({ icon: s.icon || "✂️", imageUrl: s.imageUrl || "", name: s.name || "", desc: s.desc || "", price: s.price || "" }))
    : data.services,
  gallery: Array.isArray(config.salonGallery) && config.salonGallery.length
    ? config.salonGallery.map((g) => ({ icon: g.icon || "✨", imageUrl: g.imageUrl || "", label: g.label || "" }))
    : data.gallery,
  pricing: Array.isArray(config.salonPricing) && config.salonPricing.length
    ? config.salonPricing.map((p) => ({ name: p.name || "", price: p.price || "", features: parseFeaturesRaw(p), featured: !!p.featured }))
    : data.pricing,
  reviews: Array.isArray(config.salonReviews) && config.salonReviews.length ? config.salonReviews : data.reviews,
});

const getIndustryContent = (data, config) => ({
  heroEyebrow: e((config.industryHeroEyebrow || "").trim() || data.eyebrow),
  heroTitle: e((config.industryHeroTitle || "").trim() || data.title),
  heroDesc: e((config.industryHeroDesc || "").trim() || data.desc),
  heroImage: (config.industryHeroImage || "").trim(),
  cards: Array.isArray(config.industryCards) && config.industryCards.length
    ? config.industryCards.map((c) => ({ icon: c.icon || "⚙️", imageUrl: c.imageUrl || "", title: c.title || "", desc: c.desc || "" }))
    : data.cards.map(([icon, title, desc]) => ({ icon, imageUrl: "", title, desc })),
  flow: Array.isArray(config.industryFlow) && config.industryFlow.length
    ? config.industryFlow.map((f) => [f.title || "", f.desc || ""])
    : data.flow,
  partners: parseLines(config.industryPartnersRaw).length ? parseLines(config.industryPartnersRaw) : data.partners,
});

const getLandingContent = (data, config) => ({
  heroEyebrow: e((config.landingHeroEyebrow || "").trim() || data.eyebrow),
  heroTitle: e((config.landingHeroTitle || "").trim() || data.title),
  heroDesc: e((config.landingHeroDesc || "").trim() || data.desc),
  benefits: Array.isArray(config.landingBenefits) && config.landingBenefits.length
    ? config.landingBenefits.map((b) => ({ icon: b.icon || "🎯", imageUrl: b.imageUrl || "", title: b.title || "", desc: b.desc || "" }))
    : data.benefits.map(([icon, title, desc]) => ({ icon, imageUrl: "", title, desc })),
  pricing: Array.isArray(config.landingPricing) && config.landingPricing.length
    ? config.landingPricing.map((p) => ({ name: p.name || "", price: p.price || "", period: p.period || "trọn đời", features: parseFeaturesRaw(p), featured: !!p.featured }))
    : data.pricing,
  faq: Array.isArray(config.landingFaq) && config.landingFaq.length
    ? config.landingFaq.map((f) => [f.q || "", f.a || ""])
    : data.faq,
});

const renderShop = (data, config) => {
  const c = getShopContent(data, config);
  return `
  ${renderTopbar("shop", data, data.planSlug)}
  ${renderNav(config.siteName || data.brand, data.navLinks, "shop", data.planSlug, config)}

  <section class="pv-hero" id="home" style="background:var(--c-hero-bg);padding:40px 24px;">
    <div class="pv-container">
      <div class="pv-sale-banner">
        <div>
          <span class="pv-sale-tag">${c.heroTag}</span>
          <h2>${c.heroHeadline}</h2>
          <p>${c.heroDesc}</p>
        </div>
        <div class="pv-sale-price">
          <div class="off">${c.heroOff}</div>
          <div class="ends">${c.heroOffEnds}</div>
        </div>
      </div>
      <div class="pv-categories">
        ${c.categories.map((cat, i) => `<button class="pv-cat-chip${i === 0 ? " active" : ""}">${e(cat)}</button>`).join("")}
      </div>
    </div>
  </section>

  <section class="pv-section alt" id="products">
    <div class="pv-container">
      <div class="pv-section-head">
        <span class="eyebrow">Sản phẩm nổi bật</span>
        <h2>Bán chạy tuần này</h2>
        <p>Hàng chính hãng, đảm bảo chất lượng. Đổi trả miễn phí trong 30 ngày.</p>
      </div>
      <div class="pv-product-grid">
        ${c.products.map((p) => `
          <div class="pv-product-card">
            <div class="pv-product-img">
              ${p.badge ? `<span class="pv-product-badge">${e(p.badge)}</span>` : ""}
              ${p.imageUrl ? `<img src="${e(p.imageUrl)}" alt="${e(p.name)}" style="width:100%;height:100%;object-fit:cover;border-radius:inherit" loading="lazy" />` : `<span style="font-size:2.5rem">${e(p.icon)}</span>`}
            </div>
            <div class="pv-product-body">
              <div class="pv-product-name">${e(p.name)}</div>
              <div>
                <span class="pv-product-price">${e(p.price)}</span>
                ${p.old ? `<span class="pv-product-old">${e(p.old)}</span>` : ""}
              </div>
              <button class="pv-product-btn">Mua ngay</button>
            </div>
          </div>
        `).join("")}
      </div>
    </div>
  </section>

  <section class="pv-section dark" id="benefits">
    <div class="pv-container">
      <div class="pv-section-head">
        <span class="eyebrow">Tại sao chọn chúng tôi</span>
        <h2>Mua sắm an tâm, đổi trả dễ dàng</h2>
      </div>
      <div class="pv-card-grid">
        <div class="pv-card"><div class="pv-card-icon">🚚</div><h3>Giao hàng nhanh</h3><p>Nội thành 2–4 giờ. Toàn quốc 1–3 ngày qua J&T, GHTK, Viettel Post.</p></div>
        <div class="pv-card"><div class="pv-card-icon">🔄</div><h3>Đổi trả 30 ngày</h3><p>Không cần lý do. Miễn phí ship đổi lần đầu cho mọi đơn hàng.</p></div>
        <div class="pv-card"><div class="pv-card-icon">✅</div><h3>Hàng chính hãng</h3><p>Cam kết 100% chính hãng. Tem bảo hành và giấy chứng nhận đi kèm.</p></div>
      </div>
    </div>
  </section>

  <section class="pv-section" id="proof">
    <div class="pv-container">
      <div class="pv-section-head">
        <span class="eyebrow">Khách hàng nói gì</span>
        <h2>Đánh giá thực từ người mua</h2>
      </div>
      <div class="pv-testimonials">
        ${c.reviews.map((r) => `
          <div class="pv-testimonial">
            <div class="pv-testimonial-stars">★★★★★</div>
            <p>${e(r.text)}</p>
            <div class="pv-testimonial-author">
              <div class="pv-author-avatar">${r.name.charAt(0)}</div>
              <div><div class="pv-author-name">${e(r.name)}</div><div class="pv-author-sub">${e(r.sub)}</div></div>
            </div>
          </div>
        `).join("")}
      </div>
    </div>
  </section>

  <section class="pv-contact-section" id="contact">
    <h2>${c.contactTitle}</h2>
    <p>${c.contactDesc}</p>
  </section>

  ${renderPostsSection(config)}

  ${renderPurchaseSection(config, "shop", data)}
  ${renderFooter("shop", data.brand, config)}
`; };

/* ============================================================
   TEMPLATE: SALON
   ============================================================ */
const renderSalon = (data, config) => {
  const c = getSalonContent(data, config);
  return `
  ${renderTopbar("salon", data, data.planSlug)}
  ${renderNav(config.siteName || data.brand, data.navLinks, "salon", data.planSlug, config)}

  <section class="pv-hero" id="home" ${c.heroImage ? `style="background-image:url('${e(c.heroImage)}');background-size:cover;background-position:center"` : ""}>
    <span class="pv-hero-eyebrow">${c.heroEyebrow}</span>
    <h1>${c.heroTitle}</h1>
    <p class="pv-hero-desc">${c.heroDesc}</p>
    <div class="pv-hero-actions">
      <a class="pv-btn pv-btn-primary" href="#">Đặt lịch ngay</a>
      <a class="pv-btn pv-btn-secondary" href="#">Xem bảng giá</a>
    </div>
  </section>

  <section class="pv-section alt" id="services">
    <div class="pv-container">
      <div class="pv-section-head">
        <span class="eyebrow">Dịch vụ nổi bật</span>
        <h2>Trải nghiệm chăm sóc chuyên nghiệp</h2>
        <p>Đội ngũ kỹ thuật viên được đào tạo chuyên sâu, sử dụng sản phẩm nhập khẩu cao cấp.</p>
      </div>
      <div class="pv-card-grid">
        ${c.services.map((s) => `
          <div class="pv-card">
            ${s.imageUrl ? `<img class="pv-card-media" src="${e(s.imageUrl)}" alt="${e(s.name)}" loading="lazy" />` : `<div class="pv-card-icon">${e(s.icon)}</div>`}
            <h3>${e(s.name)} <small style="color:var(--c-primary);font-size:.8rem">từ ${e(s.price)}</small></h3>
            <p>${e(s.desc)}</p>
          </div>
        `).join("")}
      </div>
    </div>
  </section>

  <section class="pv-section" id="gallery">
    <div class="pv-container">
      <div class="pv-section-head">
        <span class="eyebrow">Gallery kết quả</span>
        <h2>Tác phẩm từ đôi bàn tay nghệ nhân</h2>
        <p>Mỗi ghế là một trải nghiệm cá nhân hoá — không copy, không giống nhau.</p>
      </div>
      <div class="pv-gallery">
        ${c.gallery.map((g) => `
          <div class="pv-gallery-item">
            ${g.imageUrl ? `<img src="${e(g.imageUrl)}" alt="${e(g.label)}" loading="lazy" style="width:100%;height:100%;object-fit:cover" />` : `<span>${e(g.icon)}</span>`}
            <span class="label">${e(g.label)}</span>
          </div>
        `).join("")}
      </div>
    </div>
  </section>

  <section class="pv-section alt" id="pricing">
    <div class="pv-container">
      <div class="pv-section-head">
        <span class="eyebrow">Bảng giá dịch vụ</span>
        <h2>Gói chăm sóc phù hợp mọi nhu cầu</h2>
      </div>
      <div class="pv-pricing-grid">
        ${c.pricing.map((p) => `
          <div class="pv-pricing-card${p.featured ? " featured" : ""}">
            ${p.featured ? '<span class="pv-pricing-badge">Khuyên dùng</span>' : ""}
            <div class="pv-pricing-name">${e(p.name)}</div>
            <div class="pv-pricing-price">${e(p.price)}<span> / lần</span></div>
            <ul class="pv-pricing-features">
              ${p.features.map((f) => `<li>${e(f)}</li>`).join("")}
            </ul>
            <a class="pv-pricing-cta" href="#">Đặt lịch gói này</a>
          </div>
        `).join("")}
      </div>
    </div>
  </section>

  <section class="pv-section dark" id="proof">
    <div class="pv-container">
      <div class="pv-section-head">
        <span class="eyebrow">Khách hàng tin tưởng</span>
        <h2>Phản hồi từ khách đã trải nghiệm</h2>
      </div>
      <div class="pv-testimonials">
        ${c.reviews.map((r) => `
          <div class="pv-testimonial">
            <div class="pv-testimonial-stars">★★★★★</div>
            <p>${e(r.text)}</p>
            <div class="pv-testimonial-author">
              <div class="pv-author-avatar">${r.name.charAt(0)}</div>
              <div><div class="pv-author-name">${e(r.name)}</div><div class="pv-author-sub">${e(r.sub)}</div></div>
            </div>
          </div>
        `).join("")}
      </div>
    </div>
  </section>

  <section class="pv-section" id="contact">
    <div class="pv-container">
      <div class="pv-section-head">
        <span class="eyebrow">Đặt lịch</span>
        <h2>Đặt lịch chăm sóc hôm nay</h2>
      </div>
      <div class="pv-booking-grid">
        <div class="pv-booking-info">
          <h3>Tại sao đặt lịch trước?</h3>
          <p>Đảm bảo có chỗ với kỹ thuật viên bạn ưa thích, tránh chờ đợi và nhận ưu đãi đặt trước.</p>
          <ul class="pv-booking-points">
            <li>Không chờ đợi, vào ghế đúng giờ</li>
            <li>Chọn kỹ thuật viên theo phong cách</li>
            <li>Nhắc lịch tự động qua Zalo</li>
            <li>Tích điểm khách thường xuyên</li>
          </ul>
        </div>
        <div class="pv-form-wrap" style="box-shadow:none;border:none;padding:0">
          <div class="pv-form-row">
            <div class="pv-form-group"><label>Họ tên</label><input type="text" placeholder="Tên của bạn" /></div>
            <div class="pv-form-group"><label>Số điện thoại</label><input type="tel" placeholder="0901 234 567" /></div>
          </div>
          <div class="pv-form-group">
            <label>Dịch vụ</label>
            <select>
              ${c.services.map((s) => `<option>${s.name}</option>`).join("")}
            </select>
          </div>
          <div class="pv-form-row">
            <div class="pv-form-group"><label>Ngày</label><input type="date" /></div>
            <div class="pv-form-group"><label>Giờ</label><input type="time" value="09:00" /></div>
          </div>
          <button class="pv-form-submit">Đặt lịch ngay →</button>
        </div>
      </div>
    </div>
  </section>

  ${renderPostsSection(config)}

  ${renderPurchaseSection(config, "salon", data)}
  ${renderFooter("salon", data.brand, config)}
`; };

/* ============================================================
   TEMPLATE: INDUSTRY
   ============================================================ */
const renderIndustry = (data, config) => {
  const c = getIndustryContent(data, config);
  return `
  ${renderTopbar("industry", data, data.planSlug)}
  ${renderNav(config.siteName || data.brand, data.navLinks, "industry", data.planSlug, config)}

  <section class="pv-hero hero-split" id="home">
    <div class="pv-hero-content">
      <span class="pv-hero-eyebrow">${c.heroEyebrow}</span>
      <h1>${c.heroTitle}</h1>
      <p class="pv-hero-desc">${c.heroDesc}</p>
      <div class="pv-hero-actions">
        <a class="pv-btn pv-btn-primary" href="#">Yêu cầu báo giá</a>
        <a class="pv-btn pv-btn-secondary" href="#">Xem danh mục</a>
      </div>
      <div class="pv-hero-stats">
        ${data.stats.map(([n, l]) => `<div class="pv-hero-stat"><strong>${e(n)}</strong><span>${e(l)}</span></div>`).join("")}
      </div>
    </div>
    <div class="pv-hero-img">${c.heroImage ? `<img src="${e(c.heroImage)}" alt="${c.heroTitle}" loading="lazy" style="width:100%;height:100%;object-fit:cover;border-radius:12px" />` : `<span class="img-placeholder">⚙️</span>`}</div>
  </section>

  <section class="pv-section alt" id="products">
    <div class="pv-container">
      <div class="pv-section-head">
        <span class="eyebrow">Danh mục sản phẩm</span>
        <h2>Thiết bị kỹ thuật chính hãng</h2>
        <p>Phân phối trực tiếp từ hãng. Có kho sẵn, giao trong 24–72 giờ toàn quốc.</p>
      </div>
      <div class="pv-card-grid">
        ${c.cards.map((card) => `
          <div class="pv-card">
            ${card.imageUrl ? `<img class="pv-card-media" src="${e(card.imageUrl)}" alt="${e(card.title)}" loading="lazy" />` : `<div class="pv-card-icon">${e(card.icon)}</div>`}
            <h3>${e(card.title)}</h3>
            <p>${e(card.desc)}</p>
          </div>
        `).join("")}
      </div>
    </div>
  </section>

  <section class="pv-section" id="specs">
    <div class="pv-container">
      <div class="pv-section-head">
        <span class="eyebrow">Thông số kỹ thuật</span>
        <h2>Bảng so sánh thiết bị chính</h2>
      </div>
      <div style="overflow-x:auto">
        <table class="pv-specs-table">
          <thead>
            <tr>
              <th>Thông số</th>
              ${data.specs[0].slice(1).map((h) => `<th>${e(h)}</th>`).join("")}
            </tr>
          </thead>
          <tbody>
            ${data.specs.slice(1).map(([label, ...vals]) => `
              <tr>
                <td>${e(label)}</td>
                ${vals.map((v) => `<td>${e(v)}</td>`).join("")}
              </tr>
            `).join("")}
          </tbody>
        </table>
      </div>
    </div>
  </section>

  <section class="pv-section dark" id="proof">
    <div class="pv-container">
      <div class="pv-section-head">
        <span class="eyebrow">Đối tác thương hiệu</span>
        <h2>Phân phối chính thức từ các thương hiệu hàng đầu</h2>
      </div>
      <div class="pv-partners">
        ${c.partners.map((p) => `<div class="pv-partner-logo">${e(p)}</div>`).join("")}
      </div>
    </div>
  </section>

  <section class="pv-section alt" id="process">
    <div class="pv-container">
      <div class="pv-section-head">
        <span class="eyebrow">Quy trình</span>
        <h2>Từ yêu cầu đến lắp đặt</h2>
      </div>
      <div class="pv-steps">
        ${c.flow.map(([title, desc], i) => `
          <div class="pv-step">
            <div class="pv-step-num">${String(i + 1).padStart(2, "0")}</div>
            <h3>${e(title)}</h3>
            <p>${e(desc)}</p>
          </div>
        `).join("")}
      </div>
    </div>
  </section>

  <section class="pv-section" id="contact">
    <div class="pv-container">
      <div class="pv-section-head">
        <span class="eyebrow">Yêu cầu báo giá</span>
        <h2>${e(data.contactTitle)}</h2>
        <p>${e(data.contactText)}</p>
      </div>
      <div class="pv-form-wrap">
        <div class="pv-form-row">
          <div class="pv-form-group"><label>Họ tên</label><input type="text" placeholder="Nguyễn Văn A" /></div>
          <div class="pv-form-group"><label>Điện thoại</label><input type="tel" placeholder="0901 234 567" /></div>
        </div>
        <div class="pv-form-group"><label>Công ty</label><input type="text" placeholder="Tên công ty / dự án" /></div>
        <div class="pv-form-group"><label>Thiết bị cần báo giá</label><textarea placeholder="Mô tả thiết bị, số lượng, thông số kỹ thuật..."></textarea></div>
        <button class="pv-form-submit">Gửi yêu cầu báo giá →</button>
      </div>
    </div>
  </section>

  ${renderPostsSection(config)}

  ${renderPurchaseSection(config, "industry", data)}
  ${renderFooter("industry", data.brand, config)}
`; };

/* ============================================================
   TEMPLATE: LANDING
   ============================================================ */
const renderLanding = (data, config) => {
  const c = getLandingContent(data, config);
  return `
  ${renderTopbar("landing", data, data.planSlug)}
  ${renderNav(config.siteName || data.brand, data.navLinks, "landing", data.planSlug, config)}

  <section class="pv-hero" id="home">
    <span class="pv-hero-eyebrow">${c.heroEyebrow}</span>
    <h1>${c.heroTitle}</h1>
    <p class="pv-hero-desc">${c.heroDesc}</p>
    <div class="pv-hero-actions">
      <a class="pv-btn pv-btn-primary" href="#">Đăng ký học thử miễn phí</a>
      <a class="pv-btn pv-btn-secondary" href="#">Xem chương trình học</a>
    </div>
    <div class="pv-hero-stats" style="justify-content:center;margin-top:32px">
      ${data.stats.map(([n, l]) => `<div class="pv-hero-stat"><strong>${e(n)}</strong><span>${e(l)}</span></div>`).join("")}
    </div>
  </section>

  <section class="pv-section alt" id="benefits">
    <div class="pv-container">
      <div class="pv-section-head">
        <span class="eyebrow">Lợi ích nổi bật</span>
        <h2>Bạn nhận được gì sau khoá học?</h2>
        <p>Thiết kế theo outcome thực tế — học xong biết làm việc ngay, không lý thuyết suông.</p>
      </div>
      <div class="pv-card-grid">
        ${c.benefits.map((b) => `
          <div class="pv-card">
            ${b.imageUrl ? `<img class="pv-card-media" src="${e(b.imageUrl)}" alt="${e(b.title)}" loading="lazy" />` : `<div class="pv-card-icon">${e(b.icon)}</div>`}
            <h3>${e(b.title)}</h3>
            <p>${e(b.desc)}</p>
          </div>
        `).join("")}
      </div>
    </div>
  </section>

  <section class="pv-section" id="proof">
    <div class="pv-container">
      <div class="pv-section-head">
        <span class="eyebrow">Học viên nói gì</span>
        <h2>Kết quả thực tế từ người học</h2>
      </div>
      <div class="pv-testimonials">
        ${data.reviews.map((r) => `
          <div class="pv-testimonial">
            <div class="pv-testimonial-stars">★★★★★</div>
            <p>${e(r.text)}</p>
            <div class="pv-testimonial-author">
              <div class="pv-author-avatar">${r.name.charAt(0)}</div>
              <div><div class="pv-author-name">${e(r.name)}</div><div class="pv-author-sub">${e(r.sub)}</div></div>
            </div>
          </div>
        `).join("")}
      </div>
    </div>
  </section>

  <section class="pv-section alt" id="pricing">
    <div class="pv-container">
      <div class="pv-section-head">
        <span class="eyebrow">Bảng giá</span>
        <h2>Chọn gói phù hợp với bạn</h2>
        <p>Thanh toán một lần, học mãi mãi. Không thu phí ẩn.</p>
      </div>
      <div class="pv-pricing-grid">
        ${c.pricing.map((p) => `
          <div class="pv-pricing-card${p.featured ? " featured" : ""}">
            ${p.featured ? '<span class="pv-pricing-badge">Phổ biến nhất</span>' : ""}
            <div class="pv-pricing-name">${e(p.name)}</div>
            <div class="pv-pricing-price">${e(p.price)}<span> / ${e(p.period)}</span></div>
            <ul class="pv-pricing-features">
              ${p.features.map((f) => `<li>${e(f)}</li>`).join("")}
            </ul>
            <a class="pv-pricing-cta" href="#buy">Mua ngay mẫu này</a>
          </div>
        `).join("")}
      </div>
    </div>
  </section>

  <section class="pv-section dark">
    <div class="pv-container">
      <div class="pv-section-head">
        <span class="eyebrow">FAQ</span>
        <h2>Giải đáp trước khi đăng ký</h2>
      </div>
      <div class="pv-faq" style="color:#fff">
        ${c.faq.map(([q, a]) => `
          <details class="pv-faq-item" style="border-color:rgba(255,255,255,.15)">
            <summary style="color:#fff">${e(q)}</summary>
            <p style="color:rgba(255,255,255,.65)">${e(a)}</p>
          </details>
        `).join("")}
      </div>
    </div>
  </section>

  <section class="pv-section" id="contact">
    <div class="pv-container">
      <div class="pv-section-head">
        <span class="eyebrow">Đăng ký</span>
        <h2>Bắt đầu hôm nay, kết quả tuần tới</h2>
        <p>Điền thông tin để nhận tư vấn khoá học và ưu đãi đặc biệt cho người đăng ký sớm.</p>
      </div>
      <div class="pv-form-wrap">
        <div class="pv-form-row">
          <div class="pv-form-group"><label>Họ tên</label><input type="text" placeholder="Nguyễn Văn A" /></div>
          <div class="pv-form-group"><label>Số điện thoại</label><input type="tel" placeholder="0901 234 567" /></div>
        </div>
        <div class="pv-form-group"><label>Email</label><input type="email" placeholder="email@domain.vn" /></div>
        <div class="pv-form-group">
          <label>Gói quan tâm</label>
          <select>
            ${c.pricing.map((p) => `<option>${p.name} — ${p.price}</option>`).join("")}
          </select>
        </div>
        <button class="pv-form-submit">Đăng ký nhận tư vấn →</button>
      </div>
    </div>
  </section>

  ${renderPostsSection(config)}

  ${renderPurchaseSection(config, "landing", data)}
  ${renderFooter("landing", data.brand, config)}
`; };

/* ============================================================
   MAIN
   ============================================================ */
const RENDERERS = {
  company: renderCompany,
  shop: renderShop,
  salon: renderSalon,
  industry: renderIndustry,
  landing: renderLanding
};

const COMPANY_RENDERERS = {
  1: renderCompany,
  2: renderCompanyV2,
  3: renderCompanyV3
};

const initPurchaseInteractions = () => {
  const stickyCta = document.getElementById("pvStickyCta");
  const stickyTotal = document.getElementById("pvStickyTotal");

  const syncStickyTotal = (text) => {
    if (stickyTotal) stickyTotal.textContent = text;
  };

  // show sticky bar only when buy section is out of viewport (user scrolled past it)
  const buySection = document.getElementById("buy");
  if (buySection && stickyCta) {
    const obs = new IntersectionObserver(
      ([entry]) => {
        stickyCta.classList.toggle("is-visible", !entry.isIntersecting);
      },
      { rootMargin: "0px 0px -60px 0px" }
    );
    obs.observe(buySection);
  }

  document.querySelectorAll(".js-order-box").forEach((box) => {
    const templateSlug = box.dataset.templateSlug || "company";
    const base = Number(box.dataset.base || 0);
    const hostPrice = Number(box.dataset.hostPrice || 0);
    const domainPrice = Number(box.dataset.domainPrice || 0);

    const hostEnable = box.querySelector(".js-host-enable");
    const domainEnable = box.querySelector(".js-domain-enable");
    const hostYears = box.querySelector(".js-host-years");
    const domainYears = box.querySelector(".js-domain-years");
    const domainSuffix = box.querySelector(".js-domain-suffix");
    const domainName = box.querySelector(".js-domain-name");
    const checkoutBtn = box.querySelector(".js-order-checkout");
    const noteEl = box.querySelector(".js-order-note");
    const totalEl = box.querySelector(".js-order-total");

    const getState = () => {
      const useHost = hostEnable ? hostEnable.checked : false;
      const useDomain = domainEnable ? domainEnable.checked : false;
      const hostY = useHost && hostYears ? Number(hostYears.value || 1) : 0;
      const domainY = useDomain && domainYears ? Number(domainYears.value || 1) : 0;
      const total = base + (useHost ? hostPrice * hostY : 0) + (useDomain ? domainPrice * domainY : 0);
      return { useHost, useDomain, hostY, domainY, total };
    };

    const calc = () => {
      const state = getState();
      const formatted = formatVnd(state.total);
      if (totalEl) totalEl.textContent = formatted;
      syncStickyTotal(formatted);
      return state;
    };

    const setNote = (text, error = false) => {
      if (!noteEl) return;
      noteEl.textContent = text;
      noteEl.style.color = error ? "#b42318" : "";
    };

    if (checkoutBtn) {
      checkoutBtn.addEventListener("click", async () => {
        const state = calc();
        const payload = {
          templateSlug,
          basePrice: base,
          includeDomain: state.useDomain,
          domainPrice,
          domainYears: state.domainY,
          domainSuffix: state.useDomain ? (domainSuffix?.value || ".com") : "",
          domainName: state.useDomain ? String(domainName?.value || "").trim() : "",
          includeHosting: state.useHost,
          hostingPrice: hostPrice,
          hostingYears: state.hostY,
          amount: state.total
        };

        const originalText = checkoutBtn.textContent;
        checkoutBtn.disabled = true;
        checkoutBtn.textContent = "Dang tao don...";
        setNote("Dang tao don va chuyen sang trang thanh toan...");

        try {
          const response = await fetch("/api/web-demo/orders/create-checkout", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(payload)
          });
          const result = await response.json().catch(() => ({}));

          if (!response.ok || !result?.checkoutUrl) {
            const message = result?.message || "Khong the tao don hang luc nay. Vui long thu lai.";
            throw new Error(message);
          }

          setNote("Da tao don hang. Dang chuyen qua trang thanh toan...");
          window.location.href = result.checkoutUrl;
        } catch (error) {
          setNote(error?.message || "Co loi xay ra khi tao don. Vui long thu lai.", true);
          checkoutBtn.disabled = false;
          checkoutBtn.textContent = originalText || "Thanh toan tu dong";
        }
      });
    }

    [hostEnable, domainEnable, hostYears, domainYears, domainSuffix, domainName].forEach((el) => {
      if (el) el.addEventListener("input", calc);
      if (el) el.addEventListener("change", calc);
    });

    calc();
  });
};

const initSupportPopup = (config) => {
  if (document.getElementById("pvSupportDock")) {
    return;
  }

  const wrapper = document.createElement("div");
  wrapper.innerHTML = renderSupportPopup(config);
  const dock = wrapper.firstElementChild;
  if (!dock) {
    return;
  }
  document.body.appendChild(dock);

  const toggle = document.getElementById("pvSupportToggle");
  const STORAGE_KEY = "web_preview_support_collapsed";
  const sync = (collapsed) => {
    dock.classList.toggle("is-collapsed", collapsed);
    if (toggle) {
      toggle.setAttribute("aria-expanded", String(!collapsed));
      const icon = toggle.querySelector(".pv-support-toggle-icon");
      if (icon) {
        icon.textContent = collapsed ? "+" : "-";
      }
    }
  };

  const collapsed = localStorage.getItem(STORAGE_KEY) === "1";
  sync(collapsed);

  if (toggle) {
    toggle.addEventListener("click", () => {
      const nextCollapsed = !dock.classList.contains("is-collapsed");
      sync(nextCollapsed);
      localStorage.setItem(STORAGE_KEY, nextCollapsed ? "1" : "0");
    });
  }
};

/* AUTO-DETECT TEMPLATE FROM HTML ATTRIBUTES (for standalone folder deployment) */
const htmlEl = document.documentElement;
const templateFromAttr = htmlEl.dataset.template;
const variantFromAttr = parseInt(htmlEl.dataset.variant || "1", 10);
const slug = templateFromAttr || parseSlug();
const data = PREVIEW_DATA[slug];
const config = loadConfig(slug);
const companyDemoVariant = slug === "company" ? (templateFromAttr ? variantFromAttr : parseCompanyDemoVariant()) : 1;
const activeRenderer = slug === "company"
  ? (COMPANY_RENDERERS[companyDemoVariant] || renderCompany)
  : RENDERERS[slug];

document.body.dataset.template = slug;
document.title = `${config.siteName || data.brand} — ${data.name}${slug === "company" ? ` (Mau ${companyDemoVariant})` : ""} | Mẫu web demo`;

applyTheme(config);

const root = document.getElementById("previewRoot");
if (root && activeRenderer) {
  root.innerHTML = activeRenderer(data, config);
  initPurchaseInteractions();
  initSupportPopup(config);
}
