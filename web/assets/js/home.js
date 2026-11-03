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

  // ---- Combo gợi ý (ghép từ thiết bị lẻ; giá combo chưa có) ----
  const COMBOS = [
    { name: "Combo Cặp đôi", tag: "2 người · 1 đêm", items: [["LEU08", 1], ["TUINGU06", 2], ["BEP03", 1], ["BEP06", 1]] },
    { name: "Combo Nhóm bạn", tag: "4–6 người · 2 ngày", items: [["LEU02", 1], ["TUINGU01", 4], ["BEP01", 1], ["BEP05", 1], ["SUP04", 1]] },
    { name: "Combo Sinh tồn", tag: "Trekking · gọn nhẹ", items: [["LEU05", 1], ["TUINGU05", 1], ["BEP03", 1], ["BEP04", 1], ["BEP02", 1]] },
  ];
  document.getElementById("combo-grid").innerHTML = COMBOS.map((cb) => {
    const ps = cb.items.map(([id, qty]) => ({ p: byId(id), qty })).filter((x) => x.p);
    return `
      <article class="combo-card">
        <div class="combo-media">
          ${ps.slice(0, 3).map(({ p }) => `<img src="${esc(images(p.variants[0])[0])}" alt="" loading="lazy" referrerpolicy="no-referrer">`).join("")}
          <span class="badge">Combo tiết kiệm</span>
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
            <span class="rent-price">Giá combo: đang cập nhật</span>
            <a class="btn btn-primary" href="products.html" aria-label="Thuê ${esc(cb.name)}">${icon("arrow")}</a>
          </div>
        </div>
      </article>`;
  }).join("");
})();
