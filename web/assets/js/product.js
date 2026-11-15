/* Trang chi tiết sản phẩm — đọc ?id=MA_SP, đổi ảnh / giá theo màu, tính tiền cọc */
(function () {
  "use strict";
  const { PRODUCTS, DEPOSIT_RATE, DELIVERY_FEE, esc, vnd, cleanName, mediaOf, catByName, byId, rentPrice,
    parseSpecs, colorStyle, getDates, setDates, daysBetween, productCard, icon, toast,
    availableQty, validateRental, fmtDate, todayISO } = window.WR;
  WR.initPage("products");

  const params = new URLSearchParams(location.search);
  const p = byId(params.get("id")) || PRODUCTS[0];
  let variant = p.variants.find((v) => v.ma_bien_the === params.get("mau")) || p.variants[0];
  let imgIndex = 0;

  const $ = (id) => document.getElementById(id);
  const name = cleanName(p.ten_sp);
  const cat = catByName(p.danh_muc);

  document.title = `${name} – WANDERENT`;
  $("bc-cat").textContent = p.danh_muc;
  $("bc-cat").href = `products.html?dm=${cat ? cat.slug : ""}`;
  $("bc-name").textContent = name;
  $("pd-cat").textContent = p.danh_muc;
  $("pd-name").textContent = name;

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
    imgIndex = 0;
    history.replaceState(null, "", `?id=${p.ma_sp}&mau=${variant.ma_bien_the}`);
    renderVariant();
  });

  const renderGallery = () => {
    const media = mediaOf(variant);
    const cur = media[imgIndex] || media[0];
    const main = $("gallery-main");
    if (!cur) { main.innerHTML = ""; return; }
    if (cur.type === "video") {
      main.innerHTML = `<iframe title="Video ${esc(name)}" src="${esc(cur.embed)}" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowfullscreen></iframe>`;
    } else {
      main.innerHTML = `<img id="main-img" src="${esc(cur.src)}" alt="${esc(name)}${variant.mau_sac ? " – màu " + variant.mau_sac : ""}, ảnh ${imgIndex + 1}" referrerpolicy="no-referrer">`;
    }
    $("thumbs").innerHTML = media.map((m, i) => `
      <button type="button" data-i="${i}" aria-current="${i === imgIndex}" aria-label="${m.type === "video" ? "Xem video" : "Xem ảnh " + (i + 1)}">
        <img src="${esc(m.thumb)}" alt="" referrerpolicy="no-referrer">
        ${m.type === "video" ? `<span class="thumb-play">${icon("play")}<span>Video</span></span>` : ""}
      </button>`).join("");
  };
  $("thumbs").addEventListener("click", (e) => {
    const b = e.target.closest("[data-i]"); if (!b) return;
    imgIndex = Number(b.dataset.i); renderGallery();
  });

  const dates = getDates();
  const fromEl = $("pd-from"), toEl = $("pd-to"), qtyEl = $("qty");
  fromEl.value = dates.from; toEl.value = dates.to;
  fromEl.min = todayISO(); toEl.min = dates.from;
  const onDate = () => {
    toEl.min = fromEl.value;
    if (toEl.value <= fromEl.value) { toEl.value = WR.addDaysISO(fromEl.value, 1); }
    setDates({ from: fromEl.value, to: toEl.value }); renderSummary();
  };
  fromEl.addEventListener("change", onDate); toEl.addEventListener("change", onDate);

  const readQty = () => parseInt(qtyEl.value, 10);
  const clampQty = (silent) => {
    const raw = readQty();
    const q = Math.min(10, Math.max(1, Number.isFinite(raw) && raw > 0 ? raw : 1));
    if (!silent && Number.isFinite(raw) && raw < 1) {
      toast("Số lượng tối thiểu là 1. Đã chỉnh lại giúp bạn.");
    }
    qtyEl.value = q;
    return q;
  };
  $("qty-minus").addEventListener("click", () => { qtyEl.value = Math.max(1, (readQty() || 1) - 1); renderSummary(); });
  $("qty-plus").addEventListener("click", () => { qtyEl.value = Math.min(10, (readQty() || 1) + 1); renderSummary(); });
  qtyEl.addEventListener("change", () => { clampQty(false); renderSummary(); });

  const setError = (msg) => {
    const el = $("pd-error");
    if (!msg) { el.hidden = true; el.textContent = ""; return; }
    el.hidden = false; el.textContent = msg;
  };

  const renderCal = () => {
    const wrap = $("stock-cal");
    const start = todayISO();
    let html = "";
    for (let i = 0; i < 14; i++) {
      const d = WR.addDaysISO(start, i);
      const next = WR.addDaysISO(d, 1);
      const left = availableQty(variant.ma_bien_the, d, next);
      const inRange = d >= fromEl.value && d < toEl.value;
      html += `<button type="button" class="cal-day ${left ? "in" : "out"} ${inRange ? "picked" : ""}" data-d="${d}" title="${fmtDate(d)}: còn ${left}">
        <span>${d.slice(8)}</span><small>${left ? left : "Hết"}</small></button>`;
    }
    wrap.innerHTML = html;
  };
  $("stock-cal").addEventListener("click", (e) => {
    const b = e.target.closest("[data-d]"); if (!b) return;
    fromEl.value = b.dataset.d;
    if (toEl.value <= fromEl.value) toEl.value = WR.addDaysISO(fromEl.value, 1);
    onDate();
  });

  const renderSummary = () => {
    const days = daysBetween(fromEl.value, toEl.value);
    const q = clampQty(true);
    const rent = rentPrice(p) || 0;
    const rentTotal = rent * days * q;
    const deposit = Math.round(variant.gia_goc * DEPOSIT_RATE) * q;
    const avail = availableQty(variant.ma_bien_the, fromEl.value, toEl.value);
    $("sum-days").textContent = `${days} ngày × ${q} món`;
    $("sum-rent-day").textContent = vnd(rent);
    $("sum-rent").textContent = vnd(rentTotal);
    $("sum-deposit").textContent = vnd(deposit);
    $("sum-today").textContent = vnd(deposit);
    $("pd-stock").textContent = avail > 0
      ? `Còn ${avail} món (${variant.mau_sac || "mặc định"}) từ ${fmtDate(fromEl.value)} đến ${fmtDate(toEl.value)}`
      : `Hết hàng trong khoảng ${fmtDate(fromEl.value)} – ${fmtDate(toEl.value)}`;
    $("pd-stock").className = "stock-banner " + (avail > 0 ? "ok" : "out");
    renderCal();
  };

  function renderVariant() {
    const rent = rentPrice(p);
    $("pd-sku").textContent = variant.ma_bien_the;
    $("pd-rent").innerHTML = `${vnd(rent)} <small>/ ngày</small>`;
    $("pd-value").textContent = vnd(variant.gia_goc);
    $("pd-deposit").textContent = vnd(Math.round(variant.gia_goc * DEPOSIT_RATE));
    renderColors(); renderGallery(); renderSummary();
  }

  const collect = () => {
    const raw = readQty();
    if (!Number.isFinite(raw) || raw < 1) {
      clampQty(false);
      setError("Số lượng thuê tối thiểu là 1. Đã chỉnh ô số lượng thành 1.");
    } else setError("");
    const qty = clampQty(true);
    const v = validateRental({ sku: variant.ma_bien_the, from: fromEl.value, to: toEl.value, qty });
    if (!v.ok) { setError(v.error); toast(v.error); return null; }
    setError("");
    return { ma_bien_the: variant.ma_bien_the, qty, from: fromEl.value, to: toEl.value };
  };

  $("btn-cart").addEventListener("click", () => {
    const item = collect(); if (!item) return;
    WR.addToCart(item);
    toast(`Đã thêm ${item.qty} × ${name}${variant.mau_sac ? " (" + variant.mau_sac + ")" : ""} vào giỏ thuê`);
  });
  $("btn-rent").addEventListener("click", () => {
    const item = collect(); if (!item) return;
    WR.addToCart(item);
    location.href = "checkout.html";
  });

  const descParagraphs = () => {
    const out = [];
    String(p.mo_ta || "").split("\n").map((s) => s.trim()).filter(Boolean).forEach((line) => {
      const prev = out[out.length - 1];
      const joinable = prev && !/[:.!?]$/.test(prev) && (/^[a-zà-ỹđ(,]/.test(line) || /,$/.test(prev) || prev.length < 30);
      if (joinable) out[out.length - 1] = prev + " " + line; else out.push(line);
    });
    return out;
  };
  $("panel-desc").innerHTML = descParagraphs().map((t) =>
    /:$/.test(t) && t.length < 80 ? `<p class="desc-heading">${esc(t)}</p>` : `<p>${esc(t)}</p>`).join("")
    + `<p class="source-note">Nội dung mô tả được biên tập lại cho website demo học thuật WANDERENT.</p>`;

  const specs = parseSpecs(p.thong_so);
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
