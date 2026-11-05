#!/usr/bin/env node
// Check required mowing samples against real mower deck geometry, solid obstacles,
// and intact flower stems. This audits reachability, independently of the demo bot.
const assert = require('node:assert/strict'), M = require('./load.js');
const levels = process.argv.includes('--all') ? M.LEVELS.map((_, i) => i) : [0, 1];
const N = M.GRASS_SUBDIV, count = N * N;
for (const level of levels) {
  const s = M.Sim.create(level, {}, 'reel'), missing = [];
  let checked = 0;
  const reach = s.ts.r + .35, half = s.ts.width / 2;
  for (let i = 0; i < s.grass.length; i++) {
    if (!s.grass[i]) continue;
    const cx = i % s.W, cy = Math.floor(i / s.W);
    const flowers = s.ents.filter(e => e.t === 'flower' && Math.hypot(e.x - cx - .5, e.y - cy - .5) < 2.5);
    const safe = (x, y) => {
      for (let angle = 0; angle < 64; angle++) {
        const heading = angle * Math.PI / 32, hx = Math.cos(heading), hy = Math.sin(heading);
        for (const side of [0, -.5 * half, .5 * half, -.95 * half, .95 * half]) for (const depth of [0, -.95 * s.ts.cutDepth, .95 * s.ts.cutDepth]) {
          s.p.x = x - hx * (reach + depth) + hy * side;
          s.p.y = y - hy * (reach + depth) - hx * side;
          s.p.heading = heading;
          if (M.Sim.collides(s, s.p.x, s.p.y, s.ts.r)) continue;
          const fp = M.Sim.makeFootprint(s);
          if (!fp(x, y, 0)) continue;
          if (flowers.some(e => e.stems.some(stem => fp(stem.x, stem.y, 0)))) continue;
          return true;
        }
      }
      return false;
    };
    for (let y = 0; y < N; y++) for (let x = 0; x < N; x++) {
      if (!s.subGrass[i * count + y * N + x]) continue;
      checked++;
      if (!safe(cx + (x + .5) / N, cy + (y + .5) / N)) missing.push([cx + (x + .5) / N, cy + (y + .5) / N]);
    }
  }
  console.log(`Level ${level + 1}: ${checked} required samples; ${missing.length} unreachable without clipping flowers`);
  assert.equal(missing.length, 0, JSON.stringify(missing.slice(0, 10)));
}
