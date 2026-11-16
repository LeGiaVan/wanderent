/* Thanh toán cọc — người thuê, nhận đồ (sổ địa chỉ), ưu đãi HSSV, chọn cách thanh toán → sang trang thanh toán */
(function () {
  "use strict";
  WR.initPage();
  const { esc, vnd, fmtDate, getCart, cartTotals, currentUser, createOrder, toast, STORE } = WR;
  const $ = (id) => document.getElementById(id);
  const PENDING_KEY = "wanderent_pending_order";
  const DRAFT_KEY = "wanderent_checkout_draft";

  // Khách quay lại từ trang thanh toán mà chưa trả: hủy đơn chờ cũ để không giữ hàng 2 lần
  let cameBack = false;
  try {
    const pid = sessionStorage.getItem(PENDING_KEY);
    const po = pid && WR.getOrders().find((o) => o.id === pid);
    if (po && po.status === "deposit_pending") { WR.updateOrder(pid, { status: "cancelled" }, "Khách quay lại sửa thông tin trước khi thanh toán"); cameBack = true; }
    sessionStorage.removeItem(PENDING_KEY);
  } catch (e) { /* bỏ qua */ }

  const stale = WR.rollStaleCart();
  if (stale.moved.length) toast(`Ngày nhận cũ đã qua nên ${stale.moved.join(", ")} được dời sang ${fmtDate(stale.from)}.`);
  const cart = getCart();
  if (!cart.length) { location.replace("cart.html"); return; }

  const user = currentUser();
  const loggedIn = !!(user && user.role !== "admin");
  const form = $("checkout-form");

  /* ---------- 1. Người thuê ---------- */
  const renter = () => (loggedIn
    ? { name: user.name, phone: user.phone, email: user.email }
    : { name: $("c-name").value.trim(), phone: $("c-phone").value.trim(), email: $("c-email").value.trim().toLowerCase() });
  $("renter-box").innerHTML = loggedIn
    ? `<div class="renter-card">
        <div><strong>${esc(user.name)}</strong><span>${esc(WR.fmtPhone(user.phone))} · ${esc(user.email)}</span></div>
        <a class="btn btn-ghost" href="account.html#ho-so">Sửa thông tin</a>
      </div>`
    : `<p class="meta" style="margin-bottom:10px">Đã có tài khoản? <a href="account.html?next=checkout.html">Đăng nhập</a> để điền sẵn thông tin và dùng sổ địa chỉ.</p>
      <div class="field"><label for="c-name">Họ tên</label><input id="c-name" autocomplete="name" required></div>
      <div class="form-grid">
        <div class="field"><label for="c-phone">Số điện thoại</label><input id="c-phone" type="tel" inputmode="tel" autocomplete="tel" placeholder="0912 345 678" required></div>
        <div class="field"><label for="c-email">Email (nhận hóa đơn)</label><input id="c-email" type="email" autocomplete="email" required></div>
      </div>`;

  /* ---------- 2. Địa chỉ giao ---------- */
  const addrBox = $("addr-box");
  let addrChoice = null; // id địa chỉ đã lưu hoặc "new"
  const renderAddr = () => {
    const list = loggedIn ? WR.getAddresses(user.email) : [];
    if (addrChoice === null) addrChoice = (list.find((a) => a.isDefault) || list[0])?.id || "new";
    const r = renter();
    const newForm = `
      <div class="new-addr">
        ${WR.addressFormHTML({ recipient: r.name, phone: r.phone }, "co")}
        ${loggedIn ? `<div class="addr-save">
            <label class="check"><input type="checkbox" id="addr-save" checked> Lưu vào sổ địa chỉ cho lần sau</label>
            <label class="check"><input type="checkbox" id="addr-default" ${list.length ? "" : "checked"}> Đặt làm địa chỉ mặc định</label>
          </div>` : `<p class="meta">Đăng nhập để lưu địa chỉ cho lần thuê sau.</p>`}
      </div>`;
    addrBox.innerHTML = `<h3 class="addr-title">Giao tới địa chỉ</h3>` + (list.length ? `
      <div class="addr-list" role="radiogroup" aria-label="Chọn địa chỉ giao">
        ${list.map((a) => `<label class="radio-card addr-opt"><input type="radio" name="addr" value="${esc(a.id)}" ${addrChoice === a.id ? "checked" : ""}>
          <span><strong>${esc(a.label)}</strong>${a.isDefault ? ` <span class="tag">Mặc định</span>` : ""}<br>
          ${esc(a.recipient)} · ${esc(WR.fmtPhone(a.phone))}<br><small>${esc(WR.fmtAddress(a))}${a.note ? " · " + esc(a.note) : ""}</small></span></label>`).join("")}
        <label class="radio-card addr-opt add-new"><input type="radio" name="addr" value="new" ${addrChoice === "new" ? "checked" : ""}>
          <span><strong>+ Giao tới địa chỉ khác</strong><br><small>Nhập địa chỉ mới ngay tại đây</small></span></label>
      </div>
      <a class="link-more small" href="account.html#dia-chi">Quản lý sổ địa chỉ</a>
      ${addrChoice === "new" ? newForm : ""}` : newForm);
  };
  addrBox.addEventListener("change", (e) => {
    if (e.target.name === "addr") { addrChoice = e.target.value; renderAddr(); addrBox.querySelector("[name=recipient]")?.focus(); }
  });
  const chosenAddress = () => {
    if (addrChoice && addrChoice !== "new") return WR.getAddresses(user.email).find((a) => a.id === addrChoice);
    return WR.readAddressForm(addrBox);
  };

  /* HSSV: không xác minh ở bước này (cần admin duyệt trước). Nếu email đã được duyệt, giảm giá tự áp dụng trong tóm tắt. */

  /* ---------- Tóm tắt đơn ---------- */
  const cartSpan = () => ({
    from: cart.map((x) => x.from).sort()[0],
    to: cart.map((x) => x.to).sort().slice(-1)[0],
    same: cart.every((x) => x.from === cart[0].from && x.to === cart[0].to),
  });
  const problems = () => cart.map((it) => {
    const v = WR.validateRental({ sku: it.ma_bien_the, from: it.from, to: it.to, qty: it.qty, ignoreCartId: it.id });
    return v.ok ? null : `${WR.lineTotals(it).name}: ${v.error}`;
  }).filter(Boolean);

  const renderSum = () => {
    const delivery = form.fulfill.value === "delivery";
    const tot = cartTotals(cart, { delivery, email: renter().email });
    const probs = problems();
    const span = cartSpan();
    const nItems = cart.reduce((s, x) => s + Number(x.qty), 0);
    $("pay-sum").innerHTML = `
      <div class="co-sum-head">
        <h2>Đơn thuê · ${nItems} món</h2>
        <a href="cart.html" class="link-more small">Sửa giỏ</a>
      </div>
      <p class="co-dates">${WR.icon("calendar")}<span>${fmtDate(span.from)} → ${fmtDate(span.to)}${span.same ? ` · <strong>${tot.days} ngày</strong>` : " · ngày thuê khác nhau"}</span></p>
      <ul class="co-items">
        ${tot.lines.map((l) => `<li>
          <img src="${esc(l.variant ? WR.thumbOf(l.variant) : "")}" alt="" referrerpolicy="no-referrer">
          <div class="co-item-text">
            <strong>${esc(l.name)}</strong>
            <small>${[l.color, `${l.days} ngày`, `SL ${l.qty}`].filter(Boolean).map(esc).join(" · ")}${l.comboApplied ? ` · <span class="tag">Combo</span>` : ""}${span.same ? "" : `<br>${fmtDate(l.item.from)} → ${fmtDate(l.item.to)}`}</small>
          </div>
          <span class="co-item-price">${vnd(l.rent)}</span>
        </li>`).join("")}
      </ul>

      <div class="co-block">
        <h3>Tiền thuê <small>trả khi nhận đồ</small></h3>
        <div class="row"><span>Tạm tính</span><span>${vnd(tot.rentGross)}</span></div>
        ${tot.comboDiscount ? `<div class="row discount"><span>Giảm combo 10%</span><span>− ${vnd(tot.comboDiscount)}</span></div>` : ""}
        ${tot.studentDiscount ? `<div class="row discount"><span>Ưu đãi HSSV 10% <small>(thẻ đã xác minh)</small></span><span>− ${vnd(tot.studentDiscount)}</span></div>` : ""}
        <div class="row strong"><span>Trả khi nhận đồ</span><strong>${vnd(tot.rent)}</strong></div>
      </div>

      <div class="co-block co-now">
        <h3>Thanh toán ngay</h3>
        <div class="row"><span>Cọc 30% <small>(được hoàn khi trả hàng)</small></span><span>${vnd(tot.deposit)}</span></div>
        <div class="row"><span>Phí giao nhận</span><span>${tot.ship ? vnd(tot.ship) : "Miễn phí"}</span></div>
        <div class="row total"><span>Tổng thanh toán</span><strong>${vnd(tot.todayPay)}</strong></div>
      </div>

      ${probs.length ? `<div class="form-error">${probs.map(esc).join("<br>")}<br><a href="cart.html">Sửa trong giỏ thuê</a></div>` : ""}
      <button class="btn btn-primary btn-block btn-lg" type="submit" ${probs.length ? "disabled" : ""}>Tiếp tục thanh toán ${vnd(tot.todayPay)}</button>
      <p class="meta co-note">Hóa đơn được gửi về email sau khi thanh toán. Cọc được hoàn khi trả hàng (1–3 ngày làm việc).</p>`;
  };

  /* ---------- Khôi phục lựa chọn khi quay lại từ trang thanh toán ---------- */
  function restoreDraft() {
    let d = null;
    try { d = JSON.parse(sessionStorage.getItem(DRAFT_KEY)); } catch (e) { /* bỏ qua */ }
    if (!d) return;
    if (d.guest && !loggedIn) { $("c-name").value = d.guest.name || ""; $("c-phone").value = d.guest.phone || ""; $("c-email").value = d.guest.email || ""; }
    $("c-note").value = d.note || "";
    const pay = form.querySelector(`input[name=pay][value="${d.pay}"]`); if (pay) pay.checked = true;
    if (d.fulfill === "delivery") {
      form.querySelector("input[name=fulfill][value=delivery]").checked = true;
      addrBox.hidden = false;
      const saved = loggedIn ? WR.getAddresses(user.email) : [];
      addrChoice = d.addrChoice && (d.addrChoice === "new" || saved.some((a) => a.id === d.addrChoice)) ? d.addrChoice : null;
      renderAddr();
      if (addrChoice === "new" && d.addr) {
        const f = addrBox.querySelector("[data-addr-form]");
        ["recipient", "phone", "street", "ward", "district", "note"].forEach((k) => { const el = f?.querySelector(`[name="${k}"]`); if (el) el.value = d.addr[k] || ""; });
        const lb = f?.querySelector(`input[type=radio][value="${d.addr.label}"]`); if (lb) lb.checked = true;
      }
    }
    if (cameBack) toast("Bạn có thể sửa thông tin nhận hàng rồi tiếp tục thanh toán.");
  }

  /* ---------- Sự kiện ---------- */
  form.addEventListener("change", (e) => {
    if (e.target.name === "fulfill") {
      addrBox.hidden = form.fulfill.value !== "delivery";
      if (!addrBox.hidden) renderAddr();
    }
    renderSum();
  });
  if (!loggedIn) $("c-email").addEventListener("input", () => { clearTimeout(window.__emT); window.__emT = setTimeout(renderSum, 400); });

  const fail = (msg, el) => { toast(msg); el?.focus(); return false; };

  form.addEventListener("submit", (e) => {
    e.preventDefault();
    const probs = problems();
    if (probs.length) { toast(probs[0]); renderSum(); return; }
    const r = renter();
    if (!loggedIn) {
      if (!r.name) return fail("Nhập họ tên người thuê.", $("c-name"));
      if (!WR.isPhone(r.phone)) return fail("Số điện thoại cần đủ 10 số, bắt đầu bằng 0.", $("c-phone"));
      if (!WR.isEmail(r.email)) return fail("Nhập email hợp lệ để nhận hóa đơn.", $("c-email"));
    }
    const delivery = form.fulfill.value === "delivery";
    let addr = null;
    if (delivery) {
      addr = chosenAddress();
      const err = addr ? WR.validateAddress(addr) : "Chọn địa chỉ giao.";
      if (err) { toast(err); addrBox.querySelector("[data-addr-form] input, [name=addr]")?.focus(); return; }
      if (loggedIn && addrChoice === "new" && $("addr-save")?.checked) {
        const saved = WR.saveAddress(user.email, { ...addr, isDefault: $("addr-default")?.checked });
        if (saved.ok) { addr = saved.address; addrChoice = saved.address.id; }
      }
    }
    const tot = cartTotals(cart, { delivery, email: r.email });
    const span = cartSpan();
    const order = createOrder({
      status: "deposit_pending",
      expiresAt: new Date(Date.now() + 15 * 60 * 1000).toISOString(),
      refundStatus: "held",
      customer: { name: r.name, phone: WR.normPhone(r.phone), email: r.email },
      fulfill: form.fulfill.value,
      address: delivery ? WR.fmtAddress(addr) : STORE.address,
      delivery: delivery ? { recipient: addr.recipient, phone: WR.normPhone(addr.phone), label: addr.label, note: addr.note || "" } : null,
      note: $("c-note").value.trim(),
      payMethod: form.pay.value,
      from: span.from, to: span.to,
      items: cart.map((x) => ({ ma_bien_the: x.ma_bien_the, qty: x.qty, from: x.from, to: x.to, combo: x.combo || "" })),
      totals: WR.snapshotTotals(tot),
      student: tot.studentApplied ? { email: r.email } : null,
    });
    try {
      sessionStorage.setItem(PENDING_KEY, order.id);
      sessionStorage.setItem(DRAFT_KEY, JSON.stringify({
        fulfill: form.fulfill.value, pay: form.pay.value, note: $("c-note").value,
        addrChoice, addr: delivery && addrChoice === "new" ? addr : null,
        guest: loggedIn ? null : { name: r.name, phone: r.phone, email: r.email },
      }));
    } catch (err) { /* bỏ qua */ }
    location.href = `payment.html?id=${encodeURIComponent(order.id)}`;
  });

  restoreDraft();
  renderSum();
})();
