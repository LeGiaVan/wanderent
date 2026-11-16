/* =====================================================================
   WANDERENT — Trang quản trị (demo, dữ liệu trong localStorage)
   Tab: Đơn thuê · Tồn kho · Sản phẩm & giá · Thông tin website · Duyệt HSSV · Email đã gửi
   ===================================================================== */
(function () {
  "use strict";
  WR.seedDemo();
  const { esc, vnd, fmtDate, currentUser, loginUser, logoutUser, getOrders, updateOrder, ORDER_STATUSES, statusMeta,
    orderLines, toast, STORE, CATEGORIES, ALL_PRODUCTS, cleanName, thumbOf, icon } = WR;

  const root = document.getElementById("admin-root");
  const tabsEl = document.getElementById("admin-tabs");
  const TABS = ["don", "ton-kho", "website", "hssv", "email"];
  const state = { selected: null, q: "", view: "kanban", invCat: "", invQ: "", invDates: null, open: new Set(), hssv: "pending" };
  const qs = new URLSearchParams(location.search);
  if (qs.get("cat")) state.invCat = qs.get("cat");
  if (qs.get("q")) state.invQ = qs.get("q");
  if (location.hash === "#san-pham") history.replaceState(null, "", location.pathname + location.search + "#ton-kho");

  /* ---------- Đăng nhập ---------- */
  const gate = () => {
    const user = currentUser();
    if (user && user.role === "admin") return true;
    tabsEl.hidden = true;
    WR.renderAdminSwitch("admin"); // chưa đăng nhập → thanh tự ẩn
    root.innerHTML = `
      <div class="form-card" style="max-width:420px;margin:40px auto">
        <h2>Đăng nhập quản trị</h2>
        <p class="meta" style="margin-bottom:12px">Tài khoản demo: admin@wanderent.vn / wanderent</p>
        <form id="a-login">
          <div class="field"><label for="a-email">Email hoặc số điện thoại</label><input id="a-email" value="admin@wanderent.vn"></div>
          <div class="field"><label for="a-pass">Mật khẩu</label><input id="a-pass" type="password" value="wanderent"></div>
          <button class="btn btn-primary" type="submit">Vào trang quản trị</button>
        </form>
      </div>`;
    document.getElementById("a-login").addEventListener("submit", (e) => {
      e.preventDefault();
      const r = loginUser(document.getElementById("a-email").value, document.getElementById("a-pass").value);
      if (!r.ok || r.user.role !== "admin") { toast("Không đúng tài khoản quản trị."); return; }
      render();
    });
    return false;
  };

  const currentTab = () => (TABS.includes(location.hash.slice(1)) ? location.hash.slice(1) : "don");
  const cloneSettings = () => JSON.parse(JSON.stringify(WR.SETTINGS));
  const reloadWith = (msg, extra = "") => {
    WR.flash(msg);
    history.replaceState(null, "", location.pathname + extra + location.hash);
    location.reload();
  };

  const render = () => {
    if (!gate()) return;
    tabsEl.hidden = false;
    WR.renderAdminSwitch("admin");
    const pending = WR.getStudents().filter((s) => s.status === "pending").length;
    const badge = document.getElementById("hssv-badge");
    badge.hidden = !pending; badge.textContent = pending;
    const tab = currentTab();
    tabsEl.querySelectorAll("[data-tab]").forEach((a) => a.setAttribute("aria-current", a.dataset.tab === tab ? "page" : "false"));
    ({ don: renderOrders, "ton-kho": renderInventory, website: renderWebsite, hssv: renderStudents, email: renderOutbox })[tab]();
  };
  window.addEventListener("hashchange", render);

  const catTabs = (active, attr) => `<div class="seg-tabs" role="tablist">${[{ slug: "", name: "Tất cả" }, ...CATEGORIES].map((c) =>
    `<button type="button" role="tab" ${attr}="${c.slug}" aria-selected="${active === c.slug}">${esc(c.name)} <small>${c.slug ? ALL_PRODUCTS.filter((p) => p.danh_muc === c.name).length : ALL_PRODUCTS.length}</small></button>`).join("")}</div>`;

  /* =====================================================================
     1. ĐƠN THUÊ (kiểu Odoo: bảng trạng thái + nút xử lý theo từng bước)
     ===================================================================== */
  // Nút xử lý theo từng bước; đơn giao tận nơi có thêm bước "Đang giao hàng" chờ khách xác nhận
  const nextActions = (o) => ({
    deposit_pending: [{ to: "confirmed", label: "Xác nhận đã nhận cọc", primary: true }, { to: "cancelled", label: "Hủy đơn" }],
    confirmed: [{ to: "ready", label: "Đã chuẩn bị & kiểm tra đồ", primary: true }, { to: "cancelled", label: "Hủy đơn (hoàn 100% cọc)" }],
    ready: o.fulfill === "delivery"
      ? [{ to: "shipping", label: "Đã giao cho shipper", primary: true }]
      : [{ to: "picked_up", label: "Bàn giao cho khách tại quầy", primary: true }],
    shipping: [{ to: "picked_up", label: "Xác nhận thay khách: đã nhận hàng" }],
    picked_up: [{ to: "returned", label: "Khách đã trả đồ", primary: true }],
  }[o.status] || []);

  const filteredOrders = () => {
    const q = state.q.trim().toLowerCase();
    return getOrders().filter((o) => !q || [o.id, o.customer?.name, o.customer?.phone, o.customer?.email].join(" ").toLowerCase().includes(q));
  };

  const renderOrders = () => {
    const all = getOrders();
    const orders = filteredOrders();
    const held = all.filter((o) => ["confirmed", "ready", "picked_up", "returned"].includes(o.status)).reduce((s, o) => s + (o.totals?.deposit || 0), 0);
    const revenue = all.filter((o) => ["picked_up", "returned", "refunded"].includes(o.status)).reduce((s, o) => s + (o.totals?.rent || 0), 0);
    const today = WR.todayISO();
    if (state.selected) state.selected = all.find((o) => o.id === state.selected.id) || null;

    root.innerHTML = `
      <div class="admin-stats">
        <div class="stat"><span>Tổng đơn</span><b>${all.length}</b></div>
        <div class="stat"><span>Giao hôm nay</span><b>${all.filter((o) => o.from === today && ["confirmed", "ready"].includes(o.status)).length}</b></div>
        <div class="stat"><span>Đang thuê</span><b>${all.filter((o) => o.status === "picked_up").length}</b></div>
        <div class="stat"><span>Chờ hoàn cọc</span><b>${all.filter((o) => o.status === "returned").length}</b></div>
        <div class="stat"><span>Cọc đang giữ</span><b>${vnd(held)}</b></div>
        <div class="stat"><span>Doanh thu thuê</span><b>${vnd(revenue)}</b></div>
      </div>
      <div class="admin-toolbar">
        <input type="search" id="o-search" placeholder="Tìm mã đơn, tên, SĐT, email..." value="${esc(state.q)}">
        <div class="seg-tabs" role="tablist">
          <button type="button" data-view="kanban" aria-selected="${state.view === "kanban"}">Bảng trạng thái</button>
          <button type="button" data-view="list" aria-selected="${state.view === "list"}">Danh sách</button>
        </div>
      </div>
      ${state.view === "kanban" ? `<div class="kanban">
        ${ORDER_STATUSES.map((st) => {
          const col = orders.filter((o) => o.status === st.id);
          return `<section class="kanban-col">
            <h3><span class="dot" style="background:${st.color}"></span>${esc(st.label)} <small>${col.length}</small></h3>
            ${col.map((o) => `<button type="button" class="kanban-card ${state.selected?.id === o.id ? "sel" : ""}" data-id="${esc(o.id)}">
              <strong>${esc(o.id)}</strong>
              ${esc(o.customer?.name || "")}<br>
              ${fmtDate(o.from)} → ${fmtDate(o.to)}<br>
              Thuê ${vnd(o.totals?.rent)} · Cọc ${vnd(o.totals?.deposit)}
              ${o.issues?.length ? `<span class="tag out">Khách báo vấn đề</span>` : ""}
            </button>`).join("") || `<p class="meta">Trống</p>`}
          </section>`;
        }).join("")}
      </div>` : `<div class="table-wrap"><table class="order-table">
        <thead><tr><th>Mã đơn</th><th>Khách</th><th>Ngày thuê</th><th>Nhận</th><th>Tiền thuê</th><th>Cọc</th><th>Trạng thái</th></tr></thead>
        <tbody>${orders.map((o) => {
          const st = statusMeta(o.status);
          return `<tr class="clickable ${state.selected?.id === o.id ? "hl" : ""}" data-id="${esc(o.id)}">
            <td><strong>${esc(o.id)}</strong></td><td>${esc(o.customer?.name)}<br><small>${esc(o.customer?.phone)}</small></td>
            <td>${fmtDate(o.from)} → ${fmtDate(o.to)}</td><td>${o.fulfill === "delivery" ? "Giao tận nơi" : "Tại quầy"}</td>
            <td>${vnd(o.totals?.rent)}</td><td>${vnd(o.totals?.deposit)}</td>
            <td><span class="status-pill" style="background:${st.color}">${esc(st.label)}</span></td></tr>`;
        }).join("") || `<tr><td colspan="7">Không có đơn phù hợp.</td></tr>`}</tbody>
      </table></div>`}
      <div class="detail-drawer" id="detail"></div>`;

    const search = document.getElementById("o-search");
    search.addEventListener("input", () => { state.q = search.value; const pos = search.selectionStart; renderOrders(); const s2 = document.getElementById("o-search"); s2.focus(); s2.setSelectionRange(pos, pos); });
    root.querySelectorAll("[data-view]").forEach((b) => b.addEventListener("click", () => { state.view = b.dataset.view; renderOrders(); }));
    root.querySelectorAll("[data-id]").forEach((el) => el.addEventListener("click", () => {
      state.selected = getOrders().find((o) => o.id === el.dataset.id); renderOrders();
      document.getElementById("detail").scrollIntoView({ behavior: "smooth", block: "start" });
    }));
    drawDetail();
  };

  const drawDetail = () => {
    const box = document.getElementById("detail");
    const o = state.selected;
    if (!o) { box.innerHTML = `<p class="meta">Chọn một đơn trên bảng để xem chi tiết và xử lý.</p>`; return; }
    const st = statusMeta(o.status);
    const t = o.totals || {};
    const lines = orderLines(o);
    const stu = o.student?.email ? WR.studentOf(o.student.email) : null;
    const actions = nextActions(o);
    // Thanh tiến trình kiểu Odoo
    const flow = o.fulfill === "delivery" ? ["confirmed", "ready", "shipping", "picked_up", "returned", "refunded"] : ["confirmed", "ready", "picked_up", "returned", "refunded"];
    const idx = flow.indexOf(o.status);
    box.innerHTML = `
      <div class="detail-head">
        <div>
          <p class="eyebrow">Đơn thuê</p>
          <h2>${esc(o.id)} <span class="status-pill" style="background:${st.color}">${esc(st.label)}</span></h2>
        </div>
        <div class="detail-links">
          <a class="btn btn-outline" href="${WR.invoiceUrl(o)}" target="_blank" rel="noopener">${icon("receipt")}Hóa đơn</a>
          <button class="btn btn-ghost" type="button" id="btn-mail">${icon("mail")}Gửi lại email</button>
        </div>
      </div>
      ${o.status === "cancelled" ? "" : `<ol class="flow">${flow.map((f, i) => `<li class="${i < idx ? "done" : i === idx ? "cur" : ""}">${esc(statusMeta(f).label)}</li>`).join("")}</ol>`}
      <div class="detail-grid">
        <div>
          <h3>Khách thuê</h3>
          <p>${esc(o.customer?.name)} · ${esc(o.customer?.phone)}<br>${esc(o.customer?.email)}</p>
          <p>${o.fulfill === "delivery" ? "Giao tận nơi" : "Nhận tại quầy"}: ${esc(o.address || STORE.address)}</p>
          ${o.delivery ? `<p>Người nhận: ${esc(o.delivery.recipient)} · ${esc(WR.fmtPhone(o.delivery.phone))}${o.delivery.note ? " · " + esc(o.delivery.note) : ""}</p>` : ""}
          <p>Thuê ${fmtDate(o.from)} → ${fmtDate(o.to)} · Thanh toán cọc: ${esc(WR.PAY_LABEL[o.payMethod] || o.payMethod || "")}${o.payment ? ` · mã GD ${esc(o.payment.txnId)}${o.payment.last4 ? " · thẻ •••• " + esc(o.payment.last4) : ""}` : o.status === "deposit_pending" ? " · <strong>chưa thanh toán</strong>" : ""}</p>
          ${o.note ? `<p>Ghi chú: ${esc(o.note)}</p>` : ""}
          ${o.receivedAt ? `<p class="stock-line ok">Đã nhận hàng lúc ${new Date(o.receivedAt).toLocaleString("vi-VN")} (${esc(o.receivedBy || "")} xác nhận)</p>` : ""}
          ${(o.issues || []).map((i) => `<p class="form-error">Khách báo vấn đề (${new Date(i.at).toLocaleString("vi-VN")}): ${esc(i.text)}</p>`).join("")}
          ${stu ? `<div class="student-proof"><img src="${esc(stu.image)}" alt="Ảnh thẻ HSSV"><div><strong>Ưu đãi HSSV đã áp dụng</strong><br>${esc(stu.name)} · ${esc(stu.school)}<br><small>Đối chiếu thẻ khi giao đồ.</small></div></div>` : ""}
        </div>
        <div>
          <h3>Thiết bị</h3>
          <ul class="detail-items">${lines.map((l) => `<li><span>${l.qty} × ${esc(l.name)}${l.color ? " (" + esc(l.color) + ")" : ""} · ${l.days} ngày</span><span>${vnd(l.rent)}</span></li>`).join("")}</ul>
          <dl class="quote small">
            ${t.comboDiscount ? `<div><dt>Giảm combo</dt><dd>− ${vnd(t.comboDiscount)}</dd></div>` : ""}
            ${t.studentDiscount ? `<div><dt>Giảm HSSV</dt><dd>− ${vnd(t.studentDiscount)}</dd></div>` : ""}
            <div class="strong"><dt>Tiền thuê</dt><dd>${vnd(t.rent)}</dd></div>
            <div><dt>Cọc</dt><dd>${vnd(t.deposit)}</dd></div>
            <div><dt>Phí giao</dt><dd>${vnd(t.ship || 0)}</dd></div>
            ${o.refund ? `<div><dt>Khấu trừ</dt><dd>− ${vnd(o.refund.deduction)}</dd></div><div class="strong"><dt>Đã hoàn cọc</dt><dd>${vnd(o.refund.amount)}</dd></div>` : ""}
          </dl>
        </div>
      </div>
      <div class="detail-actions">
        ${actions.map((a) => `<button type="button" class="btn ${a.primary ? "btn-primary" : "btn-outline"}" data-to="${a.to}">${esc(a.label)}</button>`).join("")}
        ${o.status === "returned" ? `
          <div class="refund-form">
            <h3>Kiểm tra đồ trả &amp; hoàn cọc</h3>
            <div class="form-grid">
              <div class="field"><label for="rf-ded">Khấu trừ (VNĐ)</label><input id="rf-ded" type="number" min="0" step="1000" value="0"></div>
              <div class="field"><label for="rf-note">Lý do khấu trừ (nếu có)</label><input id="rf-note" placeholder="VD: trả trễ 1 ngày, thiếu 2 cọc lều"></div>
            </div>
            <p class="meta">Cọc ${vnd(t.deposit)} · Trả trễ tính ${vnd(WR.LATE_FEE_PER_DAY)}/ngày/món. Hoàn lại: <strong id="rf-amt">${vnd(t.deposit)}</strong></p>
            <button type="button" class="btn btn-primary" id="btn-refund">Xác nhận hoàn cọc</button>
          </div>` : ""}
      </div>
      <details class="manual"><summary>Đổi trạng thái thủ công</summary>
        <div class="inline-form"><select id="st-sel">${ORDER_STATUSES.map((s) => `<option value="${s.id}" ${s.id === o.status ? "selected" : ""}>${esc(s.label)}</option>`).join("")}</select>
        <button class="btn btn-outline" type="button" id="btn-save">Lưu</button></div>
      </details>
      <h3 style="margin-top:16px">Lịch sử xử lý</h3>
      <ul class="history">${(o.history || []).slice().reverse().map((h) => `<li><time>${new Date(h.at).toLocaleString("vi-VN")}</time> <strong>${esc(statusMeta(h.status).label)}</strong>${h.note ? " · " + esc(h.note) : ""}</li>`).join("") || "<li>Chưa có</li>"}</ul>`;

    box.querySelectorAll("[data-to]").forEach((b) => b.addEventListener("click", () => {
      const to = b.dataset.to;
      const patch = { status: to };
      let note = "";
      if (to === "cancelled") {
        if (!confirm(`Hủy đơn ${o.id}? Cọc sẽ được hoàn 100%.`)) return;
        patch.refundStatus = "done"; patch.refund = { amount: t.deposit || 0, deduction: 0, note: "Hủy đơn", at: new Date().toISOString() };
        note = "Hủy đơn, hoàn 100% cọc";
      }
      if (to === "returned") { patch.refundStatus = "processing"; note = "Nhận lại đồ, chờ kiểm tra"; }
      if (to === "picked_up") {
        if (o.status === "shipping") { state.selected = WR.confirmReceived(o.id, "admin"); toast(`Đơn ${o.id}: đã nhận hàng`); renderOrders(); return; }
        note = "Đã bàn giao tại quầy, khách thanh toán tiền thuê";
      }
      if (to === "shipping") note = "Đã giao cho shipper, chờ khách xác nhận nhận hàng";
      state.selected = updateOrder(o.id, patch, note);
      toast(`Đơn ${o.id}: ${statusMeta(to).label}`);
      renderOrders();
    }));
    const ded = document.getElementById("rf-ded");
    if (ded) {
      const amt = () => Math.max(0, (t.deposit || 0) - Math.max(0, Number(ded.value) || 0));
      ded.addEventListener("input", () => { document.getElementById("rf-amt").textContent = vnd(amt()); });
      document.getElementById("btn-refund").addEventListener("click", () => {
        const d = Math.min(t.deposit || 0, Math.max(0, Number(ded.value) || 0));
        const reason = document.getElementById("rf-note").value.trim();
        if (d > 0 && !reason) { toast("Nhập lý do khấu trừ để thông báo cho khách."); return; }
        state.selected = updateOrder(o.id, {
          status: "refunded", refundStatus: "done",
          refund: { amount: (t.deposit || 0) - d, deduction: d, note: reason, at: new Date().toISOString() },
        }, d ? `Hoàn ${vnd((t.deposit || 0) - d)}, khấu trừ ${vnd(d)}: ${reason}` : `Hoàn đủ cọc ${vnd(t.deposit)}`);
        toast(`Đã hoàn cọc đơn ${o.id}`);
        renderOrders();
      });
    }
    document.getElementById("btn-save").addEventListener("click", () => {
      const status = document.getElementById("st-sel").value;
      const patch = { status };
      if (status === "refunded") patch.refundStatus = "done";
      state.selected = updateOrder(o.id, patch, "Đổi trạng thái thủ công");
      toast("Đã cập nhật đơn " + o.id);
      renderOrders();
    });
    document.getElementById("btn-mail").addEventListener("click", () => {
      const m = WR.sendInvoiceEmail(o, "Admin gửi lại");
      toast(`Đã gửi hóa đơn tới ${m.to} (mô phỏng)`);
    });
  };

  /* =====================================================================
     2. KHO & SẢN PHẨM (gộp tồn kho + sửa sản phẩm/giá)
     - Tìm kiếm, lọc theo nhóm Lều / Túi ngủ / SUP / Bếp, xem theo khoảng ngày
     - Mỗi sản phẩm có nút "Chỉnh sửa" mở form ngay tại chỗ
     ===================================================================== */
  const norm = (x) => String(x || "").toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "").replace(/đ/g, "d");

  const editForm = (p) => {
    const ov = WR.SETTINGS.products[p.ma_sp] || {};
    const changed = Object.keys(ov).length || p.variants.some((v) => WR.SETTINGS.variants[v.ma_bien_the]);
    return `<form class="prod-edit" data-p="${p.ma_sp}" ${state.open.has(p.ma_sp) ? "" : "hidden"} id="edit-${p.ma_sp}">
      <div class="field"><label for="n-${p.ma_sp}">Tên hiển thị</label><input id="n-${p.ma_sp}" name="name" value="${esc(p.ten_sp)}"></div>
      <div class="form-grid three">
        <div class="field"><label for="r-${p.ma_sp}">Giá thuê/ngày (đ)</label><input id="r-${p.ma_sp}" name="rent" type="number" min="1000" step="1000" value="${WR.rentPrice(p) || ""}"></div>
        <div class="field"><label for="s-${p.ma_sp}">Số lượng kho mỗi màu</label><input id="s-${p.ma_sp}" name="stock" type="number" min="0" max="99" value="${WR.stockCap(p)}"></div>
        <label class="check pa-hide"><input type="checkbox" name="hideItem" ${p.hidden ? "checked" : ""}> Ẩn khỏi website</label>
      </div>
      <div class="form-grid three">${p.variants.map((v) => `<div class="field"><label for="v-${esc(v.ma_bien_the)}">Giá trị ${esc(v.mau_sac || "thiết bị")} (đ)</label>
        <input id="v-${esc(v.ma_bien_the)}" name="v_${esc(v.ma_bien_the)}" type="number" min="1000" step="1000" value="${v.gia_goc}"></div>`).join("")}</div>
      <div class="field"><label for="t-${p.ma_sp}">Tóm tắt mô tả</label><textarea id="t-${p.ma_sp}" name="summary" rows="2">${esc(WR.contentOf(p).tom_tat)}</textarea></div>
      <p class="meta">Ngày 2–3 tự tính 80%, từ ngày 4 tính 60% giá thuê. Cọc = 30% giá trị.</p>
      <div class="pa-actions">
        <button class="btn btn-primary" type="submit">Lưu thay đổi</button>
        <button class="btn btn-outline" type="button" data-cancel="${p.ma_sp}">Hủy</button>
        ${changed ? `<button class="btn btn-ghost" type="button" data-reset="${p.ma_sp}">Về dữ liệu gốc</button>` : ""}
        <a class="pa-view" href="product.html?id=${p.ma_sp}" target="_blank" rel="noopener">Xem trang sản phẩm</a>
      </div>
    </form>`;
  };

  const renderInventory = () => {
    root.innerHTML = `
      <div class="admin-toolbar">
        <h2>Kho &amp; sản phẩm</h2>
        <button type="button" class="btn btn-ghost" id="reset-all">Khôi phục toàn bộ dữ liệu gốc</button>
      </div>
      <div class="stock-tools">
        <label class="sr-only" for="inv-q">Tìm sản phẩm</label>
        <input type="search" id="inv-q" placeholder="Tìm theo tên, mã sản phẩm, màu..." value="${esc(state.invQ)}">
        <form class="rent-dates compact" id="inv-dates" onsubmit="return false">
          <div class="date-field"><label for="a-from">Từ ngày</label><input id="a-from" type="date"></div>
          <div class="date-field"><label for="a-to">Đến ngày</label><input id="a-to" type="date"></div>
        </form>
      </div>
      ${catTabs(state.invCat, "data-inv")}
      <p class="meta" id="inv-count" aria-live="polite"></p>
      <div id="inv-body"></div>`;
    const from = WR.todayISO();
    const range = WR.bindDateRange(document.getElementById("a-from"), document.getElementById("a-to"), {
      initial: state.invDates || { from, to: WR.addDaysISO(from, 1) }, persist: false,
      onChange: (d) => { state.invDates = { from: d.from, to: d.to }; draw(); },
    });
    root.querySelectorAll("[data-inv]").forEach((b) => b.addEventListener("click", () => { state.invCat = b.dataset.inv; renderInventory(); }));
    const qEl = document.getElementById("inv-q");
    qEl.addEventListener("input", () => { state.invQ = qEl.value; applySearch(); });

    const draw = () => {
      const d = range.get();
      const cats = CATEGORIES.filter((c) => !state.invCat || c.slug === state.invCat);
      document.getElementById("inv-body").innerHTML = cats.map((c) => {
        const ps = ALL_PRODUCTS.filter((p) => p.danh_muc === c.name);
        let cap = 0, booked = 0;
        const items = ps.map((p) => {
          const per = WR.stockCap(p);
          const vs = p.variants.map((v) => {
            const b = Math.min(per, WR.bookedQty(v.ma_bien_the, d.from, d.to));
            return { v, b, left: per - b };
          });
          const total = per * p.variants.length;
          const used = vs.reduce((sum, x) => sum + x.b, 0);
          cap += total; booked += used;
          const pct = total ? Math.round((used / total) * 100) : 100;
          const left = total - used;
          const ov = WR.SETTINGS.products[p.ma_sp] || {};
          const changed = Object.keys(ov).length || p.variants.some((v) => WR.SETTINGS.variants[v.ma_bien_the]);
          const search = norm([p.ma_sp, p.ten_sp, p.danh_muc, ...p.variants.map((v) => v.mau_sac + " " + v.ma_bien_the)].join(" "));
          return `<article class="stock-item ${p.hidden ? "is-hidden" : ""}" data-search="${esc(search)}">
            <div class="stock-row">
              <img src="${esc(thumbOf(p.variants[0]))}" alt="" referrerpolicy="no-referrer">
              <div class="stock-name"><strong>${esc(cleanName(p.ten_sp))}</strong>
                <small>${esc(p.ma_sp)}${p.variants.length > 1 ? ` · ${p.variants.length} màu` : ""}</small>
                <span>${p.hidden ? `<span class="tag out">Đang ẩn</span> ` : ""}${changed ? `<span class="tag">Đã chỉnh</span>` : ""}</span></div>
              <div class="stock-num"><span>Giá thuê</span><b>${vnd(WR.rentPrice(p))}</b></div>
              <div class="stock-num"><span>Tổng kho</span><b>${total}</b></div>
              <div class="stock-num"><span>Đang giữ/thuê</span><b>${used}</b></div>
              <div class="stock-num"><span>Còn trống</span><b class="stock-line ${left ? "ok" : "out"}">${left}</b></div>
              <div class="meter" title="${pct}% đang được giữ / cho thuê"><span style="width:${pct}%"></span></div>
              <button type="button" class="btn btn-outline stock-edit" data-edit="${p.ma_sp}" aria-expanded="${state.open.has(p.ma_sp)}" aria-controls="edit-${p.ma_sp}">Chỉnh sửa</button>
            </div>
            ${p.variants.length > 1 ? `<ul class="variant-stock">${vs.map((x) => `<li><span class="dot" style="${WR.colorStyle(x.v.mau_sac)}"></span><span>${esc(x.v.mau_sac)}: còn <b>${x.left}</b>/${per}</span></li>`).join("")}</ul>` : ""}
            ${editForm(p)}
          </article>`;
        }).join("");
        return `<section class="inv-group">
          <h2>${esc(c.name)} <small>${ps.length} sản phẩm · tổng ${cap} món · đang giữ/thuê ${booked} · còn ${cap - booked}</small></h2>
          <div class="stock-list">${items}</div>
        </section>`;
      }).join("");
      bindRows();
      applySearch();
    };

    const applySearch = () => {
      const q = norm(state.invQ.trim());
      let shown = 0;
      root.querySelectorAll(".stock-item").forEach((el) => {
        const hit = !q || el.dataset.search.includes(q);
        el.hidden = !hit; if (hit) shown += 1;
      });
      root.querySelectorAll(".inv-group").forEach((g) => { g.hidden = !g.querySelector(".stock-item:not([hidden])"); });
      document.getElementById("inv-count").textContent = q ? `Tìm thấy ${shown} sản phẩm cho “${state.invQ.trim()}”` : "";
    };

    const bindRows = () => {
      root.querySelectorAll("[data-edit]").forEach((b) => b.addEventListener("click", () => {
        const id = b.dataset.edit;
        const f = document.getElementById("edit-" + id);
        const open = f.hidden;
        f.hidden = !open; b.setAttribute("aria-expanded", open);
        if (open) { state.open.add(id); f.querySelector("input").focus(); } else state.open.delete(id);
      }));
      root.querySelectorAll("[data-cancel]").forEach((b) => b.addEventListener("click", () => {
        const id = b.dataset.cancel;
        state.open.delete(id);
        const f = document.getElementById("edit-" + id); f.reset(); f.hidden = true;
        const btn = root.querySelector(`[data-edit="${id}"]`); btn.setAttribute("aria-expanded", "false"); btn.focus();
      }));
      root.querySelectorAll("form.prod-edit").forEach((f) => f.addEventListener("submit", (e) => {
        e.preventDefault();
        const id = f.dataset.p;
        const p = WR.byId(id);
        const raw = window.WANDERENT_PRODUCTS.find((x) => x.ma_sp === id);
        const s = cloneSettings();
        const el = f.elements;
        const rent = Number(el.rent.value), stock = Number(el.stock.value);
        if (!Number.isFinite(rent) || rent < 1000) { toast("Giá thuê phải từ 1.000đ."); el.rent.focus(); return; }
        if (!Number.isInteger(stock) || stock < 0) { toast("Số lượng kho phải là số nguyên ≥ 0."); el.stock.focus(); return; }
        const ov = {};
        if (el.name.value.trim() && el.name.value.trim() !== raw.ten_sp) ov.name = el.name.value.trim();
        if (rent !== WR.DEFAULT_RENT[id]) ov.rent = rent;
        if (stock !== (WR.STOCK_BY_CAT[p.danh_muc] ?? 3)) ov.stock = stock;
        if (el.hideItem.checked) ov.hidden = true;
        const sum = el.summary.value.trim();
        if (sum && sum !== (window.WANDERENT_CONTENT[id]?.tom_tat || "")) ov.summary = sum;
        for (const v of raw.variants) {
          const val = Number(el["v_" + v.ma_bien_the].value);
          if (!Number.isFinite(val) || val < 1000) { toast("Giá trị thiết bị phải từ 1.000đ."); return; }
          if (val !== v.gia_goc) s.variants[v.ma_bien_the] = { gia_goc: val }; else delete s.variants[v.ma_bien_the];
        }
        if (Object.keys(ov).length) s.products[id] = ov; else delete s.products[id];
        WR.saveSettings(s);
        reloadWith(`Đã lưu ${id}. Website đã cập nhật.`, stockQuery());
      }));
      root.querySelectorAll("[data-reset]").forEach((b) => b.addEventListener("click", () => {
        const id = b.dataset.reset;
        const s = cloneSettings();
        delete s.products[id];
        window.WANDERENT_PRODUCTS.find((x) => x.ma_sp === id).variants.forEach((v) => delete s.variants[v.ma_bien_the]);
        WR.saveSettings(s);
        reloadWith(`Đã khôi phục ${id} về dữ liệu gốc.`, stockQuery());
      }));
    };

    document.getElementById("reset-all").addEventListener("click", () => {
      if (!confirm("Xóa mọi chỉnh sửa sản phẩm, giá và thông tin website?")) return;
      WR.resetSettings();
      reloadWith("Đã khôi phục toàn bộ dữ liệu gốc.");
    });
    draw();
  };
  // Giữ nhóm + từ khóa tìm kiếm sau khi lưu (trang tải lại để áp dụng giá mới)
  const stockQuery = () => {
    const u = new URLSearchParams();
    if (state.invCat) u.set("cat", state.invCat);
    if (state.invQ.trim()) u.set("q", state.invQ.trim());
    return u.toString() ? "?" + u : "";
  };

  /* =====================================================================
     4. THÔNG TIN WEBSITE
     ===================================================================== */
  const STORE_FIELDS = [
    ["name", "Tên điểm nhận đồ"], ["address", "Địa chỉ"], ["hours", "Giờ nhận / trả"], ["phone", "Số điện thoại"],
    ["email", "Email liên hệ"], ["bank", "Tài khoản chuyển khoản"], ["map", "Link Google Maps"],
    ["facebook", "Facebook"], ["instagram", "Instagram"], ["youtube", "YouTube"],
  ];
  const renderWebsite = () => {
    root.innerHTML = `
      <div class="admin-toolbar"><h2>Thông tin website</h2></div>
      <form class="form-card" id="site-form" style="max-width:820px">
        <p class="meta" style="margin-bottom:12px">Hiển thị ở footer, trang liên hệ, thanh toán, hóa đơn. Để trống = dùng giá trị mặc định.</p>
        <div class="form-grid">${STORE_FIELDS.map(([k, label]) => `<div class="field"><label for="sf-${k}">${label}</label>
          <input id="sf-${k}" name="${k}" value="${esc(STORE[k])}" placeholder="${esc(WR.DEFAULT_STORE[k])}"></div>`).join("")}
          <div class="field"><label for="sf-fee">Phí giao tận nơi (đ)</label><input id="sf-fee" name="fee" type="number" min="0" step="1000" value="${WR.DELIVERY_FEE}"></div>
        </div>
        <button class="btn btn-primary" type="submit">Lưu thông tin</button>
      </form>`;
    document.getElementById("site-form").addEventListener("submit", (e) => {
      e.preventDefault();
      const f = e.target.elements;
      const s = cloneSettings();
      s.store = {};
      STORE_FIELDS.forEach(([k]) => { const v = f[k].value.trim(); if (v && v !== WR.DEFAULT_STORE[k]) s.store[k] = v; });
      const fee = Number(f.fee.value);
      if (!Number.isFinite(fee) || fee < 0) { toast("Phí giao không hợp lệ."); return; }
      s.fees = fee === 50000 ? {} : { delivery: fee };
      WR.saveSettings(s);
      reloadWith("Đã lưu thông tin website.");
    });
  };

  /* =====================================================================
     5. DUYỆT HSSV
     ===================================================================== */
  const renderStudents = () => {
    const all = WR.getStudents();
    const list = all.filter((s) => !state.hssv || s.status === state.hssv);
    const count = (st) => all.filter((s) => s.status === st).length;
    root.innerHTML = `
      <div class="admin-toolbar"><h2>Duyệt ưu đãi học sinh, sinh viên</h2>
        <div class="seg-tabs" role="tablist">
          ${[["pending", "Chờ duyệt"], ["approved", "Đã duyệt"], ["rejected", "Từ chối"], ["", "Tất cả"]].map(([k, l]) =>
            `<button type="button" data-hs="${k}" aria-selected="${state.hssv === k}">${l} <small>${k ? count(k) : all.length}</small></button>`).join("")}
        </div>
      </div>
      <p class="meta" style="margin-bottom:12px">Đối chiếu họ tên, trường và hạn thẻ. Duyệt xong, đơn đặt bằng email này được giảm 10% tiền thuê (không cộng dồn combo).</p>
      <div class="student-grid">${list.map((s) => `<article class="student-card">
        <a href="${esc(s.image)}" target="_blank" rel="noopener" class="student-img"><img src="${esc(s.image)}" alt="Ảnh thẻ của ${esc(s.name)}"></a>
        <div>
          <h3>${esc(s.name)}</h3>
          <p>${esc(s.email)}<br>${esc(s.school)}${s.studentId ? " · MSSV " + esc(s.studentId) : ""}<br><small>Gửi ${new Date(s.submittedAt).toLocaleString("vi-VN")}</small></p>
          <p><span class="student-status inline ${WR.STUDENT_STATUS[s.status].cls}">${esc(WR.STUDENT_STATUS[s.status].label)}</span>${s.note ? ` <small>${esc(s.note)}</small>` : ""}</p>
          <div class="pa-actions">
            ${s.status !== "approved" ? `<button class="btn btn-primary" type="button" data-ok="${esc(s.email)}">Duyệt</button>` : ""}
            ${s.status !== "rejected" ? `<button class="btn btn-outline" type="button" data-no="${esc(s.email)}">Từ chối</button>` : ""}
          </div>
        </div>
      </article>`).join("") || `<div class="empty">Không có yêu cầu nào.</div>`}</div>`;
    root.querySelectorAll("[data-hs]").forEach((b) => b.addEventListener("click", () => { state.hssv = b.dataset.hs; renderStudents(); }));
    root.querySelectorAll("[data-ok]").forEach((b) => b.addEventListener("click", () => {
      WR.reviewStudent(b.dataset.ok, "approved", ""); toast("Đã duyệt " + b.dataset.ok); render();
    }));
    root.querySelectorAll("[data-no]").forEach((b) => b.addEventListener("click", () => {
      const reason = prompt("Lý do từ chối (khách sẽ thấy):", "Ảnh thẻ mờ hoặc thẻ đã hết hạn");
      if (reason === null) return;
      WR.reviewStudent(b.dataset.no, "rejected", reason.trim()); toast("Đã từ chối " + b.dataset.no); render();
    }));
  };

  /* =====================================================================
     6. EMAIL ĐÃ GỬI (mô phỏng)
     ===================================================================== */
  const renderOutbox = () => {
    const box = WR.getOutbox();
    root.innerHTML = `
      <div class="admin-toolbar"><h2>Email hóa đơn đã gửi</h2></div>
      <p class="meta" style="margin-bottom:12px">Bản demo không có máy chủ gửi thư: mỗi lần khách đặt thuê, hệ thống tạo hóa đơn và ghi một email vào hộp thư này.
        Khi triển khai thật, có thể nối với dịch vụ như EmailJS / SMTP để gửi đi.</p>
      <div class="table-wrap"><table class="order-table">
        <thead><tr><th>Thời gian</th><th>Người nhận</th><th>Tiêu đề</th><th>Lý do</th><th></th></tr></thead>
        <tbody>${box.map((m) => `<tr><td>${new Date(m.sentAt).toLocaleString("vi-VN")}</td><td>${esc(m.to)}</td><td>${esc(m.subject)}</td><td>${esc(m.reason || "")}</td>
          <td><a href="invoice.html?id=${encodeURIComponent(m.orderId)}" target="_blank" rel="noopener">Xem hóa đơn</a></td></tr>`).join("")
          || `<tr><td colspan="5">Chưa có email nào. Đặt thử một đơn trên website để thấy hóa đơn được gửi.</td></tr>`}</tbody>
      </table></div>`;
  };

  // Hiện thông báo sau khi lưu & tải lại
  try { const m = sessionStorage.getItem("wanderent_flash"); if (m) { sessionStorage.removeItem("wanderent_flash"); setTimeout(() => toast(m), 150); } } catch (e) { /* bỏ qua */ }
  render();
})();
