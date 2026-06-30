#!/usr/bin/env python3
"""slowave 블로그 OG 이미지(1200x630 PNG) 생성기.

Pillow(PIL)만 사용한다. dark navy 배경 + 잔잔한 wave/gradient + slowave 워드마크 +
카테고리 라벨로 단순하고 차분한 카드를 만든다. 실명은 넣지 않는다.

사용:  python3 scripts/generate-og.py
결과:  public/og/{default,money-weekly,ai-weekly,book-review,build-note}.png

폰트가 없는 환경에서도 죽지 않도록, TTF를 찾지 못하면 기본 비트맵 폰트로 폴백한다.
(폴백 시 글자가 작게 나오므로, 가능하면 DejaVu/Noto/Liberation 계열 TTF가 설치된 환경에서 실행할 것.)
"""

import math
import os
import sys

try:
    from PIL import Image, ImageDraw, ImageFont
except ImportError:
    sys.stderr.write("Pillow가 필요합니다:  pip install Pillow\n")
    raise

W, H = 1200, 630
OUT_DIR = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), "public", "og")

# 카드 정의: (파일명, 카테고리 라벨)
CARDS = [
    ("default.png", "slowave blog"),
    ("money-weekly.png", "Money Weekly"),
    ("ai-weekly.png", "AI Weekly"),
    ("book-review.png", "Book Review"),
    ("build-note.png", "Build Note"),
]

# 다양한 배포 환경을 고려한 폰트 후보. 첫 번째로 존재하는 것을 쓴다.
_BOLD_CANDIDATES = [
    "/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf",
    "/usr/share/fonts/truetype/liberation/LiberationSans-Bold.ttf",
    "/usr/share/fonts/truetype/noto/NotoSans-Bold.ttf",
    "/usr/share/fonts/opentype/noto/NotoSans-Bold.ttf",
    "/Library/Fonts/Arial Bold.ttf",
    "/System/Library/Fonts/Supplemental/Arial Bold.ttf",
]
_REGULAR_CANDIDATES = [
    "/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf",
    "/usr/share/fonts/truetype/liberation/LiberationSans-Regular.ttf",
    "/usr/share/fonts/truetype/noto/NotoSans-Regular.ttf",
    "/usr/share/fonts/opentype/noto/NotoSans-Regular.ttf",
    "/Library/Fonts/Arial.ttf",
    "/System/Library/Fonts/Supplemental/Arial.ttf",
]


def _scan_fonts(prefer_bold):
    """폰트 디렉터리를 훑어 쓸 만한 .ttf/.otf 경로를 찾는다."""
    roots = ["/usr/share/fonts", "/usr/local/share/fonts", os.path.expanduser("~/.fonts")]
    found = []
    for root in roots:
        if not os.path.isdir(root):
            continue
        for dirpath, _dirs, files in os.walk(root):
            for name in files:
                if name.lower().endswith((".ttf", ".otf")):
                    found.append(os.path.join(dirpath, name))
    if not found:
        return None
    key = "bold"
    if prefer_bold:
        bold = [p for p in found if key in os.path.basename(p).lower()]
        if bold:
            return sorted(bold)[0]
    return sorted(found)[0]


def _resolve(candidates, prefer_bold):
    for path in candidates:
        if os.path.isfile(path):
            return path
    return _scan_fonts(prefer_bold)


_BOLD_PATH = _resolve(_BOLD_CANDIDATES, prefer_bold=True)
_REGULAR_PATH = _resolve(_REGULAR_CANDIDATES, prefer_bold=False)


def font(size, bold=False):
    path = _BOLD_PATH if bold else (_REGULAR_PATH or _BOLD_PATH)
    if path:
        try:
            return ImageFont.truetype(path, size)
        except OSError:
            pass
    return ImageFont.load_default()


def lerp(a, b, t):
    return tuple(round(a[i] + (b[i] - a[i]) * t) for i in range(3))


def draw_tracked_text(draw, xy, text, fnt, fill, tracking=0):
    """글자 사이 간격(tracking, px)을 줘서 우아하게 그린다. 그린 폭을 반환."""
    x, y = xy
    start_x = x
    for ch in text:
        draw.text((x, y), ch, font=fnt, fill=fill)
        w = draw.textlength(ch, font=fnt)
        x += w + tracking
    return x - tracking - start_x if text else 0


def build_card(label):
    img = Image.new("RGB", (W, H), (11, 17, 32))
    draw = ImageDraw.Draw(img, "RGBA")

    # 1) 세로 그라데이션 (위 어두운 네이비 → 아래 약간 밝은 슬레이트)
    top, bottom = (8, 13, 26), (17, 26, 46)
    for y in range(H):
        draw.line([(0, y), (W, y)], fill=lerp(top, bottom, y / H))

    # 2) 우상단 은은한 글로우 (blue/teal)
    glow = Image.new("RGBA", (W, H), (0, 0, 0, 0))
    gdraw = ImageDraw.Draw(glow)
    gdraw.ellipse([W - 520, -260, W + 180, 360], fill=(37, 99, 235, 70))
    gdraw.ellipse([W - 300, -160, W + 120, 200], fill=(20, 184, 166, 55))
    img.paste(Image.alpha_composite(img.convert("RGBA"), glow).convert("RGB"), (0, 0))
    draw = ImageDraw.Draw(img, "RGBA")

    # 3) 잔잔한 wave (slowave 모티프) — 하단에 낮은 투명도 사인 곡선 몇 줄
    for i, (amp, base, alpha, step) in enumerate([
        (26, 470, 60, 6), (34, 520, 45, 6), (20, 560, 32, 6),
    ]):
        pts = []
        phase = i * 1.1
        for x in range(0, W + step, step):
            y = base + amp * math.sin(x / 150.0 + phase)
            pts.append((x, y))
        draw.line(pts, fill=(120, 170, 255, alpha), width=3, joint="curve")

    # 4) 카테고리 pill (좌상단)
    pill_font = font(30, bold=True)
    label_up = label.upper()
    text_w = draw.textlength(label_up, font=pill_font) + (len(label_up) - 1) * 4
    px, py = 90, 92
    pad_x, pad_h = 28, 56
    try:
        draw.rounded_rectangle([px, py, px + text_w + pad_x * 2, py + pad_h], radius=pad_h // 2,
                               fill=(37, 99, 235, 38), outline=(120, 170, 255, 120), width=2)
    except AttributeError:
        draw.rectangle([px, py, px + text_w + pad_x * 2, py + pad_h],
                       fill=(37, 99, 235, 38), outline=(120, 170, 255, 120), width=2)
    draw_tracked_text(draw, (px + pad_x, py + 12), label_up, pill_font, (203, 220, 255, 255), tracking=4)

    # 5) slowave 워드마크 (중앙 좌측, 큼직하게)
    brand_font = font(132, bold=True)
    bx, by = 86, 250
    draw.text((bx, by), "slowave", font=brand_font, fill=(245, 248, 255, 255))

    # 6) 얇은 강조선 + 도메인 (하단)
    line_y = 432
    draw.line([(bx + 6, line_y), (bx + 150, line_y)], fill=(37, 99, 235, 230), width=5)
    domain_font = font(30, bold=False)
    draw.text((bx + 4, line_y + 26), "perust.github.io", font=domain_font, fill=(148, 163, 184, 255))

    return img


def main():
    os.makedirs(OUT_DIR, exist_ok=True)
    if _BOLD_PATH is None and _REGULAR_PATH is None:
        sys.stderr.write("[warn] TTF 폰트를 찾지 못해 기본 비트맵 폰트로 폴백합니다. 결과 품질이 낮을 수 있습니다.\n")
    for filename, label in CARDS:
        img = build_card(label)
        path = os.path.join(OUT_DIR, filename)
        img.save(path, "PNG", optimize=True)
        print(f"[ok] {path}  ({label})")
    print(f"\n생성 완료: {len(CARDS)}개 → {OUT_DIR}")


if __name__ == "__main__":
    main()
