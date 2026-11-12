// Süzülüş — Obstacles, collectibles and the spawn patterns that place them
'use strict';

/* =========================================================
   Obstacles + items
   ========================================================= */
function mkObs(type, o) {
  o.type = type; o.passed = false; o.near = 1e9; o.dead = false; o.dodged = false; o.touched = false;
  if (o.ox === undefined) { o.ox = 0; o.oy = 0; }
  obstacles.push(o);
  return o;
}
function addCactus(x, h0) {
  const gy = groundY(x), h = clamp(h0 * 0.8, 95, 185), tw = 9 + h * 0.03, aw = tw * 0.75;
  const seed = (Math.abs(Math.round(x * 1.31)) % 9973) + 1;
  const polys = [[x - tw, gy + 10, x - tw, gy - h + tw, x + tw, gy - h + tw, x + tw, gy + 10]];
  const arms = [];
  if (h > 110) arms.push([-1, gy - h * rand(0.42, 0.55), h * rand(0.2, 0.3)]);
  if (Math.random() < 0.8) arms.push([1, gy - h * rand(0.5, 0.65), h * rand(0.18, 0.28)]);
  for (const [sd, ay, ah] of arms) {
    const cx = x + sd * (tw + 14), a = Math.min(x, cx), b = Math.max(x, cx);
    polys.push([a, ay - aw, b, ay - aw, b, ay + aw, a, ay + aw]);
    polys.push([cx - aw, ay + aw, cx - aw, ay - ah, cx + aw, ay - ah, cx + aw, ay + aw]);
  }
  return mkObs('cactus', { x, gy, h, tw, aw, seed, arms, polys, minX: x - tw - 30, maxX: x + tw + 30 });
}
function addBuilding(x, h) {
  const gy = groundY(x), seed = (Math.abs(Math.round(x * 1.49)) % 9973) + 1;
  const kind = seed % 4; // 0: Clock Tower, 1: Mansard Apartment, 2: Stepped-Gable Townhouse, 3: Domed Pavilion
  const bw = kind === 0 ? rand(68, 86) : kind === 1 ? rand(88, 114) : kind === 2 ? rand(76, 98) : rand(82, 106);
  const roofH = kind === 0 ? h * 0.34 : kind === 1 ? h * 0.22 : kind === 2 ? h * 0.28 : h * 0.28;
  const top = gy - h, eaveY = top + roofH, hw = bw * 0.5;
  let pts;
  if (kind === 0) {
    // Clock tower with steep spire roof
    pts = [x - hw, gy + 36, x - hw, eaveY, x - hw * 0.65, eaveY - roofH * 0.25, x, top, x + hw * 0.65, eaveY - roofH * 0.25, x + hw, eaveY, x + hw, gy + 36];
  } else if (kind === 1) {
    // Belle Époque Mansard roof apartment
    pts = [x - hw, gy + 36, x - hw, eaveY, x - hw * 0.78, top + 6, x + hw * 0.78, top + 6, x + hw, eaveY, x + hw, gy + 36];
  } else if (kind === 2) {
    // Stepped-gable 1900s townhouse
    pts = [x - hw, gy + 36, x - hw, eaveY, x - hw * 0.65, eaveY - roofH * 0.38, x - hw * 0.32, eaveY - roofH * 0.72, x, top, x + hw * 0.32, eaveY - roofH * 0.72, x + hw * 0.65, eaveY - roofH * 0.38, x + hw, eaveY, x + hw, gy + 36];
  } else {
    // Domed pavilion building
    pts = [x - hw, gy + 36, x - hw, eaveY, x - hw * 0.72, eaveY - roofH * 0.45, x, top, x + hw * 0.72, eaveY - roofH * 0.45, x + hw, eaveY, x + hw, gy + 36];
  }
  return mkObs('building', { x, gy, top, eaveY, h, bw, roofH, kind, seed, polys: [pts], minX: x - hw - 14, maxX: x + hw + 14 });
}
function addKite(x, y) {
  const R = rand(38, 48);
  const seed = (Math.abs(Math.round(x * 1.61 + y * 2.31)) % 9973) + 1;
  const scheme = seed % 6;
  const kind = seed % 3; // 0: Classic Diamond Kite, 1: 1900s Hargrave Box Kite, 2: Hexagonal Sunburst Kite
  const bob = rand(24, 38), ph = rand(0, TAU), vx = rand(-18, -4);
  return mkObs('kite', {
    x, y, oy: y, R, seed, scheme, kind, bob, ph, vx, sway: 0,
    minX: x - R * 1.35, maxX: x + R * 1.35,
  });
}
function addPine(x, h) {
  if (CITY) return addBuilding(x, h * 1.15);
  if (CANYON) return addCactus(x, h);
  if (VOLCANO) return addSpire(x, h * 0.92);
  const gy = groundY(x), w = h * rand(0.42, 0.48), seed = (Math.abs(Math.round(x * 1.37)) % 9973) + 1;
  return mkObs('pine', { x, gy, h, w, seed, polys: [[x - w * 0.42, gy + 10, x, gy - h + 4, x + w * 0.42, gy + 10]], minX: x - w * 0.56, maxX: x + w * 0.56 });
}
function addSpire(x, h) {
  if (CITY) return addBuilding(x, h);
  const gy = groundY(x), top = gy - h, bw = rand(78, 114), n = 7, pts = [], lPts = [], rPts = [], mPts = [];
  const seed = (Math.abs(Math.round(x * 1.53)) % 9973) + 1;
  const px = x + rand(-bw * 0.09, bw * 0.09);
  for (let i = 0; i <= n; i++) {
    const t = i / n, yy = lerp(gy + 42, top + 14, t);
    const flare = t < 0.25 ? (0.25 - t) * 0.45 : 0;
    const stepJag = (i > 0 && i < n) ? (hash1(seed, i * 3) - 0.5) * 9 : 0;
    const half = (bw / 2) * (1 - 0.62 * Math.pow(t, 0.88) + flare);
    const lx = x - half + stepJag;
    pts.push(lx, yy);
    lPts.push(lx, yy);
  }
  pts.push(px - bw * 0.08, top + 7, px, top, px + bw * 0.07, top + 6);
  for (let i = n; i >= 0; i--) {
    const t = i / n, yy = lerp(gy + 42, top + 14, t) + (i && i < n ? (hash1(seed, i * 5 + 1) - 0.5) * 8 : 0);
    const flare = t < 0.25 ? (0.25 - t) * 0.45 : 0;
    const stepJag = (i > 0 && i < n) ? (hash1(seed, i * 7 + 2) - 0.5) * 9 : 0;
    const half = (bw / 2) * (1 - 0.62 * Math.pow(t, 0.88) + flare);
    const rx = x + half + stepJag;
    pts.push(rx, yy);
    rPts.unshift(rx, yy);
  }
  // central crag spine splitting the spire into sunlit and shadowed 3D rock facets
  mPts.push(px, top);
  for (let i = n; i >= 0; i--) {
    const t = i / n, yy = lerp(gy + 42, top + 14, t);
    const off = (hash1(seed, i * 11 + 9) - 0.48) * bw * 0.22 * (1 - 0.5 * t);
    mPts.push(lerp(x, px, t) + off, yy);
  }
  const ledges = [];
  for (let i = 0; i < 5; i++) ledges.push([rand(0.18, 0.86), rand(-0.25, 0.25), rand(0.35, 0.75)]);
  const boulders = [
    [-bw * rand(0.36, 0.5), rand(18, 30), rand(14, 24)],
    [bw * rand(0.34, 0.48), rand(16, 28), rand(12, 22)],
  ];
  return mkObs('spire', { x, gy, top, h, bw, px, seed, polys: [pts], lPts, rPts, mPts, ledges, boulders, minX: x - bw * 0.65, maxX: x + bw * 0.65 });
}
function addFloating(x, y) {
  const ww = rand(160, 236), depth = rand(92, 138), pts = [], topPts = [], n = 8;
  const seed = (Math.abs(Math.round(x * 1.71 + y * 2.9)) % 9973) + 1;
  for (let i = 0; i <= n; i++) {
    const tx = -ww / 2 + (ww * i) / n;
    const ty = i === 0 || i === n ? 5 : rand(-4, 2);
    pts.push(tx, ty);
    topPts.push(tx, ty);
  }
  const tip = rand(-ww * 0.1, ww * 0.1);
  const subL = -ww * rand(0.22, 0.30), subLDepth = depth * rand(0.62, 0.76);
  const subR = ww * rand(0.22, 0.30), subRDepth = depth * rand(0.60, 0.74);
  const under = [
    ww * 0.48, 16,
    ww * 0.41, 32 + rand(0, 8),
    subR + 12, subRDepth * 0.72,
    subR, subRDepth,
    subR - 11, subRDepth * 0.84,
    tip + 22, depth * 0.76,
    tip, depth,
    tip - 18, depth * 0.74,
    subL + 11, subLDepth * 0.82,
    subL, subLDepth,
    subL - 12, subLDepth * 0.70,
    -ww * 0.41, 30 + rand(0, 8),
    -ww * 0.48, 15,
  ];
  for (let i = 0; i < under.length; i++) pts.push(under[i]);
  // 3 internal ridge lines from plateau rim to lower crag tips for 3D rock facets
  const rL = [topPts[4], topPts[5], subL - 6, subLDepth * 0.42, subL + 4, subLDepth * 0.74, subL, subLDepth];
  const rM = [topPts[8], topPts[9], tip - 8, depth * 0.36, tip + 7, depth * 0.66, tip, depth];
  const rR = [topPts[12], topPts[13], subR + 6, subRDepth * 0.42, subR - 4, subRDepth * 0.74, subR, subRDepth];
  const polys = [pts], trees = [];
  const nt = rint(1, 3);
  for (let i = 0; i < nt; i++) {
    const tx = lerp(-ww * 0.28, ww * 0.28, nt === 1 ? rand(0.3, 0.7) : (i + rand(0.15, 0.85)) / nt);
    const th = rand(44, 76), tw = th * rand(0.42, 0.48);
    trees.push([tx, th, tw, seed + i * 37]);
    polys.push([tx - tw * 0.42, 2, tx, -th + 4, tx + tw * 0.42, 2]);
  }
  // hanging roots anchored along the lower cliff crags so they dangle below the island into open air
  const roots = [];
  const anchors = [
    [subL, subLDepth - 6], [subL * 0.55, depth * 0.64], [tip, depth - 5],
    [subR * 0.55, depth * 0.62], [subR, subRDepth - 6], [rand(-ww * 0.34, ww * 0.34), depth * 0.52],
  ];
  for (const [rx, ry] of anchors) {
    roots.push([rx + rand(-6, 6), ry, rand(22, 48), rand(-11, 11)]);
  }
  // small hovering satellite rock fragments beneath the island
  const shards = [];
  const nsh = rint(3, 5);
  for (let i = 0; i < nsh; i++) {
    const sx = rand(-ww * 0.42, ww * 0.42);
    const sy = depth * (0.58 + 0.42 * (1 - Math.abs(sx) / (ww * 0.5))) + rand(12, 34);
    shards.push([sx, sy, rand(6, 13), rand(8, 17), rand(-0.35, 0.35), rand(0, TAU)]);
  }
  return mkObs('float', { x, y, ww, depth, tip, subL, subLDepth, subR, subRDepth, topPts, rL, rM, rR, seed, polys, trees, roots, shards, ox: x, oy: y, bob: rand(5, 11), ph: rand(0, TAU), minX: x - ww / 2 - 12, maxX: x + ww / 2 + 12 });
}
function addHanging(x, bottom) {
  const bw = rand(136, 186), T = -2400;
  const seed = (Math.abs(Math.round(x * 1.91)) % 9973) + 1;
  const pts = [
    x - bw / 2, T, x + bw / 2, T,
    x + bw * 0.5 + rand(-4, 4), bottom - 155,
    x + bw * 0.42, bottom - 94,
    x + bw * 0.31, bottom - 64,
    x + bw * 0.24, bottom - 28,
    x + bw * 0.15, bottom - 58,
    x + bw * 0.06, bottom - 26,
    x - 2, bottom,
    x - bw * 0.12, bottom - 38,
    x - bw * 0.24, bottom - 54,
    x - bw * 0.31, bottom - 22,
    x - bw * 0.38, bottom - 64,
    x - bw * 0.46, bottom - 102,
    x - bw * 0.5 + rand(-4, 4), bottom - 162,
  ];
  const vines = [
    [x - bw * 0.31, bottom - 24, rand(22, 42), rand(-8, 8)],
    [x - 2, bottom - 3, rand(26, 48), rand(-10, 10)],
    [x + bw * 0.24, bottom - 30, rand(20, 38), rand(-8, 8)],
  ];
  return mkObs('hang', { x, bottom, bw, seed, vines, polys: [pts], minX: x - bw / 2 - 8, maxX: x + bw / 2 + 8 });
}
function addHawk(meetX, y) {
  // place the hawk so that it meets the bird roughly at meetX
  const sp = rand(170, 240), bs = Math.max(200, bird.speed), r = sp / (bs + sp);
  const hx = Math.max(meetX + 200, (meetX - bird.x * r) / (1 - r));
  return mkObs('hawk', { x: hx, y, y0: y, sp, amp: rand(22, 56), ph: rand(0, TAU), flap: rand(0, TAU), minX: hx - 28, maxX: hx + 28, cried: false });
}
function addStorm(x, w) {
  const cloud = { w: w * 1.16, h: w * 0.40, storm: true };
  buildCloud(cloud);
  const sc = cloudColors(true);
  tintCloud(cloud, sc[0], sc[1]);
  return mkObs('storm', { x, y: rand(70, 120), w, cloud, st: 'idle', tm: rand(0.2, 0.8), bolt: null, boltX: x, minX: x - w / 2, maxX: x + w / 2 });
}
function addBalloon(x, y) {
  const R = rand(46, 56);
  const seed = (Math.abs(Math.round(x * 1.43 + y * 2.17)) % 9973) + 1;
  const scheme = seed % 6;
  const bob = rand(20, 34), ph = rand(0, TAU), vx = rand(-24, -6);
  return mkObs('balloon', {
    x, y, oy: y, R, seed, scheme, bob, ph, vx,
    burner: 0.4, sway: 0, whooshed: false,
    minX: x - R * 1.05, maxX: x + R * 1.05,
  });
}
// a vent in the valley floor that throws up a column of lava every few seconds
function addGeyser(x) {
  return mkObs('geyser', { x, gy: groundY(x), h: rand(230, 330), st: 'idle', tm: rand(0.2, 0.9), k: 0, ph: rand(0, TAU), minX: x - 36, maxX: x + 36 });
}
function makeBolt(x, y0, y1) {
  const main = [x, y0];
  let cx = x, cy = y0;
  while (cy < y1) { cy = Math.min(y1, cy + rand(22, 40)); cx = clamp(cx + rand(-16, 16), x - 40, x + 40); main.push(cx, cy); }
  const branches = [];
  for (let b = 0; b < 2; b++) {
    const k = 2 + 2 * rint(1, Math.max(1, (main.length >> 1) - 3));
    if (k >= main.length - 2) continue;
    let bx = main[k], by = main[k + 1];
    const dir = Math.random() < 0.5 ? -1 : 1, br = [bx, by];
    for (let i = 0; i < 3; i++) { bx += dir * rand(10, 22); by += rand(14, 26); br.push(bx, by); }
    branches.push(br);
  }
  return { main, branches };
}
function obsDist(o, px, py) {
  if (o.type === 'hawk') return Math.hypot(px - o.x, py - o.y) - 17;
  if (o.type === 'geyser') return o.k > 0.06 ? Math.sqrt(segD2(px, py, o.x, o.gy, o.x, o.gy - o.h * o.k)) - 13 : 1e9;
  if (o.type === 'storm') return o.st === 'strike' && o.bolt ? lineDist(px, py, o.bolt.main) - 7 : 1e9;
  if (o.type === 'balloon') {
    const R = o.R, oy = o.oy;
    const d1 = Math.hypot(px - o.x, py - (oy - R * 0.16)) - R * 0.90;
    const d2 = Math.hypot(px - o.x, py - (oy + R * 0.36)) - R * 0.56;
    const bx = o.x - Math.sin(o.sway || 0) * R * 0.45;
    const d3 = Math.sqrt(segD2(px, py, o.x, oy + R * 0.76, bx, oy + R * 1.38)) - R * 0.24;
    return Math.min(d1, d2, d3);
  }
  if (o.type === 'kite') {
    const R = o.R, oy = o.oy;
    const d1 = Math.hypot(px - o.x, py - oy) - R * 0.82;
    const tx = o.x - R * 0.9, ty = oy + R * 1.35;
    const d2 = Math.sqrt(segD2(px, py, o.x, oy + R * 0.75, tx, ty)) - R * 0.22;
    return Math.min(d1, d2);
  }
  const lx = px - o.ox, ly = py - o.oy;
  let b = 1e9;
  for (const p of o.polys) { const d = polyDist(lx, ly, p); if (d < b) b = d; }
  return b;
}
function addFeather(x, y) {
  y = clamp(y, 70, groundY(x) - 46);
  for (const o of obstacles) {
    if (o.type === 'hawk' || o.type === 'storm' || o.dead) continue;
    if (x < o.minX - 30 || x > o.maxX + 30) continue;
    if (obsDist(o, x, y) < 30) return;
  }
  items.push({ type: 'feather', x, y, ph: rand(0, TAU), taken: false, t: 0 });
}
function featherArc(x0, x1, y, bulge) {
  const n = Math.max(3, Math.floor((x1 - x0) / 55));
  for (let i = 0; i < n; i++) { const t = i / (n - 1); addFeather(lerp(x0, x1, t), y - Math.sin(t * Math.PI) * bulge); }
}
function featherLine(x0, x1, y, n) {
  for (let i = 0; i < n; i++) addFeather(lerp(x0, x1, n > 1 ? i / (n - 1) : 0.5), y);
}

/* patterns */
const difficulty = () => clamp(dist / 60000, 0, 1);
// 300 at the start, ~450 after 3 km, ~620 after 10 km, easing toward 720
// a flight starts faster the higher the account level, and keeps gathering speed with every kilometre
const startSpeed = () => 300 + 6 * (Math.min(runLvl, 31) - 1);
const cruiseSpeed = () => { const s0 = startSpeed(); return s0 + (740 + 3 * (runLvl - 1) - s0) * (1 - Math.exp(-dist / 45000)); };
const PATTERNS = {
  trees(x, d) {
    const n = rint(1, d > 0.4 ? 3 : 2);
    let cx = x, topY = VB;
    for (let i = 0; i < n; i++) {
      const h = rand(120, 190 + 90 * d);
      addPine(cx, h);
      topY = Math.min(topY, groundY(cx) - h);
      cx += rand(90, 160);
    }
    featherArc(x - 60, cx - 40, topY - 60, 36);
    return cx;
  },
  spire(x, d) {
    const s = addSpire(x + 40, rand(190, 290 + 90 * d));
    featherArc(x - 80, x + 160, s.top - 60, 40);
    return x + 120;
  },
  floating(x) {
    const gy = groundY(x + 120);
    const y = rand(170, Math.min(420, gy - 270));
    const o = addFloating(x + 120, y);
    const below = gy - (y + o.depth + 15), above = y - 90;
    if (below > above) featherLine(x - 20, x + 260, y + o.depth + below * 0.5, 6);
    else featherArc(x - 20, x + 260, y - 110, 26);
    return x + 120 + o.ww / 2;
  },
  balloon(x, d) {
    const gy1 = groundY(x + 110);
    const y1 = rand(150, Math.min(390, gy1 - 190));
    const b1 = addBalloon(x + 110, y1);
    const below = gy1 - (y1 + b1.R * 1.5), above = y1 - b1.R * 1.1 - 70;
    if (below > above) featherArc(x - 20, x + 240, y1 + b1.R * 1.78, -24);
    else featherArc(x - 20, x + 240, Math.max(85, y1 - b1.R * 1.38), 28);
    if (d > 0.22 && Math.random() < 0.52) {
      const x2 = x + rand(310, 390), gy2 = groundY(x2);
      const y2 = clamp(y1 > 270 ? y1 - rand(130, 185) : y1 + rand(130, 185), 140, Math.min(410, gy2 - 180));
      const b2 = addBalloon(x2, y2);
      featherLine(x + 210, x2 + 90, clamp((y1 + y2) * 0.5, 110, gy2 - 120), 4);
      return x2 + b2.R + 60;
    }
    return x + 110 + b1.R + 60;
  },
  kite(x, d) {
    const gy1 = groundY(x + 110);
    const y1 = rand(140, Math.min(390, gy1 - 210));
    const k1 = addKite(x + 110, y1);
    const below = gy1 - (y1 + k1.R * 1.7), above = y1 - k1.R * 1.2 - 70;
    if (below > above) featherArc(x - 20, x + 240, y1 + k1.R * 1.85, -24);
    else featherArc(x - 20, x + 240, Math.max(85, y1 - k1.R * 1.45), 28);
    if (Math.random() < 0.65) {
      const x2 = x + rand(260, 340), gy2 = groundY(x2);
      const y2 = clamp(y1 > 260 ? y1 - rand(110, 165) : y1 + rand(110, 165), 130, Math.min(400, gy2 - 190));
      const k2 = addKite(x2, y2);
      featherLine(x + 190, x2 + 80, clamp((y1 + y2) * 0.5, 110, gy2 - 130), 4);
      return x2 + k2.R + 60;
    }
    return x + 110 + k1.R + 60;
  },
  cityblock(x, d) {
    const n = rint(2, 3);
    let cx = x, topY = VB;
    for (let i = 0; i < n; i++) {
      const h = rand(165, 255 + 75 * d);
      const b = addBuilding(cx, h);
      topY = Math.min(topY, b.top);
      cx += b.bw + rand(28, 64);
    }
    featherArc(x - 50, cx - 30, Math.max(85, topY - 62), 38);
    if (!isFoulFlyWeather() && Math.random() < 0.6) addKite(cx + rand(90, 150), clamp(topY - rand(40, 110), 130, 340));
    return cx + 140;
  },
  gate(x, d) {
    const gap = lerp(255, 198, d), gy = groundY(x + 60);
    const c = rand(90 + gap / 2, gy - 95 - gap / 2);
    addSpire(x + 60, gy - (c + gap / 2));
    if (CITY && !isFoulFlyWeather()) addKite(x + 60 + rand(-10, 20), Math.max(95, c - gap / 2 - 36));
    else addHanging(x + 60 + rand(-12, 12), c - gap / 2);
    featherLine(x - 80, x + 200, c, 6);
    return x + 160;
  },
  hawk(x, d) {
    const y1 = rand(130, 470);
    addHawk(x + 120, y1);
    if (d > 0.5 && Math.random() < 0.5) {
      const y2 = clamp(y1 > 300 ? y1 - rand(220, 280) : y1 + rand(220, 280), 100, 500);
      addHawk(x + 330, y2);
      return x + 430;
    }
    return x + 240;
  },
  geyser(x, d) {
    const g = addGeyser(x + 90);
    featherLine(x - 40, x + 220, g.gy - rand(120, 200), 5);
    if (d > 0.25 && Math.random() < 0.55) { addGeyser(x + 90 + rand(230, 300)); return x + 420; }
    return x + 200;
  },
  storm(x) {
    const w = rand(250, 320);
    addStorm(x + w / 2, w);
    featherLine(x + 30, x + w - 30, groundY(x + w / 2) - 90, 5);
    return x + w;
  },
  ring(x) {
    const rx = x + 230, y = rand(160, groundY(rx) - 150);
    featherLine(x, rx - 70, y, 4);
    items.push({ type: 'ring', x: rx, y, ry: 58, done: false, ok: false, t: 0 });
    featherLine(rx + 70, rx + 210, y, 3);
    return rx + 230;
  },
  slowring(x) {
    const rx = x + 200, y = rand(170, groundY(rx) - 150);
    featherLine(x, rx - 70, y, 3);
    items.push({ type: 'ring', slow: true, x: rx, y, ry: 58, done: false, ok: false, t: 0 });
    return rx + 200;
  },
  feathers(x) {
    const n = rint(7, 12), y0 = rand(170, 420), amp = rand(30, 80);
    for (let i = 0; i < n; i++) addFeather(x + i * 46, y0 + Math.sin(i * 0.6) * amp);
    if (Math.random() < 0.14) items.push({ type: 'orb', x: x + n * 46 + 70, y: clamp(y0, 120, groundY(x + n * 46 + 70) - 80), ph: rand(0, TAU), taken: false, t: 0 });
    return x + n * 46;
  },
  thermal(x, d) {
    // a column of warm rising air with a trail of feathers spiralling up it
    const tx = x + 180, w = rand(190, 260), top = rand(110, 190);
    items.push({ type: 'thermal', x: tx, w, top, ph: rand(0, TAU), used: false });
    const gy = groundY(tx);
    for (let y = gy - 130, i = 0; y > top + 50; y -= 52, i++) addFeather(tx + Math.sin(i * 1.3) * w * 0.25, y);
    if (d > 0.3 && Math.random() < 0.5) addPine(tx + w / 2 + rand(120, 180), rand(150, 220));
    return tx + w / 2 + 120;
  },
  combo(x, d) {
    const e = PATTERNS.spire(x, d);
    if (CITY && !isFoulFlyWeather()) return PATTERNS.kite(e + rand(160, 220), d);
    if (CITY) return PATTERNS.cityblock(e + rand(160, 220), d);
    if (!CANYON && !POLAR && !VOLCANO && !isFoulFlyWeather() && Math.random() < 0.5) return PATTERNS.balloon(e + rand(170, 230), d);
    return PATTERNS.floating(e + rand(170, 240), d);
  },
};
function pickPattern(d) {
  const storm = weather.type === 'rain' ? weather.amt : 0;
  const isForest = !CITY && !CANYON && !POLAR && !VOLCANO;
  const foul = isFoulFlyWeather();
  const table = [
    ['trees', 2.8], ['spire', 1.6 + 1.5 * d], ['floating', CITY ? 0 : 1.7],
    ['balloon', isForest && !foul ? 2.6 + 1.2 * d : 0],
    ['kite', CITY && !foul ? 3.2 + 1.4 * d : 0],
    ['cityblock', CITY ? 2.6 + 1.2 * d : 0],
    ['gate', d > 0.08 ? 0.6 + 2.4 * d : 0],
    ['hawk', d > 0.04 ? 0.8 + 1.8 * d : 0],
    ['storm', d > 0.1 && storm > 0.3 ? (0.45 + 1.2 * d) * (1 + 3 * storm) : 0],
    ['geyser', VOLCANO ? 3 + 1.5 * d : 0],
    ['ring', 1.3], ['slowring', 0.5 + 0.9 * d], ['feathers', 1.5], ['thermal', VOLCANO ? 2.4 : 1.5],
    ['combo', d > 0.35 ? 1.6 * d : 0],
  ];
  let total = 0;
  for (const r of table) { if (r[0] === lastPattern && samePattern >= 1) r[1] = 0; total += r[1]; }
  let k = Math.random() * total;
  for (const r of table) { k -= r[1]; if (k <= 0) return r[0]; }
  return 'trees';
}
function spawnAhead() {
  const d = difficulty();
  while (spawnX < camX + W + 650) {
    // keep the air around the next portal clear
    const gate = startX + biome.n * PORTAL_GAP;
    if (spawnX > gate - 950 && spawnX < gate + 320) { spawnX = gate + 320; continue; }
    const name = pickPattern(d);
    samePattern = name === lastPattern ? samePattern + 1 : 0;
    lastPattern = name;
    const end = PATTERNS[name](spawnX, d);
    spawnX = end + lerp(760, 380, d) * rand(0.85, 1.3);
  }
}
