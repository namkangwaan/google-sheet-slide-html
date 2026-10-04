# Hero Page: Design and Plan

วันที่: 2026-10-04 · สถานะ: ผู้ใช้อนุมัติดีไซน์ในแชตแล้ว และให้ merge เข้า `main` แล้ว push

## เป้าหมาย

เมื่อเปิดเว็บ ผู้ชมต้องเห็นทันทีว่าคอร์สนี้สอนอะไร ดูวิดีโอแนะนำได้ และเปิดสไลด์ดูบนหน้าเว็บได้

ความสำเร็จ:
- หน้า root (`./`) เป็นหน้า Hero และ deck อยู่ที่ `slides.html`
- ลิงก์เก่าที่มี hash (`./#lesson-setup`, `./#12`) ไปถึงสไลด์เดิม
- Hero โหลดภาพปกวิดีโอแบบนิ่ง และเริ่มโหลด WebGL เมื่อผู้ชมกดเล่นเท่านั้น
- รายการบทเรียนบน Hero และสารบัญใน deck ใช้ข้อมูลชุดเดียวกัน
- `pnpm check:video`, `pnpm check:practice`, `pnpm build` ผ่าน, จอ 375px ไม่มี scroll แนวนอน

## ดีไซน์

| ส่วน | รายละเอียด |
|------|-----------|
| แถบนำทาง | โลโก้, บทเรียน (`#lessons`), ดูสไลด์ (`#slides`), วิดีโอ (`./video.html`), ดาวน์โหลดแบบฝึก |
| Hero | หัวข้อ คำโปรย ปุ่ม "เริ่มเรียนจากสไลด์" (`./slides.html#lesson-setup`) และ "ดาวน์โหลดไฟล์แบบฝึก" ตัวเลขสรุป; การ์ดวิดีโอเป็นภาพปก `public/trailer-poster.jpg` + ปุ่มเล่น กดแล้วแทนด้วย iframe `./video.html?embed=1&autoplay=1` |
| บทเรียน | การ์ดจาก `src/curriculum.js` แบ่ง "พื้นฐาน" และ "ต่อยอด" แต่ละใบลิงก์ `./slides.html#<id>` |
| ดูสไลด์ | iframe `./slides.html#slide-1` อัตราส่วน 16:9 `loading="lazy"` + ปุ่มเปิดเต็มหน้าจอ |
| วิธีเรียน | 3 ขั้น: ดาวน์โหลดไฟล์ → เปิดสไลด์คู่กับชีต → ตรวจด้วย Self_Check |
| Footer | สัญญาอนุญาต CC BY-NC-SA 4.0, ลิงก์ GitHub |

### การเปลี่ยนแปลงโครงสร้าง

- `git mv index.html slides.html`; `index.html` ใหม่เป็น Hero
- `index.html` มีสคริปต์ inline ใน `<head>`: ถ้ามี hash ให้ `location.replace('./slides.html' + hash)` ก่อนวาดหน้า
- `src/curriculum.js`: `CURRICULUM = [{ id, label, track, summary }]` ใช้ทั้ง `lessons.js` (สารบัญ slide-3) และ `src/hero/main.js`
- `video.html?embed=1`: ซ่อนขอบและคีย์ลัดด้านล่าง ให้ stage เต็มกรอบ; `autoplay=1` เริ่มเล่นทันที
- `begin()` ใน `src/video/main.js` ไม่รอเสียงเกิน 600ms: ถ้าเบราว์เซอร์ยังไม่ให้เปิดเสียง ภาพต้องเล่นต่อได้
- `vite.config.js` เพิ่ม entry `slides`; `tailwind.config.js` สแกน `slides.html`
- อัปเดต `CLAUDE.md`, `AGENTS.md`, `README.md` ที่อ้างว่า deck อยู่ใน `index.html`

## แผนลงมือ

1. ย้าย deck + redirect + vite/tailwind config → `pnpm build` ผ่าน, `dist/slides.html` มี
2. `src/curriculum.js` + ใช้ใน `lessons.js` → สารบัญ deck ยังแสดง 16 รายการเหมือนเดิม
3. video embed/autoplay + แก้ `begin()` ไม่ให้ค้างเมื่อเสียงถูกบล็อก
4. ภาพปก `public/trailer-poster.jpg` (จับจากเฟรมจริง 1280×720)
5. หน้า Hero (`index.html`, `src/hero/main.js`, `src/hero/hero.css`)
6. ตรวจ: checks + build, Chrome desktop/375px, redirect, iframe วิดีโอเล่น, iframe สไลด์เลื่อนได้
7. อัปเดตเอกสาร, commit, `git push origin HEAD:main` (fast-forward)
