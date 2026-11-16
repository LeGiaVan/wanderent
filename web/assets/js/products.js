/* Trang danh sách sản phẩm — lọc / tìm / sắp xếp phía client, đồng bộ lên URL */
(function () {
  "use strict";
  const { PRODUCTS, CATEGORIES, esc, cleanName, catBySlug, hasColors, productCard, icon, getDates, setDates } = window.WR;
  WR.initPage("products");

  const params = new URLSearchParams(location.search);
  const state = {
    dm: catBySlug(params.get("dm")) ? params.get("dm") : "",
    q: params.get("tim") || "",
    rent: "",
    colors: false,
    sort: "",
  };

  // ---- Ngày thuê ----
  const noteEl = document.getElementById("days-note");
  let initial = getDates();
  if (WR.isValidISO(params.get("from")) && WR.isValidISO(params.get("to")) && params.get("to") > params.get("from") && params.get("from") >= WR.todayISO()) {
    initial = { from: params.get("from"), to: params.get("to") };
    setDates(initial);
  }
  const range = WR.bindDateRange(document.getElementById("rd-from"), document.getElementById("rd-to"), {
    initial,
    onChange: () => { showDays(); update(); },
  });
  const showDays = () => {
    const d = range.get();
    const free = PRODUCTS.filter((p) => WR.availableQty(p.variants[0].ma_bien_the, d.from, d.to) > 0).length;
    noteEl.innerHTML = `Thời gian thuê: <strong>${d.days} ngày</strong> (${WR.fmtDate(d.from)} → ${WR.fmtDate(d.to)}). Còn trống: <strong>${free}/${PRODUCTS.length}</strong> thiết bị. <a href="inventory.html">Xem lịch còn hàng</a>`;
  };
  showDays();

  // ---- Bộ lọc danh mục ----
  const catList = document.getElementById("cat-filter");
  const renderCats = () => {
    const opts = [{ slug: "", name: "Tất cả thiết bị" }, ...CATEGORIES];
    catList.innerHTML = opts.map((c) => {
      const n = c.slug ? PRODUCTS.filter((p) => p.danh_muc === c.name).length : PRODUCTS.length;
      return `<li><button type="button" data-dm="${c.slug}" aria-pressed="${state.dm === c.slug}">
        <span>${esc(c.name)}</span><span class="count">${n}</span></button></li>`;
    }).join("");
  };
  catList.addEventListener("click", (e) => {
    const b = e.target.closest("button[data-dm]"); if (!b) return;
    state.dm = b.dataset.dm; update();
  });

  const searchEl = document.getElementById("f-search");
  searchEl.value = state.q;
  searchEl.addEventListener("input", () => { state.q = searchEl.value; update(); });
  document.getElementById("rent-filter").addEventListener("change", (e) => { state.rent = e.target.value; update(); });
  const colorsEl = document.getElementById("f-colors");
  colorsEl.addEventListener("change", () => { state.colors = colorsEl.checked; update(); });
  document.getElementById("f-sort").addEventListener("change", (e) => { state.sort = e.target.value; update(); });

  // Bỏ dấu để tìm kiếm không phân biệt dấu
  const norm = (s) => String(s).toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "").replace(/đ/g, "d");

  const filtered = () => {
    let list = PRODUCTS.slice();
    const cat = catBySlug(state.dm);
    if (cat) list = list.filter((p) => p.danh_muc === cat.name);
    if (state.q.trim()) {
      const q = norm(state.q.trim());
      list = list.filter((p) => norm(p.ten_sp + " " + p.danh_muc + " " + p.thong_so).includes(q));
    }
    if (state.rent) {
      const [a, b] = state.rent.split("-").map(Number);
      list = list.filter((p) => (WR.rentPrice(p) || 0) >= a && (WR.rentPrice(p) || 0) < b);
    }
    if (state.colors) list = list.filter(hasColors);
    if (state.sort === "rent-asc") list.sort((x, y) => (WR.rentPrice(x) || 0) - (WR.rentPrice(y) || 0));
    if (state.sort === "rent-desc") list.sort((x, y) => (WR.rentPrice(y) || 0) - (WR.rentPrice(x) || 0));
    if (state.sort === "name") list.sort((x, y) => cleanName(x.ten_sp).localeCompare(cleanName(y.ten_sp), "vi"));
    return list;
  };

  const chipsEl = document.getElementById("chips");
  chipsEl.addEventListener("click", (e) => {
    const c = e.target.closest("[data-clear]"); if (!c) return;
    const k = c.dataset.clear;
    if (k === "dm") state.dm = "";
    if (k === "q") { state.q = ""; searchEl.value = ""; }
    if (k === "rent") { state.rent = ""; document.querySelector('#rent-filter input[value=""]').checked = true; }
    if (k === "colors") { state.colors = false; colorsEl.checked = false; }
    update();
  });

  function update() {
    const cat = catBySlug(state.dm);
    // Tiêu đề + breadcrumb theo danh mục
    document.getElementById("page-title").textContent = cat ? `Thuê ${cat.name.toLowerCase()}` : "Thuê thiết bị";
    document.getElementById("bc-current").textContent = cat ? cat.name : "Thuê thiết bị";
    document.title = (cat ? cat.name : "Thuê thiết bị") + " – WANDERENT";
    if (cat) document.getElementById("page-sub").textContent = cat.desc + ". Chọn ngày để xem đồ còn trống.";

    renderCats();
    const list = filtered();
    document.getElementById("result-count").innerHTML = `Hiển thị <strong>${list.length}</strong> / ${PRODUCTS.length} thiết bị`;

    const chips = [];
    if (cat) chips.push(["dm", cat.name]);
    if (state.q.trim()) chips.push(["q", `“${state.q.trim()}”`]);
    if (state.rent) chips.push(["rent", "Giá thuê: " + document.querySelector(`#rent-filter input[value="${state.rent}"]`).parentElement.textContent.trim()]);
    if (state.colors) chips.push(["colors", "Có nhiều màu"]);
    chipsEl.innerHTML = chips.map(([k, label]) =>
      `<button type="button" class="chip" data-clear="${k}" aria-label="Bỏ lọc ${esc(label)}">${esc(label)} ${icon("close")}</button>`).join("");

    document.getElementById("product-grid").innerHTML = list.length
      ? list.map(productCard).join("")
      : `<div class="empty" style="grid-column:1/-1">Không tìm thấy thiết bị phù hợp. Thử bỏ bớt bộ lọc nhé.</div>`;

    // Đồng bộ URL (để chia sẻ link đúng bộ lọc)
    const u = new URLSearchParams();
    if (state.dm) u.set("dm", state.dm);
    if (state.q.trim()) u.set("tim", state.q.trim());
    history.replaceState(null, "", location.pathname + (u.toString() ? "?" + u : ""));
  }

  update();
})();
