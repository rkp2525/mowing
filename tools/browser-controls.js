// Browser acceptance checks for the production mouse/keyboard handlers and screens.
(function () {
  const output = document.createElement('pre');
  output.style.cssText = 'position:fixed;inset:90px 25px auto;z-index:99;padding:20px;background:#f2ecd8;color:#294832;white-space:pre-wrap;font:16px/1.5 monospace;border-radius:12px';
  document.body.append(output);
  const results = [], check = (ok, name) => { if (!ok) throw Error(name); results.push('PASS ' + name); output.textContent = results.join('\n'); };
  const frames = n => { for (let i = 0; i < n; i++) MOW.Sim.step(window.__G.s, window.__readInput(1 / 60), 1 / 60); };
  const key = (type, code, repeat = false) => window.dispatchEvent(new KeyboardEvent(type, { code, repeat, bubbles: true }));
  try {
    const s = window.__G.s, N = MOW.GRASS_SUBDIV ** 2, cv = document.querySelector('#game');
    check(s.tool === 'reel', 'reel mower is the default, including retired tool URLs');
    check(!document.querySelector('#btn-swing, #btn-snip'), 'retired tool buttons are absent');
    s.type = new Uint8Array(s.type.length).fill(MOW.T.GRASS); s.grass.fill(1); s.subGrass.fill(1); s.subRemaining.fill(N);
    s.remaining = s.total = s.grass.length; s.ents = []; s.p.x = s.p.y = 15.5; s.p.heading = 0;
    s.p.x = s.lv.spawn.x + 6; s.p.y = s.lv.spawn.y;
    key('keydown', 'KeyQ'); key('keyup', 'KeyQ'); document.querySelector('#hud-tool').click();
    check(s.tool === 'reel' && s.save.tool === 'reel', 'keyboard and HUD mower changes require the truck');
    s.p.x = s.lv.spawn.x; s.p.y = s.lv.spawn.y;
    s.ents = [{ t: 'rock', x: s.p.x + 1.06, y: s.p.y, alive: true }];
    key('keydown', 'KeyQ'); key('keyup', 'KeyQ');
    check(s.tool === 'reel' && s.save.tool === 'reel', 'blocked truck swap preserves current and saved equipment');
    s.ents = [];
    key('keydown', 'KeyQ'); key('keyup', 'KeyQ');
    check(s.tool === 'gas' && s.save.tool === 'gas', 'mower changes work at the truck');
    key('keydown', 'KeyE'); key('keyup', 'KeyE');
    s.p.x = s.p.y = 15.5; s.p.heading = 0;
    const remaining = s.remaining, x = s.p.x;
    key('keydown', 'KeyD'); frames(40); key('keyup', 'KeyD'); frames(20);
    check(s.p.x > x && s.remaining < remaining && !s.sw, 'keyboard movement mows automatically');
    const stopX = s.p.x, stopY = s.p.y; frames(12);
    check(s.p.x === stopX && s.p.y === stopY, 'released mower settles and stays stopped');
    key('keydown', 'KeyC'); key('keyup', 'KeyC'); key('keydown', 'Space'); frames(30); key('keyup', 'Space');
    check(!s.trim && !s.sw && s.tool === 'reel', 'C and Space cannot enable retired tools');
    const capture = cv.setPointerCapture; cv.setPointerCapture = () => {};
    const before = s.p.x;
    cv.dispatchEvent(new PointerEvent('pointerdown', { pointerType: 'mouse', pointerId: 1, button: 0, buttons: 1, clientX: 10, clientY: 400, bubbles: true }));
    frames(45);
    check(s.p.x < before, 'click and hold steers the mower');
    cv.dispatchEvent(new PointerEvent('pointerup', { pointerType: 'mouse', pointerId: 1, button: 0, buttons: 0, bubbles: true }));
    frames(20); cv.setPointerCapture = capture;
    document.querySelector('#hud-pause').click();
    check(!document.querySelector('#s-guide'), 'pause has no retired scythe setting');
    const pausedState = JSON.stringify({p:s.p,time:s.time,remaining:s.remaining});
    document.querySelector('#b-settings').click();
    check(document.querySelector('#s-steering').checked, 'easy steering is on by default in mid-level settings');
    document.querySelector('#s-steering').click();
    check(s.save.easySteering === false, 'steering preference applies to the active job');
    document.querySelector('#s-steering').click();
    document.querySelector('#b-ok').click();
    check(window.__G.mode === 'paused' && JSON.stringify({p:s.p,time:s.time,remaining:s.remaining}) === pausedState, 'settings return to pause with the job unchanged');
    document.querySelector('#b-res').click();
    s.p.x = s.lv.spawn.x; s.p.y = s.lv.spawn.y;
    document.querySelector('#hud-tool').click();
    check(window.__G.mode === 'truck' && document.querySelector('[data-gear="fertilizer"]'), 'truck offers fertilizer alongside owned mowers');
    document.querySelector('[data-gear="trimmer"]').click();
    check(s.tool === 'trimmer' && document.querySelector('#btn-fertilize').textContent.includes('Trim'), 'truck offers a standalone precision trimmer');
    const trimmedBefore = s.remaining;
    key('keydown','Space');frames(30);key('keyup','Space');frames(1);
    check(s.remaining < trimmedBefore && !s.sw, 'manual trimmer action cuts without restoring the scythe');
    document.querySelector('#hud-tool').click();
    document.querySelector('[data-gear="fertilizer"]').click();
    check(s.tool === 'fertilizer' && window.__G.mode === 'play' && !document.querySelector('#btn-fertilize').classList.contains('hidden'), 'fertilizer pickup returns to lawn with Scatter action');
    s.subGrass.fill(0); s.subRemaining.fill(0); s.grass.fill(0); s.remaining = 0;
    const patch = s.roughPatches[0]; s.p.x = patch.x + 1; s.p.y = patch.y + 1;
    key('keydown', 'Space'); frames(1);
    const fed = MOW.Groundskeeping.progress(s).treated;
    check(fed > 0, 'Space manually feeds a mown rough patch');
    frames(45); check(MOW.Groundskeeping.progress(s).treated === fed, 'holding Space does not scatter repeatedly'); key('keyup', 'Space');
    s.p.x = patch.x + .3; s.p.y = patch.y + .3;
    document.querySelector('#btn-fertilize').dispatchEvent(new PointerEvent('pointerdown', { pointerType: 'touch', bubbles: true })); frames(1);
    check(MOW.Groundskeeping.progress(s).treated > fed, 'touch Scatter treats the new area');
    s.flowersLost = .5; s.rockHits = 0; s.remaining = 0;
    document.querySelector('#btn-finish').click();
    check(document.querySelector('#screens').textContent.includes('0.50 patches'), 'results show fractional flower deductions');
    check(!document.querySelector('#screens').textContent.includes('rocks)'), 'results contain no rock penalty');
    check(document.querySelector('#screens').textContent.includes('Lawn feeding'), 'results include the restoration cash bonus');
    document.querySelector('#b-rt').click();
    check(window.__G.s.tool === 'reel' && MOW.Groundskeeping.progress(window.__G.s).treated === 0, 'retry from fertilizer restores the saved mower and fresh patches');
    if (!new URLSearchParams(location.search).has('truckreview')) {
      document.querySelector('#hud-pause').click(); document.querySelector('#b-settings').click();
      const confirmReset = window.confirm; window.confirm = () => true;
      document.querySelector('#b-reset').click(); window.confirm = confirmReset;
      check(window.__G.s === null && window.__G.mode === 'board', 'mid-level reset discards the old job');
      key('keydown', 'Escape'); key('keyup', 'Escape');
      check(window.__G.s === null && !document.querySelector('#b-res'), 'discarded job cannot resume');
    }
    output.dataset.result = 'PASS'; output.textContent += '\n\nBROWSER CONTROL CHECK PASSED';
    if (new URLSearchParams(location.search).has('truckreview')) {
      output.style.display = 'none'; document.body.classList.add('touch');
      // Desktop headless Chrome enforces a 500px viewport; constrain the app to test a narrower phone layout.
      const phoneWidth = Number(new URLSearchParams(location.search).get('phonewidth'));
      if (phoneWidth > 0) document.querySelector('#app').style.width = Math.min(innerWidth, phoneWidth) + 'px';
      document.querySelector('#hud-tool').click();
    }
  } catch (e) { output.dataset.result = 'FAIL'; output.textContent += '\nFAIL ' + e.stack; }
})();
