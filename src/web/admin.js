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
    renderAiAppKeyManager(data.profiles || {});
  } catch(err){
    msg.textContent = "Lỗi tải trạng thái AI-app secret: " + err.message;
    msg.style.color = "var(--danger)";
  }
}

function renderAiAppKeyManager(profiles){
  const wrap = document.getElementById("aiAppKeyManagerWrap");
  if(!wrap) return;

  const profileOrder = ["shared", "web", "desktop"];
  const rows = profileOrder.map((profile)=>{
    const info = profiles?.[profile] || {};
    const configured = Boolean(info.configured);
    const source = info.source || "none";
    const keyLength = Number(info.keyLength || 0);
    return `<tr>
      <td><b>${profile}</b></td>
      <td>${configured ? (info.maskedKey || "********") : "Chưa cấu hình"}</td>
      <td>${configured ? keyLength : 0}</td>
      <td>${source}</td>
      <td>${configured ? '<span class="status-badge status-active">active</span>' : '<span class="status-badge" style="background:#fee2e2;color:#991b1b">missing</span>'}</td>
    </tr>`;
  }).join("");

  wrap.innerHTML = `<table class="data-table"><thead><tr>
    <th>Profile</th><th>Masked key</th><th>Độ dài</th><th>Nguồn</th><th>Trạng thái</th>
  </tr></thead><tbody>${rows}</tbody></table>`;
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

// Sidebar nav highlight
document.querySelectorAll(".admin-sidebar a").forEach(a=>{
  a.addEventListener("click", ()=>{
    document.querySelectorAll(".admin-sidebar a").forEach(x=>x.classList.remove("active"));
    a.classList.add("active");
  });
});

// Customer lookup
document.getElementById("lookupBtn").addEventListener("click",()=>{
  const cid = document.getElementById("lookupCustId").value;
  if(cid) window.open("/portal","_blank");
});

bindCreateAdminForm();
bindChangeMyAdminPasswordForm();
bindSepayForm();
bindAiAppSecretControls();
bindAiGateControls();
Promise.all([loadMe(), loadAdmin()]).finally(()=>{
  loadAdminUsers();
  loadSepayConfig();
  loadAiAppSecretStatus();
});