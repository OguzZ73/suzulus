// Süzülüş — Math, noise, colour palettes, canvas setup and the shape of the world
'use strict';

const $ = (id) => document.getElementById(id);
const RM = !!(window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches);
// a phone or tablet: touch-first controls, lighter rendering, shorter legs between countries
const MOBILE = !!(window.matchMedia && window.matchMedia('(pointer: coarse)').matches) || (navigator.maxTouchPoints > 0 && /Android|iPhone|iPad|iPod|Mobile/i.test(navigator.userAgent));
if (MOBILE) document.documentElement.classList.add('is-mobile');

/* =========================================================
   Math + noise
   ========================================================= */
const TAU = Math.PI * 2;
const clamp = (v, a, b) => (v < a ? a : v > b ? b : v);
const lerp = (a, b, t) => a + (b - a) * t;
const sstep = (t) => t * t * (3 - 2 * t);
const rand = (a, b) => a + Math.random() * (b - a);
const rint = (a, b) => Math.floor(rand(a, b + 1));
const damp = (a, b, r, dt) => a + (b - a) * (1 - Math.exp(-r * dt));
const easeIO = (t) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);

function hash1(i, s) {
  let h = Math.imul((i | 0) ^ Math.imul(s | 0, 0x9e3779b1), 0x27d4eb2d);
  h ^= h >>> 15; h = Math.imul(h, 0x85ebca6b);
  h ^= h >>> 13; h = Math.imul(h, 0xc2b2ae35);
  h ^= h >>> 16;
  return (h >>> 0) / 4294967296;
}
function vnoise(x, s) {
  const i = Math.floor(x), f = x - i, u = f * f * (3 - 2 * f);
  return hash1(i, s) * (1 - u) + hash1(i + 1, s) * u;
}
function fbm(x, s, oct) {
  let a = 0.5, sum = 0, norm = 0, fr = 1;
  for (let o = 0; o < oct; o++) { sum += a * vnoise(x * fr, s + o * 131); norm += a; a *= 0.5; fr *= 2.07; }
  return sum / norm;
}
function ridge(x, s, oct) {
  let a = 0.5, sum = 0, norm = 0, fr = 1;
  for (let o = 0; o < oct; o++) {
    const n = 1 - Math.abs(vnoise(x * fr, s + o * 131) * 2 - 1);
    sum += a * n * n; norm += a; a *= 0.5; fr *= 2.1;
  }
  return sum / norm;
}
function segD2(px, py, ax, ay, bx, by) {
  const dx = bx - ax, dy = by - ay, l2 = dx * dx + dy * dy;
  let t = l2 ? ((px - ax) * dx + (py - ay) * dy) / l2 : 0;
  t = t < 0 ? 0 : t > 1 ? 1 : t;
  const ex = ax + dx * t - px, ey = ay + dy * t - py;
  return ex * ex + ey * ey;
}
// signed distance from point to polygon (flat [x0,y0,x1,y1,...]); negative = inside
function polyDist(px, py, p) {
  let inside = false, best = 1e18;
  for (let i = 0, j = p.length - 2; i < p.length; j = i, i += 2) {
    const xi = p[i], yi = p[i + 1], xj = p[j], yj = p[j + 1];
    if ((yi > py) !== (yj > py) && px < ((xj - xi) * (py - yi)) / (yj - yi) + xi) inside = !inside;
    const d = segD2(px, py, xj, yj, xi, yi);
    if (d < best) best = d;
  }
  best = Math.sqrt(best);
  return inside ? -best : best;
}
function lineDist(px, py, p) {
  let b = 1e18;
  for (let i = 2; i < p.length; i += 2) { const d = segD2(px, py, p[i - 2], p[i - 1], p[i], p[i + 1]); if (d < b) b = d; }
  return Math.sqrt(b);
}

/* =========================================================
   Color + day/night palettes
   ========================================================= */
const hex = (h) => { const n = parseInt(h.slice(1), 16); return [(n >> 16) & 255, (n >> 8) & 255, n & 255]; };
const mix = (a, b, t) => [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t, a[2] + (b[2] - a[2]) * t];
const css = (c, a = 1) => `rgba(${c[0] | 0},${c[1] | 0},${c[2] | 0},${a})`;
const WHITE = [255, 255, 255], BLACK = [0, 0, 0];

const KF = [
  { t: 0.00, top: '#39437a', mid: '#c48bab', bot: '#ffcaa6', sun: '#fff1dc', glow: '#ffb48e', far: '#b897b4', near: '#2e2743', fog: '#efb7aa', cloud: '#ffd6cf', light: '#ff9a80', la: 0.14, stars: 0.25 },
  { t: 0.10, top: '#4f8fd6', mid: '#a8d4ee', bot: '#fff0d4', sun: '#fffbe9', glow: '#ffe0a6', far: '#a2c1d8', near: '#2c4459', fog: '#e3eef0', cloud: '#ffffff', light: '#fff1cf', la: 0.04, stars: 0 },
  { t: 0.28, top: '#2e83d4', mid: '#78c0ec', bot: '#d4eefa', sun: '#ffffff', glow: '#fff5d2', far: '#8bb9d4', near: '#24485a', fog: '#cde8f4', cloud: '#ffffff', light: '#ffffff', la: 0, stars: 0 },
  { t: 0.44, top: '#4a72b4', mid: '#e9b582', bot: '#ffdc92', sun: '#fff1c4', glow: '#ffb862', far: '#c49e8c', near: '#3a3247', fog: '#f5c993', cloud: '#ffe4bd', light: '#ffbd70', la: 0.1, stars: 0 },
  { t: 0.55, top: '#2b2e6c', mid: '#cf607c', bot: '#ff9c5c', sun: '#ffe1a2', glow: '#ff7a48', far: '#8e5b7e', near: '#221d39', fog: '#e98878', cloud: '#ffb19b', light: '#ff8a5c', la: 0.2, stars: 0.05 },
  { t: 0.65, top: '#121a42', mid: '#45387c', bot: '#a65e8c', sun: '#ffd2a8', glow: '#c06192', far: '#4b3f74', near: '#14152f', fog: '#6b4f88', cloud: '#6e5a90', light: '#6a58aa', la: 0.3, stars: 0.55 },
  { t: 0.76, top: '#040a1b', mid: '#0d1c3c', bot: '#1c3460', sun: '#e9f0ff', glow: '#7c9cd6', far: '#283a64', near: '#090f22', fog: '#213760', cloud: '#2a3a5e', light: '#3a5ca2', la: 0.42, stars: 1 },
  { t: 0.90, top: '#070f29', mid: '#18234e', bot: '#3b3c72', sun: '#e9f0ff', glow: '#8a8fd2', far: '#38396b', near: '#0d1029', fog: '#393a70', cloud: '#3a3d6c', light: '#4b58a0', la: 0.36, stars: 0.8 },
];
const PK = ['top', 'mid', 'bot', 'sun', 'glow', 'far', 'near', 'fog', 'cloud', 'light'];
for (const k of KF) for (const p of PK) k[p] = hex(k[p]);
const pal = { la: 0, stars: 0 };
for (const p of PK) pal[p] = [0, 0, 0];
const STORM_KEYS = ['top', 'mid', 'bot', 'far', 'fog', 'cloud', 'glow'];

function computePalette(t, storm) {
  let i = 0;
  for (let j = 0; j < KF.length; j++) if (KF[j].t <= t) i = j;
  const a = KF[i], b = KF[(i + 1) % KF.length];
  const tb = i + 1 < KF.length ? b.t : 1;
  const f = sstep(clamp((t - a.t) / (tb - a.t), 0, 1));
  for (const p of PK) {
    const A = a[p], B = b[p], o = pal[p];
    o[0] = A[0] + (B[0] - A[0]) * f; o[1] = A[1] + (B[1] - A[1]) * f; o[2] = A[2] + (B[2] - A[2]) * f;
  }
  pal.la = lerp(a.la, b.la, f);
  pal.stars = lerp(a.stars, b.stars, f);
  if (storm > 0.001) {
    const s = storm * 0.72;
    for (const p of STORM_KEYS) {
      const o = pal[p], l = o[0] * 0.3 + o[1] * 0.59 + o[2] * 0.11;
      o[0] = lerp(o[0], l * 0.7 + 4, s); o[1] = lerp(o[1], l * 0.75 + 8, s); o[2] = lerp(o[2], l * 0.84 + 18, s);
    }
    pal.stars *= 1 - storm;
    pal.la = lerp(pal.la, 0.3, storm * 0.5);
  }
}

/* =========================================================
   Canvas + sprites
   ========================================================= */
const cvs = $('game');
const ctx = cvs.getContext('2d', { alpha: false }) || cvs.getContext('2d');
const VB = 720;
let W = 1280, VH = 720, viewTop = 0, scale = 1, quality = MOBILE ? 0.85 : 1, vign = null;

const BOX = 160;
const birdC = document.createElement('canvas');
const bctx = birdC.getContext('2d');
const gliderC = document.createElement('canvas');
const gctx = gliderC.getContext('2d');
let glider = null; // the empty glider after a crash
let chute = null, landT = 0; // the pilot's reserve parachute

function makeGlow(c) {
  const cv = document.createElement('canvas'), s = 64;
  cv.width = cv.height = s;
  const g = cv.getContext('2d');
  const gr = g.createRadialGradient(s / 2, s / 2, 0, s / 2, s / 2, s / 2);
  gr.addColorStop(0, css(c, 1)); gr.addColorStop(0.25, css(c, 0.42)); gr.addColorStop(1, css(c, 0));
  g.fillStyle = gr; g.fillRect(0, 0, s, s);
  return cv;
}
const GLOW = {
  gold: makeGlow([255, 205, 110]), blue: makeGlow([110, 195, 255]), white: makeGlow([255, 255, 255]),
  fly: makeGlow([205, 255, 140]), warm: makeGlow([255, 178, 96]), cyan: makeGlow([140, 232, 255]),
  lilac: makeGlow([196, 178, 255]), bolt: makeGlow([170, 200, 255]), red: makeGlow([255, 96, 64]),
};

// flyer gradients (local coords)
const G = {};
(function makeFlyerGradients() {
  let g = bctx.createLinearGradient(0, -8, 0, 8);
  g.addColorStop(0, '#5a83b3'); g.addColorStop(0.5, '#36577f'); g.addColorStop(1, '#22385a');
  G.tunic = g;
  g = bctx.createLinearGradient(0, -30, 0, -4);
  g.addColorStop(0, '#fbf5e8'); g.addColorStop(1, '#ddcdb0');
  G.sailNear = g;
  g = bctx.createLinearGradient(0, -46, 0, -26);
  g.addColorStop(0, '#a99a86'); g.addColorStop(1, '#c4b49c');
  G.sailFar = g;
  g = bctx.createLinearGradient(0, -6, 0, 6);
  g.addColorStop(0, '#ea5a4c'); g.addColorStop(1, '#a92f2b');
  G.scarf = g;
})();

// fine film grain, animated by offset each frame
const GRAIN = (() => {
  const c = document.createElement('canvas'), n = 128;
  c.width = c.height = n;
  const g = c.getContext('2d'), id = g.createImageData(n, n), d = id.data;
  for (let i = 0; i < n * n; i++) {
    const v = Math.random() < 0.5 ? 0 : 255;
    d[i * 4] = d[i * 4 + 1] = d[i * 4 + 2] = v;
    d[i * 4 + 3] = (Math.random() * 24) | 0;
  }
  g.putImageData(id, 0, 0);
  return c;
})();
let grainPat = null;
const cloudTmp = document.createElement('canvas');

function resize() {
  const cw = Math.max(1, window.innerWidth), ch = Math.max(1, window.innerHeight);
  const pr = Math.min(window.devicePixelRatio || 1, MOBILE ? 1.75 : 2) * quality;
  cvs.width = Math.max(1, Math.round(cw * pr));
  cvs.height = Math.max(1, Math.round(ch * pr));
  scale = Math.min(cvs.height / VB, cvs.width / 760);
  W = cvs.width / scale; VH = cvs.height / scale; viewTop = VB - VH;
  const vw = Math.max(2, Math.round(cvs.width / 4)), vh = Math.max(2, Math.round(cvs.height / 4));
  vign = document.createElement('canvas'); vign.width = vw; vign.height = vh;
  const g = vign.getContext('2d'), r = Math.hypot(vw, vh) / 2;
  const gr = g.createRadialGradient(vw / 2, vh * 0.46, r * 0.32, vw / 2, vh / 2, r);
  gr.addColorStop(0, 'rgba(10,12,34,0)'); gr.addColorStop(1, 'rgba(10,12,34,0.45)');
  g.fillStyle = gr; g.fillRect(0, 0, vw, vh);
  birdC.width = birdC.height = gliderC.width = gliderC.height = Math.max(2, Math.ceil(BOX * scale));
  if (Sky.ok) Sky.resize();
  // cloud sprites baked for another canvas size (a hidden tab, a window that grew) are baked again
  const cs = Math.min(scale, 1.3);
  let rebaked = false;
  for (const c of clouds) if (c.mask && Math.abs(c.bs - cs) > cs * 0.2) { buildCloud(c); rebaked = true; }
  for (const o of obstacles) if (o.type === 'storm' && Math.abs(o.cloud.bs - cs) > cs * 0.2) { buildCloud(o.cloud); rebaked = true; }
  if (rebaked) retintClouds();
}

/* =========================================================
   World shape
   ========================================================= */
const WL = 524; // lake surface
const LAYERS = [
  { par: 0.03, base: 455, amp: 300, freq: 1 / 430, oct: 6, seed: 11, depth: 1.0, ridge: true, snow: true, snowK: 0.56, step: 4, shade: 1 },
  { par: 0.075, base: 500, amp: 215, freq: 1 / 340, oct: 5, seed: 23, depth: 0.82, ridge: true, snow: true, snowK: 0.72, step: 5, shade: 0.9 },
  { par: 0.16, base: WL + 6, amp: 125, freq: 1 / 300, oct: 4, seed: 37, depth: 0.64, step: 6, shade: 0.6, lake: true,
    falls: { cell: 1100, p: 0.62, w0: 8, w1: 14, off: 22, seed: 61 }, trees: { sp: 9, h0: 9, h1: 20, seed: 41 } },
  { par: 0.3, base: 640, amp: 140, freq: 1 / 260, oct: 3, seed: 51, depth: 0.42, step: 7, shade: 0.45,
    falls: { cell: 1600, p: 0.5, w0: 13, w1: 20, off: 34, seed: 67 }, trees: { sp: 14, h0: 20, h1: 42, seed: 53 } },
];
// canyon country: flat-topped mesas stepping down in sheer terraces
const MESA = [
  { base: 470, amp: 300, freq: 1 / 520 },
  { base: 505, amp: 250, freq: 1 / 420 },
  { base: WL + 6, amp: 165, freq: 1 / 330 },
  { base: 650, amp: 150, freq: 1 / 290 },
];
LAYERS.forEach((L, i) => { L.idx = i; });
let CITY = false, cityK = 0, CANYON = false, canyonK = 0, POLAR = false, polarK = 0, VOLCANO = false, volcK = 0;
// how much of the sky the clouds cover in fair weather; some days there are none at all
let cloudCover = 1, coverTarget = 1, coverT = 25;
function mesaY(L, wx) {
  const M = MESA[L.idx], v = fbm(wx * M.freq, L.seed + 300, 4) * 3.2;
  const fl = Math.floor(v), f = v - fl;
  const h = (fl + sstep(clamp((f - 0.68) / 0.32, 0, 1))) / 3.2;
  return M.base - M.amp * h + (vnoise(wx / 11, L.seed + 5) - 0.5) * 3;
}
function layerY(L, wx) {
  if (CANYON) return mesaY(L, wx);
  const n = L.ridge ? ridge(wx * L.freq, L.seed, L.oct) : fbm(wx * L.freq, L.seed, L.oct);
  return L.base - L.amp * n;
}
function groundY(x) { return 668 - 92 * fbm(x / 640, 71, 3) - 24 * vnoise(x / 150, 93); }

function pine(c, x, y, h, w) {
  c.moveTo(x - w * 0.52, y);
  c.lineTo(x - w * 0.24, y - h * 0.22);
  c.lineTo(x - w * 0.44, y - h * 0.19);
  c.lineTo(x - w * 0.19, y - h * 0.43);
  c.lineTo(x - w * 0.36, y - h * 0.40);
  c.lineTo(x - w * 0.14, y - h * 0.64);
  c.lineTo(x - w * 0.27, y - h * 0.61);
  c.lineTo(x - w * 0.08, y - h * 0.82);
  c.lineTo(x - w * 0.17, y - h * 0.79);
  c.lineTo(x, y - h);
  c.lineTo(x + w * 0.17, y - h * 0.79);
  c.lineTo(x + w * 0.08, y - h * 0.82);
  c.lineTo(x + w * 0.27, y - h * 0.61);
  c.lineTo(x + w * 0.14, y - h * 0.64);
  c.lineTo(x + w * 0.36, y - h * 0.40);
  c.lineTo(x + w * 0.19, y - h * 0.43);
  c.lineTo(x + w * 0.44, y - h * 0.19);
  c.lineTo(x + w * 0.24, y - h * 0.22);
  c.lineTo(x + w * 0.52, y);
  c.closePath();
}
function polyPath(c, p) {
  c.moveTo(p[0], p[1]);
  for (let i = 2; i < p.length; i += 2) c.lineTo(p[i], p[i + 1]);
  c.closePath();
}
