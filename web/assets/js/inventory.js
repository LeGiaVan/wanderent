/* Lịch còn hàng theo ngày — chia theo danh mục */
(function () {
  "use strict";
  WR.initPage("products");
  const { esc, vnd, fmtDate, CATEGORIES, PRODUCTS } = WR;
  let cat = new URLSearchParams(location.search).get("dm") || "";
  const range = WR.bindDateRange(document.getElementById("i-from"), document.getElementById("i-to"), { onChange: () => draw() });

  const tabs = document.getElementById("inv-tabs");
  const drawTabs = () => {
    tabs.innerHTML = [{ slug: "", name: "Tất cả" }, ...CATEGORIES].map((c) =>
      `<button type="button" role="tab" data-dm="${c.slug}" aria-selected="${cat === c.slug}">${esc(c.name)}</button>`).join("");
  };
  tabs.addEventListener("click", (e) => {
    const b = e.target.closest("[data-dm]"); if (!b) return;
    cat = b.dataset.dm; draw();
  });

  const draw = () => {
    drawTabs();
    const d = range.get();
    document.getElementById("i-note").innerHTML = `${fmtDate(d.from)} → ${fmtDate(d.to)} · <strong>${d.days} ngày</strong>`;
    const cats = CATEGORIES.filter((c) => !cat || c.slug === cat);
    document.getElementById("inv-list").innerHTML = cats.map((c) => {
      const items = PRODUCTS.filter((p) => p.danh_muc === c.name);
      const rows = items.flatMap((p) => p.variants.map((v) => {
        const left = WR.availableQty(v.ma_bien_the, d.from, d.to);
        return `<div class="inv-row">
          <img src="${esc(WR.thumbOf(v))}" alt="" referrerpolicy="no-referrer">
          <div><a href="product.html?id=${p.ma_sp}&mau=${v.ma_bien_the}"><strong>${esc(WR.cleanName(p.ten_sp))}</strong></a><br><small>${esc(v.mau_sac || "Mặc định")} · ${esc(v.ma_bien_the)}</small></div>
          <span>${vnd(WR.rentPrice(p))}/ngày đầu</span>
          <strong class="stock-line ${left ? "ok" : "out"}">${left ? "Còn " + left : "Hết"}</strong>
        </div>`;
      })).join("");
      return `<section class="inv-group"><h2>${esc(c.name)} <small>${items.length} thiết bị</small></h2>${rows}</section>`;
    }).join("");
  };
  draw();
})();
