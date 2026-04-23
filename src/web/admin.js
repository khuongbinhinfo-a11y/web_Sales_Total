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
      ? "Đã lưu secret, bỏ trống nếu không đổi"
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
        ? "API key: đã lưu"
        : "API key: chưa cấu hình";
      msg.textContent = `${data.message || "Đã lưu cấu hình Sepay"} (${keyStatusText})`;
      msg.style.color = "var(--success)";
      if(data.webhookUrl){
        document.getElementById("sepayWebhookUrl").value = data.webhookUrl;
      }
      sepaySecretConfigured = Boolean(data.secretConfigured);
      document.getElementById("sepaySecret").value = "";
      document.getElementById("sepaySecret").placeholder = sepaySecretConfigured
        ? "Đã lưu secret, bỏ trống nếu không đổi"
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
    const res = await fetchAdmin("/api/catalog");
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
          `<div style="margin-bottom:6px"><b>License Key:</b> <code style="background:#dcfce7;padding:2px 8px;border-radius:4px;font-size:.9rem">${data.licenseKey||""}</code>`,
          ` <button onclick="navigator.clipboard.writeText('${data.licenseKey||""}')"
              style="padding:2px 8px;font-size:.75rem;border:1px solid #86efac;border-radius:4px;background:#fff;cursor:pointer">Copy</button></div>`,
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

// ── Customer management ──
function bindCustomerSearch(){
  const input = document.getElementById("custSearchInput");
  const btn = document.getElementById("custSearchBtn");
  const msg = document.getElementById("custSearchMsg");
  if(!btn || !input) return;

  async function doSearch(){
    const q = input.value.trim();
    if(!q){ if(msg){ msg.textContent="Nh\u1eadp email ho\u1eb7c t\u00ean \u0111\u1ec3 t\u00ecm ki\u1ebfm"; msg.style.color="var(--muted)"; } return; }
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

    const ordersHtml = orders.length
      ? `<table class="data-table" style="font-size:.82rem"><thead><tr><th>M\u00e3 \u0111\u01a1n</th><th>App</th><th>S\u1ea3n ph\u1ea9m</th><th>S\u1ed1 ti\u1ec1n</th><th>Tr\u1ea1ng th\u00e1i</th><th>Ng\u00e0y t\u1ea1o</th></tr></thead><tbody>
        ${orders.map(o=>`<tr><td style="font-family:monospace">${o.orderCode||o.id.slice(0,8)}</td><td>${o.appId}</td><td style="font-size:.78rem">${o.productId}</td><td>${fmtVnd(o.amount)}</td><td>${badge(o.status)}</td><td>${fmtDate(o.createdAt)}</td></tr>`).join("")}
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
  const msg = document.getElementById("keyLookupMsg");
  const result = document.getElementById("keyLookupResult");
  if(!btn || !input) return;

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
      const tier = data.resolvedTier || "—";
      const tierColor = tier==="premium" ? "#7c3aed" : tier==="standard" ? "#2563eb" : "#64748b";
      const meta = l.metadata ? JSON.stringify(l.metadata, null, 2) : "{}";
      result.innerHTML = `<div class="info-card" style="margin-top:8px">
        <table class="data-table" style="font-size:.84rem">
          <tbody>
            <tr><th style="width:140px;text-align:left">License key</th><td style="font-family:monospace">${escapeHtml(l.licenseKey||"—")}</td></tr>
            <tr><th style="text-align:left">App</th><td>${escapeHtml(l.appId||"—")}</td></tr>
            <tr><th style="text-align:left">Product ID</th><td style="font-family:monospace;font-size:.78rem">${escapeHtml(l.productId||"—")}</td></tr>
            <tr><th style="text-align:left">Plan code</th><td style="font-family:monospace;font-size:.78rem">${escapeHtml(l.planCode||"—")}</td></tr>
            <tr><th style="text-align:left">Tier</th><td><span style="font-weight:700;color:${tierColor}">${escapeHtml(tier)}</span></td></tr>
            <tr><th style="text-align:left">Trạng thái</th><td>${badge(l.status||"—")}</td></tr>
            <tr><th style="text-align:left">Hết hạn</th><td>${l.expiresAt ? fmtDate(l.expiresAt) : "∞ Lifetime"}</td></tr>
            <tr><th style="text-align:left">Customer ID</th><td style="font-family:monospace;font-size:.75rem">${escapeHtml(l.customerId||"—")}</td></tr>
            <tr><th style="text-align:left">Kích hoạt</th><td>${l.activatedAt ? fmtDate(l.activatedAt) : "Chưa kích hoạt"}</td></tr>
            <tr><th style="text-align:left;vertical-align:top">Metadata</th><td><pre style="font-size:.73rem;white-space:pre-wrap;margin:0">${escapeHtml(meta)}</pre></td></tr>
          </tbody>
        </table>
      </div>`;
    } catch(err){
      if(msg){ msg.textContent="Lỗi: "+err.message; msg.style.color="var(--danger)"; }
    }
  }

  btn.addEventListener("click", doLookup);
  input.addEventListener("keydown", (e)=>{ if(e.key==="Enter") doLookup(); });
}

// Sidebar nav highlight
document.querySelectorAll(".admin-sidebar a").forEach(a=>{
  a.addEventListener("click", ()=>{
    document.querySelectorAll(".admin-sidebar a").forEach(x=>x.classList.remove("active"));
    a.classList.add("active");
  });
});

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
loadManualGrantCatalog();
bindCustomerSearch();
bindCustomerModal();
bindKeyLookup();
Promise.all([loadMe(), loadAdmin()]).finally(()=>{
  loadAdminUsers();
  loadSepayConfig();
  loadAiAppSecretStatus();
});