/* ═══ product.js — product detail page ═══ */

/* ── fallback demo data (same as main.js) ── */
const fallbackProducts = [
  { id:"demo-test2k", appId:"lamviec", name:"Gói test thanh toán 2K", cycle:"one_time", price:2000, credits:1 },
  { id:"prod-study-month", appId:"app-study-12",  name:"Phần mềm ôn tập cho khối cấp 01 và Tiền Tiểu học", cycle:"monthly", price:89000,  credits:120 },
  { id:"standard_1year_1grade", appId:"app-study-12",  name:"Gói 1 năm / Lớp", cycle:"yearly", price:299000,  credits:1800 },
  { id:"prod-study-year", appId:"app-study-12",  name:"Phần mềm ôn tập cho khối cấp 01 và Tiền Tiểu học", cycle:"yearly", price:599000,  credits:1800 },
  { id:"prod-study-premium-month", appId:"app-study-12",  name:"Phần mềm ôn tập cho khối cấp 01 và Tiền Tiểu học", cycle:"monthly", price:119000,  credits:240 },
  { id:"prod-study-premium-year", appId:"app-study-12",  name:"Phần mềm ôn tập cho khối cấp 01 và Tiền Tiểu học", cycle:"yearly", price:899000,  credits:3600 },
  { id:"prod-study-standard-lifetime", appId:"app-study-12",  name:"Phần mềm ôn tập cho khối cấp 01 và Tiền Tiểu học", cycle:"one_time", price:1299000,  credits:9990 },
  { id:"prod-study-premium-lifetime", appId:"app-study-12",  name:"Phần mềm ôn tập cho khối cấp 01 và Tiền Tiểu học", cycle:"one_time", price:1599000,  credits:15990 },
  { id:"demo-hoc12", appId:"app-cap12", name:"Phần mềm học tập khối cấp 12", cycle:"one_time", price:2000, credits:1 },
  { id:"demo-map",   appId:"map-pro", name:"Phần Mềm Quét Data Khách Hàng Trên Google Map", cycle:"one_time", price:499000, credits:0 },
  { id:"demo-cv1",   appId:"lamviec", name:"Phần mềm tạo video đồng bộ nhân vật", cycle:"monthly", price:399000, credits:2 },
  { id:"demo-cv2",   appId:"lamviec", name:"Phần mềm quản lý site bất động sản và bài viết", cycle:"monthly", price:300000, credits:2 },
  { id:"prod-prompt-lifetime", appId:"app-prompt-image-video", name:"Video Creator - Phần mềm tạo prompt và điều phối AI Video trong một nơi", cycle:"one_time", price:249000, credits:0 },
  { id:"prod-bds-website-lifetime", appId:"app-bds-website-manager", name:"Phần Mềm Quản Lý Website & Tin Đăng Bất Động Sản", cycle:"one_time", price:350000, credits:0 },
  { id:"prod-salon-manager-lifetime", appId:"hair-spa-manager", name:"Salon Manager", cycle:"one_time", price:990000, credits:0 }
];

function imagePathByName(fileName) {
  return `/products/image/${encodeURIComponent(fileName)}`;
}

const productImageLibrary = {
  study01: imagePathByName("phần mềm học tập khối cấp 01.jpeg"),
  study01Alt: imagePathByName("phần mềm học tập khối cấp 01_2.jpeg"),
  study12: imagePathByName("phần mềm học tập khối cấp 12.jpeg"),
  map: imagePathByName("Phần mềm quét data KH-GGmap-2.jpeg"),
  mapAlt: imagePathByName("Phần mềm quét data KH-GGmap-2.jpeg"),
  video: imagePathByName("Phần mềm tạo video đồng bộ nhân vật-2.jpeg"),
  bds: imagePathByName("Quản_lý_website_BDS-2.jpeg"),
  salon: imagePathByName("Salon-Manager.png")
};

const SUPPORT_CHAT_URL = "https://zalo.me/0902964685";

function normalizeProductSaleStatus(value) {
  const normalized = String(value || "").trim().toLowerCase();
  return ["live", "locked", "coming_soon"].includes(normalized) ? normalized : "live";
}

function getProductSalePresentation(product) {
  const saleStatus = normalizeProductSaleStatus(product?.saleStatus);
  const saleNote = String(product?.saleNote || "").trim();
  if (saleStatus === "locked") {
    return {
      saleStatus,
      badge: "Tạm khóa",
      buttonLabel: "🔒 Tạm khóa",
      disabled: true,
      note: saleNote || "Sản phẩm này đang tạm khóa để cập nhật hoặc xử lý lỗi."
    };
  }
  if (saleStatus === "coming_soon") {
    return {
      saleStatus,
      badge: "Coming soon",
      buttonLabel: "⏳ Sắp mở bán",
      disabled: true,
      note: saleNote || "Sản phẩm này đang được đưa lên trước để quảng cáo, chưa mở bán."
    };
  }
  return {
    saleStatus,
    badge: "",
    buttonLabel: "🛒 Mua ngay",
    disabled: false,
    note: ""
  };
}

function getProductDisplayPrice(product) {
  const basePrice = Math.max(0, Number(product?.basePrice ?? product?.comparePrice ?? product?.price ?? 0));
  const comparePrice = Math.max(0, Number(product?.comparePrice ?? basePrice));
  const effectivePrice = Math.max(0, Number(product?.effectivePrice ?? product?.salePrice ?? product?.price ?? 0));
  const hasDirectSale = Boolean(product?.saleEnabled) && comparePrice > effectivePrice;
  return {
    basePrice,
    comparePrice,
    effectivePrice,
    hasDirectSale
  };
}

function renderProductPriceHtml(product) {
  const pricing = getProductDisplayPrice(product);
  if (!pricing.hasDirectSale) {
    return fmtVnd(pricing.effectivePrice);
  }
  return `${fmtVnd(pricing.effectivePrice)} <span class="p-card-old-price" style="font-size:.95rem">${fmtVnd(pricing.comparePrice)}</span>`;
}

function normalizeText(value) {
  return String(value || "")
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, " ")
    .trim();
}

function isInternalTestProduct(product) {
  const id = normalizeText(product?.id);
  const name = normalizeText(product?.name);
  return id === "prod test 2k" || id === "demo test2k" || /(test\s*2k|sepay\s*test|internal\s*test)/.test(name);
}

function isStudyCap01Family(product) {
  const id = normalizeText(product?.id);
  const name = normalizeText(product?.name);
  const appId = normalizeText(product?.appId);
  return (
    appId === "app study 12" ||
    /phan mem hoc tap cho hoc sinh khoi cap 01|phan mem on tap khoi cap 01 tien tieu hoc|khoi cap 01|tien tieu hoc|prod study/.test(`${id} ${name}`)
  );
}

function canonicalProductName(product) {
  if (isStudyCap01Family(product)) {
    return "Phần mềm ôn tập cho khối cấp 01 và Tiền Tiểu học";
  }
  return String(product?.name || "").trim();
}

function resolveProductImage(product) {
  const name = normalizeText(product?.name);
  const appId = normalizeText(product?.appId);
  const productId = normalizeText(product?.id);
  const hint = `${name} ${appId} ${productId}`;

  if (/(prod study month)/.test(productId)) {
    return productImageLibrary.study01Alt;
  }
  const isStudy = /(hoc|study|cap|lop)/.test(hint);
  if (/(goi test 2k|test 2k|prod test 2k|demo test2k)/.test(hint)) {
    return productImageLibrary.study01;
  }
  if (/(cap 01|cap 1|lop 1|study 01|study 1|khoi 01|khoi 1)/.test(hint)) {
    return productImageLibrary.study01;
  }
  if (/(cap 12|lop 12|study 12|khoi 12)/.test(hint)) {
    return productImageLibrary.study12;
  }
  if (/(map|ggmap|quet data|scan data|data kh)/.test(hint)) {
    return productImageLibrary.map;
  }
  if (/(salon manager|hair spa manager|hair spa|salon)/.test(hint)) {
    return productImageLibrary.salon;
  }
  if (/(bds|website)/.test(productId)) {
    return productImageLibrary.bds;
  }
  if (/(video|dong bo|nhan vat|lip sync)/.test(hint)) {
    return productImageLibrary.video;
  }
  if (/(bat dong san|bds|website)/.test(hint)) {
    return productImageLibrary.bds;
  }

  if (isStudy || /study/.test(appId)) {
    return productImageLibrary.study12;
  }
  if (/(lam viec|work)/.test(hint) || /lamviec/.test(appId)) {
    return productImageLibrary.mapAlt;
  }

  if (product?.image) {
    return product.image;
  }

  return "";
}

/* ── product catalog content (features + guide per product) ── */
const productContent = {
  "prod-study-month": {
    desc: "Học Hứng Khởi là ứng dụng học tập cho học sinh tiểu học, giúp con học theo lộ trình rõ ràng, luyện tập ngắn và phụ huynh theo dõi tiến bộ dễ dàng mỗi ngày.",
    icon: "📚",
    descImage: productImageLibrary.study01,
    longDescription: {
      highlights: [
        "Bám sát chương trình phổ thông bậc tiểu học theo hướng dễ hiểu, dễ học, dễ nhớ.",
        "Thiết kế phù hợp học sinh nhỏ tuổi với nội dung ngắn gọn và lộ trình học rõ ràng.",
        "Giúp phụ huynh theo dõi kết quả học tập hàng ngày mà không cần thao tác phức tạp.",
      ],
      sections: [
        {
          heading: "Tổng quan sản phẩm",
          paragraphs: [
            "Học Hứng Khởi là giải pháp học tập dành cho học sinh khối cấp 01, tập trung vào việc xây nền tảng kiến thức sớm và tạo thói quen học đều đặn mỗi ngày.",
            "Nội dung được trình bày theo từng chủ đề ngắn, có luyện tập ngay sau bài học để học sinh ghi nhớ tốt hơn thay vì học dồn.",
          ]
        },
        {
          heading: "Điểm nổi bật",
          paragraphs: [
            "Sản phẩm kết hợp bài giảng, phần luyện tập và các thử thách nhỏ nhằm tăng hứng thú học tập cho trẻ.",
            "Mỗi buổi học được chia thành các bước đơn giản để học sinh tự học được, đồng thời phụ huynh vẫn dễ theo dõi tiến độ.",
          ]
        },
        {
          heading: "Lợi ích cho phụ huynh và học sinh",
          paragraphs: [
            "Học sinh có lộ trình học mạch lạc, biết mình đang học gì và cần ôn lại phần nào.",
            "Phụ huynh xem được tóm tắt kết quả theo ngày/tuần, phát hiện sớm phần kiến thức con còn yếu để hỗ trợ đúng lúc.",
            "Cách tổ chức bài học ngắn giúp giảm áp lực, phù hợp với quỹ thời gian của gia đình có con nhỏ.",
          ]
        },
        {
          heading: "Phù hợp sử dụng",
          paragraphs: [
            "Phù hợp cho gia đình muốn con học đều tại nhà, giáo viên cần công cụ học bổ trợ, và học sinh cần môi trường học tập có định hướng rõ ràng.",
            "Sản phẩm vận hành trực quan, thao tác đơn giản, có thể bắt đầu học nhanh mà không cần cài đặt phức tạp.",
          ]
        }
      ]
    },
    features: [
      { icon:"🧭", title:"Lộ trình học rõ ràng", detail:"Học theo bài, không học lan man, dễ duy trì thói quen." },
      { icon:"⚡", title:"Luyện tập ngắn hiệu quả", detail:"Buổi học ngắn, dễ bắt đầu, có phản hồi kết quả ngay." },
      { icon:"👨‍👩‍👧", title:"Phụ huynh theo dõi dễ", detail:"Xem số bài đã học, điểm trung bình và bài cần ôn lại nhanh." },
      { icon:"🎯", title:"Tăng hứng thú học tập", detail:"Có thử thách, mini-game, XP và cấp độ để tạo động lực mỗi ngày." },
    ],
    guide: [
      { title:"Bước 1: Mở ứng dụng", detail:"Vào Trang chủ để xem nhanh tiến bộ học tập và các lối tắt học." },
      { title:"Bước 2: Chọn môn và bài", detail:"Bấm Môn học, chọn lớp hiện tại, sau đó mở bài học cần học." },
      { title:"Bước 3: Luyện tập sau bài", detail:"Làm bài luyện ngắn để củng cố kiến thức và nhận phản hồi ngay." },
      { title:"Bước 4: Xem kết quả", detail:"Theo dõi số câu đúng/sai, điểm đạt được và gợi ý phần cần ôn lại." },
      { title:"Bước 5: Phụ huynh theo dõi", detail:"Vào khu vực phụ huynh để xem tóm tắt tiến bộ, đặt PIN và giới hạn thời gian học nếu cần." },
    ]
  },
  "demo-test2k": {
    desc: "Gói test 2.000 VND để kiểm tra nhanh luồng thanh toán tự động, webhook và giao key.",
    icon: "🧪",
    features: [
      { icon:"⚡", title:"Test nhanh", detail:"Giá nhỏ để chạy thử checkout" },
      { icon:"🔔", title:"Test webhook", detail:"Xác minh callback Sepay về hệ thống" },
      { icon:"🔑", title:"Test giao key", detail:"Kiểm tra cấp key tự động sau paid" },
      { icon:"📈", title:"Test vận hành", detail:"Đối soát dashboard và email thông báo" },
    ],
    guide: [
      { title:"Mua gói test", detail:"Chọn gói test 2K và tạo đơn hàng." },
      { title:"Thanh toán", detail:"Quét QR và chuyển khoản đúng số tiền hiển thị." },
      { title:"Chờ webhook", detail:"Hệ thống nhận webhook và tự động cập nhật paid." },
      { title:"Nhận key", detail:"Key test sẽ hiển thị ngay trên trang thanh toán sau vài giây." },
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
  },
  "prod-salon-manager-lifetime": {
    desc: "Salon Manager là phần mềm quản lý salon tóc theo mô hình 1 key / 1 máy, phù hợp vận hành lịch hẹn, khách hàng, dịch vụ và tính tiền tại quầy.",
    icon: "✂️",
    descImage: productImageLibrary.salon,
    features: [
      { icon:"📅", title:"Lịch hẹn tập trung", detail:"Xem lịch theo ngày, theo thợ và theo trạng thái phục vụ." },
      { icon:"👥", title:"Quản lý khách hàng", detail:"Lưu lịch sử làm tóc, ghi chú dị ứng và nhu cầu quay lại." },
      { icon:"💳", title:"Tính tiền nhanh", detail:"Tạo bill tại quầy, ghi nhận dịch vụ, số lượng và phương thức thanh toán." },
      { icon:"🖥️", title:"1 key / 1 máy", detail:"Bản quyền theo máy, phù hợp salon cần cài đặt ổn định tại quầy lễ tân." },
    ],
    guide: [
      { title:"Nhận key kích hoạt", detail:"Sau thanh toán, key bản quyền được giao tự động để kích hoạt trên đúng máy sử dụng." },
      { title:"Cài app salon", detail:"Nhận bộ cài và cài đặt trên máy vận hành chính của salon." },
      { title:"Nhập key", detail:"Mở ứng dụng → vào khu kích hoạt → nhập key để liên kết với mã máy hiện tại." },
      { title:"Bắt đầu vận hành", detail:"Thiết lập dịch vụ, nhân viên, lịch hẹn và sử dụng ngay tại quầy." },
    ]
  },
  "prod-bds-website-lifetime": {
    desc: "Phần mềm quản lý website và tin đăng bất động sản trọn đời theo đúng flow thực chiến: chọn web, mở web, soạn nội dung, lưu + copy, mở folder ảnh và đăng thủ công.",
    icon: "🏠",
    descImage: productImageLibrary.bds,
    longDescription: {
      highlights: [
        "Gom kho web đăng tin, tài khoản và mẫu nội dung vào một giao diện desktop gọn, dễ dùng.",
        "Tối ưu đúng quy trình sale BĐS: chọn web, mở web, sửa bài, lưu + copy, mở folder ảnh để kéo ảnh thủ công.",
        "Bản quyền trọn đời theo mô hình 1 key / 1 ID máy, phù hợp dùng ổn định trên máy làm việc chính.",
      ],
      sections: [
        {
          heading: "Tổng quan sản phẩm",
          paragraphs: [
            "Phần mềm được thiết kế cho sale và đội đăng tin bất động sản cần thao tác nhanh trên nhiều website mà không muốn mở quá nhiều ghi chú, file nháp và profile rời rạc.",
            "Thay vì quảng cáo như một hệ CRM lớn, sản phẩm tập trung đúng vào bài toán thao tác hàng ngày: mở đúng web, giữ đúng profile đăng nhập, chuẩn hóa nội dung bài và copy đi đăng thật nhanh.",
          ]
        },
        {
          heading: "Điểm nổi bật",
          paragraphs: [
            "Kho 40 website chọn lọc giúp người dùng tập trung vào các kênh đăng tin phổ biến và ổn định hơn.",
            "Phần nội dung có sẵn mẫu chiến dịch, footer chuẩn, lưu mẫu nhanh, xem trước bài hoàn chỉnh và copy ngay sang form đăng tin.",
          ]
        },
        {
          heading: "Lợi ích thực tế",
          paragraphs: [
            "Giảm thao tác lặp lại khi mỗi ngày phải đăng nhiều bài lên nhiều website khác nhau với cùng một bộ nội dung gốc.",
            "Mô hình 1 key / 1 ID máy giúp kiểm soát bản quyền rõ ràng, phù hợp cho cá nhân, đội sale nhỏ hoặc văn phòng cần cài trên máy chính.",
          ]
        }
      ]
    },
    features: [
      { icon:"🌐", title:"Kho web chọn lọc", detail:"Mở nhanh danh sách website đăng tin với URL đăng nhập, đăng tin và profile đúng web" },
      { icon:"✍️", title:"Soạn bài thực chiến", detail:"Nhập nội dung gốc, chèn footer chuẩn, xem trước bài hoàn chỉnh và copy ngay" },
      { icon:"🗂️", title:"Mẫu chiến dịch", detail:"Lưu nhiều mẫu bài, nạp lại nhanh cho từng khu vực hoặc từng loại tài sản" },
      { icon:"🖼️", title:"Mở folder ảnh", detail:"Mở đúng thư mục ảnh của chiến dịch để kéo ảnh thủ công lên website khi đăng" },
      { icon:"🖥️", title:"1 key / 1 ID máy", detail:"Key bản quyền gắn theo máy sử dụng chính, hạn chế dùng chung nhiều máy" },
    ],
    guide: [
      { title:"Bước 1: Nhận key kích hoạt", detail:"Key trọn đời giao tự động sau thanh toán để kích hoạt trên đúng máy đang làm việc." },
      { title:"Bước 2: Kích hoạt theo mã máy", detail:"Mở phần mềm → nhập key → hệ thống xác minh với ID máy hiện tại và vào app." },
      { title:"Bước 3: Chọn web và mở web", detail:"Tick website cần chạy rồi bấm Mở đã chọn để mở đúng profile và đúng URL đăng tin." },
      { title:"Bước 4: Soạn bài và Lưu + Copy", detail:"Chọn mẫu hoặc sửa nội dung mới, kiểm tra xem trước rồi bấm Lưu + Copy để dán sang web." },
      { title:"Bước 5: Mở folder ảnh", detail:"Bấm Mở folder để lấy ảnh chiến dịch và kéo ảnh thủ công lên website trước khi đăng." },
    ]
  },
  "prod-prompt-lifetime": {
    desc: "Video Creator là phần mềm tạo prompt và điều phối workflow AI video trong một nơi, giúp làm nhanh hơn, chuẩn hơn và đồng bộ hơn giữa nhiều clip.",
    icon: "🎬",
    descImage: productImageLibrary.video,
    longDescription: {
      highlights: [
        "Tạo prompt nhanh bằng preset, không phải viết tay dài mỗi lần.",
        "Giữ continuity nhân vật, bối cảnh, ánh sáng và mood giữa các clip.",
        "Quản lý tập trung tài nguyên và workflow AI video trong một hệ thống.",
      ],
      sections: [
        {
          heading: "Tổng quan sản phẩm",
          paragraphs: [
            "Video Creator - Phần mềm tạo prompt và điều phối AI Video trong một nơi. Công cụ được thiết kế cho người làm nội dung, chủ shop, marketer, agency, đội media và doanh nghiệp muốn tăng tốc làm video bằng AI nhưng vẫn kiểm soát chất lượng đầu ra.",
            "Thay vì nghĩ prompt từ đầu mỗi lần, mở nhiều tab, copy thủ công từng đoạn mô tả và lo clip sau bị lệch clip trước, Video Creator gom toàn bộ quá trình vào workflow gọn hơn, dễ dùng hơn và ổn định hơn.",
          ]
        },
        {
          heading: "Phần mềm này giải quyết vấn đề gì",
          paragraphs: [
            "Nhiều người dùng AI video gặp tình trạng prompt lúc hay lúc dở, clip sau lệch mặt hoặc lệch bối cảnh, phải gõ lại từ đầu, khó quản lý ảnh nhân vật/bối cảnh/ảnh mốc và tốn nhiều thời gian khi dựng video dài từ nhiều clip ngắn.",
            "Video Creator được tạo ra để xử lý các điểm nghẽn đó: chuẩn hóa prompt, tăng tính đồng bộ, tổ chức tài nguyên tốt hơn và giảm thao tác lặp lại.",
          ]
        },
        {
          heading: "Vì sao nên dùng thay vì làm thủ công",
          paragraphs: [
            "Làm thủ công thường thiếu ổn định prompt, dễ quên bố cục clip, khó giữ consistency và khó mở rộng số lượng clip. Video Creator đưa quá trình làm video AI từ cảm tính thành có hệ thống.",
            "Bạn có hệ thống prompt, preset, kho ảnh và logic continuity để phối hợp nhiều nền tảng AI video trong cùng workflow thực tế.",
          ]
        }
      ]
    },
    features: [
      { icon:"⚡", title:"Preset tạo prompt nhanh", detail:"Chọn nhanh chủ thể, phong cách, góc máy, ánh sáng, không khí, bối cảnh, chuyển động." },
      { icon:"🗂️", title:"Kho nhân vật và bối cảnh", detail:"Lưu và gọi lại ảnh nhân vật/bối cảnh/ảnh mốc để làm clip nối tiếp đồng bộ hơn." },
      { icon:"🔗", title:"Đa nền tảng AI video", detail:"Tối ưu workflow cho Flow, Runway, Pika, Kling, Hailuo, Luma, MiniMax và các nền tảng tương tự." },
      { icon:"🎞️", title:"3 kiểu tạo clip thực dụng", detail:"Clip mới, clip nối tiếp, clip riêng để ghép sau cho video dài từ nhiều đoạn ngắn." },
      { icon:"🧠", title:"Tăng continuity", detail:"Giữ ổn định nhân vật, trang phục, bối cảnh, ánh sáng, phong cách và hướng chuyển động." },
      { icon:"🤖", title:"Bán tự động hóa", detail:"Hỗ trợ map ảnh vào workflow, chuẩn bị prompt và tăng tốc thao tác theo flow làm việc." },
      { icon:"♾️", title:"Trọn đời", detail:"Mua một lần, dùng lâu dài, giảm gánh nặng viết prompt tay mỗi ngày." },
    ],
    guide: [
      { title:"Bước 1: Chọn nhân vật từ kho", detail:"Chọn ảnh nhân vật đã lưu để giữ nhất quán xuyên suốt chuỗi clip." },
      { title:"Bước 2: Chọn bối cảnh từ kho", detail:"Gọi lại bối cảnh/ảnh mốc thay vì tìm ảnh lại từ đầu mỗi lần." },
      { title:"Bước 3: Chọn preset nhanh", detail:"Chọn phong cách, góc máy, ánh sáng và chuyển động theo mục tiêu clip." },
      { title:"Bước 4: Sinh prompt chuẩn", detail:"Tạo prompt có cấu trúc rõ ràng, dễ kiểm thử và dễ tái sử dụng." },
      { title:"Bước 5: Đẩy sang nền tảng AI", detail:"Chuyển prompt sang nền tảng phù hợp để tạo clip mới hoặc clip nối tiếp." },
      { title:"Bước 6: Chọn clip tốt", detail:"Đánh giá đầu ra, giữ clip đạt quality và continuity tốt nhất." },
      { title:"Bước 7: Ghép video hoàn chỉnh", detail:"Ghép nhiều clip ngắn thành video dài đồng nhất và dễ sản xuất hàng loạt." },
    ]
  }
};

/* ── i18n minimal ── */
let lang = localStorage.getItem("wst_lang") || "vi";
let currentUser = null;
let currentProduct = null;
let selectedCheckoutProduct = null;
let catalogProducts = [];
let selectedPlanPeriod = "month";
let selectedPlanTier = "standard";
let selectedPlanUnavailable = false;
let selectedPlanPackage = "default";

const planBlueprintByApp = {
  hoctap: {
    periodLabels: { month: "Tháng", year: "Năm", lifetime: "Trọn đời" },
    tiers: [
      {
        key: "free",
        icon: "🌱",
        name: "Miễn phí",
        tag: "Đang dùng",
        saveByPeriod: { month: "", year: "", lifetime: "" },
        features: [
          "1 môn học (Toán)",
          "1 lớp",
          "1 hồ sơ học sinh",
          "Bài học + Luyện tập cơ bản",
          "Mini-Game ghép cặp",
          "6 giao diện miễn phí"
        ]
      },
      {
        key: "standard",
        icon: "⭐",
        name: "Tiêu chuẩn",
        tag: "Phổ biến nhất",
        saveByPeriod: { month: "Tiết kiệm 30%", year: "Tiết kiệm 44%", lifetime: "" },
        features: [
          "Tất cả môn học",
          "Tối đa 3 lớp",
          "3 hồ sơ học sinh",
          "Ôn tập thông minh AI",
          "Bảng phụ huynh cơ bản",
          "Phòng trí nhớ + TTS",
          "Báo cáo tiến độ cơ bản",
          "Không quảng cáo"
        ]
      },
      {
        key: "premium",
        icon: "👑",
        name: "Cao cấp",
        saveByPeriod: { month: "Tiết kiệm 35%", year: "Tiết kiệm 37%", lifetime: "" },
        features: [
          "Tất cả môn + tất cả lớp",
          "5 hồ sơ học sinh",
          "Toàn bộ tính năng AI nâng cao",
          "Thi đấu Bot & PvP",
          "Cửa hàng Avatar",
          "Ngoại tuyến + xuất backup",
          "Hỗ trợ ưu tiên 24/7",
          "Cập nhật nội dung sớm",
          "Badge & Theme độc quyền",
          "Báo cáo tiến bộ chi tiết",
          "Tùy chỉnh giáo trình"
        ]
      }
    ],
    prices: {
      month: { free: 0, standard: 89000, premium: 119000 },
      year: { free: 0, standard: 599000, premium: 899000 },
      lifetime: { free: 0, standard: 1299000, premium: 1599000 }
    },
    compareRows: [
      { label: "Số môn học", values: { free: "1", standard: "Tất cả", premium: "Tất cả" } },
      { label: "Số lớp", values: { free: "1", standard: "3", premium: "Tất cả" } },
      { label: "Hồ sơ học sinh", values: { free: "1", standard: "3", premium: "5" } },
      { label: "Thử thách hằng ngày", values: { free: false, standard: true, premium: true } },
      { label: "Thi đấu", values: { free: false, standard: false, premium: true } },
      { label: "Cửa hàng Avatar", values: { free: false, standard: false, premium: true } },
      { label: "Ôn tập thông minh", values: { free: false, standard: true, premium: true } },
      { label: "Bảng phụ huynh", values: { free: false, standard: true, premium: true } },
      { label: "Ngoại tuyến", values: { free: false, standard: false, premium: true } },
      { label: "Giọng đọc TTS", values: { free: false, standard: true, premium: true } },
      { label: "Xuất dữ liệu", values: { free: false, standard: false, premium: true } },
      { label: "Không quảng cáo", values: { free: false, standard: true, premium: true } },
      { label: "Badge & Theme", values: { free: false, standard: false, premium: true } },
      { label: "Hỗ trợ ưu tiên", values: { free: false, standard: false, premium: true } }
    ]
  }
};

const planProductIdMapByApp = {
  "app-study-12": {
    month: {
      standard: "prod-study-month",
      premium: "prod-study-premium-month"
    },
    year: {
      standard: "prod-study-year",
      premium: "prod-study-premium-year"
    },
    lifetime: {
      standard: "prod-study-standard-lifetime",
      premium: "prod-study-premium-lifetime"
    }
  }
};

const planPackageVariantByApp = {
  "app-study-12": {
    year: [
      {
        key: "default",
        label: "Gói 1 năm / 3 lớp",
        standardName: "Gói 1 năm / 3 lớp",
        standardPrice: 599000,
        standardSaveText: "3 hồ sơ học sinh"
      },
      {
        key: "onegrade",
        label: "Gói 1 năm / Lớp",
        standardName: "Gói 1 năm / Lớp",
        standardPrice: 299000,
        standardProductId: "standard_1year_1grade",
        standardTag: "Nhu cầu cao nhất",
        standardImage: productImageLibrary.study01Alt,
        standardFeatures: [
          "Tất cả môn học",
          "Đúng 1 lớp",
          "Tối đa 2 hồ sơ học sinh",
          "Ôn tập thông minh AI",
          "Bảng phụ huynh cơ bản",
          "Phòng trí nhớ + TTS",
          "Báo cáo tiến độ cơ bản",
          "Không quảng cáo"
        ],
        standardCompare: {
          classes: "1",
          profiles: "2"
        },
        standardSaveText: "2 hồ sơ học sinh"
      }
    ]
  }
};

function fmtVnd(v){
  return new Intl.NumberFormat("vi-VN",{style:"currency",currency:"VND"}).format(v);
}
function fmtCycle(c){
  if(c==="monthly") return "Hàng tháng";
  if(c==="yearly")  return "Hàng năm";
  return "Một lần";
}

function softwareCode(appId) {
  const raw = String(appId || "").trim();
  if (!raw) return "APP-UNKNOWN";
  const normalized = raw.toLowerCase();
  if (normalized === "app-study-12") return "APP-CAP01";
  if (normalized === "app-prompt-image-video") return "APP-VIDEO-CREATOR";
  if (normalized === "app-bds-website-manager") return "APP-BDS-WEB";
  if (normalized === "hair-spa-manager") return "APP-SALON";
  return raw.toUpperCase().replace(/[^A-Z0-9-]/g, "-");
}

function shouldUseSameTabCheckout() {
  if (typeof window === "undefined") return false;
  const mobileByWidth = window.matchMedia && window.matchMedia("(max-width: 768px)").matches;
  const mobileByUa = /Android|iPhone|iPad|iPod|Mobile/i.test(navigator.userAgent || "");
  return mobileByWidth || mobileByUa;
}

function isExternalLink(value) {
  return /^(https?:)?\/\//i.test(String(value || "").trim()) || /^tel:/i.test(String(value || "").trim());
}

function resolveDownloadAction(product, content) {
  const customLink = String(content?.downloadUrl || "").trim();
  const appId = String(product?.appId || "").trim().toLowerCase();

  if (appId === "app-study-12") {
    return {
      href: customLink || "https://hoctap-cap-01.vercel.app/",
      label: "⬇ Mở app học tập",
      external: true
    };
  }

  if (customLink && !/(hair-spa-manager|app-bds-website-manager|app-prompt-image-video|lamviec|app-cap12)/i.test(appId)) {
    return {
      href: customLink,
      label: "⬇ Tải app",
      external: isExternalLink(customLink)
    };
  }

  return {
    href: "/account?tab=downloads",
    label: "🔐 Xem tải app sau mua",
    external: false
  };
}

function openDownloadAction(product, content) {
  const action = resolveDownloadAction(product, content);
  if (!action?.href) {
    return;
  }

  if (action.external) {
    if (shouldUseSameTabCheckout()) {
      window.location.assign(action.href);
      return;
    }
    window.open(action.href, "_blank", "noopener");
    return;
  }

  window.location.href = action.href;
}

function escapeHtml(value) {
  return String(value || "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/\"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function renderLongDescription(content, productName) {
  if (!content?.longDescription) return "";

  const highlights = (content.longDescription.highlights || []).map(item =>
    `<li>${escapeHtml(item)}</li>`
  ).join("");

  const sections = (content.longDescription.sections || []).map(section => {
    const heading = section?.heading ? `<h4>${escapeHtml(section.heading)}</h4>` : "";
    const paragraphs = (section?.paragraphs || []).map(paragraph =>
      `<p>${escapeHtml(paragraph)}</p>`
    ).join("");
    return `<section class="pd-long-section">${heading}${paragraphs}</section>`;
  }).join("");

  const media = content.descImage
    ? `<figure class="pd-desc-media"><img src="${content.descImage}" alt="Mô tả ${escapeHtml(productName)}"></figure>`
    : "";

  const highlightsBlock = highlights
    ? `<div class="pd-desc-highlights"><h4>Giá trị cốt lõi</h4><ul>${highlights}</ul></div>`
    : "";

  return `<div class="pd-long-desc">${media}${highlightsBlock}${sections}</div>`;
}

function getPlanBlueprint(product) {
  const app = normalizeText(product?.appId);
  if (app.includes("hoc") || app.includes("study")) {
    return planBlueprintByApp.hoctap;
  }
  return null;
}

function periodFromCycle(cycle) {
  if (cycle === "monthly") return "month";
  if (cycle === "yearly") return "year";
  return "lifetime";
}

function cycleFromPeriod(period) {
  if (period === "month") return "monthly";
  if (period === "year") return "yearly";
  return "one_time";
}

function labelFromPeriod(period) {
  if (period === "month") return "Hàng tháng";
  if (period === "year") return "Hàng năm";
  return "Trọn đời";
}

function formatPlanPrice(value) {
  if (!value) return "Miễn phí";
  return `${Number(value).toLocaleString("vi-VN")}đ`;
}

function inferTierByProduct(targets, product) {
  if (!product) return "standard";
  const found = Object.entries(targets).find(([, p]) => p && p.id === product.id);
  return found ? found[0] : "standard";
}

function pickPlanTargets(appId, period, fallbackProduct) {
  const appKey = String(appId || "");
  const explicitMap = planProductIdMapByApp[appKey]?.[period];
  if (explicitMap) {
    const fromMap = { free: null, standard: null, premium: null };
    if (explicitMap.standard) {
      fromMap.standard = catalogProducts.find((item) => item.id === explicitMap.standard) || null;
    }
    if (explicitMap.premium) {
      fromMap.premium = catalogProducts.find((item) => item.id === explicitMap.premium) || null;
    }
    if (fromMap.standard || fromMap.premium) {
      return fromMap;
    }
  }

  const cycle = cycleFromPeriod(period);
  const pool = catalogProducts
    .filter((item) => !isInternalTestProduct(item))
    .filter((item) => String(item.appId || "").toLowerCase() === String(appId || "").toLowerCase())
    .filter((item) => item.cycle === cycle)
    .sort((a, b) => Number(a.price || 0) - Number(b.price || 0));

  const targets = { free: null, standard: null, premium: null };
  if (!pool.length) {
    if (fallbackProduct && fallbackProduct.cycle === cycle) {
      targets.standard = fallbackProduct;
      targets.premium = fallbackProduct;
    }
    return targets;
  }

  if (pool.length === 1) {
    targets.standard = pool[0];
    targets.premium = pool[0];
    return targets;
  }

  const stdIndex = Math.max(0, Math.floor((pool.length - 1) / 2));
  targets.standard = pool[stdIndex];
  targets.premium = pool[pool.length - 1];

  if (fallbackProduct && fallbackProduct.cycle === cycle) {
    targets.standard = fallbackProduct;
  }
  return targets;
}

function getPackageVariants(appId, period) {
  return planPackageVariantByApp?.[String(appId || "")]?.[period] || [];
}

function shouldRenderSeparateStandardCards(appId, period) {
  const normalizedAppId = String(appId || "").trim().toLowerCase();
  return normalizedAppId === "app-study-12" && period === "year" && getPackageVariants(appId, period).length > 1;
}

function getDefaultPackageKey(appId, period) {
  const variants = getPackageVariants(appId, period);
  if (!variants.length) return "default";
  return variants[0].key;
}

function inferPackageKeyByProduct(appId, period, productId) {
  const normalizedProductId = String(productId || "").trim().toLowerCase();
  if (!normalizedProductId) {
    return null;
  }

  const variants = getPackageVariants(appId, period);
  const matched = variants.find((item) => String(item.standardProductId || "").trim().toLowerCase() === normalizedProductId);
  if (matched) {
    return matched.key;
  }

  const defaultProductId = planProductIdMapByApp?.[String(appId || "")]?.[period]?.standard;
  if (String(defaultProductId || "").trim().toLowerCase() === normalizedProductId) {
    return "default";
  }

  return null;
}

function getSelectedPackageVariant(appId, period) {
  const variants = getPackageVariants(appId, period);
  if (!variants.length) return null;
  return variants.find((item) => item.key === selectedPlanPackage) || variants[0];
}

function renderPlanCompare(blueprint, variant = null) {
  const compare = document.getElementById("pdPlanCompare");
  const tiers = blueprint?.tiers || [];
  const compareOverride = variant?.standardCompare || null;
  const rows = (blueprint?.compareRows || []).map((row) => {
    const rowValues = { ...(row.values || {}) };
    if (compareOverride && row.label === "Số lớp" && compareOverride.classes) {
      rowValues.standard = String(compareOverride.classes);
    }
    if (compareOverride && row.label === "Hồ sơ học sinh" && compareOverride.profiles) {
      rowValues.standard = String(compareOverride.profiles);
    }

    const cells = tiers.map((tierItem) => {
      const value = rowValues?.[tierItem.key];
      if (typeof value === "boolean") {
        return value ? '<td class="pd-plan-tick">✓</td>' : '<td class="pd-plan-miss">✕</td>';
      }
      return `<td>${escapeHtml(value ?? "")}</td>`;
    }).join("");

    return `<tr><td>${escapeHtml(row.label)}</td>${cells}</tr>`;
  }).join("");

  compare.innerHTML = `
    <table class="pd-plan-table">
      <thead>
        <tr>
          <th>Tính năng</th>
          ${tiers.map((tier) => `<th>${tier.icon} ${escapeHtml(tier.name)}</th>`).join("")}
        </tr>
      </thead>
      <tbody>${rows}</tbody>
    </table>`;
}

async function startCheckoutForProduct(product) {
  if (!product) {
    alert("Gói này chưa mở bán ở chu kỳ bạn chọn.");
    return;
  }

  const salePresentation = getProductSalePresentation(product);
  if (salePresentation.disabled) {
    alert(salePresentation.note);
    return;
  }

  if (!currentUser) {
    showLoginTab();
    loginModal.classList.add("show");
    return;
  }

  try {
    const res = await fetch("/api/orders", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ appId: product.appId, productId: product.id })
    });
    const d = await res.json();
    if (!res.ok) {
      alert(d.message || "Không tạo được đơn hàng");
      return;
    }
    if (shouldUseSameTabCheckout()) {
      window.location.assign(d.checkoutUrl);
      return;
    }
    window.open(d.checkoutUrl, "_blank");
  } catch {
    alert("Preview mode: API/DB chưa sẵn sàng.");
  }
}

function renderPlanZone(product) {
  const zone = document.getElementById("pdPlanZone");
  const tierToggle = document.getElementById("pdTierToggle");
  const toggle = document.getElementById("pdPlanToggle");
  const zoneToggle = document.getElementById("pdPlanToggleZone");
  const packageRow = document.getElementById("pdPackageFilterRow");
  const packageToggle = document.getElementById("pdPackageToggle");
  const packageRowTop = document.getElementById("pdBuyPackageRow");
  const packageToggleTop = document.getElementById("pdPackageToggleTop");
  const grid = document.getElementById("pdPlanGrid");
  const compare = document.getElementById("pdPlanCompare");
  const compareBtn = document.getElementById("pdCompareToggle");
  const blueprint = getPlanBlueprint(product);

  if (!zone || !tierToggle || !toggle || !grid || !compare || !compareBtn) {
    return;
  }

  if (!blueprint) {
    zone.classList.add("is-hidden");
    return;
  }

  zone.classList.remove("is-hidden");
  selectedPlanPeriod = periodFromCycle(product.cycle);
  selectedPlanPackage = inferPackageKeyByProduct(product.appId, selectedPlanPeriod, product.id)
    || getDefaultPackageKey(product.appId, selectedPlanPeriod);

  const initialTargets = pickPlanTargets(product.appId, selectedPlanPeriod, product);
  selectedPlanTier = inferTierByProduct(initialTargets, product);

  const periods = ["month", "year", "lifetime"];
  const periodButtons = periods.map((period) => `
    <button class="pd-plan-period-btn ${selectedPlanPeriod === period ? "is-active" : ""}" data-period="${period}" type="button">
      ${blueprint.periodLabels[period]}
    </button>`).join("");
  toggle.innerHTML = periodButtons;
  if (zoneToggle) {
    zoneToggle.innerHTML = periodButtons;
  }

  const tierButtons = blueprint.tiers.map((tier) => `
    <button class="pd-plan-tier-btn ${selectedPlanTier === tier.key ? "is-active" : ""}" data-tier="${tier.key}" type="button">
      ${tier.icon} ${escapeHtml(tier.name)}
    </button>`).join("");
  tierToggle.innerHTML = tierButtons;

  function syncPeriodButtons() {
    [toggle, zoneToggle].filter(Boolean).forEach((container) => {
      container.querySelectorAll(".pd-plan-period-btn").forEach((btn) => {
        btn.classList.toggle("is-active", btn.dataset.period === selectedPlanPeriod);
      });
    });
  }

  function bindPeriodToggle(container) {
    if (!container) return;
    container.querySelectorAll(".pd-plan-period-btn").forEach((button) => {
      button.addEventListener("click", () => {
        selectedPlanPeriod = button.dataset.period;
        selectedPlanPackage = getDefaultPackageKey(product.appId, selectedPlanPeriod);
        syncPeriodButtons();
        paintPlanCards();
      });
    });
  }

  function renderPackageToggle() {
    const packageRows = [packageRow, packageRowTop].filter(Boolean);
    const packageToggles = [packageToggle, packageToggleTop].filter(Boolean);
    if (!packageRows.length || !packageToggles.length) return;

    const variants = getPackageVariants(product.appId, selectedPlanPeriod);
    if (!variants.length) {
      packageRows.forEach((row) => row.classList.add("is-hidden"));
      packageToggles.forEach((toggleNode) => {
        toggleNode.innerHTML = "";
      });
      selectedPlanPackage = getDefaultPackageKey(product.appId, selectedPlanPeriod);
      return;
    }

    packageRows.forEach((row) => row.classList.remove("is-hidden"));
    const activeKey = variants.some((item) => item.key === selectedPlanPackage)
      ? selectedPlanPackage
      : variants[0].key;
    selectedPlanPackage = activeKey;

    const buttonsHtml = variants.map((variant) => `
      <button class="pd-plan-period-btn ${variant.key === activeKey ? "is-active" : ""} ${variant.key === "onegrade" ? "is-recommended" : ""}" data-package="${variant.key}" type="button">
        ${escapeHtml(variant.label)}
      </button>
    `).join("");

    packageToggles.forEach((toggleNode) => {
      toggleNode.innerHTML = buttonsHtml;
    });

    packageToggles.forEach((toggleNode) => {
      toggleNode.querySelectorAll(".pd-plan-period-btn").forEach((button) => {
        button.addEventListener("click", () => {
          selectedPlanTier = "standard";
          selectedPlanPackage = button.dataset.package || "default";
          renderPackageToggle();
          paintPlanCards(false);
        });
      });
    });
  }

  function paintPlanCards(renderPackage = true) {
    if (renderPackage) {
      renderPackageToggle();
    }

    const variant = getSelectedPackageVariant(product.appId, selectedPlanPeriod);
    renderPlanCompare(blueprint, variant);
    const basePrices = blueprint.prices[selectedPlanPeriod] || blueprint.prices.month;
    const prices = { ...basePrices };
    if (variant && Number(variant.standardPrice) > 0) {
      prices.standard = Number(variant.standardPrice);
    }

    const baseTargets = pickPlanTargets(product.appId, selectedPlanPeriod, product);
    const targets = { ...baseTargets };
    if (variant?.standardProductId && selectedPlanPeriod === "year") {
      const fromCatalog = catalogProducts.find((item) => item.id === variant.standardProductId) || null;
      targets.standard = fromCatalog || {
        id: variant.standardProductId,
        appId: product.appId,
        name: product.name,
        cycle: cycleFromPeriod(selectedPlanPeriod),
        price: Number(prices.standard || 0)
      };
    }

    const renderSeparateStandardCards = shouldRenderSeparateStandardCards(product.appId, selectedPlanPeriod);
    grid.classList.toggle("has-four-cards", renderSeparateStandardCards);

    const tierExists = blueprint.tiers.some((tier) => tier.key === selectedPlanTier);
    if (!tierExists) {
      selectedPlanTier = targets.standard ? "standard" : "free";
    }

    const selectedTarget = targets[selectedPlanTier] || null;
    const selectedPrice = Number(prices?.[selectedPlanTier] || 0);
    const selectedTargetPrice = Number(selectedTarget?.price || 0);
    const selectedPriceMatched = selectedTarget && selectedTargetPrice === selectedPrice;
    const selectedDisplayPrice = selectedTarget ? getProductDisplayPrice(selectedTarget) : getProductDisplayPrice({ price: selectedPrice });
    selectedPlanUnavailable = selectedPlanTier !== "free" && !selectedPriceMatched;
    selectedCheckoutProduct = (selectedPlanTier === "free" || selectedPlanUnavailable) ? null : selectedTarget;
    document.getElementById("pdPrice").innerHTML = selectedDisplayPrice.hasDirectSale
      ? `${fmtVnd(selectedDisplayPrice.effectivePrice)} <span class="p-card-old-price" style="font-size:.95rem">${fmtVnd(selectedDisplayPrice.comparePrice)}</span>`
      : fmtVnd(selectedDisplayPrice.effectivePrice);
    document.getElementById("pdCycle").textContent = `Loại: ${labelFromPeriod(selectedPlanPeriod)}`;
    updateBuyBtn();

    tierToggle.querySelectorAll(".pd-plan-tier-btn").forEach((btn) => {
      btn.classList.toggle("is-active", btn.dataset.tier === selectedPlanTier);
    });

    const tierByKey = Object.fromEntries(blueprint.tiers.map((item) => [item.key, item]));
    const standardVariants = renderSeparateStandardCards
      ? getPackageVariants(product.appId, selectedPlanPeriod)
      : [variant || null];

    const resolveStandardTarget = (standardVariant) => {
      if (standardVariant?.standardProductId) {
        return catalogProducts.find((item) => item.id === standardVariant.standardProductId) || {
          id: standardVariant.standardProductId,
          appId: product.appId,
          name: standardVariant.standardName || product.name,
          cycle: cycleFromPeriod(selectedPlanPeriod),
          price: Number(standardVariant.standardPrice || 0)
        };
      }
      return baseTargets.standard;
    };

    const cardEntries = [
      { tier: tierByKey.free, standardVariant: null },
      ...standardVariants.map((standardVariant) => ({ tier: tierByKey.standard, standardVariant })),
      { tier: tierByKey.premium, standardVariant: null }
    ].filter((entry) => entry.tier);

    grid.innerHTML = cardEntries.map(({ tier, standardVariant }) => {
      const isStandardCard = tier.key === "standard";
      const price = isStandardCard
        ? Number(standardVariant?.standardPrice || basePrices.standard || 0)
        : Number(prices?.[tier.key] || 0);
      const saveText = isStandardCard && standardVariant?.standardSaveText
        ? String(standardVariant.standardSaveText).trim()
        : String(tier.saveByPeriod?.[selectedPlanPeriod] || "").trim();
      const featureList = isStandardCard && Array.isArray(standardVariant?.standardFeatures)
        ? standardVariant.standardFeatures
        : (tier.features || []);
      const features = featureList.map((item) => `<li>${escapeHtml(item)}</li>`).join("");
      const targetProduct = isStandardCard ? resolveStandardTarget(standardVariant) : targets[tier.key];
      const targetPrice = Number(targetProduct?.price || 0);
      const isPurchasable = tier.key !== "free" && !!targetProduct && targetPrice === price;
      const isCurrent = targetProduct && currentProduct && targetProduct.id === currentProduct.id;
      const isSelected = isStandardCard
        ? selectedPlanTier === "standard" && selectedPlanPackage === (standardVariant?.key || "default")
        : tier.key === selectedPlanTier;
      const buyLabel = tier.key === "free" ? "Đang dùng" : (isPurchasable ? "Thanh toán QR" : "Chưa mở bán");
      const unit = selectedPlanPeriod === "month" ? "/tháng" : selectedPlanPeriod === "year" ? "/năm" : "(1 lần)";
      const topTag = isStandardCard && standardVariant?.standardTag ? standardVariant.standardTag : tier.tag;
      const media = isStandardCard && standardVariant?.standardImage
        ? `<figure class="pd-plan-media"><img src="${standardVariant.standardImage}" alt="${escapeHtml(standardVariant.label || "Gói nổi bật")}"></figure>`
        : "";
      const displayName = isStandardCard && standardVariant?.standardName
        ? standardVariant.standardName
        : tier.name;
      const packageKey = isStandardCard ? (standardVariant?.key || "default") : "";

      return `
        <article class="pd-plan-card ${isCurrent ? "is-current" : ""} ${isSelected ? "is-selected" : "is-muted"} ${isStandardCard && standardVariant?.key === "onegrade" ? "is-hot" : ""}" data-tier="${tier.key}" data-package="${escapeHtml(packageKey)}">
          ${topTag ? `<span class="pd-plan-top-tag">${escapeHtml(topTag)}</span>` : ""}
          ${media}
          <p class="pd-plan-tier">${tier.icon}</p>
          <h3 class="pd-plan-name">${escapeHtml(displayName)}</h3>
          <p class="pd-plan-price">${formatPlanPrice(price)}</p>
          <p class="pd-plan-unit">${unit}</p>
          <p class="pd-plan-save">${escapeHtml(saveText)}</p>
          <ul class="pd-plan-features">${features}</ul>
          <div class="pd-plan-actions">
            <button class="pd-plan-buy" type="button" data-target-id="${isPurchasable ? (targetProduct?.id || "") : ""}" data-target-app="${escapeHtml(targetProduct?.appId || product.appId)}" data-target-cycle="${escapeHtml(targetProduct?.cycle || cycleFromPeriod(selectedPlanPeriod))}" data-target-price="${String(price)}" ${tier.key === "free" || !isPurchasable ? "disabled" : ""}>${buyLabel}</button>
            <button class="pd-plan-activate" type="button">Nhập mã kích hoạt</button>
          </div>
        </article>`;
    }).join("");

    grid.querySelectorAll(".pd-plan-card").forEach((card) => {
      card.addEventListener("click", (event) => {
        if (event.target.closest("button")) {
          return;
        }
        selectedPlanTier = card.dataset.tier || selectedPlanTier;
        if (card.dataset.package) {
          selectedPlanPackage = card.dataset.package;
        }
        paintPlanCards(false);
      });
    });

    grid.querySelectorAll(".pd-plan-buy").forEach((button) => {
      button.addEventListener("click", async () => {
        const targetId = button.dataset.targetId;
        const target =
          catalogProducts.find((item) => item.id === targetId)
          || (currentProduct?.id === targetId ? currentProduct : null)
          || (targetId ? {
            id: targetId,
            appId: button.dataset.targetApp || product.appId,
            cycle: button.dataset.targetCycle || cycleFromPeriod(selectedPlanPeriod),
            price: Number(button.dataset.targetPrice || 0)
          } : null);
        await startCheckoutForProduct(target);
      });
    });

    grid.querySelectorAll(".pd-plan-activate").forEach((button) => {
      button.addEventListener("click", () => {
        if (!currentUser) {
          showLoginTab();
          loginModal.classList.add("show");
          return;
        }
        openDownloadAction(target || currentProduct || product, productContent[(target || currentProduct || product)?.id] || null);
      });
    });
  }

  paintPlanCards();

  tierToggle.querySelectorAll(".pd-plan-tier-btn").forEach((button) => {
    button.addEventListener("click", () => {
      selectedPlanTier = button.dataset.tier;
      paintPlanCards();
    });
  });

  bindPeriodToggle(toggle);
  bindPeriodToggle(zoneToggle);

  compareBtn.onclick = () => {
    const opening = compare.classList.contains("is-hidden");
    compare.classList.toggle("is-hidden");
    compareBtn.textContent = opening ? "Ẩn bảng so sánh chi tiết" : "Mở bảng so sánh chi tiết";
  };
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
const mobileMenuBtn = document.getElementById("mobileMenuBtn");
const headerNav = document.getElementById("headerNav");

mobileMenuBtn?.addEventListener("click", ()=>headerNav?.classList.toggle("open"));

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
  const hasPlanBlueprint = !!getPlanBlueprint(currentProduct);
  const active = hasPlanBlueprint ? selectedCheckoutProduct : (selectedCheckoutProduct || currentProduct);
  if(!btn||!currentProduct) return;
  const salePresentation = getProductSalePresentation(active || currentProduct);
  if (salePresentation.disabled) {
    btn.textContent = salePresentation.buttonLabel;
    btn.disabled = true;
    if(note) note.textContent = salePresentation.note;
    return;
  }
  if (hasPlanBlueprint && selectedPlanUnavailable) {
    btn.textContent = "⏳ Sắp mở bán";
    btn.disabled = true;
    if(note) note.textContent = "Chu kỳ/gói này chưa có mã sản phẩm đúng giá, tạm thời chưa thanh toán được.";
    return;
  }
  if(!active){
    btn.textContent = "🆓 Gói miễn phí";
    btn.disabled = true;
    if(note) note.textContent = hasPlanBlueprint
      ? "Đăng nhập vào app bằng tài khoản web là dùng được gói Free. Muốn Standard/Premium, hãy mua gói rồi nhập mã kích hoạt trong app."
      : "Bạn có thể dùng gói miễn phí ngay không cần thanh toán.";
    return;
  }

  btn.disabled = false;
  if(!currentUser){
    btn.textContent = salePresentation.buttonLabel;
    if(note) note.textContent = "Cần đăng nhập để tiến hành mua hàng";
  } else {
    btn.textContent = salePresentation.buttonLabel;
    if(note) note.textContent = "Key giao tự động sau thanh toán thành công";
  }
}

document.getElementById("pdBuyBtn").addEventListener("click", async ()=>{
  if(!currentProduct) return;
  const hasPlanBlueprint = !!getPlanBlueprint(currentProduct);
  const active = hasPlanBlueprint ? selectedCheckoutProduct : (selectedCheckoutProduct || currentProduct);
  await startCheckoutForProduct(active);
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
      catalogProducts = list.filter((item) => !isInternalTestProduct(item));
      product = list.find(p=>p.id===productId);
    }
  } catch{}

  // fallback
  if(!catalogProducts.length){
    catalogProducts = fallbackProducts.filter((item) => !isInternalTestProduct(item));
  }
  if(!product) product = catalogProducts.find(p=>p.id===productId);

  if(product && isInternalTestProduct(product)){
    product = null;
  }

  if(!product){
    document.getElementById("pdLoading").classList.add("is-hidden");
    document.getElementById("pdNotFound").classList.remove("is-hidden");
    return;
  }

  currentProduct = product;
  selectedCheckoutProduct = product;
  renderProduct(product);
}

function renderProduct(p){
  const productName = canonicalProductName(p);

  document.title = `${productName} – Ứng Dụng Thông Minh`;
  document.getElementById("pdBreadName").textContent = productName;

  // main image
  const imgEl = document.getElementById("pdMainImg");
  const resolvedImage = resolveProductImage(p);
  if(resolvedImage){
    imgEl.innerHTML = `<img src="${resolvedImage}" alt="${productName}">`;
  } else {
    const icons = {hoctap:"📚",lamviec:"💼"};
    imgEl.textContent = icons[(p.appId||"").toLowerCase()] || "📦";
  }

  // buy box
  const salePresentation = getProductSalePresentation(p);
  document.getElementById("pdCatBadge").textContent = salePresentation.badge
    ? `${softwareCode(p.appId)} · ${salePresentation.badge}`
    : softwareCode(p.appId);
  document.getElementById("pdTitle").textContent = productName;
  document.getElementById("pdCycle").textContent = `Loại: ${fmtCycle(p.cycle)} · ${p.credits} credit${p.credits>1?"s":""}`;
  document.getElementById("pdPrice").innerHTML = renderProductPriceHtml(p);
  updateBuyBtn();
  renderPlanZone(p);

  // content from productContent map
  const content = productContent[p.id] || {
    desc: `${productName} — Sản phẩm phần mềm chất lượng cao, giao key tự động sau thanh toán.`,
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

  const downloadBtn = document.getElementById("pdDownloadAppBtn");
  if (downloadBtn) {
    const action = resolveDownloadAction(p, content);
    downloadBtn.href = action.href;
    downloadBtn.textContent = action.label;
    if (action.external) {
      downloadBtn.target = "_blank";
      downloadBtn.rel = "noopener";
    } else {
      downloadBtn.removeAttribute("target");
      downloadBtn.removeAttribute("rel");
    }
  }

  // desc tab
  document.getElementById("pdDescIcon").textContent = content.icon;
  document.getElementById("pdDescTitle").textContent = productName;
  const featureHtml = content.features.map(f=>
    `<div class="pd-feature">
      <div class="pd-feature-icon">${f.icon}</div>
      <div class="pd-feature-text"><strong>${f.title}</strong><span>${f.detail}</span></div>
    </div>`
  ).join("");
  document.getElementById("pdFeatureList").innerHTML = `${renderLongDescription(content, productName)}${featureHtml}`;

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
