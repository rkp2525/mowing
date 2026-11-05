const assert = require('node:assert/strict'), M = require('./load.js');
const dt = 1 / 120, samples = M.GRASS_SUBDIV ** 2;
function lawn() {
  const s = M.Sim.create(0, {}, 'trimmer');
  s.type = new Uint8Array(s.type.length).fill(M.T.GRASS); s.ents = [];
  s.grass.fill(1); s.subGrass.fill(1); s.subRemaining.fill(samples); s.remaining = s.total = s.grass.length;
  s.p.x = s.p.y = 15.5; s.p.heading = 0;
  return s;
}
function run(s, n, input = {}) { const events = []; for (let i = 0; i < n; i++) events.push(...M.Sim.step(s, { mx: 0, my: 0, ...input }, dt)); return events; }
function test(name, fn) { fn(); console.log('PASS ' + name); }
test('Trimmer pickup and return require the truck; the scythe remains retired', () => {
  const s = M.Sim.create(0, {}, 'reel'); s.p.x += 6;
  assert.equal(M.Sim.setTool(s, 'trimmer'), false);
  s.p.x -= 6; assert.equal(M.Sim.setTool(s, 'trimmer'), true);
  s.p.x += 6; assert.equal(M.Sim.setTool(s, 'gas'), false);
  assert.equal(M.TOOLS.scythe, undefined); assert.ok(!M.TOOL_ORDER.includes('trimmer'));
});
test('Walking never trims; one fresh press makes one snip even while held', () => {
  const s = lawn(), before = s.remaining;
  run(s, 60, { mx: 1 }); assert.equal(s.remaining, before);
  const events = run(s, 60, { act: true }); assert.equal(events.filter(e => e.e === 'snip').length, 1);
  assert.ok(s.remaining < before); const after = s.remaining;
  run(s, 180, { act: true, mx: 1 }); assert.equal(s.remaining, after); assert.equal(s.sw, null);
  run(s, 1); assert.equal(run(s, 1, { act: true }).filter(e => e.e === 'snip').length, 1);
});
test('A snip cuts only the narrow rectangle in front and cannot sweep behind the player', () => {
  const s = lawn(), x = s.p.x, y = s.p.y;
  run(s, 30, { act: true }); let cut = 0;
  for (let i = 0; i < s.grass.length; i++) for (let k = 0; k < samples; k++) if (!s.subGrass[i * samples + k]) {
    const X = i % s.W + (k % M.GRASS_SUBDIV + .5) / M.GRASS_SUBDIV;
    const Y = Math.floor(i / s.W) + (Math.floor(k / M.GRASS_SUBDIV) + .5) / M.GRASS_SUBDIV;
    assert.ok(X >= x + s.ts.r + .35 - s.ts.cutDepth && X <= x + s.ts.r + .35 + s.ts.cutDepth);
    assert.ok(Math.abs(Y - y) <= s.ts.width / 2); cut++;
  }
  assert.ok(cut > 0);
});
test('Precision snips gently clip only overlapping flower stems', () => {
  const s = lawn(), flower = { t: 'flower', x: s.p.x + .7, y: s.p.y + .5, alive: true };
  flower.stems = M.flowerStems(flower); s.ents = [flower]; run(s, 30, { act: true });
  const clipped = flower.stems.filter(stem => stem.clipped).length;
  assert.ok(clipped > 0 && clipped < flower.stems.length); assert.equal(flower.alive, true);
  assert.ok(Math.abs(s.flowersLost - clipped / flower.stems.length) < 1e-9);
  const loss = s.flowersLost; run(s, 1); run(s, 30, { act: true }); assert.equal(s.flowersLost, loss);
});
