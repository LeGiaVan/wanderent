/* =====================================================================
   WANDERENT — JS dùng chung: dữ liệu, tiện ích, header, footer
   Cần nạp sau data.js:  <script src="assets/js/data.js"></script>
   ===================================================================== */
(function () {
  "use strict";

  const PRODUCTS = window.WANDERENT_PRODUCTS || [];

  // ---- Cấu hình nghiệp vụ -------------------------------------------------
  // Tỉ lệ đặt cọc lấy từ bộ nhận diện ("Đặt cọc 30%").
  const DEPOSIT_RATE = 0.3;
  // Giá thuê CHƯA CÓ trong dữ liệu crawl (gia_goc chỉ là giá bán tham khảo).
  // Khi nhóm chốt giá thuê, điền vào đây theo ma_sp, ví dụ { LEU01: 120000 } (VNĐ / ngày).
  const RENT_PRICE_PER_DAY = {};

  // Thứ tự + slug của 4 danh mục (slug dùng trên URL: products.html?dm=leu)
  const CATEGORIES = [
    { slug: "leu", name: "Lều", desc: "Lều cắm trại, lều che nắng, lều gia đình" },
    { slug: "tui-ngu", name: "Túi ngủ", desc: "Túi ngủ mùa đông, siêu nhẹ, phong bì" },
    { slug: "sup", name: "SUP", desc: "Ván chèo đứng bơm hơi" },
    { slug: "bep", name: "Bếp và dụng cụ ăn uống", desc: "Bếp gas, bếp nướng, bộ nấu ăn" },
  ];

  // Màu hiển thị cho chấm màu (tên màu lấy nguyên từ dữ liệu)
  const COLOR_HEX = {
    "xanh rêu": "#4F7A61", "xanh dương": "#2F6DB5", "xanh lá": "#3E8E41", "kaki": "#C3AE8A",
    "red": "#C0392B", "mint": "#8FD3C1", "ghi": "#8E9194", "cam": "#E07B39", "nâu": "#7B4B2A",
    "đen": "#2E3131", "vàng": "#E8B931", "trắng": "#FFFFFF",
  };

  // ---- Tiện ích -------------------------------------------------------------
  const esc = (s) => String(s ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
  const vnd = (n) => (n == null || isNaN(n) ? "—" : Number(n).toLocaleString("vi-VN") + " đ");
  // Bỏ đuôi mã nội bộ của shop nguồn: "... - 6215", "... – 8360"
  const cleanName = (name) => String(name).replace(/\s+[-–]\s*\d{3,5}\s*$/, "").trim();
  const images = (variant) => (variant?.link_anh || "").split(";").map((s) => s.trim()).filter(Boolean);
  const catBySlug = (slug) => CATEGORIES.find((c) => c.slug === slug);
  const catByName = (name) => CATEGORIES.find((c) => c.name === name);
  const byId = (id) => PRODUCTS.find((p) => p.ma_sp === id);
  const hasColors = (p) => p.variants.some((v) => v.mau_sac);
  const minPrice = (p) => Math.min(...p.variants.map((v) => Number(v.gia_goc) || Infinity));
  const rentPrice = (p) => RENT_PRICE_PER_DAY[p.ma_sp] ?? null;

  // "Tên: giá trị; Tên: giá trị" -> [[tên, giá trị], ...]
  const parseSpecs = (s) =>
    String(s || "").split(";").map((x) => x.trim()).filter(Boolean).map((x) => {
      const i = x.indexOf(":");
      return i < 0 ? ["", x] : [x.slice(0, i).trim(), x.slice(i + 1).trim()];
    });

  // Màu (hỗ trợ màu ghép "Đen/Xanh lá" -> chấm chia đôi)
  const colorStyle = (name) => {
    const parts = String(name).toLowerCase().split("/").map((s) => s.trim());
    const hex = parts.map((p) => COLOR_HEX[p] || "#D9D4CC");
    return hex.length > 1
      ? `background: linear-gradient(135deg, ${hex[0]} 50%, ${hex[1]} 50%)`
      : `background: ${hex[0]}`;
  };

  // ---- Ngày thuê (lưu tạm trong trình duyệt để mang sang trang khác) ----------
  const DATE_KEY = "wanderent_dates";
  const toISO = (d) => d.toISOString().slice(0, 10);
  const defaultDates = () => {
    const a = new Date(); a.setDate(a.getDate() + 1);
    const b = new Date(a); b.setDate(b.getDate() + 2);
    return { from: toISO(a), to: toISO(b) };
  };
  const getDates = () => {
    try {
      const d = JSON.parse(localStorage.getItem(DATE_KEY));
      if (d && d.from && d.to) return d;
    } catch (e) { /* bỏ qua */ }
    return defaultDates();
  };
  const setDates = (d) => { try { localStorage.setItem(DATE_KEY, JSON.stringify(d)); } catch (e) { /* bỏ qua */ } };
  const daysBetween = (from, to) => Math.max(1, Math.round((new Date(to) - new Date(from)) / 86400000));

  // Giỏ thuê demo (chỉ đếm số lượng)
  const CART_KEY = "wanderent_cart";
  const getCart = () => { try { return JSON.parse(localStorage.getItem(CART_KEY)) || []; } catch (e) { return []; } };
  const addToCart = (item) => {
    const cart = getCart(); cart.push(item);
    try { localStorage.setItem(CART_KEY, JSON.stringify(cart)); } catch (e) { /* bỏ qua */ }
    updateCartCount();
  };
  const updateCartCount = () => {
    const el = document.querySelector("[data-cart-count]");
    if (el) { const n = getCart().length; el.textContent = n; el.hidden = n === 0; }
  };

  // ---- Icon (SVG nét, không dùng emoji) ---------------------------------------
  const ICONS = {
    search: '<circle cx="11" cy="11" r="7"/><path d="m20 20-3.5-3.5"/>',
    user: '<circle cx="12" cy="8" r="4"/><path d="M4 21a8 8 0 0 1 16 0"/>',
    bag: '<path d="M5 8h14l-1 13H6L5 8Z"/><path d="M9 8V6a3 3 0 0 1 6 0v2"/>',
    calendar: '<rect x="3" y="5" width="18" height="16" rx="2"/><path d="M3 10h18M8 3v4M16 3v4"/>',
    chevron: '<path d="m6 9 6 6 6-6"/>',
    arrow: '<path d="M5 12h14M13 6l6 6-6 6"/>',
    menu: '<path d="M4 6h16M4 12h16M4 18h16"/>',
    close: '<path d="M6 6l12 12M18 6 6 18"/>',
    laptop: '<rect x="4" y="5" width="16" height="11" rx="1.5"/><path d="M2 19h20"/>',
    shield: '<path d="M12 3 4 6v6c0 5 3.5 8 8 9 4.5-1 8-4 8-9V6l-8-3Z"/><path d="m9 12 2 2 4-4"/>',
    mountain: '<path d="m2 20 7-12 4 6 3-4 6 10H2Z"/><path d="m7.5 10.5 1.5 1.5 1.5-1.5"/>',
    check: '<circle cx="12" cy="12" r="9"/><path d="m8 12 3 3 5-6"/>',
    coins: '<ellipse cx="12" cy="6" rx="7" ry="3"/><path d="M5 6v6c0 1.7 3.1 3 7 3s7-1.3 7-3V6"/><path d="M5 12v6c0 1.7 3.1 3 7 3s7-1.3 7-3v-6"/>',
    refresh: '<path d="M20 11a8 8 0 0 0-14.9-3.5M4 4v4h4"/><path d="M4 13a8 8 0 0 0 14.9 3.5M20 20v-4h-4"/>',
    tent: '<path d="M3 20 12 4l9 16H3Z"/><path d="m12 20-3-6h6l-3 6Z"/>',
    truck: '<path d="M3 6h11v10H3zM14 10h4l3 3v3h-7"/><circle cx="7" cy="18" r="2"/><circle cx="17" cy="18" r="2"/>',
    phone: '<path d="M5 4h4l2 5-2.5 1.5a11 11 0 0 0 5 5L15 13l5 2v4a2 2 0 0 1-2 2A16 16 0 0 1 3 6a2 2 0 0 1 2-2Z"/>',
    mail: '<rect x="3" y="5" width="18" height="14" rx="2"/><path d="m3 7 9 6 9-6"/>',
    pin: '<path d="M12 21s-7-6.2-7-12a7 7 0 0 1 14 0c0 5.8-7 12-7 12Z"/><circle cx="12" cy="9" r="2.5"/>',
    facebook: '<path d="M14 8h3V4h-3a4 4 0 0 0-4 4v3H7v4h3v6h4v-6h3l1-4h-4V8Z"/>',
    youtube: '<rect x="2" y="5" width="20" height="14" rx="4"/><path d="m10 9 5 3-5 3V9Z"/>',
    instagram: '<rect x="3" y="3" width="18" height="18" rx="5"/><circle cx="12" cy="12" r="4"/><circle cx="17.5" cy="6.5" r=".5"/>',
    box: '<path d="m3 7 9-4 9 4-9 4-9-4Z"/><path d="M3 7v10l9 4 9-4V7M12 11v10"/>',
  };
  const icon = (name, cls = "icon") => `<svg class="${cls}" viewBox="0 0 24 24" aria-hidden="true">${ICONS[name] || ""}</svg>`;

  // ---- Thẻ sản phẩm (dùng ở trang chủ, danh sách, sản phẩm liên quan) ---------
  const productCard = (p) => {
    const v = p.variants[0];
    const img = images(v)[0] || "";
    const colors = p.variants.filter((x) => x.mau_sac);
    const url = `product.html?id=${encodeURIComponent(p.ma_sp)}`;
    const rent = rentPrice(p);
    return `
      <article class="product-card">
        <a class="card-media" href="${url}" aria-label="${esc(cleanName(p.ten_sp))}">
          <img src="${esc(img)}" alt="${esc(cleanName(p.ten_sp))}" loading="lazy" referrerpolicy="no-referrer">
          ${colors.length ? `<span class="badge badge-sand">${colors.length} màu</span>` : ""}
        </a>
        <div class="card-body">
          <span class="card-cat">${esc(p.danh_muc)}</span>
          <h3 class="card-title"><a href="${url}">${esc(cleanName(p.ten_sp))}</a></h3>
          <div class="card-colors">
            ${colors.map((c) => `<span class="dot" style="${colorStyle(c.mau_sac)}" title="${esc(c.mau_sac)}"></span>`).join("")}
            ${colors.length ? "" : "&nbsp;"}
          </div>
          <div class="card-price">
            <span class="rent-price">${rent ? vnd(rent) : "Giá thuê: đang cập nhật"}${rent ? " <small>/ ngày</small>" : ""}</span>
            <span class="value-price">Giá trị sản phẩm: ${vnd(minPrice(p))}</span>
          </div>
          <div class="card-actions">
            <a class="btn btn-outline" href="${url}">Chi tiết</a>
            <a class="btn btn-primary" href="${url}#dat-thue">${icon("calendar")}Thuê</a>
          </div>
        </div>
      </article>`;
  };

  // ---- Header -------------------------------------------------------------------
  const renderHeader = (active) => {
    const el = document.getElementById("site-header");
    if (!el) return;
    const count = (name) => PRODUCTS.filter((p) => p.danh_muc === name).length;
    el.className = "site-header";
    el.innerHTML = `
      <div class="container header-inner">
        <a class="logo" href="index.html" aria-label="WANDERENT – về trang chủ">
          <img src="assets/img/logo.png" alt="WANDERENT" width="156" height="52">
        </a>
        <nav class="main-nav" id="main-nav" aria-label="Điều hướng chính">
          <a href="index.html" class="${active === "home" ? "active" : ""}">Trang chủ</a>
          <div class="nav-drop">
            <button type="button" aria-haspopup="true" class="${active === "products" ? "active" : ""}">Thuê thiết bị ${icon("chevron")}</button>
            <div class="drop-menu">
              <a href="products.html">Tất cả thiết bị <small>${PRODUCTS.length}</small></a>
              ${CATEGORIES.map((c) => `<a href="products.html?dm=${c.slug}">${c.name} <small>${count(c.name)}</small></a>`).join("")}
            </div>
          </div>
          <a href="index.html#combo">Combo chuyến đi</a>
          <a href="index.html#quy-trinh">Hướng dẫn thuê</a>
        </nav>
        <div class="header-actions">
          <button class="icon-btn" type="button" aria-label="Tìm kiếm" aria-expanded="false" data-search-toggle>${icon("search")}</button>
          <a class="icon-btn" href="#" aria-label="Tài khoản">${icon("user")}</a>
          <a class="icon-btn" href="#" aria-label="Giỏ thuê">${icon("bag")}<span class="cart-count" data-cart-count hidden>0</span></a>
          <a class="btn btn-primary" href="products.html">${icon("calendar")}Đặt thuê ngay</a>
        </div>
        <button class="icon-btn menu-toggle" type="button" aria-label="Mở menu" aria-controls="main-nav" aria-expanded="false" data-menu-toggle>${icon("menu")}</button>
      </div>
      <div class="header-search" id="header-search">
        <form class="container" action="products.html" role="search">
          <label class="sr-only" for="hs-input">Tìm thiết bị</label>
          <input id="hs-input" name="tim" type="search" placeholder="Tìm lều, túi ngủ, ván SUP, bếp...">
          <button class="btn btn-primary" type="submit">Tìm</button>
        </form>
      </div>`;

    const nav = el.querySelector("#main-nav");
    const mt = el.querySelector("[data-menu-toggle]");
    mt.addEventListener("click", () => {
      const open = nav.classList.toggle("open");
      mt.setAttribute("aria-expanded", open);
      mt.innerHTML = icon(open ? "close" : "menu");
    });
    const st = el.querySelector("[data-search-toggle]");
    const box = el.querySelector("#header-search");
    st.addEventListener("click", () => {
      const open = box.classList.toggle("open");
      st.setAttribute("aria-expanded", open);
      if (open) box.querySelector("input").focus();
    });
    updateCartCount();
  };

  // ---- Footer -------------------------------------------------------------------
  const renderFooter = () => {
    const el = document.getElementById("site-footer");
    if (!el) return;
    el.className = "site-footer";
    el.innerHTML = `
      <div class="container">
        <div class="footer-top">
          <div class="footer-brand">
            <img src="assets/img/logo.png" alt="WANDERENT" width="192" height="64" loading="lazy">
            <p>Nền tảng cho thuê thiết bị cắm trại &amp; outdoor trực tuyến: chọn ngày, đặt đồ, kiểm tra tồn kho theo ngày,
              thuê combo theo chuyến đi, đặt cọc và tự động hoàn cọc, cho giới trẻ TP.HCM.</p>
            <div class="socials">
              <a href="#" aria-label="Facebook">${icon("facebook")}</a>
              <a href="#" aria-label="Instagram">${icon("instagram")}</a>
              <a href="#" aria-label="YouTube">${icon("youtube")}</a>
            </div>
          </div>
          <div>
            <h4>Thuê thiết bị</h4>
            <ul class="footer-links">
              ${CATEGORIES.map((c) => `<li><a href="products.html?dm=${c.slug}">${c.name}</a></li>`).join("")}
              <li><a href="index.html#combo">Combo chuyến đi</a></li>
            </ul>
          </div>
          <div>
            <h4>Hỗ trợ</h4>
            <ul class="footer-links">
              <li><a href="index.html#quy-trinh">Hướng dẫn thuê đồ</a></li>
              <li><a href="#">Chính sách đặt cọc 30%</a></li>
              <li><a href="#">Hoàn cọc tự động</a></li>
              <li><a href="#">Vệ sinh &amp; bảo quản đồ</a></li>
              <li><a href="#">Câu hỏi thường gặp</a></li>
            </ul>
          </div>
          <div>
            <h4>Liên hệ</h4>
            <ul class="footer-links">
              <li>${icon("pin")}<span>[Địa chỉ điểm nhận đồ], TP.HCM</span></li>
              <li>${icon("phone")}<span>[Số điện thoại]</span></li>
              <li>${icon("mail")}<span>[Email liên hệ]</span></li>
            </ul>
          </div>
        </div>
        <div class="footer-bottom">
          <span>© ${new Date().getFullYear()} WANDERENT – Đồ án môn Thương mại điện tử. Không dùng cho mục đích thương mại.</span>
          <span>Dữ liệu &amp; hình ảnh sản phẩm mẫu tham khảo từ wetrek.vn</span>
        </div>
      </div>`;
  };

  // ---- Toast --------------------------------------------------------------------
  let toastTimer;
  const toast = (msg) => {
    let el = document.querySelector(".toast");
    if (!el) {
      el = document.createElement("div");
      el.className = "toast"; el.setAttribute("role", "status"); el.setAttribute("aria-live", "polite");
      document.body.appendChild(el);
    }
    el.textContent = msg;
    requestAnimationFrame(() => el.classList.add("show"));
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => el.classList.remove("show"), 2800);
  };

  // Gắn icon cho phần tử tĩnh trong HTML: data-icon="calendar" (trước chữ), data-icon-after="arrow" (sau chữ)
  const hydrateIcons = (root = document) => {
    root.querySelectorAll("[data-icon]").forEach((el) => {
      el.insertAdjacentHTML("afterbegin", icon(el.dataset.icon)); el.removeAttribute("data-icon");
    });
    root.querySelectorAll("[data-icon-after]").forEach((el) => {
      el.insertAdjacentHTML("beforeend", icon(el.dataset.iconAfter)); el.removeAttribute("data-icon-after");
    });
  };

  // Khởi tạo chung cho mọi trang
  const initPage = (active) => { renderHeader(active); renderFooter(); hydrateIcons(); };

  window.WR = {
    hydrateIcons, initPage,
    PRODUCTS, CATEGORIES, DEPOSIT_RATE,
    esc, vnd, cleanName, images, catBySlug, catByName, byId, hasColors, minPrice, rentPrice,
    parseSpecs, colorStyle, getDates, setDates, daysBetween, toISO, addToCart,
    icon, productCard, renderHeader, renderFooter, toast,
  };
})();
