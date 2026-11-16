/* Trang Combo chuyến đi — giá theo ngày đã chọn, đồng nhất với giỏ thuê */
(function () {
  "use strict";
  const { esc, vnd, cleanName, thumbOf, fmtDate, icon } = WR;
  WR.initPage("combo");

  const noteEl = document.getElementById("cb-note");
  // Mặc định báo giá chuyến 2 ngày; khách có thể đổi ngày ngay trên trang
  const start = WR.getDates().from;
  const range = WR.bindDateRange(document.getElementById("cb-from"), document.getElementById("cb-to"), {
    initial: { from: start, to: WR.addDaysISO(start, WR.COMBO_DEFAULT_DAYS) }, persist: false, onChange: () => render(),
  });

  const render = () => {
    const d = range.get();
    noteEl.innerHTML = `Thời gian thuê: <strong>${d.days} ngày</strong> (${fmtDate(d.from)} → ${fmtDate(d.to)})`;
    document.getElementById("combo-list").innerHTML = WR.COMBOS.map((cb) => {
      const q = WR.comboQuote(cb, d.from, d.to);
      return `
      <article class="combo-detail" id="${esc(cb.id)}">
        <div class="combo-detail-head">
          <div>
            <p class="eyebrow">${esc(cb.tag)}</p>
            <h2>${esc(cb.name)}</h2>
            <p>${esc(cb.desc)}</p>
          </div>
          <span class="badge badge-ok">Giảm 10%</span>
        </div>
        <div class="table-wrap"><table class="combo-table">
          <thead><tr><th>Thiết bị</th><th>SL</th><th>Giá ngày đầu</th><th>Tiền thuê ${q.days} ngày</th><th>Cọc</th><th>Còn trống</th></tr></thead>
          <tbody>
            ${q.items.map((x) => `<tr>
              <td><button type="button" class="combo-prod qv-link" data-qv="${x.p.ma_sp}" aria-haspopup="dialog"><img src="${esc(thumbOf(x.p.variants[0]))}" alt="" loading="lazy" referrerpolicy="no-referrer"><span>${esc(cleanName(x.p.ten_sp))}</span></button></td>
              <td>${x.qty}</td>
              <td>${vnd(x.base)}</td>
              <td>${vnd(x.rent)}</td>
              <td>${vnd(x.deposit)}</td>
              <td><span class="stock-line ${x.available >= x.qty ? "ok" : "out"}">${x.available >= x.qty ? "Còn " + x.available : "Thiếu (còn " + x.available + ")"}</span></td>
            </tr>`).join("")}
          </tbody>
        </table></div>
        <div class="combo-detail-foot">
          <dl class="quote">
            <div><dt>Thuê lẻ ${q.days} ngày</dt><dd>${vnd(q.gross)}</dd></div>
            <div><dt>Giảm combo 10%</dt><dd>− ${vnd(q.discount)}</dd></div>
            <div class="strong"><dt>Tiền thuê combo (trả khi nhận đồ)</dt><dd>${vnd(q.rent)}</dd></div>
            <div><dt>Cọc 30% (trả hôm nay, được hoàn khi trả hàng)</dt><dd>${vnd(q.deposit)}</dd></div>
          </dl>
          <div class="combo-cta">
            ${q.out.length ? `<p class="form-error">${icon("warn")} ${q.out.map((x) => esc(cleanName(x.p.ten_sp))).join(", ")} không đủ hàng trong ngày đã chọn. Hãy đổi ngày.</p>` : ""}
            <button class="btn btn-primary btn-lg" type="button" data-combo="${esc(cb.id)}" ${q.out.length ? "disabled" : ""}>${icon("bag")}Thuê cả bộ</button>
          </div>
        </div>
      </article>`;
    }).join("");
  };

  document.getElementById("combo-list").addEventListener("click", (e) => {
    const btn = e.target.closest("[data-combo]"); if (!btn) return;
    const cb = WR.COMBOS.find((c) => c.id === btn.dataset.combo); if (!cb) return;
    if (!range.isValid()) { WR.toast("Hãy chọn lại ngày nhận / ngày trả hợp lệ."); return; }
    const d = range.get();
    const r = WR.addComboToCart(cb, d.from, d.to);
    if (!r.ok) { WR.toast(r.error); return; }
    WR.flash(`Đã thêm ${cb.name} (${fmtDate(d.from)} → ${fmtDate(d.to)}) vào giỏ thuê.`);
    location.href = "cart.html";
  });

  render();
  if (location.hash) document.querySelector(location.hash)?.scrollIntoView();
})();
