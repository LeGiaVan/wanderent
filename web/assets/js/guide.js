/* Trang Hướng dẫn thuê — bảng giá nhiều ngày + máy tính thử */
(function () {
  "use strict";
  const { esc, vnd, cleanName, DAY_TIERS, PRODUCTS, rentPrice, rentBreakdown, rentForDays, depositOf } = WR;
  WR.initPage("guide");

  const sample = WR.byId("LEU02") || PRODUCTS[0];
  const base = rentPrice(sample);
  document.getElementById("tier-table").innerHTML = `
    <div class="table-wrap"><table class="combo-table">
      <thead><tr><th>Ngày thuê</th><th>Giá mỗi ngày</th><th>Ví dụ: ${esc(cleanName(sample.ten_sp))}</th></tr></thead>
      <tbody>${DAY_TIERS.map((t) => `<tr>
        <td>${esc(t.label)}</td>
        <td><strong>${Math.round(t.rate * 100)}%</strong> giá ngày đầu</td>
        <td>${vnd(WR.dayPriceAt(base, t.from))} / ngày</td>
      </tr>`).join("")}</tbody>
    </table></div>
    <p class="meta">Ví dụ thuê 5 ngày: ${vnd(base)} + 2 × ${vnd(WR.dayPriceAt(base, 2))} + 2 × ${vnd(WR.dayPriceAt(base, 4))} = <strong>${vnd(rentForDays(base, 5))}</strong>
      (thay vì ${vnd(base * 5)} nếu tính đủ giá mỗi ngày).</p>`;

  /* ---------- Máy tính tiền thuê: lọc + chọn thiết bị + số ngày + số lượng ---------- */
  const $ = (id) => document.getElementById(id);
  const norm = (x) => String(x || "").toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "").replace(/đ/g, "d");
  const calc = { id: sample.ma_sp, cat: "", q: "", sort: "", days: 3, qty: 1 };

  $("calc-cats").innerHTML = [{ slug: "", name: "Tất cả" }, ...WR.CATEGORIES].map((c) =>
    `<button type="button" data-cat="${c.slug}" aria-pressed="${calc.cat === c.slug}">${esc(c.short || c.name)}</button>`).join("");

  const filtered = () => {
    const cat = WR.catBySlug(calc.cat);
    const q = norm(calc.q.trim());
    let list = PRODUCTS.filter((p) => (!cat || p.danh_muc === cat.name) && (!q || norm(p.ten_sp + " " + p.danh_muc).includes(q)));
    if (calc.sort === "asc") list = list.slice().sort((a, b) => rentPrice(a) - rentPrice(b));
    if (calc.sort === "desc") list = list.slice().sort((a, b) => rentPrice(b) - rentPrice(a));
    return list;
  };

  const drawList = () => {
    const list = filtered();
    $("calc-count").textContent = `${list.length} thiết bị`;
    $("calc-cats").querySelectorAll("[data-cat]").forEach((b) => b.setAttribute("aria-pressed", b.dataset.cat === calc.cat));
    $("calc-list").innerHTML = list.length ? list.map((p) => `
      <button type="button" class="calc-item" role="option" data-id="${p.ma_sp}" aria-selected="${p.ma_sp === calc.id}" title="${esc(cleanName(p.ten_sp))}">
        <img src="${esc(WR.thumbOf(p.variants[0]))}" alt="" loading="lazy" referrerpolicy="no-referrer">
        <span class="ci-text"><span class="ci-name">${esc(cleanName(p.ten_sp))}</span><small>${esc(p.danh_muc)}</small></span>
        <span class="ci-price">${vnd(rentPrice(p))}<small>/ngày</small></span>
      </button>`).join("") : `<p class="empty">Không có thiết bị phù hợp. Thử từ khóa khác.</p>`;
  };

  const drawResult = () => {
    const p = WR.byId(calc.id);
    const days = calc.days, qty = calc.qty;
    const b = rentPrice(p);
    const rows = rentBreakdown(b, days);
    const rent = rentForDays(b, days) * qty;
    $("calc-d").value = days; $("calc-qty").value = qty;
    document.querySelectorAll("[data-days]").forEach((x) => x.setAttribute("aria-pressed", Number(x.dataset.days) === days));
    $("calc-sel").innerHTML = `
      <img src="${esc(WR.thumbOf(p.variants[0]))}" alt="" referrerpolicy="no-referrer">
      <div><small>${esc(p.danh_muc)}</small><strong>${esc(cleanName(p.ten_sp))}</strong><span>${vnd(b)} / ngày</span></div>`;
    $("calc-out").innerHTML = `
      <ul class="breakdown">${rows.map((r) => `<li><span>${esc(r.label)}: ${r.days} × ${vnd(r.unit)}${qty > 1 ? " × " + qty + " món" : ""}</span><strong>${vnd(r.amount * qty)}</strong></li>`).join("")}</ul>
      <p class="calc-total"><span>Tiền thuê ${days} ngày${qty > 1 ? ` × ${qty} món` : ""}</span><strong>${vnd(rent)}</strong></p>
      <p class="calc-save">Tiết kiệm <strong>${vnd(b * days * qty - rent)}</strong> so với tính đủ giá mỗi ngày</p>
      <p class="calc-dep"><span>Cọc 30% (được hoàn khi trả hàng)</span><strong>${vnd(depositOf(p.variants[0]) * qty)}</strong></p>
      <a class="btn btn-primary btn-block" href="product.html?id=${p.ma_sp}">Xem &amp; thuê thiết bị này</a>`;
  };

  $("calc-list").addEventListener("click", (e) => {
    const b = e.target.closest("[data-id]"); if (!b) return;
    calc.id = b.dataset.id;
    $("calc-list").querySelectorAll("[data-id]").forEach((x) => x.setAttribute("aria-selected", x === b));
    drawResult();
  });
  $("calc-cats").addEventListener("click", (e) => { const b = e.target.closest("[data-cat]"); if (!b) return; calc.cat = b.dataset.cat; drawList(); });
  $("calc-q").addEventListener("input", (e) => { calc.q = e.target.value; drawList(); });
  $("calc-sort").addEventListener("change", (e) => { calc.sort = e.target.value; drawList(); });
  document.querySelectorAll("[data-days]").forEach((b) => b.addEventListener("click", () => { calc.days = Number(b.dataset.days); drawResult(); }));
  const clamp = (v, lo, hi) => Math.min(hi, Math.max(lo, Math.round(Number(v)) || lo));
  $("calc-d-minus").addEventListener("click", () => { calc.days = clamp(calc.days - 1, 1, 30); drawResult(); });
  $("calc-d-plus").addEventListener("click", () => { calc.days = clamp(calc.days + 1, 1, 30); drawResult(); });
  $("calc-q-minus").addEventListener("click", () => { calc.qty = clamp(calc.qty - 1, 1, 10); drawResult(); });
  $("calc-q-plus").addEventListener("click", () => { calc.qty = clamp(calc.qty + 1, 1, 10); drawResult(); });
  $("calc-d").addEventListener("change", (e) => { calc.days = clamp(e.target.value, 1, 30); drawResult(); });
  $("calc-qty").addEventListener("change", (e) => { calc.qty = clamp(e.target.value, 1, 10); drawResult(); });
  drawList();
  drawResult();
  if (location.hash) document.querySelector(location.hash)?.scrollIntoView();
})();
