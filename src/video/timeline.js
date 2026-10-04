// Pure time math shared by the player, renderer and audio. Every frame is a
// function of t alone, which is what makes seeking and recording exact.

export const TRANSITION = 0.8;

export function buildTimeline(specs) {
  const starts = [];
  let total = 0;
  for (const spec of specs) {
    starts.push(total);
    total += spec.duration;
  }
  return { total, starts, durations: specs.map(spec => spec.duration) };
}

// Returns the outgoing scene as `index`. During the TRANSITION window centred on a
// boundary, `next` describes the incoming scene and its blend amount (0 → 1).
// Scene-local times can run slightly past a scene's duration or below zero inside
// that window, so scene drawing code clamps them.
export function locate(timeline, t, fade = TRANSITION) {
  const { starts, durations, total } = timeline;
  const time = Math.min(Math.max(t, 0), total);
  const half = fade / 2;
  let index = starts.length - 1;
  while (index > 0 && starts[index] > time) index -= 1;

  const blend = (from) => {
    const boundary = starts[from + 1];
    return {
      index: from,
      local: time - starts[from],
      next: { index: from + 1, local: time - boundary, mix: (time - (boundary - half)) / fade },
    };
  };

  if (index + 1 < starts.length && time >= starts[index + 1] - half) return blend(index);
  if (index > 0 && time < starts[index] + half) return blend(index - 1);
  return { index, local: Math.min(time - starts[index], durations[index]), next: null };
}
