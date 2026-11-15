// Süzülüş — Particles, weather, lava, ghost, overlays and the frame composition
'use strict';

const SPARK_SPRITE = { gold: 'gold', white: 'white', cyan: 'cyan', blue: 'blue', bolt: 'bolt', lilac: 'lilac' };
function drawFx() {
  // normal blended
  for (const p of fx) {
    const k = p.t / p.life;
    if (p.k === 'chunk') {
      ctx.save(); ctx.translate(p.x, p.y); ctx.rotate(p.r);
      ctx.globalAlpha = 1 - k; ctx.fillStyle = p.col;
      ctx.beginPath(); ctx.moveTo(-p.s / 2, -p.s / 3); ctx.lineTo(p.s / 2, -p.s / 2); ctx.lineTo(p.s / 3, p.s / 2); ctx.lineTo(-p.s / 2, p.s / 3); ctx.closePath(); ctx.fill();
      ctx.restore();
    } else if (p.k === 'plume') {
      ctx.save(); ctx.translate(p.x, p.y); ctx.rotate(p.r);
      ctx.globalAlpha = 1 - k * k; ctx.fillStyle = p.col;
      ctx.beginPath(); ctx.ellipse(0, 0, p.s, p.s * 0.32, 0, 0, TAU); ctx.fill();
      ctx.restore();
    } else if (p.k === 'puff') {
      ctx.globalAlpha = (1 - k) * 0.5; ctx.fillStyle = css(mix(pal.fog, pal.near, 0.3));
      ctx.beginPath(); ctx.arc(p.x, p.y, p.s * (0.4 + k), 0, TAU); ctx.fill();
    } else if (p.k === 'shock') {
      ctx.globalAlpha = 1; ctx.strokeStyle = p.c + (1 - k) * 0.8 + ')'; ctx.lineWidth = 2.5 * (1 - k) + 0.5;
      ctx.beginPath(); ctx.arc(p.x, p.y, p.s * (0.3 + k * 0.9), 0, TAU); ctx.stroke();
    }
  }
  ctx.globalAlpha = 1;
  ctx.globalCompositeOperation = 'lighter';
  for (const p of fx) {
    if (p.k !== 'spark') continue;
    const k = p.t / p.life, s = p.s * 4 * (1 - k * 0.6);
    ctx.globalAlpha = 1 - k;
    ctx.drawImage(GLOW[SPARK_SPRITE[p.c] || 'gold'], p.x - s, p.y - s, s * 2, s * 2);
  }
  ctx.globalAlpha = 1;
  ctx.globalCompositeOperation = 'source-over';
}
function drawWeather() {
  if (!wp.length) return;
  // snow
  ctx.fillStyle = 'rgba(255,255,255,0.85)';
  ctx.beginPath();
  let any = false;
  for (const p of wp) { if (p.kind !== 'snow') continue; any = true; ctx.moveTo(p.x + p.s, p.y); ctx.arc(p.x, p.y, p.s, 0, TAU); }
  if (any) ctx.fill();
  // blizzard: streaks stretched along the wind
  any = false;
  ctx.beginPath();
  for (const p of wp) {
    if (p.kind !== 'blizzard') continue;
    any = true;
    const vx = p.vx - gust * 380 * p.d - camV * p.d, len = clamp(-vx * 0.012, 1.5, 12) * (p.s / 2);
    const n = Math.hypot(vx, p.vy) || 1;
    ctx.moveTo(p.x, p.y); ctx.lineTo(p.x - (vx / n) * len, p.y - (p.vy / n) * len);
  }
  if (any) { ctx.strokeStyle = 'rgba(248,251,255,0.85)'; ctx.lineWidth = 2.4; ctx.lineCap = 'round'; ctx.stroke(); }
  // rain
  any = false;
  ctx.beginPath();
  for (const p of wp) {
    if (p.kind !== 'rain') continue;
    any = true;
    const sl = (p.vx - camV * p.d) / p.vy;
    ctx.moveTo(p.x, p.y); ctx.lineTo(p.x - sl * p.s, p.y - p.s);
  }
  if (any) { ctx.strokeStyle = 'rgba(205,218,240,0.42)'; ctx.lineWidth = 1.1; ctx.lineCap = 'round'; ctx.stroke(); }
  // petals
  any = false;
  ctx.beginPath();
  for (const p of wp) {
    if (p.kind !== 'petal') continue;
    any = true;
    ctx.moveTo(p.x + Math.cos(p.r) * p.s, p.y + Math.sin(p.r) * p.s);
    ctx.ellipse(p.x, p.y, p.s, p.s * 0.55, p.r, 0, TAU);
  }
  if (any) { ctx.fillStyle = 'rgba(255,196,214,0.92)'; ctx.fill(); }
}
function drawGeysers() {
  for (const o of obstacles) {
    if (o.type !== 'geyser' || o.dead || o.x < camX - 80 || o.x > camX + W + 80) continue;
    const x = o.x, gy = o.gy, hot = o.st === 'charge' ? 1 - o.tm / 1.05 : o.st === 'erupt' ? 1 : 0.25;
    ctx.globalCompositeOperation = 'lighter';
    ctx.globalAlpha = 0.35 + 0.65 * hot * (0.75 + 0.25 * Math.sin(time * 18 + o.ph));
    ctx.drawImage(GLOW.red, x - 60, gy - 34, 120, 60);
    ctx.globalAlpha = 1;
    if (o.st === 'charge') {
      // the vent spits and the column it is about to throw is marked out
      ctx.strokeStyle = `rgba(255,170,90,${0.25 + 0.5 * hot})`; ctx.lineWidth = 1.6;
      ctx.setLineDash([7, 9]); ctx.lineDashOffset = -time * 60;
      ctx.beginPath(); ctx.moveTo(x, gy - 8); ctx.lineTo(x, gy - o.h); ctx.stroke();
      ctx.setLineDash([]);
      for (let i = 0; i < 4; i++) {
        const ph = (time * 2.2 + i / 4 + o.ph) % 1;
        ctx.globalAlpha = (1 - ph) * hot;
        ctx.drawImage(GLOW.warm, x - 6 + Math.sin(i * 2.4 + o.ph) * 12, gy - 10 - ph * 46 * hot, 12, 12);
      }
      ctx.globalAlpha = 1;
    }
    if (o.k > 0.02) {
      const top = gy - o.h * o.k, wob = Math.sin(time * 22 + o.ph) * 1.6;
      ctx.globalAlpha = 0.5 * o.k;
      ctx.drawImage(GLOW.warm, x - 70, top - 40, 140, o.h * o.k + 70);
      ctx.globalAlpha = 1;
      ctx.globalCompositeOperation = 'source-over';
      const cg = ctx.createLinearGradient(x - 15, 0, x + 15, 0);
      cg.addColorStop(0, 'rgba(190,40,14,0)'); cg.addColorStop(0.2, 'rgba(226,70,20,0.95)'); cg.addColorStop(0.5, 'rgba(255,226,140,1)'); cg.addColorStop(0.8, 'rgba(226,70,20,0.95)'); cg.addColorStop(1, 'rgba(190,40,14,0)');
      ctx.fillStyle = cg;
      ctx.beginPath();
      ctx.moveTo(x - 17, gy + 4);
      ctx.quadraticCurveTo(x - 11 + wob, (gy + top) / 2, x - 13, top + 10);
      ctx.quadraticCurveTo(x - 20, top - 12, x + wob, top - 18);
      ctx.quadraticCurveTo(x + 20, top - 12, x + 13, top + 10);
      ctx.quadraticCurveTo(x + 11 + wob, (gy + top) / 2, x + 17, gy + 4);
      ctx.closePath(); ctx.fill();
    }
    ctx.globalCompositeOperation = 'source-over';
    // the vent itself: a low cone of black rock with a glowing throat
    ctx.fillStyle = css(mix(pal.near, BLACK, 0.3));
    ctx.beginPath(); ctx.moveTo(x - 34, gy + 8); ctx.lineTo(x - 13, gy - 10); ctx.lineTo(x + 13, gy - 10); ctx.lineTo(x + 34, gy + 8); ctx.closePath(); ctx.fill();
    ctx.fillStyle = `rgba(255,150,60,${0.5 + 0.5 * hot})`;
    ctx.beginPath(); ctx.ellipse(x, gy - 10, 11, 2.6, 0, 0, TAU); ctx.fill();
  }
}
// sparks and embers carried up on the hot air of the fire valley
function drawEmbers() {
  if (volcK < 0.02) return;
  ctx.globalCompositeOperation = 'lighter';
  const span = W + 200, hgt = VH + 80;
  for (let i = 0; i < 54; i++) {
    const sp = 26 + hash1(i, 901) * 64, ph = ((time * sp) / hgt + hash1(i, 902)) % 1;
    let x = (hash1(i, 903) * span - camX * (0.25 + 0.6 * hash1(i, 904)) + Math.sin(time * 1.3 + i) * 20) % span;
    if (x < 0) x += span;
    const s = 3 + hash1(i, 905) * 6;
    ctx.globalAlpha = volcK * Math.sin(ph * Math.PI) * (0.45 + 0.55 * Math.sin(time * 5 + i * 1.7) ** 2);
    ctx.drawImage(i % 3 ? GLOW.warm : GLOW.gold, x - 100 - s / 2, VB + 20 - ph * hgt - s / 2, s, s);
  }
  ctx.globalAlpha = 1;
  ctx.globalCompositeOperation = 'source-over';
}
// the ghost of the best flight: the same glider, pale and see-through
function drawGhost() {
  const g = ghostRun;
  if (!g || g.a < 0.02) return;
  ctx.save();
  ctx.translate(g.x, g.y);
  ctx.globalCompositeOperation = 'lighter';
  ctx.globalAlpha = 0.3 * g.a;
  ctx.drawImage(GLOW.cyan, -52, -52, 104, 104);
  ctx.globalCompositeOperation = 'source-over';
  ctx.globalAlpha = 0.55 * g.a;
  ctx.font = '600 10px "Josefin Sans", "Avenir Next", sans-serif';
  ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
  ctx.fillStyle = '#d6f6ff';
  ctx.fillText(tx('E N  İ Y İ', 'B E S T'), 0, -44);
  ctx.rotate(g.ang);
  ctx.globalAlpha = 0.36 * g.a;
  ctx.drawImage(birdC, -BOX / 2, -BOX / 2, BOX, BOX);
  ctx.restore();
}
// when the ghost is off screen, an arrow at the edge says how far ahead or behind it is
function drawGhostMarker() {
  const g = ghostRun;
  if (!g || g.done || state !== 'play') return;
  const sx = g.x - camX;
  if (sx > -30 && sx < W + 30) return;
  const ahead = sx > 0, x = ahead ? W - 18 : 18, y = clamp(g.y, viewTop + 90, VB - 110), m = Math.round(Math.abs(g.x - bird.x) / 10);
  ctx.globalAlpha = 0.85;
  ctx.fillStyle = '#bdf2ff';
  ctx.beginPath();
  if (ahead) { ctx.moveTo(x, y); ctx.lineTo(x - 9, y - 7); ctx.lineTo(x - 9, y + 7); }
  else { ctx.moveTo(x, y); ctx.lineTo(x + 9, y - 7); ctx.lineTo(x + 9, y + 7); }
  ctx.closePath(); ctx.fill();
  ctx.font = '600 12px "Josefin Sans", "Avenir Next", sans-serif';
  ctx.textAlign = ahead ? 'right' : 'left'; ctx.textBaseline = 'middle';
  ctx.fillText(`${tx('Hayalet', 'Ghost')} ${ahead ? '+' : '−'}${m} m`, ahead ? x - 15 : x + 15, y + 1);
  ctx.globalAlpha = 1;
}
// thin threads of wind drifting through the air the glider flies in
function drawWisps() {
  const a0 = (0.1 + 0.1 * clamp((bird.speed - 280) / 420, 0, 1)) * (1 - blizAmt()) * (1 - 0.4 * pal.stars);
  if (a0 < 0.01) return;
  ctx.lineCap = 'round'; ctx.lineWidth = 1.3;
  const n = 12;
  for (const w of wisps) {
    let px = w.x, py = w.y;
    for (let i = 1; i <= n; i++) {
      const t = i / n;
      const x = w.x + w.len * t, y = w.y + Math.sin(t * w.k + time * 1.1 + w.ph) * w.amp * (0.3 + 0.7 * t);
      ctx.strokeStyle = `rgba(255,255,255,${a0 * w.a * Math.sin(t * Math.PI)})`;
      ctx.beginPath(); ctx.moveTo(px, py); ctx.lineTo(x, y); ctx.stroke();
      px = x; py = y;
    }
  }
}
// skimming: a pool of light on the ground under the glider
function drawSkim() {
  if (skimT <= 0 || bird.dead) return;
  const gy = groundY(bird.x), k = Math.min(1, skimT * 3);
  ctx.globalCompositeOperation = 'lighter';
  ctx.globalAlpha = 0.55 * k;
  ctx.drawImage(GLOW.white, bird.x - 64, gy - 9, 128, 20);
  ctx.globalAlpha = 0.3 * k;
  ctx.drawImage(GLOW.gold, bird.x - 30, bird.y, 60, gy - bird.y + 6);
  ctx.globalAlpha = 1;
  ctx.globalCompositeOperation = 'source-over';
}
function drawForeground() {
  const par = 1.35, off = camX * par, sp = 46;
  const k0 = Math.floor((off - 60) / sp), k1 = Math.ceil((off + W + 60) / sp);
  ctx.beginPath();
  for (let k = k0; k <= k1; k++) {
    const r = hash1(k, 701);
    if (r > 0.42) continue;
    const x = k * sp + hash1(k, 702) * sp - off, base = VB + 6, n = 3 + ((r * 20) | 0) % 4;
    for (let b = 0; b < n; b++) {
      const bx = x + (b - n / 2) * 5, h = 26 + hash1(k * 7 + b, 703) * 46, lean = (hash1(k * 7 + b, 704) - 0.5) * 22 + Math.sin(time * 1.3 + k + b) * 3;
      ctx.moveTo(bx - 3, base); ctx.quadraticCurveTo(bx + lean * 0.3, base - h * 0.6, bx + lean, base - h); ctx.quadraticCurveTo(bx + lean * 0.3 + 2, base - h * 0.5, bx + 3, base); ctx.closePath();
    }
  }
  ctx.fillStyle = css(mix(pal.near, BLACK, 0.35));
  ctx.fill();
}
function drawHawkWarnings() {
  for (const o of obstacles) {
    if (o.type !== 'hawk' || o.dead) continue;
    const sx = o.x - camX;
    if (sx < W + 10 || sx > W + 1100) continue;
    const a = (0.5 + 0.5 * Math.sin(time * 12)) * clamp(1 - (sx - W) / 1100, 0.25, 1);
    const x = W - 24, y = clamp(o.y, viewTop + 70, VB - 90);
    ctx.globalCompositeOperation = 'lighter';
    ctx.globalAlpha = a * 0.8;
    ctx.drawImage(GLOW.red, x - 22, y - 22, 44, 44);
    ctx.globalAlpha = 1;
    ctx.globalCompositeOperation = 'source-over';
    ctx.fillStyle = `rgba(255,120,90,${0.55 + 0.45 * a})`;
    ctx.beginPath(); ctx.moveTo(x - 9, y); ctx.lineTo(x + 5, y - 9); ctx.lineTo(x + 2, y); ctx.lineTo(x + 5, y + 9); ctx.closePath(); ctx.fill();
  }
}
function drawPopups() {
  if (!popups.length) return;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  for (const p of popups) {
    const fadeIn = clamp(p.t / 0.12, 0, 1), fadeOut = 1 - clamp((p.t - p.life * 0.6) / (p.life * 0.4), 0, 1);
    const a = fadeIn * fadeOut, sc = 0.8 + 0.2 * sstep(fadeIn);
    ctx.font = `600 ${Math.round((p.big ? 22 : 17) * sc)}px "Josefin Sans", "Avenir Next", sans-serif`;
    ctx.fillStyle = `rgba(10,14,36,${0.3 * a})`;
    ctx.fillText(p.text, p.x + 1, p.y + 1.5);
    ctx.globalAlpha = a;
    ctx.fillStyle = p.color;
    ctx.fillText(p.text, p.x, p.y);
    ctx.globalAlpha = 1;
  }
}
function drawOverlays() {
  if (Sky.ok) Sky.shafts(ctx);
  // warm/cool bloom from sun or moon over the whole scene
  if (sun.a > 0.05) {
    const g = ctx.createRadialGradient(sun.x, sun.y, 0, sun.x, sun.y, W * 0.9);
    g.addColorStop(0, css(pal.glow, 0.16 * sun.a)); g.addColorStop(1, css(pal.glow, 0));
    ctx.globalCompositeOperation = 'lighter';
    ctx.fillStyle = g; ctx.fillRect(-20, viewTop - 20, W + 40, VH + 40);
    ctx.globalCompositeOperation = 'source-over';
  }
  if (dashAmt > 0.02) {
    ctx.strokeStyle = `rgba(255,255,255,${0.32 * dashAmt})`;
    ctx.lineWidth = 1.4; ctx.lineCap = 'round';
    ctx.beginPath();
    for (const l of lines) { ctx.moveTo(l.x, l.y); ctx.lineTo(l.x + l.len, l.y); }
    ctx.stroke();
  }
  if (slowAmt > 0.02) {
    ctx.fillStyle = `rgba(70,50,150,${0.13 * slowAmt})`;
    ctx.fillRect(-20, viewTop - 20, W + 40, VH + 40);
  }
  const bz = blizAmt();
  if (bz > 0.01) {
    const wc = pal.stars > 0.5 ? '150,165,195' : '236,241,248';
    // the whiteout rolls in with the front
    const a = 0.12 + 0.16 * gust, f = weatherFront();
    const wg = ctx.createLinearGradient(f[0], 0, f[1], 0);
    wg.addColorStop(0, `rgba(${wc},${f[2] > 0 ? 0 : a})`); wg.addColorStop(1, `rgba(${wc},${f[2] > 0 ? a : 0})`);
    ctx.fillStyle = wg;
    ctx.fillRect(-20, viewTop - 20, W + 40, VH + 40);
    for (let k = 0; k < 5; k++) {
      const span = W * 1.8, w2 = W * (0.7 + 0.15 * k);
      let x = (span - ((time * (260 + k * 70) + k * 523 + camX * 0.4) % span)) - w2 * 0.5;
      const y = viewTop + (VH * (0.2 + k * 0.17)) + Math.sin(time * 0.5 + k) * 40;
      ctx.globalAlpha = (0.18 + 0.3 * gust) * frontAt(x + w2 * 0.5) * (pal.stars > 0.5 ? 0.5 : 1);
      ctx.drawImage(GLOW.white, x, y - 140, w2, 280);
    }
    ctx.globalAlpha = 1;
  }
  if (flash > 0.01) {
    ctx.fillStyle = `rgba(232,238,255,${flash * 0.55})`;
    ctx.fillRect(-20, viewTop - 20, W + 40, VH + 40);
  }
  ctx.setTransform(1, 0, 0, 1, 0, 0);
  if (!grainPat) grainPat = ctx.createPattern(GRAIN, 'repeat');
  if (grainPat) {
    const gx = RM ? 0 : (Math.random() * 128) | 0, gy = RM ? 0 : (Math.random() * 128) | 0;
    ctx.save();
    ctx.translate(-gx, -gy);
    ctx.globalAlpha = 0.5;
    ctx.fillStyle = grainPat;
    ctx.fillRect(0, 0, cvs.width + 128, cvs.height + 128);
    ctx.restore();
  }
  ctx.globalAlpha = 1;
  ctx.drawImage(vign, 0, 0, cvs.width, cvs.height);
  if (slowAmt > 0.02) { ctx.globalAlpha = slowAmt * 0.8; ctx.drawImage(vign, 0, 0, cvs.width, cvs.height); ctx.globalAlpha = 1; }
}

function drawBackdrop() {
  drawSky();
  const clearSky = (1 - stormAmt()) * (1 - blizAmt()) * (1 - cloudCover * 0.5);
  const mw = pal.stars * (0.2 + 0.8 * polarK) * clearSky;
  if (mw > 0.02) drawMilkyWay(mw);
  if (pal.stars > 0.02) drawStars();
  // over the ice the aurora burns every night, brighter than anywhere else
  const au = Math.max(pal.stars * auroraStr, polarK * 1.6 * pal.stars) * (1 - stormAmt()) * (1 - blizAmt());
  if (au > 0.03) drawAurora(au);
  drawCelestial();
  if (Sky.ok) {
    // distant lightning sits behind the clouds and ranges
    if (bgBolt) drawBgBolt();
    Sky.render(ctx);
    drawClouds(0);
    drawFlock();
    drawBgBalloons(0);
    drawBgKites(0);
    drawLayer(2); drawFog(2);
    drawClouds(1);
    drawWater();
    drawBgBalloons(1);
    drawBgKites(1);
    drawLayer(3); drawFog(3);
  } else {
    drawClouds(0);
    drawLayer(0); drawFog(0);
    if (bgBolt) drawBgBolt();
    drawLayer(1); drawFog(1);
    drawClouds(1);
    drawFlock();
    drawBgBalloons(0);
    drawBgKites(0);
    drawLayer(2); drawFog(2);
    drawWater();
    drawBgBalloons(1);
    drawBgKites(1);
    drawLayer(3); drawFog(3);
  }
}
// what lies beyond the portal: the same view painted as the other country, kept for the opening of the gate
const portalC = document.createElement('canvas'), portalCtx = portalC.getContext('2d');
let portalSeen = false, portalTick = 0;
function capturePortal() {
  const p = biome.portal;
  if (!p || p.used || state !== 'play') { if (!p || state === 'menu') portalSeen = false; return; }
  if (p.x < camX - 120 || p.x > camX + W + 120) { portalSeen = false; return; }
  // a fresh view every other frame is plenty for a window this small (every fourth on a phone)
  if (portalSeen && portalTick++ % (MOBILE ? 4 : 2)) return;
  // a tall slice of the whole landscape, from open sky down to the near hills, shrunk to fit the opening
  const hh = 265, hw = (hh * (PORTAL_RX + 6)) / (PORTAL_RY + 8), x0 = p.x - camX - hw, y0 = 385 - hh;
  const keep = {}, was = [CITY, CANYON, POLAR, VOLCANO, cityK, canyonK, polarK, volcK];
  for (const k in pal) keep[k] = Array.isArray(pal[k]) ? pal[k].slice() : pal[k];
  setBiomeFlags(p.to);
  computePalette(dayT, POLAR ? 0 : stormAmt());
  biomeTint();
  ctx.setTransform(scale, 0, 0, scale, 0, -viewTop * scale);
  ctx.globalAlpha = 1; ctx.globalCompositeOperation = 'source-over';
  ctx.save();
  ctx.beginPath(); ctx.rect(x0, y0, hw * 2, hh * 2); ctx.clip();
  drawBackdrop();
  ctx.restore();
  const pw = Math.ceil((PORTAL_RX + 6) * 2 * scale), ph = Math.ceil((PORTAL_RY + 8) * 2 * scale);
  if (portalC.width !== pw || portalC.height !== ph) { portalC.width = pw; portalC.height = ph; }
  portalCtx.imageSmoothingQuality = 'high';
  portalCtx.drawImage(cvs, Math.round(x0 * scale), Math.round((y0 - viewTop) * scale), Math.round(hw * 2 * scale), Math.round(hh * 2 * scale), 0, 0, pw, ph);
  portalSeen = true;
  [CITY, CANYON, POLAR, VOLCANO, cityK, canyonK, polarK, volcK] = was;
  for (const k in keep) { const v = keep[k], o = pal[k]; if (Array.isArray(v) && Array.isArray(o)) { o[0] = v[0]; o[1] = v[1]; o[2] = v[2]; } else pal[k] = v; }
}
/* ---- biome wave: after a portal the new country washes outward from it in a wavy ring ---- */
const WAVE_DUR = 1.9;
const waveC = document.createElement('canvas'), waveCtx = waveC.getContext('2d');
let bwave = null;
function startBiomeWave(from, to, x, y) { bwave = { from, to, x, y, t: 0, last: performance.now() }; }
const waveEase = (k) => 1 - Math.pow(1 - k, 1.6);
// paint the old country (sky, ranges and ground) into waveC with this frame's camera
function captureWave() {
  if (!bwave) return;
  const now = performance.now();
  bwave.t += Math.min(0.12, (now - bwave.last) / 1000) * (state === 'paused' ? 0 : 1);
  bwave.last = now;
  if (bwave.t >= WAVE_DUR || state === 'menu') { bwave = null; return; }
  const keep = {}, was = [CITY, CANYON, POLAR, VOLCANO, cityK, canyonK, polarK, volcK];
  for (const k in pal) keep[k] = Array.isArray(pal[k]) ? pal[k].slice() : pal[k];
  setBiomeFlags(bwave.from);
  computePalette(dayT, POLAR ? 0 : stormAmt());
  biomeTint();
  ctx.setTransform(scale, 0, 0, scale, 0, -viewTop * scale);
  ctx.globalAlpha = 1; ctx.globalCompositeOperation = 'source-over';
  drawBackdrop();
  ctx.save(); ctx.translate(-camX, 0); drawGround(); ctx.restore();
  if (waveC.width !== cvs.width || waveC.height !== cvs.height) { waveC.width = cvs.width; waveC.height = cvs.height; }
  waveCtx.drawImage(cvs, 0, 0);
  [CITY, CANYON, POLAR, VOLCANO, cityK, canyonK, polarK, volcK] = was;
  for (const k in keep) { const v = keep[k], o = pal[k]; if (Array.isArray(v) && Array.isArray(o)) { o[0] = v[0]; o[1] = v[1]; o[2] = v[2]; } else pal[k] = v; }
}
// the ring's edge: a few slow swells and a quicker ripple, all drifting round as it grows
function wavePath(c, cx, cy, r, t) {
  const n = 96;
  c.moveTo(cx + r, cy);
  for (let i = 0; i <= n; i++) {
    const a = (i / n) * TAU;
    const w = 1 + 0.11 * Math.sin(a * 5 + t * 3.1) + 0.06 * Math.sin(a * 9 - t * 4.7) + 0.035 * Math.sin(a * 17 + t * 7);
    c.lineTo(cx + Math.cos(a) * r * w, cy + Math.sin(a) * r * w);
  }
  c.closePath();
}
// in device pixels: the old country outside the ring, a glowing crest on its edge
function drawBiomeWave() {
  if (!bwave || !waveC.width) return;
  const k = bwave.t / WAVE_DUR;
  const cx = (bwave.x - camX) * scale, cy = (bwave.y - viewTop) * scale;
  const far = Math.max(Math.hypot(cx, cy), Math.hypot(cvs.width - cx, cy), Math.hypot(cx, cvs.height - cy), Math.hypot(cvs.width - cx, cvs.height - cy));
  const r = 6 * scale + waveEase(k) * far * 1.5;
  const col = PORTAL_RGB[bwave.to].join(',');
  ctx.save();
  ctx.setTransform(1, 0, 0, 1, 0, 0);
  ctx.globalAlpha = 1; ctx.globalCompositeOperation = 'source-over';
  ctx.beginPath();
  ctx.rect(0, 0, cvs.width, cvs.height);
  wavePath(ctx, cx, cy, r, bwave.t);
  ctx.save(); ctx.clip('evenodd'); ctx.drawImage(waveC, 0, 0); ctx.restore();
  // the crest: a soft wide glow and a bright thin line, fading as the ring leaves the screen
  const fade = 1 - Math.max(0, (k - 0.6) / 0.4);
  ctx.beginPath(); wavePath(ctx, cx, cy, r, bwave.t);
  ctx.lineJoin = 'round';
  ctx.strokeStyle = `rgba(${col},${0.22 * fade})`; ctx.lineWidth = 22 * scale; ctx.stroke();
  ctx.strokeStyle = `rgba(${col},${0.4 * fade})`; ctx.lineWidth = 8 * scale; ctx.stroke();
  ctx.strokeStyle = `rgba(255,255,255,${0.75 * fade})`; ctx.lineWidth = 2 * scale; ctx.stroke();
  // a second, fainter ripple trailing behind the first
  const r2 = r * 0.72;
  if (r2 > 10 * scale) {
    ctx.beginPath(); wavePath(ctx, cx, cy, r2, bwave.t + 1.3);
    ctx.strokeStyle = `rgba(${col},${0.28 * fade})`; ctx.lineWidth = 3 * scale; ctx.stroke();
  }
  ctx.restore();
}
function render() {
  captureWave();
  capturePortal();
  obsFillC = mix(pal.near, pal.far, 0.06);
  rimC = mix(pal.glow, pal.fog, 0.4);
  if (pal.stars > 0.5) rimC = mix(rimC, [170, 195, 255], (pal.stars - 0.5) * 1.2);
  const sh = shake;
  const shx = sh ? (Math.random() * 2 - 1) * sh : 0, shy = sh ? (Math.random() * 2 - 1) * sh : 0;
  ctx.setTransform(scale, 0, 0, scale, shx * scale, (shy - viewTop) * scale);
  ctx.globalAlpha = 1;
  ctx.globalCompositeOperation = 'source-over';

  drawBackdrop();
  drawFireflies();

  ctx.save();
  ctx.translate(-camX, 0);
  drawObstacles(true);
  drawGround();
  ctx.restore();
  drawBiomeWave();
  ctx.save();
  ctx.translate(-camX, 0);
  drawCliff();
  drawObstacles(false);
  drawGeysers();
  drawItems(false);
  drawPortal(false);
  drawSkim();
  drawGhost();
  drawTrail();
  drawBird();
  drawItems(true);
  drawPortal(true);
  drawFx();
  ctx.restore();

  drawEmbers();
  drawWisps();
  drawWeather();
  drawForeground();
  drawHawkWarnings();
  drawGhostMarker();
  drawPopups();
  drawOverlays();
}
