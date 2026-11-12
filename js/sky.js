// Süzülüş — WebGL2 sky: painted mountain ranges, cloud decks, mist and light shafts
'use strict';

/* =========================================================
   Sky renderer (WebGL2)
   Painted, layered mountain ranges that dissolve into mist; smoky, self-shadowed
   cloud decks; rolling valley mist and light shafts. Drawn into an offscreen GL
   canvas and composited into the 2D scene. Without WebGL2 the flat 2D painting
   is used instead.
   ========================================================= */
// far to near. par: parallax; base: world y of the range foot; amp: tallest peak; xs: world units per profile
// texel; cell/oct/seed shape the ridge line; haze: air in front; snow: snow line (0..1 of amp, >1 none);
// forest: conifer fringe on the lower ridges; tone: near..far palette mix; fade: how fast the foot turns to
// mist; rim: lit crest highlight; tree: conifer height
const MTN = [
  { par: 0.006, base: 430, amp: 185, xs: 2.3, cell: 256, oct: 6, seed: 7, haze: 0.36, snow: 0.5, forest: 0, tone: 0.87, fade: 60, rim: 0.3, tree: 0 },
  { par: 0.016, base: 455, amp: 290, xs: 1.7, cell: 256, oct: 7, seed: 11, haze: 0.18, snow: 0.5, forest: 0, tone: 0.76, fade: 120, rim: 0.45, tree: 0 },
  { par: 0.034, base: 485, amp: 195, xs: 1.3, cell: 256, oct: 7, seed: 23, haze: 0.1, snow: 0.62, forest: 0.55, tone: 0.73, fade: 90, rim: 0.5, tree: 6 },
  { par: 0.06, base: 510, amp: 125, xs: 1.1, cell: 256, oct: 6, seed: 31, haze: 0.05, snow: 2, forest: 1, tone: 0.69, fade: 70, rim: 0.5, tree: 9 },
];

const Sky = (() => {
  const api = { ok: false };
  const glc = document.createElement('canvas');
  let gl = null;
  try {
    gl = glc.getContext('webgl2', { alpha: true, premultipliedAlpha: true, antialias: false, depth: false, stencil: false, preserveDrawingBuffer: false, powerPreference: 'high-performance' });
  } catch (e) { gl = null; }
  if (!gl) return api;

  const VS = `#version 300 es
void main() { vec2 p = vec2(float((gl_VertexID << 1) & 2), float(gl_VertexID & 2)); gl_Position = vec4(p * 2.0 - 1.0, 0.0, 1.0); }`;
  const HASH = `
uint hsh(uint x) { x ^= x >> 16; x *= 0x7feb352du; x ^= x >> 15; x *= 0x846ca68bu; x ^= x >> 16; return x; }`;

  // tileable 2D noise: R perlin, G inverted worley (billows), B + A more perlin
  const BAKE_NOISE = `#version 300 es
precision highp float;
uniform float uP;
out vec4 o;
${HASH}
float h1(vec2 c, uint s) { uvec2 u = uvec2(mod(c, uP)); return float(hsh(u.x + hsh(u.y + hsh(s)))) * (1.0 / 4294967296.0); }
vec2 grd(vec2 c, uint s) { float a = h1(c, s) * 6.2831853; return vec2(cos(a), sin(a)); }
float perlin(vec2 p, uint s) {
vec2 i = floor(p), f = p - i, u = f * f * f * (f * (f * 6.0 - 15.0) + 10.0);
float a = dot(grd(i, s), f), b = dot(grd(i + vec2(1, 0), s), f - vec2(1, 0));
float c = dot(grd(i + vec2(0, 1), s), f - vec2(0, 1)), d = dot(grd(i + vec2(1, 1), s), f - vec2(1, 1));
return mix(mix(a, b, u.x), mix(c, d, u.x), u.y);
}
float worley(vec2 p, uint s) {
vec2 i = floor(p), f = p - i;
float m = 9.0;
for (int y = -1; y <= 1; y++) for (int x = -1; x <= 1; x++) {
  vec2 g = vec2(x, y), c = i + g;
  vec2 r = g + vec2(h1(c, s), h1(c, s + 7u)) - f;
  m = min(m, dot(r, r));
}
return sqrt(m);
}
void main() {
vec2 p = gl_FragCoord.xy / 512.0 * uP;
o = clamp(vec4(0.5 + perlin(p, 1u) * 0.75, 1.0 - worley(p, 2u), 0.5 + perlin(p, 3u) * 0.75, 0.5 + perlin(p, 4u) * 0.75), 0.0, 1.0);
}`;

  // ridge profiles, one row per range, seamless across x: height plus its slope with the fine
  // crags kept and with only the broad shape left (fewer octaves stand in for a blur)
  const BAKE_PROFILE = `#version 300 es
precision highp float;
uniform vec2 uTS;
uniform vec4 uPL[4];
out vec4 o;
${HASH}
float h1(float i, float per, float s) { return float(hsh(uint(mod(i, per)) + hsh(uint(s)))) * (1.0 / 4294967296.0); }
float vn(float x, float per, float s) {
float i = floor(x), f = x - i, u = f * f * (3.0 - 2.0 * f);
return mix(h1(i, per, s), h1(i + 1.0, per, s), u);
}
// ridged multifractal: knife-edge summits, smooth saddles, crags only where the ridge is already high
float prof(float x, vec4 L, int oct) {
float per = uTS.x / L.x, q = x / L.x;
float sum = 0.0, a = 1.0, wgt = 1.0, norm = 0.0, fr = 1.0;
for (int o = 0; o < 10; o++) {
  if (float(o) >= L.y) break;
  norm += a;
  if (o < oct) {
    // a softened |x| rounds every crest instead of leaving knife-edge tips
    float x = vn(q * fr, per * fr, L.z + float(o) * 131.0) * 2.0 - 1.0;
    float n = (1.0 - sqrt(x * x + 0.02)) / (1.0 - sqrt(0.02));
    n *= n * wgt;
    sum += n * a;
    wgt = clamp(n * 2.2, 0.0, 1.0);
  }
  a *= 0.5; fr *= 2.0;
}
float m = vn(q * 0.25, per * 0.25, L.z + 977.0) * 0.6 + vn(q * 0.5, per * 0.5, L.z + 1311.0) * 0.4;
float h = (0.07 + sum / norm * 0.98) * (0.5 + 0.65 * m);
return h > 0.78 ? 0.78 + 0.22 * tanh((h - 0.78) / 0.22) : h;
}
uniform float uMesa;
// canyon mesas: the same profile quantised into flat tops and sheer steps
float terr(float h) { float v = h * 4.0, fl = floor(v), f = v - fl; return (fl + smoothstep(0.66, 1.0, f)) / 4.0; }
float profT(float x, vec4 L, int oc) { float h = prof(x, L, oc); return uMesa > 0.5 ? terr(h) * 0.95 + 0.02 : h; }
void main() {
vec4 L = uPL[int(gl_FragCoord.y)];
float x = gl_FragCoord.x - 0.5;
int oc = int(L.y);
float h = profT(x, L, oc);
float s1 = (profT(x + 2.0, L, oc - 3) - profT(x - 2.0, L, oc - 3)) / 4.0;
float s2 = (profT(x + 26.0, L, 3) - profT(x - 26.0, L, 3)) / 52.0;
o = vec4(clamp(h / 1.1, 0.0, 1.0), clamp(0.5 + s1 * 8.0, 0.0, 1.0), clamp(0.5 + s2 * 8.0, 0.0, 1.0), 1.0);
}`;

  const COMMON = `#version 300 es
precision highp float;
precision highp sampler2D;
uniform sampler2D uN;
uniform vec2 uRes;
uniform float uT;
out vec4 o;
const mat2 ROT = mat2(1.6, 1.2, -1.2, 1.6);
vec4 N(vec2 p) { return textureLod(uN, p * 0.0625, 0.0); }
float fall(float a, float b, float x) { return 1.0 - smoothstep(a, b, x); }
// billowy smoke density: perlin-worley fbm cut by a vertical profile
// h is 0 at the flat base and 1 at the deck top, tall is how high this column towers
float cloudD(vec2 q, float h, float tall, int oct) {
float prof = smoothstep(-0.24, 0.1, h) * fall(tall * 0.7, tall + 0.1, h);
if (prof <= 0.0) return 0.0;
float s = 0.0, a = 0.5, nrm = 0.0;
for (int i = 0; i < 5; i++) {
  if (i >= oct) break;
  vec4 n = N(q);
  s += a * mix(n.r, n.g, i < 2 ? 0.7 : 0.5);
  nrm += a;
  q = ROT * q + vec2(1.7, 9.2);
  a *= 0.5;
}
return clamp((s / nrm - mix(0.78, 0.36, prof)) * 3.2, 0.0, 1.0);
}
`;

  const MAIN = COMMON + HASH + `
uniform sampler2D uP;
uniform vec2 uTS;
uniform vec4 uView;
uniform float uCam, uPx;
uniform vec3 uTop, uMid, uBot, uSunC, uGlow, uFar, uNear, uFog, uCld, uLit;
uniform vec4 uLt, uEnv, uBolt, uDk, uFr;
uniform vec4 uMA[4], uMB[4], uMC[4];
// storm share, cloud cover and darkening at this pixel, set where the weather front has reached
float gStorm, gCov, gDark;

float hr(float c) { return float(hsh(uint(int(c) + 1048576))) * (1.0 / 4294967296.0); }
// one row of conifer tips along the skyline: height and steepness at x
vec2 firs(float x, float w, float off) {
float c = floor(x / w + off), f = x / w + off - c, r = hr(c + off * 977.0);
float wid = 0.5 + 0.45 * r;
float tip = max(0.0, 1.0 - abs(f - 0.5) * 2.0 / wid);
float hgt = 0.45 + 0.75 * r;
return vec2(hgt * pow(tip, 1.5), tip > 0.0 ? hgt * 3.0 * sqrt(tip) / (w * wid) : 0.0);
}

// one painted range: a crisp ridge line, soft lit and shaded flanks, brushed snow and a misty foot
vec4 range(int r, vec2 p) {
vec4 A = uMA[r], B = uMB[r], C = uMC[r];
float wx = p.x + uCam * A.z;
float tx = wx / A.w + B.w;
vec4 P = textureLod(uP, vec2((tx + 0.5) / uTS.x, (float(r) + 0.5) / uTS.y), 0.0);
float hgt = P.r * 1.1;
float k = A.y / A.w * 0.125;
float sl1 = -(P.g - 0.5) * k, sl2 = -(P.b - 0.5) * k;   // dy/dx of the ridge line, fine and broad
float S = A.x - hgt * A.y, steep = abs(sl1);
float treeA = B.z * fall(0.22, 0.4, hgt);
if (treeA > 0.0) {
  vec2 f1 = firs(wx, 4.3, 0.0), f2 = firs(wx, 6.9, 0.37);
  vec2 t = f1.x > f2.x ? f1 : f2;
  S -= t.x * C.w * treeA;
  steep += t.y * C.w * treeA;
}
float d = p.y - S;
// a feathered edge, wider for the hazier ranges, so the skyline reads as painted rather than cut
float fw = uPx * (1.6 + 4.0 * B.x);
float cov = smoothstep(-0.5 * fw, 0.5 * fw, d * inversesqrt(1.0 + steep * steep));
if (cov <= 0.0) return vec4(0.0);
float sd = A.x * 0.013 + float(r) * 3.7;
float alt = (A.x - p.y) / A.y;
float la = uLt.z;
// which way the flank faces against where the light comes from; the broad slope is read a little
// to the side as we go down, so each light/shade split runs diagonally off its summit
float slb = -(textureLod(uP, vec2((tx + d * 0.45 / A.w + 0.5) / uTS.x, (float(r) + 0.5) / uTS.y), 0.0).b - 0.5) * k;
float face = clamp(mix(sl1, slb, smoothstep(0.0, 14.0, d)) * 1.3, -1.0, 1.0);
float side = clamp((uLt.x - p.x) / 380.0, -1.0, 1.0);
float brush = N(vec2(wx * 0.022, p.y * 0.0075) + sd).a;
float lit = smoothstep(-0.45, 0.45, face * side + (brush - 0.5) * 0.3);
lit = mix(lit, 0.5, smoothstep(40.0, 170.0, d) * 0.6);
vec3 ink = mix(uNear, uFar, C.x);
vec3 litC = mix(ink, mix(uLit, uSunC, 0.5), 0.24 * la);
vec3 shdC = mix(ink, mix(uNear, uTop, 0.25) * 0.85, 0.2);
vec3 c = mix(shdC, litC, lit * (0.35 + 0.65 * la));
// brushed snow caps hugging the ridge: deeper under the tall summits, ragged where it runs down gullies
if (B.y < 1.0) {
  float streak = N(vec2(wx * 0.021, p.y * 0.004) + sd * 1.3).r * 0.65 + N(vec2(wx * 0.07, p.y * 0.011) + sd).g * 0.35;
  float reach = (hgt - B.y) * A.y * 1.6 + (streak - 0.5) * 64.0 + (brush - 0.5) * 10.0;
  float snow = smoothstep(-4.0, 5.0, reach - d) * smoothstep(B.y - 0.1, B.y + 0.02, hgt);
  vec3 cold = mix(ink, mix(uTop, uMid, 0.5), 0.35) * 1.2 + 0.05;
  vec3 warm = mix(mix(vec3(1.0), uLit, 0.3) * (0.78 + 0.26 * la), ink, 0.12);
  c = mix(c, mix(cold, warm, lit * la), snow * 0.8);
}
// soft grain of long vertical strokes
c *= 1.0 + (N(vec2(wx * 0.06, p.y * 0.012) + sd * 2.1).b - 0.5) * 0.07;
// light catching the crest
c += mix(uGlow, uSunC, 0.5) * exp(-d / 2.2) * la * lit * C.z * 0.5;
// the air in front, then the foot of the range dissolving into mist
vec3 fogC = mix(mix(uFog, uFar, 0.25), uGlow, 0.22 * la * exp(-abs(uLt.x - p.x) / 520.0));
float m = max(smoothstep(0.0, C.y, d) * 0.72, smoothstep(A.x - A.y * 0.4, A.x + 12.0, p.y));
c = mix(c, fogC, clamp(B.x + (1.0 - B.x) * m, 0.0, 1.0));
return vec4(c * cov, cov);
}

// a long bank of cloud drifting along a range, stretched and feathered like the mist in a painting
// yc: centre line, th: half thickness, hz: how much of the air in front swallows it
vec4 drift(vec2 p, float yc, float th, float par, float spd, float sd, float amax, float hz) {
float dy = (p.y - yc) / th;
if (abs(dy) > 1.8) return vec4(0.0);
float wx = p.x + uCam * par + uT * spd;
// the band breaks into separate banks, and its centre line rises and dips along the way
float cov = smoothstep(0.44, 0.7, N(vec2(wx * 0.0011 + sd * 1.3, sd * 2.7)).r);
if (cov <= 0.0) return vec4(0.0);
dy -= (N(vec2(wx * 0.0026, sd)).b - 0.5) * 0.9;
vec2 q = vec2(wx * 0.0042, p.y * 0.017) + sd;
vec2 t = vec2(uT * 0.011, uT * -0.004);
vec2 wv = (N(q * 0.9 + t).rb - 0.5) * vec2(1.5, 0.7);
q += wv;
float n = N(q).r * 0.55 + N(ROT * q * 1.7 + 4.2).g * 0.3 + N(q * vec2(4.1, 3.3) + 9.1).b * 0.15;
// billowy top, feathered underside
float prof = exp(-dy * dy * (dy < 0.0 ? 2.2 : 1.2));
float dens = clamp((n * prof * cov - 0.26) * 3.4, 0.0, 1.0);
if (dens <= 0.0) return vec4(0.0);
float a = amax * dens;
// tops catch the sky and the low sun, undersides take the valley's tone
float top = clamp(0.55 - dy * 0.5, 0.0, 1.0);
vec3 c = mix(mix(uFog, uFar, 0.35), mix(uCld, uFog, 0.15), top);
c = mix(c, mix(uGlow, uSunC, 0.5), uLt.z * 0.32 * top * exp(-abs(uLt.x - p.x) / 480.0));
c = mix(c, mix(uFog, uFar, 0.25), hz);
return vec4(c * a, a);
}

// rolling smoke-like mist along the foot of a range
vec4 mist(vec2 p, float y0, float y1, float amax, float par, float sd) {
float gy = smoothstep(y0, y1, p.y);
if (gy <= 0.0) return vec4(0.0);
vec2 q = vec2((p.x + uCam * par * 1.4) * 0.006 + uT * 0.012, p.y * 0.024) + sd;
vec2 wv = (N(q * 0.7 + vec2(uT * 0.011, uT * -0.007)).rb - 0.5) * 1.4;
float n = N(q + wv).r * 0.6 + N(ROT * (q + wv) + 3.1).g * 0.4;
float a = amax * clamp(gy * (0.3 + 1.4 * n) - 0.1 * (1.0 - gy), 0.0, 1.0);
vec3 c = mix(uFog, mix(uGlow, uSunC, 0.4), uLt.z * 0.25 * exp(-abs(uLt.x - p.x) / 500.0));
return vec4(c * a, a);
}

float massAt(float wx, vec4 dk, float sd) {
float q = wx / dk.z;
float m = N(vec2(q * 0.22 + sd, sd * 3.7)).r * 0.52
        + N(vec2(q * 0.55 + sd * 1.3, sd * 5.1)).b * 0.28
        + N(vec2(q * 1.30 - sd * 2.1, sd * 6.7)).g * 0.20;
return smoothstep(0.40, 0.72, m + dk.w);
}

// a deck of cumulus: dk = top y, base y, feature size, coverage
vec4 deck(vec2 p, vec4 dk, float par, float drift, float sd, float dens) {
float H = dk.y - dk.x;
float h = (dk.y - p.y) / H;
if (h < -0.4 || h > 1.25) return vec4(0.0);
float wx = p.x + uCam * par + uT * drift + uFr.w;
float tall = massAt(wx, dk, sd);
if (tall < 0.06) return vec4(0.0);
// the base wanders a little so the decks never read as ruled lines
h += (N(vec2(wx / dk.z * 0.72, sd * 2.9)).r - 0.5) * 0.26;
vec2 q = vec2(wx / (dk.z * 0.66), p.y / (dk.z * 0.54)) + sd;
// two-step warp keeps the edges curling and streaming like smoke
vec2 t = vec2(uT * 0.017, uT * -0.006);
vec2 wv = (N(q * 0.8 + t).rb - 0.5) * 0.85;
wv += (N(q * 2.2 - t * 2.3 + wv * 0.5 + 4.0).rb - 0.5) * 0.32;
q += wv;
float D = cloudD(q, h, tall, 5) * dens * smoothstep(0.06, 0.3, tall);
if (D < 0.003) return vec4(0.0);
// march toward the sun or moon for self-shadowing
vec2 ld = normalize(uLt.xy - p + vec2(0.001, -0.001));
float tau = 0.0;
for (int i = 1; i <= 3; i++) {
  float s = float(i * i) * 0.1;
  vec2 o2 = ld * s;
  tau += cloudD(q + o2, h - o2.y * (dk.z * 0.54) / H, tall, 2) * (0.1 + s * 0.6);
}
tau *= dens * 2.4 * (1.0 + gDark);
float Tl = exp(-tau);
float ms = max(Tl, 0.5 * exp(-tau * 0.18));
float la = uLt.z;
float fwd = exp(-length(uLt.xy - p) / 210.0);
vec3 Lc = mix(uLit, uSunC, 0.45);
vec3 amb = mix(mix(uFog, uBot, 0.5) * 0.85, mix(uTop, uMid, 0.6), clamp(h * 0.8 + 0.2, 0.0, 1.0));
amb = mix(amb, vec3(dot(amb, vec3(0.3, 0.59, 0.11))), 0.4);
vec3 c = uCld * (amb * 0.8 + Lc * la * ms * (0.6 + 1.5 * fwd)) * (1.0 - 0.35 * gDark);
// thin, backlit fringes glow (silver lining)
c += mix(uGlow, uSunC, 0.5) * la * fwd * exp(-D * 2.5) * 1.1;
// lightning lights the cloud from inside
float bl = uBolt.z * exp(-length(p - uBolt.xy) / 170.0) + uEnv.w * 0.45;
c += vec3(0.75, 0.8, 1.0) * bl * (1.0 - exp(-D * 3.0));
float a = 1.0 - exp(-D * 3.5);
return vec4(c * a, a);
}

// high, thin streaks that catch the last light
vec4 cirrus(vec2 p) {
float top = min(uDk.x, uDk.w) - 40.0;
float band = smoothstep(top - 10.0, top + 60.0, p.y) * fall(160.0, 250.0, p.y);
if (band <= 0.0) return vec4(0.0);
vec2 q = vec2((p.x + uCam * 0.008 + uT * 2.2) * 0.0024, p.y * 0.02) + 11.0;
vec4 w1 = N(q * vec2(0.6, 1.2));
q.y += (w1.r - 0.5) * 1.6;
q.x += (w1.b - 0.5) * 0.5;
float s = N(q * vec2(1.0, 2.8)).a * 0.6 + N(q * vec2(2.4, 6.2) + 3.0).r * 0.4;
float cov = N(vec2(q.x * 0.22, 2.0)).g;
float a = smoothstep(0.6, 0.88, s * (0.3 + 1.2 * cov * cov)) * band * 0.26 * (1.0 - 0.6 * gStorm);
float fwd = exp(-length(uLt.xy - p) / 300.0);
vec3 c = mix(uCld, mix(uLit, uGlow, 0.5), 0.45) * (0.85 + 0.5 * uLt.z * fwd);
return vec4(c * a, a);
}

void main() {
vec2 uv = gl_FragCoord.xy / uRes;
vec2 p = vec2(mix(uView.x, uView.z, uv.x), mix(uView.w, uView.y, uv.y));
// front to back, stopping once the pixel is opaque
// how far the incoming weather has reached at this x
float wk = uFr.z > 0.0 ? smoothstep(uFr.x, uFr.y, p.x) : 1.0 - smoothstep(uFr.x, uFr.y, p.x);
gStorm = uEnv.y * wk;
float bliz = uEnv.z * wk;
gCov = gStorm * 0.34 + bliz * 0.3 - uDk.y;
gDark = gStorm * 0.8 + bliz * 0.25;
// rain and snow storms carry their clouds higher in the sky
float lift = (gStorm + bliz) * 120.0;
vec4 acc = vec4(0.0);
vec4 s;
for (int r = 3; r >= 0; r--) {
  if (acc.a > 0.996) break;
  vec4 A = uMA[r];
  float fr = float(r), far = 1.0 - fr / 3.0;
  // cloud banks drifting across the upper flanks and around the foot of the range
  if (r == 1 || r == 2) { s = drift(p, A.x - A.y * 0.56, 17.0 + fr * 3.0, A.z * 1.2, 2.5 + fr, 11.0 + fr * 5.3, 0.82 - far * 0.2, far * 0.3); acc += s * (1.0 - acc.a); }
  s = drift(p, A.x - A.y * 0.2, 21.0 + fr * 4.0, A.z * 1.2, 3.5 + fr * 1.5, 31.0 + fr * 4.1, 0.85 - far * 0.3, far * 0.3);
  acc += s * (1.0 - acc.a);
  s = mist(p, A.x - A.y * 0.42, A.x + 30.0, 0.55 - fr * 0.04, A.z, 2.0 + fr * 3.1);
  acc += s * (1.0 - acc.a);
  s = range(r, p);
  acc += s * (1.0 - acc.a);
  // nestle the lower cumulus deck between the nearer and farther mountain ranges
  if (r == 2 && acc.a < 0.996) {
    s = deck(p, vec4(145.0 - lift, 336.0 - lift, 175.0, gCov - 0.14), 0.05, 5.5, 3.1, 0.95);
    acc += s * (1.0 - acc.a);
  }
}
if (acc.a < 0.996) { s = deck(p, vec4(uDk.x - lift, 235.0 - lift, 165.0, gCov - 0.10), 0.022, 3.5, 7.7, 0.92); acc += s * (1.0 - acc.a); }
// tall screens show more sky: stack higher decks into it
if (uDk.w < -60.0 && acc.a < 0.996) { s = deck(p, vec4(-400.0, -10.0, 165.0, gCov - 0.10), 0.016, 3.0, 12.3, 0.88); acc += s * (1.0 - acc.a); }
if (uDk.w < -460.0 && acc.a < 0.996) { s = deck(p, vec4(-820.0, -430.0, 175.0, gCov - 0.12), 0.012, 2.6, 17.9, 0.84); acc += s * (1.0 - acc.a); }
if (acc.a < 0.996) { s = cirrus(p); acc += s * (1.0 - acc.a); }
o = acc;
}`;

  // radial blur of the unoccluded sky around the sun: crepuscular rays
  const SHAFTS = COMMON + `
uniform sampler2D uS;
uniform vec4 uSV, uFV;
uniform vec2 uLP;
uniform vec3 uLC;
uniform float uLR;
void main() {
vec2 uv = gl_FragCoord.xy / uRes;
vec2 p = vec2(mix(uFV.x, uFV.z, uv.x), mix(uFV.w, uFV.y, uv.y));
vec2 dv = uLP - p;
float jit = fract(sin(dot(gl_FragCoord.xy, vec2(12.9898, 78.233))) * 43758.5453);
float acc = 0.0, w = 1.0;
for (int i = 0; i < 40; i++) {
  vec2 s = p + dv * ((float(i) + jit) / 40.0);
  vec2 su = vec2((s.x - uSV.x) / (uSV.z - uSV.x), (uSV.w - s.y) / (uSV.w - uSV.y));
  float occ = (su.x > 0.0 && su.x < 1.0 && su.y > 0.0 && su.y < 1.0) ? textureLod(uS, su, 0.0).a : 0.0;
  vec2 e = s - uLP;
  acc += (1.0 - occ) * exp(-dot(e, e) / (uLR * uLR)) * w;
  w *= 0.972;
}
o = vec4(uLC * acc / 40.0, 1.0);
}`;

  // one cloud sprite: uMode 0 writes the volumetric density mask, 1 writes the self-shadow map with the exact same smoke & scattering as deck()
  const SPRITE = COMMON + `
uniform vec4 uSp;
uniform vec2 uSz;
uniform float uMode;
void main() {
vec2 uv = gl_FragCoord.xy / uRes;
vec2 lp = vec2(uv.x * uSp.x, (1.0 - uv.y) * uSp.y);
float pad = uSp.z, rawSd = uSp.w;
float isStorm = step(50.0, rawSd);
float sd = mod(rawSd, 50.0);
float bx = (lp.x - pad - uSz.x * 0.5) / (uSz.x * 0.5);
float h = (pad + uSz.y - lp.y) / uSz.y;
float ax = abs(bx);
if (ax >= 1.12 || h < -0.35 || h > 1.35) { o = vec4(0.0); return; }
// organic wandering base and asymmetric multi-turret cumulus profile matching deck()
h += (N(vec2(bx * 1.4 + sd * 2.1, sd * 2.9)).r - 0.5) * 0.24;
float sk = sin(sd * 3.7) >= 0.0 ? 1.0 : -1.0;
float t1 = exp(-pow((bx - sk * 0.12) / 0.44, 2.0)) * 0.95;
float t2 = exp(-pow((bx + sk * 0.32) / 0.38, 2.0)) * (0.70 + 0.14 * sin(sd * 1.9));
float t3 = exp(-pow((bx - sk * 0.48) / 0.28, 2.0)) * (0.48 + 0.12 * cos(sd * 2.3));
float shelf = sqrt(max(0.0, 1.0 - ax * ax)) * 0.48;
float dome = max(max(t1, t2), max(t3, shelf)) * fall(0.64, 0.98, ax);
float n1 = N(vec2(bx * 1.35 + sd, sd)).r;
float n2 = N(vec2(bx * 3.2 + sd, sd * 1.7)).g;
float n3 = N(vec2(bx * 6.8 + sd, sd * 2.3)).g;
float top = dome * (0.56 + 0.35 * n1 + 0.28 * n2 + 0.20 * n3);
float sz = uSz.y * 0.54;
vec2 q = vec2(lp.x / (sz * 1.18), lp.y / sz) + sd;
vec2 wv = (N(q * 0.8).rb - 0.5) * 0.85;
wv += (N(q * 2.2 + wv * 0.5 + 4.0).rb - 0.5) * 0.32;
q += wv;
float D = cloudD(q, h, top, 5) * smoothstep(0.06, 0.30, top);
float a = (1.0 - exp(-D * (3.6 + 0.4 * isStorm))) * fall(0.72, 1.0, ax);
if (uMode < 0.5) {
  o = vec4(a);
  return;
}
vec2 ld = normalize(vec2(-0.45, -1.0));
float tau = 0.0;
for (int i = 1; i <= 3; i++) {
  float s = float(i * i) * 0.10;
  vec2 o2 = ld * s;
  tau += cloudD(q + o2, h - o2.y * (sz / uSz.y), top, 2) * (0.1 + s * 0.6);
}
float Tl = exp(-tau * (2.5 + 0.3 * isStorm));
float ms = max(Tl, 0.5 * exp(-tau * 0.18));
float silver = exp(-D * 2.5) * smoothstep(0.05, 0.55, h);
float shd = clamp((1.0 - ms) * 0.84 + (1.0 - clamp(h, 0.0, 1.0)) * 0.30 - silver * 0.35, 0.0, 0.94);
o = vec4(a * shd);
}`;

  function program(fs) {
    const p = gl.createProgram();
    for (const [type, src] of [[gl.VERTEX_SHADER, VS], [gl.FRAGMENT_SHADER, fs]]) {
      const s = gl.createShader(type);
      gl.shaderSource(s, src);
      gl.compileShader(s);
      if (!gl.getShaderParameter(s, gl.COMPILE_STATUS)) { console.warn('sky shader:', gl.getShaderInfoLog(s)); return null; }
      gl.attachShader(p, s);
    }
    gl.linkProgram(p);
    if (!gl.getProgramParameter(p, gl.LINK_STATUS)) { console.warn('sky program:', gl.getProgramInfoLog(p)); return null; }
    const u = {};
    const n = gl.getProgramParameter(p, gl.ACTIVE_UNIFORMS);
    for (let i = 0; i < n; i++) {
      const name = gl.getActiveUniform(p, i).name;
      u[name.replace(/\[0\]$/, '')] = gl.getUniformLocation(p, name);
    }
    return { p, u };
  }
  const progs = [BAKE_NOISE, BAKE_PROFILE, MAIN, SHAFTS, SPRITE].map(program);
  if (progs.some((p) => !p)) return api;
  const [bakeN, bakeP, main, shaft, sprite] = progs;

  function tex(unit, internal, w, h, fmt, type, filter, wrapS, wrapT) {
    const t = gl.createTexture();
    gl.activeTexture(gl.TEXTURE0 + unit);
    gl.bindTexture(gl.TEXTURE_2D, t);
    gl.texImage2D(gl.TEXTURE_2D, 0, internal, w, h, 0, fmt, type, null);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, filter);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, filter);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, wrapS);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, wrapT || wrapS);
    return t;
  }
  function target(t) {
    const f = gl.createFramebuffer();
    gl.bindFramebuffer(gl.FRAMEBUFFER, f);
    gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, t, 0);
    return gl.checkFramebufferStatus(gl.FRAMEBUFFER) === gl.FRAMEBUFFER_COMPLETE ? f : null;
  }
  function bind(unit, t, loc) {
    gl.activeTexture(gl.TEXTURE0 + unit);
    gl.bindTexture(gl.TEXTURE_2D, t);
    if (loc) gl.uniform1i(loc, unit);
  }

  // ---- one-time bakes ----
  // cloud noise: half floats keep the gradients smooth when the GPU can render them
  let noiseTex = null, nfb = null;
  if (gl.getExtension('EXT_color_buffer_float')) {
    noiseTex = tex(0, gl.RGBA16F, 512, 512, gl.RGBA, gl.HALF_FLOAT, gl.LINEAR, gl.REPEAT);
    nfb = target(noiseTex);
  }
  if (!nfb) {
    noiseTex = tex(0, gl.RGBA8, 512, 512, gl.RGBA, gl.UNSIGNED_BYTE, gl.LINEAR, gl.REPEAT);
    nfb = target(noiseTex);
  }
  if (!nfb) return api;
  gl.viewport(0, 0, 512, 512);
  gl.useProgram(bakeN.p);
  gl.uniform1f(bakeN.u.uP, 16);
  gl.drawArrays(gl.TRIANGLES, 0, 3);

  // ridge profiles: 10-bit height and slopes, wrapping across x so the ranges never end
  const TW = gl.getParameter(gl.MAX_TEXTURE_SIZE) >= 8192 ? 8192 : 4096, NL = MTN.length;
  const profTex = tex(1, gl.RGB10_A2, TW, NL, gl.RGBA, gl.UNSIGNED_INT_2_10_10_10_REV, gl.LINEAR, gl.REPEAT, gl.CLAMP_TO_EDGE);
  if (!target(profTex)) return api;
  const pl = new Float32Array(16), ma = new Float32Array(16), mb = new Float32Array(16), mc = new Float32Array(16);
  MTN.forEach((m, i) => {
    pl.set([m.cell * (TW / 8192), m.oct, m.seed, 0], i * 4);
    ma.set([m.base, m.amp, m.par, m.xs * (8192 / TW)], i * 4);
    mb.set([m.haze, m.snow, m.forest, (i * 1777) % TW], i * 4);
    mc.set([m.tone, m.fade, m.rim, m.tree], i * 4);
  });
  gl.viewport(0, 0, TW, NL);
  gl.useProgram(bakeP.p);
  gl.uniform2f(bakeP.u.uTS, TW, NL);
  gl.uniform4fv(bakeP.u.uPL, pl);
  if (bakeP.u.uMesa) gl.uniform1f(bakeP.u.uMesa, 0);
  gl.drawArrays(gl.TRIANGLES, 0, 3);
  // the same ranges cut into flat-topped, terraced mesas for the canyon country
  const profTexC = tex(1, gl.RGB10_A2, TW, NL, gl.RGBA, gl.UNSIGNED_INT_2_10_10_10_REV, gl.LINEAR, gl.REPEAT, gl.CLAMP_TO_EDGE);
  const cfb = bakeP.u.uMesa ? target(profTexC) : null;
  if (cfb) { gl.viewport(0, 0, TW, NL); gl.uniform1f(bakeP.u.uMesa, 1); gl.drawArrays(gl.TRIANGLES, 0, 3); }
  const mbC = mb.slice(), mcC = mc.slice(), mbP = mb.slice();
  for (let i = 0; i < NL; i++) { mbC[i * 4 + 1] = 9; mbC[i * 4 + 2] = 0; mcC[i * 4 + 3] = 0; mbP[i * 4 + 1] = 0.05; mbP[i * 4 + 2] = 0; }
  gl.bindFramebuffer(gl.FRAMEBUFFER, null);

  // ---- per-frame targets ----
  let sceneTex = null, sfb = null;
  let gw = 0, gh = 0, k = 1, X0 = 0, Y0 = 0, X1 = 0, Y1 = 0;
  const M = 14, YB = 536; // margin around the view; the lake hides everything below YB

  function resize() {
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    k = (scale * Math.min(dpr, 1.5)) / dpr;
    X0 = -M; Y0 = viewTop - M;
    gw = Math.max(2, Math.ceil((W + 2 * M) * k));
    gh = Math.max(2, Math.ceil((YB - Y0) * k));
    X1 = X0 + gw / k; Y1 = Y0 + gh / k;
    glc.width = gw; glc.height = gh;
    if (sceneTex) gl.deleteTexture(sceneTex);
    if (sfb) gl.deleteFramebuffer(sfb);
    sceneTex = tex(2, gl.RGBA8, gw, gh, gl.RGBA, gl.UNSIGNED_BYTE, gl.LINEAR, gl.CLAMP_TO_EDGE);
    sfb = target(sceneTex);
    gl.bindFramebuffer(gl.FRAMEBUFFER, null);
    if (!sfb) api.ok = false;
  }

  const c3 = (loc, c) => gl.uniform3f(loc, c[0] / 255, c[1] / 255, c[2] / 255);

  function render(c) {
    if (!api.ok || gl.isContextLost()) return false;
    const u = main.u, src = lightSrc();
    gl.bindFramebuffer(gl.FRAMEBUFFER, sfb);
    gl.viewport(0, 0, gw, gh);
    gl.useProgram(main.p);
    bind(0, noiseTex, u.uN);
    const cy = CANYON && cfb;
    bind(1, cy ? profTexC : profTex, u.uP);
    gl.uniform2f(u.uTS, TW, NL);
    gl.uniform2f(u.uRes, gw, gh);
    gl.uniform4f(u.uView, X0, Y0, X1, Y1);
    gl.uniform1f(u.uT, RM ? time * 0.35 : time);
    gl.uniform1f(u.uCam, camX);
    gl.uniform1f(u.uPx, 1 / k);
    c3(u.uTop, pal.top); c3(u.uMid, pal.mid); c3(u.uBot, pal.bot); c3(u.uSunC, pal.sun); c3(u.uGlow, pal.glow);
    c3(u.uFar, pal.far); c3(u.uNear, pal.near); c3(u.uFog, pal.fog); c3(u.uCld, pal.cloud); c3(u.uLit, pal.light);
    gl.uniform4f(u.uLt, src.x, src.y, lightAmt(), sun.a >= moon.a ? 1 : 0);
    const fr = weatherFront();
    gl.uniform4f(u.uEnv, pal.stars, weather.type === 'rain' ? 1 : 0, weather.type === 'blizzard' ? 1 : 0, flash);
    gl.uniform4f(u.uFr, fr[0], fr[1], fr[2], wxDrift);
    if (bgBolt) gl.uniform4f(u.uBolt, bgBolt.b.main[0], bgBolt.b.main[1] + 30, clamp(bgBolt.t / 0.22, 0, 1) * 1.4, 0);
    else gl.uniform4f(u.uBolt, 0, 0, 0, 0);
    gl.uniform4f(u.uDk, 10, (1 - cloudCover) * 0.62, 0, viewTop);
    gl.uniform4fv(u.uMA, ma); gl.uniform4fv(u.uMB, cy || VOLCANO ? mbC : POLAR ? mbP : mb); gl.uniform4fv(u.uMC, cy || POLAR || VOLCANO ? mcC : mc);
    gl.drawArrays(gl.TRIANGLES, 0, 3);
    gl.bindFramebuffer(gl.READ_FRAMEBUFFER, sfb);
    gl.bindFramebuffer(gl.DRAW_FRAMEBUFFER, null);
    gl.blitFramebuffer(0, 0, gw, gh, 0, 0, gw, gh, gl.COLOR_BUFFER_BIT, gl.NEAREST);
    gl.bindFramebuffer(gl.FRAMEBUFFER, null);
    c.drawImage(glc, 0, 0, gw, gh, X0, Y0, X1 - X0, Y1 - Y0);
    return true;
  }

  // the lake mirrors the ranges and clouds (the GL canvas still holds this frame's sky)
  function reflect(c, wl, alpha) {
    if (!api.ok) return;
    c.save();
    c.translate(0, 2 * wl);
    c.scale(1, -1);
    c.globalAlpha = alpha;
    c.drawImage(glc, 0, 0, gw, gh, X0, Y0, X1 - X0, Y1 - Y0);
    c.restore();
  }

  function shafts(c) {
    if (!api.ok || gl.isContextLost()) return;
    const isSun = sun.a >= moon.a, src = isSun ? sun : moon;
    // rays read best when the light is low and slanting through the ridges
    const low = 0.45 + 0.55 * clamp((src.y - 200) / 220, 0, 1);
    const amt = (isSun ? sun.a * 0.16 : moon.a * 0.1) * low * (1 - stormAmt() * 0.85) * (1 - blizAmt() * 0.8);
    if (amt < 0.02) return;
    const fy0 = viewTop - M, fh = VH + 2 * M;
    const sw = Math.max(2, Math.round(gw / 3)), sh = Math.max(2, Math.min(gh, Math.round((fh * k) / 3)));
    const u = shaft.u;
    gl.bindFramebuffer(gl.FRAMEBUFFER, null);
    gl.viewport(0, 0, sw, sh);
    gl.useProgram(shaft.p);
    bind(2, sceneTex, u.uS);
    gl.uniform2f(u.uRes, sw, sh);
    gl.uniform4f(u.uSV, X0, Y0, X1, Y1);
    gl.uniform4f(u.uFV, X0, fy0, X1, fy0 + fh);
    gl.uniform2f(u.uLP, src.x, src.y);
    const col = isSun ? mix(pal.glow, pal.sun, 0.35) : [190, 210, 255];
    gl.uniform3f(u.uLC, (col[0] / 255) * amt, (col[1] / 255) * amt, (col[2] / 255) * amt);
    gl.uniform1f(u.uLR, isSun ? 50 : 36);
    gl.drawArrays(gl.TRIANGLES, 0, 3);
    c.globalCompositeOperation = 'lighter';
    c.drawImage(glc, 0, gh - sh, sw, sh, X0, fy0, X1 - X0, fh);
    c.globalCompositeOperation = 'source-over';
  }

  // storm clouds: bake mask + shade sprites with the same smoke as the sky
  function bakeCloud(cl, s) {
    if (!api.ok || !gw || gl.isContextLost()) return false;
    const w = cl.w, h = cl.h, pad = Math.round(h * 0.4), lw = w + pad * 2, lh = h + pad * 2;
    const cw = Math.max(2, Math.ceil(lw * s)), ch = Math.max(2, Math.ceil(lh * s));
    const sw = Math.min(cw, gw), sh = Math.min(ch, gh);
    const mask = document.createElement('canvas'), shade = document.createElement('canvas'), tint = document.createElement('canvas');
    mask.width = shade.width = tint.width = cw;
    mask.height = shade.height = tint.height = ch;
    const u = sprite.u;
    gl.bindFramebuffer(gl.FRAMEBUFFER, null);
    gl.viewport(0, 0, sw, sh);
    gl.useProgram(sprite.p);
    bind(0, noiseTex, u.uN);
    gl.uniform2f(u.uRes, sw, sh);
    gl.uniform4f(u.uSp, lw, lh, pad, rand(0, 16) + (cl.storm ? 100 : 0));
    gl.uniform2f(u.uSz, w, h);
    for (const [mode, cv] of [[0, mask], [1, shade]]) {
      gl.uniform1f(u.uMode, mode);
      gl.drawArrays(gl.TRIANGLES, 0, 3);
      cv.getContext('2d').drawImage(glc, 0, gh - sh, sw, sh, 0, 0, cw, ch);
    }
    cl.mask = mask; cl.shade = shade; cl.tint = tint; cl.pad = pad; cl.lw = lw; cl.lh = lh;
    return true;
  }

  glc.addEventListener('webglcontextlost', (e) => {
    e.preventDefault();
    api.ok = false;
    // fall back to painted clouds for the rest of the session
    if (!clouds.length) {
      for (let i = 0; i < 9; i++) clouds.push(makeCloud(0, true));
      for (let i = 0; i < 3; i++) clouds.push(makeCloud(1, true));
    }
  });

  api.ok = true;
  api.resize = resize;
  api.render = render;
  api.reflect = reflect;
  api.shafts = shafts;
  api.bakeCloud = bakeCloud;
  return api;
})();
