// A Canvas2D surface that scenes draw on in fixed 1920×1080 design units.
// The backing store follows the render size, so normal playback does not pay
// for 1080p uploads; recording switches it to full 1920×1080.

export const W = 1920;
export const H = 1080;

export function createLayer() {
  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d');
  canvas.width = W;
  canvas.height = H;

  return {
    canvas,
    ctx,
    resize(width, height) {
      const w = Math.max(1, Math.round(width));
      const h = Math.max(1, Math.round(height));
      if (canvas.width !== w || canvas.height !== h) {
        canvas.width = w;
        canvas.height = h;
      }
    },
    begin() {
      ctx.setTransform(1, 0, 0, 1, 0, 0);
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.setTransform(canvas.width / W, 0, 0, canvas.height / H, 0, 0);
      ctx.globalAlpha = 1;
      ctx.textBaseline = 'alphabetic';
    },
  };
}
