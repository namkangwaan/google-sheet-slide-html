// Checks public/Google_Sheets_Homework.xlsx.
// Always (CI included): structure, data, blank learner cells, no answers and no formulas in the file.
// Teacher mode (only when the gitignored teacher/homework-answers.json exists): evaluates every answer
// formula with HyperFormula against the workbook data, checks that the tasks catch the mistakes they
// are designed to catch, and that teacher/homework_answer_key.gs is in sync.
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const ExcelJS = require('exceljs');
const { PRODUCTS, ORDERS, ORDER_COLUMNS, LEARNER_ORDER_COLUMNS, TASKS, POINTS } = require('../generate-homework.cjs');

const root = path.resolve(__dirname, '..');
const teacherAnswers = path.join(root, 'teacher', 'homework-answers.json');
const FIRST = 5;
const LAST_ORDER = FIRST + ORDERS.length - 1;
const LAST_TASK = FIRST + TASKS.length - 1;

async function verify() {
  const wb = new ExcelJS.Workbook();
  await wb.xlsx.readFile(path.join(root, 'public/Google_Sheets_Homework.xlsx'));
  assert.deepEqual(wb.worksheets.map(s => s.name), ['Start_Here', 'Settings', 'Orders', 'Products', 'Homework_Tasks']);
  const orders = wb.getWorksheet('Orders');
  const products = wb.getWorksheet('Products');
  const tasks = wb.getWorksheet('Homework_Tasks');
  const settings = wb.getWorksheet('Settings');
  const values = (sheet, r, n) => Array.from({ length: n }, (_, i) => sheet.getRow(r).getCell(i + 1).value);

  assert.equal(settings.getCell('A2').value, 'VAT_Rate');
  assert.equal(settings.getCell('B2').value, 0.07);
  assert.deepEqual(values(orders, 4, ORDER_COLUMNS.length), ORDER_COLUMNS);
  ORDERS.forEach(([id, date, ...rest], i) => {
    const row = values(orders, FIRST + i, ORDER_COLUMNS.length);
    assert.deepEqual([row[0], row[1].toISOString().slice(0, 10), ...row.slice(2, 7)], [id, date, ...rest], `Orders row ${FIRST + i}`);
    for (const col of LEARNER_ORDER_COLUMNS) assert.equal(row[col - 1], null, `Orders learner cell must be truly empty: row ${FIRST + i} col ${col}`);
  });
  PRODUCTS.forEach((product, i) => assert.deepEqual(values(products, FIRST + i, 3), product, `Products row ${FIRST + i}`));
  // Data the tasks rely on: an order whose code is missing from Products (IFERROR) and messy spacing (TRIM).
  assert.ok(ORDERS.some(o => !PRODUCTS.some(p => p[0] === o[3])), 'Need an order with an unknown Product_Code');
  assert.ok(ORDERS.some(o => /\s{2,}/.test(o[6].trim())), 'Need a customer name with double inner spaces');

  assert.deepEqual(values(tasks, 4, 5), ['Task_ID', 'Worksheet_Ref', 'Task', 'Points', 'Your_Formula']);
  TASKS.forEach(([id, ref, prompt], i) => {
    assert.deepEqual(values(tasks, FIRST + i, 5), [id, ref, prompt, POINTS, null], `Homework_Tasks row ${FIRST + i}`);
  });
  assert.equal(TASKS.length * POINTS, 100, 'Homework totals 100 points');
  // HW-20 (last) spills up to 3 rows; nothing may sit below it.
  assert.equal(TASKS.at(-1)[0], 'HW-20');
  assert.ok(tasks.rowCount <= LAST_TASK, 'No content below the last task (FILTER spill room)');

  // No formulas anywhere (a self-check formula would embed the answer), and no answer/result columns.
  wb.eachSheet(sheet => sheet.eachRow(row => row.eachCell(cell => {
    assert.ok(!cell.formula, `Unexpected formula: ${sheet.name}!${cell.address}`);
  })));
  for (const sheet of [orders, products, tasks]) {
    for (const header of values(sheet, 4, sheet.columnCount)) assert.ok(!/expected|answer|result|check/i.test(String(header ?? '')), `Answer-like column in ${sheet.name}: ${header}`);
  }

  // Prompts must not state their own answer (e.g. an example that equals the expected result).
  if (fs.existsSync(teacherAnswers)) {
    const key = JSON.parse(fs.readFileSync(teacherAnswers, 'utf8'));
    for (const [id, , prompt] of TASKS) {
      const expected = key.tasks[id].expected;
      for (const value of [expected].flat().filter(v => typeof v === 'string' && v.length > 3)) {
        const fromData = ORDERS.flat().includes(value) || PRODUCTS.flat().includes(value);
        // An output the task instructs (ให้แสดง "ไม่พบสินค้า") is part of the question, not a leak.
        const instructed = prompt.includes(`แสดง "${value}"`);
        assert.ok(fromData || instructed || !prompt.includes(value), `${id} prompt reveals its answer: ${value}`);
      }
    }
  }

  let teacherMode = '';
  if (fs.existsSync(teacherAnswers)) teacherMode = verifyTeacherKey(wb, JSON.parse(fs.readFileSync(teacherAnswers, 'utf8')));
  console.log(`PASS: homework structure, ${ORDERS.length} orders, ${TASKS.length} tasks (${TASKS.length * POINTS} points), blank learner cells, no formulas or answers in the student file.${teacherMode}`);
}

function verifyTeacherKey(wb, key) {
  const { HyperFormula } = require('hyperformula');
  const serial = d => (d.getTime() - Date.UTC(1899, 11, 30)) / 86400000;
  // HyperFormula needs TRUE()/FALSE(); Google Sheets accepts bare TRUE/FALSE. Convert outside string literals.
  const hf = formula => formula.split('"').map((part, i) => (i % 2 ? part : part.replace(/\b(TRUE|FALSE)\b(?!\()/g, '$1()'))).join('"');
  // Copy a row-5 formula down to `row` like dragging: every reference whose row is not $-locked shifts.
  const atRow = (formula, row) => formula.split('"').map((part, i) => (i % 2 ? part : part.replace(
    /(?<![\w$])(\$?[A-Z]{1,2})(\$?)(\d+)(?![\d(])/g,
    (ref, column, lock, n) => (lock ? ref : `${column}${Number(n) + row - FIRST}`),
  ))).join('"');
  const grid = sheet => {
    const g = [];
    sheet.eachRow({ includeEmpty: true }, (row, r) => {
      g[r - 1] = [];
      for (let c = 1; c <= sheet.columnCount; c++) {
        const v = row.getCell(c).value;
        g[r - 1][c - 1] = v instanceof Date ? serial(v) : v ?? null;
      }
    });
    return g.map(r => r || []);
  };
  const evaluate = columns => {
    const sheets = Object.fromEntries(['Settings', 'Orders', 'Products', 'Homework_Tasks'].map(n => [n, grid(wb.getWorksheet(n))]));
    for (let r = FIRST; r <= LAST_ORDER; r++) {
      for (const [col, formula] of Object.entries(columns)) sheets.Orders[r - 1][col.charCodeAt(0) - 65] = hf(atRow(formula, r));
    }
    TASKS.forEach(([id], i) => { sheets.Homework_Tasks[FIRST - 1 + i][4] = hf(key.tasks[id].formula); });
    while (sheets.Homework_Tasks.length < LAST_TASK + 3) sheets.Homework_Tasks.push([]);
    const engine = HyperFormula.buildFromSheets(sheets, { licenseKey: 'gpl-v3' });
    const sheet = engine.getSheetId('Homework_Tasks');
    const result = {};
    TASKS.forEach(([id], i) => {
      const expected = key.tasks[id].expected;
      const read = offset => engine.getCellValue({ sheet, row: FIRST - 1 + i + offset, col: 4 });
      result[id] = Array.isArray(expected) ? expected.map((_, k) => read(k)) : read(0);
    });
    engine.destroy();
    return result;
  };
  const same = (actual, expected) => (typeof expected === 'number' ? Math.round(actual * 100) === Math.round(expected * 100) : JSON.stringify(actual) === JSON.stringify(expected));

  assert.deepEqual(Object.keys(key.tasks), TASKS.map(([id]) => id), 'Teacher answers cover every task in order');
  const correct = evaluate(key.columns);
  for (const [id] of TASKS) assert.ok(same(correct[id], key.tasks[id].expected), `${id}: formula gives ${JSON.stringify(correct[id])}, expected ${JSON.stringify(key.tasks[id].expected)}`);

  // The tasks must discriminate: an unlocked VAT reference and a lookup without IFERROR give wrong answers.
  const unlocked = evaluate({ ...key.columns, I: key.columns.I.replace('$B$2', 'B2') });
  assert.ok(!same(unlocked['HW-18'], key.tasks['HW-18'].expected) && !same(unlocked['HW-19'], key.tasks['HW-19'].expected), 'HW-18/19 must catch a missing $');
  const noIferror = evaluate({ ...key.columns, J: '=INDEX(Products!$C$5:$C$10,MATCH(D5,Products!$A$5:$A$10,0))' });
  assert.ok(!same(noIferror['HW-10'], key.tasks['HW-10'].expected), 'HW-10 must catch a lookup without IFERROR');

  const script = path.join(root, 'teacher', 'homework_answer_key.gs');
  assert.ok(fs.existsSync(script), 'Run pnpm homework:build to generate teacher/homework_answer_key.gs');
  const embedded = JSON.parse(fs.readFileSync(script, 'utf8').match(/var TASKS = (\{[\s\S]*?\n\});/)[1]);
  assert.deepEqual(Object.fromEntries(Object.entries(embedded).map(([id, t]) => [id, t.expected])), Object.fromEntries(Object.entries(key.tasks).map(([id, t]) => [id, t.expected])), 'Answer key script out of date: run pnpm homework:build');
  return ` Teacher key: ${TASKS.length} answer formulas evaluated, $ and IFERROR mistakes detected, Apps Script in sync.`;
}

verify().catch(error => { console.error(error); process.exitCode = 1; });
