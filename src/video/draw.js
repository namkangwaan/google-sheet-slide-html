// Canvas2D building blocks for scenes. All coordinates are 1920×1080 design units.

export const FONT = '"Noto Sans Thai", system-ui, sans-serif';
export const MONO = '"JetBrains Mono", "Noto Sans Thai", ui-monospace, monospace';
export const TEXT = '#e2e8f0';
export const MUTED = '#94a3b8';
export const DIM = '#475569';
export const PANEL = 'rgba(15, 23, 42, 0.78)';
export const LINE = 'rgba(148, 163, 184, 0.22)';

export const clamp = (v, lo = 0, hi = 1) => Math.min(hi, Math.max(lo, v));
export const seg = (t, a, b) => clamp((t - a) / (b - a));
export const lerp = (a, b, p) => a + (b - a) * p;
export const easeOut = p => 1 - (1 - p) ** 3;
export const easeInOut = p => (p < 0.5 ? 4 * p * p * p : 1 - (-2 * p + 2) ** 3 / 2);
export const easeBack = p => 1 + 2.70158 * (p - 1) ** 3 + 1.70158 * (p - 1) ** 2;
// Rises 0 → 1 over [a, a + rise] and falls back over [b - fall, b].
export const window01 = (t, a, b, rise = 0.4, fall = 0.4) => Math.min(seg(t, a, a + rise), 1 - seg(t, b - fall, b));
export const fmt = (n, digits = 0) => n.toLocaleString('en-US', { minimumFractionDigits: digits, maximumFractionDigits: digits });
export const rgba = (accent, a = 1) => `rgba(${accent.map(v => Math.round(v * 255)).join(', ')}, ${a})`;
export const hash = (n) => {
  const x = Math.sin(n * 127.1 + 311.7) * 43758.5453;
  return x - Math.floor(x);
};

// Thai tone marks and above/below vowels must stay with their base consonant,
// so animate by grapheme cluster, never by code unit.
const segmenter = typeof Intl !== 'undefined' && Intl.Segmenter ? new Intl.Segmenter('th', { granularity: 'grapheme' }) : null;
const graphemeCache = new Map();
export function graphemes(str) {
  let list = graphemeCache.get(str);
  if (!list) {
    list = segmenter ? Array.from(segmenter.segment(str), part => part.segment) : (str.match(/\P{M}\p{M}*/gu) ?? []);
    graphemeCache.set(str, list);
  }
  return list;
}

export function setFont(ctx, size, weight = 500, mono = false) {
  ctx.font = `${weight} ${size}px ${mono ? MONO : FONT}`;
}

export function text(ctx, str, x, y, opts = {}) {
  const { size = 40, weight = 500, color = TEXT, align = 'left', mono = false, alpha = 1, baseline = 'alphabetic' } = opts;
  if (alpha <= 0) return 0;
  setFont(ctx, size, weight, mono);
  ctx.save();
  ctx.globalAlpha *= alpha;
  ctx.fillStyle = color;
  ctx.textAlign = align;
  ctx.textBaseline = baseline;
  ctx.fillText(str, x, y);
  ctx.restore();
  return ctx.measureText(str).width;
}

export function measure(ctx, str, size, weight = 500, mono = false) {
  setFont(ctx, size, weight, mono);
  return ctx.measureText(str).width;
}

// Graphemes rise and fade in one after another; p is 0 → 1 across the whole string.
export function revealText(ctx, str, x, y, p, opts = {}) {
  const { size = 60, weight = 700, color = TEXT, align = 'left', mono = false, spread = 0.6, rise = 0.6 } = opts;
  if (p <= 0) return;
  const parts = graphemes(str);
  setFont(ctx, size, weight, mono);
  const total = ctx.measureText(str).width;
  let startX = x;
  if (align === 'center') startX = x - total / 2;
  if (align === 'right') startX = x - total;
  ctx.save();
  ctx.fillStyle = color;
  ctx.textAlign = 'left';
  let prefix = '';
  parts.forEach((part, i) => {
    const local = clamp((p - (i / Math.max(1, parts.length)) * spread) / (1 - spread));
    const e = easeOut(local);
    if (e > 0) {
      ctx.globalAlpha = e;
      ctx.fillText(part, startX + ctx.measureText(prefix).width, y + (1 - e) * size * rise);
    }
    prefix += part;
  });
  ctx.restore();
}

// Corner radii in the order Canvas roundRect() uses: [top-left, top-right, bottom-right, bottom-left].
function cornerRadii(r, w, h) {
  const list = Array.isArray(r) ? r : [r];
  const [a, b = a, c = a, e = b] = list;
  const radii = list.length === 3 ? [a, b, c, b] : list.length === 2 ? [a, b, a, b] : [a, b, c, e];
  const max = Math.min(Math.abs(w), Math.abs(h)) / 2;
  return radii.map(value => Math.min(Math.max(0, value || 0), max));
}

export function roundRect(ctx, x, y, w, h, r) {
  ctx.beginPath();
  if (typeof ctx.roundRect === 'function') {
    ctx.roundRect(x, y, w, h, r);
    return;
  }
  // Safari < 16 and Firefox < 112 have no CanvasRenderingContext2D.roundRect().
  const [tl, tr, br, bl] = cornerRadii(r, w, h);
  ctx.moveTo(x + tl, y);
  ctx.arcTo(x + w, y, x + w, y + h, tr);
  ctx.arcTo(x + w, y + h, x, y + h, br);
  ctx.arcTo(x, y + h, x, y, bl);
  ctx.arcTo(x, y, x + w, y, tl);
  ctx.closePath();
}

export function panel(ctx, x, y, w, h, opts = {}) {
  const { r = 18, fill = PANEL, stroke = LINE, alpha = 1, lineWidth = 2 } = opts;
  if (alpha <= 0) return;
  ctx.save();
  ctx.globalAlpha *= alpha;
  roundRect(ctx, x, y, w, h, r);
  if (fill) {
    ctx.fillStyle = fill;
    ctx.fill();
  }
  if (stroke) {
    ctx.strokeStyle = stroke;
    ctx.lineWidth = lineWidth;
    ctx.stroke();
  }
  ctx.restore();
}

export function chip(ctx, str, x, y, opts = {}) {
  const { size = 26, accent = [0.06, 0.72, 0.5], alpha = 1, align = 'left', mono = false, fill = true, weight = 600, color = TEXT } = opts;
  const w = measure(ctx, str, size, weight, mono) + size * 1.2;
  const h = size * 1.75;
  const left = align === 'center' ? x - w / 2 : align === 'right' ? x - w : x;
  panel(ctx, left, y - h / 2, w, h, {
    r: h / 2, fill: fill ? rgba(accent, 0.16) : PANEL, stroke: rgba(accent, 0.6), alpha,
  });
  text(ctx, str, left + w / 2, y, { size, weight, color, align: 'center', baseline: 'middle', alpha, mono });
  return w;
}

// Eyebrow chip + title shared by teaching scenes.
export function header(ctx, lt, accent, eyebrow, title) {
  const a = easeOut(seg(lt, 0.1, 0.7));
  chip(ctx, eyebrow, 140, 128 + (1 - a) * 16, { size: 24, accent, alpha: a });
  revealText(ctx, title, 140, 236, seg(lt, 0.25, 1.4), { size: 66, weight: 800 });
}

// Spreadsheet grid. rows[0] is the header row (bold); rowStart is its sheet row number.
export function sheet(ctx, opts) {
  const {
    x, y, cols, rows, rowStart = 1, rowH = 66, letterH = 42, gutter = 64, size = 28,
    appear = () => 1, style = () => null, alpha = 1, accent,
  } = opts;
  const width = gutter + cols.reduce((sum, col) => sum + col.w, 0);
  const height = letterH + rows.length * rowH;
  const colX = [];
  let cx = x + gutter;
  for (const col of cols) {
    colX.push(cx);
    cx += col.w;
  }
  const cell = (r, c) => ({ x: colX[c], y: y + letterH + r * rowH, w: cols[c].w, h: rowH });
  const geometry = { x, y, width, height, cell, colX };
  if (alpha <= 0) return geometry;

  ctx.save();
  ctx.globalAlpha *= alpha;
  panel(ctx, x - 8, y - 8, width + 16, height + 16, { r: 14, fill: 'rgba(2, 6, 23, 0.82)' });

  // Column letters and row numbers
  ctx.fillStyle = 'rgba(30, 41, 59, 0.9)';
  ctx.fillRect(x, y, width, letterH);
  ctx.fillRect(x, y + letterH, gutter, rows.length * rowH);
  cols.forEach((col, c) => {
    text(ctx, col.key, colX[c] + col.w / 2, y + letterH / 2 + 1, { size: 20, weight: 600, color: MUTED, align: 'center', baseline: 'middle', mono: true });
  });
  rows.forEach((_, r) => {
    text(ctx, String(rowStart + r), x + gutter / 2, y + letterH + r * rowH + rowH / 2 + 1, { size: 20, weight: 600, color: MUTED, align: 'center', baseline: 'middle', mono: true });
  });

  rows.forEach((row, r) => {
    row.forEach((value, c) => {
      const p = appear(r, c);
      if (p <= 0) return;
      const box = cell(r, c);
      const s = style(r, c) ?? {};
      ctx.save();
      ctx.globalAlpha *= p * (s.alpha ?? 1);
      const squash = lerp(0.4, 1, easeOut(p));
      ctx.translate(0, box.y + box.h / 2);
      ctx.scale(1, squash);
      ctx.translate(0, -(box.y + box.h / 2));
      if (s.fill) {
        ctx.fillStyle = s.fill;
        ctx.fillRect(box.x, box.y, box.w, box.h);
      } else if (r === 0) {
        ctx.fillStyle = 'rgba(30, 41, 59, 0.55)';
        ctx.fillRect(box.x, box.y, box.w, box.h);
      }
      const shown = s.text ?? value;
      if (shown !== '' && shown != null) {
        const isNumber = typeof shown === 'number';
        const label = isNumber ? fmt(shown, cols[c].digits ?? (Number.isInteger(shown) ? 0 : 1)) : String(shown);
        const right = isNumber || cols[c].align === 'right';
        text(ctx, label, right ? box.x + box.w - 16 : box.x + 16, box.y + box.h / 2 + 2, {
          size: s.size ?? size, weight: r === 0 ? 700 : (s.weight ?? 500), color: s.color ?? (r === 0 ? '#cbd5e1' : TEXT),
          align: right ? 'right' : 'left', baseline: 'middle', mono: s.mono ?? false,
        });
      }
      ctx.restore();
    });
  });

  // Grid lines on top so cell fills stay inside them.
  ctx.strokeStyle = LINE;
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  for (let r = 0; r <= rows.length; r += 1) {
    const ly = y + letterH + r * rowH;
    ctx.moveTo(x, ly);
    ctx.lineTo(x + width, ly);
  }
  [x + gutter, ...colX.slice(1), x + width].forEach(lx => {
    ctx.moveTo(lx, y);
    ctx.lineTo(lx, y + height);
  });
  ctx.stroke();
  if (accent) {
    ctx.strokeStyle = rgba(accent, 0.25);
    ctx.lineWidth = 2;
    ctx.strokeRect(x, y, width, height);
  }
  ctx.restore();
  return geometry;
}

// Union of two cell rects, used for range selections.
export const unionRect = (a, b) => {
  const x = Math.min(a.x, b.x);
  const y = Math.min(a.y, b.y);
  return { x, y, w: Math.max(a.x + a.w, b.x + b.w) - x, h: Math.max(a.y + a.h, b.y + b.h) - y };
};
export const lerpRect = (a, b, p) => ({ x: lerp(a.x, b.x, p), y: lerp(a.y, b.y, p), w: lerp(a.w, b.w, p), h: lerp(a.h, b.h, p) });

// Google Sheets-style selection: border, faint fill, fill handle.
export function selection(ctx, rect, accent, alpha = 1) {
  if (alpha <= 0) return;
  ctx.save();
  ctx.globalAlpha *= alpha;
  ctx.fillStyle = rgba(accent, 0.12);
  ctx.fillRect(rect.x, rect.y, rect.w, rect.h);
  ctx.strokeStyle = rgba(accent, 1);
  ctx.lineWidth = 4;
  ctx.strokeRect(rect.x, rect.y, rect.w, rect.h);
  ctx.fillStyle = rgba(accent, 1);
  ctx.fillRect(rect.x + rect.w - 7, rect.y + rect.h - 7, 14, 14);
  ctx.restore();
}

const TOKEN = /("[^"]*"?)|([A-Z][A-Z0-9.]*(?=\())|((?:[A-Za-z_]+!)?\$?[A-Z]{1,2}\$?\d+(?::\$?[A-Z]{1,2}\$?\d+)?)|(\d+(?:\.\d+)?)|([A-Za-z_][A-Za-z_0-9]*)|(\s+)|(.)/gu;
const TOKEN_COLORS = ['#f9a8d4', null, '#fcd34d', '#67e8f9', '#e2e8f0', '#e2e8f0', '#94a3b8'];
const formulaCache = new Map();

// Splits a formula into colored grapheme runs so typing can stop mid-token.
function formulaGlyphs(formula) {
  let glyphs = formulaCache.get(formula);
  if (glyphs) return glyphs;
  glyphs = [];
  for (const match of formula.matchAll(TOKEN)) {
    const group = match.slice(1).findIndex(part => part !== undefined);
    for (const g of graphemes(match[0])) glyphs.push({ g, group });
  }
  formulaCache.set(formula, glyphs);
  return glyphs;
}

export function formulaText(ctx, formula, x, y, opts = {}) {
  const { size = 32, accent = [0.06, 0.72, 0.5], p = 1, cursor = false, alpha = 1, time = 0 } = opts;
  const glyphs = formulaGlyphs(formula);
  const count = Math.floor(glyphs.length * clamp(p));
  setFont(ctx, size, 500, true);
  ctx.save();
  ctx.globalAlpha *= alpha;
  ctx.textBaseline = 'middle';
  ctx.textAlign = 'left';
  let cx = x;
  let run = '';
  let runColor = null;
  const flush = () => {
    if (!run) return;
    ctx.fillStyle = runColor;
    ctx.fillText(run, cx, y);
    cx += ctx.measureText(run).width;
    run = '';
  };
  for (let i = 0; i < count; i += 1) {
    const { g, group } = glyphs[i];
    const color = group === 1 ? rgba(accent, 1) : TOKEN_COLORS[group];
    if (color !== runColor) {
      flush();
      runColor = color;
    }
    run += g;
  }
  flush();
  if (cursor && Math.floor(time * 2.2) % 2 === 0) {
    ctx.fillStyle = TEXT;
    ctx.fillRect(cx + 3, y - size * 0.6, 3, size * 1.2);
  }
  ctx.restore();
  return cx - x;
}

// Name box + fx + formula, like the Sheets formula bar.
export function formulaBar(ctx, x, y, w, ref, formula, opts = {}) {
  const { accent, p = 1, alpha = 1, time = 0, size = 32 } = opts;
  if (alpha <= 0) return;
  const h = 72;
  panel(ctx, x, y, w, h, { r: 12, alpha, fill: 'rgba(2, 6, 23, 0.85)', stroke: rgba(accent, 0.35) });
  ctx.save();
  ctx.globalAlpha *= alpha;
  ctx.fillStyle = 'rgba(30, 41, 59, 0.9)';
  ctx.fillRect(x + 2, y + 2, 110, h - 4);
  ctx.restore();
  text(ctx, ref, x + 57, y + h / 2 + 1, { size: 26, weight: 700, mono: true, align: 'center', baseline: 'middle', alpha, color: rgba(accent, 1) });
  text(ctx, 'fx', x + 140, y + h / 2 + 1, { size: 26, weight: 600, mono: true, baseline: 'middle', alpha, color: MUTED });
  formulaText(ctx, formula, x + 190, y + h / 2 + 2, { size, accent, p, cursor: p < 1, alpha, time });
}

export function arrow(ctx, x1, y1, x2, y2, color, width = 3, head = 14) {
  const angle = Math.atan2(y2 - y1, x2 - x1);
  ctx.save();
  ctx.strokeStyle = color;
  ctx.fillStyle = color;
  ctx.lineWidth = width;
  ctx.beginPath();
  ctx.moveTo(x1, y1);
  ctx.lineTo(x2 - Math.cos(angle) * head * 0.8, y2 - Math.sin(angle) * head * 0.8);
  ctx.stroke();
  ctx.beginPath();
  ctx.moveTo(x2, y2);
  ctx.lineTo(x2 - Math.cos(angle - 0.45) * head, y2 - Math.sin(angle - 0.45) * head);
  ctx.lineTo(x2 - Math.cos(angle + 0.45) * head, y2 - Math.sin(angle + 0.45) * head);
  ctx.closePath();
  ctx.fill();
  ctx.restore();
}

// Point on a quadratic curve that arcs upward between two points.
export function arc(x1, y1, x2, y2, p, lift = 120) {
  const mx = (x1 + x2) / 2;
  const my = Math.min(y1, y2) - lift;
  const q = 1 - p;
  return { x: q * q * x1 + 2 * q * p * mx + p * p * x2, y: q * q * y1 + 2 * q * p * my + p * p * y2 };
}

// A rect breaks into drifting squares (deterministic in p and seed).
export function shatter(ctx, rect, p, seed, color) {
  if (p >= 1) return;
  const cols = 48;
  const rows = 4;
  const cw = rect.w / cols;
  const ch = rect.h / rows;
  ctx.save();
  ctx.fillStyle = color;
  for (let i = 0; i < cols * rows; i += 1) {
    const cx = i % cols;
    const cy = Math.floor(i / cols);
    const h1 = hash(seed * 97 + i);
    const h2 = hash(seed * 31 + i * 7);
    const delay = (cx / cols) * 0.35;
    const local = clamp((p - delay) / (1 - delay));
    const e = easeOut(local);
    ctx.globalAlpha = (1 - local) * 0.75;
    const size = Math.max(2, Math.min(cw, ch) * 0.7 * (1 - local * 0.6));
    ctx.fillRect(
      rect.x + cx * cw + e * (h1 - 0.3) * 520,
      rect.y + cy * ch + e * (h2 - 0.65) * 300,
      size, size,
    );
  }
  ctx.restore();
}

export function check(ctx, x, y, size, color, p = 1) {
  if (p <= 0) return;
  ctx.save();
  ctx.strokeStyle = color;
  ctx.lineWidth = size * 0.16;
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';
  const pts = [[x - size * 0.35, y], [x - size * 0.08, y + size * 0.28], [x + size * 0.4, y - size * 0.3]];
  const first = Math.hypot(pts[1][0] - pts[0][0], pts[1][1] - pts[0][1]);
  const second = Math.hypot(pts[2][0] - pts[1][0], pts[2][1] - pts[1][1]);
  const len = (first + second) * clamp(p);
  ctx.beginPath();
  ctx.moveTo(...pts[0]);
  if (len <= first) {
    ctx.lineTo(lerp(pts[0][0], pts[1][0], len / first), lerp(pts[0][1], pts[1][1], len / first));
  } else {
    ctx.lineTo(...pts[1]);
    const k = (len - first) / second;
    ctx.lineTo(lerp(pts[1][0], pts[2][0], k), lerp(pts[1][1], pts[2][1], k));
  }
  ctx.stroke();
  ctx.restore();
}

export function cross(ctx, x, y, size, color, alpha = 1) {
  if (alpha <= 0) return;
  ctx.save();
  ctx.globalAlpha *= alpha;
  ctx.strokeStyle = color;
  ctx.lineWidth = size * 0.16;
  ctx.lineCap = 'round';
  ctx.beginPath();
  ctx.moveTo(x - size * 0.3, y - size * 0.3);
  ctx.lineTo(x + size * 0.3, y + size * 0.3);
  ctx.moveTo(x + size * 0.3, y - size * 0.3);
  ctx.lineTo(x - size * 0.3, y + size * 0.3);
  ctx.stroke();
  ctx.restore();
}

export function padlock(ctx, x, y, size, color, alpha = 1) {
  if (alpha <= 0) return;
  ctx.save();
  ctx.globalAlpha *= alpha;
  ctx.strokeStyle = color;
  ctx.fillStyle = color;
  ctx.lineWidth = size * 0.12;
  ctx.beginPath();
  ctx.arc(x, y - size * 0.15, size * 0.28, Math.PI, 0);
  ctx.lineTo(x + size * 0.28, y + size * 0.05);
  ctx.moveTo(x - size * 0.28, y + size * 0.05);
  ctx.lineTo(x - size * 0.28, y - size * 0.15);
  ctx.stroke();
  roundRect(ctx, x - size * 0.42, y, size * 0.84, size * 0.62, size * 0.1);
  ctx.fill();
  ctx.restore();
}
