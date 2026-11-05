/* Lawn Kid — pure simulation (no DOM). Used by the game and by Node tooling. */
(function () {
  const M = (globalThis.MOW = globalThis.MOW || {});
  const clamp = (v, a, b) => (v < a ? a : v > b ? b : v);
  const angDiff = (a, b) => { let d = b - a; while (d > Math.PI) d -= 2 * Math.PI; while (d < -Math.PI) d += 2 * Math.PI; return d; };

  const DIR = { E: 1, W: 2, S: 3, N: 4 };
  function dirCode(h) { const c = Math.cos(h), s = Math.sin(h); return Math.abs(c) >= Math.abs(s) ? (c >= 0 ? DIR.E : DIR.W) : (s >= 0 ? DIR.S : DIR.N); }

  function upgradeLv(save, id) { return (save && save.upgrades && save.upgrades[id]) || 0; }

  /* Compute tool stats modified by upgrades. */
  function toolStats(toolId, save) {
    toolId = M.EQUIPMENT_ORDER.includes(toolId) ? toolId : 'reel';
    const T = M.TOOLS[toolId];
    const b = upgradeLv(save, 'blades'), bo = upgradeLv(save, 'boots'), tk = upgradeLv(save, 'tank'), st = upgradeLv(save, 'steer');
    return {
      id: toolId, def: T,
      speed: T.speed * (1 + 0.07 * bo),
      turn: T.turn * (1 + 0.18 * st),
      accel: T.accel, decel: T.decel,
      width: T.width * (1 + 0.1 * b),
      power: T.power + (b >= 3 ? 1 : 0),
      r: T.r, powered: T.powered, cutDepth: T.cutDepth || .3,
      fuelMax: 100 + [0, 40, 80, 120][tk],
      refuelRate: 45 + (tk >= 3 ? 40 : 0),
      staminaMax: 120 + 30 * bo, staminaRegen: 14 + 3 * bo,
    };
  }

  function create(levelIndex, save, toolId) {
    const lv = M.buildLevel(levelIndex);
    const n = lv.W * lv.H;
    const s = {
      lv, W: lv.W, H: lv.H, type: lv.type,
      grass: new Uint8Array(n), subGrass: new Uint8Array(n * M.GRASS_SUBDIV ** 2), subRemaining: new Uint8Array(n), protected: lv.protected, dir: new Uint8Array(n), subDir: new Uint8Array(n * M.GRASS_SUBDIV ** 2), stripePatterns: new Array(n),
      roughPatches: M.Groundskeeping.create(lv), spreadCool: 0,
      dirty: [], remaining: 0, total: lv.total,
      ents: lv.ents.map((e) => Object.assign({}, e, { alive: true, found: false, cd: 0, ...(e.t === 'flower' ? { stems: M.flowerStems(e) } : {}) })),
      p: { x: lv.spawn.x, y: lv.spawn.y, heading: -Math.PI / 2, aimHeading: -Math.PI / 2, speed: 0, step: 0 },
      time: 0, mowingFinishedAt: null, started: false, done: false,
      stall: 0, sw: null, swCool: 0, tired: false, stamina: 100, fuel: 100,
      eyes: upgradeLv(save, 'eyes'), cards: upgradeLv(save, 'cards'),
      save: save || {}, cutH: 0, cutV: 0, powerCut: 0,
      flowersLost: 0, rockHits: 0, gnomesFound: 0, gnomesBroken: 0, toysFound: 0, toysChopped: 0,
      gnomesTotal: 0, toysTotal: 0, refueling: false, sputterT: 0, wet: false, tiredEv: false,
      toolsUsed: {}, moving: false, lastSwing: 0, actWasDown: false, aimPlan: null,
    };
    const count=M.GRASS_SUBDIV**2;
    for(let i=0;i<n;i++){
      for(let k=0;k<count;k++)if(lv.mowableSamples[i*count+k]){
        s.subGrass[i*count+k]=lv.thick[i]?2:1;s.subRemaining[i]++;s.remaining+=1/count;
      }
      if(s.subRemaining[i])s.grass[i]=lv.thick[i]?2:1;
    }
    for (const e of s.ents) { if (e.t === 'gnome') s.gnomesTotal++; if (e.t === 'toy') s.toysTotal++; }
    s.dirty.push(-1); // -1 = full redraw
    setTool(s, toolId || 'reel');
    s.fuel = s.ts.fuelMax; s.stamina = s.ts.staminaMax;
    return s;
  }

  function atTruck(s) {
    return Math.hypot(s.p.x - s.lv.spawn.x, s.p.y - s.lv.spawn.y) < 3.6;
  }

  function setTool(s, toolId) {
    toolId = M.EQUIPMENT_ORDER.includes(toolId) ? toolId : 'reel';
    const old = s.ts, next = toolStats(toolId, s.save);
    if (old && old.id === toolId) return true;
    // Initial job selection happens at spawn. Later swaps require a safe place at the truck.
    if (old && (!atTruck(s) || collides(s, s.p.x, s.p.y, next.r))) return false;
    s.tool = toolId; s.ts = next;
    s.p.speed = 0;
    s.toolsUsed[toolId] = true;
    s.sw = null; s.aimPlan = null; s.actWasDown = false;
    s.fuel = old ? Math.min(s.fuel, s.ts.fuelMax) : s.ts.fuelMax;
    s.stamina = Math.min(s.stamina, s.ts.staminaMax);
    return true;
  }

  function blockedCell(s, cx, cy) {
    if (cx < 0 || cy < 0 || cx >= s.W || cy >= s.H) return true;
    return M.BLOCKED[s.type[cy * s.W + cx]] === 1;
  }
  function collides(s, x, y, r) {
    for (const e of s.ents) if (e.t === 'rock' && Math.hypot(x - e.x, y - e.y) < r + M.ROCK_RADIUS) return true;
    const x0 = Math.floor(x - r), x1 = Math.floor(x + r), y0 = Math.floor(y - r), y1 = Math.floor(y + r);
    for (let cy = y0; cy <= y1; cy++) for (let cx = x0; cx <= x1; cx++) {
      if (!blockedCell(s, cx, cy)) continue;
      if (s.type[cy * s.W + cx] === M.T.TREE) {
        const tree = s.ents.find(e => e.t === 'tree' && Math.floor(e.x) === cx && Math.floor(e.y) === cy);
        const trunk = tree && tree.size === 2 ? .50 : .28;
        if (Math.hypot(x - cx - .5, y - cy - .5) < r + trunk) return true;
        continue;
      }
      const nx = clamp(x, cx, cx + 1), ny = clamp(y, cy, cy + 1);
      const dx = x - nx, dy = y - ny;
      if (dx * dx + dy * dy < r * r) return true;
    }
    return false;
  }

  // A cell is 8x8 tiny mowing samples. The grass texture may be a big tile,
  // but only the samples physically crossed by the blade are removed.
  function cutCell(s, i, power, dc, footprint) {
    if (!s.grass[i] && !s.dir[i]) return 0;
    const N = M.GRASS_SUBDIV, count = N * N, cx = i % s.W, cy = Math.floor(i / s.W);
    let cut = 0, changed = false, high = 0;
    for (let y = 0; y < N; y++) for (let x = 0; x < N; x++) {
      const k = i * count + y * N + x, value = s.subGrass[k];
      if (!value && !s.subDir[k]) continue;
      if (footprint(cx + (x + .5) / N, cy + (y + .5) / N, 0)) {
        if (value) {
          s.subGrass[k] = Math.max(0, value - power); changed = true;
          if (!s.subGrass[k]) { cut++; s.subRemaining[i]--; }
        }
        if (!s.subGrass[k] && s.subDir[k] !== dc) { s.subDir[k] = dc; changed = true; }
      }
      high = Math.max(high, s.subGrass[k]);
    }
    if (changed) { s.grass[i] = high; s.dir[i] = dc; s.dirty.push(i); s.stripePatterns[i] = null; }
    const area = cut / count;
    s.remaining = Math.max(0, s.remaining - area);
    if (dc === DIR.E || dc === DIR.W) s.cutH += area; else s.cutV += area;
    return area;
  }

  function bladeClear(s, x, y, ox = s.p.x, oy = s.p.y) {
    const dx = x - ox, dy = y - oy, steps = Math.ceil(Math.hypot(dx, dy) / .2);
    for (let j = 1; j <= steps; j++) {
      const px = ox + dx * j / steps, py = oy + dy * j / steps;
      const cx = Math.floor(px), cy = Math.floor(py);
      if (cx < 0 || cy < 0 || cx >= s.W || cy >= s.H) return false;
      const type = s.type[cy * s.W + cx];
      if (!M.BLOCKED[type]) continue;
      if (type === M.T.TREE && Math.hypot(px - cx - .5, py - cy - .5) > .5) continue;
      return false;
    }
    return true;
  }
  // Retired scythe/trimmer mechanics, kept for future experiments. setTool excludes them.
  // Scythe modes. The swing always goes exactly where the player aims (cursor).
  //   sweep: wide arc, full reach, fast over open lawn (will clip flowers / hit rocks)
  //   snip : narrow cone, shorter reach, cheap, for precise work around flowers & rocks
  function scytheMode(T, snip) {
    const S = M.SCYTHE, R = T.width * .95;
    return snip
      ? { snip: true, halfArc: S.snip.halfArc, blade: S.snip.blade, reach: R * S.snip.reach, dur: S.snip.duration, stamina: S.snip.stamina, cool: S.snip.cool }
      : { snip: false, halfArc: S.halfArc, blade: S.bladeAngle, reach: R, dur: S.duration, stamina: 3.5, cool: .06 };
  }


  /* Is world point (x,y) inside the current cutting footprint? */
  function makeFootprint(s) {
    const p = s.p, T = s.ts;
    if (T.id === 'scythe') {
      if (!s.sw) return null;
      const R = s.sw.reach || T.width * .95, half = s.sw.halfArc ?? M.SCYTHE.halfArc, a = s.sw.a0 - half + 2 * half * Math.min(1, s.sw.t / s.sw.dur), blade = s.sw.blade;
      const ox = s.sw.ox, oy = s.sw.oy; // arc stays planted where the swing began, so it clears what was previewed
      return (x, y, m) => {
        const dx = x - ox, dy = y - oy, d = Math.hypot(dx, dy);
        if (d > R + m || d < 0.03) return false;
        return Math.abs(angDiff(a, Math.atan2(dy, dx))) < blade + m * 0.3 && bladeClear(s,x,y,ox,oy);
      };
    }
    const hx = Math.cos(p.heading), hy = Math.sin(p.heading);
    const reach = T.r + 0.35, half = T.width / 2, depth = T.cutDepth;
    const cx = p.x + hx * reach, cy = p.y + hy * reach;
    return (x, y, m) => {
      const dx = x - cx, dy = y - cy;
      const along = dx * hx + dy * hy, side = -dx * hy + dy * hx;
      return Math.abs(along) <= depth + m && Math.abs(side) <= half + m && bladeClear(s,x,y);
    };
  }
  function footprintBox(s) {
    const p = s.p, T = s.ts;
    const r = T.id === 'scythe' ? T.width * 0.95 + 1 : T.width / 2 + T.r + 2;
    return [Math.floor(p.x - r), Math.floor(p.x + r), Math.floor(p.y - r), Math.floor(p.y + r)];
  }

  /* Advance simulation by dt seconds. inp = {mx,my,act}. Returns event list. */
  function step(s, inp, dt) {
    const ev = [];
    if (s.done) return ev;
    const p = s.p, T = s.ts;
    const mag = Math.min(1, Math.hypot(inp.mx, inp.my));
    const pressed = !!inp.act && !s.actWasDown;
    s.actWasDown = !!inp.act;
    if (!s.started && (mag > 0.1 || inp.act)) s.started = true;
    if (s.started) s.time += dt;

    let ta = mag > 0.1 ? Math.atan2(inp.my, inp.mx) : null;
    if (s.stall > 0) { s.stall -= dt; ta = null; }

    const fuelOut = T.powered && s.fuel <= 0;
    // The body always faces travel. Scythe aiming is separate and assisted.
    const onFoot = T.id === 'scythe' || T.id === 'fertilizer';
    if (ta !== null) {
      const d=angDiff(p.heading,ta),maxTurn=T.turn*dt;
      p.heading=onFoot?ta:p.heading+clamp(d,-maxTurn,maxTurn);
    }
    let alignF = 0;
    if (ta !== null) alignF = onFoot ? 1 : Math.max(T.id === 'ride' ? .45 : .55, Math.cos(angDiff(p.heading, ta)));
    let want = T.speed * mag * alignF;
    if (fuelOut) want *= 0.4;
    if (T.id === 'scythe' && s.tired) want *= 0.55;
    if (T.id === 'scythe' && s.sw) want *= s.sw.snip ? 0.85 : 0.6; // plant your feet mid-swing
    // sprinklers
    s.wet = false;
    for (const e of s.ents) {
      if (e.t !== 'sprinkler') continue;
      e.on = ((s.time + e.phase) % 6) < 2.4;
      if (e.on && Math.hypot(e.x - p.x, e.y - p.y) < 3.4) s.wet = true;
    }
    if (s.wet) want *= 0.6;
    const a = want > p.speed ? T.accel : T.decel;
    p.speed += clamp(want - p.speed, -a * dt, a * dt);
    if (s.stall > 0) p.speed = Math.min(p.speed, 0.4);
    if (onFoot && mag <= .1) p.speed = 0; // release means stop; no drift into flowers

    // ---- move with axis-separated collision
    const hx = Math.cos(p.heading), hy = Math.sin(p.heading);
    const walkH = onFoot && ta !== null ? ta : p.heading;
    const mvx = Math.cos(walkH) * p.speed * dt, mvy = Math.sin(walkH) * p.speed * dt;
    const ox = p.x, oy = p.y;
    if (!collides(s, p.x + mvx, p.y, T.r)) p.x += mvx;
    if (!collides(s, p.x, p.y + mvy, T.r)) p.y += mvy;
    const moved = Math.hypot(p.x - ox, p.y - oy);
    if (moved < p.speed * dt * 0.15 && p.speed > 1) p.speed *= 0.7; // head-on bump (sliding along walls is free)
    p.step += moved * 1.6;
    s.moving = p.speed > 0.4;

    // ---- refuel / rest at the truck
    const nearTruck = atTruck(s);
    if (T.powered && nearTruck && p.speed < 2.5 && (s.refueling ? s.fuel < T.fuelMax - 0.1 : s.fuel < T.fuelMax * 0.9)) {
      if (!s.refueling) { s.refueling = true; ev.push({ e: 'refuel' }); }
      s.fuel = Math.min(T.fuelMax, s.fuel + T.refuelRate * dt);
    } else s.refueling = false;
    if (nearTruck) s.stamina = Math.min(T.staminaMax, s.stamina + 25 * dt);

    // ---- tool logic
    let dc = dirCode(p.heading);
    let cutN = 0, engineOn = false, cutting = false;
    if (T.id === 'scythe') {
      s.swCool -= dt;
      // Aim follows the cursor (inp.aim). Without a cursor (touch / keys) it follows travel.
      if (Number.isFinite(inp.aim)) p.aimHeading = inp.aim; else if (mag > .1) p.aimHeading = p.heading;
      const mode = scytheMode(T, !!inp.snip);
      s.trim = mode.snip;
      s.aimPlan = { angle: p.aimHeading, halfArc: mode.halfArc, blade: mode.blade, reach: mode.reach, snip: mode.snip };
      // what would this sweep hit? (drives the contextual "Hold C to cut" prompt and the warning ring)
      const sweepM = mode, spread = mode.halfArc + mode.blade;
      s.aimHit = null;
      for (const e of s.ents) {
        if (!e.alive || (e.t !== 'flower' && e.t !== 'rock')) continue;
        const dx = e.x - p.x, dy = e.y - p.y, d = Math.hypot(dx, dy), rad = e.t === 'rock' ? .55 : .2;
        if (d - rad > sweepM.reach) continue;
        const da = Math.abs(angDiff(p.aimHeading, Math.atan2(dy, dx)));
        if (d <= rad || da <= spread + Math.asin(Math.min(1, rad / d))) { s.aimHit = { x: e.x, y: e.y, t: e.t }; break; }
      }
      const wantSwing = mode.snip ? (pressed || !!inp.hold) : pressed; // trimmers repeat while Space is held // snip repeats while held; sweep is one per press
      if (!s.sw && wantSwing && s.swCool <= 0 && s.stamina > 0 && !s.tired && s.stall <= 0) {
        s.sw = { t: 0, a0: p.aimHeading, halfArc: mode.halfArc, blade: mode.blade, reach: mode.reach, dur: mode.dur, snip: mode.snip, cool: mode.cool, ox: p.x, oy: p.y };
        s.stamina -= mode.stamina; ev.push({ e: mode.snip ? 'snip' : 'swing' });
        if (s.stamina <= .5) { s.tired = true; ev.push({ e: 'tired' }); }
      }
      if (s.sw) {
        s.sw.t += dt; cutting = true;
        if (s.sw.t >= s.sw.dur) { s.swCool = s.sw.cool; s.sw = null; }
      } else {
        s.stamina = Math.min(T.staminaMax, s.stamina + T.staminaRegen * dt);
        if (s.tired && s.stamina > T.staminaMax * 0.3) s.tired = false;
      }
    } else if (T.id === 'fertilizer') {
      s.spreadCool = Math.max(0, s.spreadCool - dt);
      if (pressed && s.spreadCool <= 0) {
        s.spreadCool = .35;
        const result = M.Groundskeeping.spread(s);
        ev.push({ e: 'fertilize', x: p.x, y: p.y, ...result });
      }
    } else if (T.powered) {
      engineOn = !fuelOut && s.stall <= 0;
      s.fuel = Math.max(0, s.fuel - (0.5 + 1.5 * Math.min(1, p.speed / T.speed)) * dt * (T.id === 'ride' ? 1.15 : 1));
      if (T.powered && s.fuel > 0 && s.fuel < T.fuelMax * 0.15) { s.sputterT -= dt; if (s.sputterT <= 0) { s.sputterT = 5; ev.push({ e: 'sputter' }); } }
      if (fuelOut && !s.fuelOutNoted) { s.fuelOutNoted = true; ev.push({ e: 'fuelout' }); }
      if (s.fuel > 0) s.fuelOutNoted = false;
      cutting = engineOn;
    } else { // reel
      cutting = s.stall <= 0 && p.speed > 0.6;
    }
    // scythe grass direction (stripe scoring) follows the swing, not the body's last travel direction
    if (T.id === 'scythe') dc = dirCode(s.sw ? s.sw.a0 : p.aimHeading);
    s.cutting = cutting; s.engine = engineOn;

    const fp = cutting ? makeFootprint(s) : null;
    // pickups first (so a deck can't break an item you could have collected)
    const pickR = T.id === 'ride' ? 3.4 : T.id === 'gas' ? 2.5 : 1.7;
    for (const e of s.ents) {
      if (!e.alive || e.found) continue;
      if (e.t === 'gnome' || e.t === 'toy') {
        if (Math.hypot(e.x - p.x, e.y - p.y) < pickR) {
          e.found = true;
          if (e.t === 'gnome') { s.gnomesFound++; ev.push({ e: 'gnome', x: e.x, y: e.y }); } else { s.toysFound++; ev.push({ e: 'toy', x: e.x, y: e.y }); }
        }
      }
    }
    // cut grass
    if (fp) {
      const [x0, x1, y0, y1] = footprintBox(s);
      for (let cy = Math.max(0, y0); cy <= Math.min(s.H - 1, y1); cy++)
        for (let cx = Math.max(0, x0); cx <= Math.min(s.W - 1, x1); cx++) {
          const i = cy * s.W + cx;
          if (s.grass[i] || s.dir[i]) cutN += cutCell(s, i, T.power, dc, fp);
        }
      // hazards
      for (const e of s.ents) {
        if (!e.alive) continue;
        if (e.cd > 0) e.cd -= dt;
        if (e.t === 'flower') {
          let clipped = 0;
          for (const stem of e.stems) if (!stem.clipped && fp(stem.x, stem.y, 0)) {
            stem.clipped = true; clipped++;
          }
          if (clipped) {
            const amount = clipped / e.stems.length;
            s.flowersLost += amount;
            ev.push({ e: 'flower', x: e.x, y: e.y, amount });
          }
        } else if ((e.t === 'gnome' || e.t === 'toy') && !e.found && fp(e.x, e.y, 0.1)) {
          e.alive = false;
          if (e.t === 'gnome') { s.gnomesBroken++; ev.push({ e: 'gnomebreak', x: e.x, y: e.y }); } else { s.toysChopped++; ev.push({ e: 'toychop', x: e.x, y: e.y }); if (T.powered) { s.stall = Math.max(s.stall, 0.8); ev.push({ e: 'stall' }); } }
        }
      }
    } else for (const e of s.ents) if (e.cd > 0) e.cd -= dt;

    if (s.mowingFinishedAt === null && coverage(s) >= .97) s.mowingFinishedAt = s.time;
    M.Groundskeeping.step(s, dt);
    if (cutN) { ev.push({ e: 'cut', n: cutN, x: p.x + hx, y: p.y + hy }); s.powerCut += cutN; }
    if (s.remaining <= 0 && !s.allCutNoted) { s.allCutNoted = true; ev.push({ e: 'allcut' }); }
    return ev;
  }

  function grassPattern(s,i) {
    const N=M.GRASS_SUBDIV,count=N*N;
    if(!s.subGrass||s.subRemaining[i]===count)return '';
    let pattern='';
    for(let y=0;y<N;y++){let bits=0;for(let x=0;x<N;x++)if(s.subGrass[i*count+y*N+x])bits|=1<<x;pattern+=bits.toString(16).padStart(2,'0');}
    return pattern;
  }
  // Cache directional masks so touching one part of a cell never recolors the rest.
  function stripePatterns(s, i) {
    if (s.stripePatterns[i]) return s.stripePatterns[i];
    const N = M.GRASS_SUBDIV, groups = [];
    for (const direction of [DIR.N, DIR.S, DIR.E, DIR.W]) {
      let pattern = '', any = false;
      for (let y = 0; y < N; y++) {
        let bits = 0;
        for (let x = 0; x < N; x++) if (s.subDir[i * N * N + y * N + x] === direction) bits |= 1 << x;
        any ||= bits !== 0; pattern += bits.toString(16).padStart(2, '0');
      }
      if (any) groups.push({ direction, pattern });
    }
    return s.stripePatterns[i] = groups;
  }
  function coverage(s) { return s.total ? 1 - s.remaining / s.total : 1; }

  /* Final scoring. Returns breakdown + pay. */
  function score(s) {
    const def = s.lv.def;
    const cov = coverage(s);
    const covN = clamp((cov - 0.78) / 0.22, 0, 1);
    const tot = s.cutH + s.cutV;
    const dom = tot ? Math.max(s.cutH, s.cutV) / tot : 0.5;
    const pattern = clamp((dom - 0.55) / 0.4, 0, 1);
    const dmgPoints = s.flowersLost * 0.14 + s.gnomesBroken * 0.18 + s.toysChopped * 0.08;
    const care = clamp(1 - dmgPoints, 0, 1);
    const mowingTime = s.mowingFinishedAt ?? s.time;
    const speed = clamp(def.par / Math.max(1, mowingTime), 0, 1);
    const sc = 0.5 * covN + 0.18 * pattern + 0.17 * care + 0.15 * speed;
    let stars = sc >= 0.92 ? 5 : sc >= 0.78 ? 4 : sc >= 0.6 ? 3 : sc >= 0.42 ? 2 : 1;
    if (cov < 0.8) stars = 0;
    const payBase = def.pay * (0.3 + 0.7 * sc) * (cov < 0.8 ? 0 : 1);
    const bonusGnome = s.gnomesFound * (3 + def.id);
    const bonusToy = s.toysFound * Math.ceil(1 + def.id * 0.4);
    const fines = Math.round((s.flowersLost * 0.03) * def.pay);
    const grounds = M.Groundskeeping.progress(s);
    const bonusGrounds = Math.round(grounds.fraction * s.lv.def.pay * .10);
    const mult = 1 + 0.08 * s.cards;
    const pay = Math.max(0, Math.round((payBase + bonusGnome + bonusToy + bonusGrounds) * mult - fines));
    return { cov, covN, pattern, care, speed, score: sc, stars, payBase: Math.round(payBase), bonusGnome, bonusToy, bonusGrounds, grounds, fines, cardsMult: mult, pay, time: s.time, mowingTime };
  }

  M.Sim = { create, step, setTool, atTruck, coverage, score, toolStats, collides, DIR, dirCode, upgradeLv, blockedCell, scytheMode, makeFootprint, grassPattern, stripePatterns };
})();
