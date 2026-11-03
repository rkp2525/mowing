/* Lawn Kid — simple mowing bot. Used by balance tooling (Node) and ?auto=1 demos. */
(function () {
  const M = (globalThis.MOW = globalThis.MOW || {});

  function Bot(s) {
    const self = { s, path: [], repath: 0, goal: null, inflate: null };
    const W = s.W, H = s.H, r = s.ts.r;
    const rocks = s.ents.filter((e) => e.t === 'rock');
    function walk(cx, cy) { if (M.Sim.collides(s, cx + 0.5, cy + 0.5, r + 0.05)) return false; for (const k of rocks) if (Math.abs(k.x - cx - 0.5) < 1.1 && Math.abs(k.y - cy - 0.5) < 1.1) return false; return true; }
    let toolId = s.tool, walkable = null;
    function buildWalk() {
      walkable = new Uint8Array(W * H);
      for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) walkable[y * W + x] = walk(x, y) ? 1 : 0;
      toolId = s.tool;
    }
    buildWalk();
    function plan() {
      if (toolId !== s.tool) buildWalk();
      const p = s.p, sx = Math.floor(p.x), sy = Math.floor(p.y);
      const dist = new Int32Array(W * H).fill(-1), prev = new Int32Array(W * H).fill(-1);
      const q = [sy * W + sx]; dist[q[0]] = 0;
      const needFuel = s.ts.powered && s.fuel < 22;
      const spawnI = Math.floor(s.lv.spawn.y) * W + Math.floor(s.lv.spawn.x);
      let goal = -1;
      // prefer continuing in the current heading: bias by scanning neighbours in heading order
      const hx = Math.cos(p.heading), hy = Math.sin(p.heading);
      const dirs = [[1, 0], [-1, 0], [0, 1], [0, -1]].sort((a, b) => (b[0] * hx + b[1] * hy) - (a[0] * hx + a[1] * hy));
      for (let h = 0; h < q.length; h++) {
        const i = q[h], x = i % W, y = (i / W) | 0;
        if (needFuel ? i === spawnI : (s.grass[i] && h > 0) || (h === 0 && s.grass[i])) { goal = i; break; }
        for (const [dx, dy] of dirs) {
          const nx = x + dx, ny = y + dy; if (nx < 0 || ny < 0 || nx >= W || ny >= H) continue;
          const ni = ny * W + nx; if (dist[ni] >= 0 || !walkable[ni]) continue;
          dist[ni] = dist[i] + 1; prev[ni] = i; q.push(ni);
        }
      }
      self.path = [];
      if (goal < 0) { self.goal = null; return; }
      for (let i = goal; i >= 0 && i !== q[0]; i = prev[i]) self.path.push(i);
      self.path.reverse(); self.goal = goal;
    }
    self.input = function (dt) {
      const p = s.p;
      const swing = s.ts.id === 'scythe' && !s.sw && s.swCool <= 0 && !s.actWasDown;
      self.repath -= dt;
      if (self.repath <= 0 || !self.path.length) { plan(); self.repath = 0.35; }
      while (self.path.length && Math.hypot((self.path[0] % W) + 0.5 - p.x, ((self.path[0] / W) | 0) + 0.5 - p.y) < 0.7) self.path.shift();
      if (!self.path.length) return { mx: 0, my: 0, act: swing };
      const i = self.path[Math.min(1, self.path.length - 1)];
      const tx = (i % W) + 0.5 - p.x, ty = ((i / W) | 0) + 0.5 - p.y, d = Math.hypot(tx, ty) || 1;
      return { mx: tx / d, my: ty / d, act: swing };
    };
    return self;
  }
  M.Bot = Bot;
})();
