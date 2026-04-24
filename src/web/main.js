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
const purchasedDrawer  = document.getElementById("purchasedDrawer");
const purchasedClose   = document.getElementById("purchasedDrawerClose");
const dropMyProducts   = document.getElementById("dropMyProducts");
const dropLogout       = document.getElementById("dropLogout");

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
  { id:"demo-map",   appId:"lamviec", name:"Phần Mềm Quét Data Khách Hàng Trên Google Map", cycle:"one_time", price:499000, credits:3 },
  { id:"demo-cv1",   appId:"lamviec", name:"Phần mềm tạo video đồng bộ nhân vật", cycle:"monthly",  price:399000, credits:2 },
  { id:"demo-cv2",   appId:"lamviec", name:"Phần mềm quản lý site bất động sản và bài viết", cycle:"monthly",  price:300000, credits:2 }
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
  bds: imagePathByName("Quản_lý_website_BDS.jpeg")
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
    nav_products:"Sản phẩm", nav_lookup:"Tra cứu đơn", nav_login:"Đăng nhập", nav_admin:"Admin",
    nav_my_products:"Sản phẩm đã mua", nav_balance:"Số dư", nav_logout:"Đăng xuất",
    hero_badge:"✨ Ứng dụng học tập & làm việc",
    hero_line1:"Ứng Dụng Thông Minh", hero_line2:"",
    hero_sub:"Gọn, nhanh, dùng được ngay.",
    hero_guide:"Hướng dẫn sử dụng",
    hero_logo_key:"Kích hoạt nhanh",
    hero_logo_app:"Học tập gọn",
    hero_logo_pro:"Bản quyền rõ",
    hero_logo_web_tile:"Web",
    hero_logo_web:"Thiết kế web chuyên nghiệp",
    hero_logo_web_sub:"Nhanh chóng",
    trust_products:"Sản phẩm", trust_orders:"Đơn đã giao", trust_rating:"Đánh giá", trust_support:"Hỗ trợ",
    cat_title:"Danh mục sản phẩm", cat_sub:"Chọn danh mục hoặc xem tất cả sản phẩm bên dưới", cat_all:"Tất cả",
    cat_hoctap:"Học tập", cat_lamviec:"Làm việc",
    products_title:"Sản phẩm bán chạy",
    how_title:"Hướng dẫn mua hàng", how_sub:"Chỉ 3 bước đơn giản để nhận key tự động",
    step1_t:"Chọn sản phẩm", step1_d:"Duyệt danh mục, chọn gói phù hợp và bấm Mua ngay.",
    step2_t:"Thanh toán", step2_d:"Quét QR tự động, nhanh chóng.",
    step3_t:"Nhận key tự động", step3_d:"Key hiển thị ngay trên trang đơn hàng và cổng khách hàng.",
    footer_desc:"Nền tảng bán key phần mềm bản quyền tự động. Thanh toán linh hoạt, giao key ngay.",
    footer_quick:"Truy cập nhanh", footer_policy:"Chính sách", footer_contact:"Liên hệ",
    card_buy:"Mua ngay", card_sold:"đã bán",
    tag_best:"NÊN CHỌN",
    cycle_monthly:"Tháng", cycle_yearly:"Năm", cycle_one_time:"Một lần",
    error_create:"Không tạo được đơn hàng",
    notice_fallback:"Đang hiển thị dữ liệu demo — API/DB chưa sẵn sàng.",
    notice_empty:"Catalog đang trống, hãy seed dữ liệu.",
    notice_preview_title:"Đang chạy ở chế độ preview",
    notice_preview_detail:"Vẫn hiển thị danh sách sản phẩm demo để trang chủ không bị trắng. Muốn tạo đơn thật trên Vercel, hãy cấu hình DATABASE_URL.",
    notice_db_down_detail:"API đang chạy nhưng cơ sở dữ liệu chưa kết nối. Trang chủ đang dùng dữ liệu demo tạm thời.",
    notice_live_title:"Kết nối catalog thành công",
    notice_live_detail:"Dữ liệu sản phẩm đang lấy trực tiếp từ API live.",
    notice_search_empty:"Không có sản phẩm phù hợp với bộ lọc hiện tại.",
    alert_preview:"Preview mode: API/DB chưa sẵn sàng. Vui lòng bật PostgreSQL để tạo đơn thật.",
    modal_login_title:"Đăng nhập",
    modal_login_desc:"Nhập email để đăng nhập.",
    modal_login_email_label:"Email",
    modal_login_password_label:"Mật khẩu",
    modal_login_btn:"Đăng nhập",
    modal_login_error_email:"Vui lòng nhập email hợp lệ",
    modal_login_error_password:"Mật khẩu tối thiểu 8 ký tự",
    modal_login_error_db:"Không thể đăng nhập. Vui lòng thử lại.",
    modal_auth_error_network:"Không kết nối được máy chủ. Vui lòng thử lại.",
    modal_login_no_account:"Chưa có tài khoản?",
    modal_register_link:"Đăng ký ngay",
    modal_register_title:"Đăng ký",
    modal_register_desc:"Nhập email và họ tên để tạo tài khoản mới.",
    modal_register_name_label:"Họ tên",
    modal_register_password_label:"Mật khẩu",
    modal_register_btn:"Đăng ký",
    modal_register_error_name:"Vui lòng nhập họ tên",
    modal_register_error_password:"Mật khẩu tối thiểu 8 ký tự",
    modal_register_has_account:"Đã có tài khoản?",
    modal_login_link:"Đăng nhập ngay",
    modal_google_or:"Hoặc tiếp tục với Google",
    modal_google_not_ready:"Đăng nhập Google chưa được bật.",
    modal_google_failed:"Không thể đăng nhập bằng Google. Vui lòng thử lại.",
    nav_register:"Đăng ký",
    testimonials_title:"Đánh giá từ khách hàng",
    testimonials_sub:"Hơn 10,000 khách hàng hài lòng",
    testimonial_1:"\"Key giao rất nhanh, dùng thử ngay được, chất lượng tốt. Sẽ quay lại.\"",
    testimonial_author_1:"Dũng LÊ",
    testimonial_2:"\"Tư vấn tận tình, hỗ trợ 24/7. Rất uy tín. Giá cả hợp lý.\"",
    testimonial_author_2:"Nga Trương",
    testimonial_3:"\"Mua lần thứ 5 rồi. Luôn ổn định. Đặc biệt hỗ trợ nhanh.\"",
    testimonial_author_3:"Trần NGọc Hải",
    purchased_title:"Sản phẩm đã mua",
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
    nav_products:"Products", nav_lookup:"Order lookup", nav_login:"Login", nav_admin:"Admin",
    nav_my_products:"My Products", nav_balance:"Balance", nav_logout:"Logout",
    hero_badge:"✨ Apps for study & work",
    hero_line1:"Smart Applications", hero_line2:"",
    hero_sub:"Clean, fast, ready to use.",
    hero_guide:"How to use",
    hero_logo_key:"Fast activation",
    hero_logo_app:"Lean study flow",
    hero_logo_pro:"Clear licensing",
    hero_logo_web_tile:"Web",
    hero_logo_web:"Professional web design",
    hero_logo_web_sub:"Fast delivery",
    trust_products:"Products", trust_orders:"Orders delivered", trust_rating:"Rating", trust_support:"Support",
    cat_title:"Product categories", cat_sub:"Choose a category or browse all products below", cat_all:"All",
    cat_hoctap:"Study", cat_lamviec:"Work",
    products_title:"Best sellers",
    how_title:"How to buy", how_sub:"Just 3 simple steps to get your key",
    step1_t:"Choose product", step1_d:"Browse categories, pick the right plan and click Buy now.",
    step2_t:"Make payment", step2_d:"Scan QR code automatically, fast and easy.",
    step3_t:"Get key instantly", step3_d:"Key appears on the order page and customer portal right away.",
    footer_desc:"Automated software key marketplace. Pay with Sepay, get key instantly.",
    footer_quick:"Quick links", footer_policy:"Policies", footer_contact:"Contact",
    card_buy:"Buy now", card_sold:"sold",
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
let pendingOpenPurchasedAfterAuth = false;
let googleAuthInitialized = false;
let googleAuthClientId = "";
let googleAuthInitAttempts = 0;
let catalogMode = "loading";

function t(k){ return (T[lang]||T.vi)[k] || k; }

function applyLang(){
  document.documentElement.lang = lang;
  document.title = t("meta_title");
  document.querySelectorAll("[data-i18n]").forEach(el => { el.textContent = t(el.getAttribute("data-i18n")); });
  document.querySelectorAll("[data-i18n-placeholder]").forEach(el => { el.placeholder = t(el.getAttribute("data-i18n-placeholder")); });
  langToggle.textContent = lang === "vi" ? "VI / EN" : "EN / VI";
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
  return raw.toUpperCase().replace(/[^A-Z0-9-]/g, "-");
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
  userEmail.textContent = snapshot.customer?.email || "user";
}

function setLoggedOut(){
  currentUser = null;
  navLoginBtn.classList.remove("is-hidden");
  navRegisterBtn.classList.remove("is-hidden");
  userMenu.classList.add("is-hidden");
  userDropdown.classList.remove("show");
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
    if(pendingOpenPurchasedAfterAuth){
      pendingOpenPurchasedAfterAuth = false;
      openPurchasedDrawer();
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
    if(pendingOpenPurchasedAfterAuth){
      pendingOpenPurchasedAfterAuth = false;
      openPurchasedDrawer();
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

/* ═══════════════ PURCHASED PRODUCTS DRAWER ═══════════════ */
function openPurchasedDrawer(e){ if(e) e.preventDefault(); purchasedDrawer.classList.add("show"); renderPurchased(); }
navMyProducts.addEventListener("click", (e)=>{ if(!currentUser){ e.preventDefault(); pendingOpenPurchasedAfterAuth = true; showLoginTab(); loginModal.classList.add("show"); return; } openPurchasedDrawer(e); });
dropMyProducts.addEventListener("click", (e)=>{ userDropdown.classList.remove("show"); openPurchasedDrawer(e); });
purchasedClose.addEventListener("click", ()=> purchasedDrawer.classList.remove("show"));
purchasedDrawer.addEventListener("click", (e)=>{ if(e.target===purchasedDrawer) purchasedDrawer.classList.remove("show"); });

function expiryStatus(endAt){
  if(!endAt) return { cls:"", label:"" };
  const diff = new Date(endAt) - new Date();
  const days = Math.ceil(diff / 86400000);
  if(days < 0) return { cls:"expiry-expired", label:t("expired") };
  if(days <= 7) return { cls:"expiry-warn", label:t("expiring_soon")+" ("+days+"d)" };
  return { cls:"expiry-ok", label:t("status_active") };
}

function renderPurchased(){
  if(!currentUser){ return; }
  const { subscriptions, keyDeliveries, orders } = currentUser;

  // Subscriptions
  const sEl = document.getElementById("drawerSubs");
  if(subscriptions && subscriptions.length){
    sEl.innerHTML = subscriptions.map(s=>{
      const exp = expiryStatus(s.endAt);
      const autoRenew = s.renewalMode === "auto";
      return `<div class="sub-card ${exp.cls}">
        <div class="sub-card-head">
          <strong>${iconFor(s.appId)} ${s.appId}</strong>
          <span class="sub-status-tag ${exp.cls}">${exp.label}</span>
        </div>
        <p class="sub-dates">${t("active_until")} ${fmtDate(s.endAt)}</p>
        <div class="sub-actions">
          <span class="auto-renew-label ${autoRenew?"on":"off"}">${autoRenew?t("auto_renew_on"):t("auto_renew_off")}</span>
          <button class="btn-renew" data-app="${s.appId}" data-product="${s.productId}">${t("renewal_btn")}</button>
        </div>
      </div>`;
    }).join("");
    sEl.querySelectorAll(".btn-renew").forEach(btn=>{
      btn.addEventListener("click", async ()=>{
        if(!currentUser){ alert(t("alert_preview")); return; }
        try{
          const res = await fetch("/api/orders",{
            method:"POST", headers:{"Content-Type":"application/json"},
            body:JSON.stringify({ appId:btn.dataset.app, productId:btn.dataset.product })
          });
          const d = await res.json();
          if(!res.ok){ alert(d.message||t("error_create")); return; }
          window.open(d.checkoutUrl,"_blank");
        } catch{ alert(t("error_create")); }
      });
    });
  } else { sEl.innerHTML = `<p class="empty-text">${t("purchased_empty")}</p>`; }

  // Keys
  const kEl = document.getElementById("drawerKeys");
  if(keyDeliveries && keyDeliveries.length){
    kEl.innerHTML = keyDeliveries.map(k=>
      `<div class="key-delivery-card">
        <p class="key-delivery-meta">${iconFor(k.productId)} ${k.productId} · ${fmtDate(k.deliveredAt)}</p>
        <div class="key-box">🔑 ${k.keyValue}</div>
      </div>`
    ).join("");
  } else { kEl.innerHTML = `<p class="empty-text">${t("purchased_empty")}</p>`; }

  // Orders
  const oEl = document.getElementById("drawerOrders");
  if(orders && orders.length){
    oEl.innerHTML = `<table class="data-table"><thead><tr><th>ID</th><th>App</th><th>${lang==="vi"?"Số tiền":"Amount"}</th><th>Status</th><th>${lang==="vi"?"Ngày":"Date"}</th></tr></thead><tbody>`+
      orders.map(o=>{
        const badge = o.status==="paid"?"status-paid":o.status==="pending"?"status-pending":"";
        return `<tr>
          <td style="font-family:monospace;font-size:.78rem">${o.id.slice(0,8)}…</td>
          <td>${o.appId}</td>
          <td>${fmtVnd(o.amount)}</td>
          <td><span class="status-badge ${badge}">${o.status}</span></td>
          <td style="font-size:.8rem">${fmtDate(o.createdAt)}</td>
        </tr>`;
      }).join("")+`</tbody></table>`;
  } else { oEl.innerHTML = `<p class="empty-text">${t("purchased_empty")}</p>`; }
}

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
    const matchCat = activeCat==="all" || (p.appId||"").toLowerCase()===activeCat;
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
        <span class="p-card-cat">${softwareCode(p.appId)}</span>
        <h3 class="p-card-name">${productName}</h3>
        <p class="p-card-intro">${intro}</p>
        <p class="p-card-meta">${fmtCycle(p.cycle)}</p>
        <div class="p-card-price-row">
          <span class="p-card-price">${fmtVnd(p.price)}</span>
        </div>
      </div>
      <a class="p-card-btn" href="/product/${p.id}">${lang==="vi"?"Xem sản phẩm":"View product"}</a>`;

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
function renderBanner(){
  const track = document.getElementById("bannerTrack");
  if(!track || !allProducts.length) return;
  const items = allProducts.map((p,i)=>{
    const productName = canonicalProductName(p);
    const fallbackBg = moonPurpleGradients[i % moonPurpleGradients.length];
    const imgSrc = p.image || bannerImagePool[i % bannerImagePool.length];
    return `<a class="banner-card" href="/product/${encodeURIComponent(p.id)}" style="background:${fallbackBg}">
      <img class="banner-card-bg" src="${imgSrc}" alt="" loading="lazy">
      <div class="banner-card-shine"></div>
      <div class="banner-card-content">
        <div class="banner-card-title">${productName}</div>
        <div class="banner-card-sub">${fmtVnd(p.price)} · ${fmtCycle(p.cycle)}</div>
      </div>
    </a>`;
  });
  // duplicate for seamless loop
  track.innerHTML = items.join("") + items.join("");

  // step-scroll with pause
  const cardW = 280 + 20; // card width + gap
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
  renderBanner();
}

searchInput.addEventListener("input", renderProducts);

langToggle.addEventListener("click", ()=>{
  lang = lang==="vi"?"en":"vi";
  localStorage.setItem("wst_lang",lang);
  applyLang(); buildTabs(); renderProducts();
  if(currentUser) renderPurchased();
});

applyLang();
loadCatalog();
checkAuth().then(() => {
  // Auto-open purchased drawer when redirected from payment success page
  if (new URLSearchParams(location.search).get("myproducts") === "1") {
    history.replaceState(null, "", location.pathname);
    if (currentUser) {
      openPurchasedDrawer();
    } else {
      pendingOpenPurchasedAfterAuth = true;
      showLoginTab();
      loginModal.classList.add("show");
      ensureGoogleAuthInit();
    }
  }
});
setTimeout(ensureGoogleAuthInit, 50);