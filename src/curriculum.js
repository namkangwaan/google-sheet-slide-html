// Course map shared by the deck's table of contents (slide-3 in lessons.js) and the
// hero page. `id` is a public slide link target, so never rename one.
export const TRACKS = {
  start: { title: 'เริ่มต้น', note: 'เตรียมไฟล์และชีตของตัวเองให้พร้อมใน 10 นาที' },
  basic: { title: 'เส้นทางพื้นฐาน', note: 'ยังไม่เคยเขียนสูตร เริ่มจากตรงนี้ตามลำดับ' },
  advanced: { title: 'เส้นทางต่อยอด', note: 'ใช้สูตรพื้นฐานคล่องแล้ว ไปต่อกับเครื่องมือขั้นสูง' },
  practice: { title: 'ฝึกและส่งงาน', note: 'ตรวจคำตอบเอง ทำการบ้าน แล้วประเมินตนเอง' },
};

export const CURRICULUM = [
  { id: 'lesson-setup', label: 'เริ่มเรียน / ดาวน์โหลดแบบฝึก', track: 'start', summary: 'ดาวน์โหลดไฟล์แบบฝึก เปิดใน Google Sheets ของตัวเอง แล้วตั้ง Locale ให้พร้อม' },
  { id: 'lesson-cells', label: '1 · เซลล์และตารางที่ดี', track: 'basic', summary: 'อ่านที่อยู่เซลล์และช่วง จัดตารางให้หนึ่งแถวเป็นหนึ่งรายการ' },
  { id: 'slide-4', label: '2 · สูตรและการอ้างอิง', track: 'basic', summary: 'เขียนสูตร ลากสูตรให้ค่าถูก ใช้ $ ตรึงเซลล์ และอ่านข้อผิดพลาด' },
  { id: 'slide-13', label: '3 · เงื่อนไขและการสรุป', track: 'basic', summary: 'IF, SUMIF, COUNTIF และ SUMIFS สรุปเฉพาะรายการที่ตรงเงื่อนไข' },
  { id: 'slide-28', label: '4 · ค้นหาและกรอง', track: 'basic', summary: 'VLOOKUP, XLOOKUP, INDEX + MATCH และ FILTER ดึงข้อมูลที่ต้องการ' },
  { id: 'lesson-tools', label: '5 · เครื่องมือจัดข้อมูล', track: 'basic', summary: 'ตรึงหัวตาราง เรียง กรอง ทำ Dropdown และ Checkbox' },
  { id: 'lesson-charts', label: '6 · กราฟและ Pivot', track: 'basic', summary: 'เลือกกราฟให้ตอบคำถาม แล้วสรุปซ้ำด้วย Pivot table' },
  { id: 'lesson-capstone', label: 'ชิ้นงานพื้นฐาน / เกณฑ์ส่ง', track: 'basic', summary: 'ชิ้นงานร้านค้าห้องเรียน ใช้ทุกทักษะของเส้นทางพื้นฐาน' },
  { id: 'slide-6', label: 'ต่อยอด · มิติข้อมูลและ Tables', track: 'advanced', summary: 'แยกมิติกับตัวชี้วัด ตั้งชื่อช่วง และใช้ Tables ที่ขยายตามข้อมูล' },
  { id: 'slide-36', label: 'ต่อยอด · QUERY และ Reshape', track: 'advanced', summary: 'QUERY แบบ SQL, VSTACK/HSTACK และ TOCOL/TOROW' },
  { id: 'slide-51', label: 'ต่อยอด · Regex', track: 'advanced', summary: 'REGEXMATCH, REGEXEXTRACT และ REGEXREPLACE ตรวจ ดึง และแทนที่ข้อความ' },
  { id: 'slide-45', label: 'ต่อยอด · LET / LAMBDA / MAP', track: 'advanced', summary: 'ตั้งชื่อค่าในสูตร สร้างฟังก์ชันเอง และใช้กับทุกแถวในครั้งเดียว' },
  { id: 'slide-48', label: 'ชิ้นงานต่อยอด', track: 'advanced', summary: 'ชิ้นงานกับชีต E-Commerce และ Warehouse แล้วตรวจผลอีกทาง' },
  { id: 'lesson-answers', label: 'คำใบ้และเฉลย 30 ข้อ', track: 'practice', summary: 'คำใบ้ สูตรเฉลย และเหตุผลของแบบฝึกทั้ง 30 ข้อ' },
  { id: 'lesson-homework', label: 'การบ้าน 20 ข้อ (ครูตรวจ)', track: 'practice', summary: 'การบ้านร้านค้าสามสาขา ส่งไฟล์ให้ครูตรวจ' },
  { id: 'slide-57', label: 'ประเมินตนเองและส่งงาน', track: 'practice', summary: 'เช็กลิสต์ทักษะก่อนส่งงาน' },
];
