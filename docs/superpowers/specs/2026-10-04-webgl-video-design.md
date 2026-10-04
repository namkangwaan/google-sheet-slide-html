# WebGL Video Presentation — Design

วันที่: 2026-10-04 · สถานะ: อนุมัติดีไซน์ในแชตแล้ว รอตรวจ spec

## เป้าหมาย

หน้าเว็บ `video.html` ที่เล่นอัตโนมัติเหมือนวิดีโอ ความยาวประมาณ 3 นาที เป็น trailer/ภาพรวมของคอร์ส Google Sheets
ใช้โปรโมตหรือเปิดคลาส ผู้ชมเป็นผู้เรียนไทยมือใหม่ มีปุ่มอัดออกเป็นไฟล์ `.webm` พร้อมเสียง และ deploy ขึ้น GitHub Pages ไปพร้อมเว็บเดิม

ความสำเร็จ:
- เล่นจนจบได้ลื่น (เป้า 60fps บนโน้ตบุ๊กทั่วไป), seek ไปจุดใดก็ได้แล้วภาพตรงกับเวลา
- ตัวอักษรไทยแสดงถูกต้อง (สระ วรรณยุกต์ไม่ลอย/ไม่ทับ)
- ตัวเลขและสูตรทุกตัวตรงกับข้อมูลจริงในไฟล์แบบฝึก
- ปุ่มอัดได้ไฟล์ 1920×1080 ที่เปิดเล่นได้ มีทั้งภาพและเสียงดนตรี
- `pnpm build` ผ่าน และหน้า deck เดิมทำงานเหมือนเดิม

นอกขอบเขต: ไฟล์ MP4, เสียงพากย์ TTS, เนื้อหาสอนครบทุกบท, แก้สไลด์เดิม

## สถาปัตยกรรม

WebGL2 เขียนเอง ไม่เพิ่ม dependency ข้อความทั้งหมดวาดด้วย Canvas2D (ให้เบราว์เซอร์จัด shaping ภาษาไทย) แล้วอัปโหลดเป็น texture
ทุกเฟรมเป็นฟังก์ชันของเวลา `t` อย่างเดียว ไม่มี state สะสม จึง seek และอัดได้แม่นยำ

ไฟล์:

| ไฟล์ | หน้าที่ |
|------|--------|
| `video.html` | entry ที่สองของ Vite: canvas, แถบควบคุม, คำบรรยาย, ข้อความ fallback |
| `vite.config.js` | เพิ่ม `build.rollupOptions.input` ให้มีทั้ง `index.html` และ `video.html` |
| `src/video/main.js` | bootstrap: สร้าง renderer, audio, player, ผูก UI |
| `src/video/gl.js` | ช่วย WebGL2: compile/link shader, full-screen quad, texture, framebuffer |
| `src/video/renderer.js` | pipeline ต่อเฟรม: พื้นหลัง → เลเยอร์ฉาก → transition → bloom → composite (vignette, grain) |
| `src/video/layer.js` | Canvas2D 1920×1080 ที่ฉากวาดลงทุกเฟรม แล้วอัปโหลดเป็น texture เดียว |
| `src/video/scenes.js` | รายการฉาก `{ id, duration, caption, draw(ctx, p, t) }` และข้อมูลที่ใช้ |
| `src/video/ease.js` | easing, `clamp`, `range(p, a, b)` สำหรับจัดจังหวะภายในฉาก |
| `src/video/audio.js` | ดนตรีสังเคราะห์ Web Audio ตั้งเวลาตาม timeline, ต่อเข้า `MediaStreamDestination` ได้ |
| `src/video/player.js` | timeline, play/pause/seek, คีย์บอร์ด, คำบรรยาย, การอัด `MediaRecorder` |
| `src/video/video.css` | สไตล์แถบควบคุมและคำบรรยาย (ไม่ใช้ Tailwind เพื่อไม่ผูกกับ content config) |

### ทำไมใช้ Canvas2D layer เดียวต่อเฟรม

ฉากมีตาราง สูตร ตัวเลขที่นับขึ้น และไฮไลต์ที่เปลี่ยนทุกเฟรม การวาดลง Canvas2D แล้ว `texSubImage2D` หนึ่งครั้งต่อเฟรมง่ายกว่าและพอสำหรับ 1080p
งานที่ GPU ทำได้ดีกว่าให้ shader ทำ: พื้นหลังกริดเซลล์ 3 มิติ, particle, transition, bloom, grain

## ภาพและ shader

- **พื้นหลัง** (`bg` shader): ระนาบกริดเซลล์สเปรดชีตมุมเอียงแบบ perspective เลื่อนช้า ๆ เส้นกริดเรืองแสง emerald (`#10b981`) จางตามระยะ
  มี "ตัวเลขลอย" เป็น particle ที่วาดใน shader ด้วย hash ตามตำแหน่งเซลล์ (ไม่ต้องมี atlas) และ fog สีน้ำเงินเข้ม (`#020617`) ค่าสีเน้นเปลี่ยนตามฉาก (uniform `uAccent`)
- **Transition** ระหว่างฉาก 0.8 วินาที: dissolve ด้วย value noise + ขอบเรืองแสง + บิดเลนส์เล็กน้อย ระหว่าง texture ของฉากเก่าและฉากใหม่
  (ช่วง transition วาดทั้งสองฉากลง layer 2 ชุด)
- **Post-process**: threshold → blur แยกแกน 2 pass ที่ครึ่งความละเอียด → บวกกลับ, vignette, film grain ตาม `t`, chromatic aberration อ่อน ๆ ช่วง transition
- `prefers-reduced-motion`: ปิด grain/aberration, transition เป็น crossfade, พื้นหลังไม่เลื่อน

## ฉาก (รวม ~180 วินาที)

ข้อมูลทั้งหมดมาจากไฟล์แบบฝึกจริง

| # | id | วินาที | เนื้อหา | ข้อมูล |
|---|----|-------|--------|-------|
| 1 | intro | 12 | ชื่อคอร์ส "Google Sheets: เรียนแล้วทำได้จริง" ประกอบตัวจากเซลล์ | — |
| 2 | cells | 16 | ตาราง Classroom ประกอบทีละเซลล์ ชี้ `C2` และ `C2:D5` (8 เซลล์) | สมุด/ดินสอ/น้ำ/ขนม, Qty 10/5/8/6, ราคา 20/10/7/15 |
| 3 | references | 18 | พิมพ์ `=C2*D2` ใน E2 ลากลง สูตรเปลี่ยนเป็น C3*D3… แล้วโชว์ `$H$1` ไม่เลื่อน | Amount 200/50/56/90 รวม 396 |
| 4 | sumif | 16 | `=SUMIF(B2:B5,"เครื่องเขียน",E2:E5)` แถวที่ตรงสว่าง ตัวเลขนับขึ้นถึง 250 | 250 |
| 5 | chart | 14 | กราฟแท่งโตขึ้น เครื่องเขียน 250 vs อาหาร 146 ส่วนต่าง 104 | 250/146 |
| 6 | lookup | 18 | ค้น `TX-1004` ใน Sales_Data ลำแสงวิ่งลงคอลัมน์ A แล้วไปคอลัมน์ 3 ได้ Office Supplies; เทียบ VLOOKUP/XLOOKUP | SD-07 |
| 7 | filter | 18 | `=FILTER(A5:A11, F5:F11>100000)` แถวที่ไม่ผ่านแตกเป็นอนุภาค เหลือ TX-1001, TX-1005 | SD-10 |
| 8 | regex | 18 | ข้อความติดต่อ 3 แถว REGEXEXTRACT โดเมน (`yahoo.com`), REGEXREPLACE ซ่อนเบอร์ `****` | RG-04, RG-08 |
| 9 | lambda | 16 | LET ตั้งชื่อค่า → LAMBDA → MAP ใช้กับทั้งคอลัมน์ (แสดงเป็นแผนผังกล่อง) | สูตรสาธิต |
| 10 | practice | 16 | 30 ข้อ (HR 10 / SD 10 / RG 10) เป็นตารางเซลล์ที่ติ๊กเขียวทีละข้อ คะแนน Self_Check วิ่งถึง 30/30 | practice-tasks.json |
| 11 | outro | 18 | "เปิดสื่อหนึ่งแท็บ ลงมือทำอีกหนึ่งแท็บ" + URL เว็บ + ดาวน์โหลดไฟล์แบบฝึก | — |

`scenes.js` นำเข้า `practice-tasks.json` เพื่อนับจำนวนข้อจริง ไม่ hardcode 30

## เสียง

- ดนตรี ambient 84 BPM สร้างใน Web Audio: pad (sawtooth 3 เสียง + lowpass), เบส sine, arpeggio pluck (triangle + envelope), เสียง "tick" สั้นตอนเซลล์ปรากฏ
- คอร์ดเปลี่ยนตามฉาก (Am–F–C–G วนตามดัชนีฉาก) ตั้งเวลาล่วงหน้าเป็นช่วง ๆ ละ ~1 วินาทีด้วย scheduler
- seek/pause: หยุด node ที่ตั้งไว้แล้วตั้งใหม่จากเวลาใหม่ master gain fade 0.15 วินาทีกันเสียงคลิก
- เปิดเสียงได้หลังผู้ใช้กดเล่นครั้งแรกเท่านั้น (นโยบาย autoplay) ปุ่มปิดเสียงแยก

## Player และการควบคุม

- เวลาเดินด้วย `performance.now()` ระหว่างเล่น ฉากและเวลาภายในฉากคำนวณจาก `t` รวม
- แถบควบคุม: เล่น/หยุด, แถบ seek มีขีดแบ่งฉาก, เวลา `m:ss / m:ss`, ปุ่มคำบรรยาย, ปุ่มเสียง, เต็มจอ, อัดวิดีโอ, ลิงก์กลับบทเรียน
- คีย์บอร์ด: Space/K เล่น/หยุด, ←/→ ฉากก่อน/ถัดไป, J/L ถอย/เดินหน้า 5 วินาที, C คำบรรยาย, M เสียง, F เต็มจอ, Home เริ่มใหม่
- แถบควบคุมซ่อนอัตโนมัติหลัง 2.5 วินาทีที่ไม่ขยับเมาส์ระหว่างเล่น
- คำบรรยายไทยเป็น DOM ด้านล่างสำหรับดูบนเว็บ และวาดลง layer ด้วยระหว่างอัด (ไฟล์วิดีโอจึงมีคำบรรยายฝังอยู่)
- canvas คงอัตราส่วน 16:9 แบบ letterbox ภายใน viewport; render buffer 1920×1080 ตอนอัด ตอนเล่นปกติใช้ขนาดจอ × devicePixelRatio (สูงสุด 1080p)

### การอัด

1. ผู้ใช้กด "อัดวิดีโอ" → ยืนยันว่าจะเล่นตั้งแต่ต้นจนจบ (~3 นาที)
2. ตั้ง render buffer 1920×1080, `canvas.captureStream(60)` รวมกับ audio track จาก `MediaStreamDestination`
3. `MediaRecorder` เลือก mimeType ตัวแรกที่รองรับจาก `video/webm;codecs=vp9,opus` → `vp8,opus` → `video/webm` (Safari: `video/mp4`)
4. เล่นจาก 0 ถึงจบ ระหว่างอัดซ่อนแถบควบคุมและห้าม seek แสดงสถานะ "กำลังอัด" บน DOM (ไม่ลงในภาพ) กด Esc เพื่อยกเลิก
5. จบแล้วรวม Blob ดาวน์โหลดชื่อ `google-sheets-trailer.webm` คืนค่าขนาด buffer เดิม

## ข้อผิดพลาด

- ไม่มี WebGL2 → ข้อความไทย "เบราว์เซอร์นี้ไม่รองรับ WebGL2" พร้อมลิงก์กลับบทเรียน
- ไม่มี `MediaRecorder`/`captureStream` → ปุ่มอัด disabled พร้อม title อธิบายเหตุผล
- WebGL context lost → หยุดเล่น แสดงข้อความ แล้วสร้าง resource ใหม่เมื่อ context restored
- shader compile ล้มเหลว → `throw` พร้อม log ของ shader (ไม่กลืน error) แล้วแสดงข้อความ fallback
- ฟอนต์: รอ `document.fonts.load()` ของ Noto Sans Thai และ JetBrains Mono ก่อนเริ่ม ถ้าโหลดไม่ได้ใช้ฟอนต์ระบบต่อและ log warning

## เชื่อมกับเว็บเดิม

- เพิ่มลิงก์ "ดูวิดีโอแนะนำคอร์ส" ในแถบบนของ `index.html` เป็น `./video.html` (relative ตามกฎ subpath)
- ไม่แตะ `lessons.js`, `main.js`, ลำดับสไลด์ และ pipeline แบบฝึก

## การทดสอบ

ไม่มี test framework ในโปรเจกต์ ใช้:
- `pnpm build` ต้องผ่าน และ `dist/` มีทั้ง `index.html` และ `video.html`
- `pnpm check:practice` ยังผ่าน (ยืนยันว่าไม่กระทบ)
- `pnpm dev` เปิด `/video.html`: ตรวจทุกฉากด้วย seek, console ไม่มี error, ภาพไทยถูกต้อง, คีย์บอร์ดครบ, จอมือถือ 375px ไม่มี scroll แนวนอน
- อัดจริงหนึ่งครั้ง ตรวจว่าได้ไฟล์ ขนาด > 0 และ `<video>` เล่นได้ มีความยาวใกล้ timeline
- ตัวเลขในฉากเทียบกับตาราง "ข้อมูล" ด้านบน
- บันทึกผลลง "บันทึกผล" ใน `docs/teaching-improvement-plan.md`
