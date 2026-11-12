// Süzülüş — Sky, stars, sun and moon, hill layers, waterfalls, water
'use strict';

/* =========================================================
   Render
   ========================================================= */
let obsFillC = [0, 0, 0], rimC = [0, 0, 0];

function drawSky() {
  const span = VB - viewTop;
  const g = ctx.createLinearGradient(0, viewTop, 0, VB);
  g.addColorStop(0, css(pal.top));
  g.addColorStop(clamp((300 - viewTop) / span, 0.05, 0.9), css(pal.mid));
  g.addColorStop(clamp((500 - viewTop) / span, 0.1, 0.95), css(pal.bot));
  g.addColorStop(1, css(pal.bot));
  ctx.fillStyle = g;
  ctx.fillRect(-40, viewTop - 40, W + 80, span + 80);
}
// the Milky Way, painted once: a soft glowing band, dense star dust and dark dust lanes
const MILKY = (() => {
  const c = document.createElement('canvas'); c.width = 1600; c.height = 800;
  const g = c.getContext('2d');
  g.translate(800, 400); g.rotate(-0.38);
  for (let i = 0; i < 70; i++) {
    const x = rand(-900, 900), y = (Math.random() + Math.random() - 1) * 75, r = rand(60, 170);
    const col = Math.random() < 0.55 ? '170,185,255' : Math.random() < 0.5 ? '255,214,232' : '200,240,255';
    const gr = g.createRadialGradient(x, y, 0, x, y, r);
    gr.addColorStop(0, `rgba(${col},0.07)`); gr.addColorStop(1, `rgba(${col},0)`);
    g.fillStyle = gr; g.fillRect(x - r, y - r, r * 2, r * 2);
  }
  for (let i = 0; i < 6000; i++) {
    const x = rand(-900, 900), y = (Math.random() + Math.random() + Math.random() - 1.5) * 95;
    g.fillStyle = `rgba(255,255,255,${Math.random() * 0.85})`;
    const sz = Math.random() < 0.94 ? 1 : 2;
    g.fillRect(x, y, sz, sz);
  }
  g.globalCompositeOperation = 'destination-out';
  for (let i = 0; i < 46; i++) {
    const x = rand(-900, 900), y = (Math.random() - 0.5) * 26 + Math.sin(x / 130) * 14, r = rand(18, 60);
    const gr = g.createRadialGradient(x, y, 0, x, y, r);
    gr.addColorStop(0, 'rgba(0,0,0,0.55)'); gr.addColorStop(1, 'rgba(0,0,0,0)');
    g.fillStyle = gr; g.fillRect(x - r, y - r, r * 2, r * 2);
  }
  return c;
})();
function drawMilkyWay(a) {
  const w = W * 1.4, h = (470 - viewTop) * 1.05;
  let x = -(camX * 0.002) % (w * 0.2);
  ctx.globalCompositeOperation = 'lighter';
  ctx.globalAlpha = a;
  ctx.drawImage(MILKY, x - w * 0.15, viewTop - 20, w, h);
  ctx.globalAlpha = 1;
  ctx.globalCompositeOperation = 'source-over';
}
function drawStars() {
  const a0 = pal.stars;
  const top = viewTop, h = 470 - viewTop;
  ctx.fillStyle = '#ffffff';
  for (const s of stars) {
    if (s.polar && polarK < 0.02) continue;
    const a = a0 * s.b * (0.55 + 0.45 * Math.sin(time * s.tw + s.ph)) * (s.polar ? polarK : 1) * (1 + 0.35 * polarK);
    if (a < 0.03) continue;
    let x = (s.x * W - camX * 0.004) % W; if (x < 0) x += W;
    ctx.globalAlpha = a;
    ctx.fillRect(x, top + s.y * h, s.s, s.s);
  }
  ctx.globalAlpha = 1;
  // shooting stars
  if (shooting.length) {
    ctx.lineCap = 'round';
    for (const s of shooting) {
      const a = Math.sin((s.t / s.life) * Math.PI) * a0;
      const g = ctx.createLinearGradient(s.x, s.y, s.x - s.vx * 0.12, s.y - s.vy * 0.12);
      g.addColorStop(0, `rgba(255,255,255,${a})`); g.addColorStop(1, 'rgba(255,255,255,0)');
      ctx.strokeStyle = g; ctx.lineWidth = 1.6;
      ctx.beginPath(); ctx.moveTo(s.x, s.y); ctx.lineTo(s.x - s.vx * 0.12, s.y - s.vy * 0.12); ctx.stroke();
    }
  }
}
const auroraTop = [], auroraBot = [];
function drawAurora(a) {
  ctx.globalCompositeOperation = 'lighter';
  for (let b = 0; b < 2; b++) {
    const base = 160 + b * 60, hgt = 130 - b * 35, step = 24;
    auroraTop.length = 0; auroraBot.length = 0;
    for (let x = -24; x <= W + step; x += step) {
      const wx = x + camX * 0.01 + time * (b ? -9 : 7);
      const y = base + Math.sin(wx * 0.004 + b * 2) * 34 + Math.sin(wx * 0.011 + time * 0.3) * 14;
      const hh = hgt * (0.55 + 0.45 * Math.sin(wx * 0.0065 + time * 0.45 + b * 2.3));
      auroraTop.push(x, y - hh); auroraBot.push(x, y);
    }
    const col = b ? '160,120,255' : '90,255,180';
    const g = ctx.createLinearGradient(0, base - hgt - 40, 0, base + 40);
    g.addColorStop(0, `rgba(${col},0)`);
    g.addColorStop(0.65, `rgba(${col},${0.13 * a})`);
    g.addColorStop(0.88, `rgba(${col},${0.24 * a})`);
    g.addColorStop(1, `rgba(${col},0)`);
    ctx.fillStyle = g;
    ctx.beginPath();
    ctx.moveTo(auroraTop[0], auroraTop[1]);
    for (let i = 2; i < auroraTop.length; i += 2) ctx.lineTo(auroraTop[i], auroraTop[i + 1]);
    for (let i = auroraBot.length - 2; i >= 0; i -= 2) ctx.lineTo(auroraBot[i], auroraBot[i + 1]);
    ctx.closePath();
    ctx.fill();
  }
  ctx.globalCompositeOperation = 'source-over';
}
function drawCelestial() {
  if (sun.a > 0.01) {
    const g = ctx.createRadialGradient(sun.x, sun.y, 0, sun.x, sun.y, 320);
    g.addColorStop(0, css(pal.glow, 0.6 * sun.a)); g.addColorStop(0.22, css(pal.glow, 0.22 * sun.a)); g.addColorStop(1, css(pal.glow, 0));
    ctx.fillStyle = g; ctx.fillRect(sun.x - 320, sun.y - 320, 640, 640);
    // soft rays (the GL sky casts real shafts instead)
    if (!Sky.ok) drawSunRays();
    // a disc that burns white at the heart and softens at the limb
    const sd = ctx.createRadialGradient(sun.x, sun.y, 0, sun.x, sun.y, 36);
    sd.addColorStop(0, css(mix(pal.sun, WHITE, 0.7), sun.a)); sd.addColorStop(0.62, css(pal.sun, sun.a));
    sd.addColorStop(0.8, css(mix(pal.sun, pal.glow, 0.35), 0.95 * sun.a)); sd.addColorStop(0.86, css(pal.glow, 0.3 * sun.a)); sd.addColorStop(1, css(pal.glow, 0));
    ctx.fillStyle = sd;
    ctx.beginPath(); ctx.arc(sun.x, sun.y, 36, 0, TAU); ctx.fill();
  }
  if (moon.a > 0.01) {
    const g = ctx.createRadialGradient(moon.x, moon.y, 0, moon.x, moon.y, 170);
    g.addColorStop(0, `rgba(190,210,255,${0.32 * moon.a})`); g.addColorStop(1, 'rgba(190,210,255,0)');
    ctx.fillStyle = g; ctx.fillRect(moon.x - 170, moon.y - 170, 340, 340);
    const md = ctx.createRadialGradient(moon.x - 7, moon.y - 7, 2, moon.x, moon.y, 22);
    md.addColorStop(0, `rgba(250,252,255,${moon.a})`); md.addColorStop(0.7, `rgba(228,236,254,${moon.a})`); md.addColorStop(1, `rgba(186,200,236,${moon.a})`);
    ctx.fillStyle = md;
    ctx.beginPath(); ctx.arc(moon.x, moon.y, 22, 0, TAU); ctx.fill();
    ctx.fillStyle = `rgba(150,165,205,${0.28 * moon.a})`;
    ctx.beginPath();
    ctx.arc(moon.x - 7, moon.y - 5, 5, 0, TAU);
    ctx.moveTo(moon.x + 9, moon.y + 6); ctx.arc(moon.x + 6, moon.y + 6, 3.5, 0, TAU);
    ctx.moveTo(moon.x + 5, moon.y - 9); ctx.arc(moon.x + 3, moon.y - 9, 2.2, 0, TAU);
    ctx.fill();
  }
}
function drawSunRays() {
  const rg = ctx.createRadialGradient(sun.x, sun.y, 20, sun.x, sun.y, 900);
  rg.addColorStop(0, css(pal.glow, 0.09 * sun.a)); rg.addColorStop(1, css(pal.glow, 0));
  ctx.fillStyle = rg;
  ctx.beginPath();
  for (let i = 0; i < 9; i++) {
    const a = i * (TAU / 9) + time * 0.02, w = 0.045 + 0.03 * Math.sin(i * 1.7 + time * 0.3);
    ctx.moveTo(sun.x, sun.y);
    ctx.lineTo(sun.x + Math.cos(a - w) * 900, sun.y + Math.sin(a - w) * 900);
    ctx.lineTo(sun.x + Math.cos(a + w) * 900, sun.y + Math.sin(a + w) * 900);
    ctx.closePath();
  }
  ctx.fill();
}
function drawClouds(band) {
  ctx.globalAlpha = (band === 0 ? 0.82 : 0.94) * (1 - pal.stars * 0.25) * clamp(cloudCover * 1.25 - 0.1, 0, 1);
  if (ctx.globalAlpha < 0.01) { ctx.globalAlpha = 1; return; }
  for (const c of clouds) {
    if (c.band !== band) continue;
    const x0 = c.wx - camX * c.par;
    if (x0 > W + 40 || x0 + c.w < -40) continue;
    ctx.drawImage(c.tint, x0 - c.pad, c.y - c.h - c.pad, c.lw, c.lh);
  }
  ctx.globalAlpha = 1;
}

const LX = new Float32Array(2048), LY = new Float32Array(2048);
let lakePath = null, lakeCol = [0, 0, 0];
const lakeFalls = [];
const lightSrc = () => (sun.a >= moon.a ? sun : moon);
const lightAmt = () => Math.max(sun.a, moon.a * 0.55) * (1 - stormAmt() * 0.6);

function drawLayer(i) {
  const L = LAYERS[i], off = camX * L.par, step = L.step;
  const col = mix(pal.near, pal.far, L.depth);
  const start = Math.floor((off - 16) / step) * step;
  const path = new Path2D();
  let n = 0;
  path.moveTo(start - off, VB + 10);
  for (let wx = start; wx <= off + W + step && n < LX.length; wx += step) {
    const x = wx - off, y = layerY(L, wx);
    path.lineTo(x, y);
    LX[n] = x; LY[n] = y; n++;
  }
  path.lineTo(LX[n - 1], VB + 10);
  path.closePath();
  if (L.trees && !CANYON && !POLAR && !CITY && !VOLCANO) {
    const T = L.trees, sp = T.sp;
    const k0 = Math.floor((off - 30) / sp), k1 = Math.ceil((off + W + 30) / sp);
    for (let k = k0; k <= k1; k++) {
      const wx = k * sp + hash1(k, T.seed) * sp * 0.7;
      const forest = vnoise(wx / 260, T.seed + 3);
      if (forest < 0.38) continue;
      if (hash1(k, T.seed + 5) > 0.35 + forest * 0.6) continue;
      const h = lerp(T.h0, T.h1, hash1(k, T.seed + 7)) * (0.7 + forest * 0.5);
      pine(path, wx - off, layerY(L, wx) + 3, h, h * 0.42);
    }
  }
  if (CITY && L.idx >= 2) {
    addCityToPath(path, L, off);
  }
  const top = L.base - L.amp;
  const g = ctx.createLinearGradient(0, top, 0, L.base + 20);
  g.addColorStop(0, css(mix(col, pal.mid, 0.08 + 0.1 * L.depth)));
  g.addColorStop(1, css(col));
  ctx.fillStyle = g;
  ctx.fill(path);
  if ((L.snow || POLAR) && !CANYON && !CITY && !VOLCANO) {
    const sk = POLAR ? 0.08 : L.snowK;
    ctx.save();
    ctx.clip(path);
    ctx.fillStyle = css(mix(mix(col, WHITE, 0.5), pal.sun, 0.12), 0.94);
    ctx.beginPath();
    ctx.moveTo(start - off, viewTop - 20);
    for (let wx = start; wx <= off + W + step; wx += step * 2) {
      const y = L.base - L.amp * sk + (vnoise(wx / 18, 5 + i) - 0.5) * 22 + (vnoise(wx / 70, 6 + i) - 0.5) * 30;
      ctx.lineTo(wx - off, y);
    }
    ctx.lineTo(W + 20, viewTop - 20);
    ctx.closePath();
    ctx.fill();
    ctx.restore();
  }
  if (CANYON) {
    // layered sandstone: thin bands of lighter and darker rock across every mesa face
    ctx.save();
    ctx.clip(path);
    const M = MESA[L.idx], lt = mix(col, [255, 214, 170], 0.18), dk = mix(col, [40, 16, 10], 0.25);
    for (let y = Math.floor((M.base - M.amp) / 9) * 9, k = 0; y < M.base + 30; y += 9, k++) {
      ctx.fillStyle = css(k % 2 ? lt : dk, 0.14 + 0.06 * (k % 3 === 0));
      ctx.fillRect(-20, y + Math.sin(k * 1.7) * 1.5, W + 40, 3 + (k % 3));
    }
    ctx.restore();
  }
  shadeRidge(L, n, col);
  if (CITY && L.idx >= 2) {
    drawCitySkylineDetails(L, off, col);
  }
  if (L.falls && !CANYON && !POLAR && !CITY && !VOLCANO) drawFalls(L, off, col);
  else if (L.lake) lakeFalls.length = 0;
  if (L.lake) { lakePath = path; lakeCol = col; }
}

function cityRowBldg(L, row, k, off) {
  const isNear = L.idx === 3;
  const sp = isNear ? (row === 0 ? 27 : 31) : (row === 0 ? 19 : 22);
  const seed = (isNear ? 710 : 610) + row * 137;
  const jit = (hash1(k, seed + 1) - 0.5) * sp * 0.24;
  const wx = k * sp + jit;
  const x = wx - off;
  const ridgeY = layerY(L, wx);
  // Row 0 sits along the hill ridge; Row 1 sits lower down (along the waterfront quay on L2, or mid-slope on L3)
  const by = !isNear && row === 1
    ? WL - 2
    : ridgeY + (row === 0 ? (isNear ? 12 : 8) : (isNear ? 36 : 22));
  if (!isNear && row === 0 && by > WL + 4) return null;

  // Slight overlap so buildings pack shoulder-to-shoulder with zero gaps
  const bw = sp * (1.08 + 0.34 * hash1(k, seed + 2));
  const hVar = 0.72 + 0.68 * hash1(k, seed + 4);
  let bh = (isNear ? (row === 0 ? 56 : 44) : (row === 0 ? 38 : 30)) * hVar;

  const rKind = hash1(k, seed + 5);
  const kind = row === 0
    ? (rKind < 0.13 ? 0 : rKind < 0.42 ? 1 : rKind < 0.68 ? 2 : rKind < 0.84 ? 3 : rKind < 0.93 ? 4 : 5)
    : (rKind < 0.38 ? 1 : rKind < 0.70 ? 2 : rKind < 0.88 ? 4 : 3);
  if (kind === 0) bh *= 1.46;
  else if (kind === 3) bh *= 1.18;
  else if (kind === 5) bh *= 1.25;

  const palIdx = Math.floor(hash1(k, seed + 9) * 5);
  return { x, wx, by, bw, bh, kind, k, seed, isNear, row, palIdx };
}

function traceCityBldgRoof(ctxOrPath, x, by, bw, bh, kind) {
  const hw = bw * 0.5, topY = by - bh;
  if (kind === 0) {
    const tw = hw * 0.72, shY = by - bh * 0.60;
    ctxOrPath.moveTo(x - tw, by);
    ctxOrPath.lineTo(x - tw, shY);
    ctxOrPath.lineTo(x - tw * 1.15, shY);
    ctxOrPath.lineTo(x, topY);
    ctxOrPath.lineTo(x + tw * 1.15, shY);
    ctxOrPath.lineTo(x + tw, shY);
    ctxOrPath.lineTo(x + tw, by);
    ctxOrPath.closePath();
  } else if (kind === 1) {
    const shY = by - bh * 0.76, rw = hw * 0.78;
    ctxOrPath.moveTo(x - hw, by);
    ctxOrPath.lineTo(x - hw, shY);
    ctxOrPath.lineTo(x - rw, topY);
    ctxOrPath.lineTo(x + rw, topY);
    ctxOrPath.lineTo(x + hw, shY);
    ctxOrPath.lineTo(x + hw, by);
    ctxOrPath.closePath();
  } else if (kind === 2) {
    const shY = by - bh * 0.72;
    ctxOrPath.moveTo(x - hw, by);
    ctxOrPath.lineTo(x - hw, shY);
    ctxOrPath.lineTo(x, topY);
    ctxOrPath.lineTo(x + hw, shY);
    ctxOrPath.lineTo(x + hw, by);
    ctxOrPath.closePath();
  } else if (kind === 3) {
    const shY = by - bh * 0.70, dw = hw * 0.74;
    ctxOrPath.moveTo(x - hw, by);
    ctxOrPath.lineTo(x - hw, shY);
    ctxOrPath.lineTo(x - dw, shY);
    ctxOrPath.quadraticCurveTo(x - dw, topY, x, topY - 4);
    ctxOrPath.quadraticCurveTo(x + dw, topY, x + dw, shY);
    ctxOrPath.lineTo(x + hw, shY);
    ctxOrPath.lineTo(x + hw, by);
    ctxOrPath.closePath();
  } else if (kind === 4) {
    // Twin-gabled 1900s merchant house
    const shY = by - bh * 0.75;
    ctxOrPath.moveTo(x - hw, by);
    ctxOrPath.lineTo(x - hw, shY);
    ctxOrPath.lineTo(x - hw * 0.5, topY);
    ctxOrPath.lineTo(x, shY - (shY - topY) * 0.25);
    ctxOrPath.lineTo(x + hw * 0.5, topY);
    ctxOrPath.lineTo(x + hw, shY);
    ctxOrPath.lineTo(x + hw, by);
    ctxOrPath.closePath();
  } else {
    // 1900s Brick Factory Hall + Tall Smokestack
    const shY = by - bh * 0.58, hallTop = by - bh * 0.74;
    ctxOrPath.moveTo(x - hw, by);
    ctxOrPath.lineTo(x - hw, shY);
    ctxOrPath.lineTo(x - hw * 0.2, hallTop);
    ctxOrPath.lineTo(x + hw * 0.25, shY);
    ctxOrPath.lineTo(x + hw * 0.32, topY);
    ctxOrPath.lineTo(x + hw * 0.54, topY);
    ctxOrPath.lineTo(x + hw * 0.62, shY);
    ctxOrPath.lineTo(x + hw, shY);
    ctxOrPath.lineTo(x + hw, by);
    ctxOrPath.closePath();
  }
}

function addCityToPath(path, L, off) {
  const isNear = L.idx === 3;
  for (let row = 0; row < 2; row++) {
    const sp = isNear ? (row === 0 ? 27 : 31) : (row === 0 ? 19 : 22);
    const k0 = Math.floor((off - 90) / sp), k1 = Math.ceil((off + W + 90) / sp);
    for (let k = k0; k <= k1; k++) {
      const b = cityRowBldg(L, row, k, off);
      if (!b) continue;
      traceCityBldgRoof(path, b.x, b.by, b.bw, b.bh, b.kind);
    }
  }
}

const BG_CITY_TINTS = [
  [164, 126, 98],  // Warm sandstone & ochre
  [156, 92, 74],   // Vintage terracotta brick
  [144, 134, 122], // Parisian cream limestone
  [122, 108, 116], // Dusty mauve-slate stone
  [152, 114, 84],  // Amber townhouse brick
];

function drawCitySkylineDetails(L, off, col) {
  const isNear = L.idx === 3;
  const src = lightSrc(), la = lightAmt();
  const nightDim = 1 - pal.stars * 0.48;
  const winWarm = [255, 214, 118];
  const winAlpha = clamp(0.48 + pal.stars * 0.48 + (1 - la) * 0.22, 0.42, 0.96) * cityK;
  const winDark = mix(col, [18, 22, 38], 0.45);
  const roofSlate = mix(col, [22, 24, 38], 0.46);
  const roofTile = mix(col, [118, 52, 44], 0.34 * nightDim);
  const roofCopper = mix(col, [64, 118, 104], 0.36 * nightDim);

  ctx.save();
  if (cityK < 0.999) ctx.globalAlpha = cityK;

  for (let row = 0; row < 2; row++) {
    const sp = isNear ? (row === 0 ? 27 : 31) : (row === 0 ? 19 : 22);
    const k0 = Math.floor((off - 90) / sp), k1 = Math.ceil((off + W + 90) / sp);
    const rowDepthMix = isNear ? (row === 0 ? 0.32 : 0.46) : (row === 0 ? 0.22 : 0.34);

    for (let k = k0; k <= k1; k++) {
      const b = cityRowBldg(L, row, k, off);
      if (!b) continue;
      const { x, by, bw, bh, kind, seed, palIdx } = b;
      const hw = bw * 0.5, topY = by - bh;
      const fromLeft = src.x < x;
      const shY = by - bh * (kind === 0 ? 0.60 : kind === 1 ? 0.76 : kind === 3 ? 0.70 : kind === 5 ? 0.58 : 0.73);
      const wallW = kind === 0 ? hw * 0.72 : hw;

      // Tint building masonry with period color blended into atmospheric layer color `col`
      const rawTint = BG_CITY_TINTS[palIdx];
      const masonry = mix(col, [rawTint[0] * nightDim, rawTint[1] * nightDim, rawTint[2] * nightDim], rowDepthMix);
      const litFace = mix(masonry, mix(pal.glow, [255, 228, 182], 0.45), 0.16 + 0.22 * la);
      const shdFace = mix(masonry, [14, 14, 28], 0.36);
      const trimC = mix(litFace, [255, 240, 210], 0.22);

      // 2.5D Volumetric Wall Facets (3D side return + main front facade)
      const splitX = fromLeft ? (x - wallW * 0.36) : (x + wallW * 0.36);
      ctx.fillStyle = css(fromLeft ? litFace : shdFace);
      ctx.fillRect(x - wallW, shY, splitX - (x - wallW), by - shY);
      ctx.fillStyle = css(fromLeft ? shdFace : litFace);
      ctx.fillRect(splitX, shY, (x + wallW) - splitX, by - shY);

      // Subtle dark outline between adjacent packed buildings for crisp depth separation
      ctx.strokeStyle = css(mix(shdFace, BLACK, 0.38), 0.55);
      ctx.lineWidth = 1;
      ctx.strokeRect(x - wallW, shY, wallW * 2, by - shY);

      // Horizontal stone cornice & belt courses
      ctx.fillStyle = css(trimC, 0.75);
      ctx.fillRect(x - wallW - 1.5, shY - 1.5, wallW * 2 + 3, 2.2);
      if (by - shY > 22) {
        ctx.fillStyle = css(trimC, 0.45);
        ctx.fillRect(x - wallW, shY + (by - shY) * 0.48, wallW * 2, 1.4);
      }

      // Roofs, Domes, Spires & Smokestacks
      const rCol = (kind === 0 || kind === 3) ? roofCopper : (kind === 2 || kind === 4) ? roofTile : roofSlate;
      const rLit = mix(rCol, litFace, 0.28), rShd = mix(rCol, [10, 12, 24], 0.38);

      if (kind === 0) {
        // Clock tower spire (2-faceted 3D pyramid)
        const tw = hw * 0.72;
        ctx.fillStyle = css(fromLeft ? rLit : rShd);
        ctx.beginPath(); ctx.moveTo(x - tw * 1.15, shY); ctx.lineTo(x, topY); ctx.lineTo(x, shY); ctx.closePath(); ctx.fill();
        ctx.fillStyle = css(fromLeft ? rShd : rLit);
        ctx.beginPath(); ctx.moveTo(x, shY); ctx.lineTo(x, topY); ctx.lineTo(x + tw * 1.15, shY); ctx.closePath(); ctx.fill();
        // Finial spire needle
        ctx.strokeStyle = css(trimC, 0.8);
        ctx.lineWidth = 1.1;
        ctx.beginPath(); ctx.moveTo(x, topY); ctx.lineTo(x, topY - 7); ctx.stroke();
        // Illuminated 1900s Clock Dial
        const cr = Math.max(3.5, tw * 0.48), cy = shY + Math.min(10, (by - shY) * 0.26);
        ctx.fillStyle = css([255, 236, 182], 0.92);
        ctx.beginPath(); ctx.arc(x, cy, cr, 0, TAU); ctx.fill();
        ctx.strokeStyle = css(rShd, 0.9);
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.arc(x, cy, cr, 0, TAU);
        ctx.moveTo(x, cy); ctx.lineTo(x, cy - cr * 0.72);
        ctx.moveTo(x, cy); ctx.lineTo(x + cr * 0.55, cy + cr * 0.2);
        ctx.stroke();

      } else if (kind === 1) {
        // Mansard slate roof + chimneys + dormers
        const rw = hw * 0.78;
        ctx.fillStyle = css(mix(roofTile, shdFace, 0.2));
        ctx.fillRect(x - rw + 2, topY - 5, 3.5, 6);
        ctx.fillRect(x + rw - 5.5, topY - 5, 3.5, 6);
        ctx.fillStyle = css(fromLeft ? rLit : rShd);
        ctx.beginPath();
        ctx.moveTo(x - hw - 1, shY); ctx.lineTo(x - rw, topY); ctx.lineTo(x + rw, topY); ctx.lineTo(x + hw + 1, shY);
        ctx.closePath();
        ctx.fill();
        // Mansard dormer windows
        ctx.fillStyle = css(winWarm, winAlpha * 0.9);
        ctx.fillRect(x - hw * 0.42, lerp(topY, shY, 0.45), 2.5, 3.5);
        ctx.fillRect(x + hw * 0.28, lerp(topY, shY, 0.45), 2.5, 3.5);

      } else if (kind === 2) {
        // Stepped / Pitched Gable with sunlit slope & attic window
        ctx.fillStyle = css(fromLeft ? rLit : rShd);
        ctx.beginPath(); ctx.moveTo(x - hw - 1.5, shY); ctx.lineTo(x, topY); ctx.lineTo(x, shY); ctx.closePath(); ctx.fill();
        ctx.fillStyle = css(fromLeft ? rShd : rLit);
        ctx.beginPath(); ctx.moveTo(x, shY); ctx.lineTo(x, topY); ctx.lineTo(x + hw + 1.5, shY); ctx.closePath(); ctx.fill();
        ctx.strokeStyle = css(trimC, 0.8);
        ctx.lineWidth = 1.3;
        ctx.beginPath(); ctx.moveTo(x - hw - 1.5, shY); ctx.lineTo(x, topY); ctx.lineTo(x + hw + 1.5, shY); ctx.stroke();
        ctx.fillStyle = css(winWarm, winAlpha);
        ctx.beginPath(); ctx.arc(x, lerp(topY, shY, 0.58), 2.2, 0, TAU); ctx.fill();

      } else if (kind === 3) {
        // Grand Ribbed Dome + Cupola Lantern
        const dw = hw * 0.74;
        ctx.fillStyle = css(fromLeft ? rLit : rShd);
        ctx.beginPath();
        ctx.moveTo(x - dw, shY);
        ctx.quadraticCurveTo(x - dw, topY, x, topY - 3);
        ctx.quadraticCurveTo(x + dw, topY, x + dw, shY);
        ctx.closePath();
        ctx.fill();
        ctx.strokeStyle = css(trimC, 0.65);
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(x, topY - 3); ctx.lineTo(x, topY - 9);
        ctx.moveTo(x - dw * 0.4, shY); ctx.quadraticCurveTo(x - dw * 0.35, topY + 2, x, topY - 3);
        ctx.moveTo(x + dw * 0.4, shY); ctx.quadraticCurveTo(x + dw * 0.35, topY + 2, x, topY - 3);
        ctx.stroke();

      } else if (kind === 4) {
        // Twin-gabled merchant roof
        ctx.fillStyle = css(rLit);
        ctx.beginPath();
        ctx.moveTo(x - hw, shY);
        ctx.lineTo(x - hw * 0.5, topY);
        ctx.lineTo(x, shY - (shY - topY) * 0.25);
        ctx.lineTo(x + hw * 0.5, topY);
        ctx.lineTo(x + hw, shY);
        ctx.closePath();
        ctx.fill();

      } else {
        // 1900s Industrial Hall + Tall Brick Smokestack
        const hallTop = by - bh * 0.74;
        ctx.fillStyle = css(rShd);
        ctx.beginPath();
        ctx.moveTo(x - hw, shY); ctx.lineTo(x - hw * 0.2, hallTop); ctx.lineTo(x + hw * 0.25, shY);
        ctx.closePath();
        ctx.fill();
        // Tall brick chimney stack
        ctx.fillStyle = css(mix(roofTile, shdFace, 0.15));
        ctx.beginPath();
        ctx.moveTo(x + hw * 0.28, by);
        ctx.lineTo(x + hw * 0.33, topY);
        ctx.lineTo(x + hw * 0.53, topY);
        ctx.lineTo(x + hw * 0.60, by);
        ctx.closePath();
        ctx.fill();
        ctx.fillStyle = css(trimC, 0.85);
        ctx.fillRect(x + hw * 0.30, topY - 1.5, hw * 0.26, 2.2);
      }

      // Dense 1900s Windows Grid (warm gaslit vs dark reflective panes)
      const cols = kind === 0 ? 2 : (isNear ? 4 : 3);
      const rows = Math.max(2, Math.min(5, Math.floor((by - shY - 6) / (isNear ? 9 : 7))));
      const ww = isNear ? 3.2 : 2.3, wh = isNear ? 5.0 : 3.6;
      const spanX = wallW * 1.48;
      for (let r = 0; r < rows; r++) {
        if (kind === 0 && r === 0) continue;
        const wy = shY + 4 + r * ((by - shY - 8) / Math.max(1, rows));
        if (wy + wh > by - 3) continue;
        for (let c = 0; c < cols; c++) {
          const wx2 = x - spanX * 0.5 + (c / Math.max(1, cols - 1)) * spanX - ww * 0.5;
          const litWin = hash1(k * 23 + r * 11 + c * 3 + row * 7, seed + 21) > 0.32;
          ctx.fillStyle = css(litWin ? winWarm : winDark, litWin ? winAlpha : 0.65);
          ctx.fillRect(wx2, wy, ww, wh);
        }
      }

      // Rising coal smoke from chimneys & factory stacks
      if (kind === 5 || ((kind === 1 || kind === 2) && hash1(k, seed + 33) < 0.48)) {
        const cx = kind === 5 ? (x + hw * 0.43) : (x - hw * 0.42);
        const cy = topY - (kind === 5 ? 2 : 5);
        const smokeCol = mix(pal.fog, [215, 205, 195], 0.38);
        const puffs = kind === 5 ? 5 : 3;
        for (let s = 0; s < puffs; s++) {
          const ph = (time * (kind === 5 ? 0.55 : 0.42) + s / puffs + hash1(k, 99)) % 1;
          const sx = cx + ph * (kind === 5 ? 24 : 14) + Math.sin(time * 1.8 + k + s) * 3;
          const sy = cy - ph * (isNear ? 30 : 20);
          const sr = (isNear ? 3.2 : 2.4) + ph * (kind === 5 ? 8.5 : 5.5);
          ctx.fillStyle = css(smokeCol, (1 - ph) * (kind === 5 ? 0.36 : 0.25));
          ctx.beginPath(); ctx.arc(sx, sy, sr, 0, TAU); ctx.fill();
        }
      }
    }
  }

  // Waterfront Stone Quay Wall, Arched Vaults & Glowing Harbor Gaslamps along L.idx === 2
  if (!isNear) {
    const qTop = WL - 7, qBot = WL + 2;
    const quayStone = mix(col, [96, 86, 78], 0.35 * nightDim);
    const quayDark = mix(col, [18, 18, 30], 0.55);
    ctx.fillStyle = css(quayStone);
    ctx.fillRect(-10, qTop, W + 20, qBot - qTop);
    ctx.fillStyle = css(mix(quayStone, [255, 235, 200], 0.25));
    ctx.fillRect(-10, qTop, W + 20, 1.6);

    const archSp = 24;
    const ak0 = Math.floor((off - 40) / archSp), ak1 = Math.ceil((off + W + 40) / archSp);
    for (let ak = ak0; ak <= ak1; ak++) {
      const ax = ak * archSp - off;
      // Stone quay arch
      ctx.fillStyle = css(quayDark, 0.78);
      ctx.beginPath();
      ctx.arc(ax, qBot, 6.5, Math.PI, 0);
      ctx.closePath();
      ctx.fill();
      // Waterfront harbor gaslamp every 2 arches
      if (ak % 2 === 0) {
        ctx.fillStyle = css([255, 224, 136], 0.92);
        ctx.beginPath(); ctx.arc(ax + archSp * 0.5, qTop - 3.5, 1.8, 0, TAU); ctx.fill();
      }
    }
  }

  ctx.restore();
}

// light-facing slopes get a rim, the far side of every peak falls into shadow; transitions smoothly with position
function shadeRidge(L, n, col) {
  const la = lightAmt(), src = lightSrc();
  const alpha = (0.1 + 0.24 * la) * L.shade;
  if (alpha < 0.01 || n < 3) return;
  const sc = mix(col, [12, 16, 44], 0.6);
  const span = 340;
  const x0 = clamp(src.x - span, -20, W + 20), x1 = clamp(src.x + span, x0 + 2, W + 24);
  const gR = ctx.createLinearGradient(x0, 0, x1, 0);
  gR.addColorStop(0, css(sc, 0)); gR.addColorStop(1, css(sc, alpha * 0.72));
  const gL = ctx.createLinearGradient(x0, 0, x1, 0);
  gL.addColorStop(0, css(sc, alpha * 0.72)); gL.addColorStop(1, css(sc, 0));

  for (let dir = 0; dir < 2; dir++) {
    const right = dir === 0;
    ctx.beginPath();
    for (let k = 1; k < n - 1; k++) {
      if (!(LY[k] <= LY[k - 1] && LY[k] < LY[k + 1])) continue;
      const px = LX[k], py = LY[k];
      if (right ? px < src.x - span : px > src.x + span) continue;
      let j = k;
      if (right) { while (j < n - 1 && LY[j + 1] >= LY[j]) j++; }
      else { while (j > 0 && LY[j - 1] >= LY[j]) j--; }
      const vx = LX[j], vy = LY[j], depth = vy - py;
      if (j === k || depth < 3) continue;
      ctx.moveTo(px, py);
      if (right) for (let q = k + 1; q <= j; q++) ctx.lineTo(LX[q], LY[q]);
      else for (let q = k - 1; q >= j; q--) ctx.lineTo(LX[q], LY[q]);
      ctx.lineTo(vx, vy + depth * 0.5);
      ctx.lineTo(px + (vx - px) * 0.18, py + depth * 1.4);
      ctx.closePath();
    }
    ctx.fillStyle = right ? gR : gL;
    ctx.fill();
  }
  if (la > 0.05) {
    const rc = mix(pal.glow, WHITE, 0.35), ra = 0.3 * la * L.shade;
    const rR = ctx.createLinearGradient(x0, 0, x1, 0);
    rR.addColorStop(0, css(rc, 0)); rR.addColorStop(1, css(rc, ra));
    const rL = ctx.createLinearGradient(x0, 0, x1, 0);
    rL.addColorStop(0, css(rc, ra)); rL.addColorStop(1, css(rc, 0));
    ctx.lineWidth = 1.2;
    ctx.beginPath();
    for (let k = 0; k < n - 1; k++) {
      if (LY[k + 1] < LY[k] && LX[k] > src.x - span) { ctx.moveTo(LX[k], LY[k]); ctx.lineTo(LX[k + 1], LY[k + 1]); }
    }
    ctx.strokeStyle = rR;
    ctx.stroke();
    ctx.beginPath();
    for (let k = 0; k < n - 1; k++) {
      if (LY[k + 1] > LY[k] && LX[k] < src.x + span) { ctx.moveTo(LX[k], LY[k]); ctx.lineTo(LX[k + 1], LY[k + 1]); }
    }
    ctx.strokeStyle = rL;
    ctx.stroke();
  }
}

function fallsFor(L, off) {
  const F = L.falls, out = [];
  const k0 = Math.floor((off - 300) / F.cell), k1 = Math.ceil((off + W + 300) / F.cell);
  for (let k = k0; k <= k1; k++) {
    if (hash1(k, F.seed) > F.p) continue;
    // pour from a high shoulder of the hill so the water has a long drop
    let bx = 0, by = 1e9;
    for (let q = 0; q < 7; q++) {
      const wx = k * F.cell + 150 + (q / 6) * (F.cell - 300), y = layerY(L, wx);
      if (y < by) { by = y; bx = wx; }
    }
    const wx = bx + (hash1(k, F.seed + 1) < 0.5 ? -1 : 1) * F.off;
    const x = wx - off;
    if (x < -120 || x > W + 120) continue;
    const top = layerY(L, wx) + 4;
    const bottom = L.lake ? WL + 2 : VB + 10;
    if (bottom - top < 34) continue;
    out.push({ x, top, bottom, w: lerp(F.w0, F.w1, hash1(k, F.seed + 2)), k });
  }
  return out;
}
// a rocky gorge cut into the hillside behind the water
function cliffPath(f) {
  const { x, top, bottom, w, k } = f, p = new Path2D(), h = bottom - top;
  const j = (q) => (hash1(k * 13 + q, 401) - 0.5) * w * 0.5;
  p.moveTo(x - w * 1.5, top + 3);
  p.lineTo(x - w * 0.9 + j(1), top - 2);
  p.lineTo(x + w * 0.2 + j(2), top - 3);
  p.lineTo(x + w * 1.3 + j(3), top + 2);
  p.lineTo(x + w * 1.7 + j(4), top + h * 0.22);
  p.lineTo(x + w * 2.0 + j(5), top + h * 0.5);
  p.lineTo(x + w * 2.6 + j(6), bottom);
  p.lineTo(x - w * 2.5 + j(7), bottom);
  p.lineTo(x - w * 1.9 + j(8), top + h * 0.45);
  p.lineTo(x - w * 1.7 + j(9), top + h * 0.2);
  p.closePath();
  return p;
}
function drawFallBody(f, alpha) {
  const { x, top, bottom, w } = f;
  const wc = mix(mix(pal.fog, WHITE, 0.45), pal.sun, 0.1);
  const g = ctx.createLinearGradient(x - w * 0.66, 0, x + w * 0.66, 0);
  g.addColorStop(0, css(wc, 0.2 * alpha));
  g.addColorStop(0.28, css(wc, 0.82 * alpha));
  g.addColorStop(0.72, css(wc, 0.82 * alpha));
  g.addColorStop(1, css(wc, 0.2 * alpha));
  ctx.fillStyle = g;
  ctx.beginPath();
  ctx.moveTo(x - w / 2, top);
  ctx.quadraticCurveTo(x, top - 2.5, x + w / 2, top);
  ctx.lineTo(x + w * 0.66, bottom);
  ctx.lineTo(x - w * 0.66, bottom);
  ctx.closePath();
  ctx.fill();
}
function drawFalls(L, off, col) {
  const list = fallsFor(L, off);
  if (L.lake) lakeFalls.length = 0;
  if (!list.length) return;
  const rock = mix(col, pal.near, 0.32), src = lightSrc(), la = lightAmt();
  const speed = L.lake ? 150 : 240;
  const mistA = 1 - pal.stars * 0.55;
  for (const f of list) {
    const { x, top, bottom, w, k } = f;
    const cp = cliffPath(f);
    const fromLeft = src.x < x;
    const gr = ctx.createLinearGradient(x - w * 2.5, 0, x + w * 2.6, 0);
    const lit = mix(rock, mix(pal.glow, WHITE, 0.3), 0.18 * la), dark = mix(rock, [10, 14, 36], 0.25);
    gr.addColorStop(0, css(fromLeft ? lit : dark)); gr.addColorStop(1, css(fromLeft ? dark : lit));
    ctx.fillStyle = gr;
    ctx.fill(cp);
    if (L.lake) lakeFalls.push({ f, cp });
    drawFallBody(f, 1);
    // falling streaks
    ctx.lineCap = 'butt';
    ctx.strokeStyle = `rgba(255,255,255,${0.5 * mistA + 0.1})`;
    ctx.lineWidth = 1.1;
    const cols = Math.max(3, Math.round(w / 3));
    for (let s2 = 0; s2 < cols; s2++) {
      const t = (s2 + 0.5) / cols, h = hash1(k * 31 + s2, 77);
      const xs = x - w / 2 + t * w;
      ctx.setLineDash([10 + h * 26, 6 + h * 14]);
      ctx.lineDashOffset = -time * speed * (0.8 + h * 0.5);
      ctx.beginPath();
      ctx.moveTo(xs, top + 2);
      ctx.lineTo(xs + (t - 0.5) * w * 0.3, bottom);
      ctx.stroke();
    }
    ctx.setLineDash([]);
    ctx.lineDashOffset = 0;
    // bright lip where the water pours over
    ctx.strokeStyle = `rgba(255,255,255,${0.55 + 0.3 * mistA})`;
    ctx.lineWidth = 1.6;
    ctx.beginPath(); ctx.moveTo(x - w / 2, top); ctx.quadraticCurveTo(x, top - 2.5, x + w / 2, top); ctx.stroke();
    // spray where it lands
    const my = L.lake ? WL : Math.min(bottom, groundY(camX + x)) - 4;
    for (let m = 0; m < 6; m++) {
      const ph = time * 0.9 + m * 1.7 + k;
      const r = w * (1.3 + 0.5 * Math.sin(ph)) + m * 3;
      ctx.globalAlpha = (0.24 + 0.1 * Math.sin(ph * 1.3)) * mistA;
      ctx.drawImage(GLOW.white, x - r + Math.sin(ph) * w * 0.7, my - r * 0.8 - m * 3, r * 2, r * 1.5);
    }
    ctx.globalAlpha = 1;
  }
}

function drawWater() {
  const top = WL;
  const hor = mix(mix(pal.bot, pal.fog, 0.5), pal.far, 0.22);
  const deep = mix(mix(pal.mid, pal.top, 0.45), pal.near, 0.5);
  const g = ctx.createLinearGradient(0, top, 0, VB);
  g.addColorStop(0, css(hor)); g.addColorStop(1, css(deep));
  ctx.fillStyle = g;
  ctx.fillRect(-20, top, W + 40, VB - top + 20);
  if (volcK > 0.02) {
    // the lake is molten: white-hot at the far shore, cooling to a dark crust toward the viewer
    const lv = ctx.createLinearGradient(0, top, 0, VB);
    lv.addColorStop(0, `rgba(255,214,120,${0.95 * volcK})`); lv.addColorStop(0.12, `rgba(255,138,44,${0.95 * volcK})`);
    lv.addColorStop(0.5, `rgba(196,52,18,${0.92 * volcK})`); lv.addColorStop(1, `rgba(70,16,12,${0.9 * volcK})`);
    ctx.fillStyle = lv;
    ctx.fillRect(-20, top, W + 40, VB - top + 20);
    // plates of cooled crust drifting on it
    ctx.fillStyle = `rgba(34,14,14,${0.5 * volcK})`;
    for (let r = 0; r < 5; r++) {
      const t = r / 4, y = top + 10 + t * t * 130 + r * 7, sp = 0.17 + 0.1 * t, cell = 150 + r * 80, off = camX * sp + time * (2 + r);
      for (let k = Math.floor((off - 200) / cell), k1 = Math.ceil((off + W + 200) / cell); k <= k1; k++) {
        if (hash1(k, 911 + r) > 0.6) continue;
        const x = k * cell + hash1(k, 912 + r) * cell * 0.5 - off, w = (40 + hash1(k, 913 + r) * 90) * (0.6 + t);
        ctx.beginPath(); ctx.ellipse(x, y, w * 0.5, 2 + t * 5, 0, 0, TAU); ctx.fill();
      }
    }
  }
  ctx.save();
  ctx.beginPath(); ctx.rect(-20, top, W + 40, VB - top + 20); ctx.clip();
  // mirrored ranges and clouds, then the far shore, trees and waterfalls
  if (Sky.ok) Sky.reflect(ctx, top, 0.4 * (1 - 0.8 * volcK));
  if (lakePath) {
    ctx.save();
    ctx.translate(0, 2 * top);
    ctx.scale(1, -1);
    drawBgBalloons(0, 0.34);
    drawBgKites(0, 0.34);
    const rc = mix(lakeCol, hor, 0.3);
    ctx.fillStyle = css(rc, 0.78 * (1 - 0.8 * volcK));
    ctx.fill(lakePath);
    for (const lf of lakeFalls) { ctx.fillStyle = css(mix(rc, [10, 14, 36], 0.15), 0.78); ctx.fill(lf.cp); drawFallBody(lf.f, 0.42); }
    ctx.restore();
  }
  // 1900s city harbor gaslight window reflections shimmering on the water
  if (cityK > 0.04) {
    const L2 = LAYERS[2], off2 = camX * L2.par, sp2 = 38;
    const k0 = Math.floor((off2 - 60) / sp2), k1 = Math.ceil((off2 + W + 60) / sp2);
    ctx.fillStyle = css([255, 206, 112], (0.20 + 0.25 * pal.stars) * cityK);
    for (let k = k0; k <= k1; k++) {
      if (hash1(k, 619) < 0.35) continue;
      const wx = k * sp2 - off2;
      for (let r = 0; r < 5; r++) {
        const wy = top + 4 + r * 6 + hash1(k * 7 + r, 623) * 4;
        const ox = Math.sin(time * 2.4 + k + r * 1.3) * (2 + r * 0.8);
        ctx.fillRect(wx + ox - 3, wy, 6 - r * 0.6, 1.5);
      }
    }
  }
  // ripples break up the reflection
  ctx.fillStyle = css(hor, 0.14);
  for (let y = top + 2; y < top + 150; y += 3 + (y - top) * 0.05) ctx.fillRect(-20, y, W + 40, 1);
  ctx.strokeStyle = css(mix(hor, WHITE, 0.5), 0.2);
  ctx.lineWidth = 1;
  ctx.beginPath();
  const span = W + 200;
  for (let r = 0; r < 18; r++) {
    const t = r / 18, y = top + 4 + Math.pow(t, 1.6) * (VB - top - 4), sp = 0.16 + 0.14 * t;
    for (let s2 = 0; s2 < 4; s2++) {
      let x = (hash1(r * 7 + s2, 501) * span - camX * sp - time * 8 * (1 + t)) % span;
      if (x < 0) x += span;
      x -= 100;
      const len = 14 + hash1(r * 7 + s2, 502) * 60 * (0.3 + t);
      ctx.moveTo(x, y); ctx.lineTo(x + len, y);
    }
  }
  ctx.stroke();
  if (polarK > 0.02) {
    // pack ice: flat white floes, smaller and closer together toward the far shore
    const ice = mix(pal.near, WHITE, 0.25), edge = mix(pal.near, [30, 50, 90], 0.35);
    for (let r = 0; r < 4; r++) {
      const t = r / 3, y = top + 5 + t * t * 120 + r * 6, sp = 0.17 + 0.1 * t, cell = 120 + r * 70;
      const off = camX * sp + time * (3 + r);
      const k0 = Math.floor((off - 200) / cell), k1 = Math.ceil((off + W + 200) / cell);
      for (let k = k0; k <= k1; k++) {
        if (hash1(k, 811 + r) > 0.55) continue;
        const x = k * cell + hash1(k, 812 + r) * cell * 0.6 - off, w = (24 + hash1(k, 813 + r) * 70) * (0.6 + t), h = (2.5 + t * 4) * (0.8 + hash1(k, 814 + r) * 0.6);
        const bob = Math.sin(time * 0.8 + k) * 0.6;
        ctx.globalAlpha = polarK;
        ctx.fillStyle = css(edge, 0.55);
        ctx.beginPath(); ctx.ellipse(x, y + h * 0.9 + bob, w * 0.52, h * 0.6, 0, 0, TAU); ctx.fill();
        ctx.fillStyle = css(ice, 0.95);
        ctx.beginPath();
        ctx.moveTo(x - w / 2, y + bob); ctx.lineTo(x - w * 0.3, y - h * 0.6 + bob); ctx.lineTo(x + w * 0.35, y - h * 0.5 + bob); ctx.lineTo(x + w / 2, y + bob); ctx.lineTo(x + w * 0.2, y + h * 0.7 + bob); ctx.lineTo(x - w * 0.35, y + h * 0.6 + bob);
        ctx.closePath(); ctx.fill();
      }
    }
    ctx.globalAlpha = 1;
  }
  // sun or moon glitter
  const src = lightSrc(), la = sun.a >= moon.a ? sun.a : moon.a * 0.7;
  if (la > 0.05) {
    ctx.globalCompositeOperation = 'lighter';
    ctx.globalAlpha = la * (sun.a >= moon.a ? 0.3 : 0.22) * (1 - stormAmt() * 0.7);
    ctx.drawImage(sun.a >= moon.a ? GLOW.warm : GLOW.bolt, src.x - 120, top - 70, 240, VB - top + 150);
    ctx.globalAlpha = 1;
    ctx.fillStyle = css(sun.a >= moon.a ? mix(pal.glow, WHITE, 0.45) : [210, 222, 255]);
    const seedT = Math.floor(time * 5);
    for (let k = 0; k < 60; k++) {
      const t = k / 60, y = top + 1 + Math.pow(t, 1.4) * (VB - top);
      const spread = 6 + t * 120, len = 3 + t * 16;
      const x = src.x + (hash1(k, seedT + k) - 0.5) * spread * 2;
      ctx.globalAlpha = la * (1 - t) * 0.6 * (0.4 + 0.6 * hash1(k, seedT * 3 + 1));
      ctx.fillRect(x - len / 2, y, len, 1 + t);
    }
    ctx.globalAlpha = 1;
    ctx.globalCompositeOperation = 'source-over';
  }
  ctx.restore();
  // haze where the water meets the far shore
  const hg = ctx.createLinearGradient(0, top - 26, 0, top + 34);
  hg.addColorStop(0, css(pal.fog, 0)); hg.addColorStop(0.45, css(pal.fog, 0.38)); hg.addColorStop(1, css(pal.fog, 0));
  ctx.fillStyle = hg;
  ctx.fillRect(-20, top - 26, W + 40, 60);
  if (volcK > 0.02) {
    // heat glow rising off the lava
    const hv = ctx.createLinearGradient(0, top - 150, 0, top + 30);
    hv.addColorStop(0, 'rgba(255,110,40,0)'); hv.addColorStop(0.8, `rgba(255,130,50,${0.3 * volcK})`); hv.addColorStop(1, 'rgba(255,150,60,0)');
    ctx.globalCompositeOperation = 'lighter';
    ctx.fillStyle = hv;
    ctx.fillRect(-20, top - 150, W + 40, 180);
    ctx.globalCompositeOperation = 'source-over';
  }
}
function drawFog(i) {
  const L = LAYERS[i];
  const y0 = L.base - L.amp * 0.45, y1 = L.base + 50;
  const g = ctx.createLinearGradient(0, y0, 0, y1);
  const a = 0.5 - i * 0.04;
  g.addColorStop(0, css(pal.fog, 0)); g.addColorStop(1, css(pal.fog, a));
  ctx.fillStyle = g;
  ctx.fillRect(-20, y0, W + 40, VB - y0 + 20);
}
function drawBgBolt() {
  const a = clamp(bgBolt.t / 0.22, 0, 1);
  ctx.globalCompositeOperation = 'lighter';
  ctx.lineJoin = 'round';
  ctx.strokeStyle = `rgba(170,190,255,${0.35 * a})`; ctx.lineWidth = 5;
  ctx.beginPath(); polyLine(bgBolt.b.main); ctx.stroke();
  ctx.strokeStyle = `rgba(240,245,255,${0.8 * a})`; ctx.lineWidth = 1.4;
  ctx.beginPath(); polyLine(bgBolt.b.main); for (const br of bgBolt.b.branches) polyLine(br); ctx.stroke();
  ctx.globalCompositeOperation = 'source-over';
}
function polyLine(p) { ctx.moveTo(p[0], p[1]); for (let i = 2; i < p.length; i += 2) ctx.lineTo(p[i], p[i + 1]); }
function drawFlock() {
  if (!flock || flock.a < 0.01) return;
  ctx.strokeStyle = css(mix(pal.near, pal.far, 0.55), 0.85 * flock.a);
  ctx.lineWidth = 1.4; ctx.lineCap = 'round';
  ctx.beginPath();
  for (const b of flock.birds) {
    const x = flock.x + b.dx, y = flock.y + b.dy, f = Math.sin(time * 8 + b.ph) * 3;
    ctx.moveTo(x - 5, y - 2 - f); ctx.quadraticCurveTo(x - 2, y - 1, x, y); ctx.quadraticCurveTo(x + 2, y - 1, x + 5, y - 2 - f);
  }
  ctx.stroke();
}
function drawFireflies() {
  if (!flies.length) return;
  ctx.globalCompositeOperation = 'lighter';
  for (const f of flies) {
    const a = f.a * (0.35 + 0.65 * Math.max(0, Math.sin(time * 2.2 + f.ph)));
    if (a < 0.03) continue;
    ctx.globalAlpha = a;
    ctx.drawImage(GLOW.fly, f.x - 9, f.y - 9, 18, 18);
  }
  ctx.globalAlpha = 1;
  ctx.globalCompositeOperation = 'source-over';
}
