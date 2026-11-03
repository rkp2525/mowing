#!/usr/bin/env node
// Dev tool: headless bot playtest for balance. Simulates a bot mowing each level with each tool.
//   node tools/playtest.js            -> all levels, all tools
//   node tools/playtest.js 5 gas      -> level 5 with gas mower
const M = require('./load.js');
const [lvArg, toolArg] = process.argv.slice(2);
const levels = lvArg ? [parseInt(lvArg, 10) - 1] : M.LEVELS.map((_, i) => i);
const tools = toolArg ? [toolArg] : M.TOOL_ORDER;
const save = { upgrades: {} };
console.log('lvl tool     time(s)  par   cov%   stars  pay    refuels  note');
for (const li of levels) for (const t of tools) {
  const s = M.Sim.create(li, save, t);
  const bot = M.Bot(s);
  const dt = 1 / 30; let steps = 0, refuels = 0, stuck = 0, lastRem = s.remaining, lastT = 0;
  while (steps < 30 * 1500 && s.remaining > s.total * 0.012) {
    const evs = M.Sim.step(s, bot.input(dt), dt);
    for (const e of evs) if (e.e === 'refuel') refuels++;
    steps++;
    if (s.remaining < lastRem) { lastRem = s.remaining; lastT = s.time; }
    else if (s.time - lastT > 60) { stuck = 1; break; }
  }
  const r = M.Sim.score(s);
  const note = stuck ? 'STUCK' : s.time >= 1499 ? 'TIMEOUT' : '';
  console.log(`${String(li + 1).padStart(2)}  ${t.padEnd(8)} ${s.time.toFixed(0).padStart(6)} ${String(M.LEVELS[li].par).padStart(5)} ${(r.cov * 100).toFixed(1).padStart(6)}  ${r.stars}      $${String(r.pay).padEnd(5)} ${String(refuels).padStart(5)}    ${note} rocks:${s.rockHits} flw:${s.flowersLost}`);
}
