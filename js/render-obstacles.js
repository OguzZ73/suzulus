// Süzülüş — Trees, spires, islands, balloons, buildings and kites
'use strict';

function obsGrad(o) {
  const lightX = (sun.a >= moon.a ? sun.x : moon.x) + camX;
  const lMix = sstep(clamp(0.5 + (o.x - lightX) / 560, 0, 1));
  const g = ctx.createLinearGradient(o.minX, 0, o.maxX, 0);
  const lit = mix(obsFillC, rimC, 0.22);
  g.addColorStop(0, css(mix(obsFillC, lit, lMix)));
  g.addColorStop(0.5, css(mix(obsFillC, lit, 0.25)));
  g.addColorStop(1, css(mix(lit, obsFillC, lMix)));
  return g;
}
function drawPineTree(x, gy, h, w, seed, swayAmt, lMix) {
  const wind = (Math.sin(time * 1.7 + seed * 0.17) * 0.7 + Math.sin(time * 3.1 + seed * 0.41) * 0.3 + gust * 1.8) * swayAmt;
  const trW = Math.max(2.5, w * 0.085);
  const trTopY = gy - h * 0.42, trTopX = x + wind * 0.18;
  // tapered wooden trunk with root flare and smooth positional shading
  const tg = ctx.createLinearGradient(x - trW * 1.4, 0, x + trW * 1.4, 0);
  const barkLit = mix(obsFillC, mix([98, 66, 46], rimC, 0.35), 0.42);
  const barkShd = mix(obsFillC, [12, 9, 16], 0.52);
  tg.addColorStop(0, css(mix(barkShd, barkLit, lMix)));
  tg.addColorStop(0.5, css(mix(barkShd, barkLit, 0.45)));
  tg.addColorStop(1, css(mix(barkLit, barkShd, lMix)));
  ctx.fillStyle = tg;
  ctx.beginPath();
  ctx.moveTo(x - trW * 1.55, gy + 7);
  ctx.quadraticCurveTo(x - trW * 0.85, gy - h * 0.08, trTopX - trW * 0.45, trTopY);
  ctx.lineTo(trTopX + trW * 0.45, trTopY);
  ctx.quadraticCurveTo(x + trW * 0.85, gy - h * 0.08, x + trW * 1.55, gy + 7);
  ctx.closePath();
  ctx.fill();

  const tiers = clamp(Math.round(h / 22), 5, 8);
  const pineTint = mix(obsFillC, [24, 56, 48], 0.42 * (1 - pal.stars * 0.45) * (1 - polarK * 0.35));
  const snowA = clamp(polarK * 0.92 + (weather.type === 'snow' || weather.type === 'blizzard' ? weather.amt * 0.55 : 0), 0, 0.95);

  for (let i = 0; i < tiers; i++) {
    const u0 = i / tiers, u1 = (i + 1) / tiers;
    const yBot = gy - h * (0.06 + 0.78 * Math.pow(u0, 0.92));
    const yTop = i === tiers - 1 ? gy - h : gy - h * (0.27 + 0.73 * Math.pow(u1, 0.94));
    const tw = (w * 0.54) * Math.pow(1 - u0 * 0.77, 0.82) * (0.93 + 0.14 * hash1(seed + i, 17));
    const sxBot = x + wind * Math.pow(u0, 1.65) + (hash1(seed + i, 29) - 0.5) * tw * 0.1;
    const sxTop = x + wind * Math.pow(u1, 1.65);
    const lx = sxBot - tw, rx = sxBot + tw;
    const ly = yBot + (hash1(seed + i, 31) - 0.5) * 2.5;
    const ry = yBot + (hash1(seed + i, 37) - 0.5) * 2.5;

    const traceBough = (yOff) => {
      ctx.beginPath();
      ctx.moveTo(sxTop, yTop + yOff);
      ctx.quadraticCurveTo(lerp(sxTop, lx, 0.52) + tw * 0.08, lerp(yTop, ly, 0.58) + yOff, lx, ly + yOff);
      const lobes = 5;
      for (let k = 1; k <= lobes; k++) {
        const kt0 = (k - 1) / lobes, kt1 = k / lobes, km = (kt0 + kt1) * 0.5;
        const kx1 = lerp(lx, rx, kt1);
        const ky1 = lerp(ly, ry, kt1) + Math.sin(kt1 * Math.PI) * (tw * 0.12) + yOff;
        const kxm = lerp(lx, rx, km);
        const kym = lerp(ly, ry, km) + Math.sin(km * Math.PI) * (tw * 0.15) + tw * (0.08 + 0.035 * (k % 2)) + yOff;
        ctx.quadraticCurveTo(kxm, kym, kx1, ky1);
      }
      ctx.quadraticCurveTo(lerp(rx, sxTop, 0.48) - tw * 0.08, lerp(ry, yTop, 0.42) + yOff, sxTop, yTop + yOff);
      ctx.closePath();
    };

    // cast shadow onto the tier underneath
    if (i > 0) {
      traceBough(Math.max(3, (yBot - yTop) * 0.18));
      ctx.fillStyle = css(mix(obsFillC, BLACK, 0.58), 0.36);
      ctx.fill();
    }

    // main bough body with smooth 3D directional lighting
    traceBough(0);
    const bg = ctx.createLinearGradient(lx, 0, rx, 0);
    const litC = mix(pineTint, rimC, 0.25 + 0.12 * u1);
    const midC = mix(pineTint, rimC, 0.06 * u1);
    const shdC = mix(pineTint, [6, 10, 24], 0.42 - 0.08 * u1);
    bg.addColorStop(0, css(mix(shdC, litC, lMix)));
    bg.addColorStop(0.5, css(midC));
    bg.addColorStop(1, css(mix(litC, shdC, lMix)));
    ctx.fillStyle = bg;
    ctx.fill();

    // sunlit needle cluster ribs crossfading smoothly with lMix
    const ribCol = mix(litC, rimC, 0.35);
    ctx.lineWidth = 1.2;
    if (lMix > 0.04) {
      ctx.strokeStyle = css(ribCol, 0.36 * lMix);
      ctx.beginPath();
      ctx.moveTo(sxTop, yTop + 1);
      ctx.quadraticCurveTo(lerp(sxTop, lx, 0.52) + tw * 0.08, lerp(yTop, ly, 0.58), lx, ly);
      ctx.moveTo(lerp(sxTop, sxBot, 0.35), lerp(yTop, yBot, 0.35));
      ctx.lineTo(lerp(sxBot, lx, 0.58), lerp(yTop, ly, 0.88));
      ctx.stroke();
    }
    if (1 - lMix > 0.04) {
      ctx.strokeStyle = css(ribCol, 0.36 * (1 - lMix));
      ctx.beginPath();
      ctx.moveTo(sxTop, yTop + 1);
      ctx.quadraticCurveTo(lerp(sxTop, rx, 0.52) - tw * 0.08, lerp(yTop, ry, 0.58), rx, ry);
      ctx.moveTo(lerp(sxTop, sxBot, 0.35), lerp(yTop, yBot, 0.35));
      ctx.lineTo(lerp(sxBot, rx, 0.58), lerp(yTop, ry, 0.88));
      ctx.stroke();
    }

    // organic snow cushion resting on top of each bough tier
    if (snowA > 0.04) {
      ctx.fillStyle = css(mix([236, 244, 255], rimC, 0.22), snowA * 0.9);
      ctx.beginPath();
      ctx.moveTo(sxTop, yTop);
      ctx.quadraticCurveTo(lerp(sxTop, lx, 0.52) + tw * 0.06, lerp(yTop, ly, 0.56), lx + tw * 0.06, ly - 1);
      ctx.quadraticCurveTo(lerp(lx, sxBot, 0.5), lerp(ly, yTop, 0.28) + 3, sxBot, lerp(yTop, yBot, 0.52));
      ctx.quadraticCurveTo(lerp(sxBot, rx, 0.5), lerp(ry, yTop, 0.28) + 3, rx - tw * 0.06, ry - 1);
      ctx.quadraticCurveTo(lerp(rx, sxTop, 0.48) - tw * 0.06, lerp(ry, yTop, 0.44), sxTop, yTop);
      ctx.closePath();
      ctx.fill();
    }
  }
}

function drawObstacles(grounded) {
  const vx0 = camX - 60, vx1 = camX + W + 60;
  const sunWorldX = (sun.a >= moon.a ? sun.x : moon.x) + camX;
  for (const o of obstacles) {
    if (o.maxX < vx0 || o.minX > vx1) continue;
    const isG = o.type === 'pine' || o.type === 'spire' || o.type === 'cactus' || o.type === 'building';
    if (isG !== grounded) continue;
    // Smooth continuous positional lighting: 1 when sun is to the left of the object, 0 when to the right
    const lMix = sstep(clamp(0.5 + (o.x - sunWorldX) / 560, 0, 1));
    switch (o.type) {
      case 'pine': {
        drawPineTree(o.x, o.gy, o.h, o.w, o.seed || 1, 4.5, lMix);
        break;
      }
      case 'cactus': {
        const cc = mix(obsFillC, [52, 94, 58], 0.48);
        const litC = mix(cc, rimC, 0.32), shdC = mix(cc, [8, 14, 24], 0.45);
        const lCol = mix(shdC, litC, lMix), rCol = mix(litC, shdC, lMix);
        const bias = (0.5 - lMix) * 2; // -1 when lit from left, +1 when lit from right
        ctx.lineCap = 'round'; ctx.lineJoin = 'round';
        // arms with smooth 3D cylindrical shading
        for (const [asd, ay, ah] of o.arms) {
          const cx = o.x + asd * (o.tw + 14);
          const armFace = asd < 0 ? lCol : rCol;
          ctx.strokeStyle = css(armFace);
          ctx.lineWidth = o.aw * 2;
          ctx.beginPath();
          ctx.moveTo(o.x, ay + 2);
          ctx.quadraticCurveTo(cx, ay + 2, cx, ay - 6);
          ctx.lineTo(cx, ay - ah);
          ctx.stroke();
          ctx.strokeStyle = css(cc);
          ctx.lineWidth = o.aw * 1.55;
          ctx.beginPath();
          ctx.moveTo(o.x - bias * 1.4, ay + 1);
          ctx.quadraticCurveTo(cx - bias * 1.4, ay + 1, cx - bias * 1.4, ay - 6);
          ctx.lineTo(cx - bias * 1.4, ay - ah);
          ctx.stroke();
        }
        // main saguaro trunk with cylindrical gradient
        const tg = ctx.createLinearGradient(o.x - o.tw, 0, o.x + o.tw, 0);
        tg.addColorStop(0, css(lCol));
        tg.addColorStop(0.5, css(cc));
        tg.addColorStop(1, css(rCol));
        ctx.strokeStyle = tg;
        ctx.lineWidth = o.tw * 2;
        ctx.beginPath(); ctx.moveTo(o.x, o.gy + 8); ctx.lineTo(o.x, o.gy - o.h + o.tw); ctx.stroke();
        // pleated vertical ribs
        ctx.strokeStyle = css(mix(cc, BLACK, 0.38), 0.48); ctx.lineWidth = 1;
        ctx.beginPath();
        for (const dx of [-0.52, -0.18, 0.18, 0.52]) {
          ctx.moveTo(o.x + dx * o.tw, o.gy + 4);
          ctx.lineTo(o.x + dx * o.tw, o.gy - o.h + o.tw * 1.3);
        }
        ctx.stroke();
        // smooth sunlit rim highlights on left and right edges
        ctx.lineWidth = 1.5;
        if (lMix > 0.04) {
          ctx.strokeStyle = css(rimC, 0.48 * lMix);
          ctx.beginPath();
          ctx.moveTo(o.x - o.tw * 0.82, o.gy + 2);
          ctx.lineTo(o.x - o.tw * 0.82, o.gy - o.h + o.tw);
          ctx.stroke();
        }
        if (1 - lMix > 0.04) {
          ctx.strokeStyle = css(rimC, 0.48 * (1 - lMix));
          ctx.beginPath();
          ctx.moveTo(o.x + o.tw * 0.82, o.gy + 2);
          ctx.lineTo(o.x + o.tw * 0.82, o.gy - o.h + o.tw);
          ctx.stroke();
        }
        break;
      }
      case 'spire': {
        const litFace = mix(obsFillC, rimC, 0.28);
        const midFace = mix(obsFillC, rimC, 0.08);
        const shdFace = mix(obsFillC, [8, 12, 28], 0.40);
        const lTop = mix(shdFace, litFace, lMix), lBot = mix(shdFace, midFace, lMix);
        const rTop = mix(litFace, shdFace, lMix), rBot = mix(midFace, shdFace, lMix);
        // base silhouette fill
        ctx.beginPath(); polyPath(ctx, o.polys[0]);
        ctx.fillStyle = css(shdFace); ctx.fill();

        ctx.save();
        ctx.beginPath(); polyPath(ctx, o.polys[0]); ctx.clip();
        // Both left and right 3D rock facets shaded smoothly by lMix (never flips abruptly)
        if (o.mPts && o.lPts && o.rPts) {
          ctx.beginPath();
          ctx.moveTo(o.lPts[0], o.lPts[1]);
          for (let i = 2; i < o.lPts.length; i += 2) ctx.lineTo(o.lPts[i], o.lPts[i + 1]);
          for (let i = 0; i < o.mPts.length; i += 2) ctx.lineTo(o.mPts[i], o.mPts[i + 1]);
          ctx.closePath();
          const fgL = ctx.createLinearGradient(0, o.top, 0, o.top + o.h);
          fgL.addColorStop(0, css(lTop));
          fgL.addColorStop(1, css(lBot));
          ctx.fillStyle = fgL;
          ctx.fill();

          ctx.beginPath();
          ctx.moveTo(o.rPts[0], o.rPts[1]);
          for (let i = 2; i < o.rPts.length; i += 2) ctx.lineTo(o.rPts[i], o.rPts[i + 1]);
          for (let i = o.mPts.length - 2; i >= 0; i -= 2) ctx.lineTo(o.mPts[i], o.mPts[i + 1]);
          ctx.closePath();
          const fgR = ctx.createLinearGradient(0, o.top, 0, o.top + o.h);
          fgR.addColorStop(0, css(rTop));
          fgR.addColorStop(1, css(rBot));
          ctx.fillStyle = fgR;
          ctx.fill();
        }
        // canyon sandstone strata bands
        if (canyonK > 0.05) {
          const ltS = mix(obsFillC, [255, 210, 165], 0.22), dkS = mix(obsFillC, [36, 14, 10], 0.30);
          for (let y = Math.floor(o.top / 11) * 11, k = 0; y < o.top + o.h + 30; y += 11, k++) {
            ctx.fillStyle = css(k % 2 ? ltS : dkS, 0.22 * canyonK);
            ctx.fillRect(o.minX, y, o.bw + 30, 4 + (k % 3));
          }
        }
        // angled rock ledges and snow shelves
        for (const ld of o.ledges) {
          const t = Array.isArray(ld) ? ld[0] : ld;
          const sl = Array.isArray(ld) ? ld[1] : 0.1;
          const wd = Array.isArray(ld) ? ld[2] : 0.55;
          const y = lerp(o.top + o.h, o.top, t), hw = (o.bw / 2) * (1 - 0.6 * t);
          const x0 = o.x - hw * wd, x1 = o.x + hw * wd, y1 = y + sl * hw;
          ctx.strokeStyle = css(mix(obsFillC, BLACK, 0.5), 0.45);
          ctx.lineWidth = 2.2;
          ctx.beginPath(); ctx.moveTo(x0, y); ctx.lineTo(x1, y1); ctx.stroke();
          ctx.strokeStyle = css(polarK > 0.05 ? mix([235, 244, 255], rimC, 0.2) : rimC, polarK > 0.05 ? 0.65 * polarK : 0.22);
          ctx.lineWidth = polarK > 0.05 ? 3 : 1.2;
          ctx.beginPath(); ctx.moveTo(x0, y - 1.2); ctx.lineTo(x1, y1 - 1.2); ctx.stroke();
        }
        // central ridge highlight
        if (o.mPts) {
          ctx.strokeStyle = css(rimC, 0.26);
          ctx.lineWidth = 1.3;
          ctx.beginPath(); polyLine(o.mPts); ctx.stroke();
        }
        ctx.restore();

        // basal talus boulders anchoring the spire into the ground
        if (o.boulders && o.gy) {
          for (const [bx, bw, bh] of o.boulders) {
            const cx = o.x + bx, cy = o.gy + 8;
            ctx.beginPath();
            ctx.moveTo(cx - bw, cy);
            ctx.lineTo(cx - bw * 0.6, cy - bh * 0.85);
            ctx.lineTo(cx + bw * 0.2, cy - bh);
            ctx.lineTo(cx + bw, cy - bh * 0.35);
            ctx.lineTo(cx + bw * 1.1, cy);
            ctx.closePath();
            const bg = ctx.createLinearGradient(cx - bw, 0, cx + bw, 0);
            bg.addColorStop(0, css(lBot));
            bg.addColorStop(1, css(rBot));
            ctx.fillStyle = bg;
            ctx.fill();
            ctx.strokeStyle = css(rimC, 0.32);
            ctx.lineWidth = 1.2;
            ctx.stroke();
          }
        }

        // sunlit outer rim stroke
        ctx.beginPath(); polyPath(ctx, o.polys[0]);
        ctx.strokeStyle = css(rimC, 0.48); ctx.lineWidth = 1.6; ctx.lineJoin = 'round'; ctx.stroke();
        break;
      }
      case 'float': {
        ctx.save(); ctx.translate(o.x, o.oy);
        const litFace = mix(obsFillC, rimC, 0.30);
        const midLit = mix(obsFillC, rimC, 0.14);
        const midShd = mix(obsFillC, [10, 14, 30], 0.22);
        const deepShd = mix(obsFillC, [6, 10, 24], 0.46);
        const f0 = mix(deepShd, litFace, lMix);
        const f1 = mix(midShd, midLit, lMix);
        const f2 = mix(midLit, midShd, lMix);
        const f3 = mix(litFace, deepShd, lMix);

        // 1. Hovering satellite rock shards beneath the island
        if (o.shards) {
          for (const [sx, sy, sw, sh, ang, ph] of o.shards) {
            const by = sy + Math.sin(gtime * 1.6 + ph) * 4.5;
            ctx.save();
            ctx.translate(sx, by);
            ctx.rotate(ang + Math.sin(gtime * 1.1 + ph) * 0.08);
            ctx.beginPath();
            ctx.moveTo(-sw, -sh * 0.2);
            ctx.lineTo(0, -sh * 0.65);
            ctx.lineTo(0, sh * 0.3);
            ctx.lineTo(-sw * 0.2, sh);
            ctx.lineTo(-sw * 0.75, sh * 0.45);
            ctx.closePath();
            ctx.fillStyle = css(f0);
            ctx.fill();
            ctx.beginPath();
            ctx.moveTo(0, -sh * 0.65);
            ctx.lineTo(sw, -sh * 0.15);
            ctx.lineTo(sw * 0.55, sh * 0.55);
            ctx.lineTo(-sw * 0.2, sh);
            ctx.lineTo(0, sh * 0.3);
            ctx.closePath();
            ctx.fillStyle = css(f3);
            ctx.fill();
            ctx.strokeStyle = css(rimC, 0.38);
            ctx.lineWidth = 1;
            ctx.stroke();
            ctx.restore();
          }
        }

        // 2. Trailing roots / vines (or icicles in Polar) hanging from lower crags into open air
        if (polarK > 0.25) {
          ctx.fillStyle = css(mix([210, 232, 255], rimC, 0.35), 0.78);
          ctx.beginPath();
          for (const r of o.roots) {
            const rx = r[0], ry = r[1], rlen = r[2] * 0.65;
            ctx.moveTo(rx - 2.6, ry);
            ctx.lineTo(rx, ry + rlen);
            ctx.lineTo(rx + 2.6, ry);
          }
          ctx.closePath();
          ctx.fill();
        } else {
          ctx.strokeStyle = css(mix(obsFillC, [28, 22, 18], 0.35), 0.88);
          ctx.lineCap = 'round';
          for (const r of o.roots) {
            const rx = r[0], ry = r[1], rlen = r[2], rcurv = r[3] || 0;
            const sway = Math.sin(gtime * 1.5 + rx * 0.08) * 4.5 + gust * 5;
            ctx.lineWidth = 2.1;
            ctx.beginPath();
            ctx.moveTo(rx, ry);
            ctx.quadraticCurveTo(rx + rcurv * 0.6 + sway * 0.5, ry + rlen * 0.52, rx + rcurv * 0.35 + sway, ry + rlen);
            ctx.stroke();
            ctx.lineWidth = 1.1;
            ctx.beginPath();
            ctx.moveTo(rx + rcurv * 0.3 + sway * 0.3, ry + rlen * 0.42);
            ctx.quadraticCurveTo(rx + rcurv + sway * 0.8, ry + rlen * 0.65, rx + rcurv * 0.9 + sway * 1.1, ry + rlen * 0.78);
            ctx.stroke();
          }
        }

        // 3. Multi-faceted 3D rock island body with smooth positional facet shading
        ctx.beginPath(); polyPath(ctx, o.polys[0]);
        ctx.fillStyle = css(deepShd);
        ctx.fill();

        ctx.save();
        ctx.beginPath(); polyPath(ctx, o.polys[0]); ctx.clip();
        if (o.rL && o.rM && o.rR) {
          const fCols = [f0, f1, f2, f3];
          const fillFacet = (a, b, colTop, colBot) => {
            ctx.beginPath();
            ctx.moveTo(a[0], a[1]);
            for (let i = 2; i < a.length; i += 2) ctx.lineTo(a[i], a[i + 1]);
            for (let i = b.length - 2; i >= 0; i -= 2) ctx.lineTo(b[i], b[i + 1]);
            ctx.closePath();
            const fg = ctx.createLinearGradient(0, 0, 0, o.depth);
            fg.addColorStop(0, css(colTop));
            fg.addColorStop(1, css(colBot));
            ctx.fillStyle = fg;
            ctx.fill();
          };
          const lEdge = [-o.ww * 0.52, -4, -o.ww * 0.48, 22, -o.ww * 0.41, 42, o.subL - 14, o.subLDepth];
          const rEdge = [o.ww * 0.52, -4, o.ww * 0.48, 22, o.ww * 0.41, 42, o.subR + 14, o.subRDepth];
          fillFacet(lEdge, o.rL, fCols[0], mix(fCols[0], deepShd, 0.48));
          fillFacet(o.rL, o.rM, fCols[1], mix(fCols[1], deepShd, 0.50));
          fillFacet(o.rM, o.rR, fCols[2], mix(fCols[2], deepShd, 0.52));
          fillFacet(o.rR, rEdge, fCols[3], mix(fCols[3], deepShd, 0.55));

          // canyon sandstone strata on floating mesa
          if (canyonK > 0.05) {
            const ltS = mix(obsFillC, [255, 210, 165], 0.22), dkS = mix(obsFillC, [36, 14, 10], 0.32);
            for (let y = 10, k = 0; y < o.depth; y += 10, k++) {
              ctx.fillStyle = css(k % 2 ? ltS : dkS, 0.22 * canyonK);
              ctx.fillRect(-o.ww, y, o.ww * 2, 4 + (k % 2));
            }
          }

          // stepped rock ledges and facet ridge highlights
          ctx.strokeStyle = css(rimC, 0.26);
          ctx.lineWidth = 1.2;
          ctx.beginPath();
          polyLine(o.rL); polyLine(o.rM); polyLine(o.rR);
          ctx.stroke();

          ctx.strokeStyle = css(mix(obsFillC, BLACK, 0.55), 0.42);
          ctx.lineWidth = 1.8;
          ctx.beginPath();
          ctx.moveTo(-o.ww * 0.36, o.depth * 0.28); ctx.lineTo(-o.ww * 0.06, o.depth * 0.34);
          ctx.moveTo(o.ww * 0.04, o.depth * 0.42); ctx.lineTo(o.ww * 0.34, o.depth * 0.36);
          ctx.moveTo(-o.ww * 0.20, o.depth * 0.58); ctx.lineTo(o.ww * 0.16, o.depth * 0.64);
          ctx.stroke();
        }
        ctx.restore();

        // outer crag rim outline
        ctx.beginPath(); polyPath(ctx, o.polys[0]);
        ctx.strokeStyle = css(rimC, 0.42); ctx.lineWidth = 1.4; ctx.lineJoin = 'round'; ctx.stroke();

        // 4. Trees / desert formations on top of the floating rock
        for (const t of o.trees) {
          const tx = t[0], th = t[1], tw = t[2] || th * 0.44, tseed = t[3] || 1;
          if (CANYON) {
            // desert saguaro / sandstone pinnacle on canyon floating rocks
            const cc = mix(obsFillC, [52, 94, 58], 0.48), ctw = Math.max(4.5, th * 0.09);
            const cLit = mix(cc, rimC, 0.28), cShd = mix(cc, [8, 14, 24], 0.42);
            const cg2 = ctx.createLinearGradient(tx - ctw, 0, tx + ctw, 0);
            cg2.addColorStop(0, css(mix(cShd, cLit, lMix)));
            cg2.addColorStop(1, css(mix(cLit, cShd, lMix)));
            ctx.lineCap = 'round';
            ctx.strokeStyle = cg2;
            ctx.lineWidth = ctw * 2;
            ctx.beginPath(); ctx.moveTo(tx, 3); ctx.lineTo(tx, -th + ctw); ctx.stroke();
            if (th > 50) {
              ctx.lineWidth = ctw * 1.4;
              ctx.beginPath();
              ctx.moveTo(tx, -th * 0.48); ctx.lineTo(tx + ctw * 2.4, -th * 0.48); ctx.lineTo(tx + ctw * 2.4, -th * 0.74);
              ctx.stroke();
            }
          } else {
            drawPineTree(tx, 3, th, tw, tseed, 2.6, lMix);
          }
        }

        // 5. Sculpted overhanging top cap (mossy turf / snowdrift / sandstone rim)
        const tp = o.topPts || o.polys[0];
        const tn = Math.min(tp.length, 18);
        ctx.beginPath();
        ctx.moveTo(tp[0] - 3, tp[1] + 2);
        for (let i = 2; i < tn; i += 2) {
          const mx = (tp[i - 2] + tp[i]) * 0.5, my = Math.min(tp[i - 1], tp[i + 1]) - 3.5;
          ctx.quadraticCurveTo(mx, my, tp[i] + (i === tn - 2 ? 3 : 0), tp[i + 1] + (i === tn - 2 ? 2 : -1));
        }
        for (let i = tn - 2; i >= 2; i -= 2) {
          const mx = (tp[i] + tp[i - 2]) * 0.5;
          const hang = 7 + ((i * 7 + (o.seed || 1)) % 7);
          ctx.quadraticCurveTo(mx, tp[i + 1] + hang, tp[i - 2] - (i === 2 ? 3 : 0), tp[i - 1] + 4);
        }
        ctx.closePath();
        const capBase = CANYON
          ? mix(obsFillC, [196, 118, 78], 0.38)
          : polarK > 0.2
            ? mix([232, 242, 255], rimC, 0.25)
            : mix(obsFillC, [64, 128, 76], 0.46 * (1 - pal.stars * 0.4));
        const cg = ctx.createLinearGradient(0, -6, 0, 12);
        cg.addColorStop(0, css(mix(capBase, rimC, 0.38)));
        cg.addColorStop(1, css(mix(capBase, BLACK, 0.28)));
        ctx.fillStyle = cg;
        ctx.fill();
        ctx.strokeStyle = css(mix(capBase, rimC, 0.55), 0.7);
        ctx.lineWidth = 1.3;
        ctx.stroke();

        ctx.restore();
        break;
      }
      case 'hang': {
        const p = o.polys[0];
        const litFace = mix(obsFillC, rimC, 0.26);
        const midFace = mix(obsFillC, rimC, 0.08);
        const shdFace = mix(obsFillC, [8, 12, 28], 0.42);
        const lCol = mix(shdFace, litFace, lMix);
        const rCol = mix(litFace, shdFace, lMix);

        // hanging vines or polar icicles from the stalactite tips
        if (o.vines) {
          if (polarK > 0.25) {
            ctx.fillStyle = css(mix([210, 232, 255], rimC, 0.35), 0.8);
            ctx.beginPath();
            for (const [vx, vy, vlen] of o.vines) {
              ctx.moveTo(vx - 3, vy); ctx.lineTo(vx, vy + vlen * 0.7); ctx.lineTo(vx + 3, vy);
            }
            ctx.closePath();
            ctx.fill();
          } else if (!CANYON) {
            ctx.strokeStyle = css(mix(obsFillC, [26, 42, 28], 0.35), 0.85);
            ctx.lineWidth = 1.8; ctx.lineCap = 'round';
            ctx.beginPath();
            for (const [vx, vy, vlen, voff] of o.vines) {
              const sway = Math.sin(gtime * 1.5 + vx * 0.05) * 4 + gust * 5;
              ctx.moveTo(vx, vy);
              ctx.quadraticCurveTo(vx + voff * 0.5 + sway * 0.5, vy + vlen * 0.5, vx + voff * 0.3 + sway, vy + vlen);
            }
            ctx.stroke();
          }
        }

        ctx.beginPath(); polyPath(ctx, p);
        ctx.fillStyle = css(shdFace); ctx.fill();

        ctx.save();
        ctx.beginPath(); polyPath(ctx, p); ctx.clip();
        // Both left and right stalactite facets shaded smoothly by lMix
        ctx.beginPath();
        ctx.moveTo(o.x - o.bw * 0.52, viewTop - 60);
        ctx.lineTo(o.x + o.bw * 0.02, viewTop - 60);
        ctx.lineTo(o.x - 2, o.bottom);
        ctx.lineTo(o.x - o.bw * 0.52, o.bottom);
        ctx.closePath();
        ctx.fillStyle = css(lCol);
        ctx.fill();

        ctx.beginPath();
        ctx.moveTo(o.x + o.bw * 0.02, viewTop - 60);
        ctx.lineTo(o.x + o.bw * 0.52, viewTop - 60);
        ctx.lineTo(o.x + o.bw * 0.52, o.bottom);
        ctx.lineTo(o.x - 2, o.bottom);
        ctx.closePath();
        ctx.fillStyle = css(rCol);
        ctx.fill();

        const hg = ctx.createLinearGradient(o.minX, 0, o.maxX, 0);
        hg.addColorStop(0, css(lCol, 0.55));
        hg.addColorStop(0.5, css(midFace, 0.55));
        hg.addColorStop(1, css(rCol, 0.55));
        ctx.fillStyle = hg;
        ctx.fillRect(o.minX, viewTop - 60, o.bw + 20, o.bottom - viewTop + 80);

        if (canyonK > 0.05) {
          const ltS = mix(obsFillC, [255, 210, 165], 0.22), dkS = mix(obsFillC, [36, 14, 10], 0.32);
          for (let y = Math.floor(Math.max(viewTop - 20, o.bottom - 380) / 11) * 11, k = 0; y < o.bottom; y += 11, k++) {
            ctx.fillStyle = css(k % 2 ? ltS : dkS, 0.22 * canyonK);
            ctx.fillRect(o.minX, y, o.bw + 20, 4 + (k % 3));
          }
        }

        // internal stalactite ridge lines
        ctx.strokeStyle = css(rimC, 0.24);
        ctx.lineWidth = 1.3;
        ctx.beginPath();
        ctx.moveTo(o.x - o.bw * 0.22, viewTop - 20); ctx.lineTo(o.x - o.bw * 0.31, o.bottom - 22);
        ctx.moveTo(o.x + o.bw * 0.02, viewTop - 20); ctx.lineTo(o.x - 2, o.bottom);
        ctx.moveTo(o.x + o.bw * 0.20, viewTop - 20); ctx.lineTo(o.x + o.bw * 0.24, o.bottom - 28);
        ctx.stroke();
        ctx.restore();

        ctx.beginPath(); polyPath(ctx, p);
        ctx.strokeStyle = css(rimC, 0.45); ctx.lineWidth = 1.6; ctx.lineJoin = 'round'; ctx.stroke();
        break;
      }
      case 'balloon': {
        drawHotAirBalloon(o.x, o.oy, o.R, o.scheme, o.seed, lMix, 0, o.burner, o.sway, 1);
        break;
      }
      case 'building': {
        drawBuilding(o, lMix);
        break;
      }
      case 'kite': {
        drawKite(o.x, o.oy, o.R, o.scheme, o.kind, o.seed, lMix, 0, o.sway, 1);
        break;
      }
      case 'hawk': drawHawk(o); break;
      case 'storm': drawStorm(o); break;
    }
  }
}
const BALLOON_SCHEMES = [
  { a: [246, 236, 216], b: [56, 86, 132], b1: [216, 84, 70], b2: [236, 180, 78], tr: [255, 236, 188] },
  { a: [232, 240, 218], b: [54, 92, 58], b1: [232, 184, 82], b2: [184, 88, 62], tr: [250, 234, 186] },
  { a: [252, 228, 198], b: [192, 78, 62], b1: [118, 44, 58], b2: [248, 196, 92], tr: [255, 240, 200] },
  { a: [244, 234, 214], b: [44, 118, 122], b1: [210, 114, 68], b2: [238, 186, 84], tr: [250, 238, 206] },
  { a: [238, 230, 214], b: [68, 76, 128], b1: [234, 182, 82], b2: [168, 72, 84], tr: [255, 236, 194] },
  { a: [246, 234, 212], b: [148, 52, 64], b1: [52, 78, 114], b2: [232, 176, 76], tr: [255, 238, 198] },
];
const GORE_U = [-1, -0.809, -0.5, -0.142, 0.142, 0.5, 0.809, 1];
function drawHotAirBalloon(x, y, R, schemeIdx, seed, lMix, depthFog, burnerAmt, swayAngle, alphaMul) {
  const sc = BALLOON_SCHEMES[(schemeIdx || 0) % BALLOON_SCHEMES.length];
  const nightDim = 1 - pal.stars * 0.52;
  const fogTarget = mix(pal.fog, pal.far, depthFog * 0.45);
  const toneCol = (rgb) => {
    const lit = mix(rgb, obsFillC, 0.22 + 0.45 * pal.stars);
    const dayLit = [lit[0] * (0.68 + 0.32 * nightDim), lit[1] * (0.70 + 0.30 * nightDim), lit[2] * (0.76 + 0.24 * nightDim)];
    return mix(dayLit, fogTarget, depthFog);
  };
  const cA = toneCol(sc.a), cB = toneCol(sc.b), cB1 = toneCol(sc.b1), cB2 = toneCol(sc.b2), cTr = toneCol(sc.tr);
  const shdTint = mix(obsFillC, [8, 12, 28], 0.48);
  const litTint = mix(rimC, pal.sun, 0.28);
  const lightDir = (0.5 - lMix) * 2; // -1 when sun is left, +1 when sun is right

  const traceDown = (u) => {
    ctx.bezierCurveTo(u * R * 0.56, -R * 1.02, u * R * 0.96, -R * 0.64, u * R * 0.94, -R * 0.14);
    ctx.bezierCurveTo(u * R * 0.91, R * 0.30, u * R * 0.44, R * 0.64, u * R * 0.25, R * 0.86);
  };
  const traceUp = (u) => {
    ctx.bezierCurveTo(u * R * 0.44, R * 0.64, u * R * 0.91, R * 0.30, u * R * 0.94, -R * 0.14);
    ctx.bezierCurveTo(u * R * 0.96, -R * 0.64, u * R * 0.56, -R * 1.02, 0, -R * 1.02);
  };
  const traceEnv = () => {
    ctx.beginPath();
    ctx.moveTo(0, -R * 1.02);
    traceDown(-1);
    ctx.quadraticCurveTo(0, R * 0.91, R * 0.25, R * 0.86);
    traceUp(1);
    ctx.closePath();
  };

  ctx.save();
  ctx.translate(x, y);
  if (alphaMul < 0.999) ctx.globalAlpha = alphaMul;

  // 1. Suspension rigging & woven wicker basket (drawn behind throat skirt)
  ctx.save();
  ctx.translate(0, R * 0.86);
  ctx.rotate(swayAngle || 0);
  const bTop = R * 0.31, bBot = R * 0.57, bW = R * 0.21;
  ctx.strokeStyle = css(mix([48, 42, 38], fogTarget, depthFog), 0.78 * alphaMul);
  ctx.lineWidth = Math.max(0.8, R * 0.022);
  ctx.beginPath();
  ctx.moveTo(-R * 0.22, 0); ctx.lineTo(-bW * 0.88, bTop);
  ctx.moveTo(-R * 0.09, R * 0.02); ctx.lineTo(-bW * 0.42, bTop);
  ctx.moveTo(R * 0.09, R * 0.02); ctx.lineTo(bW * 0.42, bTop);
  ctx.moveTo(R * 0.22, 0); ctx.lineTo(bW * 0.88, bTop);
  // burner support struts
  ctx.moveTo(-bW * 0.55, bTop); ctx.lineTo(-R * 0.06, R * 0.12);
  ctx.moveTo(bW * 0.55, bTop); ctx.lineTo(R * 0.06, R * 0.12);
  ctx.stroke();

  // Burner glow & flickering flame shooting into the balloon mouth
  const bAmt = clamp(burnerAmt || 0.3, 0.1, 1);
  const flH = R * (0.16 + 0.24 * bAmt + Math.sin(time * 28 + seed) * 0.03);
  const flW = R * (0.06 + 0.05 * bAmt);
  ctx.save();
  ctx.globalCompositeOperation = 'lighter';
  ctx.globalAlpha = (0.35 + 0.55 * bAmt) * (1 - depthFog * 0.5) * alphaMul;
  const gR = R * (0.48 + 0.35 * bAmt);
  ctx.drawImage(GLOW.warm, -gR, R * 0.08 - gR, gR * 2, gR * 2);
  ctx.restore();

  ctx.fillStyle = css(mix([255, 148, 52], fogTarget, depthFog * 0.4), (0.82 + 0.18 * bAmt) * alphaMul);
  ctx.beginPath();
  ctx.moveTo(-flW, R * 0.11);
  ctx.quadraticCurveTo(-flW * 1.15, R * 0.11 - flH * 0.55, Math.sin(time * 34 + seed) * R * 0.025, R * 0.11 - flH);
  ctx.quadraticCurveTo(flW * 1.15, R * 0.11 - flH * 0.55, flW, R * 0.11);
  ctx.closePath();
  ctx.fill();

  ctx.fillStyle = css([255, 246, 205], (0.85 + 0.15 * bAmt) * (1 - depthFog * 0.4) * alphaMul);
  ctx.beginPath();
  ctx.moveTo(-flW * 0.52, R * 0.11);
  ctx.quadraticCurveTo(-flW * 0.5, R * 0.11 - flH * 0.38, 0, R * 0.11 - flH * 0.68);
  ctx.quadraticCurveTo(flW * 0.5, R * 0.11 - flH * 0.38, flW * 0.52, R * 0.11);
  ctx.closePath();
  ctx.fill();

  // Metallic burner nozzle ring
  ctx.fillStyle = css(mix([68, 72, 84], fogTarget, depthFog));
  ctx.fillRect(-R * 0.07, R * 0.10, R * 0.14, R * 0.035);

  // Silhouette of balloonist inside the basket
  if (R > 18) {
    const pCol = css(mix([32, 36, 52], fogTarget, depthFog));
    ctx.fillStyle = pCol;
    ctx.beginPath();
    ctx.arc(-bW * 0.18, bTop - R * 0.065, R * 0.036, 0, TAU);
    ctx.fill();
    ctx.beginPath();
    ctx.ellipse(-bW * 0.18, bTop - R * 0.01, R * 0.052, R * 0.035, 0, Math.PI, TAU);
    ctx.fill();
  }

  // Woven wicker basket with 3D directional shading
  const wLit = toneCol([166, 114, 68]), wMid = toneCol([122, 78, 44]), wShd = mix(toneCol([74, 44, 26]), shdTint, 0.35);
  const bGrad = ctx.createLinearGradient(-bW, 0, bW, 0);
  bGrad.addColorStop(0, css(mix(wShd, wLit, lMix)));
  bGrad.addColorStop(0.5, css(wMid));
  bGrad.addColorStop(1, css(mix(wLit, wShd, lMix)));
  ctx.fillStyle = bGrad;
  ctx.beginPath();
  ctx.moveTo(-bW, bTop);
  ctx.lineTo(bW, bTop);
  ctx.lineTo(bW * 0.86, bBot - R * 0.03);
  ctx.quadraticCurveTo(bW * 0.84, bBot, bW * 0.70, bBot);
  ctx.lineTo(-bW * 0.70, bBot);
  ctx.quadraticCurveTo(-bW * 0.84, bBot, -bW * 0.86, bBot - R * 0.03);
  ctx.closePath();
  ctx.fill();

  // Wicker weave ribs & sandbags on detailed balloons
  if (R > 22) {
    ctx.strokeStyle = css(mix(wShd, BLACK, 0.35), 0.45 * alphaMul);
    ctx.lineWidth = Math.max(0.7, R * 0.016);
    ctx.beginPath();
    for (let wy = bTop + R * 0.055; wy < bBot - R * 0.02; wy += R * 0.055) {
      const k = (wy - bTop) / (bBot - bTop), hw = lerp(bW, bW * 0.85, k);
      ctx.moveTo(-hw, wy); ctx.lineTo(hw, wy);
    }
    for (const u of [-0.55, -0.18, 0.18, 0.55]) {
      ctx.moveTo(u * bW, bTop); ctx.lineTo(u * bW * 0.86, bBot);
    }
    ctx.stroke();

    // Ballast sandbags hanging on basket sides
    const sbCol = toneCol([196, 168, 122]);
    ctx.fillStyle = css(sbCol);
    for (const sx of [-bW * 0.92, bW * 0.92]) {
      ctx.beginPath();
      ctx.ellipse(sx, bTop + R * 0.08, R * 0.032, R * 0.046, sx < 0 ? 0.12 : -0.12, 0, TAU);
      ctx.fill();
    }
  }

  // Leather padded basket rim
  ctx.fillStyle = css(mix(toneCol([78, 46, 28]), shdTint, 0.25));
  ctx.beginPath();
  ctx.roundRect(-bW * 1.08, bTop - R * 0.022, bW * 2.16, R * 0.048, R * 0.02);
  ctx.fill();
  ctx.restore();

  // 2. Envelope silhouette & clipped 3D gores
  traceEnv();
  ctx.fillStyle = css(cA);
  ctx.fill();

  ctx.save();
  traceEnv();
  ctx.clip();

  // 7 curved vertical gores shaded by spherical surface normal
  for (let k = 0; k < 7; k++) {
    const u0 = GORE_U[k], u1 = GORE_U[k + 1], uc = (u0 + u1) * 0.5;
    const base = k % 2 === 0 ? cA : cB;
    const sunFace = clamp(0.5 + 0.52 * (uc * lightDir) + 0.18 * (1 - uc * uc), 0, 1);
    const gTop = mix(mix(base, shdTint, 0.38), mix(base, litTint, 0.30 * (1 - depthFog * 0.5)), sunFace);
    const gBot = mix(mix(base, shdTint, 0.52), mix(base, litTint, 0.12 * (1 - depthFog * 0.5)), sunFace);
    const gg = ctx.createLinearGradient(0, -R, 0, R * 0.86);
    gg.addColorStop(0, css(gTop));
    gg.addColorStop(0.58, css(mix(gTop, gBot, 0.45)));
    gg.addColorStop(1, css(gBot));
    ctx.fillStyle = gg;
    ctx.beginPath();
    ctx.moveTo(0, -R * 1.02);
    traceDown(u0);
    ctx.lineTo(u1 * R * 0.25, R * 0.86);
    traceUp(u1);
    ctx.closePath();
    ctx.fill();
  }

  // Curved horizontal latitude bands following the 3D sphere curvature
  const drawLatBand = (y0, y1, dip, col, trimCol) => {
    const bG = ctx.createLinearGradient(-R, 0, R, 0);
    const bLit = mix(col, litTint, 0.26 * (1 - depthFog * 0.5));
    const bShd = mix(col, shdTint, 0.42);
    bG.addColorStop(0, css(mix(bShd, bLit, lMix)));
    bG.addColorStop(0.5, css(col));
    bG.addColorStop(1, css(mix(bLit, bShd, lMix)));
    ctx.fillStyle = bG;
    ctx.beginPath();
    ctx.moveTo(-R * 1.05, y0);
    ctx.quadraticCurveTo(0, y0 + dip, R * 1.05, y0);
    ctx.lineTo(R * 1.05, y1);
    ctx.quadraticCurveTo(0, y1 + dip, -R * 1.05, y1);
    ctx.closePath();
    ctx.fill();
    if (trimCol && R > 16) {
      ctx.strokeStyle = css(trimCol, 0.82 * alphaMul);
      ctx.lineWidth = Math.max(0.8, R * 0.024);
      ctx.beginPath();
      ctx.moveTo(-R * 1.05, y0); ctx.quadraticCurveTo(0, y0 + dip, R * 1.05, y0);
      ctx.moveTo(-R * 1.05, y1); ctx.quadraticCurveTo(0, y1 + dip, R * 1.05, y1);
      ctx.stroke();
    }
  };
  drawLatBand(-R * 0.36, -R * 0.11, R * 0.13, cB1, cTr);
  drawLatBand(R * 0.22, R * 0.37, R * 0.09, cB2, cTr);

  // Decorative diamond / chevron motifs across the equator band on closer balloons
  if (R > 22) {
    ctx.fillStyle = css(cTr, 0.88 * alphaMul);
    for (let k = 0; k < 7; k++) {
      const u0 = GORE_U[k], u1 = GORE_U[k + 1], uc = (u0 + u1) * 0.5;
      const x0 = u0 * R * 0.94, x1 = u1 * R * 0.94, xc = uc * R * 0.94;
      const ym = -R * 0.235 + (1 - uc * uc) * R * 0.065;
      ctx.beginPath();
      ctx.moveTo(xc, ym - R * 0.075);
      ctx.lineTo(lerp(xc, x1, 0.55), ym);
      ctx.lineTo(xc, ym + R * 0.075);
      ctx.lineTo(lerp(xc, x0, 0.55), ym);
      ctx.closePath();
      ctx.fill();
    }
  }

  // Crown cap medallion at top pole
  ctx.fillStyle = css(cB1);
  ctx.beginPath();
  ctx.ellipse(0, -R * 0.98, R * 0.36, R * 0.09, 0, 0, TAU);
  ctx.fill();

  // Vertical gore seam lines for pillowed 3D panel relief
  ctx.strokeStyle = css(shdTint, (R > 24 ? 0.34 : 0.22) * alphaMul);
  ctx.lineWidth = Math.max(0.7, R * 0.02);
  ctx.beginPath();
  for (let k = 1; k < 7; k++) {
    ctx.moveTo(0, -R * 1.02);
    traceDown(GORE_U[k]);
  }
  ctx.stroke();

  // Smooth global 3D spherical lighting & terminator shadow across the balloon
  const sphG = ctx.createRadialGradient(
    -lightDir * R * 0.38, -R * 0.38, R * 0.08,
    lightDir * R * 0.25, R * 0.1, R * 1.35
  );
  sphG.addColorStop(0, css(litTint, 0.24 * (1 - depthFog * 0.5)));
  sphG.addColorStop(0.52, 'rgba(0,0,0,0)');
  sphG.addColorStop(1, css(shdTint, 0.44 * (1 - depthFog * 0.35)));
  ctx.fillStyle = sphG;
  ctx.fillRect(-R * 1.1, -R * 1.1, R * 2.2, R * 2.1);

  // Internal warm translucent burner glow lighting up the lower envelope from inside
  const inGlowA = (0.22 + 0.52 * bAmt) * (1 - depthFog * 0.55) * (0.65 + 0.35 * pal.stars);
  const inG = ctx.createRadialGradient(0, R * 0.78, R * 0.04, 0, R * 0.45, R * 0.92);
  inG.addColorStop(0, `rgba(255, 215, 110, ${inGlowA})`);
  inG.addColorStop(0.45, `rgba(255, 135, 45, ${inGlowA * 0.55})`);
  inG.addColorStop(1, 'rgba(255, 90, 20, 0)');
  ctx.globalCompositeOperation = 'lighter';
  ctx.fillStyle = inG;
  ctx.fillRect(-R, -R * 0.2, R * 2, R * 1.2);
  ctx.globalCompositeOperation = 'source-over';

  // Heat-resistant nomex throat skirt collar at bottom of envelope
  ctx.fillStyle = css(mix(cB1, shdTint, 0.38));
  ctx.fillRect(-R * 0.32, R * 0.78, R * 0.64, R * 0.12);
  ctx.strokeStyle = css(cTr, 0.7 * alphaMul);
  ctx.lineWidth = Math.max(0.8, R * 0.022);
  ctx.beginPath();
  ctx.moveTo(-R * 0.32, R * 0.78);
  ctx.quadraticCurveTo(0, R * 0.82, R * 0.32, R * 0.78);
  ctx.stroke();

  ctx.restore();

  // Dark throat opening rim
  ctx.fillStyle = css(mix([18, 14, 24], fogTarget, depthFog * 0.7));
  ctx.beginPath();
  ctx.ellipse(0, R * 0.86, R * 0.25, R * 0.045, 0, 0, TAU);
  ctx.fill();

  // Sunlit outer rim highlight
  traceEnv();
  ctx.strokeStyle = css(mix(rimC, fogTarget, depthFog * 0.6), (0.48 - depthFog * 0.22) * alphaMul);
  ctx.lineWidth = Math.max(0.9, R * 0.028);
  ctx.stroke();

  ctx.restore();
}
function drawBgBalloons(band, reflectAlpha = 0) {
  const forestK = (1 - cityK) * (1 - canyonK) * (1 - polarK) * (1 - volcK) * (1 - stormAmt() * 0.65) * (1 - blizAmt() * 0.85);
  if (forestK < 0.02) return;
  const sunX = sun.a >= moon.a ? sun.x : moon.x;
  for (const b of bgBalloons) {
    if (b.band !== band) continue;
    const sx = b.wx - camX * b.par;
    if (sx < -b.R * 2 || sx > W + b.R * 2) continue;
    const lMix = sstep(clamp(0.5 + (sx - sunX) / 560, 0, 1));
    const cyc = time * 0.85 + b.burnPh;
    const burner = clamp(0.18 + Math.max(0, Math.sin(cyc)) * 0.78, 0.15, 0.96);
    const sway = Math.sin(time * 1.1 + b.ph) * 0.04;
    const a = forestK * (reflectAlpha > 0 ? reflectAlpha : 1);
    const fog = reflectAlpha > 0 ? Math.min(0.85, b.fog + 0.22) : b.fog;
    drawHotAirBalloon(sx, b.oy, b.R, b.scheme, b.seed, lMix, fog, burner, sway, a);
  }
}

/* =========================================================
   1900s Eski Şehir: Foreground Buildings & Vintage Kites
   ========================================================= */
function drawBuilding(o, lMix) {
  const { x, gy, h, bw, kind, seed } = o;
  const hw = bw * 0.5, topY = gy - h;
  const shoulderY = gy - h * (kind === 0 ? 0.68 : kind === 1 ? 0.80 : 0.75);
  const nightDim = 1 - pal.stars * 0.45;
  const toneBldg = (rgb, w = 0.48) => mix(obsFillC, [rgb[0] * nightDim, rgb[1] * nightDim, rgb[2] * nightDim], w);

  // 1900s masonry palette by architectural kind
  const wallPalette = [
    [148, 114, 88],  // 0: Warm limestone & sandstone clock tower
    [138, 122, 108], // 1: Parisian cream-grey ashlar stone apartment
    [152, 82, 64],   // 2: Terracotta red-brick stepped-gable guildhall
    [142, 126, 98],  // 3: Classical ochre stone domed pavilion
  ];
  const baseWall = toneBldg(wallPalette[kind % 4], 0.46);
  const litWall = mix(baseWall, rimC, 0.28);
  const shdWall = mix(baseWall, [12, 10, 22], 0.46);
  const lCol = mix(shdWall, litWall, lMix);
  const rCol = mix(litWall, shdWall, lMix);
  const trimCol = mix(baseWall, rimC, 0.34);
  const slateCol = toneBldg(kind === 3 ? [62, 108, 96] : [48, 52, 68], 0.52);
  const slateLit = mix(slateCol, rimC, 0.26);
  const slateShd = mix(slateCol, [8, 10, 20], 0.48);

  ctx.save();

  // 1. Main 3D split-faceted masonry shaft (left and right faces meet at a subtle vertical pilaster ridge)
  const splitX = x + (lMix - 0.5) * bw * 0.14;
  ctx.fillStyle = css(lCol);
  ctx.beginPath();
  ctx.moveTo(x - hw, gy + 14);
  ctx.lineTo(x - hw, shoulderY);
  ctx.lineTo(splitX, shoulderY);
  ctx.lineTo(splitX, gy + 14);
  ctx.closePath();
  ctx.fill();

  ctx.fillStyle = css(rCol);
  ctx.beginPath();
  ctx.moveTo(splitX, gy + 14);
  ctx.lineTo(splitX, shoulderY);
  ctx.lineTo(x + hw, shoulderY);
  ctx.lineTo(x + hw, gy + 14);
  ctx.closePath();
  ctx.fill();

  // Corner quoins & stone courses texture
  ctx.fillStyle = css(mix(trimCol, shdWall, 0.3), 0.35);
  for (let qy = shoulderY + 6; qy < gy - 4; qy += 12) {
    ctx.fillRect(x - hw, qy, 5, 5);
    ctx.fillRect(x + hw - 5, qy, 5, 5);
  }

  // Horizontal stone belt courses (cornices) between stories
  const bodyH = gy - shoulderY;
  const floors = Math.max(2, Math.min(6, Math.floor(bodyH / 34)));
  const floorH = bodyH / floors;
  for (let f = 1; f < floors; f++) {
    const fy = shoulderY + f * floorH;
    ctx.fillStyle = css(shdWall, 0.65);
    ctx.fillRect(x - hw - 2, fy, bw + 4, 3.2);
    ctx.fillStyle = css(trimCol, 0.72);
    ctx.fillRect(x - hw - 2.5, fy - 1.5, bw + 5, 2);
  }

  // 2. 1900s arched sash windows with warm gaslight interior glow & wrought-iron balconies
  const cols = kind === 0 ? 2 : 3;
  const winW = Math.min(11, (bw * 0.56) / cols);
  const winH = Math.min(18, floorH * 0.54);
  const spanX = bw * 0.64;
  for (let f = 0; f < floors; f++) {
    const wy = shoulderY + f * floorH + (floorH - winH) * 0.52;
    if (wy + winH > gy - 8) continue;
    // Skip top floor windows on clock tower where the grand clock dial sits
    if (kind === 0 && f === 0) continue;

    for (let c = 0; c < cols; c++) {
      const wx = cols === 1 ? x : (x - spanX * 0.5 + (c / (cols - 1)) * spanX);
      const isLit = hash1(seed * 13 + f * 7 + c, 41) > 0.22;

      // Window recess shadow
      ctx.fillStyle = css(mix(shdWall, BLACK, 0.45));
      ctx.beginPath();
      ctx.moveTo(wx - winW * 0.58, wy + winH + 1.5);
      ctx.lineTo(wx - winW * 0.58, wy + winH * 0.28);
      ctx.arc(wx, wy + winH * 0.28, winW * 0.58, Math.PI, 0);
      ctx.lineTo(wx + winW * 0.58, wy + winH + 1.5);
      ctx.closePath();
      ctx.fill();

      // Window glass (warm amber gaslight vs moody evening reflection)
      if (isLit) {
        const wg = ctx.createLinearGradient(0, wy, 0, wy + winH);
        wg.addColorStop(0, css([255, 232, 156], 0.92));
        wg.addColorStop(1, css([242, 168, 68], 0.92));
        ctx.fillStyle = wg;
      } else {
        ctx.fillStyle = css(mix(pal.mid, [28, 36, 58], 0.55), 0.85);
      }
      ctx.beginPath();
      ctx.moveTo(wx - winW * 0.46, wy + winH);
      ctx.lineTo(wx - winW * 0.46, wy + winH * 0.28);
      ctx.arc(wx, wy + winH * 0.28, winW * 0.46, Math.PI, 0);
      ctx.lineTo(wx + winW * 0.46, wy + winH);
      ctx.closePath();
      ctx.fill();

      // Warm gaslight bloom on lit windows
      if (isLit) {
        ctx.save();
        ctx.globalCompositeOperation = 'lighter';
        ctx.globalAlpha = 0.22 + 0.26 * pal.stars;
        ctx.drawImage(GLOW.warm, wx - winW * 1.6, wy - winH * 0.4, winW * 3.2, winH * 2.0);
        ctx.restore();
      }

      // Window muntin crossbars & stone sill
      ctx.strokeStyle = css(mix(shdWall, BLACK, 0.35), 0.8);
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(wx, wy); ctx.lineTo(wx, wy + winH);
      ctx.moveTo(wx - winW * 0.46, wy + winH * 0.52); ctx.lineTo(wx + winW * 0.46, wy + winH * 0.52);
      ctx.stroke();

      ctx.fillStyle = css(trimCol, 0.85);
      ctx.fillRect(wx - winW * 0.65, wy + winH, winW * 1.3, 2.2);

      // Wrought-iron Juliet balcony on Mansard & Pavilion buildings
      if ((kind === 1 || kind === 3) && f % 2 === 1) {
        ctx.strokeStyle = css(mix(shdWall, BLACK, 0.55), 0.78);
        ctx.lineWidth = 1.1;
        ctx.strokeRect(wx - winW * 0.62, wy + winH - 4.5, winW * 1.24, 4.5);
      }
    }
  }

  // 3. Corbeled main roof cornice at shoulderY
  ctx.fillStyle = css(mix(shdWall, BLACK, 0.35));
  ctx.fillRect(x - hw - 4.5, shoulderY, bw + 9, 4.5);
  ctx.fillStyle = css(trimCol);
  ctx.fillRect(x - hw - 5.5, shoulderY - 3, bw + 11, 3.5);

  // 4. Roof & Crown Architecture by kind (matches o.polys[0] collision contour)
  if (kind === 0) {
    // === KIND 0: 1900s Grand Clock Tower & Spire ===
    // Steep octagonal copper/slate spire
    ctx.fillStyle = css(mix(slateShd, slateLit, lMix));
    ctx.beginPath();
    ctx.moveTo(x - hw - 2, shoulderY - 2);
    ctx.lineTo(x, topY);
    ctx.lineTo(x, shoulderY - 2);
    ctx.closePath();
    ctx.fill();

    ctx.fillStyle = css(mix(slateLit, slateShd, lMix));
    ctx.beginPath();
    ctx.moveTo(x, shoulderY - 2);
    ctx.lineTo(x, topY);
    ctx.lineTo(x + hw + 2, shoulderY - 2);
    ctx.closePath();
    ctx.fill();

    // Ornate wrought-iron weathervane finial at spire apex
    ctx.strokeStyle = css(mix(trimCol, [255, 220, 140], 0.5), 0.9);
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(x, topY + 2); ctx.lineTo(x, topY - 11);
    ctx.moveTo(x - 5, topY - 6); ctx.lineTo(x + 5, topY - 6);
    ctx.stroke();

    // Grand illuminated 1900s Clock Face in the upper belfry
    const clkR = Math.min(hw * 0.56, floorH * 0.44, 16);
    const clkY = shoulderY + Math.max(clkR + 6, floorH * 0.52);
    ctx.save();
    ctx.globalCompositeOperation = 'lighter';
    ctx.globalAlpha = 0.35 + 0.35 * pal.stars;
    ctx.drawImage(GLOW.warm, x - clkR * 2.2, clkY - clkR * 2.2, clkR * 4.4, clkR * 4.4);
    ctx.restore();

    // Brass bezel & warm ivory clock dial
    ctx.fillStyle = css(mix([198, 152, 74], shdWall, 0.25));
    ctx.beginPath(); ctx.arc(x, clkY, clkR + 2.5, 0, TAU); ctx.fill();
    ctx.fillStyle = css([255, 240, 196], 0.96);
    ctx.beginPath(); ctx.arc(x, clkY, clkR, 0, TAU); ctx.fill();

    // Clock hour ticks & hands
    ctx.strokeStyle = css([36, 28, 32], 0.9);
    ctx.lineWidth = 1.2;
    ctx.beginPath();
    for (let a = 0; a < 12; a++) {
      const ang = (a / 12) * TAU;
      ctx.moveTo(x + Math.cos(ang) * clkR * 0.74, clkY + Math.sin(ang) * clkR * 0.74);
      ctx.lineTo(x + Math.cos(ang) * clkR * 0.92, clkY + Math.sin(ang) * clkR * 0.92);
    }
    // Hands slowly ticking
    const hAng = -Math.PI * 0.5 + (seed % 12) * (TAU / 12) + gtime * 0.02;
    const mAng = -Math.PI * 0.5 + gtime * 0.24 + seed;
    ctx.moveTo(x, clkY); ctx.lineTo(x + Math.cos(hAng) * clkR * 0.52, clkY + Math.sin(hAng) * clkR * 0.52);
    ctx.moveTo(x, clkY); ctx.lineTo(x + Math.cos(mAng) * clkR * 0.76, clkY + Math.sin(mAng) * clkR * 0.76);
    ctx.stroke();

  } else if (kind === 1) {
    // === KIND 1: Belle Époque Mansard Roof Apartment ===
    const rw = hw * 0.76;
    // Twin brick chimneys Behind/On edges of Mansard
    const chW = Math.max(5, bw * 0.11);
    ctx.fillStyle = css(toneBldg([146, 74, 58], 0.48));
    ctx.fillRect(x - rw + 2, topY - 8, chW, 12);
    ctx.fillRect(x + rw - chW - 2, topY - 8, chW, 12);
    ctx.fillStyle = css(trimCol);
    ctx.fillRect(x - rw + 1, topY - 9.5, chW + 2, 2);
    ctx.fillRect(x + rw - chW - 3, topY - 9.5, chW + 2, 2);

    // Gentle coal smoke rising from left chimney
    const smokeCol = mix(pal.fog, [220, 210, 200], 0.35);
    for (let s = 0; s < 4; s++) {
      const ph = (time * 0.5 + s * 0.25 + seed * 0.13) % 1;
      const sx = x - rw + 2 + chW * 0.5 + ph * 18 + Math.sin(time * 2 + s + seed) * 3 + gust * 8 * ph;
      const sy = topY - 10 - ph * 28;
      ctx.fillStyle = css(smokeCol, (1 - ph) * 0.32);
      ctx.beginPath(); ctx.arc(sx, sy, 3.5 + ph * 7.5, 0, TAU); ctx.fill();
    }

    // Trapezoidal slate mansard roof
    const mg = ctx.createLinearGradient(x - hw, 0, x + hw, 0);
    mg.addColorStop(0, css(mix(slateShd, slateLit, lMix)));
    mg.addColorStop(0.5, css(slateCol));
    mg.addColorStop(1, css(mix(slateLit, slateShd, lMix)));
    ctx.fillStyle = mg;
    ctx.beginPath();
    ctx.moveTo(x - hw - 2, shoulderY - 2);
    ctx.lineTo(x - rw, topY);
    ctx.lineTo(x + rw, topY);
    ctx.lineTo(x + hw + 2, shoulderY - 2);
    ctx.closePath();
    ctx.fill();

    // Ornate zinc roof cresting rail along topY
    ctx.strokeStyle = css(trimCol, 0.72);
    ctx.lineWidth = 1.3;
    ctx.beginPath();
    ctx.moveTo(x - rw, topY); ctx.lineTo(x + rw, topY);
    ctx.stroke();

    // Dormer windows in the mansard slope
    for (const u of [-0.42, 0.42]) {
      const dx = x + u * bw * 0.5, dy = lerp(topY, shoulderY, 0.68);
      const dw = 7, dh = 9;
      ctx.fillStyle = css(trimCol);
      ctx.beginPath();
      ctx.moveTo(dx - dw * 0.65, dy - dh);
      ctx.lineTo(dx, dy - dh - 4.5);
      ctx.lineTo(dx + dw * 0.65, dy - dh);
      ctx.closePath();
      ctx.fill();
      ctx.fillRect(dx - dw * 0.5, dy - dh, dw, dh);
      ctx.fillStyle = css([255, 220, 132], 0.9);
      ctx.fillRect(dx - dw * 0.32, dy - dh + 2, dw * 0.64, dh - 3);
    }

  } else if (kind === 2) {
    // === KIND 2: 1900s Stepped-Gable Brick Guildhall / Townhouse ===
    // Side brick chimney with smoke
    const chX = x + hw * 0.48, chW = Math.max(6, bw * 0.13);
    ctx.fillStyle = css(mix(baseWall, shdWall, 0.25));
    ctx.fillRect(chX, topY - 4, chW, (shoulderY - topY) * 0.75 + 4);
    ctx.fillStyle = css(trimCol);
    ctx.fillRect(chX - 1, topY - 6, chW + 2, 2.5);

    const smokeCol = mix(pal.fog, [220, 210, 200], 0.35);
    for (let s = 0; s < 4; s++) {
      const ph = (time * 0.52 + s * 0.25 + seed * 0.19) % 1;
      const sx = chX + chW * 0.5 + ph * 16 + Math.sin(time * 2.1 + s + seed) * 3 + gust * 8 * ph;
      const sy = topY - 7 - ph * 26;
      ctx.fillStyle = css(smokeCol, (1 - ph) * 0.32);
      ctx.beginPath(); ctx.arc(sx, sy, 3.2 + ph * 7, 0, TAU); ctx.fill();
    }

    // Gable triangle wall
    ctx.fillStyle = css(mix(lCol, rCol, 0.5));
    ctx.beginPath();
    ctx.moveTo(x - hw, shoulderY - 2);
    ctx.lineTo(x, topY);
    ctx.lineTo(x + hw, shoulderY - 2);
    ctx.closePath();
    ctx.fill();

    // Stepped stone coping along gable edges
    ctx.strokeStyle = css(trimCol, 0.9);
    ctx.lineWidth = 2.6;
    ctx.beginPath();
    ctx.moveTo(x - hw - 2, shoulderY - 2);
    ctx.lineTo(x, topY);
    ctx.lineTo(x + hw + 2, shoulderY - 2);
    ctx.stroke();

    // Circular attic rose window in gable center
    const ry = lerp(topY, shoulderY, 0.58), rr = Math.min(7.5, bw * 0.12);
    ctx.fillStyle = css(trimCol);
    ctx.beginPath(); ctx.arc(x, ry, rr + 1.8, 0, TAU); ctx.fill();
    ctx.fillStyle = css([255, 222, 138], 0.92);
    ctx.beginPath(); ctx.arc(x, ry, rr, 0, TAU); ctx.fill();

  } else {
    // === KIND 3: Grand 1900s Domed Pavilion ===
    const dw = hw * 0.78;
    const dg = ctx.createLinearGradient(x - dw, 0, x + dw, 0);
    dg.addColorStop(0, css(mix(slateShd, slateLit, lMix)));
    dg.addColorStop(0.5, css(slateCol));
    dg.addColorStop(1, css(mix(slateLit, slateShd, lMix)));
    ctx.fillStyle = dg;
    ctx.beginPath();
    ctx.moveTo(x - dw, shoulderY - 2);
    ctx.quadraticCurveTo(x - dw, topY + 2, x, topY);
    ctx.quadraticCurveTo(x + dw, topY + 2, x + dw, shoulderY - 2);
    ctx.closePath();
    ctx.fill();

    // Dome ribs & finial spire
    ctx.strokeStyle = css(mix(slateLit, rimC, 0.35), 0.65);
    ctx.lineWidth = 1.2;
    ctx.beginPath();
    ctx.moveTo(x - dw * 0.45, shoulderY - 2);
    ctx.quadraticCurveTo(x - dw * 0.42, topY + 4, x, topY);
    ctx.moveTo(x + dw * 0.45, shoulderY - 2);
    ctx.quadraticCurveTo(x + dw * 0.42, topY + 4, x, topY);
    ctx.moveTo(x, topY); ctx.lineTo(x, topY - 10);
    ctx.stroke();
  }

  // 5. Sunlit outer rim highlight matching collision polygon
  ctx.beginPath();
  polyPath(ctx, o.polys[0]);
  ctx.strokeStyle = css(rimC, 0.42);
  ctx.lineWidth = 1.4;
  ctx.lineJoin = 'round';
  ctx.stroke();

  ctx.restore();
}

const KITE_SCHEMES = [
  { a: [214, 72, 62], b: [248, 234, 202], tr: [242, 184, 78] },  // Vintage Crimson & Cream
  { a: [52, 88, 138], b: [246, 228, 188], tr: [218, 92, 68] },   // Prussian Blue & Parchment
  { a: [228, 164, 64], b: [138, 48, 58], tr: [250, 236, 204] },  // Amber Ochre & Burgundy
  { a: [54, 114, 88], b: [244, 232, 204], tr: [224, 148, 68] },  // Vintage Emerald & Ivory
  { a: [118, 64, 124], b: [248, 226, 184], tr: [236, 178, 74] }, // Royal Plum & Gold
  { a: [192, 96, 58], b: [56, 108, 118], tr: [248, 234, 198] },  // Terracotta & Teal
];

function drawKite(x, y, R, schemeIdx, kind, seed, lMix, depthFog, swayAngle, alphaMul) {
  const sc = KITE_SCHEMES[(schemeIdx || 0) % KITE_SCHEMES.length];
  const nightDim = 1 - pal.stars * 0.48;
  const fogTarget = mix(pal.fog, pal.far, depthFog * 0.45);
  const toneCol = (rgb) => {
    const lit = mix(rgb, obsFillC, 0.18 + 0.42 * pal.stars);
    const dayLit = [lit[0] * (0.72 + 0.28 * nightDim), lit[1] * (0.74 + 0.26 * nightDim), lit[2] * (0.78 + 0.22 * nightDim)];
    return mix(dayLit, fogTarget, depthFog);
  };
  const cA = toneCol(sc.a), cB = toneCol(sc.b), cTr = toneCol(sc.tr);
  const woodCol = toneCol([112, 74, 44]);
  const shdTint = mix(obsFillC, [10, 12, 26], 0.42);
  const litTint = mix(rimC, pal.sun, 0.32);

  ctx.save();
  ctx.translate(x, y);
  if (alphaMul < 0.999) ctx.globalAlpha = alphaMul;

  // 1. Taut kite flying line (tether string) angling down toward the 1900s rooftops
  if (R > 16) {
    ctx.strokeStyle = css(mix([220, 210, 195], fogTarget, depthFog), (0.32 - depthFog * 0.18) * alphaMul);
    ctx.lineWidth = Math.max(0.7, R * 0.022);
    ctx.beginPath();
    ctx.moveTo(0, R * 0.15);
    ctx.quadraticCurveTo(-R * 1.4, R * 2.2, -R * 3.1, R * 4.6);
    ctx.stroke();
  }

  // 2. Fluttering ribbon tail with 1900s fabric bow-ties (drawn in world-relative wave before body rotation)
  const tailAnchorX = Math.sin(swayAngle || 0) * (-R * 0.95);
  const tailAnchorY = Math.cos(swayAngle || 0) * (R * 0.95);
  const bows = R > 22 ? 6 : 4;
  const tailLen = R * 2.35;
  ctx.strokeStyle = css(mix([86, 68, 54], fogTarget, depthFog), 0.78 * alphaMul);
  ctx.lineWidth = Math.max(0.9, R * 0.032);
  ctx.beginPath();
  ctx.moveTo(tailAnchorX, tailAnchorY);
  for (let i = 1; i <= bows; i++) {
    const u = i / bows;
    const wave = Math.sin(time * 5.2 - u * 4.2 + seed) * R * (0.14 + 0.28 * u) + gust * R * 0.25 * u;
    const tx = tailAnchorX - u * R * 0.45 + wave;
    const ty = tailAnchorY + u * tailLen;
    ctx.lineTo(tx, ty);
  }
  ctx.stroke();

  // Ribbon bow-ties along the tail
  for (let i = 1; i <= bows; i++) {
    const u = i / bows;
    const wave = Math.sin(time * 5.2 - u * 4.2 + seed) * R * (0.14 + 0.28 * u) + gust * R * 0.25 * u;
    const tx = tailAnchorX - u * R * 0.45 + wave;
    const ty = tailAnchorY + u * tailLen;
    const bw = R * (0.19 - 0.06 * u), bh = R * (0.08 - 0.02 * u);
    const bAng = Math.cos(time * 5.2 - u * 4.2 + seed) * 0.35;
    ctx.save();
    ctx.translate(tx, ty);
    ctx.rotate(bAng);
    ctx.fillStyle = css(i % 2 === 0 ? cA : cTr);
    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.lineTo(-bw, -bh); ctx.lineTo(-bw * 0.82, bh);
    ctx.lineTo(0, 0);
    ctx.lineTo(bw, -bh); ctx.lineTo(bw * 0.82, bh);
    ctx.closePath();
    ctx.fill();
    ctx.restore();
  }

  // 3. Rotate kite frame by swayAngle
  ctx.rotate(swayAngle || 0);
  const kType = (kind || 0) % 3;

  if (kType === 0) {
    // === TYPE 0: Classic 1900s Diamond Malay / Eddy Kite ===
    const topY = -R * 1.02, midY = -R * 0.22, botY = R * 1.02, sideX = R * 0.86;
    const q0 = mix(cA, litTint, 0.22 * lMix);
    const q1 = mix(cB, litTint, 0.22 * (1 - lMix));
    const q2 = mix(cB, shdTint, 0.18 * (1 - lMix));
    const q3 = mix(cA, shdTint, 0.18 * lMix);

    // 4 harlequin fabric quadrants
    const fillQuad = (x1, y1, x2, y2, x3, y3, col) => {
      ctx.fillStyle = css(col);
      ctx.beginPath();
      ctx.moveTo(x1, y1); ctx.lineTo(x2, y2); ctx.lineTo(x3, y3);
      ctx.closePath();
      ctx.fill();
    };
    fillQuad(0, topY, -sideX, midY, 0, midY, q0);
    fillQuad(0, topY, sideX, midY, 0, midY, q1);
    fillQuad(0, midY, -sideX, midY, 0, botY, q2);
    fillQuad(0, midY, sideX, midY, 0, botY, q3);

    // Inner decorative diamond border
    ctx.strokeStyle = css(cTr, 0.85 * alphaMul);
    ctx.lineWidth = Math.max(1, R * 0.045);
    ctx.beginPath();
    ctx.moveTo(0, topY * 0.68);
    ctx.lineTo(-sideX * 0.68, midY);
    ctx.lineTo(0, botY * 0.68);
    ctx.lineTo(sideX * 0.68, midY);
    ctx.closePath();
    ctx.stroke();

    // Bowed wooden horizontal spar & vertical spine
    ctx.strokeStyle = css(woodCol);
    ctx.lineWidth = Math.max(1.1, R * 0.048);
    ctx.beginPath();
    ctx.moveTo(0, topY); ctx.lineTo(0, botY);
    ctx.moveTo(-sideX, midY);
    ctx.quadraticCurveTo(0, midY - R * 0.14, sideX, midY);
    ctx.stroke();

    // Outer taut perimeter hem & corner tassels
    ctx.strokeStyle = css(mix(rimC, cTr, 0.5), 0.72 * alphaMul);
    ctx.lineWidth = Math.max(1, R * 0.036);
    ctx.beginPath();
    ctx.moveTo(0, topY); ctx.lineTo(-sideX, midY); ctx.lineTo(0, botY); ctx.lineTo(sideX, midY); ctx.closePath();
    ctx.stroke();

    ctx.fillStyle = css(cTr);
    ctx.beginPath();
    ctx.arc(-sideX, midY, R * 0.06, 0, TAU);
    ctx.arc(sideX, midY, R * 0.06, 0, TAU);
    ctx.fill();

  } else if (kType === 1) {
    // === TYPE 1: 1900s Hargrave 3D Cellular Box Kite ===
    const cw = R * 0.68, ch = R * 0.36, dz = R * 0.16;
    const drawCell = (cy) => {
      // Back inner fabric walls (darker)
      ctx.fillStyle = css(mix(cB, shdTint, 0.35));
      ctx.beginPath();
      ctx.moveTo(-cw, cy - ch * 0.5);
      ctx.lineTo(0, cy - ch * 0.5 - dz);
      ctx.lineTo(cw, cy - ch * 0.5);
      ctx.lineTo(cw, cy + ch * 0.5);
      ctx.lineTo(0, cy + ch * 0.5 - dz);
      ctx.lineTo(-cw, cy + ch * 0.5);
      ctx.closePath();
      ctx.fill();

      // Front left & right 3D cellular fabric panels
      ctx.fillStyle = css(mix(cA, litTint, 0.25 * lMix));
      ctx.beginPath();
      ctx.moveTo(-cw, cy - ch * 0.5);
      ctx.lineTo(0, cy - ch * 0.5 + dz);
      ctx.lineTo(0, cy + ch * 0.5 + dz);
      ctx.lineTo(-cw, cy + ch * 0.5);
      ctx.closePath();
      ctx.fill();

      ctx.fillStyle = css(mix(cA, litTint, 0.25 * (1 - lMix)));
      ctx.beginPath();
      ctx.moveTo(0, cy - ch * 0.5 + dz);
      ctx.lineTo(cw, cy - ch * 0.5);
      ctx.lineTo(cw, cy + ch * 0.5);
      ctx.lineTo(0, cy + ch * 0.5 + dz);
      ctx.closePath();
      ctx.fill();

      // Trim stripe along front cell
      ctx.strokeStyle = css(cTr, 0.85 * alphaMul);
      ctx.lineWidth = Math.max(1, R * 0.038);
      ctx.beginPath();
      ctx.moveTo(-cw, cy); ctx.lineTo(0, cy + dz); ctx.lineTo(cw, cy);
      ctx.stroke();
    };

    // Wooden longeron struts connecting upper & lower cells
    ctx.strokeStyle = css(woodCol);
    ctx.lineWidth = Math.max(1.1, R * 0.045);
    ctx.beginPath();
    ctx.moveTo(-cw, -R * 0.78); ctx.lineTo(-cw, R * 0.78);
    ctx.moveTo(cw, -R * 0.78); ctx.lineTo(cw, R * 0.78);
    ctx.moveTo(0, -R * 0.78 + dz); ctx.lineTo(0, R * 0.78 + dz);
    ctx.moveTo(-cw, -R * 0.45); ctx.lineTo(cw, R * 0.45);
    ctx.moveTo(cw, -R * 0.45); ctx.lineTo(-cw, R * 0.45);
    ctx.stroke();

    drawCell(-R * 0.54);
    drawCell(R * 0.54);

  } else {
    // === TYPE 2: 1900s Hexagonal Sunburst Festival Kite ===
    const pts = [
      [0, -R * 0.98],
      [R * 0.78, -R * 0.42],
      [R * 0.66, R * 0.48],
      [0, R * 0.94],
      [-R * 0.66, R * 0.48],
      [-R * 0.78, -R * 0.42],
    ];
    for (let i = 0; i < 6; i++) {
      const p0 = pts[i], p1 = pts[(i + 1) % 6];
      ctx.fillStyle = css(i % 2 === 0 ? cA : cB);
      ctx.beginPath();
      ctx.moveTo(0, 0);
      ctx.lineTo(p0[0], p0[1]);
      ctx.lineTo(p1[0], p1[1]);
      ctx.closePath();
      ctx.fill();
    }
    // Center medallion & wooden radial spars
    ctx.strokeStyle = css(woodCol);
    ctx.lineWidth = Math.max(1, R * 0.04);
    ctx.beginPath();
    for (let i = 0; i < 3; i++) {
      ctx.moveTo(pts[i][0], pts[i][1]);
      ctx.lineTo(pts[i + 3][0], pts[i + 3][1]);
    }
    ctx.stroke();

    ctx.fillStyle = css(cTr);
    ctx.beginPath(); ctx.arc(0, 0, R * 0.22, 0, TAU); ctx.fill();

    ctx.strokeStyle = css(mix(rimC, cTr, 0.5), 0.75 * alphaMul);
    ctx.lineWidth = Math.max(1, R * 0.036);
    ctx.beginPath();
    ctx.moveTo(pts[0][0], pts[0][1]);
    for (let i = 1; i < 6; i++) ctx.lineTo(pts[i][0], pts[i][1]);
    ctx.closePath();
    ctx.stroke();
  }

  ctx.restore();
}

function drawBgKites(band, reflectAlpha = 0) {
  const kiteAlpha = cityK * (1 - stormAmt() * 0.65) * (1 - blizAmt() * 0.85);
  if (kiteAlpha < 0.02) return;
  const sunX = sun.a >= moon.a ? sun.x : moon.x;
  for (const k of bgKites) {
    if (k.band !== band) continue;
    const sx = k.wx - camX * k.par;
    if (sx < -k.R * 3 || sx > W + k.R * 3) continue;
    const lMix = sstep(clamp(0.5 + (sx - sunX) / 560, 0, 1));
    const sway = Math.sin(time * 2.2 + k.ph) * 0.14 + gust * 0.16;
    const a = kiteAlpha * (reflectAlpha > 0 ? reflectAlpha : 1);
    const fog = reflectAlpha > 0 ? Math.min(0.85, k.fog + 0.22) : k.fog;
    drawKite(sx, k.oy, k.R, k.scheme, k.kind, k.seed, lMix, fog, sway, a);
  }
}
