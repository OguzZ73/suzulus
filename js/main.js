// Süzülüş — Frame loop and boot
'use strict';

/* =========================================================
   Loop
   ========================================================= */
let last = performance.now(), perfT = 0, perfAcc = 0, perfN = 0;
function frame(now) {
  requestAnimationFrame(frame);
  const raw = (now - last) / 1000;
  last = now;
  let dt = raw;
  if (!(dt > 0)) dt = 1 / 60;
  if (dt > 0.05) dt = 0.05;
  if (raw > 0 && raw < 0.1) { perfT += raw; perfAcc += raw; perfN++; }
  if (perfT > 2.5) {
    const avg = perfAcc / perfN;
    if (time > 4 && perfN > 60 && avg > 1 / 40 && quality > (MOBILE ? 0.55 : 0.7)) { quality = Math.max(MOBILE ? 0.55 : 0.7, quality - 0.15); resize(); }
    perfT = perfAcc = perfN = 0;
  }
  update(dt);
  render();
  drawShopPreview();
}

let supportsDisplayTransition;
function canTransitionDisplay() {
  if (supportsDisplayTransition !== undefined) return supportsDisplayTransition;
  if (!window.CSS?.supports?.('transition-behavior', 'allow-discrete') || !document.body) return false;
  const probe = document.createElement('div');
  probe.style.cssText = 'transition: display 1s allow-discrete !important; display: block;';
  document.body.appendChild(probe);
  getComputedStyle(probe).display;
  probe.style.display = 'none';
  supportsDisplayTransition = getComputedStyle(probe).display === 'block';
  probe.remove();
  return supportsDisplayTransition;
}
async function hideElement(node) {
  if (!node || node.hidden) return;
  if (canTransitionDisplay()) node.hidden = true;
  else node.setAttribute('data-closing', '');
  const animations = node.getAnimations();
  if (animations.length > 0) {
    await Promise.race([
      Promise.allSettled(animations.map((a) => a.finished)),
      new Promise((r) => setTimeout(r, 1200)),
    ]);
  }
  if (node.hasAttribute('data-closing')) {
    node.removeAttribute('data-closing');
    node.hidden = true;
  }
}
function showElement(node) {
  if (!node) return;
  node.removeAttribute('data-closing');
  node.hidden = false;
}
if (!CSS.supports('animation-delay: calc(sibling-index() * 0.1s)')) {
  for (const id of ['introFeathers']) {
    const parent = $(id);
    if (parent) [...parent.children].forEach((c, i) => c.style.setProperty('--sibling-index', i + 1));
  }
  const hero = document.querySelector('#menu .hero');
  if (hero) [...hero.children].forEach((c, i) => c.style.setProperty('--sibling-index', i + 1));
}

function runOpeningIntro() {
  const introEl = $('intro');
  if (!introEl) { showElement(el.menu); return; }
  let done = false;
  const finishIntro = () => {
    if (done) return;
    done = true;
    clearTimeout(timer);
    placeCliff(0.25);
    showElement(el.menu);
    hideElement(introEl);
  };
  const timer = setTimeout(finishIntro, RM ? 450 : 2100);
  introEl.addEventListener('pointerdown', finishIntro, { once: true });
  window.addEventListener('keydown', (e) => {
    if (!done) { e.stopImmediatePropagation(); e.preventDefault(); finishIntro(); }
  }, { capture: true, once: true });
}

function boot() {
  resize();
  computePalette(dayT, 0);
  // extra faint stars that only show under the clear polar sky
  for (let i = 0; i < 260; i++) stars.push({ x: Math.random(), y: Math.pow(Math.random(), 1.15), s: rand(0.6, 1.4), b: rand(0.25, 0.85), tw: rand(1.2, 4), ph: rand(0, TAU), polar: true });
  for (let i = 0; i < 170; i++) stars.push({ x: Math.random(), y: Math.pow(Math.random(), 1.3), s: rand(0.7, 1.9), b: rand(0.35, 1), tw: rand(0.8, 3.5), ph: rand(0, TAU) });
  for (let i = 0; i < 7; i++) clouds.push(makeCloud(0, true));
  for (let i = 0; i < 4; i++) clouds.push(makeCloud(1, true));
  for (let i = 0; i < 3; i++) bgBalloons.push(makeBgBalloon(0, true, i));
  for (let i = 0; i < 3; i++) bgBalloons.push(makeBgBalloon(1, true, i));
  for (let i = 0; i < 4; i++) bgKites.push(makeBgKite(0, true, i));
  for (let i = 0; i < 4; i++) bgKites.push(makeBgKite(1, true, i));
  for (let i = 0; i < 9; i++) wisps.push({ x: rand(0, W + 400), y: rand(90, 540), len: rand(90, 210), amp: rand(4, 13), k: rand(3, 7), ph: rand(0, TAU), sp: rand(30, 90), par: rand(0.45, 0.8), a: rand(0.5, 1) });
  for (let i = 0; i < 18; i++) lines.push({ x: rand(0, W), y: rand(60, 640), len: rand(60, 180), sp: rand(1600, 2600) });
  placeCliff(1.85);
  bird.frac = MENU_FRAC();
  camX = cliff.x - 15 - W * bird.frac;
  computePalette(dayT, 0);
  retintClouds();
  showProg();
  featherBurst(cliff.x - 110, standY(cliff.x - 15) - 40, 12);
  runOpeningIntro();
  requestAnimationFrame((t) => { last = t; frame(t); });
}
boot();
// offline play and "add to home screen": the service worker only runs when the game is served over http(s)
if ('serviceWorker' in navigator && location.protocol !== 'file:') navigator.serviceWorker.register('sw.js').catch(() => {});
