(function () {
  "use strict";
  WR.initPage();
  const { esc, vnd, fmtDate, mediaOf, getCart, removeFromCart, setCart, cartTotals, lineTotals, toast } = WR;

  const render = () => {
    const cart = getCart();
    const list = document.getElementById("cart-list");
    const sum = document.getElementById("cart-sum");
    if (!cart.length) {
      list.innerHTML = `<div class="empty">Giỏ thuê đang trống. <a href="products.html">Chọn thiết bị</a> để bắt đầu.</div>`;
      sum.innerHTML = "";
      return;
    }
    list.innerHTML = cart.map((it) => {
      const t = lineTotals(it);
      const img = mediaOf(t.variant)[0];
      return `<article class="cart-item" data-id="${esc(it.id)}">
        <img src="${esc(img ? img.thumb : "")}" alt="" referrerpolicy="no-referrer">
        <div>
          <h3><a href="product.html?id=${t.product.ma_sp}">${esc(t.name)}</a></h3>
          <p class="meta">${esc(t.color || "Mặc định")} · ${fmtDate(it.from)} → ${fmtDate(it.to)} · ${t.days} ngày</p>
          <p class="meta">Thuê ${vnd(t.rent)} · Cọc ${vnd(t.deposit)}</p>
          <div class="qty" style="margin-top:8px">
            <button type="button" data-act="minus">−</button>
            <input value="${it.qty}" readonly>
            <button type="button" data-act="plus">+</button>
          </div>
        </div>
        <button class="link-btn" type="button" data-act="del">Xóa</button>
      </article>`;
    }).join("");
    const tot = cartTotals(cart, false);
    sum.innerHTML = `
      <h2>Tạm tính</h2>
      <div class="row"><span>Tiền thuê</span><strong>${vnd(tot.rent)}</strong></div>
      <div class="row"><span>Cọc 30% (trả hôm nay, hoàn lại)</span><strong>${vnd(tot.deposit)}</strong></div>
      <div class="row"><span>Phí giao</span><strong>Chọn lúc thanh toán</strong></div>
      <div class="row total"><span>Cần trả hôm nay</span><strong>${vnd(tot.todayPay)}</strong></div>
      <p class="meta" style="margin:10px 0 16px">Tiền thuê thanh toán khi nhận đồ. Cọc được hoàn sau khi trả đồ đúng hạn.</p>
      <a class="btn btn-primary btn-block" href="checkout.html">Thanh toán cọc</a>
      <a class="btn btn-outline btn-block" href="products.html" style="margin-top:8px">Thuê thêm</a>`;
  };

  document.getElementById("cart-list").addEventListener("click", (e) => {
    const card = e.target.closest(".cart-item"); if (!card) return;
    const id = card.dataset.id;
    const act = e.target.closest("[data-act]")?.dataset.act;
    const cart = getCart();
    const item = cart.find((x) => x.id === id); if (!item) return;
    if (act === "del") { removeFromCart(id); toast("Đã xóa khỏi giỏ"); }
    if (act === "plus") item.qty = Math.min(10, (item.qty || 1) + 1);
    if (act === "minus") item.qty = Math.max(1, (item.qty || 1) - 1);
    if (act === "plus" || act === "minus") {
      const v = WR.validateRental({ sku: item.ma_bien_the, from: item.from, to: item.to, qty: item.qty, ignoreCartId: id });
      if (!v.ok) { toast(v.error); if (act === "plus") item.qty = Math.max(1, item.qty - 1); }
      setCart(cart);
    }
    render();
  });

  render();
})();
