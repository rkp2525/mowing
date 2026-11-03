/* Lawn Kid - player, tools and truck sprites (smooth painterly vector, soft tinted-brown contours).
   window.MOW.SpritesPlayer = { drawPlayer(g, st), drawTruck(g), bounds }
   Design units: 1 grass cell = 48px. (0,0) = player ground position. Deterministic, no Math.random. */
(function () {
  'use strict';
  window.MOW = window.MOW || {};
  const TAU = Math.PI * 2;
  const OUT = 'rgba(66,61,42,0.32)';       // soft tinted-brown contour
  const OUT2 = 'rgba(60,40,30,0.5)';
  let LH = 0;                               // current local rotation (for world-aligned lighting)

  /* ---------- helpers ---------- */
  function rr(g, x, y, w, h, r) {
    r = Math.min(r, w / 2, h / 2);
    g.beginPath(); g.moveTo(x + r, y); g.arcTo(x + w, y, x + w, y + h, r); g.arcTo(x + w, y + h, x, y + h, r);
    g.arcTo(x, y + h, x, y, r); g.arcTo(x, y, x + w, y, r); g.closePath();
  }
  function lin(g, x0, y0, x1, y1, stops) {
    const gr = g.createLinearGradient(x0, y0, x1, y1);
    for (let i = 0; i < stops.length; i++) gr.addColorStop(stops[i][0], stops[i][1]);
    return gr;
  }
  /* vertical gradient light->dark between y0..y1 */
  function vg(g, y0, y1, a, b, m) { return lin(g, 0, y0, 0, y1, m ? [[0, a], [0.5, m], [1, b]] : [[0, a], [1, b]]); }
  /* gradient in a rotated local frame, lit from world top-left; stops[0] = lit colour */
  function lg(g, cx, cy, r, stops) {
    const c = Math.cos(LH), s = Math.sin(LH);
    const ux = -0.55 * c - 0.83 * s, uy = 0.55 * s - 0.83 * c;
    return lin(g, cx + ux * r, cy + uy * r, cx - ux * r, cy - uy * r, stops);
  }
  function fillOut(g, fill, lw) {
    g.fillStyle = fill; g.fill(); g.strokeStyle = OUT; g.lineWidth = lw || 1.4; g.lineJoin = 'round'; g.stroke();
  }
  function limb(g, x0, y0, x1, y1, w, fill) {
    g.lineCap = 'round';
    g.strokeStyle = OUT; g.lineWidth = w + 2.6; g.beginPath(); g.moveTo(x0, y0); g.lineTo(x1, y1); g.stroke();
    g.strokeStyle = fill; g.lineWidth = w; g.beginPath(); g.moveTo(x0, y0); g.lineTo(x1, y1); g.stroke();
  }
  function ell(g, x, y, rx, ry, rot) { g.beginPath(); g.ellipse(x, y, rx, ry, rot || 0, 0, TAU); }
  function shadow(g, x, y, rx, ry, a) {
    g.save(); g.translate(x, y); g.scale(rx, ry);
    const gr = g.createRadialGradient(-.12, -.12, 0, 0, 0, 1);
    gr.addColorStop(0, 'rgba(25,49,29,' + (a * .38) + ')');
    gr.addColorStop(.55, 'rgba(25,49,29,' + (a * .16) + ')');
    gr.addColorStop(1, 'rgba(25,49,29,0)');
    g.fillStyle = gr; g.fillRect(-1.2, -1.2, 2.4, 2.4); g.restore();
  }
  function rshadow(g, x, y, w, h, r, rot, a) {
    g.save(); g.translate(x, y); g.rotate(rot);
    shadow(g, 0, 0, w * .6, h * .65, a); g.restore();
  }
  function lp(h, x, y) { const c = Math.cos(h), s = Math.sin(h); return [c * x - s * y, s * x + c * y]; }
  function puffs(g, x, y, t, a) {
    for (let i = 0; i < 3; i++) {
      const p = (t * 0.8 + i / 3) % 1;
      g.fillStyle = 'rgba(120,120,125,' + (0.3 * (1 - p) * a) + ')';
      ell(g, x - p * 8 + Math.sin(p * 6 + i) * 2, y - p * 20, 2.6 + p * 4.5, 2.4 + p * 4); g.fill();
    }
  }

  /* ---------- kid ---------- */
  // Summer-in-the-suburbs palette: washed cotton, indigo, ochre and clay.
  const SKIN = '#eac49a', SKIN_D = '#cb936d', SHIRT = '#d58661', SHIRT_D = '#ae624b', BLUE = '#617e88', BLUE_D = '#435e6c', BOOT = '#eee2c5', CAP = '#607e87', CAP_D = '#455e67', HAIR = '#654b35';

  function kidState(k) {
    const dx = k.dx, dy = k.dy, mv = k.mv;
    const ph = Math.sin(k.step * 2.2);
    const bob = mv ? -Math.abs(ph) * 1.2 : Math.sin(k.t * 2) * 0.35;
    const lean = (mv ? 1.8 : 0.6) * dx;
    const hw = 10 - 2 * Math.abs(dx);
    const hipY = k.y - 17 + bob * 0.5, shY = k.y - 34 + bob;
    return { dx, dy, mv, ph, bob, ux: k.x + lean, hw, hipY, shY, hx: k.x + lean + dx, hy: shY - 8.5 + (k.tired ? 1 : 0), k };
  }

  function kidLegs(g, S) {
    const { dx, dy, k } = S, legs = [];
    for (let i = 0; i < 2; i++) {
      const side = i ? 1 : -1, sw = S.mv ? side * S.ph : 0;
      const hx = k.x + side * 4.5, hy = S.hipY;
      const fx = hx + dx * (k.seated ? 14 : sw * 7);
      const fy = k.seated ? hy + dy * 8 + 12 : k.y + dy * sw * 4 - Math.max(0, sw) * 2;
      legs.push({ hx, hy, fx, fy });
    }
    legs.sort((a, b) => a.fy - b.fy);
    for (const L of legs) {
      limb(g, L.hx, L.hy, L.fx, L.fy - 3, 5.5, SKIN);
      limb(g, L.hx, L.hy, L.hx + (L.fx - L.hx) * .45, L.hy + 8, 9, BLUE);
      limb(g, L.fx, L.fy - 6, L.fx, L.fy - 2, 5.8, '#e9dfbd');
      ell(g, L.fx + dx * 2, L.fy, 6.3 + Math.abs(dx), 3.5);
      fillOut(g, '#c4bda4', 1);
      ell(g, L.fx + dx * 2, L.fy - 1.4, 5.7 + Math.abs(dx), 3.1);
      fillOut(g, BOOT, .8);
      g.strokeStyle = '#9a8a68'; g.lineWidth = .8;
      g.beginPath(); g.moveTo(L.fx - 2, L.fy - 2); g.lineTo(L.fx + 2, L.fy - 2); g.stroke();
    }
  }

  function kidTorso(g, S) {
    const { dx, ux, hw, hipY, shY } = S;
    g.beginPath(); g.moveTo(ux - hw + 3, shY);
    g.quadraticCurveTo(ux, shY - 2, ux + hw - 3, shY);
    g.quadraticCurveTo(ux + hw + 2, shY + 6, ux + hw - 1, hipY + 2);
    g.quadraticCurveTo(ux, hipY + 4, ux - hw + 1, hipY + 2);
    g.quadraticCurveTo(ux - hw - 2, shY + 6, ux - hw + 3, shY); g.closePath();
    fillOut(g, vg(g, shY, hipY + 3, '#e6aa80', SHIRT), 1);
    g.save(); g.clip();
    // Two broad woven stripes read clearly at playing size.
    g.fillStyle = '#f0dfb8';
    g.fillRect(ux - hw - 2, shY + 7, hw * 2 + 4, 3.2);
    g.fillRect(ux - hw - 2, shY + 14, hw * 2 + 4, 2.8);
    g.fillStyle = 'rgba(93,66,45,.12)'; g.fillRect(ux + hw - 4, shY, 5, 25);
    g.restore();
    // Denim waistband and little side pocket, no shiny overall buttons.
    rr(g, ux - hw + 1, hipY, hw * 2 - 2, 6, 2); fillOut(g, BLUE, .8);
    g.strokeStyle = '#90a5a4'; g.lineWidth = .8;
    g.beginPath(); g.moveTo(ux + dx * 3 + 2, hipY + 1); g.lineTo(ux + dx * 3 + 4, hipY + 4); g.stroke();
  }

  function kidHead(g, S) {
    const { dx, dy, hx, hy } = S, away = dy < -.35, ax = Math.abs(dx);
    const brim = () => {
      ell(g, hx + dx * 9, hy - 3 + dy * 6, 8 + 4 * Math.abs(dy), 3.8, dx * .12);
      fillOut(g, '#526f77', 1);
      g.strokeStyle = '#a8bebc'; g.lineWidth = .8;
      g.beginPath(); g.ellipse(hx + dx * 9 - 1, hy - 4 + dy * 6, 7 + 4 * Math.abs(dy), 2.4, dx * .12, Math.PI, TAU); g.stroke();
    };
    if (away) brim();
    ell(g, hx, hy + 1, 9.5 - ax, 9.7); fillOut(g, '#eac49a', 1);
    if (away) {
      ell(g, hx, hy + .3, 9.3 - ax, 9); fillOut(g, HAIR, .6);
    } else {
      ell(g, hx - dx * 7, hy, 3.3, 6); g.fillStyle = HAIR; g.fill();
      ell(g, hx - dx * 8.3, hy + 2, 2.5, 3); g.fillStyle = SKIN; g.fill();
      const ex = hx + dx * 6, ey = hy + 3 + dy * 2;
      g.fillStyle = '#594735';
      for (const side of [-1, 1]) {
        if (ax > .7 && side * dx < 0) continue;
        ell(g, ex + side * (3.4 - ax), ey, 1.1, S.k.tired ? .65 : 1.3); g.fill();
      }
      ell(g, ex + dx * 2, ey + 2.8, 2, 1.5); g.fillStyle = '#d4a17b'; g.fill();
      g.strokeStyle = '#96674f'; g.lineWidth = .8;
      g.beginPath(); g.moveTo(ex - 1.5, ey + 5); g.quadraticCurveTo(ex + .5, ey + 6, ex + 2, ey + 4.8); g.stroke();
    }
    // A sun-faded six-panel baseball cap; an asymmetric cloth silhouette.
    g.beginPath(); g.moveTo(hx - 11, hy - 2);
    g.bezierCurveTo(hx - 12, hy - 15, hx + 8, hy - 16, hx + 11, hy - 4);
    g.quadraticCurveTo(hx + 3, hy + 1, hx - 11, hy - 2); g.closePath();
    fillOut(g, vg(g, hy - 14, hy, '#8da5aa', CAP), 1);
    g.strokeStyle = 'rgba(48,75,78,.3)'; g.lineWidth = .8;
    g.beginPath(); g.moveTo(hx - 1, hy - 13); g.quadraticCurveTo(hx + 3, hy - 8, hx + 2, hy - 2); g.stroke();
    g.strokeStyle = 'rgba(207,224,210,.5)';
    g.beginPath(); g.moveTo(hx - 8, hy - 6); g.quadraticCurveTo(hx - 7, hy - 11, hx - 3, hy - 12); g.stroke();
    ell(g, hx - 1, hy - 13, 1.6, 1); g.fillStyle = CAP_D; g.fill();
    if (!away) brim();
    else { rr(g, hx - 4, hy - .5, 8, 2.5, 1); g.fillStyle = CAP_D; g.fill(); }
  }

  function kidArm(g, S, s, hx, hy) {
    const sx = S.ux + s * (S.hw - 1.5), sy = S.shY + 5;
    const mx = sx + (hx - sx) * 0.5, my = sy + (hy - sy) * 0.5;
    limb(g, sx, sy, hx, hy, 5.4, SKIN);
    limb(g, sx, sy, mx, my, 8, SHIRT);
    g.strokeStyle = 'rgba(255,255,255,.2)'; g.lineWidth = 2; g.lineCap = 'round'; g.beginPath(); g.moveTo(sx - 1, sy - 1); g.lineTo(mx - 1, my - 1); g.stroke();
    ell(g, hx, hy, 3.5, 3.3); fillOut(g, SKIN, 1.2);
  }
  /* arms with optional explicit hand targets [[x,y],[x,y]] (left,right in screen) else hanging */
  function kidArms(g, S, hands) {
    const { dx, dy } = S;
    const items = [];
    for (let i = 0; i < 2; i++) {
      const s = i ? 1 : -1;
      let h;
      if (hands) h = hands[i];
      else {
        const sw = S.mv ? (i ? -S.ph : S.ph) : Math.sin(S.k.t * 1.3 + i) * 0.15;
        h = [S.ux + s * (S.hw + 1.5) + dx * sw * 7 - dx * 1, S.shY + 24 + dy * sw * 4 - Math.abs(sw) * 1.5];
      }
      items.push({ s, h });
    }
    items.sort((a, b) => a.h[1] - b.h[1]);
    for (const it of items) kidArm(g, S, it.s, it.h[0], it.h[1]);
  }

  function status(g, S, k) {
    if (k.stall > 0) {
      const bx = S.hx, by = S.hy - 33 + Math.sin(k.t * 9) * 1;
      g.save(); g.translate(bx, by);
      rr(g, -3.4, -9, 6.8, 11, 3.2); fillOut(g, '#ffd23f', 1.4);
      ell(g, 0, 6.2, 3.4, 3.4); fillOut(g, '#ffd23f', 1.4);
      g.restore();
    }
    if (k.tired) {
      const p = (k.t * 1.1) % 1;
      g.fillStyle = 'rgba(140,205,255,' + (0.95 - p * 0.5) + ')';
      g.beginPath(); const x = S.hx + 15, y = S.hy - 6 + p * 8;
      g.moveTo(x, y - 5); g.quadraticCurveTo(x + 4.2, y + 1, x, y + 3.4); g.quadraticCurveTo(x - 4.2, y + 1, x, y - 5); g.fill();
      g.strokeStyle = 'rgba(40,90,150,.5)'; g.lineWidth = 1; g.stroke();
    }
  }

  /* ---------- mowers (local frame, +x forward, drawn after g.rotate(h)) ---------- */
  function wheel(g, x, y, w, h) {
    rr(g, x - w / 2, y - h / 2, w, h, h * 0.45); fillOut(g, vg(g, y - h / 2, y + h / 2, '#59606c', '#262a32'), 1.2);
    g.fillStyle = 'rgba(255,255,255,.22)'; rr(g, x - w / 2 + 2, y - h / 2 + 1, w - 4, 1.4, 0.7); g.fill();
  }
  function gasMower(g) {
    g.save(); g.translate(16, 0); // body centre
    wheel(g, 14, -19, 13, 7); wheel(g, 14, 19, 13, 7); wheel(g, -14, -19.5, 17, 9); wheel(g, -14, 19.5, 17, 9);
    rr(g, -25, -16, 50, 32, 10);
    fillOut(g, lg(g, 0, 0, 20, [[0, '#db9a78'], [0.5, '#ba6950'], [1, '#844c3f']]));
    g.fillStyle = 'rgba(255,255,255,.32)'; rr(g, -21, -13, 38, 5, 2.5); g.fill();
    rr(g, 21, -9, 6, 18, 3); fillOut(g, '#3a3f4a', 1.1);        // front bumper
    rr(g, -4, 13, 16, 7, 3); fillOut(g, '#b9341d', 1.1);         // discharge chute
    ell(g, -8, 0, 8.6, 8.6); fillOut(g, lg(g, -8, 0, 9, [[0, '#eef2f7'], [1, '#8a93a1']]), 1.2);
    ell(g, -8, 0, 3.4, 3.4); fillOut(g, '#343a46', 1);
    rr(g, 4, -3, 8, 6, 2.5); fillOut(g, '#c9d0d9', 1);
    g.restore();
  }
  function reelMower(g) {
    g.save(); g.translate(10, 0);
    wheel(g, -6, -19, 18, 7); wheel(g, -6, 19, 18, 7);
    for (let s = -1; s <= 1; s += 2) { ell(g, -6, s * 19, 2.6, 2.6); fillOut(g, '#d4452c', 0.9); }
    rr(g, -9, -17, 24, 5, 2.5); fillOut(g, lg(g, 0, 0, 20, [[0, '#a5bcb6'], [1, '#577c83']]), 1.2);
    rr(g, -9, 12, 24, 5, 2.5); fillOut(g, lg(g, 0, 0, 20, [[0, '#a5bcb6'], [1, '#577c83']]), 1.2);
    rr(g, -12, -11, 5, 22, 2.5); fillOut(g, '#577c83', 1.1);   // rear bar
    rr(g, 8, -18, 13, 36, 6);
    fillOut(g, lg(g, 14, 0, 16, [[0, '#f8fafd'], [0.6, '#bcc6d3'], [1, '#7c8796']]), 1.3);
    g.strokeStyle = 'rgba(70,82,98,.55)'; g.lineWidth = 0.9; g.lineCap = 'round';
    for (let y = -14; y <= 14; y += 4.7) { g.beginPath(); g.moveTo(9, y - 1.8); g.lineTo(20, y + 1.8); g.stroke(); }
    g.strokeStyle = 'rgba(70,82,98,.7)'; g.lineWidth = 1.1; g.beginPath(); g.moveTo(14.5, -18); g.lineTo(14.5, 18); g.stroke();
    g.restore();
  }
  function rideMower(g, t, engine) {
    wheel(g, -30, -24, 26, 11); wheel(g, -30, 24, 26, 11); wheel(g, 30, -22, 18, 8); wheel(g, 30, 22, 18, 8);
    rr(g, 6, 12, 26, 11, 4); fillOut(g, '#c9381f', 1.1);                                 // discharge
    g.fillStyle = '#ba6950'; rr(g, -8, -14, 4, 28, 2); g.fill();
    rr(g, -42, -19, 38, 38, 13); fillOut(g, lg(g, -22, 0, 24, [[0, '#91ad7d'], [0.5, '#648565'], [1, '#425e47']]), 1.4);   // engine cover
    rr(g, -8, -13, 54, 26, 11); fillOut(g, lg(g, 20, 0, 22, [[0, '#9dbb86'], [0.5, '#6b946c'], [1, '#456c50']]), 1.4);      // hood
    g.fillStyle = 'rgba(255,247,219,.16)'; rr(g, -2, -10, 42, 4, 2); g.fill();
    g.fillStyle = 'rgba(255,255,255,.55)'; rr(g, 12, -1.6, 24, 3.2, 1.6); g.fill();
    g.fillStyle = '#e5cfa0'; for (let s = -1; s <= 1; s += 2) { ell(g, 45, s * 7.5, 2.8, 2.8); g.fill(); g.strokeStyle = OUT; g.lineWidth = 0.9; g.stroke(); }
    rr(g, -24, -9, 18, 18, 6); fillOut(g, '#2f343e', 1.2);                              // seat
    g.fillStyle = 'rgba(255,255,255,.14)'; rr(g, -22, -7, 14, 3, 1.5); g.fill();
    ell(g, -33, -9, 3, 3); fillOut(g, '#c9d0d9', 1);                                    // exhaust
  }

  /* ---------- player ---------- */
  function drawPlayer(g, st) {
    const tool = st.tool || 'scythe', h = st.heading || 0, c = Math.cos(h), s = Math.sin(h);
    const t = st.t || 0, step = st.step || 0, mv = !!st.moving;
    g.save(); g.lineJoin = 'round'; g.lineCap = 'round';
    const base = { step, mv, t, tired: !!st.tired, stall: st.stall || 0 };

    if (tool === 'ride') {
      const seat = lp(h, -14, 0), wh = lp(h, 3, 0);
      rshadow(g, 3, 5, 100, 56, 22, h, 0.55);
      g.save(); g.rotate(h); LH = h; rideMower(g, t, st.engine); g.restore(); LH = 0;
      const k = Object.assign({ x: seat[0], y: seat[1] + 9, dx: c, dy: s, seated: true }, base);
      const S = kidState(k);
      const wc = [wh[0], wh[1] - 15], px = -s, py = c;
      const hands = [[wc[0] - px * 9.5, wc[1] - py * 4.6], [wc[0] + px * 9.5, wc[1] + py * 4.6]];
      // order hands so that left/right in screen correspond to arms
      if (hands[0][0] > hands[1][0]) { const tmp = hands[0]; hands[0] = hands[1]; hands[1] = tmp; }
      const wheelDraw = () => {
        g.strokeStyle = OUT; g.lineWidth = 4.2; g.beginPath(); g.moveTo(wh[0], wh[1]); g.lineTo(wc[0], wc[1]); g.stroke();
        g.strokeStyle = '#4b515d'; g.lineWidth = 2; g.beginPath(); g.moveTo(wh[0], wh[1]); g.lineTo(wc[0], wc[1]); g.stroke();
        ell(g, wc[0], wc[1], 11.5, 5.8); g.strokeStyle = OUT; g.lineWidth = 5; g.stroke(); g.strokeStyle = '#3a3f4a'; g.lineWidth = 2.8; g.stroke();
      };
      if (s < -0.25) { wheelDraw(); kidLegs(g, S); kidTorso(g, S); kidHead(g, S); kidArms(g, S, hands); }
      else { kidLegs(g, S); kidTorso(g, S); kidHead(g, S); wheelDraw(); kidArms(g, S, hands); }
      if (st.engine) { const e = lp(h, -36, 0); puffs(g, e[0], e[1] - 6, t, 1); }
      status(g, S, base);
    } else if (tool === 'gas' || tool === 'reel') {
      const gas = tool === 'gas';
      const kx = -c * 30, ky = -s * 26;
      const mc = lp(h, 26, 0); // approx mower centre (x offset 16 + 10)
      rshadow(g, 26 * c + 3, 26 * s + 4, gas ? 62 : 52, 44, 14, h, 0.5);
      const k = Object.assign({ x: kx, y: ky, dx: c, dy: s }, base);
      const S = kidState(k);
      const px = -s, py = c;
      const hands = [[kx + c * 7 - px * 8, ky - 27 + s * 4 - py * 5], [kx + c * 7 + px * 8, ky - 27 + s * 4 + py * 5]];
      if (hands[0][0] > hands[1][0] || (Math.abs(hands[0][0] - hands[1][0]) < 0.01 && hands[0][1] > hands[1][1])) { const tmp = hands[0]; hands[0] = hands[1]; hands[1] = tmp; }
      const rear = gas ? -9 : -2;
      const r0 = lp(h, rear, -9), r1 = lp(h, rear, 9);
      const rA = [r0[0] + (gas ? 16 : 10) * c, r0[1] + (gas ? 16 : 10) * s], rB = [r1[0] + (gas ? 16 : 10) * c, r1[1] + (gas ? 16 : 10) * s];
      const mower = () => { g.save(); g.translate(0, 0); g.rotate(h); LH = h; g.translate(0, 0); if (gas) gasMower(g); else reelMower(g); g.restore(); LH = 0; };
      const handle = () => {
        const col = gas ? '#4a505c' : '#b98a52', colH = gas ? '#6a7180' : '#d8b078';
        // pair strut to nearest hand
        const hs = hands.slice().sort((a, b) => (a[0] * px + a[1] * py) - (b[0] * px + b[1] * py));
        const rs = [rA, rB].sort((a, b) => (a[0] * px + a[1] * py) - (b[0] * px + b[1] * py));
        for (let i = 0; i < 2; i++) {
          g.lineCap = 'round';
          g.strokeStyle = OUT; g.lineWidth = 5.4; g.beginPath(); g.moveTo(rs[i][0], rs[i][1]); g.lineTo(hs[i][0], hs[i][1]); g.stroke();
          g.strokeStyle = col; g.lineWidth = 3; g.beginPath(); g.moveTo(rs[i][0], rs[i][1]); g.lineTo(hs[i][0], hs[i][1]); g.stroke();
          g.strokeStyle = 'rgba(255,255,255,.25)'; g.lineWidth = 1; g.beginPath(); g.moveTo(rs[i][0] - 0.6, rs[i][1] - 0.8); g.lineTo(hs[i][0] - 0.6, hs[i][1] - 0.8); g.stroke();
        }
        g.strokeStyle = OUT; g.lineWidth = 6.6; g.beginPath(); g.moveTo(hs[0][0], hs[0][1]); g.lineTo(hs[1][0], hs[1][1]); g.stroke();
        g.strokeStyle = colH; g.lineWidth = 4; g.beginPath(); g.moveTo(hs[0][0], hs[0][1]); g.lineTo(hs[1][0], hs[1][1]); g.stroke();
      };
      if (s < 0.15) { mower(); handle(); kidLegs(g, S); kidTorso(g, S); kidHead(g, S); kidArms(g, S, hands); }
      else { kidLegs(g, S); kidTorso(g, S); kidHead(g, S); mower(); handle(); kidArms(g, S, hands); }
      if (gas && st.engine) { puffs(g, mc[0] - c * 18, mc[1] - s * 18 - 2, t, 1); }
      status(g, S, base);
    } else {
      /* scythe */
      const sw = st.swing;
      const spec = window.MOW.SCYTHE || { duration: .36, halfArc: .60 };
      const dur = (sw && sw.dur) || spec.duration;
      const half = (sw && sw.half) || spec.halfArc;
      const trim = !!st.trim; // hedge trimmers instead of the scythe
      const ang = sw ? sw.a0 - half + 2 * half * Math.max(0, Math.min(1, sw.t / dur)) : (trim ? h : h + spec.halfArc);
      const fx = sw ? Math.cos(ang) : c, fy = sw ? Math.sin(ang) : s;
      const k = Object.assign({ x: 0, y: 0, dx: c, dy: s }, base);
      shadow(g, 2, 3, 17, 7.5, 0.55);
      const S = kidState(k);
      if (sw) { S.ux += fx * 1.5; }
      const ca = Math.cos(ang), sa = Math.sin(ang), R = Math.max(35, (st.reach || 82) - 4);
      const H0 = [S.ux + ca * 8, S.shY + 21 + sa * 3];
      const H1 = [S.ux + ca * 24, S.shY + 25 + sa * 8];
      const E = [ca * R, sa * R - 2];
      const hands = [H0, H1];
      if (hands[0][0] > hands[1][0]) { hands[0] = H1; hands[1] = H0; }
      if (trim) hands[1] = [H0[0] + ca * 10, H0[1] + sa * 10];
      const dirp = [(E[0] - H0[0]), (E[1] - H0[1])], dl = Math.hypot(dirp[0], dirp[1]);
      const sx0 = H0[0] - dirp[0] / dl * 8, sy0 = H0[1] - dirp[1] / dl * 8;
      const tx = -sa, ty = ca; // tangent (swing direction)
      const scythe = () => {
        if (sw) { // swoosh trail
          const a1 = sw.a0 - half, n = 7;
          for (let i = 0; i < n; i++) {
            const u0 = i / n, u1 = (i + 1) / n, aa = a1 + (ang - a1) * u0, bb = a1 + (ang - a1) * u1;
            g.strokeStyle = 'rgba(255,255,255,' + (0.05 + 0.4 * u1 * u1) + ')'; g.lineWidth = 2.5 + 5 * u1; g.lineCap = 'round';
            g.beginPath(); g.arc(0, -2, R + 1, aa, bb + 0.02); g.stroke();
          }
        }
        limb(g, sx0, sy0, E[0], E[1], 3.4, lin(g, sx0, sy0, E[0], E[1], [[0, '#8a5b2f'], [1, '#c39560']]));
        // blade
        const bx = E[0], by = E[1], rx = ca, ry = sa;
        g.beginPath(); g.moveTo(bx - rx * 1.5, by - ry * 1.5);
        g.quadraticCurveTo(bx + rx * 6 + tx * 14, by + ry * 6 + ty * 14, bx + tx * 27 - rx * 7, by + ty * 27 - ry * 7);
        g.quadraticCurveTo(bx + rx * 0 + tx * 15, by + ry * 0 + ty * 15, bx - rx * 1.5 + tx * 1, by - ry * 1.5 + ty * 1);
        g.closePath();
        fillOut(g, lin(g, bx, by, bx + tx * 27, by + ty * 27, [[0, '#d9e0ea'], [0.5, '#ffffff'], [1, '#aab4c3']]), 1.2);
      };
      /* hedge trimmers: orange motor housing + double-toothed blade, drawn in a frame along the aim */
      const trimmers = () => {
        const u = sw ? Math.max(0, Math.min(1, sw.t / dur)) : 0, shake = sw ? Math.sin(u * 28) * 1.1 : 0;
        g.save(); g.translate(H0[0], H0[1]); g.rotate(ang);
        // blade: long flat bar with teeth on both sides (teeth slide while trimming)
        const bx0 = 12, bl = 46, n = 9;
        for (const side of [-1, 1]) {
          g.beginPath(); g.moveTo(bx0, 0);
          for (let i = 0; i < n; i++) {
            const x = bx0 + bl * i / n + (side > 0 ? shake : -shake), x2 = x + bl / n * .5, x3 = x + bl / n;
            g.lineTo(x, side * 3.2); g.lineTo(x2, side * 7.6); g.lineTo(x3, side * 3.2);
          }
          g.lineTo(bx0 + bl, 0); g.closePath();
          fillOut(g, lin(g, 0, side * -8, 0, side * 8, [[0, '#e9eef5'], [1, '#9aa6b6']]), 1);
        }
        rr(g, bx0, -3.4, bl, 6.8, 2.2); fillOut(g, lin(g, 0, -3.4, 0, 3.4, [[0, '#f3f6fa'], [1, '#b7c0cd']]), 1);
        // guard + housing
        rr(g, bx0 - 4, -8, 5, 16, 2.5); fillOut(g, '#3a3f49', 1);
        rr(g, -9, -7.5, 22, 15, 6); fillOut(g, lin(g, 0, -7.5, 0, 7.5, [[0, '#ffa04d'], [1, '#d9591a']]), 1.3);
        rr(g, -5, -4.5, 9, 9, 3); fillOut(g, 'rgba(70,25,5,.55)', .8);
        g.restore();
        if (sw) { // little trimming flecks
          g.fillStyle = 'rgba(190,240,120,.85)';
          for (let i = 0; i < 4; i++) { const a2 = ang + (i - 1.5) * .09, r2 = 56 + ((u * 40 + i * 9) % 14); g.beginPath(); g.arc(H0[0] + Math.cos(a2) * r2, H0[1] + Math.sin(a2) * r2, 1.3, 0, TAU); g.fill(); }
        }
      };
      const front = sa >= -0.1;
      if (trim) { if (!front) { trimmers(); kidLegs(g, S); kidTorso(g, S); kidHead(g, S); kidArms(g, S, hands); } else { kidLegs(g, S); kidTorso(g, S); kidHead(g, S); trimmers(); kidArms(g, S, hands); } }
      else if (!front) { scythe(); kidLegs(g, S); kidTorso(g, S); kidHead(g, S); kidArms(g, S, hands); }
      else { kidLegs(g, S); kidTorso(g, S); kidHead(g, S); scythe(); kidArms(g, S, hands); }
      status(g, S, base);
    }
    g.restore();
  }

  /* ---------- truck (facing east, centre at 0,0, ~96 x 52) ---------- */
  function drawTruck(g) {
    g.save(); g.lineJoin = 'round'; g.lineCap = 'round';
    rshadow(g, 4, 7, 100, 56, 14, 0, 0.55);
    const wh = (x, y) => wheel(g, x, y, 19, 8.5);
    wh(-30, -27); wh(-30, 27); wh(28, -27); wh(28, 27);
    // bumpers
    rr(g, -52, -20, 6, 40, 3); fillOut(g, '#aab2bf', 1.1);
    rr(g, 46, -21, 6, 42, 3); fillOut(g, '#aab2bf', 1.1);
    // body
    rr(g, -49, -24, 98, 48, 12);
    fillOut(g, lin(g, 0, -24, 0, 24, [[0, '#dcc18a'], [0.5, '#c5a56b'], [1, '#94754e']]), 1.5);
    // bed
    rr(g, -45, -19.5, 50, 39, 5); fillOut(g, lin(g, 0, -20, 0, 20, [[0, '#7a5d36'], [1, '#a88556']]), 1.2);
    g.strokeStyle = 'rgba(60,40,20,.28)'; g.lineWidth = 1; for (let y = -12; y <= 12; y += 8) { g.beginPath(); g.moveTo(-43, y); g.lineTo(3, y); g.stroke(); }
    // fuel can
    rr(g, -41, -14, 22, 26, 5); fillOut(g, lin(g, -41, -14, -19, 12, [[0, '#f26b54'], [1, '#b92c1a']]), 1.3);
    rr(g, -36, -10, 12, 6, 3); fillOut(g, 'rgba(60,15,10,.6)', 0.8);
    ell(g, -22, -9, 3.4, 3.4); fillOut(g, '#ffd23f', 1);
    g.strokeStyle = OUT; g.lineWidth = 4; g.beginPath(); g.moveTo(-22, -9); g.lineTo(-17, -15); g.stroke();
    g.strokeStyle = '#d9dee6'; g.lineWidth = 2; g.beginPath(); g.moveTo(-22, -9); g.lineTo(-17, -15); g.stroke();
    g.fillStyle = '#fff'; g.beginPath(); g.moveTo(-30, 0); g.quadraticCurveTo(-26, 4.5, -30, 8); g.quadraticCurveTo(-34, 4.5, -30, 0); g.fill();
    g.fillStyle = 'rgba(255,247,219,.16)'; rr(g, -39, -12.5, 4, 22, 2); g.fill();
    // hose + nozzle
    g.strokeStyle = OUT; g.lineWidth = 4.4; g.beginPath(); g.moveTo(-19, 4); g.bezierCurveTo(-8, 4, -8, 14, -1, 12); g.stroke();
    g.strokeStyle = '#3a3f4a'; g.lineWidth = 2.4; g.beginPath(); g.moveTo(-19, 4); g.bezierCurveTo(-8, 4, -8, 14, -1, 12); g.stroke();
    rr(g, -3, 9.5, 7, 5, 2); fillOut(g, '#9dbb86', 1);
    // small second can
    rr(g, -17, -16, 9, 9, 3); fillOut(g, '#4aa05c', 1);
    // cab
    rr(g, 6, -22, 36, 44, 11); fillOut(g, lin(g, 6, -22, 42, 22, [[0, '#e5cfa0'], [1, '#b79460']]), 1.4);
    rr(g, 9, -17, 12, 34, 5); fillOut(g, lin(g, 9, 0, 21, 0, [[0, '#e8d6ac'], [1, '#c9ac79']]), 1);  // roof
    rr(g, 22.5, -17, 8, 34, 3); fillOut(g, lin(g, 22, -17, 30, 17, [[0, '#cdeefc'], [1, '#6aa9cf']]), 1.1); // windshield
    rr(g, 6.5, -16, 3, 32, 1.5); fillOut(g, '#6aa9cf', 0.8);
    g.fillStyle = 'rgba(255,255,255,.55)'; g.beginPath(); g.moveTo(24, -15); g.lineTo(27, -15); g.lineTo(25, -1); g.lineTo(23.5, -1); g.fill();
    // hood + grille + lights
    rr(g, 42, -18, 7, 36, 3); fillOut(g, '#bda06c', 1);
    g.fillStyle = '#fff6c8'; for (let s = -1; s <= 1; s += 2) { ell(g, 46.5, s * 14, 2.4, 3); g.fill(); g.strokeStyle = OUT; g.lineWidth = 0.9; g.stroke(); }
    // mirrors
    for (let s = -1; s <= 1; s += 2) { rr(g, 24, s * 24 - 2, 6, 4, 2); fillOut(g, '#94754e', 0.9); }
    // top-left rim light
    g.fillStyle = 'rgba(255,247,219,.18)'; rr(g, -44, -22.5, 86, 2.4, 1.2); g.fill();
    g.restore();
  }

  window.MOW.SpritesPlayer = {
    drawPlayer: drawPlayer,
    drawTruck: drawTruck,
    bounds: { player: { l: -160, t: -165, r: 160, b: 160 }, truck: { l: -62, t: -42, r: 62, b: 48 } }
  };
})();
