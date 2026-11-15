(function () {
  "use strict";
  WR.initPage();
  const { esc, vnd, fmtDate, currentUser, loginUser, registerUser, logoutUser, getOrders, statusMeta, toast } = WR;
  const root = document.getElementById("account-root");
  const params = new URLSearchParams(location.search);

  const ordersOf = (user) => getOrders().filter((o) => !user || o.customer?.email === user.email || user.role === "admin");

  const renderAuth = () => {
    root.innerHTML = `
      <nav class="breadcrumb"><a href="index.html">Trang chủ</a><span>/</span><span>Tài khoản</span></nav>
      <h1 class="section-title">Đăng nhập / Đăng ký</h1>
      <p class="section-sub" style="margin:8px 0 20px">Dùng để lưu đơn thuê trên trình duyệt này. Không gửi dữ liệu ra máy chủ.</p>
      <div class="auth-grid">
        <form class="form-card" id="login-form">
          <h2>Đăng nhập</h2>
          <div class="field"><label for="l-email">Email</label><input id="l-email" type="email" required></div>
          <div class="field"><label for="l-pass">Mật khẩu</label><input id="l-pass" type="password" required></div>
          <button class="btn btn-primary" type="submit">Đăng nhập</button>
          <p class="meta" style="margin-top:12px">Admin demo: admin@wanderent.vn / wanderent</p>
        </form>
        <form class="form-card" id="reg-form">
          <h2>Tạo tài khoản</h2>
          <div class="field"><label for="r-name">Họ tên</label><input id="r-name" required></div>
          <div class="field"><label for="r-email">Email</label><input id="r-email" type="email" required></div>
          <div class="field"><label for="r-phone">Số điện thoại</label><input id="r-phone"></div>
          <div class="field"><label for="r-pass">Mật khẩu</label><input id="r-pass" type="password" required></div>
          <button class="btn btn-outline" type="submit">Đăng ký</button>
        </form>
      </div>`;
    document.getElementById("login-form").addEventListener("submit", (e) => {
      e.preventDefault();
      const r = loginUser(document.getElementById("l-email").value, document.getElementById("l-pass").value);
      if (!r.ok) { toast(r.error); return; }
      render();
    });
    document.getElementById("reg-form").addEventListener("submit", (e) => {
      e.preventDefault();
      const r = registerUser({
        name: document.getElementById("r-name").value,
        email: document.getElementById("r-email").value,
        phone: document.getElementById("r-phone").value,
        password: document.getElementById("r-pass").value,
      });
      if (!r.ok) { toast(r.error); return; }
      toast("Đã tạo tài khoản"); render();
    });
  };

  const render = () => {
    const user = currentUser();
    if (!user) { renderAuth(); return; }
    const highlight = params.get("order");
    const list = user.role === "admin" ? getOrders() : getOrders().filter((o) => o.customer?.email === user.email);
    root.innerHTML = `
      <nav class="breadcrumb"><a href="index.html">Trang chủ</a><span>/</span><span>Tài khoản</span></nav>
      <div class="section-head">
        <div>
          <p class="eyebrow">Xin chào</p>
          <h1 class="section-title">${esc(user.name)}</h1>
          <p>${esc(user.email)}${user.role === "admin" ? " · Quản trị" : ""}</p>
        </div>
        <div style="display:flex;gap:8px;flex-wrap:wrap">
          ${user.role === "admin" ? `<a class="btn btn-primary" href="admin.html">Mở bảng đơn thuê</a>` : ""}
          <button class="btn btn-outline" type="button" id="btn-out">Đăng xuất</button>
        </div>
      </div>
      <h2 style="margin:8px 0 12px">Đơn thuê của bạn</h2>
      ${list.length ? `<div style="overflow:auto"><table class="order-table">
        <thead><tr><th>Mã đơn</th><th>Ngày thuê</th><th>Cọc</th><th>Trạng thái</th><th>Hoàn cọc</th></tr></thead>
        <tbody>${list.map((o) => {
          const st = statusMeta(o.status);
          const refund = o.refundStatus === "done" ? "Đã hoàn" : o.refundStatus === "held" ? "Đang giữ" : "Chưa tới hạn";
          return `<tr ${o.id === highlight ? 'style="background:#EEF4F0"' : ""}>
            <td><strong>${esc(o.id)}</strong><br><small>${esc(o.customer?.name || "")}</small></td>
            <td>${fmtDate(o.from)} → ${fmtDate(o.to)}</td>
            <td>${vnd(o.totals?.deposit)}</td>
            <td><span class="status-pill" style="background:${st.color}">${esc(st.label)}</span></td>
            <td>${esc(refund)}</td>
          </tr>`;
        }).join("")}</tbody>
      </table></div>` : `<div class="empty">Chưa có đơn. <a href="products.html">Thuê thiết bị</a></div>`}
      ${highlight ? `<p class="stock-banner ok" style="margin-top:16px">Đã ghi nhận đơn <strong>${esc(highlight)}</strong>. Cọc được giữ và sẽ hoàn sau khi trả đồ.</p>` : ""}`;
    document.getElementById("btn-out").addEventListener("click", () => { logoutUser(); location.reload(); });
  };

  render();
})();
