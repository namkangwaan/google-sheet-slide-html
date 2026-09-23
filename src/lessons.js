import answers from './practice-answers.json';
import tasks from './practice-tasks.json';

const escapeHtml = (value) => String(value).replace(/[&<>"']/g, char => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[char]));
const formula = (value) => `<div class="lesson-formula"><code>${escapeHtml(value)}</code><button type="button" data-copy-formula="${escapeHtml(value)}">คัดลอกสูตร</button></div>`;
const reveal = (label, content) => `<details><summary>${label}</summary><div>${content}</div></details>`;
const activity = (task, hint, solution, reason) => `<aside class="lesson-activity"><h3>ลองทำด้วยตนเอง</h3><p>${task}</p>${reveal('ขอคำใบ้', hint)}${reveal('ดูเฉลยและเหตุผล', `${solution}<p>${reason}</p>`)}</aside>`;
const questions = (items) => `<div class="lesson-checks"><h3>เช็กความเข้าใจ — ตอบก่อนเปิดเฉลย</h3>${items.map(([question, answer]) => reveal(question, answer)).join('')}</div>`;
const jump = (id, label) => `<a class="lesson-link" href="#${id}">${label}</a>`;
const table = `<table class="lesson-table"><caption>Classroom!A1:D5 — ข้อมูลสมมติร้านค้าห้องเรียน</caption><thead><tr><th>แถว</th><th>A · Item</th><th>B · Category</th><th>C · Qty</th><th>D · Unit_Price</th></tr></thead><tbody><tr><td>2</td><td>สมุด</td><td>เครื่องเขียน</td><td>10</td><td>20</td></tr><tr><td>3</td><td>ดินสอ</td><td>เครื่องเขียน</td><td>5</td><td>10</td></tr><tr><td>4</td><td>น้ำ</td><td>อาหาร</td><td>8</td><td>7</td></tr><tr><td>5</td><td>ขนม</td><td>อาหาร</td><td>6</td><td>15</td></tr></tbody></table>`;

function page(id, title, level, lead, body) {
  let slide = document.getElementById(id);
  if (!slide) {
    slide = document.createElement('section');
    slide.id = id;
  }
  slide.className = 'slide-page learning-slide';
  slide.dataset.title = title;
  slide.dataset.level = level;
  slide.innerHTML = `<div class="lesson-heading"><div><p class="eyebrow">${level}</p><h2 class="slide-title">${title}</h2><p class="slide-sub">${lead}</p></div><span class="slide-counter-badge"></span></div><div class="lesson-body">${body}</div><div class="lesson-footer">${jump('slide-3', 'สารบัญ')}<span>ลองทำ → ตรวจผล → อธิบายเหตุผล</span>${jump('lesson-answers', 'เฉลยแบบฝึก')}</div>`;
  return slide;
}

export function initializeLessons() {
  const stage = document.getElementById('stage-container');
  const newSlides = [
    page('slide-1', 'Google Sheets: เรียนแล้วทำได้จริง', 'เริ่มต้น • เรียนด้วยตนเอง', 'จากตารางแรก สู่การคำนวณ ค้นหา และอธิบายข้อมูล', `
      <div class="lesson-intro"><p class="lesson-big">เปิดสื่อหนึ่งแท็บ<br>ลงมือทำอีกหนึ่งแท็บ</p><div><h3>เมื่อเรียนจบ คุณจะทำได้</h3><ul><li>จัดตารางและเลือกชนิดข้อมูลได้ถูกต้อง</li><li>เขียนสูตร คัดลอกสูตร และตรวจข้อผิดพลาด</li><li>กรอง ค้นหา และสรุปข้อมูลเป็นกราฟ</li><li>ส่งชิ้นงานพร้อมอธิบายวิธีคิดของตนเอง</li></ul><p>สำหรับผู้เริ่มต้นที่ใช้เมาส์และพิมพ์ข้อความได้ บทต่อยอดเลือกเรียนภายหลังได้</p></div></div>
      <div class="lesson-actions">${jump('lesson-setup', 'เริ่มเรียนและเปิดแบบฝึก →')}${jump('slide-3', 'เลือกหัวข้อทบทวน')}${jump('slide-58', 'ไปหน้าสุดท้าย (L)')}</div><p>แนะนำคอมพิวเตอร์สำหรับฝึกสูตร มือถือใช้ทบทวนได้ • ใช้ข้อมูลสมมติทุกกิจกรรม</p><p>ทางลัด: กด <kbd>L</kbd> เพื่อไปหน้าสุดท้าย • กด <kbd>H</kbd> เพื่อกลับหน้าแรก (ใช้ได้ทุกหน้า)</p>`),
    page('lesson-setup', 'เตรียมพื้นที่ฝึกของตัวเอง', 'เริ่มต้น • 5–10 นาที', 'อ่านสไลด์บนเว็บ แล้วลงมือทำใน Google Sheets ของคุณ', `
      <ol><li><a href="./Google_Sheets_Mastery_Practice.xlsx" download>ดาวน์โหลดไฟล์แบบฝึก .xlsx</a> แล้วอัปโหลดเข้า Google Drive ของตนเอง</li><li>เปิดด้วย Google Sheets แล้วเลือก <strong>File → Save as Google Sheets</strong> หากยังอยู่ในโหมดไฟล์ Excel ตั้งชื่อ <code>Sheets_ชื่อเล่น_ห้อง</code></li><li>เปิดแท็บ <code>Start_Here</code> อ่านคำแนะนำ แล้วเปิด <code>Classroom</code> สำหรับบทพื้นฐาน</li><li>ที่ <strong>File → Settings</strong> เลือก Locale: Thailand และ Time zone: Bangkok ตัวอย่างใช้ชื่อฟังก์ชันภาษาอังกฤษ</li><li>แบบฝึก 30 ข้ออยู่แท็บ <code>Assignments</code> พิมพ์สูตรในคอลัมน์ E สีเขียวตาม Task_ID; ชีต HR/Sales/Regex เริ่มข้อมูลที่แถว 5</li></ol>
      <p class="lesson-note">เปิดเว็บนี้และชีตคู่กัน ปุ่มคัดลอกสูตรช่วยพิมพ์ แต่ให้ทายผลก่อนวางสูตร ตรวจ Locale หากวันที่หรือตัวคั่นสูตรไม่ตรงกัน</p>
      ${questions([['ยังแก้ไฟล์ต้นฉบับไม่ได้ ต้องทำอย่างไร?', 'ใช้สำเนาใน Drive ของตนเอง หากครูให้ลิงก์ Google Sheets ให้เลือก File → Make a copy ตามสิทธิ์ที่ครูให้'], ['ปุ่มลูกศรของเว็บใช้เมื่อใด?', 'ใช้เปลี่ยนสไลด์เมื่อไม่ได้พิมพ์ในช่องคำตอบ กด G เปิดสารบัญทั้งหมด และเลื่อนอ่านเนื้อหาได้บนมือถือ']])}
      <p class="lesson-source"><a href="https://support.google.com/docs/answer/58515?hl=th" target="_blank" rel="noreferrer">อ้างอิง: การตั้งค่า Locale และการคำนวณของ Google Sheets</a></p>`),
    page('slide-2', 'เลือกเส้นทางให้ตรงกับพื้นฐาน', 'แผนการเรียน', 'เรียนทีละบท หยุดฝึกได้ทุกช่วง เวลาที่แสดงเป็นเวลาแนะนำ', `
      <div class="lesson-columns"><div><h3>เส้นทางพื้นฐาน</h3><p>ยังไม่เคยเขียนสูตร เริ่มตามลำดับนี้</p><ol><li>เซลล์ ตาราง และรูปแบบข้อมูล — 15 นาที</li><li>สูตรแรกและการตรึงตำแหน่ง — 20 นาที</li><li>เงื่อนไข ค้นหาและกรอง — 25 นาที</li><li>เครื่องมือจัดข้อมูล กราฟ และ Pivot — 20 นาที</li><li>ชิ้นงานร้านค้าห้องเรียน — 30 นาที</li></ol>${jump('lesson-cells', 'เข้าสู่บทพื้นฐาน')}</div><div><h3>เส้นทางต่อยอด</h3><p>ควรใช้ช่วงข้อมูล IF และสูตรค้นหาได้ก่อน</p><ol><li>มิติข้อมูล Named ranges และ Tables</li><li>QUERY และการจัดรูปตาราง</li><li>Regex: เรียนสัญลักษณ์ก่อนทำโจทย์</li><li>LET, LAMBDA และ MAP</li><li>Capstone ธุรกิจและคลังสินค้า</li></ol>${jump('slide-6', 'เข้าสู่บทต่อยอด')}</div></div>
      ${questions([['ยังใช้ $A$1 ไม่คล่อง ควรข้ามไป QUERY ไหม?', 'กลับไปฝึกคัดลอกสูตรและตรึงตำแหน่งก่อน เพื่อแยกปัญหาการอ้างอิงออกจากคำสั่ง QUERY'], ['จำสูตรทุกชื่อไม่ได้ ถือว่ายังไม่ผ่านหรือไม่?', 'ไม่จำเป็นต้องจำทั้งหมด ให้เลือกเครื่องมือได้ ตรวจผลได้ และอธิบายเหตุผลของสูตรที่ใช้ได้']])}`),
    page('slide-3', 'สารบัญบทเรียน', 'แผนที่การเรียน', 'เลือกบทที่ต้องการ หรือใช้ปุ่มถัดไปเพื่อเรียนตามลำดับ', `
      <nav class="lesson-directory" aria-label="สารบัญบทเรียน">
        ${[['lesson-setup','เริ่มเรียน / ดาวน์โหลดแบบฝึก'],['lesson-cells','1 · เซลล์และตารางที่ดี'],['slide-4','2 · สูตรและการอ้างอิง'],['slide-13','3 · เงื่อนไขและการสรุป'],['slide-28','4 · ค้นหาและกรอง'],['lesson-tools','5 · เครื่องมือจัดข้อมูล'],['lesson-charts','6 · กราฟและ Pivot'],['lesson-capstone','ชิ้นงานพื้นฐาน / เกณฑ์ส่ง'],['slide-6','ต่อยอด · มิติข้อมูลและ Tables'],['slide-36','ต่อยอด · QUERY และ Reshape'],['slide-51','ต่อยอด · Regex'],['slide-45','ต่อยอด · LET / LAMBDA / MAP'],['slide-48','ชิ้นงานต่อยอด'],['lesson-answers','คำใบ้และเฉลย 30 ข้อ'],['slide-57','ประเมินตนเองและส่งงาน']].map(([id,label])=>jump(id,label)).join('')}
      </nav><p>หมายเลขแสดงตำแหน่งปัจจุบันในบทเรียน ลิงก์ประจำหัวข้อยังใช้เปิดกลับมาทบทวนได้</p>`),
    page('lesson-cells', 'เซลล์หนึ่งช่องเก็บอะไรได้บ้าง?', 'พื้นฐาน 01', 'เปิด Classroom ในไฟล์แบบฝึก หรือพิมพ์ตารางนี้ในชีตใหม่ชื่อ Classroom', `
      ${table}<p><code>C2</code> หมายถึงคอลัมน์ C แถว 2 มีค่า 10 ส่วน <code>C2:D5</code> มี 8 เซลล์ ใช้แถบสูตรด้านบนดูค่าหรือสูตรของเซลล์ที่เลือก</p>
      <p class="lesson-note">หนึ่งแถวต่อหนึ่งรายการ หนึ่งคอลัมน์ต่อหนึ่งข้อมูล ใช้หัวตารางแถวเดียว ไม่รวมเซลล์กลางชุดข้อมูล และเก็บหน่วยไว้ในหัวคอลัมน์แทนการพิมพ์ “20 บาท”</p>
      ${activity('เลือก D4 แล้วบอกว่าตัวเลขหมายถึงอะไร จากนั้นตรวจว่าตารางมีรายการสินค้ากี่รายการ', 'ดูชื่อคอลัมน์และชื่อสินค้าในแถวเดียวกัน ไม่นับแถวหัวตาราง', '<strong>D4 = 7 บาทต่อหน่วย; สินค้า 4 รายการ</strong>', 'ตัวเลขจะมีความหมายเมื่ออ่านคู่กับชื่อคอลัมน์และรายการ')}`),
    page('lesson-references', 'ลากสูตรอย่างไรให้ค่าถูก?', 'พื้นฐาน 02', 'ใช้ Classroom: ตั้งหัวคอลัมน์ E1 เป็น Amount และใส่จำนวน × ราคาต่อหน่วย', `
      ${formula('=C2*D2')}<p>พิมพ์ใน <code>E2</code> แล้วลากจุดมุมล่างขวาถึง E5 สูตรแถวถัดไปจะเป็น <code>=C3*D3</code> เพราะเป็นการอ้างอิงสัมพัทธ์</p>
      <table class="lesson-table"><thead><tr><th>อ้างอิง</th><th>สิ่งที่คงที่เมื่อลาก</th></tr></thead><tbody><tr><td>A1</td><td>ไม่ตรึงแถวหรือคอลัมน์</td></tr><tr><td>$A$1</td><td>ตรึงทั้งแถวและคอลัมน์</td></tr><tr><td>$A1</td><td>ตรึงคอลัมน์ A</td></tr><tr><td>A$1</td><td>ตรึงแถว 1</td></tr></tbody></table>
      ${activity('กรอก H1 เป็น 10% แล้วใช้ F2 คำนวณยอดหลังลดราคา ก่อนลากถึง F5', 'ยอดหลังลด = Amount × (1 − อัตราส่วนลด) และอัตราส่วนลดต้องอยู่ H1 เสมอ', formula('=E2*(1-$H$1)'), 'F2:F5 ต้องได้ 180, 45, 50.4, 81 ถ้าใช้ H1 โดยไม่ตรึง พอลากลงจะไปอ้าง H2 ที่ว่าง')}
      ${questions([['E2:E5 ก่อนหักส่วนลดควรได้เท่าไร?', '200, 50, 56, 90 รวม 396 บาท'], ['ถ้าต้องลากข้ามคอลัมน์ แต่ยังอ่านแถว 1 ต้องใช้รูปแบบใด?', 'A$1 ตรึงเฉพาะแถว ส่วนตัวอักษรคอลัมน์เปลี่ยนได้']])}`),
    page('lesson-errors', 'อ่านข้อผิดพลาดก่อนซ่อนมัน', 'พื้นฐาน 03', 'ตรวจข้อมูล → ตรวจช่วง → ตรวจสูตร → เลือกผลสำรองที่มีความหมาย', `
      <table class="lesson-table"><thead><tr><th>อาการ</th><th>เริ่มตรวจตรงไหน</th></tr></thead><tbody><tr><td>#N/A</td><td>ค้นหาไม่พบ? ตรวจรหัส ช่องว่าง และตัวเลขที่เก็บเป็นข้อความ</td></tr><tr><td>#REF!</td><td>อ้างอิงถูกลบ หรือผลลัพธ์หลายเซลล์มีข้อมูลขวางอยู่?</td></tr><tr><td>#VALUE!</td><td>ข้อมูลหรืออาร์กิวเมนต์ผิดชนิด? ตรวจด้วย ISNUMBER / ISTEXT</td></tr><tr><td>#DIV/0!</td><td>ตัวหารเป็นศูนย์หรือว่าง? มีข้อมูลเพียงพอให้คำนวณหรือยัง?</td></tr></tbody></table>
      <p>รหัสและเบอร์โทรควรเก็บเป็นข้อความเพื่อรักษาเลข 0 นำหน้า การจัดแนวซ้าย/ขวาเป็นเพียงเบาะแส เพราะผู้ใช้ปรับแนวเองได้</p>
      ${activity('ลอง =10/0 ในเซลล์ว่าง ถ้าขึ้นข้อผิดพลาด ควรเปลี่ยนคำตอบเป็น 0 ทุกกรณีไหม?', '0 คือผลลัพธ์ตัวเลขจริง ส่วนข้อมูลไม่พอคืออีกสถานะหนึ่ง', '<strong>ไม่ควร เปลี่ยนเป็นข้อความ “ยังคำนวณไม่ได้” และตรวจตัวหาร</strong>', 'IFERROR อาจซ่อนข้อผิดพลาดชนิดอื่นด้วย ใช้ IFNA เมื่อต้องจัดการเฉพาะหาไม่พบ')}
      ${questions([['รหัส 0012 กลายเป็น 12 แก้ที่อะไร?', 'กำหนดช่องรหัสเป็น Plain text ก่อนกรอก ไม่ใช่แค่เปลี่ยนรูปแบบภายหลัง'], ['สูตรวันที่อ่านผิดเดือนควรตรวจอะไร?', 'ตรวจ Locale และใช้ DATE(ปี,เดือน,วัน) ให้ชัดเจน แยก ค.ศ. กับ พ.ศ. ตามข้อมูลจริง']])}`),
    page('lesson-summary', 'ฝึกสรุปยอดด้วยเงื่อนไข', 'กิจกรรมพื้นฐาน', 'ทำ Classroom!E2:E5 ให้เสร็จก่อน แล้ววางสูตรสรุปใน G2', `
      <p>ตัวอย่างยอดรวมทุกสินค้า: <code>=SUM(E2:E5)</code> ได้ 396 บาท ตอนนี้ต้องการทราบว่าเฉพาะหมวดเครื่องเขียนขายได้เท่าไร</p>
      ${activity('เขียนสูตรที่ G2 รวมยอดเฉพาะ Category = เครื่องเขียน โดยไม่บวกทีละช่องเอง', 'ใช้ SUMIF ตรวจ B2:B5 และรวม E2:E5 ที่อยู่แถวเดียวกัน', formula('=SUMIF(B2:B5,"เครื่องเขียน",E2:E5)'), 'สมุด 200 + ดินสอ 50 = 250 บาท ถ้าเปลี่ยน Qty ผลต้องเปลี่ยนตาม')}
      ${questions([['ถ้าอยากนับจำนวนรายการอาหาร ควร SUMIF หรือ COUNTIF?', 'COUNTIF(B2:B5,"อาหาร") ได้ 2 รายการ ไม่ใช่จำนวนชิ้นที่ขาย'], ['ผลรวมอาหารควรเท่าไร และตรวจโดยไม่ใช้สูตรอย่างไร?', '146 บาท จากน้ำ 56 + ขนม 90 ตรวจอีกทางด้วย 396 − 250'], ['ถ้าต้องการยอดสูงสุดของหมวดเครื่องเขียน ใช้ฟังก์ชันใด?', '<code>=MAXIFS(E2:E5,B2:B5,"เครื่องเขียน")</code> ได้ 200 MAXIFS และ MINIFS เขียนแบบเดียวกับ SUMIFS คือช่วงผลลัพธ์ก่อน แล้วตามด้วยคู่ช่วงเงื่อนไขกับเงื่อนไข ใช้ต่อในข้อ SD-09']])}
      <form id="total-check"><label for="classroom-total">เช็กด้วยตัวเอง: ยอดรวมทุกหมวดเป็นกี่บาท?</label><div class="lesson-actions"><input id="classroom-total" inputmode="decimal" autocomplete="off" placeholder="พิมพ์ตัวเลข"><button type="submit" class="lesson-link">ตรวจคำตอบ</button></div><p id="total-feedback" aria-live="polite"></p></form>
      <p>ฝึกต่อใน Assignments: HR-01 ถึง HR-07 และ SD-01 ถึง SD-06 เปิดเฉลยหลังลองทำด้วยตนเอง</p>`),
    page('lesson-lookup-check', 'เลือกค้นหา หรือเลือกกรอง?', 'ตรวจความเข้าใจ', 'ค้นหาค่าเดียวด้วยรหัส → Lookup • ต้องการหลายรายการที่ผ่านเงื่อนไข → FILTER', `
      ${activity('ทำ Assignments ข้อ SD-07: รหัส TX-1004 ซื้อหมวดสินค้าอะไร? เขียนสูตรใน E22', 'ข้อมูล Sales_Data เริ่มแถว 5 รหัสอยู่ A หมวดสินค้าอยู่ C ใช้การค้นหาตรงตัว', formula('=XLOOKUP("TX-1004",Sales_Data!A5:A11,Sales_Data!C5:C11,"หาไม่พบ")'), 'ได้ Office Supplies; ใช้ VLOOKUP แบบ FALSE ที่คืนผลเดียวกันก็ได้')}
      ${questions([['ถ้าต้องการธุรกรรมทุกแถวที่ยอดเกิน 100000 ควรใช้วิธีใด?', 'ใช้ FILTER และเว้นพื้นที่ให้ผลลัพธ์หลายแถว เช่น SD-10 ได้ TX-1001 และ TX-1005'], ['รหัสเดียวกันปรากฏหลายแถว แต่ต้องการยอดรวม ควร Lookup หรือ SUMIF?', 'SUMIF เหมาะกับการรวมทุกแถวที่ตรงเงื่อนไข Lookup ค่าแรกอาจทำให้ยอดขาด']])}`),
    page('lesson-tools', 'จัดข้อมูลให้หาและอ่านง่าย', 'พื้นฐาน 04 • เครื่องมือในเมนู', 'ฝึกบน Classroom หลังจากเติม Amount แล้ว', `
      <ol><li><strong>ตรึงหัวตาราง:</strong> View → Freeze → 1 row หัวคอลัมน์ยังอยู่ขณะเลื่อน</li><li><strong>เรียงข้อมูล:</strong> เลือก A1:E5 → Data → Sort range → Advanced range sorting options ระบุว่ามีหัวตาราง แล้วเรียง Amount มากไปน้อย</li><li><strong>กรอง:</strong> เลือก A1:E5 → Data → Create a filter แล้วเลือก Category = อาหาร</li><li><strong>ทำงานร่วมกัน:</strong> ใช้ Filter view หากต้องการมุมมองของตนเอง และตรวจว่ากรองข้อมูลค้างไว้ก่อนสรุปหรือไม่</li></ol>
      ${activity('กรองหมวดอาหาร ต้องเหลือสินค้าอะไรบ้าง? แล้วคืนการแสดงข้อมูลทั้งหมด', 'หมวดอยู่คอลัมน์ B การกรองซ่อนแถว แต่ไม่ได้ลบรายการ', '<strong>น้ำและขนม</strong>', 'เลือกทุกหมวดในตัวกรองอีกครั้งเพื่อแสดงครบ 4 รายการ')}
      ${questions([['ทำไมต้องเลือกทั้งตารางก่อนเรียง?', 'เพื่อให้ชื่อสินค้า จำนวน ราคา และยอดเงินย้ายไปด้วยกัน การเรียงเพียงคอลัมน์เดียวอาจทำให้ข้อมูลผิดคู่'], ['กรองเหลืออาหารแล้ว SUM(E2:E5) จะกลายเป็นยอดอาหารหรือไม่?', 'ไม่ สูตร SUM ยังคำนวณเซลล์ในช่วง ใช้ SUMIF ระบุหมวดให้ชัดเจน']])}`),
    page('lesson-validation', 'ป้อนข้อมูลให้สม่ำเสมอ', 'พื้นฐาน 05', 'Dropdown ลดชื่อหมวดที่สะกดต่างกัน Checkbox เก็บ TRUE / FALSE', `
      <ol><li>เลือก Classroom!B2:B5 → Insert → Dropdown ตั้งตัวเลือก เครื่องเขียน และ อาหาร</li><li>ใส่หัว I1 ว่า Checked แล้วเลือก I2:I5 → Insert → Checkbox กำหนดว่า “ติ๊กเมื่อเช็กยอดแล้ว”</li><li>เลือก E2:E5 → Format → Conditional formatting → Greater than → 100 เลือกสีเน้น</li></ol>
      ${activity('หลังตั้งสีตามเงื่อนไข ยอดของสินค้าใดควรถูกเน้น? จากนั้นติ๊ก Checked เฉพาะรายการที่ตรวจสูตรแล้ว', 'ตรวจค่า Amount ที่มากกว่า 100 แบบไม่รวม 100', '<strong>สมุด (200 บาท) เพียงรายการเดียว</strong>', 'สีช่วยสังเกต แต่ยังต้องอ่านตัวเลขและใช้เงื่อนไขเดียวกันในการคำนวณ')}
      ${questions([['ติ๊ก Checkbox แล้วสูตรจะอ่านค่าอะไรในค่าเริ่มต้น?', 'TRUE; ไม่ติ๊กเป็น FALSE จึงใช้กับ IF และ COUNTIF ได้'], ['Dropdown แก้ข้อความเดิมที่สะกดผิดทั้งหมดให้อัตโนมัติหรือไม่?', 'ต้องตรวจและแก้ข้อมูลเดิมให้ตรงตัวเลือกด้วย อย่าถือว่าการสร้างกฎทำให้ข้อมูลสะอาดแล้ว']])}`),
    page('lesson-charts', 'จากตารางสู่กราฟที่ตอบคำถาม', 'พื้นฐาน 06', 'คำถาม: หมวดใดมียอดขายมากกว่า? ใช้กราฟแท่งเพื่อเปรียบเทียบ', `
      <ol><li>เปิดชีต Summary ในไฟล์แบบฝึก ซึ่งมี A1 = Category, B1 = Amount, A2 = เครื่องเขียน, A3 = อาหาร ให้แล้ว</li><li>ที่ B2 พิมพ์สูตรด้านล่าง แล้วลากถึง B3</li><li>เลือก A1:B3 → Insert → Chart → เลือก Column chart ตั้งชื่อ “ยอดขายแยกตามหมวด (บาท)”</li><li>ตรวจแกนหมวดหมู่และหน่วย อ่านค่าจากกราฟเทียบตาราง</li></ol>${formula('=SUMIF(Classroom!B$2:B$5,A2,Classroom!E$2:E$5)')}
      ${activity('เขียนข้อสรุปหนึ่งประโยค โดยมีตัวเลขสนับสนุน', 'เปรียบเทียบ 250 กับ 146 และหาส่วนต่าง', '<strong>เครื่องเขียนมียอดขาย 250 บาท มากกว่าอาหาร 104 บาท</strong>', 'ระบุว่าเป็นยอดขายของข้อมูลชุดนี้ ไม่สรุปว่าขายดีกว่าทุกวัน')}
      ${questions([['ทำไมไม่ใช้กราฟเส้นกับหมวดสินค้า?', 'ข้อมูลนี้เปรียบเทียบหมวด ไม่ใช่ลำดับเวลาต่อเนื่อง กราฟแท่งอ่านความต่างได้ตรงกว่า'], ['ยอดรวมในกราฟควรเท่าไร?', '250 + 146 = 396 ตรงกับยอดรวมต้นทาง']])}`),
    page('lesson-pivot', 'สรุปแบบเดียวกันด้วย Pivot table', 'พื้นฐาน 07', 'เปรียบเทียบผลกับ SUMIF เพื่อฝึกตรวจคำตอบอีกทางหนึ่ง', `
      <ol><li>เลือก Classroom!A1:E5 → Insert → Pivot table → New sheet</li><li>Rows → Add → Category</li><li>Values → Add → Amount → Summarize by SUM</li><li>อ่านยอดแยกหมวดและ Grand total เปรียบเทียบกับ Summary</li></ol>
      ${activity('ถ้า Pivot แสดง 2 และ 2 แทน 250 และ 146 ควรตรวจอะไร?', 'ดูชื่อวิธีสรุปใน Values และชนิดข้อมูล Amount', '<strong>เปลี่ยน COUNT/COUNTA เป็น SUM และตรวจว่า Amount เป็นตัวเลข</strong>', '2 คือจำนวนรายการแต่ละหมวด ไม่ใช่ยอดขาย การได้ตัวเลขไม่ได้แปลว่าตอบคำถามถูก')}
      ${questions([['เพิ่มสินค้าแถว 6 แล้ว Pivot รวมให้แน่หรือไม่?', 'ตรวจช่วงข้อมูลต้นทางให้ครอบคลุมแถวใหม่ก่อน ไม่ถือว่าช่วง A1:E5 ขยายเองทุกกรณี'], ['Grand total ควรสัมพันธ์กับสูตรเดิมอย่างไร?', 'ควรเท่ากับ SUM ของ Amount ในชุดข้อมูลเดียวกัน คือ 396 ก่อนแก้ข้อมูล']])}`),
    page('lesson-capstone', 'ชิ้นงาน: ร้านค้าห้องเรียน', 'จบเส้นทางพื้นฐาน • 30 นาที', 'ใช้ Classroom และ Summary ในไฟล์ส่วนตัว เก็บข้อมูลเดิมไว้เพื่อให้ครูตรวจได้', `
      <div class="lesson-columns"><div><h3>สิ่งที่ต้องส่ง</h3><ol><li>Amount ครบทุกแถว ใช้สูตร Qty × Unit_Price</li><li>ยอดรวมและยอดแยกหมวดด้วยสูตร</li><li>Dropdown หมวดสินค้า และสีเน้นยอดเกิน 100</li><li>กราฟแท่งและ Pivot แยกหมวด</li><li>ข้อสรุป 2 ประโยค และอธิบายสูตรหนึ่งสูตร</li></ol><p>ทดลองเปลี่ยนจำนวนสมุดจาก 10 เป็น 11 ตรวจว่าทุกสรุปเปลี่ยนตาม แล้วคืนค่า 10 ก่อนส่ง</p></div><div><h3>เกณฑ์ 10 คะแนน</h3><ul><li>โครงสร้างและชนิดข้อมูลถูกต้อง — 2</li><li>สูตรและการอ้างอิงถูกต้อง — 3</li><li>กราฟ/Pivot ตรงกับข้อมูล — 2</li><li>ตรวจผลและอธิบายวิธีคิด — 2</li><li>เปิดไฟล์และอ่านผลงานได้ — 1</li></ul><p>เป้าหมายฝึก: อย่างน้อย 8/10 และแก้ยอดคำนวณที่ผิดให้ถูก ครูปรับเกณฑ์ได้ตามชั้นเรียน</p></div></div>
      ${reveal('ตรวจผลหลังทดลองเปลี่ยนจำนวนสมุด', 'Amount สมุด = 220; เครื่องเขียน = 270; รวม = 416 เมื่อคืนจำนวนเป็น 10 ผลต้องกลับเป็น 200 / 250 / 396')}
      <div class="lesson-actions">${jump('slide-57', 'ประเมินตนเองและส่งงาน')}${jump('slide-6', 'พร้อมแล้ว เรียนบทต่อยอด →')}</div>`),
    page('lesson-tables-check', 'ลองเพิ่มข้อมูล แล้วตรวจช่วงอ้างอิง', 'กิจกรรมต่อยอด • Ranges & Tables', 'ควรเข้าใจช่วงเซลล์และ SUM ก่อนเริ่ม', `
      <p>ในชีตใหม่ชื่อ Table_Test กรอก A1 = Item, B1 = Amount; A2 = สมุด, B2 = 200; A3 = ดินสอ, B3 = 50 เลือก A1:B3 → Format → Convert to table และตั้งชื่อ TestSales</p>
      ${activity('ใส่สูตรสรุปใน D2 แล้วเพิ่มรายการน้ำ 56 บาทเป็นแถวของตาราง ตรวจผลรวม', 'ใช้ชื่อคอลัมน์ Amount และตรวจว่าตารางครอบคลุมแถวที่เพิ่ม', formula('=SUM(TestSales[Amount])'), 'เริ่มที่ 250 แล้วเป็น 306 เมื่อเพิ่มแถวในตาราง Table reference เปลี่ยนตามขอบเขตตาราง แต่ต้องตรวจการเติมสูตรรายแถวแยกต่างหาก')}
      ${questions([['ตั้ง column type แล้วข้อมูลผิดชนิดถูกห้ามทุกกรณีไหม?', 'column type ช่วยจัดรูปแบบและแสดงคำเตือน อย่าสับสนกับกฎปฏิเสธข้อมูลที่ไม่ผ่าน Validation'], ['ชื่อหมวดที่เป็นเลข เช่น รหัสห้อง 101 เป็น Metric เสมอไหม?', 'ไม่ใช่ รหัสห้องใช้จัดกลุ่มจึงเป็น Dimension ความหมายและการใช้งานสำคัญกว่ารูปแบบตัวเลข']])}
      <p class="lesson-source"><a href="https://support.google.com/docs/answer/14239833?hl=en" target="_blank" rel="noreferrer">อ้างอิง: Tables และพฤติกรรม column types</a></p>`),
    page('lesson-query-check', 'ตรวจ QUERY และตารางที่ต่อกัน', 'กิจกรรมต่อยอด • QUERY / Reshape', 'ใช้ Sales_Data ในไฟล์แบบฝึก หัวตารางอยู่แถว 4', `
      ${activity('เปิดชีตใหม่ชื่อ Query_Result พิมพ์ใน A1 เพื่อรวมยอดขายแยกพื้นที่', 'ใช้คอลัมน์ B จัดกลุ่ม คอลัมน์ F หาผลรวม และระบุ header = 1', formula('=QUERY(Sales_Data!A4:F11,"select B, sum(F) group by B label sum(F) \'Revenue\'",1)'), 'Bangkok 198000, Chiang Mai 335000, Phuket 60000 รวม 593000')}
      ${questions([['QUERY(...,1) เลข 1 หมายถึงอะไร?', 'จำนวนแถวหัวตารางในช่วงข้อมูลที่ส่งเข้า ไม่ใช่หมายเลขแถวข้อมูลแรก'], ['ก่อนใช้ VSTACK รวมสองตารางต้องตรวจอะไร?', 'คอลัมน์ต้องเรียงลำดับและหมายถึงข้อมูลเดียวกัน ไม่ใส่หัวตารางซ้ำกลางข้อมูล'], ['HSTACK จับคู่รหัสให้หรือไม่?', 'ไม่ จัดคอลัมน์ข้างกันตามตำแหน่งแถว หากต้องจับคู่รหัสให้ใช้ Lookup ก่อน']])}`),
    page('lesson-regex-check', 'Regex ตรวจรูปแบบได้แค่ไหน?', 'กิจกรรมต่อยอด • Regex', 'เรียนสัญลักษณ์และฟังก์ชันก่อน แล้วลองทำ RG-01 ถึง RG-10', `
      <p class="lesson-note">เลขครบ 13 หลักไม่ได้พิสูจน์ว่าเลขบัตรถูกต้องหรือเป็นของบุคคลใด รูปแบบเบอร์โทร/อีเมลไม่ได้ยืนยันว่ามีผู้ใช้จริง ใช้เฉพาะข้อมูลสมมติในการฝึก</p>
      ${activity('ทำ RG-04 ที่ Assignments!E30 ดึงเฉพาะโดเมนจากข้อความที่มีทั้งอีเมลและเบอร์โทร', 'อย่าใช้ .* จับทุกอย่างหลัง @ ให้หยุดก่อนช่องว่างหรือ /', formula('=REGEXEXTRACT(Regex_Data!B6,"@([^ /]+)")'), 'ได้ yahoo.com โดยไม่ติดเบอร์โทร กลุ่มในวงเล็บระบุส่วนที่จะคืนค่า')}
      ${questions([['REGEXREPLACE เปลี่ยน 31/12/2024 เป็น 2024-12-31 แล้วได้ชนิด Date หรือยัง?', 'ยังเป็นข้อความ ต้องแปลงเป็นวันที่และตรวจด้วยฟังก์ชันให้เหมาะสม ไม่ใช่ดูรูปแบบอย่างเดียว'], ['\\w ใช้แทนตัวอักษรไทยทั้งหมดได้ไหม?', 'อย่าสมมติว่าได้ Google Sheets ใช้ RE2 โดย \\w เน้น A–Z, a–z, 0–9 และ _; ทดสอบ pattern กับภาษาและข้อมูลจริง'], ['ลบทุกอย่างที่ไม่ใช่ตัวเลขจาก 12.50 จะได้อะไร?', '1250 ซึ่งเปลี่ยนความหมายของราคา ต้องกำหนดวิธีรักษาจุดทศนิยมก่อนล้างข้อมูล']])}
      <p class="lesson-source"><a href="https://support.google.com/docs/answer/3098292?hl=en" target="_blank" rel="noreferrer">อ้างอิง: REGEXMATCH และ RE2</a></p>`),
    page('lesson-functional-check', 'เลือกใช้ LET / LAMBDA / MAP', 'กิจกรรมต่อยอด • สูตรขั้นสูง', 'ควรเข้าใจ IF การคำนวณ และช่วงข้อมูลก่อน', `
      ${activity('ที่ Classroom!J2 คำนวณยอดสมุดหลังส่วนลด 10% โดยตั้งชื่อค่าชั่วคราวด้วย LET', 'ให้ gross หมายถึง Qty × Unit_Price และ rate หมายถึงส่วนลด', formula('=LET(gross,C2*D2,rate,10%,gross*(1-rate))'), 'ได้ 180 ชื่อตัวแปรช่วยอธิบายสูตรและใช้ค่าที่ประกาศซ้ำได้')}
      ${questions([['เมื่อใดจึงควรใช้ MAP?', 'เมื่อต้องนำการคำนวณเดียวกันไปทำทีละค่าหรือคู่ค่าในช่วง โดยผลต่อรายการเป็นค่าเดียว'], ['LET ช่วยให้สูตรทุกแบบเร็วขึ้นเสมอไหม?', 'ไม่ ควรใช้เมื่อช่วยให้อ่านง่ายหรือหลีกเลี่ยงการคำนวณนิพจน์เดิมซ้ำ และตรวจผลก่อน/หลัง'], ['สูตรธรรมดาทำโจทย์ได้ชัดอยู่แล้ว ต้องเปลี่ยนเป็น LAMBDA ไหม?', 'ไม่จำเป็น เลือกวิธีที่ถูกต้องและผู้ใช้ไฟล์อธิบายหรือดูแลต่อได้']])}`),
    page('lesson-advanced-capstone', 'ชิ้นงานต่อยอด: ตรวจผลอีกทาง', 'การประเมินต่อยอด', 'ใช้ชีต E-Commerce และ Warehouse ในไฟล์แบบฝึก หัวตารางแถว 1 ข้อมูลเริ่มแถว 2', `
      <ol><li>E-Commerce: เติม Net_Sales ใน G2:G4 ใช้ Gross − Discount เฉพาะ Is_Returned = FALSE แล้วใช้ QUERY สรุปตาม Platform</li><li>Warehouse: สกัด SKU จาก Raw_Barcode ลง E2:E4 และคำนวณ Need_Restock ใน F2:F4 โดยเปรียบเทียบ Unit_Stock กับ Reorder_Point (ดูแถว ZONE-C-02 ที่สต็อกเท่ากับจุดสั่งซื้อพอดี)</li><li>ส่งชีตข้อมูล สูตรที่ใช้ ผลสรุป และคำอธิบายว่าตรวจข้อมูลคืนสินค้า/สต็อกเท่าจุดสั่งซื้ออย่างไร</li></ol>
      ${reveal('คำใบ้', 'E-Commerce ใช้ IF ก่อน QUERY; Warehouse ใช้ REGEXEXTRACT และ IF(C2<=D2,...)')}
      ${reveal('ตรวจผลและแนวเฉลย', `${formula('=IF(F2=FALSE,D2-E2,0)')}<p>ใน E-Commerce!G2 ลากถึง G4: ได้ 2200, 8400, 0 รวม 10600; สูตรนี้กำหนดให้รายการคืนสินค้าไม่รวมในยอดขาย</p>${formula('=QUERY(C1:G4,"select C, sum(G) group by C order by sum(G) desc",1)')}${formula('=REGEXEXTRACT(B2,"SKU-\\d+")')}${formula('=IF(C2<=D2,"REORDER NOW","OK")')}<p>Warehouse ลากถึงแถว 4: SKU-8821 / SKU-9042 / SKU-7730 และ OK / REORDER NOW / REORDER NOW ตามลำดับ ZONE-C-02 มีสต็อก 25 เท่ากับจุดสั่งซื้อ 25 จึงต้องสั่งเพิ่มเพราะใช้ &lt;= ถ้าเขียน &lt; จะได้ OK ซึ่งผิดเงื่อนไข</p>`)}
      <p>เกณฑ์ 10 คะแนน: สูตรถูกต้อง 4 • ตรวจกรณีขอบเขต 2 • ผลสรุปตรงข้อมูล 2 • อธิบายวิธีคิด 2 เปรียบเทียบผลรวมด้วยการคำนวณมือก่อนส่ง</p>`),
    page('lesson-answers', 'คำใบ้และเฉลยแบบฝึก 30 ข้อ', 'ฝึก → ตรวจ → อธิบาย', 'เลือกข้อที่ทำแล้ว เปรียบเทียบทั้งผลลัพธ์และเหตุผล สูตรอื่นที่ให้ผลถูกต้องก็ใช้ได้', `
      <p>พิมพ์สูตรใน <code>Assignments</code> คอลัมน์ E ตรง Task_ID ข้อมูลต้นทาง HR/Sales/Regex เริ่มแถว 5 สูตรในสไลด์บางหน้าใช้ตารางสาธิตแยกต่างหาก</p>
      <label for="practice-task">เลือกข้อ</label><select id="practice-task">${tasks.map(task=>`<option value="${task.id}">${task.id} — ${escapeHtml(task.task)}</option>`).join('')}</select>
      <div id="practice-answer" aria-live="polite"></div><p class="lesson-note">เฉลยในเว็บเปิดดูได้เพื่อเรียนรู้ ไม่ใช่ข้อสอบที่ซ่อนคำตอบ และไม่บันทึกคะแนนหรือส่งงานให้อัตโนมัติ</p>`),
    page('slide-57', 'ประเมินตนเองก่อนส่งงาน', 'จุดตรวจสุดท้าย', 'เปิดชิ้นงานจริงแล้วตรวจทีละข้อ เครื่องหมายนี้เป็นการเช็กชั่วคราวบนหน้านี้', `
      <div class="lesson-self-check">${['ฉันบอกความหมายของแถว คอลัมน์ และหน่วยข้อมูลได้','ฉันใช้สูตรคำนวณ ไม่พิมพ์คำตอบแทนสูตร','ฉันอธิบายการใช้ $ และตรวจสูตรหลังลากได้','ยอดรวมในสูตร กราฟ และ Pivot ตรงกัน','ฉันทดลองเปลี่ยนข้อมูลแล้วตรวจผล ก่อนคืนค่าต้นฉบับ','ฉันเขียนข้อสรุปพร้อมตัวเลขและอธิบายสูตรได้'].map(text=>`<label><input type="checkbox"> ${text}</label>`).join('')}</div>
      <p>ส่งไฟล์หรือแชร์ลิงก์ให้ครูด้วยสิทธิ์ <strong>ผู้ดู</strong> ผ่านช่องทางที่ครูกำหนด ตรวจชื่อไฟล์และสิทธิ์ก่อนส่ง ไม่ใส่ข้อมูลส่วนตัวจริงในไฟล์ฝึก</p>
      <div class="lesson-actions">${jump('lesson-capstone','ดูเกณฑ์ชิ้นงานพื้นฐาน')}${jump('lesson-advanced-capstone','ดูเกณฑ์ชิ้นงานต่อยอด')}</div>`),
    page('slide-58', 'พร้อมนำไปใช้กับโจทย์ของคุณ', 'จบบทเรียน', 'เลือกเครื่องมือให้ตรงคำถาม ตรวจผล และอธิบายสิ่งที่ค้นพบ', `
      <p class="lesson-big">ไม่ใช่แค่ได้ตัวเลข<br>ต้องรู้ว่าตัวเลขตอบอะไร</p><p>ลองออกแบบตารางงบกิจกรรมห้องเรียนด้วยข้อมูลสมมติ ระบุหน่วยให้ชัด ใช้สูตรสรุป แล้วให้เพื่อนอธิบายตารางกลับมา หากอธิบายได้ตรงกัน แสดงว่าสื่อสารข้อมูลได้ดี</p>
      <div class="lesson-actions"><a class="lesson-link" href="./Google_Sheets_Mastery_Practice.xlsx" download>ดาวน์โหลดแบบฝึก</a>${jump('lesson-answers','ทบทวนเฉลย')}${jump('slide-1','กลับหน้าแรก')}</div><p>หากยังติดขัด ให้กลับไปบทแก้ข้อผิดพลาดหรือถามครูพร้อมชื่อชีต เซลล์ สูตรที่ใช้ และผลที่คาดหวัง</p>`)
  ];
  newSlides.forEach(slide => stage.append(slide));

  // IDs remain stable for existing public links; position is calculated separately.
  const order = [1,'lesson-setup',2,3,'lesson-cells',9,10,11,12,16,4,5,'lesson-references',8,13,14,42,43,'lesson-summary','lesson-errors',44,28,29,30,31,32,33,34,35,'lesson-lookup-check','lesson-tools','lesson-validation','lesson-charts','lesson-pivot','lesson-capstone',6,7,15,17,18,19,20,21,22,23,24,25,26,27,'lesson-tables-check',36,37,38,39,'lesson-query-check',51,52,53,54,55,56,40,41,'lesson-regex-check',45,46,47,'lesson-functional-check',48,49,50,'lesson-advanced-capstone','lesson-answers',57,58];
  order.forEach(id => stage.append(document.getElementById(typeof id === 'number' ? `slide-${id}` : id)));

  document.querySelectorAll('[data-copy-formula]').forEach(button => {
    button.addEventListener('click', () => window.copyFormula(button, button.dataset.copyFormula));
  });
  const select = document.getElementById('practice-task');
  function renderAnswer() {
    const task = tasks.find(item => item.id === select.value);
    const [solution, explanation] = answers[task.id];
    const range = solution.match(/(?:HR_Roster|Sales_Data|Regex_Data)![A-Z]+\d+(?::[A-Z]+\d+)?/g) || [];
    document.getElementById('practice-answer').innerHTML = `<h3>${escapeHtml(task.id)} · พิมพ์ที่ Assignments!${task.cell}</h3><p>${escapeHtml(task.task)}</p>${reveal('คำใบ้: ดูข้อมูลช่วงไหน?', `<code>${escapeHtml([...new Set(range)].join(' · '))}</code>`)}${reveal('เปิดสูตรเฉลยและเหตุผล', `${formula(solution)}<p>${escapeHtml(explanation)}</p><p>ผลที่ควรได้: <strong>${escapeHtml(task.expected)}</strong></p>`)}`;
    document.querySelector('#practice-answer [data-copy-formula]').addEventListener('click', event => window.copyFormula(event.currentTarget, solution));
  }
  select.addEventListener('change', renderAnswer);
  renderAnswer();
  document.getElementById('total-check').addEventListener('submit', event => {
    event.preventDefault();
    const value = document.getElementById('classroom-total').value.trim().replaceAll(',', '');
    document.getElementById('total-feedback').textContent = value && Number(value) === 396
      ? 'ถูกต้อง: 200 + 50 + 56 + 90 = 396 บาท ลองอธิบายว่าทำไมต้องคูณจำนวนกับราคาก่อนรวม'
      : 'ลองตรวจ E2:E5 อีกครั้ง: คำนวณจำนวน × ราคาต่อหน่วยให้ครบทั้ง 4 รายการ แล้วรวมยอด';
  });
}
