/**
 * generate_all_svgs.js
 * 
 * Downloads the user's GitHub avatar, converts it to a monochrome ASCII
 * portrait SVG (like AVIVASHISHTA29's avi-ascii.svg), generates a 3D
 * figlet-style wordmark SVG, and fetches real contribution data to
 * render a heatmap SVG.
 * 
 * Usage: node scripts/generate_all_svgs.js
 */
const https = require('https');
const http = require('http');
const fs = require('fs');
const path = require('path');
const sharp = require('sharp');

const USERNAME = 'WIKItills';
const DISPLAY_NAME = 'VISHANT';
const ROOT = path.join(__dirname, '..');

// ─── Colors (GitHub dark theme) ──────────────────────────────────────
const BG    = '#0d1117';
const BG2   = '#111722';
const FRAME = '#30363d';
const INK   = '#c9d1d9';
const DIM   = '#7d8590';

// ═══════════════════════════════════════════════════════════════════════
// 1. ASCII PORTRAIT from GitHub avatar
// ═══════════════════════════════════════════════════════════════════════
const COLS = 80;
const ROWS = 42;
const CELL_W = 7.2;
const CELL_H = 13;
const RAMP = ' .`\':-~=+*cs%#@';  // light → dense

async function downloadImage(url) {
  return new Promise((resolve, reject) => {
    const get = url.startsWith('https') ? https.get : http.get;
    get(url, (res) => {
      if (res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
        return downloadImage(res.headers.location).then(resolve).catch(reject);
      }
      const chunks = [];
      res.on('data', c => chunks.push(c));
      res.on('end', () => resolve(Buffer.concat(chunks)));
      res.on('error', reject);
    }).on('error', reject);
  });
}

async function generatePortraitSVG() {
  console.log('Downloading avatar...');
  const avatarUrl = `https://avatars.githubusercontent.com/u/107662991?v=4`;
  const imgBuf = await downloadImage(avatarUrl);

  console.log('Converting to grayscale...');
  const { data, info } = await sharp(imgBuf)
    .resize(COLS, ROWS, { fit: 'cover' })
    .grayscale()
    .normalise()
    .raw()
    .toBuffer({ resolveWithObject: true });

  // Build ASCII rows
  const asciiRows = [];
  for (let y = 0; y < ROWS; y++) {
    let row = '';
    for (let x = 0; x < COLS; x++) {
      const lum = data[y * COLS + x] / 255.0;
      // Invert: dark pixels → dense chars, light pixels → sparse
      const idx = Math.floor((1 - lum) * (RAMP.length - 1));
      row += RAMP[Math.min(idx, RAMP.length - 1)];
    }
    asciiRows.push(row);
  }

  // SVG dimensions
  const PAD = 16;
  const TITLEBAR_H = 28;
  const artW = COLS * CELL_W;
  const artH = ROWS * CELL_H;
  const svgW = artW + PAD * 2;
  const svgH = TITLEBAR_H + artH + PAD;

  // Row-by-row reveal timing
  const ROW_DUR = 0.08;
  const STAGGER = 0.08;

  let textEls = '';
  for (let i = 0; i < asciiRows.length; i++) {
    const escaped = asciiRows[i]
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
    const y = TITLEBAR_H + 12 + i * CELL_H;
    const begin = (0.3 + i * STAGGER).toFixed(2);
    
    textEls += `  <text x="${PAD}" y="${y}" fill="${INK}" font-family="'Courier New',Courier,monospace" font-size="11" xml:space="preserve" opacity="0">${escaped}<animate attributeName="opacity" from="0" to="1" begin="${begin}s" dur="${ROW_DUR}s" fill="freeze"/></text>\n`;
  }

  // Blinking cursor on last row
  const cursorY = TITLEBAR_H + 12 + asciiRows.length * CELL_H + 5;
  const cursorBegin = (0.3 + asciiRows.length * STAGGER + 0.5).toFixed(2);
  textEls += `  <rect x="${PAD}" y="${cursorY - 10}" width="7" height="13" fill="${INK}">
    <animate attributeName="opacity" values="1;0;1" dur="1s" begin="${cursorBegin}s" repeatCount="indefinite"/>
  </rect>\n`;

  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${svgW}" height="${svgH}" viewBox="0 0 ${svgW} ${svgH}">
  <!-- terminal frame -->
  <rect fill="${BG}" width="${svgW}" height="${svgH}" rx="8"/>
  <rect fill="${BG2}" width="${svgW}" height="${TITLEBAR_H}" rx="8"/>
  <rect fill="${BG2}" x="0" y="18" width="${svgW}" height="10"/>
  <!-- traffic lights -->
  <circle fill="#ff5f56" cx="18" cy="14" r="5.5"/>
  <circle fill="#ffbd2e" cx="36" cy="14" r="5.5"/>
  <circle fill="#27c93f" cx="54" cy="14" r="5.5"/>
  <text fill="${DIM}" font-family="monospace" font-size="12" x="${svgW/2}" y="18" text-anchor="middle">${USERNAME.toLowerCase()}@github: ~$ ./portrait.sh</text>
  <!-- ASCII art -->
${textEls}</svg>`;

  const out = path.join(ROOT, 'ascii-portrait.svg');
  fs.writeFileSync(out, svg, 'utf8');
  console.log(`✓ Portrait → ${out}  (${svgW}x${svgH})`);
  return { w: svgW, h: svgH };
}

// ═══════════════════════════════════════════════════════════════════════
// 2. 3D ASCII WORDMARK (figlet-style, like Avi's "AVI" in $ chars)
// ═══════════════════════════════════════════════════════════════════════

// Each letter defined as a 7-row bitmap string
const FONT = {
  V: [
    'S$$$$$    S$$$$$',
    ' S$$$$$  S$$$$$ ',
    '  S$$$$SS$$$$$  ',
    '   S$$$$$$$$S   ',
    '    S$$$$$$S    ',
    '     S$$$$S     ',
    '      S$$S      ',
  ],
  I: [
    ' S$$$$$$S ',
    '   S$$S   ',
    '   S$$S   ',
    '   S$$S   ',
    '   S$$S   ',
    '   S$$S   ',
    ' S$$$$$$S ',
  ],
  S: [
    '  S$$$$$$S  ',
    ' S$$S       ',
    ' S$$$$S     ',
    '  S$$$$$$S  ',
    '      S$$S  ',
    '      S$$S  ',
    ' S$$$$$$S   ',
  ],
  H: [
    'S$$S    S$$S',
    'S$$S    S$$S',
    'S$$S    S$$S',
    'S$$$$$$$$$$S',
    'S$$S    S$$S',
    'S$$S    S$$S',
    'S$$S    S$$S',
  ],
  A: [
    '   *S$$$$S*   ',
    '  S$$S  S$$S  ',
    ' S$$S    S$$S ',
    ' S$$$$$$$$$$S ',
    ' S$$S    S$$S ',
    ' S$$S    S$$S ',
    ' S$$S    S$$S ',
  ],
  N: [
    'S$$S      S$$S',
    'S$$$S     S$$S',
    'S$$$$S    S$$S',
    'S$$S$$S   S$$S',
    'S$$S S$$S S$$S',
    'S$$S  S$$$S$$S',
    'S$$S    S$$$$S',
  ],
  T: [
    'S$$$$$$$$$$$$S',
    '     S$$S     ',
    '     S$$S     ',
    '     S$$S     ',
    '     S$$S     ',
    '     S$$S     ',
    '     S$$S     ',
  ],
};

function generateWordmarkSVG(portraitH) {
  // Build the text grid
  const letters = DISPLAY_NAME.split('');
  const GAP = 2; // chars gap between letters
  const numRows = 7;

  // Combine letters into full rows
  const fullRows = [];
  for (let r = 0; r < numRows; r++) {
    let line = '';
    for (let li = 0; li < letters.length; li++) {
      const ch = letters[li].toUpperCase();
      const glyph = FONT[ch];
      if (!glyph) { line += '              '; continue; }
      line += glyph[r];
      if (li < letters.length - 1) line += ' '.repeat(GAP);
    }
    fullRows.push(line);
  }

  // Trim common leading whitespace
  const minIndent = Math.min(...fullRows.map(r => r.search(/\S/) === -1 ? Infinity : r.search(/\S/)));
  const trimmed = fullRows.map(r => r.slice(minIndent));

  const WM_CELL_W = 8.5;
  const WM_CELL_H = 22;
  const maxCols = Math.max(...trimmed.map(r => r.length));
  const PAD = 20;
  const TITLEBAR_H = 28;
  const artW = maxCols * WM_CELL_W;
  const artH = numRows * WM_CELL_H;
  const svgW = artW + PAD * 2;
  const svgH = Math.max(portraitH, TITLEBAR_H + artH + PAD * 3);

  // 3D extrusion: draw text multiple times with offset
  // Bottom layers = darker green, top = bright
  const layers = [
    { dx: 4, dy: 4, fill: '#0e4429' },
    { dx: 3, dy: 3, fill: '#006d32' },
    { dx: 2, dy: 2, fill: '#26a641' },
    { dx: 1, dy: 1, fill: '#39d353' },
    { dx: 0, dy: 0, fill: INK },
  ];

  let textEls = '';
  for (const layer of layers) {
    for (let i = 0; i < trimmed.length; i++) {
      const escaped = trimmed[i]
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;');
      const x = PAD + layer.dx;
      const y = TITLEBAR_H + PAD + 16 + i * WM_CELL_H + layer.dy;
      // Center vertically
      const yOff = (svgH - TITLEBAR_H - artH) / 2;
      textEls += `  <text x="${x}" y="${y + yOff - PAD}" fill="${layer.fill}" font-family="'Courier New',Courier,monospace" font-size="16" font-weight="bold" xml:space="preserve">${escaped}</text>\n`;
    }
  }

  // Wipe reveal animation: clip-path from left to right
  const wipeBegin = '0.3s';
  const wipeDur = '1.2s';

  // Rock animation: gentle oscillation via SMIL animateTransform
  const rockBegin = '1.8s';
  const cx = svgW / 2;
  const cy = svgH / 2;

  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${svgW}" height="${svgH}" viewBox="0 0 ${svgW} ${svgH}">
  <defs>
    <clipPath id="wipe">
      <rect x="0" y="0" width="${svgW}" height="${svgH}">
        <animate attributeName="width" from="0" to="${svgW}" begin="${wipeBegin}" dur="${wipeDur}" fill="freeze"/>
      </rect>
    </clipPath>
  </defs>
  <!-- terminal frame -->
  <rect fill="${BG}" width="${svgW}" height="${svgH}" rx="8"/>
  <rect fill="${BG2}" width="${svgW}" height="${TITLEBAR_H}" rx="8"/>
  <rect fill="${BG2}" x="0" y="18" width="${svgW}" height="10"/>
  <!-- traffic lights -->
  <circle fill="#ff5f56" cx="18" cy="14" r="5.5"/>
  <circle fill="#ffbd2e" cx="36" cy="14" r="5.5"/>
  <circle fill="#27c93f" cx="54" cy="14" r="5.5"/>
  <text fill="${DIM}" font-family="monospace" font-size="12" x="${svgW/2}" y="18" text-anchor="middle">${USERNAME.toLowerCase()}@github: ~$ ./wordmark.sh --3d</text>
  <!-- 3D ASCII wordmark with wipe + rock -->
  <g clip-path="url(#wipe)">
    <g>
      <animateTransform attributeName="transform" type="rotate" values="-2 ${cx} ${cy};2 ${cx} ${cy};-2 ${cx} ${cy}" dur="6s" begin="${rockBegin}" repeatCount="indefinite"/>
${textEls}    </g>
  </g>
</svg>`;

  const out = path.join(ROOT, 'wordmark.svg');
  fs.writeFileSync(out, svg, 'utf8');
  console.log(`✓ Wordmark → ${out}  (${svgW}x${svgH})`);
}

// ═══════════════════════════════════════════════════════════════════════
// 3. CONTRIBUTION HEATMAP (fetch real data from GitHub)
// ═══════════════════════════════════════════════════════════════════════
async function fetchContributions() {
  console.log('Fetching contribution data...');
  const url = `https://github.com/users/${USERNAME}/contributions`;
  const html = await new Promise((resolve, reject) => {
    https.get(url, { headers: { 'User-Agent': 'profile-readme-bot/1.0' } }, (res) => {
      let d = '';
      res.on('data', c => d += c);
      res.on('end', () => resolve(d));
      res.on('error', reject);
    }).on('error', reject);
  });

  // Parse td.ContributionCalendar-day — extract data-date, data-level, and tooltip count
  const days = [];
  // Match td elements — actual format: data-date="..." id="..." data-level="..."
  const re = /<td[^>]*?data-date="(\d{4}-\d{2}-\d{2})"[^>]*?id="([^"]*)"[^>]*?data-level="(\d)"[^>]*?>/g;
  let m;
  const seenDates = new Set();
  
  while ((m = re.exec(html)) !== null) {
    const date = m[1];
    const tdId = m[2];
    const level = parseInt(m[3]);
    if (seenDates.has(date)) continue;
    seenDates.add(date);
    // Try to find tooltip for actual count
    let count = 0;
    const ttRe = new RegExp(`<tool-tip[^>]*for="${tdId}"[^>]*>([\\s\\S]*?)</tool-tip>`, 'i');
    const ttm = ttRe.exec(html);
    if (ttm) {
      const text = ttm[1].trim();
      if (!/no contribution/i.test(text)) {
        const nm = text.match(/(\d+)/);
        if (nm) count = parseInt(nm[1]);
      }
    }
    // Fallback: estimate from level if tooltip count is 0 but level > 0
    if (count === 0 && level > 0) {
      count = [0, 2, 6, 16, 31, 51][level] || level;
    }
    days.push({ date, count, level });
  }
  days.sort((a, b) => a.date.localeCompare(b.date));

  // Stats
  let total = 0, best = 0, curStreak = 0, longStreak = 0, tmp = 0;
  for (const d of days) {
    total += d.count;
    if (d.count > best) best = d.count;
    if (d.count > 0) { tmp++; if (tmp > longStreak) longStreak = tmp; }
    else tmp = 0;
  }
  for (let i = days.length - 1; i >= 0; i--) {
    if (days[i].count > 0) curStreak++; else break;
  }

  console.log(`  ${days.length} days, ${total} total contributions`);
  return { days, total, best, curStreak, longStreak };
}

function levelFor(cell) {
  if (cell.level !== undefined) return Math.min(cell.level, 5);
  const count = cell.count;
  if (count === 0) return 0;
  if (count <= 3) return 1;
  if (count <= 8) return 2;
  if (count <= 15) return 3;
  if (count <= 30) return 4;
  return 5;
}

const PALETTE = ['#161b22', '#0e4429', '#006d32', '#26a641', '#39d353', '#69f0a0'];

function generateHeatmapSVG(data) {
  const { days, total, best, curStreak, longStreak } = data;

  // Build grid: array of weeks, each week = array of 7 slots
  const grid = [];
  if (days.length === 0) return;

  const firstDate = new Date(days[0].date + 'T00:00:00');
  const firstDow = (firstDate.getDay()); // 0=Sun
  let col = new Array(firstDow).fill(null);
  for (const d of days) {
    col.push(d);
    if (col.length === 7) { grid.push(col); col = []; }
  }
  if (col.length) { while (col.length < 7) col.push(null); grid.push(col); }

  const CELL = 12, GAP = 3, STEP = CELL + GAP;
  const PAD = 22, LEFT_W = 30, TOP_H = 20, TITLEBAR_H = 30;
  const nCols = grid.length;
  const artW = nCols * STEP;
  const artH = 7 * STEP;

  // Month labels
  const months = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
  const monthLabels = [];
  const seen = new Set();
  for (let ci = 0; ci < grid.length; ci++) {
    for (const cell of grid[ci]) {
      if (!cell) continue;
      const d = new Date(cell.date + 'T00:00:00');
      const key = `${d.getFullYear()}-${d.getMonth()}`;
      if (!seen.has(key) && d.getDate() <= 7) {
        seen.add(key);
        monthLabels.push({ ci, label: months[d.getMonth()] });
      }
      break;
    }
  }

  const statsH = 50;
  const canvasW = PAD + LEFT_W + artW + PAD;
  const canvasH = TITLEBAR_H + TOP_H + artH + statsH + PAD * 2;

  let cells = '';
  for (let ci = 0; ci < grid.length; ci++) {
    for (let ri = 0; ri < 7; ri++) {
      const cell = grid[ci][ri];
      if (!cell) continue;
      const level = levelFor(cell);
      const x = PAD + LEFT_W + ci * STEP;
      const y = TITLEBAR_H + TOP_H + ri * STEP;
      const delay = ((ci * 0.018) + (ri * 0.045)).toFixed(3);
      cells += `  <rect x="${x}" y="${y}" width="${CELL}" height="${CELL}" rx="3" fill="${PALETTE[level]}" opacity="0"><animate attributeName="opacity" from="0" to="1" begin="${delay}s" dur="0.4s" fill="freeze"/></rect>\n`;
    }
  }

  // Day labels
  const dayLabels = [
    { label: 'Mon', y: TITLEBAR_H + TOP_H + 1 * STEP - 2 },
    { label: 'Wed', y: TITLEBAR_H + TOP_H + 3 * STEP - 2 },
    { label: 'Fri', y: TITLEBAR_H + TOP_H + 5 * STEP - 2 },
  ];

  let monthEls = '';
  for (const ml of monthLabels) {
    const x = PAD + LEFT_W + ml.ci * STEP;
    monthEls += `  <text x="${x}" y="${TITLEBAR_H + TOP_H - 6}" fill="${DIM}" font-family="sans-serif" font-size="10">${ml.label}</text>\n`;
  }

  let dayEls = '';
  for (const dl of dayLabels) {
    dayEls += `  <text x="${PAD + 4}" y="${dl.y}" fill="${DIM}" font-family="sans-serif" font-size="10">${dl.label}</text>\n`;
  }

  // Legend
  const legY = TITLEBAR_H + TOP_H + artH + 15;
  const legStartX = PAD + LEFT_W + artW - 6 * STEP - 30;
  let legend = `  <text x="${legStartX - 5}" y="${legY + 10}" fill="${DIM}" font-family="sans-serif" font-size="10">Less</text>\n`;
  for (let i = 0; i < PALETTE.length; i++) {
    legend += `  <rect x="${legStartX + 30 + i * STEP}" y="${legY}" width="${CELL}" height="${CELL}" rx="3" fill="${PALETTE[i]}"/>\n`;
  }
  legend += `  <text x="${legStartX + 30 + PALETTE.length * STEP + 5}" y="${legY + 10}" fill="${DIM}" font-family="sans-serif" font-size="10">More</text>\n`;

  // Stats footer
  const statsY = legY + 30;
  const statItems = [
    { label: 'contributions in the last year', value: total.toLocaleString() },
  ];
  let statsEls = '';
  statsEls += `  <text x="${PAD + LEFT_W}" y="${statsY}" fill="#39d353" font-family="sans-serif" font-size="12" font-style="italic">${total.toLocaleString()} contributions in the last year</text>\n`;

  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${canvasW}" height="${canvasH}" viewBox="0 0 ${canvasW} ${canvasH}">
  <!-- frame -->
  <rect fill="#0a0e14" width="${canvasW}" height="${canvasH}" rx="8" stroke="#1f6feb" stroke-width="1"/>
  <rect fill="#080c12" width="${canvasW}" height="${TITLEBAR_H}" rx="8"/>
  <rect fill="#080c12" x="0" y="18" width="${canvasW}" height="12"/>
  <!-- traffic lights -->
  <circle fill="#ff5f56" cx="18" cy="15" r="5"/>
  <circle fill="#ffbd2e" cx="36" cy="15" r="5"/>
  <circle fill="#27c93f" cx="54" cy="15" r="5"/>
  <text fill="${DIM}" font-family="monospace" font-size="12" x="${canvasW/2}" y="19" text-anchor="middle">${USERNAME.toLowerCase()}@github ~ $ ./contributions.sh</text>
  <!-- month labels -->
${monthEls}  <!-- day labels -->
${dayEls}  <!-- cells -->
${cells}  <!-- legend -->
${legend}  <!-- stats -->
${statsEls}</svg>`;

  const out = path.join(ROOT, 'contrib-heatmap.svg');
  fs.writeFileSync(out, svg, 'utf8');
  console.log(`✓ Heatmap → ${out}  (${canvasW}x${canvasH})`);
}

// ═══════════════════════════════════════════════════════════════════════
// MAIN
// ═══════════════════════════════════════════════════════════════════════
(async () => {
  try {
    const portrait = await generatePortraitSVG();
    generateWordmarkSVG(portrait.h);
    const contribs = await fetchContributions();
    generateHeatmapSVG(contribs);
    
    // Save contribution data for future use
    const dataDir = path.join(ROOT, 'data');
    if (!fs.existsSync(dataDir)) fs.mkdirSync(dataDir, { recursive: true });
    fs.writeFileSync(path.join(dataDir, 'contributions.json'), JSON.stringify(contribs, null, 2));
    
    console.log('\n🎉 All SVGs generated! Push to GitHub to see your profile.');
  } catch (err) {
    console.error('Error:', err);
    process.exit(1);
  }
})();
