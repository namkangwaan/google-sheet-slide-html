import './style.css';
import { initializeLessons } from './lessons.js';

initializeLessons();
const slides = [...document.querySelectorAll('.slide-page')];

const DESIGN_WIDTH = 1280;
const DESIGN_HEIGHT = 720;
const SWIPE_THRESHOLD_PX = 50;
const SWIPE_EDGE_PX = 24;
const SWIPE_DIRECTION_RATIO = 1.5;
const SWIPE_MAX_DURATION_MS = 800;
const SWIPE_AXIS_LOCK_PX = 10;
const PAGE_DRAG_COMMIT_RATIO = 0.4;
const PAGE_SNAP_BACK_MS = 250;
const SWIPE_HINT_IDLE_MS = 5000;

let currentSlide = 1;
const totalSlides = slides.length;
const stage = document.getElementById('stage-container');
const viewport = document.getElementById('presentation-viewport');

const FULLSCREEN_UI = {
  active: {
    html: '<i class="fa-solid fa-compress"></i> <span>Exit Full (F)</span>',
    bgClass: 'bg-emerald-700'
  },
  inactive: {
    html: '<i class="fa-solid fa-expand"></i> <span>Full (F)</span>',
    bgClass: 'bg-emerald-700'
  }
};

function getNativeFullscreenElement() {
  return document.fullscreenElement ||
         document.webkitFullscreenElement ||
         document.mozFullScreenElement ||
         document.msFullscreenElement ||
         null;
}

function isFullscreenOrTheaterActive() {
  return !!getNativeFullscreenElement() ||
         document.body.classList.contains('theater-mode') ||
         document.body.classList.contains('fullscreen-mode');
}

function resizeStage() {
  if (window.matchMedia('(max-width: 800px)').matches) {
    stage.style.transform = 'none';
    return;
  }
  const isFullscreen = isFullscreenOrTheaterActive();
  const padding = isFullscreen ? 0 : 32;

  const availableWidth = Math.max(viewport.clientWidth - padding, 320);
  const availableHeight = Math.max(viewport.clientHeight - padding, 180);

  const scale = Math.min(availableWidth / DESIGN_WIDTH, availableHeight / DESIGN_HEIGHT);
  stage.style.transform = `translate(-50%, -50%) scale(${scale})`;
  
  if (isFullscreen) {
    const isFullBleed = (scale * DESIGN_WIDTH >= window.innerWidth) && (scale * DESIGN_HEIGHT >= window.innerHeight);
    stage.style.borderRadius = isFullBleed ? '0px' : '8px';
  } else {
    stage.style.borderRadius = '14px';
  }
}

function toggleTheaterMode() {
  document.body.classList.toggle('theater-mode');
  resizeStage();
}

function getSlideFromHash() {
  const hash = window.location.hash.slice(1);
  const id = /^\d+$/.test(hash) ? `slide-${hash}` : hash;
  const index = slides.findIndex(slide => slide.id === id);
  return index < 0 ? 1 : index + 1;
}

window.addEventListener('resize', resizeStage);
window.addEventListener('DOMContentLoaded', () => {
  resizeStage();
  buildGridOverview();
  slides.forEach((slide, index) => {
    slide.querySelectorAll('.slide-counter-badge').forEach(badge => {
      badge.textContent = `${index + 1} / ${totalSlides}`;
    });
  });
  document.querySelectorAll('[data-deck-count]').forEach(el => { el.textContent = `${totalSlides} หน้า`; });
  document.getElementById('btn-grid').title = `ดูครบ ${totalSlides} หน้า (G)`;
  document.querySelectorAll('#overview-modal h2, #help-modal span').forEach(el => {
    if (/58 Slides/.test(el.textContent)) el.textContent = `${totalSlides} หน้า · สารบัญทั้งหมด`;
  });
  const initialSlide = getSlideFromHash();
  showSlide(initialSlide);
});

window.addEventListener('hashchange', () => {
  const targetSlide = getSlideFromHash();
  if (targetSlide !== currentSlide) {
    showSlide(targetSlide);
  }
});

function triggerSlideAnimations(slideEl) {
  const autoAnimateSelectors = [
    { sel: '.eyebrow', anim: 'animate-blur-in' },
    { sel: '.slide-title', anim: 'animate-slide-up-fade' },
    { sel: '.slide-sub', anim: 'animate-fade-in' },
    { sel: '.bg-slate-50', anim: 'animate-scale-in' },
    { sel: '.code-pill, code', anim: 'animate-fade-in' },
    { sel: 'img', anim: 'animate-scale-in' }
  ];

  let staggerCounter = 1;

  autoAnimateSelectors.forEach(({ sel, anim }) => {
    const targetElements = slideEl.querySelectorAll(sel);
    targetElements.forEach(el => {
      if (!el.classList.contains('animate-on-show')) {
        el.classList.add('animate-on-show');
        el.dataset.animation = anim;
        el.classList.add(`stagger-${Math.min(staggerCounter, 7)}`);
        staggerCounter++;
      }
    });
  });

  const animatedElements = slideEl.querySelectorAll('.animate-on-show');
  animatedElements.forEach(el => {
    const animationClass = el.dataset.animation || 'animate-fade-in';
    el.classList.remove(animationClass);
    void el.offsetWidth; // trigger reflow
    el.classList.add(animationClass);
  });
}

function updateSlideVisibility(activeSlideIndex) {
  document.querySelectorAll('.slide-page').forEach((slide, idx) => {
    const isActive = (idx + 1 === activeSlideIndex);
    slide.classList.toggle('active', isActive);
    if (isActive) {
      triggerSlideAnimations(slide);
    }
  });
}

function updateSlideIndicators(activeSlideIndex, total) {
  const activeSlideEl = slides[activeSlideIndex - 1];
  const slideTitle = activeSlideEl?.getAttribute('data-title') || `Slide ${activeSlideIndex}`;
  
  const slideIndicatorEl = document.getElementById('slide-indicator');
  if (slideIndicatorEl) slideIndicatorEl.textContent = `Slide ${activeSlideIndex} of ${total}`;
  
  const floatingIndicatorEl = document.getElementById('floating-indicator');
  if (floatingIndicatorEl) floatingIndicatorEl.textContent = `${activeSlideIndex} / ${total}`;
  
  const slideTitleEl = document.getElementById('slide-title-indicator');
  if (slideTitleEl) slideTitleEl.textContent = slideTitle;
  
  const progressBarEl = document.getElementById('progress-bar');
  if (progressBarEl) progressBarEl.style.width = `${(activeSlideIndex / total) * 100}%`;
}

function updateNavigationControls(activeSlideIndex, total) {
  const prevButtonEl = document.getElementById('btn-prev');
  if (prevButtonEl) prevButtonEl.disabled = (activeSlideIndex === 1);
  
  const nextButtonEl = document.getElementById('btn-next');
  if (nextButtonEl) nextButtonEl.disabled = (activeSlideIndex === total);
}

function updateGridSelection(activeSlideIndex) {
  document.querySelectorAll('.grid-thumb').forEach((thumb, idx) => {
    const isActive = (idx + 1 === activeSlideIndex);
    thumb.classList.toggle('ring-2', isActive);
    thumb.classList.toggle('ring-emerald-500', isActive);
    thumb.classList.toggle('bg-slate-800', isActive);
  });
}

let hasShownSlide = false;

// หน้าจอ e-ink (update: slow) และผู้ที่ขอลดการเคลื่อนไหว ให้เปลี่ยนหน้าแบบทันทีเหมือนพลิกกระดาษ
function prefersStillPages() {
  return window.matchMedia('(update: slow), (prefers-reduced-motion: reduce)').matches;
}

function playPageTurn(slideEl, direction) {
  slideEl.classList.remove('page-turn-next', 'page-turn-prev');
  if (!direction || prefersStillPages()) return;
  void slideEl.offsetWidth; // restart the animation when turning quickly
  slideEl.classList.add(`page-turn-${direction}`);
}

// เอาคลาสออกเมื่อพลิกเสร็จ ไม่งั้น animation จะทับ transform ตอนลากหน้าเดิมอีกครั้ง
slides.forEach(slide => slide.addEventListener('animationend', (e) => {
  if (e.target === slide) slide.classList.remove('page-turn-next', 'page-turn-prev');
}));

let swipeHintIdleTimer = null;

// ไอคอน « » จางหายเมื่อไม่มีการแตะสักพัก เพื่อไม่บังเนื้อหาขณะอ่าน และกลับมาเมื่อแตะ/เลื่อน/เปลี่ยนหน้า
function wakeSwipeHints() {
  document.body.classList.remove('swipe-hints-idle');
  clearTimeout(swipeHintIdleTimer);
  swipeHintIdleTimer = setTimeout(() => document.body.classList.add('swipe-hints-idle'), SWIPE_HINT_IDLE_MS);
}

['touchstart', 'pointerdown'].forEach(type => document.addEventListener(type, wakeSwipeHints, { passive: true }));
// capture เพราะ scroll ไม่ bubble และบางขนาดจอเลื่อนที่ตัวสไลด์ ไม่ใช่ viewport
document.addEventListener('scroll', wakeSwipeHints, { passive: true, capture: true });

function updateSwipeHint(activeSlideIndex, total) {
  wakeSwipeHints();
  const nextHint = document.getElementById('swipe-hint');
  if (nextHint) nextHint.hidden = (activeSlideIndex === total);
  const prevHint = document.getElementById('swipe-hint-prev');
  if (prevHint) prevHint.hidden = (activeSlideIndex === 1);
}

function showSlide(index) {
  const targetIndex = Math.min(Math.max(Number(index) || 1, 1), totalSlides);
  const direction = !hasShownSlide || targetIndex === currentSlide ? null : (targetIndex > currentSlide ? 'next' : 'prev');
  hasShownSlide = true;
  currentSlide = targetIndex;

  updateSlideVisibility(currentSlide);
  updateSlideIndicators(currentSlide, totalSlides);
  updateNavigationControls(currentSlide, totalSlides);
  updateGridSelection(currentSlide);
  updateSwipeHint(currentSlide, totalSlides);

  const activeSlide = slides[currentSlide - 1];
  playPageTurn(activeSlide, direction);
  activeSlide.scrollTop = 0;
  viewport.scrollTop = 0;
  if (window.location.hash !== `#${activeSlide.id}`) {
    history.replaceState(null, '', `#${activeSlide.id}`);
  }
}

function nextSlide() {
  // หน้าสุดท้ายไม่วนกลับเอง ผู้เรียนต้องกด H เพื่อกลับหน้าแรก
  if (currentSlide === totalSlides) {
    const isTouch = window.matchMedia('(pointer: coarse)').matches;
    showToast(isTouch ? 'หน้าสุดท้ายแล้ว — แตะ "กลับหน้าแรก" ในหน้านี้' : 'หน้าสุดท้ายแล้ว — กด H เพื่อกลับหน้าแรก');
    return;
  }
  showSlide(currentSlide + 1);
}

function prevSlide() {
  showSlide(currentSlide - 1);
}

function closeAnyOpenModalOrMode() {
  const openModal = document.querySelector('.modal.open, #help-modal.open, #overview-modal.open');
  if (openModal) {
    openModal.classList.remove('open');
    return;
  }
  if (document.body.classList.contains('fullscreen-mode')) {
    toggleFullScreen();
  } else if (document.body.classList.contains('theater-mode')) {
    toggleTheaterMode();
  }
}

document.addEventListener('keydown', (e) => {
  const target = e.target instanceof Element ? e.target : document.body;
  if (target.closest('input, textarea, select, [contenteditable="true"]')) return;
  if (e.key === 'Escape') {
    closeAnyOpenModalOrMode();
    return;
  }
  if (document.querySelector('#help-modal.open, #overview-modal.open')) return;
  if (e.key === ' ' && target.closest('button, a, summary')) return;
  const navActions = {
    ArrowRight: nextSlide,
    PageDown: nextSlide,
    ' ': nextSlide,
    ArrowLeft: prevSlide,
    PageUp: prevSlide,
    Home: () => showSlide(1),
    End: () => showSlide(totalSlides)
  };

  if (navActions[e.key]) {
    e.preventDefault();
    navActions[e.key]();
    return;
  }

  switch (e.key.toLowerCase()) {
    case 'f':
      e.preventDefault();
      toggleFullScreen();
      break;
    case 't':
      toggleTheaterMode();
      break;
    case 'g':
      toggleOverview();
      break;
    case 'h':
      showSlide(1);
      break;
    case 'l':
      showSlide(totalSlides);
      break;
    case '?':
      e.preventDefault();
      toggleHelpModal();
      break;
    case 'escape':
      closeAnyOpenModalOrMode();
      break;
  }
});

let swipeStart = null;

// ขอบจอซ้าย/ขวาเป็นท่าย้อนกลับของ iOS Safari และ Android จึงไม่นับเป็นการเลื่อนสไลด์
function isInEdgeZone(x) {
  return x < SWIPE_EDGE_PX || x > window.innerWidth - SWIPE_EDGE_PX;
}

// ตารางบนมือถือเลื่อนแนวนอนได้ ต้องปล่อยให้ผู้เรียนเลื่อนตารางแทนการเปลี่ยนสไลด์
function isInHorizontalScroller(el) {
  for (let node = el; node && node !== document.body; node = node.parentElement) {
    const overflowX = getComputedStyle(node).overflowX;
    if ((overflowX === 'auto' || overflowX === 'scroll') && node.scrollWidth > node.clientWidth) return true;
  }
  return false;
}

document.addEventListener('touchstart', (e) => {
  swipeStart = null;
  if (e.touches.length > 1) return;
  const target = e.target instanceof Element ? e.target : document.body;
  if (target.closest('input, textarea, select, .swipe-hint, .modal, #overview-modal, #help-modal')) return;
  if (isInHorizontalScroller(target)) return;
  const touch = e.touches[0];
  if (isInEdgeZone(touch.clientX)) return;
  swipeStart = { x: touch.clientX, y: touch.clientY, time: Date.now(), axis: null, slide: slides[currentSlide - 1] };
}, { passive: true });

function isZoomedIn() {
  return !!window.visualViewport && window.visualViewport.scale > 1.05;
}

// หน้ากระดาษเลื่อนตามนิ้วเหมือนอ่าน ebook; ที่หน้าแรก/หน้าสุดท้ายให้หนืดเพื่อบอกว่าไปต่อไม่ได้
function dragPage(slideEl, deltaX) {
  const atBound = (deltaX > 0 && currentSlide === 1) || (deltaX < 0 && currentSlide === totalSlides);
  // บนแท็บเล็ต stage ถูกย่อด้วย transform: scale จึงต้องแปลงระยะนิ้วเป็นพิกัดของสไลด์
  const stageScale = stage.getBoundingClientRect().width / stage.offsetWidth || 1;
  const offset = (atBound ? deltaX * 0.2 : deltaX) / stageScale;
  slideEl.classList.remove('page-turn-next', 'page-turn-prev');
  slideEl.style.transition = 'none';
  slideEl.style.transform = `translateX(${offset}px)`;
  slideEl.style.boxShadow = `${deltaX < 0 ? 18 : -18}px 0 30px rgba(15, 23, 42, 0.18)`;
}

function releasePage(slideEl, animateBack) {
  if (!slideEl.style.transform) return;
  const reset = () => { slideEl.style.transition = ''; slideEl.style.transform = ''; slideEl.style.boxShadow = ''; };
  if (animateBack && !prefersStillPages()) {
    slideEl.style.transition = `transform ${PAGE_SNAP_BACK_MS}ms ease-out`;
    slideEl.style.transform = 'translateX(0)';
    setTimeout(reset, PAGE_SNAP_BACK_MS);
  } else {
    reset();
  }
}

document.addEventListener('touchmove', (e) => {
  if (!swipeStart) return;
  if (e.touches.length > 1 || isZoomedIn()) {
    releasePage(swipeStart.slide, false);
    swipeStart = null;
    return;
  }
  const touch = e.touches[0];
  const deltaX = touch.clientX - swipeStart.x;
  const deltaY = touch.clientY - swipeStart.y;
  if (!swipeStart.axis && Math.max(Math.abs(deltaX), Math.abs(deltaY)) > SWIPE_AXIS_LOCK_PX) {
    swipeStart.axis = Math.abs(deltaX) > Math.abs(deltaY) * SWIPE_DIRECTION_RATIO ? 'x' : 'y';
  }
  if (swipeStart.axis !== 'x') return;
  // ล็อกแนวนอนแล้ว กันหน้าเลื่อนขึ้นลงระหว่างพลิกหน้า
  if (e.cancelable) e.preventDefault();
  if (!prefersStillPages()) dragPage(swipeStart.slide, deltaX);
}, { passive: false });

document.addEventListener('touchcancel', () => {
  if (swipeStart) releasePage(swipeStart.slide, true);
  swipeStart = null;
}, { passive: true });

document.addEventListener('touchend', (e) => {
  if (!swipeStart) return;
  const { slide, axis } = swipeStart;
  const touch = e.changedTouches[0];
  const deltaX = touch.clientX - swipeStart.x;
  const deltaY = touch.clientY - swipeStart.y;
  const elapsed = Date.now() - swipeStart.time;
  swipeStart = null;

  const isHorizontal = axis === 'x' || (axis === null && Math.abs(deltaX) >= Math.abs(deltaY) * SWIPE_DIRECTION_RATIO);
  const isFlick = Math.abs(deltaX) >= SWIPE_THRESHOLD_PX && elapsed <= SWIPE_MAX_DURATION_MS;
  const isLongDrag = Math.abs(deltaX) >= window.innerWidth * PAGE_DRAG_COMMIT_RATIO;
  const blocked = isZoomedIn() || String(window.getSelection() || '').length > 0;
  const canMove = deltaX < 0 ? currentSlide < totalSlides : currentSlide > 1;

  if (!isHorizontal || blocked || !(isFlick || isLongDrag) || !canMove) {
    releasePage(slide, true);
    if (isHorizontal && !blocked && (isFlick || isLongDrag) && deltaX < 0) nextSlide(); // แจ้งว่าเป็นหน้าสุดท้าย
    return;
  }

  releasePage(slide, false);
  if (deltaX < 0) {
    nextSlide();
  } else {
    prevSlide();
  }
}, { passive: true });

async function toggleFullScreen() {
  const docEl = document.documentElement;
  const isNativeFullscreen = !!getNativeFullscreenElement();
  const isCustomFullscreen = document.body.classList.contains('fullscreen-mode');

  if (isNativeFullscreen || isCustomFullscreen) {
    if (document.exitFullscreen) {
      try { await document.exitFullscreen(); } catch (err) {}
    } else if (document.webkitExitFullscreen) {
      try { await document.webkitExitFullscreen(); } catch (err) {}
    } else if (document.mozCancelFullScreen) {
      try { await document.mozCancelFullScreen(); } catch (err) {}
    } else if (document.msExitFullscreen) {
      try { await document.msExitFullscreen(); } catch (err) {}
    }
    document.body.classList.remove('fullscreen-mode');
    updateFullscreenUI(false);
  } else {
    try {
      if (docEl.requestFullscreen) {
        await docEl.requestFullscreen();
      } else if (docEl.webkitRequestFullscreen) {
        await docEl.webkitRequestFullscreen();
      } else if (docEl.mozRequestFullScreen) {
        await docEl.mozRequestFullScreen();
      } else if (docEl.msRequestFullscreen) {
        await docEl.msRequestFullscreen();
      }
    } catch (err) {}

    document.body.classList.add('fullscreen-mode');
    updateFullscreenUI(true);
  }

  setTimeout(resizeStage, 50);
  setTimeout(resizeStage, 250);
}

function updateFullscreenUI(isFullscreen) {
  const btn = document.getElementById('btn-fullscreen');
  const uiState = isFullscreen ? FULLSCREEN_UI.active : FULLSCREEN_UI.inactive;
  
  if (btn) {
    btn.innerHTML = uiState.html;
    if (isFullscreen) {
      btn.classList.add(uiState.bgClass, 'text-white');
    } else {
      btn.classList.remove(uiState.bgClass, 'text-white');
    }
  }
  
  const floatingBtn = document.getElementById('floating-exit-fs');
  if (floatingBtn) {
    floatingBtn.innerHTML = uiState.html;
  }
}

['fullscreenchange', 'webkitfullscreenchange', 'mozfullscreenchange', 'MSFullscreenChange'].forEach(evt => {
  document.addEventListener(evt, () => {
    const isNativeFullscreen = !!getNativeFullscreenElement();
    const isCustomFullscreen = document.body.classList.contains('fullscreen-mode');
    
    if (!isNativeFullscreen && isCustomFullscreen) {
      updateFullscreenUI(false);
      document.body.classList.remove('fullscreen-mode');
    } else if (isNativeFullscreen && !isCustomFullscreen) {
      document.body.classList.add('fullscreen-mode');
      updateFullscreenUI(true);
    }
    resizeStage();
  });
});

function toggleOverview() {
  const modal = document.getElementById('overview-modal');
  if(modal) modal.classList.toggle('open');
}

function buildGridOverview() {
  const container = document.getElementById('grid-thumbnails');
  if(!container) return;
  container.innerHTML = '';

  for (let i = 1; i <= totalSlides; i++) {
    const slide = slides[i - 1];
    const title = slide ? slide.getAttribute('data-title') : `Slide ${i}`;
    
    const card = document.createElement('button');
    card.type = 'button';
    card.className = 'grid-thumb bg-slate-900/90 border border-slate-700/80 hover:border-emerald-500 rounded-xl p-2.5 cursor-pointer transition flex flex-col justify-between h-20';
    card.onclick = () => {
      showSlide(i);
      toggleOverview();
    };

    const formattedIndex = i < 10 ? '0' + i : i;
    card.innerHTML = `
      <div class="flex justify-between items-start">
        <span class="font-mono text-[10px] font-bold text-emerald-400">#${formattedIndex}</span>
        <i class="fa-solid fa-arrow-up-right-from-square text-slate-500 text-[9px]"></i>
      </div>
      <p class="text-[11px] font-bold text-slate-200 line-clamp-1">${title}</p>
      <div class="h-1 w-full bg-slate-800 rounded-full overflow-hidden">
        <div class="h-full bg-emerald-500" style="width: ${(i / totalSlides) * 100}%"></div>
      </div>
    `;
    container.appendChild(card);
  }
}

function toggleHelpModal() {
  const modal = document.getElementById('help-modal');
  if (modal) modal.classList.toggle('open');
}

async function copyFormula(button, text) {
  let copied = false;
  if (navigator.clipboard && window.isSecureContext) {
    try {
      await navigator.clipboard.writeText(text);
      copied = true;
    } catch (err) {
      // Permission denied or an old WebView: try the textarea method before giving up.
      console.warn('Clipboard API failed, using fallback copy:', err);
    }
  }
  if (!copied) copied = fallbackCopy(text);

  if (!copied) {
    showToast('คัดลอกอัตโนมัติไม่ได้ เลือกสูตรให้แล้ว กดค้างแล้วเลือก "คัดลอก"');
    selectFormulaText(button, text);
    return;
  }
  showToast(`คัดลอกแล้ว: ${text}`);

  if (button.dataset.copyOriginal === undefined) button.dataset.copyOriginal = button.innerHTML;
  button.innerHTML = '<i class="fa-solid fa-check"></i> คัดลอกแล้ว';
  button.classList.add('copied');
  clearTimeout(Number(button.dataset.copyTimer));
  button.dataset.copyTimer = String(setTimeout(() => {
    button.innerHTML = button.dataset.copyOriginal;
    delete button.dataset.copyOriginal;
    button.classList.remove('copied');
  }, 2000));
}

// execCommand fallback for http:// (non-secure) pages and older mobile browsers. Returns whether it worked.
function fallbackCopy(text) {
  const tempArea = document.createElement('textarea');
  tempArea.value = text;
  // readonly + 16px: iOS would otherwise open the keyboard and zoom the page on focus.
  tempArea.setAttribute('readonly', '');
  tempArea.style.cssText = 'position:fixed;top:0;left:0;width:1px;height:1px;opacity:0;font-size:16px;';
  document.body.appendChild(tempArea);
  let copied = false;
  try {
    tempArea.focus();
    tempArea.select();
    tempArea.setSelectionRange(0, text.length); // iOS Safari ignores select() on its own
    copied = document.execCommand('copy');
  } catch (err) {
    console.warn('Fallback copy failed:', err);
  }
  document.body.removeChild(tempArea);
  return copied;
}

// Last resort: select the formula shown next to the button so the learner can copy it manually.
// Formula markup varies (code, .code-pill, coloured spans), so match on the text rather than on class names.
function selectFormulaText(button, text) {
  const normalize = value => value.replace(/\s+/g, '');
  const target = normalize(text);
  let match = null;
  for (let node = button.parentElement, depth = 0; node && !match && depth < 4; node = node.parentElement, depth++) {
    match = [node, ...node.querySelectorAll('*')].find(el => !el.contains(button) && normalize(el.textContent) === target)
      // The container itself may hold the formula as its own text alongside the (icon-only) button.
      || (normalize(node.textContent) === target ? node : null);
  }
  if (!match) return;
  const range = document.createRange();
  range.selectNodeContents(match);
  const selection = window.getSelection();
  selection.removeAllRanges();
  selection.addRange(range);
}

function showToast(message) {
  const toast = document.getElementById('toast');
  const msgEl = document.getElementById('toast-message');
  if(!toast || !msgEl) return;
  msgEl.textContent = message;
  toast.classList.add('show');

  setTimeout(() => {
    toast.classList.remove('show');
  }, 2400);
}

// Legacy inline links refer to stable slide IDs, not their reordered position.
window.showSlide = (id) => {
  const index = slides.findIndex(slide => slide.id === `slide-${id}`);
  if (index >= 0) showSlide(index + 1);
};
window.toggleTheaterMode = toggleTheaterMode;
window.toggleFullScreen = toggleFullScreen;
window.toggleOverview = toggleOverview;
window.toggleHelpModal = toggleHelpModal;
window.nextSlide = nextSlide;
window.prevSlide = prevSlide;
window.copyFormula = copyFormula;

document.addEventListener('DOMContentLoaded', () => {
  document.getElementById('btn-help')?.addEventListener('click', toggleHelpModal);
  document.getElementById('btn-theater')?.addEventListener('click', toggleTheaterMode);
  document.getElementById('btn-grid')?.addEventListener('click', toggleOverview);
  document.getElementById('btn-fullscreen')?.addEventListener('click', toggleFullScreen);
  document.getElementById('floating-exit-fs')?.addEventListener('click', toggleFullScreen);

  // Setup Modal Close on Click Outside
  window.addEventListener("click", (e) => {
    const modal = document.getElementById('overview-modal');
    if (e.target === modal) {
      toggleOverview();
    }
  });

  // VLOOKUP Gamification Quiz Logic
  const vlookupInput = document.getElementById('vlookup-quiz-input');
  const vlookupCopyBtn = document.getElementById('vlookup-quiz-copy');
  const vlookupFeedback = document.getElementById('vlookup-quiz-feedback');
  const vlookupContainer = document.getElementById('vlookup-quiz-container');

  if (vlookupInput) {
    vlookupInput.addEventListener('input', function(e) {
      // Normalize string: uppercase, remove all spaces
      const val = e.target.value.toUpperCase().replace(/\s+/g, '');
      const expected = '=VLOOKUP(F2,$A$2:$C$5,2,FALSE)';
      const expected2 = '=VLOOKUP(F2,$A$2:$C$5,2,0)';
      
      if (val === expected || val === expected2) {
        // Success State
        vlookupContainer.classList.remove('bg-slate-900');
        vlookupContainer.classList.add('bg-emerald-950', 'border', 'border-emerald-500');
        vlookupInput.classList.remove('border-slate-700', 'bg-slate-950');
        vlookupInput.classList.add('border-emerald-500', 'bg-emerald-900/50', 'text-emerald-300');
        
        vlookupCopyBtn.classList.remove('opacity-50', 'cursor-not-allowed', 'pointer-events-none');
        vlookupFeedback.classList.remove('opacity-0');
      } else {
        // Default State
        vlookupContainer.classList.add('bg-slate-900');
        vlookupContainer.classList.remove('bg-emerald-950', 'border', 'border-emerald-500');
        vlookupInput.classList.add('border-slate-700', 'bg-slate-950');
        vlookupInput.classList.remove('border-emerald-500', 'bg-emerald-900/50', 'text-emerald-300');
        
        vlookupCopyBtn.classList.add('opacity-50', 'cursor-not-allowed', 'pointer-events-none');
        vlookupFeedback.classList.add('opacity-0');
      }
    });
  }
});

document.addEventListener('click', (e) => {
  const jumpTarget = e.target.closest('[data-slide]');
  if (jumpTarget) {
    window.showSlide(jumpTarget.dataset.slide);
  }
});
