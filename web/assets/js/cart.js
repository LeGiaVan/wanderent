/* Giỏ thuê — sửa ngày, màu/mẫu và số lượng ngay trên từng món; tính giá nhiều ngày + combo */
(function () {
  "use strict";
  WR.initPage();
  const { esc, vnd, fmtDate, thumbOf, getCart, removeFromCart, setCart, cartTotals, toast, todayISO, variantBySku } = WR;
  const user = WR.currentUser();
  const email = user && user.role !== "admin" ? user.email : "";

  const wrap = document.getElementById("cart-dates-wrap");
  let allRange = null;

  // Các dòng đi cùng nhau khi đổi ngày: cả combo (cùng combo + cùng ngày) hoặc chỉ 1 món
  const groupOf = (cart, it) => (it.combo
    ? cart.filter((x) => x.combo === it.combo && x.from === it.from && x.to === it.to)
    : [it]);

  const lineProblem = (it) => {
    if (!WR.isValidISO(it.from) || it.from < todayISO()) return `Ngày nhận ${fmtDate(it.from)} đã qua. Hãy chọn lại ngày cho món này.`;
    const v = WR.validateRental({ sku: it.ma_bien_the, from: it.from, to: it.to, qty: it.qty, ignoreCartId: it.id });
    return v.ok ? "" : v.error;
  };

  const variantOptions = (t, it) => {
    const vs = t.product?.variants || [];
    if (vs.length < 2) return "";
    return `<label class="cart-field"><span>Màu / mẫu</span>
      <select data-variant aria-label="Chọn màu cho ${esc(t.name)}">
        ${vs.map((v) => {
          const left = WR.availableQty(v.ma_bien_the, it.from, it.to);
          return `<option value="${esc(v.ma_bien_the)}" ${v.ma_bien_the === it.ma_bien_the ? "selected" : ""}>${esc(v.mau_sac || "Mặc định")} · còn ${left}</option>`;
        }).join("")}
      </select></label>`;
  };

  const render = () => {
    const cart = getCart();
    const list = document.getElementById("cart-list");
    const sum = document.getElementById("cart-sum");
    if (!cart.length) {
      wrap.hidden = true;
      document.getElementById("cart-tools").hidden = true;
      list.innerHTML = `<div class="empty">Giỏ thuê đang trống. <a href="products.html">Chọn thiết bị</a> hoặc <a href="combo.html">thuê combo</a> để bắt đầu.</div>`;
      sum.innerHTML = "";
      return;
    }
    wrap.hidden = false;
    document.getElementById("cart-tools").hidden = false;
    document.getElementById("cart-count-line").textContent = `${cart.length} dòng · ${cart.reduce((n, x) => n + Number(x.qty || 0), 0)} món`;
    if (!allRange) {
      const first = cart[0];
      const init = WR.isValidISO(first.from) && first.from >= todayISO() && first.to > first.from ? { from: first.from, to: first.to } : WR.getDates();
      allRange = WR.bindDateRange(document.getElementById("ct-from"), document.getElementById("ct-to"), {
        initial: init,
        onChange: (d) => {
          const r = WR.setCartDates(d.from, d.to);
          if (!r.ok) toast("Chưa đổi được ngày: " + r.problems[0]);
          else toast(`Đã đổi ngày cả giỏ: ${fmtDate(d.from)} → ${fmtDate(d.to)}`);
          render();
        },
      });
    }

    const tot = cartTotals(cart, { email });
    const problems = [];
    list.innerHTML = tot.lines.map((t) => {
      const it = t.item;
      const prob = lineProblem(it);
      if (prob) problems.push(prob);
      return `<article class="cart-item ${prob ? "has-problem" : ""}" data-id="${esc(it.id)}">
        <a href="product.html?id=${t.product?.ma_sp || ""}&mau=${esc(it.ma_bien_the)}"><img src="${esc(t.variant ? thumbOf(t.variant) : "")}" alt="" referrerpolicy="no-referrer"></a>
        <div class="cart-main">
          <h3><a href="product.html?id=${t.product?.ma_sp || ""}">${esc(t.name)}</a> ${t.combo ? `<span class="tag">${t.comboApplied ? "Combo −10%" : "Combo (chưa đủ bộ)"}</span>` : ""}</h3>
          <div class="cart-edit">
            ${variantOptions(t, it)}
            <div class="date-pair cart-line-dates">
              <label class="cart-field"><span>Ngày nhận</span><input type="date" data-from aria-label="Ngày nhận ${esc(t.name)}"></label>
              <label class="cart-field"><span>Ngày trả</span><input type="date" data-to aria-label="Ngày trả ${esc(t.name)}"></label>
            </div>
          </div>
          ${t.combo ? `<p class="meta">Món thuộc combo: đổi ngày sẽ áp dụng cho cả bộ để giữ ưu đãi.</p>` : ""}
          <dl class="line-cost">
            <div class="lc-head"><dt>Thời gian thuê</dt><dd>${t.days} ngày${t.qty > 1 ? ` × ${t.qty} món` : ""}</dd></div>
            ${t.breakdown.map((b) => `<div class="lc-sub"><dt>${esc(b.label)}: ${b.days} × ${vnd(b.unit)}${t.qty > 1 ? ` × ${t.qty}` : ""}</dt><dd>${vnd(b.amount * t.qty)}</dd></div>`).join("")}
            <div class="lc-total"><dt>Tiền thuê</dt><dd>${vnd(t.rent)}</dd></div>
            <div class="lc-dep"><dt>Cọc 30% <small>(được hoàn khi trả hàng)</small></dt><dd>${vnd(t.deposit)}</dd></div>
          </dl>
          ${prob ? `<p class="form-error">${esc(prob)}</p>` : ""}
          <div class="qty" style="margin-top:8px">
            <button type="button" data-act="minus" aria-label="Giảm số lượng">−</button>
            <input value="${it.qty}" readonly aria-label="Số lượng">
            <button type="button" data-act="plus" aria-label="Tăng số lượng">+</button>
          </div>
        </div>
        <button class="link-btn cart-del" type="button" data-act="del" aria-label="Xóa ${esc(t.name)} khỏi giỏ">Xóa</button>
      </article>`;
    }).join("");

    // Gắn ô ngày cho từng món
    list.querySelectorAll(".cart-item").forEach((card) => {
      const id = card.dataset.id;
      const it = cart.find((x) => x.id === id);
      const fromEl = card.querySelector("[data-from]");
      const toEl = card.querySelector("[data-to]");
      const valid = WR.isValidISO(it.from) && it.from >= todayISO() && it.to > it.from;
      const range = WR.bindDateRange(fromEl, toEl, {
        initial: valid ? { from: it.from, to: it.to } : WR.getDates(),
        persist: false,
        onChange: (d) => changeDates(id, d.from, d.to),
      });
      if (!valid) { fromEl.value = it.from; toEl.value = it.to; }
      void range;
    });

    sum.innerHTML = `
      <h2>Tạm tính</h2>
      <div class="row"><span>Tiền thuê (giá nhiều ngày)</span><strong>${vnd(tot.rentGross)}</strong></div>
      ${tot.comboDiscount ? `<div class="row discount"><span>Giảm combo 10%</span><strong>− ${vnd(tot.comboDiscount)}</strong></div>` : ""}
      ${tot.studentDiscount ? `<div class="row discount"><span>Ưu đãi HSSV 10%</span><strong>− ${vnd(tot.studentDiscount)}</strong></div>` : ""}
      <div class="row"><span>Tiền thuê trả khi nhận đồ</span><strong>${vnd(tot.rent)}</strong></div>
      <div class="row"><span>Cọc 30% (trả hôm nay, được hoàn khi trả hàng)</span><strong>${vnd(tot.deposit)}</strong></div>
      <div class="row"><span>Phí giao</span><strong>Chọn lúc thanh toán</strong></div>
      <div class="row total"><span>Cần trả hôm nay</span><strong>${vnd(tot.todayPay)}</strong></div>
      ${tot.comboNotes.map((n) => `<p class="meta warn-text">${esc(n)}</p>`).join("")}
      ${!tot.studentDiscount ? `<p class="meta" style="margin-top:8px">Là HSSV? <a href="student.html">Xác minh thẻ</a> để được giảm 10% tiền thuê.</p>` : ""}
      ${problems.length ? `<p class="form-error" style="margin-top:12px">Có ${problems.length} món cần sửa trước khi thanh toán.</p>` : ""}
      <a class="btn btn-primary btn-block ${problems.length ? "is-disabled" : ""}" href="checkout.html" ${problems.length ? 'aria-disabled="true" tabindex="-1"' : ""} style="margin-top:12px">Thanh toán cọc</a>
      <a class="btn btn-outline btn-block" href="products.html" style="margin-top:8px">Thuê thêm</a>`;
  };

  // Đổi ngày 1 món (hoặc cả combo chứa món đó)
  const changeDates = (id, from, to) => {
    const cart = getCart();
    const it = cart.find((x) => x.id === id); if (!it) return;
    const group = groupOf(cart, it);
    const ids = group.map((x) => x.id);
    for (const g of group) {
      const v = WR.validateRental({ sku: g.ma_bien_the, from, to, qty: g.qty, ignoreCartIds: ids });
      if (!v.ok) {
        toast(`Chưa đổi được ngày: ${WR.lineTotals(g).name}: ${v.error}`);
        render(); return;
      }
    }
    group.forEach((g) => { g.from = from; g.to = to; });
    setCart(cart);
    toast(group.length > 1 ? `Đã đổi ngày cho cả combo: ${fmtDate(from)} → ${fmtDate(to)}` : `Đã đổi ngày: ${fmtDate(from)} → ${fmtDate(to)}`);
    render();
  };

  // Đổi màu / mẫu
  document.getElementById("cart-list").addEventListener("change", (e) => {
    const sel = e.target.closest("[data-variant]"); if (!sel) return;
    const id = sel.closest(".cart-item").dataset.id;
    const cart = getCart();
    const it = cart.find((x) => x.id === id); if (!it) return;
    const sku = sel.value;
    const v = WR.validateRental({ sku, from: it.from, to: it.to, qty: it.qty, ignoreCartId: id });
    if (!v.ok) { toast(v.error); render(); return; }
    const twin = cart.find((x) => x.id !== id && x.ma_bien_the === sku && x.from === it.from && x.to === it.to && (x.combo || "") === (it.combo || ""));
    let next = cart;
    if (twin) { twin.qty = Math.min(10, Number(twin.qty) + Number(it.qty)); next = cart.filter((x) => x.id !== id); }
    else it.ma_bien_the = sku;
    setCart(next);
    toast(`Đã đổi sang màu ${variantBySku(sku)?.variant.mau_sac || "mặc định"}`);
    render();
  });

  document.getElementById("cart-sum").addEventListener("click", (e) => {
    const a = e.target.closest(".is-disabled"); if (!a) return;
    e.preventDefault(); toast("Hãy sửa các món đang báo lỗi (ngày đã qua hoặc hết hàng) trước khi thanh toán.");
  });

  document.getElementById("cart-list").addEventListener("click", (e) => {
    const card = e.target.closest(".cart-item"); if (!card) return;
    const act = e.target.closest("[data-act]")?.dataset.act; if (!act) return;
    const id = card.dataset.id;
    const cart = getCart();
    const item = cart.find((x) => x.id === id); if (!item) return;
    if (act === "del") {
      const name = WR.lineTotals(item).name;
      const inCombo = item.combo ? " Món này thuộc combo, xóa đi thì combo sẽ không còn đủ bộ để được giảm 10%." : "";
      WR.confirmDialog({
        title: "Xóa món này khỏi giỏ?",
        message: `<strong>${esc(name)}</strong> (${item.qty} món, ${fmtDate(item.from)} → ${fmtDate(item.to)}) sẽ bị xóa khỏi giỏ thuê.${inCombo}`,
        confirmText: "Xóa món", cancelText: "Giữ lại", danger: true,
      }).then((yes) => { if (!yes) return; removeFromCart(id); toast(`Đã xóa ${name} khỏi giỏ`); render(); });
      return;
    }
    const next = act === "plus" ? Math.min(10, (Number(item.qty) || 1) + 1) : Math.max(1, (Number(item.qty) || 1) - 1);
    if (act === "plus") {
      const v = WR.validateRental({ sku: item.ma_bien_the, from: item.from, to: item.to, qty: next, ignoreCartId: id });
      if (!v.ok) { toast(v.error); return; }
    }
    item.qty = next;
    setCart(cart);
    render();
  });

  // Xóa toàn bộ giỏ
  document.getElementById("cart-clear").addEventListener("click", () => {
    const cart = getCart();
    WR.confirmDialog({
      title: "Xóa toàn bộ giỏ thuê?",
      message: `Tất cả <strong>${cart.reduce((n, x) => n + Number(x.qty || 0), 0)} món</strong> trong giỏ sẽ bị xóa. Bạn không thể hoàn tác thao tác này.`,
      confirmText: "Xóa toàn bộ", cancelText: "Giữ lại", danger: true,
    }).then((yes) => { if (!yes) return; WR.clearCart(); toast("Đã xóa toàn bộ giỏ thuê"); render(); });
  });

  // Giỏ lưu từ hôm trước: tự dời các món (cả combo) đã qua ngày nhận sang ngày mai
  const stale = WR.rollStaleCart();
  if (stale.moved.length) toast(`Ngày nhận cũ đã qua nên ${stale.moved.join(", ")} được dời sang ${fmtDate(stale.from)} (giữ nguyên số ngày thuê). Bạn có thể đổi lại ngày bên dưới.`);
  render();
})();
