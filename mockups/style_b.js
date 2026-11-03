/* Style B - Illustrated Naturalist */
(function () {
  const TAU = Math.PI * 2;
  const ink = (a) => `rgba(46,32,24,${a})`;
  const hex = (h) => [parseInt(h.slice(1, 3), 16), parseInt(h.slice(3, 5), 16), parseInt(h.slice(5, 7), 16)];
  function ramp(cols, t) {
    t = Math.max(0, Math.min(0.9999, t)) * (cols.length - 1);
    const i = t | 0, f = t - i, a = hex(cols[i]), b = hex(cols[i + 1]);
    return `rgb(${(a[0] + (b[0] - a[0]) * f) | 0},${(a[1] + (b[1] - a[1]) * f) | 0},${(a[2] + (b[2] - a[2]) * f) | 0})`;
  }
  let MKx;
  function shadow(g, x, y, rx, ry, a) {
    g.save(); g.translate(x, y); g.scale(1, ry / rx);
    const gr = g.createRadialGradient(0, 0, rx * 0.08, 0, 0, rx);
    gr.addColorStop(0, `rgba(14,44,26,${a})`); gr.addColorStop(0.6, `rgba(14,44,26,${a * 0.65})`); gr.addColorStop(1, 'rgba(14,44,26,0)');
    g.fillStyle = gr; g.beginPath(); g.arc(0, 0, rx, 0, TAU); g.fill(); g.restore();
  }
  function label(g, t, x, y) {
    g.save(); g.font = '600 12px "Trebuchet MS",system-ui,sans-serif'; g.textAlign = 'center'; g.lineJoin = 'round';
    g.lineWidth = 3.5; g.strokeStyle = 'rgba(10,30,18,.6)'; g.strokeText(t, x, y); g.fillStyle = '#fff'; g.fillText(t, x, y); g.restore();
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
  function rr(g, x, y, w, h, r, fill, stroke, lw) {
    MKx.rr(g, x, y, w, h, r);
    if (fill) { g.fillStyle = fill; g.fill(); } if (stroke) { g.strokeStyle = stroke; g.lineWidth = lw || 1; g.stroke(); }
  }
  const lin = (g, a, b, c, d, s) => MKx.lin(g, a, b, c, d, s);
  function line(g, x0, y0, x1, y1, col, w) { g.strokeStyle = col; g.lineWidth = w; g.lineCap = 'round'; g.beginPath(); g.moveTo(x0, y0); g.lineTo(x1, y1); g.stroke(); }
  function limb(g, x0, y0, x1, y1, w, c1, c2, outline) {
    g.lineCap = 'round'; g.lineJoin = 'round';
    if (outline !== false) { g.strokeStyle = ink(0.4); g.lineWidth = w + 1.4; g.beginPath(); g.moveTo(x0, y0); g.lineTo(x1, y1); g.stroke(); }
    g.strokeStyle = c2; g.lineWidth = w; g.beginPath(); g.moveTo(x0, y0); g.lineTo(x1, y1); g.stroke();
    g.strokeStyle = c1; g.lineWidth = w * 0.62; g.beginPath(); g.moveTo(x0 - w * 0.1, y0 - w * 0.12); g.lineTo(x1 - w * 0.1, y1 - w * 0.12); g.stroke();
  }
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
    const r = MKx.rng(seed), n = 14, pts = [];
    for (let i = 0; i < n; i++) { const a = i / n * TAU, k = 1 + (r() - 0.5) * amp; pts.push([cx + Math.cos(a) * rx * k, cy + Math.sin(a) * ry * k]); }
    g.beginPath();
    for (let i = 0; i < n; i++) { const p = pts[i], q = pts[(i + 1) % n], mx = (p[0] + q[0]) / 2, my = (p[1] + q[1]) / 2; if (i === 0) g.moveTo((p[0] + pts[n - 1][0]) / 2, (p[1] + pts[n - 1][1]) / 2); g.quadraticCurveTo(p[0], p[1], mx, my); }
    g.closePath();
  }
  function tuft(g, x, y, n, r, hgt) {
    for (let i = 0; i < n; i++) {
      const bx = x + (r() - 0.5) * 2 * hgt, h = hgt * (0.5 + r() * 0.8);
      MKx.blade(g, bx, y + r() * 2, h, (r() - 0.5) * 7, 1.5 + r() * 0.8, '#226329', '#3f9a45', r() > 0.5 ? '#82d66b' : '#5bbb5a');
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

  /* ------------------------------------------------------------- KID */
  const SKIN = ['#efc29c', '#cf9770'], SHIRT = ['#d58a66', '#a85a40'], SHORT = ['#a8946c', '#7c6a4c'], CAP = ['#6d9098', '#47666f'], BOOT = ['#8a6240', '#52361f'];
  function bootFront(g, x, y) {
    rr(g, x - 5, y - 9, 10, 9, 3, lin(g, x - 5, 0, x + 5, 0, [[0, BOOT[0]], [1, BOOT[1]]]), ink(0.55), 0.9);
    rr(g, x - 5.5, y - 2.2, 11, 2.6, 1.2, '#2c2018');
    rr(g, x - 3.5, y - 5.6, 7, 3.4, 1.6, 'rgba(255,220,170,.22)');
    line(g, x - 3, y - 8, x + 3, y - 8, 'rgba(250,230,190,.5)', 0.8);
  }
  function kidFront(g, x, y, s) {
    g.save(); g.translate(x, y); g.scale(s || 1, s || 1);
    shadow(g, 4, 1, 19, 6, 0.34);
    for (const sx of [-1, 1]) {
      rr(g, sx * 5.2 - 2.6, -24, 5.2, 18, 2, lin(g, sx * 5 - 3, 0, sx * 5 + 3, 0, [[0, SKIN[0]], [1, SKIN[1]]]), ink(0.3), 0.7);
      rr(g, sx * 5.2 - 3, -11, 6, 4, 1.2, '#efe6d0', ink(0.3), 0.6);
      line(g, sx * 5.2 - 3, -9.2, sx * 5.2 + 3, -9.2, 'rgba(170,80,60,.7)', 0.8);
      bootFront(g, sx * 5.4, 0);
    }
    for (const sx of [-1, 1]) rr(g, sx > 0 ? 0.4 : -11.4, -38, 11, 17, 2.5, lin(g, -11, 0, 11, 0, [[0, SHORT[0]], [1, SHORT[1]]]), ink(0.45), 0.9);
    line(g, 0, -37, 0, -22, ink(0.4), 0.8); line(g, -10, -22.3, -1, -22.3, 'rgba(255,240,200,.25)', 1);
    rr(g, -11.5, -39.5, 23, 3.4, 1.2, '#6a4b2f', ink(0.4), 0.7); rr(g, -2, -39.2, 4, 2.8, 0.6, '#c9b06a');
    rr(g, 4, -33, 5, 5, 1, null, ink(0.35), 0.7);
    // torso
    MKx.rr(g, -11.5, -61, 23, 24, 5); g.fillStyle = lin(g, -12, -60, 12, -38, [[0, SHIRT[0]], [1, SHIRT[1]]]); g.fill(); g.strokeStyle = ink(0.5); g.lineWidth = 0.9; g.stroke();
    line(g, -6, -48, -4, -39, 'rgba(90,40,25,.35)', 0.9); line(g, 5, -50, 6, -41, 'rgba(90,40,25,.3)', 0.9); line(g, -9, -45, -2, -44, 'rgba(255,230,200,.25)', 1);
    line(g, 0, -60, 0, -50, 'rgba(90,40,25,.4)', 0.8); ell(g, 0, -49, 0.8, 0.8, 0, '#f1e3c4');
    poly(g, [[-5, -61], [0, -56.5], [5, -61]], SKIN[1], ink(0.4), 0.7);
    // arms (rolled sleeves)
    for (const sx of [-1, 1]) {
      const ax = sx * 15;
      rr(g, ax - 3.8, -61, 7.6, 11, 3.2, lin(g, ax - 4, 0, ax + 4, 0, [[0, SHIRT[0]], [1, SHIRT[1]]]), ink(0.5), 0.8);
      rr(g, ax - 4.2, -52.5, 8.4, 3.4, 1.6, '#e8b496', ink(0.45), 0.7); line(g, ax - 3, -51, ax + 3, -51, 'rgba(120,60,40,.4)', 0.6);
      rr(g, ax - 2.9, -49.5, 5.8, 13, 2.8, lin(g, ax - 3, 0, ax + 3, 0, [[0, SKIN[0]], [1, SKIN[1]]]), ink(0.35), 0.7);
      ell(g, ax, -35.8, 3, 3.4, 0, SKIN[0], ink(0.4), 0.7);
    }
    // head
    rr(g, -3, -64, 6, 6, 2, SKIN[1]);
    ell(g, -8, -69.5, 1.8, 2.4, 0, SKIN[1], ink(0.35), 0.6); ell(g, 8, -69.5, 1.8, 2.4, 0, SKIN[1], ink(0.35), 0.6);
    ell(g, 0, -69.5, 8, 9, 0, lin(g, -8, -78, 8, -60, [[0, SKIN[0]], [1, '#d8a07a']]), ink(0.45), 0.9);
    g.fillStyle = '#6b4528'; g.beginPath(); g.moveTo(-8, -70); g.quadraticCurveTo(-9, -66, -6, -64); g.lineTo(-6.5, -70); g.fill();
    g.beginPath(); g.moveTo(8, -70); g.quadraticCurveTo(9, -66, 6.5, -64.5); g.lineTo(6.8, -70); g.fill();
    ell(g, -3.2, -68.6, 1, 1.35, 0, '#2d1d14'); ell(g, 3.2, -68.6, 1, 1.35, 0, '#2d1d14');
    ell(g, -2.8, -69, 0.35, 0.4, 0, '#fff'); ell(g, 3.6, -69, 0.35, 0.4, 0, '#fff');
    line(g, -5, -71, -2, -71.4, 'rgba(70,40,20,.6)', 0.8); line(g, 2, -71.4, 5, -71, 'rgba(70,40,20,.6)', 0.8);
    g.strokeStyle = 'rgba(150,80,55,.7)'; g.lineWidth = 0.8; g.beginPath(); g.moveTo(0, -69); g.quadraticCurveTo(1, -66.6, -0.2, -66.2); g.stroke();
    g.strokeStyle = 'rgba(150,60,45,.8)'; g.beginPath(); g.moveTo(-2, -64.4); g.quadraticCurveTo(0, -63.2, 2, -64.4); g.stroke();
    ell(g, -5.2, -65.8, 1.8, 1.1, 0, 'rgba(235,120,100,.35)'); ell(g, 5.2, -65.8, 1.8, 1.1, 0, 'rgba(235,120,100,.35)');
    // cap
    g.beginPath(); g.moveTo(-9, -70); g.bezierCurveTo(-10, -84, 10, -84, 9, -70); g.closePath();
    g.fillStyle = lin(g, -9, -83, 9, -70, [[0, CAP[0]], [1, CAP[1]]]); g.fill(); g.strokeStyle = ink(0.5); g.lineWidth = 0.9; g.stroke();
    g.strokeStyle = 'rgba(30,50,60,.35)'; g.lineWidth = 0.6; g.beginPath(); g.moveTo(0, -80.5); g.quadraticCurveTo(-3, -76, -3.5, -70.8); g.moveTo(0, -80.5); g.quadraticCurveTo(3, -76, 3.5, -70.8); g.stroke();
    ell(g, 0, -80.6, 1.2, 0.8, 0, '#47666f');
    ell(g, -3, -77, 2.2, 1.2, -0.5, 'rgba(255,255,255,.18)');
    g.beginPath(); g.ellipse(0, -70.2, 10, 3.6, 0, 0, Math.PI); g.fillStyle = lin(g, 0, -70, 0, -66, [[0, CAP[1]], [1, '#35505a']]); g.fill(); g.strokeStyle = ink(0.5); g.lineWidth = 0.8; g.stroke();
    g.beginPath(); g.ellipse(0, -70.2, 9, 1.2, 0, 0, Math.PI); g.strokeStyle = 'rgba(255,255,255,.25)'; g.lineWidth = 0.6; g.stroke();
    rr(g, -4, -76.5, 8, 3.6, 1, 'rgba(240,226,190,.55)'); // faded patch
    line(g, -2.5, -75, 2.5, -75, 'rgba(120,70,40,.6)', 0.7);
    g.restore();
  }
  function bootSide(g, x, y) {
    g.beginPath(); g.moveTo(x - 5, y - 11); g.lineTo(x + 2.5, y - 11); g.quadraticCurveTo(x + 4, y - 6, x + 8, y - 4.5); g.quadraticCurveTo(x + 13, y - 3.8, x + 12.5, y - 0.2);
    g.lineTo(x - 5.5, y - 0.2); g.quadraticCurveTo(x - 6.5, y - 5, x - 5, y - 11); g.closePath();
    g.fillStyle = lin(g, x - 5, y - 11, x + 10, y, [[0, BOOT[0]], [1, BOOT[1]]]); g.fill(); g.strokeStyle = ink(0.55); g.lineWidth = 0.9; g.stroke();
    rr(g, x - 6, y - 2.3, 19, 2.6, 1.1, '#2c2018'); line(g, x - 4.5, y - 9.2, x + 2, y - 9.2, 'rgba(250,230,190,.5)', 0.8);
    line(g, x + 0.5, y - 7, x + 4, y - 5.4, 'rgba(250,230,190,.4)', 0.7);
  }
  function headSide(g, x, y, lookDown) {
    // x,y = head centre; facing east
    ell(g, x - 2, y, 6.8, 8.2, 0, '#6b4528');
    g.beginPath(); g.moveTo(x - 1, y - 7.5); g.bezierCurveTo(x + 6, y - 8, x + 8, y - 3, x + 8.2, y); g.quadraticCurveTo(x + 10.6, y + 1.8, x + 8, y + 2.6); g.quadraticCurveTo(x + 8.4, y + 5, x + 6, y + 7); g.quadraticCurveTo(x + 2, y + 9, x - 2, y + 6.6); g.lineTo(x - 2.5, y - 6); g.closePath();
    g.fillStyle = lin(g, x - 2, y - 8, x + 9, y + 8, [[0, SKIN[0]], [1, '#d8a07a']]); g.fill(); g.strokeStyle = ink(0.45); g.lineWidth = 0.9; g.stroke();
    ell(g, x - 1.2, y + 0.6, 1.8, 2.5, 0, SKIN[1], ink(0.4), 0.6);
    ell(g, x + 4.6, y - 1, 0.95, 1.3, 0, '#2d1d14'); line(g, x + 3, y - 3.4, x + 6.2, y - 3.1, 'rgba(70,40,20,.6)', 0.8);
    ell(g, x + 4.2, y + 3, 1.7, 1.1, 0, 'rgba(235,120,100,.35)');
    g.strokeStyle = 'rgba(150,60,45,.8)'; g.lineWidth = 0.8; g.beginPath(); g.moveTo(x + 4.5, y + 5.3); g.lineTo(x + 7, y + 5); g.stroke();
    g.beginPath(); g.moveTo(x - 8, y - 1); g.bezierCurveTo(x - 9, y - 14, x + 7, y - 14, x + 8.4, y - 2.4); g.closePath();
    g.fillStyle = lin(g, x - 8, y - 12, x + 8, y - 1, [[0, CAP[0]], [1, CAP[1]]]); g.fill(); g.strokeStyle = ink(0.5); g.lineWidth = 0.9; g.stroke();
    g.beginPath(); g.moveTo(x + 7.5, y - 2.5); g.quadraticCurveTo(x + 15, y - 3.4, x + 17, y + 0.4); g.quadraticCurveTo(x + 11, y + 0.6, x + 7, y); g.closePath();
    g.fillStyle = CAP[1]; g.fill(); g.strokeStyle = ink(0.5); g.stroke();
    g.strokeStyle = 'rgba(30,50,60,.35)'; g.lineWidth = 0.6; g.beginPath(); g.moveTo(x, y - 11.5); g.quadraticCurveTo(x + 3, y - 7, x + 3.6, y - 2.2); g.stroke();
    ell(g, x - 3, y - 8.5, 2.4, 1.2, -0.4, 'rgba(255,255,255,.18)');
  }
  function kidSide(g, x, y) {
    g.save(); g.translate(x, y);
    shadow(g, 6, 1, 24, 6, 0.32);
    // far arm (behind)
    limb(g, 6, -50, 12, -45, 5.2, SHIRT[0], SHIRT[1]);
    limb(g, 12, -45, 13, -46, 4, SKIN[0], SKIN[1]);
    // back leg
    limb(g, -1, -27, -7, -15, 9, SHORT[0], SHORT[1]);
    limb(g, -7, -15, -12, -9, 4.6, SKIN[0], SKIN[1]); bootSide(g, -13, 0);
    // front leg
    limb(g, 1, -27, 7, -16, 9.6, SHORT[0], SHORT[1]);
    limb(g, 7, -16, 9, -9, 4.8, SKIN[0], SKIN[1]); rr(g, 6.2, -12, 6, 3.4, 1, '#efe6d0', ink(0.3), 0.5); bootSide(g, 8.5, 0);
    // torso leaning
    limb(g, -0.5, -29, 5, -53, 14, SHIRT[0], SHIRT[1]);
    rr(g, -7, -31, 15, 3.4, 1.2, '#6a4b2f', ink(0.4), 0.7);
    line(g, -3, -40, 0, -34, 'rgba(90,40,25,.35)', 0.9); line(g, 2, -48, 5, -42, 'rgba(255,230,200,.3)', 1);
    // neck + head
    limb(g, 5, -54, 7, -58, 5, SKIN[0], SKIN[1], false);
    headSide(g, 9, -65);
    // near arm reaching to snath
    limb(g, 4, -51, 10, -46, 6, SHIRT[0], SHIRT[1]);
    rr(g, 8.5, -49.6, 5.6, 3.6, 1.4, '#e8b496', ink(0.45), 0.6);
    limb(g, 11, -46, 19, -38, 4.4, SKIN[0], SKIN[1]);
    ell(g, 19.5, -37.8, 2.8, 2.8, 0, SKIN[0], ink(0.4), 0.6);
    g.restore();
  }
  function kidBack(g, x, y, stride) {
    g.save(); g.translate(x, y);
    shadow(g, 3, 1, 19, 6, 0.34);
    for (const sx of [-1, 1]) {
      const yy = sx < 0 ? 0 : stride || 0;
      rr(g, sx * 5.2 - 2.6, yy - 24, 5.2, 18, 2, lin(g, sx * 5 - 3, 0, sx * 5 + 3, 0, [[0, SKIN[0]], [1, SKIN[1]]]), ink(0.3), 0.7);
      rr(g, sx * 5.2 - 3, yy - 11, 6, 4, 1.2, '#efe6d0', ink(0.3), 0.6);
      rr(g, sx * 5.4 - 5, yy - 9, 10, 9, 3, lin(g, 0, 0, 10, 0, [[0, BOOT[0]], [1, BOOT[1]]]), ink(0.55), 0.9);
      rr(g, sx * 5.4 - 5.5, yy - 2.2, 11, 2.6, 1.2, '#2c2018'); line(g, sx * 5.4 - 3, yy - 7, sx * 5.4 + 3, yy - 7, 'rgba(250,230,190,.45)', 0.8);
    }
    for (const sx of [-1, 1]) rr(g, sx > 0 ? 0.4 : -11.4, -38, 11, 17, 2.5, lin(g, -11, 0, 11, 0, [[0, SHORT[0]], [1, SHORT[1]]]), ink(0.45), 0.9);
    line(g, 0, -37, 0, -22, ink(0.4), 0.8);
    rr(g, -11.5, -39.5, 23, 3.4, 1.2, '#6a4b2f', ink(0.4), 0.7);
    rr(g, -9, -33, 5, 5, 1, null, ink(0.3), 0.6);
    MKx.rr(g, -11.5, -61, 23, 24, 5); g.fillStyle = lin(g, -12, -60, 12, -38, [[0, SHIRT[0]], [1, SHIRT[1]]]); g.fill(); g.strokeStyle = ink(0.5); g.lineWidth = 0.9; g.stroke();
    line(g, 0, -58, 0, -42, 'rgba(90,40,25,.28)', 0.9); line(g, -7, -53, -3, -47, 'rgba(255,230,200,.25)', 1); line(g, 4, -50, 8, -44, 'rgba(90,40,25,.3)', 0.9);
    // sweat darker V on shirt back
    g.fillStyle = 'rgba(120,50,35,.18)'; g.beginPath(); g.moveTo(-6, -58); g.lineTo(6, -58); g.lineTo(0, -45); g.closePath(); g.fill();
    // arms forward: shoulders to hands near handle
    for (const sx of [-1, 1]) {
      const ax = sx * 15;
      rr(g, ax - 3.8, -61, 7.6, 10, 3.2, lin(g, ax - 4, 0, ax + 4, 0, [[0, SHIRT[0]], [1, SHIRT[1]]]), ink(0.5), 0.8);
      rr(g, ax - 4.2, -52.5, 8.4, 3.2, 1.6, '#e8b496', ink(0.45), 0.7);
      limb(g, ax * 0.98, -50, sx * 10.5, -44, 5.2, SKIN[0], SKIN[1]);
      ell(g, sx * 10, -42.6, 3, 3, 0, SKIN[0], ink(0.4), 0.7);
    }
    rr(g, -3, -64, 6, 6, 2, SKIN[1]);
    ell(g, -8, -69.5, 1.8, 2.4, 0, SKIN[1], ink(0.35), 0.6); ell(g, 8, -69.5, 1.8, 2.4, 0, SKIN[1], ink(0.35), 0.6);
    ell(g, 0, -69.5, 8, 9, 0, '#6b4528', ink(0.45), 0.9);
    g.strokeStyle = 'rgba(30,18,10,.35)'; g.lineWidth = 0.7; for (let i = -4; i <= 4; i += 2) { g.beginPath(); g.moveTo(i, -64); g.lineTo(i * 1.1, -61.6); g.stroke(); }
    g.beginPath(); g.moveTo(-9, -69); g.bezierCurveTo(-10, -85, 10, -85, 9, -69); g.quadraticCurveTo(0, -66.5, -9, -69); g.closePath();
    g.fillStyle = lin(g, -9, -83, 9, -68, [[0, CAP[0]], [1, CAP[1]]]); g.fill(); g.strokeStyle = ink(0.5); g.lineWidth = 0.9; g.stroke();
    g.strokeStyle = 'rgba(30,50,60,.35)'; g.lineWidth = 0.6; g.beginPath(); g.moveTo(0, -81.5); g.lineTo(0, -68.5); g.moveTo(0, -81.5); g.quadraticCurveTo(-5, -76, -6.2, -69); g.moveTo(0, -81.5); g.quadraticCurveTo(5, -76, 6.2, -69); g.stroke();
    rr(g, -4, -71.6, 8, 2.6, 1, '#5c7d86'); line(g, -3, -70.4, 3, -70.4, 'rgba(255,255,255,.25)', 0.6); // strap
    ell(g, -3, -78, 2.2, 1.2, -0.5, 'rgba(255,255,255,.18)');
    g.restore();
  }

  /* ---------------------------------------------------------- MOWERS */
  function wheelTop(g, x, y, w, h) { // rubber wheel seen from above, with tread
    rr(g, x - w / 2, y - h / 2, w, h, w * 0.4, lin(g, x - w / 2, 0, x + w / 2, 0, [[0, '#4a4a48'], [0.5, '#2a2a29'], [1, '#161615']]), 'rgba(0,0,0,.6)', 0.8);
    g.strokeStyle = 'rgba(140,140,130,.35)'; g.lineWidth = 0.9;
    for (let i = -h / 2 + 2; i < h / 2 - 1; i += 2.6) { g.beginPath(); g.moveTo(x - w / 2 + 1, i + y); g.lineTo(x + w / 2 - 1, i + y + 1.2); g.stroke(); }
    rr(g, x - w / 2 + 0.8, y - h / 2 + 1, 1.8, h - 2, 1, 'rgba(255,255,255,.12)');
  }
  function bolt(g, x, y) { ell(g, x, y, 1, 1, 0, '#c9cbc8', 'rgba(40,40,40,.6)', 0.4); }
  function gasMower(g, x, y) { // origin = deck rear centre on ground, facing north
    g.save(); g.translate(x, y);
    shadow(g, 5, -30, 27, 36, 0.3);
    wheelTop(g, -24.5, -12, 9, 19); wheelTop(g, 24.5, -12, 9, 19);
    wheelTop(g, -22, -50, 8, 14); wheelTop(g, 22, -50, 8, 14);
    // deck
    MKx.rr(g, -19, -64, 38, 56, 10); g.fillStyle = lin(g, -19, -64, 19, -8, [[0, '#cf5a3f'], [0.5, '#ac3f2b'], [1, '#7a2a1d']]); g.fill(); g.strokeStyle = 'rgba(60,18,10,.7)'; g.lineWidth = 1; g.stroke();
    rr(g, -17, -62, 34, 52, 8, null, 'rgba(255,200,170,.28)', 0.9);
    // discharge chute on east side
    poly(g, [[19, -40], [27, -38], [27, -26], [19, -26]], '#3a3a3a', 'rgba(0,0,0,.6)', 0.8); line(g, 20, -36, 26, -35, 'rgba(255,255,255,.2)', 0.8);
    // engine cowling
    MKx.rr(g, -12, -55, 24, 33, 8); g.fillStyle = lin(g, -12, -55, 12, -22, [[0, '#2d2f33'], [0.55, '#17181b'], [1, '#0d0e10']]); g.fill(); g.strokeStyle = 'rgba(0,0,0,.8)'; g.stroke();
    rr(g, -10, -53, 20, 29, 6, null, 'rgba(210,215,220,.22)', 0.8);
    ell(g, 0, -45, 7.5, 6.5, 0, lin(g, -6, -50, 6, -40, [[0, '#d2d5d6'], [1, '#7c8184']]), 'rgba(0,0,0,.6)', 0.8); // recoil housing
    for (let i = 0; i < 6; i++) { const a = i / 6 * TAU; line(g, Math.cos(a) * 3, -45 + Math.sin(a) * 2.6, Math.cos(a) * 6.5, -45 + Math.sin(a) * 5.6, 'rgba(40,40,40,.5)', 0.7); }
    ell(g, 0, -45, 2, 1.8, 0, '#a22d1f', 'rgba(0,0,0,.5)', 0.5);
    g.strokeStyle = '#d9c8a0'; g.lineWidth = 0.9; g.beginPath(); g.moveTo(5.5, -43); g.quadraticCurveTo(10, -38, 7, -33); g.stroke(); rr(g, 4.6, -34, 4.8, 2.6, 1, '#d6382a', 'rgba(0,0,0,.5)', 0.5);
    ell(g, -5, -32, 3.4, 3.2, 0, '#d9a31e', 'rgba(0,0,0,.6)', 0.7); ell(g, -5, -32, 1.6, 1.4, 0, '#8d6710'); // fuel cap
    rr(g, 2, -34, 7, 8, 2, '#222427', 'rgba(255,255,255,.12)', 0.6); // air filter
    rr(g, -10, -26, 7, 3, 1, '#b7b9b8', 'rgba(0,0,0,.5)', 0.5); // muffler hint
    [[-14, -60], [14, -60], [-14, -12], [14, -12], [-9, -28], [9, -28]].forEach((p) => bolt(g, p[0], p[1]));
    ell(g, -8, -50, 3, 1.5, -0.4, 'rgba(255,255,255,.16)');
    // handle
    g.lineCap = 'round';
    for (const sx of [-1, 1]) { line(g, sx * 14, -8, sx * 13, -2, '#222', 3); limb(g, sx * 13, -2, sx * 10.5, 14, 2.8, '#7a7a78', '#3b3b3a', false); }
    rr(g, -11.5, 12, 23, 3.4, 1.7, '#222', 'rgba(255,255,255,.1)', 0.6);
    rr(g, -9, 11.6, 8, 4.2, 2, '#1a1a1a'); rr(g, 1, 11.6, 8, 4.2, 2, '#1a1a1a'); // grips
    g.restore();
  }
  function reelMower(g, x, y) {
    g.save(); g.translate(x, y);
    shadow(g, 6, 0, 46, 10, 0.34);
    // far wheel
    ell(g, 0, -17, 11, 11, 0, '#262625', '#111', 1); ell(g, 0, -17, 7, 7, 0, '#9d3a28');
    // handle (far leg)
    // reel drum (cage of spiral steel blades)
    g.save(); g.translate(27, -10);
    ell(g, 0, 0, 7.5, 13.5, 0, '#23272a', 'rgba(0,0,0,.7)', 0.9);
    for (let i = 0; i < 7; i++) { const t = (i / 7) * 2 - 1; g.strokeStyle = i % 2 ? '#a8aeb0' : '#e4e8e8'; g.lineWidth = 1.7; g.beginPath(); g.moveTo(-6.5 * Math.sqrt(1 - t * t) - 0.5, t * 13); g.bezierCurveTo(-2, t * 13 - 4, 3, t * 13 + 5, 6.5 * Math.sqrt(1 - t * t), t * 13 + 1); g.stroke(); }
    ell(g, 0, 0, 7.5, 13.5, 0, null, 'rgba(255,255,255,.35)', 0.7);
    line(g, 0, -13, 0, 13, '#6d7376', 2.2); ell(g, 0, -13, 2.2, 1.4, 0, '#c9cbc8', 'rgba(0,0,0,.6)', 0.5); ell(g, 0, 13, 2.2, 1.4, 0, '#c9cbc8', 'rgba(0,0,0,.6)', 0.5);
    g.restore();
    rr(g, 21, -1.5, 12, 3.5, 1.5, '#9aa0a2', 'rgba(0,0,0,.55)', 0.7); // bed knife
    // frame bar
    limb(g, 6, -14, 26, -9, 3.6, '#b3382a', '#7a2318');
    // roller
    rr(g, -26, -8, 8, 9, 3, lin(g, -26, 0, -18, 0, [[0, '#b58a56'], [1, '#6c4a28']]), ink(0.55), 0.8);
    // near wheel
    ell(g, 0, -11, 12.2, 12.2, 0, lin(g, 0, -23, 0, 1, [[0, '#454543'], [1, '#161615']]), 'rgba(0,0,0,.7)', 1);
    for (let i = 0; i < 28; i++) { const a = i / 28 * TAU; line(g, Math.cos(a) * 10.4, -11 + Math.sin(a) * 10.4, Math.cos(a) * 12.2, -11 + Math.sin(a) * 12.2, 'rgba(160,160,150,.4)', 0.8); }
    ell(g, 0, -11, 8.4, 8.4, 0, lin(g, -6, -18, 6, -4, [[0, '#d4543a'], [1, '#8d2a1a']]), 'rgba(60,14,8,.7)', 0.8);
    for (let i = 0; i < 6; i++) { const a = i / 6 * TAU; line(g, 0, -11, Math.cos(a) * 7.4, -11 + Math.sin(a) * 7.4, 'rgba(255,200,170,.5)', 0.9); }
    ell(g, 0, -11, 2, 2, 0, '#c9cbc8', 'rgba(0,0,0,.6)', 0.5);
    // gear cover
    ell(g, 4, -14, 5.5, 5.5, 0, 'rgba(180,184,186,.9)', 'rgba(0,0,0,.5)', 0.7); bolt(g, 4, -14);
    // handle
    limb(g, 4, -14, -28, -48, 3.6, '#c89a64', '#7d5430');
    limb(g, 6, -15, -26, -50, 2, '#9ea3a5', '#55595b', false);
    limb(g, -26, -50, -32, -43, 2, '#9ea3a5', '#55595b', false);
    // cross grip (depth)
    limb(g, -30, -58, -34, -40, 4, '#d0a46e', '#7d5430');
    ell(g, -30, -58, 2.2, 2.2, 0, '#9b7345', ink(0.5), 0.6); ell(g, -34, -40, 2.2, 2.2, 0, '#9b7345', ink(0.5), 0.6);
    bolt(g, 4, -14); bolt(g, 14, -11);
    g.restore();
  }
  function rideMower(g, x, y) {
    g.save(); g.translate(x, y);
    shadow(g, 6, 0, 56, 13, 0.36);
    // far wheels
    ell(g, -26, -25, 15, 15, 0, '#1b1b1a', '#000', 1);
    ell(g, 31, -19, 8.5, 8.5, 0, '#1b1b1a', '#000', 1);
    // mower deck + chute (under, between wheels)
    rr(g, 2, -14, 44, 13, 5, lin(g, 0, -14, 0, 0, [[0, '#4d5a50'], [1, '#2a332d']]), 'rgba(0,0,0,.6)', 0.9);
    rr(g, 14, -6, 24, 9, 3, lin(g, 0, -6, 0, 3, [[0, '#55595a'], [1, '#2c2f30']]), 'rgba(0,0,0,.6)', 0.8); line(g, 17, -3, 35, -3, 'rgba(255,255,255,.2)', 0.8);
    // chassis / rear body
    MKx.rr(g, -42, -45, 52, 28, 7); g.fillStyle = lin(g, -42, -45, 10, -17, [[0, '#4f9a62'], [0.5, '#2f7142'], [1, '#1e4a2c']]); g.fill(); g.strokeStyle = 'rgba(8,30,16,.75)'; g.lineWidth = 1; g.stroke();
    line(g, -38, -41, 4, -41, 'rgba(210,255,215,.35)', 1);
    // hood
    g.beginPath(); g.moveTo(2, -29); g.lineTo(2, -50); g.quadraticCurveTo(24, -56, 46, -45); g.quadraticCurveTo(50, -40, 48, -26); g.lineTo(46, -17); g.lineTo(2, -17); g.closePath();
    g.fillStyle = lin(g, 2, -56, 46, -17, [[0, '#5aa86d'], [0.45, '#36804c'], [1, '#1f4e30']]); g.fill(); g.strokeStyle = 'rgba(8,30,16,.8)'; g.stroke();
    g.strokeStyle = 'rgba(210,255,215,.35)'; g.lineWidth = 1; g.beginPath(); g.moveTo(5, -48); g.quadraticCurveTo(24, -53, 42, -44); g.stroke();
    g.strokeStyle = 'rgba(0,0,0,.28)'; g.lineWidth = 0.8; g.beginPath(); g.moveTo(14, -48); g.lineTo(14, -21); g.stroke();
    // grille + headlight
    rr(g, 43, -42, 6, 19, 2, '#262a27', 'rgba(0,0,0,.7)', 0.6); for (let i = 0; i < 5; i++) line(g, 44, -40 + i * 3.8, 48, -40 + i * 3.8, 'rgba(190,200,190,.45)', 0.8);
    ell(g, 47, -44, 2.4, 2.8, 0, '#f7edb8', 'rgba(60,40,0,.6)', 0.6); ell(g, 47, -21, 2.2, 2.4, 0, '#f2e6a8', 'rgba(60,40,0,.6)', 0.6);
    rr(g, 10, -51, 9, 3, 1, '#1f4e30'); ell(g, 36, -48, 3, 1.4, 0, '#d9a31e', 'rgba(0,0,0,.6)', 0.5);
    // logo plate
    rr(g, 22, -37, 16, 6, 2, '#e9c53a', 'rgba(60,40,0,.6)', 0.6); line(g, 24, -34, 36, -34, 'rgba(90,60,0,.6)', 0.8);
    // seat
    rr(g, -34, -58, 22, 15, 5, lin(g, -34, -58, -12, -43, [[0, '#d9c9a2'], [1, '#9c8a62']]), ink(0.55), 0.9);
    rr(g, -36, -75, 6, 24, 3, lin(g, -36, 0, -30, 0, [[0, '#c8b78e'], [1, '#8d7c56']]), ink(0.55), 0.9);
    // steering column
    limb(g, 6, -54, 3, -66, 2.6, '#8a8e90', '#3b3e40', false);
    // kid seated (scaled)
    g.save(); g.translate(-22, -45); g.scale(0.9, 0.9);
    limb(g, 2, -3, 14, -6, 8.6, SHORT[0], SHORT[1]); // thigh
    limb(g, 14, -6, 20, 10, 4.6, SKIN[0], SKIN[1]);
    rr(g, 18, 8, 7, 3.6, 1, '#efe6d0', ink(0.3), 0.5); bootSide(g, 20, 20);
    // far arm
    limb(g, 2, -26, 14, -22, 4.8, SHIRT[0], SHIRT[1]);
    limb(g, -1, -2, 1, -26, 13, SHIRT[0], SHIRT[1]);
    rr(g, -7, -5, 14, 3.4, 1.2, '#6a4b2f', ink(0.4), 0.6);
    limb(g, 1, -26, 2, -31, 4.6, SKIN[0], SKIN[1], false);
    headSide(g, 4, -39);
    limb(g, 0, -26, 10, -20, 5.6, SHIRT[0], SHIRT[1]);
    rr(g, 8, -22, 5, 3.2, 1.2, '#e8b496', ink(0.45), 0.5);
    limb(g, 11, -20, 22, -18, 4, SKIN[0], SKIN[1]); ell(g, 23, -18, 2.6, 2.6, 0, SKIN[0], ink(0.4), 0.6);
    g.restore();
    // steering wheel
    g.save(); g.translate(6, -69); g.rotate(-0.25); ell(g, 0, 0, 3.4, 8.5, 0, null, '#1b1b1b', 2.4); ell(g, 0, 0, 3.4, 8.5, 0, null, 'rgba(255,255,255,.2)', 0.7); line(g, 0, -8, 0, 8, '#222', 1); ell(g, 0, 0, 1.6, 1.8, 0, '#d9a31e'); g.restore();
    // rear big near wheel with tread
    const wx = -27, wy = -16, R = 16.5;
    ell(g, wx, wy, R, R, 0, lin(g, wx, wy - R, wx, wy + R, [[0, '#474745'], [1, '#141413']]), '#000', 1);
    for (let i = 0; i < 32; i++) { const a = i / 32 * TAU; g.strokeStyle = 'rgba(170,170,160,.45)'; g.lineWidth = 1.5; g.beginPath(); g.moveTo(wx + Math.cos(a) * (R - 3.5), wy + Math.sin(a) * (R - 3.5)); g.lineTo(wx + Math.cos(a + 0.28) * R, wy + Math.sin(a + 0.28) * R); g.stroke(); }
    ell(g, wx, wy, R - 5, R - 5, 0, lin(g, wx - 6, wy - 8, wx + 6, wy + 8, [[0, '#4f4f4d'], [1, '#232322']]), 'rgba(0,0,0,.6)', 0.8);
    ell(g, wx, wy, 7.2, 7.2, 0, lin(g, wx - 6, wy - 8, wx + 6, wy + 8, [[0, '#d8dad6'], [1, '#7c8082']]), 'rgba(0,0,0,.6)', 0.8);
    for (let i = 0; i < 5; i++) { const a = i / 5 * TAU; bolt(g, wx + Math.cos(a) * 4.3, wy + Math.sin(a) * 4.3); }
    ell(g, wx - 4, wy - 8, 6, 2.4, -0.6, 'rgba(255,255,255,.12)');
    // front near wheel
    const fx = 30, fy = -9, fr = 9.5;
    ell(g, fx, fy, fr, fr, 0, lin(g, fx, fy - fr, fx, fy + fr, [[0, '#454543'], [1, '#161615']]), '#000', 0.9);
    for (let i = 0; i < 20; i++) { const a = i / 20 * TAU; line(g, fx + Math.cos(a) * (fr - 2), fy + Math.sin(a) * (fr - 2), fx + Math.cos(a) * fr, fy + Math.sin(a) * fr, 'rgba(170,170,160,.4)', 1); }
    ell(g, fx, fy, 4.4, 4.4, 0, lin(g, fx - 3, fy - 4, fx + 3, fy + 4, [[0, '#d8dad6'], [1, '#7c8082']]), 'rgba(0,0,0,.6)', 0.7); bolt(g, fx, fy);
    // fender above rear wheel
    g.beginPath(); g.moveTo(-45, -26); g.quadraticCurveTo(-27, -40, -9, -26); g.lineTo(-11, -23); g.quadraticCurveTo(-27, -35, -43, -23); g.closePath();
    g.fillStyle = lin(g, 0, -40, 0, -23, [[0, '#4f9a62'], [1, '#1e4a2c']]); g.fill(); g.strokeStyle = 'rgba(8,30,16,.8)'; g.lineWidth = 0.8; g.stroke();
    g.restore();
  }

  /* ----------------------------------------------------------- TREES */
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
    // moss on the shaded-by-nothing left base
    for (let i = 0; i < 26; i++) { const yy = y - r() * h * 0.28, xx = x - w0 * 0.5 - flare * 0.3 + r() * w0 * 0.5; ell(g, xx, yy, 1 + r() * 2.2, 0.8 + r(), 0, ramp(['#33582c', '#6a9c3e', '#a7c75a'], r()), null); }
    g.restore();
    path(); g.strokeStyle = ink(0.55); g.lineWidth = 1; g.stroke();
    return [x + sway * Math.sin(2.4), y - h];
  }
  function tree(g, x, y, o) {
    const r = MKx.rng(o.seed);
    const rx = o.cw / 2, ry = o.ch / 2, cy = y - o.cy;
    shadow(g, x + rx * 0.3, y + 6, rx * 0.95, rx * 0.34, 0.36);
    for (let i = 0; i < 22; i++) { const a = r() * TAU, d = Math.sqrt(r()); ell(g, x + rx * 0.25 + Math.cos(a) * d * rx * 0.7, y + 6 + Math.sin(a) * d * rx * 0.22, 1.5 + r() * 3, 0.8 + r() * 1.2, 0, 'rgba(210,255,150,.12)'); }
    // roots
    for (const s of [-1, 1]) taper(g, x + s * o.tw0 * 0.3, y - 4, x + s * o.tw0 * 0.8, y + 1, x + s * o.tw0 * 1.3, y + 3, 7, 1.5, '#4a3524');
    const top = trunk(g, x, y, o.th, o.tw0, o.tw1, o.flare, o.sway, r);
    const tx = top[0], ty = top[1];
    ell(g, x, cy + ry * 0.05, rx * 0.86, ry * 0.8, 0, 'rgba(18,48,26,.95)');
    // branches
    const lim = [[-0.55, -0.3], [0.5, -0.4], [-0.2, -0.75], [0.25, -0.7], [-0.75, -0.62], [0.8, -0.55]];
    lim.forEach((b, i) => taper(g, tx + (i % 2 ? 2 : -2), ty + 14 - i * 2, tx + b[0] * rx * 0.3, ty - 10, tx + b[0] * rx * 0.75, cy + b[1] * ry * 0.5, o.tw1 * 0.55, 2.2, ramp(['#4c3626', '#8a6a48'], 0.5 - b[0] * 0.3), ink(0.4)));
    // clusters
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
    // dappled highlights top-left
    for (let i = 0; i < o.leaves * 0.6; i++) { const a = r() * TAU, d = Math.sqrt(r()); const px = x - rx * 0.25 + Math.cos(a) * d * rx * 0.6, py = cy - ry * 0.35 + Math.sin(a) * d * ry * 0.45; g.save(); g.translate(px, py); g.rotate(r() * TAU); g.fillStyle = 'rgba(235,240,150,.34)'; leaf(g, o.leafSz * 0.7); g.restore(); }
    // stray twigs/leaves at fringe
    for (let i = 0; i < 24; i++) { const a = r() * TAU, px = x + Math.cos(a) * rx * 0.97, py = cy + Math.sin(a) * ry * 0.95; g.save(); g.translate(px, py); g.rotate(a + r()); g.fillStyle = ramp(o.cols, 0.3 + r() * 0.5); leaf(g, o.leafSz * 0.9); g.restore(); }
    tuft(g, x - o.tw0 * 0.6, y + 2, 6, r, 12); tuft(g, x + o.tw0 * 0.7, y + 3, 6, r, 12);
  }

  /* ---------------------------------------------------------- ROCK */
  function rock(g, x, y) {
    const r = MKx.rng(77);
    shadow(g, x + 8, y + 3, 32, 9, 0.38);
    g.save(); g.translate(x, y);
    const P = [[-23, -2], [-25, -12], [-17, -24], [-4, -30], [10, -27], [21, -19], [25, -8], [20, 0], [0, 3]];
    g.beginPath(); P.forEach((p, i) => i ? g.lineTo(p[0], p[1]) : g.moveTo(p[0], p[1])); g.closePath();
    g.fillStyle = lin(g, -22, -30, 22, 2, [[0, '#b2ada0'], [0.45, '#8b877e'], [1, '#55544f']]); g.fill();
    g.save(); g.clip();
    // top face (lighter) and facets
    poly(g, [[-17, -24], [-4, -30], [10, -27], [21, -19], [6, -17], [-10, -16]], 'rgba(235,230,214,.38)');
    poly(g, [[-25, -12], [-17, -24], [-10, -16], [-14, -2], [-23, -2]], 'rgba(255,255,240,.12)');
    poly(g, [[6, -17], [21, -19], [25, -8], [20, 0], [8, 2]], 'rgba(40,40,45,.28)');
    // strata
    for (let i = 0; i < 6; i++) { const yy = -26 + i * 5; g.strokeStyle = i % 2 ? 'rgba(50,48,44,.3)' : 'rgba(240,236,220,.28)'; g.lineWidth = 0.8; g.beginPath(); g.moveTo(-26, yy + 4); g.bezierCurveTo(-10, yy - 2 + r() * 3, 8, yy + 4 + r() * 3, 26, yy - 2); g.stroke(); }
    // cracks
    g.strokeStyle = 'rgba(30,28,26,.55)'; g.lineWidth = 0.8; g.beginPath(); g.moveTo(2, -28); g.lineTo(0, -20); g.lineTo(5, -13); g.lineTo(3, -7); g.stroke();
    // speckle
    for (let i = 0; i < 70; i++) { const px = -24 + r() * 48, py = -30 + r() * 32; g.fillStyle = r() > 0.5 ? 'rgba(255,255,245,.25)' : 'rgba(30,30,30,.22)'; g.fillRect(px, py, 1, 1); }
    // lichen
    [[-8, -22, 5], [6, -24, 4], [14, -14, 3.5], [-15, -10, 3]].forEach((l) => { for (let i = 0; i < 12; i++) ell(g, l[0] + (r() - 0.5) * l[2] * 2, l[1] + (r() - 0.5) * l[2], 0.8 + r() * 1.3, 0.7 + r(), 0, r() > 0.4 ? 'rgba(200,214,130,.8)' : 'rgba(230,200,100,.75)'); });
    // moss base
    for (let i = 0; i < 40; i++) ell(g, -24 + r() * 30, -r() * 8, 1.4 + r() * 2.4, 1 + r() * 1.6, 0, ramp(['#35582d', '#6b9d3d', '#a2c457'], r()));
    g.restore();
    g.strokeStyle = 'rgba(40,36,30,.6)'; g.lineWidth = 1; g.beginPath(); P.forEach((p, i) => i ? g.lineTo(p[0], p[1]) : g.moveTo(p[0], p[1])); g.closePath(); g.stroke();
    g.restore();
    tuft(g, x - 20, y + 2, 7, r, 14); tuft(g, x + 4, y + 4, 8, r, 11); tuft(g, x + 22, y + 1, 6, r, 13);
  }

  /* -------------------------------------------------------- FLOWERS */
  function leafBlade(g, x, y, ang, len, w, c1, c2) {
    g.save(); g.translate(x, y); g.rotate(ang);
    g.beginPath(); g.moveTo(0, 0); g.quadraticCurveTo(len * 0.5, -w, len, 0); g.quadraticCurveTo(len * 0.5, w * 0.7, 0, 0); g.fillStyle = lin(g, 0, 0, len, 0, [[0, c1], [1, c2]]); g.fill();
    g.strokeStyle = 'rgba(15,60,20,.35)'; g.lineWidth = 0.6; g.stroke(); g.strokeStyle = 'rgba(210,240,150,.4)'; g.beginPath(); g.moveTo(1, 0); g.lineTo(len * 0.9, 0); g.stroke(); g.restore();
  }
  function stem(g, x0, y0, x1, y1, w) { g.strokeStyle = ink(0.35); g.lineWidth = w + 1; g.lineCap = 'round'; g.beginPath(); g.moveTo(x0, y0); g.quadraticCurveTo((x0 + x1) / 2 + (x1 - x0) * 0.3, (y0 + y1) / 2, x1, y1); g.stroke(); g.strokeStyle = '#4c8a3c'; g.lineWidth = w; g.stroke(); g.strokeStyle = '#8cc060'; g.lineWidth = w * 0.35; g.stroke(); }
  function petalHead(g, cx, cy, n, plen, pw, squash, c1, c2, vein, rot) {
    const arr = []; for (let i = 0; i < n; i++) arr.push(i / n * TAU + (rot || 0)); arr.sort((a, b) => Math.sin(a) - Math.sin(b));
    for (const a of arr) {
      g.save(); g.translate(cx, cy); g.scale(1, squash); g.rotate(a);
      g.beginPath(); g.moveTo(plen * 0.1, 0); g.bezierCurveTo(plen * 0.3, -pw * 1.2, plen * 0.85, -pw, plen, 0); g.bezierCurveTo(plen * 0.85, pw, plen * 0.3, pw * 1.2, plen * 0.1, 0);
      g.fillStyle = lin(g, 0, 0, plen, 0, [[0, c2], [1, c1]]); g.fill(); g.strokeStyle = vein; g.lineWidth = 0.6; g.stroke();
      g.strokeStyle = vein; g.globalAlpha = 0.6; g.beginPath(); g.moveTo(plen * 0.15, 0); g.lineTo(plen * 0.88, 0); g.stroke(); g.globalAlpha = 1; g.restore();
    }
  }
  function flowers(g, x, y) {
    const r = MKx.rng(31);
    for (let k = 0; k < 4; k++) shadow(g, x + k * 60 + 6, y + 2, 22, 6, 0.28);
    // 0 daisy
    let px = x;
    [[-12, -6, -26, 7], [8, -2, -34, 8], [-2, -4, -20, 6], [14, -6, -22, 6], [-16, -2, -18, 6]].forEach((f, i) => { stem(g, px + f[0] * 0.3, y, px + f[0], y + f[2], 1.4); leafBlade(g, px + f[0] * 0.3, y - 3, -2.4 + i * 0.5, 9, 2.4, '#3a7d3a', '#78b24c'); });
    leafBlade(g, px - 3, y, -2.6, 14, 3.4, '#2f6a33', '#6aa845'); leafBlade(g, px + 3, y, -0.5, 14, 3.4, '#2f6a33', '#6aa845');
    [[-12, -26, 6.5], [8, -34, 8], [-2, -20, 5.5], [14, -22, 5.5], [-16, -18, 5]].forEach((f, i) => {
      const cx = px + f[0], cy = y + f[1];
      petalHead(g, cx, cy, 13, f[2], f[2] * 0.14 + 0.3, 0.82, '#fbfaf2', '#e8e2c8', 'rgba(120,120,100,.4)', i);
      ell(g, cx, cy, f[2] * 0.3, f[2] * 0.26, 0, lin(g, cx - 3, cy - 3, cx + 3, cy + 3, [[0, '#f6d34a'], [1, '#c68a1c']]), 'rgba(110,70,10,.5)', 0.5);
      for (let j = 0; j < 8; j++) ell(g, cx + (r() - 0.5) * f[2] * 0.4, cy + (r() - 0.5) * f[2] * 0.3, 0.5, 0.5, 0, 'rgba(120,70,10,.6)');
    });
    // 1 poppies + tulip
    px = x + 60;
    leafBlade(g, px - 3, y, -2.5, 15, 3.4, '#2f6a33', '#6aa845'); leafBlade(g, px + 3, y, -0.6, 15, 3.4, '#2f6a33', '#6aa845'); leafBlade(g, px, y, -1.57, 16, 3, '#3a7d3a', '#78b24c');
    [[-10, -34], [8, -40], [0, -24], [14, -26]].forEach((f, i) => {
      stem(g, px + f[0] * 0.3, y, px + f[0], y + f[1], 1.3);
      const cx = px + f[0], cy = y + f[1] - 2;
      if (i === 3) { // tulip
        g.beginPath(); g.moveTo(cx - 5, cy + 6); g.bezierCurveTo(cx - 8, cy - 4, cx - 4, cy - 10, cx - 3, cy - 12); g.lineTo(cx, cy - 7); g.lineTo(cx + 3, cy - 12); g.bezierCurveTo(cx + 4, cy - 10, cx + 8, cy - 4, cx + 5, cy + 6); g.bezierCurveTo(cx + 2, cy + 9, cx - 2, cy + 9, cx - 5, cy + 6); g.closePath();
        g.fillStyle = lin(g, cx - 6, cy - 10, cx + 6, cy + 8, [[0, '#f0a24a'], [0.5, '#e2503a'], [1, '#a82a26']]); g.fill(); g.strokeStyle = 'rgba(100,20,20,.6)'; g.lineWidth = 0.7; g.stroke();
        g.strokeStyle = 'rgba(255,230,180,.5)'; g.beginPath(); g.moveTo(cx - 2, cy + 6); g.quadraticCurveTo(cx - 3, cy - 2, cx - 1, cy - 8); g.moveTo(cx + 2, cy + 6); g.quadraticCurveTo(cx + 3, cy - 2, cx + 1, cy - 7); g.stroke();
      } else {
        petalHead(g, cx, cy, 5, 8.5, 5.2, 0.85, '#d9382a', '#9c1f1c', 'rgba(110,15,15,.5)', i * 0.7);
        ell(g, cx, cy, 2.8, 2.4, 0, '#2a1d1a');
        for (let j = 0; j < 12; j++) { const a = j / 12 * TAU; line(g, cx + Math.cos(a) * 2.6, cy + Math.sin(a) * 2.2, cx + Math.cos(a) * 4.2, cy + Math.sin(a) * 3.4, '#2a1d1a', 0.6); ell(g, cx + Math.cos(a) * 4.3, cy + Math.sin(a) * 3.5, 0.55, 0.55, 0, '#e6c250'); }
      }
    });
    // 2 aster
    px = x + 120;
    leafBlade(g, px - 3, y, -2.7, 12, 2.8, '#2f6a33', '#6aa845'); leafBlade(g, px + 3, y, -0.4, 12, 2.8, '#2f6a33', '#6aa845');
    [[-14, -22, 7], [0, -34, 8.5], [14, -24, 7], [-6, -14, 5.5], [8, -12, 5.5]].forEach((f, i) => {
      stem(g, px + f[0] * 0.25, y, px + f[0], y + f[1], 1.2);
      for (let j = 0; j < 4; j++) leafBlade(g, px + f[0] * 0.25 * (1 - j * 0.1), y + f[1] * 0.25 * (j + 1) * 0.6, -1.2 + (i + j) % 2 * -1.8, 5, 1.2, '#3a7d3a', '#78b24c');
    });
    [[-14, -22, 7], [0, -34, 8.5], [14, -24, 7], [-6, -14, 5.5], [8, -12, 5.5]].forEach((f, i) => {
      const cx = px + f[0], cy = y + f[1];
      petalHead(g, cx, cy, 22, f[2], 0.7, 0.8, '#8a7ad8', '#5b4aa8', 'rgba(60,40,120,.4)', i);
      petalHead(g, cx, cy, 14, f[2] * 0.7, 0.7, 0.8, '#b3a6ee', '#7a68c8', 'rgba(60,40,120,.3)', i + 0.2);
      ell(g, cx, cy, f[2] * 0.26, f[2] * 0.22, 0, '#f0c53a', 'rgba(120,70,0,.5)', 0.4);
    });
    // 3 sunflower
    px = x + 180;
    stem(g, px, y, px + 3, y - 52, 3.4);
    leafBlade(g, px, y - 8, -2.7, 20, 7, '#2f6a33', '#7bb44c'); leafBlade(g, px, y - 20, -0.4, 20, 7, '#2f6a33', '#7bb44c'); leafBlade(g, px + 1, y - 36, -2.5, 16, 6, '#2f6a33', '#7bb44c');
    const sx = px + 3, sy = y - 56;
    petalHead(g, sx, sy, 16, 17, 3.4, 0.92, '#f6bf2c', '#d78a14', 'rgba(130,70,5,.45)', 0.1);
    petalHead(g, sx, sy, 16, 15, 3.2, 0.92, '#fbd03a', '#e39a1a', 'rgba(130,70,5,.4)', 0.2);
    ell(g, sx, sy, 9.6, 8.8, 0, lin(g, sx - 8, sy - 8, sx + 8, sy + 8, [[0, '#7d5428'], [0.6, '#4b2f17'], [1, '#2b1a0e']]), 'rgba(30,15,5,.6)', 0.8);
    for (let j = 0; j < 80; j++) { const a = j * 2.39996, d = Math.sqrt(j / 80) * 8.6; ell(g, sx + Math.cos(a) * d, sy + Math.sin(a) * d * 0.92, 0.7, 0.7, 0, j % 3 ? 'rgba(210,160,70,.55)' : 'rgba(30,18,8,.6)'); }
    ell(g, sx, sy, 9.6, 8.8, 0, null, 'rgba(190,130,40,.6)', 1);
    tuft(g, x + 20, y + 3, 5, r, 10); tuft(g, x + 100, y + 3, 5, r, 10); tuft(g, x + 160, y + 3, 5, r, 10);
  }

  /* ---------------------------------------------------------- GNOME */
  function gnome(g, x, y) {
    g.save(); g.translate(x, y);
    shadow(g, 5, 1, 17, 5.5, 0.34);
    const lf = (cx0) => lin(g, cx0 - 8, 0, cx0 + 8, 0, [[0, BOOT[0]], [1, BOOT[1]]]);
    rr(g, -9, -6, 8, 6.5, 2.5, lf(-5), ink(0.55), 0.8); rr(g, 1, -6, 8, 6.5, 2.5, lf(5), ink(0.55), 0.8);
    rr(g, -8, -13, 16, 10, 3, lin(g, -8, 0, 8, 0, [[0, '#5a7aa8'], [1, '#34506f']]), ink(0.5), 0.8);
    line(g, 0, -12, 0, -4, ink(0.35), 0.7);
    // coat
    g.beginPath(); g.moveTo(-9.5, -9); g.bezierCurveTo(-11, -20, -9, -24, -6, -27); g.lineTo(6, -27); g.bezierCurveTo(9, -24, 11, -20, 9.5, -9); g.closePath();
    g.fillStyle = lin(g, -10, -27, 10, -9, [[0, '#c8553d'], [1, '#8a2f24']]); g.fill(); g.strokeStyle = ink(0.5); g.lineWidth = 0.9; g.stroke();
    rr(g, -10, -17, 20, 3.4, 1, '#3d2a1c', ink(0.4), 0.6); rr(g, -2, -17, 4, 3.4, 0.8, '#d9b44a');
    // arms + hands
    ell(g, -10.5, -15, 3, 3, 0, '#e9bb92', ink(0.4), 0.6); ell(g, 10.5, -15, 3, 3, 0, '#e9bb92', ink(0.4), 0.6);
    // head: beard + nose
    g.beginPath(); g.moveTo(-8.5, -27); g.bezierCurveTo(-11, -20, -6, -10, 0, -8); g.bezierCurveTo(6, -10, 11, -20, 8.5, -27); g.closePath();
    g.fillStyle = lin(g, -8, -27, 8, -8, [[0, '#fbf7ea'], [1, '#c9c4b0']]); g.fill(); g.strokeStyle = ink(0.4); g.lineWidth = 0.8; g.stroke();
    g.strokeStyle = 'rgba(120,110,90,.45)'; g.lineWidth = 0.6; for (let i = -2; i <= 2; i++) { g.beginPath(); g.moveTo(i * 2.2, -24); g.quadraticCurveTo(i * 2.6, -17, i * 1.2, -10.5); g.stroke(); }
    ell(g, 0, -29, 6, 4.4, 0, '#e9bb92', ink(0.4), 0.7);
    ell(g, 0, -27.4, 3, 2.6, 0, '#e08d72', ink(0.4), 0.6); ell(g, -0.8, -28, 1, 0.8, 0, 'rgba(255,255,255,.5)');
    ell(g, -2.6, -30.6, 0.8, 0.9, 0, '#2d1d14'); ell(g, 2.6, -30.6, 0.8, 0.9, 0, '#2d1d14');
    // hat
    g.beginPath(); g.moveTo(-7.5, -32); g.bezierCurveTo(-8, -38, -3, -42, 2, -47); g.bezierCurveTo(4, -43, 8, -38, 7.5, -32); g.closePath();
    g.fillStyle = lin(g, -8, -47, 8, -32, [[0, '#e0553c'], [1, '#9a2a22']]); g.fill(); g.strokeStyle = ink(0.5); g.lineWidth = 0.9; g.stroke();
    g.strokeStyle = 'rgba(70,10,10,.35)'; g.lineWidth = 0.6; g.beginPath(); g.moveTo(-2, -41); g.lineTo(-4, -34); g.moveTo(2, -42); g.lineTo(3, -34); g.stroke();
    ell(g, -2, -42, 2, 1, -0.8, 'rgba(255,255,255,.25)');
    ell(g, 0, -32, 8.4, 2, 0, '#b6372c', ink(0.5), 0.7);
    // flecked paint wear
    for (let i = 0; i < 6; i++) ell(g, -6 + (i * 2.7) % 12, -20 + (i * 3) % 9, 0.6, 0.5, 0, 'rgba(240,220,190,.4)');
    g.restore();
  }
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

  /* ---------------------------------------------------------- FENCE */
  function fence(g, x, y) {
    const r = MKx.rng(55), W = 192;
    // cast shadow
    g.fillStyle = 'rgba(14,44,26,.16)'; poly(g, [[x + 2, y], [x + W + 6, y], [x + W + 18, y + 9], [x + 12, y + 9]]);
    g.fillStyle = 'rgba(14,44,26,.14)'; poly(g, [[x + 2, y], [x + W + 4, y], [x + W + 12, y + 5], [x + 8, y + 5]]);
    for (const ry of [-14, -31]) { rr(g, x, y + ry, W, 5, 1, lin(g, 0, y + ry, 0, y + ry + 5, [[0, '#a98a64'], [1, '#6e5438']]), ink(0.5), 0.7); line(g, x, y + ry + 1, x + W, y + ry + 1, 'rgba(255,235,200,.3)', 0.7); }
    for (let i = 0; i <= 4; i++) {
      const px = x + i * 48;
      rr(g, px - 4, y - 47, 8, 47, 1.5, lin(g, px - 4, 0, px + 4, 0, [[0, '#cbb48e'], [0.5, '#a68c66'], [1, '#6e5438']]), ink(0.55), 0.8);
      poly(g, [[px - 5, y - 47], [px, y - 52], [px + 5, y - 47]], lin(g, px - 5, 0, px + 5, 0, [[0, '#e0cca4'], [1, '#8c7250']]), ink(0.55), 0.8);
      g.strokeStyle = ink(0.22); g.lineWidth = 0.6; g.beginPath(); g.moveTo(px - 1, y - 45); g.quadraticCurveTo(px - 2, y - 25, px, y - 4); g.stroke();
    }
    for (let i = 0; i < 4; i++) for (let j = 0; j < 4; j++) {
      const px = x + i * 48 + 6 + j * 10.5, h = 39 + ((r() * 3) | 0) - 1, w = 8;
      g.beginPath(); g.moveTo(px, y); g.lineTo(px, y - h + 5); g.lineTo(px + w / 2, y - h); g.lineTo(px + w, y - h + 5); g.lineTo(px + w, y); g.closePath();
      g.fillStyle = lin(g, px, 0, px + w, 0, [[0, '#f3eddc'], [0.55, '#e0d7bf'], [1, '#b9ab8a']]); g.fill(); g.strokeStyle = ink(0.5); g.lineWidth = 0.8; g.stroke();
      // weathered patches + grain
      for (let k = 0; k < 3; k++) { g.fillStyle = 'rgba(140,120,90,.2)'; g.fillRect(px + r() * (w - 2), y - r() * (h - 8) - 3, 1.5, 2 + r() * 5); }
      g.strokeStyle = 'rgba(110,90,60,.3)'; g.lineWidth = 0.5;
      for (let k = 1; k < 4; k++) { g.beginPath(); g.moveTo(px + k * w / 4, y); g.bezierCurveTo(px + k * w / 4 + 1, y - h * 0.3, px + k * w / 4 - 1, y - h * 0.6, px + k * w / 4 + 0.4, y - h + 6); g.stroke(); }
      if (r() > 0.6) { ell(g, px + w / 2, y - h * (0.3 + r() * 0.4), 1.2, 1.6, 0, 'rgba(110,80,50,.45)'); }
      line(g, px + 0.8, y - h + 5, px + 0.8, y - 1, 'rgba(255,255,255,.4)', 0.7);
      ell(g, px + w / 2, y - 31 + 2, 0.6, 0.6, 0, 'rgba(60,50,40,.7)'); ell(g, px + w / 2, y - 14 + 2, 0.6, 0.6, 0, 'rgba(60,50,40,.7)');
      // cast shadow of picket on the rail
      g.fillStyle = 'rgba(40,30,20,.12)'; g.fillRect(px + w, y - 32, 2, 36);
    }
    for (let i = 0; i < 12; i++) tuft(g, x + r() * W, y + 2, 2, r, 9);
    // leaning vines hint
    for (let i = 0; i < 8; i++) { const px = x + 100 + i * 2.5; leafBlade(g, px, y - 4 - i * 2, -1.2 + (i % 2) * -0.9, 5, 1.8, '#2f6a33', '#7ab04c'); }
  }

  /* ---------------------------------------------------------- HEDGE */
  const HCOL = ['#143a28', '#22583a', '#37773f', '#5a9a4a', '#8bbb5e'];
  function hedge(g, x, y) {
    const r = MKx.rng(91), W = 192;
    g.fillStyle = 'rgba(14,44,26,.2)'; poly(g, [[x + 2, y], [x + W + 4, y], [x + W + 18, y + 10], [x + 12, y + 10]]);
    shadow(g, x + W / 2 + 8, y + 5, W / 2 + 6, 7, 0.28);
    // base mass
    MKx.rr(g, x - 3, y - 52, W + 6, 52, 14); g.fillStyle = lin(g, 0, y - 52, 0, y, [[0, '#2b6a3c'], [1, '#12351f']]); g.fill();
    // front face
    for (let row = 0; row < 2; row++) for (let i = 0; i < 9; i++) leafMass(g, x + 8 + i * 22.5 + row * 6, y - 14 - row * 8, 17, 11, 52, r, HCOL, 4.2, -0.05 + row * 0.12);
    // top face (lit)
    g.fillStyle = 'rgba(0,0,0,.18)'; g.fillRect(x, y - 36, W, 1);
    for (let i = 0; i < 10; i++) leafMass(g, x + 4 + i * 20, y - 42, 15, 10, 50, r, HCOL, 4.2, 0.38);
    // rim light left & sprigs
    for (let i = 0; i < 38; i++) {
      const px = x + r() * W, py = y - 50 + r() * 5, a = -Math.PI / 2 + (r() - 0.5) * 1.4;
      g.strokeStyle = ink(0.45); g.lineWidth = 0.9; g.beginPath(); g.moveTo(px, py + 2); g.lineTo(px + Math.cos(a) * 6, py + Math.sin(a) * 6); g.stroke();
      g.save(); g.translate(px + Math.cos(a) * 6, py + Math.sin(a) * 6); g.rotate(a); g.fillStyle = ramp(HCOL, 0.6 + r() * 0.4); leaf(g, 3.6); g.restore();
    }
    for (let i = 0; i < 14; i++) { const px = x + r() * W, py = y - 10 - r() * 28; ell(g, px, py, 1.1, 1.1, 0, '#f5efd8'); }
    // trimmed edge shadow lines
    g.strokeStyle = 'rgba(8,30,16,.5)'; g.lineWidth = 1; g.beginPath(); g.moveTo(x + 2, y - 33); for (let i = 0; i <= 24; i++) g.lineTo(x + 2 + i * 7.9, y - 33 + Math.sin(i * 1.7) * 1.2); g.stroke();
    for (let i = 0; i < 14; i++) tuft(g, x + r() * W, y + 3, 2, r, 9);
    // left end cap highlight
    for (let i = 0; i < 18; i++) leaf2(g, x - 2 + r() * 4, y - 6 - r() * 40, r);
  }
  function leaf2(g, x, y, r) { g.save(); g.translate(x, y); g.rotate(r() * TAU); g.fillStyle = ramp(HCOL, 0.5 + r() * 0.5); leaf(g, 3.5); g.restore(); }

  /* ---------------------------------------------------------- HOUSE */
  function house(g, x, y) {
    const r = MKx.rng(13), W = 144, wallTop = y - 62, roofTop = y - 108;
    g.fillStyle = 'rgba(14,44,26,.3)'; poly(g, [[x - 4, y], [x + W + 8, y], [x + W + 30, y + 12], [x + 12, y + 12]]);
    shadow(g, x + W / 2 + 10, y + 7, W / 2 + 10, 8, 0.22);
    // wall
    rr(g, x, wallTop, W, 56, 0, lin(g, x, 0, x + W, 0, [[0, '#efe3c3'], [1, '#d6c6a0']]));
    for (let yy = wallTop + 3; yy < y - 6; yy += 5.5) { line(g, x, yy, x + W, yy, 'rgba(110,90,60,.38)', 0.9); line(g, x, yy + 1.1, x + W, yy + 1.1, 'rgba(255,250,230,.45)', 0.7); }
    for (let i = 0; i < 40; i++) { const px = x + r() * W, py = wallTop + 4 + r() * 46; line(g, px, py, px + 3 + r() * 6, py, 'rgba(140,110,70,.22)', 0.8); }
    g.fillStyle = lin(g, 0, wallTop, 0, wallTop + 16, [[0, 'rgba(40,20,10,.45)'], [1, 'rgba(40,20,10,0)']]); g.fillRect(x, wallTop, W, 16);
    // foundation stones
    for (let i = 0; i < 12; i++) rr(g, x + i * 12.2, y - 7, 12.2, 7, 2, ramp(['#8d887c', '#aaa597', '#6e6a62'], r()), ink(0.4), 0.6);
    // corner boards
    rr(g, x - 1, wallTop, 4, 56, 0, '#fbf5e2', ink(0.4), 0.6); rr(g, x + W - 3, wallTop, 4, 56, 0, '#cbbb94', ink(0.4), 0.6);
    // door
    const dx = x + 14;
    rr(g, dx - 3, y - 54, 30, 50, 1, '#fbf5e2', ink(0.5), 0.8);
    rr(g, dx, y - 51, 24, 47, 1, lin(g, dx, 0, dx + 24, 0, [[0, '#6e9a8e'], [1, '#456b62']]), ink(0.55), 0.8);
    [[3, 4], [13, 4]].forEach((p) => { rr(g, dx + p[0], y - 47, 8, 17, 1, null, 'rgba(10,40,35,.5)', 0.8); rr(g, dx + p[0], y - 26, 8, 17, 1, null, 'rgba(10,40,35,.5)', 0.8); });
    ell(g, dx + 20, y - 27, 1.4, 1.4, 0, '#e3c15a', 'rgba(60,40,0,.6)', 0.5);
    line(g, dx + 2, y - 50, dx + 2, y - 5, 'rgba(255,255,255,.18)', 1);
    rr(g, dx - 5, y - 5, 34, 5, 1, '#b7b1a2', ink(0.5), 0.7);
    // window + shutters + flower box
    const wx = x + 84, wy = y - 56;
    for (const s of [0, 1]) { const sx = wx - 12 + s * 56; rr(g, sx, wy + 2, 10, 32, 1, lin(g, sx, 0, sx + 10, 0, [[0, '#4b7a52'], [1, '#2c503a']]), ink(0.55), 0.7); for (let k = 0; k < 6; k++) line(g, sx + 1, wy + 6 + k * 5, sx + 9, wy + 6 + k * 5, 'rgba(10,30,15,.4)', 0.8); }
    rr(g, wx - 2, wy, 36, 36, 1.5, '#fbf5e2', ink(0.55), 0.8);
    rr(g, wx + 1, wy + 3, 30, 30, 0.5, lin(g, wx, wy, wx + 30, wy + 30, [[0, '#cfe6ee'], [0.5, '#8fb7c6'], [1, '#4f7488']]), ink(0.6), 0.8);
    poly(g, [[wx + 3, wy + 31], [wx + 12, wy + 5], [wx + 18, wy + 5], [wx + 9, wy + 31]], 'rgba(255,255,255,.22)');
    line(g, wx + 16, wy + 3, wx + 16, wy + 33, '#fbf5e2', 2); line(g, wx + 1, wy + 18, wx + 31, wy + 18, '#fbf5e2', 2);
    rr(g, wx - 5, wy + 36, 42, 4, 1, '#e9dfc4', ink(0.5), 0.7);
    rr(g, wx - 3, wy + 31, 38, 8, 1.5, lin(g, 0, wy + 31, 0, wy + 39, [[0, '#8a6240'], [1, '#5a3d26']]), ink(0.55), 0.7);
    for (let i = 0; i < 9; i++) { const fx = wx - 1 + i * 4.4; leafBlade(g, fx, wy + 32, -1.57 + (i % 2 ? 0.5 : -0.5), 6, 1.6, '#2f6a33', '#6aa845'); }
    [[0, '#e8657a'], [1, '#f6e6ec'], [2, '#e8657a'], [3, '#f0b94a'], [4, '#f6e6ec'], [5, '#e8657a'], [6, '#f0b94a']].forEach((f) => ell(g, wx + 2 + f[0] * 5.2, wy + 28 - (f[0] % 2) * 2, 2.3, 2, 0, f[1], 'rgba(90,30,40,.4)', 0.4));
    // lantern
    rr(g, x + 50, y - 40, 5, 8, 1.5, '#2a2a28'); ell(g, x + 52.5, y - 36, 1.4, 1.8, 0, '#ffd877');
    // eave shadow on wall already; roof
    const rows = 8, rh = 5.6;
    g.beginPath(); g.moveTo(x - 7, wallTop + 1); g.lineTo(x + 5, roofTop); g.lineTo(x + W - 5, roofTop); g.lineTo(x + W + 7, wallTop + 1); g.closePath();
    g.fillStyle = '#6a3a2c'; g.fill();
    g.save(); g.clip();
    for (let row = rows - 1; row >= 0; row--) {
      const ry = roofTop + row * rh, off = (row % 2) * 6.5;
      for (let sx = x - 20; sx < x + W + 20; sx += 13) {
        const sxx = sx + off, c = ramp(['#6b3a2d', '#8c5340', '#a3684f', '#7a4a3a'], r());
        const gr = lin(g, 0, ry, 0, ry + rh + 3, [[0, c], [1, 'rgba(40,18,12,1)']]);
        g.beginPath(); g.moveTo(sxx, ry); g.lineTo(sxx + 13, ry); g.lineTo(sxx + 13, ry + rh + 1); g.quadraticCurveTo(sxx + 6.5, ry + rh + 3.4, sxx, ry + rh + 1); g.closePath();
        g.fillStyle = c; g.fill(); g.fillStyle = 'rgba(30,12,8,.3)'; g.fill(); g.fillStyle = c; g.globalAlpha = 0.75; g.fill(); g.globalAlpha = 1;
        g.strokeStyle = 'rgba(30,12,8,.55)'; g.lineWidth = 0.7; g.stroke();
        line(g, sxx + 1.5, ry + 1, sxx + 1.5, ry + rh, 'rgba(255,220,190,.18)', 0.7);
      }
      // row shadow lines
      line(g, x - 20, ry + rh + 1.4, x + W + 20, ry + rh + 1.4, 'rgba(30,12,8,.35)', 1.2);
    }
    // sunlight gradient across roof (top-left light)
    g.fillStyle = lin(g, x, roofTop, x + W, wallTop, [[0, 'rgba(255,230,170,.22)'], [1, 'rgba(10,10,40,.2)']]); g.fillRect(x - 10, roofTop, W + 20, 50);
    // moss
    for (let i = 0; i < 70; i++) { const cxm = r() > 0.5 ? 30 : 100, px = x + cxm + (r() - 0.5) * 34, py = roofTop + 18 + r() * 24; ell(g, px, py, 0.8 + r() * 1.8, 0.6 + r() * 1.1, 0, ramp(['#2f542b', '#5f913a', '#9ac056'], r()) ); }
    // ridge cap
    rr(g, x + 2, roofTop - 3, W - 4, 5, 2, lin(g, 0, roofTop - 3, 0, roofTop + 2, [[0, '#a26b52'], [1, '#5a3024']]), 'rgba(30,12,8,.6)', 0.8);
    g.restore();
    g.strokeStyle = ink(0.5); g.lineWidth = 0.9; g.beginPath(); g.moveTo(x - 7, wallTop + 1); g.lineTo(x + 5, roofTop); g.lineTo(x + W - 5, roofTop); g.lineTo(x + W + 7, wallTop + 1); g.stroke();
    // fascia
    rr(g, x - 8, wallTop - 1, W + 16, 4.5, 1.5, lin(g, 0, wallTop - 1, 0, wallTop + 4, [[0, '#fbf5e2'], [1, '#b5a47c']]), ink(0.55), 0.8);
    // path stones from door
    const st = [[27, 8, 15, 6], [32, 21, 14, 6.5], [25, 35, 16, 6.5], [33, 49, 15, 6], [27, 62, 14, 5.5]];
    st.forEach((s, i) => {
      const sx = x + s[0], sy = y + s[1];
      blob(g, sx, sy + 1.5, s[2] + 1.4, s[3] + 1.4, 40 + i, 0.15); g.fillStyle = 'rgba(14,44,26,.35)'; g.fill();
      blob(g, sx, sy, s[2], s[3], 60 + i, 0.2); g.fillStyle = lin(g, sx - s[2], sy - s[3], sx + s[2], sy + s[3], [[0, '#cfc8b4'], [1, '#948d7c']]); g.fill(); g.strokeStyle = ink(0.45); g.lineWidth = 0.8; g.stroke();
      g.strokeStyle = 'rgba(255,255,245,.35)'; g.lineWidth = 0.7; g.beginPath(); g.moveTo(sx - s[2] * 0.7, sy - s[3] * 0.3); g.quadraticCurveTo(sx - s[2] * 0.3, sy - s[3] * 0.75, sx + s[2] * 0.3, sy - s[3] * 0.7); g.stroke();
      for (let k = 0; k < 5; k++) ell(g, sx - s[2] + r() * s[2] * 2, sy + (r() - 0.5) * s[3], 0.5, 0.4, 0, 'rgba(60,55,45,.35)');
      tuft(g, sx - s[2] - 2, sy + 2, 2, r, 8); tuft(g, sx + s[2] + 2, sy + 2, 2, r, 8);
      for (let k = 0; k < 4; k++) ell(g, sx - s[2] * 0.8 + r() * s[2] * 1.6, sy + s[3] * 0.7, 1.5, 0.8, 0, 'rgba(100,150,60,.7)');
    });
  }

  /* ----------------------------------------------------------- POND */
  function pond(g, x, y) {
    const r = MKx.rng(21), cx = x, cy = y - 2;
    // soft transition ring + sand
    blob(g, cx, cy, 99, 52, 5, 0.08); g.fillStyle = 'rgba(180,170,110,.35)'; g.fill();
    blob(g, cx, cy, 93, 47, 6, 0.1); g.fillStyle = lin(g, cx - 90, cy - 45, cx + 90, cy + 45, [[0, '#f0e0b2'], [1, '#c9b27c']]); g.fill();
    for (let i = 0; i < 160; i++) { const a = r() * TAU, d = 0.7 + r() * 0.3; g.fillStyle = r() > 0.5 ? 'rgba(130,100,50,.25)' : 'rgba(255,250,225,.45)'; g.fillRect(cx + Math.cos(a) * 90 * d, cy + Math.sin(a) * 45 * d, 1, 1); }
    // wet sand
    blob(g, cx, cy, 83, 41, 7, 0.1); g.fillStyle = 'rgba(120,96,56,.55)'; g.fill();
    // water
    blob(g, cx, cy, 78, 37, 8, 0.1); g.fillStyle = lin(g, cx - 70, cy - 36, cx + 60, cy + 40, [[0, '#93d0cc'], [0.45, '#4b9bb0'], [1, '#235e7a']]); g.fill();
    g.strokeStyle = 'rgba(40,70,70,.55)'; g.lineWidth = 1; g.stroke();
    g.save(); blob(g, cx, cy, 78, 37, 8, 0.1); g.clip();
    // depth vignette
    const rg = g.createRadialGradient(cx + 6, cy + 2, 8, cx + 6, cy + 2, 80); rg.addColorStop(0, 'rgba(16,60,84,.0)'); rg.addColorStop(1, 'rgba(16,60,84,.5)'); g.fillStyle = rg; g.fillRect(cx - 90, cy - 50, 180, 100);
    // sky reflection streaks
    for (let i = 0; i < 18; i++) { const px = cx - 60 + r() * 100, py = cy - 28 + r() * 54; g.strokeStyle = `rgba(255,255,255,${0.12 + r() * 0.22})`; g.lineWidth = 1; g.beginPath(); g.moveTo(px, py); g.bezierCurveTo(px + 6, py - 1.6, px + 12, py + 1.6, px + 18 + r() * 12, py); g.stroke(); }
    // cloud reflection
    ell(g, cx - 30, cy - 14, 16, 5, 0, 'rgba(255,255,255,.14)'); ell(g, cx - 20, cy - 17, 10, 4, 0, 'rgba(255,255,255,.12)');
    // tree reflection
    ell(g, cx + 48, cy + 6, 14, 6, 0, 'rgba(24,70,48,.25)');
    // ripples
    [[cx + 8, cy + 2, 1], [cx - 34, cy + 14, 0.55]].forEach((p) => { for (let k = 1; k <= 3; k++) { g.strokeStyle = `rgba(255,255,255,${0.62 - k * 0.14})`; g.lineWidth = 1.2 - k * 0.15; g.beginPath(); g.ellipse(p[0], p[1], 8 * k * p[2] + 3, 3.6 * k * p[2] + 1.4, 0, 0.3 + k * 0.3, TAU - 0.5 - k * 0.2); g.stroke(); g.strokeStyle = `rgba(10,50,70,${0.18})`; g.beginPath(); g.ellipse(p[0] + 1, p[1] + 1.2, 8 * k * p[2] + 3, 3.6 * k * p[2] + 1.4, 0, 3.6 + k * 0.2, 5.3); g.stroke(); } });
    // lily pads
    [[cx + 40, cy - 14, 9, 1], [cx + 53, cy - 6, 6, 2], [cx - 52, cy + 6, 7, 3]].forEach((p) => {
      g.save(); g.translate(p[0], p[1]); g.scale(1, 0.55); g.rotate(p[3]);
      g.beginPath(); g.moveTo(0, 0); g.arc(0, 0, p[2], 0.35, TAU - 0.1); g.closePath(); g.fillStyle = lin(g, -p[2], -p[2], p[2], p[2], [[0, '#7fba58'], [1, '#2f6a3c']]); g.fill(); g.strokeStyle = 'rgba(10,50,25,.6)'; g.lineWidth = 0.8; g.stroke();
      g.strokeStyle = 'rgba(200,240,150,.5)'; g.lineWidth = 0.6; for (let k = 0; k < 6; k++) { g.beginPath(); g.moveTo(0, 0); g.lineTo(Math.cos(1 + k) * p[2] * 0.9, Math.sin(1 + k) * p[2] * 0.9); g.stroke(); }
      g.restore();
    });
    petalHead(g, cx + 38, cy - 15, 8, 4.4, 1.3, 0.7, '#fff0f4', '#f1a3b8', 'rgba(150,60,90,.4)', 0); ell(g, cx + 38, cy - 15, 1.5, 1.1, 0, '#f2cf4a');
    g.restore();
    // pebbles & shore stones
    for (let i = 0; i < 26; i++) { const a = r() * TAU, rd = 0.96 + r() * 0.14; const px = cx + Math.cos(a) * 80 * rd, py = cy + Math.sin(a) * 38.5 * rd; const s = 1.8 + r() * 3; ell(g, px + 1, py + 1, s, s * 0.7, 0, 'rgba(30,30,20,.3)'); ell(g, px, py, s, s * 0.7, 0, ramp(['#8d887c', '#c9c2ad', '#6f6a60'], r()), ink(0.35), 0.5); }
    // grass fringe around sand
    for (let i = 0; i < 46; i++) { const a = r() * TAU; tuft(g, cx + Math.cos(a) * 96, cy + Math.sin(a) * 48 + 2, 1, r, 8 + r() * 6); }
    // reeds/cattails left
    for (let i = 0; i < 7; i++) {
      const bx = cx - 92 + i * 4 + r() * 3, by = cy + 12 + r() * 10, h = 36 + r() * 22, lean = (r() - 0.5) * 9;
      g.strokeStyle = ink(0.35); g.lineWidth = 2.4; g.lineCap = 'round'; g.beginPath(); g.moveTo(bx, by); g.quadraticCurveTo(bx + lean * 0.3, by - h * 0.5, bx + lean, by - h); g.stroke();
      g.strokeStyle = '#5c8c3c'; g.lineWidth = 1.5; g.stroke();
      if (i % 2 === 0) { g.save(); g.translate(bx + lean, by - h); g.rotate(lean * 0.05); rr(g, -1.8, -8, 3.6, 11, 1.8, lin(g, -2, 0, 2, 0, [[0, '#8a5a34'], [1, '#4a2f1a']]), ink(0.5), 0.5); line(g, 0, -12, 0, -8, '#c4a96a', 0.8); g.restore(); }
      leafBlade(g, bx, by - 2, -1.57 - (i % 2 ? 0.4 : -0.3), 28 + r() * 8, 2.4, '#3a7d3a', '#8cc460');
    }
    // dragonfly
    g.save(); g.translate(cx + 20, cy - 36); line(g, -5, 0, 5, 0, '#2b6f86', 1.4); ell(g, -3, -2.5, 4, 1.4, -0.3, 'rgba(255,255,255,.55)'); ell(g, 2, -2.5, 4, 1.4, 0.3, 'rgba(255,255,255,.5)'); g.restore();
  }

  /* ---------------------------------------------------------- TRUCK */
  function truck(g, x, y) {
    g.save(); g.translate(x, y);
    shadow(g, 6, -4, 62, 14, 0.36);
    // far wheels
    rr(g, -42, -50, 18, 10, 4, '#161615'); rr(g, 24, -50, 18, 10, 4, '#161615');
    // body
    MKx.rr(g, -52, -44, 104, 34, 8); g.fillStyle = lin(g, -52, -44, 52, -10, [[0, '#f4cf3d'], [0.5, '#e2ae1d'], [1, '#b87f10']]); g.fill(); g.strokeStyle = 'rgba(80,45,0,.75)'; g.lineWidth = 1; g.stroke();
    // south side face
    g.beginPath(); g.moveTo(-50, -12); g.lineTo(50, -12); g.lineTo(49, -4); g.quadraticCurveTo(0, -2, -49, -4); g.closePath(); g.fillStyle = lin(g, 0, -12, 0, -2, [[0, '#c78d12'], [1, '#8d5f0a']]); g.fill(); g.strokeStyle = 'rgba(70,40,0,.7)'; g.lineWidth = 0.8; g.stroke();
    line(g, -48, -8, 48, -8, 'rgba(255,230,140,.35)', 0.8);
    // bed
    rr(g, -49, -41, 40, 28, 3, '#9b7a45', 'rgba(60,35,0,.8)', 1);
    rr(g, -46, -38, 34, 22, 2, lin(g, -46, -38, -12, -16, [[0, '#6f5430'], [1, '#43301a']]), 'rgba(0,0,0,.6)', 0.8);
    for (let i = 0; i < 5; i++) line(g, -46, -35 + i * 4.6, -12, -35 + i * 4.6, 'rgba(255,225,170,.18)', 0.8);
    for (let i = 0; i < 4; i++) line(g, -40 + i * 9, -38, -40 + i * 9, -16, 'rgba(0,0,0,.25)', 0.8);
    // cargo: gas can + rake
    rr(g, -42, -33, 9, 10, 1.5, '#c8372a', 'rgba(60,10,10,.7)', 0.7); rr(g, -39, -35, 4, 2.4, 0.8, '#222'); line(g, -41, -29, -34, -29, 'rgba(255,255,255,.3)', 0.8);
    line(g, -30, -20, -16, -37, '#b78a55', 1.6); line(g, -16, -37, -13, -41, '#888', 1.2);
    // bed rails (lighter lip)
    rr(g, -49, -41, 40, 28, 3, null, 'rgba(255,240,170,.5)', 0.9);
    // cab
    rr(g, -7, -42, 33, 30, 5, lin(g, -7, -42, 26, -12, [[0, '#ffe064'], [1, '#d9a21a']]), 'rgba(80,45,0,.8)', 1);
    rr(g, -2, -38, 17, 22, 3, lin(g, -2, -38, 15, -16, [[0, '#fbe27a'], [1, '#e0b035']]), 'rgba(80,45,0,.6)', 0.8); // roof
    line(g, 0, -36, 12, -36, 'rgba(255,255,255,.5)', 1);
    poly(g, [[15, -38], [24, -35], [24, -19], [15, -16]], lin(g, 15, -38, 24, -16, [[0, '#cfe6ee'], [1, '#5f8aa0']]), 'rgba(40,30,10,.75)', 0.9); // windshield
    poly(g, [[-2, -38], [-6, -35], [-6, -19], [-2, -16]], '#5f8aa0', 'rgba(40,30,10,.75)', 0.8);
    // hood
    rr(g, 25, -41, 26, 28, 6, lin(g, 25, -41, 51, -13, [[0, '#ffdc50'], [0.5, '#eab62a'], [1, '#c58a12']]), 'rgba(80,45,0,.8)', 1);
    rr(g, 29, -36, 15, 18, 3, null, 'rgba(120,70,0,.4)', 0.8); line(g, 31, -34, 40, -34, 'rgba(255,255,255,.45)', 1);
    ell(g, 50, -37, 2, 3, 0, '#fff4c2', 'rgba(80,45,0,.7)', 0.6); ell(g, 50, -17, 2, 3, 0, '#fff4c2', 'rgba(80,45,0,.7)', 0.6);
    rr(g, 49, -33, 3, 13, 1, '#2a2a2a'); rr(g, 50, -43, 4, 33, 1.5, null, 'rgba(180,180,175,.9)', 1.3);
    ell(g, -52, -37, 1.6, 2.4, 0, '#c83a2a'); ell(g, -52, -17, 1.6, 2.4, 0, '#c83a2a');
    // mirrors
    ell(g, 18, -44, 2, 1.4, 0, '#222'); ell(g, 18, -9, 2, 1.4, 0, '#222');
    // near wheels with tread
    for (const wx of [-33, 33]) {
      ell(g, wx, -3, 11, 7, 0, lin(g, 0, -10, 0, 4, [[0, '#3c3c3a'], [1, '#121211']]), '#000', 0.9);
      for (let i = 0; i < 12; i++) { const a = Math.PI * (i / 12); line(g, wx + Math.cos(a) * 9, -3 + Math.sin(a) * 5.5, wx + Math.cos(a) * 11, -3 + Math.sin(a) * 7, 'rgba(170,170,160,.4)', 1); }
      ell(g, wx, -4, 5.4, 3.4, 0, lin(g, wx - 5, -8, wx + 5, 0, [[0, '#d8dad6'], [1, '#7c8082']]), 'rgba(0,0,0,.6)', 0.6);
      ell(g, wx, -4, 1.4, 0.9, 0, '#333');
    }
    ell(g, -22, -47, 14, 2.4, 0, 'rgba(255,255,255,.25)');
    g.restore();
  }

  window.STYLES.push({
    id: 'B', name: 'Illustrated Naturalist',
    blurb: 'Painterly nature-journal look: believable proportions, gouache-style gradients and fine hand-drawn detail (bark ridges, leaf clusters, rock strata, veined petals, mossy shingles, wood grain) with tinted brown contour lines instead of black. Muted-but-rich palette lit from the top-left.',
    draw(g, MK) {
      MKx = MK; const S = MK.slots;
      // order roughly back to front
      tree(g, S.treeBig.x, S.treeBig.y, { seed: 7, cw: 240, ch: 150, cy: 128, th: 74, tw0: 32, tw1: 22, flare: 18, sway: 3, n: 15, cr: 46, leaves: 300, leafSz: 7.4, cols: ['#173d26', '#2b5e30', '#4a7e38', '#7ba043', '#bcc86b'] });
      tree(g, S.treeSmall.x, S.treeSmall.y, { seed: 3, cw: 144, ch: 90, cy: 92, th: 54, tw0: 13, tw1: 9, flare: 8, sway: 2, n: 9, cr: 30, leaves: 190, leafSz: 6, cols: ['#1a4a2e', '#2f6d3a', '#4f9444', '#82b94f', '#c5d672'] });
      label(g, 'Small tree', S.treeSmall.x, S.treeSmall.y + 18);
      label(g, 'Big oak', S.treeBig.x, S.treeBig.y + 18);
      rock(g, S.rock.x, S.rock.y); label(g, 'Rock in grass', S.rock.x, S.rock.y + 18);
      flowers(g, S.flowers.x, S.flowers.y);
      ['Daisy', 'Poppy / tulip', 'Aster', 'Sunflower'].forEach((t, i) => label(g, t, S.flowers.x + i * 60 - (i === 3 ? 10 : 0), S.flowers.y + 18));
      gnome(g, S.gnome.x, S.gnome.y); ball(g, S.gnome.x + 55, S.gnome.y); frisbee(g, S.gnome.x + 110, S.gnome.y); stick(g, S.gnome.x + 165, S.gnome.y);
      label(g, 'Gnome', S.gnome.x + 8, S.gnome.y + 18); label(g, 'Ball', S.gnome.x + 55, S.gnome.y + 18); label(g, 'Frisbee', S.gnome.x + 110, S.gnome.y + 18); label(g, 'Stick', S.gnome.x + 165, S.gnome.y + 18);
      // kids / mowers
      kidFront(g, S.kidIdle.x, S.kidIdle.y, 1); label(g, 'Kid idle', S.kidIdle.x, S.kidIdle.y + 18);
      swoosh(g, S.kidScythe.x, S.kidScythe.y);
      kidSide(g, S.kidScythe.x, S.kidScythe.y); scythe(g, S.kidScythe.x, S.kidScythe.y); label(g, 'Kid with scythe', S.kidScythe.x + 12, S.kidScythe.y + 18);
      gasMower(g, S.kidPush.x, S.kidPush.y - 46); kidBack(g, S.kidPush.x, S.kidPush.y, -2); label(g, 'Kid pushing gas mower', S.kidPush.x, S.kidPush.y + 18);
      reelMower(g, S.reel.x, S.reel.y); label(g, 'Reel mower', S.reel.x, S.reel.y + 18);
      rideMower(g, S.ride.x, S.ride.y); label(g, 'Ride-on mower', S.ride.x, S.ride.y + 18);
      fence(g, S.fence.x, S.fence.y); label(g, 'Picket fence', S.fence.x + 96, S.fence.y + 24);
      hedge(g, S.hedge.x, S.hedge.y); label(g, 'Hedge', S.hedge.x + 96, S.hedge.y + 24);
      house(g, S.house.x, S.house.y); label(g, 'House section + path', S.house.x + 112, S.house.y + 24);
      pond(g, S.pond.x, S.pond.y); label(g, 'Pond', S.pond.x, S.pond.y + 64);
      truck(g, S.truck.x, S.truck.y); label(g, 'Pickup truck', S.truck.x, S.truck.y + 18);
    }
  });

  function swoosh(g, x, y) {
    g.save(); g.translate(x + 2, y - 8);
    for (let k = 0; k < 2; k++) {
      const a0 = -1.5, a1 = 1.2 - k * 0.1;
      g.beginPath(); g.ellipse(0, 0, 64 - k * 4, 22 - k * 2, 0, a0, a1);
      g.ellipse(-6 + k * 2, 0, 56 - k * 4, 17 - k * 2, 0, a1, a0, true); g.closePath();
      const gr = g.createLinearGradient(-40, -20, 60, 14); gr.addColorStop(0, 'rgba(255,255,255,0)'); gr.addColorStop(0.5, `rgba(255,255,240,${0.85 - k * 0.3})`); gr.addColorStop(1, 'rgba(255,255,255,.05)'); g.fillStyle = gr; g.fill();
    }
    const r = MKx.rng(9);
    for (let i = 0; i < 14; i++) { const a = -0.6 + r() * 1.8; const px = Math.cos(a) * (50 + r() * 22), py = Math.sin(a) * (18 + r() * 8) - r() * 8; g.save(); g.translate(px, py); g.rotate(r() * TAU); g.fillStyle = r() > 0.5 ? '#8fdc62' : '#5fb94a'; g.beginPath(); g.ellipse(0, 0, 2.4, 0.8, 0, 0, TAU); g.fill(); g.restore(); }
    g.restore();
  }
  function scythe(g, x, y) {
    g.save(); g.translate(x, y);
    // snath from top (-4,-72) to heel (40,-4)
    const ax = -4, ay = -72, bx = 40, by = -4;
    g.lineCap = 'round';
    g.strokeStyle = ink(0.5); g.lineWidth = 4.2; g.beginPath(); g.moveTo(ax, ay); g.quadraticCurveTo(14, -44, bx, by); g.stroke();
    g.strokeStyle = '#b48a58'; g.lineWidth = 3; g.stroke(); g.strokeStyle = '#dcb784'; g.lineWidth = 1; g.beginPath(); g.moveTo(ax - 0.5, ay); g.quadraticCurveTo(13.5, -44, bx - 0.5, by); g.stroke();
    g.strokeStyle = 'rgba(80,50,25,.4)'; g.lineWidth = 0.5; for (let i = 1; i < 6; i++) { const t = i / 6; g.beginPath(); g.moveTo(ax + (bx - ax) * t - 1, ay + (by - ay) * t - 0.5); g.lineTo(ax + (bx - ax) * t + 1, ay + (by - ay) * t + 1); g.stroke(); }
    // grip nibs
    limb(g, 12, -48, 8, -44, 2.2, '#c99d68', '#7d5430', false);
    // near hand re-drawn over snath
    ell(g, 19.6, -37.8, 2.8, 2.8, 0, SKIN[0], ink(0.4), 0.6);
    // blade
    g.beginPath(); g.moveTo(37, -6); g.bezierCurveTo(52, -1, 72, -2, 88, -14); g.bezierCurveTo(74, -9, 56, -8.5, 38, -10); g.closePath();
    g.fillStyle = lin(g, 37, -10, 88, -2, [[0, '#8f9699'], [0.5, '#e6eaea'], [1, '#aeb4b6']]); g.fill(); g.strokeStyle = 'rgba(30,35,40,.7)'; g.lineWidth = 0.8; g.stroke();
    g.strokeStyle = 'rgba(255,255,255,.8)'; g.lineWidth = 0.7; g.beginPath(); g.moveTo(40, -7.5); g.bezierCurveTo(54, -4, 70, -5, 85, -13); g.stroke();
    rr(g, 34, -9, 8, 6, 2, '#5a5a58', 'rgba(0,0,0,.6)', 0.6); ell(g, 38, -6, 1, 1, 0, '#c9cbc8');
    g.restore();
  }
})();
