# WANDERENT – Dữ liệu sản phẩm mẫu

Dữ liệu sản phẩm đồ dã ngoại dùng làm **dữ liệu mẫu cho website demo WANDERENT** (đồ án môn TMĐT, không dùng thương mại).
Nguồn: crawl từ [wetrek.vn](https://wetrek.vn) ngày **02/11/2026**, tuân thủ robots.txt (nghỉ 5 giây giữa các request, không dùng tìm kiếm/bộ lọc, chỉ lấy link có trong sitemap).

> **Tóm tắt nhanh:** 30 sản phẩm, 39 biến thể, 4 danh mục. Hai bảng nối với nhau bằng `ma_sp`.
> Dữ liệu nằm trong thư mục `output/`, mã hoá UTF-8.

---

## 1. Các file

| File | Nội dung | Khi nào dùng |
|---|---|---|
| `output/products.json` | 30 sản phẩm, **mỗi sản phẩm chứa sẵn mảng `variants`** | Dùng cho frontend / seed database. Dễ nhất khi vibe code |
| `output/products.csv` | Bảng sản phẩm (30 dòng) | Mở bằng Excel / import vào database |
| `output/variants.csv` | Bảng biến thể (39 dòng) | Mở bằng Excel / import vào database |
| `output/errors.log` | Log lỗi khi crawl (hiện **trống**: không trang nào lỗi) | — |
| `crawl_wetrek.py` | Script crawl (Python) | Chỉ khi cần crawl lại |

CSV lưu dạng **UTF-8 có BOM**, nên Excel mở không lỗi tiếng Việt. Khi đọc bằng code nên dùng encoding `utf-8-sig`.

---

## 2. Cấu trúc dữ liệu

```
products (1) ────< variants (n)        nối bằng ma_sp
```

### 2.1. Bảng `products`: mỗi sản phẩm 1 dòng

| Cột | Kiểu | Ví dụ | Ghi chú |
|---|---|---|---|
| `ma_sp` | string, **khoá chính** | `LEU01` | Script tự tạo: `LEU01..08`, `TUINGU01..08`, `SUP01..06`, `BEP01..08` |
| `ten_sp` | string | `Lều 6 người Naturehike Pyramid Tent NH20ZP013` | Tên gốc trên wetrek. Một số tên còn đuôi mã nội bộ của shop, ví dụ ` - 6215`, nên cắt bỏ khi hiển thị |
| `danh_muc` | string (4 giá trị) | `Lều` | Chỉ có `Lều` / `Túi ngủ` / `SUP` / `Bếp và dụng cụ ăn uống` |
| `thong_so` | string | `Kích thước đóng gói: 65×26×38cm; Trọng lượng: 8.5kg` | Dạng `Tên: giá trị; Tên: giá trị`. Chỉ giữ các dòng về kích thước, trọng lượng, sức chứa, tải trọng. Tên trường **không đồng nhất** giữa các sản phẩm (xem mục 5) |
| `mo_ta` | string, nhiều dòng | `Lều chóp với thiết kế cửa...` | Mô tả gốc, dài 480 đến 2.800 ký tự, xuống dòng bằng `\n`. **Nhóm sẽ viết lại**, không dùng nguyên văn trên web demo |
| `link_nguon` | URL | `https://wetrek.vn/san-pham/...htm` | Trang gốc để đối chiếu |

### 2.2. Bảng `variants`: mỗi màu 1 dòng

| Cột | Kiểu | Ví dụ | Ghi chú |
|---|---|---|---|
| `ma_bien_the` | string, **khoá chính** | `LEU01_XANH_REU`, `LEU02_MACDINH` | `ma_sp` + `_` + tên màu viết hoa không dấu (dấu cách đổi thành `_`). Sản phẩm không có màu dùng đuôi `_MACDINH` |
| `ma_sp` | string, **khoá ngoại** | `LEU01` | Nối với `products.ma_sp` |
| `mau_sac` | string, có thể rỗng | `Xanh rêu`, `Red`, `Đen/Xanh lá` | Giữ nguyên như trên trang nguồn, nên có màu tiếng Anh (`Red`, `Mint`). **Rỗng** với biến thể `_MACDINH` |
| `gia_goc` | integer (VNĐ) | `7900000` | Giá bán lẻ trên wetrek tại thời điểm crawl. **Chỉ để tham khảo, KHÔNG phải giá thuê** |
| `link_anh` | string | `https://...a.jpg;https://...b.jpg;https://...c.jpg` | 1 đến 3 link ảnh **kích thước gốc** (lớn nhất), ngăn cách bằng `;`, luôn bắt đầu bằng `https://` |

Quy tắc của bảng biến thể:
- Sản phẩm nào cũng có **ít nhất 1 dòng** trong bảng biến thể. Sản phẩm không có màu thì có đúng 1 dòng `_MACDINH`.
- Mỗi màu có **ảnh riêng và giá riêng**, lấy từ trang nguồn ứng với màu đó. Giá có thể khác nhau giữa các màu, ví dụ LEU01 màu Kaki giá 970.000đ, các màu khác 790.000đ.
- Nếu hai màu dùng chung ảnh thì link ảnh được ghi vào cả hai dòng.

### 2.3. Cấu trúc `products.json`

```json
[
  {
    "ma_sp": "LEU01",
    "ten_sp": "Lều vệ sinh Naturehike Folding Toilet Tent NH17Z002-P",
    "danh_muc": "Lều",
    "thong_so": "Trọng lượng: 2.7kg; Kích thước khi mở: 190 x 115 x 115cm; Kích thước gấp gọn: Φ55×6cm",
    "mo_ta": "Lều được thiết kế với khả năng tự bung...\nĐặc điểm nổi bật:\n...",
    "link_nguon": "https://wetrek.vn/san-pham/leu-ve-sinh-naturehike-folding-toilet-tent-nh17z002-p.htm",
    "variants": [
      {
        "ma_bien_the": "LEU01_XANH_REU",
        "ma_sp": "LEU01",
        "mau_sac": "Xanh rêu",
        "gia_goc": 790000,
        "link_anh": "https://wetrek.vn/pic/products/....jpg;https://...;https://..."
      }
    ]
  }
]
```

> Lưu ý: trong JSON, `gia_goc` là **số**. Trong CSV mọi giá trị đều là chuỗi, nên phải ép kiểu khi đọc.

---

## 3. Kết quả thu được

| Danh mục | Số SP | Mã | Số biến thể | Khoảng giá gốc (VNĐ) |
|---|---|---|---|---|
| Lều | 8 | LEU01 đến LEU08 | 12 | 790.000 đến 22.995.000 |
| Túi ngủ | 8 | TUINGU01 đến TUINGU08 | 11 | 399.000 đến 1.590.000 |
| SUP | 6 | SUP01 đến SUP06 | 6 | 7.990.000 đến 25.950.000 |
| Bếp và dụng cụ ăn uống | 8 | BEP01 đến BEP08 | 10 | 192.000 đến 2.650.000 |
| **Tổng** | **30** | | **39** (15 có màu, 24 mặc định) | |

### Danh sách chi tiết

| Mã | Tên sản phẩm | Màu (biến thể) | Giá gốc (VNĐ) |
|---|---|---|---|
| LEU01 | Lều vệ sinh Naturehike Folding Toilet Tent NH17Z002-P | Xanh rêu, Xanh dương, Xanh lá, Kaki | 790.000 / 970.000 (Kaki) |
| LEU02 | Lều 6 người Naturehike Pyramid Tent NH20ZP013 | — | 7.900.000 |
| LEU03 | Lều che nắng Snowline Blue Sun Shadow SN95ULT001 | Red, Mint | 3.150.000 |
| LEU04 | Lều mái vòm Snowline Titandome Tent SND5ULT010 - Ivory | — | 10.995.000 |
| LEU05 | Lều mái vòm Snowline Astra Dome Tent SND5ULT011 - Ivory Black | — | 8.995.000 |
| LEU06 | Lều hình ống Snowline Saturn Shelter SND5ULT016 - Black | — | 12.995.000 |
| LEU07 | Lều hình ống 2 phòng Snowline Saturn 2 Room Tent Pro SNE5ULT009 - Sand Tan | — | 22.995.000 |
| LEU08 | Lều tự bung gia đình 4 người Snowline POP UP Family 4 Tent SND5ULT008 - Ivory | — | 6.995.000 |
| TUINGU01 | Túi ngủ mùa đông 2 lớp Ryder 2 Layers Mummy Sleeping Bag D1005 Orange | — | 1.590.000 |
| TUINGU02 | Túi ngủ mùa đông 2 lớp Ryder 2 Layers Mummy Sleeping Bag D1005 Blue | — | 1.590.000 |
| TUINGU03 | Túi ngủ Snowline Sleeping Soft Warm 1000 Crazy Idea CRH5USB002 | Xanh rêu, Ghi | 1.590.000 |
| TUINGU04 | Túi ngủ Snowline Sleeping Soft Warm 400 Crazy Idea CRH5USB001 | — | 1.190.000 |
| TUINGU05 | Túi ngủ siêu nhẹ Gothiar Sleeping Bag LW180 GT250001 | Cam, Ghi, Xanh dương | 585.000 |
| TUINGU06 | Túi ngủ Ryder Envelope Sleeping Bag D1001 Orange | — | 659.000 |
| TUINGU07 | Túi ngủ Ryder Envelope Sleeping Bag D1002 Orange | — | 789.000 |
| TUINGU08 | Túi ngủ nỉ Northpeak Sleeping Bag | — | 399.000 |
| SUP01 | Ván chèo đứng bơm hơi Aqua Marina Champion Windsurf SUP BT-S300 | — | 25.950.000 |
| SUP02 | Ván chèo đứng bơm hơi Aqua Marina TRITON BT-19TRP | — | 11.690.000 |
| SUP03 | Ván chèo đứng bơm hơi Aqua Marina SUP DHYANA BT-19DHP | — | 12.990.000 |
| SUP04 | Ván bơm hơi Aqua Marina Island Air Platform BT-I250 | — | 9.950.000 |
| SUP05 | Ván chèo đứng bơm hơi tập Yoga Aqua Marina FLOW SUP BT-88877 | — | 12.990.000 |
| SUP06 | Ván chèo đứng bơm hơi cho trẻ em Aqua Marina VIBRANT BT19VIP | — | 7.990.000 |
| BEP01 | Bếp ga gấp gọn Snowline Plate Stove II SN75UGG006 | — | 2.650.000 |
| BEP02 | Bộ dụng cụ ăn Coleman 2000007840 | — | 192.000 |
| BEP03 | Bếp ga mini dã ngoại Fire-Maple Folding Gas Stove FMS-105 gấp gọn | — | 600.000 |
| BEP04 | Chảo chiên nướng dã ngoại Fire-Maple Grill Pan | — | 900.000 |
| BEP05 | Bếp nướng gấp gọn Campingmoon Folding Burning Fire MT-035 | — | 1.415.000 |
| BEP06 | Bộ hộp đựng đồ ăn dã ngoại Pack´n Eat Kit Light My Fire | Đen/Xanh lá, Vàng/Xanh dương | 748.000 |
| BEP07 | Bếp nướng dã ngoại Campingmoon MT-2 | — | 748.000 |
| BEP08 | Đĩa gỗ dã ngoại Naturehike Solid Wood NH20CJ013 | Nâu, Kaki | 275.000 |

*(Tên trong bảng trên đã bỏ đuôi mã nội bộ cho gọn; tên đầy đủ xem trong file dữ liệu.)*

---

## 4. Đọc dữ liệu (copy dùng ngay)

**JavaScript / TypeScript (React, Next.js...)**
```js
import products from "./output/products.json";

// tách chuỗi ảnh thành mảng
const imagesOf = (variant) => variant.link_anh.split(";").filter(Boolean);

// ảnh đại diện = ảnh đầu tiên của biến thể đầu tiên
const thumbnail = (p) => imagesOf(p.variants[0])[0];

// tách thông số thành object { "Trọng lượng": "8.5kg", ... }
const specsOf = (p) =>
  Object.fromEntries(
    p.thong_so.split(";").map((s) => s.trim()).filter(Boolean)
      .map((s) => { const i = s.indexOf(":"); return [s.slice(0, i).trim(), s.slice(i + 1).trim()]; })
  );

// sản phẩm có chọn màu không?
const hasColors = (p) => p.variants.some((v) => v.mau_sac !== "");

// định dạng tiền
const vnd = (n) => n.toLocaleString("vi-VN") + " đ";
```

**Python**
```python
import json, csv
products = json.load(open("output/products.json", encoding="utf-8"))
# hoặc đọc CSV:
rows = list(csv.DictReader(open("output/variants.csv", encoding="utf-8-sig")))
```

**SQL (gợi ý schema để import CSV)**
```sql
CREATE TABLE products (
  ma_sp      VARCHAR(20) PRIMARY KEY,
  ten_sp     VARCHAR(255) NOT NULL,
  danh_muc   VARCHAR(50)  NOT NULL,
  thong_so   TEXT,
  mo_ta      TEXT,
  link_nguon VARCHAR(500)
);
CREATE TABLE variants (
  ma_bien_the VARCHAR(50) PRIMARY KEY,
  ma_sp       VARCHAR(20) NOT NULL REFERENCES products(ma_sp),
  mau_sac     VARCHAR(50),
  gia_goc     INTEGER,
  link_anh    TEXT
);
```

---

## 5. Lưu ý khi dùng dữ liệu (đọc trước khi code)

1. **`gia_goc` không phải giá thuê.** Website cho thuê cần tự thêm cột giá thuê, ví dụ `gia_thue_ngay`, hoặc tính theo % giá gốc.
2. **`thong_so` không đồng nhất tên trường.** Cùng một ý nhưng mỗi sản phẩm ghi khác nhau, ví dụ `Trọng lượng`, `Trọng lượng (grams)` (dù giá trị lại ghi bằng kg), `Kích thước đóng gói`, `Kích thước gấp gọn`... Nếu cần lọc hay so sánh theo trọng lượng thì phải tự chuẩn hoá. Nếu chỉ hiển thị thì tách theo `;` là đủ.
3. **BEP02 có `thong_so` rỗng**, vì trang nguồn không ghi. UI cần xử lý trường hợp rỗng, hoặc nhóm tự điền tay.
4. **TUINGU01 và TUINGU02 là cùng một mẫu túi ngủ** (Ryder D1005), chỉ khác màu cam và xanh. Wetrek đăng thành 2 sản phẩm riêng nên dữ liệu giữ nguyên. Nếu muốn, có thể gộp thành 1 sản phẩm có 2 biến thể màu.
5. **`mau_sac` lẫn tiếng Anh và tiếng Việt** (`Red`, `Mint` ở LEU03). Có thể đổi tên hiển thị, nhưng **không đổi `ma_bien_the`**, để giữ khoá nối.
6. **Một số tên sản phẩm có sẵn màu trong tên** dù chỉ có 1 biến thể `_MACDINH`, ví dụ `... - Ivory`, `... Orange`.
7. **`mo_ta` là văn bản gốc của wetrek**, có `\n` xuống dòng và đoạn giới thiệu thương hiệu. Nhóm sẽ viết lại. Khi hiển thị thì dùng `white-space: pre-line` hoặc tách theo `\n`.
8. **Link ảnh trỏ thẳng về server wetrek.vn** (không tải ảnh về máy). Dùng tạm cho demo thì được, nhưng ảnh có thể đổi hoặc mất bất cứ lúc nào. Nếu cần ổn định thì nên chuyển sang ảnh nhóm tự host.
9. Mỗi danh mục chỉ có 6 đến 8 món. Combo (Cặp đôi, Nhóm bạn, Sinh tồn) **không có trong dữ liệu**, nhóm tự ghép từ các món lẻ.

---

## 6. Gợi ý prompt khi vibe code

Dán đoạn sau vào AI để nó hiểu dữ liệu:

```
Tôi có file output/products.json là mảng sản phẩm cho thuê đồ dã ngoại. Mỗi sản phẩm có:
ma_sp, ten_sp, danh_muc ("Lều" | "Túi ngủ" | "SUP" | "Bếp và dụng cụ ăn uống"),
thong_so (chuỗi "Tên: giá trị; Tên: giá trị", có thể rỗng), mo_ta (văn bản có \n), link_nguon,
và mảng variants gồm: ma_bien_the, ma_sp, mau_sac (rỗng nếu không có màu),
gia_goc (số VNĐ, chỉ tham khảo, không phải giá thuê), link_anh (tối đa 3 URL ngăn cách bằng ";").
Sản phẩm nào cũng có ít nhất 1 variant. Sản phẩm không có màu thì có 1 variant mau_sac = "".
Hãy ...
```

---

## 7. Website demo (thư mục `web/`)

HTML + CSS + JavaScript thuần, không cần build. Mở `web/index.html` hoặc chạy `python3 -m http.server` trong `web/`.
Mọi dữ liệu demo (giỏ, đơn, tài khoản, ảnh thẻ HSSV, chỉnh sửa của admin) lưu trong **localStorage của trình duyệt**.

| Trang | File | Nội dung |
|---|---|---|
| Trang chủ | `index.html` + `home.js` | Thanh chọn ngày, 3 thẻ giá trị (bấm sang trang riêng), danh mục, thiết bị nổi bật, 4 bước (bấm sang `guide.html#buoc-N`), combo |
| Danh sách | `products.html` + `products.js` | Lọc danh mục / **giá thuê/ngày** / nhiều màu, tìm không dấu, sắp xếp |
| Chi tiết | `product.html?id=…` + `product.js` | Giá theo bậc ngày, lịch còn hàng 14 ngày, video có ảnh đại diện + nút phát, mô tả có cấu trúc |
| Combo | `combo.html` + `combo.js` | Mặc định báo giá chuyến 2 ngày (đổi được ngày), trùng khớp giỏ; bấm từng món để xem nhanh (khung bên phải) |
| Hướng dẫn | `guide.html` + `guide.js` | 4 bước chi tiết, bảng giá nhiều ngày, máy tính thử |
| Ưu đãi HSSV | `student.html` + `student.js` | Tải ảnh thẻ, kiểm tra trạng thái duyệt |
| Giỏ / Thanh toán | `cart.html`, `checkout.html`, `payment.html` | Sửa ngày nhận/trả và màu ngay trên từng món (món combo đổi ngày cả bộ), chặn hết hàng; thanh toán theo bước, chọn địa chỉ trong sổ hoặc thêm mới, có nút quay lại sửa thông tin (giữ nguyên lựa chọn); ưu đãi HSSV tự áp dụng nếu thẻ đã được duyệt trước; thanh toán demo MoMo QR / chuyển khoản VietQR / thẻ + OTP (thẻ thử 4111 1111 1111 1111, OTP 123456), giữ đồ 15 phút |
| Hóa đơn | `invoice.html?id=…` | In / lưu PDF, mở bằng ứng dụng email, gửi lại |
| Tài khoản | `account.html` | Đăng nhập bằng **email hoặc số điện thoại**, đơn thuê dạng thẻ (đơn giao tận nơi có nút **Đã nhận được hàng / Báo thiếu-hỏng**), hồ sơ (sửa tên, SĐT, mật khẩu), sổ địa chỉ, xác minh HSSV. Khách demo: 0912 345 678 / 123456 |
| Quản trị | `admin.html` (admin@wanderent.vn / wanderent) | Đơn thuê kiểu Odoo (bảng trạng thái, nút xử lý từng bước, kiểm tra trả đồ + khấu trừ, lịch sử), tab **Kho & sản phẩm** (tìm kiếm, lọc theo nhóm, nút Chỉnh sửa ngay trên từng sản phẩm), thông tin website, duyệt HSSV, email đã gửi |
| Chính sách | `deposit.html`, `refund.html`, `care.html`, `faq.html`, `contact.html`, `inventory.html` | |

Khi admin đăng nhập, mọi trang có thanh trên cùng để chuyển nhanh **Trang web ⇄ Trang quản trị**.

**Quy tắc giá** (khai báo đầu `assets/js/common.js`):
- Giá thuê ngày đầu: `DEFAULT_RENT`. Ngày 2–3 tính 80%, từ ngày 4 tính 60% (`DAY_TIERS`).
- Cọc = 30% giá trị thiết bị, được hoàn khi trả hàng sau khi nhân viên kiểm tra (không có hoàn cọc tự động).
- Combo giảm 10% tiền thuê khi đủ bộ trong cùng khoảng ngày. HSSV đã duyệt giảm 10% tiền thuê, **không cộng dồn** với combo.
- Admin có thể ghi đè tên, giá thuê, giá trị, số lượng kho, ẩn/hiện, tóm tắt mô tả, thông tin cửa hàng và phí giao (`wanderent_settings`).

**Mô tả sản phẩm** đã viết lại theo cấu trúc (tóm tắt, điểm nổi bật, phù hợp cho, đi kèm, lưu ý) trong `assets/js/content.js`.
Thông số bị lỗi định dạng (TUINGU04, BEP03, SUP01, BEP02) được làm sạch tại đây.

**Hóa đơn email**: bản tĩnh không có máy chủ gửi thư, nên mỗi đơn tạo hóa đơn và ghi vào "Email đã gửi" (mô phỏng). Khi triển khai thật có thể nối EmailJS/SMTP trong `sendInvoiceEmail`.

## 8. Crawl lại (nếu cần)

```bash
python3 -m venv .venv
.venv/bin/pip install requests beautifulsoup4 lxml
.venv/bin/python crawl_wetrek.py --test 2    # chạy thử 2 SP, in kết quả ra màn hình
.venv/bin/python crawl_wetrek.py             # chạy toàn bộ, mất khoảng 5 phút (nghỉ 5s mỗi request)
```

- Muốn đổi danh mục, số lượng hay bộ lọc tên thì sửa biến `CATEGORIES` ở đầu `crawl_wetrek.py`.
- Các selector HTML đều có ghi chú trong code, để dễ sửa khi wetrek đổi giao diện.
- Ảnh và giá theo màu được lấy qua chính yêu cầu AJAX mà trang gọi khi khách bấm chọn màu (`/cms/display/Ajax/Product.aspx`, `action=LoadProductInfo`), vì JSON nhúng trong trang (`window.wtVariants`) chỉ có tên màu, không có giá và ảnh.
