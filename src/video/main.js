import { createRenderer } from './renderer.js';
import { createRenderer2D } from './renderer2d.js';
import { createLayer, W, H } from './layer.js';
import { buildTimeline, locate } from './timeline.js';
import { SCENES } from './scenes.js';
import { createPlayer } from './player.js';
import { createAudio } from './audio.js';
import { pickMimeType, extensionFor, createRecording } from './recorder.js';
import * as d from './draw.js';

const $ = id => document.getElementById(id);
const root = $('player');
const stage = $('stage');
let canvas = $('screen');
const captionEl = $('caption');
const startButton = $('start');
const seekInput = $('seek');
const timeEl = $('time');
const sceneLabel = $('scene-label');
const recordButton = $('btn-record');
const recBadge = $('rec-badge');
const recText = $('rec-text');
const unmuteButton = $('unmute');
const params = new URLSearchParams(window.location.search);
const embedded = params.get('embed') === '1';
// ?renderer=2d forces the Canvas2D fallback, to check what browsers without WebGL2 see.
const force2D = params.get('renderer') === '2d';
if (embedded) {
  root.classList.add('embed');
  // Inside the hero iframe, links must replace the whole page, not the frame.
  document.querySelectorAll('a').forEach(link => link.setAttribute('target', '_top'));
}

const timeline = buildTimeline(SCENES);
const player = createPlayer(timeline.total);
const audio = createAudio(timeline);
const layers = [createLayer(), createLayer()];
const reducedQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
const mimeType = pickMimeType();
// Poster frame shown before the first play: the intro title is fully on screen here.
const POSTER_TIME = 3.4;

let gl = null;
let renderer = null;
let started = false;
let captionsOn = true;
let muted = false;
let recording = null;
let dirty = true;
let lastSize = '';
let lastTimeLabel = '';
let lastScene = -1;
let hideTimer = 0;

function showFallback(message) {
  if (message) $('fallback-text').textContent = message;
  $('fallback').hidden = false;
  startButton.hidden = true;
}

function onContextLost(event) {
  event.preventDefault();
  player.pause();
  renderer = null;
  showFallback('การ์ดจอหยุดทำงานชั่วคราว กำลังกู้คืน…');
}

function onContextRestored() {
  $('fallback').hidden = true;
  startButton.hidden = false;
  try {
    renderer = createRenderer(gl);
    lastSize = '';
    dirty = true;
  } catch (error) {
    console.error(error);
    showFallback('กู้คืนกราฟิกไม่สำเร็จ ลองรีเฟรชหน้า');
  }
}

function bindCanvas() {
  canvas.addEventListener('webglcontextlost', onContextLost);
  canvas.addEventListener('webglcontextrestored', onContextRestored);
  canvas.addEventListener('click', () => {
    if (started) togglePlay();
  });
}

// WebGL2 when available; otherwise the Canvas2D renderer keeps every scene,
// caption and the recorder working, just without shader effects.
function initRenderer() {
  gl = force2D ? null : canvas.getContext('webgl2', { antialias: false, alpha: false, premultipliedAlpha: false, preserveDrawingBuffer: false });
  if (gl) {
    try {
      renderer = createRenderer(gl);
      root.dataset.renderer = 'webgl2';
    } catch (error) {
      console.error('WebGL2 renderer failed; falling back to Canvas2D.', error);
      // A canvas keeps its first context type, so the fallback needs a fresh element.
      const fresh = canvas.cloneNode(false);
      canvas.replaceWith(fresh);
      canvas = fresh;
      bindCanvas();
      gl = null;
      renderer = null;
    }
  }
  if (!renderer) {
    const ctx = canvas.getContext('2d');
    if (!ctx) {
      showFallback('เบราว์เซอร์นี้วาดภาพบน canvas ไม่ได้ ลองเปิดด้วย Chrome, Edge, Firefox หรือ Safari รุ่นล่าสุด');
      return false;
    }
    renderer = createRenderer2D(ctx);
    root.dataset.renderer = 'canvas2d';
  }
  lastSize = '';
  dirty = true;
  return true;
}

bindCanvas();

// Normal playback renders at screen resolution; recording always uses 1920×1080.
function renderSize() {
  if (recording) return [W, H];
  const width = Math.max(320, Math.min(W, Math.round(canvas.clientWidth * Math.min(window.devicePixelRatio || 1, 2))));
  return [width, Math.round(width * 9 / 16)];
}

function syncSize() {
  const [w, h] = renderSize();
  const key = `${w}x${h}`;
  if (key === lastSize) return;
  lastSize = key;
  canvas.width = w;
  canvas.height = h;
  renderer.resize(w, h);
  layers.forEach(layer => layer.resize(w, h));
  dirty = true;
}

function drawCaption(ctx, caption) {
  const size = 34;
  const width = d.measure(ctx, caption, size, 500) + 64;
  d.panel(ctx, 960 - width / 2, 968, width, 64, { r: 12, fill: 'rgba(2, 6, 23, 0.78)', stroke: null });
  d.text(ctx, caption, 960, 1002, { size, align: 'center', baseline: 'middle' });
}

function drawScene(layer, index, local) {
  const scene = SCENES[index];
  const { ctx } = layer;
  layer.begin();
  // Slow camera push gives every scene some life even while nothing moves.
  const push = 1 + 0.025 * d.clamp(local / scene.duration);
  ctx.save();
  ctx.translate(W / 2, H / 2);
  ctx.scale(push, push);
  ctx.translate(-W / 2, -H / 2);
  scene.draw(ctx, Math.max(0, local), scene);
  ctx.restore();
  if (recording) drawCaption(ctx, scene.caption);
}

function renderFrame(t) {
  syncSize();
  const at = locate(timeline, t);
  drawScene(layers[0], at.index, at.local);
  let accent = SCENES[at.index].accent;
  if (at.next) {
    drawScene(layers[1], at.next.index, at.next.local);
    const target = SCENES[at.next.index].accent;
    accent = accent.map((v, i) => d.lerp(v, target[i], d.clamp(at.next.mix)));
  }
  const fade = Math.min(d.seg(t, 0, 1.2), 1 - d.seg(t, timeline.total - 2.5, timeline.total));
  const reduced = reducedQuery.matches;
  renderer.render({
    time: t,
    bgTime: reduced ? 0 : t,
    canvasA: layers[0].canvas,
    canvasB: at.next ? layers[1].canvas : null,
    mix: at.next ? at.next.mix : 0,
    accent,
    fade: started ? fade : 0.55,
    reduced,
  });
  return at;
}

const formatTime = (t) => {
  const s = Math.floor(t);
  return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`;
};

function updateUI(t, at) {
  const label = `${formatTime(t)} / ${formatTime(timeline.total)}`;
  if (label !== lastTimeLabel) {
    timeEl.textContent = label;
    lastTimeLabel = label;
  }
  if (document.activeElement !== seekInput) seekInput.value = String(t);
  const shown = at.next && at.next.mix >= 0.5 ? at.next.index : at.index;
  if (shown !== lastScene) {
    lastScene = shown;
    const scene = SCENES[shown];
    sceneLabel.textContent = `${String(shown + 1).padStart(2, '0')} · ${scene.label}`;
    captionEl.textContent = scene.caption;
  }
}

function loop() {
  const t = player.tick();
  if (renderer && (player.playing || dirty)) {
    const at = renderFrame(started ? t : POSTER_TIME);
    updateUI(t, at);
    dirty = false;
  }
  requestAnimationFrame(loop);
}

// ── Controls ─────────────────────────────────────────────────────────────

function showControls() {
  root.classList.add('controls-on');
  clearTimeout(hideTimer);
  if (player.playing) hideTimer = setTimeout(() => root.classList.remove('controls-on'), 2500);
}

function sceneStep(direction) {
  const at = locate(timeline, player.time);
  const current = at.next && at.next.mix >= 0.5 ? at.next.index : at.index;
  const local = player.time - timeline.starts[current];
  // "Previous" first rewinds to the start of the current scene, like a media player.
  let target = current + direction;
  if (direction < 0 && local > 1.5) target = current;
  target = Math.min(SCENES.length - 1, Math.max(0, target));
  player.seek(timeline.starts[target] + (target === 0 ? 0 : 0.4));
}

// Browsers may hold audio until a direct tap (e.g. autoplay inside the hero iframe).
// Never let that block the picture: wait briefly, then play and offer an unmute button.
async function begin() {
  if (!started) {
    started = true;
    root.classList.add('started');
    player.seek(0);
  }
  const unlocked = audio.ensure().catch(error => console.warn('Audio could not start.', error));
  await Promise.race([unlocked, new Promise(resolve => setTimeout(resolve, 600))]);
  audio.setMuted(muted);
  player.play();
  unmuteButton.hidden = audio.running || !audio.available;
}

async function unlockAudio() {
  await audio.ensure();
  audio.setMuted(muted);
  if (player.playing) audio.start(player.time);
  unmuteButton.hidden = audio.running || !audio.available;
}

function togglePlay() {
  // Pausing mid-recording would freeze the file while MediaRecorder keeps writing.
  if (recording) return;
  if (!started || !player.playing) begin().catch(error => console.error(error));
  else player.pause();
}

player.on((type) => {
  dirty = true;
  root.classList.toggle('playing', player.playing);
  $('btn-play').setAttribute('aria-label', player.playing ? 'หยุด (Space)' : 'เล่น (Space)');
  if (type === 'play') audio.start(player.time);
  if (type === 'pause') audio.stop();
  if (type === 'seek' && player.playing) audio.start(player.time);
  if (type === 'ended') {
    audio.stop();
    if (recording) finishRecording(false);
  }
  showControls();
});

startButton.addEventListener('click', () => begin().catch(error => console.error(error)));
$('btn-play').addEventListener('click', togglePlay);
$('btn-prev').addEventListener('click', () => sceneStep(-1));
$('btn-next').addEventListener('click', () => sceneStep(1));
seekInput.max = String(timeline.total);
seekInput.addEventListener('input', () => {
  if (!started) {
    started = true;
    root.classList.add('started');
  }
  player.seek(Number(seekInput.value));
});

function setCaptions(on) {
  captionsOn = on;
  root.classList.toggle('cc-off', !on);
  $('btn-cc').setAttribute('aria-pressed', String(on));
}
function setMuted(on) {
  muted = on;
  root.classList.toggle('muted', on);
  $('btn-mute').setAttribute('aria-pressed', String(on));
  $('btn-mute').setAttribute('aria-label', on ? 'เปิดเสียง' : 'ปิดเสียง');
  audio.setMuted(on);
}
// Safari < 16.4 only has the webkit-prefixed API, and iPhone Safari has none for
// non-video elements, so the button hides when fullscreen is unavailable.
const fullscreenElement = () => document.fullscreenElement || document.webkitFullscreenElement || null;
const canFullscreen = Boolean(document.fullscreenEnabled || document.webkitFullscreenEnabled);
if (!canFullscreen) $('btn-full').hidden = true;
if (!audio.available) $('btn-mute').hidden = true;

function toggleFullscreen() {
  if (!canFullscreen) return;
  if (fullscreenElement()) {
    (document.exitFullscreen || document.webkitExitFullscreen).call(document);
    return;
  }
  const request = stage.requestFullscreen || stage.webkitRequestFullscreen;
  const result = request.call(stage);
  if (result && typeof result.catch === 'function') result.catch(error => console.error(error));
}
$('btn-cc').addEventListener('click', () => setCaptions(!captionsOn));
$('btn-mute').addEventListener('click', () => setMuted(!muted));
$('btn-full').addEventListener('click', toggleFullscreen);
['fullscreenchange', 'webkitfullscreenchange'].forEach(type => document.addEventListener(type, () => {
  dirty = true;
}));

const ticks = $('ticks');
timeline.starts.slice(1).forEach((start) => {
  const tick = document.createElement('span');
  tick.style.left = `${(start / timeline.total) * 100}%`;
  ticks.append(tick);
});

stage.addEventListener('pointermove', showControls);
stage.addEventListener('pointerdown', showControls);
unmuteButton.addEventListener('click', (event) => {
  event.stopPropagation();
  unlockAudio().catch(error => console.warn('Audio could not start.', error));
});
document.addEventListener('keydown', (event) => {
  if (event.ctrlKey || event.metaKey || event.altKey) return;
  if (recording) {
    if (event.key === 'Escape') finishRecording(true);
    return;
  }
  const actions = {
    ' ': togglePlay,
    k: togglePlay,
    ArrowLeft: () => sceneStep(-1),
    ArrowRight: () => sceneStep(1),
    j: () => player.seek(player.time - 5),
    l: () => player.seek(player.time + 5),
    c: () => setCaptions(!captionsOn),
    m: () => setMuted(!muted),
    f: toggleFullscreen,
    Home: () => player.seek(0),
  };
  const action = actions[event.key.length === 1 ? event.key.toLowerCase() : event.key];
  if (!action) return;
  // Buttons would also fire on Space/Enter; handle it once here.
  event.preventDefault();
  if (!started && action !== togglePlay) {
    started = true;
    root.classList.add('started');
  }
  action();
  showControls();
});

// ── Recording ────────────────────────────────────────────────────────────

if (!mimeType) {
  recordButton.disabled = true;
  recordButton.title = 'เบราว์เซอร์นี้อัดวิดีโอจาก canvas ไม่ได้ ลองใช้ Chrome, Edge หรือ Firefox';
}

async function startRecording() {
  const ok = window.confirm('จะเล่นวิดีโอตั้งแต่ต้นจนจบ (ประมาณ 3 นาที) แล้วดาวน์โหลดเป็นไฟล์\nระหว่างอัด อย่าสลับแท็บหรือย่อหน้าต่าง');
  if (!ok) return;
  started = true;
  root.classList.add('started');
  await audio.ensure();
  audio.setMuted(muted);
  player.pause();
  recording = { session: null, paused: false };
  syncSize();
  player.seek(0);
  renderFrame(0);
  recording.session = createRecording({ canvas, audioStream: audio.recordStream(), mimeType });
  recording.session.start();
  root.classList.add('recording');
  recBadge.hidden = false;
  recText.textContent = 'กำลังอัด';
  player.play();
}

async function finishRecording(cancelled) {
  const current = recording;
  if (!current) return;
  recording = null;
  player.pause();
  root.classList.remove('recording');
  recBadge.hidden = true;
  dirty = true;
  try {
    const blob = await current.session.stop();
    if (cancelled) return;
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `google-sheets-trailer.${extensionFor(mimeType)}`;
    document.body.append(link);
    link.click();
    link.remove();
    setTimeout(() => URL.revokeObjectURL(url), 60_000);
  } catch (error) {
    console.error(error);
    window.alert('บันทึกไฟล์วิดีโอไม่สำเร็จ ลองอัดใหม่อีกครั้ง');
  }
}

recordButton.addEventListener('click', () => {
  startRecording().catch((error) => {
    console.error(error);
    recording = null;
    root.classList.remove('recording');
    recBadge.hidden = true;
    window.alert('เริ่มอัดวิดีโอไม่ได้ ลองใหม่อีกครั้ง');
  });
});

// rAF stops in background tabs, so pause everything together and resume on return.
document.addEventListener('visibilitychange', () => {
  if (document.hidden) {
    if (recording && player.playing) {
      recording.paused = true;
      player.pause();
      recording.session.pause();
      recText.textContent = 'หยุดชั่วคราว กลับมาที่แท็บนี้เพื่ออัดต่อ';
    } else {
      player.pause();
    }
  } else if (recording?.paused) {
    recording.paused = false;
    recording.session.resume();
    recText.textContent = 'กำลังอัด';
    player.play();
  }
});

window.addEventListener('resize', () => {
  dirty = true;
});
reducedQuery.addEventListener('change', () => {
  dirty = true;
});

// ── Boot ─────────────────────────────────────────────────────────────────

// Canvas text does not trigger webfont loads, so request every face we draw with.
async function loadFonts() {
  const faces = ['400 40px "Noto Sans Thai"', '500 40px "Noto Sans Thai"', '700 40px "Noto Sans Thai"', '800 40px "Noto Sans Thai"',
    '500 40px "JetBrains Mono"', '700 40px "JetBrains Mono"'];
  const timeout = new Promise(resolve => setTimeout(() => resolve('timeout'), 4000));
  const result = await Promise.race([Promise.all(faces.map(face => document.fonts.load(face, 'กข Ab1'))), timeout]);
  if (result === 'timeout') console.warn('Fonts did not load within 4s; using fallback fonts.');
}

if (initRenderer()) {
  setCaptions(true);
  root.classList.add('controls-on');
  loadFonts()
    .catch(error => console.warn('Font loading failed; using fallback fonts.', error))
    .finally(() => {
      startButton.disabled = false;
      $('start-label').textContent = 'เล่นวิดีโอ (3 นาที)';
      dirty = true;
      requestAnimationFrame(loop);
      if (params.get('autoplay') === '1') begin().catch(error => console.error(error));
    });
}
