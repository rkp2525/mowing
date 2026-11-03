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
      grass: new Uint8Array(n), subGrass: new Uint8Array(n * M.GRASS_SUBDIV ** 2), subRemaining: new Uint8Array(n), protected: lv.protected, dir: new Uint8Array(n),
      dirty: [], remaining: 0, total: lv.total,
      ents: lv.ents.map((e) => Object.assign({}, e, { alive: true, found: false, cd: 0 })),
      p: { x: lv.spawn.x, y: lv.spawn.y, heading: -Math.PI / 2, aimHeading: -Math.PI / 2, speed: 0, step: 0 },
      time: 0, started: false, done: false,
      stall: 0, sw: null, swCool: 0, tired: false, stamina: 100, fuel: 100,
      eyes: upgradeLv(save, 'eyes'), cards: upgradeLv(save, 'cards'),
      save: save || {}, cutH: 0, cutV: 0, powerCut: 0,
      flowersLost: 0, rockHits: 0, gnomesFound: 0, gnomesBroken: 0, toysFound: 0, toysChopped: 0,
      gnomesTotal: 0, toysTotal: 0, refueling: false, sputterT: 0, wet: false, tiredEv: false,
      toolsUsed: {}, moving: false, lastSwing: 0, actWasDown: false, aimPlan: null, aimTimer: 0,
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
    setTool(s, toolId || 'scythe');
    s.fuel = s.ts.fuelMax; s.stamina = s.ts.staminaMax;
    return s;
  }

  function setTool(s, toolId) {
    const old = s.ts;
    s.tool = toolId; s.ts = toolStats(toolId, s.save);
    s.toolsUsed[toolId] = true;
    s.sw = null; s.aimPlan = null; s.aimTimer = 0;
    s.fuel = old ? Math.min(s.fuel, s.ts.fuelMax) : s.ts.fuelMax;
    s.stamina = Math.min(s.stamina, s.ts.staminaMax);
  }

  function blockedCell(s, cx, cy) {
    if (cx < 0 || cy < 0 || cx >= s.W || cy >= s.H) return true;
    return M.BLOCKED[s.type[cy * s.W + cx]] === 1;
  }
  function collides(s, x, y, r) {
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
    if (!s.grass[i]) return 0;
    const N = M.GRASS_SUBDIV, count = N * N, cx = i % s.W, cy = Math.floor(i / s.W);
    let cut = 0, changed = false, high = 0;
    for (let y = 0; y < N; y++) for (let x = 0; x < N; x++) {
      const k = i * count + y * N + x, value = s.subGrass[k];
      if (!value) continue;
      if (footprint(cx + (x + .5) / N, cy + (y + .5) / N, 0)) {
        s.subGrass[k] = Math.max(0, value - power); changed = true;
        if (!s.subGrass[k]) { cut++; s.subRemaining[i]--; }
      }
      high = Math.max(high, s.subGrass[k]);
    }
    if (changed) { s.grass[i] = high; s.dir[i] = dc; s.dirty.push(i); }
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
  // Smart aim protects rocks and trees only. Flowers are the player's job to
  // steer around (manual aim), so a careless auto-swing can still clip them.
  function nearbyHazards(s, reach) {
    return s.ents.filter(e => e.alive && ['rock', 'tree'].includes(e.t) && Math.hypot(e.x-s.p.x,e.y-s.p.y) <= reach + .8);
  }
  function sweepSafe(s, angle, halfArc, reach, hazards) {
    for (const e of hazards || nearbyHazards(s, reach)) {
      const dx=e.x-s.p.x,dy=e.y-s.p.y,d=Math.hypot(dx,dy);
      const radius=e.t==='flower'?.20:e.t==='rock'?.55:e.size===2?.55:.35;
      if (d-radius > reach) continue;
      if (d <= radius) return false;
      if (Math.abs(angDiff(angle,Math.atan2(dy,dx))) <= halfArc+M.SCYTHE.bladeAngle+Math.asin(Math.min(1,radius/d))) return false;
    }
    return true;
  }
  function planScythe(s, preferred, moving) {
    const p=s.p,R=s.ts.width*.95,N=M.GRASS_SUBDIV,count=N*N,targets=[],hazards=nearbyHazards(s,R);
    for(let cy=Math.max(0,Math.floor(p.y-R));cy<=Math.min(s.H-1,Math.ceil(p.y+R));cy++)
      for(let cx=Math.max(0,Math.floor(p.x-R));cx<=Math.min(s.W-1,Math.ceil(p.x+R));cx++){
        const i=cy*s.W+cx;if(!s.grass[i])continue;
        const stride=s.subRemaining[i]===count?2:1;
        for(let y=0;y<N;y+=stride)for(let x=0;x<N;x+=stride){
          if(!s.subGrass[i*count+y*N+x])continue;
          const X=cx+(x+.5)/N,Y=cy+(y+.5)/N,dx=X-p.x,dy=Y-p.y,d=Math.hypot(dx,dy);
          if(d<.03||d>R||!bladeClear(s,X,Y))continue;
          targets.push({angle:Math.atan2(dy,dx),d,weight:stride*stride/count});
        }
      }
    const candidates=[preferred,Number.isFinite(p.aimHeading)?p.aimHeading:preferred];
    for(let i=0;i<32;i++)candidates.push(i*Math.PI/16);
    let best=null,bestScore=-Infinity;
    for(const angle of candidates){
      const turn=Math.abs(angDiff(preferred,angle));
      if(moving&&turn>Math.PI*.67)continue;
      for(const halfArc of [M.SCYTHE.halfArc,.30,.10]){
        let safeReach=R;
        for(const e of hazards){
          const dx=e.x-p.x,dy=e.y-p.y,d=Math.hypot(dx,dy),radius=e.t==='flower'?.20:e.t==='rock'?.55:e.size===2?.55:.35;
          if(d<=radius){safeReach=0;break;}
          if(Math.abs(angDiff(angle,Math.atan2(dy,dx)))<=halfArc+M.SCYTHE.bladeAngle+Math.asin(Math.min(1,radius/d)))safeReach=Math.min(safeReach,d-radius-.02);
        }
        for(const reach of [safeReach,Math.min(safeReach,R*.65)]){
          if(reach<.18||!sweepSafe(s,angle,halfArc,reach,hazards))continue;
        let gain=0;
        for(const target of targets)if(target.d<=reach&&Math.abs(angDiff(angle,target.angle))<halfArc+M.SCYTHE.bladeAngle)gain+=target.weight;
        if(gain<=0&&targets.length)continue;
        const score=gain*(1-.12*turn/Math.PI)-turn*.025+(halfArc/M.SCYTHE.halfArc)*.002;
        if(score>bestScore){bestScore=score;best={angle,halfArc,reach,safe:true,gain,assisted:true};}
        }
      }
    }
    return best || {angle:preferred,halfArc:.10,reach:R,safe:false,gain:0,assisted:true};
  }

  const SW_DUR = M.SCYTHE.duration;

  /* Is world point (x,y) inside the current cutting footprint? */
  function makeFootprint(s) {
    const p = s.p, T = s.ts;
    if (T.id === 'scythe') {
      if (!s.sw) return null;
      const R = s.sw.reach || T.width * .95, half = s.sw.halfArc ?? M.SCYTHE.halfArc, a = s.sw.a0 - half + 2 * half * (s.sw.t / SW_DUR);
      const ox = s.sw.ox, oy = s.sw.oy; // arc stays planted where the swing began, so it clears what was previewed
      return (x, y, m) => {
        const dx = x - ox, dy = y - oy, d = Math.hypot(dx, dy);
        if (d > R + m || d < 0.03) return false;
        return Math.abs(angDiff(a, Math.atan2(dy, dx))) < M.SCYTHE.bladeAngle + m * 0.3 && bladeClear(s,x,y,ox,oy);
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
    const onFoot = T.id === 'scythe';
    if (ta !== null) {
      const d=angDiff(p.heading,ta),maxTurn=T.turn*dt;
      p.heading=onFoot?ta:p.heading+clamp(d,-maxTurn,maxTurn);
    }
    let alignF = 0;
    if (ta !== null) alignF = onFoot ? 1 : Math.max(T.id === 'ride' ? .45 : .55, Math.cos(angDiff(p.heading, ta)));
    let want = T.speed * mag * alignF;
    if (fuelOut) want *= 0.4;
    if (T.id === 'scythe' && s.tired) want *= 0.55;
    if (T.id === 'scythe' && s.sw) want *= 0.3; // plant your feet mid-swing
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
    const nearTruck = Math.hypot(p.x - s.lv.spawn.x, p.y - s.lv.spawn.y) < 3.6;
    if (T.powered && nearTruck && p.speed < 2.5 && (s.refueling ? s.fuel < T.fuelMax - 0.1 : s.fuel < T.fuelMax * 0.9)) {
      if (!s.refueling) { s.refueling = true; ev.push({ e: 'refuel' }); }
      s.fuel = Math.min(T.fuelMax, s.fuel + T.refuelRate * dt);
    } else s.refueling = false;
    if (nearTruck) s.stamina = Math.min(T.staminaMax, s.stamina + 25 * dt);

    // ---- tool logic
    const dc = dirCode(p.heading);
    let cutN = 0, engineOn = false, cutting = false;
    if (T.id === 'scythe') {
      s.swCool -= dt; s.aimTimer -= dt;
      const manual = Number.isFinite(inp.aim) || (Number.isFinite(inp.turn) && inp.turn !== 0) || inp.assist === false;
      if (manual) {
        if (Number.isFinite(inp.turn)) p.aimHeading += inp.turn * 2.3 * dt;
        if (Number.isFinite(inp.aim)) p.aimHeading=inp.aim;
        s.aimPlan={angle:p.aimHeading,halfArc:M.SCYTHE.halfArc,reach:T.width*.95,safe:true,gain:0,assisted:false};
      } else if (!s.sw && (pressed || s.aimTimer<=0)) {
        s.aimPlan=planScythe(s,p.heading,mag>.1);p.aimHeading=s.aimPlan.angle;s.aimTimer=.12;
      }
      if (!s.sw && pressed && s.swCool<=0 && s.stamina>0 && !s.tired && s.stall<=0) {
        const plan=s.aimPlan || planScythe(s,p.heading,mag>.1);
        if (plan.safe) {
          if(mag<=.1)p.heading=plan.angle;
          s.sw={t:0,a0:plan.angle,halfArc:plan.halfArc,reach:plan.reach,assisted:plan.assisted,ox:p.x,oy:p.y};
          s.stamina-=3.5;ev.push({e:'swing'});
          if(s.stamina<=.5){s.tired=true;ev.push({e:'tired'});}
        }else ev.push({e:'careful'});
      }
      if(s.sw&&s.sw.assisted&&!sweepSafe(s,s.sw.a0,s.sw.halfArc,s.sw.reach)){
        s.sw=null;s.swCool=.08;ev.push({e:'careful'});
      }
      if (s.sw) {
        s.sw.t += dt; cutting = true;
        if (s.sw.t >= SW_DUR) { s.sw = null; s.swCool = 0.06; }
      } else {
        s.stamina = Math.min(T.staminaMax, s.stamina + T.staminaRegen * dt);
        if (s.tired && s.stamina > T.staminaMax * 0.3) s.tired = false;
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
          if (s.grass[i]) cutN += cutCell(s, i, T.power, dc, fp);
        }
      // hazards
      for (const e of s.ents) {
        if (!e.alive) continue;
        if (e.cd > 0) e.cd -= dt;
        if (e.t === 'rock' && e.cd <= 0 && fp(e.x, e.y, 0.25)) {
          e.cd = 1.5; s.rockHits++; ev.push({ e: 'clang', x: e.x, y: e.y });
          if (T.id === 'scythe') { s.sw = null; s.stamina = Math.max(0, s.stamina - 14); s.stall = 0.35; }
          else { s.stall = T.id === 'reel' ? 0.9 : 1.5; if (T.powered) s.fuel = Math.max(0, s.fuel - 3); ev.push({ e: 'stall' }); }
          p.speed = 0;
          // bounce back off the rock so you can steer around it
          for (let k = 0; k < 8; k++) { const bx = p.x - hx * 0.25, by = p.y - hy * 0.25; if (!collides(s, bx, by, T.r)) { p.x = bx; p.y = by; } }
        } else if (e.t === 'flower' && fp(e.x, e.y, 0.1)) {
          e.alive = false; s.flowersLost++; ev.push({ e: 'flower', x: e.x, y: e.y });
        } else if ((e.t === 'gnome' || e.t === 'toy') && !e.found && fp(e.x, e.y, 0.1)) {
          e.alive = false;
          if (e.t === 'gnome') { s.gnomesBroken++; ev.push({ e: 'gnomebreak', x: e.x, y: e.y }); } else { s.toysChopped++; ev.push({ e: 'toychop', x: e.x, y: e.y }); if (T.powered) { s.stall = Math.max(s.stall, 0.8); ev.push({ e: 'stall' }); } }
        }
      }
    } else for (const e of s.ents) if (e.cd > 0) e.cd -= dt;

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
  function coverage(s) { return s.total ? 1 - s.remaining / s.total : 1; }

  /* Final scoring. Returns breakdown + pay. */
  function score(s) {
    const def = s.lv.def;
    const cov = coverage(s);
    const covN = clamp((cov - 0.78) / 0.22, 0, 1);
    const tot = s.cutH + s.cutV;
    const dom = tot ? Math.max(s.cutH, s.cutV) / tot : 0.5;
    const pattern = clamp((dom - 0.55) / 0.4, 0, 1);
    const dmgPoints = s.flowersLost * 0.14 + s.rockHits * 0.10 + s.gnomesBroken * 0.18 + s.toysChopped * 0.08;
    const care = clamp(1 - dmgPoints, 0, 1);
    const speed = clamp(def.par / Math.max(1, s.time) , 0, 1);
    const sc = 0.5 * covN + 0.18 * pattern + 0.17 * care + 0.15 * speed;
    let stars = sc >= 0.92 ? 5 : sc >= 0.78 ? 4 : sc >= 0.6 ? 3 : sc >= 0.42 ? 2 : 1;
    if (cov < 0.8) stars = 0;
    const payBase = def.pay * (0.3 + 0.7 * sc) * (cov < 0.8 ? 0 : 1);
    const bonusGnome = s.gnomesFound * (3 + def.id);
    const bonusToy = s.toysFound * Math.ceil(1 + def.id * 0.4);
    const fines = Math.round((s.flowersLost * 0.03 + s.rockHits * 0.015) * def.pay);
    const mult = 1 + 0.08 * s.cards;
    const pay = Math.max(0, Math.round((payBase + bonusGnome + bonusToy) * mult - fines));
    return { cov, covN, pattern, care, speed, score: sc, stars, payBase: Math.round(payBase), bonusGnome, bonusToy, fines, cardsMult: mult, pay, time: s.time };
  }

  M.Sim = { create, step, setTool, coverage, score, toolStats, collides, DIR, dirCode, upgradeLv, blockedCell, planScythe, sweepSafe, makeFootprint, grassPattern };
})();
