// The eleven trailer scenes. Each draw(ctx, t, scene) is a pure function of the
// scene-local time t (seconds), so any frame can be rendered out of order.
import tasks from '../practice-tasks.json';
import {
  SCENE_SPECS, CLASSROOM, SALES, CONTACTS, amounts, discounted, byCategory, grandTotal,
  lookupCategory, filterIds, queryTotals, DOMAIN_PATTERN, PHONE_TAIL_PATTERN, maskPhone,
  SITE_URL, PRACTICE_FILE,
} from './data.js';
import * as d from './draw.js';

const AMBER = '#fcd34d';

function callout(ctx, x, y, big, line1, line2, accent, alpha) {
  if (alpha <= 0) return;
  const off = (1 - d.easeOut(alpha)) * 30;
  d.panel(ctx, x, y + off, 470, 290, { alpha, stroke: d.rgba(accent, 0.4) });
  d.text(ctx, big, x + 40, y + 112 + off, { size: 78, weight: 800, mono: /^[A-Z0-9:$]+$/.test(big), color: d.rgba(accent), alpha });
  d.text(ctx, line1, x + 40, y + 188 + off, { size: 31, weight: 600, alpha });
  d.text(ctx, line2, x + 40, y + 244 + off, { size: 30, color: d.MUTED, alpha });
}

function resultRow(ctx, x, y, w, formula, result, accent, alpha) {
  if (alpha <= 0) return;
  const off = (1 - d.easeOut(alpha)) * 20;
  d.panel(ctx, x, y + off, w, 62, { r: 12, alpha, stroke: d.rgba(accent, 0.3) });
  d.formulaText(ctx, formula, x + 22, y + 32 + off, { size: 22, accent, alpha });
  d.text(ctx, result, x + w - 24, y + 33 + off, { size: 30, weight: 800, color: d.rgba(accent), align: 'right', baseline: 'middle', alpha });
}

function rowsFrom(header, data) {
  return [header, ...data];
}

// ── 1. Intro ─────────────────────────────────────────────────────────────
function intro(ctx, t, scene) {
  const a = scene.accent;
  const box = { x: 340, y: 330, w: 1240, h: 350 };
  const boxP = d.easeInOut(d.seg(t, 0.3, 1.6));
  if (boxP > 0) {
    const perimeter = 2 * (box.w + box.h);
    ctx.save();
    ctx.strokeStyle = d.rgba(a, 0.9);
    ctx.lineWidth = 4;
    ctx.setLineDash([perimeter * boxP, perimeter]);
    ctx.strokeRect(box.x, box.y, box.w, box.h);
    ctx.restore();
    ctx.save();
    ctx.globalAlpha = d.seg(t, 1.4, 1.8);
    ctx.fillStyle = d.rgba(a);
    ctx.fillRect(box.x + box.w - 9, box.y + box.h - 9, 18, 18);
    ctx.restore();
    d.chip(ctx, 'A1', box.x, box.y - 36, { size: 22, mono: true, accent: a, alpha: d.seg(t, 1.2, 1.7) });
  }
  d.revealText(ctx, 'Google Sheets', 960, 485, d.seg(t, 0.5, 1.9), { size: 150, weight: 800, align: 'center' });
  d.revealText(ctx, 'เรียนแล้วทำได้จริง', 960, 628, d.seg(t, 1.3, 2.7), { size: 104, weight: 800, align: 'center', color: d.rgba(a) });
  d.text(ctx, 'จากตารางแรก สู่การคำนวณ ค้นหา และอธิบายข้อมูล', 960, 772, {
    size: 40, align: 'center', color: d.MUTED, alpha: d.easeOut(d.seg(t, 2.8, 3.6)),
  });
  const labels = ['เรียนด้วยตนเอง', `แบบฝึก ${tasks.length} ข้อ`, 'ภาษาไทย ทีละขั้น'];
  const widths = labels.map(label => d.measure(ctx, label, 28, 600) + 28 * 1.2);
  let x = 960 - (widths.reduce((sum, w) => sum + w, 0) + 24 * (labels.length - 1)) / 2;
  labels.forEach((label, i) => {
    const alpha = d.easeOut(d.seg(t, 3.6 + i * 0.3, 4.1 + i * 0.3));
    d.chip(ctx, label, x, 870 + (1 - alpha) * 16, { size: 28, accent: a, alpha });
    x += widths[i] + 24;
  });
}

// ── 2. Cells ─────────────────────────────────────────────────────────────
const CLASS_COLS = [{ key: 'A', w: 250 }, { key: 'B', w: 290 }, { key: 'C', w: 150 }, { key: 'D', w: 220 }];
const CLASS_ROWS = rowsFrom(['Item', 'Category', 'Qty', 'Unit_Price'], CLASSROOM.map(row => [row.item, row.category, row.qty, row.price]));

function cells(ctx, t, scene) {
  const a = scene.accent;
  d.header(ctx, t, a, 'พื้นฐาน 01 · เซลล์และตาราง', 'เซลล์หนึ่งช่องเก็บข้อมูลหนึ่งค่า');
  const rowBand = d.window01(t, 12.1, 14.3);
  const colBand = d.window01(t, 14.2, 16.8);
  const g = d.sheet(ctx, {
    x: 200, y: 340, cols: CLASS_COLS, rows: CLASS_ROWS, accent: a,
    appear: (r, c) => d.seg(t, 0.9 + (r * 4 + c) * 0.07, 1.3 + (r * 4 + c) * 0.07),
    style: (r, c) => {
      if (r === 2 && rowBand > 0) return { fill: d.rgba(a, 0.24 * rowBand) };
      if (c === 1 && r > 0 && colBand > 0) return { fill: d.rgba(a, 0.24 * colBand) };
      return null;
    },
  });
  const c2 = g.cell(1, 2);
  const range = d.unionRect(c2, g.cell(4, 3));
  d.selection(ctx, d.lerpRect(c2, range, d.easeInOut(d.seg(t, 8.6, 9.4))), a, d.window01(t, 5, 12.1, 0.3));
  callout(ctx, 1320, 360, 'C2', 'คอลัมน์ C แถว 2', 'ค่าในเซลล์คือ 10', a, d.window01(t, 5.2, 8.8, 0.4, 0.3));
  callout(ctx, 1320, 360, 'C2:D5', 'ช่วง 2 คอลัมน์ × 4 แถว', 'รวม 8 เซลล์', a, d.window01(t, 9, 12.1, 0.4, 0.3));
  callout(ctx, 1320, 360, '1 แถว', 'หนึ่งแถวต่อหนึ่งรายการ', 'แถว 3 คือข้อมูลของ "ดินสอ"', a, d.window01(t, 12.2, 14.3, 0.4, 0.3));
  callout(ctx, 1320, 360, '1 คอลัมน์', 'หนึ่งคอลัมน์ต่อข้อมูลหนึ่งชนิด', 'คอลัมน์ B เก็บเฉพาะหมวด', a, d.window01(t, 14.3, 17, 0.4, 0.3));
}

// ── 3. References ───────────────────────────────────────────────────────
const REF_COLS = [
  { key: 'A', w: 170 }, { key: 'B', w: 220 }, { key: 'C', w: 110 },
  { key: 'D', w: 180 }, { key: 'E', w: 200 }, { key: 'F', w: 220, digits: 1 },
];

function references(ctx, t, scene) {
  const a = scene.accent;
  d.header(ctx, t, a, 'พื้นฐาน 02 · สูตรและการอ้างอิง', 'ลากสูตรครั้งเดียว ได้ครบทุกแถว');
  const amount = amounts();
  const net = discounted();
  const second = t >= 9.8;
  d.formulaBar(ctx, 160, 290, 1600, second ? 'F2' : 'E2', second ? '=E2*(1-$H$1)' : '=C2*D2', {
    accent: a, time: t,
    p: second ? d.seg(t, 10, 11.6) : d.seg(t, 0.8, 2.4),
    alpha: second ? d.seg(t, 9.8, 10) : 1 - d.seg(t, 9.5, 9.8),
  });

  const dragE = d.easeInOut(d.seg(t, 3.4, 5.8));
  const dragF = d.easeInOut(d.seg(t, 12.2, 14));
  const showFormulas = t >= 3.4 && t < 7.4;
  const showFormulasF = t >= 12.2 && t < 14.6;
  const rows = rowsFrom(['Item', 'Category', 'Qty', 'Unit_Price', 'Amount', 'Net'],
    CLASSROOM.map((row, i) => [row.item, row.category, row.qty, row.price, amount[i], net[i]]));

  const g = d.sheet(ctx, {
    x: 160, y: 410, cols: REF_COLS, rows, accent: a,
    appear: () => d.seg(t, 0.2, 0.8),
    style: (r, c) => {
      if (r === 0) return null;
      if (c === 4) {
        const filled = r === 1 ? t >= 2.5 : dragE >= (r - 1) / 3 - 0.001 && t >= 3.4;
        if (!filled) return { text: '' };
        if (showFormulas) return { text: `=C${r + 1}*D${r + 1}`, mono: true, size: 22, color: d.rgba(a) };
        if (t < 3.4) return { alpha: d.seg(t, 2.5, 2.8), weight: 700 };
        return { alpha: d.seg(t, 7.4 + r * 0.12, 7.7 + r * 0.12), weight: 700 };
      }
      if (c === 5) {
        const filled = r === 1 ? t >= 11.8 : dragF >= (r - 1) / 3 - 0.001 && t >= 12.2;
        if (!filled) return { text: '' };
        if (showFormulasF) return { text: `=E${r + 1}*(1-$H$1)`, mono: true, size: 19, color: AMBER };
        return { weight: 700, alpha: r === 1 && t < 12.2 ? d.seg(t, 11.8, 12.1) : d.seg(t, 14.6 + r * 0.1, 14.9 + r * 0.1) };
      }
      return null;
    },
  });

  const e2 = g.cell(1, 4);
  const f2 = g.cell(1, 5);
  d.selection(ctx, d.lerpRect(e2, d.unionRect(e2, g.cell(4, 4)), dragE), a, d.window01(t, 0.8, 9.5, 0.3));
  d.selection(ctx, d.lerpRect(f2, d.unionRect(f2, g.cell(4, 5)), dragF), a, d.seg(t, 10, 10.3));
  d.chip(ctx, 'แสดงสูตร: View → Show formulas', 160 + 64, 380, { size: 20, accent: a, alpha: d.window01(t, 3.4, 7.4, 0.3, 0.3) });

  const sumAlpha = d.easeOut(d.seg(t, 8, 8.6));
  d.chip(ctx, `รวม ${d.fmt(grandTotal())}`, e2.x + e2.w / 2, g.y + g.height + 44, { size: 26, accent: a, alpha: sumAlpha * (1 - d.seg(t, 9.5, 9.9)), align: 'center' });

  // H1 discount cell and the arrows that all point to it.
  const boxAlpha = d.easeOut(d.seg(t, 9.6, 10.2));
  const box = { x: 1440, y: 470, w: 300, h: 170 };
  if (boxAlpha > 0) {
    d.panel(ctx, box.x, box.y, box.w, box.h, { alpha: boxAlpha, stroke: 'rgba(252, 211, 77, 0.6)' });
    d.text(ctx, 'H1 · ส่วนลด', box.x + 28, box.y + 48, { size: 26, color: d.MUTED, alpha: boxAlpha });
    d.text(ctx, '10%', box.x + 28, box.y + 128, { size: 68, weight: 800, alpha: boxAlpha });
    const lock = d.easeBack(d.seg(t, 11.8, 12.4));
    d.padlock(ctx, box.x + box.w - 60, box.y + 92, 56 * Math.max(lock, 0.01), AMBER, d.seg(t, 11.8, 12));
    d.text(ctx, '$H$1 = ตรึงทั้งคอลัมน์และแถว', box.x, box.y + box.h + 50, { size: 24, color: AMBER, alpha: d.seg(t, 12, 12.6) });
  }
  for (let r = 1; r <= 4; r += 1) {
    const alpha = d.seg(t, 12.4 + r * 0.25, 12.8 + r * 0.25);
    if (alpha <= 0) continue;
    const cell = g.cell(r, 5);
    ctx.save();
    ctx.globalAlpha = alpha * 0.85;
    d.arrow(ctx, cell.x + cell.w + 8, cell.y + cell.h / 2, box.x - 10, box.y + box.h / 2, AMBER, 3);
    ctx.restore();
  }
  d.text(ctx, 'E2 → E3 เลื่อนตามแถว   ·   $H$1 ไม่เลื่อน ทุกแถวอ่านเซลล์เดียวกัน', 160, 880, {
    size: 32, weight: 600, alpha: d.easeOut(d.seg(t, 15.2, 15.9)),
  });
}

// ── 4. SUMIF ─────────────────────────────────────────────────────────────
const SUM_COLS = [{ key: 'A', w: 180 }, { key: 'B', w: 270 }, { key: 'C', w: 110 }, { key: 'D', w: 170 }, { key: 'E', w: 170 }];

function sumif(ctx, t, scene) {
  const a = scene.accent;
  const target = 'เครื่องเขียน';
  d.header(ctx, t, a, 'พื้นฐาน 03 · เงื่อนไข', 'รวมเฉพาะรายการที่ต้องการ');
  d.formulaBar(ctx, 160, 290, 1600, 'G2', `=SUMIF(B2:B5,"${target}",E2:E5)`, { accent: a, time: t, p: d.seg(t, 0.8, 3.2) });
  const amount = amounts();
  const rows = rowsFrom(['Item', 'Category', 'Qty', 'Unit_Price', 'Amount'],
    CLASSROOM.map((row, i) => [row.item, row.category, row.qty, row.price, amount[i]]));
  const scan = d.seg(t, 3.4, 5.8);
  const evaluated = r => scan >= (r - 0.5) / 4;
  const matches = r => CLASSROOM[r - 1].category === target;
  const g = d.sheet(ctx, {
    x: 160, y: 410, cols: SUM_COLS, rows, accent: a,
    appear: () => d.seg(t, 0.2, 0.8),
    style: (r) => {
      if (r === 0 || !evaluated(r)) return null;
      return matches(r) ? { fill: d.rgba(a, 0.22) } : { alpha: 0.35 };
    },
  });

  const b2 = g.cell(1, 1);
  const b5 = g.cell(4, 1);
  d.selection(ctx, d.unionRect(b2, b5), a, d.window01(t, 3.2, 6.2, 0.3) * 0.7);
  if (scan > 0 && scan < 1) {
    const y = d.lerp(b2.y, b5.y + b5.h, scan);
    ctx.save();
    ctx.fillStyle = d.rgba(a, 0.9);
    ctx.fillRect(g.x + 64, y - 2, g.width - 64, 4);
    ctx.restore();
  }
  d.selection(ctx, d.unionRect(g.cell(1, 4), g.cell(4, 4)), a, d.window01(t, 5.9, 8.8, 0.3) * 0.7);

  const panelX = 1200;
  const panelAlpha = d.easeOut(d.seg(t, 5.8, 6.4));
  d.panel(ctx, panelX, 410, 560, 250, { alpha: panelAlpha, stroke: d.rgba(a, 0.45) });
  d.chip(ctx, 'G2', panelX + 36, 452, { size: 22, mono: true, accent: a, alpha: panelAlpha });
  d.text(ctx, `ยอด${target} (บาท)`, panelX + 36, 520, { size: 32, color: d.MUTED, alpha: panelAlpha });
  const sum = byCategory()[target];
  const counted = Math.round(sum * d.easeOut(d.seg(t, 7.4, 8.8)));
  d.text(ctx, d.fmt(counted), panelX + 36, 630, { size: 110, weight: 800, color: d.rgba(a), alpha: panelAlpha });

  let k = 0;
  CLASSROOM.forEach((row, i) => {
    if (row.category !== target) return;
    const from = g.cell(i + 1, 4);
    const p = d.easeInOut(d.seg(t, 6.2 + k * 0.3, 7.4 + k * 0.3));
    if (p > 0 && p < 1) {
      const pos = d.arc(from.x + from.w / 2, from.y + from.h / 2, panelX + 200, 590, p, 160);
      d.chip(ctx, d.fmt(amount[i]), pos.x, pos.y, { size: 28, accent: a, align: 'center', alpha: 1 - d.seg(p, 0.85, 1) });
    }
    k += 1;
  });

  resultRow(ctx, panelX, 690, 560, '=SUMIF(B2:B5,"อาหาร",E2:E5)', d.fmt(byCategory()['อาหาร']), a, d.seg(t, 9.5, 10.1));
  resultRow(ctx, panelX, 764, 560, '=SUM(E2:E5)', d.fmt(grandTotal()), a, d.seg(t, 10.8, 11.4));
  const foodCount = CLASSROOM.filter(row => row.category === 'อาหาร').length;
  resultRow(ctx, panelX, 838, 560, '=COUNTIF(B2:B5,"อาหาร")', `${foodCount} รายการ`, a, d.seg(t, 12.2, 12.8));
}

// ── 5. Chart ─────────────────────────────────────────────────────────────
function chart(ctx, t, scene) {
  const a = scene.accent;
  d.header(ctx, t, a, 'พื้นฐาน 06 · กราฟ', 'หมวดไหนขายได้มากกว่า?');
  const totals = byCategory();
  const cats = Object.keys(totals);
  const base = 830;
  const top = 360;
  const x0 = 250;
  const x1 = 1100;
  const max = 300;
  const scale = (base - top) / max;
  const gridAlpha = d.seg(t, 0.6, 1.2);
  for (let v = 0; v <= max; v += 100) {
    const y = base - v * scale;
    ctx.save();
    ctx.globalAlpha = gridAlpha * (v === 0 ? 0.9 : 0.4);
    ctx.strokeStyle = v === 0 ? d.MUTED : d.DIM;
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(x0, y);
    ctx.lineTo(x1, y);
    ctx.stroke();
    ctx.restore();
    d.text(ctx, String(v), x0 - 20, y, { size: 22, mono: true, color: d.MUTED, align: 'right', baseline: 'middle', alpha: gridAlpha });
  }
  const centers = [480, 870];
  const barW = 230;
  cats.forEach((cat, i) => {
    const grow = d.easeBack(d.seg(t, 1.2 + i * 0.3, 2.4 + i * 0.3));
    const h = Math.max(0, totals[cat] * scale * grow);
    const x = centers[i] - barW / 2;
    if (h > 0) {
      const gradient = ctx.createLinearGradient(0, base - h, 0, base);
      gradient.addColorStop(0, d.rgba(a, i === 0 ? 1 : 0.75));
      gradient.addColorStop(1, d.rgba(a, i === 0 ? 0.45 : 0.3));
      ctx.fillStyle = gradient;
      d.roundRect(ctx, x, base - h, barW, h, [12, 12, 0, 0]);
      ctx.fill();
    }
    const counted = Math.round(totals[cat] * d.easeOut(d.seg(t, 1.2 + i * 0.3, 2.4 + i * 0.3)));
    d.text(ctx, d.fmt(counted), centers[i], base - h - 24, { size: 44, weight: 800, align: 'center', alpha: d.seg(t, 1.3 + i * 0.3, 1.6 + i * 0.3) });
    d.text(ctx, cat, centers[i], base + 56, { size: 34, weight: 600, align: 'center', alpha: gridAlpha });
  });

  const [high, low] = cats.map(cat => totals[cat]);
  const diffAlpha = d.easeOut(d.seg(t, 4.2, 5));
  if (diffAlpha > 0) {
    const yLow = base - low * scale;
    const yHigh = base - high * scale;
    const bx = centers[0] + barW / 2 + 40;
    ctx.save();
    ctx.globalAlpha = diffAlpha;
    ctx.strokeStyle = AMBER;
    ctx.lineWidth = 3;
    ctx.setLineDash([10, 8]);
    ctx.beginPath();
    ctx.moveTo(centers[0] - barW / 2, yLow);
    ctx.lineTo(centers[1] - barW / 2, yLow);
    ctx.stroke();
    ctx.setLineDash([]);
    ctx.beginPath();
    ctx.moveTo(bx - 12, yHigh);
    ctx.lineTo(bx, yHigh);
    ctx.lineTo(bx, yLow);
    ctx.lineTo(bx - 12, yLow);
    ctx.stroke();
    ctx.restore();
    d.text(ctx, `+${high - low}`, bx + 16, (yHigh + yLow) / 2, { size: 40, weight: 800, color: AMBER, baseline: 'middle', alpha: diffAlpha });
  }

  const px = 1220;
  const steps = [6, 6.4, 6.8, 7.2];
  d.panel(ctx, px, 380, 540, 420, { alpha: d.easeOut(d.seg(t, 5.8, 6.4)), stroke: d.rgba(a, 0.4) });
  d.chip(ctx, 'ข้อสรุป', px + 40, 436, { size: 24, accent: a, alpha: d.seg(t, steps[0], steps[0] + 0.4) });
  d.text(ctx, `${cats[0]}ขายได้`, px + 40, 530, { size: 42, weight: 700, alpha: d.seg(t, steps[1], steps[1] + 0.4) });
  d.text(ctx, `มากกว่า${cats[1]}`, px + 40, 592, { size: 42, weight: 700, alpha: d.seg(t, steps[1], steps[1] + 0.4) });
  d.text(ctx, `${high - low} บาท`, px + 40, 690, { size: 76, weight: 800, color: d.rgba(a), alpha: d.seg(t, steps[2], steps[2] + 0.4) });
  d.text(ctx, `${high} − ${low} = ${high - low}`, px + 40, 752, { size: 26, mono: true, color: d.MUTED, alpha: d.seg(t, steps[3], steps[3] + 0.4) });
  d.chip(ctx, 'Insert → Chart → Column chart', px, 860, { size: 22, mono: true, accent: a, alpha: d.seg(t, 8.5, 9) });
}

// ── 6. Lookup ────────────────────────────────────────────────────────────
const LOOK_COLS = [{ key: 'A', w: 230 }, { key: 'B', w: 250 }, { key: 'C', w: 270 }];
const LOOK_ROWS = rowsFrom(['TransactionID', 'Customer Region', 'Product Category'], SALES.map(sale => [sale.id, sale.region, sale.category]));

function lookup(ctx, t, scene) {
  const a = scene.accent;
  const id = 'TX-1004';
  const target = SALES.findIndex(sale => sale.id === id) + 1;
  d.header(ctx, t, a, 'ค้นหาข้อมูล · Lookup', 'ใช้รหัสค้นหาค่าเดียว');
  d.formulaBar(ctx, 160, 290, 1600, 'E22', `=VLOOKUP("${id}", Sales_Data!A5:F11, 3, FALSE)`, { accent: a, time: t, p: d.seg(t, 0.8, 3.4), size: 30 });

  const scan = d.easeInOut(d.seg(t, 3.6, 5.4));
  const found = t >= 5.4;
  const g = d.sheet(ctx, {
    x: 160, y: 410, cols: LOOK_COLS, rows: LOOK_ROWS, rowStart: 4, rowH: 58, size: 26, accent: a,
    appear: () => d.seg(t, 0.2, 0.8),
    style: (r, c) => {
      if (r === 0) return null;
      if (r === target && found && (c === 0 || (c === 2 && t >= 6.8))) return { fill: d.rgba(a, 0.3), weight: 700 };
      if (found && r !== target) return { alpha: 0.45 };
      return null;
    },
  });

  const first = g.cell(1, 0);
  const hit = g.cell(target, 0);
  if (scan > 0 && !found) {
    const y = d.lerp(first.y + first.h / 2, hit.y + hit.h / 2, scan);
    ctx.save();
    ctx.fillStyle = d.rgba(a, 0.25);
    ctx.fillRect(first.x, y - first.h / 2, first.w, first.h);
    ctx.fillStyle = d.rgba(a, 0.95);
    ctx.fillRect(first.x, y - 2, first.w, 4);
    ctx.restore();
  }
  if (found) d.selection(ctx, hit, a, 1 - d.seg(t, 6.6, 7));

  for (let c = 0; c < 3; c += 1) {
    const cell = g.cell(0, c);
    d.text(ctx, String(c + 1), cell.x + cell.w / 2, g.y - 18, {
      size: 30, weight: 800, mono: true, align: 'center', color: d.rgba(a), alpha: d.easeOut(d.seg(t, 5.6 + c * 0.35, 5.9 + c * 0.35)),
    });
  }
  const beam = d.easeInOut(d.seg(t, 5.6, 6.8));
  if (beam > 0) {
    const out = g.cell(target, 2);
    const x1 = hit.x + hit.w / 2;
    const x2 = d.lerp(x1, out.x + 30, beam);
    const y = hit.y + hit.h / 2;
    ctx.save();
    ctx.globalAlpha = 1 - d.seg(t, 7.6, 8.2);
    ctx.strokeStyle = d.rgba(a);
    ctx.lineWidth = 5;
    ctx.beginPath();
    ctx.moveTo(x1, y + 18);
    ctx.lineTo(x2, y + 18);
    ctx.stroke();
    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    ctx.arc(x2, y + 18, 7, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }

  const result = lookupCategory(id);
  const px = 1080;
  const fly = d.easeInOut(d.seg(t, 7, 8));
  if (fly > 0 && fly < 1) {
    const from = g.cell(target, 2);
    const pos = d.arc(from.x + from.w / 2, from.y + from.h / 2, px + 340, 530, fly, 140);
    d.chip(ctx, result, pos.x, pos.y, { size: 28, accent: a, align: 'center' });
  }
  const pa = d.easeOut(d.seg(t, 6.8, 7.4));
  d.panel(ctx, px, 410, 680, 190, { alpha: pa, stroke: d.rgba(a, 0.45) });
  d.text(ctx, `ผลลัพธ์ใน E22 · ${id} ซื้อหมวด`, px + 36, 464, { size: 28, color: d.MUTED, alpha: pa });
  d.text(ctx, result, px + 36, 558, { size: 60, weight: 800, color: d.rgba(a), alpha: d.seg(t, 7.9, 8.3) });

  const ca = d.easeOut(d.seg(t, 9.5, 10.2));
  d.panel(ctx, px, 625, 680, 280, { alpha: ca });
  d.text(ctx, 'หรือใช้ XLOOKUP', px + 36, 680, { size: 32, weight: 700, color: d.rgba(a), alpha: ca });
  d.formulaText(ctx, `=XLOOKUP("${id}", A5:A11, C5:C11)`, px + 36, 734, { size: 24, accent: a, alpha: ca });
  ['ไม่ต้องนับเลขคอลัมน์', 'ค้นข้อมูลทางซ้ายของรหัสได้', 'INDEX + MATCH ให้ผลเหมือนกัน'].forEach((line, i) => {
    const la = d.seg(t, 11 + i * 1.1, 11.4 + i * 1.1);
    d.check(ctx, px + 52, 792 + i * 44, 26, d.rgba(a), la);
    d.text(ctx, line, px + 84, 802 + i * 44, { size: 28, alpha: la });
  });
}

// ── 7. FILTER & QUERY ───────────────────────────────────────────────────
const FIL_COLS = [
  { key: 'A', w: 190 }, { key: 'B', w: 180 }, { key: 'C', w: 230 },
  { key: 'D', w: 180 }, { key: 'E', w: 100 }, { key: 'F', w: 180 },
];
const FIL_ROWS = rowsFrom(['TransactionID', 'Region', 'Category', 'Date', 'Units', 'Revenue'],
  SALES.map(sale => [sale.id, sale.region, sale.category, sale.date, sale.units, sale.revenue]));
const LIMIT = 100000;

function filter(ctx, t, scene) {
  const a = scene.accent;
  d.header(ctx, t, a, 'ค้นหาข้อมูล · FILTER และ QUERY', 'ดึงทุกแถวที่ผ่านเงื่อนไข');
  const queryPhase = t >= 9.8;
  d.formulaBar(ctx, 120, 290, 1640, queryPhase ? 'H4' : 'H5',
    queryPhase ? '=QUERY(A4:F11, "select C, sum(F) group by C", 1)' : `=FILTER(A5:A11, F5:F11>${LIMIT})`, {
      accent: a, time: t, size: 30,
      p: queryPhase ? d.seg(t, 10, 12.4) : d.seg(t, 0.8, 3),
      alpha: queryPhase ? d.seg(t, 9.8, 10) : 1 - d.seg(t, 9.5, 9.8),
    });

  const passes = r => SALES[r - 1].revenue > LIMIT;
  const scan = d.seg(t, 3.2, 5.4);
  const evaluated = r => scan >= r / 7 - 0.001;
  const breakP = r => (t < 9.6 ? d.seg(t, 5.6 + r * 0.08, 7 + r * 0.08) : 1 - d.seg(t, 9.6 + r * 0.05, 10.6 + r * 0.05));
  const tint = d.seg(t, 12.6, 13.2);
  const g = d.sheet(ctx, {
    x: 120, y: 410, cols: FIL_COLS, rows: FIL_ROWS, rowStart: 4, rowH: 56, size: 24, accent: a,
    appear: () => d.seg(t, 0.2, 0.8),
    style: (r) => {
      if (r === 0) return null;
      if (tint > 0) {
        return { fill: SALES[r - 1].category === 'Electronics' ? d.rgba(a, 0.2 * tint) : `rgba(103, 232, 249, ${0.16 * tint})` };
      }
      if (!passes(r) && breakP(r) > 0) return { alpha: 0 };
      if (evaluated(r) && passes(r) && t < 9.6) return { fill: d.rgba(a, 0.24) };
      return null;
    },
  });

  for (let r = 1; r <= SALES.length; r += 1) {
    const rect = d.unionRect(g.cell(r, 0), g.cell(r, 5));
    if (!passes(r)) {
      const p = breakP(r);
      if (p > 0 && p < 1) d.shatter(ctx, rect, p, r, 'rgba(148, 163, 184, 0.85)');
    }
    const markAlpha = evaluated(r) ? 1 - d.seg(t, 8.8, 9.3) : 0;
    const f = g.cell(r, 5);
    if (passes(r)) d.check(ctx, f.x + f.w + 34, f.y + f.h / 2, 30, d.rgba(a), markAlpha);
    else d.cross(ctx, f.x + f.w + 34, f.y + f.h / 2, 30, '#f87171', markAlpha * (1 - d.seg(t, 5.6, 6)));
  }

  const px = 1330;
  const spillAlpha = d.window01(t, 7.2, 9.8, 0.5, 0.4);
  if (spillAlpha > 0) {
    d.panel(ctx, px, 410, 430, 300, { alpha: spillAlpha, stroke: d.rgba(a, 0.45) });
    d.text(ctx, 'ผลลัพธ์ล้นลงมา (spill)', px + 30, 466, { size: 28, weight: 700, alpha: spillAlpha });
    filterIds(LIMIT).forEach((id, i) => {
      const y = 510 + i * 82;
      const arrive = d.seg(t, 8.3 + i * 0.35, 8.5 + i * 0.35);
      d.panel(ctx, px + 30, y, 370, 66, { r: 8, alpha: spillAlpha, fill: d.rgba(a, 0.14 * arrive + 0.04), stroke: d.rgba(a, 0.4) });
      d.text(ctx, `H${5 + i}`, px + 54, y + 34, { size: 22, mono: true, color: d.MUTED, baseline: 'middle', alpha: spillAlpha });
      d.text(ctx, id, px + 130, y + 34, { size: 30, mono: true, weight: 700, baseline: 'middle', alpha: spillAlpha * arrive });
      const r = SALES.findIndex(sale => sale.id === id) + 1;
      const p = d.easeInOut(d.seg(t, 7.4 + i * 0.35, 8.4 + i * 0.35));
      if (p > 0 && p < 1) {
        const from = g.cell(r, 0);
        const pos = d.arc(from.x + from.w / 2, from.y + from.h / 2, px + 210, y + 33, p, 100);
        d.chip(ctx, id, pos.x, pos.y, { size: 26, mono: true, accent: a, align: 'center' });
      }
    });
  }

  const qa = d.easeOut(d.seg(t, 12.6, 13.2));
  if (qa > 0) {
    const totals = queryTotals();
    d.panel(ctx, px, 410, 430, 300, { alpha: qa, stroke: d.rgba(a, 0.45) });
    d.text(ctx, 'Category', px + 30, 470, { size: 24, weight: 700, color: d.MUTED, alpha: qa });
    d.text(ctx, 'sum Revenue', px + 400, 470, { size: 24, weight: 700, color: d.MUTED, align: 'right', alpha: qa });
    Object.entries(totals).forEach(([cat, sum], i) => {
      const y = 556 + i * 84;
      const p = d.easeOut(d.seg(t, 13 + i * 0.3, 14.4 + i * 0.3));
      ctx.save();
      ctx.globalAlpha = qa;
      ctx.fillStyle = i === 0 ? d.rgba(a) : '#67e8f9';
      ctx.beginPath();
      ctx.arc(px + 40, y - 10, 9, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
      d.text(ctx, cat, px + 60, y, { size: 28, weight: 600, alpha: qa });
      d.text(ctx, d.fmt(Math.round(sum * p)), px + 400, y, { size: 30, weight: 800, mono: true, align: 'right', alpha: qa });
    });
    d.chip(ctx, 'คล้าย SQL: select · where · group by', px, 780, { size: 22, accent: a, alpha: d.seg(t, 15, 15.6) });
  }
}

// ── 8. Regex ─────────────────────────────────────────────────────────────
const REGEX_SIZE = 30;

function regex(ctx, t, scene) {
  const a = scene.accent;
  d.header(ctx, t, a, 'ขั้นสูง · Regular Expression', 'หาแพทเทิร์นในข้อความ');
  const replacePhase = t >= 8.4;
  d.formulaBar(ctx, 140, 290, 1620, replacePhase ? 'E8' : 'E6',
    replacePhase ? '=REGEXREPLACE(B8, "\\d{4}$", "****")' : '=REGEXEXTRACT(B6, "@([^ /]+)")', {
      accent: a, time: t,
      p: replacePhase ? d.seg(t, 8.6, 10.4) : d.seg(t, 0.8, 2.8),
      alpha: replacePhase ? d.seg(t, 8.4, 8.6) : 1 - d.seg(t, 8.1, 8.4),
    });

  const textX = 310;
  // d.text() changes ctx.font, so measure with the row font explicitly every time.
  const widthOf = str => d.measure(ctx, str, REGEX_SIZE, 500, true);
  CONTACTS.forEach((contact, i) => {
    const y = 410 + i * 116;
    const isTarget = contact.id === 'R-004';
    const dim = replacePhase && !isTarget ? 1 - 0.6 * d.seg(t, 10.4, 10.8) : 1;
    const rowAlpha = d.easeOut(d.seg(t, 0.4 + i * 0.15, 1 + i * 0.15)) * dim;
    const stroke = replacePhase && isTarget ? d.rgba(a, 0.3 + 0.5 * d.seg(t, 10.4, 10.8)) : d.LINE;
    d.panel(ctx, 140, y, 1120, 92, { r: 12, alpha: rowAlpha, stroke });
    d.text(ctx, contact.id, 170, y + 48, { size: 24, mono: true, color: d.MUTED, baseline: 'middle', alpha: rowAlpha });

    const match = contact.text.match(DOMAIN_PATTERN);
    const mx = textX + widthOf(contact.text.slice(0, match.index));
    const mw = widthOf(match[0]);
    const sweep = d.seg(t, 3.2 + i * 0.5, 4.4 + i * 0.5);
    const lineW = widthOf(contact.text);
    const cursorX = textX + lineW * sweep;
    const grown = d.clamp((cursorX - mx) / mw);
    const keep = 1 - d.seg(t, 8, 8.4);
    if (grown > 0 && keep > 0) {
      ctx.save();
      ctx.globalAlpha = rowAlpha * keep;
      ctx.fillStyle = d.rgba(a, 0.28);
      ctx.fillRect(mx - 4, y + 22, mw * grown + 8, 50);
      ctx.strokeStyle = d.rgba(a, 0.9);
      ctx.lineWidth = 2;
      ctx.strokeRect(mx - 4, y + 22, mw * grown + 8, 50);
      ctx.restore();
    }
    if (sweep > 0 && sweep < 1) {
      ctx.save();
      ctx.fillStyle = d.rgba(a);
      ctx.fillRect(cursorX, y + 16, 3, 60);
      ctx.restore();
    }

    if (isTarget && t >= 11.4) {
      const head = contact.text.replace(PHONE_TAIL_PATTERN, '');
      d.text(ctx, head, textX, y + 48, { size: REGEX_SIZE, mono: true, baseline: 'middle', alpha: rowAlpha });
      const settle = t >= 12.6;
      const glyphs = '0123456789#*@%';
      const tail = settle ? '****' : Array.from({ length: 4 }, (_, k) => glyphs[Math.floor(d.hash(Math.floor(t * 18) * 4 + k) * glyphs.length)]).join('');
      d.text(ctx, tail, textX + widthOf(head), y + 48, { size: REGEX_SIZE, mono: true, weight: 700, color: AMBER, baseline: 'middle', alpha: rowAlpha });
    } else {
      d.text(ctx, contact.text, textX, y + 48, { size: REGEX_SIZE, mono: true, baseline: 'middle', alpha: rowAlpha });
    }
    if (isTarget) {
      const tailMatch = contact.text.match(PHONE_TAIL_PATTERN);
      const tx = textX + widthOf(contact.text.slice(0, tailMatch.index));
      const tw = widthOf(tailMatch[0]) * d.easeOut(d.seg(t, 10.8, 11.4));
      if (tw > 0) {
        ctx.save();
        ctx.strokeStyle = AMBER;
        ctx.lineWidth = 3;
        ctx.strokeRect(tx - 4, y + 22, tw + 8, 50);
        ctx.restore();
      }
    }
  });

  // Pattern legend: first the extract pattern, then the replace pattern.
  const legend = (alpha, pattern, lines) => {
    if (alpha <= 0) return;
    d.panel(ctx, 1320, 410, 440, 300, { alpha, stroke: d.rgba(a, 0.45) });
    d.text(ctx, 'แพทเทิร์น', 1350, 462, { size: 26, color: d.MUTED, alpha });
    d.text(ctx, pattern, 1350, 528, { size: 44, mono: true, weight: 700, color: '#f9a8d4', alpha });
    lines.forEach(([token, meaning], i) => {
      d.text(ctx, token, 1350, 588 + i * 40, { size: 24, mono: true, weight: 700, color: d.rgba(a), alpha });
      d.text(ctx, meaning, 1460, 588 + i * 40, { size: 24, alpha });
    });
  };
  legend(d.window01(t, 1.2, 8.4, 0.5, 0.3), '@([^ /]+)', [['@', 'ตัวอักษร @'], ['[^ /]+', 'ไม่ใช่ช่องว่างหรือ /'], ['( )', 'ส่วนที่ต้องการดึง']]);
  legend(d.seg(t, 8.6, 9.1), '\\d{4}$', [['\\d', 'ตัวเลข 0–9'], ['{4}', 'ติดกัน 4 ตัว'], ['$', 'ท้ายข้อความ']]);

  // Extracted group from R-002 lifts out into the result card.
  const r002 = CONTACTS.findIndex(contact => contact.id === 'R-002');
  const domain = CONTACTS[r002].text.match(DOMAIN_PATTERN)[1];
  const resultAlpha = d.window01(t, 6.6, 8.4, 0.4, 0.3);
  const lift = d.easeInOut(d.seg(t, 5.8, 6.8));
  if (lift > 0 && lift < 1) {
    const contact = CONTACTS[r002];
    const start = textX + widthOf(contact.text.slice(0, contact.text.indexOf(domain)));
    const pos = d.arc(start + widthOf(domain) / 2, 410 + r002 * 116 + 46, 1540, 790, lift, 120);
    d.chip(ctx, domain, pos.x, pos.y, { size: 28, mono: true, accent: a, align: 'center' });
  }
  if (resultAlpha > 0) {
    d.panel(ctx, 1320, 740, 440, 150, { alpha: resultAlpha, stroke: d.rgba(a, 0.45) });
    d.text(ctx, 'ผลลัพธ์ใน E6', 1350, 790, { size: 24, color: d.MUTED, alpha: resultAlpha });
    d.text(ctx, domain, 1350, 856, { size: 46, mono: true, weight: 700, color: d.rgba(a), alpha: resultAlpha });
  }

  const target = CONTACTS.find(contact => contact.id === 'R-004');
  const ra = d.easeOut(d.seg(t, 12.8, 13.4));
  d.panel(ctx, 140, 780, 1120, 92, { r: 12, alpha: ra, stroke: d.rgba(a, 0.5) });
  d.text(ctx, 'E8', 170, 828, { size: 24, mono: true, color: d.rgba(a), baseline: 'middle', alpha: ra });
  d.text(ctx, maskPhone(target.text), textX, 828, { size: REGEX_SIZE, mono: true, baseline: 'middle', alpha: ra });

  [['REGEXMATCH', 'ตรวจ → TRUE/FALSE'], ['REGEXEXTRACT', 'ดึงส่วนที่ต้องการ'], ['REGEXREPLACE', 'แทนที่ข้อความ']].forEach(([fn, label], i) => {
    const alpha = d.seg(t, 14 + i * 0.4, 14.4 + i * 0.4);
    d.text(ctx, fn, 1320, 770 + i * 50, { size: 24, mono: true, weight: 700, color: d.rgba(a), alpha });
    d.text(ctx, label, 1540, 770 + i * 50, { size: 24, alpha });
  });
}

// ── 9. LET / LAMBDA / MAP ───────────────────────────────────────────────
function machine(ctx, x, y, alpha, busy, accent, title, body) {
  if (alpha <= 0) return;
  const pulse = 0.4 + 0.6 * busy;
  d.panel(ctx, x, y, 400, 220, { r: 24, alpha, fill: 'rgba(15, 23, 42, 0.9)', stroke: d.rgba(accent, pulse), lineWidth: 3 + busy * 3 });
  d.text(ctx, title, x + 200, y + 74, { size: 30, weight: 700, mono: true, align: 'center', color: d.rgba(accent), alpha });
  d.text(ctx, body, x + 200, y + 158, { size: 52, weight: 700, mono: true, align: 'center', alpha });
}

function lambda(ctx, t, scene) {
  const a = scene.accent;
  d.header(ctx, t, a, 'ขั้นสูง · LET LAMBDA MAP', 'สร้างฟังก์ชันใช้ซ้ำเอง');
  const stage = t < 4.6 ? 0 : t < 9.2 ? 1 : 2;
  const bars = [
    ['E2', '=LET(qty, C2, price, D2, qty*price)', d.seg(t, 0.8, 2.4)],
    ['E4', '=LAMBDA(q, p, q*p)(C4, D4)', d.seg(t, 4.8, 6)],
    ['E2', '=MAP(C2:C5, D2:D5, LAMBDA(q, p, q*p))', d.seg(t, 9.4, 11)],
  ];
  const [ref, formula, p] = bars[stage];
  const starts = [0, 4.6, 9.2];
  const ends = [4.6, 9.2, 99];
  d.formulaBar(ctx, 160, 290, 1600, ref, formula, {
    accent: a, time: t, p, alpha: d.window01(t, starts[stage], ends[stage], 0.2, 0.3),
  });

  // LET: two named values feed one expression.
  const letAlpha = 1 - d.seg(t, 4.2, 4.6);
  if (letAlpha > 0) {
    const first = CLASSROOM[0];
    const tags = [[`qty = ${first.qty}`, 2.4], [`price = ${first.price}`, 2.8]];
    tags.forEach(([label, at], i) => {
      const alpha = d.easeOut(d.seg(t, at, at + 0.4)) * letAlpha;
      d.chip(ctx, label, 300, 520 + i * 130, { size: 40, mono: true, accent: a, alpha });
      if (alpha > 0) {
        ctx.save();
        ctx.globalAlpha = d.seg(t, 3.2, 3.6) * letAlpha;
        d.arrow(ctx, 640, 520 + i * 130, 830, 585, d.rgba(a), 3);
        ctx.restore();
      }
    });
    const exprAlpha = d.seg(t, 3.2, 3.6) * letAlpha;
    d.panel(ctx, 850, 530, 360, 110, { alpha: exprAlpha, stroke: d.rgba(a, 0.5) });
    d.text(ctx, 'qty*price', 1030, 598, { size: 44, mono: true, weight: 700, align: 'center', alpha: exprAlpha });
    const resAlpha = d.seg(t, 3.6, 4) * letAlpha;
    if (resAlpha > 0) d.arrow(ctx, 1230, 585, 1370, 585, d.rgba(a), 3);
    d.text(ctx, d.fmt(first.qty * first.price), 1400, 610, { size: 80, weight: 800, color: d.rgba(a), alpha: resAlpha });
    d.text(ctx, 'ตั้งชื่อให้ค่า แล้วสูตรอ่านง่ายขึ้น', 300, 820, { size: 32, weight: 600, alpha: d.seg(t, 3.8, 4.2) * letAlpha });
  }

  // LAMBDA machine persists through MAP.
  const mx = 760;
  const my = 470;
  const machineAlpha = d.easeOut(d.seg(t, 5, 5.6));
  let busy = 0;

  if (stage === 1) {
    const row = CLASSROOM[2];
    const inA = d.easeInOut(d.seg(t, 6.6, 7.6));
    const fade = 1 - d.seg(t, 8.8, 9.2);
    busy = d.window01(t, 7.4, 8.2, 0.2, 0.3);
    [[`q = ${row.qty}`, 520], [`p = ${row.price}`, 650]].forEach(([label, y]) => {
      const x = d.lerp(380, mx + 40, inA);
      d.chip(ctx, label, x, d.lerp(y, my + 110, inA), { size: 34, mono: true, accent: a, align: 'center', alpha: d.seg(t, 6, 6.4) * (1 - d.seg(inA, 0.8, 1)) * fade });
    });
    const out = d.easeInOut(d.seg(t, 7.8, 8.8));
    if (out > 0) {
      d.chip(ctx, d.fmt(row.qty * row.price), d.lerp(mx + 360, 1480, out), my + 110, { size: 44, mono: true, accent: a, align: 'center', alpha: d.seg(out, 0, 0.2) * fade });
    }
    d.text(ctx, 'ส่งค่าเข้า q และ p ได้ผลลัพธ์ออกมา', 960, 860, { size: 32, weight: 600, align: 'center', alpha: d.window01(t, 8, 9.2, 0.4, 0.3) });
  }

  if (stage === 2) {
    const values = amounts();
    d.text(ctx, 'C2:D5', 300, 420, { size: 26, mono: true, color: d.MUTED, align: 'center', alpha: d.seg(t, 9.8, 10.2) });
    d.text(ctx, 'E2:E5', 1500, 420, { size: 26, mono: true, color: d.MUTED, align: 'center', alpha: d.seg(t, 9.8, 10.2) });
    CLASSROOM.forEach((row, k) => {
      const y = 470 + k * 96;
      const enter = d.easeInOut(d.seg(t, 11 + k * 0.9, 11.7 + k * 0.9));
      const leave = d.easeInOut(d.seg(t, 11.7 + k * 0.9, 12.4 + k * 0.9));
      busy = Math.max(busy, d.window01(t, 11.5 + k * 0.9, 12 + k * 0.9, 0.15, 0.2));
      const inAlpha = d.seg(t, 10 + k * 0.15, 10.4 + k * 0.15) * (1 - d.seg(enter, 0.75, 1));
      d.chip(ctx, `${row.qty} × ${row.price}`, d.lerp(300, mx + 60, enter), d.lerp(y, my + 110, enter), { size: 30, mono: true, accent: a, align: 'center', alpha: inAlpha });
      if (leave > 0) {
        d.chip(ctx, d.fmt(values[k]), d.lerp(mx + 340, 1500, leave), d.lerp(my + 110, y, leave), { size: 34, mono: true, accent: a, align: 'center', alpha: d.seg(leave, 0, 0.15) });
      }
    });
    d.text(ctx, 'สูตรเดียว ได้ครบทุกแถว', 960, 900, { size: 40, weight: 700, align: 'center', color: d.rgba(a), alpha: d.easeOut(d.seg(t, 14.8, 15.4)) });
  }

  if (stage > 0) machine(ctx, mx, my, machineAlpha, busy, a, 'LAMBDA(q, p)', 'q * p');
}

// ── 10. Practice ─────────────────────────────────────────────────────────
const GROUPS = [
  { prefix: 'HR', sheet: 'HR_Roster', hint: 'COUNTIF · SUMIF · DATEDIF' },
  { prefix: 'SD', sheet: 'Sales_Data', hint: 'VLOOKUP · MAXIFS · FILTER' },
  { prefix: 'RG', sheet: 'Regex_Data', hint: 'REGEXMATCH · EXTRACT · REPLACE' },
].map(group => ({ ...group, ids: tasks.filter(task => task.id.startsWith(group.prefix)).map(task => task.id) }));

function practice(ctx, t, scene) {
  const a = scene.accent;
  const total = tasks.length;
  d.header(ctx, t, a, 'แบบฝึก · Assignments', `ฝึก ${total} ข้อจากข้อมูลจริง`);
  const x0 = 500;
  const cw = 115;
  const gap = 11;
  const tickStart = 3.2;
  const tickEach = 7.6 / total;
  let index = 0;
  GROUPS.forEach((group, gi) => {
    const y = 330 + gi * 140;
    const rowAlpha = d.easeOut(d.seg(t, 0.6 + gi * 0.2, 1.1 + gi * 0.2));
    d.text(ctx, group.sheet, 140, y + 46, { size: 32, weight: 700, alpha: rowAlpha });
    d.text(ctx, group.hint, 140, y + 88, { size: 18, mono: true, color: d.MUTED, alpha: rowAlpha });
    group.ids.forEach((id, k) => {
      const x = x0 + k * (cw + gap);
      const appear = d.easeOut(d.seg(t, 0.8 + index * 0.05, 1.2 + index * 0.05));
      const done = d.seg(t, tickStart + index * tickEach, tickStart + (index + 1) * tickEach);
      d.panel(ctx, x, y + (1 - appear) * 20, cw, 110, {
        r: 12, alpha: appear, fill: done > 0 ? d.rgba(a, 0.12 + 0.18 * done) : d.PANEL, stroke: d.rgba(a, 0.2 + 0.6 * done),
      });
      d.text(ctx, id, x + cw / 2, y + 38, { size: 20, mono: true, weight: 700, align: 'center', alpha: appear, color: done > 0 ? d.TEXT : d.MUTED });
      d.check(ctx, x + cw / 2, y + 74, 34, d.rgba(a), done);
      index += 1;
    });
  });

  const solved = Math.min(total, Math.max(0, Math.floor((t - tickStart) / tickEach)));
  const pa = d.easeOut(d.seg(t, 2.4, 3));
  const px = 140;
  const py = 780;
  d.panel(ctx, px, py, 1640, 130, { alpha: pa, stroke: d.rgba(a, 0.45) });
  d.text(ctx, 'Assignments!F3 · Self_Check', px + 40, py + 54, { size: 26, mono: true, color: d.MUTED, alpha: pa });
  d.text(ctx, 'ไฟล์ .xlsx ตรวจคำตอบให้ทันทีเมื่อพิมพ์สูตรถูก', px + 40, py + 100, { size: 28, alpha: pa * d.seg(t, 11.8, 12.4) });
  const barX = px + 700;
  const barW = 640;
  d.panel(ctx, barX, py + 50, barW, 30, { r: 15, alpha: pa, fill: 'rgba(30, 41, 59, 0.9)', stroke: null });
  if (solved > 0) d.panel(ctx, barX, py + 50, barW * (solved / total), 30, { r: 15, alpha: pa, fill: d.rgba(a), stroke: null });
  const done = solved === total;
  const pop = done ? 1 + 0.15 * Math.sin(Math.PI * d.seg(t, tickStart + total * tickEach, tickStart + total * tickEach + 0.5)) : 1;
  ctx.save();
  ctx.translate(px + 1600, py + 78);
  ctx.scale(pop, pop);
  d.text(ctx, `${solved} / ${total}`, 0, 0, { size: 54, weight: 800, align: 'right', baseline: 'middle', color: done ? d.rgba(a) : d.TEXT, alpha: pa });
  ctx.restore();
}

// ── 11. Outro ────────────────────────────────────────────────────────────
function outro(ctx, t, scene) {
  const a = scene.accent;
  d.revealText(ctx, 'เปิดสื่อหนึ่งแท็บ', 960, 400, d.seg(t, 0.5, 2), { size: 100, weight: 800, align: 'center' });
  d.revealText(ctx, 'ลงมือทำอีกหนึ่งแท็บ', 960, 530, d.seg(t, 1.4, 3), { size: 100, weight: 800, align: 'center', color: d.rgba(a) });
  const ua = d.easeOut(d.seg(t, 4, 4.8));
  d.chip(ctx, SITE_URL, 960, 660 + (1 - ua) * 20, { size: 36, mono: true, accent: a, align: 'center', alpha: ua });
  const da = d.easeOut(d.seg(t, 5, 5.8));
  d.chip(ctx, `ดาวน์โหลดไฟล์แบบฝึก ${PRACTICE_FILE}`, 960, 760 + (1 - da) * 20, { size: 28, accent: a, align: 'center', alpha: da, fill: false });
  d.text(ctx, 'เรียนฟรี · เรียนด้วยตนเอง · CC BY-NC-SA 4.0', 960, 860, {
    size: 26, color: d.MUTED, align: 'center', alpha: d.easeOut(d.seg(t, 6, 6.8)),
  });
}

const DRAWERS = { intro, cells, references, sumif, chart, lookup, filter, regex, lambda, practice, outro };

export const SCENES = SCENE_SPECS.map(spec => ({ ...spec, draw: DRAWERS[spec.id] }));
