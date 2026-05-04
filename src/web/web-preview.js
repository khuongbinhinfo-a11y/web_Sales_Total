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

const loadConfig = (slug) => {
  try { return JSON.parse(localStorage.getItem(`preview_config_${slug}`) || "{}"); }
  catch { return {}; }
};

const applyTheme = (config) => {
  const r = document.documentElement;
  if (config.colorPrimary) r.style.setProperty("--c-primary", config.colorPrimary);
  if (config.colorAccent) r.style.setProperty("--c-accent", config.colorAccent);
};

const renderTopbar = (slug, data, planSlug) => `
  <div class="preview-topbar">
    <span>👁 <strong>Đây là bản demo</strong> — mẫu web &ldquo;${e(data.name)}&rdquo;</span>
    <div class="preview-topbar-actions">
      <a class="preview-topbar-btn is-back" href="/mau-demo/khomau-${e(slug)}">← Xem kho mẫu</a>
      <a class="preview-topbar-btn is-admin" href="/preview/${e(slug)}/admin">⚙ Thử admin</a>
      <a class="preview-topbar-btn is-buy" href="/catalog/web-demo/${e(slug)}/goi/${e(planSlug)}">Mua gói này →</a>
    </div>
  </div>
`;

const renderNav = (brand, links, slug, planSlug) => `
  <nav class="pv-nav">
    <div class="pv-nav-logo">${e(brand)}</div>
    <ul class="pv-nav-links">
      ${links.map((l) => `<li><a href="#">${e(l)}</a></li>`).join("")}
    </ul>
    <a class="pv-nav-cta" href="/catalog/web-demo/${e(slug)}/goi/${e(planSlug)}">Mua gói này</a>
  </nav>
`;

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
  <div class="pv-sticky-cta">
    <a href="/catalog/web-demo/${e(slug)}/goi/${e(PREVIEW_DATA[slug].planSlug)}">🛒 Mua gói website này ngay</a>
  </div>
`;
};

/* ============================================================
   TEMPLATE: COMPANY
   ============================================================ */
const renderCompany = (data, config) => `
  ${renderTopbar("company", data, data.planSlug)}
  ${renderNav(config.siteName || data.brand, data.navLinks, "company", data.planSlug)}

  <section class="pv-hero hero-split">
    <div class="pv-hero-content">
      <span class="pv-hero-eyebrow">${e(data.eyebrow)}</span>
      <h1>${data.title}</h1>
      <p class="pv-hero-desc">${e(data.desc)}</p>
      <div class="pv-hero-actions">
        <a class="pv-btn pv-btn-primary" href="/catalog/web-demo/company/goi/${e(data.planSlug)}">Nhận tư vấn miễn phí</a>
        <a class="pv-btn pv-btn-secondary" href="#">Xem dịch vụ</a>
      </div>
      <div class="pv-hero-stats">
        ${data.stats.map(([n, l]) => `<div class="pv-hero-stat"><strong>${e(n)}</strong><span>${e(l)}</span></div>`).join("")}
      </div>
    </div>
    <div class="pv-hero-img"><span class="img-placeholder">🏢</span></div>
  </section>

  <section class="pv-section alt">
    <div class="pv-container">
      <div class="pv-section-head">
        <span class="eyebrow">Dịch vụ cốt lõi</span>
        <h2>Giải pháp toàn diện cho doanh nghiệp</h2>
        <p>Từ tư vấn chiến lược đến triển khai và vận hành, chúng tôi đồng hành từng bước.</p>
      </div>
      <div class="pv-card-grid">
        ${data.cards.map(([icon, title, desc]) => `
          <div class="pv-card">
            <div class="pv-card-icon">${icon}</div>
            <h3>${e(title)}</h3>
            <p>${e(desc)}</p>
          </div>
        `).join("")}
      </div>
    </div>
  </section>

  <section class="pv-section dark">
    <div class="pv-container">
      <div class="pv-section-head">
        <span class="eyebrow">Quy trình làm việc</span>
        <h2>Từ yêu cầu đến kết quả chỉ 3 bước</h2>
        <p>Minh bạch từng giai đoạn để bạn biết dự án đang ở đâu.</p>
      </div>
      <div class="pv-steps">
        ${data.flow.map(([title, desc], i) => `
          <div class="pv-step">
            <div class="pv-step-num">${String(i + 1).padStart(2, "0")}</div>
            <h3>${e(title)}</h3>
            <p>${e(desc)}</p>
          </div>
        `).join("")}
      </div>
    </div>
  </section>

  <section class="pv-section">
    <div class="pv-container">
      <div class="pv-section-head">
        <span class="eyebrow">Câu hỏi thường gặp</span>
        <h2>Giải đáp trước khi liên hệ</h2>
      </div>
      <div class="pv-faq">
        ${data.faq.map(([q, a]) => `
          <details class="pv-faq-item">
            <summary>${e(q)}</summary>
            <p>${e(a)}</p>
          </details>
        `).join("")}
      </div>
    </div>
  </section>

  <section class="pv-section alt">
    <div class="pv-container">
      <div class="pv-section-head">
        <span class="eyebrow">Liên hệ tư vấn</span>
        <h2>${e(data.contactTitle)}</h2>
        <p>${e(data.contactText)}</p>
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

  ${renderFooter("company", data.brand, config)}
`;

/* ============================================================
   TEMPLATE: SHOP
   ============================================================ */
const renderShop = (data, config) => `
  ${renderTopbar("shop", data, data.planSlug)}
  ${renderNav(config.siteName || data.brand, data.navLinks, "shop", data.planSlug)}

  <section class="pv-hero" style="background:var(--c-hero-bg);padding:40px 24px;">
    <div class="pv-container">
      <div class="pv-sale-banner">
        <div>
          <span class="pv-sale-tag">🔥 MEGA SALE THÁNG 5</span>
          <h2>Giảm đến 40%<br>toàn bộ sản phẩm</h2>
          <p>Miễn phí giao hàng từ 299.000đ. Hoàn tiền 7 ngày không điều kiện.</p>
        </div>
        <div class="pv-sale-price">
          <div class="off">-40%</div>
          <div class="ends">Kết thúc sau 2 ngày</div>
        </div>
      </div>
      <div class="pv-categories">
        ${data.categories.map((c, i) => `<button class="pv-cat-chip${i === 0 ? " active" : ""}">${e(c)}</button>`).join("")}
      </div>
    </div>
  </section>

  <section class="pv-section alt">
    <div class="pv-container">
      <div class="pv-section-head">
        <span class="eyebrow">Sản phẩm nổi bật</span>
        <h2>Bán chạy tuần này</h2>
        <p>Hàng chính hãng, đảm bảo chất lượng. Đổi trả miễn phí trong 30 ngày.</p>
      </div>
      <div class="pv-product-grid">
        ${data.products.map((p) => `
          <div class="pv-product-card">
            <div class="pv-product-img">
              ${p.badge ? `<span class="pv-product-badge">${e(p.badge)}</span>` : ""}
              <span style="font-size:2.5rem">${p.icon}</span>
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

  <section class="pv-section dark">
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

  <section class="pv-section">
    <div class="pv-container">
      <div class="pv-section-head">
        <span class="eyebrow">Khách hàng nói gì</span>
        <h2>Đánh giá thực từ người mua</h2>
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

  <section class="pv-contact-section">
    <h2>${e(data.contactTitle)}</h2>
    <p>${e(data.contactText)}</p>
    <div style="display:flex;gap:12px;justify-content:center;flex-wrap:wrap">
      <a class="pv-btn pv-btn-primary" href="/catalog/web-demo/shop/goi/${e(data.planSlug)}">Xem gói triển khai</a>
      <a class="pv-btn pv-btn-secondary" href="#">Chat tư vấn ngay</a>
    </div>
  </section>

  ${renderFooter("shop", data.brand, config)}
`;

/* ============================================================
   TEMPLATE: SALON
   ============================================================ */
const renderSalon = (data, config) => `
  ${renderTopbar("salon", data, data.planSlug)}
  ${renderNav(config.siteName || data.brand, data.navLinks, "salon", data.planSlug)}

  <section class="pv-hero">
    <span class="pv-hero-eyebrow">${e(data.eyebrow)}</span>
    <h1>${data.title}</h1>
    <p class="pv-hero-desc">${e(data.desc)}</p>
    <div class="pv-hero-actions">
      <a class="pv-btn pv-btn-primary" href="#">Đặt lịch ngay</a>
      <a class="pv-btn pv-btn-secondary" href="#">Xem bảng giá</a>
    </div>
  </section>

  <section class="pv-section alt">
    <div class="pv-container">
      <div class="pv-section-head">
        <span class="eyebrow">Dịch vụ nổi bật</span>
        <h2>Trải nghiệm chăm sóc chuyên nghiệp</h2>
        <p>Đội ngũ kỹ thuật viên được đào tạo chuyên sâu, sử dụng sản phẩm nhập khẩu cao cấp.</p>
      </div>
      <div class="pv-card-grid">
        ${data.services.map((s) => `
          <div class="pv-card">
            <div class="pv-card-icon">${s.icon}</div>
            <h3>${e(s.name)} <small style="color:var(--c-primary);font-size:.8rem">từ ${e(s.price)}</small></h3>
            <p>${e(s.desc)}</p>
          </div>
        `).join("")}
      </div>
    </div>
  </section>

  <section class="pv-section">
    <div class="pv-container">
      <div class="pv-section-head">
        <span class="eyebrow">Gallery kết quả</span>
        <h2>Tác phẩm từ đôi bàn tay nghệ nhân</h2>
        <p>Mỗi ghế là một trải nghiệm cá nhân hoá — không copy, không giống nhau.</p>
      </div>
      <div class="pv-gallery">
        ${data.gallery.map((g) => `
          <div class="pv-gallery-item">
            <span>${g.icon}</span>
            <span class="label">${e(g.label)}</span>
          </div>
        `).join("")}
      </div>
    </div>
  </section>

  <section class="pv-section alt">
    <div class="pv-container">
      <div class="pv-section-head">
        <span class="eyebrow">Bảng giá dịch vụ</span>
        <h2>Gói chăm sóc phù hợp mọi nhu cầu</h2>
      </div>
      <div class="pv-pricing-grid">
        ${data.pricing.map((p) => `
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

  <section class="pv-section dark">
    <div class="pv-container">
      <div class="pv-section-head">
        <span class="eyebrow">Khách hàng tin tưởng</span>
        <h2>Phản hồi từ khách đã trải nghiệm</h2>
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

  <section class="pv-section">
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
              ${data.services.map((s) => `<option>${s.name}</option>`).join("")}
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

  ${renderFooter("salon", data.brand, config)}
`;

/* ============================================================
   TEMPLATE: INDUSTRY
   ============================================================ */
const renderIndustry = (data, config) => `
  ${renderTopbar("industry", data, data.planSlug)}
  ${renderNav(config.siteName || data.brand, data.navLinks, "industry", data.planSlug)}

  <section class="pv-hero hero-split">
    <div class="pv-hero-content">
      <span class="pv-hero-eyebrow">${e(data.eyebrow)}</span>
      <h1>${data.title}</h1>
      <p class="pv-hero-desc">${e(data.desc)}</p>
      <div class="pv-hero-actions">
        <a class="pv-btn pv-btn-primary" href="#">Yêu cầu báo giá</a>
        <a class="pv-btn pv-btn-secondary" href="#">Xem danh mục</a>
      </div>
      <div class="pv-hero-stats">
        ${data.stats.map(([n, l]) => `<div class="pv-hero-stat"><strong>${e(n)}</strong><span>${e(l)}</span></div>`).join("")}
      </div>
    </div>
    <div class="pv-hero-img"><span class="img-placeholder">⚙️</span></div>
  </section>

  <section class="pv-section alt">
    <div class="pv-container">
      <div class="pv-section-head">
        <span class="eyebrow">Danh mục sản phẩm</span>
        <h2>Thiết bị kỹ thuật chính hãng</h2>
        <p>Phân phối trực tiếp từ hãng. Có kho sẵn, giao trong 24–72 giờ toàn quốc.</p>
      </div>
      <div class="pv-card-grid">
        ${data.cards.map(([icon, title, desc]) => `
          <div class="pv-card">
            <div class="pv-card-icon">${icon}</div>
            <h3>${e(title)}</h3>
            <p>${e(desc)}</p>
          </div>
        `).join("")}
      </div>
    </div>
  </section>

  <section class="pv-section">
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

  <section class="pv-section dark">
    <div class="pv-container">
      <div class="pv-section-head">
        <span class="eyebrow">Đối tác thương hiệu</span>
        <h2>Phân phối chính thức từ các thương hiệu hàng đầu</h2>
      </div>
      <div class="pv-partners">
        ${data.partners.map((p) => `<div class="pv-partner-logo">${e(p)}</div>`).join("")}
      </div>
    </div>
  </section>

  <section class="pv-section alt">
    <div class="pv-container">
      <div class="pv-section-head">
        <span class="eyebrow">Quy trình</span>
        <h2>Từ yêu cầu đến lắp đặt</h2>
      </div>
      <div class="pv-steps">
        ${data.flow.map(([title, desc], i) => `
          <div class="pv-step">
            <div class="pv-step-num">${String(i + 1).padStart(2, "0")}</div>
            <h3>${e(title)}</h3>
            <p>${e(desc)}</p>
          </div>
        `).join("")}
      </div>
    </div>
  </section>

  <section class="pv-section">
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

  ${renderFooter("industry", data.brand, config)}
`;

/* ============================================================
   TEMPLATE: LANDING
   ============================================================ */
const renderLanding = (data, config) => `
  ${renderTopbar("landing", data, data.planSlug)}
  ${renderNav(config.siteName || data.brand, data.navLinks, "landing", data.planSlug)}

  <section class="pv-hero">
    <span class="pv-hero-eyebrow">${e(data.eyebrow)}</span>
    <h1>${data.title}</h1>
    <p class="pv-hero-desc">${e(data.desc)}</p>
    <div class="pv-hero-actions">
      <a class="pv-btn pv-btn-primary" href="#">Đăng ký học thử miễn phí</a>
      <a class="pv-btn pv-btn-secondary" href="#">Xem chương trình học</a>
    </div>
    <div class="pv-hero-stats" style="justify-content:center;margin-top:32px">
      ${data.stats.map(([n, l]) => `<div class="pv-hero-stat"><strong>${e(n)}</strong><span>${e(l)}</span></div>`).join("")}
    </div>
  </section>

  <section class="pv-section alt">
    <div class="pv-container">
      <div class="pv-section-head">
        <span class="eyebrow">Lợi ích nổi bật</span>
        <h2>Bạn nhận được gì sau khoá học?</h2>
        <p>Thiết kế theo outcome thực tế — học xong biết làm việc ngay, không lý thuyết suông.</p>
      </div>
      <div class="pv-card-grid">
        ${data.benefits.map(([icon, title, desc]) => `
          <div class="pv-card">
            <div class="pv-card-icon">${icon}</div>
            <h3>${e(title)}</h3>
            <p>${e(desc)}</p>
          </div>
        `).join("")}
      </div>
    </div>
  </section>

  <section class="pv-section">
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

  <section class="pv-section alt">
    <div class="pv-container">
      <div class="pv-section-head">
        <span class="eyebrow">Bảng giá</span>
        <h2>Chọn gói phù hợp với bạn</h2>
        <p>Thanh toán một lần, học mãi mãi. Không thu phí ẩn.</p>
      </div>
      <div class="pv-pricing-grid">
        ${data.pricing.map((p) => `
          <div class="pv-pricing-card${p.featured ? " featured" : ""}">
            ${p.featured ? '<span class="pv-pricing-badge">Phổ biến nhất</span>' : ""}
            <div class="pv-pricing-name">${e(p.name)}</div>
            <div class="pv-pricing-price">${e(p.price)}<span> / ${e(p.period)}</span></div>
            <ul class="pv-pricing-features">
              ${p.features.map((f) => `<li>${e(f)}</li>`).join("")}
            </ul>
            <a class="pv-pricing-cta" href="/catalog/web-demo/landing/goi/${e(data.planSlug)}">Đăng ký gói này</a>
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
        ${data.faq.map(([q, a]) => `
          <details class="pv-faq-item" style="border-color:rgba(255,255,255,.15)">
            <summary style="color:#fff">${e(q)}</summary>
            <p style="color:rgba(255,255,255,.65)">${e(a)}</p>
          </details>
        `).join("")}
      </div>
    </div>
  </section>

  <section class="pv-section">
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
            ${data.pricing.map((p) => `<option>${p.name} — ${p.price}</option>`).join("")}
          </select>
        </div>
        <button class="pv-form-submit">Đăng ký nhận tư vấn →</button>
      </div>
    </div>
  </section>

  ${renderFooter("landing", data.brand, config)}
`;

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

const slug = parseSlug();
const data = PREVIEW_DATA[slug];
const config = loadConfig(slug);

document.body.dataset.template = slug;
document.title = `${config.siteName || data.brand} — ${data.name} | Mẫu web demo`;

applyTheme(config);

const root = document.getElementById("previewRoot");
if (root && RENDERERS[slug]) {
  root.innerHTML = RENDERERS[slug](data, config);
}
