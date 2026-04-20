/* ═══ main.js — storefront frontend ═══ */
const productList = document.getElementById("productList");
const langToggle  = document.getElementById("langToggle");
const catTabs     = document.getElementById("catTabs");
const searchInput = document.getElementById("searchInput");

/* ── DOM refs: auth & drawer ── */
const navLoginBtn      = document.getElementById("navLoginBtn");
const navMyProducts    = document.getElementById("navMyProducts");
const navBalance       = document.getElementById("navBalance");
const balanceAmount    = document.getElementById("balanceAmount");
const userMenu         = document.getElementById("userMenu");
const userMenuBtn      = document.getElementById("userMenuBtn");
const userEmail        = document.getElementById("userEmail");
const userDropdown     = document.getElementById("userDropdown");
const loginModal       = document.getElementById("loginModal");
const loginModalClose  = document.getElementById("loginModalClose");
const loginForm        = document.getElementById("loginForm");
const loginError       = document.getElementById("loginError");
const purchasedDrawer  = document.getElementById("purchasedDrawer");
const purchasedClose   = document.getElementById("purchasedDrawerClose");
const dropMyProducts   = document.getElementById("dropMyProducts");
const dropLogout       = document.getElementById("dropLogout");

/* ── fallback demo data when API/DB unavailable ── */
const fallbackProducts = [
  { id:"demo-hoc01", appId:"hoctap",  name:"Khóa học cấp 01",              cycle:"one_time", price:49000,  credits:1, image:"/products/image/hoc-cap-01.png" },
  { id:"demo-hoc12", appId:"hoctap",  name:"Khóa học lớp 12",              cycle:"one_time", price:79000,  credits:1, image:"/products/image/hoc-cap-12.png" },
  { id:"demo-map",   appId:"lamviec", name:"Quét data Google Map",        cycle:"one_time", price:499000, credits:3, image:"/products/image/quet-data-gg-map.png" },
  { id:"demo-cv1",   appId:"lamviec", name:"Phần mềm tạo video đồng bộ nhân vật", cycle:"monthly",  price:399000, credits:2, image:"/products/image/Screenshot%202026-04-20%20203856.png" },
  { id:"demo-cv2",   appId:"lamviec", name:"Phần mềm quản lý site bất động sản và bài viết", cycle:"monthly",  price:300000, credits:2, image:"/products/image/Screenshot%202026-04-20%20204104.png" }
];

/* ── category icon map ── */
const catIcons = {
  hoctap:"📚", lamviec:"💼", default:"📦"
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
    hero_badge:"🏆 Store key uy tín #1",
    hero_line1:"Mua key phần mềm bản quyền", hero_line2:"Giao ngay sau thanh toán",
    hero_sub:"Chọn sản phẩm → Thanh Toán → Nhận key tự động. Nhanh gọn, an toàn, hỗ trợ 24/7.",
    hero_guide:"Hướng dẫn mua",
    hc_auto:"Key tự động 24/7", hc_sepay:"Thanh toán linh hoạt", hc_safe:"Bảo hành uy tín",
    trust_products:"Sản phẩm", trust_orders:"Đơn đã giao", trust_rating:"Đánh giá", trust_support:"Hỗ trợ",
    cat_title:"Danh mục sản phẩm", cat_sub:"Chọn danh mục hoặc xem tất cả sản phẩm bên dưới", cat_all:"Tất cả",
    cat_hoctap:"Học tập", cat_lamviec:"Làm việc",
    products_title:"🔥 Sản phẩm bán chạy",
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
    alert_preview:"Preview mode: API/DB chưa sẵn sàng. Vui lòng bật PostgreSQL để tạo đơn thật.",
    modal_login_title:"Đăng nhập",
    modal_login_desc:"Nhập email để đăng nhập.",
    modal_login_email_label:"Email",
    modal_login_btn:"Đăng nhập",
    modal_login_error_email:"Vui lòng nhập email hợp lệ",
    modal_login_error_db:"Không thể đăng nhập. Hãy bật PostgreSQL và thử lại.",
    modal_login_no_account:"Chưa có tài khoản?",
    modal_register_link:"Đăng ký ngay",
    modal_register_title:"Đăng ký",
    modal_register_desc:"Nhập email và họ tên để tạo tài khoản mới.",
    modal_register_name_label:"Họ tên",
    modal_register_btn:"Đăng ký",
    modal_register_error_name:"Vui lòng nhập họ tên",
    modal_register_has_account:"Đã có tài khoản?",
    modal_login_link:"Đăng nhập ngay",
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
    hero_badge:"🏆 Trusted key store #1",
    hero_line1:"Buy genuine software keys", hero_line2:"Delivered instantly after payment",
    hero_sub:"Select product → Pay → Get key automatically. Fast, safe, 24/7 support.",
    hero_guide:"How to buy",
    hc_auto:"24/7 auto delivery", hc_sepay:"Flexible payment", hc_safe:"Reliable warranty",
    trust_products:"Products", trust_orders:"Orders delivered", trust_rating:"Rating", trust_support:"Support",
    cat_title:"Product categories", cat_sub:"Choose a category or browse all products below", cat_all:"All",
    cat_hoctap:"Study", cat_lamviec:"Work",
    products_title:"🔥 Best sellers",
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
    alert_preview:"Preview mode: API/DB not ready. Please start PostgreSQL to create real orders.",
    modal_login_title:"Login",
    modal_login_desc:"Enter your email to login.",
    modal_login_email_label:"Email",
    modal_login_btn:"Login",
    modal_login_error_email:"Please enter a valid email",
    modal_login_error_db:"Cannot login. Please start PostgreSQL and retry.",
    modal_login_no_account:"Don't have an account?",
    modal_register_link:"Register now",
    modal_register_title:"Register",
    modal_register_desc:"Enter email and name to create a new account.",
    modal_register_name_label:"Full name",
    modal_register_btn:"Register",
    modal_register_error_name:"Please enter your name",
    modal_register_has_account:"Already have an account?",
    modal_login_link:"Login now",
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

/* ═══════════════ AUTH STATE ═══════════════ */
function setLoggedIn(snapshot){
  currentUser = snapshot;
  navLoginBtn.classList.add("is-hidden");
  navRegisterBtn.classList.add("is-hidden");
  userMenu.classList.remove("is-hidden");
  navBalance.classList.remove("is-hidden");
  userEmail.textContent = snapshot.customer?.email || "user";
  const totalBal = (snapshot.wallets||[]).reduce((s,w)=>s+w.balance,0);
  balanceAmount.textContent = totalBal.toLocaleString();
}

function setLoggedOut(){
  currentUser = null;
  navLoginBtn.classList.remove("is-hidden");
  navRegisterBtn.classList.remove("is-hidden");
  userMenu.classList.add("is-hidden");
  navBalance.classList.add("is-hidden");
  userDropdown.classList.remove("show");
}

async function checkAuth(){
  try {
    const res = await fetch("/api/auth/me");
    if(!res.ok) { setLoggedOut(); return; }
    const data = await res.json();
    if(data.customer) setLoggedIn(data);
    else setLoggedOut();
  } catch { setLoggedOut(); }
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

function showLoginTab(){ tabLogin.classList.add("active"); tabRegister.classList.remove("active"); loginPane.style.display=""; registerPane.style.display="none"; loginError.textContent=""; }
function showRegisterTab(){ tabRegister.classList.add("active"); tabLogin.classList.remove("active"); registerPane.style.display=""; loginPane.style.display="none"; loginError.textContent=""; }

navLoginBtn.addEventListener("click", (e)=>{ e.preventDefault(); showLoginTab(); loginModal.classList.add("show"); });
navRegisterBtn.addEventListener("click", (e)=>{ e.preventDefault(); showRegisterTab(); loginModal.classList.add("show"); });
loginModalClose.addEventListener("click", ()=> loginModal.classList.remove("show"));
loginModal.addEventListener("click", (e)=>{ if(e.target===loginModal) loginModal.classList.remove("show"); });
tabLogin.addEventListener("click", showLoginTab);
tabRegister.addEventListener("click", showRegisterTab);
switchToRegister.addEventListener("click", (e)=>{ e.preventDefault(); showRegisterTab(); });
switchToLogin.addEventListener("click", (e)=>{ e.preventDefault(); showLoginTab(); });

loginForm.addEventListener("submit", async (e)=>{
  e.preventDefault();
  const email = document.getElementById("loginEmail").value.trim();
  if(!email){ loginError.textContent = t("modal_login_error_email"); return; }
  loginError.textContent = "";
  try {
    const res = await fetch("/api/auth/customer/login",{
      method:"POST", headers:{"Content-Type":"application/json"},
      body: JSON.stringify({ email })
    });
    if(!res.ok){ const d=await res.json(); loginError.textContent=d.message||t("modal_login_error_db"); return; }
    loginModal.classList.remove("show");
    await checkAuth();
  } catch {
    loginError.textContent = t("modal_login_error_db");
  }
});

registerForm.addEventListener("submit", async (e)=>{
  e.preventDefault();
  const email = document.getElementById("registerEmail").value.trim();
  const fullName = document.getElementById("registerName").value.trim();
  if(!email){ loginError.textContent = t("modal_login_error_email"); return; }
  if(!fullName){ loginError.textContent = t("modal_register_error_name"); return; }
  loginError.textContent = "";
  try {
    const res = await fetch("/api/auth/customer/login",{
      method:"POST", headers:{"Content-Type":"application/json"},
      body: JSON.stringify({ email, fullName })
    });
    if(!res.ok){ const d=await res.json(); loginError.textContent=d.message||t("modal_login_error_db"); return; }
    loginModal.classList.remove("show");
    await checkAuth();
  } catch {
    loginError.textContent = t("modal_login_error_db");
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
navMyProducts.addEventListener("click", (e)=>{ if(!currentUser){ e.preventDefault(); loginModal.classList.add("show"); return; } openPurchasedDrawer(e); });
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
  const { wallets, subscriptions, keyDeliveries, orders } = currentUser;

  // Wallet
  const wEl = document.getElementById("drawerWallet");
  if(wallets && wallets.length){
    wEl.innerHTML = wallets.map(w=>
      `<div class="wallet-row"><span class="wallet-app">${iconFor(w.appId)} ${w.appId}</span><span class="wallet-bal">${w.balance.toLocaleString()} credits</span></div>`
    ).join("");
  } else { wEl.innerHTML = `<p class="empty-text">${t("wallet_empty")}</p>`; }

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
function showNotice(msg){ document.getElementById("catalogNotice").textContent = msg; }

function buildTabs(){
  catTabs.innerHTML = `<button class="cat-tab ${activeCat==="all"?"active":""}" data-cat="all">${t("cat_all")}</button>`;
  fixedCategories.forEach(key => {
    catTabs.innerHTML += `<button class="cat-tab ${activeCat===key?"active":""}" data-cat="${key}">${iconFor(key)} ${t("cat_"+key)}</button>`;
  });
  catTabs.querySelectorAll(".cat-tab").forEach(btn => {
    btn.addEventListener("click", ()=>{ activeCat=btn.dataset.cat; renderProducts(); buildTabs(); });
  });
}

function renderProducts(){
  const q = (searchInput.value||"").toLowerCase();
  const filtered = allProducts.filter(p => {
    const matchCat = activeCat==="all" || (p.appId||"").toLowerCase()===activeCat;
    const matchQ   = !q || p.name.toLowerCase().includes(q) || (p.appId||"").toLowerCase().includes(q);
    return matchCat && matchQ;
  });

  productList.innerHTML = "";
  filtered.forEach(p => {
    const isFeat = p.cycle === "yearly";
    const icon   = iconFor(p.appId);
    const visual = p.image
      ? `<img class="p-card-img-photo" src="${p.image}" alt="${p.name}">`
      : icon;
    const card   = document.createElement("article");
    card.className = "p-card";
    card.innerHTML = `
      ${isFeat ? `<span class="p-badge">${t("tag_best")}</span>` : ""}
      <div class="p-card-img">${visual}</div>
      <div class="p-card-body">
        <span class="p-card-cat">${catLabel(p.appId)}</span>
        <h3 class="p-card-name">${p.name}</h3>
        <p class="p-card-meta">${fmtCycle(p.cycle)} · ${p.credits} credit${p.credits>1?"s":""}</p>
        <div class="p-card-price-row">
          <span class="p-card-price">${fmtVnd(p.price)}</span>
        </div>
      </div>
      <button class="p-card-btn">🛒 ${t("card_buy")}</button>`;

    card.querySelector(".p-card-btn").addEventListener("click", async ()=>{
      if(!allProducts._live){
        alert(t("alert_preview"));
        return;
      }
      if(!currentUser){
        loginModal.classList.add("show");
        return;
      }
      const res = await fetch("/api/orders",{
        method:"POST", headers:{"Content-Type":"application/json"},
        body:JSON.stringify({ appId:p.appId, productId:p.id })
      });
      const d = await res.json();
      if(!res.ok){ alert(d.message||t("error_create")); return; }
      window.open(d.checkoutUrl,"_blank");
    });

    productList.appendChild(card);
  });
}

/* ── load catalog ── */
async function loadCatalog(){
  try{
    const res = await fetch("/api/catalog");
    if(!res.ok) throw new Error(res.status);
    const data = await res.json();
    const products = Array.isArray(data.products) ? data.products : [];
    if(!products.length){ allProducts = fallbackProducts; showNotice(t("notice_empty")); }
    else { allProducts = products; allProducts._live = true; showNotice(""); }
  } catch(e){
    allProducts = fallbackProducts;
    showNotice(t("notice_fallback"));
    console.warn("Catalog fallback",e);
  }
  buildTabs();
  renderProducts();
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
checkAuth();