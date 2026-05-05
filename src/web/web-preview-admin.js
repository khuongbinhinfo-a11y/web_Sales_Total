/* web-preview-admin.js — Admin panel with localStorage config */

const ADMIN_PASSWORD = "admin1234";
const CONFIG_VERSION = "1";

const COLOR_PRESETS = [
  { name: "Xanh đậm (mặc định)", primary: "#1a3c6e", accent: "#1e88e5" },
  { name: "Cam năng động", primary: "#e84c0e", accent: "#2b7a4b" },
  { name: "Hồng đất salon", primary: "#b5556a", accent: "#a1785a" },
  { name: "Xanh thép B2B", primary: "#1e5fa0", accent: "#455a6e" },
  { name: "Tím landing", primary: "#6c3fc5", accent: "#e8960a" },
  { name: "Đen tối giản", primary: "#1a1a2e", accent: "#e94560" },
  { name: "Xanh lá tươi", primary: "#1b6e3c", accent: "#f59e0b" },
  { name: "Vàng sang trọng", primary: "#7c5a1e", accent: "#c9a227" }
];

const parseSlug = () => {
  const parts = location.pathname.split("/").filter(Boolean);
  const idx = parts.indexOf("preview");
  return idx >= 0 ? (parts[idx + 1] || "company") : "company";
};

const parseDemoVariant = () => {
  const params = new URLSearchParams(location.search || "");
  const n = parseInt(params.get("demo") || "1", 10);
  if (Number.isFinite(n) && n >= 1 && n <= 3) {
    return n;
  }
  return 1;
};

/* AUTO-DETECT TEMPLATE FROM HTML ATTRIBUTES (for standalone folder deployment) */
const htmlEl = document.documentElement;
const templateFromAttr = htmlEl.dataset.template;
const variantFromAttr = parseInt(htmlEl.dataset.variant || "1", 10);
const slug = templateFromAttr || parseSlug();
const demoVariant = templateFromAttr
  ? (Number.isFinite(variantFromAttr) && variantFromAttr >= 1 && variantFromAttr <= 3 ? variantFromAttr : 1)
  : parseDemoVariant();
const LEGACY_PUBLIC_CONFIG_KEY = `preview_config_${slug}`;
const LEGACY_DRAFT_CONFIG_KEY = `admin_draft_${slug}`;
const PUBLIC_CONFIG_KEY = `preview_config_${slug}_demo${demoVariant}`;
const DRAFT_CONFIG_KEY = `admin_draft_${slug}_demo${demoVariant}`;
let remoteTemplateConfig = {};

const loadJson = (key) => {
  try { return JSON.parse(localStorage.getItem(key) || "{}"); }
  catch { return {}; }
};

const isObject = (value) => value && typeof value === "object" && !Array.isArray(value);

const loadRemoteTemplateConfig = async () => {
  try {
    const res = await fetch(`/api/web-demo/templates/${encodeURIComponent(slug)}?variant=${encodeURIComponent(String(demoVariant))}`);
    if (!res.ok) return {};
    const data = await res.json().catch(() => ({}));
    const config = data?.item?.config;
    remoteTemplateConfig = isObject(config) ? config : {};
    return remoteTemplateConfig;
  } catch {
    remoteTemplateConfig = {};
    return remoteTemplateConfig;
  }
};

const loadPublicConfig = () => {
  const scoped = loadJson(PUBLIC_CONFIG_KEY);
  if (Object.keys(scoped).length) {
    return scoped;
  }

  const legacy = loadJson(LEGACY_PUBLIC_CONFIG_KEY);
  if (Object.keys(legacy).length) {
    return legacy;
  }

  return isObject(remoteTemplateConfig) ? remoteTemplateConfig : {};
};

const loadDraftConfig = () => {
  const draft = loadJson(DRAFT_CONFIG_KEY);
  if (Object.keys(draft).length) return draft;

  const legacyDraft = loadJson(LEGACY_DRAFT_CONFIG_KEY);
  if (Object.keys(legacyDraft).length) {
    localStorage.setItem(DRAFT_CONFIG_KEY, JSON.stringify(legacyDraft));
    return legacyDraft;
  }

  const legacy = loadPublicConfig();
  if (Object.keys(legacy).length) {
    localStorage.setItem(DRAFT_CONFIG_KEY, JSON.stringify(legacy));
    return legacy;
  }
  return {};
};

const saveDraftConfig = (cfg) => {
  cfg._v = CONFIG_VERSION;
  cfg._saved = new Date().toISOString();
  localStorage.setItem(DRAFT_CONFIG_KEY, JSON.stringify(cfg));
};

const publishDraftConfig = (cfg) => {
  cfg._published = new Date().toISOString();
  localStorage.setItem(PUBLIC_CONFIG_KEY, JSON.stringify(cfg));
};

const isLoggedIn = () => sessionStorage.getItem("adm_auth") === "1";
const login = () => sessionStorage.setItem("adm_auth", "1");
const logout = () => { sessionStorage.removeItem("adm_auth"); location.reload(); };

/* ================================================================
   UI UTILITIES
   ================================================================ */
const $ = (id) => document.getElementById(id);
const val = (id) => ($( id)?.value || "").trim();
const checked = (id) => !!($(id)?.checked);
let hasUnpublishedChanges = false;

const setDraftHint = (msg, tone = "info") => {
  const hint = $("admDraftHint");
  if (!hint) return;
  hint.textContent = msg;
  hint.style.color = tone === "warn" ? "#fcd34d" : tone === "ok" ? "#86efac" : "#93c5fd";
  hint.style.borderColor = tone === "warn" ? "rgba(252,211,77,.35)" : tone === "ok" ? "rgba(134,239,172,.35)" : "rgba(96,165,250,.28)";
  hint.style.background = tone === "warn" ? "rgba(161,98,7,.12)" : tone === "ok" ? "rgba(22,163,74,.12)" : "rgba(37,99,235,.12)";
};

const showToast = (text = "✅ Đã lưu tạm!") => {
  const t = $("admToast");
  t.textContent = text;
  t.classList.remove("hidden");
  setTimeout(() => t.classList.add("hidden"), 2800);
};

/* ================================================================
   TABS
   ================================================================ */
const TABS = { general: "Thông tin chung", colors: "Màu sắc", content: "Nội dung demo con", posts: "Bài viết", sales: "Mua hàng", contact: "Liên hệ" };

const CONTENT_FIELD_MAP = {
  company: [
    "Hero: đổi tiêu đề lớn, mô tả mở đầu và ảnh đầu trang.",
    "Dịch vụ: đổi tiêu đề nhóm dịch vụ và từng card dịch vụ ở giữa trang.",
    "Quy trình: đổi các bước hiển thị ngay dưới nhóm dịch vụ.",
    "FAQ + liên hệ: đổi phần chốt tư vấn ở cuối trang."
  ],
  shop: [
    "Banner: đổi câu khuyến mãi, % giảm và thời hạn khuyến mãi.",
    "Danh mục: mỗi dòng sẽ thành 1 nút lọc trong khối danh mục.",
    "Sản phẩm nổi bật: thêm/sửa từng ô sản phẩm trong lưới bán hàng.",
    "Đánh giá khách hàng: đổi phản hồi ở phần gần cuối trang."
  ],
  salon: [
    "Hero: đổi thông điệp chính và ảnh đầu trang salon.",
    "Dịch vụ nổi bật: mỗi mục là 1 dịch vụ trong khối dịch vụ.",
    "Gallery kết quả: mỗi mục là 1 ảnh/ô trong thư viện ảnh.",
    "Bảng giá + đánh giá: đổi phần giá gói và phản hồi khách."
  ],
  industry: [
    "Hero: đổi thông điệp chính cho trang kỹ thuật/B2B.",
    "Danh mục thiết bị: mỗi mục là 1 ô thiết bị trong khối sản phẩm.",
    "Quy trình làm việc: mỗi bước là 1 bước trong phần quy trình.",
    "Đối tác: mỗi dòng là 1 tên thương hiệu đối tác."
  ],
  landing: [
    "Hero: đổi thông điệp mở đầu landing page.",
    "Lợi ích: mỗi mục là 1 ô lợi ích ở phần giữa trang.",
    "Bảng giá: mỗi gói là 1 cột giá trong phần chốt đăng ký.",
    "FAQ: mỗi mục là 1 câu hỏi thường gặp ở cuối trang."
  ]
};

const renderContentMapping = () => {
  const intro = $("admContentMapIntro");
  const list = $("admContentMapList");
  if (!intro || !list) return;

  intro.textContent = `Bạn đang sửa mẫu con ${demoVariant} của nhóm "${slug}". Các mục bên dưới sẽ tác động đúng vị trí tương ứng trên demo con này.`;
  const lines = CONTENT_FIELD_MAP[slug] || [];
  list.innerHTML = lines.map((line) => `<li>${escText(line)}</li>`).join("");
};

document.querySelectorAll(".adm-nav-item").forEach((el) => {
  el.addEventListener("click", () => {
    const tab = el.dataset.tab;
    document.querySelectorAll(".adm-nav-item").forEach((n) => n.classList.remove("active"));
    el.classList.add("active");
    document.querySelectorAll(".adm-tab").forEach((t) => { t.classList.remove("active"); t.classList.add("hidden"); });
    const tabEl = $(`tab-${tab}`);
    if (tabEl) { tabEl.classList.remove("hidden"); tabEl.classList.add("active"); }
    $("admTabTitle").textContent = TABS[tab] || tab;
  });
});

/* ================================================================
   COLOR PRESETS
   ================================================================ */
const renderPresets = () => {
  const list = $("colorPresets");
  if (!list) return;
  list.innerHTML = COLOR_PRESETS.map((p) => `
    <div class="adm-preset" data-primary="${p.primary}" data-accent="${p.accent}">
      <div class="adm-preset-swatch">
        <div class="adm-preset-dot" style="background:${p.primary}"></div>
        <div class="adm-preset-dot" style="background:${p.accent}"></div>
      </div>
      <span>${p.name}</span>
    </div>
  `).join("");

  list.querySelectorAll(".adm-preset").forEach((el) => {
    el.addEventListener("click", () => {
      const prim = el.dataset.primary;
      const acc = el.dataset.accent;
      $("colorPrimary").value = prim;
      $("colorPrimaryText").value = prim;
      $("colorAccent").value = acc;
      $("colorAccentText").value = acc;
    });
  });
};

/* Sync color picker ↔ text input */
const syncColor = (pickerId, textId) => {
  const picker = $(pickerId);
  const text = $(textId);
  if (!picker || !text) return;
  picker.addEventListener("input", () => { text.value = picker.value; });
  text.addEventListener("input", () => {
    if (/^#[0-9a-fA-F]{6}$/.test(text.value)) picker.value = text.value;
  });
};

/* ================================================================
   POSTS / COMPANY STATE
   ================================================================ */
let posts = [];
let companyCards = [];
let companyFlow = [];

/* Other template state */
let shopProducts = [], shopReviews = [];
let salonServices = [], salonGallery = [], salonPricing = [], salonReviews = [];
let industryCards = [], industryFlow = [];
let landingBenefits = [], landingPricing = [], landingFaq = [];

const escAttr = (v) => String(v || "").replace(/[&"<>]/g, (c) => ({ "&": "&amp;", '"': "&quot;", "<": "&lt;", ">": "&gt;" }[c]));
const escText = (v) => String(v || "").replace(/[&<>]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;" }[c]));

const readImageAsDataUrl = (file) => new Promise((resolve, reject) => {
  const reader = new FileReader();
  reader.onload = () => resolve(String(reader.result || ""));
  reader.onerror = () => reject(new Error("Không thể đọc file ảnh"));
  reader.readAsDataURL(file);
});

const bindImagePicker = (fileInputId, openButtonId, clearButtonId, targetInputId) => {
  const fileInput = $(fileInputId);
  const openButton = $(openButtonId);
  const clearButton = $(clearButtonId);
  const targetInput = $(targetInputId);
  if (!fileInput || !openButton || !targetInput) return;

  openButton.addEventListener("click", () => fileInput.click());
  fileInput.addEventListener("change", async () => {
    const file = fileInput.files && fileInput.files[0];
    if (!file) return;
    try {
      const dataUrl = await readImageAsDataUrl(file);
      targetInput.value = dataUrl;
    } catch {
      alert("Không đọc được ảnh. Vui lòng thử lại với file khác.");
    } finally {
      fileInput.value = "";
    }
  });

  clearButton?.addEventListener("click", () => {
    targetInput.value = "";
  });
};

/* ================================================================
   GENERIC LIST EDITOR FACTORY
   ================================================================ */
const makeListEditor = ({ listId, getArr, setArr, defaultItem, renderItem }) => {
  const render = () => {
    const list = $(listId);
    if (!list) return;
    const arr = getArr();
    if (!arr.length) {
      list.innerHTML = '<p style="color:#64748b;font-size:.88rem">Chưa có mục nào. Bấm "+ Thêm" để thêm.</p>';
      return;
    }
    list.innerHTML = arr.map((item, i) => renderItem(item, i)).join("");
    list.querySelectorAll("[data-field][data-idx]").forEach((el) => {
      el.addEventListener("input", () => { getArr()[Number(el.dataset.idx)][el.dataset.field] = el.value; });
    });
    list.querySelectorAll("[data-check][data-idx]").forEach((el) => {
      el.addEventListener("change", () => { getArr()[Number(el.dataset.idx)][el.dataset.check] = el.checked; });
    });
    list.querySelectorAll(".adm-item-del").forEach((btn) => {
      btn.addEventListener("click", () => {
        const a = getArr(); a.splice(Number(btn.dataset.idx), 1); setArr(a); render();
      });
    });
    list.querySelectorAll(".js-pick-img").forEach((btn) => {
      btn.addEventListener("click", () => list.querySelector(`.js-img-file[data-idx='${btn.dataset.idx}']`)?.click());
    });
    list.querySelectorAll(".js-clear-img").forEach((btn) => {
      btn.addEventListener("click", () => { getArr()[Number(btn.dataset.idx)].imageUrl = ""; render(); });
    });
    list.querySelectorAll(".js-img-file").forEach((el) => {
      el.addEventListener("change", async () => {
        const idx = Number(el.dataset.idx);
        const file = el.files?.[0];
        if (!file) return;
        try { getArr()[idx].imageUrl = await readImageAsDataUrl(file); }
        catch { alert("Không đọc được ảnh. Vui lòng thử lại."); }
        el.value = "";
        render();
      });
    });
  };
  const addItem = () => { const a = getArr(); a.push(JSON.parse(JSON.stringify(defaultItem))); setArr(a); render(); };
  return { render, addItem };
};

/* Shared snippet: image upload row inside an item */
const imgUploadRow = (item, i) => `
  <div class="adm-form-group" style="grid-column:1/-1">
    <label>Ảnh (có thể dán URL hoặc chọn từ máy)</label>
    <input type="url" value="${escAttr(item.imageUrl || "")}" data-field="imageUrl" data-idx="${i}" placeholder="Để trống nếu dùng biểu tượng" />
  </div>
  <div class="adm-upload-row" style="margin-bottom:10px">
    ${item.imageUrl ? `<img class="adm-thumb-preview" src="${escAttr(item.imageUrl)}" alt="thumb" />` : ""}
    <button type="button" class="adm-btn-add js-pick-img" data-idx="${i}">📁 Chọn ảnh</button>
    <button type="button" class="adm-btn-add js-clear-img" data-idx="${i}">🗑</button>
    <input type="file" accept="image/*" class="hidden js-img-file" data-idx="${i}" />
  </div>`;

const reviewItemHtml = (item, i) => `
  <div class="adm-item-card">
    <div class="adm-item-header"><span class="adm-item-title">Đánh giá ${i + 1}</span><button class="adm-item-del" data-idx="${i}">Xoá</button></div>
    <div class="adm-item-grid">
      <div class="adm-form-group"><label>Tên khách hàng</label>
        <input type="text" value="${escAttr(item.name)}" data-field="name" data-idx="${i}" /></div>
      <div class="adm-form-group"><label>Ghi chú (ngày mua...)</label>
        <input type="text" value="${escAttr(item.sub)}" data-field="sub" data-idx="${i}" placeholder="Mua tháng 5/2026" /></div>
    </div>
    <div class="adm-form-group"><label>Nội dung đánh giá</label>
      <textarea data-field="text" data-idx="${i}">${escText(item.text)}</textarea></div>
  </div>`;

/* ================================================================
   SHOP EDITORS
   ================================================================ */
const shopProductsEditor = makeListEditor({
  listId: "shopProductsList",
  getArr: () => shopProducts, setArr: (a) => { shopProducts = a; },
  defaultItem: { icon: "📦", imageUrl: "", name: "Sản phẩm mới", price: "0đ", old: "", badge: "" },
  renderItem: (item, i) => `
    <div class="adm-item-card">
      <div class="adm-item-header"><span class="adm-item-title">Sản phẩm ${i + 1}</span><button class="adm-item-del" data-idx="${i}">Xoá</button></div>
      <div class="adm-item-grid">
        <div class="adm-form-group"><label>Biểu tượng (khi không có ảnh)</label>
          <input type="text" value="${escAttr(item.icon)}" data-field="icon" data-idx="${i}" placeholder="📦" /></div>
        <div class="adm-form-group"><label>Badge</label>
          <input type="text" value="${escAttr(item.badge)}" data-field="badge" data-idx="${i}" placeholder="-20%, Hot, Mới..." /></div>
      </div>
      <div class="adm-form-group"><label>Tên sản phẩm</label>
        <input type="text" value="${escAttr(item.name)}" data-field="name" data-idx="${i}" /></div>
      ${imgUploadRow(item, i)}
      <div class="adm-item-grid">
        <div class="adm-form-group"><label>Giá bán</label>
          <input type="text" value="${escAttr(item.price)}" data-field="price" data-idx="${i}" placeholder="199.000đ" /></div>
        <div class="adm-form-group"><label>Giá cũ (bỏ trống nếu không có)</label>
          <input type="text" value="${escAttr(item.old)}" data-field="old" data-idx="${i}" placeholder="280.000đ" /></div>
      </div>
    </div>`
});

const shopReviewsEditor = makeListEditor({
  listId: "shopReviewsList",
  getArr: () => shopReviews, setArr: (a) => { shopReviews = a; },
  defaultItem: { name: "Khách hàng", sub: "Mua tháng 5/2026", text: "Rất hài lòng với sản phẩm..." },
  renderItem: reviewItemHtml
});

$("addShopProductBtn")?.addEventListener("click", shopProductsEditor.addItem);
$("addShopReviewBtn")?.addEventListener("click", shopReviewsEditor.addItem);

/* ================================================================
   SALON EDITORS
   ================================================================ */
const salonServicesEditor = makeListEditor({
  listId: "salonServicesList",
  getArr: () => salonServices, setArr: (a) => { salonServices = a; },
  defaultItem: { icon: "✂️", imageUrl: "", name: "Tên dịch vụ", desc: "Mô tả dịch vụ", price: "0đ" },
  renderItem: (item, i) => `
    <div class="adm-item-card">
      <div class="adm-item-header"><span class="adm-item-title">Dịch vụ ${i + 1}</span><button class="adm-item-del" data-idx="${i}">Xoá</button></div>
      <div class="adm-item-grid">
        <div class="adm-form-group"><label>Biểu tượng</label>
          <input type="text" value="${escAttr(item.icon)}" data-field="icon" data-idx="${i}" placeholder="✂️" /></div>
        <div class="adm-form-group"><label>Giá từ</label>
          <input type="text" value="${escAttr(item.price)}" data-field="price" data-idx="${i}" placeholder="150.000đ" /></div>
      </div>
      <div class="adm-form-group"><label>Tên dịch vụ</label>
        <input type="text" value="${escAttr(item.name)}" data-field="name" data-idx="${i}" /></div>
      ${imgUploadRow(item, i)}
      <div class="adm-form-group"><label>Mô tả dịch vụ</label>
        <textarea data-field="desc" data-idx="${i}">${escText(item.desc)}</textarea></div>
    </div>`
});

const salonGalleryEditor = makeListEditor({
  listId: "salonGalleryList",
  getArr: () => salonGallery, setArr: (a) => { salonGallery = a; },
  defaultItem: { icon: "✨", imageUrl: "", label: "Tên tác phẩm" },
  renderItem: (item, i) => `
    <div class="adm-item-card">
      <div class="adm-item-header"><span class="adm-item-title">Ảnh gallery ${i + 1}</span><button class="adm-item-del" data-idx="${i}">Xoá</button></div>
      <div class="adm-item-grid">
        <div class="adm-form-group"><label>Biểu tượng (khi không có ảnh)</label>
          <input type="text" value="${escAttr(item.icon)}" data-field="icon" data-idx="${i}" placeholder="✨" /></div>
        <div class="adm-form-group"><label>Nhãn tác phẩm</label>
          <input type="text" value="${escAttr(item.label)}" data-field="label" data-idx="${i}" /></div>
      </div>
      ${imgUploadRow(item, i)}
    </div>`
});

const salonPricingEditor = makeListEditor({
  listId: "salonPricingList",
  getArr: () => salonPricing, setArr: (a) => { salonPricing = a; },
  defaultItem: { name: "Gói mới", price: "0đ", featuresRaw: "", featured: false },
  renderItem: (item, i) => `
    <div class="adm-item-card">
      <div class="adm-item-header"><span class="adm-item-title">Gói ${i + 1}</span><button class="adm-item-del" data-idx="${i}">Xoá</button></div>
      <div class="adm-item-grid">
        <div class="adm-form-group"><label>Tên gói</label>
          <input type="text" value="${escAttr(item.name)}" data-field="name" data-idx="${i}" /></div>
        <div class="adm-form-group"><label>Giá</label>
          <input type="text" value="${escAttr(item.price)}" data-field="price" data-idx="${i}" placeholder="350.000đ" /></div>
      </div>
      <div class="adm-form-group"><label>Tính năng gói (mỗi dòng 1 tính năng)</label>
        <textarea data-field="featuresRaw" data-idx="${i}" rows="4">${escText(item.featuresRaw || (Array.isArray(item.features) ? item.features.join("\n") : ""))}</textarea></div>
      <label style="display:flex;align-items:center;gap:8px;font-size:.85rem;color:#94a3b8;margin-top:8px;cursor:pointer">
        <input type="checkbox" data-check="featured" data-idx="${i}" ${item.featured ? "checked" : ""} />
        Đánh dấu "Khuyên dùng"
      </label>
    </div>`
});

const salonReviewsEditor = makeListEditor({
  listId: "salonReviewsList",
  getArr: () => salonReviews, setArr: (a) => { salonReviews = a; },
  defaultItem: { name: "Khách hàng", sub: "Khách thường xuyên", text: "Dịch vụ rất tốt..." },
  renderItem: reviewItemHtml
});

$("addSalonServiceBtn")?.addEventListener("click", salonServicesEditor.addItem);
$("addSalonGalleryBtn")?.addEventListener("click", salonGalleryEditor.addItem);
$("addSalonPricingBtn")?.addEventListener("click", salonPricingEditor.addItem);
$("addSalonReviewBtn")?.addEventListener("click", salonReviewsEditor.addItem);

/* ================================================================
   INDUSTRY EDITORS
   ================================================================ */
const industryCardsEditor = makeListEditor({
  listId: "industryCardsList",
  getArr: () => industryCards, setArr: (a) => { industryCards = a; },
  defaultItem: { icon: "⚙️", imageUrl: "", title: "Tên sản phẩm / thiết bị", desc: "Mô tả sản phẩm" },
  renderItem: (item, i) => `
    <div class="adm-item-card">
      <div class="adm-item-header"><span class="adm-item-title">Mục ${i + 1}</span><button class="adm-item-del" data-idx="${i}">Xoá</button></div>
      <div class="adm-item-grid">
        <div class="adm-form-group"><label>Biểu tượng</label>
          <input type="text" value="${escAttr(item.icon)}" data-field="icon" data-idx="${i}" placeholder="⚙️" /></div>
        <div class="adm-form-group"><label>Tiêu đề</label>
          <input type="text" value="${escAttr(item.title)}" data-field="title" data-idx="${i}" /></div>
      </div>
      ${imgUploadRow(item, i)}
      <div class="adm-form-group"><label>Mô tả</label>
        <textarea data-field="desc" data-idx="${i}">${escText(item.desc)}</textarea></div>
    </div>`
});

const industryFlowEditor = makeListEditor({
  listId: "industryFlowList",
  getArr: () => industryFlow, setArr: (a) => { industryFlow = a; },
  defaultItem: { title: "Tên bước", desc: "Mô tả bước" },
  renderItem: (item, i) => `
    <div class="adm-item-card">
      <div class="adm-item-header"><span class="adm-item-title">Bước ${i + 1}</span><button class="adm-item-del" data-idx="${i}">Xoá</button></div>
      <div class="adm-form-group"><label>Tiêu đề bước</label>
        <input type="text" value="${escAttr(item.title)}" data-field="title" data-idx="${i}" /></div>
      <div class="adm-form-group"><label>Mô tả</label>
        <textarea data-field="desc" data-idx="${i}">${escText(item.desc)}</textarea></div>
    </div>`
});

$("addIndustryCardBtn")?.addEventListener("click", industryCardsEditor.addItem);
$("addIndustryFlowBtn")?.addEventListener("click", industryFlowEditor.addItem);

/* ================================================================
   LANDING EDITORS
   ================================================================ */
const landingBenefitsEditor = makeListEditor({
  listId: "landingBenefitsList",
  getArr: () => landingBenefits, setArr: (a) => { landingBenefits = a; },
  defaultItem: { icon: "🎯", imageUrl: "", title: "Lợi ích", desc: "Mô tả lợi ích" },
  renderItem: (item, i) => `
    <div class="adm-item-card">
      <div class="adm-item-header"><span class="adm-item-title">Lợi ích ${i + 1}</span><button class="adm-item-del" data-idx="${i}">Xoá</button></div>
      <div class="adm-item-grid">
        <div class="adm-form-group"><label>Biểu tượng</label>
          <input type="text" value="${escAttr(item.icon)}" data-field="icon" data-idx="${i}" placeholder="🎯" /></div>
        <div class="adm-form-group"><label>Tiêu đề</label>
          <input type="text" value="${escAttr(item.title)}" data-field="title" data-idx="${i}" /></div>
      </div>
      ${imgUploadRow(item, i)}
      <div class="adm-form-group"><label>Mô tả</label>
        <textarea data-field="desc" data-idx="${i}">${escText(item.desc)}</textarea></div>
    </div>`
});

const landingPricingEditor = makeListEditor({
  listId: "landingPricingList",
  getArr: () => landingPricing, setArr: (a) => { landingPricing = a; },
  defaultItem: { name: "Gói mới", price: "0đ", period: "trọn đời", featuresRaw: "", featured: false },
  renderItem: (item, i) => `
    <div class="adm-item-card">
      <div class="adm-item-header"><span class="adm-item-title">Gói ${i + 1}</span><button class="adm-item-del" data-idx="${i}">Xoá</button></div>
      <div class="adm-item-grid">
        <div class="adm-form-group"><label>Tên gói</label>
          <input type="text" value="${escAttr(item.name)}" data-field="name" data-idx="${i}" /></div>
        <div class="adm-form-group"><label>Giá</label>
          <input type="text" value="${escAttr(item.price)}" data-field="price" data-idx="${i}" placeholder="990.000đ" /></div>
        <div class="adm-form-group"><label>Chu kỳ</label>
          <input type="text" value="${escAttr(item.period)}" data-field="period" data-idx="${i}" placeholder="trọn đời, tháng, năm..." /></div>
      </div>
      <div class="adm-form-group"><label>Tính năng gói (mỗi dòng 1 tính năng)</label>
        <textarea data-field="featuresRaw" data-idx="${i}" rows="4">${escText(item.featuresRaw || (Array.isArray(item.features) ? item.features.join("\n") : ""))}</textarea></div>
      <label style="display:flex;align-items:center;gap:8px;font-size:.85rem;color:#94a3b8;margin-top:8px;cursor:pointer">
        <input type="checkbox" data-check="featured" data-idx="${i}" ${item.featured ? "checked" : ""} />
        Đánh dấu "Phổ biến nhất"
      </label>
    </div>`
});

const landingFaqEditor = makeListEditor({
  listId: "landingFaqList",
  getArr: () => landingFaq, setArr: (a) => { landingFaq = a; },
  defaultItem: { q: "Câu hỏi thường gặp", a: "Câu trả lời..." },
  renderItem: (item, i) => `
    <div class="adm-item-card">
      <div class="adm-item-header"><span class="adm-item-title">FAQ ${i + 1}</span><button class="adm-item-del" data-idx="${i}">Xoá</button></div>
      <div class="adm-form-group"><label>Câu hỏi</label>
        <input type="text" value="${escAttr(item.q)}" data-field="q" data-idx="${i}" /></div>
      <div class="adm-form-group"><label>Câu trả lời</label>
        <textarea data-field="a" data-idx="${i}">${escText(item.a)}</textarea></div>
    </div>`
});

$("addLandingBenefitBtn")?.addEventListener("click", landingBenefitsEditor.addItem);
$("addLandingPricingBtn")?.addEventListener("click", landingPricingEditor.addItem);
$("addLandingFaqBtn")?.addEventListener("click", landingFaqEditor.addItem);

const renderPosts = () => {
  const list = $("postsList");
  if (!list) return;
  if (!posts.length) {
    list.innerHTML = '<p style="color:#64748b;font-size:.88rem">Chưa có bài viết nào. Bấm "+ Thêm bài viết" để tạo.</p>';
    return;
  }

  list.innerHTML = posts.map((p, i) => `
    <div class="adm-item-card">
      <div class="adm-item-header">
        <span class="adm-item-title">${escText(p.title || `Bài viết ${i + 1}`)}</span>
        <button class="adm-item-del" data-idx="${i}">Xoá</button>
      </div>
      <div class="adm-form-group" style="margin-bottom:10px">
        <label>Tiêu đề</label>
        <input type="text" value="${escAttr(p.title)}" data-field="title" data-idx="${i}" />
      </div>
      <div class="adm-item-grid">
        <div class="adm-form-group">
          <label>Ngày đăng</label>
          <input type="date" value="${escAttr(p.date)}" data-field="date" data-idx="${i}" />
        </div>
        <div class="adm-form-group">
          <label>Tag / Chuyên mục</label>
          <input type="text" value="${escAttr(p.tag)}" placeholder="VD: Tin tức, Khuyến mãi" data-field="tag" data-idx="${i}" />
        </div>
      </div>
      <div class="adm-form-group">
        <label>Tóm tắt</label>
        <textarea data-field="content" data-idx="${i}">${escText(p.content)}</textarea>
      </div>
    </div>
  `).join("");

  list.querySelectorAll("[data-field]").forEach((el) => {
    el.addEventListener("input", () => {
      const idx = Number(el.dataset.idx);
      const field = el.dataset.field;
      posts[idx][field] = el.value;
    });
  });

  list.querySelectorAll(".adm-item-del").forEach((btn) => {
    btn.addEventListener("click", () => {
      const idx = Number(btn.dataset.idx);
      posts.splice(idx, 1);
      renderPosts();
    });
  });
};

$("addPostBtn")?.addEventListener("click", () => {
  const now = new Date().toISOString().split("T")[0];
  posts.push({ title: "", content: "", date: now, tag: "" });
  renderPosts();
});

const parseRawLines = (raw, partCount) => String(raw || "")
  .split("\n")
  .map((line) => line.trim())
  .filter(Boolean)
  .map((line) => line.split("|").map((part) => part.trim()))
  .filter((parts) => parts.length >= partCount);

const renderCompanyCardsAdmin = () => {
  const list = $("companyCardsList");
  if (!list) return;
  if (!companyCards.length) {
    list.innerHTML = '<p style="color:#64748b;font-size:.88rem">Chưa có card dịch vụ. Bấm "+ Thêm card" để thêm.</p>';
    return;
  }

  list.innerHTML = companyCards.map((item, i) => `
    <div class="adm-item-card">
      <div class="adm-item-header">
        <span class="adm-item-title">Card dịch vụ ${i + 1}</span>
        <button class="adm-item-del" data-kind="card" data-idx="${i}">Xoá</button>
      </div>
      <div class="adm-item-grid">
        <div class="adm-form-group">
          <label>Biểu tượng (dùng khi không có ảnh)</label>
          <input type="text" value="${escAttr(item.icon)}" data-kind="card" data-field="icon" data-idx="${i}" placeholder="🏅" />
        </div>
        <div class="adm-form-group">
          <label>Tiêu đề</label>
          <input type="text" value="${escAttr(item.title)}" data-kind="card" data-field="title" data-idx="${i}" />
        </div>
      </div>
      <div class="adm-form-group">
        <label>Ảnh card (có thể dán URL)</label>
        <input type="url" value="${escAttr(item.imageUrl)}" data-kind="card" data-field="imageUrl" data-idx="${i}" placeholder="Để trống nếu dùng biểu tượng" />
      </div>
      <div class="adm-upload-row" style="margin-bottom:10px">
        ${item.imageUrl ? `<img class="adm-thumb-preview" src="${escAttr(item.imageUrl)}" alt="Ảnh card ${i + 1}" />` : ""}
        <button type="button" class="adm-btn-add js-pick-card-image" data-idx="${i}">📁 Chọn ảnh từ máy</button>
        <button type="button" class="adm-btn-add js-clear-card-image" data-idx="${i}">🗑 Xoá ảnh</button>
        <input type="file" accept="image/*" class="hidden js-card-image-input" data-idx="${i}" />
      </div>
      <div class="adm-form-group">
        <label>Mô tả</label>
        <textarea data-kind="card" data-field="desc" data-idx="${i}">${escText(item.desc)}</textarea>
      </div>
    </div>
  `).join("");

  list.querySelectorAll("[data-kind='card'][data-field]").forEach((el) => {
    el.addEventListener("input", () => {
      const idx = Number(el.dataset.idx);
      const field = el.dataset.field;
      companyCards[idx][field] = el.value;
    });
  });

  list.querySelectorAll(".js-pick-card-image").forEach((btn) => {
    btn.addEventListener("click", () => {
      const idx = Number(btn.dataset.idx);
      const input = list.querySelector(`.js-card-image-input[data-idx='${idx}']`);
      input?.click();
    });
  });

  list.querySelectorAll(".js-clear-card-image").forEach((btn) => {
    btn.addEventListener("click", () => {
      const idx = Number(btn.dataset.idx);
      companyCards[idx].imageUrl = "";
      renderCompanyCardsAdmin();
    });
  });

  list.querySelectorAll(".js-card-image-input").forEach((el) => {
    el.addEventListener("change", async () => {
      const idx = Number(el.dataset.idx);
      const file = el.files && el.files[0];
      if (!file) return;
      try {
        companyCards[idx].imageUrl = await readImageAsDataUrl(file);
      } catch {
        alert("Không đọc được ảnh card. Vui lòng thử lại.");
      }
      el.value = "";
      renderCompanyCardsAdmin();
    });
  });

  list.querySelectorAll(".adm-item-del[data-kind='card']").forEach((btn) => {
    btn.addEventListener("click", () => {
      const idx = Number(btn.dataset.idx);
      companyCards.splice(idx, 1);
      renderCompanyCardsAdmin();
    });
  });
};

const renderCompanyFlowAdmin = () => {
  const list = $("companyFlowList");
  if (!list) return;
  if (!companyFlow.length) {
    list.innerHTML = '<p style="color:#64748b;font-size:.88rem">Chưa có bước quy trình. Bấm "+ Thêm bước" để thêm.</p>';
    return;
  }

  list.innerHTML = companyFlow.map((item, i) => `
    <div class="adm-item-card">
      <div class="adm-item-header">
        <span class="adm-item-title">Bước ${i + 1}</span>
        <button class="adm-item-del" data-kind="flow" data-idx="${i}">Xoá</button>
      </div>
      <div class="adm-form-group" style="margin-bottom:10px">
        <label>Tiêu đề bước</label>
        <input type="text" value="${escAttr(item.title)}" data-kind="flow" data-field="title" data-idx="${i}" />
      </div>
      <div class="adm-form-group">
        <label>Mô tả bước</label>
        <textarea data-kind="flow" data-field="desc" data-idx="${i}">${escText(item.desc)}</textarea>
      </div>
    </div>
  `).join("");

  list.querySelectorAll("[data-kind='flow'][data-field]").forEach((el) => {
    el.addEventListener("input", () => {
      const idx = Number(el.dataset.idx);
      const field = el.dataset.field;
      companyFlow[idx][field] = el.value;
    });
  });

  list.querySelectorAll(".adm-item-del[data-kind='flow']").forEach((btn) => {
    btn.addEventListener("click", () => {
      const idx = Number(btn.dataset.idx);
      companyFlow.splice(idx, 1);
      renderCompanyFlowAdmin();
    });
  });
};

$("addCompanyCardBtn")?.addEventListener("click", () => {
  companyCards.push({ icon: "🏅", imageUrl: "", title: "Tiêu đề dịch vụ", desc: "Mô tả ngắn dịch vụ" });
  renderCompanyCardsAdmin();
});

$("addCompanyFlowBtn")?.addEventListener("click", () => {
  companyFlow.push({ title: "Tên bước", desc: "Mô tả bước" });
  renderCompanyFlowAdmin();
});

/* ================================================================
   SAVE
   ================================================================ */
$("admSaveBtn")?.addEventListener("click", () => {
  const cfg = loadDraftConfig();
  cfg.siteName = val("siteName");
  cfg.tagline = val("tagline");
  cfg.logoUrl = val("logoUrl");
  cfg.colorPrimary = val("colorPrimaryText") || $("colorPrimary")?.value || "";
  cfg.colorAccent = val("colorAccentText") || $("colorAccent")?.value || "";
  cfg.phone = val("phone");
  cfg.zalo = val("zalo");
  cfg.email = val("email");
  cfg.address = val("address");
  cfg.companyHeroEyebrow = val("companyHeroEyebrow");
  cfg.companyHeroTitle = val("companyHeroTitle");
  cfg.companyHeroDesc = val("companyHeroDesc");
  cfg.companyHeroImage = val("companyHeroImage");
  cfg.companyServicesTitle = val("companyServicesTitle");
  cfg.companyServicesDesc = val("companyServicesDesc");
  cfg.companyProcessTitle = val("companyProcessTitle");
  cfg.companyProcessDesc = val("companyProcessDesc");
  cfg.companyProofTitle = val("companyProofTitle");
  cfg.companyContactTitle = val("companyContactTitle");
  cfg.companyContactDesc = val("companyContactDesc");
  cfg.companyCards = companyCards
    .map((item) => ({
      icon: String(item.icon || "").trim(),
      imageUrl: String(item.imageUrl || "").trim(),
      title: String(item.title || "").trim(),
      desc: String(item.desc || "").trim()
    }))
    .filter((item) => item.title || item.desc);
  cfg.companyFlow = companyFlow
    .map((item) => ({ title: String(item.title || "").trim(), desc: String(item.desc || "").trim() }))
    .filter((item) => item.title || item.desc);
  // SHOP
  cfg.shopHeroTag = val("shopHeroTag");
  cfg.shopHeroHeadline = val("shopHeroHeadline");
  cfg.shopHeroDesc = val("shopHeroDesc");
  cfg.shopHeroOff = val("shopHeroOff");
  cfg.shopHeroOffEnds = val("shopHeroOffEnds");
  cfg.shopCategoriesRaw = val("shopCategoriesRaw");
  cfg.shopProducts = shopProducts
    .map((p) => ({ icon: String(p.icon || "").trim(), imageUrl: String(p.imageUrl || "").trim(), name: String(p.name || "").trim(), price: String(p.price || "").trim(), old: String(p.old || "").trim(), badge: String(p.badge || "").trim() }))
    .filter((p) => p.name);
  cfg.shopReviews = shopReviews
    .map((r) => ({ name: String(r.name || "").trim(), sub: String(r.sub || "").trim(), text: String(r.text || "").trim() }))
    .filter((r) => r.name || r.text);
  // SALON
  cfg.salonHeroEyebrow = val("salonHeroEyebrow");
  cfg.salonHeroTitle = val("salonHeroTitle");
  cfg.salonHeroDesc = val("salonHeroDesc");
  cfg.salonHeroImage = val("salonHeroImage");
  cfg.salonServices = salonServices
    .map((s) => ({ icon: String(s.icon || "").trim(), imageUrl: String(s.imageUrl || "").trim(), name: String(s.name || "").trim(), desc: String(s.desc || "").trim(), price: String(s.price || "").trim() }))
    .filter((s) => s.name);
  cfg.salonGallery = salonGallery
    .map((g) => ({ icon: String(g.icon || "").trim(), imageUrl: String(g.imageUrl || "").trim(), label: String(g.label || "").trim() }))
    .filter((g) => g.label || g.imageUrl);
  cfg.salonPricing = salonPricing
    .map((p) => ({ name: String(p.name || "").trim(), price: String(p.price || "").trim(), featuresRaw: String(p.featuresRaw || (Array.isArray(p.features) ? p.features.join("\n") : "")).trim(), featured: !!p.featured }))
    .filter((p) => p.name);
  cfg.salonReviews = salonReviews
    .map((r) => ({ name: String(r.name || "").trim(), sub: String(r.sub || "").trim(), text: String(r.text || "").trim() }))
    .filter((r) => r.name || r.text);
  // INDUSTRY
  cfg.industryHeroEyebrow = val("industryHeroEyebrow");
  cfg.industryHeroTitle = val("industryHeroTitle");
  cfg.industryHeroDesc = val("industryHeroDesc");
  cfg.industryHeroImage = val("industryHeroImage");
  cfg.industryPartnersRaw = val("industryPartnersRaw");
  cfg.industryCards = industryCards
    .map((c) => ({ icon: String(c.icon || "").trim(), imageUrl: String(c.imageUrl || "").trim(), title: String(c.title || "").trim(), desc: String(c.desc || "").trim() }))
    .filter((c) => c.title || c.desc);
  cfg.industryFlow = industryFlow
    .map((f) => ({ title: String(f.title || "").trim(), desc: String(f.desc || "").trim() }))
    .filter((f) => f.title || f.desc);
  // LANDING
  cfg.landingHeroEyebrow = val("landingHeroEyebrow");
  cfg.landingHeroTitle = val("landingHeroTitle");
  cfg.landingHeroDesc = val("landingHeroDesc");
  cfg.landingBenefits = landingBenefits
    .map((b) => ({ icon: String(b.icon || "").trim(), imageUrl: String(b.imageUrl || "").trim(), title: String(b.title || "").trim(), desc: String(b.desc || "").trim() }))
    .filter((b) => b.title || b.desc);
  cfg.landingPricing = landingPricing
    .map((p) => ({ name: String(p.name || "").trim(), price: String(p.price || "").trim(), period: String(p.period || "").trim(), featuresRaw: String(p.featuresRaw || (Array.isArray(p.features) ? p.features.join("\n") : "")).trim(), featured: !!p.featured }))
    .filter((p) => p.name);
  cfg.landingFaq = landingFaq
    .map((f) => ({ q: String(f.q || "").trim(), a: String(f.a || "").trim() }))
    .filter((f) => f.q || f.a);
  cfg.posts = JSON.parse(JSON.stringify(posts));
  saveDraftConfig(cfg);
  hasUnpublishedChanges = true;
  setDraftHint("Đã lưu tạm. Demo con chưa đổi cho tới khi bạn bấm \"Áp dụng lên demo con\".", "warn");
  showToast("✅ Đã lưu tạm!");
});

$("admPublishBtn")?.addEventListener("click", () => {
  const cfg = loadDraftConfig();
  publishDraftConfig(cfg);
  hasUnpublishedChanges = false;
  setDraftHint("Đã áp dụng lên demo con. Khách mở demo sẽ thấy nội dung mới.", "ok");
  showToast("🚀 Đã áp dụng lên demo con!");
});

$("admResetDraftBtn")?.addEventListener("click", () => {
  const confirmed = window.confirm("Lấy lại bản đang hiển thị ngoài demo?\nCác chỉnh sửa tạm chưa áp dụng sẽ bị ghi đè.");
  if (!confirmed) return;
  const publicCfg = loadPublicConfig();
  saveDraftConfig(publicCfg);
  populateForm(publicCfg);
  hasUnpublishedChanges = false;
  setDraftHint("Đã lấy lại bản đang hiển thị thành bản tạm để bạn sửa tiếp.", "info");
  showToast("↺ Đã lấy lại bản đang hiển thị");
});

/* ================================================================
   LOAD CONFIG INTO FORM
   ================================================================ */
const populateForm = (cfg) => {
  const set = (id, v) => { const el = $(id); if (el) el.value = v || ""; };
  const setChecked = (id, v) => { const el = $(id); if (el) el.checked = !!v; };
  set("siteName", cfg.siteName);
  set("tagline", cfg.tagline);
  set("logoUrl", cfg.logoUrl);
  set("colorPrimary", cfg.colorPrimary || "#1a3c6e");
  set("colorPrimaryText", cfg.colorPrimary || "#1a3c6e");
  set("colorAccent", cfg.colorAccent || "#1e88e5");
  set("colorAccentText", cfg.colorAccent || "#1e88e5");
  set("phone", cfg.phone);
  set("zalo", cfg.zalo);
  set("email", cfg.email);
  set("address", cfg.address);
  set("companyHeroEyebrow", cfg.companyHeroEyebrow);
  set("companyHeroTitle", cfg.companyHeroTitle);
  set("companyHeroDesc", cfg.companyHeroDesc);
  set("companyHeroImage", cfg.companyHeroImage);
  set("companyServicesTitle", cfg.companyServicesTitle);
  set("companyServicesDesc", cfg.companyServicesDesc);
  set("companyProcessTitle", cfg.companyProcessTitle);
  set("companyProcessDesc", cfg.companyProcessDesc);
  set("companyProofTitle", cfg.companyProofTitle);
  set("companyContactTitle", cfg.companyContactTitle);
  set("companyContactDesc", cfg.companyContactDesc);
  const cardsFromRaw = parseRawLines(cfg.companyCardsRaw, 3).map((parts) => ({ icon: parts[0], imageUrl: "", title: parts[1], desc: parts[2] }));
  const flowFromRaw = parseRawLines(cfg.companyFlowRaw, 2).map((parts) => ({ title: parts[0], desc: parts[1] }));
  const cardsFromConfig = Array.isArray(cfg.companyCards)
    ? cfg.companyCards.map((item) => ({
      icon: String(item?.icon || "").trim() || "🏅",
      imageUrl: String(item?.imageUrl || "").trim(),
      title: String(item?.title || "").trim(),
      desc: String(item?.desc || "").trim()
    }))
    : [];
  companyCards = cardsFromConfig.length ? cardsFromConfig : cardsFromRaw;
  companyFlow = Array.isArray(cfg.companyFlow) && cfg.companyFlow.length ? cfg.companyFlow : flowFromRaw;
  renderCompanyCardsAdmin();
  renderCompanyFlowAdmin();
  posts = Array.isArray(cfg.posts) ? cfg.posts : [];
  renderPosts();
  // SHOP
  set("shopHeroTag", cfg.shopHeroTag);
  set("shopHeroHeadline", cfg.shopHeroHeadline);
  set("shopHeroDesc", cfg.shopHeroDesc);
  set("shopHeroOff", cfg.shopHeroOff);
  set("shopHeroOffEnds", cfg.shopHeroOffEnds);
  set("shopCategoriesRaw", cfg.shopCategoriesRaw);
  shopProducts = Array.isArray(cfg.shopProducts) ? cfg.shopProducts : [];
  shopReviews = Array.isArray(cfg.shopReviews) ? cfg.shopReviews : [];
  shopProductsEditor.render();
  shopReviewsEditor.render();
  // SALON
  set("salonHeroEyebrow", cfg.salonHeroEyebrow);
  set("salonHeroTitle", cfg.salonHeroTitle);
  set("salonHeroDesc", cfg.salonHeroDesc);
  set("salonHeroImage", cfg.salonHeroImage);
  salonServices = Array.isArray(cfg.salonServices) ? cfg.salonServices : [];
  salonGallery = Array.isArray(cfg.salonGallery) ? cfg.salonGallery : [];
  salonPricing = Array.isArray(cfg.salonPricing) ? cfg.salonPricing : [];
  salonReviews = Array.isArray(cfg.salonReviews) ? cfg.salonReviews : [];
  salonServicesEditor.render();
  salonGalleryEditor.render();
  salonPricingEditor.render();
  salonReviewsEditor.render();
  // INDUSTRY
  set("industryHeroEyebrow", cfg.industryHeroEyebrow);
  set("industryHeroTitle", cfg.industryHeroTitle);
  set("industryHeroDesc", cfg.industryHeroDesc);
  set("industryHeroImage", cfg.industryHeroImage);
  set("industryPartnersRaw", cfg.industryPartnersRaw);
  industryCards = Array.isArray(cfg.industryCards) ? cfg.industryCards : [];
  industryFlow = Array.isArray(cfg.industryFlow) ? cfg.industryFlow : [];
  industryCardsEditor.render();
  industryFlowEditor.render();
  // LANDING
  set("landingHeroEyebrow", cfg.landingHeroEyebrow);
  set("landingHeroTitle", cfg.landingHeroTitle);
  set("landingHeroDesc", cfg.landingHeroDesc);
  landingBenefits = Array.isArray(cfg.landingBenefits) ? cfg.landingBenefits : [];
  landingPricing = Array.isArray(cfg.landingPricing) ? cfg.landingPricing : [];
  landingFaq = Array.isArray(cfg.landingFaq) ? cfg.landingFaq : [];
  landingBenefitsEditor.render();
  landingPricingEditor.render();
  landingFaqEditor.render();
};

/* ================================================================
   LOGIN
   ================================================================ */
const showPanel = async () => {
  $("admLogin").classList.add("hidden");
  $("admPanel").classList.remove("hidden");
  await loadRemoteTemplateConfig();
  const cfg = loadDraftConfig();
  populateForm(cfg);
  renderPresets();
  syncColor("colorPrimary", "colorPrimaryText");
  syncColor("colorAccent", "colorAccentText");
  $("admSidebarLogo").textContent = `Admin: ${slug}`;
  const viewLink = $("admViewSite");
  if (viewLink) viewLink.href = `/preview/${slug}?demo=${demoVariant}`;
  bindImagePicker("logoFileInput", "pickLogoFileBtn", "clearLogoFileBtn", "logoUrl");
  bindImagePicker("companyHeroImageInput", "pickCompanyHeroImageBtn", "clearCompanyHeroImageBtn", "companyHeroImage");
  bindImagePicker("salonHeroImageInput", "pickSalonHeroImageBtn", "clearSalonHeroImageBtn", "salonHeroImage");
  bindImagePicker("industryHeroImageInput", "pickIndustryHeroImageBtn", "clearIndustryHeroImageBtn", "industryHeroImage");
  // Show correct per-template content block
  document.querySelectorAll(".adm-content-block").forEach((el) => el.classList.add("hidden"));
  const contentBlock = $(`content-${slug}`);
  if (contentBlock) contentBlock.classList.remove("hidden");
  renderContentMapping();
  setDraftHint("Bạn đang sửa bản tạm. Demo con ngoài trang chỉ đổi khi bấm \"Áp dụng lên demo con\".", "info");
};

$("loginBtn")?.addEventListener("click", () => {
  if ($("loginPwd").value === ADMIN_PASSWORD) { login(); void showPanel(); }
  else {
    $("loginPwd").style.borderColor = "#f87171";
    setTimeout(() => { $("loginPwd").style.borderColor = ""; }, 1500);
  }
});

$("loginPwd")?.addEventListener("keydown", (e) => {
  if (e.key === "Enter") $("loginBtn").click();
});

$("admLogout")?.addEventListener("click", logout);

document.addEventListener("input", () => {
  hasUnpublishedChanges = true;
});

window.addEventListener("beforeunload", (e) => {
  if (!hasUnpublishedChanges) return;
  e.preventDefault();
  e.returnValue = "Bạn còn thay đổi chưa áp dụng lên demo con.";
});

/* ================================================================
   INIT
   ================================================================ */
if (isLoggedIn()) void showPanel();
