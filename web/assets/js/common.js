/* =====================================================================
   WANDERENT — JS dùng chung: dữ liệu, giá, giỏ, đơn, tài khoản, header, footer
   Nạp theo thứ tự:  data.js → content.js → common.js → <trang>.js
   Toàn bộ dữ liệu demo lưu trong localStorage của trình duyệt.
   ===================================================================== */
(function () {
  "use strict";

  /* ---------------- Lưu trữ ---------------- */
  const loadJSON = (key, fallback) => {
    try { const v = JSON.parse(localStorage.getItem(key)); return v ?? fallback; } catch (e) { return fallback; }
  };
  const saveJSON = (key, val) => {
    try { localStorage.setItem(key, JSON.stringify(val)); return true; } catch (e) { return false; }
  };

  const DATE_KEY = "wanderent_dates";
  const CART_KEY = "wanderent_cart";
  const ORDERS_KEY = "wanderent_orders";
  const USERS_KEY = "wanderent_users";
  const SESSION_KEY = "wanderent_session";
  const SETTINGS_KEY = "wanderent_settings";
  const STUDENTS_KEY = "wanderent_students";
  const OUTBOX_KEY = "wanderent_outbox";
  const SEED_KEY = "wanderent_seed_v3";
  const FLASH_KEY = "wanderent_flash";

  /* ---------------- Cài đặt quản trị (ghi đè dữ liệu gốc) ---------------- */
  const SETTINGS = (() => {
    const s = loadJSON(SETTINGS_KEY, {}) || {};
    return { products: s.products || {}, variants: s.variants || {}, store: s.store || {}, fees: s.fees || {} };
  })();
  const saveSettings = (next) => saveJSON(SETTINGS_KEY, next);
  const resetSettings = () => { try { localStorage.removeItem(SETTINGS_KEY); } catch (e) { /* bỏ qua */ } };

  /* ---------------- Hằng số kinh doanh ---------------- */
  const DEPOSIT_RATE = 0.3;            // Cọc = 30% giá trị thiết bị
  const COMBO_DISCOUNT = 0.1;          // Combo giảm 10% tiền thuê
  const STUDENT_DISCOUNT = 0.1;        // HSSV đã xác minh giảm 10% tiền thuê (không cộng dồn combo)
  const LATE_FEE_PER_DAY = 80000;
  const COMBO_DEFAULT_DAYS = 2;        // Combo báo giá mặc định cho chuyến 2 ngày
  const DELIVERY_FEE = Number.isFinite(Number(SETTINGS.fees.delivery)) && SETTINGS.fees.delivery !== ""
    ? Number(SETTINGS.fees.delivery) : 50000;

  // Giá thuê theo số ngày (Bảng 3.12): ngày 1 = 100%, ngày 2–3 = 80%, từ ngày 4 = 60%
  const DAY_TIERS = [
    { from: 1, to: 1, rate: 1, label: "Ngày đầu" },
    { from: 2, to: 3, rate: 0.8, label: "Ngày 2–3" },
    { from: 4, to: Infinity, rate: 0.6, label: "Từ ngày 4" },
  ];

  // Giá thuê ngày đầu (VNĐ). Tính theo giá trị thiết bị, làm tròn 5.000đ.
  const DEFAULT_RENT = {
    LEU01: 50000, LEU02: 250000, LEU03: 120000, LEU04: 330000,
    LEU05: 270000, LEU06: 390000, LEU07: 550000, LEU08: 210000,
    TUINGU01: 70000, TUINGU02: 70000, TUINGU03: 70000, TUINGU04: 55000,
    TUINGU05: 35000, TUINGU06: 40000, TUINGU07: 45000, TUINGU08: 25000,
    SUP01: 650000, SUP02: 380000, SUP03: 400000, SUP04: 320000, SUP05: 400000, SUP06: 280000,
    BEP01: 90000, BEP02: 20000, BEP03: 40000, BEP04: 45000,
    BEP05: 55000, BEP06: 35000, BEP07: 40000, BEP08: 20000,
  };

  const STOCK_BY_CAT = { "Lều": 3, "Túi ngủ": 6, "SUP": 2, "Bếp và dụng cụ ăn uống": 5 };

  const DEFAULT_STORE = {
    name: "WANDERENT – Điểm nhận đồ Thủ Đức",
    address: "669 Quốc lộ 1, KP3, P. Linh Xuân, TP. Thủ Đức, TP.HCM (gần ĐH Kinh tế – Luật)",
    hours: "8:00 – 20:00 mỗi ngày",
    phone: "0901 234 567",
    email: "hello@wanderent.vn",
    map: "https://maps.google.com/?q=Đại học Kinh tế Luật TP.HCM",
    facebook: "https://www.facebook.com/wanderent",
    instagram: "https://www.instagram.com/wanderent",
    youtube: "https://www.youtube.com/@wanderent",
    bank: "Vietcombank – WANDERENT – 0123456789",
  };
  const STORE = { ...DEFAULT_STORE };
  Object.entries(SETTINGS.store).forEach(([k, v]) => { if (v != null && String(v).trim() !== "") STORE[k] = String(v); });

  /* ---------------- Sản phẩm (áp dụng ghi đè của admin) ---------------- */
  const RAW = window.WANDERENT_PRODUCTS || [];
  const CONTENT = window.WANDERENT_CONTENT || {};
  const RENT_NOTES = window.WANDERENT_RENT_NOTES || {};

  const ALL_PRODUCTS = RAW.map((p) => {
    const ov = SETTINGS.products[p.ma_sp] || {};
    return {
      ...p,
      ten_sp: ov.name && String(ov.name).trim() ? String(ov.name).trim() : p.ten_sp,
      hidden: !!ov.hidden,
      variants: p.variants.map((v) => {
        const vo = SETTINGS.variants[v.ma_bien_the] || {};
        const price = Number(vo.gia_goc);
        return { ...v, gia_goc: Number.isFinite(price) && price > 0 ? price : v.gia_goc };
      }),
    };
  });
  const PRODUCTS = ALL_PRODUCTS.filter((p) => !p.hidden);

  const COMBOS = [
    { id: "doi", name: "Combo Cặp đôi", tag: "2 người · 1–2 đêm", desc: "Lều tự bung, 2 túi ngủ, bếp mini và bộ ăn uống cho 2 người.", items: [["LEU08", 1], ["TUINGU06", 2], ["BEP03", 1], ["BEP06", 1]] },
    { id: "nhom", name: "Combo Nhóm bạn", tag: "4–6 người · 2 ngày", desc: "Lều 6 người, túi ngủ đông, bếp lớn, bếp nướng và sàn nổi SUP.", items: [["LEU02", 1], ["TUINGU01", 4], ["BEP01", 1], ["BEP05", 1], ["SUP04", 1]] },
    { id: "sinhton", name: "Combo Sinh tồn", tag: "Trekking · gọn nhẹ", desc: "Lều 4 người, túi ngủ siêu nhẹ, bếp mini, chảo và bộ dao thìa nĩa.", items: [["LEU05", 1], ["TUINGU05", 1], ["BEP03", 1], ["BEP04", 1], ["BEP02", 1]] },
  ];

  const ORDER_STATUSES = [
    { id: "deposit_pending", label: "Chờ thanh toán cọc", color: "#A65A30" },
    { id: "confirmed", label: "Đã cọc / giữ đồ", color: "#1F5A43" },
    { id: "ready", label: "Sẵn sàng giao", color: "#2F6DB5" },
    { id: "shipping", label: "Đang giao hàng", color: "#6B4FA0" },
    { id: "picked_up", label: "Đang thuê", color: "#7B4B2A" },
    { id: "returned", label: "Đã trả đồ – chờ hoàn cọc", color: "#4F7A61" },
    { id: "refunded", label: "Đã hoàn cọc", color: "#2E7D4F" },
    { id: "cancelled", label: "Đã hủy", color: "#8A3B32" },
  ];

  const CATEGORIES = [
    { slug: "leu", name: "Lều", desc: "Lều cắm trại, lều che nắng, lều gia đình" },
    { slug: "tui-ngu", name: "Túi ngủ", desc: "Túi ngủ mùa đông, siêu nhẹ, phong bì" },
    { slug: "sup", name: "SUP", desc: "Ván chèo đứng và sàn nổi bơm hơi" },
    { slug: "bep", name: "Bếp và dụng cụ ăn uống", short: "Bếp & ăn uống", desc: "Bếp ga, bếp nướng, bộ ăn uống" },
  ];

  const COLOR_HEX = {
    "xanh rêu": "#4F7A61", "xanh dương": "#2F6DB5", "xanh lá": "#3E8E41", "kaki": "#C3AE8A",
    "red": "#C0392B", "mint": "#8FD3C1", "ghi": "#8E9194", "cam": "#E07B39", "nâu": "#7B4B2A",
    "đen": "#2E3131", "vàng": "#E8B931", "trắng": "#FFFFFF",
  };

  /* ---------------- Tiện ích ---------------- */
  const esc = (s) => String(s ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
  const vnd = (n) => (n == null || isNaN(n) ? "—" : Number(n).toLocaleString("vi-VN") + " đ");
  const cleanName = (name) => String(name).replace(/\s+[-–]\s*\d{3,5}\s*$/, "").trim();
  const images = (variant) => (variant?.link_anh || "").split(";").map((s) => s.trim()).filter(Boolean);
  const catBySlug = (slug) => CATEGORIES.find((c) => c.slug === slug);
  const catByName = (name) => CATEGORIES.find((c) => c.name === name);
  const byId = (id) => ALL_PRODUCTS.find((p) => p.ma_sp === id);
  const hasColors = (p) => p.variants.some((v) => v.mau_sac);
  const minPrice = (p) => Math.min(...p.variants.map((v) => Number(v.gia_goc) || Infinity));
  const rentPrice = (p) => {
    if (!p) return null;
    const ov = Number(SETTINGS.products[p.ma_sp]?.rent);
    if (Number.isFinite(ov) && ov > 0) return ov;
    return DEFAULT_RENT[p.ma_sp] ?? null;
  };
  const stockCap = (p) => {
    const ov = SETTINGS.products[p.ma_sp]?.stock;
    if (ov !== undefined && ov !== "" && Number.isFinite(Number(ov))) return Math.max(0, Number(ov));
    return STOCK_BY_CAT[p.danh_muc] ?? 3;
  };
  const depositOf = (variant) => Math.round((Number(variant?.gia_goc) || 0) * DEPOSIT_RATE / 1000) * 1000;
  const variantBySku = (sku) => {
    for (const p of ALL_PRODUCTS) {
      const v = p.variants.find((x) => x.ma_bien_the === sku);
      if (v) return { product: p, variant: v };
    }
    return null;
  };

  const YT_RE = /(?:youtube\.com\/(?:watch\?v=|embed\/)|youtu\.be\/)([\w-]{11})/;
  const parseMedia = (url) => {
    const m = String(url).match(YT_RE);
    if (m) {
      return {
        type: "video", src: `https://www.youtube.com/watch?v=${m[1]}`, id: m[1],
        thumb: `https://i.ytimg.com/vi/${m[1]}/hqdefault.jpg`,
        embed: `https://www.youtube-nocookie.com/embed/${m[1]}?autoplay=1&rel=0`,
      };
    }
    return { type: "image", src: url, thumb: url };
  };
  const mediaOf = (variant) => images(variant).map(parseMedia);
  const thumbOf = (variant) => mediaOf(variant).find((m) => m.type === "image")?.src || mediaOf(variant)[0]?.thumb || "";

  const parseSpecs = (s) =>
    String(s || "").split(";").map((x) => x.trim()).filter(Boolean).map((x) => {
      const i = x.indexOf(":");
      return i < 0 ? ["", x] : [x.slice(0, i).trim(), x.slice(i + 1).trim()];
    });

  const contentOf = (p) => {
    const c = CONTENT[p.ma_sp] || {};
    const ov = SETTINGS.products[p.ma_sp] || {};
    return {
      tom_tat: ov.summary && String(ov.summary).trim() ? String(ov.summary).trim() : (c.tom_tat || ""),
      noi_bat: c.noi_bat || [],
      phu_hop: c.phu_hop || "",
      di_kem: c.di_kem || "",
      luu_y: c.luu_y || "",
      rent_notes: RENT_NOTES[p.danh_muc] || [],
    };
  };
  const specsOf = (p) => parseSpecs(CONTENT[p.ma_sp]?.thong_so || p.thong_so);

  const colorStyle = (name) => {
    const parts = String(name).toLowerCase().split("/").map((s) => s.trim());
    const hex = parts.map((p) => COLOR_HEX[p] || "#D9D4CC");
    return hex.length > 1
      ? `background: linear-gradient(135deg, ${hex[0]} 50%, ${hex[1]} 50%)`
      : `background: ${hex[0]}`;
  };

  /* ---------------- Giá thuê theo số ngày ---------------- */
  const roundK = (n) => Math.round(n / 1000) * 1000;
  const tierOf = (day) => DAY_TIERS.find((t) => day >= t.from && day <= t.to) || DAY_TIERS[DAY_TIERS.length - 1];
  const dayPriceAt = (base, day) => roundK((Number(base) || 0) * tierOf(day).rate);
  const rentForDays = (base, days) => {
    let s = 0;
    for (let d = 1; d <= days; d++) s += dayPriceAt(base, d);
    return s;
  };
  // [{label, days, unit, amount}] — chỉ các bậc có phát sinh
  const rentBreakdown = (base, days) => DAY_TIERS.map((t) => {
    const n = Math.max(0, Math.min(days, t.to) - t.from + 1);
    return { label: t.label, days: n, unit: dayPriceAt(base, t.from), amount: n * dayPriceAt(base, t.from), rate: t.rate };
  }).filter((x) => x.days > 0);
  const percentOff = (amount, rate) => roundK(amount * rate);

  /* ---------------- Ngày thuê ---------------- */
  const MAX_DAYS_AHEAD = 180;
  const toISO = (d) => {
    const x = d instanceof Date ? d : new Date(d);
    const y = x.getFullYear();
    const m = String(x.getMonth() + 1).padStart(2, "0");
    const day = String(x.getDate()).padStart(2, "0");
    return `${y}-${m}-${day}`;
  };
  const todayISO = () => toISO(new Date());
  const addDaysISO = (iso, n) => { const d = new Date(iso + "T12:00:00"); d.setDate(d.getDate() + n); return toISO(d); };
  const daysBetween = (from, to) => Math.max(1, Math.round((new Date(to + "T12:00:00") - new Date(from + "T12:00:00")) / 86400000));
  // Ngày hợp lệ: đúng định dạng và năm "hợp lý" (bỏ qua giá trị đang gõ dở như 0002-11-20)
  const isValidISO = (iso) => {
    if (!/^\d{4}-\d{2}-\d{2}$/.test(String(iso || ""))) return false;
    const y = Number(iso.slice(0, 4));
    const now = new Date().getFullYear();
    return y >= now - 1 && y <= now + 2 && !isNaN(new Date(iso + "T12:00:00"));
  };
  const isPastDate = (iso) => !isValidISO(iso) || iso < todayISO();
  const fmtDate = (iso) => {
    if (!iso) return "—";
    const [y, m, d] = iso.split("-");
    return `${d}/${m}/${y}`;
  };
  const defaultDates = () => {
    const from = addDaysISO(todayISO(), 1);
    return { from, to: addDaysISO(from, 2) };
  };
  const getDates = () => {
    const d = loadJSON(DATE_KEY, null);
    if (d && isValidISO(d.from) && isValidISO(d.to) && d.to > d.from) {
      if (d.from >= todayISO()) return d;
      // Ngày đã lưu từ hôm trước: dời về ngày mai, giữ nguyên số ngày thuê
      const from = addDaysISO(todayISO(), 1);
      return { from, to: addDaysISO(from, daysBetween(d.from, d.to)) };
    }
    return defaultDates();
  };
  const setDates = (d) => saveJSON(DATE_KEY, d);

  /*
   * Gắn cặp ô Ngày nhận / Ngày trả. Mục tiêu: không tự nhảy ngày khi người dùng đang gõ.
   *  - Giá trị gõ dở (năm 0002, 0020...) bị bỏ qua, không lưu, không đổi ô kia.
   *  - Ngày nhận đã qua → báo lỗi tại chỗ, không lưu.
   *  - Đổi ngày nhận mà ngày trả không còn sau ngày nhận → dời ngày trả, GIỮ số ngày thuê và ghi chú rõ.
   *  - Ngày trả ≤ ngày nhận → báo lỗi, không tự sửa.
   */
  const bindDateRange = (fromEl, toEl, opts = {}) => {
    const host = opts.messageHost || toEl.closest("form, .pd-dates, .rent-dates, .date-pair") || toEl.parentElement;
    let msgEl = host.querySelector(":scope > .date-msg");
    if (!msgEl) {
      msgEl = document.createElement("p");
      msgEl.className = "date-msg"; msgEl.setAttribute("aria-live", "polite"); msgEl.hidden = true;
      host.appendChild(msgEl);
    }
    const setMsg = (text, kind) => {
      msgEl.hidden = !text; msgEl.textContent = text || "";
      msgEl.className = "date-msg" + (kind ? " " + kind : "");
      fromEl.toggleAttribute("aria-invalid", kind === "error" && opts._which === "from");
    };
    const start = opts.initial || getDates();
    fromEl.value = start.from; toEl.value = start.to;
    let dur = daysBetween(start.from, start.to);
    let valid = true;

    const sync = () => {
      fromEl.min = todayISO();
      fromEl.max = addDaysISO(todayISO(), MAX_DAYS_AHEAD);
      toEl.min = isValidISO(fromEl.value) ? addDaysISO(fromEl.value, 1) : addDaysISO(todayISO(), 1);
      toEl.max = addDaysISO(todayISO(), MAX_DAYS_AHEAD + 60);
    };
    const fail = (text) => { valid = false; setMsg(text, "error"); opts.onInvalid?.(text); };
    const commit = (note) => {
      valid = true;
      dur = daysBetween(fromEl.value, toEl.value);
      if (opts.persist !== false) setDates({ from: fromEl.value, to: toEl.value });
      setMsg(note, note ? "info" : "");
      sync();
      opts.onChange?.({ from: fromEl.value, to: toEl.value, days: dur });
    };
    const onFrom = () => {
      const f = fromEl.value;
      if (!isValidISO(f)) return fail("Ngày nhận chưa đầy đủ. Hãy chọn ngày trên lịch hoặc gõ đủ ngày/tháng/năm.");
      if (f < todayISO()) return fail(`Ngày nhận ${fmtDate(f)} đã qua. Hãy chọn từ hôm nay (${fmtDate(todayISO())}) trở đi.`);
      if (f > addDaysISO(todayISO(), MAX_DAYS_AHEAD)) return fail(`Chỉ nhận đặt trước tối đa ${MAX_DAYS_AHEAD} ngày.`);
      let note = "";
      if (!isValidISO(toEl.value) || toEl.value <= f) {
        toEl.value = addDaysISO(f, dur);
        note = `Ngày trả được dời sang ${fmtDate(toEl.value)} để giữ ${dur} ngày thuê như bạn đã chọn.`;
      }
      commit(note);
    };
    const onTo = () => {
      const t = toEl.value;
      if (!isValidISO(t)) return fail("Ngày trả chưa đầy đủ. Hãy chọn ngày trên lịch hoặc gõ đủ ngày/tháng/năm.");
      if (!isValidISO(fromEl.value) || fromEl.value < todayISO()) return onFrom();
      if (t <= fromEl.value) return fail("Ngày trả phải sau ngày nhận ít nhất 1 ngày.");
      commit("");
    };
    fromEl.addEventListener("change", onFrom);
    toEl.addEventListener("change", onTo);
    sync();
    return {
      isValid: () => valid && isValidISO(fromEl.value) && isValidISO(toEl.value) && toEl.value > fromEl.value && fromEl.value >= todayISO(),
      get: () => ({ from: fromEl.value, to: toEl.value, days: daysBetween(fromEl.value, toEl.value) }),
      setFrom: (iso) => { fromEl.value = iso; onFrom(); },
      set: (d) => { fromEl.value = d.from; toEl.value = d.to; onTo(); },
    };
  };

  /* ---------------- Tồn kho ---------------- */
  const blockingStatuses = new Set(["deposit_pending", "confirmed", "ready", "shipping", "picked_up"]);
  const datesOverlap = (aFrom, aTo, bFrom, bTo) => aFrom < bTo && bFrom < aTo;

  const getOrders = () => loadJSON(ORDERS_KEY, []);
  const saveOrders = (list) => saveJSON(ORDERS_KEY, list);

  const bookedQty = (sku, from, to, exceptOrderId) => {
    let n = 0;
    for (const o of getOrders()) {
      if (o.id === exceptOrderId) continue;
      if (!blockingStatuses.has(o.status)) continue;
      if (o.status === "deposit_pending" && o.expiresAt && o.expiresAt < new Date().toISOString()) continue; // hết 15 phút giữ chỗ
      for (const it of o.items || []) {
        if (it.ma_bien_the !== sku) continue;
        if (!datesOverlap(from, to, it.from || o.from, it.to || o.to)) continue;
        n += Number(it.qty) || 0;
      }
    }
    return n;
  };
  const availableQty = (sku, from, to, exceptOrderId) => {
    const found = variantBySku(sku);
    if (!found || found.product.hidden) return 0;
    return Math.max(0, stockCap(found.product) - bookedQty(sku, from, to, exceptOrderId));
  };

  /* ---------------- Giỏ thuê ---------------- */
  const getCart = () => {
    const cart = loadJSON(CART_KEY, []);
    cart.forEach((x, i) => { if (!x.id) x.id = "c" + Date.now() + "-" + i; });
    return cart;
  };
  const setCart = (cart) => { saveJSON(CART_KEY, cart); updateCartCount(); };
  const cartQty = () => getCart().reduce((s, it) => s + (Number(it.qty) || 0), 0);
  const addToCart = (item) => {
    const cart = getCart();
    const i = cart.findIndex((x) => x.ma_bien_the === item.ma_bien_the && x.from === item.from && x.to === item.to && (x.combo || "") === (item.combo || ""));
    if (i >= 0) cart[i].qty = (Number(cart[i].qty) || 0) + Number(item.qty);
    else cart.push({ ...item, id: "c" + Date.now() + "-" + Math.random().toString(36).slice(2, 6) });
    setCart(cart);
    return cart;
  };
  const removeFromCart = (id) => setCart(getCart().filter((x) => x.id !== id));
  const clearCart = () => setCart([]);
  const updateCartCount = () => {
    document.querySelectorAll("[data-cart-count]").forEach((el) => {
      const n = cartQty();
      el.textContent = n;
      el.hidden = n === 0;
    });
  };

  const validateRental = ({ sku, from, to, qty, ignoreCartId, ignoreCartIds }) => {
    if (!from || !to) return { ok: false, error: "Hãy chọn ngày nhận và ngày trả." };
    if (!isValidISO(from) || !isValidISO(to)) return { ok: false, error: "Ngày thuê chưa hợp lệ. Hãy chọn lại ngày trên lịch." };
    if (isPastDate(from)) return { ok: false, error: `Ngày nhận ${fmtDate(from)} đã qua. Hãy chọn từ hôm nay (${fmtDate(todayISO())}) trở đi.` };
    if (to <= from) return { ok: false, error: "Ngày trả phải sau ngày nhận ít nhất 1 ngày." };
    const q = Number(qty);
    if (!Number.isInteger(q) || q < 1) return { ok: false, error: "Số lượng thuê tối thiểu là 1." };
    if (q > 10) return { ok: false, error: "Mỗi lần đặt tối đa 10 món cùng loại. Cần nhiều hơn, hãy liên hệ cửa hàng." };
    const skip = new Set([ignoreCartId, ...(ignoreCartIds || [])].filter(Boolean));
    const avail = availableQty(sku, from, to);
    const already = getCart()
      .filter((x) => !skip.has(x.id) && x.ma_bien_the === sku && datesOverlap(from, to, x.from, x.to))
      .reduce((s, x) => s + (Number(x.qty) || 0), 0);
    const left = avail - already;
    if (q > left) {
      return {
        ok: false,
        error: left <= 0
          ? `Món này đã hết (hoặc đã nằm hết trong giỏ của bạn) trong ${fmtDate(from)} – ${fmtDate(to)}. Hãy chọn ngày khác hoặc thiết bị tương tự.`
          : `Chỉ còn ${left} món trống trong khoảng ngày này${already ? " (đã trừ số món đang có trong giỏ)" : ""}.`,
        available: Math.max(0, left),
      };
    }
    return { ok: true, available: left };
  };

  // Đổi ngày cho toàn bộ giỏ (kiểm tra tồn kho từng món)
  const setCartDates = (from, to) => {
    const cart = getCart();
    const ids = cart.map((x) => x.id);
    const problems = [];
    cart.forEach((x) => {
      const v = validateRental({ sku: x.ma_bien_the, from, to, qty: x.qty, ignoreCartIds: ids });
      if (!v.ok) problems.push(`${cleanName(variantBySku(x.ma_bien_the)?.product.ten_sp || x.ma_bien_the)}: ${v.error}`);
    });
    if (problems.length) return { ok: false, problems };
    setCart(cart.map((x) => ({ ...x, from, to })));
    return { ok: true };
  };

  const lineTotals = (item) => {
    const found = variantBySku(item.ma_bien_the);
    const qty = Number(item.qty) || 1;
    const days = isValidISO(item.from) && isValidISO(item.to) ? daysBetween(item.from, item.to) : 1;
    if (!found) return { days, qty, rentDay: 0, rent: 0, deposit: 0, value: 0, name: item.ma_bien_the, breakdown: [], item };
    const rentDay = rentPrice(found.product) || 0;
    return {
      item, days, qty, rentDay,
      rent: rentForDays(rentDay, days) * qty,
      breakdown: rentBreakdown(rentDay, days),
      deposit: depositOf(found.variant) * qty,
      value: Number(found.variant.gia_goc) || 0,
      name: cleanName(found.product.ten_sp),
      color: found.variant.mau_sac,
      product: found.product,
      variant: found.variant,
      combo: item.combo || "",
      comboApplied: false,
    };
  };

  /* ---------------- HSSV ---------------- */
  const getStudents = () => loadJSON(STUDENTS_KEY, []);
  const normEmail = (e) => String(e || "").trim().toLowerCase();
  const studentOf = (email) => getStudents().find((s) => s.email === normEmail(email)) || null;
  const isStudentApproved = (email) => studentOf(email)?.status === "approved";
  const submitStudent = ({ email, name, school, studentId, image }) => {
    email = normEmail(email);
    if (!email || !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) return { ok: false, error: "Nhập email hợp lệ (trùng với email đặt thuê)." };
    if (!name || !String(name).trim()) return { ok: false, error: "Nhập họ tên đúng như trên thẻ." };
    if (!school || !String(school).trim()) return { ok: false, error: "Nhập tên trường." };
    if (!image) return { ok: false, error: "Hãy chọn ảnh thẻ học sinh / sinh viên." };
    const list = getStudents().filter((s) => s.email !== email);
    const rec = {
      email, name: String(name).trim(), school: String(school).trim(), studentId: String(studentId || "").trim(),
      image, status: "pending", submittedAt: new Date().toISOString(),
    };
    list.unshift(rec);
    if (!saveJSON(STUDENTS_KEY, list)) return { ok: false, error: "Trình duyệt hết dung lượng lưu ảnh. Hãy chọn ảnh nhỏ hơn." };
    return { ok: true, record: rec };
  };
  const reviewStudent = (email, status, note) => {
    const list = getStudents().map((s) => (s.email === normEmail(email) ? { ...s, status, note: note || "", reviewedAt: new Date().toISOString() } : s));
    saveJSON(STUDENTS_KEY, list);
  };
  const STUDENT_STATUS = {
    pending: { label: "Đang chờ duyệt", cls: "warn" },
    approved: { label: "Đã xác minh – giảm 10%", cls: "ok" },
    rejected: { label: "Chưa được duyệt", cls: "out" },
  };

  // Nén ảnh về tối đa 1000px, JPEG, để vừa localStorage
  const compressImage = (file, max = 1000, quality = 0.72) => new Promise((resolve, reject) => {
    if (!file || !/^image\//.test(file.type)) { reject(new Error("Tệp phải là ảnh (JPG, PNG, HEIC đã chuyển...).")); return; }
    if (file.size > 10 * 1024 * 1024) { reject(new Error("Ảnh lớn hơn 10MB. Hãy chụp lại hoặc chọn ảnh nhỏ hơn.")); return; }
    const reader = new FileReader();
    reader.onerror = () => reject(new Error("Không đọc được ảnh."));
    reader.onload = () => {
      const img = new Image();
      img.onerror = () => reject(new Error("Không mở được ảnh. Hãy thử ảnh JPG hoặc PNG."));
      img.onload = () => {
        const scale = Math.min(1, max / Math.max(img.width, img.height));
        const c = document.createElement("canvas");
        c.width = Math.round(img.width * scale); c.height = Math.round(img.height * scale);
        c.getContext("2d").drawImage(img, 0, 0, c.width, c.height);
        resolve(c.toDataURL("image/jpeg", quality));
      };
      img.src = reader.result;
    };
    reader.readAsDataURL(file);
  });

  // Form tải thẻ HSSV dùng chung (trang Ưu đãi HSSV, tài khoản, thanh toán)
  const renderStudentForm = (container, opts = {}) => {
    const uid = "sf" + Math.random().toString(36).slice(2, 7);
    const draw = () => {
      const email = opts.getEmail ? opts.getEmail() : (opts.email || "");
      const rec = email ? studentOf(email) : null;
      const st = rec ? STUDENT_STATUS[rec.status] : null;
      const showForm = !rec || rec.status === "rejected" || container.dataset.reupload === "1";
      container.innerHTML = `
        ${rec ? `<div class="student-status ${st.cls}">
            <strong>${esc(st.label)}</strong>
            <span>${esc(rec.name)} · ${esc(rec.school)}${rec.studentId ? " · MSSV " + esc(rec.studentId) : ""} · gửi ${fmtDate(toISO(rec.submittedAt))}</span>
            ${rec.status === "rejected" && rec.note ? `<span>Lý do: ${esc(rec.note)}</span>` : ""}
            ${rec.status === "pending" ? `<span>Admin sẽ duyệt trong 24 giờ. Đơn đặt trong lúc chờ vẫn được giữ đồ, chỉ chưa được giảm.</span>` : ""}
            ${!showForm ? `<button type="button" class="link-btn" data-reupload>Gửi lại ảnh thẻ khác</button>` : ""}
          </div>` : ""}
        ${showForm ? `<div class="student-form" role="group" aria-label="Gửi ảnh thẻ HSSV">
          <div class="form-grid">
            <div class="field"><label for="${uid}-name">Họ tên trên thẻ</label><input id="${uid}-name" required value="${esc(rec?.name || opts.name || "")}"></div>
            <div class="field"><label for="${uid}-email">Email đặt thuê</label><input id="${uid}-email" type="email" required value="${esc(email)}" ${opts.lockEmail ? "readonly" : ""}></div>
            <div class="field"><label for="${uid}-school">Trường</label><input id="${uid}-school" required placeholder="VD: ĐH Kinh tế – Luật" value="${esc(rec?.school || "")}"></div>
            <div class="field"><label for="${uid}-sid">Mã số HSSV</label><input id="${uid}-sid" value="${esc(rec?.studentId || "")}"></div>
          </div>
          <div class="field">
            <label for="${uid}-file">Ảnh thẻ HSSV còn hạn (mặt trước)</label>
            <input id="${uid}-file" type="file" accept="image/*" capture="environment">
            <img class="student-preview" alt="Xem trước ảnh thẻ" hidden>
            <small class="meta">Ảnh chỉ dùng để xác minh ưu đãi, lưu trên trình duyệt này (bản demo). Hãy che số CCCD nếu có trên thẻ.</small>
          </div>
          <p class="form-error" hidden></p>
          <button class="btn btn-primary" type="button" data-submit-student>Gửi xác minh</button>
        </div>` : ""}`;

      container.querySelector("[data-reupload]")?.addEventListener("click", () => { container.dataset.reupload = "1"; draw(); });
      const form = container.querySelector(".student-form");
      if (!form) return;
      let image = null;
      const err = form.querySelector(".form-error");
      const showErr = (m) => { err.hidden = !m; err.textContent = m || ""; };
      form.querySelector(`#${uid}-file`).addEventListener("change", async (e) => {
        showErr("");
        try {
          image = await compressImage(e.target.files[0]);
          const pv = form.querySelector(".student-preview"); pv.src = image; pv.hidden = false;
        } catch (ex) { image = null; showErr(ex.message); }
      });
      form.querySelector("[data-submit-student]").addEventListener("click", () => {
        const r = submitStudent({
          email: form.querySelector(`#${uid}-email`).value,
          name: form.querySelector(`#${uid}-name`).value,
          school: form.querySelector(`#${uid}-school`).value,
          studentId: form.querySelector(`#${uid}-sid`).value,
          image,
        });
        if (!r.ok) { showErr(r.error); return; }
        delete container.dataset.reupload;
        toast("Đã gửi ảnh thẻ. Admin sẽ duyệt trong 24 giờ.");
        opts.onEmail?.(r.record.email);
        draw();
        opts.onDone?.(r.record);
      });
    };
    draw();
    return { redraw: draw };
  };

  /* ---------------- Tổng tiền giỏ / combo ---------------- */
  const cartTotals = (cart = getCart(), opts = {}) => {
    if (typeof opts === "boolean") opts = { delivery: opts };
    const lines = cart.map(lineTotals);

    // Combo: chỉ giảm khi đủ món của combo trong cùng khoảng ngày
    const groups = {};
    lines.forEach((l) => {
      if (!l.combo) return;
      const k = `${l.combo}|${l.item.from}|${l.item.to}`;
      (groups[k] = groups[k] || []).push(l);
    });
    let comboDiscount = 0;
    const comboNotes = [];
    Object.entries(groups).forEach(([k, ls]) => {
      const cb = COMBOS.find((c) => c.id === k.split("|")[0]);
      if (!cb) return;
      const complete = cb.items.every(([id, q]) => ls.filter((l) => l.product?.ma_sp === id).reduce((s, l) => s + l.qty, 0) >= q);
      if (!complete) { comboNotes.push(`${cb.name} chưa đủ món nên chưa được giảm 10%.`); return; }
      const gross = ls.reduce((s, l) => s + l.rent, 0);
      ls.forEach((l) => { l.comboApplied = true; });
      comboDiscount += percentOff(gross, COMBO_DISCOUNT);
    });

    const rentGross = lines.reduce((s, x) => s + x.rent, 0);
    const studentEmail = normEmail(opts.email);
    const studentApplied = !!studentEmail && isStudentApproved(studentEmail);
    const studentBase = lines.filter((l) => !l.comboApplied).reduce((s, l) => s + l.rent, 0);
    const studentDiscount = studentApplied ? percentOff(studentBase, STUDENT_DISCOUNT) : 0;
    const rent = rentGross - comboDiscount - studentDiscount;
    const deposit = lines.reduce((s, x) => s + x.deposit, 0);
    const ship = opts.delivery ? DELIVERY_FEE : 0;
    return {
      lines, rentGross, comboDiscount, studentDiscount, studentApplied, comboNotes, rent, deposit, ship,
      todayPay: deposit + ship, payAtPickup: rent,
      days: lines[0]?.days || daysBetween(getDates().from, getDates().to),
    };
  };

  // Ảnh chụp tổng tiền để lưu vào đơn (không chứa object sản phẩm)
  const snapshotTotals = (tot) => ({
    lines: tot.lines.map((l) => ({
      ma_bien_the: l.item.ma_bien_the, ma_sp: l.product?.ma_sp, name: l.name, color: l.color || "",
      qty: l.qty, days: l.days, from: l.item.from, to: l.item.to, rentDay: l.rentDay, rent: l.rent,
      breakdown: l.breakdown, deposit: l.deposit, combo: l.combo, comboApplied: l.comboApplied,
    })),
    rentGross: tot.rentGross, comboDiscount: tot.comboDiscount, studentDiscount: tot.studentDiscount,
    studentApplied: tot.studentApplied, rent: tot.rent, deposit: tot.deposit, ship: tot.ship, todayPay: tot.todayPay,
  });

  const comboItems = (cb) => cb.items.map(([id, qty]) => ({ p: byId(id), qty })).filter((x) => x.p && !x.p.hidden);
  const comboQuote = (cb, from, to) => {
    const days = daysBetween(from, to);
    const items = comboItems(cb).map(({ p, qty }) => {
      const v = p.variants[0];
      const base = rentPrice(p) || 0;
      return {
        p, qty, sku: v.ma_bien_the, base, rent: rentForDays(base, days) * qty, deposit: depositOf(v) * qty,
        available: availableQty(v.ma_bien_the, from, to),
      };
    });
    const firstDay = items.reduce((s, x) => s + x.base * x.qty, 0);
    const gross = items.reduce((s, x) => s + x.rent, 0);
    const discount = percentOff(gross, COMBO_DISCOUNT);
    return {
      days, items, gross, discount, rent: gross - discount,
      firstDay, firstDaySale: firstDay - percentOff(firstDay, COMBO_DISCOUNT),
      deposit: items.reduce((s, x) => s + x.deposit, 0),
      out: items.filter((x) => x.available < x.qty),
    };
  };
  const addComboToCart = (cb, from, to) => {
    const items = comboItems(cb);
    if (items.length !== cb.items.length) return { ok: false, error: "Combo đang tạm ngừng vì có món ngừng cho thuê." };
    const problems = [];
    items.forEach(({ p, qty }) => {
      const v = validateRental({ sku: p.variants[0].ma_bien_the, from, to, qty });
      if (!v.ok) problems.push(`${cleanName(p.ten_sp)}: ${v.error}`);
    });
    if (problems.length) return { ok: false, error: "Chưa thêm combo vì có món không đủ hàng. " + problems[0], problems };
    items.forEach(({ p, qty }) => addToCart({ ma_bien_the: p.variants[0].ma_bien_the, qty, from, to, combo: cb.id }));
    return { ok: true };
  };

  /* ---------------- Tài khoản ---------------- */
  const getUsers = () => {
    const users = loadJSON(USERS_KEY, []);
    if (!users.some((u) => u.email === "admin@wanderent.vn")) {
      users.push({ email: "admin@wanderent.vn", name: "Quản trị WANDERENT", phone: "0901234567", password: "wanderent", role: "admin" });
      saveJSON(USERS_KEY, users);
    }
    // Tài khoản khách mẫu để demo đăng nhập bằng số điện thoại + sổ địa chỉ
    if (!users.some((u) => u.email === "khach@wanderent.vn")) {
      users.push({
        email: "khach@wanderent.vn", name: "Nguyễn Minh Khách", phone: "0912345678", password: "123456", role: "customer",
        addresses: [
          { id: "a-demo1", label: "Ký túc xá", recipient: "Nguyễn Minh Khách", phone: "0912345678", street: "KTX Khu B, Đường Tô Vĩnh Diện", ward: "P. Linh Trung", district: "TP. Thủ Đức", note: "Gọi trước khi tới", isDefault: true },
          { id: "a-demo2", label: "Nhà riêng", recipient: "Nguyễn Minh Khách", phone: "0912345678", street: "12 Nguyễn Huệ", ward: "P. Bến Nghé", district: "Quận 1", note: "", isDefault: false },
        ],
      });
      saveJSON(USERS_KEY, users);
    }
    return users;
  };
  const getSession = () => loadJSON(SESSION_KEY, null);
  const setSession = (user) => saveJSON(SESSION_KEY, user ? { email: user.email, name: user.name, role: user.role || "customer" } : null);
  const currentUser = () => {
    const s = getSession();
    if (!s) return null;
    return getUsers().find((u) => u.email === s.email) || s;
  };
  // Số điện thoại VN: bỏ khoảng trắng/dấu chấm, +84 → 0
  const normPhone = (p) => {
    let x = String(p || "").replace(/[^\d+]/g, "");
    if (x.startsWith("+84")) x = "0" + x.slice(3);
    else if (x.startsWith("84") && x.length === 11) x = "0" + x.slice(2);
    return x;
  };
  const isPhone = (p) => /^0\d{9}$/.test(normPhone(p));
  const fmtPhone = (p) => { const x = normPhone(p); return x.length === 10 ? `${x.slice(0, 4)} ${x.slice(4, 7)} ${x.slice(7)}` : String(p || ""); };
  const isEmail = (e) => /^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(String(e || "").trim());
  const findUser = (login) => {
    const id = String(login || "").trim();
    if (!id) return null;
    if (id.includes("@")) return getUsers().find((u) => u.email === normEmail(id)) || null;
    const ph = normPhone(id);
    return getUsers().find((u) => normPhone(u.phone) === ph) || null;
  };
  const registerUser = ({ name, email, phone, password }) => {
    const users = getUsers();
    email = normEmail(email);
    if (!name || !String(name).trim()) return { ok: false, error: "Nhập họ tên." };
    if (!isEmail(email)) return { ok: false, error: "Email chưa đúng định dạng." };
    if (!isPhone(phone)) return { ok: false, error: "Số điện thoại cần đủ 10 số, bắt đầu bằng 0 (VD: 0912 345 678)." };
    if (!password || String(password).length < 6) return { ok: false, error: "Mật khẩu cần ít nhất 6 ký tự." };
    if (users.some((u) => u.email === email)) return { ok: false, error: "Email này đã có tài khoản. Hãy đăng nhập." };
    if (users.some((u) => normPhone(u.phone) === normPhone(phone))) return { ok: false, error: "Số điện thoại này đã có tài khoản. Hãy đăng nhập." };
    const user = { email, name: String(name).trim(), phone: normPhone(phone), password, role: "customer", addresses: [] };
    users.push(user); saveJSON(USERS_KEY, users); setSession(user);
    return { ok: true, user };
  };
  // Đăng nhập bằng email HOẶC số điện thoại
  const loginUser = (login, password) => {
    const user = findUser(login);
    if (!user || user.password !== password) return { ok: false, error: "Email / số điện thoại hoặc mật khẩu chưa đúng." };
    setSession(user);
    return { ok: true, user };
  };
  const saveUser = (user) => {
    const users = getUsers().map((u) => (u.email === user.email ? user : u));
    saveJSON(USERS_KEY, users);
    setSession(user);
    return user;
  };
  const updateProfile = (email, { name, phone }) => {
    const user = getUsers().find((u) => u.email === normEmail(email));
    if (!user) return { ok: false, error: "Không tìm thấy tài khoản." };
    if (!name || !String(name).trim()) return { ok: false, error: "Nhập họ tên." };
    if (!isPhone(phone)) return { ok: false, error: "Số điện thoại cần đủ 10 số, bắt đầu bằng 0." };
    if (getUsers().some((u) => u.email !== user.email && normPhone(u.phone) === normPhone(phone))) return { ok: false, error: "Số điện thoại này đã được tài khoản khác dùng." };
    return { ok: true, user: saveUser({ ...user, name: String(name).trim(), phone: normPhone(phone) }) };
  };
  const changePassword = (email, oldPw, newPw) => {
    const user = getUsers().find((u) => u.email === normEmail(email));
    if (!user || user.password !== oldPw) return { ok: false, error: "Mật khẩu hiện tại chưa đúng." };
    if (!newPw || String(newPw).length < 6) return { ok: false, error: "Mật khẩu mới cần ít nhất 6 ký tự." };
    saveUser({ ...user, password: newPw });
    return { ok: true };
  };

  /* ---------------- Sổ địa chỉ ---------------- */
  const HCM_DISTRICTS = ["Quận 1", "Quận 3", "Quận 4", "Quận 5", "Quận 6", "Quận 7", "Quận 8", "Quận 10", "Quận 11", "Quận 12",
    "Q. Bình Thạnh", "Q. Gò Vấp", "Q. Phú Nhuận", "Q. Tân Bình", "Q. Tân Phú", "Q. Bình Tân", "TP. Thủ Đức",
    "H. Bình Chánh", "H. Hóc Môn", "H. Nhà Bè", "H. Củ Chi", "H. Cần Giờ"];
  const ADDRESS_LABELS = ["Nhà riêng", "Công ty", "Ký túc xá", "Khác"];
  const fmtAddress = (a) => (a ? [a.street, a.ward, a.district, "TP.HCM"].filter(Boolean).join(", ") : "");
  const validateAddress = (a) => {
    if (!a.recipient || !String(a.recipient).trim()) return "Nhập tên người nhận.";
    if (!isPhone(a.phone)) return "Số điện thoại người nhận cần đủ 10 số, bắt đầu bằng 0.";
    if (!a.street || String(a.street).trim().length < 5) return "Nhập số nhà và tên đường.";
    if (!HCM_DISTRICTS.includes(a.district)) return "Chọn quận / huyện (chỉ giao trong TP.HCM).";
    return "";
  };
  const getAddresses = (email) => (getUsers().find((u) => u.email === normEmail(email))?.addresses || []);
  const saveAddress = (email, addr) => {
    const user = getUsers().find((u) => u.email === normEmail(email));
    if (!user) return { ok: false, error: "Hãy đăng nhập để lưu địa chỉ." };
    const err = validateAddress(addr);
    if (err) return { ok: false, error: err };
    const list = (user.addresses || []).slice();
    const clean = {
      id: addr.id || "a" + Date.now(), label: addr.label || "Nhà riêng", recipient: String(addr.recipient).trim(),
      phone: normPhone(addr.phone), street: String(addr.street).trim(), ward: String(addr.ward || "").trim(),
      district: addr.district, note: String(addr.note || "").trim(), isDefault: !!addr.isDefault || !list.length,
    };
    const i = list.findIndex((x) => x.id === clean.id);
    if (i >= 0) list[i] = clean; else list.push(clean);
    if (clean.isDefault) list.forEach((x) => { x.isDefault = x.id === clean.id; });
    saveUser({ ...user, addresses: list });
    return { ok: true, address: clean };
  };
  const deleteAddress = (email, id) => {
    const user = getUsers().find((u) => u.email === normEmail(email)); if (!user) return;
    const list = (user.addresses || []).filter((x) => x.id !== id);
    if (list.length && !list.some((x) => x.isDefault)) list[0].isDefault = true;
    saveUser({ ...user, addresses: list });
  };
  const setDefaultAddress = (email, id) => {
    const user = getUsers().find((u) => u.email === normEmail(email)); if (!user) return;
    saveUser({ ...user, addresses: (user.addresses || []).map((x) => ({ ...x, isDefault: x.id === id })) });
  };
  // Form địa chỉ dùng chung (tài khoản & thanh toán). Trả về HTML; đọc bằng readAddressForm(root)
  const addressFormHTML = (a = {}, prefix = "ad") => `
    <div class="addr-form" data-addr-form>
      <div class="addr-labels" role="radiogroup" aria-label="Loại địa chỉ">
        ${ADDRESS_LABELS.map((l, i) => `<label class="chip-radio"><input type="radio" name="${prefix}-label" value="${l}" ${(a.label || "Nhà riêng") === l ? "checked" : ""}><span>${l}</span></label>`).join("")}
      </div>
      <div class="form-grid">
        <div class="field"><label for="${prefix}-rc">Người nhận</label><input id="${prefix}-rc" name="recipient" autocomplete="name" value="${esc(a.recipient || "")}"></div>
        <div class="field"><label for="${prefix}-ph">Số điện thoại nhận hàng</label><input id="${prefix}-ph" name="phone" type="tel" inputmode="tel" autocomplete="tel" placeholder="0912 345 678" value="${esc(a.phone ? fmtPhone(a.phone) : "")}"></div>
      </div>
      <div class="field"><label for="${prefix}-st">Số nhà, tên đường</label><input id="${prefix}-st" name="street" autocomplete="address-line1" placeholder="VD: 669 Quốc lộ 1, KP3" value="${esc(a.street || "")}"></div>
      <div class="form-grid">
        <div class="field"><label for="${prefix}-wd">Phường / xã</label><input id="${prefix}-wd" name="ward" placeholder="VD: P. Linh Xuân" value="${esc(a.ward || "")}"></div>
        <div class="field"><label for="${prefix}-ds">Quận / huyện (TP.HCM)</label>
          <select id="${prefix}-ds" name="district"><option value="">Chọn quận / huyện</option>
            ${HCM_DISTRICTS.map((d) => `<option ${a.district === d ? "selected" : ""}>${d}</option>`).join("")}</select></div>
      </div>
      <div class="field"><label for="${prefix}-nt">Ghi chú cho shipper (không bắt buộc)</label><input id="${prefix}-nt" name="note" placeholder="VD: gọi trước 15 phút, cổng sau" value="${esc(a.note || "")}"></div>
    </div>`;
  const readAddressForm = (root) => {
    const f = root.querySelector("[data-addr-form]");
    const v = (n) => f.querySelector(`[name="${n}"]`)?.value || "";
    return {
      label: f.querySelector('input[type="radio"]:checked')?.value || "Nhà riêng",
      recipient: v("recipient"), phone: v("phone"), street: v("street"), ward: v("ward"), district: v("district"), note: v("note"),
    };
  };
  const logoutUser = () => setSession(null);

  /* ---------------- Đơn thuê ---------------- */
  const nextOrderCode = () => {
    const prefix = "WR-" + todayISO().replace(/-/g, "") + "-";
    const n = getOrders().filter((o) => String(o.id).startsWith(prefix)).length + 1;
    return prefix + String(n).padStart(3, "0");
  };
  const createOrder = (payload) => {
    const now = new Date().toISOString();
    const order = {
      id: nextOrderCode(),
      createdAt: now,
      status: payload.status || "deposit_pending",
      refundStatus: "held",
      history: [{ at: now, status: payload.status || "deposit_pending", note: (payload.status || "deposit_pending") === "deposit_pending" ? "Khách tạo đơn trên website, chờ thanh toán cọc" : "Khách đặt thuê và thanh toán cọc trên website" }],
      ...payload,
    };
    const list = getOrders(); list.unshift(order); saveOrders(list);
    return order;
  };
  const updateOrder = (id, patch, note) => {
    const now = new Date().toISOString();
    const list = getOrders().map((o) => {
      if (o.id !== id) return o;
      const history = (o.history || []).slice();
      if ((patch.status && patch.status !== o.status) || note) history.push({ at: now, status: patch.status || o.status, note: note || "" });
      return { ...o, ...patch, history, updatedAt: now };
    });
    saveOrders(list);
    return list.find((o) => o.id === id);
  };
  // Khách xác nhận đã nhận hàng (đơn giao tận nơi) hoặc báo thiếu / hỏng
  const confirmReceived = (id, by = "khách") => updateOrder(id, { status: "picked_up", receivedAt: new Date().toISOString(), receivedBy: by },
    by === "khách" ? "Khách xác nhận đã nhận đủ hàng, không hư hỏng" : "Admin xác nhận khách đã nhận hàng");
  const reportReceiptIssue = (id, text) => {
    const o = getOrders().find((x) => x.id === id);
    const issues = (o?.issues || []).concat([{ at: new Date().toISOString(), text: String(text).trim() }]);
    return updateOrder(id, { issues }, "Khách báo vấn đề khi nhận hàng: " + String(text).trim());
  };
  const statusMeta = (id) => ORDER_STATUSES.find((s) => s.id === id) || { id, label: id, color: "#5E6462" };
  const orderLines = (o) => (o.totals?.lines?.length
    ? o.totals.lines
    : (o.items || []).map((it) => {
      const t = lineTotals({ ...it, from: it.from || o.from, to: it.to || o.to });
      return { ma_bien_the: it.ma_bien_the, name: t.name, color: t.color || "", qty: t.qty, days: t.days, from: it.from || o.from, to: it.to || o.to, rentDay: t.rentDay, rent: t.rent, breakdown: t.breakdown, deposit: t.deposit };
    }));
  const PAY_LABEL = { momo: "Ví MoMo", transfer: "Chuyển khoản", card: "Thẻ nội địa / Visa" };

  /* ---------------- Hóa đơn & email (mô phỏng) ---------------- */
  const getOutbox = () => loadJSON(OUTBOX_KEY, []);
  const invoiceNo = (o) => "HD-" + String(o.id).replace(/^WR-/, "");
  const invoiceUrl = (o) => `invoice.html?id=${encodeURIComponent(o.id)}`;
  const sendInvoiceEmail = (order, reason) => {
    const mail = {
      id: "m" + Date.now(),
      to: order.customer?.email || "",
      subject: `[WANDERENT] Hóa đơn ${invoiceNo(order)} – đơn thuê ${order.id}`,
      orderId: order.id,
      reason: reason || "Đặt thuê thành công",
      sentAt: new Date().toISOString(),
    };
    const box = getOutbox(); box.unshift(mail); saveJSON(OUTBOX_KEY, box.slice(0, 200));
    return mail;
  };
  const mailtoInvoice = (o) => {
    const lines = orderLines(o).map((l) => `- ${l.qty} x ${l.name}${l.color ? " (" + l.color + ")" : ""}: ${vnd(l.rent)}`).join("\n");
    const body = `Chào ${o.customer?.name || "bạn"},\n\nWANDERENT gửi hóa đơn ${invoiceNo(o)} cho đơn thuê ${o.id}.\n` +
      `Ngày thuê: ${fmtDate(o.from)} → ${fmtDate(o.to)}\n\n${lines}\n\n` +
      `Tiền thuê (trả khi nhận đồ): ${vnd(o.totals?.rent)}\nTiền cọc đã thanh toán: ${vnd(o.totals?.deposit)}\nPhí giao nhận: ${vnd(o.totals?.ship)}\n\n` +
      `Xem hóa đơn: ${location.origin && location.origin !== "null" ? location.origin + location.pathname.replace(/[^/]*$/, "") : ""}${invoiceUrl(o)}\n\nCảm ơn bạn đã thuê đồ tại WANDERENT!`;
    return `mailto:${encodeURIComponent(o.customer?.email || "")}?subject=${encodeURIComponent(`Hóa đơn ${invoiceNo(o)} – WANDERENT`)}&body=${encodeURIComponent(body)}`;
  };

  /* ---------------- Dữ liệu demo ---------------- */
  const demoCardSVG = (name, school) => "data:image/svg+xml;utf8," + encodeURIComponent(
    `<svg xmlns="http://www.w3.org/2000/svg" width="600" height="380"><rect width="600" height="380" rx="24" fill="#1F5A43"/>` +
    `<rect x="24" y="90" width="150" height="190" rx="10" fill="#E9DDCF"/><text x="200" y="70" fill="#fff" font-family="sans-serif" font-size="26" font-weight="700">THẺ SINH VIÊN (MẪU DEMO)</text>` +
    `<text x="200" y="140" fill="#fff" font-family="sans-serif" font-size="24">${name}</text><text x="200" y="185" fill="#CFE0D6" font-family="sans-serif" font-size="20">${school}</text>` +
    `<text x="200" y="230" fill="#CFE0D6" font-family="sans-serif" font-size="20">MSSV: K2241xxxxx</text><text x="200" y="275" fill="#CFE0D6" font-family="sans-serif" font-size="18">Hiệu lực: 2022 – 2026</text></svg>`);

  // Đơn mẫu đang giao cho khách demo (0912 345 678) để thử nút "Đã nhận được hàng"
  const seedShipping = () => {
    if (loadJSON("wanderent_seed_v4", false)) return;
    const list = getOrders();
    if (!list.some((o) => o.id === "WR-DEMO-004")) {
      const from = todayISO(), to = addDaysISO(from, 2);
      const cart = [{ ma_bien_the: "LEU08_MACDINH", qty: 1, from, to }, { ma_bien_the: "TUINGU06_MACDINH", qty: 2, from, to }];
      const tot = snapshotTotals(cartTotals(cart, { delivery: true }));
      list.unshift({
        id: "WR-DEMO-004", createdAt: new Date().toISOString(), status: "shipping", refundStatus: "held",
        customer: { name: "Nguyễn Minh Khách", email: "khach@wanderent.vn", phone: "0912345678" },
        fulfill: "delivery", address: "KTX Khu B, Đường Tô Vĩnh Diện, P. Linh Trung, TP. Thủ Đức, TP.HCM",
        delivery: { recipient: "Nguyễn Minh Khách", phone: "0912345678", label: "Ký túc xá", note: "Gọi trước khi tới" },
        note: "", from, to, payMethod: "momo", items: cart, totals: tot,
        payment: { method: "momo", amount: tot.todayPay, txnId: "GD000000004", paidAt: new Date().toISOString() },
        history: [{ at: new Date().toISOString(), status: "shipping", note: "Dữ liệu mẫu: đã giao cho shipper" }],
      });
      saveOrders(list);
    }
    saveJSON("wanderent_seed_v4", true);
  };
  const seedDemo = () => {
    seedShipping();
    if (loadJSON(SEED_KEY, false)) return;
    getUsers();
    if (!getOrders().length) {
      const mk = (id, status, refundStatus, customer, fulfill, address, from, to, payMethod, items) => {
        const cart = items.map(([sku, qty]) => ({ ma_bien_the: sku, qty, from, to }));
        const tot = snapshotTotals(cartTotals(cart, { delivery: fulfill === "delivery" }));
        return {
          id, createdAt: new Date().toISOString(), status, refundStatus, customer, fulfill, address, note: "",
          from, to, payMethod, items: cart, totals: tot,
          history: [{ at: new Date().toISOString(), status, note: "Dữ liệu mẫu" }],
        };
      };
      const t = todayISO();
      saveOrders([
        mk("WR-DEMO-001", "confirmed", "held", { name: "Ngô Minh Anh", email: "anh@gmail.com", phone: "0912 345 678" },
          "pickup", STORE.address, addDaysISO(t, 5), addDaysISO(t, 8), "momo", [["LEU01_XANH_REU", 1]]),
        mk("WR-DEMO-002", "picked_up", "held", { name: "Trần Gia Huy", email: "huy@gmail.com", phone: "0987 111 222" },
          "delivery", "12 Nguyễn Huệ, Q.1, TP.HCM", addDaysISO(t, -1), addDaysISO(t, 2), "transfer", [["SUP02_MACDINH", 1]]),
        mk("WR-DEMO-003", "refunded", "done", { name: "Lê Phương", email: "phuong@gmail.com", phone: "0909 888 777" },
          "pickup", STORE.address, addDaysISO(t, -10), addDaysISO(t, -7), "card", [["TUINGU05_CAM", 2]]),
      ]);
    }
    if (!getStudents().length) {
      saveJSON(STUDENTS_KEY, [{
        email: "phuong@gmail.com", name: "Lê Phương", school: "ĐH Kinh tế – Luật", studentId: "K224100000",
        image: demoCardSVG("Lê Phương", "ĐH Kinh tế – Luật"), status: "pending", submittedAt: new Date().toISOString(),
      }]);
    }
    saveJSON(SEED_KEY, true);
  };

  /* ---------------- Icon ---------------- */
  const ICONS = {
    search: '<circle cx="11" cy="11" r="7"/><path d="m20 20-3.5-3.5"/>',
    user: '<circle cx="12" cy="8" r="4"/><path d="M4 21a8 8 0 0 1 16 0"/>',
    bag: '<path d="M5 8h14l-1 13H6L5 8Z"/><path d="M9 8V6a3 3 0 0 1 6 0v2"/>',
    calendar: '<rect x="3" y="5" width="18" height="16" rx="2"/><path d="M3 10h18M8 3v4M16 3v4"/>',
    chevron: '<path d="m6 9 6 6 6-6"/>',
    arrow: '<path d="M5 12h14M13 6l6 6-6 6"/>',
    menu: '<path d="M4 6h16M4 12h16M4 18h16"/>',
    close: '<path d="M6 6l12 12M18 6 6 18"/>',
    laptop: '<rect x="4" y="5" width="16" height="11" rx="1.5"/><path d="M2 19h20"/>',
    shield: '<path d="M12 3 4 6v6c0 5 3.5 8 8 9 4.5-1 8-4 8-9V6l-8-3Z"/><path d="m9 12 2 2 4-4"/>',
    mountain: '<path d="m2 20 7-12 4 6 3-4 6 10H2Z"/><path d="m7.5 10.5 1.5 1.5 1.5-1.5"/>',
    check: '<circle cx="12" cy="12" r="9"/><path d="m8 12 3 3 5-6"/>',
    coins: '<ellipse cx="12" cy="6" rx="7" ry="3"/><path d="M5 6v6c0 1.7 3.1 3 7 3s7-1.3 7-3V6"/><path d="M5 12v6c0 1.7 3.1 3 7 3s7-1.3 7-3v-6"/>',
    refresh: '<path d="M20 11a8 8 0 0 0-14.9-3.5M4 4v4h4"/><path d="M4 13a8 8 0 0 0 14.9 3.5M20 20v-4h-4"/>',
    tent: '<path d="M3 20 12 4l9 16H3Z"/><path d="m12 20-3-6h6l-3 6Z"/>',
    truck: '<path d="M3 6h11v10H3zM14 10h4l3 3v3h-7"/><circle cx="7" cy="18" r="2"/><circle cx="17" cy="18" r="2"/>',
    phone: '<path d="M5 4h4l2 5-2.5 1.5a11 11 0 0 0 5 5L15 13l5 2v4a2 2 0 0 1-2 2A16 16 0 0 1 3 6a2 2 0 0 1 2-2Z"/>',
    mail: '<rect x="3" y="5" width="18" height="14" rx="2"/><path d="m3 7 9 6 9-6"/>',
    pin: '<path d="M12 21s-7-6.2-7-12a7 7 0 0 1 14 0c0 5.8-7 12-7 12Z"/><circle cx="12" cy="9" r="2.5"/>',
    facebook: '<path d="M14 8h3V4h-3a4 4 0 0 0-4 4v3H7v4h3v6h4v-6h3l1-4h-4V8Z"/>',
    youtube: '<rect x="2" y="5" width="20" height="14" rx="4"/><path d="m10 9 5 3-5 3V9Z"/>',
    instagram: '<rect x="3" y="3" width="18" height="18" rx="5"/><circle cx="12" cy="12" r="4"/><circle cx="17.5" cy="6.5" r=".5"/>',
    box: '<path d="m3 7 9-4 9 4-9 4-9-4Z"/><path d="M3 7v10l9 4 9-4V7M12 11v10"/>',
    play: '<circle cx="12" cy="12" r="9"/><path d="m10 8 6 4-6 4V8Z"/>',
    warn: '<path d="M12 3 2 21h20L12 3Z"/><path d="M12 9v6M12 18h.01"/>',
    student: '<path d="m2 9 10-5 10 5-10 5L2 9Z"/><path d="M6 11v5c0 1.5 2.7 3 6 3s6-1.5 6-3v-5M22 9v6"/>',
    receipt: '<path d="M6 3h12v18l-3-2-3 2-3-2-3 2V3Z"/><path d="M9 8h6M9 12h6M9 16h3"/>',
  };
  const icon = (name, cls = "icon") => `<svg class="${cls}" viewBox="0 0 24 24" aria-hidden="true">${ICONS[name] || ""}</svg>`;

  /* ---------------- Thẻ sản phẩm ---------------- */
  const productCard = (p) => {
    const v = p.variants[0];
    const thumb = thumbOf(v);
    const colors = p.variants.filter((x) => x.mau_sac);
    const url = `product.html?id=${encodeURIComponent(p.ma_sp)}`;
    const rent = rentPrice(p);
    const dates = getDates();
    const avail = availableQty(v.ma_bien_the, dates.from, dates.to);
    const anyAvail = p.variants.some((x) => availableQty(x.ma_bien_the, dates.from, dates.to) > 0);
    return `
      <article class="product-card">
        <a class="card-media" href="${url}" aria-label="${esc(cleanName(p.ten_sp))}">
          <img src="${esc(thumb)}" alt="${esc(cleanName(p.ten_sp))}" loading="lazy" referrerpolicy="no-referrer">
          ${colors.length ? `<span class="badge badge-sand">${colors.length} màu</span>` : ""}
        </a>
        <div class="card-body">
          <span class="card-cat">${esc(p.danh_muc)}</span>
          <h3 class="card-title"><a href="${url}">${esc(cleanName(p.ten_sp))}</a></h3>
          <div class="card-colors">
            ${colors.map((c) => `<span class="dot" style="${colorStyle(c.mau_sac)}" title="${esc(c.mau_sac)}"></span>`).join("")}
          </div>
          <div class="card-price">
            <span class="rent-price">${vnd(rent)} <small>/ ngày</small></span>
            <span class="value-price">Giá trị sản phẩm: ${vnd(Number(v.gia_goc))}</span>
            <span class="value-price">Cọc 30%: ${vnd(depositOf(v))}</span>
            <span class="stock-line ${avail ? "ok" : "out"}">${avail ? `Còn ${avail} món trong ngày đã chọn` : "Hết hàng trong ngày đã chọn"}</span>
          </div>
          <div class="card-actions">
            <a class="btn btn-outline" href="${url}" aria-label="Xem chi tiết ${esc(cleanName(p.ten_sp))}">Chi tiết</a>
            <button type="button" class="btn btn-primary" data-quick-add="${esc(p.ma_sp)}" ${anyAvail ? "" : "disabled"}
              aria-label="${anyAvail ? "Thêm " + esc(cleanName(p.ten_sp)) + " vào giỏ" : "Hết hàng"}" title="${anyAvail ? `Thêm vào giỏ cho ngày ${fmtDate(dates.from).slice(0, 5)} → ${fmtDate(dates.to).slice(0, 5)}${p.variants.length > 1 ? " (chọn màu)" : ""}` : "Hết hàng trong ngày đã chọn"}">${icon("bag")}${anyAvail ? "Thêm vào giỏ" : "Hết hàng"}</button>
          </div>
        </div>
      </article>`;
  };

  /* ---------------- Header / footer ---------------- */
  const telHref = (phone) => "tel:" + String(phone).replace(/[^\d+]/g, "").replace(/^0/, "+84");

  const renderHeader = (active) => {
    const el = document.getElementById("site-header");
    if (!el) return;
    const count = (name) => PRODUCTS.filter((p) => p.danh_muc === name).length;
    const user = currentUser();
    const cur = (k) => (active === k ? 'class="active" aria-current="page"' : "");
    el.className = "site-header";
    el.innerHTML = `
      <div class="container header-inner">
        <a class="logo" href="index.html" aria-label="WANDERENT – về trang chủ">
          <img src="assets/img/logo.png" alt="WANDERENT" width="156" height="52">
        </a>
        <nav class="main-nav" id="main-nav" aria-label="Điều hướng chính">
          <a href="index.html" ${cur("home")}>Trang chủ</a>
          <div class="nav-drop">
            <button type="button" aria-haspopup="true" class="${active === "products" ? "active" : ""}">Thuê thiết bị ${icon("chevron")}</button>
            <div class="drop-menu">
              <a href="products.html">Tất cả thiết bị <small>${PRODUCTS.length}</small></a>
              ${CATEGORIES.map((c) => `<a href="products.html?dm=${c.slug}">${c.name} <small>${count(c.name)}</small></a>`).join("")}
              <a href="inventory.html">Lịch còn hàng theo ngày</a>
            </div>
          </div>
          <a href="combo.html" ${cur("combo")}>Combo chuyến đi</a>
          <a href="guide.html" ${cur("guide")}>Hướng dẫn thuê</a>
          <a href="student.html" ${cur("student")}>Ưu đãi HSSV</a>
        </nav>
        <div class="header-actions">
          <button class="icon-btn" type="button" aria-label="Tìm kiếm" aria-expanded="false" data-search-toggle>${icon("search")}</button>
          <a class="icon-btn" href="account.html" aria-label="${user ? "Tài khoản " + esc(user.name) : "Đăng nhập / đăng ký"}" title="${user ? esc(user.name) : "Đăng nhập / đăng ký"}">${icon("user")}</a>
          <a class="icon-btn" href="cart.html" aria-label="Giỏ thuê">${icon("bag")}<span class="cart-count" data-cart-count hidden>0</span></a>
          <a class="btn btn-primary" href="products.html">${icon("calendar")}Đặt thuê ngay</a>
        </div>
        <button class="icon-btn menu-toggle" type="button" aria-label="Mở menu" aria-controls="main-nav" aria-expanded="false" data-menu-toggle>${icon("menu")}</button>
      </div>
      <div class="header-search" id="header-search">
        <form class="container" action="products.html" role="search">
          <label class="sr-only" for="hs-input">Tìm thiết bị</label>
          <input id="hs-input" name="tim" type="search" placeholder="Tìm lều, túi ngủ, ván SUP, bếp...">
          <button class="btn btn-primary" type="submit">Tìm</button>
        </form>
      </div>`;

    const nav = el.querySelector("#main-nav");
    const mt = el.querySelector("[data-menu-toggle]");
    mt.addEventListener("click", () => {
      const open = nav.classList.toggle("open");
      mt.setAttribute("aria-expanded", open);
      mt.innerHTML = icon(open ? "close" : "menu");
    });
    const st = el.querySelector("[data-search-toggle]");
    const box = el.querySelector("#header-search");
    st.addEventListener("click", () => {
      const open = box.classList.toggle("open");
      st.setAttribute("aria-expanded", open);
      if (open) box.querySelector("input").focus();
    });
    updateCartCount();
  };

  const renderFooter = () => {
    const el = document.getElementById("site-footer");
    if (!el) return;
    el.className = "site-footer";
    el.innerHTML = `
      <div class="container">
        <div class="footer-top">
          <div class="footer-brand">
            <img src="assets/img/logo.png" alt="WANDERENT" width="192" height="64" loading="lazy">
            <p>Nền tảng cho thuê thiết bị cắm trại &amp; outdoor trực tuyến: chọn ngày, xem lịch còn hàng, thuê combo theo chuyến đi,
              đặt cọc trực tuyến và được hoàn cọc khi trả hàng. Không giữ giấy tờ tùy thân.</p>
            <div class="socials">
              <a href="${esc(STORE.facebook)}" target="_blank" rel="noopener" aria-label="Facebook">${icon("facebook")}</a>
              <a href="${esc(STORE.instagram)}" target="_blank" rel="noopener" aria-label="Instagram">${icon("instagram")}</a>
              <a href="${esc(STORE.youtube)}" target="_blank" rel="noopener" aria-label="YouTube">${icon("youtube")}</a>
            </div>
          </div>
          <div>
            <h4>Thuê thiết bị</h4>
            <ul class="footer-links">
              ${CATEGORIES.map((c) => `<li><a href="products.html?dm=${c.slug}">${c.name}</a></li>`).join("")}
              <li><a href="combo.html">Combo chuyến đi</a></li>
              <li><a href="inventory.html">Lịch còn hàng theo ngày</a></li>
            </ul>
          </div>
          <div>
            <h4>Hỗ trợ</h4>
            <ul class="footer-links">
              <li><a href="guide.html">Hướng dẫn thuê &amp; cách tính giá</a></li>
              <li><a href="deposit.html">Chính sách đặt cọc 30%</a></li>
              <li><a href="refund.html">Hoàn cọc khi trả hàng</a></li>
              <li><a href="student.html">Ưu đãi học sinh, sinh viên</a></li>
              <li><a href="care.html">Vệ sinh &amp; bảo quản đồ</a></li>
              <li><a href="faq.html">Câu hỏi thường gặp</a></li>
            </ul>
          </div>
          <div>
            <h4>Liên hệ</h4>
            <ul class="footer-links">
              <li>${icon("pin")}<span>${esc(STORE.address)}</span></li>
              <li>${icon("phone")}<a href="${telHref(STORE.phone)}">${esc(STORE.phone)}</a></li>
              <li>${icon("mail")}<a href="mailto:${esc(STORE.email)}">${esc(STORE.email)}</a></li>
              <li><a href="contact.html">Bản đồ &amp; giờ nhận trả</a></li>
              <li><a href="admin.html">Dành cho quản trị</a></li>
            </ul>
          </div>
        </div>
        <div class="footer-bottom">
          <span>© ${new Date().getFullYear()} WANDERENT – Đồ án môn Thương mại điện tử. Không dùng cho mục đích thương mại.</span>
          <span>Hình ảnh thiết bị tham khảo cho bài demo học thuật.</span>
        </div>
      </div>`;
  };

  /* ---------------- Toast & flash ---------------- */
  let toastTimer;
  const toast = (msg) => {
    let el = document.querySelector(".toast");
    if (!el) {
      el = document.createElement("div");
      el.className = "toast"; el.setAttribute("role", "status"); el.setAttribute("aria-live", "polite");
      document.body.appendChild(el);
    }
    el.textContent = msg;
    requestAnimationFrame(() => el.classList.add("show"));
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => el.classList.remove("show"), 3800);
  };
  // Thông báo hiển thị ở trang kế tiếp (sau khi chuyển trang)
  const flash = (msg) => { try { sessionStorage.setItem(FLASH_KEY, msg); } catch (e) { /* bỏ qua */ } };
  const showFlash = () => {
    try {
      const m = sessionStorage.getItem(FLASH_KEY);
      if (m) { sessionStorage.removeItem(FLASH_KEY); setTimeout(() => toast(m), 150); }
    } catch (e) { /* bỏ qua */ }
  };

  const hydrateIcons = (root = document) => {
    root.querySelectorAll("[data-icon]").forEach((el) => {
      el.insertAdjacentHTML("afterbegin", icon(el.dataset.icon)); el.removeAttribute("data-icon");
    });
    root.querySelectorAll("[data-icon-after]").forEach((el) => {
      el.insertAdjacentHTML("beforeend", icon(el.dataset.iconAfter)); el.removeAttribute("data-icon-after");
    });
  };

  // Điền thông tin cửa hàng vào các phần tử data-store="address|phone|..."
  const hydrateStore = (root = document) => {
    root.querySelectorAll("[data-store]").forEach((el) => {
      const k = el.dataset.store;
      if (k === "phone-link") { el.href = telHref(STORE.phone); el.textContent = STORE.phone; return; }
      if (k === "email-link") { el.href = "mailto:" + STORE.email; el.textContent = STORE.email; return; }
      if (k === "map-link") { el.href = STORE.map; return; }
      if (k === "delivery-fee") { el.textContent = vnd(DELIVERY_FEE); return; }
      if (STORE[k] != null) el.textContent = STORE[k];
    });
  };

  /* ---------------- Thanh quản trị dùng chung (trang web & trang quản trị) ----------------
     Cùng một thanh, cùng vị trí trên cả 2 nơi: ai đang đăng nhập, nút chuyển Trang web ⇄ Quản trị, Đăng xuất. */
  const adminSwitchHTML = (where) => `
    <div class="switch-seg" role="group" aria-label="Chuyển giữa trang web và trang quản trị">
      <a href="index.html" ${where === "site" ? 'aria-current="page"' : ""}>${icon("laptop")}Trang web</a>
      <a href="admin.html" ${where === "admin" ? 'aria-current="page"' : ""}>${icon("shield")}Trang quản trị</a>
    </div>`;
  const renderAdminSwitch = (where = "site") => {
    const u = currentUser();
    document.querySelector(".admin-switch")?.remove();
    document.body.classList.remove("has-admin-switch");
    if (!u || u.role !== "admin") return;
    const bar = document.createElement("div");
    bar.className = "admin-switch";
    bar.innerHTML = `<div class="admin-switch-inner">
      <span class="admin-switch-who">${icon("user")}<span>Quản trị viên · <strong>${esc(u.email)}</strong></span></span>
      ${adminSwitchHTML(where)}
      <button type="button" class="admin-switch-out" data-admin-logout>Đăng xuất</button>
    </div>`;
    document.body.prepend(bar);
    document.body.classList.add("has-admin-switch");
    bar.querySelector("[data-admin-logout]").addEventListener("click", () => {
      logoutUser();
      if (where === "admin") location.reload(); else { renderAdminSwitch(); renderHeader(); }
    });
  };

  /* ---------------- Hộp thoại xác nhận ---------------- */
  const confirmDialog = ({ title, message, confirmText = "Đồng ý", cancelText = "Hủy", danger = false }) => new Promise((resolve) => {
    const dlg = document.createElement("dialog");
    dlg.className = "confirm-dialog";
    dlg.setAttribute("aria-labelledby", "cd-title");
    dlg.innerHTML = `<form method="dialog">
        <div class="cd-icon ${danger ? "danger" : ""}">${icon(danger ? "warn" : "check")}</div>
        <h2 id="cd-title">${esc(title)}</h2>
        ${message ? `<p>${message}</p>` : ""}
        <div class="cd-actions">
          <button type="submit" value="cancel" class="btn btn-outline">${esc(cancelText)}</button>
          <button type="submit" value="ok" class="btn ${danger ? "btn-danger" : "btn-primary"}">${esc(confirmText)}</button>
        </div>
      </form>`;
    document.body.appendChild(dlg);
    let settled = false;
    const finish = (yes) => { if (settled) return; settled = true; if (dlg.open) dlg.close(); dlg.remove(); resolve(yes); };
    dlg.querySelector("form").addEventListener("submit", (e) => { e.preventDefault(); finish(e.submitter?.value === "ok"); });
    dlg.addEventListener("click", (e) => { if (e.target === dlg) finish(false); }); // bấm ra ngoài = hủy
    dlg.addEventListener("close", () => finish(dlg.returnValue === "ok"));      // phím Esc = hủy
    dlg.showModal();
    dlg.querySelector('[value="cancel"]').focus();
  });

  // Hộp thoại nhập nội dung (VD: báo thiếu / hỏng). Trả về chuỗi hoặc null nếu hủy.
  const promptDialog = ({ title, message, placeholder = "", confirmText = "Gửi", cancelText = "Hủy", required = true }) => new Promise((resolve) => {
    const dlg = document.createElement("dialog");
    dlg.className = "confirm-dialog";
    dlg.setAttribute("aria-labelledby", "pd-title");
    dlg.innerHTML = `<form>
        <h2 id="pd-title">${esc(title)}</h2>
        ${message ? `<p>${message}</p>` : ""}
        <label class="sr-only" for="pd-text">${esc(title)}</label>
        <textarea id="pd-text" rows="4" placeholder="${esc(placeholder)}"></textarea>
        <p class="form-error" hidden></p>
        <div class="cd-actions">
          <button type="button" value="cancel" class="btn btn-outline">${esc(cancelText)}</button>
          <button type="submit" class="btn btn-primary">${esc(confirmText)}</button>
        </div>
      </form>`;
    document.body.appendChild(dlg);
    let settled = false;
    const finish = (v) => { if (settled) return; settled = true; if (dlg.open) dlg.close(); dlg.remove(); resolve(v); };
    const ta = dlg.querySelector("textarea");
    dlg.querySelector("form").addEventListener("submit", (e) => {
      e.preventDefault();
      if (required && !ta.value.trim()) { const er = dlg.querySelector(".form-error"); er.hidden = false; er.textContent = "Hãy mô tả ngắn vấn đề."; ta.focus(); return; }
      finish(ta.value.trim());
    });
    dlg.querySelector('[value="cancel"]').addEventListener("click", () => finish(null));
    dlg.addEventListener("click", (e) => { if (e.target === dlg) finish(null); });
    dlg.addEventListener("close", () => finish(null));
    dlg.showModal();
    ta.focus();
  });

  /* ---------------- Giỏ: tự dời món đã qua ngày nhận ----------------
     Giỏ lưu từ hôm trước có thể có ngày nhận đã qua. Dời cả nhóm (cả combo) sang ngày mai,
     giữ nguyên số ngày thuê, nếu còn hàng. Trả về danh sách tên đã dời / không dời được. */
  const rollStaleCart = () => {
    const cart = getCart();
    const today = todayISO();
    const moved = [], blocked = [];
    const done = new Set();
    cart.forEach((it) => {
      if (done.has(it.id)) return;
      if (isValidISO(it.from) && it.from >= today && it.to > it.from) return;
      const group = it.combo ? cart.filter((x) => x.combo === it.combo && x.from === it.from && x.to === it.to) : [it];
      group.forEach((g) => done.add(g.id));
      const days = isValidISO(it.from) && isValidISO(it.to) && it.to > it.from ? daysBetween(it.from, it.to) : 2;
      const from = addDaysISO(today, 1), to = addDaysISO(from, days);
      const ids = group.map((g) => g.id);
      const ok = group.every((g) => validateRental({ sku: g.ma_bien_the, from, to, qty: g.qty, ignoreCartIds: ids }).ok);
      const label = it.combo ? (COMBOS.find((c) => c.id === it.combo)?.name || "Combo") : cleanName(variantBySku(it.ma_bien_the)?.product.ten_sp || "");
      if (ok) { group.forEach((g) => { g.from = from; g.to = to; }); moved.push(label); } else blocked.push(label);
    });
    if (moved.length) setCart(cart);
    return { moved, blocked, from: addDaysISO(today, 1) };
  };

  /* ---------------- Thêm nhanh vào giỏ ---------------- */
  const quickAdd = (sku, qty = 1) => {
    const found = variantBySku(sku); if (!found) return false;
    const d = getDates();
    const v = validateRental({ sku, from: d.from, to: d.to, qty });
    if (!v.ok) { toast(v.error); return false; }
    addToCart({ ma_bien_the: sku, qty, from: d.from, to: d.to });
    toast(`Đã thêm ${cleanName(found.product.ten_sp)}${found.variant.mau_sac ? " (" + found.variant.mau_sac + ")" : ""} · ${fmtDate(d.from).slice(0, 5)} → ${fmtDate(d.to).slice(0, 5)} vào giỏ thuê.`);
    return true;
  };

  /* ---------------- Xem nhanh sản phẩm (khung trượt bên phải) ---------------- */
  let qvLastFocus = null;
  const closeQuickView = () => {
    const panel = document.getElementById("qv-panel");
    if (!panel || panel.hidden) return;
    panel.classList.remove("open");
    document.getElementById("qv-backdrop").classList.remove("open");
    document.body.classList.remove("qv-lock");
    setTimeout(() => { panel.hidden = true; document.getElementById("qv-backdrop").hidden = true; }, 220);
    qvLastFocus?.focus?.();
  };
  const openQuickView = (id, opts = {}) => {
    const p = byId(id); if (!p) return;
    let panel = document.getElementById("qv-panel");
    if (!panel) {
      const bd = document.createElement("div");
      bd.id = "qv-backdrop"; bd.className = "qv-backdrop"; bd.hidden = true;
      bd.addEventListener("click", closeQuickView);
      panel = document.createElement("aside");
      panel.id = "qv-panel"; panel.className = "qv-panel"; panel.hidden = true;
      panel.setAttribute("role", "dialog"); panel.setAttribute("aria-modal", "true"); panel.setAttribute("aria-labelledby", "qv-title");
      panel.tabIndex = -1;
      document.body.append(bd, panel);
    }
    const d = getDates();
    const c = contentOf(p);
    const rent = rentPrice(p);
    const colors = p.variants.filter((x) => x.mau_sac);
    const specs = specsOf(p).slice(0, 4);
    // Mặc định chọn màu đầu tiên còn hàng
    let v = p.variants.find((x) => availableQty(x.ma_bien_the, d.from, d.to) > 0) || p.variants[0];

    const draw = () => {
      const avail = availableQty(v.ma_bien_the, d.from, d.to);
      panel.innerHTML = `
        <div class="qv-head">
          <span class="card-cat">${esc(p.danh_muc)}</span>
          <button type="button" class="icon-btn" data-qv-close aria-label="Đóng xem nhanh">${icon("close")}</button>
        </div>
        <div class="qv-body">
          <div class="qv-img"><img src="${esc(thumbOf(v))}" alt="${esc(cleanName(p.ten_sp))}" referrerpolicy="no-referrer"></div>
          <h2 id="qv-title">${esc(cleanName(p.ten_sp))}</h2>
          <div class="qv-price">
            <span class="rent-price">${vnd(rent)} <small>/ ngày</small></span>
            <span class="value-price">Giá trị sản phẩm: ${vnd(v.gia_goc)}</span>
            <span class="value-price">Cọc 30%: ${vnd(depositOf(v))} <small>(được hoàn khi trả hàng)</small></span>
            <span class="stock-line ${avail ? "ok" : "out"}">${avail ? `Còn ${avail} món` : "Hết hàng"} từ ${fmtDate(d.from).slice(0, 5)} đến ${fmtDate(d.to).slice(0, 5)}</span>
          </div>
          ${colors.length > 1 ? `<fieldset class="qv-colors"><legend>Màu sắc: <strong>${esc(v.mau_sac)}</strong></legend>
            ${colors.map((x) => `<button type="button" class="color-btn" data-qv-color="${esc(x.ma_bien_the)}" aria-pressed="${x === v}">
              <span class="dot" style="${colorStyle(x.mau_sac)}"></span>${esc(x.mau_sac)}</button>`).join("")}</fieldset>` : ""}
          ${c.tom_tat ? `<p class="qv-sum">${esc(c.tom_tat)}</p>` : ""}
          ${c.noi_bat.length ? `<h3>Điểm nổi bật</h3><ul class="desc-list">${c.noi_bat.slice(0, 3).map((x) => `<li>${icon("check")}<span>${esc(x)}</span></li>`).join("")}</ul>` : ""}
          ${specs.length ? `<h3>Thông số chính</h3><dl class="qv-specs">${specs.map(([k, val]) => `<div><dt>${esc(k || "Thông tin")}</dt><dd>${esc(val)}</dd></div>`).join("")}</dl>` : ""}
          ${c.phu_hop ? `<h3>Phù hợp cho</h3><p>${esc(c.phu_hop)}</p>` : ""}
        </div>
        <div class="qv-foot">
          <a class="btn btn-outline" href="product.html?id=${encodeURIComponent(p.ma_sp)}&mau=${encodeURIComponent(v.ma_bien_the)}">Xem chi tiết</a>
          <button type="button" class="btn btn-primary" data-qv-add ${avail ? "" : "disabled"}>${icon("bag")}${avail ? "Thêm vào giỏ" : "Hết hàng"}</button>
        </div>`;
      panel.querySelectorAll("[data-qv-close]").forEach((b) => b.addEventListener("click", closeQuickView));
      panel.querySelectorAll("[data-qv-color]").forEach((b) => b.addEventListener("click", () => {
        v = p.variants.find((x) => x.ma_bien_the === b.dataset.qvColor); draw();
        panel.querySelector(`[data-qv-color="${v.ma_bien_the}"]`)?.focus();
      }));
      panel.querySelector("[data-qv-add]").addEventListener("click", () => { if (quickAdd(v.ma_bien_the)) closeQuickView(); });
    };
    draw();
    qvLastFocus = document.activeElement;
    const bd = document.getElementById("qv-backdrop");
    bd.hidden = false; panel.hidden = false;
    document.body.classList.add("qv-lock");
    void panel.offsetWidth; // ép trình duyệt tính layout để hiệu ứng trượt chạy
    bd.classList.add("open"); panel.classList.add("open");
    (opts.focusColor && panel.querySelector("[data-qv-color]") || panel).focus();
  };
  document.addEventListener("click", (e) => {
    const t = e.target.closest("[data-qv]");
    if (t) { e.preventDefault(); openQuickView(t.dataset.qv); return; }
    // Nút "Thêm vào giỏ" trên thẻ sản phẩm: 1 mẫu → thêm ngay; nhiều màu → mở khung chọn màu
    const a = e.target.closest("[data-quick-add]");
    if (a) {
      e.preventDefault();
      const p = byId(a.dataset.quickAdd); if (!p) return;
      if (p.variants.length > 1) openQuickView(p.ma_sp, { focusColor: true });
      else quickAdd(p.variants[0].ma_bien_the);
    }
  });
  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape") closeQuickView();
    // Giữ phím Tab trong khung xem nhanh khi đang mở
    const panel = document.getElementById("qv-panel");
    if (e.key === "Tab" && panel && !panel.hidden) {
      const f = [...panel.querySelectorAll("a[href], button:not([disabled])")];
      if (!f.length) return;
      if (e.shiftKey && document.activeElement === f[0]) { e.preventDefault(); f[f.length - 1].focus(); }
      else if (!e.shiftKey && document.activeElement === f[f.length - 1]) { e.preventDefault(); f[0].focus(); }
    }
  });

  const initPage = (active) => { seedDemo(); renderAdminSwitch(); renderHeader(active); renderFooter(); hydrateIcons(); hydrateStore(); showFlash(); };

  window.WR = {
    hydrateIcons, hydrateStore, initPage,
    COMBO_DEFAULT_DAYS, openQuickView, closeQuickView, adminSwitchHTML, renderAdminSwitch, confirmDialog, promptDialog, rollStaleCart, quickAdd,
    PRODUCTS, ALL_PRODUCTS, CATEGORIES, DEPOSIT_RATE, DELIVERY_FEE, LATE_FEE_PER_DAY, COMBOS, COMBO_DISCOUNT, STUDENT_DISCOUNT,
    STORE, DEFAULT_STORE, ORDER_STATUSES, DAY_TIERS, DEFAULT_RENT, STOCK_BY_CAT, PAY_LABEL, STUDENT_STATUS,
    SETTINGS, saveSettings, resetSettings,
    esc, vnd, cleanName, images, mediaOf, thumbOf, parseMedia, catBySlug, catByName, byId, hasColors, minPrice, rentPrice,
    depositOf, parseSpecs, specsOf, contentOf, colorStyle,
    dayPriceAt, rentForDays, rentBreakdown, percentOff,
    getDates, setDates, daysBetween, toISO, todayISO, addDaysISO, isPastDate, isValidISO, fmtDate, bindDateRange,
    addToCart, getCart, setCart, removeFromCart, clearCart, setCartDates, cartTotals, snapshotTotals, lineTotals, cartQty,
    availableQty, bookedQty, stockCap, validateRental, comboQuote, comboItems, addComboToCart, variantBySku,
    getOrders, createOrder, updateOrder, statusMeta, orderLines, confirmReceived, reportReceiptIssue,
    currentUser, getUsers, registerUser, loginUser, logoutUser, seedDemo,
    normPhone, isPhone, fmtPhone, isEmail, findUser, updateProfile, changePassword,
    HCM_DISTRICTS, fmtAddress, validateAddress, getAddresses, saveAddress, deleteAddress, setDefaultAddress, addressFormHTML, readAddressForm,
    getStudents, studentOf, isStudentApproved, submitStudent, reviewStudent, compressImage, renderStudentForm,
    getOutbox, sendInvoiceEmail, invoiceNo, invoiceUrl, mailtoInvoice,
    icon, productCard, renderHeader, renderFooter, toast, flash, telHref,
  };
})();
