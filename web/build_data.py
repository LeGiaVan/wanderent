#!/usr/bin/env python3
"""Sinh lại web/assets/js/data.js từ output/products.json (chạy sau mỗi lần crawl lại)."""
import json
from pathlib import Path

root = Path(__file__).resolve().parent.parent
products = json.loads((root / "output/products.json").read_text(encoding="utf-8"))
js = (
    "// Tự sinh từ output/products.json — chạy lại: .venv/bin/python web/build_data.py\n"
    "// Dùng file .js (không fetch JSON) để mở trực tiếp index.html bằng trình duyệt vẫn chạy.\n"
    "window.WANDERENT_PRODUCTS = " + json.dumps(products, ensure_ascii=False, indent=1) + ";\n"
)
(root / "web/assets/js/data.js").write_text(js, encoding="utf-8")
print(f"Đã ghi {len(products)} sản phẩm vào web/assets/js/data.js")
