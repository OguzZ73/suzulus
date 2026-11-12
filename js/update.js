// Süzülüş — Per-frame simulation: biomes, weather, flight physics, HUD
'use strict';

/* =========================================================
   Update
   ========================================================= */
function phaseName(t) {
  if (t < 0.07 || t >= 0.95) return 'Şafak';
  if (t < 0.22) return 'Sabah';
  if (t < 0.42) return 'Öğle';
  if (t < 0.6) return 'Gün batımı';
  if (t < 0.72) return 'Alacakaranlık';
  return 'Gece';
}
function showLabel() {
  const w = WNAMES[weather.type];
  el.phase.textContent = lastPhase + (w ? ' · ' + w : '');
  el.phase.classList.add('show');
  phaseShowT = 4.5;
}
// every 1.2 km a portal hangs in the sky; flying through it swaps the country in one beat, flying past keeps the land as it is
const PORTAL_GAP = 12000, PORTAL_RY = 96, PORTAL_RX = 50;
const biome = { target: 'lakes', idx: 0, n: 1, portal: null };
// the 1900s city is out of the rotation for now; its drawing code is kept so it can come back redesigned
const BIOMES = ['lakes', 'canyon', 'polar', 'volcano'];
const BIOME_NAMES = { lakes: 'Göller diyarı', city: '1900’ler Eski Şehir', canyon: 'Kızıl Kanyon', polar: 'Kutup', volcano: 'Ateş Vadisi' };
// every flight starts over the lakes; the countries after that come in a different order each time
function shuffleBiomes() {
  const rest = BIOMES.filter((b) => b !== 'lakes');
  for (let i = rest.length - 1; i > 0; i--) { const j = (Math.random() * (i + 1)) | 0; [rest[i], rest[j]] = [rest[j], rest[i]]; }
  biomeSeq = ['lakes', ...rest];
}
const NIGHT_KF = KF.find((k) => k.t === 0.76);
const curBiome = () => (CITY ? 'city' : CANYON ? 'canyon' : POLAR ? 'polar' : VOLCANO ? 'volcano' : 'lakes');
function resetBiome() { biome.idx = 0; biome.n = 1; biome.portal = null; biome.target = biomeSeq[0]; }
const portalY = (p) => p.y + Math.sin(gtime * 1.3 + p.ph) * 5;
function updatePortal(dt) {
  let p = biome.portal;
  if (p && p.x < camX - 260) { p = biome.portal = null; biome.n++; }
  if (!p) {
    const x = startX + biome.n * PORTAL_GAP;
    p = biome.portal = { x, y: rand(190, groundY(x) - 230), ph: rand(0, TAU), to: biomeSeq[(biome.idx + 1) % biomeSeq.length], used: false, t: 0 };
  }
  if (p.used) { p.t += dt; return; }
  if (bird.prevX < p.x && bird.x >= p.x && Math.abs(bird.y - portalY(p)) < PORTAL_RY * 0.94) {
    p.used = true; quest('portal'); buzz(30);
    biome.idx++;
    biome.target = p.to;
  }
}
function setBiomeFlags(name) {
  CITY = name === 'city'; CANYON = name === 'canyon'; POLAR = name === 'polar'; VOLCANO = name === 'volcano';
  cityK = CITY ? 1 : 0; canyonK = CANYON ? 1 : 0; polarK = POLAR ? 1 : 0; volcK = VOLCANO ? 1 : 0;
}
function updateBiome(dt) {
  if (state === 'play') updatePortal(dt);
  const want = biome.target;
  if (want !== curBiome()) {
    const through = state === 'play' && biome.idx > 0;
    setBiomeFlags(want);
    Sound.setBiome(want);
    // whatever still waits beyond the screen belongs to the old country
    for (let i = obstacles.length - 1; i >= 0; i--) { const o = obstacles[i]; if (['pine', 'cactus', 'geyser', 'balloon', 'kite', 'building'].includes(o.type) && o.minX > camX + W + 40) obstacles.splice(i, 1); }
    // no snow or blossom over the desert or the lava, no rain or blossom on the ice
    const bad = CANYON || VOLCANO ? ['snow', 'blizzard', 'petals'] : POLAR ? ['rain', 'petals'] : CITY ? ['blizzard'] : [];
    if (bad.includes(weather.type)) { weather.type = 'clear'; weather.amt = 0; weather.phase = 'hold'; weather.timer = rand(20, 40); wp.length = 0; }
    if (POLAR) { coverTarget = Math.min(coverTarget, 0.2); coverT = rand(30, 60); }
    if (through) {
      const pts = 300 * mult(); addScore(pts);
      popup(`Yeni diyar: ${BIOME_NAMES[want]}  +${pts}`, '#ffffff', true);
      el.phase.textContent = BIOME_NAMES[want];
      el.phase.classList.add('show');
      phaseShowT = 4.5;
      flash = Math.max(flash, RM ? 0.1 : 0.45);
      shock(bird.x, bird.y, `rgba(${PORTAL_RGB[want].join(',')},`, 150);
      sparks(bird.x, bird.y, 26, 'white', 320, 2.6);
      Sound.orb();
    }
  }
  biomeTint();
  // fair-weather cloud cover drifts between a full sky and none at all
  coverT -= dt;
  if (coverT <= 0) {
    coverT = rand(35, 75);
    const opts = POLAR ? [0, 0, 0, 0.15, 0.4] : [0, 0, 0.3, 0.6, 1, 1];
    coverTarget = opts[(Math.random() * opts.length) | 0];
  }
  const wet = ['rain', 'snow', 'blizzard'].includes(weather.type) ? weather.amt : 0;
  cloudCover = damp(cloudCover, Math.max(coverTarget, wet), 0.18, dt);
}
// colour the hour's palette for the country the flight is over
function biomeTint() {
  if (volcK > 0.001) {
    // the fire valley: black basalt under a smoke-dimmed sky, everything lit from below by the lava
    const b = 0.5 + 0.5 * (1 - pal.stars), k = volcK;
    const to = (o, r, g, bl, kk) => { o[0] = lerp(o[0], r * b, kk * k); o[1] = lerp(o[1], g * b, kk * k); o[2] = lerp(o[2], bl * b, kk * k); };
    to(pal.top, 44, 26, 40, 0.74); to(pal.mid, 128, 54, 48, 0.72); to(pal.bot, 222, 98, 46, 0.78);
    to(pal.far, 70, 34, 40, 0.86); to(pal.near, 24, 15, 19, 0.88); to(pal.fog, 164, 62, 38, 0.66);
    to(pal.cloud, 104, 70, 72, 0.7); to(pal.glow, 255, 124, 52, 0.6); to(pal.light, 255, 156, 84, 0.5);
    pal.la = lerp(pal.la, 0.32, k);
    pal.stars *= 1 - 0.7 * k;
  }
  if (cityK > 0.001) {
    // 1900s vintage settlement: warm sepia-amber gaslight haze and slate-brick tones
    const sep = (o, k) => {
      const l = o[0] * 0.3 + o[1] * 0.59 + o[2] * 0.11;
      o[0] = lerp(o[0], Math.min(255, l * 1.18 + 18), k);
      o[1] = lerp(o[1], Math.min(255, l * 0.96 + 8), k);
      o[2] = lerp(o[2], l * 0.78 + 4, k);
    };
    sep(pal.far, 0.65 * cityK); sep(pal.near, 0.55 * cityK); sep(pal.fog, 0.62 * cityK);
    sep(pal.bot, 0.35 * cityK); sep(pal.cloud, 0.25 * cityK);
  }
  if (canyonK > 0.001) {
    // sun-baked reds and ochres at the same brightness as the hour of the day
    const warm = (o, k) => {
      const l = o[0] * 0.3 + o[1] * 0.59 + o[2] * 0.11;
      o[0] = lerp(o[0], Math.min(255, l * 1.5 + 22), k); o[1] = lerp(o[1], l * 0.78, k); o[2] = lerp(o[2], l * 0.5, k);
    };
    warm(pal.far, 0.95 * canyonK); warm(pal.near, 0.8 * canyonK); warm(pal.fog, 0.6 * canyonK);
    warm(pal.bot, 0.35 * canyonK); warm(pal.mid, 0.15 * canyonK); warm(pal.cloud, 0.2 * canyonK);
  }
  if (polarK > 0.001) {
    // polar light: even at noon the sky stays a deep twilight blue, so the stars never quite leave
    const k = polarK * 0.82 * (1 - pal.stars);
    for (const key of ['top', 'mid', 'bot', 'far', 'fog', 'cloud', 'glow', 'light']) {
      const o = pal[key], n = NIGHT_KF[key];
      o[0] = lerp(o[0], n[0], k); o[1] = lerp(o[1], n[1], k); o[2] = lerp(o[2], n[2], k);
    }
    pal.la = lerp(pal.la, NIGHT_KF.la, k);
    const cold = (o, kk) => {
      const l = o[0] * 0.3 + o[1] * 0.59 + o[2] * 0.11;
      o[0] = lerp(o[0], l * 0.82, kk); o[1] = lerp(o[1], Math.min(255, l * 1.0 + 8), kk); o[2] = lerp(o[2], Math.min(255, l * 1.25 + 18), kk);
    };
    cold(pal.far, 0.7 * polarK); cold(pal.fog, 0.6 * polarK); cold(pal.bot, 0.3 * polarK);
    // snowfields and ice in the foreground, lit by twilight or moon
    const bright = 0.35 + 0.65 * (1 - pal.stars);
    const snow = mix([62, 78, 116], [196, 212, 232], bright);
    pal.near = mix(pal.near, snow, 0.72 * polarK);
    // thin, dry polar air: far less haze between the ranges
    pal.fog = mix(pal.fog, mix(pal.top, pal.far, 0.5), 0.45 * polarK);
    pal.stars = Math.max(pal.stars, 0.88 * polarK * (1 - blizAmt()));
  }
}
function updateWeather(dt) {
  if (weather.phase === 'hold') {
    weather.timer -= dt;
    if (weather.timer <= 0) {
      const opts = [['clear', 3], ['snow', 2.2], ['rain', 2], ['petals', 2], ['blizzard', 1.8]].filter((o) => o[0] !== weather.type && !(CANYON && ['snow', 'blizzard', 'petals'].includes(o[0])) && !(POLAR && ['rain', 'petals'].includes(o[0])) && !(VOLCANO && ['snow', 'blizzard', 'petals'].includes(o[0])));
      let tot = 0; for (const o of opts) tot += o[1];
      let r = Math.random() * tot, n = opts[0][0];
      for (const o of opts) { r -= o[1]; if (r <= 0) { n = o[0]; break; } }
      weather.next = n; weather.phase = 'out';
    }
  } else if (weather.phase === 'out') {
    // clear skies have nothing to carry away
    weather.amt = weather.type === 'clear' ? 0 : weather.amt - dt / WX_FADE;
    if (weather.amt <= 0) { weather.amt = 0; weather.type = weather.next; weather.phase = 'in'; if (weather.type !== 'clear') showLabel(); }
  } else {
    weather.amt += dt / WX_FADE;
    if (weather.amt >= 1) { weather.amt = 1; weather.phase = 'hold'; weather.timer = rand(35, 60); }
  }
}
const stormAmt = () => (weather.type === 'rain' ? weather.amt : 0);
const blizAmt = () => (weather.type === 'blizzard' ? weather.amt : 0);
// rain or a blizzard: no balloons, kites or flocks in the sky
const isFoulFlyWeather = () => stormAmt() + blizAmt() > 0.15;
// weather changes as a front rolling in from the right and moving off to the left:
// [x0, x1] is the soft edge on screen; with dir > 0 the new weather lies right of it, with dir < 0 the old one lies left
const WX_FADE = 11;
const wxFront = [0, 0, 1];
function weatherFront() {
  const band = W * 0.3, f = wxFront;
  if (weather.phase === 'in') { const c = lerp(W + band, -band, weather.amt); f[0] = c - band; f[1] = c + band; f[2] = 1; }
  else if (weather.phase === 'out') { const c = lerp(-band, W + band, weather.amt); f[0] = c - band; f[1] = c + band; f[2] = -1; }
  else { f[0] = -2e5; f[1] = -1e5; f[2] = 1; }
  return f;
}
// how much of the current weather reaches screen x
function frontAt(x) {
  const f = weatherFront(), t = sstep(clamp((x - f[0]) / (f[1] - f[0]), 0, 1));
  return f[2] > 0 ? t : 1 - t;
}
// where on screen new rain or snow may start falling
function weatherSpan() {
  const f = weatherFront(), c = (f[0] + f[1]) / 2;
  if (weather.phase === 'in') return [Math.max(-20, c), W + 260];
  if (weather.phase === 'out') return [-20, Math.min(W + 260, c)];
  return [-20, W + 260];
}

function stepBird(h) {
  const P = pilotStat();
  const turn = P.turn || 1;
  let tvy = P.sink;
  const up = inUp(), down = inDown();
  if (up && !down) tvy = -370 * P.climb; else if (down && !up) tvy = 420 * (P.dive || 1);
  bird.vy = damp(bird.vy, tvy, up || down ? 5 * turn : 2.4 * Math.sqrt(turn), h);
  if (gust > 0.01) bird.vy += Math.sin(gustT * 2.3) * Math.sin(gustT * 0.7 + 0.5) * 260 * gust * h;
  for (const it of items) {
    if (it.type !== 'thermal' || Math.abs(bird.x - it.x) > it.w / 2) continue;
    const k = clamp((bird.y - it.top) / 140, 0, 1) * (1 - Math.pow(Math.abs(bird.x - it.x) / (it.w / 2), 2) * 0.5);
    if (k <= 0) continue;
    bird.vy -= 1500 * k * h;
    if (!it.used && state === 'play') {
      it.used = true;
      bumpCombo();
      const pts = 40 * mult();
      addScore(pts);
      thermalCount++; quest('thermal');
      popup(`Hava akımı  +${pts}`, '#ffe6b0');
      Sound.thermal();
    }
  }
  // cruising speed keeps creeping up the farther the flight goes
  let ts = cruiseSpeed() * P.speed;
  if (keys.right) ts += 160 * (0.7 + 0.3 * turn);
  if (keys.left) ts -= 150 * (0.7 + 0.3 * turn);
  // a glider trades height for speed: diving picks it up, climbing bleeds it off
  if (bird.vy > 60) ts += (bird.vy - 60) * 0.42; else if (bird.vy < -80) ts += (bird.vy + 80) * 0.16;
  ts = Math.max(ts, 180);
  if (sk.dash.t > 0) ts = ts * 1.8 + 60;
  if (ringBoost > 0) ts += 200;
  if (ringSlow > 0) ts = Math.max(170, ts - 160);
  bird.speed = damp(bird.speed, ts, (sk.dash.t > 0 ? 4 : 1.8) * Math.sqrt(turn), h);
  const dx = bird.speed * h;
  bird.x += dx;
  bird.y += bird.vy * h;
  if (bird.y < 34) { bird.y = 34; if (bird.vy < 0) bird.vy = 0; }
  addScore((dx / 10) * (sk.dash.t > 0 ? 2 : 1));
}
function collide() {
  const bx = bird.x, by = bird.y;
  const gy = groundY(bx);
  if (by + 10 > gy) {
    if (shieldOn()) { breakShield(null); bird.y = gy - 14; bird.vy = -420; }
    else if (bird.inv > 0 && state === 'play' && bird.inv > 1) { bird.y = gy - 12; bird.vy = -200; }
    else { die(); return; }
  }
  for (const o of obstacles) {
    if (o.dead) continue;
    if (bx + 70 < o.minX) continue;
    if (bx - 70 > o.maxX) {
      if (!o.passed) {
        o.passed = true;
        if (o.type !== 'storm' && !o.touched && o.near < BIRD_R + 22) nearMiss();
      }
      continue;
    }
    const d = obsDist(o, bx, by);
    if (d < o.near) o.near = d;
    if (d < BIRD_R) {
      o.touched = true;
      if (bird.inv > 0) continue;
      if (shieldOn()) { breakShield(o); continue; }
      die();
      return;
    }
  }
}
function updateBirdAnim(gdt) {
  const up = (state === 'play' && inUp() && !inDown()) || (state === 'menu' && bird.vy < -60);
  const down = state === 'play' && inDown() && !inUp();
  const turn = pilotStat().turn || 1;
  // pushing the bar out lifts the nose, pulling it in drops it into a dive
  bird.pitch = damp(bird.pitch, bird.dead ? 0.45 : state === 'menu' ? -0.16 + Math.sin(time * 0.9) * 0.025 : up ? -0.14 * Math.min(1.22, turn) : down ? 0.13 * Math.min(1.22, turn) : 0, 5 * turn, gdt);
  if (state !== 'menu') standK = damp(standK, 0, 4.5, gdt);
  bird.phase += gdt * (7 + bird.speed / 70);
  if (!bird.dead) bird.ang = damp(bird.ang, Math.atan2(bird.vy, Math.max(bird.speed, 120)) * 0.9, 9 * turn, gdt);
  // trail streams off the near wingtip
  const ca = Math.cos(bird.ang), sa = Math.sin(bird.ang);
  bird.th = (bird.th + 1) % TRAIL_N;
  bird.tx[bird.th] = bird.x - ca * 44 + sa * 4;
  bird.ty[bird.th] = bird.y - sa * 44 - ca * 4;
  bird.tn = Math.min(bird.tn + 1, TRAIL_N);
}

function updatePlay(gdt, dt) {
  for (const n of ['dash', 'shield', 'slow']) {
    const s = sk[n];
    if (s.t > 0) { s.t -= dt; if (s.t <= 0) { s.t = 0; endSkill(n); } }
    if (s.cd > 0) s.cd = Math.max(0, s.cd - dt);
  }
  if (comboTimer > 0) { comboTimer -= dt; if (comboTimer <= 0) combo = 0; }
  if (ringBoost > 0) ringBoost -= dt;
  if (ringSlow > 0) ringSlow -= dt;
  bird.inv = Math.max(0, bird.inv - gdt);
  bird.prevX = bird.x;
  const steps = Math.min(4, Math.max(1, Math.ceil(gdt / (1 / 120))));
  const h = gdt / steps;
  for (let i = 0; i < steps; i++) {
    stepBird(h);
    collide();
    if (state !== 'play') break;
  }
  dist = bird.x - startX;
  if (state === 'play') {
    updateSkim(gdt); updateGhost(gdt, dt);
    const m = Math.floor(dist / 10);
    if (m > questM) { quest('dist', m - questM); questM = m; questMax('oneDist', m); }
    questMax('oneScore', Math.floor(score));
  }
  if (!bestAnnounced && bestAtStart > 0 && score > bestAtStart) {
    bestAnnounced = true;
    popup('Yeni rekor', '#ffd27a', true);
    Sound.record();
  }
  spawnAhead();
}
// on the menu the pilot stands right of the title; on narrow screens a little further over
const MENU_FRAC = () => (W > 900 ? 0.64 : 0.7);
// the cliff starts out empty: after a breath the pilot walks on from the left, wing on his shoulders, up to the edge
let walkK = 0, walkWait = 0;
const standY = (x) => cliffTopY(x - 10) - STAND_FEET - 2;
function placeCliff(wait) {
  cliff.x = bird.x + 15;
  bird.x -= W * MENU_FRAC() + 90;
  bird.y = standY(bird.x); bird.vy = 0; bird.speed = 0; bird.ang = 0; bird.tn = 0;
  standK = 1; walkK = 0; walkWait = wait;
}
function updateMenu(gdt) {
  const edge = cliff.x - 15, left = edge - bird.x;
  bird.vy = 0;
  if (walkWait > 0) { walkWait -= gdt; bird.speed = 0; }
  else if (left > 0.5) {
    // a steady walk that eases to a stop at the brink
    bird.speed = clamp(left * 2.4, 26, 175);
    bird.x = Math.min(edge, bird.x + bird.speed * gdt);
    walkK = damp(walkK, clamp(left / 30, 0, 1), 10, gdt);
  } else { bird.x = edge; bird.speed = 0; walkK = damp(walkK, 0, 10, gdt); }
  // each step lifts him a little; standing, he only breathes
  bird.y = standY(bird.x) - Math.abs(Math.sin(bird.x / 9)) * 1.6 * walkK + Math.sin(time * 1.1) * 0.6 * (1 - walkK);
  standK = damp(standK, 1, 6, gdt);
}
function updateGlider(gdt) {
  const g = glider;
  if (!g) return;
  g.t += gdt;
  const gy = groundY(g.x) - 6;
  if (!g.landed) {
    // an empty wing: it slows, sinks gently and rocks like a falling leaf
    g.vx = damp(g.vx, 70, 0.7, gdt);
    g.vy = damp(g.vy, 60 + Math.sin(g.t * 1.7) * 45, 1.3, gdt);
    g.x += g.vx * gdt; g.y += g.vy * gdt;
    g.ang = damp(g.ang, Math.sin(g.t * 1.7 + 0.6) * 0.38 + 0.08, 2.2, gdt);
    if (g.y > gy) { g.y = gy; g.landed = true; addFx({ k: 'puff', x: g.x, y: gy + 2, life: 0.8, t: 0, s: 30 }); }
  } else {
    g.vx = damp(g.vx, 0, 3, gdt);
    g.x += g.vx * gdt;
    g.y = groundY(g.x) - 6;
    g.ang = damp(g.ang, 0.12, 3, gdt);
  }
}
// turn an angle toward a target along the shorter way round
function angDamp(a, target, rate, dt) {
  let d = (target - a) % TAU;
  if (d > Math.PI) d -= TAU; else if (d < -Math.PI) d += TAU;
  return a + d * (1 - Math.exp(-rate * dt));
}
function updateDying(gdt, dt) {
  deathTimer += dt;
  updateGlider(gdt);
  if (!bird.grounded) {
    // about a second after the crash the reserve parachute opens, if there is still height for it
    if (!chute && deathTimer > 0.9 && groundY(bird.x) - bird.y > 70) { chute = { t: 0, open: 0, col: 0, sw: 0 }; Sound.near(); }
    if (chute) {
      chute.t += gdt;
      chute.open = Math.min(1, chute.open + gdt / 0.45);
      const k = sstep(chute.open);
      bird.vy = lerp(bird.vy + 600 * gdt, damp(bird.vy, 70, 4, gdt), k);
      bird.speed = damp(bird.speed, 25, 2, gdt);
      chute.sw = Math.sin(chute.t * 1.7) * 0.14 * k;
      bird.ang = angDamp(bird.ang, -Math.PI / 2 + chute.sw, 0.5 + 5 * k, gdt);
    } else {
      bird.vy += 600 * gdt;
      bird.speed = damp(bird.speed, 0, 3, gdt);
      bird.ang += bird.spin * gdt;
    }
    bird.x += bird.speed * gdt;
    bird.y += bird.vy * gdt;
    const gy = groundY(bird.x);
    if (bird.y > gy - 11) {
      bird.y = gy - 11; bird.grounded = true; bird.vy = 0; landT = 0;
      addFx({ k: 'puff', x: bird.x, y: gy - 2, life: 0.8, t: 0, s: chute ? 18 : 28 });
    }
  } else {
    // sitting on the ground; the canopy sighs down behind him
    landT += dt;
    bird.speed = damp(bird.speed, 0, 4, gdt);
    bird.x += bird.speed * gdt;
    bird.y = groundY(bird.x) - 11;
    bird.ang = angDamp(bird.ang, -Math.PI / 2 + 0.12, 6, gdt);
    if (chute) { chute.t += gdt; chute.col = Math.min(1, chute.col + gdt / 3); }
  }
  if (state === 'dying' && ((bird.grounded && landT > 1.3) || deathTimer > 9)) showGameOver();
}
function updateObstacles(gdt) {
  for (const o of obstacles) {
    if (o.type === 'hawk') {
      o.x -= o.sp * gdt; o.ph += gdt * 1.7; o.y = o.y0 + Math.sin(o.ph) * o.amp; o.flap += gdt * 12;
      o.minX = o.x - 28; o.maxX = o.x + 28;
      if (!o.cried && o.x < camX + W + 40 && state === 'play') { o.cried = true; Sound.hawk(); }
    } else if (o.type === 'float') {
      o.oy = o.y + Math.sin(gtime * 0.9 + o.ph) * o.bob;
    } else if (o.type === 'balloon') {
      o.x += o.vx * gdt;
      const cyc = gtime * 1.15 + o.ph;
      o.oy = o.y + Math.sin(cyc) * o.bob;
      // burner fires during the rising phase of the thermal oscillation
      const rising = -Math.cos(cyc);
      o.burner = clamp(0.2 + Math.max(0, rising) * 0.8 + Math.sin(gtime * 13 + o.seed) * 0.08, 0.12, 1);
      o.sway = Math.sin(gtime * 1.65 + o.ph * 1.3) * 0.07 + gust * 0.12;
      o.minX = o.x - o.R * 1.05; o.maxX = o.x + o.R * 1.05;
      if (!o.whooshed && state === 'play' && rising > 0.35 && Math.abs(o.x - bird.x) < 340) {
        o.whooshed = true;
        Sound.burner();
      }
    } else if (o.type === 'kite') {
      o.x += o.vx * gdt;
      const cyc = gtime * 1.85 + o.ph;
      o.oy = o.y + Math.sin(cyc) * o.bob + Math.cos(cyc * 1.7) * 8;
      o.sway = Math.sin(gtime * 2.4 + o.ph * 1.3) * 0.14 + gust * 0.18;
      o.minX = o.x - o.R * 1.35; o.maxX = o.x + o.R * 1.35;
    } else if (o.type === 'geyser') {
      // it only starts counting once it is in sight, so every eruption can be read and timed
      if (o.x < camX + W + 60) o.tm -= gdt;
      if (o.st === 'idle') { o.k = Math.max(0, o.k - gdt * 3.2); if (o.tm <= 0) { o.st = 'charge'; o.tm = 1.05; } }
      else if (o.st === 'charge') { if (o.tm <= 0) { o.st = 'erupt'; o.tm = 1.15; if (state === 'play' && Math.abs(o.x - bird.x) < W) Sound.burner(); } }
      else {
        o.k = Math.min(1, o.k + gdt * 4.5);
        if (Math.random() < gdt * 26) addFx({ k: 'spark', x: o.x + rand(-8, 8), y: o.gy - o.h * o.k * rand(0.5, 1), vx: rand(-90, 90), vy: rand(-160, 40), life: rand(0.4, 0.9), t: 0, s: rand(2, 3.5), c: 'gold', drag: 1.5, grav: 420 });
        if (o.tm <= 0) { o.st = 'idle'; o.tm = rand(1.3, 2.1); }
      }
    } else if (o.type === 'storm') {
      o.tm -= gdt;
      if (o.st === 'idle' && o.tm <= 0 && stormAmt() > 0.2) { o.st = 'charge'; o.tm = 1.0; o.boltX = o.x + rand(-o.w * 0.28, o.w * 0.28); }
      else if (o.st === 'charge' && o.tm <= 0) {
        o.st = 'strike'; o.tm = 0.42; o.bolt = makeBolt(o.boltX, o.y + 30, groundY(o.boltX));
        const sx = o.boltX - camX;
        if (sx > -60 && sx < W + 60) {
          flash = Math.max(flash, RM ? 0.12 : 0.5);
          shake = Math.max(shake, RM ? 0 : 4);
          Sound.thunder(0.9);
          sparks(o.boltX, groundY(o.boltX) - 4, 12, 'bolt', 240);
        }
      } else if (o.st === 'strike' && o.tm <= 0) { o.st = 'idle'; o.tm = rand(0.7, 1.3); o.bolt = null; }
      o.minX = Math.min(o.x - o.w / 2, o.boltX - 30); o.maxX = Math.max(o.x + o.w / 2, o.boltX + 30);
    }
  }
  for (let i = obstacles.length - 1; i >= 0; i--) {
    const o = obstacles[i];
    if (o.maxX < camX - 320 || o.dead) obstacles.splice(i, 1);
  }
}
function updateItems(gdt) {
  const playing = state === 'play';
  const mag = (sk.dash.t > 0 ? 150 : 72) * pilotStat().magnet;
  for (let i = items.length - 1; i >= 0; i--) {
    const it = items[i];
    if (it.taken || it.done) { it.t += gdt; if (it.t > 0.8) { items.splice(i, 1); } continue; }
    if (it.x < camX - 300) { items.splice(i, 1); continue; }
    if (!playing) continue;
    if (it.type === 'thermal') { if (it.x + it.w < camX - 300) items.splice(i, 1); continue; }
    if (it.type === 'ring') {
      if (bird.prevX < it.x && bird.x >= it.x) { it.done = true; it.t = 0; if (Math.abs(bird.y - it.y) < it.ry - 8) ringPass(it); }
      continue;
    }
    const dx = bird.x - it.x, dy = bird.y - it.y, d2 = dx * dx + dy * dy;
    if (d2 < mag * mag) {
      const d = Math.sqrt(d2) || 1, pull = Math.min((1 - d / mag) * 1100 * gdt, d);
      it.x += (dx / d) * pull; it.y += (dy / d) * pull;
    }
    if (d2 < (it.type === 'orb' ? 34 : 28) ** 2) collect(it);
  }
}
function updateFx(gdt) {
  for (let i = fx.length - 1; i >= 0; i--) {
    const p = fx[i];
    p.t += gdt;
    if (p.t >= p.life) { fx.splice(i, 1); continue; }
    if (p.vx !== undefined) {
      const dr = Math.exp(-(p.drag || 0) * gdt);
      p.vx *= dr; p.vy *= dr;
      if (p.grav) p.vy += p.grav * gdt;
      p.x += p.vx * gdt; p.y += p.vy * gdt;
      if (p.vr) p.r += p.vr * gdt;
      if (p.k === 'plume') p.x += Math.sin(p.t * 5 + p.r) * 20 * gdt;
    }
  }
}
function newWP(kind, anywhere) {
  const p = { kind, x: rand(-20, W + 260), y: anywhere ? rand(viewTop, VB) : viewTop - rand(5, 60), d: rand(0.55, 1.35), ph: rand(0, TAU), r: rand(0, TAU), vr: 0, cut: Math.random() };
  if (kind === 'snow') { p.s = rand(1.1, 3) * p.d; p.vy = rand(28, 62) * p.d; p.vx = rand(-30, -6); }
  else if (kind === 'rain') { p.d = rand(0.85, 1.25); p.s = rand(14, 24) * p.d; p.vy = rand(850, 1100); p.vx = -220; }
  else if (kind === 'blizzard') { p.s = rand(0.9, 3.2) * p.d; p.vy = rand(70, 170) * p.d; p.vx = -rand(380, 640) * p.d; if (!anywhere) { p.x = rand(W * 0.3, W + 300); p.y = rand(viewTop - 40, VB); } }
  else { p.s = rand(2.6, 4.6) * p.d; p.vy = rand(24, 52); p.vx = rand(-80, -35); p.vr = rand(-3, 3); }
  if (!anywhere) {
    const [a, b] = weatherSpan();
    if (b <= a) p.off = true;
    else if (p.x < a || p.x > b) p.x = rand(a, b);
  }
  return p;
}
function updateWeatherParticles(dt, gdt) {
  const kind = weather.type === 'petals' ? 'petal' : weather.type;
  const MAX = { snow: 210, rain: 250, petal: 64, blizzard: 440, clear: 0 };
  const target = Math.round((MAX[kind] || 0) * weather.amt);
  let living = 0;
  for (const p of wp) if (p.kind === kind) living++;
  if (living < target) {
    const n = Math.min(target - living, kind === 'rain' || kind === 'blizzard' ? 12 : 5);
    for (let i = 0; i < n; i++) { const q = newWP(kind, false); if (!q.off) wp.push(q); }
  }
  for (let i = wp.length - 1; i >= 0; i--) {
    const p = wp[i];
    p.x -= camDx * p.d;
    p.x += p.vx * gdt; p.y += p.vy * gdt;
    if (p.kind === 'snow') p.x += Math.sin(time * 1.4 + p.ph) * 14 * gdt;
    else if (p.kind === 'blizzard') { p.x -= gust * 380 * p.d * gdt; p.y += Math.sin(time * 3 + p.ph) * 40 * gdt; }
    else if (p.kind === 'petal') { p.r += p.vr * gdt; p.x += Math.sin(time * 2 + p.ph) * 22 * gdt; }
    // ahead of an incoming front (or behind a leaving one) the air thins out
    if (p.kind === kind && weather.phase !== 'hold' && frontAt(p.x) < p.cut) { wp.splice(i, 1); living--; continue; }
    if (p.y > VB + 20 || p.x < -60 || p.x > W + 420) {
      if (p.kind !== kind || living > target) { wp.splice(i, 1); if (p.kind === kind) living--; continue; }
      const q = newWP(kind, false);
      if (q.off) { wp.splice(i, 1); living--; continue; }
      Object.assign(p, q);
    }
  }
  // fireflies at night
  const want = Math.round(28 * clamp((pal.stars - 0.3) / 0.6, 0, 1) * (1 - stormAmt()) * (1 - blizAmt()) * (1 - polarK) * (weather.type === 'snow' ? 0 : 1));
  if (!want) flies.length = 0;
  while (flies.length < want) flies.push({ x: rand(0, W), y: rand(470, 620), vx: rand(-14, 14), vy: rand(-8, 8), ph: rand(0, TAU), a: 0 });
  for (let i = flies.length - 1; i >= 0; i--) {
    const f = flies[i];
    f.x -= camDx * 0.55; f.x += f.vx * gdt; f.y += f.vy * gdt;
    f.vx += rand(-30, 30) * gdt; f.vy += rand(-24, 24) * gdt;
    f.vx = clamp(f.vx, -20, 20); f.vy = clamp(f.vy, -12, 12);
    if (f.y < 450) f.vy += 20 * gdt; if (f.y > 640) f.vy -= 20 * gdt;
    f.a = Math.min(1, f.a + gdt * 0.5);
    if (f.x < -20) { if (flies.length > want) { flies.splice(i, 1); continue; } f.x = W + 20; f.y = rand(470, 620); }
    else if (f.x > W + 40) f.x = -10;
  }
}
function buildCloud(c) {
  const s = Math.min(scale, 1.3);
  c.bs = s;
  if (Sky.ok && Sky.bakeCloud(c, s)) return;
  const w = c.w, h = c.h, pad = Math.round(h * 0.44);
  const lw = w + pad * 2, lh = h + pad * 2;
  const cw = Math.max(2, Math.ceil(lw * s)), ch = Math.max(2, Math.ceil(lh * s));
  const mask = document.createElement('canvas'), shade = document.createElement('canvas'), tint = document.createElement('canvas');
  mask.width = shade.width = tint.width = cw;
  mask.height = shade.height = tint.height = ch;
  const m = mask.getContext('2d');
  m.scale(s, s);

  // Multi-turret asymmetric cumulus silhouette (fallback when WebGL2 is unavailable)
  const sk = Math.random() < 0.5 ? -1 : 1;
  const towers = [
    [0.5 + sk * rand(0.08, 0.18), 1.0, 0.34],
    [0.5 - sk * rand(0.18, 0.28), rand(0.68, 0.86), 0.28],
    [0.5 + sk * rand(0.28, 0.38), rand(0.48, 0.66), 0.22],
  ];
  const puffs = [];
  const n = Math.max(22, Math.round(w / 10));
  for (let i = 0; i < n; i++) {
    const t = rand(0.05, 0.95);
    let env = Math.sin(t * Math.PI) * 0.45;
    for (const [tc, th, tw] of towers) {
      const d = (t - tc) / tw;
      env = Math.max(env, Math.exp(-d * d) * th);
    }
    const r = h * (0.16 + 0.36 * env) * rand(0.75, 1.18);
    const x = pad + t * w + rand(-8, 8);
    const y = pad + h * 0.78 - r * 0.48 - rand(0, h * 0.38) * env;
    puffs.push([x, y, r]);
    const g = m.createRadialGradient(x, y, 0, x, y, r);
    g.addColorStop(0, 'rgba(255,255,255,0.96)');
    g.addColorStop(0.55, 'rgba(255,255,255,0.72)');
    g.addColorStop(1, 'rgba(255,255,255,0)');
    m.fillStyle = g;
    m.fillRect(x - r, y - r, r * 2, r * 2);
  }
  // Softly feather the flat condensation base into mist
  m.globalCompositeOperation = 'destination-out';
  const fb = m.createLinearGradient(0, pad + h * 0.68, 0, pad + h + pad * 0.45);
  fb.addColorStop(0, 'rgba(0,0,0,0)');
  fb.addColorStop(0.6, 'rgba(0,0,0,0.55)');
  fb.addColorStop(1, 'rgba(0,0,0,1)');
  m.fillStyle = fb;
  m.fillRect(0, pad + h * 0.68, lw, lh);

  // Unpremultiplied shadow map: smooth vertical belly shadow + soft fold shadows (no ring artifacts)
  const sh = shade.getContext('2d');
  sh.scale(s, s);
  const sg = sh.createLinearGradient(0, pad + h * 0.08, 0, pad + h);
  sg.addColorStop(0, 'rgba(255,255,255,0)');
  sg.addColorStop(0.45, 'rgba(255,255,255,0.42)');
  sg.addColorStop(0.82, 'rgba(255,255,255,0.86)');
  sg.addColorStop(1, 'rgba(255,255,255,0.95)');
  sh.fillStyle = sg;
  sh.fillRect(0, 0, lw, lh);
  for (const [x, y, r] of puffs) {
    const sx = x + r * 0.14, sy = y + r * 0.28, sr = r * 0.85;
    const g = sh.createRadialGradient(sx, sy, 0, sx, sy, sr);
    g.addColorStop(0, 'rgba(255,255,255,0.32)');
    g.addColorStop(1, 'rgba(255,255,255,0)');
    sh.fillStyle = g;
    sh.fillRect(sx - sr, sy - sr, sr * 2, sr * 2);
  }
  sh.globalCompositeOperation = 'destination-out';
  for (const [x, y, r] of puffs) {
    const lx = x - r * 0.18, ly = y - r * 0.36, lr = r * 0.72;
    const g = sh.createRadialGradient(lx, ly, 0, lx, ly, lr);
    g.addColorStop(0, 'rgba(0,0,0,0.55)');
    g.addColorStop(1, 'rgba(0,0,0,0)');
    sh.fillStyle = g;
    sh.fillRect(lx - lr, ly - lr, lr * 2, lr * 2);
  }

  c.mask = mask; c.shade = shade; c.tint = tint; c.pad = pad; c.lw = lw; c.lh = lh;
}
function tintCloud(c, lit, dark) {
  const t = c.tint.getContext('2d'), w = c.tint.width, h = c.tint.height;
  t.globalCompositeOperation = 'source-over';
  t.clearRect(0, 0, w, h);
  t.drawImage(c.mask, 0, 0);
  t.globalCompositeOperation = 'source-in';
  const sunTint = mix(WHITE, mix(pal.light, pal.sun, 0.4), 0.52);
  const crown = mix(lit, sunTint, c.storm ? 0.24 : 0.30 * (1 - pal.stars * 0.5));
  const baseLit = mix(lit, pal.fog, c.storm ? 0.28 : 0.34);
  const lg = t.createLinearGradient(0, h * 0.12, 0, h * 0.86);
  lg.addColorStop(0, css(crown));
  lg.addColorStop(0.48, css(lit));
  lg.addColorStop(1, css(baseLit));
  t.fillStyle = lg;
  t.fillRect(0, 0, w, h);
  if (cloudTmp.width !== w || cloudTmp.height !== h) { cloudTmp.width = w; cloudTmp.height = h; }
  const k = cloudTmp.getContext('2d');
  k.globalCompositeOperation = 'source-over';
  k.clearRect(0, 0, w, h);
  k.drawImage(c.shade, 0, 0);
  k.globalCompositeOperation = 'source-in';
  const topShd = mix(lit, dark, 0.62);
  const botShd = mix(dark, pal.fog, c.storm ? 0.30 : 0.38);
  const dg = k.createLinearGradient(0, h * 0.18, 0, h * 0.88);
  dg.addColorStop(0, css(topShd));
  dg.addColorStop(0.60, css(dark));
  dg.addColorStop(1, css(botShd));
  k.fillStyle = dg;
  k.fillRect(0, 0, w, h);
  t.globalCompositeOperation = 'source-atop';
  t.drawImage(cloudTmp, 0, 0);
  t.globalCompositeOperation = 'source-over';
}
function cloudColors(storm) {
  if (storm) {
    const lit = mix(pal.cloud, [112, 124, 152], 0.52);
    return [lit, mix(mix(lit, pal.top, 0.35), [22, 27, 46], 0.58)];
  }
  const lit = mix(pal.cloud, mix(WHITE, pal.light, 0.35), 0.18 * (1 - pal.stars * 0.6));
  return [lit, mix(mix(pal.cloud, mix(pal.top, pal.mid, 0.45), 0.46), pal.fog, 0.30)];
}
function retintClouds() {
  const c0 = cloudColors(false), c1 = cloudColors(true);
  for (const c of clouds) tintCloud(c, c0[0], c0[1]);
  for (const o of obstacles) if (o.type === 'storm') tintCloud(o.cloud, c1[0], c1[1]);
}
function makeCloud(band, initial) {
  const far = band === 0;
  const w = far ? rand(190, 340) : rand(250, 410);
  const c = { band, par: far ? rand(0.018, 0.045) : rand(0.09, 0.15), w, h: w * rand(0.32, 0.42), y: far ? rand(Math.min(115, viewTop + 135), 265) : rand(Math.min(155, viewTop + 195), 315), drift: rand(4, 11), wx: 0 };
  buildCloud(c);
  const cc = cloudColors(false);
  tintCloud(c, cc[0], cc[1]);
  c.wx = camX * c.par + (initial ? rand(-100, W + 200) : W + rand(30, 500));
  return c;
}
function makeBgKite(band, initial, idx = 0) {
  const far = band === 0;
  const par = far ? rand(0.12, 0.17) : rand(0.26, 0.36);
  const R = far ? rand(13, 18) : rand(21, 30);
  const y = far ? rand(165, 340) : rand(150, 360);
  const slotW = (W + 160) / 4;
  const x0 = initial ? 60 + idx * slotW + rand(-35, 50) : W + rand(60, 420);
  return {
    band, par, R, y, oy: y,
    wx: camX * par + x0,
    drift: far ? rand(4, 9) : rand(7, 15),
    bob: far ? rand(8, 14) : rand(12, 22),
    ph: rand(0, TAU),
    scheme: (idx * 2 + band + rint(0, 5)) % 6,
    seed: rint(1, 9973),
    fog: far ? rand(0.50, 0.65) : rand(0.24, 0.38),
  };
}
function makeBgBalloon(band, initial, idx = 0) {
  const far = band === 0;
  const par = far ? rand(0.11, 0.15) : rand(0.24, 0.34);
  const R = far ? rand(15, 22) : rand(25, 36);
  const y = far ? rand(155, 325) : rand(145, 355);
  const slotW = (W + 160) / 3;
  const x0 = initial ? 70 + idx * slotW + rand(-40, 60) : W + rand(80, 460);
  return {
    band, par, R, y, oy: y,
    wx: camX * par + x0,
    drift: far ? rand(3, 8) : rand(6, 14),
    bob: far ? rand(6, 11) : rand(10, 17),
    ph: rand(0, TAU),
    burnPh: rand(0, TAU),
    scheme: (idx * 2 + band + rint(0, 5)) % 6,
    seed: rint(1, 9973),
    fog: far ? rand(0.54, 0.68) : rand(0.26, 0.42),
  };
}

function update(dt) {
  time += dt;
  if (state === 'paused') {
    Sound.update(bird.speed, stormAmt(), false, true);
    if (resumeT > 0) {
      resumeT -= dt;
      const cd = $('countdown');
      cd.textContent = String(Math.max(1, Math.ceil(resumeT / 0.7)));
      if (resumeT <= 0) { cd.hidden = true; state = 'play'; }
    }
    return;
  }
  const slowOn = sk.slow.t > 0;
  let tsTarget = slowOn ? 0.42 : 1;
  if (state === 'dying' && deathTimer < 0.55) tsTarget = 0.32;
  timeScale = damp(timeScale, tsTarget, 7, dt);
  const gdt = dt * timeScale;
  gtime += gdt;

  dayT = (dayT + dt / DAY_LEN) % 1;
  updateWeather(dt);
  // while a front passes, the wind pushes the clouds along with it
  if (weather.phase !== 'hold') wxDrift += dt * 150;
  const storm = stormAmt();
  computePalette(dayT, storm);
  const bliz = blizAmt();
  if (bliz > 0.001) {
    const day = 1 - pal.stars;
    const white = mix([72, 84, 108], [222, 230, 240], day), k = bliz * 0.62;
    for (const key of ['top', 'mid', 'bot', 'far', 'fog', 'cloud', 'glow']) {
      const o = pal[key], l = (o[0] * 0.3 + o[1] * 0.59 + o[2] * 0.11) / 255;
      const t = mix(white, [l * 255, l * 255 + 6, l * 255 + 14], 0.35);
      o[0] = lerp(o[0], t[0], k); o[1] = lerp(o[1], t[1], k); o[2] = lerp(o[2], t[2], k);
    }
    pal.near = mix(pal.near, mix(pal.near, white, 0.25), bliz);
    pal.stars *= 1 - bliz;
  }
  updateBiome(dt);
  gustT += dt * (0.6 + bliz);
  gust = bliz * (0.55 + 0.45 * Math.sin(gustT * 0.9) * Math.sin(gustT * 0.37 + 1.3));

  const pn = phaseName(dayT);
  if (pn !== lastPhase) {
    lastPhase = pn;
    showLabel();
    if (pn === 'Gece') auroraStr = Math.random() < 0.75 ? rand(0.55, 1) : 0;
  }
  if (phaseShowT > 0) { phaseShowT -= dt; if (phaseShowT <= 0) el.phase.classList.remove('show'); }

  // celestial
  const st = dayT >= 0.97 ? dayT - 1 : dayT;
  const sp = (st + 0.03) / 0.69;
  sun.a = sp > 0 && sp < 1 ? clamp(Math.sin(sp * Math.PI) * 4, 0, 1) * (1 - storm * 0.85) * (1 - bliz * 0.7) : 0;
  sun.x = W * (0.1 + 0.8 * clamp(sp, 0, 1)); sun.y = 480 - Math.sin(clamp(sp, 0, 1) * Math.PI) * 360;
  const mt = dayT < 0.05 ? dayT + 1 : dayT;
  const mp = (mt - 0.62) / 0.43;
  moon.a = mp > 0 && mp < 1 ? clamp(Math.sin(mp * Math.PI) * 4, 0, 1) * (1 - storm * 0.9) * (1 - bliz * 0.7) : 0;
  moon.x = W * (0.12 + 0.76 * clamp(mp, 0, 1)); moon.y = 470 - Math.sin(clamp(mp, 0, 1) * Math.PI) * 330;

  if (state === 'play') updatePlay(gdt, dt);
  else if (state === 'menu') updateMenu(gdt);
  else updateDying(gdt, dt);
  if (state !== 'over' || !bird.grounded) updateBirdAnim(gdt);

  // camera
  const prev = camX;
  bird.frac = damp(bird.frac, state === 'menu' ? MENU_FRAC() : sk.dash.t > 0 || ringBoost > 0 ? 0.2 : 0.27, state === 'menu' ? 3 : standK > 0.02 ? 1.3 : 2.5, dt);
  // on the menu the view rests on the edge of the cliff, wherever the pilot is
  camX = (state === 'menu' ? cliff.x - 15 : bird.x) - W * bird.frac;
  camDx = camX - prev;
  camV = damp(camV, dt > 0 ? camDx / dt : 0, 6, dt);

  updateObstacles(gdt);
  updateItems(gdt);
  updateFx(gdt);
  updateWeatherParticles(dt, gdt);

  for (let i = popups.length - 1; i >= 0; i--) { const p = popups[i]; p.t += dt; p.y -= 26 * dt; if (p.t > p.life) popups.splice(i, 1); }

  for (const c of clouds) {
    c.wx -= c.drift * dt;
    if (c.wx - camX * c.par + c.w < -40) Object.assign(c, makeCloud(c.band, false));
  }
  for (let i = 0; i < bgBalloons.length; i++) {
    const b = bgBalloons[i];
    b.wx -= b.drift * dt;
    b.oy = b.y + Math.sin(time * 0.65 + b.ph) * b.bob;
    if (b.wx - camX * b.par + b.R * 2 < -90) Object.assign(b, makeBgBalloon(b.band, false, i % 3));
  }
  for (let i = 0; i < bgKites.length; i++) {
    const kt = bgKites[i];
    kt.wx -= kt.drift * dt;
    kt.oy = kt.y + Math.sin(time * 1.35 + kt.ph) * kt.bob;
    if (kt.wx - camX * kt.par + kt.R * 2 < -90) Object.assign(kt, makeBgKite(kt.band, false, i % 4));
  }
  retintT -= dt;
  if (retintT <= 0) { retintT = 0.4; retintClouds(); }
  // flock
  const foul = stormAmt() + blizAmt() > 0.15;
  if (!flock) {
    flockT -= dt;
    if (flockT <= 0 && !foul) {
      const n = rint(5, 9), birds = [];
      for (let i = 0; i < n; i++) birds.push({ dx: -Math.abs(i - (n >> 1)) * 16 + rand(-3, 3), dy: Math.abs(i - (n >> 1)) * 9 * (i < n >> 1 ? -1 : 1) * 0.6 + rand(-3, 3), ph: rand(0, TAU) });
      flock = { x: W + 60, y: rand(170, 320), vx: rand(28, 42), birds, a: 0 };
    }
  } else {
    flock.x += flock.vx * dt - camDx * 0.2;
    flock.a = damp(flock.a, foul ? 0 : 1, foul ? 1.5 : 0.8, dt);
    if (flock.x < -260 || flock.x > W + 320 || (foul && flock.a < 0.02)) { flock = null; flockT = rand(18, 36); }
  }
  // background lightning during storms
  if (storm > 0.5) {
    bgBoltT -= dt;
    if (bgBoltT <= 0) {
      bgBoltT = rand(5, 12);
      const x = rand(W * 0.2, W * 0.9);
      bgBolt = { b: makeBolt(x, viewTop + 40 > 60 ? viewTop + 40 : 60, rand(330, 420)), t: 0.22 };
      flash = Math.max(flash, RM ? 0.06 : 0.28);
      setTimeout(() => Sound.thunder(0.45), rand(300, 1200));
    }
  }
  if (bgBolt) { bgBolt.t -= dt; if (bgBolt.t <= 0) bgBolt = null; }
  // shooting stars
  if (pal.stars > 0.65) {
    shootT -= dt;
    if (shootT <= 0) { shootT = rand(6, 14); shooting.push({ x: rand(W * 0.3, W + 50), y: rand(Math.max(viewTop, -200) + 30, 240), vx: -rand(520, 720), vy: rand(150, 240), t: 0, life: 0.9 }); }
  }
  for (let i = shooting.length - 1; i >= 0; i--) { const s = shooting[i]; s.t += dt; s.x += s.vx * dt; s.y += s.vy * dt; if (s.t > s.life) shooting.splice(i, 1); }

  for (const w of wisps) {
    w.x -= (camV * w.par + w.sp) * dt;
    if (w.x + w.len < -40) { w.x = W + rand(40, 520); w.y = rand(Math.max(viewTop, 0) + 70, 540); }
  }
  for (const l of lines) { l.x -= l.sp * dt; if (l.x + l.len < 0) { l.x = W + rand(0, 400); l.y = rand(Math.max(viewTop, 0) + 30, VB - 80); } }

  shake = Math.max(0, shake - dt * 30);
  flash = Math.max(0, flash - dt * 2.4);
  slowAmt = damp(slowAmt, slowOn ? 1 : 0, 6, dt);
  dashAmt = damp(dashAmt, sk.dash.t > 0 ? 1 : ringBoost > 0 ? 0.75 : 0, 6, dt);
  shieldAmt = damp(shieldAmt, shieldOn() ? 1 : 0, 10, dt);

  Sound.update(bird.speed, storm, state === 'play', false, state === 'play' ? clamp((cruiseSpeed() - 300) / 380, 0, 1) : 0);
  updateHUD();
}

/* =========================================================
   HUD
   ========================================================= */
const hc = { s: -1, d: -1, f: -1, m: -1, cf: -1, b: -1 };
function updateHUD() {
  if (state !== 'play' && state !== 'dying') return;
  const s = Math.floor(score);
  if (s !== hc.s) { hc.s = s; el.score.textContent = fmt(s); }
  const d = Math.floor(dist / 10);
  if (d !== hc.d) { hc.d = d; el.dist.textContent = fmt(d); }
  if (featherCount !== hc.f) { hc.f = featherCount; el.feathers.textContent = String(featherCount); }
  const m = combo > 0 ? combo + 1 : 0;
  if (m !== hc.m) { hc.m = m; el.combo.hidden = m === 0; el.mult.textContent = '×' + m; }
  if (m) { const cf = Math.round((comboTimer / 6.5) * 100) / 100; if (cf !== hc.cf) { hc.cf = cf; el.comboFill.style.transform = `scaleX(${cf})`; } }
  const b = best;
  if (b !== hc.b) { hc.b = b; el.hudBest.textContent = fmt(b); }
  for (const name of SKILL_NAMES) {
    const sv = sk[name], def = SK[name], node = skillEls[name];
    let st, p;
    if (sv.t > 0) { st = 'active'; p = sv.t / def.dur; }
    else if (sv.cd > 0) { st = 'cool'; p = Math.min(1, sv.cd / def.cd); }
    else { st = 'ready'; p = 0; }
    if (node._st !== st) {
      node.classList.toggle('active', st === 'active');
      node.classList.toggle('cool', st === 'cool');
      if (st === 'ready' && node._st === 'cool') { node.classList.remove('ready-flash'); void node.offsetWidth; node.classList.add('ready-flash'); }
      node._st = st;
    }
    const pr = Math.round(p * 200) / 200;
    if (node._p !== pr) { node._p = pr; node.style.setProperty('--p', pr); }
  }
}
