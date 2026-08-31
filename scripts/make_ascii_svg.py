"""
Generate ascii-portrait.svg — a terminal-window framed ASCII art that
types itself in row by row (SMIL animation, works on GitHub).

If a prepped portrait image exists (source-prepped.png), it converts
the photo to ASCII. Otherwise it generates a stylish geometric
placeholder with the user's initials.

Usage:
  python scripts/make_ascii_svg.py                     # placeholder
  python scripts/make_ascii_svg.py source-prepped.png  # from photo

Output: ascii-portrait.svg (beside README.md in repo root)
"""
import html as html_mod
import os
import sys

HERE = os.path.dirname(os.path.abspath(__file__))
OUT = os.path.join(HERE, "..", "ascii-portrait.svg")

SVG_W = 370
SVG_H = 387    # matches wordmark height
TITLEBAR_H = 30
PAD_TOP = 45
LINE_H = 13
FONT_SIZE = 11
BG = "#0d1117"
BG2 = "#0a0e14"
FRAME = "#30363d"
INK = "#c9d1d9"
DIM = "#7d8590"
ACCENT = "#39d353"


def placeholder_lines():
    """Cool geometric ASCII art with VISHANT initials."""
    return [
        "                                        ",
        "     ╔══════════════════════════════╗    ",
        "     ║  ██╗   ██╗ ██████╗          ║    ",
        "     ║  ██║   ██║██╔════╝          ║    ",
        "     ║  ██║   ██║██║  ███╗         ║    ",
        "     ║  ╚██╗ ██╔╝██║   ██║         ║    ",
        "     ║   ╚████╔╝ ╚██████╔╝         ║    ",
        "     ║    ╚═══╝   ╚═════╝          ║    ",
        "     ╠══════════════════════════════╣    ",
        "     ║                              ║    ",
        "     ║   > Vishant Giri             ║    ",
        "     ║   > Frontend Developer       ║    ",
        "     ║   > Creative Coder           ║    ",
        "     ║   > Web Builder              ║    ",
        "     ║                              ║    ",
        "     ║   ┌──────────────────────┐   ║    ",
        "     ║   │  ████  █ ██ █  █ ███ │   ║    ",
        "     ║   │  █   █ █ ██ █  █   █ │   ║    ",
        "     ║   │  ████  █ █ ██  █  █  │   ║    ",
        "     ║   │  █   █ █ █  █  █ █   │   ║    ",
        "     ║   │  ████  █ █  █  █ ███ │   ║    ",
        "     ║   └──────────────────────┘   ║    ",
        "     ║                              ║    ",
        "     ║   $ echo 'Hello, World!'     ║    ",
        "     ║   Hello, World!              ║    ",
        "     ║   $ _                        ║    ",
        "     ╚══════════════════════════════╝    ",
        "                                        ",
    ]


def photo_lines(src_path):
    """Convert a grayscale image to ASCII lines."""
    try:
        from PIL import Image, ImageEnhance
    except ImportError:
        print("Pillow not installed — falling back to placeholder")
        return placeholder_lines()

    COLS, ROWS = 44, 24
    RAMP = " .`:-=+*cs#%@"

    im = Image.open(src_path).convert("L")
    im = ImageEnhance.Contrast(im).enhance(1.15)
    im = im.resize((COLS, ROWS), Image.LANCZOS)
    px = im.load()

    lines = []
    for y in range(ROWS):
        chars = []
        for x in range(COLS):
            lum = px[x, y] / 255.0
            if lum >= 0.85:
                chars.append(" ")
            else:
                idx = int((1.0 - lum) * (len(RAMP) - 1))
                idx = min(idx, len(RAMP) - 1)
                chars.append(RAMP[idx])
        lines.append("".join(chars))
    return lines


def build_svg(lines):
    """Wrap ASCII lines in a terminal-frame SVG with row-by-row reveal."""
    art_h = len(lines) * LINE_H
    total_h = max(SVG_H, TITLEBAR_H + PAD_TOP - TITLEBAR_H + art_h + 20)

    rows_svg = []
    for i, line in enumerate(lines):
        escaped = html_mod.escape(line)
        delay = 0.4 + i * 0.08
        y = PAD_TOP + i * LINE_H
        # SMIL: each row clips from left to right
        rows_svg.append(
            f'  <text x="18" y="{y}" fill="{INK}" font-family="monospace" '
            f'font-size="{FONT_SIZE}" xml:space="preserve" opacity="0">'
            f'{escaped}'
            f'<animate attributeName="opacity" from="0" to="1" '
            f'begin="{delay:.2f}s" dur="0.05s" fill="freeze"/>'
            f'</text>'
        )

    joined = "\n".join(rows_svg)

    svg = f'''<svg xmlns="http://www.w3.org/2000/svg" width="{SVG_W}" height="{SVG_H}" viewBox="0 0 {SVG_W} {SVG_H}">
  <!-- terminal frame -->
  <rect fill="{BG}" x="0" y="0" width="{SVG_W}" height="{SVG_H}" rx="8" />
  <rect fill="{BG2}" x="0" y="0" width="{SVG_W}" height="{TITLEBAR_H}" rx="8" />
  <rect fill="{BG2}" x="0" y="20" width="{SVG_W}" height="10" />

  <!-- traffic lights -->
  <circle fill="#ff5f56" cx="18" cy="15" r="5" />
  <circle fill="#ffbd2e" cx="34" cy="15" r="5" />
  <circle fill="#27c93f" cx="50" cy="15" r="5" />
  <text fill="{DIM}" font-family="monospace" font-size="12" x="{SVG_W/2}" y="19" text-anchor="middle">~/portrait</text>

  <!-- ASCII art (row-by-row reveal) -->
{joined}
</svg>
'''
    return svg


def main():
    src = sys.argv[1] if len(sys.argv) > 1 else os.path.join(HERE, "..", "source-prepped.png")

    if os.path.isfile(src):
        print(f"Converting {src} to ASCII portrait…")
        lines = photo_lines(src)
    else:
        print("No source photo found — using placeholder art")
        lines = placeholder_lines()

    svg = build_svg(lines)
    with open(OUT, "w", encoding="utf-8") as f:
        f.write(svg)
    print(f"Rendered {OUT}")


if __name__ == "__main__":
    main()
