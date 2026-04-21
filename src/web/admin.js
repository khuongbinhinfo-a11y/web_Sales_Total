/* ═══ admin.js — admin dashboard ═══ */

function fmtVnd(v){ return new Intl.NumberFormat("vi-VN",{style:"currency",currency:"VND"}).format(v); }
function fmtDate(d){ if(!d) return "—"; return new Date(d).toLocaleDateString("vi-VN",{day:"2-digit",month:"2-digit",year:"numeric",hour:"2-digit",minute:"2-digit"}); }
function badge(s){
  const m={paid:"status-paid",pending:"status-pending",active:"status-active"};
  return `<span class="status-badge ${m[s]||""}">${s}</span>`;
}

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
  document.getElementById("adminMain").innerHTML = `<div class="info-card" style="margin:32px"><h3>⚠️ Không thể tải dashboard</h3><p style="color:var(--muted)">${message}</p><p style="font-size:.82rem;color:var(--muted)">Kiểm tra nhanh: PostgreSQL đang chạy, đã chạy npm run db:migrate, và đăng nhập đúng quyền.</p></div>`;
}

function renderDashboard(d){
  const k = d.kpi || { totalRevenue:0, paidOrders:0, pendingOrders:0, totalCustomers:0, totalApps:0 };
  document.getElementById("kpiRevenue").textContent = fmtVnd(k.totalRevenue);
  document.getElementById("kpiPaid").textContent = k.paidOrders;
  document.getElementById("kpiPending").textContent = k.pendingOrders;
  document.getElementById("kpiCustomers").textContent = k.totalCustomers;
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

loadAdmin();