/* C · Bold Handcrafted Vector — dark tinted outlines, flat + one shade + one highlight, chunky proportions */
(function () {
  const TAU = Math.PI * 2;
  const SH = 'rgba(22,76,40,.30)';
  const P = {
    rr: (x, y, w, h, r) => (g) => window.MK.rr(g, x, y, w, h, r),
    el: (cx, cy, rx, ry) => (g) => { g.beginPath(); g.ellipse(cx, cy, rx, ry, 0, 0, TAU); },
    poly: (pts) => (g) => { g.beginPath(); pts.forEach((p, i) => (i ? g.lineTo(p[0], p[1]) : g.moveTo(p[0], p[1]))); g.closePath(); },
  };
  /* flat base + one shade crescent (bottom-right) + outline */
  function cel(g, p, base, shade, out, o, lw) {
    o = o === undefined ? 3 : o; lw = lw || 2;
    g.save(); p(g); g.fillStyle = shade || base; g.fill();
    if (shade) { g.clip(); g.translate(-o, -o * 0.8); p(g); g.fillStyle = base; g.fill(); }
    g.restore();
    if (out) { p(g); g.lineWidth = lw; g.lineJoin = 'round'; g.strokeStyle = out; g.stroke(); }
  }
  function shadow(g, x, y, rx, ry, a) { g.save(); g.globalAlpha = a === undefined ? 1 : a; g.fillStyle = SH; g.beginPath(); g.ellipse(x, y, rx, ry, 0, 0, TAU); g.fill(); g.restore(); }
  function spark(g, x, y, s, a) {
    g.save(); g.globalAlpha = a === undefined ? 1 : a; g.fillStyle = '#fff'; g.beginPath(); g.moveTo(x, y - s);
    g.quadraticCurveTo(x, y, x + s, y); g.quadraticCurveTo(x, y, x, y + s); g.quadraticCurveTo(x, y, x - s, y); g.quadraticCurveTo(x, y, x, y - s); g.fill(); g.restore();
  }
  function label(g, x, y, t) {
    g.save(); g.font = 'bold 12px ui-rounded, "Trebuchet MS", system-ui, sans-serif'; g.textAlign = 'center'; g.textBaseline = 'middle';
    g.lineJoin = 'round'; g.lineWidth = 3.5; g.strokeStyle = 'rgba(18,44,28,.88)'; g.strokeText(t, x, y); g.fillStyle = '#fff'; g.fillText(t, x, y); g.restore();
  }
  function tube(g, pts, w, col, out) {
    g.save(); g.lineCap = 'round'; g.lineJoin = 'round';
    const run = (ww, c) => { g.lineWidth = ww; g.strokeStyle = c; g.beginPath(); pts.forEach((p, i) => (i ? g.lineTo(p[0], p[1]) : g.moveTo(p[0], p[1]))); g.stroke(); };
    if (out) run(w + 3.6, out); run(w, col); g.restore();
  }
  function tuft(g, x, y, n, seed, h) {
    const R = window.MK.rng(seed);
    for (let i = 0; i < n; i++) window.MK.blade(g, x + (R() - 0.5) * 18, y + R() * 3, (h || 12) + R() * 8, (R() - 0.5) * 8, 1.8, '#226329', '#3f9a45', R() > 0.5 ? '#8bdc6a' : '#5bbb5a');
  }
  /* union of circles with outline, dark underside band, base, highlight (trees / hedges) */
  function blob(g, cs, c, sh) {
    sh = sh || 7;
    g.fillStyle = c.out; cs.forEach((k) => { g.beginPath(); g.arc(k.x, k.y, k.r + 2.2, 0, TAU); g.fill(); });
    g.fillStyle = c.dark; cs.forEach((k) => { g.beginPath(); g.arc(k.x, k.y, k.r, 0, TAU); g.fill(); });
    g.save(); g.beginPath(); cs.forEach((k) => { g.moveTo(k.x + k.r, k.y); g.arc(k.x, k.y, k.r, 0, TAU); }); g.clip();
    g.lineCap = 'round';
    cs.forEach((k) => {
      g.fillStyle = c.base; g.beginPath(); g.arc(k.x, k.y - sh, k.r * 0.97, 0, TAU); g.fill();
      if (!k.noLine) { g.strokeStyle = c.line; g.lineWidth = 1.7; g.beginPath(); g.arc(k.x, k.y - sh, k.r * 0.97, 0.18 * Math.PI, 0.82 * Math.PI); g.stroke(); }
    });
    g.fillStyle = c.hi; cs.forEach((k) => { if (k.hl) { g.beginPath(); g.arc(k.x - k.r * 0.18, k.y - sh - k.r * 0.3, k.r * 0.5, 0, TAU); g.fill(); } });
    g.restore();
  }
  function ring(cx, cy, rx, ry, br, seed, fillTop) {
    const R = window.MK.rng(seed); const per = Math.PI * (3 * (rx + ry) - Math.sqrt((3 * rx + ry) * (rx + 3 * ry)));
    const n = Math.max(6, Math.round(per / (br * 1.15))); const cs = [];
    for (let k = -rx * 0.6; k <= rx * 0.6; k += br * 1.3) cs.push({ x: cx + k, y: cy - ry * 0.1, r: ry + br * 0.55, noLine: true, hl: false });
    for (let i = 0; i < n; i++) { const a = (i / n) * TAU + 0.25; cs.push({ x: cx + Math.cos(a) * rx, y: cy + Math.sin(a) * ry, r: br * (0.86 + R() * 0.28), hl: Math.sin(a) < 0.25 }); }
    return cs;
  }
  function wob(cx, cy, rx, ry, amp, seed, n) {
    n = n || 16; const R = window.MK.rng(seed); const pts = [];
    for (let i = 0; i < n; i++) { const a = (i / n) * TAU, k = 1 + (R() - 0.5) * amp; pts.push([cx + Math.cos(a) * rx * k, cy + Math.sin(a) * ry * k]); }
    return (g) => {
      g.beginPath(); const m = (a, b) => [(a[0] + b[0]) / 2, (a[1] + b[1]) / 2]; const s = m(pts[n - 1], pts[0]); g.moveTo(s[0], s[1]);
      for (let i = 0; i < n; i++) { const q = m(pts[i], pts[(i + 1) % n]); g.quadraticCurveTo(pts[i][0], pts[i][1], q[0], q[1]); } g.closePath();
    };
  }
  function leaf(g, x, y, len, ang, w, base, dark, out) {
    g.save(); g.translate(x, y); g.rotate(ang);
    cel(g, (gg) => { gg.beginPath(); gg.moveTo(0, 0); gg.quadraticCurveTo(len * 0.5, -w, len, 0); gg.quadraticCurveTo(len * 0.5, w * 0.9, 0, 0); gg.closePath(); }, base, dark, out, 1.4, 1.6);
    g.restore();
  }

  /* ───────────────────────── KID ───────────────────────── */
  const K = { OUT: '#4a2a22', SK: '#ffcfa0', SKS: '#eba477', SHIRT: '#ffd43f', SHS: '#e3a516', DEN: '#3b78c8', DENS: '#2b569c', CAP: '#e8453c', CAPS: '#b32f33', BOOT: '#9a5a30', BOOTS: '#6b3a1e', HAIR: '#8a552e' };

  function kidFront(g, x, y, o) {
    o = o || {}; const back = !!o.back, cy = y - 60;
    if (!o.noShadow) shadow(g, x + 3, y - 1, 21, 7);
    cel(g, P.rr(x - 12, y - 28, 10, 20, 3), K.DEN, K.DENS, K.OUT, 2);
    cel(g, P.rr(x + 2, y - 28, 10, 20, 3), K.DEN, K.DENS, K.OUT, 2);
    [x - 14, x + 1].forEach((bx) => {
      cel(g, P.rr(bx, y - 10, 13, 10, 4), K.BOOT, K.BOOTS, K.OUT, 2.5);
      g.fillStyle = '#f4e3c0'; g.fillRect(bx + 1.5, y - 3.5, 10, 2);
    });
    /* arms (behind torso when raised) */
    const hx = o.hands;
    if (hx) { [-1, 1].forEach((s) => tube(g, [[x + s * 14, y - 42], [x + s * 18.5, y - 50]], 7, K.SHIRT, K.OUT)); }
    cel(g, P.rr(x - 15, y - 49, 30, 29, 9), K.SHIRT, K.SHS, K.OUT, 3);
    cel(g, P.rr(x - 13, y - 32, 26, 14, 4), K.DEN, K.DENS, K.OUT, 2.5);
    if (!back) {
      cel(g, P.rr(x - 8, y - 43, 16, 14, 3), K.DEN, K.DENS, null, 2);
      g.fillStyle = '#ffd43f'; [-6.5, 6.5].forEach((dx) => { g.beginPath(); g.arc(x + dx, y - 38, 1.8, 0, TAU); g.fill(); });
      g.strokeStyle = K.OUT; g.lineWidth = 1.2; g.strokeRect(x - 4, y - 31, 8, 4);
    } else { g.fillStyle = K.DENS; g.fillRect(x - 3, y - 31, 6, 1.6); }
    g.fillStyle = K.DEN; g.fillRect(x - 9, y - 49, 4, 7); g.fillRect(x + 5, y - 49, 4, 7);
    if (hx) {
      [-1, 1].forEach((s) => { g.fillStyle = K.SK; g.beginPath(); g.arc(x + s * 19, y - 52, 4.4, 0, TAU); g.fill(); g.lineWidth = 2; g.strokeStyle = K.OUT; g.stroke(); });
    } else {
      [-1, 1].forEach((s) => {
        cel(g, P.rr(x + (s < 0 ? -22 : 14), y - 47, 8, 20, 4), K.SHIRT, K.SHS, K.OUT, 2);
        g.fillStyle = K.SK; g.beginPath(); g.arc(x + s * 18, y - 25, 4.3, 0, TAU); g.fill(); g.lineWidth = 2; g.strokeStyle = K.OUT; g.stroke();
      });
    }
    /* head */
    [-1, 1].forEach((s) => { g.fillStyle = K.SKS; g.beginPath(); g.arc(x + s * 14.5, cy + 3, 3.3, 0, TAU); g.fill(); g.lineWidth = 2; g.strokeStyle = K.OUT; g.stroke(); });
    cel(g, P.el(x, cy + 1, 14.5, 13.5), back ? K.HAIR : K.SK, back ? '#6b3f1f' : K.SKS, K.OUT, 3, 2);
    if (!back) {
      g.fillStyle = K.HAIR; [-1, 1].forEach((s) => { g.beginPath(); g.ellipse(x + s * 12.5, cy - 1, 3.4, 5.5, 0, 0, TAU); g.fill(); });
      [-1, 1].forEach((s) => {
        g.fillStyle = '#2a1a1a'; g.beginPath(); g.ellipse(x + s * 5.6, cy + 3.6, 2.2, 2.8, 0, 0, TAU); g.fill();
        g.fillStyle = '#fff'; g.beginPath(); g.arc(x + s * 5.6 - 0.7, cy + 2.6, 0.9, 0, TAU); g.fill();
        g.fillStyle = 'rgba(255,110,110,.55)'; g.beginPath(); g.ellipse(x + s * 9.5, cy + 8, 3, 1.9, 0, 0, TAU); g.fill();
      });
      g.strokeStyle = K.OUT; g.lineWidth = 1.7; g.lineCap = 'round'; g.beginPath(); g.arc(x, cy + 6.5, 3.2, 0.2 * Math.PI, 0.8 * Math.PI); g.stroke();
    }
    /* cap */
    if (back) {
      cel(g, (gg) => { gg.beginPath(); gg.moveTo(x - 16, cy + 2); gg.bezierCurveTo(x - 17, cy - 24, x + 17, cy - 24, x + 16, cy + 2); gg.quadraticCurveTo(x, cy + 6, x - 16, cy + 2); gg.closePath(); }, K.CAP, K.CAPS, K.OUT, 3);
      g.fillStyle = '#ffb3a0'; g.strokeStyle = K.OUT; g.lineWidth = 1.5; MK_rrFill(g, x - 5, cy - 0.5, 10, 4, 1.5);
    } else {
      cel(g, (gg) => { gg.beginPath(); gg.moveTo(x - 15.5, cy - 2); gg.bezierCurveTo(x - 17, cy - 24, x + 17, cy - 24, x + 15.5, cy - 2); gg.closePath(); }, K.CAP, K.CAPS, K.OUT, 3);
      cel(g, (gg) => { gg.beginPath(); gg.ellipse(x, cy - 2.5, 17, 5, 0, 0, Math.PI); gg.closePath(); }, '#cf3a3a', K.CAPS, K.OUT, 2, 2);
    }
    g.fillStyle = K.OUT; g.beginPath(); g.arc(x, cy - 18.2, 2.2, 0, TAU); g.fill();
    g.strokeStyle = 'rgba(255,255,255,.8)'; g.lineWidth = 2.4; g.lineCap = 'round'; g.beginPath(); g.arc(x, cy - 3, 12.5, 1.15 * Math.PI, 1.42 * Math.PI); g.stroke();
  }
  function MK_rrFill(g, x, y, w, h, r) { window.MK.rr(g, x, y, w, h, r); g.fill(); g.stroke(); }

  function limb(g, a, b, col, w) { tube(g, [a, b], w, col, K.OUT); }
  function hand(g, x, y) { g.fillStyle = K.SK; g.beginPath(); g.arc(x, y, 4.3, 0, TAU); g.fill(); g.lineWidth = 2; g.strokeStyle = K.OUT; g.stroke(); }
  function kidSide(g, x, y, o) {
    o = o || {}; const l = o.lean || 0, st = o.stride === undefined ? 5 : o.stride, cx = x + l * 0.6, cy = y - 61, hx = x + 2 + l;
    const sh = [cx + 1, y - 43]; const hands = o.hands || [[cx + 10, y - 30], [cx + 12, y - 28]];
    if (!o.noShadow) shadow(g, x + 5, y - 1, 23, 7);
    if (!o.noLegs) {
      const bx = x - st, fx = x + st;
      cel(g, P.rr(bx - 5, y - 28, 10, 20, 3), K.DENS, null, K.OUT, 2);
      cel(g, P.rr(bx - 8, y - 10, 17, 10, 4), K.BOOTS, null, K.OUT, 2);
      cel(g, P.rr(fx - 5, y - 28, 10, 20, 3), K.DEN, K.DENS, K.OUT, 2);
      cel(g, P.rr(fx - 8, y - 10, 17, 10, 4), K.BOOT, K.BOOTS, K.OUT, 2.5);
      g.fillStyle = '#f4e3c0'; g.fillRect(fx - 7, y - 3.5, 15, 2); g.fillStyle = 'rgba(0,0,0,.18)'; g.fillRect(bx - 7, y - 3.5, 15, 2);
    }
    limb(g, [sh[0] - 1, sh[1]], hands[1], K.SHS, 5.4); hand(g, hands[1][0], hands[1][1]);
    cel(g, P.rr(cx - 10.5, y - 49, 21, 28, 8), K.SHIRT, K.SHS, K.OUT, 3);
    cel(g, P.rr(cx - 10.5, y - 32, 21, 14, 4), K.DEN, K.DENS, K.OUT, 2.5);
    cel(g, P.rr(cx + 1, y - 43, 9, 13, 3), K.DEN, K.DENS, null, 2);
    tube(g, [[cx + 4, y - 43], [cx - 3, y - 49]], 3.2, K.DEN, null);
    g.fillStyle = '#ffd43f'; g.beginPath(); g.arc(cx + 6, y - 38, 1.7, 0, TAU); g.fill();
    if (o.legsFn) o.legsFn(g);
    if (o.propFn) o.propFn(g);
    limb(g, sh, hands[0], K.SHIRT, 5.4); hand(g, hands[0][0], hands[0][1]);
    /* head, profile east */
    g.fillStyle = K.HAIR; g.beginPath(); g.ellipse(hx - 9, cy + 2, 7, 9, 0, 0, TAU); g.fill(); g.lineWidth = 2; g.strokeStyle = K.OUT; g.stroke();
    cel(g, P.el(hx, cy + 1.5, 13.5, 13), K.SK, K.SKS, K.OUT, 3);
    g.fillStyle = K.SKS; g.beginPath(); g.arc(hx - 3, cy + 4.5, 3.2, 0, TAU); g.fill(); g.lineWidth = 1.6; g.strokeStyle = K.OUT; g.stroke();
    g.fillStyle = K.SK; g.beginPath(); g.arc(hx + 13.4, cy + 5.5, 2.3, 0, TAU); g.fill(); g.lineWidth = 1.6; g.stroke();
    g.fillStyle = '#2a1a1a'; g.beginPath(); g.ellipse(hx + 7, cy + 3.5, 2, 2.7, 0, 0, TAU); g.fill();
    g.fillStyle = '#fff'; g.beginPath(); g.arc(hx + 6.4, cy + 2.6, 0.85, 0, TAU); g.fill();
    g.fillStyle = 'rgba(255,110,110,.55)'; g.beginPath(); g.ellipse(hx + 5.5, cy + 9, 3, 1.9, 0, 0, TAU); g.fill();
    g.strokeStyle = K.OUT; g.lineWidth = 1.6; g.lineCap = 'round'; g.beginPath(); g.arc(hx + 8.5, cy + 8.6, 2.8, 0.15 * Math.PI, 0.75 * Math.PI); g.stroke();
    cel(g, (gg) => { gg.beginPath(); gg.moveTo(hx - 14.5, cy - 1); gg.bezierCurveTo(hx - 15.5, cy - 23, hx + 13, cy - 22, hx + 14, cy - 4); gg.closePath(); }, K.CAP, K.CAPS, K.OUT, 3);
    cel(g, (gg) => { gg.beginPath(); gg.moveTo(hx + 8, cy - 6); gg.lineTo(hx + 25, cy - 3.5); gg.quadraticCurveTo(hx + 28, cy - 0.5, hx + 23, cy + 0.5); gg.lineTo(hx + 8, cy - 1.5); gg.closePath(); }, '#cf3a3a', K.CAPS, K.OUT, 1.5, 2);
    g.fillStyle = K.OUT; g.beginPath(); g.arc(hx - 0.5, cy - 18, 2.2, 0, TAU); g.fill();
    g.strokeStyle = 'rgba(255,255,255,.8)'; g.lineWidth = 2.4; g.beginPath(); g.arc(hx - 1, cy - 4, 12, 1.1 * Math.PI, 1.4 * Math.PI); g.stroke();
  }

  /* ───────────────────────── MOWERS ───────────────────────── */
  const M = { RED: '#e8423a', REDS: '#b32d34', OUT: '#4e1a26', YEL: '#ffd23a', YELS: '#e8a516', GRY: '#c9d0da', GRYS: '#8e98a8', GOUT: '#34394a', TIRE: '#464c5a', TIRES: '#2e323e' };
  function wheelTop(g, x, y, w, h) { cel(g, P.rr(x, y, w, h, 3.5), M.TIRE, M.TIRES, M.GOUT, 2, 2); g.fillStyle = 'rgba(255,255,255,.22)'; g.fillRect(x + 1.5, y + 3, 1.6, h - 6); }

  function gasMower(g, x, y, bar) { bar = bar || 6; /* x centre, y = rear edge of deck (ground) , front toward -y */
    shadow(g, x + 6, y - 24, 29, 33, 1);
    wheelTop(g, x - 28, y - 56, 9, 17); wheelTop(g, x + 19, y - 56, 9, 17);
    wheelTop(g, x - 29, y - 22, 10, 22); wheelTop(g, x + 19, y - 22, 10, 22);
    cel(g, P.rr(x - 21, y - 60, 42, 60, 11), M.RED, M.REDS, M.OUT, 4);
    cel(g, P.rr(x - 15, y - 61, 30, 6, 2), '#43303b', null, M.OUT, 2);
    cel(g, P.rr(x - 4.5, y - 52, 9, 46, 2), M.YEL, M.YELS, '#7a4c10', 2, 1.6);
    /* engine */
    cel(g, P.el(x, y - 28, 12, 11), M.GRY, M.GRYS, M.GOUT, 3, 2);
    cel(g, P.el(x, y - 30, 7, 6), '#eef2f6', '#b9c2ce', M.GOUT, 2, 1.6);
    g.fillStyle = '#ff5a3c'; g.beginPath(); g.arc(x, y - 30, 2.6, 0, TAU); g.fill();
    g.fillStyle = M.YEL; g.strokeStyle = M.GOUT; g.lineWidth = 1.5; g.beginPath(); g.arc(x + 9, y - 16, 2.7, 0, TAU); g.fill(); g.stroke();
    g.strokeStyle = 'rgba(255,255,255,.75)'; g.lineWidth = 2.4; g.lineCap = 'round'; g.beginPath(); g.moveTo(x - 16, y - 48); g.lineTo(x - 16, y - 38); g.stroke();
    spark(g, x - 14, y - 52, 3);
    /* handle */
    tube(g, [[x - 13, y - 3], [x - 19, y + bar]], 3.4, M.GRY, M.GOUT); tube(g, [[x + 13, y - 3], [x + 19, y + bar]], 3.4, M.GRY, M.GOUT);
    tube(g, [[x - 21, y + bar], [x + 21, y + bar]], 4, M.GRY, M.GOUT);
  }

  function reelMower(g, x, y) {
    shadow(g, x + 5, y - 3, 40, 9);
    /* far wheel + far handle rail */
    cel(g, P.el(x - 8, y - 33, 11, 11), M.TIRES, null, M.GOUT, 2);
    tube(g, [[x - 14, y - 33], [x - 38, y - 56]], 3, '#d9a25a', '#5a3a1a');
    /* reel drum: body going back + radial-blade end cap */
    cel(g, P.rr(x + 15, y - 32, 18, 24, 6), M.GRY, M.GRYS, M.GOUT, 3, 2);
    g.strokeStyle = M.YEL; g.lineWidth = 3; g.save(); P.rr(x + 15, y - 32, 18, 24, 6)(g); g.clip();
    for (let i = 0; i < 5; i++) { g.beginPath(); g.moveTo(x + 12, y - 30 + i * 7); g.lineTo(x + 36, y - 36 + i * 7); g.stroke(); } g.restore();
    P.rr(x + 15, y - 32, 18, 24, 6)(g); g.lineWidth = 2; g.strokeStyle = M.GOUT; g.stroke();
    cel(g, P.el(x + 24, y - 9, 12, 8.5), '#eef2f6', M.GRYS, M.GOUT, 2, 2);
    g.strokeStyle = M.YELS; g.lineWidth = 2.2; for (let i = 0; i < 4; i++) { const a = i * Math.PI / 4 + 0.3; g.beginPath(); g.moveTo(x + 24 + Math.cos(a) * 9.5, y - 9 + Math.sin(a) * 6.5); g.lineTo(x + 24 - Math.cos(a) * 9.5, y - 9 - Math.sin(a) * 6.5); g.stroke(); }
    cel(g, P.el(x + 24, y - 9, 2.8, 2), M.RED, null, M.OUT, 0, 1.4);
    /* frame */
    cel(g, P.rr(x - 10, y - 22, 30, 9, 4), M.RED, M.REDS, M.OUT, 2.5, 2);
    cel(g, P.rr(x - 12, y - 42, 6, 22, 3), M.RED, M.REDS, M.OUT, 2, 2);
    /* near wheel */
    cel(g, P.el(x - 8, y - 11, 13, 13), M.TIRE, M.TIRES, M.GOUT, 3, 2);
    cel(g, P.el(x - 8, y - 11, 7, 7), M.YEL, M.YELS, '#7a4c10', 2, 1.6);
    g.strokeStyle = '#7a4c10'; g.lineWidth = 1.4; for (let i = 0; i < 3; i++) { const a = i * Math.PI / 3; g.beginPath(); g.moveTo(x - 8 + Math.cos(a) * 6, y - 11 + Math.sin(a) * 6); g.lineTo(x - 8 - Math.cos(a) * 6, y - 11 - Math.sin(a) * 6); g.stroke(); }
    /* near handle */
    tube(g, [[x - 8, y - 22], [x - 36, y - 52]], 3.4, '#e0a85e', '#5a3a1a');
    tube(g, [[x - 41, y - 48], [x - 31, y - 57]], 5, M.RED, M.OUT);
    spark(g, x - 3, y - 6, 3); spark(g, x + 20, y - 30, 2.6, 0.9);
  }

  function rideMower(g, x, y) {
    shadow(g, x + 4, y - 4, 54, 11);
    /* far wheels */
    cel(g, P.el(x - 28, y - 37, 14, 14), M.TIRES, null, M.GOUT, 2); cel(g, P.el(x + 33, y - 33, 10, 10), M.TIRES, null, M.GOUT, 2);
    /* seat back + roll bar */
    cel(g, P.rr(x - 40, y - 62, 15, 32, 5), '#4b5263', '#353a49', M.GOUT, 2.5);
    /* chassis */
    cel(g, P.rr(x - 42, y - 36, 84, 20, 8), M.RED, M.REDS, M.OUT, 4);
    /* hood */
    cel(g, (gg) => { gg.beginPath(); gg.moveTo(x - 2, y - 34); gg.lineTo(x - 2, y - 52); gg.quadraticCurveTo(x - 2, y - 56, x + 4, y - 56); gg.lineTo(x + 34, y - 52); gg.quadraticCurveTo(x + 46, y - 49, x + 47, y - 36); gg.closePath(); }, M.RED, M.REDS, M.OUT, 4, 2.2);
    g.strokeStyle = 'rgba(255,255,255,.75)'; g.lineWidth = 2.6; g.lineCap = 'round'; g.beginPath(); g.moveTo(x + 4, y - 51); g.lineTo(x + 28, y - 48); g.stroke();
    /* yellow stripe on hood and chassis */
    cel(g, P.rr(x + 4, y - 44, 38, 6, 2), M.YEL, M.YELS, '#7a4c10', 1.5, 1.6);
    cel(g, P.rr(x - 38, y - 27, 80, 5, 2), M.YEL, M.YELS, '#7a4c10', 1.5, 1.6);
    /* grille + light */
    cel(g, P.rr(x + 42, y - 46, 6, 12, 2), '#3b3f4d', null, M.GOUT, 1.5, 1.6);
    g.fillStyle = '#fff6b0'; g.strokeStyle = M.GOUT; g.lineWidth = 1.6; g.beginPath(); g.arc(x + 44, y - 40, 2.4, 0, TAU); g.fill(); g.stroke();
    /* deck under body */
    cel(g, P.rr(x - 10, y - 17, 40, 10, 4), M.GRY, M.GRYS, M.GOUT, 2.5, 2);
    cel(g, P.rr(x + 26, y - 18, 12, 8, 3), '#7d8697', '#5d6678', M.GOUT, 1.5, 1.8);
    /* near wheels */
    cel(g, P.el(x - 28, y - 15, 15, 15), M.TIRE, M.TIRES, M.GOUT, 3.5, 2.2);
    cel(g, P.el(x - 28, y - 15, 8, 8), M.YEL, M.YELS, '#7a4c10', 2, 1.8);
    cel(g, P.el(x + 33, y - 11, 11, 11), M.TIRE, M.TIRES, M.GOUT, 3, 2.2);
    cel(g, P.el(x + 33, y - 11, 5.5, 5.5), M.YEL, M.YELS, '#7a4c10', 1.5, 1.6);
    /* steering */
    tube(g, [[x + 6, y - 54], [x + 8, y - 66]], 3.4, M.GRY, M.GOUT);
    g.save(); g.translate(x + 8, y - 67); g.scale(1, 0.55); g.rotate(-0.2); g.beginPath(); g.arc(0, 0, 10, 0, TAU); g.restore();
    g.lineWidth = 6.4; g.strokeStyle = M.GOUT; g.stroke(); g.lineWidth = 3; g.strokeStyle = M.YEL; g.stroke();
    /* kid seated */
    kidSide(g, x - 20, y - 18, {
      noLegs: true, noShadow: true, stride: 0, lean: 3,
      hands: [[x + 4, y - 66], [x + 3, y - 66]],
      legsFn: (gg) => {
        tube(gg, [[x - 19, y - 40], [x - 3, y - 41], [x + 8, y - 30]], 9.5, K.DEN, K.OUT);
        cel(gg, P.rr(x + 3, y - 31, 17, 10, 4), K.BOOT, K.BOOTS, K.OUT, 2.5, 2);
        gg.fillStyle = '#f4e3c0'; gg.fillRect(x + 4, y - 24.5, 15, 2);
      },
    });
    /* emblem */
    spark(g, x + 30, y - 50, 3.4);
  }

  /* ───────────────────────── NATURE ───────────────────────── */
  function trunk(g, x, y, h, w) {
    cel(g, (gg) => { gg.beginPath(); gg.moveTo(x - w * 1.0, y + 1); gg.quadraticCurveTo(x - w * 0.35, y - 6, x - w * 0.5, y - h); gg.lineTo(x + w * 0.5, y - h); gg.quadraticCurveTo(x + w * 0.35, y - 6, x + w * 1.0, y + 1); gg.quadraticCurveTo(x, y + 5, x - w * 1.0, y + 1); gg.closePath(); }, '#b06f3d', '#7d4727', '#43241a', w * 0.45, 2.2);
    g.strokeStyle = '#6d3f22'; g.lineWidth = 1.6; g.lineCap = 'round';
    [[-0.1, 14, 10], [0.15, 30, 12], [-0.15, 44, 9]].forEach((q) => { if (q[1] < h) { g.beginPath(); g.moveTo(x + q[0] * w, y - q[1]); g.lineTo(x + q[0] * w, y - q[1] - q[2]); g.stroke(); } });
  }
  const TREE = { out: '#103f2e', dark: '#1d7a49', base: '#38b24f', hi: '#86e46e', line: '#2a9444' };
  const TREE2 = { out: '#103f2e', dark: '#238a4a', base: '#4cc45a', hi: '#a4f07c', line: '#34a24a' };
  const OAK = { out: '#17402a', dark: '#2a7a3a', base: '#47ae48', hi: '#98e068', line: '#379a3f' };
  const OAK2 = { out: '#17402a', dark: '#348a3e', base: '#5cc450', hi: '#b4f07c', line: '#45a845' };

  function treeSmall(g, x, y) {
    shadow(g, x + 22, y + 2, 62, 16, 1);
    trunk(g, x, y, 56, 9);
    blob(g, ring(x, y - 74, 52, 20, 24, 11), TREE, 8);
    blob(g, ring(x + 2, y - 98, 34, 11, 21, 12), TREE2, 7);
    const R = window.MK.rng(4);
    [[-30, -76], [24, -86], [-4, -60], [44, -70]].forEach((p) => { g.fillStyle = '#e8453c'; g.strokeStyle = '#6e1f2a'; g.lineWidth = 1.5; g.beginPath(); g.arc(x + p[0], y + p[1], 4.2, 0, TAU); g.fill(); g.stroke(); g.fillStyle = '#fff'; g.beginPath(); g.arc(x + p[0] - 1.3, y + p[1] - 1.4, 1.1, 0, TAU); g.fill(); });
    spark(g, x - 22, y - 112, 3.4); spark(g, x + 28, y - 104, 2.6); spark(g, x - 46, y - 82, 2.4, 0.9);
  }
  function treeBig(g, x, y) {
    shadow(g, x + 30, y + 3, 120, 22, 1);
    trunk(g, x, y, 80, 17);
    cel(g, P.poly([[x - 4, y - 66], [x - 30, y - 92], [x - 24, y - 96], [x + 2, y - 74]]), '#b06f3d', '#7d4727', '#43241a', 2, 2);
    cel(g, P.poly([[x + 4, y - 66], [x + 28, y - 90], [x + 33, y - 85], [x + 8, y - 62]]), '#b06f3d', '#7d4727', '#43241a', 2, 2);
    blob(g, ring(x, y - 92, 100, 28, 34, 21), OAK, 9);
    blob(g, ring(x + 4, y - 126, 62, 17, 31, 22), OAK2, 8);
    spark(g, x - 52, y - 120, 4); spark(g, x + 40, y - 150, 3.4); spark(g, x + 84, y - 108, 3); spark(g, x - 92, y - 90, 2.6, 0.9);
    const R = window.MK.rng(9); g.fillStyle = OAK.hi;
    for (let i = 0; i < 9; i++) { g.beginPath(); g.arc(x - 70 + R() * 140, y - 170 + R() * 60, 1.7, 0, TAU); g.fill(); }
  }
  function rock(g, x, y) {
    shadow(g, x + 8, y + 1, 32, 8, 1);
    const O = '#323c4c';
    const base = [[-24, 0], [-28, -11], [-17, -26], [3, -32], [20, -26], [28, -11], [24, 0]].map((p) => [x + p[0], y + p[1]]);
    cel(g, P.poly(base), '#9aa6b4', '#6c788a', O, 4, 2.4);
    g.save(); P.poly(base)(g); g.clip();
    g.fillStyle = '#cfd8e2'; P.poly([[-28, -11], [-17, -26], [3, -32], [-2, -18], [-16, -10]].map((p) => [x + p[0], y + p[1]]))(g); g.fill();
    g.fillStyle = '#5b6678'; P.poly([[6, -16], [20, -26], [28, -11], [24, 0], [8, 0]].map((p) => [x + p[0], y + p[1]]))(g); g.fill();
    g.fillStyle = '#7e8a9c'; P.poly([[-2, -18], [6, -16], [8, 0], [-14, 0], [-16, -10]].map((p) => [x + p[0], y + p[1]]))(g); g.fill();
    g.restore();
    g.strokeStyle = O; g.lineWidth = 1.6; g.lineJoin = 'round'; g.beginPath(); g.moveTo(x - 2, y - 18); g.lineTo(x + 6, y - 16); g.lineTo(x + 20, y - 26); g.moveTo(x - 2, y - 18); g.lineTo(x - 16, y - 10); g.moveTo(x + 6, y - 16); g.lineTo(x + 8, y); g.stroke();
    P.poly(base)(g); g.lineWidth = 2.4; g.stroke();
    g.strokeStyle = 'rgba(255,255,255,.9)'; g.lineWidth = 2.4; g.lineCap = 'round'; g.beginPath(); g.moveTo(x - 14, y - 24); g.lineTo(x - 2, y - 28); g.stroke();
    spark(g, x - 12, y - 20, 3.2);
    g.fillStyle = '#6fc25a'; g.strokeStyle = '#2d6a2f'; g.lineWidth = 1.4; [[-18, -24, 4.5], [-11, -29, 3.4], [-22, -17, 3]].forEach((m) => { g.beginPath(); g.ellipse(x + m[0], y + m[1], m[2], m[2] * 0.6, 0, 0, TAU); g.fill(); g.stroke(); });
    tuft(g, x - 22, y + 2, 6, 31, 12); tuft(g, x + 4, y + 3, 5, 32, 10); tuft(g, x + 24, y + 2, 6, 33, 13);
  }

  function petalHead(g, x, y, n, len, wid, r0, f, fs, out, cf, cr, cout, sq) {
    sq = sq || 0.88;
    g.save(); g.translate(x, y); g.scale(1, sq);
    for (let i = 0; i < n; i++) {
      g.save(); g.rotate((i / n) * TAU + 0.2);
      cel(g, (gg) => { gg.beginPath(); gg.ellipse(r0 + len / 2, 0, len / 2, wid, 0, 0, TAU); }, f, fs, out, 1.2, 1.4);
      g.restore();
    }
    cel(g, P.el(0, 0, cr, cr), cf, null, cout, 0, 1.6);
    g.restore();
  }
  function flowers(g, x, y) {
    const items = ['Daisy', 'Tulip', 'Aster', 'Sunflower'];
    for (let i = 0; i < 4; i++) {
      const px = x + i * 60, gy = y;
      shadow(g, px + 4, gy, 22, 6, 1);
      const GL = '#4fb954', GD = '#2c8a3e', GO = '#16502a';
      const stems = i === 3 ? [[-14, 3, 28, -3], [0, -3, 44, 0], [14, 2, 24, 3]] : [[-12, 2, 20, -2], [0, -2, 26, 1], [12, 3, 17, 3]];
      stems.forEach((s) => { tube(g, [[px + s[0], gy + s[1]], [px + s[0] + s[3], gy + s[1] - s[2]]], 2.6, GL, GO); });
      leaf(g, px - 3, gy + 1, 20, -2.55, 5, GL, GD, GO); leaf(g, px + 4, gy + 1, 20, -0.6, 5, GL, GD, GO); leaf(g, px, gy + 2, 14, -1.57, 4, GL, GD, GO);
      stems.forEach((s) => {
        const hx = px + s[0] + s[3], hy = gy + s[1] - s[2];
        if (i === 0) { petalHead(g, hx, hy, 8, 6.5, 2.7, 2, '#ffffff', '#dcd6ee', '#5d4a73', '#ffd23a', 3.8, '#a8660f'); spark(g, hx - 3, hy - 4, 1.8); }
        else if (i === 1) {
          const c = s[0] === 0 ? ['#ff6b8a', '#cc3f64'] : ['#e8453c', '#b32d34'];
          cel(g, (gg) => { gg.beginPath(); gg.moveTo(hx - 6.5, hy - 1); gg.lineTo(hx - 7.5, hy - 11); gg.lineTo(hx - 3, hy - 7); gg.lineTo(hx, hy - 13.5); gg.lineTo(hx + 3, hy - 7); gg.lineTo(hx + 7.5, hy - 11); gg.lineTo(hx + 6.5, hy - 1); gg.quadraticCurveTo(hx, hy + 5, hx - 6.5, hy - 1); gg.closePath(); }, c[0], c[1], '#601828', 2.2, 1.8);
          g.strokeStyle = 'rgba(255,255,255,.85)'; g.lineWidth = 1.8; g.lineCap = 'round'; g.beginPath(); g.moveTo(hx - 3.6, hy - 1.5); g.lineTo(hx - 4.2, hy - 6); g.stroke();
        } else if (i === 2) { petalHead(g, hx, hy, 12, 5.6, 1.6, 1.5, '#b07af5', '#7f4fc4', '#432a73', '#ffd23a', 2.8, '#a8660f'); spark(g, hx - 2.5, hy - 3.5, 1.6); }
        else {
          const big = s[0] === 0; const sc = big ? 1 : 0.66;
          petalHead(g, hx, hy, 14, 8 * sc + 2, 2.8 * sc + 0.6, 4 * sc + 2, '#ffd62a', '#f0a41a', '#7a4a10', '#7a4721', 6.4 * sc + 1.6, '#3f200e');
          g.fillStyle = '#a8662f'; for (let k = 0; k < 5; k++) { g.beginPath(); g.arc(hx + Math.cos(k * 1.9) * 3 * sc, hy + Math.sin(k * 1.9) * 2.6 * sc, 0.9, 0, TAU); g.fill(); }
          if (big) spark(g, hx - 7, hy - 8, 2.4);
        }
      });
      label(g, px + (i === 3 ? -3 : 3), gy + 16, items[i]);
    }
  }

  function gnome(g, x, y) {
    const O = '#442636'; shadow(g, x + 4, y, 15, 5, 1);
    cel(g, P.rr(x - 9, y - 6, 8.5, 6, 3), '#4a2e22', null, O, 0, 1.8); cel(g, P.rr(x + 0.5, y - 6, 8.5, 6, 3), '#4a2e22', null, O, 0, 1.8);
    cel(g, P.rr(x - 10, y - 24, 20, 19, 7), '#3f86d8', '#2b5fb0', O, 2.5, 2);
    
    /* hands */
    g.fillStyle = '#ffcfa0'; g.lineWidth = 1.8; g.strokeStyle = O; [-1, 1].forEach((s) => { g.beginPath(); g.arc(x + s * 11, y - 14, 3.2, 0, TAU); g.fill(); g.stroke(); });
    /* beard */
    cel(g, (gg) => { gg.beginPath(); gg.moveTo(x - 11, y - 28); gg.quadraticCurveTo(x - 12, y - 18, x, y - 13); gg.quadraticCurveTo(x + 12, y - 18, x + 11, y - 28); gg.closePath(); }, '#fffaf0', '#d9d3e6', O, 2.5, 2);
    /* nose + hat */
    g.fillStyle = '#ff9a8a'; g.beginPath(); g.arc(x, y - 27, 3.6, 0, TAU); g.fill(); g.lineWidth = 1.8; g.stroke();
    cel(g, (gg) => { gg.beginPath(); gg.moveTo(x - 12, y - 29); gg.quadraticCurveTo(x - 10, y - 38, x - 2, y - 44); gg.quadraticCurveTo(x + 4, y - 48, x + 9, y - 51); gg.quadraticCurveTo(x + 9, y - 42, x + 12, y - 29); gg.quadraticCurveTo(x, y - 25, x - 12, y - 29); gg.closePath(); }, '#e8453c', '#b32d34', O, 3, 2.2);
    g.strokeStyle = 'rgba(255,255,255,.8)'; g.lineWidth = 2; g.lineCap = 'round'; g.beginPath(); g.moveTo(x - 7, y - 33); g.quadraticCurveTo(x - 5, y - 38, x - 1, y - 41); g.stroke();
    spark(g, x - 5, y - 20, 1.8, 0.0);
  }
  function ball(g, x, y) {
    shadow(g, x + 3, y, 10, 3.5, 1);
    cel(g, P.el(x, y - 8, 8, 8), '#ff8a2b', '#d9591c', '#5a2410', 2.4, 2);
    g.save(); P.el(x, y - 8, 8, 8)(g); g.clip(); g.strokeStyle = '#fff3d8'; g.lineWidth = 2; g.beginPath(); g.arc(x - 7, y - 8, 9, -0.9, 0.9); g.stroke(); g.beginPath(); g.moveTo(x - 8, y - 11); g.quadraticCurveTo(x, y - 6, x + 8, y - 11); g.stroke(); g.restore();
    P.el(x, y - 8, 8, 8)(g); g.lineWidth = 2; g.strokeStyle = '#5a2410'; g.stroke(); spark(g, x - 3, y - 12, 2.2);
  }
  function frisbee(g, x, y) {
    shadow(g, x + 3, y + 1, 15, 5, 1);
    cel(g, P.el(x, y - 1, 14, 6.4), '#1d6fb8', null, '#0f2f5a', 0, 2);
    cel(g, P.el(x, y - 4, 14, 6.4), '#34a8f0', '#1f86d0', '#0f2f5a', 2.2, 2);
    g.strokeStyle = '#d8f0ff'; g.lineWidth = 1.6; g.beginPath(); g.ellipse(x, y - 4, 8.6, 3.6, 0, 0, TAU); g.stroke();
    spark(g, x - 7, y - 8, 2.2);
  }
  function stick(g, x, y) {
    shadow(g, x + 14, y + 1, 18, 3.4, 1);
    tube(g, [[x - 2, y - 4], [x + 14, y - 8], [x + 30, y - 4]], 4, '#a8693a', '#4a2a18');
    tube(g, [[x + 13, y - 8], [x + 20, y - 17]], 2.6, '#a8693a', '#4a2a18');
    tube(g, [[x + 8, y - 7], [x + 4, y - 14]], 2, '#a8693a', '#4a2a18');
    g.strokeStyle = 'rgba(255,230,190,.8)'; g.lineWidth = 1.2; g.beginPath(); g.moveTo(x + 3, y - 6.5); g.lineTo(x + 10, y - 8.5); g.stroke();
  }

  /* ───────────────────────── STRUCTURES ───────────────────────── */
  function fence(g, x, y) {
    const O = '#6d5640'; const W = 192;
    g.save(); g.globalAlpha = 1; g.fillStyle = SH; window.MK.rr(g, x + 3, y - 3, W + 10, 11, 5); g.fill(); g.restore();
    for (let i = 0; i < 4; i++) {
      const x0 = x + i * 48;
      [-26, -12].forEach((ry) => cel(g, P.rr(x0 - 2, y + ry - 3, 52, 7, 2), '#d9aa6a', '#b0804a', O, 2, 1.8));
      for (let k = 0; k < 4; k++) {
        const px = x0 + 6 + k * 11.5;
        cel(g, P.poly([[px, y], [px, y - 33], [px + 4.5, y - 39], [px + 9, y - 33], [px + 9, y]]), '#fff6e0', '#e3cfa6', O, 2.6, 1.9);
      }
    }
    for (let i = 0; i <= 4; i++) {
      const x0 = x + i * 48 - 1;
      cel(g, P.rr(x0 - 4.5, y - 42, 9, 43, 2), '#fff0cc', '#dcc08c', O, 2.6, 2);
      cel(g, P.poly([[x0 - 6.5, y - 41], [x0, y - 50], [x0 + 6.5, y - 41]]), '#d98a42', '#a8602a', O, 2.4, 2);
    }
    g.strokeStyle = 'rgba(255,255,255,.9)'; g.lineWidth = 1.8; g.lineCap = 'round'; for (let k = 0; k < 4; k++) { g.beginPath(); g.moveTo(x + 7.5 + k * 11.5, y - 30); g.lineTo(x + 7.5 + k * 11.5, y - 22); g.stroke(); }
    for (let i = 0; i < 12; i++) tuft(g, x + 8 + i * 17, y + 1, 2, 40 + i, 9);
  }
  function hedge(g, x, y) {
    const cs = []; const R = window.MK.rng(51);
    for (let k = 0; k < 13; k++) cs.push({ x: x + 8 + k * 14.2, y: y - 33 + (R() - 0.5) * 3, r: 14 + R() * 2, hl: true });
    for (let k = 0; k < 14; k++) cs.push({ x: x + 7 + k * 14.2, y: y - 13, r: 14 + R(), hl: false, noLine: k % 2 === 0 });
    shadow(g, x + 98, y + 3, 100, 10, 1);
    blob(g, cs, { out: '#0f4030', dark: '#1f7440', base: '#37a84c', hi: '#86dc62', line: '#2a8a40' }, 8);
    /* cell dividers + leaf flecks */
    g.strokeStyle = 'rgba(15,64,48,.5)'; g.lineWidth = 2; g.lineCap = 'round';
    for (let i = 1; i < 4; i++) { g.beginPath(); g.moveTo(x + i * 48, y - 26); g.lineTo(x + i * 48, y - 8); g.stroke(); }
    g.fillStyle = '#8be06a'; const R2 = window.MK.rng(8); for (let i = 0; i < 18; i++) { g.beginPath(); g.ellipse(x + 8 + R2() * 176, y - 40 + R2() * 14, 2.6, 1.3, R2() * 3, 0, TAU); g.fill(); }
    g.fillStyle = '#ff7aa0'; g.strokeStyle = '#7a2845'; g.lineWidth = 1.2;
    [[30, -24], [86, -40], [150, -28], [118, -12]].forEach((p) => { g.beginPath(); g.arc(x + p[0], y + p[1], 3, 0, TAU); g.fill(); g.stroke(); });
    spark(g, x + 20, y - 44, 3); spark(g, x + 120, y - 46, 2.6);
    for (let i = 0; i < 10; i++) tuft(g, x + 8 + i * 20, y + 2, 2, 60 + i, 9);
  }
  function house(g, x, y) {
    const O = '#5a3326'; const W = 144;
    g.fillStyle = SH; window.MK.rr(g, x + 4, y - 3, W + 14, 12, 5); g.fill();
    /* wall */
    cel(g, P.rr(x, y - 56, W, 56, 2), '#f7e4b4', '#e0c48c', O, 3, 2.4);
    g.save(); window.MK.rr(g, x, y - 56, W, 56, 2); g.clip();
    g.strokeStyle = 'rgba(160,110,60,.35)'; g.lineWidth = 1.4; for (let r = y - 46; r < y; r += 9) { g.beginPath(); g.moveTo(x, r); g.lineTo(x + W, r); g.stroke(); }
    g.fillStyle = 'rgba(90,50,30,.28)'; g.fillRect(x, y - 56, W, 8);
    g.restore();
    /* roof slope */
    const rp = [[x - 8, y - 52], [x + W + 8, y - 52], [x + W - 8, y - 100], [x + 8, y - 100]];
    cel(g, P.poly(rp), '#d4583e', '#a83a32', O, 4, 2.6);
    g.save(); P.poly(rp)(g); g.clip();
    for (let r = 0; r < 6; r++) {
      const ry = y - 100 + r * 9.3; const off = r % 2 ? 8 : 0;
      for (let s = -1; s < 11; s++) {
        const sx = x - 4 + s * 16 + off; const dark = (s + r) % 3 === 0;
        cel(g, P.rr(sx, ry - 6, 15, 15.5, 6), dark ? '#c24a38' : '#e26a48', dark ? '#9a3430' : '#b83e36', '#7a2a2c', 2, 1.5);
      }
    }
    g.fillStyle = 'rgba(255,255,255,.28)'; g.fillRect(x, y - 100, W, 3);
    g.restore();
    P.poly(rp)(g); g.lineWidth = 2.6; g.strokeStyle = O; g.stroke();
    /* ridge cap + eave */
    cel(g, P.rr(x + 3, y - 108, W - 6, 10, 4), '#a83a32', '#7e2a2c', O, 2, 2.4);
    cel(g, P.rr(x - 10, y - 56, W + 20, 6, 3), '#8a2c2e', null, O, 0, 2.2);
    /* window */
    const wx = x + 14, wy = y - 44;
    cel(g, P.rr(wx - 7, wy, 8, 28, 2), '#2f9f8a', '#1f7a6a', O, 1.5, 2); cel(g, P.rr(wx + 36, wy, 8, 28, 2), '#2f9f8a', '#1f7a6a', O, 1.5, 2);
    cel(g, P.rr(wx, wy, 36, 28, 3), '#fffaf0', '#e8dcc2', O, 2.5, 2.2);
    cel(g, P.rr(wx + 4, wy + 4, 28, 20, 2), '#86d0f4', '#4c9bd6', O, 3, 1.8);
    g.strokeStyle = '#fffaf0'; g.lineWidth = 2.4; g.beginPath(); g.moveTo(wx + 18, wy + 4); g.lineTo(wx + 18, wy + 24); g.moveTo(wx + 4, wy + 14); g.lineTo(wx + 32, wy + 14); g.stroke();
    g.strokeStyle = 'rgba(255,255,255,.85)'; g.lineWidth = 2; g.lineCap = 'round'; g.beginPath(); g.moveTo(wx + 7, wy + 12); g.lineTo(wx + 13, wy + 6); g.stroke(); spark(g, wx + 26, wy + 9, 2.6);
    cel(g, P.rr(wx - 2, wy + 26, 40, 8, 2), '#b97a45', '#8a5428', O, 2, 2);
    [[4, '#ff6b8a'], [13, '#ffd23a'], [22, '#ff6b8a'], [31, '#fff']].forEach((f) => { g.fillStyle = f[1]; g.strokeStyle = '#5a2840'; g.lineWidth = 1.2; g.beginPath(); g.arc(wx + f[0], wy + 25, 3, 0, TAU); g.fill(); g.stroke(); });
    /* door */
    const dx = x + 100;
    cel(g, P.rr(dx - 2, y - 44, 30, 44, 3), '#fffaf0', '#e8dcc2', O, 2, 2.2);
    cel(g, (gg) => { gg.beginPath(); gg.moveTo(dx + 2, y); gg.lineTo(dx + 2, y - 36); gg.quadraticCurveTo(dx + 13, y - 44, dx + 24, y - 36); gg.lineTo(dx + 24, y); gg.closePath(); }, '#3a9fb8', '#26788f', O, 2.5, 2);
    g.fillStyle = '#ffd23a'; g.strokeStyle = O; g.lineWidth = 1.5; g.beginPath(); g.arc(dx + 20, y - 18, 2.2, 0, TAU); g.fill(); g.stroke();
    g.strokeStyle = 'rgba(255,255,255,.7)'; g.lineWidth = 2; g.beginPath(); g.moveTo(dx + 6, y - 30); g.lineTo(dx + 6, y - 22); g.stroke();
    /* path stones */
    [[dx + 13, y + 11, 11, 6], [dx + 6, y + 27, 12, 6.4], [dx + 18, y + 43, 11, 6]].forEach((s) => {
      g.fillStyle = SH; g.beginPath(); g.ellipse(s[0] + 2, s[1] + 3, s[2], s[3], 0, 0, TAU); g.fill();
      cel(g, P.el(s[0], s[1], s[2], s[3]), '#e2dccb', '#b3aa96', '#5f574a', 2.2, 2);
      g.strokeStyle = 'rgba(255,255,255,.85)'; g.lineWidth = 1.6; g.lineCap = 'round'; g.beginPath(); g.moveTo(s[0] - s[2] * 0.5, s[1] - 2); g.lineTo(s[0] - 1, s[1] - s[3] * 0.6); g.stroke();
    });
    tuft(g, x + 20, y + 2, 4, 71, 9); tuft(g, x + 70, y + 2, 4, 72, 9);
  }
  function pond(g, x, y) {
    const cy = y - 8;
    g.fillStyle = SH; wob(x + 4, cy + 8, 88, 46, 0.12, 5)(g); g.fill();
    cel(g, wob(x, cy, 88, 46, 0.14, 5), '#f4dfa4', '#dcbe7c', '#7d5c34', 4, 2.6);
    const R = window.MK.rng(3); g.fillStyle = '#c9a766'; g.strokeStyle = '#7d5c34'; g.lineWidth = 1.2;
    for (let i = 0; i < 9; i++) { const a = R() * TAU; g.beginPath(); g.ellipse(x + Math.cos(a) * 80, cy + Math.sin(a) * 40, 3, 2, a, 0, TAU); g.fill(); g.stroke(); }
    g.fillStyle = '#fff6d0'; for (let i = 0; i < 7; i++) { const a = R() * TAU; g.beginPath(); g.arc(x + Math.cos(a) * 77, cy - 2 + Math.sin(a) * 38, 1.4, 0, TAU); g.fill(); }
    const wp = wob(x, cy, 72, 35, 0.12, 8);
    g.save(); wp(g); g.fillStyle = '#2c86c8'; g.fill(); g.clip();
    g.translate(0, 6); wp(g); g.fillStyle = '#41b0ec'; g.fill(); g.translate(-3, 8); g.scale(0.75, 0.62); g.translate(x * 0.25 / 0.75 + 0, cy * 0.38 / 0.62); wp(g); g.restore();
    /* lighter water body */
    g.save(); wp(g); g.clip(); g.fillStyle = '#6fd2f6'; g.beginPath(); g.ellipse(x - 6, cy + 8, 50, 20, 0, 0, TAU); g.fill();
    g.strokeStyle = '#1c5f9a'; g.lineWidth = 2; g.beginPath(); g.ellipse(x - 6, cy + 8, 50, 20, 0, 0, TAU); g.globalAlpha = 0; g.stroke(); g.restore();
    wp(g); g.lineWidth = 2.6; g.strokeStyle = '#1c5a92'; g.stroke();
    /* ripples */
    g.lineCap = 'round'; g.strokeStyle = 'rgba(255,255,255,.95)'; g.lineWidth = 2.2;
    [[x - 14, cy + 2, 14, 5.2, 0.2, 1.9], [x - 14, cy + 2, 24, 9, 0.1, 1.4], [x + 30, cy + 14, 11, 4, 3.5, 1.5], [x + 30, cy + 14, 19, 7, 3.4, 1.2]].forEach((r) => { g.beginPath(); g.ellipse(r[0], r[1], r[2], r[3], 0, r[4] * Math.PI * 0.5, r[4] * Math.PI * 0.5 + r[5] * Math.PI); g.stroke(); });
    g.strokeStyle = 'rgba(255,255,255,.6)'; g.lineWidth = 1.6; g.beginPath(); g.ellipse(x - 14, cy + 2, 34, 13, 0, 3.4, 5.1); g.stroke();
    spark(g, x - 40, cy - 8, 3.4); spark(g, x + 42, cy - 2, 2.8); spark(g, x + 10, cy - 18, 2.4, 0.9);
    /* lily pad */
    cel(g, (gg) => { gg.beginPath(); gg.moveTo(x + 44, cy + 6); gg.arc(x + 44, cy + 6, 10, 0.3, TAU - 0.3); gg.closePath(); }, '#4fc45a', '#2f9a44', '#145a30', 2, 2);
    g.fillStyle = '#ff8fb0'; g.strokeStyle = '#7a2845'; g.lineWidth = 1.4; g.beginPath(); g.arc(x + 42, cy + 3, 3.2, 0, TAU); g.fill(); g.stroke();
  }
  function truck(g, x, y) {
    const O = '#5b3f0c';
    shadow(g, x + 6, y - 3, 52, 10, 1);
    cel(g, P.el(x - 27, y - 49, 10, 6), M.TIRES, null, M.GOUT, 0, 2); cel(g, P.el(x + 25, y - 49, 10, 6), M.TIRES, null, M.GOUT, 0, 2);
    /* body side + top */
    cel(g, P.rr(x - 45, y - 18, 90, 14, 5), '#f0b020', '#c98410', O, 3, 2.6);
    cel(g, P.rr(x - 45, y - 50, 90, 38, 9), '#ffd034', '#e9a516', O, 4, 2.8);
    /* bed */
    cel(g, P.rr(x - 43, y - 47, 44, 31, 5), '#a47a3a', '#7e5a28', O, 4, 2.2);
    g.strokeStyle = 'rgba(60,35,10,.4)'; g.lineWidth = 1.6; for (let i = 1; i < 4; i++) { g.beginPath(); g.moveTo(x - 41, y - 47 + i * 7.5); g.lineTo(x - 1, y - 47 + i * 7.5); g.stroke(); }
    cel(g, P.rr(x - 43, y - 47, 44, 31, 5), 'rgba(0,0,0,0)', null, O, 0, 2.2);
    /* cargo: gas can + bag */
    cel(g, P.rr(x - 36, y - 42, 12, 14, 3), '#e8423a', '#b32d34', '#4e1a26', 2, 1.8); g.fillStyle = '#ffd23a'; g.fillRect(x - 32, y - 45, 4, 3);
    cel(g, P.el(x - 14, y - 32, 11, 8), '#9fdc7a', '#6bb55a', '#2a6a35', 2, 1.8);
    /* cab */
    cel(g, P.rr(x + 2, y - 49, 24, 36, 7), '#ffe170', '#f0b822', O, 3, 2.4);
    cel(g, P.rr(x + 5, y - 44, 9, 26, 3), '#6bbfe8', '#3d8cc4', O, 2, 1.8);
    cel(g, P.rr(x + 18, y - 46, 8, 30, 3), '#8fd6f4', '#4c9bd6', O, 2, 1.8);
    g.strokeStyle = 'rgba(255,255,255,.85)'; g.lineWidth = 1.8; g.lineCap = 'round'; g.beginPath(); g.moveTo(x + 20, y - 42); g.lineTo(x + 20, y - 34); g.stroke();
    /* hood + lights */
    cel(g, P.rr(x + 27, y - 46, 17, 30, 5), '#ffd034', '#e9a516', O, 2.5, 2.2);
    g.strokeStyle = '#8a5a10'; g.lineWidth = 1.6; g.beginPath(); g.moveTo(x + 31, y - 40); g.lineTo(x + 38, y - 40); g.moveTo(x + 31, y - 34); g.lineTo(x + 38, y - 34); g.stroke();
    [-1, 1].forEach((s) => { g.fillStyle = '#fffbd0'; g.strokeStyle = O; g.lineWidth = 1.6; g.beginPath(); g.arc(x + 42, y - 31 + s * 10, 2.6, 0, TAU); g.fill(); g.stroke(); });
    cel(g, P.rr(x + 43, y - 44, 4, 26, 2), '#cfd5de', '#9aa3b0', O, 1, 1.8);
    /* near wheels peeking */
    [-28, 26].forEach((wx) => { cel(g, P.rr(x + wx - 9, y - 11, 18, 11, 4), M.TIRE, M.TIRES, M.GOUT, 2, 2); g.fillStyle = M.YEL; g.beginPath(); g.arc(x + wx, y - 5.5, 2.6, 0, TAU); g.fill(); });
    spark(g, x + 13, y - 38, 0, 0); spark(g, x - 4, y - 21, 2.8);
    g.strokeStyle = 'rgba(255,255,255,.7)'; g.lineWidth = 2.2; g.beginPath(); g.moveTo(x - 38, y - 46); g.lineTo(x - 22, y - 46); g.stroke();
  }

  /* ───────────────────────── SHEET ───────────────────────── */
  function draw(g, MK) {
    window.MK = MK; const S = MK.slots;
    /* kids */
    kidFront(g, S.kidIdle.x, S.kidIdle.y); label(g, S.kidIdle.x, S.kidIdle.y + 16, 'Kid · idle');

    const ks = S.kidScythe; const kx = ks.x - 8, ky = ks.y;
    kidSide(g, kx, ky, {
      lean: 7, stride: 7, hands: [[kx + 13, ky - 33], [kx + 25, ky - 22]],
      propFn: (gg) => {
        tube(gg, [[kx - 22, ky - 52], [kx + 40, ky - 3]], 4.6, '#d9a25e', '#5a3a1a');
        tube(gg, [[kx + 16, ky - 30], [kx + 10, ky - 21]], 3, '#d9a25e', '#5a3a1a');
        cel(gg, (g2) => { g2.beginPath(); g2.moveTo(kx + 36, ky - 7); g2.bezierCurveTo(kx + 52, ky + 1, kx + 74, ky - 3, kx + 88, ky - 19); g2.bezierCurveTo(kx + 72, ky - 11, kx + 54, ky - 12, kx + 38, ky - 15); g2.closePath(); }, '#e8eff5', '#9fb0bf', '#34485c', 2, 2);
        gg.strokeStyle = '#fff'; gg.lineWidth = 1.6; gg.lineCap = 'round'; gg.beginPath(); gg.moveTo(kx + 46, ky - 12); gg.quadraticCurveTo(kx + 66, ky - 12, kx + 80, ky - 19); gg.stroke();
      },
    });
    /* swoosh */
    (function () {
      const cx = kx - 6, cy = ky - 4, R = 86, a0 = -1.12, a1 = -0.06; const pts = [], pts2 = [];
      for (let i = 0; i <= 24; i++) { const t = i / 24, a = a0 + (a1 - a0) * t, w = 15 * Math.pow(Math.sin(Math.PI * t), 0.7); pts.push([cx + Math.cos(a) * (R + w / 2), cy + Math.sin(a) * (R + w / 2)]); pts2.push([cx + Math.cos(a) * (R - w / 2), cy + Math.sin(a) * (R - w / 2)]); }
      g.save(); g.beginPath(); pts.forEach((p, i) => (i ? g.lineTo(p[0], p[1]) : g.moveTo(p[0], p[1]))); pts2.reverse().forEach((p) => g.lineTo(p[0], p[1])); g.closePath();
      g.fillStyle = 'rgba(255,255,255,.62)'; g.fill(); g.lineWidth = 1.6; g.strokeStyle = 'rgba(255,255,255,.95)'; g.stroke();
      g.strokeStyle = 'rgba(255,255,255,.55)'; g.lineWidth = 2; g.lineCap = 'round';
      [[R - 14, -1.0, -0.4], [R + 14, -0.85, -0.25]].forEach((q) => { g.beginPath(); g.arc(cx, cy, q[0], q[1], q[2]); g.stroke(); });
      g.restore();
      /* flying clippings */
      [[kx + 92, ky - 34, 0.6], [kx + 100, ky - 24, -0.4], [kx + 84, ky - 42, 1.1]].forEach((c) => { g.save(); g.translate(c[0], c[1]); g.rotate(c[2]); window.MK.blade(g, 0, 0, 9, 3, 1.8, '#226329', '#3f9a45', '#8bdc6a'); g.restore(); });
      spark(g, kx + 60, ky - 78, 3);
    })();
    label(g, ks.x, ks.y + 16, 'Kid · scythe swing');

    /* push mower */
    const kp = S.kidPush; gasMower(g, kp.x, kp.y - 78, 26);
    kidFront(g, kp.x, kp.y, { back: true, hands: true }); label(g, kp.x, kp.y + 16, 'Kid + gas mower');

    reelMower(g, S.reel.x, S.reel.y); label(g, S.reel.x, S.reel.y + 15, 'Reel mower');
    rideMower(g, S.ride.x, S.ride.y); label(g, S.ride.x, S.ride.y + 15, 'Ride-on mower');

    treeSmall(g, S.treeSmall.x, S.treeSmall.y); label(g, S.treeSmall.x, S.treeSmall.y + 17, 'Small tree');
    treeBig(g, S.treeBig.x, S.treeBig.y); label(g, S.treeBig.x, S.treeBig.y + 18, 'Big oak');
    rock(g, S.rock.x, S.rock.y); label(g, S.rock.x, S.rock.y + 17, 'Rock');
    flowers(g, S.flowers.x, S.flowers.y);

    const gx = S.gnome.x, gy = S.gnome.y;
    gnome(g, gx, gy); label(g, gx + 8, gy + 16, 'Gnome');
    ball(g, gx + 55, gy); label(g, gx + 55, gy + 16, 'Ball');
    frisbee(g, gx + 110, gy); label(g, gx + 110, gy + 16, 'Frisbee');
    stick(g, gx + 150, gy); label(g, gx + 165, gy + 16, 'Stick');

    fence(g, S.fence.x, S.fence.y); label(g, S.fence.x + 96, S.fence.y + 20, 'Picket fence (4 panels)');
    hedge(g, S.hedge.x, S.hedge.y); label(g, S.hedge.x + 96, S.hedge.y + 20, 'Hedge (4 cells)');
    house(g, S.house.x, S.house.y); label(g, S.house.x + 32, S.house.y + 18, 'House + path stones');
    pond(g, S.pond.x, S.pond.y); label(g, S.pond.x, S.pond.y + 56, 'Pond');
    truck(g, S.truck.x - 32, S.truck.y); label(g, S.truck.x - 32, S.truck.y + 15, 'Pickup truck');
  }

  window.STYLES.push({
    id: 'C', name: 'Bold Handcrafted Vector',
    blurb: 'Confident indie-cartoon vector: ~2px tinted outlines, flat base + one shade + one highlight, big-head kid with chunky boots, scalloped layered canopies, colour-blocked red/yellow mowers, faceted rocks and tiny sparkle marks. The most readable at small size.',
    draw,
  });
})();
