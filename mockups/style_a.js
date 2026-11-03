/* A · Soft Storybook — chubby, rounded, outline-free shapes built from soft gradients. */
window.STYLES.push({
  id: 'A',
  name: 'Soft Storybook',
  blurb: 'Chubby, rounded, outline-free shapes shaded with soft gradients and gentle highlights, like a children\'s picture book or Animal Crossing. Big-headed kid, puffy cloud trees, toy-like mowers, warm saturated-but-gentle colours.',
  draw(g, MK) {
    const T = MK.TAU;
    const FONT = '600 12px ui-rounded,"Trebuchet MS",system-ui,sans-serif';

    /* ---------- helpers ---------- */
    const hex = (c) => [parseInt(c.slice(1, 3), 16), parseInt(c.slice(3, 5), 16), parseInt(c.slice(5, 7), 16)];
    const mix = (a, b, t) => { const A = hex(a), B = hex(b); return 'rgb(' + A.map((v, i) => Math.round(v + (B[i] - v) * t)).join(',') + ')'; };
    const label = (t, x, y) => {
      g.save(); g.font = FONT; g.textAlign = 'center'; g.lineJoin = 'round'; g.lineWidth = 3.5;
      g.strokeStyle = 'rgba(18,50,28,.6)'; g.strokeText(t, x, y); g.fillStyle = '#fff'; g.fillText(t, x, y); g.restore();
    };
    const shadow = (x, y, rx, ry, a) => {
      g.save(); g.translate(x, y); g.scale(1, ry / rx);
      const gr = g.createRadialGradient(0, 0, 0, 0, 0, rx);
      gr.addColorStop(0, 'rgba(14,52,30,' + (a || 0.32) + ')'); gr.addColorStop(0.6, 'rgba(14,52,30,' + (a || 0.32) * 0.65 + ')'); gr.addColorStop(1, 'rgba(14,52,30,0)');
      g.fillStyle = gr; g.beginPath(); g.arc(0, 0, rx, 0, T); g.fill(); g.restore();
    };
    const orb = (cx, cy, rx, ry, hi, mid, lo, hx, hy) => {
      g.save(); g.translate(cx, cy); g.scale(1, ry / rx);
      const gr = g.createRadialGradient(rx * (hx === undefined ? -0.3 : hx), rx * (hy === undefined ? -0.4 : hy), rx * 0.05, 0, 0, rx * 1.08);
      gr.addColorStop(0, hi); gr.addColorStop(0.55, mid); gr.addColorStop(1, lo);
      g.fillStyle = gr; g.beginPath(); g.arc(0, 0, rx, 0, T); g.fill(); g.restore();
    };
    const shine = (x, y, rx, ry, a, rot) => {
      g.save(); g.translate(x, y); g.rotate(rot || 0); g.fillStyle = 'rgba(255,255,255,' + (a === undefined ? 0.45 : a) + ')';
      g.beginPath(); g.ellipse(0, 0, rx, ry, 0, 0, T); g.fill(); g.restore();
    };
    const capsule = (x0, y0, x1, y1, w, lo, mid, hi) => {
      g.lineCap = 'round'; g.strokeStyle = lo; g.lineWidth = w; g.beginPath(); g.moveTo(x0, y0); g.lineTo(x1, y1); g.stroke();
      g.strokeStyle = mid; g.lineWidth = w * 0.78; g.beginPath(); g.moveTo(x0 - w * 0.05, y0 - w * 0.07); g.lineTo(x1 - w * 0.05, y1 - w * 0.07); g.stroke();
      if (hi) { g.strokeStyle = hi; g.lineWidth = w * 0.26; g.beginPath(); g.moveTo(x0 - w * 0.2, y0 - w * 0.22); g.lineTo(x1 - w * 0.2, y1 - w * 0.22); g.stroke(); }
    };
    const rrf = (x, y, w, h, r, fill) => { MK.rr(g, x, y, w, h, r); g.fillStyle = fill; g.fill(); };
    const vg = (y0, y1, a, b, c) => MK.lin(g, 0, y0, 0, y1, c ? [[0, a], [0.5, b], [1, c]] : [[0, a], [1, b]]);
    const hg = (x0, x1, a, b, c) => MK.lin(g, x0, 0, x1, 0, c ? [[0, a], [0.5, b], [1, c]] : [[0, a], [1, b]]);
    const blobPath = (cx, cy, rx, ry, seed, wob, n) => {
      n = n || 9; const r = MK.rng(seed); const pts = [];
      for (let i = 0; i < n; i++) { const a = i / n * T, k = 1 + (r() - 0.5) * wob; pts.push([cx + Math.cos(a) * rx * k, cy + Math.sin(a) * ry * k]); }
      const m = (a, b) => [(a[0] + b[0]) / 2, (a[1] + b[1]) / 2];
      g.beginPath(); const s = m(pts[n - 1], pts[0]); g.moveTo(s[0], s[1]);
      for (let i = 0; i < n; i++) { const p = pts[i], e = m(p, pts[(i + 1) % n]); g.quadraticCurveTo(p[0], p[1], e[0], e[1]); }
      g.closePath();
    };
    const tuft = (x, y, seed, n, hh) => {
      const r = MK.rng(seed);
      for (let i = 0; i < n; i++) { const o = (i - (n - 1) / 2) * 3.2; MK.blade(g, x + o, y + r() * 2, (hh || 12) * (0.7 + r() * 0.5), (r() - 0.5) * 8, 1.7, '#2f8c3c', '#58b94d', '#9be36f'); }
    };

    /* ---------- the kid ---------- */
    const SK = ['#ffe6cf', '#fbc39b', '#e8966c'], SH = ['#ff9078', '#ee5a45', '#c43d33'], DN = ['#86ace6', '#5280c4', '#3a5fa0'];
    const CAP = ['#fffbf2', '#f6e9cf', '#dcc6a0'], BR = ['#ff8068', '#e9503f', '#bd3a2f'], SHOE = ['#cf9360', '#a8693c', '#6f3f22'];
    const eye = (x, y) => { orb(x, y, 1.9, 2.6, '#6a4638', '#34211b', '#1d110e', 0, -0.3); shine(x - 0.5, y - 1, 0.8, 0.9, 0.95); };
    const cheek = (x, y, rx, ry) => { g.save(); g.translate(x, y); g.scale(1, ry / rx); const gr = g.createRadialGradient(0, 0, 0, 0, 0, rx); gr.addColorStop(0, 'rgba(255,92,108,.55)'); gr.addColorStop(1, 'rgba(255,92,108,0)'); g.fillStyle = gr; g.beginPath(); g.arc(0, 0, rx, 0, T); g.fill(); g.restore(); };

    function kidFront(x, y) {
      g.save(); g.translate(x, y); shadow(3, 0, 22, 7.5, 0.34);
      orb(-7, -3.2, 6.8, 3.9, SHOE[0], SHOE[1], SHOE[2]); orb(7, -3.2, 6.8, 3.9, SHOE[0], SHOE[1], SHOE[2]);
      rrf(-12, -48, 24, 24, 9, vg(-48, -24, SH[0], SH[1], SH[2]));
      // arms
      capsule(-12, -42, -17, -31, 8, SH[2], SH[1], SH[0]); orb(-17.5, -28, 4.2, 4, SK[0], SK[1], SK[2]);
      for (const s of [-1, 1]) { MK.rr(g, s * 6.6 - 5.4, -28, 10.8, 25, 5); g.fillStyle = hg(s * 6.6 - 5.4, s * 6.6 + 5.4, DN[0], DN[1], DN[2]); g.fill(); }
      rrf(-11.8, -32, 23.6, 16, 6, vg(-32, -16, DN[1], DN[1], DN[2]));
      shine(-6, -22, 1.6, 6, 0.18);
      rrf(-6.6, -42, 13.2, 20, 5, vg(-42, -22, DN[0], DN[1], DN[2]));
      capsule(-5, -40, -8, -48, 3.6, DN[2], DN[1], DN[0]); capsule(5, -40, 8, -48, 3.6, DN[2], DN[1], DN[0]);
      orb(-4.5, -37, 1.7, 1.7, '#fff2a6', '#f4c84a', '#c8962a'); orb(4.5, -37, 1.7, 1.7, '#fff2a6', '#f4c84a', '#c8962a');
      rrf(-3.6, -32, 7.2, 5, 2, 'rgba(255,255,255,.2)');
      // waving arm
      capsule(12, -42, 20, -51, 8, SH[2], SH[1], SH[0]); orb(21.5, -55, 4.3, 4.2, SK[0], SK[1], SK[2]);
      // head
      orb(-15, -57, 3.3, 3.6, SK[0], SK[1], SK[2]); orb(15, -57, 3.3, 3.6, SK[0], SK[1], SK[2]);
      orb(-12, -53, 4, 5, '#b98558', '#8a5a36', '#684026'); orb(12, -53, 4, 5, '#b98558', '#8a5a36', '#684026');
      orb(0, -57.5, 15.6, 14, SK[0], SK[1], SK[2], -0.28, -0.35);
      cheek(-9.3, -51, 4.6, 3); cheek(9.3, -51, 4.6, 3);
      eye(-5.3, -55.6); eye(5.3, -55.6);
      orb(0, -52.2, 2, 1.6, '#ffd6b8', '#f4a47c', '#df8760', 0, -0.4);
      g.strokeStyle = '#b4503f'; g.lineWidth = 1.3; g.lineCap = 'round'; g.beginPath(); g.arc(0, -49.8, 3.2, 0.2 * Math.PI, 0.8 * Math.PI); g.stroke();
      // cap
      g.beginPath(); g.ellipse(0, -62.5, 16, 14.2, 0, Math.PI, 0); g.closePath();
      g.fillStyle = MK.lin(g, -12, -76, 12, -58, [[0, CAP[0]], [0.55, CAP[1]], [1, CAP[2]]]); g.fill();
      g.strokeStyle = 'rgba(150,110,60,.13)'; g.lineWidth = 1; g.beginPath(); g.moveTo(0, -76); g.quadraticCurveTo(-6, -69, -7, -62); g.moveTo(0, -76); g.quadraticCurveTo(6, -69, 7, -62); g.stroke();
      g.beginPath(); g.ellipse(0, -62.5, 16.8, 4.6, 0, 0, Math.PI); g.closePath(); g.fillStyle = vg(-62.5, -58, BR[0], BR[1], BR[2]); g.fill();
      shine(-6, -61.4, 5, 1, 0.4);
      orb(0, -76.4, 2.6, 2.2, BR[0], BR[1], BR[2]);
      shine(-6, -71, 4, 2.2, 0.5, -0.6);
      g.restore();
    }

    function sideHead(hx, hy) {
      orb(hx - 12, hy + 1, 5.2, 6, '#b98558', '#8a5a36', '#684026');
      orb(hx, hy, 14, 13.6, SK[0], SK[1], SK[2], -0.1, -0.4);
      orb(hx - 3, hy - 1.5, 3, 3.5, SK[1], SK[2], '#d98660', 0, 0);
      cheek(hx + 7.5, hy + 6.5, 4.4, 3); eye(hx + 8, hy - 1.2);
      orb(hx + 14, hy + 1, 2.4, 2.2, '#ffd9bc', '#f4a47c', '#df8760', -0.2, -0.4);
      g.strokeStyle = '#b4503f'; g.lineWidth = 1.2; g.lineCap = 'round'; g.beginPath(); g.arc(hx + 9.5, hy + 5.2, 2.6, 0.15 * Math.PI, 0.78 * Math.PI); g.stroke();
      g.beginPath(); g.ellipse(hx - 0.5, hy - 4.6, 14.6, 12.6, 0, Math.PI * 0.98, Math.PI * 2.02); g.closePath();
      g.fillStyle = MK.lin(g, hx - 12, hy - 15, hx + 12, hy, [[0, CAP[0]], [0.55, CAP[1]], [1, CAP[2]]]); g.fill();
      g.save(); g.translate(hx + 12, hy - 6.4); g.rotate(0.06);
      g.beginPath(); g.moveTo(-12, -2.2); g.quadraticCurveTo(2, -4.8, 10, -0.4); g.quadraticCurveTo(12, 1.6, 7, 3); g.quadraticCurveTo(-3, 4, -12, 2.4); g.closePath();
      g.fillStyle = vg(-4, 4, BR[0], BR[1], BR[2]); g.fill(); shine(-1, -1.5, 6, 0.9, 0.45); g.restore();
      orb(hx - 1, hy - 17.4, 2.5, 2.2, BR[0], BR[1], BR[2]); shine(hx - 5, hy - 10.5, 4, 2.2, 0.5, -0.4);
    }
    function sideBody(bx) {
      // legs + shoes (east), torso
      orb(bx - 7, -3.2, 7.2, 3.9, SHOE[0], SHOE[1], SHOE[2]); orb(bx + 8, -3.2, 7.4, 3.9, SHOE[0], SHOE[1], SHOE[2]);
      MK.rr(g, bx - 11, -27, 9.5, 24, 4.8); g.fillStyle = hg(bx - 11, bx - 1.5, DN[1], DN[1], DN[2]); g.fill();
      MK.rr(g, bx + 1.5, -27, 10, 24, 5); g.fillStyle = hg(bx + 1.5, bx + 11.5, DN[0], DN[1], DN[2]); g.fill();
      rrf(bx - 10.5, -47, 21, 24, 9, vg(-47, -23, SH[0], SH[1], SH[2]));
      rrf(bx - 10.5, -33, 21, 17, 6.5, vg(-33, -16, DN[1], DN[1], DN[2]));
      rrf(bx + 0.5, -42, 10, 22, 5, vg(-42, -20, DN[0], DN[1], DN[2]));
      capsule(bx + 2.5, -40, bx - 0.5, -47, 3.6, DN[2], DN[1], DN[0]);
      orb(bx + 5, -37, 1.7, 1.7, '#fff2a6', '#f4c84a', '#c8962a');
    }

    function kidScythe(x, y) {
      g.save(); g.translate(x, y); shadow(6, 0, 26, 8, 0.34);
      // swoosh (behind pole)
      const cx = 4, cy = -28, R = 47, a0 = -2.45, a1 = 0.52, N = 34, pts = [];
      for (let i = 0; i <= N; i++) { const t = i / N, a = a0 + (a1 - a0) * t, w = 1 + 11 * Math.pow(Math.sin(Math.PI * Math.min(1, t * 1.05)), 0.8) * (0.35 + 0.65 * t); pts.push([a, w]); }
      g.beginPath();
      pts.forEach((p, i) => { const px = cx + Math.cos(p[0]) * (R + p[1] / 2), py = cy + Math.sin(p[0]) * (R + p[1] / 2) * 0.95; i ? g.lineTo(px, py) : g.moveTo(px, py); });
      for (let i = N; i >= 0; i--) { const p = pts[i]; g.lineTo(cx + Math.cos(p[0]) * (R - p[1] / 2), cy + Math.sin(p[0]) * (R - p[1] / 2) * 0.95); }
      g.closePath();
      g.fillStyle = MK.lin(g, -30, -58, 48, -4, [[0, 'rgba(255,255,255,0)'], [0.45, 'rgba(255,255,255,.55)'], [1, 'rgba(255,255,255,.9)']]); g.fill();
      sideBody(0);
      // far arm
      capsule(-2, -42, -3, -40, 7, SH[2], SH[1], SH[0]);
      sideHead(1, -58);
      // pole
      capsule(-18, -54, 38, -9, 4.4, '#8a5a38', '#c48a54', '#f0c48c');
      orb(-18, -54, 3, 3, '#e8b982', '#c48a54', '#8a5a38');
      // blade
      g.beginPath(); g.moveTo(34, -13); g.quadraticCurveTo(52, -21, 70, -8); g.quadraticCurveTo(54, -11, 38, -3); g.closePath();
      g.fillStyle = MK.lin(g, 36, -20, 62, -4, [[0, '#ffffff'], [0.5, '#d9e6f2'], [1, '#97aec4']]); g.fill();
      shine(54, -14.2, 10, 1, 0.8, -0.2);
      orb(36, -9, 3.4, 3.4, '#f3dcb8', '#c9a46c', '#8c6a3c');
      // hands/arms in front
      capsule(3, -41, 7, -33, 7.4, SH[2], SH[1], SH[0]); orb(8, -31.5, 4.2, 4.1, SK[0], SK[1], SK[2]);
      orb(-3.4, -39.5, 4, 3.9, SK[0], SK[1], SK[2]);
      // clippings
      const r = MK.rng(7);
      for (let i = 0; i < 7; i++) MK.blade(g, 52 + r() * 22, -22 - r() * 14, 5 + r() * 3, (r() - 0.5) * 8, 1.1, '#3c9a44', '#68c457', '#a5e57d');
      shine(60, -34, 1.6, 1.6, 0.9); shine(30, -62, 1.3, 1.3, 0.9); shine(72, -20, 1.2, 1.2, 0.9);
      g.restore();
    }

    /* gas mower facing north; (cx,cy) = centre of footprint */
    function gasMower(cx, cy) {
      g.save(); g.translate(cx, cy); shadow(4, 4, 36, 38, 0.32);
      const wheel = (x, y, w, h) => {
        MK.rr(g, x - w / 2, y - h / 2, w, h, w * 0.45); g.fillStyle = hg(x - w / 2, x + w / 2, '#6a727d', '#3e444e', '#2a2e36'); g.fill();
        shine(x - w * 0.18, y - h * 0.1, w * 0.13, h * 0.34, 0.25); orb(x + (x < 0 ? -w * 0.34 : w * 0.34), y, 2.6, 3, '#fff6dc', '#e9d6a8', '#b8a070');
      };
      wheel(-25, -19, 9, 17); wheel(25, -19, 9, 17); wheel(-25, 18, 10, 21); wheel(25, 18, 10, 21);
      rrf(-22, -23, 44, 55, 15, '#a72f29');
      rrf(-22, -30, 44, 56, 15, MK.lin(g, -20, -30, 22, 24, [[0, '#ff7e66'], [0.5, '#ee5543'], [1, '#c63c32']]));
      shine(-12, -24, 2.5, 9, 0.35, 0.1);
      rrf(-16, 17, 32, 8, 4, 'rgba(0,0,0,.18)');
      // engine
      rrf(-13, -17, 26, 31, 11, '#bdb09a');
      rrf(-13, -20, 26, 31, 11, MK.lin(g, -12, -20, 12, 10, [[0, '#fffdf4'], [0.6, '#f1e5c9'], [1, '#d4c19b']]));
      orb(-2, -3, 6.5, 6.5, '#e2d4b4', '#cdbd98', '#b4a27a', 0, 0); orb(-2, -3.5, 3.6, 3.6, '#4c525c', '#343944', '#22252c', 0, 0); g.fillStyle = '#f2b73a'; g.beginPath(); g.arc(-2, -3.5, 1.2, 0, T); g.fill();
      orb(7, -13, 3.2, 3, '#ffe27a', '#f4b93a', '#c68a1e'); shine(-7, -16, 5, 1.3, 0.6, 0.15);
      // bag / flap
      rrf(-10, 25, 20, 13, 6, '#9fc882'); rrf(-10, 23, 20, 12, 6, MK.lin(g, 0, 23, 0, 35, [[0, '#e6f5c8'], [1, '#b8da96']]));
      g.restore();
    }
    function kidPush(x, y) {
      const mx = x, my = y - 90;
      gasMower(mx, my);
      // handle rods (before kid)
      capsule(x - 9, y - 66, x - 19, y - 39, 4, '#4a4f58', '#767d89', '#c5cbd3'); capsule(x + 9, y - 66, x + 19, y - 39, 4, '#4a4f58', '#767d89', '#c5cbd3');
      capsule(x - 19, y - 39, x + 19, y - 39, 4.2, '#4a4f58', '#767d89', '#c5cbd3');
      g.save(); g.translate(x, y); shadow(3, 0, 22, 7.5, 0.34);
      orb(-7, -3.2, 6.8, 3.9, SHOE[0], SHOE[1], SHOE[2]); orb(7, -3.2, 6.8, 3.9, SHOE[0], SHOE[1], SHOE[2]);
      for (const s of [-1, 1]) { MK.rr(g, s * 6.6 - 5.4, -28, 10.8, 25, 5); g.fillStyle = hg(s * 6.6 - 5.4, s * 6.6 + 5.4, DN[0], DN[1], DN[2]); g.fill(); }
      rrf(-12, -48, 24, 24, 9, vg(-48, -24, SH[0], SH[1], SH[2]));
      rrf(-11.8, -32, 23.6, 16, 6, vg(-32, -16, DN[1], DN[1], DN[2]));
      // back pocket + straps
      rrf(-4.5, -26, 9, 7, 3, DN[0]); rrf(-3.6, -25, 7.2, 1.2, 0.6, 'rgba(255,255,255,.35)');
      capsule(-6, -47, -4, -33, 3.6, DN[2], DN[1], DN[0]); capsule(6, -47, 4, -33, 3.6, DN[2], DN[1], DN[0]);
      orb(-4, -33.5, 1.6, 1.6, '#fff2a6', '#f4c84a', '#c8962a'); orb(4, -33.5, 1.6, 1.6, '#fff2a6', '#f4c84a', '#c8962a');
      // head from behind
      orb(-15, -56, 3.3, 3.6, SK[0], SK[1], SK[2]); orb(15, -56, 3.3, 3.6, SK[0], SK[1], SK[2]);
      orb(0, -57, 15.4, 14, SK[0], SK[1], SK[2], -0.2, -0.4);
      orb(0, -52.5, 13, 5.6, '#b98558', '#8a5a36', '#684026', -0.2, -0.5);
      g.beginPath(); g.ellipse(0, -61, 16, 14.5, 0, Math.PI, 0); g.lineTo(15.6, -58); g.quadraticCurveTo(0, -54.5, -15.6, -58); g.closePath();
      g.fillStyle = MK.lin(g, -12, -74, 12, -54, [[0, CAP[0]], [0.55, CAP[1]], [1, CAP[2]]]); g.fill();
      g.strokeStyle = 'rgba(150,110,60,.14)'; g.lineWidth = 1; g.beginPath(); g.moveTo(0, -75); g.lineTo(0, -57); g.moveTo(0, -75); g.quadraticCurveTo(-10, -68, -11, -58); g.moveTo(0, -75); g.quadraticCurveTo(10, -68, 11, -58); g.stroke();
      rrf(-4.5, -59, 9, 3, 1.5, BR[1]);
      orb(0, -75.5, 2.6, 2.2, BR[0], BR[1], BR[2]); shine(-6, -69, 4, 2.2, 0.5, -0.6);
      // arms to grips
      capsule(-11, -42, -18, -39.5, 8, SH[2], SH[1], SH[0]); capsule(11, -42, 18, -39.5, 8, SH[2], SH[1], SH[0]);
      orb(-20, -38.6, 4.2, 4.1, SK[0], SK[1], SK[2]); orb(20, -38.6, 4.2, 4.1, SK[0], SK[1], SK[2]);
      g.restore();
    }

    /* reel mower facing east */
    function reelMower(x, y) {
      g.save(); g.translate(x, y); shadow(0, 2, 40, 9, 0.32);
      // far side
      capsule(-12, -22, -44, -54, 4.2, '#8a5a38', '#b9824f', '#e8b982');
      orb(-4, -18, 10, 10.5, '#69727f', '#4b5461', '#323943');
      // frame
      capsule(-4, -13, 24, -12, 6, '#2f78b0', '#4aa7d9', '#a6e0f6');
      capsule(-9, -15, -40, -46, 4.4, '#8a5a38', '#c48a54', '#f0c48c');
      orb(-44, -50, 4.6, 3.6, '#f1cb9a', '#cc9460', '#94673d');
      // reel
      orb(24, -8, 10.6, 11, '#2a6ea3', '#245f90', '#1d4c75', 0, 0);
      orb(24, -11, 10.6, 11, '#d4f1fb', '#7fcbee', '#3f8fc4');
      g.save(); g.translate(24, -11); g.lineCap = 'round';
      for (let i = 0; i < 6; i++) { const a = i / 6 * T + 0.3; g.strokeStyle = 'rgba(255,255,255,.65)'; g.lineWidth = 2; g.beginPath(); g.moveTo(Math.cos(a) * 2.5, Math.sin(a) * 2.5); g.quadraticCurveTo(Math.cos(a + 0.5) * 6.4, Math.sin(a + 0.5) * 6.4, Math.cos(a + 1) * 9, Math.sin(a + 1) * 9); g.stroke(); }
      g.restore();
      orb(24, -11, 3.2, 3.2, '#fff6dc', '#e9d6a8', '#b8a070');
      rrf(12, -3.5, 24, 4.4, 2.2, vg(-3.5, 1, '#f1f4f8', '#aab4c0'));
      // near wheel
      orb(-4, -9.5, 11.6, 12, '#3a4150', '#2c323d', '#1f242c', 0, 0);
      orb(-4, -12, 11.6, 12, '#6a7482', '#454d5a', '#2a303a');
      orb(-4, -12, 7.6, 7.8, '#fffaf0', '#f2e4c2', '#cdb98c');
      orb(-4, -12, 2.6, 2.6, '#8f9aa8', '#5b6573', '#3a414c');
      shine(-9, -18.5, 3.4, 1.4, 0.4, -0.7);
      const r = MK.rng(3); for (let i = 0; i < 5; i++) MK.blade(g, 40 + r() * 16, -r() * 6, 5 + r() * 3, (r() - 0.2) * 8, 1, '#3c9a44', '#68c457', '#a5e57d');
      g.restore();
    }

    /* riding mower facing east */
    function rideMower(x, y) {
      g.save(); g.translate(x, y); shadow(2, 3, 56, 12, 0.34);
      // far rear wheel
      orb(-31, -20, 13.5, 14, '#4a4f58', '#30343c', '#202329');
      // deck
      rrf(-4, -12, 46, 11, 5.5, MK.lin(g, 0, -12, 0, -1, [[0, '#ffb454'], [1, '#d97a1f']]));
      orb(40, -8, 6.5, 6.5, '#8f98a4', '#59626e', '#343a43'); orb(40, -10, 5, 5, '#d8dee5', '#aab3bd', '#6c7682');
      // body / hood
      g.beginPath(); g.moveTo(-26, -9); g.lineTo(-26, -29); g.quadraticCurveTo(-12, -34, 2, -33); g.quadraticCurveTo(26, -34, 44, -30); g.quadraticCurveTo(52, -26, 51, -17); g.quadraticCurveTo(51, -9, 44, -9); g.closePath();
      g.fillStyle = MK.lin(g, 0, -36, 0, -8, [[0, '#ffbf6a'], [0.45, '#ff9a3c'], [1, '#d96d1c']]); g.fill();
      shine(18, -29.5, 16, 2.2, 0.5, 0.02);
      rrf(46, -27, 6, 17, 3, MK.lin(g, 0, -27, 0, -10, [[0, '#fffaf0'], [1, '#e1d2ae']]));
      orb(50.5, -23, 2.4, 2.4, '#fffbd0', '#ffe27a', '#e8b23a');
      // seat + kid
      rrf(-28, -22, 20, 6, 3, '#6e4a33'); rrf(-30, -36, 7, 18, 3.5, MK.lin(g, 0, -36, 0, -18, [[0, '#a9714c'], [1, '#6e4a33']]));
      // torso
      rrf(-23, -50, 19, 26, 9, vg(-50, -24, SH[0], SH[1], SH[2]));
      rrf(-21, -37, 17, 13, 6, vg(-37, -24, DN[1], DN[1], DN[2]));
      rrf(-11, -47, 8, 16, 4, vg(-47, -31, DN[0], DN[1], DN[2])); orb(-8.5, -42, 1.5, 1.5, '#fff2a6', '#f4c84a', '#c8962a');
      // steering
      capsule(10, -33, 4, -52, 3.6, '#40454e', '#686f7b', '#b6bdc7');
      g.save(); g.translate(4, -54); g.rotate(-0.3); g.scale(1, 0.55); g.lineWidth = 3.4; g.strokeStyle = '#3a3f48'; g.beginPath(); g.arc(0, 0, 8, 0, T); g.stroke(); g.lineWidth = 1.4; g.strokeStyle = '#8a929e'; g.beginPath(); g.arc(0, -0.6, 8, Math.PI, T * 0.95); g.stroke(); g.restore();
      // head
      sideHead(-16, -66);
      // arm
      capsule(-12, -45, 1, -52, 7.6, SH[2], SH[1], SH[0]); orb(3.5, -53.5, 4.1, 4, SK[0], SK[1], SK[2]);
      // thigh + shin (near side, in front of hood)
      capsule(-16, -27, 12, -24, 10, DN[2], DN[1], DN[0]); capsule(13, -24, 17, -11, 9, DN[2], DN[1], DN[0]);
      orb(21, -7, 8.4, 4.5, SHOE[0], SHOE[1], SHOE[2]);
      // rear wheel (near)
      orb(-31, -11.5, 14.6, 15, '#33373f', '#262a30', '#17191d', 0, 0);
      orb(-31, -15, 14.6, 15, '#6a727e', '#444b57', '#2a2f38');
      orb(-31, -15, 8.6, 8.8, '#ffe0a8', '#ffb454', '#d97a1f');
      orb(-31, -15, 3, 3, '#fffaf0', '#e1d2ae', '#b0a07a'); shine(-37, -23, 4, 1.6, 0.4, -0.7);
      // front wheel (near)
      orb(39, -6, 9, 9.4, '#33373f', '#262a30', '#17191d', 0, 0);
      orb(39, -8.5, 9, 9.4, '#6a727e', '#444b57', '#2a2f38'); orb(39, -8.5, 4.7, 4.8, '#ffe0a8', '#ffb454', '#d97a1f');
      g.restore();
    }

    /* ---------- trees ---------- */
    function canopy(cx, cy, rw, rh, seed, n, top, bot) {
      const r = MK.rng(seed), P = [];
      for (let i = 0; i < n; i++) { const a = i / n * T + r() * 0.35, k = 0.6 + r() * 0.22; P.push({ x: cx + Math.cos(a) * rw * k, y: cy + Math.sin(a) * rh * k, r: rw * (0.27 + r() * 0.1) }); }
      for (let i = 0; i < Math.round(n * 0.7); i++) P.push({ x: cx + (r() - 0.5) * rw * 0.9, y: cy + (r() - 0.55) * rh * 0.8, r: rw * (0.3 + r() * 0.08) });
      P.sort((a, b) => a.y - b.y);
      P.forEach((p) => { g.fillStyle = bot.l; g.beginPath(); g.arc(p.x, p.y + p.r * 0.2, p.r, 0, T); g.fill(); });
      P.forEach((p) => {
        const t = Math.max(0, Math.min(1, (p.y - (cy - rh)) / (rh * 2)));
        const gr = g.createRadialGradient(p.x - p.r * 0.35, p.y - p.r * 0.45, p.r * 0.08, p.x, p.y, p.r);
        gr.addColorStop(0, mix(top.h, bot.h, t)); gr.addColorStop(0.55, mix(top.m, bot.m, t)); gr.addColorStop(1, mix(top.l, bot.l, t));
        g.fillStyle = gr; g.beginPath(); g.arc(p.x, p.y, p.r, 0, T); g.fill();
      });
      P.forEach((p, i) => { if (p.y < cy + rh * 0.1) { shine(p.x - p.r * 0.35, p.y - p.r * 0.45, p.r * 0.26, p.r * 0.13, 0.14, -0.5); } });
      const rr2 = MK.rng(seed + 9);
      for (let i = 0; i < n * 2; i++) { const p = P[Math.floor(rr2() * P.length)]; shine(p.x + (rr2() - 0.7) * p.r * 0.7, p.y - p.r * (0.2 + rr2() * 0.5), 1.6, 1.1, 0.5, rr2() * 3); }
      return P;
    }
    function trunk(x, y, w0, w1, h, flare) {
      g.beginPath(); g.moveTo(x - w0 / 2 - flare, y + 1); g.quadraticCurveTo(x - w0 / 2, y - 4, x - w1 / 2, y - h);
      g.lineTo(x + w1 / 2, y - h); g.quadraticCurveTo(x + w0 / 2, y - 4, x + w0 / 2 + flare, y + 1);
      g.quadraticCurveTo(x, y + 6, x - w0 / 2 - flare, y + 1); g.closePath();
      g.fillStyle = hg(x - w0 / 2, x + w0 / 2, '#c88e5c', '#a06c42', '#744a2c'); g.fill();
      g.strokeStyle = 'rgba(255,230,190,.28)'; g.lineWidth = Math.max(2, w0 * 0.1); g.lineCap = 'round'; g.beginPath(); g.moveTo(x - w0 * 0.22, y - 4); g.lineTo(x - w1 * 0.22, y - h + 6); g.stroke();
      g.strokeStyle = 'rgba(70,35,15,.18)'; g.lineWidth = 1.4; for (let i = 0; i < 3; i++) { g.beginPath(); g.moveTo(x + w0 * 0.12 + i * 3, y - 10 - i * 6); g.lineTo(x + w1 * 0.1 + i * 3, y - 22 - i * 8); g.stroke(); }
      g.fillStyle = 'rgba(30,20,10,.2)'; g.beginPath(); g.ellipse(x, y + 1, w0 / 2 + flare, 3.5, 0, 0, T); g.fill();
    }
    function smallTree(x, y) {
      g.save(); g.translate(x, y); shadow(16, 4, 72, 17, 0.3);
      trunk(0, 0, 17, 13, 52, 5); tuft(-14, 3, 2, 3, 9); tuft(13, 3, 4, 3, 9);
      const P = canopy(0, -78, 70, 42, 11, 9, { h: '#d6f79a', m: '#97da5e', l: '#62b248' }, { h: '#a8e072', m: '#62bb4e', l: '#3d913f' });
      const r = MK.rng(4); [[-26, -66], [18, -90], [30, -62], [-6, -52]].forEach((p) => {
        orb(p[0] + 1, p[1] + 1.5, 5.2, 5, '#7a1a1a', '#7a1a1a', '#5a1010'); orb(p[0], p[1], 5, 5, '#ff9a8a', '#ee4a3f', '#b9302b'); shine(p[0] - 1.6, p[1] - 1.8, 1.5, 1, 0.9); });
      g.restore();
    }
    function bigOak(x, y) {
      g.save(); g.translate(x, y); shadow(30, 6, 130, 28, 0.3);
      // roots + trunk
      trunk(0, 0, 40, 26, 78, 12);
      g.fillStyle = hg(-30, 30, '#c88e5c', '#a06c42', '#744a2c');
      g.beginPath(); g.moveTo(-10, -56); g.quadraticCurveTo(-34, -78, -48, -88); g.quadraticCurveTo(-30, -70, -2, -52); g.closePath(); g.fill();
      g.beginPath(); g.moveTo(10, -56); g.quadraticCurveTo(34, -80, 50, -86); g.quadraticCurveTo(30, -66, 2, -52); g.closePath(); g.fill();
      orb(2, -22, 6, 8, '#3a2412', '#4d321d', '#6a4528', 0, 0);
      tuft(-26, 5, 6, 4, 10); tuft(28, 6, 8, 4, 10);
      canopy(0, -132, 122, 70, 23, 12, { h: '#cdf08a', m: '#8cd058', l: '#5ca844' }, { h: '#8fcf64', m: '#52a94a', l: '#2f7a3a' });
      g.restore();
    }

    /* ---------- rock ---------- */
    function rock(x, y) {
      g.save(); g.translate(x, y); shadow(8, 3, 36, 10, 0.34);
      blobPath(0, -12, 25, 16, 5, 0.06, 12); g.fillStyle = vg(-30, 6, '#f2eff6', '#c3bdd0', '#8b86a0'); g.fill();
      g.save(); blobPath(0, -12, 25, 16, 5, 0.06, 12); g.clip();
      g.fillStyle = MK.lin(g, 22, -20, 0, 6, [[0, 'rgba(70,60,100,0)'], [1, 'rgba(70,60,100,.35)']]); g.fillRect(-30, -34, 60, 44);
      // moss
      const mg = MK.lin(g, 0, -28, 0, -12, [[0, '#bff07e'], [1, '#5fae44']]);
      g.fillStyle = mg; [[8, -23, 8], [15, -20, 7], [2, -21, 5.5], [19, -14, 5], [11, -27, 5]].forEach((m) => { g.beginPath(); g.arc(m[0], m[1], m[2], 0, T); g.fill(); });
      g.fillStyle = 'rgba(255,255,255,.35)'; g.beginPath(); g.arc(6, -26, 2.2, 0, T); g.fill(); g.beginPath(); g.arc(14, -23, 1.8, 0, T); g.fill();
      g.restore();
      shine(-11, -22, 9, 4.5, 0.55, -0.5); shine(-17, -14, 2.5, 1.4, 0.6, -0.6);
      g.fillStyle = 'rgba(90,80,120,.22)'; [[-6, -8], [4, -4], [-12, -5], [12, -9]].forEach((d) => { g.beginPath(); g.arc(d[0], d[1], 1.2, 0, T); g.fill(); });
      // grass in front
      tuft(-18, 3, 12, 4, 15); tuft(14, 4, 15, 5, 17); tuft(-2, 5, 18, 3, 11);
      g.restore();
    }

    /* ---------- flowers ---------- */
    function petals(x, y, o) {
      g.save(); g.translate(x, y); g.scale(1, o.sq || 0.84);
      for (let k = 0; k < (o.rows || 1); k++) {
        const n = k ? o.n - 2 : o.n, off = k ? Math.PI / n : 0, len = o.len * (k ? 0.72 : 1), d = o.d * (k ? 0.72 : 1);
        for (let i = 0; i < n; i++) {
          g.save(); g.rotate(i / n * T + off + (o.rot || 0)); g.translate(d, 0);
          const gr = g.createLinearGradient(-len / 2, 0, len / 2, 0); gr.addColorStop(0, k ? o.c2[2] : o.c0[2]); gr.addColorStop(0.55, k ? o.c2[1] : o.c0[1]); gr.addColorStop(1, k ? o.c2[0] : o.c0[0]);
          g.fillStyle = gr; g.beginPath();
          if (o.pointy) { g.moveTo(-len / 2, 0); g.quadraticCurveTo(-len * 0.1, -o.w / 2 - 0.5, len / 2, 0); g.quadraticCurveTo(-len * 0.1, o.w / 2 + 0.5, -len / 2, 0); }
          else g.ellipse(0, 0, len / 2, o.w / 2, 0, 0, T);
          g.fill(); g.restore();
        }
      }
      orb(0, 0, o.cr, o.cr, o.cc[0], o.cc[1], o.cc[2]);
      if (o.seeds) { g.fillStyle = 'rgba(60,30,10,.35)'; for (let i = 0; i < 14; i++) { const a = i * 2.4, rr = Math.sqrt(i / 14) * o.cr * 0.8; g.beginPath(); g.arc(Math.cos(a) * rr, Math.sin(a) * rr, 0.9, 0, T); g.fill(); } }
      shine(-o.cr * 0.3, -o.cr * 0.38, o.cr * 0.35, o.cr * 0.2, 0.5, -0.5);
      g.restore();
    }
    function leaf(x, y, len, ang, w, c0, c1) {
      g.save(); g.translate(x, y); g.rotate(ang); g.beginPath(); g.moveTo(0, 0); g.quadraticCurveTo(len * 0.4, -w, len, 0); g.quadraticCurveTo(len * 0.4, w, 0, 0);
      g.fillStyle = MK.lin(g, 0, 0, len, 0, [[0, c1], [1, c0]]); g.fill(); g.restore();
    }
    const stem = (x0, y0, x1, y1, w) => capsule(x0, y0, x1, y1, w || 3.4, '#2f8a3c', '#4dae4b', '#8be07a');
    function patch(x, y, type) {
      g.save(); g.translate(x, y); shadow(3, 1, 28, 8, 0.3);
      const tall = type === 'sunflower';
      leaf(0, 0, 20, -2.7, 5, '#76d062', '#2f8a3c'); leaf(0, 0, 20, -0.45, 5, '#76d062', '#2f8a3c'); leaf(0, 0, 17, -1.6, 4.5, '#8fe076', '#34923f');
      if (tall) { leaf(0, -14, 15, -2.6, 5, '#76d062', '#2f8a3c'); leaf(1, -22, 15, -0.5, 5, '#76d062', '#2f8a3c'); }
      const F = {
        daisy: () => {
          [[-15, -17, 7.6], [14, -14, 7.2], [0, -33, 10.5]].forEach((f, i) => {
            stem(0, -2, f[0], f[1], i == 2 ? 3.6 : 3);
          });
          [[-15, -17, 7.6], [14, -14, 7.2], [0, -33, 10.5]].forEach((f) => petals(f[0], f[1], { n: 10, len: f[2] * 1.05, w: f[2] * 0.62, d: f[2] * 0.62, c0: ['#ffffff', '#fbfaf3', '#e3e0d2'], cc: ['#fff08a', '#ffd23e', '#e8a417'], cr: f[2] * 0.4, sq: 0.86 }));
        },
        poppy: () => {
          stem(0, -2, 0, -26, 3.6); stem(0, -2, -15, -17, 3); stem(0, -2, 14, -14, 3);
          [[-15, -17, 7.2], [14, -14, 7]].forEach((f) => petals(f[0], f[1], { n: 5, len: f[2] * 1.2, w: f[2] * 1.15, d: f[2] * 0.52, c0: ['#ff8a76', '#f0483c', '#c42f2f'], cc: ['#6a5a70', '#3b2a40', '#241626'], cr: f[2] * 0.3, sq: 0.84, rot: 0.3 }));
          // tulip cup
          g.save(); g.translate(0, -26);
          const tp = (dx, w, c0, c1, c2) => { g.beginPath(); g.moveTo(dx * 0.4, 4); g.quadraticCurveTo(dx - w, -2, dx * 0.7, -15); g.quadraticCurveTo(dx + w * 0.2, -10, dx + w, -2); g.quadraticCurveTo(dx + w, 3, dx * 0.4 + 1, 5); g.closePath(); g.fillStyle = MK.lin(g, -8, -14, 8, 6, [[0, c0], [0.55, c1], [1, c2]]); g.fill(); };
          tp(-6, 5, '#ff9a96', '#f04f60', '#c62e48'); tp(6, -5, '#ff9a96', '#f04f60', '#c62e48');
          g.beginPath(); g.moveTo(0, 5); g.quadraticCurveTo(-8, -3, 0, -19); g.quadraticCurveTo(8, -3, 0, 5); g.fillStyle = MK.lin(g, -6, -18, 6, 4, [[0, '#ffc2b8'], [0.5, '#ff6f78'], [1, '#d63a52']]); g.fill();
          shine(-2.4, -9, 1.6, 5, 0.45, 0.2); g.restore();
        },
        aster: () => {
          [[-15, -17, 8], [14, -14, 7.4], [0, -33, 10.6]].forEach((f, i) => stem(0, -2, f[0], f[1], i == 2 ? 3.6 : 3));
          [[-15, -17, 8], [14, -14, 7.4], [0, -33, 10.6]].forEach((f) => petals(f[0], f[1], { n: 16, rows: 2, len: f[2] * 1.15, w: f[2] * 0.32, d: f[2] * 0.62, pointy: false, c0: ['#e1b3ff', '#a46ee0', '#7a46b8'], c2: ['#f3d4ff', '#c493f0', '#9a62d4'], cc: ['#fff08a', '#ffd23e', '#e8a417'], cr: f[2] * 0.27, sq: 0.86 }));
        },
        sunflower: () => {
          stem(0, -2, 0, -45, 4.8); stem(0, -6, -17, -26, 4); stem(0, -6, 17, -24, 4);
          [[-17, -29, 9.2], [17, -27, 8.6], [0, -50, 13.5]].forEach((f) => petals(f[0], f[1], { n: 14, rows: 2, len: f[2] * 1.05, w: f[2] * 0.52, d: f[2] * 0.7, pointy: true, c0: ['#ffe86a', '#ffc72a', '#e8991c'], c2: ['#fff08a', '#ffd23e', '#f2a91e'], cc: ['#9a6a3c', '#6a4426', '#3e2514'], cr: f[2] * 0.52, sq: 0.86, seeds: true }));
        },
      };
      F[type](); g.restore();
    }

    /* ---------- gnome + toys ---------- */
    function gnome(x, y) {
      g.save(); g.translate(x, y); g.scale(0.86, 0.86); shadow(3, 0, 20, 6.5, 0.34);
      orb(-5.5, -2.6, 5.6, 3.2, SHOE[0], SHOE[1], SHOE[2]); orb(5.5, -2.6, 5.6, 3.2, SHOE[0], SHOE[1], SHOE[2]);
      rrf(-10, -21, 20, 19, 8, vg(-21, -2, '#78aaf0', '#4a7ccc', '#3558a4'));
      rrf(-10, -13, 20, 3.6, 1.8, '#c28a4c'); rrf(-2.4, -13.6, 4.8, 4.6, 1.4, '#ffe27a');
      capsule(-9, -20, -12, -12, 6, '#3558a4', '#4a7ccc', '#78aaf0'); capsule(9, -20, 12, -12, 6, '#3558a4', '#4a7ccc', '#78aaf0');
      orb(-12.4, -10, 3.4, 3.3, SK[0], SK[1], SK[2]); orb(12.4, -10, 3.4, 3.3, SK[0], SK[1], SK[2]);
      // beard
      g.beginPath(); g.moveTo(-11, -30); g.quadraticCurveTo(-14, -16, -6, -10); g.quadraticCurveTo(-3, -6, 0, -7); g.quadraticCurveTo(3, -6, 6, -10); g.quadraticCurveTo(14, -16, 11, -30); g.closePath();
      g.fillStyle = MK.lin(g, -10, -30, 10, -8, [[0, '#ffffff'], [0.6, '#f3f1f8'], [1, '#d4cfe0']]); g.fill();
      g.strokeStyle = 'rgba(160,150,190,.35)'; g.lineWidth = 1; g.lineCap = 'round'; [[-4, -20, -5, -12], [3, -21, 4, -12], [-8, -22, -9, -16], [8, -22, 9, -16]].forEach((l) => { g.beginPath(); g.moveTo(l[0], l[1]); g.lineTo(l[2], l[3]); g.stroke(); });
      shine(-6, -24, 3, 5, 0.6, 0.2);
      // face
      orb(0, -27.4, 4.6, 4.2, '#ffc8c0', '#f48f8a', '#d96570'); shine(-1.5, -29, 1.4, 1, 0.8);
      cheek(-8, -29, 3.4, 2.4); cheek(8, -29, 3.4, 2.4);
      // hat
      g.beginPath(); g.moveTo(-14, -31); g.quadraticCurveTo(-12, -46, 2, -55); g.quadraticCurveTo(12, -62, 18, -52); g.quadraticCurveTo(9, -52, 12, -46); g.quadraticCurveTo(14, -38, 14.5, -31); g.quadraticCurveTo(0, -27, -14, -31); g.closePath();
      g.fillStyle = MK.lin(g, -14, -56, 14, -30, [[0, '#ff8a70'], [0.5, '#ea4f40'], [1, '#bb3030']]); g.fill();
      g.save(); g.clip(); g.fillStyle = '#fff3d2'; [[-5, -40, 1.9], [4, -36, 1.5], [3, -48, 1.6], [-8, -34, 1.2], [11, -50, 1.4]].forEach((d) => { g.beginPath(); g.arc(d[0], d[1], d[2], 0, T); g.fill(); }); g.restore();
      shine(-7, -42, 2.2, 8, 0.4, 0.45);
      orb(18, -52, 3.4, 3.4, '#ffffff', '#f6f1e4', '#d8d0bc');
      g.beginPath(); g.ellipse(0, -31, 15.5, 3.8, 0, 0, T); g.fillStyle = vg(-35, -27, '#ff8068', '#d94a3c', '#a82c2c'); g.fill(); shine(-5, -32.4, 6, 0.9, 0.45);
      g.restore();
    }
    function ball(x, y) {
      g.save(); g.translate(x, y); shadow(3, 0, 15, 5, 0.32);
      g.save(); g.translate(0, -10); g.beginPath(); g.arc(0, 0, 10, 0, T); g.clip();
      const cols = ['#ee5a48', '#fff6e0', '#4a90e0', '#fff6e0', '#ffd24a', '#fff6e0'];
      for (let i = 0; i < 6; i++) { g.fillStyle = cols[i]; g.beginPath(); g.moveTo(0, 0); g.arc(0, 0, 14, i / 6 * T - 0.5, (i + 1) / 6 * T - 0.5); g.closePath(); g.fill(); }
      const gr = g.createRadialGradient(-3.5, -4, 1, 0, 0, 11); gr.addColorStop(0, 'rgba(255,255,255,.7)'); gr.addColorStop(0.35, 'rgba(255,255,255,0)'); gr.addColorStop(0.7, 'rgba(0,0,0,0)'); gr.addColorStop(1, 'rgba(40,20,60,.38)');
      g.fillStyle = gr; g.fillRect(-12, -12, 24, 24); g.restore();
      orb(0, -19.5, 1.8, 1.4, '#fff', '#f5f5f5', '#c8c8c8');
      g.restore();
    }
    function frisbee(x, y) {
      g.save(); g.translate(x, y); shadow(4, 1, 20, 6, 0.3);
      g.fillStyle = '#c24a74'; g.beginPath(); g.ellipse(0, -3, 15, 7.2, 0, 0, T); g.fill();
      g.fillStyle = MK.lin(g, -14, -12, 14, 0, [[0, '#ff9ab8'], [0.5, '#ff6f9a'], [1, '#e8467c']]); g.beginPath(); g.ellipse(0, -5.5, 15, 7.2, 0, 0, T); g.fill();
      g.fillStyle = MK.lin(g, 0, -11, 0, 0, [[0, '#e8467c'], [1, '#ff8cae']]); g.beginPath(); g.ellipse(0, -5.5, 9.4, 4.4, 0, 0, T); g.fill();
      g.fillStyle = 'rgba(255,255,255,.35)'; g.beginPath(); g.ellipse(0, -4.8, 5.4, 2.4, 0, 0, T); g.fill();
      shine(-8, -9.4, 5, 1.1, 0.7, -0.15);
      g.restore();
    }
    function stick(x, y) {
      g.save(); g.translate(x, y); shadow(2, 0, 22, 5, 0.28);
      g.lineCap = 'round'; g.lineJoin = 'round';
      const path = () => { g.beginPath(); g.moveTo(-16, -4); g.quadraticCurveTo(-4, -8, 3, -5); g.quadraticCurveTo(10, -2, 17, -6); g.moveTo(1, -5.5); g.quadraticCurveTo(5, -12, 11, -14); };
      g.strokeStyle = '#7a4c2c'; g.lineWidth = 5.4; path(); g.stroke();
      g.strokeStyle = '#b57a4a'; g.lineWidth = 4; g.save(); g.translate(-0.3, -0.8); path(); g.stroke(); g.restore();
      g.strokeStyle = '#e4b184'; g.lineWidth = 1.3; g.save(); g.translate(-0.6, -2); path(); g.stroke(); g.restore();
      orb(-16.5, -4, 2.4, 2.3, '#fff0cf', '#e8c690', '#b88a58'); orb(11.5, -14.3, 1.9, 1.8, '#fff0cf', '#e8c690', '#b88a58');
      g.restore();
    }

    /* ---------- fence, hedge ---------- */
    function fence(x0, y) {
      g.save(); g.translate(x0, y);
      g.fillStyle = 'rgba(14,52,30,.2)'; MK.rr(g, 4, -5, 194, 9, 4.5); g.fill();
      const W = 192;
      // rails
      [-12, -28].forEach((ry) => { rrf(-3, ry - 3, W + 6, 6.5, 3, vg(ry - 3, ry + 3.5, '#ead8b2', '#c9ae80')); });
      for (let i = 0; i < 4; i++) {
        for (let k = 0; k < 4; k++) {
          const px = i * 48 + 9 + k * 10, h = 36 + (k % 2 ? 0 : 0);
          g.beginPath(); g.moveTo(px - 4, 0); g.lineTo(px - 4, -h + 6); g.quadraticCurveTo(px - 4, -h + 2, px, -h); g.quadraticCurveTo(px + 4, -h + 2, px + 4, -h + 6); g.lineTo(px + 4, 0); g.closePath();
          g.fillStyle = hg(px - 4, px + 4, '#fffdf4', '#f7eed6', '#e4d3ac'); g.fill();
          shine(px - 1.5, -h + 8, 1, 4.5, 0.55);
          g.fillStyle = 'rgba(80,50,20,.16)'; g.fillRect(px - 4, -7, 8, 7);
          g.fillStyle = 'rgba(80,50,20,.1)'; g.fillRect(px - 4, -13, 8, 1.4); g.fillRect(px - 4, -29, 8, 1.4);
        }
      }
      for (let i = 0; i <= 4; i++) {
        const px = i * 48; rrf(px - 5, -43, 10, 43, 4.5, hg(px - 5, px + 5, '#fff7e0', '#f0e2c0', '#d5bf92'));
        orb(px, -44, 5.6, 5, '#fffdf2', '#f6ead0', '#d9c59a'); shine(px - 1.8, -46, 1.8, 1.1, 0.8);
        g.fillStyle = 'rgba(80,50,20,.16)'; g.fillRect(px - 5, -7, 10, 7);
      }
      tuft(6, 3, 21, 3, 10); tuft(52, 3, 22, 4, 11); tuft(100, 3, 23, 3, 9); tuft(146, 3, 24, 4, 11); tuft(190, 3, 25, 3, 10);
      g.restore();
    }
    function hedge(x0, y) {
      g.save(); g.translate(x0, y);
      g.fillStyle = 'rgba(14,52,30,.3)'; MK.rr(g, 3, -8, 194, 14, 7); g.fill();
      rrf(0, -34, 192, 34, 14, vg(-34, 0, '#3e9a48', '#2a7a3a'));
      for (let k = 0; k < 8; k++) {
        const px = 12 + k * 24, gr = g.createRadialGradient(px - 5, -22, 2, px, -14, 17);
        gr.addColorStop(0, '#6cc552'); gr.addColorStop(0.6, '#3f9d48'); gr.addColorStop(1, '#2a7a3a');
        g.fillStyle = gr; g.beginPath(); g.arc(px, -14, 14.5, 0, T); g.fill();
      }
      rrf(0, -52, 192, 26, 13, MK.lin(g, 0, -52, 0, -26, [[0, '#a4e670'], [1, '#67c150']]));
      for (let k = 0; k < 8; k++) {
        const px = 12 + k * 24, gr = g.createRadialGradient(px - 5, -48, 2, px, -40, 17);
        gr.addColorStop(0, '#d5f9a0'); gr.addColorStop(0.55, '#8ad65c'); gr.addColorStop(1, '#58b24a');
        g.fillStyle = gr; g.beginPath(); g.arc(px, -40, 14, 0, T); g.fill();
      }
      for (let k = 0; k < 8; k++) shine(12 + k * 24 - 5, -48, 4.5, 2, 0.35, -0.4);
      const r = MK.rng(31); for (let i = 0; i < 14; i++) shine(8 + r() * 176, -52 + r() * 44, 1.4, 1, 0.5);
      [[26, -34], [70, -22], [118, -38], [162, -24], [92, -44], [180, -42], [48, -44]].forEach((b) => { orb(b[0], b[1], 3.4, 3.4, '#ffd0d8', '#ff7f96', '#d9486a'); shine(b[0] - 1, b[1] - 1.2, 0.9, 0.7, 0.9); });
      tuft(4, 4, 41, 3, 9); tuft(70, 4, 42, 4, 10); tuft(130, 4, 43, 3, 9); tuft(188, 4, 44, 3, 10);
      g.restore();
    }

    /* ---------- house ---------- */
    function house(x0, y) {
      g.save(); g.translate(x0, y);
      g.fillStyle = 'rgba(14,52,30,.3)'; MK.rr(g, 3, -6, 148, 12, 6); g.fill();
      // wall
      rrf(0, -52, 144, 52, 4, MK.lin(g, 0, -52, 0, 0, [[0, '#fff3d8'], [1, '#f2d9aa']]));
      rrf(0, -9, 144, 9, 3, MK.lin(g, 0, -9, 0, 0, [[0, '#c9bfb4'], [1, '#9d9288']]));
      g.fillStyle = 'rgba(255,255,255,.28)'; for (let i = 0; i < 6; i++) { MK.rr(g, 4 + i * 24, -7, 18, 5, 2.5); g.fill(); }
      // eave shadow
      g.fillStyle = MK.lin(g, 0, -52, 0, -36, [[0, 'rgba(120,60,40,.32)'], [1, 'rgba(120,60,40,0)']]); g.fillRect(0, -52, 144, 16);
      // window
      rrf(15, -43, 44, 33, 6, '#fffaf0');
      rrf(19, -39, 36, 25, 4, MK.lin(g, 19, -39, 55, -14, [[0, '#d2f1ff'], [0.5, '#8ccdf0'], [1, '#5aa6dc']]));
      rrf(35.5, -39, 3, 25, 1, '#fffaf0'); rrf(19, -28, 36, 3, 1, '#fffaf0');
      shine(27, -34, 4, 1.5, 0.7, -0.6); shine(46, -22, 3, 1, 0.45, -0.6);
      rrf(11, -12, 52, 11, 4, MK.lin(g, 0, -12, 0, -1, [[0, '#c98a54'], [1, '#97603a']]));
      [[18, '#ff8aa0'], [28, '#ffd24a'], [38, '#ff8aa0'], [48, '#ffffff'], [57, '#ffd24a']].forEach((f, i) => { orb(f[0], -14 - (i % 2) * 1.5, 3.8, 3.6, '#ffffff', f[1], '#c9607a'); });
      [[14, 1], [24, 2], [34, 1], [44, 2], [54, 1]].forEach((l) => { orb(l[0], -11.5, 3, 2.4, '#8fe076', '#4dae4b', '#2f8a3c'); });
      // door
      rrf(92, -42, 34, 42, 10, '#8c5a38');
      rrf(94.5, -39.5, 29, 39.5, 8, MK.lin(g, 94, -40, 124, 0, [[0, '#d99660'], [1, '#a8683e']]));
      rrf(99, -33, 20, 14, 5, 'rgba(255,255,255,.2)'); rrf(99, -15, 20, 12, 5, 'rgba(255,255,255,.14)');
      shine(100.5, -26, 1.6, 7, 0.3); orb(119, -20, 2.5, 2.5, '#fff2a6', '#f4c84a', '#c8962a');
      // roof
      const ry0 = -96, ry1 = -48;
      g.beginPath(); g.moveTo(-10, ry1 + 2); g.lineTo(6, ry0); g.lineTo(138, ry0); g.lineTo(154, ry1 + 2); g.closePath(); g.fillStyle = '#c0483a'; g.fill();
      g.save(); g.clip();
      for (let j = 0; j < 6; j++) {
        const yy = ry0 + 6 + j * 8.4;
        for (let i = -1; i < 12; i++) {
          const xx = -10 + i * 15 + (j % 2 ? 7.5 : 0) + 1;
          const t = j / 5; const c0 = mix('#ff9a7a', '#ee6a52', t), c1 = mix('#e0624a', '#c24a3c', t);
          const gr = g.createLinearGradient(0, yy - 8, 0, yy + 9); gr.addColorStop(0, c0); gr.addColorStop(1, c1);
          g.fillStyle = gr; g.beginPath(); g.moveTo(xx, yy - 10); g.lineTo(xx + 15, yy - 10); g.lineTo(xx + 15, yy + 1); g.arc(xx + 7.5, yy + 1, 7.5, 0, Math.PI); g.closePath(); g.fill();
          shine(xx + 5, yy - 3, 3.4, 1, 0.3);
        }
      }
      g.fillStyle = MK.lin(g, 0, ry0, 0, ry0 + 12, [[0, 'rgba(255,230,200,.5)'], [1, 'rgba(255,230,200,0)']]); g.fillRect(-10, ry0, 170, 12);
      g.restore();
      rrf(2, ry0 - 4, 142, 8, 4, MK.lin(g, 0, ry0 - 4, 0, ry0 + 4, [[0, '#ffb095'], [1, '#d85a46']]));
      rrf(-12, ry1 - 4, 168, 10, 5, MK.lin(g, 0, ry1 - 4, 0, ry1 + 6, [[0, '#d6574a'], [1, '#a2362f']]));
      shine(70, ry1 - 1, 60, 1.1, 0.35);
      // path stones
      [[107, 12, 15, 8], [101, 30, 14, 8], [110, 47, 15, 8.5]].forEach((s, i) => {
        const sy = s[1] + 2;
        g.fillStyle = 'rgba(14,52,30,.25)'; g.beginPath(); g.ellipse(s[0] + 2, sy + 3, s[2], s[3], 0, 0, T); g.fill();
        blobPath(s[0], sy, s[2], s[3], 60 + i, 0.14, 9); g.fillStyle = '#b3a89c'; g.fill();
        blobPath(s[0], sy - 1.5, s[2] - 0.5, s[3] - 0.5, 60 + i, 0.14, 9); g.fillStyle = MK.lin(g, 0, sy - 9, 0, sy + 6, [[0, '#f4ece0'], [1, '#d3c7b6']]); g.fill();
        shine(s[0] - 4, sy - 4, 5, 1.6, 0.5, -0.1);
      });
      tuft(92, 18, 51, 3, 9); tuft(124, 32, 52, 3, 9); tuft(90, 46, 53, 3, 9);
      g.restore();
    }

    /* ---------- pond ---------- */
    function pond(cx, cy) {
      g.save(); g.translate(cx, cy);
      blobPath(0, 0, 80, 50, 77, 0.12, 11); g.fillStyle = 'rgba(14,52,30,.25)'; g.save(); g.translate(3, 4); g.fill(); g.restore();
      blobPath(0, 0, 80, 50, 77, 0.12, 11); g.fillStyle = MK.lin(g, 0, -50, 0, 50, [[0, '#fbe9b6'], [1, '#e2bf7c']]); g.fill();
      const r = MK.rng(12); for (let i = 0; i < 40; i++) { const a = r() * T, d = 0.82 + r() * 0.15; g.fillStyle = r() > 0.5 ? 'rgba(255,255,255,.35)' : 'rgba(170,120,60,.25)'; g.beginPath(); g.arc(Math.cos(a) * 78 * d, Math.sin(a) * 48 * d, 0.8 + r() * 1.1, 0, T); g.fill(); }
      blobPath(0, 1, 68, 40, 77, 0.12, 11); g.fillStyle = MK.lin(g, 0, -40, 0, 40, [[0, '#8fe0e6'], [1, '#6cc4dd']]); g.fill();
      blobPath(0, 2, 62, 34, 77, 0.12, 11); g.fillStyle = MK.lin(g, 0, -34, 0, 36, [[0, '#59bfe6'], [1, '#2f86cc']]); g.fill();
      blobPath(0, 3, 50, 25, 78, 0.12, 11); g.fillStyle = MK.lin(g, 0, -25, 0, 28, [[0, '#46aadf'], [1, '#2874c0']]); g.fill();
      g.lineWidth = 1.8; [[-14, -2, 18, 6, 0.8], [-14, -2, 30, 10, 0.5], [-14, -2, 43, 14, 0.28], [24, 8, 9, 3.5, 0.7], [24, 8, 16, 6, 0.4]].forEach((rp) => { g.strokeStyle = 'rgba(255,255,255,' + rp[4] + ')'; g.beginPath(); g.ellipse(rp[0], rp[1], rp[2], rp[3], 0, 0, T); g.stroke(); });
      [[-30, -14, 3], [28, -10, 2.4], [38, 14, 2], [-6, 18, 2.4], [8, -20, 1.8]].forEach((s) => shine(s[0], s[1], s[2] * 2, s[2] * 0.6, 0.7, -0.2));
      // lily pad + lotus
      g.save(); g.translate(-38, 10); g.beginPath(); g.moveTo(0, 0); g.arc(0, 0, 11, 0.5, T - 0.2); g.closePath(); g.scale(1, 0.7);
      g.restore();
      g.save(); g.translate(-38, 10); g.scale(1, 0.62); g.beginPath(); g.moveTo(0, 0); g.arc(0, 0, 11, 0.35, T - 0.35); g.closePath(); g.fillStyle = MK.lin(g, -10, -10, 10, 10, [[0, '#9ae870'], [1, '#3f9d48']]); g.fill(); g.restore();
      petals(-42, 6, { n: 6, len: 7.5, w: 5.6, d: 3.8, c0: ['#ffd0e0', '#ff94b4', '#e0638c'], cc: ['#fff08a', '#ffd23e', '#e8a417'], cr: 2.4, sq: 0.8 });
      // pebbles + reeds on shore
      [[-70, -22, 4.4], [-74, -12, 3.2], [66, 24, 4.2], [58, 32, 3], [-52, 38, 3.4]].forEach((p, i) => { orb(p[0], p[1], p[2], p[2] * 0.7, '#f4ecdf', '#cdbfae', '#9c8f80'); });
      tuft(72, -12, 91, 4, 20); tuft(-66, 26, 92, 3, 17);
      g.restore();
    }

    /* ---------- truck ---------- */
    function truck(cx, cy) {
      g.save(); g.translate(cx, cy); shadow(5, 10, 56, 17, 0.34);
      const tire = (x, y, a) => { rrf(x - 8.5, y - 4, 17, 8, 4, '#2e2a2c'); shine(x - 1, y - 1.6, 5.5, 1, 0.22); };
      tire(-28, -22); tire(31, -22);
      // body side + top
      rrf(-47, -14, 94, 38, 13, '#d79a1c');
      rrf(-47, -22, 94, 38, 13, MK.lin(g, 0, -22, 0, 16, [[0, '#ffe680'], [0.5, '#ffd23a'], [1, '#f2ac1e']]));
      // near wheels
      [[-28, 22], [31, 22]].forEach((w) => { orb(w[0], w[1] + 1, 9.5, 8, '#4a4446', '#2e2a2c', '#1c1a1b', 0, 0); orb(w[0], w[1], 9.5, 8, '#5b5456', '#3b3638', '#252223'); orb(w[0], w[1], 4.8, 4, '#fffaf0', '#e1d2ae', '#a89a78'); shine(w[0] - 4, w[1] - 4, 3.6, 1, 0.35, -0.3); });
      // bed
      rrf(-44, -18, 40, 30, 8, '#f0b92a');
      rrf(-41, -15, 34, 24, 6, MK.lin(g, -41, -15, -7, 9, [[0, '#b8791a'], [1, '#d99a26']]));
      rrf(-41, -15, 34, 4, 2, 'rgba(0,0,0,.14)');
      // cargo: sack + gas can
      orb(-26, -2, 9, 8, '#fffaf0', '#f0e2c0', '#cdb98c'); g.fillStyle = '#d9c9a2'; g.beginPath(); g.moveTo(-28, -9); g.quadraticCurveTo(-26, -13, -24, -9); g.closePath(); g.fill(); shine(-29, -5, 3, 1.6, 0.6, -0.6);
      rrf(-18, -9, 9, 13, 3, MK.lin(g, -18, -9, -9, 4, [[0, '#ff8a76'], [1, '#d03a32']])); rrf(-15, -11.5, 4, 3, 1.4, '#ffe27a'); shine(-16, -4, 1, 3, 0.5);
      // cab
      rrf(-2, -21, 30, 36, 11, '#e3a620');
      rrf(-2, -22, 30, 36, 11, MK.lin(g, -2, -22, 28, 14, [[0, '#fff09a'], [0.6, '#ffd23a'], [1, '#f2ac1e']]));
      rrf(1, -17, 5, 26, 2.5, MK.lin(g, 0, -17, 0, 9, [[0, '#4d7e92'], [1, '#2f5666']]));
      rrf(20, -18, 9, 30, 4, MK.lin(g, 20, -18, 28, 12, [[0, '#d4f2ff'], [0.6, '#8accee'], [1, '#5aa0d4']])); shine(23, -12, 1.4, 6, 0.6, 0.1);
      shine(8, -16, 7, 2, 0.5, 0.05);
      // hood
      rrf(28, -21, 19, 35, 9, MK.lin(g, 28, -21, 47, 14, [[0, '#fff09a'], [0.6, '#ffd23a'], [1, '#f2ac1e']]));
      rrf(34, -14, 9, 20, 4, 'rgba(255,255,255,.2)');
      orb(45, -14, 2.8, 3.6, '#ffffff', '#fffbd0', '#e8d890'); orb(45, 8, 2.8, 3.6, '#ffffff', '#fffbd0', '#e8d890');
      rrf(44, -8, 4, 12, 2, '#cfd4da');
      // mirrors
      orb(21, -25, 3.2, 2.6, '#fff09a', '#f2ac1e', '#c98a1c'); orb(21, 19.5, 3.2, 2.6, '#fff09a', '#f2ac1e', '#c98a1c');
      g.restore();
    }

    /* ---------- lay out the sheet ---------- */
    const S = MK.slots;
    kidFront(S.kidIdle.x, S.kidIdle.y); label('kid · idle', S.kidIdle.x, S.kidIdle.y + 18);
    kidScythe(S.kidScythe.x, S.kidScythe.y); label('kid · scythe swing', S.kidScythe.x + 8, S.kidScythe.y + 18);
    kidPush(S.kidPush.x, S.kidPush.y); label('kid · push mower', S.kidPush.x, S.kidPush.y + 18);
    reelMower(S.reel.x, S.reel.y); label('reel mower', S.reel.x, S.reel.y + 18);
    rideMower(S.ride.x, S.ride.y); label('ride-on mower', S.ride.x, S.ride.y + 18);
    smallTree(S.treeSmall.x, S.treeSmall.y); label('small tree', S.treeSmall.x, S.treeSmall.y + 20);
    bigOak(S.treeBig.x, S.treeBig.y); label('big oak', S.treeBig.x, S.treeBig.y + 20);
    rock(S.rock.x, S.rock.y); label('rock', S.rock.x, S.rock.y + 22);
    ['daisy', 'poppy', 'aster', 'sunflower'].forEach((t, i) => {
      const fx = S.flowers.x + i * 60; patch(fx, S.flowers.y, t);
      label(['daisy', 'tulip / poppy', 'aster', 'sunflower'][i], fx - (i == 3 ? 6 : 0), S.flowers.y + 20);
    });
    gnome(S.gnome.x, S.gnome.y); label('gnome', S.gnome.x + 8, S.gnome.y + 20);
    ball(S.gnome.x + 55, S.gnome.y); label('ball', S.gnome.x + 55, S.gnome.y + 20);
    frisbee(S.gnome.x + 110, S.gnome.y); label('frisbee', S.gnome.x + 110, S.gnome.y + 20);
    stick(S.gnome.x + 165, S.gnome.y); label('stick', S.gnome.x + 165, S.gnome.y + 20);
    fence(S.fence.x, S.fence.y); label('picket fence', S.fence.x + 96, S.fence.y + 24);
    hedge(S.hedge.x, S.hedge.y); label('hedge', S.hedge.x + 96, S.hedge.y + 24);
    house(S.house.x, S.house.y); label('house + path', S.house.x + 72, S.house.y + 78);
    pond(S.pond.x, S.pond.y + 4); label('pond', S.pond.x, S.pond.y + 66);
    truck(S.truck.x - 4, S.truck.y); label('pickup truck', S.truck.x - 4, S.truck.y + 44);
  }
});
