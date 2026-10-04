// Fallback for browsers without WebGL2 (older Safari/iOS, blocklisted GPUs).
// Same interface as createRenderer() in renderer.js, so the player, captions and
// recording work unchanged; it only drops the shader effects (bloom, grain, dissolve).

const rgb = (accent, a) => `rgba(${accent.map(v => Math.round(v * 255)).join(', ')}, ${a})`;

export function createRenderer2D(ctx) {
  let width = 2;
  let height = 2;

  // Perspective spreadsheet floor drawn with plain lines, echoing the WebGL background.
  function background(t, accent) {
    const sky = ctx.createLinearGradient(0, 0, 0, height);
    sky.addColorStop(0, '#04102a');
    sky.addColorStop(1, '#010411');
    ctx.fillStyle = sky;
    ctx.fillRect(0, 0, width, height);

    const horizon = height * 0.36;
    const glow = ctx.createLinearGradient(0, horizon - height * 0.06, 0, horizon + height * 0.06);
    glow.addColorStop(0, rgb(accent, 0));
    glow.addColorStop(0.5, rgb(accent, 0.22));
    glow.addColorStop(1, rgb(accent, 0));
    ctx.fillStyle = glow;
    ctx.fillRect(0, horizon - height * 0.06, width, height * 0.12);

    ctx.save();
    ctx.strokeStyle = rgb(accent, 0.28);
    ctx.lineWidth = Math.max(1, width / 1400);
    ctx.beginPath();
    // Rows recede toward the horizon; the offset scrolls them toward the viewer.
    const scroll = (t * 0.5) % 1;
    for (let i = 0; i < 26; i += 1) {
      const z = i + 1 - scroll;
      const y = horizon + (height - horizon) * (1.2 / z);
      if (y > height) continue;
      ctx.moveTo(0, y);
      ctx.lineTo(width, y);
    }
    // Columns fan out from a vanishing point that drifts slightly.
    const vx = width / 2 + Math.sin(t * 0.05) * width * 0.05;
    for (let i = -14; i <= 14; i += 1) {
      ctx.moveTo(vx, horizon);
      ctx.lineTo(vx + i * width * 0.16, height);
    }
    ctx.stroke();
    ctx.restore();

    const vignette = ctx.createRadialGradient(width / 2, height / 2, height * 0.3, width / 2, height / 2, height * 0.95);
    vignette.addColorStop(0, 'rgba(0, 0, 0, 0)');
    vignette.addColorStop(1, 'rgba(0, 0, 0, 0.55)');
    ctx.fillStyle = vignette;
    ctx.fillRect(0, 0, width, height);
  }

  return {
    resize(w, h) {
      width = w;
      height = h;
    },
    // frame: { time, bgTime, canvasA, canvasB, mix, accent, fade, reduced }
    render(frame) {
      ctx.setTransform(1, 0, 0, 1, 0, 0);
      ctx.globalAlpha = 1;
      background(frame.bgTime, frame.accent);
      const mix = frame.canvasB ? Math.min(1, Math.max(0, frame.mix)) : 0;
      ctx.globalAlpha = 1 - mix;
      ctx.drawImage(frame.canvasA, 0, 0, width, height);
      if (frame.canvasB) {
        ctx.globalAlpha = mix;
        ctx.drawImage(frame.canvasB, 0, 0, width, height);
      }
      ctx.globalAlpha = 1;
      if (frame.fade < 1) {
        ctx.fillStyle = `rgba(0, 0, 0, ${1 - frame.fade})`;
        ctx.fillRect(0, 0, width, height);
      }
    },
  };
}
