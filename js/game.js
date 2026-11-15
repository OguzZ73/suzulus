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
  if (state !== 'play' || watching) return;
  const s = sk[name], def = SK[name];
  if (s.t > 0 || s.cd > 0) {
    const b = skillEls[name];
    b.classList.remove('deny'); void b.offsetWidth; b.classList.add('deny');
    Sound.deny();
    return;
  }
  s.t = def.dur;
  s.cd = def.dur + def.cd;
  if (name === 'shield') shieldHits = perk('shield1a') ? 2 : 1;
  if (name === 'slow') slowExt = 0;
  quest('skill');
  if (name === 'dash') { Sound.dash(); sparks(bird.x - 10, bird.y, 14, 'gold', 260); shock(bird.x, bird.y, 'rgba(255,214,130,', 70); }
  else if (name === 'shield') { Sound.shield(); shock(bird.x, bird.y, 'rgba(150,235,255,', 50); }
  else if (name === 'slow') { Sound.slow(true); shock(bird.x, bird.y, 'rgba(200,185,255,', 90); }
}
function endSkill(name) {
  if (name === 'slow') Sound.slow(false);
}
const shieldOn = () => sk.shield.t > 0;

// hawks, balloons and kites can be smashed: by a piercing dash or a shield's shockwave
const SMASHABLE = ['hawk', 'balloon', 'kite'];
function smash(o) {
  o.dead = true;
  if (o.type === 'hawk') featherBurst(o.x, o.y, 10);
  else if (o.type === 'balloon') { featherBurst(o.x, o.oy, 14); sparks(o.x, o.oy + o.R * 0.7, 16, 'gold', 260); chunks(o.x, o.oy + o.R * 1.2, 8, '#8c5e38'); }
  else if (o.type === 'kite') { featherBurst(o.x, o.oy, 12); sparks(o.x, o.oy, 14, 'gold', 220); chunks(o.x, o.oy, 10, '#c84a3a'); }
  else if (o.type !== 'storm') chunks(bird.x + 10, bird.y, 14, css(obsFillC));
}
// a crash with no shield up: the "last chance" branch saves one per flight
function useLastChance() {
  if (!perk('shield2b') || lastChanceUsed) return false;
  lastChanceUsed = true; shieldHits = 1;
  popup(tx('Son şans!', 'Last chance!'), '#bdf2ff', true);
  flash = Math.max(flash, RM ? 0.1 : 0.3);
  return true;
}
function breakShield(o, free) {
  buzz(35);
  bird.inv = 1;
  Sound.shieldBreak();
  shake = Math.max(shake, RM ? 0 : 7);
  shock(bird.x, bird.y, 'rgba(150,235,255,', 80);
  sparks(bird.x, bird.y, 18, 'cyan', 300);
  if (o) smash(o);
  // a double shield only cracks the first time
  if (!free && shieldHits > 1) { shieldHits--; popup(tx('Kalkan çatladı', 'Shield cracked'), '#bdf2ff'); return; }
  if (!free) { sk.shield.t = 0; sk.shield.cd = SK.shield.cd * (perk('shield1b') ? 0.5 : 1); }
  if (perk('shield2a')) {
    shock(bird.x, bird.y, 'rgba(150,235,255,', 260);
    for (const q of obstacles) if (!q.dead && SMASHABLE.includes(q.type) && Math.hypot(q.x - bird.x, (q.oy ?? q.y) - bird.y) < 300) smash(q);
  }
  popup(tx('Kalkan seni korudu', 'The shield saved you'), '#bdf2ff');
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
    const gold = sk.slow.t > 0 && perk('slow1a');
    featherCount += gold ? 2 : 1; quest('feather');
    if (sk.slow.t > 0 && perk('slow2a') && slowExt < 3) { slowExt += 0.3; sk.slow.t += 0.3; sk.slow.cd += 0.3; }
    featherChain = gtime - lastFeatherT < 1.1 ? featherChain + 1 : 0;
    lastFeatherT = gtime;
    addScore(10 * mult() * (gold ? 2 : 1));
    sparks(it.x, it.y, 6, 'gold', 140, 2.5);
    Sound.feather(featherChain); buzz(6);
  } else if (it.type === 'orb') {
    for (const n of SKILL_NAMES) if (sk[n].t <= 0) sk[n].cd = 0;
    const pts = 250 * mult();
    addScore(pts);
    popup(tx(`Ruh küresi: yetenekler yenilendi  +${pts}`, `Spirit orb: skills recharged  +${pts}`), '#9fdcff', true);
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
    popup(tx(`Yavaşlatma halkası  +${pts}`, `Slowing ring  +${pts}`), '#cfe9ff');
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
  popup(perfect ? tx(`Tam isabet  +${pts}`, `Bullseye  +${pts}`) : tx(`Rüzgar halkası  +${pts}`, `Wind ring  +${pts}`), perfect ? '#ffe08a' : '#fff1c9', perfect);
  sparks(it.x, it.y, 16, 'gold', 220);
  Sound.ring();
}
function nearMiss() {
  buzz(18);
  nearCount++; quest('near');
  bumpCombo();
  const pts = 60 * mult();
  addScore(pts);
  popup(tx(`Kıl payı  +${pts}`, `Near miss  +${pts}`), '#ffffff');
  Sound.near();
}

/* =========================================================
   Ghost race and skimming
   ========================================================= */
function updateGhost(gdt, dt) {
  runT += gdt;
  if (rec) while (runT >= recNext && rec.length < 30000) { rec.push(Math.round(bird.x - startX), Math.round(bird.y), Math.round(bird.ang * 100)); recNext += GH_DT; }
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
      popup(tx(`Hayaleti geride bıraktın  +${pts} · +20 tüy`, `You outlasted the ghost  +${pts} · +20 feathers`), '#bdf2ff', true);
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
    popup(tx(`Hayaleti geçtin  +${pts}`, `You passed the ghost  +${pts}`), '#bdf2ff');
    Sound.near();
  }
}
// flying within a wingspan of the ground: points tick up, the combo stays alive, dust kicks up behind
function endSkim() {
  if (skimOn && skimPts > 0) popup(tx(`Yer sıyırma  +${skimPts}`, `Ground skim  +${skimPts}`), '#e8f6ff');
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
let settingsOpen = false;
function hideScreens() { settingsOpen = false; el.menu.hidden = true; el.pause.hidden = true; el.over.hidden = true; $('shop').hidden = true; const intro = $('intro'); if (intro) { intro.removeAttribute('data-closing'); intro.hidden = true; } }
function startGame() {
  Sound.init();
  watching = false; $('watchTag').hidden = true;
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
  reviveUsed = false; doubleUsed = false; paidEarned = 0; lastEarned = 0;
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
  score = 0; dist = 0; startX = bird.x; featherCount = 0; ringCount = 0; thermalCount = 0; combo = 0; comboTimer = 0; maxCombo = 1; shieldHits = 1; lastChanceUsed = false; slowExt = 0;
  applyUpgrades();
  skimT = 0; skimAcc = 0; skimPts = 0; skimOn = false; skimTotal = 0; nearCount = 0; perfectCount = 0;
  shuffleBiomes(); resetBiome();
  runLvl = lvlAtStart = levelInfo().l; questM = 0; questDone.length = 0;
  for (const q of save.quests) { q.wait = false; if (QUESTS[q.k].one) q.p = 0; }
  el.hudLvl.textContent = String(runLvl);
  if (!jump) bird.speed = Math.max(bird.speed, startSpeed() * 0.87);
  rec = []; recNext = 0; runT = 0; ghostFeathers = 0;
  ghostRun = (save.ghostOn && ghost) ? { x: bird.x, y: bird.y, ang: 0, a: 0, lead: 0, behind: false, cool: 3, done: false } : null;
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
  if (typeof last === 'number') last = performance.now();
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
  el.tip.textContent = tx('İpucu: ', 'Tip: ') + TIPS[(Math.random() * TIPS.length) | 0];
  // feathers from this flight go into the purse; every 10 thermals caught is worth a bonus
  const earned = featherCount + Math.floor(dist / 10 / 250) + thermalCount * 2 + missionFeathers + ghostFeathers;
  // how the race against the ghost ended, then the better flight becomes the next ghost
  let race = '';
  if (ghostRun) race = ghostRun.done ? tx('<br>Hayalet yarışı: en iyi uçuşundan daha uzun uçtun.', '<br>Ghost race: you flew farther than your best flight.')
    : EN ? `<br>Ghost race: you were <b>${fmt(Math.abs(ghostRun.lead) / 10)} m</b> ${ghostRun.lead >= 0 ? 'ahead of' : 'behind'} the ghost.`
    : `<br>Hayalet yarışı: hayaletin <b>${fmt(Math.abs(ghostRun.lead) / 10)} m</b> ${ghostRun.lead >= 0 ? 'önündeydin' : 'gerisindeydin'}.`;
  if (rec && rec.length >= 30 && (!ghost || final >= ghost.score)) {
    ghost = { d: rec.slice(), score: final };
    try { localStorage.setItem('suzulus-ghost', JSON.stringify(ghost)); } catch (e) { /* too large or blocked: the ghost lasts for this session only */ }
  }
  const deltaEarned = Math.max(0, earned - paidEarned);
  save.purse += deltaEarned;
  paidEarned = earned;
  lastEarned = earned;
  lastRaceHTML = race;
  persist();
  renderOverEarned();
  updatePurse(); showProg(); updateOverAdBtns();
  el.menuBest.textContent = fmt(best);
  el.hud.hidden = true; el.btnPause.hidden = true; el.hudBestWrap.hidden = true; el.btnMute.hidden = MOBILE;
  el.over.hidden = false;
}
// watch mode: the same flight from the cliff, but empty skies, an autopilot and no way to fall
function startWatch() {
  startGame();
  watching = true;
  obstacles.length = 0; items.length = 0;
  ghostRun = null; rec = null;
  el.hud.hidden = true; el.hudBestWrap.hidden = true;
  const tag = $('watchTag'); tag.hidden = false;
  tag.classList.remove('fade'); void tag.offsetWidth; tag.classList.add('fade');
}
function toMenu() {
  state = 'menu';
  watching = false; $('watchTag').hidden = true;
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
function openSettings() {
  if (state !== 'menu') return;
  Sound.init();
  settingsOpen = true;
  $('pauseEyebrow').textContent = tx('Tercihler', 'Preferences');
  $('pauseTitle').textContent = tx('Ayarlar', 'Settings');
  $('btnResume').textContent = tx('Kapat', 'Close');
  $('btnQuit').hidden = true;
  el.menu.hidden = true;
  el.pause.hidden = false;
}
function closeSettings() {
  if (!settingsOpen || layoutEdit) return;
  settingsOpen = false;
  el.pause.hidden = true;
  if (state === 'menu') el.menu.hidden = false;
}
function pauseGame() {
  if (state !== 'play') return;
  settingsOpen = false;
  state = 'paused';
  keys.up = keys.down = keys.left = keys.right = false;
  $('pauseEyebrow').textContent = tx('Mola', 'Break');
  $('pauseTitle').textContent = tx('Oyun duraklatıldı', 'Game paused');
  $('btnResume').innerHTML = tx('Devam et', 'Resume') + ' <span class="kbd dark">P</span>';
  $('btnQuit').hidden = false;
  el.pause.hidden = false;
}
function resumeGame() {
  if (settingsOpen) { closeSettings(); return; }
  if (state !== 'paused' || layoutEdit) return;
  el.pause.hidden = true;
  // on a phone the thumb needs a moment to get back into place: count down before the air moves again
  if (touchMode && !watching) { resumeT = 2.1; $('countdown').hidden = false; return; }
  state = 'play';
  if (document.activeElement && document.activeElement.blur) document.activeElement.blur();
}

/* =========================================================
   Input
   ========================================================= */
const KEYMAP = { ArrowUp: 'up', ArrowDown: 'down', ArrowLeft: 'left', ArrowRight: 'right' };
window.addEventListener('keydown', (e) => {
  if ((el.adDialog && el.adDialog.open) || ($('legalDialog') && $('legalDialog').open)) return;
  if (e.metaKey || e.ctrlKey || e.altKey) return;
  Sound.init();
  const k = e.key, code = e.code, L = k && k.length === 1 ? k.toLowerCase() : '';
  if (KEYMAP[k]) { keys[KEYMAP[k]] = true; touchMode = false; e.preventDefault(); return; }
  const is = (ch, c) => L === ch || code === c;
  if (shopOpen) {
    if (k === 'Escape') { e.preventDefault(); closeShop(); }
    return;
  }
  if (settingsOpen) {
    if (k === 'Escape' && !layoutEdit) { e.preventDefault(); closeSettings(); }
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
window.addEventListener('blur', () => {
  keys.up = keys.down = keys.left = keys.right = false; touch.up = touch.down = false; pointers.clear();
  if (activeAd || (lastAdCloseMs && performance.now() - lastAdCloseMs < 1500)) return;
  stopCountdown();
  if (state === 'play') pauseGame();
});
// iOS opens/recovers audio reliably across taps and background transitions when unlocked on gestures too
const resumeAudioOnForeground = () => {
  if (document.hidden || (el.adDialog && el.adDialog.open)) return;
  Sound.resume(false);
  setTimeout(() => {
    if (!document.hidden && !(el.adDialog && el.adDialog.open)) Sound.resume(false);
  }, 180);
};
for (const ev of ['touchend', 'click', 'keydown']) {
  window.addEventListener(ev, () => {
    if (!document.hidden && !(el.adDialog && el.adDialog.open)) Sound.resume(true);
  }, { capture: true, passive: true });
}
document.addEventListener('visibilitychange', () => {
  if (document.hidden) { Sound.suspend(); stopCountdown(); if (state === 'play') pauseGame(); }
  else resumeAudioOnForeground();
});
window.addEventListener('pageshow', resumeAudioOnForeground);
window.addEventListener('focus', resumeAudioOnForeground);
window.onNativeAppActive = resumeAudioOnForeground;
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
const shopEl = $('shop'), shopGrid = $('shopGrid'), shopUps = $('shopUps'), shopPacks = $('shopPacks'), shopNote = $('shopNote');
const prevC = $('shopPreview'), prevCtx = prevC.getContext('2d');
let shopTab = 'sail', shopOpen = false, shopSel = null;
const nativePackPrices = {};
let iapBusy = false;
function updatePurse() { $('menuPurse').textContent = fmt(save.purse); $('shopPurse').textContent = fmt(save.purse); }
function svgBg(svg, bg) {
  return `url("data:image/svg+xml,${encodeURIComponent(svg)}") center/contain no-repeat, ${bg}`;
}
function swatch(k, it) {
  if (k === 'sail') {
    const bg = `linear-gradient(135deg, rgba(15,20,34,0.82), rgba(28,36,56,0.55))`;
    const shapes = {
      ejder: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 120 36"><g id="h"><path d="M60 7 L80 3 L115 13 Q105 16 101 25 Q93 18 85 28 Q79 20 71 30 L60 22 Z" fill="#8a2628" stroke="#1c0a0e" stroke-width="1.6" stroke-linejoin="round"/><path d="M78 5 L101 24 M78 5 L85 27 M78 5 L71 29" stroke="#ff9a3c" stroke-width="1.3" stroke-linecap="round" fill="none"/><path d="M60 7 L80 3 L115 13" stroke="#1c0a0e" stroke-width="2.4" fill="none" stroke-linecap="round"/><path d="M61 5 Q66 0 73 1 Q67 3 64 7 Z" fill="#e8dcc0"/></g><use href="#h" transform="translate(120 0) scale(-1 1)"/><circle cx="60" cy="8" r="2.2" fill="#ffd98a"/></svg>`,
      vitray: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 120 36"><g id="h"><path d="M60 6 C76 0 104 2 114 14 C118 22 108 30 96 28 Q88 33 80 28 Q72 33 66 27 L60 22 Z" fill="#1a1028" stroke="#0e0a16" stroke-width="1.5"/><path d="M63 9 L84 5 L80 15 Z" fill="#ff5d6c"/><path d="M87 5 L107 11 L93 18 L83 15 Z" fill="#ffb23e"/><path d="M63 12 L79 18 L69 24 Z" fill="#3fa9f5"/><path d="M82 19 L92 20 L95 26 L82 26 Z" fill="#3fd6a0"/><path d="M96 19 L109 14 L111 21 L99 25 Z" fill="#a070ff"/><path d="M72 26 L79 21 L80 27 Z" fill="#ffe45c"/><circle cx="104" cy="26" r="1" fill="#fff"/><circle cx="88" cy="29" r="1" fill="#fff"/><circle cx="73" cy="29" r="1" fill="#fff"/></g><use href="#h" transform="translate(120 0) scale(-1 1)"/><path d="M60 5 L60 24" stroke="#ffd36b" stroke-width="1.6" stroke-linecap="round"/></svg>`,
      aurora: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 120 36"><defs><linearGradient id="a" x1="0" x2="1"><stop offset="0" stop-color="#e070ff"/><stop offset=".25" stop-color="#6f8cff"/><stop offset=".5" stop-color="#3fe0b0"/><stop offset=".75" stop-color="#6f8cff"/><stop offset="1" stop-color="#e070ff"/></linearGradient></defs><path d="M60 4 C84 2 104 12 116 28 Q100 22 90 30 Q80 22 70 30 L60 24 L50 30 Q40 22 30 30 Q20 22 4 28 C16 12 36 2 60 4 Z" fill="#141f48" stroke="#c8fff2" stroke-width="1.5"/><path d="M60 9 C80 8 96 15 107 25 M60 14 C76 13 88 19 97 26 M60 19 C70 19 78 22 84 26 M60 9 C40 8 24 15 13 25 M60 14 C44 13 32 19 23 26 M60 19 C50 19 42 22 36 26" stroke="url(#a)" stroke-width="3" fill="none" stroke-linecap="round" opacity=".92"/><path d="M60 1 L61.3 4.7 L65 6 L61.3 7.3 L60 11 L58.7 7.3 L55 6 L58.7 4.7 Z" fill="#fff"/><circle cx="88" cy="14" r="1" fill="#fff"/><circle cx="34" cy="13" r="1" fill="#fff"/></svg>`,
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
    kor: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 36"><path d="M34 28 L54 23 L74 28 L78 36 L28 36 Z" fill="#1e1418" stroke="#ff9a3c" stroke-width="1.2"/><path d="M40 31 L46 27 L50 32 L56 27 L62 31" stroke="#ff9a3c" stroke-width="1.2" fill="none"/><path d="M45 15 C30 9 20 15 8 11 C16 18 24 21 12 27 C26 27 36 23 46 21 Z" fill="#5a1218"/><path d="M43 17 C32 14 24 18 16 17 C24 21 32 21 43 20 Z" fill="#ff7a2e"/><circle cx="54" cy="19" r="9.4" fill="#1a1216"/><path d="M48 12 Q41 3 30 3 Q39 8 44 16 Z" fill="#d8c8a8"/><path d="M56 10 Q53 1 43 0 Q50 4 51 11 Z" fill="#d8c8a8"/><path d="M53 17 L64 16 L62 20 L54 21 Z" fill="#ffb347"/><path d="M52 23 L62 22 L59 27 L53 27 Z" fill="#2a1c22"/></svg>`,
    luna: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 36"><circle cx="54" cy="16" r="15" fill="#ffffff" opacity=".12"/><path d="M35 28 Q54 23 71 28 L75 36 L31 36 Z" fill="#dfe8ff" stroke="#7fe8e0" stroke-width="1.3"/><path d="M49 9 C33 5 18 13 6 10 C15 18 22 24 9 28 C24 31 38 26 50 24 Z" fill="#b9c6e6"/><path d="M47 13 C33 11 22 18 13 17 C23 22 34 23 47 21 Z" fill="#ffffff"/><circle cx="54" cy="19" r="9.2" fill="#f6d2ba"/><path d="M44 17 A11 10 0 0 1 64 15 Q54 12 44 19 Z" fill="#eef2ff"/><path d="M60 1 A5.5 5.5 0 1 0 66 8 A4.2 4.2 0 1 1 60 1 Z" fill="#ffe9a8"/><circle cx="59" cy="19" r="2.4" fill="#3fd8cc"/><circle cx="57" cy="23" r="2" fill="#f08aa0" opacity=".45"/></svg>`,
    nova: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 36"><path d="M30 16 L17 12 L20 20 L30 22 Z" fill="#7fd4ff"/><rect x="29" y="11" width="13" height="16" rx="3" fill="#c8d0dc" stroke="#8a94a8"/><path d="M33 28 Q54 22 73 28 L77 36 L29 36 Z" fill="#eef2f8" stroke="#a8b2c4" stroke-width="1.2"/><rect x="47" y="29.5" width="14" height="5.5" rx="1.5" fill="#39445c"/><circle cx="50.5" cy="32.2" r="1.3" fill="#ff5a5a"/><circle cx="54" cy="32.2" r="1.3" fill="#5aff8a"/><circle cx="57.5" cy="32.2" r="1.3" fill="#5ab4ff"/><path d="M50 8 L47 2" stroke="#8a94a8" stroke-width="1.2"/><circle cx="47" cy="2.4" r="1.7" fill="#ff5a5a"/><circle cx="55" cy="18" r="11" fill="#f4f6fa" stroke="#a8b2c4" stroke-width="1.2"/><path d="M50 12 Q63 9 65 19 Q63 26 53 25 Q47 19 50 12 Z" fill="#ffc857" stroke="#8a5a1a" stroke-width=".8"/><path d="M53 13.5 Q59 11.5 62 15.5" stroke="#fff" stroke-width="1.5" fill="none" stroke-linecap="round"/></svg>`,
    ruzgar: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 36"><path d="M36 28 Q52 22 68 28 L72 36 L32 36 Z" fill="#8c5a32"/><circle cx="46" cy="28" r="3.5" fill="#f0e6d2"/><circle cx="58" cy="28" r="3.5" fill="#f0e6d2"/><path d="M36 15 L22 12 L27 17 L20 20 L35 21 Z" fill="#5c3620"/><circle cx="52" cy="19" r="9.5" fill="#e4b892"/><path d="M41 18 A11 11 0 0 1 63 16 L54 19 L49 26 L44 23 Z" fill="#d8d2c4"/><path d="M47 18 L52 18 L50 26 L45 24 Z" fill="#6e472b"/><path d="M58 14 L65 12 L62 17 Z" fill="#5c3620"/><circle cx="58" cy="15" r="3.6" fill="#a7dcec" stroke="#c99a4a" stroke-width="1.5"/></svg>`,
    atmaca: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 36"><path d="M36 28 Q54 23 70 28 L74 36 L32 36 Z" fill="#a62836" stroke="#f0c050" stroke-width="1.4"/><path d="M48 9 C32 7 18 14 8 11 C15 18 24 22 10 26 C24 28 36 25 49 24 Z" fill="#c83828"/><path d="M46 13 C32 12 20 18 13 17 C22 22 33 22 46 21 Z" fill="#ff734f"/><circle cx="54" cy="19" r="9.2" fill="#f2c4a2"/><path d="M44 14 Q54 9 63 14 L61 17 Q53 13 44 17 Z" fill="#a82420"/><path d="M55 18 L63 16" stroke="#ffbe42" stroke-width="2.6" stroke-linecap="round"/><circle cx="58" cy="22" r="2" fill="#eb696e" opacity="0.45"/></svg>`,
    bulut: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 36"><path d="M35 28 Q54 23 71 28 L75 36 L31 36 Z" fill="#5896c2"/><circle cx="45" cy="28" r="3.8" fill="#fff"/><circle cx="54" cy="29" r="3.8" fill="#fff"/><circle cx="63" cy="28" r="3.8" fill="#fff"/><g fill="#f0c452" stroke="#b88628" stroke-width="1"><ellipse cx="41" cy="20" rx="4.5" ry="2.8" transform="rotate(-18 41 20)"/><ellipse cx="34" cy="22" rx="4.5" ry="2.8" transform="rotate(18 34 22)"/><ellipse cx="27" cy="23" rx="4.2" ry="2.6" transform="rotate(-18 27 23)"/><ellipse cx="20" cy="24" rx="3.8" ry="2.4" transform="rotate(18 20 24)"/><path d="M16 24 L10 22 L11 27 Z" fill="#f0c452"/></g><circle cx="16" cy="24" r="2" fill="#4fd1c5"/><circle cx="54" cy="19" r="9.2" fill="#f5cbb0"/><path d="M43 18 A11 10 0 0 1 64 16 Z" fill="#dce5f0"/><circle cx="48" cy="17" r="3.5" fill="#fff"/><circle cx="55" cy="14" r="3.8" fill="#fff"/><circle cx="62" cy="15" r="3.2" fill="#fff"/><circle cx="59" cy="19" r="3" fill="#ff9ec7" stroke="#d4a24e" stroke-width="1.2"/></svg>`,
    dogan: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 36"><path d="M34 27 L54 24 L72 27 L76 36 L30 36 Z" fill="#202736" stroke="#66f0ff" stroke-width="1.3"/><path d="M42 14 C28 11 18 14 8 18 C20 18 29 19 14 24 C26 23 35 20 43 18 Z" fill="#181e2b"/><rect x="40" y="13" width="3.5" height="5" rx="1.5" fill="#ff6e4a"/><circle cx="54" cy="19" r="9.2" fill="#dfb08a"/><path d="M43 19 A11 11 0 0 1 64 16 L56 21 L44 21 Z" fill="#23324d"/><path d="M60 9 Q48 5 38 11 Q47 12 56 12 Z" fill="#ff6e4a"/><polygon points="54,17 65,16 62,20 54,20" fill="#66f0ff"/></svg>`,
    yildiz: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 36"><path d="M35 28 Q54 23 71 28 L75 36 L31 36 Z" fill="#5430a0" stroke="#ffd86b" stroke-width="1.5"/><path d="M49 9 C33 6 20 14 9 13 C17 19 22 25 11 28 C25 30 38 25 50 24 Z" fill="#432878"/><path d="M47 13 C34 12 23 19 15 19 C24 23 35 23 47 21 Z" fill="#845ee0"/><circle cx="24" cy="16" r="1.6" fill="#ffe47a"/><circle cx="34" cy="22" r="1.5" fill="#ffe47a"/><circle cx="54" cy="19" r="9.2" fill="#f2c8a8"/><polygon points="48,11 53,6 56,11 61,7 60,13 48,13" fill="#f5c84c"/><circle cx="59" cy="19" r="2.6" fill="#d4a5ff"/><circle cx="57" cy="22" r="2" fill="#eb7898" opacity="0.45"/></svg>`,
  };
  return svgBg(portraits[it.id] || portraits.ruzgar, bg);
}
function note(t) { shopNote.textContent = t; }
// the two branches of each tier: locked until the skill level, then bought once and switched freely
let perkSel = null;
function perkRow(n) {
  const wrap = document.createElement('div');
  wrap.className = 'perks';
  PERKS[n].forEach((tier, t) => {
    const open = save.up[n] >= PERK_LVL[t];
    const line = document.createElement('div');
    line.className = 'tier' + (open ? '' : ' shut');
    line.innerHTML = `<span class="tl">${open ? tx('Dal ', 'Branch ') + (t + 1) : tx('Sv ', 'Lv ') + PERK_LVL[t]}</span>`;
    for (const p of tier) {
      const own = save.perkOwn.includes(p.id), on = save.perkOn[n][t] === p.id;
      const b = document.createElement('button');
      b.type = 'button';
      b.className = 'perk' + (on ? ' on' : '') + (own ? ' own' : '') + (perkSel === p.id ? ' sel' : '');
      b.disabled = !open;
      b.title = p.ds;
      b.innerHTML = `<b>${p.name}</b><span>${p.ds}</span><em>${on ? tx('Aktif', 'Active') : own ? tx('Seç', 'Select') : fmt(PERK_COST[t]) + tx(' tüy', ' feathers')}</em>`;
      b.addEventListener('click', () => {
        if (!open || on) return;
        // phones hide the descriptions: the first tap tells what it does, the second takes it
        if (MOBILE && perkSel !== p.id) { perkSel = p.id; note(EN ? `${p.name}: ${p.ds} Tap again to ${own ? 'select' : 'buy'}.` : `${p.name}: ${p.ds} ${own ? 'Seçmek' : 'Almak'} için tekrar dokun.`); renderShop(); return; }
        perkSel = null;
        if (!own) {
          if (save.purse < PERK_COST[t]) { note(tx(`${p.name} için ${fmt(PERK_COST[t] - save.purse)} tüy daha gerekiyor.`, `You need ${fmt(PERK_COST[t] - save.purse)} more feathers for ${p.name}.`)); Sound.deny(); return; }
          save.purse -= PERK_COST[t]; save.perkOwn.push(p.id); updatePurse();
          note(tx(`${p.name} açıldı.`, `${p.name} unlocked.`)); Sound.ring();
        } else { note(tx(`${p.name} seçildi.`, `${p.name} selected.`)); Sound.feather(2); }
        save.perkOn[n][t] = p.id;
        persist(); applyUpgrades(); renderShop();
      });
      line.appendChild(b);
    }
    wrap.appendChild(line);
  });
  return wrap;
}
function renderShop() {
  document.querySelectorAll('.tab').forEach((t) => {
    const sel = t.dataset.tab === shopTab;
    t.setAttribute('aria-selected', String(sel));
    if (sel) {
      try { t.scrollIntoView({ block: 'nearest', inline: 'nearest', container: 'nearest' }); }
      catch (e) { t.scrollIntoView({ block: 'nearest', inline: 'nearest' }); }
    }
  });
  const ups = shopTab === 'up', packs = shopTab === 'packs';
  shopGrid.hidden = ups || packs; shopUps.hidden = !ups; shopPacks.hidden = !packs;
  if (packs) {
    shopPacks.innerHTML = '';
    for (const p of FEATHER_PACKS) {
      const card = document.createElement('article');
      card.className = 'pack-card' + (p.featured ? ' featured' : '');
      const priceTxt = nativePackPrices[p.id] || p.price;
      card.innerHTML = `<svg viewBox="0 0 48 48" aria-hidden="true"><path d="M40 7c-12 0-23 8-28 21l-4 13 4-2 4-9c8 0 18-6 22-16-4 2-8 2-10 2 4-2 8-5 12-9z" fill="#ffd257" stroke="#fff3c8" stroke-width="1.5" stroke-linejoin="round"/></svg><header><span class="pack-badge">${p.badge}</span><h3>${fmt(p.amount)} ${tx('Altın Tüy', 'Golden Feathers')}</h3><span class="pack-sub">${p.title}</span></header><p>${p.ds}</p><footer><button class="buy pack-buy" type="button"${iapBusy ? ' disabled' : ''}>${iapBusy ? tx('İşleniyor…', 'Processing…') : priceTxt}</button></footer>`;
      card.querySelector('.pack-buy').addEventListener('click', () => buyFeatherPack(p));
      shopPacks.appendChild(card);
    }
    const legal = document.createElement('div');
    legal.className = 'packs-legal';
    legal.innerHTML = `<button class="legal-link" type="button" data-action="restore">${tx('Satın Almaları Geri Yükle', 'Restore Purchases')}</button>
      <button class="legal-link" type="button" data-legal="privacy">${tx('Gizlilik Politikası', 'Privacy Policy')}</button>
      <button class="legal-link" type="button" data-legal="terms">${tx('Kullanım Koşulları (EULA)', 'Terms of Use (EULA)')}</button>`;
    legal.querySelector('[data-action="restore"]').addEventListener('click', restorePurchases);
    legal.querySelector('[data-legal="privacy"]').addEventListener('click', () => openLegal('privacy'));
    legal.querySelector('[data-legal="terms"]').addEventListener('click', () => openLegal('terms'));
    shopPacks.appendChild(legal);
    if (MOBILE) { applyLook(); renderShopDetail(); }
    return;
  }
  if (ups) {
    shopUps.innerHTML = '';
    for (const u of UPGRADES) {
      const l = save.up[u.id], cost = UP_COST[l], base = SK_BASE[u.id];
      const row = document.createElement('div');
      row.className = 'up';
      const dur = (base.dur * (1 + 0.15 * l)).toFixed(1), cd = (base.cd * (1 - 0.1 * l)).toFixed(1);
      row.innerHTML = `<div class="nm"><span class="kbd">${u.key}</span> ${u.name}<span class="pips">${'<i class="f"></i>'.repeat(l)}${'<i></i>'.repeat(UP_MAX - l)}</span></div>
        <div class="ds">${EN ? `Duration ${dur} s · cooldown ${cd} s${l < UP_MAX ? ' → next level: duration +15%, cooldown −10%' : ' · max level'}` : `Süre ${dur} sn · bekleme ${cd} sn${l < UP_MAX ? ' → sonraki seviye: süre +%15, bekleme −%10' : ' · en üst seviye'}`}</div>`;
      const b = document.createElement('button');
      b.className = 'buy'; b.type = 'button';
      b.textContent = l >= UP_MAX ? tx('Tamamlandı', 'Maxed') : `${fmt(cost)} ${tx('tüy', 'feathers')}`;
      b.disabled = l >= UP_MAX;
      b.addEventListener('click', () => {
        if (save.up[u.id] >= UP_MAX) return;
        const c = UP_COST[save.up[u.id]];
        if (save.purse < c) { note(tx(`Bu yükseltme için ${fmt(c - save.purse)} tüy daha gerekiyor.`, `You need ${fmt(c - save.purse)} more feathers for this upgrade.`)); Sound.deny(); return; }
        save.purse -= c; save.up[u.id]++; persist(); applyUpgrades(); updatePurse();
        note(tx(`${u.name} seviye ${save.up[u.id]} oldu.`, `${u.name} is now level ${save.up[u.id]}.`)); Sound.ring();
        renderShop();
      });
      row.appendChild(b);
      row.appendChild(perkRow(u.id));
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
    b.className = 'item' + (on ? ' on' : '') + (owned ? '' : ' locked') + (it.premium ? ' premium' : '');
    b.innerHTML = `<span class="sw"></span>${it.premium ? `<span class="tag">${tx('✦ Özel', '✦ Special')}</span>` : ''}<span class="nm">${it.name}</span>${it.stats ? `<span class="st">${it.stats}</span>` : ''}${it.ds ? `<span class="ds">${it.ds}</span>` : ''}<span class="pr${owned ? ' own' : ''}">${on ? tx('Kullanılıyor', 'In use') : owned ? tx('Seç', 'Select') : fmt(it.price) + tx(' tüy', ' feathers')}</span>`;
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
      note(tx(`${it.name} için ${fmt(it.price - save.purse)} tüy daha gerekiyor.`, `You need ${fmt(it.price - save.purse)} more feathers for ${it.name}.`));
      b.classList.remove('deny'); void b.offsetWidth; b.classList.add('deny'); Sound.deny();
      return;
    }
    save.purse -= it.price; save.owned[shopTab].push(it.id);
    note(tx(`${it.name} senin oldu.`, `${it.name} is yours.`)); Sound.orb();
  } else note(tx(`${it.name} seçildi.`, `${it.name} selected.`));
  save.equip[shopTab] = it.id;
  persist(); applyLook(); updatePurse(); renderShop();
}
// phones: the picked item's name, description and its buy / wear button, under the preview
function renderShopDetail() {
  const d = $('shopDetail'), it = shopSel;
  d.hidden = shopTab === 'up' || shopTab === 'packs' || !it;
  if (d.hidden) return;
  const owned = save.owned[shopTab].includes(it.id), on = save.equip[shopTab] === it.id, btn = $('sdBuy');
  $('sdName').textContent = it.name;
  $('sdStats').textContent = it.stats || '';
  $('sdDesc').textContent = it.ds || '';
  btn.textContent = on ? tx('Kuşanıldı', 'Equipped') : owned ? tx('Kuşan', 'Equip') : tx(`${fmt(it.price)} tüy · Satın al`, `${fmt(it.price)} feathers · Buy`);
  btn.disabled = on;
  btn.classList.toggle('poor', !owned && save.purse < it.price);
}
$('sdBuy').addEventListener('click', () => { if (shopSel) buyOrEquip(shopSel, $('sdBuy')); });
function openShop() {
  if (state !== 'menu') return;
  Sound.init();
  shopOpen = true; el.menu.hidden = true; shopEl.hidden = false;
  note(tx('Uçuşlarda topladığın tüyler buraya birikir.', 'Feathers you collect in flight are saved here.'));
  updatePurse();
  updateShopAdBtn();
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
const shopHeadPurse = $('shopPurse') && $('shopPurse').parentElement;
if (shopHeadPurse) {
  shopHeadPurse.setAttribute('role', 'button');
  shopHeadPurse.tabIndex = 0;
  shopHeadPurse.title = tx('Altın tüy paketlerini gör', 'See golden feather packs');
  shopHeadPurse.addEventListener('click', () => { shopTab = 'packs'; renderShop(); });
  shopHeadPurse.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); shopTab = 'packs'; renderShop(); }
  });
}
function buyFeatherPack(pack) {
  if (iapBusy) return;
  const iapBridge = window.webkit && window.webkit.messageHandlers && window.webkit.messageHandlers.iap;
  if (!iapBridge) {
    Sound.deny();
    note(tx('Altın tüy satın alma yalnızca iOS App Store uygulamasında aktiftir.', 'Golden feather purchases are only available in the iOS App Store app.'));
    return;
  }
  iapBusy = true;
  note(tx(`${pack.title} için App Store bağlantısı açılıyor…`, `Opening the App Store for ${pack.title}…`));
  renderShop();
  try {
    iapBridge.postMessage({ action: 'purchase', productId: pack.id, amount: pack.amount });
  } catch (e) {
    iapBusy = false;
    Sound.deny();
    note(tx('Satın alma başlatılamadı.', 'The purchase could not be started.'));
    renderShop();
  }
}
window.onNativeProductsLoaded = (prices) => {
  if (!prices || typeof prices !== 'object') return;
  for (const [id, price] of Object.entries(prices)) {
    if (typeof price === 'string' && price) nativePackPrices[id] = price;
  }
  if (shopOpen && shopTab === 'packs') renderShop();
};
window.onNativePurchaseResult = (res) => {
  iapBusy = false;
  if (res && res.ok) {
    const pack = FEATHER_PACKS.find((p) => p.id === res.productId);
    const amount = Number.isFinite(res.amount) && res.amount > 0 ? (res.amount | 0) : (pack ? pack.amount : 0);
    // the app keeps every paid transaction until the page confirms it saved the feathers; never credit one twice
    const tx = res.tx ? String(res.tx) : '';
    const seen = tx && save.iapTx.includes(tx);
    const ack = () => { if (tx) try { window.webkit.messageHandlers.iap.postMessage({ action: 'ack', tx }); } catch (e) { /* ignore */ } };
    if (seen) { ack(); if (shopOpen && shopTab === 'packs') renderShop(); return; }
    if (tx) { save.iapTx.push(tx); if (save.iapTx.length > 100) save.iapTx.splice(0, save.iapTx.length - 100); }
    if (amount > 0) {
      save.purse += amount;
      persist();
      updatePurse();
      Sound.orb(); buzz(24);
      note(tx(`+${fmt(amount)} altın tüy kesene eklendi!`, `+${fmt(amount)} golden feathers added to your purse!`));
    } else persist();
    ack();
  } else if (res && res.cancelled) {
    note(tx('Satın alma iptal edildi.', 'Purchase cancelled.'));
  } else if (res && res.pending) {
    note(tx('Satın alma onay bekliyor.', 'Purchase is waiting for approval.'));
  } else {
    Sound.deny();
    note((res && res.error && !EN) ? String(res.error) : tx('Satın alma tamamlanamadı.', 'The purchase could not be completed.'));
  }
  if (shopOpen && shopTab === 'packs') renderShop();
};
const APPLE_EULA_URL = 'https://www.apple.com/legal/internet-services/itunes/dev/stdeula/';
const LEGAL_DOCS = {
  privacy: {
    title: 'Gizlilik Politikası',
    html: `<h3>1. Toplanan Veriler ve Yerel Kayıt</h3>
      <p><strong>Süzülüş</strong> bir hesap veya üyelik gerektirmez. Oyun ilerlemen, kazandığın altın tüyler, açtığın kanatlar ve ses tercihlerin yalnızca kendi cihazında (yerel depolamada) saklanır.</p>
      <h3>2. Ödüllü Reklamlar (Google AdMob)</h3>
      <p>Uygulamada isteğe bağlı ödüllü video reklamlar için Google AdMob SDK kullanılır. Apple Uygulama Takip Şeffaflığı (ATT) izni vermen halinde reklam ağı, reklam performansını ölçmek ve ilgi alanına uygun reklamlar göstermek için cihaz reklam kimliğini (IDFA) işleyebilir. İzin vermezsen yalnızca kişiselleştirilmemiş reklamlar sunulur.</p>
      <h3>3. Uygulama İçi Satın Almalar</h3>
      <p>Altın Tüy paketleri tamamen Apple App Store ödeme altyapısı (StoreKit) üzerinden işlenir. Ödeme veya kart bilgilerin tarafımızca görülmez ve saklanmaz.</p>
      <h3>4. İletişim ve Veri Silme</h3>
      <p>Uygulamayı cihazından kaldırdığında yerel oyun verilerin silinir. Gizlilikle ilgili taleplerin için App Store sayfasındaki geliştirici destek bağlantısını kullanabilirsin.</p>`
  },
  terms: {
    title: 'Kullanım Koşulları (EULA)',
    html: `<h3>1. Lisans ve Kullanım</h3>
      <p><strong>Süzülüş</strong>, Apple Standart Lisanslı Uygulama Son Kullanıcı Lisans Sözleşmesi (Standard EULA) kapsamındadır. Uygulama kişisel ve ticari olmayan eğlence amacıyla sunulur.</p>
      <h3>2. Altın Tüy Paketleri (Tüketilebilir Satın Almalar)</h3>
      <p>Mağazadaki Altın Tüy paketleri (300, 750, 1.800 ve 5.000 Altın Tüy) tüketilebilir dijital içeriklerdir; ödemeler satın alma onayıyla Apple Kimliği hesabından tahsil edilir.</p>
      <h3>3. İade ve Geri Yükleme</h3>
      <p>Tamamlanmamış veya bekleyen işlemler <strong>Satın Almaları Geri Yükle</strong> düğmesi ile Apple StoreKit üzerinden senkronize edilir. Tüketilebilir paketlerin iade talepleri Apple App Store iade politikalarına tabidir.</p>
      <h3>4. Resmi Apple Sözleşmesi</h3>
      <p>Aşağıdaki <strong>Apple Standart EULA</strong> bağlantısından sözleşmenin tam metnine her zaman ulaşabilirsin.</p>`
  }
};
if (EN) {
  LEGAL_DOCS.privacy = {
    title: 'Privacy Policy',
    html: `<h3>1. Data Collected and Local Storage</h3>
      <p><strong>Süzülüş</strong> needs no account or sign-up. Your game progress, the golden feathers you earn, the wings you unlock and your sound preferences are stored only on your own device (local storage).</p>
      <h3>2. Rewarded Ads (Google AdMob)</h3>
      <p>The app uses the Google AdMob SDK for optional rewarded video ads. If you give permission through Apple App Tracking Transparency (ATT), the ad network may process your device advertising identifier (IDFA) to measure ad performance and show ads that match your interests. If you do not give permission, only non-personalised ads are shown.</p>
      <h3>3. In-App Purchases</h3>
      <p>Golden Feather packs are processed entirely through Apple’s App Store payment system (StoreKit). We never see or store your payment or card details.</p>
      <h3>4. Contact and Data Deletion</h3>
      <p>When you remove the app from your device, your local game data is deleted. For privacy requests, use the developer support link on the App Store page.</p>`
  };
  LEGAL_DOCS.terms = {
    title: 'Terms of Use (EULA)',
    html: `<h3>1. License and Use</h3>
      <p><strong>Süzülüş</strong> is covered by Apple’s Standard Licensed Application End User License Agreement (Standard EULA). The app is provided for personal, non-commercial entertainment.</p>
      <h3>2. Golden Feather Packs (Consumable Purchases)</h3>
      <p>The Golden Feather packs in the Shop (300, 750, 1,800 and 5,000 Golden Feathers) are consumable digital content; payment is charged to your Apple Account when you confirm the purchase.</p>
      <h3>3. Refunds and Restoring</h3>
      <p>Unfinished or pending transactions are synced through Apple StoreKit with the <strong>Restore Purchases</strong> button. Refund requests for consumable packs are subject to Apple App Store refund policies.</p>
      <h3>4. Official Apple Agreement</h3>
      <p>You can always read the full agreement through the <strong>Apple Standard EULA</strong> link below.</p>`
  };
}
function openExternalURL(url) {
  const iapBridge = window.webkit && window.webkit.messageHandlers && window.webkit.messageHandlers.iap;
  if (iapBridge) {
    try { iapBridge.postMessage({ action: 'openURL', url }); return; } catch (e) { /* fallback */ }
  }
  window.open(url, '_blank', 'noopener');
}
function openLegal(kind) {
  const d = $('legalDialog'), doc = LEGAL_DOCS[kind] || LEGAL_DOCS.privacy;
  if (!d) return;
  $('legalTitle').textContent = doc.title;
  $('legalBody').innerHTML = doc.html;
  $('legalBody').scrollTop = 0;
  d.showModal();
}
function restorePurchases() {
  if (iapBusy) return;
  const iapBridge = window.webkit && window.webkit.messageHandlers && window.webkit.messageHandlers.iap;
  if (!iapBridge) {
    note(tx('Satın alma geri yükleme yalnızca iOS App Store uygulamasında çalışır.', 'Restoring purchases only works in the iOS App Store app.'));
    return;
  }
  iapBusy = true;
  note(tx('App Store işlemleri kontrol ediliyor…', 'Checking App Store transactions…'));
  if (shopOpen && shopTab === 'packs') renderShop();
  try {
    iapBridge.postMessage({ action: 'restore' });
  } catch (e) {
    iapBusy = false;
    note(tx('Geri yükleme başlatılamadı.', 'The restore could not be started.'));
    if (shopOpen && shopTab === 'packs') renderShop();
  }
}
window.onNativeRestoreResult = (res) => {
  iapBusy = false;
  if (res && res.ok) {
    if (res.restored > 0) {
      Sound.orb();
      note(tx(`${res.restored} bekleyen işlem geri yüklendi.`, `${res.restored} pending transaction(s) restored.`));
    } else {
      note(tx('Geri yüklenecek bekleyen işlem bulunamadı (tüketilebilir paketler cihazda saklanır).', 'No pending transactions to restore (consumable packs are kept on this device).'));
    }
  } else {
    Sound.deny();
    note((res && res.error && !EN) ? String(res.error) : tx('App Store senkronizasyonu tamamlanamadı.', 'App Store sync could not be completed.'));
  }
  if (shopOpen && shopTab === 'packs') renderShop();
};
if (!('closedBy' in HTMLDialogElement.prototype)) {
  const outside = (e, d) => {
    const r = d.getBoundingClientRect();
    return e.clientX < r.left || e.clientX > r.right || e.clientY < r.top || e.clientY > r.bottom;
  };
  for (const d of document.querySelectorAll('dialog[closedby="any"]')) {
    let downOut = false;
    d.addEventListener('pointerdown', (e) => { downOut = outside(e, d); });
    d.addEventListener('pointerup', (e) => { if (downOut && outside(e, d)) d.close(); downOut = false; });
  }
}
if ($('btnSetPrivacy')) $('btnSetPrivacy').addEventListener('click', () => openLegal('privacy'));
if ($('btnSetTerms')) $('btnSetTerms').addEventListener('click', () => openLegal('terms'));
if ($('btnAppleEula')) $('btnAppleEula').addEventListener('click', () => openExternalURL(APPLE_EULA_URL));
if (window.webkit && window.webkit.messageHandlers && window.webkit.messageHandlers.iap) {
  try { window.webkit.messageHandlers.iap.postMessage({ action: 'fetchProducts' }); } catch (e) { /* ignore */ }
}
$('btnShop').addEventListener('click', openShop);
$('btnWatch').addEventListener('click', startWatch);
$('btnSettings').addEventListener('click', openSettings);
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
  b.textContent = Sound.muted ? tx('Kapalı', 'Off') : tx('Açık', 'On');
  b.setAttribute('aria-pressed', String(!Sound.muted));
}
function syncGhostToggle() {
  const b = $('btnGhostToggle');
  if (!b) return;
  b.textContent = save.ghostOn ? tx('Açık', 'On') : tx('Kapalı', 'Off');
  b.setAttribute('aria-pressed', String(save.ghostOn));
}
el.btnMute.addEventListener('click', () => { Sound.init(); Sound.toggleMute(); syncMute(); el.btnMute.blur(); });
$('btnMuteAll').addEventListener('click', () => { Sound.init(); Sound.toggleMute(); syncMute(); });
if ($('btnGhostToggle')) {
  $('btnGhostToggle').addEventListener('click', () => {
    Sound.init();
    save.ghostOn = !save.ghostOn;
    persist();
    if (!save.ghostOn) ghostRun = null;
    else if (state === 'paused' && !watching && ghost && !ghostRun) {
      ghostRun = { x: bird.x, y: bird.y, ang: 0, a: 0, lead: 0, behind: false, cool: 3, done: false };
    }
    syncGhostToggle();
  });
}
for (const [id, kind] of [['volMusic', 'music'], ['volSfx', 'sfx']]) {
  const inp = $(id), out = $(id + 'V');
  const show = () => { out.textContent = inp.value + '%'; };
  inp.value = String(Math.round(Sound.volume[kind] * 100)); show();
  inp.addEventListener('input', () => { Sound.init(); Sound.setVolume(kind, inp.value / 100); show(); });
  // a short chime on release, so the new effects level can be heard
  if (kind === 'sfx') inp.addEventListener('change', () => Sound.feather(3));
}
syncMute();
syncGhostToggle();
// language: the two buttons in the settings; switching reloads the page in the new language
for (const [id, l] of [['btnLangTr', 'tr'], ['btnLangEn', 'en']]) {
  const b = $(id);
  if (!b) continue;
  b.setAttribute('aria-pressed', String(LANG === l));
  b.classList.toggle('solid', LANG === l);
  b.addEventListener('click', () => setLang(l));
}
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
  if (settingsOpen) el.hud.hidden = !on;
  el.pause.hidden = on || (state !== 'paused' && !settingsOpen);
  if (on) { syncSizeSlider(); applyLayout(); }
}
$('btnLayout').addEventListener('click', () => setLayoutEdit(true));
$('btnLayoutDone').addEventListener('click', () => setLayoutEdit(false));
$('btnLayoutReset').addEventListener('click', () => { layout.skills = { x: 0, y: 0 }; layout.fly = { x: 0, y: 0 }; layout.scale = 1; syncSizeSlider(); applyLayout(); saveLayout(); });
window.addEventListener('resize', applyLayout);

/* ---- rewarded video ads: revive on death, 2x game-over feathers, daily 2x shop +50 feathers ---- */
let lastRaceHTML = '';
let activeAd = null;
let lastAdCloseMs = 0;
function renderOverEarned() {
  const shown = doubleUsed ? lastEarned * 2 : lastEarned;
  const bonus = doubleUsed ? ' <b>(2× Video!)</b>' : '';
  el.earned.innerHTML = EN
    ? `<b>+${fmt(shown)} feathers</b> added to your purse${bonus}${missionsDone ? ` (+${missionFeathers} from ${missionsDone} mission${missionsDone > 1 ? 's' : ''})` : ''} · total <b>${fmt(save.purse)}</b>${lastRaceHTML}`
    : `Kesene <b>+${fmt(shown)} tüy</b> eklendi${bonus}${missionsDone ? ` (${missionsDone} görevden +${missionFeathers})` : ''} · toplam <b>${fmt(save.purse)}</b>${lastRaceHTML}`;
}
function updateOverAdBtns() {
  el.btnRevive.hidden = reviveUsed || doubleUsed;
  el.btnDouble.hidden = doubleUsed || lastEarned <= 0;
  el.btnDouble.textContent = tx(`🎬 İzle · 2× Tüy (+${fmt(lastEarned)})`, `🎬 Watch · 2× Feathers (+${fmt(lastEarned)})`);
  el.overAds.hidden = el.btnRevive.hidden && el.btnDouble.hidden;
}
function updateShopAdBtn() {
  const left = shopAdsLeft();
  el.btnShopAd.disabled = left <= 0;
  el.btnShopAd.textContent = left > 0
    ? tx(`🎬 Video · +${AD_SHOP_REWARD} tüy (${left}/${AD_DAILY_MAX})`, `🎬 Video · +${AD_SHOP_REWARD} feathers (${left}/${AD_DAILY_MAX})`)
    : tx(`🎬 Günlük video bitti (0/${AD_DAILY_MAX})`, `🎬 No videos left today (0/${AD_DAILY_MAX})`);
}
function drawAdScene(c, p, kind) {
  const w = c.canvas.width, h = c.canvas.height;
  const g = c.createLinearGradient(0, 0, 0, h);
  g.addColorStop(0, '#0a1535'); g.addColorStop(0.55, '#1d3268'); g.addColorStop(1, '#3b2e5e');
  c.fillStyle = g; c.fillRect(0, 0, w, h);
  // aurora ribbon & twinkling stars
  c.fillStyle = 'rgba(255, 255, 255, 0.55)';
  for (let i = 0; i < 18; i++) {
    const sx = ((i * 89 + p * 45) % (w + 20)) - 10;
    const sy = 18 + ((i * 53) % (h * 0.45));
    c.beginPath(); c.arc(sx, sy, 1 + (i % 2) * 0.7, 0, TAU); c.fill();
  }
  c.save();
  c.strokeStyle = 'rgba(116, 240, 210, 0.25)'; c.lineWidth = 26; c.lineCap = 'round';
  c.beginPath();
  for (let x = 0; x <= w; x += 26) {
    const y = 78 + Math.sin(x * 0.014 + p * 6) * 20;
    if (x === 0) c.moveTo(x, y); else c.lineTo(x, y);
  }
  c.stroke();
  c.restore();
  // drifting mountains silhouette
  c.fillStyle = '#121936';
  c.beginPath(); c.moveTo(0, h);
  for (let x = 0; x <= w; x += 20) {
    const mh = h - 38 - Math.sin(x * 0.02 + p * 5) * 18 - Math.cos(x * 0.011) * 12;
    c.lineTo(x, mh);
  }
  c.lineTo(w, h); c.closePath(); c.fill();
  // soaring golden glider
  const gx = w * (0.18 + p * 0.64), gy = h * 0.48 + Math.sin(p * TAU * 1.5) * 14;
  c.save();
  c.translate(gx, gy); c.rotate(Math.cos(p * TAU * 1.5) * 0.08);
  c.fillStyle = '#ffd257';
  c.beginPath(); c.moveTo(28, -4); c.lineTo(-26, -16); c.lineTo(-14, 0); c.lineTo(-24, 10); c.closePath(); c.fill();
  c.fillStyle = '#fff5cf';
  c.beginPath(); c.moveTo(24, -3); c.lineTo(-12, -10); c.lineTo(-6, -1); c.closePath(); c.fill();
  c.restore();
  // floating reward emblem
  c.fillStyle = '#ffd257'; c.font = '800 18px system-ui, sans-serif'; c.textAlign = 'center';
  const label = kind === 'revive' ? tx('KALKANLI DEVAM', 'CONTINUE WITH SHIELD') : kind === 'double' ? tx('2× ALTIN TÜY', '2× GOLDEN FEATHERS') : `+${AD_SHOP_REWARD} ${tx('ALTIN TÜY', 'GOLDEN FEATHERS')}`;
  c.fillText(label, w / 2, h - 22);
}
function finishActiveAd(granted) {
  if (!activeAd) return;
  const cur = activeAd;
  activeAd = null;
  lastAdCloseMs = performance.now();
  if (cur.raf) cancelAnimationFrame(cur.raf);
  if (el.adDialog.open) el.adDialog.close();
  if (granted && cur.onReward) { buzz(24); cur.onReward(); }
}
function playRewardedAd(kind, titleText, descText, onReward) {
  if (activeAd || el.adDialog.open) return;
  Sound.suspend();
  el.adTitle.textContent = titleText;
  el.adDesc.textContent = descText;
  el.adCaption.textContent = kind === 'revive' ? tx('Ödül: Kaldığın yerden devam', 'Reward: continue where you left off') : kind === 'double' ? tx('Ödül: 2× Uçuş Tüyleri', 'Reward: 2× flight feathers') : tx(`Ödül: +${AD_SHOP_REWARD} Altın Tüy`, `Reward: +${AD_SHOP_REWARD} Golden Feathers`);
  el.adFill.style.width = '0%';
  const hasNativeAds = !!(window.webkit && window.webkit.messageHandlers && window.webkit.messageHandlers.ads);
  el.adTimer.textContent = hasNativeAds ? tx('Yükleniyor...', 'Loading...') : tx('5 sn', '5 s');
  el.adDialog.showModal();
  const dur = 5000;
  let t0 = performance.now();
  const ctx2d = el.adCanvas.getContext('2d');
  activeAd = { kind, onReward, done: false, raf: 0, nativeMode: hasNativeAds, nativePresented: false };
  const tick = (now) => {
    if (!activeAd || !el.adDialog.open) return;
    if (activeAd.nativeMode) {
      if (ctx2d) drawAdScene(ctx2d, ((now - t0) % dur) / dur, kind);
      activeAd.raf = requestAnimationFrame(tick);
      return;
    }
    const elapsed = now - t0;
    const p = clamp(elapsed / dur, 0, 1);
    const rem = Math.max(0, Math.ceil((dur - elapsed) / 1000));
    el.adFill.style.width = `${Math.round(p * 100)}%`;
    el.adTimer.textContent = rem > 0 ? `${rem} ${tx('sn', 's')}` : tx('Ödül!', 'Reward!');
    if (ctx2d) drawAdScene(ctx2d, p, kind);
    if (p >= 1) {
      activeAd.done = true;
      finishActiveAd(true);
      return;
    }
    activeAd.raf = requestAnimationFrame(tick);
  };
  activeAd.raf = requestAnimationFrame(tick);
  if (hasNativeAds) {
    // the app gives up on a slow load after 12 s; this only catches a bridge that never answers at all
    setTimeout(() => { if (activeAd && activeAd.nativeMode && !activeAd.nativePresented && activeAd.kind === kind) window.onNativeAdUnavailable(); }, 16000);
    try { window.webkit.messageHandlers.ads.postMessage({ action: 'showRewarded', kind }); } catch (e) {
      activeAd.nativeMode = false;
      t0 = performance.now();
      el.adTimer.textContent = '5 sn';
    }
  }
}
window.onNativeAdPresented = () => {
  if (!activeAd) return;
  activeAd.nativePresented = true;
  el.adTimer.textContent = tx('Oynatılıyor', 'Playing');
};
window.onNativeAdClosed = (rewarded) => {
  if (!activeAd) return;
  activeAd.done = true;
  finishActiveAd(!!rewarded);
};
window.onNativeAdFallback = () => {
  if (!activeAd) return;
  activeAd.nativeMode = false;
  el.adTimer.textContent = '5 sn';
};
window.onNativeAdUnavailable = () => {
  if (!activeAd) return;
  const kind = activeAd.kind;
  finishActiveAd(false);
  Sound.deny();
  if (kind === 'shop50') note(tx('Şu an reklam yüklenemedi, lütfen internet bağlantını kontrol edip tekrar dene.', 'The ad could not be loaded right now. Please check your internet connection and try again.'));
  else el.tip.textContent = tx('Şu an reklam yüklenemedi, birazdan tekrar dene.', 'The ad could not be loaded right now. Try again in a moment.');
};
window.onNativeAdRewarded = () => finishActiveAd(true);
el.adDialog.addEventListener('cancel', (e) => {
  if (activeAd && !activeAd.done) e.preventDefault();
});
el.adDialog.addEventListener('close', () => {
  el.adDialog.returnValue = '';
  if (activeAd) {
    if (activeAd.raf) cancelAnimationFrame(activeAd.raf);
    activeAd = null;
  }
  Sound.resume();
});
el.btnAdClose.addEventListener('click', () => finishActiveAd(false));
function reviveFlight() {
  if (state !== 'over' || reviveUsed || doubleUsed) return;
  playRewardedAd('revive', tx('İzle ve Devam Et', 'Watch and Continue'), tx('Video bitince düştüğün yerden koruma kalkanıyla uçuşa devam edersin.', 'When the video ends you continue your flight from where you fell, with a protective shield.'), () => {
    reviveUsed = true;
    el.over.hidden = true;
    el.hud.hidden = false; el.btnPause.hidden = false; el.hudBestWrap.hidden = false; el.btnMute.hidden = MOBILE;
    if (!rec) rec = [];
    deathTimer = 0;
    bird.dead = false; bird.grounded = false; bird.spin = 0; bird.tn = 0; glider = null; chute = null;
    const gy = groundY(bird.x);
    bird.y = Math.min(gy - 220, Math.max(120, viewTop + VH * 0.36));
    bird.prevX = bird.x;
    bird.vy = -25; bird.ang = -0.06;
    bird.speed = Math.max(bird.speed, startSpeed() * 0.88);
    bird.inv = 2.8;
    touch.up = touch.down = false; pointers.clear();
    for (const o of obstacles) {
      if ((o.maxX ?? o.x) > bird.x - 100 && (o.minX ?? o.x) < bird.x + 450) o.dead = true;
    }
    shock(bird.x, bird.y, 'rgba(255,214,120,', 180);
    sparks(bird.x, bird.y, 20, 'gold', 240, 2.5);
    Sound.shield();
    if (typeof last === 'number') last = performance.now();
    if (touchMode) { state = 'paused'; resumeT = 2.1; $('countdown').hidden = false; }
    else { state = 'play'; }
  });
}
function doubleFeathers() {
  if (state !== 'over' || doubleUsed || lastEarned <= 0) return;
  playRewardedAd('double', tx('2× Altın Tüy Ödülü', '2× Golden Feather Reward'), tx('Video bitince bu uçuşta kazandığın altın tüyler ikiye katlanır!', 'When the video ends, the golden feathers from this flight are doubled!'), () => {
    doubleUsed = true;
    save.purse += lastEarned;
    paidEarned += lastEarned;
    persist();
    updatePurse();
    renderOverEarned();
    updateOverAdBtns();
    showProg();
    Sound.orb();
  });
}
function watchShopAd() {
  if (shopAdsLeft() <= 0) {
    note(tx('Bugünlük 2 video hakkını kullandın, yarın yenilenir!', 'You have used both videos for today. They refresh tomorrow!'));
    Sound.deny();
    return;
  }
  playRewardedAd('shop50', tx(`Mağaza Video Ödülü (+${AD_SHOP_REWARD} Tüy)`, `Shop Video Reward (+${AD_SHOP_REWARD} Feathers)`), tx(`Video bitince kesene anında +${AD_SHOP_REWARD} altın tüy eklenecek.`, `When the video ends, +${AD_SHOP_REWARD} golden feathers go straight into your purse.`), () => {
    syncAdDay();
    save.adCount++;
    save.purse += AD_SHOP_REWARD;
    persist();
    updatePurse();
    updateShopAdBtn();
    renderShop();
    Sound.orb();
    note(tx(`Video ödülü: +${AD_SHOP_REWARD} altın tüy kesene eklendi!`, `Video reward: +${AD_SHOP_REWARD} golden feathers added to your purse!`));
  });
}
el.btnRevive.addEventListener('click', reviveFlight);
el.btnDouble.addEventListener('click', doubleFeathers);
el.btnShopAd.addEventListener('click', watchShopAd);
// ad privacy: where the law asks for it (EEA, UK, Switzerland…) the app reports that a way back into the consent choices must be offered
window.onNativePrivacyOptions = (required) => { const row = $('adPrivacyRow'); if (row) row.hidden = !required; };
if ($('btnAdPrivacy')) $('btnAdPrivacy').addEventListener('click', () => {
  try { window.webkit.messageHandlers.ads.postMessage({ action: 'privacyOptions' }); } catch (e) { /* not in the app */ }
});
if (window.webkit && window.webkit.messageHandlers && window.webkit.messageHandlers.ads) {
  try { window.webkit.messageHandlers.ads.postMessage({ action: 'consentStatus' }); } catch (e) { /* ignore */ }
}
updateShopAdBtn();
