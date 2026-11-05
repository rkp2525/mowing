/* Groundskeeping: immutable rough-patch layouts, per-job treatment, and shared garden art. */
(function () {
  const M = globalThis.MOW = globalThis.MOW || {}, layouts = new WeakMap();
  function layout(lv) {
    if (layouts.has(lv)) return layouts.get(lv);
    const candidates = [], count = M.GRASS_SUBDIV ** 2;
    for (let y = 1; y < lv.H - 2; y++) for (let x = 1; x < lv.W - 2; x++) {
      const cells = [y * lv.W + x, y * lv.W + x + 1, (y + 1) * lv.W + x, (y + 1) * lv.W + x + 1];
      if (!cells.every(i => lv.type[i] === M.T.GRASS && lv.reach[i] && !lv.protected[i] && lv.mowableSamples.slice(i * count, (i + 1) * count).every(Boolean))) continue;
      let clear = true;
      for (let dy = -1; dy <= 2; dy++) for (let dx = -1; dx <= 2; dx++) if (M.BLOCKED[lv.type[(y + dy) * lv.W + x + dx]]) clear = false;
      if (!clear) continue;
      if (lv.ents.some(e => Math.hypot(e.x - x - 1, e.y - y - 1) < 2.3)) continue;
      const distance = Math.hypot(lv.spawn.x - x - 1, lv.spawn.y - y - 1);
      if (distance < 4) continue;
      candidates.push({ x, y, distance });
    }
    // Put the first patch near the arrival route; distribute the rest across the lawn.
    candidates.sort((a, b) => a.distance - b.distance || a.y - b.y || a.x - b.x);
    const patches = [];
    for (const p of candidates) {
      if (patches.some(other => Math.hypot(other.x - p.x, other.y - p.y) < 6)) continue;
      patches.push({ x: p.x, y: p.y });
      if (patches.length >= 2 + Math.floor(lv.index / 3)) break;
    }
    layouts.set(lv, patches); return patches;
  }
  function create(lv) {
    return layout(lv).map(p => {
      const samples = [];
      for (let y = 0; y < 8; y++) for (let x = 0; x < 8; x++) samples.push({ x: p.x + (x + .5) / 4, y: p.y + (y + .5) / 4, treated: false, growth: 0 });
      return { x: p.x, y: p.y, samples };
    });
  }
  function mowed(s, sample) {
    const N = M.GRASS_SUBDIV, x = Math.floor(sample.x), y = Math.floor(sample.y);
    const sub = (y * s.W + x) * N * N + Math.floor((sample.y - y) * N) * N + Math.floor((sample.x - x) * N);
    return s.subGrass[sub] === 0;
  }
  function spread(s) {
    let treated = 0, uncut = false;
    for (const patch of s.roughPatches) for (const sample of patch.samples) {
      if (sample.treated || Math.hypot(sample.x - s.p.x, sample.y - s.p.y) > 1.05) continue;
      if (!mowed(s, sample)) { uncut = true; continue; }
      sample.treated = true; treated++;
    }
    return { treated, uncut };
  }
  function step(s, dt) {
    for (const patch of s.roughPatches) for (const sample of patch.samples) if (sample.treated) sample.growth = Math.min(1, sample.growth + dt / 5);
  }
  function progress(s) {
    const patches = s.roughPatches || [];
    const treated = patches.reduce((n, p) => n + p.samples.filter(sample => sample.treated).length, 0);
    const total = patches.reduce((n, p) => n + p.samples.length, 0);
    return { treated, total, fraction: total ? treated / total : 0, restored: patches.filter(p => p.samples.every(sample => sample.treated)).length };
  }
  function draw(g, s) {
    const C = M.CELL;
    for (const patch of s.roughPatches || []) {
      // Fill connected soil shapes once per growth band, avoiding a grid of overlapping dots.
      for (let band = 0; band < 8; band++) {
        g.beginPath(); let any = false;
        for (const sample of patch.samples) {
          if (Math.floor(sample.growth * 8) !== band) continue;
          const jitter = Math.sin(sample.x * 31 + sample.y * 19), x = (sample.x + jitter * .045) * C, y = (sample.y - jitter * .035) * C;
          const rx = C * (.19 + jitter * .025), ry = C * (.17 - jitter * .02);
          g.moveTo(x + rx, y); g.ellipse(x, y, rx, ry, jitter, 0, Math.PI * 2); g.closePath(); any = true;
        }
        if (any) { g.fillStyle = `rgba(161,130,74,${(1 - band / 8) * .5})`; g.fill(); }
      }
      for (const sample of patch.samples) {
        const seed = Math.sin(sample.x * 31 + sample.y * 19), x = (sample.x + seed * .04) * C, y = (sample.y - seed * .03) * C, growth = sample.growth;
        g.strokeStyle = growth > .5 ? 'rgba(91,146,66,.7)' : 'rgba(190,177,103,.7)';
        g.lineWidth = .13; g.beginPath(); g.moveTo(x - .25, y + .2); g.lineTo(x - .3 + seed * .2, y - .55 - growth * .45); g.moveTo(x + .3, y); g.lineTo(x + .6, y - .4 - growth * .35); g.stroke();
        if (sample.treated && growth < 1) { g.fillStyle = 'rgba(235,222,175,.8)'; g.fillRect(x - .12, y, .24, .24); }
      }
    }
  }
  M.Groundskeeping = { layout, create, spread, step, progress, draw };
})();
