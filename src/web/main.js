/* ═══ main.js — storefront frontend ═══ */
const productList = document.getElementById("productList");
const langToggle  = document.getElementById("langToggle");
const catTabs     = document.getElementById("catTabs");
const searchInput = document.getElementById("searchInput");
const catalogNotice = document.getElementById("catalogNotice");

/* ── DOM refs: auth & drawer ── */
const navLoginBtn      = document.getElementById("navLoginBtn");
const navMyProducts    = document.getElementById("navMyProducts");
const userMenu         = document.getElementById("userMenu");
const userMenuBtn      = document.getElementById("userMenuBtn");
const userEmail        = document.getElementById("userEmail");
const userDropdown     = document.getElementById("userDropdown");
const loginModal       = document.getElementById("loginModal");
const loginModalClose  = document.getElementById("loginModalClose");
const loginForm        = document.getElementById("loginForm");
const loginError       = document.getElementById("loginError");
const forgotPasswordLink = document.getElementById("forgotPasswordLink");
const googleLoginWrap  = document.getElementById("googleLoginWrap");
const googleLoginBtn   = document.getElementById("googleLoginBtn");
const googleRegisterWrap = document.getElementById("googleRegisterWrap");
const googleRegisterBtn  = document.getElementById("googleRegisterBtn");
const registerCodeInput = document.getElementById("registerCode");
const sendRegisterCodeBtn = document.getElementById("sendRegisterCodeBtn");
const supportDock = document.getElementById("supportDock");
const supportDockToggle = document.getElementById("supportDockToggle");
const dropMyProducts   = document.getElementById("dropMyProducts");
const dropLogout       = document.getElementById("dropLogout");
const headerSearchWrap = document.getElementById("headerSearchWrap");
const routeLinks = Array.from(document.querySelectorAll("[data-route-link]"));
const routedSections = Array.from(document.querySelectorAll("[data-views]"));
const homeHeroBadge = document.getElementById("homeHeroBadge");
const homeHeroTitleMain = document.getElementById("homeHeroTitleMain");
const homeHeroTitleSub = document.getElementById("homeHeroTitleSub");
const homeHeroTitleTail = document.getElementById("homeHeroTitleTail");
const homeHeroDesc = document.getElementById("homeHeroDesc");
const homeHeroPrimaryCta = document.getElementById("homeHeroPrimaryCta");
const homeHeroSecondaryCta = document.getElementById("homeHeroSecondaryCta");
const homePathwaysEyebrow = document.getElementById("homePathwaysEyebrow");
const homePathwaysTitle = document.getElementById("homePathwaysTitle");
const homePathwaysSub = document.getElementById("homePathwaysSub");
const homePathwayGrid = document.getElementById("homePathwayGrid");
const homeBenefitsEyebrow = document.getElementById("homeBenefitsEyebrow");
const homeBenefitsTitle = document.getElementById("homeBenefitsTitle");
const homeBenefitsSub = document.getElementById("homeBenefitsSub");
const homeBenefitsGrid = document.getElementById("homeBenefitsGrid");
const pageHeroKicker = document.getElementById("pageHeroKicker");
const pageHeroTitle = document.getElementById("pageHeroTitle");
const pageHeroDesc = document.getElementById("pageHeroDesc");
const pageHeroTags = document.getElementById("pageHeroTags");
const pageHeroActions = document.getElementById("pageHeroActions");
const pageHeroSide = document.getElementById("pageHeroSide");
const pageHeroVideo = document.querySelector(".page-hero-video");
const pageHeroVideoSource = document.querySelector(".page-hero-video source");
const routeStoryContent = document.getElementById("routeStoryContent");
const webBuildContent = document.getElementById("webBuildContent");
const catalogEyebrow = document.getElementById("catalogEyebrow");
const catalogTitle = document.getElementById("catalogTitle");
const catalogSub = document.getElementById("catalogSub");
const productsTitle = document.getElementById("productsTitle");
const howEyebrow = document.getElementById("howEyebrow");
const howTitle = document.getElementById("howTitle");
const howSub = document.getElementById("howSub");
const webDemoEyebrow = document.getElementById("webDemoEyebrow");
const webDemoSectionTitle = document.getElementById("webDemoSectionTitle");
const webDemoSectionSub = document.getElementById("webDemoSectionSub");
const footerCtaTitle = document.getElementById("footerCtaTitle");
const footerCtaDesc = document.getElementById("footerCtaDesc");
const supportDockEyebrow = document.getElementById("supportDockEyebrow");
const supportDockTitle = document.getElementById("supportDockTitle");
const supportDockCopy = document.getElementById("supportDockCopy");
const supportZaloTitle = document.getElementById("supportZaloTitle");
const supportZaloSub = document.getElementById("supportZaloSub");
const supportPhoneTitle = document.getElementById("supportPhoneTitle");
const supportPhoneSub = document.getElementById("supportPhoneSub");
const supportRouteAction = document.getElementById("supportRouteAction");
const supportRouteTitle = document.getElementById("supportRouteTitle");
const supportRouteSub = document.getElementById("supportRouteSub");

const SUPPORT_DOCK_STORAGE_KEY = "wst_support_dock_collapsed";

function syncSupportDockState(collapsed) {
  if (!supportDock || !supportDockToggle) {
    return;
  }

  supportDock.classList.toggle("is-collapsed", collapsed);
  supportDockToggle.setAttribute("aria-expanded", String(!collapsed));
  const icon = supportDockToggle.querySelector(".support-dock-toggle-icon");
  const text = supportDockToggle.querySelector(".support-dock-toggle-text");
  if (icon) {
    icon.textContent = collapsed ? "?" : "✕";
  }
  if (text) {
    text.textContent = collapsed ? "Hỗ trợ" : "Thu gọn";
  }
}

function initSupportDock() {
  if (!supportDock || !supportDockToggle) {
    return;
  }

  const collapsed = localStorage.getItem(SUPPORT_DOCK_STORAGE_KEY) === "1";
  syncSupportDockState(collapsed);
  supportDockToggle.addEventListener("click", () => {
    const nextCollapsed = !supportDock.classList.contains("is-collapsed");
    syncSupportDockState(nextCollapsed);
    localStorage.setItem(SUPPORT_DOCK_STORAGE_KEY, nextCollapsed ? "1" : "0");
  });
}

initSupportDock();

/* ── fallback demo data when API/DB unavailable ── */
const fallbackProducts = [
  { id:"demo-test2k", appId:"lamviec", name:"Gói test thanh toán 2K",     cycle:"one_time", price:2000,   credits:1 },
  { id:"prod-study-month", appId:"app-study-12",  name:"Phần mềm ôn tập cho khối cấp 01 và Tiền Tiểu học", cycle:"monthly", price:89000,  credits:120 },
  { id:"prod-study-year", appId:"app-study-12",  name:"Phần mềm ôn tập cho khối cấp 01 và Tiền Tiểu học", cycle:"yearly", price:599000,  credits:1800 },
  { id:"prod-study-premium-month", appId:"app-study-12",  name:"Phần mềm ôn tập cho khối cấp 01 và Tiền Tiểu học", cycle:"monthly", price:119000,  credits:240 },
  { id:"prod-study-premium-year", appId:"app-study-12",  name:"Phần mềm ôn tập cho khối cấp 01 và Tiền Tiểu học", cycle:"yearly", price:899000,  credits:3600 },
  { id:"prod-study-standard-lifetime", appId:"app-study-12",  name:"Phần mềm ôn tập cho khối cấp 01 và Tiền Tiểu học", cycle:"one_time", price:1299000,  credits:9990 },
  { id:"prod-study-premium-lifetime", appId:"app-study-12",  name:"Phần mềm ôn tập cho khối cấp 01 và Tiền Tiểu học", cycle:"one_time", price:1599000,  credits:15990 },
  { id:"demo-hoc12", appId:"app-cap12", name:"Phần mềm học tập khối cấp 12", cycle:"one_time", price:2000, credits:1 },
  { id:"demo-map",   appId:"map-pro", name:"Phần Mềm Quét Data Khách Hàng Trên Google Map", cycle:"one_time", price:499000, credits:0 },
  { id:"demo-cv1",   appId:"lamviec", name:"Phần mềm tạo video đồng bộ nhân vật", cycle:"monthly",  price:399000, credits:2 },
  { id:"demo-cv2",   appId:"lamviec", name:"Phần mềm quản lý site bất động sản và bài viết", cycle:"monthly",  price:300000, credits:2 },
  { id:"prod-prompt-lifetime", appId:"app-prompt-image-video", name:"Video Creator - Phần mềm tạo prompt và điều phối AI Video trong một nơi", cycle:"one_time", price:249000, credits:0 },
  { id:"prod-bds-website-lifetime", appId:"app-bds-website-manager", name:"Phần Mềm Quản Lý Website & Tin Đăng Bất Động Sản", cycle:"one_time", price:350000, credits:0 },
  { id:"prod-salon-manager-lifetime", appId:"hair-spa-manager", name:"Salon Manager", cycle:"one_time", price:990000, credits:0 }
];

function imagePathByName(fileName) {
  return `/products/image/${encodeURIComponent(fileName)}`;
}

const productImageLibrary = {
  study01: imagePathByName("phần mềm học tập khối cấp 01.jpeg"),
  study01Alt: imagePathByName("phần mềm học tập khối cấp 01_2.jpeg"),
  study12: imagePathByName("phần mềm học tập khối cấp 12.jpeg"),
  map: imagePathByName("Phần mềm quét data KH-GGmap.jpeg"),
  mapAlt: imagePathByName("Phần mềm quét data KH-GGmap-2.jpeg"),
  video: imagePathByName("Phần mềm tạo video đồng bộ nhân vật.jpeg"),
  bds: imagePathByName("Quản_lý_website_BDS.jpeg"),
  salon: imagePathByName("Salon-Manager.png")
};

function normalizeText(value) {
  return String(value || "")
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, " ")
    .trim();
}

function isInternalTestProduct(product) {
  const id = normalizeText(product?.id);
  const name = normalizeText(product?.name);
  return id === "prod test 2k" || id === "demo test2k" || /(test\s*2k|sepay\s*test|internal\s*test)/.test(name);
}

function resolveProductImage(product) {
  const name = normalizeText(product?.name);
  const appId = normalizeText(product?.appId);
  const productId = normalizeText(product?.id);
  const hint = `${name} ${appId} ${productId}`;

  if (/(prod study month)/.test(productId)) {
    return productImageLibrary.study01Alt;
  }
  const isStudy = /(hoc|study|cap|lop)/.test(hint);
  if (/(goi test 2k|test 2k|prod test 2k|demo test2k)/.test(hint)) {
    return productImageLibrary.study01;
  }
  if (/(cap 01|cap 1|lop 1|study 01|study 1|khoi 01|khoi 1)/.test(hint)) {
    return productImageLibrary.study01;
  }
  if (/(cap 12|lop 12|study 12|khoi 12)/.test(hint)) {
    return productImageLibrary.study12;
  }
  if (/(map|ggmap|quet data|scan data|data kh)/.test(hint)) {
    return productImageLibrary.map;
  }
  if (/(salon manager|hair spa manager|hair spa|salon)/.test(hint)) {
    return productImageLibrary.salon;
  }
  if (/(bds|website)/.test(productId)) {
    return productImageLibrary.bds;
  }
  if (/(video|dong bo|nhan vat|lip sync)/.test(hint)) {
    return productImageLibrary.video;
  }
  if (/(bat dong san|bds|website)/.test(hint)) {
    return productImageLibrary.bds;
  }

  if (isStudy || /study/.test(appId)) {
    return productImageLibrary.study12;
  }
  if (/(lam viec|work)/.test(hint) || /lamviec/.test(appId)) {
    return productImageLibrary.mapAlt;
  }

  if (product?.image) {
    return product.image;
  }

  return "";
}

/* ── category icon map ── */
const catIcons = {
  hoctap:"", lamviec:"", default:""
};

/* ── fixed category list ── */
const fixedCategories = ["hoctap","lamviec"];

/* ── i18n ── */
const T = {
  vi:{
    meta_title:"Ứng Dụng Thông Minh - Mua key phần mềm bản quyền giá tốt",
    brand_tagline:"Key bản quyền",
    announce:"🔥 Thanh toán linh hoạt — giao key tự động ngay sau khi thanh toán thành công",
    search_placeholder:"Tìm sản phẩm...",
    nav_products:"Sản phẩm", nav_web_design:"Thiết kế Web", nav_lookup:"Hướng dẫn mua hàng", nav_login:"Đăng nhập", nav_admin:"Admin",
    nav_my_products:"Sản phẩm đã mua", nav_balance:"Số dư", nav_logout:"Đăng xuất",
    hero_badge:"⚡ Hệ sinh thái giải pháp số",
    hero_title_kicker:"Website, phần mềm, công cụ AI",
    hero_line_a:"Giải pháp số",
    hero_line_b:"gọn, nhanh,",
    hero_line_c:"dùng được ngay",
    hero_line1:"Giải pháp số gọn, nhanh, dùng được ngay", hero_line2:"",
    hero_sub:"Chọn đúng công cụ cho công việc của bạn.",
    hero_guide:"Cách hoạt động",
    hero_logo_key:"Dashboard nhanh",
    hero_logo_app:"AI chat & form",
    hero_logo_pro:"Biểu đồ rõ",
    hero_logo_web_tile:"Checkout gọn",
    how_title:"Hướng dẫn mua hàng",
    how_sub:"3 bước nhanh để mua và nhận key/app",
    step1_t:"Chọn sản phẩm",
    step1_d:"Chọn app hoặc key phù hợp với nhu cầu của bạn.",
    step2_t:"Thanh toán",
    step2_d:"Quét QR và hoàn tất thanh toán nhanh.",
    step3_t:"Nhận key / quyền dùng",
    step3_d:"Hệ thống trả key hoặc quyền tải app ngay sau thanh toán.",
    wallet_title:"💰 Số dư Credit",
    wallet_empty:"Chưa có credit",
    purchased_subs_title:"📋 Gói đang sử dụng",
    purchased_keys_title:"🔑 Key đã nhận",
    purchased_orders_title:"🛒 Lịch sử đơn hàng",
    purchased_empty:"Bạn chưa mua sản phẩm nào",
    renewal_btn:"Gia hạn",
    auto_renew_on:"Tự động gia hạn: BẬT",
    auto_renew_off:"Tự động gia hạn: TẮT",
    expiring_soon:"Sắp hết hạn",
    expired:"Đã hết hạn",
    status_active:"Đang hoạt động",
    active_until:"Đến"
  },
  en:{
    meta_title:"Ứng Dụng Thông Minh - Buy genuine software keys",
    brand_tagline:"Licensed software keys",
    announce:"🔥 Pay with Sepay — automatic key delivery right after transfer",
    search_placeholder:"Search products...",
    nav_products:"Products", nav_web_design:"Web Design", nav_lookup:"Buying guide", nav_login:"Login", nav_admin:"Admin",
    nav_my_products:"My Products", nav_balance:"Balance", nav_logout:"Logout",
    hero_badge:"⚡ Digital solution ecosystem",
    hero_title_kicker:"Websites, software, AI tools",
    hero_line_a:"Digital solutions",
    hero_line_b:"lean and fast,",
    hero_line_c:"ready to use",
    hero_line1:"Lean digital solutions, ready to use", hero_line2:"",
    hero_sub:"Choose the right tool for your work.",
    hero_guide:"How it works",
    hero_logo_key:"Fast dashboards",
    hero_logo_app:"AI chat & forms",
    hero_logo_pro:"Clear analytics",
    hero_logo_web_tile:"Lean checkout",
    hero_logo_web:"Professional website design",
    hero_logo_web_sub:"Landing pages, sales sites, brand websites",
    web_spotlight_badge:"Web design",
    web_spotlight_title:"Professional website design",
    web_spotlight_sub:"Landing pages, sales sites, and brand websites delivered cleanly.",
    web_demo_eyebrow:"Web Demo",
    web_demo_title:"Professional Website Design",
    web_demo_sub:"View website demo samples by popular industry.",
    web_demo_view:"View web demo",
    trust_products:"Products", trust_orders:"Orders delivered", trust_rating:"Rating", trust_support:"Support",
    cat_title:"Product categories", cat_sub:"Choose a category or browse all products below", cat_all:"All",
    cat_hoctap:"Study", cat_lamviec:"Work",
    products_title:"Best sellers",
    how_title:"How to buy", how_sub:"Just 3 simple steps to get your key",
    step1_t:"Choose product", step1_d:"Browse categories, pick the right plan and click Buy now.",
    step2_t:"Make payment", step2_d:"Scan QR code automatically, fast and easy.",
    step3_t:"Get key instantly", step3_d:"The key appears on the payment page and in the email right after successful payment.",
    footer_desc:"Automated software key marketplace. Pay with Sepay, get key instantly.",
    footer_quick:"Quick links", footer_policy:"Policies", footer_contact:"Contact",
    card_buy:"Buy now", card_sold:"sold",
    card_status_locked:"Locked",
    card_status_coming_soon:"Coming soon",
    card_cta_locked:"See lock reason",
    card_cta_coming_soon:"Preview product",
    card_note_locked:"This product is temporarily locked while being updated or fixed.",
    card_note_coming_soon:"This product is being teased before sales open.",
    tag_best:"RECOMMENDED",
    cycle_monthly:"Monthly", cycle_yearly:"Yearly", cycle_one_time:"One-time",
    error_create:"Unable to create order",
    notice_fallback:"Showing demo data — API/DB not ready.",
    notice_empty:"Catalog is empty, please seed data.",
    notice_preview_title:"Running in preview mode",
    notice_preview_detail:"Demo products are shown so the homepage still renders. Configure DATABASE_URL on Vercel to create real orders.",
    notice_db_down_detail:"The API is up but the database is not connected. The homepage is temporarily using demo data.",
    notice_live_title:"Catalog connection is live",
    notice_live_detail:"Product data is being loaded from the live API.",
    notice_search_empty:"No products match the current filter.",
    alert_preview:"Preview mode: API/DB not ready. Please start PostgreSQL to create real orders.",
    modal_login_title:"Login",
    modal_login_desc:"Enter your email to login.",
    modal_login_email_label:"Email",
    modal_login_password_label:"Password",
    modal_login_btn:"Login",
    modal_login_error_email:"Please enter a valid email",
    modal_login_error_password:"Password must be at least 8 characters",
    modal_login_error_db:"Cannot login. Please try again.",
    modal_auth_error_network:"Cannot reach the server. Please try again.",
    modal_login_no_account:"Don't have an account?",
    modal_register_link:"Register now",
    modal_register_title:"Register",
    modal_register_desc:"Enter email and name to create a new account.",
    modal_register_name_label:"Full name",
    modal_register_password_label:"Password",
    modal_register_btn:"Register",
    modal_register_error_name:"Please enter your name",
    modal_register_error_password:"Password must be at least 8 characters",
    modal_register_has_account:"Already have an account?",
    modal_login_link:"Login now",
    modal_google_or:"Or continue with Google",
    modal_google_not_ready:"Google sign-in is not enabled.",
    modal_google_failed:"Unable to continue with Google. Please try again.",
    nav_register:"Register",
    testimonials_title:"Customer Reviews",
    testimonials_sub:"Over 10,000 satisfied customers",
    testimonial_1:"\"Key delivered very fast, works immediately, great quality. Will be back.\"",
    testimonial_author_1:"Dung LE",
    testimonial_2:"\"Helpful consultants, 24/7 support. Very trustworthy. Good prices.\"",
    testimonial_author_2:"Nga Truong",
    testimonial_3:"\"Bought 5 times already. Always reliable. Especially fast support.\"",
    testimonial_author_3:"Tran NGoc Hai",
    purchased_title:"My Purchased Products",
    wallet_title:"💰 Credit Balance",
    wallet_empty:"No credits yet",
    purchased_subs_title:"📋 Active Subscriptions",
    purchased_keys_title:"🔑 Delivered Keys",
    purchased_orders_title:"🛒 Order History",
    purchased_empty:"No purchases yet",
    renewal_btn:"Renew",
    auto_renew_on:"Auto-renew: ON",
    auto_renew_off:"Auto-renew: OFF",
    expiring_soon:"Expiring soon",
    expired:"Expired",
    status_active:"Active",
    active_until:"Until"
  }
};

let lang = localStorage.getItem("wst_lang") || "vi";
let allProducts = [];
let activeCat = "all";
let currentUser = null; // { customer, wallets, subscriptions, orders, keyDeliveries, ... }
let pendingPostAuthRedirect = null;
let googleAuthInitialized = false;
let googleAuthClientId = "";
let googleAuthInitAttempts = 0;
let catalogMode = "loading";
const ACCOUNT_DOWNLOADS_PATH = "/account?tab=downloads";

function t(k){ return (T[lang]||T.vi)[k] || k; }

function getRouteName(pathname = window.location.pathname) {
  const cleaned = String(pathname || "/").replace(/\/+$/, "") || "/";
  if (cleaned === "/" || cleaned === "/pricing") return "home";
  if (cleaned === "/thiet-ke-web") return "web";
  if (cleaned === "/mau-demo" || cleaned === "/thiet-ke-web/mau-demo") return "demo";
  if (cleaned === "/phan-mem" || cleaned === "/san-pham") return "software";
  if (cleaned === "/phan-mem/hoc-tap" || cleaned === "/san-pham/hoc-tap") return "study";
  if (cleaned === "/phan-mem/lam-viec" || cleaned === "/san-pham/lam-viec") return "work";
  if (cleaned === "/huong-dan") return "guide";
  if (cleaned === "/lien-he") return "contact";
  return "home";
}

const currentRoute = getRouteName();

function routeNeedsCatalog(route = currentRoute) {
  return route === "software" || route === "study" || route === "work";
}

function getForcedCatalogCategory(route = currentRoute) {
  if (route === "study") return "hoctap";
  if (route === "work") return "lamviec";
  return null;
}

function getPrimaryNavRoute(route = currentRoute) {
  if (route === "demo") return "web";
  if (route === "study" || route === "work") return "software";
  return route;
}

const PUBLIC_PAGE_CONTENT = {
  vi: {
    baseTitle: "Ứng Dụng Thông Minh",
    supportStatic: {
      zaloTitle: "Zalo tư vấn",
      zaloSub: "Nhắn hỗ trợ trực tiếp",
      phoneTitle: "Gọi 0902 96 46 85",
      phoneSub: "Trao đổi nhanh nhu cầu"
    },
    home: {
      pageTitle: "Ứng Dụng Thông Minh | Trang mẹ giải pháp số",
      hero: {
        badge: "Trang mẹ giải pháp số",
        titleMain: "Từ website đến phần mềm,",
        titleSub: "đi thẳng vào đúng nhánh",
        desc: "Home mới chỉ giữ vai trò định hướng. Bạn chọn đúng nhánh trước, rồi xem nội dung sâu hơn ở trang con thay vì bị cuốn vào một trang bán hàng lẫn lộn.",
        primary: { label: "Đi vào nhánh Thiết kế Web", href: "/thiet-ke-web" },
        secondary: { label: "Đi vào nhánh Phần mềm", href: "/phan-mem" }
      },
      banner: [
        { label: "Hero video định vị", sub: "Trang mẹ rõ vai trò", href: "/" },
        { label: "Thiết kế Web", sub: "Landing page, web công ty, web bán hàng", href: "/thiet-ke-web" },
        { label: "Mẫu demo", sub: "Xem nhanh web theo ngành", href: "/mau-demo" },
        { label: "Phần mềm", sub: "App học tập và công cụ làm việc", href: "/phan-mem" },
        { label: "Học tập", sub: "Nhánh con cho học sinh và ôn luyện", href: "/phan-mem/hoc-tap" },
        { label: "Làm việc", sub: "Nhánh con cho video, quản lý, AI tool", href: "/phan-mem/lam-viec" },
        { label: "Hướng dẫn", sub: "Mua, nhận key, tải app", href: "/huong-dan" },
        { label: "Liên hệ", sub: "Zalo, điện thoại, fanpage", href: "/lien-he" }
      ],
      pathways: {
        eyebrow: "Hai nhánh chính",
        title: "Home chỉ làm nhiệm vụ dẫn đường",
        sub: "Khách vào trang chủ sẽ thấy rất rõ hai hướng đi chính: làm web hoặc tìm phần mềm. Các khối chi tiết được chuyển xuống trang con để bớt rối và dễ chốt nhu cầu hơn.",
        cards: [
          {
            eyebrow: "Nhánh 01",
            title: "Thiết kế Web",
            text: "Dành cho người cần landing page, web công ty, web bán hàng và muốn xem mẫu demo theo ngành trước khi trao đổi.",
            href: "/thiet-ke-web",
            cta: "Mở nhánh web",
            meta: ["Landing page", "Mẫu demo", "Tư vấn theo ngành"]
          },
          {
            eyebrow: "Nhánh 02",
            title: "Phần mềm",
            text: "Dành cho người cần app học tập, công cụ làm việc, AI mini app và khu tải phần mềm có key rõ ràng.",
            href: "/phan-mem",
            cta: "Mở nhánh phần mềm",
            meta: ["Học tập", "Làm việc", "Tải app & key"]
          }
        ]
      },
      benefits: {
        eyebrow: "Ba lợi ích",
        title: "Gọn hơn nhưng định vị rõ hơn",
        sub: "Không đổi chức năng cốt lõi, chỉ sắp xếp lại để khách dễ hiểu site đang có gì và nên đi đâu tiếp theo.",
        items: [
          {
            title: "Đi đúng nhánh ngay từ đầu",
            text: "Khách mới không còn phải lướt qua danh mục sản phẩm dày đặc trước khi hiểu site đang bán web hay phần mềm."
          },
          {
            title: "Trang con có chiều sâu riêng",
            text: "Mỗi khu vực được nói đúng việc của nó: web có demo và hướng triển khai, phần mềm có catalog và hướng dẫn mua."
          },
          {
            title: "Giữ nguyên logic đang chạy",
            text: "Luồng đăng nhập, account, mua sản phẩm, product detail và admin vẫn giữ nguyên; chỉ thay phần trình bày public."
          }
        ]
      },
      support: {
        eyebrow: "Đi nhanh hơn",
        title: "Cần người chỉ đúng nhánh?",
        copy: "Nếu bạn chưa chắc nên làm web hay tìm phần mềm, chỉ cần mở đúng nhánh hoặc nhắn Zalo để được gợi ý nhanh.",
        routeAction: { href: "/thiet-ke-web", label: "Mở nhánh Thiết kế Web", sub: "Hoặc sang Phần mềm nếu bạn cần app", icon: "GO" }
      },
      footerCta: {
        title: "Chọn công cụ phù hợp cho công việc của bạn",
        desc: "Đi nhanh đến nhóm giải pháp cần dùng hoặc liên hệ để được tư vấn rõ ràng."
      }
    },
    routes: {
      web: {
        pageTitle: "Thiết kế Web | Ứng Dụng Thông Minh",
        hero: {
          kicker: "Thiết kế Web",
          title: "Website theo ngành, xem demo trước rồi mới chốt",
          desc: "Trang này gom lại những gì khách cần khi hỏi làm web: định hướng, mẫu demo và điểm chạm tư vấn, thay vì trộn lẫn với catalog phần mềm.",
          tags: ["Landing page", "Web công ty", "Web bán hàng", "Tư vấn theo ngành"],
          actions: [
            { label: "Xem mẫu demo", href: "/mau-demo", variant: "accent" },
            { label: "Nhắn Zalo tư vấn", href: "https://zalo.me/0902964685", variant: "outline", external: true }
          ]
        },
        side: {
          label: "Nhánh này dành cho",
          title: "Khi bạn cần lên website mới",
          items: [
            "Muốn có trang giới thiệu rõ ràng để lấy lead hoặc chốt đơn.",
            "Muốn xem mẫu demo theo ngành trước khi trao đổi phạm vi.",
            "Muốn khu web tách riêng khỏi khu phần mềm để đỡ rối."
          ]
        },
        story: {
          eyebrow: "Cấu trúc mới",
          title: "Nhánh web giờ có không gian riêng",
          copy: "Tất cả nội dung mang tính giới thiệu dịch vụ web được gom về một khu rõ ràng hơn: có hướng chọn ngành, khu demo và CTA tư vấn.",
          cards: [
            { title: "Xem theo ngành", text: "Công ty, shop, giáo dục, spa và local business đều có chỗ xem nhanh.", linkLabel: "Mở kho mẫu demo", linkHref: "/mau-demo" },
            { title: "Đi từ mục tiêu", text: "Khách có thể chọn web để lấy lead, bán hàng, đặt lịch hay xây thương hiệu.", linkLabel: "Xem nhánh web", linkHref: "/thiet-ke-web" },
            { title: "Chốt trao đổi gọn", text: "Sau khi có hướng, khách nhắn Zalo để nhận tư vấn sát ngành và phạm vi hơn.", linkLabel: "Nhắn Zalo", linkHref: "https://zalo.me/0902964685", external: true }
          ],
          checklistTitle: "Phù hợp nếu",
          checklist: [
            "Bạn đang cần website mới cho kinh doanh hoặc dịch vụ.",
            "Bạn muốn xem demo trước khi chốt hướng triển khai.",
            "Bạn muốn giao diện public nói rõ site có làm web."
          ]
        },
        support: {
          eyebrow: "Nhánh web",
          title: "Muốn chốt nhanh hướng website?",
          copy: "Xem demo rồi nhắn Zalo để trao đổi theo ngành, mục tiêu chốt lead hoặc bán hàng.",
          routeAction: { href: "/mau-demo", label: "Mở kho mẫu demo", sub: "Xem nhanh từng nhóm ngành", icon: "WEB" }
        },
        sections: {
          webDemo: {
            eyebrow: "Kho mẫu web",
            title: "Mẫu demo website theo từng nhóm ngành",
            sub: "Từ dịch vụ, shop đến giáo dục và spa, bạn có thể xem phong cách trước khi triển khai."
          },
          footerCta: {
            title: "Muốn có website gọn, rõ và chốt lead tốt hơn?",
            desc: "Đi qua khu mẫu demo để chọn hướng trước, hoặc nhắn Zalo để được gợi ý layout phù hợp với ngành của bạn."
          }
        }
      },
      demo: {
        pageTitle: "Mẫu Demo Website | Ứng Dụng Thông Minh",
        hero: {
          kicker: "Mẫu Demo",
          title: "Kho mẫu để chọn phong cách web nhanh hơn",
          desc: "Trang này dành cho bước xem nhanh trước khi tư vấn: nhìn bố cục, tone nội dung và cách website phù hợp với từng ngành.",
          tags: ["Demo theo ngành", "Xem trước giao diện", "Dễ chọn hướng", "Không lẫn catalog"],
          actions: [
            { label: "Quay lại nhánh web", href: "/thiet-ke-web", variant: "outline" },
            { label: "Nhắn Zalo để chốt mẫu", href: "https://zalo.me/0902964685", variant: "accent", external: true }
          ]
        },
        side: {
          label: "Cách dùng",
          title: "Xem demo để rút ngắn trao đổi",
          items: [
            "Chọn ngành gần nhu cầu nhất để xem tone và bố cục.",
            "Ghi lại mẫu bạn thích để trao đổi nhanh hơn.",
            "Nếu cần, đi tiếp sang Zalo để chốt phạm vi triển khai."
          ]
        },
        story: {
          eyebrow: "Lợi ích",
          title: "Demo không còn nằm lẫn ở home",
          copy: "Khối demo được chuyển về đúng chỗ để homepage không giống một trang bán template, nhưng khách vẫn xem mẫu rất nhanh khi cần.",
          cards: [
            { title: "Ít nhiễu hơn", text: "Home chỉ định vị. Demo nằm ở trang con nên luồng nhìn gọn hơn." },
            { title: "Dễ so ngành", text: "Mỗi mẫu đại diện cho một kiểu nhu cầu khác nhau: dịch vụ, shop, giáo dục, spa, local." },
            { title: "Đi thẳng tư vấn", text: "Khi đã chọn được hướng, khách nhắn hỗ trợ để chốt chi tiết triển khai.", linkLabel: "Liên hệ nhanh", linkHref: "/lien-he" }
          ],
          checklistTitle: "Bạn nên vào trang này khi",
          checklist: [
            "Đang cân nhắc kiểu trình bày phù hợp với ngành.",
            "Muốn xem cách một trang web có thể chốt lead hoặc chốt đơn.",
            "Muốn giảm thời gian mô tả ý tưởng ban đầu."
          ]
        },
        support: {
          eyebrow: "Khu demo",
          title: "Đã thấy mẫu gần đúng với nhu cầu?",
          copy: "Bạn có thể quay lại nhánh web hoặc nhắn trực tiếp để chốt layout gần nhất.",
          routeAction: { href: "/thiet-ke-web", label: "Quay lại nhánh web", sub: "Đọc phần định hướng triển khai", icon: "DEMO" }
        },
        sections: {
          webDemo: {
            eyebrow: "Mẫu tham chiếu",
            title: "So nhanh demo theo từng dạng kinh doanh",
            sub: "Chọn một ngành gần nhất với nhu cầu thực tế để rút ngắn bước định hướng."
          },
          footerCta: {
            title: "Đã chọn được phong cách gần đúng?",
            desc: "Hãy quay lại nhánh web hoặc liên hệ trực tiếp để chốt trang nào cần làm trước và cách triển khai phù hợp."
          }
        }
      },
      software: {
        pageTitle: "Phần mềm | Ứng Dụng Thông Minh",
        hero: {
          kicker: "Phần mềm",
          title: "Nhóm app và công cụ được gom theo đúng nhu cầu sử dụng",
          desc: "Khu phần mềm là trang con riêng cho catalog tải về, chia thành hai nhánh nhỏ là Học tập và Làm việc để khách vào đúng nhóm nhanh hơn.",
          tags: ["Catalog rõ nhóm", "App học tập", "Công cụ làm việc", "Tải app & key"],
          actions: [
            { label: "Xem nhánh Học tập", href: "/phan-mem/hoc-tap", variant: "outline" },
            { label: "Xem nhánh Làm việc", href: "/phan-mem/lam-viec", variant: "accent" }
          ]
        },
        side: {
          label: "Cấu trúc mới",
          title: "Một nhánh cha, hai nhánh con",
          items: [
            "Trang /phan-mem là khu tổng hợp và định hướng.",
            "Trang /phan-mem/hoc-tap lọc đúng nhóm học tập.",
            "Trang /phan-mem/lam-viec lọc đúng nhóm công cụ làm việc."
          ]
        },
        story: {
          eyebrow: "Catalog gọn hơn",
          title: "Không còn đẩy toàn bộ sản phẩm lên home",
          copy: "Khối danh mục, card sản phẩm và hướng dẫn mua được chuyển về khu phần mềm để đúng bối cảnh hơn, còn logic checkout vẫn giữ nguyên.",
          cards: [
            { title: "Nhánh Học tập", text: "Tập trung các phần mềm ôn tập, luyện kiến thức và gói liên quan đến học sinh.", linkLabel: "Mở nhánh Học tập", linkHref: "/phan-mem/hoc-tap" },
            { title: "Nhánh Làm việc", text: "Tập trung các app phục vụ video, quản lý, tự động hóa và vận hành hằng ngày.", linkLabel: "Mở nhánh Làm việc", linkHref: "/phan-mem/lam-viec" },
            { title: "Tải app & key", text: "Sau khi mua, người dùng vẫn vào tài khoản để xem tải xuống và thông tin key/app.", linkLabel: "Mở tài khoản", linkHref: "/account?tab=downloads" }
          ],
          checklistTitle: "Khi nào nên vào trang này",
          checklist: [
            "Bạn đã xác định đang cần phần mềm thay vì website.",
            "Bạn muốn xem toàn bộ app đang có trên site.",
            "Bạn muốn đọc hướng dẫn mua và nhận key trong đúng ngữ cảnh."
          ]
        },
        support: {
          eyebrow: "Nhánh phần mềm",
          title: "Cần đi đúng nhóm app ngay?",
          copy: "Nếu bạn đã biết mình cần app học tập hay công cụ làm việc, dùng nút dẫn đường để vào thẳng khu phù hợp.",
          routeAction: { href: "/phan-mem/hoc-tap", label: "Đi tới nhánh Học tập", sub: "Hoặc chuyển sang Làm việc từ menu", icon: "APP" }
        },
        sections: {
          catalog: {
            eyebrow: "Catalog phần mềm",
            title: "Kho Ứng Dụng và Key Phần Mềm",
            sub: ""
          },
          productsTitle: "Phần mềm và công cụ",
          how: {
            eyebrow: "Hướng dẫn",
            title: "Các Bước Chọn Sản Phẩm",
            sub: ""
          },
          footerCta: {
            title: "Cần chọn app đúng nhóm trước khi mua?",
            desc: "Bạn có thể đi sâu vào Học tập hoặc Làm việc, hoặc nhắn hỗ trợ để được chỉ đúng sản phẩm phù hợp nhu cầu."
          }
        }
      },
      study: {
        pageTitle: "Phần mềm Học tập | Ứng Dụng Thông Minh",
        hero: {
          kicker: "Nhánh Học tập",
          title: "Khu phần mềm dành cho học sinh, ôn tập và luyện kiến thức",
          desc: "Trang này lọc sẵn đúng nhóm học tập để phụ huynh hoặc học sinh không phải lướt qua các công cụ làm việc không liên quan.",
          tags: ["Ôn tập", "Học sinh", "Luyện kiến thức", "Lọc đúng nhóm"],
          actions: [
            { label: "Xem tất cả phần mềm", href: "/phan-mem", variant: "outline" },
            { label: "Xem tài khoản & tải app", href: "/account?tab=downloads", variant: "accent" }
          ]
        },
        side: {
          label: "Điểm mạnh",
          title: "Một trang con chỉ nói về học tập",
          items: [
            "Không bị lẫn với công cụ video, quản lý hay app vận hành.",
            "Danh mục được lọc sẵn để người xem quyết định nhanh hơn.",
            "Giữ nguyên luồng mua, tải và xem quyền sử dụng sau thanh toán."
          ]
        },
        story: {
          eyebrow: "Nhánh con",
          title: "Tập trung hơn cho người mua phần mềm học tập",
          copy: "Khi đã đi vào nhánh này, khách chỉ còn thấy phần mềm liên quan đến ôn tập, luyện kiến thức và mục tiêu học hành.",
          cards: [
            { title: "Lọc đúng sản phẩm", text: "Danh sách chỉ hiển thị nhóm học tập, giảm nhiễu cho phụ huynh và học sinh." },
            { title: "Dễ giải thích hơn", text: "Nếu nhân viên gửi link, chỉ cần gửi đúng nhánh học tập là người xem hiểu ngay khu vực cần xem." },
            { title: "Giữ nguyên checkout", text: "Card sản phẩm, product detail và tài khoản tải app vẫn hoạt động theo logic cũ." }
          ],
          checklistTitle: "Phù hợp khi",
          checklist: [
            "Bạn đang tìm phần mềm ôn tập cho học sinh.",
            "Bạn muốn gửi đúng link nhánh học tập cho khách.",
            "Bạn muốn loại bỏ các app làm việc khỏi trải nghiệm xem."
          ]
        },
        support: {
          eyebrow: "Học tập",
          title: "Cần hỗ trợ chọn phần mềm học tập?",
          copy: "Nếu chưa rõ nên chọn gói nào, hãy vào tài khoản hoặc nhắn hỗ trợ để được hướng dẫn theo nhu cầu học.",
          routeAction: { href: "/phan-mem", label: "Quay về trang Phần mềm", sub: "Xem lại toàn bộ hai nhánh", icon: "STUDY" }
        },
        sections: {
          catalog: {
            eyebrow: "Nhóm học tập",
            title: "Các phần mềm học tập đang có trên site",
            sub: "Danh sách đã được lọc theo nhánh học tập để phụ huynh và học sinh xem gọn hơn."
          },
          productsTitle: "Phần mềm học tập",
          how: {
            eyebrow: "Cách mua",
            title: "Mua, thanh toán và nhận quyền sử dụng",
            sub: "Luồng cũ được giữ nguyên, chỉ tách trang để nội dung phù hợp hơn với người đang tìm app học tập."
          },
          footerCta: {
            title: "Muốn xem thêm app ngoài nhóm học tập?",
            desc: "Bạn có thể quay lại khu Phần mềm để xem đầy đủ hai nhánh, hoặc mở tài khoản để quản lý các app đã mua."
          }
        }
      },
      work: {
        pageTitle: "Phần mềm Làm việc | Ứng Dụng Thông Minh",
        hero: {
          kicker: "Nhánh Làm việc",
          title: "Công cụ giúp làm việc nhanh hơn, gọn hơn và bớt thao tác lặp",
          desc: "Trang này lọc riêng cho nhóm app phục vụ công việc: video, quản lý, bán hàng, vận hành và các tiện ích tải về.",
          tags: ["Video Creator", "Quản lý", "Tự động hóa", "App vận hành"],
          actions: [
            { label: "Xem tất cả phần mềm", href: "/phan-mem", variant: "outline" },
            { label: "Liên hệ hỗ trợ chọn app", href: "/lien-he", variant: "accent" }
          ]
        },
        side: {
          label: "Nhóm này hợp khi",
          title: "Bạn đang cần app cho công việc thực tế",
          items: [
            "Cần công cụ tạo video, quản lý hoặc hỗ trợ bán hàng.",
            "Muốn tách riêng khu phần mềm làm việc khỏi app học tập.",
            "Muốn gửi link đúng khu vực cho khách hoặc cộng tác viên."
          ]
        },
        story: {
          eyebrow: "Nhánh con",
          title: "Tập trung hơn cho công cụ phục vụ công việc",
          copy: "Các sản phẩm mang tính vận hành, sáng tạo nội dung và hỗ trợ làm việc được gom lại ở đây để đúng bối cảnh hơn với người dùng kinh doanh.",
          cards: [
            { title: "Video và sáng tạo nội dung", text: "Những app như Video Creator phù hợp để sản xuất nội dung và điều phối quy trình nhanh hơn." },
            { title: "Quản lý và vận hành", text: "Các công cụ quản lý website, bán hàng hoặc chăm sóc khách có thể nằm chung trong nhánh làm việc." },
            { title: "Giữ nguyên tải xuống", text: "Sau khi mua, người dùng vẫn nhận link tải và thông tin app trong tài khoản như cũ." }
          ],
          checklistTitle: "Phù hợp khi",
          checklist: [
            "Bạn đang tìm app phục vụ vận hành hoặc sáng tạo nội dung.",
            "Bạn muốn catalog bớt nhiễu so với việc trộn chung với app học tập.",
            "Bạn muốn gửi đúng nhánh công cụ làm việc cho khách."
          ]
        },
        support: {
          eyebrow: "Làm việc",
          title: "Muốn đi đúng app cho công việc?",
          copy: "Nếu bạn cần công cụ làm video, quản lý hoặc hỗ trợ bán hàng, đây là khu nên xem trước khi mua.",
          routeAction: { href: "/phan-mem", label: "Quay về trang Phần mềm", sub: "Xem lại cả hai nhánh", icon: "WORK" }
        },
        sections: {
          catalog: {
            eyebrow: "Nhóm làm việc",
            title: "Các app phục vụ công việc và vận hành",
            sub: "Danh sách dưới đây được lọc riêng theo nhánh làm việc để người xem ra quyết định nhanh hơn."
          },
          productsTitle: "Phần mềm làm việc",
          how: {
            eyebrow: "Cách mua",
            title: "Mua app, thanh toán và nhận tải xuống như cũ",
            sub: "Bạn vẫn dùng quy trình hiện tại, chỉ khác là giao diện public đã gom đúng ngữ cảnh cho nhóm làm việc."
          },
          footerCta: {
            title: "Cần app đúng việc hơn là một danh sách dàn trải?",
            desc: "Ở nhánh này bạn chỉ nhìn thấy công cụ phục vụ công việc. Nếu cần so thêm, quay lại khu Phần mềm tổng hợp."
          }
        }
      },
      guide: {
        pageTitle: "Hướng dẫn | Ứng Dụng Thông Minh",
        hero: {
          kicker: "",
          title: "Hướng dẫn mua phần mềm và nhận key nhanh",
          desc: "",
          tags: [],
          actions: []
        },
        side: null,
        story: {
          eyebrow: "Cách sử dụng",
          title: "Làm đúng 3 bước là nhận được key/app",
          copy: "Bạn chỉ cần đi đúng thứ tự dưới đây. Hệ thống giữ nguyên logic hiện tại, chỉ trình bày lại để dễ thao tác hơn cho user.",
          cards: [
            { title: "Bước 1 - Chọn sản phẩm", text: "Vào đúng nhóm phần mềm, mở card sản phẩm và kiểm tra gói phù hợp trước khi bấm mua." },
            { title: "Bước 2 - Thanh toán", text: "Thực hiện thanh toán theo QR/chuyển khoản như hướng dẫn trên màn hình, không cần thao tác phức tạp." },
            { title: "Bước 3 - Nhận key / tải app", text: "Sau khi thanh toán thành công, key hoặc quyền tải sẽ hiển thị trong tài khoản để bạn sử dụng ngay." }
          ],
          checklistTitle: "",
          checklist: []
        },
        support: {
          eyebrow: "Hướng dẫn",
          title: "Cần người hỗ trợ ngay trong lúc thao tác?",
          copy: "Nếu bạn đang mua mà chưa rõ bước nào, hãy liên hệ ngay để được hướng dẫn trực tiếp theo đúng trạng thái đơn hiện tại.",
          routeAction: { href: "/lien-he", label: "Mở trang Liên hệ", sub: "Gọi hoặc nhắn Zalo ngay", icon: "GUIDE" }
        },
        sections: {
          footerCta: {
            title: "Sẵn sàng mua hoặc kiểm tra key/app đã nhận?",
            desc: "Đi thẳng sang khu Phần mềm để chọn sản phẩm, hoặc mở tài khoản để xem key và danh sách tải xuống của bạn."
          }
        }
      },
      contact: {
        pageTitle: "Liên hệ | Ứng Dụng Thông Minh",
        hero: {
          kicker: "",
          title: "Liên hệ hỗ trợ nhanh cho user và đơn hàng",
          desc: "",
          tags: [],
          actions: []
        },
        side: null,
        story: {
          eyebrow: "Kênh hỗ trợ",
          title: "Chọn đúng kênh theo nhu cầu hỗ trợ",
          copy: "Mỗi kênh liên hệ phù hợp một mục tiêu khác nhau. Chọn đúng kênh sẽ giúp xử lý nhanh hơn và giảm thời gian chờ.",
          cards: [
            { title: "Zalo", text: "Ưu tiên khi cần gửi ảnh lỗi, mã đơn hoặc trao đổi trực tiếp để xử lý nhanh từng bước.", linkLabel: "Mở Zalo", linkHref: "https://zalo.me/0902964685", external: true },
            { title: "Điện thoại", text: "Dùng khi cần xác nhận gấp về thanh toán, trạng thái đơn hoặc hướng xử lý ngay lập tức.", linkLabel: "Gọi ngay", linkHref: "tel:0902964685" },
            { title: "Email / Fanpage", text: "Phù hợp khi cần để lại nội dung dài, gửi yêu cầu tổng hợp hoặc theo dõi trao đổi sau đó.", linkLabel: "Mở fanpage", linkHref: "https://www.facebook.com/share/1BFbrsX3UK/?mibextid=wwXIfr", external: true }
          ],
          checklistTitle: "",
          checklist: []
        },
        support: {
          eyebrow: "Liên hệ nhanh",
          title: "Cần hỗ trợ ngay bây giờ?",
          copy: "Nhắn Zalo hoặc gọi trực tiếp để được xử lý nhanh theo tình huống thực tế của bạn.",
          routeAction: { href: "https://zalo.me/0902964685", label: "Mở Zalo tư vấn", sub: "Trao đổi trực tiếp ngay", icon: "CHAT", external: true }
        },
        sections: {
          footerCta: {
            title: "Muốn quay lại đúng khu trước khi liên hệ?",
            desc: "Bạn có thể quay về Thiết kế Web hoặc Phần mềm để xác định nhu cầu rõ hơn, rồi liên hệ để được xử lý nhanh và đúng trọng tâm."
          }
        }
      }
    }
  },
  en: {
    baseTitle: "Ung Dung Thong Minh",
    supportStatic: {
      zaloTitle: "Zalo support",
      zaloSub: "Chat with us directly",
      phoneTitle: "Call 0902 96 46 85",
      phoneSub: "Talk through your needs fast"
    },
    home: {
      pageTitle: "Ung Dung Thong Minh | Digital solution hub",
      hero: {
        badge: "Parent digital hub",
        titleMain: "From websites to software,",
        titleSub: "move into the right branch first",
        desc: "The new homepage only sets direction. Pick the right branch first, then read deeper content on the child page instead of scrolling through a mixed storefront.",
        primary: { label: "Open Web Design", href: "/thiet-ke-web" },
        secondary: { label: "Open Software", href: "/phan-mem" }
      },
      banner: [
        { label: "Hero positioning", sub: "Homepage as a clear parent page", href: "/" },
        { label: "Web Design", sub: "Landing pages, company sites, shop sites", href: "/thiet-ke-web" },
        { label: "Demo library", sub: "Preview industry-based samples", href: "/mau-demo" },
        { label: "Software", sub: "Study apps and work tools", href: "/phan-mem" },
        { label: "Study branch", sub: "Focused learning apps", href: "/phan-mem/hoc-tap" },
        { label: "Work branch", sub: "Focused work tools", href: "/phan-mem/lam-viec" },
        { label: "Guide", sub: "How to buy and download", href: "/huong-dan" },
        { label: "Contact", sub: "Zalo, phone, fanpage", href: "/lien-he" }
      ],
      pathways: {
        eyebrow: "Two main branches",
        title: "The homepage now acts as a guide",
        sub: "Visitors see two clear directions first: web design or software. Deeper sections move to child pages so the public experience feels cleaner and easier to understand.",
        cards: [
          {
            eyebrow: "Branch 01",
            title: "Web Design",
            text: "For people who need landing pages, company websites, online shop sites, and want to preview industry demos first.",
            href: "/thiet-ke-web",
            cta: "Open web branch",
            meta: ["Landing pages", "Demo library", "Industry guidance"]
          },
          {
            eyebrow: "Branch 02",
            title: "Software",
            text: "For people looking for study apps, work tools, AI mini apps, and downloads with clear key or access delivery.",
            href: "/phan-mem",
            cta: "Open software branch",
            meta: ["Study", "Work", "App downloads"]
          }
        ]
      },
      benefits: {
        eyebrow: "Three gains",
        title: "Cleaner structure, clearer positioning",
        sub: "Core logic stays the same. Only the public-facing structure changes so people know what the site offers faster.",
        items: [
          { title: "The right direction sooner", text: "New visitors do not need to parse a full product catalog before understanding what the site is about." },
          { title: "Deeper child pages", text: "Each branch now speaks about the right thing: demos for web, catalog and buying flow for software." },
          { title: "Existing logic stays intact", text: "Login, account, checkout, product pages, and admin are all preserved." }
        ]
      },
      support: {
        eyebrow: "Move faster",
        title: "Need help choosing a branch?",
        copy: "If you are not sure whether you need a website or software, jump into the right branch or message us on Zalo.",
        routeAction: { href: "/thiet-ke-web", label: "Open Web Design", sub: "Or switch to Software if you need apps", icon: "GO" }
      },
      footerCta: {
        title: "Choose the right tool for your work",
        desc: "Go straight to the solution group you need or contact us for clear guidance."
      }
    },
    routes: JSON.parse(JSON.stringify({}))
  }
};

PUBLIC_PAGE_CONTENT.en.routes = JSON.parse(JSON.stringify(PUBLIC_PAGE_CONTENT.vi.routes));

PUBLIC_PAGE_CONTENT.en.routes.web.pageTitle = "Web Design | Ung Dung Thong Minh";
PUBLIC_PAGE_CONTENT.en.routes.web.hero = {
  kicker: "Web Design",
  title: "Industry-focused websites with demos before consultation",
  desc: "This page groups the web-design story in one place so visitors do not need to navigate through software cards first.",
  tags: ["Landing pages", "Company sites", "Shop sites", "Industry guidance"],
  actions: [
    { label: "View demos", href: "/mau-demo", variant: "accent" },
    { label: "Chat on Zalo", href: "https://zalo.me/0902964685", variant: "outline", external: true }
  ]
};
PUBLIC_PAGE_CONTENT.en.routes.demo.pageTitle = "Website Demos | Ung Dung Thong Minh";
PUBLIC_PAGE_CONTENT.en.routes.software.pageTitle = "Software | Ung Dung Thong Minh";
PUBLIC_PAGE_CONTENT.en.routes.study.pageTitle = "Study Software | Ung Dung Thong Minh";
PUBLIC_PAGE_CONTENT.en.routes.work.pageTitle = "Work Software | Ung Dung Thong Minh";
PUBLIC_PAGE_CONTENT.en.routes.guide.pageTitle = "Guide | Ung Dung Thong Minh";
PUBLIC_PAGE_CONTENT.en.routes.contact.pageTitle = "Contact | Ung Dung Thong Minh";

Object.assign(PUBLIC_PAGE_CONTENT.vi.home.hero, {
  badge: "Trang mẹ giải pháp số",
  titleMain: "Giải Pháp Số",
  titleSub: "Tiện Dụng Cho Người Kinh Doanh Nhỏ",
  titleTail: "",
  desc: ""
});

PUBLIC_PAGE_CONTENT.vi.home.banner = [
  { tag: "Trang mẹ", title: "Định vị gọn", meta: "Giải pháp số cho người kinh doanh nhỏ", href: "/", tone: "hub" },
  { tag: "Thiết kế Web", title: "Website theo ngành", meta: "Landing page, web công ty, web bán hàng", href: "/thiet-ke-web", tone: "web" },
  { tag: "Phần mềm", title: "App tiện dụng", meta: "Tải app, quản lý key và công cụ vận hành", href: "/phan-mem", tone: "software" },
  { tag: "Bên trong", title: "Học tập & Làm việc", meta: "Hai nhánh con nằm bên trong khu Phần mềm", href: "/phan-mem", tone: "branch" },
  { tag: "Hướng dẫn", title: "Mua và nhận app", meta: "Đọc luồng mua, nhận key và tải xuống", href: "/huong-dan", tone: "guide" },
  { tag: "Liên hệ", title: "Chạm hỗ trợ nhanh", meta: "Zalo, điện thoại và fanpage khi cần", href: "/lien-he", tone: "contact" }
];

PUBLIC_PAGE_CONTENT.vi.home.pathways = {
  eyebrow: "",
  title: "Chọn Giải Pháp Cho Bạn",
  sub: "",
  cards: [
    {
      eyebrow: "Nhánh chính 01",
      title: "Thiết kế Web",
      text: "Website theo ngành, có mẫu demo sẵn, dễ chỉnh sửa và dễ triển khai.",
      href: "/thiet-ke-web",
      cta: "Xem nhánh Thiết kế Web",
      meta: ["Demo ngành", "Landing page", "Web bán hàng"],
      previewTag: "Website",
      previewTitle: "Thiết kế Web",
      previewSub: "",
      previewItems: [],
      tone: "web"
    },
    {
      eyebrow: "Nhánh chính 02",
      title: "Phần mềm",
      text: "Phần mềm mini, công cụ học tập, làm việc và AI hỗ trợ xử lý công việc nhanh hơn.",
      href: "/phan-mem",
      cta: "Xem nhánh Phần mềm",
      meta: ["Học tập", "Làm việc", "Công cụ"],
      previewTag: "Phần mềm",
      previewTitle: "Phần mềm",
      previewSub: "",
      previewItems: [],
      tone: "software"
    }
  ]
};

PUBLIC_PAGE_CONTENT.vi.home.benefits = {
  eyebrow: "",
  title: "Chọn đúng giải pháp, Hiệu Quả Nâng Cao",
  sub: "",
  items: [
    {
      kicker: "Nhu cầu",
      title: "Xác định việc cần làm",
      text: "Cần website để giới thiệu, bán hàng hoặc lấy khách thì chọn Thiết kế Web."
    },
    {
      kicker: "Công cụ",
      title: "Chọn phần mềm phù hợp",
      text: "Cần app mini, công cụ học tập, làm việc hoặc AI thì vào nhánh Phần mềm."
    },
    {
      kicker: "Hỗ trợ",
      title: "Đi tiếp rõ ràng",
      text: "Mỗi nhánh dẫn tới nội dung riêng: demo, sản phẩm, hướng dẫn và liên hệ."
    }
  ]
};

Object.assign(PUBLIC_PAGE_CONTENT.en.home.hero, {
  badge: "Parent digital hub",
  titleMain: "Digital Solutions",
  titleSub: "Useful For Small Business Owners",
  titleTail: "",
  desc: ""
});

PUBLIC_PAGE_CONTENT.en.home.banner = [
  { tag: "Parent page", title: "Clear positioning", meta: "Digital solutions for small business owners", href: "/", tone: "hub" },
  { tag: "Web Design", title: "Industry-focused websites", meta: "Landing pages, company sites, sales websites", href: "/thiet-ke-web", tone: "web" },
  { tag: "Software", title: "Useful apps", meta: "Downloads, access management, practical tools", href: "/phan-mem", tone: "software" },
  { tag: "Inside", title: "Study & Work", meta: "Two child branches live inside Software", href: "/phan-mem", tone: "branch" },
  { tag: "Guide", title: "Buy and receive apps", meta: "Read the flow for buying, key delivery, and downloads", href: "/huong-dan", tone: "guide" },
  { tag: "Contact", title: "Reach support fast", meta: "Zalo, phone, and fanpage when needed", href: "/lien-he", tone: "contact" }
];

PUBLIC_PAGE_CONTENT.en.home.pathways = {
  eyebrow: "",
  title: "Choose The Right Solution",
  sub: "",
  cards: [
    {
      eyebrow: "Main branch 01",
      title: "Web Design",
      text: "Industry-based websites with ready demo samples, easy customization, and straightforward deployment.",
      href: "/thiet-ke-web",
      cta: "View the Web Design branch",
      meta: ["Industry demos", "Landing pages", "Sales websites"],
      previewTag: "Website",
      previewTitle: "Web Design",
      previewSub: "",
      previewItems: [],
      tone: "web"
    },
    {
      eyebrow: "Main branch 02",
      title: "Software",
      text: "Mini software, study tools, work tools, and AI helpers that speed up practical tasks.",
      href: "/phan-mem",
      cta: "View the Software branch",
      meta: ["Study", "Work", "Tools"],
      previewTag: "Software",
      previewTitle: "Software",
      previewSub: "",
      previewItems: [],
      tone: "software"
    }
  ]
};

PUBLIC_PAGE_CONTENT.en.home.benefits = {
  eyebrow: "",
  title: "Choose The Right Solution, Higher Efficiency",
  sub: "",
  items: [
    {
      kicker: "Need",
      title: "Identify the task first",
      text: "Choose Web Design when you need a website for presence, sales, or leads."
    },
    {
      kicker: "Tools",
      title: "Pick the right software",
      text: "Choose Software when you need mini apps, study tools, work tools, or AI support."
    },
    {
      kicker: "Next",
      title: "Continue with clarity",
      text: "Each branch leads to its own demos, products, guide, and contact path."
    }
  ]
};

Object.assign(PUBLIC_PAGE_CONTENT.vi.routes.web, {
  pageTitle: "Thiết kế Web | Ứng Dụng Thông Minh",
  hero: {
    kicker: "",
    title: "Thiết Kế Website Theo Ngành",
    desc: "",
    tags: [],
    actions: []
  },
  side: null,
  story: {
    eyebrow: "Giới thiệu nhanh",
    title: "Thiết kế Web và Web triển khai nhanh",
    copy: "Thiết kế web theo yêu cầu của bạn hoặc có thể chọn mua các mẫu web có sẵn (dùng ngay và tự chỉnh sửa nội dung).",
    cards: [],
    checklistTitle: "",
    checklist: []
  },
  support: {
    eyebrow: "Nhánh web",
    title: "Muốn chọn mẫu nhanh?",
    copy: "Xem demo theo ngành trước, sau đó nhắn Zalo để chốt hướng triển khai.",
    routeAction: { href: "/mau-demo", label: "Mở kho mẫu web", sub: "Xem demo theo từng nhóm ngành", icon: "WEB" }
  },
  sections: {
    webDemo: {
      eyebrow: "Demo theo ngành",
      title: "Xem mẫu website trước khi triển khai",
      sub: "Card nhỏ điều hướng và preview card lớn là cấu trúc chính cần giữ."
    },
    footerCta: {
      title: "Bạn muốn có một website dễ dùng cho ngành của mình?",
      desc: "Chọn mẫu demo có sẵn, chỉnh theo thương hiệu và triển khai theo nhu cầu thực tế của bạn."
    }
  },
  webBuild: {
    summary: {
      eyebrow: "Web mẫu triển khai nhanh",
      title: "Giải pháp triển khai nhanh cho nhu cầu cần web sớm",
      copy: "Bạn có thể chọn gói web mẫu triển khai nhanh để dùng ngay, sau đó tự chỉnh nội dung theo hướng dẫn. Phần chi tiết sẽ tiếp tục được mở rộng ở phase sau.",
      actions: [
        { label: "Xem mẫu web", href: "/mau-demo", variant: "accent" },
        { label: "Nhắn Zalo tư vấn", href: "https://zalo.me/0902964685", variant: "outline", external: true }
      ]
    }
  }
});

Object.assign(PUBLIC_PAGE_CONTENT.vi.routes.software, {
  hero: {
    kicker: "",
    title: "Phần Mềm Tiện Dụng Cho Công Việc",
    desc: "",
    tags: [],
    actions: [],
    videoSrc: "/Video/hero-phamem.mp4"
  },
  side: null,
  story: {
    eyebrow: "",
    title: "Chọn sản phẩm phù hợp",
    copy: "",
    cards: [],
    checklistTitle: "",
    checklist: [],
    previewCluster: {
      defaultId: "study",
      cards: [
        {
          id: "study",
          label: "Học tập",
          kind: "Luyện tập, đề thi, lộ trình",
          pill: "STUDY",
          title: "Bộ công cụ học tập",
          desc: "Nhóm phần mềm hỗ trợ ôn luyện, theo dõi tiến độ và tối ưu hiệu quả học mỗi ngày.",
          features: ["Lộ trình", "Theo dõi tiến độ", "Ôn luyện nhanh"],
          tone: "study"
        },
        {
          id: "work",
          label: "Làm việc",
          kind: "Tự động hóa, quy trình, vận hành",
          pill: "WORK",
          title: "Bộ công cụ làm việc",
          desc: "Nhóm phần mềm giúp giảm thao tác lặp, tăng tốc vận hành và chuẩn hóa quy trình công việc.",
          features: ["Tự động hóa", "Quy trình", "Năng suất"],
          tone: "work"
        },
        {
          id: "key",
          label: "Key phần mềm",
          kind: "Kích hoạt, gia hạn, cấp quyền",
          pill: "KEY",
          title: "Nhóm key phần mềm",
          desc: "Khu nội dung định hướng cho nhu cầu key phần mềm: kích hoạt, gia hạn và quản lý quyền dùng tạm thời.",
          features: ["Kích hoạt", "Gia hạn", "Cấp quyền"],
          tone: "key"
        }
      ]
    }
  }
});

Object.assign(PUBLIC_PAGE_CONTENT.en.routes.web, {
  pageTitle: "Web Design | Smart Apps",
  hero: {
    kicker: "",
    title: "Industry-Focused Website Design",
    desc: "",
    tags: [],
    actions: []
  },
  side: null,
  story: {
    eyebrow: "Quick intro",
    title: "Web Design and Fast Deployment Web",
    copy: "This page prioritizes industry-demo browsing with a small-card navigator and large preview. The fast-deployment branch stays summary-only for now to keep the layout clean and premium.",
    cards: [],
    checklistTitle: "",
    checklist: []
  },
  support: {
    eyebrow: "Web branch",
    title: "Want to choose a sample quickly?",
    copy: "Review industry demos first, then contact us to lock the implementation direction.",
    routeAction: { href: "/mau-demo", label: "Open demo library", sub: "Browse by industry", icon: "WEB" }
  },
  sections: {
    webDemo: {
      eyebrow: "Industry demos",
      title: "Preview website samples before implementation",
      sub: "Small card navigation with a large preview card is the required structure."
    },
    footerCta: {
      title: "Want an easy-to-use website for your industry?",
      desc: "Choose a ready demo, adapt to your brand, then deploy based on real business needs."
    }
  },
  webBuild: {
    summary: {
      eyebrow: "Fast web templates",
      title: "Quick-launch option when you need a website sooner",
      copy: "You can pick a fast web template package to go live quickly, then edit content based on guided steps. Detailed expansion will continue in the next phase.",
      actions: [
        { label: "View website samples", href: "/mau-demo", variant: "accent" },
        { label: "Chat on Zalo", href: "https://zalo.me/0902964685", variant: "outline", external: true }
      ]
    }
  }
});

Object.assign(PUBLIC_PAGE_CONTENT.en.routes.demo, {
  hero: {
    kicker: "Demo Library",
    title: "Preview web styles before you talk scope",
    desc: "This page is for fast comparison: layout direction, content tone, and industry fit before consultation.",
    tags: ["Industry demos", "Fast comparison", "Preview first", "Separate from catalog"],
    actions: [
      { label: "Back to Web Design", href: "/thiet-ke-web", variant: "outline" },
      { label: "Chat on Zalo", href: "https://zalo.me/0902964685", variant: "accent", external: true }
    ]
  },
  side: {
    label: "How to use it",
    title: "Use demos to shorten the back-and-forth",
    items: [
      "Pick the industry that is closest to your real need.",
      "Save the sample you like so consultation starts faster.",
      "Move to Zalo once the direction looks close enough."
    ]
  },
  story: {
    eyebrow: "Why this page exists",
    title: "Demos no longer sit inside the homepage",
    copy: "The demo block now lives in its own page so the homepage can stay focused on direction instead of looking like a template marketplace.",
    cards: [
      { title: "Less noise", text: "The homepage positions the site. Demo browsing happens here." },
      { title: "Better comparisons", text: "Each sample maps to a different business need, from services to local stores." },
      { title: "Move to contact faster", text: "After you choose a direction, move straight to contact or Zalo.", linkLabel: "Open contact page", linkHref: "/lien-he" }
    ],
    checklistTitle: "Open this page when",
    checklist: [
      "You are comparing presentation styles by industry.",
      "You want to see how a site could close leads or orders.",
      "You want a faster starting point for discussion."
    ]
  },
  support: {
    eyebrow: "Demo area",
    title: "Have you found a close enough sample?",
    copy: "Go back to the web branch or message directly to lock the layout direction in.",
    routeAction: { href: "/thiet-ke-web", label: "Back to Web Design", sub: "Review the implementation direction", icon: "DEMO" }
  },
  sections: {
    webDemo: {
      eyebrow: "Reference demos",
      title: "Compare business-focused demo directions",
      sub: "Choose the industry that is closest to your real-world use case."
    },
    footerCta: {
      title: "Already found a close visual direction?",
      desc: "Go back to the web branch or contact us directly to decide what should be built first."
    }
  }
});

Object.assign(PUBLIC_PAGE_CONTENT.en.routes.software, {
  hero: {
    kicker: "",
    title: "Software Tools For Daily Work",
    desc: "",
    tags: [],
    actions: [],
    videoSrc: "/Video/hero-phamem.mp4"
  },
  side: null,
  story: {
    eyebrow: "",
    title: "Choose the right product",
    copy: "",
    cards: [],
    checklistTitle: "",
    checklist: [],
    previewCluster: {
      defaultId: "study",
      cards: [
        {
          id: "study",
          label: "Study",
          kind: "Practice, exam prep, roadmap",
          pill: "STUDY",
          title: "Study toolkit",
          desc: "Software group for learning acceleration, progress tracking, and everyday study efficiency.",
          features: ["Roadmap", "Tracking", "Fast practice"],
          tone: "study"
        },
        {
          id: "work",
          label: "Work",
          kind: "Automation, workflows, operations",
          pill: "WORK",
          title: "Work toolkit",
          desc: "Software group that reduces repetitive tasks, improves team flow, and supports practical operations.",
          features: ["Automation", "Workflow", "Productivity"],
          tone: "work"
        },
        {
          id: "key",
          label: "Software Keys",
          kind: "Activation, renewals, access",
          pill: "KEY",
          title: "Software key group",
          desc: "Temporary directional content for software-key needs: activation, renewals, and access handling.",
          features: ["Activation", "Renewals", "Access"],
          tone: "key"
        }
      ]
    }
  },
  support: {
    eyebrow: "Software branch",
    title: "Need to jump into the right app group fast?",
    copy: "If you already know whether you need learning software or work tools, use the route action to jump straight in.",
    routeAction: { href: "/phan-mem/hoc-tap", label: "Open Study branch", sub: "Or switch to Work from the menu", icon: "APP" }
  },
  sections: {
    catalog: {
      eyebrow: "Software catalog",
      title: "Choose a group first, then browse the product cards",
      sub: "Products now live in the software branch so the homepage no longer feels like a full storefront."
    },
    productsTitle: "Software and tools",
    how: {
      eyebrow: "Guide",
      title: "The same buying flow, presented in the right branch",
      sub: "It is still the same three-step flow for buying, paying, and receiving access or downloads."
    },
    footerCta: {
      title: "Need to choose the right app group before buying?",
      desc: "Go deeper into the Study or Work branches, or contact support to get pointed at the most suitable product."
    }
  }
});

Object.assign(PUBLIC_PAGE_CONTENT.en.routes.study, {
  hero: {
    kicker: "Study branch",
    title: "Learning software for students and practice flow",
    desc: "This page filters directly to study products so parents and students do not need to scroll through unrelated work tools.",
    tags: ["Study", "Learning", "Students", "Filtered catalog"],
    actions: [
      { label: "View all software", href: "/phan-mem", variant: "outline" },
      { label: "Account and downloads", href: "/account?tab=downloads", variant: "accent" }
    ]
  },
  side: {
    label: "What it improves",
    title: "A child page focused only on learning tools",
    items: [
      "No mixing with video, management, or work apps.",
      "The list is already filtered to reduce decision friction.",
      "The buying and download flow stays unchanged."
    ]
  },
  story: {
    eyebrow: "Focused child page",
    title: "A better fit for visitors shopping for study software",
    copy: "Once users enter this branch, they only see products related to learning, review, and study support.",
    cards: [
      { title: "Correct filtering", text: "Only study-related products are shown, which cuts noise for parents and students." },
      { title: "Easier to share", text: "Teams can send the exact study branch link instead of asking users to filter manually." },
      { title: "Same checkout", text: "Product cards, detail pages, and the download account area still work the same way." }
    ],
    checklistTitle: "Best used when",
    checklist: [
      "You are looking for learning or review software.",
      "You want to share a focused branch with a customer.",
      "You want a cleaner browsing experience for study products."
    ]
  },
  support: {
    eyebrow: "Study",
    title: "Need help choosing study software?",
    copy: "If you are unsure which package fits the learning need, move to the account area or message support directly.",
    routeAction: { href: "/phan-mem", label: "Back to Software", sub: "Review both branches again", icon: "STUDY" }
  },
  sections: {
    catalog: {
      eyebrow: "Study group",
      title: "Study software currently available",
      sub: "The list below is filtered to the study branch for a cleaner experience."
    },
    productsTitle: "Study software",
    how: {
      eyebrow: "How to buy",
      title: "Buy, pay, and receive access",
      sub: "The flow stays the same. Only the public structure is cleaner for study-focused visitors."
    },
    footerCta: {
      title: "Want to compare beyond study tools?",
      desc: "Go back to the Software branch to see both groups, or open the account area to manage purchased apps."
    }
  }
});

Object.assign(PUBLIC_PAGE_CONTENT.en.routes.work, {
  hero: {
    kicker: "Work branch",
    title: "Tools for daily work, operations, and content flow",
    desc: "This page filters to apps used for work: video, management, selling support, operations, and downloadable utilities.",
    tags: ["Video Creator", "Management", "Automation", "Work tools"],
    actions: [
      { label: "View all software", href: "/phan-mem", variant: "outline" },
      { label: "Contact to choose an app", href: "/lien-he", variant: "accent" }
    ]
  },
  side: {
    label: "This branch fits when",
    title: "You need apps for practical work",
    items: [
      "You need video, management, or selling-support tools.",
      "You want work tools separated from study apps.",
      "You want a focused link to share with customers or teammates."
    ]
  },
  story: {
    eyebrow: "Focused child page",
    title: "A cleaner place for work and operations tools",
    copy: "Products used for daily operations, content production, and practical work support are grouped here for a clearer business context.",
    cards: [
      { title: "Video and content flow", text: "Apps like Video Creator fit this branch because they support production and coordination tasks." },
      { title: "Management and operations", text: "Tools for website management, selling support, or customer handling can sit together in this branch." },
      { title: "Same downloads", text: "After purchase, users still receive download links and app access in the same account area." }
    ],
    checklistTitle: "Best used when",
    checklist: [
      "You are looking for apps that support operations or content work.",
      "You want less catalog noise than a mixed study/work page.",
      "You want to share a focused work-tools branch."
    ]
  },
  support: {
    eyebrow: "Work",
    title: "Want to jump to the right app faster?",
    copy: "If you need tools for video, management, or sales support, this is the branch to review first.",
    routeAction: { href: "/phan-mem", label: "Back to Software", sub: "Review both child branches again", icon: "WORK" }
  },
  sections: {
    catalog: {
      eyebrow: "Work group",
      title: "Apps for work and operations",
      sub: "The list below is filtered to the work branch so visitors can decide faster."
    },
    productsTitle: "Work software",
    how: {
      eyebrow: "How to buy",
      title: "Buy the app, pay, and receive the download",
      sub: "The underlying flow is unchanged. Only the public presentation is cleaner for work-focused visitors."
    },
    footerCta: {
      title: "Need the right app rather than a mixed list?",
      desc: "This branch keeps the focus on work tools. If you need broader comparison, go back to the Software parent page."
    }
  }
});

Object.assign(PUBLIC_PAGE_CONTENT.en.routes.guide, {
  hero: {
    kicker: "",
    title: "Buying, key delivery, and app downloads in one place",
    desc: "",
    tags: [],
    actions: []
  },
  side: null,
  story: {
    eyebrow: "New layout",
    title: "The buying guide is no longer mixed into the homepage",
    copy: "The guide now sits on its own page so people who need process information can read it in one place, while the homepage stays focused on direction.",
    cards: [
      { title: "Step 1", text: "Choose the right branch, then select the product or package that fits." },
      { title: "Step 2", text: "Pay through the existing flow. The backend logic does not change." },
      { title: "Step 3", text: "After payment, users receive access, keys, or download details in the account area." }
    ],
    checklistTitle: "Useful when",
    checklist: [
      "You need to share a guide with a new customer.",
      "You want fewer repeated questions about key delivery and downloads.",
      "You want support content separated from the homepage."
    ]
  },
  support: {
    eyebrow: "Guide",
    title: "Need help while buying?",
    copy: "If the guide still leaves questions open, contact support directly while choosing the right product.",
    routeAction: { href: "/lien-he", label: "Open Contact page", sub: "Call or message on Zalo", icon: "GUIDE" }
  },
  sections: {
    how: {
      eyebrow: "Three main steps",
      title: "From choosing a product to receiving the download",
      sub: "The process is unchanged. It now simply lives on the right child page instead of in the middle of the homepage."
    },
    footerCta: {
      title: "Want to jump into the software branch or the download account now?",
      desc: "Move straight to the Software branch, or sign in to open the account area and review available downloads."
    }
  }
});

Object.assign(PUBLIC_PAGE_CONTENT.en.routes.contact, {
  hero: {
    kicker: "",
    title: "A dedicated page for direct support",
    desc: "",
    tags: [],
    actions: []
  },
  side: null,
  story: {
    eyebrow: "Support channels",
    title: "Choose the contact channel that matches your pace",
    copy: "The contact page gathers the main support channels so visitors do not need to search through the footer or support dock first.",
    cards: [
      { title: "Zalo", text: "Best when you want to describe the need quickly, send images, or decide on the next step.", linkLabel: "Open Zalo", linkHref: "https://zalo.me/0902964685", external: true },
      { title: "Phone", text: "Best for a quick direct conversation to clarify the need and confirm what comes next.", linkLabel: "Call now", linkHref: "tel:0902964685" },
      { title: "Email / Fanpage", text: "Useful when you want to leave details or review the discussion later.", linkLabel: "Open fanpage", linkHref: "https://www.facebook.com/share/1BFbrsX3UK/?mibextid=wwXIfr", external: true }
    ],
    checklistTitle: "You can contact us to",
    checklist: [
      "Ask for help choosing the right branch or product.",
      "Get support when you are stuck during payment or download.",
      "Move from browsing to direct discussion faster."
    ]
  },
  support: {
    eyebrow: "Fast contact",
    title: "Need support right now?",
    copy: "Use Zalo or phone to talk directly. The support dock still stays available everywhere for quick access.",
    routeAction: { href: "https://zalo.me/0902964685", label: "Open Zalo support", sub: "Talk directly now", icon: "CHAT", external: true }
  },
  sections: {
    footerCta: {
      title: "Want to go back to the right branch before contacting us?",
      desc: "You can return to Web Design or Software first if the need is already clear, then contact us in the final step."
    }
  }
});

function getPublicContent() {
  return PUBLIC_PAGE_CONTENT[lang] || PUBLIC_PAGE_CONTENT.vi;
}

function toClassToken(value) {
  return String(value || "default").toLowerCase().replace(/[^a-z0-9-]/g, "") || "default";
}

function isExternalHref(href) {
  return /^https?:\/\//i.test(String(href || ""));
}

function buildActionButtonHtml(action) {
  if (!action) return "";
  const className = action.variant === "outline" ? "btn btn-outline" : "btn btn-accent";
  const target = action.external ? ' target="_blank" rel="noopener"' : "";
  return `<a class="${className}" href="${escapeHtml(action.href)}"${target}>${escapeHtml(action.label)}</a>`;
}

function buildStoryCardHtml(card) {
  if (!card) return "";
  const tone = toClassToken(card.tone);
  const visual = card.visual
    ? `<div class="story-card-visual" aria-hidden="true">
        <div class="story-visual-browser">
          <span></span>
          <span></span>
          <span></span>
          <i></i>
          <i></i>
        </div>
      </div>`
    : "";
  const badge = card.badge ? `<span class="story-card-badge">${escapeHtml(card.badge)}</span>` : "";
  const tags = card.tags?.length
    ? `<div class="story-card-tags">${card.tags.map((tag) => `<span>${escapeHtml(tag)}</span>`).join("")}</div>`
    : "";
  const link = card.linkHref && card.linkLabel
    ? `<a class="story-link" href="${escapeHtml(card.linkHref)}"${card.external ? ' target="_blank" rel="noopener"' : ""}>${escapeHtml(card.linkLabel)}</a>`
    : "";
  return `<article class="story-card is-${escapeHtml(tone)}${card.visual ? " has-visual" : ""}">${visual}${badge}<h3>${escapeHtml(card.title)}</h3><p>${escapeHtml(card.text)}</p>${tags}${link}</article>`;
}

function renderHomeContent(homeContent) {
  if (!homeContent) return;
  if (homeHeroBadge) homeHeroBadge.textContent = homeContent.hero.badge;
  if (homeHeroTitleMain) homeHeroTitleMain.textContent = homeContent.hero.titleMain;
  if (homeHeroTitleSub) {
    const heroSub = String(homeContent.hero.titleSub || "").trim();
    homeHeroTitleSub.textContent = heroSub;
    homeHeroTitleSub.hidden = !heroSub;
  }
  if (homeHeroTitleTail) {
    const heroTail = String(homeContent.hero.titleTail || "").trim();
    homeHeroTitleTail.textContent = heroTail;
    homeHeroTitleTail.hidden = !heroTail;
  }
  if (homeHeroDesc) {
    const heroDesc = String(homeContent.hero.desc || "").trim();
    homeHeroDesc.textContent = heroDesc;
    homeHeroDesc.hidden = !heroDesc;
  }
  if (homeHeroPrimaryCta && homeContent.hero.primary) {
    homeHeroPrimaryCta.textContent = homeContent.hero.primary.label;
    homeHeroPrimaryCta.href = homeContent.hero.primary.href;
  }
  if (homeHeroSecondaryCta && homeContent.hero.secondary) {
    homeHeroSecondaryCta.textContent = homeContent.hero.secondary.label;
    homeHeroSecondaryCta.href = homeContent.hero.secondary.href;
  }
  if (homePathwaysEyebrow) {
    const pathwaysEyebrow = String(homeContent.pathways.eyebrow || "").trim();
    homePathwaysEyebrow.textContent = pathwaysEyebrow;
    homePathwaysEyebrow.hidden = !pathwaysEyebrow;
  }
  if (homePathwaysTitle) homePathwaysTitle.textContent = homeContent.pathways.title;
  if (homePathwaysSub) {
    const pathwaysSub = String(homeContent.pathways.sub || "").trim();
    homePathwaysSub.textContent = pathwaysSub;
    homePathwaysSub.hidden = !pathwaysSub;
  }
  if (homePathwayGrid) {
    homePathwayGrid.innerHTML = homeContent.pathways.cards.map((card) => `
      <article class="pathway-card is-${escapeHtml(card.tone || "default")}">
        <div class="pathway-card-visual">
          <div class="pathway-preview">
            <span class="pathway-preview-tag">${escapeHtml(card.previewTag || card.eyebrow || "")}</span>
            <div class="pathway-preview-window">
              <div class="pathway-preview-top">
                <span></span>
                <span></span>
                <span></span>
              </div>
              <div class="pathway-preview-main">
                <strong>${escapeHtml(card.previewTitle || card.title)}</strong>
                <small>${escapeHtml(card.previewSub || card.text)}</small>
              </div>
              <div class="pathway-preview-strip">
                ${(card.previewItems || []).map((item) => `<span>${escapeHtml(item)}</span>`).join("")}
              </div>
            </div>
          </div>
        </div>
        <div class="pathway-card-body">
          <span class="pathway-card-eyebrow">${escapeHtml(card.eyebrow)}</span>
          <h3>${escapeHtml(card.title)}</h3>
          <p>${escapeHtml(card.text)}</p>
          <div class="pathway-card-meta">${card.meta.map((item) => `<span>${escapeHtml(item)}</span>`).join("")}</div>
          <a class="pathway-card-link" href="${escapeHtml(card.href)}">${escapeHtml(card.cta)}</a>
        </div>
      </article>
    `).join("");
  }
  if (homeBenefitsEyebrow) {
    const benefitsEyebrow = String(homeContent.benefits.eyebrow || "").trim();
    homeBenefitsEyebrow.textContent = benefitsEyebrow;
    homeBenefitsEyebrow.hidden = !benefitsEyebrow;
  }
  if (homeBenefitsTitle) homeBenefitsTitle.textContent = homeContent.benefits.title;
  if (homeBenefitsSub) {
    const benefitsSub = String(homeContent.benefits.sub || "").trim();
    homeBenefitsSub.textContent = benefitsSub;
    homeBenefitsSub.hidden = !benefitsSub;
  }
  if (homeBenefitsGrid) {
    homeBenefitsGrid.innerHTML = homeContent.benefits.items.map((item, index) => `
      <article class="value-card">
        <div class="value-card-top">
          <span class="value-card-index">0${index + 1}</span>
          <span class="value-card-kicker">${escapeHtml(item.kicker || "")}</span>
        </div>
        <h3>${escapeHtml(item.title)}</h3>
        <p>${escapeHtml(item.text)}</p>
      </article>
    `).join("");
  }
}

function renderPageHero(routeContent) {
  if (!routeContent?.hero) return;
  const hero = routeContent.hero;
  if (pageHeroVideo && pageHeroVideoSource) {
    const nextVideoSrc = String(hero.videoSrc || "/Video/hero-web-brand.mp4").trim();
    if (pageHeroVideoSource.getAttribute("src") !== nextVideoSrc) {
      pageHeroVideoSource.setAttribute("src", nextVideoSrc);
      pageHeroVideo.load();
    }
    pageHeroVideo.play().catch(() => {});
  }
  if (pageHeroKicker) {
    const kicker = String(hero.kicker || "").trim();
    pageHeroKicker.textContent = kicker;
    pageHeroKicker.hidden = !kicker;
  }
  if (pageHeroTitle) pageHeroTitle.textContent = hero.title;
  if (pageHeroDesc) {
    const desc = String(hero.desc || "").trim();
    pageHeroDesc.textContent = desc;
    pageHeroDesc.hidden = !desc;
  }
  if (pageHeroTags) {
    const tagsHtml = (hero.tags || []).map((tag) => `<span>${escapeHtml(tag)}</span>`).join("");
    pageHeroTags.innerHTML = tagsHtml;
    pageHeroTags.hidden = !tagsHtml;
  }
  if (pageHeroActions) {
    const actionsHtml = (hero.actions || []).map(buildActionButtonHtml).join("");
    pageHeroActions.innerHTML = actionsHtml;
    pageHeroActions.hidden = !actionsHtml;
  }
  if (pageHeroSide) {
    pageHeroSide.innerHTML = routeContent.side
      ? `<div class="page-hero-side-panel">
          <span class="page-hero-side-label">${escapeHtml(routeContent.side.label || "")}</span>
          <strong>${escapeHtml(routeContent.side.title || "")}</strong>
          <ul class="page-hero-side-list">${(routeContent.side.items || []).map((item) => `<li>${escapeHtml(item)}</li>`).join("")}</ul>
        </div>`
      : "";
  }
}

function renderRouteStory(routeContent) {
  if (!routeStoryContent) return;
  const story = routeContent?.story;
  if (!story) {
    routeStoryContent.innerHTML = "";
    return;
  }
  if (story.previewCluster?.cards?.length) {
    const previewItems = story.previewCluster.cards;
    const defaultId = story.previewCluster.defaultId || previewItems[0].id;
    routeStoryContent.innerHTML = `
      <div class="software-preview-heading-wrap">
        <h2 class="software-preview-heading">${escapeHtml(story.title || "")}</h2>
      </div>
      <div class="software-preview-layout">
        <div class="software-preview-list" role="listbox" aria-label="Software preview groups">
          ${previewItems.map((item) => `
            <button class="software-preview-item" data-preview-id="${escapeHtml(item.id)}" role="option" aria-selected="false">
              <span class="software-preview-item-mini is-${escapeHtml(item.tone || "default")}" aria-hidden="true"><i></i><i></i><i></i></span>
              <span class="software-preview-item-copy">
                <strong>${escapeHtml(item.label || "")}</strong>
                <small>${escapeHtml(item.kind || "")}</small>
              </span>
            </button>
          `).join("")}
        </div>
        <article class="software-preview-card" id="softwarePreviewCard">
          <div class="software-preview-browser" id="softwarePreviewBrowser">
            <div class="software-preview-browser-top"><span></span><span></span><span></span></div>
            <div class="software-preview-page">
              <div class="software-preview-page-copy">
                <span id="softwarePreviewPill"></span>
                <strong id="softwarePreviewTitle"></strong>
                <small id="softwarePreviewDesc"></small>
              </div>
              <div class="software-preview-page-media"><i></i><i></i></div>
              <div class="software-preview-page-strip"><i></i><i></i><i></i></div>
            </div>
          </div>
          <div class="software-preview-summary">
            <h3 id="softwarePreviewLabel"></h3>
            <p id="softwarePreviewKind"></p>
            <div class="software-preview-features" id="softwarePreviewFeatures"></div>
          </div>
        </article>
      </div>
    `;

    const buttons = Array.from(routeStoryContent.querySelectorAll(".software-preview-item"));
    const pillEl = routeStoryContent.querySelector("#softwarePreviewPill");
    const titleEl = routeStoryContent.querySelector("#softwarePreviewTitle");
    const descEl = routeStoryContent.querySelector("#softwarePreviewDesc");
    const labelEl = routeStoryContent.querySelector("#softwarePreviewLabel");
    const kindEl = routeStoryContent.querySelector("#softwarePreviewKind");
    const featuresEl = routeStoryContent.querySelector("#softwarePreviewFeatures");
    const browserEl = routeStoryContent.querySelector("#softwarePreviewBrowser");

    const renderPreview = (id) => {
      const item = previewItems.find((entry) => entry.id === id) || previewItems[0];
      buttons.forEach((btn) => {
        const active = btn.dataset.previewId === item.id;
        btn.classList.toggle("active", active);
        btn.setAttribute("aria-selected", active ? "true" : "false");
      });
      if (pillEl) pillEl.textContent = item.pill || "";
      if (titleEl) titleEl.textContent = item.title || "";
      if (descEl) descEl.textContent = item.desc || "";
      if (labelEl) labelEl.textContent = item.label || "";
      if (kindEl) kindEl.textContent = item.kind || "";
      if (featuresEl) featuresEl.innerHTML = (item.features || []).map((feature) => `<span>${escapeHtml(feature)}</span>`).join("");
      if (browserEl) {
        browserEl.className = `software-preview-browser is-${toClassToken(item.tone || "default")}`;
      }
    };

    buttons.forEach((btn) => {
      const id = btn.dataset.previewId;
      btn.addEventListener("mouseenter", () => renderPreview(id));
      btn.addEventListener("focus", () => renderPreview(id));
      btn.addEventListener("click", () => renderPreview(id));
    });

    renderPreview(defaultId);
    return;
  }

  const cards = story.cards || [];
  const storyGridClass = cards.length === 1 ? "story-grid story-grid--single" : "story-grid";
  routeStoryContent.innerHTML = `
    <div class="story-shell">
      <div class="story-main">
        <span class="section-eyebrow">${escapeHtml(story.eyebrow || "")}</span>
        <h2>${escapeHtml(story.title || "")}</h2>
        <p>${escapeHtml(story.copy || "")}</p>
      </div>
      ${story.checklist?.length ? `<aside class="story-side-card"><strong>${escapeHtml(story.checklistTitle || "")}</strong><ul class="story-checklist">${story.checklist.map((item) => `<li>${escapeHtml(item)}</li>`).join("")}</ul></aside>` : ""}
    </div>
    ${cards.length ? `<div class="${storyGridClass}">${cards.map(buildStoryCardHtml).join("")}</div>` : ""}
  `;
}

function buildWebTemplateCardHtml(card) {
  if (!card) return "";
  const tone = toClassToken(card.tone);
  const demoTarget = isExternalHref(card.demoHref) ? ' target="_blank" rel="noopener"' : "";
  const buyTarget = isExternalHref(card.buyHref) ? ' target="_blank" rel="noopener"' : "";
  const meta = card.meta?.length
    ? `<ul class="web-template-meta">${card.meta.map((item) => `<li>${escapeHtml(item)}</li>`).join("")}</ul>`
    : "";
  const demoLabel = lang === "en" ? "View demo" : "Xem demo";
  const buyLabel = lang === "en" ? "Buy this sample" : "Mua mẫu này";

  return `
    <article class="web-template-card is-${escapeHtml(tone)}">
      <div class="web-template-preview" aria-hidden="true">
        <div class="web-template-browser">
          <span></span>
          <span></span>
          <span></span>
          <i></i>
          <i></i>
          <i></i>
        </div>
      </div>
      <div class="web-template-body">
        <span class="web-template-label">${escapeHtml(card.label || "")}</span>
        <h3>${escapeHtml(card.title || "")}</h3>
        <strong class="web-template-price">${escapeHtml(card.price || "")}</strong>
        <p>${escapeHtml(card.text || "")}</p>
        ${meta}
        <div class="web-template-actions">
          <a href="${escapeHtml(card.demoHref || "/mau-demo")}"${demoTarget}>${demoLabel}</a>
          <a class="is-buy" href="${escapeHtml(card.buyHref || "https://zalo.me/0902964685")}"${buyTarget}>${buyLabel}</a>
        </div>
      </div>
    </article>
  `;
}

function buildWebInfoCardHtml(card) {
  if (!card) return "";
  return `
    <article class="web-info-card">
      <h3>${escapeHtml(card.title || "")}</h3>
      <p>${escapeHtml(card.text || "")}</p>
      ${card.note ? `<span>${escapeHtml(card.note)}</span>` : ""}
    </article>
  `;
}

function buildWebPriceCardHtml(card) {
  if (!card) return "";
  const items = card.items?.length
    ? `<ul>${card.items.map((item) => `<li>${escapeHtml(item)}</li>`).join("")}</ul>`
    : "";
  return `
    <article class="web-price-card">
      <h3>${escapeHtml(card.title || "")}</h3>
      <strong>${escapeHtml(card.price || "")}</strong>
      <p>${escapeHtml(card.text || "")}</p>
      ${items}
    </article>
  `;
}

function renderWebBuild(routeContent) {
  if (!webBuildContent) return;
  const build = routeContent?.webBuild;
  if (!build) {
    webBuildContent.innerHTML = "";
    return;
  }

  const templates = build.templates || {};
  const zero = build.zero || {};
  const process = build.process || {};
  const pricing = build.pricing || {};
  const domain = build.domain || {};
  const admin = build.admin || {};
  const final = build.final || {};

  if (build.summary) {
    const summary = build.summary;
    webBuildContent.innerHTML = `
      <div class="web-build-stack">
        <section class="web-build-summary-card">
          <div class="web-build-summary-preview" aria-hidden="true">
            <div class="web-build-summary-browser">
              <div class="web-build-summary-browser-top"><span></span><span></span><span></span></div>
              <div class="web-build-summary-page">
                <div class="web-build-summary-copy">
                  <span>FAST WEB</span>
                  <strong>Web mẫu<br/>triển khai nhanh</strong>
                  <small>Dùng ngay, tự chỉnh nội dung, tối ưu cho nhu cầu triển khai sớm.</small>
                </div>
                <div class="web-build-summary-media">
                  <i></i>
                  <i></i>
                </div>
                <div class="web-build-summary-strip"><i></i><i></i><i></i></div>
              </div>
            </div>
          </div>
          <div class="web-build-summary-content">
            <span class="section-eyebrow">${escapeHtml(summary.eyebrow || "")}</span>
            <h2>${escapeHtml(summary.title || "")}</h2>
            <p>${escapeHtml(summary.copy || "")}</p>
          </div>
          <div class="web-final-actions">${(summary.actions || []).map(buildActionButtonHtml).join("")}</div>
        </section>
      </div>
    `;
    return;
  }

  webBuildContent.innerHTML = `
    <div class="web-build-stack">
      <section class="web-build-block web-template-block">
        <div class="web-build-head">
          <span class="section-eyebrow">${escapeHtml(templates.eyebrow || "")}</span>
          <h2>${escapeHtml(templates.title || "")}</h2>
          <p>${escapeHtml(templates.copy || "")}</p>
        </div>
        <div class="web-template-grid">${(templates.cards || []).map(buildWebTemplateCardHtml).join("")}</div>
      </section>

      <section class="web-zero-panel">
        <div>
          <span class="section-eyebrow">${escapeHtml(zero.eyebrow || "")}</span>
          <h2>${escapeHtml(zero.title || "")}</h2>
          <p>${escapeHtml(zero.copy || "")}</p>
        </div>
        <div class="web-zero-list">${(zero.items || []).map((item) => `<span>${escapeHtml(item)}</span>`).join("")}</div>
      </section>

      <section class="web-process-block">
        <div class="web-build-head center">
          <span class="section-eyebrow">${escapeHtml(process.eyebrow || "")}</span>
          <h2>${escapeHtml(process.title || "")}</h2>
        </div>
        <div class="web-process-grid">${(process.steps || []).map((step, index) => `
          <article class="web-process-step">
            <span>${String(index + 1).padStart(2, "0")}</span>
            <h3>${escapeHtml(step.title || "")}</h3>
            <p>${escapeHtml(step.text || "")}</p>
          </article>
        `).join("")}</div>
      </section>

      <section class="web-pricing-block">
        <div class="web-build-head">
          <span class="section-eyebrow">${escapeHtml(pricing.eyebrow || "")}</span>
          <h2>${escapeHtml(pricing.title || "")}</h2>
        </div>
        <div class="web-price-grid">${(pricing.cards || []).map(buildWebPriceCardHtml).join("")}</div>
      </section>

      <section class="web-domain-block">
        <div class="web-build-head">
          <span class="section-eyebrow">${escapeHtml(domain.eyebrow || "")}</span>
          <h2>${escapeHtml(domain.title || "")}</h2>
        </div>
        <div class="web-info-grid">${(domain.cards || []).map(buildWebInfoCardHtml).join("")}</div>
      </section>

      <section class="web-admin-panel">
        <div class="web-admin-copy">
          <span class="section-eyebrow">${escapeHtml(admin.eyebrow || "")}</span>
          <h2>${escapeHtml(admin.title || "")}</h2>
          <p>${escapeHtml(admin.copy || "")}</p>
        </div>
        <div class="web-admin-lists">
          <div>
            <strong>${escapeHtml(admin.allowTitle || "")}</strong>
            ${(admin.allow || []).map((item) => `<span>${escapeHtml(item)}</span>`).join("")}
          </div>
          <div>
            <strong>${escapeHtml(admin.limitTitle || "")}</strong>
            ${(admin.limit || []).map((item) => `<span>${escapeHtml(item)}</span>`).join("")}
          </div>
        </div>
      </section>

      <section class="web-final-panel">
        <div>
          <h2>${escapeHtml(final.title || "")}</h2>
          <p>${escapeHtml(final.copy || "")}</p>
        </div>
        <div class="web-final-actions">${(final.actions || []).map(buildActionButtonHtml).join("")}</div>
      </section>
    </div>
  `;
}

function renderSupportDockContent(content) {
  if (!supportDock) return;
  const support = content?.support;
  const staticCopy = getPublicContent().supportStatic || PUBLIC_PAGE_CONTENT.vi.supportStatic;
  if (supportDockEyebrow) supportDockEyebrow.textContent = support?.eyebrow || "";
  if (supportDockTitle) supportDockTitle.textContent = support?.title || "";
  if (supportDockCopy) supportDockCopy.textContent = support?.copy || "";
  if (supportZaloTitle) supportZaloTitle.textContent = staticCopy.zaloTitle;
  if (supportZaloSub) supportZaloSub.textContent = staticCopy.zaloSub;
  if (supportPhoneTitle) supportPhoneTitle.textContent = staticCopy.phoneTitle;
  if (supportPhoneSub) supportPhoneSub.textContent = staticCopy.phoneSub;
  if (supportRouteAction && support?.routeAction) {
    supportRouteAction.href = support.routeAction.href;
    if (support.routeAction.external) {
      supportRouteAction.target = "_blank";
      supportRouteAction.rel = "noopener";
    } else {
      supportRouteAction.removeAttribute("target");
      supportRouteAction.removeAttribute("rel");
    }
    supportRouteAction.title = support.routeAction.label;
    const icon = supportRouteAction.querySelector(".support-chip-icon");
    if (icon) icon.textContent = support.routeAction.icon || "GO";
  }
  if (supportRouteTitle) supportRouteTitle.textContent = support?.routeAction?.label || "";
  if (supportRouteSub) supportRouteSub.textContent = support?.routeAction?.sub || "";
}

function renderSectionCopy(routeContent) {
  const sections = routeContent?.sections || {};
  if (webDemoEyebrow) webDemoEyebrow.textContent = sections.webDemo?.eyebrow || t("web_demo_eyebrow");
  if (webDemoSectionTitle) webDemoSectionTitle.textContent = sections.webDemo?.title || t("web_demo_title");
  if (webDemoSectionSub) webDemoSectionSub.textContent = sections.webDemo?.sub || t("web_demo_sub");
  if (catalogEyebrow) catalogEyebrow.textContent = sections.catalog?.eyebrow || t("cat_title");
  if (catalogTitle) catalogTitle.textContent = sections.catalog?.title || t("cat_title");
  if (catalogSub) {
    const catalogSubText = sections.catalog?.sub ?? t("cat_sub");
    catalogSub.textContent = catalogSubText;
    catalogSub.hidden = !String(catalogSubText || "").trim();
  }
  if (productsTitle) productsTitle.textContent = sections.productsTitle || t("products_title");
  if (howEyebrow) howEyebrow.textContent = sections.how?.eyebrow || t("how_title");
  if (howTitle) howTitle.textContent = sections.how?.title || t("how_title");
  if (howSub) {
    const howSubText = sections.how?.sub ?? t("how_sub");
    howSub.textContent = howSubText;
    howSub.hidden = !String(howSubText || "").trim();
  }
  const footerCopy = sections.footerCta || getPublicContent().home.footerCta;
  if (footerCtaTitle) footerCtaTitle.textContent = footerCopy?.title || "";
  if (footerCtaDesc) footerCtaDesc.textContent = footerCopy?.desc || "";
}

function syncRouteVisibility() {
  routedSections.forEach((section) => {
    const views = String(section.dataset.views || "").split(",").map((item) => item.trim()).filter(Boolean);
    section.hidden = views.length ? !views.includes(currentRoute) : false;
  });
}

function syncHeaderState() {
  document.body.dataset.route = currentRoute;
  if (headerSearchWrap) headerSearchWrap.hidden = !routeNeedsCatalog();
  routeLinks.forEach((link) => {
    const isActive = link.dataset.routeLink === getPrimaryNavRoute();
    link.classList.toggle("is-active", isActive);
    link.setAttribute("aria-current", isActive ? "page" : "false");
  });
}

function syncCatalogRouteState() {
  const forcedCategory = getForcedCatalogCategory();
  activeCat = forcedCategory || activeCat || "all";
  if (!forcedCategory && !["all", "hoctap", "lamviec"].includes(activeCat)) {
    activeCat = "all";
  }
}

function renderPublicPage() {
  const content = getPublicContent();
  const routeContent = currentRoute === "home" ? null : (content.routes[currentRoute] || content.routes.software || null);
  syncRouteVisibility();
  syncHeaderState();
  syncCatalogRouteState();
  renderHomeContent(content.home);
  renderPageHero(routeContent);
  renderRouteStory(routeContent);
  renderWebBuild(routeContent);
  renderSectionCopy(routeContent || { sections: { footerCta: content.home.footerCta } });
  renderSupportDockContent(currentRoute === "home" ? content.home : routeContent);
  document.title = routeContent?.pageTitle || content.home.pageTitle || content.baseTitle || t("meta_title");
}

const WEB_DEMOS = {
  vi: {
    company: {
      label: "Mẫu lấy lead",
      title: "Công ty / Dịch vụ chuyên nghiệp",
      desc: "Tone tin cậy, sạch, doanh nghiệp: hero lớn, dịch vụ, quy trình, khách hàng và CTA nhận tư vấn.",
      pill: "LEAD",
      mockTitle: "Dịch vụ chuyên nghiệp",
      mockSub: "Hero tin cậy, quy trình rõ, form nhận tư vấn.",
      cardTitle: "Công ty / Dịch vụ",
      cardKind: "Tin cậy, quy trình, lead",
      features: ["Hero lớn", "Quy trình", "CTA lấy lead"]
    },
    shop: {
      label: "Mẫu chốt đơn",
      title: "Shop bán hàng",
      desc: "Tone năng động, dễ mua: banner khuyến mãi, danh mục, sản phẩm nổi bật, feedback và CTA mua ngay.",
      pill: "SALE",
      mockTitle: "Ưu đãi hôm nay",
      mockSub: "Danh mục rõ, sản phẩm nổi bật, chốt đơn nhanh.",
      cardTitle: "Shop bán hàng",
      cardKind: "Khuyến mãi, sản phẩm, đơn",
      features: ["Banner sale", "Sản phẩm nổi bật", "Mua ngay"]
    },
    education: {
      label: "Mẫu đăng ký học",
      title: "Giáo dục / Khóa học",
      desc: "Tone thân thiện, truyền cảm hứng: chương trình học, lợi ích, lộ trình, giảng viên và form đăng ký.",
      pill: "EDU",
      mockTitle: "Lộ trình học mới",
      mockSub: "Chương trình, lợi ích, giảng viên, đăng ký học.",
      cardTitle: "Giáo dục / Khóa học",
      cardKind: "Lộ trình, giảng viên, đăng ký",
      features: ["Lộ trình học", "Giảng viên", "Đăng ký"]
    },
    spa: {
      label: "Mẫu đặt lịch",
      title: "Spa / Thẩm mỹ / Làm đẹp",
      desc: "Tone cao cấp, mềm, sang: dịch vụ nổi bật, before-after, bảng giá và đặt lịch nhanh.",
      pill: "SPA",
      mockTitle: "Liệu trình cao cấp",
      mockSub: "Dịch vụ, before-after, bảng giá, lịch hẹn.",
      cardTitle: "Spa / Làm đẹp",
      cardKind: "Sang, mềm, đặt lịch",
      features: ["Before-after", "Bảng giá", "Đặt lịch"]
    },
    restaurant: {
      label: "Mẫu local business",
      title: "Nhà hàng / Quán / Local business",
      desc: "Tone trực quan, giàu hình ảnh: món nổi bật, menu, không gian, bản đồ và CTA đặt bàn/gọi món.",
      pill: "LOCAL",
      mockTitle: "Món nổi bật hôm nay",
      mockSub: "Menu nhanh, không gian, bản đồ, đặt bàn.",
      cardTitle: "Nhà hàng / Local",
      cardKind: "Món nổi bật, bản đồ, đặt bàn",
      features: ["Menu trực quan", "Bản đồ", "Đặt bàn"]
    }
  },
  en: {
    company: {
      label: "Lead-gen demo",
      title: "Company / Professional Services",
      desc: "Trustworthy, clean, business-focused: large hero, services, process, clients, and consultation CTA.",
      pill: "LEAD",
      mockTitle: "Professional services",
      mockSub: "Trust hero, clear process, consultation form.",
      cardTitle: "Company / Services",
      cardKind: "Trust, process, leads",
      features: ["Large hero", "Process", "Lead CTA"]
    },
    shop: {
      label: "Sales demo",
      title: "Online Shop",
      desc: "Energetic and easy to buy: promo banner, categories, featured products, feedback, and buy-now CTA.",
      pill: "SALE",
      mockTitle: "Today offers",
      mockSub: "Clear categories, featured products, quick checkout.",
      cardTitle: "Online Shop",
      cardKind: "Promo, products, orders",
      features: ["Sale banner", "Featured products", "Buy now"]
    },
    education: {
      label: "Enrollment demo",
      title: "Education / Courses",
      desc: "Friendly and inspiring: program intro, benefits, learning path, instructors, and registration form.",
      pill: "EDU",
      mockTitle: "New learning path",
      mockSub: "Program, benefits, instructors, enrollment.",
      cardTitle: "Education / Courses",
      cardKind: "Roadmap, teachers, signup",
      features: ["Learning path", "Instructors", "Signup"]
    },
    spa: {
      label: "Booking demo",
      title: "Spa / Beauty",
      desc: "Premium, soft, elegant: featured services, before-after proof, pricing, and appointment booking.",
      pill: "SPA",
      mockTitle: "Premium treatment",
      mockSub: "Services, before-after, pricing, booking.",
      cardTitle: "Spa / Beauty",
      cardKind: "Elegant, soft, booking",
      features: ["Before-after", "Pricing", "Booking"]
    },
    restaurant: {
      label: "Local business demo",
      title: "Restaurant / Local Business",
      desc: "Visual and image-rich: featured dishes, menu, space, map, and reservation/order CTA.",
      pill: "LOCAL",
      mockTitle: "Today signature dish",
      mockSub: "Quick menu, space, map, reservation.",
      cardTitle: "Restaurant / Local",
      cardKind: "Food, map, booking",
      features: ["Visual menu", "Map", "Reservation"]
    }
  }
};

let activeWebDemo = "company";
const WEB_DEMO_IMAGES = {
  company: "/web-demo-company.jpg",
  shop: "/web-demo-shop-hero.png",
  education: "/web-demo-photo.jpg",
  spa: "/web-demo-photo.jpg",
  restaurant: "/web-demo-photo.jpg"
};
const webDemoButtons = Array.from(document.querySelectorAll("[data-web-demo]"));
const webDemoFrame = document.getElementById("webDemoFrame");
const webDemoLabel = document.getElementById("webDemoLabel");
const webDemoTitle = document.getElementById("webDemoTitle");
const webDemoDesc = document.getElementById("webDemoDesc");
const webDemoFeatures = document.getElementById("webDemoFeatures");
const webDemoPill = document.getElementById("webDemoPill");
const webDemoMockTitle = document.getElementById("webDemoMockTitle");
const webDemoMockSub = document.getElementById("webDemoMockSub");
const webDemoImage = document.getElementById("webDemoImage");
const webDemoViewLink = document.getElementById("webDemoViewLink");

function renderWebDemo(nextId) {
  if (nextId) activeWebDemo = nextId;
  const demos = WEB_DEMOS[lang] || WEB_DEMOS.vi;
  const item = demos[activeWebDemo] || demos.company;
  if (!item || !webDemoTitle) return;

  webDemoButtons.forEach((button) => {
    const id = button.dataset.webDemo;
    const buttonItem = demos[id] || WEB_DEMOS.vi[id];
    button.classList.toggle("active", id === activeWebDemo);
    const name = button.querySelector(".web-demo-industry-name");
    const kind = button.querySelector(".web-demo-industry-kind");
    const link = button.querySelector(".web-demo-card-link");
    if (name && buttonItem) name.textContent = buttonItem.cardTitle;
    if (kind && buttonItem) kind.textContent = buttonItem.cardKind;
    if (link) link.textContent = t("web_demo_view");
    button.setAttribute("aria-current", id === activeWebDemo ? "true" : "false");
  });

  if (webDemoFrame) webDemoFrame.className = `web-demo-browser is-${activeWebDemo}`;
  if (webDemoLabel) webDemoLabel.textContent = item.label;
  webDemoTitle.textContent = item.title;
  if (webDemoDesc) webDemoDesc.textContent = item.desc;
  if (webDemoPill) webDemoPill.textContent = item.pill;
  if (webDemoMockTitle) webDemoMockTitle.textContent = item.mockTitle;
  if (webDemoMockSub) webDemoMockSub.textContent = item.mockSub;
  if (webDemoImage) {
    webDemoImage.src = WEB_DEMO_IMAGES[activeWebDemo] || "/web-demo-photo.jpg";
    webDemoImage.alt = item.title;
  }
  if (webDemoFeatures) {
    webDemoFeatures.innerHTML = item.features.map((feature) => `<span>${escapeHtml(feature)}</span>`).join("");
  }
  if (webDemoViewLink) {
    webDemoViewLink.href = `/web-demo/${encodeURIComponent(activeWebDemo)}`;
    webDemoViewLink.textContent = t("web_demo_view");
  }
}

webDemoButtons.forEach((button) => {
  button.addEventListener("mouseenter", () => renderWebDemo(button.dataset.webDemo));
  button.addEventListener("focus", () => renderWebDemo(button.dataset.webDemo));
});

function applyLang(){
  document.documentElement.lang = lang;
  document.querySelectorAll("[data-i18n]").forEach(el => { el.textContent = t(el.getAttribute("data-i18n")); });
  document.querySelectorAll("[data-i18n-placeholder]").forEach(el => { el.placeholder = t(el.getAttribute("data-i18n-placeholder")); });
  langToggle.textContent = lang === "vi" ? "VI / EN" : "EN / VI";
  renderPublicPage();
  renderHomeBanner();
  renderWebDemo();
}

function fmtVnd(v){
  return new Intl.NumberFormat(lang==="vi"?"vi-VN":"en-US",{style:"currency",currency:"VND"}).format(v);
}
function fmtDate(d){
  if(!d) return "—";
  return new Date(d).toLocaleDateString(lang==="vi"?"vi-VN":"en-US",{day:"2-digit",month:"2-digit",year:"numeric"});
}
function fmtCycle(c){
  if(c==="monthly") return t("cycle_monthly");
  if(c==="yearly")  return t("cycle_yearly");
  return t("cycle_one_time");
}

function iconFor(appId){
  const id = (appId||"").toLowerCase();
  for(const [k,v] of Object.entries(catIcons)){ if(id.includes(k)) return v; }
  return catIcons.default;
}

function catLabel(appId){ const k="cat_"+(appId||"").toLowerCase(); return t(k); }

function softwareCode(appId) {
  const raw = String(appId || "").trim();
  if (!raw) return "APP-UNKNOWN";
  const normalized = raw.toLowerCase();
  if (normalized === "app-study-12") return "APP-CAP01";
  if (normalized === "app-prompt-image-video") return "APP-VIDEO-CREATOR";
  if (normalized === "app-bds-website-manager") return "APP-BDS-WEB";
  if (normalized === "hair-spa-manager") return "APP-SALON";
  return raw.toUpperCase().replace(/[^A-Z0-9-]/g, "-");
}

function getCatalogCategory(product) {
  const appId = String(product?.appId || "").trim().toLowerCase();
  if (appId === "app-study-12" || appId === "app-cap12") return "hoctap";
  if (appId === "app-prompt-image-video" || appId === "app-bds-website-manager") return "lamviec";
  if (appId === "hair-spa-manager") return "lamviec";
  if (appId.includes("lamviec") || appId.includes("work")) return "lamviec";
  return appId;
}

function softwareIntro(product){
  const raw = String(product?.shortDescription || product?.description || "").trim();
  if (raw) {
    return raw.length > 120 ? `${raw.slice(0, 117)}...` : raw;
  }

  const app = String(product?.appId || "").toLowerCase();
  const name = normalizeText(product?.name);
  if (/(cap 12|lop 12|khoi 12)/.test(name)) {
    return lang === "vi"
      ? "Bộ phần mềm học tập khối cấp 12 giá test 2.000 VND để kiểm tra nhanh card sản phẩm và luồng thanh toán."
      : "A grade-12 learning software card priced at 2,000 VND for quick storefront and payment-flow testing.";
  }
  if (app.includes("hoc") || app.includes("study")) {
    return lang === "vi"
      ? "Bộ công cụ hỗ trợ học tập, tăng tốc ghi nhớ và tối ưu hiệu suất ôn luyện mỗi ngày."
      : "A focused learning toolkit to improve retention and daily study performance.";
  }

  if (app.includes("viec") || app.includes("work")) {
    return lang === "vi"
      ? "Giải pháp giúp tự động hóa tác vụ lặp lại, tiết kiệm thời gian và làm việc chuyên nghiệp hơn."
      : "A workflow solution that automates repetitive tasks and improves professional output.";
  }

  if (app.includes("hair") || app.includes("salon")) {
    return lang === "vi"
      ? "Phần mềm quản lý salon tóc: lịch hẹn, khách hàng, dịch vụ, thu chi và vận hành tại quầy trong một nơi."
      : "A salon management app for appointments, customers, services, cashier flow, and daily operations.";
  }

  return lang === "vi"
    ? "Phiên bản bản quyền ổn định, kích hoạt nhanh, phù hợp triển khai sử dụng ngay."
    : "A stable licensed version with quick activation, ready for immediate use.";
}

function isStudyCap01Family(product) {
  const id = normalizeText(product?.id);
  const name = normalizeText(product?.name);
  const appId = normalizeText(product?.appId);
  return (
    appId === "app study 12" ||
    /phan mem hoc tap cho hoc sinh khoi cap 01|phan mem on tap khoi cap 01 tien tieu hoc|khoi cap 01|tien tieu hoc|prod study/.test(`${id} ${name}`)
  );
}

function canonicalProductName(product) {
  if (isStudyCap01Family(product)) {
    return "Phần mềm ôn tập cho khối cấp 01 và Tiền Tiểu học";
  }
  return String(product?.name || "").trim();
}

function normalizeProductSaleStatus(value) {
  const normalized = String(value || "").trim().toLowerCase();
  return ["live", "locked", "coming_soon"].includes(normalized) ? normalized : "live";
}

function getProductSaleMeta(product) {
  const saleStatus = normalizeProductSaleStatus(product?.saleStatus);
  const saleNote = String(product?.saleNote || "").trim();
  if (saleStatus === "locked") {
    return {
      saleStatus,
      badge: t("card_status_locked"),
      badgeClass: "is-locked",
      cta: t("card_cta_locked"),
      note: saleNote || t("card_note_locked")
    };
  }
  if (saleStatus === "coming_soon") {
    return {
      saleStatus,
      badge: t("card_status_coming_soon"),
      badgeClass: "is-coming-soon",
      cta: t("card_cta_coming_soon"),
      note: saleNote || t("card_note_coming_soon")
    };
  }
  return {
    saleStatus,
    badge: "",
    badgeClass: "is-live",
    cta: lang === "vi" ? "Xem sản phẩm" : "View product",
    note: saleNote
  };
}

function getProductDisplayPrice(product) {
  const basePrice = Math.max(0, Number(product?.basePrice ?? product?.comparePrice ?? product?.price ?? 0));
  const comparePrice = Math.max(0, Number(product?.comparePrice ?? basePrice));
  const effectivePrice = Math.max(0, Number(product?.effectivePrice ?? product?.salePrice ?? product?.price ?? 0));
  const hasDirectSale = Boolean(product?.saleEnabled) && comparePrice > effectivePrice;
  return {
    basePrice,
    comparePrice,
    effectivePrice,
    hasDirectSale
  };
}

function pickStudyCap01Representative(products) {
  const preferredIds = [
    "prod-study-month",
    "prod-study-year",
    "prod-study-standard-lifetime",
    "prod-study-premium-month",
    "prod-study-premium-year",
    "prod-study-premium-lifetime"
  ];
  for (const id of preferredIds) {
    const found = products.find((item) => item.id === id);
    if (found) return found;
  }
  return products[0] || null;
}

function buildStorefrontProducts(products) {
  const list = Array.isArray(products) ? products.slice() : [];
  const studyFamily = list.filter(isStudyCap01Family);
  const others = list.filter((item) => !isStudyCap01Family(item));
  const representative = pickStudyCap01Representative(studyFamily);
  return representative ? [representative, ...others] : others;
}

/* ═══════════════ AUTH STATE ═══════════════ */
function setLoggedIn(snapshot){
  currentUser = snapshot;
  navLoginBtn.classList.add("is-hidden");
  navRegisterBtn.classList.add("is-hidden");
  userMenu.classList.remove("is-hidden");
  const currentEmail = snapshot.customer?.email || "user";
  userEmail.textContent = currentEmail;
  if (userMenuBtn) {
    userMenuBtn.setAttribute("aria-label", `Mở menu tài khoản (${currentEmail})`);
  }
}

function setLoggedOut(){
  currentUser = null;
  navLoginBtn.classList.remove("is-hidden");
  navRegisterBtn.classList.remove("is-hidden");
  userMenu.classList.add("is-hidden");
  userDropdown.classList.remove("show");
  if (userMenuBtn) {
    userMenuBtn.setAttribute("aria-label", "Mở menu tài khoản");
  }
}

async function checkAuth(){
  try {
    const res = await fetch("/api/auth/me", { credentials: "same-origin" });
    if(!res.ok) { setLoggedOut(); return; }
    const data = await res.json();
    if(data.customer) setLoggedIn(data);
    else setLoggedOut();
  } catch { setLoggedOut(); }
}

function seedAuthState(snapshot){
  if(!snapshot?.customer) return false;
  setLoggedIn({
    customer: snapshot.customer,
    wallets: Array.isArray(snapshot.wallets) ? snapshot.wallets : [],
    subscriptions: Array.isArray(snapshot.subscriptions) ? snapshot.subscriptions : [],
    orders: Array.isArray(snapshot.orders) ? snapshot.orders : [],
    keyDeliveries: Array.isArray(snapshot.keyDeliveries) ? snapshot.keyDeliveries : []
  });
  return true;
}

async function finalizeAuthFlow(snapshot){
  if(seedAuthState(snapshot)){
    loginModal.classList.remove("show");
    if(pendingPostAuthRedirect){
      const redirectPath = pendingPostAuthRedirect;
      pendingPostAuthRedirect = null;
      window.location.assign(redirectPath);
      return;
    }

    // Refresh from the server in the background after the session cookie lands.
    setTimeout(() => {
      checkAuth().catch(() => {});
    }, 250);
    return;
  }

  await checkAuth();
  if(!currentUser){
    // Retry once for slow cookie propagation in some browsers/proxies.
    await new Promise((resolve)=>setTimeout(resolve, 150));
    await checkAuth();
  }

  if(currentUser){
    loginModal.classList.remove("show");
    if(pendingPostAuthRedirect){
      const redirectPath = pendingPostAuthRedirect;
      pendingPostAuthRedirect = null;
      window.location.assign(redirectPath);
      return;
    }
    return;
  }

  loginError.textContent = t("modal_login_error_db");
}

async function handleGoogleCredential(credential){
  try {
    const res = await fetch("/api/auth/customer/google", {
      method: "POST",
      credentials: "same-origin",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ credential })
    });
    const data = await res.json();
    if (!res.ok) {
      loginError.textContent = data.message || t("modal_google_failed");
      return;
    }
    await finalizeAuthFlow(data);
  } catch {
    loginError.textContent = t("modal_google_failed");
  }
}

function renderGoogleAuthButtons() {
  if (!googleAuthClientId || !window.google?.accounts?.id) {
    return;
  }

  if (!(googleLoginWrap && googleRegisterWrap && googleLoginBtn && googleRegisterBtn)) {
    return;
  }

  googleLoginWrap.style.display = "block";
  googleRegisterWrap.style.display = "block";
  googleLoginBtn.innerHTML = "";
  googleRegisterBtn.innerHTML = "";

  const buttonOptions = {
    type: "standard",
    theme: "outline",
    size: "large",
    text: "continue_with",
    shape: "pill",
    width: 320
  };

  window.google.accounts.id.renderButton(googleLoginBtn, buttonOptions);
  window.google.accounts.id.renderButton(googleRegisterBtn, buttonOptions);
}

async function initGoogleAuth(){
  if (googleAuthInitialized) return;

  try {
    const res = await fetch("/api/auth/google/config");
    if (!res.ok) return;

    const config = await res.json();
    const enabled = Boolean(config?.enabled && config?.clientId);
    if (!enabled) {
      return;
    }

    googleAuthClientId = String(config.clientId || "").trim();

    if (!window.google?.accounts?.id) {
      return;
    }

    window.google.accounts.id.initialize({
      client_id: googleAuthClientId,
      callback: (response) => {
        if (!response?.credential) {
          loginError.textContent = t("modal_google_failed");
          return;
        }
        handleGoogleCredential(response.credential);
      }
    });

    renderGoogleAuthButtons();
    googleAuthInitialized = true;
  } catch {
    // Keep email/password auth available even if Google script fails.
  }
}

function ensureGoogleAuthInit() {
  if (googleAuthInitialized) {
    renderGoogleAuthButtons();
    return;
  }

  googleAuthInitAttempts += 1;
  initGoogleAuth().finally(() => {
    if (!googleAuthInitialized && googleAuthInitAttempts < 20) {
      setTimeout(ensureGoogleAuthInit, 300);
    }
  });
}

/* ═══════════════ LOGIN MODAL ═══════════════ */
const navRegisterBtn   = document.getElementById("navRegisterBtn");
const tabLogin         = document.getElementById("tabLogin");
const tabRegister      = document.getElementById("tabRegister");
const loginPane        = document.getElementById("loginPane");
const registerPane     = document.getElementById("registerPane");
const registerForm     = document.getElementById("registerForm");
const switchToRegister = document.getElementById("switchToRegister");
const switchToLogin    = document.getElementById("switchToLogin");

function clearInvalidEmailAutofill(input) {
  if (!input) return;
  const value = String(input.value || "").trim();
  if (value && !value.includes("@")) {
    input.value = "";
  }
}

function resetAuthInputsForUserForms() {
  clearInvalidEmailAutofill(document.getElementById("loginEmail"));
  clearInvalidEmailAutofill(document.getElementById("registerEmail"));
}

async function readApiErrorMessage(response, fallbackKey = "modal_login_error_db") {
  try {
    const payload = await response.json();
    if (payload && typeof payload.message === "string" && payload.message.trim()) {
      return payload.message.trim();
    }
  } catch {
    try {
      const text = await response.text();
      if (text && text.trim()) {
        return text.trim();
      }
    } catch {
      // ignore
    }
  }

  return t(fallbackKey);
}

function showLoginTab(){ tabLogin.classList.add("active"); tabRegister.classList.remove("active"); loginPane.style.display=""; registerPane.style.display="none"; loginError.textContent=""; resetAuthInputsForUserForms(); }
function showRegisterTab(){ tabRegister.classList.add("active"); tabLogin.classList.remove("active"); registerPane.style.display=""; loginPane.style.display="none"; loginError.textContent=""; resetAuthInputsForUserForms(); }

navLoginBtn.addEventListener("click", (e)=>{ e.preventDefault(); showLoginTab(); loginModal.classList.add("show"); ensureGoogleAuthInit(); });
navRegisterBtn.addEventListener("click", (e)=>{ e.preventDefault(); showRegisterTab(); loginModal.classList.add("show"); ensureGoogleAuthInit(); });
loginModalClose.addEventListener("click", ()=> loginModal.classList.remove("show"));
loginModal.addEventListener("click", (e)=>{ if(e.target===loginModal) loginModal.classList.remove("show"); });
tabLogin.addEventListener("click", showLoginTab);
tabRegister.addEventListener("click", showRegisterTab);
switchToRegister.addEventListener("click", (e)=>{ e.preventDefault(); showRegisterTab(); });
switchToLogin.addEventListener("click", (e)=>{ e.preventDefault(); showLoginTab(); });

loginForm.addEventListener("submit", async (e)=>{
  e.preventDefault();
  const email = document.getElementById("loginEmail").value.trim();
  const password = document.getElementById("loginPassword").value;
  if(!email){ loginError.textContent = t("modal_login_error_email"); return; }
  if(!password || password.length < 8){ loginError.textContent = t("modal_login_error_password"); return; }
  loginError.textContent = "";
  try {
    const res = await fetch("/api/auth/customer/login",{
      method:"POST", credentials: "same-origin", headers:{"Content-Type":"application/json"},
      body: JSON.stringify({ email, password })
    });
    if(!res.ok){ loginError.textContent = await readApiErrorMessage(res); return; }
    await finalizeAuthFlow(await res.json());
  } catch {
    loginError.textContent = t("modal_auth_error_network");
  }
});

registerForm.addEventListener("submit", async (e)=>{
  e.preventDefault();
  const email = document.getElementById("registerEmail").value.trim();
  const fullName = document.getElementById("registerName").value.trim();
  const password = document.getElementById("registerPassword").value;
  const code = (registerCodeInput?.value || "").trim();
  if(!email){ loginError.textContent = t("modal_login_error_email"); return; }
  if(!fullName){ loginError.textContent = t("modal_register_error_name"); return; }
  if(!password || password.length < 8){ loginError.textContent = t("modal_register_error_password"); return; }
  if(!code || code.length !== 6){ loginError.textContent = "Vui lòng nhập mã xác minh 6 số"; return; }
  loginError.textContent = "";
  try {
    const res = await fetch("/api/auth/customer/register",{
      method:"POST", credentials: "same-origin", headers:{"Content-Type":"application/json"},
      body: JSON.stringify({ email, fullName, password, code })
    });
    if(!res.ok){ loginError.textContent = await readApiErrorMessage(res); return; }
    await finalizeAuthFlow(await res.json());
  } catch {
    loginError.textContent = t("modal_auth_error_network");
  }
});

sendRegisterCodeBtn?.addEventListener("click", async ()=>{
  const email = document.getElementById("registerEmail").value.trim();
  if(!email){ loginError.textContent = t("modal_login_error_email"); return; }

  loginError.textContent = "";
  sendRegisterCodeBtn.disabled = true;
  sendRegisterCodeBtn.textContent = "Đang gửi...";
  try {
    const res = await fetch("/api/auth/customer/register/send-code", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email })
    });
    const data = await res.json();
    if(!res.ok){
      loginError.textContent = data.message || "Không gửi được mã";
      return;
    }
    loginError.style.color = "#16a34a";
    loginError.textContent = data.message || "Đã gửi mã xác minh";
  } catch {
    loginError.textContent = "Không gửi được mã xác minh";
  } finally {
    sendRegisterCodeBtn.disabled = false;
    sendRegisterCodeBtn.textContent = "Gửi mã";
    setTimeout(() => { loginError.style.color = ""; }, 1200);
  }
});

forgotPasswordLink?.addEventListener("click", async (e)=>{
  e.preventDefault();

  const email = window.prompt("Nhập email tài khoản để nhận mã reset:");
  if(!email) return;

  try {
    const sendRes = await fetch("/api/auth/customer/password-reset/send-code", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: email.trim() })
    });
    const sendData = await sendRes.json();
    if(!sendRes.ok){
      loginError.textContent = sendData.message || "Không gửi được mã reset";
      return;
    }

    const code = window.prompt("Nhập mã 6 số đã gửi về Gmail:");
    if(!code) return;
    const newPassword = window.prompt("Nhập mật khẩu mới (tối thiểu 8 ký tự):");
    if(!newPassword) return;

    const confirmRes = await fetch("/api/auth/customer/password-reset/confirm", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: email.trim(), code: code.trim(), newPassword })
    });
    const confirmData = await confirmRes.json();
    if(!confirmRes.ok){
      loginError.textContent = confirmData.message || "Không đặt lại được mật khẩu";
      return;
    }

    loginError.style.color = "#16a34a";
    loginError.textContent = confirmData.message || "Đặt lại mật khẩu thành công";
    setTimeout(() => { loginError.style.color = ""; }, 1200);
  } catch {
    loginError.textContent = "Có lỗi khi xử lý quên mật khẩu";
  }
});

/* ═══════════════ USER MENU ═══════════════ */
userMenuBtn.addEventListener("click", ()=> userDropdown.classList.toggle("show"));
document.addEventListener("click", (e)=>{ if(!userMenu.contains(e.target)) userDropdown.classList.remove("show"); });

dropLogout.addEventListener("click", async (e)=>{
  e.preventDefault();
  await fetch("/api/auth/customer/logout",{method:"POST"});
  setLoggedOut();
});

navMyProducts.addEventListener("click", (e)=>{
  e.preventDefault();
  if(!currentUser){
    pendingPostAuthRedirect = ACCOUNT_DOWNLOADS_PATH;
    showLoginTab();
    loginModal.classList.add("show");
    ensureGoogleAuthInit();
    return;
  }
  window.location.assign(ACCOUNT_DOWNLOADS_PATH);
});
dropMyProducts.addEventListener("click", (e)=>{
  e.preventDefault();
  userDropdown.classList.remove("show");
  if(!currentUser){
    pendingPostAuthRedirect = ACCOUNT_DOWNLOADS_PATH;
    showLoginTab();
    loginModal.classList.add("show");
    ensureGoogleAuthInit();
    return;
  }
  window.location.assign(ACCOUNT_DOWNLOADS_PATH);
});

/* ═══════════════ RENDER CATALOG ═══════════════ */
function escapeHtml(value) {
  return String(value || "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/\"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function showNotice(message, options = {}) {
  if (!catalogNotice) return;

  const tone = options.tone || "muted";
  const title = options.title ? `<strong class="catalog-notice-title">${escapeHtml(options.title)}</strong>` : "";
  const detail = options.detail ? `<span class="catalog-notice-detail">${escapeHtml(options.detail)}</span>` : "";
  const badgeText = tone === "success"
    ? (lang === "vi" ? "LIVE" : "LIVE")
    : (lang === "vi" ? "PREVIEW" : "PREVIEW");

  catalogNotice.className = `catalog-notice${message ? " is-visible" : ""}${tone ? ` is-${tone}` : ""}`;
  catalogNotice.innerHTML = message
    ? `<span class="catalog-notice-badge">${badgeText}</span><div class="catalog-notice-copy">${title}<span class="catalog-notice-message">${escapeHtml(message)}</span>${detail}</div>`
    : "";
}

async function getApiHealthHint() {
  try {
    const res = await fetch("/api/health");
    const payload = await res.json().catch(() => ({}));
    return {
      ok: res.ok,
      database: String(payload?.database || "").toLowerCase(),
      message: String(payload?.message || "").trim()
    };
  } catch {
    return null;
  }
}

function buildTabs(){
  if (!catTabs) return;

  const forcedCategory = getForcedCatalogCategory();
  if (forcedCategory) {
    catTabs.innerHTML = `<button class="cat-tab active is-locked" data-cat="${forcedCategory}" disabled>${t("cat_" + forcedCategory)}</button>`;
    return;
  }

  catTabs.innerHTML = `<button class="cat-tab ${activeCat==="all"?"active":""}" data-cat="all">${t("cat_all")}</button>`;
  fixedCategories.forEach(key => {
    catTabs.innerHTML += `<button class="cat-tab ${activeCat===key?"active":""}" data-cat="${key}">${t("cat_"+key)}</button>`;
  });
  catTabs.querySelectorAll(".cat-tab").forEach(btn => {
    btn.addEventListener("click", ()=>{ activeCat=btn.dataset.cat; renderProducts(); buildTabs(); });
  });
}

function renderProducts(){
  const q = (searchInput.value||"").toLowerCase();
  const filtered = allProducts.filter(p => {
    const displayName = canonicalProductName(p).toLowerCase();
    const matchCat = activeCat==="all" || getCatalogCategory(p)===activeCat;
    const matchQ   = !q || p.name.toLowerCase().includes(q) || displayName.includes(q) || (p.appId||"").toLowerCase().includes(q);
    return matchCat && matchQ;
  });

  productList.innerHTML = "";
  if (!filtered.length) {
    productList.innerHTML = `<article class="catalog-empty-card"><strong>${t("notice_search_empty")}</strong><p>${t("notice_fallback")}</p></article>`;
    return;
  }

  filtered.forEach(p => {
    const productName = canonicalProductName(p);
    const isFeat = p.cycle === "yearly";
    const intro = softwareIntro(p);
    const saleMeta = getProductSaleMeta(p);
    const pricing = getProductDisplayPrice(p);
    const resolvedImage = resolveProductImage(p);
    const visual = resolvedImage
      ? `<img class="p-card-img-photo" src="${resolvedImage}" alt="${productName}">`
      : `<div class="p-card-img-fallback">
          <span class="p-card-img-kicker">${softwareCode(p.appId)}</span>
          <strong>${productName}</strong>
          <p>${intro}</p>
        </div>`;
    const card   = document.createElement("article");
    card.className = "p-card";
    card.innerHTML = `
      ${isFeat ? `<span class="p-badge">${t("tag_best")}</span>` : ""}
      <div class="p-card-img">${visual}</div>
      <div class="p-card-body">
        <div class="p-card-topline">
          <span class="p-card-cat">${softwareCode(p.appId)}</span>
          ${saleMeta.badge ? `<span class="p-sale-chip ${saleMeta.badgeClass}">${saleMeta.badge}</span>` : ""}
        </div>
        <h3 class="p-card-name">${productName}</h3>
        <p class="p-card-intro">${intro}</p>
        <p class="p-card-meta">${fmtCycle(p.cycle)}</p>
        <div class="p-card-price-row">
          <span class="p-card-price">${fmtVnd(pricing.effectivePrice)}</span>
          ${pricing.hasDirectSale ? `<span class="p-card-old-price">${fmtVnd(pricing.comparePrice)}</span>` : ""}
        </div>
        ${saleMeta.note ? `<p class="p-card-sale-note">${escapeHtml(saleMeta.note)}</p>` : ""}
      </div>
      <a class="p-card-btn ${saleMeta.saleStatus !== "live" ? "is-muted" : ""}" href="/product/${p.id}">${saleMeta.cta}</a>`;

    card.querySelector(".p-card-btn").addEventListener("click", (e)=>{
      // navigation handled by <a href>
    });

    productList.appendChild(card);
  });
}

/* ── banner carousel ── */
/* "Trăng tím" — dark violet gradients khi không có ảnh */
const moonPurpleGradients = [
  "linear-gradient(135deg,#1e1b4b 0%,#4c1d95 100%)",
  "linear-gradient(135deg,#2d1b69 0%,#7c3aed 100%)",
  "linear-gradient(135deg,#1e3a5f 0%,#5b21b6 100%)",
  "linear-gradient(135deg,#3b0e6e 0%,#a855f7 100%)",
  "linear-gradient(135deg,#0f172a 0%,#4f46e5 100%)",
  "linear-gradient(135deg,#1e0936 0%,#7c2d87 100%)"
];
/* Tất cả ảnh có trong thư mục — dùng theo vòng để banner luôn có ảnh */
const bannerImagePool = [
  imagePathByName("phần mềm học tập khối cấp 01.jpeg"),
  imagePathByName("phần mềm học tập khối cấp 12.jpeg"),
  imagePathByName("Phần mềm quét data KH-GGmap.jpeg"),
  imagePathByName("Phần mềm tạo video đồng bộ nhân vật.jpeg"),
  imagePathByName("Quản_lý_website_BDS.jpeg"),
  imagePathByName("phần mềm quét data KH_1.jpeg")
];
function renderBannerLegacy(){
  const track = document.getElementById("bannerTrack");
  if(!track || !allProducts.length) return;
  const items = allProducts.map((p,i)=>{
    const productName = canonicalProductName(p);
    const fallbackBg = moonPurpleGradients[i % moonPurpleGradients.length];
    const imgSrc = p.image || bannerImagePool[i % bannerImagePool.length];
    const pricing = getProductDisplayPrice(p);
    return `<a class="banner-card" href="/product/${encodeURIComponent(p.id)}" style="background:${fallbackBg}">
      <img class="banner-card-bg" src="${imgSrc}" alt="" loading="lazy">
      <div class="banner-card-shine"></div>
      <div class="banner-card-content">
        <div class="banner-card-title">${productName}</div>
        <div class="banner-card-sub">${fmtVnd(pricing.effectivePrice)}${pricing.hasDirectSale ? ` (gốc ${fmtVnd(pricing.comparePrice)})` : ""} · ${fmtCycle(p.cycle)}</div>
      </div>
    </a>`;
  });
  // duplicate for seamless loop
  track.innerHTML = items.join("") + items.join("");

  // step-scroll with pause
  const firstCard = track.querySelector(".banner-card");
  const trackStyles = window.getComputedStyle(track);
  const cardGap = parseFloat(trackStyles.columnGap || trackStyles.gap || "0") || 0;
  const cardW = firstCard ? firstCard.getBoundingClientRect().width + cardGap : 300;
  const total = allProducts.length;
  let step = 0;
  let paused = false;
  let timer;

  track.closest(".banner-carousel").addEventListener("mouseenter", ()=>{ paused = true; });
  track.closest(".banner-carousel").addEventListener("mouseleave", ()=>{ paused = false; });

  function advance(){
    if(paused) return;
    step++;
    if(step >= total){
      // jump back seamlessly
      track.style.transition = "none";
      track.style.transform = "translateX(0)";
      step = 0;
      requestAnimationFrame(()=>{
        requestAnimationFrame(()=>{
          track.style.transition = "transform .8s cubic-bezier(.4,0,.2,1)";
          step++;
          track.style.transform = `translateX(-${step * cardW}px)`;
        });
      });
    } else {
      track.style.transform = `translateX(-${step * cardW}px)`;
    }
  }

  timer = setInterval(advance, 3000);
}

/* ── load catalog ── */
async function loadCatalog(){
  try{
    const res = await fetch("/api/catalog");
    if(!res.ok) throw new Error(res.status);
    const data = await res.json();
    const products = Array.isArray(data.products) ? data.products : [];
    const publicProducts = products.filter(p => !isInternalTestProduct(p));
    if(!publicProducts.length){
      catalogMode = "fallback";
      allProducts = fallbackProducts.filter(p => !isInternalTestProduct(p));
      showNotice(t("notice_empty"), {
        tone: "warning",
        title: t("notice_preview_title"),
        detail: t("notice_preview_detail")
      });
    }
    else {
      catalogMode = "live";
      allProducts = publicProducts;
      allProducts._live = true;
      showNotice("");
    }
  } catch(e){
    const health = await getApiHealthHint();
    catalogMode = "fallback";
    allProducts = fallbackProducts.filter(p => !isInternalTestProduct(p));
    showNotice(t("notice_fallback"), {
      tone: "warning",
      title: t("notice_preview_title"),
      detail: health?.database === "disconnected" || /database/i.test(health?.message || "")
        ? t("notice_db_down_detail")
        : t("notice_preview_detail")
    });
    console.warn("Catalog fallback",e);
  }
  allProducts = allProducts.map(p => ({ ...p, image: resolveProductImage(p) }));
  allProducts = buildStorefrontProducts(allProducts);
  buildTabs();
  renderProducts();
  renderHomeBanner();
}

function renderHomeBanner(){
  const track = document.getElementById("bannerTrack");
  if(!track) return;
  const bannerCopyMap = {
    vi: {
      hub: { title: "Toàn hệ", meta: "Đi nhanh các nhánh" },
      web: { title: "Thiết kế Web", meta: "Demo theo ngành" },
      software: { title: "Phần mềm", meta: "App, key, công cụ" },
      branch: { title: "Học tập & Làm việc", meta: "2 nhánh bên trong" },
      guide: { title: "Hướng dẫn", meta: "Mua và nhận app" },
      contact: { title: "Liên hệ", meta: "Zalo, điện thoại" }
    },
    en: {
      hub: { title: "Hub", meta: "Jump across sections" },
      web: { title: "Web Design", meta: "Industry demos" },
      software: { title: "Software", meta: "Apps, keys, tools" },
      branch: { title: "Study & Work", meta: "Two sub-branches" },
      guide: { title: "Guide", meta: "Buy and receive apps" },
      contact: { title: "Contact", meta: "Zalo and phone" }
    }
  };
  const localeBannerCopy = bannerCopyMap[lang] || bannerCopyMap.vi;
  const bannerItems = (getPublicContent().home?.banner || []).map((item) => `
    <a class="banner-pill-card is-${escapeHtml(item.tone || "default")}" href="${escapeHtml(item.href)}">
      <span class="banner-pill-media" aria-hidden="true">
        <span class="banner-pill-media-top">
          <span></span>
          <span></span>
          <span></span>
        </span>
        <span class="banner-pill-media-main"></span>
        <span class="banner-pill-media-foot">
          <span></span>
          <span></span>
        </span>
      </span>
      <span class="banner-pill-copy">
        <span class="banner-pill-label">${escapeHtml(item.tag || item.label || "")}</span>
        <strong>${escapeHtml(localeBannerCopy[item.tone]?.title || item.title || item.label || "")}</strong>
        <small>${escapeHtml(localeBannerCopy[item.tone]?.meta || item.meta || item.sub || "")}</small>
      </span>
    </a>
  `);
  track.innerHTML = bannerItems.concat(bannerItems).join("");
}

searchInput?.addEventListener("input", renderProducts);

function shouldUseSameTabCheckout() {
  if (typeof window === "undefined") return false;
  const mobileByWidth = window.matchMedia && window.matchMedia("(max-width: 768px)").matches;
  const mobileByUa = /Android|iPhone|iPad|iPod|Mobile/i.test(navigator.userAgent || "");
  return mobileByWidth || mobileByUa;
}

langToggle.addEventListener("click", ()=>{
  lang = lang==="vi"?"en":"vi";
  localStorage.setItem("wst_lang",lang);
  applyLang();
  if (routeNeedsCatalog()) {
    buildTabs();
    renderProducts();
  }
});

applyLang();
if (routeNeedsCatalog()) {
  loadCatalog();
}
checkAuth().then(() => {
  const params = new URLSearchParams(location.search);
  const nextPath = params.get("next");
  if (params.get("auth") === "login") {
    pendingPostAuthRedirect = nextPath && nextPath.startsWith("/") ? nextPath : ACCOUNT_DOWNLOADS_PATH;
    history.replaceState(null, "", location.pathname);
    showLoginTab();
    loginModal.classList.add("show");
    ensureGoogleAuthInit();
    return;
  }

  if (params.get("myproducts") === "1") {
    history.replaceState(null, "", location.pathname);
    if (currentUser) {
      window.location.assign(ACCOUNT_DOWNLOADS_PATH);
    } else {
      pendingPostAuthRedirect = ACCOUNT_DOWNLOADS_PATH;
      showLoginTab();
      loginModal.classList.add("show");
      ensureGoogleAuthInit();
    }
  }
});
setTimeout(ensureGoogleAuthInit, 50);
