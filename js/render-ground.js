// Süzülüş — Ground, street life and foreground decor
'use strict';

function drawPerson1900s(px, py, dir, ph, style, sc, nightDim, ironCol, skinCol) {
  ctx.save();
  ctx.translate(px, py);
  ctx.scale(dir * sc, sc);

  const stride = Math.sin(ph);
  const bob = Math.abs(Math.cos(ph)) * 1.1;

  // Palette for 1900s period clothing
  const coatPalette = [
    [44, 48, 64],   // Charcoal/navy gentleman's frock coat
    [126, 46, 54],  // Burgundy Belle Epoque dress
    [88, 66, 48],   // Brown tweed waistcoat/jacket
    [52, 82, 92],   // Prussian slate coat
    [142, 106, 68], // Ochre/tan overcoat
  ];
  const rawC = coatPalette[(style * 2 + Math.abs(Math.round(ph * 10))) % coatPalette.length];
  const garb = mix(ironCol, [rawC[0] * nightDim, rawC[1] * nightDim, rawC[2] * nightDim], 0.58);
  const trim = mix(garb, [245, 232, 205], 0.42);

  if (style === 1) {
    // === STYLE 1: 1900s Belle Époque Lady with Long Skirt & Parasol ===
    // Walking feet peeking beneath long skirt
    ctx.strokeStyle = css(ironCol);
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(-1.5 + stride * 2.5, -1); ctx.lineTo(-1.5 + stride * 3.2, 0.5);
    ctx.moveTo(1.5 - stride * 2.5, -1); ctx.lineTo(1.5 - stride * 3.2, 0.5);
    ctx.stroke();

    // Long flared Edwardian skirt + bustle
    ctx.fillStyle = css(garb);
    ctx.beginPath();
    ctx.moveTo(-2.2, -10.5 - bob);
    ctx.quadraticCurveTo(-5.2, -5 - bob, -5.8 + stride * 0.8, -0.8);
    ctx.lineTo(5.2 + stride * 0.8, -0.8);
    ctx.quadraticCurveTo(4.2, -5 - bob, 2.0, -10.5 - bob);
    ctx.closePath();
    ctx.fill();
    // Skirt hem trim
    ctx.strokeStyle = css(trim, 0.7);
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(-5.5 + stride * 0.8, -2.2); ctx.lineTo(4.9 + stride * 0.8, -2.2);
    ctx.stroke();

    // Cinched waist bodice & puffed sleeves
    ctx.fillStyle = css(mix(garb, trim, 0.25));
    ctx.beginPath();
    ctx.moveTo(-2.0, -10.2 - bob);
    ctx.lineTo(-2.8, -15.5 - bob);
    ctx.lineTo(2.6, -15.5 - bob);
    ctx.lineTo(1.8, -10.2 - bob);
    ctx.closePath();
    ctx.fill();

    // Head
    ctx.fillStyle = css(skinCol);
    ctx.beginPath(); ctx.arc(0, -17.8 - bob, 2.1, 0, TAU); ctx.fill();

    // Wide 1900s ribboned hat
    ctx.fillStyle = css(trim);
    ctx.beginPath();
    ctx.ellipse(-0.3, -19.4 - bob, 4.4, 1.1, -0.12, 0, TAU);
    ctx.fill();
    ctx.fillStyle = css(garb);
    ctx.fillRect(-2.2, -20.8 - bob, 3.6, 1.5);

    // Tilted lace parasol held over shoulder
    ctx.strokeStyle = css(ironCol);
    ctx.lineWidth = 1.1;
    ctx.beginPath();
    ctx.moveTo(1.2, -13 - bob);
    ctx.lineTo(-3.2, -24.5 - bob);
    ctx.stroke();
    ctx.fillStyle = css(trim, 0.92);
    ctx.beginPath();
    ctx.moveTo(-9.5, -21.5 - bob);
    ctx.quadraticCurveTo(-3.2, -27.5 - bob, 3.2, -22.2 - bob);
    ctx.closePath();
    ctx.fill();

  } else {
    // === STYLE 0 / 2 / 3: 1900s Gentleman (Bowler/Top Hat & Cane), Worker (Flat Cap), or Child ===
    // Animated walking legs
    ctx.strokeStyle = css(ironCol);
    ctx.lineWidth = 1.8;
    ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.moveTo(-0.8, -8.5 - bob);
    ctx.lineTo(-0.8 + stride * 3.4, 0);
    ctx.moveTo(0.8, -8.5 - bob);
    ctx.lineTo(0.8 - stride * 3.4, 0);
    ctx.stroke();

    // 1900s Coat / Overcoat / Waistcoat torso
    ctx.fillStyle = css(garb);
    ctx.beginPath();
    ctx.moveTo(-2.8, -8.0 - bob);
    ctx.lineTo(-3.1, -15.8 - bob);
    ctx.lineTo(2.9, -15.8 - bob);
    ctx.lineTo(3.2, -8.0 - bob);
    ctx.closePath();
    ctx.fill();

    // Swinging arm + gentleman's walking cane (style === 0) or market basket (style === 2)
    ctx.strokeStyle = css(mix(garb, ironCol, 0.3));
    ctx.lineWidth = 1.5;
    const armX = 2.2 - stride * 2.2, armY = -10.2 - bob;
    ctx.beginPath();
    ctx.moveTo(0.5, -14.8 - bob);
    ctx.lineTo(armX, armY);
    ctx.stroke();

    if (style === 0) {
      // Walking cane
      ctx.strokeStyle = css(ironCol);
      ctx.lineWidth = 1.0;
      ctx.beginPath();
      ctx.moveTo(armX, armY);
      ctx.lineTo(armX + 2.2 + stride * 1.4, 0);
      ctx.stroke();
    } else if (style === 2) {
      // Woven market basket carried in hand
      ctx.fillStyle = css(mix([186, 138, 78], ironCol, 0.35));
      ctx.fillRect(armX - 2.2, armY, 4.6, 3.4);
    }

    // Head
    ctx.fillStyle = css(skinCol);
    ctx.beginPath(); ctx.arc(0, -17.8 - bob, 2.1, 0, TAU); ctx.fill();

    // 1900s Headwear: Top Hat / Bowler Hat (style 0), Flat Cap / Fez (style 2), Newsboy Cap (style 3)
    if (style === 0) {
      ctx.fillStyle = css(ironCol);
      ctx.fillRect(-3.4, -19.5 - bob, 6.8, 1.1);
      ctx.beginPath();
      ctx.roundRect(-2.3, -22.8 - bob, 4.6, 3.5, 1.4);
      ctx.fill();
    } else if (style === 2) {
      // Flat cap (kasket) with front visor
      ctx.fillStyle = css(mix(garb, ironCol, 0.4));
      ctx.beginPath();
      ctx.ellipse(0.4, -19.6 - bob, 3.2, 1.3, -0.1, 0, TAU);
      ctx.fill();
      ctx.fillRect(0.5, -19.4 - bob, 3.4, 0.9);
    } else {
      // Sailor / Newsboy cap
      ctx.fillStyle = css(trim);
      ctx.beginPath();
      ctx.arc(0, -19.5 - bob, 2.4, Math.PI, 0);
      ctx.fill();
    }
  }

  ctx.restore();
}

const AWNING_SCHEMES = [
  { a: [198, 58, 52], b: [248, 236, 208] }, // Classic Red & Cream Bazaar
  { a: [48, 88, 134], b: [246, 234, 204] }, // Prussian Blue & Ivory
  { a: [52, 112, 76], b: [244, 228, 188] }, // Market Green & Parchment
  { a: [158, 92, 44], b: [248, 232, 198] }, // Cinnamon Ochre & Cream
];

function drawGround() {
  const step = 6, start = Math.floor((camX - 12) / step) * step, end = camX + W + step;
  ctx.beginPath();
  ctx.moveTo(start, VB + 10);
  for (let wx = start; wx <= end; wx += step) ctx.lineTo(wx, groundY(wx));
  ctx.lineTo(end, VB + 10);
  ctx.closePath();
  // decor: grass tufts + bushes (suppressed in the 1900s city where the street is paved)
  if (cityK < 0.5) {
    const sp = 22, k0 = Math.floor(start / sp), k1 = Math.ceil(end / sp);
    for (let k = k0; k <= k1; k++) {
      const r = hash1(k, 301);
      if (r > 0.5) continue;
      const x = k * sp + hash1(k, 302) * sp, y = groundY(x) + 2;
      if (r < 0.38) {
        for (let b = 0; b < 3; b++) {
          const bx = x + (b - 1) * 3, bh = 6 + hash1(k * 3 + b, 303) * 9, lean = (hash1(k * 3 + b, 304) - 0.5) * 6;
          ctx.moveTo(bx - 1.6, y); ctx.lineTo(bx + lean, y - bh); ctx.lineTo(bx + 1.6, y); ctx.closePath();
        }
      } else {
        const rr = 5 + hash1(k, 305) * 6;
        ctx.moveTo(x - rr, y); ctx.arc(x, y, rr, Math.PI, 0); ctx.closePath();
        ctx.moveTo(x + rr * 0.2, y); ctx.arc(x + rr * 0.9, y, rr * 0.7, Math.PI, 0); ctx.closePath();
      }
    }
  }
  const gg = ctx.createLinearGradient(0, 560, 0, VB);
  gg.addColorStop(0, css(pal.near)); gg.addColorStop(1, css(mix(pal.near, BLACK, 0.35)));
  ctx.fillStyle = gg;
  ctx.fill();
  // a soft sheen just under the crest and a thin line of light along it
  const gla = lightAmt(), open = 1 - cityK;
  if (open > 0.02) {
    ctx.beginPath();
    ctx.moveTo(start, groundY(start));
    for (let wx = start + step; wx <= end; wx += step) ctx.lineTo(wx, groundY(wx));
    ctx.lineJoin = 'round'; ctx.lineCap = 'butt';
    ctx.save();
    ctx.translate(0, 7);
    ctx.strokeStyle = css(mix(pal.near, POLAR ? WHITE : pal.light, 0.5), (0.1 + 0.14 * gla) * open);
    ctx.lineWidth = 11; ctx.stroke();
    ctx.translate(0, 11);
    ctx.strokeStyle = css(mix(pal.near, pal.fog, 0.5), 0.1 * open);
    ctx.lineWidth = 12; ctx.stroke();
    ctx.restore();
    ctx.save();
    ctx.translate(0, 0.8);
    ctx.strokeStyle = css(rimC, (0.2 + 0.5 * gla) * open);
    ctx.lineWidth = 1.4; ctx.stroke();
    ctx.restore();
    if (!CANYON && !POLAR && !VOLCANO) {
      const FC = ['#fff6d8', '#ffd76a', '#ff9fb4', '#cdb8ff'], sp = 15;
      const k0 = Math.floor(start / sp), k1 = Math.ceil(end / sp);
      ctx.globalAlpha = (0.9 - 0.6 * pal.stars) * open;
      for (let k = k0; k <= k1; k++) {
        const r = hash1(k, 331);
        if (r > 0.34 || vnoise(k / 9, 337) < 0.42) continue;
        const x = k * sp + hash1(k, 332) * sp, y = groundY(x) - 1.5 - hash1(k, 333) * 4;
        ctx.fillStyle = FC[((r * 97) | 0) % 4];
        ctx.beginPath(); ctx.arc(x + Math.sin(time * 1.6 + k) * 0.7, y, 1.2 + hash1(k, 334) * 0.9, 0, TAU); ctx.fill();
      }
      ctx.globalAlpha = 1;
    }
  }

  // =========================================================================
  // 1900s Eski Şehir: Cobblestone Boulevard, Market Stalls (Pazar Yerleri) & People
  // =========================================================================
  if (cityK > 0.04) {
    const nightDim = 1 - pal.stars * 0.45;
    const ironCol = mix(pal.near, [16, 15, 24], 0.52);
    const stoneLit = mix(pal.near, mix([158, 146, 134], rimC, 0.35), 0.38);
    const stoneMid = mix(pal.near, [104, 96, 90], 0.34);
    const stoneDark = mix(pal.near, [18, 16, 26], 0.48);
    const woodLit = mix(pal.near, [142, 92, 54], 0.48 * nightDim);
    const woodDark = mix(pal.near, [64, 38, 24], 0.52);
    const skinCol = mix(pal.near, [218, 178, 146], 0.52 * nightDim);

    ctx.save();
    if (cityK < 0.999) ctx.globalAlpha = cityK;

    // 1. Paved Sidewalk Slab & Cobblestone Street Deck (Arnavut Kaldırımı Yol)
    ctx.beginPath();
    for (let wx = start; wx <= end; wx += step) {
      const y = groundY(wx);
      if (wx === start) ctx.moveTo(wx, y); else ctx.lineTo(wx, y);
    }
    for (let wx = end; wx >= start; wx -= step) {
      ctx.lineTo(wx, groundY(wx) + 46);
    }
    ctx.closePath();
    const roadG = ctx.createLinearGradient(0, 565, 0, 675);
    roadG.addColorStop(0, css(stoneMid));
    roadG.addColorStop(0.22, css(mix(stoneMid, stoneDark, 0.35)));
    roadG.addColorStop(1, css(stoneDark));
    ctx.fillStyle = roadG;
    ctx.fill();

    // Cut Granite Sidewalk Curb Blocks along top edge (y to y + 7)
    const curbSp = 18, ck0 = Math.floor(start / curbSp), ck1 = Math.ceil(end / curbSp);
    for (let ck = ck0; ck <= ck1; ck++) {
      const cx0 = ck * curbSp, cx1 = cx0 + curbSp - 1.2;
      const cy0 = groundY(cx0), cy1 = groundY(cx1);
      ctx.fillStyle = css(ck % 2 === 0 ? stoneLit : mix(stoneLit, stoneMid, 0.4));
      ctx.beginPath();
      ctx.moveTo(cx0, cy0); ctx.lineTo(cx1, cy1);
      ctx.lineTo(cx1, cy1 + 6.5); ctx.lineTo(cx0, cy0 + 6.5);
      ctx.closePath();
      ctx.fill();
    }

    // Staggered Arnavut Kaldırımı (Cobblestone) texture courses + Steel Tram/Carriage Rails
    const cobSp = 13, cb0 = Math.floor(start / cobSp), cb1 = Math.ceil(end / cobSp);
    ctx.fillStyle = css(stoneLit, 0.42);
    for (let row = 0; row < 3; row++) {
      const yOff = 11 + row * 9;
      const rowShift = (row % 2) * (cobSp * 0.5);
      for (let ck = cb0; ck <= cb1; ck++) {
        const cx = ck * cobSp + rowShift;
        const cy = groundY(cx) + yOff;
        ctx.beginPath();
        ctx.roundRect(cx, cy, cobSp - 2.2, 5.5, 2.2);
        ctx.fill();
      }
    }
    // Twin steel tramway/carriage rails gleaming along the cobblestone road
    ctx.strokeStyle = css(mix(stoneLit, rimC, 0.45), 0.52);
    ctx.lineWidth = 1.3;
    for (const rOff of [16, 28]) {
      ctx.beginPath();
      for (let wx = start; wx <= end; wx += step * 2) {
        const ry = groundY(wx) + rOff;
        if (wx === start) ctx.moveTo(wx, ry); else ctx.lineTo(wx, ry);
      }
      ctx.stroke();
    }

    // Wrought-iron promenade balustrade along the back edge of the sidewalk
    const railSp = 10, rk0 = Math.floor(start / railSp), rk1 = Math.ceil(end / railSp);
    ctx.strokeStyle = css(ironCol, 0.68);
    ctx.lineWidth = 1.1;
    ctx.beginPath();
    for (let rk = rk0; rk <= rk1; rk++) {
      const rx = rk * railSp, ry = groundY(rx);
      ctx.moveTo(rx, ry); ctx.lineTo(rx, ry - 9.5);
      if (rk > rk0) {
        const px = (rk - 1) * railSp, py = groundY(px);
        ctx.moveTo(px, py - 8.5); ctx.lineTo(rx, ry - 8.5);
      }
    }
    ctx.stroke();

    // 2. 1900s Market Stalls (Pazar Yerleri), Peddler Pushcarts & Horse Carriages
    const mCell = 148, mk0 = Math.floor((start - 80) / mCell), mk1 = Math.ceil((end + 80) / mCell);
    for (let mk = mk0; mk <= mk1; mk++) {
      if (hash1(mk, 921) > 0.84) continue;
      const mx = mk * mCell + (hash1(mk, 922) - 0.5) * 26;
      const my = groundY(mx) + 4.5;
      const mType = Math.floor(hash1(mk, 923) * 4);
      const aw = AWNING_SCHEMES[Math.floor(hash1(mk, 924) * AWNING_SCHEMES.length)];
      const awA = mix(pal.near, [aw.a[0] * nightDim, aw.a[1] * nightDim, aw.a[2] * nightDim], 0.58);
      const awB = mix(pal.near, [aw.b[0] * nightDim, aw.b[1] * nightDim, aw.b[2] * nightDim], 0.58);

      if (mType === 0 || mType === 1) {
        // === MARKET STALL (TENTELİ PAZAR TEZGÂHI: Meyve/Baharat veya Halı/Kumaş Pazarı) ===
        const sw = 54, sh = 34;
        const cntY = my - 13, roofBotY = my - sh + 5, roofTopY = my - sh - 4;

        // Back timber posts
        ctx.strokeStyle = css(woodDark);
        ctx.lineWidth = 2.2;
        ctx.beginPath();
        ctx.moveTo(mx - sw * 0.46, my); ctx.lineTo(mx - sw * 0.46, roofTopY + 2);
        ctx.moveTo(mx + sw * 0.46, my); ctx.lineTo(mx + sw * 0.46, roofTopY + 2);
        ctx.stroke();

        // Vendor (Pazarcı) standing behind the counter gesturing
        const vWave = Math.sin(time * 3.2 + mk) * 1.5;
        drawPerson1900s(mx - 6 + vWave, my - 2, 1, time * 1.5 + mk, 2, 0.92, nightDim, ironCol, skinCol);

        if (mType === 1) {
          // Hanging oriental rugs / drapery bolts at back of textile bazaar stall
          ctx.fillStyle = css(awA);
          ctx.fillRect(mx + 4, roofBotY + 2, 10, 14);
          ctx.fillStyle = css(mix(pal.near, [232, 178, 74], 0.55));
          ctx.fillRect(mx + 6, roofBotY + 4, 6, 10);
          ctx.fillStyle = css(mix(pal.near, [58, 104, 128], 0.55));
          ctx.fillRect(mx + 16, roofBotY + 2, 8, 12);
        }

        // Produce crates & goods piled on the wooden counter (Fruits, Vegetables, Bread, Spices)
        const goods = [
          [-19, [216, 62, 52]],   // Red apples / tomatoes
          [-9, [238, 148, 48]],   // Oranges / apricots
          [1, [92, 152, 68]],     // Fresh greens / cabbages
          [11, [224, 178, 82]],   // Golden loaves / lemons
          [20, [168, 68, 98]],    // Plums / figs / spice sacks
        ];
        for (const [gx, gRgb] of goods) {
          ctx.fillStyle = css(mix(pal.near, [gRgb[0] * nightDim, gRgb[1] * nightDim, gRgb[2] * nightDim], 0.62));
          ctx.beginPath();
          ctx.arc(mx + gx, cntY - 2.2, 3.2, Math.PI, 0);
          ctx.arc(mx + gx + 2.8, cntY - 1.8, 2.8, Math.PI, 0);
          ctx.fill();
        }

        // Wooden market counter front with plank lines & support legs
        ctx.fillStyle = css(woodLit);
        ctx.fillRect(mx - sw * 0.48, cntY, sw * 0.96, 9.5);
        ctx.fillStyle = css(woodDark);
        ctx.fillRect(mx - sw * 0.50, cntY - 1.5, sw, 2.2);
        ctx.strokeStyle = css(woodDark, 0.7);
        ctx.lineWidth = 1;
        ctx.strokeRect(mx - sw * 0.48, cntY, sw * 0.96, 9.5);

        // Woven baskets & wooden barrels resting on the sidewalk in front of the stall
        ctx.fillStyle = css(mix(woodLit, [196, 154, 88], 0.4));
        ctx.beginPath();
        ctx.roundRect(mx - sw * 0.38, my - 5.5, 9, 5.5, 1.5);
        ctx.roundRect(mx + sw * 0.22, my - 6.5, 10, 6.5, 1.5);
        ctx.fill();

        // Warm hanging bazaar lantern under the awning
        const lanX = mx + 2, lanY = roofBotY + 3.5;
        ctx.fillStyle = css([255, 224, 132], 0.95);
        ctx.beginPath(); ctx.arc(lanX, lanY, 2.4, 0, TAU); ctx.fill();
        ctx.save();
        ctx.globalCompositeOperation = 'lighter';
        ctx.globalAlpha = (0.34 + 0.32 * pal.stars) * cityK;
        ctx.drawImage(GLOW.warm, lanX - 18, lanY - 16, 36, 36);
        ctx.restore();

        // Striped Scalloped Canvas Awning (6 stripes)
        const stripes = 6, stW = (sw + 6) / stripes, awLeft = mx - (sw + 6) * 0.5;
        const sway = Math.sin(time * 2.6 + mk) * 0.8;
        for (let s = 0; s < stripes; s++) {
          const sx0 = awLeft + s * stW, sx1 = sx0 + stW + 0.4;
          ctx.fillStyle = css(s % 2 === 0 ? awA : awB);
          ctx.beginPath();
          ctx.moveTo(sx0 + 1.5, roofTopY);
          ctx.lineTo(sx1 - 1.5, roofTopY);
          ctx.lineTo(sx1, roofBotY + sway);
          ctx.lineTo(sx0, roofBotY + sway);
          ctx.closePath();
          ctx.fill();
          // Scalloped valance fringe
          ctx.beginPath();
          ctx.arc((sx0 + sx1) * 0.5, roofBotY + sway, stW * 0.5, 0, Math.PI);
          ctx.fill();
        }

        // Customer (Müşteri) standing in front of the stall shopping
        drawPerson1900s(mx + 15, my + 2, -1, 0.3, mk % 2 === 0 ? 1 : 0, 0.96, nightDim, ironCol, skinCol);

      } else if (mType === 2) {
        // === 1900s SPOKED PEDDLER PUSHCART (SEYYAR KESTANE / SİMİT ARABASI) ===
        const cw = 28, ch = 11, cy = my - 6;
        // Cart bed & handles
        ctx.fillStyle = css(awA);
        ctx.fillRect(mx - cw * 0.5, cy - ch, cw, ch);
        ctx.strokeStyle = css(woodDark);
        ctx.lineWidth = 1.6;
        ctx.beginPath();
        ctx.moveTo(mx - cw * 0.5, cy - ch * 0.6); ctx.lineTo(mx - cw * 0.82, cy - ch * 0.3);
        ctx.moveTo(mx + cw * 0.35, cy); ctx.lineTo(mx + cw * 0.35, my);
        ctx.stroke();

        // Brass samovar / chestnut roaster chimney with rising steam puff
        ctx.fillStyle = css(mix(pal.near, [218, 168, 72], 0.6));
        ctx.fillRect(mx + 3, cy - ch - 7, 5, 7);
        for (let s = 0; s < 2; s++) {
          const ph = (time * 0.7 + s * 0.5 + mk) % 1;
          ctx.fillStyle = css(pal.fog, (1 - ph) * 0.35);
          ctx.beginPath(); ctx.arc(mx + 5.5 + ph * 6, cy - ch - 8 - ph * 12, 2 + ph * 3.5, 0, TAU); ctx.fill();
        }

        // Tilted striped peddler umbrella over the cart
        ctx.strokeStyle = css(woodDark);
        ctx.lineWidth = 1.3;
        ctx.beginPath(); ctx.moveTo(mx - 2, cy - ch); ctx.lineTo(mx - 4, cy - ch - 19); ctx.stroke();
        ctx.fillStyle = css(awA);
        ctx.beginPath();
        ctx.moveTo(mx - 18, cy - ch - 13);
        ctx.quadraticCurveTo(mx - 4, cy - ch - 23, mx + 11, cy - ch - 12);
        ctx.closePath();
        ctx.fill();

        // Spoked wooden wheel
        const wr = 6.5, wx = mx - 3, wy = my - wr + 1;
        ctx.strokeStyle = css(woodLit);
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.arc(wx, wy, wr, 0, TAU);
        for (let a = 0; a < 4; a++) {
          const ang = (a / 4) * Math.PI;
          ctx.moveTo(wx - Math.cos(ang) * wr, wy - Math.sin(ang) * wr);
          ctx.lineTo(wx + Math.cos(ang) * wr, wy + Math.sin(ang) * wr);
        }
        ctx.stroke();

        // Street vendor beside pushcart
        drawPerson1900s(mx - cw * 0.78, my + 1, 1, 0.2, 2, 0.94, nightDim, ironCol, skinCol);

      } else {
        // === 1900s HORSE-DRAWN HANSOM CAB / PHAETON CARRIAGE (ATLI FAYTON) ===
        const cy = my + 1;
        // Lacquered 1900s carriage cabin & folding leather hood
        ctx.fillStyle = css(ironCol);
        ctx.beginPath();
        ctx.moveTo(mx - 18, cy - 8);
        ctx.lineTo(mx - 22, cy - 22);
        ctx.quadraticCurveTo(mx - 12, cy - 30, mx - 2, cy - 28);
        ctx.lineTo(mx - 2, cy - 15);
        ctx.lineTo(mx + 14, cy - 15);
        ctx.lineTo(mx + 16, cy - 8);
        ctx.closePath();
        ctx.fill();

        // Warm glowing brass coach lamp
        ctx.fillStyle = css([255, 222, 130], 0.95);
        ctx.beginPath(); ctx.arc(mx + 12, cy - 17, 2.1, 0, TAU); ctx.fill();

        // Rear large spoked wheel & front smaller spoked wheel
        ctx.strokeStyle = css(mix(woodLit, [210, 160, 80], 0.4));
        ctx.lineWidth = 1.4;
        ctx.beginPath();
        ctx.arc(mx - 12, cy - 7, 7.5, 0, TAU);
        ctx.arc(mx + 10, cy - 5.5, 5.5, 0, TAU);
        ctx.stroke();

        // Horse standing in harness in front of carriage
        ctx.fillStyle = css(mix(ironCol, [72, 46, 34], 0.45));
        ctx.beginPath();
        ctx.ellipse(mx + 29, cy - 12, 8.5, 4.2, 0, 0, TAU); // horse body
        ctx.moveTo(mx + 34, cy - 14);
        ctx.lineTo(mx + 39, cy - 22);
        ctx.lineTo(mx + 43, cy - 20);
        ctx.lineTo(mx + 42, cy - 17);
        ctx.lineTo(mx + 37, cy - 11);
        ctx.closePath();
        ctx.fill();
        ctx.strokeStyle = css(ironCol);
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.moveTo(mx + 23, cy - 10); ctx.lineTo(mx + 22, cy);
        ctx.moveTo(mx + 35, cy - 10); ctx.lineTo(mx + 36, cy);
        ctx.stroke();
      }
    }

    // 3. 1900s Wrought-Iron Gas Streetlamps along the sidewalk
    const lsp = 185, lk0 = Math.floor((start - 40) / lsp), lk1 = Math.ceil((end + 40) / lsp);
    for (let lk = lk0; lk <= lk1; lk++) {
      const lx = lk * lsp + 42;
      const ly = groundY(lx) + 3;
      const lh = 46 + (lk % 2) * 5;
      const topY = ly - lh;

      ctx.fillStyle = css(ironCol);
      ctx.beginPath();
      ctx.moveTo(lx - 3.5, ly + 2);
      ctx.lineTo(lx - 2.2, ly - 9);
      ctx.lineTo(lx - 1.1, topY + 7);
      ctx.lineTo(lx + 1.1, topY + 7);
      ctx.lineTo(lx + 2.2, ly - 9);
      ctx.lineTo(lx + 3.5, ly + 2);
      ctx.closePath();
      ctx.fill();

      ctx.strokeStyle = css(ironCol);
      ctx.lineWidth = 1.4;
      ctx.beginPath();
      ctx.moveTo(lx - 5.5, topY + 9); ctx.lineTo(lx + 5.5, topY + 9);
      ctx.moveTo(lx - 3.8, topY + 7); ctx.lineTo(lx - 4.8, topY + 1); ctx.lineTo(lx + 4.8, topY + 1); ctx.lineTo(lx + 3.8, topY + 7);
      ctx.stroke();

      ctx.beginPath();
      ctx.moveTo(lx - 5.8, topY + 1);
      ctx.lineTo(lx, topY - 4.5);
      ctx.lineTo(lx + 5.8, topY + 1);
      ctx.closePath();
      ctx.fill();

      const flicker = 0.88 + 0.12 * Math.sin(time * 9.5 + lk * 2.3);
      ctx.fillStyle = css([255, 224, 138], 0.94 * flicker);
      ctx.beginPath();
      ctx.moveTo(lx - 3.2, topY + 6.5);
      ctx.lineTo(lx - 4.0, topY + 1.5);
      ctx.lineTo(lx + 4.0, topY + 1.5);
      ctx.lineTo(lx + 3.2, topY + 6.5);
      ctx.closePath();
      ctx.fill();

      ctx.save();
      ctx.globalCompositeOperation = 'lighter';
      ctx.globalAlpha = (0.40 + 0.35 * pal.stars) * flicker * cityK;
      ctx.drawImage(GLOW.warm, lx - 26, topY - 22, 52, 52);
      ctx.restore();
    }

    // 4. Strolling 1900s Townsfolk, Pedestrians & Children walking along the cobblestone street
    const pCell = 58, pk0 = Math.floor((start - 60) / pCell), pk1 = Math.ceil((end + 60) / pCell);
    for (let pk = pk0; pk <= pk1; pk++) {
      if (hash1(pk, 941) > 0.86) continue;
      const dir = hash1(pk, 942) < 0.5 ? 1 : -1;
      const walkSpd = 14 + hash1(pk, 943) * 14;
      // Smooth wrapping walk offset so people actually stroll along the road
      const travel = ((time * walkSpd * dir + hash1(pk, 944) * 120) % 120);
      const px = pk * pCell + travel;
      if (px < start - 40 || px > end + 40) continue;
      const laneOff = 5 + hash1(pk, 945) * 9;
      const py = groundY(px) + laneOff;
      const style = Math.floor(hash1(pk, 946) * 4);
      const sc = style === 3 ? 0.72 : (0.92 + hash1(pk, 947) * 0.14);
      const ph = time * (walkSpd * 0.32) + pk * 1.9;
      drawPerson1900s(px, py, dir, ph, style, sc, nightDim, ironCol, skinCol);
    }

    ctx.restore();
  }

  // lit rim
  ctx.beginPath();
  for (let wx = start; wx <= end; wx += step) { const y = groundY(wx); if (wx === start) ctx.moveTo(wx, y); else ctx.lineTo(wx, y); }
  ctx.strokeStyle = css(rimC, 0.45);
  ctx.lineWidth = 2;
  ctx.stroke();
}

// the launch cliff: a brow of rock standing out of the hills, layered and cracked, with a windsock at its edge
function cliffTopY(x) {
  const d = cliff.x - x;
  return cliff.top + 3 - 3 * Math.exp(-d / 26) + d * 0.018 + (vnoise(x / 46, 811) - 0.5) * 7 * clamp(d / 60, 0, 1);
}
// the face below the lip: it cuts back under the overhang, then steps outward in ledges down to the scree
function cliffFaceX(y) {
  const t = clamp((y - cliff.top) / 300, 0, 1);
  const under = -30 * Math.sin(Math.min(1, t * 3.2) * Math.PI * 0.5);
  const out = 96 * Math.pow(t, 1.7);
  const step = Math.floor(y / 34), ledge = (hash1(step, 823) - 0.35) * 16 + (vnoise(y / 9, 829) - 0.5) * 6;
  return cliff.x + 12 + under + out + ledge * clamp(t * 4, 0, 1);
}
function drawCliff() {
  if (cliff.x < camX - 140) return;
  const E = cliff.x, T = cliff.top, left = camX - 40, foot = groundY(E + 60) + 14;
  const face = () => {
    ctx.beginPath();
    ctx.moveTo(left, VB + 20);
    ctx.lineTo(left, cliffTopY(left));
    for (let x = left; x < E; x += 8) ctx.lineTo(x, cliffTopY(x));
    ctx.lineTo(E, cliffTopY(E));
    ctx.lineTo(E + 12, T + 2);
    ctx.lineTo(E + 13, T + 7);
    for (let y = T + 12; y < foot; y += 5) ctx.lineTo(cliffFaceX(y), y);
    ctx.lineTo(cliffFaceX(foot) + 30, VB + 20);
    ctx.closePath();
  };
  const dark = mix(pal.near, BLACK, 0.3), lightX = (sun.a >= moon.a ? sun.x : moon.x) + camX, lit = lightX > E - 200;
  // a lower buttress standing a little further off, paler with distance
  ctx.beginPath();
  ctx.moveTo(E - 60, VB + 20);
  const bt = Math.min(T + 150, foot - 70);
  ctx.lineTo(E + 26, bt + 46); ctx.lineTo(E + 44, bt + 10); ctx.lineTo(E + 70, bt); ctx.lineTo(E + 96, bt + 6); ctx.lineTo(E + 108, bt + 38);
  ctx.lineTo(E + 126, bt + 52); ctx.lineTo(E + 138, bt + 96); ctx.lineTo(E + 170, VB + 20);
  ctx.closePath();
  ctx.fillStyle = css(mix(pal.near, pal.fog, 0.3)); ctx.fill();
  ctx.strokeStyle = css(rimC, 0.3); ctx.lineWidth = 1.4; ctx.stroke();
  // the rock itself, lit on the side that faces the light
  face();
  const g = ctx.createLinearGradient(E - 260, 0, E + 90, 0);
  g.addColorStop(0, css(dark)); g.addColorStop(0.62, css(mix(pal.near, BLACK, 0.12)));
  g.addColorStop(1, css(lit ? mix(pal.near, rimC, 0.3) : mix(pal.near, BLACK, 0.2)));
  ctx.fillStyle = g; ctx.fill();
  ctx.save(); ctx.clip();
  // darkness gathering toward the foot and under the overhang
  const sh = ctx.createLinearGradient(0, T, 0, VB + 20);
  sh.addColorStop(0, 'rgba(8,8,22,0)'); sh.addColorStop(0.08, 'rgba(8,8,22,0.3)'); sh.addColorStop(0.22, 'rgba(8,8,22,0.08)'); sh.addColorStop(1, 'rgba(8,8,22,0.42)');
  ctx.fillStyle = sh; ctx.fillRect(left, T - 10, E + 220 - left, VB + 40 - T);
  // beds of rock: each layer a dark seam with a lit shelf beneath it
  for (let k = 0; k < 13; k++) {
    const y0 = T + 18 + k * 21 + hash1(k, 841) * 9, x1 = cliffFaceX(y0) + 6, len = 90 + hash1(k, 842) * 170, tilt = (hash1(k, 843) - 0.5) * 10;
    ctx.beginPath(); ctx.moveTo(x1, y0);
    for (let q = 1; q <= 6; q++) ctx.lineTo(x1 - (len * q) / 6, y0 + (tilt * q) / 6 + (hash1(k * 7 + q, 844) - 0.5) * 5);
    ctx.strokeStyle = 'rgba(6,6,18,0.3)'; ctx.lineWidth = 2.2 + hash1(k, 845) * 1.6; ctx.stroke();
    ctx.save(); ctx.translate(0, 2.4); ctx.strokeStyle = css(rimC, lit ? 0.2 : 0.09); ctx.lineWidth = 1; ctx.stroke(); ctx.restore();
  }
  // cracks running down from the brow
  ctx.strokeStyle = 'rgba(6,6,18,0.34)'; ctx.lineWidth = 1.2; ctx.lineJoin = 'round';
  ctx.beginPath();
  for (let k = 0; k < 9; k++) {
    let x = E - 6 - k * 26 - hash1(k, 851) * 18, y = cliffTopY(x) + 2;
    ctx.moveTo(x, y);
    const n = 3 + Math.floor(hash1(k, 852) * 4);
    for (let q = 0; q < n; q++) { x += (hash1(k * 5 + q, 853) - 0.6) * 12; y += 12 + hash1(k * 5 + q, 854) * 22; ctx.lineTo(x, y); }
  }
  ctx.stroke();
  // snow lying on the brow in the polar country
  if (polarK > 0.05) { ctx.fillStyle = `rgba(240,246,255,${0.9 * polarK})`; ctx.beginPath(); ctx.moveTo(left, T - 20); for (let x = left; x <= E + 14; x += 10) ctx.lineTo(x, cliffTopY(x) + 5 + vnoise(x / 17, 861) * 6); ctx.lineTo(E + 14, T - 20); ctx.closePath(); ctx.fill(); }
  ctx.restore();
  // light along the brow and down the edge of the face
  ctx.beginPath();
  ctx.moveTo(left, cliffTopY(left));
  for (let x = left; x < E; x += 8) ctx.lineTo(x, cliffTopY(x));
  ctx.lineTo(E, cliffTopY(E)); ctx.lineTo(E + 12, T + 2); ctx.lineTo(E + 13, T + 7);
  ctx.strokeStyle = css(rimC, 0.6); ctx.lineWidth = 2; ctx.stroke();
  ctx.beginPath();
  ctx.moveTo(E + 13, T + 7);
  for (let y = T + 12; y < foot; y += 5) ctx.lineTo(cliffFaceX(y), y);
  ctx.strokeStyle = css(rimC, lit ? 0.42 : 0.16); ctx.lineWidth = 1.5; ctx.stroke();
  // roots and creepers hanging under the lip
  ctx.strokeStyle = css(mix(pal.near, BLACK, 0.45)); ctx.lineWidth = 1.1; ctx.lineCap = 'round';
  ctx.beginPath();
  for (let k = 0; k < 6; k++) {
    const x = E + 9 - k * 5.5, len = 12 + hash1(k, 871) * 26, sw = Math.sin(gtime * 1.6 + k * 1.3) * 2.2;
    ctx.moveTo(x, T + 8 + k * 1.5); ctx.quadraticCurveTo(x - 2 + sw * 0.4, T + 8 + len * 0.6, x - 1 + sw, T + 8 + len);
  }
  ctx.stroke();
  // what grows and stands on top: pines back from the edge, grass in the wind, loose stones
  const top = css(mix(pal.near, BLACK, 0.16));
  if (!CANYON && !VOLCANO) {
    ctx.beginPath();
    for (const [dx, h] of [[148, 72], [190, 108], [230, 64], [282, 90]]) { const x = E - dx; pine(ctx, x, cliffTopY(x) + 5, h, h * 0.44); }
    ctx.fillStyle = top; ctx.fill();
    ctx.strokeStyle = css(rimC, 0.4); ctx.lineWidth = 1.3; ctx.stroke();
  }
  ctx.beginPath();
  for (let x = Math.ceil(left / 9) * 9; x < E - 4; x += 9) {
    const r = hash1(x / 9, 881);
    if (r > 0.62) continue;
    const bx = x + r * 7, y = cliffTopY(bx) + 2, bh = 5 + hash1(x / 9, 882) * 9, lean = (hash1(x / 9, 883) - 0.5) * 5 - 2 + Math.sin(gtime * 2.2 + x * 0.05) * 1.6;
    ctx.moveTo(bx - 1.5, y); ctx.lineTo(bx + lean, y - bh); ctx.lineTo(bx + 1.5, y); ctx.closePath();
  }
  for (const [dx, r] of [[34, 4], [58, 6.5], [66, 3.5], [112, 5]]) { const x = E - dx, y = cliffTopY(x) + 2; ctx.moveTo(x - r, y); ctx.arc(x, y, r, Math.PI, 0); ctx.closePath(); }
  ctx.fillStyle = top; ctx.fill();
  // the windsock that tells him the air is right
  const px = E - 84, py = cliffTopY(px) + 2, ph = 62;
  ctx.strokeStyle = css(mix(pal.near, BLACK, 0.4)); ctx.lineWidth = 2.2;
  ctx.beginPath(); ctx.moveTo(px, py); ctx.lineTo(px, py - ph); ctx.stroke();
  const seg = 5, L = 34;
  for (let q = 0; q < seg; q++) {
    const t0 = q / seg, t1 = (q + 1) / seg;
    const at = (t) => [px - 2 - t * L, py - ph + 5 + t * t * 7 + Math.sin(gtime * 6 - t * 5) * 2.4 * t];
    const a = at(t0), b = at(t1), w0 = 5.5 - t0 * 3, w1 = 5.5 - t1 * 3;
    ctx.beginPath(); ctx.moveTo(a[0], a[1] - w0); ctx.lineTo(b[0], b[1] - w1); ctx.lineTo(b[0], b[1] + w1); ctx.lineTo(a[0], a[1] + w0); ctx.closePath();
    ctx.fillStyle = css(mix(q % 2 ? [246, 240, 228] : [232, 96, 70], pal.light, pal.la * 0.6)); ctx.fill();
  }
}
