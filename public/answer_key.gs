/**
 * Google Sheets Mastery - Automated Answer Key
 * Instructions:
 * 1. Open your Google Sheet.
 * 2. Go to Extensions > Apps Script.
 * 3. Paste this code and click Save (💾).
 * 4. Refresh your Google Sheet. You will see a new menu "[ 💡 Google Sheets Mastery ]".
 * 5. Click "Reveal Answers" to fill only empty answer cells in Assignments.
 * Optional teacher tool. Students can reveal individual answers on the website.
 * Formula dictionary is generated from src/practice-answers.json.
 */

function onOpen() {
  var ui = SpreadsheetApp.getUi();
  ui.createMenu('[ 💡 Google Sheets Mastery ]')
      .addItem('เฉลยแบบฝึกหัด (Reveal Answers)', 'revealAnswers')
      .addToUi();
}

function revealAnswers() {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sheet = ss.getSheetByName('Assignments');
  
  if (!sheet) {
    SpreadsheetApp.getUi().alert('❌ ไม่พบชีตชื่อ "Assignments" กรุณาตรวจสอบอีกครั้ง');
    return;
  }

  // Answer Key Dictionary (Maps Task_ID to Formula)
  var answers = {
    "HR-01": "=COUNTA(HR_Roster!A5:A11)",
    "HR-02": "=COUNTIF(HR_Roster!C5:C11, \"Engineering\")",
    "HR-03": "=COUNTIF(HR_Roster!F5:F11, FALSE)",
    "HR-04": "=SUM(HR_Roster!E5:E11)",
    "HR-05": "=SUMIF(HR_Roster!C5:C11, \"Marketing\", HR_Roster!E5:E11)",
    "HR-06": "=AVERAGEIF(HR_Roster!C5:C11, \"Sales\", HR_Roster!E5:E11)",
    "HR-07": "=MAX(HR_Roster!E5:E11)",
    "HR-08": "=DATEDIF(HR_Roster!D8, TODAY(), \"Y\")",
    "HR-09": "=AND(HR_Roster!F11=TRUE, HR_Roster!E11>40000)",
    "HR-10": "=IF(HR_Roster!C5=\"Engineering\", \"Tech\", \"Business\")",
    "SD-01": "=SUM(Sales_Data!F5:F11)",
    "SD-02": "=SUMIF(Sales_Data!B5:B11, \"Bangkok\", Sales_Data!F5:F11)",
    "SD-03": "=SUMIFS(Sales_Data!F5:F11, Sales_Data!C5:C11, \"Electronics\", Sales_Data!B5:B11, \"Chiang Mai\")",
    "SD-04": "=COUNTIF(Sales_Data!D5:D11, DATE(2026,9,20))",
    "SD-05": "=SUMIF(Sales_Data!C5:C11, \"Office Supplies\", Sales_Data!E5:E11)",
    "SD-06": "=AVERAGEIF(Sales_Data!B5:B11, \"Phuket\", Sales_Data!F5:F11)",
    "SD-07": "=VLOOKUP(\"TX-1004\", Sales_Data!A5:F11, 3, FALSE)",
    "SD-08": "=VLOOKUP(\"TX-1006\", Sales_Data!A5:F11, 5, FALSE)",
    "SD-09": "=MAXIFS(Sales_Data!F5:F11, Sales_Data!B5:B11, \"Bangkok\")",
    "SD-10": "=FILTER(Sales_Data!A5:A11, Sales_Data!F5:F11>100000)",
    "RG-01": "=REGEXMATCH(Regex_Data!B5, \"@gmail\\.com(\\s|$)\")",
    "RG-02": "=REGEXMATCH(Regex_Data!D5, \"^INV\")",
    "RG-03": "=REGEXMATCH(Regex_Data!C5, \"THB\")",
    "RG-04": "=REGEXEXTRACT(Regex_Data!B6, \"@([^ /]+)\")",
    "RG-05": "=REGEXEXTRACT(Regex_Data!C6, \"\\d+\")",
    "RG-06": "=REGEXEXTRACT(Regex_Data!D8, \"\\d{4}\")",
    "RG-07": "=REGEXEXTRACT(Regex_Data!B7, \"^(.+?)\\s*-\")",
    "RG-08": "=REGEXREPLACE(Regex_Data!B8, \"\\d{4}$\", \"****\")",
    "RG-09": "=REGEXREPLACE(Regex_Data!C9, \"[^\\d]\", \"\")",
    "RG-10": "=REGEXREPLACE(Regex_Data!D6, \"[- ]\", \"_\")"
};

  var dataRange = sheet.getDataRange();
  var values = dataRange.getValues();
  
  // Loop through rows to find Task ID in Column A (index 0)
  // and inject formula into Column E (index 4)
  var updates = 0;
  for (var i = 0; i < values.length; i++) {
    var taskId = values[i][0];
    if (answers[taskId]) {
      // +1 because array is 0-indexed but getRange is 1-indexed
      var cell = sheet.getRange(i + 1, 5);
      if (!cell.isBlank()) continue;
      cell.setFormula(answers[taskId]);
      
      // Style it to indicate it was auto-filled
      cell.setFontColor('#1E3A8A'); // Blue to stand out
      cell.setFontWeight('bold');
      updates++;
    }
  }

  SpreadsheetApp.getUi().alert('✅ ดำเนินการเสร็จสิ้น!\nเติมสูตรเฉลยทั้งหมด ' + updates + ' ข้อเรียบร้อยแล้ว');
}
