/* ═══ product.js — product detail page ═══ */

/* ── fallback demo data (same as main.js) ── */
const fallbackProducts = [
  { id:"demo-test2k", appId:"lamviec", name:"Gói test thanh toán 2K", cycle:"one_time", price:2000, credits:1, image:"/products/image/quet-data-gg-map.png" },
  { id:"demo-hoc01", appId:"hoctap",  name:"Khóa học cấp 01",              cycle:"one_time", price:49000,  credits:1, image:"/products/image/hoc-cap-01.png" },
  { id:"demo-hoc12", appId:"hoctap",  name:"Khóa học lớp 12",              cycle:"one_time", price:79000,  credits:1, image:"/products/image/hoc-cap-12.png" },
  { id:"demo-map",   appId:"lamviec", name:"Quét data Google Map",          cycle:"one_time", price:499000, credits:3, image:"/products/image/quet-data-gg-map.png" },
  { id:"demo-cv1",   appId:"lamviec", name:"Phần mềm tạo video đồng bộ nhân vật", cycle:"monthly", price:399000, credits:2, image:"/products/image/Screenshot%202026-04-20%20203856.png" },
  { id:"demo-cv2",   appId:"lamviec", name:"Phần mềm quản lý site bất động sản và bài viết", cycle:"monthly", price:300000, credits:2, image:"/products/image/Screenshot%202026-04-20%20204104.png" }
];

/* ── product catalog content (features + guide per product) ── */
const productContent = {
  "demo-test2k": {
    desc: "Gói test 2.000 VND để kiểm tra nhanh luồng thanh toán tự động, webhook và giao key.",
    icon: "🧪",
    features: [
      { icon:"⚡", title:"Test nhanh", detail:"Giá nhỏ để chạy thử checkout" },
      { icon:"🔔", title:"Test webhook", detail:"Xác minh callback Sepay về hệ thống" },
      { icon:"🔑", title:"Test giao key", detail:"Kiểm tra cấp key tự động sau paid" },
      { icon:"📈", title:"Test vận hành", detail:"Đối soát dashboard và Telegram" },
    ],
    guide: [
      { title:"Mua gói test", detail:"Chọn gói test 2K và tạo đơn hàng." },
      { title:"Thanh toán", detail:"Quét QR và chuyển khoản đúng số tiền hiển thị." },
      { title:"Chờ webhook", detail:"Hệ thống nhận webhook và tự động cập nhật paid." },
      { title:"Nhận key", detail:"Key test sẽ hiển thị trong portal sau vài giây." },
    ]
  },
  "demo-hoc01": {
    desc: "Trọn bộ học liệu cấp tiểu học 01. Chương trình theo chuẩn Bộ GD&ĐT, giao diện thân thiện với trẻ em.",
    icon: "📚",
    features: [
      { icon:"🎯", title:"Đúng chương trình", detail:"Theo chuẩn Bộ GD&ĐT mới nhất" },
      { icon:"🖥️", title:"Học online", detail:"Truy cập mọi lúc, mọi nơi" },
      { icon:"📊", title:"Theo dõi tiến trình", detail:"Báo cáo học tập định kỳ" },
      { icon:"🎮", title:"Học qua trò chơi", detail:"Giao diện sinh động, tương tác cao" },
    ],
    guide: [
      { title:"Nhận key", detail:"Sau thanh toán, key kích hoạt gửi về trang đơn hàng của bạn ngay lập tức." },
      { title:"Truy cập trang học", detail:"Vào trang chủ khóa học, chọn Kích hoạt & nhập key vào ô Mã kích hoạt." },
      { title:"Tạo tài khoản học sinh", detail:"Nhập tên học sinh, chọn lớp và bắt đầu học." },
      { title:"Bắt đầu học", detail:"Chọn môn học → Bài học → Làm bài tập tương tác." },
    ]
  },
  "demo-hoc12": {
    desc: "Bộ tài liệu luyện thi lớp 12 đầy đủ nhất. Bao gồm video bài giảng, đề thi thử có đáp án chi tiết.",
    icon: "🎓",
    features: [
      { icon:"📝", title:"Đề thi thử", detail:"Hàng trăm đề thi thử sát đề thật" },
      { icon:"🎬", title:"Video bài giảng", detail:"Giảng viên đầu ngành, dễ hiểu" },
      { icon:"⏰", title:"Luyện thi nhanh", detail:"Kế hoạch ôn thi khoa học" },
      { icon:"✅", title:"Đáp án chi tiết", detail:"Giải thích từng bước rõ ràng" },
    ],
    guide: [
      { title:"Nhận key kích hoạt", detail:"Key được giao tự động sau thanh toán, xem trong trang đơn hàng." },
      { title:"Vào trang học", detail:"Truy cập trang luyện thi, chọn Đăng nhập / Kích hoạt." },
      { title:"Nhập key & chọn môn", detail:"Dán key vào ô kích hoạt, chọn các môn muốn ôn thi." },
      { title:"Luyện đề mỗi ngày", detail:"Làm đề thi thử, xem đáp án và ghi chú điểm yếu cần cải thiện." },
    ]
  },
  "demo-map": {
    desc: "Phần mềm quét dữ liệu doanh nghiệp, địa điểm từ Google Map. Xuất file Excel tự động, tiết kiệm 90% thời gian.",
    icon: "🗺️",
    features: [
      { icon:"⚡", title:"Quét siêu nhanh", detail:"Hàng nghìn địa điểm trong vài phút" },
      { icon:"📁", title:"Xuất Excel/CSV", detail:"Dữ liệu có cấu trúc, dùng ngay" },
      { icon:"🔍", title:"Lọc thông minh", detail:"Theo khu vực, ngành nghề, đánh giá" },
      { icon:"🔄", title:"Cập nhật liên tục", detail:"Đồng bộ dữ liệu mới nhất từ Google" },
    ],
    guide: [
      { title:"Nhận key phần mềm", detail:"Key giao tự động sau thanh toán, sao chép từ trang đơn hàng." },
      { title:"Tải & cài đặt", detail:"Tải file cài đặt từ liên kết trong đơn hàng, chạy file .exe." },
      { title:"Kích hoạt phần mềm", detail:"Mở phần mềm → Nhập key → Kích hoạt. Kết nối internet khi kích hoạt." },
      { title:"Bắt đầu quét data", detail:"Nhập từ khoá & khu vực → chọn bộ lọc → Quét → Xuất file." },
    ]
  },
  "demo-cv1": {
    desc: "Phần mềm tạo video đồng bộ nhân vật AI. Tự động tạo video có nhân vật nói chuyện khớp môi từ script của bạn.",
    icon: "🎬",
    features: [
      { icon:"🤖", title:"AI tạo nhân vật", detail:"Hàng trăm nhân vật đa dạng sẵn có" },
      { icon:"🎙️", title:"Khớp môi tự động", detail:"Lip-sync chuẩn xác với giọng đọc" },
      { icon:"🌐", title:"Đa ngôn ngữ", detail:"Hỗ trợ tiếng Việt, Anh, Trung, Nhật..." },
      { icon:"📤", title:"Xuất chất lượng cao", detail:"Video HD/4K cho mọi nền tảng" },
    ],
    guide: [
      { title:"Nhận key tháng", detail:"Key monthly được giao tự động. Mỗi tháng sẽ nhận key mới sau khi gia hạn." },
      { title:"Đăng nhập phần mềm", detail:"Mở ứng dụng web/desktop → Đăng nhập bằng tài khoản đăng ký." },
      { title:"Nhập key kích hoạt tháng", detail:"Vào phần Tài khoản → Kích hoạt → Dán key vào và xác nhận." },
      { title:"Tạo video đầu tiên", detail:"Chọn nhân vật → Nhập script → Chọn giọng đọc → Render → Tải về." },
    ]
  },
  "demo-cv2": {
    desc: "Hệ thống quản lý website bất động sản và blog bài viết. Đăng tin, quản lý khách hàng, theo dõi tương tác.",
    icon: "🏠",
    features: [
      { icon:"🏘️", title:"Đăng tin BĐS", detail:"Quản lý hàng trăm tin đăng dễ dàng" },
      { icon:"✍️", title:"Quản lý blog", detail:"Tạo và xuất bản bài viết chuyên nghiệp" },
      { icon:"👥", title:"CRM khách hàng", detail:"Lưu trữ và theo dõi khách hàng tiềm năng" },
      { icon:"📈", title:"Báo cáo thống kê", detail:"Dashboard trực quan về lượt xem, leads" },
    ],
    guide: [
      { title:"Nhận thông tin tài khoản", detail:"Sau thanh toán, thông tin đăng nhập hệ thống gửi tự động qua đơn hàng." },
      { title:"Đăng nhập hệ thống", detail:"Truy cập link được cấp → Đăng nhập với email & mật khẩu tạm thời." },
      { title:"Đổi mật khẩu & thiết lập", detail:"Vào Cài đặt → Đổi mật khẩu → Cấu hình thông tin website." },
      { title:"Bắt đầu đăng tin", detail:"Vào Quản lý Tin đăng → Thêm tin mới → Điền thông tin và xuất bản." },
    ]
  }
};

/* ── i18n minimal ── */
let lang = localStorage.getItem("wst_lang") || "vi";
let currentUser = null;
let currentProduct = null;

function fmtVnd(v){
  return new Intl.NumberFormat("vi-VN",{style:"currency",currency:"VND"}).format(v);
}
function fmtCycle(c){
  if(c==="monthly") return "Hàng tháng";
  if(c==="yearly")  return "Hàng năm";
  return "Một lần";
}

/* ── Tab switching ── */
document.querySelectorAll(".pd-tab-btn").forEach(btn=>{
  btn.addEventListener("click", ()=>{
    document.querySelectorAll(".pd-tab-btn").forEach(b=>b.classList.remove("active"));
    document.querySelectorAll(".pd-tab-panel").forEach(p=>p.classList.add("is-hidden"));
    btn.classList.add("active");
    const panel = document.getElementById("tab"+btn.dataset.tab.charAt(0).toUpperCase()+btn.dataset.tab.slice(1));
    if(panel) panel.classList.remove("is-hidden");
  });
});

/* ── Auth ── */
const loginModal   = document.getElementById("loginModal");
const loginModalClose = document.getElementById("loginModalClose");
const navLoginBtn  = document.getElementById("navLoginBtn");
const navRegisterBtn = document.getElementById("navRegisterBtn");
const userMenu     = document.getElementById("userMenu");
const userMenuBtn  = document.getElementById("userMenuBtn");
const userEmail    = document.getElementById("userEmail");
const userDropdown = document.getElementById("userDropdown");
const dropLogout   = document.getElementById("dropLogout");
const tabLogin     = document.getElementById("tabLogin");
const tabRegister  = document.getElementById("tabRegister");
const loginPane    = document.getElementById("loginPane");
const registerPane = document.getElementById("registerPane");
const switchToRegister = document.getElementById("switchToRegister");
const switchToLogin    = document.getElementById("switchToLogin");
const loginForm    = document.getElementById("loginForm");
const registerForm = document.getElementById("registerForm");
const loginError   = document.getElementById("loginError");

function showLoginTab(){ tabLogin.classList.add("active"); tabRegister.classList.remove("active"); loginPane.style.display=""; registerPane.style.display="none"; loginError.textContent=""; }
function showRegisterTab(){ tabRegister.classList.add("active"); tabLogin.classList.remove("active"); registerPane.style.display=""; loginPane.style.display="none"; loginError.textContent=""; }

navLoginBtn.addEventListener("click", e=>{ e.preventDefault(); showLoginTab(); loginModal.classList.add("show"); });
navRegisterBtn.addEventListener("click", e=>{ e.preventDefault(); showRegisterTab(); loginModal.classList.add("show"); });
loginModalClose.addEventListener("click", ()=>loginModal.classList.remove("show"));
loginModal.addEventListener("click", e=>{ if(e.target===loginModal) loginModal.classList.remove("show"); });
tabLogin.addEventListener("click", showLoginTab);
tabRegister.addEventListener("click", showRegisterTab);
switchToRegister.addEventListener("click", e=>{ e.preventDefault(); showRegisterTab(); });
switchToLogin.addEventListener("click", e=>{ e.preventDefault(); showLoginTab(); });

loginForm.addEventListener("submit", async e=>{
  e.preventDefault();
  const email = document.getElementById("loginEmail").value.trim();
  const password = document.getElementById("loginPassword").value;
  if(!email){ loginError.textContent="Vui lòng nhập email hợp lệ"; return; }
  if(!password || password.length < 8){ loginError.textContent="Mật khẩu tối thiểu 8 ký tự"; return; }
  try{
    const res = await fetch("/api/auth/customer/login",{ method:"POST", headers:{"Content-Type":"application/json"}, body:JSON.stringify({email, password}) });
    if(!res.ok){ const d=await res.json(); loginError.textContent=d.message||"Lỗi đăng nhập"; return; }
    loginModal.classList.remove("show");
    await checkAuth();
  } catch{ loginError.textContent="Không thể kết nối server"; }
});

registerForm.addEventListener("submit", async e=>{
  e.preventDefault();
  const email    = document.getElementById("registerEmail").value.trim();
  const fullName = document.getElementById("registerName").value.trim();
  const password = document.getElementById("registerPassword").value;
  if(!email||!fullName){ loginError.textContent="Vui lòng điền đầy đủ thông tin"; return; }
  if(!password || password.length < 8){ loginError.textContent="Mật khẩu tối thiểu 8 ký tự"; return; }
  try{
    const res = await fetch("/api/auth/customer/register",{ method:"POST", headers:{"Content-Type":"application/json"}, body:JSON.stringify({email,fullName,password}) });
    if(!res.ok){ const d=await res.json(); loginError.textContent=d.message||"Lỗi đăng ký"; return; }
    loginModal.classList.remove("show");
    await checkAuth();
  } catch{ loginError.textContent="Không thể kết nối server"; }
});

userMenuBtn.addEventListener("click", ()=>userDropdown.classList.toggle("show"));
document.addEventListener("click", e=>{ if(!userMenu.contains(e.target)) userDropdown.classList.remove("show"); });
dropLogout.addEventListener("click", async e=>{ e.preventDefault(); await fetch("/api/auth/customer/logout",{method:"POST"}); location.reload(); });

function setLoggedIn(snapshot){
  currentUser = snapshot;
  navLoginBtn.classList.add("is-hidden");
  navRegisterBtn.classList.add("is-hidden");
  userMenu.classList.remove("is-hidden");
  userEmail.textContent = snapshot.customer?.email || "user";
  updateBuyBtn();
}
function setLoggedOut(){
  currentUser = null;
  navLoginBtn.classList.remove("is-hidden");
  navRegisterBtn.classList.remove("is-hidden");
  userMenu.classList.add("is-hidden");
  updateBuyBtn();
}
async function checkAuth(){
  try{
    const res = await fetch("/api/auth/me");
    if(!res.ok){ setLoggedOut(); return; }
    const data = await res.json();
    data.customer ? setLoggedIn(data) : setLoggedOut();
  } catch { setLoggedOut(); }
}

/* ── Buy button ── */
function updateBuyBtn(){
  const btn = document.getElementById("pdBuyBtn");
  const note = document.getElementById("pdBuyNote");
  if(!btn||!currentProduct) return;
  if(!currentUser){
    btn.textContent = "🔐 Đăng nhập để mua";
    if(note) note.textContent = "Cần đăng nhập để tiến hành mua hàng";
  } else {
    btn.textContent = "🛒 Mua ngay";
    if(note) note.textContent = "Key giao tự động sau thanh toán thành công";
  }
}

document.getElementById("pdBuyBtn").addEventListener("click", async ()=>{
  if(!currentProduct) return;
  if(!currentUser){
    showLoginTab();
    loginModal.classList.add("show");
    return;
  }
  // check if live
  try{
    const res = await fetch("/api/orders",{
      method:"POST", headers:{"Content-Type":"application/json"},
      body:JSON.stringify({ appId:currentProduct.appId, productId:currentProduct.id })
    });
    const d = await res.json();
    if(!res.ok){ alert(d.message||"Không tạo được đơn hàng"); return; }
    window.open(d.checkoutUrl,"_blank");
  } catch {
    alert("Preview mode: API/DB chưa sẵn sàng.");
  }
});

/* ── Load product ── */
async function loadProduct(productId){
  // try API first
  let product = null;
  try{
    const res = await fetch("/api/catalog");
    if(res.ok){
      const data = await res.json();
      const list = Array.isArray(data.products) ? data.products : [];
      product = list.find(p=>p.id===productId);
    }
  } catch{}

  // fallback
  if(!product) product = fallbackProducts.find(p=>p.id===productId);

  if(!product){
    document.getElementById("pdLoading").classList.add("is-hidden");
    document.getElementById("pdNotFound").classList.remove("is-hidden");
    return;
  }

  currentProduct = product;
  renderProduct(product);
}

function renderProduct(p){
  document.title = `${p.name} – Ứng Dụng Thông Minh`;
  document.getElementById("pdBreadName").textContent = p.name;

  // main image
  const imgEl = document.getElementById("pdMainImg");
  if(p.image){
    imgEl.innerHTML = `<img src="${p.image}" alt="${p.name}" style="width:100%;height:100%;object-fit:cover">`;
  } else {
    const icons = {hoctap:"📚",lamviec:"💼"};
    imgEl.textContent = icons[(p.appId||"").toLowerCase()] || "📦";
  }

  // buy box
  const catLabels = {hoctap:"Học tập",lamviec:"Làm việc"};
  document.getElementById("pdCatBadge").textContent = catLabels[(p.appId||"").toLowerCase()] || p.appId;
  document.getElementById("pdTitle").textContent = p.name;
  document.getElementById("pdCycle").textContent = `Loại: ${fmtCycle(p.cycle)} · ${p.credits} credit${p.credits>1?"s":""}`;
  document.getElementById("pdPrice").textContent = fmtVnd(p.price);
  updateBuyBtn();

  // content from productContent map
  const content = productContent[p.id] || {
    desc: `${p.name} — Sản phẩm phần mềm chất lượng cao, giao key tự động sau thanh toán.`,
    icon: "📦",
    features: [
      { icon:"⚡", title:"Tự động giao key", detail:"Nhận key ngay sau thanh toán" },
      { icon:"🔐", title:"Key bản quyền", detail:"Key chuẩn, kích hoạt ngay" },
      { icon:"💬", title:"Hỗ trợ 24/7", detail:"Tư vấn & hỗ trợ mọi lúc" },
      { icon:"🔄", title:"Bảo hành", detail:"Đổi key nếu gặp sự cố" },
    ],
    guide: [
      { title:"Nhận key", detail:"Key được giao tự động sau khi thanh toán thành công." },
      { title:"Kích hoạt phần mềm", detail:"Mở phần mềm và nhập key vào ô kích hoạt." },
      { title:"Bắt đầu sử dụng", detail:"Tạo tài khoản hoặc đăng nhập và trải nghiệm đầy đủ tính năng." },
    ]
  };

  // desc tab
  document.getElementById("pdDescIcon").textContent = content.icon;
  document.getElementById("pdDescTitle").textContent = p.name;
  document.getElementById("pdFeatureList").innerHTML = content.features.map(f=>
    `<div class="pd-feature">
      <div class="pd-feature-icon">${f.icon}</div>
      <div class="pd-feature-text"><strong>${f.title}</strong><span>${f.detail}</span></div>
    </div>`
  ).join("");

  // guide tab
  document.getElementById("pdGuideSteps").innerHTML = content.guide.map(s=>
    `<li><div class="pd-step-text"><strong>${s.title}</strong><span>${s.detail}</span></div></li>`
  ).join("");

  // show content
  document.getElementById("pdLoading").classList.add("is-hidden");
  document.getElementById("pdContent").classList.remove("is-hidden");
}

/* ── Init ── */
const productId = location.pathname.split("/product/")[1]?.split("?")[0];
if(productId){
  loadProduct(decodeURIComponent(productId));
} else {
  document.getElementById("pdLoading").classList.add("is-hidden");
  document.getElementById("pdNotFound").classList.remove("is-hidden");
}
checkAuth();
