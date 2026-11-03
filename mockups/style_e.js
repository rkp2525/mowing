/* Style E · Chunky Pixel Art — every object is painted at 1/4 res (1 art px = 4 logical px) with fillRect
   onto tiny offscreen canvases, then blitted with smoothing OFF. Light from top-left, banded+dithered ramps. */
(function () {
  const T = 4;
  const BAY = [[0, 8, 2, 10], [12, 4, 14, 6], [3, 11, 1, 9], [15, 7, 13, 5]];
  const bay = (i, j) => BAY[j & 3][i & 3] / 16;
  const SH = 'rgba(14,44,26,.30)', SH2 = 'rgba(14,44,26,.17)';

  function painter(x) {
    const P = {
      x,
      r(a, b, w, h, c) { x.fillStyle = c; x.fillRect(a, b, w, h); },
      p(a, b, c) { x.fillStyle = c; x.fillRect(a, b, 1, 1); },
      map(ox, oy, rows, pal) {
        rows.forEach((row, j) => { for (let i = 0; i < row.length; i++) { const col = pal[row[i]]; if (col) { x.fillStyle = col; x.fillRect(ox + i, oy + j, 1, 1); } } });
      },
      /* left-half rows, mirrored around the last column; `swap` remaps chars on the right (shaded) half */
      sym(ox, oy, rows, pal, swap) {
        swap = swap || {};
        const full = rows.map((L) => { const m = L.slice(0, -1).split('').reverse().map((ch) => swap[ch] || ch).join(''); return L + m; });
        P.map(ox, oy, full, pal);
      },
      ell(cx, cy, rx, ry, c) {
        x.fillStyle = c;
        for (let j = Math.floor(cy - ry); j <= Math.ceil(cy + ry); j++) for (let i = Math.floor(cx - rx); i <= Math.ceil(cx + rx); i++) {
          const u = (i - cx) / (rx + .5), v = (j - cy) / (ry + .5); if (u * u + v * v <= 1) x.fillRect(i, j, 1, 1);
        }
      },
      shadow(cx, cy, rx, ry) {
        for (let j = Math.floor(cy - ry - 2); j <= Math.ceil(cy + ry + 2); j++) for (let i = Math.floor(cx - rx - 2); i <= Math.ceil(cx + rx + 2); i++) {
          const u = (i - cx) / (rx + .5), v = (j - cy) / (ry + .5), d = u * u + v * v;
          if (d <= 1) { x.fillStyle = SH; x.fillRect(i, j, 1, 1); } else if (d <= 1.4 && ((i + j) & 1) === 0) { x.fillStyle = SH2; x.fillRect(i, j, 1, 1); }
        }
      },
      /* shaded pixel sphere: pal dark->light, banded + bayer dither, selective outline (dark on lower-right, mid on upper-left) */
      sph(cx, cy, rx, ry, pal, o) {
        o = o || {}; const n = pal.length, ol = o.ol === false ? null : (o.ol || pal[0]), bias = o.bias || 0;
        const ins = (i, j) => { const u = (i - cx) / (rx + .5), v = (j - cy) / (ry + .5); return u * u + v * v <= 1; };
        for (let j = Math.floor(cy - ry - 1); j <= Math.ceil(cy + ry + 1); j++) for (let i = Math.floor(cx - rx - 1); i <= Math.ceil(cx + rx + 1); i++) {
          if (!ins(i, j)) continue;
          let col;
          if (ol && (!ins(i + 1, j) || !ins(i, j + 1))) col = ol;
          else if (ol && (!ins(i - 1, j) || !ins(i, j - 1))) col = pal[Math.min(1, n - 1)];
          else {
            const u = (i - cx) / (rx + .5), v = (j - cy) / (ry + .5), d = u * u + v * v, nz = Math.sqrt(Math.max(0, 1 - d));
            const l = -0.5 * u - 0.65 * v + 0.55 * nz + bias, t = (l + 0.8) / 1.6;
            let k = Math.floor(t * n + (bay(i, j) - 0.5) * 0.9); k = Math.max(ol ? 1 : 0, Math.min(n - 1, k)); col = pal[k];
          }
          x.fillStyle = col; x.fillRect(i, j, 1, 1);
        }
      },
      line(x0, y0, x1, y1, c) {
        x.fillStyle = c; x0 = Math.round(x0); y0 = Math.round(y0); x1 = Math.round(x1); y1 = Math.round(y1);
        const dx = Math.abs(x1 - x0), dy = -Math.abs(y1 - y0), sx = x0 < x1 ? 1 : -1, sy = y0 < y1 ? 1 : -1; let e = dx + dy;
        for (;;) { x.fillRect(x0, y0, 1, 1); if (x0 === x1 && y0 === y1) break; const e2 = 2 * e; if (e2 >= dy) { e += dy; x0 += sx; } if (e2 <= dx) { e += dx; y0 += sy; } }
      },
    };
    return P;
  }
  function sprite(w, h, ax, ay, fn) {
    const c = document.createElement('canvas'); c.width = w; c.height = h;
    const x = c.getContext('2d'); fn(painter(x), x); return { c, w, h, ax, ay };
  }

  /* ---------- palettes ---------- */
  const K = { o: '#2b2030', s: '#f6c49b', S: '#d98f6a', e: '#2b2030', m: '#b8484e', r: '#e24a3e', h: '#ff8a68', R: '#a42f3b', a: '#7a4630', A: '#55301f',
    w: '#fbd04e', W: '#d99a38', b: '#4a98e0', p: '#3f64b8', P: '#2c4690', q: '#6d8fe0', k: '#5a3426', K: '#3a2018', y: '#ffd84a', g: '#9aa3ad', G: '#6d7681' };
  const GREEN = ['#143f2a', '#1f6b35', '#2f9440', '#52b84a', '#86d95c', '#b8f07e'];
  const OAK = ['#10382a', '#1b5e33', '#2a8a3d', '#47ad47', '#76cf55', '#a9ec74'];
  const ROCK = ['#3b4047', '#5a6168', '#7d858c', '#a1a9ad', '#c6cdcf'];
  const HEDGE = ['#12392a', '#1c5c32', '#2c8440', '#43a548', '#69c654', '#97e070'];

  /* kid side-view head+torso (facing east). ox,oy = top-left; returns nothing */
  const KID_SIDE = [
    '...ooooo....',
    '..orhhrrro..',
    '..orhrrrrRo.',
    '..oaRRRRRRRo',
    '..oasssssso.',
    '..oassssesо.'.replace('о', 'o'),
    '..oasssssmo.',
    '...oaSSSSo..',
    '...owwwwo...',
    '..owwwwwwo..',
    '..owwppppo..',
    '..owwpppwso.',
    '...opppppo..',
    '...opppppo..',
  ];
  function kidSideLegs(P, ox, oy) {
    P.map(ox, oy + 14, [
      '...oppppo...',
      '..oppo.oppo.',
      '..opo...opPo',
      '.okko...okko',
      '.oooo...oooo',
    ], K);
  }

  /* ---------- sprites ---------- */
  const S = {};

  S.kidIdle = sprite(17, 26, 8, 22, (P) => {
    P.shadow(9, 21, 6, 2);
    P.sym(2, 2, [
      '....ooo', '...orhh', '..orhrr', '.oRRRRR', '..oasss', '..osess', '..osssm', '...oSss',
      '..owwww', '.owwpww', '.owwppp', '.osoppp', '..opppp', '..opppp', '..oppo.', '..oppo.', '..oppo.', '.okkko.', '.oooooo',
    ], K, { h: 'r', w: 'W', p: 'P', k: 'K', r: 'R' });
    // eyes sparkle, cheek blush, walking hint: left foot a pixel higher
    P.p(5, 9, '#ffffff'); P.p(11, 9, '#ffffff'); P.p(5, 11, '#f09a86'); P.p(13, 11, '#f09a86');
    P.r(3, 19, 4, 1, K.k); P.r(3, 20, 4, 1, K.o); P.r(3, 21, 0, 0, K.o);
    P.r(3, 19, 4, 1, K.k); P.p(3, 19, K.o);
  });

  S.kidScythe = sprite(44, 28, 14, 23, (P, x) => {
    const ox = 5, oy = 2;
    P.shadow(17, 22, 15, 2.5);
    // swoosh trail (ground-level arc east of kid)
    for (let a = -100; a <= 22; a += 1.5) {
      const t = (a + 100) / 122, ang = a * Math.PI / 180, px = Math.round(16 + 22 * Math.cos(ang)), py = Math.round(15 + 7.5 * Math.sin(ang));
      x.fillStyle = `rgba(255,255,255,${(0.15 + t * 0.85).toFixed(2)})`; x.fillRect(px, py, 1, 1); if (t > .25) x.fillRect(px - 1, py, 1, 1); if (t > .5) x.fillRect(px - 1, py - 1, 1, 1);
      if (t > .6) { x.fillStyle = `rgba(210,245,255,${(t * .6).toFixed(2)})`; x.fillRect(px, py + 1, 1, 1); }
    }
    P.map(ox, oy, KID_SIDE, K);
    kidSideLegs(P, ox, oy);
    // snath + blade
    P.line(ox + 3, oy + 9, ox + 26, oy + 17, '#8a5a34'); P.line(ox + 3, oy + 10, ox + 26, oy + 18, '#5f3a22');
    P.p(ox + 10, oy + 11, K.s); P.p(ox + 10, oy + 12, K.s);
    P.map(ox + 26, oy + 14, ['.....bb', '...bbwww', '.bbwwwo.', 'wwwwoo..'], { b: '#c9d4dc', w: '#eef6fb', o: '#6d7a86' });
    P.p(ox + 31, oy + 14, '#ffffff');
    P.p(ox + 12, oy + 11, K.s); P.p(ox + 11, oy + 11, K.s);
  });

  S.kidPush = sprite(24, 50, 12, 46, (P) => {
    const kx = 5, ky = 26;
    P.shadow(13, 45, 9, 2.5); P.shadow(12, 30, 9, 3);
    // mower (top view, facing north) — deck
    P.r(1, 17, 2, 5, '#1d1f24'); P.r(1, 17, 1, 2, '#5a606a'); P.r(19, 17, 2, 5, '#14161a'); P.r(1, 25, 2, 5, '#1d1f24'); P.r(1, 25, 1, 2, '#5a606a'); P.r(19, 25, 2, 5, '#14161a');
    P.map(3, 13, [
      '.oooooooooooooo.',
      'orhhhrrrrrrrrRRo',
      'orhrrrrrrrrrrRRo',
      'orrrrrrrrrrrrRRo',
      'orrrRRRRRRRrrRRo',
      'orrRggggggRrrRRo',
      'orrRgyyyGgRrRRRo',
      'orrRggGGGgRrRRRo',
      'orrRRRRRRRRrRRRo',
      'orrrrrrrrrrrRRRo',
      'orrrrrrrrrrRRRRo',
      'oRRRRRRRRRRRRRRo',
      '.oooooooooooooo.',
    ], { o: '#3a1520', r: '#e24a3e', h: '#ff9272', R: '#b33038', g: '#b8c2cc', G: '#7a8591', y: '#2b2e35' });
    // grass bag at the back
    P.map(7, 27, ['.oooooooo.', 'ognnnnnnGo', 'ognnnnnGGo', '.oGGGGGGo.'], { o: '#173a22', g: '#7ed35a', n: '#4fb04a', G: '#2e8240' });
    // handle struts + bar
    P.line(6, 29, 4, 34, '#2b2e35'); P.line(17, 29, 19, 34, '#2b2e35'); P.line(7, 29, 5, 34, '#555b66'); P.line(16, 29, 18, 34, '#555b66');
    P.r(3, 34, 17, 2, '#3a3f49'); P.r(3, 34, 17, 1, '#6b7280');
    // kid from behind
    P.sym(kx, ky, [
      '....ooo', '...orhh', '..orhrr', '.orrrrr', '.oRRRRR', '..oaaaa', '..oaaAa', '...oSSS',
      '..owwww', '.owwwww', '.owwppp', '.owwppp', '..opppp', '..opppp', '..oppo.', '..oppo.', '..oppo.', '.okkko.', '.oooooo',
    ].slice(0, 19), K, { h: 'r', w: 'W', p: 'P', k: 'K', r: 'R', a: 'A' });
    // hands gripping the bar
    P.r(kx + 1, ky + 8, 2, 2, K.s); P.r(kx + 10, ky + 8, 2, 2, K.S);
  });

  S.reel = sprite(34, 28, 14, 24, (P) => {
    P.shadow(16, 23, 14, 2.5);
    const wh = (cx, cy, r) => { P.sph(cx, cy, r, r, ['#16181d', '#2b2f38', '#4a505c', '#7a828f'], { ol: '#0c0d10' }); P.sph(cx, cy, 1.5, 1.5, ['#6d7480', '#aab2bd', '#e5ebf0'], { ol: false }); };
    // far wheel
    wh(8, 17, 4);
    // frame bar + cylinder
    P.map(6, 12, ['oooooooooooooo', 'ogggggggggggGo', 'oGGGGGGGGGGGGo'], { o: '#2a3038', g: '#c5ccd4', G: '#7c8793' });
    P.sph(26, 17, 3.5, 4, ['#1d5f35', '#2f8a43', '#4fb04a', '#8ee06a'], { ol: '#103a24' });
    for (let k = 0; k < 4; k++) { P.p(24 + k % 2, 14 + k * 2, '#c8f0a0'); P.p(27 - k % 2, 15 + k * 2, '#17512d'); }
    P.r(26, 21, 4, 1, '#cfd6dc'); // bottom blade
    wh(10, 19, 4);
    // handle (diagonal back/up) with grip
    P.line(6, 12, 0, 3, '#555b66'); P.line(7, 12, 1, 3, '#2b2e35'); P.r(-0 + 0, 2, 3, 2, '#d94a3a'); P.p(0, 2, '#ff9272');
    // roller tag
    P.r(12, 13, 2, 2, '#e24a3e'); P.p(12, 13, '#ff9272');
  });

  S.ride = sprite(34, 36, 16, 31, (P) => {
    P.shadow(17, 30, 15, 3);
    const wheel = (cx, cy, r) => { P.sph(cx, cy, r, r, ['#101216', '#23262d', '#3f444e', '#6b7280'], { ol: '#08090b' }); P.sph(cx, cy, r - 2.2, r - 2.2, ['#8a1f2a', '#d94a3a', '#ff8a68'], { ol: false }); };
    // far (north) wheels peeking
    P.r(8, 23, 5, 2, '#14161a'); P.r(23, 25, 3, 2, '#14161a');
    // deck skirt + chute
    P.map(7, 26, ['oooooooooooooooo', 'ocggggggggggGGco', 'oGGGGGGGGGGGGGGo'], { o: '#23262d', c: '#e5ebf0', g: '#aab4be', G: '#6d7885' });
    // chassis
    P.map(5, 17, [
      '.ooooooooooooooo....',
      'ohhhhhhhhhhhhhhooo..',
      'ohrrrrrrrrrrrrrrrro.',
      'orrrrrrrrrrrrrrrrrRo',
      'orrrrrrrrrrrrrrrrRRo',
      'oRRRRRRRRRRRRRRRRRRo',
      '.ooooooooooooooooooo',
    ], { o: '#3a1520', h: '#ff9a74', r: '#e24a3e', R: '#a82f3a' });
    // hood grille & headlight, stripe
    P.map(21, 19, ['.', '.'], {}); P.r(21, 20, 3, 1, '#ffd84a'); P.p(24, 19, '#fff6c0'); P.p(24, 20, '#ffd84a');
    P.r(23, 22, 1, 2, '#2b2e35'); P.p(21, 22, '#8a2530');
    // seat
    P.map(6, 11, ['.ooooo', 'oQQQQQo', 'oQqqQQo', 'oQQQQQo'], { o: '#14161a', Q: '#333844', q: '#555c6a' });
    P.r(6, 15, 7, 3, '#242831'); P.r(6, 15, 7, 1, '#3b414d');
    // kid seated
    const ox = 5, oy = 3;
    P.map(ox, oy, KID_SIDE.slice(0, 13), K);
    P.map(ox + 3, oy + 12, ['opppppppo', '.opppppppo', '..oppppppo', '...opppoko'], K);
    P.map(ox + 9, oy + 14, ['.o', 'pp', 'po', 'kk'], K); P.r(ox + 10, oy + 17, 3, 2, K.k); P.r(ox + 10, oy + 19, 3, 1, K.o);
    // steering wheel + column
    P.r(21, 12, 1, 6, '#2b2e35'); P.map(18, 11, ['.ooo.', 'ogggo', '.ooo.'], { o: '#14161a', g: '#6d7480' });
    P.p(ox + 9, oy + 9, K.s); P.p(ox + 10, oy + 9, K.s);
    wheel(10, 25, 5); wheel(27, 28, 3);
  });

  /* canopy builder: clustered lobes + highlight leaf clumps */
  function canopy(P, cx, cy, rx, ry, seed, pal) {
    const r = MK.rng(seed), lobes = [{ x: cx, y: cy + ry * 0.12, rx: rx * 0.8, ry: ry * 0.78 }];
    const n = Math.max(6, Math.round(rx / 2.8));
    for (let i = 0; i < n; i++) { const a = (i + r() * 0.5) / n * Math.PI * 2; lobes.push({ x: cx + Math.cos(a) * rx * 0.64, y: cy + Math.sin(a) * ry * 0.6, rx: rx * (0.27 + r() * 0.08), ry: ry * (0.3 + r() * 0.1) }); }
    for (let i = 0; i < Math.round(n / 2); i++) lobes.push({ x: cx + (r() - 0.55) * rx * 0.7, y: cy - ry * 0.05 + (r() - 0.5) * ry * 0.5, rx: rx * (0.22 + r() * 0.08), ry: ry * (0.25 + r() * 0.08) });
    lobes.sort((a, b) => a.y - b.y);
    lobes.forEach((l) => P.sph(l.x, l.y, l.rx, l.ry, pal, { bias: -((l.x - cx) / rx) * 0.2 - ((l.y - cy) / ry) * 0.3 }));
    for (let i = 0; i < n * 2; i++) {
      const l = lobes[1 + Math.floor(r() * (lobes.length - 1))], hx = Math.round(l.x - l.rx * 0.35 + r() * 2), hy = Math.round(l.y - l.ry * 0.4 + r() * 2);
      P.p(hx, hy, pal[pal.length - 1]); P.p(hx + 1, hy, pal[pal.length - 1]); P.p(hx, hy + 1, pal[pal.length - 2]);
    }
    for (let i = 0; i < n; i++) { const l = lobes[Math.floor(r() * lobes.length)]; P.p(Math.round(l.x + l.rx * 0.25), Math.round(l.y + l.ry * 0.45), pal[0]); P.p(Math.round(l.x + l.rx * 0.25) + 1, Math.round(l.y + l.ry * 0.45), pal[1]); }
  }
  const BARK = { o: '#2b1a14', d: '#4a2c1e', m: '#6e4630', l: '#94623f', h: '#b98558' };

  S.treeSmall = sprite(48, 56, 24, 46, (P) => {
    P.shadow(29, 45, 17, 4.5);
    P.sym(20, 30, ['.....dd', '....odm', '....odm', '....odm', '...odmm', '..odmmm', '.odmmmm', 'oddmmmm'].map((s) => s.slice(0, 7)), BARK, { l: 'm', m: 'd', d: 'o' });
    P.map(20, 30, ['.....', ''], {});
    P.sym(19, 36, ['..oomll', '..odmlm', '.odmlmm', 'oodmmmd', 'ooddddd'].map((s) => s), BARK, { l: 'm', m: 'd', d: 'o' });
    canopy(P, 24, 18, 18, 14, 7, GREEN);
    P.p(23, 36, BARK.h); P.p(22, 38, BARK.h);
  });

  S.treeBig = sprite(76, 60, 38, 52, (P) => {
    P.shadow(46, 51, 30, 6);
    const tr = ['......dd', '.....odm', '.....odm', '....oodm', '....odmm', '...odmmm', '...odmmm', '...odmmm', '...odmmm', '..odmmmm', '..odmmmm', '.oddmmmm', 'oodmmmmm', 'ooddmmmm', 'oooddddd'];
    P.sym(30, 36, tr, BARK, { l: 'm', m: 'd', d: 'o' });
    for (let j = 0; j < 14; j += 3) { P.p(35 + (j % 2), 38 + j, BARK.l); P.p(41, 40 + j, BARK.o); }
    P.p(34, 44, BARK.h); P.p(34, 40, BARK.h); P.p(33, 48, BARK.l);
    canopy(P, 38, 19, 31, 17, 21, OAK);
    const r = MK.rng(3); for (let i = 0; i < 14; i++) { const a = r() * 6.28, d = r() * 0.6; P.p(Math.round(38 + Math.cos(a) * 28 * d - 6), Math.round(16 + Math.sin(a) * 14 * d - 5), '#d4ff9a'); }
  });

  S.rock = sprite(30, 24, 15, 18, (P) => {
    P.shadow(17, 17, 11, 3);
    P.sph(13, 12, 8.5, 6, ROCK, { bias: .05 });
    P.sph(21, 14, 5, 3.6, ROCK, { bias: .0 });
    P.sph(7, 15, 4, 2.6, ROCK, { bias: -.05 });
    P.p(10, 8, ROCK[4]); P.p(11, 8, ROCK[4]); P.p(9, 9, ROCK[4]); P.r(14, 11, 3, 1, ROCK[1]); P.p(17, 12, ROCK[1]); P.p(11, 13, ROCK[1]);
    // moss
    P.r(16, 7, 3, 1, '#58a845'); P.r(17, 8, 3, 1, '#3f8a3d'); P.p(18, 6, '#8bd15a');
    // grass tufts in front
    const tuft = (x, y, h) => { for (let k = -1; k <= 1; k++) { const hh = h - Math.abs(k); for (let j = 0; j < hh; j++) P.p(x + k * 1 + (j > 1 ? k : 0), y - j, j > hh - 2 ? '#8be05c' : (k < 0 ? '#3f9a45' : '#2a7a38')); } };
    tuft(9, 19, 4); tuft(13, 20, 3); tuft(19, 19, 4); tuft(23, 18, 3); tuft(5, 18, 3);
  });

  /* flowers */
  const stemC = '#2f8a3d', stemL = '#58b84a', leafD = '#1f6b35';
  function patchBase(P, w) { P.shadow(w / 2 + 1, 12, w / 2, 2); }
  function stem(P, x, y0, y1) { P.r(x, y0, 1, y1 - y0, stemC); P.p(x, y0 + 1, stemL); }
  function leaf(P, x, y, dir) { P.p(x, y, stemL); P.p(x + dir, y - 1, stemL); P.p(x + dir * 2, y - 1, leafD); P.p(x + dir, y, leafD); }
  function tuftF(P, x, y) { P.p(x, y, '#3f9a45'); P.p(x - 1, y - 1, '#2a7a38'); P.p(x + 1, y - 1, '#6cc654'); P.p(x, y - 2, '#8be05c'); }

  S.daisy = sprite(16, 18, 8, 14, (P) => {
    patchBase(P, 12);
    const D = { w: '#ffffff', W: '#cfd9ec', y: '#ffc72e', Y: '#e8901c' };
    [[4, 7], [11, 9], [7, 4]].forEach(([x, y]) => { stem(P, x, y + 3, 13); leaf(P, x, 11, x < 7 ? -1 : 1); });
    const bloom = (x, y) => P.map(x - 2, y - 2, ['.www.', 'wwwww', 'wwYww', 'WwwwW', '.WWW.'], D);
    bloom(4, 7); bloom(11, 9); bloom(7, 4);
    [[4, 7], [11, 9], [7, 4]].forEach(([x, y]) => { P.p(x, y, D.y); P.p(x - 1, y - 1 + 1, D.y); P.p(x + 1, y + 1, D.Y); P.p(x, y - 1, '#ffe27a'); });
    tuftF(P, 3, 13); tuftF(P, 13, 13); tuftF(P, 8, 13);
  });
  S.poppy = sprite(16, 18, 8, 14, (P) => {
    patchBase(P, 12);
    const D = { r: '#e8392f', R: '#a8222e', h: '#ff7a5e', d: '#2b1a24', t: '#f2435c', T: '#b5283f' };
    [[4, 7], [11, 6], [7, 8]].forEach(([x, y]) => { stem(P, x, y + 3, 13); leaf(P, x, 11, x < 7 ? -1 : 1); });
    P.map(2, 5, ['.rrr.', 'hrrrr', 'rrdrr', 'rrrrR', '.RRR.'], D);
    P.map(9, 4, ['.rrr.', 'hrrrr', 'rrdrr', 'rrrrR', '.RRR.'], D);
    P.map(6, 7, ['t.t', 'ttt', 'tTt', '.T.'].map((s) => s), D); P.p(6, 7, '#ff9aa6'); P.p(8, 6, D.t); P.p(6, 6, D.t); P.p(7, 6, D.T);
    tuftF(P, 3, 13); tuftF(P, 13, 13); tuftF(P, 8, 13);
  });
  S.aster = sprite(16, 18, 8, 14, (P) => {
    patchBase(P, 12);
    const D = { l: '#e0d0ff', p: '#a98af0', P: '#7653c9', y: '#ffd23a', Y: '#e09a1e' };
    [[4, 8], [11, 7], [7, 5]].forEach(([x, y]) => { stem(P, x, y + 3, 13); leaf(P, x, 11, x < 7 ? -1 : 1); });
    const bloom = (x, y) => P.map(x - 3, y - 2, ['..lpp..', '.lppppP', 'lpppyPP', '.ppYPPP', '..PPP..'], D);
    bloom(4, 8); bloom(11, 7); bloom(7, 5);
    tuftF(P, 3, 13); tuftF(P, 13, 13); tuftF(P, 8, 13);
  });
  S.sunflower = sprite(18, 26, 9, 22, (P) => {
    P.shadow(10, 21, 6, 1.8);
    P.r(9, 11, 1, 10, stemC); P.r(10, 12, 1, 9, '#1f6b35'); P.p(9, 13, stemL);
    P.map(4, 15, ['..ll', '.lLLd', 'lLd.'], { l: '#58b84a', L: '#3f9a45', d: '#1f6b35' }); P.map(11, 17, ['LLl..', '.dLLl', '..dL'], { l: '#58b84a', L: '#3f9a45', d: '#1f6b35' });
    // head
    for (let a = 0; a < 16; a++) { const an = a / 16 * 6.283, px = Math.round(9.5 + Math.cos(an) * 5.3), py = Math.round(6.5 + Math.sin(an) * 5.3), c = a % 2 ? '#ffc72e' : '#ffe14d'; P.p(px, py, c); P.p(Math.round(9.5 + Math.cos(an) * 4.2), Math.round(6.5 + Math.sin(an) * 4.2), c); if (an > 1.6 && an < 5.2) { P.p(px + 1, py + 1, '#e8901c'); } }
    P.ell(9, 6, 3.4, 3.4, '#6b3d1f'); P.p(7, 4, '#9b6232'); P.p(8, 4, '#8a522b'); P.p(8, 5, '#8a522b'); P.p(10, 7, '#3d2012'); P.p(11, 6, '#3d2012'); P.p(9, 8, '#3d2012'); P.p(7, 7, '#53301a'); P.p(10, 5, '#53301a');
    P.p(5, 3, '#fff4a0'); P.p(6, 2, '#fff4a0');
    tuftF(P, 5, 21); tuftF(P, 14, 21);
  });

  S.gnome = sprite(14, 18, 7, 14, (P) => {
    P.shadow(8, 13, 4, 1.6);
    P.sym(3, 2, ['...r', '..hr', '.hrr', 'orrr', 'owsn', '.www', '.wwW', '.bbw', '.bbb', '.kk.'], { o: '#2b1a24', r: '#e8392f', h: '#ff7a5e', R: '#a8222e', w: '#f6f6ee', W: '#c9ccd6', s: '#f2b08a', n: '#e8786a', b: '#3f78c8', B: '#2c5198', k: '#5a3426', K: '#3a2018', }, { h: 'r', r: 'R', w: 'W', b: 'B', k: 'K' });
    P.p(5, 6, '#2b1a24'); P.p(9, 6, '#2b1a24'); P.r(3, 12, 8, 1, '#2b1a24'); P.p(6, 3, '#ffb09a'); P.p(5, 4, '#ff7a5e');
  });
  S.ball = sprite(10, 10, 5, 7, (P) => {
    P.shadow(6, 7, 3, 1.2);
    P.sph(5, 4, 2.8, 2.8, ['#a8222e', '#e8392f', '#ff7a5e'], { ol: '#3a1520' });
    P.r(3, 4, 5, 1, '#f6f6ee'); P.p(4, 3, '#ff7a5e'); P.p(4, 4, '#ffffff');
  });
  S.frisbee = sprite(14, 10, 7, 7, (P) => {
    P.shadow(8, 7, 5, 1.3);
    P.map(2, 3, ['..oooooo..', '.occcccchc.'.slice(0, 10), 'oCCCcccccCo'.slice(0, 10), '.oCCCCCCo.'.slice(0, 10), '...oooo...'], { o: '#12405a', c: '#35b8e8', h: '#aef0ff', C: '#1f83c0' });
    P.p(5, 4, '#ffffff'); P.p(6, 4, '#aef0ff');
  });
  S.stick = sprite(18, 10, 9, 6, (P) => {
    P.shadow(10, 7, 6, 1);
    P.line(2, 5, 14, 3, '#4a2c1e'); P.line(2, 4, 14, 2, '#8a5a34'); P.line(7, 4, 9, 1, '#6e4630'); P.line(11, 3, 13, 0, '#6e4630');
    P.p(3, 3, '#b98558'); P.p(5, 3, '#b98558');
  });

  S.fence = sprite(56, 24, 2, 18, (P) => {
    const ox = 2;
    P.r(ox + 1, 18, 50, 2, SH); P.r(ox + 3, 20, 50, 1, SH2);
    // rails
    [[6, 2], [12, 2]].forEach(([y]) => { P.r(ox, y + 0, 49, 1, '#e0bf86'); P.r(ox, y + 1, 49, 2, '#b88a54'); P.r(ox, y + 3, 49, 1, '#7d5a38'); });
    for (let k = 0; k < 4; k++) {
      [3, 8].forEach((d) => {
        const x = ox + 12 * k + d, top = 3;
        P.p(x + 1, top, '#fffaf0'); P.p(x, top + 1, '#fffaf0'); P.p(x + 1, top + 1, '#f2ead6'); P.p(x + 2, top + 1, '#d3c6a8');
        P.r(x, top + 2, 1, 13, '#fffaf0'); P.r(x + 1, top + 2, 1, 13, '#f2ead6'); P.r(x + 2, top + 2, 1, 13, '#cdbf9f');
        P.r(x, top + 15, 3, 1, '#9c8c6e'); P.p(x, top + 3, '#ffffff');
        P.r(x + 1, 8, 2, 1, 'rgba(60,40,20,.25)'); P.r(x + 1, 14, 2, 1, 'rgba(60,40,20,.25)');
      });
    }
    for (let k = 0; k <= 4; k++) {
      const x = ox + 12 * k - (k === 4 ? 0 : 0);
      P.r(x, 1, 3, 17, '#d9c9a3'); P.r(x, 1, 1, 17, '#fff4d6'); P.r(x + 2, 1, 1, 17, '#a8946c'); P.r(x, 1, 3, 1, '#ffffff'); P.r(x - 0, 0, 3, 1, '#c8b690'); P.r(x, 17, 3, 1, '#7d6a4c');
      P.p(x + 1, 0, '#fff4d6');
    }
    const r = MK.rng(9); for (let i = 0; i < 10; i++) tuftF(P, ox + Math.floor(r() * 48), 19 + (i % 2));
  });

  S.hedge = sprite(56, 24, 2, 19, (P) => {
    P.r(4, 18, 50, 2, SH); P.r(6, 20, 50, 1, SH2);
    // body: front face
    P.map(2, 9, [], {});
    const r = MK.rng(4);
    for (let i = 0; i < 5; i++) P.sph(4 + i * 11, 13, 7, 6, HEDGE, { bias: -.18 });
    for (let i = 0; i < 4; i++) P.sph(10 + i * 11, 15, 7, 4, HEDGE, { bias: -.35 });
    for (let i = 0; i < 9; i++) P.sph(4 + i * 5.7, 8, 4.2, 4, HEDGE, { bias: .12 });
    // leaf-clump texture
    for (let i = 0; i < 70; i++) {
      const x = 2 + Math.floor(r() * 50), y = 5 + Math.floor(r() * 12), c = r() < .5 ? HEDGE[5] : r() < .5 ? HEDGE[1] : HEDGE[4];
      if (y < 11 || r() < .5) { P.p(x, y, c); if (c === HEDGE[5]) P.p(x + 1, y, HEDGE[4]); }
    }
    P.r(2, 17, 50, 1, HEDGE[0]);
    // berries
    [[8, 12], [22, 14], [36, 11], [46, 14]].forEach(([x, y]) => { P.p(x, y, '#e8392f'); P.p(x + 1, y, '#a8222e'); });
  });

  S.house = sprite(44, 52, 2, 25, (P) => {
    const ox = 2, W = 36;
    // roof (slope toward camera), shingle rows with offset scallops
    for (let y = 0; y < 11; y++) {
      for (let x = 0; x < W; x++) {
        const row = Math.floor(y / 2.2), off = (row & 1) * 3, edge = (x + off) % 6 === 0, lowRow = y % 2 === 1 || (y > 0 && Math.floor((y - 1) / 2.2) !== row);
        let c = y < 2 ? '#e86b57' : '#c9503f';
        if (x < 2 && y < 6) c = '#f08a72';
        if (edge) c = '#9a3436'; else if (lowRow) c = '#aa3c3c';
        if (x > W - 4) c = edge ? '#6e2433' : '#8e2f3a';
        P.p(ox + x, y, c);
      }
    }
    P.r(ox, 0, W, 1, '#ff9a80'); P.r(ox, 10, W, 1, '#5c1d2c');
    // eave shadow on wall
    P.r(ox, 11, W, 1, '#4d1626');
    // wall (siding)
    for (let y = 12; y < 23; y++) for (let x = 0; x < W; x++) {
      let c = (y - 12) % 3 === 2 ? '#d9c79c' : '#f3e6c3'; if (x < 2) c = (y - 12) % 3 === 2 ? '#e8d9b0' : '#fff6dc'; if (x > W - 3) c = (y - 12) % 3 === 2 ? '#bda878' : '#d4c196';
      if (y < 14) c = (x + y) & 1 ? '#c9b788' : '#d9c79c';
      P.p(ox + x, y, c);
    }
    P.r(ox, 23, W, 2, '#8f959c'); for (let x = 0; x < W; x += 4) { P.p(ox + x, 23, '#b8bec4'); P.p(ox + x + 2, 24, '#6b727a'); } P.r(ox, 24, W, 1, '#5b626b');
    // window with shutters
    const wx = ox + 13;
    P.r(wx - 3, 14, 3, 8, '#2f7f84'); P.r(wx - 3, 14, 1, 8, '#4fb0a8'); P.r(wx + 10, 14, 3, 8, '#256a70'); P.r(wx + 11, 14, 1, 8, '#1a5258');
    [16, 19].forEach((y) => { P.r(wx - 2, y, 1, 1, '#1a5258'); P.r(wx + 11, y, 1, 1, '#154a50'); });
    P.r(wx, 13, 10, 10, '#fffaf0'); P.r(wx + 9, 13, 1, 10, '#d3c6a8'); P.r(wx, 22, 10, 1, '#cdbf9f');
    P.r(wx + 1, 14, 8, 8, '#3a7fc0');
    P.r(wx + 1, 14, 8, 3, '#7cc4f0'); P.r(wx + 1, 17, 8, 2, '#5aa6dc'); P.r(wx + 2, 14, 2, 1, '#d6f2ff'); P.p(wx + 2, 15, '#d6f2ff'); P.p(wx + 6, 16, '#bfe6fb'); P.p(wx + 7, 15, '#bfe6fb'); P.p(wx + 3, 18, '#9ad4f6');
    P.r(wx + 4, 14, 1, 8, '#fffaf0'); P.r(wx + 5, 14, 1, 8, '#d3c6a8'); P.r(wx + 1, 18, 8, 1, '#fffaf0'); P.r(wx + 1, 19, 8, 1, '#d3c6a8');
    P.r(wx - 1, 23, 12, 1, '#8f6a45'); P.r(wx - 1, 22, 12, 1, '#c2955f');
    // flower box
    [[1, '#ff7a5e'], [3, '#ffe14d'], [5, '#ff7a5e'], [7, '#ffffff'], [9, '#ffe14d']].forEach(([d, c]) => { P.p(wx + d, 21, '#3f9a45'); P.p(wx + d, 20 + (d > 5 ? 0 : 0), c); });
    // ground shadow (right/below)
    P.r(ox + 2, 25, W + 2, 2, SH); P.r(ox + 5, 27, W - 1, 1, SH2);
    // path stones
    const stone = (x, y, w, h) => { P.r(x + 2, y + h, w, 1, SH); P.sph(x + w / 2, y + h / 2 - .2, w / 2, h / 2, ['#8c8678', '#b3ad9b', '#d6d0bf', '#ece7d8'], { bias: .1 }); };
    stone(ox + 14, 29, 6, 4); stone(ox + 18, 35, 6, 4); stone(ox + 13, 41, 6, 4);
  });

  S.pond = sprite(64, 40, 32, 20, (P) => {
    const cx = 32, cy = 20;
    // sandy shore with dithered grass edge
    const inE = (i, j, rx, ry) => { const u = (i - cx) / rx, v = (j - cy) / ry; return u * u + v * v; };
    for (let j = 0; j < 40; j++) for (let i = 0; i < 64; i++) {
      const dS = inE(i, j, 29, 17.5), dW = inE(i, j, 24.5, 13.5);
      if (dS <= 1) { const edge = bay(i, j) > (1 - dS) * 3.5; if (dS > .78 && !edge) { if (((i + j) & 1) === 0) P.p(i, j, '#c7bf74'); continue; } P.p(i, j, dS > .9 ? '#d8c27a' : (dS > .7 ? '#ead491' : '#f2e0a4')); }
      else if (dS <= 1.12 && ((i + j) & 1) === 0 && bay(i, j) < .6) P.p(i, j, 'rgba(180,160,90,.45)');
      if (dW <= 1) {
        // water bands: darker toward top-left bank (shadowed), lighter in the middle, sparkle bottom-right
        const nx = (i - cx) / 24.5, ny = (j - cy) / 13.5, t = 0.5 + (-nx * 0.25 - ny * 0.35) * -1 + (1 - dW) * 0.5 - 0.45;
        const k = Math.floor((1 - Math.min(1, dW)) * 3.2 + (bay(i, j) - .5) * .9);
        let c = ['#2f7cc0', '#3d92d2', '#58aee4', '#7cc8f0'][Math.max(0, Math.min(3, k))];
        if (dW > .8 && (nx + ny) < -0.35) c = '#26649f'; // bank shadow top-left
        P.p(i, j, c);
        if (dW > .93) P.p(i, j, (nx + ny) < 0 ? '#1f5287' : '#6bb0dc');
      }
    }
    // wet sand ring
    for (let j = 0; j < 40; j++) for (let i = 0; i < 64; i++) { const d = inE(i, j, 25.5, 14.4); if (d > 1 && d < 1.06 && ((i + j) & 1) === 0) P.p(i, j, '#b99f5e'); }
    // ripples
    const ring = (rx, ry, ox, oy, a0, a1, c) => { for (let a = a0; a < a1; a += .09) P.p(Math.round(cx + ox + Math.cos(a) * rx), Math.round(cy + oy + Math.sin(a) * ry), c); };
    ring(6, 2.6, -4, -1, 3.3, 6.28, '#c8ecff'); ring(11, 4.6, -4, -1, 0.2, 3.0, '#a5dcf8'); ring(15, 6.2, -4, -1, 3.6, 5.9, '#8fd0f3');
    ring(4, 1.8, 11, 4, 0, 6.28, '#bfe8fd'); ring(7, 3, 11, 4, 3.4, 5.9, '#9bd8f6');
    [[-4, -1], [11, 4]].forEach(([dx, dy]) => P.p(cx + dx, cy + dy, '#ffffff'));
    // lily pad + sparkle + pebbles/reeds
    P.map(cx + 12, cy - 7, ['.ggg.', 'ggGgg', '.ggg.'], { g: '#4fb04a', G: '#2e8240' }); P.p(cx + 14, cy - 8, '#ff9ab0'); P.p(cx + 15, cy - 8, '#ffe0e8');
    [[-14, -3], [8, -8], [18, 2]].forEach(([dx, dy]) => { P.p(cx + dx, cy + dy, '#ffffff'); P.p(cx + dx - 1, cy + dy, '#d6f2ff'); P.p(cx + dx + 1, cy + dy, '#d6f2ff'); P.p(cx + dx, cy + dy - 1, '#d6f2ff'); P.p(cx + dx, cy + dy + 1, '#d6f2ff'); });
    [[-22, 13], [24, -9], [-18, -13], [26, 11]].forEach(([dx, dy]) => { P.p(cx + dx, cy + dy, '#8f8878'); P.p(cx + dx + 1, cy + dy, '#c4bca8'); P.p(cx + dx, cy + dy - 1, '#e6dfcc'); });
    [[-24, 6], [-26, 8]].forEach(([dx, dy]) => { for (let k = 0; k < 4; k++) P.p(cx + dx, cy + dy - k, k > 2 ? '#7a5a2e' : '#3f9a45'); P.p(cx + dx + 1, cy + dy - 1, '#2a7a38'); });
  });

  S.truck = sprite(28, 26, 14, 21, (P) => {
    P.shadow(15, 20, 12, 3);
    P.r(5, 5, 4, 2, '#14161a'); P.r(19, 5, 4, 2, '#14161a');
    // side face (south)
    P.r(1, 14, 25, 4, '#b87a10'); P.r(1, 14, 25, 1, '#e0a21a'); P.r(1, 17, 25, 1, '#6e4a0c'); P.r(0, 14, 1, 4, '#4a3410'); P.r(26, 14, 1, 4, '#4a3410');
    P.r(11, 14, 1, 4, '#6e4a0c');
    // top face body
    P.r(0, 5, 27, 9, '#4a3410'); P.r(1, 5, 25, 9, '#ffd23a'); P.r(1, 5, 25, 1, '#fff6b0'); P.r(1, 5, 1, 9, '#fff6b0'); P.r(1, 13, 25, 1, '#e0a21a'); P.r(25, 5, 1, 9, '#e0a21a');
    // bed
    P.r(2, 6, 10, 7, '#7a4e2b'); P.r(2, 6, 10, 1, '#a8703f'); P.r(2, 12, 10, 1, '#53331c'); P.r(11, 6, 1, 7, '#53331c');
    for (let k = 0; k < 3; k++) P.r(4 + k * 3, 7, 1, 5, '#6a4224');
    P.map(3, 8, ['rr', 'rR', 'RR'], { r: '#e8392f', R: '#a8222e' }); P.p(3, 8, '#ff7a5e');
    P.r(8, 9, 3, 1, '#c8d0d8'); P.r(8, 10, 3, 1, '#6d7681');
    // cab roof
    P.r(12, 5, 7, 8, '#ffe36a'); P.r(12, 5, 7, 1, '#fff6b0'); P.r(12, 5, 1, 8, '#fff6b0'); P.r(18, 5, 1, 8, '#e0a21a'); P.r(13, 7, 5, 4, '#ffd23a'); P.r(13, 7, 5, 1, '#fff08a');
    // windshield
    P.r(19, 5, 3, 8, '#2f78b8'); P.r(19, 5, 1, 8, '#7cc4f0'); P.p(20, 6, '#d6f2ff'); P.p(20, 7, '#bfe6fb'); P.r(21, 5, 1, 8, '#1f5287');
    P.r(11, 6, 1, 6, '#2f78b8'); P.p(11, 6, '#7cc4f0');
    // hood
    P.r(22, 6, 3, 7, '#ffe36a'); P.r(22, 6, 3, 1, '#fff6b0'); P.p(23, 9, '#fff6b0');
    // bumpers/lights
    P.r(26, 6, 1, 8, '#c8d0d8'); P.p(26, 6, '#ffffff'); P.p(26, 7, '#fff6c0'); P.p(26, 12, '#fff6c0'); P.r(0, 6, 1, 7, '#c8d0d8'); P.p(0, 7, '#e8392f'); P.p(0, 11, '#e8392f');
    const wheel = (cx) => { P.sph(cx, 16, 3.4, 3.4, ['#08090b', '#1a1c21', '#2f333b', '#555b66'], { ol: '#050607' }); P.sph(cx, 16, 1.4, 1.4, ['#6d7480', '#b8c0c8', '#eef2f5'], { ol: false }); };
    wheel(6); wheel(21);
    P.r(14, 15, 1, 2, '#6e4a0c');
  });

  /* ---------- sheet ---------- */
  function blit(g, s, x, y) {
    g.imageSmoothingEnabled = false;
    g.drawImage(s.c, Math.round((x - s.ax * T) / T) * T, Math.round((y - s.ay * T) / T) * T, s.w * T, s.h * T);
  }
  function label(g, txt, x, y) {
    g.save(); g.font = '600 11.5px ui-rounded, "Trebuchet MS", system-ui, sans-serif'; g.textAlign = 'center'; g.textBaseline = 'middle';
    g.lineJoin = 'round'; g.lineWidth = 3.5; g.strokeStyle = 'rgba(16,36,22,.82)'; g.strokeText(txt, x, y); g.fillStyle = '#fff'; g.fillText(txt, x, y); g.restore();
  }

  window.STYLES.push({
    id: 'E', name: 'Chunky Pixel Art',
    blurb: 'Hand-placed 1/4-res pixel sprites (1 art px = 4 screen px) with tight 8-12 colour palettes, banded + dithered shading, selective dark outlines and crisp un-smoothed edges — a deliberately retro RollerCoaster Tycoon / Stardew contrast against the smooth vector lawn.',
    draw(g, MK) {
      const sl = MK.slots, labels = [];
      const put = (k, s, txt, dx, dy, ly, lx) => { const p = sl[k], x = p.x + (dx || 0), y = p.y + (dy || 0); blit(g, s, x, y); labels.push([txt, x + (lx || 0), y + (ly === undefined ? 16 : ly)]); };
      put('kidIdle', S.kidIdle, 'kid idle');
      put('kidScythe', S.kidScythe, 'scythe swing', 24);
      put('kidPush', S.kidPush, 'push mower');
      put('reel', S.reel, 'reel mower');
      put('ride', S.ride, 'ride-on mower');
      put('treeSmall', S.treeSmall, 'small tree');
      put('treeBig', S.treeBig, 'big oak');
      put('rock', S.rock, 'rock');
      ['daisy', 'poppy', 'aster', 'sunflower'].forEach((n, i) => put('flowers', S[n], n, i * 60, 0));
      put('gnome', S.gnome, 'gnome');
      put('gnome', S.ball, 'ball', 55); put('gnome', S.frisbee, 'frisbee', 110); put('gnome', S.stick, 'stick', 165);
      put('fence', S.fence, 'picket fence', 0, 0, 22, 96);
      put('hedge', S.hedge, 'hedge', 0, 0, 22, 96);
      put('house', S.house, 'house + path', 0, 0, 16, 20);
      put('pond', S.pond, 'pond', 0, 0, 70);
      put('truck', S.truck, 'pickup', 0, 0, 22);
      labels.forEach((l) => label(g, l[0], l[1], l[2]));
    },
  });
})();
