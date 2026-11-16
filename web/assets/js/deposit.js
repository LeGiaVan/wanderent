/* Bảng ví dụ cọc vs tiền thuê */
(function () {
  "use strict";
  const { byId, esc, vnd, cleanName, rentPrice, rentForDays, depositOf } = WR;
  const el = document.getElementById("deposit-examples");
  if (!el) return;
  el.innerHTML = ["LEU01", "TUINGU05", "LEU08", "SUP02", "SUP01"].map(byId).filter(Boolean).map((p) => {
    const v = p.variants[0];
    return `<tr><td><a href="product.html?id=${p.ma_sp}">${esc(cleanName(p.ten_sp))}</a></td><td>${vnd(v.gia_goc)}</td>
      <td>${vnd(rentForDays(rentPrice(p), 2))}</td><td>${vnd(depositOf(v))}</td></tr>`;
  }).join("");
})();
