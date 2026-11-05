#!/usr/bin/env node
const assert = require('node:assert/strict');
const M = require('./load.js');
const dt = 1 / 120, count = M.GRASS_SUBDIV ** 2;
function lawn(tool = 'gas') {
  const s = M.Sim.create(0, { upgrades: {} }, tool);
  s.type = new Uint8Array(s.type.length).fill(M.T.GRASS); s.ents = [];
  s.grass.fill(1); s.subGrass.fill(1); s.subRemaining.fill(count);
  s.remaining = s.total = s.grass.length;
  s.p.x = s.p.y = 15.5; s.p.heading = 0;
  return s;
}
function run(s, n, input = {}) {
  const events = [];
  for (let i = 0; i < n; i++) events.push(...M.Sim.step(s, { mx: 0, my: 0, ...input }, dt));
  return events;
}
function test(name, fn) { fn(); console.log('PASS ' + name); }
const near = (a, b) => assert.ok(Math.abs(a - b) < 1e-9, `${a} != ${b}`);

test('Free reel mower replaces retired equipment without losing progress', () => {
  const save = { tool: 'scythe', tools: { scythe: true, gas: true }, money: 127, stars: [4], upgrades: { blades: 2 } };
  M.normalizeEquipment(save);
  assert.deepEqual(save, { tool: 'reel', tools: { reel: true, gas: true }, money: 127, stars: [4], upgrades: { blades: 2 } });
  M.normalizeEquipment(save); assert.equal(save.money, 127);
  save.tool = 'gas'; M.normalizeEquipment(save); assert.equal(save.tool, 'gas');
  assert.equal(M.TOOLS.reel.price, 0); assert.equal(M.TOOLS.scythe, undefined);
  assert.equal(M.Sim.create(0, {}).tool, 'reel');
  for (const id of ['scythe', 'trimmer', 'unknown']) {
    const s = lawn(id); assert.equal(s.tool, 'reel');
    M.Sim.setTool(s, id); assert.equal(s.tool, 'reel');
    assert.ok(!run(s, 80, { act: true, snip: true, hold: true }).some(e => ['swing', 'snip'].includes(e.e)));
  }
});

test('An edge pass clips only overlapping stems, persists, and never charges twice', () => {
  const s = lawn(), e = { t: 'flower', x: 16.35, y: 16.45, alive: true };
  e.stems = M.flowerStems(e); s.ents = [e];
  const events = run(s, 1);
  const clipped = e.stems.filter(stem => stem.clipped);
  assert.ok(clipped.length > 0 && clipped.length < e.stems.length);
  const fp = M.Sim.makeFootprint(s);
  for (const stem of e.stems) assert.equal(stem.clipped, fp(stem.x, stem.y, 0));
  near(s.flowersLost, clipped.length / e.stems.length);
  assert.equal(events.filter(e => e.e === 'flower').length, 1);
  const loss = s.flowersLost;
  assert.equal(run(s, 120).filter(e => e.e === 'flower').length, 0);
  near(s.flowersLost, loss); assert.equal(e.alive, true);
  // Approach the untouched side; only new stems contribute.
  s.p.y = 16.45; run(s, 1);
  assert.ok(s.flowersLost > loss);
  near(s.flowersLost, e.stems.filter(stem => stem.clipped).length / e.stems.length);
});

test('Every stem can be clipped; jobs and replays have independent flower state', () => {
  const a = M.Sim.create(0, {}, 'gas'), b = M.Sim.create(0, {}, 'gas');
  const e = a.ents.find(e => e.t === 'flower'), fresh = b.ents.find(e => e.t === 'flower');
  a.type = new Uint8Array(a.type.length).fill(M.T.GRASS); a.ents = [e];
  a.p.x = e.x - a.ts.r - .35; a.p.y = e.y; a.p.heading = 0;
  run(a, 1);
  // Two overlapping deck positions cover the whole circular patch.
  a.p.x += .1; run(a, 1); a.p.x -= .2; run(a, 1);
  assert.ok(e.stems.every(stem => stem.clipped)); near(a.flowersLost, 1);
  assert.ok(fresh.stems.every(stem => !stem.clipped));
  assert.ok(M.buildLevel(0).ents.filter(e => e.t === 'flower').every(e => !e.stems));
});

test('Care and cash deductions scale with clipped amount; rocks never affect either', () => {
  const s = lawn(); s.remaining = 0; s.time = s.lv.def.par; s.cutH = 100; s.cutV = 0;
  const clean = M.Sim.score(s);
  s.flowersLost = .25;
  const partial = M.Sim.score(s); near(partial.care, clean.care - .25 * .14);
  assert.equal(partial.fines, Math.round(.25 * .03 * s.lv.def.pay));
  s.flowersLost = 1; const full = M.Sim.score(s);
  assert.ok(full.care < partial.care); assert.ok(full.fines > partial.fines);
  s.rockHits = 100; assert.deepEqual(M.Sim.score(s), full);
});

test('All mowers stop at rocks without bounce, heading change, stalls, or extra fuel use', () => {
  for (const tool of M.TOOL_ORDER) {
    const s = lawn(tool), control = lawn(tool), rock = { t: 'rock', x: 19.5, y: 15.5, alive: true };
    s.ents = [rock];
    let previous = s.p.x;
    for (let i = 0; i < 240; i++) {
      const events = run(s, 1, { mx: 1 }); run(control, 1, { mx: 1 });
      assert.ok(s.p.x >= previous, 'rock contact cannot push the mower backward'); previous = s.p.x;
      assert.equal(s.p.heading, 0); assert.equal(s.p.y, 15.5); assert.equal(s.stall, 0);
      assert.ok(!events.some(e => ['clang', 'stall'].includes(e.e)));
      assert.ok(Math.hypot(s.p.x - rock.x, s.p.y - rock.y) >= s.ts.r + M.ROCK_RADIUS);
    }
    assert.ok(s.p.x < rock.x); assert.equal(s.rockHits, 0); assert.ok(s.fuel >= control.fuel, 'rock contact cannot consume extra fuel');
    run(s, 200, { my: 1 }); assert.ok(s.p.y > rock.y + 2, 'player can steer around the rock');
  }
});

test('Opposite passes make consistent shades and crossing a stripe changes only blade-covered samples', () => {
  const s = lawn(); s.p.y = 18.5; s.p.heading = -Math.PI / 2;
  run(s, 120, { my: -1 });
  assert.ok(s.subDir.some(d => d === M.Sim.DIR.N));
  assert.ok(s.subDir.every(d => d === 0 || d === M.Sim.DIR.N));
  assert.equal(M.stripeLight(M.Sim.DIR.N), true);
  assert.equal(M.stripeLight(M.Sim.DIR.S), false);
  assert.notEqual(M.MOWN_COLORS.light, M.MOWN_COLORS.dark);
  s.p.x = 15.5; s.p.y = 15.5; s.p.speed = 0; s.p.heading = Math.PI / 2;
  const before = new Uint8Array(s.subDir), remaining = s.remaining, cut = s.cutV;
  const footprint = M.Sim.makeFootprint(s);
  run(s, 1);
  let changed = 0;
  for (let i = 0; i < s.grass.length; i++) for (let k = 0; k < count; k++) {
    const sample = i * count + k;
    if (!before[sample]) continue;
    const x = i % s.W + (k % M.GRASS_SUBDIV + .5) / M.GRASS_SUBDIV;
    const y = Math.floor(i / s.W) + (Math.floor(k / M.GRASS_SUBDIV) + .5) / M.GRASS_SUBDIV;
    assert.equal(s.subDir[sample], footprint(x, y, 0) ? M.Sim.DIR.S : before[sample]);
    if (s.subDir[sample] !== before[sample]) changed++;
  }
  assert.ok(changed > 0); near(s.remaining, remaining); near(s.cutV, cut);
  assert.ok(s.subDir.some(d => d === M.Sim.DIR.N), 'opposite pass preserves neighboring stripe');
  const i = Math.floor(16.35) * s.W + 15;
  const patterns = M.Sim.stripePatterns(s, i);
  assert.ok(patterns.some(g => g.direction === M.Sim.DIR.N));
  assert.ok(patterns.some(g => g.direction === M.Sim.DIR.S));
});

test('Mower changes require the truck and reject overlapping equipment without changing state', () => {
  const s = lawn('reel');
  s.p.x = s.lv.spawn.x + 6; s.p.y = s.lv.spawn.y;
  s.fuel = 61; s.stamina = 73; s.p.speed = 2;
  const snapshot = () => JSON.stringify({ tool: s.tool, stats: s.ts, fuel: s.fuel, stamina: s.stamina, speed: s.p.speed, used: s.toolsUsed });
  let before = snapshot();
  assert.equal(M.Sim.setTool(s, 'ride'), false); assert.equal(snapshot(), before);
  // Reproduce the review's radius-growth trap, inside the truck area.
  s.p.x = s.lv.spawn.x; s.p.y = s.lv.spawn.y;
  s.ents = [{ t: 'rock', x: s.p.x + 1.1, y: s.p.y, alive: true }];
  assert.equal(M.Sim.collides(s, s.p.x, s.p.y, s.ts.r), false);
  before = snapshot();
  assert.equal(M.Sim.setTool(s, 'ride'), false); assert.equal(snapshot(), before);
  // Walls must reject oversized equipment too.
  s.ents = []; s.p.x = Math.floor(s.p.x) + .4;
  s.type[Math.floor(s.p.y) * s.W + Math.floor(s.p.x) + 1] = M.T.HOUSE;
  before = snapshot();
  assert.equal(M.Sim.setTool(s, 'ride'), false); assert.equal(snapshot(), before);
  s.type.fill(M.T.GRASS);
  assert.equal(M.Sim.setTool(s, 'ride'), true); assert.equal(s.tool, 'ride');
  assert.equal(s.p.speed, 0); assert.equal(s.fuel, 61); assert.ok(s.toolsUsed.ride);
  // Being just outside the truck area cannot allow a smaller mower either.
  s.p.x = s.lv.spawn.x + 3.61;
  before = snapshot(); assert.equal(M.Sim.setTool(s, 'reel'), false); assert.equal(snapshot(), before);
  s.p.x = s.lv.spawn.x + 3.59;
  assert.equal(M.Sim.setTool(s, 'reel'), true);
});
