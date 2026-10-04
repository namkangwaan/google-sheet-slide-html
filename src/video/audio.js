// Synthesized ambient soundtrack (Web Audio, no samples). Notes are derived from
// timeline time, so seeking re-schedules from any point and stays in step with the picture.

const BPM = 84;
const BEAT = 60 / BPM;
const BAR = BEAT * 4;
// Am – F – C – G, with roots for the bass.
const PROGRESSION = [
  { root: 45, chord: [57, 60, 64] },
  { root: 41, chord: [57, 60, 65] },
  { root: 48, chord: [55, 60, 64] },
  { root: 43, chord: [55, 59, 62] },
];
const ARP = [0, 1, 2, 3, 2, 1, 2, 3];
// Notes are scheduled slightly ahead so the first one is never late.
const LEAD = 0.18;

// Safari < 14.1 only has the webkit-prefixed constructor.
const AudioContextClass = typeof window === 'undefined' ? null : (window.AudioContext || window.webkitAudioContext || null);

const hz = note => 440 * 2 ** ((note - 69) / 12);
const clamp01 = v => Math.min(1, Math.max(0, v));

function impulse(ctx, seconds) {
  const length = Math.floor(ctx.sampleRate * seconds);
  const buffer = ctx.createBuffer(2, length, ctx.sampleRate);
  for (let channel = 0; channel < 2; channel += 1) {
    const data = buffer.getChannelData(channel);
    for (let i = 0; i < length; i += 1) data[i] = (Math.random() * 2 - 1) * (1 - i / length) ** 2.6;
  }
  return buffer;
}

function noise(ctx) {
  const buffer = ctx.createBuffer(1, ctx.sampleRate, ctx.sampleRate);
  const data = buffer.getChannelData(0);
  for (let i = 0; i < data.length; i += 1) data[i] = Math.random() * 2 - 1;
  return buffer;
}

export function createAudio(timeline) {
  const { total, starts } = timeline;
  let ctx = null;
  let master;
  let speaker;
  let recordDestination;
  let reverbIn;
  let delayIn;
  let noiseBuffer;
  let timer = null;
  let anchor = null;
  let scheduledUntil = 0;
  const live = new Set();

  // Overall dynamics: swell in, full band from bar 2, thin out and fade at the end.
  const level = T => clamp01(T / 3) * (1 - clamp01((T - (total - 6)) / 6));
  const bandOn = T => T >= 2 * BAR && T < total - 9;

  function build() {
    ctx = new AudioContextClass();
    master = ctx.createGain();
    master.gain.value = 0;
    const compressor = ctx.createDynamicsCompressor();
    compressor.threshold.value = -18;
    compressor.ratio.value = 3;
    const out = ctx.createGain();
    out.gain.value = 0.9;
    master.connect(compressor);
    compressor.connect(out);
    speaker = ctx.createGain();
    out.connect(speaker);
    speaker.connect(ctx.destination);
    // The recording tap sits before the mute control, so muting never silences the file.
    // Older WebKit lacks it; recordings then have picture only.
    if (typeof ctx.createMediaStreamDestination === 'function') {
      recordDestination = ctx.createMediaStreamDestination();
      out.connect(recordDestination);
    }

    const convolver = ctx.createConvolver();
    convolver.buffer = impulse(ctx, 2.8);
    reverbIn = ctx.createGain();
    reverbIn.gain.value = 0.4;
    const wet = ctx.createGain();
    wet.gain.value = 0.55;
    reverbIn.connect(convolver);
    convolver.connect(wet);
    wet.connect(master);

    delayIn = ctx.createGain();
    const delay = ctx.createDelay(2);
    delay.delayTime.value = BEAT * 0.75;
    const feedback = ctx.createGain();
    feedback.gain.value = 0.32;
    const tone = ctx.createBiquadFilter();
    tone.type = 'lowpass';
    tone.frequency.value = 2400;
    delayIn.connect(delay);
    delay.connect(tone);
    tone.connect(feedback);
    feedback.connect(delay);
    tone.connect(master);

    noiseBuffer = noise(ctx);
  }

  function track(node, stopAt) {
    live.add(node);
    node.addEventListener('ended', () => live.delete(node));
    node.stop(stopAt);
  }

  function envelope(gain, when, peak, attack, end) {
    gain.gain.setValueAtTime(0, when);
    gain.gain.linearRampToValueAtTime(peak, when + attack);
    gain.gain.exponentialRampToValueAtTime(0.0001, end);
  }

  function pad(chord, when, duration, amount) {
    const filter = ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.value = 700 + 500 * amount;
    filter.Q.value = 0.7;
    const gain = ctx.createGain();
    const end = when + duration + 1.2;
    gain.gain.setValueAtTime(0, when);
    gain.gain.linearRampToValueAtTime(0.04 * amount, when + Math.min(1, duration / 2));
    gain.gain.setValueAtTime(0.04 * amount, when + duration);
    gain.gain.linearRampToValueAtTime(0, end);
    filter.connect(gain);
    gain.connect(master);
    gain.connect(reverbIn);
    for (const note of chord) {
      for (const cents of [-7, 7]) {
        const osc = ctx.createOscillator();
        osc.type = 'sawtooth';
        osc.frequency.value = hz(note);
        osc.detune.value = cents;
        osc.connect(filter);
        osc.start(when);
        track(osc, end);
      }
    }
  }

  function bass(note, when, duration, amount) {
    const osc = ctx.createOscillator();
    osc.type = 'sine';
    osc.frequency.value = hz(note);
    const gain = ctx.createGain();
    envelope(gain, when, 0.2 * amount, 0.012, when + duration);
    osc.connect(gain);
    gain.connect(master);
    osc.start(when);
    track(osc, when + duration + 0.05);
  }

  function pluck(note, when, amount) {
    const osc = ctx.createOscillator();
    osc.type = 'triangle';
    osc.frequency.value = hz(note);
    const gain = ctx.createGain();
    envelope(gain, when, 0.06 * amount, 0.004, when + 0.5);
    osc.connect(gain);
    gain.connect(master);
    gain.connect(delayIn);
    gain.connect(reverbIn);
    osc.start(when);
    track(osc, when + 0.55);
  }

  function bell(note, when, amount) {
    [[1, 0.05], [2.76, 0.014]].forEach(([ratio, peak]) => {
      const osc = ctx.createOscillator();
      osc.type = 'sine';
      osc.frequency.value = hz(note) * ratio;
      const gain = ctx.createGain();
      envelope(gain, when, peak * amount, 0.005, when + 1.8);
      osc.connect(gain);
      gain.connect(master);
      gain.connect(reverbIn);
      osc.start(when);
      track(osc, when + 1.85);
    });
  }

  function whoosh(when, amount) {
    const source = ctx.createBufferSource();
    source.buffer = noiseBuffer;
    const filter = ctx.createBiquadFilter();
    filter.type = 'bandpass';
    filter.Q.value = 1.2;
    filter.frequency.setValueAtTime(400, when);
    filter.frequency.exponentialRampToValueAtTime(2600, when + 0.7);
    const gain = ctx.createGain();
    gain.gain.setValueAtTime(0, when);
    gain.gain.linearRampToValueAtTime(0.11 * amount, when + 0.45);
    gain.gain.linearRampToValueAtTime(0, when + 0.9);
    source.connect(filter);
    filter.connect(gain);
    gain.connect(master);
    gain.connect(reverbIn);
    source.start(when);
    track(source, when + 0.95);
  }

  const toContext = T => anchor.c0 + (T - anchor.t0);
  const harmony = T => PROGRESSION[Math.floor(T / BAR) % PROGRESSION.length];

  function scheduleRange(from, to) {
    for (let k = Math.ceil(from / BAR); k * BAR < to; k += 1) {
      const T = k * BAR;
      if (T >= total) break;
      const { chord } = harmony(T);
      pad(chord, toContext(T), BAR, Math.max(level(T), 0.05));
    }
    for (let i = Math.ceil(from / (BEAT / 2)); i * (BEAT / 2) < to; i += 1) {
      const T = i * (BEAT / 2);
      if (T >= total || !bandOn(T)) continue;
      const { root, chord } = harmony(T);
      const step = i % 8;
      const tones = [...chord, chord[0] + 12];
      const lift = Math.floor(T / BAR) % 2 ? 12 : 0;
      pluck(tones[ARP[step]] + lift, toContext(T), level(T));
      if (step === 0) bass(root, toContext(T), BEAT * 2.2, level(T));
      if (step === 5) bass(root, toContext(T), BEAT * 0.9, level(T) * 0.7);
    }
    starts.forEach((start, index) => {
      if (index === 0) return;
      const swoosh = start - 0.6;
      if (swoosh >= from && swoosh < to) whoosh(toContext(swoosh), 1);
      if (start >= from && start < to) bell(harmony(start).chord[2] + 12, toContext(start), level(start));
    });
  }

  function silence(at) {
    for (const node of live) {
      try {
        node.stop(at);
      } catch (error) {
        // Older WebKit throws InvalidStateError on a second stop(); the node already has
        // its own stop time and master gain is ramping to 0, so it is safe to ignore.
        if (error.name !== 'InvalidStateError') throw error;
      }
    }
    live.clear();
  }

  function tickScheduler() {
    const now = anchor.t0 + (ctx.currentTime - anchor.c0);
    const horizon = Math.min(total, now + 0.6);
    if (horizon > scheduledUntil) {
      scheduleRange(scheduledUntil, horizon);
      scheduledUntil = horizon;
    }
  }

  return {
    // Must run from a user gesture the first time (autoplay policy).
    async ensure() {
      if (!AudioContextClass) return;
      if (!ctx) build();
      if (ctx.state === 'suspended') await ctx.resume();
    },
    start(t) {
      if (!ctx) return;
      clearInterval(timer);
      const now = ctx.currentTime;
      master.gain.cancelScheduledValues(now);
      master.gain.setValueAtTime(master.gain.value, now);
      master.gain.linearRampToValueAtTime(0, now + 0.1);
      silence(now + 0.12);
      master.gain.setValueAtTime(0, now + LEAD - 0.02);
      master.gain.linearRampToValueAtTime(1, now + LEAD + 0.12);
      anchor = { t0: t + LEAD, c0: now + LEAD };
      scheduledUntil = t + LEAD;
      // Re-enter the pad that would already be sounding mid-bar.
      const bar = Math.floor(scheduledUntil / BAR);
      const into = scheduledUntil - bar * BAR;
      if (into > 0.05 && scheduledUntil < total) {
        pad(harmony(scheduledUntil).chord, toContext(scheduledUntil), BAR - into, Math.max(level(scheduledUntil), 0.05));
      }
      tickScheduler();
      timer = setInterval(tickScheduler, 50);
    },
    stop() {
      clearInterval(timer);
      timer = null;
      if (!ctx) return;
      const now = ctx.currentTime;
      master.gain.cancelScheduledValues(now);
      master.gain.setValueAtTime(master.gain.value, now);
      master.gain.linearRampToValueAtTime(0, now + 0.12);
      silence(now + 0.14);
    },
    setMuted(muted) {
      if (ctx) speaker.gain.setTargetAtTime(muted ? 0 : 1, ctx.currentTime, 0.03);
    },
    get available() {
      return Boolean(AudioContextClass);
    },
    get running() {
      return ctx?.state === 'running';
    },
    recordStream() {
      return recordDestination?.stream ?? null;
    },
  };
}
