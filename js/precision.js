/* Validated Precision-mode controls: slow local steering and a short blade-path preview. */
(function () {
  const M = globalThis.MOW = globalThis.MOW || {};
  const SPEED = .30, TURN_RATE = 65 * Math.PI / 180;
  const clamp = value => Math.max(-1, Math.min(1, Number.isFinite(value) ? value : 0));
  const angleDelta = (from, to) => Math.atan2(Math.sin(to - from), Math.cos(to - from));
  function available(tool) { return M.TOOL_ORDER.includes(tool) || tool === 'trimmer'; }
  function resolve(heading, input, dt) {
    let forward = clamp(input.forward);
    if (Number.isFinite(input.aim)) {
      const delta = angleDelta(heading, input.aim), amount = Math.min(Math.abs(delta), TURN_RATE * dt);
      heading += Math.sign(delta) * amount;
      // A pointer-directed turn lines up before moving forward, avoiding a curved run-up.
      forward = Math.abs(angleDelta(heading, input.aim)) < 4 * Math.PI / 180 ? Math.max(0, clamp(input.advance)) : 0;
    } else heading += clamp(input.turn) * TURN_RATE * dt;
    return { heading, forward };
  }
  function preview(s) {
    const p = s.p, T = s.ts, hx = Math.cos(p.heading), hy = Math.sin(p.heading);
    let travel = T.width * .75;
    const steps = Math.ceil(travel / .05);
    for (let n = 1; n <= steps; n++) {
      const d = Math.min(travel, n * .05);
      if (M.Sim.collides(s, p.x + hx * d, p.y + hy * d, T.r)) { travel = (n - 1) * .05; break; }
    }
    const near = T.r + .35 - T.cutDepth, far = T.r + .35 + T.cutDepth + travel;
    const contains = (x, y) => {
      const dx = x - p.x, dy = y - p.y, along = dx * hx + dy * hy, side = -dx * hy + dy * hx;
      return along >= near && along <= far && Math.abs(side) <= T.width / 2 && M.Sim.bladeClear(s, x, y);
    };
    const danger = s.ents.some(e => e.t === 'flower' && e.alive && e.stems.some(stem => !stem.clipped && contains(stem.x, stem.y)));
    return { near, far, width: T.width, danger, contains };
  }
  M.Precision = { SPEED, TURN_RATE, available, resolve, preview };
})();
