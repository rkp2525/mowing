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
        if (needFuel ? i === spawnI : (s.grass[i] && h >= (s.ts.id === 'scythe' ? 2 : 1)) || (h === 0 && s.grass[i] && s.ts.id !== 'scythe')) { goal = i; break; }
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
    // scythe aim: pick the safe direction that cuts the most uncut grass within reach
    function bestAim() {
      const p = s.p, R = s.ts.width * .95, N = M.GRASS_SUBDIV, cnt = N * N, tg = [];
      for (let cy = Math.max(0, Math.floor(p.y - R)); cy <= Math.min(H - 1, Math.ceil(p.y + R)); cy++)
        for (let cx = Math.max(0, Math.floor(p.x - R)); cx <= Math.min(W - 1, Math.ceil(p.x + R)); cx++) {
          const ci = cy * W + cx; if (!s.grass[ci] || !s.subRemaining[ci]) continue;
          for (let y = 0; y < N; y += 2) for (let x = 0; x < N; x += 2) {
            if (!s.subGrass[ci * cnt + y * N + x]) continue;
            const X = cx + (x + .5) / N, Y = cy + (y + .5) / N, dx = X - p.x, dy = Y - p.y, d = Math.hypot(dx, dy);
            if (d > R - .08 || d < .1) continue;
            let clear = true;
            for (let j = 1, n = Math.ceil(d / .25); j <= n && clear; j++) {
              const qx = Math.floor(p.x + dx * j / n), qy = Math.floor(p.y + dy * j / n);
              if (M.BLOCKED[s.type[qy * W + qx]]) clear = false;
            }
            if (clear) tg.push(Math.atan2(dy, dx));
          }
        }
      let best = null, bs = 0;
      for (let k = 0; k < 16; k++) {
        const a = k * Math.PI / 8; let bad = false;
        for (const rk of rocks) {
          const dx = rk.x - p.x, dy = rk.y - p.y, d = Math.hypot(dx, dy);
          if (d - .55 > R) continue;
          let da = Math.atan2(dy, dx) - a; da = Math.atan2(Math.sin(da), Math.cos(da));
          if (d <= .55 || Math.abs(da) <= 1.25 + .5 + Math.asin(Math.min(1, .55 / d)) + .05) { bad = true; break; }
        }
        if (bad) continue;
        let c = 0;
        for (const ang of tg) { let da = ang - a; da = Math.atan2(Math.sin(da), Math.cos(da)); if (Math.abs(da) < 1.7) c++; }
        if (c > bs) { bs = c; best = a; }
      }
      return best;
    }
    self.input = function (dt) {
      const p = s.p;
      const swing = s.ts.id === 'scythe' && !s.sw && s.swCool <= 0 && !s.actWasDown;
      self.repath -= dt;
      if (self.repath <= 0 || !self.path.length) { plan(); self.repath = 0.35; }
      while (self.path.length && Math.hypot((self.path[0] % W) + 0.5 - p.x, ((self.path[0] / W) | 0) + 0.5 - p.y) < (s.ts.id === 'scythe' ? 0.3 : 0.7)) self.path.shift();
      const aim = s.ts.id === 'scythe' ? bestAim() : undefined, doSwing = swing && (s.ts.id !== 'scythe' || aim != null);
      if (!self.path.length) return { mx: 0, my: 0, act: doSwing, aim: aim == null ? undefined : aim };
      const i = self.path[Math.min(1, self.path.length - 1)];
      const tx = (i % W) + 0.5 - p.x, ty = ((i / W) | 0) + 0.5 - p.y, d = Math.hypot(tx, ty) || 1;
      return { mx: tx / d, my: ty / d, act: doSwing, aim: aim == null ? undefined : aim };
    };
    return self;
  }
  M.Bot = Bot;
})();
