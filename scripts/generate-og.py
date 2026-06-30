#!/usr/bin/env python3
"""slowave 블로그 OG 이미지(1200x630 PNG) 생성기.

Pillow(PIL)만 사용한다. dark navy 배경 + 잔잔한 wave/gradient + slowave 워드마크 +
카테고리 라벨로 단순하고 차분한 카드를 만든다. 실명은 넣지 않는다.

두 종류를 만든다.
1) 카테고리/기본 카드 → public/og/{default,money-weekly,ai-weekly,book-review,build-note}.png
2) 글별 카드        → public/og/posts/<slug>.png  (src/content/blog/*.md 의 제목·카테고리 사용)

사용:  python3 scripts/generate-og.py
폰트가 없는 환경에서도 죽지 않도록, TTF를 찾지 못하면 기본 비트맵 폰트로 폴백한다.
한글 폰트(CJK)가 없으면 글 제목의 한글이 깨질 수 있으므로 경고만 출력하고 계속 진행한다.
(가능하면 Noto Sans CJK / Nanum 계열 폰트가 설치된 환경에서 실행할 것.)
"""

import math
import os
import re
import sys

try:
    from PIL import Image, ImageDraw, ImageFont
except ImportError:
    sys.stderr.write("Pillow가 필요합니다:  pip install Pillow\n")
    raise

W, H = 1200, 630
REPO_ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
OUT_DIR = os.path.join(REPO_ROOT, "public", "og")
POSTS_OUT_DIR = os.path.join(OUT_DIR, "posts")
BLOG_DIR = os.path.join(REPO_ROOT, "src", "content", "blog")

# 카테고리/기본 카드: (파일명, 카테고리 라벨)
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
# 한글(CJK) 제목용 폰트 후보. 글 제목은 한글이 많아 별도로 찾는다.
_CJK_CANDIDATES = [
    "/usr/share/fonts/truetype/nanum/NanumGothicBold.ttf",
    "/usr/share/fonts/truetype/nanum/NanumGothic.ttf",
    "/usr/share/fonts/opentype/noto/NotoSansCJK-Bold.ttc",
    "/usr/share/fonts/opentype/noto/NotoSansKR-Bold.otf",
    "/usr/share/fonts/opentype/noto/NotoSansCJKkr-Bold.otf",
    "/usr/share/fonts/truetype/noto/NotoSansCJK-Bold.ttc",
    "/usr/share/fonts/opentype/noto/NotoSansCJK-Regular.ttc",
    "/Library/Fonts/AppleGothic.ttf",
    "/System/Library/Fonts/AppleSDGothicNeo.ttc",
    "C:/Windows/Fonts/malgunbd.ttf",
    "C:/Windows/Fonts/malgun.ttf",
]

# CJK 폰트 파일명에 흔히 들어가는 키워드(스캔 폴백용).
_CJK_HINTS = ("cjk", "nanum", "gothic", "hang", "korean", "malgun", "gulim", "batang", "dotum", "myeongjo")


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
    if prefer_bold:
        bold = [p for p in found if "bold" in os.path.basename(p).lower()]
        if bold:
            return sorted(bold)[0]
    return sorted(found)[0]


def _scan_cjk():
    """폰트 디렉터리를 훑어 한글을 그릴 수 있을 법한 폰트를 찾는다.

    일본어 IPA Gothic도 CJK라 후보에 잡히지만 한글 글리프가 부족할 수 있다.
    따라서 Nanum/Korean/Malgun/Noto 계열을 우선하고 Japanese/IPA 계열은 후순위로 둔다.
    """
    roots = ["/usr/share/fonts", "/usr/local/share/fonts", os.path.expanduser("~/.fonts"), "/opt/data"]
    found = []
    for root in roots:
        if not os.path.isdir(root):
            continue
        for dirpath, _dirs, files in os.walk(root):
            for name in files:
                low = name.lower()
                if low.endswith((".ttf", ".otf", ".ttc")) and any(h in low for h in _CJK_HINTS):
                    found.append(os.path.join(dirpath, name))
    if not found:
        return None

    def score(path):
        low = os.path.basename(path).lower()
        full = path.lower()
        value = 0
        if "nanum" in full:
            value -= 100
        if "korean" in full or "kr" in low or "malgun" in low:
            value -= 80
        if "noto" in full and ("cjk" in full or "sans" in full):
            value -= 50
        if "bold" in low:
            value -= 20
        if "japanese" in full or "ipafont" in full or "ipa" in low:
            value += 120
        return (value, path)

    return sorted(found, key=score)[0]


def _resolve(candidates, prefer_bold):
    for path in candidates:
        if os.path.isfile(path):
            return path
    return _scan_fonts(prefer_bold)


def _resolve_cjk():
    for path in _CJK_CANDIDATES:
        if os.path.isfile(path):
            return path
    return _scan_cjk()


_BOLD_PATH = _resolve(_BOLD_CANDIDATES, prefer_bold=True)
_REGULAR_PATH = _resolve(_REGULAR_CANDIDATES, prefer_bold=False)
_CJK_PATH = _resolve_cjk()


def font(size, bold=False):
    path = _BOLD_PATH if bold else (_REGULAR_PATH or _BOLD_PATH)
    if path:
        try:
            return ImageFont.truetype(path, size)
        except OSError:
            pass
    return ImageFont.load_default()


def cjk_font(size, bold=True):
    """한글 제목용 폰트. CJK 폰트를 못 찾으면 라틴 폰트로 폴백한다(한글은 깨질 수 있음)."""
    path = _CJK_PATH or (_BOLD_PATH if bold else _REGULAR_PATH) or _BOLD_PATH or _REGULAR_PATH
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


def base_card():
    """배경(그라데이션 + 글로우 + 잔잔한 wave)만 그린 카드를 만든다. 모든 카드가 공유한다."""
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

    return img, draw


def draw_pill(draw, label, px=90, py=92):
    """카테고리 pill(좌상단)을 그린다. 라벨은 ASCII 카테고리명을 가정한다."""
    pill_font = font(30, bold=True)
    label_up = label.upper()
    text_w = draw.textlength(label_up, font=pill_font) + (len(label_up) - 1) * 4
    pad_x, pad_h = 28, 56
    try:
        draw.rounded_rectangle([px, py, px + text_w + pad_x * 2, py + pad_h], radius=pad_h // 2,
                               fill=(37, 99, 235, 38), outline=(120, 170, 255, 120), width=2)
    except AttributeError:
        draw.rectangle([px, py, px + text_w + pad_x * 2, py + pad_h],
                       fill=(37, 99, 235, 38), outline=(120, 170, 255, 120), width=2)
    draw_tracked_text(draw, (px + pad_x, py + 12), label_up, pill_font, (203, 220, 255, 255), tracking=4)


def build_card(label):
    """카테고리/기본 카드: 큰 slowave 워드마크가 주인공."""
    img, draw = base_card()
    draw_pill(draw, label)

    # slowave 워드마크 (중앙 좌측, 큼직하게)
    brand_font = font(132, bold=True)
    bx, by = 86, 250
    draw.text((bx, by), "slowave", font=brand_font, fill=(245, 248, 255, 255))

    # 얇은 강조선 + 도메인 (하단)
    line_y = 432
    draw.line([(bx + 6, line_y), (bx + 150, line_y)], fill=(37, 99, 235, 230), width=5)
    domain_font = font(30, bold=False)
    draw.text((bx + 4, line_y + 26), "perust.github.io", font=domain_font, fill=(148, 163, 184, 255))

    return img


def wrap_title(draw, text, fnt, max_width):
    """제목을 max_width 안에서 줄바꿈한다. 공백 단위 우선, 한 토큰이 너무 길면 글자 단위로 쪼갠다."""
    lines = []
    current = ""
    for word in text.split(" "):
        candidate = word if not current else current + " " + word
        if draw.textlength(candidate, font=fnt) <= max_width:
            current = candidate
            continue
        if current:
            lines.append(current)
            current = ""
        if draw.textlength(word, font=fnt) <= max_width:
            current = word
            continue
        # 단어 하나가 max_width 보다 길면 글자 단위로 분할(한글 등 공백 없는 긴 토큰 대비)
        piece = ""
        for ch in word:
            if draw.textlength(piece + ch, font=fnt) <= max_width:
                piece += ch
            else:
                if piece:
                    lines.append(piece)
                piece = ch
        current = piece
    if current:
        lines.append(current)
    return lines


def fit_title(draw, title, max_width, max_lines=3, start_size=80, min_size=46):
    """max_lines 안에 들어오도록 폰트 크기를 줄여가며 (폰트, 줄들, 크기)를 반환한다."""
    size = start_size
    while size >= min_size:
        fnt = cjk_font(size, bold=True)
        lines = wrap_title(draw, title, fnt, max_width)
        if len(lines) <= max_lines:
            return fnt, lines, size
        size -= 4
    # 최소 크기에서도 안 맞으면 max_lines로 자르고 마지막 줄 말줄임 처리
    fnt = cjk_font(min_size, bold=True)
    lines = wrap_title(draw, title, fnt, max_width)
    if len(lines) > max_lines:
        lines = lines[:max_lines]
        last = lines[-1]
        while last and draw.textlength(last + "…", font=fnt) > max_width:
            last = last[:-1]
        lines[-1] = last + "…"
    return fnt, lines, min_size


def build_post_card(title, label):
    """글별 카드: 카테고리 pill + 작은 slowave + 제목(2~3줄) + 도메인."""
    img, draw = base_card()
    draw_pill(draw, label)

    # slowave 워드마크 (우상단, 작게 — 브랜드 워터마크)
    brand_font = font(46, bold=True)
    brand_w = draw.textlength("slowave", font=brand_font)
    draw.text((W - 90 - brand_w, 100), "slowave", font=brand_font, fill=(226, 232, 240, 235))

    # 제목 (중앙 밴드, 흰색, 2~3줄 wrap)
    margin = 90
    max_width = W - margin * 2
    title_font, lines, size = fit_title(draw, title, max_width)
    line_h = int(size * 1.34)
    block_h = line_h * len(lines)
    start_y = 348 - block_h // 2
    if start_y < 200:
        start_y = 200
    y = start_y
    for line in lines:
        draw.text((margin, y), line, font=title_font, fill=(245, 248, 255, 255))
        y += line_h

    # 얇은 강조선 + 도메인 (하단)
    line_y = 548
    draw.line([(margin + 6, line_y), (margin + 150, line_y)], fill=(37, 99, 235, 230), width=5)
    domain_font = font(28, bold=False)
    draw.text((margin + 4, line_y + 20), "perust.github.io", font=domain_font, fill=(148, 163, 184, 255))

    return img


def _unquote(value):
    value = value.strip()
    if len(value) >= 2 and value[0] in "\"'" and value[-1] == value[0]:
        value = value[1:-1]
    return value.strip()


def parse_frontmatter(path):
    """글의 frontmatter에서 title/category만 뽑는다(stdlib 정규식, astro.config 방식과 동일 철학)."""
    with open(path, encoding="utf-8") as f:
        raw = f.read()
    match = re.match(r"^---\r?\n(.*?)\r?\n---", raw, re.DOTALL)
    if not match:
        return None
    block = match.group(1)

    def pick(key):
        m = re.search(r"^" + re.escape(key) + r":\s*(.+?)\s*$", block, re.MULTILINE)
        return _unquote(m.group(1)) if m else None

    return {"title": pick("title"), "category": pick("category")}


def generate_category_cards():
    count = 0
    for filename, label in CARDS:
        img = build_card(label)
        path = os.path.join(OUT_DIR, filename)
        img.save(path, "PNG", optimize=True)
        print(f"[ok] {os.path.relpath(path, REPO_ROOT)}  ({label})")
        count += 1
    return count


def generate_post_cards():
    if not os.path.isdir(BLOG_DIR):
        sys.stderr.write(f"[warn] 블로그 디렉터리를 찾지 못했습니다: {BLOG_DIR}\n")
        return 0
    os.makedirs(POSTS_OUT_DIR, exist_ok=True)
    count = 0
    for fname in sorted(os.listdir(BLOG_DIR)):
        if not fname.endswith(".md"):
            continue
        meta = parse_frontmatter(os.path.join(BLOG_DIR, fname))
        if not meta or not meta.get("title"):
            sys.stderr.write(f"[warn] title을 못 읽어 건너뜀: {fname}\n")
            continue
        slug = fname[:-3]
        label = meta.get("category") or "slowave blog"
        img = build_post_card(meta["title"], label)
        path = os.path.join(POSTS_OUT_DIR, slug + ".png")
        img.save(path, "PNG", optimize=True)
        print(f"[ok] {os.path.relpath(path, REPO_ROOT)}  ({label} · {meta['title'][:24]}…)")
        count += 1
    return count


def main():
    os.makedirs(OUT_DIR, exist_ok=True)
    if _BOLD_PATH is None and _REGULAR_PATH is None:
        sys.stderr.write("[warn] TTF 폰트를 찾지 못해 기본 비트맵 폰트로 폴백합니다. 결과 품질이 낮을 수 있습니다.\n")
    if _CJK_PATH is None:
        sys.stderr.write("[warn] 한글(CJK) 폰트를 찾지 못했습니다. 글 제목의 한글이 깨질 수 있으니 Noto Sans CJK/Nanum 설치를 권장합니다.\n")
    else:
        print(f"[info] CJK 폰트: {_CJK_PATH}")

    n_cat = generate_category_cards()
    n_post = generate_post_cards()
    print(f"\n생성 완료: 카테고리 {n_cat}개 → {OUT_DIR}, 글 {n_post}개 → {POSTS_OUT_DIR}")


if __name__ == "__main__":
    main()
