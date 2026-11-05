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
    document.querySelector('#b-res').click();
    s.flowersLost = .5; s.rockHits = 0; s.remaining = 0;
    document.querySelector('#btn-finish').click();
    check(document.querySelector('#screens').textContent.includes('0.50 patches'), 'results show fractional flower deductions');
    check(!document.querySelector('#screens').textContent.includes('rocks)'), 'results contain no rock penalty');
    output.dataset.result = 'PASS'; output.textContent += '\n\nBROWSER CONTROL CHECK PASSED';
  } catch (e) { output.dataset.result = 'FAIL'; output.textContent += '\nFAIL ' + e.stack; }
})();
