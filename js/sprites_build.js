/* Lawn Kid - hand-BRUSHED, whimsical storybook terrain tiles (fence, hedge, roof, wall, path, wild, sand, mulch).
   Each fn(g, P, opts) fills exactly (0,0)-(P,P) of g in device pixels. Deterministic (seeded by opts.v).
   Everything is drawn through wrap helpers so the tiles repeat seamlessly in every direction. */
(function () {
  const M = (window.MOW = window.MOW || {});
  const TAU = Math.PI * 2;

  function rng(seed) { let s = ((seed * 2654435761) >>> 0) || 1; return () => { s ^= s << 13; s >>>= 0; s ^= s >>> 17; s ^= s << 5; s >>>= 0; return s / 4294967296; }; }
  const hexc = {};
  function A(hex, a) {
    let c = hexc[hex]; if (!c) { const n = parseInt(hex.slice(1), 16); c = hexc[hex] = [n >> 16, (n >> 8) & 255, n & 255]; }
    return 'rgba(' + c[0] + ',' + c[1] + ',' + c[2] + ',' + (a == null ? 1 : a) + ')';
  }
  function mix(h1, h2, t) {
    const a = parseInt(h1.slice(1), 16), b = parseInt(h2.slice(1), 16), o = [];
    for (let s = 16; s >= 0; s -= 8) o.push(Math.round(((a >> s) & 255) * (1 - t) + ((b >> s) & 255) * t));
    return '#' + o.map((x) => x.toString(16).padStart(2, '0')).join('');
  }
  function pick(r, arr) { return arr[(r() * arr.length) | 0]; }
  /* run fn(ox,oy) for every wrapped copy whose bounding box touches the tile */
  function wr(P, x, y, rx, ry, fn) {
    for (let oy = -P; oy <= P; oy += P) {
      if (y + oy + ry < 0 || y + oy - ry > P) continue;
      for (let ox = -P; ox <= P; ox += P) { if (x + ox + rx < 0 || x + ox - rx > P) continue; fn(ox, oy); }
    }
  }
  /* soft round dab (radial fade) */
  function dab(g, P, x, y, rx, ry, col, a) {
    wr(P, x, y, rx, ry, (ox, oy) => {
      g.save(); g.translate(x + ox, y + oy); g.scale(1, ry / rx);
      const gr = g.createRadialGradient(0, 0, 0, 0, 0, rx);
      gr.addColorStop(0, A(col, a)); gr.addColorStop(0.55, A(col, a * 0.6)); gr.addColorStop(1, A(col, 0));
      g.fillStyle = gr; g.beginPath(); g.arc(0, 0, rx, 0, TAU); g.fill(); g.restore();
    });
  }
  /* dry-brush stroke: a bundle of bristle lines with ragged ends and varying alpha */
  function bstroke(g, P, r, x0, y0, x1, y1, w, col, a, nb) {
    nb = nb || Math.max(3, Math.round(w / (P * 0.014)));
    const dx = x1 - x0, dy = y1 - y0, L = Math.hypot(dx, dy) || 1, nx = -dy / L, ny = dx / L, lines = [];
    for (let i = 0; i < nb; i++) {
      const o = ((i + 0.5) / nb - 0.5) * w, t0 = r() * 0.14, t1 = 1 - r() * 0.3, bend = (r() - 0.5) * w * 0.5, al = 0.3 + r() * 0.7;
      const ax = x0 + dx * t0 + nx * o, ay = y0 + dy * t0 + ny * o, bx = x0 + dx * t1 + nx * o, by = y0 + dy * t1 + ny * o;
      lines.push([ax, ay, (ax + bx) / 2 + nx * bend, (ay + by) / 2 + ny * bend, bx, by, al]);
    }
    const bw = Math.max(0.8, (w / nb) * 1.6), pad = L / 2 + w;
    g.lineCap = 'round'; g.strokeStyle = col; g.lineWidth = bw;
    wr(P, (x0 + x1) / 2, (y0 + y1) / 2, pad, pad, (ox, oy) => {
      for (const l of lines) { g.globalAlpha = a * l[6]; g.beginPath(); g.moveTo(l[0] + ox, l[1] + oy); g.quadraticCurveTo(l[2] + ox, l[3] + oy, l[4] + ox, l[5] + oy); g.stroke(); }
    });
    g.globalAlpha = 1;
  }
  /* scatter of dry streaks over the whole tile */
  function streaks(g, P, r, cols, n, ang, len, wid, a) {
    for (let i = 0; i < n; i++) {
      const x = r() * P, y = r() * P, an = ang + (r() - 0.5) * 0.4, l = len * P * (0.5 + r() * 0.8);
      bstroke(g, P, r, x, y, x + Math.cos(an) * l, y + Math.sin(an) * l, wid * P * (0.6 + r() * 0.8), pick(r, cols), a * (0.6 + r() * 0.8));
    }
  }
  function blade(g, P, x, y, h, lean, w, c0, c1, a) {
    wr(P, x + lean / 2, y - h / 2, Math.abs(lean) + w + 1, h, (ox, oy) => {
      const X = x + ox, Y = y + oy;
      const gr = g.createLinearGradient(X, Y, X + lean, Y - h); gr.addColorStop(0, A(c0, a)); gr.addColorStop(1, A(c1, a));
      g.fillStyle = gr; g.beginPath(); g.moveTo(X - w, Y);
      g.quadraticCurveTo(X + lean * 0.2, Y - h * 0.6, X + lean, Y - h);
      g.quadraticCurveTo(X + lean * 0.5 + w * 0.4, Y - h * 0.5, X + w, Y); g.closePath(); g.fill();
    });
  }
  function leaf(g, P, x, y, len, ang, col, a) {
    wr(P, x, y, len, len, (ox, oy) => {
      g.save(); g.translate(x + ox, y + oy); g.rotate(ang); g.fillStyle = A(col, a);
      g.beginPath(); g.moveTo(0, 0); g.quadraticCurveTo(len * 0.5, -len * 0.38, len, 0); g.quadraticCurveTo(len * 0.5, len * 0.34, 0, 0); g.fill(); g.restore();
    });
  }
  function bloom(g, P, x, y, rad, petal, centre, n) {
    n = n || 5;
    wr(P, x, y, rad * 2, rad * 2, (ox, oy) => {
      g.save(); g.translate(x + ox, y + oy);
      g.fillStyle = A(petal, 0.95);
      for (let i = 0; i < n; i++) { const a = (i / n) * TAU; g.beginPath(); g.arc(Math.cos(a) * rad * 0.8, Math.sin(a) * rad * 0.8, rad * 0.62, 0, TAU); g.fill(); }
      g.fillStyle = A(centre, 1); g.beginPath(); g.arc(0, 0, rad * 0.5, 0, TAU); g.fill(); g.restore();
    });
  }
  function wob(r) { return { ph: r() * TAU, ph2: r() * TAU }; }
  /* soft tinted contour (never black) */
  function soft(g, col, a, w) { g.strokeStyle = A(col, a); g.lineWidth = w; g.lineJoin = 'round'; g.stroke(); }

  /* ======================================================= FENCE */
  // Fence geometry is traced around actual lawn boundaries by render.bake.
  // Design units match the kid (48 per cell), with consistent world lighting.
  function fenceRun(g, length, o) {
    const vertical = !!o.vertical, r = rng((o.seed || 0) + 71);
    const point = (d, lift) => vertical ? [0, d - lift] : [d, -lift];
    const beam = (a, b, w, col) => {
      g.lineCap = 'butt'; g.lineWidth = w;
      g.strokeStyle = 'rgba(37,50,32,.20)';
      g.beginPath(); g.moveTo(a[0] + 4, a[1] + 6); g.lineTo(b[0] + 4, b[1] + 6); g.stroke();
      g.strokeStyle = '#765e46'; g.beginPath(); g.moveTo(a[0], a[1] + 2); g.lineTo(b[0], b[1] + 2); g.stroke();
      g.strokeStyle = col; g.beginPath(); g.moveTo(...a); g.lineTo(...b); g.stroke();
      g.lineWidth = .8; g.strokeStyle = '#ddc39a';
      g.beginPath(); g.moveTo(a[0] - .8, a[1] - 1); g.lineTo(b[0] - .8, b[1] - 1); g.stroke();
    };
    // Warm cedar rails, with pale weathered grain instead of bright white slats.
    beam(point(0, 22), point(length, 22), 4, '#b59c76');
    beam(point(0, 9), point(length, 9), 4, '#a58b66');
    const n = Math.max(1, Math.ceil(length / 72));
    if (!vertical) for (let i = 0; i < n * 3; i++) {
      const x = (i + .5) * length / (n * 3), top = -28 + r() * 2;
      g.fillStyle = i % 3 ? '#bca27d' : '#c9b28b';
      g.beginPath(); g.moveTo(x - 3.2, -2); g.lineTo(x - 3.2, top + 3);
      g.quadraticCurveTo(x, top - 1, x + 3.2, top + 3); g.lineTo(x + 3.2, -2); g.closePath(); g.fill();
      g.strokeStyle = 'rgba(244,226,185,.5)'; g.lineWidth = .8;
      g.beginPath(); g.moveTo(x - 1.5, top + 5); g.lineTo(x - 1.5, -4); g.stroke();
      g.fillStyle = '#816e52'; g.fillRect(x - .7, -22, 1.3, 1.3); g.fillRect(x - .7, -9, 1.3, 1.3);
    }
    for (let i = 0; i <= n; i++) {
      const d = i * length / n, [x, y] = point(d, 0);
      g.fillStyle = 'rgba(32,48,29,.18)';
      g.beginPath(); g.ellipse(x + 4, y + 2, 8, 3, .4, 0, TAU); g.fill();
      g.fillStyle = '#a08765'; g.fillRect(x - 4, y - 33, 8, 34);
      g.fillStyle = '#ccb58e'; g.fillRect(x - 4, y - 33, 5, 33);
      g.fillStyle = '#e0ccaa';
      g.beginPath(); g.moveTo(x - 5, y - 33); g.lineTo(x - 1, y - 36); g.lineTo(x + 5, y - 33); g.lineTo(x + 1, y - 30); g.closePath(); g.fill();
      g.strokeStyle = 'rgba(112,84,53,.3)'; g.lineWidth = .8;
      g.beginPath(); g.moveTo(x - 1, y - 26); g.quadraticCurveTo(x + 1, y - 18, x - 1, y - 6); g.stroke();
    }
  }
  function fence(g, P, o) {
    wild(g, P, o);
    g.save(); g.translate(0, P * .85); g.scale(P / 48, P / 48);
    fenceRun(g, 48, { vertical: false, seed: o && o.v }); g.restore();
  }

  /* ======================================================= HEDGE */
  function hedge(g, P, o) {
    const v = (o && o.v) | 0, inner = !!(o && o.inner), r = rng(v * 137 + (inner ? 5 : 2));
    const dark = inner ? '#2f7a3d' : '#1f5230', mid = inner ? '#4b9a50' : '#2d6f3a', lit = inner ? '#8fd070' : '#5aa65a', pale = inner ? '#c4ec8a' : '#8ccb74';
    g.fillStyle = dark; g.fillRect(0, 0, P, P);
    dab(g, P, r() * P, r() * P, P * 0.5, P * 0.4, mix(dark, '#0d2c1a', 0.5), 0.5);
    const blobs = [];
    for (let i = 0; i < 24; i++) blobs.push([r() * P, r() * P, (0.1 + r() * 0.1) * P, r()]);
    blobs.sort((a, b) => a[1] - b[1]);
    for (const [x, y, rad, t] of blobs) {
      const col = t < 0.4 ? mid : t < 0.8 ? mix(mid, lit, 0.4) : lit;
      wr(P, x, y, rad, rad, (ox, oy) => {
        const X = x + ox, Y = y + oy, gr = g.createRadialGradient(X - rad * 0.3, Y - rad * 0.4, rad * 0.05, X, Y, rad);
        gr.addColorStop(0, A(mix(col, pale, 0.5), 0.95)); gr.addColorStop(0.45, A(col, 0.95)); gr.addColorStop(0.85, A(dark, 0.85)); gr.addColorStop(1, A(dark, 0.0));
        g.fillStyle = gr; g.beginPath(); g.arc(X, Y, rad, 0, TAU); g.fill();
      });
    }
    // leafy brush texture
    for (let i = 0; i < 70; i++) leaf(g, P, r() * P, r() * P, (0.05 + r() * 0.05) * P, r() * TAU, r() > 0.5 ? lit : pale, 0.28 + r() * 0.3);
    for (let i = 0; i < 24; i++) leaf(g, P, r() * P, r() * P, (0.05 + r() * 0.05) * P, r() * TAU, dark, 0.35);
    streaks(g, P, r, [pale, lit, '#fff3a8'], 14, -0.75, 0.2, 0.05, 0.14);
    // sprigs
    for (let i = 0; i < 4; i++) {
      const x = r() * P, y = r() * P, a = -1.2 + (r() - 0.5) * 1.2, l = P * (0.12 + r() * 0.08);
      wr(P, x, y, l, l, (ox, oy) => {
        g.strokeStyle = A(pale, 0.55); g.lineWidth = P * 0.012; g.lineCap = 'round';
        g.beginPath(); g.moveTo(x + ox, y + oy); g.quadraticCurveTo(x + ox + Math.cos(a + 0.4) * l * 0.5, y + oy + Math.sin(a + 0.4) * l * 0.5, x + ox + Math.cos(a) * l, y + oy + Math.sin(a) * l); g.stroke();
      });
      leaf(g, P, x + Math.cos(a) * l, y + Math.sin(a) * l, P * 0.06, a - 0.5, pale, 0.8); leaf(g, P, x + Math.cos(a) * l, y + Math.sin(a) * l, P * 0.06, a + 0.5, pale, 0.8);
    }
    // blossoms & berries
    const nb = 2 + (v % 4);
    const pcs = ['#fff4f4', '#ffc2d1', '#ffe58a', '#ffffff'];
    for (let i = 0; i < nb; i++) bloom(g, P, r() * P, r() * P, P * (0.026 + r() * 0.012), pick(r, pcs), '#f7b733', 5);
    if (v % 2 === 1) for (let i = 0; i < 6; i++) { const x = r() * P, y = r() * P; wr(P, x, y, 4, 4, (ox, oy) => { g.fillStyle = A('#e8506a', 0.95); g.beginPath(); g.arc(x + ox, y + oy, P * 0.02, 0, TAU); g.fill(); g.fillStyle = 'rgba(255,255,255,.7)'; g.beginPath(); g.arc(x + ox - P * 0.006, y + oy - P * 0.007, P * 0.006, 0, TAU); g.fill(); }); }
  }

  /* ======================================================= ROOF */
  const SHING = ['#d9704f', '#cc6247', '#e58a5c', '#c25a42', '#dd7a55', '#d46a4b'];
  function shingles(g, P, r, clipH) {
    const rows = 4, rh = P / rows, sw = P / 4;
    g.fillStyle = '#a84a38'; g.fillRect(0, 0, P, P);
    for (let row = 0; row < rows; row++) {
      const off = (row % 2) * 0.5;
      if (clipH && row * rh > clipH) break;
      for (let i = 0; i < 4; i++) {
        const x0 = (i + off) * sw + P * 0.004, w = sw * 0.99, y0 = row * rh, yb = y0 + rh * 1.24;
        const base = pick(r, SHING), lt = mix(base, '#ffd7a8', 0.35), dk = mix(base, '#8a3030', 0.45);
        const j = [(r() - 0.5) * P * 0.012, (r() - 0.5) * P * 0.012, (r() - 0.5) * P * 0.012];
        const streakSeeds = [r(), r(), r()];
        wr(P, x0 + w / 2, y0 + rh / 2, w, rh * 1.5, (ox, oy) => {
          const X0 = x0 + ox, X1 = X0 + w, Y0 = y0 + oy, YB = yb + oy, c = w * 0.3;
          g.beginPath(); g.moveTo(X0, Y0); g.lineTo(X0 + j[0], YB - c);
          g.quadraticCurveTo(X0 + w * 0.06, YB + j[1], X0 + w / 2, YB + j[2]);
          g.quadraticCurveTo(X1 - w * 0.06, YB + j[1], X1 - j[0], YB - c); g.lineTo(X1, Y0); g.closePath();
          const gr = g.createLinearGradient(0, Y0, 0, YB); gr.addColorStop(0, dk); gr.addColorStop(0.45, base); gr.addColorStop(1, lt);
          g.fillStyle = gr; g.fill();
          g.save(); g.clip();
          const rs = rng((streakSeeds[0] * 1e6) | 0);
          for (let k = 0; k < 3; k++) { const px = X0 + w * (0.15 + rs() * 0.7); bstroke(g, 1e4, rs, px, Y0 + rh * 0.3, px + (rs() - 0.5) * 3, YB - rh * 0.1, w * 0.18, k ? '#ffe0b8' : '#8a3a30', 0.28, 3); }
          g.restore();
          g.beginPath(); g.moveTo(X0 + j[0], YB - c); g.quadraticCurveTo(X0 + w * 0.06, YB + j[1], X0 + w / 2, YB + j[2]); g.quadraticCurveTo(X1 - w * 0.06, YB + j[1], X1 - j[0], YB - c);
          soft(g, '#7a2e2e', 0.3, Math.max(1, P * 0.014));
        });
      }
    }
  }
  function roof(g, P, o) {
    const v = (o && o.v) | 0, r = rng(v * 71 + 3);
    shingles(g, P, r, 0);
    // moss tints
    const nm = v === 6 ? 6 : 2;
    for (let i = 0; i < nm; i++) dab(g, P, r() * P, r() * P, P * (v === 6 ? 0.2 : 0.12), P * 0.09, '#8fae5a', v === 6 ? 0.55 : 0.35);
    streaks(g, P, r, ['#ffd9aa', '#7a3230'], 8, 0.0, 0.3, 0.03, 0.12);
    if (v === 5) { // little skylight
      const x = P * 0.3, y = P * 0.28, w = P * 0.4, h = P * 0.38;
      g.fillStyle = 'rgba(60,20,20,.3)'; g.beginPath(); g.ellipse(x + w / 2, y + h + P * 0.03, w * 0.6, P * 0.05, 0, 0, TAU); g.fill();
      g.fillStyle = '#f3e3c4'; g.beginPath(); g.roundRect ? g.roundRect(x, y, w, h, P * 0.05) : g.rect(x, y, w, h); g.fill(); soft(g, '#a77d5b', 0.5, P * 0.015);
      const gr = g.createLinearGradient(x, y, x + w, y + h); gr.addColorStop(0, '#d7f0f8'); gr.addColorStop(1, '#8cc3dc');
      g.fillStyle = gr; g.beginPath(); g.roundRect ? g.roundRect(x + w * 0.12, y + h * 0.12, w * 0.76, h * 0.76, P * 0.03) : g.rect(x + w * 0.12, y + h * 0.12, w * 0.76, h * 0.76); g.fill();
      bstroke(g, 1e4, r, x + w * 0.22, y + h * 0.25, x + w * 0.5, y + h * 0.18, P * 0.04, '#ffffff', 0.7, 3);
      g.strokeStyle = A('#f3e3c4', 1); g.lineWidth = P * 0.02; g.beginPath(); g.moveTo(x + w / 2, y + h * 0.12); g.lineTo(x + w / 2, y + h * 0.88); g.stroke();
    }
    if (v === 7) for (let i = 0; i < 5; i++) leaf(g, P, r() * P, r() * P, P * 0.05, r() * TAU, pick(r, ['#f4b350', '#e8884a', '#c9d05a']), 0.85);
    if (v === 2) { bloom(g, P, P * 0.7, P * 0.3, P * 0.03, '#ffe58a', '#e8884a', 5); leaf(g, P, P * 0.62, P * 0.33, P * 0.07, 2.6, '#6fa05a', 0.9); }
  }

  /* ======================================================= WALL */
  function wall(g, P, o) {
    const v = (o && o.v) | 0, r = rng(v * 53 + 29), hr = rng(v * 71 + 3);
    // roof portion, clipped
    const RH = P * 0.58;
    g.save(); g.beginPath(); g.rect(0, 0, P, RH + 1); g.clip();
    shingles(g, P, hr, RH);
    dab(g, P, hr() * P, hr() * RH, P * 0.12, P * 0.08, '#8fae5a', 0.3);
    g.restore();
    // eave board + shadow
    const wy = RH, w = wob(r);
    const wg = g.createLinearGradient(0, wy, 0, P); wg.addColorStop(0, '#f8ecd2'); wg.addColorStop(1, '#ecdcb8');
    g.fillStyle = wg; g.fillRect(0, wy, P, P - wy);
    streaks(g, P, r, ['#fffaf0', '#dcc8a0', '#f3d9b5'], 22, 0.0, 0.5, 0.035, 0.28);
    const sh = g.createLinearGradient(0, wy, 0, wy + P * 0.16); sh.addColorStop(0, 'rgba(110,60,50,.5)'); sh.addColorStop(1, 'rgba(110,60,50,0)');
    g.fillStyle = sh; g.fillRect(0, wy, P, P * 0.16);
    g.beginPath(); const th = P * 0.05; g.moveTo(0, wy - th * 0.4);
    for (let i = 0; i <= 16; i++) { const x = (i / 16) * P; g.lineTo(x, wy - th * 0.4 + Math.sin((x / P) * TAU * 2 + w.ph) * P * 0.004); }
    for (let i = 16; i >= 0; i--) { const x = (i / 16) * P; g.lineTo(x, wy + th * 0.7 + Math.sin((x / P) * TAU * 2 + w.ph) * P * 0.004); }
    g.closePath(); g.fillStyle = '#b58a62'; g.fill();
    bstroke(g, P, r, 0, wy - th * 0.1, P, wy - th * 0.1, th * 0.5, '#e8caa0', 0.55, 4);
    // foundation + bed
    const fy = P * 0.93;
    g.fillStyle = '#b9ab92'; g.fillRect(0, fy, P, P - fy);
    for (let i = 0; i < 4; i++) { dab(g, P, (i + 0.5) * P / 4 + (r() - 0.5) * 4, fy + P * 0.035, P * 0.1, P * 0.04, '#d2c6ad', 0.8); }
    bstroke(g, P, r, 0, fy + 1, P, fy + 1, P * 0.025, '#8a7c66', 0.4, 3);
    // features
    const kind = v === 3 ? 'door' : (v === 1 || v === 2 || v === 5 || v === 6) ? 'win' : 'plain';
    const shut = { 1: '#82b38b', 2: '#86a9cc', 5: '#e49a8c', 6: '#d9b45c' }[v];
    if (kind === 'win') {
      const wx = P * 0.33, wy2 = P * 0.66, ww = P * 0.34, wh = P * 0.2;
      g.fillStyle = shut; g.beginPath(); g.roundRect ? g.roundRect(wx - P * 0.11, wy2 - P * 0.01, P * 0.1, wh + P * 0.02, P * 0.02) : g.rect(wx - P * 0.11, wy2, P * 0.1, wh); g.fill(); soft(g, '#5b6d5a', 0.3, P * 0.01);
      g.beginPath(); g.roundRect ? g.roundRect(wx + ww + P * 0.01, wy2 - P * 0.01, P * 0.1, wh + P * 0.02, P * 0.02) : g.rect(wx + ww + P * 0.01, wy2, P * 0.1, wh); g.fill(); soft(g, '#5b6d5a', 0.3, P * 0.01);
      for (const sx of [wx - P * 0.09, wx + ww + P * 0.03]) bstroke(g, 1e4, r, sx + P * 0.03, wy2 + wh * 0.1, sx + P * 0.03, wy2 + wh * 0.9, P * 0.05, '#ffffff', 0.25, 3);
      g.fillStyle = '#fff7e3'; g.beginPath(); g.roundRect ? g.roundRect(wx - P * 0.015, wy2 - P * 0.015, ww + P * 0.03, wh + P * 0.03, P * 0.02) : g.rect(wx, wy2, ww, wh); g.fill(); soft(g, '#a98c68', 0.4, P * 0.01);
      const gr = g.createLinearGradient(wx, wy2, wx + ww, wy2 + wh); gr.addColorStop(0, '#d9f1fa'); gr.addColorStop(1, '#87bddb');
      g.fillStyle = gr; g.fillRect(wx, wy2, ww, wh);
      bstroke(g, 1e4, r, wx + ww * 0.12, wy2 + wh * 0.3, wx + ww * 0.4, wy2 + wh * 0.1, P * 0.045, '#ffffff', 0.7, 3);
      g.strokeStyle = A('#fff7e3', 1); g.lineWidth = P * 0.017; g.beginPath(); g.moveTo(wx + ww / 2, wy2); g.lineTo(wx + ww / 2, wy2 + wh); g.moveTo(wx, wy2 + wh / 2); g.lineTo(wx + ww, wy2 + wh / 2); g.stroke();
      // flower box
      const by = wy2 + wh + P * 0.005;
      g.fillStyle = '#9a6b45'; g.beginPath(); g.roundRect ? g.roundRect(wx - P * 0.05, by, ww + P * 0.1, P * 0.065, P * 0.015) : g.rect(wx - P * 0.05, by, ww + P * 0.1, P * 0.065); g.fill();
      bstroke(g, 1e4, r, wx - P * 0.04, by + P * 0.02, wx + ww + P * 0.04, by + P * 0.02, P * 0.03, '#d9b58a', 0.4, 3);
      for (let i = 0; i < 7; i++) { const fx = wx - P * 0.04 + (i / 6) * (ww + P * 0.08); dab(g, 1e4, fx, by - P * 0.005, P * 0.04, P * 0.035, '#4f9a55', 0.95); }
      for (let i = 0; i < 5; i++) bloom(g, 1e4, wx - P * 0.02 + (i / 4) * (ww + P * 0.04), by - P * 0.02 - (i % 2) * P * 0.012, P * 0.022, pick(r, ['#ff8fa8', '#ffd36b', '#ffffff', '#ffa77a']), '#f7e08a', 5);
    } else if (kind === 'door') {
      const dx = P * 0.34, dw = P * 0.32, top = P * 0.63, bt = fy + P * 0.01;
      g.fillStyle = '#fff7e3'; g.beginPath(); g.moveTo(dx - P * 0.03, bt); g.lineTo(dx - P * 0.03, top + dw / 2); g.arc(dx + dw / 2, top + dw / 2, dw / 2 + P * 0.03, Math.PI, 0); g.lineTo(dx + dw + P * 0.03, bt); g.closePath(); g.fill(); soft(g, '#a98c68', 0.4, P * 0.01);
      const gr = g.createLinearGradient(dx, top, dx + dw, bt); gr.addColorStop(0, '#6aa0a0'); gr.addColorStop(1, '#4a7d83');
      g.fillStyle = gr; g.beginPath(); g.moveTo(dx, bt); g.lineTo(dx, top + dw / 2); g.arc(dx + dw / 2, top + dw / 2, dw / 2, Math.PI, 0); g.lineTo(dx + dw, bt); g.closePath(); g.fill();
      g.save(); g.clip();
      for (let i = 0; i < 4; i++) { const px = dx + dw * (0.15 + i * 0.23); bstroke(g, 1e4, r, px, top, px, bt, dw * 0.12, i % 2 ? '#a8d6d0' : '#2f5e66', 0.3, 3); }
      g.restore();
      g.strokeStyle = A('#2f5e66', 0.45); g.lineWidth = P * 0.01; g.beginPath(); g.moveTo(dx + dw / 2, top + dw * 0.5); g.lineTo(dx + dw / 2, bt); g.stroke();
      g.fillStyle = '#f6c84a'; g.beginPath(); g.arc(dx + dw * 0.78, top + dw * 1.0, P * 0.02, 0, TAU); g.fill();
      g.fillStyle = '#ffe9a0'; g.beginPath(); g.arc(dx + dw / 2, top + dw * 0.42, P * 0.03, 0, TAU); g.fill();
      for (const sx of [dx - P * 0.1, dx + dw + P * 0.1]) { dab(g, 1e4, sx, bt - P * 0.01, P * 0.07, P * 0.06, '#4f9a55', 0.95); bloom(g, 1e4, sx, bt - P * 0.05, P * 0.025, '#ff9db0', '#ffe08a', 5); }
    } else {
      if (v === 7) { // ivy
        let x = P * 0.2, y = fy; g.strokeStyle = A('#4a8a4e', 0.95); g.lineWidth = P * 0.016; g.lineCap = 'round'; g.beginPath(); g.moveTo(x, y);
        const pts = [];
        for (let i = 0; i < 6; i++) { x += (i % 2 ? 1 : -1) * P * 0.03; y -= P * 0.045; pts.push([x, y]); g.lineTo(x, y); }
        g.stroke(); pts.forEach((p, i) => { leaf(g, 1e4, p[0], p[1], P * 0.07, i % 2 ? -0.3 : Math.PI + 0.3, '#5fae5f', 0.95); leaf(g, 1e4, p[0], p[1], P * 0.06, i % 2 ? -2.6 : -0.5, '#4a9a52', 0.9); });
        bloom(g, 1e4, P * 0.72, P * 0.78, P * 0.026, '#ffc2d1', '#ffe08a', 5);
      } else {
        // wall lantern or little round vent window
        if (v === 0) { g.fillStyle = '#7a6a58'; g.fillRect(P * 0.5 - P * 0.006, P * 0.68, P * 0.012, P * 0.04); dab(g, 1e4, P * 0.5, P * 0.78, P * 0.09, P * 0.09, '#ffd36b', 0.4); g.fillStyle = '#ffe9a0'; g.beginPath(); g.roundRect ? g.roundRect(P * 0.46, P * 0.72, P * 0.08, P * 0.11, P * 0.02) : g.rect(P * 0.46, P * 0.72, P * 0.08, P * 0.11); g.fill(); soft(g, '#8a6a4a', 0.5, P * 0.012); }
        else { g.fillStyle = '#fff7e3'; g.beginPath(); g.arc(P * 0.5, P * 0.78, P * 0.09, 0, TAU); g.fill(); soft(g, '#a98c68', 0.45, P * 0.01); g.fillStyle = '#9fcbe0'; g.beginPath(); g.arc(P * 0.5, P * 0.78, P * 0.065, 0, TAU); g.fill(); bstroke(g, 1e4, r, P * 0.46, P * 0.76, P * 0.5, P * 0.73, P * 0.025, '#fff', 0.7, 3); }
      }
    }
  }

  /* ======================================================= PATH */
  const STONE = ['#c5bda5', '#cec5ac', '#c9c2ac', '#d0c8b2', '#c0baa5', '#cbc1a9'];
  function path(g, P, o) {
    const v = (o && o.v) | 0, r = rng(v * 47 + 13), mask = o && o.mask || 0;
    // Large, softly worn concrete / limestone flags with narrow soil joints.
    g.fillStyle = '#7d8167'; g.fillRect(0, 0, P, P);
    const gap = P * .018;
    for (let row = 0; row < 1; row++) for (let col = 0; col < 1; col++) {
      const x = gap, y = gap;
      const w = P - gap * 2, h = P - gap * 2, chip = P * (.022 + r() * .022);
      g.beginPath(); g.moveTo(x + chip, y); g.lineTo(x + w - chip, y);
      g.lineTo(x + w, y + chip); g.lineTo(x + w, y + h - chip);
      g.lineTo(x + w - chip * .6, y + h); g.lineTo(x + chip, y + h);
      g.lineTo(x, y + h - chip); g.lineTo(x, y + chip); g.closePath();
      const base = pick(r, STONE), gr = g.createLinearGradient(x, y, x + w, y + h);
      gr.addColorStop(0, mix(base, '#f3e9cf', .18)); gr.addColorStop(1, base);
      g.fillStyle = gr; g.fill();
      g.save(); g.clip();
      // Mineral flecks and a little dry-brush wear, never glossy bevels.
      for (let k = 0; k < 30; k++) {
        g.fillStyle = k % 3 ? 'rgba(255,247,218,.14)' : 'rgba(94,91,69,.12)';
        g.fillRect(x + r() * w, y + r() * h, P * .014, P * .009);
      }
      for (let k = 0; k < 3; k++) bstroke(g, 1e4, r, x + w * .1, y + h * (.2 + k * .3), x + w * .8, y + h * (.23 + k * .3), P * .025, '#eee2c8', .12, 3);
      if (v === 3) {
        g.strokeStyle = 'rgba(109,104,83,.25)'; g.lineWidth = P * .009;
        g.beginPath(); g.moveTo(x + w * .2, y); g.lineTo(x + w * .4, y + h * .3); g.lineTo(x + w * .35, y + h * .55); g.stroke();
      }
      g.restore();
      g.strokeStyle = 'rgba(241,231,203,.4)'; g.lineWidth = Math.max(.5, P * .009);
      g.beginPath(); g.moveTo(x + chip, y + .5); g.lineTo(x + w - chip, y + .5); g.stroke();
    }
    // Only exposed edges get soil and little grass tips; neighboring slabs join.
    for (let side = 0; side < 4; side++) {
      if (!(mask & (1 << side))) continue;
      g.save(); g.translate(P / 2, P / 2); g.rotate(side * Math.PI / 2); g.translate(-P / 2, -P / 2);
      g.fillStyle = 'rgba(64,83,45,.35)'; g.fillRect(0, 0, P, P * .035);
      for (let k = 0; k < 5; k++) {
        const x = (k + .3 + r() * .4) * P / 5;
        blade(g, 1e4, x, P * .045, P * (.03 + r() * .04), P * .02, P * .008, '#536c3f', '#9aa46a', .75);
      }
      g.restore();
    }
  }

  /* ======================================================= WILD */
  function wild(g, P, o) {
    const v = (o && o.v) | 0, r = rng(v * 33 + 5);
    g.fillStyle = '#2b5c3d'; g.fillRect(0, 0, P, P);
    for (let i = 0; i < 4; i++) dab(g, P, r() * P, r() * P, P * 0.3, P * 0.25, r() > 0.5 ? '#1d4430' : '#3f7a4c', 0.5);
    streaks(g, P, r, ['#1f4a33', '#4a8658', '#336b45', '#6a9a62'], 26, -1.45, 0.2, 0.05, 0.38);
    const bl = [];
    for (let i = 0; i < 20; i++) bl.push([r() * P, r() * P, (0.14 + r() * 0.2) * P, (r() - 0.5) * 0.2 * P, 0.03 * P, r()]);
    bl.sort((a, b) => a[1] - b[1]);
    for (const b of bl) blade(g, P, b[0], b[1], b[2], b[3], b[4], '#1c4430', b[5] > 0.6 ? '#5d9a64' : '#3e7a4e', 0.85);
    if (v % 3 === 0) for (let i = 0; i < 2; i++) bloom(g, P, r() * P, r() * P, P * 0.016, pick(r, ['#e9d7ff', '#fff0b0', '#ffc9d6']), '#f1c24b', 5);
  }

  /* ======================================================= SAND */
  function sand(g, P, o) {
    const v = (o && o.v) | 0, r = rng(v * 29 + 7);
    g.fillStyle = '#efdca8'; g.fillRect(0, 0, P, P);
    for (let i = 0; i < 4; i++) dab(g, P, r() * P, r() * P, P * 0.3, P * 0.2, r() > 0.5 ? '#fff3c8' : '#dcc688', 0.45);
    streaks(g, P, r, ['#fff8dc', '#d4bd84', '#f7e6b0'], 18, 0.0, 0.35, 0.045, 0.35);
    // raked ripples (integer cycle => periodic)
    const ph = r() * TAU;
    for (let k = 0; k < 3; k++) {
      const y0 = P * ((k + 0.5) / 3);
      for (const [col, dy, al, lw] of [['#c8ad70', 0, 0.4, 0.02], ['#fffae0', -P * 0.022, 0.7, 0.014]]) {
        g.strokeStyle = A(col, al); g.lineWidth = P * lw; g.lineCap = 'round'; g.beginPath();
        for (let i = 0; i <= 24; i++) { const x = (i / 24) * P, y = y0 + dy + Math.sin((x / P) * TAU + ph + k) * P * 0.045; i ? g.lineTo(x, y) : g.moveTo(x, y); }
        g.stroke();
      }
    }
    for (let i = 0; i < 26; i++) dab(g, P, r() * P, r() * P, P * 0.012, P * 0.012, r() > 0.5 ? '#fffbe8' : '#bfa56c', 0.9);
    if (v === 5) { // tiny shell
      const x = P * 0.7, y = P * 0.3; g.fillStyle = '#ffd9d2'; g.beginPath(); g.ellipse(x, y, P * 0.04, P * 0.03, 0.5, 0, TAU); g.fill(); soft(g, '#d79a8e', 0.5, P * 0.008);
    }
  }

  /* ======================================================= MULCH */
  function mulch(g, P, o) {
    const v = (o && o.v) | 0, r = rng(v * 19 + 17);
    g.fillStyle = '#25503a'; g.fillRect(0, 0, P, P);
    for (let i = 0; i < 6; i++) dab(g, P, r() * P, r() * P, P * (0.14 + r() * 0.12), P * (0.1 + r() * 0.1), r() > 0.45 ? '#3f7a4a' : '#173828', 0.55);
    for (let i = 0; i < 3; i++) dab(g, P, r() * P, r() * P, P * 0.1, P * 0.07, '#d7e89a', 0.18); // dappled light
    streaks(g, P, r, ['#173828', '#4f8a56', '#3a6b45'], 18, -0.9, 0.16, 0.04, 0.35);
    for (let i = 0; i < 16; i++) leaf(g, P, r() * P, r() * P, (0.05 + r() * 0.04) * P, r() * TAU, pick(r, ['#9a6b3a', '#c48a45', '#7a5530', '#b9a050', '#6a8a45']), 0.85);
    for (let i = 0; i < 6; i++) blade(g, P, r() * P, r() * P, (0.08 + r() * 0.06) * P, (r() - 0.5) * 0.08 * P, 0.02 * P, '#2a5f3a', '#6aa766', 0.85);
    if (v % 4 === 1) { const x = r() * P, y = r() * P; dab(g, P, x, y, P * 0.03, P * 0.025, '#f6e7d0', 0.95); dab(g, P, x, y - P * 0.02, P * 0.03, P * 0.02, '#d9574a', 0.95); }
  }

  M.SpritesBuild = { fenceRun, fence, hedge, roof, wall, path, wild, sand, mulch };
})();
