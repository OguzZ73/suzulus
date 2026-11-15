// Süzülüş — The hang glider and its pilot
'use strict';

// hang glider seen a little from below: a striped delta sail on an aluminium frame, the pilot hanging
// prone in his harness beneath it with both hands on the control bar
const HG = { nose: [40, -29], near: [-46, -4], far: [-27, -46], tail: [-33, -25], apex: [2, -23], barN: [15, 10], barF: [19, 4] };
function sailHalf(c, isNear, flut) {
  const N = HG.nose, K = HG.tail, tip = isNear ? HG.near : HG.far;
  const ox = isNear ? 1 : -0.6, oy = isNear ? 1 : -1;
  const sid = LOOK.sailId;
  c.beginPath();
  if (sid === 'gunbatimi') {
    // Kırlangıç / Gull-wing: arched leading edge & deep swallowtail fork
    const tTip = isNear ? [-50, -1.5] : [-29, -49];
    const fork = isNear ? [-41, -18 + flut * 0.7] : [-36, -32 + flut * 0.7];
    c.moveTo(N[0] + 2, N[1] - 0.5);
    c.bezierCurveTo(N[0] - 16 + ox * 7, N[1] + (tTip[1] - N[1]) * 0.25 + oy * 7, tTip[0] + 18 + ox * 3, tTip[1] - oy * 2, tTip[0], tTip[1]);
    c.quadraticCurveTo((tTip[0] + fork[0]) * 0.5 + 11, (tTip[1] + fork[1]) * 0.5 + flut, fork[0], fork[1]);
    c.lineTo(-24, -24.5);
  } else if (sid === 'buzul') {
    // Kristal / Faceted Ice Wing: sharp polygonal shoulder & sawtooth crystal trailing shards
    const sh = isNear ? [8, -11] : [15, -42];
    const tTip = isNear ? [-50, -2.5] : [-29, -48.5];
    const n1 = [tTip[0] * 0.7 + K[0] * 0.3 + 9, tTip[1] * 0.7 + K[1] * 0.3 + flut * 0.5];
    const p1 = [tTip[0] * 0.5 + K[0] * 0.5 - 4, tTip[1] * 0.5 + K[1] * 0.5 + oy * 3.5 + flut];
    const n2 = [tTip[0] * 0.28 + K[0] * 0.72 + 8, tTip[1] * 0.28 + K[1] * 0.72 + flut * 0.5];
    c.moveTo(N[0] + 4, N[1] - 0.5);
    c.lineTo(sh[0], sh[1]);
    c.lineTo(tTip[0], tTip[1]);
    c.lineTo(n1[0], n1[1]);
    c.lineTo(p1[0], p1[1]);
    c.lineTo(n2[0], n2[1]);
    c.lineTo(-39, -25.5);
  } else if (sid === 'orman') {
    // Yaprak & Telek / Organic Feathered Wing: arched leaf margin & 5 layered primary feathers
    const tTip = isNear ? [-49, -2.5] : [-28, -48];
    c.moveTo(N[0] + 1, N[1]);
    c.quadraticCurveTo((N[0] + tTip[0]) * 0.5 + ox * 8, (N[1] + tTip[1]) * 0.5 + oy * 8.5, tTip[0], tTip[1]);
    const steps = 5;
    for (let i = 1; i <= steps; i++) {
      const t0 = (i - 0.45) / steps, t1 = i / steps;
      const fx = lerp(tTip[0], K[0] - 4, t0) - 5.5, fy = lerp(tTip[1], K[1], t0) + oy * 2.5 + flut * 0.8;
      const nx = lerp(tTip[0], K[0] - 2, t1) + (i < steps ? 5.5 : 0), ny = lerp(tTip[1], K[1], t1) + flut * 0.4;
      c.quadraticCurveTo(fx, fy, nx, ny);
    }
  } else if (sid === 'gece') {
    // Hilal / Crescent Scythe Wing: sweeping outer arc & deep concave crescent trailing edge
    const tTip = isNear ? [-52, 1.5] : [-31, -50.5];
    c.moveTo(N[0] + 3, N[1] - 1);
    c.quadraticCurveTo((N[0] + tTip[0]) * 0.52 + ox * 9, (N[1] + tTip[1]) * 0.52 + oy * 9, tTip[0], tTip[1]);
    c.quadraticCurveTo((tTip[0] + K[0]) * 0.5 + 18, (tTip[1] + K[1]) * 0.5 - oy * 4 + flut, -20, -24.2);
  } else if (sid === 'altin') {
    // Zümrüdüanka / Royal Phoenix Wing: double-arched imperial wing & sharp golden pinion feathers
    const tTip = isNear ? [-50, -1.5] : [-29, -49];
    c.moveTo(N[0] + 4, N[1] - 0.8);
    c.bezierCurveTo(N[0] - 12 + ox * 7, N[1] + oy * 6, tTip[0] + 22 + ox * 5, tTip[1] + oy * 4, tTip[0], tTip[1]);
    const steps = 6;
    for (let i = 1; i <= steps; i++) {
      const t0 = (i - 0.55) / steps, t1 = i / steps;
      const fx = lerp(tTip[0], K[0] - 4, t0) - 6.5, fy = lerp(tTip[1], K[1], t0) + oy * 2.2 + flut * 0.9;
      const nx = lerp(tTip[0], K[0] - 1, t1) + (i < steps ? 6 : 0), ny = lerp(tTip[1], K[1], t1);
      c.lineTo(fx, fy);
      c.lineTo(nx, ny);
    }
  } else if (sid === 'ejder') {
    // Ejder / Dragon wing: an arm bone out to a clawed wrist, then membrane scalloped between the finger bones
    const [W, T] = ejderPts(isNear);
    c.moveTo(N[0] + 3, N[1] - 0.6);
    c.quadraticCurveTo((N[0] + W[0]) / 2 + ox * 2, (N[1] + W[1]) / 2 + oy * 3, W[0], W[1]);
    c.quadraticCurveTo((W[0] + T[0]) / 2 + ox * 2, (W[1] + T[1]) / 2 + oy * 4.5, T[0], T[1]);
    for (let i = 1; i <= 4; i++) {
      const ax = lerp(T[0], K[0] - 3, (i - 1) / 4), ay = lerp(T[1], K[1], (i - 1) / 4), bx = lerp(T[0], K[0] - 3, i / 4), by = lerp(T[1], K[1], i / 4);
      c.quadraticCurveTo((ax + bx) / 2 + 8, (ay + by) / 2 - oy * 2.5 + flut * 0.8, bx, by);
    }
  } else if (sid === 'aurora') {
    // Aurora: a long swept blade of night sky with three soft trailing lobes
    const T = auroraTip(isNear);
    c.moveTo(N[0] + 3, N[1] - 0.8);
    c.bezierCurveTo(N[0] - 16 + ox * 7, N[1] + (T[1] - N[1]) * 0.25 + oy * 8, T[0] + 20 + ox * 3, T[1] - oy * 2, T[0], T[1]);
    for (let i = 1; i <= 3; i++) {
      const ax = lerp(T[0], K[0] - 2, (i - 1) / 3), ay = lerp(T[1], K[1], (i - 1) / 3), bx = lerp(T[0], K[0] - 2, i / 3), by = lerp(T[1], K[1], i / 3);
      c.quadraticCurveTo((ax + bx) / 2 - 5, (ay + by) / 2 + oy * 3 + flut * (1.4 - i * 0.3), bx, by);
    }
  } else if (sid === 'vitray') {
    // Vitray / Butterfly: a full rounded forewing with a finely scalloped hem
    const T = vitrayTip(isNear);
    c.moveTo(N[0] + 2, N[1] - 0.5);
    c.bezierCurveTo(N[0] - 10 + ox * 9, N[1] + oy * 13, T[0] + 14 + ox * 5, T[1] + oy * 5, T[0], T[1]);
    for (let i = 1; i <= 5; i++) {
      const ax = lerp(T[0], K[0] - 1, (i - 1) / 5), ay = lerp(T[1], K[1], (i - 1) / 5), bx = lerp(T[0], K[0] - 1, i / 5), by = lerp(T[1], K[1], i / 5);
      c.quadraticCurveTo((ax + bx) / 2 - 3.2, (ay + by) / 2 + oy * 2.6 + flut * 0.5, bx, by);
    }
  } else {
    // Klasik Delta
    c.moveTo(N[0], N[1]);
    c.lineTo(tip[0], tip[1]);
    c.quadraticCurveTo((tip[0] + K[0]) / 2 + 5, (tip[1] + K[1]) / 2 + flut, K[0], K[1]);
  }
  c.closePath();
}
// shape points of the premium wings, shared by their outline, their inside and their frame
const ejderPts = (isNear) => (isNear ? [[4, -10], [-53, 0.5]] : [[12, -43], [-32, -51.5]]);
const auroraTip = (isNear) => (isNear ? [-54, 2] : [-33, -52]);
const vitrayTip = (isNear) => (isNear ? [-49, -0.5] : [-28, -50]);
const JEWEL = ['#ff5d6c', '#ffb23e', '#ffe45c', '#3fd6a0', '#3fa9f5', '#a070ff'];
function star4(c, x, y, r) {
  c.beginPath();
  c.moveTo(x, y - r); c.lineTo(x + r * 0.28, y - r * 0.28); c.lineTo(x + r, y); c.lineTo(x + r * 0.28, y + r * 0.28);
  c.lineTo(x, y + r); c.lineTo(x - r * 0.28, y + r * 0.28); c.lineTo(x - r, y); c.lineTo(x - r * 0.28, y - r * 0.28);
  c.closePath(); c.fill();
}
// bands of colour running along a leading edge (drawn inside the current clip)
function sailStripes(c, tip, bands) {
  const N = HG.nose, K = HG.tail;
  let dx = tip[0] - N[0], dy = tip[1] - N[1];
  const l = Math.hypot(dx, dy); dx /= l; dy /= l;
  let nx = -dy, ny = dx;
  if ((K[0] - N[0]) * nx + (K[1] - N[1]) * ny < 0) { nx = -nx; ny = -ny; }
  for (const [off, wd, col] of bands) {
    c.strokeStyle = col; c.lineWidth = wd;
    c.beginPath();
    c.moveTo(N[0] + nx * off - dx * 14, N[1] + ny * off - dy * 14);
    c.lineTo(tip[0] + nx * off + dx * 14, tip[1] + ny * off + dy * 14);
    c.stroke();
  }
}
function battens(c, tip, n, col) {
  const N = HG.nose, K = HG.tail;
  c.strokeStyle = col; c.lineWidth = 0.7;
  c.beginPath();
  for (let i = 1; i <= n; i++) {
    const t = i / (n + 1);
    const ax = N[0] + (tip[0] - N[0]) * t, ay = N[1] + (tip[1] - N[1]) * t;
    const bx = K[0] + (tip[0] - K[0]) * t * 0.9, by = K[1] + (tip[1] - K[1]) * t * 0.9;
    c.moveTo(ax, ay); c.lineTo(ax + (bx - ax) * 0.8, ay + (by - ay) * 0.8);
  }
  c.stroke();
}
function drawWingInner(c, isNear, cols) {
  const N = HG.nose, K = HG.tail, tip = isNear ? HG.near : HG.far;
  const ox = isNear ? 1 : -0.6, oy = isNear ? 1 : -1;
  const sid = LOOK.sailId;
  if (sid === 'gunbatimi') {
    // Sunburst rays from the nose + warm horizon stripes
    sailStripes(c, tip, [[2.2, 4.2, cols[0]], [6.4, 3.4, cols[1]], [10.2, 2.2, cols[2]]]);
    c.fillStyle = cols[2];
    c.globalAlpha = 0.35;
    for (let i = 1; i <= 4; i++) {
      const t = i / 5;
      c.beginPath();
      c.moveTo(N[0], N[1]);
      c.lineTo(lerp(tip[0], K[0], t - 0.06), lerp(tip[1], K[1], t - 0.06));
      c.lineTo(lerp(tip[0], K[0], t + 0.06), lerp(tip[1], K[1], t + 0.06));
      c.closePath();
      c.fill();
    }
    c.globalAlpha = 1;
  } else if (sid === 'buzul') {
    // Prismatic crystal facets & frost ridges
    const sh = isNear ? [8, -11] : [15, -42];
    const tTip = isNear ? [-50, -2.5] : [-29, -48.5];
    c.fillStyle = cols[1]; c.globalAlpha = 0.42;
    c.beginPath(); c.moveTo(N[0] + 4, N[1]); c.lineTo(sh[0], sh[1]); c.lineTo((tTip[0] + K[0]) * 0.5, (tTip[1] + K[1]) * 0.5); c.closePath(); c.fill();
    c.fillStyle = cols[2]; c.globalAlpha = 0.55;
    c.beginPath(); c.moveTo(sh[0], sh[1]); c.lineTo(tTip[0], tTip[1]); c.lineTo(tTip[0] * 0.6 + K[0] * 0.4, tTip[1] * 0.6 + K[1] * 0.4); c.closePath(); c.fill();
    c.globalAlpha = 1;
    c.strokeStyle = cols[0]; c.lineWidth = 1.2;
    c.beginPath();
    c.moveTo(N[0] + 4, N[1]); c.lineTo((tTip[0] + K[0]) * 0.5, (tTip[1] + K[1]) * 0.5);
    c.moveTo(sh[0], sh[1]); c.lineTo(K[0] - 4, K[1]);
    c.moveTo(sh[0], sh[1]); c.lineTo(tTip[0] * 0.65 + K[0] * 0.35, tTip[1] * 0.65 + K[1] * 0.35);
    c.stroke();
  } else if (sid === 'orman') {
    // Secondary covert feather layer & organic golden-green leaf veins
    const tTip = isNear ? [-49, -2.5] : [-28, -48];
    c.fillStyle = cols[1]; c.globalAlpha = 0.5;
    c.beginPath();
    c.moveTo(N[0], N[1]);
    c.quadraticCurveTo((N[0] + tTip[0]) * 0.5 + ox * 6, (N[1] + tTip[1]) * 0.5 + oy * 6, tTip[0] * 0.85 + K[0] * 0.15, tTip[1] * 0.85 + K[1] * 0.15);
    c.quadraticCurveTo((tTip[0] + K[0]) * 0.45 + 10, (tTip[1] + K[1]) * 0.45, K[0] * 0.6 + N[0] * 0.4, K[1] * 0.6 + N[1] * 0.4);
    c.closePath(); c.fill();
    c.globalAlpha = 1;
    c.strokeStyle = cols[2]; c.lineWidth = 1.05;
    c.beginPath();
    for (let i = 1; i <= 5; i++) {
      const t = i / 5.5;
      const ax = lerp(N[0], tTip[0], t * 0.75) + ox * 2, ay = lerp(N[1], tTip[1], t * 0.75) + oy * 2;
      const bx = lerp(tTip[0], K[0] - 4, t) - 4, by = lerp(tTip[1], K[1], t) + oy * 2;
      c.moveTo(ax, ay); c.quadraticCurveTo((ax + bx) * 0.5 + 4, (ay + by) * 0.5, bx, by);
    }
    c.stroke();
  } else if (sid === 'gece') {
    // Celestial trim, constellation lines & glowing stars
    const tTip = isNear ? [-52, 1.5] : [-31, -50.5];
    c.strokeStyle = cols[0]; c.lineWidth = 2.6;
    c.beginPath();
    c.moveTo(N[0] + 3, N[1] - 1);
    c.quadraticCurveTo((N[0] + tTip[0]) * 0.52 + ox * 7, (N[1] + tTip[1]) * 0.52 + oy * 7, tTip[0], tTip[1]);
    c.stroke();
    const s1 = [lerp(N[0], tTip[0], 0.28) + ox * 2, lerp(N[1], tTip[1], 0.28) + oy * 2];
    const s2 = [lerp(N[0], tTip[0], 0.52), lerp(N[1], tTip[1], 0.52) + oy * 1.5];
    const s3 = [lerp(N[0], tTip[0], 0.74) - ox * 1, lerp(N[1], tTip[1], 0.74)];
    const s4 = [lerp(N[0], K[0], 0.48), lerp(N[1], K[1], 0.48) + oy * 3];
    c.strokeStyle = 'rgba(200,220,255,0.45)'; c.lineWidth = 0.65;
    c.beginPath(); c.moveTo(s1[0], s1[1]); c.lineTo(s2[0], s2[1]); c.lineTo(s3[0], s3[1]); c.moveTo(s2[0], s2[1]); c.lineTo(s4[0], s4[1]); c.stroke();
    for (const [sx, sy, sr, scol] of [[s1[0], s1[1], 1.7, cols[1]], [s2[0], s2[1], 1.4, cols[2]], [s3[0], s3[1], 1.6, '#ffffff'], [s4[0], s4[1], 1.2, cols[1]]]) {
      c.fillStyle = scol;
      c.beginPath();
      c.moveTo(sx, sy - sr * 1.6); c.lineTo(sx + sr * 0.5, sy - sr * 0.5); c.lineTo(sx + sr * 1.6, sy);
      c.lineTo(sx + sr * 0.5, sy + sr * 0.5); c.lineTo(sx, sy + sr * 1.6); c.lineTo(sx - sr * 0.5, sy + sr * 0.5);
      c.lineTo(sx - sr * 1.6, sy); c.lineTo(sx - sr * 0.5, sy - sr * 0.5);
      c.closePath(); c.fill();
    }
  } else if (sid === 'altin') {
    // Two tiers of royal white-and-gold covert feathers & radial feather shafts
    const tTip = isNear ? [-50, -1.5] : [-29, -49];
    c.fillStyle = cols[1]; c.globalAlpha = 0.82;
    c.beginPath();
    c.moveTo(N[0] + 2, N[1]);
    c.quadraticCurveTo((N[0] + tTip[0]) * 0.5 + ox * 4, (N[1] + tTip[1]) * 0.5 + oy * 4, tTip[0] * 0.68 + N[0] * 0.32, tTip[1] * 0.68 + N[1] * 0.32);
    for (let i = 1; i <= 4; i++) {
      const t = i / 4;
      c.lineTo(lerp(tTip[0] * 0.68 + N[0] * 0.32, K[0] * 0.55 + N[0] * 0.45, t) - 4, lerp(tTip[1] * 0.68 + N[1] * 0.32, K[1] * 0.55 + N[1] * 0.45, t) + oy * 1.5);
    }
    c.closePath(); c.fill();
    c.globalAlpha = 1;
    sailStripes(c, tip, [[1.8, 3.4, cols[0]], [5.2, 2.2, cols[2]]]);
    battens(c, tip, 6, 'rgba(138,90,26,0.45)');
  } else if (sid === 'ejder') {
    const [W, T] = ejderPts(isNear);
    const pulse = 0.55 + 0.45 * Math.sin(gtime * 3.2 + (isNear ? 0 : 1.2));
    // the membrane darkens toward its hem
    c.fillStyle = 'rgba(20,4,8,0.38)';
    c.beginPath(); c.moveTo(T[0], T[1]); c.lineTo(K[0] - 3, K[1]); c.lineTo(lerp(W[0], K[0], 0.45), lerp(W[1], K[1], 0.45)); c.closePath(); c.fill();
    // finger bones, lit from inside: a wide soft glow under a thin hot core, breathing slowly
    const bones = () => {
      c.beginPath();
      for (let i = 1; i <= 4; i++) {
        const fx = lerp(T[0], K[0] - 3, i / 4), fy = lerp(T[1], K[1], i / 4);
        c.moveTo(W[0], W[1]); c.quadraticCurveTo((W[0] + fx) / 2 + 3, (W[1] + fy) / 2 + oy * 2, fx, fy);
      }
    };
    c.strokeStyle = cols[0]; c.lineWidth = 5; c.globalAlpha = 0.14 + 0.2 * pulse; bones(); c.stroke();
    c.strokeStyle = cols[1]; c.lineWidth = 2; c.globalAlpha = 1; bones(); c.stroke();
    c.strokeStyle = cols[0]; c.lineWidth = 0.7; c.globalAlpha = 0.35 + 0.65 * pulse; bones(); c.stroke();
    // every other fold of the membrane catches a little more light
    c.fillStyle = 'rgba(255,170,110,0.10)'; c.globalAlpha = 1;
    for (let i = 1; i <= 4; i += 2) {
      const ax = lerp(T[0], K[0] - 3, (i - 1) / 4), ay = lerp(T[1], K[1], (i - 1) / 4), bx = lerp(T[0], K[0] - 3, i / 4), by = lerp(T[1], K[1], i / 4);
      c.beginPath(); c.moveTo(W[0], W[1]); c.lineTo(ax, ay); c.lineTo(bx, by); c.closePath(); c.fill();
    }
    c.globalAlpha = 1;
  } else if (sid === 'aurora') {
    const T = auroraTip(isNear);
    // curtains of northern light sliding along the wing, each slowly changing colour
    for (let i = 0; i < 5; i++) {
      // teal through blue and violet to rose, never the dull greens in between
      const hue = (205 + 68 * Math.sin(gtime * 0.7 + i * 1.1 + (isNear ? 0 : 0.8)) + i * 11) | 0, lit = isNear ? 68 : 60;
      const a = 0.55 + 0.3 * Math.sin(gtime * 1.6 + i * 1.7), o = 1.5 + i * 3.7 + Math.sin(gtime * 1.1 + i) * 0.9;
      // a wide soft band under a narrow bright one, so each curtain has a glowing heart
      sailStripes(c, T, [[o, 5.6, `hsla(${hue},95%,${lit}%,${(a * 0.45).toFixed(3)})`], [o, 2.3, `hsla(${hue},100%,${lit + 10}%,${a.toFixed(3)})`]]);
    }
    battens(c, T, 7, 'rgba(255,255,255,0.2)');
    // stars that wink through the light
    c.fillStyle = '#ffffff';
    for (let j = 0; j < 6; j++) {
      const u = 0.18 + 0.13 * j, v = 0.22 + 0.16 * (j % 3);
      const sx = lerp(lerp(N[0], T[0], u), K[0], v), sy = lerp(lerp(N[1], T[1], u), K[1], v);
      c.globalAlpha = Math.pow(Math.max(0, Math.sin(gtime * 2.4 + j * 2.1)), 3);
      star4(c, sx, sy, 1.9);
    }
    c.globalAlpha = 1;
  } else if (sid === 'vitray') {
    const T = vitrayTip(isNear), R = [N[0] - 5, N[1]];
    // a fan of glass: seven points round the hem, each sector split into an inner and an outer pane
    const ring = [[(N[0] + T[0]) / 2 + ox * 7, (N[1] + T[1]) / 2 + oy * 11]];
    for (let i = 0; i <= 5; i++) ring.push([lerp(T[0], K[0] - 1, i / 5), lerp(T[1], K[1], i / 5)]);
    // three rows of panes; the rows sit a little higher in every other sector, the way a glazier staggers them
    const cut = (s2, k) => { const f = k + (s2 % 2 ? 0.07 : 0); return [lerp(R[0], ring[s2][0], f), lerp(R[1], ring[s2][1], f)]; };
    const off = isNear ? 0 : 3, dim = isNear ? 1 : 0.8, rows = [0, 0.34, 0.66, 1];
    for (let s2 = 0; s2 < 6; s2++) {
      for (let r = 0; r < 3; r++) {
        const a0 = r ? cut(s2, rows[r]) : R, b0 = r ? cut(s2 + 1, rows[r]) : R;
        const a1 = r < 2 ? cut(s2, rows[r + 1]) : ring[s2], b1 = r < 2 ? cut(s2 + 1, rows[r + 1]) : ring[s2 + 1];
        // each pane brightens and dims on its own as the light moves behind it
        c.globalAlpha = dim * (0.8 + 0.2 * Math.sin(gtime * 2.1 + s2 * 1.3 + r * 2.2 + off));
        c.fillStyle = JEWEL[(s2 * 2 + r * 3 + off) % 6];
        c.beginPath(); c.moveTo(a0[0], a0[1]); c.lineTo(a1[0], a1[1]); c.lineTo(b1[0], b1[1]); c.lineTo(b0[0], b0[1]); c.closePath(); c.fill();
      }
    }
    c.globalAlpha = 1;
    // a sheen of daylight sweeping across the glass
    sailStripes(c, T, [[(gtime * 7) % 34 - 2, 4.5, 'rgba(255,255,255,0.18)']]);
    // the lead between the panes
    c.strokeStyle = cols[1]; c.lineWidth = 1.2;
    c.beginPath();
    for (let s2 = 0; s2 < 7; s2++) { c.moveTo(R[0], R[1]); c.lineTo(ring[s2][0], ring[s2][1]); }
    for (let s2 = 0; s2 < 6; s2++) for (let r = 1; r < 3; r++) { const a = cut(s2, rows[r]), b = cut(s2 + 1, rows[r]); c.moveTo(a[0], a[1]); c.lineTo(b[0], b[1]); }
    c.stroke();
    // a dark hem set with pearls, like a monarch's wing
    c.lineWidth = 5.5;
    c.beginPath(); c.moveTo(ring[1][0], ring[1][1]);
    for (let s = 2; s < 7; s++) c.quadraticCurveTo((ring[s - 1][0] + ring[s][0]) / 2 - 3.2, (ring[s - 1][1] + ring[s][1]) / 2 + oy * 2.6, ring[s][0], ring[s][1]);
    c.stroke();
    c.fillStyle = cols[2];
    for (let s = 1; s < 6; s++) {
      const px = (ring[s][0] + ring[s + 1][0]) / 2 - 1.4, py = (ring[s][1] + ring[s + 1][1]) / 2 + oy * 0.9;
      c.beginPath(); c.arc(lerp(px, R[0], 0.02), lerp(py, R[1], 0.02), 0.8, 0, TAU); c.fill();
    }
  } else {
    sailStripes(c, tip, isNear ? [[1.9, 3.8, cols[0]], [5.6, 3.2, cols[1]], [9, 2.2, cols[2]]] : [[1.8, 3.6, cols[0]], [5.2, 2.8, cols[1]], [8.2, 1.8, cols[2]]]);
    battens(c, tip, isNear ? 5 : 4, isNear ? 'rgba(120,96,70,0.28)' : 'rgba(70,56,44,0.25)');
  }
}
function drawWingFrameAndOrnaments(c, ph) {
  const N = HG.nose, K = HG.tail, sid = LOOK.sailId;
  const flut = Math.sin(ph * 1.7) * 1.5;
  if (sid === 'gunbatimi') {
    // Twin fluttering swallowtail ribbons & curved leading spars
    c.strokeStyle = '#e2563e'; c.lineWidth = 1.5;
    c.beginPath();
    c.moveTo(-41, -18 + flut * 0.7); c.quadraticCurveTo(-49, -15 - flut, -56, -16 + flut * 1.2);
    c.moveTo(-36, -32 + flut * 0.7); c.quadraticCurveTo(-44, -34 + flut, -51, -33 - flut * 1.2);
    c.stroke();
    c.strokeStyle = '#5c2430'; c.lineWidth = 1.9;
    c.beginPath();
    c.moveTo(N[0] + 2, N[1] - 0.5); c.bezierCurveTo(N[0] - 9, N[1] - 1, -32, -3.5, -50, -1.5);
    c.moveTo(N[0] + 2, N[1] - 0.5); c.bezierCurveTo(N[0] - 20, N[1] - 12, -11, -47, -29, -49);
    c.stroke();
  } else if (sid === 'buzul') {
    // Crystalline leading edges & glowing ice-diamond spear at nose and tail
    c.strokeStyle = '#1d4c7d'; c.lineWidth = 1.8;
    c.beginPath();
    c.moveTo(N[0] + 4, N[1] - 0.5); c.lineTo(15, -42); c.lineTo(-29, -48.5);
    c.moveTo(N[0] + 4, N[1] - 0.5); c.lineTo(8, -11); c.lineTo(-50, -2.5);
    c.moveTo(N[0] + 4, N[1] - 0.5); c.lineTo(-39, -25.5);
    c.stroke();
    c.fillStyle = '#bfe9ff'; c.strokeStyle = '#20406e'; c.lineWidth = 1;
    c.beginPath(); c.moveTo(N[0] + 8, N[1] - 1); c.lineTo(N[0] + 1, N[1] - 4); c.lineTo(N[0] - 3, N[1]); c.lineTo(N[0] + 1, N[1] + 3); c.closePath(); c.fill(); c.stroke();
  } else if (sid === 'orman') {
    // Fan of 3 layered bird tail feathers + curved wooden branch spars + nose leaf-sprout
    for (const [ang, col] of [[-0.22, '#557a35'], [0.22, '#557a35'], [0, '#6f9b46']]) {
      c.fillStyle = col;
      c.beginPath(); c.ellipse(K[0] - 5, K[1] + ang * 10, 7.5, 2.3, ang, 0, TAU); c.fill();
    }
    c.strokeStyle = '#4e3620'; c.lineWidth = 2.1;
    c.beginPath();
    c.moveTo(N[0] + 1, N[1]); c.quadraticCurveTo(1, -39.5, -28, -48);
    c.moveTo(N[0] + 1, N[1]); c.quadraticCurveTo(4, -7.2, -49, -2.5);
    c.moveTo(N[0] + 1, N[1]); c.lineTo(K[0] - 4, K[1]);
    c.stroke();
    c.fillStyle = '#8cc256';
    c.beginPath(); c.ellipse(N[0] + 3.5, N[1] - 2, 3.8, 1.6, -0.5, 0, TAU); c.ellipse(N[0] + 3.5, N[1] + 1, 3.6, 1.5, 0.4, 0, TAU); c.fill();
  } else if (sid === 'gece') {
    // Glowing golden crescent moon on nose & silver-indigo curved scythe spars
    c.strokeStyle = '#c4b2ff'; c.lineWidth = 1.8;
    c.beginPath();
    c.moveTo(N[0] + 3, N[1] - 1); c.quadraticCurveTo(0, -49, -31, -50.5);
    c.moveTo(N[0] + 3, N[1] - 1); c.quadraticCurveTo(4.5, -5.5, -52, 1.5);
    c.stroke();
    c.fillStyle = '#ffd27a';
    c.beginPath(); c.arc(N[0] + 2, N[1] - 0.8, 3.8, 0, TAU); c.fill();
    c.fillStyle = '#262a58';
    c.beginPath(); c.arc(N[0] + 0.5, N[1] - 1.6, 3.1, 0, TAU); c.fill();
  } else if (sid === 'altin') {
    // Long undulating golden-crimson phoenix tail ribbons + sculpted golden phoenix beak at nose
    c.strokeStyle = '#d94b38'; c.lineWidth = 2.0;
    c.beginPath();
    c.moveTo(K[0], K[1]); c.bezierCurveTo(K[0] - 10, K[1] - 5 + flut, K[0] - 19, K[1] + 4 - flut, K[0] - 28, K[1] - 2 + flut * 1.3);
    c.stroke();
    c.strokeStyle = '#ffd666'; c.lineWidth = 1.8;
    c.beginPath();
    c.moveTo(K[0], K[1] + 1); c.bezierCurveTo(K[0] - 10, K[1] + 5 - flut, K[0] - 18, K[1] - 3 + flut, K[0] - 26, K[1] + 3 - flut * 1.3);
    c.stroke();
    c.strokeStyle = '#8a5a1a'; c.lineWidth = 2.2;
    c.beginPath();
    c.moveTo(N[0] + 4, N[1] - 0.8); c.bezierCurveTo(N[0] - 16, N[1] - 7, -10, -53, -29, -49);
    c.moveTo(N[0] + 4, N[1] - 0.8); c.bezierCurveTo(N[0] - 5, N[1] + 5, -23, 2.5, -50, -1.5);
    c.moveTo(N[0] + 4, N[1] - 0.8); c.lineTo(K[0], K[1]);
    c.stroke();
    // Golden Phoenix Beak & Crest at nose
    c.fillStyle = '#ffd86b'; c.strokeStyle = '#7a4b12'; c.lineWidth = 0.9;
    c.beginPath();
    c.moveTo(N[0] + 1, N[1] - 3.2); c.quadraticCurveTo(N[0] + 7, N[1] - 3.5, N[0] + 9.5, N[1] + 0.8);
    c.quadraticCurveTo(N[0] + 5, N[1] + 0.5, N[0] + 1, N[1] + 1.6); c.closePath();
    c.fill(); c.stroke();
  } else if (sid === 'ejder') {
    const pulse = 0.55 + 0.45 * Math.sin(gtime * 3.2), tw = flut * 1.4;
    // dikenli kuyruk: a spined tail that ends in a glowing barb and sheds embers
    c.strokeStyle = '#1c0a0e'; c.lineWidth = 2.6;
    c.beginPath(); c.moveTo(K[0] - 2, K[1]); c.bezierCurveTo(K[0] - 10, K[1] - 3 + tw, K[0] - 16, K[1] + 4 - tw, K[0] - 24, K[1] + tw * 1.2); c.stroke();
    const tx = K[0] - 24, ty = K[1] + tw * 1.2;
    c.fillStyle = `rgba(255,138,46,${(0.7 + 0.3 * pulse).toFixed(3)})`;
    c.beginPath(); c.moveTo(tx - 6.5, ty); c.lineTo(tx + 1, ty - 3.6); c.lineTo(tx - 0.8, ty); c.lineTo(tx + 1, ty + 3.6); c.closePath(); c.fill();
    for (let i = 0; i < 4; i++) {
      const u = (gtime * 0.9 + i * 0.25) % 1;
      c.globalAlpha = (1 - u) * 0.9; c.fillStyle = i % 2 ? '#ffd98a' : '#ff8a2e';
      c.beginPath(); c.arc(tx - 6 - u * 12, ty + Math.sin(u * 7 + i * 2) * 3 - u * 4, 1.25 * (1 - u * 0.6), 0, TAU); c.fill();
    }
    c.globalAlpha = 1;
    // arm bones and keel, with a seam of fire running down each arm
    const arms = () => {
      c.beginPath();
      for (const near of [false, true]) {
        const [W, T] = ejderPts(near), ox = near ? 1 : -0.6, oy = near ? 1 : -1;
        c.moveTo(N[0] + 3, N[1] - 0.6);
        c.quadraticCurveTo((N[0] + W[0]) / 2 + ox * 2, (N[1] + W[1]) / 2 + oy * 3, W[0], W[1]);
        c.quadraticCurveTo((W[0] + T[0]) / 2 + ox * 2, (W[1] + T[1]) / 2 + oy * 4.5, T[0], T[1]);
      }
    };
    c.strokeStyle = '#1c0a0e'; c.lineWidth = 2.5; arms(); c.stroke();
    c.lineWidth = 1.7; c.beginPath(); c.moveTo(N[0] + 3, N[1] - 0.6); c.lineTo(K[0] - 3, K[1]); c.stroke();
    c.strokeStyle = `rgba(255,170,80,${(0.3 + 0.45 * pulse).toFixed(3)})`; c.lineWidth = 0.75; arms(); c.stroke();
    // a claw on each wrist
    c.fillStyle = '#e8dcc0'; c.strokeStyle = '#1c0a0e'; c.lineWidth = 0.6;
    for (const near of [false, true]) {
      const [W] = ejderPts(near), oy = near ? 1 : -1;
      c.beginPath(); c.moveTo(W[0] - 2.2, W[1]); c.quadraticCurveTo(W[0] + 0.5, W[1] + oy * 4, W[0] + 4.5, W[1] + oy * 5.4); c.quadraticCurveTo(W[0] + 2.6, W[1] + oy * 2.2, W[0] + 2, W[1] - oy * 0.4); c.closePath(); c.fill(); c.stroke();
    }
    // a dragon's head at the nose: a long snout, two horns swept back over the wing, one burning eye
    c.fillStyle = '#e8dcc0'; c.strokeStyle = '#1c0a0e'; c.lineWidth = 0.6;
    c.beginPath(); c.moveTo(N[0] + 1.5, N[1] - 3); c.quadraticCurveTo(N[0] - 4, N[1] - 8, N[0] - 11, N[1] - 8.6); c.quadraticCurveTo(N[0] - 5, N[1] - 5.2, N[0] - 1.5, N[1] - 1.8); c.closePath(); c.fill(); c.stroke();
    c.beginPath(); c.moveTo(N[0] + 1.5, N[1] + 2); c.quadraticCurveTo(N[0] - 4, N[1] + 6.2, N[0] - 10, N[1] + 6.2); c.quadraticCurveTo(N[0] - 5, N[1] + 3.6, N[0] - 1.5, N[1] + 0.8); c.closePath(); c.fill(); c.stroke();
    c.fillStyle = '#3a1016'; c.strokeStyle = '#1c0a0e'; c.lineWidth = 0.7;
    c.beginPath();
    c.moveTo(N[0] - 3, N[1] - 3.4); c.quadraticCurveTo(N[0] + 4, N[1] - 4.2, N[0] + 8, N[1] - 2.2); c.lineTo(N[0] + 12.5, N[1] - 0.6);
    c.lineTo(N[0] + 11.6, N[1] + 1.2); c.lineTo(N[0] + 7, N[1] + 1.4); c.quadraticCurveTo(N[0] + 3, N[1] + 3.4, N[0] - 3, N[1] + 2.6);
    c.closePath(); c.fill(); c.stroke();
    // jaw line and a nostril
    c.strokeStyle = '#1c0a0e'; c.lineWidth = 0.6;
    c.beginPath(); c.moveTo(N[0] + 11.6, N[1] + 0.3); c.lineTo(N[0] + 5, N[1] + 0.6); c.stroke();
    c.fillStyle = `rgba(255,154,60,${(0.18 + 0.22 * pulse).toFixed(3)})`; c.beginPath(); c.arc(N[0] + 4, N[1] - 1.4, 2.6, 0, TAU); c.fill();
    c.fillStyle = '#ffd98a'; c.beginPath(); c.ellipse(N[0] + 4, N[1] - 1.5, 1.5, 0.8, -0.25, 0, TAU); c.fill();
    c.fillStyle = '#1c0a0e'; c.beginPath(); c.ellipse(N[0] + 4.2, N[1] - 1.5, 0.35, 0.75, -0.25, 0, TAU); c.fill();
  } else if (sid === 'aurora') {
    // two ribbons of light streaming from the tail, a soft halo round a bright core
    for (const [dy, hue, p2, len] of [[-3.2, 165, 0, 32], [3.2, 285, 1.7, 25]]) {
      const f = Math.sin(ph * 1.7 + p2) * 3, h = (hue + 25 * Math.sin(gtime * 0.9 + p2)) | 0;
      for (const [lw, al] of [[5.5, 0.16], [2, 0.85]]) {
        c.strokeStyle = `hsla(${h},95%,72%,${al})`; c.lineWidth = lw;
        c.beginPath(); c.moveTo(K[0] - 1, K[1] + dy * 0.4); c.bezierCurveTo(K[0] - len * 0.33, K[1] + dy * 1.6 + f, K[0] - len * 0.62, K[1] + dy * 0.4 - f, K[0] - len, K[1] + dy * 1.7 + f * 1.4); c.stroke();
      }
    }
    // leading edges drawn in light
    const edges = () => {
      c.beginPath();
      for (const near of [false, true]) {
        const T = auroraTip(near), ox = near ? 1 : -0.6, oy = near ? 1 : -1;
        c.moveTo(N[0] + 3, N[1] - 0.8);
        c.bezierCurveTo(N[0] - 16 + ox * 7, N[1] + (T[1] - N[1]) * 0.25 + oy * 8, T[0] + 20 + ox * 3, T[1] - oy * 2, T[0], T[1]);
      }
    };
    c.strokeStyle = 'rgba(120,255,220,0.2)'; c.lineWidth = 4.6; edges(); c.stroke();
    c.strokeStyle = '#c8fff2'; c.lineWidth = 1.5; edges(); c.stroke();
    c.strokeStyle = 'rgba(200,255,242,0.5)'; c.lineWidth = 1;
    c.beginPath(); c.moveTo(N[0] + 3, N[1] - 0.8); c.lineTo(K[0] - 2, K[1]); c.stroke();
    // the pole star at the nose
    const tw = 0.75 + 0.25 * Math.sin(gtime * 4.1);
    c.fillStyle = 'rgba(186,255,240,0.16)'; c.beginPath(); c.arc(N[0] + 3, N[1] - 0.8, 7 * tw, 0, TAU); c.fill();
    c.fillStyle = 'rgba(186,255,240,0.3)'; c.beginPath(); c.arc(N[0] + 3, N[1] - 0.8, 3.8, 0, TAU); c.fill();
    c.fillStyle = '#ffffff'; star4(c, N[0] + 3, N[1] - 0.8, 4.6 * tw);
  } else if (sid === 'vitray') {
    // two swallowtails, each ending in a drop of glass
    for (const [dy, col, p2] of [[-1.6, '#3fa9f5', 0], [1.6, '#ff5d6c', 1.9]]) {
      const f = Math.sin(ph * 1.7 + p2) * 1.8;
      c.strokeStyle = '#120c1c'; c.lineWidth = 1.5;
      c.beginPath(); c.moveTo(K[0], K[1] + dy * 0.5); c.bezierCurveTo(K[0] - 7, K[1] + dy * 3 + f, K[0] - 12, K[1] + dy - f, K[0] - 19, K[1] + dy * 3.2 + f * 1.3); c.stroke();
      const ex = K[0] - 19, ey = K[1] + dy * 3.2 + f * 1.3;
      c.fillStyle = col; c.beginPath(); c.arc(ex - 1.4, ey, 2.1, 0, TAU); c.fill(); c.stroke();
      c.fillStyle = '#ffffff'; c.beginPath(); c.arc(ex - 1.9, ey - 0.7, 0.6, 0, TAU); c.fill();
    }
    // leaded leading edges with a thread of gold, and the butterfly's body down the keel
    const edges = () => {
      c.beginPath();
      for (const near of [false, true]) {
        const T = vitrayTip(near), ox = near ? 1 : -0.6, oy = near ? 1 : -1;
        c.moveTo(N[0] + 2, N[1] - 0.5);
        c.bezierCurveTo(N[0] - 10 + ox * 9, N[1] + oy * 13, T[0] + 14 + ox * 5, T[1] + oy * 5, T[0], T[1]);
      }
    };
    c.strokeStyle = '#120c1c'; c.lineWidth = 2.3; edges(); c.stroke();
    c.strokeStyle = 'rgba(255,211,107,0.85)'; c.lineWidth = 0.7; edges(); c.stroke();
    c.strokeStyle = '#1a1028'; c.lineWidth = 3.2;
    c.beginPath(); c.moveTo(N[0] + 2, N[1] - 0.5); c.lineTo(K[0] + 2, K[1]); c.stroke();
    c.strokeStyle = 'rgba(255,211,107,0.8)'; c.lineWidth = 0.7;
    c.beginPath();
    for (let i = 1; i <= 6; i++) { const bx = lerp(N[0], K[0], i / 7), by = lerp(N[1], K[1], i / 7); c.moveTo(bx - 0.3, by - 1.4); c.lineTo(bx + 0.3, by + 1.4); }
    c.stroke();
    // head and two curled antennae
    c.fillStyle = '#1a1028'; c.beginPath(); c.arc(N[0] + 3, N[1] - 0.5, 2.5, 0, TAU); c.fill();
    c.strokeStyle = '#120c1c'; c.lineWidth = 0.9;
    c.beginPath();
    c.moveTo(N[0] + 4, N[1] - 1.8); c.quadraticCurveTo(N[0] + 9, N[1] - 4, N[0] + 10, N[1] - 8.5);
    c.moveTo(N[0] + 4.6, N[1] + 0.6); c.quadraticCurveTo(N[0] + 10, N[1] + 1, N[0] + 12.5, N[1] - 2.6);
    c.stroke();
    c.fillStyle = '#ffd36b';
    c.beginPath(); c.arc(N[0] + 10, N[1] - 8.7, 1.2, 0, TAU); c.arc(N[0] + 12.6, N[1] - 2.8, 1.2, 0, TAU); c.fill();
  } else {
    // Classic leading edge tubes and keel
    c.strokeStyle = '#3b4252'; c.lineWidth = 1.6;
    c.beginPath(); c.moveTo(N[0], N[1]); c.lineTo(HG.far[0], HG.far[1]); c.stroke();
    c.strokeStyle = '#2b3140'; c.lineWidth = 2;
    c.beginPath(); c.moveTo(N[0], N[1]); c.lineTo(HG.near[0], HG.near[1]); c.stroke();
    c.strokeStyle = 'rgba(60,64,78,0.7)'; c.lineWidth = 1.1;
    c.beginPath(); c.moveTo(N[0], N[1]); c.lineTo(K[0], K[1]); c.stroke();
  }
}
// the scarf is a chain of cloth points towed through the air behind the pilot's neck
const SCARF_N = 13, SCARF_SEG = 3.3;
const scarf = { x: new Float64Array(SCARF_N), y: new Float64Array(SCARF_N), px: new Float64Array(SCARF_N), py: new Float64Array(SCARF_N), t: -1 };
const scarfPts = new Float32Array(SCARF_N * 2);
function stepScarf(at) {
  const ca = Math.cos(bird.ang), sa = Math.sin(bird.ang), k = 0.95;
  const ax = bird.x + (at[0] * ca - at[1] * sa) * k, ay = bird.y + (at[0] * sa + at[1] * ca) * k;
  const moving = clamp((bird.speed - 30) / 200, 0, 1);
  let dt = gtime - scarf.t;
  if (scarf.t < 0 || dt < 0 || dt > 0.25 || Math.hypot(scarf.x[0] - ax, scarf.y[0] - ay) > 160) {
    // lay it out straight behind him
    for (let i = 0; i < SCARF_N; i++) { scarf.x[i] = scarf.px[i] = ax - i * SCARF_SEG * ca; scarf.y[i] = scarf.py[i] = ay - i * SCARF_SEG * sa; }
    dt = 0;
  }
  scarf.t = gtime;
  const steps = Math.min(8, Math.ceil(dt / (1 / 120)));
  for (let s = 0; s < steps; s++) {
    const h = dt / steps, f = Math.pow(0.9, h * 120);
    scarf.x[0] = ax; scarf.y[0] = ay;
    for (let i = 1; i < SCARF_N; i++) {
      const vx = (scarf.x[i] - scarf.px[i]) * f, vy = (scarf.y[i] - scarf.py[i]) * f;
      scarf.px[i] = scarf.x[i]; scarf.py[i] = scarf.y[i];
      // standing still, only the breeze on the cliff top carries it
      scarf.x[i] += vx - 620 * (1 - moving) * h * h; scarf.y[i] += vy + 520 * h * h;
      const gy = groundY(scarf.x[i]) - 1.5;
      if (scarf.y[i] > gy) { scarf.y[i] = gy; scarf.px[i] = scarf.x[i]; }
    }
    for (let it = 0; it < 4; it++) {
      for (let i = 1; i < SCARF_N; i++) {
        const ddx = scarf.x[i] - scarf.x[i - 1], ddy = scarf.y[i] - scarf.y[i - 1], d = Math.hypot(ddx, ddy) || 1e-6, m = (d - SCARF_SEG) / d;
        if (i === 1) { scarf.x[i] -= ddx * m; scarf.y[i] -= ddy * m; }
        else { scarf.x[i] -= ddx * m * 0.5; scarf.y[i] -= ddy * m * 0.5; scarf.x[i - 1] += ddx * m * 0.5; scarf.y[i - 1] += ddy * m * 0.5; }
      }
    }
  }
  // into the flyer's own frame, with the flutter the wind puts on the cloth
  const flap = Math.max(moving, 0.3);
  for (let i = 0; i < SCARF_N; i++) {
    const rx = (scarf.x[i] - bird.x) / k, ry = (scarf.y[i] - bird.y) / k, t = i / (SCARF_N - 1);
    scarfPts[i * 2] = rx * ca + ry * sa;
    // the slipstream over his back lifts the cloth clear of the body
    scarfPts[i * 2 + 1] = -rx * sa + ry * ca - Math.sin(Math.min(1, t * 1.8) * Math.PI * 0.5) * 6.5 * moving + (Math.sin(gtime * 11 - i * 0.85) * 3.2 + Math.sin(gtime * 17.3 - i * 1.5) * 1.1) * t * flap;
  }
}
function drawScarf(c, at) {
  stepScarf(at);
  const n = SCARF_N, P = scarfPts, col = LOOK.scarf;
  const up = new Float32Array(n * 2), lo = new Float32Array(n * 2), tw = new Float32Array(n);
  for (let i = 0; i < n; i++) {
    const a = Math.max(0, i - 1), b = Math.min(n - 1, i + 1);
    let tx = P[b * 2] - P[a * 2], ty = P[b * 2 + 1] - P[a * 2 + 1];
    const l = Math.hypot(tx, ty) || 1; tx /= l; ty /= l;
    const t = i / (n - 1);
    // the ribbon rolls over as it streams: narrow where it is edge-on, its darker back showing where it has turned
    tw[i] = Math.cos(gtime * 5.2 - i * 0.62 + 0.4) * Math.min(1, t * 2.4) + (1 - Math.min(1, t * 2.4));
    const wd = (1.7 + 1.0 * Math.sin(Math.min(1, t * 1.6) * Math.PI * 0.5)) * (0.34 + 0.66 * Math.abs(tw[i]));
    up[i * 2] = P[i * 2] + ty * wd; up[i * 2 + 1] = P[i * 2 + 1] - tx * wd;
    lo[i * 2] = P[i * 2] - ty * wd; lo[i * 2 + 1] = P[i * 2 + 1] + tx * wd;
  }
  const edge = (q, from, to) => {
    const st = from < to ? 1 : -1;
    for (let i = from; i !== to; i += st) { const j = i + st; c.quadraticCurveTo(q[i * 2], q[i * 2 + 1], (q[i * 2] + q[j * 2]) / 2, (q[i * 2 + 1] + q[j * 2 + 1]) / 2); }
    c.lineTo(q[to * 2], q[to * 2 + 1]);
  };
  // a short second tail from the knot, hanging lower
  c.strokeStyle = col[1]; c.lineWidth = 2.6;
  c.beginPath(); c.moveTo(P[0], P[1] + 0.6);
  c.quadraticCurveTo(P[2] - 1, P[3] + 3.2, P[6] + 1.5, P[7] + 4.6 + Math.sin(gtime * 9) * 1.2); c.stroke();
  // fringe at the free end
  const e = n - 1, ex = P[e * 2] - P[(e - 1) * 2], ey = P[e * 2 + 1] - P[(e - 1) * 2 + 1], el = Math.hypot(ex, ey) || 1;
  c.strokeStyle = col[0]; c.lineWidth = 0.7;
  c.beginPath();
  for (let j = 0; j < 5; j++) {
    const u = j / 4, bx = up[e * 2] + (lo[e * 2] - up[e * 2]) * u, by = up[e * 2 + 1] + (lo[e * 2 + 1] - up[e * 2 + 1]) * u, w = Math.sin(gtime * 14 + j * 1.7) * 0.9;
    c.moveTo(bx, by); c.lineTo(bx + (ex / el) * 3.4 - (ey / el) * w, by + (ey / el) * 3.4 + (ex / el) * w);
  }
  c.stroke();
  // the ribbon
  c.beginPath(); c.moveTo(up[0], up[1]); edge(up, 0, n - 1); c.lineTo(lo[(n - 1) * 2], lo[(n - 1) * 2 + 1]); edge(lo, n - 1, 0); c.closePath();
  c.fillStyle = col[0]; c.fill();
  c.save(); c.clip();
  for (let i = 0; i < n - 1; i++) {
    const m = (tw[i] + tw[i + 1]) / 2;
    // back of the cloth where it has rolled over, and a soft crease where it turns
    const a = m < 0 ? 0.42 * Math.min(1, -m * 2.2) : 0, cr = 1 - Math.min(1, Math.abs(m) * 2.5);
    if (a > 0.01 || cr > 0.01) {
      c.fillStyle = a > 0.01 ? col[1] : 'rgb(20,14,30)';
      c.globalAlpha = a > 0.01 ? Math.min(1, a * 2.2) : cr * 0.22;
      c.beginPath(); c.moveTo(up[i * 2], up[i * 2 + 1]); c.lineTo(up[i * 2 + 2], up[i * 2 + 3]); c.lineTo(lo[i * 2 + 2], lo[i * 2 + 3]); c.lineTo(lo[i * 2], lo[i * 2 + 1]); c.closePath(); c.fill();
    }
  }
  c.globalAlpha = 1;
  // shade along the lower edge, light along the upper
  c.strokeStyle = 'rgba(20,14,30,0.28)'; c.lineWidth = 2;
  c.beginPath(); c.moveTo(lo[0], lo[1]); edge(lo, 0, n - 1); c.stroke();
  c.strokeStyle = 'rgba(255,255,255,0.38)'; c.lineWidth = 1.1;
  c.beginPath(); c.moveTo(up[0], up[1]); edge(up, 0, n - 1); c.stroke();
  c.restore();
  // the knot at his neck
  c.fillStyle = col[0]; c.beginPath(); c.ellipse(P[0] + 0.4, P[1] + 0.4, 2.9, 2.5, -0.3, 0, TAU); c.fill();
  c.strokeStyle = col[1]; c.lineWidth = 0.7;
  c.beginPath(); c.moveTo(P[0] - 0.6, P[1] - 1.6); c.quadraticCurveTo(P[0] + 1.4, P[1] + 0.4, P[0] - 0.2, P[1] + 2.4); c.stroke();
}
function paintBird(mode = 'all', customTransform = null) {
  const c = mode === 'preview' ? prevCtx : mode === 'glider' ? gctx : bctx;
  const w = mode === 'preview' ? prevC.width : birdC.width;
  const wing = mode !== 'pilot', person = mode !== 'glider';
  c.setTransform(1, 0, 0, 1, 0, 0);
  c.globalCompositeOperation = 'source-over';
  c.clearRect(0, 0, w, w);
  if (customTransform) customTransform(c, w);
  else c.setTransform(scale * 0.95, 0, 0, scale * 0.95, w / 2, w / 2);
  c.lineCap = 'round'; c.lineJoin = 'round';
  const ph = bird.phase, pit = bird.pitch, H = HG.apex;
  const cs = Math.cos(pit), sn = Math.sin(pit);
  const rot = (q) => [H[0] + (q[0] - H[0]) * cs - (q[1] - H[1]) * sn, H[1] + (q[0] - H[0]) * sn + (q[1] - H[1]) * cs];
  const bn = rot(HG.barN), bf = rot(HG.barF), nose = rot(HG.nose), tail = rot(HG.tail), hang = rot([-1, -24]);

  // ---- sail, pitched about the hang point ----
  const apex = rot([3, -23]);
  if (wing) {
  c.save();
  c.translate(H[0], H[1]); c.rotate(pit); c.translate(-H[0], -H[1]);
  sailHalf(c, false, Math.sin(ph * 1.7 + 1.9) * 1.2);
  c.fillStyle = G.sailFar; c.fill();
  c.save(); c.clip(); drawWingInner(c, false, LOOK.sf); c.restore();
  sailHalf(c, true, Math.sin(ph * 1.7) * 1.5);
  c.fillStyle = G.sailNear; c.fill();
  c.save(); c.clip(); drawWingInner(c, true, LOOK.sn); c.restore();
  c.strokeStyle = 'rgba(110,90,70,0.45)'; c.lineWidth = 0.8; c.stroke();
  drawWingFrameAndOrnaments(c, ph);
  c.restore();

  // flying wires from the control bar to nose and tail, then the far down tube
  c.strokeStyle = 'rgba(70,74,88,0.55)'; c.lineWidth = 0.6;
  c.beginPath();
  c.moveTo(bf[0], bf[1]); c.lineTo(nose[0], nose[1]); c.moveTo(bf[0], bf[1]); c.lineTo(tail[0], tail[1]);
  c.moveTo(bn[0], bn[1]); c.lineTo(nose[0], nose[1]); c.moveTo(bn[0], bn[1]); c.lineTo(tail[0], tail[1]);
  c.stroke();
  c.strokeStyle = '#8f96a3'; c.lineWidth = 1.4;
  c.beginPath(); c.moveTo(apex[0], apex[1]); c.lineTo(bf[0], bf[1]); c.stroke();
  }

  // ---- pilot ----
  // after a crash the arms flail free instead of holding the bar
  // two-segment limbs (shoulder-elbow-hand, hip-knee-foot) that windmill and kick while he falls,
  // then go limp once he lands
  const sitting = !wing && bird.grounded, hanging = !wing && !bird.grounded && chute && chute.open > 0.5;
  const amp = bird.grounded ? 0 : hanging ? 0.18 : 1, tt = gtime;
  const pid = LOOK.pilotId;
  const isFemale = pid === 'atmaca' || pid === 'bulut' || pid === 'yildiz' || pid === 'luna';
  const skinCol = pid === 'luna' ? '#f6d2ba' : isFemale ? '#f3c6a6' : pid === 'dogan' ? '#dfb08a' : pid === 'kor' ? '#c99a78' : '#e4b892';
  // the slow breath of the embers on Kor's armour
  const emb = 0.55 + 0.45 * Math.sin(gtime * 3.2);
  const rr = (x, y, w2, h2, r) => { c.beginPath(); if (c.roundRect) c.roundRect(x, y, w2, h2, r); else c.rect(x, y, w2, h2); };
  const seg2 = (sx, sy, a, l1, bend, l2) => {
    const ex = sx + Math.cos(a) * l1, ey = sy + Math.sin(a) * l1;
    return [sx, sy, ex, ey, ex + Math.cos(a + bend) * l2, ey + Math.sin(a + bend) * l2];
  };
  const armF = seg2(6, -1.5, (sitting ? Math.PI + 0.5 : hanging ? -0.35 : -2.0) + Math.sin(tt * 11) * 2.1 * amp, 8, (sitting ? -0.2 : hanging ? -0.3 : 0.9) + Math.sin(tt * 15) * 0.6 * amp, 7.5);
  const armN = seg2(6.5, 2, (sitting ? Math.PI + 0.3 : hanging ? -0.15 : -1.0) + Math.sin(tt * 11 + 2.7) * 2.1 * amp, 8, (sitting ? -0.2 : hanging ? -0.4 : 0.8) + Math.sin(tt * 14 + 1) * 0.6 * amp, 7.5);
  const legF = seg2(-10, 0.5, (sitting ? Math.PI / 2 - 0.1 : Math.PI - 0.15) + Math.sin(tt * 9 + 0.5) * 1.3 * amp, 10, (sitting ? 0.65 : -0.5) - (0.5 + 0.5 * Math.sin(tt * 13)) * 1.4 * amp, 10);
  const legN = seg2(-10, 3.5, (sitting ? Math.PI / 2 + 0.05 : Math.PI + 0.1) + Math.sin(tt * 9 + 3.4) * 1.3 * amp, 10, (sitting ? 0.55 : -0.4) - (0.5 + 0.5 * Math.sin(tt * 12 + 2)) * 1.4 * amp, 10);
  // standing on the cliff the whole figure swings upright under the hang point, hands up on the down tubes
  const st = wing && mode !== 'preview' ? standK : 0, lean = -1.2 * st, pv = [-2 - 2 * st, -3 + 5 * st];
  const pc = Math.cos(lean), ps = Math.sin(lean);
  const poseOn = () => { c.save(); if (st > 0.001) { c.translate(pv[0], pv[1]); c.rotate(lean); c.translate(2, 3); } };
  const toBody = (q) => { const dx = q[0] - pv[0], dy = q[1] - pv[1]; return [-2 + dx * pc + dy * ps, -3 - dx * ps + dy * pc]; };
  const fromBody = (q) => { const dx = q[0] + 2, dy = q[1] + 3; return [pv[0] + dx * pc - dy * ps, pv[1] + dx * ps + dy * pc]; };
  const grip = (bar) => toBody([lerp(bar[0], apex[0], 0.5 * st), lerp(bar[1], apex[1], 0.5 * st)]);
  const handF = wing ? grip(bf) : [armF[4], armF[5]], handN = wing ? grip(bn) : [armN[4], armN[5]];
  const stick = (q, w1) => { c.lineWidth = w1; c.beginPath(); c.moveTo(q[0], q[1]); c.lineTo(q[2], q[3]); c.lineTo(q[4], q[5]); c.stroke(); };
  const boot = (q, col) => { const a = Math.atan2(q[5] - q[3], q[4] - q[2]); c.fillStyle = col; c.beginPath(); c.ellipse(q[4], q[5], 3.9, 2.5, a, 0, TAU); c.fill(); };
  if (person) {
  // hang strap to the keel and the far arm, both behind the body
  if (wing) { c.strokeStyle = '#3b2c22'; c.lineWidth = 1.4; c.beginPath(); c.moveTo(hang[0], hang[1]); c.lineTo(pv[0], pv[1]); c.stroke(); }
  poseOn();
  c.strokeStyle = LOOK.arm[0]; c.lineWidth = isFemale ? 2.9 : 3.2;
  if (wing) { c.beginPath(); c.moveTo(6, -1.5); c.quadraticCurveTo((6 + handF[0]) / 2 + 1, (-1.5 + handF[1]) / 2 - 3, handF[0], handF[1]); c.stroke(); }
  else stick(armF, isFemale ? 2.9 : 3.2);
  if (!wing) {
    c.strokeStyle = LOOK.pants[0]; stick(legF, 4.8); boot(legF, LOOK.boots[0]);
    c.strokeStyle = LOOK.pants[1]; stick(legN, 5.2); boot(legN, LOOK.boots[1]);
  } else {
  // legs trailing in the harness, character-specific pants and boots
  const kick = Math.sin(ph * 0.9) * 0.8 * (1 - st);
  // walking: the feet swing past each other, each one lifting as it comes forward
  const wk = walkK * st, wph = bird.x / 9, sw = Math.sin(wph) * 8 * wk, lf = Math.max(0, Math.cos(wph)) * 3.4 * wk, ln = Math.max(0, -Math.cos(wph)) * 3.4 * wk;
  c.strokeStyle = LOOK.pants[0]; c.lineWidth = isFemale ? 4.4 : 4.8;
  c.beginPath(); c.moveTo(-10, 0.5); c.quadraticCurveTo(-20 + lf, 0 + sw * 0.7, -28 + lf, -0.5 + kick + sw); c.stroke();
  c.strokeStyle = LOOK.pants[1]; c.lineWidth = isFemale ? 4.8 : 5.2;
  c.beginPath(); c.moveTo(-10, 3.5); c.quadraticCurveTo(-20 + ln, 5 - sw * 0.7, -29 + ln, 4.4 - kick - sw); c.stroke();
  c.fillStyle = LOOK.boots[0]; c.beginPath(); c.ellipse(-30.6 + lf, -0.6 + kick + sw, 3.8, 2.4, 0.1, 0, TAU); c.fill();
  c.fillStyle = LOOK.boots[1]; c.beginPath(); c.ellipse(-31.6 + ln, 4.6 - kick - sw, 4, 2.6, -0.05, 0, TAU); c.fill();
  if (pid === 'bulut') {
    // Fluffy snow-white fur cuffs on Bulut's winter boots
    c.fillStyle = '#ffffff';
    c.beginPath(); c.ellipse(-27.8, -0.4 + kick, 1.5, 2.5, 0.1, 0, TAU); c.ellipse(-28.6, 4.4 - kick, 1.6, 2.7, -0.05, 0, TAU); c.fill();
  } else if (pid === 'atmaca') {
    // Gold knee-boot trim on Atmaca's hunter boots
    c.strokeStyle = '#f0c050'; c.lineWidth = 1.1;
    c.beginPath(); c.moveTo(-25, 2.2 - kick * 0.5); c.lineTo(-25, 6.2 - kick * 0.5); c.stroke();
  } else if (pid === 'dogan') {
    // Glowing orange knee/boot accents on Doğan's speed suit
    c.strokeStyle = '#ff6e4a'; c.lineWidth = 1.2;
    c.beginPath(); c.moveTo(-20, 2.8); c.lineTo(-22, 5.5); c.moveTo(-33, 5.2 - kick); c.lineTo(-29, 5.8 - kick); c.stroke();
  } else if (pid === 'yildiz') {
    // Gold royal boot cuffs on Yıldız
    c.strokeStyle = '#fff0a8'; c.lineWidth = 1.1;
    c.beginPath(); c.moveTo(-27.5, 2.4 - kick * 0.6); c.lineTo(-28.2, 6.4 - kick * 0.6); c.stroke();
  } else if (pid === 'kor') {
    // ember-lit greaves
    c.strokeStyle = `rgba(255,154,60,${emb.toFixed(3)})`; c.lineWidth = 1.2;
    c.beginPath(); c.moveTo(-19, 2.6); c.lineTo(-22, 5.6); c.moveTo(-24, 3.4 - kick * 0.4); c.lineTo(-27.5, 5.8 - kick * 0.7); c.stroke();
  } else if (pid === 'luna') {
    c.strokeStyle = '#7fe8e0'; c.lineWidth = 1.1;
    c.beginPath(); c.moveTo(-27.5, 2.4 - kick * 0.6); c.lineTo(-28.2, 6.4 - kick * 0.6); c.stroke();
  } else if (pid === 'nova') {
    // orange rings at the knee and the boot top
    c.strokeStyle = '#ff7a3c'; c.lineWidth = 1.6;
    c.beginPath(); c.moveTo(-19.6, 2.4); c.lineTo(-20.4, 6.4); c.moveTo(-26.6, 2.2 - kick * 0.6); c.lineTo(-27.4, 6.6 - kick * 0.6); c.stroke();
  }
  }

  // ---- torso & character-specific signature outfit (kıyafet) ----
  const sway = clamp(-bird.vy / 500, -1, 1);
  c.beginPath(); c.ellipse(-1, 1.5, 11.5, isFemale ? 4.9 : 5.4, -0.03, 0, TAU); c.fillStyle = G.tunic; c.fill();
  if (pid === 'ruzgar') {
    // Rüzgâr: Vintage brown leather bomber jacket with fluffy cream shearling collar & waist trim + brass zipper
    c.fillStyle = '#efe5cf';
    c.beginPath(); c.ellipse(-11.2, 1.6, 1.8, 4.6, 0.08, 0, TAU); c.fill();
    for (const [fx, fy, fr] of [[6.8, -1.6, 1.8], [7.8, 0.4, 1.9], [7.2, 2.6, 1.8], [5.8, 4.2, 1.6]]) {
      c.beginPath(); c.arc(fx, fy, fr, 0, TAU); c.fill();
    }
    c.strokeStyle = '#d4a64a'; c.lineWidth = 1.0;
    c.beginPath(); c.moveTo(-9.5, 2.2); c.lineTo(6.2, 1.8); c.stroke();
    c.strokeStyle = '#5c3418'; c.lineWidth = 1.3;
    c.beginPath(); c.moveTo(-6, -3.5); c.lineTo(-4.5, 6.3); c.moveTo(3.5, -3.5); c.lineTo(2, 6.5); c.stroke();
  } else if (pid === 'atmaca') {
    // Atmaca: Crimson-burgundy hunter tunic with flared peplum skirt, golden corset sash & V-neck gold trim
    c.fillStyle = '#9e2432'; c.strokeStyle = '#f0c050'; c.lineWidth = 1.0;
    c.beginPath();
    c.moveTo(-6.5, -3.1); c.lineTo(-15.5, -3.8); c.lineTo(-13.2, 0.2); c.lineTo(-16.2, 3.2); c.lineTo(-12.8, 6.2); c.lineTo(-6.2, 5.8);
    c.closePath(); c.fill(); c.stroke();
    // wide golden waist corset belt & fluttering sash
    c.fillStyle = '#e8b648';
    c.beginPath(); c.moveTo(-6.8, -3.2); c.lineTo(-3.2, -3.4); c.lineTo(-4.2, 6.0); c.lineTo(-7.6, 5.7); c.closePath(); c.fill();
    // gold-trimmed V-neck collar & cross straps
    c.strokeStyle = '#f5ce6e'; c.lineWidth = 1.25;
    c.beginPath(); c.moveTo(7.8, -1.6); c.lineTo(1.2, 1.4); c.lineTo(7.4, 4.2); c.moveTo(-3.5, -3.3); c.lineTo(3.8, 5.8); c.stroke();
  } else if (pid === 'bulut') {
    // Bulut: Quilted sky-blue Nordic winter parka with fluffy snow-white fur hood ruff, fur hem & diamond pattern
    c.strokeStyle = 'rgba(255,255,255,0.45)'; c.lineWidth = 0.9;
    c.beginPath(); c.moveTo(-7, -3.2); c.lineTo(-8, 5.8); c.moveTo(-2, -3.5); c.lineTo(-3, 6.2); c.moveTo(3, -3.2); c.lineTo(2, 6.0); c.stroke();
    // geometric white-and-gold Nordic pattern band
    c.strokeStyle = '#fff6d6'; c.lineWidth = 1.4;
    c.beginPath(); c.moveTo(-1.5, -3.2); c.lineTo(0.5, -0.5); c.lineTo(-1.5, 2.0); c.lineTo(0.5, 4.5); c.stroke();
    // fluffy white fur hem & thick fur collar ruff
    c.fillStyle = '#ffffff';
    for (const [fx, fy, fr] of [[-11.5, -1.6, 1.9], [-12.0, 0.8, 2.0], [-11.8, 3.2, 2.0], [-10.8, 5.0, 1.8], [6.6, -2.0, 2.1], [7.8, 0.2, 2.2], [7.4, 2.6, 2.1], [6.0, 4.5, 1.9]]) {
      c.beginPath(); c.arc(fx, fy, fr, 0, TAU); c.fill();
    }
  } else if (pid === 'dogan') {
    // Doğan: Futuristic carbon-black speed armor with glowing cyan/orange chevrons, shoulder pauldrons & fluttering wing-cape
    const cw = Math.sin(gtime * 12) * 1.4 - sway * 2.5;
    c.fillStyle = '#181e2c'; c.strokeStyle = '#ff6e4a'; c.lineWidth = 1.0;
    c.beginPath();
    c.moveTo(4.5, -3.2); c.quadraticCurveTo(-8, -7.8 + cw * 0.5, -21, -6.2 + cw);
    c.lineTo(-16, -2.2 + cw * 0.6); c.lineTo(-22, 0.5 + cw); c.lineTo(-7, 1.2);
    c.closePath(); c.fill(); c.stroke();
    // glowing cyan & orange speed chevrons on armored torso
    c.strokeStyle = '#66f0ff'; c.lineWidth = 1.3;
    c.beginPath(); c.moveTo(-6, -1.8); c.lineTo(-1, 1.4); c.lineTo(-7, 4.6); c.moveTo(0, -2.0); c.lineTo(5, 1.2); c.lineTo(-1, 4.8); c.stroke();
    // armored shoulder pauldron
    c.fillStyle = '#2b354a'; c.strokeStyle = '#ff6e4a'; c.lineWidth = 1.0;
    c.beginPath(); c.ellipse(5.8, 1.2, 3.8, 2.8, 0.2, 0, TAU); c.fill(); c.stroke();
  } else if (pid === 'yildiz') {
    // Yıldız: Royal violet gown with scalloped gold-trimmed skirt, golden celestial collar & floating starry cape
    const cw = Math.sin(gtime * 9.5) * 1.5 - sway * 2.5;
    c.fillStyle = 'rgba(98,58,195,0.78)'; c.strokeStyle = '#ffd86b'; c.lineWidth = 1.0;
    c.beginPath();
    c.moveTo(5.2, -3.0); c.quadraticCurveTo(-7, -7.5 + cw * 0.5, -22, -5.8 + cw);
    c.quadraticCurveTo(-18, -1.0 + cw * 0.7, -20, 2.5 + cw);
    c.quadraticCurveTo(-10, 3.0, -4, 1.5);
    c.closePath(); c.fill(); c.stroke();
    // scalloped royal skirt hem & golden star belt
    c.fillStyle = '#6b42c8'; c.strokeStyle = '#ffd86b'; c.lineWidth = 1.0;
    c.beginPath();
    c.moveTo(-6.5, -3.0); c.quadraticCurveTo(-16, -3.5, -14.5, -0.5); c.quadraticCurveTo(-17, 2.2, -14.2, 4.8); c.quadraticCurveTo(-11, 6.8, -6.5, 5.8);
    c.closePath(); c.fill(); c.stroke();
    c.fillStyle = '#ffd86b';
    c.beginPath(); c.ellipse(-6.2, 1.4, 1.4, 4.7, 0.05, 0, TAU); c.fill();
    // ornate golden royal necklace/collar
    c.strokeStyle = '#ffe680'; c.lineWidth = 1.6;
    c.beginPath(); c.arc(5.2, 1.2, 3.6, -Math.PI * 0.42, Math.PI * 0.42); c.stroke();
  } else if (pid === 'kor') {
    // Kor: a torn cape that burns along its edge, obsidian plates with molten cracks, a spiked pauldron
    const cw = Math.sin(gtime * 11) * 1.5 - sway * 2.5;
    c.fillStyle = '#4a0e14';
    c.beginPath();
    c.moveTo(5, -3.2); c.quadraticCurveTo(-8, -8.2 + cw * 0.5, -22, -7 + cw);
    c.lineTo(-18.5, -4.6 + cw * 0.8); c.lineTo(-25, -3 + cw * 1.1); c.lineTo(-19.5, -1.2 + cw * 0.7); c.lineTo(-24, 1.2 + cw); c.lineTo(-7, 1.4);
    c.closePath(); c.fill();
    c.fillStyle = `rgba(255,122,46,${(0.5 + 0.35 * emb).toFixed(3)})`;
    c.beginPath();
    c.moveTo(-11, -5.4 + cw * 0.4); c.lineTo(-21, -6.4 + cw); c.lineTo(-18, -4.4 + cw * 0.8); c.lineTo(-23.6, -3 + cw * 1.1); c.lineTo(-18.6, -1.4 + cw * 0.7); c.lineTo(-22.4, 0.7 + cw); c.lineTo(-13, 0.2);
    c.closePath(); c.fill();
    c.fillStyle = `rgba(255,224,150,${(0.3 + 0.5 * emb).toFixed(3)})`;
    c.beginPath(); c.moveTo(-14, -3.6 + cw * 0.5); c.lineTo(-20.4, -3.1 + cw); c.lineTo(-15, -1.5 + cw * 0.5); c.closePath(); c.fill();
    c.strokeStyle = '#0a0608'; c.lineWidth = 1.1;
    c.beginPath(); c.moveTo(-6.5, -3.4); c.quadraticCurveTo(-4.6, 1.5, -6.8, 6.2); c.moveTo(-1, -3.8); c.quadraticCurveTo(1, 1.5, -1.2, 6.6); c.moveTo(4, -3.4); c.quadraticCurveTo(5.6, 1.4, 3.6, 6.2); c.stroke();
    c.strokeStyle = `rgba(255,154,60,${(0.45 + 0.55 * emb).toFixed(3)})`; c.lineWidth = 1;
    c.beginPath(); c.moveTo(-9.6, 0); c.lineTo(-7.8, 1.8); c.lineTo(-8.6, 3.8); c.moveTo(-4, -1.6); c.lineTo(-2.6, 0.6); c.lineTo(-3.8, 2.4); c.lineTo(-2.4, 4.4); c.moveTo(1.4, -1.2); c.lineTo(2.6, 1.2); c.lineTo(1.6, 3.4); c.stroke();
    c.fillStyle = '#241a1e'; c.strokeStyle = '#ff8a2e'; c.lineWidth = 0.9;
    c.beginPath(); c.ellipse(5.8, 1.2, 3.9, 2.9, 0.2, 0, TAU); c.fill(); c.stroke();
    c.fillStyle = '#d8c8a8'; c.beginPath(); c.moveTo(4.2, -1.3); c.lineTo(5, -5.6); c.lineTo(7, -1.1); c.closePath(); c.fill();
  } else if (pid === 'luna') {
    // Luna: a long veil in two sheer layers with stars caught in it, a pale robe, a teal sash and a crescent clasp
    const cw = Math.sin(gtime * 7.5) * 1.6 - sway * 2.5;
    for (const [len, al, off] of [[31, 0.3, 0.9], [25, 0.48, 0]]) {
      const w2 = Math.sin(gtime * 7.5 + off) * 1.6 - sway * 2.5;
      c.fillStyle = `rgba(190,225,255,${al})`;
      c.beginPath();
      c.moveTo(5.5, -3.2); c.quadraticCurveTo(-8, -8.6 + w2 * 0.5, -len + 4, -7.4 + w2);
      c.quadraticCurveTo(-len - 1, -3 + w2 * 0.9, -len + 2, 1.6 + w2);
      c.quadraticCurveTo(-12, 2.6, -4, 1.4);
      c.closePath(); c.fill();
    }
    c.fillStyle = '#ffffff';
    for (const [vx, vy, f] of [[-9, -4.6, 0], [-15, -2.4, 1.7], [-20, -5.2, 3.1], [-22.5, -0.8, 4.4]]) {
      c.globalAlpha = 0.3 + 0.7 * Math.pow(Math.max(0, Math.sin(gtime * 2.6 + f)), 2);
      star4(c, vx, vy + cw * 0.6, 1.3);
    }
    c.globalAlpha = 1;
    c.fillStyle = '#e9f0ff'; c.strokeStyle = '#7fe8e0'; c.lineWidth = 0.9;
    c.beginPath();
    c.moveTo(-6.5, -3); c.quadraticCurveTo(-16.5, -3.8, -15, -0.4); c.quadraticCurveTo(-17.6, 2.4, -14.4, 5); c.quadraticCurveTo(-11, 6.9, -6.5, 5.8);
    c.closePath(); c.fill(); c.stroke();
    c.fillStyle = '#5fd8d0'; c.beginPath(); c.ellipse(-6.2, 1.4, 1.3, 4.7, 0.05, 0, TAU); c.fill();
    c.fillStyle = '#ffe9a8'; c.beginPath(); c.arc(0.4, 1.4, 2.4, 0, TAU); c.arc(1.1, 1.1, 1.6, 0, TAU, true); c.fill('evenodd');
    c.strokeStyle = '#7fe8e0'; c.lineWidth = 1.3;
    c.beginPath(); c.arc(5.2, 1.2, 3.6, -Math.PI * 0.42, Math.PI * 0.42); c.stroke();
  } else if (pid === 'nova') {
    // Nova: a rocket pack with a flickering flame, suit seams, a chest panel of blinking lights, an air hose
    const fl = 0.72 + 0.28 * Math.sin(gtime * 31) * Math.sin(gtime * 13 + 1);
    c.fillStyle = `rgba(110,190,255,${(0.38 * fl).toFixed(3)})`;
    c.beginPath(); c.moveTo(-9.6, -7.8); c.lineTo(-9.6 - 15 * fl, -5.6); c.lineTo(-9.6, -3.4); c.closePath(); c.fill();
    c.fillStyle = `rgba(235,250,255,${(0.92 * fl).toFixed(3)})`;
    c.beginPath(); c.moveTo(-9.6, -6.8); c.lineTo(-9.6 - 8 * fl, -5.6); c.lineTo(-9.6, -4.4); c.closePath(); c.fill();
    c.fillStyle = '#c8d0dc'; c.strokeStyle = '#8a94a8'; c.lineWidth = 0.8;
    rr(-9, -8.3, 13, 5.5, 2); c.fill(); c.stroke();
    c.fillStyle = '#39445c'; rr(-10.8, -7.5, 2.6, 3.9, 0.8); c.fill();
    c.fillStyle = '#ff7a3c'; c.fillRect(-4.6, -8.3, 2.2, 5.5);
    c.strokeStyle = 'rgba(120,132,156,0.7)'; c.lineWidth = 0.9;
    c.beginPath(); c.moveTo(-6.5, -3.2); c.quadraticCurveTo(-5, 1.5, -6.8, 6.2); c.moveTo(3.6, -3.2); c.quadraticCurveTo(5, 1.4, 3.4, 6.2); c.stroke();
    c.fillStyle = '#39445c'; rr(-3.8, 0, 6.8, 3.8, 0.9); c.fill();
    const leds = ['#ff5a5a', '#5aff8a', '#5ab4ff'];
    for (let i = 0; i < 3; i++) {
      c.globalAlpha = Math.sin(gtime * 4 + i * 2.1) > 0 ? 1 : 0.3; c.fillStyle = leds[i];
      c.beginPath(); c.arc(-2.3 + i * 1.95, 1.9, 0.8, 0, TAU); c.fill();
    }
    c.globalAlpha = 1;
    c.strokeStyle = '#ff7a3c'; c.lineWidth = 1.5; c.beginPath(); c.arc(6, 1.2, 3.4, Math.PI * 0.6, Math.PI * 1.4); c.stroke();
    c.strokeStyle = '#8a94a8'; c.lineWidth = 1; c.beginPath(); c.moveTo(2, -3.2); c.quadraticCurveTo(6, -6.6, 9.4, -4.8); c.stroke();
  }
  c.fillStyle = '#c9ccd4'; c.beginPath(); c.arc(-2, -3, 1.4, 0, TAU); c.fill();
  // scarf streaming behind: a simple ribbon in the shop preview, cloth towed through the air in flight
  if (mode === 'preview') {
    const sc = 10;
    for (let i = 0; i < sc; i++) {
      const t = i / (sc - 1);
      scarfPts[i * 2] = 8.5 - t * 40;
      scarfPts[i * 2 + 1] = -3.6 + Math.sin(gtime * 10 - i * 0.9) * t * 4 - t * 1.5 - sway * t * 8;
    }
    c.beginPath();
    for (let i = 0; i < sc; i++) { const wd = 2.3 * (1 - (i / sc) * 0.6); if (i) c.lineTo(scarfPts[i * 2], scarfPts[i * 2 + 1] - wd); else c.moveTo(scarfPts[0], scarfPts[1] - wd); }
    for (let i = sc - 1; i >= 0; i--) { const wd = 2.3 * (1 - (i / sc) * 0.6); c.lineTo(scarfPts[i * 2], scarfPts[i * 2 + 1] + wd); }
    c.closePath(); c.fillStyle = G.scarf; c.fill();
  } else {
    c.restore();
    drawScarf(c, fromBody([8.5, -3.6]));
    poseOn();
  }

  // ---- character-specific back hair (streaming in the wind) ----
  const hw = (i, f = 11) => Math.sin(gtime * f - i * 0.85) * (0.8 + i * 0.45) - sway * i * 0.9;
  if (pid === 'atmaca') {
    // Long, lush fiery crimson-copper hair flowing in layered waves
    c.fillStyle = '#a82218';
    c.beginPath();
    c.moveTo(11, -5.2);
    for (let i = 1; i <= 6; i++) c.lineTo(11 - i * 4.8, -5.8 - i * 0.45 + hw(i, 11.5) - (3.1 - i * 0.35));
    for (let i = 6; i >= 1; i--) c.lineTo(11 - i * 4.6, -3.2 - i * 0.3 + hw(i, 11.5) + (2.6 - i * 0.3));
    c.closePath(); c.fill();
    c.fillStyle = '#e64833';
    c.beginPath();
    c.moveTo(10.5, -4.4);
    for (let i = 1; i <= 6; i++) c.lineTo(10.5 - i * 4.5, -4.8 - i * 0.4 + hw(i + 0.5, 11.5) - (2.1 - i * 0.28));
    for (let i = 6; i >= 1; i--) c.lineTo(10.5 - i * 4.3, -3.6 - i * 0.3 + hw(i + 0.5, 11.5) + (1.6 - i * 0.22));
    c.closePath(); c.fill();
    c.strokeStyle = '#ff8563'; c.lineWidth = 1.1;
    c.beginPath();
    c.moveTo(9.5, -4.6);
    for (let i = 1; i <= 5; i++) c.lineTo(9.5 - i * 4.2, -4.5 - i * 0.35 + hw(i, 11.5));
    c.stroke();
  } else if (pid === 'bulut') {
    // Long golden-blonde woven braid (saç örgüsü) with turquoise ribbon at the tip
    for (let i = 0; i < 6; i++) {
      const bx = 7.8 - i * 3.7, by = -2.6 - i * 0.45 + hw(i, 9.5);
      const r = 2.6 - i * 0.18;
      c.fillStyle = i % 2 === 0 ? '#f2c85b' : '#dca83a';
      c.strokeStyle = '#9c6e18'; c.lineWidth = 0.7;
      c.beginPath(); c.ellipse(bx, by, r * 1.25, r * 0.85, (i % 2 ? 0.38 : -0.38), 0, TAU); c.fill(); c.stroke();
    }
    const tx = 7.8 - 6 * 3.7, ty = -2.6 - 6 * 0.45 + hw(6, 9.5);
    c.fillStyle = '#f2c85b';
    c.beginPath(); c.moveTo(tx + 1, ty); c.lineTo(tx - 5.5, ty - 2.2 + hw(7, 9.5) * 0.2); c.lineTo(tx - 4.8, ty + 2.2 + hw(7, 9.5) * 0.2); c.closePath(); c.fill();
    c.fillStyle = '#4fd1c5';
    c.beginPath(); c.arc(tx + 0.6, ty, 1.7, 0, TAU); c.fill();
  } else if (pid === 'dogan') {
    // Sleek high warrior ponytail in jet-black with crimson hair-tie
    c.fillStyle = '#161b26';
    c.beginPath();
    c.moveTo(6.8, -5.0);
    for (let i = 1; i <= 5; i++) c.lineTo(6.8 - i * 4.6, -5.6 - i * 0.55 + hw(i, 13) - (2.2 - i * 0.32));
    for (let i = 5; i >= 1; i--) c.lineTo(6.8 - i * 4.3, -4.4 - i * 0.45 + hw(i, 13) + (1.6 - i * 0.25));
    c.closePath(); c.fill();
    c.strokeStyle = '#3d4c6b'; c.lineWidth = 1.0;
    c.beginPath(); c.moveTo(6.2, -5.0); c.quadraticCurveTo(-3, -7 + hw(2, 13), -13, -7.5 + hw(4, 13)); c.stroke();
    c.fillStyle = '#ff6e4a';
    c.beginPath(); c.ellipse(7.2, -4.9, 1.3, 2.0, 0.2, 0, TAU); c.fill();
  } else if (pid === 'yildiz') {
    // Long wavy midnight-violet hair studded with sparkling gold stars
    c.fillStyle = '#381e68';
    c.beginPath();
    c.moveTo(11, -5.2);
    for (let i = 1; i <= 6; i++) c.lineTo(11 - i * 4.9, -5.8 - i * 0.5 + hw(i, 10) - (3.3 - i * 0.35));
    for (let i = 6; i >= 1; i--) c.lineTo(11 - i * 4.7, -3.0 - i * 0.35 + hw(i, 10) + (2.8 - i * 0.32));
    c.closePath(); c.fill();
    c.fillStyle = '#7b52d6';
    c.beginPath();
    c.moveTo(10.2, -4.5);
    for (let i = 1; i <= 5; i++) c.lineTo(10.2 - i * 4.5, -4.8 - i * 0.42 + hw(i + 0.7, 10) - (1.9 - i * 0.25));
    for (let i = 5; i >= 1; i--) c.lineTo(10.2 - i * 4.3, -3.5 - i * 0.32 + hw(i + 0.7, 10) + (1.5 - i * 0.2));
    c.closePath(); c.fill();
    c.fillStyle = '#ffe680';
    for (const i of [1.6, 3.2, 4.7]) {
      const sx = 10.5 - i * 4.5, sy = -4.6 - i * 0.4 + hw(i, 10);
      c.beginPath(); c.arc(sx, sy, 1.15, 0, TAU); c.fill();
    }
  } else if (pid === 'kor') {
    // embers lifting off the cape behind him
    for (let i = 0; i < 4; i++) {
      const u = (gtime * 0.8 + i * 0.25) % 1;
      c.globalAlpha = (1 - u) * 0.85; c.fillStyle = i % 2 ? '#ffd98a' : '#ff8a2e';
      c.beginPath(); c.arc(2 - u * 24, -6.5 - u * 5 + Math.sin(u * 8 + i * 2) * 1.6, 1.1 * (1 - u * 0.5), 0, TAU); c.fill();
    }
    c.globalAlpha = 1;
  } else if (pid === 'luna') {
    // very long silver hair, a brighter layer over it and one moonlit streak
    c.fillStyle = '#b9c6e6';
    c.beginPath();
    c.moveTo(11, -5.2);
    for (let i = 1; i <= 7; i++) c.lineTo(11 - i * 4.9, -5.8 - i * 0.5 + hw(i, 8.5) - (3.4 - i * 0.33));
    for (let i = 7; i >= 1; i--) c.lineTo(11 - i * 4.7, -3.0 - i * 0.35 + hw(i, 8.5) + (2.9 - i * 0.3));
    c.closePath(); c.fill();
    c.fillStyle = '#f4f7ff';
    c.beginPath();
    c.moveTo(10.2, -4.5);
    for (let i = 1; i <= 6; i++) c.lineTo(10.2 - i * 4.5, -4.8 - i * 0.42 + hw(i + 0.7, 8.5) - (2 - i * 0.25));
    for (let i = 6; i >= 1; i--) c.lineTo(10.2 - i * 4.3, -3.5 - i * 0.32 + hw(i + 0.7, 8.5) + (1.6 - i * 0.2));
    c.closePath(); c.fill();
    c.strokeStyle = 'rgba(255,255,255,0.95)'; c.lineWidth = 0.9;
    c.beginPath(); c.moveTo(9.5, -4.6);
    for (let i = 1; i <= 6; i++) c.lineTo(9.5 - i * 4.4, -4.6 - i * 0.4 + hw(i, 8.5));
    c.stroke();
  } else if (pid === 'nova') {
    // no hair shows under the helmet
  } else {
    // Rüzgâr: windblown messy chestnut locks at the nape
    c.fillStyle = '#5a341e';
    c.beginPath();
    c.moveTo(8.5, -3.8); c.lineTo(2.2, -5.6 + hw(1, 11) * 0.5); c.lineTo(5.0, -2.5);
    c.lineTo(1.2, -3.2 + hw(1.5, 11) * 0.5); c.lineTo(4.8, -0.8);
    c.lineTo(2.4, -0.4 + hw(2, 11) * 0.4); c.lineTo(8.8, -0.5);
    c.closePath(); c.fill();
  }

  // ---- head, face, headgear & front hair locks ----
  c.fillStyle = skinCol; c.beginPath(); c.arc(12.5, -1.2, 4.9, 0, TAU); c.fill();
  // nose / facial profile
  c.fillStyle = isFemale ? '#e2ae8c' : '#d9a47c';
  c.beginPath();
  if (isFemale) { c.moveTo(17.1, -0.6); c.lineTo(18.2, 0.6); c.lineTo(16.8, 1.1); }
  else { c.moveTo(17.2, -0.4); c.lineTo(18.4, 1); c.lineTo(16.8, 1.4); }
  c.closePath(); c.fill();
  // rosy cheek blush & eyelashes for female pilots
  if (isFemale) {
    c.fillStyle = pid === 'yildiz' ? 'rgba(230,115,165,0.48)' : 'rgba(240,105,115,0.48)';
    c.beginPath(); c.ellipse(14.8, 0.9, 1.5, 0.95, 0.1, 0, TAU); c.fill();
  }

  if (pid === 'atmaca') {
    // Crown of red hair + crimson pilot bandana + loose cheek lock + amber cat-eye glasses
    c.fillStyle = '#c83424';
    c.beginPath(); c.arc(12.1, -2.1, 5.4, Math.PI * 0.88, Math.PI * 1.98); c.closePath(); c.fill();
    c.fillStyle = '#961b16';
    c.beginPath(); c.moveTo(7.1, -2.4); c.quadraticCurveTo(12.4, -5.2, 17.3, -3.1); c.lineTo(17.0, -1.5); c.quadraticCurveTo(12.2, -3.3, 7.2, -0.9); c.closePath(); c.fill();
    c.strokeStyle = '#ffd27a'; c.lineWidth = 0.7;
    c.beginPath(); c.moveTo(7.3, -1.7); c.quadraticCurveTo(12.3, -4.1, 17.1, -2.3); c.stroke();
    // front red hair lock framing cheek
    c.fillStyle = '#df432f';
    c.beginPath(); c.moveTo(13.2, -2.2); c.quadraticCurveTo(11.8, 1.2, 13.4, 3.6); c.quadraticCurveTo(14.4, 1.2, 14.3, -2.0); c.closePath(); c.fill();
    // sleek amber flight visor/glasses & winged eyelash
    c.strokeStyle = '#2b1614'; c.lineWidth = 1.1;
    c.beginPath(); c.moveTo(13.6, -2.3); c.lineTo(14.8, -3.1); c.stroke();
    c.fillStyle = bird.dead ? '#3a3a44' : '#ffbe42';
    c.strokeStyle = '#7a3b10'; c.lineWidth = 0.9;
    c.beginPath(); c.moveTo(14.2, -2.5); c.lineTo(17.5, -3.1); c.lineTo(16.9, -1.0); c.lineTo(14.4, -1.2); c.closePath(); c.fill(); c.stroke();
    if (!bird.dead) { c.fillStyle = '#fff'; c.beginPath(); c.arc(16.2, -2.4, 0.45, 0, TAU); c.fill(); }
  } else if (pid === 'bulut') {
    // Cozy cloud ushanka hat with fluffy white fur puffs + blonde side bangs + rose goggles
    c.fillStyle = '#d6e1ee';
    c.beginPath(); c.arc(12.0, -2.0, 5.5, Math.PI * 0.9, Math.PI * 2.04); c.closePath(); c.fill();
    // blonde side bangs
    c.fillStyle = '#f2c85b';
    c.beginPath(); c.moveTo(13.5, -2.5); c.quadraticCurveTo(12.2, 0.6, 13.5, 2.8); c.quadraticCurveTo(14.7, 0.5, 14.6, -2.2); c.closePath(); c.fill();
    // fluffy white fur brim & ear-flap
    c.fillStyle = '#ffffff';
    for (const [fx, fy, fr] of [[8.4, -2.2, 2.1], [10.6, -3.2, 2.2], [13.2, -3.7, 2.2], [15.8, -3.6, 2.0], [10.8, -0.4, 2.1], [10.9, 1.5, 1.8]]) {
      c.beginPath(); c.arc(fx, fy, fr, 0, TAU); c.fill();
    }
    // rose-tinted round goggles & eyelashes
    c.strokeStyle = '#4a3525'; c.lineWidth = 1.0;
    c.beginPath(); c.moveTo(13.8, -2.3); c.lineTo(14.8, -3.0); c.stroke();
    c.fillStyle = '#d4a24e'; c.beginPath(); c.arc(15.8, -2.0, 2.05, 0, TAU); c.fill();
    c.fillStyle = bird.dead ? '#3a3a44' : '#ff9ec7'; c.beginPath(); c.arc(15.9, -2.0, 1.35, 0, TAU); c.fill();
    if (!bird.dead) { c.fillStyle = '#ffffff'; c.beginPath(); c.arc(16.3, -2.5, 0.45, 0, TAU); c.fill(); }
  } else if (pid === 'dogan') {
    // Aerodynamic dark-navy falcon helmet, orange crest, cyan speed-visor & chin guard
    c.fillStyle = LOOK.helmet;
    c.beginPath(); c.arc(12, -1.8, 5.4, Math.PI * 0.92, Math.PI * 2.08); c.closePath(); c.fill();
    c.fillStyle = '#1b263b';
    c.beginPath(); c.moveTo(9.8, -1.8); c.lineTo(12.8, -1.5); c.lineTo(14.5, 2.6); c.lineTo(11.4, 2.2); c.closePath(); c.fill();
    c.fillStyle = LOOK.crest || '#ff6e4a';
    c.beginPath();
    c.moveTo(13.8, -6.7); c.quadraticCurveTo(8.2, -9.2, 2.6, -6.1); c.quadraticCurveTo(6.8, -5.1, 11.2, -5.0);
    c.closePath(); c.fill();
    c.strokeStyle = '#ffd27a'; c.lineWidth = 1.1;
    c.beginPath(); c.moveTo(7.2, -3.5); c.lineTo(13.6, -4.3); c.stroke();
    // angular cyan speed-visor
    c.fillStyle = bird.dead ? '#3a3a44' : (LOOK.visor || '#66f0ff');
    c.strokeStyle = '#141c2b'; c.lineWidth = 1.0;
    c.beginPath(); c.moveTo(13.2, -2.8); c.lineTo(17.9, -3.0); c.lineTo(17.1, -0.9); c.lineTo(13.6, -1.2); c.closePath(); c.fill(); c.stroke();
    if (!bird.dead) { c.fillStyle = '#ffffff'; c.beginPath(); c.arc(16.4, -2.4, 0.45, 0, TAU); c.fill(); }
  } else if (pid === 'yildiz') {
    // Voluminous violet hair crown + golden star tiara + curled temple lock + violet-gold eyes
    c.fillStyle = '#4b2a88';
    c.beginPath(); c.arc(12.1, -2.1, 5.4, Math.PI * 0.88, Math.PI * 2.0); c.closePath(); c.fill();
    // curled violet cheek lock
    c.fillStyle = '#6c44bd';
    c.beginPath(); c.moveTo(13.2, -2.2); c.quadraticCurveTo(11.6, 1.2, 13.5, 3.7); c.quadraticCurveTo(14.6, 1.4, 14.3, -2.0); c.closePath(); c.fill();
    // golden star tiara / circlet
    c.fillStyle = '#f5c84c'; c.strokeStyle = '#9e6b14'; c.lineWidth = 0.7;
    c.beginPath();
    c.moveTo(8.8, -3.2); c.lineTo(11.8, -5.8); c.lineTo(13.2, -4.2); c.lineTo(15.6, -7.2); c.lineTo(16.6, -4.0); c.lineTo(17.5, -2.6);
    c.quadraticCurveTo(13.2, -3.6, 8.8, -2.2); c.closePath(); c.fill(); c.stroke();
    c.fillStyle = '#fff6c2'; c.beginPath(); c.arc(15.2, -5.3, 0.85, 0, TAU); c.fill();
    // eyelashes & shimmering violet-gold iris/visor
    c.strokeStyle = '#2a164d'; c.lineWidth = 1.1;
    c.beginPath(); c.moveTo(13.5, -2.2); c.lineTo(14.7, -3.1); c.stroke();
    c.fillStyle = '#f5c84c'; c.beginPath(); c.arc(15.7, -2.1, 2.0, 0, TAU); c.fill();
    c.fillStyle = bird.dead ? '#3a3a44' : '#c996ff'; c.beginPath(); c.arc(15.9, -2.1, 1.35, 0, TAU); c.fill();
    if (!bird.dead) { c.fillStyle = '#ffffff'; c.beginPath(); c.arc(16.3, -2.6, 0.48, 0, TAU); c.fill(); }
  } else if (pid === 'kor') {
    // horned dragon helm: jaw guard, two swept-back horns, a spiked brow and a burning eye slit
    c.fillStyle = LOOK.helmet;
    c.beginPath(); c.arc(12, -1.8, 5.5, Math.PI * 0.9, Math.PI * 2.1); c.closePath(); c.fill();
    c.fillStyle = '#2a1c22';
    c.beginPath(); c.moveTo(9.6, -1.8); c.lineTo(13, -1.4); c.lineTo(15.6, 3.2); c.lineTo(11.6, 3); c.closePath(); c.fill();
    c.fillStyle = '#d8c8a8'; c.strokeStyle = '#6a5a44'; c.lineWidth = 0.6;
    c.beginPath(); c.moveTo(12.6, -6.6); c.quadraticCurveTo(7, -11.5, 0.5, -10.6); c.quadraticCurveTo(6, -8.6, 9.4, -5.8); c.closePath(); c.fill(); c.stroke();
    c.beginPath(); c.moveTo(9.2, -5.2); c.quadraticCurveTo(4.5, -8.2, 0.2, -6.6); c.quadraticCurveTo(4.6, -6, 7.4, -3.8); c.closePath(); c.fill(); c.stroke();
    c.fillStyle = '#120c0e';
    c.beginPath(); c.moveTo(13.4, -6.9); c.lineTo(15.6, -8.8); c.lineTo(15.4, -6.2); c.lineTo(17.8, -7); c.lineTo(16.8, -4.6); c.closePath(); c.fill();
    if (!bird.dead) { c.fillStyle = `rgba(255,154,60,${(0.12 + 0.2 * emb).toFixed(3)})`; c.beginPath(); c.arc(16, -2.4, 3.6, 0, TAU); c.fill(); }
    c.fillStyle = bird.dead ? '#3a3a44' : `rgb(255,${(165 + 55 * emb) | 0},70)`;
    c.beginPath(); c.moveTo(13.4, -2.9); c.lineTo(17.8, -3.4); c.lineTo(17.2, -1.5); c.lineTo(13.8, -1.6); c.closePath(); c.fill();
  } else if (pid === 'luna') {
    // a halo of moonlight, silver hair, a circlet carrying a standing crescent, a glowing teal eye
    if (!bird.dead) { c.fillStyle = 'rgba(220,240,255,0.1)'; c.beginPath(); c.arc(12, -4, 9.5, 0, TAU); c.fill(); }
    c.fillStyle = '#e6ecfb';
    c.beginPath(); c.arc(12.1, -2.1, 5.4, Math.PI * 0.88, Math.PI * 2.0); c.closePath(); c.fill();
    c.fillStyle = '#ffffff';
    c.beginPath(); c.moveTo(13.2, -2.2); c.quadraticCurveTo(11.6, 1.2, 13.5, 3.9); c.quadraticCurveTo(14.6, 1.4, 14.3, -2.0); c.closePath(); c.fill();
    c.strokeStyle = '#9fb4dc'; c.lineWidth = 1;
    c.beginPath(); c.moveTo(7.6, -2.6); c.quadraticCurveTo(12.6, -5, 17.2, -3.2); c.stroke();
    if (!bird.dead) { c.fillStyle = 'rgba(255,233,168,0.24)'; c.beginPath(); c.arc(14.4, -7.8, 5 + 0.5 * Math.sin(gtime * 2.2), 0, TAU); c.fill(); }
    c.fillStyle = '#ffd86b'; c.strokeStyle = '#b8862c'; c.lineWidth = 0.45;
    c.beginPath(); c.arc(14.4, -7.8, 3.2, 0, TAU); c.arc(15.3, -8.1, 2.1, 0, TAU, true); c.fill('evenodd'); c.stroke();
    c.strokeStyle = '#3a4468'; c.lineWidth = 1.1;
    c.beginPath(); c.moveTo(13.5, -2.2); c.lineTo(14.7, -3.1); c.stroke();
    c.fillStyle = '#dfe8ff'; c.beginPath(); c.arc(15.7, -2.1, 2.0, 0, TAU); c.fill();
    c.fillStyle = bird.dead ? '#3a3a44' : '#3fd8cc'; c.beginPath(); c.arc(15.9, -2.1, 1.35, 0, TAU); c.fill();
    if (!bird.dead) { c.fillStyle = '#ffffff'; c.beginPath(); c.arc(16.3, -2.6, 0.48, 0, TAU); c.fill(); }
  } else if (pid === 'nova') {
    // a glass helmet with a gold visor that mirrors the sky, an orange neck ring, an antenna with a blinking light
    c.strokeStyle = '#8a94a8'; c.lineWidth = 0.9;
    c.beginPath(); c.moveTo(9.6, -6.6); c.lineTo(7.8, -11); c.stroke();
    c.fillStyle = !bird.dead && Math.sin(gtime * 5) > 0.2 ? '#ff5a5a' : '#7a2a2a';
    c.beginPath(); c.arc(7.7, -11.2, 1.25, 0, TAU); c.fill();
    c.fillStyle = LOOK.helmet; c.strokeStyle = '#a8b2c4'; c.lineWidth = 0.9;
    c.beginPath(); c.arc(12.6, -1.4, 6.3, 0, TAU); c.fill(); c.stroke();
    c.fillStyle = '#ff7a3c'; c.beginPath(); c.ellipse(7.2, 0.6, 1.5, 4.4, 0.25, 0, TAU); c.fill();
    let vis = '#3a3a44';
    if (!bird.dead) {
      vis = c.createLinearGradient(11, -5, 18, 3);
      vis.addColorStop(0, '#fff0b8'); vis.addColorStop(0.5, LOOK.visor || '#ffc857'); vis.addColorStop(1, '#c9731e');
    }
    c.fillStyle = vis; c.strokeStyle = '#8a5a1a'; c.lineWidth = 0.6;
    c.beginPath(); c.moveTo(11.4, -5.6); c.quadraticCurveTo(18.6, -6.4, 18.8, -1.2); c.quadraticCurveTo(18.4, 3.6, 12.6, 3.4); c.quadraticCurveTo(10, -1, 11.4, -5.6); c.closePath(); c.fill(); c.stroke();
    if (!bird.dead) {
      c.strokeStyle = 'rgba(255,255,255,0.9)'; c.lineWidth = 1.1;
      c.beginPath(); c.moveTo(12.8, -4.4); c.quadraticCurveTo(15.6, -5.2, 17.2, -3.2); c.stroke();
      c.fillStyle = '#ffffff'; star4(c, 16.4, -0.2, 1.2);
    }
  } else {
    // Rüzgâr: vintage cream & leather aviator cap with brown ear-flap, messy front hair tuft & brass goggles
    c.fillStyle = LOOK.helmet;
    c.beginPath(); c.arc(12, -1.8, 5.4, Math.PI * 0.92, Math.PI * 2.08); c.closePath(); c.fill();
    c.strokeStyle = '#a9a294'; c.lineWidth = 0.8;
    c.beginPath(); c.arc(12, -1.8, 5.4, Math.PI * 1.15, Math.PI * 1.75); c.stroke();
    // brown leather ear-flap
    c.fillStyle = '#6e472b';
    c.beginPath(); c.moveTo(9.8, -2.2); c.lineTo(12.6, -2.0); c.lineTo(12.1, 2.1); c.arc(10.8, 1.9, 1.3, 0, Math.PI); c.closePath(); c.fill();
    // messy chestnut hair tuft at forehead
    c.fillStyle = '#5a341e';
    c.beginPath(); c.moveTo(15.2, -3.5); c.lineTo(18.3, -4.6); c.lineTo(17.1, -2.8); c.lineTo(18.6, -2.9); c.lineTo(16.4, -1.9); c.closePath(); c.fill();
    c.strokeStyle = '#5a4030'; c.lineWidth = 1.4;
    c.beginPath(); c.moveTo(7.4, -1.8); c.lineTo(15.5, -2.4); c.stroke();
    c.fillStyle = '#c99a4a'; c.beginPath(); c.arc(15.6, -2.3, 2.1, 0, TAU); c.fill();
    c.fillStyle = bird.dead ? '#3a3a44' : '#a7dcec'; c.beginPath(); c.arc(15.8, -2.3, 1.35, 0, TAU); c.fill();
    if (!bird.dead) { c.fillStyle = '#ffffff'; c.beginPath(); c.arc(16.3, -2.8, 0.45, 0, TAU); c.fill(); }
  }
  c.restore();
  }
  // near down tube and base bar in front of him, the near arm on the bar
  if (wing) {
    c.strokeStyle = '#a7aebb'; c.lineWidth = 1.6;
    c.beginPath(); c.moveTo(apex[0], apex[1]); c.lineTo(bn[0], bn[1]); c.lineTo(bf[0], bf[1]); c.stroke();
  }
  if (person) {
    poseOn();
    c.strokeStyle = LOOK.arm[1]; c.lineWidth = isFemale ? 3.2 : 3.6;
    if (wing) { c.beginPath(); c.moveTo(6.5, 2); c.quadraticCurveTo((6.5 + handN[0]) / 2, (2 + handN[1]) / 2 + 2.5, handN[0], handN[1]); c.stroke(); }
    else stick(armN, isFemale ? 3.2 : 3.6);
    if (pid === 'bulut') {
      c.fillStyle = '#ffffff'; c.beginPath(); c.arc(handN[0] - 1.2, handN[1] - 1.2, 2.0, 0, TAU); c.fill();
    } else if (pid === 'atmaca' || pid === 'yildiz') {
      c.strokeStyle = '#ffd86b'; c.lineWidth = 1.1; c.beginPath(); c.arc(handN[0] - 1.0, handN[1] - 1.0, 1.8, 0, TAU); c.stroke();
    } else if (pid === 'dogan') {
      c.strokeStyle = '#66f0ff'; c.lineWidth = 1.1; c.beginPath(); c.arc(handN[0] - 1.0, handN[1] - 1.0, 1.8, 0, TAU); c.stroke();
    } else if (pid === 'kor' || pid === 'nova' || pid === 'luna') {
      c.strokeStyle = pid === 'luna' ? '#7fe8e0' : '#ff8a2e'; c.lineWidth = 1.1; c.beginPath(); c.arc(handN[0] - 1.0, handN[1] - 1.0, 1.8, 0, TAU); c.stroke();
    }
    c.fillStyle = LOOK.glove || skinCol;
    c.beginPath(); c.moveTo(handN[0] + 1.9, handN[1]); c.arc(handN[0], handN[1], 1.9, 0, TAU); c.moveTo(handF[0] + 1.6, handF[1]); c.arc(handF[0], handF[1], 1.6, 0, TAU); c.fill();
    c.restore();
  }
  // ambient tint so the flyer belongs to the light of the scene
  const la = mode === 'preview' ? 0 : pal.la * 0.7;
  if (la > 0.01) {
    c.setTransform(1, 0, 0, 1, 0, 0);
    c.globalCompositeOperation = 'source-atop';
    c.fillStyle = css(pal.light, la);
    c.fillRect(0, 0, w, w);
    c.globalCompositeOperation = 'source-over';
  }
}
function drawGlider() {
  if (!glider) return;
  paintBird('glider');
  ctx.save();
  ctx.translate(glider.x, glider.y);
  ctx.rotate(glider.ang);
  ctx.drawImage(gliderC, -BOX / 2, -BOX / 2, BOX, BOX);
  ctx.restore();
}
function drawChute() {
  if (!chute || chute.open <= 0) return;
  const k = 1 - Math.pow(1 - chute.open, 3), col = sstep(chute.col);
  const sx = bird.x + 5.7 * Math.cos(bird.ang), sy = bird.y + 5.7 * Math.sin(bird.ang);
  const L = 58 * (0.4 + 0.6 * k), R = 34 * k;
  // open: hanging on its lines above him; collapsed: lying deflated on the ground behind him
  const ox = sx + Math.sin(chute.sw) * L, oy = sy - Math.cos(chute.sw) * L;
  const gx = bird.x - 46, gyy = groundY(gx) - 2;
  // while it settles the cloth catches the breeze: it swings, lifts and breathes before lying flat
  const live = 1 - col, t = chute.t;
  const cx = lerp(ox, gx, col) + Math.sin(t * 2.3) * 7 * live * Math.min(1, chute.col * 4);
  const cy = lerp(oy, gyy, col) - Math.sin(col * Math.PI) * 16 + Math.sin(t * 3.1) * 4 * live * Math.min(1, chute.col * 4);
  const rot = lerp(chute.sw, 0.06, col) + Math.sin(t * 2.6 + 0.8) * 0.32 * live * Math.min(1, chute.col * 4);
  const sq = Math.max(0.16, 1 - col * 0.82 + Math.sin(t * 4.2) * 0.14 * live), wd = 1 + col * 0.25 + Math.sin(t * 4.2 + 1.6) * 0.06 * live;
  const ripple = chute.col > 0 ? live : 0;
  const cr = Math.cos(rot), sr = Math.sin(rot);
  ctx.save();
  ctx.strokeStyle = `rgba(55,55,66,${0.6 * (1 - col * 0.4)})`; ctx.lineWidth = 0.7;
  ctx.beginPath();
  for (const f of [-1, -0.4, 0.4, 1]) { const px = f * R * wd; ctx.moveTo(sx, sy); ctx.lineTo(cx + px * cr, cy + px * sr); }
  ctx.stroke();
  ctx.translate(cx, cy);
  ctx.rotate(rot);
  ctx.scale(wd, sq);
  const canopy = new Path2D();
  canopy.moveTo(-R, 0);
  const dome = 0.95 + Math.sin(t * 5.3) * 0.12 * ripple;
  canopy.bezierCurveTo(-R * (1 - 0.15 * ripple * Math.sin(t * 3.7)), -R * dome, R * (1 + 0.15 * ripple * Math.sin(t * 3.7 + 1)), -R * dome, R, 0);
  for (let i = 4; i > 0; i--) { const x0 = -R + (R * 2 * i) / 4, x1 = -R + (R * 2 * (i - 1)) / 4; canopy.quadraticCurveTo((x0 + x1) / 2, 4.5 + Math.sin(t * 7 + i * 1.9) * 4 * ripple, x1, 0); }
  canopy.closePath();
  const g = ctx.createLinearGradient(0, -R, 0, 4);
  g.addColorStop(0, '#e86a5a'); g.addColorStop(1, '#b8443a');
  ctx.fillStyle = g;
  ctx.fill(canopy);
  ctx.save();
  ctx.clip(canopy);
  ctx.fillStyle = '#f3ecdf';
  ctx.fillRect(-R * 0.62, -R, R * 0.4, R + 6);
  ctx.fillRect(R * 0.22, -R, R * 0.4, R + 6);
  ctx.fillStyle = 'rgba(20,24,50,0.18)';
  ctx.fillRect(-R, -R * 0.12, R * 2, R);
  ctx.restore();
  ctx.strokeStyle = 'rgba(90,40,30,0.45)'; ctx.lineWidth = 0.8;
  ctx.stroke(canopy);
  // light of the scene on the cloth
  if (pal.la > 0.02) { ctx.fillStyle = css(pal.light, pal.la * 0.6); ctx.fill(canopy); }
  ctx.restore();
}
function drawBird() {
  drawGlider();
  drawChute();
  paintBird(glider ? 'pilot' : 'all');
  const blink = bird.inv > 0 && !bird.dead && state === 'play' ? 0.45 + 0.55 * (Math.sin(time * 28) > 0 ? 1 : 0) : 1;
  ctx.save();
  ctx.translate(bird.x, bird.y);
  if (dashAmt > 0.02) {
    ctx.globalCompositeOperation = 'lighter';
    ctx.globalAlpha = dashAmt * 0.55;
    ctx.drawImage(GLOW.gold, -48, -48, 96, 96);
    ctx.globalAlpha = 1;
    ctx.globalCompositeOperation = 'source-over';
  }
  if (!bird.dead) {
    ctx.globalCompositeOperation = 'lighter';
    ctx.globalAlpha = 0.14 + 0.12 * pal.stars + 0.14 * cityK;
    ctx.drawImage(GLOW.white, -62, -62, 124, 124);
    ctx.globalAlpha = 1;
    ctx.globalCompositeOperation = 'source-over';
  }
  ctx.save();
  ctx.rotate(bird.ang);
  ctx.globalAlpha = blink;
  ctx.drawImage(birdC, -BOX / 2, -BOX / 2, BOX, BOX);
  ctx.restore();
  if (shieldAmt > 0.02) {
    const left = sk.shield.t;
    const flick = left > 0 && left < 1.2 ? (Math.sin(time * 30) > 0 ? 1 : 0.35) : 1;
    const a = shieldAmt * flick, r = 30 + Math.sin(time * 5) * 1.5;
    const g = ctx.createRadialGradient(0, 0, r * 0.4, 0, 0, r);
    g.addColorStop(0, 'rgba(140,232,255,0)'); g.addColorStop(0.85, `rgba(140,232,255,${0.2 * a})`); g.addColorStop(1, `rgba(200,248,255,${0.45 * a})`);
    ctx.fillStyle = g; ctx.beginPath(); ctx.arc(0, 0, r, 0, TAU); ctx.fill();
    ctx.strokeStyle = `rgba(220,250,255,${0.85 * a})`; ctx.lineWidth = 1.6;
    ctx.beginPath(); ctx.arc(0, 0, r, time * 2.4, time * 2.4 + 1.6); ctx.stroke();
    ctx.beginPath(); ctx.arc(0, 0, r, time * 2.4 + Math.PI, time * 2.4 + Math.PI + 1.1); ctx.stroke();
  }
  ctx.restore();
}
