"""
Render "VISHANT" as an EXTRUDED 3D wordmark SVG with animated rocking effect.
Self-contained — no external font dependencies.
Uses CSS text-shadow layers to fake 3D extrusion + SMIL wipe-reveal + rock animation.
Output: wordmark.svg (beside README.md in repo root)
"""
import os

HERE = os.path.dirname(os.path.abspath(__file__))
OUT = os.path.join(HERE, "..", "wordmark.svg")

TEXT = os.environ.get("WORDMARK_TEXT", "VISHANT")


def main():
    svg_width = 490
    svg_height = 387   # matched to sit beside the 370-wide portrait at same height
    cx = svg_width / 2
    cy = svg_height / 2 + 15

    # Number of extrusion layers (bottom = darkest, top = brightest)
    layers = [
        (8, 8, "#0e4429"),   # deepest shadow
        (6, 6, "#006d32"),
        (4, 4, "#26a641"),
        (2, 2, "#39d353"),   # bright edge
        (0, 0, "#c9d1d9"),   # face — the topmost layer
    ]

    title_text_content = "~/wordmark"

    svg = f'''<svg xmlns="http://www.w3.org/2000/svg" width="{svg_width}" height="{svg_height}" viewBox="0 0 {svg_width} {svg_height}">
  <defs>
    <style>
      .wm-frame {{ fill: #0d1117; }}
      .wm-titlebar {{ fill: #0a0e14; }}
      .wm-dot-r {{ fill: #ff5f56; }}
      .wm-dot-y {{ fill: #ffbd2e; }}
      .wm-dot-g {{ fill: #27c93f; }}
      .wm-title {{ fill: #7d8590; font-family: monospace; font-size: 12px; }}

      .wm-layer {{
        font-family: "Courier New", Courier, monospace;
        font-weight: 900;
        font-size: 72px;
        letter-spacing: 6px;
        text-anchor: middle;
        dominant-baseline: central;
      }}

      /* left-to-right wipe reveal */
      .wm-wipe {{
        clip-path: inset(0 100% 0 0);
        animation: wm-wipe 1.2s cubic-bezier(0.22, 1, 0.36, 1) 0.3s forwards;
      }}
      @keyframes wm-wipe {{
        to {{ clip-path: inset(0 0 0 0); }}
      }}

      /* subtle rocking after reveal */
      .wm-rock {{
        transform-origin: {cx}px {cy}px;
        animation: wm-rock 5s ease-in-out 1.8s infinite alternate;
      }}
      @keyframes wm-rock {{
        0%   {{ transform: rotate(-2.5deg) translateY(0); }}
        100% {{ transform: rotate(2.5deg) translateY(-4px); }}
      }}
    </style>
  </defs>

  <!-- terminal frame -->
  <rect class="wm-frame" x="0" y="0" width="{svg_width}" height="{svg_height}" rx="8" />
  <rect class="wm-titlebar" x="0" y="0" width="{svg_width}" height="30" rx="8" />
  <rect class="wm-titlebar" x="0" y="20" width="{svg_width}" height="10" />

  <!-- traffic lights -->
  <circle class="wm-dot-r" cx="18" cy="15" r="5" />
  <circle class="wm-dot-y" cx="34" cy="15" r="5" />
  <circle class="wm-dot-g" cx="50" cy="15" r="5" />
  <text class="wm-title" x="{svg_width/2}" y="19" text-anchor="middle">{title_text_content}</text>

  <!-- extruded wordmark -->
  <g class="wm-wipe">
    <g class="wm-rock">
'''

    for dx, dy, color in layers:
        svg += f'      <text class="wm-layer" fill="{color}" x="{cx + dx}" y="{cy + dy}">{TEXT}</text>\n'

    svg += '''    </g>
  </g>
</svg>
'''

    with open(OUT, "w", encoding="utf-8") as f:
        f.write(svg)
    print(f"Rendered {OUT}")


if __name__ == "__main__":
    main()
