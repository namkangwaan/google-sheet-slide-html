// Per-frame GPU pipeline:
//   1. scene pass  — spreadsheet-grid background + scene layers + noise dissolve between scenes
//   2. bloom       — bright pass and separable blur at half resolution
//   3. composite   — bloom, chromatic aberration, vignette, film grain, fade to black
import {
  createProgram, createTarget, resizeTarget, createLayerTexture, uploadCanvas,
  bindTarget, bindTexture, drawTriangle,
} from './gl.js';

const COMMON = `#version 300 es
precision highp float;
in vec2 vUv;
out vec4 outColor;
float hash21(vec2 p) {
  p = fract(p * vec2(123.34, 456.21));
  p += dot(p, p + 45.32);
  return fract(p.x * p.y);
}
float noise(vec2 p) {
  vec2 i = floor(p);
  vec2 f = fract(p);
  vec2 u = f * f * (3.0 - 2.0 * f);
  return mix(mix(hash21(i), hash21(i + vec2(1, 0)), u.x), mix(hash21(i + vec2(0, 1)), hash21(i + vec2(1, 1)), u.x), u.y);
}
float fbm(vec2 p) {
  float v = 0.0;
  float a = 0.5;
  for (int i = 0; i < 5; i++) {
    v += a * noise(p);
    p *= 2.03;
    a *= 0.5;
  }
  return v;
}
`;

const SCENE_FS = `${COMMON}
uniform sampler2D uLayerA;
uniform sampler2D uLayerB;
uniform float uHasB;
uniform float uMix;
uniform float uTime;
uniform vec3 uAccent;
uniform vec2 uRes;
uniform float uReduced;

float segment(vec2 p, vec2 a, vec2 b) {
  vec2 pa = p - a;
  vec2 ba = b - a;
  float h = clamp(dot(pa, ba) / dot(ba, ba), 0.0, 1.0);
  return length(pa - ba * h);
}

// Seven-segment digit distance, glyph box is [0,1]^2.
float digit(vec2 uv, int d) {
  int bits[10] = int[10](0x3F, 0x06, 0x5B, 0x4F, 0x66, 0x6D, 0x7D, 0x07, 0x7F, 0x6F);
  int m = bits[d];
  vec2 tl = vec2(0.2, 0.9), tr = vec2(0.8, 0.9), ml = vec2(0.2, 0.5);
  vec2 mr = vec2(0.8, 0.5), bl = vec2(0.2, 0.1), br = vec2(0.8, 0.1);
  float dist = 1e3;
  if ((m & 1) != 0) dist = min(dist, segment(uv, tl, tr));
  if ((m & 2) != 0) dist = min(dist, segment(uv, tr, mr));
  if ((m & 4) != 0) dist = min(dist, segment(uv, mr, br));
  if ((m & 8) != 0) dist = min(dist, segment(uv, bl, br));
  if ((m & 16) != 0) dist = min(dist, segment(uv, ml, bl));
  if ((m & 32) != 0) dist = min(dist, segment(uv, tl, ml));
  if ((m & 64) != 0) dist = min(dist, segment(uv, ml, mr));
  return dist - 0.07;
}

vec3 background(vec2 uv) {
  float t = uTime;
  vec2 p = (uv - 0.5) * vec2(uRes.x / uRes.y, 1.0);
  vec3 col = mix(vec3(0.006, 0.016, 0.06), vec3(0.016, 0.04, 0.11), smoothstep(-0.5, 0.5, p.y));
  col += uAccent * 0.09 * exp(-dot(p - vec2(0.0, 0.18), p - vec2(0.0, 0.18)) * 2.5);

  // Camera glides over an endless spreadsheet floor.
  vec3 ro = vec3(sin(t * 0.05) * 0.8, 1.2 + sin(t * 0.11) * 0.06, t * 0.5);
  vec3 rd = normalize(vec3(p.x, p.y - 0.14, 1.35));
  col += uAccent * 0.22 * exp(-abs(rd.y + 0.004) * 55.0);

  if (rd.y < -0.002) {
    float dist = ro.y / -rd.y;
    vec3 hit = ro + rd * dist;
    vec2 g = hit.xz * vec2(0.42, 1.0);
    vec2 fw = fwidth(g);
    vec2 gridDist = abs(fract(g - 0.5) - 0.5) / max(fw, 1e-4);
    float line = 1.0 - min(min(gridDist.x, gridDist.y), 1.0);
    float detail = clamp(1.0 - max(fw.x, fw.y) * 2.2, 0.0, 1.0);
    float fog = exp(-dist * 0.075);

    vec2 id = floor(g);
    float h = hash21(id);
    float phase = fract(h * 7.31 + t * (0.05 + 0.08 * h));
    float lit = step(0.8, h) * smoothstep(0.0, 0.08, phase) * smoothstep(0.55, 0.12, phase);

    vec2 cell = fract(g);
    float glyph = 0.0;
    for (int k = 0; k < 3; k++) {
      vec2 duv = (cell - vec2(0.38 + float(k) * 0.17, 0.2)) / vec2(0.15, 0.6);
      if (duv.x > 0.0 && duv.x < 1.0 && duv.y > 0.0 && duv.y < 1.0) {
        int d = int(hash21(id + float(k) * 17.0) * 9.99);
        float dd = digit(duv, d);
        float aa = fwidth(dd) + 1e-4;
        glyph = max(glyph, smoothstep(aa, -aa, dd));
      }
    }

    vec3 floorCol = uAccent * (line * 0.55 * detail + lit * 0.16 + glyph * lit * 1.1 * detail);
    floorCol += vec3(0.02, 0.05, 0.08) * line * detail;
    col = mix(col, col + floorCol, fog);
  }

  // Slow drifting dust above the horizon.
  vec2 sp = uv * uRes / 3.0 + vec2(t * 2.0, 0.0);
  float star = step(0.9975, hash21(floor(sp)));
  col += vec3(0.6, 0.8, 1.0) * star * 0.35 * (0.5 + 0.5 * sin(t * 2.0 + hash21(floor(sp)) * 40.0)) * smoothstep(0.55, 0.8, uv.y);
  return col;
}

void main() {
  vec2 uv = vUv;
  vec3 bg = background(uv);
  vec4 layer;
  vec3 edgeGlow = vec3(0.0);
  if (uHasB > 0.5) {
    float m = clamp(uMix, 0.0, 1.0);
    float k = sin(3.14159265 * m);
    vec2 c = uv - 0.5;
    vec2 warped = uv + c * dot(c, c) * 0.35 * k * (1.0 - uReduced);
    vec4 a = texture(uLayerA, warped);
    vec4 b = texture(uLayerB, warped);
    float n = fbm(uv * vec2(uRes.x / uRes.y, 1.0) * 3.0 + 1.7);
    float reveal = mix(smoothstep(n - 0.05, n + 0.05, m * 1.25 - 0.12), m, uReduced);
    layer = mix(a, b, reveal);
    float band = (1.0 - abs(reveal * 2.0 - 1.0)) * (1.0 - uReduced);
    edgeGlow = uAccent * band * band * 1.6;
  } else {
    layer = texture(uLayerA, uv);
  }
  outColor = vec4(bg * (1.0 - layer.a) + layer.rgb + edgeGlow, 1.0);
}`;

const BRIGHT_FS = `${COMMON}
uniform sampler2D uSrc;
uniform float uThreshold;
void main() {
  vec3 c = texture(uSrc, vUv).rgb;
  float l = max(c.r, max(c.g, c.b));
  outColor = vec4(c * smoothstep(uThreshold, uThreshold + 0.3, l), 1.0);
}`;

const BLUR_FS = `${COMMON}
uniform sampler2D uSrc;
uniform vec2 uDir;
void main() {
  vec3 c = texture(uSrc, vUv).rgb * 0.227027;
  c += texture(uSrc, vUv + uDir * 1.3846).rgb * 0.316216;
  c += texture(uSrc, vUv - uDir * 1.3846).rgb * 0.316216;
  c += texture(uSrc, vUv + uDir * 3.2308).rgb * 0.070270;
  c += texture(uSrc, vUv - uDir * 3.2308).rgb * 0.070270;
  outColor = vec4(c, 1.0);
}`;

const COMPOSITE_FS = `${COMMON}
uniform sampler2D uScene;
uniform sampler2D uBloom;
uniform float uTime;
uniform float uFade;
uniform float uAberration;
uniform float uGrain;
uniform float uBloomStrength;
uniform vec2 uRes;
void main() {
  vec2 c = vUv - 0.5;
  vec3 col;
  if (uAberration > 0.0) {
    vec2 off = c * uAberration;
    col = vec3(texture(uScene, vUv + off).r, texture(uScene, vUv).g, texture(uScene, vUv - off).b);
  } else {
    col = texture(uScene, vUv).rgb;
  }
  col += texture(uBloom, vUv).rgb * uBloomStrength;
  col *= mix(1.0, smoothstep(1.0, 0.3, length(c * vec2(1.0, 0.9))), 0.5);
  col += (hash21(vUv * uRes + fract(uTime * 7.13) * 100.0) - 0.5) * uGrain;
  outColor = vec4(clamp(col, 0.0, 1.0) * uFade, 1.0);
}`;

export function createRenderer(gl) {
  const scene = createProgram(gl, SCENE_FS);
  const bright = createProgram(gl, BRIGHT_FS);
  const blur = createProgram(gl, BLUR_FS);
  const composite = createProgram(gl, COMPOSITE_FS);
  const layerA = createLayerTexture(gl);
  const layerB = createLayerTexture(gl);
  const sceneTarget = createTarget(gl, 2, 2);
  const bloomA = createTarget(gl, 1, 1);
  const bloomB = createTarget(gl, 1, 1);
  let width = 2;
  let height = 2;
  gl.disable(gl.DEPTH_TEST);
  gl.disable(gl.BLEND);

  function resize(w, h) {
    width = w;
    height = h;
    resizeTarget(gl, sceneTarget, w, h);
    resizeTarget(gl, bloomA, w / 2, h / 2);
    resizeTarget(gl, bloomB, w / 2, h / 2);
  }

  function blurPass(src, dst, dx, dy) {
    bindTarget(gl, dst);
    gl.useProgram(blur.program);
    bindTexture(gl, 0, src.texture);
    gl.uniform1i(blur.uniforms.uSrc, 0);
    gl.uniform2f(blur.uniforms.uDir, dx / src.width, dy / src.height);
    drawTriangle(gl);
  }

  // frame: { time, bgTime, canvasA, canvasB, mix, accent, fade, reduced }
  function render(frame) {
    uploadCanvas(gl, layerA, frame.canvasA);
    if (frame.canvasB) uploadCanvas(gl, layerB, frame.canvasB);

    bindTarget(gl, sceneTarget);
    gl.useProgram(scene.program);
    bindTexture(gl, 0, layerA);
    bindTexture(gl, 1, layerB);
    const u = scene.uniforms;
    gl.uniform1i(u.uLayerA, 0);
    gl.uniform1i(u.uLayerB, 1);
    gl.uniform1f(u.uHasB, frame.canvasB ? 1 : 0);
    gl.uniform1f(u.uMix, frame.mix);
    gl.uniform1f(u.uTime, frame.bgTime);
    gl.uniform3fv(u.uAccent, frame.accent);
    gl.uniform2f(u.uRes, width, height);
    gl.uniform1f(u.uReduced, frame.reduced ? 1 : 0);
    drawTriangle(gl);

    bindTarget(gl, bloomA);
    gl.useProgram(bright.program);
    bindTexture(gl, 0, sceneTarget.texture);
    gl.uniform1i(bright.uniforms.uSrc, 0);
    gl.uniform1f(bright.uniforms.uThreshold, 0.62);
    drawTriangle(gl);
    blurPass(bloomA, bloomB, 1, 0);
    blurPass(bloomB, bloomA, 0, 1);
    blurPass(bloomA, bloomB, 2.5, 0);
    blurPass(bloomB, bloomA, 0, 2.5);

    bindTarget(gl, null);
    gl.useProgram(composite.program);
    bindTexture(gl, 0, sceneTarget.texture);
    bindTexture(gl, 1, bloomA.texture);
    const c = composite.uniforms;
    gl.uniform1i(c.uScene, 0);
    gl.uniform1i(c.uBloom, 1);
    gl.uniform1f(c.uTime, frame.time);
    gl.uniform1f(c.uFade, frame.fade);
    const swirl = frame.canvasB ? Math.sin(Math.PI * Math.min(Math.max(frame.mix, 0), 1)) : 0;
    gl.uniform1f(c.uAberration, frame.reduced ? 0 : 0.0025 + swirl * 0.014);
    gl.uniform1f(c.uGrain, frame.reduced ? 0 : 0.045);
    gl.uniform1f(c.uBloomStrength, 0.55);
    gl.uniform2f(c.uRes, width, height);
    drawTriangle(gl);
  }

  return { resize, render };
}
