# WebGL Video Presentation Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** หน้า `video.html` เล่น trailer คอร์สความยาว 180 วินาทีด้วย WebGL2 มีดนตรีสังเคราะห์และคำบรรยายไทย และอัดออกเป็น `.webm` ได้

**Architecture:** เวลาเป็นตัวกำหนดทุกอย่าง: `timeline.locate(t)` บอกว่าฉากไหน เวลาภายในฉาก และสัดส่วน transition จากนั้นฉากวาดลง Canvas2D 1920×1080
(layer A/B) แล้วอัปโหลดเป็น texture ให้ renderer ประกอบกับพื้นหลัง shader, dissolve, bloom และ grain ส่วนเสียงตั้งเวลาโน้ตจาก `t` เดียวกัน

**Tech Stack:** Vite 5 (multi-page), WebGL2 + GLSL ES 3.00, Canvas2D, Web Audio, MediaRecorder, exceljs (ใช้เฉพาะสคริปต์ตรวจ)

**Spec:** `docs/superpowers/specs/2026-10-04-webgl-video-design.md`

## Global Constraints

- ไม่เพิ่ม runtime dependency
- ลิงก์และ asset เป็น relative (`./video.html`) เพราะเว็บอยู่ใต้ subpath ของ GitHub Pages
- ข้อความ UI และคำบรรยายเป็นภาษาไทย ชื่อฟังก์ชันคงภาษาอังกฤษ
- ตัวเลขในฉากต้องตรงกับไฟล์แบบฝึก (ตรวจด้วย `pnpm check:video`)
- ไม่แตะ `lessons.js`, `main.js`, ลำดับสไลด์ และ pipeline แบบฝึก
- ห้ามกลืน error: shader compile ล้มเหลวต้อง throw พร้อม log
- 2-space indent, single quotes, ไม่มี `console.log` หลงเหลือ

## Review Focus

1. Seek ไปกลาง transition หรือขณะหยุด: ภาพต้องเป็นเฟรมเดียวกับตอนเล่นผ่านจุดนั้น ทดสอบ `locate()` ที่ขอบฉากใน `check:video`
2. `t` < 0 หรือ ≥ total (seek สุดแถบ, เล่นจนจบ): clamp ไม่ error ทดสอบใน `check:video`
3. สลับแท็บระหว่างอัด: rAF หยุด หากไม่จัดการ วิดีโอจะกระโดด ต้อง pause ทั้ง timeline และ recorder แล้วอัดต่อเมื่อกลับมา (ตรวจด้วยมือใน Task 6)
4. เบราว์เซอร์ไม่รองรับ MediaRecorder หรือ WebGL2: ปุ่ม disabled / ข้อความ fallback ภาษาไทย (Task 2, 6)
5. จอแคบ 375px และการ resize ระหว่างเล่น: canvas และ framebuffer ปรับขนาด ไม่มี scroll แนวนอน (Task 4)

---

### Task 1: ข้อมูลฉาก + timeline + สคริปต์ตรวจ

**Files:**
- Create: `src/video/data.js`, `src/video/timeline.js`, `scripts/verify-video.mjs`
- Modify: `package.json` (script `check:video`), `.github/workflows/deploy-pages.yml` (รัน `check:video` ก่อน build)

**Interfaces:**
- Produces: `CLASSROOM`, `SALES`, `CONTACTS`, `SCENE_SPECS` (`[{ id, duration, accent: [r,g,b], caption, label }]`), ค่าที่คำนวณ (`amounts`, `byCategory`, `filterIds`, `queryTotals`)
- Produces: `buildTimeline(specs) → { total, starts, durations }`, `locate(tl, t, fade = 0.8) → { index, local, next: null | { index, local, mix } }`, `TRANSITION = 0.8`

- [ ] เขียน `scripts/verify-video.mjs`: อ่าน xlsx ด้วย exceljs เทียบ Classroom!A2:D5, Sales_Data!A5:F11, Regex_Data ตามแถวที่ใช้; ตรวจค่าที่คำนวณ (250/146/396, TX-1001+TX-1005, Electronics 505000 / Office Supplies 88000, SD-07 = Office Supplies, RG-04 = yahoo.com, RG-08) กับ `practice-tasks.json`; ตรวจ timeline (total 180, locate ที่ 0, total, ขอบฉาก ±0.4, ค่าติดลบ)
- [ ] รัน `node scripts/verify-video.mjs` ต้อง FAIL (ยังไม่มีโมดูล)
- [ ] เขียน `data.js` และ `timeline.js`
- [ ] รัน `pnpm check:video` ต้อง PASS
- [ ] Commit `feat: add video scene data, timeline and verifier`

### Task 2: หน้า video.html + GL helpers + renderer

**Files:**
- Create: `video.html`, `src/video/video.css`, `src/video/gl.js`, `src/video/renderer.js`, `src/video/layer.js`, `src/video/main.js`
- Modify: `vite.config.js` (multi-page input)

**Interfaces:**
- `gl.js`: `createProgram(gl, vs, fs)`, `createTarget(gl, w, h)`, `resizeTarget(gl, target, w, h)`, `createLayerTexture(gl)`, `uploadCanvas(gl, tex, canvas)`, `drawTriangle(gl)`
- `layer.js`: `createLayer() → { canvas, ctx }` (1920×1080), `W = 1920`, `H = 1080`
- `renderer.js`: `createRenderer(gl) → { resize(w, h), render({ time, layerA, layerB, mix, accent, fade, reduced }), dispose() }`

- [ ] เขียนหน้าและ renderer: พื้นหลังกริดเซลล์ perspective + ตัวเลข 7-segment, dissolve noise + lens warp, bloom ครึ่งความละเอียด, composite (vignette, grain, aberration, fade)
- [ ] ไม่มี WebGL2 → แสดง `#fallback`; context lost/restored → หยุดและสร้าง renderer ใหม่
- [ ] `pnpm build` ผ่าน และ `dist/video.html` มีอยู่; เปิด `/video.html` ใน dev เห็นพื้นหลัง console ไม่มี error
- [ ] Commit `feat: add WebGL2 renderer for video page`

### Task 3: ฉากทั้ง 11 ฉาก

**Files:**
- Create: `src/video/draw.js` (primitive Canvas2D: text, panel, sheet, formula bar, chip, easing), `src/video/scenes.js`

**Interfaces:**
- `scenes.js`: `SCENES = [{ ...spec, draw(ctx, lt) }]` เรียงตาม `SCENE_SPECS`
- `draw.js`: `seg(t, a, b)`, `easeOut`, `easeInOut`, `easeBack`, `text(ctx, str, x, y, opts)`, `panel(ctx, x, y, w, h, opts)`, `sheet(ctx, opts) → { cell(r, c) → {x,y,w,h} }`, `formulaBar(ctx, x, y, w, ref, formula, p)`, `chip(ctx, str, x, y, opts)`, `fmt(n)`

- [ ] เขียนฉากตาม spec ใช้ค่าจาก `data.js` เท่านั้น
- [ ] seek ไปกลางทุกฉากใน dev แล้ว screenshot ตรวจตัวอักษรไทยและตัวเลข
- [ ] Commit `feat: add trailer scenes`

### Task 4: Player, แถบควบคุม, คำบรรยาย, ลิงก์จาก deck

**Files:**
- Create: `src/video/player.js`
- Modify: `src/video/main.js`, `video.html`, `src/video/video.css`, `index.html` (ลิงก์ในแถบบน)

**Interfaces:**
- `createPlayer({ total, onFrame, onState }) → { play(), pause(), toggle(), seek(t), time, playing }`

- [ ] เล่น/หยุด, seek พร้อมขีดฉาก, เวลา, คำบรรยาย DOM, เต็มจอ, คีย์ลัด (Space/K, ←/→, J/L, C, M, F, Home), ซ่อนแถบอัตโนมัติ, หยุดเมื่อแท็บถูกซ่อน
- [ ] ตรวจ 375px ไม่มี scroll แนวนอน, ลิงก์ `./video.html` ใน deck ใช้งานได้
- [ ] Commit `feat: add video player controls and deck link`

### Task 5: ดนตรีสังเคราะห์

**Files:**
- Create: `src/video/audio.js`
- Modify: `src/video/main.js`

**Interfaces:**
- `createAudio(timeline) → { ensure(), start(t), stop(), setMuted(b), recordStream() → MediaStream }`

- [ ] pad + bass + arp + reverb/delay + whoosh ที่ขอบฉาก ตั้งเวลาด้วย scheduler; seek/pause fade ไม่มีเสียงคลิก; mute แยกจาก track ที่อัด
- [ ] ตรวจด้วย dev: AudioContext running หลังกดเล่น ไม่มี error
- [ ] Commit `feat: add synthesized soundtrack`

### Task 6: การอัดวิดีโอ

**Files:**
- Create: `src/video/recorder.js`
- Modify: `src/video/main.js`, `video.html`

**Interfaces:**
- `pickMimeType() → string | ''`, `createRecording({ canvas, audioStream, onDone }) → { start(), pause(), resume(), stop(discard) }`

- [ ] ยืนยันก่อนอัด, buffer 1920×1080, คำบรรยายวาดลงภาพ, Esc ยกเลิก, สลับแท็บ = pause/resume, ดาวน์โหลด `google-sheets-trailer.webm`
- [ ] อัดช่วงสั้นในเบราว์เซอร์ทดสอบ แล้วตรวจว่า Blob > 0 และเล่นได้
- [ ] Commit `feat: record trailer to video file`

### Task 7: ตรวจรวมและบันทึกผล

- [ ] `pnpm check:video && pnpm check:practice && pnpm build`
- [ ] บันทึกผลใน `docs/teaching-improvement-plan.md`
- [ ] Commit `docs: record video page verification`
