import { createRenderer } from './renderer.js';
import { createLayer } from './layer.js';

const canvas = document.getElementById('screen');
const gl = canvas.getContext('webgl2', { antialias: false, alpha: false, preserveDrawingBuffer: false });
if (!gl) {
  document.getElementById('fallback').hidden = false;
} else {
  const renderer = createRenderer(gl);
  const layer = createLayer();
  const frame = (now) => {
    const w = Math.min(1920, Math.round(canvas.clientWidth * devicePixelRatio));
    const h = Math.round(w * 9 / 16);
    if (canvas.width !== w) {
      canvas.width = w;
      canvas.height = h;
      renderer.resize(w, h);
      layer.resize(w, h);
    }
    layer.begin();
    const t = now / 1000;
    renderer.render({ time: t, bgTime: t, canvasA: layer.canvas, canvasB: null, mix: 0, accent: [0.063, 0.725, 0.506], fade: 1, reduced: false });
    requestAnimationFrame(frame);
  };
  requestAnimationFrame(frame);
}
