(function () {
  "use strict";
  WR.seedDemo();
  const { esc, vnd, fmtDate, currentUser, loginUser, logoutUser, getOrders, updateOrder, ORDER_STATUSES, statusMeta, lineTotals, toast, STORE } = WR;

  const root = document.getElementById("admin-root");
  let selected = null;

  const gate = () => {
    const user = currentUser();
    if (user && user.role === "admin") return true;
    root.innerHTML = `
      <div class="form-card" style="max-width:420px;margin:40px auto">
        <h2>Đăng nhập quản trị</h2>
        <p class="meta" style="margin-bottom:12px">Tài khoản demo: admin@wanderent.vn / wanderent</p>
        <form id="a-login">
          <div class="field"><label>Email</label><input id="a-email" value="admin@wanderent.vn"></div>
          <div class="field"><label>Mật khẩu</label><input id="a-pass" type="password" value="wanderent"></div>
          <button class="btn btn-primary" type="submit">Vào bảng đơn</button>
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

  const render = () => {
    if (!gate()) return;
    const user = currentUser();
    document.getElementById("admin-who").textContent = user.email;
    const orders = getOrders();
    const money = orders.filter((o) => o.status !== "cancelled").reduce((s, o) => s + (o.totals?.deposit || 0), 0);
    const renting = orders.filter((o) => o.status === "picked_up").length;
    const waitRefund = orders.filter((o) => o.status === "returned").length;
    selected = selected ? orders.find((o) => o.id === selected.id) : orders[0];

    root.innerHTML = `
      <div class="admin-stats">
        <div class="stat"><span>Tổng đơn</span><b>${orders.length}</b></div>
        <div class="stat"><span>Đang thuê</span><b>${renting}</b></div>
        <div class="stat"><span>Chờ hoàn cọc</span><b>${waitRefund}</b></div>
        <div class="stat"><span>Cọc đang giữ (demo)</span><b>${vnd(money)}</b></div>
      </div>
      <div class="kanban">
        ${ORDER_STATUSES.map((st) => {
          const col = orders.filter((o) => o.status === st.id);
          return `<section class="kanban-col">
            <h3>${esc(st.label)} <small>${col.length}</small></h3>
            ${col.map((o) => `<article class="kanban-card" data-id="${esc(o.id)}">
              <strong>${esc(o.id)}</strong>
              ${esc(o.customer?.name || "")}<br>
              ${fmtDate(o.from)} → ${fmtDate(o.to)}<br>
              Cọc ${vnd(o.totals?.deposit)}
            </article>`).join("") || `<p class="meta">Trống</p>`}
          </section>`;
        }).join("")}
      </div>
      <div class="detail-drawer" id="detail"></div>
      <h2 style="margin-top:28px">Tồn kho hôm nay (${fmtDate(WR.todayISO())})</h2>
      <div id="inv"></div>`;

    drawDetail();
    drawInv();
    root.querySelectorAll(".kanban-card").forEach((el) => el.addEventListener("click", () => {
      selected = getOrders().find((o) => o.id === el.dataset.id); drawDetail();
    }));
  };

  const drawDetail = () => {
    const box = document.getElementById("detail");
    if (!selected) { box.innerHTML = "<p>Chọn một đơn trên bảng.</p>"; return; }
    const o = selected;
    const st = statusMeta(o.status);
    box.innerHTML = `
      <div class="section-head">
        <div>
          <p class="eyebrow">Đơn thuê</p>
          <h2>${esc(o.id)} · <span class="status-pill" style="background:${st.color}">${esc(st.label)}</span></h2>
          <p>${esc(o.customer?.name)} · ${esc(o.customer?.phone)} · ${esc(o.customer?.email)}</p>
          <p>${o.fulfill === "delivery" ? "Giao tận nơi" : "Nhận tại quầy"}: ${esc(o.address || STORE.address)}</p>
          <p>Ngày thuê ${fmtDate(o.from)} → ${fmtDate(o.to)} · Thanh toán: ${esc(o.payMethod)} · Hoàn cọc: ${esc(o.refundStatus)}</p>
        </div>
      </div>
      <ul>${(o.items || []).map((it) => {
        const t = lineTotals(it);
        return `<li>${t.qty} × ${esc(t.name)} (${esc(t.color || "mặc định")}) — thuê ${vnd(t.rent)}, cọc ${vnd(t.deposit)}</li>`;
      }).join("")}</ul>
      <p style="margin:10px 0">Tổng thuê ${vnd(o.totals?.rent)} · Cọc ${vnd(o.totals?.deposit)} · Giao ${vnd(o.totals?.ship)}</p>
      <label class="field" style="max-width:320px">Đổi trạng thái
        <select id="st-sel">${ORDER_STATUSES.map((s) => `<option value="${s.id}" ${s.id === o.status ? "selected" : ""}>${esc(s.label)}</option>`).join("")}</select>
      </label>
      <div style="display:flex;gap:8px;flex-wrap:wrap;margin-top:8px">
        <button class="btn btn-primary" type="button" id="btn-save">Cập nhật</button>
        <button class="btn btn-outline" type="button" id="btn-refund">Đánh dấu hoàn cọc</button>
      </div>`;
    document.getElementById("btn-save").onclick = () => {
      const status = document.getElementById("st-sel").value;
      const patch = { status };
      if (status === "refunded") patch.refundStatus = "done";
      if (status === "returned") patch.refundStatus = "processing";
      selected = updateOrder(o.id, patch);
      toast("Đã cập nhật đơn " + o.id);
      render();
    };
    document.getElementById("btn-refund").onclick = () => {
      selected = updateOrder(o.id, { status: "refunded", refundStatus: "done" });
      toast("Đã hoàn cọc đơn " + o.id);
      render();
    };
  };

  const drawInv = () => {
    const from = WR.todayISO();
    const to = WR.addDaysISO(from, 1);
    document.getElementById("inv").innerHTML = WR.PRODUCTS.map((p) => {
      const v = p.variants[0];
      const left = WR.availableQty(v.ma_bien_the, from, to);
      const cap = WR.stockCap(p);
      return `<div class="inv-row">
        <img src="${esc(WR.mediaOf(v)[0]?.thumb || "")}" alt="" referrerpolicy="no-referrer">
        <div><strong>${esc(WR.cleanName(p.ten_sp))}</strong><br><small>${esc(p.danh_muc)} · ${esc(v.ma_bien_the)}</small></div>
        <span>Kho ${cap}</span>
        <strong style="color:${left ? "var(--ok)" : "#8A3B32"}">Còn ${left}</strong>
      </div>`;
    }).join("");
  };

  document.getElementById("admin-out").addEventListener("click", () => { logoutUser(); location.href = "index.html"; });
  WR.seedDemo = WR.seedDemo;
  if (typeof WR.initPage === "function") {
    // seed via common: call getUsers through login path
  }
  render();
})();
