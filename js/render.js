/* Lawn Kid — renderer v2: native-resolution, hand-drawn blades.
   Terrain/grass are pre-rendered into small cached tiles at the *exact* on-screen cell size (so they stay razor sharp at any
   zoom / DPR); entities & sprites are drawn as smooth vectors in world units. */
(function () {
  const M = (globalThis.MOW = globalThis.MOW || {});
  const C = M.CELL, T = M.T;
  const TAU = Math.PI * 2;

  function hash(x, y, s) { let h = (x * 374761393 + y * 668265263 + (s || 0) * 982451653) | 0; h = (h ^ (h >>> 13)) * 1274126177 | 0; return ((h ^ (h >>> 16)) >>> 0) / 4294967295; }
  function rngf(seed) { let s = ((seed * 2654435761) >>> 0) || 1; return () => { s ^= s << 13; s >>>= 0; s ^= s >>> 17; s ^= s << 5; s >>>= 0; return s / 4294967296; }; }
  function vnoise(x, y) { // smooth value noise
    const xi = Math.floor(x), yi = Math.floor(y), xf = x - xi, yf = y - yi;
    const u = xf * xf * (3 - 2 * xf), v = yf * yf * (3 - 2 * yf);
    const a = hash(xi, yi, 77), b = hash(xi + 1, yi, 77), c = hash(xi, yi + 1, 77), d = hash(xi + 1, yi + 1, 77);
    return a + (b - a) * u + (c - a) * v + (a - b - c + d) * u * v;
  }

  const K = { WILD: 0, FENCE: 1, HEDGEB: 2, PATH: 3, ROOF: 4, WALL: 5, WATER: 6, WATERE: 7, SAND: 8, TREEB: 9, HEDGEI: 10, GRASS: 11 };

  /* ---------------- tile cache ---------------- */
  let P = 0, U = 1;
  const tiles = new Map(), partialGrass = new Map();
  function setScale(u) { const p = Math.max(10, Math.round(C * u)); if (p !== P) { P = p; tiles.clear(); partialGrass.clear(); } U = u; }
  function getTile(key, mk) { let t = tiles.get(key); if (!t) { t = mk(); tiles.set(key, t); } return t; }
  function canvas(w, h) { const c = document.createElement('canvas'); c.width = Math.ceil(w); c.height = Math.ceil(h); return c; }
  function rr(g, x, y, w, h, r) { r = Math.min(r, w / 2, h / 2); g.beginPath(); g.moveTo(x + r, y); g.arcTo(x + w, y, x + w, y + h, r); g.arcTo(x + w, y + h, x, y + h, r); g.arcTo(x, y + h, x, y, r); g.arcTo(x, y, x + w, y, r); g.closePath(); }
  function lin(g, x0, y0, x1, y1, stops) { const gr = g.createLinearGradient(x0, y0, x1, y1); stops.forEach((s) => gr.addColorStop(s[0], s[1])); return gr; }

  /* a single tapered, curved blade (used for tiles AND sprites) */
  function blade(g, bx, by, hgt, lean, w, c0, c1, c2) {
    g.fillStyle = lin(g, bx, by, bx + lean, by - hgt, [[0, c0], [0.6, c1], [1, c2]]);
    g.beginPath(); g.moveTo(bx - w, by);
    g.quadraticCurveTo(bx + lean * 0.2, by - hgt * 0.6, bx + lean, by - hgt);
    g.quadraticCurveTo(bx + lean * 0.5 + w * 0.4, by - hgt * 0.5, bx + w, by);
    g.closePath(); g.fill();
  }

  /* ---------------- grass tiles ---------------- */
  function grassTile(thick, v, pattern) {
    const k = P, m = Math.ceil(0.42 * k), tp = Math.ceil(0.8 * k), bt = Math.ceil(0.12 * k);
    const c = canvas(k + 2 * m, k + tp + bt), g = c.getContext('2d'), r = rngf(v * 977 + (thick ? 7 : 3));
    c._m = m; c._t = tp;
    const ox = m, oy = tp;
    const rows=pattern?Array.from({length:M.GRASS_SUBDIV},(_,i)=>parseInt(pattern.slice(i*2,i*2+2),16)):null;
    g.save();
    if(rows){g.beginPath();const d=k/M.GRASS_SUBDIV;for(let y=0;y<rows.length;y++)for(let x=0;x<M.GRASS_SUBDIV;x++)if(rows[y]&(1<<x))g.rect(ox+x*d,oy+y*d,d+.3,d+.3);g.clip();}
    g.fillStyle = thick ? '#1c5226' : '#296d31'; g.fillRect(ox, oy, k, k);
    g.fillStyle = lin(g, 0, oy, 0, oy + k, [[0, 'rgba(0,0,0,0)'], [1, 'rgba(5,30,10,.28)']]); g.fillRect(ox, oy, k, k);
    g.restore();
    const n = thick ? 38 : 25, arr = [];
    for (let i = 0; i < n; i++) arr.push({ bx: ox + (r() * 1.25 - 0.12) * k, by: oy + (0.1 + r() * 0.95) * k, h: ((thick ? 0.6 : 0.44) + r() * 0.26) * k, l: (r() - 0.5) * 0.36 * k, w: (0.048 + r() * 0.034) * k, t: r(), gold: r() > 0.95 });
    arr.sort((a, b) => a.by - b.by);
    for (const b of arr) {
      if(rows){const x=Math.floor((b.bx-ox)/k*M.GRASS_SUBDIV),y=Math.floor((b.by-oy)/k*M.GRASS_SUBDIV);if(x<0||y<0||x>=M.GRASS_SUBDIV||y>=M.GRASS_SUBDIV||!(rows[y]&(1<<x)))continue;}
      const tip = b.gold ? '#c3d467' : b.t > 0.5 ? (thick ? '#74c960' : '#82d66b') : (thick ? '#4aa84f' : '#5bbb5a');
      blade(g, b.bx, b.by, b.h, b.l, b.w, thick ? '#17441f' : '#226329', thick ? '#2f8239' : '#3f9a45', tip);
    }
    if (thick && !pattern) for (let i = 0; i < 3; i++) if (r() > 0.45) { g.fillStyle = r() > 0.5 ? '#f6ecaa' : '#ffffff'; g.beginPath(); g.arc(ox + r() * k, oy + (0.1 + r() * 0.5) * k, 0.028 * k, 0, TAU); g.fill(); }
    return c;
  }
  function cutTile(d, v) {
    const k = P, c = canvas(k, k), g = c.getContext('2d'), r = rngf(131 + d * 17);
    const light = M.stripeLight(d);
    g.fillStyle = light ? M.MOWN_COLORS.light : M.MOWN_COLORS.dark;
    g.fillRect(0, 0, k, k);
    const horiz = d === 1 || d === 2;
    g.lineWidth = Math.max(1, k * 0.018); g.lineCap = 'round';
    for (let i = 0; i < 20; i++) {
      const x = r() * k, y = r() * k, l = (0.07 + r() * 0.1) * k, a = (horiz ? 0 : Math.PI / 2) + (r() - 0.5) * 0.5;
      g.strokeStyle = r() > 0.5 ? (light ? 'rgba(200,255,150,.38)' : 'rgba(210,255,160,.22)') : (light ? 'rgba(40,120,40,.14)' : 'rgba(30,100,35,.22)');
      g.beginPath(); g.moveTo(x, y); g.lineTo(x + Math.cos(a) * l, y + Math.sin(a) * l); g.stroke();
    }
    return c;
  }

  function drawMownTile(g, s, i, x, y, w, h, tileForDirection) {
    const groups = M.Sim.stripePatterns(s, i), N = M.GRASS_SUBDIV;
    g.drawImage(tileForDirection(groups[0]?.direction || M.Sim.DIR.N), x, y, w, h);
    for (const group of groups.slice(1)) {
      g.save(); g.beginPath();
      for (let row = 0; row < N; row++) {
        const bits = parseInt(group.pattern.slice(row * 2, row * 2 + 2), 16);
        for (let col = 0; col < N; col++) if (bits & (1 << col)) g.rect(x + col * w / N, y + row * h / N, w / N + .15, h / N + .15);
      }
      g.clip(); g.drawImage(tileForDirection(group.direction), x, y, w, h); g.restore();
    }
  }

  /* ---------------- terrain tiles ---------------- */
  function terrainTile(kind, v) {
    const k = P, c = canvas(k, k), g = c.getContext('2d'), r = rngf(v * 313 + kind * 59);
    const SB = M.SpritesBuild, SN = M.SpritesNature;
    if (SB || SN) {
      let done = true;
      switch (kind) {
        case K.WILD: if (SB) SB.wild(g, k, { v: v & 7 }); else done = false; break;
        case K.FENCE: if (SB) SB.fence(g, k, { v: v & 7 }); else done = false; break;
        case K.HEDGEB: if (SB) SB.hedge(g, k, { v: v & 7, inner: false }); else done = false; break;
        case K.HEDGEI: if (SB) SB.hedge(g, k, { v: v & 7, inner: true }); else done = false; break;
        case K.PATH: if (SB) SB.path(g, k, { v: v & 7, mask: v >> 3 }); else done = false; break;
        case K.ROOF: if (SB) SB.roof(g, k, { v: v & 7 }); else done = false; break;
        case K.WALL: if (SB) SB.wall(g, k, { v: v & 7 }); else done = false; break;
        case K.SAND: if (SB) SB.sand(g, k, { v: v & 7 }); else done = false; break;
        case K.TREEB: { g.drawImage(cutTile(1, v & 3), 0, 0); const root=g.createRadialGradient(k*.5,k*.55,0,k*.5,k*.55,k*.43); root.addColorStop(0,'rgba(82,60,34,.8)'); root.addColorStop(1,'rgba(82,60,34,0)');g.fillStyle=root;g.fillRect(0,0,k,k);break; }
        case K.WATER: case K.WATERE: if (SN) SN.waterTile(g, k, { mask: v >> 2, v: v & 3 }); else done = false; break;
        default: done = false;
      }
      if (done) return c;
    }
    switch (kind) {
      case K.WILD: {
        g.fillStyle = '#244f36'; g.fillRect(0, 0, k, k);
        for (let i = 0; i < 14; i++) blade(g, r() * k, (0.3 + r() * 0.7) * k, (0.25 + r() * 0.3) * k, (r() - 0.5) * 0.2 * k, 0.04 * k, '#1d4530', '#2d6844', '#3c8052');
        break;
      }
      case K.FENCE: {
        g.fillStyle = '#244f36'; g.fillRect(0, 0, k, k);
        g.fillStyle = 'rgba(0,0,0,.28)'; g.fillRect(0, k * 0.82, k, k * 0.14);
        g.fillStyle = '#a2773f'; g.fillRect(0, k * 0.3, k, k * 0.1); g.fillRect(0, k * 0.62, k, k * 0.1);
        const bw = k * 0.28, gap = k * 0.05;
        for (let i = 0; i < 3; i++) {
          const x = i * (bw + gap) + gap * 0.5, top = k * (0.08 + r() * 0.05);
          g.fillStyle = lin(g, x, 0, x + bw, 0, [[0, '#fbe9c2'], [0.5, '#ecd3a0'], [1, '#c9a56c']]);
          g.beginPath(); g.moveTo(x, k * 0.88); g.lineTo(x, top + bw * 0.5); g.lineTo(x + bw / 2, top); g.lineTo(x + bw, top + bw * 0.5); g.lineTo(x + bw, k * 0.88); g.closePath(); g.fill();
          g.strokeStyle = 'rgba(110,75,35,.35)'; g.lineWidth = Math.max(1, k * 0.015); g.stroke();
          g.fillStyle = 'rgba(120,80,40,.5)'; g.fillRect(x + bw * 0.5 - 0.5, k * 0.33, 1.2, 1.2); g.fillRect(x + bw * 0.5 - 0.5, k * 0.65, 1.2, 1.2);
        }
        break;
      }
      case K.HEDGEB: case K.HEDGEI: {
        const inner = kind === K.HEDGEI;
        g.fillStyle = inner ? '#2a6a33' : '#1f4f2a'; g.fillRect(0, 0, k, k);
        const cols = ['#2d7237', '#3a8844', '#4a9c52', '#2a6a33', '#5fb35e'];
        for (let i = 0; i < 46; i++) {
          const x = r() * k, y = r() * k, rad = (0.07 + r() * 0.1) * k, col = cols[(r() * 5) | 0];
          const gr = g.createRadialGradient(x - rad * 0.3, y - rad * 0.35, rad * 0.1, x, y, rad); gr.addColorStop(0, '#6fc26a'); gr.addColorStop(0.35, col); gr.addColorStop(1, '#1d4a27');
          g.fillStyle = gr; g.beginPath(); g.arc(x, y, rad, 0, TAU); g.fill();
        }
        g.fillStyle = lin(g, 0, 0, 0, k, [[0, 'rgba(255,255,200,.10)'], [0.5, 'rgba(0,0,0,0)'], [1, 'rgba(0,25,10,.35)']]); g.fillRect(0, 0, k, k);
        break;
      }
      case K.PATH: {
        g.fillStyle = '#b5a07a'; g.fillRect(0, 0, k, k);
        const par = v >= 4 ? 1 : 0;
        for (let row = 0; row < 2; row++) {
          const off = ((row + par) % 2) * 0.25;
          for (let i = -1; i < 3; i++) {
            const x = (i * 0.5 + off) * k + k * 0.02, y = row * 0.5 * k + k * 0.02, w = k * 0.46, h = k * 0.46;
            const tint = (r() - 0.5) * 18;
            g.fillStyle = lin(g, x, y, x + w, y + h, [[0, `rgb(${232 + tint | 0},${218 + tint | 0},${184 + tint | 0})`], [1, `rgb(${204 + tint | 0},${188 + tint | 0},${152 + tint | 0})`]]);
            rr(g, x, y, w, h, k * 0.07); g.fill();
            g.fillStyle = 'rgba(255,255,240,.35)'; g.fillRect(x + k * 0.03, y + k * 0.02, w * 0.5, k * 0.02);
          }
        }
        for (let i = 0; i < 6; i++) { g.fillStyle = 'rgba(120,100,70,.25)'; g.fillRect(r() * k, r() * k, 1.5, 1.5); }
        break;
      }
      case K.ROOF: case K.WALL: {
        const wall = kind === K.WALL, roofH = wall ? 0.58 : 1;
        g.fillStyle = '#b25038'; g.fillRect(0, 0, k, k);
        const rows = 4, rh = (k * roofH) / rows;
        for (let row = 0; row < rows; row++) {
          const off = (row % 2) * 0.125;
          for (let i = -1; i < 4; i++) {
            const x = (i * 0.25 + off) * k, y = row * rh, w = k * 0.25, tint = (r() - 0.5) * 22;
            g.fillStyle = lin(g, x, y, x, y + rh * 1.15, [[0, `rgb(${196 + tint | 0},${104 + tint | 0},${78 + tint | 0})`], [1, `rgb(${160 + tint | 0},${68 + tint | 0},${50 + tint | 0})`]]);
            rr(g, x + 0.5, y, w - 1, rh * 1.1, k * 0.05); g.fill();
            g.fillStyle = 'rgba(70,25,15,.35)'; g.fillRect(x + 1, y + rh * 0.95, w - 2, 1.5);
          }
        }
        if (wall) {
          const wy = k * roofH;
          g.fillStyle = 'rgba(0,0,0,.35)'; g.fillRect(0, wy - 1, k, k * 0.07);
          g.fillStyle = lin(g, 0, wy, 0, k, [[0, '#f3e8d0'], [1, '#e0d2b2']]); g.fillRect(0, wy + k * 0.05, k, k - wy);
          if (v % 3 === 0) { g.fillStyle = '#5b4a35'; rr(g, k * 0.22, wy + k * 0.1, k * 0.56, k * 0.27, k * 0.03); g.fill(); g.fillStyle = lin(g, 0, wy, 0, k, [[0, '#a8d8f0'], [1, '#6aa9cf']]); g.fillRect(k * 0.26, wy + k * 0.13, k * 0.48, k * 0.2); g.fillStyle = 'rgba(255,255,255,.5)'; g.fillRect(k * 0.28, wy + k * 0.15, k * 0.14, k * 0.04); }
        }
        break;
      }
      case K.WATER: case K.WATERE: {
        g.fillStyle = lin(g, 0, 0, k, k, [[0, kind === K.WATERE ? '#69c4e8' : '#52b2dc'], [1, kind === K.WATERE ? '#4aa9d6' : '#3b94c4']]); g.fillRect(0, 0, k, k);
        g.strokeStyle = 'rgba(255,255,255,.18)'; g.lineWidth = Math.max(1, k * 0.02);
        for (let i = 0; i < 3; i++) { const y = r() * k, x = r() * k * 0.6; g.beginPath(); g.moveTo(x, y); g.quadraticCurveTo(x + k * 0.15, y - k * 0.05, x + k * 0.3, y); g.stroke(); }
        break;
      }
      case K.SAND: {
        g.fillStyle = '#ecd9a0'; g.fillRect(0, 0, k, k);
        g.strokeStyle = 'rgba(190,160,100,.28)'; g.lineWidth = Math.max(1, k * 0.02);
        for (let i = 0; i < 3; i++) { const y = (0.15 + i * 0.32) * k; g.beginPath(); g.moveTo(0, y); g.quadraticCurveTo(k * 0.3, y - k * 0.06, k * 0.6, y + k * 0.02); g.quadraticCurveTo(k * 0.8, y + k * 0.05, k, y); g.stroke(); }
        for (let i = 0; i < 16; i++) { g.fillStyle = r() > 0.5 ? '#f8eec4' : '#cdb77c'; g.fillRect(r() * k, r() * k, Math.max(1, k * 0.025), Math.max(1, k * 0.025)); }
        break;
      }
      case K.TREEB: {
        g.fillStyle = '#3f7d33'; g.fillRect(0, 0, k, k);
        for (let i = 0; i < 18; i++) { g.fillStyle = ['#336a2b', '#55954a', '#7a6a3a', '#2c5a28'][(r() * 4) | 0]; g.save(); g.translate(r() * k, r() * k); g.rotate(r() * 3); g.beginPath(); g.ellipse(0, 0, k * 0.07, k * 0.03, 0, 0, TAU); g.fill(); g.restore(); }
        break;
      }
    }
    return c;
  }

  /* ---------------- bake per-level static data ---------------- */
  function bake(s) {
    const n = s.W * s.H, at = (x, y) => (x < 0 || y < 0 || x >= s.W || y >= s.H ? 0 : s.type[y * s.W + x]);
    s.kind = new Uint8Array(n); s.vr = new Uint8Array(n); s.tint = new Int8Array(n);
    const hedge = s.lv.def.fence === 'hedge';
    for (let y = 0; y < s.H; y++) for (let x = 0; x < s.W; x++) {
      const i = y * s.W + x, t = s.type[i]; let kd = K.WILD;
      switch (t) {
        case T.VOID: { let near = false; for (let dy = -1; dy <= 1 && !near; dy++) for (let dx = -1; dx <= 1; dx++) if (at(x + dx, y + dy) !== T.VOID) { near = true; break; } kd = near && hedge ? K.HEDGEB : K.WILD; break; }
        case T.GRASS: kd = K.GRASS; break;
        case T.PATH: kd = K.PATH; break;
        case T.HOUSE: kd = at(x, y + 1) === T.HOUSE ? K.ROOF : K.WALL; break;
        case T.WATER: kd = (at(x + 1, y) !== T.WATER || at(x - 1, y) !== T.WATER || at(x, y + 1) !== T.WATER || at(x, y - 1) !== T.WATER) ? K.WATERE : K.WATER; break;
        case T.SAND: kd = K.SAND; break;
        case T.TREE: kd = K.TREEB; break;
        case T.HEDGE: kd = K.HEDGEI; break;
      }
      s.kind[i] = kd;
      s.vr[i] = kd === K.PATH ? ((hash(x, y, 5) * 4) | 0) + (y & 1) * 4 : (hash(x, y, 5) * 8) | 0;
      if (kd === K.WALL && s.vr[i] === 3 && (x * 7 + y) % 9 !== 0) s.vr[i] = 1; // doors sparingly
      if (kd === K.WATER || kd === K.WATERE) {
        const land = (xx, yy) => (at(xx, yy) === T.WATER ? 0 : 1);
        const mask = land(x, y - 1) | (land(x + 1, y) << 1) | (land(x, y + 1) << 2) | (land(x - 1, y) << 3);
        s.vr[i] = (mask << 2) | ((hash(x, y, 5) * 4) | 0);
      }
      const nv = vnoise(x * 0.16, y * 0.16) * 0.65 + vnoise(x * 0.5, y * 0.5) * 0.35;
      s.tint[i] = Math.round((nv - 0.5) * 40);
    }
    // Trace every exposed lawn edge, then merge collinear spans. This keeps
    // fences continuous on rectangles, notches and curved / stepped lawns.
    s.fences = [];
    if (!hedge) {
      const occupied = (x, y) => at(x, y) !== T.VOID;
      for (let y = 0; y <= s.H; y++) for (const south of [false, true]) {
        let start = -1;
        for (let x = 0; x <= s.W; x++) {
          const edge = x < s.W && (south ? occupied(x, y - 1) && at(x, y - 1) !== T.PATH && !occupied(x, y) : occupied(x, y) && at(x, y) !== T.PATH && !occupied(x, y - 1));
          if (edge && start < 0) start = x;
          if (!edge && start >= 0) { s.fences.push({ x: start, y, length: x - start, vertical: false }); start = -1; }
        }
      }
      for (let x = 0; x <= s.W; x++) for (const east of [false, true]) {
        let start = -1;
        for (let y = 0; y <= s.H; y++) {
          const edge = y < s.H && (east ? occupied(x - 1, y) && at(x - 1, y) !== T.PATH && !occupied(x, y) : occupied(x, y) && at(x, y) !== T.PATH && !occupied(x - 1, y));
          if (edge && start < 0) start = y;
          if (!edge && start >= 0) { s.fences.push({ x, y: start, length: y - start, vertical: true }); start = -1; }
        }
      }
    }
    for (let y = 0; y < s.H; y++) for (let x = 0; x < s.W; x++) {
      const i = y * s.W + x;
      if (s.kind[i] !== K.PATH) continue;
      const mask = (at(x, y - 1) !== T.PATH ? 1 : 0) | (at(x + 1, y) !== T.PATH ? 2 : 0) | (at(x, y + 1) !== T.PATH ? 4 : 0) | (at(x - 1, y) !== T.PATH ? 8 : 0);
      s.vr[i] = (s.vr[i] & 7) | (mask << 3);
    }
    s.bake = true; s.dirty.length = 0;
  }


  /* cached sprite from a design-unit drawing (1 cell = 48 design px); b = bounds {l,t,r,b} */
  function cachedSprite(key, b, fn) {
    return getTile(key, () => {
      const f = (C / 48) * U, w = Math.ceil((b.r - b.l) * f), h = Math.ceil((b.b - b.t) * f), c = canvas(w, h), g = c.getContext('2d');
      g.scale(f, f); g.translate(-b.l, -b.t); fn(g); c._b = b; return c;
    });
  }
  function blit(g, c, x, y, sx) {
    const b = c._b, f = C / 48; g.drawImage(c, x + b.l * f, y + b.t * f, (b.r - b.l) * f, (b.b - b.t) * f);
  }

  /* ---------------- sprites (world units; 1 cell = 8) ---------------- */
  function shadow(g, x, y, rx, ry, a) {
    const gr = g.createRadialGradient(x, y, 0, x, y, rx);
    gr.addColorStop(0, 'rgba(8,35,18,' + (a || 0.34) + ')'); gr.addColorStop(0.7, 'rgba(8,35,18,' + (a || 0.34) * 0.6 + ')'); gr.addColorStop(1, 'rgba(8,35,18,0)');
    g.save(); g.translate(0, y); g.scale(1, ry / rx); g.translate(0, -y); g.fillStyle = gr; g.beginPath(); g.arc(x, y, rx, 0, TAU); g.fill(); g.restore();
  }
  function tuft(g, x, y, n, seed, h) { // little grass blades hugging an object's base
    for (let i = 0; i < n; i++) { const a = hash(seed, i, 1), b = hash(seed, i, 2); blade(g, x + (a - 0.5) * 7, y + (b - 0.3) * 2, (h || 2.8) + b * 1.6, (a - 0.5) * 1.6, 0.34, '#1f5c28', '#3f9a45', '#7fd468'); }
  }

  const PETALS = [
    { p: ['#ffffff', '#e8eef5'], c: '#f5c518', n: 9, l: 1.15, w: 0.34 },        // daisy
    { p: ['#ff7a6b', '#d94438'], c: '#7a1f1f', n: 6, l: 1.05, w: 0.7, cup: 1 },  // tulip/poppy
    { p: ['#c4a4ff', '#8a63e0'], c: '#ffe27a', n: 8, l: 1.1, w: 0.42 },         // aster
    { p: ['#ffe45a', '#f2a91c'], c: '#6b3d12', n: 12, l: 1.2, w: 0.36 },        // sunflower
  ];
  function drawFlower(g, e, t) {
    const X = e.x * C, Y = e.y * C, st = PETALS[e.color % 4];
    const stems = [], ex = (e.vr || 0) * 13 + 3, ey = (e.vr || 0) * 7 + 1;
    for (let i = 0; i < 4; i++) stems.push({ x: X + (hash(ex, ey, i + 1) - 0.5) * 6.4, y: Y + (hash(ex, ey, i + 9) - 0.2) * 3.2, h: 3.6 + hash(ex, ey, i + 20) * 2.4, l: (hash(ex, ey, i + 30) - 0.5) * 2.4 });
    stems.sort((a, b) => a.y - b.y);
    for (const s of stems) {
      const sway = Math.sin(t * 1.7 + s.x * 0.8) * 0.45;
      blade(g, s.x, s.y, 1.9, -1.4, 0.34, '#1b5a25', '#2f8a3a', '#5cbf5c'); blade(g, s.x, s.y, 1.6, 1.3, 0.3, '#1b5a25', '#2f8a3a', '#5cbf5c');
      const hx = s.x + s.l + sway, hy = s.y - s.h;
      g.strokeStyle = lin(g, s.x, s.y, hx, hy, [[0, '#1d5f28'], [1, '#4ab253']]); g.lineWidth = 0.36; g.lineCap = 'round';
      g.beginPath(); g.moveTo(s.x, s.y); g.quadraticCurveTo(s.x + s.l * 0.1, s.y - s.h * 0.6, hx, hy); g.stroke();
      g.save(); g.translate(hx, hy);
      if (st.cup) {
        g.fillStyle = lin(g, 0, -1.4, 0, 1, [[0, st.p[0]], [1, st.p[1]]]);
        g.beginPath(); g.moveTo(-1.05, 0.9); g.quadraticCurveTo(-1.35, -0.8, -0.8, -1.5); g.lineTo(-0.35, -0.6); g.lineTo(0, -1.7); g.lineTo(0.35, -0.6); g.lineTo(0.8, -1.5); g.quadraticCurveTo(1.35, -0.8, 1.05, 0.9); g.quadraticCurveTo(0, 1.6, -1.05, 0.9); g.fill();
      } else {
        for (let i = 0; i < st.n; i++) {
          g.save(); g.rotate((i / st.n) * TAU + s.x); g.fillStyle = lin(g, 0, 0, st.l, 0, [[0, st.p[1]], [1, st.p[0]]]);
          g.beginPath(); g.ellipse(st.l * 0.62, 0, st.l * 0.5, st.w, 0, 0, TAU); g.fill(); g.restore();
        }
        const gr = g.createRadialGradient(-0.15, -0.15, 0.05, 0, 0, 0.62); gr.addColorStop(0, '#fff3a0'); gr.addColorStop(1, st.c); g.fillStyle = gr; g.beginPath(); g.arc(0, 0, 0.58, 0, TAU); g.fill();
      }
      g.restore();
    }
  }

  // flowers are cached to a sprite per (colour, variant) at the current scale; sway is a cheap skew
  function drawFlowerCached(g, e, t) {
    if (e.stems) {
      for (const stem of e.stems) {
        g.save(); g.translate(stem.x * C, stem.y * C); g.scale(M.FLOWER_SCALE, M.FLOWER_SCALE);
        if (stem.clipped) { g.fillStyle = '#73925b'; g.fillRect(-.4, -.7, .8, 1); }
        else drawFlowerCached(g, { x: 0, y: 0, color: e.color }, t + stem.x);
        g.restore();
      }
      return;
    }
    const SN = M.SpritesNature;
    if (SN) {
      const vr = (((e.x * 7 + e.y * 3) | 0) % 3 + 3) % 3, col = e.color % 4;
      const spr = cachedSprite('nf' + col + '_' + vr, SN.bounds.flower, (cg) => SN.flower(cg, 0, 0, { kind: col, v: vr }));
      const sw = Math.sin(t * 1.5 + e.x * 1.7) * 0.05;
      g.save(); g.translate(e.x * C, e.y * C + 1.5); g.transform(1, 0, sw, 1, 0, 0); blit(g, spr, 0, 0); g.restore();
      return;
    }
    const vr = (((e.x * 7 + e.y * 3) | 0) % 3 + 3) % 3, col = e.color % 4;
    const spr = getTile('fl' + col + '_' + vr, () => {
      const w = Math.ceil(14 * U), h = Math.ceil(14 * U), c = canvas(w, h), cg = c.getContext('2d');
      cg.scale(U, U); drawFlower(cg, { x: 7 / C, y: 10 / C, color: col, vr }, 0); return c;
    });
    const sw = Math.sin(t * 1.5 + e.x * 1.7) * 0.05;
    g.save(); g.translate(e.x * C, e.y * C); g.transform(1, 0, sw, 1, 0, 0); g.drawImage(spr, -7, -10, 14, 14); g.restore();
  }

  function drawRock(g, e) {
    const SN = M.SpritesNature;
    if (SN) { const spr = cachedSprite('nr' + ((e.seed || 0) % 5), SN.bounds.rock, (cg) => SN.rock(cg, 0, 0, { seed: e.seed || 0 })); blit(g, spr, e.x * C, e.y * C + 1.5); return; }
    const X = e.x * C, Y = e.y * C, r = rngf((e.seed || 1) * 91 + 5);
    shadow(g, X + 0.8, Y + 2.4, 4.8, 2.2, 0.38);
    const pts = []; for (let i = 0; i < 9; i++) { const a = (i / 9) * TAU, rad = 3.1 + r() * 0.9; pts.push([X + Math.cos(a) * rad * 1.15, Y + 0.4 + Math.sin(a) * rad * 0.82]); }
    g.beginPath(); pts.forEach((p, i) => (i ? g.lineTo(p[0], p[1]) : g.moveTo(p[0], p[1]))); g.closePath();
    const gr = g.createRadialGradient(X - 1.3, Y - 1.5, 0.4, X, Y, 4.6); gr.addColorStop(0, '#d2d6dd'); gr.addColorStop(0.55, '#9ca2ad'); gr.addColorStop(1, '#5d626d');
    g.fillStyle = gr; g.fill();
    g.fillStyle = 'rgba(255,255,255,.55)'; g.beginPath(); g.ellipse(X - 1.1, Y - 1.4, 1.2, 0.55, -0.5, 0, TAU); g.fill();
    g.fillStyle = 'rgba(80,140,60,.55)'; g.beginPath(); g.ellipse(X + 1.2, Y + 1.3, 1.2, 0.6, 0.2, 0, TAU); g.fill();
    tuft(g, X, Y + 2.3, 7, (e.seed || 1) * 7, 2.6);
  }

  function drawGnome(g, e, t) {
    const SN = M.SpritesNature;
    if (SN) {
      const spr = cachedSprite('ng' + (e.found ? 1 : 0), SN.bounds.gnome, (cg) => SN.gnome(cg, 0, 0, { found: !!e.found }));
      blit(g, spr, e.x * C, e.y * C + 2 - (e.found ? Math.abs(Math.sin(t * 7)) * 2.6 : 0)); return;
    }
    const X = e.x * C; let Y = e.y * C;
    if (e.found) Y -= Math.abs(Math.sin(t * 7)) * 2.6;
    shadow(g, X, e.y * C + 2.6, 3.4, 1.4, e.found ? 0.25 : 0.2);
    g.fillStyle = '#5a3a1e'; rr(g, X - 2, Y + 1.2, 1.8, 1.2, 0.5); g.fill(); rr(g, X + 0.2, Y + 1.2, 1.8, 1.2, 0.5); g.fill();
    g.fillStyle = lin(g, X - 2.4, 0, X + 2.4, 0, [[0, '#4a82d8'], [1, '#2d5ba8']]); g.beginPath(); g.moveTo(X - 2.5, Y + 1.6); g.quadraticCurveTo(X - 2.8, Y - 1.8, X, Y - 2.2); g.quadraticCurveTo(X + 2.8, Y - 1.8, X + 2.5, Y + 1.6); g.closePath(); g.fill();
    g.fillStyle = '#7a4a1e'; g.fillRect(X - 2.4, Y + 0.2, 4.8, 0.45);
    g.fillStyle = lin(g, 0, Y - 3, 0, Y + 0.5, [[0, '#ffffff'], [1, '#d9dde4']]); g.beginPath(); g.moveTo(X - 1.8, Y - 2.8); g.quadraticCurveTo(X, Y + 1.2, X + 1.8, Y - 2.8); g.quadraticCurveTo(X, Y - 3.6, X - 1.8, Y - 2.8); g.fill();
    g.fillStyle = '#f2b49a'; g.beginPath(); g.arc(X, Y - 3.2, 0.55, 0, TAU); g.fill();
    g.fillStyle = lin(g, X - 2, 0, X + 2, 0, [[0, '#f0524a'], [1, '#b82a26']]); g.beginPath(); g.moveTo(X - 2, Y - 3.6); g.quadraticCurveTo(X - 0.6, Y - 6, X + 0.4, Y - 8.6); g.quadraticCurveTo(X + 1.2, Y - 6, X + 2, Y - 3.6); g.closePath(); g.fill();
    if (!e.found) tuft(g, X, e.y * C + 2.8, 6, 13 + (e.x | 0), 3.4);
  }

  function drawToy(g, e) {
    const SN = M.SpritesNature;
    if (SN) { const spr = cachedSprite('nt' + (e.kind % 3), SN.bounds.toy, (cg) => SN.toy(cg, 0, 0, { kind: e.kind % 3 })); blit(g, spr, e.x * C, e.y * C + 1.5); return; }
    const X = e.x * C, Y = e.y * C;
    shadow(g, X + 0.8, Y + 1.8, 3, 1.2, 0.25);
    if (e.kind === 0) {
      const gr = g.createRadialGradient(X - 0.9, Y - 1, 0.2, X, Y, 2.5); gr.addColorStop(0, '#ff9a8a'); gr.addColorStop(1, '#d8362c'); g.fillStyle = gr; g.beginPath(); g.arc(X, Y, 2.4, 0, TAU); g.fill();
      g.strokeStyle = '#fff'; g.lineWidth = 0.55; g.beginPath(); g.arc(X, Y, 2.4, 0.4, 2.4); g.stroke(); g.fillStyle = '#3e7fc4'; g.beginPath(); g.arc(X + 0.6, Y + 0.4, 0.55, 0, TAU); g.fill();
    } else if (e.kind === 1) {
      g.fillStyle = lin(g, 0, Y - 1, 0, Y + 1.5, [[0, '#ffe27a'], [1, '#e8a317']]); g.beginPath(); g.ellipse(X, Y, 3.1, 1.7, -0.2, 0, TAU); g.fill();
      g.strokeStyle = 'rgba(255,255,255,.7)'; g.lineWidth = 0.3; g.beginPath(); g.ellipse(X, Y - 0.1, 1.9, 0.9, -0.2, 0, TAU); g.stroke();
    } else {
      g.strokeStyle = '#7a4d22'; g.lineWidth = 0.8; g.lineCap = 'round'; g.beginPath(); g.moveTo(X - 3.2, Y + 0.8); g.lineTo(X + 3.2, Y - 0.8); g.stroke();
      g.lineWidth = 0.5; g.beginPath(); g.moveTo(X + 0.4, Y + 0.05); g.lineTo(X + 1.8, Y - 1.9); g.stroke();
    }
  }

  function drawSprinkler(g, e, t) {
    const X = e.x * C, Y = e.y * C;
    g.fillStyle = lin(g, 0, Y - 1, 0, Y + 1, [[0, '#cfd6df'], [1, '#6c7480']]); rr(g, X - 1, Y - 0.9, 2, 1.9, 0.5); g.fill();
    if (e.on) {
      g.fillStyle = 'rgba(120,200,255,.10)'; g.beginPath(); g.arc(X, Y, 3.4 * C, 0, TAU); g.fill();
      for (let k = 0; k < 14; k++) {
        const a = t * 4.5 + k * 0.45, rd = 5 + (((k * 5) + Math.floor(t * 9)) % 17), x = X + Math.cos(a) * rd, y = Y + Math.sin(a) * rd;
        g.fillStyle = 'rgba(215,242,255,.75)'; g.beginPath(); g.arc(x, y, 0.45, 0, TAU); g.fill();
      }
    }
  }

  // trees: cached sprite per (size, variant); sway = skew about the trunk base
  function drawTreeCached(g, e, t, s) {
    const SN = M.SpritesNature;
    if (SN) {
      const big = e.size === 2, sd = ((e.x * 3 + e.y * 5) | 0) % 4;
      const spr = cachedSprite('nT' + (big ? 2 : 1) + '_' + sd, big ? SN.bounds.tree2 : SN.bounds.tree1, (cg) => SN.tree(cg, 0, 0, { size: big ? 2 : 1, seed: sd }));
      const sw = Math.sin(t * 0.8 + e.seed) * 0.012;
      g.save(); if(s&&Math.hypot(s.p.x-e.x,s.p.y-e.y)<(e.size===2?5:3.3)&&s.p.y<e.y+1.3)g.globalAlpha*=.35; g.translate(e.x * C, e.y * C + 2); g.transform(1, 0, sw, 1, 0, 0); blit(g, spr, 0, 0); g.restore();
      return;
    }
    const big = e.size === 2, sd = ((e.x * 3 + e.y * 5) | 0) % 4, key = 'tr' + (big ? 2 : 1) + '_' + e.seed + '_' + sd;
    const W = big ? 90 : 48, H = big ? 76 : 48, ox = W / 2, oy = big ? 50 : 30;
    const spr = getTile(key, () => { const c = canvas(W * U, H * U), cg = c.getContext('2d'); cg.scale(U, U); drawTree(cg, { x: ox / C, y: oy / C, size: e.size, seed: e.seed, sd }, 0); return c; });
    const sw = Math.sin(t * 0.8 + e.seed) * 0.012;
    g.save(); g.translate(e.x * C, e.y * C); g.transform(1, 0, sw, 1, 0, 0); g.drawImage(spr, -ox, -oy, W, H); g.restore();
  }
  function drawTree(g, e, t) {
    const X = e.x * C, Y = e.y * C, big = e.size === 2, R = big ? 22 : 13, sway = Math.sin(t * 0.8 + e.seed) * 0.7;
    shadow(g, X + 4, Y + R * 0.45, R * 1.05, R * 0.62, 0.3);
    g.fillStyle = lin(g, X - 2.4, 0, X + 2.4, 0, [[0, '#8a5a2c'], [1, '#5a3a1a']]); g.beginPath(); g.moveTo(X - 2.6, Y + 6); g.quadraticCurveTo(X - 1.2, Y, X - 1.6, Y - 4); g.lineTo(X + 1.6, Y - 4); g.quadraticCurveTo(X + 1.2, Y, X + 2.6, Y + 6); g.closePath(); g.fill();
    const blobs = big ? [[-10, -6, 12], [8, -8, 12], [0, -14, 13], [-6, 4, 12], [9, 3, 11], [0, -3, 13]] : [[-5, -4, 8], [5, -5, 8], [0, -9, 8], [0, 0, 9]];
    const up = big ? 14 : 8;
    const pass = (scale, dx, dy, c0, c1, c2) => {
      for (const [bx, by, br] of blobs) {
        const cx = X + bx + sway + dx, cy = Y + by - up + dy, rd = br * scale;
        const gr = g.createRadialGradient(cx - rd * 0.35, cy - rd * 0.4, rd * 0.1, cx, cy, rd); gr.addColorStop(0, c0); gr.addColorStop(0.55, c1); gr.addColorStop(1, c2);
        g.fillStyle = gr; g.beginPath(); g.arc(cx, cy, rd, 0, TAU); g.fill();
      }
    };
    pass(1, 0, 0, '#3f9a45', '#2a7a34', '#1d5a28'); pass(0.78, -0.8, -1.8, '#6cc260', '#3d9a45', '#2a7a34');
    const r = rngf((e.seed + 3) * 131 + (e.sd || 0)), nL = big ? 46 : 20;
    for (let i = 0; i < nL; i++) {
      const [bx, by, br] = blobs[(r() * blobs.length) | 0], a = r() * TAU, d = r() * br * 0.8;
      g.fillStyle = r() > 0.5 ? 'rgba(150,230,110,.7)' : 'rgba(20,80,35,.5)';
      g.save(); g.translate(X + bx + Math.cos(a) * d + sway, Y + by - up + Math.sin(a) * d - 1.5); g.rotate(r() * 3); g.beginPath(); g.ellipse(0, 0, 1.3, 0.55, 0, 0, TAU); g.fill(); g.restore();
    }
    if (e.seed % 3 === 0) for (let i = 0; i < (big ? 9 : 4); i++) { const [bx, by, br] = blobs[(r() * blobs.length) | 0]; g.fillStyle = '#e8402f'; g.beginPath(); g.arc(X + bx + (r() - 0.5) * br + sway, Y + by - up + (r() - 0.2) * br * 0.8, 1.1, 0, TAU); g.fill(); g.fillStyle = 'rgba(255,255,255,.6)'; g.fillRect(X + bx + sway - 0.2, Y + by - up - 0.2, 0.4, 0.4); }
  }

  function drawKid(g, X, Y, h, bob, seated) {
    const dx = Math.cos(h), dy = Math.sin(h), b = seated ? 0 : bob;
    if (!seated) {
      g.fillStyle = '#2f4f86'; rr(g, X - 2.5, Y - 1, 2.2, 4.2 + b * 1.2, 0.8); g.fill(); rr(g, X + 0.3, Y - 1, 2.2, 4.2 - b * 1.2, 0.8); g.fill();
      g.fillStyle = '#6b4a2a'; rr(g, X - 2.8, Y + 2.6 + b * 1.2, 2.8, 1.5, 0.7); g.fill(); rr(g, X + 0.1, Y + 2.6 - b * 1.2, 2.8, 1.5, 0.7); g.fill();
    }
    g.fillStyle = '#f0c29a'; rr(g, X - 4.3 + dx * 0.6, Y - 6.2 + b * 0.5, 1.9, 4.4, 0.9); g.fill(); rr(g, X + 2.4 + dx * 0.6, Y - 6.2 - b * 0.5, 1.9, 4.4, 0.9); g.fill();
    g.fillStyle = lin(g, X - 3.4, 0, X + 3.4, 0, [[0, '#f26b5c'], [1, '#d44a3d']]); rr(g, X - 3.3, Y - 7.4, 6.6, 6.8, 2.2); g.fill();
    g.fillStyle = 'rgba(255,255,255,.55)'; g.fillRect(X - 3.2, Y - 4.4, 6.4, 0.9);
    const hy = Y - 10.6;
    g.fillStyle = lin(g, 0, hy - 3, 0, hy + 3, [[0, '#ffd8b4'], [1, '#e8b088']]); g.beginPath(); g.arc(X, hy, 3.25, 0, TAU); g.fill();
    if (dy > -0.55) { g.fillStyle = '#2b2118'; const ex = dx * 1.1, ey = hy + 0.3 + Math.max(0, dy) * 0.6; g.beginPath(); g.arc(X - 1.15 + ex, ey, 0.38, 0, TAU); g.arc(X + 1.15 + ex, ey, 0.38, 0, TAU); g.fill(); g.fillStyle = 'rgba(240,120,110,.5)'; g.beginPath(); g.arc(X - 2 + ex, hy + 1.3, 0.55, 0, TAU); g.arc(X + 2 + ex, hy + 1.3, 0.55, 0, TAU); g.fill(); }
    g.fillStyle = lin(g, 0, hy - 4, 0, hy, [[0, '#5a92ee'], [1, '#2a62c8']]); g.beginPath(); g.arc(X, hy - 0.5, 3.5, Math.PI, TAU); g.closePath(); g.fill();
    g.fillStyle = '#1f4aa8'; g.beginPath(); g.ellipse(X + dx * 2.6, hy - 0.4 + dy * 1.6, 2.5, 1.1, Math.atan2(dy, dx) * 0.3, 0, TAU); g.fill();
    g.fillStyle = '#ffffff'; g.beginPath(); g.arc(X, hy - 3.1, 0.4, 0, TAU); g.fill();
  }

  function drawPlayer(g, s, t) {
    if (M.ArtStyles && M.ArtStyles.drawPlayer(g, s, t)) return;
    const SP = M.SpritesPlayer;
    if (SP && s.tool !== 'fertilizer') {
      const p = s.p, f = C / 48;
      g.save(); g.translate(p.x * C, p.y * C); g.scale(f, f);
      SP.drawPlayer(g, { tool: s.ts.id, reach: s.ts.width * .95 * 48, heading: s.ts.id === 'scythe' ? (p.aimHeading !== undefined ? p.aimHeading : p.heading) : p.heading, step: p.step, moving: s.moving, swing: s.sw ? { a0: s.sw.a0, t: s.sw.t, dur: s.sw.dur, half: s.sw.snip ? .35 : s.sw.halfArc } : null, trim: !!(s.sw ? s.sw.snip : s.trim), engine: !!s.engine, cutting: !!s.cutting, stall: s.stall, tired: !!s.tired, t });
      g.restore(); return;
    }
    const p = s.p, Tl = s.ts, X = p.x * C, Y = p.y * C, h = p.heading;
    const bob = s.moving ? Math.sin(p.step * 2.2) : 0;
    if (s.tool === 'fertilizer') { drawKid(g, X, Y, h, bob, false); g.fillStyle = '#d8c490'; g.fillRect(X + 2, Y - 4, 3, 4); return; }
    const stalled = s.stall > 0;
    if (Tl.id === 'ride') {
      shadow(g, X + 2, Y + 5, 15, 9, 0.34);
      g.save(); g.translate(X, Y); g.rotate(h);
      g.fillStyle = '#1b1d22'; rr(g, 5, -9, 6.5, 3.2, 1.2); g.fill(); rr(g, 5, 5.8, 6.5, 3.2, 1.2); g.fill(); rr(g, -9, -10, 8, 4.2, 1.5); g.fill(); rr(g, -9, 5.8, 8, 4.2, 1.5); g.fill();
      g.fillStyle = lin(g, 0, -5, 0, 5, [[0, '#6fd47f'], [1, '#2a8c3e']]); rr(g, -9, -5.2, 10, 10.4, 2.2); g.fill();
      g.fillStyle = lin(g, 0, -5, 0, 5, [[0, '#ff8a68'], [0.5, '#e3512f'], [1, '#a8321a']]); rr(g, 1, -4.7, 11.5, 9.4, 2.6); g.fill();
      g.fillStyle = 'rgba(255,255,255,.4)'; rr(g, 2, -4, 9, 1.4, 0.7); g.fill();
      g.fillStyle = '#2d313a'; g.beginPath(); g.arc(5, 0, 1.2, 0, TAU); g.fill();
      g.fillStyle = '#c9d0d9'; rr(g, 11.2, -1.2, 1.6, 2.4, 0.6); g.fill();
      g.fillStyle = '#3a3f4a'; rr(g, -3.5, -3, 4, 6, 1.2); g.fill();
      g.strokeStyle = '#2b2f38'; g.lineWidth = 0.7; g.beginPath(); g.arc(1.8, 0, 3, -1.2, 1.2); g.stroke();
      g.restore();
      drawKid(g, X - 1.5, Y + 1, h, 0, true);
      if (s.engine && s.cutting) { g.fillStyle = 'rgba(110,110,110,.28)'; g.beginPath(); g.arc(X - Math.cos(h) * 12, Y - 4 - ((t * 14) % 5), 1.3 + ((t * 8) % 2), 0, TAU); g.fill(); }
    } else if (Tl.id === 'gas' || Tl.id === 'reel') {
      const gas = Tl.id === 'gas';
      shadow(g, X + 2, Y + 4, 12, 6.5, 0.3);
      g.save(); g.translate(X, Y); g.rotate(h);
      g.strokeStyle = '#4a4f5a'; g.lineWidth = 0.7; g.lineCap = 'round';
      g.beginPath(); g.moveTo(2, -3.6); g.lineTo(-9.5, -2.6); g.moveTo(2, 3.6); g.lineTo(-9.5, 2.6); g.moveTo(-9.5, -3.4); g.lineTo(-9.5, 3.4); g.stroke();
      g.fillStyle = '#1b1d22'; rr(g, 3, -7, 5.5, 2.6, 1); g.fill(); rr(g, 3, 4.4, 5.5, 2.6, 1); g.fill(); rr(g, -1, -6.6, 4, 2.2, 1); g.fill(); rr(g, -1, 4.4, 4, 2.2, 1); g.fill();
      if (gas) {
        g.fillStyle = lin(g, 0, -5, 0, 5, [[0, '#ff8a68'], [0.5, '#e3512f'], [1, '#9c2c16']]); rr(g, 1, -5.2, 10.5, 10.4, 2.4); g.fill();
        g.fillStyle = 'rgba(255,255,255,.4)'; rr(g, 2, -4.5, 8, 1.2, 0.6); g.fill();
        g.fillStyle = lin(g, 0, -2.4, 0, 2.4, [[0, '#d8dde5'], [1, '#7c8490']]); g.beginPath(); g.arc(5.6, 0, 2.5, 0, TAU); g.fill(); g.fillStyle = '#2d313a'; g.beginPath(); g.arc(5.6, 0, 0.9, 0, TAU); g.fill();
        g.fillStyle = '#c33a22'; rr(g, 8, 4.6, 3, 1.6, 0.6); g.fill();
      } else {
        g.fillStyle = lin(g, 0, -5, 0, 5, [[0, '#7db6ee'], [1, '#2f69ad']]); rr(g, 0.5, -4.6, 8, 9.2, 2); g.fill();
        g.fillStyle = lin(g, 9, 0, 12.6, 0, [[0, '#f4f7fb'], [1, '#98a2b0']]); rr(g, 9, -5.8, 3.6, 11.6, 1.6); g.fill();
        g.strokeStyle = 'rgba(60,70,85,.5)'; g.lineWidth = 0.3; for (let i = -4; i <= 4; i += 2) { g.beginPath(); g.moveTo(9.1, i); g.lineTo(12.5, i + 0.5); g.stroke(); }
      }
      g.restore();
      drawKid(g, X - Math.cos(h) * 8.5, Y - Math.sin(h) * 6 + 1, h, bob, false);
      if (gas && s.engine) { g.fillStyle = 'rgba(110,110,110,.25)'; g.beginPath(); g.arc(X - Math.cos(h) * 10, Y - 5 - ((t * 14) % 4), 1.1, 0, TAU); g.fill(); }
    } else {
      shadow(g, X + 1, Y + 3.5, 6.5, 3.2, 0.3);
      const sw = s.sw;
      const ang = sw ? sw.a0 - 1.25 + 2.5 * (sw.t / 0.36) : h + 1.0;
      const front = Math.sin(ang) < 0;
      const bx = X + Math.cos(ang) * 3, by = Y - 4 + Math.sin(ang) * 2.2, len = 14, ex = bx + Math.cos(ang) * len, ey = by + Math.sin(ang) * len;
      const scythe = () => {
        g.strokeStyle = lin(g, bx, by, ex, ey, [[0, '#6a4220'], [1, '#a77a46']]); g.lineWidth = 1; g.lineCap = 'round'; g.beginPath(); g.moveTo(bx, by); g.lineTo(ex, ey); g.stroke();
        g.save(); g.translate(ex, ey); g.rotate(ang);
        g.fillStyle = lin(g, 0, -3, 0, 2, [[0, '#f4f7fb'], [1, '#a3adbb']]); g.beginPath(); g.moveTo(0, -0.5); g.quadraticCurveTo(-1.5, -5.2, 3.6, -5.6); g.quadraticCurveTo(0.6, -3.6, 0.9, 0.5); g.closePath(); g.fill();
        g.restore();
        if (sw) { g.strokeStyle = 'rgba(255,255,255,.4)'; g.lineWidth = 1.4; g.lineCap = 'round'; g.beginPath(); g.arc(X, Y - 3, len - 0.5, sw.a0 - 1.25, ang); g.stroke(); }
      };
      if (front) scythe();
      drawKid(g, X, Y, h, bob, false);
      if (!front) scythe();
    }
    if (stalled) { g.fillStyle = '#ffd23f'; rr(g, X - 0.8, Y - 24, 1.6, 5, 0.8); g.fill(); g.beginPath(); g.arc(X, Y - 16, 0.9, 0, TAU); g.fill(); }
    if (s.tired && Tl.id === 'scythe') { g.fillStyle = 'rgba(150,210,255,.9)'; g.beginPath(); g.arc(X + 5, Y - 15 + ((t * 7) % 4), 0.8, 0, TAU); g.fill(); }
  }

  function drawTruck(g, s) {
    if (M.ArtStyles && M.ArtStyles.drawTruck(g, s)) return;
    const SP = M.SpritesPlayer;
    if (SP) { const sp = s.lv.spawn, spr = cachedSprite('truck', SP.bounds.truck, (cg) => SP.drawTruck(cg)); blit(g, spr, sp.x * C + 16, sp.y * C - 3); return; }
    const sp = s.lv.spawn, X = sp.x * C + 15, Y = sp.y * C - 4;
    shadow(g, X + 2, Y + 8, 14, 5.5, 0.3);
    g.fillStyle = '#1b1d22'; for (const [wx, wy] of [[-10, -8], [-10, 5], [8, -8], [8, 5]]) { rr(g, X + wx, Y + wy, 4, 3.6, 1.2); g.fill(); }
    g.fillStyle = lin(g, 0, Y - 6, 0, Y + 6, [[0, '#ffd45a'], [1, '#d9961a']]); rr(g, X - 12.5, Y - 6.2, 25, 12.4, 2.4); g.fill();
    g.fillStyle = '#8a6a3e'; rr(g, X - 11.5, Y - 5, 12.5, 10, 1.2); g.fill();
    g.fillStyle = '#e8503f'; rr(g, X - 8.5, Y - 2.2, 4.2, 5.2, 0.8); g.fill(); g.fillStyle = '#fff'; g.fillRect(X - 7.5, Y - 3.4, 2.2, 1.2);
    g.fillStyle = lin(g, 0, Y - 4, 0, Y + 4, [[0, '#bfe6fa'], [1, '#6aa9cf']]); rr(g, X + 3.5, Y - 4.4, 5.4, 8.8, 1.2); g.fill();
    g.fillStyle = 'rgba(255,255,255,.35)'; g.fillRect(X - 12, Y - 6, 24, 1);
  }

  /* ---------------- particles ---------------- */
  const fx = { parts: [], pops: [] };
  function emit(kind, x, y, n, extra) {
    for (let i = 0; i < n; i++) {
      const a = Math.random() * TAU, sp = 8 + Math.random() * 24;
      fx.parts.push(Object.assign({ x: x * C, y: y * C, vx: Math.cos(a) * sp, vy: Math.sin(a) * sp - 13, life: 0.5 + Math.random() * 0.5, kind, rot: Math.random() * 6 }, extra || {}));
    }
    if (fx.parts.length > 400) fx.parts.splice(0, fx.parts.length - 400);
  }
  function pop(text, x, y, color) { for (const q of fx.pops) if (q.text === text && q.life > 0.5 && Math.hypot(q.x - x * C, q.y - (y * C - 8)) < 40) { q.life = 1.3; return; } fx.pops.push({ text, x: x * C, y: y * C - 8, life: 1.3, color: color || '#fff' }); }
  function updateFx(dt) {
    for (let i = fx.parts.length - 1; i >= 0; i--) { const p = fx.parts[i]; p.life -= dt; if (p.life <= 0) { fx.parts.splice(i, 1); continue; } p.x += p.vx * dt; p.y += p.vy * dt; p.vy += 60 * dt; p.rot += dt * 5; }
    for (let i = fx.pops.length - 1; i >= 0; i--) { const p = fx.pops[i]; p.life -= dt; p.y -= 13 * dt; if (p.life <= 0) fx.pops.splice(i, 1); }
  }
  function drawFx(g) {
    for (const p of fx.parts) {
      g.globalAlpha = Math.min(1, p.life * 2.5);
      if (p.kind === 'grass') { g.strokeStyle = p.c || '#8fe05f'; g.lineWidth = 0.5; g.lineCap = 'round'; g.beginPath(); g.moveTo(p.x, p.y); g.lineTo(p.x + Math.cos(p.rot) * 1.6, p.y + Math.sin(p.rot) * 1.6); g.stroke(); }
      else if (p.kind === 'petal') { g.fillStyle = p.c || '#f06a8a'; g.save(); g.translate(p.x, p.y); g.rotate(p.rot); g.beginPath(); g.ellipse(0, 0, 1.1, 0.6, 0, 0, TAU); g.fill(); g.restore(); }
      else if (p.kind === 'spark') { g.fillStyle = '#ffe27a'; g.beginPath(); g.arc(p.x, p.y, 0.7, 0, TAU); g.fill(); }
      else { g.fillStyle = 'rgba(210,195,160,.8)'; g.beginPath(); g.arc(p.x, p.y, 0.8, 0, TAU); g.fill(); }
    }
    g.globalAlpha = 1;
    g.font = 'bold 6px "Fredoka", sans-serif'; g.textAlign = 'center'; g.lineJoin = 'round';
    for (const p of fx.pops) {
      g.globalAlpha = Math.min(1, p.life * 2); g.lineWidth = 1.4; g.strokeStyle = 'rgba(40,25,10,.75)'; g.strokeText(p.text, p.x, p.y); g.fillStyle = p.color; g.fillText(p.text, p.x, p.y);
    }
    g.globalAlpha = 1;
  }

  /* cutting-footprint preview (helps precise steering) */
  function drawFootprint(g, s) {
    const p = s.p, Tl = s.ts; if (s.stall > 0 || (Tl.powered && s.fuel <= 0)) return;
    // during a swing the arc is planted at the swing origin; idle previews follow the player
    const X = (s.sw && s.sw.ox !== undefined ? s.sw.ox : p.x) * C, Y = (s.sw && s.sw.oy !== undefined ? s.sw.oy : p.y) * C;
    g.save();
    if (Tl.id === 'fertilizer') {
      g.setLineDash([1, 1.4]); g.lineWidth = .25; g.strokeStyle = 'rgba(239,226,183,.55)';
      g.beginPath(); g.arc(X, Y, 1.05 * C, 0, TAU); g.stroke();
    } else if (Tl.id === 'scythe') {
      const plan = s.sw || s.aimPlan; if (!plan) { g.restore(); return; }
      const h = s.sw ? s.sw.a0 : plan.angle, R = plan.reach * C, spread = plan.halfArc + (plan.blade !== undefined ? plan.blade : M.SCYTHE.bladeAngle);
      const wd = (a) => Math.atan2(Math.sin(a), Math.cos(a));
      // flowers and rocks near the player get a soft ring so they are easy to see and aim around
      let danger = false;
      for (const e of s.ents) {
        if (!e.alive || (e.t !== 'flower' && e.t !== 'rock')) continue;
        const dx = e.x * C - X, dy = e.y * C - Y, d = Math.hypot(dx, dy), rad = (e.t === 'rock' ? .55 : .2) * C;
        if (d > 5.5 * C) continue;
        const hit = d - rad <= R && Math.abs(wd(Math.atan2(dy, dx) - h)) <= spread + Math.asin(Math.min(1, rad / Math.max(d, rad + .01)));
        if (hit) danger = true;
        if (!hit && !(s.save && s.save.scytheGuide === true)) continue;
        g.setLineDash([1.2, 1.2]); g.lineWidth = .35;
        g.strokeStyle = hit ? 'rgba(255,120,90,.9)' : 'rgba(255,255,255,.35)';
        g.beginPath(); g.arc(e.x * C, e.y * C, rad + (e.t === 'rock' ? 1 : 2.2), 0, Math.PI * 2); g.stroke();
      }
      if (!plan.snip && !(s.save && s.save.scytheGuide === true)) { g.restore(); return; } // zen: sweep shows nothing; trimmers show their narrow cone
      g.setLineDash(plan.snip ? [] : [1.6, 1.4]); g.lineWidth = plan.snip ? .5 : .35;
      g.strokeStyle = danger ? 'rgba(255,150,110,.95)' : (plan.snip ? 'rgba(160,225,255,.9)' : 'rgba(255,255,255,.5)');
      g.fillStyle = danger ? 'rgba(240,100,70,.16)' : (plan.snip ? 'rgba(130,200,255,.14)' : 'rgba(255,255,255,.07)');
      g.beginPath(); g.moveTo(X, Y); g.arc(X, Y, R, h - spread, h + spread); g.closePath(); g.fill(); g.stroke();
    } else {
      const h = p.heading;
      g.setLineDash([1.6, 1.4]); g.lineWidth = 0.35; g.strokeStyle = 'rgba(255,255,255,.55)'; g.fillStyle = 'rgba(255,255,255,.07)';
      const reach = (Tl.r + 0.35) * C, half = Tl.width * 0.5 * C, depth = Tl.cutDepth * C;
      g.translate(X, Y); g.rotate(h); g.beginPath(); g.rect(reach - depth, -half, depth * 2, half * 2); g.fill(); g.stroke();
    }
    g.restore();
  }

  /* ---------------- main draw ---------------- */
  // ctx: main canvas. cam in world px; vw/vh device px; u = device px per world unit.
  function draw(ctx, s, cam, vw, vh, u, t, opts) {
    opts = opts || {};
    if (M.ArtStyles && M.ArtStyles.drawScene(ctx, s, cam, vw, vh, u, t, opts)) return;
    setScale(u); s.dirty.length = 0;
    const k0 = C * u, ox = cam.x * u, oy = cam.y * u;
    ctx.setTransform(1, 0, 0, 1, 0, 0); ctx.imageSmoothingEnabled = true; ctx.imageSmoothingQuality = 'high';
    ctx.fillStyle = '#1f4a30'; ctx.fillRect(0, 0, vw, vh);
    const x0 = Math.max(0, Math.floor(ox / k0) - 1), x1 = Math.min(s.W - 1, Math.ceil((ox + vw) / k0) + 1);
    const y0 = Math.max(0, Math.floor(oy / k0) - 1), y1 = Math.min(s.H - 1, Math.ceil((oy + vh) / k0) + 1);
    const gx = (cx) => Math.round(cx * k0 - ox), gy = (cy) => Math.round(cy * k0 - oy);

    for (let y = y0; y <= y1; y++) for (let x = x0; x <= x1; x++) {
      const i = y * s.W + x, kd = s.kind[i], v = s.vr[i];
      const dx = gx(x), dy = gy(y), dw = gx(x + 1) - dx + 1, dh = gy(y + 1) - dy + 1;
      if (kd === K.GRASS) {
        if (s.grass[i] > 0 && (!s.subRemaining || s.subRemaining[i] === M.GRASS_SUBDIV**2)) continue;
        drawMownTile(ctx, s, i, dx, dy, dw, dh, d => getTile('c' + d, () => cutTile(d, 0)));
      } else {
        const tl = getTile('k' + kd + '_' + v, () => terrainTile(kd, v));
        ctx.drawImage(tl, dx, dy, dw, dh);
      }
    }
    for (let y = y0; y <= y1 + 1 && y < s.H; y++) for (let x = x0; x <= x1; x++) {
      const i = y * s.W + x; if (!(s.kind[i] === K.GRASS && s.grass[i] > 0)) continue;
      const th=s.grass[i]>1,v=s.vr[i],pattern=M.Sim.grassPattern(s,i);
      let tl;
      if(pattern){const key=(th?'th':'tl')+(v&7)+pattern;tl=partialGrass.get(key);if(!tl){tl=grassTile(th,v&7,pattern);partialGrass.set(key,tl);if(partialGrass.size>256)partialGrass.delete(partialGrass.keys().next().value);}}
      else tl=getTile((th?'th':'tl')+(v&7),()=>grassTile(th,v&7));
      ctx.drawImage(tl, gx(x) - tl._m, gy(y) - tl._t);
      const tn = s.tint[i]; if (tn && s.subRemaining[i] === M.GRASS_SUBDIV ** 2) { ctx.fillStyle = tn > 0 ? `rgba(255,250,140,${tn / 200})` : `rgba(0,40,40,${-tn / 230})`; ctx.fillRect(gx(x), gy(y), gx(x + 1) - gx(x), gy(y + 1) - gy(y)); }
    }

    ctx.setTransform(u, 0, 0, u, -ox, -oy);
    M.Groundskeeping.draw(ctx, s);
    ctx.lineCap = 'round';
    for (let y = y0; y <= y1; y++) for (let x = x0; x <= x1; x++) {
      const kd = s.kind[y * s.W + x]; if (kd !== K.WATER && kd !== K.WATERE) continue;
      const ph = Math.floor(t * 1.2 + hash(x, y, 3) * 6);
      if (hash(x, y, ph) > 0.72) { const wx = x * C + 1 + hash(x, y, ph + 1) * 4, wy = y * C + 2 + hash(x, y, ph + 2) * 4; ctx.strokeStyle = 'rgba(255,255,255,.6)'; ctx.lineWidth = 0.35; ctx.beginPath(); ctx.moveTo(wx, wy); ctx.quadraticCurveTo(wx + 1.2, wy - 0.5, wx + 2.4, wy); ctx.stroke(); }
    }
    const frac = s.remaining / Math.max(1, s.total), thr = [0, 0.1, 0.2, 1][s.eyes] || 0;
    if (s.eyes > 0 && frac < thr && s.remaining > 0) {
      const pulse = 0.5 + 0.5 * Math.sin(t * 5);
      for (let y = y0; y <= y1; y++) for (let x = x0; x <= x1; x++) if (s.grass[y * s.W + x]) { ctx.fillStyle = `rgba(255,240,120,${0.18 + 0.4 * pulse})`; ctx.beginPath(); ctx.arc(x * C + 4, y * C + 2.5, 2.6, 0, TAU); ctx.fill(); }
    }
    if (M.SpritesBuild && M.SpritesBuild.fenceRun) for (const f of s.fences || []) {
      ctx.save(); ctx.translate(f.x * C, f.y * C); ctx.scale(C / 48, C / 48);
      M.SpritesBuild.fenceRun(ctx, f.length * 48, { vertical: f.vertical, seed: f.x * 31 + f.y * 17 });
      ctx.restore();
    }
    if (opts.footprint !== false) drawFootprint(ctx, s);
    drawTruck(ctx, s);
    for (const e of s.ents) {
      if (!e.alive) continue;
      if (e.t === 'flower') drawFlowerCached(ctx, e, t);
      else if (e.t === 'rock') drawRock(ctx, e);
      else if (e.t === 'toy' && !e.found) drawToy(ctx, e);
      else if (e.t === 'sprinkler') drawSprinkler(ctx, e, t);
    }
    const sorted = [];
    for (const e of s.ents) if (e.alive && (e.t === 'tree' || e.t === 'gnome')) sorted.push([e.y * C + (e.t === 'tree' ? (e.size === 2 ? 8 : 5) : 0), e]);
    sorted.push([s.p.y * C + 6, null]);
    sorted.sort((a, b) => a[0] - b[0]);
    for (const [, e] of sorted) { if (!e) drawPlayer(ctx, s, t); else if (e.t === 'tree') drawTreeCached(ctx, e, t, s); else drawGnome(ctx, e, t); }
    drawFx(ctx);
    ctx.setTransform(1, 0, 0, 1, 0, 0);

    if (!draw.vig || draw.vig.w !== vw || draw.vig.h !== vh) {
      const c = document.createElement('canvas'); c.width = vw; c.height = vh;
      const g = c.getContext('2d'); const gr = g.createRadialGradient(vw / 2, vh / 2, Math.min(vw, vh) * 0.4, vw / 2, vh / 2, Math.max(vw, vh) * 0.78);
      gr.addColorStop(0, 'rgba(0,0,0,0)'); gr.addColorStop(1, 'rgba(8,28,16,.30)'); g.fillStyle = gr; g.fillRect(0, 0, vw, vh);
      draw.vig = { c, w: vw, h: vh };
    }
    ctx.drawImage(draw.vig.c, 0, 0);
  }

  function thumb(index, size) {
    const lv = M.buildLevel(index), MG = M.MARGIN;
    const w = lv.def.w, h = lv.def.h, sc = Math.max(2, Math.floor(size / Math.max(w, h)));
    const cv = document.createElement('canvas'); cv.width = w * sc; cv.height = h * sc;
    const g = cv.getContext('2d');
    const col = ['#2b5a3a', '#6fc24b', '#cdb995', '#b4553d', '#4aa3d1', '#ecd9a0', '#2f6633', '#2c6a34'];
    for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
      const i = (y + MG) * lv.W + (x + MG); const t = lv.type[i];
      if (t === 0) continue;
      g.fillStyle = t === 1 && lv.thick[i] ? '#3f8f41' : col[t]; g.fillRect(x * sc, y * sc, sc, sc);
    }
    for (const e of lv.ents) if (e.t === 'tree') { g.fillStyle = '#1f7a35'; g.beginPath(); g.arc((e.x - MG) * sc, (e.y - MG) * sc, sc * (e.size === 2 ? 3 : 2), 0, 6.3); g.fill(); }
    return cv;
  }

  M.Render = { drawMownTile, bake, draw, drawFootprint, drawFx, emit, pop, updateFx, thumb, hash, fx, setScale };
})();
