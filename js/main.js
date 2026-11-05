/* Lawn Kid — game shell: loop, input, camera, HUD, screens, save. */
(function () {
  const M = window.MOW, A = M.Audio, R = M.Render, Sim = M.Sim, C = M.CELL;
  const $ = (id) => document.getElementById(id);
  const params = new URLSearchParams(location.search);
  const DEV = params.has('level') || params.has('dev') || params.has('screen');
  const clamp = (v, a, b) => (v < a ? a : v > b ? b : v);

  /* ---------------- save ---------------- */
  const KEY = 'lawnkid.v1';
  const defSave = () => ({ money: 0, stars: [], best: [], tools: { reel: true }, tool: 'reel', upgrades: {}, music: 0.7, sfx: 0.85, muted: false, seenHow: false, artStyle: 'pixel' });
  let save = defSave();
  try { Object.assign(save, JSON.parse(localStorage.getItem(KEY) || '{}')); } catch (e) { /* private mode etc. */ }
  M.normalizeEquipment(save);
  save.artStyle = save.artStyle === 'realism' ? 'realism' : 'pixel';
  if (DEV && params.has('art')) save.artStyle = params.get('art') === 'realism' ? 'realism' : 'pixel';
  M.ArtStyles.setStyle(save.artStyle).catch(e => console.warn(e.message));
  delete save.autoSwing; delete save.scytheGuide; delete save.aimAssist; // retired tool preferences
  if (DEV) { save.tools = { reel: true, gas: true, ride: true }; save.money = 999; if (params.get('up')) for (const u of M.UPGRADES) save.upgrades[u.id] = +params.get('up'); }
  function persist() { if (DEV) return; try { localStorage.setItem(KEY, JSON.stringify(save)); } catch (e) { /* ignore */ } }
  const unlocked = (i) => DEV || i === 0 || (save.stars[i - 1] || 0) > 0;
  function applyAudioPrefs() { A.setMusicVolume(save.music); A.setSfxVolume(save.sfx); A.setMuted(!!save.muted); }

  /* ---------------- canvas / camera ---------------- */
  const cv = $('game'), ctx = cv.getContext('2d');
  let cssW = 0, cssH = 0, dpr = 1, Z = 5, bw = 0, bh = 0, zoomOff = 0; // Z = css px per world unit (fractional ok), bw/bh = view size in world units
  const cam = { x: 0, y: 0 };
  function resize() {
    cssW = window.innerWidth; cssH = window.innerHeight; dpr = Math.min(window.devicePixelRatio || 1, 2);
    cv.width = Math.round(cssW * dpr); cv.height = Math.round(cssH * dpr);
    computeZ();
  }
  function computeZ() {
    const cellPx = clamp(Math.sqrt(cssW * cssH) / 23, 26, 66); // on-screen size of one grass cell
    const demo = G.mode === 'title' || G.mode === 'board' ? 1 : 0;
    Z = clamp((cellPx / C) * Math.pow(1.22, zoomOff + demo), 2, 14);
    bw = cssW / Z; bh = cssH / Z;
  }
  function followCam(s, dt, snap) {
    const p = s.p, hx = Math.cos(p.heading), hy = Math.sin(p.heading);
    const tx = p.x * C + hx * 10 - bw / 2, ty = p.y * C + hy * 10 - bh / 2 - (document.body.classList.contains('touch') ? 0 : 0);
    const wW = s.W * C, wH = s.H * C;
    const cx = wW <= bw ? (wW - bw) / 2 : clamp(tx, 0, wW - bw);
    const cy = wH <= bh ? (wH - bh) / 2 : clamp(ty, 0, wH - bh);
    if (snap) { cam.x = cx; cam.y = cy; } else { const k = Math.min(1, dt * 5); cam.x += (cx - cam.x) * k; cam.y += (cy - cam.y) * k; }
  }

  /* ---------------- game state ---------------- */
  const G = { mode: 'title', s: null, idx: 0, bot: null, auto: false, demo: null, demoBot: null, paused: false, res: null, hintT: 0, toldFuel: false, t: 0 };
  window.__G = DEV ? G : undefined;

  function newDemo() {
    G.demo = Sim.create(1, { upgrades: {} }, 'reel'); R.bake(G.demo); G.demoBot = M.Bot(G.demo); G.demoLast = 0; G.demoT = 0;
    followCam(G.demo, 0, true);
  }

  /* ---------------- input ---------------- */
  const keys = {};
  const touch = { id: null, ox: 0, oy: 0, x: 0, y: 0, active: false };
  const mouse = { down: false, snip: false, seen: false, x: 0, y: 0 };
  window.addEventListener('keydown', (e) => {
    if (['INPUT', 'SELECT'].includes(e.target.tagName)) return;
    keys[e.code] = true;
    if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'Space'].includes(e.code)) e.preventDefault();
    if (G.mode === 'play') {
      if (e.code === 'Escape' || e.code === 'KeyP') pause();
      else if (e.code === 'KeyQ' || e.code === 'Tab') { e.preventDefault(); cycleTool(1); }
      else if (e.code === 'KeyE') cycleTool(-1);
      else if (e.code === 'KeyL') toggleLock();
      else if (e.code === 'Equal' || e.code === 'NumpadAdd') setZoom(zoomOff + 1);
      else if (e.code === 'Minus' || e.code === 'NumpadSubtract') setZoom(zoomOff - 1);
      else if (e.code === 'Enter' && !$('btn-finish').classList.contains('hidden')) finishJob();
    } else if (G.mode === 'paused' && (e.code === 'Escape' || e.code === 'KeyP')) resume();
  });
  window.addEventListener('keyup', (e) => { keys[e.code] = false; });
  window.addEventListener('blur', () => { for (const k in keys) keys[k] = false; mouse.down = false; if (G.mode === 'play') pause(); });
  document.addEventListener('visibilitychange', () => { if (document.hidden && G.mode === 'play') pause(); });

  cv.addEventListener('pointerdown', (e) => {
    if (G.mode !== 'play') return;
    A.init();
    if (e.pointerType === 'mouse') {
      if (e.button !== 0 && e.button !== 2) return;
      mouse.x = e.clientX; mouse.y = e.clientY; mouse.seen = true;
      if (e.button === 0) mouse.down = true;
    }
    else {
      document.body.classList.add('touch'); mouse.seen = false; // touch is now the current input, drop the stale cursor aim
      if (touch.active) return;
      touch.id = e.pointerId; touch.active = true; touch.ox = touch.x = e.clientX; touch.oy = touch.y = e.clientY;
      const jb = $('joy-base'); jb.style.display = 'block'; jb.style.left = touch.ox - 60 + 'px'; jb.style.top = touch.oy - 60 + 'px';
      $('joy-knob').style.transform = 'translate(0,0)';
    }
    cv.setPointerCapture(e.pointerId);
  });
  cv.addEventListener('pointermove', (e) => {
    if (e.pointerType === 'mouse') { mouse.x = e.clientX; mouse.y = e.clientY; mouse.seen = true; }
    else if (touch.active && e.pointerId === touch.id) {
      touch.x = e.clientX; touch.y = e.clientY;
      let dx = touch.x - touch.ox, dy = touch.y - touch.oy; const d = Math.hypot(dx, dy), max = 50;
      if (d > max) { touch.ox += dx / d * (d - max); touch.oy += dy / d * (d - max); dx = touch.x - touch.ox; dy = touch.y - touch.oy; $('joy-base').style.left = touch.ox - 60 + 'px'; $('joy-base').style.top = touch.oy - 60 + 'px'; }
      $('joy-knob').style.transform = `translate(${clamp(dx, -max, max)}px,${clamp(dy, -max, max)}px)`;
    }
  });
  const endPtr = (e) => {
    if (e.pointerType === 'mouse') {
      if (e.button === 0 || e.type === 'pointercancel') mouse.down = false;
    }
    else if (e.pointerId === touch.id) { touch.active = false; touch.id = null; $('joy-base').style.display = 'none'; }
  };
  cv.addEventListener('pointerup', endPtr); cv.addEventListener('pointercancel', endPtr);
  cv.addEventListener('contextmenu', (e) => e.preventDefault());

  let kHold = 0, lockToggle = false, lockAxis = null;
  function readInput(dt) {
    let mx = 0, my = 0;
    if (keys.KeyD || keys.ArrowRight) mx += 1; if (keys.KeyA || keys.ArrowLeft) mx -= 1;
    if (keys.KeyS || keys.ArrowDown) my += 1; if (keys.KeyW || keys.ArrowUp) my -= 1;
    if (mx || my) {
      const d = Math.hypot(mx, my); kHold += dt;
      // gentle ramp: a tap nudges, holding builds to full speed (fine control near hedges & flowers)
      const m = Math.min(1, 0.20 + kHold * 1.6) * (keys.AltLeft || keys.AltRight ? 0.35 : 1);
      mx = mx / d * m; my = my / d * m;
    } else if (touch.active) {
      kHold = 0;
      const dx = touch.x - touch.ox, dy = touch.y - touch.oy, d = Math.hypot(dx, dy);
      if (d > 8) { const m = clamp(d / 50, 0, 1); mx = dx / d * m; my = dy / d * m; }
    } else if (mouse.down && G.s) {
      kHold = 0;
      const px = (G.s.p.x * C - cam.x) * Z, py = (G.s.p.y * C - cam.y) * Z;
      const dx = mouse.x - px, dy = mouse.y - py, d = Math.hypot(dx, dy);
      if (d > 16) { const m = clamp((d - 16) / 130, 0.22, 1); mx = dx / d * m; my = dy / d * m; }
    } else kHold = 0;
    // straight-line lock: snap to the dominant axis (hold Shift or toggle ↔) for perfectly straight stripes
    const mg = Math.hypot(mx, my);
    if ((keys.ShiftLeft || keys.ShiftRight || lockToggle) && mg > 0.1) {
      const ax = Math.abs(mx), ay = Math.abs(my);
      if (!lockAxis) lockAxis = ax >= ay ? 'x' : 'y';
      else if (lockAxis === 'x' && ay > ax * 1.6) lockAxis = 'y';
      else if (lockAxis === 'y' && ax > ay * 1.6) lockAxis = 'x';
      if (lockAxis === 'x') { mx = Math.sign(mx) * mg; my = 0; } else { my = Math.sign(my) * mg; mx = 0; }
    } else if (mg <= 0.1) lockAxis = null;
    return { mx, my };
  }

  if (DEV && params.has('controlcheck')) window.__readInput = readInput;

  /* ---------------- gameplay flow ---------------- */
  function startLevel(i, toolId) {
    A.init(); applyAudioPrefs();
    mouse.down = false;
    toolId = M.TOOL_ORDER.includes(toolId) && save.tools[toolId] ? toolId : 'reel';
    G.idx = i; G.s = Sim.create(i, save, toolId); R.bake(G.s);
    G.mode = 'play'; G.paused = false; G.res = null; G.toldFuel = false;
    save.tool = toolId; persist();
    G.bot = (params.has('auto') && DEV) ? M.Bot(G.s) : null;
    hideScreens(); $('hud').classList.remove('hidden');
    document.body.classList.toggle('touch', document.body.classList.contains('touch'));
    computeZ(); followCam(G.s, 0, true);
    A.setMode('play'); A.startMusic();
    const def = M.LEVELS[i];
    if (!params.has('shot')) say(def.tip, 9000);
    updateHudTool(); R.fx.parts.length = 0; R.fx.pops.length = 0;
    if (DEV && params.get('warp')) warp(+params.get('warp'));
  }
  function warp(sec) { // dev: fast-forward with the bot
    if (!G.bot) G.bot = M.Bot(G.s);
    for (let t = 0; t < sec; t += 1 / 30) { Sim.step(G.s, G.bot.input(1 / 30), 1 / 30); if (G.s.remaining < G.s.total * 0.02) break; }
    G.s.dirty.length = 0; R.bake(G.s); followCam(G.s, 0, true);
  }
  function cycleTool(dir) {
    const owned = M.TOOL_ORDER.filter((t) => save.tools[t]);
    if (owned.length < 2 || !G.s) return;
    const k = (owned.indexOf(G.s.tool) + dir + owned.length) % owned.length;
    Sim.setTool(G.s, owned[k]); save.tool = owned[k]; persist(); A.click(); updateHudTool();
    say(M.TOOLS[owned[k]].name, 1400); computeZ();
  }
  function toggleLock() { lockToggle = !lockToggle; $('hud-lock').classList.toggle('on', lockToggle); A.click(); toast(lockToggle ? 'Straight-line lock ON' : 'Straight-line lock off'); }
  function setZoom(v) { zoomOff = clamp(v, -3, 4); computeZ(); A.click(); }
  function updateHudTool() {
    const T = M.TOOLS[G.s.tool];
    $('hud-tool-icon').textContent = T.icon; $('hud-tool-name').textContent = T.name;
    const lbl = $('meter-label');
    $('meter-label').parentElement.style.display = G.s.tool === 'reel' ? 'none' : '';
    lbl.textContent = T.powered ? 'Fuel' : 'Stamina';
  }
  let hintTimer = 0;
  function say(text, ms) {
    const h = $('hint'); h.textContent = text; h.classList.remove('hidden'); h.style.animation = 'none'; void h.offsetWidth; h.style.animation = '';
    clearTimeout(hintTimer); hintTimer = setTimeout(() => h.classList.add('hidden'), ms || 4000);
  }
  function toast(text) { const t = $('toast'); t.textContent = text; t.classList.remove('hidden'); clearTimeout(toast.t); toast.t = setTimeout(() => t.classList.add('hidden'), 2200); }

  function handle(ev, s) {
    for (const e of ev) {
      switch (e.e) {
        case 'swing': A.swing(); break;
        case 'snip': A.snipswing(); break;
        case 'cut': {
          A.snip(e.n);
          R.emit('grass', e.x, e.y, Math.min(4, e.n), { c: Math.random() < 0.5 ? '#9be96b' : '#6bbd47' });
          break;
        }
        case 'clang': A.clang(); R.emit('spark', e.x, e.y, 8); R.pop('CLANG!', e.x, e.y, '#ffe27a'); break;
        case 'stall': A.stall(); break;
        case 'flower': R.emit('petal', e.x, e.y, Math.min(2, Math.ceil(e.amount * 3)), { c: '#e8b6bc' }); break;
        case 'gnome': A.gnome(); R.emit('spark', e.x, e.y, 14); R.pop('Gnome found!', e.x, e.y, '#ffe27a'); break;
        case 'gnomebreak': A.clang(); R.pop('Oh no, a gnome!', e.x, e.y, '#ff9b8a'); R.emit('dust', e.x, e.y, 8); break;
        case 'toy': A.pickup(); R.pop('Tidy!', e.x, e.y, '#bff0ff'); R.emit('spark', e.x, e.y, 6); break;
        case 'toychop': A.clang(); R.pop('Crunch!', e.x, e.y, '#ff9b8a'); break;
        case 'tired': A.tired(); say('Phew, tired! Catch your breath (or visit the truck).', 3000); break;
        case 'sputter': A.sputter(); say('Low fuel! Roll back to the utility truck to refuel.', 4000); break;
        case 'fuelout': A.stall(); say('Out of fuel! Push it back to the truck.', 5000); break;
        case 'refuel': A.refuel(); R.pop('Refueling…', s.p.x, s.p.y - 1, '#cfe9ff'); break;
        case 'allcut': A.coin(); say('Every blade mowed! Hit Finish Job.', 4000); break;
      }
    }
  }

  function pause() { if (G.mode !== 'play') return; G.mode = 'paused'; A.tool(null, 0, false); A.click(); showPause(); }
  function resume() { hideScreens(); G.mode = 'play'; A.click(); }
  function finishJob() {
    const s = G.s; if (!s || G.mode !== 'play') return;
    s.done = true; G.mode = 'results'; A.tool(null, 0, false);
    const res = Sim.score(s); G.res = res;
    const first = !(save.stars[G.idx] > 0);
    const payout = first ? res.pay : Math.round(res.pay * 0.5);
    res.payout = payout; res.first = first;
    save.money += payout;
    const prev = save.stars[G.idx] || 0;
    save.stars[G.idx] = Math.max(prev, res.stars);
    save.best[G.idx] = Math.max(save.best[G.idx] || 0, Math.round(res.score * 100));
    persist();
    $('hud').classList.add('hidden');
    showResults(res, prev);
  }

  /* ---------------- per-frame update ---------------- */
  const fmt = (t) => `${Math.floor(t / 60)}:${String(Math.floor(t % 60)).padStart(2, '0')}`;
  function updateHud(s) {
    const cov = Sim.coverage(s);
    $('cov-fill').style.width = (cov * 100).toFixed(1) + '%';
    $('cov-pct').textContent = Math.floor(cov * 100 + 0.001) + '%';
    $('cov-time').textContent = fmt(s.time);
    $('hud-time').textContent = fmt(s.time);
    const f = $('btn-finish'), can = cov >= 0.8;
    f.classList.toggle('hidden', !can); f.classList.toggle('ready', cov >= 0.97);
    f.textContent = cov >= 0.97 ? '✔ Finish Job' : '✔ Finish early';
    const T = s.ts, mf = $('meter-fill');
    const v = T.powered ? s.fuel / T.fuelMax : s.stamina / T.staminaMax;
    mf.style.width = (clamp(v, 0, 1) * 100).toFixed(0) + '%';
    mf.classList.toggle('low', v < 0.2);
  }

  function update(dt) {
    G.t += dt;
    if (G.mode === 'play') {
      const s = G.s;
      const n = Math.max(1, Math.ceil(dt / (1 / 90))), h = dt / n;
      for (let k = 0; k < n; k++) { const inp = G.bot ? G.bot.input(h) : readInput(h); handle(Sim.step(s, inp, h), s); }
      followCam(s, dt);
      const T = s.ts, spd = clamp(s.p.speed / T.speed, 0, 1);
      A.tool(T.powered && s.fuel <= 0 ? null : T.id, spd, s.cutting && (T.id !== 'reel' || spd > 0.1));
      R.updateFx(dt); updateHud(s);
      if (s.stall > 0 && !s.stallNoted) s.stallNoted = true; if (s.stall <= 0) s.stallNoted = false;
    } else if (G.mode === 'title' || G.mode === 'board' || G.mode === 'paused' || G.mode === 'results') {
      if (G.mode === 'title' || G.mode === 'board') {
        if (!G.demo) newDemo();
        const d = G.demo; G.demoT += dt;
        Sim.step(d, G.demoBot.input(dt), dt);
        d.dirty.length && 0;
        if (d.remaining < d.total * (d.remaining < G.demoLast ? 0.02 : 0.02) || G.demoT > 240) { newDemo(); }
        followCam(d, dt);
        R.updateFx(dt);
      }
    }
  }

  function render() {
    const s = G.mode === 'title' || G.mode === 'board' ? G.demo : G.s;
    if (!s || !s.bake) { ctx.fillStyle = '#2b5a3a'; ctx.fillRect(0, 0, cv.width, cv.height); return; }
    if (!M.ArtStyles.ready(M.ArtStyles.active)) {
      ctx.fillStyle = '#284632'; ctx.fillRect(0, 0, cv.width, cv.height);
      ctx.fillStyle = '#e6dfc6'; ctx.font = (16 * dpr) + 'px Trebuchet MS'; ctx.textAlign = 'center';
      ctx.fillText('Loading lawn artwork…', cv.width / 2, cv.height * .75); ctx.textAlign = 'start'; return;
    }
    R.draw(ctx, s, cam, cv.width, cv.height, Z * dpr, G.t);
  }

  let last = performance.now();
  function frame(now) {
    const dt = Math.min(0.05, (now - last) / 1000); last = now;
    try { update(dt); render(); } catch (err) { console.error(err); }
    requestAnimationFrame(frame);
  }

  /* ---------------- screens ---------------- */
  const scr = $('screens');
  function hideScreens() { scr.innerHTML = ''; }
  function show(html, cls) { scr.innerHTML = `<div class="screen ${cls || ''}">${html}</div>`; return scr.firstChild; }
  const stars = (n, max) => { let o = ''; for (let i = 0; i < (max || 5); i++) o += i < n ? '<b>★</b>' : '★'; return `<span class="stars">${o}</span>`; };
  const btn = (el, sel, fn) => { const b = el.querySelector(sel); if (b) b.onclick = () => { A.init(); fn(b); }; };
  const money = () => `<div class="money">$${save.money}</div>`;

  function showTitle() {
    G.mode = 'title'; $('hud').classList.add('hidden'); computeZ();
    const prog = save.stars.some((x) => x > 0);
    const el = show(`<div class="title"><h1 class="logo">LAWN KID<small>A COZY MOWING STORY</small></h1>
      <div class="btns"><button class="big-btn" id="b-play">${prog ? '▶ Continue' : '▶ Start Mowing'}</button>
      <button class="big-btn alt" id="b-how">How to Play</button><button class="big-btn ghost" id="b-set">⚙ Settings</button></div>
      <div class="credit">Headphones recommended · ${DEV ? 'dev mode' : 'v1 alpha'}</div></div>`, 'titlebg');
    btn(el, '#b-play', () => { A.setMode('menu'); A.startMusic(); applyAudioPrefs(); A.click(); if (!save.seenHow) { save.seenHow = true; persist(); showHow(showBoard); } else showBoard(); });
    btn(el, '#b-how', () => { A.click(); showHow(showTitle); });
    btn(el, '#b-set', () => { A.click(); showSettings(showTitle); });
  }

  function showHow(back_) {
    const el = show(`<div class="panel"><h2>How to Play 🌱</h2><p class="sub">Mow the neighbors' lawns, earn cash, and grow from a kid with a quiet reel mower to the town's best groundskeeper.</p>
      <h3>Move and cut</h3><div class="keys"><div><b>Hold trackpad / mouse click</b></div><div>Slide to steer and walk. Release to stop.</div><div><kbd>W A S D</kbd> / arrows</div><div>Keyboard movement works too. Face where you travel.</div><div>Touch</div><div>Drag to steer. The mower cuts as you move.</div></div>
      <details class="control-details"><summary>Optional precision controls</summary><div class="keys"><div><kbd>Alt</kbd></div><div>Creep slowly</div><div><kbd>Shift</kbd> / <kbd>L</kbd></div><div>Straight-line lock</div><div><kbd>Q</kbd> / <kbd>E</kbd></div><div>Switch tool</div><div><kbd>+</kbd> <kbd>−</kbd></div><div>Zoom</div><div><kbd>Esc</kbd></div><div>Pause</div></div></details>
      <h3>Get paid for quality</h3><div class="keys"><div>🌿 Coverage</div><div>Mow every blade. Dark thick grass takes two passes without a strong mower.</div><div>📏 Stripes</div><div>Long, straight lines look pro.</div><div>🌷 Care</div><div>Clip flowers carefully: only the amount cut reduces care and pay. Rocks simply block your path. Pick up toys and gnomes.</div><div>⏱ Speed</div><div>Beat the par time.</div><div>⛽ Fuel</div><div>Powered mowers need refueling at the utility truck.</div></div>
      <div class="row end" style="margin-top:14px"><button class="big-btn" id="b-ok">Got it!</button></div></div>`, 'dim');
    btn(el, '#b-ok', () => { A.click(); back_(); });
  }

  function showSettings(back_) {
    const el = show(`<div class="panel"><h2>Settings ⚙</h2>
      <fieldset class="art-choices"><legend>Choose your art style</legend>
      <label class="art-choice"><input type="radio" name="art-style" value="pixel" ${save.artStyle === 'pixel' ? 'checked' : ''}><span><b>Fine Pixel</b><small>Pixel characters and equipment in our original lush lawns.</small></span></label>
      <label class="art-choice"><input type="radio" name="art-style" value="realism" ${save.artStyle === 'realism' ? 'checked' : ''}><span><b>Textured Realism</b><small>A fully rebuilt world with natural materials and warm summer light.</small></span></label>
      </fieldset><p class="art-status" id="art-status" role="status">Your progress is shared between both styles.</p>
      <details class="control-details"><summary>Controls</summary><div class="keys"><div><kbd>W A S D</kbd> / arrows</div><div>Move</div><div>Click and hold</div><div>Walk toward the cursor</div><div><kbd>Alt</kbd></div><div>Creep slowly</div><div><kbd>Shift</kbd> / <kbd>L</kbd></div><div>Straight-line lock</div><div><kbd>Q</kbd> / <kbd>E</kbd></div><div>Switch tool</div><div><kbd>+</kbd> <kbd>−</kbd></div><div>Zoom</div><div><kbd>Esc</kbd></div><div>Pause</div></div></details>
      <div class="set-row"><label>Music</label><input type="range" id="s-mus" min="0" max="100" value="${save.music * 100}"></div>
      <div class="set-row"><label>Effects</label><input type="range" id="s-sfx" min="0" max="100" value="${save.sfx * 100}"></div>
      <div class="set-row"><label>Mute all</label><input type="checkbox" id="s-mute" ${save.muted ? 'checked' : ''}></div>
      <div class="row" style="margin-top:14px"><button class="big-btn ghost" id="b-reset">Reset progress</button><span class="grow"></span><button class="big-btn" id="b-ok">Done</button></div></div>`, 'dim');
    let styleRequest = 0;
    el.querySelectorAll('input[name="art-style"]').forEach(radio => {
      radio.onchange = async () => {
        if (!radio.checked) return;
        const request = ++styleRequest, status = el.querySelector('#art-status');
        status.textContent = 'Loading artwork…';
        try {
          const applied = await M.ArtStyles.setStyle(radio.value);
          if (request !== styleRequest || !applied) return;
          save.artStyle = radio.value; persist();
          status.textContent = 'Style saved. Your progress stays the same.';
        } catch (e) {
          if (request !== styleRequest) return;
          el.querySelector('input[value="' + M.ArtStyles.active + '"]').checked = true;
          status.textContent = 'Artwork could not load. Please try again.';
        }
      };
    });
    el.querySelector('#s-mus').oninput = (e) => { save.music = e.target.value / 100; applyAudioPrefs(); persist(); };
    el.querySelector('#s-sfx').oninput = (e) => { save.sfx = e.target.value / 100; applyAudioPrefs(); persist(); };
    el.querySelector('#s-sfx').onchange = () => A.coin();
    el.querySelector('#s-mute').onchange = (e) => { save.muted = e.target.checked; applyAudioPrefs(); persist(); };
    btn(el, '#b-reset', () => { if (confirm('Erase all progress and start over?')) { const keep = { music: save.music, sfx: save.sfx, muted: save.muted, artStyle: save.artStyle }; save = Object.assign(defSave(), keep); persist(); A.error(); back_(); } });
    btn(el, '#b-ok', () => { A.click(); back_(); });
  }

  function showBoard() {
    G.mode = 'board'; $('hud').classList.add('hidden'); computeZ(); A.setMode('menu');
    let cards = '';
    const nextNew = M.LEVELS.findIndex((_, i) => unlocked(i) && !(save.stars[i] > 0));
    M.LEVELS.forEach((d, i) => {
      const u = unlocked(i);
      cards += `<button class="card ${u ? '' : 'locked'}" data-i="${i}"><span class="num">${i + 1}</span>${i === nextNew ? '<span class="badge-new">NEW</span>' : ''}
        <div class="thumb">${u ? '' : '<div style="font-size:42px">🔒</div>'}</div><div class="nm">${u ? d.name : 'Locked'}</div>
        <div class="meta"><span>$${d.pay}</span>${stars(save.stars[i] || 0)}</div></button>`;
    });
    const el = show(`<div class="panel wide"><div class="row"><h2 class="grow">Neighborhood Jobs 🏡</h2>${money()}</div>
      <div class="row" style="margin:6px 0 4px"><button class="big-btn alt" id="b-shop" style="font-size:16px;padding:8px 16px">🛒 Shop & Upgrades</button>
      <button class="big-btn ghost" id="b-set" style="font-size:16px;padding:8px 16px">⚙</button><button class="big-btn ghost" id="b-title" style="font-size:16px;padding:8px 16px">⌂ Title</button></div>
      <div class="board">${cards}</div></div>`, 'dim');
    el.querySelectorAll('.card').forEach((c) => {
      const i = +c.dataset.i;
      if (unlocked(i)) c.querySelector('.thumb').appendChild(R.thumb(i, 90));
      c.onclick = () => { if (!unlocked(i)) { A.error(); toast('Finish the previous job to unlock this one!'); return; } A.click(); showBrief(i); };
    });
    btn(el, '#b-shop', () => { A.click(); showShop('tools'); });
    btn(el, '#b-set', () => { A.click(); showSettings(showBoard); });
    btn(el, '#b-title', () => { A.click(); showTitle(); });
  }

  function showBrief(i) {
    const d = M.LEVELS[i], lv = M.buildLevel(i), c = (t) => lv.ents.filter((e) => e.t === t).length;
    let sel = save.tools[save.tool] ? save.tool : 'reel';
    const draw = () => {
      const tools = M.TOOL_ORDER.map((t) => { const T = M.TOOLS[t], own = save.tools[t];
        return `<div class="tool ${sel === t ? 'sel' : ''} ${own ? '' : 'off'}" data-t="${t}">${d.rec === t ? '<span class="rec">Suggested</span>' : ''}<div class="ic">${own ? T.icon : '🔒'}</div><div class="tn">${T.name}</div></div>`; }).join('');
      const el = show(`<div class="panel"><div class="owner"><div class="face">${d.emoji}</div><div><h2>${d.name}</h2><div class="sub" style="margin:0">Job ${i + 1} · ${d.owner} ${stars(save.stars[i] || 0)}</div></div></div>
        <div class="quote">${d.quote}</div>
        <div class="facts"><div class="fact">📐 ${Math.round(lv.total)} tufts</div><div class="fact">💵 up to $${d.pay}</div><div class="fact">⏱ par ${fmt(d.par)}</div>
        ${c('rock') ? `<div class="fact">🪨 ${c('rock')} rocks</div>` : ''}${c('flower') ? `<div class="fact">🌷 ${c('flower')} flowers</div>` : ''}${c('gnome') ? `<div class="fact">🧙 ${c('gnome')} hidden gnomes</div>` : ''}${c('sprinkler') ? `<div class="fact">💦 ${c('sprinkler')} sprinklers</div>` : ''}${(save.stars[i] || 0) > 0 ? '<div class="fact">🔁 repeat job: half pay</div>' : ''}</div>
        <div class="tipbox">💡 ${d.tip}</div>
        <h3>Choose your tool</h3><div class="tools">${tools}</div>
        <div class="row" style="margin-top:16px"><button class="big-btn ghost" id="b-back">← Back</button><span class="grow"></span><button class="big-btn" id="b-go">Start Mowing!</button></div></div>`, 'dim');
      el.querySelectorAll('.tool').forEach((t) => t.onclick = () => { if (!save.tools[t.dataset.t]) { A.error(); toast('Buy it in the shop first!'); return; } sel = t.dataset.t; A.click(); draw(); });
      btn(el, '#b-back', () => { A.click(); showBoard(); });
      btn(el, '#b-go', () => { A.click(); startLevel(i, sel); });
    };
    draw();
  }

  function statBars(T) { return '<div class="statbars">' + Object.entries(T.stats).map(([k, v]) => `<span>${k}</span><span class="sb">${[1, 2, 3, 4, 5].map((n) => `<i class="${n <= v ? 'on' : ''}"></i>`).join('')}</span>`).join('') + '</div>'; }
  function showShop(tab) {
    let items = '';
    if (tab === 'tools') {
      for (const t of M.TOOL_ORDER) {
        const T = M.TOOLS[t], own = save.tools[t], eq = save.tool === t;
        items += `<div class="item"><div class="top"><div class="ic">${T.icon}</div><div><div class="nm">${T.name}</div></div></div><div class="ds">${T.desc}</div>${statBars(T)}
          ${own ? `<button class="big-btn ${eq ? 'ghost' : ''}" data-eq="${t}" ${eq ? 'disabled' : ''}>${eq ? '✔ Equipped' : 'Equip'}</button>` : `<button class="big-btn alt" data-buy="${t}" ${save.money < T.price ? 'data-poor="1"' : ''}>Buy · $${T.price}</button>`}</div>`;
      }
    } else {
      for (const u of M.UPGRADES) {
        const lv = save.upgrades[u.id] || 0, max = lv >= 3, cost = u.costs[lv];
        items += `<div class="item"><div class="top"><div class="ic">${u.icon}</div><div><div class="nm">${u.name}</div><div class="pips">${[0, 1, 2].map((n) => `<div class="pip ${n < lv ? 'on' : ''}"></div>`).join('')}</div></div></div>
          <div class="ds">${max ? '<b>Maxed!</b> ' + u.desc[2] : 'Next: ' + u.desc[lv]}</div>
          ${max ? '<button class="big-btn ghost" disabled>Maxed</button>' : `<button class="big-btn alt" data-up="${u.id}" ${save.money < cost ? 'data-poor="1"' : ''}>Upgrade · $${cost}</button>`}</div>`;
      }
    }
    const el = show(`<div class="panel wide"><div class="row"><h2 class="grow">Hardware Shop 🛒</h2>${money()}</div>
      <div class="tabs"><button class="tab ${tab === 'tools' ? 'on' : ''}" data-tab="tools">Equipment</button><button class="tab ${tab === 'up' ? 'on' : ''}" data-tab="up">Upgrades</button></div>
      <div class="shop-grid">${items}</div><div class="row end" style="margin-top:14px"><button class="big-btn" id="b-ok">Back to jobs</button></div></div>`, 'dim');
    el.querySelectorAll('[data-tab]').forEach((b) => b.onclick = () => { A.click(); showShop(b.dataset.tab); });
    el.querySelectorAll('[data-buy]').forEach((b) => b.onclick = () => { const t = b.dataset.buy, T = M.TOOLS[t]; if (save.money < T.price) { A.error(); toast('Not enough cash yet. Keep mowing!'); return; } save.money -= T.price; save.tools[t] = true; save.tool = t; persist(); A.buy(); showShop(tab); });
    el.querySelectorAll('[data-eq]').forEach((b) => b.onclick = () => { save.tool = b.dataset.eq; persist(); A.click(); showShop(tab); });
    el.querySelectorAll('[data-up]').forEach((b) => b.onclick = () => { const u = M.UPGRADES.find((x) => x.id === b.dataset.up), lv = save.upgrades[u.id] || 0; if (save.money < u.costs[lv]) { A.error(); toast('Not enough cash yet. Keep mowing!'); return; } save.money -= u.costs[lv]; save.upgrades[u.id] = lv + 1; persist(); A.buy(); showShop(tab); });
    btn(el, '#b-ok', () => { A.click(); showBoard(); });
  }

  function showPause() {
    const el = show(`<div class="panel" style="width:min(420px,100%)"><h2>Paused ⏸</h2><p class="sub">Take a breath. The grass isn't going anywhere.</p>
      <div class="set-row"><label>Music</label><input type="range" id="s-mus" min="0" max="100" value="${save.music * 100}"></div>
      <div class="set-row"><label>Effects</label><input type="range" id="s-sfx" min="0" max="100" value="${save.sfx * 100}"></div>
      <div class="row" style="margin-top:14px;flex-direction:column;align-items:stretch"><button class="big-btn" id="b-res">▶ Resume</button><button class="big-btn ghost" id="b-rs">↺ Restart job</button><button class="big-btn ghost" id="b-q">Quit to jobs</button></div></div>`, 'dim');
    el.querySelector('#s-mus').oninput = (e) => { save.music = e.target.value / 100; applyAudioPrefs(); persist(); };
    el.querySelector('#s-sfx').oninput = (e) => { save.sfx = e.target.value / 100; applyAudioPrefs(); persist(); };
    btn(el, '#b-res', resume);
    btn(el, '#b-rs', () => { A.click(); startLevel(G.idx, G.s.tool); });
    btn(el, '#b-q', () => { A.click(); $('hud').classList.add('hidden'); showBoard(); });
  }

  function showResults(res, prevStars) {
    const d = M.LEVELS[G.idx], s = G.s;
    const hasNext = G.idx < M.LEVELS.length - 1;
    const line = (a, b) => `<div class="pay-line"><span>${a}</span><span>${b}</span></div>`;
    const bar = (name, v) => `<div>${name}</div><div class="bar"><i data-w="${Math.round(v * 100)}"></i></div><div>${Math.round(v * 100)}%</div>`;
    const verdict = ['Not finished', 'Needs work', 'Decent job', 'Nice job!', 'Beautiful!', 'PERFECT LAWN!'][res.stars];
    const lastLevel = G.idx === M.LEVELS.length - 1;
    const el = show(`<div class="panel"><h2 style="text-align:center">${verdict}</h2><p class="sub" style="text-align:center">${d.name} · ${d.owner}</p>
      <div class="result-stars" id="r-stars">★★★★★</div>
      <div class="brk">${bar('Coverage', res.cov)}${bar('Stripes', res.pattern)}${bar('Care', res.care)}${bar('Speed', res.speed)}</div>
      <div>${line('Base pay', '$' + res.payBase)}${res.bonusGnome ? line('🧙 Gnomes found ×' + s.gnomesFound, '+$' + res.bonusGnome) : ''}${res.bonusToy ? line('🧸 Toys tidied ×' + s.toysFound, '+$' + res.bonusToy) : ''}
      ${s.flowersLost > 0 ? line('🌷 Flowers clipped · ' + s.flowersLost.toFixed(2) + ' patches', '−$' + res.fines) : ''}${res.cardsMult > 1 ? line('💼 Business cards', '×' + res.cardsMult.toFixed(2)) : ''}
      ${!res.first ? line('🔁 Repeat customer', '×0.5') : ''}<div class="pay-line total"><span>Paid</span><span id="r-pay">$0</span></div></div>
      <p class="note">${res.first ? '' : 'Repeat jobs pay half, but you can still improve your stars.'} Time ${fmt(res.time)} · par ${fmt(d.par)}${lastLevel && res.first ? '<br><b>🏆 You finished the neighborhood! More jobs coming soon…</b>' : ''}</p>
      <div class="row" style="margin-top:12px"><button class="big-btn ghost" id="b-q">Jobs</button><button class="big-btn ghost" id="b-rt">↺ Retry</button><span class="grow"></span>${hasNext ? '<button class="big-btn" id="b-nx">Next job →</button>' : ''}</div></div>`, 'dim');
    A.fanfare();
    // star reveal
    const st = el.querySelector('#r-stars');
    st.innerHTML = '★★★★★';
    for (let i = 0; i < res.stars; i++) setTimeout(() => { if (G.mode !== 'results') return; st.innerHTML = [0, 1, 2, 3, 4].map((n) => (n <= i ? '<b>★</b>' : '★')).join(''); A.star(i); }, 500 + i * 380);
    setTimeout(() => el.querySelectorAll('.bar i').forEach((b) => b.style.width = b.dataset.w + '%'), 100);
    // pay count-up
    const t0 = performance.now() + 400;
    const tick = (now) => { if (G.mode !== 'results') return; const k = clamp((now - t0) / 1200, 0, 1); const p = $('r-pay'); if (p) p.textContent = '$' + Math.round(res.payout * k); if (k < 1) requestAnimationFrame(tick); else if (res.payout > 0) A.cash(); };
    requestAnimationFrame(tick);
    btn(el, '#b-q', () => { A.click(); showBoard(); });
    btn(el, '#b-rt', () => { A.click(); startLevel(G.idx, s.tool); });
    btn(el, '#b-nx', () => { A.click(); showBrief(G.idx + 1); });
  }

  /* ---------------- wire up ---------------- */
  $('hud-pause').onclick = () => pause();
  $('hud-lock').onclick = () => toggleLock();
  $('hud-tool').onclick = () => cycleTool(1);
  $('hud-zoom').onclick = () => setZoom(zoomOff >= 3 ? -3 : zoomOff + 1);
  $('btn-finish').onclick = () => finishJob();
  window.addEventListener('resize', resize);
  if (window.matchMedia && matchMedia('(pointer: coarse)').matches) document.body.classList.add('touch');
  // unlock audio on first gesture anywhere
  const unlockAudio = () => { A.init(); applyAudioPrefs(); };
  window.addEventListener('pointerdown', unlockAudio, { once: false, passive: true });
  window.addEventListener('keydown', unlockAudio, { passive: true });

  if (DEV && params.has('zoom')) zoomOff = +params.get('zoom');
  resize(); newDemo();
  const startScreen = params.get('screen');
  if (params.has('level')) {
    startLevel(clamp(+params.get('level') - 1, 0, M.LEVELS.length - 1), params.get('tool') || 'reel');
    if (params.get('screen') === 'results') finishJob();
  } else if (startScreen === 'board') showBoard();
  else if (startScreen === 'shop') showShop('tools');
  else if (startScreen === 'brief') showBrief(+params.get('lvl') - 1 || 0);
  else showTitle();
  if (DEV && params.has('bench')) { // dev: average ms per frame (update+render), written into the page title
    setTimeout(() => { const t0 = performance.now(); for (let i = 0; i < 60; i++) { update(1 / 60); render(); } document.title = 'bench ' + ((performance.now() - t0) / 60).toFixed(2) + 'ms/frame'; }, 800);
  }
  requestAnimationFrame(frame);
})();
