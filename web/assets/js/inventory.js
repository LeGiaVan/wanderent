(function () {
  "use strict";
  WR.initPage();
  const dates = WR.getDates();
  const fromEl = document.getElementById("i-from");
  const toEl = document.getElementById("i-to");
  fromEl.value = dates.from; toEl.value = dates.to;
  fromEl.min = WR.todayISO();
  const draw = () => {
    if (toEl.value <= fromEl.value) toEl.value = WR.addDaysISO(fromEl.value, 1);
    WR.setDates({ from: fromEl.value, to: toEl.value });
    const n = WR.daysBetween(fromEl.value, toEl.value);
    document.getElementById("i-note").innerHTML = `${WR.fmtDate(fromEl.value)} → ${WR.fmtDate(toEl.value)} · <strong>${n} ngày</strong>`;
    document.getElementById("inv-list").innerHTML = WR.PRODUCTS.map((p) => {
      const rows = p.variants.map((v) => {
        const left = WR.availableQty(v.ma_bien_the, fromEl.value, toEl.value);
        return `<div class="inv-row">
          <img src="${WR.esc(WR.mediaOf(v)[0]?.thumb || "")}" alt="" referrerpolicy="no-referrer">
          <div><a href="product.html?id=${p.ma_sp}&mau=${v.ma_bien_the}"><strong>${WR.esc(WR.cleanName(p.ten_sp))}</strong></a><br><small>${WR.esc(v.mau_sac || "Mặc định")} · ${WR.esc(v.ma_bien_the)}</small></div>
          <span>${WR.vnd(WR.rentPrice(p))}/ngày</span>
          <strong class="stock-line ${left ? "ok" : "out"}">${left ? "Còn " + left : "Hết"}</strong>
        </div>`;
      }).join("");
      return rows;
    }).join("");
  };
  fromEl.addEventListener("change", draw);
  toEl.addEventListener("change", draw);
  draw();
})();
