const ExcelJS = require('exceljs');
const fs = require('fs');
const path = require('path');
const answers = require('./src/practice-answers.json');
const { SELF_CHECK, buildSelfCheck, parseExpected } = require('./scripts/self-check.cjs');

// '' would be written as an empty *string* cell, which is not blank: it blocks FILTER spill
// (#SPILL!/#REF!) and counts as non-empty. Learner and separator cells must be truly empty.
const blankCells = rows => rows.map(row => row.map(value => (value === '' ? null : value)));

async function createPracticeWorkbook() {
  const workbook = new ExcelJS.Workbook();
  workbook.creator = 'Google Sheets Mastery Course';
  workbook.created = new Date();
  
  // Theme Constants
  const fontName = 'TH Sarabun New';
  const headerFont = { name: fontName, size: 18, bold: true, color: { argb: 'FFFFFFFF' } };
  const bodyFont = { name: fontName, size: 16 };
  const descTitleFont = { name: fontName, size: 18, bold: true, color: { argb: 'FF059669' } };
  const descFont = { name: fontName, size: 16, color: { argb: 'FF334155' } };
  
  const headerFill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF0F172A' } };
  const borderStyle = {
    top: { style: 'thin', color: { argb: 'FFCBD5E1' } },
    left: { style: 'thin', color: { argb: 'FFCBD5E1' } },
    bottom: { style: 'thin', color: { argb: 'FFCBD5E1' } },
    right: { style: 'thin', color: { argb: 'FFCBD5E1' } }
  };
  const alignCenter = { vertical: 'middle', horizontal: 'center' };
  const alignLeft = { vertical: 'middle', horizontal: 'left' };
  const alignRight = { vertical: 'middle', horizontal: 'right' };

  const readme = workbook.addWorksheet('Start_Here');
  readme.columns = [{ width: 24 }, { width: 100 }];
  readme.addRows([
    ['เริ่มเรียน', 'ข้อมูลทั้งหมดเป็นข้อมูลสมมติสำหรับฝึก ไม่ใช่ข้อมูลบุคคลหรือยอดขายจริง'],
    ['เปิดไฟล์', 'อัปโหลดไฟล์เข้า Drive > เปิดด้วย Google Sheets > File > Save as Google Sheets'],
    ['ตั้งชื่อ', 'ตั้งชื่อสำเนา Sheets_ชื่อเล่น_ห้อง แล้วทำในไฟล์ของตนเอง'],
    ['ตั้งค่า', 'File > Settings: Locale = Thailand, Time zone = Bangkok; ตัวอย่างใช้ชื่อฟังก์ชันอังกฤษ'],
    ['ตำแหน่งข้อมูล', 'HR_Roster / Sales_Data / Regex_Data: หัวตารางแถว 4 ข้อมูลเริ่มแถว 5; Classroom / Summary / E-Commerce / Warehouse: หัวตารางแถว 1 ข้อมูลเริ่มแถว 2'],
    ['ช่องให้กรอก', 'Assignments: พิมพ์สูตรในช่องสีเขียวคอลัมน์ E ตาม Task_ID; อย่าแก้ข้อมูลต้นฉบับ'],
    ['ตัวอย่างวิธีกรอก', 'ข้อ HR-01: คลิก Assignments!E5 พิมพ์สูตร COUNTA อ้างอิงรหัสใน HR_Roster แล้วกด Enter'],
    ['ตรวจคำตอบ', 'คอลัมน์ F (Self_Check) ขึ้น ✓ เมื่อผลถูก ✗ เมื่อยังไม่ตรง และ ⚠ ถ้าพิมพ์ค่าแทนสูตร คะแนนรวมอยู่ที่ F3; เฉลยพร้อมเหตุผลอยู่หน้าเฉลยในเว็บ'],
    ['Classroom', 'ข้อมูลร้านค้าห้องเรียน: เติมสูตร Amount ใน E2:E5 และฝึก SUMIF ที่ G2 (กิจกรรมพื้นฐาน)'],
    ['Summary', 'ตารางสรุปยอดแยกหมวดสำหรับทำกราฟและชิ้นงานพื้นฐาน: เติมสูตรในช่องสีเขียว B2:B3'],
    ['ชิ้นงานต่อยอด', 'E-Commerce: เติม Net_Sales ใน G2:G4 แล้วสรุปด้วย QUERY; Warehouse: เติม SKU ใน E2:E4 และ Need_Restock ใน F2:F4'],
    ['วันที่', 'HR-08 ใช้ TODAY คำตอบจึงเปลี่ยนตามวันที่; ไม่ใช้คำตอบคงที่ในการตัดสิน'],
    ['Regex', 'ผลการสกัดมักเป็นข้อความ; RG-08 คืนข้อความเต็มที่ปิด 4 หลักท้าย'],
    ['FILTER', 'SD-10 คืนผลหลายแถว (spill) ลงช่องด้านล่าง; เว้นช่องว่างใต้คำตอบไว้ ไม่เช่นนั้นจะเกิด #REF!'],
    ['ส่งงาน', 'ส่งไฟล์หรือลิงก์สิทธิ์ผู้ดูให้ครูผ่านช่องทางที่ครูกำหนด ไม่เผยแพร่ข้อมูลส่วนตัวสู่สาธารณะ']
  ]);
  readme.eachRow(row => {
    row.height = 42;
    row.eachCell(cell => {
      cell.font = { name: fontName, size: 16 };
      cell.alignment = { vertical: 'middle', wrapText: true };
    });
  });
  const classroom = workbook.addWorksheet('Classroom');
  classroom.columns = [{ header: 'Item', width: 22 }, { header: 'Category', width: 20 }, { header: 'Qty', width: 12 }, { header: 'Unit_Price', width: 16 }, { header: 'Amount', width: 18 }];
  classroom.addRows(blankCells([
    ['สมุด', 'เครื่องเขียน', 10, 20, ''],
    ['ดินสอ', 'เครื่องเขียน', 5, 10, ''],
    ['น้ำ', 'อาหาร', 8, 7, ''],
    ['ขนม', 'อาหาร', 6, 15, '']
  ]));
  classroom.eachRow((row, index) => {
    row.height = 28;
    row.eachCell({ includeEmpty: true }, cell => {
      cell.font = { name: fontName, size: 16, bold: index === 1 };
      cell.border = borderStyle;
    });
    if (index > 1) row.getCell(5).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFF0FDF4' } };
  });
  classroom.views = [{ state: 'frozen', ySplit: 1 }];

  // Simple header-in-row-1 sheets for activities; learner cells are blank and highlighted green.
  function addActivitySheet(name, columns, rows, learnerColumns) {
    const sheet = workbook.addWorksheet(name);
    sheet.columns = columns.map(([header, width]) => ({ header, width }));
    sheet.addRows(blankCells(rows));
    sheet.eachRow((row, index) => {
      row.height = 28;
      row.eachCell({ includeEmpty: true }, (cell, colNumber) => {
        if (colNumber > columns.length) return;
        cell.font = { name: fontName, size: 16, bold: index === 1 };
        cell.border = borderStyle;
        if (index > 1 && learnerColumns.includes(colNumber)) {
          cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFF0FDF4' } };
        }
      });
    });
    sheet.views = [{ state: 'frozen', ySplit: 1 }];
    return sheet;
  }

  // Used by lesson-charts and the basic capstone (lesson-capstone).
  addActivitySheet('Summary', [['Category', 20], ['Amount', 18]], [
    ['เครื่องเขียน', ''],
    ['อาหาร', '']
  ], [2]);

  function styleSheet(worksheet, numColumns, description) {
    worksheet.spliceRows(1, 0, 
      ['💡 แนวทางการเรียนรู้ (Ideas & Description):'],
      [description],
      []
    );

    const lastColLetter = String.fromCharCode(64 + numColumns);
    worksheet.mergeCells(`A1:${lastColLetter}1`);
    worksheet.mergeCells(`A2:${lastColLetter}2`);
    
    const titleCell = worksheet.getCell('A1');
    titleCell.font = descTitleFont;
    titleCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFECFDF5' } };
    titleCell.alignment = { vertical: 'middle', horizontal: 'left' };
    
    const descCell = worksheet.getCell('A2');
    descCell.font = descFont;
    descCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFF8FAFC' } };
    descCell.alignment = { vertical: 'middle', horizontal: 'left', wrapText: true };
    
    worksheet.getRow(1).height = 25;
    worksheet.getRow(2).height = 35;
    worksheet.getRow(3).height = 10;
    
    const headerRow = worksheet.getRow(4);
    headerRow.height = 25;
    headerRow.eachCell({ includeEmpty: true }, (cell, colNumber) => {
      if(colNumber <= numColumns) {
        cell.fill = headerFill;
        cell.font = headerFont;
        cell.border = borderStyle;
        cell.alignment = alignCenter;
      }
    });

    worksheet.eachRow((row, rowNumber) => {
      if (rowNumber <= 4) return;
      row.height = 22;
      row.eachCell({ includeEmpty: true }, (cell, colNumber) => {
        if(colNumber <= numColumns) {
          cell.font = bodyFont;
          cell.border = borderStyle;
          if (!cell.alignment) {
            cell.alignment = (typeof cell.value === 'number') ? alignRight : alignLeft;
          }
        }
      });
    });
  }

  // ==========================================
  // SHEET 1: HR_Roster
  // ==========================================
  const wsHR = workbook.addWorksheet('HR_Roster');
  wsHR.columns = [
    { header: 'EmpID', key: 'empid', width: 12 },
    { header: 'Full_Name', key: 'name', width: 25 },
    { header: 'Department', key: 'dept', width: 20 },
    { header: 'Hire_Date', key: 'hire', width: 15 },
    { header: 'Salary', key: 'salary', width: 18 },
    { header: 'Is_Permanent', key: 'is_perm', width: 15 }
  ];
  wsHR.addRows([
    ['EMP-01', 'Somchai Jaidee', 'Marketing', new Date('2022-01-15'), 45000, true],
    ['EMP-02', 'Wichai Rakthai', 'Sales', new Date('2024-06-01'), 38000, true],
    ['EMP-03', 'Nonglak Dee', 'Engineering', new Date('2025-11-20'), 55000, false],
    ['EMP-04', 'Somsri Mungman', 'Sales', new Date('2021-03-10'), 62000, true],
    ['EMP-05', 'Mana Rakdham', 'HR', new Date('2026-02-01'), 32000, false],
    ['EMP-06', 'Piti Yindee', 'Engineering', new Date('2020-08-15'), 85000, true],
    ['EMP-07', 'Manee Dumrong', 'Marketing', new Date('2023-09-01'), 41000, true]
  ]);
  
  wsHR.getColumn(5).numFmt = '#,##0.00';
  wsHR.getColumn(4).numFmt = 'yyyy-mm-dd';
  
  const descHR = 'ชุดข้อมูลจำลองฝ่ายบุคคล ใช้สำหรับสอนการจัดรูปแบบข้อมูล (Data Types), การใช้เงื่อนไขตรรกศาสตร์ (IF, AND, OR) และฟังก์ชันคำนวณอายุงานจากวันที่ (DATEDIF, TODAY)';
  styleSheet(wsHR, 6, descHR);

  // ==========================================
  // SHEET 2: Sales_Data
  // ==========================================
  const wsSales = workbook.addWorksheet('Sales_Data');
  wsSales.columns = [
    { header: 'TransactionID', key: 'tx', width: 15 },
    { header: 'Customer Region', key: 'region', width: 20 },
    { header: 'Product Category', key: 'category', width: 20 },
    { header: 'Transaction Date', key: 'date', width: 18 },
    { header: 'Units Sold', key: 'units', width: 15 },
    { header: 'Total Revenue', key: 'revenue', width: 20 }
  ];
  wsSales.addRows([
    ['TX-1001', 'Bangkok', 'Electronics', new Date('2026-09-20'), 5, 125000],
    ['TX-1002', 'Chiang Mai', 'Office Supplies', new Date('2026-09-20'), 50, 25000],
    ['TX-1003', 'Phuket', 'Electronics', new Date('2026-09-21'), 2, 45000],
    ['TX-1004', 'Bangkok', 'Office Supplies', new Date('2026-09-21'), 100, 48000],
    ['TX-1005', 'Chiang Mai', 'Electronics', new Date('2026-09-22'), 12, 310000],
    ['TX-1006', 'Bangkok', 'Electronics', new Date('2026-09-22'), 1, 25000],
    ['TX-1007', 'Phuket', 'Office Supplies', new Date('2026-09-23'), 30, 15000]
  ]);

  wsSales.getColumn(6).numFmt = '"฿"#,##0.00';
  wsSales.getColumn(5).numFmt = '#,##0';
  wsSales.getColumn(4).numFmt = 'yyyy-mm-dd';
  
  const descSales = 'ชุดข้อมูลประวัติการขาย ใช้สำหรับสอนการแยกแยะระหว่าง Dimension & Metric, การเขียนสูตรค้นหาข้อมูล (VLOOKUP/XLOOKUP) และการหาผลรวมยอดขายแบบมีเงื่อนไข (SUMIFS)';
  styleSheet(wsSales, 6, descSales);

  // ==========================================
  // SHEET 3: Regex_Data
  // ==========================================
  const wsRegex = workbook.addWorksheet('Regex_Data');
  wsRegex.columns = [
    { header: 'ID', key: 'id', width: 10 },
    { header: 'Raw_Contact_Info', key: 'contact', width: 45 },
    { header: 'Dirty_Amount', key: 'amount', width: 20 },
    { header: 'Invoice_Code', key: 'inv', width: 20 }
  ];
  wsRegex.addRows([
    ['R-001', 'John Doe - john@gmail.com / 0891234567', 'THB 15,000', 'INV-2024-X99'],
    ['R-002', 'Jane Smith - jane.smith@yahoo.com / 0819876543', 'Cost: 450', 'TH2024-A12'],
    ['R-003', 'Bob Bob - bobbob@hotmail.com / 0861112222', '2,300 Baht', 'RE-89'],
    ['R-004', 'Alice - alice@company.co.th / 0859998888', 'THB 9,990', 'INV-2025-Z01'],
    ['R-005', 'Charlie - charlie@gmail.com / 0823334444', 'Price: 1200', 'TH2025-B44']
  ]);
  const descRegex = 'ชุดข้อมูลสำหรับฝึกฝน Regular Expression (Regex) โดยเฉพาะ ใช้ฝึกเขียนสูตร REGEXMATCH, REGEXEXTRACT และ REGEXREPLACE เพื่อจัดการกับข้อมูลที่ซับซ้อน';
  styleSheet(wsRegex, 4, descRegex);

  // ==========================================
  // SHEET 4: Assignments
  // ==========================================
  const wsTasks = workbook.addWorksheet('Assignments');
  wsTasks.columns = [
    { header: 'Task_ID', key: 'id', width: 10 },
    { header: 'Worksheet_Ref', key: 'ref', width: 15 },
    { header: 'Assignment_Task', key: 'task', width: 75 },
    { header: 'Expected_Result', key: 'expected', width: 20 },
    { header: 'Your_Formula', key: 'formula', width: 45 },
    { header: 'Self_Check', key: 'check', width: 20 }
  ];
  
  wsTasks.addRows(blankCells([
    // HR_Roster Tasks (10 Items)
    ['HR-01', 'HR_Roster', 'นับจำนวนพนักงานทั้งหมดในชีต HR_Roster (ใช้ COUNTA)', '7', ''],
    ['HR-02', 'HR_Roster', 'นับจำนวนพนักงานที่อยู่ในแผนก "Engineering" (ใช้ COUNTIF)', '2', ''],
    ['HR-03', 'HR_Roster', 'นับจำนวนพนักงานที่ไม่ได้เป็นพนักงานประจำ Is_Permanent = FALSE (ใช้ COUNTIF)', '2', ''],
    ['HR-04', 'HR_Roster', 'หาผลรวมเงินเดือนของพนักงานทั้งหมด (ใช้ SUM)', '358,000.00', ''],
    ['HR-05', 'HR_Roster', 'หาผลรวมเงินเดือนของพนักงานแผนก "Marketing" (ใช้ SUMIF)', '86,000.00', ''],
    ['HR-06', 'HR_Roster', 'หาเงินเดือนเฉลี่ยของพนักงานแผนก "Sales" (ใช้ AVERAGEIF)', '50,000.00', ''],
    ['HR-07', 'HR_Roster', 'พนักงานที่เงินเดือนสูงที่สุดคือเท่าไร (ใช้ MAX)', '85,000.00', ''],
    ['HR-08', 'HR_Roster', 'คำนวณอายุงาน (ปี) ของ "EMP-04" อิงจาก Hire_Date ถึงวันนี้ (ใช้ DATEDIF)', 'ตามวันที่จริง', ''],
    ['HR-09', 'HR_Roster', 'ตรวจสอบว่า "EMP-07" เป็นพนักงานประจำ และเงินเดือน > 40,000 หรือไม่ (ใช้ AND)', 'TRUE', ''],
    ['HR-10', 'HR_Roster', 'ถ้า "EMP-01" อยู่แผนก Engineering ให้แสดงคำว่า "Tech" นอกนั้น "Business" (ใช้ IF)', 'Business', ''],
    
    // Empty row separator
    ['', '', '', '', ''],
    
    // Sales_Data Tasks (10 Items)
    ['SD-01', 'Sales_Data', 'หายอดขายรวมทั้งหมดของทุกรายการ (ใช้ SUM)', '593,000.00', ''],
    ['SD-02', 'Sales_Data', 'หายอดขายรวม (Total Revenue) เฉพาะสาขา "Bangkok" (ใช้ SUMIF)', '198,000.00', ''],
    ['SD-03', 'Sales_Data', 'หายอดขายรวมของสินค้าหมวด "Electronics" ที่ขายใน "Chiang Mai" (ใช้ SUMIFS)', '310,000.00', ''],
    ['SD-04', 'Sales_Data', 'นับจำนวนธุรกรรม (Transaction) ที่เกิดขึ้นในวันที่ "2026-09-20" (ใช้ COUNTIF)', '2', ''],
    ['SD-05', 'Sales_Data', 'สินค้าหมวด "Office Supplies" ขายได้ทั้งหมดกี่ชิ้น (Units Sold) (ใช้ SUMIF)', '180', ''],
    ['SD-06', 'Sales_Data', 'หาค่าเฉลี่ยของยอดขาย (Average Revenue) ต่อธุรกรรมในสาขา "Phuket" (ใช้ AVERAGEIF)', '30,000.00', ''],
    ['SD-07', 'Sales_Data', 'ใช้รหัส "TX-1004" ค้นหาว่าลูกค้ารายนี้ซื้อสินค้าหมวดหมู่ใด (ใช้ VLOOKUP หรือ XLOOKUP)', 'Office Supplies', ''],
    ['SD-08', 'Sales_Data', 'ใช้รหัส "TX-1006" ค้นหาว่าขายได้กี่ชิ้น (Units Sold) (ใช้ VLOOKUP หรือ XLOOKUP)', '1', ''],
    ['SD-09', 'Sales_Data', 'หายอดขายที่สูงที่สุดที่เกิดขึ้นในสาขา "Bangkok" (ใช้ MAXIFS)', '125,000.00', ''],
    ['SD-10', 'Sales_Data', 'ดึงข้อมูล TransactionID ทั้งหมดของรายการที่มียอดขาย > 100,000 บาท (ใช้ FILTER)', 'TX-1001 และ TX-1005 (แสดง 2 แถว)', ''],
    
    // Empty row separator
    ['', '', '', '', ''],
    
    // Regex Tasks (10 Items)
    ['RG-01', 'Regex_Data', 'ตรวจสอบว่า Raw_Contact_Info ของ "R-001" มีโดเมน "@gmail.com" หรือไม่ (ใช้ REGEXMATCH)', 'TRUE', ''],
    ['RG-02', 'Regex_Data', 'ตรวจสอบว่า Invoice_Code ของ "R-001" ขึ้นต้นด้วยคำว่า "INV" หรือไม่ (ใช้ REGEXMATCH กับ ^)', 'TRUE', ''],
    ['RG-03', 'Regex_Data', 'ตรวจสอบว่า Dirty_Amount ของ "R-001" มีคำว่า "THB" อยู่หรือไม่ (ใช้ REGEXMATCH)', 'TRUE', ''],
    ['RG-04', 'Regex_Data', 'สกัดเอาเฉพาะโดเมนอีเมล (หลังเครื่องหมาย @) จาก Raw_Contact_Info ของ "R-002" (ใช้ REGEXEXTRACT)', 'yahoo.com', ''],
    ['RG-05', 'Regex_Data', 'สกัดเอาเฉพาะตัวเลขจาก Dirty_Amount ของ "R-002" (ใช้ REGEXEXTRACT กับ \\d+)', '450', ''],
    ['RG-06', 'Regex_Data', 'สกัดตัวเลขปี (4 หลัก) ออกจาก Invoice_Code ของ "R-004" (ใช้ REGEXEXTRACT)', '2025', ''],
    ['RG-07', 'Regex_Data', 'ดึงชื่อคน (ข้อความก่อนขีด - โดยไม่มีช่องว่างท้าย) ออกจาก Raw_Contact_Info ของ "R-003" (ใช้ REGEXEXTRACT)', 'Bob Bob', ''],
    ['RG-08', 'Regex_Data', 'เซ็นเซอร์เบอร์โทรศัพท์ใน Raw_Contact_Info ของ "R-004" โดยเปลี่ยน 4 ตัวหลังเป็น **** (ใช้ REGEXREPLACE)', 'Alice - alice@company.co.th / 085999****', ''],
    ['RG-09', 'Regex_Data', 'ลบตัวอักษรทั้งหมดใน Dirty_Amount ของ "R-005" ให้เหลือแค่ตัวเลข (ใช้ REGEXREPLACE ลบ [^\\d])', '1200', ''],
    ['RG-10', 'Regex_Data', 'แทนที่ขีด (-) หรือช่องว่างใน Invoice_Code ของ "R-002" ให้เป็นเครื่องหมายขีดล่าง _ ทั้งหมด (ใช้ REGEXREPLACE)', 'TH2024_A12', '']
  ]));
  
  const descTasks = 'บททดสอบท้ายบทเรียน (รวม 30 ข้อ) พิมพ์สูตรในคอลัมน์ Your_Formula สีเขียว คอลัมน์ Self_Check จะบอกทันทีว่าผลตรงกับ Expected_Result หรือไม่ และเตือนถ้าพิมพ์ตัวเลขแทนสูตร';
  styleSheet(wsTasks, 6, descTasks);

  // Self-check column F + running score in the spacer row above the header.
  const firstTaskRow = 5;
  const lastTaskRow = wsTasks.rowCount;
  wsTasks.eachRow((row, rowNum) => {
    const id = row.getCell(1).value;
    if (rowNum < firstTaskRow || !answers[id]) return;
    const check = row.getCell(6);
    check.value = { formula: buildSelfCheck(id, `E${rowNum}`, parseExpected(id, row.getCell(4).value)) };
    check.alignment = alignCenter;
  });
  const scoreRow = wsTasks.getRow(3);
  scoreRow.height = 26;
  scoreRow.getCell(5).value = 'คะแนนตรวจตัวเอง';
  scoreRow.getCell(5).alignment = alignRight;
  scoreRow.getCell(5).font = { name: fontName, size: 16, bold: true, color: { argb: 'FF059669' } };
  scoreRow.getCell(6).value = { formula: `COUNTIF(F${firstTaskRow}:F${lastTaskRow},"${SELF_CHECK.ok}")&" / ${Object.keys(answers).length}"` };
  scoreRow.getCell(6).alignment = alignCenter;
  scoreRow.getCell(6).font = { name: fontName, size: 16, bold: true, color: { argb: 'FF059669' } };
  const statusStyle = (font, fill) => ({ font: { color: { argb: font }, bold: true }, fill: { type: 'pattern', pattern: 'solid', bgColor: { argb: fill } } });
  wsTasks.addConditionalFormatting({
    ref: `F${firstTaskRow}:F${lastTaskRow}`,
    rules: [
      { type: 'containsText', operator: 'containsText', text: '✓', priority: 1, style: statusStyle('FF047857', 'FFD1FAE5') },
      { type: 'containsText', operator: 'containsText', text: '✗', priority: 2, style: statusStyle('FFB91C1C', 'FFFEE2E2') },
      { type: 'containsText', operator: 'containsText', text: '⚠', priority: 3, style: statusStyle('FFB45309', 'FFFEF3C7') },
    ],
  });
  
  // Highlight the "Your_Formula" column and format number cells
  wsTasks.eachRow((row, rowNum) => {
    if (rowNum >= 5) {
      const cell = row.getCell(5);
      
      // Only style rows that are actually tasks (skip the empty separator row)
      if (row.getCell(1).value) {
         cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFF0FDF4' } };
         cell.border = { ...borderStyle, top: { style: 'medium', color: { argb: 'FF22C55E' } }, bottom: { style: 'medium', color: { argb: 'FF22C55E' } }, left: { style: 'medium', color: { argb: 'FF22C55E' } }, right: { style: 'medium', color: { argb: 'FF22C55E' } } };
      }
    }
  });

  // ==========================================
  // SHEETS 5-6: Advanced capstone data (lesson-advanced-capstone, slides 48-49)
  // ==========================================
  addActivitySheet('E-Commerce', [['TxnID', 12], ['CustID', 14], ['Platform', 14], ['Gross_Sales', 14], ['Discount', 12], ['Is_Returned', 14], ['Net_Sales', 14]], [
    ['TX-901', 'CUST-551', 'Shopee', 2450, 250, false, ''],
    ['TX-902', 'CUST-882', 'Lazada', 8900, 500, false, ''],
    ['TX-903', 'CUST-104', 'TikTok', 1200, 0, true, '']
  ], [7]);
  // ZONE-C-02 has stock equal to its reorder point: the edge case the rubric asks learners to explain.
  addActivitySheet('Warehouse', [['Bin_Location', 16], ['Raw_Barcode', 20], ['Unit_Stock', 12], ['Reorder_Point', 15], ['SKU', 14], ['Need_Restock', 16]], [
    ['ZONE-A-01', '[SKU-8821]-LOT4', 140, 50, '', ''],
    ['ZONE-B-04', '[SKU-9042]-LOT1', 12, 30, '', ''],
    ['ZONE-C-02', '[SKU-7730]-LOT2', 25, 25, '', '']
  ], [5, 6]);

  // Write to File
  const exportPath = path.join(__dirname, 'public', 'Google_Sheets_Mastery_Practice.xlsx');
  await workbook.xlsx.writeFile(exportPath);
  const tasks = [];
  wsTasks.eachRow((row, rowNumber) => {
    const id = row.getCell(1).value;
    if (!answers[id]) return;
    tasks.push({ id, cell: `E${rowNumber}`, task: row.getCell(3).value, expected: row.getCell(4).value });
  });
  fs.writeFileSync(path.join(__dirname, 'src', 'practice-tasks.json'), JSON.stringify(tasks, null, 2) + '\n');
  const answerPath = path.join(__dirname, 'public', 'answer_key.gs');
  const original = fs.readFileSync(answerPath, 'utf8');
  const formulas = Object.fromEntries(Object.entries(answers).map(([id, entry]) => [id, entry[0]]));
  const answersBlock = /var answers = \{[\s\S]*?\n\s*\};/;
  if (!answersBlock.test(original)) throw new Error(`answers block not found in ${answerPath}`);
  // Function replacer: formulas contain "$" (e.g. "\\d{4}$"), which a replacement string would treat as a pattern.
  fs.writeFileSync(answerPath, original.replace(answersBlock, () => `var answers = ${JSON.stringify(formulas, null, 4)};`));
  console.log(`Excel file successfully created at: ${exportPath}`);
}

createPracticeWorkbook().catch(err => {
  console.error('Error creating Excel file:', err);
  process.exitCode = 1;
});
