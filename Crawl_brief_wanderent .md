# BRIEF CRAWL DỮ LIỆU SẢN PHẨM WANDERENT

## 1. Mục tiêu

Viết script crawl dữ liệu sản phẩm đồ dã ngoại để làm **dữ liệu mẫu cho website demo WANDERENT** (đồ án môn TMĐT, không dùng thương mại).

Ngôn ngữ lập trình: `[Python]`

## 2. Nguồn dữ liệu

1. Website: `wetrek.vn`
2. Sitemap: `https://wetrek.vn/sitemap_index.xml`
3. Link trang danh mục cần crawl:
   1. Lều trại: `https://wetrek.vn/san-pham/leu-trai-va-phu-kien-leu-trai.htm`
   2. Túi ngủ: `https://wetrek.vn/san-pham/tui-ngu.htm`
   3. Ván SUP: `https://wetrek.vn/san-pham/van-cheo-dung-sup.htm`
   4. Bếp và dụng cụ ăn uống: `https://wetrek.vn/san-pham/bep-da-ngoai.htm` và `https://wetrek.vn/san-pham/dung-cu-nau-an.htm`
4. Link một trang chi tiết sản phẩm làm mẫu: `https://wetrek.vn/san-pham/leu-ve-sinh-naturehike-folding-toilet-tent-nh17z002-p.htm`

## 3. Quy tắc robots.txt (bắt buộc tuân thủ)

1. Không truy cập link chứa tham số: `filterId`, `promotion`, `search`, `s`, `q`.
2. Không dùng ô tìm kiếm hoặc bộ lọc của website.
3. Ưu tiên lấy danh sách link sản phẩm từ sitemap, chỉ giữ link thuộc các danh mục ở mục 2.
4. Nghỉ `5` giây giữa mỗi request.

## 4. Cách trang hoạt động

1. Chuyển trang bằng: không có nút chuyển trang
2. Kiểm tra bằng Ctrl+U, tên và giá sản phẩm có xuất hiện trong mã nguồn không: `Có`
   (Có: trang tĩnh, dùng requests + BeautifulSoup. Không: trang tải bằng JavaScript, dùng Playwright.)

## 5. HTML mẫu của từng trường
Nhóm cung cấp sẵn file HTML đã lưu từ trang nguồn. Agent đọc các file này để xác định selector trước khi viết code crawl.

1. Trang danh mục: `danh_muc_leu.html`
2. Trang chi tiết sản phẩm: `chi_tiet_leu01.html`
3. Trang chi tiết có nhiều màu (nếu có): `hi_tiet_leu01.html`

Yêu cầu với Agent:

1. Từ trang danh mục, xác định selector lấy link đến từng trang chi tiết.
2. Từ trang chi tiết, xác định selector cho tên, giá, thông số, mô tả, danh sách màu và link ảnh.
3. Kiểm tra xem dữ liệu biến thể (màu, giá, ảnh) có nằm trong đoạn JSON trong mã nguồn không, nếu có thì ưu tiên đọc từ JSON.
4. Báo lại danh sách selector tìm được để nhóm xác nhận trước khi chạy crawl thật.

## 6. Trường dữ liệu cần lấy

Dữ liệu tách thành hai bảng, nối với nhau bằng `ma_sp`.

### 6.1. Bảng sản phẩm (products): mỗi sản phẩm một dòng

1. `ma_sp`: mã sản phẩm do script tự tạo theo quy tắc ở mục 9, ví dụ `LEU01`
2. `ten_sp`: tên sản phẩm
3. `danh_muc`: Lều / Túi ngủ / SUP / Bếp và dụng cụ ăn uống
4. `thong_so`: kích thước gấp gọn, khối lượng, sức chứa
5. `mo_ta`: mô tả gốc (nhóm sẽ viết lại sau)
6. `link_nguon`: link trang sản phẩm

### 6.2. Bảng biến thể (variants): mỗi màu sắc một dòng

1. `ma_bien_the`: mã sản phẩm + tên màu viết hoa không dấu, ví dụ `LEU01_XANH`
2. `ma_sp`: mã sản phẩm cha, dùng để nối với bảng sản phẩm
3. `mau_sac`: tên màu như trên trang nguồn
4. `gia_goc`: giá của biến thể này (chỉ để tham khảo, không dùng làm giá thuê)
5. `link_anh`: danh sách link ảnh, ngăn cách bằng dấu chấm phẩy

Quy tắc với biến thể:

1. Sản phẩm không có biến thể vẫn có một dòng trong bảng biến thể, với `mau_sac` để trống và `ma_bien_the` là `[MÃ SP]_MACDINH`.
2. Nếu hai màu dùng chung ảnh, vẫn ghi link ảnh vào cả hai dòng.


## 7. Xử lý ảnh

1. **Không tải ảnh về máy**, chỉ lưu link ảnh vào trường `link_anh`.
2. Số link ảnh tối đa mỗi biến thể: `[3]`
3. Lấy link ảnh kích thước lớn nhất có thể (không lấy link ảnh thumbnail nhỏ).
4. Link phải là đường dẫn đầy đủ, bắt đầu bằng `https://`. Nếu trang dùng đường dẫn tương đối, ghép thêm tên miền phía trước.
5. Nếu trang dùng lazy load, link ảnh thật có thể nằm trong thuộc tính `data-src` hoặc `srcset` thay vì `src`. Agent cần kiểm tra các thuộc tính này

## 8. Đầu ra

1. Định dạng: `[CSV / JSON / cả hai]`
2. Nếu CSV: hai file `products.csv` và `variants.csv`
3. Nếu JSON: một file `products.json`, mỗi sản phẩm chứa danh sách `variants` bên trong
4. Mã hóa: UTF8 (để giữ tiếng Việt có dấu)
5. Tên cột: theo đúng mục 6.1 và 6.2.
## 9. Quy tắc mã sản phẩm

1. Lều: `LEU01`, `LEU02`, ...
2. Túi ngủ: `TUINGU01`, `TUINGU02`, ...
3. Ván SUP: `SUP01`, `SUP02`, ...
4. Bếp và dụng cụ ăn uống: `BEP01`, `BEP02`, ...

> Combo (Cặp đôi, Nhóm bạn, Sinh tồn) không crawl. Nhóm sẽ tự ghép từ các món đồ lẻ sau khi có dữ liệu.

## 10. Giới hạn

1. Tổng số sản phẩm tối đa: `[30]`
2. Số sản phẩm mỗi danh mục: `[khoảng 7 đến 8]`
3. Nếu một trang lỗi, ghi vào file `errors.log` rồi chạy tiếp, không dừng toàn bộ script.

## 11. Yêu cầu thêm cho Agent

1. Chạy thử với 2 sản phẩm trước, in kết quả ra để kiểm tra rồi mới chạy toàn bộ.
2. Ghi chú trong code ở các chỗ dùng selector, để sau này dễ sửa nếu website đổi giao diện.
3. Ghi chú khác: `[điền nếu có]`