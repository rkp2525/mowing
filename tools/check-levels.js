#!/usr/bin/env node
// Dev tool: validate every lawn and (optionally) print ASCII maps.
//   node tools/check-levels.js          -> table of stats + warnings
//   node tools/check-levels.js --map 5  -> ASCII map of level 5
const M = require('./load.js');
const args = process.argv.slice(2);
const mapIdx = args.includes('--map') ? parseInt(args[args.indexOf('--map') + 1], 10) - 1 : -1;
let bad = 0;
console.log('lvl  size     grass  reach? thick  rocks flow gnome toys sprk  name');
M.LEVELS.forEach((def, i) => {
  const lv = M.buildLevel(i);
  const c = (t) => lv.ents.filter((e) => e.t === t).length;
  let thick = 0; for (let k = 0; k < lv.type.length; k++) if (lv.type[k] === 1 && lv.thick[k] && lv.reach[k]) thick++;
  const warn = [];
  if (lv.unreachable) warn.push(`${lv.unreachable} UNREACHABLE grass cells`);
  const sp = lv.type[Math.floor(lv.spawn.y) * lv.W + Math.floor(lv.spawn.x)];
  if (M.BLOCKED[sp]) warn.push('spawn blocked');
  for (const e of lv.ents) if (M.BLOCKED[lv.type[Math.floor(e.y) * lv.W + Math.floor(e.x)]] && e.t !== 'tree') warn.push(`${e.t} inside wall @${(e.x - M.MARGIN) | 0},${(e.y - M.MARGIN) | 0}`);
  if (warn.length) bad++;
  console.log(`${String(def.id).padStart(2)}  ${(def.w + 'x' + def.h).padEnd(7)} ${String(lv.total).padStart(6)} ${lv.unreachable ? 'NO ' : 'yes'}   ${String(thick).padStart(5)} ${String(c('rock')).padStart(5)} ${String(c('flower')).padStart(4)} ${String(c('gnome')).padStart(5)} ${String(c('toy')).padStart(4)} ${String(c('sprinkler')).padStart(4)}  ${def.name}${warn.length ? '   !! ' + [...new Set(warn)].join('; ') : ''}`);
});
if (mapIdx >= 0) {
  const lv = M.buildLevel(mapIdx), g = [];
  const ch = ['  ', '..', '==', 'HH', '~~', 'bb', 'TT', '##'];
  for (let y = 0; y < lv.H; y++) { g.push([]); for (let x = 0; x < lv.W; x++) { const i = y * lv.W + x; g[y].push(lv.type[i] === 1 && lv.thick[i] ? '""' : ch[lv.type[i]]); } }
  const put = (e, s) => { g[Math.floor(e.y)][Math.floor(e.x)] = s; };
  for (const e of lv.ents) put(e, { rock: 'RR', flower: '**', gnome: 'GG', toy: 'tt', sprinkler: 'ss', tree: 'TT' }[e.t] || '??');
  put(lv.spawn, 'SP');
  console.log(g.map((r) => r.join('')).join('\n'));
}
process.exit(bad ? 1 : 0);
