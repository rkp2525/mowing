(function () {
  const TAU = Math.PI * 2;
  window.STYLES.push({
    id: 'F',
    name: 'Paper Cut-Out Diorama',
    blurb: 'Everything is hand-cut craft paper and card stock stacked into a diorama: scissor-wobbled edges, crisp offset drop shadows between layers, paper grain, fold lines, stitched edges and brad-fastener joints, in warm mustard / terracotta / sage / teal / cream tones.',
    draw(g, MK) {
      let cnt = 0;
      const C = {
        mustard: '#dcaa45', mustardD: '#b98a2c', terra: '#c4694b', terraD: '#9c4b36', terraL: '#da8564', sage: '#93ab7d', sageD: '#6f8c5f',
        teal: '#3f8f8a', tealD: '#2c6a68', tealL: '#6bb3ac', cream: '#f2e6c8', creamD: '#dccfa8', coral: '#ec7f6a', brown: '#8a5a3b', brownD: '#6a4229',
        skin: '#f0c19a', skinD: '#d9a67c', g1: '#46763f', g2: '#6a9d51', g3: '#98c46b', g4: '#b7d98b', blue: '#5b9bc0', ink: '#4a3a30', grey: '#9a9a94'
      };
      const hx = (h) => [parseInt(h.slice(1, 3), 16), parseInt(h.slice(3, 5), 16), parseInt(h.slice(5, 7), 16)];
      const mix = (a, b, t) => { const A = hx(a), B = hx(b); return '#' + [0, 1, 2].map((i) => Math.round(A[i] + (B[i] - A[i]) * t).toString(16).padStart(2, '0')).join(''); };
      const lite = (a, t) => mix(a, '#ffffff', t), dark = (a, t) => mix(a, '#2a1a10', t);

      // paper grain pattern
      const pc = document.createElement('canvas'); pc.width = pc.height = 96;
      { const p = pc.getContext('2d'); const r = MK.rng(99);
        for (let i = 0; i < 380; i++) { p.fillStyle = r() > 0.5 ? 'rgba(255,250,230,.16)' : 'rgba(70,45,20,.10)'; p.fillRect(r() * 96, r() * 96, 1 + r() * 1.2, 1 + r() * 1.2); }
        p.lineWidth = 0.7; for (let i = 0; i < 70; i++) { const x = r() * 96, y = r() * 96, a = r() * TAU, l = 2 + r() * 5; p.strokeStyle = r() > 0.5 ? 'rgba(255,250,230,.2)' : 'rgba(80,55,30,.13)'; p.beginPath(); p.moveTo(x, y); p.lineTo(x + Math.cos(a) * l, y + Math.sin(a) * l); p.stroke(); } }
      const grain = g.createPattern(pc, 'repeat');

      // ---------- geometry helpers ----------
      const wob = (pts, amp) => {
        const r = MK.rng(++cnt * 131 + 7), out = [], n = pts.length;
        for (let i = 0; i < n; i++) {
          const a = pts[i], b = pts[(i + 1) % n], dx = b[0] - a[0], dy = b[1] - a[1], len = Math.hypot(dx, dy) || 1, k = Math.max(1, Math.round(len / 11));
          for (let j = 0; j < k; j++) { const t = j / k, jj = (r() - 0.5) * 2 * amp * (j ? 1 : 0.6); out.push([a[0] + dx * t - dy / len * jj, a[1] + dy * t + dx / len * jj]); }
        }
        return out;
      };
      const trace = (pts) => { g.beginPath(); g.moveTo(pts[0][0], pts[0][1]); for (let i = 1; i < pts.length; i++) g.lineTo(pts[i][0], pts[i][1]); g.closePath(); };
      const rectP = (x, y, w, h) => [[x, y], [x + w, y], [x + w, y + h], [x, y + h]];
      const ellP = (cx, cy, rx, ry, n, rot) => { n = n || 26; rot = rot || 0; const o = [], cr = Math.cos(rot), sr = Math.sin(rot); for (let i = 0; i < n; i++) { const a = i / n * TAU, x = Math.cos(a) * rx, y = Math.sin(a) * ry; o.push([cx + x * cr - y * sr, cy + x * sr + y * cr]); } return o; };
      const radP = (cx, cy, rx, ry, n, fn) => { const o = []; for (let i = 0; i < n; i++) { const a = i / n * TAU, f = fn(a); o.push([cx + Math.cos(a) * rx * f, cy + Math.sin(a) * ry * f]); } return o; };
      const scalP = (cx, cy, rx, ry, b, k, ph) => radP(cx, cy, rx, ry, b * 8, (a) => 1 + k * (Math.abs(Math.sin(b * a / 2 + (ph || 0))) - 0.64));
      const wavyP = (cx, cy, rx, ry, b, k, ph) => radP(cx, cy, rx, ry, 64, (a) => 1 + k * Math.sin(b * a + (ph || 0)));
      const capP = (x0, y0, x1, y1, w) => { const an = Math.atan2(y1 - y0, x1 - x0), o = [], r = w / 2; for (let k = 0; k <= 4; k++) { const a = an - Math.PI / 2 + k / 4 * Math.PI; o.push([x1 + Math.cos(a) * r, y1 + Math.sin(a) * r]); } for (let k = 0; k <= 4; k++) { const a = an + Math.PI / 2 + k / 4 * Math.PI; o.push([x0 + Math.cos(a) * r, y0 + Math.sin(a) * r]); } return o; };
      const rot = (pts, cx, cy, a) => pts.map((p) => { const x = p[0] - cx, y = p[1] - cy; return [cx + x * Math.cos(a) - y * Math.sin(a), cy + x * Math.sin(a) + y * Math.cos(a)]; });

      // a single cut-paper piece: offset hard shadow, flat fill, grain, bevel highlight, optional stitch
      function P(pts, fill, o) {
        o = o || {};
        pts = wob(pts, o.w === undefined ? 0.7 : o.w);
        const dx = o.dx === undefined ? 3 : o.dx, dy = o.dy === undefined ? 3 : o.dy;
        if (o.sh !== 0) { g.save(); g.translate(dx, dy); trace(pts); g.fillStyle = 'rgba(28,34,16,' + (o.sa || 0.3) + ')'; g.fill(); g.restore(); }
        trace(pts); g.fillStyle = fill; g.fill();
        g.save(); trace(pts); g.clip();
        if (!o.ng) { g.globalAlpha = o.ga || 1; g.fillStyle = grain; g.fillRect(-1000, -1000, 4000, 4000); g.globalAlpha = 1; }
        g.translate(0.9, 0.9); trace(pts); g.strokeStyle = 'rgba(255,255,255,.4)'; g.lineWidth = 1.3; g.stroke();
        g.restore();
        if (o.st) {
          let cx = 0, cy = 0; pts.forEach((p) => { cx += p[0]; cy += p[1]; }); cx /= pts.length; cy /= pts.length;
          let rr = 0; pts.forEach((p) => { rr += Math.hypot(p[0] - cx, p[1] - cy); }); rr /= pts.length;
          const f = Math.max(0.3, 1 - 3.6 / Math.max(rr, 5));
          g.save(); trace(pts.map((p) => [cx + (p[0] - cx) * f, cy + (p[1] - cy) * f])); g.setLineDash([2.6, 2.6]); g.lineWidth = 1; g.strokeStyle = o.stc || 'rgba(255,248,225,.7)'; g.stroke(); g.restore();
        }
        return pts;
      }
      const limb = (x0, y0, x1, y1, w, fill, o) => P(capP(x0, y0, x1, y1, w), fill, Object.assign({ w: 0.4, dx: 2, dy: 2.5 }, o || {}));
      const brad = (x, y, r) => { r = r || 2; g.fillStyle = 'rgba(30,25,15,.35)'; g.beginPath(); g.arc(x + 0.9, y + 1, r, 0, TAU); g.fill(); g.fillStyle = '#c7cacf'; g.beginPath(); g.arc(x, y, r, 0, TAU); g.fill(); g.strokeStyle = '#7d8189'; g.lineWidth = 0.7; g.stroke(); g.fillStyle = '#fff'; g.beginPath(); g.arc(x - r * 0.3, y - r * 0.3, r * 0.35, 0, TAU); g.fill(); };
      const gsh = (cx, cy, rx, ry, a) => { P(ellP(cx, cy, rx, ry, 30), 'rgba(18,48,22,' + (a || 0.34) + ')', { sh: 0, ng: true, w: 1 }); };
      const dash = (x0, y0, x1, y1, c, w) => { g.save(); g.setLineDash([3, 3]); g.strokeStyle = c || 'rgba(60,35,15,.4)'; g.lineWidth = w || 1; g.beginPath(); g.moveTo(x0, y0); g.lineTo(x1, y1); g.stroke(); g.restore(); };
      const line = (x0, y0, x1, y1, c, w) => { g.strokeStyle = c; g.lineWidth = w || 1; g.lineCap = 'round'; g.beginPath(); g.moveTo(x0, y0); g.lineTo(x1, y1); g.stroke(); };
      const dot = (x, y, r, c) => { g.fillStyle = c; g.beginPath(); g.arc(x, y, r, 0, TAU); g.fill(); };
      const label = (x, y, t) => { g.save(); g.font = '600 12px ui-rounded, "Trebuchet MS", sans-serif'; g.textAlign = 'center'; g.textBaseline = 'middle'; g.lineJoin = 'round'; g.lineWidth = 3.4; g.strokeStyle = 'rgba(25,40,20,.75)'; g.strokeText(t, x, y); g.fillStyle = '#fff'; g.fillText(t, x, y); g.restore(); };
      const at = (x, y, fn) => { g.save(); g.translate(x, y); fn(); g.restore(); };
      const leaf = (x, y, len, wid, an, fill) => P(ellP(0, 0, len / 2, wid / 2, 14).map((p) => [p[0] + len / 2, p[1]]).map((p) => { const c = Math.cos(an), s = Math.sin(an); return [x + p[0] * c - p[1] * s, y + p[0] * s + p[1] * c]; }), fill, { dx: 1.6, dy: 1.8, w: 0.3 });
      const petal = (cx, cy, an, len, wid, fill, o) => { const c = Math.cos(an), s = Math.sin(an); const pts = ellP(len / 2, 0, len / 2, wid / 2, 12).map((p) => [cx + p[0] * c - p[1] * s, cy + p[0] * s + p[1] * c]); return P(pts, fill, Object.assign({ dx: 1.5, dy: 1.7, w: 0.3 }, o || {})); };

      // ---------- KID ----------
      const SH = '#e9795f', PANT = C.teal, CAP = C.mustard;
      function cap(cx, cy, r, face) { // face: 0 camera, 1 east, 2 back
        const dome = []; for (let k = 0; k <= 12; k++) { const a = Math.PI + k / 12 * Math.PI; dome.push([cx + Math.cos(a) * r, cy + Math.sin(a) * r * 0.95]); }
        dome.push([cx + r, cy + 1.5]); dome.push([cx - r, cy + 1.5]);
        P(dome, CAP, { dx: 1.5, dy: 2, w: 0.3 });
        line(cx, cy - r * 0.95, cx, cy + 1, 'rgba(120,80,20,.35)', 0.8);
        if (face === 0) P(ellP(cx, cy + 2, r + 1.5, 3.6, 16), C.mustardD, { dx: 1.5, dy: 2, w: 0.3 });
        else if (face === 1) P(ellP(cx + r + 3, cy + 1.5, 6.5, 3, 14), C.mustardD, { dx: 1.5, dy: 2, w: 0.3 });
        else P(rectP(cx - r - 0.5, cy, r * 2 + 1, 3), C.mustardD, { dx: 1, dy: 1.5, w: 0.3 });
        dot(cx, cy - r * 0.98, 2, C.terra);
      }
      function kidFront(x, y) {
        gsh(x + 3, y + 1, 20, 7);
        limb(x - 6, y - 30, x - 6.5, y - 7, 9, PANT); limb(x + 6, y - 30, x + 6.5, y - 7, 9, PANT);
        P(ellP(x - 7, y - 3, 7.5, 4.2, 14), C.terraD, { dx: 1.5, dy: 2 }); P(ellP(x + 7, y - 3, 7.5, 4.2, 14), C.terraD, { dx: 1.5, dy: 2 });
        limb(x - 13, y - 53, x - 19, y - 33, 8, SH); limb(x + 13, y - 53, x + 19, y - 33, 8, SH);
        dot(x - 19, y - 30, 3.8, C.skin); dot(x + 19, y - 30, 3.8, C.skin);
        P([[x - 13, y - 57], [x + 13, y - 57], [x + 11, y - 27], [x - 11, y - 27]], SH, { st: 1 });
        P(rectP(x - 11, y - 31, 22, 4), lite(PANT, 0.0), { dx: 1, dy: 1.5, w: 0.3 }); // belt-ish hem
        brad(x - 12, y - 52, 1.9); brad(x + 12, y - 52, 1.9); brad(x - 6, y - 29, 1.7); brad(x + 6, y - 29, 1.7);
        P(rectP(x - 3, y - 59, 6, 4), C.skinD, { dx: 0, dy: 1, sa: 0.2 });
        P(ellP(x, y - 68, 13.5, 13, 24), C.skin);
        dot(x - 5, y - 66, 1.7, C.ink); dot(x + 5, y - 66, 1.7, C.ink);
        dot(x - 8, y - 62, 2.2, 'rgba(236,127,106,.6)'); dot(x + 8, y - 62, 2.2, 'rgba(236,127,106,.6)');
        g.strokeStyle = C.ink; g.lineWidth = 1.1; g.lineCap = 'round'; g.beginPath(); g.arc(x, y - 63.5, 3.5, 0.15 * Math.PI, 0.85 * Math.PI); g.stroke();
        cap(x, y - 71, 13.5, 0);
      }
      function kidSideBody(x, y, lean, pantsSwing) {
        gsh(x + 3, y + 1, 21, 7);
        limb(x - 2, y - 30, x - 2 - pantsSwing, y - 7, 9, dark(PANT, 0.15)); P(ellP(x - 1 - pantsSwing + 3, y - 3, 8, 4, 14), C.terraD, { dx: 1.5, dy: 2 });
        limb(x + 2, y - 30, x + 2 + pantsSwing, y - 7, 9, PANT); P(ellP(x + 3 + pantsSwing + 3, y - 3, 8, 4, 14), C.terraD, { dx: 1.5, dy: 2 });
      }
      function kidSideTop(x, y, lean) {
        P([[x - 9 + lean, y - 57], [x + 9 + lean, y - 57], [x + 8, y - 27], [x - 8, y - 27]], SH, { st: 1 });
        brad(x + lean, y - 52, 1.9);
        P(ellP(x + 2 + lean, y - 68, 12.5, 13, 24), C.skin);
        dot(x + 8 + lean, y - 67, 1.7, C.ink); dot(x + 10.5 + lean, y - 62, 2, 'rgba(236,127,106,.6)');
        g.strokeStyle = C.ink; g.lineWidth = 1; g.beginPath(); g.arc(x + 8 + lean, y - 63, 2.6, 0.25 * Math.PI, 0.8 * Math.PI); g.stroke();
        P(ellP(x - 7 + lean, y - 64, 4.6, 6, 10), C.brownD, { dx: 1, dy: 1.5, w: 0.3 }); // hair at back
        cap(x + 2 + lean, y - 71, 13, 1);
      }
      function kidScythe(x, y) {
        kidSideBody(x, y, 3, 6);
        // far arm
        limb(x + 4, y - 52, x + 14, y - 40, 7, dark(SH, 0.2)); dot(x + 15, y - 39, 3.4, C.skinD);
        kidSideTop(x, y, 3);
        // snath
        limb(x - 12, y - 64, x + 38, y - 8, 3.4, C.brown, { dx: 2, dy: 3 });
        dash(x - 11, y - 62, x + 36, y - 10, 'rgba(255,230,190,.5)', 0.8);
        // blade
        const bl = [[x + 34, y - 12], [x + 52, y - 15], [x + 72, y - 9], [x + 82, y - 1], [x + 66, y - 4], [x + 48, y - 6], [x + 36, y - 3]];
        P(bl, '#cfd8da', { dx: 2.5, dy: 3 }); line(x + 40, y - 9, x + 76, y - 3, 'rgba(255,255,255,.7)', 1);
        // near arm over handle
        limb(x + 4, y - 53, x + 18, y - 38, 7.5, SH); dot(x + 19, y - 37, 3.6, C.skin);
        brad(x + 4, y - 52, 1.8);
      }
      function swoosh(x, y) {
        const cx = x + 4, cy = y - 30, pts = [], N = 22;
        for (let k = 0; k <= N; k++) { const t = k / N, a = (-55 + t * 95) * Math.PI / 180, th = Math.sin(t * Math.PI) * 9; pts.push([cx + Math.cos(a) * (78 + th), cy + Math.sin(a) * (66 + th * 0.85)]); }
        for (let k = N; k >= 0; k--) { const t = k / N, a = (-55 + t * 95) * Math.PI / 180, th = Math.sin(t * Math.PI) * 9; pts.push([cx + Math.cos(a) * (78 - th), cy + Math.sin(a) * (66 - th * 0.85)]); }
        P(pts, 'rgba(255,252,238,.62)', { sa: 0.13, dx: 2, dy: 3, ng: true, w: 0.5, st: 0 });
        g.save(); g.setLineDash([3, 3]); g.strokeStyle = 'rgba(255,255,255,.9)'; g.lineWidth = 1; g.beginPath(); for (let k = 0; k <= N; k++) { const t = k / N, a = (-55 + t * 95) * Math.PI / 180; const px = cx + Math.cos(a) * 78, py = cy + Math.sin(a) * 66; k ? g.lineTo(px, py) : g.moveTo(px, py); } g.stroke(); g.restore();
        // flying cut grass
        [[x + 62, y - 26, 0.5], [x + 78, y - 16, -0.6], [x + 70, y - 38, 1.1], [x + 56, y - 14, 0.2], [x + 84, y - 30, -0.2]].forEach((b, i) => petal(b[0], b[1], b[2], 8, 2.6, i % 2 ? C.g3 : C.g2, { dx: 1, dy: 1.5 }));
      }
      function kidBack(x, y) { // facing north, seen from behind
        gsh(x + 3, y + 1, 20, 7);
        limb(x - 6, y - 30, x - 6.5, y - 7, 9, PANT); limb(x + 6, y - 30, x + 6.5, y - 7, 9, PANT);
        P(ellP(x - 7, y - 3, 7.5, 4.2, 14), C.terraD, { dx: 1.5, dy: 2 }); P(ellP(x + 7, y - 3, 7.5, 4.2, 14), C.terraD, { dx: 1.5, dy: 2 });
        P([[x - 13, y - 57], [x + 13, y - 57], [x + 11, y - 27], [x - 11, y - 27]], SH, { st: 1 });
        dash(x, y - 55, x, y - 30, 'rgba(120,40,25,.35)', 0.9);
        limb(x - 13, y - 53, x - 14, y - 43, 8, SH); limb(x + 13, y - 53, x + 14, y - 43, 8, SH);
        brad(x - 12, y - 52, 1.9); brad(x + 12, y - 52, 1.9);
        P(ellP(x, y - 68, 13.5, 13, 24), C.brownD); // back of head = hair
        P(rectP(x - 12, y - 70, 24, 4), C.brownD, { sh: 0, w: 0.3 });
        P(ellP(x - 13, y - 66, 2.6, 3.4, 8), C.skin, { dx: 1, dy: 1.2 }); P(ellP(x + 13, y - 66, 2.6, 3.4, 8), C.skin, { dx: 1, dy: 1.2 });
        cap(x, y - 72, 13.5, 2);
      }

      // ---------- MOWERS ----------
      function gasMower(cx, cy) { // facing north, cx,cy = deck centre
        gsh(cx + 3, cy + 30, 30, 9);
        P(rectP(cx - 30, cy + 8, 9, 22), C.tealD, { dx: 2, dy: 3 }); P(rectP(cx + 21, cy + 8, 9, 22), C.tealD, { dx: 2, dy: 3 });
        P(rectP(cx - 29, cy - 24, 8, 17), C.tealD, { dx: 2, dy: 3 }); P(rectP(cx + 21, cy - 24, 8, 17), C.tealD, { dx: 2, dy: 3 });
        dot(cx - 25.5, cy + 19, 2.2, C.cream); dot(cx + 25.5, cy + 19, 2.2, C.cream);
        P([[cx - 22, cy - 28], [cx + 22, cy - 28], [cx + 24, cy + 20], [cx - 24, cy + 20]], C.terra, { st: 1 });
        P([[cx - 24, cy + 20], [cx + 24, cy + 20], [cx + 25, cy + 31], [cx - 25, cy + 31]], C.terraD, { dx: 2, dy: 3 });
        dash(cx, cy - 27, cx, cy - 12, 'rgba(255,240,210,.5)', 0.9);
        P([[cx + 22, cy - 6], [cx + 36, cy - 12], [cx + 36, cy + 8], [cx + 22, cy + 10]], C.sage, { dx: 2, dy: 2.5 }); // chute flap
        line(cx + 24, cy - 2, cx + 35, cy - 5, 'rgba(60,90,50,.5)', 0.9);
        P(ellP(cx, cy - 4, 13, 12, 22), C.cream, { dx: 2, dy: 3 });
        P(ellP(cx, cy - 4, 7, 6.5, 16), C.mustard, { dx: 1.2, dy: 1.8, w: 0.3 });
        brad(cx, cy - 4, 2);
        P(rectP(cx - 8, cy + 8, 16, 7), C.cream, { dx: 1.5, dy: 2, w: 0.3 }); // rear flap
      }
      function pushHandle(cx, cy, hy) {
        limb(cx - 14, cy + 28, cx - 14, hy, 3.4, C.mustard, { dx: 2, dy: 2.5 }); limb(cx + 14, cy + 28, cx + 14, hy, 3.4, C.mustard, { dx: 2, dy: 2.5 });
        limb(cx - 17, hy, cx + 17, hy, 4.4, C.cream, { dx: 2, dy: 2.5 }); dot(cx - 14, hy, 3.6, C.skin); dot(cx + 14, hy, 3.6, C.skin);
      }
      function reel(x, y) {
        gsh(x + 2, y + 2, 38, 9);
        // handle
        limb(x - 10, y - 20, x - 40, y - 66, 3.4, C.mustard, { dx: 2, dy: 3 }); limb(x - 2, y - 28, x - 33, y - 69, 3.4, C.mustard, { dx: 2, dy: 3 });
        limb(x - 43, y - 63, x - 29, y - 72, 5, C.cream, { dx: 2, dy: 3 });
        // far wheel
        P(ellP(x - 8, y - 36, 12, 13, 20), C.tealD, { dx: 2, dy: 2.5 }); dot(x - 8, y - 36, 4.5, C.creamD);
        // far plate
        P(rectP(x - 10, y - 38, 42, 5), C.teal, { dx: 1.5, dy: 2.5 });
        // reel cylinder
        P(ellP(x + 24, y - 21, 11, 21, 22), C.cream, { dx: 2.5, dy: 3 });
        for (let i = -3; i <= 3; i++) { const yy = y - 21 + i * 5.5; petal(x + 24 - 6 + Math.abs(i) * 0.4, yy, 0.5, 14, 2.7, i % 2 ? C.mustard : C.terra, { dx: 1, dy: 1.3, w: 0.2 }); }
        brad(x + 24, y - 21, 2);
        // body bar & near plate
        P(rectP(x - 14, y - 18, 40, 9), C.terra, { dx: 2, dy: 3 });
        dash(x - 12, y - 13.5, x + 24, y - 13.5, 'rgba(255,240,210,.55)', 0.9);
        P(ellP(x - 8, y - 12, 14, 15, 22), C.teal, { dx: 2.5, dy: 3 });
        P(ellP(x - 8, y - 12, 9, 10, 18), C.tealL, { dx: 0, dy: 0, sh: 0 });
        P(ellP(x - 8, y - 12, 4.5, 5, 12), C.mustard, { sh: 0 }); brad(x - 8, y - 12, 1.8);
        for (let k = 0; k < 6; k++) { const a = k / 6 * TAU; line(x - 8 + Math.cos(a) * 5.5, y - 12 + Math.sin(a) * 6, x - 8 + Math.cos(a) * 9, y - 12 + Math.sin(a) * 9.5, 'rgba(255,255,255,.5)', 0.9); }
        P(ellP(x + 28, y - 4, 7, 6, 14), C.teal, { dx: 2, dy: 2.5 }); dot(x + 28, y - 4, 2, C.cream); // front caster
      }
      function ride(x, y) {
        gsh(x + 4, y + 3, 56, 11);
        // cutting deck
        P([[x + 6, y - 12], [x + 52, y - 12], [x + 54, y - 3], [x + 4, y - 3]], C.sage, { dx: 2, dy: 3, st: 1 });
        // front wheel
        P(ellP(x + 36, y - 11, 11, 11, 20), C.tealD, { dx: 2, dy: 3 }); P(ellP(x + 36, y - 11, 5, 5, 12), C.cream, { sh: 0 }); brad(x + 36, y - 11, 1.6);
        // body
        P([[x - 46, y - 32], [x + 2, y - 32], [x + 2, y - 36], [x + 48, y - 36], [x + 51, y - 14], [x - 46, y - 14]], C.terra, { st: 1 });
        P([[x + 2, y - 44], [x + 46, y - 44], [x + 48, y - 36], [x + 2, y - 36]], C.terraL, { dx: 2, dy: 2.5, w: 0.4 });
        dash(x + 6, y - 40, x + 44, y - 40, 'rgba(255,240,210,.5)', 0.8);
        P(rectP(x + 44, y - 33, 6, 8), C.cream, { dx: 1, dy: 1.5, w: 0.3 }); // headlight
        P(rectP(x - 46, y - 18, 96, 4), C.terraD, { sh: 0, w: 0.3 });
        // rear wheel
        P(ellP(x - 26, y - 16, 17, 17, 24), C.tealD, { dx: 2.5, dy: 3 }); P(ellP(x - 26, y - 16, 10, 10, 18), C.teal, { sh: 0 }); P(ellP(x - 26, y - 16, 4.5, 4.5, 12), C.mustard, { sh: 0 }); brad(x - 26, y - 16, 1.8);
        for (let k = 0; k < 8; k++) { const a = k / 8 * TAU; line(x - 26 + Math.cos(a) * 11.5, y - 16 + Math.sin(a) * 11.5, x - 26 + Math.cos(a) * 15, y - 16 + Math.sin(a) * 15, 'rgba(255,255,255,.3)', 1.2); }
        // seat
        P(rectP(x - 38, y - 40, 22, 8), C.cream, { dx: 1.5, dy: 2.5 });
        // kid seated
        limb(x - 20, y - 38, x - 2, y - 36, 9, PANT); limb(x - 2, y - 36, x, y - 20, 8, PANT);
        P(ellP(x + 5, y - 17, 8, 4, 14), C.terraD, { dx: 1.5, dy: 2 });
        P([[x - 30, y - 64], [x - 14, y - 64], [x - 15, y - 36], [x - 29, y - 36]], SH, { st: 1 });
        // steering
        limb(x + 4, y - 44, x - 2, y - 62, 3, C.mustard, { dx: 1.5, dy: 2 });
        P(ellP(x - 4, y - 63, 10, 4.2, 18), C.cream, { dx: 1.5, dy: 2.5 }); P(ellP(x - 4, y - 63, 5.5, 1.8, 12), C.mustard, { sh: 0 });
        limb(x - 17, y - 59, x - 6, y - 62, 6.5, SH); dot(x - 5, y - 62, 3, C.skin); brad(x - 17, y - 59, 1.6);
        P(ellP(x - 21, y - 76, 11.5, 12, 22), C.skin);
        dot(x - 14, y - 75, 1.6, C.ink); dot(x - 11.5, y - 71, 1.9, 'rgba(236,127,106,.6)');
        cap(x - 21, y - 79, 12, 1);
      }

      // ---------- NATURE ----------
      function tree(x, y, o) {
        const rx = o.rx, ry = o.ry, cy = -o.h;
        gsh(x + 14, y + 3, rx * 0.62, o.sh, 0.3);
        at(x, y, () => {
          // trunk (folded card: two tones)
          const tw = o.tw;
          P([[-tw * 1.6, 0], [-tw, -o.h * 0.45], [-tw * 0.8, -o.h * 0.9], [tw * 0.8, -o.h * 0.9], [tw, -o.h * 0.45], [tw * 1.6, 0]], C.brown, { dx: 3, dy: 3 });
          g.save(); g.beginPath(); g.moveTo(0, 0); g.lineTo(tw * 1.6, 0); g.lineTo(tw, -o.h * 0.45); g.lineTo(tw * 0.8, -o.h * 0.9); g.lineTo(0, -o.h * 0.9); g.closePath(); g.fillStyle = 'rgba(60,30,10,.28)'; g.fill(); g.restore();
          dash(0, -4, 0, -o.h * 0.88, 'rgba(255,225,180,.45)', 0.9);
          if (o.big) { P([[tw * 0.6, -o.h * 0.5], [tw * 3, -o.h * 0.78], [tw * 3.4, -o.h * 0.74], [tw * 1, -o.h * 0.38]], C.brownD, { dx: 2, dy: 3 }); P([[-tw * 0.6, -o.h * 0.5], [-tw * 3, -o.h * 0.74], [-tw * 3.4, -o.h * 0.7], [-tw * 1, -o.h * 0.38]], C.brown, { dx: 2, dy: 3 }); }
          // canopy layers
          const cols = o.cols;
          o.layers.forEach((L, i) => {
            const pts = P(scalP(L[0], cy + L[1], L[2], L[3], L[4], 0.13, L[5] || 0), cols[i], { dx: 3.2, dy: 3.5, sa: 0.32, st: i % 2 === 1 });
            if (i > 0) { // inner paper cut-out hole punches
              const r = MK.rng(i * 17 + (o.big ? 5 : 1));
              for (let k = 0; k < (o.big ? 9 : 5); k++) { const a = r() * TAU, d = r() * 0.55; dot(L[0] + Math.cos(a) * L[2] * d, cy + L[1] + Math.sin(a) * L[3] * d, 2 + r() * 1.6, lite(cols[i], 0.22)); }
            }
          });
          if (o.fruit) { const r = MK.rng(8); for (let k = 0; k < 7; k++) { const a = r() * TAU, d = 0.3 + r() * 0.5; const fx = Math.cos(a) * rx * d, fy = cy - 6 + Math.sin(a) * ry * d; dot(fx + 1, fy + 1.2, 3.2, 'rgba(28,34,16,.3)'); dot(fx, fy, 3.2, C.coral); dot(fx - 1, fy - 1, 1, '#fff'); } }
        });
      }
      function rock(x, y) {
        gsh(x + 5, y + 2, 29, 8);
        at(x, y, () => {
          P([[-24, 1], [-21, -13], [-9, -25], [10, -27], [22, -17], [26, -2], [9, 4], [-14, 4]], '#8e908c', { dx: 3, dy: 3.5 });
          P([[-21, -13], [-9, -25], [10, -27], [22, -17], [4, -11]], '#c9c6ba', { dx: 1.5, dy: 2, w: 0.5 });
          P([[-21, -13], [4, -11], [-6, 2], [-14, 4], [-24, 1]], '#a9aaa3', { dx: 1.5, dy: 2, w: 0.5 });
          P([[22, -17], [26, -2], [9, 4], [-6, 2], [4, -11]], '#797c7a', { dx: 1.5, dy: 2, w: 0.5 });
          dash(-21, -13, 4, -11, 'rgba(255,255,255,.4)', 0.8); dash(4, -11, 22, -17, 'rgba(255,255,255,.3)', 0.8);
          // paper-grass tufts
          [[-26, 4, -0.3, 16, C.g2], [-19, 6, 0.1, 14, C.g3], [-12, 6, -0.15, 11, C.g1], [14, 6, 0.2, 13, C.g1], [20, 5, -0.1, 17, C.g3], [27, 3, 0.35, 12, C.g2], [5, 7, 0, 10, C.g3]].forEach((b) => {
            P([[b[0] - 2.4, b[1]], [b[0] + b[2] * b[3], b[1] - b[3]], [b[0] + 2.4, b[1]]], b[4], { dx: 1, dy: 1.5, w: 0.2 });
          });
        });
      }
      function daisy(cx, cy, r) { for (let i = 0; i < 10; i++) petal(cx, cy, i / 10 * TAU, r, r * 0.42, i % 2 ? '#fbf4de' : '#f5ecd2'); P(ellP(cx, cy, r * 0.34, r * 0.34, 14), C.mustard, { dx: 1, dy: 1.3 }); brad(cx, cy, r * 0.12 + 0.8); }
      function poppy(cx, cy, r) { for (let i = 0; i < 4; i++) { const a = Math.PI / 4 + i * Math.PI / 2; P(ellP(cx + Math.cos(a) * r * 0.42, cy + Math.sin(a) * r * 0.42, r * 0.62, r * 0.58, 16), i % 2 ? '#d9503c' : '#e2644c', { dx: 1.6, dy: 1.8, w: 0.4 }); } P(ellP(cx, cy, r * 0.3, r * 0.3, 12), C.ink, { dx: 1, dy: 1.3 }); brad(cx, cy, 1.5); }
      function tulip(cx, cy, r) { P([[cx - r * 0.7, cy - r * 0.9], [cx - r * 0.3, cy - r * 0.3], [cx, cy - r * 1.1], [cx + r * 0.3, cy - r * 0.3], [cx + r * 0.7, cy - r * 0.9], [cx + r * 0.8, cy + r * 0.4], [cx, cy + r * 0.9], [cx - r * 0.8, cy + r * 0.4]], '#e8837a', { dx: 1.6, dy: 2, w: 0.4 }); P([[cx - r * 0.2, cy - r * 1.0], [cx + r * 0.5, cy - r * 0.6], [cx + r * 0.6, cy + r * 0.5], [cx, cy + r * 0.9], [cx - r * 0.35, cy + r * 0.4]], '#f2a093', { dx: 1.2, dy: 1.5, w: 0.3 }); dash(cx, cy - r * 0.2, cx, cy + r * 0.8, 'rgba(120,40,30,.35)', 0.8); }
      function aster(cx, cy, r) { for (let i = 0; i < 16; i++) petal(cx, cy, i / 16 * TAU, r, r * 0.26, '#9c80ba', { dx: 1.2, dy: 1.4 }); for (let i = 0; i < 12; i++) petal(cx, cy, i / 12 * TAU + 0.2, r * 0.78, r * 0.26, '#b79fd0', { dx: 1, dy: 1.2 }); P(ellP(cx, cy, r * 0.3, r * 0.3, 12), C.mustard, { dx: 1, dy: 1.2 }); brad(cx, cy, 1.4); }
      function sunflower(cx, cy, r) { for (let i = 0; i < 14; i++) { const a = i / 14 * TAU; P([[cx + Math.cos(a - 0.2) * r * 0.4, cy + Math.sin(a - 0.2) * r * 0.4], [cx + Math.cos(a) * r * 1.08, cy + Math.sin(a) * r * 1.08], [cx + Math.cos(a + 0.2) * r * 0.4, cy + Math.sin(a + 0.2) * r * 0.4]], '#d9a02f', { dx: 1.5, dy: 1.7, w: 0.3 }); } for (let i = 0; i < 14; i++) { const a = (i + 0.5) / 14 * TAU; P([[cx + Math.cos(a - 0.2) * r * 0.4, cy + Math.sin(a - 0.2) * r * 0.4], [cx + Math.cos(a) * r * 0.92, cy + Math.sin(a) * r * 0.92], [cx + Math.cos(a + 0.2) * r * 0.4, cy + Math.sin(a + 0.2) * r * 0.4]], '#f0c34b', { dx: 1, dy: 1.3, w: 0.3, sa: 0.2 }); } P(ellP(cx, cy, r * 0.5, r * 0.5, 18), '#6b4630', { dx: 1.5, dy: 1.8 }); const rr = MK.rng(4); for (let k = 0; k < 14; k++) { const a = k * 2.4, d = Math.sqrt(k / 14) * r * 0.42; dot(cx + Math.cos(a) * d, cy + Math.sin(a) * d, 1, '#9b6c47'); } }
      function patch(px, py, kind) {
        gsh(px + 3, py + 1, 25, 7);
        at(px, py, () => {
          const heads = kind === 3 ? [[0, -60]] : [[-11, -34], [10, -28], [1, -45]];
          const stemC = C.g1;
          heads.forEach((h) => { limb(h[0] * 0.2, -2, h[0], h[1] + 4, kind === 3 ? 4 : 2.8, stemC, { dx: 1.5, dy: 2 }); });
          if (kind === 3) { leaf(2, -30, 22, 11, -0.5, C.g2); leaf(-2, -22, 22, 11, Math.PI + 0.5, C.g3); leaf(-4, -42, 16, 8, Math.PI + 0.3, C.g2); }
          [[-24, 0, 24, 8, -0.7, C.g2], [-4, 1, 22, 8, -1.45, C.g3], [4, 1, 22, 8, -1.7, C.g1], [26, 0, 24, 8, -2.35 + 0.0, C.g2], [-14, 2, 20, 7, -0.25, C.g3], [18, 2, 20, 7, Math.PI + 0.25, C.g3]].forEach((l) => { if (kind === 3 && (l[4] === -0.25)) return; leaf(l[0], l[1], l[2], l[3], l[4] === -2.35 ? -Math.PI + 0.7 : l[4], l[5]); });
          if (kind === 0) { daisy(-11, -34, 12); daisy(10, -28, 11); daisy(1, -45, 12.5); }
          if (kind === 1) { poppy(-11, -34, 13); tulip(10, -27, 10); poppy(2, -45, 12); }
          if (kind === 2) { aster(-11, -33, 12); aster(10, -27, 11); aster(1, -45, 12.5); }
          if (kind === 3) { sunflower(0, -60, 19); }
        });
      }
      function gnome(x, y) {
        gsh(x + 3, y + 1, 17, 6);
        at(x, y, () => {
          P(ellP(-6, -2, 6.5, 3.8, 12), C.brownD, { dx: 1.5, dy: 2 }); P(ellP(6, -2, 6.5, 3.8, 12), C.brownD, { dx: 1.5, dy: 2 });
          P([[-11, -6], [11, -6], [9, -24], [-9, -24]], C.teal, { st: 1 });
          limb(-10, -22, -14, -14, 5.5, C.tealD, { dx: 1.5, dy: 2 }); limb(10, -22, 14, -14, 5.5, C.tealD, { dx: 1.5, dy: 2 }); dot(-14, -12.5, 2.7, C.skin); dot(14, -12.5, 2.7, C.skin);
          P(rectP(-11, -13, 22, 3.5), C.brownD, { sh: 0, w: 0.2 }); P(rectP(-3, -14, 6, 5.5), C.mustard, { dx: 0.8, dy: 1, w: 0.2 });
          P([[-9, -22], [9, -22], [6, -9], [0, -2], [-6, -9]], C.cream, { dx: 1.5, dy: 2, w: 0.4 }); // beard
          P(ellP(0, -28, 8, 7, 16), C.skin, { dx: 1.5, dy: 2 });
          P(ellP(0, -26, 3, 3.6, 10), '#e39a82', { sh: 0 });
          dot(-3.5, -30, 1.1, C.ink); dot(3.5, -30, 1.1, C.ink);
          P([[-9, -26], [-1, -26], [0, -22], [-6, -20]], C.cream, { dx: 1, dy: 1.5, w: 0.3 }); P([[9, -26], [1, -26], [0, -22], [6, -20]], lite(C.cream, 0.2), { dx: 1, dy: 1.5, w: 0.3 });
          P(ellP(0, -24.5, 3.3, 3.3, 10), '#e08c74', { dx: 0.8, dy: 1.2 });
          P([[-10, -31], [10, -31], [3, -43], [0, -49], [-3, -43]].map((p, i) => i === 3 ? [p[0] + 3, p[1]] : p), C.coral, { st: 1, dx: 2, dy: 3 });
          dash(-1, -47, 3, -33, 'rgba(120,35,25,.35)', 0.9);
        });
      }
      function ball(x, y) { gsh(x + 3, y + 1, 11, 4.5); at(x, y, () => { P(ellP(0, -9, 10, 10, 20), C.coral, { dx: 2, dy: 2.5 }); P([[-9, -12], [9, -12], [8, -6], [-8, -6]].map((p) => p), C.cream, { sh: 0, w: 0.3, ga: 1 }); g.save(); g.beginPath(); g.arc(0, -9, 10, 0, TAU); g.clip(); P(rectP(-12, -13, 24, 7), C.cream, { sh: 0, w: 0.2 }); g.restore(); g.save(); g.setLineDash([2, 2]); g.strokeStyle = 'rgba(120,40,30,.45)'; g.lineWidth = 0.8; g.beginPath(); g.arc(0, -9, 7.5, 0, TAU); g.stroke(); g.restore(); dot(-3.5, -13, 1.6, 'rgba(255,255,255,.6)'); }); }
      function frisbee(x, y) { gsh(x + 3, y + 1, 15, 5.5); at(x, y, () => { P(ellP(0, -4, 14, 7, 24), C.teal, { dx: 2, dy: 3 }); P(ellP(0, -5, 9.5, 4.6, 20), C.tealL, { dx: 0, dy: 1, sa: 0.2 }); P(ellP(0, -5.5, 4.5, 2.2, 14), C.cream, { sh: 0 }); }); }
      function stick(x, y) { gsh(x + 3, y + 1, 18, 4.5); at(x, y, () => { limb(-18, -3, 18, -6, 4.4, C.brown, { dx: 2, dy: 2.5 }); limb(2, -4.5, 9, -13, 2.6, C.brown, { dx: 1.5, dy: 2 }); limb(-8, -4, -13, 0, 2.4, C.brownD, { dx: 1, dy: 1.5 }); dash(-15, -3.5, 14, -5.8, 'rgba(255,225,180,.5)', 0.8); }); }

      // ---------- STRUCTURES ----------
      function fence(x0, y) {
        gsh(x0 + 98, y + 3, 100, 6, 0.28);
        const n = 4, w = 48;
        // rails
        [-30, -14].forEach((ry) => P(rectP(x0, y + ry - 3, n * w + 2, 5.5), C.brownD, { dx: 2, dy: 3 }));
        for (let i = 0; i < n; i++) for (let k = 0; k < 3; k++) {
          const px = x0 + i * w + 7 + k * 14, h = 44 + ((i * 3 + k) % 3 === 1 ? 2 : 0);
          P([[px, y], [px + 11, y], [px + 11, y - h + 6], [px + 5.5, y - h], [px, y - h + 6]], C.cream, { dx: 2.5, dy: 3, sa: 0.3 });
          g.save(); g.beginPath(); g.moveTo(px + 5.5, y); g.lineTo(px + 11, y); g.lineTo(px + 11, y - h + 6); g.lineTo(px + 5.5, y - h); g.closePath(); g.fillStyle = 'rgba(150,110,60,.2)'; g.fill(); g.restore();
          dot(px + 5.5, y - 30, 1.1, '#a79a82'); dot(px + 5.5, y - 14, 1.1, '#a79a82');
        }
        for (let i = 0; i <= n; i++) { const px = x0 + i * w - 4; P([[px, y + 3], [px + 9, y + 3], [px + 9, y - 52], [px + 4.5, y - 56], [px, y - 52]], i % 2 ? C.terraL : C.terra, { dx: 2.5, dy: 3 }); brad(px + 4.5, y - 44, 1.5); dash(px + 4.5, y - 50, px + 4.5, y, 'rgba(255,230,200,.4)', 0.8); }
      }
      function hedge(x0, y) {
        const w = 192;
        gsh(x0 + w / 2 + 4, y + 2, w / 2 + 6, 7, 0.32);
        const top = (yt, amp, per, off) => { const p = [[x0 - 3, y - 4]]; for (let xx = -3; xx <= w + 3; xx += 2) p.push([x0 + xx, yt - amp * Math.abs(Math.sin(Math.PI * (xx + off) / per))]); p.push([x0 + w + 3, y - 4]); return p; };
        P(top(y - 42, 9, 24, 0), '#3b6a37', { dx: 3, dy: 3.5, w: 0.5 });
        P(top(y - 31, 9, 24, 12), '#5b9048', { dx: 3, dy: 3.5, w: 0.5, st: 0 });
        P(top(y - 19, 8, 24, 0), '#82b65d', { dx: 3, dy: 3.5, w: 0.5 });
        P(rectP(x0 - 3, y - 6, w + 6, 8), C.g1, { dx: 2, dy: 3, w: 0.5 });
        const r = MK.rng(21);
        for (let i = 0; i < 26; i++) { const lx = x0 + 6 + r() * (w - 12), ly = y - 14 - r() * 36; const a = (r() - 0.5) * 1.2 - 1.57; petal(lx, ly, a, 7 + r() * 3, 3.4, r() > 0.5 ? '#a3cf78' : '#4a7d3f', { dx: 1, dy: 1.3, w: 0.2, sa: 0.3 }); }
        for (let i = 1; i < 4; i++) dash(x0 + i * 48, y - 34, x0 + i * 48, y - 4, 'rgba(20,60,25,.28)', 0.9);
        for (let i = 0; i < 6; i++) dot(x0 + 14 + i * 32 + (i % 2) * 6, y - 22 + (i % 3) * 4, 2, C.coral);
      }
      function house(x0, y) {
        const w = 144, wt = y - 58;
        gsh(x0 + w / 2 + 5, y + 4, w / 2 + 8, 8, 0.3);
        P(rectP(x0, wt, w, 58), C.cream, { dx: 3, dy: 3.5, sa: 0.32 });
        P(rectP(x0, y - 10, w, 10), '#c9a982', { dx: 0, dy: 0, sh: 0, w: 0.4 });
        for (let i = 1; i < 3; i++) dash(x0 + i * 48, wt + 14, x0 + i * 48, y - 12, 'rgba(120,85,45,.38)', 1);
        // roof shingles (rows stacked)
        const cols = [C.terra, '#b85a40', C.terraL, '#b85a40', C.terra];
        for (let r = 0; r < 5; r++) {
          const yb = y - 58 - 42 + 14 + r * 9, pts = [[x0 - 8, yb - 16]]; pts.push([x0 + w + 8, yb - 16]);
          for (let xx = w + 8; xx >= -8; xx -= 2) pts.push([x0 + xx, yb + 7 * Math.abs(Math.sin(Math.PI * (xx + (r % 2) * 8) / 16))]);
          P(pts, cols[r], { dx: 2.5, dy: 3.2, w: 0.35, sa: 0.3 });
        }
        P(rectP(x0 - 10, y - 58 - 42 - 2, w + 20, 7), C.mustard, { dx: 2, dy: 3 }); dash(x0 - 8, y - 58 - 39, x0 + w + 8, y - 58 - 39, 'rgba(255,248,220,.6)', 0.9);
        P(rectP(x0 - 8, wt - 8, w + 16, 9), C.terraD, { dx: 2, dy: 4, sa: 0.34 });
        // window
        const wx = x0 + 24;
        P(rectP(wx - 16, wt + 10, 32, 28), C.mustard, { dx: 2, dy: 3 });
        [[-12, 14], [1, 14], [-12, 26], [1, 26]].forEach((p, i) => P(rectP(wx + p[0] - 0.5, wt + p[1] - 0.5 - 2, 11, 10), i < 2 ? '#8cc2d0' : '#6eaabd', { sh: 0, w: 0.2 }));
        P([[wx - 14, wt + 12], [wx - 4, wt + 12], [wx - 14, wt + 20]], 'rgba(255,255,255,.35)', { sh: 0, ng: true, w: 0.1 });
        P(rectP(wx - 20, wt + 37, 40, 6), C.terraD, { dx: 2, dy: 3 });
        P(rectP(wx - 18, wt + 40, 36, 10), C.sageD, { dx: 2, dy: 2.5 });
        [[-12, C.coral], [-4, '#f2c14e'], [4, C.coral], [12, '#f2c14e']].forEach((f) => { dot(wx + f[0], wt + 40, 3, f[1]); dot(wx + f[0], wt + 40, 1, C.cream); });
        // door
        const dx = x0 + 120;
        P(rectP(dx - 15, wt + 9, 30, 49), C.mustardD, { dx: 2, dy: 3 });
        P(rectP(dx - 12, wt + 12, 24, 46), C.teal, { dx: 0, dy: 0, sh: 0 });
        P(rectP(dx - 8, wt + 17, 16, 13), '#8cc2d0', { sh: 0, w: 0.2 }); P(rectP(dx - 8, wt + 35, 16, 17), C.tealD, { sh: 0, w: 0.2, st: 1 });
        brad(dx + 8, wt + 36, 1.8);
        // path stones
        [[dx, y + 10, 13, 8, 0.1], [dx - 8, y + 30, 14, 8, -0.2], [dx + 2, y + 50, 14, 9, 0.15], [dx - 4, y + 70, 14, 8.5, -0.1]].forEach((s, i) => { P(ellP(s[0], s[1], s[2], s[3], 14, s[4]), i % 2 ? '#d6ccb4' : '#c9bea4', { dx: 2.2, dy: 3, st: 1, stc: 'rgba(110,95,70,.4)' }); });
      }
      function pond(cx, cy) {
        P(wavyP(cx + 3, cy + 3, 76, 48, 7, 0.05, 0.3), 'rgba(18,45,20,.3)', { sh: 0, ng: true, w: 0.4 });
        P(wavyP(cx, cy, 76, 48, 7, 0.05, 0.3), '#e5d3a2', { dx: 0, dy: 0, sh: 0, st: 1, stc: 'rgba(150,120,70,.45)' });
        [[-62, -6, 4], [-52, 22, 3.4], [58, 14, 4.4], [50, -26, 3], [-30, 38, 3.4], [22, 40, 3], [64, -4, 3]].forEach((s, i) => P(ellP(cx + s[0], cy + s[1], s[2] + 1.5, s[2], 10), i % 2 ? '#b9b3a2' : '#a49f90', { dx: 1.5, dy: 2, w: 0.3 }));
        P(wavyP(cx, cy, 59, 35, 8, 0.07, 1.0), '#4d90b3', { dx: 2, dy: 3, sa: 0.3, w: 0.4 });
        P(wavyP(cx + 2, cy + 1, 48, 27, 6, 0.07, 2.2), 'rgba(110,176,205,.94)', { dx: 2, dy: 3, sa: 0.2, w: 0.4 });
        P(wavyP(cx + 3, cy + 2, 34, 18, 5, 0.08, 0.5), 'rgba(150,206,226,.92)', { dx: 1.5, dy: 2.5, sa: 0.16, w: 0.4 });
        // ripples
        g.save(); g.lineCap = 'round'; g.strokeStyle = 'rgba(255,255,250,.85)'; g.lineWidth = 1.5; g.setLineDash([9, 5]);
        [[cx - 12, cy + 3, 18, 7], [cx - 12, cy + 3, 9, 3.5], [cx + 20, cy - 6, 10, 4]].forEach((e) => { g.beginPath(); g.ellipse(e[0], e[1], e[2], e[3], 0, 0, TAU); g.stroke(); });
        g.restore();
        // lily pad + blossom
        P([[cx + 28, cy + 9], [cx + 40, cy + 3], [cx + 48, cy + 10], [cx + 40, cy + 18], [cx + 32, cy + 18]], C.sage, { dx: 1.8, dy: 2.4 }); // pad (polygon)
        for (let i = 0; i < 6; i++) petal(cx + 40, cy + 10, i / 6 * TAU, 6, 3, i % 2 ? '#f3b3a6' : '#f7c7bc', { dx: 1, dy: 1.2, w: 0.2 });
        dot(cx + 40, cy + 10, 1.7, C.mustard);
        // reeds
        [[-70, -26, -0.2], [-65, -30, 0.1], [-60, -24, 0.3]].forEach((r, i) => { limb(cx + r[0], cy + r[1] + 22, cx + r[0] + r[2] * 14, cy + r[1] - 16 + i * 2, 2.4, C.g1, { dx: 1.5, dy: 2 }); P(ellP(cx + r[0] + r[2] * 14, cy + r[1] - 20 + i * 2, 3, 7, 10), C.brownD, { dx: 1.2, dy: 1.6, w: 0.2 }); });
      }
      function truck(x, y) {
        gsh(x + 4, y + 6, 40, 20, 0.3);
        at(x, y, () => {
          [[-26, 1], [14, 1]].forEach((w) => { P(rectP(w[0] - 7, -23, 15, 6), C.tealD, { dx: 2, dy: 2.5, w: 0.3 }); });
          [[-26, 1], [14, 1]].forEach((w) => { P(rectP(w[0] - 8, 17, 17, 9), '#2b4543', { dx: 2.5, dy: 3, w: 0.3 }); P(ellP(w[0], 21, 3, 2.2, 8), C.creamD, { sh: 0 }); });
          // body side (front face)
          P(rectP(-37, 11, 74, 8), '#b88a22', { dx: 2.5, dy: 3 });
          // body top
          P([[-37, -17], [37, -17], [39, -9], [39, 9], [37, 13], [-37, 13]], '#e7bb3e', { st: 1 });
          // bed
          P(rectP(-34, -13, 31, 24), '#b98d28', { sh: 0 }); P(rectP(-31, -10, 25, 18), '#a67b20', { dx: 0, dy: 0, sh: 0 });
          dash(-18, -9, -18, 7, 'rgba(255,230,160,.4)', 0.8);
          P(rectP(-28, -7, 13, 11), C.sage, { dx: 2, dy: 2.5, st: 1 }); P(rectP(-13, -2, 8, 8), C.terraL, { dx: 1.5, dy: 2 });
          // cab
          P([[-2, -14], [18, -14], [20, -9], [20, 9], [18, 12], [-2, 12]], '#f0c850', { dx: 2.5, dy: 3 });
          P([[0, -11], [8, -11], [8, 9], [0, 9]], '#6eaabd', { dx: 0, dy: 0, sh: 0, w: 0.2 }); // rear window
          P([[11, -12], [17, -10], [17, 8], [11, 10]], '#8cc2d0', { sh: 0, w: 0.2 });
          P(rectP(8, -11, 3, 20), '#e1b23a', { sh: 0, w: 0.2 });
          // hood
          P([[20, -14], [36, -14], [38, -8], [38, 8], [36, 12], [20, 12]], '#eec244', { dx: 2.5, dy: 3 });
          dash(30, -12, 30, 10, 'rgba(160,110,20,.4)', 0.9);
          P(rectP(35, -12, 4, 6), C.cream, { dx: 1, dy: 1.5, w: 0.2 }); P(rectP(35, 6, 4, 6), C.cream, { dx: 1, dy: 1.5, w: 0.2 });
          P(rectP(37, -9, 3, 18), C.grey, { dx: 1, dy: 1.6, w: 0.2 });
          brad(-30, 15, 1.4);
        });
      }

      // ================= LAYOUT =================
      const S = MK.slots;
      const lbl = (s, dy, t) => label(S[s].x, S[s].y + dy, t);

      // soft ground "cutting mat" strokes are intentionally absent: items sit directly on the lawn.
      kidFront(S.kidIdle.x, S.kidIdle.y); lbl('kidIdle', 17, 'kid · idle');
      swoosh(S.kidScythe.x, S.kidScythe.y); kidScythe(S.kidScythe.x, S.kidScythe.y); lbl('kidScythe', 17, 'kid · scythe');
      // pushing mower (mower is north of kid)
      gasMower(S.kidPush.x, S.kidPush.y - 82);
      kidBack(S.kidPush.x, S.kidPush.y); pushHandle(S.kidPush.x, S.kidPush.y - 82, S.kidPush.y - 44); lbl('kidPush', 17, 'kid · push mower');
      reel(S.reel.x, S.reel.y); lbl('reel', 17, 'reel mower');
      ride(S.ride.x, S.ride.y); lbl('ride', 17, 'ride-on mower');

      tree(S.treeSmall.x, S.treeSmall.y, { rx: 72, ry: 60, h: 98, tw: 7, sh: 14, cols: [C.g1, C.g2, C.g3], layers: [[0, 0, 72, 60, 11], [-3, -5, 56, 47, 9, 0.5], [-6, -10, 39, 32, 7, 1]], fruit: true });
      tree(S.treeBig.x, S.treeBig.y, { rx: 120, ry: 88, h: 122, tw: 11, sh: 20, big: true, cols: [C.g1, C.g2, C.g3, C.g4], layers: [[0, 0, 120, 88, 15], [-6, -8, 97, 72, 13, 0.4], [-10, -16, 72, 54, 10, 0.9], [-13, -24, 46, 34, 8, 0.2]] });
      lbl('treeSmall', 18, 'small tree'); lbl('treeBig', 18, 'old oak');
      rock(S.rock.x, S.rock.y); lbl('rock', 18, 'rock');
      ['daisy', 'tulip / poppy', 'aster', 'sunflower'].forEach((n, i) => { patch(S.flowers.x + i * 60, S.flowers.y, i); label(S.flowers.x + i * 60 - (i === 3 ? 6 : 0), S.flowers.y + 18, n); });
      gnome(S.gnome.x, S.gnome.y); ball(S.gnome.x + 55, S.gnome.y); frisbee(S.gnome.x + 110, S.gnome.y); stick(S.gnome.x + 165, S.gnome.y);
      label(S.gnome.x + 8, S.gnome.y + 18, 'gnome'); label(S.gnome.x + 55, S.gnome.y + 18, 'ball'); label(S.gnome.x + 110, S.gnome.y + 18, 'frisbee'); label(S.gnome.x + 165, S.gnome.y + 18, 'stick');
      fence(S.fence.x, S.fence.y); label(S.fence.x + 96, S.fence.y + 22, 'picket fence');
      hedge(S.hedge.x, S.hedge.y); label(S.hedge.x + 96, S.hedge.y + 22, 'hedge');
      house(S.house.x, S.house.y); label(S.house.x + 40, S.house.y + 26, 'house + path');
      pond(S.pond.x, S.pond.y - 5); label(S.pond.x, S.pond.y + 56, 'pond');
      truck(S.truck.x, S.truck.y); label(S.truck.x, S.truck.y + 36, 'pickup truck');
    }
  });
})();
