// Süzülüş — Game state, save data, shop catalogue, DOM handles and particle helpers
'use strict';

/* =========================================================
   State
   ========================================================= */
const DAY_LEN = 200;
const BIRD_R = 13;
const SK = {
  dash: { dur: 2.6, cd: 7 },
  shield: { dur: 6, cd: 14 },
  slow: { dur: 3.6, cd: 15 },
};
const SKILL_NAMES = ['dash', 'shield', 'slow'];
const sk = { dash: { t: 0, cd: 0 }, shield: { t: 0, cd: 0 }, slow: { t: 0, cd: 0 } };

let state = 'menu';
let time = 0, gtime = 0, dayT = 0.015, timeScale = 1;
let camX = 0, camDx = 0, camV = 0;
// the launch cliff of the main menu: x is its edge, top the height of its brow; standK is 1 while the pilot stands on it
const cliff = { x: -1e9, top: 372 };
let standK = 0;
const STAND_FEET = 28;
let score = 0, dist = 0, startX = 0, featherCount = 0, ringCount = 0, thermalCount = 0, combo = 0, comboTimer = 0, maxCombo = 0;
let best = 0, bestAtStart = 0, bestAnnounced = false;
let shake = 0, flash = 0, slowAmt = 0, dashAmt = 0, ringBoost = 0, ringSlow = 0, shieldAmt = 0;
let deathTimer = 0, overAt = 0, featherChain = 0, lastFeatherT = -9;
let spawnX = 0, lastPattern = '', samePattern = 0;
let auroraStr = 0.8, lastPhase = '', phaseShowT = 0;
let retintT = 0, gust = 0, gustT = 0, wxDrift = 0;
// skimming low over the ground, and the counters the flight missions read
let skimT = 0, skimAcc = 0, skimPts = 0, skimOn = false, skimTotal = 0, skimFx = 0;
// ghost race: the best flight so far is replayed beside you; rec is this flight being written down
const GH_DT = 0.12;
let ghost = null, ghostRun = null, rec = null, recNext = 0, runT = 0, ghostFeathers = 0;
try {
  const g = JSON.parse(localStorage.getItem('suzulus-ghost') || 'null');
  if (g && Array.isArray(g.d) && g.d.length >= 30 && g.d.every(Number.isFinite)) ghost = { d: g.d, score: +g.score || 0 };
} catch (e) { ghost = null; }
let nearCount = 0, perfectCount = 0, missionFeathers = 0, missionsDone = 0, mission = null, missionWait = 0;
let bgBolt = null, bgBoltT = 8, shootT = 6, flock = null, flockT = 10;
const sun = { x: 0, y: 0, a: 0 }, moon = { x: 0, y: 0, a: 0 };

const obstacles = [], items = [], fx = [], popups = [], wp = [], flies = [], stars = [], clouds = [], bgBalloons = [], bgKites = [], lines = [], shooting = [], wisps = [];

const TRAIL_N = 26;
const bird = {
  x: 0, y: 300, vy: 0, speed: 230, ang: 0, phase: 0, pitch: 0,
  dead: false, grounded: false, spin: 0, inv: 0, frac: 0.27, prevX: 0,
  tx: new Float64Array(TRAIL_N), ty: new Float64Array(TRAIL_N), th: 0, tn: 0,
};

try { best = parseInt(localStorage.getItem('suzulus-best') || '0', 10) || 0; } catch (e) { best = 0; }
function saveBest() { try { localStorage.setItem('suzulus-best', String(best)); } catch (e) { /* ignore */ } }

const weather = { type: 'clear', amt: 1, phase: 'hold', timer: 30, next: 'clear' };
const WNAMES = EN
  ? { clear: '', snow: 'Snow', rain: 'Storm', petals: 'Spring breeze', blizzard: 'Blizzard' }
  : { clear: '', snow: 'Kar', rain: 'Fırtına', petals: 'Bahar esintisi', blizzard: 'Kar fırtınası' };

const keys = { up: false, down: false, left: false, right: false };
const touch = { up: false, down: false };
const pointers = new Map();
// touchMode: the last input was a finger, so letting go means diving; resumeT: the 3-2-1 before play resumes
let touchMode = MOBILE, resumeT = 0;
const buzz = (ms) => { if (touchMode && navigator.vibrate) { try { navigator.vibrate(ms); } catch (e) { /* not allowed */ } } };
const inUp = () => keys.up || touch.up;
const inDown = () => keys.down || touch.down;

/* =========================================================
   Progress: feather purse, store catalogue, upgrades
   ========================================================= */
const CAT = {
  sail: [
    { id: 'klasik', name: 'Klasik Delta', price: 0, ds: 'Dengeli üçgen delta yelken ve klasik alüminyum iskelet.', near: ['#fbf5e8', '#ddcdb0'], far: ['#a99a86', '#c4b49c'], sn: ['#34507e', '#d9574a', '#e9b34e'], sf: ['#2d3e5c', '#a84a3c', '#b8924c'] },
    { id: 'gunbatimi', name: 'Gün batımı · Kırlangıç', price: 250, ds: 'Kavisli martı kanadı, derin çatal kuyruk ve güneş ışını desenleri.', near: ['#ffe2b8', '#f2a06a'], far: ['#b77a5e', '#cf9572'], sn: ['#7a2e3a', '#e2563e', '#ffd36b'], sf: ['#5c2430', '#a8402f', '#c9a04c'] },
    { id: 'buzul', name: 'Buzul · Kristal', price: 450, ds: 'Keskin köşeli buz kristali kanat uçları ve prizmatik kesitler.', near: ['#eef8ff', '#bcdcf1'], far: ['#8aa6bd', '#a6c0d4'], sn: ['#20406e', '#3f8fd6', '#bfe9ff'], sf: ['#1a3052', '#2f6aa0', '#8fb8d4'] },
    { id: 'orman', name: 'Orman · Yaprak Telek', price: 700, ds: 'Katmanlı kuş telekleri, yaprak damarları ve ahşap omurga.', near: ['#e9f2dc', '#acc78f'], far: ['#7f9470', '#97ab86'], sn: ['#2f4a2a', '#6f9b46', '#e8c55a'], sf: ['#22381f', '#557a35', '#b89a46'] },
    { id: 'gece', name: 'Gece mavisi · Hilal', price: 1100, ds: 'Yarımay kavisli tırpan kanat ve parıldayan takımyıldız işlemeleri.', near: ['#4a4f86', '#262a58'], far: ['#2a2d55', '#3a3e6c'], sn: ['#c4b2ff', '#ffd27a', '#8de8ff'], sf: ['#9a8ad0', '#c9a45e', '#6ab6cc'] },
    { id: 'altin', name: 'Altın · Zümrüdüanka', price: 1800, ds: 'Çift katmanlı kraliyet telekleri, altın gaga ve uzun anka kuyruğu.', near: ['#fff3c8', '#e6b452'], far: ['#b48a3e', '#c9a050'], sn: ['#8a5a1a', '#ffffff', '#b8862c'], sf: ['#6a4412', '#e8e0cc', '#8e6a24'] },
    // the premium line: animated wings that glow, shimmer and trail light
    { id: 'ejder', premium: true, name: 'Ejder · Kor Kanat', price: 2600, ds: 'Kemik parmaklı ejderha zarı, nabız gibi atan kor damarlar, boynuzlu burun ve kıvılcım saçan dikenli kuyruk.', near: ['#9a2c2c', '#4a1018'], far: ['#521620', '#6b1d24'], sn: ['#ff8a2e', '#2a0a10', '#ffe0a0'], sf: ['#c86a26', '#1c070b', '#d9b47a'] },
    { id: 'vitray', premium: true, name: 'Vitray · Kelebek', price: 3200, ds: 'Kurşun çerçeveli vitray kelebek kanadı: içinden ışık geçen mücevher camlar, inci benekli kenar ve antenler.', near: ['#2a1c3a', '#1a1028'], far: ['#1c1230', '#241838'], sn: ['#ffd36b', '#120c1c', '#ffffff'], sf: ['#c9a04c', '#0e0a16', '#d8d8e8'] },
    { id: 'aurora', premium: true, name: 'Aurora · Kuzey Işığı', price: 4000, ds: 'Gece göğünden kesilmiş kanat: üzerinde akan canlı kuzey ışıkları, göz kırpan yıldızlar ve ışıktan kuyruk şeritleri.', near: ['#1b2a5e', '#0e1a3c'], far: ['#141f48', '#1a2a58'], sn: ['#bafff0', '#6f8cff', '#ffffff'], sf: ['#8fd8c8', '#5568c0', '#d8e4ff'] },
  ],
  scarf: [
    { id: 'kirmizi', name: 'Kırmızı', price: 0, c: ['#ea5a4c', '#a92f2b'] },
    { id: 'turkuaz', name: 'Turkuaz', price: 80, c: ['#4fd1c5', '#1f8a86'] },
    { id: 'sari', name: 'Hardal', price: 80, c: ['#f2c84b', '#b98a1c'] },
    { id: 'mor', name: 'Mor', price: 120, c: ['#a98bff', '#5b3fb0'] },
    { id: 'beyaz', name: 'Kar beyazı', price: 150, c: ['#ffffff', '#cdd6e2'] },
    { id: 'zumrut', name: 'Zümrüt', price: 220, c: ['#55d68a', '#1d7a46'] },
  ],
  pilot: [
    { id: 'ruzgar', name: 'Rüzgâr', price: 0, ds: 'Dağınık kestane saçlı, kürklü deri pilot montlu genç kaşif. Her şeyi dengeli yapar.', stats: 'Erkek · Deri Mont · Hız: Normal · Manevra: Dengeli', helmet: '#d8d2c4', suit: ['#a8744a', '#7a4e2c', '#4e2f18'], arm: ['#5a381e', '#80522e'], pants: ['#2c3c54', '#3b4e6d'], boots: ['#563823', '#6b4529'], glove: '#523218', speed: 1, climb: 1, dive: 1, turn: 1, sink: 30, magnet: 1 },
    { id: 'atmaca', name: 'Atmaca', price: 650, ds: 'Uzun kızıl saçlı, altın kuşaklı bordo avcı tunikli kadın pilot. Daha hızlı uçar.', stats: 'Kız · Avcı Tuniği · Hız: +%8 · Manevra: Standart', helmet: '#c9483c', suit: ['#c43c48', '#8a2230', '#52101a'], arm: ['#6e1c26', '#9e2836'], pants: ['#2c2033', '#3b2c44'], boots: ['#7a2226', '#982c32'], glove: '#5e1620', speed: 1.08, climb: 0.9, dive: 1, turn: 1, sink: 34, magnet: 1 },
    { id: 'bulut', name: 'Bulut', price: 650, ds: 'Uzun sarı örgülü, beyaz kürklü kuzey parkalı kadın gezgin. Çok uzun süzülür.', stats: 'Kız · Kürklü Parka · Hız: −%5 · Süzülüş: Çok uzun', helmet: '#e8eef4', suit: ['#88c2e8', '#5694c0', '#366890'], arm: ['#467ea8', '#68a2cc'], pants: ['#627284', '#7a8b9e'], boots: ['#845c3e', '#9e704e'], glove: '#f0f5fa', speed: 0.95, climb: 1.05, dive: 0.95, turn: 1, sink: 8, magnet: 1 },
    { id: 'dogan', name: 'Doğan', price: 1000, ds: 'Uzun siyah at kuyruklu, zırhlı karbon hız tulumlu ve pelerinli erkek pilot.', stats: 'Erkek · Zırhlı Tulum · Hız: +%18 · Manevra: Çok keskin', helmet: '#23324d', visor: '#66f0ff', crest: '#ff6e4a', suit: ['#3b455c', '#202736', '#10141d'], arm: ['#191f2b', '#2b3447'], pants: ['#161b26', '#212838'], boots: ['#1a212e', '#263042'], glove: '#161c28', speed: 1.18, climb: 1.25, dive: 1.25, turn: 1.75, sink: 26, magnet: 1.15 },
    { id: 'yildiz', name: 'Yıldız', price: 1500, ds: 'Uzun gece-moru saçlı, altın işlemeli kraliyet elbiseli ve pelerinli kadın pilot.', stats: 'Kız · Kraliyet Elbisesi · Hız: Normal · Çekim: ×2', helmet: '#e6b84a', suit: ['#885ee0', '#5430a0', '#2e1668'], arm: ['#442488', '#643cb8'], pants: ['#231740', '#322258'], boots: ['#b88828', '#dba83c'], glove: '#fff2cc', speed: 1, climb: 1, dive: 1, turn: 1, sink: 30, magnet: 2 },
    // the premium line: animated outfits with their own light
    { id: 'kor', premium: true, name: 'Kor', price: 2200, ds: 'Çatlaklarından kor ışığı sızan obsidyen zırhlı, boynuzlu miğferli ejder şövalyesi. Alev pelerini arkasında kıvılcım bırakır.', stats: 'Erkek · Ejder Zırhı · Hız: +%14 · Dalış: Çok güçlü · Çekim: ×1,3', helmet: '#1a1216', visor: '#ffb347', suit: ['#3a2a30', '#1e1418', '#0c080a'], arm: ['#160e12', '#2a1c22'], pants: ['#120c10', '#1c1418'], boots: ['#241418', '#34202a'], glove: '#0e0a0c', speed: 1.14, climb: 1.15, dive: 1.3, turn: 1.5, sink: 28, magnet: 1.3 },
    { id: 'luna', premium: true, name: 'Luna', price: 2800, ds: 'Uzun gümüş saçlı ay rahibesi: hilal taç, yıldız tutan saydam duvak ve ay ışığı haresi. Neredeyse hiç alçalmadan süzülür.', stats: 'Kız · Ay Cübbesi · Süzülüş: En uzun · Çekim: ×1,7', helmet: '#dfe8ff', suit: ['#f4f8ff', '#bcd0ee', '#7e98c8'], arm: ['#8ea6d0', '#c4d6f2'], pants: ['#5a6a98', '#7486b4'], boots: ['#e8eefc', '#ffffff'], glove: '#ffffff', speed: 0.97, climb: 1.1, dive: 0.95, turn: 1.1, sink: 4, magnet: 1.7 },
    { id: 'nova', premium: true, name: 'Nova', price: 3400, ds: 'Altın vizörlü cam başlıklı astronot: yanıp sönen gösterge ışıkları, antenli miğfer ve alev püskürten sırt roketi.', stats: 'Astronot · Uzay Giysisi · Hız: +%10 · Manevra: En keskin · Çekim: ×1,5', helmet: '#f4f6fa', visor: '#ffc857', suit: ['#ffffff', '#dfe5ee', '#a8b2c4'], arm: ['#b8c0d0', '#eef2f8'], pants: ['#c8d0dc', '#e6ebf2'], boots: ['#ff7a3c', '#ff9455'], glove: '#ff7a3c', speed: 1.1, climb: 1.2, dive: 1.05, turn: 1.6, sink: 18, magnet: 1.5 },
  ],
};
const UPGRADES = [
  { id: 'dash', name: 'Rüzgar atılımı', key: 'S' },
  { id: 'shield', name: 'Işık kalkanı', key: 'D' },
  { id: 'slow', name: 'Zamanı yavaşlat', key: 'F' },
];
const UP_COST = [300, 750, 1500, 2700], UP_MAX = 4;
/* skill tree: at levels 2 and 4 each skill branches in two; a bought branch can be swapped for its twin at no cost, one per tier is active */
const PERK_LVL = [2, 4], PERK_COST = [1200, 3000];
const PERKS = {
  dash: [
    [{ id: 'dash1a', name: 'Kombo nefesi', ds: 'Atılım sürerken kombo süresi azalmaz.' },
     { id: 'dash1b', name: 'Geniş mıknatıs', ds: 'Atılımda tüyleri çok daha uzaktan çekersin.' }],
    [{ id: 'dash2a', name: 'Delici atılım', ds: 'Atılımda şahinleri, balonları ve uçurtmaları parçalarsın.' },
     { id: 'dash2b', name: 'Kısa soluk', ds: 'Atılımın bekleme süresi %35 kısalır.' }],
  ],
  shield: [
    [{ id: 'shield1a', name: 'Çift katman', ds: 'Kalkan kırılmadan önce iki darbeye dayanır.' },
     { id: 'shield1b', name: 'Hızlı onarım', ds: 'Kırılan kalkanın bekleme süresi yarıya iner.' }],
    [{ id: 'shield2a', name: 'Şok dalgası', ds: 'Kalkan kırılınca yakındaki şahin, balon ve uçurtmaları siler.' },
     { id: 'shield2b', name: 'Son şans', ds: 'Her uçuşta bir kez, ölümcül bir çarpmadan kurtulursun.' }],
  ],
  slow: [
    [{ id: 'slow1a', name: 'Altın zaman', ds: 'Zaman yavaşken her tüy iki sayılır.' },
     { id: 'slow1b', name: 'Derin odak', ds: 'Zaman çok daha fazla yavaşlar.' }],
    [{ id: 'slow2a', name: 'Uzayan an', ds: 'Zaman yavaşken her tüy süreyi uzatır (en çok +3 sn).' },
     { id: 'slow2b', name: 'Hızlı dönüş', ds: 'Zamanın bekleme süresi %35 kısalır.' }],
  ],
};
// English names and descriptions, laid over the Turkish catalogue by id
if (EN) {
  const tr = {
    sail: {
      klasik: ['Classic Delta', 'A balanced triangular delta sail on a classic aluminium frame.'],
      gunbatimi: ['Sunset · Swallow', 'An arched gull wing, a deep forked tail and sunburst patterns.'],
      buzul: ['Glacier · Crystal', 'Sharp ice-crystal wingtips and prismatic facets.'],
      orman: ['Forest · Leaf Quill', 'Layered bird quills, leaf veins and a wooden spine.'],
      gece: ['Midnight · Crescent', 'A crescent-curved scythe wing with glittering constellation embroidery.'],
      altin: ['Golden · Phoenix', 'Double-layered royal quills, a golden beak and a long phoenix tail.'],
      ejder: ['Dragon · Ember Wing', 'A bone-fingered dragon membrane, ember veins that pulse like a heartbeat, a horned nose and a spiked tail that throws sparks.'],
      vitray: ['Stained Glass · Butterfly', 'A lead-framed stained-glass butterfly wing: jewel glass lit from within, pearl-dotted edges and antennae.'],
      aurora: ['Aurora · Northern Lights', 'A wing cut from the night sky: living northern lights flowing across it, twinkling stars and ribbons of light for a tail.'],
    },
    scarf: { kirmizi: ['Red'], turkuaz: ['Turquoise'], sari: ['Mustard'], mor: ['Purple'], beyaz: ['Snow white'], zumrut: ['Emerald'] },
    pilot: {
      ruzgar: ['Breeze', 'A young explorer with messy chestnut hair and a fur-lined leather flight jacket. Good at everything.', 'Male · Leather Jacket · Speed: Normal · Handling: Balanced'],
      atmaca: ['Hawk', 'A pilot with long red hair in a burgundy hunter’s tunic with a golden sash. Flies faster.', 'Female · Hunter Tunic · Speed: +8% · Handling: Standard'],
      bulut: ['Cloud', 'A northern traveller with long blonde braids in a white fur-trimmed parka. Glides for a very long time.', 'Female · Fur Parka · Speed: −5% · Glide: Very long'],
      dogan: ['Falcon', 'A pilot with a long black ponytail, an armoured carbon speed suit and a cape.', 'Male · Armoured Suit · Speed: +18% · Handling: Very sharp'],
      yildiz: ['Star', 'A pilot with long midnight-purple hair in a gold-embroidered royal gown and cape.', 'Female · Royal Gown · Speed: Normal · Magnet: ×2'],
      kor: ['Ember', 'A dragon knight in horned helm and obsidian armour, ember light seeping through the cracks. A cape of flame leaves sparks behind.', 'Male · Dragon Armour · Speed: +14% · Dive: Very strong · Magnet: ×1.3'],
      luna: ['Luna', 'A moon priestess with long silver hair: a crescent crown, a sheer star-filled veil and a halo of moonlight. Glides with almost no sink.', 'Female · Moon Robe · Glide: Longest · Magnet: ×1.7'],
      nova: ['Nova', 'An astronaut in a glass helmet with a gold visor: blinking indicator lights, an antenna and a flame-spitting jetpack.', 'Astronaut · Space Suit · Speed: +10% · Handling: Sharpest · Magnet: ×1.5'],
    },
  };
  for (const k of Object.keys(tr)) for (const it of CAT[k]) {
    const e = tr[k][it.id];
    if (!e) continue;
    it.name = e[0];
    if (e[1]) it.ds = e[1];
    if (e[2]) it.stats = e[2];
  }
  const up = { dash: 'Wind dash', shield: 'Light shield', slow: 'Slow time' };
  for (const u of UPGRADES) u.name = up[u.id];
  const pk = {
    dash1a: ['Combo breath', 'The combo timer does not run down while you dash.'],
    dash1b: ['Wide magnet', 'While dashing you pull in feathers from much farther away.'],
    dash2a: ['Piercing dash', 'Dash through hawks, balloons and kites to smash them.'],
    dash2b: ['Short breath', 'Dash cooldown is 35% shorter.'],
    shield1a: ['Double layer', 'The shield takes two hits before it breaks.'],
    shield1b: ['Quick repair', 'A broken shield’s cooldown is halved.'],
    shield2a: ['Shockwave', 'When the shield breaks it wipes out nearby hawks, balloons and kites.'],
    shield2b: ['Last chance', 'Once per flight you survive a fatal crash.'],
    slow1a: ['Golden time', 'While time is slowed every feather counts double.'],
    slow1b: ['Deep focus', 'Time slows down much more.'],
    slow2a: ['Stretched moment', 'While time is slowed every feather makes it last longer (up to +3 s).'],
    slow2b: ['Quick return', 'Slow time cooldown is 35% shorter.'],
  };
  for (const p of Object.values(PERKS).flat(2)) { p.name = pk[p.id][0]; p.ds = pk[p.id][1]; }
}
const PERK_IDS = Object.values(PERKS).flat(2).map((p) => p.id);
// everything in the workshop has to be saved up for
for (const k of Object.keys(CAT)) for (const it of CAT[k]) it.price *= 3;
const SK_BASE = {};
for (const n of SKILL_NAMES) SK_BASE[n] = { dur: SK[n].dur, cd: SK[n].cd };
const save = { purse: 0, owned: { sail: ['klasik'], scarf: ['kirmizi'], pilot: ['ruzgar'] }, equip: { sail: 'klasik', scarf: 'kirmizi', pilot: 'ruzgar' }, up: { dash: 0, shield: 0, slow: 0 }, perkOwn: [], perkOn: { dash: [null, null], shield: [null, null], slow: [null, null] }, xp: 0, quests: [], adDay: '', adCount: 0, ghostOn: true, iapTx: [] };
try {
  const raw = JSON.parse(localStorage.getItem('suzulus-save') || 'null');
  if (raw && typeof raw === 'object') {
    if (Number.isFinite(raw.purse)) save.purse = Math.max(0, raw.purse | 0);
    for (const k of Object.keys(save.owned)) {
      if (raw.owned && Array.isArray(raw.owned[k])) save.owned[k] = [...new Set([save.owned[k][0], ...raw.owned[k].filter((id) => CAT[k].some((x) => x.id === id))])];
      if (raw.equip && save.owned[k].includes(raw.equip[k])) save.equip[k] = raw.equip[k];
    }
    if (raw.up) for (const n of SKILL_NAMES) save.up[n] = clamp(raw.up[n] | 0, 0, UP_MAX);
    if (Array.isArray(raw.perkOwn)) save.perkOwn = [...new Set(raw.perkOwn.filter((id) => PERK_IDS.includes(id)))];
    if (raw.perkOn) for (const n of SKILL_NAMES) for (let t = 0; t < 2; t++) {
      const id = raw.perkOn[n] && raw.perkOn[n][t];
      if (save.perkOwn.includes(id) && PERKS[n][t].some((p) => p.id === id)) save.perkOn[n][t] = id;
    }
    if (Number.isFinite(raw.xp)) save.xp = Math.max(0, raw.xp | 0);
    if (Array.isArray(raw.quests)) save.quests = raw.quests.filter((q) => q && typeof q.k === 'string' && q.goal > 0 && q.xp > 0 && Number.isFinite(q.p)).slice(0, 3).map((q) => ({ k: q.k, goal: q.goal | 0, xp: q.xp | 0, p: Math.max(0, q.p), wait: !!q.wait }));
    if (typeof raw.adDay === 'string') save.adDay = raw.adDay;
    if (Number.isFinite(raw.adCount)) save.adCount = Math.max(0, raw.adCount | 0);
    if (Array.isArray(raw.iapTx)) save.iapTx = raw.iapTx.filter((t) => typeof t === 'string').slice(-100);
    if (typeof raw.ghostOn === 'boolean') save.ghostOn = raw.ghostOn;
  }
} catch (e) { /* fresh save */ }
function persist() { try { localStorage.setItem('suzulus-save', JSON.stringify(save)); } catch (e) { /* ignore */ } }
const AD_DAILY_MAX = 2, AD_SHOP_REWARD = 50;
const FEATHER_PACKS = [
  { id: 'com.suzulus.oyun.feathers300', amount: 300, title: 'Başlangıç Kesesi', badge: 'Başlangıç', ds: 'İlk yetenek yükseltmeni veya atkını hemen aç.' },
  { id: 'com.suzulus.oyun.feathers750', amount: 750, title: 'Rüzgâr Sandığı', badge: '%20 Avantajlı', ds: 'İlk kanadını ve temel yetenek yükseltmelerini aç.' },
  { id: 'com.suzulus.oyun.feathers1800', amount: 1800, title: 'Altın Hazine', badge: 'En Popüler · %33 Avantajlı', ds: 'Yeni bir pilotu veya ileri seviye kanatları anında aç.', featured: true },
  { id: 'com.suzulus.oyun.feathers5000', amount: 5000, title: 'Gökyüzü Hazinesi', badge: 'En Karlı · %50 Avantajlı', ds: 'Zümrüdüanka kanadı ve Yıldız pilotu dahil en üst ekipmanları aç.', featured: true },
];
if (EN) {
  const en = [
    ['Starter Pouch', 'Starter', 'Unlock your first skill upgrade or scarf right away.'],
    ['Wind Chest', '20% Bonus', 'Unlock your first wing and the basic skill upgrades.'],
    ['Golden Hoard', 'Most Popular · 33% Bonus', 'Instantly unlock a new pilot or advanced wings.'],
    ['Sky Treasure', 'Best Value · 50% Bonus', 'Unlock top gear, including the Phoenix wing and the Star pilot.'],
  ];
  FEATHER_PACKS.forEach((p, i) => { [p.title, p.badge, p.ds] = en[i]; });
}
let reviveUsed = false, doubleUsed = false, paidEarned = 0, lastEarned = 0;
function todayKey() {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
}
function syncAdDay() {
  const t = todayKey();
  if (save.adDay !== t) { save.adDay = t; save.adCount = 0; }
}
function shopAdsLeft() {
  syncAdDay();
  return Math.max(0, AD_DAILY_MAX - save.adCount);
}
/* account level: missions pay XP, XP raises the level, the level raises the speed a flight starts at */
const LVL_MAX = 40;
const xpNeed = (l) => 80 + 40 * (l - 1);
function levelInfo() {
  let l = 1, x = save.xp;
  while (l < LVL_MAX && x >= xpNeed(l)) { x -= xpNeed(l); l++; }
  return { l, x, need: xpNeed(l), max: l >= LVL_MAX };
}
// goal and reward by tier; "one" missions must be done within a single flight
const QUESTS = {
  dist: { t: (g) => tx(`Toplam ${fmt(g)} m uç`, `Fly ${fmt(g)} m in total`), goal: [1500, 3000, 5000, 8000], xp: [40, 70, 100, 150] },
  feather: { t: (g) => tx(`${g} altın tüy topla`, `Collect ${g} golden feathers`), goal: [40, 80, 140, 220], xp: [40, 70, 100, 140] },
  ring: { t: (g) => tx(`${g} rüzgar halkasından geç`, `Fly through ${g} wind rings`), goal: [8, 15, 25, 40], xp: [40, 65, 95, 130] },
  thermal: { t: (g) => tx(`${g} hava akımı yakala`, `Catch ${g} air currents`), goal: [4, 8, 14, 20], xp: [35, 60, 90, 120] },
  near: { t: (g) => tx(`${g} kıl payı geçiş yap`, `Make ${g} near misses`), goal: [5, 10, 18, 30], xp: [45, 75, 110, 150] },
  portal: { t: (g) => tx(`${g} portaldan geç`, `Fly through ${g} portals`), goal: [1, 2, 3, 5], xp: [40, 70, 100, 150] },
  skill: { t: (g) => tx(`Yetenekleri ${g} kez kullan`, `Use skills ${g} times`), goal: [6, 12, 20, 30], xp: [30, 50, 75, 100] },
  oneDist: { one: true, t: (g) => tx(`Tek uçuşta ${fmt(g)} m uç`, `Fly ${fmt(g)} m in one flight`), goal: [400, 700, 1100, 1600], xp: [45, 80, 120, 170] },
  oneScore: { one: true, t: (g) => tx(`Tek uçuşta ${fmt(g)} puan yap`, `Score ${fmt(g)} points in one flight`), goal: [1500, 4000, 8000, 15000], xp: [45, 80, 120, 170] },
  oneCombo: { one: true, t: (g) => tx(`Tek uçuşta ×${g} komboya ulaş`, `Reach a ×${g} combo in one flight`), goal: [3, 4, 5, 6], xp: [45, 75, 110, 150] },
};
const questDone = []; // missions finished during the current flight
let questM = 0, runLvl = 1, lvlAtStart = 1;
function newQuest(wait) {
  const kinds = Object.keys(QUESTS).filter((k) => !save.quests.some((q) => q.k === k));
  const k = kinds[(Math.random() * kinds.length) | 0];
  const tier = clamp(Math.floor((levelInfo().l - 1) / 4) - (Math.random() < 0.3 ? 1 : 0), 0, 3);
  return { k, goal: QUESTS[k].goal[tier], xp: QUESTS[k].xp[tier], p: 0, wait: !!wait };
}
save.quests = save.quests.filter((q) => QUESTS[q.k]);
while (save.quests.length < 3) save.quests.push(newQuest(false));
function finishQuest(i) {
  const q = save.quests[i], before = levelInfo().l;
  save.xp += q.xp;
  questDone.push({ text: QUESTS[q.k].t(q.goal), xp: q.xp });
  // the next mission takes this one's place and starts counting on the following flight
  save.quests[i] = newQuest(true);
  persist();
  popup(tx(`Görev tamamlandı  +${q.xp} XP`, `Mission complete  +${q.xp} XP`), '#ffd27a', true);
  const now = levelInfo().l;
  if (now > before) { popup(tx(`Seviye ${now}`, `Level ${now}`), '#ffffff', true); el.hudLvl.textContent = String(now); }
  Sound.record(); buzz([15, 30, 15]);
}
// count n more toward every running mission of this kind
function quest(kind, n = 1) {
  if (watching) return;
  if (state !== 'play') return;
  for (let i = 0; i < save.quests.length; i++) {
    const q = save.quests[i];
    if (q.k !== kind || q.wait) continue;
    q.p = Math.min(q.goal, q.p + n);
    if (q.p >= q.goal) finishQuest(i);
  }
}
// single-flight missions keep the best value reached in this flight
function questMax(kind, v) {
  if (watching) return;
  for (let i = 0; i < save.quests.length; i++) {
    const q = save.quests[i];
    if (q.k !== kind || q.wait || v <= q.p) continue;
    q.p = Math.min(q.goal, v);
    if (q.p >= q.goal) finishQuest(i);
  }
}
function progHTML(over) {
  const L = levelInfo(), esc = (t) => t.replace(/</g, '&lt;');
  let h = `<div class="lvl"><span class="lv">${tx('Seviye', 'Level')} ${L.l}</span><i class="bar"><b style="width:${L.max ? 100 : Math.round((L.x / L.need) * 100)}%"></b></i><span class="xp">${L.max ? tx('En üst seviye', 'Max level') : `${fmt(L.x)} / ${fmt(L.need)} XP`}</span></div>`;
  if (over && L.l > lvlAtStart) h += (EN ? `<p class="lvup">Level up: level ${L.l} · your starting speed went up</p>` : `<p class="lvup">Seviye atladın: ${L.l}. seviye · başlangıç hızın arttı</p>`);
  h += `<h3>${tx('Görevler', 'Missions')}</h3><ul class="quests">`;
  if (over) for (const d of questDone) h += `<li class="done"><span class="qt">✓ ${esc(d.text)}</span><span class="qx">+${d.xp} XP</span></li>`;
  for (const q of save.quests) {
    const shown = Math.floor(q.p);
    h += `<li${q.wait && over ? ' class="wait"' : ''}><span class="qt">${esc(QUESTS[q.k].t(q.goal))}<span class="qp">${q.wait && over ? tx('yeni', 'new') : `${fmt(shown)} / ${fmt(q.goal)}`}</span></span><span class="qx">${q.xp} XP</span><i class="bar"><b style="width:${Math.round((q.p / q.goal) * 100)}%"></b></i></li>`;
  }
  return h + '</ul>';
}
function showProg() { $('menuProg').innerHTML = progHTML(false); $('overProg').innerHTML = progHTML(true); }
const pick = (k) => CAT[k].find((x) => x.id === save.equip[k]) || CAT[k][0];
const pilotStat = () => pick('pilot');
// upgrade levels: +15% duration and -10% cooldown per level
function applyUpgrades() {
  for (const n of SKILL_NAMES) {
    const l = save.up[n];
    SK[n].dur = SK_BASE[n].dur * (1 + 0.15 * l);
    SK[n].cd = SK_BASE[n].cd * (1 - 0.1 * l);
  }
  if (perk('dash2b')) SK.dash.cd *= 0.65;
  if (perk('slow2b')) SK.slow.cd *= 0.65;
}
// is this branch of the tree switched on (and its skill level high enough to carry it)?
function perk(id) {
  const n = id.replace(/\d.*$/, ''), t = +id.match(/\d/)[0] - 1;
  return save.perkOn[n][t] === id && save.up[n] >= PERK_LVL[t];
}
// per flight: hits the shield can still take, the one-off last chance, how far the slow has been stretched
let shieldHits = 1, lastChanceUsed = false, slowExt = 0;
// watch mode: the glider flies itself through an empty sky, nothing to hit, nothing to score
let watching = false;
applyUpgrades();
// the look of the flyer: gradients, wing shape id, pilot id and outfit colours used by paintBird
const LOOK = { sailId: 'klasik', pilotId: 'ruzgar', sn: CAT.sail[0].sn, sf: CAT.sail[0].sf, arm: CAT.pilot[0].arm, pants: CAT.pilot[0].pants, boots: CAT.pilot[0].boots, glove: CAT.pilot[0].glove, helmet: CAT.pilot[0].helmet, visor: null, crest: null };
function applyLook(ovTab, ovItem) {
  const sail = (ovTab === 'sail' && ovItem) ? ovItem : pick('sail');
  const scarf = (ovTab === 'scarf' && ovItem) ? ovItem : pick('scarf');
  const pilot = (ovTab === 'pilot' && ovItem) ? ovItem : pick('pilot');
  let g = bctx.createLinearGradient(0, -8, 0, 8);
  g.addColorStop(0, pilot.suit[0]); g.addColorStop(0.5, pilot.suit[1]); g.addColorStop(1, pilot.suit[2]);
  G.tunic = g;
  g = bctx.createLinearGradient(0, -30, 0, -4);
  g.addColorStop(0, sail.near[0]); g.addColorStop(1, sail.near[1]);
  G.sailNear = g;
  g = bctx.createLinearGradient(0, -46, 0, -26);
  g.addColorStop(0, sail.far[0]); g.addColorStop(1, sail.far[1]);
  G.sailFar = g;
  g = bctx.createLinearGradient(0, -6, 0, 6);
  g.addColorStop(0, scarf.c[0]); g.addColorStop(1, scarf.c[1]);
  G.scarf = g;
  LOOK.sailId = sail.id; LOOK.pilotId = pilot.id; LOOK.scarf = scarf.c;
  LOOK.sn = sail.sn; LOOK.sf = sail.sf; LOOK.arm = pilot.arm; LOOK.pants = pilot.pants; LOOK.boots = pilot.boots; LOOK.glove = pilot.glove; LOOK.helmet = pilot.helmet;
  LOOK.visor = pilot.visor || null; LOOK.crest = pilot.crest || null;
}
applyLook();

/* =========================================================
   DOM
   ========================================================= */
const el = {
  hud: $('hud'), score: $('score'), dist: $('dist'), feathers: $('feathers'), combo: $('combo'), mult: $('mult'), comboFill: $('comboFill'),
  hudLvl: $('hudLvl'), phase: $('phase'), menu: $('menu'), pause: $('pause'), over: $('over'), menuBest: $('menuBest'),
  hudBest: $('hudBest'), hudBestWrap: $('hudBestWrap'), btnPause: $('btnPause'), btnMute: $('btnMute'),
  earned: $('earned'), finalScore: $('finalScore'), record: $('record'), stDist: $('stDist'), stFeathers: $('stFeathers'), stRings: $('stRings'), stCombo: $('stCombo'), tip: $('tip'),
  btnShopAd: $('btnShopAd'), overAds: $('overAds'), btnRevive: $('btnRevive'), btnDouble: $('btnDouble'),
  adDialog: $('adDialog'), adTitle: $('adTitle'), adTimer: $('adTimer'), btnAdClose: $('btnAdClose'), adCanvas: $('adCanvas'), adFill: $('adFill'), adDesc: $('adDesc'), adCaption: $('adCaption'),
};
const fmt = (n) => Math.floor(n).toLocaleString(EN ? 'en-US' : 'tr-TR');
const skillEls = {};
document.querySelectorAll('.skill').forEach((b) => {
  skillEls[b.dataset.skill] = b;
  b.addEventListener('touchstart', (e) => e.preventDefault(), { passive: false });
  b.addEventListener('pointerdown', (e) => { e.preventDefault(); e.stopPropagation(); useSkill(b.dataset.skill); });
});
el.menuBest.textContent = fmt(best);
el.btnMute.classList.toggle('muted', Sound.muted);

const TIPS = EN ? [
  'Passing very close to an obstacle gives a near-miss bonus and grows your combo.',
  'If you touch the ground with the shield up, the shield breaks but you bounce back into the air.',
  'During a wind dash distance points double and feathers are pulled in from farther away.',
  'The blue spirit orb recharges all your skills at once.',
  'When a storm cloud flashes, stay away from the column marked with a dashed line.',
  'A red marker on the right edge of the screen shows a hawk coming in.',
  'Flying through the middle of a wind ring gives you a short burst of speed.',
  'Blue slowing rings brake you at once; handy before a tight gap when you are going fast.',
  'Do a new trick before the combo timer runs out and the multiplier keeps growing.',
  'Fly into a shimmering air current and the glider climbs on its own while your combo grows.',
  'Spend the feathers you collect in the Shop on new wings, pilots and upgrades.',
  'In the land of lakes and waterfalls, watch out for the domes and baskets of drifting hot-air balloons.',
  'Every 250 metres and every air current you catch adds extra feathers to your purse.',
  'Every 1,200 metres a portal appears in the sky; each one opens onto a random land, so if you skip one the next may lead somewhere else.',
  'Diving speeds the glider up and climbing slows it down; lift the nose before a narrow gap to catch your breath.',
  'Glide within a wing’s length of the ground to score “ground skim” points and keep your combo alive.',
  'Hit the light right in the centre of a wind ring for a “bullseye”: double points and extra combo.',
  'Missions give XP, XP raises your level, and the higher your level the faster you start each flight.',
  'Fly through the portal to jump to another land; fly past it and you stay where you are.',
  'Your best flight flies beside you as a pale ghost; pass it for points, outlast it for bonus feathers.',
  'In Fire Valley lava columns are marked with a dashed line before they erupt; wait for them to die down or fly over.',
  'On a touch screen, use the buttons on the right to climb and dive; slide your finger to switch between them. Skills are on the left.',
  'At the Pole the sky is always in twilight; it is the best place to see the northern lights and the Milky Way.',
] : [
  'Bir engelin çok yakınından geçmek kıl payı bonusu verir ve komboyu büyütür.',
  'Kalkan açıkken yere değersen kalkan kırılır ama sen havaya sekersin.',
  'Rüzgar atılımı sırasında mesafe puanı iki katına çıkar ve tüyler sana daha uzaktan çekilir.',
  'Mavi ruh küresi tüm yeteneklerini anında yeniler.',
  'Fırtına bulutu parladığında kesikli çizgiyle işaretlenen sütundan uzak dur.',
  'Ekranın sağ kenarındaki kırmızı işaret yaklaşan bir şahini gösterir.',
  'Rüzgar halkalarının ortasından geçmek seni kısa süre hızlandırır.',
  'Mavi yavaşlatma halkaları seni anında frenler; hızlandıkça zorlu geçitlerden önce işine yarar.',
  'Kombo süresi dolmadan yeni bir numara yaparsan çarpan büyümeye devam eder.',
  'Parıldayan hava akımlarına girersen planör kendiliğinden yükselir ve kombon büyür.',
  'Topladığın tüyleri Mağaza’da yeni kanatlara, karakterlere ve yükseltmelere harcayabilirsin.',
  'Göller ve şelaleler diyarında süzülen sıcak hava balonlarının kubbe ve sepetlerine çarpmamaya dikkat et.',
  'Her 250 metre ve yakaladığın her hava akımı kesene ekstra tüy kazandırır.',
  'Her 1.200 metrede gökyüzünde bir portal belirir; her biri rastgele bir diyara açılır, birini kaçırırsan sonraki başka bir yere götürebilir.',
  'Dalışa geçtiğinde planör hızlanır, tırmanırken yavaşlar; dar bir geçitten önce burnu kaldırıp nefes al.',
  'Yere bir kanat boyu yaklaşıp süzülürsen “yer sıyırma” puanı işler ve kombon sönmez.',
  'Rüzgar halkasının tam ortasındaki ışıktan geçersen “tam isabet” iki kat puan ve ekstra kombo verir.',
  'Görevler XP kazandırır, XP seviyeni yükseltir; seviyen arttıkça uçuşa daha hızlı başlarsın.',
  'Gökyüzündeki portalın içinden geçersen başka bir diyara atlarsın; yanından geçersen bulunduğun diyarda kalırsın.',
  'En iyi uçuşun soluk bir hayalet olarak yanında uçar; onu geçersen puan, ondan uzun uçarsan bonus tüy kazanırsın.',
  'Ateş Vadisi’nde lav sütunları püskürmeden önce kesikli bir çizgiyle haber verir; sönmesini bekle ya da üstünden aş.',
  'Dokunmatik ekranda sağdaki düğmelerle yükselip dalarsın; parmağını kaydırarak ikisi arasında geçebilirsin. Yetenekler solda.',
  'Kutupta gökyüzü hep alacakaranlıktır; kuzey ışıklarını ve Samanyolu’nu en net orada görürsün.',
];

/* =========================================================
   Popups / fx
   ========================================================= */
function popup(text, color, big) {
  let stack = 0;
  for (const p of popups) if (p.t < 0.5) stack++;
  popups.push({ text, color: color || '#ffffff', x: bird.x - camX, y: bird.y - 46 - stack * 24, t: 0, life: big ? 1.8 : 1.35, big: !!big });
  if (popups.length > 8) popups.shift();
}
function addFx(p) { if (fx.length < 420) fx.push(p); }
function sparks(x, y, n, color, spd, size) {
  for (let i = 0; i < n; i++) {
    const a = rand(0, TAU), v = rand(0.3, 1) * (spd || 220);
    addFx({ k: 'spark', x, y, vx: Math.cos(a) * v, vy: Math.sin(a) * v, life: rand(0.35, 0.8), t: 0, s: size || rand(2, 4), c: color || 'gold', drag: 3 });
  }
}
function featherBurst(x, y, n) {
  const cols = ['#f2e6cc', '#d9c49a', '#e2564a', '#36577f', '#8a6440'];
  for (let i = 0; i < n; i++) {
    const a = rand(0, TAU), v = rand(60, 260);
    addFx({ k: 'plume', x, y, vx: Math.cos(a) * v, vy: Math.sin(a) * v - 60, life: rand(1.4, 2.4), t: 0, s: rand(4, 7), col: cols[i % cols.length], r: rand(0, TAU), vr: rand(-6, 6), drag: 2.2, grav: 90 });
  }
}
function chunks(x, y, n, col) {
  for (let i = 0; i < n; i++) {
    const a = rand(0, TAU), v = rand(80, 320);
    addFx({ k: 'chunk', x, y, vx: Math.cos(a) * v, vy: Math.sin(a) * v - 100, life: rand(0.8, 1.4), t: 0, s: rand(4, 10), col, r: rand(0, TAU), vr: rand(-8, 8), drag: 0.8, grav: 900 });
  }
}
function shock(x, y, c, r) { addFx({ k: 'shock', x, y, life: 0.5, t: 0, s: r || 60, c: c || 'rgba(255,255,255,' }); }
