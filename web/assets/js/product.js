/* Trang chi tiết sản phẩm — đọc ?id=MA_SP, đổi ảnh / giá theo màu, tính tiền thuê nhiều ngày + cọc */
(function () {
  "use strict";
  const { PRODUCTS, esc, vnd, cleanName, mediaOf, catByName, byId, rentPrice, depositOf,
    colorStyle, productCard, icon, toast, availableQty, validateRental, fmtDate, todayISO } = window.WR;
  WR.initPage("products");

  const params = new URLSearchParams(location.search);
  const p = byId(params.get("id")) || PRODUCTS[0];
  let variant = p.variants.find((v) => v.ma_bien_the === params.get("mau")) || p.variants[0];
  let imgIndex = 0;
  let playing = false;

  const $ = (id) => document.getElementById(id);
  const name = cleanName(p.ten_sp);
  const cat = catByName(p.danh_muc);

  document.title = `${name} – WANDERENT`;
  $("bc-cat").textContent = p.danh_muc;
  $("bc-cat").href = `products.html?dm=${cat ? cat.slug : ""}`;
  $("bc-name").textContent = name;
  $("pd-cat").textContent = p.danh_muc;
  $("pd-name").textContent = name;
  if (p.hidden) {
    $("pd-hidden").hidden = false;
    $("btn-cart").disabled = true; $("btn-rent").disabled = true;
  }

  /* ---------- Màu ---------- */
  const colored = p.variants.filter((v) => v.mau_sac);
  if (!colored.length) $("color-wrap").style.display = "none";
  const renderColors = () => {
    $("colors").innerHTML = colored.map((v) => `
      <button type="button" class="color-btn" data-v="${esc(v.ma_bien_the)}" aria-pressed="${v === variant}">
        <span class="dot" style="${colorStyle(v.mau_sac)}"></span>${esc(v.mau_sac)}
      </button>`).join("");
    $("color-name").textContent = variant.mau_sac || "";
  };
  $("colors").addEventListener("click", (e) => {
    const b = e.target.closest("[data-v]"); if (!b) return;
    variant = p.variants.find((v) => v.ma_bien_the === b.dataset.v);
    imgIndex = 0; playing = false;
    history.replaceState(null, "", `?id=${p.ma_sp}&mau=${variant.ma_bien_the}`);
    renderVariant();
  });

  /* ---------- Ảnh & video ----------
     Link YouTube trong dữ liệu không phải ảnh: hiển thị ảnh đại diện + nút phát,
     bấm mới nạp trình phát (kèm link mở thẳng YouTube nếu trình phát bị chặn). */
  const renderGallery = () => {
    const media = mediaOf(variant);
    const cur = media[imgIndex] || media[0];
    const main = $("gallery-main");
    if (!cur) { main.innerHTML = `<div class="empty">Chưa có ảnh</div>`; return; }
    if (cur.type === "video" && playing) {
      main.innerHTML = `<iframe title="Video ${esc(name)}" src="${esc(cur.embed)}" referrerpolicy="strict-origin-when-cross-origin"
        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowfullscreen></iframe>
        <a class="video-link" href="${esc(cur.src)}" target="_blank" rel="noopener">Không xem được? Mở trên YouTube</a>`;
    } else if (cur.type === "video") {
      main.innerHTML = `<button type="button" class="video-poster" id="play-video" aria-label="Phát video hướng dẫn ${esc(name)}">
          <img src="${esc(cur.thumb)}" alt="" referrerpolicy="no-referrer">
          <span class="play-badge">${icon("play")}<span>Xem video</span></span>
        </button>
        <a class="video-link" href="${esc(cur.src)}" target="_blank" rel="noopener">Mở trên YouTube</a>`;
      $("play-video").addEventListener("click", () => { playing = true; renderGallery(); });
    } else {
      main.innerHTML = `<img id="main-img" src="${esc(cur.src)}" alt="${esc(name)}${variant.mau_sac ? " – màu " + esc(variant.mau_sac) : ""}, ảnh ${imgIndex + 1}" referrerpolicy="no-referrer">`;
    }
    $("thumbs").innerHTML = media.map((m, i) => `
      <button type="button" data-i="${i}" aria-current="${i === imgIndex}" aria-label="${m.type === "video" ? "Xem video" : "Xem ảnh " + (i + 1)}">
        <img src="${esc(m.thumb)}" alt="" referrerpolicy="no-referrer">
        ${m.type === "video" ? `<span class="thumb-play">${icon("play")}<span>Video</span></span>` : ""}
      </button>`).join("");
  };
  $("thumbs").addEventListener("click", (e) => {
    const b = e.target.closest("[data-i]"); if (!b) return;
    imgIndex = Number(b.dataset.i); playing = false; renderGallery();
  });

  /* ---------- Ngày & số lượng ---------- */
  const fromEl = $("pd-from"), toEl = $("pd-to"), qtyEl = $("qty");
  const range = WR.bindDateRange(fromEl, toEl, { onChange: () => { setError(""); renderSummary(); } });

  const readQty = () => Number(qtyEl.value);
  const qtyValid = () => { const q = readQty(); return qtyEl.value !== "" && Number.isInteger(q) && q >= 1 && q <= 10; };
  const safeQty = () => (qtyValid() ? readQty() : 1);
  $("qty-minus").addEventListener("click", () => { qtyEl.value = Math.max(1, safeQty() - 1); setError(""); renderSummary(); });
  $("qty-plus").addEventListener("click", () => { qtyEl.value = Math.min(10, safeQty() + 1); setError(""); renderSummary(); });
  qtyEl.addEventListener("input", () => {
    if (qtyEl.value !== "" && !qtyValid()) setError("Số lượng phải là số nguyên từ 1 đến 10.");
    else setError("");
    renderSummary();
  });
  qtyEl.addEventListener("change", () => {
    if (!qtyValid()) {
      const was = qtyEl.value;
      qtyEl.value = Math.min(10, Math.max(1, Math.floor(Number(was)) || 1));
      setError(`Số lượng "${was === "" ? "trống" : was}" không hợp lệ (từ 1 đến 10). Đã đổi thành ${qtyEl.value}, hãy kiểm tra lại trước khi thêm vào giỏ.`);
      renderSummary();
    }
  });

  function setError(msg) {
    const el = $("pd-error");
    el.hidden = !msg; el.textContent = msg || "";
  }

  /* ---------- Lịch chọn ngày thuê ----------
     Bước 1: bấm ngày nhận (ngày còn hàng). Bước 2: bấm ngày trả.
     Ngày trả hợp lệ khi mọi ngày từ ngày nhận tới trước ngày trả đều còn đủ số lượng. */
  const WD = ["CN", "T2", "T3", "T4", "T5", "T6", "T7"];
  const WD_FULL = ["Chủ nhật", "Thứ Hai", "Thứ Ba", "Thứ Tư", "Thứ Năm", "Thứ Sáu", "Thứ Bảy"];
  const dow = (iso) => new Date(iso + "T12:00:00").getDay();
  const mondayOf = (iso) => WR.addDaysISO(iso, -((dow(iso) + 6) % 7));
  const shortDay = (iso) => `${WD[dow(iso)]} ${iso.slice(8)}/${iso.slice(5, 7)}`;
  const MAX_AHEAD = 180;
  const cal = { page: mondayOf(todayISO()), phase: "from", pickFrom: null, hover: null };
  const leftOn = (day) => availableQty(variant.ma_bien_the, day, WR.addDaysISO(day, 1));
  // Ngày trả xa nhất có thể khi nhận ngày `from` (= ngày đầu tiên hết hàng, vì ngày trả không cần giữ đồ)
  const maxEndFrom = (from) => {
    const q = safeQty();
    const last = WR.addDaysISO(todayISO(), MAX_AHEAD + 30);
    for (let day = from; day < last; day = WR.addDaysISO(day, 1)) if (leftOn(day) < q) return day;
    return last;
  };

  const renderCal = () => {
    const wrap = $("stock-cal");
    const today = todayISO();
    const lastFrom = WR.addDaysISO(today, MAX_AHEAD);
    const q = safeQty();
    const d = range.get();
    const picking = cal.phase === "to";
    const from = picking ? cal.pickFrom : d.from;
    const to = picking ? null : d.to;
    const maxEnd = picking ? maxEndFrom(cal.pickFrom) : null;
    const previewTo = picking && cal.hover && cal.hover > cal.pickFrom && cal.hover <= maxEnd ? cal.hover : null;

    const end = WR.addDaysISO(cal.page, 27);
    $("rp-label").textContent = cal.page.slice(5, 7) === end.slice(5, 7)
      ? `Tháng ${Number(cal.page.slice(5, 7))}/${cal.page.slice(0, 4)}`
      : `${cal.page.slice(8)}/${cal.page.slice(5, 7)} – ${end.slice(8)}/${end.slice(5, 7)}/${end.slice(0, 4)}`;
    $("rp-prev").disabled = cal.page <= mondayOf(today);
    $("rp-next").disabled = WR.addDaysISO(cal.page, 28) > lastFrom;

    let html = "";
    for (let i = 0; i < 28; i++) {
      const day = WR.addDaysISO(cal.page, i);
      const past = day < today;
      const left = past ? 0 : leftOn(day);
      const stock = past ? "past" : left < q ? "out" : left <= 1 ? "low" : "ok";
      const isStart = day === from;
      const isEnd = day === (to || previewTo);
      const inRange = from && (to || previewTo) && day > from && day < (to || previewTo);
      let disabled = past;
      let hint = "";
      if (!past && picking && day > cal.pickFrom) {
        if (day > maxEnd) { disabled = true; hint = "Không trả được ngày này vì có ngày hết hàng ở giữa"; }
        else hint = `Chọn làm ngày trả (${WR.daysBetween(cal.pickFrom, day)} ngày)`;
      } else if (!past) {
        if (stock === "out") { disabled = true; hint = "Hết hàng, không nhận được ngày này"; }
        else if (day > lastFrom) { disabled = true; hint = "Chỉ nhận đặt trước tối đa 180 ngày"; }
        else hint = "Chọn làm ngày nhận";
      }
      const firstOfMonth = day.slice(8) === "01";
      const label = `${WD_FULL[dow(day)]} ${fmtDate(day)}: ${past ? "đã qua" : stock === "out" ? "hết hàng" : "còn " + left + " món"}. ${hint}`;
      html += `<button type="button" class="rp-day ${stock} ${isStart ? "start" : ""} ${isEnd ? "end" : ""} ${inRange ? "in-range" : ""} ${day === today ? "today" : ""} ${picking && !isStart && day > cal.pickFrom && !disabled ? "can-end" : ""}"
        data-d="${day}" ${disabled ? "disabled" : ""} aria-pressed="${isStart || isEnd}" aria-label="${esc(label)}" title="${esc(label)}">
        <span class="rp-num">${firstOfMonth ? "1/" + Number(day.slice(5, 7)) : Number(day.slice(8))}</span>
        <small>${past ? "" : isStart ? "Nhận" : isEnd ? "Trả" : stock === "out" ? "Hết" : "còn " + left}</small>
      </button>`;
    }
    wrap.innerHTML = html;

    // Tóm tắt lựa chọn + bước hiện tại
    $("rp-s1").classList.toggle("cur", !picking); $("rp-s2").classList.toggle("cur", picking);
    $("rp-s1").toggleAttribute("aria-current", !picking); $("rp-s2").toggleAttribute("aria-current", picking);
    $("rp-chosen").innerHTML = picking
      ? `<span class="rp-pill on">Nhận <b>${shortDay(cal.pickFrom)}</b></span><span class="rp-arrow">→</span>
         <span class="rp-pill wait">Trả: bấm một ngày trên lịch</span>
         <button type="button" class="link-btn" id="rp-cancel">Hủy chọn</button>`
      : `<span class="rp-pill">Nhận <b>${shortDay(d.from)}</b></span><span class="rp-arrow">→</span>
         <span class="rp-pill">Trả <b>${shortDay(d.to)}</b></span>
         <span class="rp-days">${d.days} ngày thuê</span>`;
    $("rp-cancel")?.addEventListener("click", () => { cal.phase = "from"; cal.pickFrom = null; setError(""); renderCal(); });
  };

  $("stock-cal").addEventListener("click", (e) => {
    const b = e.target.closest("[data-d]"); if (!b || b.disabled) return;
    const day = b.dataset.d;
    setError("");
    if (cal.phase === "from" || day <= cal.pickFrom) {
      if (leftOn(day) < safeQty()) { setError("Ngày này đã hết hàng, hãy chọn ngày nhận khác."); return; }
      cal.phase = "to"; cal.pickFrom = day; cal.hover = null;
      renderCal();
      $("stock-cal").querySelector(`[data-d="${WR.addDaysISO(day, 1)}"]`)?.focus();
      return;
    }
    const from = cal.pickFrom;
    cal.phase = "from"; cal.pickFrom = null;
    range.set({ from, to: day });   // → onChange → renderSummary → renderCal
  });
  // Rê chuột / di phím để xem trước khoảng ngày khi đang chọn ngày trả
  const preview = (e) => {
    if (cal.phase !== "to") return;
    const b = e.target.closest("[data-d]");
    const next = b && !b.disabled ? b.dataset.d : null;
    if (next === cal.hover) return;
    cal.hover = next;
    const focused = document.activeElement?.dataset?.d;
    renderCal();
    if (focused) $("stock-cal").querySelector(`[data-d="${focused}"]`)?.focus();
  };
  $("stock-cal").addEventListener("mouseover", preview);
  $("stock-cal").addEventListener("focusin", preview);
  $("rp-prev").addEventListener("click", () => { cal.page = WR.addDaysISO(cal.page, -28); renderCal(); });
  $("rp-next").addEventListener("click", () => { cal.page = WR.addDaysISO(cal.page, 28); renderCal(); });

  const renderSummary = () => {
    const d = range.get();
    const days = d.days;
    const q = safeQty();
    const rent = rentPrice(p) || 0;
    const rows = WR.rentBreakdown(rent, days);
    const rentTotal = WR.rentForDays(rent, days) * q;
    const deposit = depositOf(variant) * q;
    const avail = availableQty(variant.ma_bien_the, d.from, d.to);
    $("sum-days").textContent = `${days} ngày × ${q} món`;
    $("sum-breakdown").innerHTML = rows.map((r) =>
      `<div><span>${esc(r.label)}: ${r.days} × ${vnd(r.unit)}${q > 1 ? " × " + q : ""}</span><span>${vnd(r.amount * q)}</span></div>`).join("");
    $("sum-rent").textContent = vnd(rentTotal);
    $("sum-deposit").textContent = vnd(deposit);
    $("sum-today").textContent = vnd(deposit);
    $("pd-stock").textContent = avail > 0
      ? `Còn ${avail} món (${variant.mau_sac || "mặc định"}) cho khoảng ${fmtDate(d.from)} → ${fmtDate(d.to)}.`
      : `Hết hàng trong khoảng ${fmtDate(d.from)} → ${fmtDate(d.to)}. Hãy chọn ngày khác trên lịch phía trên.`;
    // Lịch nhảy tới trang chứa ngày nhận nếu đang ở trang khác
    if (cal.phase === "from" && (d.from < cal.page || d.from > WR.addDaysISO(cal.page, 27))) cal.page = mondayOf(d.from);
    $("pd-stock").className = "stock-banner " + (avail > 0 ? "ok" : "out");
    renderCal();
  };

  function renderVariant() {
    const rent = rentPrice(p);
    $("pd-sku").textContent = variant.ma_bien_the;
    $("pd-rent").innerHTML = `${vnd(rent)} <small>/ ngày đầu</small>`;
    $("pd-tiers").innerHTML = WR.DAY_TIERS.map((t) =>
      `<li><span>${esc(t.label)}</span><strong>${vnd(WR.dayPriceAt(rent, t.from))}</strong></li>`).join("");
    $("pd-value").textContent = vnd(variant.gia_goc);
    $("pd-deposit").textContent = vnd(depositOf(variant));
    renderColors(); renderGallery(); renderSummary();
  }

  // Kiểm tra trước khi thêm giỏ / đặt thuê: KHÔNG tự thêm khi dữ liệu không hợp lệ
  const collect = () => {
    if (!qtyValid()) {
      const was = qtyEl.value;
      qtyEl.value = Math.min(10, Math.max(1, Math.floor(Number(was)) || 1));
      const msg = `Số lượng "${was === "" ? "trống" : was}" không hợp lệ (từ 1 đến 10). Đã đổi ô thành ${qtyEl.value}. Bấm lại để xác nhận.`;
      setError(msg); toast(msg); renderSummary(); qtyEl.focus();
      return null;
    }
    const d = { from: fromEl.value, to: toEl.value };
    const v = validateRental({ sku: variant.ma_bien_the, from: d.from, to: d.to, qty: readQty() });
    if (!v.ok) { setError(v.error); toast(v.error); return null; }
    setError("");
    return { ma_bien_the: variant.ma_bien_the, qty: readQty(), from: d.from, to: d.to };
  };

  $("btn-cart").addEventListener("click", () => {
    const item = collect(); if (!item) return;
    WR.addToCart(item);
    toast(`Đã thêm ${item.qty} × ${name}${variant.mau_sac ? " (" + variant.mau_sac + ")" : ""}, ${fmtDate(item.from)} → ${fmtDate(item.to)} vào giỏ thuê.`);
    renderSummary();
  });
  $("btn-rent").addEventListener("click", () => {
    const item = collect(); if (!item) return;
    WR.addToCart(item);
    location.href = "checkout.html";
  });

  /* ---------- Mô tả có cấu trúc ---------- */
  const c = WR.contentOf(p);
  const section = (title, body) => (body ? `<section class="desc-sec"><h3>${esc(title)}</h3>${body}</section>` : "");
  $("panel-desc").innerHTML =
    (c.tom_tat ? `<p class="desc-lead">${esc(c.tom_tat)}</p>` : "") +
    `<div class="desc-grid">` +
    section("Điểm nổi bật", c.noi_bat.length ? `<ul class="desc-list">${c.noi_bat.map((x) => `<li>${icon("check")}<span>${esc(x)}</span></li>`).join("")}</ul>` : "") +
    `<div>` +
    section("Phù hợp cho", c.phu_hop ? `<p>${esc(c.phu_hop)}</p>` : "") +
    section("Đi kèm khi thuê", c.di_kem ? `<p>${esc(c.di_kem)}</p>` : "") +
    section("Lưu ý khi dùng", c.luu_y ? `<p>${esc(c.luu_y)}</p>` : "") +
    `</div></div>` +
    section("Khi thuê tại WANDERENT", c.rent_notes.length ? `<ul class="desc-bullets">${c.rent_notes.map((x) => `<li>${esc(x)}</li>`).join("")}</ul>` : "");

  const specs = WR.specsOf(p);
  $("panel-spec").innerHTML = specs.length
    ? `<table class="spec-table"><tbody>${specs.map(([k, v]) => `<tr><th scope="row">${esc(k || "Thông tin")}</th><td>${esc(v)}</td></tr>`).join("")}</tbody></table>`
    : `<p class="spec-empty">Chưa có thông số cho sản phẩm này.</p>`;

  const tabs = [...document.querySelectorAll('[role="tab"]')];
  const selectTab = (t) => {
    tabs.forEach((x) => {
      const on = x === t;
      x.setAttribute("aria-selected", on); x.tabIndex = on ? 0 : -1;
      $(x.getAttribute("aria-controls")).hidden = !on;
    });
    t.focus();
  };
  tabs.forEach((t, i) => {
    t.addEventListener("click", () => selectTab(t));
    t.addEventListener("keydown", (e) => {
      if (e.key === "ArrowRight") selectTab(tabs[(i + 1) % tabs.length]);
      if (e.key === "ArrowLeft") selectTab(tabs[(i - 1 + tabs.length) % tabs.length]);
    });
  });

  const related = PRODUCTS.filter((x) => x.danh_muc === p.danh_muc && x.ma_sp !== p.ma_sp).slice(0, 4);
  $("related").innerHTML = related.map(productCard).join("");
  $("related-more").href = `products.html?dm=${cat ? cat.slug : ""}`;

  renderVariant();
})();
