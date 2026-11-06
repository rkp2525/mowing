const assert = require('node:assert/strict'), M = require('./load.js');
const dt = 1 / 120, count = M.GRASS_SUBDIV ** 2;
function lawn(tool = 'reel') {
  const s = M.Sim.create(0, { upgrades: {} }, tool);
  s.type = new Uint8Array(s.type.length).fill(M.T.GRASS); s.ents = [];
  s.grass.fill(1); s.subGrass.fill(1); s.subRemaining.fill(count); s.remaining = s.total = s.grass.length;
  s.p.x = s.p.y = 15.5; s.p.heading = 0;
  return s;
}
const step = (s, input = {}, time = dt) => M.Sim.step(s, { mx: 0, my: 0, precision: true, ...input }, time);
function run(s, n, input) { for (let i = 0; i < n; i++) step(s, input); }
const near = (a, b) => assert.ok(Math.abs(a - b) < 1e-8, `${a} != ${b}`);
function test(name, fn) { fn(); console.log('PASS ' + name); }
test('All mowers pivot through a complete 360 degrees without moving or cutting at 30/60/120 Hz', () => {
  for (const tool of M.TOOL_ORDER) for (const interval of [1/30, 1/60, 1/120]) {
    const s = lawn(tool), remaining = s.remaining; s.p.heading = .371;
    let time = 2 * Math.PI / M.Precision.TURN_RATE;
    while (time > 1e-9) {
      const h = Math.min(interval, time), before = s.p.heading;
      step(s, { turn: 1 }, h); near(s.p.heading - before, M.Precision.TURN_RATE * h); time -= h;
    }
    near(s.p.heading, .371 + 2 * Math.PI); near(s.p.x, 15.5); near(s.p.y, 15.5);
    near(s.remaining, remaining); assert.equal(s.cutting, false);
  }
});
test('Forward/backward follows the chosen unsnapped angle and stops immediately', () => {
  for (const tool of M.TOOL_ORDER) {
    const s = lawn(tool); s.p.heading = .13; run(s, 90, { forward: 1 });
    near(s.p.heading, .13); near((s.p.y - 15.5) * Math.cos(.13) - (s.p.x - 15.5) * Math.sin(.13), 0);
    near(s.p.speed, s.ts.speed * .30);
    const x = s.p.x, y = s.p.y; step(s); near(s.p.x, x); near(s.p.y, y); near(s.p.speed, 0);
    run(s, 30, { forward: -1 }); assert.ok(s.p.x < x && s.p.y < y); near(s.p.heading, .13);
  }
});
test('Entering Precision immediately caps speed, and turn-only input stops a moving mower', () => {
  for (const tool of M.TOOL_ORDER) {
    const s = lawn(tool); s.p.speed = s.ts.speed;
    step(s, { forward: 1 }); assert.ok(s.p.speed <= s.ts.speed * .30);
    const x = s.p.x, y = s.p.y; step(s, { turn: -1 }); near(s.p.x, x); near(s.p.y, y); near(s.p.speed, 0);
  }
});
test('Slow reel-mower nudges still cut grass below the normal speed threshold', () => {
  const s = lawn(), remaining = s.remaining; run(s, 90, { forward: .15 });
  assert.ok(s.p.speed < .6 && s.p.speed > 0); assert.ok(s.remaining < remaining);
  const after = s.remaining; run(s, 60, { turn: 1 }); near(s.remaining, after);
});
test('Pointer steering pivots toward a target before advancing', () => {
  const s = lawn('gas'); run(s, 100, { aim: Math.PI / 2, advance: 1 });
  near(s.p.x, 15.5); near(s.p.y, 15.5); assert.ok(s.p.heading > 0 && s.p.heading < Math.PI / 2);
  run(s, 100, { aim: Math.PI / 2, advance: 1 }); near(s.p.heading, Math.PI / 2);
  assert.ok(s.p.y > 15.5); assert.ok(s.p.x - 15.5 < .02);
});
test('The short, blade-width preview matches the union of actual upcoming cutting footprints', () => {
  for (const tool of M.TOOL_ORDER) for (const angle of [0, .371, 1.4]) {
    const s = lawn(tool); s.p.heading = angle;
    const preview = M.Precision.preview(s), hx = Math.cos(angle), hy = Math.sin(angle);
    const travel = s.ts.width * .75, footprints = [];
    for (let n = 0; n <= 40; n++) {
      const d = travel * n / 40;
      footprints.push(M.Sim.makeFootprint({ ...s, p: { ...s.p, x: s.p.x + hx * d, y: s.p.y + hy * d } }));
    }
    near(preview.width, s.ts.width); near(preview.far - preview.near, 2 * s.ts.cutDepth + travel);
    assert.ok(preview.far - preview.near < s.ts.width * 1.5, 'preview must stay short');
    for (let y = 12; y <= 19; y += .125) for (let x = 12; x <= 19; x += .125)
      assert.equal(preview.contains(x, y), footprints.some(fp => fp(x, y, 0)), `${tool} preview differs from blade path`);
  }
});
test('The preview shortens at rocks and never reaches through walls', () => {
  const s = lawn(); s.ents = [{ t: 'rock', x: s.p.x + s.ts.r + M.ROCK_RADIUS + .3, y: s.p.y, alive: true }];
  const preview = M.Precision.preview(s);
  assert.ok(preview.far - (s.ts.r + .35 + s.ts.cutDepth) <= .3 + 1e-8);
  s.ents = []; s.type[15 * s.W + 17] = M.T.HOUSE;
  assert.equal(M.Precision.preview(s).contains(17.1, 15.5), false);
});
test('Flower warning includes only uncut stems in the short blade path', () => {
  const s = lawn(), flower = { t: 'flower', x: 16.4, y: 15.5, alive: true };
  flower.stems = M.flowerStems(flower); s.ents = [flower]; assert.equal(M.Precision.preview(s).danger, true);
  flower.stems.forEach(stem => stem.clipped = true); assert.equal(M.Precision.preview(s).danger, false);
  s.ents = [{ ...flower, x: 20, stems: M.flowerStems({ x: 20, y: 15.5 }) }]; assert.equal(M.Precision.preview(s).danger, false);
});
test('Precision keeps trimmer cuts manual and leaves fertilizer walking unchanged', () => {
  const s = lawn('trimmer'), remaining = s.remaining; run(s, 90, { forward: 1 }); near(s.remaining, remaining);
  step(s, { act: true }); assert.ok(s.remaining < remaining);
  const fertilizer = lawn('fertilizer'); step(fertilizer, { turn: 1, forward: 1 }); assert.equal(fertilizer.precision, false);
});
test('Releasing Precision restores the normal world-relative controls', () => {
  const s = lawn(); run(s, 30, { turn: 1 }); const y = s.p.y;
  step(s, { precision: false, mx: 1, my: 0 }); assert.equal(s.precision, false); near(s.p.heading, 0); near(s.p.y, y);
});
