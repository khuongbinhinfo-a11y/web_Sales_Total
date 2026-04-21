/* ═══ portal.js — customer portal ═══ */

function fmtVnd(v){ return new Intl.NumberFormat("vi-VN",{style:"currency",currency:"VND"}).format(v); }
function fmtDate(d){ if(!d) return "—"; return new Date(d).toLocaleDateString("vi-VN",{day:"2-digit",month:"2-digit",year:"numeric",hour:"2-digit",minute:"2-digit"}); }
function statusBadge(s){
  const map = {paid:"status-paid",pending:"status-pending",active:"status-active",delivered:"status-delivered"};
  return `<span class="status-badge ${map[s]||""}">${s}</span>`;
}

async function loadPortal(cid){
  try {
    const res = await fetch(`/api/portal/${cid}`);
    if(res.status===401){ window.location.href="/portal/login"; return; }
    const d = await res.json();
    renderPortal(d);
  } catch(e){
    console.error("Portal load error",e);
  }
}

function renderPortal(d){
  // Customer info
  const cc = document.getElementById("custCard");
  if(d.customer){
    cc.innerHTML = `<p style="margin:0"><strong>${d.customer.fullName||d.customer.id}</strong></p>
      <p style="margin:2px 0;font-size:.82rem;color:var(--muted)">${d.customer.email||"—"}</p>
      <p style="margin:2px 0;font-size:.82rem;color:var(--muted)">ID: ${d.customer.id}</p>`;
  }

  // Wallet
  const wc = document.getElementById("walletCard");
  if(d.wallets && d.wallets.length){
    const total = d.wallets.reduce((s,w)=>s+w.balance,0);
    wc.innerHTML = `<span class="big-num">${total.toLocaleString()}</span><div class="label">credit khả dụng</div>`;
    d.wallets.forEach(w=>{
      wc.innerHTML += `<p style="font-size:.8rem;color:var(--muted);margin:4px 0">${w.appId}: ${w.balance.toLocaleString()} credits</p>`;
    });
  }

  // Subscriptions
  const sc = document.getElementById("subCard");
  if(d.subscriptions && d.subscriptions.length){
    sc.innerHTML = d.subscriptions.map(s => `
      <div style="padding:8px 0;border-bottom:1px solid var(--line)">
        <div style="display:flex;align-items:center;gap:8px">
          ${statusBadge(s.status)}
          <strong style="font-size:.88rem">${s.appId}</strong>
        </div>
        <p style="font-size:.78rem;color:var(--muted);margin:4px 0">
          ${fmtDate(s.startAt)} → ${fmtDate(s.endAt)} · ${s.renewalMode}
        </p>
      </div>`).join("");
  }

  // Key deliveries
  const kt = document.getElementById("keysTable");
  if(d.keyDeliveries && d.keyDeliveries.length){
    kt.innerHTML = d.keyDeliveries.map(k => `
      <div style="margin-bottom:12px">
        <p style="font-size:.82rem;color:var(--muted);margin:0 0 4px">Đơn: ${k.orderCode || k.orderId} · ${fmtDate(k.deliveredAt)}</p>
        <div class="key-box">🔑 ${k.keyValue}</div>
      </div>`).join("");
  } else {
    kt.innerHTML = `<p style="color:var(--muted);font-size:.85rem">Chưa có key nào được giao</p>`;
  }

  // Orders
  const ot = document.getElementById("ordersTable");
  if(d.orders && d.orders.length){
    ot.innerHTML = `<table class="data-table"><thead><tr><th>Mã đơn</th><th>Sản phẩm</th><th>Số tiền</th><th>Trạng thái</th><th>Ngày tạo</th></tr></thead><tbody>` +
      d.orders.map(o => `<tr>
        <td style="font-size:.78rem;font-family:monospace">${o.orderCode || `${o.id.slice(0,8)}…`}</td>
        <td>${o.productId||o.appId}</td>
        <td>${fmtVnd(o.amount)}</td>
        <td>${statusBadge(o.status)}</td>
        <td style="font-size:.8rem">${fmtDate(o.createdAt)}</td>
      </tr>`).join("") + `</tbody></table>`;
  }

  // Ledger
  const lt = document.getElementById("ledgerTable");
  if(d.ledger && d.ledger.length){
    lt.innerHTML = `<table class="data-table"><thead><tr><th>Ngày</th><th>Thay đổi</th><th>Lý do</th><th>App</th></tr></thead><tbody>` +
      d.ledger.map(l => {
        const cls = l.change >= 0 ? "color:var(--success)" : "color:var(--danger)";
        const sign = l.change >= 0 ? "+" : "";
        return `<tr>
          <td style="font-size:.8rem">${fmtDate(l.createdAt)}</td>
          <td style="font-weight:700;${cls}">${sign}${l.change}</td>
          <td>${l.reason}</td>
          <td>${l.appId}</td>
        </tr>`;
      }).join("") + `</tbody></table>`;
  }
}

async function consumeUsage(){
  const cid = document.getElementById("customerId").value;
  const payload = {
    customerId: cid,
    appId: document.getElementById("usageAppId").value,
    featureKey: document.getElementById("usageFeatureKey").value,
    creditsToConsume: Number(document.getElementById("usageCredits").value),
    units: Number(document.getElementById("usageUnits").value),
    requestId: document.getElementById("usageRequestId").value,
    metadata:{ source:"portal-page" }
  };
  const res = await fetch("/api/usage/consume",{
    method:"POST", headers:{"Content-Type":"application/json"}, body:JSON.stringify(payload)
  });
  if(res.status===401){ window.location.href="/portal/login"; return; }
  const data = await res.json();
  document.getElementById("usageData").textContent = JSON.stringify(data,null,2);
  await loadPortal(cid);
}

document.getElementById("loadPortal").addEventListener("click",()=>{
  loadPortal(document.getElementById("customerId").value);
});
document.getElementById("consumeUsage").addEventListener("click", consumeUsage);
loadPortal("cus-demo");