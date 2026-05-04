const packageRoot = document.getElementById("packageRoot");
const WEB_DEMO_APP_ID = "app-web-demo-services";

const INDUSTRY_TO_TEMPLATE = {
  company: "company",
  shop: "shop",
  salon: "salon",
  industry: "industry",
  landing: "landing"
};

const PLAN_PRODUCT_IDS = {
  company: {
    "co-ban": "prod-web-demo-company-basic",
    "chuyen-nghiep": "prod-web-demo-company-pro",
    "thuong-hieu": "prod-web-demo-company-brand"
  },
  shop: {
    "shop-gioi-thieu": "prod-web-demo-shop-showcase",
    "shop-ban-hang": "prod-web-demo-shop-sales",
    "shop-nang-cao": "prod-web-demo-shop-advanced"
  },
  salon: {
    "spa-mini": "prod-web-demo-salon-mini",
    "spa-chuyen-nghiep": "prod-web-demo-salon-pro",
    "spa-ban-hang-dat-lich": "prod-web-demo-salon-booking"
  },
  industry: {
    "local-co-ban": "prod-web-demo-industry-basic",
    "menu-chuyen-nghiep": "prod-web-demo-industry-pro",
    "dat-ban-dat-mon": "prod-web-demo-industry-booking"
  },
  landing: {
    "tuyen-sinh-co-ban": "prod-web-demo-landing-basic",
    "trung-tam-dao-tao": "prod-web-demo-landing-pro",
    "he-thong-khoa-hoc": "prod-web-demo-landing-system"
  }
};

const ADDON_PRODUCT_IDS = {
  domain: "prod-web-demo-addon-domain",
  hosting: "prod-web-demo-addon-hosting"
};

let catalogProductsByIdPromise = null;

const escapeHtml = (value) => String(value || "").replace(/[&<>"']/g, (char) => ({
  "&": "&amp;",
  "<": "&lt;",
  ">": "&gt;",
  '"': "&quot;",
  "'": "&#39;"
}[char]));

const parsePackageRoute = () => {
  const parts = location.pathname.split("/").filter(Boolean);
  const industryIndex = parts.findIndex((part, index) => part === "web-demo" && parts[index - 1] === "catalog") + 1;
  const planIndex = parts.findIndex((part) => part === "goi") + 1;
  return {
    industrySlug: industryIndex > 0 ? decodeURIComponent(parts[industryIndex] || "") : "",
    planSlug: planIndex > 0 ? decodeURIComponent(parts[planIndex] || "") : ""
  };
};

const renderBullets = (items = []) => `
  <ul>
    ${items.map((item) => `<li>${escapeHtml(item)}</li>`).join("")}
  </ul>
`;

const renderScopeGroups = (groups = []) => groups.map((group) => `
  <article class="package-scope-card">
    <h3>${escapeHtml(group.title)}</h3>
    ${renderBullets(group.items || [])}
  </article>
`).join("");

const renderMaintenance = (maintenance = []) => maintenance.map(([label, value]) => `
  <div class="package-maintenance-item">
    <span>${escapeHtml(label)}</span>
    <strong>${escapeHtml(value)}</strong>
  </div>
`).join("");

function findPackage() {
  const { industrySlug, planSlug } = parsePackageRoute();
  const industry = window.webDemoPricingData?.[industrySlug];
  const plan = industry?.plans?.find((item) => item.slug === planSlug);
  const industryInfo = window.webDemoPricingIndustries?.[industrySlug] || {};
  return { industrySlug, planSlug, industry, industryInfo, plan };
}

const formatVnd = (amount) => `${Number(amount || 0).toLocaleString("vi-VN")}đ`;

const escapeAttribute = (value) => escapeHtml(value).replace(/`/g, "&#96;");

function getPlanProductId(industrySlug, planSlug) {
  return PLAN_PRODUCT_IDS?.[industrySlug]?.[planSlug] || "";
}

function getTemplateSlugForOrder(industrySlug) {
  return INDUSTRY_TO_TEMPLATE[industrySlug] || industrySlug;
}

async function getCatalogProductsById() {
  if (!catalogProductsByIdPromise) {
    catalogProductsByIdPromise = fetch("/api/catalog")
      .then(async (response) => {
        if (!response.ok) {
          throw new Error("Khong tai duoc catalog");
        }
        return response.json();
      })
      .then((catalog) => {
        const products = Array.isArray(catalog?.products) ? catalog.products : [];
        return new Map(products.map((product) => [String(product.id || ""), product]));
      })
      .catch((error) => {
        catalogProductsByIdPromise = null;
        throw error;
      });
  }
  return catalogProductsByIdPromise;
}

function setOrderMessage(text, type = "info") {
  const messageNode = document.getElementById("packageOrderMessage");
  if (!messageNode) {
    return;
  }

  messageNode.textContent = text || "";
  messageNode.classList.remove("is-error", "is-success");
  if (type === "error") {
    messageNode.classList.add("is-error");
  }
  if (type === "success") {
    messageNode.classList.add("is-success");
  }
}

async function initCheckoutFlow({ industrySlug, plan }) {
  const orderButton = document.getElementById("buyPackageBtn");
  const totalNode = document.getElementById("packageCheckoutTotal");
  const addonsNode = document.getElementById("packageAddonOptions");

  if (!orderButton || !totalNode || !addonsNode || !plan) {
    return;
  }

  orderButton.disabled = true;
  orderButton.textContent = "Dang tai du lieu gia...";

  try {
    const productsById = await getCatalogProductsById();
    const productId = getPlanProductId(industrySlug, plan.slug);
    const baseProduct = productsById.get(productId);

    if (!productId || !baseProduct) {
      setOrderMessage("Goi nay chua lien ket san pham thanh toan. Vui long lien he tu van de duoc ho tro.", "error");
      orderButton.textContent = "Lien he tu van";
      return;
    }

    const addonCandidates = [
      {
        key: "domain",
        product: productsById.get(ADDON_PRODUCT_IDS.domain),
        fallbackName: "Ten mien"
      },
      {
        key: "hosting",
        product: productsById.get(ADDON_PRODUCT_IDS.hosting),
        fallbackName: "Hosting"
      }
    ].filter((item) => item.product && item.product.appId === WEB_DEMO_APP_ID);

    const basePrice = Number(baseProduct.effectivePrice ?? baseProduct.price ?? 0);

    if (addonCandidates.length === 0) {
      addonsNode.innerHTML = "<p class=\"package-addon-empty\">Chua co addon duoc cong bo trong catalog.</p>";
    } else {
      addonsNode.innerHTML = addonCandidates.map((item) => {
        const price = Number(item.product.effectivePrice ?? item.product.price ?? 0);
        return `
          <label class="package-addon-item">
            <input type="checkbox" data-addon-product-id="${escapeAttribute(item.product.id)}">
            <span>${escapeHtml(item.product.name || item.fallbackName)}</span>
            <strong>${escapeHtml(formatVnd(price))}</strong>
          </label>
        `;
      }).join("");
    }

    const updateTotal = () => {
      const selectedAddonIds = Array.from(document.querySelectorAll("[data-addon-product-id]:checked"))
        .map((input) => input.getAttribute("data-addon-product-id") || "")
        .filter(Boolean);
      const addonTotal = selectedAddonIds.reduce((sum, addonId) => {
        const addonProduct = productsById.get(addonId);
        return sum + Number(addonProduct?.effectivePrice ?? addonProduct?.price ?? 0);
      }, 0);
      const total = basePrice + addonTotal;
      totalNode.textContent = formatVnd(total);
      return selectedAddonIds;
    };

    addonsNode.querySelectorAll("[data-addon-product-id]").forEach((input) => {
      input.addEventListener("change", updateTotal);
    });

    updateTotal();
    orderButton.disabled = false;
    orderButton.textContent = "Dat coc va thanh toan";

    orderButton.addEventListener("click", async () => {
      const selectedAddonIds = updateTotal();
      orderButton.disabled = true;
      orderButton.textContent = "Dang tao don...";
      setOrderMessage("Dang chuyen sang trang thanh toan...");

      try {
        const metadata = {
          source: "web-demo-package",
          templateSlug: getTemplateSlugForOrder(industrySlug),
          industrySlug,
          planSlug: plan.slug,
          planName: plan.name,
          selectedAddons: selectedAddonIds
        };

        const response = await fetch("/api/orders", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            appId: WEB_DEMO_APP_ID,
            productId: baseProduct.id,
            addonProductIds: selectedAddonIds,
            metadata
          })
        });

        const payload = await response.json().catch(() => ({}));
        if (!response.ok || !payload?.checkoutUrl) {
          throw new Error(payload?.message || "Khong tao duoc don hang");
        }

        setOrderMessage("Da tao don thanh cong. Dang chuyen huong...", "success");
        window.location.href = payload.checkoutUrl;
      } catch (error) {
        setOrderMessage(error?.message || "Khong the tao don luc nay. Vui long thu lai sau.", "error");
        orderButton.disabled = false;
        orderButton.textContent = "Dat coc va thanh toan";
      }
    });
  } catch {
    setOrderMessage("Khong tai duoc bang gia he thong. Vui long thu lai sau.", "error");
    orderButton.textContent = "Lien he tu van";
  }
}

function renderNotFound() {
  packageRoot.innerHTML = `
    <section class="package-not-found">
      <div class="package-container">
        <span>Không tìm thấy gói</span>
        <h1>Gói triển khai này chưa sẵn sàng</h1>
        <p>Vui lòng quay lại danh sách mẫu web demo để chọn lại gói phù hợp.</p>
        <a href="/#web-demo">Quay lại mẫu web demo</a>
      </div>
    </section>
  `;
}

async function renderPackagePage() {
  const { industrySlug, industryInfo, plan } = findPackage();
  const shared = window.webDemoPricingShared || {};
  const detail = plan?.detail || {};
  const consultUrl = shared.consultUrl || "https://zalo.me/0902964685";
  const maintenance = detail.maintenance || shared.maintenance || [];

  if (!plan) {
    renderNotFound();
    return;
  }

  document.title = `${plan.name} | Hồ sơ gói triển khai`;

  packageRoot.innerHTML = `
    <section class="package-hero">
      <div class="package-container package-hero-grid">
        <div class="package-hero-copy">
          <a class="package-back" href="/web-demo/${encodeURIComponent(industrySlug)}#demoPricing">← Quay lại mẫu web</a>
          <span class="package-eyebrow">Hồ sơ gói triển khai</span>
          <h1>${escapeHtml(plan.name)}</h1>
          <p>${escapeHtml(detail.summary || plan.note)}</p>
          <div class="package-meta-row">
            <span>${escapeHtml(industryInfo.name || plan.industryName)}</span>
            ${plan.badge ? `<b>${escapeHtml(plan.badge)}</b>` : ""}
          </div>
          <div class="package-actions no-print">
            <button class="package-primary" type="button" id="buyPackageBtn">Dat coc va thanh toan</button>
            <a class="package-secondary" href="${escapeHtml(consultUrl)}" target="_blank" rel="noopener">Nhan tu van goi nay</a>
            <button class="package-secondary" type="button" id="printPackage">${escapeHtml(shared.pdfCta || "Tải hồ sơ PDF")}</button>
          </div>
          <div class="package-order-box no-print">
            <h3>Chon addon khi dat goi</h3>
            <div class="package-addon-list" id="packageAddonOptions"></div>
            <p class="package-order-note">Tong thanh toan tam tinh: <strong id="packageCheckoutTotal">0đ</strong></p>
            <p class="package-order-message" id="packageOrderMessage"></p>
          </div>
        </div>
        <aside class="package-price-card">
          <span>Chi phí triển khai</span>
          <strong>${escapeHtml(plan.price)}</strong>
          <p>Giá có thể thay đổi tùy số lượng trang, nội dung và tính năng riêng.</p>
        </aside>
      </div>
    </section>

    <section class="package-print-intro">
      <div class="package-container package-doc-note">
        <img src="/logo_2.png" alt="Ứng Dụng Thông Minh">
        <div>
          <h2>Hồ sơ gói triển khai</h2>
          <p>Xin chào Quý khách,<br>Cảm ơn anh/chị đã quan tâm đến dịch vụ thiết kế website của Ứng Dụng Thông Minh. Dưới đây là hồ sơ mô tả chi tiết gói triển khai mà anh/chị đang quan tâm.</p>
        </div>
      </div>
    </section>

    <section class="package-section">
      <div class="package-container package-two-col">
        <article class="package-panel">
          <span>Phù hợp với ai</span>
          <h2>${escapeHtml(plan.fit)}</h2>
          ${renderBullets(detail.useCases || [])}
        </article>
        <article class="package-panel package-timeline">
          <span>Thời gian triển khai dự kiến</span>
          <h2>${escapeHtml(detail.timeline)}</h2>
          <p>Thời gian chính thức sẽ được xác nhận sau khi chốt phạm vi, số lượng trang và nội dung khách cung cấp.</p>
        </article>
      </div>
    </section>

    <section class="package-section">
      <div class="package-container">
        <div class="package-section-head">
          <span>Phạm vi triển khai chi tiết</span>
          <h2>Gói này sẽ làm những gì?</h2>
        </div>
        <div class="package-scope-grid">
          ${renderScopeGroups(detail.scope || [])}
        </div>
      </div>
    </section>

    <section class="package-section">
      <div class="package-container package-two-col">
        <article class="package-panel package-included">
          <span>Bao gồm</span>
          <h2>Các hạng mục đã tính trong gói</h2>
          ${renderBullets(detail.included || [])}
        </article>
        <article class="package-panel package-excluded">
          <span>Không bao gồm</span>
          <h2>Các hạng mục cần báo giá/thỏa thuận riêng</h2>
          ${renderBullets(detail.excluded || [])}
        </article>
      </div>
    </section>

    <section class="package-section">
      <div class="package-container">
        <div class="package-section-head">
          <span>Quy trình triển khai</span>
          <h2>Từ tư vấn đến bàn giao</h2>
        </div>
        <div class="package-process">
          ${(detail.process || []).map((item, index) => `
            <article>
              <b>${index + 1}</b>
              <p>${escapeHtml(item)}</p>
            </article>
          `).join("")}
        </div>
      </div>
    </section>

    <section class="package-section">
      <div class="package-container">
        <div class="package-section-head">
          <span>Chi phí duy trì</span>
          <h2>Khoản duy trì tham khảo sau bàn giao</h2>
        </div>
        <div class="package-maintenance">
          ${renderMaintenance(maintenance)}
        </div>
      </div>
    </section>

    <section class="package-thanks">
      <div class="package-container package-thanks-box">
        <div>
          <span>Ứng Dụng Thông Minh</span>
          <h2>Cảm ơn Quý khách đã dành thời gian xem hồ sơ gói triển khai.</h2>
          <p>Chúng tôi sẵn sàng tư vấn để điều chỉnh phạm vi công việc phù hợp đúng nhu cầu thực tế và ngân sách của anh/chị.</p>
          <p class="package-contact-line">Website: ungdungthongminh.shop · Zalo/Hotline: 0902 96 46 85 · Email: ungdungthongminh.info@gmail.com</p>
        </div>
        <div class="package-actions no-print">
          <a class="package-primary" href="${escapeHtml(consultUrl)}" target="_blank" rel="noopener">Nhan tu van nhanh</a>
          <button class="package-secondary" type="button" data-print-package>${escapeHtml(shared.pdfCta || "Tải hồ sơ PDF")}</button>
        </div>
      </div>
    </section>
  `;

  document.querySelectorAll("#printPackage,[data-print-package]").forEach((button) => {
    button.addEventListener("click", () => window.print());
  });

  await initCheckoutFlow({ industrySlug, plan });
}

renderPackagePage().catch(() => {
  renderNotFound();
});
