/* Hóa đơn đơn thuê — in / lưu PDF, gửi email (mô phỏng) */
(function () {
  "use strict";
  WR.initPage();
  const { esc, vnd, fmtDate, STORE, statusMeta, orderLines, invoiceNo, PAY_LABEL } = WR;
  const root = document.getElementById("invoice-root");
  const id = new URLSearchParams(location.search).get("id");
  const o = WR.getOrders().find((x) => x.id === id);
  if (!o) {
    root.innerHTML = `<div class="empty">Không tìm thấy hóa đơn cho đơn <strong>${esc(id || "")}</strong> trên trình duyệt này.
      <br><a href="account.html">Về trang tài khoản</a></div>`;
    return;
  }
  const t = o.totals || {};
  const lines = orderLines(o);
  const st = statusMeta(o.status);
  const sent = WR.getOutbox().filter((m) => m.orderId === o.id);
  document.title = `Hóa đơn ${invoiceNo(o)} – WANDERENT`;

  root.innerHTML = `
    <div class="invoice-actions no-print">
      <button class="btn btn-primary" type="button" id="btn-print" data-icon="receipt">In / Lưu PDF</button>
      <a class="btn btn-outline" href="${WR.mailtoInvoice(o)}" data-icon="mail">Gửi bằng ứng dụng email</a>
      <button class="btn btn-ghost" type="button" id="btn-resend">Gửi lại email hóa đơn</button>
    </div>
    ${sent.length ? `<p class="stock-banner ok no-print">Đã gửi hóa đơn tới <strong>${esc(sent[0].to)}</strong> lúc ${new Date(sent[0].sentAt).toLocaleString("vi-VN")} (mô phỏng, ${sent.length} lần).</p>` : ""}
    <article class="invoice">
      <header class="inv-head">
        <div>
          <img src="assets/img/logo.png" alt="WANDERENT" width="150" height="50">
          <p>${esc(STORE.name)}<br>${esc(STORE.address)}<br>${esc(STORE.phone)} · ${esc(STORE.email)}</p>
        </div>
        <div class="inv-meta">
          <h1>HÓA ĐƠN THUÊ ĐỒ</h1>
          <p>Số: <strong>${esc(invoiceNo(o))}</strong><br>Mã đơn: ${esc(o.id)}<br>Ngày lập: ${new Date(o.createdAt).toLocaleDateString("vi-VN")}<br>
          Trạng thái: <span class="status-pill" style="background:${st.color}">${esc(st.label)}</span></p>
        </div>
      </header>
      <section class="inv-parties">
        <div><h2>Khách thuê</h2><p>${esc(o.customer?.name)}<br>${esc(o.customer?.phone)}<br>${esc(o.customer?.email)}</p></div>
        <div><h2>Nhận đồ</h2><p>${o.fulfill === "delivery" ? "Giao tận nơi" : "Nhận tại cửa hàng"}${o.delivery ? ` · người nhận ${esc(o.delivery.recipient)}, ${esc(WR.fmtPhone(o.delivery.phone))}` : ""}<br>${esc(o.address || STORE.address)}<br>
          Thuê từ <strong>${fmtDate(o.from)}</strong> đến <strong>${fmtDate(o.to)}</strong></p></div>
      </section>
      <div class="table-wrap"><table class="inv-table">
        <thead><tr><th>Thiết bị</th><th>SL</th><th>Số ngày</th><th>Cách tính</th><th class="num">Tiền thuê</th><th class="num">Cọc</th></tr></thead>
        <tbody>${lines.map((l) => `<tr>
          <td>${esc(l.name)}${l.color ? `<br><small>${esc(l.color)}</small>` : ""}${l.comboApplied ? `<br><small class="tag">Combo</small>` : ""}</td>
          <td>${l.qty}</td><td>${l.days}</td>
          <td><small>${(l.breakdown || []).map((b) => `${esc(b.label)}: ${b.days} × ${vnd(b.unit)}`).join("<br>") || vnd(l.rentDay) + "/ngày"}</small></td>
          <td class="num">${vnd(l.rent)}</td><td class="num">${vnd(l.deposit)}</td>
        </tr>`).join("")}</tbody>
      </table></div>
      <dl class="inv-totals">
        <div><dt>Tạm tính tiền thuê</dt><dd>${vnd(t.rentGross ?? t.rent)}</dd></div>
        ${t.comboDiscount ? `<div><dt>Giảm combo 10%</dt><dd>− ${vnd(t.comboDiscount)}</dd></div>` : ""}
        ${t.studentDiscount ? `<div><dt>Ưu đãi HSSV 10%</dt><dd>− ${vnd(t.studentDiscount)}</dd></div>` : ""}
        <div class="strong"><dt>Tiền thuê (thanh toán khi nhận đồ)</dt><dd>${vnd(t.rent)}</dd></div>
        <div><dt>Tiền cọc 30% (được hoàn khi trả hàng)</dt><dd>${vnd(t.deposit)}</dd></div>
        <div><dt>Phí giao nhận</dt><dd>${vnd(t.ship || 0)}</dd></div>
        <div class="strong"><dt>Đã thanh toán khi đặt (${esc(PAY_LABEL[o.payMethod] || o.payMethod || "")}${o.payment?.last4 ? " •••• " + esc(o.payment.last4) : ""})</dt><dd>${vnd(t.todayPay)}</dd></div>
        ${o.payment ? `<div><dt>Mã giao dịch</dt><dd>${esc(o.payment.txnId)} · ${new Date(o.payment.paidAt).toLocaleString("vi-VN")}</dd></div>` : ""}
        ${o.refund ? `<div><dt>Khấu trừ cọc</dt><dd>− ${vnd(o.refund.deduction)}</dd></div><div class="strong"><dt>Cọc đã hoàn</dt><dd>${vnd(o.refund.amount)}</dd></div>` : ""}
      </dl>
      <footer class="inv-foot">
        <p>Cọc được hoàn khi trả hàng đúng hạn, đủ phụ kiện, sau khi nhân viên kiểm tra (1–3 ngày làm việc). Trả trễ ${vnd(WR.LATE_FEE_PER_DAY)}/ngày/món.</p>
        <p>Bản demo học thuật: hóa đơn không có giá trị thanh toán thật.</p>
      </footer>
    </article>`;
  WR.hydrateIcons(root);
  document.getElementById("btn-print").addEventListener("click", () => window.print());
  document.getElementById("btn-resend").addEventListener("click", () => {
    const m = WR.sendInvoiceEmail(o, "Gửi lại theo yêu cầu");
    WR.toast(`Đã gửi lại hóa đơn tới ${m.to} (mô phỏng).`);
    setTimeout(() => location.reload(), 900);
  });
})();
