const accountState = {
  snapshot: null,
  activeTab: "downloads"
};

function fmtDate(value) {
  if (!value) return "-";
  return new Date(value).toLocaleDateString("vi-VN", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit"
  });
}

function fmtVnd(value) {
  return new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND" }).format(Number(value || 0));
}

function escapeHtml(value) {
  return String(value || "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/\"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function orderStatusLabel(status) {
  const map = {
    paid: "Da thanh toan",
    pending: "Cho thanh toan",
    active: "Dang su dung",
    inactive: "Chua kich hoat",
    revoked: "Da thu hoi"
  };
  return map[String(status || "").toLowerCase()] || (status || "Khong ro");
}

function getDownloadItems(snapshot) {
  return Array.isArray(snapshot?.downloadableApps) ? snapshot.downloadableApps : [];
}

function getAppName(snapshot, appId) {
  const item = getDownloadItems(snapshot).find((entry) => entry.appId === appId);
  return item?.appName || appId || "San pham";
}

function renderSummary(snapshot) {
  const items = getDownloadItems(snapshot);
  document.getElementById("accountName").textContent = snapshot.customer?.fullName || snapshot.customer?.email || "Tai khoan cua toi";
  document.getElementById("accountEmail").textContent = snapshot.customer?.email || "Khong co email";
  document.getElementById("summaryAppsReady").textContent = String(items.filter((item) => item.deliveryState === "download_ready" || item.deliveryType === "website").length);
  document.getElementById("summaryKeys").textContent = String((snapshot.keyDeliveries || []).length + (snapshot.licenses || []).filter((license) => license.licenseKey).length);
  document.getElementById("summaryPaidOrders").textContent = String((snapshot.orders || []).filter((order) => String(order.status || "").toLowerCase() === "paid").length);
}

function buildActionMarkup(item) {
  if (item.action?.type === "website" && item.action.href) {
    return `<a class="btn btn-accent" href="${escapeHtml(item.action.href)}" target="_blank" rel="noopener">${escapeHtml(item.action.label || "Mo website")}</a>`;
  }

  return `<button type="button" class="btn btn-accent account-download-trigger" data-app-id="${escapeHtml(item.appId)}">${escapeHtml(item.action?.label || "Nhan bo cai")}</button>`;
}

function renderDownloads(snapshot) {
  const wrap = document.getElementById("downloadCards");
  const items = getDownloadItems(snapshot);
  if (!items.length) {
    wrap.innerHTML = '<div class="account-empty">Ban chua co app nao san sang trong khu vuc nay.</div>';
    renderSummary(snapshot);
    return;
  }

  renderSummary(snapshot);
  const highlightedAppId = new URLSearchParams(window.location.search).get("highlight");
  wrap.innerHTML = items.map((item) => {
    const highlight = highlightedAppId === item.appId ? " is-highlight" : "";
    const statusMeta = item.paidAt
      ? `Paid luc ${escapeHtml(fmtDate(item.paidAt))}`
      : item.licenseStatus
        ? escapeHtml(orderStatusLabel(item.licenseStatus))
        : "Da du dieu kien truy cap";
    return `<article class="account-download-card${highlight}">
      <div class="account-download-head">
        <span class="account-download-icon">${escapeHtml(item.icon || "🧩")}</span>
        <div>
          <h3>${escapeHtml(item.appName || item.appId || "San pham")}</h3>
          <p>${escapeHtml(item.productId || item.appId || "San pham")}</p>
        </div>
      </div>
      <div class="account-status-row">
        <span class="account-status-pill">${escapeHtml(orderStatusLabel(item.orderStatus || item.licenseStatus || "paid"))}</span>
        <span class="account-status-meta">${statusMeta}</span>
      </div>
      <p class="account-download-note">${escapeHtml(item.note || "Nut tai app se kiem tra entitlement trong tai khoan cua ban.")}</p>
      <div class="account-card-actions">
        ${buildActionMarkup(item)}
        ${item.licenseKey ? `<button type="button" class="btn btn-outline account-copy-key-btn" data-key="${escapeHtml(item.licenseKey)}">Copy key</button>` : ""}
      </div>
      ${item.licenseKey ? `<div class="key-box">${escapeHtml(item.licenseKey)}</div>` : '<div class="account-inline-muted">Key se hien tai day ngay khi he thong cap xong.</div>'}
    </article>`;
  }).join("");

  wrap.querySelectorAll(".account-copy-key-btn").forEach((button) => {
    button.addEventListener("click", async () => {
      const text = String(button.dataset.key || "");
      try {
        await navigator.clipboard.writeText(text);
        button.textContent = "Da copy";
      } catch {
        button.textContent = "Copy loi";
      }
      setTimeout(() => {
        button.textContent = "Copy key";
      }, 1200);
    });
  });

  wrap.querySelectorAll(".account-download-trigger").forEach((button) => {
    button.addEventListener("click", () => {
      void requestDownload(String(button.dataset.appId || ""), button);
    });
  });
}

function renderKeys(snapshot) {
  const wrap = document.getElementById("accountKeys");
  const deliveries = Array.isArray(snapshot.keyDeliveries) ? snapshot.keyDeliveries : [];
  const licenses = Array.isArray(snapshot.licenses) ? snapshot.licenses : [];

  if (!deliveries.length && !licenses.length) {
    wrap.innerHTML = '<div class="account-empty">Chua co key nao duoc giao.</div>';
    return;
  }

  const blocks = [];
  for (const delivery of deliveries) {
    blocks.push(`<article class="account-line-card">
      <div>
        <strong>${escapeHtml(delivery.productId || delivery.orderCode || "Key da giao")}</strong>
        <p>Giao luc ${escapeHtml(fmtDate(delivery.deliveredAt))}</p>
      </div>
      <div class="key-box">${escapeHtml(delivery.keyValue || "")}</div>
    </article>`);
  }

  for (const license of licenses) {
    blocks.push(`<article class="account-line-card">
      <div>
        <strong>${escapeHtml(getAppName(snapshot, license.appId))}</strong>
        <p>${escapeHtml(orderStatusLabel(license.status))} · ${license.activatedAt ? `Kich hoat ${escapeHtml(fmtDate(license.activatedAt))}` : "Chua kich hoat"}</p>
      </div>
      <div class="key-box">${escapeHtml(license.licenseKey || "")}</div>
    </article>`);
  }

  wrap.innerHTML = blocks.join("");
}

function renderSubscriptions(snapshot) {
  const wrap = document.getElementById("accountSubscriptions");
  const subscriptions = Array.isArray(snapshot.subscriptions) ? snapshot.subscriptions : [];
  const licenses = Array.isArray(snapshot.licenses) ? snapshot.licenses : [];
  const lifetimeLicenses = licenses.filter((license) => !license.expiresAt);

  if (!subscriptions.length && !lifetimeLicenses.length) {
    wrap.innerHTML = '<div class="account-empty">Khong co goi dang dung nao can theo doi.</div>';
    return;
  }

  wrap.innerHTML = [
    ...subscriptions.map((subscription) => `<article class="account-line-card">
      <div>
        <strong>${escapeHtml(getAppName(snapshot, subscription.appId))}</strong>
        <p>${escapeHtml(orderStatusLabel(subscription.status))} · ${escapeHtml(fmtDate(subscription.startAt))} -> ${escapeHtml(fmtDate(subscription.endAt))}</p>
      </div>
      <span class="account-status-pill">${escapeHtml(subscription.renewalMode || "manual")}</span>
    </article>`),
    ...lifetimeLicenses.map((license) => `<article class="account-line-card">
      <div>
        <strong>${escapeHtml(getAppName(snapshot, license.appId))}</strong>
        <p>License lifetime · ${license.activatedAt ? `Kich hoat ${escapeHtml(fmtDate(license.activatedAt))}` : "Chua kich hoat"}</p>
      </div>
      <span class="account-status-pill">Lifetime</span>
    </article>`)
  ].join("");
}

function renderOrders(snapshot) {
  const wrap = document.getElementById("accountOrders");
  const orders = Array.isArray(snapshot.orders) ? snapshot.orders : [];
  if (!orders.length) {
    wrap.innerHTML = '<div class="account-empty">Chua co don hang nao.</div>';
    return;
  }

  wrap.innerHTML = `<table class="data-table"><thead><tr><th>Ma don</th><th>App</th><th>San pham</th><th>So tien</th><th>Trang thai</th><th>Ngay</th></tr></thead><tbody>${orders.map((order) => `<tr>
    <td>${escapeHtml(order.orderCode || String(order.id || "").slice(0, 8))}</td>
    <td>${escapeHtml(order.appId || "-")}</td>
    <td>${escapeHtml(order.productId || "-")}</td>
    <td>${escapeHtml(fmtVnd(order.amount))}</td>
    <td>${escapeHtml(orderStatusLabel(order.status))}</td>
    <td>${escapeHtml(fmtDate(order.paidAt || order.createdAt))}</td>
  </tr>`).join("")}</tbody></table>`;
}

function activateTab(tabName) {
  accountState.activeTab = tabName;
  document.querySelectorAll(".account-tab").forEach((button) => {
    button.classList.toggle("is-active", button.dataset.tab === tabName);
  });
  document.querySelectorAll(".account-panel").forEach((panel) => {
    panel.classList.toggle("is-active", panel.dataset.panel === tabName);
  });
}

async function requestDownload(appId, button) {
  if (!appId) {
    return;
  }

  const originalText = button.textContent;
  button.disabled = true;
  button.textContent = "Dang xu ly...";

  try {
    const response = await fetch(`/api/account/downloads/${encodeURIComponent(appId)}`, {
      method: "POST",
      credentials: "same-origin",
      headers: { "Content-Type": "application/json" }
    });
    const payload = await response.json().catch(() => ({}));

    if (!response.ok) {
      window.alert(payload.message || "Khong the xu ly yeu cau tai app.");
      return;
    }

    if (payload.action === "download" && payload.href) {
      window.location.assign(payload.href);
      return;
    }

    if ((payload.action === "redirect" || payload.action === "website") && payload.href) {
      window.open(payload.href, "_blank", "noopener");
      return;
    }

    if (payload.action === "manual_delivery") {
      if (payload.supportUrl) {
        window.open(payload.supportUrl, "_blank", "noopener");
      }
      if (payload.message) {
        window.alert(payload.message);
      }
      return;
    }

    window.alert("Khong xac dinh duoc cach tai app cho san pham nay.");
  } catch {
    window.alert("Khong ket noi duoc may chu tai app. Vui long thu lai.");
  } finally {
    button.disabled = false;
    button.textContent = originalText;
  }
}

async function loadAccount() {
  const res = await fetch("/api/account/overview", { credentials: "same-origin" });
  if (!res.ok) {
    window.location.assign(`/?auth=login&next=${encodeURIComponent(window.location.pathname + window.location.search)}`);
    return;
  }

  const snapshot = await res.json();
  accountState.snapshot = snapshot;
  renderDownloads(snapshot);
  renderKeys(snapshot);
  renderSubscriptions(snapshot);
  renderOrders(snapshot);

  const tab = new URLSearchParams(window.location.search).get("tab") || "downloads";
  activateTab(tab);
}

document.getElementById("accountTabs")?.addEventListener("click", (event) => {
  const button = event.target.closest(".account-tab");
  if (!button) return;
  const tab = button.dataset.tab || "downloads";
  const params = new URLSearchParams(window.location.search);
  params.set("tab", tab);
  history.replaceState(null, "", `${window.location.pathname}?${params.toString()}`);
  activateTab(tab);
});

document.getElementById("accountLogoutBtn")?.addEventListener("click", async () => {
  await fetch("/api/auth/customer/logout", { method: "POST" });
  window.location.assign("/");
});

loadAccount().catch(() => {
  window.location.assign("/");
});