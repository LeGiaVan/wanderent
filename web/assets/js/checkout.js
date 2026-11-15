(function () {
  "use strict";
  WR.initPage();
  const { vnd, getCart, cartTotals, currentUser, createOrder, clearCart, toast, STORE } = WR;
  const cart = getCart();
  if (!cart.length) { location.replace("cart.html"); return; }

  const user = currentUser();
  if (user) {
    document.getElementById("c-name").value = user.name || "";
    document.getElementById("c-email").value = user.email || "";
    document.getElementById("c-phone").value = user.phone || "";
  }

  const form = document.getElementById("checkout-form");
  const addrWrap = document.getElementById("addr-wrap");
  const renderSum = () => {
    const delivery = form.fulfill.value === "delivery";
    const tot = cartTotals(cart, delivery);
    document.getElementById("pay-sum").innerHTML = `
      <h2>Đơn thuê ${cart.length} món</h2>
      ${tot.lines.map((l) => `<div class="row"><span>${l.qty} × ${l.name}</span><span>${vnd(l.rent)}</span></div>`).join("")}
      <div class="row"><span>Tiền thuê (khi nhận đồ)</span><strong>${vnd(tot.rent)}</strong></div>
      <div class="row"><span>Cọc 30% (hoàn lại)</span><strong>${vnd(tot.deposit)}</strong></div>
      <div class="row"><span>Phí giao nhận</span><strong>${vnd(tot.ship)}</strong></div>
      <div class="row total"><span>Thanh toán ngay</span><strong>${vnd(tot.todayPay)}</strong></div>
      <p class="meta" style="margin:12px 0">Sau khi trả đồ đúng hạn, cọc được hoàn trong 1–3 ngày làm việc.</p>
      <button class="btn btn-primary btn-block" type="submit">Thanh toán cọc ${vnd(tot.todayPay)}</button>
      <a class="btn btn-outline btn-block" href="cart.html" style="margin-top:8px">Quay lại giỏ</a>`;
  };
  form.addEventListener("change", () => {
    addrWrap.hidden = form.fulfill.value !== "delivery";
    renderSum();
  });
  form.addEventListener("submit", (e) => {
    e.preventDefault();
    const delivery = form.fulfill.value === "delivery";
    const addr = delivery ? document.getElementById("c-addr").value.trim() : STORE.address;
    if (delivery && !addr) { toast("Nhập địa chỉ giao hàng."); return; }
    const tot = cartTotals(cart, delivery);
    const dates = { from: cart[0].from, to: cart[0].to };
    const order = createOrder({
      status: "confirmed",
      refundStatus: "held",
      customer: {
        name: document.getElementById("c-name").value.trim(),
        phone: document.getElementById("c-phone").value.trim(),
        email: document.getElementById("c-email").value.trim().toLowerCase(),
      },
      fulfill: form.fulfill.value,
      address: addr,
      note: document.getElementById("c-note").value.trim(),
      payMethod: form.pay.value,
      from: dates.from, to: dates.to,
      items: cart.map((x) => ({ ma_bien_the: x.ma_bien_the, qty: x.qty, from: x.from, to: x.to })),
      totals: tot,
    });
    clearCart();
    location.href = "account.html?order=" + encodeURIComponent(order.id);
  });
  renderSum();
})();
