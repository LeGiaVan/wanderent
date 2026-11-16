/* Trang chủ — render các khối lấy từ dữ liệu */
(function () {
  "use strict";
  const { PRODUCTS, CATEGORIES, esc, cleanName, thumbOf, byId, productCard, icon, vnd, fmtDate } = window.WR;
  WR.initPage("home");

  // ---- Thanh đặt thuê nhanh ----
  const form = document.getElementById("booking-form");
  const fromEl = form.querySelector("#bk-from");
  const toEl = form.querySelector("#bk-to");
  const range = WR.bindDateRange(fromEl, toEl, {
    onChange: () => { renderFeatured(); renderCombos(); },
  });
  form.querySelector("#bk-cat").insertAdjacentHTML("beforeend",
    CATEGORIES.map((c) => `<option value="${c.slug}">${esc(c.name)}</option>`).join(""));
  form.addEventListener("submit", (e) => {
    if (!range.isValid()) { e.preventDefault(); WR.toast("Hãy chọn lại ngày nhận / ngày trả hợp lệ."); }
  });

  // ---- Ảnh ghép hero: 1 lều lớn + 1 ván SUP + 1 bếp ----
  const heroPicks = ["LEU02", "SUP02", "BEP01"].map(byId).filter((p) => p && !p.hidden);
  document.getElementById("hero-visual").innerHTML = heroPicks.map((p) => `
    <figure>
      <a href="product.html?id=${p.ma_sp}"><img src="${esc(thumbOf(p.variants[0]))}" alt="${esc(cleanName(p.ten_sp))}" referrerpolicy="no-referrer"></a>
      <figcaption>${esc(p.danh_muc)} · ${esc(cleanName(p.ten_sp).split(" ").slice(0, 5).join(" "))}</figcaption>
    </figure>`).join("");

  // ---- Danh mục ----
  const catCover = { "Lều": "LEU08", "Túi ngủ": "TUINGU03", "SUP": "SUP03", "Bếp và dụng cụ ăn uống": "BEP05" };
  document.getElementById("cat-grid").innerHTML = CATEGORIES.map((c) => {
    const list = PRODUCTS.filter((p) => p.danh_muc === c.name);
    const cover = byId(catCover[c.name]) || list[0];
    const from = Math.min(...list.map((p) => WR.rentPrice(p) || Infinity));
    return `
      <a class="cat-card" href="products.html?dm=${c.slug}" aria-label="${esc(c.name)}: ${list.length} thiết bị, từ ${vnd(from)} một ngày">
        <div class="cat-media">
          <img src="${esc(cover ? thumbOf(cover.variants[0]) : "")}" alt="" loading="lazy" referrerpolicy="no-referrer">
          <span class="cat-badge">${list.length} thiết bị</span>
        </div>
        <div class="cat-info">
          <div class="cat-text">
            <h3 title="${esc(c.name)}">${esc(c.short || c.name)}</h3>
            <span class="cat-count">Từ ${vnd(from)}/ngày</span>
            <span class="cat-desc">${esc(c.desc)}</span>
          </div>
          <span class="arrow">${icon("arrow")}</span>
        </div>
      </a>`;
  }).join("");

  // ---- Thiết bị nổi bật: 2 món đầu của mỗi danh mục ----
  const renderFeatured = () => {
    const featured = CATEGORIES.flatMap((c) => PRODUCTS.filter((p) => p.danh_muc === c.name).slice(0, 2));
    document.getElementById("featured-grid").innerHTML = featured.map(productCard).join("");
  };

  // ---- Combo: giá tính đúng theo ngày đã chọn, giống hệt trong giỏ ----
  // Combo luôn báo giá mặc định 2 ngày, bắt đầu từ ngày nhận đang chọn
  const comboDates = () => {
    const from = range.isValid() ? range.get().from : WR.getDates().from;
    return { from, to: WR.addDaysISO(from, WR.COMBO_DEFAULT_DAYS), days: WR.COMBO_DEFAULT_DAYS };
  };
  const renderCombos = () => {
    const d = comboDates();
    document.getElementById("combo-sub").textContent =
      `Giá cho chuyến ${d.days} ngày (${fmtDate(d.from)} → ${fmtDate(d.to)}), đã giảm 10% so với thuê lẻ. Bấm vào từng món để xem nhanh; đổi số ngày trong giỏ thuê.`;
    document.getElementById("combo-grid").innerHTML = WR.COMBOS.map((cb) => {
      const q = WR.comboQuote(cb, d.from, d.to);
      return `
        <article class="combo-card" id="combo-${esc(cb.id)}">
          <a class="combo-media" href="combo.html#${esc(cb.id)}" aria-label="Xem chi tiết ${esc(cb.name)}">
            ${q.items.slice(0, 3).map(({ p }) => `<img src="${esc(thumbOf(p.variants[0]))}" alt="" loading="lazy" referrerpolicy="no-referrer">`).join("")}
            <span class="badge">Giảm 10%</span>
          </a>
          <div class="combo-body">
            <div>
              <h3><a href="combo.html#${esc(cb.id)}">${esc(cb.name)}</a></h3>
              <span class="badge badge-sand" style="margin-top:6px">${esc(cb.tag)}</span>
            </div>
            <ul class="combo-items">
              ${q.items.map(({ p, qty }) => `<li>${icon("check")}<button type="button" class="qv-link" data-qv="${p.ma_sp}" aria-haspopup="dialog">${qty > 1 ? qty + " × " : ""}${esc(cleanName(p.ten_sp))}</button></li>`).join("")}
            </ul>
            <div class="combo-foot">
              <div class="combo-price">
                <span class="rent-price">${vnd(q.rent)} <small>/ ${q.days} ngày</small></span>
                <span class="value-price"><s>${vnd(q.gross)}</s> · cọc ${vnd(q.deposit)}</span>
                ${q.out.length ? `<span class="stock-line out">Hết ${q.out.length} món trong ngày đã chọn</span>` : `<span class="stock-line ok">Đủ đồ trong ngày đã chọn</span>`}
              </div>
              <div class="combo-btns">
                <a class="btn btn-outline" href="combo.html#${esc(cb.id)}">Xem chi tiết</a>
                <button class="btn btn-primary" type="button" data-combo="${esc(cb.id)}" ${q.out.length ? "disabled" : ""}>Thuê combo</button>
              </div>
            </div>
          </div>
        </article>`;
    }).join("");
  };

  document.getElementById("combo-grid").addEventListener("click", (e) => {
    const btn = e.target.closest("[data-combo]"); if (!btn) return;
    const cb = WR.COMBOS.find((c) => c.id === btn.dataset.combo); if (!cb) return;
    const d = comboDates();
    const r = WR.addComboToCart(cb, d.from, d.to);
    if (!r.ok) { WR.toast(r.error); return; }
    WR.flash(`Đã thêm ${cb.name} (${fmtDate(d.from)} → ${fmtDate(d.to)}) vào giỏ thuê.`);
    location.href = "cart.html";
  });

  renderFeatured();
  renderCombos();
})();
