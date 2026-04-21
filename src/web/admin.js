/* ═══ admin.js — admin dashboard ═══ */

function fmtVnd(v){ return new Intl.NumberFormat("vi-VN",{style:"currency",currency:"VND"}).format(v); }
function fmtDate(d){ if(!d) return "—"; return new Date(d).toLocaleDateString("vi-VN",{day:"2-digit",month:"2-digit",year:"numeric",hour:"2-digit",minute:"2-digit"}); }
function badge(s){
  const m={paid:"status-paid",pending:"status-pending",active:"status-active"};
  return `<span class="status-badge ${m[s]||""}">${s}</span>`;
}
let meAdmin = null;

async function loadAdmin(){
  try {
    const res = await fetch("/api/admin/dashboard");
    if(res.status===401){ window.location.href="/admin/login"; return; }
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
      <td style="font-family:monospace;font-size:.78rem">${o.id.slice(0,8)}…</td>
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
    const res = await fetch("/api/admin/me");
    if(!res.ok){ return; }
    const d = await res.json();
    meAdmin = d.admin || null;
  } catch {}
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
    const res = await fetch("/api/admin/admin-users");
    if(res.status===401){ window.location.href="/admin/login"; return; }
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
      return `<tr data-admin-id="${a.id}">
        <td>${a.username}</td>
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
        const res = await fetch(`/api/admin/admin-users/${adminId}`,{
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
      const res = await fetch("/api/admin/admin-users",{
        method:"POST",
        headers:{"Content-Type":"application/json"},
        body:JSON.stringify({ username, email, password, role })
      });
      const p = await res.json().catch(()=>({}));
      if(!res.ok){
        msg.textContent = p.message || "Không tạo được sub-admin";
        msg.style.color = "var(--danger)";
        return;
      }

      form.reset();
      document.getElementById("newAdminRole").value = "support";
      msg.textContent = `Đã tạo sub-admin: ${p.admin?.username || username}`;
      msg.style.color = "var(--success)";
      await loadAdminUsers();
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
    const res = await fetch("/api/admin/integrations/sepay");
    if(res.status===401){ window.location.href = "/admin/login"; return; }
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
    document.getElementById("sepaySecret").value = "";
    document.getElementById("sepayBankCode").value = data.sepay?.bankCode || "";
    document.getElementById("sepayAccount").value = data.sepay?.bankAccountNumber || "";
    document.getElementById("sepayAccountName").value = data.sepay?.accountName || "";
    document.getElementById("sepayQrTemplate").value = data.sepay?.qrTemplateUrl || "";
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
      webhookSecret: document.getElementById("sepaySecret").value.trim(),
      bankCode: document.getElementById("sepayBankCode").value.trim(),
      bankAccountNumber: document.getElementById("sepayAccount").value.trim(),
      accountName: document.getElementById("sepayAccountName").value.trim(),
      qrTemplateUrl: document.getElementById("sepayQrTemplate").value.trim()
    };

    try {
      const res = await fetch("/api/admin/integrations/sepay", {
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
      msg.textContent = data.message || "Đã lưu cấu hình Sepay";
      msg.style.color = "var(--success)";
      if(data.webhookUrl){
        document.getElementById("sepayWebhookUrl").value = data.webhookUrl;
      }
      document.getElementById("sepaySecret").value = "";
    } catch(err){
      msg.textContent = "Lỗi kết nối: " + err.message;
      msg.style.color = "var(--danger)";
    }
  });
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
bindSepayForm();
Promise.all([loadMe(), loadAdmin()]).finally(()=>{
  loadAdminUsers();
  loadSepayConfig();
});