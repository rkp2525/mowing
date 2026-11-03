(function () {
  const TAU = Math.PI * 2;
  const P = {};
  function rgb(c) { if (P[c]) return P[c]; let h = c.slice(1); if (h.length === 3) h = h.replace(/./g, '$&$&'); return (P[c] = [parseInt(h.slice(0, 2), 16), parseInt(h.slice(2, 4), 16), parseInt(h.slice(4, 6), 16)]); }
  function mix(a, b, t) { const A = rgb(a), B = rgb(b); const f = (i) => Math.max(0, Math.min(255, Math.round(A[i] + (B[i] - A[i]) * t))).toString(16).padStart(2, '0'); return '#' + f(0) + f(1) + f(2); }
  const lit = (c, t) => mix(c, '#fff2d0', t);
  const drk = (c, t) => mix(c, '#3a1238', t);
  const rgba = (c, a) => { const A = rgb(c); return `rgba(${A[0]},${A[1]},${A[2]},${a})`; };

  /* inflated clay volume: radial shading from top-left key, rim light bottom-right, glossy spec */
  function ball(g, cx, cy, rx, ry, col, o) {
    o = o || {};
    g.save(); g.translate(cx, cy); if (o.rot) g.rotate(o.rot); g.scale(rx, ry);
    const L = o.lit == null ? 1 : o.lit, D = o.dark == null ? 1 : o.dark;
    const gr = g.createRadialGradient(-0.32, -0.4, 0.03, -0.25, -0.3, 1.45);
    gr.addColorStop(0, lit(col, 0.5 * L)); gr.addColorStop(0.3, lit(col, 0.14 * L)); gr.addColorStop(0.62, col); gr.addColorStop(1, drk(col, 0.5 * D));
    g.beginPath(); g.arc(0, 0, 1, 0, TAU); g.fillStyle = gr; g.fill();
    g.save(); g.clip();
    // rim / bounce light from lower right
    const rg = g.createLinearGradient(-0.6, -0.6, 0.75, 0.8);
    rg.addColorStop(0, 'rgba(255,240,200,0)'); rg.addColorStop(0.6, 'rgba(255,240,200,0)'); rg.addColorStop(1, 'rgba(255,225,170,0.38)');
    g.strokeStyle = rg; g.lineWidth = 0.17; g.beginPath(); g.arc(0, 0, 0.93, 0, TAU); g.stroke();
    g.restore();
    if (o.spec !== false) {
      const sg = g.createRadialGradient(-0.4, -0.5, 0, -0.4, -0.5, 0.3);
      sg.addColorStop(0, 'rgba(255,255,255,' + (o.spec || 0.75) + ')'); sg.addColorStop(1, 'rgba(255,255,255,0)');
      g.save(); g.translate(-0.4, -0.5); g.rotate(-0.7); g.scale(1, 0.62); g.translate(0.4, 0.5);
      g.fillStyle = sg; g.beginPath(); g.arc(-0.4, -0.5, 0.3, 0, TAU); g.fill(); g.restore();
    }
    g.restore();
  }
  /* tube-like limb made of nested strokes */
  function limb(g, x0, y0, x1, y1, w, col) {
    g.lineCap = 'round'; g.lineJoin = 'round';
    const seg = (ox, oy, ww, c, a) => { g.strokeStyle = a == null ? c : rgba(c, a); g.lineWidth = ww; g.beginPath(); g.moveTo(x0 + ox, y0 + oy); g.lineTo(x1 + ox, y1 + oy); g.stroke(); };
    seg(0, 0, w, drk(col, 0.42));
    seg(-w * 0.06, -w * 0.08, w * 0.84, col);
    seg(-w * 0.13, -w * 0.17, w * 0.5, lit(col, 0.28));
    seg(-w * 0.2, -w * 0.24, w * 0.18, '#ffffff', 0.45);
  }
  function shadow(g, x, y, rx, ry, a) {
    a = a == null ? 0.32 : a;
    g.save(); g.translate(x + rx * 0.14, y + ry * 0.1); g.scale(rx, ry);
    let gr = g.createRadialGradient(0, 0, 0, 0, 0, 1);
    gr.addColorStop(0, 'rgba(18,48,28,' + a + ')'); gr.addColorStop(0.6, 'rgba(18,48,28,' + a * 0.7 + ')'); gr.addColorStop(1, 'rgba(18,48,28,0)');
    g.fillStyle = gr; g.beginPath(); g.arc(0, 0, 1, 0, TAU); g.fill();
    g.restore();
    // tight ambient-occlusion core
    g.save(); g.translate(x, y); g.scale(rx * 0.62, ry * 0.5);
    gr = g.createRadialGradient(0, 0, 0, 0, 0, 1);
    gr.addColorStop(0, 'rgba(10,30,20,' + Math.min(0.6, a * 1.4) + ')'); gr.addColorStop(1, 'rgba(10,30,20,0)');
    g.fillStyle = gr; g.beginPath(); g.arc(0, 0, 1, 0, TAU); g.fill(); g.restore();
  }
  /* rounded block with top-left lit gradient (for fence, house, truck) */
  function block(g, x, y, w, h, r, col, o) {
    o = o || {};
    const gr = g.createLinearGradient(x, y, x + w * 0.9, y + h);
    gr.addColorStop(0, lit(col, 0.4)); gr.addColorStop(0.45, col); gr.addColorStop(1, drk(col, 0.42));
    window.MK.rr(g, x, y, w, h, r); g.fillStyle = gr; g.fill();
    g.save(); window.MK.rr(g, x, y, w, h, r); g.clip();
    // soft inner rim bottom/right
    g.strokeStyle = 'rgba(255,225,170,0.3)'; g.lineWidth = 3; window.MK.rr(g, x + 0.5, y + 0.5, w - 1, h - 1, r); g.stroke();
    // top-left bevel highlight
    const hg = g.createLinearGradient(x, y, x + w * 0.4, y + h * 0.5);
    hg.addColorStop(0, 'rgba(255,255,255,' + (o.gloss == null ? 0.42 : o.gloss) + ')'); hg.addColorStop(1, 'rgba(255,255,255,0)');
    g.fillStyle = hg; window.MK.rr(g, x + 1.5, y + 1.5, w * 0.55, Math.min(h * 0.45, 10), Math.min(r, 5)); g.fill();
    g.restore();
  }
  function label(g, t, x, y) {
    g.save(); g.font = '600 12px ui-rounded, "Trebuchet MS", system-ui, sans-serif'; g.textAlign = 'center'; g.textBaseline = 'middle';
    g.lineJoin = 'round'; g.lineWidth = 3.5; g.strokeStyle = 'rgba(15,45,25,0.7)'; g.strokeText(t, x, y);
    g.fillStyle = '#fff'; g.fillText(t, x, y); g.restore();
  }
  function dots(g, rnd, cx, cy, r, n, a) {
    for (let i = 0; i < n; i++) { const an = rnd() * TAU, d = Math.sqrt(rnd()) * r; const l = rnd() > 0.5; g.fillStyle = l ? 'rgba(255,255,220,' + a + ')' : 'rgba(20,40,20,' + a * 0.8 + ')'; g.beginPath(); g.arc(cx + Math.cos(an) * d, cy + Math.sin(an) * d, 0.7 + rnd() * 0.8, 0, TAU); g.fill(); }
  }

  /* ---------------- KID ---------------- */
  const SKIN = '#ffc9a0', HAIR = '#7a4220', SHIRT = '#ff7b47', PANTS = '#4f86e0', SHOE = '#8a4b2c';
  function face(g, ex, ey, gap, sc) {
    ball(g, ex, ey, 3 * sc, 3.8 * sc, '#2b1b22', { lit: 0.2, spec: 0.9 });
    if (gap) ball(g, ex + gap, ey, 3 * sc, 3.8 * sc, '#2b1b22', { lit: 0.2, spec: 0.9 });
  }
  function kid(g, x, y, dir, pose) {
    g.save(); g.translate(x, y);
    shadow(g, 0, 1, 27, 8.5, 0.34);
    const headClip = (cx, cy, rx, ry, fn) => { g.save(); g.beginPath(); g.ellipse(cx, cy, rx, ry, 0, 0, TAU); g.clip(); fn(); g.restore(); };
    if (dir === 's') {
      ball(g, -7, -12, 6.4, 9.5, PANTS); ball(g, 7, -12, 6.4, 9.5, PANTS);
      ball(g, -8, -4, 8.3, 5.2, SHOE); ball(g, 8, -4, 8.3, 5.2, SHOE);
      ball(g, 0, -33, 15.5, 17.5, SHIRT);
      ball(g, 0, -35, 4.2, 4.2, '#ffd84a');
      ball(g, -19.5, -35, 6.2, 11, SHIRT, { rot: 0.18 }); ball(g, 19.5, -35, 6.2, 11, SHIRT, { rot: -0.18 });
      ball(g, -22, -24.5, 4.8, 4.8, SKIN); ball(g, 22, -24.5, 4.8, 4.8, SKIN);
      ball(g, -19, -57, 4.2, 5.2, drk(SKIN, 0.12)); ball(g, 19, -57, 4.2, 5.2, drk(SKIN, 0.12));
      ball(g, 0, -58, 19.5, 18.5, SKIN);
      headClip(0, -58, 19.5, 18.5, () => { ball(g, 0, -73, 24, 15, HAIR); ball(g, -9, -70, 9, 6, HAIR, { spec: 0.5 }); });
      ball(g, 3, -77, 6, 4.5, HAIR);
      face(g, -7, -57, 14, 1);
      const cg = g.createRadialGradient(0, 0, 0, 0, 0, 5); cg.addColorStop(0, 'rgba(255,110,120,.5)'); cg.addColorStop(1, 'rgba(255,110,120,0)');
      [-12.5, 12.5].forEach((cx) => { g.save(); g.translate(cx, -51); g.scale(1, 0.6); g.fillStyle = cg; g.beginPath(); g.arc(0, 0, 5, 0, TAU); g.fill(); g.restore(); });
      ball(g, 0, -53, 2.6, 2.2, drk(SKIN, 0.12), { spec: 0.5 });
      g.strokeStyle = '#8a3a3a'; g.lineWidth = 1.6; g.lineCap = 'round'; g.beginPath(); g.arc(0, -50, 4.5, 0.25, Math.PI - 0.25); g.stroke();
    } else if (dir === 'n') {
      ball(g, -7, -12, 6.4, 9.5, PANTS); ball(g, 7, -12, 6.4, 9.5, PANTS);
      ball(g, -8, -4, 8.3, 5.2, SHOE); ball(g, 8, -4, 8.3, 5.2, SHOE);
      ball(g, 0, -33, 15.5, 17.5, SHIRT);
      ball(g, 0, -28, 8, 5, lit(SHIRT, 0.1), { spec: 0.3 });
      ball(g, -19, -19, 4.8, 4.8, SKIN); ball(g, 19, -19, 4.8, 4.8, SKIN);
      limb(g, -14, -44, -17, -21, 11, SHIRT); limb(g, 14, -44, 17, -21, 11, SHIRT);
      ball(g, -17.5, -19, 5, 5, SKIN); ball(g, 17.5, -19, 5, 5, SKIN);
      ball(g, -19, -57, 4.2, 5.2, drk(SKIN, 0.12)); ball(g, 19, -57, 4.2, 5.2, drk(SKIN, 0.12));
      ball(g, 0, -58, 19.5, 18.5, HAIR);
      ball(g, -6, -63, 8, 6, HAIR, { spec: 0.6, lit: 1.3 });
      ball(g, 4, -77, 6, 4.5, HAIR);
      ball(g, 0, -42, 8, 3.5, drk(SKIN, 0.05), { spec: 0.1 });
    } else { // east
      const armsFwd = pose === 'scythe';
      ball(g, -4, -12, 6, 9.5, drk(PANTS, 0.15)); ball(g, 4, -12, 6.4, 9.5, PANTS);
      ball(g, -4, -4, 9, 5.2, drk(SHOE, 0.1)); ball(g, 8, -4, 9, 5.2, SHOE);
      if (armsFwd) limb(g, 4, -39, 44, -46, 10.5, drk(SHIRT, 0.12));
      ball(g, 0, -33, 12.5, 17.5, SHIRT);
      ball(g, 5, -35, 3.6, 3.6, '#ffd84a');
      if (!armsFwd) { limb(g, -1, -42, 6, -24, 10.5, SHIRT); ball(g, 7, -21, 4.8, 4.8, SKIN); }
      ball(g, -2, -57, 4, 5.2, drk(SKIN, 0.12));
      ball(g, 2, -58, 18.5, 18.5, SKIN);
      headClip(2, -58, 18.5, 18.5, () => { ball(g, -7, -66, 22, 18, HAIR); ball(g, 9, -75, 10, 5.5, HAIR, { spec: 0.5 }); });
      ball(g, -3, -77, 6, 4.5, HAIR);
      face(g, 9, -57, 8, 0.95);
      ball(g, 20, -54.5, 3, 2.7, drk(SKIN, 0.1), { spec: 0.6 });
      const cg = g.createRadialGradient(0, 0, 0, 0, 0, 5); cg.addColorStop(0, 'rgba(255,110,120,.5)'); cg.addColorStop(1, 'rgba(255,110,120,0)');
      g.save(); g.translate(12, -50); g.scale(1, 0.6); g.fillStyle = cg; g.beginPath(); g.arc(0, 0, 5, 0, TAU); g.fill(); g.restore();
      g.strokeStyle = '#8a3a3a'; g.lineWidth = 1.5; g.lineCap = 'round'; g.beginPath(); g.arc(14, -49.5, 3.4, 0.2, Math.PI - 0.5); g.stroke();
    }
    g.restore();
  }

  function scytheKid(g, x, y) {
    kid(g, x, y, 'e', 'scythe');
    g.save(); g.translate(x, y); g.save(); g.translate(10, 0);
    // swoosh arc
    const cx = 10, cy = -20, R = 79, a0 = -1.25, a1 = 0.18, N = 26;
    g.lineCap = 'round';
    for (let i = 0; i < N; i++) {
      const t = i / N, a = a0 + (a1 - a0) * t, b = a0 + (a1 - a0) * (t + 1.2 / N);
      g.strokeStyle = 'rgba(235,255,250,' + (0.04 + 0.5 * t * t) + ')'; g.lineWidth = 1 + 10 * t;
      g.beginPath(); g.arc(cx, cy, R - 4 * (1 - t), a, b); g.stroke();
    }
    // handle (snath)
    limb(g, 14, -66, 54, -10, 4.8, '#c98a4e');
    // blade
    const bg = g.createLinearGradient(50, -30, 90, 0); bg.addColorStop(0, '#f6fbff'); bg.addColorStop(0.5, '#b9c7d6'); bg.addColorStop(1, '#6f8094');
    g.fillStyle = bg; g.beginPath(); g.moveTo(46, -18); g.quadraticCurveTo(70, -31, 94, -5); g.quadraticCurveTo(68, -20, 50, -6); g.closePath(); g.fill();
    g.strokeStyle = 'rgba(255,255,255,.85)'; g.lineWidth = 1.3; g.beginPath(); g.moveTo(49, -17); g.quadraticCurveTo(70, -28, 90, -7); g.stroke();
    ball(g, 51, -12, 4.5, 4.5, '#6b6f7d');
    // hands + near arm
    g.restore();
    limb(g, 6, -36, 44, -31, 10.5, SHIRT);
    ball(g, 34, -45, 5, 5, SKIN);
    ball(g, 46, -30, 5.2, 5.2, SKIN);
    // flying clippings
    [[70, -34, 0.5], [84, -26, 1.2], [60, -42, 2], [96, -16, 0.2]].forEach((c) => ball(g, c[0], c[1], 3.4, 1.8, '#7fd45a', { rot: c[2], spec: 0.4 }));
    g.restore();
  }

  /* ---------------- MOWERS ---------------- */
  function wheel(g, x, y, r, col, hub) {
    ball(g, x, y, r, r, col || '#34303e', { lit: 0.7 });
    ball(g, x, y, r * 0.55, r * 0.55, hub || '#ffd84a', { spec: 0.7 });
    ball(g, x, y, r * 0.18, r * 0.18, '#777', { spec: 0.5 });
  }
  function gasMowerKid(g, x, y) {
    const mx = x, my = y - 26;
    shadow(g, mx + 2, my - 70, 36, 38, 0.3);
    // handle bars
    limb(g, mx - 12, my - 62, mx - 17, y - 24, 4.2, '#8e97a8'); limb(g, mx + 12, my - 62, mx + 17, y - 24, 4.2, '#8e97a8');
    // wheels
    ball(g, mx - 27, my - 64, 5.5, 12, '#34303e', { lit: 0.8 }); ball(g, mx + 27, my - 64, 5.5, 12, '#34303e', { lit: 0.8 });
    ball(g, mx - 27, my - 90, 5, 10, '#34303e', { lit: 0.5 }); ball(g, mx + 27, my - 90, 5, 10, '#34303e', { lit: 0.5 });
    // grass bag
    ball(g, mx, my - 59, 16, 10, '#e8cf74');
    // rear face and deck top
    block(g, mx - 23, my - 68, 46, 22, 9, '#d63a3a');
    block(g, mx - 22, my - 110, 44, 50, 13, '#f0504a', { gloss: 0.55 });
    // deck vent stripes
    g.strokeStyle = 'rgba(120,20,30,.35)'; g.lineWidth = 1.6; g.lineCap = 'round';
    for (let i = 0; i < 3; i++) { g.beginPath(); g.moveTo(mx - 12, my - 102 + i * 4); g.lineTo(mx + 12, my - 102 + i * 4); g.stroke(); }
    // engine
    block(g, mx - 13, my - 92, 26, 22, 9, '#d3d8e6', { gloss: 0.6 });
    block(g, mx - 9, my - 88, 18, 6, 3, '#9aa3b8', { gloss: 0.2 });
    ball(g, mx + 6, my - 75, 4, 3.2, '#ffd84a'); ball(g, mx - 6, my - 75, 4.5, 3.4, '#e04a4a', { spec: 0.8 });
    return;
  }
  function gasKid(g, x, y) {
    gasMowerKid(g, x, y);
    kid(g, x, y, 'n');
    // grips on top of hands
    ball(g, x - 17, y - 21, 5.5, 5.5, '#2f3344', { lit: 0.8 }); ball(g, x + 17, y - 21, 5.5, 5.5, '#2f3344', { lit: 0.8 });
    ball(g, x - 17.5, y - 20, 4.6, 4.6, SKIN, { spec: 0.5 }); ball(g, x + 17.5, y - 20, 4.6, 4.6, SKIN, { spec: 0.5 });
  }
  function reel(g, x, y) {
    g.save(); g.translate(x, y);
    shadow(g, -2, 0, 38, 10, 0.3);
    // handle
    limb(g, -12, -28, -42, -66, 4.4, '#8e97a8');
    // far wheel
    wheel(g, -2, -33, 11, '#2a2632', '#c8362f');
    // frame
    ball(g, -4, -22, 20, 8, '#e04a3a');
    limb(g, -12, -24, -44, -60, 4.4, '#9aa3b4');
    ball(g, -43, -63, 5.5, 5, '#f2574a', { rot: 0.7 });
    ball(g, -48, -57, 5, 4.5, '#f2574a', { rot: 0.7 });
    // reel cylinder
    g.save(); g.translate(24, -22);
    const gr = g.createLinearGradient(-11, -20, 11, 18); gr.addColorStop(0, '#9fd8ff'); gr.addColorStop(0.5, '#3f93e3'); gr.addColorStop(1, '#1e4f9c');
    window.MK.rr(g, -10, -26, 20, 48, 10); g.fillStyle = gr; g.fill();
    g.save(); window.MK.rr(g, -10, -26, 20, 48, 10); g.clip();
    g.strokeStyle = 'rgba(255,255,255,.4)'; g.lineWidth = 2.2;
    for (let i = -4; i < 6; i++) { g.beginPath(); g.moveTo(-12, -26 + i * 8); g.quadraticCurveTo(0, -20 + i * 8, 12, -14 + i * 8); g.stroke(); }
    g.strokeStyle = 'rgba(10,30,90,.35)'; g.lineWidth = 1.6;
    for (let i = -4; i < 6; i++) { g.beginPath(); g.moveTo(-12, -22 + i * 8); g.quadraticCurveTo(0, -16 + i * 8, 12, -10 + i * 8); g.stroke(); }
    g.strokeStyle = 'rgba(190,230,255,.5)'; g.lineWidth = 3; g.beginPath(); g.moveTo(-5, -20); g.lineTo(-5, 16); g.stroke();
    g.restore();
    ball(g, 0, 18, 7, 4, '#cfd5e2'); g.restore();
    // body bar over reel
    ball(g, 10, -15, 22, 6.5, '#f2574a');
    // near wheel
    wheel(g, -4, -14, 14, '#2f2b38', '#ffd84a');
    g.restore();
  }
  function ride(g, x, y) {
    g.save(); g.translate(x, y);
    shadow(g, 3, 1, 60, 13, 0.34);
    // far wheels
    ball(g, -30, -17, 12, 12, '#26222f', { lit: 0.3 }); ball(g, 32, -15, 8, 8, '#26222f', { lit: 0.3 });
    // chassis
    block(g, -46, -26, 92, 14, 7, '#8d1f2a');
    // rear body / seat housing
    ball(g, -22, -33, 25, 16, '#e63f45');
    // hood
    ball(g, 22, -30, 31, 14.5, '#f0504a');
    ball(g, 14, -34, 22, 7, '#ff8070', { spec: 0.4, dark: 0.2 });
    // grill + headlight
    ball(g, 51, -26, 4.5, 9, '#d3d8e3'); ball(g, 50, -32, 3.6, 3.6, '#fff0a0', { spec: 0.9 });
    // seat
    ball(g, -24, -41, 13, 6, '#3d3a52'); ball(g, -33, -52, 5.5, 12, '#3d3a52', { rot: 0.1 });
    // kid sitting (legs forward, torso, head)
    ball(g, -4, -41, 15, 5.5, PANTS); ball(g, 14, -39, 8, 5, SHOE);
    ball(g, -22, -54, 10.5, 14, SHIRT);
    ball(g, -22, -55, 3.2, 3.2, '#ffd84a');
    // steering column + wheel
    limb(g, 12, -34, 10, -53, 4, '#59607a');
    g.save(); g.translate(8, -57); g.scale(1, 0.4); g.lineWidth = 4; g.strokeStyle = '#2f3344'; g.beginPath(); g.arc(0, 0, 10, 0, TAU); g.stroke();
    g.lineWidth = 1.6; g.strokeStyle = 'rgba(255,255,255,.4)'; g.beginPath(); g.arc(0, -0.8, 10, Math.PI * 1.1, Math.PI * 1.7); g.stroke(); g.restore();
    // arm
    limb(g, -18, -62, 6, -56, 9, SHIRT); ball(g, 8, -56, 4.5, 4.5, SKIN);
    // head
    ball(g, -22, -76, 15.5, 15, SKIN);
    g.save(); g.beginPath(); g.ellipse(-22, -76, 15.5, 15, 0, 0, TAU); g.clip(); ball(g, -28, -83, 20, 15, HAIR); ball(g, -13, -89, 9, 5, HAIR, { spec: 0.5 }); g.restore();
    ball(g, -29, -90, 5, 4, HAIR);
    ball(g, -15, -75, 2.6, 3.3, '#2b1b22', { lit: 0.2, spec: 0.9 }); ball(g, -8.5, -75, 2.4, 3.2, '#2b1b22', { lit: 0.2, spec: 0.9 });
    ball(g, -5, -72.5, 2.6, 2.3, drk(SKIN, 0.1), { spec: 0.5 });
    g.strokeStyle = '#8a3a3a'; g.lineWidth = 1.3; g.lineCap = 'round'; g.beginPath(); g.arc(-10, -69.5, 3, 0.2, 2.6); g.stroke();
    // near wheels
    wheel(g, -30, -15, 17, '#2f2b38', '#ffd84a');
    wheel(g, 33, -10, 11, '#2f2b38', '#ffd84a');
    g.restore();
  }

  /* ---------------- TREES ---------------- */
  function puffTree(g, rnd, puffs, cx, cy, baseCols) {
    puffs.sort((a, b) => a[1] - b[1]);
    puffs.forEach((p) => {
      const t = Math.max(0, Math.min(1, (p[1] + 70) / 140));
      const col = mix(baseCols[0], baseCols[1], t * 0.8 + rnd() * 0.25);
      ball(g, cx + p[0], cy + p[1], p[2], p[2] * 0.93, col, { spec: 0.55 });
      dots(g, rnd, cx + p[0], cy + p[1], p[2] * 0.85, 20, 0.14);
    });
  }
  function treeSmall(g, x, y) {
    const rnd = window.MK.rng(11);
    shadow(g, x + 18, y + 3, 74, 20, 0.36);
    // trunk
    block(g, x - 9, y - 50, 18, 52, 8, '#9a6538', { gloss: 0.3 });
    ball(g, x, y - 2, 13, 5, '#8d5a30', { spec: 0 });
    g.save(); g.globalAlpha = 0.35; ball(g, x + 6, y - 46, 20, 9, '#1f4a2a', { spec: 0, lit: 0, dark: 0 }); g.restore();
    const cy = y - 92;
    const puffs = [[-45, 8, 25], [45, 10, 25], [-24, 22, 25], [26, 24, 25], [0, 28, 24], [-24, -12, 31], [26, -10, 31], [0, 4, 34], [-6, -34, 28], [-46, -10, 20], [46, -8, 20]];
    puffTree(g, rnd, puffs, x, cy, ['#43ad46', '#8fd75a']);
    ball(g, x - 20, cy - 36, 4, 2.5, '#ffffff', { spec: 0, lit: 0, dark: 0 });
  }
  function treeBig(g, x, y) {
    const rnd = window.MK.rng(23);
    shadow(g, x + 30, y + 4, 128, 30, 0.38);
    // trunk with root flare
    const tg = g.createLinearGradient(x - 18, 0, x + 20, 0); tg.addColorStop(0, '#b27a48'); tg.addColorStop(0.5, '#8d5a30'); tg.addColorStop(1, '#5b3520');
    g.fillStyle = tg; g.beginPath(); g.moveTo(x - 34, y); g.quadraticCurveTo(x - 18, y - 6, x - 17, y - 36); g.lineTo(x + 17, y - 36); g.quadraticCurveTo(x + 19, y - 6, x + 36, y); g.quadraticCurveTo(x, y + 8, x - 34, y); g.fill();
    
    
    limb(g, x - 10, y - 40, x - 38, y - 78, 12, '#8d5a30'); limb(g, x + 10, y - 40, x + 40, y - 78, 12, '#7a4a2a');
    g.save(); g.globalAlpha = 0.35; ball(g, x + 10, y - 44, 30, 10, '#1f4a2a', { spec: 0, lit: 0, dark: 0 }); g.restore();
    const cy = y - 116, puffs = [];
    for (let i = 0; i < 30; i++) {
      const a = rnd() * TAU, d = Math.sqrt(rnd());
      const px = Math.cos(a) * d * 96, py = Math.sin(a) * d * 50 - 4 + 10;
      puffs.push([px, py, 23 + rnd() * 9]);
    }
    [[-90, 10, 27], [90, 12, 27], [-60, 30, 25], [62, 32, 25], [0, 36, 25], [-40, -46, 28], [44, -44, 28], [0, -52, 30]].forEach((p) => puffs.push(p));
    puffTree(g, rnd, puffs, x, cy, ['#3a9e40', '#92da5a']);
    // tiny wildflower blobs in the canopy for charm
    ball(g, x - 30, cy - 38, 3, 3, '#ffe36b', { spec: 0.8 });
  }

  /* ---------------- ROCK ---------------- */
  function rock(g, x, y) {
    shadow(g, x + 6, y + 2, 38, 11, 0.38);
    const C = '#a3a3b6';
    ball(g, x + 14, y - 8, 15, 11, drk(C, 0.12));
    ball(g, x, y - 13, 26, 17, C);
    ball(g, x - 11, y - 20, 14, 10, lit(C, 0.22), { spec: 0.55 });
    ball(g, x + 16, y - 14, 10, 8, lit(C, 0.05), { spec: 0.3 });
    const rnd = window.MK.rng(5);
    dots(g, rnd, x, y - 13, 24, 22, 0.16);
    // moss
    ball(g, x - 14, y - 27, 7, 4, '#6cc05c', { rot: -0.4, spec: 0.5 });
    // grass in front
    for (let i = 0; i < 14; i++) {
      const bx = x - 30 + i * 4.8, by = y + 1 + (i % 3);
      window.MK.blade(g, bx, by, 9 + rnd() * 9, (rnd() - 0.5) * 8, 1.7, '#226329', '#46a847', '#86dc6a');
    }
  }

  /* ---------------- FLOWERS ---------------- */
  const GREEN = '#4cae4a';
  function leaf(g, x, y, w, rot) { ball(g, x, y, w, w * 0.4, GREEN, { rot: rot, spec: 0.5 }); }
  function daisyHead(g, x, y, r) {
    const n = 10, ps = [];
    for (let i = 0; i < n; i++) { const a = i / n * TAU; ps.push([a, Math.sin(a)]); }
    ps.sort((a, b) => a[1] - b[1]);
    ps.forEach((p) => ball(g, x + Math.cos(p[0]) * r * 0.9, y + Math.sin(p[0]) * r * 0.75, r * 0.46, r * 0.4, '#fffaf0', { rot: p[0] * 0.5, dark: 0.55 }));
    ball(g, x, y, r * 0.5, r * 0.45, '#ffc92e');
  }
  function tulipHead(g, x, y, r) {
    ball(g, x, y, r * 0.95, r * 1.05, '#d8283f');
    ball(g, x - r * 0.55, y - r * 0.15, r * 0.55, r * 0.95, '#ee4455', { rot: -0.15 });
    ball(g, x + r * 0.55, y - r * 0.15, r * 0.55, r * 0.95, '#e23a4c', { rot: 0.15 });
    ball(g, x, y + r * 0.05, r * 0.6, r * 1.0, '#ff6272');
  }
  function asterHead(g, x, y, r) {
    const n = 16, ps = [];
    for (let i = 0; i < n; i++) ps.push(i / n * TAU);
    ps.sort((a, b) => Math.sin(a) - Math.sin(b));
    ps.forEach((a) => ball(g, x + Math.cos(a) * r * 0.55, y + Math.sin(a) * r * 0.45, r * 0.55, r * 0.2, '#9a6ae0', { rot: a * 0.9 + 0.15, spec: 0.35 }));
    ball(g, x, y, r * 0.38, r * 0.34, '#ffd23a');
  }
  function sunHead(g, x, y, r) {
    for (let ring = 0; ring < 2; ring++) {
      const n = 14, ps = [];
      for (let i = 0; i < n; i++) ps.push(i / n * TAU + ring * 0.22);
      ps.sort((a, b) => Math.sin(a) - Math.sin(b));
      ps.forEach((a) => ball(g, x + Math.cos(a) * r * (0.95 - ring * 0.22), y + Math.sin(a) * r * (0.78 - ring * 0.18), r * 0.42, r * 0.28, ring ? '#ffd02a' : '#f6a81c', { rot: a, spec: 0.4 }));
    }
    ball(g, x, y + 0.5, r * 0.62, r * 0.52, '#6b3b1d');
    dots(g, window.MK.rng(9), x, y, r * 0.5, 14, 0.25);
  }
  function stem(g, x, y, hx, hy, w) { limb(g, x, y, hx, hy, w || 3.4, '#3f9a40'); }
  function patch(g, kind, x, y) {
    shadow(g, x + 2, y + 1, 24, 7, 0.28);
    const rnd = window.MK.rng(Math.floor(x));
    const sp = { daisy: [[-11, 25, 8], [8, 29, 9], [-1, 17, 7]], tulip: [[-10, 24, 7], [9, 28, 7.5], [0, 18, 6.5]], aster: [[-11, 22, 8.5], [10, 26, 9], [-1, 16, 7.5]], sun: [[-3, 42, 13], [-16, 24, 8.5], [14, 22, 8.5]] }[kind];
    // grass tufts behind
    for (let i = 0; i < 6; i++) window.MK.blade(g, x - 14 + i * 5.5, y + 1, 9 + rnd() * 6, (rnd() - 0.5) * 8, 1.6, '#226329', '#3f9a45', '#6fc858');
    sp.slice().sort((a, b) => a[1] - b[1]).forEach((f) => {
      const hx = x + f[0], hy = y - f[1];
      stem(g, x + f[0] * 0.3, y - 1, hx, hy + 3);
      leaf(g, x + f[0] * 0.55 - 6, y - f[1] * 0.4, 7, -0.5); leaf(g, x + f[0] * 0.55 + 6, y - f[1] * 0.3, 6.5, 0.5);
      if (kind === 'daisy') daisyHead(g, hx, hy, f[2]);
      else if (kind === 'tulip') tulipHead(g, hx, hy, f[2]);
      else if (kind === 'aster') asterHead(g, hx, hy, f[2]);
      else sunHead(g, hx, hy, f[2]);
    });
    for (let i = 0; i < 4; i++) window.MK.blade(g, x - 10 + i * 7, y + 3, 6 + rnd() * 5, (rnd() - 0.5) * 6, 1.6, '#226329', '#46a847', '#86dc6a');
  }

  /* ---------------- GNOME + TOYS ---------------- */
  function gnome(g, x, y) {
    shadow(g, x + 2, y + 1, 19, 6, 0.34);
    ball(g, x - 5, y - 3, 6.5, 4, '#6b4630'); ball(g, x + 5, y - 3, 6.5, 4, '#6b4630');
    ball(g, x, y - 12, 11.5, 11.5, '#3b7bd8');
    ball(g, x, y - 10, 10, 2.2, '#4a3220', { spec: 0.3 }); ball(g, x, y - 10, 2.6, 2.4, '#ffd84a');
    ball(g, x - 11, y - 14, 4, 5, '#3b7bd8', { rot: 0.3 }); ball(g, x + 11, y - 14, 4, 5, '#3b7bd8', { rot: -0.3 });
    ball(g, x - 12, y - 9, 3.4, 3.4, '#ffc9a0'); ball(g, x + 12, y - 9, 3.4, 3.4, '#ffc9a0');
    ball(g, x, y - 22, 11.5, 10.5, '#fffaf0');
    ball(g, x - 4, y - 16, 6, 6, '#f4efe4', { spec: 0.3 }); ball(g, x + 4, y - 16, 6, 6, '#f4efe4', { spec: 0.3 });
    ball(g, x, y - 27, 4, 3.4, '#ff9a8a', { spec: 0.7 });
    ball(g, x - 4, y - 31, 1.6, 2, '#2b1b22', { spec: 0.6 }); ball(g, x + 4, y - 31, 1.6, 2, '#2b1b22', { spec: 0.6 });
    // hat
    const hg = g.createLinearGradient(x - 11, 0, x + 11, 0); hg.addColorStop(0, '#ff7a6a'); hg.addColorStop(0.45, '#e5322e'); hg.addColorStop(1, '#a01826');
    g.fillStyle = hg; g.beginPath(); g.moveTo(x - 12, y - 31); g.quadraticCurveTo(x - 9, y - 40, x + 3, y - 46); g.quadraticCurveTo(x + 9, y - 38, x + 12, y - 31); g.quadraticCurveTo(x, y - 27, x - 12, y - 31); g.fill();
    ball(g, x, y - 31, 13, 4, '#e5322e', { spec: 0.5 });
    ball(g, x + 3, y - 46, 3.2, 3.2, '#ff5a50');
    g.strokeStyle = 'rgba(255,255,255,.5)'; g.lineWidth = 2; g.lineCap = 'round'; g.beginPath(); g.moveTo(x - 7, y - 33); g.quadraticCurveTo(x - 4, y - 40, x, y - 43); g.stroke();
  }
  function beachBall(g, x, y) {
    shadow(g, x + 2, y + 1, 12, 4, 0.34);
    const cy = y - 9, r = 9.5;
    g.save(); g.beginPath(); g.arc(x, cy, r, 0, TAU); g.clip();
    const cols = ['#ff4f5a', '#fff6e0', '#ffd23a', '#fff6e0', '#3f9fe8', '#fff6e0'];
    cols.forEach((c, i) => { g.fillStyle = c; g.beginPath(); g.moveTo(x, cy); g.arc(x, cy, r + 2, i * TAU / 6 + 0.4, (i + 1) * TAU / 6 + 0.4); g.closePath(); g.fill(); });
    const og = g.createRadialGradient(x - 3.5, cy - 4, 1, x - 1, cy - 1, r * 1.3);
    og.addColorStop(0, 'rgba(255,255,255,.65)'); og.addColorStop(0.3, 'rgba(255,255,255,0)'); og.addColorStop(0.65, 'rgba(60,20,50,.05)'); og.addColorStop(1, 'rgba(60,20,50,.5)');
    g.fillStyle = og; g.fillRect(x - r, cy - r, r * 2, r * 2); g.restore();
    ball(g, x, cy - r + 0.5, 2.2, 1.2, '#fff6e0', { spec: 0, dark: 0.3 });
  }
  function frisbee(g, x, y) {
    shadow(g, x + 2, y, 18, 6, 0.3);
    g.save(); g.translate(x, y - 5); g.rotate(-0.08);
    g.fillStyle = '#c4571c'; g.beginPath(); g.ellipse(0, 3.2, 16, 7, 0, 0, TAU); g.fill();
    ball(g, 0, 0, 16, 7.2, '#ff8a2e', { spec: 0.5 });
    g.fillStyle = 'rgba(190,70,10,.35)'; g.beginPath(); g.ellipse(0.5, 0.4, 10.5, 4.4, 0, 0, TAU); g.fill();
    ball(g, -0.5, -0.5, 9.5, 3.9, '#ffa24a', { spec: 0.55, dark: 0.4 });
    g.restore();
  }
  function stick(g, x, y) {
    shadow(g, x + 2, y + 1, 18, 4.5, 0.28);
    limb(g, x - 14, y - 4, x + 15, y - 6, 5.6, '#a16a3c');
    limb(g, x - 2, y - 5, x + 5, y - 12, 3.2, '#a16a3c');
    ball(g, x + 16, y - 6, 3, 2.8, '#d9a56a', { spec: 0.3 });
  }

  /* ---------------- FENCE / HEDGE / HOUSE / POND / TRUCK ---------------- */
  function fence(g, x0, y) {
    shadow(g, x0 + 98, y + 1, 112, 8, 0.3);
    // rails
    [-12, -27].forEach((ry) => { block(g, x0, y + ry - 3, 192, 6, 3, '#d9a56a', { gloss: 0.3 }); });
    for (let i = 0; i < 12; i++) {
      const px = x0 + 7 + Math.floor(i / 3) * 48 + (i % 3) * 14, off = window.MK.hash(i, 3, 1);
      const col = mix('#fff1d6', '#ffe0b0', off * 0.6);
      block(g, px, y - 40 + (off * 3 | 0), 11, 41 - (off * 3 | 0), 5.5, col, { gloss: 0.5 });
      g.fillStyle = 'rgba(70,40,20,.14)'; g.fillRect(px + 8, y - 36, 2.5, 34);
    }
    for (let i = 0; i < 5; i++) {
      const px = x0 + i * 48;
      block(g, px - 5, y - 46, 10, 47, 5, '#e8b574', { gloss: 0.45 });
      ball(g, px, y - 47, 6.5, 6.5, '#f3c88b');
    }
  }
  function hedge(g, x0, y) {
    const rnd = window.MK.rng(41);
    shadow(g, x0 + 100, y + 2, 118, 16, 0.38);
    const rows = [{ dy: -30, r: 14, st: 15 }, { dy: -20, r: 16, st: 16 }, { dy: -9, r: 16, st: 16 }];
    rows.forEach((row, ri) => {
      for (let x = x0 - 4 + (ri % 2) * 7; x < x0 + 198; x += row.st + rnd() * 3) {
        const cx = Math.max(x0 + 8, Math.min(x0 + 184, x));
        const col = mix('#2b8f43', '#58bf52', rnd() * 0.7 + ri * 0.08);
        ball(g, cx, y + row.dy + (rnd() - 0.5) * 3, row.r, row.r * 0.95, col, { spec: 0.4 });
        dots(g, rnd, cx, y + row.dy, row.r * 0.8, 12, 0.14);
      }
    });
    // little blossoms
    for (let i = 0; i < 7; i++) ball(g, x0 + 14 + rnd() * 168, y - 8 - rnd() * 24, 2.4, 2.4, i % 2 ? '#ff7a9a' : '#fff0a0', { spec: 0.8 });
  }
  function house(g, x0, y) {
    const w = 144, xr = x0 + w;
    shadow(g, x0 + 72, y + 5, 92, 10, 0.32);
    // path stones
    [[x0 + 72, y + 18, 17, 7], [x0 + 80, y + 36, 16, 6.5], [x0 + 68, y + 53, 18, 7]].forEach((s, i) => {
      shadow(g, s[0] + 2, s[1] + 1, s[2] + 3, s[3] + 1, 0.3);
      ball(g, s[0], s[1], s[2], s[3], i % 2 ? '#d9c9b0' : '#cbbfae', { spec: 0.4 });
    });
    // wall
    block(g, x0, y - 48, w, 48, 7, '#fff0c8');
    block(g, x0, y - 5, w, 5, 2.5, '#c9b79a', { gloss: 0.15 });
    // eave shadow on wall
    const sg = g.createLinearGradient(0, y - 48, 0, y - 36); sg.addColorStop(0, 'rgba(70,30,30,.38)'); sg.addColorStop(1, 'rgba(70,30,30,0)');
    g.fillStyle = sg; g.fillRect(x0 + 2, y - 48, w - 4, 12);
    // window
    const wx = x0 + 52, wy = y - 38;
    block(g, wx - 3, wy - 3, 44, 34, 6, '#ffffff', { gloss: 0.3 });
    const gg = g.createLinearGradient(wx, wy, wx + 38, wy + 28); gg.addColorStop(0, '#d7f4ff'); gg.addColorStop(0.5, '#7cc4f2'); gg.addColorStop(1, '#4a8bd0');
    window.MK.rr(g, wx + 2, wy + 2, 36, 26, 4); g.fillStyle = gg; g.fill();
    g.fillStyle = 'rgba(255,255,255,.55)'; g.beginPath(); g.moveTo(wx + 4, wy + 4); g.lineTo(wx + 16, wy + 4); g.lineTo(wx + 5, wy + 20); g.closePath(); g.fill();
    block(g, wx + 17, wy + 1, 5, 28, 2, '#ffffff'); block(g, wx + 1, wy + 13, 38, 4, 2, '#ffffff');
    // planter
    block(g, wx - 5, wy + 27, 48, 8, 4, '#a5683a');
    for (let i = 0; i < 5; i++) { ball(g, wx + 1 + i * 9.5, wy + 25, 5, 4.5, '#4cae4a', { spec: 0.4 }); ball(g, wx + 2 + i * 9.5, wy + 22, 3.6, 3.6, i % 2 ? '#ff5a78' : '#ffd23a', { spec: 0.8 }); }
    // roof: clay tiles
    g.save(); window.MK.rr(g, x0 - 6, y - 98, w + 12, 54, 10); g.clip();
    const rg = g.createLinearGradient(0, y - 98, 0, y - 44); rg.addColorStop(0, '#d9703c'); rg.addColorStop(1, '#a8402c'); g.fillStyle = rg; g.fillRect(x0 - 6, y - 98, w + 12, 54);
    const rnd = window.MK.rng(7);
    for (let r = 0; r < 4; r++) {
      for (let tx = x0 - 14 + (r % 2) * 9; tx < xr + 10; tx += 18) {
        const col = mix('#e07a44', '#b94a30', r / 4 + rnd() * 0.25);
        ball(g, tx + 9, y - 90 + r * 13 + 9, 10, 9.5, col, { spec: 0.4 });
      }
    }
    g.restore();
    // ridge cap + eave lip
    ball(g, x0 + 72, y - 98, 78, 7, '#f08f56', { spec: 0.6 });
    ball(g, x0 + 72, y - 46, 76, 5, '#8f3326', { spec: 0.3, lit: 0.3 });
    block(g, x0 - 6, y - 52, w + 12, 8, 4, '#c25a36', { gloss: 0.3 });
  }
  function pond(g, x, y) {
    shadow(g, x + 6, y + 8, 88, 40, 0.14);
    // sandy shore
    ball(g, x, y, 86, 47, '#f1d49a', { spec: 0.25, dark: 0.55 });
    const rnd = window.MK.rng(3);
    dots(g, rnd, x, y, 70, 60, 0.22);
    // inner bank lip
    g.save(); g.translate(x, y + 1); g.scale(1, 0.55);
    const lg = g.createLinearGradient(-60, -60, 60, 60); lg.addColorStop(0, '#b6925a'); lg.addColorStop(1, '#f6e1b0');
    g.fillStyle = lg; g.beginPath(); g.arc(0, 0, 71, 0, TAU); g.fill(); g.restore();
    // water
    g.save(); g.translate(x, y + 2); g.scale(1, 0.54);
    const wg = g.createRadialGradient(8, 10, 5, 0, 0, 68); wg.addColorStop(0, '#79d6f5'); wg.addColorStop(0.55, '#3aa5e3'); wg.addColorStop(1, '#2468b8');
    g.fillStyle = wg; g.beginPath(); g.arc(0, 0, 66, 0, TAU); g.fill();
    // bank shadow on water (top-left)
    g.beginPath(); g.arc(0, 0, 66, 0, TAU); g.clip();
    const ig = g.createRadialGradient(24, 24, 40, 0, 0, 72); ig.addColorStop(0, 'rgba(20,60,120,0)'); ig.addColorStop(1, 'rgba(10,40,100,.5)');
    g.fillStyle = ig; g.fillRect(-70, -70, 140, 140);
    g.restore();
    // ripples
    g.lineCap = 'round';
    [[x - 10, y - 2, 30, 0.7], [x - 10, y - 2, 20, 0.55], [x - 10, y - 2, 10, 0.4], [x + 30, y + 10, 14, 0.5], [x + 30, y + 10, 7, 0.35]].forEach((rp) => {
      g.strokeStyle = 'rgba(255,255,255,' + rp[3] + ')'; g.lineWidth = 2; g.beginPath(); g.ellipse(rp[0], rp[1], rp[2], rp[2] * 0.45, 0, 0.2, Math.PI * 1.7); g.stroke();
    });
    // glossy sheen
    g.fillStyle = 'rgba(255,255,255,.35)'; g.beginPath(); g.ellipse(x - 34, y - 12, 14, 3.5, -0.3, 0, TAU); g.fill();
    // lily pad + flower
    ball(g, x + 34, y + 6, 13, 6, '#4ec04f', { spec: 0.6 });
    g.fillStyle = '#2468b8'; g.beginPath(); g.moveTo(x + 34, y + 6); g.lineTo(x + 46, y + 1); g.lineTo(x + 46, y + 8); g.closePath(); g.fill();
    ball(g, x + 31, y + 3, 4.5, 3.5, '#ff8fb0', { spec: 0.8 }); ball(g, x + 31, y + 2.5, 2, 1.7, '#ffe36b', { spec: 0.6 });
    // shore pebbles + reeds
    [[-72, 8, 5], [-66, 22, 4], [60, 28, 5], [72, 14, 4], [-50, 34, 4]].forEach((p) => ball(g, x + p[0], y + p[1], p[2], p[2] * 0.75, '#b9a58a', { spec: 0.5 }));
    [[-62, -22], [-56, -26], [-68, -18]].forEach((p, i) => { limb(g, x + p[0], y + p[1] + 6, x + p[0] + i - 1, y + p[1] - 14, 3, '#4ab04a'); ball(g, x + p[0] + i - 1, y + p[1] - 16, 3, 5.5, '#8a5a30', { spec: 0.5 }); });
  }
  function truck(g, x, y) {
    g.save(); g.translate(x, y);
    shadow(g, 2, 2, 52, 13, 0.36);
    const Y = '#ffcf2e';
    block(g, -43, -27, 86, 28, 10, drk(Y, 0.18), { gloss: 0.15 });
    // wheels (near side)
    wheel(g, -25, -3, 9.5, '#2b2833', '#c7ccd8'); wheel(g, 25, -3, 9.5, '#2b2833', '#c7ccd8');
    // top plane
    block(g, -43, -46, 86, 36, 11, Y, { gloss: 0.55 });
    // bed
    window.MK.rr(g, -39, -42, 36, 28, 6); const bg = g.createLinearGradient(-39, -42, -3, -14); bg.addColorStop(0, drk(Y, 0.5)); bg.addColorStop(0.4, drk(Y, 0.22)); bg.addColorStop(1, drk(Y, 0.1)); g.fillStyle = bg; g.fill();
    g.strokeStyle = 'rgba(120,70,0,.3)'; g.lineWidth = 1.4; for (let i = 0; i < 4; i++) { g.beginPath(); g.moveTo(-34 + i * 8, -40); g.lineTo(-34 + i * 8, -16); g.stroke(); }
    // cargo: a few toy crates / flowerpot
    block(g, -32, -34, 12, 12, 3, '#c98a4e', { gloss: 0.4 });
    ball(g, -12, -27, 6, 6, '#e8573f');
    // rear window, roof, windshield, hood
    block(g, -9, -41, 5, 26, 2.5, '#5a7fa8', { gloss: 0.2 });
    block(g, -3, -43, 28, 30, 10, lit(Y, 0.12), { gloss: 0.7 });
    const wg = g.createLinearGradient(25, -42, 33, -14); wg.addColorStop(0, '#d8f2ff'); wg.addColorStop(1, '#4b8ccc');
    window.MK.rr(g, 25, -41, 8, 26, 3); g.fillStyle = wg; g.fill();
    block(g, 33, -41, 9, 28, 5, Y, { gloss: 0.5 });
    // lights + bumper
    ball(g, 41, -38, 3.2, 3.6, '#fffbd0', { spec: 0.9 }); ball(g, 41, -17, 3.2, 3.6, '#fffbd0', { spec: 0.9 });
    ball(g, -42, -38, 2.4, 3, '#e8383f', { spec: 0.7 }); ball(g, -42, -17, 2.4, 3, '#e8383f', { spec: 0.7 });
    g.restore();
  }

  window.STYLES.push({
    id: 'D', name: 'Clay Toy (soft 3D)',
    blurb: 'Everything is an inflated, glossy-matte clay or vinyl volume: radial-gradient shading from a strong top-left key, soft specular blobs, warm rim light and squishy contact shadows. Chunky bead-eyed toy kid, felt-broccoli trees, plastic toy mowers, wooden toy-block fence and house.',
    draw(g, MK) {
      const S = MK.slots;
      kid(g, S.kidIdle.x, S.kidIdle.y, 's'); label(g, 'kid', S.kidIdle.x, S.kidIdle.y + 16);
      scytheKid(g, S.kidScythe.x, S.kidScythe.y); label(g, 'scythe swing', S.kidScythe.x + 20, S.kidScythe.y + 16);
      gasKid(g, S.kidPush.x, S.kidPush.y); label(g, 'push mower', S.kidPush.x, S.kidPush.y + 16);
      reel(g, S.reel.x, S.reel.y); label(g, 'reel mower', S.reel.x, S.reel.y + 16);
      ride(g, S.ride.x, S.ride.y); label(g, 'ride-on mower', S.ride.x, S.ride.y + 16);
      treeSmall(g, S.treeSmall.x, S.treeSmall.y); label(g, 'small tree', S.treeSmall.x, S.treeSmall.y + 18);
      treeBig(g, S.treeBig.x, S.treeBig.y); label(g, 'big oak', S.treeBig.x, S.treeBig.y + 20);
      rock(g, S.rock.x, S.rock.y); label(g, 'rock', S.rock.x, S.rock.y + 16);
      const fx = S.flowers.x, fy = S.flowers.y;
      [['daisy', 'daisy'], ['tulip', 'poppy'], ['aster', 'aster'], ['sun', 'sunflower']].forEach((f, i) => { patch(g, f[0], fx + i * 60, fy); label(g, f[1], fx + i * 60, fy + (i === 3 ? 30 : 16)); });
      gnome(g, S.gnome.x, S.gnome.y); label(g, 'gnome', S.gnome.x, S.gnome.y + 16);
      beachBall(g, S.gnome.x + 55, S.gnome.y); label(g, 'ball', S.gnome.x + 55, S.gnome.y + 16);
      frisbee(g, S.gnome.x + 110, S.gnome.y); label(g, 'frisbee', S.gnome.x + 110, S.gnome.y + 16);
      stick(g, S.gnome.x + 165, S.gnome.y); label(g, 'stick', S.gnome.x + 165, S.gnome.y + 16);
      fence(g, S.fence.x, S.fence.y); label(g, 'picket fence', S.fence.x + 96, S.fence.y + 16);
      hedge(g, S.hedge.x, S.hedge.y); label(g, 'hedge', S.hedge.x + 96, S.hedge.y + 16);
      house(g, S.house.x, S.house.y); label(g, 'house + path', S.house.x + 72, S.house.y + 78);
      pond(g, S.pond.x, S.pond.y - 8); label(g, 'pond', S.pond.x, S.pond.y + 54);
      truck(g, S.truck.x - 10, S.truck.y); label(g, 'pickup truck', S.truck.x - 10, S.truck.y + 16);
    }
  });
})();
