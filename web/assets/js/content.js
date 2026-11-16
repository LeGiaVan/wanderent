/* =====================================================================
   WANDERENT — Mô tả sản phẩm đã biên tập lại theo cấu trúc
   Nguồn thông tin kỹ thuật: dữ liệu crawl (output/products.json), nhóm viết lại.
   Mỗi sản phẩm:
     tom_tat   : 1–2 câu giới thiệu
     noi_bat   : các điểm nổi bật (gạch đầu dòng)
     phu_hop   : chuyến đi / người dùng phù hợp
     di_kem    : (tuỳ chọn) phụ kiện đi kèm khi thuê
     luu_y     : (tuỳ chọn) lưu ý khi sử dụng đồ thuê
     thong_so  : (tuỳ chọn) thông số đã làm sạch, thay cho chuỗi gốc bị lỗi
   Phần "Khi thuê tại WANDERENT" dùng chung theo danh mục (RENT_NOTES).
   ===================================================================== */
window.WANDERENT_CONTENT = {
  LEU01: {
    tom_tat: "Lều tự bung nhỏ gọn, dùng làm phòng thay đồ, nhà vệ sinh dã chiến hoặc chỗ che nắng khi câu cá. Mở lều chỉ với vài thao tác, không cần lắp khung.",
    noi_bat: [
      "Tự bung, mở và gấp nhanh, phù hợp cả người lần đầu cắm trại",
      "Khi mở cao 190 cm, đáy 115 × 115 cm: đủ chỗ đứng thay đồ",
      "1 cửa ra vào và 1 cửa sổ 2 lớp: lớp chắn gió mưa và lớp lưới chống côn trùng",
      "Vải Polyester 190T, chống nước 2.000 mm, chịu được mưa rào nhiều giờ",
      "Bên trong có túi nhỏ đựng đồ cá nhân và móc treo đèn",
    ],
    phu_hop: "Bãi trại chưa có nhà vệ sinh, đi biển cần chỗ thay đồ, câu cá cần chỗ che nắng.",
    di_kem: "Túi đựng tròn (Φ55 × 6 cm) có quai đeo vai.",
    luu_y: "Lều dùng để thay đồ, vệ sinh, không dùng để ngủ qua đêm. Nhân viên sẽ hướng dẫn cách gấp lều tự bung khi bàn giao.",
  },
  LEU02: {
    tom_tat: "Lều chóp 6 người có cửa kèm mái hiên. Phần mái che phía trước dùng được làm chỗ tránh nắng, tránh mưa hoặc phòng thay đồ tạm.",
    noi_bat: [
      "Không gian rộng 400 × 346 cm, cao 240 cm, ngủ thoải mái cho 6 người",
      "Vải Oxford 150D phủ bạc, chống thấm PU 3.000 mm, cản tia UV-A / UV-B",
      "Cửa đôi trước và sau giúp thông gió và ra vào thuận tiện",
      "Lều lưới bên trong làm phòng ngủ, tách biệt với phần mái hiên",
      "Khóa kéo chắc chắn, không bị kẹt",
    ],
    phu_hop: "Nhóm bạn hoặc gia đình 4–6 người cắm trại qua đêm, cần chỗ sinh hoạt chung.",
    luu_y: "Lều nặng 8,5 kg khi đóng gói (65 × 26 × 38 cm). Nên đi ô tô hoặc có 2 người mang. Cần khoảng 2 người để dựng.",
  },
  LEU03: {
    tom_tat: "Lều che nắng có mái mở rộng, tạo bóng mát rộng mà không cần thêm tấm bạt. Chứa tối đa 4 người ngồi nghỉ.",
    noi_bat: [
      "Diện tích 240 × 240 cm, cao 165 cm",
      "Lưới mở cả 4 mặt, thông gió tốt và che nắng linh hoạt",
      "Mái mở rộng thẳng đứng cho vùng bóng râm lớn",
      "Cố định cột chính bằng vòng, dựng nhanh và chắc",
      "Có móc treo đèn trên trần cho buổi tối",
    ],
    phu_hop: "Picnic ban ngày, đi biển, ngồi nghỉ ở bãi trại. Có 2 màu Đỏ và Mint.",
    luu_y: "Đây là lều che nắng, không dùng mái mở rộng khi trời mưa và không dùng để ngủ qua đêm.",
  },
  LEU04: {
    tom_tat: "Lều mái vòm khung nhôm cho 4 người lớn, kèm tấm bạt che trước cửa để mở rộng không gian sinh hoạt.",
    noi_bat: [
      "Khung nhôm dạng vòm, chống gió và chống mưa tốt",
      "Khoang ngủ 270 × 270 cm, đủ 4 người lớn; tổng chiều dài 490 cm, cao 190 cm",
      "Trần cao, cửa mở được cả 2 bên, ra vào dễ dàng",
      "Hệ thống thông gió hạn chế đọng hơi nước bên trong",
      "Tấm bạt che nắng đi kèm, dựng ngay tại lối ra vào",
    ],
    phu_hop: "Gia đình hoặc nhóm 4 người cắm trại 1–3 đêm, kể cả khi thời tiết thay đổi.",
    di_kem: "Tấm bạt che nắng trước cửa.",
    luu_y: "Nặng 13 kg khi đóng gói (70 × 25 × 25 cm), nên có xe chở. Nên dựng thử một lần trước chuyến đi.",
  },
  LEU05: {
    tom_tat: "Lều mái vòm 4 người với tấm bạt trước mở rộng làm chỗ râm, nhiều ngăn lưới bên trong giúp đồ đạc gọn gàng.",
    noi_bat: [
      "Khoang ngủ 270 × 220 cm cho 4 người; tổng 410 × 280 cm, cao 170 cm",
      "Cửa sổ lưới bên và lỗ thông gió hạn chế ngưng tụ hơi nước",
      "Tấm bạt trước có thể mở rộng thành mái hiên che nắng",
      "Nhiều ngăn lưới đựng đồ bên trong",
      "Vải chống thấm nước và chống nắng",
    ],
    phu_hop: "Nhóm bạn hoặc gia đình 3–4 người; nhẹ hơn LEU04 nên hợp với chuyến đi ngắn.",
    luu_y: "Nặng 10 kg khi đóng gói (66 × 24,5 × 24,5 cm).",
  },
  LEU06: {
    tom_tat: "Lều hình ống (shelter) dựng bằng cột nhôm, không gian rộng cho 4 người sinh hoạt hoặc làm khu bếp, khu ăn uống chung.",
    noi_bat: [
      "Diện tích 520 × 340 cm, cao 210 cm",
      "Cột nhôm cố định chắc chắn, hạn chế lật đổ khi gió mạnh",
      "Cửa sổ thông gió trên trần",
      "Dây đai điều chỉnh độ căng, giúp lều phẳng và vững",
      "Kèm dây và nút chặn để cố định vào cọc",
    ],
    phu_hop: "Nhóm 4 người cần chỗ sinh hoạt chung, dựng làm \"phòng khách\" cạnh lều ngủ.",
    luu_y: "Nặng 13,2 kg (65 × 27 × 27 cm). Cần 2 người để dựng.",
  },
  LEU07: {
    tom_tat: "Lều hình ống 2 phòng cỡ lớn, cấu tạo 3 lớp chống cháy và chống thấm, có tấm trải sàn riêng. Đây là lều rộng nhất trong danh mục.",
    noi_bat: [
      "Diện tích 640 × 340 cm, cao 210 cm, chia 2 phòng",
      "Lớp ngoài đạt chuẩn chống cháy CPAI-84, lớp Poly ripstop chống rách, lớp phủ PU chống thấm",
      "Cọc nhôm 7001 cứng, chịu gió mạnh",
      "Cửa sổ thông gió trần dài hết cỡ",
      "Tấm trải sàn chống ẩm đi kèm",
    ],
    phu_hop: "Gia đình đông người hoặc nhóm 6+ người cắm trại dài ngày, cần phòng ngủ và phòng sinh hoạt riêng.",
    di_kem: "Tấm trải sàn.",
    luu_y: "Nặng 20,3 kg (78 × 34 × 34 cm), bắt buộc có xe chở. Nên chọn giao tận nơi.",
  },
  LEU08: {
    tom_tat: "Lều tự bung cho gia đình 4 người: mở và thu gọn rất nhanh, cấu trúc 2 lớp có tiền sảnh và tán che ở cả hai cửa.",
    noi_bat: [
      "Tự bung, gần như không cần lắp ráp",
      "Kích thước 380 × 260 cm, cao 150 cm, tối đa 4 người",
      "Vải poly taffeta 68D chống nước 1.500 mm",
      "2 lớp (lều ngoài + lều trong), có khoảng tiền sảnh, giảm ngưng tụ hơi nước",
      "Chân dựng tạo tán che ở cả hai lối vào, có cửa sổ lưới và túi lưới đựng đồ",
    ],
    phu_hop: "Cặp đôi hoặc gia đình nhỏ lần đầu cắm trại, muốn dựng lều nhanh.",
    luu_y: "Khi gấp là đĩa tròn 100 cm, nặng 11,2 kg. Xem video hướng dẫn gấp trong phần ảnh sản phẩm.",
  },
  TUINGU01: {
    tom_tat: "Túi ngủ mùa đông dáng con nhộng 2 lớp, giữ nhiệt rất tốt cho những nơi lạnh. Màu cam.",
    noi_bat: [
      "Dùng được ở nhiệt độ lạnh tới -20 ºC (theo nhà sản xuất)",
      "Mũ trùm đầu có dây rút, giữ ấm phần đầu; có thể dùng làm gối",
      "Vỏ ngoài 210T ripstop nylon bền, chống thấm và cách nhiệt",
      "Khóa 2 chiều dọc thân, mở được từ bên trong",
      "Ghép được 2 túi (1 khóa trái + 1 khóa phải) thành túi ngủ đôi",
    ],
    phu_hop: "Trekking núi cao, cắm trại Đà Lạt, Tà Xùa… vào mùa lạnh.",
    luu_y: "Kích thước 220 × 80 × 50 cm, nặng 2 kg, đóng gói 46 × 25 cm. Ở TP.HCM sẽ khá nóng, nên chọn túi mỏng hơn.",
  },
  TUINGU02: {
    tom_tat: "Cùng mẫu túi ngủ mùa đông dáng con nhộng 2 lớp Ryder D1005, phiên bản màu xanh dương.",
    noi_bat: [
      "Dùng được ở nhiệt độ lạnh tới -20 ºC (theo nhà sản xuất)",
      "Mũ trùm đầu có dây rút, giữ ấm phần đầu",
      "Vỏ ngoài 210T ripstop nylon bền, chống thấm và cách nhiệt",
      "Khóa 2 chiều dọc thân, mở được từ bên trong",
      "Ghép được với túi D1005 khác thành túi ngủ đôi",
    ],
    phu_hop: "Trekking núi cao, cắm trại vùng lạnh; thuê kèm TUINGU01 nếu muốn ghép túi đôi.",
    luu_y: "Kích thước 220 × 80 × 50 cm, nặng 2 kg, đóng gói 46 × 25 cm.",
  },
  TUINGU03: {
    tom_tat: "Túi ngủ 3 mùa (Xuân, Hè, Thu) có lớp ruột 1.000 g sợi Micro 3D và lớp lót nhung mềm, ấm và êm.",
    noi_bat: [
      "Ruột 1.000 g sợi Micro 3D Silk Fiber, giữ nhiệt ổn định suốt đêm",
      "Lót Velboa 100% Polyester mềm như nhung",
      "Vỏ 210T phủ chống thấm nhẹ, chống bám bẩn và ẩm",
      "Có khóa mở rộng: ghép 2 túi thành túi đôi 320 × 190 cm",
      "Kèm túi nén có khóa bấm, gọn còn 26 × 45 cm",
    ],
    phu_hop: "Cắm trại ở Đà Lạt, Bảo Lộc hoặc vùng cao vào mùa mát. Có 2 màu Xanh rêu và Ghi.",
    di_kem: "Túi nén có khóa bấm.",
    luu_y: "Kích thước sử dụng 80 × 190 cm, nặng 1,7 kg.",
  },
  TUINGU04: {
    tom_tat: "Túi ngủ dạng chăn (mở được toàn bộ), lót nhung mềm, dùng đơn hoặc ghép đôi rất linh hoạt.",
    noi_bat: [
      "Vỏ Pongee 210T phủ chống thấm, chống bẩn và ẩm",
      "Lót Wellboa 100% Polyester mềm, ấm",
      "Mở phẳng hoàn toàn để dùng làm chăn hoặc thảm lót sàn lều",
      "Khóa mở rộng ghép 2 túi thành túi đôi 180 × 148 cm",
      "Khóa kéo 2 chiều, có túi nhỏ bên trong để điện thoại",
    ],
    phu_hop: "Cắm trại gia đình hoặc cặp đôi ở nơi mát; dùng làm chăn cho chuyến đi ô tô.",
    luu_y: "Khi ghép đôi, hai túi có thể lệch nhau 2–3 cm do sản xuất. Có móc treo ở đáy để phơi khô.",
    thong_so: "Kích thước khi sử dụng: 74 × 180 cm (dùng đơn); Kích thước khi cất: Φ38 × 49 cm; Trọng lượng: 1,2 kg",
  },
  TUINGU05: {
    tom_tat: "Túi ngủ siêu nhẹ chỉ khoảng 700 g, cuộn gọn trong túi nén, hợp với balo trekking.",
    noi_bat: [
      "Nặng khoảng 700 g (± 50 g)",
      "Vỏ ngoài polyester 210T chống nước 2 lớp, chắn sương đêm",
      "Ruột bông rỗng cao cấp (Premium Hollow Cotton), giữ nhiệt mà vẫn nhẹ",
      "Dài 190 cm thân + 30 cm mũ, rộng 75 cm",
      "3 màu: Cam, Ghi, Xanh dương",
    ],
    phu_hop: "Trekking, phượt xe máy, cắm trại khí hậu ấm như miền Nam.",
    di_kem: "Túi nén.",
  },
  TUINGU06: {
    tom_tat: "Túi ngủ dáng phong bì (chữ nhật), không mũ. Dễ dùng, có thể mở ra làm chăn đắp.",
    noi_bat: [
      "Nhiệt độ thoải mái 15 ºC, tối thiểu 5 ºC",
      "Vỏ polyester 190T nhẹ, bền, ít bị ảnh hưởng bởi độ ẩm",
      "Lõi bông T/C 250 g/m², mặt trong polyester mềm",
      "Khóa dọc thân, ghép 2 túi thành túi đôi",
      "Có túi nhỏ đựng đồ cá nhân bên trong",
    ],
    phu_hop: "Cắm trại 1–2 đêm ở nơi mát, ngủ trưa văn phòng, đi xe khách đêm.",
    luu_y: "Kích thước 190 × 75 cm, nặng 1,2 kg, đóng gói 26 × 18 cm.",
  },
  TUINGU07: {
    tom_tat: "Túi ngủ phong bì có mũ, giữ ấm phần đầu tốt hơn D1001. Ghép được thành túi đôi có mũ.",
    noi_bat: [
      "Nhiệt độ trung bình 15 ºC, tối thiểu 5 ºC",
      "Có mũ trùm giúp giữ nhiệt",
      "Vỏ polyester 190T chống thấm nhẹ, dễ vệ sinh",
      "Lõi bông T/C 250 g/m²",
      "Khóa 2 mặt: ghép 1 túi khóa trái với 1 túi khóa phải thành túi đôi",
    ],
    phu_hop: "Cắm trại 1–2 đêm ở nơi mát, cặp đôi muốn ghép túi.",
    luu_y: "Kích thước 190 (+30 mũ) × 75 cm, nặng 1,3 kg, đóng gói 26 × 19 cm.",
  },
  TUINGU08: {
    tom_tat: "Túi ngủ vải nỉ dáng chữ nhật có mũ, mỏng nhẹ, hợp với khí hậu ấm.",
    noi_bat: [
      "Nhiệt độ sử dụng 10–25 ºC",
      "Vải nỉ nhẹ, bền, chịu mài mòn tốt",
      "Dáng chữ nhật có mũ và khóa kéo",
      "Kích thước 210 × 75 cm, gấp gọn 30 × 20 cm",
    ],
    phu_hop: "Cắm trại ở vùng ấm, ngủ trong lều có sẵn đệm, lót thêm cho túi ngủ khác.",
  },
  SUP01: {
    tom_tat: "Ván chèo đứng bơm hơi kiêm lướt ván buồm: thân rộng và ngắn nên rất ổn định. Kèm bộ buồm tháo rời.",
    noi_bat: [
      "Ván 300 × 75 × 15 cm, tải trọng tối đa 120 kg",
      "Công nghệ drop-stitch vách đúp, bơm tới 15 psi",
      "Mặt ván phủ xốp EVA chống trơn, có dây bungee chằng đồ",
      "1 vây giữa, 2 vây bên và xiếm giữa 50 cm để dùng buồm",
      "Buồm 3,0 m² vải Dacron/Monofilm, cột buồm composite 4 khúc, sào buồm 3 khúc chỉnh được",
    ],
    phu_hop: "Người mới tập SUP muốn thử thêm lướt ván buồm ở hồ, vịnh lặng gió vừa.",
    di_kem: "Bộ buồm (cánh buồm, cột, sào, dây kéo, đế buồm) và túi đựng.",
    luu_y: "Ván nặng 10,7 kg. Lần đầu dùng buồm nên có người hướng dẫn. Luôn mặc áo phao.",
    thong_so: "Kích thước ván: 300 × 75 × 15 cm; Cánh buồm: 3,0 m² (mép ngoài 300 cm); Cột buồm: 300 cm; Sào buồm: 132 cm; Trọng lượng: 10,7 kg; Tải trọng tối đa: 120 kg",
  },
  SUP02: {
    tom_tat: "Ván SUP đa năng (All Around) dài 340 cm, cứng và giữ thăng bằng tốt, chở được tới 150 kg.",
    noi_bat: [
      "Kích thước 340 × 81 × 15 cm, tải trọng 150 kg",
      "Drop-stitch bơm trên 15 psi, thành ván PVC 500D",
      "Vòng chữ D inox ở đuôi để gắn dây buộc chân",
      "Dây bungee chằng đồ trên mặt ván",
      "Bơm tay Double Action, bơm nhanh hơn",
    ],
    phu_hop: "Chèo dạo hồ, sông, biển lặng; người lớn hoặc 1 người lớn kèm trẻ nhỏ.",
    di_kem: "Bơm tay Double Action.",
    luu_y: "Nặng 9,7 kg. Luôn mặc áo phao và buộc dây chân khi chèo.",
  },
  SUP03: {
    tom_tat: "Ván SUP dành cho yoga trên mặt nước: mặt ván rộng 91 cm, cứng như một tấm thảm tập.",
    noi_bat: [
      "Kích thước 336 × 91 × 12 cm, tải trọng 120 kg",
      "Mặt ván rộng, ổn định cho các tư thế yoga",
      "Drop-stitch bơm trên 15 psi, thành ván PVC 500D",
      "Vòng chữ D inox để gắn dây buộc chân, có dây bungee chằng đồ",
      "Gấp gọn 44 × 27 × 95 cm, kèm bơm tay Double Action",
    ],
    phu_hop: "Yoga SUP, chèo thư giãn trên hồ lặng.",
    di_kem: "Bơm tay Double Action.",
    luu_y: "Nặng 10 kg. Nên tập ở vùng nước lặng, gần bờ.",
  },
  SUP04: {
    tom_tat: "Phao sàn bơm hơi như một \"hòn đảo\" nổi để bơi, chơi đùa hoặc nằm thư giãn, chở được 3 người lớn và 1 trẻ em.",
    noi_bat: [
      "Kích thước 250 × 160 × 15 cm, tải trọng 265 kg (3 + 1 người)",
      "Lõi drop-stitch, bơm tới 8 psi; viền gia cố tăng độ cứng",
      "Xử lý chống tia UV",
      "Móc nối inox, ghép được nhiều sàn với nhau",
      "Tay xách tiện mang vác",
    ],
    phu_hop: "Nhóm bạn, gia đình chơi ở hồ, bãi biển lặng sóng.",
    luu_y: "Nặng 12,8 kg. Đây là sàn nổi, không dùng để chèo đi xa.",
  },
  SUP05: {
    tom_tat: "Ván SUP tập yoga với mũi và đuôi phẳng, dày 15 cm và bộ 3 vây giúp đứng vững.",
    noi_bat: [
      "Kích thước 300 × 81 × 15 cm, tải trọng 120 kg",
      "Mặt phẳng, hai đầu bằng cho độ ổn định cao",
      "Bộ 3 vây bên dưới tăng an toàn khi tập",
      "PVC bền, chịu va đập và mài mòn; đường may dập nhiệt kín hơi",
      "Áp suất tối ưu tới 20 psi, gấp lại nhỏ gọn",
    ],
    phu_hop: "Yoga SUP, người mới làm quen với ván đứng.",
    luu_y: "Nặng 9 kg. Rửa lại bằng nước ngọt nếu dùng ở biển (nhân viên sẽ làm khi nhận lại).",
  },
  SUP06: {
    tom_tat: "Ván SUP cho trẻ em: dùng cùng công nghệ với bản người lớn nhưng nhỏ và nhẹ hơn, dễ điều khiển.",
    noi_bat: [
      "Kích thước 244 × 71 × 10 cm, chỉ 5,7 kg",
      "Tải trọng tối đa 60 kg",
      "Drop-stitch bơm trên 15 psi, thành ván PVC 500D",
      "Vòng chữ D inox gắn dây chân, dây bungee chằng đồ",
      "Kèm bơm tay Double Action",
    ],
    phu_hop: "Trẻ em và thiếu niên dưới 60 kg tập chèo ở nước lặng.",
    di_kem: "Bơm tay Double Action.",
    luu_y: "Trẻ em phải mặc áo phao và có người lớn giám sát.",
  },
  BEP01: {
    tom_tat: "Bếp ga gấp gọn bằng thép không gỉ, có hệ thống phun ga hóa lỏng giữ lửa ổn định cả khi trời lạnh.",
    noi_bat: [
      "Thân bếp và kiềng nồi bằng thép không gỉ, dễ vệ sinh",
      "Phun ga hóa lỏng (Liquid Injection): lửa ổn định ở nhiệt độ thấp",
      "Núm vặn trên mặt bếp để đánh lửa và chỉnh lửa",
      "Lắp bình ga một chạm, ghép được với bàn IGT",
      "Kích thước dùng 35 × 25 × 13,5 cm, cất gọn 42 × 30 × 9 cm",
    ],
    phu_hop: "Nhóm 4–6 người nấu ăn ở bãi trại, cần bếp to và ổn định.",
    luu_y: "Bình ga không đi kèm (mua tại cửa hàng hoặc mang theo). Nặng 3,6 kg.",
  },
  BEP02: {
    tom_tat: "Bộ dao, thìa, nĩa bằng thép không gỉ, khóa liền với nhau để không rơi mất.",
    noi_bat: [
      "Gồm dao, thìa, nĩa thép không gỉ",
      "Nhẹ, bền, không bám mùi, dễ rửa",
      "Khóa được 3 món lại với nhau khi cất",
    ],
    phu_hop: "Mỗi người một bộ cho chuyến cắm trại, picnic, trekking.",
    thong_so: "Bộ gồm: Dao, thìa, nĩa; Chất liệu: Thép không gỉ",
  },
  BEP03: {
    tom_tat: "Bếp ga mini gấp gọn chỉ 237 g, có đánh lửa điện, hợp với balo trekking.",
    noi_bat: [
      "Siêu nhẹ 237 g; khi gấp chỉ Φ91 × 60 mm",
      "Chân đỡ nồi có răng cưa, giữ nồi vững",
      "Núm chỉnh lửa và đánh lửa điện",
      "Đĩa ga giúp đun nhanh, tiết kiệm nhiên liệu",
      "Dùng được ở địa hình gồ ghề",
    ],
    phu_hop: "Trekking, cắm trại 1–2 người: nấu mì, đun nước, pha cà phê.",
    luu_y: "Dùng bình ga van ren (loại dẹt), không đi kèm. Nên dùng thêm tấm chắn gió khi nấu ngoài trời.",
    thong_so: "Kích thước khi mở: Φ174 × 69,5 mm; Kích thước khi gấp: Φ91,3 × 59,8 mm; Trọng lượng: 237 g",
  },
  BEP04: {
    tom_tat: "Chảo nướng dã ngoại có rãnh dẫn dầu, chuyên cho beefsteak, thịt nướng, rau củ.",
    noi_bat: [
      "Thân hợp kim nhôm đạt chuẩn thực phẩm",
      "Rãnh dẫn dầu, giữ nhiệt tốt",
      "Cứng, chịu va đập và mài mòn",
      "Quai gấp gọn bằng inox cường độ cao",
      "Kích thước 43,8 × 34,3 × 4 cm, nặng 660 g",
    ],
    phu_hop: "Dùng chung với bếp ga BEP01 hoặc BEP03 cho bữa nướng 2–4 người.",
  },
  BEP05: {
    tom_tat: "Bếp nướng than inox 304 gấp gọn, vỉ nướng chỉnh được 3 nấc chiều cao, có đáy hứng tro.",
    noi_bat: [
      "Inox 304 chịu nhiệt cao, an toàn",
      "Vỉ nướng 34 × 31,5 cm chỉnh được 3 nấc theo lượng than",
      "Thân hình kim tự tháp ngược, 4 chân đế vững",
      "Đáy hứng tro, không rơi tro ra bãi cỏ",
      "Gấp phẳng 45 × 44 × 6,5 cm",
    ],
    phu_hop: "Tiệc nướng nhóm 4–8 người ở bãi trại cho phép đốt than.",
    luu_y: "Than không đi kèm. Chờ bếp nguội hẳn trước khi gấp và trả. Nặng 6,6 kg.",
  },
  BEP06: {
    tom_tat: "Bộ hộp ăn uống cho 2 người, xếp chồng gọn thành một khối: đĩa, tô, ly gập và thìa-nĩa-dao.",
    noi_bat: [
      "2 đĩa / nắp 500 ml và 1 tô 900 ml xếp chồng",
      "2 ly gập Pack-Up-Cup 260 ml có vạch đo, dùng được đồ nóng và lạnh",
      "2 Spork Original (thìa-nĩa-dao 3 trong 1)",
      "Nhựa PP 100% không chứa BPA",
      "Gọn 194 × 194 × 65 mm, chỉ 339 g",
    ],
    phu_hop: "Cặp đôi đi picnic, cắm trại. Có 2 màu Đen/Xanh lá và Vàng/Xanh dương.",
    di_kem: "Dây buộc cố định bộ hộp.",
  },
  BEP07: {
    tom_tat: "Bếp nướng than hoa nhỏ gọn cho tiệc 4–8 người, chỉnh được độ cao lưới nướng 2 nấc.",
    noi_bat: [
      "Lưới nướng chỉnh 2 nấc, kiểm soát nhiệt và độ chín",
      "Vật liệu chống gỉ, an toàn thực phẩm",
      "Dễ vệ sinh sau khi dùng",
      "Kích thước dùng 35 × 34 × 26 cm, gấp gọn 35 × 20 × 9 cm",
    ],
    phu_hop: "Tiệc nướng nhỏ ở bãi trại, sân vườn, ban công rộng.",
    luu_y: "Than không đi kèm. Nặng 3,5 kg.",
  },
  BEP08: {
    tom_tat: "Đĩa gỗ nguyên khối Φ15 cm, chịu nhiệt tốt, nhẹ và nhanh khô.",
    noi_bat: [
      "Gỗ nguyên khối, bền, chịu lực tốt",
      "Đựng được đồ nóng, an toàn sức khỏe",
      "Không thấm nước, nhanh khô, dễ vệ sinh",
      "Chỉ 190 g, đường kính 15 cm",
    ],
    phu_hop: "Bày đồ ăn cho buổi picnic, cắm trại \"chill\" chụp ảnh đẹp. Có 2 màu Nâu và Kaki.",
  },
};

/* Phần "Khi thuê tại WANDERENT" theo danh mục */
window.WANDERENT_RENT_NOTES = {
  "Lều": [
    "Lều được phơi khô, kiểm tra khung, dây, cọc trước mỗi lượt giao.",
    "Đủ cọc và dây chằng theo bộ; nhân viên kiểm đếm cùng bạn khi bàn giao.",
    "Không cần giặt khi trả, chỉ cần giũ sạch đất cát.",
  ],
  "Túi ngủ": [
    "Túi ngủ được phơi, hút bụi và giặt định kỳ theo lượt thuê.",
    "Có thể thuê kèm túi cùng mẫu để ghép thành túi đôi.",
    "Không cần giặt khi trả, trừ khi dính bẩn bất thường.",
  ],
  "SUP": [
    "Ván được kiểm tra van, keo và đường may trước mỗi lượt giao.",
    "Mái chèo, dây buộc chân và áo phao: hỏi nhân viên khi đặt.",
    "Xả hơi trước khi trả; nhân viên sẽ rửa nước ngọt cho bạn.",
  ],
  "Bếp và dụng cụ ăn uống": [
    "Bếp được lau sạch dầu mỡ và kiểm tra van ga, không giao bếp rò rỉ.",
    "Bình ga và than không đi kèm.",
    "Rửa sơ trước khi trả; vết cháy, gỉ do dùng sai cách sẽ được đối chiếu với ảnh lúc bàn giao.",
  ],
};
