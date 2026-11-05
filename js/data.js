/* Lawn Kid — static game data: tools, upgrades, and the 10 lawns.
   Classic script (no modules) so the game runs from file:// and Vercel alike.
   Also loaded by Node tooling (tools/*.js) — keep it DOM-free. */
(function () {
  const M = (globalThis.MOW = globalThis.MOW || {});

  M.CELL = 8;      // world pixels per grass cell
  // Original full-width sweep; smart aim can still trim near protected objects.
  M.SCYTHE = { duration: 0.36, halfArc: 1.25, bladeAngle: 0.50,
    snip: { duration: 0.2, halfArc: 0.10, blade: 0.17, reach: 0.8, stamina: 1.2, cool: 0.03 } };
  M.GRASS_SUBDIV = 8; // sub-cell mowing keeps the cut edge aligned with the deck
  M.MARGIN = 6;    // void cells padded around every lawn
  M.T = { VOID: 0, GRASS: 1, PATH: 2, HOUSE: 3, WATER: 4, SAND: 5, TREE: 6, HEDGE: 7 };
  M.BLOCKED = [1, 0, 0, 1, 1, 1, 1, 1]; // indexed by type

  // Opposite travel lays the blades in opposite directions: two consistent greens.
  M.MOWN_COLORS = { light: '#81b967', dark: '#70a558' };
  M.stripeLight = direction => direction === 1 || direction === 4; // east / north
  M.ROCK_RADIUS = .55;
  M.FLOWER_SCALE = .28;
  M.flowerStems = function (e) {
    const stems = [];
    for (let y = -2; y <= 2; y++) for (let x = -2; x <= 2; x++) {
      if (x * x + y * y > 5) continue;
      const jitter = Math.sin(e.x * 17 + e.y * 31 + x * 13 + y * 7) * .025;
      stems.push({ x: e.x + x * .18 + jitter, y: e.y + y * .18 - jitter, clipped: false });
    }
    return stems;
  };
  M.normalizeEquipment = function (save) {
    save.tools = Object.fromEntries(M.TOOL_ORDER.filter(id => id === 'reel' || save.tools?.[id]).map(id => [id, true]));
    if (!M.TOOL_ORDER.includes(save.tool) || !save.tools[save.tool]) save.tool = 'reel';
    return save;
  };

  /* ---------- Tools ---------- */
  M.TOOL_ORDER = ['reel', 'gas', 'ride'];
  M.TOOLS = {
    reel: {
      id: 'reel', name: 'Push Reel Mower', icon: '🛞', price: 0, powered: false,
      speed: 4.8, turn: 14, accel: 30, decel: 40, power: 1, width: 1.4, cutDepth: .30, r: 0.5,
      desc: 'Quiet, tidy, no fuel. Leaves lovely little stripes.',
      stats: { Speed: 3, Reach: 2, Power: 1, Comfort: 3 },
    },
    gas: {
      id: 'gas', name: 'Gas Push Mower', icon: '⛽', price: 150, powered: true,
      speed: 5.9, turn: 10, accel: 18, decel: 24, power: 2, width: 1.6, cutDepth: .34, r: 0.55,
      desc: 'Cuts thick grass in one pass. Needs fuel — refill at the truck.',
      stats: { Speed: 4, Reach: 3, Power: 3, Comfort: 4 },
    },
    ride: {
      id: 'ride', name: 'Riding Mower', icon: '🚜', price: 400, powered: true,
      speed: 8.6, turn: 3.9, accel: 7, decel: 10, power: 2, width: 2.6, cutDepth: .55, r: 1.0,
      desc: 'Wide deck, big engine, wide turns. The dream machine.',
      stats: { Speed: 5, Reach: 5, Power: 3, Comfort: 5 },
    },
  };

  // Retired equipment is kept for future experiments, outside the playable tools.
  M.RETIRED_TOOLS = {
    scythe: {
      id: 'scythe', name: 'Old Scythe', icon: '🌾', price: 0, powered: false,
      speed: 3.0, turn: 16, accel: 16, decel: 40, power: 1, width: 2.6, r: 0.45,
      desc: 'Grandpa’s scythe. Swing it to snip grass in an arc. Tires you out.',
      stats: { Speed: 2, Reach: 1, Power: 1, Comfort: 1 },
    },
  };

  /* ---------- Upgrades (3 levels each) ---------- */
  M.UPGRADES = [
    { id: 'blades', name: 'Sharp Blades', icon: '🔪', costs: [30, 75, 160],
      desc: ['+10% cutting width', '+20% cutting width', '+30% width & cuts thick grass in one pass'] },
    { id: 'boots', name: 'Sturdy Boots', icon: '🥾', costs: [25, 60, 130],
      desc: ['+7% speed, more stamina', '+14% speed, more stamina', '+21% speed, tons of stamina'] },
    { id: 'tank', name: 'Bigger Fuel Tank', icon: '🛢️', costs: [30, 70, 150],
      desc: ['+40 fuel capacity', '+80 fuel capacity', '+120 fuel & faster refuel'] },
    { id: 'steer', name: 'Smooth Steering', icon: '🎯', costs: [30, 75, 160],
      desc: ['+18% turning', '+36% turning', '+54% turning'] },
    { id: 'eyes', name: 'Eagle Eyes', icon: '🕶️', costs: [20, 55, 120],
      desc: ['Shows missed patches near the end', 'Shows them earlier', 'Spot every missed patch'] },
    { id: 'cards', name: 'Business Cards', icon: '💼', costs: [35, 90, 200],
      desc: ['+8% pay', '+16% pay', '+24% pay'] },
  ];

  /* ---------- Level builder ---------- */
  function makeBuilder(w, h) {
    const MG = M.MARGIN, W = w + MG * 2, H = h + MG * 2;
    const type = new Uint8Array(W * H);
    const thick = new Uint8Array(W * H);
    const ents = [];
    const B = { w, h, W, H, type, thick, ents, spawn: null };
    const code = { ' ': 0, '.': 1, p: 2, H: 3, w: 4, b: 5, T: 6, h: 7 };
    const idx = (x, y) => (y + MG) * W + (x + MG);
    const inb = (x, y) => x >= 0 && y >= 0 && x < w && y < h;
    B.idx = idx;
    B.set = (x, y, ch) => { if (inb(x, y)) type[idx(x, y)] = code[ch]; };
    B.get = (x, y) => (inb(x, y) ? type[idx(x, y)] : 0);
    B.rect = (x, y, rw, rh, ch) => { for (let j = 0; j < rh; j++) for (let i = 0; i < rw; i++) B.set(x + i, y + j, ch); return B; };
    B.ellipse = (cx, cy, rx, ry, ch) => {
      for (let j = Math.floor(cy - ry - 1); j <= Math.ceil(cy + ry + 1); j++)
        for (let i = Math.floor(cx - rx - 1); i <= Math.ceil(cx + rx + 1); i++) {
          const dx = (i + 0.5 - cx) / rx, dy = (j + 0.5 - cy) / ry;
          if (dx * dx + dy * dy <= 1) B.set(i, j, ch);
        }
      return B;
    };
    B.thickRect = (x, y, rw, rh) => { for (let j = 0; j < rh; j++) for (let i = 0; i < rw; i++) if (B.get(x + i, y + j) === 1) thick[idx(x + i, y + j)] = 1; return B; };
    B.thickEllipse = (cx, cy, rx, ry) => {
      for (let j = Math.floor(cy - ry - 1); j <= Math.ceil(cy + ry + 1); j++)
        for (let i = Math.floor(cx - rx - 1); i <= Math.ceil(cx + rx + 1); i++) {
          const dx = (i + 0.5 - cx) / rx, dy = (j + 0.5 - cy) / ry;
          if (dx * dx + dy * dy <= 1 && B.get(i, j) === 1) thick[idx(i, j)] = 1;
        }
      return B;
    };
    // entities use *cell* coords (centre = +0.5)
    const add = (t, x, y, extra) => { ents.push(Object.assign({ t, x: x + 0.5, y: y + 0.5 }, extra || {})); return B; };
    B.tree = (x, y, size) => {
      const s = size || 1;
      // The trunk occupies one cell. The canopy is scenery, not a 3x3/5x5
      // invisible wall: grass underneath and around it remains reachable.
      if (B.get(x, y) === 1 || B.get(x, y) === 2) B.set(x, y, 'T');
      return add('tree', x, y, { size: s, seed: (x * 31 + y * 17) % 7 });
    };
    B.bush = (x, y) => { B.set(x, y, 'h'); return B; };
    B.rock = (x, y) => add('rock', x, y, { seed: (x * 13 + y * 7) % 5, cd: 0 });
    B.flower = (x, y, color) => add('flower', x, y, { color: color == null ? (x * 5 + y * 3) % 4 : color });
    B.flowers = (x, y, fw, fh) => { for (let j = 0; j < fh; j++) for (let i = 0; i < fw; i++) if (B.get(x + i, y + j) === 1) B.flower(x + i, y + j); return B; };
    B.gnome = (x, y) => add('gnome', x, y);
    B.toy = (x, y) => add('toy', x, y, { kind: (x + y) % 3 });
    B.sprinkler = (x, y) => add('sprinkler', x, y, { phase: (x * 0.37 + y * 0.53) % 6 });
    B.spawn_ = null;
    B.spawn = (x, y) => { B.rect(x - 1, y - 1, 3, 2, 'p'); B.spawn_ = { x: x + 0.5, y: y + 0.5 }; return B; };
    return B;
  }

  /* ---------- The 10 lawns ---------- */
  const L = [];

  L.push({
    id: 1, name: 'Mrs. Albright’s Front Yard', owner: 'Mrs. Albright', emoji: '👵',
    quote: '“Oh, you dear! Just the front lawn, please. Mind my tulips!”',
    tip: 'Hold and slide to steer, or use WASD. Your reel mower cuts as you move. Gently edge around flowers; rocks are simply obstacles.',
    w: 22, h: 15, pay: 22, par: 95, rec: 'reel', fence: 'picket', theme: 0,
    build(B) {
      B.rect(0, 0, 22, 15, '.'); B.rect(0, 0, 22, 3, 'H');
      B.rect(10, 3, 2, 12, 'p'); B.spawn(10, 13);
      B.flowers(2, 4, 3, 1); B.flowers(17, 4, 3, 1); B.flowers(3, 5, 1, 1);
      B.toy(15, 9); B.toy(5, 11);
      B.rock(16, 12);
    },
  });

  L.push({
    id: 2, name: 'The Pattersons’', owner: 'Mr. Patterson', emoji: '👨‍🍳',
    quote: '“Kid, I’ll pay extra if the yard looks like a ballpark.”',
    tip: 'Mow in straight, back-and-forth lines for neat stripes — stripes boost your pay!',
    w: 26, h: 18, pay: 32, par: 120, rec: 'reel', fence: 'picket', theme: 1,
    build(B) {
      B.rect(0, 0, 26, 18, '.'); B.rect(0, 0, 11, 5, 'H');
      B.rect(4, 5, 2, 13, 'p'); B.spawn(4, 16);
      B.tree(19, 6); B.tree(22, 13);
      B.flowers(7, 5, 3, 1); B.flowers(12, 1, 3, 2);
      B.rock(12, 10); B.rock(9, 14);
      B.toy(16, 3); B.toy(10, 12); B.gnome(23, 2);
      B.thickRect(14, 14, 6, 3);
    },
  });

  L.push({
    id: 3, name: 'Corner Lot on Maple', owner: 'The Nguyens', emoji: '🧑‍🌾',
    quote: '“We’re hosting a barbecue Saturday. Make it shine!”',
    tip: 'Dark, thick grass takes two passes with a reel mower. Better mowers cut it in one.',
    w: 32, h: 24, pay: 46, par: 150, rec: 'reel', fence: 'hedge', theme: 2,
    build(B) {
      B.rect(0, 0, 32, 11, '.'); B.rect(0, 11, 14, 13, '.');
      B.rect(17, 3, 12, 5, 'H');
      B.rect(14, 8, 2, 3, 'p'); B.rect(5, 11, 2, 13, 'p'); B.spawn(5, 22);
      B.rect(14, 8, 2, 3, 'p');
      B.tree(22, 10); B.tree(4, 5); B.tree(10, 18);
      B.rock(9, 8); B.rock(26, 9); B.rock(8, 20);
      B.flowers(1, 1, 5, 1); B.flowers(18, 9, 4, 1);
      B.thickRect(24, 9, 7, 2); B.thickRect(1, 14, 3, 6);
      B.toy(19, 10); B.toy(12, 14); B.gnome(30, 9); B.gnome(2, 22);
    },
  });

  L.push({
    id: 4, name: 'Old Oak Lane', owner: 'Mr. Okafor', emoji: '🧓',
    quote: '“That oak tree is older than me. Go gently around it.”',
    tip: 'Trees and ponds block you. Plan your lines, then clean up the leftover corners.',
    w: 36, h: 26, pay: 66, par: 180, rec: 'reel', fence: 'picket', theme: 3,
    build(B) {
      B.rect(0, 0, 36, 26, '.'); B.rect(0, 0, 36, 3, 'H');
      B.rect(16, 3, 2, 23, 'p'); B.spawn(16, 24);
      B.tree(8, 12, 2); B.tree(28, 8); B.tree(30, 21); B.tree(3, 22);
      B.ellipse(27, 16, 4.5, 3, 'w');
      B.flowers(5, 9, 7, 1); B.flowers(5, 15, 7, 1); B.flowers(5, 10, 1, 5); B.flowers(11, 10, 1, 5);
      B.rock(22, 12); B.rock(21, 20); B.rock(13, 5); B.rock(33, 12);
      B.thickRect(19, 5, 4, 6); B.thickRect(24, 21, 8, 4);
      B.gnome(2, 4); B.gnome(33, 24); B.toy(20, 8); B.toy(11, 21);
    },
  });

  L.push({
    id: 5, name: 'The Hedge Maze Garden', owner: 'Miss Wimble', emoji: '🧙‍♀️',
    quote: '“My garden is a delicate spiral of delight. Do not hit the hedges.”',
    tip: 'Narrow corridors reward small, nimble mowers. Watch your turns!',
    w: 38, h: 28, pay: 90, par: 215, rec: 'gas', fence: 'hedge', theme: 4,
    build(B) {
      B.rect(0, 0, 38, 28, '.'); B.rect(0, 0, 38, 2, 'H');
      B.rect(0, 8, 29, 1, 'h'); B.rect(9, 15, 29, 1, 'h'); B.rect(0, 22, 29, 1, 'h');
      B.rect(32, 2, 6, 0, 'h');
      B.rect(18, 2, 2, 6, 'p');
      B.rect(33, 21, 2, 7, 'p'); B.spawn(33, 26);
      B.flowers(2, 4, 4, 1); B.flowers(30, 12, 6, 1); B.flowers(3, 19, 5, 1); B.flowers(33, 4, 3, 2);
      B.thickRect(10, 9, 14, 3); B.thickRect(14, 23, 12, 4); B.thickRect(2, 16, 5, 4);
      B.rock(14, 5); B.rock(26, 18); B.rock(6, 12); B.rock(22, 25);
      B.gnome(1, 7); B.gnome(36, 14); B.gnome(27, 21); B.toy(10, 5); B.toy(20, 19); B.toy(8, 26);
      B.bush(30, 6); B.bush(30, 7); B.bush(7, 20);
    },
  });

  L.push({
    id: 6, name: 'Fountain Circle', owner: 'Dr. Castellano', emoji: '👩‍⚕️',
    quote: '“The sprinklers run on a timer, dear. Dodge the spray!”',
    tip: 'Sprinklers soak and slow you. Time your passes between sprays.',
    w: 44, h: 36, pay: 120, par: 260, rec: 'gas', fence: 'hedge', theme: 5,
    build(B) {
      B.ellipse(22, 17.5, 22, 17.5, '.');
      B.rect(0, 33, 44, 3, ' ');
      B.rect(20, 28, 4, 7, 'p'); B.spawn(22, 33);
      B.ellipse(22, 15, 5, 4, 'w'); B.ellipse(22, 15, 7, 6, 'p'); B.ellipse(22, 15, 5, 4, 'w');
      B.ellipse(22, 15, 1.5, 1.2, 'p');
      B.sprinkler(12, 12); B.sprinkler(32, 12); B.sprinkler(14, 24); B.sprinkler(30, 24);
      B.tree(8, 17); B.tree(36, 17); B.tree(22, 4); B.tree(11, 27); B.tree(33, 27);
      B.flowers(15, 6, 3, 1); B.flowers(26, 6, 3, 1); B.flowers(19, 24, 6, 1);
      B.rock(16, 20); B.rock(27, 19); B.rock(22, 9); B.rock(6, 12);
      B.thickEllipse(10, 22, 4, 3); B.thickEllipse(34, 22, 4, 3); B.thickRect(18, 2, 8, 2);
      B.gnome(5, 15); B.gnome(38, 14); B.gnome(22, 1 + 1); B.toy(25, 21); B.toy(14, 9); B.toy(31, 9); B.toy(20, 31);
    },
  });

  L.push({
    id: 7, name: 'Lakeside Estate', owner: 'The Whitmores', emoji: '🎩',
    quote: '“We expect perfection. The lake does not need mowing.”',
    tip: 'Big lawn! A riding mower would sure be nice…',
    w: 50, h: 34, pay: 160, par: 300, rec: 'gas', fence: 'hedge', theme: 6,
    build(B) {
      B.rect(0, 0, 50, 34, '.'); B.rect(28, 0, 22, 7, 'H');
      B.rect(37, 7, 2, 4, 'p');
      B.ellipse(13, 15, 11, 7, 'b'); B.ellipse(13, 15, 9.4, 5.6, 'w');
      B.rect(2, 14, 22, 2, 'p'); B.rect(23, 14, 15, 2, 'p'); B.rect(37, 11, 2, 5, 'p');
      B.rect(36, 30, 3, 4, 'p'); B.spawn(37, 32); B.rect(37, 16, 2, 14, 'p');
      B.tree(4, 4); B.tree(20, 4); B.tree(45, 14); B.tree(4, 29); B.tree(28, 28); B.tree(46, 28); B.tree(26, 10);
      B.flowers(30, 9, 5, 2); B.flowers(41, 9, 6, 1); B.flowers(8, 25, 8, 1); B.flowers(41, 20, 1, 6);
      B.rock(6, 23); B.rock(22, 22); B.rock(33, 20); B.rock(26, 18); B.rock(46, 24); B.rock(12, 4);
      B.thickRect(2, 24, 12, 8); B.thickRect(42, 16, 6, 8); B.thickEllipse(30, 24, 4, 3);
      B.gnome(1, 1); B.gnome(48, 32); B.gnome(23, 31); B.toy(33, 13); B.toy(9, 7); B.toy(18, 26); B.toy(44, 9);
    },
  });

  L.push({
    id: 8, name: 'Hendricks’ Orchard', owner: 'Farmer Hendricks', emoji: '🧑‍🌾',
    quote: '“Rows of apple trees. Straight lines, son. Straight lines.”',
    tip: 'Long straight rows make beautiful stripes. Ride between the trees!',
    w: 56, h: 38, pay: 210, par: 340, rec: 'ride', fence: 'picket', theme: 7,
    build(B) {
      B.rect(0, 0, 56, 38, '.'); B.rect(0, 0, 12, 5, 'H');
      B.rect(4, 5, 3, 33, 'p'); B.spawn(5, 36);
      for (let gy = 0; gy < 3; gy++) for (let gx = 0; gx < 5; gx++) B.tree(15 + gx * 8, 9 + gy * 10);
      B.sprinkler(30, 4); B.sprinkler(50, 20); B.sprinkler(11, 28); B.sprinkler(30, 34);
      B.flowers(14, 1, 6, 1); B.flowers(46, 33, 8, 1);
      B.rock(23, 14); B.rock(41, 24); B.rock(31, 31); B.rock(52, 8); B.rock(18, 34);
      B.thickRect(8, 14, 3, 20); B.thickRect(50, 10, 5, 22); B.thickRect(20, 3, 22, 3);
      B.gnome(54, 36); B.gnome(27, 14); B.gnome(37, 2); B.gnome(10, 20);
      B.toy(27, 12); B.toy(36, 26); B.toy(17, 17); B.toy(45, 5); B.toy(30, 22);
    },
  });

  L.push({
    id: 9, name: 'Country Club Green', owner: 'Mr. Pemberton III', emoji: '🏌️',
    quote: '“The members are watching. Don’t embarrass me, kid.”',
    tip: 'Bunkers, ponds, rough and fairway. Pick the right tool for each patch.',
    w: 60, h: 40, pay: 270, par: 380, rec: 'ride', fence: 'hedge', theme: 8,
    build(B) {
      B.ellipse(30, 21, 30, 19, '.'); B.ellipse(14, 22, 14, 14, '.'); B.ellipse(48, 17, 12, 14, '.');
      B.rect(24, 0, 14, 5, 'H');
      B.rect(30, 5, 2, 8, 'p'); B.spawn(31, 36); B.rect(30, 14, 2, 22, 'p');
      B.rect(31, 5, 2, 0, 'p');
      B.ellipse(44, 26, 6, 3.5, 'b'); B.ellipse(16, 28, 5, 3, 'b'); B.ellipse(20, 13, 3.5, 2.5, 'b');
      B.ellipse(48, 10, 5, 3.2, 'w'); B.ellipse(8, 18, 4, 3, 'w');
      B.tree(14, 7); B.tree(46, 6); B.tree(55, 20); B.tree(6, 28); B.tree(24, 33); B.tree(38, 34); B.tree(40, 14); B.tree(20, 21);
      B.sprinkler(24, 10); B.sprinkler(38, 22); B.sprinkler(12, 14); B.sprinkler(52, 26); B.sprinkler(26, 28);
      B.thickEllipse(8, 24, 8, 8); B.thickEllipse(54, 14, 6, 10); B.thickRect(12, 34, 12, 4); B.thickRect(41, 31, 12, 5);
      B.flowers(26, 5, 3, 1); B.flowers(34, 5, 3, 1); B.flowers(33, 26, 5, 1); B.flowers(18, 30, 3, 2);
      B.rock(22, 16); B.rock(36, 17); B.rock(50, 22); B.rock(12, 11); B.rock(28, 24); B.rock(44, 33);
      B.gnome(3, 22); B.gnome(57, 18); B.gnome(30, 38); B.gnome(14, 33); B.gnome(40, 9);
      B.toy(30, 16); B.toy(20, 26); B.toy(46, 20); B.toy(26, 20); B.toy(10, 8); B.toy(36, 28);
    },
  });

  L.push({
    id: 10, name: 'The Mayor’s Mansion', owner: 'Mayor Goldsworthy', emoji: '🏛️',
    quote: '“The whole town will see this lawn. Make me proud, Lawn Kid.”',
    tip: 'The grand finale. Use everything you’ve learned!',
    w: 64, h: 44, pay: 360, par: 440, rec: 'ride', fence: 'hedge', theme: 9,
    build(B) {
      B.rect(0, 0, 64, 44, '.'); B.rect(14, 0, 36, 8, 'H');
      B.rect(30, 8, 4, 36, 'p'); B.spawn(31, 42);
      B.rect(30, 21, 4, 2, 'p');
      B.ellipse(32, 22, 6.5, 5.5, 'p'); B.ellipse(32, 22, 4.5, 3.6, 'w'); B.ellipse(32, 22, 1.2, 1, 'p');
      // symmetrical garden fountains
      for (const sx of [-1, 1]) {
        const cx = 32 + sx * 18;
        B.ellipse(cx, 22, 5.5, 4.6, 'p'); B.ellipse(cx, 22, 3.6, 3, 'w');
        // hedge frames
        const hx = sx < 0 ? 4 : 52;
        B.rect(hx, 12, 8, 1, 'h'); B.rect(hx, 33, 8, 1, 'h'); B.rect(hx, 12, 1, 22, 'h'); B.rect(hx + 7, 12, 1, 22, 'h');
        B.rect(hx + 3, 12, 2, 1, '.'); B.rect(hx + 3, 33, 2, 1, '.');
        B.rect(hx + 7, 20, 1, 4, '.'); B.rect(hx, 20, 1, 4, '.');
        B.flowers(sx < 0 ? 5 : 53, 14, 6, 1); B.flowers(sx < 0 ? 5 : 53, 31, 6, 1);
        B.tree(sx < 0 ? 8 : 55, 3); B.tree(sx < 0 ? 5 : 58, 40);
        B.tree(sx < 0 ? 22 : 41, 12); B.tree(sx < 0 ? 22 : 41, 33);
        B.bush(sx < 0 ? 13 : 50, 12); B.bush(sx < 0 ? 13 : 50, 33);
        B.sprinkler(sx < 0 ? 24 : 39, 28); B.sprinkler(sx < 0 ? 14 : 49, 27);
        B.sprinkler(sx < 0 ? 18 : 45, 8);
        B.thickRect(sx < 0 ? 1 : 56, 20, 5, 12); B.thickRect(sx < 0 ? 16 : 41, 36, 9, 6);
        B.gnome(sx < 0 ? 6 : 57, 22); B.gnome(sx < 0 ? 26 : 37, 40);
        B.rock(sx < 0 ? 20 : 43, 24); B.rock(sx < 0 ? 27 : 36, 15); B.rock(sx < 0 ? 10 : 53, 38);
        B.toy(sx < 0 ? 24 : 39, 36); B.toy(sx < 0 ? 12 : 51, 10);
      }
      B.flowers(24, 9, 5, 1); B.flowers(35, 9, 5, 1); B.flowers(28, 27, 2, 3); B.flowers(34, 27, 2, 3);
      B.gnome(32, 17);
      B.thickEllipse(32, 32, 7, 3);
    },
  });

  M.LEVELS = L;

  /* Build & cache the immutable layout of a level. */
  const cache = {};
  M.buildLevel = function (index) {
    if (cache[index]) return cache[index];
    const def = L[index];
    const B = makeBuilder(def.w, def.h);
    def.build(B);
    // spawn
    const MG = M.MARGIN;
    const sp = B.spawn_ || { x: 2.5, y: 2.5 };
    const lv = {
      def, index, W: B.W, H: B.H, type: B.type, thick: B.thick, ents: B.ents,
      spawn: { x: sp.x + MG, y: sp.y + MG },
    };
    for (const e of lv.ents) { e.x += MG; e.y += MG; }
    // reachable grass via flood fill from spawn (4-neighbour over walkable cells)
    const seen = new Uint8Array(lv.W * lv.H);
    const q = [Math.floor(lv.spawn.y) * lv.W + Math.floor(lv.spawn.x)];
    seen[q[0]] = 1;
    for (let h = 0; h < q.length; h++) {
      const i = q[h], x = i % lv.W, y = (i / lv.W) | 0;
      for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
        const nx = x + dx, ny = y + dy; if (nx < 0 || ny < 0 || nx >= lv.W || ny >= lv.H) continue;
        const ni = ny * lv.W + nx; if (seen[ni] || M.BLOCKED[lv.type[ni]]) continue;
        seen[ni] = 1; q.push(ni);
      }
    }
    lv.reach = seen;
    lv.protected = new Uint8Array(lv.W * lv.H);
    // Flower beds and the rock itself are not part of the mowing contract.
    // Their neighboring lawn cells still count and can be carefully edged.
    for (const e of lv.ents) if (e.t === 'flower' || e.t === 'rock') {
      lv.protected[Math.floor(e.y) * lv.W + Math.floor(e.x)] = 1;
    }
    const N=M.GRASS_SUBDIV,count=N*N,rocks=lv.ents.filter(e=>e.t==='rock');
    lv.mowableSamples=new Uint8Array(lv.W*lv.H*count);
    let total = 0, unreachable = 0;
    for(let i=0;i<lv.type.length;i++){
      if(lv.type[i]!==M.T.GRASS||lv.protected[i])continue;
      if(!seen[i]){unreachable++;continue;}
      const cx=i%lv.W,cy=Math.floor(i/lv.W);
      const near=rocks.filter(e=>Math.hypot(e.x-cx-.5,e.y-cy-.5)<1.5);
      for(let y=0;y<N;y++)for(let x=0;x<N;x++){
        const X=cx+(x+.5)/N,Y=cy+(y+.5)/N;
        if(near.some(e=>Math.hypot(e.x-X,e.y-Y)<.70))continue;
        lv.mowableSamples[i*count+y*N+x]=1;total+=1/count;
      }
    }
    lv.total = total; lv.unreachable = unreachable;
    cache[index] = lv;
    return lv;
  };
})();
