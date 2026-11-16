/* =====================================================================
   Thanh toán cọc (DEMO) — MoMo QR · Chuyển khoản VietQR · Thẻ + OTP
   Không kết nối cổng thanh toán thật. Đơn được giữ 15 phút ở trạng thái "Chờ thanh toán cọc".
   ===================================================================== */
(function () {
  "use strict";
  WR.initPage();
  const { esc, vnd, fmtDate, toast, STORE } = WR;
  const root = document.getElementById("pay-root");
  const id = new URLSearchParams(location.search).get("id");
  const PENDING_KEY = "wanderent_pending_order";
  const DEMO_OTP = "123456";
  const CARD_OK = "4111111111111111";
  const CARD_DECLINE = "4000000000000002";

  let order = WR.getOrders().find((o) => o.id === id);
  let method = order?.payMethod || "momo";
  let timer = null;

  const steps = (cur) => `<ol class="checkout-steps" aria-label="Các bước đặt thuê">
      <li class="done"><a href="cart.html">Giỏ thuê</a></li>
      <li class="done">${cur === 3 ? '<a href="checkout.html">Thông tin &amp; nhận đồ</a>' : "Thông tin &amp; nhận đồ"}</li>
      <li class="${cur === 3 ? "cur" : "done"}" ${cur === 3 ? 'aria-current="step"' : ""}>Thanh toán cọc</li>
      <li class="${cur === 4 ? "cur" : ""}" ${cur === 4 ? 'aria-current="step"' : ""}>Hoàn tất</li>
    </ol>`;

  if (!order) {
    root.innerHTML = `<div class="empty">Không tìm thấy đơn <strong>${esc(id || "")}</strong>. <a href="cart.html">Về giỏ thuê</a></div>`;
    return;
  }
  if (order.status !== "deposit_pending") {
    if (order.status === "cancelled") {
      root.innerHTML = `${steps(3)}<div class="pay-result fail"><h1>Đơn ${esc(order.id)} đã hủy</h1>
        <p>Phiên thanh toán đã hết hạn hoặc bị hủy. Giỏ thuê của bạn vẫn còn nguyên.</p>
        <a class="btn btn-primary" href="checkout.html">Đặt lại</a></div>`;
    } else location.replace(WR.invoiceUrl(order));
    return;
  }

  const amount = order.totals?.todayPay || 0;
  const transferNote = `WANDERENT ${order.id}`;

  /* ---------- Mã QR minh họa (không quét được thật) ---------- */
  const hash = (str) => { let h = 2166136261; for (const c of str) { h ^= c.charCodeAt(0); h = Math.imul(h, 16777619); } return h >>> 0; };
  const qrSVG = (seed, size = 29) => {
    let x = hash(seed) || 1;
    const rnd = () => { x ^= x << 13; x ^= x >>> 17; x ^= x << 5; return (x >>> 0) / 4294967296; };
    const finder = (r, c) => {
      const inF = (r0, c0) => r >= r0 && r < r0 + 7 && c >= c0 && c < c0 + 7;
      for (const [r0, c0] of [[0, 0], [0, size - 7], [size - 7, 0]]) {
        if (inF(r0, c0)) { const rr = r - r0, cc = c - c0; return rr === 0 || rr === 6 || cc === 0 || cc === 6 || (rr >= 2 && rr <= 4 && cc >= 2 && cc <= 4) ? 1 : 0; }
      }
      return -1;
    };
    let cells = "";
    for (let r = 0; r < size; r++) for (let c = 0; c < size; c++) {
      const f = finder(r, c);
      const on = f === -1 ? rnd() > 0.52 : f === 1;
      if (on) cells += `<rect x="${c}" y="${r}" width="1" height="1"/>`;
    }
    return `<svg viewBox="-2 -2 ${size + 4} ${size + 4}" class="qr" role="img" aria-label="Mã QR minh họa"><rect x="-2" y="-2" width="${size + 4}" height="${size + 4}" fill="#fff"/><g fill="#1E2322">${cells}</g></svg>`;
  };

  /* ---------- Khung chính ---------- */
  const render = () => {
    root.innerHTML = `
      ${steps(3)}
      <div class="pay-layout">
        <section class="form-card pay-main">
          <a class="pay-back" href="checkout.html">${WR.icon("arrow", "icon flip")}Quay lại sửa thông tin nhận hàng</a>
          <div class="pay-head">
            <h1>Thanh toán cọc</h1>
            <p class="pay-timer" id="pay-timer" aria-live="off"></p>
          </div>
          <div class="pay-tabs" role="tablist" aria-label="Cách thanh toán">
            ${[["momo", "MoMo", "Ví MoMo"], ["transfer", "VCB", "Chuyển khoản"], ["card", "VISA", "Thẻ"]].map(([k, logo, label]) => `
              <button type="button" role="tab" data-m="${k}" aria-selected="${method === k}"><span class="pay-logo ${k === "transfer" ? "bank" : k}">${logo}</span>${label}</button>`).join("")}
          </div>
          <div id="pay-body"></div>
          <button type="button" class="link-btn pay-cancel" id="pay-cancel">Hủy thanh toán và quay lại sửa đơn</button>
        </section>
        <aside class="summary-box pay-aside">
          <h2>Đơn ${esc(order.id)}</h2>
          <p class="meta">${fmtDate(order.from)} → ${fmtDate(order.to)} · ${order.fulfill === "delivery" ? "Giao tận nơi" : "Nhận tại cửa hàng"}</p>
          <a class="link-more small" href="checkout.html">Sửa thông tin</a>
          ${order.fulfill === "delivery" ? `<p class="pay-addr">${esc(order.delivery?.recipient || order.customer?.name)} · ${esc(WR.fmtPhone(order.delivery?.phone || order.customer?.phone))}<br><small>${esc(order.address)}</small></p>` : ""}
          <div class="row"><span>Cọc 30% <small>(hoàn lại)</small></span><span>${vnd(order.totals?.deposit)}</span></div>
          <div class="row"><span>Phí giao nhận</span><span>${order.totals?.ship ? vnd(order.totals.ship) : "Miễn phí"}</span></div>
          <div class="row total"><span>Cần thanh toán</span><strong>${vnd(amount)}</strong></div>
          <p class="meta" style="margin-top:10px">Tiền thuê ${vnd(order.totals?.rent)} trả khi nhận đồ.</p>
        </aside>
      </div>`;
    root.querySelectorAll("[data-m]").forEach((b) => b.addEventListener("click", () => { method = b.dataset.m; render(); }));
    document.getElementById("pay-cancel").addEventListener("click", cancelPay);
    drawMethod();
    tick();
  };

  const drawMethod = () => {
    const body = document.getElementById("pay-body");
    if (method === "momo") {
      body.innerHTML = `
        <div class="pay-qr-wrap">
          <div class="pay-qr momo-frame">${qrSVG("momo" + order.id)}<span class="qr-badge">MoMo</span></div>
          <ol class="pay-howto">
            <li>Mở ứng dụng <strong>MoMo</strong> trên điện thoại.</li>
            <li>Chọn <strong>Quét mã</strong> và quét mã QR bên cạnh.</li>
            <li>Kiểm tra số tiền <strong>${vnd(amount)}</strong> rồi xác nhận.</li>
          </ol>
        </div>
        <p class="demo-note">Bản demo: mã QR chỉ để minh họa, không quét được. Bấm nút dưới để giả lập thanh toán thành công.</p>
        <button type="button" class="btn btn-primary btn-lg btn-block" id="pay-confirm">Tôi đã thanh toán qua MoMo</button>`;
      document.getElementById("pay-confirm").addEventListener("click", () => process({ method: "momo" }));
    }
    if (method === "transfer") {
      const bank = { name: "Vietcombank", acc: "0123456789", owner: "CONG TY WANDERENT" };
      const copyRow = (label, value, show) => `<div class="copy-row"><span>${label}</span><strong>${esc(show || value)}</strong>
        <button type="button" class="btn btn-ghost" data-copy="${esc(value)}" aria-label="Sao chép ${label}">Sao chép</button></div>`;
      body.innerHTML = `
        <div class="pay-qr-wrap">
          <div class="pay-qr">${qrSVG("vietqr" + order.id)}<span class="qr-badge bank">VietQR</span></div>
          <div class="bank-info">
            ${copyRow("Ngân hàng", bank.name)}
            ${copyRow("Số tài khoản", bank.acc)}
            ${copyRow("Chủ tài khoản", bank.owner)}
            ${copyRow("Số tiền", String(amount), vnd(amount))}
            ${copyRow("Nội dung", transferNote)}
          </div>
        </div>
        <p class="demo-note">Ghi đúng <strong>nội dung chuyển khoản</strong> để hệ thống tự đối soát. Bản demo: bấm nút dưới để giả lập đã nhận tiền.</p>
        <button type="button" class="btn btn-primary btn-lg btn-block" id="pay-confirm">Tôi đã chuyển khoản</button>`;
      body.querySelectorAll("[data-copy]").forEach((b) => b.addEventListener("click", async () => {
        try { await navigator.clipboard.writeText(b.dataset.copy); toast("Đã sao chép"); } catch (e) { toast("Không sao chép được, hãy chép tay."); }
      }));
      document.getElementById("pay-confirm").addEventListener("click", () => process({ method: "transfer" }));
    }
    if (method === "card") drawCard();
  };

  /* ---------- Thẻ: nhập thông tin → OTP ---------- */
  const luhn = (num) => {
    let sum = 0, alt = false;
    for (let i = num.length - 1; i >= 0; i--) { let d = +num[i]; if (alt) { d *= 2; if (d > 9) d -= 9; } sum += d; alt = !alt; }
    return num.length >= 12 && sum % 10 === 0;
  };
  const brand = (n) => (/^4/.test(n) ? "Visa" : /^(5[1-5]|2[2-7])/.test(n) ? "Mastercard" : /^9704/.test(n) ? "Napas" : "");
  const drawCard = () => {
    const body = document.getElementById("pay-body");
    body.innerHTML = `
      <form class="card-form" id="card-form" novalidate>
        <div class="field"><label for="cc-num">Số thẻ <span class="cc-brand" id="cc-brand"></span></label>
          <input id="cc-num" inputmode="numeric" autocomplete="cc-number" placeholder="1234 5678 9012 3456" maxlength="23"></div>
        <div class="field"><label for="cc-name">Tên in trên thẻ</label><input id="cc-name" autocomplete="cc-name" placeholder="NGUYEN VAN A"></div>
        <div class="form-grid">
          <div class="field"><label for="cc-exp">Hết hạn (MM/YY)</label><input id="cc-exp" inputmode="numeric" autocomplete="cc-exp" placeholder="08/28" maxlength="5"></div>
          <div class="field"><label for="cc-cvv">CVV</label><input id="cc-cvv" inputmode="numeric" autocomplete="cc-csc" placeholder="123" maxlength="4"></div>
        </div>
        <p class="form-error" id="cc-err" hidden></p>
        <div class="demo-note">
          <strong>Thẻ dùng thử:</strong>
          <button type="button" class="link-btn" data-fill="${CARD_OK}">4111 1111 1111 1111</button> (thành công) ·
          <button type="button" class="link-btn" data-fill="${CARD_DECLINE}">4000 0000 0000 0002</button> (bị từ chối).
          Hạn bất kỳ trong tương lai, CVV 3 số bất kỳ.
        </div>
        <button type="submit" class="btn btn-primary btn-lg btn-block">Thanh toán ${vnd(amount)}</button>
      </form>`;
    const $ = (x) => document.getElementById(x);
    const err = (m, el) => { $("cc-err").hidden = !m; $("cc-err").textContent = m || ""; if (el) el.focus(); };
    $("cc-num").addEventListener("input", (e) => {
      const d = e.target.value.replace(/\D/g, "").slice(0, 19);
      e.target.value = d.replace(/(\d{4})(?=\d)/g, "$1 ");
      $("cc-brand").textContent = brand(d);
    });
    $("cc-exp").addEventListener("input", (e) => {
      const d = e.target.value.replace(/\D/g, "").slice(0, 4);
      e.target.value = d.length > 2 ? d.slice(0, 2) + "/" + d.slice(2) : d;
    });
    $("cc-cvv").addEventListener("input", (e) => { e.target.value = e.target.value.replace(/\D/g, "").slice(0, 4); });
    body.querySelectorAll("[data-fill]").forEach((b) => b.addEventListener("click", () => {
      $("cc-num").value = b.dataset.fill.replace(/(\d{4})(?=\d)/g, "$1 "); $("cc-brand").textContent = brand(b.dataset.fill);
      if (!$("cc-name").value) $("cc-name").value = (order.customer?.name || "KHACH DEMO").normalize("NFD").replace(/[̀-ͯ]/g, "").replace(/đ/gi, "D").toUpperCase();
      if (!$("cc-exp").value) $("cc-exp").value = "12/" + String((new Date().getFullYear() + 2) % 100).padStart(2, "0");
      if (!$("cc-cvv").value) $("cc-cvv").value = "123";
    }));
    $("card-form").addEventListener("submit", (e) => {
      e.preventDefault();
      const num = $("cc-num").value.replace(/\s/g, "");
      if (!luhn(num)) return err("Số thẻ chưa đúng. Kiểm tra lại 16 số trên thẻ.", $("cc-num"));
      if (!$("cc-name").value.trim()) return err("Nhập tên in trên thẻ.", $("cc-name"));
      const m = $("cc-exp").value.match(/^(\d{2})\/(\d{2})$/);
      const now = new Date();
      if (!m || +m[1] < 1 || +m[1] > 12) return err("Ngày hết hạn có dạng MM/YY, ví dụ 08/28.", $("cc-exp"));
      if (new Date(2000 + +m[2], +m[1], 0, 23, 59) < now) return err("Thẻ đã hết hạn.", $("cc-exp"));
      if (!/^\d{3,4}$/.test($("cc-cvv").value)) return err("CVV gồm 3 số ở mặt sau thẻ.", $("cc-cvv"));
      err("");
      if (num === CARD_DECLINE) {
        spinner("Đang kết nối ngân hàng…", () => { drawCard(); err("Ngân hàng từ chối giao dịch (thẻ demo bị từ chối). Hãy dùng thẻ khác hoặc chọn MoMo / chuyển khoản."); });
        return;
      }
      spinner("Đang gửi mã OTP…", () => drawOtp(num));
    });
  };

  const drawOtp = (num) => {
    let tries = 3;
    const body = document.getElementById("pay-body");
    const phone = WR.fmtPhone(order.customer?.phone || "");
    body.innerHTML = `
      <form class="otp-form" id="otp-form" novalidate>
        <h2>Xác thực OTP</h2>
        <p>Ngân hàng đã gửi mã 6 số tới số điện thoại <strong>${esc(phone.replace(/\d(?=\d{3})/g, "•"))}</strong> cho giao dịch <strong>${vnd(amount)}</strong> bằng thẻ •••• ${num.slice(-4)}.</p>
        <label class="sr-only" for="otp">Mã OTP</label>
        <input id="otp" class="otp-input" inputmode="numeric" autocomplete="one-time-code" maxlength="6" placeholder="••••••">
        <p class="form-error" id="otp-err" hidden></p>
        <p class="demo-note">Bản demo: mã OTP là <strong>${DEMO_OTP}</strong>.</p>
        <button type="submit" class="btn btn-primary btn-lg btn-block">Xác nhận</button>
        <button type="button" class="link-btn" id="otp-back">Đổi thẻ khác</button>
      </form>`;
    const input = document.getElementById("otp");
    input.focus();
    input.addEventListener("input", () => { input.value = input.value.replace(/\D/g, "").slice(0, 6); });
    document.getElementById("otp-back").addEventListener("click", drawCard);
    document.getElementById("otp-form").addEventListener("submit", (e) => {
      e.preventDefault();
      const el = document.getElementById("otp-err");
      if (input.value === DEMO_OTP) { process({ method: "card", last4: num.slice(-4), brand: brand(num) || "Thẻ" }); return; }
      tries -= 1;
      if (tries <= 0) { toast("Nhập sai OTP quá 3 lần. Hãy thử lại."); drawCard(); return; }
      el.hidden = false; el.textContent = `Mã OTP chưa đúng. Còn ${tries} lần thử.`; input.select();
    });
  };

  /* ---------- Xử lý & kết quả ---------- */
  const spinner = (text, then) => {
    const body = document.getElementById("pay-body");
    body.innerHTML = `<div class="pay-processing" role="status"><span class="spin" aria-hidden="true"></span><p>${esc(text)}</p></div>`;
    setTimeout(then, 1200);
  };

  const process = (info) => {
    // Kiểm tra lại đơn còn hiệu lực
    order = WR.getOrders().find((o) => o.id === id);
    if (!order || order.status !== "deposit_pending" || order.expiresAt < new Date().toISOString()) { expire(); return; }
    document.getElementById("pay-cancel").hidden = true;
    root.querySelectorAll("[data-m]").forEach((b) => { b.disabled = true; });
    spinner("Đang xác nhận thanh toán…", () => {
      const txn = "GD" + Date.now().toString().slice(-9);
      const payment = { method: info.method, amount, txnId: txn, paidAt: new Date().toISOString(), last4: info.last4 || "", brand: info.brand || "" };
      order = WR.updateOrder(id, { status: "confirmed", payMethod: info.method, payment, expiresAt: null },
        `Đã thanh toán cọc ${vnd(amount)} qua ${WR.PAY_LABEL[info.method]}${info.last4 ? " •••• " + info.last4 : ""} · mã GD ${txn}`);
      WR.sendInvoiceEmail(order);
      WR.clearCart();
      try { sessionStorage.removeItem(PENDING_KEY); sessionStorage.removeItem("wanderent_checkout_draft"); } catch (e) { /* bỏ qua */ }
      clearInterval(timer);
      success();
    });
  };

  const success = () => {
    root.innerHTML = `${steps(4)}
      <div class="pay-result ok">
        <div class="cd-icon">${WR.icon("check")}</div>
        <h1>Thanh toán cọc thành công!</h1>
        <p>Đơn <strong>${esc(order.id)}</strong> đã được xác nhận và giữ đồ cho bạn.</p>
        <dl class="quote pay-receipt">
          <div><dt>Số tiền đã thanh toán</dt><dd>${vnd(order.payment.amount)}</dd></div>
          <div><dt>Phương thức</dt><dd>${esc(WR.PAY_LABEL[order.payment.method])}${order.payment.last4 ? " •••• " + esc(order.payment.last4) : ""}</dd></div>
          <div><dt>Mã giao dịch</dt><dd>${esc(order.payment.txnId)}</dd></div>
          <div><dt>Ngày thuê</dt><dd>${fmtDate(order.from)} → ${fmtDate(order.to)}</dd></div>
          <div><dt>${order.fulfill === "delivery" ? "Giao tới" : "Nhận tại"}</dt><dd>${esc(order.fulfill === "delivery" ? order.address : STORE.address)}</dd></div>
          <div class="strong"><dt>Tiền thuê trả khi nhận đồ</dt><dd>${vnd(order.totals?.rent)}</dd></div>
        </dl>
        <p class="meta">Hóa đơn đã được gửi tới <strong>${esc(order.customer?.email)}</strong> (mô phỏng).</p>
        <div class="pay-result-actions">
          <a class="btn btn-primary" href="${WR.invoiceUrl(order)}">Xem hóa đơn</a>
          <a class="btn btn-outline" href="account.html?order=${encodeURIComponent(order.id)}">Theo dõi đơn</a>
          <a class="btn btn-ghost" href="index.html">Về trang chủ</a>
        </div>
      </div>`;
    WR.renderHeader();
  };

  const expire = () => {
    WR.updateOrder(id, { status: "cancelled" }, "Hết 15 phút giữ chỗ, chưa thanh toán");
    try { sessionStorage.removeItem(PENDING_KEY); } catch (e) { /* bỏ qua */ }
    clearInterval(timer);
    root.innerHTML = `${steps(3)}<div class="pay-result fail"><h1>Hết thời gian thanh toán</h1>
      <p>Đơn ${esc(id)} đã hết 15 phút giữ chỗ nên được hủy. Giỏ thuê của bạn vẫn còn nguyên, hãy đặt lại.</p>
      <a class="btn btn-primary" href="checkout.html">Đặt lại</a></div>`;
  };

  const cancelPay = () => {
    WR.confirmDialog({
      title: "Hủy thanh toán?",
      message: "Đơn chờ thanh toán sẽ bị hủy. Giỏ thuê vẫn được giữ nguyên để bạn sửa và đặt lại.",
      confirmText: "Hủy thanh toán", cancelText: "Tiếp tục thanh toán", danger: true,
    }).then((yes) => {
      if (!yes) return;
      WR.updateOrder(id, { status: "cancelled" }, "Khách hủy ở bước thanh toán");
      try { sessionStorage.removeItem(PENDING_KEY); } catch (e) { /* bỏ qua */ }
      location.href = "checkout.html";
    });
  };

  // Đồng hồ giữ chỗ 15 phút
  const tick = () => {
    clearInterval(timer);
    const el = () => document.getElementById("pay-timer");
    const draw = () => {
      const left = Math.max(0, new Date(order.expiresAt) - Date.now());
      if (!el()) return;
      if (left <= 0) { expire(); return; }
      const m = Math.floor(left / 60000), s = Math.floor((left % 60000) / 1000);
      el().innerHTML = `Giữ đồ cho bạn trong <strong>${m}:${String(s).padStart(2, "0")}</strong>`;
      el().classList.toggle("urgent", left < 120000);
    };
    draw();
    timer = setInterval(draw, 1000);
  };

  render();
})();
