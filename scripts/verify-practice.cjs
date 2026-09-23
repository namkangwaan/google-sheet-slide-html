const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const ExcelJS = require('exceljs');
const answers = require('../src/practice-answers.json');
const tasks = require('../src/practice-tasks.json');

async function verify() {
  const root = path.resolve(__dirname, '..');
  const workbook = new ExcelJS.Workbook();
  await workbook.xlsx.readFile(path.join(root, 'public/Google_Sheets_Mastery_Practice.xlsx'));
  const hr = workbook.getWorksheet('HR_Roster');
  const sales = workbook.getWorksheet('Sales_Data');
  const regex = workbook.getWorksheet('Regex_Data');
  const assignments = workbook.getWorksheet('Assignments');
  const rows = (sheet, start, end) => Array.from({ length: end - start + 1 }, (_, i) => sheet.getRow(start + i).values.slice(1));
  const people = rows(hr, 5, 11);
  const orders = rows(sales, 5, 11);
  const sum = values => values.reduce((total, value) => total + value, 0);
  const average = values => sum(values) / values.length;
  const expected = {
    'HR-01': people.length,
    'HR-02': people.filter(row => row[2] === 'Engineering').length,
    'HR-03': people.filter(row => row[5] === false).length,
    'HR-04': sum(people.map(row => row[4])),
    'HR-05': sum(people.filter(row => row[2] === 'Marketing').map(row => row[4])),
    'HR-06': average(people.filter(row => row[2] === 'Sales').map(row => row[4])),
    'HR-07': Math.max(...people.map(row => row[4])),
    'HR-08': 'ตามวันที่จริง',
    'HR-09': people.find(row => row[0] === 'EMP-07')[5] && people.find(row => row[0] === 'EMP-07')[4] > 40000,
    'HR-10': people.find(row => row[0] === 'EMP-01')[2] === 'Engineering' ? 'Tech' : 'Business',
    'SD-01': sum(orders.map(row => row[5])),
    'SD-02': sum(orders.filter(row => row[1] === 'Bangkok').map(row => row[5])),
    'SD-03': sum(orders.filter(row => row[1] === 'Chiang Mai' && row[2] === 'Electronics').map(row => row[5])),
    'SD-04': orders.filter(row => row[3].toISOString().startsWith('2026-09-20')).length,
    'SD-05': sum(orders.filter(row => row[2] === 'Office Supplies').map(row => row[4])),
    'SD-06': average(orders.filter(row => row[1] === 'Phuket').map(row => row[5])),
    'SD-07': orders.find(row => row[0] === 'TX-1004')[2],
    'SD-08': orders.find(row => row[0] === 'TX-1006')[4],
    'SD-09': Math.max(...orders.filter(row => row[1] === 'Bangkok').map(row => row[5])),
    'SD-10': (ids => `${ids.join(' และ ')} (แสดง ${ids.length} แถว)`)(orders.filter(row => row[5] > 100000).map(row => row[0]))
  };
  // These simple RE2-compatible patterns can be independently checked with JS.
  for (const [id, [formula]] of Object.entries(answers).filter(([id]) => id.startsWith('RG-'))) {
    const match = formula.match(/^=REGEX(MATCH|EXTRACT|REPLACE)\(Regex_Data!([A-Z]+\d+), "([^"]+)"(?:, "([^"]*)")?\)$/);
    assert.ok(match, `Unrecognized regex example: ${id}`);
    const [, fn, cell, pattern, replacement] = match;
    const input = regex.getCell(cell).value;
    const expression = new RegExp(pattern, fn === 'REPLACE' ? 'g' : '');
    const found = input.match(expression);
    expected[id] = fn === 'MATCH' ? expression.test(input) : fn === 'REPLACE' ? input.replace(expression, replacement) : (found?.[1] ?? found?.[0]);
  }
  assert.equal(tasks.length, 30);
  assert.equal(Object.keys(answers).length, 30);
  for (const task of tasks) {
    assert.ok(answers[task.id], task.id);
    const row = assignments.getRow(Number(task.cell.slice(1)));
    assert.equal(row.getCell(1).value, task.id, `Answer position: ${task.id}`);
    assert.equal(row.getCell(3).value, task.task);
    assert.equal(row.getCell(4).value, task.expected);
    assert.ok(!row.getCell(5).value, `Student cell must stay empty: ${task.id}`);
    const actual = expected[task.id];
    if (typeof actual === 'number') assert.equal(Number(task.expected.replaceAll(',', '')), actual, task.id);
    else if (typeof actual === 'boolean') assert.equal(task.expected, String(actual).toUpperCase(), task.id);
    else assert.equal(task.expected, actual, task.id);
    for (const reference of answers[task.id][0].matchAll(/(HR_Roster|Sales_Data|Regex_Data)!([A-Z]+)(\d+)/g)) {
      assert.ok(Number(reference[3]) >= 5, `Reference includes header: ${task.id}`);
    }
  }
  assert.equal(hr.getCell('A8').value, 'EMP-04');
  assert.match(answers['HR-08'][0], /HR_Roster!D8/);
  assert.equal(hr.getCell('A11').value, 'EMP-07');
  assert.match(answers['HR-09'][0], /F11=TRUE.*E11>40000/);
  assert.equal(hr.getCell('A5').value, 'EMP-01');
  assert.match(answers['HR-10'][0], /C5=/);
  const script = fs.readFileSync(path.join(root, 'public/answer_key.gs'), 'utf8');
  const scriptAnswers = JSON.parse(script.match(/var answers = (\{[\s\S]*?\n\s*\});/)[1]);
  assert.deepEqual(scriptAnswers, Object.fromEntries(Object.entries(answers).map(([id, entry]) => [id, entry[0]])));
  const items = rows(workbook.getWorksheet('Classroom'), 2, 5);
  assert.deepEqual(items.map(row => row[2] * row[3]), [200, 50, 56, 90]);
  assert.equal(sum(items.map(row => row[2] * row[3])), 396);
  // SD-10 spills downward; the cell below its answer must stay free or Sheets shows #REF!.
  const sd10Row = Number(tasks.find(task => task.id === 'SD-10').cell.slice(1));
  assert.ok(!assignments.getRow(sd10Row + 1).getCell(1).value, 'SD-10 needs an empty row below for the FILTER spill');

  // Activity sheets referenced by the web lessons: expected results must match the answers shown on the site.
  const summary = workbook.getWorksheet('Summary');
  assert.ok(summary, 'Summary sheet (lesson-charts, lesson-capstone)');
  assert.deepEqual(rows(summary, 1, 3).map(row => row[0]), ['Category', 'เครื่องเขียน', 'อาหาร']);
  const byCategory = category => sum(items.filter(row => row[1] === category).map(row => row[2] * row[3]));
  assert.deepEqual([byCategory('เครื่องเขียน'), byCategory('อาหาร')], [250, 146]);

  const shop = workbook.getWorksheet('E-Commerce');
  assert.ok(shop, 'E-Commerce sheet (lesson-advanced-capstone)');
  assert.deepEqual(shop.getRow(1).values.slice(1), ['TxnID', 'CustID', 'Platform', 'Gross_Sales', 'Discount', 'Is_Returned', 'Net_Sales']);
  const net = rows(shop, 2, 4).map(row => (row[5] === false ? row[3] - row[4] : 0));
  assert.deepEqual(net, [2200, 8400, 0]);
  assert.equal(sum(net), 10600);

  const warehouse = workbook.getWorksheet('Warehouse');
  assert.ok(warehouse, 'Warehouse sheet (lesson-advanced-capstone)');
  assert.deepEqual(warehouse.getRow(1).values.slice(1), ['Bin_Location', 'Raw_Barcode', 'Unit_Stock', 'Reorder_Point', 'SKU', 'Need_Restock']);
  const stock = rows(warehouse, 2, 4);
  assert.deepEqual(stock.map(row => row[1].match(/SKU-\d+/)[0]), ['SKU-8821', 'SKU-9042', 'SKU-7730']);
  assert.deepEqual(stock.map(row => (row[2] <= row[3] ? 'REORDER NOW' : 'OK')), ['OK', 'REORDER NOW', 'REORDER NOW']);
  assert.ok(stock.some(row => row[2] === row[3]), 'Warehouse needs a stock = reorder point edge case');

  // Learner cells in activity sheets stay blank.
  for (const [sheet, columns, lastRow] of [[summary, [2], 3], [shop, [7], 4], [warehouse, [5, 6], 4]]) {
    for (let r = 2; r <= lastRow; r++) for (const c of columns) assert.ok(!sheet.getRow(r).getCell(c).value, `Learner cell must stay empty: ${sheet.name}!R${r}C${c}`);
  }

  let formulaCells = 0;
  workbook.eachSheet(sheet => sheet.eachRow(row => row.eachCell(cell => {
    assert.ok(!cell.value?.error, `${sheet.name}!${cell.address}`);
    if (cell.formula) formulaCells++;
  })));
  assert.equal(formulaCells, 0, 'Practice workbook should contain data and blank answer cells, not evaluated answers');
  console.log('PASS: 30 expected answers, actual workbook rows, blank learner cells, Classroom/Summary totals, E-Commerce and Warehouse capstone data, SD-10 spill space, Apps Script synchronization; 0 formula/error cells. Google Sheets execution still requires an integration check.');
}
verify().catch(error => { console.error(error); process.exitCode = 1; });
