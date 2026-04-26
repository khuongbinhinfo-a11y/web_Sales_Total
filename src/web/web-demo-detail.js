const DEMO_DATA = {
  company: {
    name: "Công ty / Dịch vụ chuyên nghiệp",
    brand: "Nova Consulting",
    template: "company",
    eyebrow: "Mẫu web công ty / dịch vụ",
    title: "Website tin cậy để lấy lead tư vấn",
    desc: "Hướng này hợp với công ty dịch vụ, agency, tư vấn, luật, kế toán hoặc B2B. Trọng tâm là uy tín, quy trình rõ và form nhận tư vấn.",
    image: "/web-demo-company.jpg",
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
  education: {
    name: "Giáo dục / Khóa học",
    brand: "Bright Edu",
    template: "education",
    eyebrow: "Mẫu web giáo dục / khóa học",
    title: "Trang khóa học truyền cảm hứng để tăng đăng ký",
    desc: "Hướng này phù hợp trung tâm, khóa học online, lớp kỹ năng hoặc đào tạo nội bộ. Trọng tâm là chương trình, lợi ích, lộ trình, giảng viên và đăng ký học.",
    image: "/web-demo-photo.jpg",
    primary: "Tư vấn mẫu giáo dục",
    caption: "Tone sáng, trẻ, thân thiện",
    liveTitle: "Chương trình, lợi ích, roadmap học và form đăng ký",
    stats: [["Lộ trình", "học gì theo từng giai đoạn"], ["Giảng viên", "tăng niềm tin"], ["Đăng ký", "form tư vấn / ghi danh rõ ràng"]],
    cards: [
      ["Giới thiệu chương trình", "Nêu mục tiêu khóa học, đối tượng phù hợp và đầu ra sau khi hoàn thành."],
      ["Lợi ích học viên", "Chuyển tính năng khóa học thành kết quả cụ thể cho người học."],
      ["Lộ trình học", "Chia tuần / module để học viên hình dung tiến độ."],
      ["Giảng viên", "Ảnh, kinh nghiệm, chứng chỉ và phong cách giảng dạy."],
      ["Lịch khai giảng", "Ca học, ngày mở lớp, số chỗ còn lại và học phí."],
      ["Form đăng ký", "Thu tên, số điện thoại, độ tuổi/lớp và khung giờ tư vấn."]
    ],
    flowTitle: "Từ cảm hứng học đến đăng ký",
    flowDesc: "Mẫu giáo dục cần tạo động lực, giải thích lộ trình và làm form đăng ký đủ thân thiện.",
    flow: [
      ["Gợi cảm hứng", "Hero và lợi ích giúp người học thấy mình phù hợp."],
      ["Làm rõ lộ trình", "Roadmap và giảng viên trả lời câu hỏi 'học như thế nào?'."],
      ["Ghi danh", "Lịch học và form đăng ký giúp chuyển nhu cầu thành hành động."]
    ],
    contactTitle: "Muốn có trang khóa học riêng?",
    contactText: "Có thể thêm khóa học, giáo viên, lịch khai giảng, học phí, form kiểm tra đầu vào và CRM tuyển sinh."
  },
  spa: {
    name: "Spa / Thẩm mỹ / Làm đẹp",
    brand: "Maison Glow",
    template: "spa",
    eyebrow: "Mẫu web spa / làm đẹp",
    title: "Trang làm đẹp cao cấp để khách đặt lịch",
    desc: "Hướng này dành cho spa, clinic, salon hoặc dịch vụ làm đẹp. Trọng tâm là cảm giác sang, dịch vụ nổi bật, before-after, bảng giá và đặt lịch.",
    image: "/web-demo-photo.jpg",
    primary: "Tư vấn mẫu spa",
    caption: "Tone nude / tím nhạt / champagne",
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
    flowDesc: "Mẫu spa cần mềm và sang, nhưng CTA đặt lịch vẫn phải đủ rõ để không bị chỉ đẹp mà không chuyển đổi.",
    flow: [
      ["Gợi mong muốn", "Dịch vụ và hình ảnh tạo cảm giác được chăm sóc."],
      ["Tạo niềm tin", "Before-after, feedback và chuyên viên giảm rủi ro cảm nhận."],
      ["Đặt lịch", "Bảng giá và form booking đặt ngay cạnh nhau để khách hành động."]
    ],
    contactTitle: "Muốn có mẫu web spa sang hơn?",
    contactText: "Có thể thêm ảnh dịch vụ, bảng giá, feedback, booking online và nội dung theo màu thương hiệu của spa."
  },
  restaurant: {
    name: "Nhà hàng / Quán / Local business",
    brand: "Bếp Mộc",
    template: "restaurant",
    eyebrow: "Mẫu web nhà hàng / local business",
    title: "Trang địa phương giàu hình ảnh để khách ghé quán",
    desc: "Hướng này dành cho nhà hàng, cafe, quán ăn, showroom hoặc local business. Trọng tâm là món nổi bật, menu, không gian, bản đồ và đặt bàn/gọi món.",
    image: "/web-demo-photo.jpg",
    primary: "Tư vấn mẫu nhà hàng",
    caption: "Tone ấm, đậm, giàu hình ảnh",
    liveTitle: "Món nổi bật, menu, không gian, bản đồ và đặt bàn",
    stats: [["Hình ảnh", "món / không gian nổi bật"], ["Menu", "dễ xem trên mobile"], ["Ghé quán", "bản đồ, hotline, đặt bàn"]],
    cards: [
      ["Món nổi bật", "Hero dùng ảnh món chính, ưu đãi hôm nay và CTA đặt bàn/gọi món."],
      ["Menu trực quan", "Nhóm món, giá, món bán chạy và tag cay/chay/đặc biệt."],
      ["Không gian quán", "Ảnh bàn ghế, khu check-in, phòng riêng hoặc không gian gia đình."],
      ["Bản đồ / giờ mở cửa", "Địa chỉ, giờ hoạt động, chỉ đường và khu vực giao hàng."],
      ["Đánh giá khách", "Review ngắn, ảnh thật và điểm nổi bật của dịch vụ."],
      ["Đặt bàn / gọi món", "Form đặt bàn, nút gọi nhanh và link chat."]
    ],
    flowTitle: "Từ thèm món đến ghé cửa hàng",
    flowDesc: "Mẫu local business nên trực quan, ít chữ, ưu tiên ảnh và các hành động ngay: gọi, đặt bàn, xem bản đồ.",
    flow: [
      ["Kích thích thị giác", "Món nổi bật và không gian tạo lý do muốn đến."],
      ["Giúp chọn nhanh", "Menu rõ giá giúp khách quyết định trước khi gọi hoặc ghé."],
      ["Dẫn đường", "Bản đồ, hotline và đặt bàn đưa khách tới hành động thực tế."]
    ],
    contactTitle: "Muốn có mẫu web quán / local business?",
    contactText: "Có thể thêm menu thật, ảnh quán, bản đồ, đặt bàn, giao hàng và nút gọi nhanh trên mobile."
  }
};

const ids = ["company", "shop", "education", "spa", "restaurant"];
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

function ContentIncludedNote(shared) {
  if (!shared?.contentNote) return "";

  return `
    <div class="demo-content-note">
      <span class="demo-note-icon">ND</span>
      <p>${escapeHtml(shared.contentNote)}</p>
    </div>
  `;
}

function PricingCard(plan, index, shared) {
  const features = Array.isArray(plan?.features) ? plan.features : [];
  const badge = plan?.badge || (index === 1 ? "Khuyên dùng" : index === 2 ? "Mở rộng" : "");
  const isFeatured = Boolean(plan?.featured) || index === 1;
  const isExpanded = badge === "Mở rộng" || index === 2;
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
      <a class="demo-pricing-cta" href="#demoContact">${escapeHtml(shared?.cta || "Tư vấn gói này")}</a>
    </article>
  `;
}

function PricingSection(id) {
  const section = document.getElementById("demoPricing");
  const data = window.webDemoPricingData?.[id];
  const shared = window.webDemoPricingShared || {};
  const plans = Array.isArray(data?.plans) ? data.plans : [];

  if (!section || !plans.length) return;

  section.innerHTML = `
    <div class="demo-container">
      <div class="demo-section-head demo-pricing-head">
        <span>Báo giá theo ngành</span>
        <h2 id="demoPricingTitle">${escapeHtml(shared.title || "Gói triển khai phù hợp")}</h2>
        <p>${escapeHtml(shared.description || "")}</p>
      </div>
      <div class="demo-pricing-grid">
        ${plans.map((plan, index) => PricingCard(plan, index, shared)).join("")}
      </div>
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

  if (item.template === "education") {
    el.innerHTML = `
      <div class="live-education">
        <div class="live-edu-intro">
          <span>Khóa học 8 tuần</span>
          <h3>Từ nền tảng đến dự án thực tế</h3>
          <p>Học theo lộ trình, có mentor và bài tập ứng dụng.</p>
        </div>
        <div class="live-edu-roadmap">
          ${["Nền tảng", "Thực hành", "Dự án", "Đánh giá"].map((text, index) => `
            <article><b>${index + 1}</b><span>${text}</span></article>
          `).join("")}
        </div>
        <div class="live-edu-signup">
          <strong>Đăng ký tư vấn</strong>
          <button>Giữ chỗ học thử</button>
        </div>
      </div>
    `;
    return;
  }

  if (item.template === "spa") {
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
        <span>Món hôm nay</span>
        <h3>Cơm niêu cá kho & set gia đình</h3>
        <a href="#demoContact">Đặt bàn</a>
      </div>
      <div class="live-restaurant-menu">
        ${["Món chính", "Đồ uống", "Combo", "Tráng miệng"].map((text) => `<article><b>${text}</b><span>từ 59K</span></article>`).join("")}
      </div>
      <div class="live-restaurant-map">
        <strong>Bản đồ & giờ mở cửa</strong>
        <p>10:00 - 22:00 | Gọi đặt bàn nhanh</p>
      </div>
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
  contactCta.href = "#demoPricing";
  contactCta.textContent = "Xem gói triển khai";
}

const heroImage = document.getElementById("demoHeroImage");
if (heroImage) {
  heroImage.src = active.image || "/web-demo-photo.jpg";
  heroImage.alt = `Ảnh demo ${active.name}`;
}

const switchEl = document.getElementById("demoSwitch");
if (switchEl) {
  switchEl.innerHTML = ids.map((id) => {
    const item = DEMO_DATA[id];
    const current = id === activeId ? " active" : "";
    const aria = id === activeId ? ' aria-current="page"' : "";
    return `<a class="${current.trim()}" href="/web-demo/${id}"${aria}>${escapeHtml(item.name)}</a>`;
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
PricingSection(activeId);
