const productList = document.getElementById("productList");
const portalData = document.getElementById("portalData");
const adminData = document.getElementById("adminData");
const usageData = document.getElementById("usageData");
const langToggle = document.getElementById("langToggle");

const translations = {
  vi: {
    meta_title: "Ứng Dụng Thông Minh - Bán phần mềm nhanh, vận hành gọn",
    brand_name: "Ứng Dụng Thông Minh",
    brand_tagline: "Bán phần mềm nhanh, vận hành gọn",
    menu_features: "Tính năng",
    menu_catalog: "Bảng giá",
    menu_account: "Tài khoản",
    menu_admin: "Admin",
    hero_badge: "✦ SaaS commerce cho gói, credit và AI usage",
    hero_title_line1: "Bán phần mềm nhanh,",
    hero_title_line2: "vận hành gọn",
    hero_desc: "Một nền tảng duy nhất để bán gói thuê bao, top-up credit, xử lý thanh toán, cấp quyền và theo dõi usage theo thời gian thực.",
    hero_cta_buy: "Xem bảng giá",
    hero_cta_features: "Xem tính năng bán hàng",
    stat_users: "3 mô hình",
    stat_users_label: "Subscription · Top-up · One-time",
    stat_apps: "Realtime",
    stat_apps_label: "Webhook và ledger",
    stat_uptime: "99.9%",
    stat_uptime_label: "Luồng vận hành ổn định",
    trust_1: "Checkout cho subscription",
    trust_2: "Top-up ví credit",
    trust_3: "Webhook thanh toán",
    trust_4: "Entitlement và usage log",
    features_title: "Bộ công cụ bán phần mềm đầy đủ",
    features_desc: "Từ trang bán hàng đến vận hành nội bộ, mọi thứ đi trong một luồng thống nhất",
    feat1_title: "Catalog công khai",
    feat1_desc: "Trưng bày gói tháng, năm hoặc mua một lần với CTA rõ ràng và checkout nhanh.",
    feat2_title: "Subscription automation",
    feat2_desc: "Tự động kích hoạt thuê bao, gia hạn chu kỳ và cập nhật trạng thái đơn hàng sau thanh toán.",
    feat3_title: "Ví credit linh hoạt",
    feat3_desc: "Bán top-up, trừ usage, ghi ledger hai chiều và giữ lịch sử rõ ràng cho từng ứng dụng.",
    feat4_title: "Webhook và đối soát",
    feat4_desc: "Nhận callback thanh toán, chống lặp giao dịch và ghi nhận transaction an toàn.",
    feat5_title: "Customer portal",
    feat5_desc: "Khách hàng xem subscription, entitlement, wallet và lịch sử giao dịch trong một màn hình.",
    feat6_title: "Bảng điều hành quản trị",
    feat6_desc: "Theo dõi KPI, đơn hàng gần đây và gói đang hoạt động mà không lẫn với phần bán hàng.",
    steps_title: "Luồng bán hàng chuẩn cho SaaS",
    steps_desc: "Thiết lập gói, chốt đơn, tự động cấp quyền",
    step1_title: "Tạo sản phẩm",
    step1_desc: "Khai báo gói thuê bao, gói nạp credit hoặc sản phẩm mua một lần cho từng app.",
    step2_title: "Nhận thanh toán",
    step2_desc: "Khách chọn gói, tạo order, thanh toán và webhook xác nhận giao dịch.",
    step3_title: "Cấp quyền tự động",
    step3_desc: "Subscription, entitlement và wallet được cập nhật ngay để khách dùng dịch vụ tức thì.",
    catalog_title: "Bảng giá cho các mô hình bán phần mềm",
    catalog_desc: "Hỗ trợ subscription, top-up credit và thanh toán one-time với cùng một backend.",
    pricing_note: "Gợi ý: dùng gói năm làm gói chủ lực, top-up cho nhu cầu phát sinh và one-time cho tiện ích bổ sung.",
    cta_title: "Sẵn sàng chốt quy trình bán hàng?",
    cta_desc: "Trang chủ tập trung bán hàng, còn quản trị được giữ ở lối vào riêng để đội vận hành xử lý nội bộ.",
    cta_btn: "Xem gói đang bán",
    tag_best: "PHỔ BIẾN NHẤT",
    account_title: "Cổng khách hàng",
    account_desc: "Tra cứu subscription, credit, entitlement và lịch sử giao dịch của từng khách",
    portal_customer_placeholder: "customerId",
    portal_load: "Xem tài khoản",
    usage_summary: "🔧 Kiểm thử API consume usage",
    usage_desc: "Trừ credit và ghi usage log + ledger",
    usage_customer_placeholder: "customerId",
    usage_app_placeholder: "appId",
    usage_feature_placeholder: "featureKey",
    usage_credits_placeholder: "creditsToConsume",
    usage_units_placeholder: "units",
    usage_request_placeholder: "requestId",
    usage_consume: "Consume",
    admin_badge: "ADMIN",
    admin_title: "Bảng điều hành quản trị",
    admin_desc: "Lối vào nội bộ cho vận hành. Giữ riêng khỏi luồng bán hàng nhưng vẫn truy cập trực tiếp từ menu.",
    admin_load: "Mở dashboard quản trị",
    admin_helper: "Dùng khi cần xem KPI, giao dịch gần đây và subscription đang hoạt động.",
    footer_tagline: "© 2026 · Nền tảng bán phần mềm, subscription và credit",
    footer_url_label: "Dev:",
    card_app: "Ứng dụng",
    card_cycle: "Chu kỳ",
    card_credits: "Credits",
    card_credits_unit: "credit",
    card_buy: "Mua ngay",
    error_create_order: "Không tạo được đơn hàng",
    cycle_monthly: "Tháng",
    cycle_yearly: "Năm",
    cycle_one_time: "Một lần"
  },
  en: {
    meta_title: "Smart Applications - Sell software faster, run operations cleanly",
    brand_name: "Smart Applications",
    brand_tagline: "Sell software faster, run operations cleanly",
    menu_features: "Features",
    menu_catalog: "Pricing",
    menu_account: "Account",
    menu_admin: "Admin",
    hero_badge: "✦ SaaS commerce for plans, credits, and AI usage",
    hero_title_line1: "Sell software faster,",
    hero_title_line2: "run operations cleanly",
    hero_desc: "A single platform to sell subscriptions, credit top-ups, process payments, grant access, and track usage in real time.",
    hero_cta_buy: "View pricing",
    hero_cta_features: "Explore sales features",
    stat_users: "3 models",
    stat_users_label: "Subscription · Top-up · One-time",
    stat_apps: "Realtime",
    stat_apps_label: "Webhooks and ledger",
    stat_uptime: "99.9%",
    stat_uptime_label: "Stable operating flow",
    trust_1: "Subscription checkout",
    trust_2: "Credit wallet top-ups",
    trust_3: "Payment webhooks",
    trust_4: "Entitlements and usage logs",
    features_title: "A complete software sales stack",
    features_desc: "From storefront to internal operations, everything runs through one consistent flow",
    feat1_title: "Public catalog",
    feat1_desc: "Show monthly, yearly, or one-time plans with strong CTAs and fast checkout.",
    feat2_title: "Subscription automation",
    feat2_desc: "Automatically activate subscriptions, manage billing cycles, and update orders after payment.",
    feat3_title: "Flexible credit wallet",
    feat3_desc: "Sell top-ups, deduct usage, write double-sided ledger entries, and keep a clean history per app.",
    feat4_title: "Webhooks and reconciliation",
    feat4_desc: "Handle payment callbacks, prevent duplicate transactions, and record transactions safely.",
    feat5_title: "Customer portal",
    feat5_desc: "Let customers view subscriptions, entitlements, wallets, and transaction history in one place.",
    feat6_title: "Operations dashboard",
    feat6_desc: "Track KPIs, recent orders, and active subscriptions without mixing them into the storefront.",
    steps_title: "A standard SaaS sales flow",
    steps_desc: "Set up plans, close orders, and grant access automatically",
    step1_title: "Create products",
    step1_desc: "Define subscription plans, credit top-ups, or one-time products per application.",
    step2_title: "Collect payments",
    step2_desc: "Customers choose a plan, create an order, pay, and the webhook confirms the transaction.",
    step3_title: "Grant access automatically",
    step3_desc: "Subscriptions, entitlements, and wallets update immediately so customers can use the service right away.",
    catalog_title: "Pricing for software sales models",
    catalog_desc: "Support subscriptions, credit top-ups, and one-time payments on the same backend.",
    pricing_note: "Recommended: use the yearly plan as the anchor offer, top-ups for variable demand, and one-time products for add-ons.",
    cta_title: "Ready to tighten your sales flow?",
    cta_desc: "The homepage stays focused on selling, while admin access remains separate for internal operations.",
    cta_btn: "View plans on sale",
    tag_best: "MOST POPULAR",
    account_title: "Customer portal",
    account_desc: "Look up subscriptions, credits, entitlements, and transaction history per customer",
    portal_customer_placeholder: "customerId",
    portal_load: "View account",
    usage_summary: "🔧 Test consume usage API",
    usage_desc: "Deduct credits and record usage logs + ledger",
    usage_customer_placeholder: "customerId",
    usage_app_placeholder: "appId",
    usage_feature_placeholder: "featureKey",
    usage_credits_placeholder: "creditsToConsume",
    usage_units_placeholder: "units",
    usage_request_placeholder: "requestId",
    usage_consume: "Consume",
    admin_badge: "ADMIN",
    admin_title: "Admin dashboard",
    admin_desc: "Internal operations entry point. Kept separate from the storefront while remaining directly accessible from the menu.",
    admin_load: "Open admin dashboard",
    admin_helper: "Use this when you need KPIs, recent transactions, and active subscriptions.",
    footer_tagline: "© 2026 · Platform for software sales, subscriptions, and credits",
    footer_url_label: "Dev:",
    card_app: "App",
    card_cycle: "Billing cycle",
    card_credits: "Credits",
    card_credits_unit: "credits",
    card_buy: "Buy now",
    error_create_order: "Unable to create order",
    cycle_monthly: "Monthly",
    cycle_yearly: "Yearly",
    cycle_one_time: "One-time"
  }
};

let currentLang = localStorage.getItem("web_sales_total_lang") || "vi";

function t(key) {
  return translations[currentLang][key] || key;
}

function applyLanguage() {
  document.documentElement.lang = currentLang;
  document.title = t("meta_title");

  document.querySelectorAll("[data-i18n]").forEach((el) => {
    const key = el.getAttribute("data-i18n");
    el.textContent = t(key);
  });

  document.querySelectorAll("[data-i18n-placeholder]").forEach((el) => {
    const key = el.getAttribute("data-i18n-placeholder");
    el.placeholder = t(key);
  });

  langToggle.textContent = currentLang === "vi" ? "EN" : "VI";
}

function formatVnd(amount) {
  const locale = currentLang === "vi" ? "vi-VN" : "en-US";
  return new Intl.NumberFormat(locale, {
    style: "currency",
    currency: "VND"
  }).format(amount);
}

function localizeCycle(cycle) {
  if (cycle === "monthly") {
    return t("cycle_monthly");
  }
  if (cycle === "yearly") {
    return t("cycle_yearly");
  }
  if (cycle === "one_time") {
    return t("cycle_one_time");
  }
  return cycle;
}

async function loadCatalog() {
  const response = await fetch("/api/catalog");
  const data = await response.json();

  productList.innerHTML = "";
  data.products.forEach((product) => {
    const card = document.createElement("article");
    const isFeatured = product.cycle === "yearly";
    card.className = isFeatured ? "card featured" : "card";
    card.innerHTML = `
      ${isFeatured ? `<span class="tag-best">${t("tag_best")}</span>` : ""}
      <h3>${product.name}</h3>
      <p class="card-meta">${localizeCycle(product.cycle)} · ${product.appId}</p>
      <div class="price">${formatVnd(product.price)}</div>
      <p class="card-meta">${product.credits} ${t("card_credits_unit")}</p>
      <button>${t("card_buy")}</button>
    `;

    const button = card.querySelector("button");
    button.addEventListener("click", async () => {
      const checkout = await fetch("/api/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          customerId: "cus-demo",
          appId: product.appId,
          productId: product.id
        })
      });

      const checkoutData = await checkout.json();
      if (!checkout.ok) {
        alert(checkoutData.message || t("error_create_order"));
        return;
      }

      window.open(checkoutData.checkoutUrl, "_blank");
    });

    productList.appendChild(card);
  });
}

function toggleLanguage() {
  currentLang = currentLang === "vi" ? "en" : "vi";
  localStorage.setItem("web_sales_total_lang", currentLang);
  applyLanguage();
  loadCatalog();
}

async function loadPortal(customerId) {
  const response = await fetch(`/api/portal/${customerId}`);
  const data = await response.json();
  portalData.textContent = JSON.stringify(data, null, 2);
}

async function loadAdmin() {
  const response = await fetch("/api/admin/dashboard");
  const data = await response.json();
  adminData.textContent = JSON.stringify(data, null, 2);
}

async function consumeUsage() {
  const payload = {
    customerId: document.getElementById("usageCustomerId").value,
    appId: document.getElementById("usageAppId").value,
    featureKey: document.getElementById("usageFeatureKey").value,
    creditsToConsume: Number(document.getElementById("usageCredits").value),
    units: Number(document.getElementById("usageUnits").value),
    requestId: document.getElementById("usageRequestId").value,
    metadata: {
      source: "local-web-test"
    }
  };

  const response = await fetch("/api/usage/consume", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload)
  });

  const data = await response.json();
  usageData.textContent = JSON.stringify(data, null, 2);
  await loadPortal(payload.customerId);
}

document.getElementById("loadPortal").addEventListener("click", () => {
  const customerId = document.getElementById("customerId").value;
  loadPortal(customerId);
});

document.getElementById("loadAdmin").addEventListener("click", loadAdmin);
document.getElementById("consumeUsage").addEventListener("click", consumeUsage);
langToggle.addEventListener("click", toggleLanguage);

applyLanguage();
loadCatalog();
