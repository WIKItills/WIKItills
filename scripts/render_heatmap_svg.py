import json
import os
from datetime import datetime

COLORS = ["#161b22", "#0e4429", "#006d32", "#26a641", "#39d353", "#69f0a0"]

def get_color_level(count):
    if count == 0: return 0
    if count <= 5: return 1
    if count <= 15: return 2
    if count <= 30: return 3
    if count <= 50: return 4
    return 5

def main():
    try:
        with open("data/contributions.json", "r") as f:
            data = json.load(f)
    except FileNotFoundError:
        print("data/contributions.json not found. Run fetch_contributions.py first.")
        return

    weeks = []
    current_week = []
    
    for c in data["contributions"]:
        dt = datetime.strptime(c["date"], "%Y-%m-%d")
        c["weekday"] = dt.weekday()
        current_week.append(c)
        if dt.weekday() == 5: # Saturday in github is end of week (Sunday is 0 in GitHub, let's just group by 7)
            pass
            
    # Actually just reconstruct 53 weeks x 7 days based on the list since github provides it in order
    weeks = [data["contributions"][i:i+7] for i in range(0, len(data["contributions"]), 7)]
    
    cell_size = 12
    gap = 3
    svg_width = 860
    svg_height = 240
    
    svg = f'''<svg xmlns="http://www.w3.org/2000/svg" width="{svg_width}" height="{svg_height}" viewBox="0 0 {svg_width} {svg_height}">
    <defs>
        <style>
            .frame {{ fill: #0d1420; rx: 8px; stroke: #30363d; stroke-width: 1px; }}
            .title-bar {{ fill: #0a0e14; rx: 8px; }}
            .title-text {{ fill: #7d8590; font-family: monospace; font-size: 12px; }}
            .dot {{ fill: #30363d; }}
            .dot-red {{ fill: #ff5f56; }}
            .dot-yellow {{ fill: #ffbd2e; }}
            .dot-green {{ fill: #27c93f; }}
            .label {{ fill: #7d8590; font-family: sans-serif; font-size: 10px; }}
            .stat-value {{ fill: #e6edf3; font-family: sans-serif; font-size: 16px; font-weight: bold; }}
            .stat-label {{ fill: #7d8590; font-family: sans-serif; font-size: 10px; text-transform: uppercase; }}
            
            .cell {{ rx: 3px; ry: 3px; opacity: 0; animation: reveal 1s forwards; }}
            @keyframes reveal {{
                0% {{ opacity: 0; transform: scale(0.5); }}
                100% {{ opacity: 1; transform: scale(1); }}
            }}
        </style>
    </defs>
    
    <rect class="frame" x="0" y="0" width="{svg_width}" height="{svg_height}" />
    <path class="title-bar" d="M0 8 C0 3.58 3.58 0 8 0 L{svg_width-8} 0 C{svg_width-3.58} 0 {svg_width} 3.58 {svg_width} 8 L{svg_width} 30 L0 30 Z" />
    
    <circle class="dot-red" cx="20" cy="15" r="5" />
    <circle class="dot-yellow" cx="35" cy="15" r="5" />
    <circle class="dot-green" cx="50" cy="15" r="5" />
    <text class="title-text" x="430" y="19" text-anchor="middle">~/contributions</text>
    
    <g transform="translate(40, 50)">
'''

    # Day labels
    svg += '<text class="label" x="-20" y="22">Mon</text>'
    svg += '<text class="label" x="-20" y="52">Wed</text>'
    svg += '<text class="label" x="-20" y="82">Fri</text>'

    # Heatmap cells
    for i, week in enumerate(weeks):
        x = i * (cell_size + gap)
        for j, day in enumerate(week):
            y = j * (cell_size + gap)
            level = get_color_level(day["count"])
            color = COLORS[level]
            delay = (i + j) * 0.015
            svg += f'<rect class="cell" x="{x}" y="{y}" width="{cell_size}" height="{cell_size}" fill="{color}" style="animation-delay: {delay}s;" />\n'

    svg += '</g>\n'
    
    # Legend
    legend_x = 40 + len(weeks) * (cell_size + gap) - 5 * (cell_size + gap) - 40
    legend_y = 50 + 7 * (cell_size + gap) + 10
    svg += f'<text class="label" x="{legend_x - 30}" y="{legend_y + 10}">Less</text>'
    for i, color in enumerate(COLORS):
        x = legend_x + i * (cell_size + gap)
        svg += f'<rect x="{x}" y="{legend_y}" width="{cell_size}" height="{cell_size}" rx="3" ry="3" fill="{color}" />\n'
    svg += f'<text class="label" x="{legend_x + len(COLORS) * (cell_size + gap) + 5}" y="{legend_y + 10}">More</text>'

    # Stats Footer
    footer_y = 200
    stats = [
        ("Total Contributions", f"{data['total_contributions']:,}"),
        ("Current Streak", f"{data['current_streak']} days"),
        ("Longest Streak", f"{data['longest_streak']} days"),
        ("Best Day", f"{data['best_day']}")
    ]
    
    for i, (label, value) in enumerate(stats):
        x = 60 + i * 200
        svg += f'<text class="stat-value" x="{x}" y="{footer_y}">{value}</text>\n'
        svg += f'<text class="stat-label" x="{x}" y="{footer_y + 15}">{label}</text>\n'

    svg += '</svg>'
    
    with open("contrib-heatmap.svg", "w") as f:
        f.write(svg)
    print("Rendered contrib-heatmap.svg")

if __name__ == "__main__":
    main()
