// Builds the Assignments!F self-check formula for one task.
// Shared by generate-excel.cjs (writes it) and verify-practice.cjs (recomputes the expected
// value from the data and asserts the written formula matches), so the answer embedded in
// each check cannot drift from the workbook data.

const SELF_CHECK = {
  ok: '✓ ถูกต้อง',
  wrong: '✗ ยังไม่ตรง',
  notFormula: '⚠ พิมพ์เป็นสูตร',
};

const quote = value => `"${String(value).replaceAll('"', '""')}"`;

// Blank until the learner answers; a typed value (not a formula) is flagged before grading.
function wrap(cell, test) {
  return `IF(${cell}="","",IF(NOT(ISFORMULA(${cell})),${quote(SELF_CHECK.notFormula)},IF(IFERROR(${test},FALSE),${quote(SELF_CHECK.ok)},${quote(SELF_CHECK.wrong)})))`;
}

/**
 * @param {string} id Task ID, e.g. "HR-01"
 * @param {string} cell Learner answer cell, e.g. "E5"
 * @param {number|boolean|string|string[]|null} expected Typed expected result; string[] = spilled list
 */
function buildSelfCheck(id, cell, expected) {
  const column = cell.match(/^[A-Z]+/)[0];
  const row = Number(cell.slice(column.length));
  // HR-08 depends on today's date, so compare with the live calculation instead of a constant.
  if (id === 'HR-08') return wrap(cell, `${cell}=DATEDIF(HR_Roster!D8,TODAY(),"Y")`);
  if (Array.isArray(expected)) {
    // FILTER spills one value per row; TEXTJOIN into a single cell is also accepted.
    const spilled = expected.map((value, i) => `${column}${row + i}=${quote(value)}`).join(',');
    return wrap(cell, `OR(AND(${spilled}),${cell}=${quote(expected.join(', '))})`);
  }
  if (typeof expected === 'number') return wrap(cell, `ROUND(${cell},2)=${Math.round(expected * 100) / 100}`);
  if (typeof expected === 'boolean') return wrap(cell, `${cell}=${String(expected).toUpperCase()}`);
  // EXACT: text answers must match exactly, including case and stray spaces.
  return wrap(cell, `EXACT(${cell},${quote(expected)})`);
}

/**
 * Turns an Expected_Result label from the Assignments sheet into a typed value.
 * Regex tasks return text (REGEXEXTRACT yields strings such as "450"), except TRUE/FALSE.
 */
function parseExpected(id, label) {
  if (id === 'HR-08') return null;
  if (label === 'TRUE' || label === 'FALSE') return label === 'TRUE';
  if (/\(แสดง \d+ แถว\)$/.test(label)) return label.replace(/\s*\(แสดง \d+ แถว\)$/, '').split(' และ ');
  if (!id.startsWith('RG-') && /^-?[\d,]+(\.\d+)?$/.test(label)) return Number(label.replaceAll(',', ''));
  return label;
}

module.exports = { SELF_CHECK, buildSelfCheck, parseExpected };
