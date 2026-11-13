// Süzülüş — Generative music and synthesized sound effects
'use strict';

/* =========================================================
   Audio (generative ambient + sfx, all synthesized)
   ========================================================= */
const Sound = (() => {
  let ac = null, master, lp, music, sfx, verb, mverb, sverb, noiseBuf, pinkBuf, brownBuf, rainBus, pianoWave;
  let muted = false, lastUpd = 0, barIdx = 0, nextBar = 0, piece = 1, drive = 0;
  let schedTimer = 0, suspendedByApp = false, rebuilding = false, resumeCheck = 0;
  try { muted = localStorage.getItem('suzulus-muted') === '1'; } catch (e) { /* storage unavailable */ }
  // the two volume sliders in the settings: music, and everything else (effects, wind, rain)
  const vol = { music: 1, sfx: 1 };
  try {
    const v = JSON.parse(localStorage.getItem('suzulus-vol') || 'null');
    if (v) { if (Number.isFinite(v.music)) vol.music = Math.min(1, Math.max(0, v.music)); if (Number.isFinite(v.sfx)) vol.sfx = Math.min(1, Math.max(0, v.sfx)); }
  } catch (e) { /* defaults */ }
  const PENTA = [62, 64, 66, 69, 71, 74, 76, 78, 81, 83];
  const MUSIC_VOL = 0.26;
  const mtof = (m) => 440 * Math.pow(2, (m - 69) / 12);

  /* ---- the score: a slow piano piece in D major, 66 bpm ----
     eight-bar progression, two bars per chord; sections A and B carry the melody,
     section C lets the broken chords breathe on their own before it all comes round again */
  const BEAT = 60 / 66, BAR = BEAT * 4;
  const CH = {
    D: { bass: 38, arp: [50, 57, 64, 66, 69], pad: [57, 62, 66, 76] },
    Bm: { bass: 35, arp: [47, 54, 57, 62, 66], pad: [54, 59, 62, 69] },
    G: { bass: 31, arp: [43, 50, 57, 59, 66], pad: [55, 59, 62, 66] },
    Asus: { bass: 33, arp: [45, 52, 57, 59, 62], pad: [57, 62, 64, 69] },
    A: { bass: 33, arp: [45, 52, 57, 61, 64], pad: [57, 61, 64, 69] },
  };
  const PROG = ['D', 'D', 'Bm', 'Bm', 'G', 'G', 'Asus', 'A'];
  // [beat, midi note, length in beats]
  const MEL = [
    [
      [[0, 78, 1.5], [1.5, 76, 0.5], [2, 74, 2]],
      [[0, 69, 1], [1, 71, 1], [2, 76, 2]],
      [[0, 74, 1.5], [1.5, 73, 0.5], [2, 71, 2]],
      [[0, 66, 1], [1, 69, 1], [2, 74, 2]],
      [[0, 71, 1.5], [1.5, 74, 0.5], [2, 78, 2]],
      [[0, 76, 1], [1, 74, 1], [2, 71, 2]],
      [[0, 74, 2], [2, 76, 2]],
      [[0, 73, 3]],
    ],
    [
      [[0, 81, 1], [1, 78, 1], [2, 76, 1], [3, 78, 1]],
      [[0, 74, 3]],
      [[0, 78, 1], [1, 76, 1], [2, 74, 1], [3, 73, 1]],
      [[0, 71, 3]],
      [[0, 71, 1], [1, 74, 1], [2, 79, 2]],
      [[0, 78, 1.5], [1.5, 76, 0.5], [2, 74, 2]],
      [[0, 76, 1], [1, 74, 1], [2, 69, 2]],
      [[0, 73, 1.5], [1.5, 71, 0.5], [2, 69, 2]],
    ],
  ];
  const ARP8 = [0, 1, 2, 3, 4, 3, 2, 1];

  /* ---- the second piece: a slow air for solo violin in F major, 56 bpm ----
     harp and cello carry the harmony under a soft string pad; in section C the violin
     rests on a few distant high notes while the harp turns the chords over */
  const VBEAT = 60 / 56, VBAR = VBEAT * 4;
  const VCH = {
    F: { bass: 41, arp: [53, 57, 60, 65, 69], pad: [57, 60, 65, 69] },
    Am: { bass: 45, arp: [52, 57, 60, 64, 69], pad: [57, 60, 64, 69] },
    Bb: { bass: 46, arp: [53, 58, 62, 65, 70], pad: [58, 62, 65, 70] },
    C: { bass: 48, arp: [52, 55, 60, 64, 67], pad: [55, 60, 64, 67] },
    Dm: { bass: 50, arp: [53, 57, 62, 65, 69], pad: [57, 62, 65, 69] },
    Gm: { bass: 43, arp: [55, 58, 62, 67, 70], pad: [55, 58, 62, 67] },
  };
  const VPROG = [
    ['F', 'Am', 'Bb', 'F', 'Dm', 'Bb', 'Gm', 'C'],
    ['Bb', 'C', 'Am', 'Dm', 'Bb', 'F', 'Gm', 'C'],
    ['F', 'Am', 'Bb', 'F', 'Dm', 'Bb', 'Gm', 'C'],
  ];
  const VMEL = [
    [
      [[0, 69, 1.5], [1.5, 72, 0.5], [2, 77, 2]],
      [[0, 76, 3], [3, 72, 1]],
      [[0, 74, 1.5], [1.5, 77, 0.5], [2, 82, 2]],
      [[0, 81, 4]],
      [[0, 81, 1], [1, 79, 1], [2, 77, 2]],
      [[0, 74, 2], [2, 77, 2]],
      [[0, 79, 1.5], [1.5, 77, 0.5], [2, 74, 2]],
      [[0, 76, 4]],
    ],
    [
      [[0, 82, 2], [2, 81, 1], [3, 79, 1]],
      [[0, 79, 3], [3, 76, 1]],
      [[0, 76, 1.5], [1.5, 77, 0.5], [2, 79, 1], [3, 81, 1]],
      [[0, 81, 3], [3, 77, 1]],
      [[0, 74, 1], [1, 77, 1], [2, 82, 2]],
      [[0, 81, 2], [2, 77, 2]],
      [[0, 79, 1], [1, 77, 1], [2, 74, 1], [3, 72, 1]],
      [[0, 74, 2], [2, 76, 2]],
    ],
  ];
  const HARP8 = [0, 2, 1, 3, 2, 4, 3, 2];

  /* ---- buffers ---- */
  function normalize(b, target) {
    let sum = 0, n = 0;
    for (let ch = 0; ch < b.numberOfChannels; ch++) { const d = b.getChannelData(ch); for (let i = 0; i < d.length; i++) sum += d[i] * d[i]; n += d.length; }
    const k = target / Math.sqrt(sum / n || 1);
    for (let ch = 0; ch < b.numberOfChannels; ch++) { const d = b.getChannelData(ch); for (let i = 0; i < d.length; i++) d[i] *= k; }
    return b;
  }
  function makeNoise(sec) {
    const len = (ac.sampleRate * sec) | 0, b = ac.createBuffer(1, len, ac.sampleRate), d = b.getChannelData(0);
    for (let i = 0; i < len; i++) d[i] = Math.random() * 2 - 1;
    return b;
  }
  function makePink(sec) {
    const len = (ac.sampleRate * sec) | 0, b = ac.createBuffer(2, len, ac.sampleRate);
    for (let ch = 0; ch < 2; ch++) {
      const d = b.getChannelData(ch);
      let b0 = 0, b1 = 0, b2 = 0, b3 = 0, b4 = 0, b5 = 0, b6 = 0;
      for (let i = 0; i < len; i++) {
        const w = Math.random() * 2 - 1;
        b0 = 0.99886 * b0 + w * 0.0555179; b1 = 0.99332 * b1 + w * 0.0750759; b2 = 0.969 * b2 + w * 0.153852;
        b3 = 0.8665 * b3 + w * 0.3104856; b4 = 0.55 * b4 + w * 0.5329522; b5 = -0.7616 * b5 - w * 0.016898;
        d[i] = b0 + b1 + b2 + b3 + b4 + b5 + b6 + w * 0.5362;
        b6 = w * 0.115926;
      }
    }
    return normalize(b, 0.2);
  }
  function makeBrown(sec) {
    const len = (ac.sampleRate * sec) | 0, b = ac.createBuffer(2, len, ac.sampleRate);
    for (let ch = 0; ch < 2; ch++) {
      const d = b.getChannelData(ch);
      let last = 0;
      for (let i = 0; i < len; i++) { last = (last + 0.02 * (Math.random() * 2 - 1)) / 1.02; d[i] = last; }
    }
    return normalize(b, 0.2);
  }
  function makeImpulse(sec, decay) {
    const len = (ac.sampleRate * sec) | 0, b = ac.createBuffer(2, len, ac.sampleRate);
    for (let ch = 0; ch < 2; ch++) {
      const d = b.getChannelData(ch);
      for (let i = 0; i < len; i++) d[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / len, decay);
    }
    return b;
  }
  function loopSrc(buf, rate) {
    const s = ac.createBufferSource();
    s.buffer = buf; s.loop = true;
    if (rate) s.playbackRate.value = rate;
    s.start(0, Math.random() * buf.duration);
    return s;
  }
  function filt(type, f, q) { const n = ac.createBiquadFilter(); n.type = type; n.frequency.value = f; n.Q.value = q || 0.7; return n; }
  // recorded rain: "rain loopable" by Ylmir (OpenGameArt, CC0), embedded in the page as base64 MP3
  function seamless(buf) {
    // trim MP3 encoder padding, then crossfade the tail into the head so the loop has no seam
    const sr = buf.sampleRate, chs = buf.numberOfChannels, d0 = buf.getChannelData(0);
    let a = 0, z = buf.length - 1;
    while (a < 6000 && Math.abs(d0[a]) < 1e-3) a++;
    while (z > a + 6000 && Math.abs(d0[z]) < 1e-3) z--;
    const n = z - a + 1, F = Math.min(Math.floor(sr * 0.75), Math.floor(n / 4)), L = n - F;
    const out = ac.createBuffer(chs, L, sr);
    let sum = 0;
    for (let c = 0; c < chs; c++) {
      const src = buf.getChannelData(c), dst = out.getChannelData(c);
      for (let i = 0; i < L; i++) dst[i] = src[a + i];
      for (let i = 0; i < F; i++) { const t = i / F; dst[i] = src[a + i] * Math.sqrt(t) + src[a + L + i] * Math.sqrt(1 - t); }
      for (let i = 0; i < L; i++) sum += dst[i] * dst[i];
    }
    const k = 0.2 / Math.sqrt(sum / (L * chs) || 1);
    for (let c = 0; c < chs; c++) { const dst = out.getChannelData(c); for (let i = 0; i < L; i++) dst[i] *= k; }
    return out;
  }
  function loadRain() {
    if (typeof RAIN_B64 !== 'string') return;
    let bytes;
    try {
      const bin = atob(RAIN_B64);
      bytes = new Uint8Array(bin.length);
      for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
    } catch (e) { return; }
    let started = false;
    const onDecoded = (buf) => {
      if (started) return;
      started = true;
      const src = loopSrc(seamless(buf));
      const hp = filt('highpass', 90), soft = filt('lowpass', 8000, 0.5);
      const g = ac.createGain(); g.gain.value = 0.2;
      src.connect(hp); hp.connect(soft); soft.connect(g); g.connect(rainBus);
    };
    try {
      const p = ac.decodeAudioData(bytes.buffer, onDecoded, () => {});
      if (p && p.then) p.then(onDecoded, () => {});
    } catch (e) { /* format not supported: rain stays silent */ }
  }
  function unlockTick() {
    if (!ac) return;
    // older iOS only unlocks a context that actually plays something inside the tap
    try { const b = ac.createBufferSource(); b.buffer = ac.createBuffer(1, 1, 22050); b.connect(ac.destination); b.start(0); } catch (e) { /* ignore */ }
  }
  function buildContext() {
    const AC = window.AudioContext || window.webkitAudioContext;
    if (!AC) return;
    // iOS: play as media, so the ring/silent switch does not mute the game (Safari 16.4+)
    try { if (navigator.audioSession) navigator.audioSession.type = 'playback'; } catch (e) { /* ignore */ }
    try { ac = new AC(); } catch (e) { ac = null; return; }
    const ctxRef = ac;
    ctxRef.onstatechange = () => {
      if (rebuilding || ac !== ctxRef || document.hidden || suspendedByApp) return;
      if (ctxRef.state !== 'running') {
        try { const p = ctxRef.resume(); if (p && p.catch) p.catch(() => {}); } catch (e) { /* ignore */ }
      }
    };
    unlockTick();
    if (ac.state !== 'running') {
      try { const p = ac.resume(); if (p && p.catch) p.catch(() => {}); } catch (e) { /* ignore */ }
    }
    master = ac.createGain(); master.gain.value = muted ? 0 : 0.85;
    lp = ac.createBiquadFilter(); lp.type = 'lowpass'; lp.frequency.value = 18000; lp.Q.value = 0.6;
    const comp = ac.createDynamicsCompressor();
    master.connect(lp); lp.connect(comp); comp.connect(ac.destination);
    music = ac.createGain(); music.gain.value = 0; music.connect(master);
    music.gain.setTargetAtTime(MUSIC_VOL * vol.music, ac.currentTime + 0.1, 1.2); // fade the piece in
    sfx = ac.createGain(); sfx.gain.value = 0.75 * vol.sfx; sfx.connect(master);
    const conv = ac.createConvolver(); conv.buffer = makeImpulse(3.4, 2.4);
    verb = ac.createGain(); verb.gain.value = 1; verb.connect(conv);
    // separate reverb sends, so each slider also takes its own echo down with it
    mverb = ac.createGain(); mverb.gain.value = vol.music; mverb.connect(verb);
    sverb = ac.createGain(); sverb.gain.value = vol.sfx; sverb.connect(verb);
    const wet = ac.createGain(); wet.gain.value = 0.5; conv.connect(wet); wet.connect(master);
    noiseBuf = makeNoise(2.5);
    pinkBuf = makePink(4);
    brownBuf = makeBrown(4);
    // soft piano tone: a few decaying harmonics
    const real = new Float32Array(10), imag = new Float32Array(10);
    [0, 1, 0.42, 0.22, 0.12, 0.07, 0.04, 0.025, 0.012, 0.006].forEach((a, i) => { imag[i] = a; });
    pianoWave = ac.createPeriodicWave(real, imag);
    // rain: a real recording, faded in and out with the storm
    rainBus = ac.createGain(); rainBus.gain.value = 0; rainBus.connect(master);
    const rv = ac.createGain(); rv.gain.value = 0.06; rainBus.connect(rv); rv.connect(sverb);
    loadRain();
    lastUpd = 0;
    nextBar = ac.currentTime + 0.3;
    if (!schedTimer) schedTimer = setInterval(schedule, 100);
  }
  function rebuildContext() {
    if (rebuilding || document.hidden || suspendedByApp) return;
    rebuilding = true;
    const old = ac;
    ac = null;
    if (old) {
      try { old.onstatechange = null; } catch (e) { /* ignore */ }
      try { const p = old.close(); if (p && p.catch) p.catch(() => {}); } catch (e) { /* ignore */ }
    }
    buildContext();
    rebuilding = false;
  }
  function suspend() {
    suspendedByApp = true;
    clearTimeout(resumeCheck);
    if (!ac) return;
    try { if (master) master.gain.setTargetAtTime(0, ac.currentTime, 0.02); } catch (e) { /* ignore */ }
    if (ac.state === 'running') {
      try { const p = ac.suspend(); if (p && p.catch) p.catch(() => {}); } catch (e) { /* ignore */ }
    }
  }
  function resume(fromGesture) {
    if (document.hidden) return;
    suspendedByApp = false;
    try { if (navigator.audioSession) navigator.audioSession.type = 'playback'; } catch (e) { /* ignore */ }
    if (!ac) {
      if (fromGesture) buildContext();
      return;
    }
    if (fromGesture) unlockTick();
    if (ac.state !== 'running') {
      try { const p = ac.resume(); if (p && p.catch) p.catch(() => {}); } catch (e) { /* ignore */ }
    }
    try { if (master) master.gain.setTargetAtTime(muted ? 0 : 0.85, ac.currentTime, 0.04); } catch (e) { /* ignore */ }
    clearTimeout(resumeCheck);
    const ctxRef = ac, t0 = ac.currentTime;
    resumeCheck = setTimeout(() => {
      if (!ac || ac !== ctxRef || document.hidden || suspendedByApp) return;
      if (ac.state !== 'running' || ac.currentTime <= t0 + 0.005) {
        if (fromGesture) rebuildContext();
        else {
          try { if (ac.state !== 'running') { const p = ac.resume(); if (p && p.catch) p.catch(() => {}); } } catch (e) { /* ignore */ }
        }
      }
    }, 220);
  }
  function init() {
    if (!ac) buildContext();
    else resume(true);
  }

  /* ---- instruments ---- */
  function piano(m, t, vel, durS) {
    const f = mtof(m);
    const decay = clamp(Math.min(5.8 - (m - 48) * 0.05, durS + 1.6), 0.9, 6);
    const fl = ac.createBiquadFilter(); fl.type = 'lowpass'; fl.Q.value = 0.4;
    fl.frequency.setValueAtTime(Math.min(9000, f * 7 + 900), t);
    fl.frequency.exponentialRampToValueAtTime(Math.max(f * 1.6, 320), t + decay * 0.8);
    const g = ac.createGain();
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(vel, t + 0.006);
    g.gain.exponentialRampToValueAtTime(vel * 0.42, t + 0.3);
    g.gain.exponentialRampToValueAtTime(0.0001, t + decay);
    for (const det of [0, 3.5]) {
      const o = ac.createOscillator();
      o.setPeriodicWave(pianoWave); o.frequency.value = f; o.detune.value = det;
      o.connect(fl); o.start(t); o.stop(t + decay + 0.05);
    }
    fl.connect(g); g.connect(music); g.connect(mverb);
  }
  function strings(notes, t, dur) {
    const f = ac.createBiquadFilter(); f.type = 'lowpass'; f.frequency.value = 760; f.Q.value = 0.5;
    const g = ac.createGain();
    g.gain.setValueAtTime(0, t);
    g.gain.linearRampToValueAtTime(0.016, t + 2.6);
    g.gain.setValueAtTime(0.016, t + dur - 2.4);
    g.gain.linearRampToValueAtTime(0, t + dur);
    for (const m of notes) {
      for (const det of [-8, 8]) {
        const o = ac.createOscillator(); o.type = 'sawtooth'; o.frequency.value = mtof(m); o.detune.value = det;
        o.connect(f); o.start(t); o.stop(t + dur + 0.05);
      }
    }
    f.connect(g); g.connect(music); g.connect(mverb);
  }
  function bass(m, t, dur) {
    const g = ac.createGain();
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(0.2, t + 0.08);
    g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    const o = ac.createOscillator(); o.type = 'sine'; o.frequency.value = mtof(m);
    const o2 = ac.createOscillator(); o2.type = 'triangle'; o2.frequency.value = mtof(m + 12);
    const g2 = ac.createGain(); g2.gain.value = 0.35;
    o.connect(g); o2.connect(g2); g2.connect(g); g.connect(music);
    o.start(t); o2.start(t); o.stop(t + dur + 0.05); o2.stop(t + dur + 0.05);
  }
  // bowed string: two sawtooth voices through the body resonances of a violin, a slow bow attack,
  // a little bow noise and vibrato that blooms once the note has settled; bright sets the top end
  function bowed(m, t, dur, vel, bright, vib, atk = 0.45) {
    const f = mtof(m), end = t + dur, rel = Math.min(0.45, atk + 0.1), a1 = Math.min(atk, dur * 0.5);
    const hp = filt('highpass', 150, 0.6), lo = filt('lowpass', bright, 0.5);
    const b1 = ac.createBiquadFilter(); b1.type = 'peaking'; b1.frequency.value = 480; b1.Q.value = 1.3; b1.gain.value = 4;
    const b2 = ac.createBiquadFilter(); b2.type = 'peaking'; b2.frequency.value = 2600; b2.Q.value = 0.9; b2.gain.value = 1.5;
    const g = ac.createGain();
    g.gain.setValueAtTime(0.0001, t);
    g.gain.linearRampToValueAtTime(vel * 0.6, t + a1);
    g.gain.linearRampToValueAtTime(vel, t + Math.max(a1 + 0.02, dur * 0.55));
    g.gain.linearRampToValueAtTime(vel * 0.82, end);
    g.gain.linearRampToValueAtTime(0.0001, end + rel);
    const lfo = ac.createOscillator(); lfo.frequency.value = 5 + Math.random() * 0.7;
    const lg = ac.createGain(); lg.gain.setValueAtTime(0, t); lg.gain.linearRampToValueAtTime(vib, t + 0.65);
    lfo.connect(lg);
    for (const det of [-4, 5]) {
      const o = ac.createOscillator(); o.type = 'sawtooth'; o.frequency.value = f; o.detune.value = det;
      lg.connect(o.detune); o.connect(hp);
      o.start(t); o.stop(end + rel + 0.05);
    }
    lfo.start(t); lfo.stop(end + rel + 0.05);
    const hair = ac.createBufferSource(); hair.buffer = pinkBuf; hair.loop = true;
    const nb = filt('bandpass', Math.min(f * 3, 6000), 1.4), ng = ac.createGain(); ng.gain.value = 0.02;
    hair.connect(nb); nb.connect(ng); ng.connect(hp);
    hair.start(t, Math.random() * 2); hair.stop(end + rel + 0.05);
    hp.connect(b1); b1.connect(b2); b2.connect(lo); lo.connect(g);
    g.connect(music); g.connect(mverb);
  }
  // plucked harp: a bright triangle that darkens as it rings out
  function harp(m, t, vel) {
    const f = mtof(m), dec = clamp(3.2 - (m - 50) * 0.04, 1.2, 3.4);
    const lo = ac.createBiquadFilter(); lo.type = 'lowpass'; lo.Q.value = 0.6;
    lo.frequency.setValueAtTime(Math.min(8000, f * 8), t);
    lo.frequency.exponentialRampToValueAtTime(Math.max(f * 1.5, 300), t + 0.5);
    const g = ac.createGain();
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(vel, t + 0.004);
    g.gain.exponentialRampToValueAtTime(0.0001, t + dec);
    const o = ac.createOscillator(); o.type = 'triangle'; o.frequency.value = f;
    const o2 = ac.createOscillator(); o2.type = 'sine'; o2.frequency.value = f * 2;
    const g2 = ac.createGain(); g2.gain.value = 0.25;
    o.connect(lo); o2.connect(g2); g2.connect(lo); lo.connect(g);
    g.connect(music); g.connect(mverb);
    o.start(t); o2.start(t); o.stop(t + dec + 0.05); o2.stop(t + dec + 0.05);
  }
  const hum = () => (Math.random() - 0.5) * 0.022;
  const ramp = (a, b, x) => sstep(clamp((x - a) / (b - a), 0, 1));
  // a soft heartbeat and a brushed shaker that join in as the flight picks up speed
  function thump(t, vel) {
    const o = ac.createOscillator(); o.type = 'sine';
    o.frequency.setValueAtTime(105, t); o.frequency.exponentialRampToValueAtTime(42, t + 0.2);
    const g = ac.createGain();
    g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(vel, t + 0.01); g.gain.exponentialRampToValueAtTime(0.0001, t + 0.45);
    o.connect(g); g.connect(music);
    o.start(t); o.stop(t + 0.5);
  }
  function brush(t, vel) {
    const src = ac.createBufferSource(); src.buffer = noiseBuf;
    const f = filt('bandpass', 6500, 0.9), g = ac.createGain();
    g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(vel, t + 0.012); g.gain.exponentialRampToValueAtTime(0.0001, t + 0.13);
    src.connect(f); f.connect(g); g.connect(music); g.connect(mverb);
    src.start(t, Math.random() * 2); src.stop(t + 0.16);
  }
  function groove(t, beat, I) {
    const kick = ramp(0.22, 0.55, I), shk = ramp(0.42, 0.8, I);
    if (kick > 0.01) for (let k = 0; k < 4; k++) if (k % 2 === 0 || I > 0.62) thump(t + k * beat, 0.17 * kick * (k === 0 ? 1 : 0.7));
    if (shk > 0.01) for (let k = 1; k < 8; k += 2) brush(t + k * beat * 0.5 + hum(), 0.03 * shk);
  }
  function playViolinBar(i, t, tempo) {
    const beat = VBEAT / tempo, bar = beat * 4, I = drive;
    const sec = Math.floor(i / 8) % 3, b = i % 8, ch = VCH[VPROG[sec][b]];
    strings(ch.pad, t, bar + 2.4);
    // the cello holds the root while it is calm, then drives it in short eighths
    if (I > 0.55) for (let k = 0; k < 8; k++) bowed(ch.bass, t + k * beat * 0.5 + hum(), beat * 0.34, VOL.cello * (k % 2 ? 0.6 : 0.85), 950, 0, 0.04);
    else bowed(ch.bass, t + hum(), bar * 0.97, VOL.cello, 950, 6);
    // harp: quarters in the interlude, eighths under the song, sixteenths once the pace is up
    const step = sec === 2 ? (I > 0.5 ? 0.5 : 1) : I > 0.5 ? 0.25 : 0.5;
    for (let k = 0; k < 4 / step; k++) harp(ch.arp[HARP8[k % 8]], t + k * step * beat + hum(), VOL.harp * (k === 0 ? 1.2 : 0.8 + Math.random() * 0.3) * (step < 0.5 ? 0.75 : 1));
    if (sec < 2) for (const [bt, m, d] of VMEL[sec][b]) bowed(m, t + bt * beat + hum(), d * beat, VOL.violin * (0.9 + Math.random() * 0.15), 2300, 11);
    else if (b === 0 || b === 4) bowed(b ? 81 : 84, t + beat, beat * 3, VOL.violin * 0.5, 1900, 9);
    groove(t, beat, I);
  }
  /* ---- the third piece: a lullaby in A minor, 52 bpm ----
     the harp sings the tune like a music box over soft piano chords */
  const NBEAT = 60 / 52, NBAR = NBEAT * 4;
  const NCH = {
    Am: { bass: 45, arp: [57, 64, 69, 72, 76], pad: [57, 64, 69, 72] },
    F: { bass: 41, arp: [53, 60, 65, 69, 72], pad: [57, 60, 65, 69] },
    C: { bass: 48, arp: [55, 60, 64, 67, 72], pad: [55, 60, 64, 67] },
    G: { bass: 43, arp: [55, 59, 62, 67, 71], pad: [55, 59, 62, 67] },
    Em: { bass: 40, arp: [52, 59, 64, 67, 71], pad: [55, 59, 64, 67] },
    Dm: { bass: 38, arp: [50, 57, 62, 65, 69], pad: [57, 62, 65, 69] },
  };
  const NPROG = [
    ['Am', 'F', 'C', 'G', 'Am', 'F', 'Em', 'G'],
    ['F', 'G', 'Em', 'Am', 'F', 'C', 'Dm', 'G'],
    ['Am', 'F', 'C', 'G', 'Am', 'F', 'Em', 'G'],
  ];
  const NMEL = [
    [
      [[0, 76, 1], [1, 72, 1], [2, 69, 2]],
      [[0, 72, 1.5], [1.5, 74, 0.5], [2, 77, 2]],
      [[0, 76, 2], [2, 79, 2]],
      [[0, 74, 3]],
      [[0, 81, 1], [1, 79, 1], [2, 76, 2]],
      [[0, 77, 1], [1, 76, 1], [2, 72, 2]],
      [[0, 71, 1.5], [1.5, 72, 0.5], [2, 74, 2]],
      [[0, 74, 2], [2, 71, 2]],
    ],
    [
      [[0, 81, 2], [2, 84, 2]],
      [[0, 83, 1], [1, 81, 1], [2, 79, 2]],
      [[0, 79, 1.5], [1.5, 76, 0.5], [2, 71, 2]],
      [[0, 72, 3]],
      [[0, 77, 1], [1, 81, 1], [2, 84, 2]],
      [[0, 84, 1], [1, 83, 1], [2, 79, 2]],
      [[0, 77, 1.5], [1.5, 76, 0.5], [2, 74, 2]],
      [[0, 71, 2], [2, 74, 2]],
    ],
  ];
  function playLullaby(i, t, tempo) {
    const beat = NBEAT / tempo, bar = beat * 4, I = drive;
    const sec = Math.floor(i / 8) % 3, b = i % 8, ch = NCH[NPROG[sec][b]];
    strings(ch.pad, t, bar + 2.4);
    bass(ch.bass, t, bar * 0.98);
    const n = I > 0.5 ? 8 : 4, pat = [0, 2, 3, 4, 3, 2, 1, 2];
    for (let k = 0; k < n; k++) piano(ch.arp[pat[k]], t + k * beat * (4 / n) + hum(), 0.034 * (k === 0 ? 1.2 : 0.85 + Math.random() * 0.2), beat * (4 / n));
    if (sec < 2) {
      for (const [bt, m, d] of NMEL[sec][b]) { harp(m, t + bt * beat + hum(), VOL.harp * 1.7); piano(m - 12, t + bt * beat + hum(), 0.045, d * beat); }
    } else if (b === 0 || b === 4) harp(b ? 88 : 84, t + beat * 2, VOL.harp * 1.2);
    groove(t, beat, I * 0.8);
  }

  /* ---- the fourth piece: a canyon song in E minor, 60 bpm ----
     a low drone like wind across the rock, the harp picked like a guitar, the melody bowed low */
  const KBEAT = 60 / 60, KBAR = KBEAT * 4;
  const KCH = {
    Em: { bass: 40, arp: [52, 59, 64, 67, 71], pad: [55, 59, 64, 71] },
    D: { bass: 38, arp: [50, 57, 62, 66, 69], pad: [54, 57, 62, 66] },
    C: { bass: 36, arp: [48, 55, 60, 64, 67], pad: [55, 60, 64, 67] },
    Bm: { bass: 35, arp: [47, 54, 59, 62, 66], pad: [54, 59, 62, 66] },
  };
  const KPROG = [
    ['Em', 'D', 'C', 'D', 'Em', 'D', 'C', 'Bm'],
    ['C', 'D', 'Em', 'Em', 'C', 'D', 'Bm', 'Em'],
    ['Em', 'D', 'C', 'D', 'Em', 'D', 'C', 'Bm'],
  ];
  const KMEL = [
    [
      [[0, 71, 2], [2, 74, 1], [3, 76, 1]],
      [[0, 74, 3], [3, 69, 1]],
      [[0, 72, 1.5], [1.5, 71, 0.5], [2, 67, 2]],
      [[0, 69, 4]],
      [[0, 76, 1], [1, 79, 1], [2, 78, 2]],
      [[0, 74, 2], [2, 76, 2]],
      [[0, 72, 1], [1, 71, 1], [2, 69, 2]],
      [[0, 71, 4]],
    ],
    [
      [[0, 79, 2], [2, 76, 2]],
      [[0, 78, 1.5], [1.5, 76, 0.5], [2, 74, 2]],
      [[0, 76, 3], [3, 79, 1]],
      [[0, 83, 4]],
      [[0, 81, 1], [1, 79, 1], [2, 76, 2]],
      [[0, 78, 2], [2, 74, 2]],
      [[0, 74, 1.5], [1.5, 71, 0.5], [2, 66, 2]],
      [[0, 64, 4]],
    ],
  ];
  function playCanyon(i, t, tempo) {
    const beat = KBEAT / tempo, bar = beat * 4, I = drive;
    const sec = Math.floor(i / 8) % 3, b = i % 8, ch = KCH[KPROG[sec][b]];
    strings(ch.pad, t, bar + 2.4);
    bowed(40, t + hum(), bar * 0.98, VOL.cello * 0.6, 700, 4);
    bowed(ch.bass, t + hum(), bar * 0.97, VOL.cello * 0.8, 900, 5);
    const pat = [0, 2, 1, 3, 0, 4, 2, 3], n = I > 0.5 ? 16 : 8;
    for (let k = 0; k < n; k++) harp(ch.arp[pat[k % 8]], t + k * beat * (4 / n) + hum(), VOL.harp * (k % 4 === 0 ? 1.1 : 0.7 + Math.random() * 0.25));
    if (sec < 2) for (const [bt, m, d] of KMEL[sec][b]) bowed(m, t + bt * beat + hum(), d * beat, VOL.violin * 0.95, 1700, 9);
    else if (b === 0 || b === 4) bowed(b ? 76 : 71, t + beat, beat * 3, VOL.violin * 0.45, 1500, 8);
    groove(t, beat, I);
  }
  // in the canyon its own song comes next; elsewhere the other pieces take turns at random
  let biomeName = 'lakes';
  function nextPiece() {
    if ((biomeName === 'canyon' || biomeName === 'volcano') && piece !== 3) return 3;
    if (biomeName === 'polar' && piece !== 2) return 2;
    const pool = [0, 1, 2].filter((k) => k !== piece);
    return pool[(Math.random() * pool.length) | 0];
  }
  // the pieces take turns
  const PIECES = [
    { bars: 24, bar: BAR, play: (i, t, tp) => playBar(i, t, tp) },
    { bars: 24, bar: VBAR, play: (i, t, tp) => playViolinBar(i, t, tp) },
    { bars: 24, bar: NBAR, play: (i, t, tp) => playLullaby(i, t, tp) },
    { bars: 24, bar: KBAR, play: (i, t, tp) => playCanyon(i, t, tp), canyon: true },
  ];
  const VOL = { violin: 0.052, cello: 0.04, harp: 0.05 };
  function playBar(i, t, tempo) {
    const beat = BEAT / tempo, bar = beat * 4, I = drive;
    const section = Math.floor(i / 8) % 3, b = i % 8, ch = CH[PROG[b]];
    if (b % 2 === 0) strings(ch.pad, t, bar * 2 + 2.2);
    // the bass rolls on every beat once the flight is quick, otherwise it holds for two bars
    if (I > 0.55) for (let k = 0; k < 4; k++) bass(ch.bass, t + k * beat, beat * 0.9);
    else if (b % 2 === 0) bass(ch.bass, t, bar * 2);
    if (section < 2) {
      // broken chords in eighths, doubling to sixteenths as the pace picks up
      const n = I > 0.5 ? 16 : 8, st = 4 / n, v = I > 0.5 ? 0.04 : 0.052;
      for (let k = 0; k < n; k++) piano(ch.arp[ARP8[k % 8]], t + k * beat * st + hum(), v * (k % 8 === 0 ? 1.25 : 0.85 + Math.random() * 0.25), beat * st);
      for (const [bt, m, d] of MEL[section][b]) piano(m, t + bt * beat + hum(), 0.13 * (0.9 + Math.random() * 0.2), d * beat);
    } else {
      const n = I > 0.5 ? 8 : 4, pat = I > 0.5 ? ARP8 : [0, 2, 3, 4];
      for (let k = 0; k < n; k++) piano(ch.arp[pat[k]], t + k * beat * (4 / n) + hum(), 0.046 * (0.85 + Math.random() * 0.25), beat * (4 / n));
      if (b === 0 || b === 4) piano(b ? 83 : 86, t + beat * 2 + hum(), 0.07, beat * 3);
    }
    groove(t, beat, I);
  }
  function schedule() {
    if (!ac || ac.state !== 'running') return;
    const now = ac.currentTime;
    if (nextBar < now - 0.5) nextBar = now + 0.1;
    while (nextBar < now + 0.8) {
      // the music speeds up with the flight: up to about a third faster
      const pc = PIECES[piece], tempo = 1 + 0.35 * drive;
      pc.play(barIdx, nextBar, tempo);
      nextBar += pc.bar / tempo;
      if (++barIdx >= pc.bars) { barIdx = 0; piece = nextPiece(); nextBar += 1.5; }
    }
  }

  /* ---- sound effects ---- */
  const ok = () => ac && ac.state === 'running' && !muted;
  function tone(f, type, t, a, peak, d, wet, f2) {
    const o = ac.createOscillator(), g = ac.createGain();
    o.type = type; o.frequency.setValueAtTime(f, t);
    if (f2) o.frequency.exponentialRampToValueAtTime(f2, t + a + d);
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(peak, t + a);
    g.gain.exponentialRampToValueAtTime(0.0001, t + a + d);
    o.connect(g); g.connect(sfx); if (wet) g.connect(sverb);
    o.start(t); o.stop(t + a + d + 0.05);
  }
  function nz(t, d, type, f0, f1, peak, q, wet, buf, att) {
    const s = ac.createBufferSource(); s.buffer = buf || noiseBuf; s.loop = true;
    const f = ac.createBiquadFilter(); f.type = type; f.Q.value = q || 1;
    f.frequency.setValueAtTime(f0, t); f.frequency.exponentialRampToValueAtTime(f1, t + d);
    const g = ac.createGain();
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(peak, t + (att || Math.min(0.06, d * 0.3)));
    g.gain.exponentialRampToValueAtTime(0.0001, t + d);
    s.connect(f); f.connect(g); g.connect(sfx); if (wet) g.connect(sverb);
    s.start(t, Math.random() * 2); s.stop(t + d + 0.05);
  }
  const T = () => ac.currentTime + 0.005;
  return {
    init,
    get muted() { return muted; },
    get volume() { return vol; },
    setVolume(kind, v) {
      vol[kind] = Math.min(1, Math.max(0, v));
      try { localStorage.setItem('suzulus-vol', JSON.stringify(vol)); } catch (e) { /* ignore */ }
      if (!ac) return;
      const now = ac.currentTime;
      if (kind === 'music') { music.gain.setTargetAtTime(MUSIC_VOL * 0.5 * vol.music, now, 0.05); mverb.gain.setTargetAtTime(vol.music, now, 0.05); }
      else { sfx.gain.setTargetAtTime(0.75 * vol.sfx, now, 0.05); sverb.gain.setTargetAtTime(vol.sfx, now, 0.05); }
    },
    toggleMute() {
      muted = !muted;
      try { localStorage.setItem('suzulus-muted', muted ? '1' : '0'); } catch (e) { /* ignore */ }
      if (ac) master.gain.setTargetAtTime(muted ? 0 : 0.85, ac.currentTime, 0.08);
      return muted;
    },
    suspend,
    resume,
    // pace: 0 when calm, toward 1 as the flight speeds up; eased so the music follows smoothly
    update(speed, rain, flying, paused, pace) {
      if (!ac) return;
      const now = ac.currentTime;
      if (now < lastUpd) lastUpd = now;
      if (now - lastUpd < 0.1) return;
      if (!paused) drive += ((pace || 0) - drive) * (1 - Math.exp(-(now - lastUpd) / 4));
      lastUpd = now;
      const gust = 0.82 + 0.18 * Math.sin(now * 0.37) * Math.sin(now * 0.23 + 1);
      rainBus.gain.setTargetAtTime(rain * gust * (paused ? 0.5 : 1) * vol.sfx, now, 0.6);
      music.gain.setTargetAtTime((paused ? MUSIC_VOL * 0.5 : MUSIC_VOL) * vol.music, now, 0.4);
    },
    feather(i) { if (!ok()) return; const t = T(), m = PENTA[Math.min(i, PENTA.length - 1)] + 12; tone(mtof(m), 'sine', t, 0.005, 0.1, 0.35, true); tone(mtof(m + 12), 'sine', t, 0.005, 0.022, 0.18, false); },
    setBiome(b) { biomeName = b; },
    thermal() { if (!ok()) return; const t = T(); tone(330, 'sine', t, 0.08, 0.05, 1.1, true, 660); tone(495, 'sine', t + 0.12, 0.08, 0.03, 1, true, 990); },
    ring() { if (!ok()) return; const t = T(); [69, 74, 78, 81].forEach((m, i) => tone(mtof(m), 'triangle', t + i * 0.065, 0.005, 0.07, 0.6, true)); },
    ringSlow() { if (!ok()) return; const t = T(); [81, 76, 72, 69].forEach((m, i) => tone(mtof(m - 12), 'sine', t + i * 0.08, 0.01, 0.08, 0.7, true)); nz(t, 0.6, 'lowpass', 1800, 300, 0.16, 0.7, true, pinkBuf); },
    dash() { if (!ok()) return; const t = T(); nz(t, 0.9, 'lowpass', 4200, 300, 0.3, 0.7, true, pinkBuf); tone(170, 'sine', t, 0.01, 0.25, 0.5, false, 45); },
    shield() { if (!ok()) return; const t = T(); [0, 7, 12, 19].forEach((iv, i) => tone(mtof(74 + iv), 'sine', t + i * 0.05, 0.02, 0.045, 0.9, true)); },
    shieldBreak() { if (!ok()) return; const t = T(); nz(t, 0.35, 'highpass', 2500, 6000, 0.25, 0.7, true); tone(1400, 'triangle', t, 0.005, 0.08, 0.3, true, 500); },
    slow(on) {
      if (!ac) return;
      lp.frequency.setTargetAtTime(on ? 850 : 18000, ac.currentTime, on ? 0.15 : 0.4);
      if (!ok()) return;
      const t = T();
      if (on) tone(520, 'sine', t, 0.02, 0.12, 0.9, true, 140); else tone(160, 'sine', t, 0.02, 0.08, 0.5, true, 480);
    },
    orb() { if (!ok()) return; const t = T(); [62, 66, 69, 74, 78].forEach((m, i) => tone(mtof(m + 12), 'sine', t + i * 0.06, 0.005, 0.07, 0.9, true)); },
    near() { if (!ok()) return; nz(T(), 0.3, 'bandpass', 1600, 500, 0.2, 2, false, pinkBuf); },
    crash() { if (!ok()) return; const t = T(); nz(t, 0.8, 'lowpass', 1600, 90, 0.5, 0.7, true, brownBuf); tone(150, 'sine', t, 0.005, 0.55, 0.6, false, 40); },
    thunder(v) {
      if (!ok()) return;
      const t = T();
      nz(t, 0.45, 'bandpass', 2600, 700, 0.22 * v, 0.7, true);
      let st = t + 0.04;
      for (let i = 0; i < 4; i++) {
        const d = 1.3 + Math.random() * 2.2;
        nz(st, d, 'lowpass', 560 - i * 90, 60, (0.6 - i * 0.11) * v, 0.5, true, brownBuf, 0.06 + Math.random() * 0.25);
        st += 0.18 + Math.random() * 0.6;
      }
    },
    hawk() { if (!ok()) return; const t = T(); tone(2200, 'triangle', t, 0.01, 0.035, 0.28, true, 1300); tone(2000, 'triangle', t + 0.3, 0.01, 0.025, 0.22, true, 1200); },
    burner() { if (!ok()) return; const t = T(); nz(t, 0.55, 'bandpass', 420, 260, 0.08, 0.85, true, brownBuf, 0.12); },
    deny() { if (!ok()) return; tone(180, 'square', T(), 0.005, 0.025, 0.1); },
    start() { if (!ok()) return; const t = T(); [62, 66, 69, 74].forEach((m, i) => tone(mtof(m), 'triangle', t + i * 0.09, 0.005, 0.05, 0.8, true)); },
    record() { if (!ok()) return; const t = T(); [74, 78, 81, 86].forEach((m, i) => tone(mtof(m), 'sine', t + i * 0.08, 0.005, 0.07, 1, true)); },
  };
})();
