// Checks that every number the trailer shows matches the practice workbook,
// and that the timeline math (seek, clamp, transitions) behaves at the edges.
// Like verify-practice.cjs, it recomputes values in JS and never runs Google Sheets.
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import assert from 'node:assert/strict';
import ExcelJS from 'exceljs';
import {
  CLASSROOM, SALES, CONTACTS, SCENE_SPECS, DISCOUNT,
  amounts, byCategory, grandTotal, discounted, filterIds, queryTotals, lookupCategory,
  extractDomain, maskPhone,
} from '../src/video/data.js';
import { buildTimeline, locate, TRANSITION } from '../src/video/timeline.js';

const root = new URL('../', import.meta.url);
const tasks = JSON.parse(readFileSync(new URL('src/practice-tasks.json', root), 'utf8'));
const expected = Object.fromEntries(tasks.map(task => [task.id, task.expected]));
const workbook = new ExcelJS.Workbook();
await workbook.xlsx.readFile(fileURLToPath(new URL('public/Google_Sheets_Mastery_Practice.xlsx', root)));

const rowValues = (sheet, row, width) => workbook.getWorksheet(sheet).getRow(row).values.slice(1, width + 1);
let checks = 0;
const check = (label, fn) => {
  try {
    fn();
    checks += 1;
  } catch (error) {
    console.error(`✗ ${label}`);
    throw error;
  }
};

check('Classroom rows match the workbook', () => {
  CLASSROOM.forEach((item, index) => {
    assert.deepEqual(rowValues('Classroom', index + 2, 4), [item.item, item.category, item.qty, item.price]);
  });
});

check('Sales_Data rows match the workbook', () => {
  SALES.forEach((sale, index) => {
    const [id, region, category, date, units, revenue] = rowValues('Sales_Data', index + 5, 6);
    assert.deepEqual(
      [id, region, category, new Date(date).toISOString().slice(0, 10), units, revenue],
      [sale.id, sale.region, sale.category, sale.date, sale.units, sale.revenue],
    );
  });
  assert.equal(SALES.length, 7);
});

check('Regex_Data rows match the workbook', () => {
  CONTACTS.forEach(contact => {
    const row = 5 + Number(contact.id.slice(2)) - 1;
    assert.deepEqual(rowValues('Regex_Data', row, 2), [contact.id, contact.text]);
  });
});

check('Classroom totals match the lesson text', () => {
  assert.deepEqual(amounts(), [200, 50, 56, 90]);
  assert.deepEqual(byCategory(), { 'เครื่องเขียน': 250, 'อาหาร': 146 });
  assert.equal(grandTotal(), 396);
  assert.equal(DISCOUNT, 0.1);
  assert.deepEqual(discounted(), [180, 45, 50.4, 81]);
});

check('Sales answers match practice-tasks.json', () => {
  assert.equal(lookupCategory('TX-1004'), expected['SD-07']);
  assert.deepEqual(filterIds(100000), ['TX-1001', 'TX-1005']);
  assert.match(expected['SD-10'], /TX-1001 และ TX-1005/);
  const totals = queryTotals();
  assert.deepEqual(totals, { Electronics: 505000, 'Office Supplies': 88000 });
  assert.equal(totals.Electronics + totals['Office Supplies'], 593000);
  assert.equal(expected['SD-01'], '593,000.00');
});

check('Regex answers match practice-tasks.json', () => {
  const r002 = CONTACTS.find(contact => contact.id === 'R-002');
  const r004 = CONTACTS.find(contact => contact.id === 'R-004');
  assert.equal(extractDomain(r002.text), expected['RG-04']);
  assert.equal(maskPhone(r004.text), expected['RG-08']);
});

check('Practice task count is 30 (10 per sheet)', () => {
  assert.equal(tasks.length, 30);
  for (const prefix of ['HR', 'SD', 'RG']) {
    assert.equal(tasks.filter(task => task.id.startsWith(prefix)).length, 10);
  }
});

const timeline = buildTimeline(SCENE_SPECS);
const half = TRANSITION / 2;
const close = (actual, wanted) => assert.ok(Math.abs(actual - wanted) < 1e-9, `${actual} ≠ ${wanted}`);

check('Timeline totals 180 seconds across 11 scenes', () => {
  assert.equal(SCENE_SPECS.length, 11);
  assert.equal(timeline.total, 180);
  assert.equal(new Set(SCENE_SPECS.map(scene => scene.id)).size, 11);
  SCENE_SPECS.forEach(scene => {
    assert.ok(scene.caption.length > 0, `${scene.id} needs a caption`);
    assert.equal(scene.accent.length, 3);
  });
});

check('locate() clamps before the start and after the end', () => {
  assert.deepEqual(locate(timeline, -5), { index: 0, local: 0, next: null });
  assert.deepEqual(locate(timeline, 0), { index: 0, local: 0, next: null });
  const last = SCENE_SPECS.length - 1;
  assert.deepEqual(locate(timeline, 999), { index: last, local: SCENE_SPECS[last].duration, next: null });
  assert.deepEqual(locate(timeline, timeline.total), { index: last, local: SCENE_SPECS[last].duration, next: null });
});

check('locate() blends scenes symmetrically around each boundary', () => {
  const boundary = timeline.starts[1];
  const mid = locate(timeline, boundary);
  assert.equal(mid.index, 0);
  assert.equal(mid.next.index, 1);
  close(mid.next.mix, 0.5);
  close(mid.local, SCENE_SPECS[0].duration);
  close(mid.next.local, 0);

  const start = locate(timeline, boundary - half);
  assert.equal(start.next.index, 1);
  close(start.next.mix, 0);

  // Just past the blend the outgoing scene must be gone, not frozen at mix 1.
  const after = locate(timeline, boundary + half);
  assert.equal(after.index, 1);
  assert.equal(after.next, null);
  close(after.local, half);
  assert.equal(locate(timeline, boundary - half - 0.01).next, null);
});

check('No transition is attached to the first start or the end', () => {
  assert.equal(locate(timeline, 0.1).next, null);
  assert.equal(locate(timeline, timeline.total - 0.1).next, null);
});

console.log(`✓ check:video passed ${checks} checks (data recomputed in JS; formulas are not run in Google Sheets)`);
