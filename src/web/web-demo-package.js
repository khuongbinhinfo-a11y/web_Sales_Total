const packageRoot = document.getElementById("packageRoot");

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

function renderPackagePage() {
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
          <a class="package-back" href="/web-demo/${encodeURIComponent(industrySlug)}#demoPricing">← Quay lại gói ngành</a>
          <span class="package-eyebrow">Hồ sơ gói triển khai</span>
          <h1>${escapeHtml(plan.name)}</h1>
          <p>${escapeHtml(detail.summary || plan.note)}</p>
          <div class="package-meta-row">
            <span>${escapeHtml(industryInfo.name || plan.industryName)}</span>
            ${plan.badge ? `<b>${escapeHtml(plan.badge)}</b>` : ""}
          </div>
          <div class="package-actions no-print">
            <a class="package-primary" href="${escapeHtml(consultUrl)}" target="_blank" rel="noopener">Nhận tư vấn gói này</a>
            <button class="package-secondary" type="button" id="printPackage">${escapeHtml(shared.pdfCta || "Tải hồ sơ PDF")}</button>
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
          <a class="package-primary" href="${escapeHtml(consultUrl)}" target="_blank" rel="noopener">Đăng ký gói này</a>
          <button class="package-secondary" type="button" data-print-package>${escapeHtml(shared.pdfCta || "Tải hồ sơ PDF")}</button>
        </div>
      </div>
    </section>
  `;

  document.querySelectorAll("#printPackage,[data-print-package]").forEach((button) => {
    button.addEventListener("click", () => window.print());
  });
}

renderPackagePage();
