/* Cozy lawn mowing - synthesized audio (Web Audio only, no assets).
 * Classic script. Exposes window.MOW.Audio. Every public call is wrapped so it can never throw. */
(function () {
  'use strict';
  var W = typeof window !== 'undefined' ? window : globalThis;
  W.MOW = W.MOW || {};

  var ctx = null, failed = false;
  var master, comp, musicFade, musicVolNode, musicMix, revSend, sfxRevSend, convolver;
  var sfxVolNode, oneShotBus, toolBus, padFilter, pluckIn, noiseBuf;
  var amb = null;       // wind nodes
  var T = null;         // tool nodes
  var musicVol = 0.7, sfxVol = 0.8, muted = false, mode = 'menu';
  var wantMusic = false, schedTimer = null, stopTimer = null;
  var nextChordT = 0, nextPluckT = 0, nextBirdT = 0, chordIdx = 0, lastSnip = 0;
  var CHORD_DUR = 8.5;

  var CHORDS = [
    [48, 52, 55, 59], // Cmaj7
    [45, 48, 52, 55], // Am7
    [41, 45, 48, 52], // Fmaj7
    [43, 47, 50, 52]  // G6
  ];
  var PENT = [0, 2, 4, 7, 9];

  function rand(a, b) { return a + Math.random() * (b - a); }
  function clamp01(v) { v = +v; return v > 0 ? (v < 1 ? v : 1) : 0; }
  function mtof(m) { return 440 * Math.pow(2, (m - 69) / 12); }
  function pick(arr) { return arr[Math.floor(Math.random() * arr.length)]; }
  function now() { return ctx.currentTime; }
  function glide(param, v, tc) { param.setTargetAtTime(v, ctx.currentTime, tc); }

  // ---------- graph ----------
  function makeNoise() {
    var len = Math.floor(ctx.sampleRate * 2);
    var b = ctx.createBuffer(1, len, ctx.sampleRate), d = b.getChannelData(0);
    for (var i = 0; i < len; i++) d[i] = Math.random() * 2 - 1;
    return b;
  }
  function makeImpulse() {
    var sr = ctx.sampleRate, len = Math.floor(sr * 2.4);
    var b = ctx.createBuffer(2, len, sr);
    for (var c = 0; c < 2; c++) {
      var d = b.getChannelData(c), lp = 0;
      for (var i = 0; i < len; i++) {
        var n = Math.random() * 2 - 1;
        lp += (n - lp) * 0.35; // soften highs
        d[i] = lp * Math.pow(1 - i / len, 3.2);
      }
    }
    return b;
  }
  function loopNoise(dest) {
    var s = ctx.createBufferSource();
    s.buffer = noiseBuf; s.loop = true;
    s.connect(dest);
    s.start(0, Math.random() * 1.5);
    return s;
  }
  function biquad(type, f, q) {
    var b = ctx.createBiquadFilter();
    b.type = type; b.frequency.value = f; if (q != null) b.Q.value = q;
    return b;
  }
  function gainNode(v) { var g = ctx.createGain(); g.gain.value = v; return g; }

  function buildGraph() {
    master = gainNode(muted ? 0 : 0.8);
    comp = ctx.createDynamicsCompressor();
    comp.threshold.value = -20; comp.knee.value = 24; comp.ratio.value = 4;
    comp.attack.value = 0.01; comp.release.value = 0.25;
    master.connect(comp); comp.connect(ctx.destination);

    noiseBuf = makeNoise();
    convolver = ctx.createConvolver();
    convolver.buffer = makeImpulse();
    var revRet = gainNode(0.9);
    convolver.connect(revRet); revRet.connect(master);

    // music chain
    musicMix = gainNode(1);
    musicFade = gainNode(0);
    musicVolNode = gainNode(musicVol * 0.9);
    musicMix.connect(musicFade); musicFade.connect(musicVolNode); musicVolNode.connect(master);
    revSend = gainNode(mode === 'menu' ? 0.55 : 0.3);
    musicVolNode.connect(revSend); revSend.connect(convolver);

    padFilter = biquad('lowpass', mode === 'menu' ? 800 : 1100, 0.5);
    padFilter.connect(musicMix);

    // plucks with echo
    pluckIn = gainNode(1);
    pluckIn.connect(musicMix);
    var dl = ctx.createDelay(2); dl.delayTime.value = 0.42;
    var fb = gainNode(0.36), dlp = biquad('lowpass', 2200, 0.5), dout = gainNode(0.4);
    pluckIn.connect(dl); dl.connect(dlp); dlp.connect(fb); fb.connect(dl);
    dlp.connect(dout); dout.connect(musicMix);

    // sfx chain
    sfxVolNode = gainNode(sfxVol);
    oneShotBus = gainNode(1);
    toolBus = gainNode(1);
    oneShotBus.connect(sfxVolNode); toolBus.connect(sfxVolNode); sfxVolNode.connect(master);
    sfxRevSend = gainNode(0.14);
    oneShotBus.connect(sfxRevSend); sfxRevSend.connect(convolver);
  }

  function ensureAmbience() {
    if (amb) return;
    var g = gainNode(0.035);
    var bp = biquad('bandpass', 500, 0.6);
    var lp = biquad('lowpass', 1400, 0.4);
    bp.connect(lp); lp.connect(g); g.connect(musicMix);
    var src = loopNoise(bp);
    var lfo = ctx.createOscillator(); lfo.frequency.value = 0.09;
    var lg = gainNode(0.02); lfo.connect(lg); lg.connect(g.gain);
    var lfo2 = ctx.createOscillator(); lfo2.frequency.value = 0.05;
    var lg2 = gainNode(180); lfo2.connect(lg2); lg2.connect(bp.frequency);
    lfo.start(); lfo2.start();
    amb = { src: src, g: g };
  }

  // ---------- one-shot helpers ----------
  function tone(o) {
    var t = o.t, d = o.d, a = o.a == null ? 0.008 : o.a;
    var osc = ctx.createOscillator(), g = ctx.createGain();
    osc.type = o.type || 'sine';
    osc.frequency.setValueAtTime(o.f, t);
    if (o.f2) osc.frequency.exponentialRampToValueAtTime(o.f2, t + d);
    if (o.vib) {
      var l = ctx.createOscillator(), lg = ctx.createGain();
      l.frequency.value = o.vib; lg.gain.value = o.f * 0.04;
      l.connect(lg); lg.connect(osc.frequency); l.start(t); l.stop(t + d + 0.05);
      l.onended = function () { l.disconnect(); lg.disconnect(); };
    }
    g.gain.setValueAtTime(0.0001, t);
    g.gain.linearRampToValueAtTime(o.v, t + a);
    g.gain.exponentialRampToValueAtTime(0.0001, t + d);
    osc.connect(g); g.connect(o.dest || oneShotBus);
    osc.start(t); osc.stop(t + d + 0.05);
    osc.onended = function () { osc.disconnect(); g.disconnect(); };
    return osc;
  }
  function noiseShot(o) {
    var t = o.t, d = o.d, a = o.a == null ? 0.004 : o.a;
    var src = ctx.createBufferSource();
    src.buffer = noiseBuf;
    var f = biquad(o.type || 'bandpass', o.f, o.q == null ? 1 : o.q);
    if (o.f2) f.frequency.exponentialRampToValueAtTime(o.f2, t + d);
    var g = ctx.createGain();
    g.gain.setValueAtTime(0.0001, t);
    g.gain.linearRampToValueAtTime(o.v, t + a);
    g.gain.exponentialRampToValueAtTime(0.0001, t + d);
    src.connect(f); f.connect(g); g.connect(o.dest || oneShotBus);
    src.start(t, Math.random() * 1.5); src.stop(t + d + 0.05);
    src.onended = function () { src.disconnect(); f.disconnect(); g.disconnect(); };
  }
  function bell(f, t, v, d) {
    tone({ f: f, t: t, d: d || 1.0, v: v, a: 0.004 });
    tone({ f: f * 2.76, t: t, d: (d || 1.0) * 0.3, v: v * 0.25, a: 0.003 });
  }

  // ---------- music ----------
  function playChord(t) {
    var notes = CHORDS[chordIdx % CHORDS.length], dur = CHORD_DUR;
    for (var i = 0; i < notes.length; i++) {
      var f = mtof(notes[i]);
      for (var k = 0; k < 2; k++) {
        var osc = ctx.createOscillator(), g = ctx.createGain();
        osc.type = k ? 'sine' : 'triangle';
        osc.frequency.value = f;
        osc.detune.value = k ? 7 : -6;
        g.gain.setValueAtTime(0.0001, t);
        g.gain.linearRampToValueAtTime(0.03, t + 2.6);
        g.gain.setValueAtTime(0.03, t + dur - 0.3);
        g.gain.linearRampToValueAtTime(0.0001, t + dur + 2.8);
        osc.connect(g); g.connect(padFilter);
        osc.start(t); osc.stop(t + dur + 2.9);
        osc.onended = (function (o, gg) { return function () { o.disconnect(); gg.disconnect(); }; })(osc, g);
      }
    }
    // soft bass root
    var b = ctx.createOscillator(), bg = ctx.createGain();
    b.type = 'sine'; b.frequency.value = mtof(notes[0] - 12);
    bg.gain.setValueAtTime(0.0001, t);
    bg.gain.linearRampToValueAtTime(0.05, t + 2.0);
    bg.gain.linearRampToValueAtTime(0.0001, t + dur + 2.0);
    b.connect(bg); bg.connect(musicMix);
    b.start(t); b.stop(t + dur + 2.1);
    b.onended = function () { b.disconnect(); bg.disconnect(); };
  }
  function playPluck(t) {
    var base = Math.random() < 0.7 ? 72 : 84;
    var m = base + pick(PENT) + (Math.random() < 0.2 ? 12 : 0);
    bell(mtof(m), t, rand(0.035, 0.06), 1.8);
    // pluckIn feeds echo; route through it
    if (mode === 'play' && Math.random() < 0.4) {
      bell(mtof(base + pick(PENT)), t + rand(0.28, 0.45), 0.03, 1.4);
    }
  }
  function playChirp(t) {
    var n = 2 + Math.floor(Math.random() * 3), f0 = rand(2300, 3600), tt = t;
    for (var i = 0; i < n; i++) {
      var d = rand(0.05, 0.1);
      tone({ f: f0 * rand(0.9, 1.1), f2: f0 * rand(0.7, 1.5), t: tt, d: d, a: 0.01, v: 0.012, dest: musicMix });
      tt += d + rand(0.04, 0.09);
    }
  }
  function schedTick() {
    if (!ctx || !wantMusic || ctx.state !== 'running') return;
    var t = now(), horizon = t + 1.0;
    if (nextChordT < t - 0.5 || nextChordT === 0) {
      nextChordT = t + 0.05; nextPluckT = t + 1.5; nextBirdT = t + rand(3, 7);
    }
    while (nextChordT < horizon) {
      playChord(nextChordT); chordIdx++; nextChordT += CHORD_DUR;
    }
    if (nextPluckT < t) nextPluckT = t + 0.5;
    while (nextPluckT < horizon) {
      var tp = nextPluckT;
      tpPluck(tp);
      nextPluckT += mode === 'menu' ? rand(2.8, 5.5) : rand(1.4, 3.2);
    }
    if (nextBirdT < t) nextBirdT = t + rand(3, 9);
    while (nextBirdT < horizon) {
      playChirp(nextBirdT);
      nextBirdT += rand(3, 9);
    }
  }
  function tpPluck(t) {
    // plucks go through the echo input
    var saved = oneShotBus;
    oneShotBus = pluckIn;
    try { playPluck(t); } finally { oneShotBus = saved; }
  }

  function startMusic() {
    init();
    if (!ctx) return;
    wantMusic = true;
    ensureAmbience();
    if (stopTimer) { clearTimeout(stopTimer); stopTimer = null; }
    musicFade.gain.cancelScheduledValues(now());
    musicFade.gain.setTargetAtTime(1, now(), 0.7);
    if (!schedTimer) schedTimer = setInterval(function () { safe(schedTick)(); }, 200);
    schedTick();
  }
  function stopMusic() {
    wantMusic = false;
    if (!ctx) return;
    musicFade.gain.cancelScheduledValues(now());
    musicFade.gain.setTargetAtTime(0, now(), 0.7);
    if (stopTimer) clearTimeout(stopTimer);
    stopTimer = setTimeout(function () {
      stopTimer = null;
      if (!wantMusic && schedTimer) { clearInterval(schedTimer); schedTimer = null; nextChordT = 0; }
    }, 2600);
  }
  function setMode(m) {
    mode = m === 'play' ? 'play' : 'menu';
    if (!ctx) return;
    glide(revSend.gain, mode === 'menu' ? 0.55 : 0.3, 1.2);
    glide(padFilter.frequency, mode === 'menu' ? 800 : 1100, 1.2);
  }
  function setMusicVolume(v) {
    musicVol = clamp01(v);
    if (ctx) glide(musicVolNode.gain, musicVol * 0.9, 0.05);
  }
  function setSfxVolume(v) {
    sfxVol = clamp01(v);
    if (ctx) glide(sfxVolNode.gain, sfxVol, 0.05);
  }
  function setMuted(m) {
    muted = !!m;
    if (ctx) glide(master.gain, muted ? 0 : 0.8, 0.05);
  }

  // ---------- tool loop ----------
  function makeClicks() {
    var sr = ctx.sampleRate, len = Math.floor(sr * 0.5);
    var b = ctx.createBuffer(1, len, sr), d = b.getChannelData(0);
    var cl = Math.floor(sr * 0.012);
    for (var c = 0; c < 4; c++) {
      var st = Math.floor(c * len / 4), amp = c % 2 ? 0.6 : 1;
      for (var i = 0; i < cl && st + i < len; i++) {
        d[st + i] = (Math.random() * 2 - 1) * amp * Math.exp(-i / (cl * 0.25));
      }
    }
    return b;
  }
  function ensureTool() {
    if (T) return;
    T = {};
    T.eng = gainNode(0); T.eng.connect(toolBus);
    T.lp = biquad('lowpass', 350, 0.7); T.lp.connect(T.eng);
    var types = ['sawtooth', 'sawtooth', 'square'], dets = [-7, 6, 0], lv = [0.5, 0.5, 0.2];
    T.lfo = ctx.createOscillator(); T.lfo.frequency.value = 4.5;
    T.lfoG = gainNode(0.8); T.lfo.connect(T.lfoG);
    T.oscs = [];
    for (var i = 0; i < 3; i++) {
      var o = ctx.createOscillator(), g = gainNode(lv[i]);
      o.type = types[i]; o.detune.value = dets[i]; o.frequency.value = 60;
      o.connect(g); g.connect(T.lp); T.lfoG.connect(o.frequency); o.start();
      T.oscs.push(o);
    }
    T.lfo.start();
    T.nbp = biquad('bandpass', 600, 0.8);
    T.ng = gainNode(0); T.nbp.connect(T.ng); T.ng.connect(toolBus);
    T.nsrc = loopNoise(T.nbp);
    // reel
    T.rsrc = ctx.createBufferSource();
    T.rsrc.buffer = makeClicks(); T.rsrc.loop = true;
    T.rbp = biquad('bandpass', 1300, 0.8); T.rg = gainNode(0);
    T.rsrc.connect(T.rbp); T.rbp.connect(T.rg); T.rg.connect(toolBus);
    T.rsrc.start();
    T.wbp = biquad('bandpass', 1000, 0.9); T.wg = gainNode(0);
    T.wbp.connect(T.wg); T.wg.connect(toolBus);
    T.wsrc = loopNoise(T.wbp);
  }
  function tool(kind, speed, cutting) {
    if (!ctx) return;
    if (!kind || kind === 'scythe') {
      if (!T) return;
      var tn = now();
      T.eng.gain.setTargetAtTime(0, tn, 0.12);
      T.ng.gain.setTargetAtTime(0, tn, 0.1);
      T.rg.gain.setTargetAtTime(0, tn, 0.1);
      T.wg.gain.setTargetAtTime(0, tn, 0.1);
      return;
    }
    ensureTool();
    var s = clamp01(speed), t = now(), cut = !!cutting;
    var eng = 0, nz = 0, rg = 0, wg = 0;
    if (kind === 'gas' || kind === 'ride') {
      var ride = kind === 'ride';
      var base = ride ? 38 + s * 20 : 58 + s * 30;
      var mult = [1, 1.012, 0.5];
      for (var i = 0; i < 3; i++) T.oscs[i].frequency.setTargetAtTime(base * mult[i], t, 0.15);
      T.lp.frequency.setTargetAtTime(ride ? 260 + s * 150 : 320 + s * 180, t, 0.2);
      T.lfo.frequency.setTargetAtTime(ride ? 3.5 + s * 2 : 4.5 + s * 4, t, 0.3);
      eng = ride ? 0.10 + s * 0.07 : 0.07 + s * 0.06;
      if (cut) nz = ride ? 0.07 + s * 0.08 : 0.04 + s * 0.05;
      T.nbp.frequency.setTargetAtTime(ride ? 380 : 600, t, 0.2);
    } else if (kind === 'reel') {
      T.rsrc.playbackRate.setTargetAtTime(0.5 + s * 2.5, t, 0.1);
      rg = 0.004 + s * (cut ? 0.1 : 0.06);
      wg = s * 0.02;
    }
    T.eng.gain.setTargetAtTime(eng, t, 0.12);
    T.ng.gain.setTargetAtTime(nz, t, 0.08);
    T.rg.gain.setTargetAtTime(rg, t, 0.1);
    T.wg.gain.setTargetAtTime(wg, t, 0.1);
  }

  // ---------- SFX ----------
  var SFX = {
    swing: function () {
      var t = now();
      // one soft whoosh: air rising then falling over the swing, plus a faint low body
      noiseShot({ t: t, d: 0.34, a: 0.13, f: 420, f2: 1500, q: 0.9, v: 0.10 });
      noiseShot({ t: t + 0.12, d: 0.22, a: 0.04, f: 1500, f2: 500, q: 0.8, v: 0.06 });
      noiseShot({ t: t, d: 0.30, a: 0.12, f: 180, f2: 320, q: 0.7, v: 0.05 });
    },
    snipswing: function () {
      var t = now();
      noiseShot({ t: t, d: 0.16, a: 0.05, f: 900, f2: 2200, q: 1.4, v: 0.07 });
    },
    snip: function (n) {
      var t = now();
      if (t - lastSnip < 1 / 14) return;
      lastSnip = t;
      n = Math.max(1, +n || 1);
      var ticks = n >= 6 ? 3 : n >= 3 ? 2 : 1;
      var v = 0.04 + Math.min(n, 10) * 0.005;
      for (var i = 0; i < ticks; i++) {
        noiseShot({ t: t + i * 0.03, d: 0.03, a: 0.002, type: 'highpass', f: rand(2800, 4800), q: 0.7, v: v * rand(0.8, 1.1) });
      }
    },
    clang: function () {
      var t = now(), f = rand(380, 460), p = [1, 2.76, 5.4, 8.93], vs = [0.09, 0.05, 0.025, 0.012];
      for (var i = 0; i < p.length; i++) tone({ f: f * p[i], t: t, d: 0.7 - i * 0.12, v: vs[i], a: 0.002 });
      noiseShot({ t: t, d: 0.05, f: 900, q: 0.8, v: 0.08 });
    },
    stall: function () {
      var t = now();
      var o = ctx.createOscillator(), lp = biquad('lowpass', 260, 0.7), g = ctx.createGain();
      o.type = 'sawtooth';
      o.frequency.setValueAtTime(75, t);
      o.frequency.exponentialRampToValueAtTime(30, t + 0.9);
      g.gain.setValueAtTime(0.0001, t);
      var bumps = [0, 0.14, 0.3, 0.5, 0.72];
      for (var i = 0; i < bumps.length; i++) {
        var v = 0.1 * (1 - i * 0.18);
        g.gain.linearRampToValueAtTime(v, t + bumps[i] + 0.03);
        g.gain.linearRampToValueAtTime(0.01, t + bumps[i] + 0.09);
      }
      g.gain.linearRampToValueAtTime(0.0001, t + 1.0);
      o.connect(lp); lp.connect(g); g.connect(oneShotBus);
      o.start(t); o.stop(t + 1.05);
      o.onended = function () { o.disconnect(); lp.disconnect(); g.disconnect(); };
    },
    sputter: function () {
      var t = now(), at = [0, 0.1, 0.19, 0.34];
      for (var i = 0; i < at.length; i++) {
        var o = ctx.createOscillator(), lp = biquad('lowpass', 240, 0.7), g = ctx.createGain();
        var st = t + at[i];
        o.type = 'square'; o.frequency.setValueAtTime(rand(70, 95), st);
        g.gain.setValueAtTime(0.0001, st);
        g.gain.linearRampToValueAtTime(0.07, st + 0.012);
        g.gain.exponentialRampToValueAtTime(0.0001, st + 0.07);
        o.connect(lp); lp.connect(g); g.connect(oneShotBus);
        o.start(st); o.stop(st + 0.1);
        o.onended = (function (a, b, c) { return function () { a.disconnect(); b.disconnect(); c.disconnect(); }; })(o, lp, g);
      }
    },
    refuel: function () {
      var t = now();
      for (var i = 0; i < 4; i++) {
        var f = 260 + i * 40;
        tone({ f: f, f2: f * 2, t: t + i * 0.1, d: 0.08, a: 0.01, v: 0.07 });
      }
      noiseShot({ t: t + 0.5, d: 0.03, a: 0.002, f: 2200, q: 1.5, v: 0.06 });
    },
    coin: function () {
      var t = now();
      bell(988, t, 0.06, 0.6); bell(1319, t + 0.08, 0.06, 0.9);
    },
    cash: function () {
      var t = now(), sc = [79, 83, 84, 86, 88, 91, 93, 95];
      var n = 6 + Math.floor(Math.random() * 3);
      for (var i = 0; i < n; i++) {
        bell(mtof(sc[Math.min(i, sc.length - 1)] + (Math.random() < 0.3 ? -12 : 0)), t + i * 0.07 + rand(0, 0.015), 0.04, 0.5);
      }
    },
    pickup: function () {
      tone({ f: 330, f2: 700, t: now(), d: 0.14, a: 0.01, v: 0.08 });
    },
    gnome: function () {
      var t = now();
      tone({ f: 600, f2: 820, t: t, d: 0.11, a: 0.01, v: 0.07, type: 'triangle', vib: 28 });
      tone({ f: 780, f2: 1150, t: t + 0.12, d: 0.15, a: 0.01, v: 0.07, type: 'triangle', vib: 30 });
    },
    flower: function () {
      var t = now();
      noiseShot({ t: t, d: 0.15, a: 0.01, f: 1000, f2: 500, q: 0.8, v: 0.07 });
      tone({ f: 220, f2: 175, t: t + 0.05, d: 0.5, a: 0.02, v: 0.07, type: 'triangle' });
    },
    click: function () {
      tone({ f: 1000, f2: 800, t: now(), d: 0.04, a: 0.002, v: 0.05, type: 'triangle' });
    },
    buy: function () {
      var t = now();
      noiseShot({ t: t, d: 0.025, a: 0.002, f: 3000, q: 1.5, v: 0.05 });
      var n = [84, 88, 91, 96];
      for (var i = 0; i < n.length; i++) bell(mtof(n[i]), t + 0.04 + i * 0.07, 0.05, 1.1);
    },
    error: function () {
      var t = now();
      tone({ f: 130, f2: 85, t: t, d: 0.16, a: 0.006, v: 0.12 });
      tone({ f: 120, f2: 78, t: t + 0.14, d: 0.2, a: 0.006, v: 0.12 });
    },
    star: function (i) {
      i = Math.max(0, Math.min(4, Math.floor(+i || 0)));
      var f = mtof(72 + PENT[i]), t = now();
      tone({ f: f, t: t, d: 1.0, v: 0.1, a: 0.004 });
      tone({ f: f * 4, t: t, d: 0.15, v: 0.03, a: 0.002 });
      tone({ f: f * 2, t: t, d: 0.5, v: 0.03, a: 0.003 });
    },
    tired: function () {
      noiseShot({ t: now(), d: 0.8, a: 0.25, f: 700, f2: 280, q: 0.9, v: 0.07 });
    },
    fanfare: function () {
      var t = now(), n = [60, 64, 67, 72];
      for (var i = 0; i < n.length; i++) {
        var f = mtof(n[i]), st = t + i * 0.16, last = i === n.length - 1;
        tone({ f: f, t: st, d: last ? 1.8 : 0.7, v: 0.07, a: 0.01, type: 'triangle' });
        tone({ f: f * 2, t: st, d: last ? 1.5 : 0.5, v: 0.025, a: 0.01 });
      }
      var tl = t + 0.48;
      tone({ f: mtof(64), t: tl, d: 1.8, v: 0.04, a: 0.02, type: 'triangle' });
      tone({ f: mtof(67), t: tl, d: 1.8, v: 0.04, a: 0.02, type: 'triangle' });
    }
  };

  // ---------- public ----------
  var API = { _lastError: null };
  function safe(fn) {
    return function () {
      try { return fn.apply(null, arguments); }
      catch (e) { API._lastError = e; }
    };
  }
  function init() {
    if (failed) return;
    try {
      if (!ctx) {
        var AC = W.AudioContext || W.webkitAudioContext;
        if (!AC) { failed = true; return; }
        ctx = new AC();
        buildGraph();
      }
      if (ctx.state === 'suspended' && ctx.resume) {
        var p = ctx.resume();
        if (p && p.catch) p.catch(function () {});
      }
    } catch (e) {
      failed = true; ctx = null; API._lastError = e;
    }
  }
  function sfx(name) {
    return function (a) {
      if (!ctx || ctx.state !== 'running') return;
      SFX[name](a);
    };
  }

  API.init = init;
  API.startMusic = safe(startMusic);
  API.stopMusic = safe(stopMusic);
  API.setMode = safe(setMode);
  API.setMusicVolume = safe(setMusicVolume);
  API.setSfxVolume = safe(setSfxVolume);
  API.setMuted = safe(setMuted);
  API.tool = safe(function (k, s, c) {
    if (ctx && ctx.state !== 'running') return;
    tool(k, s, c);
  });
  API.isReady = function () { return !!ctx && ctx.state === 'running'; };
  Object.keys(SFX).forEach(function (name) { API[name] = safe(sfx(name)); });

  W.MOW.Audio = API;
})();
