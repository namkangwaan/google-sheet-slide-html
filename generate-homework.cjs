// Builds the graded homework workbook (public/Google_Sheets_Homework.xlsx).
// The workbook holds data and task prompts only: no expected results, no self-check, no formulas.
// Answers live in teacher/homework-answers.json, which is gitignored because this repo is public.
// When that file exists, this script also writes teacher/homework_answer_key.gs for grading.
const ExcelJS = require('exceljs');
const fs = require('fs');
const path = require('path');

const OUT = path.join(__dirname, 'public', 'Google_Sheets_Homework.xlsx');
const TEACHER_DIR = path.join(__dirname, 'teacher');
const TEACHER_ANSWERS = path.join(TEACHER_DIR, 'homework-answers.json');

// Row 4 = header, data from row 5, matching the practice workbook convention.
const PRODUCTS = [
  ['P-101', 'Notebook A5', 'Stationery'],
  ['P-102', 'Gel Pen', 'Stationery'],
  ['P-201', 'Drinking Water', 'Food'],
  ['P-202', 'Snack Box', 'Food'],
  ['P-301', 'USB Drive', 'Electronics'],
  ['P-302', 'Earphones', 'Electronics'],
];

// P-999 is deliberately missing from Products (IFERROR task). Customer names keep stray spaces (TRIM task).
const ORDERS = [
  ['O01', '2026-10-01', 'Bangkok', 'P-101', 12, 45, '  somchai jaidee'],
  ['O02', '2026-10-01', 'Chiang Mai', 'P-301', 2, 250, 'Wichai RAKTHAI '],
  ['O03', '2026-10-02', 'Bangkok', 'P-202', 20, 35, 'nonglak dee'],
  ['O04', '2026-10-02', 'Khon Kaen', 'P-102', 50, 15, ' Somsri Mungman'],
  ['O05', '2026-10-03', 'Chiang Mai', 'P-201', 40, 10, 'mana rakdham'],
  ['O06', '2026-10-03', 'Bangkok', 'P-302', 3, 390, 'PITI YINDEE'],
  ['O07', '2026-10-04', 'Khon Kaen', 'P-301', 1, 250, 'manee dumrong  '],
  ['O08', '2026-10-04', 'Bangkok', 'P-101', 8, 45, 'Chujai Deejai'],
  ['O09', '2026-10-05', 'Chiang Mai', 'P-102', 30, 15, '  arthit  sawang'],
  ['O10', '2026-10-05', 'Khon Kaen', 'P-202', 15, 35, 'Kanya Ruamjai'],
  ['O11', '2026-10-06', 'Bangkok', 'P-201', 60, 10, 'somchai jaidee'],
  ['O12', '2026-10-06', 'Chiang Mai', 'P-302', 2, 390, 'Wichai Rakthai'],
  ['O13', '2026-10-07', 'Khon Kaen', 'P-999', 5, 20, 'Nattaya Suksai'],
  ['O14', '2026-10-07', 'Bangkok', 'P-301', 4, 250, 'Piti Yindee'],
  ['O15', '2026-10-08', 'Chiang Mai', 'P-101', 10, 45, 'Kanya Ruamjai'],
  ['O16', '2026-10-08', 'Khon Kaen', 'P-102', 25, 15, 'Mana Rakdham'],
];

// Learner-filled columns in Orders: H relative refs, I absolute ref to Settings!$B$2, J lookup + IFERROR.
const ORDER_COLUMNS = ['OrderID', 'Order_Date', 'Branch', 'Product_Code', 'Qty', 'Unit_Price', 'Customer', 'Amount', 'Amount_With_VAT', 'Category'];
const LEARNER_ORDER_COLUMNS = [8, 9, 10];

// Prompts only. Each task is worth POINTS; HW-20 is last so its FILTER spill has empty rows below.
const POINTS = 5;
const TASKS = [
  ['HW-01', 'Orders', 'นับจำนวนคำสั่งซื้อของสาขา "Bangkok" (ใช้ COUNTIF)'],
  ['HW-02', 'Orders', 'นับคำสั่งซื้อของสาขา "Chiang Mai" ที่ Qty ตั้งแต่ 10 ชิ้นขึ้นไป (ใช้ COUNTIFS)'],
  ['HW-03', 'Orders', 'หายอด Amount รวมของสาขา "Khon Kaen" จากคอลัมน์ H ที่เติมไว้ (ใช้ SUMIF)'],
  ['HW-04', 'Orders', 'หายอด Amount รวมของหมวด "Electronics" เฉพาะสาขา "Bangkok" ใช้คอลัมน์ J (ใช้ SUMIFS)'],
  ['HW-05', 'Orders', 'หาค่าเฉลี่ย Amount ต่อคำสั่งซื้อของสาขา "Chiang Mai" (ใช้ AVERAGEIF)'],
  ['HW-06', 'Orders', 'หา Amount สูงสุดของสาขา "Khon Kaen" (ใช้ MAXIFS)'],
  ['HW-07', 'Products', 'หาชื่อสินค้า (Product_Name) ของรหัส "P-202" (ใช้ INDEX ร่วมกับ MATCH)'],
  ['HW-08', 'Orders', 'หาจำนวนชิ้น (Qty) ของคำสั่งซื้อ "O12" (ใช้ VLOOKUP หรือ XLOOKUP)'],
  ['HW-09', 'Orders + Products', 'หาชื่อสินค้าของคำสั่งซื้อ "O13" ถ้าไม่พบรหัสใน Products ให้แสดง "ไม่พบสินค้า" (ใช้ IFERROR)'],
  ['HW-10', 'Orders', 'นับจำนวนคำสั่งซื้อที่คอลัมน์ Category (J) เป็น "ไม่พบสินค้า" (ใช้ COUNTIF)'],
  ['HW-11', 'Orders', 'ทำชื่อลูกค้าของคำสั่งซื้อ "O09" ให้ไม่มีช่องว่างเกิน (ใช้ TRIM)'],
  ['HW-12', 'Orders', 'สร้างรหัสอ้างอิงรูปแบบ Branch-OrderID ของคำสั่งซื้อ "O06" (รูปแบบเดียวกับ Chiang Mai-O02 ของคำสั่งซื้อ O02) (ใช้ &)'],
  ['HW-13', 'Orders', 'ดึงเลข 3 ตัวท้ายของ Product_Code ของคำสั่งซื้อ "O04" (ใช้ RIGHT)'],
  ['HW-14', 'Orders', 'นับจำนวนคำสั่งซื้อในวันที่ 5 ตุลาคม 2026 (ใช้ COUNTIF ร่วมกับ DATE)'],
  ['HW-15', 'Orders', 'คำสั่งซื้อแรกกับคำสั่งซื้อล่าสุดห่างกันกี่วัน (ใช้ MAX และ MIN หรือ DATEDIF)'],
  ['HW-16', 'Orders', 'คำสั่งซื้อ "O14": ถ้า Amount ตั้งแต่ 1,000 ขึ้นไปให้แสดง "ใหญ่" นอกนั้น "ปกติ" (ใช้ IF)'],
  ['HW-17', 'Orders', 'คำสั่งซื้อ "O06" อยู่สาขา "Bangkok" และมี Qty ตั้งแต่ 3 ชิ้นขึ้นไปหรือไม่ (ใช้ AND)'],
  ['HW-18', 'Orders', 'หายอดรวม Amount_With_VAT ของทุกคำสั่งซื้อ จากคอลัมน์ I ที่เติมไว้ (ใช้ SUM)'],
  ['HW-19', 'Orders', 'Amount_With_VAT ของคำสั่งซื้อ "O16" เท่าไร (อ่านจากคอลัมน์ I ที่ลากสูตรลงมาถึงแถวสุดท้าย)'],
  ['HW-20', 'Orders', 'ดึง OrderID ทั้งหมดของสาขา "Khon Kaen" ที่ Qty ตั้งแต่ 15 ชิ้นขึ้นไป (ใช้ FILTER และเว้นช่องด้านล่างให้ว่าง)'],
];

const FONT = 'TH Sarabun New';
const BORDER = Object.fromEntries(['top', 'left', 'bottom', 'right'].map(side => [side, { style: 'thin', color: { argb: 'FFCBD5E1' } }]));
const GREEN = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFF0FDF4' } };

// Title + description block in rows 1-2, header in row 4, body from row 5.
function styleTable(sheet, columnCount, description, learnerColumns = []) {
  sheet.spliceRows(1, 0, ['📝 การบ้าน (Homework):'], [description], []);
  const last = String.fromCharCode(64 + columnCount);
  sheet.mergeCells(`A1:${last}1`);
  sheet.mergeCells(`A2:${last}2`);
  Object.assign(sheet.getCell('A1'), { font: { name: FONT, size: 18, bold: true, color: { argb: 'FF1D4ED8' } }, fill: { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFEFF6FF' } } });
  Object.assign(sheet.getCell('A2'), { font: { name: FONT, size: 16, color: { argb: 'FF334155' } }, alignment: { vertical: 'middle', wrapText: true } });
  sheet.getRow(2).height = 35;
  sheet.getRow(3).height = 10;
  sheet.getRow(4).eachCell({ includeEmpty: true }, (cell, col) => {
    if (col > columnCount) return;
    cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF0F172A' } };
    cell.font = { name: FONT, size: 16, bold: true, color: { argb: 'FFFFFFFF' } };
    cell.alignment = { vertical: 'middle', horizontal: 'center' };
    cell.border = BORDER;
  });
  sheet.eachRow((row, r) => {
    if (r <= 4) return;
    row.eachCell({ includeEmpty: true }, (cell, col) => {
      if (col > columnCount) return;
      cell.font = { name: FONT, size: 16 };
      cell.border = BORDER;
      if (learnerColumns.includes(col)) cell.fill = GREEN;
    });
  });
  sheet.views = [{ state: 'frozen', ySplit: 4 }];
}

async function build() {
  const wb = new ExcelJS.Workbook();
  wb.creator = 'Google Sheets Mastery Course';

  const start = wb.addWorksheet('Start_Here');
  start.columns = [{ width: 22 }, { width: 100 }];
  start.addRows([
    ['การบ้าน', 'ข้อมูลทั้งหมดเป็นข้อมูลสมมติ ใช้ชุดข้อมูลต่างจากไฟล์แบบฝึก จึงคัดลอกคำตอบจากแบบฝึกหรือหน้าเฉลยในเว็บไม่ได้'],
    ['เปิดไฟล์', 'อัปโหลดเข้า Drive > เปิดด้วย Google Sheets > File > Save as Google Sheets; ตั้งชื่อ Homework_ชื่อเล่น_ห้อง'],
    ['ตั้งค่า', 'File > Settings: Locale = Thailand, Time zone = Bangkok'],
    ['ขั้นที่ 1', 'ชีต Orders: เติมคอลัมน์สีเขียว H (Amount = Qty × Unit_Price), I (Amount_With_VAT ใช้ VAT_Rate ใน Settings!B2 ด้วยการอ้างอิงแบบ $) และ J (Category จากชีต Products ถ้าไม่พบให้แสดง "ไม่พบสินค้า") แล้วลากสูตรถึงแถว 20'],
    ['ขั้นที่ 2', 'ชีต Homework_Tasks: พิมพ์สูตรในช่องสีเขียวคอลัมน์ E ตาม Task_ID ทุกข้อต้องเป็นสูตร ไม่พิมพ์ตัวเลขคำตอบเอง'],
    ['คะแนน', `${TASKS.length} ข้อ ข้อละ ${POINTS} คะแนน รวม ${TASKS.length * POINTS} คะแนน ครูตรวจจากผลลัพธ์และสูตรที่ใช้`],
    ['ส่งงาน', 'แชร์ลิงก์สิทธิ์ผู้ดูให้ครูตามช่องทางที่ครูกำหนด อย่าแก้ข้อมูลต้นฉบับในคอลัมน์ A ถึง G'],
  ]);
  start.eachRow(row => {
    row.height = 40;
    row.eachCell(cell => { cell.font = { name: FONT, size: 16 }; cell.alignment = { vertical: 'middle', wrapText: true }; });
  });

  const settings = wb.addWorksheet('Settings');
  settings.columns = [{ header: 'Setting', width: 18 }, { header: 'Value', width: 14 }];
  settings.addRow(['VAT_Rate', 0.07]);
  settings.getCell('B2').numFmt = '0%';
  settings.eachRow((row, r) => row.eachCell(cell => { cell.font = { name: FONT, size: 16, bold: r === 1 }; cell.border = BORDER; }));

  const orders = wb.addWorksheet('Orders');
  orders.columns = ORDER_COLUMNS.map((header, i) => ({ header, width: [10, 14, 14, 14, 8, 12, 22, 14, 18, 16][i] }));
  orders.addRows(ORDERS.map(([id, date, ...rest]) => [id, new Date(date), ...rest, null, null, null]));
  orders.getColumn(2).numFmt = 'yyyy-mm-dd';
  orders.getColumn(6).numFmt = '#,##0';
  styleTable(orders, ORDER_COLUMNS.length, 'ข้อมูลคำสั่งซื้อ 16 รายการ เติมคอลัมน์สีเขียว H, I, J ให้ครบก่อนทำโจทย์ (ฝึกการอ้างอิงแบบสัมพัทธ์ แบบ $ และการค้นหาที่รองรับกรณีหาไม่พบ)', LEARNER_ORDER_COLUMNS);

  const products = wb.addWorksheet('Products');
  products.columns = [{ header: 'Product_Code', width: 16 }, { header: 'Product_Name', width: 20 }, { header: 'Category', width: 16 }];
  products.addRows(PRODUCTS);
  styleTable(products, 3, 'ตารางสินค้าสำหรับค้นหาชื่อและหมวดสินค้าจากรหัส');

  const tasks = wb.addWorksheet('Homework_Tasks');
  tasks.columns = [{ header: 'Task_ID', width: 10 }, { header: 'Worksheet_Ref', width: 18 }, { header: 'Task', width: 80 }, { header: 'Points', width: 10 }, { header: 'Your_Formula', width: 40 }];
  tasks.addRows(TASKS.map(([id, ref, task]) => [id, ref, task, POINTS, null]));
  styleTable(tasks, 5, `การบ้าน ${TASKS.length} ข้อ พิมพ์สูตรในคอลัมน์ Your_Formula สีเขียว ไฟล์นี้ไม่มีเฉลยและไม่มีตัวตรวจอัตโนมัติ`, [5]);

  await wb.xlsx.writeFile(OUT);
  console.log(`Homework workbook written: ${OUT}`);

  if (fs.existsSync(TEACHER_ANSWERS)) {
    const key = require(TEACHER_ANSWERS);
    const out = path.join(TEACHER_DIR, 'homework_answer_key.gs');
    fs.writeFileSync(out, buildAnswerKeyScript(key));
    console.log(`Teacher answer key written: ${out}`);
  } else {
    console.log('teacher/homework-answers.json not found: skipped the teacher answer key (expected in CI).');
  }
}

// Apps Script for the teacher's copy of a submitted file: grades column E, writes F + score, lists the key.
function buildAnswerKeyScript(key) {
  const tasks = Object.fromEntries(Object.entries(key.tasks).map(([id, t]) => [id, { expected: t.expected, formula: t.formula, explanation: t.explanation }]));
  return `/**
 * Google Sheets Homework - Teacher answer key (DO NOT share with students)
 * Generated by generate-homework.cjs from teacher/homework-answers.json.
 * Install on a COPY of a student's submission: Extensions > Apps Script > paste > Save > reload.
 * Menu "[ ✅ ตรวจการบ้าน ]":
 *   - ตรวจและให้คะแนน: writes ✓/✗/⚠ to Homework_Tasks!F and the score to F3
 *   - แสดงเฉลย: writes formulas and expected results to a new sheet Answer_Key
 */
var TASKS = ${JSON.stringify(tasks, null, 2)};
var COLUMN_FORMULAS = ${JSON.stringify(key.columns, null, 2)};
var POINTS = ${POINTS};

function onOpen() {
  SpreadsheetApp.getUi().createMenu('[ ✅ ตรวจการบ้าน ]')
    .addItem('ตรวจและให้คะแนน', 'gradeHomework')
    .addItem('แสดงเฉลย (ชีต Answer_Key)', 'showAnswerKey')
    .addToUi();
}

function sameValue_(actual, expected) {
  if (typeof expected === 'number') return typeof actual === 'number' && Math.round(actual * 100) === Math.round(expected * 100);
  if (typeof expected === 'boolean') return actual === expected;
  return String(actual) === String(expected);
}

function gradeHomework() {
  var sheet = SpreadsheetApp.getActive().getSheetByName('Homework_Tasks');
  var last = sheet.getLastRow();
  var score = 0, total = 0;
  sheet.getRange('F4').setValue('Teacher_Check');
  for (var row = 5; row <= last; row++) {
    var id = sheet.getRange(row, 1).getValue();
    var task = TASKS[id];
    if (!task) continue;
    total += POINTS;
    var cell = sheet.getRange(row, 5);
    var status;
    if (cell.isBlank()) status = '✗ ไม่ได้ตอบ';
    else if (!cell.getFormula()) status = '⚠ พิมพ์ค่าแทนสูตร';
    else if (Array.isArray(task.expected)) {
      var got = sheet.getRange(row, 5, task.expected.length, 1).getValues().map(function (r) { return r[0]; });
      var joined = String(cell.getValue()) === task.expected.join(', ');
      status = (joined || task.expected.every(function (v, i) { return sameValue_(got[i], v); })) ? '✓' : '✗';
    } else status = sameValue_(cell.getValue(), task.expected) ? '✓' : '✗';
    if (status === '✓') score += POINTS;
    sheet.getRange(row, 6).setValue(status);
  }
  sheet.getRange('F3').setValue(score + ' / ' + total);
  SpreadsheetApp.getUi().alert('คะแนน ' + score + ' / ' + total + '\\nตรวจสูตรในคอลัมน์ E เพิ่มเติมว่าใช้ฟังก์ชันตามที่โจทย์กำหนด');
}

function showAnswerKey() {
  var ss = SpreadsheetApp.getActive();
  var sheet = ss.getSheetByName('Answer_Key') || ss.insertSheet('Answer_Key');
  sheet.clear();
  var rows = [['Task_ID', 'Answer formula', 'Expected', 'Explanation']];
  Object.keys(COLUMN_FORMULAS).forEach(function (col) {
    rows.push(['Orders!' + col + '5', "'" + COLUMN_FORMULAS[col], 'ลากถึงแถว 20', '']);
  });
  Object.keys(TASKS).forEach(function (id) {
    var t = TASKS[id];
    rows.push([id, "'" + t.formula, Array.isArray(t.expected) ? t.expected.join(', ') : String(t.expected), t.explanation]);
  });
  sheet.getRange(1, 1, rows.length, 4).setValues(rows);
  sheet.setFrozenRows(1);
  sheet.autoResizeColumns(1, 4);
}
`;
}

// Build only when run directly; verify-homework.cjs requires this file for the data.
if (require.main === module) {
  build().catch(error => {
    console.error('Error creating homework workbook:', error);
    process.exitCode = 1;
  });
}

module.exports = { PRODUCTS, ORDERS, ORDER_COLUMNS, LEARNER_ORDER_COLUMNS, TASKS, POINTS };
