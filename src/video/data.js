// Data shown in the trailer. Copied from public/Google_Sheets_Mastery_Practice.xlsx and
// asserted against it by scripts/verify-video.mjs, so a workbook change fails check:video.
// No JSON imports here: Node loads this file directly and would need import attributes.

export const CLASSROOM = [
  { item: 'สมุด', category: 'เครื่องเขียน', qty: 10, price: 20 },
  { item: 'ดินสอ', category: 'เครื่องเขียน', qty: 5, price: 10 },
  { item: 'น้ำ', category: 'อาหาร', qty: 8, price: 7 },
  { item: 'ขนม', category: 'อาหาร', qty: 6, price: 15 },
];

// Classroom!H1 in the lesson activity (10% discount).
export const DISCOUNT = 0.1;

export const SALES = [
  { id: 'TX-1001', region: 'Bangkok', category: 'Electronics', date: '2026-09-20', units: 5, revenue: 125000 },
  { id: 'TX-1002', region: 'Chiang Mai', category: 'Office Supplies', date: '2026-09-20', units: 50, revenue: 25000 },
  { id: 'TX-1003', region: 'Phuket', category: 'Electronics', date: '2026-09-21', units: 2, revenue: 45000 },
  { id: 'TX-1004', region: 'Bangkok', category: 'Office Supplies', date: '2026-09-21', units: 100, revenue: 48000 },
  { id: 'TX-1005', region: 'Chiang Mai', category: 'Electronics', date: '2026-09-22', units: 12, revenue: 310000 },
  { id: 'TX-1006', region: 'Bangkok', category: 'Electronics', date: '2026-09-22', units: 1, revenue: 25000 },
  { id: 'TX-1007', region: 'Phuket', category: 'Office Supplies', date: '2026-09-23', units: 30, revenue: 15000 },
];

export const CONTACTS = [
  { id: 'R-001', text: 'John Doe - john@gmail.com / 0891234567' },
  { id: 'R-002', text: 'Jane Smith - jane.smith@yahoo.com / 0819876543' },
  { id: 'R-004', text: 'Alice - alice@company.co.th / 0859998888' },
];

// Same patterns as RG-04 and RG-08 in src/practice-answers.json.
export const DOMAIN_PATTERN = /@([^ /]+)/;
export const PHONE_TAIL_PATTERN = /\d{4}$/;

export const amounts = () => CLASSROOM.map(row => row.qty * row.price);
export const grandTotal = () => amounts().reduce((sum, value) => sum + value, 0);
export const discounted = () => amounts().map(value => Math.round(value * (1 - DISCOUNT) * 100) / 100);
export const byCategory = () => CLASSROOM.reduce((totals, row) => {
  totals[row.category] = (totals[row.category] ?? 0) + row.qty * row.price;
  return totals;
}, {});

export const lookupCategory = id => SALES.find(sale => sale.id === id)?.category ?? '#N/A';
export const filterIds = minRevenue => SALES.filter(sale => sale.revenue > minRevenue).map(sale => sale.id);
export const queryTotals = () => SALES.reduce((totals, sale) => {
  totals[sale.category] = (totals[sale.category] ?? 0) + sale.revenue;
  return totals;
}, {});

export const extractDomain = text => text.match(DOMAIN_PATTERN)?.[1] ?? '#N/A';
export const maskPhone = text => text.replace(PHONE_TAIL_PATTERN, '****');

const EMERALD = [0.063, 0.725, 0.506];
const TEAL = [0.078, 0.722, 0.651];
const CYAN = [0.133, 0.827, 0.933];
const AMBER = [0.984, 0.749, 0.141];
const VIOLET = [0.655, 0.545, 0.98];
const PINK = [0.957, 0.447, 0.714];

// Order and length of the trailer. Durations must add up to 180 s (checked).
export const SCENE_SPECS = [
  { id: 'intro', label: 'เปิดคอร์ส', duration: 12, accent: EMERALD,
    caption: 'คอร์ส Google Sheets สำหรับผู้เริ่มต้น เรียนเองได้ทีละขั้น' },
  { id: 'cells', label: 'เซลล์และตาราง', duration: 16, accent: EMERALD,
    caption: 'เริ่มจากตารางที่ดี: หนึ่งแถวต่อหนึ่งรายการ หนึ่งคอลัมน์ต่อหนึ่งข้อมูล' },
  { id: 'references', label: 'สูตรและการอ้างอิง', duration: 18, accent: TEAL,
    caption: 'ลากสูตรลง การอ้างอิงจะเลื่อนตาม ใส่ $ เมื่อต้องการตรึงเซลล์ไว้' },
  { id: 'sumif', label: 'SUMIF', duration: 16, accent: EMERALD,
    caption: 'SUMIF รวมเฉพาะแถวที่ตรงเงื่อนไข ไม่ต้องบวกทีละช่อง' },
  { id: 'chart', label: 'กราฟ', duration: 14, accent: TEAL,
    caption: 'เลือกกราฟให้ตรงคำถาม เปรียบเทียบหมวดใช้กราฟแท่ง' },
  { id: 'lookup', label: 'Lookup', duration: 18, accent: CYAN,
    caption: 'Lookup ใช้รหัสค้นหาค่าเดียว: TX-1004 ซื้อหมวด Office Supplies' },
  { id: 'filter', label: 'FILTER และ QUERY', duration: 18, accent: AMBER,
    caption: 'FILTER คืนทุกแถวที่ผ่านเงื่อนไข ส่วน QUERY สรุปแบบ SQL ได้ในสูตรเดียว' },
  { id: 'regex', label: 'Regex', duration: 18, accent: VIOLET,
    caption: 'Regex หาแพทเทิร์นในข้อความ ใช้ตรวจ ดึง และแทนที่ได้' },
  { id: 'lambda', label: 'LET LAMBDA MAP', duration: 16, accent: PINK,
    caption: 'LET ตั้งชื่อค่า LAMBDA สร้างฟังก์ชันเอง MAP ใช้กับทุกแถวในครั้งเดียว' },
  { id: 'practice', label: 'แบบฝึก 30 ข้อ', duration: 16, accent: EMERALD,
    caption: 'ฝึก 30 ข้อจากข้อมูลจริง ตรวจคำตอบเองได้ทันทีในคอลัมน์ Self_Check' },
  { id: 'outro', label: 'เริ่มเรียน', duration: 18, accent: EMERALD,
    caption: 'เริ่มเรียนได้ฟรีที่เว็บไซต์ ดาวน์โหลดไฟล์แบบฝึกแล้วลงมือได้เลย' },
];

export const SITE_URL = 'namkangwaan.github.io/google-sheet-slide-html';
export const PRACTICE_FILE = 'Google_Sheets_Mastery_Practice.xlsx';
