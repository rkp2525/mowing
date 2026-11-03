#!/usr/bin/env node
// Check traced fence coverage and paving edge masks against every real lawn.
const assert = require('node:assert/strict');
const fs = require('node:fs'), vm = require('node:vm');
const M = require('./load.js');
global.window = global;
vm.runInThisContext(fs.readFileSync(require('node:path').join(__dirname, '../js/render.js'), 'utf8'));
for (let level = 0; level < M.LEVELS.length; level++) {
  const s = M.Sim.create(level, { upgrades: {} }, 'scythe');
  const before = new Uint8Array(s.type);
  M.Render.bake(s);
  assert.deepEqual(s.type, before, 'Art baking must preserve collision geometry');
  const at = (x, y) => x < 0 || y < 0 || x >= s.W || y >= s.H ? M.T.VOID : s.type[y * s.W + x];
  const expected = new Set(), actual = new Set();
  const dirs = [[0,-1],[1,0],[0,1],[-1,0]];
  for (let y = 0; y < s.H; y++) for (let x = 0; x < s.W; x++) {
    const t = at(x, y); if (t === M.T.VOID) continue;
    if (t === M.T.PATH) {
      let mask = 0; dirs.forEach(([dx, dy], i) => { if (at(x+dx, y+dy) !== M.T.PATH) mask |= 1 << i; });
      assert.equal(s.vr[y*s.W+x] >> 3, mask, 'Path edging must follow its neighbors');
      continue; // Keep a visible entrance at perimeter paving.
    }
    if (at(x,y-1)===0) expected.add(`h:${x}:${y}`);
    if (at(x,y+1)===0) expected.add(`h:${x}:${y+1}`);
    if (at(x-1,y)===0) expected.add(`v:${x}:${y}`);
    if (at(x+1,y)===0) expected.add(`v:${x+1}:${y}`);
  }
  for (const f of s.fences) {
    assert.ok(f.length > 0 && Number.isInteger(f.length));
    for (let n = 0; n < f.length; n++) {
      const key = f.vertical ? `v:${f.x}:${f.y+n}` : `h:${f.x+n}:${f.y}`;
      assert.ok(!actual.has(key), 'Fence spans must not overlap'); actual.add(key);
    }
  }
  if (s.lv.def.fence === 'hedge') assert.equal(actual.size, 0);
  else assert.deepEqual(actual, expected, 'Fence must cover the entire lawn perimeter');
  console.log(`${level+1}: ${s.fences.length} connected fence runs; geometry and path edges OK`);
}
