/* Tài khoản — đăng nhập bằng email / SĐT, đơn thuê, hồ sơ, sổ địa chỉ, ưu đãi HSSV */
(function () {
  "use strict";
  WR.initPage();
  const { esc, vnd, fmtDate, currentUser, loginUser, registerUser, logoutUser, getOrders, statusMeta, toast } = WR;
  const root = document.getElementById("account-root");
  const params = new URLSearchParams(location.search);
  const next = /^[a-z]+\.html$/.test(params.get("next") || "") ? params.get("next") : "";
  const TABS = [["don", "Đơn thuê"], ["ho-so", "Hồ sơ"], ["dia-chi", "Sổ địa chỉ"], ["hssv", "Ưu đãi HSSV"]];
  const tab = () => (TABS.some(([k]) => k === location.hash.slice(1)) ? location.hash.slice(1) : "don");
  let editing = null; // id địa chỉ đang sửa, "new" = thêm mới

  const afterLogin = (user) => {
    if (user.role === "admin") { location.href = "admin.html"; return; }
    if (next) { location.href = next; return; }
    WR.renderAdminSwitch(); WR.renderHeader(); render();
  };

  /* ---------- Đăng nhập / đăng ký ---------- */
  const renderAuth = () => {
    root.innerHTML = `
      <nav class="breadcrumb"><a href="index.html">Trang chủ</a><span>/</span><span>Tài khoản</span></nav>
      <h1 class="section-title">Đăng nhập / Đăng ký</h1>
      <p class="section-sub" style="margin:8px 0 20px">${next === "checkout.html" ? "Đăng nhập để điền sẵn thông tin và chọn địa chỉ đã lưu khi thanh toán." : "Xem lịch sử thuê, hóa đơn, trạng thái hoàn cọc và quản lý sổ địa chỉ."}</p>
      <div class="auth-grid">
        <form class="form-card" id="login-form" novalidate>
          <h2>Đăng nhập</h2>
          <div class="field"><label for="l-id">Email hoặc số điện thoại</label>
            <input id="l-id" autocomplete="username" placeholder="VD: 0912 345 678 hoặc ten@gmail.com" required></div>
          <div class="field"><label for="l-pass">Mật khẩu</label>
            <div class="pw-wrap"><input id="l-pass" type="password" autocomplete="current-password" required><button type="button" class="pw-toggle" data-pw="l-pass" aria-label="Hiện mật khẩu">Hiện</button></div></div>
          <p class="form-error" id="l-err" hidden></p>
          <button class="btn btn-primary btn-block" type="submit">Đăng nhập</button>
          <section class="demo-accounts" aria-label="Tài khoản dùng thử">
            <p class="demo-title">Tài khoản dùng thử</p>
            <div class="demo-acc">
              <span class="demo-role">Khách hàng</span>
              <dl><div><dt>Số điện thoại</dt><dd><code>0912345678</code></dd></div><div><dt>Mật khẩu</dt><dd><code>123456</code></dd></div></dl>
              <button type="button" class="btn btn-outline btn-sm" data-demo="0912345678|123456">Điền sẵn</button>
            </div>
            <div class="demo-acc">
              <span class="demo-role">Quản trị</span>
              <dl><div><dt>Email</dt><dd><code>admin@wanderent.vn</code></dd></div><div><dt>Mật khẩu</dt><dd><code>wanderent</code></dd></div></dl>
              <button type="button" class="btn btn-outline btn-sm" data-demo="admin@wanderent.vn|wanderent">Điền sẵn</button>
            </div>
          </section>
        </form>
        <form class="form-card" id="reg-form" novalidate>
          <h2>Tạo tài khoản</h2>
          <div class="field"><label for="r-name">Họ tên</label><input id="r-name" autocomplete="name" required></div>
          <div class="field"><label for="r-phone">Số điện thoại <small>(dùng để đăng nhập)</small></label><input id="r-phone" type="tel" inputmode="tel" autocomplete="tel" placeholder="0912 345 678" required></div>
          <div class="field"><label for="r-email">Email <small>(nhận hóa đơn)</small></label><input id="r-email" type="email" autocomplete="email" required></div>
          <div class="field"><label for="r-pass">Mật khẩu <small>(ít nhất 6 ký tự)</small></label>
            <div class="pw-wrap"><input id="r-pass" type="password" autocomplete="new-password" required><button type="button" class="pw-toggle" data-pw="r-pass" aria-label="Hiện mật khẩu">Hiện</button></div></div>
          <p class="form-error" id="r-err" hidden></p>
          <button class="btn btn-outline btn-block" type="submit">Đăng ký</button>
        </form>
      </div>`;
    const showErr = (id, m) => { const el = document.getElementById(id); el.hidden = !m; el.textContent = m || ""; };
    root.querySelectorAll("[data-pw]").forEach((b) => b.addEventListener("click", () => {
      const i = document.getElementById(b.dataset.pw); const show = i.type === "password";
      i.type = show ? "text" : "password"; b.textContent = show ? "Ẩn" : "Hiện"; b.setAttribute("aria-label", show ? "Ẩn mật khẩu" : "Hiện mật khẩu");
    }));
    root.querySelectorAll("[data-demo]").forEach((b) => b.addEventListener("click", () => {
      const [u, p] = b.dataset.demo.split("|");
      document.getElementById("l-id").value = u; document.getElementById("l-pass").value = p;
    }));
    document.getElementById("login-form").addEventListener("submit", (e) => {
      e.preventDefault();
      const r = loginUser(document.getElementById("l-id").value, document.getElementById("l-pass").value);
      if (!r.ok) { showErr("l-err", r.error); return; }
      afterLogin(r.user);
    });
    document.getElementById("reg-form").addEventListener("submit", (e) => {
      e.preventDefault();
      const r = registerUser({
        name: document.getElementById("r-name").value,
        email: document.getElementById("r-email").value,
        phone: document.getElementById("r-phone").value,
        password: document.getElementById("r-pass").value,
      });
      if (!r.ok) { showErr("r-err", r.error); return; }
      toast("Đã tạo tài khoản. Bạn có thể đăng nhập bằng số điện thoại.");
      afterLogin(r.user);
    });
  };

  /* ---------- Tab: Đơn thuê ---------- */
  const refundText = (o) => {
    if (o.status === "cancelled") return "—";
    if (o.status === "deposit_pending") return "Chưa thanh toán";
    if (o.status === "shipping") return "Đang giữ cọc";
    if (o.refund) return `Đã hoàn ${vnd(o.refund.amount)}${o.refund.deduction ? " (trừ " + vnd(o.refund.deduction) + ")" : ""}`;
    if (o.refundStatus === "done") return "Đã hoàn";
    if (o.status === "returned") return "Đang kiểm tra đồ, sắp hoàn";
    return "Đang giữ cọc";
  };
  // Hạn trả đồ: ngày trả + đếm ngược / quá hạn, chỉ với đơn chưa trả
  const WDAY = ["Chủ nhật", "Thứ Hai", "Thứ Ba", "Thứ Tư", "Thứ Năm", "Thứ Sáu", "Thứ Bảy"];
  const dayDiff = (a, b) => Math.round((new Date(b + "T12:00:00") - new Date(a + "T12:00:00")) / 86400000);
  const returnBox = (o, nItems) => {
    if (!["confirmed", "ready", "shipping", "picked_up"].includes(o.status)) return "";
    const today = WR.todayISO();
    const left = dayDiff(today, o.to);
    const wd = WDAY[new Date(o.to + "T12:00:00").getDay()];
    let cls = "ok", badge = "";
    if (o.status !== "picked_up") badge = dayDiff(today, o.from) > 0 ? `Nhận đồ sau ${dayDiff(today, o.from)} ngày` : "Chưa nhận đồ";
    else if (left > 1) badge = `Còn ${left} ngày`;
    else if (left === 1) { cls = "soon"; badge = "Ngày mai phải trả"; }
    else if (left === 0) { cls = "soon"; badge = "Hôm nay phải trả"; }
    else { cls = "late"; badge = `Quá hạn ${-left} ngày`; }
    const lateFee = left < 0 ? -left * WR.LATE_FEE_PER_DAY * nItems : 0;
    const where = o.fulfill === "delivery"
      ? `Mang trả tại ${esc(WR.STORE.address)} hoặc gọi <a href="${WR.telHref(WR.STORE.phone)}">${esc(WR.STORE.phone)}</a> để hẹn lấy đồ tận nơi`
      : `Trả tại ${esc(WR.STORE.address)}`;
    return `<div class="oc-return ${cls}" role="note" aria-label="Hạn trả đồ">
      <div class="ocr-date">
        <span class="ocr-label">Hạn trả đồ</span>
        <strong>${wd}, ${fmtDate(o.to)}</strong>
        <span class="ocr-time">trước ${esc((WR.STORE.hours.match(/–\s*([\d:]+)/) || [, "20:00"])[1])}</span>
      </div>
      <span class="ocr-badge">${esc(badge)}</span>
      <p class="ocr-where">${WR.icon("pin")}<span>${where}. ${lateFee ? `<strong>Phí trễ tạm tính: ${vnd(lateFee)}</strong> (${vnd(WR.LATE_FEE_PER_DAY)}/ngày/món), trừ vào cọc.` : `Trả trễ tính ${vnd(WR.LATE_FEE_PER_DAY)}/ngày/món, trừ vào cọc.`}</span></p>
    </div>`;
  };

  const ordersHTML = (user, isAdmin) => {
    const highlight = params.get("order");
    const list = isAdmin ? getOrders() : getOrders().filter((o) => o.customer?.email === user.email);
    const now = new Date().toISOString();
    if (!list.length) return `<div class="empty">Chưa có đơn. <a href="products.html">Thuê thiết bị</a></div>`;
    return `
      ${highlight ? `<p class="stock-banner ok" style="margin-bottom:16px">Đã ghi nhận đơn <strong>${esc(highlight)}</strong>. Cọc được giữ và hoàn khi trả hàng.</p>` : ""}
      <div class="order-cards">${list.map((o) => {
        const st = statusMeta(o.status);
        const lines = WR.orderLines(o);
        const canPay = o.status === "deposit_pending" && o.expiresAt && o.expiresAt > now;
        const expired = o.status === "deposit_pending" && !canPay;
        const nItems = lines.reduce((n, l) => n + Number(l.qty || 0), 0);
        return `<article class="order-card ${o.id === highlight ? "hl" : ""}" data-order="${esc(o.id)}">
          <header class="oc-head">
            <div><strong class="oc-id">${esc(o.id)}</strong><span class="meta">Đặt ngày ${new Date(o.createdAt).toLocaleDateString("vi-VN")}${isAdmin ? " · " + esc(o.customer?.name || "") : ""}</span></div>
            <span class="status-pill" style="background:${expired ? "#8A3B32" : st.color}">${expired ? "Hết hạn thanh toán" : esc(st.label)}</span>
          </header>
          <div class="oc-items">
            ${lines.slice(0, 4).map((l) => { const f = WR.variantBySku(l.ma_bien_the); return `<span class="oc-item"><img src="${esc(f ? WR.thumbOf(f.variant) : "")}" alt="" referrerpolicy="no-referrer"><span>${l.qty > 1 ? l.qty + " × " : ""}${esc(l.name)}</span></span>`; }).join("")}
            ${lines.length > 4 ? `<span class="meta">+${lines.length - 4} món khác</span>` : ""}
          </div>
          <dl class="oc-facts">
            <div><dt>Ngày nhận</dt><dd>${fmtDate(o.from)}</dd></div>
            <div><dt>Hạn trả</dt><dd class="oc-due">${fmtDate(o.to)} <small>(${WR.daysBetween(o.from, o.to)} ngày)</small></dd></div>
            <div><dt>Nhận đồ</dt><dd>${o.fulfill === "delivery" ? "Giao tận nơi" : "Tại cửa hàng"}</dd></div>
            <div><dt>Tiền thuê</dt><dd>${vnd(o.totals?.rent)}${o.totals?.studentDiscount ? " <small>(đã giảm HSSV)</small>" : ""}</dd></div>
            <div><dt>Cọc</dt><dd>${vnd(o.totals?.deposit)}</dd></div>
            <div><dt>Hoàn cọc</dt><dd>${esc(refundText(o))}</dd></div>
          </dl>
          ${returnBox(o, nItems)}
          ${o.fulfill === "delivery" ? `<p class="oc-addr">${WR.icon("pin")}<span>${esc(o.address || "")}</span></p>` : ""}
          ${o.status === "shipping" ? `<div class="oc-receive">
              <p>${WR.icon("truck")}<span><strong>Đơn đang được giao tới bạn.</strong> Khi nhận, hãy kiểm tra đủ ${nItems} món và tình trạng đồ rồi xác nhận. Nếu thiếu hoặc hỏng, báo ngay để không bị trừ cọc.</span></p>
            </div>` : ""}
          ${o.receivedAt ? `<p class="meta oc-received">${WR.icon("check")} Đã nhận hàng lúc ${new Date(o.receivedAt).toLocaleString("vi-VN")}</p>` : ""}
          ${["returned", "refunded"].includes(o.status) ? `<p class="meta oc-received">${WR.icon("check")} Đã trả đồ${(o.history || []).find((h) => h.status === "returned") ? " ngày " + new Date(o.history.find((h) => h.status === "returned").at).toLocaleDateString("vi-VN") : ""} (hạn trả ${fmtDate(o.to)})</p>` : ""}
          ${(o.issues || []).map((i) => `<p class="oc-issue">Bạn đã báo: ${esc(i.text)} <small>(${new Date(i.at).toLocaleString("vi-VN")}, cửa hàng sẽ liên hệ)</small></p>`).join("")}
          <footer class="oc-actions">
            ${o.status === "shipping" && !isAdmin ? `<button type="button" class="btn btn-primary" data-receive="${esc(o.id)}">${WR.icon("check")}Đã nhận được hàng</button>
              <button type="button" class="btn btn-outline" data-issue="${esc(o.id)}">Báo thiếu / hỏng</button>` : ""}
            ${canPay ? `<a class="btn btn-primary" href="payment.html?id=${encodeURIComponent(o.id)}">Tiếp tục thanh toán</a>` : ""}
            ${["deposit_pending", "cancelled"].includes(o.status) ? "" : `<a class="btn btn-ghost" href="${WR.invoiceUrl(o)}">${WR.icon("receipt")}Hóa đơn</a>`}
          </footer>
        </article>`;
      }).join("")}</div>`;
  };
  const bindOrders = () => {
    root.querySelectorAll("[data-receive]").forEach((b) => b.addEventListener("click", () => {
      const id = b.dataset.receive;
      WR.confirmDialog({
        title: "Xác nhận đã nhận hàng?",
        message: "Bạn xác nhận đã nhận <strong>đủ số món</strong> và đồ <strong>không bị hư hỏng</strong>. Ngày thuê được tính từ lúc nhận. Nếu có vấn đề, hãy chọn “Báo thiếu / hỏng” thay vì xác nhận.",
        confirmText: "Đã nhận đủ", cancelText: "Chưa", danger: false,
      }).then((yes) => { if (!yes) return; WR.confirmReceived(id); toast("Cảm ơn bạn! Đã xác nhận nhận hàng."); render(); });
    }));
    root.querySelectorAll("[data-issue]").forEach((b) => b.addEventListener("click", () => {
      WR.promptDialog({
        title: "Báo thiếu / hỏng khi nhận hàng",
        message: "Mô tả món bị thiếu hoặc hư hỏng. Cửa hàng sẽ gọi lại cho bạn và ghi nhận để không trừ cọc.",
        placeholder: "VD: thiếu 2 cọc lều, túi ngủ bị rách khóa kéo", confirmText: "Gửi báo cáo",
      }).then((text) => { if (!text) return; WR.reportReceiptIssue(b.dataset.issue, text); toast("Đã gửi báo cáo. Cửa hàng sẽ liên hệ sớm."); render(); });
    }));
  };

  /* ---------- Tab: Hồ sơ ---------- */
  const profileHTML = (user) => `
    <div class="profile-grid">
      <form class="form-card" id="pf-form" novalidate>
        <h2>Thông tin cá nhân</h2>
        <div class="field"><label for="pf-name">Họ tên</label><input id="pf-name" autocomplete="name" value="${esc(user.name)}"></div>
        <div class="field"><label for="pf-phone">Số điện thoại <small>(dùng để đăng nhập)</small></label><input id="pf-phone" type="tel" inputmode="tel" autocomplete="tel" value="${esc(WR.fmtPhone(user.phone))}"></div>
        <div class="field"><label for="pf-email">Email</label><input id="pf-email" value="${esc(user.email)}" readonly aria-describedby="pf-email-note">
          <small class="meta" id="pf-email-note">Email gắn với đơn thuê và ưu đãi HSSV nên không đổi được.</small></div>
        <p class="form-error" id="pf-err" hidden></p>
        <button class="btn btn-primary" type="submit">Lưu thông tin</button>
      </form>
      <form class="form-card" id="pw-form" novalidate>
        <h2>Đổi mật khẩu</h2>
        <div class="field"><label for="pw-old">Mật khẩu hiện tại</label><input id="pw-old" type="password" autocomplete="current-password"></div>
        <div class="field"><label for="pw-new">Mật khẩu mới <small>(ít nhất 6 ký tự)</small></label><input id="pw-new" type="password" autocomplete="new-password"></div>
        <div class="field"><label for="pw-new2">Nhập lại mật khẩu mới</label><input id="pw-new2" type="password" autocomplete="new-password"></div>
        <p class="form-error" id="pw-err" hidden></p>
        <button class="btn btn-outline" type="submit">Đổi mật khẩu</button>
      </form>
    </div>`;
  const bindProfile = (user) => {
    const err = (id, m) => { const el = document.getElementById(id); el.hidden = !m; el.textContent = m || ""; };
    document.getElementById("pf-form").addEventListener("submit", (e) => {
      e.preventDefault();
      const r = WR.updateProfile(user.email, { name: document.getElementById("pf-name").value, phone: document.getElementById("pf-phone").value });
      if (!r.ok) { err("pf-err", r.error); return; }
      err("pf-err", ""); toast("Đã lưu thông tin cá nhân"); WR.renderHeader(); render();
    });
    document.getElementById("pw-form").addEventListener("submit", (e) => {
      e.preventDefault();
      const n1 = document.getElementById("pw-new").value, n2 = document.getElementById("pw-new2").value;
      if (n1 !== n2) { err("pw-err", "Hai lần nhập mật khẩu mới chưa khớp."); return; }
      const r = WR.changePassword(user.email, document.getElementById("pw-old").value, n1);
      if (!r.ok) { err("pw-err", r.error); return; }
      e.target.reset(); err("pw-err", ""); toast("Đã đổi mật khẩu");
    });
  };

  /* ---------- Tab: Sổ địa chỉ ---------- */
  const addressesHTML = (user) => {
    const list = WR.getAddresses(user.email);
    const form = (a) => `<form class="form-card addr-edit" id="addr-form" novalidate>
        <h3>${a.id ? "Sửa địa chỉ" : "Thêm địa chỉ mới"}</h3>
        ${WR.addressFormHTML(a, "ac")}
        <label class="check"><input type="checkbox" id="ac-default" ${a.isDefault || !list.length ? "checked" : ""}> Đặt làm địa chỉ mặc định khi giao hàng</label>
        <p class="form-error" id="ac-err" hidden></p>
        <div class="pa-actions"><button class="btn btn-primary" type="submit">Lưu địa chỉ</button><button class="btn btn-outline" type="button" id="ac-cancel">Hủy</button></div>
      </form>`;
    return `
      <div class="addr-head">
        <p class="meta">Địa chỉ giao trong TP.HCM. Địa chỉ mặc định sẽ được chọn sẵn khi bạn đặt giao tận nơi.</p>
        ${editing ? "" : `<button class="btn btn-primary" type="button" id="addr-add">+ Thêm địa chỉ</button>`}
      </div>
      ${editing === "new" ? form({ recipient: user.name, phone: user.phone }) : ""}
      <div class="addr-cards">
        ${list.map((a) => editing === a.id ? form(a) : `
          <article class="addr-card ${a.isDefault ? "is-default" : ""}">
            <div class="addr-card-head"><strong>${esc(a.label)}</strong>${a.isDefault ? `<span class="tag">Mặc định</span>` : ""}</div>
            <p><strong>${esc(a.recipient)}</strong> · ${esc(WR.fmtPhone(a.phone))}</p>
            <p>${esc(WR.fmtAddress(a))}</p>
            ${a.note ? `<p class="meta">Ghi chú: ${esc(a.note)}</p>` : ""}
            <div class="addr-actions">
              <button type="button" class="btn btn-ghost" data-edit="${esc(a.id)}">Sửa</button>
              ${a.isDefault ? "" : `<button type="button" class="btn btn-ghost" data-default="${esc(a.id)}">Đặt mặc định</button>`}
              <button type="button" class="btn btn-ghost btn-danger-ghost" data-del="${esc(a.id)}">Xóa</button>
            </div>
          </article>`).join("") || (editing ? "" : `<div class="empty">Chưa có địa chỉ nào. Thêm địa chỉ để lần sau đặt giao tận nơi chỉ cần chọn.</div>`)}
      </div>`;
  };
  const bindAddresses = (user) => {
    document.getElementById("addr-add")?.addEventListener("click", () => { editing = "new"; render(); document.getElementById("ac-rc")?.focus(); });
    document.getElementById("ac-cancel")?.addEventListener("click", () => { editing = null; render(); });
    document.getElementById("addr-form")?.addEventListener("submit", (e) => {
      e.preventDefault();
      const a = { ...WR.readAddressForm(e.target), id: editing === "new" ? undefined : editing, isDefault: document.getElementById("ac-default").checked };
      const r = WR.saveAddress(user.email, a);
      const el = document.getElementById("ac-err");
      if (!r.ok) { el.hidden = false; el.textContent = r.error; return; }
      editing = null; toast("Đã lưu địa chỉ"); render();
    });
    root.querySelectorAll("[data-edit]").forEach((b) => b.addEventListener("click", () => { editing = b.dataset.edit; render(); }));
    root.querySelectorAll("[data-default]").forEach((b) => b.addEventListener("click", () => { WR.setDefaultAddress(user.email, b.dataset.default); toast("Đã đặt làm mặc định"); render(); }));
    root.querySelectorAll("[data-del]").forEach((b) => b.addEventListener("click", () => {
      const a = WR.getAddresses(user.email).find((x) => x.id === b.dataset.del);
      WR.confirmDialog({ title: "Xóa địa chỉ này?", message: `<strong>${esc(a.label)}</strong>: ${esc(WR.fmtAddress(a))}`, confirmText: "Xóa", cancelText: "Giữ lại", danger: true })
        .then((yes) => { if (!yes) return; WR.deleteAddress(user.email, a.id); toast("Đã xóa địa chỉ"); render(); });
    }));
  };

  /* ---------- Khung chính ---------- */
  const render = () => {
    const user = currentUser();
    if (!user) { renderAuth(); return; }
    const isAdmin = user.role === "admin";
    const t = isAdmin ? "don" : tab();
    root.innerHTML = `
      <nav class="breadcrumb"><a href="index.html">Trang chủ</a><span>/</span><span>Tài khoản</span></nav>
      <div class="section-head">
        <div>
          <p class="eyebrow">Xin chào</p>
          <h1 class="section-title">${esc(user.name)}</h1>
          <p class="meta">${esc(WR.fmtPhone(user.phone))} · ${esc(user.email)}${isAdmin ? " · Quản trị" : ""}</p>
        </div>
        <div style="display:flex;gap:8px;flex-wrap:wrap">
          ${isAdmin ? `<a class="btn btn-primary" href="admin.html">Mở trang quản trị</a>` : ""}
          <button class="btn btn-outline" type="button" id="btn-out">Đăng xuất</button>
        </div>
      </div>
      ${isAdmin ? "" : `<nav class="seg-tabs acc-tabs" aria-label="Mục tài khoản">${TABS.map(([k, l]) => `<a href="#${k}" ${t === k ? 'aria-current="page"' : ""}>${l}</a>`).join("")}</nav>`}
      <section class="acc-panel">
        ${t === "don" ? ordersHTML(user, isAdmin) : ""}
        ${t === "ho-so" ? profileHTML(user) : ""}
        ${t === "dia-chi" ? addressesHTML(user) : ""}
        ${t === "hssv" ? `<div class="form-card"><h2>Ưu đãi học sinh, sinh viên</h2>
          <p class="meta" style="margin-bottom:12px">Giảm 10% tiền thuê cho mọi đơn đặt bằng email này sau khi admin duyệt ảnh thẻ. <a href="student.html">Điều kiện áp dụng</a></p>
          <div id="student-form"></div></div>` : ""}
      </section>`;
    document.getElementById("btn-out").addEventListener("click", () => { logoutUser(); location.href = "account.html"; });
    if (t === "don") bindOrders();
    if (t === "ho-so") bindProfile(user);
    if (t === "dia-chi") bindAddresses(user);
    if (t === "hssv") WR.renderStudentForm(document.getElementById("student-form"), { email: user.email, name: user.name, lockEmail: true });
  };
  window.addEventListener("hashchange", () => { editing = null; render(); });

  render();
})();
