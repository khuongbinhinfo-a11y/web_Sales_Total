const packageRoot = document.getElementById("packageRoot");
const WEB_DEMO_APP_ID = "app-web-demo-services";

const WEB_DEMO_MAP = window.WebDemoCatalogMap || {};

const ADDON_PRODUCT_IDS = {
  domain: "prod-web-demo-addon-domain",
  hosting: "prod-web-demo-addon-hosting"
};

let catalogProductsByIdPromise = null;
let webPricingConfigPromise = null;

const escapeHtml = (value) => String(value || "").replace(/[&<>"']/g, (char) => ({
  "&": "&amp;",
  "<": "&lt;",
  ">": "&gt;",
  '"': "&quot;",
  "'": "&#39;"
}[char]));

const parsePackageRoute = () => {
  const parts = location.pathname.split("/").filter(Boolean);
  const khoMauIndex = parts.findIndex((part) => part === "kho-mau");
  const customDesignIndex = parts.findIndex((part, index) => part === "theo-nganh" && parts[index - 1] === "thiet-ke-web");
  const legacyIndustryIndex = parts.findIndex((part, index) => part === "web-demo" && parts[index - 1] === "catalog");
  let industryIndex = -1;
  if (khoMauIndex >= 0) {
    industryIndex = khoMauIndex + 1;
  } else if (customDesignIndex >= 0) {
    industryIndex = customDesignIndex + 1;
  } else if (legacyIndustryIndex >= 0) {
    industryIndex = legacyIndustryIndex + 1;
  }
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
  const isCustomDesignRoute = window.location.pathname.includes('/thiet-ke-web/theo-nganh/');
  const pricingData = isCustomDesignRoute ? (window.webDesignCustomPricingData || {}) : (window.webDemoPricingData || {});
  const pricingIndustries = isCustomDesignRoute ? (window.webDesignCustomPricingIndustries || {}) : (window.webDemoPricingIndustries || {});
  const industry = pricingData?.[industrySlug];
  const plan = industry?.plans?.find((item) => item.slug === planSlug);
  const industryInfo = pricingIndustries?.[industrySlug] || {};
  return { industrySlug, planSlug, industry, industryInfo, plan };
}

const formatVnd = (amount) => `${Number(amount || 0).toLocaleString("vi-VN")}đ`;

const escapeAttribute = (value) => escapeHtml(value).replace(/`/g, "&#96;");

function getDefaultWebPricingConfig() {
  return {
    sharedAddons: {
      domainAnnual: "350.000đ - 850.000đ/năm",
      hostingAnnual: "2.400.000đ - 4.800.000đ/năm"
    },
    customPlanPrices: {
      "company-chuyen-nghiep": "Báo giá tùy nhu cầu",
      "company-thuong-hieu": "Báo giá tùy nhu cầu",
      "shop-ban-hang": "Báo giá tùy nhu cầu",
      "shop-nang-cao": "Báo giá tùy nhu cầu",
      "spa-chuyen-nghiep": "Báo giá tùy nhu cầu",
      "menu-chuyen-nghiep": "Báo giá tùy nhu cầu",
      "trung-tam-dao-tao": "Báo giá tùy nhu cầu"
    }
  };
}

async function getWebPricingConfig() {
  if (!webPricingConfigPromise) {
    webPricingConfigPromise = fetch("/api/web-pricing-config")
      .then((response) => response.ok ? response.json() : { config: getDefaultWebPricingConfig() })
      .then((payload) => payload?.config || getDefaultWebPricingConfig())
      .catch(() => getDefaultWebPricingConfig());
  }
  return webPricingConfigPromise;
}

function buildSharedMaintenanceRows(maintenance, sharedAddons) {
  const rows = Array.isArray(maintenance) ? maintenance : [];
  const filteredRows = rows.filter(([label]) => {
    const normalized = String(label || "").trim().toLowerCase();
    return normalized !== "tên miền" && normalized !== "hosting";
  });
  return [
    ["Tên miền", sharedAddons?.domainAnnual || "350.000đ - 850.000đ/năm"],
    ["Hosting", sharedAddons?.hostingAnnual || "2.400.000đ - 4.800.000đ/năm"],
    ...filteredRows
  ];
}

function getPlanProductId(industrySlug, planSlug) {
  if (typeof WEB_DEMO_MAP.getPlanProductId === "function") {
    return WEB_DEMO_MAP.getPlanProductId(industrySlug, planSlug);
  }
  const byIndustry = WEB_DEMO_MAP.planProductIds?.[industrySlug] || {};
  return byIndustry[planSlug] || "";
}

function getTemplateSlugForOrder(industrySlug) {
  if (typeof WEB_DEMO_MAP.getTemplateSlugForIndustry === "function") {
    return WEB_DEMO_MAP.getTemplateSlugForIndustry(industrySlug);
  }
  return WEB_DEMO_MAP.templateByIndustry?.[industrySlug] || industrySlug;
}

function ChildVariantsSection(industryId) {
  const pathname = window.location.pathname || "";
  const isOnMauDemoPage = pathname.includes("/mau-demo/");
  if (isOnMauDemoPage) {
    return "";
  }
  
  const data = window.webDemoPricingData?.[industryId];
  const plans = Array.isArray(data?.plans) ? data.plans.slice(0, 3) : [];
  if (!plans.length) {
    return "";
  }

  return `
    <div class="demo-child-variants" aria-label="Mẫu con triển khai nhanh">
      <div class="demo-child-variants-head">
        <span>Mẫu con triển khai nhanh</span>
        <h3>3 mẫu con đã tách riêng theo từng demo</h3>
      </div>
      <div class="demo-child-variants-grid">
        ${plans.map((plan, index) => {
          const demoVariant = index + 1;
          const previewHref = `/preview/${encodeURIComponent(industryId)}?demo=${demoVariant}`;
          const adminHref = `/preview/${encodeURIComponent(industryId)}/admin?demo=${demoVariant}`;
          const packageHref = `/thiet-ke-web/theo-nganh/${encodeURIComponent(industryId)}/goi/${encodeURIComponent(plan.slug || `goi-${demoVariant}`)}?demo=${demoVariant}`;
          return `
            <article class="demo-child-variant-card">
              <b>Mẫu ${demoVariant}</b>
              <h4>${escapeHtml(plan.name || `Mẫu ${demoVariant}`)}</h4>
              <p>${escapeHtml(plan.note || "Bản mẫu con để triển khai nhanh theo gói.")}</p>
              <div class="demo-child-variant-actions">
                <a href="${previewHref}">Xem live</a>
                <a href="${adminHref}">Admin local</a>
                <a class="is-primary" href="${packageHref}">Vào gói triển khai</a>
              </div>
            </article>
          `;
        }).join("")}
      </div>
    </div>
  `;
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
        <a href="/thiet-ke-web">Quay lại thiết kế web</a>
      </div>
    </section>
  `;
}

async function renderPackagePage() {
  const { industrySlug, industryInfo, plan } = findPackage();
  // Check if this is custom design route or landing branch
  const isCustomDesignRoute = window.location.pathname.includes('/thiet-ke-web/theo-nganh/');
  const isLandingBranch = industrySlug === 'landing';
  const shouldHideCheckout = isCustomDesignRoute || isLandingBranch;
  
  // Load data from appropriate source
  let pricingData, pricingShared, pricingIndustries;
  if (isCustomDesignRoute) {
    pricingData = window.webDesignCustomPricingData || {};
    pricingShared = window.webDesignCustomPricingShared || {};
    pricingIndustries = window.webDesignCustomPricingIndustries || {};
  } else {
    pricingData = window.webDemoPricingData || {};
    pricingShared = window.webDemoPricingShared || {};
    pricingIndustries = window.webDemoPricingIndustries || {};
  }
  
  const shared = pricingShared;
  const detail = plan?.detail || {};
  const consultUrl = shared.consultUrl || "https://zalo.me/0902964685";
  const webPricingConfig = await getWebPricingConfig();
  const customPlanPrices = webPricingConfig?.customPlanPrices || {};
  const resolvedPlanPrice = isCustomDesignRoute ? (customPlanPrices[plan?.slug] || plan?.price || "Báo giá tùy nhu cầu") : plan?.price;
  const maintenance = isCustomDesignRoute
    ? buildSharedMaintenanceRows(detail.maintenance || shared.maintenance || [], webPricingConfig?.sharedAddons || {})
    : (detail.maintenance || shared.maintenance || []);

  if (!plan) {
    renderNotFound();
    return;
  }

  document.title = `${plan.name} | ${isCustomDesignRoute ? 'Thiết kế web tùy chỉnh' : 'Hồ sơ gói triển khai'}`;

  const renderPrimaryButton = () => {
    if (shouldHideCheckout) {
      return `<p class="package-landing-notice" style="color: #666; font-weight: 500; text-align: center; margin-bottom: 12px;">Giá trên chỉ là tham khảo. Vui lòng liên hệ tư vấn để nhận báo giá chính xác phù hợp với yêu cầu của Quý khách.</p>`;
    }
    return `<button class="package-primary" type="button" id="buyPackageBtn">Dat coc va thanh toan</button>`;
  };

  const renderAddonSection = () => {
    if (shouldHideCheckout) {
      return '';
    }
    return `<div class="package-order-box no-print">
      <h3>Chon addon khi dat goi</h3>
      <div class="package-addon-list" id="packageAddonOptions"></div>
      <p class="package-order-note">Tong thanh toan tam tinh: <strong id="packageCheckoutTotal">0đ</strong></p>
      <p class="package-order-message" id="packageOrderMessage"></p>
    </div>`;
  };

  const backHref = isCustomDesignRoute
    ? `/thiet-ke-web/theo-nganh/${encodeURIComponent(industrySlug)}`
    : `/thiet-ke-web/theo-nganh/${encodeURIComponent(industrySlug)}`;

  packageRoot.innerHTML = `
    <section class="package-hero">
      <div class="package-container package-hero-grid">
        <div class="package-hero-copy">
          <a class="package-back" href="${backHref}">← Quay lại danh sách</a>
          <span class="package-eyebrow">Hồ sơ gói triển khai</span>
          <h1>${escapeHtml(plan.name)}</h1>
          <p>${escapeHtml(detail.summary || plan.note)}</p>
          <div class="package-meta-row">
            <span>${escapeHtml(industryInfo.name || plan.industryName)}</span>
            ${plan.badge ? `<b>${escapeHtml(plan.badge)}</b>` : ""}
          </div>
          <div class="package-actions no-print">
            ${renderPrimaryButton()}
            <a class="package-secondary" href="${escapeHtml(consultUrl)}" target="_blank" rel="noopener">Nhan tu van goi nay</a>
            <button class="package-secondary" type="button" id="printPackage">${escapeHtml(shared.pdfCta || "Tải hồ sơ PDF")}</button>
          </div>
          ${renderAddonSection()}
        </div>
        <aside class="package-price-card">
          <span>Chi phí triển khai</span>
          <strong>${escapeHtml(resolvedPlanPrice)}</strong>
          <p>${isLandingBranch ? 'Giá này là tham khảo. Giá thực tế sẽ được báo giá tùy nhu cầu.' : 'Giá có thể thay đổi tùy số lượng trang, nội dung và tính năng riêng.'}</p>
        </aside>
      </div>
    </section>

    <section class="package-print-intro">
      <div class="package-container package-doc-note">
        <img src="https://cdn.ungdungthongminh.shop/logo_2.png" alt="Ứng Dụng Thông Minh">
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

    ${ChildVariantsSection(industrySlug)}

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

  if (!shouldHideCheckout) {
    await initCheckoutFlow({ industrySlug, plan });
  }
}

renderPackagePage().catch(() => {
  renderNotFound();
});
