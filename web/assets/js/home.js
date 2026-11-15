/* Trang chủ — render các khối lấy từ dữ liệu */
(function () {
  "use strict";
  const { PRODUCTS, CATEGORIES, esc, cleanName, images, byId, productCard, icon, getDates, setDates } = window.WR;
  WR.initPage("home");

  // ---- Thanh đặt thuê nhanh ----
  const form = document.getElementById("booking-form");
  const dates = getDates();
  const fromEl = form.querySelector("#bk-from");
  const toEl = form.querySelector("#bk-to");
  const today = WR.toISO(new Date());
  fromEl.value = dates.from; toEl.value = dates.to;
  fromEl.min = today; toEl.min = dates.from;
  fromEl.addEventListener("change", () => {
    toEl.min = fromEl.value;
    if (toEl.value <= fromEl.value) {
      const d = new Date(fromEl.value); d.setDate(d.getDate() + 1); toEl.value = WR.toISO(d);
    }
  });
  form.querySelector("#bk-cat").insertAdjacentHTML("beforeend",
    CATEGORIES.map((c) => `<option value="${c.slug}">${esc(c.name)}</option>`).join(""));
  form.addEventListener("submit", () => setDates({ from: fromEl.value, to: toEl.value }));

  // ---- Ảnh ghép hero: 1 lều lớn + 1 ván SUP + 1 bếp ----
  const heroPicks = ["LEU02", "SUP02", "BEP01"].map(byId).filter(Boolean);
  document.getElementById("hero-visual").innerHTML = heroPicks.map((p) => `
    <figure>
      <img src="${esc(images(p.variants[0])[0])}" alt="${esc(cleanName(p.ten_sp))}" referrerpolicy="no-referrer">
      <figcaption>${esc(p.danh_muc)} · ${esc(cleanName(p.ten_sp).split(" ").slice(0, 5).join(" "))}</figcaption>
    </figure>`).join("");

  // ---- Danh mục: ảnh = sản phẩm đầu tiên có ảnh rõ của danh mục ----
  const catCover = { "Lều": "LEU08", "Túi ngủ": "TUINGU03", "SUP": "SUP03", "Bếp và dụng cụ ăn uống": "BEP05" };
  document.getElementById("cat-grid").innerHTML = CATEGORIES.map((c) => {
    const list = PRODUCTS.filter((p) => p.danh_muc === c.name);
    const cover = byId(catCover[c.name]) || list[0];
    return `
      <a class="cat-card" href="products.html?dm=${c.slug}">
        <div class="cat-media"><img src="${esc(images(cover.variants[0])[0])}" alt="" loading="lazy" referrerpolicy="no-referrer"></div>
        <div class="cat-info">
          <div>
            <h3>${esc(c.name)}</h3>
            <span class="cat-count">${list.length} thiết bị · ${esc(c.desc)}</span>
          </div>
          <span class="arrow">${icon("arrow")}</span>
        </div>
      </a>`;
  }).join("");

  // ---- Thiết bị nổi bật: 2 món đầu của mỗi danh mục ----
  const featured = CATEGORIES.flatMap((c) => PRODUCTS.filter((p) => p.danh_muc === c.name).slice(0, 2));
  document.getElementById("featured-grid").innerHTML = featured.map(productCard).join("");

  const COMBOS = WR.COMBOS;
  document.getElementById("combo-grid").innerHTML = COMBOS.map((cb) => {
    const ps = cb.items.map(([id, qty]) => ({ p: byId(id), qty })).filter((x) => x.p);
    const price = WR.comboPrice(cb);
    return `
      <article class="combo-card">
        <div class="combo-media">
          ${ps.slice(0, 3).map(({ p }) => `<img src="${esc(images(p.variants[0])[0])}" alt="" loading="lazy" referrerpolicy="no-referrer">`).join("")}
          <span class="badge">Giảm 10%</span>
        </div>
        <div class="combo-body">
          <div>
            <h3>${esc(cb.name)}</h3>
            <span class="badge badge-sand" style="margin-top:6px">${esc(cb.tag)}</span>
          </div>
          <ul class="combo-items">
            ${ps.map(({ p, qty }) => `<li>${icon("check")}<a href="product.html?id=${p.ma_sp}">${qty > 1 ? qty + " × " : ""}${esc(cleanName(p.ten_sp))}</a></li>`).join("")}
          </ul>
          <div class="combo-foot">
            <span class="rent-price">${WR.vnd(price.rentDaySale)} <small>/ ngày</small></span>
            <button class="btn btn-primary" type="button" data-combo="${esc(cb.id)}" aria-label="Thuê ${esc(cb.name)}">Thuê combo</button>
          </div>
        </div>
      </article>`;
  }).join("");

  document.getElementById("combo-grid").addEventListener("click", (e) => {
    const btn = e.target.closest("[data-combo]"); if (!btn) return;
    const cb = COMBOS.find((c) => c.id === btn.dataset.combo); if (!cb) return;
    const dates = WR.getDates();
    let blocked = 0;
    cb.items.forEach(([id, qty]) => {
      const p = byId(id); if (!p) return;
      const sku = p.variants[0].ma_bien_the;
      const v = WR.validateRental({ sku, from: dates.from, to: dates.to, qty });
      if (!v.ok) { blocked += 1; return; }
      WR.addToCart({ ma_bien_the: sku, qty, from: dates.from, to: dates.to, combo: cb.id });
    });
    if (blocked) WR.toast("Một số món trong combo đang hết. Đã thêm các món còn trống vào giỏ.");
    else WR.toast(`Đã thêm ${cb.name} vào giỏ thuê`);
    location.href = "cart.html";
  });
})();
