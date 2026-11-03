/* Lawn Kid - nature sprite set (trees, rock, flowers, gnome, toys, water tiles, pond decor).
   Classic script. window.MOW.SpritesNature = { tree, rock, flower, gnome, toy, waterTile, pondDecor, bounds }.
   All draw fns take a 2D context in DESIGN units (1 grass cell = 48), (x,y) = ground contact point,
   except waterTile which works in device pixels over (0,0)-(P,P). Deterministic (seeded), static. */
(function () {
  'use strict';
  window.MOW = window.MOW || {};
  const TAU = Math.PI * 2;
  const ink = (a) => `rgba(46,32,24,${a})`;
  const hexv = (h) => [parseInt(h.slice(1, 3), 16), parseInt(h.slice(3, 5), 16), parseInt(h.slice(5, 7), 16)];
  const rgba = (h, a) => { const c = hexv(h); return `rgba(${c[0]},${c[1]},${c[2]},${a})`; };
  const mix = (a, b, t) => { const p = hexv(a), q = hexv(b); return '#' + [0, 1, 2].map((i) => ((p[i] + (q[i] - p[i]) * t) | 0).toString(16).padStart(2, '0')).join(''); };
  function ramp(cols, t) {
    t = Math.max(0, Math.min(0.9999, t)) * (cols.length - 1);
    const i = t | 0, f = t - i, a = hexv(cols[i]), b = hexv(cols[i + 1]);
    return `rgb(${(a[0] + (b[0] - a[0]) * f) | 0},${(a[1] + (b[1] - a[1]) * f) | 0},${(a[2] + (b[2] - a[2]) * f) | 0})`;
  }
  const rng = (seed) => { let s = (((seed | 0) * 2654435761) >>> 0) || 1; return () => { s ^= s << 13; s >>>= 0; s ^= s >>> 17; s ^= s << 5; s >>>= 0; return s / 4294967296; }; };
  const lin = (g, x0, y0, x1, y1, stops) => { const gr = g.createLinearGradient(x0, y0, x1, y1); stops.forEach((s) => gr.addColorStop(s[0], s[1])); return gr; };
  function rrPath(g, x, y, w, h, r) { r = Math.min(r, w / 2, h / 2); g.beginPath(); g.moveTo(x + r, y); g.arcTo(x + w, y, x + w, y + h, r); g.arcTo(x + w, y + h, x, y + h, r); g.arcTo(x, y + h, x, y, r); g.arcTo(x, y, x + w, y, r); g.closePath(); }
  function rr(g, x, y, w, h, r, fill, stroke, lw) {
    rrPath(g, x, y, w, h, r);
    if (fill) { g.fillStyle = fill; g.fill(); } if (stroke) { g.strokeStyle = stroke; g.lineWidth = lw || 1; g.stroke(); }
  }
  function blade(g, bx, by, hgt, lean, w, c0, c1, c2) {
    g.fillStyle = lin(g, bx, by, bx + lean, by - hgt, [[0, c0], [0.6, c1], [1, c2]]);
    g.beginPath(); g.moveTo(bx - w, by); g.quadraticCurveTo(bx + lean * 0.2, by - hgt * 0.6, bx + lean, by - hgt);
    g.quadraticCurveTo(bx + lean * 0.5 + w * 0.4, by - hgt * 0.5, bx + w, by); g.closePath(); g.fill();
  }
  function shadow(g, x, y, rx, ry, a, col) {
    g.save(); g.translate(x, y); g.scale(1, ry / rx);
    const c = col || '14,44,26';
    const gr = g.createRadialGradient(0, 0, rx * 0.08, 0, 0, rx);
    gr.addColorStop(0, `rgba(${c},${a})`); gr.addColorStop(0.6, `rgba(${c},${a * 0.65})`); gr.addColorStop(1, `rgba(${c},0)`);
    g.fillStyle = gr; g.beginPath(); g.arc(0, 0, rx, 0, TAU); g.fill(); g.restore();
  }
  function ell(g, x, y, rx, ry, rot, fill, stroke, lw) {
    g.beginPath(); g.ellipse(x, y, Math.abs(rx), Math.abs(ry), rot || 0, 0, TAU);
    if (fill) { g.fillStyle = fill; g.fill(); }
    if (stroke) { g.strokeStyle = stroke; g.lineWidth = lw || 1; g.stroke(); }
  }
  function poly(g, pts, fill, stroke, lw) {
    g.beginPath(); g.moveTo(pts[0][0], pts[0][1]); for (let i = 1; i < pts.length; i++) g.lineTo(pts[i][0], pts[i][1]); g.closePath();
    if (fill) { g.fillStyle = fill; g.fill(); } if (stroke) { g.strokeStyle = stroke; g.lineWidth = lw || 1; g.lineJoin = 'round'; g.stroke(); }
  }
  function line(g, x0, y0, x1, y1, col, w) { g.strokeStyle = col; g.lineWidth = w; g.lineCap = 'round'; g.beginPath(); g.moveTo(x0, y0); g.lineTo(x1, y1); g.stroke(); }
  function taper(g, x0, y0, cx, cy, x1, y1, w0, w1, fill, stroke) {
    const L = [], R = [], N = 12;
    for (let i = 0; i <= N; i++) {
      const t = i / N, u = 1 - t;
      const px = u * u * x0 + 2 * u * t * cx + t * t * x1, py = u * u * y0 + 2 * u * t * cy + t * t * y1;
      const dx = 2 * u * (cx - x0) + 2 * t * (x1 - cx), dy = 2 * u * (cy - y0) + 2 * t * (y1 - cy);
      const l = Math.hypot(dx, dy) || 1, w = (w0 + (w1 - w0) * t) / 2;
      L.push([px - dy / l * w, py + dx / l * w]); R.push([px + dy / l * w, py - dx / l * w]);
    }
    g.beginPath(); g.moveTo(L[0][0], L[0][1]); L.forEach((p) => g.lineTo(p[0], p[1])); for (let i = N; i >= 0; i--) g.lineTo(R[i][0], R[i][1]); g.closePath();
    g.fillStyle = fill; g.fill(); if (stroke) { g.strokeStyle = stroke; g.lineWidth = 0.8; g.stroke(); }
  }
  function blob(g, cx, cy, rx, ry, seed, amp) {
    const r = rng(seed), n = 14, pts = [];
    for (let i = 0; i < n; i++) { const a = i / n * TAU, k = 1 + (r() - 0.5) * amp; pts.push([cx + Math.cos(a) * rx * k, cy + Math.sin(a) * ry * k]); }
    g.beginPath();
    for (let i = 0; i < n; i++) { const p = pts[i], q = pts[(i + 1) % n], mx = (p[0] + q[0]) / 2, my = (p[1] + q[1]) / 2; if (i === 0) g.moveTo((p[0] + pts[n - 1][0]) / 2, (p[1] + pts[n - 1][1]) / 2); g.quadraticCurveTo(p[0], p[1], mx, my); }
    g.closePath();
  }
  function tuft(g, x, y, n, r, hgt) {
    for (let i = 0; i < n; i++) {
      const bx = x + (r() - 0.5) * 2 * hgt, h = hgt * (0.5 + r() * 0.8);
      blade(g, bx, y + r() * 2, h, (r() - 0.5) * 7, 1.5 + r() * 0.8, '#226329', '#3f9a45', r() > 0.5 ? '#82d66b' : '#5bbb5a');
    }
  }
  function leaf(g, s) { g.beginPath(); g.moveTo(-s, 0); g.quadraticCurveTo(0, -s * 0.62, s, 0); g.quadraticCurveTo(0, s * 0.62, -s, 0); g.fill(); }
  function leafMass(g, cx, cy, rx, ry, n, r, cols, sz, bias) {
    const L = [];
    for (let i = 0; i < n; i++) {
      const a = r() * TAU, d = Math.sqrt(r()), px = cx + Math.cos(a) * d * rx, py = cy + Math.sin(a) * d * ry;
      const l = 0.5 - ((px - cx) / rx) * 0.28 - ((py - cy) / ry) * 0.42 + (r() - 0.5) * 0.4 + (bias || 0);
      L.push({ px, py, l, rot: r() * TAU, s: sz * (0.7 + r() * 0.6) });
    }
    L.sort((a, b) => a.py - b.py);
    for (const o of L) {
      g.save(); g.translate(o.px, o.py); g.rotate(o.rot); g.fillStyle = ramp(cols, o.l); leaf(g, o.s);
      if (o.l > 0.5 && o.s > 5) { g.strokeStyle = 'rgba(20,60,20,.3)'; g.lineWidth = 0.6; g.beginPath(); g.moveTo(-o.s * 0.8, 0); g.lineTo(o.s * 0.8, 0); g.stroke(); }
      g.restore();
    }
  }

  /* ---------------------------------------------------------- TREES (ported from mockup B) */
  function trunk(g, x, y, h, w0, w1, flare, sway, r) {
    const N = 16, L = [], R = [];
    for (let i = 0; i <= N; i++) {
      const t = i / N, w = w0 + (w1 - w0) * t + flare * Math.pow(1 - t, 5), cx = x + sway * Math.sin(t * 2.4), yy = y - h * t;
      L.push([cx - w / 2, yy]); R.push([cx + w / 2, yy]);
    }
    const path = () => { g.beginPath(); g.moveTo(L[0][0], L[0][1]); L.forEach((p) => g.lineTo(p[0], p[1])); for (let i = N; i >= 0; i--) g.lineTo(R[i][0], R[i][1]); g.closePath(); };
    path(); g.fillStyle = lin(g, x - w0 / 2 - flare / 2, 0, x + w0 / 2 + flare / 2, 0, [[0, '#a98560'], [0.35, '#80603f'], [0.75, '#52392a'], [1, '#33241a']]); g.fill();
    g.save(); path(); g.clip();
    g.fillStyle = lin(g, 0, y - h, 0, y, [[0, 'rgba(10,30,15,.45)'], [0.5, 'rgba(10,30,15,0)']]); g.fillRect(x - 100, y - h - 4, 200, h + 4);
    const nr = 9;
    for (let k = 1; k <= nr; k++) {
      const f = k / (nr + 1);
      g.beginPath(); for (let i = 0; i <= N; i++) { const px = L[i][0] + (R[i][0] - L[i][0]) * f + Math.sin(i * 1.3 + k * 2.1) * 1.1; if (i === 0) g.moveTo(px, L[i][1]); else g.lineTo(px, L[i][1]); }
      g.strokeStyle = ink(0.4); g.lineWidth = 1.1; g.stroke();
      g.beginPath(); for (let i = 0; i <= N; i++) { const px = L[i][0] + (R[i][0] - L[i][0]) * f + Math.sin(i * 1.3 + k * 2.1) * 1.1 + 1.4; if (i === 0) g.moveTo(px, L[i][1]); else g.lineTo(px, L[i][1]); }
      g.strokeStyle = 'rgba(235,205,160,.22)'; g.lineWidth = 0.8; g.stroke();
    }
    for (let i = 0; i < 12; i++) { const yy = y - r() * h * 0.9, f = r(), xx = x + (f - 0.5) * w0 * 0.8; line(g, xx - 2, yy, xx + 2, yy + 0.6, ink(0.3), 0.8); }
    for (let i = 0; i < 26; i++) { const yy = y - r() * h * 0.28, xx = x - w0 * 0.5 - flare * 0.3 + r() * w0 * 0.5; ell(g, xx, yy, 1 + r() * 2.2, 0.8 + r(), 0, ramp(['#33582c', '#6a9c3e', '#a7c75a'], r()), null); }
    g.restore();
    path(); g.strokeStyle = ink(0.55); g.lineWidth = 1; g.stroke();
    return [x + sway * Math.sin(2.4), y - h];
  }
  function treeImpl(g, x, y, o) {
    const r = rng(o.seed);
    const rx = o.cw / 2, ry = o.ch / 2, cy = y - o.cy;
    shadow(g, x + rx * 0.3, y + 6, rx * 0.95, rx * 0.34, 0.36);
    for (let i = 0; i < 22; i++) { const a = r() * TAU, d = Math.sqrt(r()); ell(g, x + rx * 0.25 + Math.cos(a) * d * rx * 0.7, y + 6 + Math.sin(a) * d * rx * 0.22, 1.5 + r() * 3, 0.8 + r() * 1.2, 0, 'rgba(210,255,150,.12)'); }
    for (const s of [-1, 1]) taper(g, x + s * o.tw0 * 0.3, y - 4, x + s * o.tw0 * 0.8, y + 1, x + s * o.tw0 * 1.3, y + 3, 7, 1.5, '#4a3524');
    const top = trunk(g, x, y, o.th, o.tw0, o.tw1, o.flare, o.sway, r);
    const tx = top[0], ty = top[1];
    ell(g, x, cy + ry * 0.05, rx * 0.86, ry * 0.8, 0, 'rgba(18,48,26,.95)');
    const lim = [[-0.55, -0.3], [0.5, -0.4], [-0.2, -0.75], [0.25, -0.7], [-0.75, -0.62], [0.8, -0.55]];
    lim.forEach((b, i) => taper(g, tx + (i % 2 ? 2 : -2), ty + 14 - i * 2, tx + b[0] * rx * 0.3, ty - 10, tx + b[0] * rx * 0.75, cy + b[1] * ry * 0.5, o.tw1 * 0.55, 2.2, ramp(['#4c3626', '#8a6a48'], 0.5 - b[0] * 0.3), ink(0.4)));
    const cl = [];
    for (let i = 0; i < o.n * 3 && cl.length < o.n; i++) {
      const a = r() * TAU, d = Math.sqrt(r()) * 0.74, px = x + Math.cos(a) * d * rx, py = cy + Math.sin(a) * d * ry;
      if (Math.abs(px - x) < rx * 0.34 && py > cy + ry * 0.12) continue;
      cl.push({ px, py, cr: o.cr * (0.82 + r() * 0.4) });
    }
    cl.sort((a, b) => a.py - b.py);
    for (const c of cl) {
      ell(g, c.px + 2, c.py + 5, c.cr * 0.78, c.cr * 0.62, 0, 'rgba(10,36,20,.55)');
      leafMass(g, c.px, c.py, c.cr * 1.12, c.cr * 0.98, o.leaves, r, o.cols, o.leafSz, (0.1 - (c.py - cy) / ry * 0.12));
    }
    for (let i = 0; i < o.leaves * 0.6; i++) { const a = r() * TAU, d = Math.sqrt(r()); const px = x - rx * 0.25 + Math.cos(a) * d * rx * 0.6, py = cy - ry * 0.35 + Math.sin(a) * d * ry * 0.45; g.save(); g.translate(px, py); g.rotate(r() * TAU); g.fillStyle = 'rgba(235,240,150,.34)'; leaf(g, o.leafSz * 0.7); g.restore(); }
    for (let i = 0; i < 24; i++) { const a = r() * TAU, px = x + Math.cos(a) * rx * 0.97, py = cy + Math.sin(a) * ry * 0.95; g.save(); g.translate(px, py); g.rotate(a + r()); g.fillStyle = ramp(o.cols, 0.3 + r() * 0.5); leaf(g, o.leafSz * 0.9); g.restore(); }
  }
  const TREE1 = { seed: 3, cw: 144, ch: 90, cy: 92, th: 54, tw0: 13, tw1: 9, flare: 8, sway: 2, n: 9, cr: 30, leaves: 190, leafSz: 6, cols: ['#1a4a2e', '#2f6d3a', '#4f9444', '#82b94f', '#c5d672'] };
  const TREE2 = { seed: 7, cw: 240, ch: 150, cy: 128, th: 74, tw0: 32, tw1: 22, flare: 18, sway: 3, n: 15, cr: 46, leaves: 300, leafSz: 7.4, cols: ['#173d26', '#2b5e30', '#4a7e38', '#7ba043', '#bcc86b'] };
  function tree(g, x, y, opts) {
    opts = opts || {};
    const base = opts.size === 2 ? TREE2 : TREE1;
    const o = Object.assign({}, base);
    if (opts.seed !== undefined && opts.seed !== null) o.seed = (opts.seed | 0) + base.seed;
    treeImpl(g, x, y, o);
  }

  /* ---------------------------------------------------------- ROCK */
  function rock(g, x, y, opts) {
    const seed = ((opts && opts.seed) | 0);
    const r = rng(77 + seed * 13);
    const flip = (seed & 1) ? -1 : 1;
    shadow(g, x + 8 * flip, y + 3, 32, 9, 0.38);
    g.save(); g.translate(x, y); g.scale(flip, 1);
    const P = [[-23, -2], [-25, -12], [-17, -24], [-4, -30], [10, -27], [21, -19], [25, -8], [20, 0], [0, 3]];
    g.beginPath(); P.forEach((p, i) => i ? g.lineTo(p[0], p[1]) : g.moveTo(p[0], p[1])); g.closePath();
    g.fillStyle = lin(g, -22, -30, 22, 2, [[0, '#b2ada0'], [0.45, '#8b877e'], [1, '#55544f']]); g.fill();
    g.save(); g.clip();
    poly(g, [[-17, -24], [-4, -30], [10, -27], [21, -19], [6, -17], [-10, -16]], 'rgba(235,230,214,.38)');
    poly(g, [[-25, -12], [-17, -24], [-10, -16], [-14, -2], [-23, -2]], 'rgba(255,255,240,.12)');
    poly(g, [[6, -17], [21, -19], [25, -8], [20, 0], [8, 2]], 'rgba(40,40,45,.28)');
    for (let i = 0; i < 6; i++) { const yy = -26 + i * 5; g.strokeStyle = i % 2 ? 'rgba(50,48,44,.3)' : 'rgba(240,236,220,.28)'; g.lineWidth = 0.8; g.beginPath(); g.moveTo(-26, yy + 4); g.bezierCurveTo(-10, yy - 2 + r() * 3, 8, yy + 4 + r() * 3, 26, yy - 2); g.stroke(); }
    g.strokeStyle = 'rgba(30,28,26,.55)'; g.lineWidth = 0.8; g.beginPath(); g.moveTo(2, -28); g.lineTo(0, -20); g.lineTo(5, -13); g.lineTo(3, -7); g.stroke();
    for (let i = 0; i < 70; i++) { const px = -24 + r() * 48, py = -30 + r() * 32; g.fillStyle = r() > 0.5 ? 'rgba(255,255,245,.25)' : 'rgba(30,30,30,.22)'; g.fillRect(px, py, 1, 1); }
    [[-8, -22, 5], [6, -24, 4], [14, -14, 3.5], [-15, -10, 3]].forEach((l) => { for (let i = 0; i < 12; i++) ell(g, l[0] + (r() - 0.5) * l[2] * 2, l[1] + (r() - 0.5) * l[2], 0.8 + r() * 1.3, 0.7 + r(), 0, r() > 0.4 ? 'rgba(200,214,130,.8)' : 'rgba(230,200,100,.75)'); });
    for (let i = 0; i < 40; i++) ell(g, -24 + r() * 30, -r() * 8, 1.4 + r() * 2.4, 1 + r() * 1.6, 0, ramp(['#35582d', '#6b9d3d', '#a2c457'], r()));
    g.restore();
    g.restore();
    tuft(g, x - 20 * flip, y + 2, 7, r, 14); tuft(g, x + 4 * flip, y + 4, 8, r, 11); tuft(g, x + 22 * flip, y + 1, 6, r, 13);
  }

  /* ------------------------------------------------- FLOWERS (soft watercolour) */
  // grass-matched colours
  const G0 = '#2a7433', G1 = '#4aa84a', G2 = '#8fdc6a';
  /* feathered petal: origin at base, pointing +x. Layered semi-transparent overdraw, gradient base->tip, no contour. */
  function softPetal(g, r, len, wid, cBase, cTip, cLight, a) {
    const j1 = (r() - 0.5) * 0.3, j2 = (r() - 0.5) * 0.9, j3 = (r() - 0.5) * 0.3;
    const shape = (s, ls) => {
      const L = len * ls;
      g.beginPath(); g.moveTo(0, 0);
      g.bezierCurveTo(L * 0.18, -wid * s, L * 0.7, -wid * (1 + j1) * s, L, j2 * wid * 0.35 * s);
      g.bezierCurveTo(L * 0.7, wid * (1 + j3) * s, L * 0.18, wid * s, 0, 0);
    };
    const aa = a === undefined ? 1 : a;
    shape(1.22, 1.07); g.fillStyle = rgba(cTip, 0.2 * aa); g.fill();            // outer feathered halo
    shape(1.0, 1.0); g.fillStyle = lin(g, 0, 0, len, 0, [[0, rgba(cBase, 0.78 * aa)], [0.6, rgba(mix(cBase, cTip, 0.7), 0.72 * aa)], [1, rgba(cTip, 0.6 * aa)]]); g.fill();
    shape(0.55, 0.82); g.fillStyle = lin(g, 0, 0, len, 0, [[0, rgba(cBase, 0)], [0.45, rgba(cLight, 0.32 * aa)], [1, rgba(cLight, 0.05 * aa)]]); g.fill(); // soft sheen
  }
  function petalRing(g, r, cx, cy, n, len, wid, squash, cBase, cTip, cLight, rot, a, startR) {
    const arr = []; for (let i = 0; i < n; i++) arr.push(i / n * TAU + (rot || 0) + (r() - 0.5) * 0.18); arr.sort((p, q) => Math.sin(p) - Math.sin(q));
    for (const ang of arr) {
      g.save(); g.translate(cx, cy); g.scale(1, squash); g.rotate(ang); if (startR) g.translate(startR, 0);
      softPetal(g, r, len * (0.92 + r() * 0.16), wid, cBase, cTip, cLight, a); g.restore();
    }
  }
  function softDisc(g, cx, cy, rx, ry, c0, c1, a) {
    g.save(); g.translate(cx, cy); g.scale(1, ry / rx);
    const gr = g.createRadialGradient(-rx * 0.2, -rx * 0.2, 0, 0, 0, rx);
    gr.addColorStop(0, rgba(c0, a === undefined ? 1 : a)); gr.addColorStop(0.7, rgba(c1, (a === undefined ? 1 : a) * 0.85)); gr.addColorStop(1, rgba(c1, 0));
    g.fillStyle = gr; g.beginPath(); g.arc(0, 0, rx, 0, TAU); g.fill(); g.restore();
  }
  function softStem(g, x0, y0, x1, y1, w, bend) {
    const cx = (x0 + x1) / 2 + (bend || 0), cy = (y0 + y1) / 2;
    taper(g, x0, y0, cx, cy, x1, y1, w, w * 0.62, lin(g, x0, y0, x1, y1, [[0, G0], [0.6, G1], [1, '#79c85a']]));
    taper(g, x0 - w * 0.12, y0, cx - w * 0.12, cy, x1 - w * 0.12, y1, w * 0.3, w * 0.2, 'rgba(190,240,150,.45)');
  }
  function softLeaf(g, x, y, ang, len, w, a) {
    g.save(); g.translate(x, y); g.rotate(ang); g.globalAlpha = a === undefined ? 0.95 : a;
    g.fillStyle = lin(g, 0, 0, len, 0, [[0, G0], [0.55, G1], [1, G2]]);
    g.beginPath(); g.moveTo(0, 0); g.bezierCurveTo(len * 0.25, -w * 1.1, len * 0.7, -w * 0.8, len, 0); g.bezierCurveTo(len * 0.7, w * 0.55, len * 0.25, w * 0.6, 0, 0); g.fill();
    g.fillStyle = lin(g, 0, 0, len, 0, [[0, 'rgba(210,250,170,0)'], [0.5, 'rgba(210,250,170,.35)'], [1, 'rgba(210,250,170,0)']]);
    g.beginPath(); g.moveTo(len * 0.1, 0); g.quadraticCurveTo(len * 0.5, -w * 0.45, len * 0.92, -0.2); g.quadraticCurveTo(len * 0.5, -w * 0.05, len * 0.1, 0); g.fill();
    g.restore();
  }
  function headHalo(g, cx, cy, rad) { shadow(g, cx + 1, cy + rad * 0.45, rad * 1.05, rad * 0.72, 0.2, '28,70,30'); }
  function flowerTufts(g, x, y, r, n, h) { for (let i = 0; i < n; i++) { const bx = x + (r() - 0.5) * 36; blade(g, bx, y + 1 + r() * 2, h * (0.6 + r() * 0.7), (r() - 0.5) * 6, 1.4 + r() * 0.6, G0, G1, G2); } }

  function daisyHead(g, r, cx, cy, s, rot) {
    headHalo(g, cx, cy, s);
    const tip = ['#ffffff', '#fff6f8', '#f7fbff'][(r() * 3) | 0];
    petalRing(g, r, cx, cy, 13, s, s * 0.17 + 0.4, 0.84, '#efe3b4', tip, '#ffffff', rot, 1);
    petalRing(g, r, cx, cy, 10, s * 0.78, s * 0.15 + 0.3, 0.84, '#f4ead0', '#ffffff', '#ffffff', rot + 0.3, 0.8);
    softDisc(g, cx, cy, s * 0.36, s * 0.32, '#ffe27a', '#e8a21e', 0.95);
    for (let j = 0; j < 6; j++) ell(g, cx + (r() - 0.5) * s * 0.35, cy + (r() - 0.5) * s * 0.28, 0.5, 0.5, 0, 'rgba(160,90,10,.35)');
  }
  function poppyHead(g, r, cx, cy, s, rot) {
    headHalo(g, cx, cy, s);
    petalRing(g, r, cx, cy, 5, s, s * 0.62, 0.86, '#a82a24', '#f06a50', '#ffb59a', rot, 1);
    petalRing(g, r, cx, cy, 5, s * 0.6, s * 0.4, 0.86, '#c33a2e', '#ff8566', '#ffd0b8', rot + 0.6, 0.55);
    softDisc(g, cx, cy, s * 0.3, s * 0.26, '#3b2a2a', '#5a2a24', 0.9);
    for (let j = 0; j < 9; j++) { const a = j / 9 * TAU; ell(g, cx + Math.cos(a) * s * 0.34, cy + Math.sin(a) * s * 0.28, 0.6, 0.6, 0, 'rgba(240,205,90,.7)'); }
  }
  function tulipHead(g, r, cx, cy, s) {
    headHalo(g, cx, cy + s * 0.3, s * 0.9);
    const by = cy + s * 0.55;
    const P = [[-0.34, 0.9, '#c63a54', '#f69a86'], [0.34, 0.9, '#c63a54', '#f69a86'], [0, 1.0, '#d9475a', '#ffb98f']];
    P.forEach((p) => { g.save(); g.translate(cx, by); g.rotate(-Math.PI / 2 + p[0]); softPetal(g, r, s * 1.5 * p[1], s * 0.5, p[2], p[3], '#ffe0cc', 1); g.restore(); });
    softDisc(g, cx, by - s * 0.2, s * 0.5, s * 0.35, '#ffd0b0', '#ee7a74', 0.28);
  }
  function asterHead(g, r, cx, cy, s, rot, pal) {
    headHalo(g, cx, cy, s);
    petalRing(g, r, cx, cy, 22, s, 0.95, 0.82, pal[0], pal[1], pal[2], rot, 1);
    petalRing(g, r, cx, cy, 16, s * 0.74, 0.95, 0.82, pal[1], pal[2], '#f0e8ff', rot + 0.17, 0.85);
    softDisc(g, cx, cy, s * 0.3, s * 0.26, '#ffe070', '#e8a020', 0.95);
  }
  function sunflowerHead(g, r, cx, cy, s, rot) {
    headHalo(g, cx, cy, s);
    petalRing(g, r, cx, cy, 17, s, s * 0.2, 0.92, '#e0870f', '#fcc72c', '#fff09a', rot, 1, s * 0.3);
    petalRing(g, r, cx, cy, 17, s * 0.86, s * 0.19, 0.92, '#eba01a', '#ffd946', '#fff4b0', rot + 0.19, 0.9, s * 0.3);
    softDisc(g, cx, cy, s * 0.62, s * 0.56, '#7a5026', '#3c2312', 1);
    for (let j = 0; j < 70; j++) { const a = j * 2.39996, d = Math.sqrt(j / 70) * s * 0.5; ell(g, cx + Math.cos(a) * d, cy + Math.sin(a) * d * 0.92, 0.7, 0.6, 0, j % 3 ? 'rgba(220,170,80,.4)' : 'rgba(26,14,6,.4)'); }
    softDisc(g, cx - s * 0.12, cy - s * 0.14, s * 0.3, s * 0.24, '#b98a48', '#7a5026', 0.35);
  }

  function flower(g, x, y, opts) {
    opts = opts || {};
    const kind = (opts.kind | 0) & 3, v = (opts.v | 0) % 3;
    const r = rng(31 + kind * 17 + v * 101);
    shadow(g, x + 3, y + 2, 25, 7, 0.26);
    flowerTufts(g, x, y, r, 6, 10);
    const mir = v === 1 ? -1 : 1;                 // variants: mirror + shift
    const sh = (v - 1) * 2.5;
    if (kind === 0) {
      const F = [[-13, -24, 6.5], [9, -33, 8], [-1, -18, 5.5], [14, -21, 5.5], [-17, -15, 5]];
      if (v === 2) F.push([3, -40, 5.5]);
      F.forEach((f, i) => { const fx = f[0] * mir + sh; softStem(g, x + fx * 0.25, y, x + fx, y + f[1], 1.6, (i % 2 ? 2 : -2));
        softLeaf(g, x + fx * 0.3, y - 3 - i * 2, (i % 2 ? -0.5 : -2.64) , 9 + (i % 3) * 1.5, 2.2); });
      softLeaf(g, x - 3, y, -2.6, 14, 3.3); softLeaf(g, x + 3, y, -0.55, 14, 3.3);
      F.slice().sort((a, b) => a[1] - b[1]).forEach((f, i) => daisyHead(g, r, x + f[0] * mir + sh, y + f[1], f[2], i * 0.7));
    } else if (kind === 1) {
      softLeaf(g, x - 3, y, -2.5, 15, 3.3); softLeaf(g, x + 3, y, -0.6, 15, 3.3); softLeaf(g, x, y, -1.57, 16, 2.8);
      const F = [[-11, -33, 'p'], [8, -39, 'p'], [0, -23, 'p'], [14, -25, 't']];
      if (v === 2) F[1][1] = -36;
      F.forEach((f, i) => softStem(g, x + f[0] * mir * 0.3, y, x + (f[0]) * mir, y + f[1] + (f[2] === 't' ? 6 : 2), 1.5, (i % 2 ? 3 : -3)));
      F.slice().sort((a, b) => a[1] - b[1]).forEach((f, i) => {
        const cx = x + f[0] * mir, cy = y + f[1] - 2;
        if (f[2] === 't') tulipHead(g, r, cx, cy, 7); else poppyHead(g, r, cx, cy, 8.4 + (i % 2), i * 0.8);
      });
    } else if (kind === 2) {
      const pal = [['#6b58bf', '#9b8be0', '#d6ccff'], ['#7a5fc0', '#b090e6', '#e6d6ff'], ['#5a6fc8', '#8fa6ea', '#d0dcff']];
      softLeaf(g, x - 3, y, -2.7, 12, 2.7); softLeaf(g, x + 3, y, -0.45, 12, 2.7);
      const F = [[-14, -22, 7.2], [0, -34, 8.6], [14, -24, 7.2], [-6, -13, 5.8], [8, -12, 5.8]];
      F.forEach((f, i) => { const fx = f[0] * mir + sh; softStem(g, x + fx * 0.25, y, x + fx, y + f[1], 1.4, (i % 2 ? 2 : -2));
        for (let j = 0; j < 3; j++) softLeaf(g, x + fx * 0.25 + fx * 0.2 * j * 0.6, y + f[1] * (0.2 + 0.22 * j), -1.2 + ((i + j) % 2) * -1.8, 5.5, 1.3, 0.9); });
      F.slice().sort((a, b) => a[1] - b[1]).forEach((f, i) => asterHead(g, r, x + f[0] * mir + sh, y + f[1], f[2], i * 0.5, pal[(i + v) % 3]));
    } else {
      softStem(g, x, y, x + 3 * mir, y - 50, 3.6, 2 * mir);
      softLeaf(g, x, y - 7, mir > 0 ? -2.65 : -0.5, 21, 7); softLeaf(g, x, y - 19, mir > 0 ? -0.45 : -2.7, 21, 7); softLeaf(g, x + 1, y - 34, mir > 0 ? -2.5 : -0.65, 16, 5.5);
      if (v === 2) { softStem(g, x - 9, y, x - 13, y - 22, 1.8, -2); sunflowerHead(g, r, x - 13, y - 25, 7.5, 0.4); }
      sunflowerHead(g, r, x + 3 * mir, y - 56, 17, 0.1);
    }
    flowerTufts(g, x, y + 2, r, 4, 8);
  }

  /* ---------------------------------------------------------- GNOME */
  const BOOT = ['#8a6240', '#52392a'];
  function gnome(g, x, y, opts) {
    const found = !!(opts && opts.found);
    const r = rng(404);
    g.save(); g.translate(x, y);
    shadow(g, 5, 1, 17, 5.5, 0.34);
    const lf = (cx0) => lin(g, cx0 - 8, 0, cx0 + 8, 0, [[0, BOOT[0]], [1, BOOT[1]]]);
    rr(g, -9, -6, 8, 6.5, 2.5, lf(-5), ink(0.55), 0.8); rr(g, 1, -6, 8, 6.5, 2.5, lf(5), ink(0.55), 0.8);
    rr(g, -8, -13, 16, 10, 3, lin(g, -8, 0, 8, 0, [[0, '#5a7aa8'], [1, '#34506f']]), ink(0.5), 0.8);
    line(g, 0, -12, 0, -4, ink(0.35), 0.7);
    g.beginPath(); g.moveTo(-9.5, -9); g.bezierCurveTo(-11, -20, -9, -24, -6, -27); g.lineTo(6, -27); g.bezierCurveTo(9, -24, 11, -20, 9.5, -9); g.closePath();
    g.fillStyle = lin(g, -10, -27, 10, -9, [[0, '#c8553d'], [1, '#8a2f24']]); g.fill(); g.strokeStyle = ink(0.5); g.lineWidth = 0.9; g.stroke();
    rr(g, -10, -17, 20, 3.4, 1, '#3d2a1c', ink(0.4), 0.6); rr(g, -2, -17, 4, 3.4, 0.8, '#d9b44a');
    if (found) { // cheerful: arms raised a little
      taper(g, -9, -22, -13, -22, -14.5, -26, 4.2, 3.4, '#c8553d', ink(0.4)); taper(g, 9, -22, 13, -22, 14.5, -26, 4.2, 3.4, '#c8553d', ink(0.4));
      ell(g, -14.8, -27.4, 3, 3, 0, '#e9bb92', ink(0.4), 0.6); ell(g, 14.8, -27.4, 3, 3, 0, '#e9bb92', ink(0.4), 0.6);
    } else { ell(g, -10.5, -15, 3, 3, 0, '#e9bb92', ink(0.4), 0.6); ell(g, 10.5, -15, 3, 3, 0, '#e9bb92', ink(0.4), 0.6); }
    g.beginPath(); g.moveTo(-8.5, -27); g.bezierCurveTo(-11, -20, -6, -10, 0, -8); g.bezierCurveTo(6, -10, 11, -20, 8.5, -27); g.closePath();
    g.fillStyle = lin(g, -8, -27, 8, -8, [[0, '#fbf7ea'], [1, '#c9c4b0']]); g.fill(); g.strokeStyle = ink(0.4); g.lineWidth = 0.8; g.stroke();
    g.strokeStyle = 'rgba(120,110,90,.45)'; g.lineWidth = 0.6; for (let i = -2; i <= 2; i++) { g.beginPath(); g.moveTo(i * 2.2, -24); g.quadraticCurveTo(i * 2.6, -17, i * 1.2, -10.5); g.stroke(); }
    ell(g, 0, -29, 6, 4.4, 0, '#e9bb92', ink(0.4), 0.7);
    ell(g, 0, -27.4, 3, 2.6, 0, '#e08d72', ink(0.4), 0.6); ell(g, -0.8, -28, 1, 0.8, 0, 'rgba(255,255,255,.5)');
    if (found) { // happy closed-arc eyes + rosy cheeks
      g.strokeStyle = '#2d1d14'; g.lineWidth = 0.9; g.lineCap = 'round';
      g.beginPath(); g.arc(-2.7, -30.2, 1.1, Math.PI * 1.1, Math.PI * 1.9); g.stroke(); g.beginPath(); g.arc(2.7, -30.2, 1.1, Math.PI * 1.1, Math.PI * 1.9); g.stroke();
      ell(g, -4.6, -28.4, 1.5, 1, 0, 'rgba(240,110,100,.4)'); ell(g, 4.6, -28.4, 1.5, 1, 0, 'rgba(240,110,100,.4)');
    } else { ell(g, -2.6, -30.6, 0.8, 0.9, 0, '#2d1d14'); ell(g, 2.6, -30.6, 0.8, 0.9, 0, '#2d1d14'); }
    g.beginPath(); g.moveTo(-7.5, -32); g.bezierCurveTo(-8, -38, -3, -42, 2, -47); g.bezierCurveTo(4, -43, 8, -38, 7.5, -32); g.closePath();
    g.fillStyle = lin(g, -8, -47, 8, -32, [[0, '#e0553c'], [1, '#9a2a22']]); g.fill(); g.strokeStyle = ink(0.5); g.lineWidth = 0.9; g.stroke();
    g.strokeStyle = 'rgba(70,10,10,.35)'; g.lineWidth = 0.6; g.beginPath(); g.moveTo(-2, -41); g.lineTo(-4, -34); g.moveTo(2, -42); g.lineTo(3, -34); g.stroke();
    ell(g, -2, -42, 2, 1, -0.8, 'rgba(255,255,255,.25)');
    ell(g, 0, -32, 8.4, 2, 0, '#b6372c', ink(0.5), 0.7);
    for (let i = 0; i < 6; i++) ell(g, -6 + (i * 2.7) % 12, -20 + (i * 3) % 9, 0.6, 0.5, 0, 'rgba(240,220,190,.4)');
    g.restore();
    if (found) { // little sparkles
      [[-17, -42, 2.6], [18, -36, 2], [16, -50, 1.6]].forEach((s) => { g.save(); g.translate(x + s[0], y + s[1]); g.fillStyle = 'rgba(255,248,200,.9)'; g.beginPath(); for (let k = 0; k < 8; k++) { const a = k * Math.PI / 4, d = k % 2 ? s[2] * 0.35 : s[2]; g.lineTo(Math.cos(a) * d, Math.sin(a) * d); } g.closePath(); g.fill(); g.restore(); });
    } else {
      tuft(g, x - 9, y + 3, 8, r, 18); tuft(g, x + 1, y + 4, 9, r, 20); tuft(g, x + 10, y + 3, 8, r, 17);
    }
  }

  /* ---------------------------------------------------------- TOYS */
  function ball(g, x, y) {
    shadow(g, x + 3, y + 1, 11, 4, 0.34);
    ell(g, x, y - 7, 7.5, 7.5, 0, lin(g, x - 6, y - 14, x + 6, y, [[0, '#ef6a4a'], [0.6, '#c43a2b'], [1, '#7e1e18']]), 'rgba(70,15,10,.65)', 0.9);
    g.strokeStyle = 'rgba(250,235,215,.85)'; g.lineWidth = 1.2; g.beginPath(); g.ellipse(x, y - 7, 7.2, 2.6, -0.5, 0, TAU); g.stroke();
    g.strokeStyle = 'rgba(60,10,8,.35)'; g.lineWidth = 0.6; g.beginPath(); g.arc(x, y - 7, 7.5, 0.2, 2.6); g.stroke();
    ell(g, x - 2.6, y - 10.6, 2, 1.2, -0.6, 'rgba(255,255,255,.55)');
  }
  function frisbee(g, x, y) {
    shadow(g, x + 3, y + 1, 18, 5, 0.32);
    ell(g, x, y - 2.5, 15, 6.4, 0, '#1d5a8c');
    ell(g, x, y - 4.5, 15, 6.4, 0, lin(g, x - 14, y - 10, x + 14, y, [[0, '#6bb3df'], [0.6, '#2f83be'], [1, '#1d5a8c']]), 'rgba(10,40,70,.7)', 0.9);
    ell(g, x, y - 4.6, 10.4, 4.2, 0, null, 'rgba(255,255,255,.45)', 0.9); ell(g, x, y - 4.6, 5.6, 2.3, 0, 'rgba(20,70,110,.35)');
    ell(g, x - 6, y - 7.4, 4, 1, -0.2, 'rgba(255,255,255,.45)');
  }
  function stick(g, x, y) {
    shadow(g, x + 3, y + 1, 22, 4, 0.28);
    g.save(); g.translate(x, y - 3); g.rotate(-0.12);
    taper(g, -19, 0, 0, -2, 20, -1, 5, 2.4, lin(g, 0, -3, 0, 3, [[0, '#a98560'], [1, '#5d4128']]), ink(0.5));
    taper(g, 2, -1, 7, -7, 12, -11, 3, 1.4, '#7d5e3e', ink(0.45));
    g.strokeStyle = 'rgba(40,26,16,.5)'; g.lineWidth = 0.6; for (let i = -14; i < 16; i += 5) { g.beginPath(); g.moveTo(i, -1.6); g.lineTo(i + 2, -0.2); g.stroke(); }
    ell(g, -19, 0, 2.4, 2.5, 0, '#d7bd94', ink(0.4), 0.5); ell(g, -9, -1.4, 1.2, 0.8, 0, '#6d9a40');
    g.restore();
  }
  function toy(g, x, y, opts) { const k = (opts && opts.kind) | 0; if (k === 1) frisbee(g, x, y); else if (k === 2) stick(g, x, y); else ball(g, x, y); }

  /* ---------------------------------------------------------- WATER TILE (device pixels) */
  const WATER = { base: '#4a9bb1', light: '#93d0cc', deep: '#235e7a' };
  function waterPolys(P, mask, base, amp, ph) {
    const N = !!(mask & 1), E = !!(mask & 2), S = !!(mask & 4), W = !!(mask & 8);
    const out = 3, cr = base * 0.85;
    const wv = (s, u) => (Math.sin(u * TAU * 1.4 + ph[s]) * 0.6 + Math.sin(u * TAU * 3.1 + ph[s] * 1.7) * 0.4) * Math.pow(Math.sin(Math.PI * Math.min(1, Math.max(0, u))), 0.9);
    const ins = (s, u) => base * (1 + amp * wv(s, u));
    const segs = [];
    const edge = (s, a0, a1, fn, land) => { // a0..a1 along-edge pixel coord; fn(a)->[x,y]
      const pts = [];
      if (!land) { pts.push(fn(a0), fn(a1)); } else { const n = 28; for (let i = 0; i <= n; i++) pts.push(fn(a0 + (a1 - a0) * i / n)); }
      segs.push({ land, pts });
    };
    const arc = (cx, cy, a0, a1) => { const pts = []; for (let i = 0; i <= 8; i++) { const a = a0 + (a1 - a0) * i / 8; pts.push([cx + Math.cos(a) * cr, cy + Math.sin(a) * cr]); } segs.push({ land: true, pts }); };
    const rTL = N && W, rTR = N && E, rBR = S && E, rBL = S && W;
    // top (left->right)
    edge(0, (W ? base : -out) + (rTL ? cr : 0), (E ? P - base : P + out) - (rTR ? cr : 0), (x) => [x, N ? ins(0, x / P) : -out], N);
    if (rTR) arc(P - base - cr, base + cr, -Math.PI / 2, 0);
    edge(1, (N ? base : -out) + (rTR ? cr : 0), (S ? P - base : P + out) - (rBR ? cr : 0), (y) => [E ? P - ins(1, y / P) : P + out, y], E);
    if (rBR) arc(P - base - cr, P - base - cr, 0, Math.PI / 2);
    edge(2, (E ? P - base : P + out) - (rBR ? cr : 0), (W ? base : -out) + (rBL ? cr : 0), (x) => [x, S ? P - ins(2, x / P) : P + out], S);
    if (rBL) arc(base + cr, P - base - cr, Math.PI / 2, Math.PI);
    edge(3, (S ? P - base : P + out) - (rBL ? cr : 0), (N ? base : -out) + (rTL ? cr : 0), (y) => [W ? ins(3, y / P) : -out, y], W);
    if (rTL) arc(base + cr, base + cr, Math.PI, Math.PI * 1.5);
    return segs;
  }
  function tracePoly(g, segs) { g.beginPath(); let first = true; segs.forEach((s) => s.pts.forEach((p) => { if (first) { g.moveTo(p[0], p[1]); first = false; } else g.lineTo(p[0], p[1]); })); g.closePath(); }
  function waterTile(g, P, opts) {
    opts = opts || {};
    const mask = opts.mask | 0, v = (opts.v | 0) & 3;
    const r = rng(1009 + v * 37 + 5);
    const ph = [r() * TAU, r() * TAU, r() * TAU, r() * TAU];
    g.save(); g.beginPath(); g.rect(0, 0, P, P); g.clip();
    const d = P * 0.34, amp = 0.2;
    const sideInfo = [[1, 0], [2, 1], [4, 2], [8, 3]];
    if (mask) {
      // dry sand base with gentle grain
      g.fillStyle = '#e9d6a4'; g.fillRect(0, 0, P, P);
      const sr = rng(77 + v);
      for (let i = 0; i < P * 1.6; i++) { g.fillStyle = sr() > 0.5 ? 'rgba(130,100,50,.22)' : 'rgba(255,250,225,.5)'; g.fillRect(sr() * P, sr() * P, 1, 1); }
      // wet sand, feathered toward the water
      [0.55, 0.68, 0.8, 0.9].forEach((k, i) => { tracePoly(g, waterPolys(P, mask, d * k, amp, ph)); g.fillStyle = `rgba(128,100,58,${0.16 + i * 0.05})`; g.fill(); });
    }
    const segs = waterPolys(P, mask, d, amp, ph);
    tracePoly(g, segs); g.fillStyle = WATER.base; g.fill();
    g.save(); tracePoly(g, segs); g.clip();
    // soft depth / light patches that fade to 0 before leaving the tile (seamless)
    // shallow light along each land side
    sideInfo.forEach((si) => {
      if (!(mask & si[0])) return;
      const w = P * 0.3, e = d * 0.95; let gr;
      if (si[1] === 0) gr = lin(g, 0, e, 0, e + w, [[0, 'rgba(165,228,214,.5)'], [0.25, 'rgba(165,228,214,.26)'], [0.6, 'rgba(165,228,214,.07)'], [1, 'rgba(165,228,214,0)']]);
      else if (si[1] === 1) gr = lin(g, P - e, 0, P - e - w, 0, [[0, 'rgba(165,228,214,.5)'], [0.25, 'rgba(165,228,214,.26)'], [0.6, 'rgba(165,228,214,.07)'], [1, 'rgba(165,228,214,0)']]);
      else if (si[1] === 2) gr = lin(g, 0, P - e, 0, P - e - w, [[0, 'rgba(165,228,214,.5)'], [0.25, 'rgba(165,228,214,.26)'], [0.6, 'rgba(165,228,214,.07)'], [1, 'rgba(165,228,214,0)']]);
      else gr = lin(g, e, 0, e + w, 0, [[0, 'rgba(165,228,214,.5)'], [0.25, 'rgba(165,228,214,.26)'], [0.6, 'rgba(165,228,214,.07)'], [1, 'rgba(165,228,214,0)']]);
      g.fillStyle = gr; g.fillRect(0, 0, P, P);
    });
    // ripple strokes + sky streaks (kept inside 18%..82% so they never touch shared edges)
    g.lineCap = 'round';
    const nR = [1, 2, 0, 2][v];
    for (let i = 0; i < nR; i++) {
      const px = P * (0.2 + r() * 0.4), py = P * (0.2 + r() * 0.6), len = P * (0.14 + r() * 0.1);
      g.strokeStyle = `rgba(255,255,255,${0.1 + r() * 0.1})`; g.lineWidth = Math.max(1, P * 0.014);
      g.beginPath(); g.moveTo(px, py); g.bezierCurveTo(px + len * 0.3, py - P * 0.02, px + len * 0.65, py + P * 0.02, px + len, py); g.stroke();
      g.strokeStyle = 'rgba(12,50,72,.07)'; g.beginPath(); g.moveTo(px + 1, py + P * 0.025); g.bezierCurveTo(px + len * 0.3, py + P * 0.005, px + len * 0.65, py + P * 0.045, px + len * 0.9, py + P * 0.025); g.stroke();
    }
    if (mask && (v === 1 || v === 3)) { // expanding ripple rings
      const cx = P * (0.4 + r() * 0.2), cy = P * (0.4 + r() * 0.2);
      for (let k = 1; k <= 3; k++) { g.strokeStyle = `rgba(255,255,255,${0.5 - k * 0.12})`; g.lineWidth = Math.max(0.8, P * 0.014 - k * 0.2); g.beginPath(); g.ellipse(cx, cy, P * 0.05 * k + 2, P * 0.022 * k + 1, 0, 0.3 + k * 0.3, TAU - 0.5 - k * 0.2); g.stroke(); }
    }
    g.restore();
    if (mask) {
      // foam / wet edge along land sides only
      g.lineJoin = 'round'; g.lineCap = 'round';
      segs.forEach((s) => {
        if (!s.land) return;
        g.beginPath(); s.pts.forEach((p, i) => i ? g.lineTo(p[0], p[1]) : g.moveTo(p[0], p[1]));
        g.strokeStyle = 'rgba(210,245,235,.28)'; g.lineWidth = P * 0.05; g.stroke();
        g.strokeStyle = 'rgba(255,255,255,.55)'; g.lineWidth = Math.max(1, P * 0.016); g.stroke();
      });
      // pebbles on the sand
      const pr = rng(500 + v * 11 + mask * 3);
      sideInfo.forEach((si) => {
        if (!(mask & si[0])) return;
        for (let i = 0; i < 4; i++) {
          const u = 0.12 + pr() * 0.76, depth = d * (0.25 + pr() * 0.55), s = P * (0.016 + pr() * 0.022);
          let px, py;
          if (si[1] === 0) { px = u * P; py = depth; } else if (si[1] === 1) { px = P - depth; py = u * P; } else if (si[1] === 2) { px = u * P; py = P - depth; } else { px = depth; py = u * P; }
          ell(g, px + 0.8, py + 0.8, s, s * 0.7, 0, 'rgba(60,45,25,.25)');
          ell(g, px, py, s, s * 0.7, 0, ramp(['#8d887c', '#d4cdb8', '#6f6a60'], pr()), 'rgba(46,32,24,.3)', 0.5);
        }
      });
    }
    g.restore();
  }

  /* ---------------------------------------------------------- POND DECOR */
  function pondDecor(g, x, y, opts) {
    opts = opts || {};
    const r = rng(((opts.seed | 0) + 1) * 97 + (opts.kind | 0) * 5);
    if ((opts.kind | 0) === 1) {
      // lily pad with a tiny flower
      shadow(g, x + 1, y + 2, 17, 7, 0.22, '10,50,70');
      g.save(); g.translate(x, y - 1); g.scale(1, 0.55); g.rotate(r() * TAU);
      const R = 13;
      g.beginPath(); g.moveTo(0, 0); g.arc(0, 0, R, 0.4, TAU - 0.15); g.closePath();
      g.fillStyle = lin(g, -R, -R, R, R, [[0, '#9ad06a'], [0.55, '#4f9a48'], [1, '#2a6a3c']]); g.fill();
      g.beginPath(); g.arc(0, 0, R * 1.04, 0.4, TAU - 0.15); g.lineTo(0, 0); g.closePath(); g.strokeStyle = 'rgba(190,240,150,.3)'; g.lineWidth = 1.2; g.stroke();
      g.strokeStyle = 'rgba(215,250,170,.4)'; g.lineWidth = 0.7; for (let k = 0; k < 7; k++) { const a = 1 + k * 0.85; g.beginPath(); g.moveTo(0, 0); g.lineTo(Math.cos(a) * R * 0.9, Math.sin(a) * R * 0.9); g.stroke(); }
      g.restore();
      const fx = x - 4, fy = y - 5;
      shadow(g, fx, fy + 3, 7, 3, 0.18, '40,60,50');
      petalRing(g, r, fx, fy, 8, 5.4, 1.9, 0.7, '#f1a3b8', '#fff2f6', '#ffffff', 0.2, 1);
      petalRing(g, r, fx, fy, 6, 3.8, 1.5, 0.7, '#f6b6c8', '#ffffff', '#ffffff', 0.5, 0.9);
      softDisc(g, fx, fy, 1.9, 1.5, '#ffe58a', '#e8b030', 1);
      return;
    }
    // reeds + cattails
    shadow(g, x, y + 2, 22, 6, 0.25, '10,50,70');
    for (let k = 1; k <= 2; k++) { g.strokeStyle = `rgba(255,255,255,${0.32 - k * 0.1})`; g.lineWidth = 0.9; g.beginPath(); g.ellipse(x, y + 2, 9 + k * 6, 3 + k * 2, 0, 0.2, TAU - 0.4); g.stroke(); }
    const n = 8, bl = [];
    for (let i = 0; i < n; i++) bl.push({ bx: x - 12 + i * 3.4 + r() * 2.5, by: y + (r() - 0.5) * 4, h: 34 + r() * 24, lean: (r() - 0.5) * 16, cat: i % 3 === 1 });
    bl.sort((a, b) => a.by - b.by);
    bl.forEach((b) => {
      const tx = b.bx + b.lean, ty = b.by - b.h;
      taper(g, b.bx, b.by, b.bx + b.lean * 0.15, b.by - b.h * 0.5, tx, ty, 2.6, 1.0, lin(g, b.bx, b.by, tx, ty, [[0, '#2f6e34'], [0.6, '#5aa046'], [1, '#9bd070']]));
      const lh = b.h * 0.8;
      blade(g, b.bx + 1, b.by, lh, b.lean * 0.5 + (b.bx > x ? 7 : -7), 2.2, '#2a6a30', '#4fa044', '#9ad672');
      if (b.cat) {
        g.save(); g.translate(tx, ty); g.rotate(b.lean * 0.03);
        rr(g, -2, -9, 4, 12, 2, lin(g, -2, 0, 2, 0, [[0, '#9a6a3c'], [0.6, '#6a4224'], [1, '#43291a']]));
        rr(g, -0.5, -9, 1.2, 10, 0.6, 'rgba(255,220,170,.28)');
        line(g, 0, -13.5, 0, -9, '#c8ad70', 0.9);
        g.restore();
      }
    });
  }

  const bounds = {
    tree1: { l: -88, t: -152, r: 98, b: 34 },
    tree2: { l: -138, t: -218, r: 158, b: 52 },
    rock: { l: -44, t: -38, r: 54, b: 16 },
    flower: { l: -34, t: -80, r: 34, b: 14 },
    gnome: { l: -24, t: -54, r: 24, b: 12 },
    toy: { l: -28, t: -22, r: 30, b: 8 },
    pondDecor: { l: -30, t: -70, r: 30, b: 12 },
  };

  window.MOW.SpritesNature = { tree, rock, flower, gnome, toy, waterTile, pondDecor, bounds };
})();
