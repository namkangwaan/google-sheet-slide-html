import { CURRICULUM, TRACKS } from '../curriculum.js';
import tasks from '../practice-tasks.json';

const el = (tag, className, text) => {
  const node = document.createElement(tag);
  if (className) node.className = className;
  if (text != null) node.textContent = text;
  return node;
};

function renderTracks() {
  const container = document.getElementById('tracks');
  let number = 0;
  for (const [key, track] of Object.entries(TRACKS)) {
    const lessons = CURRICULUM.filter(lesson => lesson.track === key);
    if (!lessons.length) continue;
    const group = el('section', 'track');
    group.setAttribute('aria-label', track.title);
    const head = el('div', 'track-head');
    head.append(el('h3', 'track-title', track.title), el('p', 'track-note', track.note));
    const list = el('ul', 'lesson-grid');
    for (const lesson of lessons) {
      number += 1;
      const item = el('li');
      const link = el('a', 'lesson-card');
      link.href = `./slides.html#${lesson.id}`;
      // Deck labels carry a prefix ("1 · …", "ต่อยอด · …") that the track heading already gives.
      const title = lesson.label.replace(/^(\d+|ต่อยอด)\s·\s/, '');
      link.append(
        el('span', 'lesson-no', String(number).padStart(2, '0')),
        el('span', 'lesson-title', title),
        el('span', 'lesson-summary', lesson.summary),
        el('span', 'lesson-go', 'เปิดสไลด์ →'),
      );
      item.append(link);
      list.append(item);
    }
    group.append(head, list);
    container.append(group);
  }
}

function renderStats() {
  document.querySelector('[data-stat="topics"]').textContent = String(CURRICULUM.length);
  document.querySelector('[data-stat="tasks"]').textContent = String(tasks.length);
}

// The poster is a light static image; the WebGL trailer loads only after a click.
function setupTrailer() {
  const card = document.getElementById('video-card');
  const button = document.getElementById('play-trailer');
  button.addEventListener('click', () => {
    const frame = document.createElement('iframe');
    frame.src = './video.html?embed=1&autoplay=1';
    frame.title = 'วิดีโอแนะนำคอร์ส Google Sheets';
    frame.allow = 'autoplay; fullscreen';
    card.classList.add('is-playing');
    button.replaceWith(frame);
    frame.focus();
  }, { once: true });
}

// Same rule as the inline script in index.html, for hash changes without a reload
// (e.g. someone pastes an old deck link while this page is open).
const HERO_ANCHORS = ['main', 'lessons', 'slides', 'how'];
window.addEventListener('hashchange', () => {
  const id = decodeURIComponent(window.location.hash.slice(1));
  if (id && !HERO_ANCHORS.includes(id)) window.location.replace(`./slides.html${window.location.hash}`);
});

renderStats();
renderTracks();
setupTrailer();
