// Süzülüş — Hawks, storm clouds, feathers, rings, thermals and the trail
'use strict';

function drawHawk(o) {
  ctx.save();
  ctx.translate(o.x, o.y);
  const f = Math.sin(o.flap), col = css(mix(obsFillC, [70, 40, 30], 0.35));
  const wing = (side) => {
    const ty = -30 * f * side - 3;
    ctx.beginPath();
    ctx.moveTo(-9, -1);
    ctx.quadraticCurveTo(-8, ty * 0.6, 2, ty);
    ctx.lineTo(9, ty * 0.88 + 2);
    ctx.quadraticCurveTo(10, ty * 0.35, 7, 0);
    ctx.closePath();
    ctx.fill();
  };
  ctx.fillStyle = css(mix(obsFillC, BLACK, 0.3));
  ctx.save(); ctx.translate(3, -3); wing(0.85); ctx.restore();
  ctx.fillStyle = col;
  ctx.beginPath(); ctx.ellipse(0, 0, 18, 7, -0.05, 0, TAU); ctx.fill();
  ctx.beginPath(); ctx.arc(-16, -3, 6.2, 0, TAU); ctx.fill();
  ctx.beginPath(); ctx.moveTo(-21, -5); ctx.quadraticCurveTo(-29, -4, -27, 1); ctx.lineTo(-21, -1); ctx.closePath(); ctx.fill();
  ctx.beginPath(); ctx.moveTo(14, -2); ctx.lineTo(31, -7); ctx.lineTo(29, 0); ctx.lineTo(31, 6); ctx.lineTo(14, 3); ctx.closePath(); ctx.fill();
  wing(1);
  ctx.strokeStyle = css(rimC, 0.5); ctx.lineWidth = 1.2;
  ctx.beginPath(); ctx.ellipse(0, 0, 18, 7, -0.05, Math.PI * 1.05, Math.PI * 1.9); ctx.stroke();
  ctx.globalCompositeOperation = 'lighter';
  ctx.drawImage(GLOW.red, -26, -10, 18, 18);
  ctx.globalCompositeOperation = 'source-over';
  ctx.fillStyle = '#ffb347';
  ctx.beginPath(); ctx.arc(-17.5, -4.5, 1.7, 0, TAU); ctx.fill();
  ctx.restore();
}
function drawStorm(o) {
  const cl = o.cloud;
  const clX = o.x - cl.lw / 2;
  const clY = o.y + 34 - cl.h - cl.pad;

  // 1. Bulutun altından yere dökülen zarif yağmur ve sis perdeleri (Virga / Rain Veils)
  const by = o.y + 30;
  const gy = groundY(o.x);
  if (gy > by + 20) {
    const vGrad = ctx.createLinearGradient(o.x, by, o.x + 30, gy);
    const isNight = pal.stars > 0.4;
    const vAlpha = (0.16 + 0.08 * Math.sin(time * 3 + o.x * 0.1)) * (isNight ? 0.7 : 1);
    vGrad.addColorStop(0, `rgba(180, 200, 240, ${vAlpha})`);
    vGrad.addColorStop(0.55, `rgba(150, 175, 220, ${vAlpha * 0.6})`);
    vGrad.addColorStop(1, 'rgba(130, 155, 200, 0)');
    ctx.fillStyle = vGrad;
    ctx.beginPath();
    ctx.moveTo(o.x - o.w * 0.36, by);
    ctx.lineTo(o.x + o.w * 0.36, by);
    ctx.lineTo(o.x + o.w * 0.28 + 32, gy);
    ctx.lineTo(o.x - o.w * 0.28 + 22, gy);
    ctx.closePath();
    ctx.fill();
  }

  // 2. Şarj anında zemin uyarısı ve elektriksel alan (Charge state)
  if (o.st === 'charge') {
    const k = 1 - o.tm;
    const boltGy = groundY(o.boltX);
    ctx.setLineDash([5, 8]);
    ctx.strokeStyle = `rgba(190, 215, 255, ${0.15 + 0.55 * k})`;
    ctx.lineWidth = 2.5;
    ctx.beginPath(); ctx.moveTo(o.boltX, o.y + 34); ctx.lineTo(o.boltX, boltGy); ctx.stroke();
    ctx.setLineDash([]);

    // Çatallanan mikro statik kıvılcımlar
    if (Math.sin(time * 40) > 0.25) {
      ctx.strokeStyle = `rgba(220, 235, 255, ${0.4 + 0.5 * k})`;
      ctx.lineWidth = 1.2;
      ctx.beginPath();
      const sparkMidY = o.y + 34 + (boltGy - o.y - 34) * 0.45;
      ctx.moveTo(o.boltX, o.y + 34);
      ctx.lineTo(o.boltX + (Math.sin(time * 48) * 14), sparkMidY);
      ctx.lineTo(o.boltX, boltGy);
      ctx.stroke();
    }

    ctx.globalCompositeOperation = 'lighter';
    ctx.globalAlpha = (0.3 + 0.6 * k) * (0.6 + 0.4 * Math.sin(time * 38));
    ctx.drawImage(GLOW.bolt, o.boltX - 75, o.y - 50, 150, 125);
    ctx.globalAlpha = 0.35 * k;
    ctx.drawImage(GLOW.bolt, o.boltX - 35, boltGy - 26, 70, 45);
    ctx.globalAlpha = 1;
    ctx.globalCompositeOperation = 'source-over';
  }

  // 3. Bulutun kendisi (Hafif nefes alma / rüzgar dalgalanması)
  const breath = Math.sin(time * 2.5 + o.x * 0.03) * 1.5;
  ctx.globalAlpha = 0.98;
  ctx.drawImage(cl.tint, clX, clY + breath, cl.lw, cl.lh);
  ctx.globalAlpha = 1;

  // 4. Bulut İçi Şimşek Nabzı (Sheet Lightning / Internal Electric Pulse)
  const pulse = Math.sin(time * 7 + o.x * 0.05);
  const flashAmt = o.st === 'charge'
    ? (1 - o.tm) * 0.8 + (Math.sin(time * 36) > 0.35 ? 0.35 : 0)
    : (pulse > 0.86 ? (pulse - 0.86) * 4.2 : 0);
  if (flashAmt > 0.02) {
    ctx.globalCompositeOperation = 'lighter';
    ctx.globalAlpha = Math.min(0.85, flashAmt * 0.75);
    ctx.drawImage(GLOW.bolt, o.x - cl.w * 0.45, o.y + 34 - cl.h * 0.9 + breath, cl.w * 0.9, cl.h * 0.95);
    ctx.globalAlpha = 1;
    ctx.globalCompositeOperation = 'source-over';
  }

  // 5. Yıldırım Darbesi (Strike state)
  if (o.st === 'strike' && o.bolt) {
    const a = clamp(o.tm / 0.42, 0, 1) * (0.75 + 0.25 * Math.sin(time * 60));
    // Darbe anında bulutun içi ve gövdesi bembeyaz/mavi parlar
    ctx.globalCompositeOperation = 'lighter';
    ctx.globalAlpha = a * 0.75;
    ctx.drawImage(cl.tint, clX, clY, cl.lw, cl.lh);
    ctx.drawImage(GLOW.bolt, o.x - cl.w * 0.5, o.y + 34 - cl.h, cl.w, cl.h);

    ctx.lineJoin = 'round'; ctx.lineCap = 'round';
    ctx.strokeStyle = `rgba(120,150,255,${0.35 * a})`; ctx.lineWidth = 14;
    ctx.beginPath(); polyLine(o.bolt.main); ctx.stroke();
    ctx.strokeStyle = `rgba(190,210,255,${0.7 * a})`; ctx.lineWidth = 4.5;
    ctx.beginPath(); polyLine(o.bolt.main); for (const br of o.bolt.branches) polyLine(br); ctx.stroke();
    ctx.strokeStyle = `rgba(255,255,255,${a})`; ctx.lineWidth = 2.0;
    ctx.beginPath(); polyLine(o.bolt.main); for (const br of o.bolt.branches) polyLine(br); ctx.stroke();
    const bGy = o.bolt.main[o.bolt.main.length - 1];
    ctx.globalAlpha = a;
    ctx.drawImage(GLOW.bolt, o.boltX - 55, bGy - 45, 110, 80);
    ctx.globalAlpha = 1;
    ctx.globalCompositeOperation = 'source-over';
  }
}
function drawFeather(it) {
  const s = it.taken ? 1 + it.t * 3 : 1, a = it.taken ? Math.max(0, 1 - it.t * 3.5) : 1;
  if (a <= 0) return;
  const y = it.y + (it.taken ? 0 : Math.sin(gtime * 2.4 + it.ph) * 5);
  ctx.save();
  ctx.translate(it.x, y);
  ctx.globalAlpha = a;
  ctx.globalCompositeOperation = 'lighter';
  ctx.globalAlpha = a * 0.8;
  ctx.drawImage(GLOW.gold, -17 * s, -17 * s, 34 * s, 34 * s);
  // now and then the vane catches the light
  const tw = it.taken ? 0 : Math.max(0, Math.sin(gtime * 2.7 + it.ph * 5) - 0.82) * 5.5;
  if (tw > 0.02) {
    ctx.globalAlpha = a * tw;
    ctx.strokeStyle = '#fff8dc'; ctx.lineWidth = 1.1; ctx.lineCap = 'round';
    ctx.beginPath(); ctx.moveTo(4 - 9 * tw, -8); ctx.lineTo(4 + 9 * tw, -8); ctx.moveTo(4, -8 - 9 * tw); ctx.lineTo(4, -8 + 9 * tw); ctx.stroke();
  }
  ctx.globalAlpha = a;
  ctx.globalCompositeOperation = 'source-over';
  ctx.rotate(-0.55 + Math.sin(gtime * 1.8 + it.ph) * 0.2);
  ctx.scale(s, s);
  ctx.beginPath();
  ctx.moveTo(0, -13); ctx.quadraticCurveTo(7.5, -3, 2, 11); ctx.lineTo(0, 14); ctx.lineTo(-2, 11); ctx.quadraticCurveTo(-7.5, -3, 0, -13);
  ctx.fillStyle = '#ffcf62'; ctx.fill();
  ctx.beginPath();
  ctx.moveTo(0, -13); ctx.quadraticCurveTo(-7.5, -3, -2, 11); ctx.lineTo(0, 14); ctx.closePath();
  ctx.fillStyle = '#ffe9a6'; ctx.fill();
  ctx.strokeStyle = '#c4801c'; ctx.lineWidth = 1;
  ctx.beginPath(); ctx.moveTo(0, -11); ctx.lineTo(0, 15); ctx.stroke();
  ctx.strokeStyle = 'rgba(196,128,28,0.5)'; ctx.lineWidth = 0.6;
  ctx.beginPath();
  for (let v = -7; v <= 7; v += 3.5) { ctx.moveTo(0, v); ctx.lineTo(3.6 - Math.abs(v) * 0.2, v - 2.6); ctx.moveTo(0, v); ctx.lineTo(-3.6 + Math.abs(v) * 0.2, v - 2.6); }
  ctx.stroke();
  ctx.restore();
}
function drawOrb(it) {
  const a = it.taken ? Math.max(0, 1 - it.t * 3) : 1;
  if (a <= 0) return;
  const p = 1 + Math.sin(gtime * 4 + it.ph) * 0.08, y = it.y + Math.sin(gtime * 2 + it.ph) * 6;
  ctx.save(); ctx.translate(it.x, y); ctx.globalAlpha = a;
  ctx.globalCompositeOperation = 'lighter';
  ctx.drawImage(GLOW.blue, -46 * p, -46 * p, 92 * p, 92 * p);
  ctx.globalCompositeOperation = 'source-over';
  const g = ctx.createRadialGradient(-3, -4, 1, 0, 0, 13);
  g.addColorStop(0, '#ffffff'); g.addColorStop(0.5, '#a9e4ff'); g.addColorStop(1, '#3d8dff');
  ctx.fillStyle = g; ctx.beginPath(); ctx.arc(0, 0, 12 * p, 0, TAU); ctx.fill();
  ctx.fillStyle = '#ffffff';
  for (let i = 0; i < 3; i++) { const an = gtime * 2.6 + (i * TAU) / 3; ctx.beginPath(); ctx.arc(Math.cos(an) * 22, Math.sin(an) * 9, 1.8, 0, TAU); ctx.fill(); }
  ctx.restore();
}
function drawRing(it, front) {
  let a = 1, s = 1;
  if (it.done) { a = Math.max(0, 1 - it.t * 2.2); s = it.ok ? 1 + it.t * 1.6 : 1; }
  if (a <= 0) return;
  ctx.save(); ctx.translate(it.x, it.y); ctx.scale(s, s);
  const a0 = front ? -Math.PI / 2 : Math.PI / 2, a1 = front ? Math.PI / 2 : Math.PI * 1.5;
  ctx.lineCap = 'round'; ctx.lineJoin = 'round';
  // gold rings push you on, icy blue rings hold you back
  const glow = it.slow ? '150,205,255' : '255,226,150', core = it.slow ? '226,242,255' : '255,246,220';
  ctx.strokeStyle = `rgba(${glow},${0.3 * a})`; ctx.lineWidth = 9;
  ctx.beginPath(); ctx.ellipse(0, 0, 16, it.ry, 0, a0, a1); ctx.stroke();
  ctx.strokeStyle = `rgba(${core},${0.95 * a})`; ctx.lineWidth = 2.6;
  ctx.beginPath(); ctx.ellipse(0, 0, 16, it.ry, 0, a0, a1); ctx.stroke();
  if (!front && !it.done) {
    // the bull's-eye: threading the very middle pays double
    ctx.globalCompositeOperation = 'lighter';
    ctx.globalAlpha = 0.55 + 0.3 * Math.sin(gtime * 5 + it.x);
    ctx.drawImage(it.slow ? GLOW.cyan : GLOW.gold, -8, -8, 16, 16);
    ctx.globalAlpha = 1;
    ctx.globalCompositeOperation = 'source-over';
    ctx.lineWidth = 1.4;
    ctx.beginPath();
    if (it.slow) {
      // headwind chevrons drifting backward through the ring
      ctx.strokeStyle = `rgba(210,236,255,${0.5 * a})`;
      for (let i = 0; i < 3; i++) {
        const yy = -it.ry * 0.5 + i * it.ry * 0.5, o = 40 - ((gtime * 70 + i * 27) % 80);
        ctx.moveTo(o + 6, yy - 7); ctx.lineTo(o - 5, yy); ctx.lineTo(o + 6, yy + 7);
      }
    } else {
      ctx.strokeStyle = `rgba(255,255,255,${0.22 * a})`;
      for (let i = 0; i < 3; i++) { const yy = -it.ry * 0.5 + i * it.ry * 0.5, o = ((gtime * 120 + i * 40) % 80) - 40; ctx.moveTo(o - 14, yy); ctx.lineTo(o + 14, yy); }
    }
    ctx.stroke();
  }
  ctx.restore();
}
// the body of a thermal, painted once: a bell across its width times a long fade up its height
function makeThermalColumn(col) {
  const c = document.createElement('canvas'); c.width = 64; c.height = 256;
  const g = c.getContext('2d');
  const hz = g.createLinearGradient(0, 0, 64, 0);
  for (let k = 0; k <= 12; k++) { const t = k / 12, b = Math.pow(Math.sin(t * Math.PI), 2.2); hz.addColorStop(t, `rgba(${col},${b})`); }
  g.fillStyle = hz; g.fillRect(0, 0, 64, 256);
  g.globalCompositeOperation = 'destination-in';
  const vt = g.createLinearGradient(0, 0, 0, 256);
  for (let k = 0; k <= 12; k++) { const t = k / 12; vt.addColorStop(t, `rgba(0,0,0,${0.5 * Math.pow(t, 1.7) * (1 - 0.25 * Math.pow(t, 6))})`); }
  g.fillStyle = vt; g.fillRect(0, 0, 64, 256);
  return c;
}
const THERMAL_COL = { day: makeThermalColumn('255,236,196'), night: makeThermalColumn('190,210,255') };
function drawThermal(it) {
  const base = groundY(it.x) + 6, top = it.top, w = it.w, h = base - top;
  const night = pal.stars > 0.5;
  const col = night ? '190,210,255' : '255,236,196';
  // soft shimmering column: brightest low down, thinning away to nothing well before its top, with no edge anywhere
  ctx.save();
  ctx.globalCompositeOperation = 'lighter';
  const sprite = night ? THERMAL_COL.night : THERMAL_COL.day, shimmer = 0.88 + 0.12 * Math.sin(gtime * 1.7 + it.ph);
  ctx.globalAlpha = (night ? 0.5 : 0.62) * shimmer;
  ctx.drawImage(sprite, it.x - w * 0.62, top - 70, w * 1.24, h + 80);
  // a second, narrower core that sways a little, so the column reads as moving air rather than a beam
  ctx.globalAlpha = (night ? 0.28 : 0.36) * shimmer;
  ctx.drawImage(sprite, it.x - w * 0.3 + Math.sin(gtime * 0.9 + it.ph) * w * 0.07, top - 20, w * 0.6, h + 30);
  ctx.globalAlpha = (night ? 0.2 : 0.3) * (0.85 + 0.15 * Math.sin(gtime * 2 + it.ph));
  ctx.drawImage(night ? GLOW.blue : GLOW.warm, it.x - w * 0.6, base - 90, w * 1.2, 120);
  ctx.restore();
  // rising swirls of warm air
  ctx.lineCap = 'round';
  ctx.lineWidth = 1.9;
  for (let i = 0; i < 14; i++) {
    const ph = (gtime * 0.42 + i / 14 + it.ph) % 1;
    const y = base - ph * h;
    const xo = Math.sin(gtime * 1.8 + i * 1.7 + ph * 7) * w * 0.32;
    const len = 16 + (i % 3) * 8;
    ctx.strokeStyle = `rgba(${col},${0.8 * Math.sin(ph * Math.PI)})`;
    ctx.beginPath();
    ctx.moveTo(it.x + xo, y);
    ctx.quadraticCurveTo(it.x + xo + 7 * Math.sin(i), y - len * 0.5, it.x + xo, y - len);
    ctx.stroke();
  }
  // motes carried upward
  ctx.globalCompositeOperation = 'lighter';
  for (let i = 0; i < 9; i++) {
    const ph = (gtime * 0.7 + i / 9 + it.ph * 0.3) % 1;
    ctx.globalAlpha = 0.7 * Math.sin(ph * Math.PI);
    const x = it.x + Math.sin(gtime * 2.6 + i * 2.1) * w * 0.38, y = base - ph * h;
    ctx.drawImage(night ? GLOW.blue : GLOW.gold, x - 5, y - 5, 10, 10);
  }
  ctx.globalAlpha = 1;
  ctx.globalCompositeOperation = 'source-over';
}
function drawItems(front) {
  const vx0 = camX - 60, vx1 = camX + W + 60;
  for (const it of items) {
    if (it.x < vx0 || it.x > vx1) continue;
    if (it.type === 'thermal') { if (!front) drawThermal(it); }
    else if (it.type === 'ring') drawRing(it, front);
    else if (!front) { if (it.type === 'feather') drawFeather(it); else drawOrb(it); }
  }
}
function drawTrail() {
  if (bird.tn < 3 || (bird.dead && bird.grounded) || state === 'menu') return;
  let col = '255,255,255', base = 0.32;
  if (sk.dash.t > 0) { col = '255,214,122'; base = 0.7; }
  else if (shieldOn()) { col = '150,235,255'; base = 0.5; }
  else if (sk.slow.t > 0) { col = '200,185,255'; base = 0.55; }
  ctx.lineCap = 'round';
  const n = bird.tn;
  for (let i = 1; i < n; i++) {
    const i0 = (bird.th - i + TRAIL_N) % TRAIL_N, i1 = (bird.th - i + 1 + TRAIL_N) % TRAIL_N;
    const t = 1 - i / n;
    ctx.strokeStyle = `rgba(${col},${base * t * t})`;
    ctx.lineWidth = 0.6 + 5 * t;
    ctx.beginPath(); ctx.moveTo(bird.tx[i1], bird.ty[i1]); ctx.lineTo(bird.tx[i0], bird.ty[i0]); ctx.stroke();
  }
}

// the gate between countries: a disc of turning light seen at an angle, tinted like the land behind it
const PORTAL_RGB = { lakes: [84, 226, 176], canyon: [255, 138, 64], polar: [120, 190, 255], volcano: [255, 84, 62], city: [255, 206, 112] };
const portalTex = {};
function portalArt(name) {
  if (portalTex[name]) return portalTex[name];
  const [r, g, b] = PORTAL_RGB[name], S = 384, R = 128, H = S / 2;
  const shade = (k, a) => `rgba(${Math.round(r * k)},${Math.round(g * k)},${Math.round(b * k)},${a})`;
  const tint = (w, a) => `rgba(${Math.round(r + (255 - r) * w)},${Math.round(g + (255 - g) * w)},${Math.round(b + (255 - b) * w)},${a})`;
  const mk = () => { const c = document.createElement('canvas'); c.width = c.height = S; const x = c.getContext('2d'); x.translate(H, H); x.lineCap = 'round'; return [c, x]; };
  // halo of light spilling into the air around the gate
  const [base, bx] = mk();
  let gr = bx.createRadialGradient(0, 0, R * 0.85, 0, 0, H);
  gr.addColorStop(0, shade(1, 0.5)); gr.addColorStop(0.3, shade(1, 0.2)); gr.addColorStop(1, shade(1, 0));
  bx.fillStyle = gr; bx.fillRect(-H, -H, S, S);
  bx.globalCompositeOperation = 'destination-out';
  bx.beginPath(); bx.arc(0, 0, R - 2, 0, TAU); bx.fill();
  // the opening: its edge burns with the gate's light, the middle stays clear to see through
  const [edge, ex] = mk();
  gr = ex.createRadialGradient(0, 0, R * 0.45, 0, 0, R);
  gr.addColorStop(0, tint(0.6, 0)); gr.addColorStop(0.7, tint(0.5, 0.05)); gr.addColorStop(0.9, tint(0.35, 0.35)); gr.addColorStop(1, tint(0.7, 0.95));
  ex.fillStyle = gr; ex.beginPath(); ex.arc(0, 0, R, 0, TAU); ex.fill();
  // the rim: ragged filaments of energy around one hard bright edge
  const [rim, rx] = mk();
  rx.globalCompositeOperation = 'lighter';
  for (let i = 0; i < 9; i++) {
    const f1 = rint(2, 6), f2 = rint(7, 13), p1 = rand(0, TAU), p2 = rand(0, TAU), a1 = rand(1.5, 6), a2 = rand(0.5, 2.5), off = rand(-4, 7);
    rx.strokeStyle = tint(rand(0.1, 0.7), rand(0.35, 0.8)); rx.lineWidth = rand(1, 3.6);
    rx.shadowColor = shade(1, 1); rx.shadowBlur = rand(8, 24);
    rx.beginPath();
    for (let j = 0; j <= 180; j++) {
      const an = (j / 180) * TAU, rr = R + off + Math.sin(an * f1 + p1) * a1 + Math.sin(an * f2 + p2) * a2;
      if (j) rx.lineTo(Math.cos(an) * rr, Math.sin(an) * rr); else rx.moveTo(rr, 0);
    }
    rx.closePath(); rx.stroke();
  }
  rx.strokeStyle = tint(0.92, 1); rx.lineWidth = 3; rx.shadowColor = tint(0.3, 1); rx.shadowBlur = 12;
  rx.beginPath(); rx.arc(0, 0, R, 0, TAU); rx.stroke();
  return (portalTex[name] = { base, edge, rim, S, R, spark: tint(0.85, 1) });
}
function drawPortal(front) {
  const p = biome.portal;
  if (!p || (state !== 'play' && state !== 'dying')) return;
  if (p.x < camX - 200 || p.x > camX + W + 200) return;
  // once flown through, the gate folds shut behind the bird
  const k = p.used ? 1 - Math.min(1, p.t * 2.4) : 1;
  if (k <= 0) return;
  const A = portalArt(p.to), R = A.R, S = A.S, H = S / 2;
  const breath = 1 + 0.025 * Math.sin(gtime * 2.6 + p.ph), kk = k * k * (3 - 2 * k) * breath;
  ctx.save();
  ctx.translate(p.x, portalY(p));
  ctx.scale((PORTAL_RX / R) * kk, (PORTAL_RY / R) * kk);
  const spin = (img, a, sc, alpha) => {
    ctx.save(); ctx.rotate(a); ctx.scale(sc, sc); ctx.globalAlpha = alpha;
    ctx.drawImage(img, -H, -H); ctx.restore();
  };
  if (front) {
    // the near half of the rim passes in front of the bird
    ctx.beginPath(); ctx.rect(0, -H, H, S); ctx.clip();
    ctx.globalCompositeOperation = 'lighter';
    spin(A.rim, gtime * 0.3, 1, 1);
    spin(A.rim, -gtime * 0.45, 1.015, 0.6);
    ctx.restore();
    return;
  }
  spin(A.base, 0, 1, 1);
  // the other country, seen through the opening
  ctx.save();
  ctx.beginPath(); ctx.arc(0, 0, R, 0, TAU); ctx.clip();
  ctx.fillStyle = `rgb(${PORTAL_RGB[p.to].map((v) => Math.round(v * 0.25)).join(',')})`;
  ctx.fillRect(-R, -R, R * 2, R * 2);
  if (portalSeen) {
    const ix = 1 / ((PORTAL_RX / R) * kk), iy = 1 / ((PORTAL_RY / R) * kk);
    ctx.scale(ix, iy);
    ctx.drawImage(portalC, -(PORTAL_RX + 6), -(PORTAL_RY + 8), (PORTAL_RX + 6) * 2, (PORTAL_RY + 8) * 2);
  }
  ctx.restore();
  spin(A.edge, 0, 1, 0.9 + 0.1 * Math.sin(gtime * 3.1 + p.ph));
  ctx.globalCompositeOperation = 'lighter';
  spin(A.rim, gtime * 0.3, 1, 1);
  spin(A.rim, -gtime * 0.45, 1.015, 0.6);
  // motes of light drawn in from the air around
  ctx.fillStyle = A.spark;
  for (let i = 0; i < 16; i++) {
    const ph = (gtime * 0.32 + i / 16 + p.ph) % 1, rr = R * (1.7 - 1.45 * ph), an = i * 2.4 + ph * 4.2 + gtime * 0.25;
    ctx.globalAlpha = 0.9 * Math.sin(ph * Math.PI);
    ctx.beginPath(); ctx.ellipse(Math.cos(an) * rr, Math.sin(an) * rr, 5.5, 2.4, 0, 0, TAU); ctx.fill();
  }
  // brief arcs crackling along the rim
  if (!RM) {
    ctx.strokeStyle = 'rgba(255,255,255,0.9)'; ctx.lineWidth = 2.6; ctx.lineJoin = 'round';
    for (let i = 0; i < 2; i++) {
      const seed = Math.floor(gtime * 9) + i * 57;
      if (hash1(seed, 311) < 0.45) continue;
      let an = hash1(seed, 97) * TAU;
      ctx.globalAlpha = 0.5 + 0.5 * hash1(seed, 13);
      ctx.beginPath();
      for (let j = 0; j < 9; j++) {
        const rr = R + (hash1(seed * 31 + j, 5) - 0.5) * 26;
        if (j) ctx.lineTo(Math.cos(an) * rr, Math.sin(an) * rr); else ctx.moveTo(Math.cos(an) * rr, Math.sin(an) * rr);
        an += 0.09;
      }
      ctx.stroke();
    }
  }
  ctx.restore();
}
