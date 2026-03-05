#!/usr/bin/env python3

from __future__ import annotations

import subprocess
import sys
from pathlib import Path

PROJECT_ROOT = Path(__file__).resolve().parent.parent
INPUT_FONT_PATH = PROJECT_ROOT / "fonts" / "STKaiti-full.woff2"
OUTPUT_FONT_PATH = PROJECT_ROOT / "fonts" / "STKaiti-subset.woff2"
CHARS_FILE_PATH = PROJECT_ROOT / "fonts" / "STKaiti-subset-chars.txt"

SOURCE_FILES = (
    "index.html",
    "style.css",
    "app.js",
    "house-price-data.js",
    "house-price-data-nbs-70.js",
    "house-price-data.json",
    "house-price-data-nbs-70.json",
)

EXTRA_SAFE_TEXT = (
    "房价可视化数据来源一座独立屋环比同比涨幅累计跌幅区间峰值最新指数起点终点城市设置时间对比"
    "中原领先国家统计局二手住宅销售价格北京上海广州深圳天津重庆香港澳门台湾中国月年日"
)


def add_range(code_points: set[int], start: int, end: int) -> None:
    for value in range(start, end + 1):
        code_points.add(value)


def collect_text_code_points(text: str, code_points: set[int]) -> None:
    for char in text:
        code_point = ord(char)
        if code_point < 0x20 and code_point not in (0x09, 0x0A, 0x0D):
            continue
        code_points.add(code_point)


def collect_source_code_points(code_points: set[int]) -> None:
    for relative_path in SOURCE_FILES:
        absolute_path = PROJECT_ROOT / relative_path
        if not absolute_path.exists():
            continue
        content = absolute_path.read_text(encoding="utf-8", errors="ignore")
        collect_text_code_points(content, code_points)
    collect_text_code_points(EXTRA_SAFE_TEXT, code_points)


def build_chars_text(code_points: set[int]) -> str:
    return "".join(chr(code_point) for code_point in sorted(code_points))


def run_subset(input_font: Path, output_font: Path, chars_file: Path) -> None:
    args = [
        sys.executable,
        "-m",
        "fontTools.subset",
        str(input_font),
        f"--output-file={output_font}",
        "--flavor=woff2",
        f"--text-file={chars_file}",
        "--layout-features=*",
        "--name-IDs=*",
        "--name-languages=*",
        "--name-legacy",
        "--notdef-glyph",
        "--notdef-outline",
        "--recommended-glyphs",
        "--symbol-cmap",
        "--legacy-cmap",
    ]
    subprocess.run(args, cwd=PROJECT_ROOT, check=True)


def format_number(value: int) -> str:
    return f"{value:,}"


def ensure_dependencies_ready() -> bool:
    check_args = [sys.executable, "-c", "import fontTools; import brotli"]
    result = subprocess.run(check_args, cwd=PROJECT_ROOT, capture_output=True, text=True)
    return result.returncode == 0


def main() -> int:
    if not INPUT_FONT_PATH.exists():
        print(f"input font not found: {INPUT_FONT_PATH}")
        return 1
    if not ensure_dependencies_ready():
        print("python dependencies missing. Run: python3 -m pip install --user fonttools brotli")
        return 1

    code_points: set[int] = set()
    add_range(code_points, 0x20, 0x7E)
    code_points.add(0x00A0)
    add_range(code_points, 0x2000, 0x206F)
    add_range(code_points, 0x3000, 0x303F)
    add_range(code_points, 0xFF00, 0xFFEF)
    collect_source_code_points(code_points)

    chars_text = build_chars_text(code_points)
    CHARS_FILE_PATH.parent.mkdir(parents=True, exist_ok=True)
    CHARS_FILE_PATH.write_text(chars_text, encoding="utf-8")

    try:
        run_subset(INPUT_FONT_PATH, OUTPUT_FONT_PATH, CHARS_FILE_PATH)
    except subprocess.CalledProcessError as error:
        print(f"subset failed with exit code {error.returncode}")
        return error.returncode or 1

    source_size = INPUT_FONT_PATH.stat().st_size
    subset_size = OUTPUT_FONT_PATH.stat().st_size
    saved_bytes = source_size - subset_size
    saved_ratio = (saved_bytes / source_size * 100) if source_size > 0 else 0

    print(f"input : {INPUT_FONT_PATH}")
    print(f"output: {OUTPUT_FONT_PATH}")
    print(f"chars : {format_number(len(code_points))}")
    print(f"size  : {format_number(source_size)} -> {format_number(subset_size)} bytes")
    print(f"saved : {format_number(saved_bytes)} bytes ({saved_ratio:.2f}%)")
    return 0


if __name__ == "__main__":
    sys.exit(main())
