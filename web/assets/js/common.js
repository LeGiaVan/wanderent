/* =====================================================================
   WANDERENT — JS dùng chung: dữ liệu, tiện ích, header, footer
   Cần nạp sau data.js:  <script src="assets/js/data.js"></script>
   ===================================================================== */
(function () {
  "use strict";

  const PRODUCTS = window.WANDERENT_PRODUCTS || [];

  const DEPOSIT_RATE = 0.3;
  const DELIVERY_FEE = 50000;
  const LATE_FEE_PER_DAY = 80000;
  const COMBO_DISCOUNT = 0.1;

  // Giá thuê / ngày (VNĐ). Tính theo giá trị thiết bị, làm tròn 5.000đ.
  const RENT_PRICE_PER_DAY = {
    LEU01: 50000, LEU02: 250000, LEU03: 120000, LEU04: 330000,
    LEU05: 270000, LEU06: 390000, LEU07: 550000, LEU08: 210000,
    TUINGU01: 70000, TUINGU02: 70000, TUINGU03: 70000, TUINGU04: 55000,
    TUINGU05: 35000, TUINGU06: 40000, TUINGU07: 45000, TUINGU08: 25000,
    SUP01: 650000, SUP02: 380000, SUP03: 400000, SUP04: 320000, SUP05: 400000, SUP06: 280000,
    BEP01: 90000, BEP02: 20000, BEP03: 40000, BEP04: 45000,
    BEP05: 55000, BEP06: 35000, BEP07: 40000, BEP08: 20000,
  };

  const STOCK_BY_CAT = { "Lều": 3, "Túi ngủ": 6, "SUP": 2, "Bếp và dụng cụ ăn uống": 5 };

  const STORE = {
    name: "WANDERENT – Điểm nhận đồ Thủ Đức",
    address: "669 Quốc lộ 1, KP3, P. Linh Xuân, TP. Thủ Đức, TP.HCM (gần ĐH Kinh tế – Luật)",
    hours: "8:00 – 20:00 mỗi ngày",
    phone: "0901 234 567",
    email: "hello@wanderent.vn",
    map: "https://maps.google.com/?q=Đại học Kinh tế Luật TP.HCM",
    facebook: "https://www.facebook.com/wanderent",
    instagram: "https://www.instagram.com/wanderent",
    youtube: "https://www.youtube.com/@wanderent",
  };

  const COMBOS = [
    { id: "doi", name: "Combo Cặp đôi", tag: "2 người · 1–2 đêm", desc: "Lều tự bung, 2 túi ngủ, bếp mini và bộ ăn uống.", items: [["LEU08", 1], ["TUINGU06", 2], ["BEP03", 1], ["BEP06", 1]] },
    { id: "nhom", name: "Combo Nhóm bạn", tag: "4–6 người · 2 ngày", desc: "Lều 6 người, túi ngủ đông, bếp lớn, bếp nướng và sàn SUP.", items: [["LEU02", 1], ["TUINGU01", 4], ["BEP01", 1], ["BEP05", 1], ["SUP04", 1]] },
    { id: "sinhton", name: "Combo Sinh tồn", tag: "Trekking · gọn nhẹ", desc: "Lều 4 người, túi ngủ siêu nhẹ, bếp mini, chảo và bộ ăn.", items: [["LEU05", 1], ["TUINGU05", 1], ["BEP03", 1], ["BEP04", 1], ["BEP02", 1]] },
  ];

  const ORDER_STATUSES = [
    { id: "deposit_pending", label: "Chờ thanh toán cọc", color: "#C97A4A" },
    { id: "confirmed", label: "Đã cọc / giữ đồ", color: "#1F5A43" },
    { id: "ready", label: "Sẵn sàng giao", color: "#2F6DB5" },
    { id: "picked_up", label: "Đang thuê", color: "#7B4B2A" },
    { id: "returned", label: "Đã trả đồ", color: "#4F7A61" },
    { id: "refunded", label: "Đã hoàn cọc", color: "#2E7D4F" },
    { id: "cancelled", label: "Đã hủy", color: "#8A3B32" },
  ];

  const CATEGORIES = [
    { slug: "leu", name: "Lều", desc: "Lều cắm trại, lều che nắng, lều gia đình" },
    { slug: "tui-ngu", name: "Túi ngủ", desc: "Túi ngủ mùa đông, siêu nhẹ, phong bì" },
    { slug: "sup", name: "SUP", desc: "Ván chèo đứng bơm hơi" },
    { slug: "bep", name: "Bếp và dụng cụ ăn uống", desc: "Bếp gas, bếp nướng, bộ nấu ăn" },
  ];

  const COLOR_HEX = {
    "xanh rêu": "#4F7A61", "xanh dương": "#2F6DB5", "xanh lá": "#3E8E41", "kaki": "#C3AE8A",
    "red": "#C0392B", "mint": "#8FD3C1", "ghi": "#8E9194", "cam": "#E07B39", "nâu": "#7B4B2A",
    "đen": "#2E3131", "vàng": "#E8B931", "trắng": "#FFFFFF",
  };

  const esc = (s) => String(s ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
  const vnd = (n) => (n == null || isNaN(n) ? "—" : Number(n).toLocaleString("vi-VN") + " đ");
  const cleanName = (name) => String(name).replace(/\s+[-–]\s*\d{3,5}\s*$/, "").trim();
  const images = (variant) => (variant?.link_anh || "").split(";").map((s) => s.trim()).filter(Boolean);
  const catBySlug = (slug) => CATEGORIES.find((c) => c.slug === slug);
  const catByName = (name) => CATEGORIES.find((c) => c.name === name);
  const byId = (id) => PRODUCTS.find((p) => p.ma_sp === id);
  const hasColors = (p) => p.variants.some((v) => v.mau_sac);
  const minPrice = (p) => Math.min(...p.variants.map((v) => Number(v.gia_goc) || Infinity));
  const rentPrice = (p) => RENT_PRICE_PER_DAY[p?.ma_sp] ?? null;
  const variantBySku = (sku) => {
    for (const p of PRODUCTS) {
      const v = p.variants.find((x) => x.ma_bien_the === sku);
      if (v) return { product: p, variant: v };
    }
    return null;
  };

  const YT_RE = /(?:youtube\.com\/(?:watch\?v=|embed\/)|youtu\.be\/)([\w-]{11})/;
  const parseMedia = (url) => {
    const m = String(url).match(YT_RE);
    if (m) {
      return { type: "video", src: url, id: m[1], thumb: `https://i.ytimg.com/vi/${m[1]}/hqdefault.jpg`, embed: `https://www.youtube.com/embed/${m[1]}` };
    }
    return { type: "image", src: url, thumb: url };
  };
  const mediaOf = (variant) => images(variant).map(parseMedia);

  const parseSpecs = (s) =>
    String(s || "").split(";").map((x) => x.trim()).filter(Boolean).map((x) => {
      const i = x.indexOf(":");
      return i < 0 ? ["", x] : [x.slice(0, i).trim(), x.slice(i + 1).trim()];
    });

  const colorStyle = (name) => {
    const parts = String(name).toLowerCase().split("/").map((s) => s.trim());
    const hex = parts.map((p) => COLOR_HEX[p] || "#D9D4CC");
    return hex.length > 1
      ? `background: linear-gradient(135deg, ${hex[0]} 50%, ${hex[1]} 50%)`
      : `background: ${hex[0]}`;
  };

  const DATE_KEY = "wanderent_dates";
  const CART_KEY = "wanderent_cart";
  const ORDERS_KEY = "wanderent_orders";
  const USERS_KEY = "wanderent_users";
  const SESSION_KEY = "wanderent_session";
  const SEED_KEY = "wanderent_seed_v2";

  const toISO = (d) => {
    const x = d instanceof Date ? d : new Date(d);
    const y = x.getFullYear();
    const m = String(x.getMonth() + 1).padStart(2, "0");
    const day = String(x.getDate()).padStart(2, "0");
    return `${y}-${m}-${day}`;
  };
  const todayISO = () => toISO(new Date());
  const addDaysISO = (iso, n) => { const d = new Date(iso + "T12:00:00"); d.setDate(d.getDate() + n); return toISO(d); };
  const defaultDates = () => {
    const from = addDaysISO(todayISO(), 1);
    return { from, to: addDaysISO(from, 2) };
  };
  const getDates = () => {
    try {
      const d = JSON.parse(localStorage.getItem(DATE_KEY));
      if (d && d.from && d.to) return d;
    } catch (e) { /* bỏ qua */ }
    return defaultDates();
  };
  const setDates = (d) => { try { localStorage.setItem(DATE_KEY, JSON.stringify(d)); } catch (e) { /* bỏ qua */ } };
  const daysBetween = (from, to) => Math.max(1, Math.round((new Date(to + "T12:00:00") - new Date(from + "T12:00:00")) / 86400000));
  const isPastDate = (iso) => iso < todayISO();
  const fmtDate = (iso) => {
    if (!iso) return "—";
    const [y, m, d] = iso.split("-");
    return `${d}/${m}/${y}`;
  };

  const loadJSON = (key, fallback) => {
    try { return JSON.parse(localStorage.getItem(key)) ?? fallback; } catch (e) { return fallback; }
  };
  const saveJSON = (key, val) => { try { localStorage.setItem(key, JSON.stringify(val)); } catch (e) { /* bỏ qua */ } };

  const stockCap = (p) => STOCK_BY_CAT[p.danh_muc] || 3;

  const blockingStatuses = new Set(["deposit_pending", "confirmed", "ready", "picked_up"]);
  const datesOverlap = (aFrom, aTo, bFrom, bTo) => aFrom < bTo && bFrom < aTo;

  const bookedQty = (sku, from, to, exceptOrderId) => {
    let n = 0;
    for (const o of getOrders()) {
      if (o.id === exceptOrderId) continue;
      if (!blockingStatuses.has(o.status)) continue;
      if (!datesOverlap(from, to, o.from, o.to)) continue;
      for (const it of o.items || []) {
        if (it.ma_bien_the === sku) n += Number(it.qty) || 0;
      }
    }
    return n;
  };

  const availableQty = (sku, from, to, exceptOrderId) => {
    const found = variantBySku(sku);
    if (!found) return 0;
    return Math.max(0, stockCap(found.product) - bookedQty(sku, from, to, exceptOrderId));
  };

  const getCart = () => {
    const cart = loadJSON(CART_KEY, []);
    cart.forEach((x, i) => { if (!x.id) x.id = "c" + Date.now() + "-" + i; });
    return cart;
  };
  const setCart = (cart) => { saveJSON(CART_KEY, cart); updateCartCount(); };
  const cartQty = () => getCart().reduce((s, it) => s + (Number(it.qty) || 0), 0);
  const addToCart = (item) => {
    const cart = getCart();
    const i = cart.findIndex((x) => x.ma_bien_the === item.ma_bien_the && x.from === item.from && x.to === item.to);
    if (i >= 0) cart[i].qty = (Number(cart[i].qty) || 0) + Number(item.qty);
    else cart.push({ ...item, id: "c" + Date.now() });
    setCart(cart);
    return cart;
  };
  const updateCartItem = (id, patch) => {
    setCart(getCart().map((x) => (x.id === id || x.ma_bien_the + x.from === id ? { ...x, ...patch } : x)));
  };
  const removeFromCart = (id) => setCart(getCart().filter((x) => x.id !== id && x.ma_bien_the + x.from !== id));
  const clearCart = () => setCart([]);
  const updateCartCount = () => {
    document.querySelectorAll("[data-cart-count]").forEach((el) => {
      const n = cartQty();
      el.textContent = n;
      el.hidden = n === 0;
    });
  };

  const lineTotals = (item) => {
    const found = variantBySku(item.ma_bien_the);
    if (!found) return { days: 1, rent: 0, deposit: 0, value: 0, name: item.ma_bien_the };
    const days = daysBetween(item.from, item.to);
    const qty = Number(item.qty) || 1;
    const rentDay = rentPrice(found.product) || 0;
    const value = Number(found.variant.gia_goc) || 0;
    return {
      days, qty, rentDay,
      rent: rentDay * days * qty,
      deposit: Math.round(value * DEPOSIT_RATE) * qty,
      value,
      name: cleanName(found.product.ten_sp),
      color: found.variant.mau_sac,
      product: found.product,
      variant: found.variant,
    };
  };

  const cartTotals = (cart = getCart(), delivery = false) => {
    const lines = cart.map(lineTotals);
    const rent = lines.reduce((s, x) => s + x.rent, 0);
    const deposit = lines.reduce((s, x) => s + x.deposit, 0);
    const ship = delivery ? DELIVERY_FEE : 0;
    return { lines, rent, deposit, ship, todayPay: deposit + ship, days: lines[0]?.days || daysBetween(getDates().from, getDates().to) };
  };

  const comboPrice = (combo) => {
    const rentDay = combo.items.reduce((s, [id, qty]) => s + (rentPrice(byId(id)) || 0) * qty, 0);
    const raw = rentDay;
    const discounted = Math.round(raw * (1 - COMBO_DISCOUNT) / 1000) * 1000;
    return { rentDay: raw, rentDaySale: discounted };
  };

  const validateRental = ({ sku, from, to, qty, extraQty = 0, ignoreCartId }) => {
    if (!from || !to) return { ok: false, error: "Hãy chọn ngày nhận và ngày trả." };
    if (isPastDate(from)) return { ok: false, error: "Ngày nhận không được ở trong quá khứ. Hãy chọn từ hôm nay trở đi." };
    if (to <= from) return { ok: false, error: "Ngày trả phải sau ngày nhận." };
    const q = Number(qty);
    if (!Number.isFinite(q) || q < 1) return { ok: false, error: "Số lượng thuê tối thiểu là 1. Đã chỉnh lại giúp bạn." };
    const avail = availableQty(sku, from, to);
    const already = getCart()
      .filter((x) => x.id !== ignoreCartId && x.ma_bien_the === sku && datesOverlap(from, to, x.from, x.to))
      .reduce((s, x) => s + (Number(x.qty) || 0), 0);
    const left = avail - already + extraQty;
    if (q > left) {
      return {
        ok: false,
        error: left <= 0
          ? `Món này đã hết trong ${fmtDate(from)} – ${fmtDate(to)}. Hãy chọn ngày khác hoặc thiết bị tương tự.`
          : `Chỉ còn ${left} món trống trong khoảng ngày này.`,
        available: left,
      };
    }
    return { ok: true, available: left };
  };

  const getUsers = () => {
    const users = loadJSON(USERS_KEY, []);
    if (!users.some((u) => u.email === "admin@wanderent.vn")) {
      users.push({ email: "admin@wanderent.vn", name: "Quản trị WANDERENT", phone: STORE.phone, password: "wanderent", role: "admin" });
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
  const registerUser = ({ name, email, phone, password }) => {
    const users = getUsers();
    email = String(email || "").trim().toLowerCase();
    if (!name || !email || !password) return { ok: false, error: "Điền đầy đủ họ tên, email và mật khẩu." };
    if (users.some((u) => u.email === email)) return { ok: false, error: "Email này đã có tài khoản." };
    const user = { email, name: name.trim(), phone: (phone || "").trim(), password, role: "customer" };
    users.push(user); saveJSON(USERS_KEY, users); setSession(user);
    return { ok: true, user };
  };
  const loginUser = (email, password) => {
    const user = getUsers().find((u) => u.email === String(email || "").trim().toLowerCase() && u.password === password);
    if (!user) return { ok: false, error: "Email hoặc mật khẩu chưa đúng." };
    setSession(user);
    return { ok: true, user };
  };
  const logoutUser = () => setSession(null);

  const getOrders = () => loadJSON(ORDERS_KEY, []);
  const saveOrders = (list) => saveJSON(ORDERS_KEY, list);
  const nextOrderCode = () => {
    const n = getOrders().length + 1;
    return "WR-" + todayISO().replace(/-/g, "") + "-" + String(n).padStart(3, "0");
  };
  const createOrder = (payload) => {
    const order = {
      id: nextOrderCode(),
      createdAt: new Date().toISOString(),
      status: payload.status || "deposit_pending",
      refundStatus: "pending",
      ...payload,
    };
    const list = getOrders(); list.unshift(order); saveOrders(list);
    return order;
  };
  const updateOrder = (id, patch) => {
    const list = getOrders().map((o) => (o.id === id ? { ...o, ...patch, updatedAt: new Date().toISOString() } : o));
    saveOrders(list);
    return list.find((o) => o.id === id);
  };
  const statusMeta = (id) => ORDER_STATUSES.find((s) => s.id === id) || { id, label: id, color: "#5E6462" };

  const seedDemo = () => {
    if (loadJSON(SEED_KEY, false)) return;
    getUsers();
    if (!getOrders().length) {
      const from = addDaysISO(todayISO(), 5);
      const to = addDaysISO(from, 3);
      saveOrders([
        {
          id: "WR-DEMO-001", createdAt: new Date().toISOString(), status: "confirmed", refundStatus: "held",
          customer: { name: "Ngô Minh Anh", email: "anh@gmail.com", phone: "0912 345 678" },
          fulfill: "pickup", address: STORE.address, note: "Nhận lúc 9:00",
          from, to, payMethod: "momo",
          items: [{ ma_bien_the: "LEU01_XANH_REU", qty: 1, from, to }],
          totals: { rent: 50000 * 3, deposit: Math.round(790000 * 0.3), ship: 0, todayPay: Math.round(790000 * 0.3) },
        },
        {
          id: "WR-DEMO-002", createdAt: new Date().toISOString(), status: "picked_up", refundStatus: "held",
          customer: { name: "Trần Gia Huy", email: "huy@gmail.com", phone: "0987 111 222" },
          fulfill: "delivery", address: "12 Nguyễn Huệ, Q.1, TP.HCM", note: "",
          from: addDaysISO(todayISO(), -1), to: addDaysISO(todayISO(), 2), payMethod: "transfer",
          items: [{ ma_bien_the: "SUP02_MACDINH", qty: 1, from: addDaysISO(todayISO(), -1), to: addDaysISO(todayISO(), 2) }],
          totals: { rent: 380000 * 3, deposit: Math.round(11690000 * 0.3), ship: DELIVERY_FEE, todayPay: Math.round(11690000 * 0.3) + DELIVERY_FEE },
        },
        {
          id: "WR-DEMO-003", createdAt: new Date().toISOString(), status: "refunded", refundStatus: "done",
          customer: { name: "Lê Phương", email: "phuong@gmail.com", phone: "0909 888 777" },
          fulfill: "pickup", address: STORE.address, note: "",
          from: addDaysISO(todayISO(), -10), to: addDaysISO(todayISO(), -7), payMethod: "card",
          items: [{ ma_bien_the: "TUINGU05_CAM", qty: 2, from: addDaysISO(todayISO(), -10), to: addDaysISO(todayISO(), -7) }],
          totals: { rent: 35000 * 3 * 2, deposit: Math.round(585000 * 0.3) * 2, ship: 0, todayPay: Math.round(585000 * 0.3) * 2 },
        },
      ]);
    }
    saveJSON(SEED_KEY, true);
  };

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
  };
  const icon = (name, cls = "icon") => `<svg class="${cls}" viewBox="0 0 24 24" aria-hidden="true">${ICONS[name] || ""}</svg>`;

  const productCard = (p) => {
    const v = p.variants[0];
    const img = mediaOf(v)[0];
    const thumb = img ? (img.thumb || img.src) : "";
    const colors = p.variants.filter((x) => x.mau_sac);
    const url = `product.html?id=${encodeURIComponent(p.ma_sp)}`;
    const rent = rentPrice(p);
    const dates = getDates();
    const avail = availableQty(v.ma_bien_the, dates.from, dates.to);
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
            ${colors.length ? "" : "&nbsp;"}
          </div>
          <div class="card-price">
            <span class="rent-price">${vnd(rent)} <small>/ ngày</small></span>
            <span class="value-price">Giá trị sản phẩm: ${vnd(minPrice(p))} · Cọc 30%: ${vnd(Math.round(minPrice(p) * DEPOSIT_RATE))}</span>
            <span class="stock-line ${avail ? "ok" : "out"}">${avail ? "Còn " + avail + " món" : "Hết hàng"} trong ngày đã chọn</span>
          </div>
          <div class="card-actions">
            <a class="btn btn-outline" href="${url}">Chi tiết</a>
            <a class="btn btn-primary" href="${url}#dat-thue">${icon("calendar")}Thuê</a>
          </div>
        </div>
      </article>`;
  };

  const renderHeader = (active) => {
    const el = document.getElementById("site-header");
    if (!el) return;
    const count = (name) => PRODUCTS.filter((p) => p.danh_muc === name).length;
    const user = currentUser();
    el.className = "site-header";
    el.innerHTML = `
      <div class="container header-inner">
        <a class="logo" href="index.html" aria-label="WANDERENT – về trang chủ">
          <img src="assets/img/logo.png" alt="WANDERENT" width="156" height="52">
        </a>
        <nav class="main-nav" id="main-nav" aria-label="Điều hướng chính">
          <a href="index.html" class="${active === "home" ? "active" : ""}">Trang chủ</a>
          <div class="nav-drop">
            <button type="button" aria-haspopup="true" class="${active === "products" ? "active" : ""}">Thuê thiết bị ${icon("chevron")}</button>
            <div class="drop-menu">
              <a href="products.html">Tất cả thiết bị <small>${PRODUCTS.length}</small></a>
              ${CATEGORIES.map((c) => `<a href="products.html?dm=${c.slug}">${c.name} <small>${count(c.name)}</small></a>`).join("")}
            </div>
          </div>
          <a href="index.html#combo">Combo chuyến đi</a>
          <a href="index.html#quy-trinh">Hướng dẫn thuê</a>
        </nav>
        <div class="header-actions">
          <button class="icon-btn" type="button" aria-label="Tìm kiếm" aria-expanded="false" data-search-toggle>${icon("search")}</button>
          <a class="icon-btn" href="account.html" aria-label="${user ? "Tài khoản " + user.name : "Tài khoản"}">${icon("user")}</a>
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
            <p>Nền tảng cho thuê thiết bị cắm trại &amp; outdoor trực tuyến: chọn ngày, đặt đồ, kiểm tra tồn kho theo ngày,
              thuê combo theo chuyến đi, đặt cọc và tự động hoàn cọc, cho giới trẻ TP.HCM.</p>
            <div class="socials">
              <a href="${STORE.facebook}" target="_blank" rel="noopener" aria-label="Facebook">${icon("facebook")}</a>
              <a href="${STORE.instagram}" target="_blank" rel="noopener" aria-label="Instagram">${icon("instagram")}</a>
              <a href="${STORE.youtube}" target="_blank" rel="noopener" aria-label="YouTube">${icon("youtube")}</a>
            </div>
          </div>
          <div>
            <h4>Thuê thiết bị</h4>
            <ul class="footer-links">
              ${CATEGORIES.map((c) => `<li><a href="products.html?dm=${c.slug}">${c.name}</a></li>`).join("")}
              <li><a href="index.html#combo">Combo chuyến đi</a></li>
            </ul>
          </div>
          <div>
            <h4>Hỗ trợ</h4>
            <ul class="footer-links">
              <li><a href="index.html#quy-trinh">Hướng dẫn thuê đồ</a></li>
              <li><a href="deposit.html">Chính sách đặt cọc 30%</a></li>
              <li><a href="refund.html">Hoàn cọc tự động</a></li>
              <li><a href="care.html">Vệ sinh &amp; bảo quản đồ</a></li>
              <li><a href="faq.html">Câu hỏi thường gặp</a></li>
              <li><a href="inventory.html">Tồn kho theo ngày</a></li>
            </ul>
          </div>
          <div>
            <h4>Liên hệ</h4>
            <ul class="footer-links">
              <li>${icon("pin")}<span>${esc(STORE.address)}</span></li>
              <li>${icon("phone")}<a href="tel:+84901234567">${esc(STORE.phone)}</a></li>
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
    toastTimer = setTimeout(() => el.classList.remove("show"), 3200);
  };

  const hydrateIcons = (root = document) => {
    root.querySelectorAll("[data-icon]").forEach((el) => {
      el.insertAdjacentHTML("afterbegin", icon(el.dataset.icon)); el.removeAttribute("data-icon");
    });
    root.querySelectorAll("[data-icon-after]").forEach((el) => {
      el.insertAdjacentHTML("beforeend", icon(el.dataset.iconAfter)); el.removeAttribute("data-icon-after");
    });
  };

  const initPage = (active) => { seedDemo(); renderHeader(active); renderFooter(); hydrateIcons(); };

  window.WR = {
    hydrateIcons, initPage,
    PRODUCTS, CATEGORIES, DEPOSIT_RATE, DELIVERY_FEE, LATE_FEE_PER_DAY, COMBOS, STORE, ORDER_STATUSES,
    esc, vnd, cleanName, images, mediaOf, parseMedia, catBySlug, catByName, byId, hasColors, minPrice, rentPrice,
    parseSpecs, colorStyle, getDates, setDates, daysBetween, toISO, todayISO, addDaysISO, isPastDate, fmtDate,
    addToCart, getCart, setCart, removeFromCart, clearCart, cartTotals, lineTotals, cartQty,
    availableQty, stockCap, validateRental, comboPrice, variantBySku,
    getOrders, createOrder, updateOrder, statusMeta, currentUser, registerUser, loginUser, logoutUser, seedDemo,
    icon, productCard, renderHeader, renderFooter, toast,
  };
})();
