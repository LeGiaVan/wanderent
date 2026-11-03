/* Trang chi tiết sản phẩm — đọc ?id=MA_SP, đổi ảnh / giá theo màu, tính tiền cọc */
(function () {
  "use strict";
  const { PRODUCTS, DEPOSIT_RATE, esc, vnd, cleanName, images, catByName, byId, rentPrice,
    parseSpecs, colorStyle, getDates, setDates, daysBetween, productCard, icon, toast } = window.WR;
  WR.initPage("products");

  const params = new URLSearchParams(location.search);
  const p = byId(params.get("id")) || PRODUCTS[0];   // không có id -> sản phẩm đầu tiên
  let variant = p.variants.find((v) => v.ma_bien_the === params.get("mau")) || p.variants[0];
  let imgIndex = 0;

  const $ = (id) => document.getElementById(id);
  const name = cleanName(p.ten_sp);
  const cat = catByName(p.danh_muc);

  // ---- Thông tin cố định ----
  document.title = `${name} – WANDERENT`;
  $("bc-cat").textContent = p.danh_muc;
  $("bc-cat").href = `products.html?dm=${cat ? cat.slug : ""}`;
  $("bc-name").textContent = name;
  $("pd-cat").textContent = p.danh_muc;
  $("pd-name").textContent = name;

  // ---- Màu sắc ----
  const colored = p.variants.filter((v) => v.mau_sac);
  if (!colored.length) $("color-wrap").style.display = "none";
  const renderColors = () => {
    $("colors").innerHTML = colored.map((v) => `
      <button type="button" class="color-btn" data-v="${esc(v.ma_bien_the)}" aria-pressed="${v === variant}">
        <span class="dot" style="${colorStyle(v.mau_sac)}"></span>${esc(v.mau_sac)}
      </button>`).join("");
    $("color-name").textContent = variant.mau_sac || "";
  };
  $("colors").addEventListener("click", (e) => {
    const b = e.target.closest("[data-v]"); if (!b) return;
    variant = p.variants.find((v) => v.ma_bien_the === b.dataset.v);
    imgIndex = 0;
    history.replaceState(null, "", `?id=${p.ma_sp}&mau=${variant.ma_bien_the}`);
    renderVariant();
  });

  // ---- Ảnh ----
  const renderGallery = () => {
    const imgs = images(variant);
    $("main-img").src = imgs[imgIndex] || "";
    $("main-img").alt = `${name}${variant.mau_sac ? " – màu " + variant.mau_sac : ""}, ảnh ${imgIndex + 1}`;
    $("thumbs").innerHTML = imgs.map((u, i) => `
      <button type="button" data-i="${i}" aria-current="${i === imgIndex}" aria-label="Xem ảnh ${i + 1}">
        <img src="${esc(u)}" alt="" referrerpolicy="no-referrer">
      </button>`).join("");
  };
  $("thumbs").addEventListener("click", (e) => {
    const b = e.target.closest("[data-i]"); if (!b) return;
    imgIndex = Number(b.dataset.i); renderGallery();
  });

  // ---- Ngày + số lượng + tổng tiền ----
  const dates = getDates();
  const fromEl = $("pd-from"), toEl = $("pd-to"), qtyEl = $("qty");
  fromEl.value = dates.from; toEl.value = dates.to;
  fromEl.min = WR.toISO(new Date()); toEl.min = dates.from;
  const onDate = () => {
    toEl.min = fromEl.value;
    if (toEl.value <= fromEl.value) { const d = new Date(fromEl.value); d.setDate(d.getDate() + 1); toEl.value = WR.toISO(d); }
    setDates({ from: fromEl.value, to: toEl.value }); renderSummary();
  };
  fromEl.addEventListener("change", onDate); toEl.addEventListener("change", onDate);
  const qty = () => Math.min(10, Math.max(1, parseInt(qtyEl.value, 10) || 1));
  $("qty-minus").addEventListener("click", () => { qtyEl.value = qty() - 1 || 1; renderSummary(); });
  $("qty-plus").addEventListener("click", () => { qtyEl.value = Math.min(10, qty() + 1); renderSummary(); });
  qtyEl.addEventListener("change", () => { qtyEl.value = qty(); renderSummary(); });

  const renderSummary = () => {
    const days = daysBetween(fromEl.value, toEl.value);
    const rent = rentPrice(p);
    $("sum-days").textContent = `${days} ngày`;
    $("sum-rent").textContent = rent ? vnd(rent * days * qty()) : "Đang cập nhật";
    $("sum-deposit").textContent = vnd(Math.round(variant.gia_goc * DEPOSIT_RATE) * qty());
  };

  function renderVariant() {
    const rent = rentPrice(p);
    $("pd-sku").textContent = variant.ma_bien_the;
    $("pd-rent").innerHTML = rent ? `${vnd(rent)} <small>/ ngày</small>` : "Giá thuê: đang cập nhật";
    $("pd-value").textContent = vnd(variant.gia_goc);
    $("pd-deposit").textContent = vnd(Math.round(variant.gia_goc * DEPOSIT_RATE));
    renderColors(); renderGallery(); renderSummary();
  }

  // ---- Nút hành động (demo) ----
  $("btn-cart").addEventListener("click", () => {
    WR.addToCart({ ma_bien_the: variant.ma_bien_the, qty: qty(), from: fromEl.value, to: toEl.value });
    toast(`Đã thêm ${qty()} × ${name}${variant.mau_sac ? " (" + variant.mau_sac + ")" : ""} vào giỏ thuê`);
  });
  $("btn-rent").addEventListener("click", () => toast("Bản demo: bước thanh toán cọc sẽ được làm ở giai đoạn sau."));

  // ---- Mô tả: gộp các dòng bị ngắt do link trong HTML gốc, dòng kết thúc bằng ":" là tiêu đề ----
  const descParagraphs = () => {
    const out = [];
    String(p.mo_ta || "").split("\n").map((s) => s.trim()).filter(Boolean).forEach((line) => {
      const prev = out[out.length - 1];
      const joinable = prev && !/[:.!?]$/.test(prev) && (/^[a-zà-ỹđ(,]/.test(line) || /,$/.test(prev) || prev.length < 30);
      if (joinable) out[out.length - 1] = prev + " " + line; else out.push(line);
    });
    return out;
  };
  $("panel-desc").innerHTML = descParagraphs().map((t) =>
    /:$/.test(t) && t.length < 80 ? `<p class="desc-heading">${esc(t)}</p>` : `<p>${esc(t)}</p>`).join("")
    + `<p class="source-note">Nguồn mô tả: <a href="${esc(p.link_nguon)}" target="_blank" rel="noopener">wetrek.vn</a> (nhóm sẽ viết lại).</p>`;

  const specs = parseSpecs(p.thong_so);
  $("panel-spec").innerHTML = specs.length
    ? `<table class="spec-table"><tbody>${specs.map(([k, v]) => `<tr><th scope="row">${esc(k || "Thông tin")}</th><td>${esc(v)}</td></tr>`).join("")}</tbody></table>`
    : `<p class="spec-empty">Chưa có thông số cho sản phẩm này.</p>`;

  // ---- Tabs (hỗ trợ phím mũi tên) ----
  const tabs = [...document.querySelectorAll('[role="tab"]')];
  const selectTab = (t) => {
    tabs.forEach((x) => {
      const on = x === t;
      x.setAttribute("aria-selected", on); x.tabIndex = on ? 0 : -1;
      $(x.getAttribute("aria-controls")).hidden = !on;
    });
    t.focus();
  };
  tabs.forEach((t, i) => {
    t.addEventListener("click", () => selectTab(t));
    t.addEventListener("keydown", (e) => {
      if (e.key === "ArrowRight") selectTab(tabs[(i + 1) % tabs.length]);
      if (e.key === "ArrowLeft") selectTab(tabs[(i - 1 + tabs.length) % tabs.length]);
    });
  });

  // ---- Sản phẩm liên quan ----
  const related = PRODUCTS.filter((x) => x.danh_muc === p.danh_muc && x.ma_sp !== p.ma_sp).slice(0, 4);
  $("related").innerHTML = related.map(productCard).join("");
  $("related-more").href = `products.html?dm=${cat ? cat.slug : ""}`;

  renderVariant();
})();
