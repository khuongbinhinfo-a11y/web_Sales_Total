const productList = document.getElementById("productList");
const langToggle = document.getElementById("langToggle");

const translations = {
  vi: {
    meta_title: "Web Sales Total - Nền tảng bán phần mềm tổng",
    brand_name: "Web Sales Total",
    promo_strip: "Khuyến mãi hôm nay: thanh toán Sepay, giao key tự động sau khi đơn paid.",
    brand_tagline: "Store key bán tự động 24/7",
    menu_catalog: "Sản phẩm",
    menu_login: "Đăng nhập",
    menu_admin: "Quản trị",
    menu_quick_buy: "Mua ngay",
    hero_badge: "Marketplace key bán chạy",
    hero_title_line1: "Mua key phần mềm",
    hero_title_line2: "nhận ngay sau thanh toán",
    hero_desc: "Chọn gói, thanh toán Sepay, hệ thống tự động cấp key và hiển thị ngay trên trang đơn hàng.",
    hero_cta_buy: "Mua ngay",
    hero_cta_portal: "Tra cứu đơn / lấy key",
    hero_point_1: "Giá rõ ràng",
    hero_point_2: "Giao key tự động",
    hero_point_3: "Hỗ trợ 24/7",
    hero_card_title: "Quy trình mua key",
    hero_card_item_1: "1. Chọn gói trong danh mục sản phẩm",
    hero_card_item_2: "2. Chuyển khoản Sepay với nội dung mã đơn",
    hero_card_item_3: "3. Trang đơn hàng tự động cấp key khi paid",
    trust_1: "Sepay xác nhận nhanh",
    trust_2: "Đơn hàng cấp key tự động",
    cat_title: "Danh mục nổi bật",
    cat_1: "Windows Key",
    cat_2: "Office Bản Quyền",
    cat_3: "Tài khoản AI Tools",
    cat_4: "Gói Top-up",
    catalog_title: "Deal hot hôm nay",
    catalog_desc: "Bấm Mua ngay để tạo đơn. Sau khi hệ thống nhận thanh toán, key sẽ được cấp tự động.",
    steps_title: "Hướng dẫn mua nhanh",
    steps_desc: "3 bước để nhận key tự động",
    step1_title: "Chọn sản phẩm",
    step1_desc: "Xem giá và bấm Mua ngay ở gói phù hợp.",
    step2_title: "Thanh toán Sepay",
    step2_desc: "Chuyển khoản đúng nội dung mã đơn để xác nhận nhanh.",
    step3_title: "Nhận key tự động",
    step3_desc: "Khi đơn paid, key hiện ngay trên trang đơn hàng và portal.",
    tag_best: "NÊN CHỌN",
    footer_tagline: "© 2026 · Store key tự động cho web bán hàng",
    footer_url_label: "Sales API:",
    card_credits_unit: "credit",
    card_buy: "Mua ngay",
    error_create_order: "Không tạo được đơn hàng",
    cycle_monthly: "Tháng",
    cycle_yearly: "Năm",
    cycle_one_time: "Một lần"
  },
  en: {
    meta_title: "Web Sales Total - SaaS commerce MVP",
    brand_name: "Web Sales Total",
    promo_strip: "Today deal: Sepay payment with automatic key delivery after paid confirmation.",
    brand_tagline: "Automated software key store 24/7",
    menu_catalog: "Products",
    menu_login: "Login",
    menu_admin: "Admin",
    menu_quick_buy: "Buy now",
    hero_badge: "Top-selling software key marketplace",
    hero_title_line1: "Buy software keys",
    hero_title_line2: "get delivery right after payment",
    hero_desc: "Choose a package, pay with Sepay, and receive your key automatically on the order page.",
    hero_cta_buy: "Buy now",
    hero_cta_portal: "Order lookup / key retrieval",
    hero_point_1: "Clear pricing",
    hero_point_2: "Automatic key delivery",
    hero_point_3: "24/7 support",
    hero_card_title: "Quick purchase flow",
    hero_card_item_1: "1. Choose a package from the product list",
    hero_card_item_2: "2. Transfer with Sepay using the order code",
    hero_card_item_3: "3. Key is auto-delivered once order is paid",
    trust_1: "Fast Sepay confirmation",
    trust_2: "Automatic key delivery",
    cat_title: "Featured categories",
    cat_1: "Windows Key",
    cat_2: "Office License",
    cat_3: "AI Tools Accounts",
    cat_4: "Top-up Packages",
    catalog_title: "Today hot deals",
    catalog_desc: "Click Buy now to create an order. The key is delivered automatically after payment is confirmed.",
    steps_title: "Quick buying guide",
    steps_desc: "3 steps to receive your key automatically",
    step1_title: "Choose product",
    step1_desc: "Check pricing and click Buy now on your preferred package.",
    step2_title: "Pay with Sepay",
    step2_desc: "Transfer with the exact order code for instant confirmation.",
    step3_title: "Receive key instantly",
    step3_desc: "When paid is confirmed, the key appears on the order page and portal.",
    tag_best: "RECOMMENDED",
    footer_tagline: "© 2026 · Automated key store for software sales",
    footer_url_label: "Sales API:",
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
      <p class="card-meta">${product.credits} ${t("card_credits_unit")} · Tu dong giao key</p>
      <button>${t("card_buy")} - Sepay</button>
    `;

    const button = card.querySelector("button");
    button.addEventListener("click", async () => {
      const checkout = await fetch("/api/orders", {
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

langToggle.addEventListener("click", toggleLanguage);

applyLanguage();
loadCatalog();
