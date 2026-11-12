// Süzülüş — Skills, scoring, missions, ghost race, game flow, input and the shop
'use strict';

/* =========================================================
   Skills + scoring
   ========================================================= */
function bumpCombo() {
  combo = Math.min(combo + 1, 9);
  comboTimer = 6.5;
  maxCombo = Math.max(maxCombo, combo + 1);
  questMax('oneCombo', combo + 1);
  el.combo.classList.remove('pop'); void el.combo.offsetWidth; el.combo.classList.add('pop');
}
const mult = () => 1 + combo;
function addScore(n) { score += n; }

function useSkill(name) {
  if (state !== 'play') return;
  const s = sk[name], def = SK[name];
  if (s.t > 0 || s.cd > 0) {
    const b = skillEls[name];
    b.classList.remove('deny'); void b.offsetWidth; b.classList.add('deny');
    Sound.deny();
    return;
  }
  s.t = def.dur;
  s.cd = def.dur + def.cd;
  quest('skill');
  if (name === 'dash') { Sound.dash(); sparks(bird.x - 10, bird.y, 14, 'gold', 260); shock(bird.x, bird.y, 'rgba(255,214,130,', 70); }
  else if (name === 'shield') { Sound.shield(); shock(bird.x, bird.y, 'rgba(150,235,255,', 50); }
  else if (name === 'slow') { Sound.slow(true); shock(bird.x, bird.y, 'rgba(200,185,255,', 90); }
}
function endSkill(name) {
  if (name === 'slow') Sound.slow(false);
}
const shieldOn = () => sk.shield.t > 0;

function breakShield(o) {
  buzz(35);
  sk.shield.t = 0; sk.shield.cd = SK.shield.cd;
  bird.inv = 1;
  Sound.shieldBreak();
  shake = Math.max(shake, RM ? 0 : 7);
  shock(bird.x, bird.y, 'rgba(150,235,255,', 80);
  sparks(bird.x, bird.y, 18, 'cyan', 300);
  if (o) {
    o.dead = true;
    if (o.type === 'hawk') featherBurst(o.x, o.y, 10);
    else if (o.type === 'balloon') { featherBurst(o.x, o.oy, 14); sparks(o.x, o.oy + o.R * 0.7, 16, 'gold', 260); chunks(o.x, o.oy + o.R * 1.2, 8, '#8c5e38'); }
    else if (o.type === 'kite') { featherBurst(o.x, o.oy, 12); sparks(o.x, o.oy, 14, 'gold', 220); chunks(o.x, o.oy, 10, '#c84a3a'); }
    else if (o.type !== 'storm') chunks(bird.x + 10, bird.y, 14, css(obsFillC));
  }
  popup('Kalkan seni korudu', '#bdf2ff');
}
function die() {
  buzz([40, 40, 110]);
  state = 'dying';
  deathTimer = 0;
  bird.dead = true; bird.grounded = false;
  bird.spin = (Math.random() < 0.5 ? -1 : 1) * 3.5;
  glider = { x: bird.x, y: bird.y, vx: Math.max(bird.speed * 0.75, 160), vy: Math.min(bird.vy, 0) - 90, ang: bird.ang, t: 0, landed: false };
  bird.vy = -60;
  bird.speed *= 0.25;
  for (const n of SKILL_NAMES) { if (sk[n].t > 0) { sk[n].t = 0; endSkill(n); } }
  shake = RM ? 0 : 14; flash = Math.max(flash, 0.22);
  featherBurst(bird.x, bird.y, 16);
  sparks(bird.x, bird.y, 10, 'white', 200);
  Sound.crash();
  combo = 0; ringBoost = 0; ringSlow = 0;
  skimT = 0; skimOn = false;
  touch.up = touch.down = false; pointers.clear();
}

function collect(it) {
  it.taken = true; it.t = 0;
  if (it.type === 'feather') {
    featherCount++; quest('feather');
    featherChain = gtime - lastFeatherT < 1.1 ? featherChain + 1 : 0;
    lastFeatherT = gtime;
    addScore(10 * mult());
    sparks(it.x, it.y, 6, 'gold', 140, 2.5);
    Sound.feather(featherChain); buzz(6);
  } else if (it.type === 'orb') {
    for (const n of SKILL_NAMES) if (sk[n].t <= 0) sk[n].cd = 0;
    const pts = 250 * mult();
    addScore(pts);
    popup(`Ruh küresi: yetenekler yenilendi  +${pts}`, '#9fdcff', true);
    sparks(it.x, it.y, 24, 'blue', 280);
    shock(it.x, it.y, 'rgba(140,210,255,', 90);
    Sound.orb();
  }
}
function ringPass(it) {
  buzz(14);
  it.ok = true;
  ringCount++; quest('ring');
  bumpCombo();
  if (it.slow) {
    // a headwind through the ring brakes the glider at once
    const pts = 80 * mult();
    addScore(pts);
    ringSlow = 1.8; ringBoost = 0;
    bird.speed = Math.max(170, bird.speed - 230);
    shock(bird.x, bird.y, 'rgba(165,215,255,', 60);
    popup(`Yavaşlatma halkası  +${pts}`, '#cfe9ff');
    sparks(it.x, it.y, 16, 'cyan', 200);
    Sound.ringSlow();
    return;
  }
  ringSlow = 0;
  const perfect = Math.abs(bird.y - it.y) < 15;
  if (perfect) { perfectCount++; bumpCombo(); sparks(it.x, it.y, 14, 'white', 300, 2.5); shock(it.x, it.y, 'rgba(255,246,220,', 95); }
  const pts = (perfect ? 240 : 120) * mult();
  addScore(pts);
  // the gust through the ring throws the glider forward at once
  ringBoost = 1.6;
  bird.speed += 240;
  shock(bird.x, bird.y, 'rgba(255,236,190,', 60);
  popup(perfect ? `Tam isabet  +${pts}` : `Rüzgar halkası  +${pts}`, perfect ? '#ffe08a' : '#fff1c9', perfect);
  sparks(it.x, it.y, 16, 'gold', 220);
  Sound.ring();
}
function nearMiss() {
  buzz(18);
  nearCount++; quest('near');
  bumpCombo();
  const pts = 60 * mult();
  addScore(pts);
  popup(`Kıl payı  +${pts}`, '#ffffff');
  Sound.near();
}

/* =========================================================
   Ghost race and skimming
   ========================================================= */
function updateGhost(gdt, dt) {
  runT += gdt;
  while (runT >= recNext && rec.length < 30000) { rec.push(Math.round(bird.x - startX), Math.round(bird.y), Math.round(bird.ang * 100)); recNext += GH_DT; }
  const g = ghostRun;
  if (!g) return;
  const d = ghost.d, n = d.length / 3, f = runT / GH_DT, i = Math.floor(f);
  if (i >= n - 1) {
    // the recorded flight ended here: you have flown longer than your best
    g.a = Math.max(0, g.a - dt * 1.5);
    if (!g.done) {
      g.done = true;
      const pts = 500 * mult();
      addScore(pts); ghostFeathers += 20;
      popup(`Hayaleti geride bıraktın  +${pts} · +20 tüy`, '#bdf2ff', true);
      Sound.record();
    }
    return;
  }
  const t = f - i, a = i * 3, b = a + 3;
  g.x = startX + lerp(d[a], d[b], t); g.y = lerp(d[a + 1], d[b + 1], t); g.ang = lerp(d[a + 2], d[b + 2], t) / 100;
  g.a = Math.min(1, g.a + dt * 1.2);
  g.lead = bird.x - g.x;
  g.cool -= dt;
  if (g.lead < -40) g.behind = true;
  else if (g.behind && g.lead > 25 && g.cool <= 0) {
    g.behind = false; g.cool = 6;
    const pts = 50 * mult();
    addScore(pts);
    popup(`Hayaleti geçtin  +${pts}`, '#bdf2ff');
    Sound.near();
  }
}
// flying within a wingspan of the ground: points tick up, the combo stays alive, dust kicks up behind
function endSkim() {
  if (skimOn && skimPts > 0) popup(`Yer sıyırma  +${skimPts}`, '#e8f6ff');
  skimT = 0; skimAcc = 0; skimPts = 0; skimOn = false;
}
function updateSkim(gdt) {
  const gy = groundY(bird.x), alt = gy - bird.y;
  if (alt > 62 || bird.inv > 1) { if (skimT > 0) endSkim(); return; }
  skimT += gdt; skimAcc += gdt; skimTotal += gdt; skimFx -= gdt;
  if (skimFx <= 0) {
    skimFx = 0.045;
    addFx({ k: 'puff', x: bird.x - rand(4, 26), y: gy - 1, vx: -rand(30, 110), vy: -rand(12, 60), life: rand(0.35, 0.75), t: 0, s: rand(4, 9), drag: 2.2 });
  }
  if (skimAcc >= 0.5) {
    skimAcc -= 0.5;
    if (!skimOn) { skimOn = true; bumpCombo(); Sound.near(); }
    const pts = 15 * mult();
    addScore(pts); skimPts += pts;
    comboTimer = Math.max(comboTimer, 3);
  }
}

/* =========================================================
   Flow
   ========================================================= */
function hideScreens() { el.menu.hidden = true; el.pause.hidden = true; el.over.hidden = true; $('shop').hidden = true; }
function startGame() {
  Sound.init();
  // on a phone: fill the screen and turn it sideways where the browser allows it
  if (MOBILE) {
    try {
      const de = document.documentElement;
      if (!document.fullscreenElement && de.requestFullscreen) {
        de.requestFullscreen({ navigationUI: 'hide' }).then(() => {
          if (screen.orientation && screen.orientation.lock) screen.orientation.lock('landscape').catch(() => {});
        }).catch(() => {});
      }
    } catch (e) { /* fullscreen is a nicety */ }
  }
  if (document.activeElement && document.activeElement.blur) document.activeElement.blur();
  obstacles.length = 0; items.length = 0; popups.length = 0;
  bird.dead = false; bird.grounded = false; bird.spin = 0; glider = null; chute = null;
  const jump = state === 'menu';
  // if he is still walking up, he is at the edge the moment the flight is called
  if (jump) { bird.x = cliff.x - 15; bird.y = standY(bird.x); standK = 1; walkK = 0; walkWait = 0; bird.vy = -175; bird.speed = 130; bird.tn = 0; }
  else {
    bird.y = Math.min(bird.y, groundY(bird.x) - 220);
    if (bird.y < 120) bird.y = 260;
    bird.vy = 0; standK = 0;
  }
  bird.inv = 1.6; bird.ang = 0;
  score = 0; dist = 0; startX = bird.x; featherCount = 0; ringCount = 0; thermalCount = 0; combo = 0; comboTimer = 0; maxCombo = 1;
  applyUpgrades();
  skimT = 0; skimAcc = 0; skimPts = 0; skimOn = false; skimTotal = 0; nearCount = 0; perfectCount = 0;
  shuffleBiomes(); resetBiome();
  runLvl = lvlAtStart = levelInfo().l; questM = 0; questDone.length = 0;
  for (const q of save.quests) { q.wait = false; if (QUESTS[q.k].one) q.p = 0; }
  el.hudLvl.textContent = String(runLvl);
  if (!jump) bird.speed = Math.max(bird.speed, startSpeed() * 0.87);
  rec = []; recNext = 0; runT = 0; ghostFeathers = 0;
  ghostRun = ghost ? { x: bird.x, y: bird.y, ang: 0, a: 0, lead: 0, behind: false, cool: 3, done: false } : null;
  missionFeathers = 0; missionsDone = 0;
  bestAtStart = best; bestAnnounced = false; ringBoost = 0; ringSlow = 0;
  for (const n of SKILL_NAMES) { sk[n].t = 0; sk[n].cd = 0; }
  spawnX = bird.x + W * 0.88;
  lastPattern = ''; samePattern = 0;
  if (!isFoulFlyWeather()) {
    if (CITY) {
      const end = PATTERNS.kite(spawnX, 0);
      spawnX = end + 480;
      lastPattern = 'kite';
    } else if (!CANYON && !POLAR && !VOLCANO) {
      const end = PATTERNS.balloon(spawnX, 0);
      spawnX = end + 520;
      lastPattern = 'balloon';
    }
  }
  state = 'play';
  timeScale = 1;
  hideScreens();
  el.hud.hidden = false; el.btnPause.hidden = false; el.hudBestWrap.hidden = false; el.btnMute.hidden = MOBILE;
  applyLayout();
  el.hudBest.textContent = fmt(best);
  sparks(bird.x, bird.y, 18, 'white', 200, 2.5);
  shock(bird.x, bird.y, 'rgba(255,255,255,', 70);
  Sound.start();
}
function showGameOver() {
  state = 'over';
  overAt = time;
  const final = Math.floor(score);
  const isRecord = final > bestAtStart && final > 0;
  if (final > best) { best = final; saveBest(); }
  el.finalScore.textContent = fmt(final);
  el.record.hidden = !isRecord;
  el.stDist.textContent = fmt(dist / 10) + ' m';
  el.stFeathers.textContent = String(featherCount);
  el.stRings.textContent = String(ringCount);
  el.stCombo.textContent = '×' + maxCombo;
  el.tip.textContent = 'İpucu: ' + TIPS[(Math.random() * TIPS.length) | 0];
  // feathers from this flight go into the purse; every 10 thermals caught is worth a bonus
  const earned = featherCount + Math.floor(dist / 10 / 250) + thermalCount * 2 + missionFeathers + ghostFeathers;
  // how the race against the ghost ended, then the better flight becomes the next ghost
  let race = '';
  if (ghostRun) race = ghostRun.done ? '<br>Hayalet yarışı: en iyi uçuşundan daha uzun uçtun.' : `<br>Hayalet yarışı: hayaletin <b>${fmt(Math.abs(ghostRun.lead) / 10)} m</b> ${ghostRun.lead >= 0 ? 'önündeydin' : 'gerisindeydin'}.`;
  if (rec && rec.length >= 30 && (!ghost || final >= ghost.score)) {
    ghost = { d: rec, score: final };
    try { localStorage.setItem('suzulus-ghost', JSON.stringify(ghost)); } catch (e) { /* too large or blocked: the ghost lasts for this session only */ }
  }
  rec = null;
  save.purse += earned;
  persist();
  el.earned.innerHTML = `Kesene <b>+${fmt(earned)} tüy</b> eklendi${missionsDone ? ` (${missionsDone} görevden +${missionFeathers})` : ''} · toplam <b>${fmt(save.purse)}</b>${race}`;
  updatePurse(); showProg();
  el.menuBest.textContent = fmt(best);
  el.hud.hidden = true; el.btnPause.hidden = true; el.hudBestWrap.hidden = true; el.btnMute.hidden = MOBILE;
  el.over.hidden = false;
}
function toMenu() {
  state = 'menu';
  resumeT = 0; $('countdown').hidden = true;
  ghostRun = null;
  obstacles.length = 0; items.length = 0; popups.length = 0;
  bird.dead = false; bird.grounded = false; bird.spin = 0; bird.ang = 0; bird.inv = 0; glider = null; chute = null;
  placeCliff(0.35);
  for (const n of SKILL_NAMES) { if (sk[n].t > 0) endSkill(n); sk[n].t = 0; sk[n].cd = 0; }
  hideScreens();
  el.hud.hidden = true; el.btnPause.hidden = true; el.hudBestWrap.hidden = true; el.btnMute.hidden = true;
  el.menuBest.textContent = fmt(best);
  persist(); showProg();
  el.menu.hidden = false;
}
function pauseGame() {
  if (state !== 'play') return;
  state = 'paused';
  keys.up = keys.down = keys.left = keys.right = false;
  el.pause.hidden = false;
}
function resumeGame() {
  if (state !== 'paused' || layoutEdit) return;
  el.pause.hidden = true;
  // on a phone the thumb needs a moment to get back into place: count down before the air moves again
  if (touchMode) { resumeT = 2.1; $('countdown').hidden = false; return; }
  state = 'play';
  if (document.activeElement && document.activeElement.blur) document.activeElement.blur();
}

/* =========================================================
   Input
   ========================================================= */
const KEYMAP = { ArrowUp: 'up', ArrowDown: 'down', ArrowLeft: 'left', ArrowRight: 'right' };
window.addEventListener('keydown', (e) => {
  if (e.metaKey || e.ctrlKey || e.altKey) return;
  Sound.init();
  const k = e.key, code = e.code, L = k && k.length === 1 ? k.toLowerCase() : '';
  if (KEYMAP[k]) { keys[KEYMAP[k]] = true; touchMode = false; e.preventDefault(); return; }
  const is = (ch, c) => L === ch || code === c;
  if (shopOpen) {
    if (k === 'Escape') { e.preventDefault(); closeShop(); }
    return;
  }
  if (k === ' ' || k === 'Enter') {
    e.preventDefault();
    if (e.repeat) return;
    if (state === 'menu') startGame();
    else if (state === 'over' && time - overAt > 0.6) startGame();
    else if (state === 'paused') resumeGame();
    return;
  }
  if (k === 'Escape' || is('p', 'KeyP')) { e.preventDefault(); if (state === 'play') pauseGame(); else if (state === 'paused') resumeGame(); return; }
  if (is('m', 'KeyM')) { Sound.toggleMute(); syncMute(); return; }
  if (e.repeat) return;
  if (is('s', 'KeyS')) { e.preventDefault(); useSkill('dash'); }
  else if (is('d', 'KeyD')) { e.preventDefault(); useSkill('shield'); }
  else if (is('f', 'KeyF')) { e.preventDefault(); useSkill('slow'); }
});
window.addEventListener('keyup', (e) => { if (KEYMAP[e.key]) { keys[KEYMAP[e.key]] = false; e.preventDefault(); } });
const stopCountdown = () => { if (resumeT > 0) { resumeT = 0; $('countdown').hidden = true; el.pause.hidden = false; } };
window.addEventListener('blur', () => { stopCountdown(); keys.up = keys.down = keys.left = keys.right = false; touch.up = touch.down = false; pointers.clear(); if (state === 'play') pauseGame(); });
// iOS opens audio only from a finished tap (touchend / click), not from every pointerdown: unlock on those too
for (const ev of ['touchend', 'click', 'keydown']) window.addEventListener(ev, () => { if (!document.hidden) Sound.init(); }, { capture: true, passive: true });
document.addEventListener('visibilitychange', () => {
  if (document.hidden) { Sound.suspend(); stopCountdown(); if (state === 'play') pauseGame(); }
  else Sound.resume();
});
function refreshTouch() {
  touch.up = false; touch.down = false;
  for (const v of pointers.values()) { if (v === 'up') touch.up = true; else touch.down = true; }
}
// Mouse: press the upper half of the view to climb, the lower half to dive.
// Touch: the two flight buttons on the right; with neither held the glider sinks gently on its own.
cvs.addEventListener('pointerdown', (e) => {
  Sound.init();
  if (state !== 'play' || e.pointerType !== 'mouse') return;
  pointers.set(e.pointerId, e.clientY < window.innerHeight / 2 ? 'up' : 'down');
  refreshTouch();
});
const release = (e) => { pointers.delete(e.pointerId); refreshTouch(); };
// one pad holds both buttons, so a thumb can slide from climb to dive without lifting
const flyPad = $('fly'), flyUp = $('flyUp'), flyDown = $('flyDown');
function flyDir(e) {
  const r = flyPad.getBoundingClientRect();
  return e.clientY < r.top + r.height / 2 ? 'up' : 'down';
}
function flyShow() {
  let u = false, d = false;
  for (const v of pointers.values()) { if (v === 'up') u = true; else d = true; }
  flyUp.classList.toggle('on', u); flyDown.classList.toggle('on', d);
}
flyPad.addEventListener('pointerdown', (e) => {
  e.preventDefault(); e.stopPropagation();
  Sound.init();
  if (state !== 'play') return;
  touchMode = true;
  try { flyPad.setPointerCapture(e.pointerId); } catch (err) { /* older browsers */ }
  pointers.set(e.pointerId, flyDir(e));
  refreshTouch(); flyShow();
});
flyPad.addEventListener('pointermove', (e) => {
  if (!pointers.has(e.pointerId)) return;
  const d = flyDir(e);
  if (pointers.get(e.pointerId) !== d) { pointers.set(e.pointerId, d); refreshTouch(); flyShow(); }
});
for (const type of ['pointerup', 'pointercancel', 'lostpointercapture']) {
  flyPad.addEventListener(type, (e) => { release(e); flyShow(); });
}
flyPad.addEventListener('touchstart', (e) => e.preventDefault(), { passive: false });
cvs.addEventListener('touchstart', (e) => e.preventDefault(), { passive: false });
cvs.addEventListener('pointerup', release);
cvs.addEventListener('pointercancel', release);
cvs.addEventListener('pointerleave', release);
cvs.addEventListener('contextmenu', (e) => e.preventDefault());
document.addEventListener('selectstart', (e) => e.preventDefault());
document.addEventListener('gesturestart', (e) => e.preventDefault());
document.addEventListener('dblclick', (e) => e.preventDefault());

$('btnStart').addEventListener('click', startGame);
/* ---- workshop ---- */
const shopEl = $('shop'), shopGrid = $('shopGrid'), shopUps = $('shopUps'), shopNote = $('shopNote');
const prevC = $('shopPreview'), prevCtx = prevC.getContext('2d');
let shopTab = 'sail', shopOpen = false, shopSel = null;
function updatePurse() { $('menuPurse').textContent = fmt(save.purse); $('shopPurse').textContent = fmt(save.purse); }
function svgBg(svg, bg) {
  return `url("data:image/svg+xml,${encodeURIComponent(svg)}") center/contain no-repeat, ${bg}`;
}
function swatch(k, it) {
  if (k === 'sail') {
    const bg = `linear-gradient(135deg, rgba(15,20,34,0.82), rgba(28,36,56,0.55))`;
    const shapes = {
      klasik: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 120 36"><path d="M60 4 L112 28 Q84 24 60 29 Q36 24 8 28 Z" fill="${it.near[0]}" stroke="${it.sn[0]}" stroke-width="2.2"/><path d="M60 7 L103 26 L94 26 L60 11 L26 26 L17 26 Z" fill="${it.sn[1]}"/><line x1="60" y1="4" x2="60" y2="31" stroke="#3b4252" stroke-width="2"/></svg>`,
      gunbatimi: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 120 36"><path d="M60 6 C80 2 98 12 114 27 Q92 18 76 31 L60 21 L44 31 Q28 18 6 27 C22 12 40 2 60 6 Z" fill="${it.near[0]}" stroke="${it.sn[0]}" stroke-width="2"/><path d="M60 8 C78 5 94 13 108 25 Q91 18 76 28 L60 18 L44 28 Q29 18 12 25 C26 13 42 5 60 8 Z" fill="${it.sn[1]}" opacity="0.65"/><circle cx="60" cy="14" r="4" fill="${it.sn[2]}"/></svg>`,
      buzul: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 120 36"><polygon points="60,3 88,9 115,26 95,22 86,30 71,22 60,33 49,22 34,30 25,22 5,26 32,9" fill="${it.near[0]}" stroke="${it.sn[0]}" stroke-width="1.8"/><polygon points="60,5 86,11 71,21 60,31 49,21 34,11" fill="${it.sn[1]}" opacity="0.55"/><polygon points="60,8 66,18 60,27 54,18" fill="${it.sn[2]}"/></svg>`,
      orman: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 120 36"><path d="M60 5 Q90 6 113 24 L101 27 L104 22 L89 28 L91 23 L75 29 L60 33 L45 29 L29 23 L31 28 L16 22 L19 27 L7 24 Q30 6 60 5 Z" fill="${it.near[1]}" stroke="${it.sn[0]}" stroke-width="1.8"/><path d="M60 6 L60 32 M60 13 L92 22 M60 13 L28 22 M60 19 L78 26 M60 19 L42 26" stroke="${it.sn[2]}" stroke-width="1.5" stroke-linecap="round"/></svg>`,
      gece: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 120 36"><path d="M60 3 Q94 5 114 31 Q88 15 60 18 Q32 15 6 31 Q26 5 60 3 Z" fill="${it.near[0]}" stroke="${it.sn[0]}" stroke-width="1.8"/><circle cx="60" cy="11" r="3.5" fill="${it.sn[1]}"/><circle cx="62" cy="10" r="2.8" fill="${it.near[0]}"/><circle cx="38" cy="14" r="1.4" fill="${it.sn[2]}"/><circle cx="82" cy="14" r="1.4" fill="${it.sn[2]}"/><circle cx="24" cy="20" r="1.2" fill="#fff"/><circle cx="96" cy="20" r="1.2" fill="#fff"/></svg>`,
      altin: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 120 36"><path d="M60 2 L64 7 Q92 6 115 24 L103 26 L106 29 L90 27 L92 31 L74 26 L66 34 L60 27 L54 34 L46 26 L28 31 L30 27 L14 29 L17 26 L5 24 Q28 6 56 7 Z" fill="${it.near[0]}" stroke="${it.sn[0]}" stroke-width="1.8"/><path d="M60 7 Q84 9 102 22 L84 22 L60 14 L36 22 L18 22 Q36 9 60 7 Z" fill="${it.near[1]}"/></svg>`,
    };
    return svgBg(shapes[it.id] || shapes.klasik, bg);
  }
  if (k === 'scarf') return `linear-gradient(90deg, ${it.c[0]}, ${it.c[1]})`;
  const bg = `linear-gradient(135deg, ${it.suit[2]} 0%, ${it.suit[0]} 55%, rgba(20,26,44,0.9) 100%)`;
  const portraits = {
    ruzgar: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 36"><path d="M36 28 Q52 22 68 28 L72 36 L32 36 Z" fill="#8c5a32"/><circle cx="46" cy="28" r="3.5" fill="#f0e6d2"/><circle cx="58" cy="28" r="3.5" fill="#f0e6d2"/><path d="M36 15 L22 12 L27 17 L20 20 L35 21 Z" fill="#5c3620"/><circle cx="52" cy="19" r="9.5" fill="#e4b892"/><path d="M41 18 A11 11 0 0 1 63 16 L54 19 L49 26 L44 23 Z" fill="#d8d2c4"/><path d="M47 18 L52 18 L50 26 L45 24 Z" fill="#6e472b"/><path d="M58 14 L65 12 L62 17 Z" fill="#5c3620"/><circle cx="58" cy="15" r="3.6" fill="#a7dcec" stroke="#c99a4a" stroke-width="1.5"/></svg>`,
    atmaca: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 36"><path d="M36 28 Q54 23 70 28 L74 36 L32 36 Z" fill="#a62836" stroke="#f0c050" stroke-width="1.4"/><path d="M48 9 C32 7 18 14 8 11 C15 18 24 22 10 26 C24 28 36 25 49 24 Z" fill="#c83828"/><path d="M46 13 C32 12 20 18 13 17 C22 22 33 22 46 21 Z" fill="#ff734f"/><circle cx="54" cy="19" r="9.2" fill="#f2c4a2"/><path d="M44 14 Q54 9 63 14 L61 17 Q53 13 44 17 Z" fill="#a82420"/><path d="M55 18 L63 16" stroke="#ffbe42" stroke-width="2.6" stroke-linecap="round"/><circle cx="58" cy="22" r="2" fill="#eb696e" opacity="0.45"/></svg>`,
    bulut: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 36"><path d="M35 28 Q54 23 71 28 L75 36 L31 36 Z" fill="#5896c2"/><circle cx="45" cy="28" r="3.8" fill="#fff"/><circle cx="54" cy="29" r="3.8" fill="#fff"/><circle cx="63" cy="28" r="3.8" fill="#fff"/><g fill="#f0c452" stroke="#b88628" stroke-width="1"><ellipse cx="41" cy="20" rx="4.5" ry="2.8" transform="rotate(-18 41 20)"/><ellipse cx="34" cy="22" rx="4.5" ry="2.8" transform="rotate(18 34 22)"/><ellipse cx="27" cy="23" rx="4.2" ry="2.6" transform="rotate(-18 27 23)"/><ellipse cx="20" cy="24" rx="3.8" ry="2.4" transform="rotate(18 20 24)"/><path d="M16 24 L10 22 L11 27 Z" fill="#f0c452"/></g><circle cx="16" cy="24" r="2" fill="#4fd1c5"/><circle cx="54" cy="19" r="9.2" fill="#f5cbb0"/><path d="M43 18 A11 10 0 0 1 64 16 Z" fill="#dce5f0"/><circle cx="48" cy="17" r="3.5" fill="#fff"/><circle cx="55" cy="14" r="3.8" fill="#fff"/><circle cx="62" cy="15" r="3.2" fill="#fff"/><circle cx="59" cy="19" r="3" fill="#ff9ec7" stroke="#d4a24e" stroke-width="1.2"/></svg>`,
    dogan: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 36"><path d="M34 27 L54 24 L72 27 L76 36 L30 36 Z" fill="#202736" stroke="#66f0ff" stroke-width="1.3"/><path d="M42 14 C28 11 18 14 8 18 C20 18 29 19 14 24 C26 23 35 20 43 18 Z" fill="#181e2b"/><rect x="40" y="13" width="3.5" height="5" rx="1.5" fill="#ff6e4a"/><circle cx="54" cy="19" r="9.2" fill="#dfb08a"/><path d="M43 19 A11 11 0 0 1 64 16 L56 21 L44 21 Z" fill="#23324d"/><path d="M60 9 Q48 5 38 11 Q47 12 56 12 Z" fill="#ff6e4a"/><polygon points="54,17 65,16 62,20 54,20" fill="#66f0ff"/></svg>`,
    yildiz: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 36"><path d="M35 28 Q54 23 71 28 L75 36 L31 36 Z" fill="#5430a0" stroke="#ffd86b" stroke-width="1.5"/><path d="M49 9 C33 6 20 14 9 13 C17 19 22 25 11 28 C25 30 38 25 50 24 Z" fill="#432878"/><path d="M47 13 C34 12 23 19 15 19 C24 23 35 23 47 21 Z" fill="#845ee0"/><circle cx="24" cy="16" r="1.6" fill="#ffe47a"/><circle cx="34" cy="22" r="1.5" fill="#ffe47a"/><circle cx="54" cy="19" r="9.2" fill="#f2c8a8"/><polygon points="48,11 53,6 56,11 61,7 60,13 48,13" fill="#f5c84c"/><circle cx="59" cy="19" r="2.6" fill="#d4a5ff"/><circle cx="57" cy="22" r="2" fill="#eb7898" opacity="0.45"/></svg>`,
  };
  return svgBg(portraits[it.id] || portraits.ruzgar, bg);
}
function note(t) { shopNote.textContent = t; }
function renderShop() {
  document.querySelectorAll('.tab').forEach((t) => t.setAttribute('aria-selected', String(t.dataset.tab === shopTab)));
  const ups = shopTab === 'up';
  shopGrid.hidden = ups; shopUps.hidden = !ups;
  if (ups) {
    shopUps.innerHTML = '';
    for (const u of UPGRADES) {
      const l = save.up[u.id], cost = UP_COST[l], base = SK_BASE[u.id];
      const row = document.createElement('div');
      row.className = 'up';
      const dur = (base.dur * (1 + 0.15 * l)).toFixed(1), cd = (base.cd * (1 - 0.1 * l)).toFixed(1);
      row.innerHTML = `<div class="nm"><span class="kbd">${u.key}</span> ${u.name}<span class="pips">${'<i class="f"></i>'.repeat(l)}${'<i></i>'.repeat(UP_MAX - l)}</span></div>
        <div class="ds">Süre ${dur} sn · bekleme ${cd} sn${l < UP_MAX ? ' → sonraki seviye: süre +%15, bekleme −%10' : ' · en üst seviye'}</div>`;
      const b = document.createElement('button');
      b.className = 'buy'; b.type = 'button';
      b.textContent = l >= UP_MAX ? 'Tamamlandı' : `${fmt(cost)} tüy`;
      b.disabled = l >= UP_MAX;
      b.addEventListener('click', () => {
        if (save.up[u.id] >= UP_MAX) return;
        const c = UP_COST[save.up[u.id]];
        if (save.purse < c) { note(`Bu yükseltme için ${fmt(c - save.purse)} tüy daha gerekiyor.`); Sound.deny(); return; }
        save.purse -= c; save.up[u.id]++; persist(); applyUpgrades(); updatePurse();
        note(`${u.name} seviye ${save.up[u.id]} oldu.`); Sound.ring();
        renderShop();
      });
      row.appendChild(b);
      shopUps.appendChild(row);
    }
    if (MOBILE) { applyLook(); renderShopDetail(); }
    return;
  }
  shopGrid.innerHTML = '';
  if (MOBILE && !CAT[shopTab].includes(shopSel)) shopSel = pick(shopTab);
  for (const it of CAT[shopTab]) {
    const owned = save.owned[shopTab].includes(it.id), on = save.equip[shopTab] === it.id;
    const b = document.createElement('button');
    b.type = 'button';
    b.className = 'item' + (on ? ' on' : '') + (owned ? '' : ' locked');
    b.innerHTML = `<span class="sw"></span><span class="nm">${it.name}</span>${it.stats ? `<span class="st">${it.stats}</span>` : ''}${it.ds ? `<span class="ds">${it.ds}</span>` : ''}<span class="pr${owned ? ' own' : ''}">${on ? 'Kullanılıyor' : owned ? 'Seç' : fmt(it.price) + ' tüy'}</span>`;
    // set as a property: the swatch's url("…") would end a double-quoted style attribute early
    b.querySelector('.sw').style.background = swatch(shopTab, it);
    if (MOBILE) {
      // touch has no hover: a tap picks the item and shows it; buying or wearing it is the button beside the preview
      if (shopSel === it) b.classList.add('sel');
      b.addEventListener('click', () => { shopSel = it; renderShop(); });
    } else {
      b.addEventListener('pointerenter', () => applyLook(shopTab, it));
      b.addEventListener('focus', () => applyLook(shopTab, it));
      b.addEventListener('pointerleave', () => applyLook());
      b.addEventListener('blur', () => applyLook());
      b.addEventListener('click', () => buyOrEquip(it, b));
    }
    shopGrid.appendChild(b);
  }
  if (MOBILE) { applyLook(shopTab, shopSel); renderShopDetail(); }
}
function buyOrEquip(it, b) {
  if (!save.owned[shopTab].includes(it.id)) {
    if (save.purse < it.price) {
      note(`${it.name} için ${fmt(it.price - save.purse)} tüy daha gerekiyor.`);
      b.classList.remove('deny'); void b.offsetWidth; b.classList.add('deny'); Sound.deny();
      return;
    }
    save.purse -= it.price; save.owned[shopTab].push(it.id);
    note(`${it.name} senin oldu.`); Sound.orb();
  } else note(`${it.name} seçildi.`);
  save.equip[shopTab] = it.id;
  persist(); applyLook(); updatePurse(); renderShop();
}
// phones: the picked item's name, description and its buy / wear button, under the preview
function renderShopDetail() {
  const d = $('shopDetail'), it = shopSel;
  d.hidden = shopTab === 'up' || !it;
  if (d.hidden) return;
  const owned = save.owned[shopTab].includes(it.id), on = save.equip[shopTab] === it.id, btn = $('sdBuy');
  $('sdName').textContent = it.name;
  $('sdStats').textContent = it.stats || '';
  $('sdDesc').textContent = it.ds || '';
  btn.textContent = on ? 'Kuşanıldı' : owned ? 'Kuşan' : `${fmt(it.price)} tüy · Satın al`;
  btn.disabled = on;
  btn.classList.toggle('poor', !owned && save.purse < it.price);
}
$('sdBuy').addEventListener('click', () => { if (shopSel) buyOrEquip(shopSel, $('sdBuy')); });
function openShop() {
  if (state !== 'menu') return;
  Sound.init();
  shopOpen = true; el.menu.hidden = true; shopEl.hidden = false;
  note('Uçuşlarda topladığın tüyler buraya birikir.');
  updatePurse();
  renderShop();
}
function closeShop() {
  if (!shopOpen) return;
  applyLook();
  shopOpen = false; shopEl.hidden = true; el.menu.hidden = false;
}
// live preview of the flyer in the workshop
function drawShopPreview() {
  if (!shopOpen) return;
  const isPilot = shopTab === 'pilot';
  const isGear = shopTab === 'scarf';
  const zm = isPilot ? 5.5 : isGear ? 4.8 : 3.35;
  const cx = isPilot ? -2 : isGear ? -5 : -3;
  const cy = isPilot ? -1.5 : isGear ? -1 : -18;
  const k = Math.sin(time * 1.2) * 0.05;
  const bob = Math.sin(time * 1.6) * 5;
  paintBird('preview', (c, w) => {
    c.translate(w / 2, w / 2 + bob);
    c.rotate(k);
    c.scale(zm, zm);
    c.translate(-cx, -cy);
  });
}
document.querySelectorAll('.tab').forEach((t) => t.addEventListener('click', () => { shopTab = t.dataset.tab; renderShop(); }));
$('btnShop').addEventListener('click', openShop);
$('btnShopClose').addEventListener('click', closeShop);
updatePurse();
$('btnRetry').addEventListener('click', startGame);
$('btnMenu').addEventListener('click', toMenu);
$('btnQuit').addEventListener('click', () => { el.pause.hidden = true; toMenu(); });
$('btnResume').addEventListener('click', resumeGame);
el.btnPause.addEventListener('click', () => { if (state === 'play') pauseGame(); else resumeGame(); });
// sound: the corner button on the menu, and the settings inside the pause card
function syncMute() {
  el.btnMute.classList.toggle('muted', Sound.muted);
  const b = $('btnMuteAll');
  b.textContent = Sound.muted ? 'Kapalı' : 'Açık';
  b.setAttribute('aria-pressed', String(!Sound.muted));
}
el.btnMute.addEventListener('click', () => { Sound.init(); Sound.toggleMute(); syncMute(); el.btnMute.blur(); });
$('btnMuteAll').addEventListener('click', () => { Sound.init(); Sound.toggleMute(); syncMute(); });
for (const [id, kind] of [['volMusic', 'music'], ['volSfx', 'sfx']]) {
  const inp = $(id), out = $(id + 'V');
  const show = () => { out.textContent = inp.value + '%'; };
  inp.value = String(Math.round(Sound.volume[kind] * 100)); show();
  inp.addEventListener('input', () => { Sound.init(); Sound.setVolume(kind, inp.value / 100); show(); });
  // a short chime on release, so the new effects level can be heard
  if (kind === 'sfx') inp.addEventListener('change', () => Sound.feather(3));
}
syncMute();
window.addEventListener('resize', resize);

/* ---- button layout: the skill column and the flight pad can be dragged and resized ---- */
const layout = { skills: { x: 0, y: 0 }, fly: { x: 0, y: 0 }, scale: 1 };
try {
  const l = JSON.parse(localStorage.getItem('suzulus-layout') || 'null');
  if (l) {
    for (const k of ['skills', 'fly']) if (l[k] && Number.isFinite(l[k].x) && Number.isFinite(l[k].y)) layout[k] = { x: l[k].x, y: l[k].y };
    if (Number.isFinite(l.scale)) layout.scale = clamp(l.scale, 0.7, 1.5);
  }
} catch (e) { /* default places */ }
const layoutEls = { skills: $('skills'), fly: $('fly') };
const sizeInp = $('btnSize'), sizeOut = $('btnSizeV');
let layoutEdit = false;
function saveLayout() { try { localStorage.setItem('suzulus-layout', JSON.stringify(layout)); } catch (e) { /* ignore */ } }
function syncSizeSlider() {
  if (!sizeInp) return;
  const pct = Math.round(clamp(layout.scale || 1, 0.7, 1.5) * 100);
  sizeInp.value = String(pct);
  const txt = pct + '%';
  if (sizeOut) sizeOut.textContent = txt;
  sizeInp.setAttribute('aria-valuetext', txt);
  sizeInp.style.setProperty('--attr-min', sizeInp.min || 70);
  sizeInp.style.setProperty('--attr-max', sizeInp.max || 150);
  sizeInp.style.setProperty('--control-value', sizeInp.value);
}
// offsets are measured from each group's home corner and kept inside the screen, whatever its size or rotation
function applyLayout() {
  const s = clamp(layout.scale || 1, 0.7, 1.5);
  for (const k of ['skills', 'fly']) {
    const n = layoutEls[k], o = layout[k];
    n.style.scale = String(s);
    n.style.translate = '0px 0px';
    const r = n.getBoundingClientRect();
    if (r.width) {
      o.x = clamp(o.x, 4 - r.left, Math.max(4 - r.left, window.innerWidth - r.right - 4));
      o.y = clamp(o.y, 4 - r.top, Math.max(4 - r.top, window.innerHeight - r.bottom - 4));
    }
    n.style.translate = `${Math.round(o.x)}px ${Math.round(o.y)}px`;
  }
}
syncSizeSlider();
if (sizeInp) {
  sizeInp.addEventListener('input', () => {
    layout.scale = clamp(Number(sizeInp.value) / 100, 0.7, 1.5);
    syncSizeSlider();
    applyLayout();
    saveLayout();
  });
}
for (const k of ['skills', 'fly']) {
  const n = layoutEls[k];
  let drag = null;
  // capture phase: while arranging, a press on a button moves its group instead of using it
  n.addEventListener('pointerdown', (e) => {
    if (!layoutEdit) return;
    e.preventDefault(); e.stopImmediatePropagation();
    drag = { id: e.pointerId, sx: e.clientX, sy: e.clientY, ox: layout[k].x, oy: layout[k].y };
    try { n.setPointerCapture(e.pointerId); } catch (err) { /* older browsers */ }
  }, true);
  n.addEventListener('pointermove', (e) => {
    if (!drag || e.pointerId !== drag.id) return;
    e.stopImmediatePropagation();
    layout[k].x = drag.ox + e.clientX - drag.sx; layout[k].y = drag.oy + e.clientY - drag.sy;
    applyLayout();
  }, true);
  const end = (e) => { if (drag && e.pointerId === drag.id) { drag = null; saveLayout(); } };
  n.addEventListener('pointerup', end, true);
  n.addEventListener('pointercancel', end, true);
}
function setLayoutEdit(on) {
  layoutEdit = on;
  document.documentElement.classList.toggle('layout-edit', on);
  $('layoutBar').hidden = !on;
  el.pause.hidden = on || state !== 'paused';
  if (on) { syncSizeSlider(); applyLayout(); }
}
$('btnLayout').addEventListener('click', () => setLayoutEdit(true));
$('btnLayoutDone').addEventListener('click', () => setLayoutEdit(false));
$('btnLayoutReset').addEventListener('click', () => { layout.skills = { x: 0, y: 0 }; layout.fly = { x: 0, y: 0 }; layout.scale = 1; syncSizeSlider(); applyLayout(); saveLayout(); });
window.addEventListener('resize', applyLayout);
