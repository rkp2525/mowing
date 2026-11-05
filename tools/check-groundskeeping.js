#!/usr/bin/env node
const assert = require('node:assert/strict'), M = require('./load.js');
const step = (s, act = false, dt = 1 / 60) => M.Sim.step(s, { mx: 0, my: 0, act }, dt);
function test(name, fn) { fn(); console.log('PASS ' + name); }
function prepared() {
  const s = M.Sim.create(0, {}, 'reel');
  s.type = new Uint8Array(s.type); s.ents = [];
  assert.ok(M.Sim.setTool(s, 'fertilizer'));
  s.subGrass.fill(0); s.subRemaining.fill(0); s.grass.fill(0); s.remaining = 0;
  const patch = s.roughPatches[0]; s.p.x = patch.x + 1; s.p.y = patch.y + 1;
  return s;
}
test('All ten lawns have separate, reachable rough patches on mowable grass', () => {
  for (let level = 0; level < 10; level++) {
    const a = M.Sim.create(level, {}), b = M.Sim.create(level, {});
    assert.ok(a.roughPatches.length >= 2);
    for (const patch of a.roughPatches) for (const sample of patch.samples) {
      const i = Math.floor(sample.y) * a.W + Math.floor(sample.x);
      assert.equal(a.type[i], M.T.GRASS); assert.ok(a.lv.reach[i]); assert.equal(a.protected[i], 0);
      assert.ok(!M.Sim.collides(a, sample.x, sample.y, M.TOOLS.fertilizer.r));
      assert.equal(sample.treated, false); assert.equal(sample.growth, 0);
    }
    a.roughPatches[0].samples[0].treated = true;
    assert.equal(b.roughPatches[0].samples[0].treated, false);
  }
});
test('Fertilizer can only be picked up or put away at the truck', () => {
  const s = M.Sim.create(0, {}, 'reel');
  s.p.x += 6; assert.equal(M.Sim.setTool(s, 'fertilizer'), false); assert.equal(s.tool, 'reel');
  s.p.x -= 6; assert.equal(M.Sim.setTool(s, 'fertilizer'), true);
  s.p.x += 6; assert.equal(M.Sim.setTool(s, 'reel'), false); assert.equal(s.tool, 'fertilizer');
});
test('One press scatters locally; walking or holding never disperses more fertilizer', () => {
  const s = prepared(), before = s.remaining;
  for (let i = 0; i < 90; i++) step(s);
  assert.equal(M.Groundskeeping.progress(s).treated, 0);
  const events = step(s, true), progress = M.Groundskeeping.progress(s);
  assert.equal(events.filter(e => e.e === 'fertilize').length, 1);
  assert.ok(progress.treated > 0 && progress.treated < s.roughPatches[0].samples.length);
  for (const patch of s.roughPatches) for (const sample of patch.samples) if (sample.treated) assert.ok(Math.hypot(sample.x - s.p.x, sample.y - s.p.y) <= 1.05);
  for (let i = 0; i < 120; i++) step(s, true);
  assert.equal(M.Groundskeeping.progress(s).treated, progress.treated); assert.equal(s.remaining, before);
});
test('Unmown rough grass must be mowed before feeding, and mowers cannot scatter', () => {
  const s = prepared(); s.subGrass.fill(1);
  assert.ok(step(s, true).some(e => e.e === 'fertilize' && e.uncut && !e.treated));
  assert.equal(M.Groundskeeping.progress(s).treated, 0);
  const mower = M.Sim.create(0, {}, 'reel'); step(mower, true);
  assert.equal(M.Groundskeeping.progress(mower).treated, 0);
});
test('Repeat doses cannot overfeed, damage flowers, or charge money; treated grass greens gradually', () => {
  const s = prepared(), flower = { t: 'flower', x: s.p.x, y: s.p.y, alive: true };
  flower.stems = M.flowerStems(flower); s.ents = [flower];
  const score = M.Sim.score(s); step(s, true); const first = M.Groundskeeping.progress(s).treated;
  for (let i = 0; i < 20; i++) { step(s, false, .4); step(s, true); }
  assert.equal(M.Groundskeeping.progress(s).treated, first); assert.equal(s.flowersLost, 0);
  assert.ok(flower.stems.every(stem => !stem.clipped));
  assert.ok(s.roughPatches[0].samples.filter(sample => sample.treated).every(sample => sample.growth === 1));
  assert.equal(M.Sim.score(s).fines, score.fines); assert.ok(M.Sim.score(s).bonusGrounds > score.bonusGrounds);
});
test('Walking with fertilizer stops immediately and never cuts grass', () => {
  const s = prepared(); s.subGrass.fill(1); s.subRemaining.fill(M.GRASS_SUBDIV ** 2); s.grass.fill(1); s.remaining = s.total;
  const before = s.remaining;
  for (let i = 0; i < 60; i++) M.Sim.step(s, { mx: 1, my: 0 }, 1 / 60);
  const x = s.p.x, y = s.p.y; step(s);
  assert.equal(s.p.x, x); assert.equal(s.p.y, y); assert.equal(s.remaining, before);
});
test('Groundskeeping after mowing preserves the speed rating and restores every sample without farming bonuses', () => {
  const s = prepared(); s.started = true; s.time = 110; step(s);
  const speed = M.Sim.score(s).speed;
  for (const patch of s.roughPatches) for (const dx of [.4, 1.6]) for (const dy of [.4, 1.6]) {
    s.p.x = patch.x + dx; s.p.y = patch.y + dy;
    step(s, false, .4); step(s, true);
  }
  assert.equal(M.Groundskeeping.progress(s).fraction, 1);
  assert.equal(M.Groundskeeping.progress(s).restored, s.roughPatches.length);
  const bonus = M.Sim.score(s).bonusGrounds;
  assert.equal(bonus, Math.round(s.lv.def.pay * .1));
  for (let i = 0; i < 100; i++) { step(s, false, .4); step(s, true); }
  assert.equal(M.Sim.score(s).bonusGrounds, bonus); assert.equal(M.Sim.score(s).speed, speed);
});
