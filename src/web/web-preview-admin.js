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

const slug = parseSlug();
const CONFIG_KEY = `preview_config_${slug}`;

const loadConfig = () => {
  try { return JSON.parse(localStorage.getItem(CONFIG_KEY) || "{}"); }
  catch { return {}; }
};

const saveConfig = (cfg) => {
  cfg._v = CONFIG_VERSION;
  cfg._saved = new Date().toISOString();
  localStorage.setItem(CONFIG_KEY, JSON.stringify(cfg));
};

const isLoggedIn = () => sessionStorage.getItem("adm_auth") === "1";
const login = () => sessionStorage.setItem("adm_auth", "1");
const logout = () => { sessionStorage.removeItem("adm_auth"); location.reload(); };

/* ================================================================
   UI UTILITIES
   ================================================================ */
const $ = (id) => document.getElementById(id);
const val = (id) => ($( id)?.value || "").trim();

const showToast = () => {
  const t = $("admToast");
  t.classList.remove("hidden");
  setTimeout(() => t.classList.add("hidden"), 2800);
};

/* ================================================================
   TABS
   ================================================================ */
const TABS = { general: "Thông tin site", colors: "Màu sắc", posts: "Bài viết / Blog", pricing: "Bảng giá", contact: "Liên hệ" };

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
   POSTS
   ================================================================ */
let posts = [];

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
        <span class="adm-item-title">${p.title || `Bài viết ${i + 1}`}</span>
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

/* ================================================================
   PRICING
   ================================================================ */
let pricing = [];

const renderPricing = () => {
  const list = $("pricingList");
  if (!list) return;
  if (!pricing.length) {
    list.innerHTML = '<p style="color:#64748b;font-size:.88rem">Chưa có gói giá. Bấm "+ Thêm gói giá" để tạo.</p>';
    return;
  }
  list.innerHTML = pricing.map((p, i) => `
    <div class="adm-item-card">
      <div class="adm-item-header">
        <span class="adm-item-title">${p.name || `Gói giá ${i + 1}`}</span>
        <button class="adm-item-del" data-idx="${i}">Xoá</button>
      </div>
      <div class="adm-item-grid">
        <div class="adm-form-group">
          <label>Tên gói</label>
          <input type="text" value="${escAttr(p.name)}" data-field="name" data-idx="${i}" placeholder="VD: Gói Cơ Bản" />
        </div>
        <div class="adm-form-group">
          <label>Giá</label>
          <input type="text" value="${escAttr(p.price)}" data-field="price" data-idx="${i}" placeholder="VD: 500.000đ/tháng" />
        </div>
      </div>
      <div class="adm-form-group" style="margin-top:6px">
        <label>Phù hợp / Mô tả gói</label>
        <input type="text" value="${escAttr(p.fit)}" data-field="fit" data-idx="${i}" placeholder="VD: Doanh nghiệp mới bắt đầu" />
      </div>
      <div class="adm-form-group" style="margin-top:10px">
        <label>Tính năng gói (mỗi dòng 1 tính năng)</label>
        <textarea data-field="featuresRaw" data-idx="${i}" rows="4" placeholder="Tính năng 1&#10;Tính năng 2&#10;Tính năng 3">${escText((p.features || []).join("\n"))}</textarea>
      </div>
    </div>
  `).join("");

  list.querySelectorAll("[data-field]").forEach((el) => {
    el.addEventListener("input", () => {
      const idx = Number(el.dataset.idx);
      const field = el.dataset.field;
      if (field === "featuresRaw") {
        pricing[idx].features = el.value.split("\n").map((s) => s.trim()).filter(Boolean);
      } else {
        pricing[idx][field] = el.value;
      }
    });
  });
  list.querySelectorAll(".adm-item-del").forEach((btn) => {
    btn.addEventListener("click", () => {
      pricing.splice(Number(btn.dataset.idx), 1);
      renderPricing();
    });
  });
};

$("addPriceBtn")?.addEventListener("click", () => {
  pricing.push({ name: "", price: "", fit: "", features: [] });
  renderPricing();
});

/* ================================================================
   SAVE
   ================================================================ */
$("admSaveBtn")?.addEventListener("click", () => {
  const cfg = loadConfig();
  cfg.siteName = val("siteName");
  cfg.tagline = val("tagline");
  cfg.logoUrl = val("logoUrl");
  cfg.colorPrimary = val("colorPrimaryText") || $("colorPrimary")?.value || "";
  cfg.colorAccent = val("colorAccentText") || $("colorAccent")?.value || "";
  cfg.phone = val("phone");
  cfg.zalo = val("zalo");
  cfg.email = val("email");
  cfg.address = val("address");
  cfg.posts = JSON.parse(JSON.stringify(posts));
  cfg.pricing = JSON.parse(JSON.stringify(pricing));
  saveConfig(cfg);
  showToast();
});

/* ================================================================
   LOAD CONFIG INTO FORM
   ================================================================ */
const populateForm = (cfg) => {
  const set = (id, v) => { const el = $(id); if (el) el.value = v || ""; };
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
  posts = Array.isArray(cfg.posts) ? cfg.posts : [];
  pricing = Array.isArray(cfg.pricing) ? cfg.pricing : [];
  renderPosts();
  renderPricing();
};

/* ================================================================
   LOGIN
   ================================================================ */
const showPanel = () => {
  $("admLogin").classList.add("hidden");
  $("admPanel").classList.remove("hidden");
  const cfg = loadConfig();
  populateForm(cfg);
  renderPresets();
  syncColor("colorPrimary", "colorPrimaryText");
  syncColor("colorAccent", "colorAccentText");
  $("admSidebarLogo").textContent = `Admin: ${slug}`;
  const viewLink = $("admViewSite");
  if (viewLink) viewLink.href = `/preview/${slug}`;
};

$("loginBtn")?.addEventListener("click", () => {
  if ($("loginPwd").value === ADMIN_PASSWORD) { login(); showPanel(); }
  else {
    $("loginPwd").style.borderColor = "#f87171";
    setTimeout(() => { $("loginPwd").style.borderColor = ""; }, 1500);
  }
});

$("loginPwd")?.addEventListener("keydown", (e) => {
  if (e.key === "Enter") $("loginBtn").click();
});

$("admLogout")?.addEventListener("click", logout);

/* ================================================================
   HELPERS
   ================================================================ */
const escAttr = (v) => String(v || "").replace(/[&"<>]/g, (c) => ({ "&": "&amp;", '"': "&quot;", "<": "&lt;", ">": "&gt;" }[c]));
const escText = (v) => String(v || "").replace(/[&<>]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;" }[c]));

/* ================================================================
   INIT
   ================================================================ */
if (isLoggedIn()) showPanel();
