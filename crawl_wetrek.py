#!/usr/bin/env python3
"""
Crawl dữ liệu sản phẩm mẫu từ wetrek.vn cho website demo WANDERENT
(đồ án môn TMĐT, không dùng thương mại).

Cách chạy:
    .venv/bin/python crawl_wetrek.py --test 2     # chạy thử 2 sản phẩm, in kết quả
    .venv/bin/python crawl_wetrek.py              # chạy toàn bộ (tối đa 30 SP)

Đầu ra (thư mục output/):
    products.csv, variants.csv, products.json, errors.log

Nguyên tắc lịch sự / robots.txt:
    - Nghỉ 5 giây trước MỖI request (kể cả request AJAX lấy biến thể).
    - Không truy cập URL có tham số filterId, promotion, search, s, q.
    - Không dùng ô tìm kiếm / bộ lọc.
    - Danh sách SP lấy từ trang danh mục, chỉ giữ link CÓ trong sitemap sản phẩm.
    - Không tải ảnh, chỉ lưu link.
"""

import argparse
import csv
import json
import logging
import re
import sys
import time
import unicodedata
from pathlib import Path
from urllib.parse import urljoin, urlparse, parse_qs

import requests
from bs4 import BeautifulSoup

# ---------------------------------------------------------------------------
# CẤU HÌNH
# ---------------------------------------------------------------------------
BASE = "https://wetrek.vn"
SITEMAP_INDEX = f"{BASE}/sitemap_index.xml"
# Endpoint AJAX mà trang chi tiết gọi khi khách bấm chọn màu (xem /js/product.min.js,
# hàm LoadProductInfo). Trả về JSON dạng mảng:
#   [0] HTML danh sách ảnh của biến thể (giống #ListImagePreview)
#   [1] HTML khối giá (giống .pro-price)
#   [2] variantId   [3] SKU   [4] tồn kho   [5..7] HTML nút bấm / cửa hàng
VARIANT_AJAX = f"{BASE}/cms/display/Ajax/Product.aspx"

DELAY_SECONDS = 5
MAX_TOTAL = 30
MAX_IMAGES_PER_VARIANT = 3
USER_AGENT = "Mozilla/5.0 (compatible; WANDERENT-student-crawler/1.0; educational project)"

# Tham số bị cấm theo robots.txt / brief
FORBIDDEN_PARAMS = {"filterId", "promotion", "search", "s", "q"}

# Danh mục cần crawl. `include` là regex (không phân biệt hoa thường) áp lên TÊN SP
# để chỉ giữ đúng loại hàng (vd. trang "Lều - Phụ kiện lều" có cả cọc, dây, tăng...).
CATEGORIES = [
    {
        "danh_muc": "Lều",
        "prefix": "LEU",
        "quota": 8,
        "urls": [f"{BASE}/san-pham/leu-trai-va-phu-kien-leu-trai.htm"],
        "include": r"^\s*lều",
    },
    {
        "danh_muc": "Túi ngủ",
        "prefix": "TUINGU",
        "quota": 8,
        "urls": [f"{BASE}/san-pham/tui-ngu.htm"],
        "include": r"túi ngủ",
    },
    {
        "danh_muc": "SUP",
        "prefix": "SUP",
        "quota": 6,   # trang nguồn chỉ có 6 tấm ván (còn lại là dây, bơm, vây, túi)
        "urls": [f"{BASE}/san-pham/van-cheo-dung-sup.htm"],
        "include": r"^\s*ván",  # chỉ lấy ván, bỏ dây buộc chân / bơm / phụ kiện
    },
    {
        "danh_muc": "Bếp và dụng cụ ăn uống",
        "prefix": "BEP",
        "quota": 8,   # +1 bù cho SUP để đủ 30 sản phẩm
        "urls": [
            f"{BASE}/san-pham/bep-da-ngoai.htm",
            f"{BASE}/san-pham/dung-cu-nau-an.htm",
        ],
        # Bỏ bình/lon gas (hàng tiêu hao, không cho thuê)
        "include": r"^(?!.*\b(bình|lon|đầu)\s+gas\b).*",
    },
]

# Từ khoá loại trừ chung (combo không crawl theo brief mục 9)
EXCLUDE_NAME = re.compile(r"combo", re.I)

# Từ khoá nhận diện dòng thông số cần lấy (bảng trong tab "Đặc tính")
SPEC_KEYWORDS = re.compile(
    r"kích thước|đóng gói|gấp gọn|trọng lượng|khối lượng|sức chứa|số người|dung tích|tải trọng",
    re.I,
)

ROOT = Path(__file__).resolve().parent
OUT_DIR = ROOT / "output"

log = logging.getLogger("crawl")


# ---------------------------------------------------------------------------
# HTTP lịch sự
# ---------------------------------------------------------------------------
class PoliteClient:
    def __init__(self, delay=DELAY_SECONDS):
        self.s = requests.Session()
        self.s.headers.update({"User-Agent": USER_AGENT, "Accept-Language": "vi,en;q=0.8"})
        self.delay = delay
        self._last = 0.0
        self.count = 0

    @staticmethod
    def check_allowed(url):
        qs = parse_qs(urlparse(url).query, keep_blank_values=True)
        bad = FORBIDDEN_PARAMS.intersection(qs)
        if bad:
            raise ValueError(f"URL chứa tham số bị cấm {bad}: {url}")

    def _wait(self):
        wait = self.delay - (time.time() - self._last)
        if wait > 0:
            time.sleep(wait)
        self._last = time.time()
        self.count += 1

    def get(self, url):
        self.check_allowed(url)
        self._wait()
        log.debug("GET %s", url)
        r = self.s.get(url, timeout=30)
        r.raise_for_status()
        r.encoding = "utf-8"
        return r.text

    def post_variant(self, item_id, val, referer):
        self._wait()
        log.debug("POST LoadProductInfo id=%s val=%s", item_id, val)
        r = self.s.post(
            VARIANT_AJAX,
            data={"action": "LoadProductInfo", "id": item_id, "val": val},
            headers={"X-Requested-With": "XMLHttpRequest", "Referer": referer},
            timeout=30,
        )
        r.raise_for_status()
        return r.json()


# ---------------------------------------------------------------------------
# Tiện ích
# ---------------------------------------------------------------------------
def abs_url(u):
    """Ghép tên miền nếu là đường dẫn tương đối, ép https."""
    if not u:
        return None
    u = u.strip()
    if u.startswith("//"):
        u = "https:" + u
    u = urljoin(BASE + "/", u)
    if u.startswith("http://"):
        u = "https://" + u[len("http://"):]
    return u if u.startswith("https://") else None


def parse_price(text):
    """'3.150.000 đ' -> 3150000"""
    if not text:
        return None
    digits = re.sub(r"[^\d]", "", text)
    return int(digits) if digits else None


def slug_upper(text):
    """'Xanh rêu' -> 'XANH_REU' (viết hoa, không dấu)."""
    t = text.replace("đ", "d").replace("Đ", "D")
    t = unicodedata.normalize("NFD", t)
    t = "".join(c for c in t if unicodedata.category(c) != "Mn")
    t = re.sub(r"[^A-Za-z0-9]+", "_", t).strip("_")
    return t.upper() or "KHAC"


def clean_text(s):
    s = re.sub(r"[ \t\xa0]+", " ", s)
    s = re.sub(r"\n\s*\n+", "\n", s)
    return s.strip()


def images_from_gallery(soup_or_html):
    """
    SELECTOR ẢNH: khung ảnh sản phẩm `#ListImagePreview a.item`
    - a[href]  = ảnh gốc kích thước lớn nhất (ưu tiên)
    - img[data-src] / img[srcset] / img[src] = dự phòng nếu không có href (lazy load)
    Response AJAX biến thể trả về đúng cấu trúc các thẻ <a class="item"> này.
    """
    soup = soup_or_html
    if isinstance(soup_or_html, str):
        soup = BeautifulSoup(soup_or_html, "lxml")
    container = soup.select_one("#ListImagePreview") or soup
    out = []
    for a in container.select("a.item"):
        url = a.get("href")
        if not url or url.startswith("javascript"):
            img = a.find("img")
            if img:
                url = img.get("data-src")
                if not url and img.get("srcset"):
                    # lấy ứng viên cuối (thường là lớn nhất)
                    url = img["srcset"].split(",")[-1].strip().split(" ")[0]
                url = url or img.get("src")
        url = abs_url(url)
        if url and url not in out:
            out.append(url)
    return out[:MAX_IMAGES_PER_VARIANT]


def price_from_html(soup_or_html):
    """
    SELECTOR GIÁ: `.price b` trong khối `.pro-price` ("Giá bán: <b>3.150.000 đ</b>").
    Nếu có giá gạch (giá gốc trước khuyến mãi) thì ưu tiên lấy giá gạch.
    """
    soup = soup_or_html
    if isinstance(soup_or_html, str):
        soup = BeautifulSoup(soup_or_html, "lxml")
    box = soup.select_one(".pro-price") or soup
    for sel in ("del", "s", ".old-price", ".price-old"):  # giá gạch (nếu có)
        el = box.select_one(sel)
        if el and parse_price(el.get_text()):
            return parse_price(el.get_text())
    el = box.select_one(".price b")
    return parse_price(el.get_text()) if el else None


# ---------------------------------------------------------------------------
# Sitemap & danh mục
# ---------------------------------------------------------------------------
def load_sitemap_products(client):
    """Đọc sitemap_index.xml -> sitemap/san-pham.xml -> tập link sản phẩm."""
    idx = BeautifulSoup(client.get(SITEMAP_INDEX), "xml")
    product_maps = [l.text.strip() for l in idx.find_all("loc") if "san-pham" in l.text and "danh-muc" not in l.text]
    urls = set()
    for sm in product_maps:
        sx = BeautifulSoup(client.get(sm), "xml")
        urls.update(l.text.strip() for l in sx.find_all("loc"))
    log.info("Sitemap: %d link sản phẩm", len(urls))
    return urls


def parse_category(html):
    """
    SELECTOR DANH MỤC: mỗi sản phẩm là `div.group_items div.item`
      - link chi tiết : `a.wImage[href]`  (dự phòng: thuộc tính data-cmp-url của div.item)
      - tên           : `h3.title`        (dự phòng: data-cmp-name)
    Trang không phân trang: toàn bộ SP đã nằm sẵn trong HTML.
    """
    soup = BeautifulSoup(html, "lxml")
    out, seen = [], set()
    for it in soup.select("div.group_items div.item"):
        a = it.select_one("a.wImage[href]")
        url = abs_url(a["href"] if a else it.get("data-cmp-url"))
        t = it.select_one("h3.title")
        name = t.get_text(strip=True) if t else (it.get("data-cmp-name") or "")
        if url and url not in seen:
            seen.add(url)
            out.append((url, name))
    return out


def collect_candidates(client, cat, sitemap_urls):
    """Danh sách ứng viên (url, tên) của 1 danh mục, đã lọc; xen kẽ nếu có nhiều trang."""
    include = re.compile(cat["include"], re.I)
    lists = []
    for u in cat["urls"]:
        try:
            items = parse_category(client.get(u))
        except Exception as e:
            log.error("Lỗi trang danh mục %s: %s", u, e)
            continue
        kept = []
        for url, name in items:
            if url not in sitemap_urls:
                log.debug("Bỏ (không có trong sitemap): %s", url)
            elif EXCLUDE_NAME.search(name):
                log.debug("Bỏ (combo): %s", name)
            elif not include.search(name):
                log.debug("Bỏ (không đúng loại): %s", name)
            else:
                kept.append((url, name))
        log.info("  %s: %d item, giữ %d", u, len(items), len(kept))
        lists.append(kept)
    # xen kẽ các danh sách để danh mục ghép (Bếp + Dụng cụ nấu ăn) có đủ cả hai loại
    merged, seen = [], set()
    for i in range(max((len(l) for l in lists), default=0)):
        for l in lists:
            if i < len(l) and l[i][0] not in seen:
                seen.add(l[i][0])
                merged.append(l[i])
    return merged


# ---------------------------------------------------------------------------
# Trang chi tiết
# ---------------------------------------------------------------------------
def parse_detail(html, url):
    """
    SELECTOR TRANG CHI TIẾT:
      - tên        : `h1.tensp`                        (dự phòng: JSON-LD Product.name)
      - item id    : `input#hdItemId[value]`           (dùng cho AJAX biến thể)
      - giá        : `.pro-price .price b`             (dự phòng: JSON-LD offers.price)
      - ảnh        : `#ListImagePreview a.item[href]`
      - thông số   : bảng trong `#tabcontent2` (tab "Đặc tính"), mỗi `tr` = [tên, giá trị]
      - mô tả      : `#tabcontent1` (tab "Chi tiết")   (dự phòng: `.khoi1 .des`)
      - nhóm biến thể: `form#DatHang .variants` -> `label` (vd "Màu sắc:") + `.list button`
      - JSON biến thể: `<script>window.wtVariants=[{"v1":..,"v2":..,"inv":..}]` (chỉ có
        tên biến thể + tồn kho, KHÔNG có giá/ảnh -> giá/ảnh lấy qua AJAX LoadProductInfo)
    """
    soup = BeautifulSoup(html, "lxml")

    # JSON-LD Product (dự phòng cho tên / giá / mô tả ngắn)
    ld = {}
    for sc in soup.find_all("script", type="application/ld+json"):
        try:
            d = json.loads(sc.string or "")
        except Exception:
            continue
        if isinstance(d, dict) and d.get("@type") == "Product":
            ld = d
            break

    h1 = soup.select_one("h1.tensp")
    name = h1.get_text(strip=True) if h1 else ld.get("name", "")

    item_id_el = soup.select_one("input#hdItemId")
    item_id = item_id_el.get("value") if item_id_el else None

    price = price_from_html(soup)
    if price is None:
        try:
            price = int(float(ld["offers"]["price"]))
        except Exception:
            price = None

    images = images_from_gallery(soup)
    if not images and ld.get("image"):
        imgs = ld["image"] if isinstance(ld["image"], list) else [ld["image"]]
        images = [abs_url(i) for i in imgs if abs_url(i)][:MAX_IMAGES_PER_VARIANT]

    # --- Thông số (tab Đặc tính) ---
    specs_all, specs = [], []
    tab2 = soup.select_one("#tabcontent2")
    if tab2:
        for tr in tab2.select("tr"):
            tds = tr.find_all(["td", "th"])
            if len(tds) < 2:
                continue
            k = clean_text(tds[0].get_text(" ", strip=True)).rstrip(":")
            v = clean_text(tds[1].get_text(", ", strip=True))
            if not k or not v:
                continue
            specs_all.append(f"{k}: {v}")
            if SPEC_KEYWORDS.search(k):
                specs.append(f"{k}: {v}")

    # --- Mô tả (tab Chi tiết) ---
    mo_ta = ""
    tab1 = soup.select_one("#tabcontent1")
    if tab1:
        mo_ta = clean_text(tab1.get_text("\n", strip=True))
        # bỏ câu quảng cáo cuối "Xem thêm các sản phẩm ... tại WeTrek.vn"
        mo_ta = re.split(r"\n?Xem thêm các sản phẩm", mo_ta)[0].strip()
    if not mo_ta:
        des = soup.select_one(".khoi1 .des")
        mo_ta = des.get_text(" ", strip=True) if des else ld.get("description", "")

    # Dự phòng: một số trang để trống tab Đặc tính, thông số nằm trong mô tả
    # dạng dòng "Kích thước gấp gọn: 30 x 20 cm"
    if not specs and not specs_all:
        for line in mo_ta.split("\n"):
            k, sep, v = line.partition(":")
            if sep and v.strip() and len(line) <= 150 and SPEC_KEYWORDS.search(k):
                specs.append(f"{k.strip()}: {v.strip()}")
    thong_so = "; ".join(specs or specs_all)

    # --- Nhóm biến thể ---
    groups = []
    for g in soup.select("form#DatHang .variants"):
        lab = g.find("label")
        groups.append({
            "label": lab.get_text(strip=True).rstrip(":") if lab else "",
            "values": [b.get_text(strip=True) for b in g.select(".list button")],
        })
    wt = []
    m = re.search(r"window\.wtVariants\s*=\s*(\[.*?\]);", html, re.S)
    if m:
        try:
            wt = json.loads(m.group(1))
        except Exception:
            wt = []

    return {
        "name": name,
        "item_id": item_id,
        "price": price,
        "images": images,
        "thong_so": thong_so,
        "mo_ta": mo_ta,
        "groups": groups,
        "wtVariants": wt,
    }


def variant_val_for_color(color, color_idx, groups, wt):
    """
    Tạo chuỗi `val` gửi AJAX (các giá trị đang chọn nối bằng '|||', theo thứ tự nhóm).
    Nếu SP có thêm nhóm khác (vd Size), chọn tổ hợp còn hàng đầu tiên từ wtVariants.
    """
    if len(groups) == 1:
        return color
    key = "v1" if color_idx == 0 else "v2"
    other = "v2" if key == "v1" else "v1"
    combos = [w for w in wt if (w.get(key) or "").strip() == color]
    combos.sort(key=lambda w: -(int(w.get("inv") or 0) > 0))
    other_val = (combos[0].get(other) if combos else None) or groups[1 - color_idx]["values"][0]
    vals = [None, None]
    vals[color_idx] = color
    vals[1 - color_idx] = other_val.strip()
    return "|||".join(vals[: len(groups)])


def build_variants(client, detail, url, ma_sp):
    groups = detail["groups"]
    color_idx = next((i for i, g in enumerate(groups) if "màu" in g["label"].lower()), None)

    # Không có nhóm màu -> 1 dòng MACDINH
    if color_idx is None or not groups[color_idx]["values"]:
        return [{
            "ma_bien_the": f"{ma_sp}_MACDINH",
            "ma_sp": ma_sp,
            "mau_sac": "",
            "gia_goc": detail["price"],
            "link_anh": ";".join(detail["images"]),
        }]

    rows, used = [], set()
    for color in groups[color_idx]["values"]:
        price, images = detail["price"], detail["images"]
        try:
            val = variant_val_for_color(color, color_idx, groups, detail["wtVariants"])
            res = client.post_variant(detail["item_id"], val, url)
            imgs = images_from_gallery(res[0]) if res and res[0] else []
            p = price_from_html(res[1]) if len(res) > 1 and res[1] else None
            images = imgs or images   # màu không có ảnh riêng -> dùng ảnh chung (brief 6.2.2)
            price = p if p is not None else price
        except Exception as e:
            log.error("Lỗi lấy biến thể '%s' của %s: %s (dùng ảnh/giá mặc định)", color, url, e)

        code = f"{ma_sp}_{slug_upper(color)}"
        base, n = code, 2
        while code in used:
            code, n = f"{base}_{n}", n + 1
        used.add(code)
        rows.append({
            "ma_bien_the": code,
            "ma_sp": ma_sp,
            "mau_sac": color,
            "gia_goc": price,
            "link_anh": ";".join(images),
        })
    return rows


# ---------------------------------------------------------------------------
# Ghi file
# ---------------------------------------------------------------------------
P_COLS = ["ma_sp", "ten_sp", "danh_muc", "thong_so", "mo_ta", "link_nguon"]
V_COLS = ["ma_bien_the", "ma_sp", "mau_sac", "gia_goc", "link_anh"]


def write_outputs(products, variants, out_dir):
    out_dir.mkdir(parents=True, exist_ok=True)
    # utf-8-sig = UTF-8 có BOM để Excel mở không lỗi font tiếng Việt
    with open(out_dir / "products.csv", "w", newline="", encoding="utf-8-sig") as f:
        w = csv.DictWriter(f, fieldnames=P_COLS)
        w.writeheader()
        w.writerows(products)
    with open(out_dir / "variants.csv", "w", newline="", encoding="utf-8-sig") as f:
        w = csv.DictWriter(f, fieldnames=V_COLS)
        w.writeheader()
        w.writerows(variants)
    nested = []
    for p in products:
        q = dict(p)
        q["variants"] = [v for v in variants if v["ma_sp"] == p["ma_sp"]]
        nested.append(q)
    with open(out_dir / "products.json", "w", encoding="utf-8") as f:
        json.dump(nested, f, ensure_ascii=False, indent=2)


# ---------------------------------------------------------------------------
# Main
# ---------------------------------------------------------------------------
def main():
    ap = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    ap.add_argument("--test", type=int, default=0, help="chỉ crawl N sản phẩm (chạy thử) rồi in kết quả")
    ap.add_argument("--out", default=str(OUT_DIR), help="thư mục đầu ra")
    ap.add_argument("-v", "--verbose", action="store_true")
    args = ap.parse_args()

    out_dir = Path(args.out)
    out_dir.mkdir(parents=True, exist_ok=True)
    logging.basicConfig(
        level=logging.DEBUG if args.verbose else logging.INFO,
        format="%(asctime)s %(levelname)s %(message)s",
        handlers=[logging.StreamHandler(sys.stdout)],
    )
    eh = logging.FileHandler(out_dir / "errors.log", mode="w", encoding="utf-8")
    eh.setLevel(logging.ERROR)
    eh.setFormatter(logging.Formatter("%(asctime)s %(levelname)s %(message)s"))
    log.addHandler(eh)

    client = PoliteClient()
    sitemap_urls = load_sitemap_products(client)

    limit_total = args.test or MAX_TOTAL
    products, variants = [], []

    for cat in CATEGORIES:
        if len(products) >= limit_total:
            break
        log.info("=== Danh mục: %s", cat["danh_muc"])
        candidates = collect_candidates(client, cat, sitemap_urls)
        quota = min(cat["quota"], limit_total - len(products))
        if args.test:  # chế độ thử: lấy từ danh mục đầu tiên
            quota = limit_total - len(products)
        got = 0
        for url, cat_name in candidates:
            if got >= quota:
                break
            ma_sp = f"{cat['prefix']}{got + 1:02d}"
            try:
                html = client.get(url)
                d = parse_detail(html, url)
                if not d["name"]:
                    raise ValueError("không đọc được tên sản phẩm")
                vrows = build_variants(client, d, url, ma_sp)
            except Exception as e:
                log.error("Lỗi trang %s: %s", url, e)
                continue
            products.append({
                "ma_sp": ma_sp,
                "ten_sp": d["name"],
                "danh_muc": cat["danh_muc"],
                "thong_so": d["thong_so"],
                "mo_ta": d["mo_ta"],
                "link_nguon": url,
            })
            variants.extend(vrows)
            got += 1
            log.info("  [%s] %s — %d biến thể", ma_sp, d["name"], len(vrows))
            write_outputs(products, variants, out_dir)  # ghi dần, lỡ dừng giữa chừng vẫn còn dữ liệu
        if got < cat["quota"] and not args.test:
            log.error("Danh mục %s chỉ lấy được %d/%d sản phẩm", cat["danh_muc"], got, cat["quota"])

    write_outputs(products, variants, out_dir)
    log.info("Xong: %d sản phẩm, %d biến thể, %d request. Đầu ra: %s",
             len(products), len(variants), client.count, out_dir)

    if args.test:
        print("\n========== KẾT QUẢ CHẠY THỬ ==========")
        for p in products:
            print(json.dumps(p, ensure_ascii=False, indent=2))
            for v in variants:
                if v["ma_sp"] == p["ma_sp"]:
                    print("   ", json.dumps(v, ensure_ascii=False))


if __name__ == "__main__":
    main()
