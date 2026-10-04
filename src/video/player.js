// Playback clock. Time follows performance.now() while playing, so picture and
// the real-time audio track stay together during recording.

export function createPlayer(total) {
  let time = 0;
  let playing = false;
  let wallStart = 0;
  let timeStart = 0;
  const listeners = new Set();
  const emit = (type) => listeners.forEach(fn => fn(type));
  const clampTime = t => Math.min(total, Math.max(0, t));
  const current = () => (playing ? clampTime(timeStart + (performance.now() - wallStart) / 1000) : time);

  return {
    total,
    get time() {
      return current();
    },
    get playing() {
      return playing;
    },
    on(fn) {
      listeners.add(fn);
      return () => listeners.delete(fn);
    },
    play() {
      if (playing) return;
      if (time >= total) time = 0;
      playing = true;
      wallStart = performance.now();
      timeStart = time;
      emit('play');
    },
    pause() {
      if (!playing) return;
      time = current();
      playing = false;
      emit('pause');
    },
    toggle() {
      if (playing) this.pause();
      else this.play();
    },
    seek(t) {
      time = clampTime(t);
      if (playing) {
        wallStart = performance.now();
        timeStart = time;
      }
      emit('seek');
    },
    // Called once per animation frame; stops the clock at the end.
    tick() {
      if (!playing) return time;
      time = current();
      if (time >= total) {
        time = total;
        playing = false;
        emit('ended');
      }
      return time;
    },
  };
}
