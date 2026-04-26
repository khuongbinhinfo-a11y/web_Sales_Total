/* ═══ admin.js — admin dashboard ═══ */

function fmtVnd(v){ return new Intl.NumberFormat("vi-VN",{style:"currency",currency:"VND"}).format(v); }
function fmtDate(d){ if(!d) return "—"; return new Date(d).toLocaleDateString("vi-VN",{day:"2-digit",month:"2-digit",year:"numeric",hour:"2-digit",minute:"2-digit"}); }
function badge(s){
  const m={paid:"status-paid",pending:"status-pending",active:"status-active"};
  return `<span class="status-badge ${m[s]||""}">${s}</span>`;
}
let meAdmin = null;
let sepaySecretConfigured = false;
let currentGateApp = "desktop";
let currentGateData = null;
let aiAppSecretConfigured = false;
let adminListFocusUsername = "";
const licenseCompDraftStorageKey = "admin_license_compensation_draft_v1";

function wait(ms){
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function fetchAdmin(url, options){
  const nextOptions = options ? { ...options } : {};
  nextOptions.credentials = "include";

  const method = String(nextOptions.method || "GET").toUpperCase();
  let response = await fetch(url, nextOptions);

  // Fresh logins can race with the first protected GET call on some browsers/proxies.
  if(response.status === 401 && (method === "GET" || method === "HEAD")){
    await wait(250);
    response = await fetch(url, nextOptions);
  }

  return response;
}

function redirectToAdminLogin(failedEndpoint){
  const endpoint = String(failedEndpoint || "").trim();
  if(!endpoint){
    window.location.assign("/admin/login");
    return;
  }

  const query = new URLSearchParams({
    reason: "admin_api_401",
    failedEndpoint: endpoint
  });
  window.location.assign(`/admin/login?${query.toString()}`);
}

function escapeHtml(value){
  return String(value || "")
    .replace(/&/g,"&amp;")
    .replace(/</g,"&lt;")
    .replace(/>/g,"&gt;")
    .replace(/\"/g,"&quot;")
    .replace(/'/g,"&#39;");
}

function normalizeProductSaleStatus(value){
  const normalized = String(value || "").trim().toLowerCase();
  return ["live","locked","coming_soon"].includes(normalized) ? normalized : "live";
}

function productSaleStatusMeta(value){
  const status = normalizeProductSaleStatus(value);
  if(status === "locked"){
    return {
      label: "Tạm khóa",
      badgeClass: "is-locked",
      hint: "Card vẫn hiện ngoài web nhưng người dùng không tạo đơn được."
    };
  }
  if(status === "coming_soon"){
    return {
      label: "Coming soon",
      badgeClass: "is-coming-soon",
      hint: "Card dùng để quảng cáo trước mở bán, checkout bị chặn."
    };
  }
  return {
    label: "Đang bán",
    badgeClass: "is-live",
    hint: "Người dùng thấy card và tạo đơn bình thường."
  };
}

function toDatetimeLocalValue(value){
  if(!value) return "";
  const parsed = new Date(value);
  if(Number.isNaN(parsed.getTime())) return "";
  const local = new Date(parsed.getTime() - parsed.getTimezoneOffset() * 60000);
  return local.toISOString().slice(0,16);
}

function isPublicWebhookUrl(url){
  const value = String(url || "").trim().toLowerCase();
  if(!value) return false;
  return !(
    value.includes("localhost") ||
    value.includes("127.0.0.1") ||
    value.includes("0.0.0.0") ||
    value.includes("::1")
  );
}

async function loadAdmin(){
  try {
    const res = await fetchAdmin("/api/admin/dashboard");
    if(res.status===401){ redirectToAdminLogin("/api/admin/dashboard"); return; }
    if(res.status===403){
      const payload = await res.json().catch(()=>({}));
      const required = payload.requiredPermission || "dashboard:read";
      showAdminError(`Tài khoản hiện tại không có quyền truy cập dashboard (thiếu: ${required}).`);
      return;
    }
    if(!res.ok){
      const payload = await res.json().catch(()=>({}));
      showAdminError(payload.message || "API dashboard đang lỗi hoặc DB chưa sẵn sàng.");
      return;
    }

    const d = await res.json();
    if(!d || !d.kpi){
      showAdminError("Dữ liệu dashboard không hợp lệ. Vui lòng kiểm tra API /api/admin/dashboard.");
      return;
    }
    renderDashboard(d);
  } catch(e){
    console.error("Admin load error",e);
    showAdminError(`API/DB chưa sẵn sàng. Hãy chạy PostgreSQL và migrate dữ liệu. (${e.message})`);
  }
}

function showAdminError(message){
  const host = document.getElementById("adminMain");
  const old = document.getElementById("adminErrorNotice");
  if(old){ old.remove(); }
  const notice = document.createElement("div");
  notice.id = "adminErrorNotice";
  notice.className = "info-card";
  notice.style.marginBottom = "16px";
  notice.innerHTML = `<h3>⚠️ Không thể tải đầy đủ dashboard</h3><p style="color:var(--muted)">${message}</p><p style="font-size:.82rem;color:var(--muted)">Kiểm tra nhanh: PostgreSQL đang chạy, đã chạy npm run db:migrate, và đăng nhập đúng quyền.</p>`;
  host.prepend(notice);
}

function renderDashboard(d){
  const k = d.kpi || {
    totalRevenue:0,
    paidOrders:0,
    pendingOrders:0,
    totalCustomers:0,
    totalApps:0,
    totalCreditBalance:0,
    totalWallets:0,
    customersWithWallet:0
  };

  if(d.degraded){
    const host = document.getElementById("adminMain");
    const old = document.getElementById("adminDegradedNotice");
    if(old){ old.remove(); }
    const notice = document.createElement("div");
    notice.id = "adminDegradedNotice";
    notice.className = "info-card";
    notice.style.marginBottom = "16px";
    notice.innerHTML = `<h3>ℹ️ Chế độ tạm thời</h3><p style="color:var(--muted)">${d.message || "DB chưa sẵn sàng, đang hiển thị dữ liệu rỗng."}</p>`;
    host.prepend(notice);
  }

  document.getElementById("kpiRevenue").textContent = fmtVnd(k.totalRevenue);
  document.getElementById("kpiPaid").textContent = k.paidOrders;
  document.getElementById("kpiPending").textContent = k.pendingOrders;
  document.getElementById("kpiCustomers").textContent = k.totalCustomers;
  document.getElementById("kpiCredits").textContent = Number(k.totalCreditBalance || 0).toLocaleString("vi-VN");
  document.getElementById("kpiCredits").title = `Số ví: ${Number(k.totalWallets || 0).toLocaleString("vi-VN")} · Khách có ví: ${Number(k.customersWithWallet || 0).toLocaleString("vi-VN")}`;
  document.getElementById("kpiApps").textContent = k.totalApps;

  // Orders table
  const ow = document.getElementById("ordersWrap");
  if(d.latestOrders && d.latestOrders.length){
    ow.innerHTML = `<table class="data-table"><thead><tr>
      <th>Mã đơn</th><th>Khách hàng</th><th>App</th><th>Số tiền</th><th>Trạng thái</th><th>Ngày tạo</th><th>Ngày paid</th>
    </tr></thead><tbody>${d.latestOrders.map(o=>`<tr>
      <td style="font-family:monospace;font-size:.78rem">${o.orderCode || `${o.id.slice(0,8)}…`}</td>
      <td>${o.customerId}</td>
      <td>${o.appId}</td>
      <td style="font-weight:600">${fmtVnd(o.amount)}</td>
      <td>${badge(o.status)}</td>
      <td style="font-size:.8rem">${fmtDate(o.createdAt)}</td>
      <td style="font-size:.8rem">${fmtDate(o.paidAt)}</td>
    </tr>`).join("")}</tbody></table>`;
  } else {
    ow.innerHTML = `<p style="padding:16px;color:var(--muted)">Chưa có đơn hàng</p>`;
  }

  // Transactions table
  const tw = document.getElementById("txWrap");
  if(d.latestTransactions && d.latestTransactions.length){
    tw.innerHTML = `<table class="data-table"><thead><tr>
      <th>ID</th><th>Đơn hàng</th><th>Provider</th><th>Tx ID</th><th>Số tiền</th><th>Trạng thái</th><th>Verified</th>
    </tr></thead><tbody>${d.latestTransactions.map(t=>`<tr>
      <td style="font-family:monospace;font-size:.78rem">${t.id.slice(0,8)}…</td>
      <td style="font-family:monospace;font-size:.78rem">${t.orderId.slice(0,8)}…</td>
      <td><span class="status-badge" style="background:#ede9fe;color:#7c3aed">${t.provider}</span></td>
      <td style="font-family:monospace;font-size:.75rem">${(t.providerTransactionId||"").slice(0,12)}…</td>
      <td style="font-weight:600">${fmtVnd(t.amount)}</td>
      <td>${badge(t.status)}</td>
      <td style="font-size:.8rem">${fmtDate(t.verifiedAt)}</td>
    </tr>`).join("")}</tbody></table>`;
  } else {
    tw.innerHTML = `<p style="padding:16px;color:var(--muted)">Chưa có giao dịch</p>`;
  }

  // Subscriptions table
  const sw = document.getElementById("subsWrap");
  if(d.activeSubscriptions && d.activeSubscriptions.length){
    sw.innerHTML = `<table class="data-table"><thead><tr>
      <th>Khách hàng</th><th>App</th><th>Sản phẩm</th><th>Trạng thái</th><th>Bắt đầu</th><th>Kết thúc</th><th>Gia hạn</th>
    </tr></thead><tbody>${d.activeSubscriptions.map(s=>`<tr>
      <td>${s.customerId}</td>
      <td>${s.appId}</td>
      <td style="font-size:.82rem">${s.productId}</td>
      <td>${badge(s.status)}</td>
      <td style="font-size:.8rem">${fmtDate(s.startAt)}</td>
      <td style="font-size:.8rem">${fmtDate(s.endAt)}</td>
      <td>${s.renewalMode}</td>
    </tr>`).join("")}</tbody></table>`;
  } else {
    sw.innerHTML = `<p style="padding:16px;color:var(--muted)">Chưa có subscription active</p>`;
  }

  // Wallet table
  const ww = document.getElementById("walletWrap");
  if(d.topWallets && d.topWallets.length){
    ww.innerHTML = `<table class="data-table"><thead><tr>
      <th>Khách hàng</th><th>Email</th><th>App</th><th>Số dư credit</th><th>Cập nhật</th>
    </tr></thead><tbody>${d.topWallets.map(w=>`<tr>
      <td>${w.fullName || w.customerId}<div style="font-size:.78rem;color:var(--muted)">${w.customerId}</div></td>
      <td style="font-size:.82rem">${w.email || "—"}</td>
      <td>${w.appId}</td>
      <td style="font-weight:700">${Number(w.balance).toLocaleString("vi-VN")}</td>
      <td style="font-size:.8rem">${fmtDate(w.updatedAt)}</td>
    </tr>`).join("")}</tbody></table>`;
  } else {
    ww.innerHTML = `<p style="padding:16px;color:var(--muted)">Chưa có dữ liệu ví credit</p>`;
  }
}

async function loadMe(){
  try {
    const res = await fetchAdmin("/api/admin/me");
    if(!res.ok){ return; }
    const d = await res.json();
    meAdmin = d.admin || null;
    renderAdminMeSummary();
  } catch {}
}

function renderAdminMeSummary(){
  const host = document.getElementById("adminMeSummary");
  const detail = document.getElementById("adminMeDetail");
  if(!host) return;
  if(!meAdmin){
    host.textContent = "Không đọc được thông tin tài khoản admin hiện tại.";
    if(detail){ detail.textContent = "Không có dữ liệu chi tiết tài khoản."; }
    return;
  }

  const username = escapeHtml(meAdmin.username || "admin");
  const role = escapeHtml(meAdmin.role || "support");
  const otpRequired = meAdmin.role === "owner" || meAdmin.role === "manager";
  host.innerHTML = `Tài khoản hiện tại: <b>${username}</b> · role: <b>${role}</b> · OTP khi đăng nhập: <b>${otpRequired ? "bật" : "tắt"}</b>`;

  if(detail){
    const email = escapeHtml(meAdmin.email || "(chưa có email)");
    const adminId = escapeHtml(meAdmin.id || "");
    const loginAt = fmtDate(meAdmin.lastLoginAt || null);
    const activeText = meAdmin.isActive === false ? "inactive" : "active";
    const permCount = Array.isArray(meAdmin.permissions) ? meAdmin.permissions.length : 0;
    detail.innerHTML = `ID: <b>${adminId || "—"}</b> · Email: <b>${email}</b> · Trạng thái: <b>${activeText}</b> · Quyền: <b>${permCount}</b> · Đăng nhập gần nhất: <b>${loginAt}</b>`;
  }
}

function adminActionBadge(a){
  if(a.isActive){
    return `<span class="status-badge status-active">active</span>`;
  }
  return `<span class="status-badge" style="background:#fee2e2;color:#991b1b">inactive</span>`;
}

async function loadAdminUsers(){
  const wrap = document.getElementById("adminUsersWrap");
  if(!wrap) return;

  try {
    const res = await fetchAdmin("/api/admin/admin-users");
    if(res.status===401){ redirectToAdminLogin("/api/admin/admin-users"); return; }
    if(res.status===403){
      wrap.innerHTML = `<p style="padding:16px;color:var(--muted)">Tài khoản hiện tại không có quyền xem danh sách admin.</p>`;
      return;
    }
    if(!res.ok){
      const p = await res.json().catch(()=>({}));
      wrap.innerHTML = `<p style="padding:16px;color:var(--danger)">${p.message || "Không tải được danh sách admin"}</p>`;
      return;
    }

    const d = await res.json();
    const admins = Array.isArray(d.admins) ? d.admins : [];
    if(!admins.length){
      wrap.innerHTML = `<p style="padding:16px;color:var(--muted)">Chưa có sub-admin nào.</p>`;
      return;
    }

    wrap.innerHTML = `<table class="data-table"><thead><tr>
      <th>Username</th><th>Email</th><th>Role</th><th>Trạng thái</th><th>Đăng nhập gần nhất</th><th>Lưu</th>
    </tr></thead><tbody>${admins.map(a=>{
      const disableEdit = meAdmin && meAdmin.id && meAdmin.id === a.id;
      const highlight = adminListFocusUsername && String(a.username || "").toLowerCase() === adminListFocusUsername;
      return `<tr data-admin-id="${a.id}">
        <td style="${highlight ? "background:#fff7d6;font-weight:700" : ""}">${a.username}</td>
        <td style="font-size:.82rem">${a.email || "—"}</td>
        <td>
          <select class="adm-role" ${disableEdit?"disabled":""} style="padding:6px 8px;border:1px solid var(--line);border-radius:7px;background:#fff">
            <option value="support" ${a.role==="support"?"selected":""}>support</option>
            <option value="manager" ${a.role==="manager"?"selected":""}>manager</option>
            <option value="owner" ${a.role==="owner"?"selected":""}>owner</option>
          </select>
        </td>
        <td>
          <label style="display:flex;align-items:center;gap:8px;font-size:.82rem">
            <input class="adm-active" type="checkbox" ${a.isActive?"checked":""} ${disableEdit?"disabled":""} />
            ${adminActionBadge(a)}
          </label>
        </td>
        <td style="font-size:.8rem">${fmtDate(a.lastLoginAt)}</td>
        <td>
          <button class="btn btn-outline adm-save" ${disableEdit?"disabled":""} style="min-height:32px;font-size:.8rem;padding:0 10px">Lưu</button>
        </td>
      </tr>`;
    }).join("")}</tbody></table>`;

    bindAdminRowActions();
    if(adminListFocusUsername){
      const target = Array.from(wrap.querySelectorAll("tr[data-admin-id]"))
        .find((row)=>String(row.children?.[0]?.textContent || "").trim().toLowerCase() === adminListFocusUsername);
      if(target){
        target.scrollIntoView({ behavior: "smooth", block: "center" });
      }
    }
  } catch(e){
    wrap.innerHTML = `<p style="padding:16px;color:var(--danger)">Lỗi tải danh sách admin: ${e.message}</p>`;
  }
}

function bindAdminRowActions(){
  document.querySelectorAll(".adm-save").forEach(btn=>{
    btn.addEventListener("click", async ()=>{
      const row = btn.closest("tr[data-admin-id]");
      if(!row) return;
      const adminId = row.dataset.adminId;
      const role = row.querySelector(".adm-role")?.value;
      const isActive = !!row.querySelector(".adm-active")?.checked;

      btn.disabled = true;
      const old = btn.textContent;
      btn.textContent = "Đang lưu...";
      try {
        const res = await fetchAdmin(`/api/admin/admin-users/${adminId}`,{
          method:"PATCH",
          headers:{"Content-Type":"application/json"},
          body:JSON.stringify({ role, isActive })
        });
        const p = await res.json().catch(()=>({}));
        if(!res.ok){
          alert(p.message || "Không cập nhật được admin");
        } else {
          await loadAdminUsers();
        }
      } catch(e){
        alert("Lỗi kết nối: " + e.message);
      } finally {
        btn.disabled = false;
        btn.textContent = old;
      }
    });
  });
}

function bindCreateAdminForm(){
  const form = document.getElementById("createAdminForm");
  if(!form) return;
  const msg = document.getElementById("adminFormMsg");

  form.addEventListener("submit", async (e)=>{
    e.preventDefault();
    const username = document.getElementById("newAdminUsername").value.trim().toLowerCase();
    const email = document.getElementById("newAdminEmail").value.trim().toLowerCase();
    const password = document.getElementById("newAdminPassword").value;
    const role = document.getElementById("newAdminRole").value;

    msg.textContent = "Đang tạo sub-admin...";
    msg.style.color = "var(--muted)";

    try {
      const res = await fetchAdmin("/api/admin/admin-users",{
        method:"POST",
        headers:{"Content-Type":"application/json"},
        body:JSON.stringify({ username, email, password, role })
      });
      const p = await res.json().catch(()=>({}));
      if(!res.ok){
        if(res.status === 409 && p.existingAdmin){
          adminListFocusUsername = String(p.existingAdmin.username || username).toLowerCase();
          msg.textContent = `Username đã tồn tại: ${p.existingAdmin.username}. Đã định vị tài khoản trong danh sách bên dưới.`;
          msg.style.color = "var(--danger)";
          await loadAdminUsers();
        } else if(res.status === 403){
          msg.textContent = "Bạn không có quyền tạo sub-admin (thiếu admins:write).";
          msg.style.color = "var(--danger)";
        } else {
          msg.textContent = p.message || "Không tạo được sub-admin";
          msg.style.color = "var(--danger)";
        }
        return;
      }

      form.reset();
      document.getElementById("newAdminRole").value = "support";
      adminListFocusUsername = String(p.admin?.username || username).toLowerCase();
      msg.textContent = `Đã tạo sub-admin: ${p.admin?.username || username}`;
      msg.style.color = "var(--success)";
      await loadAdminUsers();
    } catch(err){
      msg.textContent = "Lỗi kết nối: " + err.message;
      msg.style.color = "var(--danger)";
    }
  });
}

function bindChangeMyAdminPasswordForm(){
  const form = document.getElementById("changeMyAdminPasswordForm");
  const msg = document.getElementById("changeAdminPasswordMsg");
  if(!form || !msg) return;

  form.addEventListener("submit", async (e)=>{
    e.preventDefault();
    const currentPassword = document.getElementById("currentAdminPassword")?.value || "";
    const newPassword = document.getElementById("nextAdminPassword")?.value || "";

    if(currentPassword.length < 8){
      msg.textContent = "Mật khẩu hiện tại tối thiểu 8 ký tự";
      msg.style.color = "var(--danger)";
      return;
    }
    if(newPassword.length < 8){
      msg.textContent = "Mật khẩu mới tối thiểu 8 ký tự";
      msg.style.color = "var(--danger)";
      return;
    }
    if(currentPassword === newPassword){
      msg.textContent = "Mật khẩu mới phải khác mật khẩu hiện tại";
      msg.style.color = "var(--danger)";
      return;
    }

    msg.textContent = "Đang cập nhật mật khẩu...";
    msg.style.color = "var(--muted)";

    try {
      const res = await fetchAdmin("/api/admin/me/password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ currentPassword, newPassword })
      });
      const payload = await res.json().catch(()=>({}));
      if(!res.ok){
        msg.textContent = payload.message || "Không đổi được mật khẩu";
        msg.style.color = "var(--danger)";
        return;
      }

      form.reset();
      msg.textContent = payload.message || "Đã cập nhật mật khẩu admin";
      msg.style.color = "var(--success)";
    } catch(err){
      msg.textContent = "Lỗi kết nối: " + err.message;
      msg.style.color = "var(--danger)";
    }
  });
}

async function loadSepayConfig(){
  const modeEl = document.getElementById("sepayMode");
  if(!modeEl) return;

  try {
    const res = await fetchAdmin("/api/admin/integrations/sepay");
    if(res.status===401){ redirectToAdminLogin("/api/admin/integrations/sepay"); return; }
    if(res.status===403){
      const msg = document.getElementById("sepayConfigMsg");
      if(msg){ msg.textContent = "Bạn không có quyền xem cấu hình Sepay"; msg.style.color = "var(--danger)"; }
      return;
    }
    if(!res.ok){
      const msg = document.getElementById("sepayConfigMsg");
      if(msg){ msg.textContent = "Không tải được cấu hình Sepay"; msg.style.color = "var(--danger)"; }
      return;
    }

    const data = await res.json();
    modeEl.value = data.paymentProviderMode || "mock";
    document.getElementById("sepayWebhookUrl").value = data.webhookUrl || "";
    sepaySecretConfigured = Boolean(data.secretConfigured);
    document.getElementById("sepaySecret").value = "";
    document.getElementById("sepaySecret").placeholder = sepaySecretConfigured
      ? `Đã có secret (${data.secretSource === "env" ? "nguồn env" : "runtime"}), bỏ trống nếu không đổi`
      : "Nhập token webhook từ Sepay";
    document.getElementById("sepayBankCode").value = data.sepay?.bankCode || "";
    document.getElementById("sepayAccount").value = data.sepay?.bankAccountNumber || "";
    document.getElementById("sepayAccountName").value = data.sepay?.accountName || "";
    document.getElementById("sepayQrTemplate").value = data.sepay?.qrTemplateUrl || "";

    const msg = document.getElementById("sepayConfigMsg");
    if(msg && data.webhookUrl && !isPublicWebhookUrl(data.webhookUrl)){
      msg.textContent = "Webhook URL đang là localhost/private. Sepay bên ngoài sẽ không gọi được URL này. Cần APP_BASE_URL là domain public hoặc URL tunnel.";
      msg.style.color = "var(--danger)";
    }
  } catch(err){
    const msg = document.getElementById("sepayConfigMsg");
    if(msg){ msg.textContent = "Lỗi tải cấu hình Sepay: " + err.message; msg.style.color = "var(--danger)"; }
  }
}

function bindSepayForm(){
  const form = document.getElementById("sepayConfigForm");
  if(!form) return;
  const msg = document.getElementById("sepayConfigMsg");

  form.addEventListener("submit", async (e)=>{
    e.preventDefault();
    msg.textContent = "Đang lưu...";
    msg.style.color = "var(--muted)";

    const payload = {
      paymentProviderMode: document.getElementById("sepayMode").value,
      webhookUrl: document.getElementById("sepayWebhookUrl").value.trim(),
      bankCode: document.getElementById("sepayBankCode").value.trim(),
      bankAccountNumber: document.getElementById("sepayAccount").value.trim(),
      accountName: document.getElementById("sepayAccountName").value.trim(),
      qrTemplateUrl: document.getElementById("sepayQrTemplate").value.trim()
    };
    const nextSecret = document.getElementById("sepaySecret").value.trim();
    if(nextSecret){
      payload.webhookSecret = nextSecret;
    }

    try {
      const res = await fetchAdmin("/api/admin/integrations/sepay", {
        method:"PUT",
        headers:{"Content-Type":"application/json"},
        body: JSON.stringify(payload)
      });
      const data = await res.json().catch(()=>({}));
      if(!res.ok){
        msg.textContent = data.message || "Lưu cấu hình thất bại";
        msg.style.color = "var(--danger)";
        return;
      }
      const keyStatusText = data.secretConfigured
        ? `API key: đã có (${data.secretSource === "env" ? "nguồn env" : "runtime"})`
        : "API key: chưa cấu hình";
      msg.textContent = `${data.message || "Đã lưu cấu hình Sepay"} (${keyStatusText})`;
      msg.style.color = "var(--success)";
      if(data.webhookUrl){
        document.getElementById("sepayWebhookUrl").value = data.webhookUrl;
      }
      sepaySecretConfigured = Boolean(data.secretConfigured);
      document.getElementById("sepaySecret").value = "";
      document.getElementById("sepaySecret").placeholder = sepaySecretConfigured
        ? `Đã có secret (${data.secretSource === "env" ? "nguồn env" : "runtime"}), bỏ trống nếu không đổi`
        : "Nhập token webhook từ Sepay";
      if(data.webhookUrl && !isPublicWebhookUrl(data.webhookUrl)){
        msg.textContent = "Đã lưu cấu hình, nhưng Webhook URL vẫn là localhost/private nên Sepay chưa gọi được từ bên ngoài.";
        msg.style.color = "var(--danger)";
      }
    } catch(err){
      msg.textContent = "Lỗi kết nối: " + err.message;
      msg.style.color = "var(--danger)";
    }
  });
}

async function loadAiAppSecretStatus(){
  const maskedEl = document.getElementById("aiAppMaskedSecret");
  const headerEl = document.getElementById("aiAppHeaderName");
  const baseUrlEl = document.getElementById("aiAppBaseUrl");
  const msg = document.getElementById("aiAppSecretMsg");
  if(!maskedEl || !headerEl || !baseUrlEl || !msg) return;

  try {
    const res = await fetchAdmin("/api/admin/integrations/ai-app");
    if(res.status===401){ redirectToAdminLogin("/api/admin/integrations/ai-app"); return; }
    const data = await res.json().catch(()=>({}));
    if(!res.ok){
      msg.textContent = data.message || "Không tải được trạng thái AI-app secret";
      msg.style.color = "var(--danger)";
      return;
    }

    aiAppSecretConfigured = Boolean(data.configured);
    maskedEl.value = data.maskedKey || "Chưa cấu hình trên production";
    headerEl.value = data.authHeaderName || "x-ai-app-key";
    baseUrlEl.value = data.productionBaseUrl || "";
    msg.textContent = data.configured
      ? `Key đang có trên production (${data.keyLength || 0} ký tự, nguồn: ${data.source || "unknown"}). Bạn có thể quản lý theo profile shared/web/desktop.`
      : "Production chưa có AI-app shared secret.";
    msg.style.color = data.configured ? "var(--success)" : "var(--danger)";
    renderAiAppKeyManager(data.profiles || {}, data.productionBaseUrl || "");
  } catch(err){
    msg.textContent = "Lỗi tải trạng thái AI-app secret: " + err.message;
    msg.style.color = "var(--danger)";
  }
}

function renderAiAppKeyManager(profiles, productionBaseUrl){
  const wrap = document.getElementById("aiAppKeyManagerWrap");
  if(!wrap) return;

  const profileOrder = ["shared", "web", "desktop"];
  const appLabel = { shared: "AI-app (chung)", web: "AI-app (web)", desktop: "AI-app (desktop)" };
  const rows = profileOrder.map((profile)=>{
    const info = profiles?.[profile] || {};
    const configured = Boolean(info.configured);
    const source = info.source || "none";
    const url = (profile === "desktop") ? "" : (productionBaseUrl || "");
    const urlCell = url ? `<a href="${url}" target="_blank" style="font-size:.78rem;color:var(--primary)">${url}</a>` : "<span style='color:var(--muted)'>—</span>";
    return `<tr>
      <td><b>${appLabel[profile]||profile}</b></td>
      <td>${profile}</td>
      <td>${configured ? (info.maskedKey || "********") : "Chưa cấu hình"}</td>
      <td>${urlCell}</td>
      <td>${source}</td>
      <td>${configured ? '<span class="status-badge status-active">active</span>' : '<span class="status-badge" style="background:#fee2e2;color:#991b1b">missing</span>'}</td>
      <td style="white-space:nowrap">
        <button onclick="editKeyProfile('${profile}')" class="btn btn-outline" style="padding:3px 10px;font-size:.78rem;min-height:0">Sửa</button>
        <button onclick="deleteKeyForProfile('${profile}')" class="btn" style="padding:3px 10px;font-size:.78rem;min-height:0;background:#fee2e2;color:#991b1b;border:1px solid #fca5a5">Xóa</button>
      </td>
    </tr>`;
  }).join("");

  wrap.innerHTML = `<table class="data-table"><thead><tr>
    <th>Tên app</th><th>Profile</th><th>Masked key</th><th>URL</th><th>Nguồn</th><th>Trạng thái</th><th>Hành động</th>
  </tr></thead><tbody>${rows}</tbody></table>`;
}

function editKeyProfile(profile){
  const profileEl = document.getElementById("aiAppKeyProfile");
  const generatedEl = document.getElementById("aiAppGeneratedSecret");
  if(profileEl) profileEl.value = profile;
  if(generatedEl) generatedEl.value = "";
  const section = document.getElementById("section-aiapp-secret");
  if(section){
    section.scrollIntoView({behavior:"smooth",block:"start"});
    setTimeout(()=>{ const inp = document.getElementById("aiAppGeneratedSecret"); if(inp) inp.focus(); }, 400);
  }
}

async function deleteKeyForProfile(profile){
  if(!confirm(`Xóa key profile "${profile}"? Hành động này sẽ ngắt kết nối AI-app dùng profile này.`)) return;
  try {
    const res = await fetchAdmin("/api/admin/integrations/ai-app", {
      method: "DELETE",
      headers: {"Content-Type":"application/json"},
      body: JSON.stringify({profile})
    });
    if(res.status===401){ redirectToAdminLogin("/api/admin/integrations/ai-app"); return; }
    const data = await res.json().catch(()=>({}));
    if(!res.ok){
      alert(data.message || "Xóa key thất bại");
      return;
    }
    await loadAiAppSecretStatus();
  } catch(err){
    alert("Lỗi xóa key: " + err.message);
  }
}

function bindAiAppSecretControls(){
  const revealBtn = document.getElementById("aiAppRevealBtn");
  const maskedEl = document.getElementById("aiAppMaskedSecret");
  const msg = document.getElementById("aiAppSecretMsg");
  const generateBtn = document.getElementById("aiAppGenerateBtn");
  const saveSecretBtn = document.getElementById("aiAppSaveSecretBtn");
  const generatedEl = document.getElementById("aiAppGeneratedSecret");
  const copySecretBtn = document.getElementById("aiAppCopySecretBtn");
  const generateSaveBtn = document.getElementById("aiAppGenerateSaveBtn");
  const profileEl = document.getElementById("aiAppKeyProfile");
  const commandEl = document.getElementById("aiAppVercelCommand");
  const guideMsg = document.getElementById("aiAppGuideMsg");
  const baseUrlEl = document.getElementById("aiAppBaseUrl");
  if(!revealBtn || !maskedEl || !msg) return;

  function randomSecret(size){
    const chars = "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz23456789";
    let out = "";
    const length = Math.max(16, Number(size) || 32);
    for(let i=0;i<length;i+=1){
      const idx = Math.floor(Math.random() * chars.length);
      out += chars[idx];
    }
    return out;
  }

  function currentProfile(){
    const v = String(profileEl?.value || "shared").trim().toLowerCase();
    if(v === "web" || v === "desktop" || v === "shared") return v;
    return "shared";
  }

  function updateVercelCommand(secret){
    if(!commandEl) return;
    const value = String(secret || "").trim();
    const profile = currentProfile();
    if(!value){
      commandEl.value = "";
      return;
    }
    commandEl.value = `Sẵn sàng lưu profile ${profile} (${value.length} ký tự). Bấm \"Lưu key trực tiếp\" hoặc \"Tạo và lưu ngay\".`;
  }

  async function copyText(value, okMessage){
    const text = String(value || "").trim();
    if(!text){
      if(guideMsg){
        guideMsg.textContent = "Chưa có dữ liệu để copy.";
        guideMsg.style.color = "var(--danger)";
      }
      return;
    }

    try {
      await navigator.clipboard.writeText(text);
      if(guideMsg){
        guideMsg.textContent = okMessage;
        guideMsg.style.color = "var(--success)";
      }
    } catch(err){
      if(guideMsg){
        guideMsg.textContent = "Không copy tự động được. Hãy copy thủ công.";
        guideMsg.style.color = "var(--danger)";
      }
    }
  }

  async function saveKeyForProfile(sharedKey){
    const profile = currentProfile();
    const res = await fetchAdmin("/api/admin/integrations/ai-app", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ profile, sharedKey })
    });
    if(res.status===401){ redirectToAdminLogin("/api/admin/integrations/ai-app"); return { ok:false, redirected:true }; }
    const data = await res.json().catch(()=>({}));
    if(!res.ok){
      if(res.status === 403){
        return { ok:false, message: "Bạn không có quyền lưu key (thiếu admins:write)." };
      }
      if(res.status >= 500){
        return { ok:false, message: data.message || "Server đang lỗi khi lưu key. Vui lòng thử lại sau." };
      }
      return { ok:false, message: data.message || "Lưu key thất bại." };
    }
    return { ok:true, message: data.message || `Đã lưu key profile ${profile}.` };
  }

  if(generateBtn && generatedEl){
    generateBtn.addEventListener("click", ()=>{
      const nextSecret = randomSecret(32);
      generatedEl.value = nextSecret;
      updateVercelCommand(nextSecret);
      if(guideMsg){
        const baseUrl = String(baseUrlEl?.value || "").trim() || "(chưa rõ base URL)";
        guideMsg.textContent = `Đã tạo key mẫu 32 ký tự cho profile ${currentProfile()}. Bước tiếp: bấm 'Lưu key trực tiếp' hoặc 'Tạo và lưu ngay'. Base URL hiện tại: ${baseUrl}`;
        guideMsg.style.color = "var(--muted)";
      }
    });
  }

  if(generateSaveBtn && generatedEl){
    generateSaveBtn.addEventListener("click", async ()=>{
      const nextSecret = randomSecret(32);
      generatedEl.value = nextSecret;
      updateVercelCommand(nextSecret);
      if(guideMsg){
        guideMsg.textContent = `Đang tạo và lưu key profile ${currentProfile()}...`;
        guideMsg.style.color = "var(--muted)";
      }

      try {
        const result = await saveKeyForProfile(nextSecret);
        if(result.redirected) return;
        if(!result.ok){
          if(guideMsg){
            guideMsg.textContent = result.message;
            guideMsg.style.color = "var(--danger)";
          }
          return;
        }

        if(guideMsg){
          guideMsg.textContent = result.message;
          guideMsg.style.color = "var(--success)";
        }
        await loadAiAppSecretStatus();
      } catch(err){
        if(guideMsg){
          guideMsg.textContent = "Lỗi lưu key: " + err.message;
          guideMsg.style.color = "var(--danger)";
        }
      }
    });
  }

  if(saveSecretBtn && generatedEl){
    saveSecretBtn.addEventListener("click", async ()=>{
      const sharedKey = String(generatedEl.value || "").trim();
      if(!sharedKey || sharedKey.length < 16){
        if(guideMsg){
          guideMsg.textContent = "Shared secret tối thiểu 16 ký tự. Hãy tạo key mới rồi lưu.";
          guideMsg.style.color = "var(--danger)";
        }
        return;
      }

      if(guideMsg){
        guideMsg.textContent = "Đang lưu key trực tiếp lên hệ thống...";
        guideMsg.style.color = "var(--muted)";
      }

      try {
        const result = await saveKeyForProfile(sharedKey);
        if(result.redirected) return;
        if(!result.ok){
          if(guideMsg){
            guideMsg.textContent = result.message || "Lưu key thất bại.";
            guideMsg.style.color = "var(--danger)";
          }
          return;
        }

        if(guideMsg){
          guideMsg.textContent = result.message || "Đã lưu key trực tiếp thành công.";
          guideMsg.style.color = "var(--success)";
        }
        await loadAiAppSecretStatus();
      } catch(err){
        if(guideMsg){
          guideMsg.textContent = "Lỗi lưu key: " + err.message;
          guideMsg.style.color = "var(--danger)";
        }
      }
    });
  }

  if(copySecretBtn && generatedEl){
    copySecretBtn.addEventListener("click", ()=>{
      copyText(generatedEl.value, "Đã copy key mẫu.");
    });
  }

  revealBtn.addEventListener("click", async ()=>{
    msg.textContent = "Đang lấy shared secret...";
    msg.style.color = "var(--muted)";

    try {
      const profile = currentProfile();
      const res = await fetchAdmin("/api/admin/integrations/ai-app/reveal", {
        method:"POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ profile })
      });
      if(res.status===401){ redirectToAdminLogin("/api/admin/integrations/ai-app/reveal"); return; }
      const data = await res.json().catch(()=>({}));
      if(!res.ok){
        msg.textContent = data.message || "Không lấy được shared secret";
        msg.style.color = "var(--danger)";
        return;
      }

      maskedEl.value = data.sharedSecret || "";
      msg.textContent = `Đã hiện key thật cho profile ${data.profile || currentProfile()}. Sao chép và gửi qua kênh secure.`;
      msg.style.color = "var(--success)";
      updateVercelCommand(data.sharedSecret || "");
    } catch(err){
      msg.textContent = "Lỗi kết nối: " + err.message;
      msg.style.color = "var(--danger)";
    }
  });
}

function gateRowHtml(item, section){
  const required = item.required ? "required" : "optional";
  return `<tr data-gate-section="${section}" data-gate-id="${escapeHtml(item.id)}">
    <td style="font-family:monospace;font-size:.78rem">${escapeHtml(item.id)}</td>
    <td><span class="status-badge ${item.required ? "status-pending" : ""}">${required}</span></td>
    <td style="text-align:center"><input class="gate-passed" type="checkbox" ${item.passed ? "checked" : ""} /></td>
    <td><input class="gate-evidence" value="${escapeHtml(item.evidence || "")}" placeholder="Nhập bằng chứng" style="width:100%;padding:6px 8px;border:1px solid var(--line);border-radius:7px;background:#fff" /></td>
  </tr>`;
}

function renderGateChecklist(data){
  const readyWrap = document.getElementById("gateReadyWrap");
  const doneWrap = document.getElementById("gateDoneWrap");
  const summaryBar = document.getElementById("gateSummaryBar");
  if(!readyWrap || !doneWrap || !summaryBar) return;

  const summary = data.summary || { readyPassed:0, readyRequired:0, donePassed:0, doneRequired:0, allPassed:false };
  const okText = summary.allPassed ? "PASS" : "CHUA DAT";
  summaryBar.textContent = `App: ${data.app} · Ready ${summary.readyPassed}/${summary.readyRequired} · Done ${summary.donePassed}/${summary.doneRequired} · ${okText}`;

  const readyRows = (data.data?.definitionOfReady || []).map(item=>gateRowHtml(item, "ready")).join("");
  const doneRows = (data.data?.definitionOfDone || []).map(item=>gateRowHtml(item, "done")).join("");

  readyWrap.innerHTML = `<table class="data-table"><thead><tr>
    <th>ID</th><th>Loai</th><th>Passed</th><th>Evidence</th>
  </tr></thead><tbody>${readyRows || '<tr><td colspan="4" style="color:var(--muted)">Khong co du lieu</td></tr>'}</tbody></table>`;

  doneWrap.innerHTML = `<table class="data-table"><thead><tr>
    <th>ID</th><th>Loai</th><th>Passed</th><th>Evidence</th>
  </tr></thead><tbody>${doneRows || '<tr><td colspan="4" style="color:var(--muted)">Khong co du lieu</td></tr>'}</tbody></table>`;
}

async function loadGateStatus(){
  const wrap = document.getElementById("gateStatusWrap");
  if(!wrap) return;
  try {
    const res = await fetchAdmin("/api/admin/ai-gates");
    if(res.status===401){ redirectToAdminLogin("/api/admin/ai-gates"); return; }
    if(res.status===403){
      wrap.innerHTML = `<p style="padding:16px;color:var(--muted)">Ban khong co quyen xem AI Gate.</p>`;
      return;
    }
    const payload = await res.json().catch(()=>({}));
    if(!res.ok){
      wrap.innerHTML = `<p style="padding:16px;color:var(--danger)">${payload.message || "Khong tai duoc trang thai gate"}</p>`;
      return;
    }
    const gates = Array.isArray(payload.gates) ? payload.gates : [];
    wrap.innerHTML = `<table class="data-table"><thead><tr>
      <th>App</th><th>Checklist</th><th>Ready</th><th>Done</th><th>Ket qua</th><th>Cap nhat</th>
    </tr></thead><tbody>${gates.map(g=>`<tr>
      <td>${escapeHtml(g.app || "")}</td>
      <td style="font-size:.8rem">${escapeHtml(g.fileName || "—")}</td>
      <td>${g.summary?.readyPassed || 0}/${g.summary?.readyRequired || 0}</td>
      <td>${g.summary?.donePassed || 0}/${g.summary?.doneRequired || 0}</td>
      <td>${g.summary?.allPassed ? '<span class="status-badge status-active">PASS</span>' : '<span class="status-badge" style="background:#fee2e2;color:#991b1b">FAIL</span>'}</td>
      <td style="font-size:.8rem">${escapeHtml(g.updatedAt || "—")}</td>
    </tr>`).join("")}</tbody></table>`;
  } catch(err){
    wrap.innerHTML = `<p style="padding:16px;color:var(--danger)">Loi tai trang thai gate: ${escapeHtml(err.message)}</p>`;
  }
}

async function loadGateDetail(app){
  const msg = document.getElementById("gateMsg");
  if(msg){ msg.textContent = "Dang tai checklist..."; msg.style.color = "var(--muted)"; }
  try {
    const res = await fetchAdmin(`/api/admin/ai-gates/${encodeURIComponent(app)}`);
    if(res.status===401){ redirectToAdminLogin(`/api/admin/ai-gates/${encodeURIComponent(app)}`); return; }
    const payload = await res.json().catch(()=>({}));
    if(!res.ok){
      if(msg){ msg.textContent = payload.message || "Khong tai duoc checklist"; msg.style.color = "var(--danger)"; }
      return;
    }
    currentGateApp = payload.app || app;
    currentGateData = payload;
    renderGateChecklist(payload);
    if(msg){ msg.textContent = `Da tai ${payload.fileName}`; msg.style.color = "var(--success)"; }
  } catch(err){
    if(msg){ msg.textContent = `Loi tai checklist: ${err.message}`; msg.style.color = "var(--danger)"; }
  }
}

function collectGateUpdates(section){
  const rows = document.querySelectorAll(`tr[data-gate-section="${section}"]`);
  return Array.from(rows).map((row)=>({
    id: row.dataset.gateId,
    passed: !!row.querySelector(".gate-passed")?.checked,
    evidence: row.querySelector(".gate-evidence")?.value || ""
  }));
}

async function saveGateChecklist(){
  const msg = document.getElementById("gateMsg");
  if(!currentGateApp) return;
  if(msg){ msg.textContent = "Dang luu checklist..."; msg.style.color = "var(--muted)"; }
  try {
    const res = await fetchAdmin(`/api/admin/ai-gates/${encodeURIComponent(currentGateApp)}`, {
      method:"PUT",
      headers:{"Content-Type":"application/json"},
      body:JSON.stringify({
        definitionOfReady: collectGateUpdates("ready"),
        definitionOfDone: collectGateUpdates("done")
      })
    });
    const payload = await res.json().catch(()=>({}));
    if(!res.ok){
      if(msg){ msg.textContent = payload.message || "Luu checklist that bai"; msg.style.color = "var(--danger)"; }
      return;
    }
    currentGateData = payload;
    renderGateChecklist(payload);
    await loadGateStatus();
    if(msg){ msg.textContent = "Da luu checklist thanh cong"; msg.style.color = "var(--success)"; }
  } catch(err){
    if(msg){ msg.textContent = `Loi luu checklist: ${err.message}`; msg.style.color = "var(--danger)"; }
  }
}

async function commitGateChecklist(){
  const msg = document.getElementById("gateCommitMsg");
  const message = document.getElementById("gateCommitMessage")?.value?.trim();
  const branch = document.getElementById("gateCommitBranch")?.value?.trim();
  if(msg){ msg.textContent = "Dang commit qua GitHub API..."; msg.style.color = "var(--muted)"; }
  try {
    const res = await fetchAdmin(`/api/admin/ai-gates/${encodeURIComponent(currentGateApp)}/commit`, {
      method:"POST",
      headers:{"Content-Type":"application/json"},
      body:JSON.stringify({ message, branch })
    });
    const payload = await res.json().catch(()=>({}));
    if(!res.ok){
      if(msg){ msg.textContent = payload.message || "Commit that bai"; msg.style.color = "var(--danger)"; }
      return;
    }
    const detail = payload.commitUrl ? ` · ${payload.commitUrl}` : "";
    if(msg){ msg.textContent = `Commit thanh cong: ${payload.commitSha || ""}${detail}`; msg.style.color = "var(--success)"; }
  } catch(err){
    if(msg){ msg.textContent = `Loi commit: ${err.message}`; msg.style.color = "var(--danger)"; }
  }
}

function bindAiGateControls(){
  const appSelect = document.getElementById("gateAppSelect");
  const reloadBtn = document.getElementById("gateReloadBtn");
  const saveBtn = document.getElementById("gateSaveBtn");
  const commitBtn = document.getElementById("gateCommitBtn");
  if(!appSelect || !reloadBtn || !saveBtn || !commitBtn) return;

  appSelect.addEventListener("change", ()=>{
    currentGateApp = appSelect.value;
    loadGateDetail(currentGateApp);
  });

  reloadBtn.addEventListener("click", ()=>{
    loadGateStatus();
    loadGateDetail(appSelect.value);
  });

  saveBtn.addEventListener("click", ()=> saveGateChecklist());
  commitBtn.addEventListener("click", ()=> commitGateChecklist());

  loadGateStatus();
  loadGateDetail(appSelect.value);
}

async function loadManualGrantCatalog(){
  const sel = document.getElementById("mgProductId");
  if(!sel) return;
  try {
    const res = await fetchAdmin("/api/admin/catalog");
    if(res.status===401){ redirectToAdminLogin("/api/admin/catalog"); return; }
    if(!res.ok) return;
    const data = await res.json().catch(()=>({products:[]}));
    const products = (data.products || []).filter(p => p.active !== false);
    if(!products.length){
      sel.innerHTML = '<option value="">Không có sản phẩm nào</option>';
      return;
    }
    // Group by appId
    const byApp = {};
    products.forEach(p=>{ (byApp[p.appId] = byApp[p.appId]||[]).push(p); });
    sel.innerHTML = Object.entries(byApp).map(([appId, items])=>{
      const opts = items.map(p=>{
        const price = p.price ? new Intl.NumberFormat("vi-VN",{style:"currency",currency:"VND"}).format(p.price) : "free";
        return `<option value="${p.id}">[${appId}] ${p.name} (${p.cycle} — ${price})</option>`;
      }).join("");
      return `<optgroup label="${appId}">${opts}</optgroup>`;
    }).join("");
  } catch(err){
    sel.innerHTML = '<option value="">Lỗi tải sản phẩm</option>';
  }
}

function bindManualGrant(){
  const grantBtn = document.getElementById("mgGrantBtn");
  if(!grantBtn) return;
  grantBtn.addEventListener("click", async ()=>{
    const emailEl = document.getElementById("mgEmail");
    const productEl = document.getElementById("mgProductId");
    const noteEl = document.getElementById("mgNote");
    const msgEl = document.getElementById("mgMsg");
    const resultEl = document.getElementById("mgResult");

    const customerEmail = (emailEl?.value||"").trim();
    const productId = (productEl?.value||"").trim();
    const adminNote = (noteEl?.value||"").trim();

    if(!customerEmail || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(customerEmail)){
      if(msgEl){ msgEl.textContent="Email không hợp lệ"; msgEl.style.color="var(--danger)"; }
      return;
    }
    if(!productId){
      if(msgEl){ msgEl.textContent="Vui lòng chọn sản phẩm"; msgEl.style.color="var(--danger)"; }
      return;
    }

    grantBtn.disabled = true;
    grantBtn.textContent = "Đang xử lý...";
    if(msgEl){ msgEl.textContent=""; }
    if(resultEl){ resultEl.style.display="none"; resultEl.innerHTML=""; }

    try {
      const res = await fetchAdmin("/api/admin/manual-grant", {
        method: "POST",
        headers:{"Content-Type":"application/json"},
        body: JSON.stringify({customerEmail, productId, adminNote})
      });
      if(res.status===401){ redirectToAdminLogin("/api/admin/manual-grant"); return; }
      const data = await res.json().catch(()=>({}));
      if(!res.ok){
        if(msgEl){ msgEl.textContent = data.message||"Cấp key thất bại"; msgEl.style.color="var(--danger)"; }
        return;
      }
      if(msgEl){ msgEl.textContent="Cấp key thành công!"; msgEl.style.color="var(--success)"; }
      if(resultEl){
        resultEl.style.display="block";
        resultEl.innerHTML = [
          `<div class="admin-manual-grant-result-row"><b>License Key:</b> <code>${data.licenseKey||""}</code>`,
          ` <button onclick="navigator.clipboard.writeText('${data.licenseKey||""}')">Copy</button></div>`,
          `<div><b>Order:</b> ${data.orderCode||""} | <b>App:</b> ${data.appId||""} | <b>Gói:</b> ${data.productName||""} (${data.billingCycle||""})</div>`,
          `<div><b>Khách hàng:</b> ${data.customerEmail||""} | <b>Hết hạn:</b> ${data.expiresAt ? new Date(data.expiresAt).toLocaleDateString("vi-VN") : "Không thời hạn"}</div>`
        ].join("");
      }
    } catch(err){
      if(msgEl){ msgEl.textContent="Lỗi: "+err.message; msgEl.style.color="var(--danger)"; }
    } finally {
      grantBtn.disabled = false;
      grantBtn.textContent = "Cấp key ngay";
    }
  });
}

function escapeSqlString(value){
  return String(value || "").replace(/'/g, "''");
}

function splitCompensationLine(line){
  const raw = String(line || "").trim();
  if(!raw) return [];
  if(raw.includes("\t")) return raw.split("\t");
  if(raw.includes(";")) return raw.split(";");
  if(raw.includes(",")) return raw.split(",");
  return raw.split(/\s+/);
}

function isCompensationHeader(parts){
  const text = parts.map((item)=>String(item || "").trim().toLowerCase()).join(" ");
  return text.includes("license") || text.includes("key") || text.includes("days") || text.includes("email");
}

function parseLicenseCompensationRows(raw, format){
  const lines = String(raw || "")
    .split(/\r?\n/)
    .map((line)=>line.trim())
    .filter(Boolean);

  const rows = [];
  const errors = [];

  lines.forEach((line, index)=>{
    const parts = splitCompensationLine(line).map((item)=>String(item || "").trim()).filter(Boolean);
    if(!parts.length) return;
    if(index === 0 && isCompensationHeader(parts)) return;

    let email = "";
    let licenseKey = "";
    let daysText = "";

    if(format === "email_license_days"){
      [email, licenseKey, daysText] = parts;
    } else if (format === "email_days") {
      [email, daysText] = parts;
    } else {
      [licenseKey, daysText] = parts;
    }

    const days = Number.parseInt(String(daysText || "").trim(), 10);
    const hasLookup = Boolean(licenseKey || email);
    if(!hasLookup || !Number.isFinite(days) || days <= 0){
      errors.push(`Dòng ${index + 1}: dữ liệu không hợp lệ -> ${line}`);
      return;
    }

    rows.push({
      email,
      licenseKey: licenseKey.toUpperCase(),
      days
    });
  });

  return { rows, errors };
}

function buildLicenseCompExpirySql(mode, alias = "expires_at") {
  return mode === "add_days"
    ? `GREATEST(COALESCE(${alias}, NOW()), NOW()) + make_interval(days => src.days)`
    : "NOW() + make_interval(days => src.days)";
}

function buildLicenseCompSingleExpirySql(mode, daysLiteral, alias = "expires_at") {
  return mode === "add_days"
    ? `GREATEST(COALESCE(${alias}, NOW()), NOW()) + INTERVAL '${daysLiteral}'`
    : `NOW() + INTERVAL '${daysLiteral}'`;
}

function buildCompareSelectSql(rows, format){
  if(!rows.length) return "";

  if(format === "license_days"){
    const keyListSql = rows.map((item)=>`'${escapeSqlString(item.licenseKey)}'`).join(", ");
    return [
      `SELECT license_key, status, expires_at`,
      `FROM app_licenses`,
      `WHERE license_key IN (${keyListSql})`,
      `ORDER BY license_key;`
    ].join("\n");
  }

  if(format === "email_license_days"){
    const valuesSql = rows
      .map((item)=>`    ('${escapeSqlString(item.email)}', '${escapeSqlString(item.licenseKey)}', ${item.days})`)
      .join(",\n");
    return [
      `WITH src(email, license_key, days) AS (`,
      `  VALUES`,
      valuesSql,
      `)`,
      `SELECT src.email, al.license_key, al.status, al.expires_at`,
      `FROM src`,
      `LEFT JOIN customers c ON LOWER(c.email) = LOWER(src.email)`,
      `LEFT JOIN app_licenses al ON al.customer_id = c.id AND al.license_key = src.license_key`,
      `ORDER BY src.email, al.license_key;`
    ].join("\n");
  }

  const valuesSql = rows
    .map((item)=>`    ('${escapeSqlString(item.email)}', ${item.days})`)
    .join(",\n");
  return [
    `WITH src(email, days) AS (`,
    `  VALUES`,
    valuesSql,
    `)`,
    `SELECT src.email, al.license_key, al.status, al.expires_at`,
    `FROM src`,
    `LEFT JOIN customers c ON LOWER(c.email) = LOWER(src.email)`,
    `LEFT JOIN app_licenses al ON al.customer_id = c.id`,
    `ORDER BY src.email, al.license_key;`
  ].join("\n");
}

function buildSingleCompensationSql(item, mode, format){
  if(!item) return "";
  const daysLiteral = `${item.days} days`;
  const safeKey = escapeSqlString(item.licenseKey);
  const safeEmail = escapeSqlString(item.email);
  const setExpirySql = buildLicenseCompSingleExpirySql(mode, daysLiteral);
  const emailComment = item.email ? `-- Email: ${item.email}\n` : "";

  if(format === "email_days"){
    return [
      `${emailComment}UPDATE app_licenses AS al`,
      `SET expires_at = ${setExpirySql},`,
      `    updated_at = NOW()`,
      `FROM customers c`,
      `WHERE LOWER(c.email) = LOWER('${safeEmail}')`,
      `  AND al.customer_id = c.id;`,
      "",
      `SELECT c.email, al.license_key, al.status, al.expires_at`,
      `FROM customers c`,
      `LEFT JOIN app_licenses al ON al.customer_id = c.id`,
      `WHERE LOWER(c.email) = LOWER('${safeEmail}')`,
      `ORDER BY al.license_key;`
    ].join("\n");
  }

  if(format === "email_license_days"){
    return [
      `${emailComment}UPDATE app_licenses AS al`,
      `SET expires_at = ${setExpirySql},`,
      `    updated_at = NOW()`,
      `FROM customers c`,
      `WHERE LOWER(c.email) = LOWER('${safeEmail}')`,
      `  AND al.customer_id = c.id`,
      `  AND al.license_key = '${safeKey}';`,
      "",
      `SELECT c.email, al.license_key, al.status, al.expires_at`,
      `FROM customers c`,
      `LEFT JOIN app_licenses al ON al.customer_id = c.id`,
      `WHERE LOWER(c.email) = LOWER('${safeEmail}')`,
      `  AND al.license_key = '${safeKey}';`
    ].join("\n");
  }

  return [
    `${emailComment}UPDATE app_licenses`,
    `SET expires_at = ${setExpirySql},`,
    `    updated_at = NOW()`,
    `WHERE license_key = '${safeKey}';`,
    "",
    `SELECT license_key, status, expires_at`,
    `FROM app_licenses`,
    `WHERE license_key = '${safeKey}';`
  ].join("\n");
}

function buildBulkCompensationSql(rows, mode, format){
  if(!rows.length) return "";
  const expirySql = buildLicenseCompExpirySql(mode, "al.expires_at");

  if(format === "email_license_days"){
    const valuesSql = rows
      .map((item)=>`    ('${escapeSqlString(item.email)}', '${escapeSqlString(item.licenseKey)}', ${item.days})`)
      .join(",\n");
    return [
      `WITH src(email, license_key, days) AS (`,
      `  VALUES`,
      valuesSql,
      `)`,
      `UPDATE app_licenses AS al`,
      `SET expires_at = ${expirySql},`,
      `    updated_at = NOW()`,
      `FROM src`,
      `JOIN customers c ON LOWER(c.email) = LOWER(src.email)`,
      `WHERE al.customer_id = c.id`,
      `  AND al.license_key = src.license_key;`
    ].join("\n");
  }

  if(format === "email_days"){
    const valuesSql = rows
      .map((item)=>`    ('${escapeSqlString(item.email)}', ${item.days})`)
      .join(",\n");
    return [
      `WITH src(email, days) AS (`,
      `  VALUES`,
      valuesSql,
      `)`,
      `UPDATE app_licenses AS al`,
      `SET expires_at = ${expirySql},`,
      `    updated_at = NOW()`,
      `FROM src`,
      `JOIN customers c ON LOWER(c.email) = LOWER(src.email)`,
      `WHERE al.customer_id = c.id;`
    ].join("\n");
  }

  const valuesSql = rows
    .map((item)=>`    ('${escapeSqlString(item.licenseKey)}', ${item.days})`)
    .join(",\n");

  return [
    `UPDATE app_licenses AS al`,
    `SET expires_at = ${expirySql},`,
    `    updated_at = NOW()`,
    `FROM (`,
    `  VALUES`,
    valuesSql,
    `) AS src(license_key, days)`,
    `WHERE al.license_key = src.license_key;`
  ].join("\n");
}

function buildCompareWorkflowSql(rows, mode, format){
  if(!rows.length) return "";
  const compareSql = buildCompareSelectSql(rows, format);
  const bulkSql = buildBulkCompensationSql(rows, mode, format);
  return [
    `-- BEFORE UPDATE`,
    compareSql,
    "",
    `-- APPLY UPDATE`,
    bulkSql,
    "",
    `-- AFTER UPDATE`,
    compareSql
  ].join("\n\n");
}

function downloadTextFile(fileName, content){
  const blob = new Blob([content], { type: "application/sql;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = fileName;
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
}

function saveLicenseCompDraft(){
  const input = document.getElementById("licenseCompInput");
  const mode = document.getElementById("licenseCompMode");
  const format = document.getElementById("licenseCompFormat");
  if(!input || !mode || !format) return;
  const payload = {
    raw: input.value || "",
    mode: mode.value || "set_remaining",
    format: format.value || "license_days"
  };
  window.localStorage.setItem(licenseCompDraftStorageKey, JSON.stringify(payload));
}

function loadLicenseCompDraft(){
  const input = document.getElementById("licenseCompInput");
  const mode = document.getElementById("licenseCompMode");
  const format = document.getElementById("licenseCompFormat");
  if(!input || !mode || !format) return;
  try {
    const raw = window.localStorage.getItem(licenseCompDraftStorageKey);
    if(!raw) return;
    const payload = JSON.parse(raw);
    input.value = String(payload?.raw || "");
    if(payload?.mode) mode.value = payload.mode;
    if(payload?.format) format.value = payload.format;
  } catch {
    // ignore broken local draft
  }
}

async function copyLicenseCompText(text, successMessageHost, successMessage){
  if(!text) return;
  await navigator.clipboard.writeText(text);
  if(successMessageHost){
    successMessageHost.textContent = successMessage;
    successMessageHost.style.color = "var(--success,#16a34a)";
  }
}

function bindLicenseCompensationTool(){
  const input = document.getElementById("licenseCompInput");
  const mode = document.getElementById("licenseCompMode");
  const format = document.getElementById("licenseCompFormat");
  const generateBtn = document.getElementById("licenseCompGenerateBtn");
  const clearBtn = document.getElementById("licenseCompClearBtn");
  const msg = document.getElementById("licenseCompMsg");
  const singleSql = document.getElementById("licenseCompSingleSql");
  const bulkSql = document.getElementById("licenseCompBulkSql");
  const compareSql = document.getElementById("licenseCompCompareSql");
  const copySingleBtn = document.getElementById("licenseCompCopySingleBtn");
  const copyBulkBtn = document.getElementById("licenseCompCopyBulkBtn");
  const copyCompareBtn = document.getElementById("licenseCompCopyCompareBtn");
  const exportBtn = document.getElementById("licenseCompExportBtn");
  if(!input || !mode || !format || !generateBtn || !clearBtn || !singleSql || !bulkSql || !compareSql) return;

  loadLicenseCompDraft();

  function renderSql(){
    const parsed = parseLicenseCompensationRows(input.value, format.value);
    saveLicenseCompDraft();

    if(parsed.errors.length){
      msg.textContent = parsed.errors[0];
      msg.style.color = "var(--danger)";
    } else if(!parsed.rows.length) {
      msg.textContent = "Dán danh sách license_key hoặc email kèm số ngày để sinh SQL.";
      msg.style.color = "var(--muted)";
    } else {
      const modeLabel = mode.value === "add_days" ? "cộng thêm" : "set còn lại";
      msg.textContent = `Đã nhận ${parsed.rows.length} dòng hợp lệ, chế độ ${modeLabel}.`;
      msg.style.color = "var(--muted)";
    }

    singleSql.value = buildSingleCompensationSql(parsed.rows[0], mode.value, format.value);
    bulkSql.value = buildBulkCompensationSql(parsed.rows, mode.value, format.value);
    compareSql.value = buildCompareWorkflowSql(parsed.rows, mode.value, format.value);
  }

  generateBtn.addEventListener("click", renderSql);
  clearBtn.addEventListener("click", ()=>{
    input.value = "";
    singleSql.value = "";
    bulkSql.value = "";
    compareSql.value = "";
    window.localStorage.removeItem(licenseCompDraftStorageKey);
    msg.textContent = "Đã xóa draft bù ngày trong admin.";
    msg.style.color = "var(--muted)";
  });
  input.addEventListener("input", saveLicenseCompDraft);
  mode.addEventListener("change", renderSql);
  format.addEventListener("change", renderSql);

  copySingleBtn?.addEventListener("click", async ()=>{
    try {
      await copyLicenseCompText(singleSql.value, msg, "Đã copy SQL test 1 khách.");
    } catch(err) {
      msg.textContent = `Không copy được SQL test: ${err.message}`;
      msg.style.color = "var(--danger)";
    }
  });
  copyBulkBtn?.addEventListener("click", async ()=>{
    try {
      await copyLicenseCompText(bulkSql.value, msg, "Đã copy SQL bulk.");
    } catch(err) {
      msg.textContent = `Không copy được SQL bulk: ${err.message}`;
      msg.style.color = "var(--danger)";
    }
  });
  copyCompareBtn?.addEventListener("click", async ()=>{
    try {
      await copyLicenseCompText(compareSql.value, msg, "Đã copy SELECT đối chiếu trước/sau.");
    } catch(err) {
      msg.textContent = `Không copy được SELECT đối chiếu: ${err.message}`;
      msg.style.color = "var(--danger)";
    }
  });
  exportBtn?.addEventListener("click", ()=>{
    if(!compareSql.value){
      msg.textContent = "Chưa có SQL để export.";
      msg.style.color = "var(--danger)";
      return;
    }
    const stamp = new Date().toISOString().replace(/[:.]/g, "-");
    downloadTextFile(`license-compensation-${stamp}.sql`, compareSql.value);
    msg.textContent = "Đã export file .sql để chạy trong PostgreSQL.";
    msg.style.color = "var(--success,#16a34a)";
  });

  renderSql();
}

// ── Customer management ──
function bindCustomerSearch(){
  const input = document.getElementById("custSearchInput");
  const btn = document.getElementById("custSearchBtn");
  const loadAllBtn = document.getElementById("custLoadAllBtn");
  const msg = document.getElementById("custSearchMsg");
  if(!btn || !input) return;

  async function loadAll(){
    if(msg){ msg.textContent="Đang tải toàn bộ khách hàng..."; msg.style.color="var(--muted)"; }
    try {
      const res = await fetchAdmin(`/api/admin/customers?limit=200`);
      if(res.status===401){ redirectToAdminLogin("/api/admin/customers"); return; }
      const data = await res.json().catch(()=>({customers:[]}));
      if(!res.ok){ if(msg){ msg.textContent = data.message||"Lỗi tải danh sách khách hàng"; msg.style.color="var(--danger)"; } return; }
      const customers = data.customers || [];
      if(msg){ msg.textContent = customers.length ? `Đang hiển thị ${customers.length} khách hàng mới nhất` : "Chưa có khách hàng nào"; msg.style.color="var(--muted)"; }
      renderCustomerList(customers);
    } catch(err){
      if(msg){ msg.textContent="Lỗi: "+err.message; msg.style.color="var(--danger)"; }
    }
  }

  async function doSearch(){
    const q = input.value.trim();
    if(!q){
      await loadAll();
      return;
    }
    if(msg){ msg.textContent="\u0110ang t\u00ecm..."; msg.style.color="var(--muted)"; }
    try {
      const res = await fetchAdmin(`/api/admin/customers?q=${encodeURIComponent(q)}&limit=50`);
      if(res.status===401){ redirectToAdminLogin("/api/admin/customers"); return; }
      const data = await res.json().catch(()=>({customers:[]}));
      if(!res.ok){ if(msg){ msg.textContent = data.message||"L\u1ed7i t\u00ecm ki\u1ebfm"; msg.style.color="var(--danger)"; } return; }
      const customers = data.customers || [];
      if(msg){ msg.textContent = customers.length ? `T\u00ecm th\u1ea5y ${customers.length} kh\u00e1ch h\u00e0ng` : "Kh\u00f4ng t\u00ecm th\u1ea5y k\u1ebft qu\u1ea3 n\u00e0o"; msg.style.color="var(--muted)"; }
      renderCustomerList(customers);
    } catch(err){
      if(msg){ msg.textContent="L\u1ed7i: "+err.message; msg.style.color="var(--danger)"; }
    }
  }

  btn.addEventListener("click", doSearch);
  if(loadAllBtn){ loadAllBtn.addEventListener("click", loadAll); }
  input.addEventListener("keydown", (e)=>{ if(e.key==="Enter") doSearch(); });
}

function renderCustomerList(customers){
  const wrap = document.getElementById("custListWrap");
  const detailWrap = document.getElementById("custDetailWrap");
  if(!wrap) return;
  if(detailWrap){ detailWrap.style.display="none"; detailWrap.innerHTML=""; }
  if(!customers.length){ wrap.innerHTML=""; return; }

  wrap.innerHTML = `<table class="data-table"><thead><tr>
    <th>Email</th><th>H\u1ecd t\u00ean</th><th>ID</th><th>Ng\u00e0y t\u1ea1o</th><th style="text-align:center">H\u00e0nh \u0111\u1ed9ng</th>
  </tr></thead><tbody>${customers.map(c=>`<tr>
    <td>${escapeHtml(c.email)}</td>
    <td>${escapeHtml(c.fullName||"\u2014")}</td>
    <td style="font-family:monospace;font-size:.78rem">${escapeHtml(c.id)}</td>
    <td style="font-size:.8rem">${fmtDate(c.createdAt)}</td>
    <td style="text-align:center;white-space:nowrap">
      <button onclick="expandCustomerDetail('${c.id}')" class="btn btn-outline" style="padding:3px 10px;font-size:.78rem;min-height:0">👁 Xem</button>
      <button onclick="openEditCustomerModal('${c.id}','${escapeHtml(c.fullName||'')}')" class="btn btn-outline" style="padding:3px 10px;font-size:.78rem;min-height:0">\u270f\ufe0f S\u1eeda</button>
      <button onclick="openDeleteCustomerModal('${c.id}','${escapeHtml(c.email)}')" class="btn" style="padding:3px 10px;font-size:.78rem;min-height:0;background:#fee2e2;color:#991b1b;border:1px solid #fca5a5">🗑 X\u00f3a</button>
    </td>
  </tr>`).join("")}</tbody></table>`;
}

async function expandCustomerDetail(customerId){
  const wrap = document.getElementById("custDetailWrap");
  if(!wrap) return;
  wrap.style.display = "block";
  wrap.innerHTML = `<div class="info-card"><p style="color:var(--muted)">\u0110ang t\u1ea3i chi ti\u1ebft...</p></div>`;
  try {
    const res = await fetchAdmin(`/api/customers/${customerId}/snapshot`);
    if(!res.ok){ wrap.innerHTML=`<div class="info-card"><p style="color:var(--danger)">L\u1ed7i t\u1ea3i chi ti\u1ebft</p></div>`; return; }
    const snap = await res.json();
    const c = snap.customer || {};
    const orders = snap.orders || [];
    const licenses = snap.licenses || [];

    const licenseByOrderId = new Map(
      licenses
        .filter((item) => item && item.orderId && item.licenseKey)
        .map((item) => [String(item.orderId), String(item.licenseKey)])
    );

    const renderLicenseKeyCell = (order) => {
      const key = licenseByOrderId.get(String(order.id || ""));
      if (!key) {
        return `<span style="color:var(--muted);font-size:.78rem">Chưa phát sinh key</span>`;
      }
      const safeKey = escapeHtml(key);
      return `<div style="display:flex;gap:6px;align-items:center;justify-content:flex-start">
        <code style="font-size:.74rem;background:#f8fafc;border:1px solid #e2e8f0;padding:2px 6px;border-radius:6px">${safeKey}</code>
        <button onclick="navigator.clipboard.writeText('${safeKey}')" class="btn btn-outline" style="padding:1px 6px;font-size:.72rem;min-height:0">Copy</button>
      </div>`;
    };

    const ordersHtml = orders.length
      ? `<table class="data-table" style="font-size:.82rem"><thead><tr><th>M\u00e3 \u0111\u01a1n</th><th>App</th><th>S\u1ea3n ph\u1ea9m</th><th>License key</th><th>S\u1ed1 ti\u1ec1n</th><th>Tr\u1ea1ng th\u00e1i</th><th>Ng\u00e0y t\u1ea1o</th></tr></thead><tbody>
        ${orders.map(o=>`<tr><td style="font-family:monospace">${o.orderCode||o.id.slice(0,8)}</td><td>${o.appId}</td><td style="font-size:.78rem">${o.productId}</td><td>${renderLicenseKeyCell(o)}</td><td>${fmtVnd(o.amount)}</td><td>${badge(o.status)}</td><td>${fmtDate(o.createdAt)}</td></tr>`).join("")}
      </tbody></table>`
      : `<p style="color:var(--muted);font-size:.83rem;padding:8px 0">Ch\u01b0a c\u00f3 \u0111\u01a1n h\u00e0ng</p>`;

    const licensesHtml = licenses.length
      ? `<table class="data-table" style="font-size:.82rem"><thead><tr><th>License key</th><th>App</th><th>G\u00f3i</th><th>Tr\u1ea1ng th\u00e1i</th><th>H\u1ebft h\u1ea1n</th></tr></thead><tbody>
        ${licenses.map(l=>`<tr><td style="font-family:monospace;font-size:.75rem">${l.licenseKey}</td><td>${l.appId}</td><td style="font-size:.78rem">${l.planCode}</td><td>${badge(l.status)}</td><td style="font-size:.8rem">${l.expiresAt ? fmtDate(l.expiresAt) : "\u221e"}</td></tr>`).join("")}
      </tbody></table>`
      : `<p style="color:var(--muted);font-size:.83rem;padding:8px 0">Ch\u01b0a c\u00f3 license</p>`;

    wrap.innerHTML = `<div class="info-card">
      <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:8px">
        <b>\ud83d\udccb Chi ti\u1ebft: ${escapeHtml(c.email||customerId)}</b>
        <button onclick="document.getElementById('custDetailWrap').style.display='none'" class="btn btn-outline" style="padding:3px 10px;font-size:.78rem;min-height:0">\u2715 \u0110\u00f3ng</button>
      </div>
      <p style="font-size:.82rem;color:var(--muted);margin:0 0 10px">ID: ${c.id||customerId} \u00b7 T\u00ean: ${escapeHtml(c.fullName||"\u2014")} \u00b7 Telegram: ${c.telegramUsername||"ch\u01b0a li\u00ean k\u1ebft"}</p>
      <div style="margin-bottom:8px"><b style="font-size:.82rem">\u0110\u01a1n h\u00e0ng (${orders.length})</b>${ordersHtml}</div>
      <div><b style="font-size:.82rem">License (${licenses.length})</b>${licensesHtml}</div>
    </div>`;
  } catch(err){
    wrap.innerHTML = `<div class="info-card"><p style="color:var(--danger)">L\u1ed7i: ${err.message}</p></div>`;
  }
}

let _custModalAction = null;

function openEditCustomerModal(customerId, currentName){
  const modal = document.getElementById("custConfirmModal");
  const title = document.getElementById("custModalTitle");
  const desc = document.getElementById("custModalDesc");
  const nameRow = document.getElementById("custModalNameRow");
  const newNameInput = document.getElementById("custModalNewName");
  const pwInput = document.getElementById("custModalPassword");
  const msg = document.getElementById("custModalMsg");
  if(!modal) return;
  title.textContent = "\u270f\ufe0f S\u1eeda th\u00f4ng tin kh\u00e1ch h\u00e0ng";
  desc.textContent = `S\u1eeda t\u00ean cho kh\u00e1ch h\u00e0ng ID: ${customerId}`;
  nameRow.style.display = "block";
  newNameInput.value = currentName;
  pwInput.value = "";
  if(msg) msg.textContent = "";
  modal.style.display = "flex";
  _custModalAction = async ()=>{
    const fullName = newNameInput.value.trim();
    const confirmPassword = pwInput.value;
    if(!fullName){ if(msg){ msg.textContent="T\u00ean kh\u00f4ng \u0111\u01b0\u1ee3c \u0111\u1ec3 tr\u1ed1ng"; msg.style.color="var(--danger)"; } return false; }
    if(!confirmPassword){ if(msg){ msg.textContent="Vui l\u00f2ng nh\u1eadp m\u1eadt kh\u1ea9u x\u00e1c nh\u1eadn"; msg.style.color="var(--danger)"; } return false; }
    const res = await fetchAdmin(`/api/admin/customers/${customerId}`, {
      method: "PATCH",
      headers: {"Content-Type":"application/json"},
      body: JSON.stringify({ fullName, confirmPassword })
    });
    const data = await res.json().catch(()=>({}));
    if(!res.ok){ if(msg){ msg.textContent = data.message||"C\u1eadp nh\u1eadt th\u1ea5t b\u1ea1i"; msg.style.color="var(--danger)"; } return false; }
    return true;
  };
}

function openDeleteCustomerModal(customerId, email){
  const modal = document.getElementById("custConfirmModal");
  const title = document.getElementById("custModalTitle");
  const desc = document.getElementById("custModalDesc");
  const nameRow = document.getElementById("custModalNameRow");
  const pwInput = document.getElementById("custModalPassword");
  const msg = document.getElementById("custModalMsg");
  if(!modal) return;
  title.textContent = "\ud83d\uddd1 X\u00f3a kh\u00e1ch h\u00e0ng";
  desc.textContent = `X\u00f3a v\u0129nh vi\u1ec5n "${email}"? Ch\u1ec9 x\u00f3a \u0111\u01b0\u1ee3c n\u1ebfu ch\u01b0a c\u00f3 \u0111\u01a1n h\u00e0ng.`;
  nameRow.style.display = "none";
  pwInput.value = "";
  if(msg) msg.textContent = "";
  modal.style.display = "flex";
  _custModalAction = async ()=>{
    const confirmPassword = pwInput.value;
    if(!confirmPassword){ if(msg){ msg.textContent="Vui l\u00f2ng nh\u1eadp m\u1eadt kh\u1ea9u x\u00e1c nh\u1eadn"; msg.style.color="var(--danger)"; } return false; }
    const res = await fetchAdmin(`/api/admin/customers/${customerId}`, {
      method: "DELETE",
      headers: {"Content-Type":"application/json"},
      body: JSON.stringify({ confirmPassword })
    });
    const data = await res.json().catch(()=>({}));
    if(!res.ok){ if(msg){ msg.textContent = data.message||"X\u00f3a th\u1ea5t b\u1ea1i"; msg.style.color="var(--danger)"; } return false; }
    return true;
  };
}

function bindCustomerModal(){
  const modal = document.getElementById("custConfirmModal");
  const cancelBtn = document.getElementById("custModalCancel");
  const confirmBtn = document.getElementById("custModalConfirm");
  const msg = document.getElementById("custModalMsg");
  if(!modal || !cancelBtn || !confirmBtn) return;

  cancelBtn.addEventListener("click", ()=>{ modal.style.display="none"; _custModalAction=null; });

  confirmBtn.addEventListener("click", async ()=>{
    if(!_custModalAction) return;
    confirmBtn.disabled = true;
    confirmBtn.textContent = "\u0110ang x\u1eed l\u00fd...";
    if(msg) msg.textContent = "";
    try {
      const success = await _custModalAction();
      if(success){
        modal.style.display = "none";
        _custModalAction = null;
        document.getElementById("custSearchBtn")?.click();
      }
    } catch(err){
      if(msg){ msg.textContent="L\u1ed7i: "+err.message; msg.style.color="var(--danger)"; }
    } finally {
      confirmBtn.disabled = false;
      confirmBtn.textContent = "X\u00e1c nh\u1eadn";
    }
  });
}

// ── Key lookup ──
function bindKeyLookup(){
  const input = document.getElementById("keyLookupInput");
  const btn = document.getElementById("keyLookupBtn");
  const pasteBtn = document.getElementById("keyLookupPasteBtn");
  const clearBtn = document.getElementById("keyLookupClearBtn");
  const msg = document.getElementById("keyLookupMsg");
  const result = document.getElementById("keyLookupResult");
  if(!btn || !input) return;

  function fmtLeaseRemaining(expiresAt){
    if(!expiresAt){
      return "Chưa có thời điểm hết hạn lease";
    }
    const diffMs = new Date(expiresAt).getTime() - Date.now();
    if(Number.isNaN(diffMs)){
      return fmtDate(expiresAt);
    }
    if(diffMs <= 0){
      return "Đã hết hạn";
    }
    const totalSeconds = Math.ceil(diffMs / 1000);
    if(totalSeconds < 60){
      return `${totalSeconds} giây nữa`;
    }
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;
    return seconds ? `${minutes} phút ${seconds} giây nữa` : `${minutes} phút nữa`;
  }

  function renderLeaseCard(activeLease){
    if(!activeLease){
      return `<div class="admin-note-box">
        <strong>Lease hiện tại</strong>
        <p style="margin:6px 0 0;color:var(--muted)">Key này hiện chưa bị thiết bị nào giữ phiên. Nếu khách vẫn báo lỗi, thường là phiên cũ vừa hết hạn hoặc nhập nhầm key.</p>
      </div>`;
    }

    const typeLabel = activeLease.clientType === "desktop" ? "Desktop" : "Web";
    const statusClass = activeLease.clientType === "desktop" ? "is-desktop" : "is-web";
    return `<div class="admin-lease-card ${statusClass}">
      <div class="admin-lease-head">
        <div>
          <div class="admin-lease-label">Lease hiện tại</div>
          <div class="admin-lease-type">${escapeHtml(typeLabel)}</div>
        </div>
        <span class="admin-pill ${statusClass}">${escapeHtml(typeLabel)}</span>
      </div>
      <div class="admin-lease-grid">
        <div>
          <div class="admin-field-label">Thiết bị / phiên</div>
          <div class="admin-code-text">${escapeHtml(activeLease.clientId || "—")}</div>
        </div>
        <div>
          <div class="admin-field-label">Tên hiển thị</div>
          <div>${escapeHtml(activeLease.clientName || "Không gửi tên thiết bị")}</div>
        </div>
        <div>
          <div class="admin-field-label">Bắt đầu giữ</div>
          <div>${activeLease.acquiredAt ? fmtDate(activeLease.acquiredAt) : "—"}</div>
        </div>
        <div>
          <div class="admin-field-label">Gia hạn lần cuối</div>
          <div>${activeLease.lastSeenAt ? fmtDate(activeLease.lastSeenAt) : "—"}</div>
        </div>
        <div>
          <div class="admin-field-label">Lease hết hạn lúc</div>
          <div>${activeLease.expiresAt ? fmtDate(activeLease.expiresAt) : "—"}</div>
        </div>
        <div>
          <div class="admin-field-label">Còn hiệu lực</div>
          <div>${escapeHtml(fmtLeaseRemaining(activeLease.expiresAt))}</div>
        </div>
      </div>
    </div>`;
  }

  async function doLookup(){
    const key = input.value.trim().toUpperCase();
    if(!key){ if(msg){ msg.textContent="Nhập license key để tra cứu"; msg.style.color="var(--muted)"; } return; }
    if(msg){ msg.textContent="Đang tra..."; msg.style.color="var(--muted)"; }
    if(result) result.innerHTML="";
    try {
      const res = await fetchAdmin(`/api/admin/licenses/lookup?key=${encodeURIComponent(key)}`);
      if(res.status===401){ redirectToAdminLogin("/api/admin/licenses/lookup"); return; }
      const data = await res.json().catch(()=>({}));
      if(res.status===404){ if(msg){ msg.textContent="Không tìm thấy key này trong hệ thống"; msg.style.color="var(--danger)"; } return; }
      if(!res.ok){ if(msg){ msg.textContent=data.message||"Lỗi tra cứu"; msg.style.color="var(--danger)"; } return; }
      if(msg){ msg.textContent="Tìm thấy"; msg.style.color="var(--success,#16a34a)"; }
      const l = data.license || {};
      const activeLease = l.activeLease || null;
      const tier = data.resolvedTier || "—";
      const resolvedFeatures = Array.isArray(data.resolvedFeatures) ? data.resolvedFeatures : [];
      const tierColor = tier==="premium" ? "#7c3aed" : tier==="standard" ? "#2563eb" : "#64748b";
      const meta = l.metadata ? JSON.stringify(l.metadata, null, 2) : "{}";
      result.innerHTML = `<div class="info-card" style="margin-top:8px">
        <div class="admin-result-grid">
          <div class="admin-result-card">
            <div class="admin-card-title">Thông tin key</div>
            <div class="admin-kv-list">
              <div class="admin-kv-row"><span>License key</span><strong class="admin-code-text">${escapeHtml(l.licenseKey||"—")}</strong></div>
              <div class="admin-kv-row"><span>App</span><strong>${escapeHtml(l.appId||"—")}</strong></div>
              <div class="admin-kv-row"><span>Product ID</span><strong class="admin-code-text">${escapeHtml(l.productId||"—")}</strong></div>
              <div class="admin-kv-row"><span>Plan code</span><strong class="admin-code-text">${escapeHtml(l.planCode||"—")}</strong></div>
              <div class="admin-kv-row"><span>Tier</span><strong style="color:${tierColor}">${escapeHtml(tier)}</strong></div>
              <div class="admin-kv-row"><span>Trạng thái</span><strong>${badge(l.status||"—")}</strong></div>
              <div class="admin-kv-row"><span>Hết hạn</span><strong>${l.expiresAt ? fmtDate(l.expiresAt) : "∞ Lifetime"}</strong></div>
              <div class="admin-kv-row"><span>Customer ID</span><strong class="admin-code-text">${escapeHtml(l.customerId||"—")}</strong></div>
              <div class="admin-kv-row"><span>Kích hoạt</span><strong>${l.activatedAt ? fmtDate(l.activatedAt) : "Chưa kích hoạt"}</strong></div>
            </div>
          </div>
          <div class="admin-result-card">
            <div class="admin-card-title">Quyền gửi xuống app</div>
            <div class="admin-note-box" style="margin-bottom:12px">
              <strong>Features</strong>
              <div class="admin-code-text" style="margin-top:6px">${escapeHtml(resolvedFeatures.join(", ") || "—")}</div>
            </div>
            ${renderLeaseCard(activeLease)}
          </div>
        </div>
        <div class="admin-note-box" style="margin-top:12px">
          <strong>Metadata</strong>
          <pre style="font-size:.73rem;white-space:pre-wrap;margin:8px 0 0">${escapeHtml(meta)}</pre>
        </div>
        ${l.status !== "revoked" && l.id ? `<div style="margin-top:10px"><button id="keyRevokeBtn" class="btn" style="background:#dc2626;color:#fff;font-size:.83rem;padding:6px 14px">🔒 Vô hiệu hóa key này</button></div>` : `<div style="margin-top:8px;font-size:.82rem;color:#dc2626;font-weight:600">⛔ Key này đã bị vô hiệu hóa</div>`}
      </div>`;
      if (l.status !== "revoked" && l.id) {
        document.getElementById("keyRevokeBtn")?.addEventListener("click", async () => {
          if (!confirm(`Xác nhận vô hiệu hóa key:\n${l.licenseKey || l.id}?\n\nKey sẽ không thể dùng được nữa.`)) return;
          try {
            const rRes = await fetchAdmin(`/api/admin/licenses/${encodeURIComponent(l.id)}/revoke`, { method: "POST" });
            const rData = await rRes.json().catch(() => ({}));
            if (!rRes.ok) { if(msg){ msg.textContent = rData.message || "Lỗi vô hiệu hóa"; msg.style.color = "var(--danger)"; } return; }
            if(msg){ msg.textContent = "✅ Đã vô hiệu hóa key thành công"; msg.style.color = "var(--success,#16a34a)"; }
            document.getElementById("keyRevokeBtn")?.remove();
            const statusCells = result.querySelectorAll("td");
            statusCells.forEach(td => { if(td.previousElementSibling?.textContent?.trim() === "Trạng thái") td.innerHTML = badge("revoked"); });
          } catch(err) {
            if(msg){ msg.textContent = "Lỗi: " + err.message; msg.style.color = "var(--danger)"; }
          }
        });
      }
    } catch(err){
      if(msg){ msg.textContent="Lỗi: "+err.message; msg.style.color="var(--danger)"; }
    }
  }

  btn.addEventListener("click", doLookup);
  input.addEventListener("keydown", (e)=>{ if(e.key==="Enter") doLookup(); });

  pasteBtn?.addEventListener("click", async ()=>{
    if(!navigator.clipboard?.readText){
      if(msg){ msg.textContent = "Trình duyệt hiện tại không hỗ trợ đọc clipboard tự động"; msg.style.color = "var(--danger)"; }
      return;
    }
    try {
      const text = String(await navigator.clipboard.readText() || "").trim().toUpperCase();
      if(!text){
        if(msg){ msg.textContent = "Clipboard đang trống"; msg.style.color = "var(--muted)"; }
        return;
      }
      input.value = text;
      input.focus();
      if(msg){ msg.textContent = "Da dan key tu clipboard"; msg.style.color = "var(--success,#16a34a)"; }
    } catch(err){
      if(msg){ msg.textContent = "Khong doc duoc clipboard: " + err.message; msg.style.color = "var(--danger)"; }
    }
  });

  clearBtn?.addEventListener("click", ()=>{
    input.value = "";
    if(result) result.innerHTML = "";
    if(msg){ msg.textContent = "Da xoa ket qua tra key"; msg.style.color = "var(--muted)"; }
    input.focus();
  });
}

function bindDiscountCodeAdmin(){
  const form = document.getElementById("discountCodeForm");
  const msg = document.getElementById("discountCodeMsg");
  const wrap = document.getElementById("discountCodesWrap");
  const refreshBtn = document.getElementById("discountRefreshBtn");
  const codeInput = document.getElementById("discountCodeValue");
  const percentInput = document.getElementById("discountPercentOff");
  const startsInput = document.getElementById("discountStartsAt");
  const endsInput = document.getElementById("discountEndsAt");
  const noteInput = document.getElementById("discountNote");
  if(!form || !msg || !wrap || !codeInput || !percentInput || !startsInput || !endsInput || !noteInput) return;

  function seedDefaultWindow(){
    if(!startsInput.value){
      startsInput.value = toDatetimeLocalValue(new Date());
    }
    if(!endsInput.value){
      const end = new Date();
      end.setDate(end.getDate() + 7);
      endsInput.value = toDatetimeLocalValue(end);
    }
  }

  async function loadDiscountCodes(){
    wrap.innerHTML = `<p style="padding:12px;color:var(--muted)">Đang tải mã giảm giá...</p>`;
    try {
      const res = await fetchAdmin("/api/admin/discount-codes?limit=200");
      if(res.status===401){ redirectToAdminLogin("/api/admin/discount-codes"); return; }
      const data = await res.json().catch(()=>({ discountCodes: [] }));
      if(!res.ok){
        wrap.innerHTML = `<p style="padding:12px;color:var(--danger)">${escapeHtml(data.message || "Không tải được mã giảm giá")}</p>`;
        return;
      }

      const rows = Array.isArray(data.discountCodes) ? data.discountCodes : [];
      if(!rows.length){
        wrap.innerHTML = `<p style="padding:12px;color:var(--muted)">Chưa có mã giảm giá nào.</p>`;
        return;
      }

      wrap.innerHTML = `<table class="data-table"><thead><tr>
        <th>Mã</th><th>% giảm</th><th>Thời gian áp dụng</th><th>Trạng thái</th><th>Đơn giữ/dùng</th><th>Ghi chú</th><th>Hành động</th>
      </tr></thead><tbody>${rows.map((item)=>{
        const statusBadge = item.active
          ? `<span class="status-badge status-active">active</span>`
          : `<span class="status-badge" style="background:#fee2e2;color:#991b1b">inactive</span>`;
        const usageText = item.usageStatus === "used"
          ? `Đã dùng: ${escapeHtml(item.usedOrderCode || item.usedOrderId || "—")}`
          : (item.usageStatus === "reserved"
            ? `Đang giữ: ${escapeHtml(item.reservedOrderCode || item.reservedOrderId || "—")}`
            : "Sẵn sàng");
        return `<tr>
          <td style="font-family:monospace;font-weight:700">${escapeHtml(item.code)}</td>
          <td>${Number(item.percentOff || 0)}%</td>
          <td style="font-size:.82rem">${fmtDate(item.startsAt)}<br />→ ${fmtDate(item.endsAt)}</td>
          <td>${statusBadge}<div style="font-size:.78rem;color:var(--muted);margin-top:4px">${escapeHtml(item.usageStatus || "available")}</div></td>
          <td style="font-size:.82rem">${usageText}</td>
          <td style="font-size:.82rem">${escapeHtml(item.note || "—")}</td>
          <td><button class="btn btn-outline discount-toggle-btn" data-id="${item.id}" data-active="${item.active ? "1" : "0"}" style="min-height:32px;font-size:.8rem;padding:0 10px">${item.active ? "Tắt mã" : "Bật mã"}</button></td>
        </tr>`;
      }).join("")}</tbody></table>`;

      wrap.querySelectorAll(".discount-toggle-btn").forEach((button)=>{
        button.addEventListener("click", async ()=>{
          const nextActive = button.dataset.active !== "1";
          button.disabled = true;
          const original = button.textContent;
          button.textContent = "Đang lưu...";
          try {
            const res = await fetchAdmin(`/api/admin/discount-codes/${encodeURIComponent(button.dataset.id)}/toggle`, {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ active: nextActive })
            });
            const payload = await res.json().catch(()=>({}));
            if(!res.ok){
              msg.textContent = payload.message || "Không cập nhật được mã giảm giá";
              msg.style.color = "var(--danger)";
              return;
            }
            msg.textContent = `Đã ${nextActive ? "bật" : "tắt"} mã ${payload.discountCode?.code || ""}.`;
            msg.style.color = "var(--success,#16a34a)";
            await loadDiscountCodes();
          } catch(err) {
            msg.textContent = "Lỗi kết nối: " + err.message;
            msg.style.color = "var(--danger)";
          } finally {
            button.disabled = false;
            button.textContent = original;
          }
        });
      });
    } catch(err) {
      wrap.innerHTML = `<p style="padding:12px;color:var(--danger)">Lỗi tải mã giảm giá: ${escapeHtml(err.message)}</p>`;
    }
  }

  seedDefaultWindow();
  refreshBtn?.addEventListener("click", loadDiscountCodes);
  codeInput.addEventListener("input", ()=>{
    codeInput.value = codeInput.value.toUpperCase().replace(/[^A-Z0-9_-]/g, "");
  });

  form.addEventListener("submit", async (e)=>{
    e.preventDefault();
    const code = codeInput.value.trim().toUpperCase();
    const percentOff = Number.parseInt(percentInput.value, 10);
    const startsAt = startsInput.value;
    const endsAt = endsInput.value;
    const note = noteInput.value.trim();

    msg.textContent = "Đang tạo mã giảm giá...";
    msg.style.color = "var(--muted)";

    try {
      const res = await fetchAdmin("/api/admin/discount-codes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code, percentOff, startsAt, endsAt, note })
      });
      const payload = await res.json().catch(()=>({}));
      if(!res.ok){
        msg.textContent = payload.message || "Không tạo được mã giảm giá";
        msg.style.color = "var(--danger)";
        return;
      }

      codeInput.value = "";
      percentInput.value = "";
      noteInput.value = "";
      startsInput.value = "";
      endsInput.value = "";
      seedDefaultWindow();
      msg.textContent = `Đã tạo mã ${payload.discountCode?.code || code}.`;
      msg.style.color = "var(--success,#16a34a)";
      await loadDiscountCodes();
    } catch(err) {
      msg.textContent = "Lỗi kết nối: " + err.message;
      msg.style.color = "var(--danger)";
    }
  });

  loadDiscountCodes();
}

function bindAdminSidebarNav(){
  const links = Array.from(document.querySelectorAll('.admin-sidebar a[href^="#section-"]'));
  if(!links.length) return;

  const setActive = (hash)=>{
    links.forEach((link)=>{
      link.classList.toggle("active", link.getAttribute("href") === hash);
    });
  };

  links.forEach((link)=>{
    link.addEventListener("click", ()=> setActive(link.getAttribute("href")));
  });

  const sections = links
    .map((link)=>document.querySelector(link.getAttribute("href")))
    .filter(Boolean);

  if(sections.length){
    const observer = new IntersectionObserver((entries)=>{
      const visible = entries
        .filter((entry)=>entry.isIntersecting)
        .sort((left, right)=> right.intersectionRatio - left.intersectionRatio || left.boundingClientRect.top - right.boundingClientRect.top)[0];
      if(visible?.target?.id){
        setActive(`#${visible.target.id}`);
      }
    }, {
      rootMargin: "-14% 0px -60% 0px",
      threshold: [0.15, 0.3, 0.5, 0.75]
    });
    sections.forEach((section)=>observer.observe(section));
  }

  if(window.location.hash){
    setActive(window.location.hash);
  }
}

// Customer lookup
document.getElementById("lookupBtn")?.addEventListener("click",()=>{
  // replaced by customer search section
});

bindCreateAdminForm();
bindChangeMyAdminPasswordForm();
bindSepayForm();
bindAiAppSecretControls();
bindAiGateControls();
bindManualGrant();
bindLicenseCompensationTool();
loadManualGrantCatalog();
bindCustomerSearch();
bindCustomerModal();
bindKeyLookup();
bindAdminSidebarNav();
bindProductCardManager();
bindProductKeyManager();
bindDiscountCodeAdmin();
Promise.all([loadMe(), loadAdmin()]).finally(()=>{
  loadAdminUsers();
  loadSepayConfig();
  loadAiAppSecretStatus();
});

function bindProductKeyManager() {
  const summaryWrap = document.getElementById("pkSummaryWrap");
  const refreshBtn = document.getElementById("pkRefreshSummaryBtn");
  const importProductSel = document.getElementById("pkImportProduct");
  const importBtn = document.getElementById("pkImportBtn");
  const importKeysTA = document.getElementById("pkImportKeys");
  const importMsg = document.getElementById("pkImportMsg");
  const detailProductSel = document.getElementById("pkDetailProduct");
  const detailStatusSel = document.getElementById("pkDetailStatus");
  const detailLoadBtn = document.getElementById("pkDetailLoadBtn");
  const detailMsg = document.getElementById("pkDetailMsg");
  const detailWrap = document.getElementById("pkDetailWrap");
  if (!summaryWrap) return;

  async function loadSummary() {
    summaryWrap.innerHTML = `<p style="padding:8px;color:var(--muted);font-size:.85rem">Đang tải...</p>`;
    try {
      const res = await fetchAdmin("/api/admin/product-keys/summary");
      if (res.status === 401) { redirectToAdminLogin("/api/admin/product-keys/summary"); return; }
      const data = await res.json().catch(() => ({ summary: [] }));
      if (!res.ok) { summaryWrap.innerHTML = `<p style="color:var(--danger);padding:8px">${escapeHtml(data.message||"Lỗi tải summary")}</p>`; return; }
      const rows = data.summary || [];
      if (!rows.length) { summaryWrap.innerHTML = `<p style="color:var(--muted);padding:8px;font-size:.85rem">Chưa có sản phẩm nào</p>`; return; }
      summaryWrap.innerHTML = `<table class="data-table" style="font-size:.85rem">
        <thead><tr><th>App</th><th>Sản phẩm</th><th style="text-align:center;color:#16a34a">Còn lại</th><th style="text-align:center">Đã giao</th><th style="text-align:center">Tổng</th></tr></thead>
        <tbody>${rows.map(r=>`<tr>
          <td style="font-size:.78rem;color:var(--muted)">${escapeHtml(r.appId)}</td>
          <td>${escapeHtml(r.productName)}<br><span style="font-family:monospace;font-size:.72rem;color:var(--muted)">${escapeHtml(r.productId)}</span></td>
          <td style="text-align:center;font-weight:700;color:${r.available>0?"#16a34a":"#dc2626"}">${r.available}</td>
          <td style="text-align:center">${r.delivered}</td>
          <td style="text-align:center">${r.total}</td>
        </tr>`).join("")}</tbody>
      </table>`;
      const opts = rows.map(r=>`<option value="${escapeHtml(r.productId)}">${escapeHtml(r.productName)} (${r.available} còn lại)</option>`).join("");
      if (importProductSel) importProductSel.innerHTML = `<option value="">-- Chọn sản phẩm --</option>${opts}`;
      if (detailProductSel) detailProductSel.innerHTML = `<option value="">-- Chọn sản phẩm --</option>${opts}`;
    } catch(err) {
      summaryWrap.innerHTML = `<p style="color:var(--danger);padding:8px">Lỗi: ${escapeHtml(err.message)}</p>`;
    }
  }

  if (refreshBtn) refreshBtn.addEventListener("click", loadSummary);
  loadSummary();

  if (importBtn) importBtn.addEventListener("click", async () => {
    const productId = importProductSel?.value?.trim();
    const raw = importKeysTA?.value?.trim();
    if (!productId) { if(importMsg){importMsg.textContent="Chọn sản phẩm trước";importMsg.style.color="var(--danger)";} return; }
    if (!raw) { if(importMsg){importMsg.textContent="Nhập danh sách key";importMsg.style.color="var(--danger)";} return; }
    importBtn.disabled = true;
    importBtn.textContent = "Đang import...";
    if (importMsg) importMsg.textContent = "";
    try {
      const res = await fetchAdmin("/api/admin/product-keys/import", {
        method: "POST",
        headers: {"Content-Type":"application/json"},
        body: JSON.stringify({ productId, keys: raw })
      });
      const data = await res.json().catch(()=>({}));
      if (!res.ok) { if(importMsg){importMsg.textContent=data.message||"Import thất bại";importMsg.style.color="var(--danger)";} return; }
      if (importMsg) { importMsg.textContent=`✅ Đã thêm ${data.inserted} key mới, bỏ qua ${data.skipped} key trùng`; importMsg.style.color="var(--success,#16a34a)"; }
      if (importKeysTA) importKeysTA.value = "";
      loadSummary();
    } catch(err) {
      if (importMsg) { importMsg.textContent="Lỗi: "+err.message; importMsg.style.color="var(--danger)"; }
    } finally {
      importBtn.disabled = false;
      importBtn.textContent = "Import";
    }
  });

  async function loadDetailKeys() {
    const productId = detailProductSel?.value?.trim();
    const status = detailStatusSel?.value?.trim() || null;
    if (!productId) { if(detailMsg){detailMsg.textContent="Chọn sản phẩm để xem";detailMsg.style.color="var(--muted)";} return; }
    if (detailMsg) { detailMsg.textContent="Đang tải..."; detailMsg.style.color="var(--muted)"; }
    if (detailWrap) detailWrap.innerHTML = "";
    try {
      const qs = new URLSearchParams({ productId, limit: "200" });
      if (status) qs.set("status", status);
      const res = await fetchAdmin(`/api/admin/product-keys?${qs}`);
      const data = await res.json().catch(()=>({keys:[]}));
      if (!res.ok) { if(detailMsg){detailMsg.textContent=data.message||"Lỗi tải key";detailMsg.style.color="var(--danger)";} return; }
      const keys = data.keys || [];
      if (detailMsg) detailMsg.textContent = `${keys.length} key${keys.length>=200?" (hiển thị tối đa 200)":""}`;
      if (!keys.length) { if(detailWrap) detailWrap.innerHTML=`<p style="color:var(--muted);font-size:.85rem;padding:8px 0">Không có key nào</p>`; return; }
      if (detailWrap) detailWrap.innerHTML = `<table class="data-table" style="font-size:.83rem">
        <thead><tr><th>Key value</th><th style="text-align:center">Trạng thái</th><th>Ngày tạo</th><th style="text-align:center">Hành động</th></tr></thead>
        <tbody>${keys.map(k=>`<tr id="pkrow-${escapeHtml(k.id)}">
          <td style="font-family:monospace;font-size:.8rem">${escapeHtml(k.keyValue)}</td>
          <td style="text-align:center">${k.status==="available"
            ?`<span class="status-badge status-active">available</span>`
            :`<span class="status-badge">${escapeHtml(k.status)}</span>`}</td>
          <td style="font-size:.78rem">${fmtDate(k.createdAt)}</td>
          <td style="text-align:center">${k.status==="available"
            ?`<button onclick="pkDeleteKey('${escapeHtml(k.id)}','${escapeHtml(k.keyValue)}')" class="btn" style="padding:2px 10px;font-size:.75rem;min-height:0;background:#fee2e2;color:#991b1b;border:1px solid #fca5a5">🗑 Xóa</button>`
            :`<span style="color:var(--muted);font-size:.75rem">—</span>`}</td>
        </tr>`).join("")}</tbody>
      </table>`;
    } catch(err) {
      if (detailMsg) { detailMsg.textContent="Lỗi: "+err.message; detailMsg.style.color="var(--danger)"; }
    }
  }

  if (detailLoadBtn) detailLoadBtn.addEventListener("click", loadDetailKeys);
}

async function pkDeleteKey(keyId, keyValue) {
  if (!confirm(`Xác nhận xóa key:\n${keyValue}\n\nChỉ xóa được key chưa giao cho khách.`)) return;
  try {
    const res = await fetchAdmin(`/api/admin/product-keys/${encodeURIComponent(keyId)}`, { method: "DELETE" });
    const data = await res.json().catch(()=>({}));
    if (!res.ok) { alert(data.message||"Xóa thất bại"); return; }
    const row = document.getElementById(`pkrow-${keyId}`);
    if (row) row.remove();
  } catch(err) {
    alert("Lỗi: "+err.message);
  }
}

function bindProductCardManager() {
  const wrap = document.getElementById("productCardWrap");
  const msg = document.getElementById("productCardMsg");
  const refreshBtn = document.getElementById("productCardRefreshBtn");
  if (!wrap) return;

  async function loadCards() {
    wrap.innerHTML = `<p style="padding:16px;color:var(--muted)">Đang tải danh sách sản phẩm...</p>`;
    if(msg){ msg.textContent = ""; }
    try {
      const res = await fetchAdmin("/api/admin/catalog");
      if(res.status === 401){ redirectToAdminLogin("/api/admin/catalog"); return; }
      const data = await res.json().catch(()=>({ products: [] }));
      if(!res.ok){
        wrap.innerHTML = `<p style="padding:16px;color:var(--danger)">${escapeHtml(data.message || "Không tải được catalog admin")}</p>`;
        return;
      }

      const products = Array.isArray(data.products) ? data.products.slice() : [];
      if(!products.length){
        wrap.innerHTML = `<p style="padding:16px;color:var(--muted)">Chưa có sản phẩm nào.</p>`;
        return;
      }

      products.sort((left, right) => {
        const appCompare = String(left.appId || "").localeCompare(String(right.appId || ""), "vi");
        if(appCompare !== 0) return appCompare;
        return String(left.name || "").localeCompare(String(right.name || ""), "vi");
      });

      wrap.innerHTML = `<table class="data-table admin-product-card-table"><thead><tr>
        <th>App / sản phẩm</th>
        <th>Hiển thị</th>
        <th>Trạng thái card</th>
        <th>Ghi chú ngoài web</th>
        <th>Lưu</th>
      </tr></thead><tbody>${products.map((product) => {
        const normalizedStatus = normalizeProductSaleStatus(product.saleStatus);
        const meta = productSaleStatusMeta(normalizedStatus);
        return `<tr data-product-id="${escapeHtml(product.id)}">
          <td>
            <strong>${escapeHtml(product.name || product.id)}</strong>
            <div class="admin-product-card-subline">${escapeHtml(product.appId || "")} · ${escapeHtml(product.id || "")} · ${escapeHtml(product.cycle || "")}</div>
          </td>
          <td>
            <div class="admin-inline-actions">
              <span class="status-badge ${product.active === false ? "" : "status-active"}">${product.active === false ? "inactive" : "active"}</span>
              <span class="status-badge ${product.visibility === "hidden" ? "" : "status-active"}">${escapeHtml(product.visibility || "public")}</span>
            </div>
          </td>
          <td>
            <select class="admin-input product-card-status">
              <option value="live" ${normalizedStatus === "live" ? "selected" : ""}>Đang bán</option>
              <option value="locked" ${normalizedStatus === "locked" ? "selected" : ""}>Tạm khóa</option>
              <option value="coming_soon" ${normalizedStatus === "coming_soon" ? "selected" : ""}>Coming soon</option>
            </select>
            <div class="admin-product-state-preview">
              <span class="admin-product-state-chip ${meta.badgeClass}">${meta.label}</span>
              <span>${meta.hint}</span>
            </div>
          </td>
          <td>
            <input class="admin-input product-card-note" maxlength="280" placeholder="VD: Tạm khóa để cập nhật bản cài / Mở bán ngày 15-05" value="${escapeHtml(product.saleNote || "")}" />
          </td>
          <td>
            <button class="btn btn-accent product-card-save" style="min-height:38px">Lưu</button>
          </td>
        </tr>`;
      }).join("")}</tbody></table>`;

      wrap.querySelectorAll(".product-card-status").forEach((select) => {
        select.addEventListener("change", () => {
          const row = select.closest("tr");
          const preview = row?.querySelector(".admin-product-state-preview");
          const meta = productSaleStatusMeta(select.value);
          if(preview){
            preview.innerHTML = `<span class="admin-product-state-chip ${meta.badgeClass}">${meta.label}</span><span>${meta.hint}</span>`;
          }
        });
      });

      wrap.querySelectorAll(".product-card-save").forEach((button) => {
        button.addEventListener("click", async () => {
          const row = button.closest("tr[data-product-id]");
          const productId = row?.dataset.productId;
          const statusEl = row?.querySelector(".product-card-status");
          const noteEl = row?.querySelector(".product-card-note");
          if(!productId || !statusEl || !noteEl) return;

          button.disabled = true;
          button.textContent = "Đang lưu...";
          if(msg){ msg.textContent = ""; }
          try {
            const res = await fetchAdmin(`/api/admin/catalog/products/${encodeURIComponent(productId)}/card-control`, {
              method: "PATCH",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                saleStatus: statusEl.value,
                saleNote: noteEl.value
              })
            });
            if(res.status === 401){ redirectToAdminLogin(`/api/admin/catalog/products/${encodeURIComponent(productId)}/card-control`); return; }
            const data = await res.json().catch(()=>({}));
            if(!res.ok){
              if(msg){ msg.textContent = data.message || "Lưu trạng thái card thất bại"; msg.style.color = "var(--danger)"; }
              return;
            }
            if(msg){ msg.textContent = `Đã cập nhật trạng thái card cho ${data.product?.name || productId}`; msg.style.color = "var(--success)"; }
            const meta = productSaleStatusMeta(data.product?.saleStatus);
            const preview = row.querySelector(".admin-product-state-preview");
            if(preview){
              preview.innerHTML = `<span class="admin-product-state-chip ${meta.badgeClass}">${meta.label}</span><span>${meta.hint}</span>`;
            }
            noteEl.value = data.product?.saleNote || "";
          } catch(err) {
            if(msg){ msg.textContent = `Lỗi lưu trạng thái: ${err.message}`; msg.style.color = "var(--danger)"; }
          } finally {
            button.disabled = false;
            button.textContent = "Lưu";
          }
        });
      });
    } catch (err) {
      wrap.innerHTML = `<p style="padding:16px;color:var(--danger)">Lỗi tải danh sách sản phẩm: ${escapeHtml(err.message)}</p>`;
    }
  }

  refreshBtn?.addEventListener("click", loadCards);
  loadCards();
}